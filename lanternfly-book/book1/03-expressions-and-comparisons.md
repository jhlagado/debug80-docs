---
layout: default
title: "Expressions and Comparisons"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 3
---

# Expressions and Comparisons

Chapters 1 and 2 declared storage and moved single values into it. A
program that only moved values would be a filing system; what makes it a
program is that it *computes* — combines the values it has into values it
needs throughout a run. The notation for combining is
the expression, and this chapter is the grammar of expressions: the
operators, the types their results take, and the comparisons that turn
quantities into decisions.

A real computation makes it concrete: two objects sit on the same screen
line, and the game asks how far apart they are. Each coordinate fits comfortably in a
byte, but the question "how far apart" hides a subtraction, and a
subtraction can come out negative — the target may be to the left of the
object just as easily as to the right. The calculation needs room for a
sign even though neither input has one:

```lanternfly
var objectX as u8 = 20
var targetX as u8 = 250
var distance as u16 = 0

sub measureDistance()
    distance = abs(targetX - objectX)
end
```

`targetX - objectX` has type `i16`, wide enough for any difference
between two bytes. `abs` removes the sign and returns `u16`, so
`distance` receives 230. Swap the two coordinates and the subtraction
produces -230 instead, and `abs` still delivers 230.

Every Lanternfly intermediate has a target-independent type before lowering.
The Z80, C and any later backend must reproduce the same result width and
wrap behaviour. This chapter therefore traces a formula in two ways: the
values it calculates and the types carried by its intermediate results.

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

Addition, subtraction and multiplication use their familiar meanings.
Division needs a careful look because integer division is not the
division you grew up with. There are no fractions here — the types
cannot hold them — so division truncates toward zero and `mod` supplies
what division discards: `17 / 5` produces 3, and `17 mod 5` produces
the 2 left over. Together the two answers reconstruct the question,
since 3 × 5 + 2 is 17 again.

The pair recurs in game arithmetic whenever a program asks "which group is
this in, and where inside the group?" A screen built from
eight-pixel tiles turns a pixel position into a tile with `x / 8` and
into an offset within that tile with `x mod 8`. A one-dimensional
element number turns back into a row with `n / columns` and a column
with `n mod columns`. Seconds become minutes and seconds with `/ 60`
and `mod 60`. Chapter 6 uses the same pair to move between a linear element
number and row-and-column indices.

A zero divisor triggers an arithmetic fault at runtime, or a compile
error when the zero is constant. The compiler catches the mistake it
can see; the target catches the one it cannot. Neither lets the
program sail on with an answer that means nothing.

The shifts move whole bit patterns sideways. `shl` moves bits left and fills
the low positions with zero; `5 shl 1` is 10 and `5 shl 3` is 40.
`shr` moves bits right, filling from the sign bit for a signed value and
with zero for an unsigned value. This agrees with unsigned division by two,
but not always with signed division, which truncates toward zero:
`i8(-3) shr 1` is -2 while `i8(-3) / 2` is -1. Use division when that
rounding rule matters. A shift result keeps the left operand's type. A
negative shift count faults. A count at least as large as the left operand's
width produces zero for `shl` and unsigned `shr`, and produces all sign bits
for signed `shr`.

Power requires a non-negative exponent. `x ^ 0` is one in the result type,
including when `x` is zero; a negative exponent faults.

Unary minus produces `i16` from either byte type and retains `i16` or `i32`.
It is invalid for `u16` or `u32` until an explicit conversion selects a signed
type.

## Width belongs to every operation

Arithmetic on matching 16-bit or 32-bit values retains that type. For
matching 8-bit values, `+`, `*`, `/`, `mod` and `^` produce the
corresponding 16-bit type. Subtraction from either byte type produces
`i16`. Bitwise operations and shifts retain the left or matching operand
type.

These are fixed result rules, not arbitrary-precision arithmetic. A 16-bit
product can hold the complete product of two bytes, and `i16` can hold the
complete difference between them. Other operations use the stated
width; power in particular can overflow it. Every result wraps in its selected
fixed-width type.

When the two sides of an operation differ, the narrower operand
widens automatically, provided every one of its values fits the type
already present on the other side:

```lanternfly
var row as u8 = 3
var column as u8 = 4
var elementNumber as u16 = 0

elementNumber = row * 20 + column
```

The types trace alongside the values. `row` is `u8`; `row * 20` is a byte
multiplication, so it produces `u16` — value 60. `column` is `u8`,
narrower than the `u16` on the other side of the `+`, and every `u8`
value fits in a `u16`, so it widens; the addition is `u16` work and
yields 64. The destination is `u16`, so the store is exact. No conversion
is needed because the widening preserves every possible `u8` value.

Lanternfly widens an operand only to a compatible type already present in the
expression. It never invents a third common type; incompatible operands
require explicit conversion:

```lanternfly
var signedValue as i16 = -4
var unsignedValue as u16 = 20
var total as i32 = 0

total = i32(signedValue) + i32(unsignedValue)
```

Neither existing operand type can hold every value of the other: `i16` cannot
hold 65,535, and `u16` cannot hold -4. Lanternfly does not invent an absent
third type, so the expression requires explicit conversions. The written
`i32` conversions select a type that can hold every value of both operands.

