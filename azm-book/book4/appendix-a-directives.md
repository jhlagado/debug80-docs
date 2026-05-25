---
layout: default
title: "Appendix A — Directive Reference"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 101
---
[← Porting, Style and Reference](09-porting-style-reference.md) | [Manual](index.md) | [Appendix B — Expression Operators →](appendix-b-operators.md)

# Appendix A — Directive Reference

All AZM directives in canonical lowercase dotted form. Directives are case-sensitive; only the spellings below are accepted by the parser. See Chapter 7 for the alias layer that normalises legacy undotted spellings.

| Directive | Syntax | What it does | Ch. |
|-----------|--------|--------------|-----|
| `.org` | `.org expr` | Sets the assembly address counter to `expr`; emits nothing | 3 |
| `.equ` | `NAME .equ expr` | Binds `NAME` to the constant value of `expr`; emits nothing | 3 |
| `.db` | `.db expr[,expr…]` | Emits one or more 8-bit values; accepts string literals | 4 |
| `.dw` | `.dw expr[,expr…]` | Emits one or more 16-bit little-endian values | 4 |
| `.ds` | `.ds count[,fill]` | Reserves `count` bytes; optional `fill` byte; accepts type expressions | 4, 5 |
| `.include` | `.include "path"` | Inserts the named source file at this point | 4 |
| `.align` | `.align n` | Advances the address to the next multiple of `n`, inserting zero bytes | 3 |
| `.cstr` | `.cstr "text"` | Emits string bytes followed by a `$00` terminator (C-style) | 4 |
| `.pstr` | `.pstr "text"` | Emits a length byte followed by string bytes (Pascal-style) | 4 |
| `.istr` | `.istr "text"` | Emits string bytes with bit 7 set on the final byte | 4 |
| `.binfrom` | `.binfrom addr` | Marks the start address of the flat binary output range | 3 |
| `.binto` | `.binto addr` | Marks the end address of the flat binary output range | 3 |
| `.end` | `.end` | Marks the end of source; AZM stops assembling at this point | — |
| `.type` | `.type Name` … `.endtype` | Opens a record layout declaration block | 5 |
| `.endtype` | `.endtype` | Closes a `.type` block | 5 |
| `.union` | `.union Name` … `.endunion` | Opens a union layout declaration block | 5 |
| `.endunion` | `.endunion` | Closes a `.union` block | 5 |
| `.field` | `name .field TypeExpr` | Declares a field of any type inside a `.type` or `.union` block | 5 |
| `.byte` | `name .byte` | Declares a 1-byte field inside `.type` or `.union`; shorthand for `.field byte` | 5 |
| `.word` | `name .word` | Declares a 2-byte field inside `.type` or `.union`; shorthand for `.field word` | 5 |
| `.addr` | `name .addr` | Declares a 2-byte address-sized field inside `.type` or `.union` | 5 |
| `enum` | `enum Name Member[,…]` | Declares a group of integer constants with qualified names (`Name.Member`) | 3 |
| `op` / `end` | `op name(params)` … `end` | Declares an inline instruction-expansion op | 7 |

## Directive aliases

Directive aliases are normalized before parsing. Common forms such as `DB`, `DW` and `ORG` are handled by the built-in alias layer automatically. Project-specific forms such as `DEFB`, `DEFW` and `RMB` require a project alias file loaded with `--aliases`. See Chapter 7.

---

[← Porting, Style and Reference](09-porting-style-reference.md) | [Manual](index.md) | [Appendix B — Expression Operators →](appendix-b-operators.md)
