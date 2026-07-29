---
layout: default
title: "Expressions and Comparisons"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 3
---

# Expressions and Comparisons

Two byte-sized coordinates can be far apart. Subtracting them needs a signed
intermediate even though each coordinate is unsigned:

```lanternfly
var objectX as u8 = 20
var targetX as u8 = 250
var distance as u16 = 0

sub measureDistance()
    distance = abs(targetX - objectX)
end
```

`targetX - objectX` has type `i16`. `abs` removes the sign and returns `u16`,
so the result is 230.

## Arithmetic operators

Lanternfly uses familiar symbols for formulas and short words for the
remaining integer operations:

| Operation | Form |
| --- | --- |
| addition | `a + b` |
| subtraction | `a - b` |
| multiplication | `a * b` |
| integer division | `a / b` |
| remainder | `a mod b` |
| integer power | `a ^ b` |
| shift left | `a shl count` |
| shift right | `a shr count` |

Division truncates toward zero. `17 / 5` produces 3 and `17 mod 5` produces 2.
A zero divisor triggers an arithmetic fault at runtime or a compile error when
the zero is constant.

`shl` moves bits left and fills the low positions with zero. `shr` fills from
the sign bit for signed values and with zero for unsigned values. The result
keeps the left operand's type.

## Width belongs to every operation

Arithmetic on matching 16-bit or 32-bit values retains that type. For matching
8-bit values, `+`, `*`, `/`, `mod` and `^` produce the corresponding 16-bit
type. Subtraction from either byte type produces `i16`. Bitwise operations and
shifts retain the 8-bit operand type.

A narrower operand widens automatically when every one of its values fits the
type already present on the other side:

```lanternfly
var row as u8 = 3
var column as u8 = 4
var elementNumber as u16 = 0

elementNumber = row * 20 + column
```

`row * 20` produces `u16`, then `column` widens to `u16` for the addition. The
compiler never invents a third common type. Incompatible signedness still
requires an explicit choice:

```lanternfly
var signedValue as i16 = -4
var unsignedValue as u16 = 20
var total as i32 = 0

total = i32(signedValue) + i32(unsignedValue)
```

Order still controls the intermediate type. With byte inputs, `x + 1 - y`
uses `u16` after the addition and wraps there if the subtraction is negative.
Write `i16(x) + 1 - i16(y)` when the calculation needs a signed final range.

Each fixed-width operation wraps in its resolved result type. Constant folding
uses the same rule, so compile-time and runtime calculations agree.

## Comparisons produce Boolean values

```lanternfly
var hasArrived as boolean = false

hasArrived = distance <= 2
```

The comparison operators are:

| Meaning | Operator |
| --- | --- |
| equal | `=` |
| unequal | `<>` |
| less than | `<` |
| less than or equal | `<=` |
| greater than | `>` |
| greater than or equal | `>=` |

Comparison chaining is rejected. A bounded-range test joins two comparisons:

```lanternfly
if minimum <= value and value <= maximum then
    acceptValue()
end
```

## Boolean and bitwise words share spelling

With Boolean operands, `and`, `or`, `xor` and `not` combine truth values:

```lanternfly
if hasArrived and lives > 0 then
    lives = lives - 1
end
```

Boolean `and` and `or` short-circuit. In `left and right`, a false left side
skips the right side. In `left or right`, a true left side skips it.

With integer operands, the same words operate on every bit:

```lanternfly
const visibleMask as u8 = %00000001
var flags as u8 = visibleMask

if (flags and visibleMask) <> 0 then
    visibleCount = visibleCount + 1
end
```

The bitwise `and` produces an integer, so `<> 0` converts the mask test into a
Boolean condition.

## Grouping and precedence

Parentheses bind first. Power binds more tightly than unary minus, followed by
multiplication and division, addition and subtraction, shifts, comparisons,
`not`, `and`, `xor` and `or`.

Because comparisons bind before `not`, `not x = y` means `not (x = y)`. Write
`(not x) = y` when comparing the bitwise complement of `x`.

```lanternfly
average = (first + second) / 2
```

The parentheses add before dividing. They also make mixed mask and condition
expressions easier to scan:

```lanternfly
if (flags and visibleMask) <> 0 and distance <= 2 then
    visibleCount = visibleCount + 1
end
```

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt) includes
the distance calculation, Boolean state and a bit-mask test.

## Summary

- Every integer operation has a resolved width and signedness.
- Value-preserving widening targets a type already present in the expression.
- Byte subtraction produces `i16`.
- Comparisons produce `boolean`.
- Boolean `and` and `or` short-circuit.
- Integer `and`, `or`, `xor` and `not` operate on bits.
