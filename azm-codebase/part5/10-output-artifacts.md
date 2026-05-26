---
layout: default
title: "Chapter 10 - Output Artifacts"
parent: "Part V - Interfaces and Outputs"
grand_parent: "Understanding the AZM Codebase"
nav_order: 10
---
[<- CLI and Public APIs](09-cli-and-public-apis.md) | [Tests, Fixtures and Guardrails ->](../part6/11-tests-fixtures-guardrails.md)

# Chapter 10 - Output Artifacts

Output writers serialize assembled facts. They receive byte maps, symbols,
source segments and writer options, then return in-memory artifacts. The main
directory is `src/outputs/`.

The central types live in `src/outputs/types.ts`. `src/outputs/index.ts`
collects the default writer set used by `compile()`.

## Artifact Types

The output layer uses structured artifact objects:

- `BinArtifact`
- `HexArtifact`
- `D8mArtifact`
- `Asm80Artifact`
- `RegisterCareReportArtifact`
- `RegisterCareInterfaceArtifact`
- `RegisterCareAnnotationsArtifact`

The compile API returns these artifacts in memory. The CLI writes them to disk.

## Byte Maps and Ranges

Assembly produces an `EmittedByteMap`. It represents sparse output: addresses
map to byte values and source segments describe where those bytes came from.

`src/outputs/range.ts` provides range helpers. `getWrittenSegments()` identifies
contiguous written address ranges. `getWrittenRange()` returns the overall
written span.

Writers use these helpers to serialize only the relevant ranges and to keep
binary, HEX and D8 output consistent.

## BIN Output

`src/outputs/write-bin.ts` writes flat binary. It chooses the written range,
fills gaps as needed and returns a `Uint8Array` artifact. This is the simplest
writer and the best place to inspect how sparse byte maps become contiguous
file content.

## HEX Output

`src/outputs/write-hex.ts` wraps `src/outputs/hex.ts`. The lower helper writes
Intel HEX records, including record checksums and the end-of-file record.

HEX output is useful for hardware loaders, emulators and debugger workflows
that expect standard Intel HEX.

## D8 Debug Maps

`src/outputs/write-d8.ts` writes Debug80 metadata. It records:

- generator name and AZM package version
- input artifact paths
- source files
- source segments
- addressable symbols
- value-only constants

The writer normalizes source paths through `sourceRoot` when provided. It also
coalesces source segments and clips them to written ranges so Debug80 receives a
clean map of source lines to emitted bytes.

D8 maps are public integration data. Changes to `D8mJson`, `D8mSegment` or
symbol shape should be coordinated with Debug80 and covered by tests.

## Lowered ASM80 Output

`src/outputs/write-asm80.ts` serializes accepted AZM source items as
ASM80-compatible `.z80` text. It lowers supported AZM constructs into forms that
can be compared against ASM80 output.

The writer has its own formatting and expression-evaluation helpers because it
must turn structured source items back into text. It raises
`UnsupportedAsm80LoweringError` when a source item or instruction form cannot
be represented in the lowered output.

Lowered ASM80 output is a compatibility and verification aid. It should stay
byte-faithful for supported forms.

## Register-Care Artifacts

Register-care report and interface artifacts are created by
`analyzeRegisterCare()` rather than by the generic output writer set. The
artifact objects still flow through the same compile result and CLI write path.

The report is human-readable. The `.asmi` interface is metadata that can be
loaded by later compile runs through `--interface`.

## Writer Injection

`compile()` accepts a `formats` dependency:

```ts
{ formats: defaultFormatWriters }
```

This keeps writer selection explicit and testable. The default writer set is in
`src/outputs/index.ts`.

## Maintenance Notes

Output changes require tests at the artifact boundary. Use:

- `test/unit/outputs/` for writer-specific tests
- `test/cli/cli_artifacts.test.ts` for CLI disk output
- D8 map tests when source segments or symbols change
- ASM80 acceptance or differential tests when lowered output changes

Keep artifact writers focused on compiled facts. Parser decisions belong in the
syntax and source-item stages.
