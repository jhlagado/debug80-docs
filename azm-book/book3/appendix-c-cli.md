---
layout: default
title: "Appendix C — CLI Flag Reference"
parent: "AZM Book 3 — Assembler Manual"
nav_order: 103
---
[← Appendix B — Expression Operators](appendix-b-operators.md) | [Manual](index.md) | [Appendix D — Built-in Functions →](appendix-d-functions.md)

# Appendix C — CLI Flag Reference

The source file is always the last argument:

```sh
azm [flags] source.asm
```

**Default invocation:**

```sh
azm source.asm
```

Produces three output files next to the source: `source.bin`, `source.hex`, `source.d8.json`.

---

## Output control

| Flag | Argument | What it does |
|------|----------|--------------|
| `--output` | `path` | Write primary output to `path` instead of the default location |
| `--type` | `bin` or `hex` | Primary output format; default is `hex` |
| `--nobin` | — | Suppress `.bin` flat binary output |
| `--nohex` | — | Suppress `.hex` Intel HEX output |
| `--nod8m` | — | Suppress `.d8.json` Debug80 source map |
| `--source-root` | `path` | Write source paths in `.d8.json` relative to this root (for portable maps) |
| `--asm80` | — | Write a `.z80` lowered-ASM80 source file alongside other artifacts |

## Source and include flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `-I` | `dir` | Add `dir` to the include search path; repeatable |
| `--aliases` | `file` | Load a JSON alias profile; repeatable for multiple files |
| `--interface` | `file` | Load an `.asmi` external register-care contract file; repeatable |

## Register-care flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `--rc` | `audit`, `warn`, `error` or `strict` | Register-care analysis level; default is `off` |
| `--contracts` | — | Write inferred `;!` contract blocks above every `@`-labelled routine |
| `--fix` | — | Apply conservative register-care source repairs |
| `--reg-report` | — | Write `source.regcare.txt` with inferred contracts for every `@` routine |
| `--reg-interface` | — | Write `source.asmi` with `extern` contract records for every `@` routine |
| `--reg-profile` | `mon3` | Load a built-in register-care summary profile for known ROM environments |
| `--accept-out` | `NAME:REG` | Promote an inferred clobber of `REG` in routine `NAME` to an intentional output |

## Case and compatibility flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `--case-style` | `upper`, `lower`, `consistent`, `off` | Enforce case style for mnemonics and register names; emits `AZMN_CASE_STYLE` on violations |

## Other flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `--version` | — | Print the AZM version string and exit |

---

## `--rc` levels

| Level | Effect |
|-------|--------|
| `off` | No register-care analysis (default) |
| `audit` | Infer contracts; write no diagnostics; safe to run on any project |
| `warn` | Report conflicts as warnings; build succeeds |
| `error` | Fail the build on any unresolved conflict |
| `strict` | Fail on any unresolved contract, not just conflicts |

---

[← Appendix B — Expression Operators](appendix-b-operators.md) | [Manual](index.md) | [Appendix D — Built-in Functions →](appendix-d-functions.md)
