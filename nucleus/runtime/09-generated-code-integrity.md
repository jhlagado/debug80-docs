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
- every program-data and runtime-region non-overlap condition supplied by the
  selected target map; and
- every bounded compiler table needed to finish emission.

<div id="92-atomic-publication" class="nucleus-source-anchor"></div>

## 9.2 Atomic publication

The compiler may write tentative bytes to a bounded staging region or bulk
output while checking source. It publishes a runnable program only after the
source has been accepted and every layout, fixup, range, capacity, and target
contract check has succeeded. A diagnostic leaves no partial output identified
as runnable and does not replace a previously published runnable program.

The output format, relocation strategy, and loading transport are target
adapter choices. The adapter must not patch an unchecked value or silently
truncate an address, displacement, size, source location, or static datum.

<div id="93-source-locations" class="nucleus-source-anchor"></div>

## 9.3 Source locations

Each emitted dynamic trap site retains enough information to report the best
available source location required by the language specification. A compiler
may use a side map, inline constants, shared trap stubs with an established
location carrier, or another measured representation. Entering a shared helper
must not replace the source location with the helper's address.
