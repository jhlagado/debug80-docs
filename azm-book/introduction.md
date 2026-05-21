---
layout: default
title: "Introduction"
parent: "Learn AZM Assembly"
nav_order: 1
---
[Part 1 →](part1/index.md)

# Introduction — Why Assembly, Why AZM, Why the Z80

Most programmers never write assembly language. They write in Python or C or JavaScript and let a compiler or interpreter do the mechanical work of turning their code into something the CPU can run. That arrangement is efficient and sensible for most purposes.

But it means most programmers never quite understand what a program *is* at the level where it actually executes. They have a mental model — a rough picture of "the computer" somewhere below the language — but it is vague and borrowed, built from analogies and half-remembered explanations. The machine itself remains opaque.

This course is about making the machine transparent.

---

## What assembly actually is

Every computer, regardless of how powerful or modern, ultimately runs instructions encoded as numbers. The CPU reads those numbers one at a time from memory, decodes each one into an operation, carries it out, and moves to the next. The operation might be "add these two values" or "store this byte at this address" or "if the last result was zero, jump to address X instead of continuing." That is all a program is, at the bottom: a sequence of numbered operations, each one small and exact.

Assembly language is a thin layer of notation over those numbers. Instead of writing `$3E $05` you write `ld a, 5` — a human-readable name for the same instruction. Instead of tracking that your variable lives at address `$8000`, you write `result` and let the assembler compute the address for you. Everything else stays the same. One line of assembly corresponds to one CPU instruction. Nothing is hidden.

Writing in assembly means you decide what goes in every register, what address every memory access targets, and which branch the program takes at every decision point. The CPU does not track any of this for you. That responsibility is yours — and that directness is exactly what makes assembly the most effective way to understand how programs work.

---

## Why the Z80

The Z80 is a real CPU from 1976, still in production, and used in millions of devices. But the reason it appears in this course is not historical sentiment — it is that the Z80 is genuinely good for learning.

The Z80 has a small instruction set. There are a few hundred instructions, and only a few dozen that appear in everyday programming. Compare that to a modern x86 processor, which has thousands. With the Z80, you can learn the whole surface of the instruction set, not just the parts that apply to the task in front of you.

The Z80 has a clean memory model. A 16-bit address bus gives 65,536 bytes of addressable space. Everything — code, data, the stack — lives in that flat array. There is no virtual memory, no protected mode, no operating system in the way. You put bytes in memory and the CPU runs them.

And the Z80 has enough structure to be interesting. It has a proper set of registers, an index register for structured data access, a hardware stack, and simple `call` / `ret` instructions, so you can build clear subroutine conventions yourself. Everything that matters in real-world assembly programming is present, in a form simple enough to understand completely.

---

## Why AZM

AZM is an assembler for the Z80, written in the tradition of ASM80 — a flat, instruction-level assembler where the machine is always visible. Every line you write maps directly to Z80 instructions, and the output you get is exactly what you wrote.

You can use AZM in two ways. Install the standalone Node.js CLI (`npm install -g @jhlagado/azm`) and run `azm file.asm` from a terminal. Or open the same `.asm` in VS Code with the **Debug80** extension: when you start debugging (F5), Debug80 assembles your source as part of the launch workflow—breakpoints, stepping, registers, and memory inspection use the generated listing and program image. See [Using Debug80 in VS Code](../manual/) for extension install and `debug80.json` project setup.

AZM does not turn subroutines into declarations or invent branches you did not write. Labels are addresses. `.db` places bytes. `call` and `ret` are what you write when you want a subroutine call. The machine is always present, never hidden.

What AZM adds on top of plain assembly is practical:

- **Directives** like `.org`, `.db`, `.dw`, `.ds`, `.equ`, `.include`, and string types give you clean, documented ways to lay out your program in memory
- **`op` declarations** let you give a short instruction sequence a name and expand it inline wherever you use it — without introducing a call boundary or any hidden overhead
- **Layout types** (`byte`, `word`, `type`, `union`, `sizeof`, `offset`) name memory layout at assembly time — allocation and constants, not hidden loads or stores — so you never count struct offsets by hand
- **Enums** name states and command bytes as grouped constants (`GameMode.Playing`), not runtime types
- **AZMDoc** lets you write formal register contracts for your subroutines — documenting what goes in, what comes out, and what gets clobbered — and have the assembler verify callers and callees agree
- **Register-care analysis** uses those contracts to warn you when a subroutine's actual register usage contradicts what its documentation claims

None of this adds instructions the CPU does not run. Every AZM construct compiles to Z80 bytes you can read in the listing and verify directly.

This course teaches raw Z80 assembly first — registers, flags, jumps, the stack, subroutines, I/O — and then introduces AZM's additions one at a time, each one motivated by a specific problem in the raw code.

---

## What you will be able to do

By the end of Part 1 you will be able to:

- Read and write any raw Z80 program: move data between registers and memory, test flags and branch, loop with DJNZ, call subroutines and return correctly
- Understand what the CPU is doing at every step, because you placed every byte
- Use AZM directives to lay out programs cleanly with named constants, typed data definitions, and file inclusion
- Name and inline short instruction sequences with `op`, define record layouts with `type`, and document subroutine contracts with AZMDoc
- Recognise the difference between code that runs correctly by design and code that runs correctly by accident

By the end of Part 2 you will be able to:

- Implement and reason about standard algorithms and data structures — sorting, searching, strings, recursion, records, linked structures — in a low-level language with no standard library
- Read unfamiliar assembly code and understand what it is doing
- Debug programs by tracing register state and flag state through a sequence of instructions
- Write programs for real Z80 hardware or emulators, with full control over memory layout and I/O

---

## How this course is organised

**Part 1** starts with the bare machine: what a byte is, what a program looks like as raw hex in memory, why raw hex is unmanageable, and how assembly language solves that. It then builds the Z80 programming model instruction by instruction — loads, flags, jumps, loops, tables, the stack, subroutines, I/O — before introducing AZM's features in the final four chapters.

**Part 2** moves to algorithms and data structures. Each chapter works through a real, compilable AZM program that solves a non-trivial problem. These chapters assume everything in Part 1.

**Appendices** are reference material: number notation, ASCII, the full register set, flags and condition codes, and a searchable Z80 instruction table. Use them while reading either part.

---

## Before you start

You will need a way to **assemble** course examples and a way to **run** them to check results.

**Assemble**

- **Terminal:** Node.js 20+ and the AZM CLI — `npm install -g @jhlagado/azm`, then `azm path/to/program.asm` (or build AZM from source with `npm run build` and use `npm run azm --` in the AZM repo).
- **VS Code + Debug80:** Install the Debug80 extension, add a `debug80.json` target for your `.asm` file, and press **F5**. Debug80 assembles as part of starting a debug session; you do not need a separate `azm` step for day-to-day work in the editor. Setup is in [Using Debug80 in VS Code](../manual/).

**Run and verify**

- With Debug80, F5 also loads the program into the emulated Z80 and opens the debugger (step mode, registers, memory, breakpoints on source lines).
- Without VS Code, assemble with `azm`, then load the `.hex` (or binary) into a desktop emulator such as FUSE or ZEsarUX.

A text editor is enough for the CLI path; VS Code is recommended when you use Debug80.

You do not need prior programming experience. Part 1 assumes none. You do need patience with precision: assembly rewards careful reading and makes you pay immediately for careless writing. That is not a warning — it is most of the point.

Start with [Part 1, Chapter 1](part1/01-the-computer.md).

---

[Part 1 →](part1/index.md)
