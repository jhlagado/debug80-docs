---
layout: "default"
title: "5. Bytecode image and loading format"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 5
pageClass: "nucleus-specification"
---
[← 4. Address space and memory model](04-address-space-and-memory-model.md) · [Contents](./) · [6. Machine state →](06-machine-state.md)

<div id="5-bytecode-image-and-loading-format" class="nucleus-source-anchor"></div>

# 5. Bytecode image and loading format

<div id="51-canonical-order" class="nucleus-source-anchor"></div>

## 5.1 Canonical order

An image has four contiguous parts:

1. a 32-byte header;
2. one 8-byte descriptor per routine;
3. the initializer section; and
4. the code section.

The sections have no gaps, overlap, alignment padding, or trailing bytes. Chapter 19 defines all validity checks. Appendix B gives byte offsets.

<div id="52-header" class="nucleus-source-anchor"></div>

## 5.2 Header

The magic bytes are `4E 56 4D 31`, the ASCII spelling `NVM1`. VM version is `0,1`; service version is `0,1`. `headerSize` is 32, `maxArguments` is 16, and `slotCount` is 128.

The header names the exact image size, section offsets and sizes, data size, entry routine ordinal, and minimum activation capacities. The required activation byte count is at least 4 and the required depth is at least 1. A host that cannot supply both rejects the image.

<div id="53-routine-table" class="nucleus-source-anchor"></div>

## 5.3 Routine table

Routine ordinals are zero-based byte values. An image contains 1 through 255 routines. Each descriptor supplies:

- inclusive code entry and exclusive code end offsets;
- parameter count from 0 through 16;
- clobber-prefix count from 0 through 128;
- bit 0, `hasResult`; and
- bit 1, `fails`.

The parameter count must not exceed the clobber count. Other flag bits and the descriptor's reserved byte are zero. Routine code ranges are nonempty, contiguous, ordered, and cover the whole code section. The entry routine has zero parameters and no result; it may be failable.

The table contains no source type tags. The compiler has already checked scalar and alias types.

<div id="54-initializer-section" class="nucleus-source-anchor"></div>

## 5.4 Initializer section

The section begins with a little-endian record count. Each record is:

```text
address:u16  length:u16  payload:byte[length]
```

Records have positive length, appear in ascending address order, do not overlap, and fit the data region. Missing bytes retain their zero initialization. Even an empty initializer set occupies the two-byte zero record count.

<div id="55-code-section-and-relocation" class="nucleus-source-anchor"></div>

## 5.5 Code section and relocation

The code section contains complete routine bodies in ordinal order. Branch operands are code-section offsets. `CALL` operands are routine ordinals. Absolute data operands are data offsets. The loader adds no base to any encoded operand, so NVM has no relocation section.

Canonical section order does not require the compiler to retain the whole image in fast memory. A streaming backend may spool code and initializer bytes to bulk storage, retain or spool descriptor and fixup records, and then write the canonical image sequentially. An environment with output seeking may instead reserve and patch known regions. Either route produces the same final bytes.

<div id="56-load-transaction" class="nucleus-source-anchor"></div>

## 5.6 Load transaction

Loading is atomic. The loader first validates the entire immutable image and available capacities. It then allocates or selects runtime regions, zeros data and machine state, copies initializers, initializes services, and enters `ready`. Failure leaves no runnable partial instance.
