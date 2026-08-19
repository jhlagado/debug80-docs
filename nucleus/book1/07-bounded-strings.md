---
layout: default
title: "Bounded Strings"
parent: "Programming Nucleus"
nav_order: 7
---

# Bounded Strings

Text on a small machine needs a firm storage bound. A `string[N]` owns room for
at most `N` content bytes and keeps a current logical length alongside them.
The current language admits capacities from 1 through 253.

```nucleus
var source as string[6] = "A\0B"
var copy as string[6]
```

The embedded zero is ordinary content. `source.length` is 3, not 1. Nucleus
string operations use the stored length and do not stop at the first zero.

## Reading and replacing bytes

`source[index]` produces a `u8` byte path. The index must be less than the
current length, not merely less than the capacity. Assignment replaces one
existing byte:

```nucleus
copy[2] = 'C'
```

It does not append, change `.length` or expose unused capacity. A concrete
`string[N]` may read `.length`, but it cannot assign that property. Chapter 9
introduces the open string view used by library routines that construct text.

## Whole-string assignment

Two bounded strings may be assigned only when their concrete types are
identical. `copy = source` copies the complete fixed object, including its
logical length and its sealed padding. It is not a character-by-character
conversion and does not accept a different capacity.

The runtime representation keeps the payload zero-filled and a zero byte after
the capacity. This guarantees that a terminator-reading machine routine cannot
run beyond the object. It does **not** promise a C string of logical length
`L`: an embedded zero can make such a routine stop early. Source-level Nucleus
operations remain governed by `.length`.

The companion copies `"A\0B"`, changes its final byte to `C`, and proves that
the logical length remains three. It leaves `observed` equal to 432.

<<< @/nucleus/book1/examples/07-strings.nu{nucleus}

## Summary

- `string[N]` has fixed capacity and a separate current length.
- Embedded zero bytes are ordinary content.
- Indexing is checked against the current length.
- Byte assignment does not append or change the length.
- Whole-object assignment requires the same concrete capacity.

See [bounded-string types](../language/06-types.md#68-bounded-strings) and the
[runtime representation](../runtime/03-runtime-representation.md). The checked
companion is [`07-strings.nu`](examples/07-strings.nu).
