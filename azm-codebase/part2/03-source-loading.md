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

The loader is deliberately practical. It receives a path from the CLI or a tool,
finds the source text, expands textual includes and preserves enough provenance
for every later diagnostic and artifact. It does this before the assembler
knows whether a line is a label, directive or instruction.

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

The `signal` option gives editor integrations a way to cancel stale work. An
editor can start loading after each keystroke and abort an older request when a
newer buffer arrives. The loader treats cancellation as part of the calling
tool's control flow; the compiler stages after loading receive only completed
source expansions.

## Source Text Capture

The loader keeps the full text of every loaded source file in `sourceTexts`.
Later stages use the parsed source items for compiler logic, but some features
need the original text:

- register-care annotation needs exact source lines when rewriting comments
- tooling needs source text for editor diagnostics and code actions
- D8 map generation needs file names and line provenance
- case-style linting reads original source lines to inspect token case

Loading returns both logical lines and source text maps for that reason.
Logical lines drive parsing. Source texts support tools that need to point back
into the user's files.

## Include Expansion

`.include` is textual inclusion. The loader reads the entry file, scans it into
logical lines and recursively expands include directives. Include paths are
resolved relative to the including source file first, then through the configured
include directories.

The "relative to the including source file first" rule matters for multi-file
projects. A library can include a sibling file and keep working when the entry
file is assembled from another directory. Include directories then act as a
project-level search path for shared headers and vendor sources.

Every included line keeps its original source name and line number. The flattened
line stream is convenient for parsing, while each line's provenance keeps
diagnostics and source maps accurate.

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

The comment map exists because AZMDoc comments carry meaning for register care,
while ordinary comments usually disappear during parsing. Keeping comments by
file and line lets register care reconstruct the contract block that precedes a
routine entry label.

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

The helper is used in several places that look unrelated: include recognition,
layout header parsing, field parsing, conditional assembly and single-line
parsing. Shared comment handling keeps these paths consistent.

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

Alias files are loaded before parsing begins, so the parser can treat alias
handling as part of directive normalisation. The policy object is passed into
`parseNextSourceItems()`, then down to `parseLogicalLine()` and op expansion
where needed.

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

When adding a source-level feature, keep this boundary in mind. A new directive
may need loader support only if it affects file discovery or source provenance.
Most directives belong in parsing and assembly rather than loading.
