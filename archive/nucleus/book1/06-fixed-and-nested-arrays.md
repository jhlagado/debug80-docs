---
layout: default
title: "Fixed and Nested Arrays"
parent: "Programming Nucleus"
nav_order: 6
---

# Fixed and Nested Arrays

A small grid has a known shape. Nucleus records that shape in its type, so the
compiler and runtime can check every selection without a heap or a hidden
descriptor.

```nucleus
var grid as u8[3][2] = [[1, 2], [3, 4], [5, 6]]
```

This is an array of three elements. Each element is an array of two `u8`
values. Read the suffixes from left to right: `grid[row]` selects one `u8[2]`
row, and `grid[row][column]` selects one byte in that row.

## Length belongs to each level

Every concrete array and open array view has a read-only `u16` `.length`.
`grid.length` is 3, while `grid[0].length` is 2. This makes traversal follow
the declared shape:

```nucleus
for row = 0 until grid.length
    for column = 0 until grid[row].length
        observed = observed + u16(grid[row][column])
    end
end
```

`until` is a natural match for zero-based indexing because the bound itself is
the first invalid index.

## Bounds and layout

Every index is checked against the selected array level. A negative signed
index fails before the upper-bound check. An out-of-range access is a safety
trap and cannot read or write the neighbouring object.

Nested arrays use row-major storage. The rightmost dimension is contiguous, so
the six bytes in the example are laid out as the first row, second row, then
third row. Selecting a row uses that row type's complete extent as the stride.
The source still deals in arrays and indexes; it never sees a byte address.

The companion sums all six cells and leaves `observed` equal to 21.

<<< @/nucleus/book1/examples/06-arrays.nu{nucleus}

## Summary

- `T[N]` is a fixed array with `N` elements.
- Array suffixes may nest to any admitted finite type depth.
- Each array level has its own read-only `u16` `.length`.
- Indexing is zero-based and checked.
- Nested arrays use row-major layout.

See [types](../language/06-types.md) and
[storage](../language/07-storage-values-and-lifetime.md). The checked companion
is [`06-arrays.nu`](examples/06-arrays.nu).
