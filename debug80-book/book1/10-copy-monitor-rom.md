---
layout: default
title: "Appendix E — Local monitor ROM source"
parent: "Debug80 Book 1 — Getting started"
nav_order: 105
---

[← Appendix D — The AZM options row](appendices/d-azm-options-row.md) | [Book 1](index.md)

# Appendix E — Local monitor ROM source

Debug80 supplies the platform monitor ROM for ordinary TEC-1 and TEC-1G projects, so copy it into a project only when you want to study, edit or debug the monitor itself. Debug80 then assembles the copied files with AZM and uses their source map when execution enters monitor code.

## The copy command

The VS Code Command Palette opens with:

- macOS: **Shift-Command-P**
- Windows and Linux: **Shift-Control-P**

**Debug80: Copy Monitor ROM into Project** starts the copy.

Debug80 asks which workspace folder should receive the monitor source.

When files already exist, **Skip existing files** preserves local
edits. **Overwrite existing files** replaces them with a fresh copy of
the shipped monitor source.

## Files created

For a TEC-1G / MON-3 project, Debug80 creates a local ROM entry file:

```text
roms/tec1g/mon3/mon3.rom.asm
```

For a TEC-1 project, the local entry file is:

```text
roms/tec1/mon1b/mon1b.rom.asm
```

The TEC-1G entry file includes the copied MON-3 source:

```asm
.include "mon3.z80"
```

The copied source files live under the same `roms/tec1g/mon3/` folder.

## Building the local ROM

After the copied ROM source is edited, **Run** assembles it with AZM,
writes the generated artifacts under `build/roms/`, and starts the
machine on that ROM instead of the bundled one. **Build** alone
assembles it without launching.

Once a `*.rom.asm` file exists, *every* launch builds it and points the platform at the result, whatever ROM `debug80.json` names. When a project behaves unexpectedly, a forgotten monitor source in `roms/` is worth checking: it is quietly replacing the monitor.

For TEC-1G / MON-3, the generated files include:

```text
build/roms/tec1g/mon3/mon3.hex
build/roms/tec1g/mon3/mon3.d8.json
```

The `.d8.json` file is the source map for the local monitor build. Debug80 uses it for source breakpoints, stepping and source navigation inside the copied monitor files.

## Debugging monitor code

Breakpoints in copied ROM source files behave like breakpoints in the
program source.

Stepping into monitor services now opens project-local files under `roms/tec1g/mon3/` instead of the bundled source files from the extension.

## Returning to the bundled ROM

Without the platform's local `*.rom.asm` entry file, the project
returns to the bundled monitor ROM. For TEC-1G / MON-3 that file is:

```text
roms/tec1g/mon3/mon3.rom.asm
```

---

[← Appendix D — The AZM options row](appendices/d-azm-options-row.md) | [Book 1](index.md)
