---
layout: default
title: "Fixed Arrays and Index Domains"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 7
---

# Fixed Arrays and Index Domains

A data logger keeps eight recent samples. Eight separate variables would store
the bytes, but a loop could not select one of those variable names from a
number calculated at runtime. An array gives the eight values one name and
uses an index to select an element:

```lanternfly
var samples as u8[8]

sub prepareSamples()
    var index as i16

    for index = 0 until count(samples)
        samples[index] = u8(index * 2)
    end
end
```

The loop produces the indices 0 through 7. Indexing turns each number into one
storage location, and the assignment stores twice the index:

| Index | Stored value |
| ----: | -----------: |
| 0 | 0 |
| 1 | 2 |
| 2 | 4 |
| 3 | 6 |
| 4 | 8 |
| 5 | 10 |
| 6 | 12 |
| 7 | 14 |

This is the connection between loops and arrays: the loop generates positions,
and the brackets select the value at each position.

## Eight values in one declaration

```lanternfly
var samples as u8[8]
```

`u8[8]` means eight `u8` elements stored next to one another. The compiler
reserves all eight bytes when it lays out the program. The array contains no
runtime length field and requires no allocator.

Every array dimension defines its valid indices, called its _index domain_. A
lone positive count uses the common zero-based domain:

```text
u8[8] means u8[0 until 8]
```

The valid indices are 0 through 7. Index zero selects the first byte, index one
selects the second and index seven selects the last. The count 8 is the first
excluded index, matching the `until` rule from Chapters 5 and 6.

Two compile-time queries describe the array:

```lanternfly
const sampleCount as u8 = count(samples)
const sampleBytes as u8 = size(samples)
```

`count(samples)` is 8 because the array has eight elements. `size(samples)` is
also 8 because each `u8` occupies one byte. Element count and byte size differ
as soon as an element occupies more than one byte.

## Indexing one element

The statement below selects one byte and stores a value in it:

```lanternfly
samples[index] = u8(index * 2)
```

For a zero-based byte array, the index is also the byte offset from the start
of the array. `samples[0]` is at offset 0, `samples[3]` is at offset 3 and
`samples[7]` is at offset 7.

A constant index is checked during compilation:

```lanternfly
samples[3] = 10
```

The index 3 is valid. `samples[8]` would be rejected because the domain ends at
7.

A value calculated at runtime is checked before the element is read or
written. If the index lies outside the domain, the bounds fault occurs and the
array remains unchanged. The check prevents an invalid index from selecting
some unrelated byte that happens to follow the array in memory.

The compiler can omit a runtime check when the source already proves the
index. The loop in `prepareSamples` starts at zero and stops before
`count(samples)`, so every value of `index` is valid. A range type can provide
the same proof:

```lanternfly
range SampleIndex as u8 = 0 until 8

var selectedSample as SampleIndex = 3
var selectedValue as u8 = 0

sub readSelectedSample()
    selectedValue = samples[selectedSample]
end
```

Every possible `SampleIndex` value belongs to the array domain, so this access
needs no bounds check.

## Domains that start somewhere else

Zero-based indices suit counts, but some data already has a natural numbering
scheme. A month is numbered from day 1, and a report table can be indexed by
named modes:

```lanternfly
var octoberReadings as i16[1 to 31]
var modeWidths as u8[ReportMode]
```

`octoberReadings` has 31 elements with valid indices 1 through 31. Day 1
selects the first element, so no unused entry zero is needed. The physical
element number is the index minus the lower bound:

| Day index | Element number |
| --------: | -------------: |
| 1 | 0 |
| 2 | 1 |
| 31 | 30 |

`modeWidths` has one element for every `ReportMode` member in declaration
order. The program can write `modeWidths[diagnostic]` instead of converting the
mode to a number.

The index domain is part of the array type. An `i16[31]` indexed from 0 through
30 and an `i16[1 to 31]` contain the same number of elements, but their indices
mean different things and the types are different.

`lower`, `upper` and `count` make traversal follow the declaration:

```lanternfly
for day = lower(octoberReadings) to upper(octoberReadings)
    octoberReadings[day] = 0
end
```

The loop visits 1 through 31. If the declared domain changes, the two queries
change with it; the loop source remains unchanged.

## Visiting values without an index

Some work needs every element but never uses its position. `for each` binds a
name directly to the current element:

```lanternfly
var sampleTotal as u16 = 0

sub sumSamples()
    sampleTotal = 0

    for each sample in samples
        sampleTotal = sampleTotal + sample
    end
end
```

The binding `sample` denotes each array element from first to last. Reading it
reads that element; assigning to it would write the element. With the prepared
values 0, 2, 4, 6, 8, 10, 12 and 14, `sampleTotal` finishes at 56.

