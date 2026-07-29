---
layout: default
title: "Fixed Arrays"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 6
---

# Fixed Arrays

> [!IMPORTANT]
> This chapter uses the pre-0.3 draft syntax. See the
> [book revision notice](index.md).

Eight samples can be stored under eight separate names, but a loop cannot
select those names with a counter. An array gives one name to a fixed number
of values:

```text
DIM Samples[8] AS BYTE

SUB FillSamples()
    DIM Index AS INTEGER

    FOR Index = 0 TO COUNT(Samples) - 1
        Samples[Index] = BYTE(Index * 2)
    NEXT Index
END SUB
```

`Samples[0]` receives 0, `Samples[1]` receives 2 and the final entry receives
14. The declaration fixes the count and element type before the program runs.

## A count belongs to the declaration

```text
DIM Samples[8] AS BYTE
```

The brackets declare eight entries. Every entry is a `BYTE`. Valid indexes run
from 0 through 7 because Lanternfly arrays are zero-based.

`COUNT(Samples)` produces 8 at compile time. Subtracting one gives the final
valid index. The loop remains correct if the declared count changes.

An array owns one continuous region of storage. Its exact size follows from
its count and element type:

```text
SIZEOF(Samples) = 8 * SIZEOF(BYTE)
                = 8
```

The compiler and every backend use that exact size.

## Selecting an entry

```text
Samples[Index] = BYTE(Index * 2)
```

The index is evaluated while the program runs. The backend calculates the
entry address from the array base, the index and the element size. Lanternfly
source names the selected value rather than the target registers needed for
that address calculation.

A constant index follows the same rule:

```text
Samples[3] = 10
```

The compiler checks constant indexes. A target profile may also request
runtime bounds checks for dynamic indexes. A checked access reports an error
when the index falls outside 0 through `COUNT(array) - 1`.

## Arrays keep their exact element size

```text
DIM Scores[5] AS WORD
```

Each `WORD` occupies two bytes, so the array occupies ten bytes. Entry 3 begins
six bytes after entry 0. The address calculation multiplies the index by two.

The same rule applies when an element occupies three, six or another count of
bytes. A backend may implement multiplication with shifts, additions or a
helper routine. The declared layout stays exact.

## More than one dimension

A tile map has rows and columns:

```text
CONST MapRows AS INTEGER = 24
CONST MapColumns AS INTEGER = 32

DIM Tiles[MapRows, MapColumns] AS BYTE
```

Two indexes select one tile:

```text
DIM Row AS INTEGER
DIM Column AS INTEGER
DIM TileNumber AS BYTE

Tiles[Row, Column] = TileNumber
```

Lanternfly stores multidimensional arrays in row-major order. Entries in one
row sit next to each other. The address calculation is:

```text
offset = Row * MapColumns + Column
```

The source keeps both indexes visible. A constrained backend may calculate a
row address first, then add the column.

## Static initial values

A fixed table may list its values in the declaration:

```text
DIM StepX[4] AS SBYTE = (0, 1, 0, -1)
DIM StepY[4] AS SBYTE = (-1, 0, 1, 0)
```

Each initializer must fit the element type and the number of values must match
the declared count. The table occupies its final representation before the
program starts.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt) fills a
sample array and declares a two-dimensional tile map.

## Summary

- An array has a fixed count and one element type.
- Indexes start at zero.
- `COUNT` and `SIZEOF` provide compile-time shape information.
- Runtime indexing uses the exact element size.
- Multidimensional arrays use row-major layout.
