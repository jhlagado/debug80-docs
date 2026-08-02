---
layout: default
title: "Expressions and Conversions"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 3
---

# Expressions and Conversions

A measurement system stores two byte-sized readings. Finding the size of the
change requires more than subtracting one byte from another: the intermediate
may be negative even though both inputs are unsigned.

```lanternfly
var previousReading as u8 = 250
var currentReading as u8 = 20
var changeMagnitude as u16 = 0

sub measureChange()
    changeMagnitude = abs(currentReading - previousReading)
end
```

`currentReading - previousReading` produces the signed value -230 as `i16`.
`abs` returns its magnitude as `u16`, so `changeMagnitude` receives 230. The
same calculation also returns 230 when the readings are reversed.

Lanternfly assigns a fixed type to every intermediate result. A backend must
preserve those types and their wrap rules while translating the expression
into target operations.

## Arithmetic operators

| Operation        | Form          |
| ---------------- | ------------- |
| addition         | `a + b`       |
| subtraction      | `a - b`       |
| multiplication   | `a * b`       |
| integer division | `a / b`       |
| remainder        | `a mod b`     |
| integer power    | `a ^ b`       |
| shift left       | `a shl count` |
| shift right      | `a shr count` |

Integer division discards the fractional part by truncating toward zero.
`17 / 5` is 3, while `17 mod 5` is 2. The results fit the identity
`3 * 5 + 2 = 17`.

Division and remainder are useful whenever one number contains a group and a
position within that group. An elapsed count of seconds becomes minutes with
`seconds / 60` and remaining seconds with `seconds mod 60`. A linear table
index becomes a row with `index / columns` and a column with
`index mod columns`.

A zero divisor produces a compile error when it is constant and an arithmetic
fault when discovered at runtime.

Shifts move a bit pattern. `5 shl 3` produces 40. Unsigned `shr` fills high
bits with zero; signed `shr` repeats the sign bit. A shift keeps the type of
its left operand.

Two standard operations round out the numeric set. `abs`, from the opening
example, returns an unsigned magnitude at its operand's width. `sqrt`
returns the floor of a non-negative integer square root (`sqrt(1600)` is
40), and a negative runtime operand invokes the arithmetic-fault service.

## Result widths

Matching 16-bit or 32-bit operands generally keep their type. Byte arithmetic
uses wider results where one extra byte can preserve the useful mathematical
range:

| Operator on matching bytes       | Result                    |
| -------------------------------- | ------------------------- |
| `+`, `*`, `/`, `mod`, `^`        | corresponding 16-bit type |
| `-`                              | `i16`                     |
| `and`, `or`, `xor`, `shl`, `shr` | operand type              |
| comparison                       | `boolean`                 |

The `u8 - u8` rule explains the measurement example: `i16` can represent
every difference from -255 through 255.

When operands have different widths, the narrower value may widen to a type
already present when every source value fits:

```lanternfly
var page as u8 = 3
var offset as u8 = 4
var absoluteIndex as u16 = 0

sub locate()
    absoluteIndex = page * 64 + offset
end
```

`page * 64` produces `u16`. The `u8` offset then widens to `u16`, and the
addition produces 196 as `u16`.

Operation order can change the intermediate type. With byte inputs,
`x + 1 - y` forms a `u16` sum before the subtraction. The form
`i16(x) + 1 - i16(y)` selects a signed type from the start when we need a
negative final range.

## Converting between integer types

Widening preserves a value, so Lanternfly performs it silently:

```lanternfly
var byteCount as u8 = 200
var totalCount as u16 = byteCount
```

Every `u8` value fits in `u16`. Unsigned widening fills the new high bits with
zero; signed widening repeats the sign bit so a negative value keeps the same
meaning.

Narrowing may discard high bits:

```lanternfly
var wideValue as i16 = 300
var byteValue as u8 = u8(wideValue)
```

The conversion keeps the low eight bits. Three hundred is
`%100101100`; the low byte is `%00101100`, which is 44. Writing `u8(...)`
records the narrowing choice and suppresses the default conversion warning.

A same-width signedness conversion preserves the bit pattern and changes its
interpretation. Converting `u8(255)` to `i8` produces -1. An explicit
conversion records that the representation change is part of the program.

Some pairs have no safe direction. `i16` cannot contain every `u16` value, and
`u16` cannot contain negative `i16` values, so combining them means choosing
a type that holds both:

```lanternfly
var signedValue as i16 = -4
var unsignedValue as u16 = 20
var combined as i32 = 0

sub combine()
    combined = i32(signedValue) + i32(unsignedValue)
end
```

The written conversions select `i32`, which contains the full range of both
inputs. Because the excerpt mentions `i32`, its module states
`import "standard/wide32.lafy"` at the top, as chapter 2 described.

Arithmetic that begins and ends in the same declared type receives a
round-trip allowance:

```lanternfly
unitsInStock = unitsInStock - dispatchBatch
```

When every typed value in the calculation is `u16`, the wider or signed
intermediate prescribed by the operator rules may return to `u16` without a
warning. Guarding values that would wrap remains our job.

## Literal context

An integer literal begins as an exact value. Its surrounding declaration,
assignment, argument or return can supply its type:

```lanternfly
const highBit as u16 = 1 shl 15
```

The declared `u16` context applies to the literal calculation, producing
32,768. An all-literal expression with no expected type defaults to `i16`.
A literal formula that exceeds that range needs a declaration or explicit
conversion that states the intended type.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt)
measures the change between two readings, records an explicit narrowing and
takes a square root. The first expression traces from `u8` inputs to an
`i16` result of -230 and a `u16` magnitude of 230; `u8(300)` produces 44;
`sqrt(1600)` produces 40.

## Exercises

1. With `u8` values `a = 7` and `b = 9`, state the type and value of
   `a - b`, and of `a * b`.
2. What value does `u8(516)` produce, and why?
3. `seconds` is a `u16` holding 3725. Write expressions for the whole
   minutes and the remaining seconds, and state each result.

Answers: `a - b` is `i16` -2 and `a * b` is `u16` 63; `u8(516)` keeps the
low eight bits of `%1000000100`, which is 4; `seconds / 60` is 62 and
`seconds mod 60` is 5, both `u16`.

## Chapter summary

- Every operation has a target-independent result type and fixed-width wrap
  behaviour.
- Byte subtraction produces `i16`; other byte arithmetic often produces the
  corresponding 16-bit type.
- Value-preserving widening is automatic; narrowing and signedness changes
  are written as explicit conversions.
- Literal values take their type from context, with `i16` as the default for
  an otherwise untyped literal expression.

Calculations now have exact types at every step. The next chapter turns
their results into answers: comparisons, Boolean operators and the bit
masks that pack eight facts into one byte.
