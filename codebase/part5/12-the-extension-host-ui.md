---
layout: default
title: "Chapter 12 — The Extension Host UI"
parent: "Part V — The Extension UI"
grand_parent: "Understanding the debug80 Codebase"
nav_order: 1
---
[Part V](README.md) | [The Webview Panels →](13-the-webview-panels.md)

# Chapter 12 — The Extension Host UI

The debug80 sidebar panel is a VS Code WebviewView — an iframe-based panel embedded in the **secondary sidebar** (the right-hand panel). It runs in a separate JavaScript context from the extension and communicates with it entirely through message passing. The extension host side of this boundary is managed by `PlatformViewProvider` in `src/extension/platform-view-provider.ts`.

This chapter covers the provider class: what state it holds, how the webview is created and destroyed, the complete message catalogue in both directions, how message routing is structured, and how the provider wires together the debug adapter, the workspace, and the UI.

---

## The provider class

`PlatformViewProvider` implements `vscode.WebviewViewProvider`. VS Code calls `resolveWebviewView()` once when the sidebar panel first becomes visible. After that, the provider drives the webview by posting messages to it and handling messages it sends back.

```typescript
export class PlatformViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'debug80.platformView';

  private view: vscode.WebviewView | undefined;
  private currentPlatform: PlatformId | undefined;
  private currentSession: vscode.DebugSession | undefined;
  private currentSessionId: string | undefined;
  private uiRevision = 0;
  private selectedWorkspace: vscode.WorkspaceFolder | undefined;
  private hasProject = false;
  private readonly workspaceState: vscode.Memento | undefined;
  private readonly extensionUri: vscode.Uri;
  ...
}
```

### Platform module cache — `loadedModules`

The provider maintains a second parallel map: `loadedModules: Map<string, PlatformUiModules>`. Where `platformStates` holds *runtime data* (hardware state, serial buffer, tab), `loadedModules` holds *behaviour* — the functions that know how to generate HTML, serialize state to update messages, and handle incoming webview messages.

Modules are loaded once via `preloadAllPlatforms()` (called early in the extension lifecycle) and then cached permanently. The loading is parallel: all three platforms' modules are fetched with `Promise.all()`. After loading, `initPlatformState()` is called to create the corresponding `PerPlatformState` entry.

The `getActiveBundle(id)` helper retrieves both maps together, returning `{ modules, state }` or `undefined`. This ensures the two maps stay synchronized — callers never work with state that has no matching modules, or vice versa.

#### The `PlatformUiModules` contract

`PlatformUiModules` in `src/extension/platform-view-manifest.ts` is the interface every platform UI must satisfy:

```typescript
interface PlatformUiModules<TUiState = unknown> {
  getHtml(tab: PanelTab, webview: vscode.Webview, extensionUri: vscode.Uri): string;
  createUiState(): TUiState;
  resetUiState(state: TUiState): void;
  applyUpdate(state: TUiState, payload: unknown): Record<string, unknown>;
  createMemoryViewState(): MemoryViewState;
  handleMessage(message: PlatformViewMessage, context: PlatformUiMessageContext): Promise<void>;
  buildUpdateMessage(state: TUiState, uiRevision: number): Record<string, unknown>;
  buildClearMessage(state: TUiState, uiRevision: number): Record<string, unknown>;
  snapshotCommand: 'debug80/tec1MemorySnapshot' | 'debug80/tec1gMemorySnapshot';
}
```

| Method | Role |
|--------|------|
| `getHtml` | Build the webview HTML for a given initial tab and webview context |
| `createUiState` | Allocate a blank `TUiState` (called once per platform on module load) |
| `resetUiState` | Zero out UI state on session end (called by `clear()`) |
| `applyUpdate` | Merge an incoming hardware update payload into `TUiState`; return the serialized message fields |
| `createMemoryViewState` | Create a fresh `MemoryViewState` for the memory inspector |
| `handleMessage` | Dispatch a platform-specific webview message (e.g. `key`, `matrixKey`, `refresh`) |
| `buildUpdateMessage` | Serialize the current `TUiState` into a full `update` message (used for rehydration) |
| `buildClearMessage` | Serialize a zeroed `TUiState` into a clear `update` message (session ended) |
| `snapshotCommand` | The DAP custom request name to use when fetching a memory snapshot |

