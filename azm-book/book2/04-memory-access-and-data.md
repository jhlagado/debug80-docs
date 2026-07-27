---
layout: default
title: "Memory Access and Data"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 4
---

# Memory Access and Data Representation

Scanning a table, processing a string or reading from hardware all require reaching into memory, and the Z80 has several specific ways to do it.

---

## Memory access through HL

`(HL)` means the byte at the address HL holds. You can read or write it directly.

```asm
ld a, (hl)     ; A = byte at address HL
ld (hl), a     ; byte at address HL = A
ld b, (hl)     ; B = byte at address HL
ld (hl), 19    ; byte at address HL = 19
```

Any of A, B, C, D, E, H, L can appear on either side when the other side is `(HL)`. The standard pattern is: load an address into HL, read or write with `(HL)`, increment HL, repeat. Chapter 7 builds on this pattern heavily when working with byte tables.

IX and IY support displaced addressing: `(ix+d)` reads the byte at address IX + d without changing IX. Chapter 7 covers this in full when the use case makes it concrete.

> **Parentheses in `ld` memory operands**
>
> In these `ld` forms, parentheses mean "use memory at this address."
>
> `ld a, b` copies register B into A, no memory involved.
> `ld a, (hl)` reads the _byte at the address held in HL_ from memory.
>
> Adding or removing parentheses may select a different legal instruction.
> The intended addressing mode therefore needs verification whenever memory is involved. Parentheses
> can mean something else in indirect jump and I/O forms.

---

## Memory access through BC or DE

Only A works with `(BC)` or `(DE)`:

```asm
ld a, (bc)     ; A = byte at address BC
ld (de), a     ; byte at address DE = A
```

These are compact single-byte opcodes with A hardcoded in the instruction encoding. The Z80 has no opcodes for `ld b, (bc)` or any other register with those indirect modes; the assembler will tell you if you try.

---

## Direct memory address

You can load A from a fixed 16-bit address, or store it to one. Register pairs can also transfer both bytes in one instruction (little-endian, as always):

```asm
ld a, ($8000)      ; A = byte at $8000
ld ($8001), a      ; byte at $8001 = A
ld hl, ($8002)     ; HL = word at $8002–$8003
ld ($8004), bc     ; word at $8004–$8005 = BC
```

When you write `ld a, (count)`, the assembler substitutes the address that `count` was assigned and emits a direct-address load.

---

## Two memory locations cannot be combined

There is no instruction that copies one memory address directly to another. A register must carry the value between them:

```asm
; No such instruction: ld ($8001), ($8000)

; Do this instead:
ld a, ($8000)
ld ($8001), a
```

Both this and the `(BC)`/`(DE)` restriction follow from the specific operand
combinations encoded by the Z80 instruction set. There is no general rule that
every source and destination pairing is legal.
[Appendix 4](../appendices/04-classic-z80-instruction-support.md) has the complete searchable list.

---

## Summary of LD forms

| Form         | Example          | Notes                           |
| ------------ | ---------------- | ------------------------------- |
| reg8 ← reg8  | `ld a, b`        | Any 8-bit register to any other |
| reg8 ← n     | `ld b, $FF`      | Immediate 8-bit constant        |
| reg16 ← nn   | `ld hl, $8000`   | Immediate 16-bit constant       |
| reg8 ← (HL)  | `ld c, (hl)`     | Read byte at address HL         |
| (HL) ← reg8  | `ld (hl), d`     | Write byte to address HL        |
| (HL) ← n     | `ld (hl), 0`     | Write immediate to address HL   |
| A ← (BC)     | `ld a, (bc)`     | Read byte at address BC; A only |
| (DE) ← A     | `ld (de), a`     | Write A to address DE; A only   |
| A ← (nn)     | `ld a, ($8000)`  | Read byte from fixed address    |
| (nn) ← A     | `ld ($8001), a`  | Write A to fixed address        |
| reg16 ← (nn) | `ld hl, ($8002)` | Read 16-bit word from memory    |
| (nn) ← reg16 | `ld ($8004), hl` | Write 16-bit word to memory     |
| SP ← reg16   | `ld sp, hl`      | SP = HL (or IX or IY)           |

