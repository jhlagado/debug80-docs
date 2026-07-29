---
layout: default
title: "Expressions and Comparisons"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 3
---

# Expressions and Comparisons

A moving object has an x coordinate and a target has another. The program
needs their distance whether the target lies to the left or the right:

```text
DIM ObjectX AS BYTE = 20
DIM TargetX AS BYTE = 250
DIM Distance AS INTEGER

SUB MeasureDistance()
    Distance = ABS(TargetX - ObjectX)
END SUB
```

Both coordinates occupy one byte. Their subtraction widens to an `INTEGER`
before `ABS` removes the sign. The result is 230 rather than an eight-bit
wrapped value.

## Arithmetic operators

Lanternfly keeps the familiar formula symbols and uses words for the remaining
integer operations:

| Operation        | Form          |
| ---------------- | ------------- |
| addition         | `a + b`       |
| subtraction      | `a - b`       |
| multiplication   | `a * b`       |
| integer division | `a / b`       |
| remainder        | `a MOD b`     |
| integer power    | `a ^ b`       |
| shift left       | `a SHL count` |
| shift right      | `a SHR count` |

Division discards the fractional part. `17 / 5` produces 3, while `17 MOD 5`
produces 2. `SHL` and `SHR` move a fixed-width bit pattern and make that intent
visible in the source.

Parentheses control grouping:

```text
Average = (First + Second) / 2
```

Without the parentheses, division would run before addition.

## Comparisons produce numeric truth

```text
DIM HasArrived AS INTEGER

HasArrived = Distance <= 2
```

A comparison produces zero for false and a value with every bit set for true.
For an `INTEGER`, true is -1. Any nonzero integer also counts as true when used
as a condition.

The comparison operators are:

| Meaning               | Operator |
| --------------------- | -------- |
| equal                 | `=`      |
| unequal               | `<>`     |
| less than             | `<`      |
| less than or equal    | `<=`     |
| greater than          | `>`      |
| greater than or equal | `>=`     |

The `<>` spelling reads as “less than or greater than”, which gives a direct
visual cue for inequality.

## Words combine truth and bit patterns

`AND`, `OR`, `XOR` and `NOT` operate on every bit of an integer. They also
combine comparison results because true is represented by all set bits.

```text
IF Distance <= 2 AND Lives > 0 THEN
    Lives = BYTE(Lives - 1)
END IF
```

Both comparisons run, then `AND` combines their truth values.

The same word can test a flag:

```text
CONST VisibleFlag AS BYTE = %00000001
DIM Flags AS BYTE

IF Flags AND VisibleFlag THEN
    VisibleCount = VisibleCount + 1
END IF
```

`Flags AND VisibleFlag` keeps the selected bit. Zero means the flag is clear;
a nonzero result means it is set.

Lanternfly uses this single operator family for conditions and masks.
Expressions in the first language draft are pure, so both sides can be
evaluated safely: a function used in an expression reads values and returns a
value.

## Reading precedence

Calls, indexes and parentheses bind first. Arithmetic follows the order used
in ordinary formulas. Comparisons run after arithmetic, then `AND`, `XOR` and
`OR` combine the results.

Parentheses remain useful when a condition mixes several levels:

```text
IF (Flags AND VisibleFlag) <> 0 AND Distance <= 2 THEN
    VisibleCount = VisibleCount + 1
END IF
```

The first `AND` selects a bit. `<> 0` turns that test into the same 16-bit
truth type as the distance comparison and the second `AND` combines them.

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt) includes
the distance calculation, comparison and flag test.

## Summary

- Arithmetic symbols write familiar formulas.
- `MOD`, `SHL` and `SHR` give integer operations readable names.
- Byte addition and subtraction widen before the result is stored.
- Comparisons produce zero or an all-bits-set truth value.
- `AND`, `OR`, `XOR` and `NOT` work with both masks and numeric truth.
