---
layout: default
title: "Getting Started with Atom"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 1
---

# Getting Started with Atom

Atom is published as a Mac command-line assembler requiring Node.js 20 or
later. The installed package contains the native Z80 core and the Debug80
runtime used to execute it. AZM remains a development oracle and is absent from
the installed package.

## Installation

Install the public package:

```sh
npm install --global atom-z80
```

The installed command is `atom`.

## A first Atom program

Save this source as `counter.asm`:

```asm
ORG 4000H

LIMIT EQU 8

START:
    LD B,LIMIT
    LD HL,COUNTER
.LOOP:
    INC (HL)
    DJNZ .LOOP
    HALT

COUNTER:
    DB 0
```

Assemble it from the directory containing the file:

```sh
atom --origin 4000H counter.asm
```

Atom publishes one immutable generation below `build/counter.atom/current`:

| File | Contents |
| --- | --- |
| `counter.nobj` | Append-only Atom object stream |
| `counter.bin` | Contiguous flat image |
| `counter.hex` | Intel HEX |
| `counter.lst` | Source listing |
| `counter.d8.json` | Debug80 source and symbol map |
| `manifest.json` | Artifact byte counts and SHA-256 values |

The first instruction is `$06 $08` at `$4000`. `LD HL,COUNTER` is `$21 $09
$40`, encoding `$4009` in little-endian order. `INC (HL)` is `$34`, `DJNZ
.LOOP` is `$10 $FD`, and `HALT` is `$76`. The final `DB 0` places one zero byte
at `$4009`.

## Project root and entry source

Atom resolves source and binary paths inside a project root. Without `--root`,
the current working directory is the root. The final command argument names the
entry source:

```sh
atom --root . --origin 4000H src/main.asm
```

Atom uses the ordinary `.asm` extension. A host such as Debug80 selects the
assembler flavour from project configuration rather than from the filename.
The command itself parses the named file by content and does not require a
particular extension.

## Native self-assembly

The installed package carries a generated Atom-syntax form of its native core.
This command assembles it using Atom:

```sh
atom --self-host
```

The resulting `atom.bin` is 12,101 bytes and must match the pinned AZM-built
core byte for byte. Self-host mode fixes the origin, capacity, fill, entry, and
preprocessor state; only the output directory can be changed.

The next chapter defines Atom source lines and symbol scope.
