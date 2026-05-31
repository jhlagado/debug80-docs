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

### [Debug80 Book 2 — Programming the TEC-1G](debug80-book/book2/)

In development. A Debug80-oriented outline for programming the TEC-1G with MON-3, Debug80 projects and targets, display hardware, sound, and larger interactive examples.

---

### [AZM Book 0 — Assembler Manual](azm-book/book0/)

The definitive reference for AZM, an enhanced Z80 assembler with modern programming features. Covers AZM source format, syntax, directives, layout types, ops, diagnostics, and output formats.

For programmers who want the exact assembler rules and the supported programming features in one place.

### [AZM Book 1 — Z80 Fundamentals](azm-book/book1/)

A teaching book that starts from no prior knowledge and covers the Z80 from bare machine code through assembly language, ops, layout types, and register contracts.

For readers learning Z80 assembly programming with AZM.

### [AZM Book 2 — Algorithms and Data Structures](azm-book/book2/)

A follow-on AZM book about sorting, searching, recursion, composition, pointer structures, and larger assembly program design.

For readers who know the Z80 basics and want to build more substantial AZM programs.

---

## Engineering Manuals

For readers interested in the TypeScript implementations of Debug80 and AZM.

- [Debug80 Engineering Manual](codebase/) — Debug adapter, launch pipeline, Z80 emulator, platform runtimes, extension UI, source mapping, and extension points.
- [AZM Engineering Manual](azm-codebase/) — AZM repository layout, parsing, assembly, Z80 emission, ops, register-care analysis, artifacts, APIs, and verification.

These are implementation references, not general Z80 or Debug80 user guides.

---

## About Debug80

Debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It provides full source-level debugging: breakpoints, step over/into/out, memory inspection, register editing, and platform-specific hardware emulation.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80)
