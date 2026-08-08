---
layout: "default"
title: "5. Checked access and aggregate copying"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 5
pageClass: "nucleus-specification"
---
[← 4. Program storage and startup](04-program-storage-and-startup.md) · [Contents](./) · [6. Calls, activations, and results →](06-calls-activations-and-results.md)

<div id="5-checked-access-and-aggregate-copying" class="nucleus-source-anchor"></div>

# 5. Checked access and aggregate copying

<div id="51-region-checks" class="nucleus-source-anchor"></div>

## 5.1 Region checks

A generated access of width `w` at address `a` is permitted only when the
mathematical half-open region `[a, a + w)` lies within the selected program-data
region. The calculation must not use wrapped 16-bit arithmetic as evidence that
the region fits.

A fixed-array access first checks the unsigned index against its declared
length, then forms `base + index * stride`, and then establishes the complete
element region. A string access applies Section 3.3. Any failed check performs
`bounds` before a load, store, or alias result is produced.

The compiler may omit a runtime check only when information already proved at
that source point establishes the same condition.

<div id="52-assignment-atomicity" class="nucleus-source-anchor"></div>

## 5.2 Assignment atomicity

A scalar store checks its complete destination before writing. A failed check
performs no destination write.

Exact-type aggregate assignment establishes and checks the complete destination
region and then the complete source region before the first destination byte
changes. It copies the common fixed extent, including a bounded string's length
byte and complete capacity. Self-assignment has no effect. Nucleus types cannot
produce proper partial overlap between distinct same-type aggregate paths.

The backend may inline the copy, emit a counted loop, or call a shared helper.
For a Z80 target, `LDIR` is permitted after both complete-region checks. The
choice is private and must be measured; it does not change copy order or trap
timing.