Order still controls the intermediate type, and it can matter. With
byte inputs, `x + 1 - y` performs the addition first, producing
`u16`, and the subtraction then wraps in `u16` if its result is
negative: with `x` at 0 and `y` at 2, the expression yields 65,535
rather than -1. Write `i16(x) + 1 - i16(y)` when the calculation
needs a signed final range. The lesson generalises beyond this one
shape: a formula's meaning includes the order its intermediates are
formed in, and rearranging a working formula is not always the
harmless tidying it appears to be.

Each fixed-width operation wraps in its resolved result type. Constant
folding uses the same rule, so compile-time and runtime evaluation agree.

## Comparisons produce Boolean values

Arithmetic produces integer values. Comparisons produce the Boolean values
that control decisions:

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

Compatible integers support all six operators. Booleans and compatible typed
references support only `=` and `<>`; arrays and records have no equality
operator in the working language. Every permitted comparison produces a
Boolean, which can be stored, as above, or consumed directly by an `if` or a
loop condition. Storing the result as `hasArrived` names the test and lets
later statements reuse it without repeating the formula.

Comparison chaining is rejected: the Python habit of writing
`minimum <= input <= maximum` in one breath does not carry over. A
bounded-range test joins two comparisons explicitly:

```lanternfly
if minimum <= input and input <= maximum then
    acceptValue()
end
```

The source semantics require two comparisons joined by Boolean `and`; a
backend may choose any equivalent instruction sequence.

## Boolean and bitwise words share spelling

With Boolean operands, `and`, `or`, `xor` and `not` combine truth
values, which is how simple comparisons compose into real game rules:

```lanternfly
if hasArrived and lives > 0 then
    lives = lives - 1
end
```

Boolean `and` and `or` short-circuit. In `left and right`, a false
left side skips the right side entirely; in `left or right`, a true
left side skips it. Short-circuiting saves work, but its deeper use
is protection: the left test can stand guard over the right one. A
condition like `itemCount > 0 and total / itemCount > threshold` never
divides by zero, because the division is reached only after the guard succeeds.

With integer operands, the same four words operate on every bit at once. The
`%` prefix writes a binary literal, which makes individual flag masks visible:

```lanternfly
const visibleMask as u8 = %00000001
const activeMask as u8 = %00000010
var flags as u8 = visibleMask

flags = flags or activeMask
flags = flags and not visibleMask
flags = flags xor activeMask

if (flags and visibleMask) <> 0 then
    visibleCount = visibleCount + 1
end
```

`or` sets the selected bit, `and not` clears it and `xor` toggles it. To
read a flag, `and` keeps the selected bit and `<> 0` converts that integer
result into the Boolean required by the condition.

## Expressions used as statements

A routine call can stand alone when its effects matter:

```lanternfly
updateClock()
```

Lanternfly also permits a value-producing expression as a statement, so a
result-bearing call may be invoked for its effects and its result discarded.
A pure expression such as `playerScore + 10` is legal but warns by default
because it calculates a value and does nothing with it.

## Grouping and precedence

An expression with several operators needs an order, and parentheses
bind first — when in doubt, or when a reader might doubt, group. Calls,
indexing and field access bind before the operators in this chapter. After
those postfix forms, power binds more tightly than unary minus,
followed by multiplication, division and `mod`, addition and subtraction,
shifts, comparisons, `not`, `and`, `xor` and `or`.

Power associates from right to left, so `2 ^ 3 ^ 2` means
`2 ^ (3 ^ 2)`. The remaining chainable binary operators associate from left
to right; for example, `10 - 3 - 2` means `(10 - 3) - 2`. Comparisons do not
chain.

The top of that ranking follows school algebra: multiplication precedes
addition, as in `row * 20 + column`. The lower levels are arranged so that
the common whole-line shapes read without brackets: arithmetic
resolves first, then comparisons turn the quantities into Booleans,
then the Boolean words combine the answers. `minimum <= input and
input <= maximum` needed no parentheses because the ranking already
reads it as `(minimum <= input) and (input <= maximum)`.

Because comparisons bind before `not`, `not x = y` means `not (x = y)`.
To compare the bitwise complement of `x`, write `(not x) = y`.

```lanternfly
var first as u8 = 10
var second as u8 = 20
var average as u16 = 0

average = (first + second) / 2
```

The parentheses add before dividing — without them, precedence would
divide `second` by 2 first and the "average" would be nothing of the
kind. Because both inputs are `u8`, their sum is a `u16` and can hold every
possible byte sum before the division. Parentheses also define the boundary
between bitwise and Boolean work:

```lanternfly
if (flags and visibleMask) <> 0 and distance <= 2 then
    visibleCount = visibleCount + 1
end
```

The first `and` works on bits and the second on Booleans. The parentheses are
required: without them, comparison would bind first and produce the invalid
mix `flags and (visibleMask <> 0)`.

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt)
includes the distance calculation, Boolean state and a bit-mask test. Trace
`250 - 20` through `abs` into `distance`, recording both value and type:
the expected sequence is `u8` inputs, an `i16` difference and a `u16`
result.
