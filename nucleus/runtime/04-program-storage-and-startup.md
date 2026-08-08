---
layout: "default"
title: "4. Program storage and startup"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 4
pageClass: "nucleus-specification"
---
[← 3. Runtime representation](03-runtime-representation.md) · [Contents](./) · [5. Checked access and aggregate copying →](05-checked-access-and-aggregate-copying.md)

<div id="4-program-storage-and-startup" class="nucleus-source-anchor"></div>

# 4. Program storage and startup

<div id="41-program-objects" class="nucleus-source-anchor"></div>

## 4.1 Program objects

Every owned aggregate object and every top-level scalar variable has a fixed
address and program lifetime. Aggregate fields and array elements occupy their
containing object's storage. Routine activations contain no owned aggregate
object.

The compiler determines every program object's address, type, extent, and
initial bytes before it publishes the generated program. It must reject a data
layout whose mathematical end exceeds the selected program-data region.

<div id="42-initial-state" class="nucleus-source-anchor"></div>

## 4.2 Initial state

Before `main` begins, every program variable has its language-defined zero or
explicit static value. The startup path may clear a region and apply explicit
bytes, copy a complete prepared data image, or emit an equivalent target
sequence. It must not expose a partly initialized object to source execution.

Static words use little-endian order. Record and array initializers follow the
packed layout in Chapter 3. A bounded-string initializer writes its length and
decoded bytes; unused capacity has no source-observable value.

<div id="43-program-entry-and-exit" class="nucleus-source-anchor"></div>

## 4.3 Program entry and exit

Startup invokes `main` with no source parameters. Successful return terminates
normally. Failure returned by `main` performs `unhandled-error`. No source
routine runs before all program data is initialized.
