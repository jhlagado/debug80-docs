---
layout: default
title: "Copy Monitor ROM Source"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 8
---

[← Send To TEC-1G Hardware](07-send-to-hardware-and-keep-working.md) | [Book 1](index.md) | [Appendix A — Debug Expressions →](appendices/a-debug-expressions.md)

# Copy Monitor ROM Source

Debug80 supplies the platform monitor ROM for ordinary TEC-1 and TEC-1G projects. Create a project, build a target and debug user code from the generated project settings.

Copy the monitor ROM into a project when you want to study, edit or debug the monitor itself. The copied files become project source. Debug80 assembles them with AZM and uses their source map when execution enters monitor code.

## Run The Command

Open the VS Code Command Palette:

- macOS: **Shift-Command-P**
- Windows and Linux: **Shift-Control-P**

Run **Debug80: Copy Monitor ROM into Project**.

Debug80 asks which workspace folder should receive the monitor source. Choose the Debug80 project you want to use for monitor development.

If Debug80 asks how to handle existing files, choose **Skip existing files** when you want to preserve local edits. Choose **Overwrite existing files** only when you want a fresh copy of the shipped monitor source.

## Files Created

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

The copied source files live under the same `roms/tec1g/mon3/` folder. Once `mon3.rom.asm` exists, Debug80 treats it as the project's monitor ROM source.

## Build The Local ROM

Edit the copied ROM source, then click **Build** in the Debug80 panel. Debug80 assembles the local ROM with AZM, writes the generated ROM artifacts under `build/roms/` and loads that ROM into the emulator.

For TEC-1G / MON-3, the generated files include:

```text
build/roms/tec1g/mon3/mon3.hex
build/roms/tec1g/mon3/mon3.d8.json
```

The `.d8.json` file is the source map for the local monitor build. Debug80 uses it for source breakpoints, stepping and source navigation inside the copied monitor files.

## Debug Monitor Code

Set breakpoints in the copied ROM source files just as you would in your own program. When execution reaches monitor code, Debug80 resolves source locations through the local monitor source map.

Stepping into monitor services now opens project-local files under `roms/tec1g/mon3/` instead of the bundled source files from the extension.

## Return To The Bundled ROM

The workflow is convention-based. Debug80 looks for the platform's local `*.rom.asm` entry file in the project.

For TEC-1G / MON-3, that file is:

```text
roms/tec1g/mon3/mon3.rom.asm
```

Remove or rename that file when you want the project to use the bundled monitor ROM again.

[← Send To TEC-1G Hardware](07-send-to-hardware-and-keep-working.md) | [Book 1](index.md) | [Appendix A — Debug Expressions →](appendices/a-debug-expressions.md)
