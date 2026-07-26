---
layout: default
title: "Getting Started with AZM"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 1
---
[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)

# Chapter 1 — Getting Started with AZM

AZM is a modern Z80 assembler for the Debug80 toolchain. An assembler turns assembly source into machine-code bytes. AZM also produces metadata that helps Debug80 connect source to generated code.

On that foundation it adds structured layout, register contract analysis and op declarations, while keeping every emitted byte explicit and every assemble-time computation traceable. You can always find out which bytes a line produced and how a number was arrived at.

---

## Installing AZM

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

---

## A first AZM program

Here is a small but complete AZM source file:

```asm
; counter.asm — increment a counter eight times

        .org $0100

LIMIT   .equ 8

.routine clobbers B,HL
Main:
        ld      b,LIMIT
        ld      hl,Counter
_loop:
        inc     (hl)
        djnz    _loop
        halt

Counter:
        .db 0
```

The source starts assembly at `$0100`, defines the constant `LIMIT`, marks `Main` as the routine entry, loops eight times and stores the counter byte after the code.

### Assemble it

The entry file is always the last argument:

```sh
azm counter.asm
```

By default, AZM writes four output files next to the source:

| File | Contents |
|------|----------|
| `counter.hex` | Intel HEX |
| `counter.bin` | Flat binary |
| `counter.d8.json` | Debug80 source map |
| `counter.lst` | Assembler listing |

Chapter 8 covers output selection, suppression flags, Debug80 source paths, exit status and artifact formats.

### What the assembler produced

To trace through the assembly: `ld b,LIMIT` assembles to `$06 $08` at `$0100`; `ld hl,Counter` assembles to `$21 $09 $01` at `$0102` (the address `$0109`, little-endian); `inc (hl)` is `$34` at `$0105`; `djnz _loop` is `$10 $FD` at `$0106`; `halt` is `$76` at `$0108`; and `.db 0` places a zero byte at `$0109`.

Code comes first, data after. The byte at `Counter` sits below `halt` at address `$0109`. Placing data after the final instruction keeps entry points at the top of the binary where a loader expects them. AZM resolves forward references, so `ld hl,Counter` at the top can name a label defined further down.

---

## Source file extensions

AZM accepts `.asm` and `.z80` source extensions and parses them identically. Within the Debug80 toolchain, `.z80` files carry a specific meaning: Debug80 treats them as entry points or assembly targets. For new source outside that toolchain context, `.asm` is the conventional choice.

`.asmi` files carry external register contract records for library routines whose source is assembled separately. Load them with `--interface`. The format is covered in Chapter 6.

---

## The Debug80 connection

Debug80 is the companion debugging tool for this toolchain. It reads the `.d8.json` file that AZM emits alongside each binary — a map of addresses, symbols and source line positions — and uses it to show you source-correlated debug information: which line the program counter is on, what a symbol resolves to, where a routine was defined.

If you are assembling outside Debug80, the `.d8.json` file still appears next to your binary. Suppress it with `--nod8m` if you do not need it.

---

The rest of the manual explains the forms used above, in order: source syntax and labels in Chapter 2, addresses and constants in Chapter 3, data directives in Chapter 4 and `.routine` register contracts in Chapter 6.

---

[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)
