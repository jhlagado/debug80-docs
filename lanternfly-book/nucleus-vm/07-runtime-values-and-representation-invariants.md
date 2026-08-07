---
layout: "default"
title: "7. Runtime values and representation invariants"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 7
pageClass: "nucleus-specification"
---
[← 6. Machine state](06-machine-state.md) · [Contents](./) · [8. Virtual-slot organization →](08-virtual-slot-organization.md)

<div id="7-runtime-values-and-representation-invariants" class="nucleus-source-anchor"></div>

# 7. Runtime values and representation invariants

<div id="71-scalar-carriers" class="nucleus-source-anchor"></div>

## 7.1 Scalar carriers

Every slot and argument is a 16-bit word. The compiler selects operations by static source type.

- A `u8` has high byte zero.
- A Boolean is exactly 0 or 1.
- A `u16` is any word.
- An aggregate alias is a data offset in a word.

Instructions that require `u8` or Boolean operands do not mask or reinterpret another carrier. Supplying one is invalid execution caused by invalid bytecode or corrupted state; valid compiled programs cannot produce it.

Unsigned arithmetic wraps modulo 256 or 65,536 as selected by the opcode, except division and checked narrowing. Comparisons are unsigned. Unary minus uses the same modular arithmetic. Bitwise `not`, `and`, and `or` operate at the selected width. Boolean `not` is separate.

<div id="72-records-and-fixed-arrays" class="nucleus-source-anchor"></div>

## 7.2 Records and fixed arrays

Records use declaration order, no padding, and the following field widths:

- `u8` and `boolean`: 1 byte;
- `u16`: 2 bytes;
- fixed record, fixed array, and bounded string fields: their complete inline extent.

A fixed array stores elements consecutively with the element's extent as its stride. Its runtime alias is the offset of element zero. The static compiler supplies stride and declared length to `INDEX`; neither is stored beside the array.

Records and arrays carry no runtime type or length tag. The compiler preserves their nominal source types.

<div id="73-bounded-strings" class="nucleus-source-anchor"></div>

## 7.3 Bounded strings

`string[N]` occupies `N + 1` bytes. Byte zero is the logical length `L`; bytes 1 through `L` are the byte sequence; the remaining payload is unspecified storage. The invariant is `0 <= L <= N`, where `1 <= N <= 255`.

A string alias is the offset of the length byte. `STRLEN` reads the length after checking the invariant. `STRIDX` checks an index against `L`, not `N`, and returns the selected payload address. Assigning through that address changes one byte but not the length. NVM 0.1 has no resize instruction.

<div id="74-aliases-and-lifetime" class="nucleus-source-anchor"></div>

## 7.4 Aliases and lifetime

An alias has no runtime tag, ownership bit, or lifetime counter. It denotes storage by data offset. The source compiler guarantees exact referent type and program-lifetime derivation. Field selection uses `ADDO`; array and string selection use checked address instructions.

Because Nucleus 0.1 allocates owned aggregates only in program data, a valid aggregate alias remains addressable across calls. Slot save and restore preserves alias words like other scalar carriers.

<div id="75-invalid-representations" class="nucleus-source-anchor"></div>

## 7.5 Invalid representations

An out-of-data address or stored string length greater than its declared capacity performs the bounds trap. A noncanonical byte or Boolean carrier used by an instruction that requires the corresponding source type is invalid execution. Valid compiler output cannot produce that state; Section 15.7 defines the implementation response without adding another source trap.
