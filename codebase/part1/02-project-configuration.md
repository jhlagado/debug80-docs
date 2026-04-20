---
layout: default
title: "Chapter 2 — Project Configuration"
parent: "Part I — Orientation"
grand_parent: "Understanding the debug80 Codebase"
nav_order: 2
---
[← What Debug80 Is](01-what-debug80-is.md) | [Part I](README.md) | [Part II →](../part2/README.md)

# Chapter 2 — The Project Configuration System

A debug80 project is defined by a JSON configuration file that tells the extension what to build, what platform to target, where to find source files and ROM images, and how to lay out memory. This chapter explains every part of that system: the config file format, how targets work, how multiple configuration sources are merged, and how the scaffolding flow creates a new project from scratch.

If you are going to work on any part of debug80 that touches launching, target selection, or platform setup, you need to understand this chapter. The configuration system is the spine — every debug session begins by resolving a config into a fully populated set of launch arguments.

---

## Where the config file lives

Debug80 looks for a project configuration file in three locations, checked in this order:

1. `debug80.json`
2. `.vscode/debug80.json`
3. `.debug80.json`

The first file found wins. The search starts from the workspace folder root. If none of these files exist, the project has no debug80 configuration and the extension treats it as unconfigured — no targets appear in the selector, and launching a debug session requires either creating a project or providing explicit launch arguments.

The discovery logic lives in `findProjectConfigPath()` in `src/extension/project-config.ts`. It takes a `WorkspaceFolder` and returns the absolute path to the first matching config file, or `undefined`.

The current preference for `debug80.json` at the workspace root is deliberate. It makes the project marker visible at the top level of the repo instead of hiding it under `.vscode/`.

---

## The ProjectConfig type

The config file is parsed into a `ProjectConfig` object, defined in `src/debug/types.ts`. The current model is a **versioned manifest** with backwards-compatible support for older root-level fields.

```typescript
interface ProjectConfig {
  projectVersion?: 1 | 2;
  projectPlatform?: string;
  profiles?: Record<string, ProjectProfileConfig>;
  bundledAssets?: Record<string, BundledAssetReference>;
  defaultProfile?: string;

  defaultTarget?: string;
  target?: string;
  targets?: Record<
    string,
    Partial<LaunchRequestArguments> & { source?: string; profile?: string }
  >;

  // Legacy / root-level defaults still supported
  asm?: string;
  sourceFile?: string;
  source?: string;
  assembler?: string;
  hex?: string;
  listing?: string;
  outputDir?: string;
  artifactBase?: string;
  entry?: number;
  stopOnEntry?: boolean;
  platform?: string;
  assemble?: boolean;
  sourceRoots?: string[];
  stepOverMaxInstructions?: number;
  stepOutMaxInstructions?: number;
  terminal?: TerminalConfig;
  simple?: SimplePlatformConfig;
  tec1?: Tec1PlatformConfig;
  tec1g?: Tec1gPlatformConfig;
}
```

### Version 2 manifests

The current scaffolding path writes a **version 2** manifest. The important additions are:

- `projectVersion: 2` marks the manifest as using the newer model
- `projectPlatform` records the project's baseline platform identity
- `profiles` define reusable platform-and-bundle baselines
- `defaultProfile` selects the profile used when a target does not override it
- `bundledAssets` and profile-level `bundledAssets` can point at extension-shipped ROM/listing/source bundles

In practice, the v2 manifest lets the scaffolder create monitor-first projects without hard-coding absolute paths into the starter config. Instead, the config can describe a bundled asset reference and the extension can materialize the real files into the workspace when needed.

### Bundled assets

`BundledAssetReference` is a small indirection object:

```typescript
interface BundledAssetReference {
  bundleId: string;   // e.g. 'tec1/mon1b/v1' or 'tec1g/mon3/v1'
  path: string;       // file path inside the bundle
  destination?: string; // optional workspace-relative destination override
}
```

Bundled assets are used mainly for monitor ROMs, listings, and ROM source files. The current project kits use them to seed:

