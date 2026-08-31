---
layout: default
title: "Appendix 2 — Expressions and Numeric Forms"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 2
nav_group: "Assembler reference"
---

# Appendix 2 — Expressions and Numeric Forms

## Operator table

Operators appear from lowest to highest precedence. Operators at the same level
associate from left to right.

| Operator | Operation | Precedence |
| --- | --- | ---: |
| <code>&#124;</code> | Bitwise OR | 1 |
| `^` | Bitwise XOR | 2 |
| `&` | Bitwise AND | 3 |
| `<<` | Left shift | 4 |
| `>>` | Right shift | 4 |
| `+` | Add | 5 |
| `-` | Subtract | 5 |
| `*` | Multiply | 6 |
| `/` | Integer division, truncating towards zero | 6 |
| `%` | Remainder with the dividend's sign | 6 |
| unary `+` | Identity | 7 |
| unary `-` | Negation | 7 |
| `~` | Bitwise NOT | 7 |

Parentheses and values have the highest precedence. Shift counts range from 0
through 23.

## Numeric forms

| Form | Example | Base | Notes |
| --- | --- | ---: | --- |
| Plain decimal | `42` | 10 | 0 through 65,535 |
| `$` prefix | `$2A` | 16 | Bare `$` is the current output address |
| Intel `H` suffix | `02AH` | 16 | Must begin with a decimal digit |
| `%` prefix | `%101010` | 2 | `%` between expressions is remainder |
| Intel `B` suffix | `101010B` | 2 | Must contain only binary digits |
| Character | `'A'` | — | Decodes to exactly one byte |

Numeric syntax is case-insensitive. `0FFH` is hexadecimal 255; `FFH` is a
symbol name because it begins with a letter.

## Concrete and forward domains

Concrete evaluation uses signed 24-bit intermediates and accepts a final value
from −32,768 through 65,535. The receiving field applies its own range.

A forward value stores one symbol plus an addend from −128 through 127.
Addition and subtraction are accepted only while they preserve that affine
form. `LOW()` and `HIGH()` may be its outermost operation.

| Form | Forward status |
| --- | --- |
| `TARGET` | Accepted |
| `TARGET+5` | Accepted |
| `5+TARGET` | Accepted |
| `TARGET-(2*3)` | Accepted |
| `LOW(TARGET+1)` | Accepted in compatible byte fields |
| `TARGET1+TARGET2` | Rejected |
| `TARGET*2` | Rejected |
| `-TARGET` | Rejected |
| `LOW(TARGET)+1` | Rejected |
