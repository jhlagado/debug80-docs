---
layout: default
title: "Tables with Fixed Arrays"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 6
---

# Tables with Fixed Arrays

A data logger stores eight recent samples. Eight separately named variables
would hold the values, but a loop could not select one of those names from a
runtime index. An array gives the complete sequence one name and lets an
integer select an entry:

```lanternfly
var samples as u8[8]

sub prepareSamples()
    var index as i16

    for index = 0 to count(samples) - 1
        samples[index] = u8(index * 2)
    end
end
```

The entries receive 0, 2, 4, 6, 8, 10, 12 and 14. Arrays connect two ideas
from Chapter 5: a loop produces the index, and indexing turns that number into
a storage location.

## Fixed shape

```lanternfly
var samples as u8[8]
```

`u8[8]` is an array of eight bytes. The count belongs to the type and must be
a positive compile-time value. The compiler reserves all eight bytes together;
the array carries no hidden runtime length and needs no allocator.

Lanternfly arrays are zero-based. Valid indices for eight entries run from 0
through 7. An index is best understood as a distance from the beginning:
entry zero is zero elements from the base, entry one is one element away and
entry seven is seven elements away.

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

The loop bound `count(samples) - 1` documents the valid range and gives the
compiler an opportunity to prove every access safe. Resizing the declaration
also updates the loop automatically.

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

Memory is linear, so Lanternfly stores the rightmost dimension contiguously.
For an array with four entries per row, the element number is:

```text
day * 4 + reading
```

The diagram uses a three-by-four byte array so every cell is easy to see. Row
1, column 2 has element number `1 * 4 + 2`, or 6.

![Rows occupy consecutive runs of four entries; row 1, column 2 is element 6.](../../assets/images/lanternfly-book/book1/row-major-array.svg)

`count(weeklyReadings, 0)` produces 7 and
`count(weeklyReadings, 1)` produces 4. A multidimensional array requires the
dimension number because each direction may have a different extent.

Loop order follows layout. A day loop on the outside and a reading loop on the
inside touches adjacent elements. That access pattern is usually cheaper on a
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
shape. A target profile may place constant aggregate data in read-only memory,
which preserves writable RAM for changing program state.

## Text and byte arrays

The working 0.3 language has yet to settle its runtime text model. Double
quotes currently appear only in compile-time forms such as
`import "console.lf"` and `from "ROM_PRINT"`. Character literals and runtime
string literals are outside the current contract.

A program can store encoded text as a fixed byte array when a platform
interface defines the encoding and framing:

```lanternfly
// ASCII values for HELLO followed by a zero terminator.
const greetingBytes as u8[6] = [$48, $45, $4c, $4c, $4f, 0]
```

The array has the exact representation required by a NUL-terminated ASCII
service. Another service might require a length prefix, a high-bit terminator
or machine-specific display codes. Calling that array a string would hide the
contract that gives each byte its meaning.

The Lanternfly project still needs to define a small static text facility:
character and text literal spelling, encoding, read-only references, bounded
views, capacity rules and operations such as length, comparison and copy.
These features can preserve fixed allocation; they require no heap or
automatic resizing. Until that contract is settled, reusable text handling
belongs in explicitly typed platform or library interfaces.

## Clearing and filling

Two standard procedures handle common whole-array writes:

```lanternfly
clear(samples)
fill(weeklyReadings, 0)
```

`clear` writes the all-zero representation to a writable array or record whose
fields accept it. `fill` evaluates one compatible scalar value and writes it
to every array entry in row-major order.

The backend may lower either operation to an inline loop, target instruction
sequence or runtime helper. The source names the operation; generated
artifacts show the chosen implementation and cost.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt)
fills a sample buffer and declares a weekly table. For
`weeklyReadings[1, 2]`, the expression `1 * readingCount + 2` gives element 6
and byte offset 12 because each entry occupies two bytes.

## Chapter summary

- A fixed array stores a compile-time number of identical elements
  contiguously.
- Indices are zero-based and checked before access.
- Element address is the array base plus index times stride.
- Multidimensional arrays use row-major layout with the rightmost dimension
  contiguous.
- Programs can encode text as byte data under explicit service contracts; a
  static text facility remains open design work.
- `clear` and `fill` express repeated aggregate writes while leaving the
  backend free to choose an implementation.
