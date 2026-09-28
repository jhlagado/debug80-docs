---
layout: default
title: "Getting Started with Atom"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 1
---

# Getting Started with Atom

An Atom source file contains Z80 instructions, labels and assembler directives.
Instructions produce machine code. Labels name addresses. Directives define
constants, place code or reserve storage.

For installation and build commands, use the [Node guide](../using-atom-on-node.md)
or [CP/M guide](../using-atom-on-cpm.md).

## A first Atom program

This program increments a byte eight times and halts. It uses a generic memory
layout beginning at `4000H`. It can be traced in a Z80 debugger but is not a
CP/M transient program, which would start at `100H` and return to CP/M.

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

`ORG` sets the address of the first instruction. `LIMIT EQU 8` declares a
constant without producing bytes. `START` names the first instruction and
`.LOOP` is a private label within that routine. `COUNTER` names the byte
initialised by `DB 0`.

The first instruction is `$06 $08` at `$4000`. `LD HL,COUNTER` is `$21 $09
$40`, encoding `$4009` in little-endian order. `INC (HL)` is `$34`, `DJNZ
.LOOP` is `$10 $FD` and `HALT` is `$76`. The final `DB 0` places one zero byte
at `$4009`.

Although `COUNTER` is declared after the instruction that uses it, Atom can
assemble that instruction. It reserves the address field and fills it when
the label is declared. Chapter 3 explains the restrictions on forward
references in expressions.

The [next chapter](02-source-syntax-and-symbols.md) defines source lines and
symbol scope.
