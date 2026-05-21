---
layout: default
title: "Chapter 8 — Pointer Structures"
parent: "Part 2 — Algorithms and Data Structures"
grand_parent: "Learn AZM Assembly"
nav_order: 9
---
[← Composition](07-composition.md) | [Part 2](index.md) | [Capstone →](09-capstone.md)

# Chapter 8 — Pointer Structures

*Planned — outline only.*

Records become **nodes** when a field has type `addr`. This chapter builds a singly linked list and a small binary search tree in fixed RAM — explicit allocation from a free pool, no heap.

**Topics (planned):**

- `addr` fields and `null` as 0
- Node layout with `.type`; insert at head; traverse with HL
- BST insert and search; stack-free iterative search option
- Union layouts for tagged nodes (optional)
- Companion example: `examples/08_linked_list.asm`, `examples/08_bst.asm`

---

[← Composition](07-composition.md) | [Part 2](index.md) | [Capstone →](09-capstone.md)
