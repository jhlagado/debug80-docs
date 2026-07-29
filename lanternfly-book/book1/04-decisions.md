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

The three constants come first for a reason. `status` could have
stored bare numbers — zero for finished, one for playing, two for won —
and the program would run identically. It would also be unreadable in a
month, because a bare `2` in a comparison carries no more meaning in a
status than it did in Chapter 2's magic numbers. The constants give
each state of the game a name; comparisons and assignments say `won`
rather than `2`, and the numbers retreat to the one place they are
defined. This is the standard idiom for a value that means a *state*
rather than a quantity — a small set of named constants and one
variable that always holds one of them — and you will see it in every
chapter from now on. It costs nothing at runtime, like every name in a
compiled language, and it turns the whole decision below into
sentences.

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

The body may contain assignments, calls, loops — anything a program
can do, it can do conditionally. That includes another decision.
Decisions nest, and the nesting reads exactly as it speaks:

```lanternfly
if lives > 0 then
    if hasArrived then
        loseLife()
    end
end
```

Only when lives remain does the arrival question even get asked. You
have met this logic before in different clothing: Chapter 3's
short-circuiting `and` would write it in one line, `lives > 0 and
hasArrived`, and for a simple pair the one-liner is usually the better
sentence. The nested form comes into its own when each level has its
own extra work to do, or when the inner decision has an `else` of its
own. Both spellings are the same policy; choose the one the next
reader will absorb faster.

Underneath, a decision is as small as it looks. The comparison
compiles to arithmetic that sets the processor's flags, and the `if`
becomes a conditional jump — skip the body if the test failed. A
single `if` is among the cheapest things you can ask of the machine,
which is worth knowing on a processor you share with a frame deadline.
The costly decisions are not the individual tests but the habits
around them — testing the same fact repeatedly, or chaining tests in
an order that makes the common case walk past every rare one. Both
habits have remedies later in this chapter.

## Two alternatives

`else` handles every value left after the first test:

```lanternfly
if lives > 0 then
    status = playing
else
    status = finished
end
```

Exactly one branch runs. That guarantee sounds slight and is not,
because it is *exhaustiveness*: with an `else`, there is no state of
the world in which the decision falls through untouched and `status`
keeps whatever it held before. A bare `if` says "in this case, act";
an `if` with `else` says "in every case, act". Asking which of those
two sentences you mean is one of the more profitable questions in
programming, because the bugs live in the gap between them — the
untaken branch that left a stale value behind is a cousin of Chapter
1's lying counter, and `else` is one of the standing defences against
it.

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
with a winning score still finishes the round — presumably the
designer's intent, and now enforced by position. Reverse the first two
branches and the same collision of events crowns a dead player the
winner. Neither version is wrong as code; they are different rules.
When you write an `else if` chain, you are ranking your rules, and
when you read one, the ranking is as much a part of the program as the
comparisons.

The skipping has a practical face as well. Execution pays for the
tests it reaches, so a chain costs in proportion to how far down it
travels before a condition answers true. When one case dominates —
the round is almost always simply in progress — a chain ordered with
the common case early answers most frames after a test or two. Rules
of priority set the order first; among equals, put the frequent case
where execution finds it soonest.

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

`select` evaluates one expression and compares it with constant
cases. Each `case` holds one or more compatible compile-time values,
and the matching body runs. Note the deltas: a direction becomes a
step by turning a name into a pair of signed offsets — north means y
decreases, east means x increases. Screen coordinates grow downward
and rightward on most raster hardware, which is why north is -1 and
not +1; the constants quietly encode a fact about the machine's idea
of a screen.

The optional `else` handles anything unmatched. Each normal case assigns both
deltas, while `else` supplies the zero step for an invalid direction. Without
it, an unmatched value would leave the previous deltas unchanged.

Cases never fall through: a matching body runs, then execution continues after
the closing `end`. When several values need the same body, list them together:

```lanternfly
case north, south
    deltaX = 0
```

Duplicate or overlapping cases are compile errors. By contrast, an `else if`
chain may contain overlapping conditions because their order resolves which
branch wins.

## Choosing `if` or `select`

Use `if` when branches test different facts, as `updateStatus` does with
`lives` and `score`. Use `select` when several constant values are compared
with one expression. The selected expression is evaluated once, and the
statement makes that single basis for the decision explicit.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt)
combines an ordered status chain with direction selection. Trace
`updateStatus` with `lives = 0` and `score = 100`; the first branch should
produce `finished`. Reversing the first two conditions on paper should
produce `won` from the same inputs, demonstrating that branch order is part
of the rule.
