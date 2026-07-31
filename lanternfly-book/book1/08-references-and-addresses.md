---
layout: default
title: "Selecting Storage with Indices and Aliases"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 8
---

# Selecting Storage with Indices and Aliases

Aggregate assignment creates an independent copy. Often a program needs the
opposite: several parts working with the same storage, chosen at run time.
Lanternfly answers with data rather than with pointers. The program remembers
*which* entry — an integer index — and gives storage a temporary name — an
alias — while a routine works on it:

```lanternfly
var readings as Reading[4]
var selectedReading as u8 = 0

sub markSelected()
    alias reading as Reading = readings[selectedReading]

    reading.quality = 1
end
```

`selectedReading` is the program's notion of "the current reading". Changing
it selects another entry; the alias inside `markSelected` names whichever
entry is selected when the routine runs.

Lanternfly has no pointer or reference type, no address-of operator and no
dereference operator. Identity lives in declared paths and integer indices.

## Identity as an index

A path with an index already selects storage at run time:

```lanternfly
readings[selectedReading].quality = 1
```

The index is ordinary data. It can be stored in a variable or a record
field, passed to a routine, compared, saved and restored. A program that
must remember a relationship between entries stores the destination index:

```lanternfly
var previousReading as u8 = 0

previousReading = selectedReading
selectedReading = nextCandidate
```

Both variables survive as long as their storage, and each use of
`readings[previousReading]` is bounds-checked, so a stale index is caught at
the access rather than silently misread. An address held this way would be
none of those things: it could not be range-checked, and nothing would
connect it to the pool it came from.

## Local aliases

Repeating a long path obscures the work and repeats its index arithmetic.
`alias` gives the selected aggregate a short local name:

```lanternfly
sub adjustSelected()
    alias reading as Reading = readings[selectedReading]

    reading.value = reading.value + calibrationOffset
    reading.quality = 1
end
```

The path's base and index are evaluated and checked once, when execution
reaches the declaration. From then until the routine returns, `reading`
denotes that array entry. Field access and indexing through the alias follow
the ordinary rules, and aggregate assignment works in both directions:

```lanternfly
archivedReading = reading
reading = defaultReading
```

The first line copies the selected entry out; the second copies a prepared
record into it. The alias itself cannot be rebound, compared or stored — it
is a name, not a value. The backend may carry an address underneath, but
that carrier has no source spelling, so no program can misuse it.

An alias earns its place when a routine touches the same aggregate several
times or passes it onward. A path used once is best written as the path.

The alias form accepts records and fixed arrays. Constant storage cannot
initialize a writable alias, and volatile storage requires direct access so
that every read and write remains visible.

## Regular shapes: one table instead of many

Programs that once collected separate buffers behind a table of pointers
declare one multidimensional array instead:

```lanternfly
const bufferCount as u8 = 3
const bufferSize as u8 = 16

var buffers as u8[bufferCount, bufferSize]

sub clearBuffer(selected as u8)
    var index as u8

    for index = 0 until bufferSize
        buffers[selected, index] = 0
    end
end
```

The first index selects the buffer and the second selects the byte, using
the row-major arithmetic from Chapter 6. The "pointer table" has become two
integers, and both are checked against declared extents.

## Irregular choices: a selector and `select`

When the candidates are genuinely separate declarations, the program stores
a selector and chooses the named object:

```lanternfly
const inputLog as u8 = 0
const archiveLog as u8 = 1

var activeLog as u8 = inputLog

sub countActiveEntries() as u8
    select activeLog
    case inputLog
        return countEntries(inputEntries)
    case archiveLog
        return countEntries(archiveEntries)
    else
        return 0
    end
end
```

The selector is data, like any index, and Chapter 2's enumerations are its
natural type: an enumeration selector cannot hold an invalid choice, and
its `select` is complete when every member has a case. The backend may
lower a dense selection to an address table; that choice belongs to
lowering, and the source semantics remain a selector and declared storage.

## Near and far storage

Every static storage root has a target storage class. Ordinary
compiler-allocated storage is near: directly usable in the target's current
address context. A banked or segmented target also offers far storage,
which carries extra context such as a bank number alongside a 16-bit
offset. A flat-memory target may treat the two classes identically while
preserving their source meaning.

Storage classes matter at interfaces. Chapter 9 shows the spelling on
aggregate parameters, where an exported routine states `near` or `far`
before the parameter's name so that callers in other modules agree about
the storage they hand over.

## Opaque addresses

Some machine interfaces expose a location whose contents have no Lanternfly
type:

```lanternfly
var deviceBuffer as far address
```

`near address` and `far address` are opaque scalar values. They can be
stored, passed and compared within the same address class. Ordinary
arithmetic, field access and indexing are unavailable because the language
has no referent type from which to derive them, and no conversion connects
an opaque address to ordinary storage in either direction.

A target service may return an address in video memory or another device
address space. The program can carry that value back to target services
while the platform contract remains responsible for interpreting it.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt)
selects a reading by index, adjusts it through an alias and clears one row
of a buffer table. The assignment to `selectedReading` changes which entry
later code means; the assignments through `reading` change the entry
itself.

## Chapter summary

- Persistent identity is data: a declared path, an integer index or a
  stored selector, each checked at the point of use.
- `alias` gives existing record or array storage a non-rebindable local
  name, evaluated once and valid until the routine returns.
- Multidimensional arrays replace regular pointer tables; a selector with
  `select` replaces irregular ones.
- Storage classes distinguish near from far static storage; interfaces
  state them explicitly.
- Opaque addresses carry device locations without a referent type, and
  only target services can interpret them.

Aliases gave routines a working name for storage; in the next chapter we
complete the routines themselves, with parameters, results and locals.
