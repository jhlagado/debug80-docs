---
layout: default
title: "Appendix 5 — Limits and Capacities"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 5
---

# Appendix 5 — Limits and Capacities

## Source projects

| Limit | Value |
| --- | ---: |
| Ordered source parts | 1 through 255 |
| Bytes in one source part | 0 through 65,535 |
| Dependency depth, including the entry file | 64 |
| Project-relative path | 255 ASCII bytes |
| Total retained project-relative paths | 65,536 bytes |
| One `INCBIN` file | 0 through 65,535 bytes |

`%INCLUDE` adds each dependency once, so the part limit applies to distinct
files in the resolved project rather than to the number of `%INCLUDE` lines.
The total source may exceed 65,535 bytes as long as no individual part exceeds
that size.

Atom currently produces one flat output image in bank zero. The output target
is a non-wrapping range whose exclusive end may be no greater than `$FFFF`.
With a start address of zero, the largest target capacity is therefore 65,535
bytes, covering `$0000` through `$FFFE`.

## Symbols and forward references

| Default command configuration | Capacity |
| --- | ---: |
| Simultaneous symbols | 1,664 |
| Simultaneous unresolved references | 694 |

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
