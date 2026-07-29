---
layout: default
title: "Decisions"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 4
---

# Decisions

Strip away the graphics and a game is a bundle of rules, and the rules
have an order of importance. Zero lives ends the round, no matter what
else is true. A score of 100 or more wins it — but only if the player is
still alive to enjoy the fact. Every other state keeps the round in
progress. Chapter 3 built the machinery for asking single questions;
this chapter is about arranging the questions into policy. The program
below encodes the three rules together with their pecking order:

```lanternfly
const finished as u8 = 0
const playing as u8 = 1
const won as u8 = 2

var lives as u8 = 3
var score as u8 = 0
var status as u8 = playing

sub updateStatus()
    if lives = 0 then
        status = finished
    else if score >= 100 then
        status = won
    else
        status = playing
    end
end
```

The constants name the permitted states. Comparisons and assignments can use
`finished`, `playing` and `won`, while their numeric encodings remain in one
set of declarations.

## One conditional branch

```lanternfly
if score >= 100 then
    status = won
end
```

This is the decision at its smallest: one test, one consequence,
nothing otherwise. `then` separates the Boolean condition from its
body, and the closing `end` belongs to the nearest open block, exactly
as in Chapter 1.

The body may contain any executable statement allowed in a routine body:
assignments, calls, loops and other decisions. Decisions can nest:

```lanternfly
if lives > 0 then
    if hasArrived then
        loseLife()
    end
end
```

Only when lives remain does the arrival question get asked. Short-circuiting
`and` can express the same condition in one `if`:

```lanternfly
if lives > 0 and hasArrived then
    loseLife()
end
```

The nested form is useful when each level has more work or when the inner
decision has its own `else`.

On a typical byte processor, the comparison can set processor flags and the
`if` can become a conditional jump that skips the body. The exact cost depends
on the compared types and the target. Repeating a test repeats that cost, and
a chain pays for each condition it reaches.

## Two alternatives

`else` handles every value left after the first test:

```lanternfly
if lives > 0 then
    status = playing
else
    status = finished
end
```

Exactly one branch runs. With `else`, `status` is assigned whether the
condition is true or false; a bare `if` would leave it unchanged on the false
path.

## Several ordered tests

Lanternfly writes a longer chain as two words, `else if`:

```lanternfly
if lives = 0 then
    status = finished
else if score >= 100 then
    status = won
else
    status = playing
end
```

Conditions are tested from top to bottom, and the first true condition
claims execution: its body runs, and the rest of the chain — tests and
all — is skipped. One `end` closes the complete chain, however long it
grows.

Order carries meaning, and one state proves it: the player reaches 100
points and dies in the same
frame. Both conditions are true, and only the order of the chain
decides the outcome. As written, the life test comes first, so dying
with a winning score still finishes the round, matching the priority stated
at the start of the chapter. Reverse the first two
branches and the same collision of events crowns a dead player the
winner. Neither version is wrong as code; they are different rules.
When you write an `else if` chain, you are ranking your rules, and
when you read one, the ranking is as much a part of the program as the
comparisons.

Execution pays the target-specific cost of every condition it reaches. When
priority permits either order, placing a frequent cheap condition earlier may
reduce average work; a rarer condition can still belong first when it is much
cheaper or when the rules give it priority.

## Selecting one named value

An `else if` chain asks a different question at every step. Often the
questions are all the same question — *what is this value?* — asked
of one expression, against a set of known answers. A direction is
north, east, south or west; a status is one of three constants; a
menu choice is one of five entries. That shape is common enough to have its own statement:

```lanternfly
const north as u8 = 0
const east as u8 = 1
const south as u8 = 2
const west as u8 = 3

var direction as u8 = north
var deltaX as i8 = 0
var deltaY as i8 = 0

sub findStep()
    select direction
    case north
        deltaX = 0
        deltaY = -1
    case east
        deltaX = 1
        deltaY = 0
    case south
        deltaX = 0
        deltaY = 1
    case west
        deltaX = -1
        deltaY = 0
    else
        deltaX = 0
        deltaY = 0
    end
end
```

`select` evaluates one integer expression and compares it with constant
integer cases. Each `case` holds one or more compatible compile-time values,
and the matching body runs. The deltas turn each direction into a pair of
signed offsets. This game uses a
top-left origin, so increasing `y` moves down and north uses -1.

The optional `else` handles anything unmatched. Each normal case assigns both
deltas, while `else` supplies the zero step for an invalid direction. Without
it, an unmatched value would leave the previous deltas unchanged.

Cases never fall through: a matching body runs, then execution continues after
the closing `end`. A separate terrain selection shows values that genuinely
share a complete body:

```lanternfly
const grass as u8 = 0
const sand as u8 = 1
const mud as u8 = 2

var terrain as u8 = grass
var movementCost as u8 = 0

select terrain
case grass, sand
    movementCost = 1
case mud
    movementCost = 2
end
```

`grass` and `sand` select the same movement cost, so they share one case.
Duplicate case values are compile errors. By contrast, an `else if` chain may
contain conditions that are true for the same input because their order
resolves which branch wins.

## Choosing `if` or `select`

`if` suits branches that test different facts, as `updateStatus` does with
`lives` and `score`. Use `select` when several constant values are compared
with one integer expression. The selected expression is evaluated once, and
the statement makes that single basis for the decision explicit. Selection on
Boolean values, addresses or references is outside the working 0.3 language.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt)
combines an ordered status chain with direction selection. Trace
`updateStatus` with `lives = 0` and `score = 100`; the first branch should
produce `finished`. Reversing the first two conditions on paper should
produce `won` from the same inputs, demonstrating that branch order is part
of the rule.
