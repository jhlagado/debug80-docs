---
layout: default
title: "Fixed Arrays and Index Domains"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 7
---

# Fixed Arrays and Index Domains

A data logger stores eight recent samples. Eight separately named variables
would hold the values, but a loop could not select one of those names from a
runtime index. An array gives the complete sequence one name and lets an
integer select an entry:

```lanternfly
var samples as u8[8]

sub prepareSamples()
    var index as i16

    for index = 0 until count(samples)
        samples[index] = u8(index * 2)
    end
end
```

The entries receive 0, 2, 4, 6, 8, 10, 12 and 14. Arrays connect two ideas
from Chapter 6: a loop produces the index, and indexing turns that number into
a storage location.

## Fixed shape

```lanternfly
var samples as u8[8]
```

`u8[8]` is an array of eight bytes. Every dimension declares an ordinal
index domain, and a lone count is the shorthand for the commonest one:
`u8[8]` means `u8[0 until 8]`, with valid indices 0 through 7. The compiler
reserves all eight bytes together; the array carries no hidden runtime
length and needs no allocator.

A count-declared array is therefore zero-based, and an index into one is
best understood as a distance from the beginning: entry zero is zero
elements from the base, entry seven is seven elements away. A dimension can
also declare its bounds outright, or take them from a Chapter 5 type:

```lanternfly
var octoberReadings as i16[1 to 31]
var modeWidths as u8[ReportMode]
```

The first array indexes naturally by day of the month, with no wasted
entry zero and no subtracted one. The second holds one value per
enumeration member — a table looked up by name. The domain is part of the
array's type, and `lower` and `upper` query a dimension's first and last
valid index the way `count` queries its extent.

`count(samples)` produces 8 during compilation. `size(samples)` produces the
array's byte size:

```lanternfly
const sampleCount as u8 = count(samples)
const sampleBytes as u8 = size(samples)
```

Both values are 8 here. They differ when an element occupies more than one
byte.

## Indexing and bounds

```lanternfly
samples[index] = u8(index * 2)
```

The backend combines the array's base address, the index and the element size
to find the selected entry. A constant index uses the same rule:

```lanternfly
samples[3] = 10
```

A constant index outside the valid range is a compile error. A runtime index
is checked unless the compiler proves it safe. If the check fails, the target
bounds-fault service runs before any load or store.

The loop `for index = 0 until count(samples)` walks exactly the valid range:
`until` excludes its boundary, so the loop takes the count directly, with
nothing subtracted. An array with an explicit domain traverses by its own
bounds instead: `for day = lower(octoberReadings) to upper(octoberReadings)`.
Either shape documents the range and lets the compiler prove every access
safe, and resizing the declaration updates the loop automatically.

## Visiting every element

When the work needs each element rather than its position, `for each`
traverses the array in _row-major order_ — completing the rightmost
dimension before advancing the one to its left, which for a
one-dimensional array simply means first to last:

```lanternfly
var sampleTotal as u16 = 0

sub sumSamples()
    sampleTotal = 0

    for each sample in samples
        sampleTotal = sampleTotal + sample
    end
end
```

The name `sample` denotes the current element itself. Reading it reads the
array entry, and assigning to it would write that entry. The collection path
is evaluated once before traversal begins, and `exit` and `continue` behave
as in any loop. A `for each` over a two-dimensional array visits every value
of every row without spelling either index; the indexed loop remains the form
to reach for when the position takes part in the work, as it does in
`prepareSamples`.

## Element stride

```lanternfly
var readings as u16[5]
```

Each `u16` occupies two bytes, so the array occupies ten. `readings[3]` begins
six bytes after the base because its offset is `3 * 2`.

![Each u16 entry occupies two adjacent bytes, so readings[3] begins at byte offset six.](../../assets/images/lanternfly-book/book1/array-stride.svg)

