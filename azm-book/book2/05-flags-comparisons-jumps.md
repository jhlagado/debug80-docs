---
layout: default
title: "Flags, Comparisons and Jumps"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 5
---

# Flags, Comparisons and Jumps

Z80 instructions record selected outcomes in the flags register. Conditional
jumps test those flags to choose the next instruction.

---

## The flags register

F holds eight bits. Each bit is called a flag and records one specific outcome
of the last instruction that changed flags. Instructions like `sub`, `cp`,
`and`, `or`, `xor`, `inc` and `dec` update them as a side effect.

The ordinary `ld` forms used so far do not touch the flags. Two specialised
forms introduced much later, `ld a,i` and `ld a,r`, are exceptions. `inc` and
`dec` update most flags but leave C unchanged. When a `jp` instruction tests a
flag, you need to know which earlier instruction set it and whether anything in
between might have changed it.

The four flags you will use most:

| Flag | Name            | Set when                                                             |
| ---- | --------------- | -------------------------------------------------------------------- |
| Z    | Zero            | Result is zero                                                       |
| C    | Carry           | Arithmetic produced a carry out of bit 7, or a borrow in subtraction |
| S    | Sign            | Bit 7 of the result is 1                                             |
| P/V  | Parity/Overflow | Result parity is even; or signed overflow occurred                   |

After `sub` or `cp`, Z is set
when the two values were equal. After `dec`, Z is set when a register reaches
zero. After `and`, Z is set when every bit the mask selected was 0.

![The eight bits of F. The two greyed bits are undocumented copies of result bits.](../../assets/images/azm-book/book2/flags-register.svg)

**C** records unsigned overflow. After addition, C is set when the result
exceeded 255, the carry out of bit 7. After `sub` or `cp`, C is set when A
was less than the subtracted value: the subtraction had to borrow.

**S** mirrors bit 7 of the result. In signed arithmetic bit 7 is the sign bit,
so S tells you whether the result was negative. When you are working with
unsigned values you can usually ignore S.

**P/V** has two unrelated meanings depending on which instruction set it. After
8-bit arithmetic it reports signed overflow. After logical instructions it
reports parity and is set when the result has an even number of 1 bits. Rotate
and shift forms differ in whether they update P/V, so the instruction
reference is the authority for each one.

For the full flags reference and all condition codes, see
[Appendix 6](../appendices/06-registers-flags-and-conditions.md).

---

## `sub` and `cp`: subtraction and comparison

`sub n` subtracts `n` from A, writes the result back into A and updates the
flags to reflect what happened.

```asm
ld a, 8
sub 3     ; A = 5; Z is clear (result non-zero), C is clear (no borrow)
```

```asm
ld a, 3
sub 5     ; A = $FE (-2); Z is clear, C is set (borrow - A was less than 5)
```

`cp n` does exactly the same subtraction and sets the same flags, but discards
the result.

![cp changes the flags and leaves A as it was. Carry is set when A is below the operand, because that is the case a borrow was needed.](../../assets/images/azm-book/book2/compare-and-branch.svg)

```asm
ld a, 5
cp 5      ; subtracts 5; Z is set (result is zero); A stays 5
```

```asm
ld a, 3
cp 5      ; subtracts 5; C is set (borrow); A stays 3
```

`sub` supplies the computed difference. `cp` supplies only the relationship
(equal, less than, greater than) without changing A.

---

## Logical operations: `and`, `or`, `xor`

`and`, `or` and `xor` each apply a bitwise operation between a mask value and A, store the result back in A, clear C and set Z if the result is zero.

`and n` keeps only the bits where the mask has 1, which isolates part of a
byte:

```asm
ld a, $F3          ; A = %11110011
and $0F            ; A = %00000011 - upper four bits cleared, lower four kept
```

`or n` sets bits where the mask has 1 and leaves others unchanged:

```asm
ld a, $03
or $80             ; A = %10000011 - bit 7 now set
```

