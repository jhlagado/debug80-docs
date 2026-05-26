---
layout: default
title: "Chapter 11 - Tests, Fixtures and Guardrails"
parent: "Part VI - Verification and Maintenance"
grand_parent: "Understanding the AZM Codebase"
nav_order: 11
---
[<- Output Artifacts](../part5/10-output-artifacts.md) | [Maintaining the Codebase ->](12-maintaining-the-codebase.md)

# Chapter 11 - Tests, Fixtures and Guardrails

AZM has a broad verification suite because assembler changes can break source
syntax, byte output, artifact shape, CLI behaviour and public package types at
the same time. The test tree is organised by boundary so a change can be tested
close to the code it touches.

## Test Directory Map

```text
test/
  unit/
  integration/
  cli/
  asm80/
  differential/
  fixtures/
  helpers/
  types/
```

Use the narrowest useful test first, then add the integration or CLI coverage
that proves the user-facing behaviour.

## Unit Tests

Unit tests live under `test/unit/` and mirror implementation directories:

| Directory | Boundary |
| --- | --- |
| `unit/syntax/` | Line parsing, expression parsing and directive aliases. |
| `unit/source/` | Logical line and comment handling. |
| `unit/z80/` | Instruction parsing, diagnostics and encoding. |
| `unit/outputs/` | Artifact writer behaviour. |
| `unit/expansion/` | Op collection and expansion. |
| `unit/register-care/` | Carriers, summaries, liveness, reports and fixes. |

Unit tests should be small and direct. They are where parser edge cases, encoder
forms and analysis details belong.

## Integration Tests

Integration tests under `test/integration/` assemble real source snippets
through multiple compiler stages. The stage files document the compiler growth
path and protect cross-stage behaviour such as layout semantics, ops, compile
API, tooling API and register care.

Use integration tests when a change affects how users write source or how
several compiler layers interact.

## CLI Tests

`test/cli/` verifies the command-line contract: options, artifact writing,
failure modes, determinism, case-style linting and register-care switches.

When a CLI option changes, test it here even if the underlying compiler option
already has unit coverage. Users experience the command-line behaviour through
argument parsing, diagnostics, output paths and exit status.

## ASM80 and Differential Tests

`test/asm80/` and `test/differential/` protect compatibility and byte parity.
These tests compare AZM behaviour against ASM80 expectations, lowered output and
real-program fixtures.

Use these tests when changing directive aliases, compatibility syntax, lowered
ASM80 output, instruction encoding or any behaviour that could affect existing
source ports.

## Fixtures

`test/fixtures/` contains small source programs named after the issue or
behaviour they cover. Fixture files make regression tests readable because the
source being assembled is visible and reusable.

Prefer a fixture when the source example is longer than a few lines or when it
should be shared across tests. Keep fixture names descriptive enough that a
future maintainer can connect them to the behaviour under test.

## Helper Code

`test/helpers/` contains shared helpers for CLI runs, diagnostics, temporary
source files and acceptance tests. Use helpers for repetitive setup. Keep test
expectations close to the test itself so failures stay easy to read.

## Public Type Tests

`test/types/` and `test/public_api_surface.test.ts` protect the package export
surface. Run them whenever changing `src/index.ts`, `src/api-compile.ts`,
`src/api-tooling.ts`, `src/outputs/types.ts` or `package.json` exports.

## Scripts and Guardrails

The main package scripts are:

```sh
npm run build
npm run typecheck
npm run lint
npm run test:azm:alpha
npm run test:azm:corpus
npm test
```

Additional guardrails live under `scripts/ci/` and `scripts/dev/`. Important
ones include ASM80 parity, fixture coverage, corpus comparison, package smoke
tests, source file size checks and removed syntax checks.

## Choosing a Verification Lane

Use this map:

| Change | Tests |
| --- | --- |
| Parser or expression syntax | `test/unit/syntax/**`, relevant integration tests. |
| Z80 instruction support | `test/unit/z80/**`, diagnostic matrices, ASM80 parity when relevant. |
| Layout semantics | layout integration tests and output tests. |
| Ops | `test/unit/expansion/**`, op integration tests. |
| Register care | register-care unit, integration and CLI tests. |
| CLI options | `test/cli/**`. |
| Output artifacts | `test/unit/outputs/**`, CLI artifact tests. |
| Public API | type tests, public API surface tests and tooling API tests. |

## Maintenance Notes

The verification goal is evidence at the boundary. A parser test proves syntax
recognition. An integration test proves source behaviour. A CLI test proves the
user command. A public type test proves package compatibility.

Avoid relying on a single broad test to cover a subtle compiler change. The
best failures point directly at the broken layer.
