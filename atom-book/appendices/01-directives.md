---
layout: default
title: "Appendix 1 — Directive Reference"
parent: "Atom and Z80 Reference"
grand_parent: "Atom Books"
nav_order: 1
nav_group: "Assembler reference"
---

# Appendix 1 — Directive Reference

Atom has two directive groups. Bare assembler directives control assembly.
`%` directives control source preparation and are removed before assembly.
Both groups are case-insensitive.

## Assembler directives

| Directive | Syntax | Effect | Hosts |
| --- | --- | --- | --- |
| `EQU` | `NAME EQU EXPR` or `NAME: EQU EXPR` | Declares one resolved constant without changing private scope | Desktop, CP/M |
| `ORG` | `ORG EXPR` | Sets the logical output cursor; emits no byte | Desktop, CP/M |
| `DB` | `DB ITEM[,ITEM…]` | Emits low bytes from expressions and decoded double-quoted strings | Desktop, CP/M |
| `DW` | `DW EXPR[,EXPR…]` | Emits little-endian words | Desktop, CP/M |
| `DS` | `DS COUNT` | Reserves uninitialised bytes and advances the cursor | Desktop, CP/M |
| `DS` | `DS COUNT,FILL` | Emits `COUNT` initialized fill bytes | Desktop, CP/M |
| `ALIGN` | `ALIGN BOUNDARY` | Emits zeros to the next address divisible by a positive boundary | Desktop, CP/M |
| `INCBIN` | `INCBIN "PATH"` | Emits one complete confined host binary snapshot | Desktop |
| `CSTR` | `CSTR "TEXT"` | Emits decoded bytes followed by zero | Desktop, CP/M |
| `PSTR` | `PSTR "TEXT"` | Emits a decoded-byte count followed by the bytes | Desktop, CP/M |
| `ISTR` | `ISTR "TEXT"` | Sets bit 7 on the final decoded byte; empty text emits nothing | Desktop, CP/M |

Dotted directive aliases are invalid. A leading period begins a private symbol:

```asm
ORG 4000H       ; ASSEMBLER DIRECTIVE
.ORG:           ; PRIVATE LABEL
```

`EQU`, `ORG`, `DS`, and `ALIGN` require already resolved expressions. `DB` and
`DW` accept Atom's restricted forward affine form.

## Preprocessor directives

| Directive | Syntax | Effect | Hosts |
| --- | --- | --- | --- |
| `%DEFINE` | `%DEFINE NAME VALUE` | Binds one immutable 16-bit host value in the entry header | Desktop |
| `%INCLUDE` | `%INCLUDE "PATH"` | Adds one import-once dependency edge from a leading part header | Desktop, CP/M |
| `%IF` | `%IF VALUE` | Selects the following branch when the value is non-zero | Desktop |
| `%ELSE` | `%ELSE` | Selects the alternate branch | Desktop |
| `%ENDIF` | `%ENDIF` | Closes the current host conditional | Desktop |

`%DEFINE` performs no source substitution and declares no assembler symbol.
Dependencies may test entry definitions but may not add definitions. Body
conditionals may select ordinary source but cannot add includes or definitions.

The desktop preprocessor replaces directive and inactive lines with spaces
while preserving CR and LF bytes. The CP/M provider validates leading
`%INCLUDE` directives and turns them into assembler comments. Both retain the
original line and byte positions for diagnostics.
