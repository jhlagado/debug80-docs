---
layout: default
title: "AZM Book 1 — Z80 Fundamentals"
nav_order: 5
has_children: true
has_toc: false
---
# AZM Book 1 — Z80 Fundamentals

No prior knowledge of computers or programming assumed.

The first two chapters describe the machine and what a program looks like as raw bytes. Chapter 3 introduces assembly language and the AZM program structure. Chapters 4–10 teach raw Z80 programming. Chapters 11–14 introduce AZM-specific features: subroutine conventions and register discipline, AZMDoc register contracts, layout types and op declarations.

Continue with [Debug80 Book 2 — Programming the TEC-1G](../../debug80-book/book2/index.md) when you are done, or continue the AZM track with [AZM Book 2 — Algorithms and Data Structures](../book2/index.md).

---

## Learning arc

Chapters 1 and 2 cover the machine before any code: how the CPU fetches and executes bytes, what a program looks like as raw hex and why raw hex is unmanageable to write by hand. Chapter 3 introduces assembly language and the AZM source format: `.org` for placing code and data, `.equ` for named constants, `.db`/`.dw` for defining storage and labels as the names for addresses. Chapter 4 extends `ld` to cover memory access forms and explains how the Z80 represents signed and unsigned values. Chapters 5 through 9 extend the instruction set further — flags and branches, counted loops, data tables, the stack and subroutines, port I/O. By Chapter 9 you can write raw Z80 programs that read hardware and manage memory directly.

Chapter 10 is a capstone: a complete AZM program built from the techniques of Chapters 3–9. It is a real, working program — and it also exposes the practical frictions that grow with any assembly codebase: subroutines whose register usage is undocumented, layouts whose byte offsets have to be counted by hand and short instruction patterns repeated throughout the code. Those frictions are real, and naming them is the point.

Chapters 11 through 14 each address one of those friction points. Chapter 11 covers subroutine calling conventions and the discipline of register ownership — the raw techniques that any serious assembly program needs. Chapter 12 introduces AZMDoc, AZM's formal register-contract system, which lets you document what goes in, what comes out and what gets clobbered — and have the assembler verify it. Chapter 13 covers AZM's layout type system — compile-time memory contracts, not hidden data access: scalar types (`byte`, `word`, `addr`), records, unions as alternate views, `sizeof` and `offset`, `.ds` and named-length idioms, layout casts and enums as state/command names. Chapter 14 introduces `op` declarations, which give a name to a short instruction sequence and expand it inline at every call site.

By Chapter 10 you can read and write any raw Z80 program. By Chapter 14 you can write AZM programs that are self-documenting, where layouts never require hand-counted offsets and repeated instruction patterns have names — while retaining access to every raw instruction when you need it.

---

## Chapter table

| Ch | File | What it covers |
|----|------|----------------|
| 1 | [The Computer](01-the-computer.md) | CPU, memory, registers, the fetch-execute cycle |
| 2 | [Machine Code](02-machine-code.md) | Programs as bytes, decoding a real hex program, why raw machine code is fragile |
| 3 | [Assembly Language](03-assembly-language.md) | AZM program structure, `.org`, `.equ`, `.db`/`.dw`, labels, `ld` |
| 4 | [Memory Access and Data](04-memory-access-and-data.md) | `(HL)`, `(BC)`, `(DE)`, direct memory access, LD forms table, signed/unsigned values |
| 5 | [Flags, Comparisons, Jumps](05-flags-comparisons-jumps.md) | Flags register, `cp` instruction, conditional and unconditional jumps |
| 6 | [Counting Loops and DJNZ](06-counting-loops-and-djnz.md) | `djnz` instruction, counted loops, loop patterns |
| 7 | [Data Tables and Indexed Access](07-data-tables-and-indexed-access.md) | Tables in memory, HL sequential access, IX indexed access, `ex de, hl`, `ldir` |
| 8 | [Stack and Subroutines](08-stack-and-subroutines.md) | `push`, `pop`, `call`, `ret`, the system stack, subroutine conventions |
| 9 | [I/O and Ports](09-io-and-ports.md) | `in`, `out`, port-mapped I/O, TEC-1 hardware examples |
| 10 | [A Complete Program](10-a-complete-program.md) | Putting it all together: a real program from start to finish |
| 11 | [Subroutine Conventions](11-subroutine-conventions.md) | Register discipline, calling conventions, push/pop preservation |
| 12 | [Register Contracts with AZMDoc](12-register-contracts-azmdoc.md) | Caller/callee contracts, flags as `out`, `@` entries, `.asmi`, register-care CLI |
| 13 | [Layout Types](13-layout-types.md) | `byte`/`word` scalars, `.type`/`.union`, `sizeof`/`offset`, `.ds` type expressions, layout casts, enums |
| 14 | [Op Declarations](14-op-declarations.md) | `op` for inline expansion, operand matchers, pseudo-opcodes |

