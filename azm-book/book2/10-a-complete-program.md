---
layout: default
title: "A Complete Program"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 10
---
[← I/O and Ports](09-io-and-ports.md) | [Book 2](index.md) | [Subroutine Conventions →](11-subroutine-conventions.md)

# Chapter 10 — A Complete Program

This chapter builds a program from scratch, using the main techniques from
Chapters 3–9: a data table, DJNZ loops, subroutines, register-based arguments
and conditional branches.

---

## The program: find the maximum value in a byte table

The program solves two related problems on the same byte table:

1. Find the maximum value in the table.
2. Count how many entries are strictly greater than 64.

The structure (a data table, subroutines that receive a pointer and a length, results stored to named RAM, a `main` that orchestrates the calls) is what a complete flat Z80 program looks like.

The example is `learning/book2/examples/08_complete_program.asm`.

---

## The full program

```asm
TableLen .equ 8

.org $0000
main:
  ld hl, values
  ld b, TableLen
  call find_max
  ld (max_val), a

  ld hl, values
  ld b, TableLen
  ld c, 64
  call count_above
  ld (above_64), a
  halt

; find_max: scan byte table, return largest value
; In:  HL = pointer to first byte, B = count
; Precondition: B > 0
; Out: A = maximum value
; Clobbers: B, C, F, HL
find_max:
  ld a, 0
find_max_loop:
  ld c, (hl)
  cp c
  jr nc, find_max_no_update
  ld a, c
find_max_no_update:
  inc hl
  djnz find_max_loop
  ret

; count_above: count entries strictly greater than threshold
; In:  HL = pointer to first byte, B = count, C = threshold
; Precondition: B > 0
; Out: A = count of entries > C
; Clobbers: B, D, F, HL
; Preserves: C
count_above:
  ld d, 0
count_above_loop:
  ld a, (hl)
  cp c
  jr c, count_above_skip
  jr z, count_above_skip
  inc d
count_above_skip:
  inc hl
  djnz count_above_loop
  ld a, d
  ret

.org $8000
values:   .db 23, 47, 91, 5, 67, 12, 88, 34
max_val:  .db 0
above_64: .db 0
```

---

## `main`: the calling sequence

`main` sets up registers, calls a subroutine, stores the result, then repeats for the second task. The calling sequence is entirely explicit: every register used to pass arguments is loaded immediately before each `call`.

The table base address `values` must be loaded into HL again before the second call because `find_max` advances HL past the end of the table during its scan. Nothing in the language tells you this will happen; this kind of side effect is invisible in a short program and only surfaces as a bug once the code grows.

---

## `find_max`: a counted loop with a conditional update

`find_max` scans the table and returns the largest byte in A. The loop body uses C as a temporary to hold the current element.

```asm
find_max:
  ld a, 0
find_max_loop:
  ld c, (hl)
  cp c
  jr nc, find_max_no_update
  ld a, c
find_max_no_update:
  inc hl
  djnz find_max_loop
  ret
```

Apply the flag-before-branch check on `cp c` / `jr nc`: `cp c` establishes the flag, `jr nc` reads it immediately, and nothing changes the flag between them. Carry clear after `cp c` means A ≥ C, so `jr nc` skips the update and the running maximum is left alone. `ld a, c` runs only when carry was set, meaning A was less than C and C is a new maximum. After eight iterations, A = 91 (`$5B`), the largest value in the table.

The comment header documents "Clobbers: B, C, F, HL". B is consumed by
`djnz`, C holds the current element, comparisons modify F, HL advances past the
last byte and A holds the result.

---

## `count_above`: reusing comparison flags

`count_above` counts entries strictly greater than a threshold and returns the count in A.

```asm
count_above:
  ld d, 0
count_above_loop:
  ld a, (hl)
  cp c
  jr c, count_above_skip
  jr z, count_above_skip
  inc d
count_above_skip:
  inc hl
  djnz count_above_loop
  ld a, d
  ret
```

The subroutine uses D as its running count. `ld d, 0` changes only D, so B
retains the loop count and C retains the threshold. The comment contract lists
D among the clobbered registers and C among the preserved registers.

