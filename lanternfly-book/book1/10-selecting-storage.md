---
layout: default
title: "Selecting Existing Storage"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 10
---

# Selecting Existing Storage

Aggregate assignment creates an independent copy. Often a program needs the
opposite: several parts working with the same storage, chosen at run time.
Lanternfly answers with data rather than with pointers. The program stores
an integer index that records *which* entry, and a routine gives the
selected storage a temporary name — an alias — while it works:

```lanternfly
var readings as Reading[4]
var selectedReading as u8 = 0

sub markSelected()
    alias reading as Reading = readings[selectedReading]

    reading.quality = 1
end
```

`selectedReading` holds "the current reading" as plain data. Changing
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
must keep a relationship between entries stores the destination index:

```lanternfly
var previousReading as u8 = 0

sub advanceSelection()
    previousReading = selectedReading
    selectedReading = nextCandidate
end
```

Both variables survive as long as their storage, and each use of
`readings[previousReading]` is bounds-checked, so an index outside the
array's domain is rejected at the access rather than silently misread. A
raw machine address would carry no such relationship: nothing could
range-check it, and nothing would connect it to the pool it came from.

Bounds checking establishes *spatial* validity, and only that. An index
that stays in range still identifies whatever the slot holds now — if the
program has since reused entry 2 for a different measurement, a saved index
of 2 faithfully selects the new occupant. Whether a slot still represents
the same logical entity is the program's bookkeeping, carried in data such
as Chapter 8's `used` count; the check guards the boundary, not the
meaning.

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

An alias is the right choice when a routine touches the same aggregate
several times or passes it onward. A path used once is best written as the
path.

The alias form accepts records, fixed arrays and strings — an alias of a
`string[12]` element gives a table entry a short name for a run of appends.
Constant storage cannot initialize a writable alias, and volatile storage
requires direct access so that every read and write remains visible.

Aliases also complete Chapter 5's loop rule. A counted loop's body must not
assign to the control variable through *any* name — not directly, not
through an alias, and not inside a routine the body calls. The loop owns
its own progress under every spelling.

## Regular shapes: one table instead of many

Where another language would collect separate buffers behind a table of
pointers, we declare one multidimensional array:

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

When the candidates are genuinely separate declarations, we store a
selector and match it with `select`. This routine assumes two entry tables
and a `countEntries` routine declared earlier in the module:

```lanternfly
enum ActiveLog as u8
    inputLog
    archiveLog
end

var activeLog as ActiveLog = inputLog

sub countActiveEntries() as u8
    select activeLog
    case inputLog
        return countEntries(inputEntries)
    case archiveLog
        return countEntries(archiveEntries)
    end
end
```

The selector is data, like any index, and an enumeration is its natural
type: an enumeration selector cannot hold an invalid choice, and its
`select` is complete when every member has a case. The backend may lower a
dense selection to an address table; that choice belongs to lowering, and
the source semantics remain a selector and declared storage.

## Example

The [chapter listing](/lanternfly-book/book1/code/10-selecting-storage.txt)
selects a reading by index, adjusts it through an alias and clears one row
of a buffer table. The assignment to `selectedReading` changes which entry
later code operates on; the assignments through `reading` change the entry
itself.

## Chapter summary

- Persistent identity is data: a declared path, an integer index or a
  stored selector, each checked at the point of use.
- Bounds checks establish spatial validity; whether a slot still holds the
  same logical entity is the program's own bookkeeping.
- `alias` gives existing record, array or string storage a non-rebindable
  local name, evaluated once and valid until the routine returns.
- A loop's control variable is off limits under every name — direct, alias
  or callee.
- Multidimensional arrays replace regular pointer tables; an enumeration
  selector with `select` replaces irregular ones.

One module now holds everything we can build: types, storage, routines and
a disciplined idea of identity. In the next chapter, programs grow past one
file — and the reading order we have kept since Chapter 1 stretches across
module boundaries.