Each platform wires its modules through a `PlatformUiEntry` factory (`createTec1PlatformUiEntry()`, etc.) in `src/extension/platform-ui-entries.ts`. The factory's `loadUiModules()` function uses dynamic `import()` to pull in the platform's HTML, memory, message-handling, and state modules, then composes them into a single `PlatformUiModules` object.

### Parallel state trees

The provider maintains a `platformStates: Map<string, PerPlatformState>` with an entry for every registered platform (Simple, TEC-1, TEC-1G). All three are held in memory simultaneously. Each entry holds:

- `uiState` — platform-specific hardware state (digits, matrix rows, LCD buffer, speaker, etc.; empty for Simple)
- `serialBuffer` — accumulated serial / terminal output text (max 8 000 characters)
- `memoryViews` — which memory regions are shown in the memory inspector
- `activeTab` — which tab (`'ui'` or `'memory'`) was last active
- `refreshController` — memory snapshot polling machinery

Only one platform is active at a time (`currentPlatform`), but all other platforms' state is preserved. If the user switches from TEC-1 to TEC-1G and back, the TEC-1 state rehydrates without a round trip to the adapter.

### The `uiRevision` counter

Every `update` message from the extension host carries a `uiRevision` number. The webview tracks the last revision it applied and ignores any message with a lower number. This prevents a race condition where a slow-arriving update from a previous session overwrites a fresh update from the current one.

The counter only ever increases. `nextUiRevision()` increments `uiRevision` and returns the new value; it is called each time a state-bearing message is sent. The counter is **never reset** — not even when `renderCurrentView()` is called. When `renderCurrentView()` sets new HTML on the webview, the webview's own JavaScript state (including its local `uiRevision` tracking) resets to zero because the webview frame is destroyed and recreated. The extension host counter continues to increase from wherever it was, so the first `update` message sent after a render will have a revision number higher than zero and the freshly initialised webview will accept it.

---

## HTML generation

The webview's HTML is built from a template in `src/platforms/panel-html.ts`. `buildPanelHtml()` reads the platform's `index.html` template from the built webview directory, resolves URI references for scripts and stylesheets, generates a CSP nonce, and replaces template tokens:

| Token | Replaced with |
|-------|--------------|
| `{{cspSource}}` | `webview.cspSource` — the allowed content source |
| `{{nonce}}` | Random nonce for inline script/style |
| `{{styleUri}}` | Platform-specific `styles.css` URI |
| `{{commonStyleUri}}` | Shared `webview/common/styles.css` URI |
| `{{scriptUri}}` | Compiled `index.js` URI |
| `{{activeTab}}` | `'ui'` or `'memory'` — which tab opens first |

The HTML is set on `webviewView.webview.html`. Setting this property destroys the existing webview content and starts fresh — all JavaScript state in the webview is lost. This happens on every platform switch and every time the sidebar is revealed after being hidden.

Webview resources are restricted to `out/webview/` via `localResourceRoots`. No other paths are accessible.

---

## `resolveWebviewView()`

This is the provider's main lifecycle method. VS Code calls it once, providing the `WebviewView` object. The method:

1. Stores the view reference.
2. Configures the webview options (scripts enabled, resource roots).
3. Registers the message handler.
4. Registers visibility and disposal handlers.
5. Calls `renderCurrentView(false)` to populate the initial HTML and state.

### Visibility handler

When the sidebar becomes hidden, the memory refresh polling stops. When it becomes visible again, `renderCurrentView(true)` runs — the HTML is rebuilt, state is reposted, and memory polling restarts if the memory tab is active.

