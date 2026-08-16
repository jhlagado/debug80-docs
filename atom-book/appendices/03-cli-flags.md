---
layout: default
title: "Appendix 3 — CLI Flag Reference"
parent: "Atom Appendices"
grand_parent: "Atom Books"
nav_order: 3
---

# Appendix 3 — CLI Flag Reference

The entry source is the final argument:

```sh
atom [OPTIONS] ENTRY.ATM
```

## Build options

| Option | Argument | Effect |
| --- | --- | --- |
| `-o`, `--output` | Directory | Select the artifact bundle directory |
| `--root` | Directory | Set the project root; default is the current directory |
| `--origin` | Number | Set the initial native target address |
| `--capacity` | Number | Set the mathematical target capacity |
| `--entry` | Number | Set the entry address recorded in NOBJ and D8 |
| `--fill` | Number | Set the byte used for materialised gaps and reservations |
| `-DNAME[=VALUE]` | Definition | Add one immutable host-preprocessor definition; omitted value means 1 |

Command-line numbers accept decimal, `$` hexadecimal, `%` binary, Intel `H`
hexadecimal, and Intel `B` binary. A shell may expand `$`, so quote that form or
use an Intel suffix.

## Other options

| Option | Effect |
| --- | --- |
| `--self-host` | Assemble the checked Atom source shipped in the package |
| `-h`, `--help` | Print command usage |

Self-host mode accepts only an output-directory override. It fixes all build
values needed for the byte-identity proof.

## Status values

| Status | Meaning |
| ---: | --- |
| 0 | Successful assembly and publication |
| 1 | Build or publication failure |
| 2 | Invalid command use |
