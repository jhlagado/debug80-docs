---
layout: "default"
title: "2. Purpose, constraints, and non-goals"
parent: "Nucleus Virtual Machine 0.1 Specification"
nav_order: 2
pageClass: "nucleus-specification"
---
[← 1. Status and conformance](01-status-and-conformance.md) · [Contents](./) · [3. Machine overview →](03-machine-overview.md)

<div id="2-purpose-constraints-and-non-goals" class="nucleus-source-anchor"></div>

# 2. Purpose, constraints, and non-goals

<div id="21-purpose" class="nucleus-source-anchor"></div>

## 2.1 Purpose

NVM is a regular compilation target for the small, streaming Nucleus compiler. The instruction set favors direct emission, predictable lengths, simple fixups, and local type-directed selection. It avoids exposing Z80 instruction irregularities to the front end.

The primary interpreter is native Z80 code in a CP/M-like 64 KiB environment. Every 0.1 field and operand therefore fits a byte or little-endian word, and all machine resources have explicit bounds.

<div id="22-resource-accounts" class="nucleus-source-anchor"></div>

## 2.2 Resource accounts

The following are separate measured accounts:

1. compiler core and required immutable compiler constants;
2. compiler writable workspace and emitted output;
3. NVM interpreter and service adapter;
4. loaded program image;
5. runtime data, slots, arguments, and activation storage; and
6. an optional native backend and its output.

The compiler-core account has the language project's hard 16 KiB bank gate. Interpreter or runtime space does not excuse compiler-core growth. This specification sets representations and minimum capacities but does not combine the accounts into a flat 63 KiB budget.

<div id="23-non-goals" class="nucleus-source-anchor"></div>

## 2.3 Non-goals

NVM is not a CPU-compatibility layer. It does not expose a source pointer model, dynamic types, garbage collection, exceptions, unwinding, destructors, branch shortening, relocation records, native register allocation, or native peephole rules.

NVM contains no dedicated `if`, `while`, `for`, `select`, pattern, aggregate-copy, or source-scope instruction. Compilers lower source constructs to the primitive operations in this book. In particular, exact-type aggregate assignment uses checked addresses plus ordinary loads and stores; it does not add an unmeasured 0.1 opcode.

Interpreter speed matters after compiler regularity and size. This priority does not permit an unbounded or incomplete interpreter.
