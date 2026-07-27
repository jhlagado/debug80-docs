---
layout: default
title: "Machine Code"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 2
---

# Chapter 2 — Machine Code

A program is a sequence of bytes in memory.

---

## Opcodes and Operands

The **opcode** byte, sometimes with a prefix byte, identifies the instruction and
its operand form. Some instructions consist only of an opcode. Others include
additional operand bytes carrying a constant, memory address or displacement.

A few examples from the Z80 instruction set:

| Byte sequence | Instruction  | What it does                        |
| ------------- | ------------ | ----------------------------------- |
| `$3E n`       | `ld a, n`    | Load the constant value `n` into A  |
| `$06 n`       | `ld b, n`    | Load the constant value `n` into B  |
| `$47`         | `ld b, a`    | Copy A into B                       |
| `$80`         | `add a, b`   | Add B to A; result goes into A      |
| `$32 lo hi`   | `ld (nn), a` | Store A at the 16-bit address `nn`  |
| `$3A lo hi`   | `ld a, (nn)` | Load A from the 16-bit address `nn` |
| `$76`         | `halt`       | Suspend execution until interrupt or reset |

Address operands always follow the Z80's little-endian convention: low byte first, high byte second. The address `$8000` appears in the instruction stream as `$00 $80`. For a searchable reference of the full Z80 instruction set, see [Appendix 4](../appendices/04-classic-z80-instruction-support.md).

---

## A Complete Hex Program

Here is a complete Z80 program written entirely as bytes, placed in memory starting at address `$0000`.

```asm
$0000:  3E 05        ; LD A, 5         — load 5 into A
$0002:  47           ; LD B, A         — copy A into B; B now holds 5, A holds 5
$0003:  3E 03        ; LD A, 3         — load 3 into A; B still holds 5
$0005:  80           ; ADD A, B        — A = A + B = 3 + 5 = 8
$0006:  32 00 80     ; LD ($8000), A   — store A at address $8000
$0009:  76           ; HALT
```

### Stepping Through It

The CPU starts with PC = `$0000`.

**PC = `$0000`:** The byte there is `$3E`. The Z80 recognises this as a two-byte instruction: "load the next byte into A." It reads the following byte, `$05` and loads 5 into A. PC advances to `$0002`.

**PC = `$0002`:** The byte is `$47`: "copy A into B." One byte, no operand. B becomes 5; A remains 5. PC advances to `$0003`.

**PC = `$0003`:** `$3E $03` loads 3 into A. B is unchanged and still holds 5. PC advances to `$0005`.

**PC = `$0005`:** `$80` adds B to A. The Z80 adds the contents of B (5) to the contents of A (3) and puts the result (8) into A. The flags register is updated: Zero is clear (8 ≠ 0), Carry is clear (8 < 256), Sign is clear (bit 7 of 8 is 0). PC advances to `$0006`.

**PC = `$0006`:** `$32 $00 $80` stores A at a 16-bit address. The opcode `$32` is followed by two address bytes: `$00` (low) and `$80` (high), giving address `$8000`. The value 8 is written to memory location `$8000`. PC advances to `$0009`.

**PC = `$0009`:** `$76` is HALT. Normal instruction execution stops until an
interrupt or reset. Address `$8000` now contains `$08`.

![The same ten bytes, bracketed into the six instructions the CPU decodes them as.](../../assets/images/azm-book/book2/hex-program.svg)

---

## The Cost of Raw Machine Code

The program above was ten bytes. Real programs are thousands. Every address is
a bare number. `$8000` could be a result variable, a display buffer or a lookup
table, and nothing in the byte stream says which. Inserting one instruction may
shift downstream addresses; a missed manual update makes the program use the
wrong address without producing an error. The sequence
`3E 05 47 3E 03 80 32 00 80 76` means nothing until you decode each byte.

Machine code contains jumps, calls, loops and conditionals, but raw bytes give
those structures no names. You must calculate their addresses and recognise
their instruction patterns by hand.

---

## Variables and Labels

From the CPU's point of view, a variable is just a byte (or several bytes) of memory at some address. The only way to refer to it is by its numeric address.

In the program above, the result was written to the fixed address `$8000`. But `$8000` is embedded as raw bytes in the instruction at `$0006`. If you later decide the result should live at `$8100` instead, you must find that instruction and change bytes `$07` and `$08` by hand. If you have fifty instructions referencing the same address, you change fifty places.

Assembly solves this with **labels**. A label is a name that the assembler associates with a particular address at assembly time. Everywhere you write the label, the assembler substitutes the correct address automatically. If the variable moves, you update the label's definition and every reference updates with it.

In a Z80 assembler a label definition looks like this:

```asm
Result:          ; the assembler records "Result" as the current address
  .db 0          ; allocate one byte at this address, initial value 0
```

(`.db` stands for "define byte". `.dw` defines a 16-bit word.) From this point on, writing `ld (Result), a` in the code is equivalent to writing `ld ($8000), a`, but you never have to know or write `$8000`.

Labels also name positions within the code, the targets of jumps and branches. Instead of writing `jp $0034`, you write `jp loop_top` and the assembler works out the address of `loop_top` itself.

---

## Assembly in Chapter 3

The hex program you just decoded by hand appears again in Chapter 3, this time written in AZM, with names where the numbers were.
