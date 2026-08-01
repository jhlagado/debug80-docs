---
layout: default
title: "Expressions, Conversions and Comparisons"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 3
---

# Expressions, Conversions and Comparisons

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

## Comparisons

Comparisons produce Boolean values:

```lanternfly
var changeIsLarge as boolean = false

sub classifyChange()
    changeIsLarge = changeMagnitude >= 100
end
```

| Meaning               | Operator |
| --------------------- | -------- |
| equal                 | `=`      |
| unequal               | `<>`     |
| less than             | `<`      |
| less than or equal    | `<=`     |
| greater than          | `>`      |
| greater than or equal | `>=`     |

Compatible integers support all six comparisons, and Booleans support
equality and inequality. As later chapters introduce enumerations and
strings, each brings its own comparison rules with it.

`=` therefore does two related jobs, and grammar keeps them apart. At the
start of a statement it assigns: the left side is a storage path receiving a
value. Inside an expression it compares for equality and produces a
`boolean`. `changeIsLarge = changeMagnitude >= 100` uses the first `=` to
store and the `>=` to compare.

Lanternfly rejects comparison chains. A range test joins two comparisons:

```lanternfly
inRange = minimum <= input and input <= maximum
```

## Boolean operators

`and`, `or`, `xor` and `not` combine Boolean values:

```lanternfly
var shouldRecord as boolean = false

sub assessChange()
    shouldRecord = deviceReady and changeMagnitude >= 100
end
```

Boolean `and` and `or` short-circuit. A false left side of `and` skips the
right side, while a true left side of `or` skips it. This allows an earlier
test to protect a later operation:

```lanternfly
highAverage = itemCount > 0 and total / itemCount > threshold
```

The division runs only after `itemCount > 0` succeeds, so a zero item count
can never divide.

## Bit masks

One byte can carry eight independent yes-or-no facts — a device ready
here, an error there — and that practical economy is what bit masks are
for. The same word operators act on individual bits when their operands
are integers:

```lanternfly
const readyMask as u8 = %00000001
const errorMask as u8 = %00000010

var statusFlags as u8 = readyMask

sub adjustFlags()
    statusFlags = statusFlags or errorMask
    statusFlags = statusFlags and not readyMask
    statusFlags = statusFlags xor errorMask
end
```

`or` sets selected bits, `and not` clears them and `xor` toggles them. A mask
test converts the selected bits into an ordinary Boolean:

```lanternfly
errorSeen = (statusFlags and errorMask) <> 0
```

## Grouping and precedence

Parentheses bind first and make an intended calculation visible:

```lanternfly
average = (first + second) / 2
```

Without the parentheses, division would occur before addition. The
precedence order runs from arithmetic through shifts and comparisons to
the Boolean operators, with `or` last; the complete ladder is in the
language reference, and parentheses make any line independent of it.

That ordering lets a Boolean expression read naturally:

```lanternfly
minimum <= input and input <= maximum
```

The comparisons run before the Boolean `and`. Parentheses are still valuable
when a line mixes bitwise and Boolean work:

```lanternfly
alarm = (statusFlags and errorMask) <> 0 and deviceReady
```

The first `and` combines bits; the second combines Boolean results.

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt)
measures the change between two readings, tests a device-status mask, and
records an explicit narrowing. The first expression traces from `u8` inputs
to an `i16` result of -230 and a `u16` magnitude of 230; `sqrt(1600)`
produces 40; `u8(300)` produces 44.

## Chapter summary

- Every operation has a target-independent result type and fixed-width wrap
  behaviour.
- Byte subtraction produces `i16`; other byte arithmetic often produces the
  corresponding 16-bit type.
- Value-preserving widening is automatic; narrowing and signedness changes
  are written as explicit conversions.
- Literal values take their type from context, with `i16` as the default for
  an otherwise untyped literal expression.
- Comparisons produce `boolean` values, and Boolean `and` and `or`
  short-circuit.
- Integer word operators combine bits, and a mask test ends in an ordinary
  comparison.

Our expressions now produce Boolean answers and store them. In the next
chapter we give important values names of their own — and use those Boolean
answers to choose between paths.
