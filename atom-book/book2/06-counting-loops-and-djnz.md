---
layout: default
title: "Counting Loops and DJNZ"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 6
---

# Counting Loops and DJNZ

Many loops know their iteration count before they begin. The Z80 gives this
case its own instruction: `DJNZ` decrements B and branches while B is not zero.

---

## A two-instruction count

Without `DJNZ`, B can be decremented and tested explicitly:

```asm
LD B, LIMIT
.LOOP_TOP:
  ; ... body ...
  DEC B
  JR NZ, .LOOP_TOP
```

`DEC B` sets Z when B reaches zero. `JR NZ` repeats the body while Z is clear.
The branch must immediately follow the decrement unless every instruction
between them preserves Z.

---

## DJNZ: decrement B and jump if not zero

`DJNZ LABEL` performs three steps:

1. B decreases by one.
2. If B is now non-zero, jump to `LABEL`.
3. If B is now zero, fall through to the next instruction.

The single instruction replaces `DEC B / JR NZ, LABEL`. It is one byte smaller
than that pair and does not depend on the flags left by the loop body.

`DJNZ` is a relative jump, like `JR`. Its signed displacement is measured from
the address after the instruction, giving a target range of 128 bytes backward
to 127 bytes forward from that address. If the loop body is too long, the
assembler reports an error and the loop requires `DEC B / JP NZ` instead.

---

## The three parts of a counted loop

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

The label `.LOOP_TOP` sits at the first instruction of the body, not before the
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

## Worked example

```asm
LIMIT EQU 5

ORG $0000
MAIN:
  LD A, 0
  LD B, LIMIT
.LOOP_TOP:
  INC A
  DJNZ .LOOP_TOP
  LD (TOTAL), A
  HALT

ORG $8000
TOTAL: DB 0
```

The initializer makes A zero and B five. Each pass increments A, then `DJNZ`
consumes one count. After five passes, A is 5 and `TOTAL` receives 5. B is zero
because `DJNZ` falls through only after its decrement produces zero. Other
registers retain whatever values the body left in them.

---

## When DJNZ is not enough

Use `DEC B / JP NZ` when the loop body is too large for the relative range of
`DJNZ`. Use an explicit comparison and conditional jump when a value, rather
than a count, decides when to stop.

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
