---
layout: default
title: "Chapter 15 — Parsing and Lookup"
parent: "Part VI — Source Mapping"
grand_parent: "Debug80 Engineering Manual"
nav_order: 2
---
[← Mapping Data Structures](14-mapping-data-structures.md) | [Part VI](index.md)

# Chapter 15 — Parsing and Lookup

This chapter follows the current source-mapping path from native D8 JSON, with the older listing path described as compatibility support, to breakpoint, editor-navigation, Watch, Variables and stack-frame lookup.

---

## Parsing a Listing

Listing parsing is no longer the normal active-project path. AZM emits a native `.d8.json` map, and Debug80 should use that map directly whenever it exists. The listing parser remains in the codebase for legacy artifacts, extra listings and ROM-related source mapping.

`parseMapping()` in `src/mapping/parser.ts` reads an asm80-style listing. It collects two records:

- listing entries, parsed from rows that begin with a four-hex-digit address
- symbol anchors, parsed from symbol-table definition rows

### Listing Rows

A listing row starts with an address and may contain byte tokens:

```text
0800  3E 01       LD A,1
0802              START:
```

The parser captures:

- `startAddr` from the leading address
- byte count from consecutive two-hex-digit byte tokens
- `endAddr` as `startAddr + byteCount`
- `asmText` as the remaining listing text
- `lstLineNumber`

Rows with no bytes still become entries. They produce zero-width segments after attachment and can provide source context, but they are filtered out for executable breakpoints.

### Symbol Anchors

The parser switches into symbol-table mode when it sees `DEFINED AT LINE`. Definition rows match this shape:

```text
LABEL: 0800 DEFINED AT LINE 12 IN src/main.asm
```

Rows containing `USED AT LINE` are ignored. Each definition becomes a `SourceMapAnchor`.

### `attachAnchors()`

After parsing, `attachAnchors()` walks the listing entries in order. If an entry starts at an anchor address and that address has not already consumed an anchor, the segment receives the anchor's file and line exactly.

For later entries, the mapper keeps the current file and estimates the source line by adding the listing-line distance from the last anchor:

```text
source line = anchor.line + (entry.lstLineNumber - anchorListingLine)
```

Entries before any anchor keep `loc.file: null` and `loc.line: null`.

Duplicate anchor addresses reduce anchor-hit confidence from `HIGH` to `MEDIUM`. Entries inferred after an anchor are `MEDIUM`; entries with no current file are `LOW`.

---

## Source Fallback and Layer 2

`buildMappingFromListing()` in `src/debug/mapping/mapping-service.ts` orchestrates listing-derived mapping.

When a target source file is known, `applySourceFallback()` fills missing or unresolved segment files with that source. This keeps simple single-file projects usable even when the listing has weak source attribution.

Then `applyLayer2()` in `src/mapping/layer2.ts` refines the mapping by comparing listing text to source text:

1. Resolve and load referenced source files.
2. Normalize listing text and source text with `normalizeAsm()`.
3. Search near the current source line for the best match.
4. Update segment line/confidence when a reliable match is found.
5. Report missing source files without aborting launch.

Layer 2 also handles a MON-style include problem. asm80 can assign bytes from an included file to the parent file while preserving the included file's line numbers. `remapAsm80MisassignedIncludeAnchors()` searches sibling `.z80` and `.asm` files for the symbol at the reported line. If exactly one sibling defines the symbol, the anchor is repointed. `propagateMisassignedIncludeSegments()` then retags the following segment range until the next genuine parent-file symbol.

The same remap and propagation pass runs after native D8 import, because a native map can contain the same inherited asm80 path attribution.

---

## Loading a D8 Map

When a D8 map is available, Debug80 parses and validates it with `parseD8DebugMap()` and `validateD8DebugMap()`. Structural validation uses the JSON schema shape: `format: "d8-debug-map"`, `version: 1`, architecture metadata, and grouped `files`.

`validateD8Segments()` performs quality checks and logs warnings. Warnings do not abort mapping; invalid JSON or schema-level failures make Debug80 fall back to listing-derived mapping.

`buildMappingFromD8DebugMap()` converts D8 file entries into `SourceMapSegment` and `SourceMapAnchor` arrays. D8 confidence strings are mapped into runtime confidence values:

