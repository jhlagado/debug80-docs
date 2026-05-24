---
layout: default
title: "AZM Books"
nav_order: 6
has_children: true
---
# AZM Books

Three teaching books and one assembler manual for working with **AZM**, the assembler used by the Debug80 environment. Start with the machine, move to the TEC-1G target and Debug80 workflow, then use AZM's larger-program features for algorithms and data structures. Use the manual when you already know assembly and want the AZM language and tool behavior directly.

---

## [Introduction](introduction.md)

Why assembly language, why AZM, why the Z80 — and what you'll be able to do after each book.

---

## [AZM Book 1 — Z80 Fundamentals](book1/)

No prior knowledge assumed. Learn the machine from first principles: memory, registers, instructions, flags, loops, subroutines, I/O, and the AZM features that make assembly practical and safe.

Fourteen chapters from bare machine code through ops, layout types, and register contracts.

---

## [AZM Book 2 — Programming the TEC-1G](book2/)

In progress and publishable as a roadmap. Learn the TEC-1G as a concrete target: MON-3 services, Debug80 projects, keypad input, LCD text, the six-digit seven-segment display, scanning, sound, the 8x8 RGB add-on, and small interactive programs.

The outline draws on the Tetro and Pacmo TEC-1G game codebases without depending on those games as prerequisites. Their shared hardware layer comes before the case studies, so those chapters can grow into multi-chapter material later if the programs need more room.

---

## [AZM Book 3 — Algorithms and Data Structures](book3/)

For readers who know the Z80 basics. Works through real algorithms — sorting, searching, strings, bit manipulation, recursion, composition, pointer structures — using the full AZM surface as each construct appears naturally.

Ten chapters from foundations to a complete eight-queens capstone.

---

## [AZM Book 4 — Assembler Manual](book4/)

The AZM assembler manual. Covers AZM syntax, directives, expressions, labels, enums, storage, layout types, register contracts, op declarations, aliases, diagnostics, listings, output formats, ASM80-compatible output, porting, and source style.

This is the direct route into the assembler itself, not a beginner Z80 course.

---

## [Appendices](appendices/)

Quick-reference material for the whole series: number systems and ASCII, registers and flags, addressing modes, and a searchable Z80 instruction table.

---

> **Mermaid diagrams** — These books are Mermaid-ready. All ` ``` `mermaid` ``` ` fenced blocks render as live diagrams. Future chapters will use sequence diagrams, flowcharts, and state machines to illustrate hardware flow, algorithm structure, and memory layouts.
