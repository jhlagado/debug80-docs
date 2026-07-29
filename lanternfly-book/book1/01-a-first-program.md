---
layout: default
title: "A First Program"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
---

# A First Program

Games keep counts: lives left, coins collected and frames until an effect
ends. Each count has a valid range. Our first program maintains one such
invariant: `lives` must stay between 0 and 255 and must not wrap from zero
back to 255.

The player starts a round with three lives. Losing one should subtract
one, but only while the count is above zero:

```lanternfly
var lives as u8 = 3

sub loseLife()
    if lives > 0 then
        lives = lives - 1
    end
end
```

The example contains a variable, a subroutine, a condition and an assignment.
From top to bottom, it says: if at least one life remains, subtract one.
The rest of the chapter takes those parts in order.

## The case for Lanternfly

A Z80 can directly address 65,536 bytes. Program code, variables, display
memory and firmware reservations must fit into the machine's memory map.
Lanternfly therefore fixes the width and layout of data before execution.

The source keeps the structure that would be tedious to express repeatedly in
assembly. A backend must reserve one byte for `lives` and preserve the
conditional update. The first Z80 backend will commonly use a comparison,
conditional branch, arithmetic and a store; a C backend may retain a
higher-level conditional. Once the compiler exists, its generated listing will
expose the exact choices.

## Storing a value

```lanternfly
var lives as u8 = 3
```

`var` reserves storage and `lives` names it. `u8` means an unsigned
eight-bit integer, so the variable occupies one byte and can represent values
from 0 through 255. The initializer arranges for that byte to contain 3 before
the program entry begins.

The width is part of the program rather than a backend choice. Every target
must give `u8` the same range and arithmetic behaviour. Chapter 2 adds wider
and signed types for values that need different ranges.

Lanternfly names values and routines in lower camel case. A short name
such as `lives` is a single word; a longer name joins words by
capitalising each word after the first:

```lanternfly
var remainingLives as u8 = 3
```

The casing distinguishes ordinary values and routines from the Pascal-cased
record types introduced later.

## Naming an action

```lanternfly
sub loseLife()
    if lives > 0 then
        lives = lives - 1
    end
end
```

`sub` declares a named sequence of statements. A collision routine, timeout
handler or other part of the game can invoke `loseLife()` without repeating
the guard and subtraction. If the rule changes, its implementation has one
home.

The parentheses hold parameters, the inputs a caller supplies. This
pair is empty because losing a life needs nothing from the caller —
everything the routine touches is already sitting in `lives`. Parameters
are introduced in Chapter 9.

The inner `end` closes the `if`; the outer one closes the subroutine.
Lanternfly uses `end` for each block. Indentation is not grammar, but it makes
the nesting visible.

## Running a statement conditionally

```lanternfly
if lives > 0 then
    lives = lives - 1
end
```

The comparison `lives > 0` produces a Boolean value. When it is `true`, the
assignment runs. When it is `false`, execution continues after `end` and
`lives` is unchanged.

Without the guard, a call made when `lives` is zero would calculate `0 - 1`.
Byte subtraction uses a wider signed intermediate, so that intermediate is
`-1`. Storing it back into `u8` keeps the low eight bits, which represent 255.
The guard prevents the negative intermediate from reaching the unsigned
destination.

## Assignment uses the destination type

```lanternfly
lives = lives - 1
```

The right-hand expression is evaluated using the old value of `lives`. The
result is then converted to the destination type and stored. Read the
statement as “the new `lives` is the old `lives` minus one”.

Because the destination is `u8`, assignment converts the result to `u8`.
This update qualifies for the round-trip arithmetic rule: every typed value in
the expression started as `u8` and the result returns to a `u8` destination.
The conversion is therefore automatic and produces no warning. Chapter 2
shows the warnings used when an expression crosses declared types.

At the start of a statement, `=` means “store in”. Inside an expression, the
same token compares two values for equality. Chapter 2 puts both uses side by
side.

## Comments explain intent

`//` begins a comment and consumes the rest of its line. The compiler
ignores it entirely, which means a comment is addressed to the only
audience left: the next person who reads the routine. Usually that
person is you, some months later, having forgotten everything you were
certain you would remember.

```lanternfly
// Keep the life count at zero after the round ends.
if lives > 0 then
    lives = lives - 1  // The guard prevents a wrap from zero to 255.
end
```

The useful comment records what the statements cannot say. The code shows
which condition is checked; the comment explains that the condition prevents
unsigned wrap. That reason helps a later edit preserve the guard.

A comment that merely repeats its statement — "subtract one from lives" —
adds no information and goes stale when the line changes. Record the reason
when it is not already apparent from the code.

## Words and symbols

Lanternfly spells structure with words such as `var`, `sub`, `if`, `then` and
`end`. Arithmetic and comparison use familiar symbols. This keeps blocks
readable without making formulas verbose.

| Job | Form |
| --- | --- |
| declare storage | `var lives as u8` |
| declare a subroutine | `sub loseLife()` |
| begin a decision | `if lives > 0 then` |
| close the current block | `end` |
| subtract | `lives - 1` |
| assign | `lives = ...` |
| comment | `// explanation` |

Three punctuation forms do structural work inside expressions: parentheses
group and hold arguments, square brackets select array entries, and a dot
selects a field of a record. Arrays arrive in Chapter 6 and records in
Chapter 7.

## Example

The [chapter listing](/lanternfly-book/book1/code/01-first-program.txt)
contains the complete routine. Trace four calls starting from `lives = 3`.
The stored values should be 2, 1, 0 and 0. The fourth call checks the false
branch and confirms that the guard prevents wraparound.