The loop body uses one `cp c` and two conditional branches on the **same** flag result, a useful Z80 idiom. `cp c` sets carry when A < C and sets Z when A == C. To count only entries strictly greater than C, both conditions must be false: carry clear and Z clear. The code runs `jr c, count_above_skip` (skip if A < C) and `jr z, count_above_skip` (skip if A == C) immediately after that single comparison. No instruction between `cp c` and those branches changes the flags, so both tests read the same comparison.

---

## Strengths of Flat Register-Based Code

The program places `values`, `max_val` and `above_64` at `$8000`. Both
subroutines receive a table pointer and count; `main` stores their returned
values in the named result bytes.

Tracing through `main`, you can follow exactly which registers carry which values at each line.

Every `call` costs a stack push, and you can count those pushes.

For a short, performance-sensitive routine such as a counted loop over a small
table, this structure maps directly to Z80 instructions. Its only abstraction
cost here is the `call` and `ret` used to enter and leave each subroutine.

---

## Limits as Programs Grow

**Comment-only contracts are not enforced.** The `;` comment above `find_max` says what registers it reads on entry and what it produces on exit. Nothing checks that the caller actually loads the right registers, or that the subroutine actually produces what it claims. A caller that loads the wrong register fails silently. Chapter 12 introduces `.routine` register contracts, which let the assembler verify these claims.

**Register ownership has no names.** `count_above` uses D as a counter, but the running count has no name; the register is D and nothing says why. In a longer subroutine with more registers in flight, tracking which register holds which value requires re-reading the code from the top. Chapter 11 covers the manual discipline for managing register ownership across subroutines; Chapter 12 shows how register contracts make the contract explicit.

**Repeated comparison sequences obscure their purpose.** The `cp c` / `jr c` /
`jr z` sequence in `count_above` implements "strictly greater than", for which
the Z80 has no single opcode. Chapter 14 introduces `op` declarations for
naming such a sequence and expanding it inline.

**Byte offsets in data structures must be counted by hand.** This program has no compound data structures, but once you start grouping related bytes (a sprite with `x`, `y` and `color` fields, for example), every field access requires you to count "x is at offset 0, y is at offset 1, color is at offset 2" and then repeat that count every time the structure changes. Chapter 13 introduces AZM layout types, where `offset(Sprite, color)` gives you the field offset as a compile-time constant without counting.

---

## Exercises

**1. Trace `find_max` by hand.** The table is `{ 23, 47, 91, 5, 67, 12, 88, 34 }`. Step through `find_max` iteration by iteration, recording the value of A (the running maximum) and C (the current element) after each `ld c, (hl)`. Fill in the table:

| Iteration | C (current) | A before cp | Update A? | A after |
| --------- | ----------- | ----------- | --------- | ------- |
| 1         | 23          | 0           | yes       | 23      |
| 2         | 47          | 23          | ?         | ?       |
| 3         | 91          | ?           | ?         | ?       |
| …         | …           | …           | …         | …       |

What is A when the loop exits? Does it match the expected result (91)?

**2. The invisible side effect.** `main` reloads `ld hl, values` before calling
`count_above`. Why? What value would HL hold after `find_max` returns if you did
not reload it? Identify the eight addresses that `count_above` would scan from
that position. The source defines only the first two bytes there; can the final
value stored in `above_64` be determined from this program alone?

**3. Trace the flags.** The `count_above` loop runs `cp c` once, then `jr c`
and `jr z` before `inc d`. Explain what each branch tests and why a second
comparison is not needed. What would break if `inc d` appeared between `cp c`
and the first branch?

**4. Add a third task.** Extend the program to also count entries strictly less than 32, storing the count in a new variable named `below_32`. Write the additional subroutine and the three lines in `main` that call it. Document which registers carry each argument and what you must reload before the call.

---

[← I/O and Ports](09-io-and-ports.md) | [Book 2](index.md) | [Subroutine Conventions →](11-subroutine-conventions.md)
