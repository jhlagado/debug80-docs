---
layout: default
title: "Introduction"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 1
---
[Book 3](index.md) | [Foundations →](01-foundations.md)

# Introduction to Book 3

You finished Book 2 with the Z80 programming model and AZM's register
contracts, layout types and ops. Book 3 applies those tools to algorithms and
small data structures in flat assembly.

---

## About this book

Each chapter starts from a concrete problem (sort this table, find this value, walk this string), shows a complete AZM program or subroutine, then names the invariants and conventions that make the code trustworthy.

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

## K&R: small programs, explicit invariants

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

`.ds` reserves bytes without initializing them. It is suitable for temporaries
that the algorithm writes before reading.

---

## Register contracts as the subroutine spec

Every nontrivial routine in this book uses:

- A one-line human comment (`; gcd_u16: ...`)
- A `.routine` directive for `in`, `out`, `maybe-out`, `clobbers` and `preserves`
- A non-local entry label; prefix it with `@` only when another source unit imports it

`azm --rc warn` compares callers to callees the same way Book 2 Chapter 12 demonstrated.

---

## Execution model

AZM supplies no garbage collector, standard library or generated frame setup.
Layout types fold to constants at assembly time; address arithmetic appears in
the program only when you write the corresponding instructions.

---

## Reading and running the chapters

Each chapter first defines the problem and its invariant. The corresponding file
under this book's `examples/` directory provides the complete program. Its
documented RAM locations show the result after assembly and execution to
`halt`. The exercises are designed for working through with pencil and emulator
before consulting any hints.

---

## The next chapters

[Chapter 1 — Foundations](01-foundations.md) works through 16-bit GCD and 8-bit
exponentiation. No arrays yet: only the Book 3 calling convention,
compare/subtract idioms and the first workspace bytes.
[Chapter 2 — Arrays and Loops](02-arrays-and-loops.md) adds contiguous tables,
insertion sort and linear search.

Later chapters add strings, bits, records, recursion, multiple source files, pointers and a capstone search.

---

[Book 3](index.md) | [Foundations →](01-foundations.md)
