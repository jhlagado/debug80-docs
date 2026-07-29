---
layout: default
title: "Fixed Arrays"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 6
---

# Fixed Arrays

Eight separately named samples would force a loop to choose among eight names.
An array gives one name to the complete fixed sequence:

```lanternfly
var samples as u8[8]

sub fillSamples()
    var index as i16

    for index = 0 to count(samples) - 1
        samples[index] = u8(index * 2)
    end
end
```

`samples[0]` receives 0, `samples[1]` receives 2 and the final entry receives
14.

## The type contains the shape

```lanternfly
var samples as u8[8]
```

`u8[8]` means an array of eight `u8` elements. Valid indices run from 0 through
7 because Lanternfly arrays are zero-based.

`count(samples)` produces eight at compile time. `size(samples)` produces the
exact byte size, also eight:

```lanternfly
const sampleCount as u8 = count(samples)
const sampleBytes as u8 = size(samples)
```

The query inspects the declared type. It performs no runtime load.

## Selecting an entry

```lanternfly
samples[index] = u8(index * 2)
```

Here `index` is `i16`, while an array entry is `u8`. The explicit conversion
records the deliberate cross-type store. An ordinary update based on the old
`u8` entry would convert back to `u8` automatically.

The backend combines the array base, runtime index and element size to locate
the destination. A constant index follows the same rule:

```lanternfly
samples[3] = 10
```

A constant out-of-range index is a compile error. A dynamic index is checked
unless the compiler proves it lies inside the array. A failed check invokes
the target's bounds-fault service before any load or store.

## Element size controls the stride

```lanternfly
var scores as u16[5]
```

Each `u16` occupies two bytes, so `scores` occupies ten bytes. Entry 3 begins
six bytes after entry 0. The address calculation multiplies the index by two.

The same rule applies to elements that occupy three, six or another exact byte
count. Record arrays in Chapter 7 rely on this true stride.

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

Lanternfly stores the rightmost dimension contiguously. The element number is:

```text
row * mapColumns + column
```

`count(tiles, 0)` produces 24 and `count(tiles, 1)` produces 32. A dimension
argument is required for a multidimensional array so the requested extent is
explicit.

## Array initializers

Square brackets provide one initializer per element:

```lanternfly
const stepX as i8[4] = [0, 1, 0, -1]
const stepY as i8[4] = [-1, 0, 1, 0]
```

A multidimensional initializer mirrors the declared shape:

```lanternfly
const smallMap as u8[2, 4] = [
    [0, 0, 1, 1],
    [2, 2, 3, 3]
]
```

The rank, nested shape and element count must match exactly. Constant aggregate
data can be placed in ROM by a target profile.

## Clearing and filling

Two standard procedures handle repeated stores:

```lanternfly
clear(samples)
fill(tiles, emptyTile)
```

`clear` writes the all-zero representation to an array or record whose fields
permit it. `fill` writes one compatible scalar value to every entry of a fixed
array, including every cell of a multidimensional array. The backend may use a
loop, native operation or runtime helper while preserving the same result.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt) fills a
sample array, clears it and declares a two-dimensional tile map with direction
tables.

## Summary

- An array type states its element type and fixed dimensions.
- Indices start at zero and dynamic access is checked.
- `count` returns an extent and `size` returns exact bytes.
- Multidimensional arrays use row-major layout.
- Square-bracket initializers match the declared shape exactly.
- `clear` and `fill` perform repeated aggregate stores.
