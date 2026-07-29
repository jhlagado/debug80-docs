---
layout: default
title: "Records and Exact Layout"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 7
---

# Records and Exact Layout

> [!IMPORTANT]
> This chapter uses the pre-0.3 draft syntax. See the
> [book revision notice](index.md).

An x coordinate and a y coordinate describe one point. Two parallel arrays
leave that relationship implicit. A record gives the pair one type:

```text
TYPE Point
    X AS SBYTE
    Y AS SBYTE
END TYPE

DIM Position AS Point

Position.X = 12
Position.Y = -3
```

`Point` occupies two bytes. `X` is the first byte and `Y` is the second.

## Fields name the parts

```text
TYPE Point
    X AS SBYTE
    Y AS SBYTE
END TYPE
```

`TYPE` begins a record declaration. Each field has a name and a type. `END
TYPE` closes the declaration.

A dot selects a field:

```text
Position.X
Position.Y
```

The field name carries the meaning that an offset such as “byte 1” would lose.
The compiler still calculates the offset for the backend.

## Records have exact sizes

Lanternfly places fields in declaration order with their exact sizes. The
record contains exactly the bytes declared by its fields.

```text
TYPE Monster
    X AS BYTE
    Y AS BYTE
    Direction AS BYTE
    State AS BYTE
    Timer AS BYTE
    Frame AS BYTE
END TYPE
```

`Monster` occupies six bytes. Its field offsets are 0 through 5:

```text
SIZEOF(Monster) = 6
OFFSET(Monster, Timer) = 4
```

Exact layout lets a record match a file format, firmware table or packed game
state. A native adapter handles any target-specific alignment rule while the
Lanternfly record remains six bytes.

## Arrays of records

```text
DIM Monsters[4] AS Monster
```

The array occupies 24 bytes. Selecting an entry uses the true six-byte stride:

```text
Monsters[Index].Timer = BYTE(Monsters[Index].Timer + 1)
```

The backend calculates `Index * 6`, adds the `Timer` field offset and performs
the byte access. That multiplication is generated work, not a reason to round
the record up to eight bytes.

## Records can contain arrays

A record may keep a small history beside its current position:

```text
TYPE Mover
    Position AS Point
    Previous AS Point[4]
    Count AS BYTE
END TYPE

DIM Player AS Mover
DIM SavedPosition AS Point
```

Paths can contain several field and index steps:

```text
Player.Previous[Index].X = Player.Position.X
```

Each step retains its type. `Player.Previous` is an array of `Point`, selecting
an entry produces one `Point` and `.X` produces an `SBYTE` storage location.

## Assignment follows value shape

Scalar fields can be assigned directly. Aggregate records and arrays are
copied only by explicit operations:

```text
CLEAR(Player.Previous)
COPY(SavedPosition, Player.Position)
```

`CLEAR` writes the all-zero representation where the type permits it. `COPY`
requires source and destination with the same exact size and non-overlapping
storage. `MOVE` covers overlapping regions.

These names expose a potentially large memory operation at the call site.

## Example

The [chapter listing](/lanternfly-book/book1/code/07-records.txt) declares
points, monsters and a record containing an array.

## Summary

- `TYPE` and `END TYPE` declare a record.
- A dot selects a named field.
- Field order and size determine a layout made only from declared fields.
- Arrays of records use the true record size as their stride.
- Aggregate copying uses explicit operations such as `COPY` and `MOVE`.
