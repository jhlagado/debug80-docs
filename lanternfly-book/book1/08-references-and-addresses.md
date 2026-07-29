---
layout: default
title: "References and Addresses"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 8
---

# References and Addresses

Chapter 7's aggregate assignment copies bytes into an independent value.
Changing that copy does not update the original array entry. A reference
instead identifies existing storage. It carries both a location and a
referent type: in this example, a `Monster` at that address.

```lanternfly
var monsters as Monster[4]
var current as near ref Monster = ref monsters[0]

sub selectThirdMonster()
    current = ref monsters[2]
    current.timer = 10
end
```

Rebinding `current` selects another array entry; assigning through
`current.timer` changes that entry inside `monsters`. Later accesses through
`current` use the newly selected entry.

A first-edition Lanternfly reference must be initialized, has no null value
and can only identify storage whose lifetime is preserved by the static
storage model. Rebinding may change which compatible object it identifies,
but it never produces an untyped or absent referent.

## Forming a reference

Prefix `ref` takes the location of a storage path:

```lanternfly
ref monsters[index]
ref player.position
ref board[row]
```

The path must reach mutable, nonvolatile storage with a lifetime outside the
current scalar-local frame: module or imported storage, an aggregate
parameter, or storage already reached through a reference. Constant storage,
volatile storage and owned scalar locals cannot be reference roots in the
working language. The result carries its referent type:
`ref monsters[index]` has type
`ref Monster`, and `ref player.position.x` has type `ref i8`. The
type is what separates a reference from a bare address. An address
says only "location 31,844"; a `ref Monster` says "a six-byte
monster laid out as Chapter 7 declared, starting there". The
compiler uses that referent type to validate field and index access.

On the stated Z80 model, a near reference occupies two bytes. It can be
stored, passed to a subroutine, returned or compared with a compatible
reference. Moving the reference moves those two bytes and continues to share
the original storage. Chapter 7's aggregate assignment instead copies every
byte of the referent into an independent value.

## Field and index access

Field and index paths pass through a reference:

```lanternfly
current.timer = current.timer + 1
current.x = 4
```

The declared referent type tells the compiler which field layout to use.
`current` is a `ref Monster`, so `.timer` applies Chapter 7's offset of four
to the address held by `current`. Field syntax is the same as direct record
access.

Indexing works through a reference to an array in the same way:

```lanternfly
selectedRow[index] = 0
```

If `selectedRow` has type `near ref (u8[8])`, the expression writes the
selected byte of the referenced array.

One distinction has to be kept straight, and the language gives each
side its own spelling. Assignment to the reference variable rebinds
it — points the arrow somewhere new. An explicit `value` access
reads or writes the complete referent instead — the thing at the
arrow's tip:

```lanternfly
value(scoreReference) = value(scoreReference) + 1
value(current) = monsters[nextMonster]
```

The first line adds one to the score that `scoreReference` points
at — for a scalar referent, `value` is how you reach the thing
itself rather than the reference. The second copies a whole monster
into the storage `current` points at, aggregate assignment through a
reference.

## Local aggregate aliases

Chapter 7 noted that subroutine locals stay scalar. A local alias gives
existing aggregate storage a short name:

```lanternfly
sub resetSelected()
    ref monster as Monster = monsters[selectedIndex]

    monster.timer = 0
    monster.frame = 0
end
```

Without the alias, both statements would spell out
`monsters[selectedIndex]`. The selection is evaluated once. The alias needs
only reference-sized local state and leaves the `Monster` in the global
array; a backend may also reuse the calculated address when lowering the
accesses.

Within this routine, `monster` remains an alias for
`monsters[selectedIndex]`. A reference variable may be rebound; a local
aggregate alias may not.

## Arrays of references

References are scalar values, and scalar values can fill arrays —
which solves a problem layout alone cannot. Several boards of the
same shape can be allocated separately, wherever they each need to
live, and still be collected into one lookup table:

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

Each element is one near reference to an eight-byte array; the board arrays
keep their separate storage. The compound type
`(near ref (u8[8]))[3]` parses from the inside out: an array of eight bytes, a
near reference to that array and three such references.

![Three reference slots point to three independently allocated board arrays.](../../assets/images/lanternfly-book/book1/array-of-references.svg)

```lanternfly
value(boardPlanes[planeIndex]) = clearPlane
```

`boardPlanes[planeIndex]` evaluates to a reference value;
`value(...)` selects the referenced array; aggregate assignment
copies the clear plane into it. The reference array provides indirection: one
integer selects storage from several separately allocated arrays without
copying any of them.

## Near and far references

So far "location" has meant an address in the target's ordinary
memory. On real hardware, ordinary needs qualifying. A near
reference reaches storage in the target's current memory context:

```lanternfly
var current as near ref Monster = ref monsters[0]
```

A far reference retains extra target context:

```lanternfly
var remoteMonster as far ref Monster = ref monsters[0]
```

The Z80 has a 16-bit ordinary address space and therefore reaches one
65,536-byte address context at a time. Banking hardware can change which
physical memory occupies part of that context. A far reference may retain a
bank identifier beside the 16-bit offset; an 8086 backend may use a segment
and offset; a flat-memory target may represent both classes identically.

![On one possible banked Z80 target, a near reference uses the current bank while a far reference carries the bank identifier.](../../assets/images/lanternfly-book/book1/banked-references.svg)

Stored references and public interfaces state `near` or `far`,
because a reference that outlives a moment, or crosses between
modules or a native interface boundary, must have one agreed size and meaning.
An unqualified `ref Monster` is available for local reference
variables and private parameters, where the target's default class
is sufficient and the source stays portable across targets whose
defaults differ.

A near reference widens implicitly to the corresponding far reference only
when the target can attach the current memory context. Converting far to near
requires the checked explicit form `near ref Monster(expression)`; a value
that cannot be represented faults rather than losing its memory context.

## Opaque addresses

One rung remains below the typed reference. Some interfaces need a
location whose record shape belongs to a target service rather than
to your program:

```lanternfly
var entryPoint as far address
```

`near address` and `far address` retain an address class. Assignment and
equality are supported, but arithmetic, field access and indexing are not.
There is no declared referent to give such access meaning; a typed reference
is precisely an address plus that shape, and `address` is the address alone.

Opaque near and far addresses do not convert or compare across classes.
Changing their representation requires a target operation whose contract
defines the source and destination address representations.

A display service may return a VRAM address on a target where video memory is
not in the CPU address space. The program can store, pass and compare that
opaque value, but only a target service can interpret or dereference it.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt)
selects a monster by reference, creates a local alias and clears one of
several referenced board planes. The representative assignments show both
operations: `current = ref monsters[selectedIndex]` rebinds, while
`monster.timer = 0` and
`value(boardPlanes[planeIndex]) = clearPlane` write referent storage.