| D8 | Runtime |
|---|---|
| `high` | `HIGH` |
| `medium` | `MEDIUM` |
| `low` | `LOW` |

If a native D8 map is loaded, Debug80 logs the generator label. Native maps are preferred over listing-derived fallback data even when the listing is newer.

---

## Building the Index

`buildSourceMapIndex()` builds three lookup structures:

1. `segmentsByAddress`, sorted by `start`, then listing line.
2. `segmentsByFileLine`, grouped by normalized resolved file path and line.
3. `anchorsByFile`, grouped by normalized resolved file path and sorted by source line/address.

Only resolvable files enter the file-line and anchor indexes. A segment can remain valid for address lookup even when it cannot be resolved to a source file.

---

## Address-to-Source Lookup

`findSegmentForAddress()` scans `segmentsByAddress` until it reaches a segment whose `start` is greater than the requested address.

A segment matches when:

```text
segment.start <= address < segment.end
```

When several segments overlap, the lookup prefers:

1. a segment with a valid source line over one without a valid line
2. the narrowest address span

This prevents broad context segments from shadowing instruction-level mappings. If the best segment has no valid source line, the warning handler can log a diagnostic.

---

## Source-to-Address Lookup

`resolveLocation()` and `resolveExecutableLocation()` both call the same internal lookup:

```typescript
const lineSlop = [0, -1, 1, -2, 2, -3, 3, -4, 4];
```

The lookup tries the exact line first, then nearby lines. This handles blank lines, labels, comments, and minor listing/source shifts.

`resolveLocation()` may fall back to the nearest anchor at or before the requested line. `resolveExecutableLocation()` returns only segments with `end > start` and never falls back to anchors. Breakpoint binding uses the executable path so labels, EQU rows, and directive-only lines do not become active breakpoints.

Both functions return an array of addresses. A source line can map to more than one address when macros or repeated listing rows are involved.

---

## Stack Frames and Breakpoints

Breakpoint handling calls source-to-address lookup during `setBreakpoints`. Addresses returned by `resolveExecutableLocation()` are registered with the breakpoint manager. If the VS Code breakpoint has a condition, the condition string is stored against the resolved address and evaluated later by the runtime loop. If no executable address is found, VS Code receives an unverified breakpoint.

Stack-frame resolution calls `findSegmentForAddress()` for the program counter. If a mapped file and line are available, VS Code can open and highlight that location. Debug80 also reads up to eight words from the current `SP` and treats mapped words as best-effort return-address frames. If mapping is missing, the stack display falls back to the raw address or marks stack words as likely data.

Editor features also consume this map. F12 / Go to Definition, hover details, workspace symbol search, the Variables panel, Watch expressions and conditional breakpoint expressions all use symbols from the active D8 map. If the map is missing or stale, user-facing messages should say "source map" or "build the target" rather than exposing the internal D8 name.

---

## SourceManager Orchestration

`SourceManager` in `src/debug/mapping/source-manager.ts` wraps the mapping service for launch:

1. Resolve the main source file from `asmPath`, `sourceFile`, or listing path.
2. Resolve configured `sourceRoots`.
3. Resolve and validate `extraListings`.
4. Extend source roots with extra listing directories.
5. Call `buildMappingFromListing()` with listing content, listing path, source fallback, extra listings, and D8 path resolvers.
6. Return source file, merged roots, extra listing paths, mapping, index, and missing-source warnings.

Extra listings, such as monitor ROM listings, are loaded through the same mapping path and merged into the primary mapping before the final index is built.

---

## Summary

- The listing parser reads address rows and symbol-table `DEFINED AT LINE` anchors.
- Address ranges are exclusive at `end`; zero-width rows can provide context but not executable breakpoints.
- Layer 2 matches listing text against source and repairs common include mis-attribution.
- D8 maps use the current `d8-debug-map` schema. Native AZM maps are the expected active-project path; listing-derived mappings remain compatibility data built in memory rather than project-local cache artifacts.
- Native D8 maps win over listing-derived compatibility maps and feed editor navigation, hover, workspace symbols, Variables, Watches and conditional breakpoints.
- Address lookup prefers valid source lines and narrow spans.
- Breakpoint lookup uses executable-only source-to-address resolution.

---

[← Mapping Data Structures](14-mapping-data-structures.md) | [Part VI](index.md)
