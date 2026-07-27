---
layout: default
title: "Introduction"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 1
---

# Introduction to Book 3

Book 2 teaches the Z80 programming model, then points into Book 1 for the AZM
features that build on those foundations: register contracts, layout types and
ops. Book 3 applies both books to algorithms and small data structures in flat
assembly.

---

## Algorithms in assembly

Each algorithm starts with a concrete job such as sorting a table, finding a
value or walking a string. The implementation then connects a complete AZM
program or subroutine to the invariants and conventions that govern it.

---

## Representation before algorithm

Niklaus Wirth's title *Algorithms + Data Structures = Programs* captures a
constraint that becomes unavoidable in assembly: instruction choice depends on
how values are laid out in memory and how the code will reach them.

A sort loop therefore begins with three representation decisions:

- Is the array a contiguous block of bytes starting at a label?
- Is each element a plain `byte`, or a `Sprite` record with `sizeof(Sprite)` stride?
- Does the index live in B, in L or in a workspace byte?

Chapter 5 goes deeper. A layout type supplies field sizes and offsets; the
algorithm uses those constants to form addresses.

---

## Small programs, explicit invariants

Each loop needs an invariant that can be stated plainly:

- "B counts elements remaining."
- "HL points at the next byte to examine."
- "Everything before index i is sorted."

When a loop fails, its invariant provides the first point of comparison. The
instruction sequence can then be checked against that invariant.

---

## Workspace RAM

Algorithms with more than a few live values need scratch space that survives across calls or nested loops.

The pattern used throughout Book 3:

```asm
.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3
workspace:
    .ds byte[4]       ; algorithm-local scratch (uninitialized)
```

`.ds` reserves the bytes and leaves whatever was there, which suits temporaries
that the algorithm writes before reading.

---

## Register contracts as the subroutine spec

Every nontrivial routine in this book uses:

- A one-line human comment (`; gcd_u16: ...`)
- A `.routine` directive for `in`, `out`, `maybe-out`, `clobbers` and `preserves`
- A non-local entry label; prefix it with `@` only when another source unit imports it

`azm --rc warn` compares callers to callees, which [Book 1 Chapter 6](../book1/06-register-contracts.md) covers in full.

---

## Execution model

The assembler emits bytes from explicit source instructions and directives.
Layout types fold to constants at assembly time; address arithmetic appears in
the program only where the corresponding instructions appear in source.

---

## Programs and results

The files under this book's `examples/` directory contain the complete
programs. Each chapter identifies the RAM locations that hold the result after
execution reaches `halt`, giving you a direct comparison between a pencil trace
and the emulator state. The exercises extend the same representations,
invariants and register contracts.

---

## From arithmetic to search

[Chapter 1, Arithmetic Foundations](01-foundations.md) works through 16-bit GCD
and 8-bit exponentiation with the Book 3 calling convention, compare/subtract
idioms and the first workspace bytes.
[Chapter 2, Arrays and Loops](02-arrays-and-loops.md) adds contiguous tables,
insertion sort and linear search.

Later chapters add strings, bits, records, recursion, multiple source files, pointers and a capstone search.
