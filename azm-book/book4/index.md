---
layout: default
title: "AZM Assembler Manual"
parent: "AZM Books"
nav_order: 5
has_children: true
---
# AZM Assembler Manual

This manual is for programmers who already know assembly language and want to learn the AZM assembler itself. It is not a novice Z80 course. It assumes you can read ordinary Z80 code and focuses on AZM source syntax, directives, expressions, layout types, register contracts, op declarations, compatibility features, diagnostics, and output formats.

The three numbered AZM books teach programming. This supplementary manual teaches the tool.

---

## Learning arc

1. **Orientation** — what AZM is, how it fits with Debug80, and what a small AZM program looks like.
2. **Source syntax** — parser rules, labels, symbols, `.org`, `$`, `.equ`, expressions, enums, data directives, storage, and includes.
3. **Layout facilities** — built-in layout types, records, unions, `sizeof`, `offset`, typed `.ds`, and compact layout notation.
4. **Assembler extensions** — AZMDoc register contracts, `@` entry labels, op declarations, aliases, and compatibility syntax.
5. **Operating the assembler** — diagnostics, listings, output formats, ASM80-compatible output, porting, style, and a complete worked reference program.

---

## Chapter table

| Ch | File | Status | What it covers |
|----|------|--------|----------------|
| — | [Preface](00-preface.md) | **Stub** | Audience, assumptions, and the purpose of the manual |
| 1 | [What AZM Is](01-what-azm-is.md) | **Stub** | AZM as a Z80 assembler, Debug80 integration, and the feature map |
| 2 | [A First AZM Program](02-first-azm-program.md) | **Stub** | Minimal source structure, `.org`, labels, comments, data, and listings |
| 3 | [Running AZM](03-running-azm.md) | **Stub** | CLI use, npm install, default artifacts, `--nolist`, `--asm80`, and Debug80 |
| 4 | [Lexical Syntax and Parser Rules](04-lexical-syntax.md) | **Stub** | Lines, comments, numbers, strings, case rules, and strict parsing |
| 5 | [Labels and Symbols](05-labels-and-symbols.md) | **Stub** | Global labels, case-sensitive symbols, forward references, and `@` entries |
| 6 | [Program Addressing with `.org` and `$`](06-org-and-current-address.md) | **Stub** | Origins, assembly location, `$`, address arithmetic, and gaps |
| 7 | [Constants with `.equ`](07-equ-constants.md) | **Stub** | Equates, hardware constants, addresses, sizes, and style |
| 8 | [Expressions](08-expressions.md) | **Stub** | Arithmetic, symbols, range checks, folding, and invalid expressions |
| 9 | [Enums as Grouped Constants](09-enums.md) | **Stub** | State, command, and token constants with qualified names |
| 10 | [Data Directives](10-data-directives.md) | **Stub** | `.db`, `.dw`, `.addr`, strings, vectors, and endianness |
| 11 | [Reserving Storage with `.ds`](11-ds-storage.md) | **Stub** | Raw storage, typed storage, fill bytes, and named-count idioms |
| 12 | [Includes and Source Organization](12-includes.md) | **Stub** | `.include`, include boundaries, shared constants, layouts, and libraries |
| 13 | [Layout Types: The Core Idea](13-layout-types-core.md) | **Stub** | Compile-time memory contracts, scalar types, `sizeof`, and arrays |
| 14 | [Records with `.type`](14-records.md) | **Stub** | Record fields, nested layouts, `offset`, allocation, and IX/IY offsets |
| 15 | [Unions and Alternate Views](15-unions.md) | **Stub** | Overlaid fields, word/byte views, and hardware register overlays |
| 16 | [Compact Layout Access Syntax](16-compact-layout-syntax.md) | **Stub** | Dot/bracket notation as constant-address notation |
| 17 | [Labels, Entry Points, and Register Contracts](17-entry-points-register-contracts.md) | **Stub** | `@` labels, subroutine boundaries, liveness, and register-care analysis |
| 18 | [AZMDoc Syntax](18-azmdoc-syntax.md) | **Stub** | Register contract notation, inputs, outputs, clobbers, and warnings |
| 19 | [Op Declarations](19-op-declarations.md) | **Stub** | Inline ops, operands, overloads, hygiene, cycles, and diagnostics |
| 20 | [Aliases and Compatibility Syntax](20-aliases-compatibility.md) | **Stub** | Canonical dotted directives, accepted aliases, and legacy source |
| 21 | [Diagnostics and Error Handling](21-diagnostics.md) | **Stub** | Parse errors, range errors, duplicate symbols, op failures, and warnings |
| 22 | [Listings and Symbol Visibility](22-listings.md) | **Stub** | `.lst` output, default listings, `--nolist`, addresses, bytes, and source lines |
| 23 | [Output Formats](23-output-formats.md) | **Stub** | Binary, Intel HEX, listings, Debug80 metadata, and segment behavior |
| 24 | [ASM80-Compatible Output](24-asm80-output.md) | **Stub** | Lowered source, `--asm80`, compatibility limits, and comparison workflows |
| 25 | [Porting Existing Z80 Source to AZM](25-porting-source.md) | **Stub** | Migration strategy, syntax normalization, layout improvements, and binary comparison |
| 26 | [Style Guide for AZM Source](26-style-guide.md) | **Stub** | Naming, file order, comments, contracts, ops, and keeping machine code visible |
| 27 | [Complete Worked Reference Program](27-worked-reference-program.md) | **Stub** | One medium program using constants, layouts, contracts, ops, and outputs |

---

## Appendices

The appendices for this manual should eventually include directive, expression, operand-class, CLI, and compatibility references. For now, the general [AZM Books appendices](../appendices/index.md) cover number notation, registers, flags, addressing forms, and Z80 instruction support.

---

[← AZM Books](../index.md) | [Preface →](00-preface.md)
