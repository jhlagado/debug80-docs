---
layout: default
title: "Memory Access and Data"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 4
---

# Memory Access and Data Representation

Scanning a table, processing a string or reading from hardware all require reaching into memory, and the Z80 has several specific ways to do it.

---

## Memory access through HL

`(HL)` means the byte at the address HL holds. You can read or write it directly.

```asm
LD A, (HL)     ; A = byte at address HL
LD (HL), A     ; byte at address HL = A
LD B, (HL)     ; B = byte at address HL
LD (HL), 19    ; byte at address HL = 19
```

Any of A, B, C, D, E, H, L can appear on either side when the other side is
`(HL)`. To process consecutive bytes, load an address into HL, read or write
with `(HL)`, increment HL and repeat. Chapter 7 applies this sequence to byte
tables.

IX and IY support displaced addressing: `(IX+D)` reads the byte at address IX + d while IX keeps its value. Chapter 7 covers this in full when the use case makes it concrete.

> **Parentheses in `LD` memory operands**
>
> In these `LD` forms, parentheses mean "use memory at this address."
>
> `LD A, B` copies register B into A, no memory involved.
> `LD A, (HL)` reads the _byte at the address held in HL_ from memory.
>
> Adding or removing parentheses may select a different legal instruction, so
> the operand form is worth checking whenever memory is involved. In indirect
> jump and I/O forms, parentheses mark a jump target or a port number.

---

## Memory access through BC or DE

Only A works with `(BC)` or `(DE)`:

```asm
LD A, (BC)     ; A = byte at address BC
LD (DE), A     ; byte at address DE = A
```

These are compact single-byte opcodes with A hardcoded in the instruction encoding, and the assembler rejects any other register in those forms.

---

## Direct memory address

You can load A from a fixed 16-bit address, or store it to one. Register pairs can also transfer both bytes in one instruction (little-endian, as always):

```asm
LD A, ($8000)      ; A = byte at $8000
LD ($8001), A      ; byte at $8001 = A
LD HL, ($8002)     ; HL = word at $8002-$8003
LD ($8004), BC     ; word at $8004-$8005 = BC
```

When you write `LD A, (COUNT)`, the assembler substitutes the address that `COUNT` was assigned and emits a direct-address load.

---

## Memory to memory goes through a register

A register has to carry the value from one memory location to another; the Z80 has no direct memory-to-memory `LD`:

```asm
; NO SUCH INSTRUCTION: LD ($8001), ($8000)

; Do this instead:
LD A, ($8000)
LD ($8001), A
```

Both this and the `(BC)`/`(DE)` restriction follow from the specific operand
combinations encoded by the Z80 instruction set.
[Appendix 10](../appendices/10-z80-instruction-reference.md) has the complete searchable list.

---

## Summary of LD forms

| Form         | Example          | Notes                           |
| ------------ | ---------------- | ------------------------------- |
| reg8 ← reg8  | `LD A, B`        | Any 8-bit register to any other |
| reg8 ← n     | `LD B, $FF`      | Immediate 8-bit constant        |
| reg16 ← nn   | `LD HL, $8000`   | Immediate 16-bit constant       |
| reg8 ← (HL)  | `LD C, (HL)`     | Read byte at address HL         |
| (HL) ← reg8  | `LD (HL), D`     | Write byte to address HL        |
| (HL) ← n     | `LD (HL), 0`     | Write immediate to address HL   |
| A ← (BC)     | `LD A, (BC)`     | Read byte at address BC; A only |
| (DE) ← A     | `LD (DE), A`     | Write A to address DE; A only   |
| A ← (nn)     | `LD A, ($8000)`  | Read byte from fixed address    |
| (nn) ← A     | `LD ($8001), A`  | Write A to fixed address        |
| reg16 ← (nn) | `LD HL, ($8002)` | Read 16-bit word from memory    |
| (nn) ← reg16 | `LD ($8004), HL` | Write 16-bit word to memory     |
| SP ← reg16   | `LD SP, HL`      | SP = HL (or IX or IY)           |

For a compact LD quick table and the full addressing-shape reference, see [Appendix 9](../appendices/09-addressing-prefixes-and-instruction-forms.md).

![Where each form finds its data. The first two differ by a pair of brackets: one loads the number, the other loads whatever is at that address.](../../assets/images/azm-book/book2/addressing-modes.svg)

---

## Signed and Unsigned Values

As an **unsigned** value, the byte holds 0 to 255. The bit pattern `$FF` is 255.

As a **signed** value using two's complement, bit 7 is the sign bit. If bit 7 is 0 the value is positive (0 to 127). If bit 7 is 1 the value is negative (−128 to −1). The bit pattern `$FF` is −1. The bit pattern `$80` is −128.

Two's complement negation inverts every bit and adds one. The two's complement
of `$01` (`%00000001`) is `%11111110 + 1 = %11111111 = $FF`, which is −1.

`ADD A, B` performs the same bitwise addition regardless. The result byte is identical whether the inputs are treated as signed or unsigned. The difference surfaces with `$80 + $01`, which gives `$81`: its unsigned meaning is 128 + 1 = 129, while its signed meaning is −128 + 1 = −127. The bug appears when one part of a program writes a value as signed and another reads it as unsigned. The common landmark values (`$00`, `$7F`, `$80`, `$FF`) and their signed and unsigned meanings are in
[Appendix 8](../appendices/08-registers-flags-and-conditions.md).

---

## Worked example

```asm
MAXCOUNT EQU 10

ORG $0000
MAIN:
  LD A, MAXCOUNT
  LD (COUNT), A

  LD HL, $1234
  LD (SCRATCH), HL

  LD HL, (SCRATCH)
  HALT

ORG $8000
COUNT:   DB 0
SCRATCH: DW 0
```

With `LD A, MAXCOUNT`, the assembler substitutes the value 10 from the `EQU`
definition. This is an immediate load: the 10 travels inside the instruction
bytes.

`LD (COUNT), A` stores A at the address of `COUNT`. This is a direct-address write: the `(NN) ← A` form from the table above. `COUNT` resolves to `$8000`.

`LD (SCRATCH), HL` stores the two-byte value in HL into `SCRATCH`. `DW 0`
emitted two initialized bytes for `SCRATCH`: `$8001` and `$8002`. This uses the
`(NN) ← REG16` form.

`LD HL, (SCRATCH)` reads the word back from `SCRATCH`. After this instruction, HL holds `$1234` again. This uses the `REG16 ← (NN)` form.

After the program runs: `$8000` holds `10` (`$0A`) and `$8001`–`$8002` hold `$1234` (little-endian: `$34` at `$8001`, `$12` at `$8002`).

---

## Exercise

**Memory form identification.** Each instruction should be matched to a row
in the LD forms table, with the memory action and the register or address that
selects the location.

```asm
LD A, (HL)
LD (HL), B
LD A, (BC)
LD ($8010), A
LD DE, ($8020)
```

[Exercise notes](exercise-notes.md#chapter-4-memory-access-and-data)
