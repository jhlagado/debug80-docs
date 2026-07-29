---
layout: default
title: "Records and Exact Layout"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 7
---

# Records and Exact Layout

An x coordinate and a y coordinate describe one position. A record keeps those
fields together and gives the pair a type:

```lanternfly
record Point
    var x as i8
    var y as i8
end

var position as Point

position.x = 12
position.y = -3
```

`Point` occupies two bytes. `x` is the first byte and `y` is the second.

## Record declarations

```lanternfly
record Point
    var x as i8
    var y as i8
end
```

`record` introduces a Pascal-cased type name. Each field uses the familiar
`var name as Type` form. A record declaration describes layout; storage appears
when another declaration uses the type.

```lanternfly
var position as Point
```

A dot selects a field:

```lanternfly
position.x
position.y
```

The compiler turns each field name into a byte offset while the source retains
the coordinate names.

## Exact field layout

Fields appear in declaration order. Lanternfly inserts no implicit padding:

```lanternfly
record Monster
    var x as u8
    var y as u8
    var direction as u8
    var state as u8
    var timer as u8
    var frame as u8
end
```

`Monster` occupies six bytes. Its field offsets run from zero through five:

```lanternfly
const monsterBytes as u8 = size(Monster)
const timerOffset as u8 = offset(Monster.timer)
```

`monsterBytes` is six and `timerOffset` is four. Exact layout allows a record
to match a firmware table, file representation or existing game-state map.

## Arrays of records

```lanternfly
var monsters as Monster[4]
```

The array occupies 24 bytes. A field path can select an entry and then one of
its fields:

```lanternfly
monsters[index].timer = u8(monsters[index].timer + 1)
```

The backend calculates `index * 6`, adds the timer offset and accesses one
byte. A six-byte stride remains six on every target.

## Nested records and arrays

A record can contain another record or a fixed array:

```lanternfly
record Mover
    var position as Point
    var previous as Point[4]
    var savedCount as u8
end

var player as Mover
```

Paths retain a type at every step:

```lanternfly
player.previous[index].x = player.position.x
```

`player.previous` has type `Point[4]`. Indexing selects one `Point` and `.x`
selects its `i8` field.

A by-value containment cycle has no finite size, so the compiler rejects direct
or mutual record cycles. References in Chapter 8 can connect separately
allocated records.

## Record initializers

A record initializer names every field:

```lanternfly
const origin as Point = Point(x = 0, y = 0)
```

Each field appears exactly once. The written order controls initializer
evaluation while the declaration order controls storage.

## Aggregate assignment

Records and arrays with identical types can be assigned:

```lanternfly
savedPosition = player.position
actors[0] = actors[1]
```

The complete fixed-size value is copied. Copying has snapshot semantics, so an
overlapping source and destination behave as though the source value was read
first. The backend may inline a small copy, emit a loop or call a runtime
helper. Generated listings and cost reports expose that choice.

Aggregate locals do not allocate record or array storage on the stack. Chapter
8 introduces a local alias for working with an existing aggregate.

## Example

The [chapter listing](/lanternfly-book/book1/code/07-records.txt) declares
points, monsters and a mover with a position history.

## Summary

- `record` declares a Pascal-cased type with named fields.
- Fields keep declaration order and exact size.
- `size` and `offset` expose compile-time layout.
- Arrays of records use the record's true byte stride.
- Assignment copies equal fixed-size records or arrays.
