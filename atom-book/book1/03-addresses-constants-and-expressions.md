---
layout: default
title: "Addresses, Constants and Expressions"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 3
---

# Addresses, Constants and Expressions

Labels and `ORG` establish logical addresses. Numeric literals, symbols,
character literals, the current address, operators, and two byte functions form
assembler expressions.

## `ORG` and the logical cursor

`ORG` sets the address assigned to the next output operation:

```asm
ORG 4000H
START:
    NOP
```

`START` receives `$4000`. `ORG` emits no byte. A later `ORG` may move the cursor
backward only if subsequent output does not precede or overlap bytes already
emitted. Artifact sizing follows the greatest address reached, even if a later
`ORG` moves the cursor backward.

The source owns placement through `ORG`. The desktop target profile sets the
permitted address range; it does not relocate the program or override its
labels. The generic profile covers the ordinary flat 16-bit address space. The
`cpm22` profile requires a flat program loaded and entered at `$0100`.

## Current address

`$` by itself is the current logical output address:

```asm
TABLE:
    DB 1,2,3,4
TABLE_SIZE EQU $-TABLE
```

Within a `DB` or `DW` list, Atom reevaluates `$` at the address of each list
item.

## Numeric forms

Atom accepts decimal, hexadecimal, binary, and one-byte character literals:

| Form | Example | Value |
| --- | --- | ---: |
| Decimal | `42` | 42 |
| `$` hexadecimal | `$2A` | 42 |
| Intel hexadecimal | `02AH` | 42 |
| `%` binary | `%101010` | 42 |
| Intel binary | `101010B` | 42 |
| Character | `'A'` | 65 |

An Intel hexadecimal literal beginning with a letter needs a leading zero.
`0FFH` is 255; `FFH` is a symbol name. Literal values range from 0 through
65,535.

A character literal must decode to exactly one byte. It accepts the string
escape set: `\0`, `\n`, `\r`, `\t`, `\'`, `\"`, `\\`, and `\xHH`.

## Operators and precedence

Precedence runs from lowest to highest:

| Level | Operators |
| ---: | --- |
| 1 | <code>&#124;</code> |
| 2 | `^` |
| 3 | `&` |
| 4 | `<<`, `>>` |
| 5 | `+`, `-` |
| 6 | `*`, `/`, `%` |
| 7 | unary `+`, unary `-`, `~` |
| 8 | parentheses and values |

Operators at the same level associate from left to right. Division truncates
towards zero; remainder has the dividend's sign. Shift counts range from 0
through 23.

Concrete evaluation uses signed 24-bit intermediates. The final word domain is
−32,768 through 65,535. The receiving instruction or directive may impose a
narrower range.

## `LOW` and `HIGH`

`LOW(EXPR)` returns bits 0–7. `HIGH(EXPR)` returns bits 8–15:

```asm
ADDRESS EQU 0C432H
DB LOW(ADDRESS),HIGH(ADDRESS)    ; EMITS $32,$C4
```

The names are case-insensitive. `LOW` and `HIGH` remain legal symbol names when
they are not followed by an opening parenthesis.

## Forward expressions

An unresolved expression may contain one symbol and a signed-byte addend.

These forms can be retained:

```asm
DW TARGET
DW TARGET+5
DB LOW(TARGET-2)
LD HL,TARGET+4
```

The addend must fit −128 through 127. Atom rejects expressions with two
unresolved symbols, multiplication of an unresolved symbol, or unary negation
of an unresolved symbol.

`LOW()` or `HIGH()` may wrap one forward affine expression. The function must
be the outermost operation, so `LOW(TARGET+1)` is valid while
`LOW(TARGET)+1` is not. Forward byte functions are not accepted for relative
branches or IX/IY displacements.

## Range belongs to the receiving field

The expression evaluator produces a value before the instruction or directive
checks its field:

| Context | Accepted value |
| --- | ---: |
| Byte immediate or immediate port | 0 through 255 |
| IX/IY displacement | −128 through 127 |
| Relative branch displacement | −128 through 127 from the following instruction |
| Word immediate or absolute address | −32,768 through 65,535 |
| `DB` numeric item | Low eight bits are emitted |
| `DW` numeric item | −32,768 through 65,535 |

Negative word values retain their two's-complement encoding. Byte instruction
operands do not truncate: `LD A,100H` is an error, while `DB 100H` emits `$00`.
