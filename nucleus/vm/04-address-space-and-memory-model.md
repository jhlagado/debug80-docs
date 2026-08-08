---
layout: "default"
title: "4. Address space and memory model"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 4
pageClass: "nucleus-specification"
---
[← 3. Machine overview](03-machine-overview.md) · [Contents](./) · [5. Bytecode image and loading format →](05-bytecode-image-and-loading-format.md)

<div id="4-address-space-and-memory-model" class="nucleus-source-anchor"></div>

# 4. Address space and memory model

<div id="41-logical-regions" class="nucleus-source-anchor"></div>

## 4.1 Logical regions

NVM separates code offsets from data offsets. Both are unsigned 16-bit quantities, but one cannot be used in place of the other.

- Code offsets range from zero through `codeSize - 1` and address instruction bytes.
- Data offsets range from zero through `dataSize - 1` and address mutable program data.

`codeSize`, `dataSize`, and total image size are each at most 65,535 bytes. A size may be zero only where Chapter 19 permits it. The interpreter may place the regions anywhere in physical memory. No bytecode operation observes their physical bases.

<div id="42-byte-order-and-alignment" class="nucleus-source-anchor"></div>

## 4.2 Byte order and alignment

Every encoded or stored word is little-endian: the low byte precedes the high byte. Data words may begin at any valid data offset. NVM imposes no alignment padding or alignment trap.

An access of width `w` is valid when `address + w <= dataSize`, computed without 16-bit wrap. A failed dynamic access performs the Nucleus bounds trap. It performs no partial read or write.

<div id="43-mutability-and-initialization" class="nucleus-source-anchor"></div>

## 4.3 Mutability and initialization

Code, headers, routine descriptors, and initializer records are immutable during execution. The data region is mutable. Loading fills the entire data region with zero bytes, then applies initializer records in order. No relocation pass occurs.

Slots, staged arguments, result, error, completion kind, service cursors, and activation storage are runtime state rather than program data. Bytecode cannot address them as data.

<div id="44-arithmetic-on-addresses" class="nucleus-source-anchor"></div>

## 4.4 Arithmetic on addresses

`ADDRI`, `ADDO`, `INDEX`, `STRIDX`, and `STRLEN` are the only address-producing operations. Their results occupy ordinary word slots after source type erasure. Arithmetic instructions can physically consume such a word, but a conforming compiler must not emit source-illegal address arithmetic. A valid image is therefore structurally safe but not a substitute for source type checking.

`ADDO` detects mathematical overflow and data-region escape. It never wraps an address; either condition performs the bounds trap.
