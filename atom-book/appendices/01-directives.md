---
title: "Directive Reference"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 101
nav_group: "Reference tables"
---

# Directive Reference

Atom has two directive groups. Bare assembler directives control assembly.
`%` directives control source preparation and are removed before assembly.
Both groups are case-insensitive.

## Assembler directives

| Directive | Syntax | Effect | Hosts |
| --- | --- | --- | --- |
| `EQU` | `NAME EQU EXPR` or `NAME: EQU EXPR` | Declares one resolved constant without changing private scope | Node, CP/M |
| `ORG` | `ORG EXPR` | Sets the logical output cursor; emits no byte | Node, CP/M |
| `DB` | `DB ITEM[,ITEM…]` | Emits low bytes from expressions and decoded double-quoted strings | Node, CP/M |
| `DW` | `DW EXPR[,EXPR…]` | Emits little-endian words | Node, CP/M |
| `DS` | `DS COUNT` | Reserves uninitialised bytes and advances the cursor | Node, CP/M |
| `DS` | `DS COUNT,FILL` | Emits `COUNT` initialized fill bytes | Node, CP/M |
| `ALIGN` | `ALIGN BOUNDARY` | Emits zeros to the next address divisible by a positive boundary | Node, CP/M |
| `INCBIN` | `INCBIN "PATH"[,COUNT]` | Emits the first `COUNT` bytes of a binary file, or the whole file on Node when `COUNT` is omitted | Node, CP/M |
| `CSTR` | `CSTR "TEXT"` | Emits decoded bytes followed by zero | Node, CP/M |
| `PSTR` | `PSTR "TEXT"` | Emits a decoded-byte count followed by the bytes | Node, CP/M |
| `ISTR` | `ISTR "TEXT"` | Sets bit 7 on the final decoded byte; empty text emits nothing | Node, CP/M |

Dotted directive aliases are invalid. A leading period begins a private symbol:

```asm
ORG 4000H       ; ASSEMBLER DIRECTIVE
.ORG:           ; PRIVATE LABEL
```

`EQU`, `ORG`, `DS`, and `ALIGN` require already resolved expressions. `DB` and
`DW` accept Atom's restricted forward affine form. The `INCBIN` count is a
numeric literal. CP/M requires it and uses a current-drive 8.3 name for
`PATH`.

## Preprocessor directives

| Directive | Syntax | Effect | Hosts |
| --- | --- | --- | --- |
| `%DEFINE` | `%DEFINE NAME VALUE` | Binds one immutable 16-bit host value in the entry header | Node, CP/M |
| `%INCLUDE` | `%INCLUDE "PATH"` | Adds one import-once dependency edge from a leading part header | Node, CP/M |
| `%IF` | `%IF VALUE` | Selects the following branch when the value is non-zero | Node, CP/M |
| `%ELSE` | `%ELSE` | Selects the alternate branch | Node, CP/M |
| `%ENDIF` | `%ENDIF` | Closes the current host conditional | Node, CP/M |

`%DEFINE` performs no source substitution and declares no assembler symbol.
Dependencies may test entry definitions but may not add definitions. Body
conditionals may select ordinary source but cannot add includes or definitions.

The Node preprocessor replaces directive and inactive lines with spaces
while preserving CR and LF bytes. The CP/M preprocessor turns each directive
into an assembler comment and masks inactive lines. Both retain the original
line and byte positions for diagnostics.

On CP/M, `%DEFINE` lines must come before any `%INCLUDE` or conditional
directive, with at most 32 definitions. Conditionals nest up to 16 levels.
