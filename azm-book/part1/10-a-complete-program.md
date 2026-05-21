---
layout: default
title: "Chapter 10 — A Complete Program"
parent: "Part 1 — Z80 Fundamentals"
grand_parent: "Learn AZM Assembly"
nav_order: 10
---
[← I/O and Ports](09-io-and-ports.md) | [Part 1](index.md) | [Subroutine Conventions →](11-subroutine-conventions.md)

# Chapter 10 — A Complete Program

You know enough Z80 to write real programs. This chapter builds one from scratch, using the full set of techniques from Chapters 3–9: a data table, a DJNZ loop, subroutines called from that loop, conditional branches, and push/pop register preservation.

The result works, and is slightly uncomfortable to read back — deliberately so. The two subroutines expose friction that accumulates in flat Z80 code as programs grow: contracts live only in comments, register ownership has no names, repeated comparison patterns have no way to be named, and byte offsets in data structures must be counted by hand. That friction is real, and naming it is the point. Chapters 11–14 address it directly.

---

## The program: find the maximum value in a byte table

The program solves two related problems on the same byte table:

1. Find the maximum value in the table.
2. Count how many entries are strictly greater than 64.

These two problems are separate enough to justify two subroutines, but share the same data. The structure — a data table, subroutines that receive a pointer and a length, results stored to named RAM, a `main` that orchestrates the calls — is what a complete flat Z80 program looks like.

The example is `learning/part1/examples/08_complete_program.asm`.

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
; Out: A = maximum value
; Clobbers: A, B, C, HL
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
; Out: A = count of entries > C
; Clobbers: A, B, C, D, HL
count_above:
  push bc
  ld d, 0
  pop bc
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

`main` has no logic of its own. It sets up registers, calls a subroutine, stores the result, then repeats for the second task. The calling sequence is entirely explicit: every register used to pass arguments is loaded immediately before each `call`.

The table base address `values` must be loaded into HL again before the second call because `find_max` advances HL past the end of the table during its scan. HL holds a different value after the first call returns. Nothing in the language tells you this will happen — this kind of side effect is invisible in a short program and only surfaces as a bug once the code grows. You find out by reading the subroutine body carefully, or by running the program and seeing wrong output.

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

Apply the flag-before-branch check on `cp c` / `jr nc`: `cp c` establishes the flag, `jr nc` reads it immediately — nothing changes the flag between them. Carry clear after `cp c` means A ≥ C, so `jr nc` skips the update and the running maximum is left alone. `ld a, c` runs only when carry was set — meaning A was less than C and C is a new maximum. After eight iterations, A = 91 (`$5B`), the largest value in the table.

The comment header documents "Clobbers: A, B, C, HL" — all four are modified by the time the subroutine returns. B is consumed by `djnz`, C holds the current element at each step, HL has walked past the last byte, and A holds the result. The caller is responsible for knowing this and reloading any register it needs before the next call.

---

## `count_above`: two things worth looking at closely

`count_above` counts entries strictly greater than a threshold and returns the count in A. It works. Two details in the implementation are worth examining directly.

