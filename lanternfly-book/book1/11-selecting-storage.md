---
layout: default
title: "Selecting Existing Storage"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 11
---

# Selecting Existing Storage

Aggregate assignment creates an independent copy. Often a program needs the
opposite: several parts working with the same storage, chosen at run time.
Lanternfly represents that choice as data rather than as pointers. The program stores
an integer index that records _which_ entry, and a routine gives the
selected storage a temporary name — an alias — valid until the routine
returns:

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
dereference operator. Persistent identity is represented by declared
paths and integer indices.

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

Bounds checking establishes _spatial_ validity, and only that. An index
that stays in range still identifies whatever the slot holds now — if the
program has since reused entry 2 for a different measurement, a saved index
of 2 selects whatever entry 2 now holds. Whether a slot still represents
the same logical entity is recorded in the program's own data, such
as Chapter 9's `used` count; the check guards the boundary, not the
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
is a name, not a value. The compiler may carry an address underneath, but
that carrier has no source spelling, so no program can misuse it.

An alias suits a routine that touches the same aggregate several times
or passes it onward; a path used once is written as the path.

The alias form accepts records, fixed arrays and strings — an alias of a
`string[12]` element gives a table entry a short name for a run of appends.
Constant storage cannot initialize a writable alias, and volatile storage
requires direct access so that every read and write remains visible.

Aliases also complete Chapter 6's loop rule. A counted loop's body must not
assign to the control variable through _any_ name — not directly, not
through an alias, and not inside a routine the body calls. The loop, not
the body, advances it — under every spelling.

## Regular shapes: one table instead of many

A program that needs several buffers of one shape declares one
multidimensional array:

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

The first index selects the buffer and the second selects the byte,
using the row-major arithmetic from Chapter 7, and both are checked
against declared extents.

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

The selector is data, like any index, and an enumeration suits it: an
enumeration selector cannot hold an invalid choice, and its
`select` is complete when every member has a case. The compiler may lower
a dense selection to an address table; the source semantics remain a
selector and declared storage.

## Complete program

The complete module selects a reading by index, adjusts it through an alias,
clears one row of a buffer table and dispatches on an enumeration selector. The
assignment to `selectedReading` changes which entry later code operates
on; the assignments through `reading` change the entry itself; and
`countActiveEntries` returns 3 because `activeLog` selects the input
log.

<<< @/public/lanternfly-book/book1/code/11-selecting-storage.txt{lanternfly}

The source is also available as
[11-selecting-storage.txt](/lanternfly-book/book1/code/11-selecting-storage.txt).

## Exercises

1. A saved index of 2 outlives a reshuffle of the `readings` array. What
   does the bounds check still guarantee, and what does it not?

Answer: the check guarantees that the index selects an existing entry.
It cannot guarantee that the entry still represents the same logical
measurement.

## Chapter summary

- Persistent identity is data: a declared path, an integer index or a
  stored selector, each checked at the point of use.
- Bounds checks establish spatial validity; whether a slot still holds
  the same logical entity is recorded in the program's own data.
- `alias` gives existing record, array or string storage a non-rebindable
  local name, evaluated once and valid until the routine returns.
- A loop's control variable is off limits under every name — direct, alias
  or callee.
- Multidimensional arrays replace regular pointer tables; an enumeration
  selector with `select` replaces irregular ones.
