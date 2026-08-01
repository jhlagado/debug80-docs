---
layout: default
title: "Scalar Values and Literals"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 2
---

# Scalar Values and Literals

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

The types fix the storage the compiler reserves and the meaning of each bit
pattern.

## Bits, bytes and ranges

A bit stores 0 or 1. In an eight-bit byte, the binary columns are worth 1, 2,
4, 8, 16, 32, 64 and 128. The pattern `%00001100` contains 8 + 4, so its
value is 12. The pattern `%11111111` contains every column and has the
unsigned value 255.

Eight bits provide 256 distinct patterns. An unsigned byte uses them for the
values 0 through 255. Sixteen bits provide 65,536 patterns, and 32 bits
provide 4,294,967,296.

## The integer family

| Type  |   Width |                           Range |
| ----- | ------: | ------------------------------: |
| `u8`  |  8 bits |                        0 to 255 |
| `i8`  |  8 bits |                     -128 to 127 |
| `u16` | 16 bits |                     0 to 65,535 |
| `i16` | 16 bits |               -32,768 to 32,767 |
| `u32` | 32 bits |              0 to 4,294,967,295 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |

The first letter gives the interpretation: `u` is unsigned and `i` is signed.
The number gives the exact width. Every target must preserve these ranges,
even when its processor handles one width more easily than another.

The two 32-bit rows carry one extra obligation. `u32` and `i32` are part of
the language but not of its always-on kernel: a module that uses them
states `import "standard/wide32.lafy"` at its top; chapter 11 explains
capability imports. The eight- and sixteen-bit types need no import; they
are the kernel integer types. The `elapsedSeconds` declaration
above therefore lives in a module that begins with that import.

Signed values use two's-complement representation. In an `i8`, the top bit has
the value -128 and the remaining bits are worth 64 through 1. The all-ones
pattern means -1 as `i8` and 255 as `u8`. The bits are identical; the declared
type determines their meaning.

An integer literal is an exact value, written in decimal (`1200`), in
hexadecimal with `$` (`$7e`) or in binary with `%` (`%00001100`). The
declaration supplies its type, and a literal that cannot fit the declared
type is a compile error. Chapter 3 completes the picture for literals inside
calculations.

## Choosing a type

Type selection begins with the values we must represent. The narrowest
suitable type contains every valid value and its boundary cases, including
negatives when the range requires them.

A month number fits in `u8`. A signed temperature from -500 through 500 needs
`i16`. A non-negative byte counter that may exceed 255 needs `u16`.

Width affects cost. One hundred `u8` values occupy 100 bytes, while one hundred
`u32` values occupy 400. The Z80 performs eight-bit arithmetic directly and
builds many wider operations from several instructions or a helper routine.
The wider type is still correct when the range requires it; the point is to
choose it with the cost visible.

## Names

Multi-word names need a spelling convention, and this book uses the two
common ones. In _camelCase_, the name begins with a lowercase word and each
later word begins with a capital: `playerScore`, `maximumSpeed`,
`unitsInStock`. In _PascalCase_, the first word is capitalized as well:
`PlayerState`, `ScreenBuffer`.

Lanternfly's convention, used throughout this book: type names take
PascalCase, while variables, constants and routines take camelCase. Name
resolution is case-insensitive, so two declarations whose names differ only
in case would collide; the conventions keep every kind of name visually
distinct instead.

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

sub restock()
    unitsInStock = warehouseCapacity
    orderReady = true
end
```

`boolean` has the two values `true` and `false`. It occupies one byte, using
zero for `false` and one for `true`. Integer values do not become Booleans
automatically — a count and a yes-or-no answer stay distinct types. In the
next chapter, comparisons produce Boolean values from integer ones; in
Chapter 4, those values choose between paths.

## Character values

Text begins with single bytes. A character literal names an exact byte value
by its printable character or escape:

```lanternfly
const prompt as u8 = '>'
const lineFeed as u8 = '\n'
const escape as u8 = '\x1b'
```

`'>'` is the ASCII value 62 exactly as `62` is — the quoted spelling records
that the byte's role is a character. The escapes cover the unprintable cases:
`\n`, `\r` and `\t` for line and tab control, `\xHH` for an exact hexadecimal
byte, and `\'`, `\"` and `\\` for the quoting characters themselves. A
character literal is one byte; multi-character and non-ASCII literals are
invalid. The name `lineFeed` is deliberate: `'\n'` is exactly the byte 10,
while ending a line on a device is a separate service for which a target
may emit a different byte sequence entirely — Chapter 12 draws that line.
Chapter 7 builds text on this foundation: sequences of these bytes with
a recorded length.

## Example

The [chapter listing](/lanternfly-book/book1/code/02-scalar-values.txt)
declares integer, Boolean and character values with deliberate types.
`restock` raises `unitsInStock` to 5,000 and records that the order is
ready; `selectPrompt` copies the `'>'` byte into a variable.

## Chapter summary

- An integer type fixes width, signedness, range and storage cost.
- Integer literals are exact values in decimal, `$` hexadecimal or `%`
  binary, checked against the declared type.
- `const` names a compile-time value and checks it against a declared type.
- `boolean` represents `true` or `false` and remains separate from integers.
- A character literal is an exact byte value with a readable spelling.
- Type names take PascalCase; value, constant and routine names take
  camelCase.

Our values now have deliberate types. In the next chapter we calculate with
them, and meet the rules that give every intermediate result a width.
