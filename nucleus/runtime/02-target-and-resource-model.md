---
layout: "default"
title: "2. Target and resource model"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 2
pageClass: "nucleus-specification"
---
[← 1. Status and authority](01-status-and-authority.md) · [Contents](./) · [3. Runtime representation →](03-runtime-representation.md)

<div id="2-target-and-resource-model" class="nucleus-source-anchor"></div>

# 2. Target and resource model

<div id="21-z80-target" class="nucleus-source-anchor"></div>

## 2.1 Z80 target

The first implementation emits ordinary Z80 machine code for a flat 16-bit
address space. It is not tied to one computer, monitor, operating system, port
map, or physical memory layout. A target adapter supplies concrete source,
output, service, startup, and reporting addresses.

All runtime addresses are 16-bit target addresses. No source operation exposes,
constructs, compares, converts, or calculates with one. The compiler retains the
type and extent associated with every aggregate address carrier.

<div id="22-separate-accounts" class="nucleus-source-anchor"></div>

## 2.2 Separate accounts

The implementation reports these bounded accounts separately:

| Account            | Contents                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| Compiler core      | Z80 code and immutable data required while compiling.                            |
| Compiler workspace | Peak simultaneously live writable compiler state.                                |
| Generated program  | Emitted Z80 code, static program data, and required startup material.            |
| Target runtime     | Shared helpers, service adapter, trap support, and fixed writable runtime state. |
| Activation storage | Bounded storage used by simultaneously active routine calls.                     |
| External storage   | Source, generated-output staging, maps, manifests, and service buffers.          |

The compiler-core acceptance gate is 16 KiB. Moving required compiler code or
immutable tables into another account does not satisfy it. The target runtime
and generated program remain measured even though they do not enter that gate.
