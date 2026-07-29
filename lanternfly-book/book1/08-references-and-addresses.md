---
layout: default
title: "References and Addresses"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 8
---

# References and Addresses

A game often selects one record and keeps working with its original storage.
A reference holds the location and type of that record:

```lanternfly
var monsters as Monster[4]
var current as near ref Monster = ref monsters[0]

sub selectMonster(index as i16)
    current = ref monsters[index]
    current.timer = 10
end
```

Rebinding `current` selects another array entry. Assigning `current.timer`
changes that entry in `monsters`.

## Forming a reference

Prefix `ref` takes the location of a storage path:

```lanternfly
ref monsters[index]
ref player.position
ref board[row]
```

The result carries its referent type. `ref monsters[index]` has type
`ref Monster`; `ref player.position.x` has type `ref i8`.

A reference is a scalar value. It can be stored, passed to a subroutine,
returned or compared with a compatible reference. First-edition references
always identify valid storage.

## Field and index access

Field and index paths pass through a reference:

```lanternfly
current.timer = current.timer + 1
current.x = 4
```

The declared referent type tells the compiler which field layout to use.

An explicit `value` access reads or writes a complete referent. It is necessary
for a scalar reference and useful for aggregate assignment:

```lanternfly
value(scoreReference) = value(scoreReference) + 1
value(current) = monsters[nextMonster]
```

Assignment to the reference variable rebinds it. Assignment to `value(current)`
copies into the selected monster.

## Local aggregate aliases

A local alias gives a short, fixed name to existing aggregate storage:

```lanternfly
sub resetSelected()
    ref monster as Monster = monsters[selectedIndex]

    monster.timer = 0
    monster.frame = 0
end
```

The alias needs only reference-sized local state. It leaves the `Monster` in
the global array and cannot be rebound later in the subroutine.

## Arrays of references

Several boards can be allocated separately and collected into one lookup
array:

```lanternfly
var boardRed as u8[8]
var boardGreen as u8[8]
var boardBlue as u8[8]

var boardPlanes as (near ref (u8[8]))[3] = [
    ref boardRed,
    ref boardGreen,
    ref boardBlue
]
```

Each element is one near reference to an eight-byte array. The board arrays
retain separate storage.

```lanternfly
value(boardPlanes[planeIndex]) = clearPlane
```

`boardPlanes[planeIndex]` evaluates to a reference value. `value(...)` selects
the referenced array and aggregate assignment copies the clear plane into it.

## Near and far references

A near reference reaches storage in the target's current memory context:

```lanternfly
var current as near ref Monster = ref monsters[0]
```

A far reference retains extra target context:

```lanternfly
var remoteMonster as far ref Monster = ref monsters[0]
```

On a banked Z80 target, that context may be a bank identifier beside a 16-bit
offset. An 8086 backend may use a segment and offset. A flat-memory target may
represent both classes identically.

Stored references and public interfaces state `near` or `far`. An unqualified
`ref Monster` is available for local reference variables and private
parameters, where the target's default class is sufficient.

## Opaque addresses

Some interfaces need a location whose record shape belongs to a target
service:

```lanternfly
var entryPoint as far address
```

`near address` and `far address` retain an address class. They support
assignment and equality. A typed reference adds the referent shape needed for
ordinary field and array access.

Device addresses can remain opaque even when their numeric offset fits in 16
bits. A display service can accept a VRAM address while ordinary CPU indexing
remains unavailable for that address space.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt) selects a
monster by reference, creates a local alias and clears one of several referenced
board planes.

## Summary

- `ref` forms a typed reference to existing storage.
- Field and index paths pass through aggregate references.
- `value(reference)` accesses the complete referent.
- A local `ref name as Type` declaration aliases existing aggregate storage.
- `near`, `far` and opaque addresses describe target reachability.
