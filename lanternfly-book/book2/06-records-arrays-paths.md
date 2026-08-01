---
layout: default
title: "Records, Arrays and Storage Paths"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 6
---

# Records, Arrays and Storage Paths

Records and fixed arrays give aggregate data an exact, static shape.
Lanternfly identifies objects within that shape through storage paths and
ordinal selectors, without introducing source-level pointers.

## Records

`record` declares a nominal type:

```lanternfly
record Position
    x as i16
    y as i16
end

record Velocity
    x as i16
    y as i16
end

record Actor
    position as Position
    velocity as Velocity
    image as u8
    active as boolean
end
```

Each field is a bare `name as Type` line. A field declaration has no `var`
because the record defines layout rather than allocating an instance. Fields
belong to the scope of their record and need be unique only within that record;
`Position.x` and `Velocity.x` therefore do not conflict.

The written declaration determines the exact layout:

- fields appear in declaration order;
- no implicit padding is inserted;
- nested records are stored inline;
- offsets and total size are compile-time facts;
- direct and mutual by-value containment cycles are invalid.

A variable allocates an instance:

```lanternfly
var player as Actor
```

## Fixed arrays

Array dimensions follow the element type:

```lanternfly
const actorCount as u8 = 8
const boardRows as u8 = 12
const boardColumns as u8 = 20

var actors as Actor[actorCount]
var board as u8[boardRows, boardColumns]
var samples as u8[10 to 20]
var palette as u8[Colour]
```

Every dimension has a fixed, nonempty ordinal domain. A lone positive constant
is shorthand for the zero-based domain `0 until count`. An explicit `to` or
`until` range specifies other bounds, while an enum or subrange type supplies
its complete domain. `samples` therefore has eleven elements indexed from 10
through 20, and `palette` has one element for each `Colour` member.

Arrays use contiguous inline storage and true element sizes. Their normalized
index domains are part of the type, so equal element counts with different
bounds or different nominal ordinal types are not assignment-compatible. An
array may contain scalars, strings or records and may appear as a record field.

When a counted string is the element type, its capacity brackets come first:

```lanternfly
var names as string[24][8]
```

This is eight `string[24]` values. Each short string occupies 26 bytes, so the
array occupies 208 bytes before any surrounding record fields.

Multidimensional arrays use row-major order. The rightmost dimension is
contiguous. In `u8[12, 20]`, element `[row, column]` is at element number
`row * 20 + column`. In `u8[1 to 12, 1 to 20]`, it is
`(row - 1) * 20 + (column - 1)`.

One bracket operation supplies one index for every dimension:

```lanternfly
board[row, column]       // valid
```

`board[row]`, `board[row][column]` and an extra index are invalid. Indexing
selects an element rather than a partial row.

## Aggregate initializers

An array initializer must match the declared rank, shape and element count
exactly. A record initializer names every field exactly once:

```lanternfly
const movementCost as u8[4] = [1, 1, 2, 255]
var position as Position = Position(y = 4, x = 2)
```

Record fields may appear in any written initializer order, while record
storage retains declaration order. Array positions follow ascending ordinal
order in each dimension. The first value maps to the lower bound, and the
rightmost dimension changes fastest. Enum-indexed initializers therefore
follow member declaration order.

Initializer expressions evaluate in written order. In a constant aggregate,
every nested value must itself be a constant initializer.

Startup initialization traverses record fields in declaration order and array
elements in row-major order. The same order appears in the startup-effect
artifact.

## Bounds checking

A constant out-of-range index is a compile error. Every dynamic index must
belong to a compatible ordinal family and is checked unless its type already
proves it lies in the dimension's domain. Failure causes `F-BOUNDS` before a
load or store.

Index evaluation and checking are interleaved from left to right. A failed
first index prevents evaluation of later indices and path segments.

## Storage paths

A path begins with declared storage. Dots select fields and brackets select
array elements:

```lanternfly
player.position.x
actors[selectedActor].active
animations[animationIndex].frames[frameIndex]
board[row, column]
```

Paths can appear as values or assignment destinations.

## Aggregate assignment

Records and arrays are assignable when their types match:

```lanternfly
actors[0] = actors[1]
destination = source
```

An ordinary aggregate copy has snapshot semantics: it behaves as though the
complete source were read before any destination byte changed. This rule gives
overlapping regions defined behaviour.

A volatile aggregate copy requires the compiler to prove that source and
destination do not overlap. It then visits record fields in declaration order
and array elements in row-major order, reading and writing each scalar before
advancing.

Volatility follows field and index paths into a volatile aggregate. Every read
and write through such a path remains an observable storage access.

Assignment is rejected for different record types, different array element
types, ranks or dimensions, and immutable destinations.

## Persistent identity

Paths and indices let a program retain identity without storing an address:

```lanternfly
var selectedActor as u8 = 0

actors[selectedActor].active = true
```

Use multidimensional arrays for regular structures. For an irregular choice
among separately declared objects, retain an integer or enum selector and
dispatch with `select`. A backend may lower that selection to an address table
without exposing addresses in the source language.
