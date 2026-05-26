---
layout: default
title: "Chapter 9 - CLI and Public APIs"
parent: "Part V - Interfaces and Outputs"
grand_parent: "Understanding the AZM Codebase"
nav_order: 9
---
[<- Register Care](../part4/08-register-care.md) | [Output Artifacts ->](10-output-artifacts.md)

# Chapter 9 - CLI and Public APIs

AZM has three public entry surfaces: the command-line binary, the compile API
and the tooling API. They all use the same compiler pipeline. The CLI is a thin
shell over `compile()`, and the package APIs expose structured data for tools.

## Package Exports

`package.json` exposes:

```text
@jhlagado/azm
@jhlagado/azm/compile
@jhlagado/azm/tooling
@jhlagado/azm/cli
```

`src/index.ts` re-exports the stable public surface. `src/api-compile.ts` backs
`@jhlagado/azm/compile`. `src/api-tooling.ts` backs
`@jhlagado/azm/tooling`. `src/cli.ts` is the executable entry.

Public consumers should import from package exports. A direct import from
`dist/src/...` bypasses the package contract and can break when internals move.

## CLI Entry

The executable path in `package.json` points to `dist/src/cli.js`, compiled from
`src/cli.ts`. That file calls `runCli(process.argv.slice(2))` and sets the
process exit code.

`src/cli/run.ts` owns the CLI control flow:

```text
runCli(argv)
  parseCliArgs(argv)
  artifactBase(entryFile, outputType, outputPath)
  compile(entryFile, buildCompileOptions(parsed, base))
  sort and print diagnostics
  writeArtifacts(base, artifacts, outputType)
  return exit code
```

The CLI returns:

- `0` for a successful assembly
- `1` when diagnostics include an error
- `2` for argument or unexpected runtime failures

## Argument Parsing

`src/cli/parse-args.ts` parses switches and validates the command shape. It
recognises output selection, artifact suppression, include paths, source-root,
case-style linting, directive aliases and register-care options.

The parsed result is an internal CLI shape. `src/cli/write-artifacts.ts` maps
that shape into `CompileNextFunctionOptions` for the public compile API. This
keeps argument parsing separate from compiler options.

## Disk Artifact Writing

`compile()` returns artifacts in memory. The CLI writes them to disk through
`writeArtifacts()` in `src/cli/write-artifacts.ts`.

That file owns CLI artifact paths:

- base path calculation
- primary output selection
- secondary artifact paths
- extension checks
- deterministic diagnostic sorting for CLI output

Output writer modules produce artifact objects. CLI code decides filenames.

## Compile API

`src/api-compile.ts` exports:

```ts
export async function compile(
  entryFile: string,
  options: CompileNextFunctionOptions = {},
  deps: CompileNextDependencies = { formats: defaultFormatWriters },
): Promise<CompileNextResult>
```

The compile API is file-backed. It reads source from disk, expands includes,
analyses the program, assembles it and returns artifacts in memory.

Important options include:

| Option | Meaning |
| --- | --- |
| `includeDirs` | Include search paths. |
| `directiveAliasFiles` | Project alias profile files. |
| `caseStyle` | Case-style lint mode. |
| `outputType` | Primary output type, `hex` or `bin`. |
| `sourceRoot` | Root used for portable D8 map paths. |
| `d8mInputs` | Artifact paths recorded in D8 metadata. |
| `emitBin`, `emitHex`, `emitD8m`, `emitAsm80` | Artifact selection. |
| `registerCare` | Register-care mode. |
| `emitRegisterReport` | Emit `.regcare.txt` artifact. |
| `emitRegisterInterface` | Emit `.asmi` artifact. |
| `emitRegisterAnnotations` | Emit source annotation artifact. |
| `fixRegisterContracts` | Apply conservative source fixes. |
| `acceptRegisterOutputCandidates` | Promote selected output candidates. |
| `registerCareProfile` | Built-in external contract profile. |
| `registerCareInterfaces` | External `.asmi` contract files. |
| `skipAssembly` | Run loading and analysis only. |

The dependency parameter injects format writers. Tests can use this to isolate
compile behaviour from disk output or writer implementation details.

## Tooling API

`src/tooling/api.ts` exports `loadProgramNext()` and `analyzeProgramNext()`.
`src/api-tooling.ts` re-exports those functions with register-care tooling
helpers.

`loadProgramNext()` returns a loaded program with source items, source texts and
source line comments. `analyzeProgramNext()` runs semantic checks and returns
symbols. `analyzeRegisterCareForTools()` returns register-care diagnostics and
code actions in a form suitable for editors.

Tooling callers use this path when they need diagnostics, symbols or
register-care facts in memory.

## API Compatibility

The public API is defined by package exports and exported TypeScript types. Keep
the following stable unless a major version is planned:

- exported function names
- option object property names
- result object shapes
- artifact kinds
- diagnostic object shape
- D8 map type exports
- register-care tooling result shapes

Internal files can move when the package exports stay stable. Public types in
`src/index.ts`, `src/api-compile.ts`, `src/api-tooling.ts` and
`src/outputs/types.ts` require more care.

## Maintenance Notes

When adding a CLI switch, update `parse-args.ts`, `write-artifacts.ts`,
`docs/reference/cli.md`, the README and CLI tests. When adding a compile API
option, update `api-compile.ts`, package-facing types, tooling API docs and
public API tests.

Run `test/public_api_surface.test.ts` and `test/types/` when changing exports.
