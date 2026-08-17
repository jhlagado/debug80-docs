---
layout: default
title: "Atom"
nav_order: 6
aside: false
---

<img src="/atom.svg" width="96" height="96" alt="Atom logo">

# Atom

Atom is a single-pass Z80 assembler with an assembler core written in Z80. The
native core fits in one 16 KiB bank and can assemble its own source. On a Mac,
the `atom` command runs that core through the Debug80 runtime while a Node host
handles files, conditional source, binary inputs and finished artifacts.

## Install Atom

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
atom --origin 4000H main.asm
```

The build appears under `build/main.atom/current` as binary, Intel HEX, NOBJ,
listing, D8 source map and manifest files.

## The language

Atom covers the complete Z80 instruction set claimed by its AZM oracle,
including indexed, CB and ED forms. Its source language provides global and
period-prefixed private labels, `EQU`, `ORG`, `DB`, `DW`, `DS`, `ALIGN`,
`INCBIN`, character and string data, arithmetic expressions and `LOW()` and
`HIGH()`.

Host directives beginning with `%` select dependencies and conditional source.
They are resolved before the native assembler reads the stream. Included files
remain distinct source parts, so diagnostics and D8 mappings retain their
original filenames and positions.

## Read and use

- [Atom Book 1 — Assembler Reference](/atom-book/book1/) defines the command,
  source language, output formats and JavaScript API.
- [Atom Book 2 — Z80 Programming](/atom-book/book2/) begins with registers and
  opcodes, then develops complete routines, algorithms and recursion.
- [Atom Books](/atom-book/) is the shelf for the reference and teaching books.
- [Atom on npm](https://www.npmjs.com/package/atom-z80) provides the current
  package and version history.
- [Atom source](https://github.com/jhlagado/atom) contains the Z80 core, host,
  engineering manual and correctness proofs.

Atom is licensed under GPL-3.0-only.
