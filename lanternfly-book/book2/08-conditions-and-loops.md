---
layout: default
title: "Conditions and Loops"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 8
---

# Conditions and Loops

Lanternfly's control structures are deliberately small and explicit.
Conditions require `boolean`; integer values never become conditions
implicitly.

## `if`

The basic form is:

```lanternfly
if active then
    updateActor()
end
```

Alternatives use `else if` and `else` with one closing `end`:

```lanternfly
if input < minimum then
    output = minimum
else if input > maximum then
    output = maximum
else
    output = input
end
```

One-line conditionals are deferred.

## `select`

`select` chooses among compatible ordinal cases after evaluating its
controlling expression once. Integers, enums and subranges are ordinal:

```lanternfly
select direction
case left
    playerX = playerX - 1
case right
    playerX = playerX + 1
else
    holdPosition()
end
```

Cases contain compatible ordinal compile-time constants and never fall
through. Several values may share a case:

```lanternfly
case grass, sand
    movementCost = 1
```

`to` includes its upper endpoint, while `until` excludes its boundary:

```lanternfly
case 0 to 9
    band = cold
case 10 until 20
    band = warm
```

Each case value folds under its own expression type. A single exact literal
may adopt the selected type, while an all-literal expression uses the normal
`i16` default. The folded value must be representable in the selected type.
After conversion to the selected type, every range must contain at least one
value. Duplicate, overlapping, reversed, empty or incompatible cases are
errors. An enum selection without `else` is exhaustive when its cases cover
every member.

Boolean and opaque-address selection is deferred.

## Counted loops

`to` includes its limit:

```lanternfly
var level as u8

for level = 1 to 10
    loadLevel(level)
end
```

`until` excludes its boundary:

```lanternfly
var index as u8

for index = 0 until count(actors)
    actors[index].active = false
end
```

With a positive step, `until` is the natural form for a count-declared array
because the array count can appear directly. Arrays with explicit domains use
`lower` and `upper` for matching traversal.

An optional compile-time step may be positive or negative:

```lanternfly
for row = 7 to 0 step -1
    clearRow(row)
end
```

The control name must denote a writable, non-volatile ordinal variable or
scalar parameter. Enum controls advance in declaration order; subranges use
their host ordering. An explicit step for an enum or enum-subrange control is
an integer constant. The loop introduces no control declaration.

## Counted-loop evaluation

Before entering the loop, the compiler evaluates the start and boundary once,
in that order, and only then stores the converted start. The boundary
therefore observes the control variable's old value. The step is a
compile-time expression and must be nonzero.

The boundary is an independently typed compatible ordinal expression. For an
integer control, an exact boundary need not fit the control variable when that
value is never stored:

```lanternfly
var bytes as u8[256]
var index as u8

for index = 0 until count(bytes)
    bytes[index] = 0
end
```

The control variable can visit 0 through 255 while the exclusive boundary is
the exact value 256.

## Counted-loop continuation

| Step     | `to` continues while | `until` continues while |
| -------- | -------------------- | ----------------------- |
| positive | control <= boundary  | control < boundary      |
| negative | control >= boundary  | control > boundary      |

After each body execution, the compiler calculates the next value
mathematically and tests it before storing it. If that value fails the
continuation test, the loop ends without storing it. A value that continues
must fit the control type; a dynamic failure causes `F-LOOP-RANGE`.

After the loop, the control variable retains the last value stored. A
zero-iteration loop leaves it at the converted start.

The body cannot assign to the control variable directly or through a call or
native effect summary. A conservative statement-level `asm` block is invalid
while the control is visible because it may write any visible mutable object.

`continue` performs the step and next test. `exit` leaves the loop.

## Collection traversal

`for each` traverses every leaf element of a fixed array in row-major order:

```lanternfly
for each actor in actors
    updateActor(actor)
end
```

The collection must be a fixed-array storage path. The compiler evaluates its
complete path, indices and checks once before traversal.

The binding denotes the current element:

```lanternfly
for each pixel in pixels
    pixel = 0
end
```

A scalar binding reads and writes the scalar element. A record binding
supports field access, aggregate assignment and aggregate calls. A constant
array gives a read-only binding. Volatile arrays are rejected in 0.4.

`continue` advances to the next element. `exit` leaves the traversal. Array
extents are positive, so the collection contains at least one element.

## Conditional loops

`while` tests a Boolean condition before each iteration:

```lanternfly
while enemiesRemaining > 0
    updateEnemy()
end
```

Use `while true` for an indefinite loop:

```lanternfly
while true
    readInput()

    if quitRequested then
        exit
    end

    updateGame()
end
```

`continue` returns to the condition test. `exit` leaves the loop.

## Loop control

Bare `exit` and `continue` apply to the innermost enclosing `for`, `for each`
or `while`. Both are errors outside a loop.

`exit` never terminates the program or leaves a routine. `return` leaves a
routine or hosted body.

Labelled loops, named exits, a bare `loop`, post-test loops and
`repeat`/`until` are outside the first edition.
