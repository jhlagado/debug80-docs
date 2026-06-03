---
layout: default
title: "Chapter 1 — Getting Started with AZM"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 1
---
[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)

# Chapter 1 — Getting Started with AZM

AZM is a modern Z80 assembler for the Debug80 toolchain. An assembler turns assembly source into machine-code bytes. AZM also produces metadata that helps Debug80 connect source to generated code.

On top of that foundation, AZM adds structured layout, register contract analysis and op declarations while keeping every emitted byte explicit and every assemble-time computation traceable.

---

## The Debug80 connection

Debug80 is the companion debugging tool for this toolchain. It uses the `.d8.json` metadata file that AZM emits alongside each binary — a map of addresses, symbols and source line positions that Debug80 reads to display source-correlated debug information. When you run AZM from the command line, the `.d8.json` file is ready for Debug80 to consume.

If you are assembling outside Debug80, the `.d8.json` file appears next to your binary. Suppress it with `--nod8m` if you do not need it. Chapter 8 covers the full output set.

## Source file extensions

AZM accepts `.asm` and `.z80` source extensions and parses them identically. Within the Debug80 toolchain, `.z80` files carry a specific meaning: Debug80 treats them as entry points or assembly targets. For new source outside that toolchain context, `.asm` is the conventional choice.

`.asmi` files carry external register contract records for library routines whose source is assembled separately. Load them with `--interface`. The format is covered in Chapter 6.

---

## A first AZM program

Here is a small but complete AZM source file:

```asm
; counter.asm — increment a counter eight times

        .org $0100

LIMIT   .equ 8

@Main:
        ld      b,LIMIT
        ld      hl,Counter
Loop:
        inc     (hl)
        djnz    Loop
        halt

Counter:
        .db 0
```

The source starts assembly at `$0100`, defines the constant `LIMIT`, marks `main` as the routine entry, loops eight times and stores the counter byte after the code.

Code comes first, data after. The byte at `counter` sits below `halt` at address `$0109`. Placing data after the final instruction keeps entry points at the top of the binary where a loader expects them. AZM resolves forward references, so `ld hl,counter` at the top can name a label defined further down.

To trace through the assembly: `ld b,LIMIT` assembles to `$06 $08` at `$0100`; `ld hl,counter` assembles to `$21 $09 $01` at `$0102` (the address `$0109`, little-endian); `inc (hl)` is `$34` at `$0105`; `djnz Loop` is `$10 $FD` at `$0106`; `halt` is `$76` at `$0108`; and `.db 0` places a zero byte at `$0109`.

The rest of the manual explains those forms in order: source syntax and labels in Chapter 2, addresses and constants in Chapter 3, data directives in Chapter 4 and register contract entry labels in Chapter 6.

---

## Running AZM

Running AZM means one command: pass the entry file as the last argument. The sections below cover installation and the basic invocation.

### Installing AZM

AZM requires Node.js 20 or later. Install it globally:

```sh
npm install -g @jhlagado/azm
```

Verify the installation:

```sh
azm --version
```

From a source checkout, build and run the local CLI directly:

```sh
npm ci
npm run build
npm run azm -- examples/hello.asm
```

### Assemble a file

The entry file is always the last argument:

```sh
azm program.asm
```

By default, AZM writes three output files next to the source:

| File | Contents |
|------|----------|
| `program.hex` | Intel HEX |
| `program.bin` | Flat binary |
| `program.d8.json` | Debug80 source map |

Chapter 8 covers output selection, suppression flags, Debug80 source paths, exit status and artifact formats.

---

[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)
