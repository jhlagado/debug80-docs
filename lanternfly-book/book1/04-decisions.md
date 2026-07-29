---
layout: default
title: "Decisions"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 4
---

# Decisions

A game status depends on two facts. Zero lives ends the round. A score of 100
or more wins it. Every other state keeps the round in progress:

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

Conditions are tested from top to bottom. The first true branch runs and
execution continues after `end`.

## One conditional branch

```lanternfly
if score >= 100 then
    status = won
end
```

`then` separates the Boolean condition from its body. The body may contain
assignments, calls, loops or another decision. The closing `end` belongs to the
nearest open block.

## Two alternatives

`else` handles every value left after the first test:

```lanternfly
if lives > 0 then
    status = playing
else
    status = finished
end
```

Exactly one branch runs. A true condition selects the first body. A false
condition selects the `else` body.

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

Order carries meaning. The life test receives priority when both conditions
apply. One `end` closes the complete chain.

## Selecting one named value

`select` evaluates one expression and compares it with constant cases:

```lanternfly
const north as u8 = 0
const east as u8 = 1
const south as u8 = 2
const west as u8 = 3

var direction as u8 = north
var deltaX as i8 = 0
var deltaY as i8 = 0

sub findStep()
    deltaX = 0
    deltaY = 0

    select direction
    case north
        deltaY = -1
    case east
        deltaX = 1
    case south
        deltaY = 1
    case west
        deltaX = -1
    else
        deltaX = 0
        deltaY = 0
    end
end
```

Each `case` holds one or more compatible compile-time values. Cases never fall
through, so a matching body continues after the closing `end`. The optional
`else` handles unmatched values.

Several values can share a body:

```lanternfly
case north, south
    deltaX = 0
```

Duplicate or overlapping cases are compile errors.

## Choosing `if` or `select`

Use `if` when each branch asks a different question:

```lanternfly
if lives = 0 then
    ...
else if score >= 100 then
    ...
end
```

Use `select` when several constant values are compared with one expression:

```lanternfly
select direction
case north
    ...
case south
    ...
end
```

The selected expression is evaluated once.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt) combines an
ordered status chain with direction selection.
