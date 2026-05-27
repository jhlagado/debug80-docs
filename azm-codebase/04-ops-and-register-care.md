---
layout: default
title: "Chapter 4 - Ops and Register Care"
parent: "AZM Engineering Manual"
nav_order: 4
---
[<- Assembly and Z80 Emission](03-assembly-and-z80-emission.md) | [Interfaces and Output Artifacts ->](05-interfaces-and-output-artifacts.md)

# Chapter 4 - Ops and Register Care

Ops and register care are the two AZM-specific subsystems that sit above plain
Z80 instruction assembly. Ops expand source into visible inline assembly.
Register care analyses the resulting routines and calls.

These features belong together in the codebase tour because they meet at the
same boundary: parsed source items. Ops produce source items. Register care
reads source items.

## Ops as Visible Expansion

Ops are named inline instruction idioms. They let source define a small
operation once and expand it visibly at each use site. The implementation lives
in `src/expansion/op-expansion.ts`.

An op is closer to a typed inline template than to a text macro. The op parser
understands operands, chooses an overload and parses the expanded body back
through the normal AZM parser. The result is visible assembly with the same
diagnostic and register-care behaviour as handwritten source.

For example:

```asm
op clear(reg8 r)
        xor     r
end

        clear a
```

The expansion stage matches `a` as a register operand, substitutes it into the
template and emits the source item for `xor a`. Address planning and emission
then treat that instruction exactly like a line written directly in the source.

## Op Collection and Invocation

`collectOps()` scans logical lines before normal parsing. It finds top-level
`op` blocks, parses their parameter lists, records the body template and marks
the source lines that belong to the definition body.

An op declaration has:

- a name
- a parameter list
- matcher information for overload selection
- a body template
- source location metadata for diagnostics

The registry is complete before invocation parsing starts. `parseOpInvocation()`
checks whether a source line could be an op call. If the name matches a
collected op, `expandOpInvocation()` selects an overload and instantiates the
body.

The parser handles op invocations before `parseLogicalLine()`. An op head can
look like an instruction head at the source level. The expansion stage resolves
it before ordinary line parsing.

## Overloads and Templates

Ops support overloads. `selectOpOverload()` compares invocation operands against
each candidate signature. It prefers the most specific matching overload and
emits diagnostics for arity errors, unsupported operands, ambiguous matches and
invalid expansions.

The matcher vocabulary recognises fixed tokens, registers, register pairs,
immediates, conditions, ports and indexed operands. It stays close to the Z80
operand model, so op dispatch and instruction parsing describe operands in the
same terms.

An op body template is parsed into template items. During expansion, operands
from the call site are substituted into the template. The result is formatted as
ordinary source text and parsed through the same line parser used for top-level
source.

Local label rewriting is part of expansion. A local label in an op expansion
becomes unique at the use site so each expansion receives its own generated
label. Once the rewritten labels become source items, address planning defines
and resolves them through the ordinary symbol path.

## Op Diagnostics and Register Care

Op diagnostics point at the call site while explaining the definition that
matched or failed. Invalid expanded instructions are reported as op expansion
failures with the underlying Z80 parser diagnostic included.

Ops expand before register care builds routines. Register care sees the
expanded instructions. An op is visible inline assembly, so its register effects
belong to the caller.

## Register-Care Analysis

Register care analyses how routines use Z80 registers. It reads routine
boundaries, instruction effects and AZMDoc contract comments, then reports
conflicts where a caller still needs a register value that a callee may change.

The implementation lives in `src/register-care/`. The public analysis entry
point is `analyzeRegisterCare()` in `src/register-care/analyze.ts`.

Register care is a data-flow analysis over assembled source structure. It works
with routines, calls, instruction effects and contracts. It analyses the source
structure to find values live across a call and callee summaries that can change
those values.

## A Register-Care Conflict

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

The programmer can preserve `B`, choose a different counter register, change
`Worker` so it leaves `B` unchanged or update the calling sequence. Register
care identifies the conflict and the source location where the caller crosses
the boundary.

## Routine Model and Contracts

`src/register-care/programModel.ts` builds the program model from parsed source
items. It finds routine boundaries, direct calls, labels and instructions.
Routine entry labels use `@` in source and become callable public routine names
after the marker is removed.

`src/register-care/smartComments.ts` reads AZMDoc comments from the comment maps
captured during loading. It builds routine contracts from `;!` lines and from
external `.asmi` interfaces.

Contracts can describe:

- inputs
- outputs
- clobbered registers
- preserved registers
- expected outputs at call sites

Source comments and external interfaces describe the same kind of fact: a
routine contract. Source comments attach to routines in the current program.
`.asmi` entries attach to routines whose source is assembled elsewhere.

## Effects, Summaries and Liveness

Register care depends on `src/z80/effects.ts`. Effects describe which registers
and flags an instruction reads, writes or preserves. `instruction-shape.ts` and
`carriers.ts` translate between Z80 instruction shapes and register-care units
such as `A`, `HL`, `carry` and register pairs.

`src/register-care/summary.ts` infers a summary for a single routine.
`routine-summaries.ts` and `summaries.ts` combine routine summaries, external
contracts and profile summaries into lookup tables. A summary records the
observable contract of a routine: the units it reads, writes, preserves,
clobbers and returns as outputs.

`src/register-care/liveness.ts` performs the caller-side analysis. It works
backwards through each routine. At a call, it compares the live-after set with
the callee summary. A live unit that the callee clobbers becomes a conflict. A
unit produced by the callee and read by the caller becomes an output candidate.

## Reports, Interfaces and Tooling

`report.ts` renders human-readable `.regcare.txt` reports and `.asmi` interface
metadata. `annotate.ts`, `annotations.ts`, `fix.ts` and `sourceText.ts` support
source updates for generated AZMDoc comments and conservative fixes.

The CLI can request these behaviours through:

- `--reg-report`
- `--reg-interface`
- `--contracts`
- `--fix`
- `--accept-out`

`src/register-care/tooling.ts` exposes editor-friendly diagnostics and code
actions through `analyzeRegisterCareForTools()`. Tooling diagnostics carry file,
line, column, message, fixability and optional text edits. An editor can show
the same register-care information that the CLI reports while using normal
editor actions for accepted fixes.

## Changing Ops or Register Care

Op changes belong in `op-expansion.ts`, with tests under
`test/unit/expansion/` and integration tests for source-level behaviour.
Register-care changes usually begin in one of these files:

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