- `TEC-1 / MON-1B`
- `TEC-1G / MON-3`

The materialization path lives in `src/extension/bundle-materialize.ts`. Bundles are verified against `bundle.json` manifests and copied into workspace-relative destinations such as `roms/tec1/...` or `roms/tec1g/...`.

### Project kits

Scaffolding is no longer just "pick a platform and write a bare JSON file". The extension now has explicit **project kits** in `src/extension/project-kits.ts`. A kit defines:

- the platform
- the profile name
- the default app start address
- starter templates for ASM and ZAX
- any bundled monitor assets that should be associated with the project

`src/extension/project-scaffolding.ts` builds the initial `debug80.json` from a `ScaffoldPlan`, writes starter source files, and can materialize bundled ROM assets at project creation time.

---

## Targets

A target is a named build-and-debug configuration. A project can define multiple targets — one for each program, test case, or hardware configuration you want to debug. Each target is an entry in the `targets` object, keyed by name.

A typical multi-target config:

```json
{
  "defaultTarget": "matrix",
  "targets": {
    "matrix": {
      "sourceFile": "src/matrix.zax",
      "assembler": "zax",
      "platform": "tec1g"
    },
    "hello": {
      "sourceFile": "src/hello.asm",
      "platform": "tec1g"
    },
    "test-serial": {
      "sourceFile": "src/test-serial.zax",
      "assembler": "zax",
      "platform": "tec1g"
    }
  },
  "tec1g": {
    "romHex": "roms/mon-3.hex",
    "appStart": 8192
  }
}
```

In this example, all three targets share the same `tec1g` block at the root — the ROM image and application start address are inherited. Each target specifies its own source file and assembler. The `matrix` target is the default.

In the v2 manifest, a target can also point at a named profile:

```json
{
  "defaultProfile": "mon3",
  "targets": {
    "matrix": {
      "profile": "mon3",
      "sourceFile": "src/matrix.zax",
      "assembler": "zax"
    }
  }
}
```

That arrangement lets the target inherit bundled ROM assets and baseline platform identity from the profile while still overriding source/build details at the target layer.

### Target selection priority

When a debug session launches, the system must decide which target to use. The resolution order is:

1. Explicit `target` passed in the launch arguments (e.g., from the webview selector)
2. The config's `target` field
3. The config's `defaultTarget` field
4. The first target alphabetically (if exactly one exists, it is used without prompting)

This logic lives in `populateFromConfig()` in `src/debug/launch-args.ts`.

### Remembering the selected target

When a user selects a target — either through the panel selector or a command flow that resolves a target explicitly — the selection is stored in VS Code's workspace state under the key:

```
debug80.selectedTarget:{projectConfigPath}
```

The key includes the config file path, so different projects in a multi-root workspace each remember their own target independently. On the next launch, the stored target is preferred over the config's `defaultTarget`, unless it no longer exists in the config.

The persistence logic lives in `ProjectTargetSelectionController` in `src/extension/project-target-selection.ts`.

---

## Field aliases

Several fields have aliases — different names for the same value. This exists because the config format evolved and because different contexts use different naming conventions:

| Canonical field | Aliases | Notes |
|-----------------|---------|-------|
| `asm` | `sourceFile`, `source` | The assembly source file path |
| `defaultTarget` | `target` | Which target to use by default |

During resolution, all aliases are checked in a defined order. The first non-undefined value wins. If you are writing code that reads these fields, always use the resolution helpers in `launch-args.ts` rather than reading fields directly — they handle the alias chain correctly.

One practical example is `stopOnEntry`: the panel-level toggle is **not** written back into `debug80.json`, but target/root-level config values still merge through the launch pipeline. `resolveStopOnEntryForTarget()` in `src/extension/project-config.ts` mirrors the launch merge so the panel can show the effective project-level value without pretending it is persisted UI state.

---

## The merge pipeline

A debug session's final configuration is not read from a single source. It is assembled from up to four layers, merged in priority order:

```
Runtime launch arguments  (highest priority)
    ▼
Target-specific config    (from targets[name])
    ▼
Root config               (from debug80.json root)
    ▼
Platform defaults          (lowest priority)
```

Each layer is optional. Missing layers are skipped. For simple scalar fields (strings, numbers, booleans), the first non-undefined value in priority order wins. This merge happens in `populateFromConfig()`.

### Platform block merging

Platform configuration blocks (`simple`, `tec1`, `tec1g`) receive special treatment. They are **shallow-merged**, not replaced. This means a target can override specific fields within a platform block without losing other fields defined at the root level.

Consider:

```json
{
  "tec1g": {
    "romHex": "roms/mon-3.hex",
    "appStart": 8192,
    "entry": 0
  },
  "targets": {
    "app": {
      "sourceFile": "src/app.zax",
      "tec1g": {
        "appStart": 16384
      }
    }
  }
}
```

The `app` target's effective `tec1g` block is:

```json
{
  "romHex": "roms/mon-3.hex",
  "appStart": 16384,
  "entry": 0
}
```

The target overrode `appStart` but inherited `romHex` and `entry` from the root. If the blocks were replaced instead of merged, the target would lose the ROM path — a subtle and frustrating bug. The merge function `mergeNestedPlatformBlock()` in `launch-args.ts` handles this with `Object.assign()` over three layers (root, target, runtime).

### TEC-1G ROM inheritance

There is one additional subtlety for TEC-1G configurations. The MON-3 ROM path (`romHex`) is often defined in only one place — either at the root `tec1g` block or in a single target's `tec1g` block. Other targets that also use TEC-1G might define partial overrides (just `appStart`, for example) and expect to inherit the ROM.

The function `resolveTec1gBaseForMerge()` handles this:

1. If the root `tec1g.romHex` exists and is non-empty — use the root block as the base
2. Otherwise, find the first target (alphabetically) that defines a non-empty `romHex`
3. Use that target's `tec1g` block as the base, then apply root-level overrides on top

This ensures that `romHex` propagates across targets even when it is not defined at the root level.

---

## The LaunchRequestArguments type

After the merge pipeline runs, the result is a fully populated `LaunchRequestArguments` object — the type that the debug adapter actually uses. It has the same fields as `ProjectConfig` plus a few runtime-only additions:

```typescript
interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  // All ProjectConfig fields, plus:
  projectConfig?: string;    // Path to the config file that was resolved
  diagnostics?: boolean;     // Enable verbose debug console output
}
```

The adapter never reads `ProjectConfig` directly. It only sees `LaunchRequestArguments`, which has already been through the full merge pipeline. If you are working on the adapter side, `LaunchRequestArguments` is your entry point — you never need to care about where a value came from.

---

## Platform configuration in detail

Each platform has its own configuration block type. These blocks define how the emulated hardware is set up — memory layout, ROM images, peripheral options, and timing controls.

### SimplePlatformConfig

The minimal platform. No hardware emulation beyond optional terminal I/O.

```typescript
interface SimplePlatformConfig {
  regions?: SimpleMemoryRegion[];   // ROM/RAM layout
  appStart?: number;                // Where user code typically begins
  entry?: number;                   // Execution entry point
  binFrom?: number;                 // Binary export range (optional)
  binTo?: number;
  extraListings?: string[];         // Additional listing files for symbols
}

interface SimpleMemoryRegion {
  start: number;
  end: number;
  kind?: 'rom' | 'ram' | 'unknown';
  readOnly?: boolean;
}
```

Memory regions define which address ranges are ROM (read-only) and which are RAM (read-write). The Z80 memory model is a flat 64K array — regions tell the emulator which writes to accept and which to reject.

### Tec1PlatformConfig

Extends the simple platform with TEC-1 hardware.

