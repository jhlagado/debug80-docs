---
layout: default
title: "Appendix A - Directory and File Reference"
parent: "Appendices"
grand_parent: "Understanding the AZM Codebase"
nav_order: 1
---
[<- Maintaining the Codebase](../part6/12-maintaining-the-codebase.md) | [Appendix B ->](b-compile-flow-reference.md)

# Appendix A - Directory and File Reference

This appendix is the file-by-file map of the AZM implementation. Use it when
you need to find the owner of a behaviour quickly.

## Root Source Files

| File | Role |
| --- | --- |
| `src/index.ts` | Main package export surface. Re-exports compile, tooling, diagnostics, register-care and D8 map types. |
| `src/api-compile.ts` | File-backed public compile API. Coordinates loading, analysis, register care, assembly and artifact writers. |
| `src/api-tooling.ts` | Public tooling API re-export layer. Keeps editor-facing imports stable. |
| `src/cli.ts` | CLI executable entry. Calls `runCli()` and sets process exit code. |

## `src/assembly/`

| File | Role |
| --- | --- |
| `assemble-program.ts` | Assembly coordinator. Builds address state, emits program image and returns assembled result data. |
| `address-planning.ts` | Defines labels, equates, enum members, layouts and type aliases; calculates directive and instruction sizes. |
| `placement.ts` | Tracks placement state plus origin and address movement for code and data. |
| `program-emission.ts` | Writes bytes into the emitted image and records source segments. |
| `fixup-emission.ts` | Resolves symbolic instruction fragments such as ABS16, IMM8 and REL8. |

## `src/cli/`

| File | Role |
| --- | --- |
| `parse-args.ts` | Parses CLI switches and validates command shape. |
| `run.ts` | Runs the CLI: parse args, compile, print diagnostics, write artifacts and return status. |
| `write-artifacts.ts` | Maps parsed options to compile options and writes in-memory artifacts to disk paths. |

## `src/core/`

| File | Role |
| --- | --- |
| `compile.ts` | In-memory source-item parsing path, conditional assembly handling and legacy compile helpers. |
| `compile-artifacts.ts` | Artifact-oriented compile helpers used by older or lower-level callers. |

## `src/diagnostics/`

| File | Role |
| --- | --- |
| `format.ts` | Formats structured diagnostics for CLI text output. |

## `src/expansion/`

| File | Role |
| --- | --- |
| `op-expansion.ts` | Collects op definitions, parses invocations, selects overloads, substitutes operands, rewrites generated labels and returns expanded source items. |

## `src/model/`

| File | Role |
| --- | --- |
| `diagnostic.ts` | Diagnostic severity, IDs and common diagnostic shape. |
| `expression.ts` | Expression and type-expression AST types. |
| `fixup.ts` | Fixup fragment model for symbolic byte emission. |
| `source-item.ts` | Parsed source item model shared by parser, assembly, outputs and register care. |
| `symbol.ts` | Symbol table type. |

## `src/node/`

| File | Role |
| --- | --- |
| `source-host.ts` | File-backed source loading, entry extension checks, include expansion, source text capture and comment maps. |

## `src/outputs/`

| File | Role |
| --- | --- |
| `types.ts` | Artifact, byte map, source segment, symbol and D8 map types. |
| `index.ts` | Default writer set used by the compile API. |
| `range.ts` | Written-range helpers for sparse byte maps. |
| `hex.ts` | Low-level Intel HEX record writer. |
| `write-bin.ts` | Flat binary artifact writer. |
| `write-hex.ts` | HEX artifact writer around `hex.ts`. |
| `write-d8.ts` | Debug80 map writer and source segment grouping. |
| `write-asm80.ts` | Lowered ASM80-compatible source writer. |

## `src/register-care/`

