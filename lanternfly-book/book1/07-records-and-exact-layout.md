---
layout: default
title: "Records and Memory Layout"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 7
---

# Records and Memory Layout

A calendar date consists of a year, a month and a day. Separate variables can
hold those values, but their declarations do not say that they belong
together. A record defines one type with named fields:

```lanternfly
record Date
    var year as u16
    var month as u8
    var day as u8
end

var reportDate as Date

reportDate.year = 2026
reportDate.month = 7
reportDate.day = 30
```

`Date` occupies four bytes. A variable can store, copy and pass a date as one
value while each field retains its own type.

## Declaring a record

```lanternfly
record Date
    var year as u16
    var month as u8
    var day as u8
end
```

`record` introduces a user-defined type. Type names use Pascal case, while
variables, fields and routines use lower camel case. `Date` names a type;
`reportDate` names one stored value of that type.

A record declaration defines layout but allocates no instance storage.
`var reportDate as Date` reserves the four bytes. Another module could declare
an array of dates, a record containing a date or no `Date` storage at all.

A dot selects a field:

```lanternfly
reportDate.year
reportDate.month
reportDate.day
```

The compiler resolves each field name to a byte offset. Field names do not
occupy target memory and require no runtime lookup.

## Exact field layout

Fields appear in declaration order with no implicit padding. `Date.year`
occupies offsets 0 and 1, `month` occupies offset 2 and `day` occupies offset
3. The diagram uses the Z80's little-endian byte order, with the low byte of
`year` first. Another target profile may use a different byte order inside
`u16`, while the field offsets and total record size remain fixed:

![On Z80, a Date record occupies four bytes in declaration order, with month at offset two.](../../assets/images/lanternfly-book/book1/date-layout.svg)

Layout queries expose these facts during compilation:

```lanternfly
const dateBytes as u8 = size(type Date)
const monthOffset as u8 = offset(Date.month)
```

`dateBytes` is 4 and `monthOffset` is 2. The same values hold for every
backend. Exact layout allows a record to describe a firmware data block,
packet header or binary file structure when its field types match the external
format.

## Arrays of records

A measurement needs a signed value, a unit code and a quality code:

```lanternfly
record Reading
    var value as i16
    var unit as u8
    var quality as u8
end

var readings as Reading[4]
```

Each `Reading` occupies four bytes, so the array occupies 16. A field path can
index the array and select a field:

```lanternfly
readings[index].quality = 1
```

The compiler calculates `index * 4`, then adds the `quality` offset of 3.
`readings[2].quality` is byte 11 from the array base.

![Each Reading begins four bytes after the previous one; readings[2].quality is byte offset 11.](../../assets/images/lanternfly-book/book1/record-array-stride.svg)

An array of records keeps the fields of one entry adjacent. Parallel arrays
would keep every value together, every unit together and every quality code
together. The better layout depends on access: code that processes a complete
reading benefits from a record, while code that scans only quality codes may
benefit from a separate array.

## Nested records and arrays

Records can contain other records and fixed arrays:

```lanternfly
record DailyLog
    var date as Date
    var entries as Reading[4]
    var used as u8
end

var dailyLog as DailyLog
```

`DailyLog` occupies 21 bytes: four for the date, sixteen for the entries and
one for `used`. A longer path follows the type at every step:

```lanternfly
dailyLog.entries[index].quality = 1
```

`dailyLog.entries` selects the array at offset 4. Indexing adds a four-byte
stride, and `.quality` adds 3. The compiler checks each step against the
declared type before reducing the path to address arithmetic.

A record cannot contain itself by value, either directly or through another
record. Such a cycle would have no finite size. Chapter 8 uses references to
connect separately allocated records when a program needs links rather than
inline containment.

## Record initializers

A record initializer names every field:

```lanternfly
const releaseDate as Date = Date(
    year = 2026,
    month = 7,
    day = 30
)
```

Every field must appear exactly once. The initializer may list fields in any
order, but the declaration still controls storage order. Naming the fields
also makes each value's role clear at the point of initialization.

## Copying aggregates

Records and arrays of identical type support whole-value assignment:

```lanternfly
savedDate = reportDate
archive[0] = archive[1]
```

The complete fixed-size value is copied. The destination receives an
independent snapshot, so later changes to the source leave the copy unchanged.
Overlapping source and destination behave as though the source value were read
in full before any destination byte changed.

The backend may inline a small copy, generate a loop or call a helper. A
four-byte `Reading` and a 256-byte table have the same source operation but
very different machine costs, which generated listings and cost reports can
expose.

Owned local variables remain scalar in the first edition. A subroutine that
needs a short local name for an existing record or array uses the alias form
introduced in Chapter 8.

## Example

The [chapter listing](/lanternfly-book/book1/code/07-records.txt)
declares `Date`, `Reading` and `DailyLog`. Its declarations give
`size(type DailyLog)` as 21 and place
`dailyLog.entries[2].quality` at byte offset 15.

## Chapter summary

- A record groups named fields into one fixed-size type.
- Fields occupy declaration order with no implicit padding.
- Arrays of records use the record size as their stride.
- Nested records and arrays still reduce to one exact byte layout.
- Aggregate assignment copies the complete record or array value.
