---
layout: default
title: "Appendix C — CLI Flag Reference"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 103
---

# Appendix C — CLI Flag Reference

The source file is always the last argument:

```sh
azm [flags] source.asm
```

**Default invocation:**

```sh
azm source.asm
```

Produces four output files next to the source: `source.bin`, `source.hex`, `source.d8.json`, `source.lst`.

---

## Output control

| Flag | Argument | What it does |
|------|----------|--------------|
| `-o`, `--output` | `path` | Set the output base path; extension must match `--type` |
| `-t`, `--type` | `bin` or `hex` | Primary output format; default is `hex` |
| `--nobin` | — | Suppress `.bin` flat binary output |
| `--nohex` | — | Suppress `.hex` Intel HEX output |
| `--nod8m` | — | Suppress `.d8.json` Debug80 source map |
| `--nolst` | — | Suppress `.lst` assembler listing |
| `--source-root` | `path` | Write source paths in `.d8.json` relative to this root (for portable maps) |
| `--asm80` | — | Write a `.z80` lowered-ASM80 source file alongside other artifacts |

## Source, include and import flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `-I`, `--include` | `dir` | Add `dir` to the `.include` / `.import` search path; repeatable |
| `--aliases` | `file` | Load a JSON alias profile; repeatable for multiple files |
| `--interface` | `file` | Load an `.asmi` external register contract file; repeatable |

## Register contract flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `--rc` | `off`, `audit`, `warn`, `error` or `strict` | Register contract analysis level; default is `off` |
| `--register-contracts` | `off`, `audit`, `warn`, `error` or `strict` | Long form of `--rc` |
| `--contracts` | — | Insert or update inferred `.routine` directives |
| `--fix` | — | Apply conservative register contract source repairs; implies `--contracts`, so inferred `.routine` directives are rewritten too |
| `--require-expectout` | — | Fail on caller dependencies on inferred outputs that lack `.expectout` |
| `--reg-report` | — | Write `source.regcontracts.txt` with inferred routine contracts |
| `--reg-report-format` | `text` or `json` | Select register contract report format; default is `text` |
| `--reg-baseline` | `file` | Compare against a JSON register contract report baseline |
| `--reg-ratchet` | — | Fail when register contract findings are new or changed relative to the baseline |
| `--reg-interface` | — | Write `source.asmi` with inferred `extern` contract records |
| `--reg-infer` | — | Write a register-contract inference review artifact |
| `--reg-infer-format` | `json` or `markdown` | Select the inference artifact format; default is `json` |
| `--reg-profile` | `mon3` | Load a built-in register contract summary profile for known ROM environments |
| `--accept-out` | `ROUTINE:CARRIER[,CARRIER…]` | Confirm one or more output candidates; repeatable |

## Case and compatibility flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `--case-style` | `upper`, `lower`, `consistent`, `off` | Enforce case style for mnemonics and register names; emits `AZMN_CASE_STYLE` on violations. Default is `off` |
| `--symbol-case` | `strict` or `insensitive` | Select symbol lookup mode; default is `strict` |

## Other flags

| Flag | Argument | What it does |
|------|----------|--------------|
| `-V`, `--version` | — | Print the AZM version string and exit |
| `-h`, `--help` | — | Print command usage and exit |

---

## `--rc` levels

| Level | Effect |
|-------|--------|
| `off` | No register contract analysis (default) |
| `audit` | Analyze contracts without failing the build; useful while editing |
| `warn` | Print register contract warnings; build succeeds |
| `error` | Fail the build on proven register contract conflicts |
| `strict` | Fail on anything AZM cannot prove safe, including unknown routine boundaries and stack effects |
