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
needs, on the fly, millions of times a run. The notation for combining is
the expression, and this chapter is the grammar of expressions: the
operators, the types their results take, and the comparisons that turn
quantities into decisions.

Begin with a real computation. Put two objects on the same screen line
and ask how far apart they are. Each coordinate fits comfortably in a
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

That one line carries the discipline of this whole chapter. In a
language that runs on big machines, you can write a formula and let some
runtime decide how much room the numbers need. A compiler for a small
machine has no such luxury: it must choose a width for every
intermediate value, at compile time, because the processor needs to know
whether it is working with one byte or two before the first instruction
is emitted. Lanternfly makes those choices by fixed, learnable rules,
and the skill this chapter teaches is following the type through a
formula the same way you follow the value. Programmers who can do that
read `abs(targetX - objectX)` and see three types — `u8`, `i16`, `u16`
— as clearly as they see the arithmetic, and they stop being surprised
by their own formulas.

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

The first four are school arithmetic and need no introduction, but
division deserves a careful look because integer division is not the
division you grew up with. There are no fractions here — the types
cannot hold them — so division truncates toward zero and `mod` supplies
what division discards: `17 / 5` produces 3, and `17 mod 5` produces
the 2 left over. Together the two answers reconstruct the question,
since 3 × 5 + 2 is 17 again.

The pair is one of the most-used tools in
game arithmetic, because "which group is this in, and where inside the
group" is a question games ask constantly. A screen built from
eight-pixel tiles turns a pixel position into a tile with `x / 8` and
into an offset within that tile with `x mod 8`. A one-dimensional
element number turns back into a row with `n / columns` and a column
with `n mod columns`. Seconds become minutes and seconds with `/ 60`
and `mod 60`. Learn to hear "which and where inside" whenever you see
the pair, and half the index arithmetic in this book will read itself.

A zero divisor triggers an arithmetic fault at runtime, or a compile
error when the zero is constant. The compiler catches the mistake it
can see; the target catches the one it cannot. Neither lets the
program sail on with an answer that means nothing.

The shifts move whole bit patterns sideways, and their arithmetic
meaning falls out of Chapter 2's column values. `shl` moves bits left
and fills the low positions with zero; since every column is worth
double its neighbour, each single shift doubles the value — `5 shl 1`
is 10, `5 shl 3` is 40, and Chapter 2's `1 shl 15` marched a single
bit up to the 32,768 column. `shr` moves bits right and halves the
value, filling from the sign bit for signed values and with zero for
unsigned values, so shifting a negative number right keeps it
negative and halving works for both signs. The result keeps the left
operand's type. On processors without a fast multiply — the Z80 among
them — shifting is how careful programmers double and halve, and the
compiler leans on the same trick when a multiplier happens to be a
power of two.

## Width belongs to every operation

Here is the rule the opening example relied on, in full — and behind
each clause of it, a fact about hardware.

Arithmetic on matching 16-bit or 32-bit values retains that type. For
matching 8-bit values, `+`, `*`, `/`, `mod` and `^` produce the
corresponding 16-bit type. This is the hardware speaking: multiply two
bytes and the honest answer needs up to sixteen bits — 255 × 255 is
65,025 — and even an addition can carry into a ninth column. Rather
than quietly cutting such results and calling it arithmetic,
Lanternfly gives the intermediate the room it mathematically needs.
Subtraction from either byte type produces `i16`, because a
difference can be negative, as the opening example showed. Bitwise
operations and shifts retain the 8-bit operand type: masks have no
ninth column to carry into.

When the two sides of an operation differ, the narrower operand
widens automatically, provided every one of its values fits the type
already present on the other side:

```lanternfly
var row as u8 = 3
var column as u8 = 4
var elementNumber as u16 = 0

elementNumber = row * 20 + column
```

Trace the types the way you would trace the values, because this is
the skill in action. `row` is `u8`; `row * 20` is a byte
multiplication, so it produces `u16` — value 60. `column` is `u8`,
narrower than the `u16` on the other side of the `+`, and every `u8`
value fits in a `u16`, so it widens; the addition is `u16` work and
yields 64. The destination is `u16`, so the store is exact. Value 64,
type `u16`, no conversions written because none lost anything — the
whole chapter's machinery, running quietly under one ordinary line.

Note what did not happen: the compiler never invents a third common
type. If you carry habits from C, where mixed operands are silently
promoted up a ladder of conversion rules that few programmers can
recite, this is the adjustment to make. Lanternfly widens one side to
meet the other, or asks you to decide. Incompatible signedness is the
case where it asks:

```lanternfly
var signedValue as i16 = -4
var unsignedValue as u16 = 20
var total as i32 = 0

total = i32(signedValue) + i32(unsignedValue)
```

There is no width in which `i16` and `u16` can meet without one of
them giving something up — an `i16` cannot hold 65,535, a `u16`
cannot hold -4 — so the language declines to guess which sacrifice
you meant. The two conversions to `i32` are you settling the
question, in writing, in a type with room for every value either
operand could hold.

