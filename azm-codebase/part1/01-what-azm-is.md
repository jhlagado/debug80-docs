---
layout: default
title: "Chapter 1 - What AZM Is"
parent: "Part I - Orientation"
grand_parent: "Understanding the AZM Codebase"
nav_order: 1
---
[Part I](index.md) | [Repository Layout ->](02-repository-layout.md)

# Chapter 1 - What AZM Is

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
exit code. The CLI is therefore a user interface over the same public compile
API that tools can call directly.

## Source Items

The parser emits `SourceItem` objects from `src/model/source-item.ts`: labels,
constants, instructions, storage
directives, type declarations, union declarations, enum declarations, aliases,
ops, comments and end markers. Source items carry spans so diagnostics and maps
can point back to the original file and line.

This model is the central handoff between syntax and assembly. Parser changes
should preserve that boundary: parse source into source items first, then let
assembly decide addresses and bytes.

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

## The Maintenance Rule

When you change AZM, first locate the boundary you are changing: syntax,
semantics, assembly, Z80 encoding, register care, outputs, CLI or public API.
Then update the tests for that boundary and any downstream integration tests
that observe the behaviour. This manual should be updated in the same change
when the directory structure, compile flow, public API or language behaviour
changes.