`or a` is a useful special case: A ORed with itself always equals A, so A keeps
its value. Only the flags are updated: Z is set if A is zero, C is cleared.
`cp 0` tests for zero the same way and also leaves A alone; the two differ in
N, which `cp` sets and `or` clears.

```asm
ld a, 0
or a       ; Z is set because A is zero

ld a, $FF
or a       ; Z is clear because A is non-zero
```

`xor n` toggles bits where the mask has 1:

```asm
ld a, $FF
xor $0F            ; A = %11110000 - lower four bits flipped
```

The most-used form is `xor a`. A XOR'd against itself is always zero; every
bit cancels. `ld a, 0`
also zeros A but leaves the flags unchanged.

```asm
xor a              ; A = 0; Z is set; C is clear
```

All three instructions accept a register, an immediate byte, `(HL)` or an
index register form. The quick reference for arithmetic and logical instruction
forms is in [Appendix 7](../appendices/07-addressing-prefixes-and-instruction-forms.md).

---

## `jp`: moving execution to a new address

From Chapter 1 you know that the CPU always executes the instruction at the
address in PC, then advances PC to the next instruction. `jp` breaks that
sequence: it puts a new address into PC, and execution continues from there.

```asm
jp $8010      ; PC becomes $8010; next instruction comes from $8010
```

A label normally provides the target instead of a raw address:

```asm
jp done
; code written here is never reached
done:
  ...
```

The assembler works out the address of `done` and encodes it into the
instruction bytes.

On its own, an unconditional `jp` is mostly useful for two things: skipping
over a block of code (which becomes the else-half of a conditional structure),
or jumping back to an earlier address to repeat something.

---

## Conditional `jp`: testing the flags

A conditional `jp` works exactly like an unconditional one, with one addition:
before changing PC, it checks a flag. If the flag condition is met, PC changes
and execution continues from the target address. If it is not met, execution
continues with the instruction that immediately follows: the jump falls
through.

`jp z, target` checks Z. If Z is set, the jump happens.

`jp nz, target` is the inverse: it jumps when Z is clear and falls through when
Z is set. The `n` prefix means "not": `nz` is "not zero", `nc` is "not carry".

The condition codes you will use most:

| Code | Meaning            |
| ---- | ------------------ |
| `z`  | Jump if Z is set   |
| `nz` | Jump if Z is clear |
| `c`  | Jump if C is set   |
| `nc` | Jump if C is clear |

`jp` also supports `m` (S set) and `p` (S clear), which test the sign bit of the
preceding result. A general signed less-than or greater-than comparison also
has to account for signed overflow, which can flip the meaning of S. The `pe`
and `po` conditions test P/V; that flag represents
parity after some instructions and signed overflow after others. The full list
is in [Appendix 6](../appendices/06-registers-flags-and-conditions.md).

A `cp` or logical instruction sets a flag, after which a conditional `jp`
selects which block runs:

```asm
cp 5
jp nz, skip    ; A != 5: jump to skip
; ... this body runs only when A == 5 ...
skip:
```

`cp 5` subtracts 5 from A and sets Z if the result was zero, that is, if A
was 5. `jp nz` then jumps if Z is clear, which means A was not 5.

The condition on `jp` is the condition that causes the jump, not the condition
that runs the body.

`and` with a single-bit mask lets you test one specific bit of A and act on the
result:

```asm
ld a, (status)
and $04            ; keep only bit 2; Z is set if bit 2 was 0
jp z, bit_clear    ; bit 2 was 0 - go to bit_clear
```

If bit 2 was 1, the result is
non-zero, Z is clear and execution falls through.

---

