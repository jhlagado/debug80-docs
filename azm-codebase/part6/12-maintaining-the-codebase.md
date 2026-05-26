---
layout: default
title: "Chapter 12 - Maintaining the Codebase"
parent: "Part VI - Verification and Maintenance"
grand_parent: "Understanding the AZM Codebase"
nav_order: 12
---
[<- Tests, Fixtures and Guardrails](11-tests-fixtures-guardrails.md) | [Appendix A ->](../appendices/a-directory-file-reference.md)

# Chapter 12 - Maintaining the Codebase

AZM is stable enough that changes should preserve the existing boundaries. A
maintainer should be able to decide where a change belongs before editing code:
source loading, parsing, expression evaluation, address planning, Z80 encoding,
op expansion, register care, artifact writing, CLI or public API.

## Start from the Boundary

Ask what kind of fact the change affects:

- Text and files belong in `node/` and `source/`.
- Syntax belongs in `syntax/` or the structural parsing section of
  `core/compile.ts`.
- Assembler-time facts belong in `assembly/` and `semantics/`.
- Instruction forms belong in `z80/`.
- Inline source generation belongs in `expansion/`.
- Routine contracts and liveness belong in `register-care/`.
- Artifact shape belongs in `outputs/`.
- User commands belong in `cli/`.
- Package consumers belong in `api-compile.ts`, `api-tooling.ts` and
  `index.ts`.

This habit keeps changes small and makes tests easier to choose.

## Preserve Structured Data

AZM passes structured data between stages. Resist turning a later stage back
into a text parser. If a stage needs more information, add it to the earlier
structured model and carry it forward.

Examples:

- Source provenance belongs on logical lines and source items.
- Syntax shape belongs in `SourceItem`.
- Instruction shape belongs in `Z80Instruction`.
- Layout facts belong in layout records and type expressions.
- Artifact metadata belongs in output types.

Structured handoffs are what let the CLI, Debug80 and tests share the same
implementation.

## Keep Compatibility at the Edge

Directive aliases and ASM80 lowering serve compatibility. Native AZM syntax
should remain clean inside the compiler model. Convert compatibility forms to
canonical source items early. Serialize compatibility output late.

That keeps the middle of the compiler focused on one language model.

## Treat Output Shapes as Contracts

BIN and HEX content, D8 map JSON, `.asmi` interface text, register-care reports
and lowered `.z80` output are consumed outside the compiler. A change to these
formats can break workflows even when tests still assemble source.

When changing an output shape, update:

- writer tests
- CLI artifact tests
- Debug80-facing documentation where relevant
- package-facing types when exported
- this manual when the contract changes

## Keep Diagnostics Useful

Diagnostics should name the source location, the failing construct and the
reason. Parser diagnostics should recover where possible. Assembly diagnostics
should be deterministic. CLI output should sort diagnostics consistently.

Prefer one precise diagnostic over a cascade of secondary errors. When recovery
creates noisy follow-on errors, suppress or narrow the secondary path.

## Update the Manual with Structural Changes

This book should change when:

- a source directory is added, removed or repurposed
- the compile flow changes
- public package exports change
- CLI option groups change
- output artifact shapes change
- a major subsystem gains a new responsibility
- tests or guardrails are reorganised

Small implementation changes usually need test updates rather than manual
updates. Structural changes need both.

## Suggested Change Workflow

1. Identify the boundary.
2. Read the relevant chapter and appendix entry.
3. Add or adjust the closest failing test.
4. Change the implementation.
5. Run the focused test.
6. Run the broader guardrail that matches the public behaviour.
7. Update docs when the contract or architecture changed.

The workflow keeps the codebase understandable because each change leaves a
test and a documentation trail at the level where future maintainers will look.
