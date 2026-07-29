---
layout: default
title: "Names and Integer Types"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 2
---

# Names and Integer Types

Chapter 1 kept one count in one byte, and a byte was plainly enough: nobody
earns three hundred lives. Other counts outgrow a byte quickly, and it pays
to feel how quickly. A score climbs past 255 in the first minute of decent
play. A frame counter ticking fifty times a second passes 65,535 — the most
two bytes can hold — in a little over twenty minutes, which is a short
session for a good game. A temperature, a velocity, a difference between
two positions: these need to swing below zero, which no unsigned count can
do at all.

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

Read down the column of types and you are reading a table of engineering
decisions: one byte for lives, two signed bytes for temperature, two
unsigned for score, four for the frame counter — which at fifty frames a
second now takes nearly three years of continuous play to wrap. Declaring
a type is not paperwork demanded by a fussy compiler. It is the design of
your program's memory, written where every future reader can see it, and
this chapter is about making those decisions well.

## Counting in binary

The ranges in the table below will look arbitrary until you can rebuild
them yourself, so take two minutes and rebuild them. A bit is a digit
that can be 0 or 1, and bits gain meaning the same way decimal digits do:
by position. In decimal, the columns are worth 1, 10, 100, 1000 — each
ten times the last. In binary, the columns are worth 1, 2, 4, 8, 16, 32,
64, 128 — each double the last. The byte `%00000011` is 2 + 1, or three
lives. The byte `%11111111` is all eight columns at once:
128 + 64 + 32 + 16 + 8 + 4 + 2 + 1, which is 255. That is where the
byte's ceiling comes from — 255 is not a number somebody picked, it is
simply what eight columns of doubling add up to.

The doubling continues past the byte. A ninth bit would be worth 256, so
sixteen bits top out at 65,535, and thirty-two at a little over four
billion. Each new bit doubles the reach of all the bits before it, which
is why widths grow by whole bytes and ranges leap rather than creep.
Every "how high can it count" question in this book comes back to this
one paragraph.

## Six integer types

| Type | Width | Range |
| --- | ---: | ---: |
| `u8` | 8 bits | 0 to 255 |
| `i8` | 8 bits | -128 to 127 |
| `u16` | 16 bits | 0 to 65,535 |
| `i16` | 16 bits | -32,768 to 32,767 |
| `u32` | 32 bits | 0 to 4,294,967,295 |
| `i32` | 32 bits | -2,147,483,648 to 2,147,483,647 |

The naming scheme is small enough to learn in one sitting. The first
letter states signedness: `u` means unsigned and stores zero or a
positive value, `i` means signed and includes negatives. The number
states the exact bit width. Once it is familiar, `i32` reads at a glance
— signed, thirty-two bits — and the table stops being something to
memorise, because you can regenerate any row of it from the doubling
rule above.

The signed rows deserve their own explanation, because the machine has
no minus sign to store — only bits. The arrangement in universal use is
called two's complement, and its essence fits in a sentence: the top bit
of a signed value is given a *negative* place value. In an `i8`, the
columns are worth -128, 64, 32, 16, 8, 4, 2, 1. All zeros is 0; a lone
top bit is -128; all ones is -128 + 127, which is -1. Notice what that
means: the same eight bits that spell 255 in a `u8` spell -1 in an
`i8`. The pattern does not change — only the agreement about what the
top column is worth. Hold onto that idea; when this chapter reaches
conversions, it will do the heavy lifting.

## The price of a width

Exactness is the point of the whole scheme, and it cuts in two
directions — space and time. A coordinate stored as `u8` occupies one
byte on every target: one byte on a Z80, one byte anywhere else this
source is ever compiled. An `i32` counter occupies four. On a machine
with 65,536 pigeonholes in total, a table of a hundred entries feels
that difference immediately: one hundred bytes against four hundred,
for the same hundred counts.

Width also prices the arithmetic. A Z80 adds two eight-bit values in a
couple of instructions, but it has no thirty-two-bit hands; to add two
`i32` values it must work through them byte by byte, carrying as it
goes, like a person doing column addition. The backend will spend those
instructions wherever the source asked for 32 bits — and it must,
because the type is a promise about range, and the promise holds on
every target.

So choosing a type is answering two questions, and it is worth
answering them in this order. First: what is the largest value this
count can ever legitimately hold, and can it ever be negative? Answer
generously — the wrap bug from Chapter 1 is what "slightly too
optimistic" costs. Second: of the types that are safely large enough,
take the narrowest, because every wasted byte and every widened
addition is paid for on the target. Lives fit a `u8` with a guard.
A score bounded at 9,999 fits a `u16` twice over. A frame counter that
must outlive the longest session anyone will ever play earns its
`u32`. The declarations at the top of this chapter are those three
sentences, compressed to a column.

## Constants name fixed values

```lanternfly
const startingLives as u8 = 3
const maximumScore as u16 = 9999

var lives as u8 = startingLives
var score as u16 = 0
```

`const` names a compile-time value — settled before the program runs,
costing nothing while it runs. It is the antidote to an old ailment
called the magic number. A bare `3` in the middle of a program answers
no questions: three what? decided by whom? changeable? The same value
spelled `startingLives` answers all of them, and the day the designer
grants a fourth life, you change one declaration instead of hunting
every literal three in the source and deciding, one by one, which of
them meant lives and which meant something else that happened to be
three. That hunt is how seasoned programmers lose evenings, and `const`
is how they stopped.

