---
layout: default
title: "Names and Integer Types"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 2
---

# Names and Integer Types

The first routine stored `Lives` in an `INTEGER`. Small computers often need a
more exact choice. A coordinate may occupy one byte, a score may need the full
unsigned range of two bytes and a long-running counter may need four bytes.
Lanternfly names all six integer choices.

```text
DIM Lives AS BYTE = 3
DIM Temperature AS INTEGER = -4
DIM Score AS WORD = 0
DIM FrameCount AS DWORD = 0
```

Each declaration records the width and whether the stored value is signed.

## Six integer types

| Type      |   Width |                           Range |
| --------- | ------: | ------------------------------: |
| `BYTE`    |  8 bits |                        0 to 255 |
| `SBYTE`   |  8 bits |                     -128 to 127 |
| `INTEGER` | 16 bits |               -32,768 to 32,767 |
| `WORD`    | 16 bits |                     0 to 65,535 |
| `LONG`    | 32 bits | -2,147,483,648 to 2,147,483,647 |
| `DWORD`   | 32 bits |              0 to 4,294,967,295 |

`INTEGER` is the ordinary type for calculations and loop counters. `BYTE` and
`WORD` suit compact non-negative storage. `SBYTE` and `LONG` retain negative
values at their respective widths. `DWORD` supplies the full unsigned 32-bit
range.

The source type states a program fact. A `BYTE` coordinate tells you that the
stored position lies between 0 and 255. A `SBYTE` offset tells you that moving
left or above an origin is meaningful.

## Constants name fixed values

```text
CONST StartingLives AS BYTE = 3
CONST MaximumScore AS WORD = 9999

DIM Lives AS BYTE = StartingLives
DIM Score AS WORD = 0
```

`CONST` gives a name to a value that stays fixed. The declared type checks the
value at compile time. `StartingLives` can then initialise storage or take part
in a calculation.

Names describe intent better than repeated numbers. If the starting life
count changes, one declaration changes with it.

## Assignment and equality share one sign

```text
Score = Score + 10
```

At the start of a statement, `=` stores the expression on its right into the
named location on its left. Read it as “Score becomes Score plus ten.”

Inside a condition, `=` compares two values:

```text
IF Score = MaximumScore THEN
    Score = 0
END IF
```

The position supplies the meaning. The `IF` line needs a condition, so `=` is
equality. The line inside the block is an assignment because a writable name
appears on the left of the statement.

This follows the reading convention used by BASIC-family languages and much
written pseudocode. The compiler parses the complete statement, so it can
diagnose an expression used where an assignment belongs.

## Calculations widen before storage

Compact storage should not force every calculation to wrap after eight bits.
When two byte values are added or subtracted, Lanternfly calculates with at
least 16 bits. The result narrows only when it is stored back into a byte.

```text
DIM Lives AS BYTE = 3

SUB LoseLife()
    IF Lives > 0 THEN
        Lives = BYTE(Lives - 1)
    END IF
END SUB
```

`Lives - 1` produces a signed 16-bit result. `BYTE(...)` explicitly keeps the
low eight bits for storage. The preceding condition proves that the value is
between 0 and 2, so the conversion preserves its mathematical value.

Explicit conversion documents intentional narrowing. A compiler may also
prove that an implicit store fits, but the source remains clearest when a
boundary is central to the rule.

## Example

The [chapter listing](/lanternfly-book/book1/code/02-names-and-types.txt) brings
the declarations, constants and bounded subtraction together.

## Summary

- Lanternfly supplies signed and unsigned integers at 8, 16 and 32 bits.
- `INTEGER` is the ordinary signed calculation type.
- `CONST` names a fixed compile-time value.
- `=` stores in an assignment and compares inside a condition.
- A type name used as a function performs an explicit integer conversion.
