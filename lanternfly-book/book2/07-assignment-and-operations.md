---
layout: default
title: "Assignment and Standard Operations"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 7
---

# Assignment and Standard Operations

Assignment is a statement. Equality is an expression operator. Grammar context
distinguishes the shared `=` token.

## Assignment

```lanternfly
playerScore = playerScore + 10
player.position.x = nextX
```

Assignment is not an expression. Chained assignment and compound forms such
as `+=` are absent.

The parser selects assignment when a statement begins with a writable storage
path followed by `=`. Elsewhere, `=` means equality:

```lanternfly
if playerScore = highScore then
    showHighScore()
end
```

## Destination conversion

An exact literal may adopt the scalar destination type when it fits.

Integer assignment uses the same bit conversion as an explicit integer
conversion:

- value-preserving widening is silent;
- narrowing or changing signedness warns with `W-CONVERT-001` by default;
- a project may promote that warning to an error.

The same destination rules apply to initializers, scalar arguments, returned
values, `fill` values and counted-loop starts.

## Round-trip arithmetic exemption

An arithmetic update can store its result back into its original integer type
without `W-CONVERT-001` when:

- the destination has type `T`;
- every typed value leaf also has type `T`;
- every exact leaf resolves as `T`;
- the expression contains only parentheses and integer operators.

```lanternfly
lives = lives - 1
position = position + velocity
bytes[index] = bytes[index] + 1
```

Wider intermediate types from the operator table remain part of the exempt
round trip. Index expressions and record-selection prefixes locate the loaded
value and do not count as arithmetic value leaves.

An explicit conversion to another type or a standard operation such as `abs`
ends the exemption.

## Equality and ordering

| Operator | Meaning |
|---|---|
| `=` | equal |
| `<>` | not equal |
| `<` | less than |
| `<=` | less than or equal |
| `>` | greater than |
| `>=` | greater than or equal |

Comparison chaining is invalid. Integer comparisons use the compatibility
rules from [Chapter 4](04-integer-expressions.md#compatible-operand-types).
Booleans support `=` and `<>`. Opaque addresses support `=` and `<>` when
their classes match. Compatible C strings support all six operators.

Record and array equality is deferred. Programs compare their selected fields
or elements explicitly.

## Standard value operations

### `abs`

`abs(value)` accepts an integer. An unsigned operand is unchanged. A signed
operand produces the unsigned type of the same width:

```lanternfly
var magnitude as u16 = abs(i16(-32768))
```

### `sqrt`

`sqrt(value)` returns the floor of a non-negative square root in the unsigned
type of the operand's width. A negative constant is a compile error; a
negative runtime operand causes `F-NEGATIVE-SQRT`.

### `length`

`length(text)` accepts `cstr` and returns its payload byte count as `u16`. It
scans to the NUL terminator. Literal calls fold at compile time.

## Layout queries

Layout queries are compile-time operations that produce exact, untyped
integers:

```lanternfly
const actorBytes as u16 = size(type Actor)
const tableBytes as u16 = size(actors)
const actorCount as u8 = count(actors)
const rowCount as u8 = count(board, 0)
const xOffset as u8 = offset(Actor.position.x)
```

`size(type Type)` returns a type's byte size. `size(path)` returns the size of
a statically typed path.

`count(type ArrayType)` and `count(path)` return array extents. A
multidimensional array requires a zero-based dimension argument.

`offset(Record.fieldPath)` returns a field path's byte offset from the
beginning of its record type. Intermediate fields must be by-value records.

A layout-query path is unevaluated. It may use fields and constant indices,
but cannot call routines or evaluate dynamic indices. The compiler validates
constant indices without reading storage or running a bounds check.

## Aggregate procedures

`clear` and `fill` have the internal result type `unit` and are valid only as
complete statements:

```lanternfly
clear(board)
fill(framebuffer, backgroundColour)
```

`clear(target)` writes the all-zero representation through a writable record
or fixed array. Every scalar leaf must accept zero.

`fill(target, value)` requires a writable fixed array with a scalar leaf type.
The value receives that type as its expected destination type and is evaluated
and converted once. Every element receives the converted value in row-major
order. A conversion produces at most one warning for the statement.

Both procedures evaluate the destination path once. Their writes are
observable; volatile aggregates receive ordered scalar writes.

## Expression statements

Any expression may stand as a statement:

```lanternfly
updateClock()
distance(playerX, enemyX)
playerScore + 10
```

The final value is discarded while calls, volatile accesses, checks, faults
and short-circuit behaviour remain. A pure expression statement normally
receives `W-EXPR-001`. A routine invocation is not warned merely because its
result is discarded.

## Evaluation order

Evaluation order is fixed across backends:

- statements execute in source order;
- invocation arguments evaluate left to right;
- unary operands evaluate before their operator;
- binary operands evaluate left to right, except for Boolean
  short-circuiting;
- path bases and indices evaluate left to right;
- assignment evaluates the destination path once, then the right-hand
  expression, then stores;
- array and record initializer elements evaluate in written order.

In this assignment, `nextIndex()` runs before `nextValue()`:

```lanternfly
actors[nextIndex()].x = nextValue()
```

A backend may reorder work only when no observable result, call, volatile
access, check or fault can distinguish the change.
