---
layout: default
title: "Preface"
parent: "AZM Book 4 — Assembler Manual"
nav_order: 0
---
[Manual](index.md) | [Getting Started →](01-getting-started.md)

# Preface

This manual is for Z80 programmers who already know assembly language and want to use AZM effectively. It assumes you can read Z80 source — labels, instructions, operands and directives — and that you understand registers, flags and memory addressing well enough to write a working subroutine. Books 1, 2 and 3 in this series build that foundation.

AZM is a modern Z80 assembler for the Debug80 toolchain. It keeps the emitted machine code visible while adding assembler-time support for larger programs: layout types, register-care contracts, op declarations, directive aliases, diagnostics, output artifacts and Debug80 source maps.

The chapters describe AZM's features in a direct reference order: source syntax, placement, constants, data directives, layout declarations, register contracts, op declarations, compatibility features, diagnostics and output formats. Code examples show the exact syntax AZM accepts and the bytes or metadata it produces.

Use this manual when you need the precise rule for a directive, expression, layout form, register-care option or command-line flag. The goal is simple: make AZM predictable enough that you can write serious Z80 programs, inspect the emitted bytes and Debug80 metadata and know exactly what the assembler checked on your behalf.

---

[Manual](index.md) | [Getting Started →](01-getting-started.md)
