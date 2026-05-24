---
layout: default
title: "Preface"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 0
---
[Manual](index.md) | [Getting Started →](01-getting-started.md)

# Preface

This manual is for Z80 programmers who already know assembly language and want to know how AZM spells things. It assumes you can read Z80 source — labels, instructions, operands, directives — and that you understand registers, flags, and memory addressing well enough to write a working subroutine. Books 1, 2, and 3 in this series teach that foundation. This manual does not repeat it.

What this manual covers: AZM source syntax, the directive set, expression forms, layout types, register-care contracts, op declarations, directive aliases, diagnostics, listings, and output formats. Each chapter covers one area of the language or tool completely — syntax forms, options, and what each does — rather than building from a worked example. When code appears, it illustrates syntax, not a teaching progression.

What this manual does not cover: Z80 instruction semantics, memory architecture, or programming technique. Those belong in the numbered books. If you find yourself asking why a Z80 instruction works the way it does, you are in the wrong document.

AZM is the assembler used throughout the Debug80 toolchain. The three teaching books assume it. This manual describes the tool itself — the thing that turns `.asm` files into binary, listings, and Debug80 metadata. Read it when you need to know what a directive does, how a flag interacts with the others, or what the assembler actually checks.

---

[Manual](index.md) | [Getting Started →](01-getting-started.md)