This means every show/hide cycle regenerates the webview HTML. The buffered state (serial text, UI state) is reposted from the provider's in-memory copies, so the user sees a consistent panel despite the HTML being recreated.

---

## `renderCurrentView()`

This is the method that actually populates the panel. It runs on every platform switch and every sidebar reveal:

```
1. Set webview.html to platform HTML (destroys old webview)
2. Post projectStatus (workspace roots, targets, selected target, active platform)
3. Post sessionStatus (running/paused/not running)
4. Post full update snapshot (hardware state for TEC-1/TEC-1G; empty for Simple)
5. If TEC-1G and uiVisibility override is set, post uiVisibility
6. Post serialInit (full buffered serial/terminal text, if any)
7. Post selectTab (active tab)
8. Sync memory refresh (start polling if on memory tab)
```

When no platform is set yet (before the first debug session), the provider renders the TEC-1G webview as a default. This ensures the panel shows something meaningful even before the first launch.

---

## Message routing

Inbound messages from the webview are typed as `PlatformViewInboundMessage` — a union defined in `src/contracts/platform-view.ts`. The raw message is immediately handed to `handlePlatformViewMessage()` in `src/extension/platform-view-messages.ts`, which is responsible for all routing decisions.

### `platform-view-messages.ts`

`handlePlatformViewMessage()` receives the message and a dependency object (`PlatformViewMessageDependencies`) that provides callback functions for each action. It dispatches on `msg.type`:

- Project and session commands (`createProject`, `selectProject`, `openWorkspaceFolder`, `configureProject`, `selectTarget`, `restartDebug`, `setEntrySource`, `startDebug`) are forwarded to the corresponding callback, which invokes a VS Code command. The `createProject` path passes an optional `platform` string extracted from the message to `debug80.createProject`, where it pre-filters the project-kit picker.
- Serial commands (`serialSendFile`, `serialSave`) are forwarded to their callbacks.
- `serialClear` calls `clearSerialBuffer` for the current platform.
- Any unrecognised type falls through to `handlePlatformMessage`, which dispatches to the platform-specific adapter.

This function contains no provider state — it is a pure routing layer, which makes it independently testable.

### Serial actions — `platform-view-serial-actions.ts`

`handlePlatformSerialSendFile()` and `handlePlatformSerialSave()` in `src/extension/platform-view-serial-actions.ts` handle the two serial file workflows:

- `handlePlatformSerialSendFile()` opens a file picker, reads the file, and sends each character individually as a `debug80/tec1SerialInput` or `debug80/tec1gSerialInput` custom request (2 ms between characters, 10 ms between lines, CR appended at each line end). A cancellable progress notification shows during the transfer.
- `handlePlatformSerialSave()` opens a save dialog and writes the buffered serial text to a file. If the contents look like Intel HEX (all lines start with `:`), the default filter offers `.hex`.

### Platform module dispatch

Platform-specific messages (hardware input, memory inspector, tab changes) are routed through the `PlatformUiModules` object retrieved from `loadedModules`. Calling `modules.handleMessage(msg, context)` delegates to the platform's own message handler, which translates webview messages into debug adapter custom requests. There is no platform-specific branching in `platform-view-messages.ts` itself — all platform variation lives behind the `PlatformUiModules` interface.

---

## Messages: extension host → webview

All messages are posted via `postMessage()`. The webview handles them in `window.addEventListener('message', ...)`.