For a compact LD quick table and the full addressing-shape reference, see [Appendix 3](../appendices/03-addressing-prefixes-and-instruction-forms.md).

![Where each form finds its data. The first two differ by a pair of brackets: one loads the number, the other loads whatever is at that address.](../../assets/images/azm-book/book2/addressing-modes.svg)

---

## Signed and Unsigned Values

As an **unsigned** value, the byte holds 0 to 255. The bit pattern `$FF` is 255.

As a **signed** value using two's complement, bit 7 is the sign bit. If bit 7 is 0 the value is positive (0 to 127). If bit 7 is 1 the value is negative (−128 to −1). The bit pattern `$FF` is −1. The bit pattern `$80` is −128.

Two's complement negation inverts every bit and adds one. The two's complement
of `$01` (`%00000001`) is `%11111110 + 1 = %11111111 = $FF`, which is −1.

`add a, b` performs the same bitwise addition regardless. The result byte is identical whether the inputs are treated as signed or unsigned. The difference surfaces with `$80 + $01`, which gives `$81`: its unsigned meaning is 128 + 1 = 129, while its signed meaning is −128 + 1 = −127. The bug appears when one part of a program writes a value as signed and another reads it as unsigned. The common landmark values (`$00`, `$7F`, `$80`, `$FF`) and their signed and unsigned meanings are in
[Appendix 2](../appendices/02-registers-flags-and-conditions.md).

---

## The Example: `examples/02_constants_and_labels.asm`

```asm
MaxCount .equ 10

.org $0000
main:
  ld a, MaxCount
  ld (count), a

  ld hl, $1234
  ld (scratch), hl

  ld hl, (scratch)
  halt

.org $8000
count:   .db 0
scratch: .dw 0
```

With `ld a, MaxCount`, the assembler sees `MaxCount`, defined with `.equ 10`, and writes 10 into the instruction. This is an immediate load; no memory access happens.

`ld (count), a` stores A at the address of `count`. This is a direct-address write: the `(nn) ← A` form from the table above. `count` resolves to `$8000`.

`ld (scratch), hl` stores the two-byte value in HL into `scratch`. `.dw 0`
emitted two initialized bytes for `scratch`: `$8001` and `$8002`. This uses the
`(nn) ← reg16` form.

`ld hl, (scratch)` reads the word back from `scratch`. After this instruction, HL holds `$1234` again. This uses the `reg16 ← (nn)` form.

After the program runs: `$8000` holds `10` (`$0A`) and `$8001`–`$8002` hold `$1234` (little-endian: `$34` at `$8001`, `$12` at `$8002`).

---

## Branching in Chapter 5

Every program so far has done its work in a straight line. Chapter 5 adds
branches based on zero, ordering and carry conditions.

---

## Exercises

**1. Memory form identification.** The task is to classify each instruction with the LD forms table, identify its row and state whether it reads from or writes to memory.

```asm
ld a, (hl)
ld (hl), b
ld a, (bc)
ld ($8010), a
ld de, ($8020)
```

**2. The illegal instruction.** Four of these five `ld` instructions assemble without error. The answer should identify the rejected form and explain the restriction:

```asm
ld a, (hl)
ld (hl), b
ld ($8000), (hl)
ld hl, (scratch)
ld b, $FF
```

_(Hint: re-read the two-memory-locations section and the note about what `ld` cannot do.)_

**3. Signed or unsigned?** Each byte below needs both its unsigned interpretation (0–255) and its signed two's-complement interpretation (−128 to +127):

- `$00`
- `$7F`
- `$80`
- `$FF`

Which of these values has the same meaning under both interpretations? Which has the most dramatically different meanings?

**4. Word-store trace.** The following sequence determines the bytes at `$8050` and `$8051`:

```asm
ld hl, $ABCD
ld ($8050), hl
```

What value is stored at address `$8050`? What value is stored at `$8051`? Which is the low byte and which is the high byte? (The Z80 stores 16-bit values little-endian, low byte first.)