The declared type also puts a fence around the value:

```lanternfly
const maximumByte as u8 = 255
```

`255` is the largest value a `u8` can hold — all eight columns lit — so
this compiles. `256` would need the ninth column, so the compiler
rejects it and asks for a wider type. It is a small check that catches
a whole class of slipped digits before the program exists to
misbehave, and it works because the width was written down where the
compiler could hold you to it. This is the chapter's bargain in
miniature: you state a limit once, and from then on the limit defends
itself.

## Boolean values

Some facts in a game are not quantities at all. The round is over, or
it is not. The door is locked, or it is not. You could store such a
fact in an integer — zero for no, anything else for yes — and
programmers did for decades, but the arrangement invites a quiet kind
of rot: nothing stops a count from wandering into your flag, and
nothing tells a reader which integers are quantities and which are
disguised yes-or-nos. Lanternfly gives the yes-or-no fact its own type:

```lanternfly
var gameOver as boolean = false

gameOver = lives = 0
```

`true` and `false` are the Boolean literals, and a comparison produces
a Boolean. The type is as honest about cost as the integers are: one
byte, storing zero for `false` and one for `true`. A byte is more room
than one fact strictly needs — Chapter 3 shows how eight facts can
share a byte when memory is tight — but it is what the machine can
address directly, and for ordinary state the clarity is worth the
seven spare bits.

The second line above reads strangely until Chapter 1's habit takes
hold. The first `=` begins the statement, so it stores; the second
sits inside an expression, so it compares. The comparison of `lives`
with zero produces true or false, and that Boolean lands in
`gameOver`. What looks at first like a typo is actually the whole
sentence "record whether the player is out of lives" in eleven
characters, and it earns its keep in any routine that wants to make
the decision once and consult it often.

If you arrive from C, you may expect to write `if lives then` and let
any nonzero value count as true. An integer does not become a
condition by itself; the test is written as the comparison it actually
means:

```lanternfly
if lives > 0 then
    ...
end
```

The beneficiary is the reader. `if lives then` obliges the next person
to remember a convention; `lives > 0` names the fact the branch
depends on, and there is nothing to remember. The rule also closes a
classic trap from C's history, where a mistyped assignment inside a
condition silently became both a store and a test. In Lanternfly the
condition must be Boolean, so the mistake has nowhere to hide.

## Assignment and equality share `=`

Many languages split these two jobs across two spellings, `=` and
`==`, and generations of programmers have shipped the bug where one
was typed for the other. Lanternfly keeps one token and lets position
do the work. At the beginning of a statement, a writable path followed
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
After a few programs the eye stops noticing the distinction, for the
same reason nobody confuses the two meanings of "left" in "she left
the room on the left": position tells you everything, and it tells you
instantly.

## Conversions state a width choice

Sooner or later two widths meet in one expression, and this is where a
typed language either helps or nags. Lanternfly draws its line at a
principle worth stating in full, because every rule in this section is
the same principle wearing different clothes: **conversions that cannot
lose information happen silently, and conversions that can lose
information are written down.**

Start with the subtraction from Chapter 1. Two `u8` values subtract
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

The conversion keeps the low eight bits, and this is where the binary
practice pays off. Three hundred in binary is `%100101100` — nine
columns. A byte keeps the low eight, `%00101100`, which is
32 + 8 + 4, or 44. The lost ninth column was worth 256, and 300 minus
256 is, again, 44. Nothing mysterious happened; a value too big for
the box was cut to fit, and `u8(...)` is you signing for the cut.
Omitting it would perform the same store but warn that a value from
another declared type may be lost. The warning is the compiler asking
one question — did you mean to cross this boundary? — and the
conversion is how you answer it in advance. Remember Chapter 1's
philosophy of silence: because ordinary round trips say nothing, this
warning, when it comes, means exactly what it says.

Changing signedness likewise preserves the bit pattern and normally
deserves an explicit conversion — and now the two's complement section
collects its debt. The same eight bits that mean 255 as a `u8` mean
-1 as an `i8`, because the only difference between the types is what
the top column is worth. No bits move in such a conversion; what
changes is the *reading* of them, and a change of reading is exactly
the kind of decision the next programmer needs to see written down.

Widening runs the other way and needs no ceremony:

```lanternfly
var wideScore as u32 = score
```

Value-preserving widening is automatic because nothing can be lost —
the new box is strictly bigger. Unsigned widening fills the new high
bits with zero. Signed widening copies the sign bit into them, which
under two's complement is precisely what keeps -4 meaning -4 in the
wider home: the negative top column moves left, and the copies fill
the columns it vacated. Both fills are the machine doing the obvious
thing, and both are free of surprises, which is why the principle
lets them pass in silence.

## Literal types follow their context

An integer literal begins as an exact value and takes its type from
where it lands. In `score + 10`, the literal ten adopts the type of
`score`. In an expression made only of literals, the default type is
`i16`.

Most of the time this is invisible, which is the design working. It
matters at the edges:

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
brings constants, Boolean state and integer conversion together. The
conversion line rewards a pencil trace in the Chapter 1 manner: write
the wide value in binary, cut it to eight columns, and add up what
remains — predict the stored byte before reading on. If your
prediction and the listing agree, the narrowing rule is yours for
good, and with it the habit this chapter was really teaching: a type
is a claim about a count, binary is how the claim cashes out in bits,
and every strange-looking number a small machine ever shows you is one
of these rules, obeyed.
