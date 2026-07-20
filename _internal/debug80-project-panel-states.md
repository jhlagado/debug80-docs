# The Debug80 Project Panel, End to End

Background reference for rewriting the early chapters of Debug80 Book 1.
It describes every state of the Project section of the Debug80 panel and the
complete journey from a stock VS Code install to building, running, and
sending a program to hardware. Behaviour verified against the extension
source as of 2026-07-21 (commits through `1bf9ef8`). Not published; this page
is working material.

Suggested screenshots are marked **[IMG-n]** inline and collected in a table
at the end.

---

## 1. The panel at a glance

The Debug80 view lives in the Run and Debug sidebar (activity bar icon). Its
Project section contains, top to bottom:

- **Project row** — a wide button showing the selected workspace folder
  (or a placeholder), plus small `+` and `−` buttons: add a folder to the
  workspace, remove the selected folder from it.
- **Target row** — a dropdown of the project's targets, plus `+` and `−`
  buttons: add a target from any ASM, Z80, or Glimmer program file; remove
  the selected target (source files are never deleted).
- **Platform row** — during initialization, a platform dropdown (Simple,
  TEC-1, TEC-1G) and an **Initialize** button; once initialized, a read-only
  platform label.
- **Stop on entry** — checkbox; pause at the program entry point when a
  session starts. Panel-only state for the current VS Code window; not
  written to debug80.json.
- **AZM options row** — **Register Contracts** (Enforce / Audit / Off),
  **Contract Updates** (Ask / Auto / Never), and the **Strict labels**
  checkbox (saved to debug80.json as `azm.symbolCase`).
- **Action row** — **Test CoolTerm** and **Send to Board** (hardware
  workflow), then **Build** (build only) and **Run** (build and launch the
  emulator; this button doubles as the session status indicator).
- **Status lines** — build status, source map status, and hardware status,
  each appearing only when they have something to say.

**[IMG-1]** Full panel, initialized TEC-1G project with a target selected —
the "everything visible" reference shot.

---

## 2. The three panel states

The panel is a small state machine driven by the workspace:

| State | When | What the setup card says | Primary action |
|---|---|---|---|
| `noWorkspace` | No folder open at all | "Add projects or folders to the workspace to start with Debug80." | **Open Folder** |
| `uninitialized` | Folder selected, no debug80.json in it | "Uninitialized Debug80 project" | **Initialize Project** |
| `initialized` | Selected folder has debug80.json | (card hidden; full controls shown) | — |

Runtime controls (target row, stop on entry, Build/Run, tabs, machine
panels) are hidden until the project is initialized, so each state has one
obvious next action.