Order still controls the intermediate type, and it can matter. With
byte inputs, `x + 1 - y` performs the addition first, producing
`u16`, and the subtraction then wraps in `u16` if its result is
negative: with `x` at 0 and `y` at 2, the expression yields 65,535
rather than -1. Write `i16(x) + 1 - i16(y)` when the calculation
needs a signed final range. The lesson generalises beyond this one
shape: a formula's meaning includes the order its intermediates are
formed in, and rearranging a working formula is not always the
harmless tidying it appears to be.

Each fixed-width operation wraps in its resolved result type.
Constant folding uses the same rule, so a formula evaluated at
compile time agrees with the same formula evaluated on the target,
wrap for wrap. You will never discover that the compiler's arithmetic
and the machine's arithmetic were two different arithmetics — a
discovery that has ruined debugging sessions in languages that
promise less.

## Comparisons produce Boolean values

Arithmetic combines quantities into quantities. The next step in the
chapter's progression is combining quantities into *decisions*, and
the bridge is the comparison:

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

Each takes two compatible values and produces a Boolean, which can be
stored, as above, or consumed directly by an `if` or a loop
condition. Storing one is underrated: `hasArrived` computes the
arrival test once, names it in the game's vocabulary, and lets a
dozen later lines consult the name instead of repeating the formula.

Comparison chaining is rejected: the Python habit of writing
`minimum <= value <= maximum` in one breath does not carry over. A
bounded-range test joins two comparisons explicitly:

```lanternfly
if minimum <= value and value <= maximum then
    acceptValue()
end
```

Two comparisons and an `and` are exactly what the machine will
execute, and in this language the source prefers to say so.

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
condition like `count > 0 and total / count > threshold` never
divides by zero, because the division is only reached when the guard
has already said it is safe. Whole families of careful code are built
on that ordering, so it is worth knowing it is guaranteed rather than
merely likely.

With integer operands, the same four words operate on every bit at
once, and this is where Chapter 2's promise about packing facts into
bytes comes due. On a machine with memory measured in kilobytes,
eight independent yes-or-no facts for the price of one byte is a
bargain taken daily — visible, active, invulnerable, and five more,
all in one `flags` byte. The `%` prefix writes a literal in binary,
the natural notation for masks, each character one bit in the order
the byte holds them:

```lanternfly
const visibleMask as u8 = %00000001
var flags as u8 = visibleMask

if (flags and visibleMask) <> 0 then
    visibleCount = visibleCount + 1
end
```

The bitwise words give the byte a complete vocabulary. `or` with a
mask switches a fact on — `flags or visibleMask` has the visible bit
set and every other bit unchanged. `and` with the mask's complement
switches it off. `xor` with a mask flips it, on to off and off to on,
which is how blinking things blink. And `and` with the mask itself,
as in the condition above, reads the fact back: the result keeps
only the masked bit, producing an integer, and `<> 0` turns that
integer into the Boolean the condition needs. The last step is
spelled out because, as Chapter 2 established, an integer never
becomes a condition by itself — not even a freshly masked one.

## Grouping and precedence

An expression with several operators needs an order, and parentheses
bind first — when in doubt, or when a reader might doubt, group.
After parentheses: power binds more tightly than unary minus,
followed by multiplication and division, addition and subtraction,
shifts, comparisons, `not`, `and`, `xor` and `or`.

The top of that ranking is school algebra — multiplication before
addition, as in `row * 20 + column`, which multiplied first exactly
as arithmetic class promised. The lower reaches are arranged so that
the common whole-line shapes read without brackets: arithmetic
resolves first, then comparisons turn the quantities into Booleans,
then the Boolean words combine the answers. `minimum <= value and
value <= maximum` needed no parentheses because the ranking already
reads it as two comparisons joined by `and` — the order a person
means.

One consequence deserves its own paragraph. Because comparisons bind
before `not`, the expression `not x = y` means `not (x = y)` —
usually exactly what was wanted, since "not equal-to" is the common
intent. A C programmer's reflex reads it the other way, because C's
`!` binds before `==`, and that reflex has caused enough bugs in C
that compilers warn about it. Write `(not x) = y` on the rare
occasion you mean to compare the bitwise complement of `x`.

```lanternfly
average = (first + second) / 2
```

The parentheses add before dividing — without them, precedence would
divide `second` by 2 first and the "average" would be nothing of the
kind. They also make mixed mask and condition expressions easier to
scan:

```lanternfly
if (flags and visibleMask) <> 0 and distance <= 2 then
    visibleCount = visibleCount + 1
end
```

The first `and` works on bits and the second on Booleans; the
parentheses keep the two jobs visibly separate. Precedence would sort
the meaning out either way, but the reader sorting it out at a glance
is worth a pair of brackets.

## Example

The [chapter listing](/lanternfly-book/book1/code/03-expressions.txt)
includes the distance calculation, Boolean state and a bit-mask test.
Two traces are worth the pencil here. First the value trace: 250
minus 20, through `abs`, into `distance`. Then the type trace — `u8`
in, `i16` in flight, `u16` out — which is the new skill. The value
tells you what the program computed; the type tells you why it had
room to. When you can run both traces down an unfamiliar formula
without stopping, this chapter has done its work, and the rest of the
book will spend the skill freely.