| File | Role |
| --- | --- |
| `analyze.ts` | Main register-care analysis coordinator. |
| `programModel.ts` | Builds routines, labels, instructions and direct call boundaries from source items. |
| `smartComments.ts` | Parses AZMDoc comments and `.asmi` interface contracts. |
| `summary.ts` | Infers a routine summary from instruction effects and contracts. |
| `routine-summaries.ts` | Computes routine summaries to a fixed point and applies external contracts. |
| `summaries.ts` | Builds summary lookup tables, profile summaries, unknown-boundary diagnostics and candidate fixability. |
| `liveness.ts` | Computes live register-care units and detects caller/callee conflicts. |
| `effects.ts` | Register-care effect helpers layered over Z80 instruction effects. |
| `instruction-shape.ts` | Extracts instruction heads, operands and special cases for analysis. |
| `carriers.ts` | Normalizes register-care carrier names and expands register pairs. |
| `controlFlow.ts` | Successor logic for routine instruction flow. |
| `profiles.ts` | Built-in external routine profiles such as MON-3. |
| `report.ts` | Renders `.regcare.txt`, `.asmi` and compact source contract blocks. |
| `annotate.ts` | Inserts or replaces generated contract blocks near routine labels. |
| `annotations.ts` | Builds source annotation artifact data. |
| `fix.ts` | Finds and applies conservative expected-output fixes. |
| `accept-output.ts` | Parses user-accepted output candidate options. |
| `tooling.ts` | Editor-friendly register-care diagnostics and code actions. |
| `types.ts` | Register-care unit, routine, effect, summary, contract and report types. |
| `sourceText.ts` | Source line splitting and joining helpers for text edits. |
| `boundaryHints.ts` | Small helpers for naming external service boundaries. |

## `src/semantics/`

| File | Role |
| --- | --- |
| `expression-evaluation.ts` | Evaluates constants, symbols, layout expressions, `sizeof`, `offset`, layout casts, `LSB` and `MSB`. |

## `src/source/`

| File | Role |
| --- | --- |
| `source-file.ts` | Creates source file records from name and text. |
| `logical-lines.ts` | Splits source text into logical line records. |
| `source-span.ts` | Defines source span shape. |
| `strip-line-comment.ts` | Removes semicolon comments while respecting quoted text. |

## `src/syntax/`

| File | Role |
| --- | --- |
| `parse-line.ts` | Parses single logical lines into source items. |
| `parse-expression.ts` | Parses expression ASTs and layout type expressions. |
| `parse-diagnostics.ts` | Shared parse diagnostic helpers. |
| `directive-aliases.ts` | Built-in and project directive alias policy. |

## `src/tooling/`

| File | Role |
| --- | --- |
| `api.ts` | `loadProgramNext()` and `analyzeProgramNext()` for tooling consumers. |
| `case-style.ts` | Mnemonic, register and op-head case-style linting. |

## `src/z80/`

| File | Role |
| --- | --- |
| `instruction.ts` | Z80 instruction and operand type model. |
| `parse-instruction.ts` | Parses Z80 instruction text into typed instruction objects and diagnostics. |
| `encode.ts` | Encodes typed Z80 instructions into byte and fixup fragments. |
| `effects.ts` | Describes register and flag effects for Z80 instructions. |

## `test/`

| Directory | Role |
| --- | --- |
| `test/unit/syntax/` | Parser and expression unit tests. |
| `test/unit/source/` | Source-line and comment helpers. |
| `test/unit/z80/` | Z80 parser and encoder tests. |
| `test/unit/outputs/` | Artifact writer tests. |
| `test/unit/expansion/` | Op expansion tests. |
| `test/unit/register-care/` | Register-care analysis units. |
| `test/integration/` | Cross-stage compiler tests. |
| `test/integration/register-care/` | End-to-end register-care tests. |
| `test/cli/` | CLI option, artifact and exit-code contracts. |
| `test/asm80/` | ASM80 compatibility and real-program acceptance. |
| `test/differential/` | Differential comparison fixtures and runners. |
| `test/fixtures/` | Source fixture programs. |
| `test/helpers/` | Shared test setup and helpers. |
| `test/types/` | Public TypeScript surface checks. |

## `docs/`

| Directory | Role |
| --- | --- |
| `docs/reference/` | Current user and contributor references. |
| `docs/spec/` | Metadata and editor-adjacent specifications. |
| `docs/design/` | Active design notes. |
| `docs/work/` | Operational work notes. |

## `scripts/`

| Directory | Role |
| --- | --- |
| `scripts/ci/` | CI checks and policy scripts. |
| `scripts/dev/` | Developer utilities for corpus checks, ASM80 parity, package smoke tests and coverage. |
| `scripts/` root | General maintenance scripts such as source-size checks and grammar generation. |
