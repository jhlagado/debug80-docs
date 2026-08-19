---
layout: default
title: "Counting Loops and DJNZ"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 6
---

# Counting Loops and DJNZ

The `DEC B / JP NZ` loop from Chapter 5 uses two instructions for one repeated
operation: decrement B, then branch while it is non-zero. DJNZ combines those
steps. This chapter uses it in counted, sentinel and flag-exit loops.

---

## The two-instruction loop

The earlier counted loop had this shape:

```asm
LD B, LIMIT
.LOOP_TOP:
  ; ... body ...
  DEC B
  JP NZ, .LOOP_TOP
```

---

## DJNZ: decrement B and jump if not zero

`DJNZ LABEL` performs three steps:

1. B decreases by one.
2. If B is now non-zero, jump to `LABEL`.
3. If B is now zero, fall through to the next instruction.

The single instruction replaces `DEC B / JP NZ, LABEL`. It is one byte smaller
than the `DEC B / JR NZ` form (2 bytes vs 3) and two bytes smaller than
`DEC B / JP NZ` (2 bytes vs 4).

`DJNZ` is a relative jump, like `JR`. Its signed displacement is measured from
the address after the instruction, giving a target range of 128 bytes backward
to 127 bytes forward from that address. If the loop body is too long, the
assembler reports an error and the loop requires `DEC B / JP NZ` instead.

---

## The loop structure with explicit labels

Every DJNZ loop has the same three parts:

1. **Init**: load B with the iteration count before the loop.
2. **Body**: the instructions that run each iteration.
3. **Branch-back**: `DJNZ` at the end of the body, targeting the body label.

```asm
LD B, 5           ; init: B = iteration count
.LOOP_TOP:
  ; body
  DJNZ .LOOP_TOP   ; branch-back: B--; if B != 0, go to loop_top
```

The label `LOOP_TOP` sits at the first instruction of the body, not before the
`LD B` initializer. With the `LD B` init missing, B holds whatever the previous
code left in it and the loop runs that many times.

---

## The zero-count hardware semantic

`DJNZ` uses B as an 8-bit counter, and `LD B, 0` is the case worth knowing about.

On the Z80, DJNZ decrements B before testing. If B starts at 0, the decrement
wraps to 255 (`$FF`), the result is non-zero and the jump is taken. The loop
continues from B = 255 and runs a further 255 times before B reaches zero again.
Total: 256 iterations.

![djnz decrements before it tests, which is what turns ld b, 0 into 256 iterations rather than none.](../../assets/images/atom-book/book2/djnz-flow.svg)

`LD B, 0` before `DJNZ` is valid Z80; it gives 256 iterations and some
programs use it deliberately for exactly that reason.

**A DJNZ loop must not receive B = 0 when zero iterations are intended.** A
runtime count that may be zero requires a test before the loop:

```asm
LD A, (COUNTVAL)
OR A               ; test whether COUNTVAL is zero
JR Z, .SKIPLOOP    ; skip the entire loop if count is zero
LD B, A
.LOOP_TOP:
  ; body
  DJNZ .LOOP_TOP
.SKIPLOOP:
```

A count known at write-time to be between 1 and 255 can go straight into B.

---

## Register State After a Loop

The counted loop from Section A of the example below sums the five bytes
`3, 7, 2, 8, 5`:

```asm
LD HL, ADDENDS
LD B, TABLELEN      ; B = 5
LD A, 0
.DJNZLOOP:
  ADD A, (HL)
  INC HL
  DJNZ .DJNZLOOP
LD (TOTAL), A
```

When the loop exits: **B is zero** (that was the exit condition). **A holds 25**
(the accumulated sum). **HL points one byte past the last element**: it was
incremented after reading each entry, so after five elements it has advanced
five positions beyond the base.

If another variable is stored immediately after the table, HL now points at it.
A stray `LD (HL), A` at this point would overwrite that variable, and the
hardware would carry out the write like any other.

---

## Sentinel loops

A sentinel loop tests each element against a known value. The data tells it
when to stop.

The structure uses `CP` and `JR Z` instead of DJNZ as the exit mechanism:

```asm
LD HL, TABLE
.SENTLOOP:
  LD A, (HL)
  CP SENTVAL
  JR Z, .FOUND        ; exit when the sentinel value is seen
  INC HL
  JR .SENTLOOP   ; keep going (no bound check here)
.FOUND:
```

The value test is this form's only exit, so a table that never contains the
sentinel sends the loop past the end. A safe sentinel loop pairs the value test
with a DJNZ bound:

```asm
LD HL, TABLE
LD B, TABLELEN       ; guard against overrun
.SENTLOOP:
  LD A, (HL)
  CP SENTVAL
  JR Z, .FOUND
  INC HL
  DJNZ .SENTLOOP ; DJNZ as the overrun guard
  JR NOTFOUND       ; fell through without a match
.FOUND:
```

---

## Flag-exit loops

A flag-exit loop runs until an arithmetic condition becomes true, then exits
through the flag. A typical case accumulates values until the sum exceeds a
limit.

```asm
LD HL, TABLE
LD A, 0
LD B, TABLELEN
.FLAGLOOP:
  ADD A, (HL)
  INC HL
  CP LIMIT
  JR NC, .DONE    ; exit when A >= LIMIT (carry clear means A >= LIMIT)
  DJNZ .FLAGLOOP
.DONE:
```

The two conditions are independent: whichever fires
first ends the loop.

---

## Worked example

```asm
TABLELEN EQU 5

ORG $8000
TOTAL:   DB 0
SCANVAL: DB 0
FLAGVAL: DB 0

ORG $8010
ADDENDS: DB 3, 7, 2, 8, 5
```

Whether `$8010` lands in ROM or in RAM is a property of your hardware; `ORG` only says where the bytes go.

The program runs three loop forms side by side over the same five-element table.

**Section A: DJNZ counted loop.**

```asm
LD HL, ADDENDS
LD B, TABLELEN
LD A, 0
.DJNZLOOP:
  ADD A, (HL)
  INC HL
  DJNZ .DJNZLOOP
LD (TOTAL), A
```

`LD HL, ADDENDS` sets HL to the address of the first entry. `LD B, TABLELEN`
sets B to 5. The body adds the current byte at HL to A and increments HL. After 5 iterations B = 0, the
loop exits, and `TOTAL` receives 25 ($19): the sum of 3 + 7 + 2 + 8 + 5.

**Section B: sentinel loop (`CP` / `JR Z`).**

```asm
LD HL, ADDENDS
LD B, TABLELEN
.SENTLOOP:
  LD A, (HL)
  CP 8
  JR Z, .SENTFIND
  INC HL
  DJNZ .SENTLOOP
  LD A, $FF
  JR .SENTDONE
.SENTFIND:
  LD A, (HL)
.SENTDONE:
  LD (SCANVAL), A
```

The loop scans the table for the value 8. `CP 8` tests the current byte. When
it matches, Z is set and `JR Z, .SENTFIND` exits the loop; A receives the
matched byte. DJNZ provides the overrun guard: if 8 were not present, the loop
would exhaust all five entries and fall through to `LD A, $FF`. Because 8 is
the fourth entry, `SCANVAL` receives 8.

**Section C: flag-exit loop.**

```asm
LD HL, ADDENDS
LD B, TABLELEN
LD A, 0
.FLAGLOOP:
  ADD A, (HL)
  INC HL
  CP $10
  JR NC, .FLAGDONE
  DJNZ .FLAGLOOP
.FLAGDONE:
  LD (FLAGVAL), A
```

The loop accumulates bytes until the sum reaches or exceeds 16 (`$10`). After
adding 3, the sum is 3: `CP $10` sets carry (3 < 16), so `JR NC` does not
branch. After adding 7, the sum is 10, still less than 16. After adding 2, the
sum is 12, still less. After adding 8, the sum is 20; `CP $10` finds 20 >= 16,
carry is clear, `JR NC` exits. `FLAGVAL` receives 20 ($14).

---

## Choosing between DJNZ, sentinel and flag-exit

DJNZ is the right choice when you know exactly how many iterations to run before
the loop starts.

A sentinel loop is right when the stopping condition is "find this value."

A flag-exit loop is right when the stopping condition is "some computed quantity
has crossed a limit."

In practice, most Z80 loops are counted loops, since DJNZ is compact and the
iteration count is usually known before the loop starts.

![The three shapes. In the second and third, the value or flag test is the exit condition and djnz is the guarantee that the loop ends at all.](../../assets/images/atom-book/book2/loop-shapes.svg)

---

## Exercise

**The zero-count case.** A byte named `ITERATIONS`, incremented once in this
loop body, makes the hardware behaviour observable. The prediction should give
B and `ITERATIONS` after runtime counts 0, 1 and 255.

```asm
LD A, (COUNTVAL)
LD B, A
.LOOP_TOP:
  ; increment iterations here
  DJNZ .LOOP_TOP
```

A guarded version should make count 0 produce zero iterations while retaining
the ordinary meanings of 1 and 255. All three emulator runs should agree with
the prediction.

[Exercise notes](exercise-notes.md#chapter-6-counting-loops-and-djnz)
