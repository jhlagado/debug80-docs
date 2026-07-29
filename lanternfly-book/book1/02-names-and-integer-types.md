---
layout: default
title: "Names and Integer Types"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 2
---

# Names and Integer Types

A life counter fits in one byte. A score may need two bytes and a long-running
frame counter may need four. Lanternfly records both the width and signedness
in each integer type:

```lanternfly
var lives as u8 = 3
var temperature as i16 = -4
var score as u16 = 0
var frameCount as u32 = 0
```

## Six integer types

| Type | Width | Range |
| --- | ---: | ---: |
| `u8` | 8 bits | 0 to 255 |
| `i8` | 8 bits | -128 to 127 |
| `u16` | 16 bits | 0 to 65,535 |
| `i16` | 16 bits | -32,768 to 32,767 |
| `u32` | 32 bits | 0 to 4,294,967,295 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |

The first letter states signedness. `u` means unsigned and stores zero or a
positive value. `i` means signed and includes negative values. The number
states the exact bit width.

A coordinate stored as `u8` occupies one byte on every target. An `i32`
counter occupies four. The backend may need several Z80 instructions to
calculate with a four-byte value, but it must preserve the same range.

## Constants name fixed values

```lanternfly
const startingLives as u8 = 3
const maximumScore as u16 = 9999

var lives as u8 = startingLives
var score as u16 = 0
```

`const` names a compile-time value. The value cannot change while the program
runs. Constants can set array sizes, initialise storage and take part in
formulas.

The explicit type catches an out-of-range value at compile time:

```lanternfly
const maximumByte as u8 = 255
```

`256` would require a wider type.

## Boolean values

Conditions use the separate `boolean` type:

```lanternfly
var gameOver as boolean = false

gameOver = lives = 0
```

`true` and `false` are Boolean literals. A comparison also produces a Boolean.
Lanternfly stores `false` as zero and `true` as one in a single byte.

An integer does not become a condition by itself. Write the comparison that
expresses the test:

```lanternfly
if lives > 0 then
    ...
end
```

## Assignment and equality share `=`

At the beginning of a statement, a writable path followed by `=` is an
assignment:

```lanternfly
score = score + 10
```

Inside an expression, `=` compares:

```lanternfly
if score = maximumScore then
    score = 0
end
```

The `if` condition needs a Boolean expression, so the first `=` tests equality.
The next line begins with writable storage and assigns zero.

## Conversions state a width choice

Two `u8` values subtract into `i16` so the result can represent a difference
from -255 through 255. Storing that result in a byte narrows it:

```lanternfly
lives = lives - 1
```

Narrowing retains the low bits. All the typed values in this expression are
`u8`, and the result returns to a `u8` destination. Lanternfly treats that
round trip as the declared arithmetic of the byte and does not warn.

An explicit conversion records a genuinely cross-type choice:

```lanternfly
var wideValue as i16 = 300
var byteValue as u8 = 0

byteValue = u8(wideValue)
```

The conversion keeps the low eight bits, producing 44 in this example.
Omitting `u8(...)` would perform the same store but warn that a value from
another declared type may be lost.
Changing signedness likewise preserves the bit pattern and normally deserves
an explicit conversion.

Widening supplies the missing high bits:

```lanternfly
var wideScore as u32 = score
```

Value-preserving widening is automatic. Unsigned widening fills with zero, and
signed widening copies the sign.

## Literal types follow their context

An integer literal begins as an exact value. In `score + 10`, the literal ten
adopts the type of `score`. In an expression made only from literals, the
default type is `i16`.

An explicit destination supplies context:

```lanternfly
const highBit as u16 = 1 shl 15
```

Both literal operands are resolved using the expected `u16` type before the
shift is folded.

## Example

The [chapter listing](/lanternfly-book/book1/code/02-names-and-types.txt) brings
constants, Boolean state and integer conversion together.
