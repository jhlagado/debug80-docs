---
layout: default
title: "A Complete Program"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 10
---

# A Complete Program

The earlier chapters introduced one mechanism at a time. This chapter combines
them in one program: a data table, DJNZ loops, subroutines, register-based
arguments and conditional branches. The focus is the data flow through
`main` and across two calls.

---

## The integration goal

The program solves two related problems on the same byte table:

1. The maximum value in the table.
2. The number of entries strictly greater than 64.

`main` supplies a table pointer and length to each subroutine, receives each
result and stores it in named RAM. That structure connects the separate
instruction patterns from earlier chapters into one flat Z80 program.

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

`main` sets up registers, calls a subroutine, stores the result, then repeats
for the second task. Every argument register is loaded immediately before its
`call`, so the complete data flow is visible in the calling sequence.

The table base address `values` must be loaded into HL again before the second
call because `find_max` advances HL past the end of the table during its scan.
The comment header records that side effect by listing HL among the clobbers.
Reloading HL at the call site prevents the second routine from scanning the
bytes after the table.

![The register traffic across both calls. HL is reloaded between them because find_max leaves it past the end of the table.](../../assets/images/azm-book/book2/main-data-flow.svg)

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

The flag-before-branch check on `cp c` / `jr nc` shows that `cp c` establishes the flag, `jr nc` reads it immediately, and nothing changes the flag between them. Carry clear after `cp c` means A ≥ C, so `jr nc` skips the update and the running maximum is left alone. `ld a, c` runs only when carry was set, meaning A was less than C and C is a new maximum. After eight iterations, A = 91 (`$5B`), the largest value in the table.

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

The loop body uses one `cp c` and two conditional branches on the **same** flag
result. `cp c` sets carry when A < C and sets Z when A == C. To count only
entries strictly greater than C, both conditions must be false: carry clear and
Z clear. The code runs `jr c, count_above_skip` (skip if A < C) and `jr z,
count_above_skip` (skip if A == C) immediately after that single comparison.
No instruction between `cp c` and those branches changes the flags, so both
tests read the same comparison.

---

## Tracing the integrated program

The program places `values`, `max_val` and `above_64` at `$8000`. Both
subroutines receive a table pointer and count, and `main` stores their returned
values in the named result bytes. A trace through `main` follows each value from
RAM into an argument register, through a loop and back to a result byte.

Each `call` pushes one return address on the stack. The counted loops otherwise
map directly to the Z80 instructions in their bodies, with `call` and `ret`
providing entry and return.

---

## Interfaces exposed by integration

Putting the routines together exposes the register interface at each call. The
`;` comment above `find_max` says what the routine reads, returns and clobbers.
The assembler treats that comment as text, so the caller remains responsible
for loading the declared registers and the routine for honouring its claims. A
mismatch assembles and produces the wrong result at run time. [Book 1 Chapter
6](../book1/06-register-contracts.md) covers `.routine` register contracts,
which let the assembler verify these claims.

`count_above` keeps its running count in D, and D is the only name that count
has while the routine runs. Chapter 11 now concentrates on this interface
boundary: which registers carry arguments and results, which side saves a live
value and how every return path keeps the stack balanced. [Book 1 Chapter
6](../book1/06-register-contracts.md) shows how AZM expresses the same contract
in a form the assembler can check.

The `cp c` / `jr c` / `jr z` sequence in `count_above` implements "strictly
greater than" in three instructions. [Book 1 Chapter
7](../book1/07-ops-aliases.md) covers `op` declarations for naming such a
sequence and expanding it inline.

Every byte in this program is a standalone variable. Grouping related bytes
into records requires each field access to carry its numeric offset: for
example, `x` at 0, `y` at 1 and `color` at 2. [Book 1 Chapter
5](../book1/05-layout-system.md) covers AZM layout types, where
`offset(Sprite, color)` supplies the field offset as a compile-time constant.

---

## Exercises

**1. A `find_max` trace.** The following table records `find_max` iteration by iteration over `{ 23, 47, 91, 5, 67, 12, 88, 34 }`, including A as the running maximum and C as the current element after each `ld c, (hl)`:

| Iteration | C (current) | A before cp | Update A? | A after |
| --------- | ----------- | ----------- | --------- | ------- |
| 1         | 23          | 0           | yes       | 23      |
| 2         | 47          | 23          | ?         | ?       |
| 3         | 91          | ?           | ?         | ?       |
| …         | …           | …           | …         | …       |

What is A when the loop exits? Does it match the expected result (91)?

**2. The side effect in HL.** `main` reloads `ld hl, values` before calling
`count_above`. Why? What value would HL hold after `find_max` returns if you did
not reload it? Identify the eight addresses that `count_above` would scan from
that position. The source defines only the first two bytes there; can the final
value stored in `above_64` be determined from this program alone?

**3. Flag trace.** The `count_above` loop runs `cp c` once, then `jr c`
and `jr z` before `inc d`. Tracing the flags from `cp c` through both branches
shows what each branch tests, why both can share one comparison and what would
break if `inc d` appeared between the comparison and the first branch.

**4. A third task.** Extending the program to count entries strictly less than
32 adds another complete path through the program: an additional subroutine,
three calling lines in `main` and a result stored in `below_32`. Its interface
records the argument registers and identifies the values reloaded by the caller.
