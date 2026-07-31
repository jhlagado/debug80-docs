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

    for index = 0 until count(samples)
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

`u8[8]` is an array of eight bytes. Every dimension declares an ordinal
index domain, and a lone count is the shorthand for the commonest one:
`u8[8]` means `u8[0 until 8]`, with valid indices 0 through 7. The compiler
reserves all eight bytes together; the array carries no hidden runtime
length and needs no allocator.

A count-declared array is therefore zero-based, and an index into one is
best understood as a distance from the beginning: entry zero is zero
elements from the base, entry seven is seven elements away. A dimension can
also declare its bounds outright, or take them from a Chapter 2 type:

```lanternfly
var octoberReadings as i16[1 to 31]
var modeWidths as u8[ReportMode]
```

The first array indexes naturally by day of the month, with no wasted
entry zero and no subtracted one in sight. The second holds one value per
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
Either shape documents the range and gives the compiler an opportunity to
prove every access safe, and resizing the declaration updates the loop
automatically.

## Visiting every element

When the work needs each element rather than its position, `for each`
traverses the array in row-major order:

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

## Characters and strings

Text is byte data with one extra obligation: something has to know where it
ends. A character literal such as `'H'` is an exact byte value, so a `u8`
array can hold text-shaped bytes — but the array's count describes its
capacity, and nothing in it records how much of that capacity is currently
meaningful. Lanternfly's string type carries that fact itself:

```lanternfly
var playerName as string[12]
```

`string[12]` is a counted string in the Pascal tradition. The capacity is
part of the type, and the layout is as concrete as any array's: one length
byte, twelve payload cells, and a zero byte after the current payload, for
exactly fourteen bytes settled at compile time. There is no allocator and no
hidden buffer; the declaration is the cost. A capacity of 255 or more widens
the length field to two bytes and nothing else changes.

The terminator earns its keep at the boundary. Because every operation
maintains it, the payload is always valid NUL-terminated text, so a firmware
or platform routine that expects the classic C convention can read the bytes
directly, at no conversion cost, while `length` never has to scan for the
zero — it reads the stored count and returns it as a `u16`.

A double-quoted literal supplies text wherever it fits:

```lanternfly
var greeting as string[12] = "HELLO"

sub renameGuest()
    playerName = greeting
    append(playerName, '!')
end
```

Assignment copies content, not identity, and the capacities of source and
destination need not match — the copy is checked instead. A source the
compiler can see is rejected at compile time when it cannot fit; a runtime
copy or `append` that would overflow invokes the range-fault service before
any destination byte changes, the same promise an array's bounds check makes.
`append` grows a string by another string, a literal or one nonzero byte, and
`clear` restores the empty value. All six comparison operators examine the
payload bytes, so `playerName = greeting` as a condition asks whether the
text matches, not whether two names share storage. All-zero storage is the
valid empty string, which is why a module string needs no initializer: it
simply begins empty.

The length byte, the payload cells and the terminator have no names. No
index reaches them, and `fill` refuses a string, because the whole
arrangement depends on the count, the nonzero payload and the terminator
staying in agreement — assignment, `append`, `clear`, comparison and
`length` are the complete interface, and each one preserves what the others
rely on. A `u8` array, which promises none of this, never converts into a
string, and a string is not an array of its bytes.

Strings sit in records and arrays like any other fixed-size data.
`string[12][8]` declares eight strings of capacity twelve — the capacity
brackets belong to the element type — and a record field
`name as string[12]` occupies its fourteen bytes at a fixed offset, as the
next chapter shows. Byte storage under other conventions — a high-bit
terminator, machine-specific display codes — remains ordinary `u8` data
under an explicit service contract, where each byte's meaning is the
contract's business.

## Clearing and filling

Two standard procedures handle common whole-array writes:

```lanternfly
clear(samples)
fill(weeklyReadings, 0)
```

`clear` writes the all-zero representation to a writable array, record or
string whose leaves accept it — for a string, that is the empty value. `fill`
evaluates one compatible scalar value and writes it to every array entry in
row-major order; a string's sealed cells are beyond its reach.

The backend may lower either operation to an inline loop, target instruction
sequence or runtime helper. The source names the operation; generated
artifacts show the chosen implementation and cost.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt)
fills a sample buffer and declares a weekly table, zeroes a month of
readings across a 1-to-31 domain, holds one line width per report mode, and
builds a status line in a `string[16]` by appending a literal and a computed
digit. For `weeklyReadings[1, 2]`, the expression `1 * readingCount + 2`
gives element 6 and byte offset 12 because each entry occupies two bytes.

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
- Character literals are byte values, and `string[N]` is the text type: a
  counted string of exact size `N + 2` whose payload always ends with a zero
  byte, so C-convention services read it directly.
- Strings are sealed — assignment, `append`, `clear`, comparison and `length`
  are the whole interface, and every copy is checked against capacity before
  a byte moves.
- `clear` and `fill` express repeated aggregate writes while leaving the
  backend free to choose an implementation.

An array holds many values of one type. In the next chapter we group
values of different types into records, and lay them out byte by byte.
