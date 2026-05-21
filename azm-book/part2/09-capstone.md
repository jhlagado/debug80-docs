---
layout: default
title: "Chapter 9 — Capstone"
parent: "Part 2 — Algorithms and Data Structures"
grand_parent: "Learn AZM Assembly"
nav_order: 10
---
[← Pointer Structures](08-pointer-structures.md) | [Part 2](index.md)

# Chapter 9 — Capstone

*Planned — outline only.*

A single program that combines search, backtracking, and board representation — **eight queens** on an 8×8 grid (or an equivalent constraint-satisfaction puzzle). You will place queens row by row, test attacks with bit masks or byte tables, and unwind with explicit stack discipline.

**Topics (planned):**

- Board representation: 8 bytes (column per row) or 64-cell table
- Safety check as a subroutine with clear `;!` contract
- Depth-first search with push/pop of trial state
- Print or store first solution to workspace
- Optional: count all solutions
- Companion example: `examples/09_eight_queens.asm`

---

[← Pointer Structures](08-pointer-structures.md) | [Part 2](index.md)
