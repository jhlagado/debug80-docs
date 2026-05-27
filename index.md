---
layout: home
title: Home
nav_order: 1
---

# Debug80 Documentation

Technical documentation for the **Debug80** Z80 debugger extension and the **AZM** assembler for Visual Studio Code. The reader-facing Debug80 and AZM books come first. Engineering manuals for the TypeScript codebases are collected separately below.

---

## Publications

### [Debug80 Book 1 — Getting Started](debug80-book/book1/)

A guided Debug80 book that starts from installation and walks through creating a TEC-1G project, building and stepping code, inspecting the machine, using the panel, reading artifacts, and sending HEX to hardware.

For readers who want a book-shaped route through the Debug80 workflow.

---

### AZM Books and Manual

A three-book course in Z80 assembly programming, plus a supplementary AZM assembler manual, using the AZM assembler (`@jhlagado/azm` from the terminal, or the same assembler when you assemble and debug `.asm` with Debug80 in VS Code).

- [AZM Book 1 — Z80 Fundamentals](azm-book/book1/) starts from no prior knowledge and covers the Z80 from bare machine code through ops, layout types, and register contracts.
- [AZM Book 2 — Programming the TEC-1G](azm-book/book2/) is an in-progress hardware-focused book on MON-3, Debug80, keypad input, LCD text, seven-segment scanning, sound, the 8x8 RGB add-on, and larger TEC-1G programs.
- [AZM Book 3 — Algorithms and Data Structures](azm-book/book3/) works through sorting, searching, recursion, composition, pointer structures, and larger AZM program design.
- [AZM Book 4 — Assembler Manual](azm-book/book4/) is a supplementary reference-style book for experienced assembly programmers learning AZM syntax, directives, layout types, ops, diagnostics, and output formats.

For programmers learning Z80 assembly or the AZM language.

---

## Engineering Manuals

These manuals are for contributors working on the TypeScript implementations rather than readers learning Z80, AZM, or the Debug80 user workflow.

### [Debug80 Engineering Manual](codebase/)

A seventeen-chapter engineering reference covering every layer of the Debug80 codebase: the DAP session model, the launch pipeline, the Z80 CPU emulator, all three platform runtimes, the extension UI and webview panels, source mapping, and a practical guide to extending the debugger.

For engineers who need to understand, modify, or extend Debug80.

---

### [AZM Engineering Manual](azm-codebase/)

A technical reference for engineers working on the AZM assembler implementation: repository layout, source loading, parsing, assembly, Z80 emission, ops, register-care analysis, artifact writing, public APIs, and verification.

For engineers who need to understand, modify, or extend AZM.

---

## About Debug80

Debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It provides full source-level debugging: breakpoints, step over/into/out, memory inspection, register editing, and platform-specific hardware emulation.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80)