The distance from one element's beginning to the next is its stride. In a
fixed array, the stride is the exact element size. Lanternfly inserts no
padding between elements, so an array can match a firmware table, binary file
layout or hardware buffer byte for byte.

## Multidimensional arrays

A program that records four measurements for each of seven days can declare a
two-dimensional table:

```lanternfly
const dayCount as u8 = 7
const readingCount as u8 = 4

var weeklyReadings as u16[dayCount, readingCount]
```

Two indices select one value:

```lanternfly
weeklyReadings[day, reading] = value
```

Memory is linear, so Lanternfly stores the rightmost dimension
contiguously — the layout behind the row-major traversal order that
`for each` already follows. For an array with four entries per row, the
element number is:

```text
day * 4 + reading
```

The diagram uses a three-by-four byte array so every cell is easy to see. Row
1, column 2 has element number `1 * 4 + 2`, or 6.

![Rows occupy consecutive runs of four entries; row 1, column 2 is element 6.](../../assets/images/lanternfly-book/book1/row-major-array.svg)

`count(weeklyReadings, 0)` produces 7 and
`count(weeklyReadings, 1)` produces 4. A multidimensional array requires the
dimension number because each direction may have a different extent.

Loop order follows layout. A day loop on the outside and a reading loop on
the inside touch adjacent elements. That access pattern is usually cheaper on a
small processor because the generated code can advance an address through the
row.

## Array initializers

Square brackets provide one value for every element:

```lanternfly
const daysInMonth as u8[12] = [
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
]
```

The initializer must match the declared count exactly. A two-dimensional
initializer mirrors both dimensions:

```lanternfly
const calibration as i8[2, 4] = [
    [0, 1, 0, -1],
    [1, 0, -1, 0]
]
```

The compiler rejects missing entries, extra entries and rows with the wrong
shape. A target profile may place constant data in read-only memory.

## Clearing and filling

Two language operations handle common whole-array writes:

```lanternfly
clear(samples)
fill(weeklyReadings, 0)
```

`clear` writes the all-zero representation to a writable array whose
elements accept it — integer and Boolean elements do. `fill`
evaluates one compatible scalar value and writes it to every array entry in
row-major order. An array is the book's first _aggregate_ — a stored value
built from smaller values — and later chapters extend `clear` to the
aggregates they introduce: strings, then records.

The backend may lower either operation to an inline loop, target instruction
sequence or runtime helper. The source names the operation; generated
artifacts show the chosen implementation.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/07-fixed-arrays.txt)
fills a sample buffer and declares a weekly table, zeroes a month of
readings across a 1-to-31 domain and holds one line width per report mode.
For `weeklyReadings[1, 2]`, the expression `1 * readingCount + 2`
gives element 6 and byte offset 12 because each entry occupies two bytes.

## Exercises

1. For `var readings as i16[1 to 31]`, state `count(readings)` and
   `size(readings)`.
2. In `u8[12, 20]`, which element number is `[2, 3]`, and at what byte
   offset does it sit?
3. Why is `samples[8]` a compile error for `var samples as u8[8]`?

Answers: 31 elements and 62 bytes; element `2 * 20 + 3`, which is 43, at
byte offset 43 because each element is one byte; valid indices run 0
through 7, and a constant index outside the domain is rejected during
compilation.

## Chapter summary

- A fixed array stores a compile-time number of identical elements
  contiguously.
- Every dimension declares an ordinal index domain; a lone count means
  `0 until count`, and explicit or enum domains choose other bounds.
- Indices are checked against their dimension's domain, and an index whose
  type already fits the domain needs no runtime check.
- Element address is the array base plus index times stride.
- Multidimensional arrays use row-major layout with the rightmost dimension
  contiguous.
- `for each` visits every element in row-major order when positions are not
  needed.
- `clear` and `fill` express repeated aggregate writes while leaving the
  backend free to choose an implementation.

An array of bytes can hold any fixed byte sequence — including text,
whose one special requirement the next chapter takes up: a sequence of
character bytes must also record where it ends.