Use an indexed loop when the position participates in the calculation, as it
does in `prepareSamples`. Use `for each` when the operation depends only on the
stored values. `exit` and `continue` have the same meanings in either form.

## Element size and stride

The byte offset equals the index only when each element occupies one byte.
Consider five `u16` readings:

```lanternfly
var readings as u16[5]
```

Each element occupies two bytes, so the complete array occupies ten. The
distance from the start of one element to the start of the next is the
_stride_. Here the stride is two:

| Index | Byte offset | Bytes occupied |
| ----: | ----------: | -------------- |
| 0 | 0 | 0–1 |
| 1 | 2 | 2–3 |
| 2 | 4 | 4–5 |
| 3 | 6 | 6–7 |
| 4 | 8 | 8–9 |

The offset calculation is `(index - lower bound) * element size`. For
`readings[3]`, that is `(3 - 0) * 2`, giving byte offset 6.

![Each u16 entry occupies two adjacent bytes, so readings[3] begins at byte offset six.](../../assets/images/lanternfly-book/book1/array-stride.svg)

Lanternfly inserts no padding between array elements. A fixed array can exactly
match an external table or hardware buffer when its element type has the
required representation.

## Two-dimensional arrays

A logger that stores four readings on each of seven days needs two indices:

```lanternfly
const dayCount as u8 = 7
const readingCount as u8 = 4

var weeklyReadings as u16[dayCount, readingCount]
```

The first index selects the day and the second selects the reading within that
day:

```lanternfly
weeklyReadings[1, 2] = 120
```

Memory is linear, so the rightmost dimension occupies each consecutive run.
Four readings make one row. The element number for `[day, reading]` is:

```text
day * readingCount + reading
```

For `[1, 2]`, the calculation is `1 * 4 + 2`, giving element number 6. Every
element is a two-byte `u16`, so its byte offset is `6 * 2`, or 12.

![Rows occupy consecutive runs of four entries; row 1, column 2 is element 6.](../../assets/images/lanternfly-book/book1/row-major-array.svg)

This arrangement is called _row-major order_. A nested traversal puts the day
loop outside and the reading loop inside, so consecutive inner passes touch
adjacent elements.

Dimension numbers start at zero. `count(weeklyReadings, 0)` produces 7 for the
day dimension, and `count(weeklyReadings, 1)` produces 4 for the reading
dimension. One bracket operation supplies both indices; partial forms such as
`weeklyReadings[day]` are invalid.

`for each` traverses a multidimensional array in the same row-major order. It
visits all four readings of day 0, then all four readings of day 1 and so on.

## Initial values

Square brackets supply one value for every element:

```lanternfly
const daysInMonth as u8[12] = [
    31, 28, 31, 30, 31, 30,
    31, 31, 30, 31, 30, 31
]
```

The initializer has exactly twelve values. Missing or extra values are compile
errors. A multidimensional initializer mirrors the declared shape:

```lanternfly
const calibration as i8[2, 4] = [
    [0, 1, 0, -1],
    [1, 0, -1, 0]
]
```

Both rows contain four values, matching `i8[2, 4]`. Values are stored in the
same row-major order used for indexing and traversal.

## Clearing and filling

Two built-in operations handle complete arrays:

```lanternfly
clear(samples)
fill(weeklyReadings, 0)
```

`clear` writes the all-zero representation to every element when that
representation is valid for the element type. `fill` evaluates one compatible
scalar value and writes it to every element in row-major order.

An _aggregate_ is one stored value composed of smaller values. Arrays, strings
and records are aggregates; `clear` applies when all of their stored parts
accept zero.

## Complete program

The complete module fills `samples` with the even values from 0 through 14 and
then sums them to 56. It clears the weekly table before storing 120 at byte
offset 12, and it clears all 31 October readings through their declared 1-to-31
domain. The report-mode table stores widths 40, 80 and 80 in enum declaration
order.

<<< @/public/lanternfly-book/book1/code/07-fixed-arrays.txt{lanternfly}

The source is also available as
[07-fixed-arrays.txt](/lanternfly-book/book1/code/07-fixed-arrays.txt).

## Exercise

1. For `var readings as i16[1 to 31]`, what are `count(readings)`,
   `size(readings)` and the byte offset of `readings[10]`?

Answer: the array has 31 elements and occupies 62 bytes. Index 10 is element
number `10 - 1`, so its byte offset is `9 * 2`, or 18.

## Chapter summary

- A fixed array stores a compile-time number of equal-sized elements next to
  one another.
- Its index domain states every valid index; a lone count means
  `0 until count`.
- A bounds check occurs before an access unless the index type or loop already
  proves the index valid.
- Element offset is `(index - lower bound) * element size`.
- Multidimensional arrays and `for each` traversal use row-major order.
