---
layout: default
title: "Appendix A — Directive Reference"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 101
---
[← Diagnostics and Output](08-diagnostics-listings-output.md) | [Manual](index.md) | [Appendix B — Expression Operators →](appendix-b-operators.md)

# Appendix A — Directive Reference

All AZM directives in canonical lowercase dotted form. Directives are case-sensitive; only the forms below are accepted by the parser. See Chapter 7 for the alias layer that normalises legacy undotted forms.

| Directive | Syntax | What it does | Ch. |
|-----------|--------|--------------|-----|
| `.org` | `.org expr` | Sets the assembly address counter to `expr`; emits nothing | 3 |
| `.equ` | `NAME .equ expr` | Binds `NAME` to the constant value of `expr`; emits nothing | 3 |
| `.db` | `.db expr[,expr…]` | Emits one or more 8-bit values; accepts string literals | 4 |
| `.dw` | `.dw expr[,expr…]` | Emits one or more 16-bit little-endian values | 4 |
| `.ds` | `.ds count[,fill]` | Reserves `count` bytes; optional `fill` byte; accepts type expressions | 4, 5 |
| `.include` | `.include "path"` | Inserts the named source file at this point | 7 |
| `.import` | `.import "path"` | Loads the named source file as a module-like unit with public `@` labels | 7 |
| `.align` | `.align n` | Advances the address to the next multiple of `n`, inserting zero bytes | 3 |
| `.cstr` | `.cstr "text"` | Emits string bytes followed by a `$00` terminator (C-style) | 4 |
| `.pstr` | `.pstr "text"` | Emits a length byte followed by string bytes (Pascal-style) | 4 |
| `.istr` | `.istr "text"` | Emits string bytes with bit 7 set on the final byte | 4 |
| `.binfrom` | `.binfrom addr` | Marks the start address of the flat binary output range | 3 |
| `.binto` | `.binto addr` | Marks the end address of the flat binary output range | 3 |
| `.end` | `.end` | Marks the end of source; AZM stops assembling at this point | — |
| `.type` | `Name .type` … `.endtype` | Opens a record layout declaration block | 5 |
| `.endtype` | `.endtype` | Closes a `.type` block | 5 |
| `.union` | `Name .union` … `.endunion` | Opens a union layout declaration block | 5 |
| `.endunion` | `.endunion` | Closes a `.union` block | 5 |
| `.field` | `name .field TypeExpr` | Declares a field of any type inside a `.type` or `.union` block | 5 |
| `.typealias` | `Name .typealias TypeExpr` | Transparent assembler-time alias for a layout type expression | 5 |
| `.enum` | `Name .enum Member[,…]` | Declares a group of integer constants with qualified names (`Name.Member`) | 3 |
| `op` / `end` | `op name(params)` … `end` | Declares an inline instruction-expansion op | 7 |

## Directive aliases

Common forms such as `DB`, `DW`, `ORG` and `EQU` are handled by the built-in alias layer automatically. Project-specific forms such as `DEFB`, `DEFW` and `RMB` require a project alias file loaded with `--aliases`. See Chapter 7.

Built-in aliases (normalized before parsing):

| Alias | Canonical |
|-------|-----------|
| `ORG` | `.org` |
| `EQU` | `.equ` |
| `DB` | `.db` |
| `DW` | `.dw` |
| `DS` | `.ds` |
| `INCLUDE` | `.include` |
| `END` | `.end` |
| `ALIGN` | `.align` |
| `CSTR` | `.cstr` |
| `PSTR` | `.pstr` |
| `ISTR` | `.istr` |
| `BINFROM` | `.binfrom` |
| `BINTO` | `.binto` |

---

## AZMDoc carrier notation

Carriers in `;!` contract blocks are comma-separated register names, flag names or register pair names. Register pairs expand to their constituent 8-bit registers during analysis:

| Pair notation | Expands to |
|--------------|------------|
| `BC` | `B,C` |
| `DE` | `D,E` |
| `HL` | `H,L` |
| `IX` | `IXH,IXL` |
| `IY` | `IYH,IYL` |
| `SP` | `SPH,SPL` |

Individual flag names: `carry`, `zero`, `sign`, `parity`, `halfCarry`. Use `carry` for the carry flag; `C` names register C. The full AZMDoc contract format is covered in Chapter 6.

---

[← Diagnostics and Output](08-diagnostics-listings-output.md) | [Manual](index.md) | [Appendix B — Expression Operators →](appendix-b-operators.md)
