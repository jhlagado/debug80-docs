---
layout: default
title: "Appendix 5 — Limits and Capacities"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 5
nav_group: "Assembler reference"
---

# Appendix 5 — Limits and Capacities

## Source projects

| Limit | Value |
| --- | ---: |
| Ordered source parts | 1 through 255 |
| Bytes in one source part | 0 through 65,535 |
| Dependency depth, including the entry file | 64 |
| Desktop project-relative path | 255 ASCII bytes |
| Desktop retained project-relative paths | 65,536 bytes |
| One desktop `INCBIN` file | 0 through 65,535 bytes |

`%INCLUDE` adds each dependency once, so the part limit applies to distinct
files in the resolved project rather than to the number of `%INCLUDE` lines.
The total source may exceed 65,535 bytes as long as no individual part exceeds
that size.

The desktop host keeps immutable source snapshots outside emulated Z80 memory
and returns bytes to the assembler as requested. Native CP/M reads each part
through a 128-byte random-record cache. Neither host needs to fit a complete
multipart source tree in Z80 RAM.

Native CP/M uses current-drive 8.3 names instead of project-relative paths.

## Output profiles

Atom currently produces one flat output image in bank zero.

| Profile | Output capacity | Placement |
| --- | ---: | --- |
| Desktop `generic` | At most 65,535 bytes | Source `ORG` within the flat 16-bit range |
| Desktop `cpm22` | At most 65,279 bytes | Load and entry at `$0100` |
| Native CP/M 2.2 | 18,304 bytes | `$0100` through `$487F` |

The generic target uses a non-wrapping half-open range whose mathematical end
may be no greater than `$FFFF`. Starting at zero therefore covers `$0000`
through `$FFFE`. The native CP/M limit is set by that program's measured TPA
memory map, not by the Atom source language.

## Symbols and forward references

| Host configuration | Simultaneous symbols | Simultaneous unresolved references |
| --- | ---: | ---: |
| Desktop command | 1,664 | 694 |
| Native CP/M 2.2 | 1,536 | 585 |

Global symbols remain for the entire build. Private symbols are discarded
when the next global label begins, so only the current private scope counts
towards the simultaneous-symbol limit. An unresolved reference stops consuming
pending space as soon as its symbol is declared and its output bytes are
patched.

Names contain one through eight significant characters. A private name has a
separate leading period, so it may occupy nine source characters. Atom rejects
longer names rather than shortening them.

## Expressions and fields

| Limit | Value |
| --- | ---: |
| Value-stack entries | 16 |
| Operator-stack entries | 16 |
| Concrete final expression | −32,768 through 65,535 |
| Shift count | 0 through 23 |
| Forward affine addend | −128 through 127 |
| Relative displacement | −128 through 127 |
| Immediate byte and port | 0 through 255 |
| IX/IY displacement | −128 through 127 |
| Encoded instruction length | 1 through 4 bytes |

`RST` accepts 0, 8, 16, 24, 32, 40, 48, or 56. `IM` accepts 0, 1, or 2.
The directive and instruction references describe where a value is checked,
truncated, or deferred until a forward symbol is declared.
