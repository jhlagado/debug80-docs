---
layout: default
title: "Chapter 6 — Recursion"
parent: "Part 2 — Algorithms and Data Structures"
grand_parent: "Learn AZM Assembly"
nav_order: 7
---
[← Records](05-records.md) | [Part 2](index.md) | [Composition →](07-composition.md)

# Chapter 6 — Recursion

*Planned — outline only.*

Recursion is nested `call` with a finite base case. This chapter revisits the **IX stack frame** from Part 1 Chapter 11 for locals that must survive nested calls, and shows how to preserve return values in A or HL across inner calls.

**Topics (planned):**

- Stack depth and when recursion is safe on the Z80
- Tower of Hanoi: DE/HL roles, move count in workspace
- Recursive sum or reverse of a byte list
- Base case discipline; AZMDoc `preserves` across internal helpers
- Companion example: `examples/06_hanoi.asm`

---

[← Records](05-records.md) | [Part 2](index.md) | [Composition →](07-composition.md)
