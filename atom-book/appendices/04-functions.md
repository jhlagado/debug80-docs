---
layout: default
title: "Appendix 4 — Built-in Functions"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 4
---

# Appendix 4 — Built-in Functions

Atom has two byte-selection functions. Both are case-insensitive and run at
assembly time.

## `LOW(EXPR)`

`LOW` returns bits 0 through 7:

```text
LOW(VALUE) = VALUE & $FF
```

```asm
ADDRESS EQU 0C432H
DB LOW(ADDRESS)       ; EMITS $32
```

## `HIGH(EXPR)`

`HIGH` returns bits 8 through 15:

```text
HIGH(VALUE) = (VALUE >> 8) & $FF
```

```asm
ADDRESS EQU 0C432H
DB HIGH(ADDRESS)      ; EMITS $C4
```

## Forward use

Each function may wrap one forward affine expression:

```asm
DB LOW(TARGET+2),HIGH(TARGET+2)
```

The function must be the outermost operation. A further operation such as
`LOW(TARGET)+1` is rejected. Relative branches and IX/IY displacements require
their own resolution-time range calculations and cannot use a forward byte
function.

`LOW` and `HIGH` are ordinary legal symbol names when they are not followed by
an opening parenthesis.
