---
layout: "default"
title: "10. Data movement and memory access"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 10
pageClass: "nucleus-specification"
---
[← 9. Instruction encoding](09-instruction-encoding.md) · [Contents](./) · [11. Arithmetic, logic, comparison, and conversions →](11-arithmetic-logic-comparison-and-conversions.md)

<div id="10-data-movement-and-memory-access" class="nucleus-source-anchor"></div>

# 10. Data movement and memory access

<div id="101-constants-and-movement" class="nucleus-source-anchor"></div>

## 10.1 Constants and movement

`LDI8 value, destination` writes a zero-extended byte. `LDI16 value, destination` writes the complete word. `MOV source, destination` copies all sixteen bits. A canonical `u8` value is already its widened `u16` value, so widening needs no opcode; the compiler emits `MOV` only when allocation requires another slot.

<div id="102-address-immediates-and-offsets" class="nucleus-source-anchor"></div>

## 10.2 Address immediates and offsets

`ADDRI offset, destination` writes a constant data offset after checking that it is below `dataSize`. It normally supplies the address of a program-lifetime root.

`ADDO base, offset, extent, destination` computes the mathematical sum of the base slot and constant byte offset. The positive extent describes the selected field or subobject. The complete region must fit data; otherwise the instruction performs the bounds trap. It never wraps.

<div id="103-fixed-array-indexing" class="nucleus-source-anchor"></div>

## 10.3 Fixed-array indexing

`INDEX base, index, length, stride, destination` requires positive constant length and stride. It first checks the unsigned slot index against the fixed length. It then computes `base + index * stride` mathematically and checks a region of one stride. On success it writes the element address. Either failed check performs the bounds trap before the destination changes.

<div id="104-bounded-strings" class="nucleus-source-anchor"></div>

## 10.4 Bounded strings

`STRLEN base, capacity, destination` checks a positive capacity, the complete `capacity + 1` byte region, and the stored invariant `length <= capacity`. It writes the length as a canonical byte.

`STRIDX base, index, capacity, destination` performs the same object and invariant checks, then checks `index < length`. It writes `base + 1 + index`. Capacity storage beyond the current length remains inaccessible through this operation. Either instruction performs the bounds trap on failure.

<div id="105-loads" class="nucleus-source-anchor"></div>

## 10.5 Loads

`LOAD8 address, destination` checks one byte, loads it, and zero-extends it. `LOAD16 address, destination` checks two consecutive bytes and loads the little-endian word. A failed region check traps before the destination changes.

<div id="106-stores" class="nucleus-source-anchor"></div>

## 10.6 Stores

`STORE8 source, address` requires a canonical byte, checks one data byte, and stores the source. `STORE16 source, address` checks two bytes and stores the low byte followed by the high byte. A failed precondition performs no partial store.

A conforming compiler uses `STORE8` for `u8`, Boolean, and bounded-string byte destinations. It does not expose or write a bounded-string length through ordinary source assignment.

<div id="107-runtime-and-static-responsibilities" class="nucleus-source-anchor"></div>

## 10.7 Runtime and static responsibilities

The address instructions enforce the supplied dynamic region checks. They do not prove that a constant offset belongs to the nominal record type or that a stride belongs to the selected array type. Those are compiler obligations. NVM bytecode is an execution format rather than a hostile-code capability system.
