---
layout: default
title: "References and Addresses"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 8
---

# References and Addresses

A routine may need to work with one monster selected while the program runs.
Copying the whole record would create a second monster. A reference keeps the
location and type of the selected record:

```text
DIM Monsters[4] AS Monster
DIM Current AS NEAR REF TO Monster = REF Monsters[0]

SUB SelectMonster(Index AS INTEGER)
    Current = REF Monsters[Index]
END SUB
```

`Current` refers to existing storage. Assigning through one of its fields
changes the selected array entry:

```text
Current.Timer = 10
```

## Forming a reference

`REF` takes the location of an object or subobject:

```text
REF Monsters[Index]
REF Player.Position
REF Board[Row]
```

The resulting value carries the selected type. `REF Monsters[Index]` is a
reference to `Monster`; `REF Player.Position.X` is a reference to `SBYTE`.

A reference locates storage that already exists. It is a scalar value, so it
can be stored, passed to a routine or compared with a compatible reference.

## Access keeps the ordinary path syntax

The referent type controls fields and indexes:

```text
Current.Timer = BYTE(Current.Timer + 1)
Current.X = 4
```

The same dot and bracket syntax continues through a reference while preserving
the path's type.

References support field selection, array indexing and compatible equality.
Those operations express their permitted address calculations.

## Aliases shorten a selected path

A local alias binds a name to one existing object for the rest of its block:

```text
FOR PlaneIndex = 0 TO 3
    ALIAS Plane = BoardPlanes[PlaneIndex]
    CLEAR(Plane)
NEXT PlaneIndex
```

`Plane` is an address-sized binding to the existing array. The binding is
fixed, while mutable entries can still be changed through it. A backend may
retain the selected address in one scalar temporary.

Aliases are useful when a path would otherwise be repeated inside a loop.
References are useful when a location must be stored, passed or selected again.

## Near and far reach

A near reference can reach its object in the target's current memory context:

```text
DIM Current AS NEAR REF TO Monster
```

A far reference can retain the extra context needed to reach another bank,
segment or address region:

```text
DIM RemoteMonster AS FAR REF TO Monster
```

The representation belongs to the target. One Z80 platform may store a bank
identifier beside a 16-bit offset. An 8086 backend may store a segment and
offset. A flat-memory target may represent near and far references identically.

The `NEAR` and `FAR` words describe reachability rather than a fixed number of
bits.

## Addresses carry a location class

An interface sometimes needs a location before its record or array type is
known:

```text
DIM EntryPoint AS FAR ADDRESS
```

`NEAR ADDRESS` and `FAR ADDRESS` retain an address class. They support
compatible equality and interface operations. A typed reference adds the
referent shape needed for ordinary field access and array indexing.

Device spaces can define their own nominal addresses:

```text
ADDRESS SPACE VRAM USING WORD
```

A `VRAM ADDRESS` value belongs to that device space. A compatible service can
accept it, while ordinary CPU loads and stores remain governed by the target's
address-space contract.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt) selects a
record by reference and uses a local alias for an array plane.

## Summary

- `REF` forms a typed reference to existing storage.
- Field and index paths continue through references.
- A local `ALIAS` binds a shorter name to selected storage.
- `NEAR` and `FAR` describe target-dependent reachability.
- An address carries a location class while a reference also carries shape.
