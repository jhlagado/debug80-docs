---
layout: default
title: "Appendix B — Expression Operators"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 102
---
[← Appendix A: Directive Reference](appendix-a-directives.md) | [Manual](index.md) | [Appendix C: CLI Flag Reference →](appendix-c-cli.md)

# Appendix B — Expression Operators

## Operator table

Operators in precedence order, lowest to highest. Operators at the same precedence level are left-associative.

| Operator | Operation | Precedence |
|----------|-----------|------------|
| `\|` | bitwise OR | 1 (lowest) |
| `^` | bitwise XOR | 2 |
| `&` | bitwise AND | 3 |
| `<<` | left shift | 4 |
| `>>` | right shift | 4 |
| `+` | add | 5 |
| `-` | subtract | 5 |
| `*` | multiply | 6 |
| `/` | integer divide | 6 |
| `%` | modulo | 6 (highest binary) |

Unary operators (highest precedence): `+` (identity), `-` (negate), `~` (bitwise NOT). Parentheses group sub-expressions and override precedence.

All expressions are evaluated by the assembler before the binary is written. An expression that depends on a register or runtime value is not an assembler expression — it is a Z80 instruction.

## Numeric literal formats

AZM accepts eight numeric literal forms. They can appear freely in any expression and can be mixed within one expression.

| Form | Example | Base | Notes |
|------|---------|------|-------|
| `$` prefix | `$FF`, `$0100` | hex | `$` not followed by a hex digit is the current assembly address |
| `0x` prefix | `0xFF`, `0x2A` | hex | prefix is case-insensitive |
| Trailing `H`/`h` | `0FFH`, `02Ah` | hex | must start with a decimal digit; `FFH` parses as a symbol name |
| `%` prefix | `%10101010`, `%1111` | binary | |
| `0b` prefix | `0b10101010`, `0b1111` | binary | prefix is case-insensitive |
| Trailing `B`/`b` | `10101010B`, `10b` | binary | |
| Plain decimal | `42`, `255`, `0` | decimal | |
| Quoted character | `'A'`, `"Z"` | ASCII value | single character; valid in any expression context |

**Trailing-`H` rule:** the token must begin with a decimal digit (`0`–`9`). `0FFH` is hex 255. `FFH` starts with a letter, so the parser reads it as a symbol name — write `$FF` or `0FFH` to force hex.

**`$` ambiguity:** `$FF` starts with `$` followed by a hex digit, so the whole token is a hex literal (255). `$` not followed by a hex digit is the current assembly address — `$ - start` gives the byte distance from a label.

`%` has two roles: a `%` at the start of a value is a binary literal prefix; a `%` between two expressions is the modulo operator.

---

[← Appendix A: Directive Reference](appendix-a-directives.md) | [Manual](index.md) | [Appendix C: CLI Flag Reference →](appendix-c-cli.md)
