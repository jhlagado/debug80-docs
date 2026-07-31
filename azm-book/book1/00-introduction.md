---
layout: default
title: "Introduction"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 0
---

# Introduction

This book is the manual for AZM, an enhanced assembler for the Z80. It
covers the assembler's own facilities: source syntax and symbols, address
and constant expressions, data storage, the layout system for records and
tables, register contracts for disciplined subroutines, ops for reusable
instruction patterns, and the diagnostics and listings the toolchain
produces.

## The assembler

A plain assembler translates mnemonics to machine code and leaves every
convention in the programmer's head. AZM keeps the direct relationship to
the machine — what you write is what assembles — and adds the structure
that real projects need: named layouts with field offsets and sizes,
declared register contracts that the assembler checks at call boundaries,
and composable ops that capture instruction patterns without hiding them.
The generated listing always shows the exact bytes, so the additions cost
nothing in transparency.

## The intended reader

We assume you can read Z80 assembly — registers, addressing, flags, the
stack. If you are new to the Z80, [AZM Book 2](../book2/index.md) teaches
those fundamentals from nothing and is the place to start; this manual
will still be here when you return. If you already write Z80 assembly
with another assembler, you can move quickly: the early chapters cover
familiar ground in AZM's spelling, and the later ones introduce the
facilities other assemblers lack.

## The book's method

Each chapter takes one facility and works it through examples that
assemble. We move from the source format outward: getting started, then
syntax and symbols, expressions, data and storage, and from there into
AZM's distinctive territory — layouts, register contracts and ops —
before closing with diagnostics and output. The
[appendices](../appendices/) hold the complete directive, operator, CLI
and built-in function tables, alongside the Z80 machine reference, so the
chapters can teach while the tables stay ready for lookup.

The first chapter installs the toolchain and assembles a first program.
