---
layout: default
title: "Chapter 1 - What Is AZM?"
parent: "Part I - Orientation"
grand_parent: "Understanding the AZM Codebase"
nav_order: 1
---
[Part I](index.md) | [Repository Layout ->](02-repository-layout.md)

# Chapter 1 - What Is AZM?

AZM is a Z80 assembler and tooling package. It turns `.asm` and `.z80` source
files into bytes, Intel HEX, flat binary output, Debug80 maps, lowered ASM80
source and register-care metadata. The same implementation serves the command
line, package consumers, Debug80 integration and the test suite.

The source tree is built around the assembly path. A file is loaded from disk,
`.include` lines are expanded, source is split into logical lines, logical lines
become typed source items, visible `op` invocations expand into ordinary
instructions, assembler-time facts are collected, instructions and data emit
bytes, symbolic fixups are resolved and output writers serialize the result.

The important design choice is that AZM remains an assembler. Layout types,
enums, type aliases, AZMDoc comments and register-care contracts are
assembler-time features. They help the assembler calculate addresses, check
contracts and produce useful metadata. Runtime behaviour still comes from the
Z80 instructions and bytes that AZM emits.

## The Job AZM Performs

An assembler has two jobs. First, it translates instruction mnemonics such as
`ld a,42` and `jp Loop` into the byte values that the Z80 executes. Second, it
manages the names that make a program maintainable: labels, constants, data
addresses, included files and output metadata.

AZM adds structured assembler-time data to those traditional jobs. A type
declaration records the byte layout of a record. A type alias gives a name to a
layout expression. An enum creates a group of qualified constants. A register
contract records the calling convention for a routine. These features all
resolve before the Z80 runs. Their results become ordinary bytes, addresses
or metadata.

The implementation reflects that split. The parser recognises source forms. The
semantic layer builds the tables that give those forms meaning. The assembler
emits bytes. Output writers serialize the byte map and metadata for the user or
for Debug80.

## A Concrete Walkthrough

This small source file exercises the main pipeline:

```asm
        .org $0100

LIMIT       .equ 8
SpriteArray .typealias Sprite[16]

Sprite .type
x      .field byte
y      .field byte
tile   .field byte
flags  .field byte
       .endtype

@Start:
        ld      b,LIMIT
Loop:
        djnz    Loop

Sprites:
        .ds SpriteArray
```

The loader reads the entry file and expands includes. The logical-line scanner
records each line with source provenance. The parser emits source items for
`.org`, `.equ`, `.typealias`, the `Sprite` layout, labels, instructions and
`.ds`. Address planning assigns `$0100` to `@Start`, assigns the following
addresses to `Loop` and `Sprites`, records `LIMIT = 8` and records the size of
`SpriteArray`. The encoder turns `ld b,LIMIT` and `djnz Loop` into fragments.
Fixup emission resolves `LIMIT` and the relative branch displacement. The output
writers then produce the selected artifacts.

The CLI and package consumers use this same path. AZM has one compiler pipeline
with several entry points.

## The Main Layers

AZM has six main implementation layers:

1. **Public entry points** in `src/index.ts`, `src/api-compile.ts`,
   `src/api-tooling.ts` and `src/cli.ts`.
2. **Loading and parsing** in `src/node/`, `src/source/`, `src/syntax/` and
   `src/core/compile.ts`.
3. **Assembler-time analysis** in `src/assembly/` and `src/semantics/`.
4. **Z80 parsing and encoding** in `src/z80/`.
5. **Language services** in `src/expansion/`, `src/register-care/` and
   `src/tooling/`.
6. **Artifact writers** in `src/outputs/`.

Each layer passes structured data to the next. Diagnostics are accumulated as
data objects and formatted only at the CLI edge. That keeps editor tooling,
tests and package consumers on the same diagnostic model.

## The Runtime Boundary

AZM computes everything it can at assembly time. `sizeof(Sprite)`,
`offset(Sprite, flags)` and `<SpriteArray>Sprites[3].tile` fold to numbers while
the assembler runs. The generated Z80 program receives those numbers in
instructions and data. At runtime the CPU still executes normal Z80 operations:
loads, stores, branches, calls, returns and port I/O.

This boundary is the reason layout, enum and register-care code lives inside the
assembler rather than inside a runtime library. They are source analysis and
byte-generation features.

