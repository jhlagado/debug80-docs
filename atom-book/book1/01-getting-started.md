---
layout: default
title: "Getting Started with Atom"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 1
---

# Getting Started with Atom

Atom has a Node-hosted desktop command and a native CP/M 2.2 command. Both run
the same Z80 assembler core and accept the same assembly language.

## Install the desktop command

The desktop command requires Node.js 20 or later. Install the public package:

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
atom counter.asm
```

With no output argument, Atom writes `build/counter.bin`. Ask for other formats
by naming them after the input:

```sh
atom counter.asm build/counter.bin build/counter.hex build/counter.lst
```

Atom writes only those three files. Open the listing to compare source lines
with their addresses and bytes, or load the BIN or HEX file in a debugger.
[Chapter 6](06-diagnostics-and-output.md) defines each output format.

The first instruction is `$06 $08` at `$4000`. `LD HL,COUNTER` is `$21 $09
$40`, encoding `$4009` in little-endian order. `INC (HL)` is `$34`, `DJNZ
.LOOP` is `$10 $FD`, and `HALT` is `$76`. The final `DB 0` places one zero byte
at `$4009`.

## Projects and paths

Atom resolves source and binary paths inside a project root. For a direct
command, the current working directory is the root. The first positional
argument names the entry source; later positional arguments name outputs:

```sh
atom src/main.asm build/main.bin build/main.d8.json
```

Atom uses the ordinary `.asm` extension. A host such as Debug80 selects the
assembler flavour from project configuration rather than from the filename.
The `atom` command selects Atom explicitly; it does not guess the source format
from the filename or its contents.

For a repeatable desktop build, put the entry, target and outputs in a JSON
project file:

```json
{
  "assembler": "atom",
  "entry": "src/main.asm",
  "target": "generic",
  "outputs": ["build/main.bin", "build/main.d8.json"]
}
```

```sh
atom --project atom.json
```

Project paths are relative to the JSON file. JSON project files belong to the
desktop host; native CP/M Atom does not contain a JSON parser.

## Run Atom on CP/M

The `atom-z80` package includes `assets/atom-cpm22.com`. Copy that file to a
CP/M disk as `ATOM.COM`. The native command uses current-drive 8.3 filenames:

```text
ATOM
ATOM SOURCE
ATOM SOURCE OUTPUT
ATOM ?
```

With no arguments, Atom reads `INPUT.ASM` and writes `OUTPUT.COM`. With one
name, `ATOM HELLO` reads `HELLO.ASM` and writes `HELLO.COM`. An explicit output
may end in `.COM`, `.BIN` or `.HEX`:

```text
A>ATOM HELLO.ASM HELLO.HEX

HELLO.HEX written
```

The native command writes one output at a time. COM output is a raw CP/M image
loaded at `$0100`; it has no header. Source intended for a COM file must use
the CP/M address layout, normally beginning with `ORG 100H`.

The next chapter defines Atom source lines and symbol scope.