```typescript
interface Tec1PlatformConfig {
  // Inherited from simple
  regions?: SimpleMemoryRegion[];
  appStart?: number;
  entry?: number;
  extraListings?: string[];

  // TEC-1 specific
  romHex?: string;          // Path to monitor ROM image
  ramInitHex?: string;      // Initial RAM contents (optional)
  updateMs?: number;        // UI refresh interval (default: 16ms)
  yieldMs?: number;         // Cooperative yield interval
}
```

The `romHex` field is critical — it points to the monitor ROM (e.g., MON-1B, MON-2) that provides the TEC-1's built-in routines. Without it, the emulated TEC-1 has no firmware.

### Tec1gPlatformConfig

The TEC-1G adds a substantial amount of hardware.

```typescript
interface Tec1gPlatformConfig extends Tec1PlatformConfig {
  // Cartridge and storage
  cartridgeHex?: string;        // Expansion cartridge ROM

  // Memory banking
  expansionBankHi?: boolean;    // A14 bank select mode
  protectOnReset?: boolean;     // Write-protect banked memory on reset

  // Hardware features
  gimpSignal?: boolean;         // GIMP signal support
  matrixMode?: boolean;         // Matrix keyboard mode

  // Peripherals
  rtcEnabled?: boolean;         // DS1302 real-time clock
  sdEnabled?: boolean;          // SD card emulation
  sdImagePath?: string;         // Path to SD card image file
  sdHighCapacity?: boolean;     // SDHC mode

  // UI visibility (which sections to show in the panel)
  uiVisibility?: {
    lcd?: boolean;
    display?: boolean;
    keypad?: boolean;
    matrix?: boolean;
    matrixKeyboard?: boolean;
    glcd?: boolean;
    serial?: boolean;
  };
}
```

The `uiVisibility` field controls which hardware sections appear in the webview panel. This is a convenience — not all programs use all peripherals, and hiding unused sections keeps the UI clean.

---

## Project scaffolding

When a user creates a new project, the scaffolding system generates the config file and optional starter source. The flow is driven by `scaffoldProject()` in `src/extension/project-scaffolding.ts`.

### The scaffolding steps

1. **Check for existing config.** If a project config already exists in any of the supported locations, abort — do not overwrite.

2. **Resolve the kit.** If the caller already supplied a platform (the panel path), `getDefaultProjectKitForPlatform()` selects the default kit immediately. Otherwise `chooseProjectKit()` shows the kit picker.

3. **Build the scaffold plan.** A `ScaffoldPlan` captures the kit, target name, source file path, output directory, artifact base, and optional starter-file details. In the panel's platform-preselected path this is intentionally minimal: the default source file is `src/main.asm`, the target name is derived from the filename, and no extra prompts are shown.

4. **Write files.** The scaffold writes:
   - the starter source file if it does not already exist
   - `debug80.json` at the workspace root
   - bundled ROM assets for kits that ship them

5. **Optionally write launch.json.** `.vscode/launch.json` is created only when the caller asked for launch scaffolding as well. The plain project-init path no longer creates an empty `.vscode` folder.

### The default config

The generated config now depends on the selected **project kit**. The common shape is:

```json
{
  "projectVersion": 2,
  "projectPlatform": "tec1g",
  "defaultProfile": "mon3",
  "defaultTarget": "app",
  "profiles": {
    "mon3": {
      "platform": "tec1g",
      "description": "TEC-1G monitor-first profile with user code at 0x4000.",
      "bundledAssets": {
        "romHex": {
          "bundleId": "tec1g/mon3/v1",
          "path": "mon3.bin",
          "destination": "roms/tec1g/mon3/mon3.bin"
        },
        "listing": {
          "bundleId": "tec1g/mon3/v1",
          "path": "mon3.lst",
          "destination": "roms/tec1g/mon3/mon3.lst"
        }
      }
    }
  },
  "targets": {
    "app": {
      "sourceFile": "src/main.asm",
      "outputDir": "build",
      "artifactBase": "main",
      "platform": "tec1g",
      "profile": "mon3",
      "tec1g": {
        "regions": [
          { "start": 0, "end": 2047, "kind": "rom" },
          { "start": 2048, "end": 49151, "kind": "ram" },
          { "start": 49152, "end": 65535, "kind": "rom" }
        ],
        "appStart": 16384,
        "entry": 0,
        "romHex": "roms/tec1g/mon3/mon3.bin",
        "extraListings": ["roms/tec1g/mon3/mon3.lst"],
        "sourceRoots": ["src", "roms/tec1g/mon3"]
      }
    }
  }
}
```

