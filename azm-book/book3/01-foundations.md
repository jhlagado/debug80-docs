---
layout: default
title: "Arithmetic Foundations"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 2
---

# Arithmetic Foundations

Greatest common divisor on 16-bit values comes first, then 8-bit
exponentiation. The complete program in
[`examples/01_gcd.asm`](examples/01_gcd.asm) stores both results in RAM for
inspection after `halt`.

---

## Greatest common divisor

The greatest common divisor of two integers is the largest value that divides both exactly. For 48 and 18, the answer is 6.

Euclid's method gets there with subtraction alone:

1. If the right value is zero, the left value is the answer.
2. If the left is greater than or equal to the right, subtract the right from the left.
3. Otherwise swap the two values.
4. Control returns to step 1.

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

**Callee-save:** every register outside the output and clobber lists must retain
its incoming value. A routine that uses one as scratch must restore it before
every `ret`.

Every subroutine in this book documents its contract with the register-contract
notation [Book 1 Chapter 6](../book1/06-register-contracts.md) covers.

---

## Subtractive GCD in AZM

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

`ex de, hl` swaps the two 16-bit arguments in a single byte of code.

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

![Euclid's method reaches GCD(48, 18) by subtraction alone, swapping whenever HL falls below DE](../../assets/images/azm-book/book3/gcd-euclid.svg)

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

`ld (gcd_result), hl` stores a 16-bit little-endian value: low byte first, high
byte second. After the program halts, the emulator shows `$06` at `$8000` and
`$00` at `$8001`.

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

Book 3 follows four workspace rules:

- Workspace belongs in RAM and continues in the same `.org` block as the data.
  Placement runs forward, so a later `.org` below an earlier one leaves the
  cursor where it was, as Chapter 2 explains.
- `.ds` reserves the bytes and leaves whatever was there, so each byte must be
  written before it is read.
- Each logical temporary has its own label naming what it holds, such as
  `key_byte`.
- Comments identify which routines touch each workspace label.

Chapter 2's insertion sort stores the current key in `key_byte`, placed after
its table, because C, B and HL already hold indices, counts and addresses.

---

## Second algorithm: `power_u8`

For small 8-bit operands, repeated multiplication is enough:

**Contract:** B = exponent, C = base, A = result (C^B). Zero exponent yields 1.

```asm
; power_u8: unsigned C^B into A (B may be 0 -> 1)
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

`mul8_a_by_c` multiplies the accumulator in A by C using repeated addition, correct for the demo sizes (3^4 = 81).

The example stores the byte result at `power_result`. After `halt`, `$8002`
should hold `$51` (81 decimal).

---

## Memory diagram: results after `main`

![A word result stored low byte first, and a byte result in the cell after it](../../assets/images/azm-book/book3/gcd-results.svg)

---

## Running the arithmetic example

[`examples/01_gcd.asm`](examples/01_gcd.asm) should reach `halt` with
`gcd_result` = 6 and `power_result` = 81. These commands assemble it from
`book3/`; the second also checks register contracts:

| File | What to verify |
|------|----------------|
| [`examples/01_gcd.asm`](examples/01_gcd.asm) | `gcd_result` = 6, `power_result` = 81, then `halt` |

```sh
azm examples/01_gcd.asm
azm --rc warn examples/01_gcd.asm
```

---

## Exercises

[Exercise notes](exercise-notes.md#chapter-1-arithmetic-foundations) give
results, checks and implementation guidance.

1. **Euclid trace and invariant.** A trace for inputs 270 and 192 should show
   HL and DE after the first five subtract-or-swap transitions. Its invariant
   should explain why each transition preserves the eventual answer, and a
   complete run should supply the returned GCD.
2. **Result representation and zero cases.** A written prediction should give
   HL and the two little-endian bytes stored at `gcd_result` for calls with
   `(HL, DE)` equal to `(0, 5)`, `(5, 0)` and `(270, 192)`. A test driver can
   store each result in a separate `.ds word` slot for comparison.
3. **Register-contract diagnosis.** A deliberate caller keeps a later-needed
   address in DE across `call gcd_u16`. The `azm --rc warn` result should
   identify why this violates the declared contract; reloading or preserving
   the address should leave that call site without a warning.
4. **Decimal digit count.** A new `digit_count_u8` routine takes and returns A,
   with a `.routine` contract that describes every clobber. Its boundary tests
   are `0 -> 1`, `9 -> 1`, `10 -> 2`, `99 -> 2`, `100 -> 3` and `255 -> 3`.

### Extensions

5. **Extension — Shift-and-add multiplication.** An eight-step shift-and-add
   replacement for `mul8_a_by_c` should preserve its caller-visible contract.
   Its tests are `0 * 37 = 0`, `1 * 255 = 255`, `9 * 9 = 81` and the low-byte
   result of `20 * 20 = 144`.
6. **Extension — Exact 16-bit product.** A `mul8_u16` variant can take A and C
   as unsigned factors and return the full product in HL. Its contract should
   name every changed register and flag, while RAM tests should contain
   `$90 $01` for `20 * 20` and `$FE $01` for `255 * 2`.
