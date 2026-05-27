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

Register care is a data-flow analysis over assembled source structure. It works
with routines, calls, instruction effects and contracts. It analyses the source
structure to find values live across a call and callee summaries that can change
those values.

## A Small Conflict

This source shape captures the problem:

```asm
@Caller:
        ld      b,8
Loop:
        call    Worker
        djnz    Loop
        ret

;! clobbers B
@Worker:
        ld      b,0
        ret
```

`Caller` uses `B` as the `djnz` counter. `Worker` declares that it clobbers
`B`. Liveness sees that `B` is still needed after the call because `djnz Loop`
reads it. The register-care conflict is at the call site: `Caller` passes
through a routine boundary that may change a live unit.

The programmer can then change the source contract or source code: preserve
`B`, choose a different counter register, change `Worker` so it leaves `B`
unchanged or update the calling sequence. Register care identifies the conflict
and the source location where the caller crosses the boundary.

## Routine Model

`src/register-care/programModel.ts` builds the program model from parsed source
items. It finds routine boundaries, direct calls, labels and instructions.
Routine entry labels use `@` in source and become callable public routine names
after the marker is removed.

The model gives register care a source-level control-flow view built from
source items and Z80 instruction models.

The program model deliberately starts from parsed items. Labels already have
their source spans. Instructions already have typed operands. Op expansions
have already become ordinary source items. Register care sees the program as AZM
will assemble it.

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

`smartComments.ts` handles both source comments and external interfaces because
they describe the same kind of fact: a routine contract. Source comments attach
to routines in the current program. `.asmi` entries attach to routines whose
source is assembled elsewhere.

## Instruction Effects

Register care depends on `src/z80/effects.ts`. Effects describe which registers
and flags an instruction reads, writes or preserves. The helper modules
`instruction-shape.ts` and `carriers.ts` translate between Z80 instruction
shapes and register-care units such as `A`, `HL`, `carry` and register pairs.

Instruction effects are the core link between the assembler and the analysis.
When a Z80 instruction form is added, its effect model must be added with it.

Effects use register-care units rather than raw text. An instruction can read
`HL` as a pair, read `H` or `L` as individual bytes, affect `carry` or leave a
value relation between input and output. The carrier helpers normalise those
units so summaries and liveness speak the same vocabulary.

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

Summary inference tracks the routine's observable boundary. For each unit, the
analysis asks whether the unit is read from entry, written inside the routine,
preserved to exit or produced as a new value. Contract comments refine that
inference when the source carries human intent.

## Liveness and Conflicts

`src/register-care/liveness.ts` performs the caller-side analysis. It asks which
register-care units are live across a call, resolves the callee summary and
reports a conflict when the callee may clobber a live unit.

It also finds output candidates. An output candidate is a value written by a
callee and read later by the caller. Some candidates can be accepted or fixed
automatically when the surrounding source shape is simple enough.

The liveness pass works backwards through each routine. At a call, it compares
the live-after set with the callee summary. A live unit that the callee clobbers
becomes a conflict. A unit produced by the callee and read by the caller becomes
an output candidate.

Control-flow helpers provide successors for branches and returns. This lets the
analysis handle straight-line code, local branches and routine exits with the
same live-set calculation.

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

Source edits are intentionally conservative. `--contracts` writes generated
contract blocks. `--fix` applies only source repairs that the analysis can
justify from a direct continuation. Ambiguous output candidates remain visible
for programmer review.

## Tooling API

`src/register-care/tooling.ts` exposes editor-friendly diagnostics and code
actions through `analyzeRegisterCareForTools()`. It returns candidate
diagnostics with simple text edits, so an editor or future language server can
offer the same fixes as the CLI.

This file is the package-facing bridge. Internal analysis may be complex, but
the tooling result should remain stable and easy to consume.

Tooling diagnostics carry file, line, column, message, fixability and optional
text edits. That shape lets an editor show the same register-care information
that the CLI reports, while using normal editor actions for accepted fixes.

## Modes

Register-care modes are:

| Mode | Meaning |
| --- | --- |
| `off` | Analysis runs only when an output artifact needs summaries. |
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
