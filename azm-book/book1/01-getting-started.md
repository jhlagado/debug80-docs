---
layout: default
title: "Getting Started with AZM"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 1
---

# Getting Started with AZM

AZM is a modern Z80 assembler for the Debug80 toolchain. An assembler turns assembly source into machine-code bytes. AZM also produces metadata that helps Debug80 connect source to generated code.

---

## Installing AZM

AZM requires Node.js 20 or later. A global installation makes the `azm` command available from any project:

```sh
npm install -g @jhlagado/azm
```

The version command confirms that the installation is available:

```sh
azm --version
```

From a source checkout, the following commands build and run the local CLI directly:

```sh
npm ci
npm run build
npm run azm -- examples/hello.asm
```

---

## A first AZM program

Here is a small but complete AZM source file:

```asm
; counter.asm - increment a counter eight times

        .org $0100

LIMIT   .equ 8

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

### Assembly

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

![The four files one assembly run writes next to the source](../../assets/images/azm-book/book2/assembler-outputs.svg)

### Assembler output

To trace through the assembly: `ld b,LIMIT` assembles to `$06 $08` at `$0100`; `ld hl,Counter` assembles to `$21 $09 $01` at `$0102` (the address `$0109`, little-endian); `inc (hl)` is `$34` at `$0105`; `djnz _loop` is `$10 $FD` at `$0106`; `halt` is `$76` at `$0108`; and `.db 0` places a zero byte at `$0109`.

Placing data after the final instruction keeps the executable entry near the start of the binary, which suits loaders that begin execution at the load address. AZM resolves forward references, so `ld hl,Counter` at the top can name a label defined further down.

---

## Source file extensions

AZM accepts `.asm` and `.z80` source extensions and parses them identically. Debug80 can discover either extension as a target source file; files named `main.asm` or `main.z80` are suggested as likely entry points. For new source, `.asm` is the conventional choice, while `.z80` is also useful for source shared with ASM80-compatible tools.

`.asmi` files carry external register contract records for library routines whose source is assembled separately. The `--interface` option loads them. Chapter 6 covers the format.

---

## The Debug80 connection

Debug80 is the companion debugging tool for this toolchain. It reads the `.d8.json` file that AZM emits alongside each binary (a map of addresses, symbols and source line positions) and uses it to show you source-correlated debug information: which line the program counter is on, what a symbol resolves to, where a routine was defined.

When assembly takes place outside Debug80, the `.d8.json` file still appears next to the binary. The `--nod8m` option suppresses it when no source map is required.