> **The Flag-Before-Branch Check**
>
> A conditional jump (`jp cc`, `jr cc`) can be checked in three steps.
>
> **Step 1: Which instruction set the flag you're testing?**
> The scan starts at the jump and moves backward to the instruction that last modified
> the flag. Common candidates for Z include `cp`, `sub`, `and`, `or`, `xor`,
> `inc`, `dec`, `add`, `sbc` and `in r,(C)`. Common candidates for C include
> `cp`, `sub`, `add`, `adc`, `sbc`, `and`, `or`, `xor`, `rl*` and `rr*`.
>
> **Step 2: Does anything between that instruction and the jump also touch
> that flag?**
> The ordinary `ld` instructions used in this book are safe to place between a
> comparison and a jump. `inc` and `dec` update most flags but leave C alone.
> Arithmetic and logical instructions each update their own set of flags. If
> something in between modifies the flag you are testing, the jump will read
> the wrong value.
>
> **Step 3: Is the flag's meaning what you think it is?**
> C means different things after `add` (carry out of bit 7) versus after `cp`
> or `sub` (unsigned borrow, set when A was less than the operand). Z always
> means "result was zero," but "result" after `cp` is the discarded difference,
> not a stored value.

---

## Short relative jump: `jr`

`jp` encodes a full 16-bit target address in its three instruction bytes.
`jr` encodes only a signed 8-bit displacement, measured from the address
immediately after the `jr` instruction. This limits the target to 127 bytes
forward or 128 bytes backward from that following address, but the instruction
is one byte shorter than `jp`.

`jr nz, label` jumps to `label` if Z is clear. The conditional forms support
`z`, `nz`, `c` and `nc` only, fewer conditions than `jp`.

|                      | `jp`                       | `jr`                               |
| -------------------- | -------------------------- | ---------------------------------- |
| Address encoding     | Full 16-bit address        | Signed 8-bit displacement          |
| Instruction size     | 3 bytes                    | 2 bytes                            |
| Reach                | Anywhere in 64K            | ≈ 128 bytes backward / 127 forward |
| Conditions available | z, nz, c, nc, m, p, pe, po | z, nz, c, nc only                  |

For short loops and nearby tests, `jr` saves a byte per jump and the range is
rarely a problem. For anything that might be far away, or when you need `m`,
`p`, `pe` or `po`, `jp` is the safe choice. The assembler
will tell you if a `jr` target is out of range. Jump range limits for `jr` and
the related `djnz` instruction (Chapter 6) are in
[Appendix 6](../appendices/06-registers-flags-and-conditions.md).

---

## Detecting a negative number: the `cp $80` technique

A signed value in A may need conversion to its absolute value. A signed byte stores values from −128 to 127. Negative values have bit 7 set, which means their unsigned interpretation
is 128 or greater. You can test which half A falls in by comparing it against
128 as an unsigned value:

```asm
  cp $80              ; compare A (unsigned) against 128
  jr c, is_non_negative ; carry set means A < 128 -> non-negative
  neg                 ; negate A: A = -A
is_non_negative:
  ; A now holds the absolute value
```

If carry is clear, A is
128 or above, which means bit 7 is set and the value is negative.

This pattern works because signed and unsigned representations share the same
bits; the only difference is how you interpret bit 7. If A holds an unsigned value, this test gives
the wrong answer, since 128 through 255 are valid positive results in unsigned
arithmetic, and `cp $80` will treat them all as negative.

`neg` applied to −128 gives −128: the mathematical result (+128) does not fit
in a signed byte, so the bit pattern (`$80`) is unchanged.

![One byte, two readings. $80 is the pivot, and which side of it counts as negative depends entirely on the conditional jump you write next.](../../assets/images/azm-book/book2/signed-unsigned.svg)

---

## The example: `examples/03_flag_tests_and_jumps.asm`

```asm
Limit .equ 5

.org $0000
main:
  ld a, Limit
  cp 5
  jp nz, not_equal
  ld a, 1
  ld (found), a
  jp done_compare
not_equal:
  ld a, 0
  ld (found), a
done_compare:

  ld a, 0
  or a
  jp z, was_zero
  jp skip_zero
was_zero:
  ld a, $AA
skip_zero:

  ld b, Limit
loop_top:
  ld a, (counter)
  inc a
  ld (counter), a
  dec b
  jp nz, loop_top

  ld a, $F3
  and $0F
  ld a, $03
  or $80
  ld a, $FF
  xor $0F
  xor a
  halt

.org $8000
counter: .db 0
found:   .db 0
```

