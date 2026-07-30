---
layout: default
title: "Sharing Storage with References"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 8
---

# Sharing Storage with References

Aggregate assignment creates an independent copy. A reference identifies
storage that already exists, so several parts of a program can work with the
same record:

```lanternfly
var readings as Reading[4]
var current as near ref Reading = ref readings[0]

sub selectThirdReading()
    current = ref readings[2]
    current.quality = 1
end
```

The first assignment rebinds `current` to another array entry. The second
assignment follows the reference and changes `readings[2].quality`.

First-edition references are non-null and must be initialized. They identify
storage whose lifetime is established by the static storage model.

## Forming a typed reference

Prefix `ref` takes the location of a writable storage path:

```lanternfly
ref readings[index]
ref dailyLog.date
ref inputBuffer
```

The resulting type includes the referent. `ref readings[index]` is a
`ref Reading`, while `ref dailyLog.date.month` is a `ref u8`. That type tells
the compiler which field and index operations are valid at the stored address.

On an ordinary Z80 address space, a near reference commonly occupies two
bytes. Passing or assigning the reference moves those address bytes while the
underlying record remains in place.

References can be formed from module or imported storage, aggregate parameters
and storage already reached through another reference. The first edition
excludes references to owned scalar locals, constant storage and volatile
storage because their lifetime or access contract requires rules that the
reference type does not yet carry.

## Access through a reference

Field and index syntax passes through a reference:

```lanternfly
current.value = current.value + 1
current.quality = 0
```

Because `current` refers to a `Reading`, the compiler applies the field layout
from Chapter 7 at the address stored in `current`.

A reference to an array supports indexing:

```lanternfly
selectedBuffer[index] = 0
```

If `selectedBuffer` is a `near ref (u8[16])`, the index selects a byte in the
referenced array and receives the usual bounds check.

## Rebinding and changing the referent

Assignment to a reference variable changes the address it holds:

```lanternfly
current = ref readings[nextIndex]
```

`value(...)` selects the complete object at the address:

```lanternfly
value(countReference) = value(countReference) + 1
value(current) = readings[nextIndex]
```

The first line updates a referenced scalar. The second copies a complete
`Reading` into the storage identified by `current`.

The two spellings keep address changes separate from record changes. Assigning
`current` changes which record it identifies; assigning `value(current)`
changes the identified record.

## Local aggregate aliases

A local alias gives an existing array or record a short, non-rebindable name:

```lanternfly
sub markSelected()
    ref reading as Reading = readings[selectedIndex]

    reading.quality = 1
    reading.unit = unitCelsius
end
```

The index is evaluated once when the alias is declared. `reading` then names
the selected array entry for the rest of the subroutine. The record stays in
the global array, so the routine needs only reference-sized local state.

The alias form accepts records and fixed arrays. An ordinary reference
variable is the appropriate form when code must rebind the name.

## Arrays of references

A program may allocate several buffers separately and collect their locations
in one table:

```lanternfly
var inputBuffer as u8[16]
var outputBuffer as u8[16]
var scratchBuffer as u8[16]

var buffers as (near ref (u8[16]))[3] = [
    ref inputBuffer,
    ref outputBuffer,
    ref scratchBuffer
]
```

Each table entry is a near reference to a complete 16-byte array. The buffers
retain separate storage, while an integer index selects one of their addresses.

![Three reference slots point to three independently allocated buffers.](../../assets/images/lanternfly-book/book1/array-of-references.svg)

```lanternfly
value(buffers[bufferIndex]) = emptyBuffer
```

The indexed expression produces a reference, and `value(...)` selects the
array it identifies. Aggregate assignment then copies `emptyBuffer` into that
selected storage.

## Near and far references

A near reference reaches storage in the target's current address context:

```lanternfly
var current as near ref Reading = ref readings[0]
```

A far reference retains additional target context:

```lanternfly
var archived as far ref Reading = ref readings[0]
```

On a banked Z80 system, the extra context may be a bank number alongside a
16-bit offset. An 8086 backend might use a segment and offset. A flat-memory
target may represent near and far references identically while preserving
their source types.

![A near reference uses the current memory context, while a far reference can retain a bank identifier.](../../assets/images/lanternfly-book/book1/banked-references.svg)

Module storage, stored reference fields and public interfaces state `near` or
`far` because their representation must remain stable across calls and files.
Private parameters and local reference variables may use unqualified `ref T`
to select the target profile's default class.

A near reference may widen to far when the target can attach its current
context. Far-to-near conversion uses the checked explicit form
`near ref Reading(expression)`. A location outside the near range invokes the
target address-fault service.

## Opaque addresses

Some machine interfaces expose a location whose contents have no Lanternfly
type:

```lanternfly
var deviceBuffer as far address
```

`near address` and `far address` are opaque scalar values. They can be stored,
passed and compared with the same address class. Ordinary arithmetic, field
access and indexing are unavailable because the language has no referent type
from which to derive them.

A target service may return an address in video memory or another device
address space. The program can carry that value back to target services while
the platform contract remains responsible for interpreting it.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt)
rebinds a `Reading` reference, creates a local alias and clears one of three
separately allocated buffers. The assignment to `current` changes an address,
while the assignment through `reading` changes a field in the referenced
record.

## Chapter summary

- A typed reference is a non-null scalar value that identifies existing
  storage of a declared type.
- Assigning a reference rebinds it; `value(reference)` selects the complete
  referent.
- A local aggregate alias gives existing record or array storage a
  non-rebindable short name.
- Arrays of references provide indexed access to separately allocated objects.
- Near and far references carry target address-class information, while opaque
  addresses carry no referent type.
