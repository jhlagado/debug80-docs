---
layout: default
title: "Introduction"
parent: "AZM Books"
nav_order: 1
---
# Introduction — Why Assembly, Why AZM, Why the Z80

Most programmers never write assembly language. They write in Python or C or JavaScript and let a compiler or interpreter do the mechanical work of turning their code into something the CPU can run.

But it means most programmers never quite understand what a program *is* at the level where it actually executes.

---

## What assembly actually is

Every computer, regardless of how powerful or modern, ultimately runs instructions encoded as numbers. The CPU reads those numbers one at a time from memory, decodes each one into an operation, carries it out, and moves to the next. The operation might be "add these two values" or "store this byte at this address" or "if the last result was zero, jump to address X instead of continuing."

Assembly language is a thin layer of notation over those numbers. Instead of writing `$3E $05` you write `ld a, 5`, a human-readable name for the same instruction. Instead of tracking that your variable lives at address `$8000`, you write `result` and let the assembler compute the address for you. One line of assembly corresponds to one CPU instruction.

Writing in assembly means you decide what goes in every register, what address every memory access targets, and which branch the program takes at every decision point.

---

## Why the Z80

The Z80 is a real CPU from 1976, still in production, and used in millions of devices.

The Z80 has a small instruction set. There are a few hundred instructions, and
only a few dozen that appear in everyday programming. A modern x86 processor
has thousands.

The Z80 has a clean memory model. A 16-bit address bus gives 65,536 bytes of addressable space. Everything (code, data, the stack) lives in that flat array. There is no virtual memory, no protected mode, no operating system in the way.

The Z80 has a proper set of registers, an index register for structured data access, a hardware stack, and simple `call` / `ret` instructions, so you can build clear subroutine conventions yourself.

---

## Why AZM

AZM is an assembler for the Z80, written in the tradition of ASM80: a flat, instruction-level assembler where the machine is always visible.

AZM supports two workflows. The standalone Node.js CLI is installed with
`npm install -g @jhlagado/azm` and assembles a source file with `azm file.asm`.
The same `.asm` file can instead run through the **Debug80** extension in VS
Code. Starting a Debug80 session assembles the source as part of the launch
workflow, and the generated listing and program image support breakpoints,
stepping, register display and memory inspection. [Debug80 Book 1 — Getting
Started](../debug80-book/book1/) covers extension installation and
`debug80.json` project setup.

AZM does not turn subroutines into declarations or invent branches you did not write. Labels are addresses. `.db` places bytes. `call` and `ret` are what you write when you want a subroutine call.

What AZM adds on top of plain assembly:

- **Directives** like `.org`, `.db`, `.dw`, `.ds`, `.equ`, `.include`, and string types give you clean, documented ways to lay out your program in memory
- **`op` declarations** let you give a short instruction sequence a name and expand it inline wherever you use it, without introducing a call boundary or any hidden overhead
- **Layout types** (`byte`, `word`, `type`, `union`, `sizeof`, `offset`) name memory layout at assembly time (allocation and constants, not hidden loads or stores), so you never count struct offsets by hand
- **Enums** name states and command bytes as grouped constants (`GameMode.Playing`), not runtime types
- **Register contracts** document what goes in, what comes out, and what gets clobbered for a subroutine, and the assembler verifies callers and callees agree
- **Register contract analysis** uses those contracts to warn you when a subroutine's actual register usage contradicts what its documentation claims

Every AZM construct compiles to Z80 bytes you can read in the listing.

These books teach raw Z80 assembly first: registers, flags, jumps, the stack, subroutines, I/O. Then they use AZM's additions for larger algorithms and data structures. For the hardware itself, [Debug80 Book 1](../debug80-book/book1/) covers getting a program onto a real board, and the [TEC-1G reference](../tec1g/) documents the machine and its monitor.

---

## What you will be able to do

By the end of Book 2 you will be able to:

- Read and write any raw Z80 program: move data between registers and memory, test flags and branch, loop with DJNZ, call subroutines and return correctly
- Understand what the CPU is doing at every step, because you placed every byte
- Use AZM directives to lay out programs cleanly with named constants, typed data definitions, and file inclusion
- Name and inline short instruction sequences with `op`, define record layouts with `type`, and document subroutine contracts with register contracts
- Recognise the difference between code that runs correctly by design and code that runs correctly by accident

By the end of Book 3 you will be able to:

- Implement and reason about standard algorithms and data structures (sorting, searching, strings, recursion, records, linked structures) in a low-level language with no standard library
- Read unfamiliar assembly code and understand what it is doing
- Debug programs by tracing register state and flag state through a sequence of instructions
- Write programs for real Z80 hardware or emulators, with full control over memory layout and I/O

---

## How this course is organised

**Book 2** starts with the bare machine: what a byte is, what a program looks like as raw hex in memory, why raw hex is unmanageable, and how assembly language solves that. It then builds the Z80 programming model instruction by instruction (loads, flags, jumps, loops, tables, the stack, subroutines, I/O) before introducing AZM's features in the final four chapters.

**Book 3** moves to algorithms and data structures. Each chapter works through a real, compilable AZM program that solves a non-trivial problem. These chapters assume everything in Book 2.

**AZM Book 1 — Assembler Manual** documents AZM syntax, directives, expressions, layout types, op declarations, diagnostics, and output formats for programmers who want the assembler rules directly.

**Appendices** are reference material: number notation, ASCII, the full register set, flags and condition codes, and a searchable Z80 instruction table.

---

## Before you start

You will need a way to **assemble** course examples and a way to **run** them to check results.

**Assemble**

- **Terminal:** This path requires Node.js 20+ and the AZM CLI.
  `npm install -g @jhlagado/azm` installs it, and `azm
  path/to/program.asm` assembles a program. A source checkout of AZM provides
  the alternative `npm run build` followed by `npm run azm --`.
- **VS Code + Debug80:** This path uses the Debug80 extension and a
  `debug80.json` target for the `.asm` file. The Debug80 Run action assembles
  the target as part of starting a debug session, so day-to-day editor work
  needs no separate `azm` step. Setup is covered in [Debug80 Book 1 — Getting
  Started](../debug80-book/book1/).

**Run and verify**

- With Debug80, the Run action also loads the program into the emulated Z80 and
  opens the debugger, including step mode, registers, memory and source
  breakpoints.
- Without VS Code, `azm` produces the `.hex` or binary image accepted by a
  desktop emulator such as FUSE or ZEsarUX.

A text editor is enough for the CLI path.

You do not need prior programming experience.

[Book 2, Chapter 1](book2/01-the-computer.md) begins the course.
