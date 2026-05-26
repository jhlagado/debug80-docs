---
layout: default
title: "Understanding the AZM Codebase"
nav_order: 4
has_children: true
---
# AZM Engineering Manual

This book is a technical reference for engineers working on the AZM assembler.
It explains the repository structure, the compile pipeline, the public APIs, the
source parser, the assembly model, the Z80 encoder, register-care analysis,
artifact writing and the verification lanes that keep the implementation
stable.

This manual is updated against the AZM codebase state through **2026-05-27**.
Use it as the map when planning changes. Use the TypeScript source and tests as
the final authority when a detail has changed.

AZM is deliberately compact. The codebase is organised around one central path:
load source, parse it into source items, expand visible ops, build assembler-time
facts, emit bytes, resolve fixups and write artifacts. Most files either support
one step on that path or expose the path to the CLI, Debug80 or tests.

---

## Part I - Orientation

- [Chapter 1 - What AZM Is](part1/01-what-azm-is.md)
- [Chapter 2 - Repository Layout](part1/02-repository-layout.md)

## Part II - Loading and Parsing

- [Chapter 3 - Source Loading and Logical Lines](part2/03-source-loading.md)
- [Chapter 4 - Parsing Source Items](part2/04-parsing-source-items.md)

## Part III - Assembly

- [Chapter 5 - Assembler-Time Facts](part3/05-assembler-time-facts.md)
- [Chapter 6 - Emission, Fixups and Z80 Encoding](part3/06-emission-fixups-z80.md)

## Part IV - Language Extensions

- [Chapter 7 - Ops and Visible Expansion](part4/07-ops-expansion.md)
- [Chapter 8 - Register Care](part4/08-register-care.md)

## Part V - Interfaces and Outputs

- [Chapter 9 - CLI and Public APIs](part5/09-cli-and-public-apis.md)
- [Chapter 10 - Output Artifacts](part5/10-output-artifacts.md)

## Part VI - Verification and Maintenance

- [Chapter 11 - Tests, Fixtures and Guardrails](part6/11-tests-fixtures-guardrails.md)
- [Chapter 12 - Maintaining the Codebase](part6/12-maintaining-the-codebase.md)

## Appendices

- [Appendix A - Directory and File Reference](appendices/a-directory-file-reference.md)
- [Appendix B - Compile Flow Reference](appendices/b-compile-flow-reference.md)
- [Appendix C - Public Surface Reference](appendices/c-public-surface-reference.md)
