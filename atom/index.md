---
layout: default
title: "Atom"
nav_order: 6
aside: false
---

<img src="/atom.svg" width="96" height="96" alt="Atom logo">

# Atom

Atom is a single-pass Z80 assembler with an assembler core written in Z80. The
same assembler runs in two settings: the desktop command executes it in a Z80
emulator, while `ATOM.COM` executes it directly under CP/M 2.2.

## Desktop command

Atom is published as the public `atom-z80` package and requires Node.js 20 or
later:

```sh
npm install --global atom-z80
```

Create `main.asm`:

```asm
ORG 4000H

START:
    LD A,42
    HALT
```

Then assemble it:

```sh
atom main.asm build/main.bin build/main.lst
```

Atom writes only the outputs named on the command line. If no output is named,
it writes `build/main.bin`. The desktop command can produce BIN, Intel HEX,
CP/M COM, NOBJ, listing and D8 files.

## Native CP/M command

The npm package also contains `assets/atom-cpm22.com`. Copy it to a CP/M disk
as `ATOM.COM`, then use the compact native command:

```text
A>ATOM HELLO

HELLO.COM written
```

With one name, Atom reads `HELLO.ASM` and writes `HELLO.COM`. An explicit
second name may select COM, BIN or Intel HEX output. Native CP/M uses current
drive 8.3 filenames and leading `%INCLUDE` directives; it does not read Node
project files.

## The language

Atom covers the complete Z80 instruction set, including indexed, CB, ED and
classic undocumented forms. Its source language provides global and
period-prefixed private labels, `EQU`, `ORG`, `DB`, `DW`, `DS`, `ALIGN`, string
data, arithmetic expressions and `LOW()` and `HIGH()`. The desktop host also
supports `INCBIN`.

On the desktop, host directives beginning with `%` select dependencies and
conditional source. Native CP/M recognizes leading `%INCLUDE` directives only.
Included files remain distinct source parts, preserving their filenames and
positions in diagnostics and desktop D8 maps.

## Read and use

- [Atom Book 1 — Assembler Reference](/atom-book/book1/)
  defines the command, source language and output formats.
- [Atom Book 2 — Z80 Programming](/atom-book/book2/) begins
  with registers and opcodes, then develops complete routines, algorithms and
  recursion.
- [Atom and Z80 Reference](/atom-book/appendices/) contains the
  programming API and lookup tables for Atom and the Z80.
- [Atom on npm](https://www.npmjs.com/package/atom-z80) provides the current
  package and version history.
- [Atom source](https://github.com/jhlagado/debug80/tree/main/packages/atom)
  contains the assembler, desktop host and native platform providers.

Atom is licensed under GPL-3.0-only.
