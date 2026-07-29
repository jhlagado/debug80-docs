---
layout: default
title: "Names and Integer Types"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 2
---

# Names and Integer Types

Chapter 1 began with three lives, so one byte was enough for that stated
range. Other values need more room. A score that awards ten points per event
passes 255 after twenty-six awards. A frame counter ticking fifty times a
second passes 65,535 — the most two bytes can hold — in a little over twenty
minutes. Temperatures, velocities and differences between two positions may
also need to represent negative values, which an unsigned type cannot do.

Here is the fact this chapter turns on: every count in a program has a
size and a sign, whether or not the language makes you say so. A language
that hides the question has not answered it — somewhere below the surface,
a width was chosen for you, and you will meet the choice the day a counter
wraps. Lanternfly brings the question up into the source, where it can be
answered on purpose:

```lanternfly
var lives as u8 = 3
var temperature as i16 = -4
var score as u16 = 0
var frameCount as u32 = 0
```

The type column records storage decisions: one byte for lives, two bytes for
the signed temperature, two for the unsigned score and four for the frame
counter — which at fifty frames a second now takes nearly three years of
continuous play to wrap. The declaration is part of the program's memory
design, written where future readers can see it.

## Counting in binary

The ranges in the table below follow from binary place values. A bit is a digit
that can be 0 or 1, and bits gain meaning the same way decimal digits do:
by position. In decimal, the columns are worth 1, 10, 100, 1000 — each
ten times the last. In binary, the columns are worth 1, 2, 4, 8, 16, 32,
64, 128 — each double the last. The byte `%00000011` is 2 + 1, or three
lives. The byte `%11111111` is all eight columns at once:
128 + 64 + 32 + 16 + 8 + 4 + 2 + 1, which is 255. That is where the
byte's ceiling comes from: those eight columns add up to 255.

The pattern count continues doubling past the byte. A ninth bit creates 512
distinct patterns, while sixteen bits create 65,536 and thirty-two bits create
4,294,967,296. For unsigned values, the maximum is one less than the pattern
count.

## Six integer types

| Type | Width | Range |
| --- | ---: | ---: |
| `u8` | 8 bits | 0 to 255 |
| `i8` | 8 bits | -128 to 127 |
| `u16` | 16 bits | 0 to 65,535 |
| `i16` | 16 bits | -32,768 to 32,767 |
| `u32` | 32 bits | 0 to 4,294,967,295 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |

The first letter states signedness: `u` means unsigned and stores zero or a
positive value, `i` means signed and includes negatives. The number
states the exact bit width. Thus `i32` means a signed, thirty-two-bit
integer.

The signed rows use two's-complement interpretation: the top bit of a
signed value has a negative place value. In an `i8`, the
columns are worth -128, 64, 32, 16, 8, 4, 2, 1. All zeros is 0; a lone
top bit is -128; all ones is -128 + 127, which is -1. So the same eight bits that spell 255 in a `u8` spell -1 in an
`i8`. The pattern does not change — only the agreement about what the
top column is worth. The same interpretation explains the signedness
conversions later in the chapter.

## The price of a width

Width affects both space and time. A coordinate stored as `u8` occupies one
byte on every target: one byte on a Z80, one byte anywhere else this
source is ever compiled. An `i32` counter occupies four. On a machine
with 65,536 addressable bytes, a table of a hundred entries shows
that difference immediately: one hundred bytes against four hundred
for the same hundred counts.

Width also prices the arithmetic. The Z80 directly supports eight-bit
operations, while 32-bit work must be decomposed across several bytes with
explicit carries. Another target may support the same width directly, but
every backend must preserve the declared range and result.

So choosing a type requires two decisions. First, estimate the largest
legitimate value and whether it can be negative; include plausible boundary
cases rather than relying on the most convenient estimate. Then choose the
narrowest type that contains that range. Lives bounded from 0 through 255 fit
`u8`. A score bounded at 9,999 fits `u16`. A signed temperature whose required
range exceeds `i8` but remains within `i16` needs two bytes, while a
non-negative frame counter intended to run beyond 65,535 uses `u32`.

## Constants name fixed values

```lanternfly
const startingLives as u8 = 3
const maximumScore as u16 = 9999

var lives as u8 = startingLives
var score as u16 = 0
```

`const` names a compile-time value. A bare `3` does not say whether it
means starting lives, a movement rate or something else. `startingLives`
records that role, gives every use one declaration and lets a later change
replace the value in one place.

The declared type also puts a fence around the value:

```lanternfly
const maximumByte as u8 = 255
```

