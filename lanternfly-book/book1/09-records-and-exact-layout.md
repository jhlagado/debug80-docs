---
layout: default
title: "Records and Memory Layout"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 9
---

# Records and Memory Layout

A calendar date consists of a year, a month and a day. Three separate
variables can store those values, but their types do not say that the values
form one date. A record declares that relationship:

```lanternfly
record Date
    year as u16
    month as u8
    day as u8
end

var reportDate as Date

sub setReportDate()
    reportDate.year = 2026
    reportDate.month = 7
    reportDate.day = 30
end
```

`Date` is one type with three named fields. `reportDate` is one stored value of
that type. The dot selects a field, so each assignment changes one part of the
date while the field's declared type still controls the value.

## A type and its stored instances

The record declaration defines a shape:

```lanternfly
record Date
    year as u16
    month as u8
    day as u8
end
```

It allocates no instance by itself. Storage is reserved by a variable,
constant, array element or field whose type is `Date`:

```lanternfly
var reportDate as Date
var savedDate as Date
```

These declarations reserve two independent dates. Changing `reportDate.day`
does not change `savedDate.day`.

Fields use the familiar `name as Type` form without `var`. Their declarations
belong to the record type rather than the surrounding value scope. Two record
types may both have a field named `day` because a field is selected through a
path such as `reportDate.day`.

The compiler checks every segment of that path. `reportDate.month` has type
`u8`, while `reportDate.year` has type `u16`. A misspelled field or a field from
another record type is a compile error.

## Exact field layout

Fields occupy memory in declaration order with no implicit padding. `Date` has
this exact layout:

| Field | Type | Offset | Size |
| ----- | ---- | -----: | ---: |
| `year` | `u16` | 0 | 2 bytes |
| `month` | `u8` | 2 | 1 byte |
| `day` | `u8` | 3 | 1 byte |

The complete record occupies four bytes. On a Z80 target, the two bytes of
`year` use little-endian order, with the low byte first. A target with another
integer byte order may store the two bytes differently, but `month` still
begins at offset 2, `day` at offset 3 and the complete `Date` still occupies
four bytes.

![On Z80, a Date record occupies four bytes in declaration order, with month at offset two.](../../assets/images/lanternfly-book/book1/date-layout.svg)

Both measurements are available as compile-time constant expressions.
`size(type Date)` gives the number of bytes occupied by one `Date` value.
`offset(Date.month)` gives the number of bytes from the start of a `Date` to
the first byte of its `month` field:

```lanternfly
const dateBytes as u8 = size(type Date)
const monthOffset as u8 = offset(Date.month)
```

`dateBytes` is 4 because the fields occupy 2 + 1 + 1 bytes. `monthOffset` is 2
because `year` occupies bytes 0 and 1, so `month` begins at byte 2. The compiler
calculates both constants. The running program needs no field names or lookup
table.

Field order, offsets and total size are the same on every target. The byte order
inside a multi-byte integer can still vary by target. A record can match a
packet header, firmware block or file record only when its field types and the
target's integer byte order match that external format.
No hidden alignment bytes alter the written sequence.

## Initializing a complete record

An initializer is the value written after `=` in a declaration. It gives the
declared name its first value. Here the initializer constructs one `Date` by
naming the initial value of every field:

```lanternfly
const releaseDate as Date = Date(
    year = 2026,
    month = 7,
    day = 30
)
```

`Date(...)` is record-initializer syntax, not a routine call. `Date` names the
record type, and `year = 2026`, `month = 7` and `day = 30` are field entries.
No subroutine named `Date` is called.

Each field appears exactly once. The initializer may list the fields in another
order, but the record declaration still controls their storage order. Missing,
duplicate and unknown fields are compile errors.

The field names make the three integer literals unambiguous. The value 7 enters
`month`, and 30 enters `day`, regardless of the order used in the initializer.

## Copying a record

Assignment between values of the same record type copies every field:

```lanternfly
savedDate = reportDate
```

Suppose `reportDate` contains 2026, 7 and 30. After the assignment, both
variables contain that date. A later statement changes only the source:

```lanternfly
reportDate.day = 31
```

`reportDate` now contains July 31, while `savedDate` remains July 30. Record
assignment copies a value; it does not make the two names refer to shared
storage.

The same snapshot rule applies when source and destination overlap inside a
larger aggregate. The complete source value is read before any destination
byte changes.

## Arrays of records

A sensor reading needs a signed value, a unit code and a quality code:

```lanternfly
record Reading
    value as i16
    unit as u8
    quality as u8
end

var readings as Reading[4]
```

The field layout makes every `Reading` four bytes:

| Field | Offset | Size |
| ----- | -----: | ---: |
| `value` | 0 | 2 bytes |
| `unit` | 2 | 1 byte |
| `quality` | 3 | 1 byte |

