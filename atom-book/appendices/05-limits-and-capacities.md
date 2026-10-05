---
title: "Limits and Capacities"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 105
nav_group: "Reference tables"
---

# Limits and Capacities

## Source projects

| Limit | Value |
| --- | ---: |
| Ordered source parts | 1 through 255 |
| Bytes in one source part | 0 through 65,535 |
| Node project-relative path | 255 ASCII bytes |
| Node retained project-relative paths | 65,536 bytes |
| One Node `INCBIN` file | 0 through 65,535 bytes |
| CP/M `%DEFINE` values | 32 |
| CP/M `%DEFINE` name | 17 characters |
| CP/M conditional nesting | 16 levels |
| CP/M active `INCBIN` statements | 32 |

`%INCLUDE` adds each dependency once, so the part limit applies to distinct
files in the resolved project rather than to the number of `%INCLUDE` lines.
The total source may exceed 65,535 bytes as long as no individual part exceeds
that size.

The Node host keeps immutable source snapshots outside emulated Z80 memory
and returns bytes to the assembler as requested. CP/M reads each part
through a 128-byte random-record cache. Neither host needs to fit a complete
multipart source tree in Z80 RAM.

CP/M uses current-drive 8.3 names instead of project-relative paths.

## Output profiles

Atom currently produces one flat output image in bank zero.

| Profile | Output capacity | Placement |
| --- | ---: | --- |
| Node `generic` | At most 65,535 bytes | Source `ORG` within the flat 16-bit range |
| Node `cpm22` | At most 65,279 bytes | Load and entry at `$0100` |
| CP/M 2.2 | 65,280 bytes | `$0100` through `$FFFF` |

The Node defaults reserve a range ending just before `$FFFF`. The
programming API accepts an explicit range ending at `$10000`, with capacity
still limited to 65,535 bytes. CP/M output can use the final address.
Its image limit is independent of the RAM available to load and run that
program. The [CP/M guide](../using-atom-on-cpm.md#limits-and-current-boundaries)
gives the minimum memory requirement and disk-space constraints.

## Symbols and forward references

| Host configuration | Simultaneous symbols | Simultaneous unresolved references |
| --- | ---: | ---: |
| Node command | 3,040 | 1,170 |
| CP/M 2.2 | 1,536 | 585 |

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
