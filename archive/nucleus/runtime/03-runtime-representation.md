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

`u8` occupies one byte and ranges from 0 through 255. `i8` occupies one byte,
uses two's complement, and ranges from -128 through 127. `boolean` occupies one
byte and is exactly 0 or 1. `u16` occupies two little-endian bytes and ranges
from 0 through 65,535. `i16` occupies two little-endian two's-complement bytes
and ranges from -32,768 through 32,767. A compiler or runtime helper must not
depend on another Boolean representation.

Arithmetic width and wraparound follow the language specification. A value
held temporarily in a Z80 register pair may use a wider carrier, but storage
and observable results retain their declared widths. The ordinary carrier for
an `i8` value keeps H zero; a signed operation interprets L's sign bit or
sign-extends only while needed. Every stored, returned, or forwarded `i8`
result restores H to zero. Checked conversion tests the mathematical source
value against the complete destination range before producing a result.

<div id="32-records-and-arrays" class="nucleus-source-anchor"></div>

## 3.2 Records and arrays

Records are packed in field-declaration order with no padding. Field extents
are:

- one byte for `u8`, `i8`, and `boolean`;
- two little-endian bytes for `u16` and `i16`; and
- the complete inline extent for a record, fixed array, or bounded string.

A fixed array stores its elements consecutively. Its stride is the complete
element extent. When that element is another fixed array, the inner array's
complete extent is the outer stride; recursively applying this rule gives the
specified row-major layout without a multidimensional runtime descriptor.
Neither a record nor an array stores a runtime type tag, field table, length
word, or address.

Compiler metadata retains every complete aggregate extent, fixed-array length,
fixed-array stride, and record-field offset as an unsigned 16-bit value. The
same word-sized extent machinery applies to records, arrays, and bounded
strings. This is compiler metadata only; it adds no header to an aggregate
object.

<div id="33-bounded-strings" class="nucleus-source-anchor"></div>

## 3.3 Bounded strings

`string[N]` occupies `N + 2` bytes. Byte zero is the current logical length
`L`; bytes 1 through `N` are the content capacity; and byte `N + 1` is always
`$00`. Static initialization writes that final byte, and exact-type aggregate
assignment copies it with the rest of the representation. No byte-level string
operation changes it. Bytes `L + 1` through `N` are also zero. The
invariant is `0 <= L <= N`, and the complete object extent is at
most 255 bytes because the source capacity is at most 253. This string-specific
limit does not constrain the complete extent of a containing record or array.

The address `carrier + 1` is always zero-terminated within `N + 1` bytes, so a
terminator-consuming routine can never read past the end of the object. This
does not make the payload a C string of exactly `L` bytes. Embedded zero bytes
are ordinary Nucleus content, but a C consumer stops at the first one. The
guarantee prevents a runaway read; it does not preserve counted length for a C
consumer.

An aggregate carrier for a bounded string addresses its length byte. Reading
`.length` checks the complete object and the length invariant. Indexing checks
`index < L` and addresses byte `1 + index`. Byte assignment changes one
existing content byte and does not change the length.

An open `string[]` binding may expose its retained capacity as a source `u8`
value. It may also change the logical length through the checked assignment
defined by the language specification. Generated code validates the complete
dynamic region before dereferencing the carrier. The resize helper then
validates both `oldLength <= capacity` and `newLength <= capacity` before any
write.

On success, the helper preserves bytes 1 through
`min(oldLength, newLength)`. A shrink clears bytes `newLength + 1` through
`oldLength`; a growth relies on the sealed zero-tail representation invariant. The helper
stores the new length after validation and clearing. It never writes byte
`capacity + 1`. Failure returns the existing bounds condition with the object
unchanged.

<div id="34-aggregate-carriers" class="nucleus-source-anchor"></div>

## 3.4 Aggregate carriers

An ordinary aggregate parameter or result is carried as one 16-bit address. Its exact
record type, array element type and length, or string capacity remains compiler
metadata. The runtime address has no source type tag and is never a source
integer. Only compiler-generated field selection, checked indexing, parameter
transfer, result transfer, and copying may consume it.

A `string[]` parameter uses two internal call words: the concrete capacity is
below the address, and the address is closest to the return address. The source
signature still has one parameter. The callee stores the address as a two-byte
alias binding and the capacity as one activation byte. Forwarding an open
parameter transfers both values. Before `.length`, `.capacity`, indexing, or
writable `.length` accesses the referent, generated code checks the complete
dynamic extent `capacity + 2`; operations that read or change the logical
contents then check the stored-length invariant. Source can obtain the retained
capacity only through `.capacity`. The address carrier remains unavailable to
source code.

A contextual string-literal argument uses this carrier unchanged. The compiler
places one distinct sealed bounded-string object in the target's generated
read-only-data region for each source occurrence and passes its resolved
address and inferred capacity. The object has program lifetime. No runtime
helper, tag, read-only bit, or copy-on-call state is added. Mutation through the
carrier therefore has the same placement-dependent physical effect as mutation
through an alias to a named aggregate constant.

A `T[]` parameter uses the same two-word call order: the concrete array's
unsigned 16-bit element count is below its address, and the address is closest
to the return address. The callee retains a four-byte binding: the ordinary
two-byte alias followed by the two-byte count. Forwarding loads both words from
the caller's activation and recreates the same stack order. Unlike a bounded
string, an array stores no count or capacity in its object. The element extent
and exact element type remain compiler metadata.

Concrete-array `.length` evaluates its base, discards the resulting address,
and produces the static count as a canonical `u16`. Open-array `.length`
discards the evaluated address and loads the retained count word without
dereferencing the object. Both forms preserve all calls and checks required to
form the base. Neither is writable.
