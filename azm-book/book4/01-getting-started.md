---
layout: default
title: "Chapter 1 — Getting Started with AZM"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 1
---
[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)

# Chapter 1 — Getting Started with AZM

If you have assembled Z80 source before, most of what AZM does will feel familiar. You write instruction mnemonics, directives, and labels in `.asm` files; AZM turns them into machine code. On top of that foundation, the tool adds structured tooling — layout types, register-care analysis, op declarations, and Debug80 source-map metadata — without hiding the bytes underneath. You can look at the listing after any assembly run and trace every byte back to the line that produced it.

This chapter gets you to a working assembly command quickly. The rest of the manual takes each feature in turn.

---

## What is AZM?

Every instruction in your source becomes bytes in the output. When you write `ld a,42`, the assembled binary contains the two bytes for that load. When you write `call DRAW_SPRITE`, those three bytes appear where you put them. AZM adds no preamble, generated stack frame, or implicit register saves.

That last point matters more than it sounds. When you write a Z80 program, you are managing eight or so usable registers and a flat 64K address space. A tool that moves bytes around without your knowledge breaks that contract. AZM leaves register management entirely to you — the directives and features it adds compute at assemble time and resolve to plain numbers before anything reaches the Z80.

## At a glance

The rules that govern AZM as a whole are compact enough to summarize. Skim the table below now; the chapters that follow each take one row and explain it in full.

A compact reference for AZM's core rules:

| Property | Rule |
|----------|------|
| Labels | Global, case-sensitive, unique across all included files |
| Entry labels | `@NAME:` marks a routine boundary; callable as `NAME` |
| Opcodes and registers | Case-insensitive |
| Directives | Canonical dotted lowercase (`.db`, `.equ`, `.org`); legacy undotted forms accepted via alias layer |
| Expressions | Compile-time only; symbolic operators: `+ - * / % & \| ^ ~ << >>` |
| Layouts | Compile-time constants only; no hidden loads or stores |
| Ops | Inline expansion at each call site; not subroutine calls |
| Register-care | Analysis and metadata; no byte changes unless `--fix` is requested |

---

## The Debug80 connection

Debug80 is the companion debugging tool for this toolchain. It uses the `.d8.json` metadata file that AZM emits alongside each binary — a map of addresses, symbols, and source line positions that Debug80 reads to display source-correlated debug information. When Debug80 assembles a file, it calls AZM. When you run AZM from the command line, the `.d8.json` file is ready for Debug80 to consume.

If you are assembling outside Debug80, the `.d8.json` file appears next to your binary and you can ignore it, or suppress it with `--nod8m`. If you are working inside Debug80, it is what makes source-level debugging possible — the debugger reads that file to map machine addresses back to source lines. Chapter 8 covers the full output set.

## Source file extensions

AZM accepts `.asm` and `.z80` source extensions and parses them identically. Within the Debug80 toolchain, `.z80` files carry a specific meaning: Debug80 treats them as entry points or assembly targets. For new source outside that toolchain context, `.asm` is the conventional choice.

`.asmi` files are register-care interface files, not source. They carry external contract records for library routines whose source is not assembled alongside your program. They are loaded with `--interface`, never with a bare entry path. The format is covered in Chapter 6.

With the file conventions settled, the fastest way to understand AZM is to look at a small program and trace what it becomes.

---

## A First AZM Program

Here is a small but complete AZM source file:

```asm
; counter.asm — increment a counter eight times

        .org $0100

LIMIT   .equ 8

@main:
        ld      b,LIMIT
        ld      hl,counter
Loop:
        inc     (hl)
        djnz    Loop
        halt

counter:
        .db 0
```

The source starts assembly at `$0100`, defines the constant `LIMIT`, marks `main` as the routine entry, loops eight times, and stores the counter byte after the code. The rest of the manual explains those forms in order: source syntax and labels in Chapter 2, addresses and constants in Chapter 3, data directives in Chapter 4, and register-care entry labels in Chapter 6.

The structure is intentional: code first, data after. The byte at `counter` sits below `halt` at address `$0109`. Placing data after the final instruction keeps entry points at the top of the binary where a loader expects them. AZM resolves forward references, so `ld hl,counter` at the top can name a label defined further down — the assembler fills in its address on a second pass. The listing confirms that the address was resolved correctly.

### Reading the listing

After running `azm counter.asm`, AZM writes `counter.lst` alongside the source. The listing is where source text and machine code meet: every symbolic name becomes an address, every directive becomes bytes or a gap. Learning to read it gives you a direct check on every assembly decision you make. The listing looks like this:

```
0100            1           .org $0100
                2
0100            3   LIMIT   .equ 8
                4
0100            5   @main:
0100 06 08      6           ld      b,LIMIT
0102 21 XX XX   7           ld      hl,counter
0105            8   Loop:
0105 34         9           inc     (hl)
0106 10 FD     10           djnz    Loop
0108 76        11           halt
                12
0109            13  counter:
0109 00        14          .db 0
```

The columns are: address (hex), emitted bytes (hex), source line number, source text. For `ld hl,counter`, the bytes `XX XX` show as the resolved address of `counter` at `$0109` — little-endian, low byte first: `09 01`. The listing is the best tool for verifying that code landed where you intended.

The address column tells you where each line assembled; the byte column tells you what bytes it produced. When something assembles wrong, the listing is where you find it. If `counter` had resolved to the wrong address, you would see it immediately in the byte column for line 7. Chapter 8 covers listings in full. For now, treat the listing as a post-assembly check: scan it after every build until reading it is a habit.

---

## Running AZM

Running AZM means one command: pass the entry file as the last argument. The sections below cover installation, the basic invocation, and how Debug80 calls AZM internally. If you are using Debug80 as your IDE, it handles the invocation for you; this section is for command-line builds, CI pipelines, and projects outside the Debug80 environment.

### Installing AZM

AZM requires Node.js 20 or later. Install it globally:

```sh
npm install -g @jhlagado/azm
```

Verify the installation:

```sh
azm --version
```

From a source checkout, build and run the local CLI without installing globally:

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

By default, AZM writes four output files next to the source:

| File | Contents |
|------|----------|
| `program.hex` | Intel HEX |
| `program.bin` | Flat binary |
| `program.lst` | Assembly listing with bytes and symbols |
| `program.d8.json` | Debug80 source map |

All four are the default artifact set. Chapter 8 covers output selection, suppression flags, Debug80 source paths, exit status, and artifact formats.

### How does Debug80 invoke AZM?

Debug80 calls AZM internally when assembling an open source file. It passes `--source-root` and `--output` with paths relative to the project root, producing a `.d8.json` alongside the binary. The CLI is for command-line builds, CI pipelines, and projects that run outside the Debug80 IDE.

---

[← Preface](00-preface.md) | [Manual](index.md) | [Source Syntax and Symbols →](02-source-syntax.md)
