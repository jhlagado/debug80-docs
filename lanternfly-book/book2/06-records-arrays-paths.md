---
layout: default
title: "Records, Arrays, Paths and Aliases"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 6
---

# Records, Arrays, Paths and Aliases

Records and fixed arrays give aggregate data an exact, static shape.
Lanternfly identifies objects within that shape through storage paths and
integer selectors, without introducing source-level pointers.

## Records

`record` declares a nominal type:

```lanternfly
record Point
    var x as i16
    var y as i16
end

record Actor
    var position as Point
    var image as u8
    var active as boolean
end
```

The written declaration determines the exact layout:

- fields appear in declaration order;
- no implicit padding is inserted;
- nested records are stored inline;
- offsets and total size are compile-time facts;
- direct and mutual by-value containment cycles are invalid;
- exporting a record exports its complete field layout.

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
```

Each extent is a positive compile-time constant. Arrays use zero-based
indices, contiguous inline storage and true element sizes. They may contain
scalars or records and may appear as record fields.

Multidimensional arrays use row-major order. The rightmost dimension is
contiguous. In `u8[12, 20]`, element `[row, column]` is at element number
`row * 20 + column`.

One bracket operation supplies one index for every dimension:

```lanternfly
board[row, column]       // valid
```

`board[row]`, `board[row][column]` and an extra index are invalid. Indexing
selects an element rather than a partial row.

## Bounds checking

A constant out-of-range index is a compile error. Every dynamic index is
checked unless the compiler proves it lies in range. Failure causes
`F-BOUNDS` before a load or store.

Index evaluation and checking are interleaved from left to right. A failed
first index prevents evaluation of later indices and path segments.

## Storage paths

A path begins with declared storage or a temporary name supplied by a
parameter, local alias or `for each` binding. Dots select fields and brackets
select array elements:

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

Assignment is rejected for different record types, different array element
types, ranks or dimensions, and immutable destinations.

## Persistent identity

Paths and indices let a program retain identity without storing an address:

```lanternfly
var selectedActor as u8 = 0

actors[selectedActor].active = true
```

Use multidimensional arrays for regular structures. For an irregular choice
among separately declared objects, retain an integer selector and dispatch
with `select`. A backend may lower that selection to an address table without
exposing addresses in the source language.

## Local aggregate aliases

Within a routine, `alias` gives an existing record or array a shorter name:

```lanternfly
sub updateSelected()
    alias actor as Actor = actors[selectedActor]

    actor.position.x = actor.position.x + 1
end
```

The initializer must be a writable storage path with the exact aggregate
type. The compiler evaluates and checks the base and indices once; the alias
then denotes the same storage until the routine returns.

A bare alias copies its referent in aggregate assignment:

```lanternfly
destination = actor
actor = source
```

The alias cannot be rebound, stored, returned, compared or converted. Scalar,
constant and volatile targets are invalid.

## Aggregate storage classes

Static roots have a target storage class. Aggregate parameters may constrain
the storage that can bind to them:

```lanternfly
export sub drawMap(far map as TileMap)
    drawRow(map.rows[0])
end
```

A near path may bind to a far parameter when the profile can attach the
current mapping context. Far storage cannot bind to a near parameter.
Exported aggregate parameters must state `near` or `far`; private
unqualified parameters use the profile default.

Aggregate storage class and element type are independent:

```lanternfly
export sub showLabels(far labels as near cstring[8])
end
```

Here the array occupies far storage while each element is a near C-string
view.