A fourth *sub-state* matters for the manual: **initialized with no
targets**. The project exists, the panel is fully visible, but the target
dropdown reads "No targets available" and Run/Build refuse politely
("This project has no targets yet. Pick a program file from the target
dropdown first."). See section 5.

---

## 3. From stock VS Code to a workspace folder

Fresh VS Code, extension installed, nothing open:

1. The Debug80 view shows the `noWorkspace` card. **[IMG-2]**
2. **Open Folder** opens the OS folder picker. Opening a plain folder is
   enough — no VS Code "workspace" file is ever required. A single open
   folder is automatically the selected project root.
3. Multi-root is an optional graduation, not a prerequisite: the `+` button
   on the Project row adds another folder. VS Code silently converts the
   window to an "untitled workspace" the first time (one-time window
   reload), and only asks about saving a `.code-workspace` file when the
   window closes. The manual should lead with "open a folder" and mention
   workspaces only when a second project appears.
4. The `−` button removes the selected folder from the workspace after a
   modal confirmation ("files on disk are not affected"). It is disabled
   while only one folder remains — the last folder cannot be removed.
5. With several roots, the Project row button opens a picker listing every
   root and whether it contains a Debug80 project. The selection is
   remembered per window. **[IMG-3]**

---

## 4. Initializing a project

With an uninitialized folder selected, the card shows **Initialize
Project**; the platform row shows the platform dropdown and **Initialize**
button. **[IMG-4]**

Pressing Initialize:

1. **Platform / kit choice** — Simple, TEC-1, or TEC-1G (TEC-1G bundles the
   MON-3 monitor ROM profile).
2. **Program file choice** — a quick pick listing every `.asm`, `.z80`, and
   `.glim` source found in the folder (build/, node_modules/ etc. are
   skipped), with annotations:
   - `suggested` — the inferred default (src/main.asm, then main.asm, and
     z80 equivalents, then any single source);
   - `main-file convention` — files named `main.asm` / `main.z80`, and any
     Glimmer file with a `program` declaration.
   Plus two standing options:
   - **Create ASM starter** — writes src/main.asm with minimal starter code;
   - **No target yet** — creates the project with an empty target list; the
     user picks a program file later.
   **[IMG-5]**
3. Debug80 writes `debug80.json` (project manifest: platform, profile,
   targets), optionally `.vscode/launch.json`, creates the `build/` output
   directory, and adds a gitignore entry for it.

`debug80.json` is the project's package.json equivalent: it travels with
the folder, so target choices are preserved for everyone who opens the
project. The `main.asm` convention only ever *suggests*; the manifest is
the truth.

---

## 5. Targets

A target is a named program the project can build and run: a source file
plus platform/profile settings, recorded under `targets` in debug80.json.

- **The dropdown** lists configured targets by name. Entry-convention files
  not yet configured appear as `+ name` suggestions — choosing one creates
  the target on the spot. With no targets at all it reads "No targets
  available". **[IMG-6]**
- **`+` (add target)** lists *every* eligible source file (any `.asm`,
  `.z80`, or Glimmer program file), with convention files marked
  `suggested entry`. Adding a target from a file inherits settings from the
  default target, or from the project profile when there is none.
- **`−` (remove target)** removes the selected target after confirmation.
  Sources and build artifacts stay on disk. Removing the last target is
  allowed; the project returns to the zero-target state.
- The selected target is remembered per window. A project whose selected
  root has exactly one target selects it automatically; a remembered
  project with a resolvable target auto-starts its debug session when the
  window opens.

Zero-target flow for the manual: open a folder of assorted sources with no
obvious entry → Initialize with **No target yet** → the panel shows the
full controls with "No targets available" → press target `+` → pick the
file → it becomes the target and the selection sticks. **[IMG-7]**

---

## 6. Options

- **Stop on entry** — pause at the entry point on start/restart. Window
  session only.
- **Register Contracts** — how AZM's register-contract analysis affects a
  build: **Enforce** (default; contract violations are errors, a contracts
  report artifact is emitted, MON-3 profile), **Audit** (report only),
  **Off**. Plain assembly with no `.routine` declarations builds clean
  under Enforce — contracts are pay-as-you-declare.
- **Contract Updates** — whether Debug80 may write inferred contract
  updates back into source: **Ask** (default), **Auto**, **Never**.
- **Strict labels** — require label capitalization to match exactly
  (default on; turn off only for legacy source with inconsistent
  capitalization). Saved to debug80.json.

**[IMG-8]** The AZM options row, defaults visible.

---

## 7. Build, Run, and the status lines

- **Run** (primary button, doubles as session status) builds the current
  target and launches it in the emulator — the same thing F5 does. Its
  colour tracks the session: not running / starting / running / paused.
  Pressing it during a session rebuilds and relaunches.
- **Build** builds the current target *without* launching anything — for
  when you just want fresh artifacts, typically to send to hardware. The
  build status line reports "Building src/main.asm..." then "Build
  succeeded: build/main.hex", or the assembler diagnostic on failure.
  **[IMG-9]** (one success shot, one failure shot with a diagnostic)
- **Source map status line** tracks the `.d8.json` debug map for the
  selected target: current / stale ("build recommended") / missing /
  invalid. It is the "have you built this yet?" indicator.

Command palette equivalents: "Debug80: Run Current Target",
"Debug80: Build Current Target", "Debug80: Select Active Target",
"Debug80: Select Workspace Folder", "Debug80: Create Project".

---

## 8. Send to hardware

The hardware row appears for platforms with a serial path (TEC-1G via
CoolTerm):

- **Test CoolTerm** checks the connection to CoolTerm's remote-control
  socket.
- **Send to Board** transmits the selected target's HEX artifact. The
  hardware status line says what will be sent ("Ready to send main.hex via
  CoolTerm.") or what is missing ("HEX file main.hex was not found. Build
  the selected target first.") — which is exactly the Build button's
  purpose in this flow: Build, then Send, no emulator involved.
  **[IMG-10]**

The narrative arc for the book: the same artifacts serve both machines —
the emulator during development (Run), the real TEC-1G at the end (Build,
then Send to Board).

---

## 9. Suggested screenshots

| # | Capture | Book placement |
|---|---|---|
| IMG-1 | Full panel, initialized TEC-1G project, target selected, session not running | Ch 1 or 2 overview |
| IMG-2 | `noWorkspace` card in fresh VS Code | Ch 1, install |
| IMG-3 | Project root picker with two roots, one initialized | Ch on multi-project work |
| IMG-4 | Uninitialized card + platform row with Initialize | Ch 2, create a project |
| IMG-5 | Program-file quick pick with `suggested`, starter, and "No target yet" rows | Ch 2 |
| IMG-6 | Target dropdown showing a configured target and a `+ discovered` suggestion | Ch 2 or 3 |
| IMG-7 | Zero-target panel: "No targets available" with the target `+` highlighted | Ch 2 |
| IMG-8 | AZM options row at defaults | Ch 3, first build |
| IMG-9 | Build status line: one success, one assembler diagnostic | Ch 3 |
| IMG-10 | Hardware row + status line ready to send | Ch on hardware |

Capture notes: use the TEC-1G platform throughout for visual continuity
with the rest of the book; keep the same example project name in every
shot; light theme to match existing book screenshots.
