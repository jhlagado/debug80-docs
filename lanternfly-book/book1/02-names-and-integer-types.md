---
layout: default
title: "Values and Integer Types"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 2
---

# Values and Integer Types

Chapter 1 used `u16` for three non-negative values. That choice gave each
variable a range of 0 through 65,535, though the example never needed most of
it. Other facts need different ranges. A temperature may be negative, a small
counter may fit in one byte and an elapsed-time counter may need to run for
days.

Lanternfly records those choices in each declaration:

```lanternfly
var unitsInStock as u16 = 1200
var roomTemperature as i16 = -4
var elapsedSeconds as u32 = 0
var orderReady as boolean = false
```

The types tell the compiler how much storage to reserve and how to interpret
each bit pattern.

## Bits, bytes and ranges

A bit stores 0 or 1. In an eight-bit byte, the binary columns are worth 1, 2,
4, 8, 16, 32, 64 and 128. The pattern `%00001100` contains 8 + 4, so its
value is 12. The pattern `%11111111` contains every column and has the
unsigned value 255.

Eight bits provide 256 distinct patterns. An unsigned byte uses them for the
values 0 through 255. Sixteen bits provide 65,536 patterns, and 32 bits
provide 4,294,967,296.

## The integer family

| Type | Width | Range |
| --- | ---: | ---: |
| `u8` | 8 bits | 0 to 255 |
| `i8` | 8 bits | -128 to 127 |
| `u16` | 16 bits | 0 to 65,535 |
| `i16` | 16 bits | -32,768 to 32,767 |
| `u32` | 32 bits | 0 to 4,294,967,295 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |

The first letter gives the interpretation: `u` is unsigned and `i` is signed.
The number gives the exact width. Every target must preserve these ranges,
even when its processor handles one width more easily than another.

Signed values use two's-complement representation. In an `i8`, the top bit has
the value -128 and the remaining bits are worth 64 through 1. The all-ones
pattern means -1 as `i8` and 255 as `u8`. The bits are identical; the declared
type determines their meaning.

## Choosing a type

Type selection begins with the values that the program must represent. The
narrowest suitable type contains every valid value and its boundary cases,
including negatives when the range requires them.

A month number fits in `u8`. A signed temperature from -500 through 500 needs
`i16`. A non-negative byte counter that may exceed 255 needs `u16`.

Width affects cost. One hundred `u8` values occupy 100 bytes, while one hundred
`u32` values occupy 400. The Z80 performs eight-bit arithmetic directly and
builds many wider operations from several instructions or a helper routine.
The wider type is still correct when the range requires it; the point is to
choose it with the cost visible.

## Constants

A fixed value gains meaning when you name it:

```lanternfly
const warehouseCapacity as u16 = 5000
const dispatchBatch as u16 = 10

var unitsInStock as u16 = 1200
```

`const` declares a compile-time value. The compiler can substitute its value
where needed, so an ordinary scalar constant usually occupies no storage.

The declared type checks the boundary. `const maximumByte as u8 = 255` is
valid; a value of 256 requires another bit and produces a compile error.

## Boolean values

Some values are facts rather than quantities:

```lanternfly
var orderReady as boolean = false

orderReady = unitsInStock >= dispatchBatch
```

`boolean` has the two values `true` and `false`. It occupies one byte, using
zero for `false` and one for `true`. Integer values do not become conditions
automatically, so a test states the comparison it means:

```lanternfly
if unitsInStock > 0 then
    dispatchOne()
end
```

This separation catches accidental uses of counts and bit patterns where the
program needs a yes-or-no answer.

## Enumerations and ranges

Some values are one choice from a fixed set of named alternatives. An
enumeration declares that set as a type of its own:

```lanternfly
enum ReportMode as u8
    compact
    detailed
    diagnostic
end

var currentMode as ReportMode = compact
```

The representation type follows `as`; members take ordinals from zero in
declaration order, and their names are written without qualification. An
enumeration supports assignment, all six comparisons, `select`, counted
loops and array indexing, and deliberately nothing arithmetic: adding two
report modes has no meaning, and the type says so. Converting an integer
into an enumeration is checked — an invalid constant is a compile error,
and an invalid runtime value causes the range fault — so a `ReportMode`
variable holds a valid mode or the program stops at the moment it would
not.

A range constrains a host type to part of its domain:

```lanternfly
range ScreenColumn as u8 = 0 until 32
range VerboseMode as ReportMode = detailed to diagnostic
```

A range value widens silently to its host, while any value entering the
range — by assignment, argument, return or conversion — is checked against
its domain. The range form itself is grammar rather than a value —
`0 until 32` cannot be stored or passed — while a variable of a range type
holds an ordinary host value, checked at every boundary it crosses. Chapter 6 puts both to work as array index domains, where a
suitably typed index makes a bounds check unnecessary because the type
already proves it.

## Assignment and equality

Lanternfly uses `=` for two related operations. At the start of a statement,
it assigns:

```lanternfly
unitsInStock = unitsInStock - dispatchBatch
```

Inside an expression, it compares for equality:

```lanternfly
if unitsInStock = warehouseCapacity then
    orderReady = true
end
```

Grammar makes the distinction. The first form begins with a writable storage
path. The second appears where `if` requires a Boolean expression.

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

Arithmetic that begins and ends in the same declared type receives a
round-trip allowance:

```lanternfly
unitsInStock = unitsInStock - dispatchBatch
```

When every typed value in the calculation is `u16`, the wider or signed
intermediate prescribed by the operator rules may return to `u16` without a
warning. The program is still responsible for guarding values that would wrap.

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

## Example

The [chapter listing](/lanternfly-book/book1/code/02-names-and-types.txt)
combines constants, Boolean state, an enumeration with a range over it and
an explicit narrowing conversion. The calls made by `main` leave
`unitsInStock` at 1,190, `byteValue` at 44 and `currentMode` at `detailed`.

## Chapter summary

- An integer type fixes width, signedness, range and storage cost.
- `const` names a compile-time value and checks it against a declared type.
- `boolean` represents `true` or `false` and remains separate from integers.
- Enumerations name a fixed set of alternatives as a checked type, and
  ranges constrain a host type to part of its domain.
- Value-preserving widening is automatic; narrowing and signedness changes
  should be explicit when intentional.
- Literal values take their type from context, with `i16` as the default for
  an otherwise untyped literal expression.

In the next chapter we put these types to work: calculations, comparisons
and the rules that give every intermediate result a width.
