---
layout: default
title: "AZM Book 0 — Assembler Manual"
nav_order: 4
has_children: true
---
# AZM Book 0 — Assembler Manual

This is the definitive reference for the AZM assembler format and tooling. It documents the source syntax, directives, expressions, layout types, register contracts, op declarations, compatibility features, diagnostics and output formats that define AZM source files.

Read this first when you want the assembler rules directly. If you want a guided introduction to Z80 programming before using the reference, start with [AZM Book 1 — Z80 Fundamentals](../book1/index.md).

---

## Learning arc

1. **Getting started** — what AZM is, how it fits with Debug80, what a small program looks like and how to invoke the CLI.
2. **Source syntax and symbols** — parser rules, labels, the `@` entry prefix, forward references, case rules and naming conventions.
3. **Addresses, constants and expressions** — `.org`, `$`, `.equ`, expression operators, range checks and enums.
4. **Raw data, storage and strings** — `.db`, `.dw`, little-endian byte order, string directives and `.ds`.
5. **The layout system** — scalar types, `sizeof`, `offset`, records with `.type`, type aliases with `.typealias`, unions with `.union` and compact cast syntax.
6. **Register care and contracts** — a concrete collision example, `@` entry labels, AZMDoc `;!` syntax, conflict checking and the audit-to-error workflow.
7. **Ops and aliases** — inline op declarations, operand classes, overloads, directive compatibility and source file inclusion.
8. **Diagnostics and output** — error codes, how to read a failing build, warnings vs errors and output artifacts.

---

## Chapter table

| Ch | File | What it covers |
|----|------|----------------|
| — | [Preface](00-preface.md) | Audience, assumptions and the purpose of the manual |
| 1 | [Getting Started with AZM](01-getting-started.md) | Debug80 integration, source extensions, a first program and basic invocation |
| 2 | [Source Syntax and Symbols](02-source-syntax.md) | Line structure, comments, labels, `@` entries, naming conventions, case rules and numeric literals |
| 3 | [Addresses, Constants and Expressions](03-addresses-constants-expressions.md) | `.org`, `$`, `.equ`, expressions, range checks and enums |
| 4 | [Raw Data, Storage and Strings](04-data-storage-includes.md) | `.db`, `.dw`, little-endian byte order, string directives and `.ds` |
| 5 | [The Layout System](05-layout-system.md) | Scalar types, `sizeof`, `offset`, records, type aliases, unions and compact cast syntax |
| 6 | [Register Care and Contracts](06-register-care.md) | Register collisions, `@` entry labels, AZMDoc `;!` syntax, conflict checking and the audit-to-error workflow |
| 7 | [Op Declarations and Aliases](07-ops-aliases.md) | Inline op declarations, operand classes, overloads, directive compatibility and source file inclusion |
| 8 | [Diagnostics and Output](08-diagnostics-listings-output.md) | Error codes, reading a failing build, warnings vs errors and output artifacts |

---

## Appendices

| Appendix | File | What it covers |
|----------|------|----------------|
| A | [Directive Reference](appendix-a-directives.md) | All directives with syntax, purpose and chapter reference; built-in alias table |
| B | [Expression Operators](appendix-b-operators.md) | Operator table with precedence and numeric literal formats |
| C | [CLI Flag Reference](appendix-c-cli.md) | All command-line flags grouped by category |
| D | [Built-in Functions](appendix-d-functions.md) | `sizeof`, `offset`, `LSB` and `MSB` — syntax, return values and case rules |

The general [AZM Books appendices](../appendices/index.md) cover number notation, registers, flags, addressing forms and Z80 instruction support.

---

[← AZM Books](../index.md) | [Preface →](00-preface.md)
