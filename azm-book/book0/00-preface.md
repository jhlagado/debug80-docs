---
layout: default
title: "Preface"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 0
---
[Manual](index.md) | [Getting Started →](01-getting-started.md)

# Preface

This manual is the definitive reference for programmers who want to use AZM effectively. It documents AZM source syntax, directives, expressions, layout types, register contracts, op declarations, diagnostics and output artifacts in a direct reference order.

If you already know Z80 assembly, you can start here. If you want a guided introduction to the machine first, use [AZM Book 1 — Z80 Fundamentals](../book1/index.md), then return to this manual when you need the exact assembler rule.

AZM is a modern Z80 assembler for the Debug80 toolchain. It keeps the emitted machine code visible while adding assembler-time support for larger programs: layout types, register contracts, op declarations, directive aliases, diagnostics, output artifacts and Debug80 source maps.

The chapters describe AZM's features in a direct reference order: source syntax, placement, constants, data directives, layout declarations, register contracts, op declarations, compatibility features, diagnostics and output formats. Code examples show the exact syntax AZM accepts and the bytes or metadata it produces.

Use this manual when you need the precise rule for a directive, expression, layout form, register contract option or command-line flag. The goal is simple: make AZM predictable enough that you can write serious Z80 programs, inspect the emitted bytes and Debug80 metadata and know exactly what the assembler checked on your behalf.

---

[Manual](index.md) | [Getting Started →](01-getting-started.md)
