---
layout: default
title: "Source Navigation And ROM Source"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 6
---

[← Build Options And Source Maps](05-use-the-debug80-panel.md) | [Book 1](index.md) | [Send To Hardware And Keep Working →](07-send-to-hardware-and-keep-working.md)

# Source Navigation And ROM Source

A successful build gives Debug80 a current source map. Once that map exists, VS Code can navigate assembly symbols and Debug80 can relate monitor execution back to source files.

## Go To Definition

Place the cursor on a symbol in a `.asm` or `.z80` file and press F12, or run VS Code's **Go to Definition** command. Debug80 uses the source map from the last successful build and opens the symbol definition.

The last successful build is the source of truth. Build again after changing labels, constants or include files.

> **Image placeholder:** Source editor with cursor on a symbol and the definition target shown after F12.

## Workspace Symbol Search

VS Code's **Go to Symbol in Workspace** command can search symbols contributed by Debug80. Debug80 contributes labels, constants, routines and data symbols from the active target.

This is target-based search. Select the Debug80 target you want, build it, then use the workspace symbol picker for symbols from that target.

> **Image placeholder:** VS Code workspace symbol picker showing Debug80 symbols from the active target.

## Symbol Hover

Hover over a known assembly symbol to see a compact source-map summary. The hover can include the symbol name, kind, address or value, source file and line.

For routines with nearby AZMDoc register-care comments, Debug80 can also show a one-line contract summary:

```text
in: A,HL    out: carry    clobbers: B,C    preserves: DE,IX
```

Hover appears for symbols that resolve through the source map. Build the target when hover needs current symbol data.

> **Image placeholder:** Symbol hover showing name, kind, address and source location.

## ROM Source

The TEC-1G / MON-3 platform runs with monitor ROM in the emulated machine. Your program starts at `0x4000`; reset code and monitor routines live in ROM.

When execution enters monitor code, the current PC may point outside your source file. Debug80 can open the monitor source material for the active platform.

Run:

```text
Debug80: Open ROM Source
```

Use this when a monitor call does something unexpected or when the Call Stack shows an address inside ROM.

> **Image placeholder:** Command Palette showing **Debug80: Open ROM Source**.

> **Image placeholder:** MON-3 source open beside user source.

ROM source is especially useful when your program calls a monitor routine. If a call changes registers you expected to preserve, or if control returns somewhere unexpected, opening the ROM source gives you the surrounding monitor code for the current address.

## Bundled Assets

Debug80 ships bundled ROM assets for the built-in platforms. The TEC-1G / MON-3 platform refers to paths such as:

```text
roms/tec1g/mon3/mon3.bin
```

If those files exist in your workspace, Debug80 uses them. If they are absent and the platform has a bundled asset entry, Debug80 uses the copy packaged with the extension.

Run this command when you want local copies:

```text
Debug80: Copy Bundled Assets into Workspace
```

Copy assets when you want to inspect monitor source, compare a ROM or keep a project self-contained. Ordinary debugging with bundled platform assets can use the packaged copies.

> **Image placeholder:** Explorer showing copied `roms/tec1g/mon3` assets.

[← Build Options And Source Maps](05-use-the-debug80-panel.md) | [Book 1](index.md) | [Send To Hardware And Keep Working →](07-send-to-hardware-and-keep-working.md)
