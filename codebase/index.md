---
layout: default
title: "Understanding the debug80 Codebase"
nav_order: 3
has_children: true
---
# debug80 Engineering Manual

A technical reference for engineers working with the debug80 codebase.

This manual is updated against the codebase state through **2026-04-22**. The most important **recent** shifts (including work landed on `main` in the last day) are:

- **Scaffold:** new projects can merge a standard **Debug80** `.gitignore` block (extension cache, `outputDir`, optional `.vscode/launch.json`, OS junk) via `ensureDebug80Gitignore()` in `src/extension/project-gitignore.ts`, invoked from `scaffoldProject()`.
- **TEC-1G panel UI:** section checkboxes (7-seg, LCD, GLCD, 8×8, etc.) **persist** — merge order is built-in defaults → `debug80.json` `tec1g.uiVisibility` (from the active launch) → **workspace** `Memento` keyed by **debug target** (`debug80.tec1g.uiVisibilityByTarget`). The webview posts `saveTec1gPanelVisibility` when checkboxes change; the extension no longer re-broadcasts a stale launch-only override on every HTML rehydration in a way that clobbered user choices.
- **Mapping / MON-style includes:** Layer2 **include-anchor remapping** and **propagation of mis-attributed include segments** fix stepping and stack frames when asm80 attributes bytes to the parent file but the real code lives in a sibling include (e.g. `glcd_library.z80`); the same remap runs on **native `.d8.json`** maps (not only listing-derived mapping).
- **Z80 / debugger:** a single **Step** over the **ED** block-repeat instructions (LDIR, LDDR, CPIR, CPDR, INIR, INDR, OTIR, OTDR) runs the instruction to completion in one user-visible step; **DJNZ** is *not* treated as a block-repeat bulk op.
- **ST7920 / GLCD:** the emulator keeps a full **4-bit** column counter and derives the **upper/lower 64×64 chip bank** from it so routines such as `clearGrLCD` that rely on X auto-increment can clear the full 128×64 surface in one pass.
- **Webview (TEC-1 + TEC-1G):** shared **common/** modules (serial UI, Web Audio core, matrix renderer, seven-seg display, keypad core, TEC keycap layout, styles) replaced large duplicated platform trees; panel **layout, focus, and keyboard shortcuts** were reworked (focus-gated keypad, panel click-to-focus, Space/Escape/Shift behaviour — see in-repo `README` / platform `README` for binding tables).
- **Extension:** on open, **`.z80` / `.a80` / `.s`** are assigned the `z80-asm` language id so decorations and breakpoints align with `files.associations` in `package.json`.

**Longer-standing** architecture notes:

- the project manifest uses the version 2 model (`projectVersion`, `projectPlatform`, `profiles`, `defaultProfile`, `bundledAssets`)
- project creation and first launch can materialize bundled ROM assets into the workspace automatically
- the panel lifecycle is three-state: `noWorkspace`, `uninitialized`, `initialized`
- the project header owns project selection, target selection, stop-on-entry, restart, and workspace-folder addition
- several debug/extension responsibilities were split or consolidated, notably memory snapshot handling and mapping-cache decisions

---

## Part I — Orientation

- [Chapter 1 — What debug80 Is](part1/01-what-debug80-is.md)
- [Chapter 2 — Project Configuration](part1/02-project-configuration.md)

## Part II — The Debug Adapter

- [Chapter 3 — DAP and the Debug Session](part2/03-dap-and-the-debug-session.md)
- [Chapter 4 — The Launch Pipeline](part2/04-the-launch-pipeline.md)
- [Chapter 5 — Execution Control](part2/05-execution-control.md)

## Part III — The Z80 Emulator

- [Chapter 6 — The Z80 Runtime](part3/06-the-z80-runtime.md)
- [Chapter 7 — Instruction Decoding](part3/07-instruction-decoding.md)
- [Chapter 8 — Memory, I/O, and Interrupts](part3/08-memory-io-interrupts.md)

## Part IV — Platform Runtimes

- [Chapter 9 — The Simple Platform](part4/09-the-simple-platform.md)
- [Chapter 10 — The TEC-1 Platform](part4/10-the-tec-1-platform.md)
- [Chapter 11 — The TEC-1G Platform](part4/11-the-tec-1g-platform.md)

## Part V — The Extension UI

- [Chapter 12 — The Extension Host UI](part5/12-the-extension-host-ui.md)
- [Chapter 13 — The Webview Panels](part5/13-the-webview-panels.md)

## Part VI — Source Mapping

- [Chapter 14 — Mapping Data Structures](part6/14-mapping-data-structures.md)
- [Chapter 15 — Parsing and Lookup](part6/15-parsing-and-lookup.md)

## Part VII — Extending the Codebase

- [Chapter 16 — Adding a New Platform](part7/16-adding-a-new-platform.md)
- [Chapter 17 — Custom Commands, UI Panels, and Source Mapping](part7/17-custom-commands-ui-and-mapping.md)

## Appendices

- [Appendix A — Custom DAP Request Reference](appendices/a-custom-dap-requests.md)
- [Appendix B — Platform Configuration Reference](appendices/b-platform-config.md)
- [Appendix C — Session State Reference](appendices/c-session-state.md)