| Type | Key fields | When sent |
|------|-----------|-----------|
| `update` | `uiRevision`, platform-specific hardware fields (empty object for Simple) | Platform hardware state changes |
| `serial` | `text: string` | Incremental serial/terminal data |
| `serialInit` | `text: string` | Full serial/terminal buffer on rehydration |
| `serialClear` | — | Clear the serial/terminal display |
| `projectStatus` | `roots[]`, `targets[]`, `rootName?`, `rootPath?`, `hasProject?`, `targetName?`, `entrySource?`, `platform?` | Workspace or project state changes |
| `sessionStatus` | `status: 'starting' \| 'running' \| 'paused' \| 'not running'` | Debug session state changes |
| `selectTab` | `tab: 'ui' \| 'memory'` | Tab should be selected |
| `snapshot` | Register and memory dump | Memory inspector refresh completes |
| `snapshotError` | `message?: string` | Memory snapshot request failed |
| `uiVisibility` | `visibility: Record<string, boolean>`, `persist: boolean` | TEC-1G section visibility changes |

The TEC-1G `update` message carries additional fields not present in TEC-1:

```typescript
{
  type: 'update',
  uiRevision: number,
  digits: number[],
  // RGB matrix — three colour planes
  matrix: number[],           // red plane rows
  matrixGreen?: number[],
  matrixBlue?: number[],
  matrixBrightnessR?: number[],  // per-pixel brightness (64 entries)
  matrixBrightnessG?: number[],
  matrixBrightnessB?: number[],
  matrixMode?: boolean,
  // GLCD
  glcd: number[],             // 1024-byte GDRAM
  glcdDdram?: number[],
  glcdState?: { displayOn, graphicsOn, cursorOn, ... },
  // Text LCD
  lcd: number[],
  lcdState?: { displayOn, cursorOn, cursorAddr, ... },
  lcdCgram?: number[],
  // System
  speaker: number,
  speedMode: 'fast' | 'slow',
  sysCtrl?: number,
  bankA14?: boolean,
  capsLock?: boolean,
  speakerHz?: number
}
```

---

## Messages: webview → extension host

These arrive in `onDidReceiveMessage` and are dispatched as described above.

| Type | Key fields | Handler |
|------|-----------|---------|
| `startDebug` | — | Execute start debug command |
| `createProject` | `rootPath`, `platform?` | Execute create project command; optional `platform` pre-selects kit filter |
| `openWorkspaceFolder` | — | Execute open folder command |
| `selectProject` | `rootPath` | Execute workspace selection |
| `configureProject` | — | No-op (config is now done via project header controls) |
| `saveProjectConfig` | `platform: string` | Write `projectPlatform` + per-target `platform` to `debug80.json`, then restart debug |
| `selectTarget` | `rootPath`, `targetName` | Execute target selection |
| `restartDebug` | — | Execute restart debug command |
| `setEntrySource` | — | Execute set entry source command |
| `serialSendFile` | — | File picker → character-by-character send (TEC-1/TEC-1G) |
| `serialSave` | `text` | Save dialog → write file |
| `serialClear` | — | Clear serial/terminal buffer |
| `key` | `code: number` | Platform adapter → adapter custom request |
| `reset` | — | Platform adapter → adapter custom request |
| `speed` | `mode` | Platform adapter → adapter custom request |
| `tab` | `tab` | Update active tab; start/stop memory polling |
| `refresh` | memory params | Platform adapter → fetch memory snapshot |
| `registerEdit` | `register`, `value` | Platform adapter → adapter custom request |
| `memoryEdit` | `address`, `value` | Platform adapter → adapter custom request |
| `matrixKey` | `key`, `pressed`, modifiers | TEC-1G only; platform adapter |
| `matrixMode` | `enabled` | TEC-1G only; platform adapter |

---

## Platform message routing

When a platform-specific message arrives, `resolvePlatformAdapter()` returns the appropriate adapter and `adapter.handleMessage()` delegates to `handleTec1Message()` or `handleTec1gMessage()`. These functions translate webview messages into debug adapter custom requests:

| Webview message | Adapter custom request |
|----------------|----------------------|
| `key` (TEC-1) | `debug80/tec1Key` |
| `reset` (TEC-1) | `debug80/tec1Reset` |
| `speed` (TEC-1) | `debug80/tec1Speed` |
| `refresh` (TEC-1) | `debug80/tec1MemorySnapshot` |
| `registerEdit` | `debug80/registerWrite` |
| `memoryEdit` | `debug80/memoryWrite` |
| `key` (TEC-1G) | `debug80/tec1gKey` |
| `matrixKey` (TEC-1G) | `debug80/tec1gMatrixKey` |
| `matrixMode` (TEC-1G) | `debug80/tec1gMatrixMode` |
| `reset` (TEC-1G) | `debug80/tec1gReset` |
| `speed` (TEC-1G) | `debug80/tec1gSpeed` |
| `refresh` (TEC-1G) | `debug80/tec1gMemorySnapshot` |

All adapter requests go through `session.customRequest()` on the current `vscode.DebugSession`.

---

## Shared message contract — `src/contracts/platform-view.ts`

The types shared between the extension host and webview are defined in `src/contracts/platform-view.ts`:

- **`PlatformId`** — `'simple' | 'tec1' | 'tec1g'`; the canonical platform identifier used throughout the extension and webview.
- **`ProjectStatusPayload`** — the shape of the `projectStatus` message body, including `roots`, `targets`, and the optional `rootName`, `rootPath`, `hasProject`, `targetName`, `entrySource`, and `platform` fields. The `platform` field carries the current platform ID (`'simple'`, `'tec1'`, or `'tec1g'`) so the webview can pre-select the Platform dropdown on load.
- **`PlatformViewControlMessage`** — a discriminated union of all project/session/serial control messages (`startDebug`, `createProject`, `openWorkspaceFolder`, `selectProject`, `configureProject`, `saveProjectConfig`, `selectTarget`, `setEntrySource`, `serialSendFile`, `serialSave`, `serialClear`). The `saveProjectConfig` message carries `{ platform: string }` and triggers a config write + debug restart. The `createProject` message now carries an optional `platform?: string` field that, when present, restricts the kit quick-pick to kits for that platform.
- **`PlatformViewInboundMessage`** — the full union of all messages the extension host can receive: `PlatformViewControlMessage | Tec1Message | Tec1gMessage | { type?: string; [key: string]: unknown }`.

This file is the authoritative definition of the message boundary. Platform-view-messages.ts imports `PlatformViewInboundMessage` directly from it.

---

## Platform registration model — `src/extension/platform-extension-model.ts`

`registerExtensionPlatform()` in `src/extension/platform-extension-model.ts` is the unified API for registering a platform with both the runtime provider registry and the extension UI:

```typescript
interface ExtensionPlatformEntry {
  runtime: PlatformManifestEntry;
  ui?: PlatformUiEntry;
}

function registerExtensionPlatform(entry: ExtensionPlatformEntry): void;
```

A single call registers the platform's runtime (via `registerPlatform()` in `src/platforms/provider.ts`) and, if a `ui` entry is provided, its sidebar UI (via `registerPlatformUi()` in `platform-view-manifest.ts`). `listExtensionPlatforms()` returns the unified list in runtime-manifest order, merging any UI entries that are present. `registerRuntimePlatform()` is a compatibility alias for registering runtime-only platforms using the existing public surface.

---

## Memory refresh

The memory inspector polls the adapter for live register and memory snapshots while the session is paused. The refresh controller (`tec1RefreshController`, `tec1gRefreshController`) manages this polling:

- Start polling when the memory tab becomes active.
- Stop polling when the panel is hidden or the tab switches away.
- Poll at 150 ms intervals.
- On each poll, call `session.customRequest('debug80/tec1MemorySnapshot', snapshotPayload)` and post the result as a `snapshot` message.

The snapshot payload describes which memory regions and views are currently displayed. The adapter reads those regions from the Z80 memory array and returns them in a single response.

---

## Project status

`getProjectStatusPayload()` assembles the project header data. It queries:

- `vscode.workspace.workspaceFolders` — all open workspace roots
- `findProjectConfigPath(folder)` — whether each root has a `debug80.json`
- `resolveProjectStatusSummary()` — the selected target and entry source from workspace state
- `listProjectTargetChoices()` — the target names available in the config file
- `resolveProjectPlatform(config)` — the active platform ID from `projectPlatform` or per-target `platform`

This payload is posted as a `projectStatus` message. The webview renders it as a compact project header with three controls:

- A **Project button** showing the current workspace root name — clicking it sends `selectProject`.
- A **Target dropdown** populated from `targets[]` — changing it sends `selectTarget`.
- A **Platform dropdown** with options Simple / TEC-1 / TEC-1G — value set from `payload.platform`; changing it sends `saveProjectConfig` with `{ platform: string }`.

Below the project header, a **setup card** may appear when the workspace is not fully configured:

- No workspace roots → shows "Select a workspace root to get started." with an Open Folder button.
- Workspace available but no `debug80.json` → shows a prompt with a Create Project button.
- Project exists with at least one target → setup card is **hidden entirely**. There is no "configured" or "ready" state shown in the card.

The setup card is part of each platform's webview HTML; it is hidden or shown by the webview based on the `projectStatus` payload it receives.

---

## Project scaffolding and project kits

When `debug80.createProject` runs for a new workspace, it calls `scaffoldProject()` in `src/extension/project-scaffolding.ts`. The core abstraction that replaced the old ad-hoc platform field is the **project kit** (`src/extension/project-kits.ts`).

### `ProjectKit`

A `ProjectKit` is an immutable descriptor for one platform/profile combination:

```typescript
type ProjectKit = {
  id: ProjectKitId;                // e.g. 'tec1/mon1b'
  platform: ScaffoldPlatform;      // 'simple' | 'tec1' | 'tec1g'
  profileName: string;             // profile key written into debug80.json
  label: string;                   // shown in the quick-pick
  description: string;
  appStart: number;
  entry: number;
  starterTemplates: Record<StarterLanguage, string>;  // relative template paths
  bundledProfile?: {
    bundleId: string;              // matches BUNDLED_*_REL constant
    romPath: string;               // workspace-relative ROM destination
    listingPath?: string;
    sourceRoots: string[];
  };
};
```

The four built-in kits are:

| Kit ID | Platform | Profile | Monitor |
|--------|----------|---------|---------|
| `simple/default` | `simple` | `default` | none |
| `tec1/classic-2k` | `tec1` | `classic-2k` | none |
| `tec1/mon1b` | `tec1` | `mon1b` | MON-1B (bundled) |
| `tec1g/mon3` | `tec1g` | `mon3` | MON3 (bundled) |

### Kit selection — `chooseProjectKit()`

`chooseProjectKit(preselectedPlatform?)` calls `getProjectKitChoices()`, which calls `listProjectKits()`. If a platform string is passed in and matches a known platform exactly (`simple`, `tec1`, `tec1g`), only kits for that platform are returned. If only one kit matches, the picker is skipped and that kit is returned immediately. Otherwise a `showQuickPick()` prompt lists all matching kits.

The `preselectedPlatform` value flows from the `platform?` field on the `createProject` webview message, through `handleCreateProject` in `platform-view-messages.ts`, through the `debug80.createProject` command args, and finally into `scaffoldProject()`.

### `buildScaffoldPlan()` — interactive plan construction

After kit selection, `buildScaffoldPlan()` collects the remaining inputs:

1. A target name (input box, default `'app'`).
2. A source file choice: an existing `.asm`/`.zax` file from the workspace, or a new ASM/ZAX starter file.

The result is a `ScaffoldPlan` — `{ kit, targetName, sourceFile, outputDir, artifactBase, starterLanguage?, starterFile? }`.

### `createDefaultProjectConfig()` — writing `debug80.json`

`createDefaultProjectConfig(plan)` assembles the `debug80.json` structure from the plan:

