---
layout: default
title: "Calculations and Comparisons"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 3
---

# Calculations and Comparisons

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

## Result widths

Matching 16-bit or 32-bit operands generally keep their type. Byte arithmetic
uses wider results where one extra byte can preserve the useful mathematical
range:

| Operator on matching bytes | Result |
| --- | --- |
| `+`, `*`, `/`, `mod`, `^` | corresponding 16-bit type |
| `-` | `i16` |
| `and`, `or`, `xor`, `shl`, `shr` | operand type |
| comparison | `boolean` |

The `u8 - u8` rule explains the measurement example: `i16` can represent
every difference from -255 through 255.

When operands have different widths, the narrower value may widen to a type
already present when every source value fits:

```lanternfly
var page as u8 = 3
var offset as u8 = 4
var absoluteIndex as u16 = 0

absoluteIndex = page * 64 + offset
```

`page * 64` produces `u16`. The `u8` offset then widens to `u16`, and the
addition produces 196 as `u16`.

Some pairs have no safe direction. `i16` cannot contain every `u16` value, and
`u16` cannot contain negative `i16` values:

```lanternfly
var signedValue as i16 = -4
var unsignedValue as u16 = 20
var combined as i32 = 0

combined = i32(signedValue) + i32(unsignedValue)
```

The written conversions select `i32`, which contains the full range of both
inputs.

Operation order can change the intermediate type. With byte inputs,
`x + 1 - y` forms a `u16` sum before the subtraction. The form
`i16(x) + 1 - i16(y)` selects a signed type from the start when the calculation
needs a negative final range.

## Comparisons

Comparisons produce Boolean values:

```lanternfly
var changeIsLarge as boolean = false

changeIsLarge = changeMagnitude >= 100
```

| Meaning | Operator |
| --- | --- |
| equal | `=` |
| unequal | `<>` |
| less than | `<` |
| less than or equal | `<=` |
| greater than | `>` |
| greater than or equal | `>=` |

Compatible integers and enumeration values support all six comparisons,
and so do strings, which compare their text content byte by byte whatever
their declared capacities. Booleans and
same-class opaque addresses support equality and inequality. Lanternfly has
no aggregate equality operator in the working language, so a program
compares array elements or record fields explicitly.

Lanternfly rejects comparison chains. A range test joins two comparisons:

```lanternfly
if minimum <= input and input <= maximum then
    acceptValue()
end
```

## Boolean operators

`and`, `or`, `xor` and `not` combine Boolean values:

```lanternfly
if deviceReady and changeMagnitude >= 100 then
    recordChange()
end
```

Boolean `and` and `or` short-circuit. A false left side of `and` skips the
right side, while a true left side of `or` skips it. This allows an earlier
test to protect a later operation:

```lanternfly
if itemCount > 0 and total / itemCount > threshold then
    reportHighAverage()
end
```

The division runs only after `itemCount > 0` succeeds.

## Bit masks

The same word operators act on individual bits when their operands are
integers:

```lanternfly
const readyMask as u8 = %00000001
const errorMask as u8 = %00000010

var statusFlags as u8 = readyMask

statusFlags = statusFlags or errorMask
statusFlags = statusFlags and not readyMask
statusFlags = statusFlags xor errorMask
```

`or` sets selected bits, `and not` clears them and `xor` toggles them. A mask
test converts the selected bits into the Boolean required by `if`:

```lanternfly
if (statusFlags and errorMask) <> 0 then
    errorCount = errorCount + 1
end
```

## Grouping and precedence

Parentheses bind first and make an intended calculation visible:

```lanternfly
average = (first + second) / 2
```

Without the parentheses, division would occur before addition. After calls,
indexing, field access and parentheses, Lanternfly evaluates power, unary
arithmetic, multiplication and division, addition and subtraction, shifts,
comparisons, `not`, `and`, `xor` and finally `or`.

That ordering lets a Boolean expression read naturally:

```lanternfly
minimum <= input and input <= maximum
```

The comparisons run before the Boolean `and`. Parentheses are still valuable
when a line mixes bitwise and Boolean work:

```lanternfly
if (statusFlags and errorMask) <> 0 and deviceReady then
    errorCount = errorCount + 1
end
```

The first `and` combines bits; the second combines Boolean results.

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt)
calculates the change between two readings and tests a device-status mask.
The first expression traces from `u8` inputs to an `i16` result of -230 and a
`u16` magnitude of 230.

## Chapter summary

- Every operation has a target-independent result type and fixed-width wrap
  behaviour.
- Byte subtraction produces `i16`; other byte arithmetic often produces the
  corresponding 16-bit type.
- Comparisons produce `boolean` values.
- Boolean `and` and `or` short-circuit, while integer word operators combine
  bits.
- Parentheses record the intended order and clarify expressions that mix
  arithmetic, comparison and bitwise work.

Comparisons give us Boolean answers; in the next chapter those answers
choose between paths.
