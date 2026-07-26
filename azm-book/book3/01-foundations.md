---
layout: default
title: "Foundations"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 2
---
[← Introduction](00-introduction.md) | [Book 3](index.md) | [Arrays and Loops →](02-arrays-and-loops.md)

# Chapter 1 — Foundations

Greatest common divisor on 16-bit values comes first, then 8-bit exponentiation. The companion listing is [`examples/01_gcd.asm`](examples/01_gcd.asm).

---

## The problem: GCD without a divide instruction

The greatest common divisor of two integers is the largest value that divides both without remainder. For 48 and 18, the answer is 6.

Euclid's method gets there with subtraction alone:

1. If the right value is zero, the left value is the answer.
2. If the left is greater than or equal to the right, subtract the right from the left.
3. Otherwise swap the two values.
4. Repeat from step 1.

---

## Book 3 calling convention (16-bit)

Book 3 adds a **16-bit family** used in this chapter and reused later unless a chapter says otherwise.

| Role | Register | Notes |
|------|----------|--------|
| First 16-bit argument | HL | Unsigned, little-endian |
| Second 16-bit argument | DE | Unsigned, little-endian |
| 16-bit result | HL | Returned in place of first argument when possible |
| 8-bit count / exponent | B | Caller-save; consumed by `djnz` loops |
| 8-bit scalar operand | C | Often a small constant operand |
| 8-bit byte result | A | |
| Table base address | HL | Same as 16-bit arg — context disambiguates |
| Table length | B | Element count for byte tables |

**Caller-save:** A, F, declared outputs and registers listed in `.routine
clobbers` may change across the call. An input is also caller-save when the
contract says the routine consumes or clobbers it.

**Callee-save:** every register not declared as an output or clobber must retain
its incoming value. A routine that uses one as scratch must restore it before
every `ret`.

Every subroutine in this book should document its contract with register contracts (Book 2 Chapter 12).

---

## `gcd_u16`: the listing

```asm
; gcd_u16: greatest common divisor (Euclidean, subtractive)
.routine in HL,DE out HL clobbers AF,DE
gcd_u16:
_loop:
    ld a, h
    or l
    jr z, _right_answer
    ld a, d
    or e
    jr z, _left_answer
    push hl
    or a
    sbc hl, de
    pop hl
    jr c, _swap
    or a
    sbc hl, de
    jr _loop
_swap:
    ex de, hl
    jr _loop
_left_answer:
    ret
_right_answer:
    ex de, hl
    ret
```

### Zero tests

`ld a, h` / `or l` sets Z when HL is zero. These are the base cases: if either argument is zero, the other register pair holds the GCD. `_left_answer` returns HL as it stands; `_right_answer` swaps DE into HL first, so the caller always reads the result in HL.

### Unsigned compare via `sbc hl, de`

`or a` clears carry. `sbc hl, de` computes HL − DE with borrow. If carry is **set** afterward, HL was **less than** DE (unsigned).

If HL ≥ DE, the second `sbc hl, de` performs the Euclidean subtraction step and the loop repeats.

`ex de, hl` swaps the two 16-bit arguments without touching memory.

### Trace: GCD(48, 18)

| Step | HL | DE | Action |
|------|-----|-----|--------|
| start | 48 | 18 | 48 ≥ 18 → subtract |
| 1 | 30 | 18 | 30 ≥ 18 → subtract |
| 2 | 12 | 18 | 12 < 18 → swap |
| 3 | 18 | 12 | 18 ≥ 12 → subtract |
| 4 | 6 | 12 | 6 < 12 → swap |
| 5 | 12 | 6 | 12 ≥ 6 → subtract twice |
| end | 0 | 6 | HL zero → swap DE into HL, return 6 |

---

## `main`: calling and storing the result

```asm
.org $0000
main:
    ld hl, 48
    ld de, 18
    call gcd_u16
    ld (gcd_result), hl
    ...
    halt

.org $8000
gcd_result:
    .ds word
```

`ld (gcd_result), hl` stores a 16-bit little-endian value: low byte first, high byte second. After the program halts, inspect `$8000` and `$8001` in the emulator; you should see `$06` and `$00`.

Named constants keep the call site readable:

```asm
GCD_A .equ 48
GCD_B .equ 18
    ld hl, GCD_A
    ld de, GCD_B
```

---

## Workspace RAM

Longer algorithms spill into **workspace** bytes reserved with `.ds`:

```asm
.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
key_byte:
    .ds byte
sort_len:
    .ds byte
```

Rules used throughout Book 3:

- Place workspace in RAM, not ROM, and continue the same `.org` block as the data. A later `.org` below an earlier one is ignored, as Chapter 2 explains.
- `.ds` reserves without initializing, so the program must write before read.
- One label per logical temporary (`key_byte`, not `temp4`).
- Document in comments which routines touch which workspace labels.

Chapter 2's insertion sort stores the current key in `key_byte`, placed after
its table, because C, B and HL already hold indices, counts and addresses.

---

## Second algorithm: `power_u8`

For small 8-bit operands, repeated multiplication is enough:

**Contract:** B = exponent, C = base, A = result (C^B). Zero exponent yields 1.

```asm
; power_u8: unsigned C^B into A (B may be 0 → 1)
.routine in B,C out A clobbers F,B,E
power_u8:
    ld e, 1
_loop:
    ld a, b
    or a
    jr z, _done
    dec b
    ld a, e
    push bc
    call mul8_a_by_c
    pop bc
    ld e, a
    jr _loop
_done:
    ld a, e
    ret
```

`mul8_a_by_c` multiplies the accumulator in A by C using repeated addition, correct for the demo sizes (3^4 = 81), not a general fast multiply.

The companion program stores the byte result at `power_result`. After `halt`, `$8002` should hold `$51` (81 decimal).

---

## Memory diagram: results after `main`

```
  $8000  ┌────────┬────────┐
         │ $06    │ $00    │  gcd_result (word)
  $8002  ├────────┤
         │ $51    │          power_result (byte = 81)
         └────────┴────────┘
```

---

## Examples

| File | What to verify |
|------|----------------|
| [`examples/01_gcd.asm`](examples/01_gcd.asm) | `gcd_result` = 6, `power_result` = 81, then `halt` |

Assemble from `book3/`:

```sh
azm examples/01_gcd.asm
azm --rc warn examples/01_gcd.asm
```

---

## Exercises

1. Change `GCD_A` and `GCD_B` to 270 and 192. Trace the first five loop iterations by hand, then run the program and confirm `gcd_result`.
2. Add `gcd_u16` calls for (0, 5) and (5, 0). What should each return? Test in the emulator.
3. Implement `digit_count_u8` with A in and A out. Return 1 for values 0–9,
2 for 10–99 and 3 for 100–255. Two `cp` instructions against 10 and 100 are
enough; no division is needed.
4. Rewrite `mul8_a_by_c` with a shift-and-add multiply (faster for larger products). Keep the same `.routine` contract.
5. Run `azm --rc warn` on a deliberate bug: use HL after `call gcd_u16` without reloading. Read the warning and fix the caller.

---

[← Introduction](00-introduction.md) | [Book 3](index.md) | [Arrays and Loops →](02-arrays-and-loops.md)