For `simple/default` and `tec1/mon1b` the same structure is used, but with the kit's platform-specific memory block and profile metadata. The platform is now selected during initialization rather than being a manual post-edit step.

### Assembler auto-detection

When a source file is selected or changed, the system infers the assembler from the file extension:

- `.zax` → `assembler: "zax"`
- `.asm` → omit the `assembler` field and let asm80 remain the default

This logic still matters when targets are retargeted later, but the new project-init path currently defaults straight to `src/main.asm` for the platform's default kit and does not prompt for an alternative entry source.

---

## The Debug Configuration Provider

VS Code's debug system allows extensions to dynamically provide and resolve launch configurations. Debug80 implements this through `Debug80ConfigurationProvider` in `src/extension/debug-configuration-provider.ts`.

### What it does

The provider intercepts the launch flow at two points:

**Before variable substitution** (`resolveDebugConfiguration`):
- If the user presses F5 with no `launch.json`, the provider creates a default config
- If the config has no explicit source/hex/listing paths, it locates the project config file and injects `projectConfig` into the launch arguments
- If no project config exists, it offers to create one

**After variable substitution** (`resolveDebugConfigurationWithSubstitutedVariables`):
- If `projectConfig` is set but no `target` is specified, it prompts the user to select a target
- Injects the selected target name into the final config

This two-phase approach means the user never needs a `launch.json` file. Pressing F5 in a workspace with a `debug80.json` just works — the provider resolves everything dynamically.

---

## Config file watching

The extension watches for changes to config files using VS Code's file system watcher. The watch patterns are:

```
**/.vscode/debug80.json
**/debug80.json
**/.debug80.json
```

When a config file is created or deleted, `WorkspaceSelectionController.updateHasProject()` fires, updating the panel's project status. This means adding a `debug80.json` to a workspace folder immediately makes it appear as a configured project in the root selector — no restart needed.

The watcher registration lives in `WorkspaceSelectionController.registerInfrastructure()`.

---

## Summary

- Debug80 projects are defined by a JSON config file at `debug80.json`, `.vscode/debug80.json`, or `.debug80.json`. The first found wins, and the root-level `debug80.json` is now the preferred modern location.

- The `ProjectConfig` type defines the file structure. The `targets` object holds named build configurations; root-level fields serve as defaults for all targets.

- Target resolution follows a priority chain: explicit argument → stored selection → `defaultTarget` → single target → prompt. Selections are persisted in workspace state, keyed by config path.

- Launch arguments are assembled from four layers (runtime → target → root → platform defaults) via `populateFromConfig()`. Platform blocks are shallow-merged, not replaced, so targets can override individual fields without losing inherited values.

- TEC-1G configs have special ROM inheritance logic via `resolveTec1gBaseForMerge()` to ensure `romHex` propagates across targets.

- After merging, the result is a `LaunchRequestArguments` object — the only type the debug adapter sees. It never reads `ProjectConfig` directly.

- Three platform config types exist: `SimplePlatformConfig` (memory regions only), `Tec1PlatformConfig` (adds ROM and timing), and `Tec1gPlatformConfig` (adds banking, peripherals, and UI visibility).

- Project scaffolding is now kit-driven. Platform selection happens during initialization, and the scaffold writes a version 2 manifest plus any bundled monitor assets required by the selected kit.

- The `Debug80ConfigurationProvider` enables F5-to-debug without a `launch.json` — it resolves the project config and target dynamically.

- File watchers detect config creation/deletion in real time, updating the panel immediately.

---

[← What Debug80 Is](01-what-debug80-is.md) | [Part I](README.md) | [Part II →](../part2/README.md)