The array contains four records and occupies 16 bytes. Indexing selects one
record; the following dot selects a field inside it:

```lanternfly
readings[index].quality = 1
```

Chapter 7's array calculation and the field offset combine:

```text
record byte offset = index * size(type Reading) + offset(Reading.quality)
```

For `readings[2].quality`, the calculation is `2 * 4 + 3`, giving byte offset
11 from the array base.

![Each Reading begins four bytes after the previous one; readings[2].quality is byte offset 11.](../../assets/images/lanternfly-book/book1/record-array-stride.svg)

An array of records keeps the value, unit and quality of one reading adjacent.
That layout suits code that usually processes a complete reading. Three
parallel arrays would keep all values together, all units together and all
quality codes together, which may suit code that scans only one field. The
access pattern determines which declaration is more useful.

## Records containing records and arrays

A daily log can contain its date, four readings and the number currently used:

```lanternfly
record DailyLog
    date as Date
    entries as Reading[4]
    used as u8
end

var dailyLog as DailyLog
```

Every nested value is stored inline:

| Field | Offset | Size |
| ----- | -----: | ---: |
| `date` | 0 | 4 bytes |
| `entries` | 4 | 16 bytes |
| `used` | 20 | 1 byte |

`DailyLog` occupies 21 bytes. The expression below selects one element of its
`entries` array and then selects that reading's `quality` field:

```lanternfly
dailyLog.entries[index].quality = 1
```

For index 2, the complete offset is:

| Path step | Added bytes | Running offset |
| --------- | ----------: | -------------: |
| `dailyLog.entries` | 4 | 4 |
| `[2]` with four-byte stride | 8 | 12 |
| `.quality` | 3 | 15 |

For index 2, `entries` begins at byte 4. Each `Reading` occupies four bytes, so
element 2 begins another eight bytes later, at byte 12. Its `quality` field is
three bytes into the record. The final assignment writes byte 15 of `dailyLog`.

The declarations make every selection unambiguous: `entries` has type
`Reading[4]`, selecting one element produces a `Reading`, and `Reading` contains
a `quality` field of type `u8`.

A record cannot contain itself as a field. This declaration is invalid:

```lanternfly
record Node
    next as Node
end
```

Calculating the size of `Node` requires the size of its `next` field. That field
is another complete `Node`, containing another `next` field, with no final
copy. The same problem occurs when two record types contain each other. A fixed
pool represents links between entries with array indices; Chapter 11 develops
that pattern.

## String fields

A fixed-capacity string has the exact size calculated in Chapter 8. That size
can be used directly in a record:

```lanternfly
record Station
    name as string[12]
    id as u8
end

var station as Station
```

The string field occupies fourteen bytes at offset 0, so `id` sits at offset 14
and `Station` occupies fifteen bytes. String operations accept the complete
field path:

```lanternfly
station.name = "NORTH"
append(station.name, '2')
station.id = 2
```

After these statements, the record contains the text `NORTH2` and the numeric
identifier 2. Updating the string preserves its internal length and terminator
inside the fourteen-byte field.

## Clearing a record

`clear` writes zero to every field when all fields accept an all-zero
representation:

```lanternfly
clear(dailyLog)
```

Here every integer field becomes zero, including the fields of each reading and
the nested date. A string field would become empty. The operation is valid only
when every nested field accepts zero; an enum or range that excludes zero would
require an explicit initializer instead.

Record and array variables allocate aggregate storage at module level. The
first edition keeps owned local variables scalar. Chapter 10 explains how a
subroutine receives an existing record or array through an aggregate parameter,
and Chapter 11 explains local aliases for existing aggregate paths.

## Complete program

The complete module clears a `DailyLog`, sets the report date to July 30, 2026
and prepares reading 2 with value -12. `saveEntry` copies the date and reading
into the log, changes the saved reading's quality to 1, sets `used` to 3 and
stores a snapshot in `savedDate`. The source reading's quality remains 0.
Changing `reportDate.day` to 31 afterward leaves `savedDate.day` at 30. The
station record finishes with name `NORTH2` and identifier 2.

<<< @/lanternfly-book/book1/code/09-records.txt{lanternfly}


## Exercise

1. What is the byte offset of `dailyLog.entries[2].quality` from the start of
   `dailyLog`?

Answer: `entries` begins at offset 4, element 2 adds `2 * 4` bytes and
`quality` adds 3. The complete offset is `4 + 8 + 3`, or 15.

## Chapter summary

- A record defines one type with named fields; stored instances are declared
  separately.
- Fields occupy declaration order with no implicit padding.
- Field paths reduce to compile-time offsets plus any array index calculation.
- Record assignment copies an independent snapshot of the complete value.
- Nested records, arrays and strings retain their exact inline layouts.
