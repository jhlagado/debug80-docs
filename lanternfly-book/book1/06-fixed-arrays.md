---
layout: default
title: "Fixed Arrays"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 6
---

# Fixed Arrays

Chapter 5 supplied the repetition mechanism that arrays now make useful for
tables. A program that needs eight sound samples can declare eight
separate variables (`sample0`, `sample1`, up to `sample7`), but a loop
cannot reach them:
`for index = 0 to 7` has no way to turn the value of `index` into a
choice among eight *names*. Names are gone by the
time the program runs. The compiler's ledger — which name means which
address — is spent during translation and never reaches the machine;
at runtime there are only addresses. So a runtime choice among eight
storage locations must be made with the tools that survive translation,
and those are numbers and arithmetic. What the loop needs is storage
selectable *by arithmetic*. An array is exactly that — one name for a
complete fixed sequence, indexed by number:

```lanternfly
var samples as u8[8]

sub fillSamples()
    var index as i16

    for index = 0 to count(samples) - 1
        samples[index] = u8(index * 2)
    end
end
```

`samples[0]` receives 0, `samples[1]` receives 2 and the final entry
receives 14. The loop can reach each element because the array turns the
runtime value of `index` into a storage location. The same combination handles
tables of actors, rows of tiles, planes of pixels and histories of positions.

## The type contains the shape

```lanternfly
var samples as u8[8]
```

`u8[8]` means an array of eight `u8` elements. The count is part of
the type, fixed at compile time. The compiler can lay the whole value out as
eight consecutive bytes at a known address, with no allocator or hidden
length field.

Valid indices run from 0 through 7, because Lanternfly arrays are
zero-based. Zero-basing puzzles newcomers — the first entry is entry
number zero? — until you see what an index actually is. It is not a
rank but a *distance*: how many elements stand between the start of
the array and the one you want. The first element is zero elements
from the start, so its index is zero. Under that reading, the address of an
element is the base plus the indexed distance. The loop idiom
`for index = 0 to count(samples) - 1` walks precisely the valid
range, first element to last, inclusively.

`count(samples)` produces eight at compile time, and `size(samples)`
produces the exact byte size — also eight here, though the two part
company the moment elements grow wider than a byte:

```lanternfly
const sampleCount as u8 = count(samples)
const sampleBytes as u8 = size(samples)
```

The query inspects the declared type, and writing `count(samples)`
instead of a literal 8 keeps the loop and the declaration joined at
one point: resize the array and every loop over it follows, with no
hunt for stray eights. It is the magic-number lesson of Chapter 2, applied to shapes: the count
already has a name.

## Selecting an entry

```lanternfly
samples[index] = u8(index * 2)
```

Here `index` is `i16` while an array entry is `u8`, so the explicit
conversion from Chapter 2 reappears, recording the deliberate
cross-type store. An ordinary update based on the old `u8` entry
would convert back automatically.

Underneath, selection is arithmetic. The backend combines the array's
base address, the runtime index and the element size to locate the
destination — base plus index times size, the formula that makes an
array an array. A constant index follows the same rule with the
multiplication done at compile time:

```lanternfly
samples[3] = 10
```

Without a bounds check, index 9 would calculate an address one byte past
`samples`. On a Z80 without memory protection, such a store could overwrite
another variable, saved state or program code. Lanternfly prevents that store
with the checks below.

A constant out-of-range index is a compile error. A dynamic index is checked
at runtime unless the compiler proves it lies inside the array. A loop bounded
by `count(...)` exposes such a proof opportunity; an implementation that
proves the range may remove the check. If a remaining check fails, the target
bounds-fault service runs before any load or store.

## Element size controls the stride

```lanternfly
var scores as u16[5]
```

Each `u16` occupies two bytes, so `scores` occupies ten. Entry 3
begins six bytes after entry 0, and the address calculation
multiplies the index by two. The distance from one element's start to
the next is called the *stride*, and here it equals the
element size:

![Each u16 entry occupies two adjacent bytes, so scores[3] begins at byte offset six.](../../assets/images/lanternfly-book/book1/array-stride.svg)

The same rule applies to elements that occupy three, six or another
exact byte count — there is no padding and no rounding to convenient
powers of two. Therefore `size(...)` of an array is its count multiplied
by its element size. The resulting bytes can match an externally defined
firmware table, file format or hardware buffer.

