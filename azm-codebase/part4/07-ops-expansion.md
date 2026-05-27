---
layout: default
title: "Chapter 7 - Ops and Visible Expansion"
parent: "Part IV - Language Extensions"
grand_parent: "Understanding the AZM Codebase"
nav_order: 7
---
[<- Emission, Fixups and Z80 Encoding](../part3/06-emission-fixups-z80.md) | [Register Care ->](08-register-care.md)

# Chapter 7 - Ops and Visible Expansion

Ops are named inline instruction idioms. They let source define a small
operation once and expand it visibly at each use site. The implementation lives
in `src/expansion/op-expansion.ts`.

The parser treats ops as source transformation before assembly. An op body
expands into ordinary `SourceItem` values, so later assembly stages work with
the same labels, directives and instructions they already understand.

## Collection

`collectOps()` scans logical lines before normal parsing. It finds top-level
`op` blocks, parses their parameter lists and records the body template. It also
records which logical line indexes belong to op definitions so the main parser
can skip the definition body.

An op declaration has:

- a name
- a parameter list
- matcher information for overload selection
- a body template
- source location metadata for diagnostics

This early collection gives every later line a complete registry of available
ops.

## Invocation Parsing

`parseOpInvocation()` checks whether a source line could be an op call. If the
name matches a collected op, `expandOpInvocation()` selects an overload and
instantiates the body.

The parser handles op invocations before `parseLogicalLine()`. That means an op
head can look like an instruction head at the source level, but the expansion
stage gets the first chance to resolve it.

## Overload Selection

Ops support overloads. `selectOpOverload()` compares the invocation operands
against each candidate signature. It prefers the most specific matching
overload and emits diagnostics for arity errors, unsupported operands,
ambiguous matches and invalid expansions.

The matcher code is deliberately explicit. It recognises fixed tokens,
registers, register pairs, immediates, conditions, ports and indexed operands.
This makes op dispatch predictable and keeps it close to the Z80 operand model.

## Template Instantiation

An op body template is parsed into template items. During expansion, operands
from the call site are substituted into the template. The result is formatted as
ordinary source text and parsed through the same line parser used for top-level
source.

The expansion code also rewrites local labels inside op bodies. A local label in
an op expansion becomes unique at the use site so each expansion receives its
own generated label.

## Diagnostics

Op diagnostics aim to point at the call site while still explaining the
definition that matched or failed. `formatOpSelectionDiagnostic()`,
`formatInvalidOpExpansionDiagnostic()` and related helpers build those messages.

Invalid expanded instructions are reported as op expansion failures, with the
underlying Z80 parser diagnostic included. This keeps the user focused on the op
use that generated the bad instruction.

## Interaction with Register Care

Ops expand before register care builds routines. Register care sees the
expanded instructions. An op is visible inline assembly, so its register effects
belong to the caller.

When changing op expansion, run both op tests and register-care integration
tests. A seemingly local op change can alter the instruction stream that
register-care liveness sees.

## Maintenance Notes

`op-expansion.ts` is one of the largest files in the source tree because it owns
collection, matching, substitution, local label rewriting and diagnostics. Keep
new behaviour inside the existing phases:

1. Parse the declaration.
2. Parse the invocation.
3. Match operands.
4. Instantiate template items.
5. Parse expanded source.
6. Rename generated labels.

Add tests under `test/unit/expansion/` for local matching rules and under
`test/integration/` for source-level behaviour.
