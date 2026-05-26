---
layout: default
title: "Chapter 8 - Register Care"
parent: "Part IV - Language Extensions"
grand_parent: "Understanding the AZM Codebase"
nav_order: 8
---
[<- Ops and Visible Expansion](07-ops-expansion.md) | [CLI and Public APIs ->](../part5/09-cli-and-public-apis.md)

# Chapter 8 - Register Care

Register care analyses how routines use Z80 registers. It reads routine
boundaries, instruction effects and AZMDoc contract comments, then reports
conflicts where a caller still needs a register value that a callee may change.

The implementation lives in `src/register-care/`. The public analysis entry
point is `analyzeRegisterCare()` in `src/register-care/analyze.ts`.

## Routine Model

`src/register-care/programModel.ts` builds the program model from parsed source
items. It finds routine boundaries, direct calls, labels and instructions.
Routine entry labels use `@` in source and become callable public routine names
after the marker is removed.

The model gives register care a source-level control-flow view built from
source items and Z80 instruction models.

## Contracts and AZMDoc Comments

`src/register-care/smartComments.ts` reads AZMDoc comments from the comment maps
captured during loading. It builds routine contracts from `;!` lines and from
external `.asmi` interfaces.

Contracts can describe:

- inputs
- outputs
- clobbered registers
- preserved registers
- expected outputs at call sites

The comments are metadata for analysis. The source remains ordinary assembly.

## Instruction Effects

Register care depends on `src/z80/effects.ts`. Effects describe which registers
and flags an instruction reads, writes or preserves. The helper modules
`instruction-shape.ts` and `carriers.ts` translate between Z80 instruction
shapes and register-care units such as `A`, `HL`, `carry` and register pairs.

This is the core link between the assembler and the analysis. When a Z80
instruction form is added, its effect model must be added with it.

## Summaries

`src/register-care/summary.ts` infers a summary for a single routine.
`src/register-care/routine-summaries.ts` and `summaries.ts` combine routine
summaries, external contracts and profile summaries into lookup tables.

A summary records the observable contract of a routine: the units it reads,
writes, preserves, clobbers and returns as outputs. It also tracks useful value
relations so analysis can distinguish a preserved value from a newly produced
value.

Profiles such as `mon3` live in `profiles.ts`. They provide known contracts for
library or monitor routines that are called by source but assembled elsewhere.

## Liveness and Conflicts

`src/register-care/liveness.ts` performs the caller-side analysis. It asks which
register-care units are live across a call, resolves the callee summary and
reports a conflict when the callee may clobber a live unit.

It also finds output candidates. An output candidate is a value written by a
callee and read later by the caller. Some candidates can be accepted or fixed
automatically when the surrounding source shape is simple enough.

## Reports, Interfaces and Source Fixes

`report.ts` renders human-readable `.regcare.txt` reports and `.asmi` interface
metadata. `annotate.ts`, `annotations.ts`, `fix.ts` and `sourceText.ts` support
source updates for generated AZMDoc comments and conservative fixes.

The CLI can request these behaviours through:

- `--reg-report`
- `--reg-interface`
- `--contracts`
- `--fix`
- `--accept-out`

`api-compile.ts` coordinates these options before artifact writing.

## Tooling API

`src/register-care/tooling.ts` exposes editor-friendly diagnostics and code
actions through `analyzeRegisterCareForTools()`. It returns candidate
diagnostics with simple text edits, so an editor or future language server can
offer the same fixes as the CLI.

This file is the package-facing bridge. Internal analysis may be complex, but
the tooling result should remain stable and easy to consume.

## Modes

Register-care modes are:

| Mode | Meaning |
| --- | --- |
| `off` | Analysis is inactive unless an output artifact needs summaries. |
| `audit` | Build reports and candidates while leaving conflicts as audit data. |
| `warn` | Report conflicts as warnings. |
| `error` | Report conflicts as errors. |
| `strict` | Treat unknown boundaries as diagnostics as well. |

The mode is passed through the CLI and compile API to `analyzeRegisterCare()`.

## Maintenance Notes

Register care spans many files because it is a real data-flow analysis. Start
with the question you are changing:

- Routine boundaries and calls: `programModel.ts`
- AZMDoc parsing: `smartComments.ts`
- Instruction effects: `z80/effects.ts`, `instruction-shape.ts`
- Summary inference: `summary.ts`
- Caller liveness: `liveness.ts`
- Output text: `report.ts`
- Source edits: `annotate.ts`, `fix.ts`, `annotations.ts`
- Tooling surface: `tooling.ts`

Run unit tests under `test/unit/register-care/`, integration tests under
`test/integration/register-care/` and CLI tests in
`test/cli/register_care_cli.test.ts`.
