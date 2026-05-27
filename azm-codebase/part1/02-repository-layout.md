---
layout: default
title: "Chapter 2 - Repository Layout"
parent: "Part I - Orientation"
grand_parent: "Understanding the AZM Codebase"
nav_order: 2
---
[<- What Is AZM?](01-what-is-azm.md) | [Source Loading and Logical Lines ->](../part2/03-source-loading.md)

# Chapter 2 - Repository Layout

The AZM repository has a small top-level shape. The production implementation is
under `src/`. Tests are under `test/`. Supporting developer documentation lives
under `docs/`. Build and verification scripts live under `scripts/`.

```text
AZM/
  src/                 TypeScript implementation
  test/                unit, integration, CLI, differential and acceptance tests
  docs/                active contributor references, specs and design notes
  examples/            small runnable source examples
  scripts/             CI, guardrail and developer utility scripts
  dist/                generated package output
  package.json         package exports, CLI bin, scripts and dependencies
```

The repository is a Node package. The source is TypeScript ESM. The published
package exposes the CLI binary `azm` and stable imports for compile and tooling
consumers.

## `src/`

`src/` is organised by compiler responsibility:

```text
src/
  index.ts
  api-compile.ts
  api-tooling.ts
  cli.ts

  assembly/
  cli/
  core/
  diagnostics/
  expansion/
  model/
  node/
  outputs/
  register-care/
  semantics/
  source/
  syntax/
  tooling/
  z80/
```

The root files expose public entry points. The subdirectories hold the compiler
pipeline. Each directory has a clear ownership boundary:

| Directory | Responsibility |
| --- | --- |
| `assembly/` | Address planning, placement, byte emission and fixups. |
| `cli/` | Argument parsing, CLI option mapping and disk artifact writing. |
| `core/` | In-memory compile helpers and source-item parsing orchestration. |
| `diagnostics/` | Diagnostic text formatting. |
| `expansion/` | Visible `op` collection, overload selection and expansion. |
| `model/` | Shared data types used across layers. |
| `node/` | File-backed source loading and include expansion. |
| `outputs/` | BIN, HEX, D8 map and lowered ASM80 artifact writers. |
| `register-care/` | Routine modelling, liveness, summaries, reports and fixes. |
| `semantics/` | Expression and layout evaluation. |
| `source/` | Source files, spans, logical line scanning and comment stripping. |
| `syntax/` | Line parsing, expression parsing and directive aliases. |
| `tooling/` | Editor/tooling APIs and source-style checks. |
| `z80/` | Z80 instruction model, parser, encoder and register effects. |

The directory names are intentionally plain. If a change adds a new compiler
stage, place it where the data responsibility belongs rather than adding a
parallel architecture.

## `test/`

The test tree mirrors the code boundaries:

```text
test/
  unit/
    syntax/
    source/
    z80/
    outputs/
    expansion/
    register-care/
  integration/
  cli/
  asm80/
  differential/
  fixtures/
  helpers/
  types/
```

Unit tests target narrow modules. Integration tests cover cross-stage compiler
behaviour. CLI tests verify argument and artifact contracts. ASM80 and
differential tests protect compatibility and byte parity. Type tests protect the
public TypeScript surface.

When a code change crosses a boundary, update both the closest unit test and the
integration or CLI test that observes the user-facing behaviour.

## `docs/`

The AZM repo-local docs are the active working set for implementation details:

```text
docs/
  reference/
  spec/
  design/
  work/
```

`docs/reference/source-overview.md` is the compact live map of the source tree.
`docs/reference/cli.md` and `docs/reference/tooling-api.md` document the current
user-facing and package-facing interfaces. `docs/spec/azmdoc.md` documents
register-care comment metadata. `docs/design/` holds active design notes.

This public engineering manual should stay aligned with those documents while
providing the longer guided tour.

## `scripts/`

`scripts/` contains verification and maintenance utilities. The important groups
are:

- `scripts/ci/` for CI-only checks such as change classification and removed
  syntax guardrails.
- `scripts/dev/` for developer runs such as corpus comparison, ASM80 coverage,
  fixture coverage and package smoke tests.
- root scripts such as `check-source-file-sizes.mjs` and grammar generation.

The package scripts in `package.json` are the normal entry points. Prefer
running `npm run ...` commands for normal verification. Invoke script files
directly while debugging the script itself.

## Generated and External Directories

`dist/`, `coverage/`, `.tmp/`, `node_modules/` and `next/` are generated or
supporting directories. They can be useful for inspection, but the source of
truth for the current implementation is `src/`, `test/`, `docs/`, `scripts/`
and `package.json`.

## Package Exports

`package.json` exposes these public paths:

```text
@jhlagado/azm
@jhlagado/azm/compile
@jhlagado/azm/tooling
@jhlagado/azm/cli
```

Public consumers should import from those paths. Internal files under `src/` and
compiled files under `dist/src/` are implementation details.
