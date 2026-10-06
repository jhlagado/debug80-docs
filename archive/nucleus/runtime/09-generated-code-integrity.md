---
layout: "default"
title: "9. Generated-code integrity"
parent: "Nucleus Z80 Runtime and Backend Contract 0.1"
nav_order: 9
pageClass: "nucleus-specification"
---
[← 8. System-service boundary](08-system-service-boundary.md) · [Contents](./) · [10. Conformance and measurement →](10-conformance-and-measurement.md)

<div id="9-generated-code-integrity" class="nucleus-source-anchor"></div>

# 9. Generated-code integrity

<div id="91-compiler-controlled-output" class="nucleus-source-anchor"></div>

## 9.1 Compiler-controlled output

The first compiler is the only producer required for standard generated Z80
programs. Nucleus therefore requires no portable loader, hostile-code
validator, opcode decoder, or serialized routine table.

The compiler must nevertheless verify every fact that its generated program
depends on before publication. At minimum it checks:

- output-region capacity and all size arithmetic;
- every data address and complete object extent;
- every absolute and relative branch or call fixup;
- every required target-runtime entry address;
- every image, writable, and established-stack condition in Chapter 2; and
- every bounded compiler table needed to finish emission.

<div id="92-append-only-object-records" class="nucleus-source-anchor"></div>

## 9.2 Append-only object records

The compiler-and-adapter object interface is the ordered logical record stream
encoded by the [Nucleus Object Stream Format](https://github.com/jhlagado/nucleus/blob/main/docs/nucleus-object-format.md). The
adapter adds profile-only fields, including image fill, without adding them to
the compact compiler descriptor. Its record classes are:

| Record   | Required fields                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------- |
| `begin`  | format revision, runtime identity, flat or banked form, bank count, image bases, capacities, and fill byte |
| `image`  | bank ordinal, 16-bit target address, nonempty byte payload                                                 |
| `patch`  | bank ordinal, 16-bit target address, nonempty final replacement-byte payload                               |
| `map`    | the complete publication fields in Section 9.5                                                             |
| `commit` | entry bank and address, preceding record count, and encoding integrity fields                              |

A flat object uses bank ordinal zero and one image region. Exactly one `begin`
record comes first. Image records follow it and do not overlap one another.
They provide startup, the selected runtime, read-only and initialized-load
bytes, and generated code. Image and patch records together determine every
non-fill byte in the committed used extents. A payload occupies increasing
target addresses and cannot cross a bank boundary.

Patch records follow the last image record. A patch may replace an emitted byte
or an implicit image-fill byte. Patch addresses may appear in resolution order
rather than target-address order. Their extents must not overlap, must remain
inside the committed used extent, and must contain only fully resolved and
range-checked replacement bytes. Exactly one map record follows the patches.
Exactly one commit record comes last. No record may follow commit.

The compiler retains bounded source symbols and currently unresolved fixup
metadata while it emits image records. It may not retain complete bank images
or generated routines merely to patch them later, and it does not retain the
selected runtime image. It emits placeholder bytes at unresolved sites and
calculates each final absolute word or relative byte during the same
compilation. The output sink accepts each resolved patch into a separate
append-only spool, then serializes that spool after the image spool. The patch
consumer performs byte replacement only. It never resolves a source name,
branch kind, or relocation expression and is not a linker.

NOBJ is the standard stored-object envelope. Intel HEX, raw binary, `.COM`,
serial framing, and device images remain materialized delivery formats rather
than compiler output formats.

<div id="93-atomic-commit-and-consumption" class="nucleus-source-anchor"></div>

## 9.3 Atomic commit and consumption

The object sink accepts `begin`, `image`, `runtimeImage`,
`runtimeInitialImage`, `patch`, `map`, `commit`, and `abort`. `runtimeImage`
obtains fully linked helper bytes for the validated context from the
operating-layer provider. `runtimeInitialImage` obtains that identity's
resolved vector table and fixed initial writable-state bytes for the same
context. Both append ordinary image records and have no distinct wire
representation. The sink maintains separate sequential image
and patch spools, then drains or chains them in NOBJ order. Only a stream with
a valid terminal commit is published and runnable. A diagnostic or sink failure
aborts the current generation; an incomplete stream cannot replace the prior
committed generation. The compiler therefore needs no image rollback, runtime
blob, or routine buffer. The sink supplies serialized framing, record count,
and integrity fields while it forms the final order. The commit integrity
fields cover every preceding record, and the compiler does not reread the
object.

A consumer validates the complete committed stream before exposing it as a
runnable program. It initializes each output image with the profile fill byte,
applies image records, then applies patch records, and publishes the materialized
result atomically. A RAM loader uses a private or non-runnable load area until
validation is complete. A ROM utility materializes and patches the images
before invoking a separate programmer or burner.

A direct wire loader can materialize a banked object in one pass only when it
has isolated writable backing for every selected bank. Otherwise it stores the
NOBJ and materializes the banks during a later read. A flat loader may write
directly when one isolated target extent fits available RAM.

The adapter must not patch an unchecked value or silently truncate a bank,
address, displacement, size, source location, or static datum. It must reject
an invalid record order, overlap, range, target, integrity value, or missing
commit.

<div id="94-source-locations" class="nucleus-source-anchor"></div>

## 9.4 Source locations

Each emitted dynamic trap site retains enough information to report the best
available source location required by the language specification. A compiler
may use a side map, inline constants, shared trap stubs with an established
location carrier, or another measured representation. Entering a shared helper
must not replace the source location with the helper's address.

<div id="95-published-map" class="nucleus-source-anchor"></div>

## 9.5 Published map

The committed artifact reports at least its runtime identity, vector layout,
object format revision, image fill byte, entry bank and address, source-part
bank mapping, bank-tagged image-record extents, first free image address per
bank, initialized-data run extent, BSS run extent, aggregate-constant extent,
writable region, stack mode, and measured stack requirement. The report
distinguishes used lengths from capacities. Host tools may add hardware
selector values, device offsets, or filenames, but those values do not enter
source semantics.
