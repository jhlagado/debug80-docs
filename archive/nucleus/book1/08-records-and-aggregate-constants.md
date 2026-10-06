---
layout: default
title: "Records and Aggregate Constants"
parent: "Programming Nucleus"
nav_order: 8
---

# Records and Aggregate Constants

Related fields should travel under one name. A record declaration defines that
shape and gives it a distinct type.

```nucleus
record Cell
    value as u16
    active as boolean
end
```

Field order is declaration order. Two record declarations with identical
fields are still different types; Nucleus uses the declared record name rather
than structural resemblance.

## Static values

A record initializer supplies every field in order:

```nucleus
const defaultCell as Cell = (7, true)
var current as Cell = defaultCell
```

Arrays use square brackets and strings use string literals. Initializers are
complete, type-directed descriptions of static storage. They do not call
routines or run assignment statements before `main`.

An aggregate constant has an explicit aggregate type. Its direct named root is
read-only, so `defaultCell.value = 9` is rejected. It remains useful as a data
source: code may read its fields, pass it to an aggregate parameter, return an
alias to it or use it as an exact-type static initializer where supported.

The restriction is deliberately local to a source path rooted at the constant
name. Nucleus has no transitive const type. If a constant is passed through an
ordinary aggregate parameter, the alias does not retain a read-only marker.
Portable code does not mutate such an alias: a ROM target may ignore the
physical write, while a RAM-loaded target may change it.

## Aggregate assignment

Assignment between two records or arrays copies the complete value only when
their concrete types are identical. It does not rebind a parameter alias.
Fields and nested elements remain available through ordinary paths such as
`table[index].value`.

The companion reads one record constant, one array constant and one mutable
record. It leaves `observed` equal to 22.

<<< @/nucleus/book1/examples/08-records.nu{nucleus}

## Summary

- Records are nominal types with fields in declaration order.
- Static aggregate initializers are complete and type-directed.
- Aggregate constants own program-lifetime storage with a read-only direct root.
- Read-only status is not carried through ordinary aggregate aliases.
- Aggregate assignment requires exact concrete type identity.

See [types](../language/06-types.md), [storage](../language/07-storage-values-and-lifetime.md)
and [declarations](../language/08-constants-and-declarations.md). The checked
companion is [`08-records.nu`](examples/08-records.nu).
