---
layout: default
title: "Counting Loops and DJNZ"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 6
---

# Counting Loops and DJNZ

The `dec b / jp nz` loop from Chapter 5 uses two instructions where one would do.
This chapter shows the single-instruction replacement, and the three loop forms
you will reach for most often: counted, sentinel and flag-exit.

---

## Chapter 5 left a two-instruction pattern

Chapter 5 ended with this loop shape:

```asm
ld b, Limit
loop_top:
  ; ... body ...
  dec b
  jp nz, loop_top
```

---

## DJNZ: decrement B and jump if not zero

`djnz label` does exactly what its name says:

1. B decreases by one.
2. If B is now non-zero, jump to `label`.
3. If B is now zero, fall through to the next instruction.

The single instruction replaces `dec b / jp nz, label`. It is one byte smaller
than the `dec b / jr nz` form (2 bytes vs 3) and two bytes smaller than
`dec b / jp nz` (2 bytes vs 4).

`djnz` is a relative jump, like `jr`. Its signed displacement is measured from
the address after the instruction, giving a target range of 128 bytes backward
to 127 bytes forward from that address. If the loop body is too long, the
assembler reports an error and the loop requires `dec b / jp nz` instead.

---

## The loop structure with explicit labels

Every DJNZ loop has the same three parts:

1. **Init**: load B with the iteration count before the loop.
2. **Body**: the instructions that run each iteration.
3. **Branch-back**: `djnz` at the end of the body, targeting the body label.

```asm
ld b, 5           ; init: B = iteration count
loop_top:
  ; body
  djnz loop_top   ; branch-back: B--; if B != 0, go to loop_top
```

The label `loop_top` sits at the first instruction of the body, not before the
`ld b` initializer. Forget the `ld b` init and the loop runs for an unpredictable
number of iterations.

---

## The zero-count hardware semantic

`djnz` uses B as an 8-bit counter, and `ld b, 0` is the case worth knowing about.

On the Z80, DJNZ decrements B before testing. If B starts at 0, the decrement
wraps to 255 (`$FF`), the result is non-zero and the jump is taken. The loop
continues from B = 255 and runs a further 255 times before B reaches zero again.
Total: 256 iterations.

![djnz decrements before it tests, which is what turns ld b, 0 into 256 iterations rather than none.](../../assets/images/azm-book/book2/djnz-flow.svg)

`ld b, 0` before `djnz` is valid Z80; it gives 256 iterations and some
programs use it deliberately for exactly that reason.

**A DJNZ loop must not receive B = 0 when zero iterations are intended.** A
runtime count that may be zero requires a test before the loop:

```asm
ld a, (count_value)
or a               ; test whether count_value is zero
jr z, skip_loop    ; skip the entire loop if count is zero
ld b, a
loop_top:
  ; body
  djnz loop_top
skip_loop:
```

If you know at write-time that the count is always between 1 and 255, no
pre-test is needed.

---

## Register State After a Loop

The counted loop from Section A of the example below sums the five bytes
`3, 7, 2, 8, 5`:

```asm
ld hl, addends
ld b, TableLen      ; B = 5
ld a, 0
djnz_loop:
  add a, (hl)
  inc hl
  djnz djnz_loop
ld (total), a
```

When the loop exits: **B is zero** (that was the exit condition). **A holds 25**
(the accumulated sum). **HL points one byte past the last element**: it was
incremented after reading each entry, so after five elements it has advanced
five positions beyond the base.

If another variable is stored immediately after the table, HL now points at it.
A stray `ld (hl), a` at this point would silently overwrite that variable. The
Z80 has no array bounds, no memory protection, no runtime error.

---

## Sentinel loops

A sentinel loop tests each element against a known value. The data tells it
when to stop; there is no count to set in advance.

The structure uses `cp` and `jr z` instead of DJNZ as the exit mechanism:

```asm
ld hl, table_base
sentinel_loop:
  ld a, (hl)
  cp sentinel_value
  jr z, found        ; exit when the sentinel value is seen
  inc hl
  jr sentinel_loop   ; keep going (no bound check here)
found:
```

This form has no automatic bound: if the sentinel value never appears, the loop
runs past the end of the table. A safe sentinel loop pairs the value test with a
DJNZ bound:

```asm
ld hl, table_base
ld b, TableLen       ; guard against overrun
sentinel_loop:
  ld a, (hl)
  cp sentinel_value
  jr z, found
  inc hl
  djnz sentinel_loop ; DJNZ as the overrun guard
  jr not_found       ; fell through without a match
found:
```

---

## Flag-exit loops

A flag-exit loop runs until an arithmetic condition becomes true, then exits
through the flag. A typical case: accumulate values until the sum exceeds a
threshold.

```asm
ld hl, table_base
ld a, 0
ld b, TableLen
flag_loop:
  add a, (hl)
  inc hl
  cp threshold
  jr nc, done    ; exit when A >= threshold (carry clear means A >= threshold)
  djnz flag_loop
done:
```

