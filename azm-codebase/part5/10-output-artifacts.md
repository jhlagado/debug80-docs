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

Artifact writing is the final compiler boundary. Earlier stages decide the
program's meaning. Output writers decide how that meaning is represented for
loaders, debuggers, comparison tools and package consumers.

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

Each artifact has a `kind` field. Callers can switch on `kind` to find the
artifact they need:

```ts
const d8m = result.artifacts.find((artifact) => artifact.kind === 'd8m');
const bin = result.artifacts.find((artifact) => artifact.kind === 'bin');
```

This shape keeps the compile API independent from output paths. A caller can
write artifacts to disk, keep them in memory, send them to another process or
compare them in a test.

## Byte Maps and Ranges

Assembly produces an `EmittedByteMap`. It represents sparse output: addresses
map to byte values and source segments describe where those bytes came from.

`src/outputs/range.ts` provides range helpers. `getWrittenSegments()` identifies
contiguous written address ranges. `getWrittenRange()` returns the overall
written span.

Writers use these helpers to serialize only the relevant ranges and to keep
binary, HEX and D8 output consistent.

The sparse map shape is important for `.org`. A program can emit bytes at
several address ranges. `getWrittenSegments()` preserves those ranges. HEX can
write separate records. BIN can flatten the selected range. D8 can describe the
same ranges as source-correlated segments.

## BIN Output

`src/outputs/write-bin.ts` writes flat binary. It chooses the written range,
fills gaps as needed and returns a `Uint8Array` artifact. This writer is the
shortest example of how sparse byte maps become contiguous file content.

The BIN writer is also where padding policy becomes visible. Sparse addresses
inside the selected range need a byte value in the flat array. Tests around BIN
output should check both content and range selection.

## HEX Output

`src/outputs/write-hex.ts` wraps `src/outputs/hex.ts`. The lower helper writes
Intel HEX records, including record checksums and the end-of-file record.

HEX output is useful for hardware loaders, emulators and debugger workflows
that expect standard Intel HEX.

The HEX writer serializes address records, data records and the end-of-file
record. Checksum generation lives in the lower `hex.ts` helper, which keeps the
artifact writer focused on selecting segments and symbols.

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

The D8 map distinguishes addressable symbols from constants. Labels and
addressable data carry addresses. Constants carry values. Debug80 can then use
addressable symbols for breakpoints and display constants as metadata.

The writer groups symbols and segments under file entries. It also keeps a
top-level symbol list. That gives consumers both a project-wide view and a
file-oriented view.

## Lowered ASM80 Output

`src/outputs/write-asm80.ts` serializes accepted AZM source items as
ASM80-compatible `.z80` text. It lowers supported AZM constructs into forms that
can be compared against ASM80 output.

The writer has its own formatting and expression-evaluation helpers because it
must turn structured source items back into text. It raises
`UnsupportedAsm80LoweringError` for a source item or instruction form outside
the lowered output set.

Lowered ASM80 output is a compatibility and verification aid. It should stay
byte-faithful for supported forms.

`write-asm80.ts` is larger than the other writers because it turns structured
items back into source text. It must format instructions, data directives,
branch targets, lowered layout constants and expressions. Unsupported forms are
reported through an artifact diagnostic path so a successful assembly can still
return BIN, HEX and D8 artifacts.

## Register-Care Artifacts

Register-care report and interface artifacts are created by
`analyzeRegisterCare()` rather than by the generic output writer set. The
artifact objects still flow through the same compile result and CLI write path.

The report is human-readable. The `.asmi` interface is metadata that can be
loaded by later compile runs through `--interface`.

Register-care artifacts share the artifact result path with the byte-oriented
outputs. That lets the CLI write reports and interfaces with the same base-path
logic used for binary artifacts.

## Writer Injection

`compile()` accepts a `formats` dependency:

```ts
{ formats: defaultFormatWriters }
```

This keeps writer selection explicit and testable. The default writer set is in
`src/outputs/index.ts`.

Tests can inject a writer set to isolate compile orchestration from writer
formatting. The production path uses `defaultFormatWriters`.

## Maintenance Notes

Output changes require tests at the artifact boundary. Use:

- `test/unit/outputs/` for writer-specific tests
- `test/cli/cli_artifacts.test.ts` for CLI disk output
- D8 map tests when source segments or symbols change
- ASM80 acceptance or differential tests when lowered output changes

Keep artifact writers focused on compiled facts. Parser decisions belong in the
syntax and source-item stages.
