---
layout: default
title: "Appendix B - Compile Flow Reference"
parent: "Appendices"
grand_parent: "Understanding the AZM Codebase"
nav_order: 2
---
[<- Appendix A](a-directory-file-reference.md) | [Appendix C ->](c-public-surface-reference.md)

# Appendix B - Compile Flow Reference

This appendix gives the compact compile-flow map.

## File-Backed Compile API

```text
compile(entryFile, options, deps)
  normalize entry path
  loadProgramNext()
    expandSourceForTooling()
      read entry source
      expand textual .include
      collect source texts
      collect source line comments
      scan logical lines
    read directive alias profiles
    build directive alias policy
    parseNextSourceItems()
      apply conditional assembly
      collect op definitions
      parse layouts, aliases, enums, directives and instructions
      expand op invocations
  analyzeProgramNext()
    assembleProgram() for symbols
    lintCaseStyleNext()
  optionally analyzeRegisterCare()
    build program model
    read AZMDoc and .asmi contracts
    infer summaries
    run liveness
    build report, interface and annotation artifacts
  assembleProgram()
    buildAddressState()
    emitProgramImage()
  call selected format writers
    writeBin()
    writeHex()
    writeD8m()
    writeAsm80()
  return diagnostics and in-memory artifacts
```

## CLI Flow

```text
cli.ts
  runCli(argv)
    parseCliArgs(argv)
    artifactBase()
    buildCompileOptions()
    compile()
    format diagnostics
    writeArtifacts()
    return exit code
```

## Tooling Flow

```text
loadProgramNext()
  expand source
  parse source items
  return LoadedProgramNext

analyzeProgramNext(loaded)
  assemble for symbols
  run case-style lint
  return diagnostics and symbol environment

analyzeRegisterCareForTools(loaded)
  run register-care analysis in audit-oriented tooling mode
  return candidate diagnostics and code actions
```

## Data Handoffs

| Stage | Input | Output |
| --- | --- | --- |
| Source loading | entry path | logical lines, source texts, comments |
| Parsing | logical lines | source items |
| Analysis | source items | diagnostics, symbols |
| Register care | loaded program | summaries, conflicts, reports |
| Assembly | source items | byte map, symbols, source segments |
| Outputs | byte map and symbols | artifacts |
| CLI | artifacts | files on disk |