## The Core Compile Path

The package-level compile API starts in `src/api-compile.ts`. It calls
`loadProgramNext()` to read and parse source, calls `analyzeProgramNext()` for
semantic checks, optionally runs register-care analysis, assembles the source
items with `assembleProgram()` and then calls the selected format writers.

The simplified flow is:

```text
compile(entryFile, options)
  loadProgramNext()
    expandSourceForTooling()
    parseNextSourceItems()
  analyzeProgramNext()
    assembleProgram() for symbol facts
    lintCaseStyleNext()
  analyzeRegisterCare() when requested
  assembleProgram()
    buildAddressState()
    emitProgramImage()
  writeBin / writeHex / writeD8m / writeAsm80
```

The CLI in `src/cli/run.ts` is thin. It parses arguments, builds compile
options, calls `compile()`, formats diagnostics, writes artifacts and returns an
exit code. The CLI is a user interface over the same public compile API that
tools can call directly.

## Two Public Workflows

The CLI workflow starts with command-line arguments:

```text
azm --type bin --output build/program.bin src/program.asm
```

`parseCliArgs()` validates the switches. `buildCompileOptions()` translates
them into the compile API shape. `compile()` returns artifacts. `writeArtifacts()`
writes them to disk.

The tooling workflow starts with an API call:

```ts
const loaded = await loadProgram({
  entryFile: '/project/src/program.asm',
  includeDirs: ['/project/include'],
});
```

The tooling API returns source items, source texts, diagnostics and symbol
facts in memory. Debug80, editor integrations and tests can use those structures
directly.

## Source Items

The parser emits `SourceItem` objects from `src/model/source-item.ts`: labels,
constants, instructions, storage
directives, type declarations, union declarations, enum declarations, aliases,
ops, comments and end markers. Source items carry spans so diagnostics and maps
can point back to the original file and line.

This model is the central handoff between syntax and assembly. Parser changes
should preserve that boundary: parse source into source items first, then let
assembly decide addresses and bytes.

The source-item model also gives register care and output writers a stable view
of the program. Register care reads labels, calls and instructions from source
items. D8 output reads symbols and source spans derived from those items. Op
expansion produces more source items rather than introducing a separate
intermediate language.

## Assembler-Time Facts

`src/assembly/address-planning.ts` builds the facts needed to assemble the
program:

- labels and their addresses
- `.equ` constants and enum members
- record and union layouts
- type aliases
- `.org` placement state
- sizes for data, storage and instructions

Expression evaluation in `src/semantics/expression-evaluation.ts` uses those
facts to fold expressions such as `sizeof(Sprite)`, `offset(Sprite, flags)`,
`LSB(value)`, `MSB(value)` and layout casts that can be resolved at assembly
time.

## Outputs

The output layer receives an emitted byte map plus symbols. It serializes those
facts into:

- `.bin` flat binary
- `.hex` Intel HEX
- `.d8.json` Debug80 map
- `.z80` lowered ASM80 source when requested
- `.regcare.txt` register-care report when requested
- `.asmi` register-care interface when requested

Output writers are integration boundaries. A change to their shape can affect
Debug80, command-line users and package consumers. Treat those files as public
contract code.

## How to Read the Codebase

Start with the public entry point that matches your task. For a CLI bug, begin
in `src/cli/run.ts` and follow the option into `api-compile.ts`. For source
syntax, begin in `parseNextSourceItems()` and `parse-line.ts`. For an encoding
bug, begin in `parse-instruction.ts`, `instruction.ts` and `encode.ts`. For a
D8 map issue, begin in `program-emission.ts`, `outputs/types.ts` and
`write-d8.ts`.

The compiler is small enough that you can follow a single source feature from
front to back. For example, `.typealias` appears in the parser, address
planning, expression evaluation, tests and manual examples. A feature is
finished when each boundary that observes it has the right structured fact.

## The Maintenance Rule

When you change AZM, first locate the boundary you are changing: syntax,
semantics, assembly, Z80 encoding, register care, outputs, CLI or public API.
Then update the tests for that boundary and any downstream integration tests
that observe the behaviour. This manual should be updated in the same change
when the directory structure, compile flow, public API or language behaviour
changes.
