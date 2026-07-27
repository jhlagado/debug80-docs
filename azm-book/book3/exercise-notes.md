---
layout: default
title: "Exercise Notes"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 99
---

# Exercise Notes

These notes provide the expected result for each chapter exercise.
## Chapter 1: Arithmetic Foundations


**Euclid trace and invariant.** The first five transitions are
`(270, 192) -> (78, 192) -> (192, 78) -> (114, 78) -> (36, 78) ->
(78, 36)`. Subtraction and swapping preserve
`gcd(HL, DE) = gcd(270, 192)`. The returned GCD is 6.

## Chapter 2: Arrays and Loops


**Insertion-sort trace.** The three rows are:

| Completed iteration | Table | Sorted prefix |
|---------------------|-------|---------------|
| `i = 1` | `4, 9, 6, 2, 8, 1, 7, 3` | `4, 9` |
| `i = 2` | `4, 6, 9, 2, 8, 1, 7, 3` | `4, 6, 9` |
| `i = 3` | `2, 4, 6, 9, 8, 1, 7, 3` | `2, 4, 6, 9` |

Before iteration `i`, elements `0..i-1` form a sorted prefix.

## Chapter 3: Strings


**Sentinel walk.** `"AZM"` has length 3. The indices are `M -> 2`,
`A -> 0` and `Z -> 1`. At the top of `_scan`, B is the current index and
every earlier character differs from C.

## Chapter 4: Bit Patterns


**Mask trace.** Starting from `$05` (`00000101`), setting error with `$02`
gives `$07` (`00000111`), clearing busy with `$FB` gives `$03`
(`00000011`), and toggling ready with `$01` gives `$02` (`00000010`).

## Chapter 5: Records


**Layout arithmetic.** The original layout has size 3 and offsets
`head = 0`, `tail = 1`, `count = 2`. Appending `flags` gives size 4 and
`flags = 3`; all three earlier offsets stay unchanged.

## Chapter 6: Recursion


**Factorial trace and range.** Calls descend through B values
`4, 3, 2, 1, 0`; unwind results are `1, 1, 2, 6, 24`. Both 8-bit routines
return `$D0` (208) for 6 because `720 mod 256 = 208`. Their agreement shows
consistent overflow, not an exact factorial.

## Chapter 7: Source Composition


**Include graph and placement.** The acyclic edges run from `main.asm` to
each included file. An edge from `ring.asm` back to `main.asm` creates a
cycle. Each source-emitting include contributes bytes at its directive's
position in the single assembly unit; a constants-only include emits none.

## Chapter 8: Pointer Structures


**Node representation.** `sizeof(ListNode) = 3`,
`offset(value) = 0` and `offset(next) = 1`. After insertion,
`list_head -> node_spare -> node_a -> node_b -> node_c -> 0`;
`node_a.next` still contains `node_b`. Changing `.word` to `.addr` clarifies
the field's purpose while retaining its two-byte size and emitted data.

## Chapter 9: Eight Queens Capstone


**Constraint trace.** `queen_cols[0..2]` contains `0, 2, 4`.
Set column indices are `0, 2, 4`; sum-diagonal indices are
`0 + 0 = 0`, `1 + 2 = 3` and `2 + 4 = 6`; difference-diagonal indices are
`0 - 0 + 7 = 7`, `1 - 2 + 7 = 6` and `2 - 4 + 7 = 5`.
