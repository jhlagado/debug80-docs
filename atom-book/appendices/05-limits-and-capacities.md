---
layout: default
title: "Appendix 5 — Limits and Capacities"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 5
---

# Appendix 5 — Limits and Capacities

The native image and Mac proof map establish the current measured limits.

## Resident image

| Item | Bytes |
| --- | ---: |
| Z80 code and immutable tables | 11,648 |
| Fixed non-reentrant workspace | 453 |
| Linked resident extent | 12,101 |
| Margin below 16 KiB | 4,283 |

Caller-owned source, symbol, pending, descriptor, and stack storage are outside
the resident image account.

## Native source and output

| Limit | Value |
| --- | ---: |
| Ordered source parts | 1 through 16 |
| Bytes in one Mac source page | 24,576 |
| Output banks | One, bank zero |
| Encoded instruction length | 1 through 4 bytes |
| Build descriptor | 15 bytes |
| Complete 16-part descriptor array | 80 bytes |
| One `INCBIN` input | 0 through 65,535 bytes |

The target is a non-wrapping half-open 16-bit range whose mathematical end is
at most `$FFFF`. Starting at zero therefore permits a maximum capacity of
65,535 bytes, covering `$0000` through `$FFFE`.

## Symbols and pending references

| Record | Bytes |
| --- | ---: |
| Exact symbol | 8 |
| Pending reference | 6 |

A symbol name contains one through eight significant RADIX-40 characters. A
private name has a separate leading period. Globals remain for the complete
build; private records remain only in the current global scope.

The Mac proof map assigns 13,312 bytes to symbols, holding 1,664 simultaneous
records, and 2,560 bytes to pending references, holding 426 complete records.

## Expressions and values

| Limit | Value |
| --- | ---: |
| Value-stack entries | 16 |
| Operator-stack entries | 16 |
| Concrete final word domain | −32,768 through 65,535 |
| Shift count | 0 through 23 |
| Forward affine addend | −128 through 127 |
| Relative displacement | −128 through 127 |
| Immediate byte and port | 0 through 255 |
| IX/IY displacement | −128 through 127 |

## Host graph

| Preparation limit | Default |
| --- | ---: |
| General graph parts | 255; lowered to 16 for native Atom |
| Dependency depth including entry | 64 |
| Logical path | 255 ASCII bytes |
| Retained logical paths | 65,536 bytes |
| SP1 bank ordinal | 0 through 255; zero for native Atom |

The default Mac execution budgets are 200,000,000 native instructions and
2,000,000,000 T-states. The current measured self-build uses 163,392,529
instructions and 1,492,523,777 T-states.

These Mac capacities are not a TEC-1 RAM map. Fixed workspace, maximum Mac
symbol and pending arenas, descriptors, and a 256-byte stack consume 16,774
bytes before a source buffer or operating adapter is added.
