---
layout: default
title: "Machine Code"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 2
---

# Machine Code

A program is a sequence of bytes in memory.

---

## Opcodes and Operands

The **opcode** byte, sometimes with a prefix byte, identifies the instruction and
its operand form. Some instructions consist only of an opcode. Others include
additional operand bytes carrying a constant, memory address or displacement.

A few examples from the Z80 instruction set:

| Byte sequence | Instruction  | What it does                        |
| ------------- | ------------ | ----------------------------------- |
| `$3E N`       | `LD A, N`    | Load the constant value `N` into A  |
| `$06 N`       | `LD B, N`    | Load the constant value `N` into B  |
| `$47`         | `LD B, A`    | Copy A into B                       |
| `$80`         | `ADD A, B`   | Add B to A; result goes into A      |
| `$32 LO HI`   | `LD (NN), A` | Store A at the 16-bit address `NN`  |
| `$3A LO HI`   | `LD A, (NN)` | Load A from the 16-bit address `NN` |
| `$76`         | `HALT`       | Suspend execution until interrupt or reset |

Address operands follow the little-endian convention from Chapter 1: low byte
first, high byte second. The address `$8000` appears in the
instruction stream as `$00 $80`. For a searchable reference of the full Z80
instruction set, see [Appendix 10](../appendices/10-z80-instruction-reference.md).

---

## A Complete Hex Program

Here is a complete Z80 program written entirely as bytes, placed in memory starting at address `$0000`.

```asm
$0000:  3E 05        ; LD A, 5         - load 5 into A
$0002:  47           ; LD B, A         - copy A into B; B now holds 5, A holds 5
$0003:  3E 03        ; LD A, 3         - load 3 into A; B still holds 5
$0005:  80           ; ADD A, B        - A = A + B = 3 + 5 = 8
$0006:  32 00 80     ; LD ($8000), A   - store A at address $8000
$0009:  76           ; HALT
```

### Stepping Through It

The CPU starts with PC = `$0000`.

**PC = `$0000`:** The byte there is `$3E`. The Z80 recognises this as a two-byte instruction: "load the next byte into A." It reads the following byte, `$05` and loads 5 into A. PC advances to `$0002`.

**PC = `$0002`:** The byte is `$47`: "copy A into B." One byte, opcode only. B becomes 5; A remains 5. PC advances to `$0003`.

**PC = `$0003`:** `$3E $03` loads 3 into A. B is unchanged and still holds 5. PC advances to `$0005`.

**PC = `$0005`:** `$80` adds B to A. The Z80 adds the contents of B (5) to the contents of A (3) and puts the result (8) into A. The flags register is updated: Zero is clear (8 ≠ 0), Carry is clear (8 < 256), Sign is clear (bit 7 of 8 is 0). PC advances to `$0006`.

**PC = `$0006`:** `$32 $00 $80` stores A at a 16-bit address. The opcode `$32` is followed by two address bytes: `$00` (low) and `$80` (high), giving address `$8000`. The value 8 is written to memory location `$8000`. PC advances to `$0009`.

**PC = `$0009`:** `$76` is HALT. Normal instruction execution stops until an
interrupt or reset. Address `$8000` now contains `$08`.

![The same ten bytes, bracketed into the six instructions the CPU decodes them as.](../../assets/images/atom-book/book2/hex-program.svg)

---

## The Cost of Raw Machine Code

The program above was ten bytes. Real programs are thousands. Every address is
a bare number. `$8000` could be a result variable, a display buffer or a lookup
table, and the byte stream records only the number. Inserting one instruction may
shift downstream addresses; a missed manual update sends the program to the
wrong address, and it runs on from there. You learn what
`3E 05 47 3E 03 80 32 00 80 76` does by decoding it one byte at a time.

Machine code contains jumps, calls, loops and conditionals; in raw bytes each
one is an address you calculate by hand and an instruction pattern you
recognise by eye.

---

## The address problem

From the CPU's point of view, a variable is one or more bytes at a numeric
address. In the program above, `$8000` is embedded in the instruction at
`$0006`. Moving the result to `$8100` means finding and changing those address
bytes by hand. A jump target presents the same problem: inserting code changes
its address and every raw branch that refers to it.

Assembly language gives instruction bytes readable names and lets names stand
for addresses. The next chapter rewrites this program in Atom, where the
assembler calculates the address bytes.

---

## Exercise

**Decode a byte stream.** Decoding this program should place each instruction
beside its starting address:

```asm
3E 12 47 3E 05 80 32 10 80 76
```

The completed trace should also give the final values in A and B and the byte
stored at `$8010`.

[Exercise notes](exercise-notes.md#chapter-2-machine-code)