The two conditions are independent: whichever fires
first ends the loop.

---

## The example: `examples/04_djnz_loops.asm`

```asm
TableLen .equ 5

.org $8000
total:   .db 0
scanval: .db 0
flagval: .db 0

.org $8010
addends: .db 3, 7, 2, 8, 5
```

Where `$8010` falls in the memory map (ROM or RAM) depends on your hardware, not on the assembler.

The program runs three loop forms side by side over the same five-element table.

**Section A: DJNZ counted loop.**

```asm
ld hl, addends
ld b, TableLen
ld a, 0
djnz_loop:
  add a, (hl)
  inc hl
  djnz djnz_loop
ld (total), a
```

`ld hl, addends` sets HL to the address of the first entry. `ld b, TableLen`
sets B to 5. The body adds the current byte at HL to A and increments HL. After 5 iterations B = 0, the
loop exits, and `total` receives 25 ($19): the sum of 3 + 7 + 2 + 8 + 5.

**Section B: sentinel loop (cp / jr z).**

```asm
ld hl, addends
ld b, TableLen
sentinel_loop:
  ld a, (hl)
  cp 8
  jr z, sentinel_found
  inc hl
  djnz sentinel_loop
  ld a, $FF
  jr sentinel_done
sentinel_found:
  ld a, (hl)
sentinel_done:
  ld (scanval), a
```

The loop scans the table for the value 8. `cp 8` tests the current byte. When
it matches, Z is set and `jr z, sentinel_found` exits the loop; A receives the
matched byte. DJNZ provides the overrun guard: if 8 were not present, the loop
would exhaust all five entries and fall through to `ld a, $FF`. Because 8 is
the fourth entry, `scanval` receives 8.

**Section C: flag-exit loop.**

```asm
ld hl, addends
ld b, TableLen
ld a, 0
flag_loop:
  add a, (hl)
  inc hl
  cp $10
  jr nc, flag_done
  djnz flag_loop
flag_done:
  ld (flagval), a
```

The loop accumulates bytes until the sum reaches or exceeds 16 (`$10`). After
adding 3, the sum is 3: `cp $10` sets carry (3 < 16), so `jr nc` does not
branch. After adding 7, the sum is 10, still less than 16. After adding 2, the
sum is 12, still less. After adding 8, the sum is 20; `cp $10` finds 20 >= 16,
carry is clear, `jr nc` exits. `flagval` receives 20 ($14).

---

## Choosing between DJNZ, sentinel and flag-exit

DJNZ is the right choice when you know exactly how many iterations to run before
the loop starts.

A sentinel loop is right when the stopping condition is "find this value."

A flag-exit loop is right when the stopping condition is "some computed quantity
has crossed a threshold."

In practice, most Z80 loops are counted loops, since DJNZ is compact and the
iteration count is usually known before the loop starts.

![The three shapes. In the second and third, djnz is not the exit condition; it is the guarantee that the loop ends at all.](../../assets/images/azm-book/book2/loop-shapes.svg)

---

## Tables in Chapter 7

Chapter 7 applies counted loops to tables and introduces indexed access for
reaching fields without changing HL before every load.

---

## Exercises

**1. The zero-count trap.** The explanation should state how many times this loop body executes and why:

```asm
ld a, (count_value)   ; suppose count_value holds 0 at runtime
ld b, a
loop_top:
  ; ... body ...
  djnz loop_top
```

The corrected version must skip the loop entirely when `count_value` is zero.

**2. A minimum loop.** The DJNZ sum loop from the chapter accumulates all five entries in `addends: .db 3, 7, 2, 8, 5`. This version must instead find the **minimum** value and store it in a variable named `minimum`. A starting value of 255 allows each smaller byte to replace the current minimum; Chapter 5's `cp` and `jr nc` provide the comparison.

**3. Sentinel loop: find the zero.** A table of bytes ends with a zero sentinel:

```asm
.org $8010
message: .db $41, $42, $43, $00, $44, $45
```

The required sentinel loop scans `message` and stores the **index** (0-based position) of the first zero byte in a variable named `zero_pos`. When no zero appears in the first six bytes, `zero_pos` must receive `$FF`.

**4. Loop analysis.** The flag-exit loop in the chapter example exits when the accumulated sum reaches or exceeds `$10` (16). The following table records an iteration-by-iteration trace over `3, 7, 2, 8, 5`:

| Iteration | Byte added | A after add | `cp $10` → C set? | Exit? |
| --------- | ---------- | ----------- | ----------------- | ----- |
| 1         | 3          | ?           | ?                 | ?     |
| 2         | 7          | ?           | ?                 | ?     |
| 3         | 2          | ?           | ?                 | ?     |
| 4         | 8          | ?           | ?                 | ?     |

Completing the table establishes the value stored in `flagval`. Repeating the trace with a threshold of `$0C` (12) shows whether the loop exits one iteration earlier.