**Section A: equality test.** `ld a, Limit` loads 5 into A. `cp 5` subtracts 5
from A and sets Z. `jp nz, not_equal` tests
whether Z is clear: Z is set, so execution continues
through `ld a, 1 / ld (found), a`, then `jp done_compare` skips the else-block
and lands at `done_compare:`.

If A had held any value other than 5, Z would have been clear, `jp nz` would
have jumped to `not_equal:`, and `found` would have been set to 0.

**Section B: zero test with `or a`.** `ld a, 0` loads zero. `or a` sets Z
because A is zero. `jp z, was_zero` sees Z set and jumps to `was_zero:`.
`ld a, $AA` runs, marking A so you can confirm in a debugger that this
path was taken. Execution then falls through to `skip_zero:`. The earlier
`jp skip_zero` runs only when the zero test fails.

**Section C: counted loop with `dec` / `jp nz`.** `ld b, Limit` loads 5 into
B. At `loop_top:`, the body reads `counter` from RAM, increments it and stores
it back. `dec b` decrements B and sets Z when B reaches zero. `jp nz, loop_top`
jumps back to `loop_top:` while B is non-zero.

After five iterations, `counter` holds 5 and B holds 0.

`dec b` sets Z here, not `ld (counter), a`, which never touches flags at all.
This is exactly the situation the
flag-before-branch check is designed to catch.

**Section D: logical operations.** A is loaded with `$F3` (`%11110011`), then
`and $0F` clears bits 7–4 and keeps bits 3–0. Result: `$03`. Z is clear.

`ld a, $03` reloads A, resetting it to a known value before the next
demonstration. `or $80` sets bit 7 of A regardless of what was already there.
`$03 | $80 = $83`. Z is clear.

`ld a, $FF` reloads A again. `xor $0F` flips bits 3–0. `$FF ^ $0F = $F0`.
Z is clear.

`xor a` zeroes A, sets Z and clears C in one instruction.

---

## Counted Loops in Chapter 6

Chapter 6 shows the single instruction the Z80 provides for exactly the loop pattern built at the end of this chapter: decrement a counter, branch if not zero, fall through when done.

---

## Exercises

**1. Flag prediction.** This exercise predicts whether Z and C are set or clear after each instruction or short sequence before checking the result in an emulator:

```asm
ld a, 5
cp 5        ; Z = ? C = ?

ld a, 5
cp 6        ; Z = ? C = ?

ld a, 5
cp 3        ; Z = ? C = ?

ld a, 0
xor a       ; establish Z set and C clear
dec a       ; Z = ? C = ?
```

Step mode and the register display provide the observed result for comparison with the prediction.

**2. The flag-before-branch check.** The following snippet is meant to
load 10 into `count` only when A holds the value 5, and do nothing otherwise.
The exercise is to locate the bug:

```asm
ld a, 5
cp 5
xor a             ; unrelated initialization
jp nz, skip
ld a, 10
ld (count), a
skip:
```

The three questions are: (1) which instruction last set the flag before `jp nz`? (2) does anything between that instruction and the jump modify that flag? (3) does the condition mean what the author intended? The answer should state what the code actually does and provide a corrected version.

**3. Count down with flags.** The required loop starts with A = 10, decrements A until it reaches zero, and stores A in a named variable `last_a` on every iteration. It uses `dec a` and a conditional jump rather than DJNZ, which comes in Chapter 6. The final trace should give the values in A and `last_a`.

**4. Bit test.** A already holds a status byte whose bit 2 is a "ready" flag.
The instruction `bit 2, a` leaves A unchanged and sets Z when bit 2 is clear.
The answer consists of the two instructions that test bit 2 and jump to `not_ready` when it is clear.
