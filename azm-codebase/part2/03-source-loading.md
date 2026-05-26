---
layout: default
title: "Chapter 3 - Source Loading and Logical Lines"
parent: "Part II - Loading and Parsing"
grand_parent: "Understanding the AZM Codebase"
nav_order: 3
---
[<- Repository Layout](../part1/02-repository-layout.md) | [Parsing Source Items ->](04-parsing-source-items.md)

# Chapter 3 - Source Loading and Logical Lines

Source loading is the first compiler boundary. It turns an entry path into an
expanded set of logical lines, source texts and comment maps. The central file
is `src/node/source-host.ts`.

The public tooling and compile APIs both enter loading through
`loadProgramNext()` in `src/tooling/api.ts`. That function delegates file work
to `expandSourceForTooling()`, then passes the expanded logical lines to
`parseNextSourceItems()`.

## Entry Files

`expandSourceForTooling()` accepts a `LoadProgramNextOptions` object:

```ts
export interface LoadProgramNextOptions {
  readonly entryFile: string;
  readonly includeDirs?: readonly string[];
  readonly directiveAliasFiles?: readonly string[];
  readonly preloadedText?: string;
  readonly signal?: AbortSignal;
}
```

The entry file is normalised and checked for a source extension. AZM source
entries use `.asm` or `.z80`. The loader returns a diagnostic for other
extensions before parsing begins.

`preloadedText` lets editor integrations parse an unsaved buffer. It applies to
the entry file only. Included files still come from disk. That keeps editor
feedback responsive while preserving normal include semantics for dependencies.

## Include Expansion

`.include` is textual inclusion. The loader reads the entry file, scans it into
logical lines and recursively expands include directives. Include paths are
resolved relative to the including source file first, then through the configured
include directories.

The output is an `ExpandedNextSource`:

```ts
export interface ExpandedNextSource {
  readonly entryFile: string;
  readonly lines: readonly LogicalLine[];
  readonly sourceTexts: ReadonlyMap<string, string>;
  readonly sourceLineComments: ReadonlyMap<string, ReadonlyMap<number, string>>;
}
```

This object preserves three pieces of information. `lines` is the flattened
source stream for parsing. `sourceTexts` keeps the original file text for later
tooling, register-care fixes and source maps. `sourceLineComments` keeps
comments indexed by file and line so AZMDoc register-care comments can be read
after the parser has built routine boundaries.

## Logical Lines

`src/source/logical-lines.ts` scans a `SourceFile` into `LogicalLine` objects.
A logical line records the source name, line number and original text. It is a
thin structure, but it gives every later diagnostic a stable location.

The source helpers are intentionally small:

| File | Role |
| --- | --- |
| `source-file.ts` | Wraps source text with a source name. |
| `logical-lines.ts` | Splits text into line records. |
| `source-span.ts` | Defines the common span shape. |
| `strip-line-comment.ts` | Removes semicolon comments while respecting quotes. |

`strip-line-comment.ts` is more important than its size suggests. Many parser
decisions need the code part of a line while preserving semicolons inside string
and character literals. Reuse this helper rather than adding ad hoc comment
splitting.

## Directive Alias Profiles

Directive aliases are loaded during `loadProgramNext()`:

```ts
const directiveAliasProfiles = await Promise.all(
  (options.directiveAliasFiles ?? []).map((path) => readDirectiveAliasProfile(path)),
);
const directiveAliasPolicy = buildDirectiveAliasPolicy(directiveAliasProfiles);
```

`src/syntax/directive-aliases.ts` owns the alias policy. Built-in aliases and
project alias files are normalised before line parsing. This lets legacy source
use familiar directive heads while the rest of the compiler receives canonical
source-item kinds.

Aliases are a syntax boundary. They affect directive recognition before parsing.
The assembler-time model should receive canonical source items.

## Diagnostics at the Loading Boundary

Loading diagnostics describe file and include problems: unsupported entry
extensions, missing files, failed reads and include resolution failures. These
diagnostics are data objects from `src/model/diagnostic.ts`. The loader returns
them to callers instead of printing them.

The CLI formats diagnostics at the edge with `formatDiagnostic()`. Tooling
consumers can display the same diagnostics in editors or test output.

## Maintenance Notes

Source loading owns provenance. If a change needs better source maps, fixups,
AZMDoc editing or include diagnostics, start here and preserve the file/line
information that later stages depend on.

Keep loading free of assembly semantics. It should find text, expand includes,
capture comments and produce logical lines. Parsing decides what those lines
mean.
