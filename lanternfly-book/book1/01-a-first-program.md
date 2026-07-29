---
layout: default
title: "A First Program"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
---

# A First Program

A player begins a round with three lives. Losing a life subtracts one while the
count is above zero:

```lanternfly
var lives as u8 = 3

sub loseLife()
    if lives > 0 then
        lives = u8(lives - 1)
    end
end
```

You can trace the routine from top to bottom. `lives` starts at three. The
comparison controls whether the subtraction runs. Each `end` closes the
innermost open block.

## Storing a value

```lanternfly
var lives as u8 = 3
```

`var` declares storage. `lives` names that storage and `as u8` gives it an
unsigned eight-bit type. The initializer stores three before the program
entry begins.

Lanternfly names values and routines in lower camel case. A short name such as
`lives` needs one word. A longer name joins words by capitalising each word
after the first:

```lanternfly
var remainingLives as u8 = 3
```

## Naming an action

```lanternfly
sub loseLife()
    ...
end
```

`sub` declares a subroutine: a named sequence of statements. Parentheses hold
parameters in later chapters. Empty parentheses mean that this subroutine
receives none.

The final `end` closes the subroutine. Lanternfly uses the same closing word
for a subroutine, decision, loop and record. Indentation shows which opening
line belongs to it.

## Running a statement conditionally

```lanternfly
if lives > 0 then
    lives = u8(lives - 1)
end
```

The comparison `lives > 0` produces a Boolean value. When it is `true`, the
indented assignment runs. When it is `false`, execution continues after the
closing `end`.

The assignment reads the old value, subtracts one and converts the result back
to `u8`. The condition keeps the result non-negative, and subtracting from a
`u8` value keeps it below 256, so the conversion preserves the value.

## Assignment reads from right to left

```lanternfly
lives = u8(lives - 1)
```

The expression on the right is evaluated first. `u8(...)` converts that result
to the destination type. The final value is then stored in `lives`.

At the start of an assignment statement, `=` means “store in”. Inside an
expression, the same token compares two values. Chapter 2 shows both uses
together.

## Comments explain intent

`//` begins a comment and consumes the rest of its line:

```lanternfly
// Keep the life count at zero after the round ends.
if lives > 0 then
    lives = u8(lives - 1)  // The condition makes this conversion safe.
end
```

The compiler ignores comment text. A comment earns its place when it explains
why the code exists or records a constraint that the statements alone cannot
show.

## Words and symbols

Lanternfly uses words for program structure and symbols for formulas:

| Job | Form |
| --- | --- |
| declare storage | `var lives as u8` |
| declare a subroutine | `sub loseLife()` |
| begin a decision | `if lives > 0 then` |
| close the current block | `end` |
| subtract | `lives - 1` |
| assign | `lives = ...` |
| comment | `// explanation` |

Parentheses group expressions and hold arguments. Square brackets select array
entries. A dot selects a record field.

## Example

The [chapter listing](/lanternfly-book/book1/code/01-first-program.txt) contains
the complete routine.

## Summary

- `var` declares storage and `as` introduces its type.
- `sub` declares a named action.
- `if`, `then` and `end` enclose a conditional block.
- `=` stores a completed expression in its destination.
- `//` begins a line comment.
