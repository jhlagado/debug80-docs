---
layout: "default"
title: "3. Runtime representation"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 3
pageClass: "nucleus-specification"
---
[← 2. Target and resource model](02-target-and-resource-model.md) · [Contents](./) · [4. Program storage and startup →](04-program-storage-and-startup.md)

<div id="3-runtime-representation" class="nucleus-source-anchor"></div>

# 3. Runtime representation

<div id="31-scalar-values" class="nucleus-source-anchor"></div>

## 3.1 Scalar values

`u8` occupies one byte and ranges from 0 through 255. `boolean` occupies one
byte and is exactly 0 or 1. `u16` occupies two little-endian bytes and ranges
from 0 through 65,535. A compiler or runtime helper must not depend on another
Boolean representation.

Arithmetic width and wraparound follow the language specification. A value
held temporarily in a Z80 register pair may use a wider carrier, but storage
and observable results retain their declared widths. Checked narrowing tests
the complete `u16` value before producing a `u8`.

<div id="32-records-and-arrays" class="nucleus-source-anchor"></div>

## 3.2 Records and arrays

Records are packed in field-declaration order with no padding. Field extents
are:

- one byte for `u8` and `boolean`;
- two little-endian bytes for `u16`; and
- the complete inline extent for a record, fixed array, or bounded string.

A fixed array stores its elements consecutively. Its stride is the complete
element extent. Neither a record nor an array stores a runtime type tag, field
table, length word, or address.

<div id="33-bounded-strings" class="nucleus-source-anchor"></div>

## 3.3 Bounded strings

`string[N]` occupies `N + 1` bytes. Byte zero is the current logical length
`L`; bytes 1 through `L` are the content; the remaining payload bytes are not
source-readable. The invariant is `0 <= L <= N`.

An aggregate carrier for a bounded string addresses its length byte. Reading
`.length` checks the complete object and the length invariant. Indexing checks
`index < L` and addresses byte `1 + index`. Byte assignment changes one
existing content byte and does not change the length.

<div id="34-aggregate-carriers" class="nucleus-source-anchor"></div>

## 3.4 Aggregate carriers

An aggregate parameter or result is carried as one 16-bit address. Its exact
record type, array element type and length, or string capacity remains compiler
metadata. The runtime address has no source type tag and is never a source
integer. Only compiler-generated field selection, checked indexing, parameter
transfer, result transfer, and copying may consume it.