## Multidimensional arrays

A tile map has rows and columns:

```lanternfly
const mapRows as u8 = 24
const mapColumns as u8 = 32

var tiles as u8[mapRows, mapColumns]
```

Two indices select one tile:

```lanternfly
tiles[row, column] = tileNumber
```

Memory itself has no rows; it is a linear address space. A two-dimensional
array is therefore a layout convention:
Lanternfly stores the rightmost dimension contiguously, laying row 0
end to end, then row 1 immediately after it, and so on through row
23. The element number is:

```text
row * mapColumns + column
```

The following schematic uses a separate three-row, four-column array so every
cell fits in the figure. In that smaller shape, row 1, column 2 is element
`1 * 4 + 2`, or 6. The 24-by-32 `tiles` array above uses the same formula
with 32 columns, so `tiles[1, 2]` is element 34.

![Rows occupy consecutive runs of four bytes; row 1, column 2 is element 6.](../../assets/images/lanternfly-book/book1/row-major-array.svg)

Chapter 3's `row * 20 + column` example performed the same row-major
calculation for a screen twenty columns wide. A multidimensional array applies
the formula from its declared shape on every access. The compiler checks the
number and integer type of the supplied indices; the bounds rule still applies
to their runtime values.

The layout also informs loop order. With rows outside and columns inside,
consecutive iterations touch consecutive bytes. With the loops swapped, each
iteration moves by a row's width. A backend may exploit contiguous access by
incrementing an address rather than recomputing the full index. A future
generated listing can show whether it did so.

`count(tiles, 0)` produces 24 and `count(tiles, 1)` produces 32. The
dimension argument is required for a multidimensional array so the
requested extent is explicit — an unadorned `count(tiles)` would
leave the reader guessing which direction was meant.

## Array initializers

Square brackets provide one initializer per element:

```lanternfly
const stepX as i8[4] = [0, 1, 0, -1]
const stepY as i8[4] = [-1, 0, 1, 0]
```

For a valid direction from north through west, the two tables contain the
same offsets as Chapter 4's `select`: north selects (0, -1), east selects
(1, 0) and so on. Invalid input needs explicit treatment because an array
access faults where the earlier `select` used its `else`:

```lanternfly
sub findStep()
    deltaX = 0
    deltaY = 0

    if direction <= west then
        deltaX = stepX[direction]
        deltaY = stepY[direction]
    end
end
```

If another part of the program establishes that `direction` is always in
range, the guard may be unnecessary. Without that invariant, removing the
guard changes invalid-input behaviour.

`stepX` and `stepY` are *parallel arrays*: one index selects related entries
from both. A table can replace a `select` whose cases only supply constants,
provided the program also preserves or deliberately changes the original
handling of unmatched values.

A multidimensional initializer mirrors the declared shape:

```lanternfly
const smallMap as u8[2, 4] = [
    [0, 0, 1, 1],
    [2, 2, 3, 3]
]
```

The rank, nested shape and element count must match exactly — the compiler
rejects a lopsided table rather than padding a row or inventing missing
elements. Constant aggregate data can be placed in ROM by a target
profile. On a cartridge-based or embedded machine, direction tables, level
maps and sprite data can remain in read-only space instead of writable RAM.

## Clearing and filling

Initialization at declaration is one thing; wiping a table at the
start of each round is another, and writing the loop by hand every
time grows old. Two standard procedures handle repeated stores:

```lanternfly
clear(samples)
fill(tiles, emptyTile)
```

`clear` writes the all-zero representation to an array or record
whose fields permit it. `fill` writes one compatible scalar value to
every entry of a fixed array, including every cell of a
multidimensional one. Each says in a word what a loop would say in
three lines, and the reader learns the intent — "this table starts
empty", "this map starts as open floor" — without simulating any
loop in their head. The backend may implement either with a loop, a
native operation or a runtime helper while preserving the same
result. Once a compiler exists, its generated listing can show which choice
was made.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt)
fills a sample array, clears it and declares a two-dimensional tile map with
direction tables. Calculate the byte offset of `tiles[1, 2]` from the
row-major formula, then check `stepX[west]` and `stepY[west]` against
Chapter 4's `select`. The expected results are offset 34 and step (-1, 0).
