---
layout: default
title: "Source navigation and ROM source"
parent: "Debug80 Book 1 — Getting started"
nav_order: 7
---

# Source navigation and ROM source

A successful build gives Debug80 a current source map. That map lets VS Code navigate assembly symbols, show compact symbol details and open source that belongs to the TEC-1G monitor.

The panel's source-map status is the first diagnostic when Go to Definition
stops resolving or hover becomes unavailable. **Debug80: Show Source Map Status**
reports the same state in more detail.

![The source map status controls which editor features are available](../../assets/images/debug80-book/book1/source-map-status-features.svg)

## Go to Definition

**Go to Definition** in a symbol's context menu opens the definition
recorded in the last successful build for `.asm`, `.z80`, `.asmi` and
`.glim` files.

## Workspace symbol search

Workspace symbol search lists symbols from the active target: labels, constants, routines and data symbols.

**Debug80: Search Workspace Symbols** is available from the Command
Palette, opened with **Shift-Command-P** on macOS or
**Shift-Control-P** on Windows and Linux. **Command-T** on macOS or
**Control-T** on Windows and Linux opens VS Code's symbol picker
directly.

## Symbol hover

Hovering over a known assembly symbol shows its source-map summary:
name, kind, address or value, source file and line.

![A symbol hover](../../assets/images/debug80-book/book1/symbol-hover.svg)

For routines with nearby AZMDoc register contract comments, Debug80 can also show a one-line contract summary:

```text
in: A,HL    out: carry    clobbers: B,C    preserves: DE,IX
```

## ROM source

User programs normally start at `0x4000`; reset code and monitor routines live in ROM. Debug80 supplies the platform monitor ROM internally for ordinary TEC-1 and TEC-1G projects.

When execution enters monitor code, the PC sits at an address in the
ROM. **Debug80: Open Auxiliary Source** lists the
auxiliary sources known to the session, which helps when a monitor
call changes registers unexpectedly or the Call Stack shows an address
inside ROM.

Those sources cover the monitor code around routines such as MON-3 display, disk, clock and sound support.

Editing or debugging the monitor itself requires a project-local copy of the monitor ROM source. [Appendix E](appendices/e-copy-monitor-rom.md) describes that workflow.