- A `profiles` section with one entry (`plan.kit.profileName`) containing the platform, description, and — if the kit has a `bundledProfile` — a `bundledAssets` map with `romHex` and optionally `listing` entries (each a `BundledAssetReference`).
- A `targets` section with one entry (`plan.targetName`) containing `sourceFile`, `outputDir`, `artifactBase`, `platform`, `profile`, and the platform-specific memory map block (`simple`, `tec1`, or `tec1g`). For kits with a `bundledProfile`, the target block also includes `romHex`, optional `extraListings`, and `sourceRoots`.
- Top-level `projectVersion`, `projectPlatform`, `defaultProfile`, and `defaultTarget` fields.

Bundled ROM files are **not copied during scaffolding**. They are written to the workspace the first time the project is launched, via `materializeBundledAsset()` resolving the `BundledAssetReference` entries.

### Starter templates

If the user chose to create a starter source file, `createStarterSourceContent()` reads the template from `resources/project-kits/<kit.starterTemplates[language]>` via `readProjectKitStarterTemplate()`. The file is written to the workspace before `debug80.json` is created. If the file already exists, it is not overwritten.

---

## Summary

- `PlatformViewProvider` is the single point of contact between the debug adapter and the webview. It holds all hardware display state and serial/terminal buffers in memory on the extension host side for all three platforms simultaneously.

- The Debug80 panel is registered in the **secondary sidebar** (`viewsContainers.secondarySideBar` in `package.json`), not the Activity Bar. The `debug80.openDebug80View` command programmatically reveals it.

- The webview HTML is regenerated on every platform switch and sidebar reveal. Buffered state is reposted from in-memory copies, making the panel self-restoring.

- The `uiRevision` counter only ever increments — it is never reset, not even when the webview HTML is replaced. The webview's own counter resets when new HTML is set; the host counter does not.

- Message routing is handled by `handlePlatformViewMessage()` in `platform-view-messages.ts`. Serial file workflows are in `platform-view-serial-actions.ts`. Platform-specific dispatch calls `modules.handleMessage()` via the `PlatformUiModules` interface — no platform branching in the routing layer.

- The `createProject` webview message now carries an optional `platform?` field. It flows through `platform-view-messages.ts` into the `debug80.createProject` command and then into `scaffoldProject()`, where it pre-filters the project-kit picker.

- The provider holds two parallel maps: `platformStates` (hardware state, serial buffer, tab) and `loadedModules` (behaviour — HTML generation, state serialization, message handling). Modules are loaded once at startup via `preloadAllPlatforms()` and cached permanently. `PlatformUiModules` in `platform-view-manifest.ts` is the interface every platform UI must satisfy.

- The shared message contract is defined in `src/contracts/platform-view.ts`: `PlatformId`, `ProjectStatusPayload` (includes `platform?`), `PlatformViewControlMessage` (includes `saveProjectConfig` and `createProject` with optional `platform?`), and `PlatformViewInboundMessage`.

- `registerExtensionPlatform()` in `platform-extension-model.ts` is the unified API for registering both the runtime and UI concerns of a platform in a single call.

- The memory refresh controller polls the adapter at 150 ms intervals when the memory tab is active and the panel is visible. Polling stops automatically on tab switch or panel hide.

- Project status is assembled from workspace folders, `debug80.json` discovery, workspace-persisted target selection, and the active platform ID. It drives the project header (Project button, Target dropdown, Platform dropdown) that appears on all platform panels.

- The setup card (shown when no project is configured) is hidden entirely once a project exists. There is no intermediate "configured" state — the project header controls are always sufficient.

- Project scaffolding is driven by **project kits** (`src/extension/project-kits.ts`). A kit packages the platform, profile name, memory-map defaults, starter templates, and optional bundled ROM references into a single descriptor. `buildScaffoldPlan()` selects a kit interactively; `createDefaultProjectConfig()` writes `profiles` and `targets` from it. Bundled ROM files are not copied at scaffold time — they are materialized at first launch.

---

[Part V](README.md) | [The Webview Panels →](13-the-webview-panels.md)
