---
layout: home
title: Home
nav_order: 1
---

# debug80 Documentation

Technical documentation for the **debug80** Z80 debugger extension and the **ZAX** assembler for Visual Studio Code.

---

## Publications

### [Understanding the debug80 Codebase](codebase/)

A seventeen-chapter engineering reference covering every layer of the debugger: the DAP session model, the launch pipeline, the Z80 CPU emulator, all three platform runtimes, the extension UI and webview panels, source mapping, and a practical guide to extending the codebase.

For engineers who need to understand, modify, or extend debug80.

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

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80) · [github.com/jhlagado/zax](https://github.com/jhlagado/zax)
