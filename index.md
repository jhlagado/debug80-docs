---
layout: home
title: Home
nav_order: 1
---

# debug80 Documentation

Technical documentation for the **debug80** Z80 debugger extension and the **AZM** assembler for Visual Studio Code. The **AZM Books** are the primary course material on this site; manuals and engineering references for debug80 follow below.

---

## Publications

### [AZM Books and Manual](azm-book/)

A three-book course in Z80 assembly programming, plus a supplementary AZM assembler manual, using the AZM assembler (`@jhlagado/azm` from the terminal, or the same assembler when you assemble and debug `.asm` with Debug80 in VS Code).

- [AZM Book 1 — Z80 Fundamentals](azm-book/book1/) starts from no prior knowledge and covers the Z80 from bare machine code through ops, layout types, and register contracts.
- [AZM Book 2 — Programming the TEC-1G](azm-book/book2/) is an in-progress hardware-focused book on MON-3, Debug80, keypad input, LCD text, seven-segment scanning, sound, the 8x8 RGB add-on, and larger TEC-1G programs.
- [AZM Book 3 — Algorithms and Data Structures](azm-book/book3/) works through sorting, searching, recursion, composition, pointer structures, and larger AZM program design.
- [AZM Book 4 — Assembler Manual](azm-book/book4/) is a supplementary reference-style book for experienced assembly programmers learning AZM syntax, directives, layout types, ops, diagnostics, and output formats.

For programmers learning Z80 assembly or the AZM language.

---

### [Using Debug80 in VS Code](manual/)

A practical manual for Z80 hobbyists using Debug80 with VS Code. It covers project setup, TEC-1 and TEC-1G profile kits, F5 debugging, breakpoints, registers, memory, ROM bundles, serial workflows, assembler artifacts, source mapping, and the common failures you are likely to meet while bringing a project up.

For users who want to run and debug Z80 code, not modify the debugger itself.

---

### [Understanding the debug80 Codebase](codebase/)

A seventeen-chapter engineering reference covering every layer of the debugger: the DAP session model, the launch pipeline, the Z80 CPU emulator, all three platform runtimes, the extension UI and webview panels, source mapping, and a practical guide to extending the codebase.

For engineers who need to understand, modify, or extend debug80.

---

### [Understanding the AZM Codebase](azm-codebase/)

A technical tour of the AZM assembler implementation. It covers the repository
structure, source loading, parsing, assembler-time facts, byte emission, Z80
encoding, ops, register care, public APIs, output artifacts, tests and
maintenance rules.

For engineers who need to understand, modify or extend AZM.

---

## About debug80

debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It provides full source-level debugging: breakpoints, step over/into/out, memory inspection, register editing, and platform-specific hardware emulation.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80)
