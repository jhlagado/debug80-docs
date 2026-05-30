---
layout: default
title: "Source Navigation And ROM Source"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 6
---

[← Build Options And Source Maps](05-use-the-debug80-panel.md) | [Book 1](index.md) | [Send To Hardware And Keep Working →](07-send-to-hardware-and-keep-working.md)

# Source Navigation And ROM Source

A successful build gives Debug80 a current source map. VS Code can then navigate assembly symbols, and Debug80 can relate monitor execution back to source files.

## Go To Definition

Place the cursor on a symbol in a `.asm` or `.z80` file and press F12, or run VS Code's **Go to Definition** command. Debug80 opens the definition recorded in the last successful build.

The last successful build is the source of truth. Build again after changing labels, constants or include files.

![Go to Definition on an assembly symbol](../../assets/images/debug80-book/book1/chapter6-go-to-definition.png)

## Workspace Symbol Search

Run **Debug80: Search Workspace Symbols**, or press **Command-T** on macOS or **Control-T** on Windows and Linux. VS Code opens the workspace symbol picker with labels, constants, routines and data symbols contributed by Debug80.

![Command Palette entry for Debug80 workspace symbol search](../../assets/images/debug80-book/book1/chapter6-search-workspace-symbols-command.png)

This is target-based search. Select the Debug80 target you want, build it, then use the workspace symbol picker for symbols from that target.

![Workspace symbol picker showing a Debug80 symbol](../../assets/images/debug80-book/book1/chapter6-workspace-symbol-result.png)

## Symbol Hover

Hover over a known assembly symbol to see a compact source-map summary: name, kind, address or value, source file and line.

For routines with nearby AZMDoc register-care comments, Debug80 can also show a one-line contract summary:

```text
in: A,HL    out: carry    clobbers: B,C    preserves: DE,IX
```

Hover appears for symbols that resolve through the source map. Build the target when hover needs current symbol data.

![Symbol hover showing source-map details](../../assets/images/debug80-book/book1/chapter6-symbol-hover.png)

## ROM Source

The TEC-1G / MON-3 platform runs with monitor ROM in the emulated machine. Your program starts at `0x4000`; reset code and monitor routines live in ROM.

When execution enters monitor code, the current PC may point outside your source file. Debug80 can open the monitor source material for the active platform.

Run:

```text
Debug80: Open Auxiliary Source
```

Use this when a monitor call changes registers unexpectedly or when the Call Stack shows an address inside ROM.

![Command Palette entry for Open Auxiliary Source](../../assets/images/debug80-book/book1/chapter6-open-auxiliary-source-command.png)

Debug80 then shows the auxiliary source files available for the active debug session.

![Auxiliary source picker showing MON-3 source files](../../assets/images/debug80-book/book1/chapter6-auxiliary-source-picker.png)

Opening ROM source gives you the surrounding monitor code for the current address.

## Bundled Assets

Debug80 ships bundled ROM assets for the built-in platforms. The TEC-1G / MON-3 platform refers to paths such as:

```text
roms/tec1g/mon3/mon3.bin
```

If those files exist in your workspace, Debug80 uses them. Otherwise it uses the copy packaged with the extension.

Run this command when you want local copies:

```text
Debug80: Copy Bundled Assets into Workspace
```

Copy assets when you want to inspect monitor source, compare a ROM or keep a project self-contained. Ordinary debugging with bundled platform assets can use the packaged copies.

> **Image placeholder:** Explorer showing copied `roms/tec1g/mon3` assets.

[← Build Options And Source Maps](05-use-the-debug80-panel.md) | [Book 1](index.md) | [Send To Hardware And Keep Working →](07-send-to-hardware-and-keep-working.md)
