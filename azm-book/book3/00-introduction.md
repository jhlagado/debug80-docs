---
layout: default
title: "Introduction"
parent: "AZM Book 3 — Algorithms and Data Structures"
nav_order: 1
---
[Book 3](index.md) | [Foundations →](01-foundations.md)

# Introduction to Book 3

You finished Book 2 with the Z80 and the AZM surface: register conventions, register contracts, layout types and ops. Book 3 puts that toolkit to work on algorithms and small data structures, the programs you would write in a systems or embedded course, but without leaving flat assembly.

---

## About this book

Each chapter starts from a concrete problem (sort this table, find this value, walk this string), shows a complete AZM program or subroutine, then names the invariants and conventions that make the code trustworthy.

---

## Wirth: representation before algorithm

Niklaus Wirth's programs are often taught as "algorithm + data structure." In assembly, those two collapse into one question: **how are the values laid out in memory and how do you reach them?**

Before you write the sort loop, you decide:

- Is the array a contiguous block of bytes starting at a label?
- Is each element a plain `byte`, or a `Sprite` record with `sizeof(Sprite)` stride?
- Does the index live in B, in L or in a workspace byte?

Chapter 5 (records) goes deeper: the layout type is the contract; the algorithm only adds offsets the assembler already computed.

---

## K&R: small programs, explicit invariants

Each loop should have an invariant you can say out loud:

- "B counts elements remaining."
- "HL points at the next byte to examine."
- "Everything before index i is sorted."

When something breaks, you check the invariant first, then the instruction sequence.

---

## Workspace RAM

Algorithms with more than a few live values need scratch space that survives across calls or nested loops.

The pattern used throughout Book 3:

```asm
.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3

.org $7F00
workspace:
    .ds byte[4]       ; algorithm-local scratch (uninitialized)
```

`.ds` reserves bytes without initializing them. That is fine for temporaries you overwrite before reading.

---

## Register contracts as the subroutine spec

Every nontrivial routine in this book should carry:

- A one-line human comment (`; gcd_u16: ...`)
- A `.routine` directive for `in`, `out`, `maybe-out`, `clobbers` and `preserves`
- A non-local entry label; prefix it with `@` only when another source unit imports it

`azm --rc warn` compares callers to callees the same way Book 2 Chapter 12 demonstrated.

---

## No hidden runtime

There is no garbage collector, no stdlib, no generated frame setup. Layout types fold to constants at assemble time; they do not emit indexing instructions unless you write them.

---

## How to use the chapters

1. Read the chapter prose for the problem and the invariant.
2. Open the cited file under this book's `examples/` directory.
3. Assemble it, run to `halt`, inspect the documented RAM locations.
4. Do the exercises with pencil and emulator before peeking at hints.

---

## What comes next

[Chapter 1 — Foundations](01-foundations.md) works through GCD and digit counting on 16-bit values. No arrays yet: only the Book 3 calling convention, compare/subtract idioms and the first workspace bytes. [Chapter 2 — Arrays and Loops](02-arrays-and-loops.md) adds contiguous tables, insertion sort and linear search.

Later chapters add strings, bits, records, recursion, multiple source files, pointers and a capstone search.

---

[Book 3](index.md) | [Foundations →](01-foundations.md)
