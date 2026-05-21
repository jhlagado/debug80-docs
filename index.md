---
layout: home
title: Home
nav_order: 1
---

# debug80 Documentation

Technical documentation for the **debug80** Z80 debugger extension and the **AZM** assembler for Visual Studio Code. **Learn AZM Assembly** is the primary course on this site; manuals and engineering references for debug80 follow below. **ZAX** material is kept at the end for readers still on that earlier assembler.

---

## Publications

### [Learn AZM Assembly](azm-book/)

A two-part course in Z80 assembly programming using the AZM assembler (`@jhlagado/azm` from the terminal, or the same assembler when you assemble and debug `.asm` with Debug80 in VS Code). Part 1 starts from no prior knowledge and covers the Z80 from bare machine code through op macros, layout types, and register contracts. Part 2 works through real algorithms and data structures — sorting, searching, recursion, composition, and pointer structures — using the full AZM surface as each construct appears naturally.

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

## ZAX

Earlier structured-assembler documentation. Listed last so AZM and debug80 material stay easy to find.

---

### [Understanding the ZAX Compiler](zax-codebase/)

A sixteen-chapter engineering reference for the ZAX structured assembler, tracing every phase of the compilation pipeline from source text to Z80 machine code. Covers the module loader, frontend parser, AST contract, semantic analysis, the four-phase lowering system, Z80 instruction encoding, output format writers, diagnostics, and the design patterns used throughout.

For engineers who need to understand, modify, or extend the ZAX compiler.

---

### [Learn ZAX Assembly](zax-book/)

A two-part course in Z80 assembly programming using the ZAX assembler. Part 1 starts from no prior knowledge and covers the Z80 from bare machine code through structured control flow, IX-frame functions, and op macros. Part 2 works through real algorithms and data structures — sorting, searching, recursion, composition, and pointer structures — covering the language as each construct appears naturally.

For programmers learning Z80 assembly or the ZAX language.

---

## About debug80

debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It provides full source-level debugging: breakpoints, step over/into/out, memory inspection, register editing, and platform-specific hardware emulation.

See [Docs Readiness](docs-readiness.md) for the publishing audit behind the Debug80 user manual.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80) · ZAX: [github.com/jhlagado/zax](https://github.com/jhlagado/zax)