```asm
count_above:
  push bc
  ld d, 0
  pop bc
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

The subroutine needs a counter. It uses D, and D must be initialized to zero before the loop. Initializing D does not disturb B or C — `ld d, 0` only touches D. But the subroutine wraps the initialization in `push bc / ld d, 0 / pop bc` anyway. The programmer was not sure whether zeroing D would be safe, saved BC to protect it, and moved on.

Register-only code extracts this cost: with three inputs and a counter all living in registers, keeping a reliable mental model of which registers are safe to touch requires constant attention. When that attention lapses — even briefly — the instinct is to save everything, whether or not it was at risk. The push/pop pair is not wrong; it is a hedge against uncertainty. In a longer subroutine with more registers in flight, that hedge is often correct. Here it happens to be unnecessary.

The double `cp c` in the loop body is a different kind of cost. `cp c` sets carry when A < C and sets Z when A == C. To test "strictly greater than" you need both conditions false: carry clear and Z clear. The code tests them with two separate `cp c` / `jr` pairs, running the comparison twice per element. The intent — skip unless A > C — is not visible until you trace both branches.

---

## What works well

The program's strengths come from how explicit it is at every level.

The data layout is under your control. You placed `values`, `max_val`, and `above_64` at `$8000`. The two subroutines receive a pointer and a count; they write to no address except the one passed in. Nothing is allocated behind your back.

The register usage is explicit. Tracing through `main`, you can follow exactly which registers carry which values at each line. The assembler adds nothing you did not write.

The call cost is explicit. Every `call` costs a stack push, and you can count those pushes. No calling machinery is hidden.

For a short, performance-sensitive routine — a counted loop over a small table — this structure produces code that maps directly to Z80 instructions with no overhead.

---

## What gets harder as programs grow

These four things become increasingly tedious as programs grow past a handful of subroutines.

**Comment-only contracts are not enforced.** The `;` comment above `find_max` says what registers it reads on entry and what it produces on exit. Nothing checks that the caller actually loads the right registers, or that the subroutine actually produces what it claims. A caller that loads the wrong register fails silently. A subroutine that clobbers a register it said it would preserve fails silently. Chapter 12 introduces AZMDoc `;!` contracts, which let the assembler verify these claims.

**Register ownership has no names.** `count_above` uses D as a counter, but the running count has no name — the register is D, and nothing says why. In a longer subroutine with more registers in flight, tracking which register holds which value requires re-reading the code from the top. No declaration says "D is the counter." Chapter 11 covers the manual discipline for managing register ownership across subroutines; Chapter 12 shows how AZMDoc makes the contract explicit.

**Repeated comparison patterns have no name.** The double `cp c` / `jr` pair in `count_above` implements "strictly greater than" — a concept with no single Z80 opcode. The same pair of instructions will appear every time you want a strict greater-than test. There is nothing to call that pattern, and no way to verify both branches are correct without re-reading them each time. Chapter 14 introduces `op` macros, which give a name to a short instruction sequence and expand it inline wherever you write the name.

**Byte offsets in data structures must be counted by hand.** This program has no compound data structures, but once you start grouping related bytes — a sprite with `x`, `y`, and `color` fields, for example — every field access requires you to count "x is at offset 0, y is at offset 1, color is at offset 2" and then repeat that count every time the structure changes. Chapter 13 introduces AZM layout types, where `offset(Sprite, color)` gives you the field offset as a compile-time constant without counting.

---

## What the next chapters address

Chapter 11 covers subroutine calling conventions in depth: how to pass arguments, which registers to save and restore, and the IX-frame pattern for subroutines that need local storage. Chapter 12 introduces AZMDoc, which turns the comment-only contracts above each subroutine into machine-checkable `;!` annotations — the assembler can verify that the caller sets the right registers and that the subroutine produces what it claims. Chapter 13 introduces layout types — scalar types, `.type` records, `sizeof`, `offset`, and `.ds` type expressions — so byte offsets in records are always named and never counted by hand. Chapter 14 introduces `op` declarations, which give names to short instruction sequences and expand them inline wherever you write the name.

---

## Summary

- A complete AZM program has a code section starting at `.org $0000`, data at one or more known addresses, a `main` label, and one or more helper subroutines.
- Subroutines receive inputs in registers and return results in registers. Document which registers each subroutine reads and which it modifies; nothing enforces these contracts.
- The caller must reload any register that the subroutine modified before the next call.
- The push/pop in `count_above` around `ld d, 0` protects BC while initializing D — it turns out to be unnecessary here, but the instinct to save registers when uncertain is reasonable in a longer subroutine.
- The double `cp c` implements "strictly greater than" using the only comparisons the Z80 offers: less-than (carry) and equal (zero). The intent is not visible from either instruction alone.
- Chapters 11–14 — calling conventions, AZMDoc contracts, layout types, and ops — each address one of the friction points this program exposes.

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

**2. The invisible side effect.** `main` reloads `ld hl, values` before calling `count_above`. Why? What value would HL hold after `find_max` returns if you did not reload it? What would `count_above` scan if HL were not reloaded, and what result would `above_64` receive?

**3. Find the redundancy.** The `count_above` subroutine runs `cp c` twice in the loop body. Explain in one sentence why each `cp c` is there and what flag it is testing. Could you combine them into a single test using a different jump? _(Hint: after the first `jr c, count_above_skip`, you know A is ≥ C. What additional condition do you need to check?)_

**4. Add a third task.** Extend the program to also count entries strictly less than 32, storing the count in a new variable named `below_32`. Write the additional subroutine and the three lines in `main` that call it. Document which registers carry each argument and what you must reload before the call.

---

[← I/O and Ports](09-io-and-ports.md) | [Part 1](index.md) | [Subroutine Conventions →](11-subroutine-conventions.md)
