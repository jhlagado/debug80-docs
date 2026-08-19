---
layout: default
title: "Appendix 1 — Directive Reference"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 1
---

# Appendix 1 — Directive Reference

Atom has two directive groups. Bare assembler directives control assembly.
`%` directives control source preparation and are removed before assembly.
Both groups are case-insensitive.

## Assembler directives

| Directive | Syntax | Effect |
| --- | --- | --- |
| `EQU` | `NAME EQU EXPR` or `NAME: EQU EXPR` | Declares one resolved constant without changing private scope |
| `ORG` | `ORG EXPR` | Sets the logical output cursor; emits no byte |
| `DB` | `DB ITEM[,ITEM…]` | Emits low bytes from expressions and decoded double-quoted strings |
| `DW` | `DW EXPR[,EXPR…]` | Emits little-endian words |
| `DS` | `DS COUNT` | Reserves uninitialised bytes and advances the cursor |
| `DS` | `DS COUNT,FILL` | Emits `COUNT` initialized fill bytes |
| `ALIGN` | `ALIGN BOUNDARY` | Emits zeros to the next address divisible by a positive boundary |
| `INCBIN` | `INCBIN "PATH"` | Emits one complete confined host binary snapshot |
| `CSTR` | `CSTR "TEXT"` | Emits decoded bytes followed by zero |
| `PSTR` | `PSTR "TEXT"` | Emits a decoded-byte count followed by the bytes |
| `ISTR` | `ISTR "TEXT"` | Sets bit 7 on the final decoded byte; empty text emits nothing |

Dotted directive aliases are invalid. A leading period begins a private symbol:

```asm
ORG 4000H       ; ASSEMBLER DIRECTIVE
.ORG:           ; PRIVATE LABEL
```

`EQU`, `ORG`, `DS`, and `ALIGN` require already resolved expressions. `DB` and
`DW` accept Atom's restricted forward affine form.

## Preprocessor directives

| Directive | Syntax | Effect |
| --- | --- | --- |
| `%DEFINE` | `%DEFINE NAME VALUE` | Binds one immutable 16-bit host value in the entry header |
| `%INCLUDE` | `%INCLUDE "PATH"` | Adds one import-once dependency edge from a leading part header |
| `%IF` | `%IF VALUE` | Selects the following branch when the value is non-zero |
| `%ELSE` | `%ELSE` | Selects the alternate branch |
| `%ENDIF` | `%ENDIF` | Closes the current host conditional |

`%DEFINE` performs no source substitution and declares no assembler symbol.
Dependencies may test entry definitions but may not add definitions. Body
conditionals may select ordinary source but cannot add includes or definitions.

The preprocessor replaces directive and inactive lines with spaces while
preserving CR and LF bytes, so diagnostics retain their original line and
column positions.
