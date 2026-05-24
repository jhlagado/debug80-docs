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

1. **Getting started** — what AZM is, how it fits with Debug80, what a small program looks like, and how to invoke the CLI.
2. **Source syntax and symbols** — parser rules, labels, the `@` entry prefix, forward references, and case rules.
3. **Addresses, constants, and expressions** — `.org`, `$`, `.equ`, expression operators, range checks, and enums.
4. **Data, storage, and includes** — `.db`, `.dw`, string directives, `.ds`, and multi-file project organization.
5. **The layout system** — scalar types, `sizeof`, `offset`, records with `.type`, unions with `.union`, and compact cast syntax.
6. **Register care and contracts** — `@` entry labels, AZMDoc `;!` syntax, conflict checking, and the audit-to-error workflow.
7. **Ops and aliases** — inline op declarations, operand classes, overloads, and directive compatibility.
8. **Diagnostics, listings, and output** — error codes, listing format, output artifacts, and binary comparison.
9. **Porting, style, and reference** — nine-step migration strategy, style conventions, and a complete worked program.

---

## Chapter table

| Ch | File | What it covers |
|----|------|----------------|
| — | [Preface](00-preface.md) | Audience, assumptions, and the purpose of the manual |
| 1 | [Getting Started with AZM](01-getting-started.md) | Feature map, Debug80 integration, a first program, and the full CLI reference |
| 2 | [Source Syntax and Symbols](02-source-syntax.md) | Line structure, number formats, strings, directive names, labels, `@` entries, and forward references |
| 3 | [Addresses, Constants, and Expressions](03-addresses-constants-expressions.md) | `.org`, `$`, `.equ`, expressions, range checks, and enums |
| 4 | [Data, Storage, and Includes](04-data-storage-includes.md) | `.db`, `.dw`, string directives, `.ds`, and project file organization |
| 5 | [The Layout System](05-layout-system.md) | Scalar types, `sizeof`, `offset`, records, unions, and compact cast syntax |
| 6 | [Register Care and Contracts](06-register-care.md) | `@` entry labels, AZMDoc `;!` syntax, conflict checking, and the audit-to-error workflow |
| 7 | [Op Declarations and Aliases](07-ops-aliases.md) | Inline op declarations, operand classes, overloads, and directive compatibility |
| 8 | [Diagnostics, Listings, and Output](08-diagnostics-listings-output.md) | Error codes, listing format, binary/HEX/d8.json/ASM80 outputs, and binary comparison |
| 9 | [Porting, Style, and Reference](09-porting-style-reference.md) | Nine-step migration strategy, style conventions, and a complete worked reference program |

---

## Appendices

The appendices for this manual should eventually include directive, expression, operand-class, CLI, and compatibility references. For now, the general [AZM Books appendices](../appendices/index.md) cover number notation, registers, flags, addressing forms, and Z80 instruction support.

---

[← AZM Books](../index.md) | [Preface →](00-preface.md)
