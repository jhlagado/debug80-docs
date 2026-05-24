---
layout: default
title: "Introduction"
parent: "AZM Book 3 — Algorithms and Data Structures"
grand_parent: "AZM Books"
nav_order: 1
---
[Book 3](index.md) | [Foundations →](01-foundations.md)

# Introduction to Book 3

You finished Book 1 with a complete picture of the Z80 and the AZM surface that keeps assembly honest: register conventions, AZMDoc contracts, layout types, and ops. Book 3 puts that toolkit to work on algorithms and small data structures — the programs you would write in a systems or embedded course, but without leaving flat assembly.

---

## About this book

The goal is not to learn a second language layered on top of the CPU. The goal is to learn how **representation and algorithm** fit together when you own every byte and every branch.

Each chapter starts from a concrete problem (sort this table, find this value, walk this string), shows a complete AZM program or subroutine, then names the invariants and conventions that make the code trustworthy. You will see the same patterns repeat: a calling convention, a loop whose entry condition you can state in one sentence, workspace RAM when the register file runs out, and AZMDoc lines that tell the analyzer what the routine promised.

This book stays at the machine level: labels, registers, memory, branches, `call`, and `ret`. The algorithms are standard, but every step is spelled as flat assembly.

---

## Wirth: representation before algorithm

Niklaus Wirth's programs are often taught as "algorithm + data structure." In assembly, those two collapse into one question: **how are the values laid out in memory, and how do you reach them?**

Before you write the sort loop, you decide:

- Is the array a contiguous block of bytes starting at a label?
- Is each element a plain `byte`, or a `Sprite` record with `sizeof(Sprite)` stride?
- Does the index live in B, in L, or in a workspace byte?

Book 3 Chapter 2 is the first place those questions drive the code. Chapter 5 (records) goes deeper: the layout type is the contract; the algorithm only adds offsets the assembler already computed.

---

## K&R: small programs, explicit invariants

The examples stay small enough to read in one sitting. Each loop should have a invariant you can say out loud:

- "B counts elements remaining."
- "HL points at the next byte to examine."
- "Everything before index i is sorted."

When something breaks, you check the invariant first, then the instruction sequence. That is the debugging habit Book 1 started; Book 3 assumes you will use it on every chapter.

---

## Workspace RAM

Book 1 used registers for almost everything. Algorithms with more than a few live values need scratch space that survives across calls or nested loops.

The pattern used throughout Book 3:

```asm
.org $8000
values:
    .db 9, 4, 6, 2, 8, 1, 7, 3

.org $7F00
workspace:
    .ds byte[4]       ; algorithm-local scratch (uninitialized)
```

`.org` places labels at fixed addresses. `.ds` reserves bytes without initializing them — fine for temporaries you overwrite before reading. Named workspace beats anonymous stack tricks in early chapters; recursion (Chapter 6) will revisit the IX stack frame from Book 1 Chapter 11.

---

## AZMDoc as the subroutine spec

Every nontrivial routine in this book should carry:

- A one-line human comment (`; gcd_u16: ...`)
- `;!` lines for `in`, `out`, `clobbers`, and `preserves`
- An `@` entry label

Callers depend on that contract. `azm --rc warn` compares callers to callees the same way Book 1 Chapter 12 demonstrated. Book 3 does not introduce a new documentation dialect.

---

## No hidden runtime

There is no garbage collector, no stdlib, no generated frame setup. A `call` pushes a return address; a `ret` pops it. Layout types fold to constants at assemble time — they do not emit indexing instructions unless you write them.

If a chapter shows `<Sprite[8]>sprite_table[i].x`, that expression is a **compile-time address**, not a load instruction the assembler invented.

---

## How to use the chapters

1. Read the chapter prose for the problem and the invariant.
2. Open the cited file under this book's `examples/` directory.
3. Assemble it, run to `halt`, inspect the documented RAM locations.
4. Do the exercises with pencil and emulator before peeking at hints.

Memorizing opcode sequences is not the point. The point is knowing **what problem** a listing solves and **which registers and memory** belong to whom at each label.

---

## What comes next

[Chapter 1 — Foundations](01-foundations.md) works through GCD and digit counting on 16-bit values. No arrays yet — only the Book 3 calling convention, compare/subtract idioms, and the first workspace bytes. [Chapter 2 — Arrays and Loops](02-arrays-and-loops.md) adds contiguous tables, insertion sort, and linear search.

Later chapters add strings, bits, records, recursion, multiple source files, pointers, and a capstone search. The [Book 3 index](index.md) lists which chapters are written versus outlined.

---

[Book 3](index.md) | [Foundations →](01-foundations.md)
