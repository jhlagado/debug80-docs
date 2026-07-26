---
layout: default
title: "Source navigation and ROM source"
parent: "Debug80 Book 1 — Getting started"
nav_order: 7
---

[← Inspect a running program](06-inspect-the-machine.md) | [Book 1](index.md) | [Send to TEC-1G hardware →](09-send-to-hardware.md)

# Source navigation and ROM source

A successful build gives Debug80 a current source map. That map lets VS Code navigate assembly symbols, show compact symbol details and open source that belongs to the TEC-1G monitor.

All of it stops working when there is no current build. If Go to Definition stops resolving or hover goes quiet, check the source-map status line in the panel before looking for anything more interesting. **Debug80: Show Source Map Status** reports the same thing in more detail.

![The source map status line decides which editor features are available](../../assets/images/debug80-book/book1/source-map-status-features.svg)

## Go to Definition

Place the cursor on a symbol in a `.asm`, `.z80`, `.asmi` or `.glim` file and press **F12**. Debug80 opens the definition recorded in the last successful build.

## Workspace symbol search

Workspace symbol search lists symbols from the active target: labels, constants, routines and data symbols.

Open the VS Code Command Palette with **Shift-Command-P** on macOS or **Shift-Control-P** on Windows and Linux, then run **Debug80: Search Workspace Symbols**. You can also press **Command-T** on macOS or **Control-T** on Windows and Linux to open VS Code's symbol picker directly.

This is target-based search. Select the target, build it, then search the symbols from that target.

## Symbol hover

Hover over a known assembly symbol to see its source-map summary: name, kind, address or value, source file and line.

![A symbol hover](../../assets/images/debug80-book/book1/symbol-hover.svg)

For routines with nearby AZMDoc register contract comments, Debug80 can also show a one-line contract summary:

```text
in: A,HL    out: carry    clobbers: B,C    preserves: DE,IX
```

## ROM source

The TEC-1G / MON-3 platform runs with monitor ROM in the emulated machine. User programs normally start at `0x4000`; reset code and monitor routines live in ROM. Debug80 supplies the platform monitor ROM internally for ordinary TEC-1 and TEC-1G projects.

When execution enters monitor code, the current PC may point outside your source file. Use **Debug80: Open Auxiliary Source** from the Command Palette when a monitor call changes registers unexpectedly or when the Call Stack shows an address inside ROM.

Opening auxiliary source gives you the monitor code around routines such as MON-3 display, disk, clock and sound support.

When you want to edit or debug the monitor itself, copy the monitor ROM source into the project. [Copy monitor ROM source](10-copy-monitor-rom.md) describes that workflow.

## Summary

- Go to Definition, workspace symbol search and hover all read the last successful build's source map, and all stop working without one.
- They cover `.asm`, `.z80`, `.asmi` and `.glim` files.
- **Debug80: Search Workspace Symbols** searches the active target's symbols; **Debug80: Show Source Map Status** explains the current map.
- **Debug80: Open Auxiliary Source** opens monitor ROM source when execution leaves your files.

---

[← Inspect a running program](06-inspect-the-machine.md) | [Book 1](index.md) | [Send to TEC-1G hardware →](09-send-to-hardware.md)