Example files are under `examples/` in this directory. Examples `00` and `01` accompany Chapter 3; example `02` accompanies Chapter 4. From `03` onward, each example corresponds to the next chapter: `03_flag_tests_and_jumps.asm` goes with Chapter 5, `04_djnz_loops.asm` with Chapter 6, and so on. Chapters 1 and 2 have no example files — they cover concepts that precede writing code.

---

## How to assemble the examples

You can assemble from the terminal or from VS Code with Debug80—same `.asm` source either way.

**Terminal (standalone AZM CLI)**

```sh
azm examples/01_register_moves.asm
```

From the AZM source tree:

```sh
npm run azm -- examples/01_register_moves.asm
```

**VS Code (Debug80)**

Install the Debug80 extension, point a `debug80.json` target at the example `.asm` and press **F5**. Debug80 assembles as part of starting the session and writes the usual artifacts (`.hex`, `.lst` and related files) under the target's `outputDir`. See [Debug80 Book 1 — Getting Started](../../debug80-book/book1/) for install, project files and platform choice.

---

## Hardware and emulator setup

### Target system

This book is platform-agnostic. The programs target a Z80 with ROM starting at `$0000` and RAM starting at `$8000` — the same memory map described in Chapter 1. They do not rely on any specific hardware beyond that. Port I/O examples in Chapter 9 use TEC-1 port addresses as concrete numbers, but the concepts apply to any Z80 system.

### Emulator and debugger (Debug80)

**Debug80** is the VS Code debugger extension for this site. It is the preferred way to work through the course: assemble AZM `.asm` sources on **F5**, load the program image, map listing lines back to source and debug with normal VS Code controls.

During a session you get:

- **Step mode** — step into, over and out at source level; continue, pause, restart and stop the emulated CPU.
- **Registers** — AF, BC, DE, HL, alternate set, index registers, stack pointer and program counter in the Variables view (including flags when a branch looks wrong).
- **Memory** — inspect and edit RAM through Debug80's platform panels; confirm results at labels such as `$8000` after `halt`.
- **Breakpoints** — set breakpoints in `.asm` source before or during a run; resolved breakpoints map to the generated Z80 addresses.
- **TEC-1 support** — for Chapter 9 port I/O, configure a **TEC-1** or **Simple** target in `debug80.json` so `in`/`out` examples see the expected port map; the TEC-1 panel can drive keypad and display behaviour where the chapter references hardware.

Open or create a `debug80.json` project ([Debug80 Book 1 — Getting Started](../../debug80-book/book1/)), open your `.asm` and press **F5**—no separate terminal `azm` step is required for editor-based work. Chapters 1–8 and 10–14 need only a plain Z80 memory map; port-accurate behaviour matters mainly in Chapter 9.

The standalone **`azm`** CLI (`npm install -g @jhlagado/azm`) is the same assembler for terminal builds, CI or when you prefer to load `.hex` into another emulator yourself.

### Other emulators

If you prefer a standalone desktop emulator, **FUSE** and **ZEsarUX** (both free and cross-platform) also expose registers, memory and step mode. Load the `.hex` or binary AZM emits and single-step the same way Chapter 3 describes. For TEC-1-specific display and port behaviour outside VS Code, the [TEC-1 emulator](https://github.com/jhlagado/tec-1) remains a useful alternative for Chapter 9.

### Verifying a program ran correctly

After assembling and loading a program into the emulator:

1. **Single-step the first several instructions** using the emulator's step mode. Confirm each register holds the value you expect before moving to the next instruction.
2. **Check memory at the target address** after the program halts. For the Chapter 3 example `00_first_program.asm`, address `$8000` should contain `$08` after the program runs. For the Chapter 4 example `02_constants_and_labels.asm`, `$8000` should hold `$0A`, `$8001` should hold `$34` and `$8002` should hold `$12`.
3. **Inspect the flags register** whenever a jump goes the wrong way. The emulator's register panel shows each flag bit; compare what you see to what Chapter 5 says the instruction should produce.

If the program does not halt or produces wrong values, the debugging steps in Chapter 3 ("When Your Program Does the Wrong Thing") give a systematic method for tracing the failure.
