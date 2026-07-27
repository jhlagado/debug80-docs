---
layout: default
title: "Appendices"
parent: "AZM Books"
nav_order: 6
has_children: true
has_toc: false
---
# Appendices — Global Reference

These appendices provide lookup material for the whole AZM book series. Lettered appendices describe the assembler, numbered appendices describe the Z80 itself.

---

## AZM Reference

What the assembler accepts and what it does with it.

| App | File | What it is for |
|-----|------|----------------|
| A | [Directive Reference](appendix-a-directives.md) | Every directive and declaration keyword, with the chapter that introduces it |
| B | [Expression Operators](appendix-b-operators.md) | Operator precedence, associativity, and evaluation rules |
| C | [CLI Flag Reference](appendix-c-cli.md) | Command line flags and their defaults |
| D | [Built-in Functions](appendix-d-functions.md) | `sizeof`, `offset`, `LSB` and `MSB` |

---

## Z80 Reference

What the machine underneath does, independent of any assembler.

| App | File | What it is for |
|-----|------|----------------|
| 1 | [Numbers, Notation, and ASCII](01-numbers-notation-and-ascii.md) | Hex, binary, decimal, common landmarks, and 7-bit ASCII |
| 2 | [Registers, Flags, and Conditions](02-registers-flags-and-conditions.md) | Register roles, flag meanings, and branch condition codes |
| 3 | [Addressing, Prefixes, and Instruction Forms](03-addressing-prefixes-and-instruction-forms.md) | Addressing shapes, prefix families, and quick instruction-form tables |
| 4 | [Classic Z80 Instruction Support Table](04-classic-z80-instruction-support.md) | Searchable reference for standard and classic-undocumented Z80 instructions |

---

## Scope

These appendices help with:

- fast lookup while reading any AZM book
- checking a directive, mnemonic or operand form without leaving the book
- remembering the small exceptions the Z80 instruction set is full of
