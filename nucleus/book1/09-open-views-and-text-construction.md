---
layout: default
title: "Open Views and Text Construction"
parent: "Programming Nucleus"
nav_order: 9
---

# Open Views and Text Construction

A library routine should not need a separate copy for every array length or
string capacity. Nucleus solves this at routine boundaries with **open views**.
They are aliases to complete caller-owned objects, not slices and not new
storage.

## Open arrays retain their length

```nucleus
sub sum(values as u8[]) as u16
```

The call may bind `values` to any complete concrete `u8[N]` array. The view
retains that array's element count, exposed as read-only `values.length`.
Indexing checks against the retained count. It cannot select a shorter prefix,
change the count or be stored for later.

This is enough to write one traversal routine:

```nucleus
for index = 0 until values.length
    total = total + u16(values[index])
end
```

## Open strings expose capacity

`string[]` binds one complete bounded string of any capacity. It retains both
the current length and the actual capacity. A library may read `.capacity` and
may assign `.length` after checking the new value fits.

```nucleus
sub writeOK(text as string[])
    text.length = 2
    text[0] = 'O'
    text[1] = 'K'
end
```

The length assignment happens first, making indexes 0 and 1 valid. If 2 exceeds
the caller's capacity, that assignment traps before either byte write. A
library can compare the requested size with `.capacity` before changing the
object and return a recoverable error instead.

A string literal may be passed directly where a `string[]` parameter is
expected. It creates a program-lifetime concrete string object for that call
site. Libraries normally treat literal arguments as read-only because their
physical mutability differs between RAM and ROM targets.

The companion sums a four-byte array and builds `"OK"` in a `string[12]`. It
leaves `observed` equal to 22.

<<< @/nucleus/book1/examples/09-open-views.nu{nucleus}

## Summary

- `T[]` views one complete `T[N]` array and retains its element count.
- `string[]` views one complete bounded string and retains its capacity.
- Open views are parameter-only aliases, not slices or owned values.
- A `string[]` routine may assign a checked new logical length.
- Text construction belongs in bounded library routines built on that view.

See [parameter views](../language/06-types.md),
[aggregate parameter binding](../language/07-storage-values-and-lifetime.md#76-aggregate-parameter-binding)
and [routine arguments](../language/13-routines-and-calls.md#134-argument-evaluation-and-compatibility).
The checked companion is [`09-open-views.nu`](examples/09-open-views.nu).
