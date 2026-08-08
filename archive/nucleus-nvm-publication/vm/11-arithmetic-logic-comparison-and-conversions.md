---
layout: "default"
title: "11. Arithmetic, logic, comparison, and conversions"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 11
pageClass: "nucleus-specification"
---
[← 10. Data movement and memory access](10-data-movement-and-memory-access.md) · [Contents](./) · [12. Primitive control flow →](12-primitive-control-flow.md)

<div id="11-arithmetic-logic-comparison-and-conversions" class="nucleus-source-anchor"></div>

# 11. Arithmetic, logic, comparison, and conversions

<div id="111-width-rule" class="nucleus-source-anchor"></div>

## 11.1 Width rule

An `8` instruction requires canonical byte sources, reads their low bytes, and writes a zero-extended byte. A `16` instruction reads and writes complete words. Sources are read before any destination is written, so a source and destination may name the same slot.

<div id="112-modular-arithmetic" class="nucleus-source-anchor"></div>

## 11.2 Modular arithmetic

`ADD`, `SUB`, and `MUL` write the mathematical result modulo 256 or 65,536 according to the suffix. `NEG` writes zero minus the source under the same modulus. Overflow and underflow are defined wraparound and do not trap.

<div id="113-division" class="nucleus-source-anchor"></div>

## 11.3 Division

`DIV8` and `DIV16` perform unsigned integer division and discard the remainder. A zero divisor performs the division-by-zero trap before the destination changes.

<div id="114-integer-logic" class="nucleus-source-anchor"></div>

## 11.4 Integer logic

`AND`, `OR`, and `NOT` combine or complement the bits in the selected width. They implement the integer meanings of the source words. The source language has no `xor`, shift, rotate, or remainder operator, so NVM 0.1 assigns no opcode for one.

<div id="115-boolean-logic" class="nucleus-source-anchor"></div>

## 11.5 Boolean logic

`LNOT` requires a canonical Boolean and writes one minus that value. Boolean `and` and `or` have no opcode: the compiler lowers short-circuit behavior with `JZ`, `JNZ`, and primitive blocks so an omitted right operand performs no operation.

<div id="116-checked-narrowing" class="nucleus-source-anchor"></div>

## 11.6 Checked narrowing

`NARROW8 source, destination` writes the source only when it is at most 255. A larger source performs the narrowing trap. It does not mask or wrap. A compiler may omit it only after proving the source in range.

<div id="117-comparisons" class="nucleus-source-anchor"></div>

## 11.7 Comparisons

Every comparison reads two unsigned operands in its selected width and writes a canonical Boolean. `EQ`, `NE`, `LT`, `LE`, `GT`, and `GE` have their ordinary mathematical relations. Boolean equality and inequality use the byte family; a conforming compiler does not emit Boolean ordering.