`255` is the largest value a `u8` can hold, so this compiles. `256`
needs a ninth bit and is rejected. The declared type therefore checks that
the named constant fits the range it is meant to describe.

## Boolean values

Some facts in a game are not quantities. The round is over or it is not; the
door is locked or it is not. `boolean` represents those facts without
interchanging them with integers:

```lanternfly
var gameOver as boolean = false

gameOver = lives = 0
```

`true` and `false` are the Boolean literals, and a comparison produces
a Boolean. The type occupies one byte, storing zero for `false` and one for
`true`. A byte is more room
than one fact strictly needs — Chapter 3 shows how eight facts can
share a byte when memory is tight — but it is what the machine can
address directly, and for ordinary state the clarity is worth the
seven spare bits.

In the second line, the first `=` begins an assignment and the second tests
equality inside the expression. The comparison produces the Boolean stored in
`gameOver`.

An integer does not become a condition by itself; the program writes the
comparison it means:

```lanternfly
if lives > 0 then
    loseLife()
end
```

`lives > 0` states the fact on which the branch depends. A condition must
have type `boolean`; Lanternfly does not convert an integer or assignment
into a condition.

## Assignment and equality share `=`

Many languages split these two jobs across `=` and `==`. Lanternfly uses
position to distinguish them. At the beginning of a statement, a writable path followed
by `=` is an assignment:

```lanternfly
score = score + 10
```

Inside an expression, `=` compares:

```lanternfly
if score = maximumScore then
    score = 0
end
```

The `if` condition needs a Boolean expression, so the first `=` tests
equality. The next line begins with writable storage and assigns zero.
The token's position determines which meaning applies.

## Conversions state a width choice

Sooner or later two widths meet. Lanternfly distinguishes three cases:
value-preserving widening is silent; an ordinary narrowing or same-width
signedness change is allowed with a warning; and an explicit conversion
performs the same bit conversion while recording that the boundary was
intentional.

The subtraction from Chapter 1 shows the round-trip case. Two `u8` values subtract
into `i16`, so the result has room for any difference from -255
through 255. Storing that result back into a byte narrows it:

```lanternfly
lives = lives - 1
```

Narrowing retains the low bits. Every typed value in this expression
is `u8`, and the result returns to a `u8` destination, so Lanternfly
treats the round trip as the declared arithmetic of the byte and does
not warn — Chapter 1 relied on this rule without naming it, and the
guard made sure the narrowing never had anything to lose.

An explicit conversion records a genuinely cross-type choice:

```lanternfly
var wideValue as i16 = 300
var byteValue as u8 = 0

byteValue = u8(wideValue)
```

The conversion keeps the low eight bits. Three hundred in binary is
`%100101100`; a byte keeps `%00101100`, which is 44. Omitting
`u8(...)` performs the same store but emits the default conversion warning.
The explicit form suppresses that warning by making the narrowing part of the
source.

Changing signedness at the same width also preserves the bit pattern and warns
by default.
The same eight bits that mean 255 as a `u8` mean -1 as an `i8`, because
the types interpret the top bit differently. An explicit conversion records
that reinterpretation.

Widening runs the other way and needs no ceremony:

```lanternfly
var wideScore as u32 = score
```

Value-preserving widening is automatic because nothing can be lost —
the new box is strictly bigger. Unsigned widening fills the new high
bits with zero. Signed widening copies the sign bit into them, which
under two's complement is precisely what keeps -4 meaning -4 in the
wider home: the negative top column moves left, and the copies fill
the columns it vacated. In both cases the wider representation preserves the
original value.

## Literal types follow their context

An integer literal begins as an exact value and takes its type from
where it lands. In `score + 10`, the literal ten adopts the type of
`score`. In an expression made only of literals, the default type is
`i16`.

This matters when an uncontextualised expression would exceed the `i16`
default:

```lanternfly
const highBit as u16 = 1 shl 15
```

Shifting 1 left fifteen places produces 32,768 — one more than the
largest `i16`, so under the default the value would have no room. The
declared `u16` supplies the context: both literal operands are
resolved as `u16` before the shift is folded, and the constant holds
the high bit of a sixteen-bit word, exactly as intended. When a
literal expression behaves surprisingly, the first question to ask is
what type the context supplied — the answer is usually one
declaration away.

## Example

The [chapter listing](/lanternfly-book/book1/code/02-names-and-types.txt)
brings constants, Boolean state and integer conversion together. Trace the
conversion by writing the wide value in binary, retaining the low eight bits
and adding their place values. The stored result should be 44.
