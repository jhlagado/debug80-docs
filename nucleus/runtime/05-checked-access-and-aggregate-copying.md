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
mathematical half-open region `[a, a + w)` lies wholly within either the used
writable region or the generated read-only-data region. The calculation must
not use wrapped 16-bit arithmetic as evidence that the region fits.

A fixed-array access first rejects a negative signed index, then checks its
unsigned magnitude against the declared length, forms `base + index * stride`,
and establishes the complete element region. Selecting an array element yields
that inner array's ordinary carrier, so a following index repeats the same
check with the inner length and stride rather than flattening the dimensions.
An open-array access performs the same sequence with the retained count word as
its outer bound and the statically known element extent as its stride. A string
access applies the same negative-index rule before Section 3.3's length check.
Any failed check performs `bounds` before a load, store, or alias result is
produced.

The compiler may omit a runtime check only when information already proved at
that source point establishes the same condition.

<div id="52-assignment-atomicity" class="nucleus-source-anchor"></div>

## 5.2 Assignment atomicity

A scalar store checks its complete destination before writing. A failed check
performs no destination write.

Exact-type aggregate assignment establishes and checks the complete destination
region and then the complete source region before the first destination byte
changes. It copies the common fixed extent, including a bounded string's length
byte, complete capacity, and permanent terminator. Self-assignment has no
effect. Nucleus types cannot produce proper partial overlap between distinct
same-type aggregate paths. An open-string or open-array view is not a
whole-object assignment operand.

Checked open-string length assignment follows the same atomicity boundary. The
complete-region check, old-length check, and new-length check all precede
mutation. Shrinking clears the removed content before the helper publishes the
new length. A failed check leaves the length, payload, zero tail, permanent
terminator, and surrounding bytes unchanged.

The source checker rejects an assignment rooted directly at an aggregate
constant. The runtime carrier has no read-only bit, so an alias derived from a
constant uses the same region and copy checks as another aggregate alias. A
target may map generated read-only data to RAM, ROM, or protected memory. A
physical write through such an alias may therefore change bytes, be ignored, or
be rejected by the target; the language requires no dynamic permission check.

The backend may inline the copy, emit a counted loop, or call a shared helper.
For a Z80 target, `LDIR` is permitted after both complete-region checks. The
choice is private and must be measured; it does not change copy order or trap
timing.

<div id="53-generated-integer-selection" class="nucleus-source-anchor"></div>

## 5.3 Generated integer selection

The direct Z80 backend evaluates a `select` expression once and retains its
canonical scalar word on the hardware expression stack. Each case item emits
one comparison against that retained word and a conditional branch to the
case body. A `u8` selector compares the low byte; `u16`, `i8`, and `i16`
selectors use word equality after the compiler has normalized the constant to
the selector's exact type.

Every path discards the retained selector exactly once before it enters a case
body, enters `else`, or continues after an unmatched selection. Case bodies
therefore begin with the same generated stack shape as the statement that
contains the `select`. Normal completion of a selected body branches to one
common exit; it cannot enter the following case body.

The comparison chain and its fixups are generated-program bytes. `select`
adds no selected-runtime helper, vector entry, writable runtime state, or
activation field.
