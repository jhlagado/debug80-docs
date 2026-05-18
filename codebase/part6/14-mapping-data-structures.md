---
layout: default
title: "Chapter 14 — Mapping Data Structures"
parent: "Part VI — Source Mapping"
grand_parent: "Understanding the debug80 Codebase"
nav_order: 1
---
[Part VI](index.md) | [Parsing and Lookup →](15-parsing-and-lookup.md)

# Chapter 14 — Mapping Data Structures

Source mapping is the bridge between the Z80 program counter and the file open in VS Code. When execution stops at an address, Debug80 asks the mapping index for a source location. When the user sets a breakpoint, Debug80 asks the same index which address belongs to that source line.

The core mapping types live in `src/mapping/parser.ts`, `src/mapping/source-map.ts`, and `src/mapping/d8-map.ts`.

---

## Listing Parse Result

The listing parser returns a `MappingParseResult`:

```typescript
interface MappingParseResult {
  segments: SourceMapSegment[];
  anchors: SourceMapAnchor[];
}
```

The parser does not keep a separate listing metadata object. Listing file path, source-root resolution, extra listings, and D8 map decisions are handled by the debug-layer mapping service in `src/debug/mapping/mapping-service.ts` and `src/debug/mapping/source-manager.ts`.

---

## SourceMapSegment

`SourceMapSegment` is the address range that Debug80 can map back to source:

```typescript
interface SourceMapSegment {
  start: number;          // Inclusive Z80 address
  end: number;            // Exclusive Z80 address
  loc: {
    file: string | null;  // Source file, if known
    line: number | null;  // 1-based source line, if known
  };
  lst: {
    line: number;         // 1-based listing line
    text: string;         // Assembly text captured from the listing
  };
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}
```

`start` and `end` use JavaScript slice-style ranges: `start` is included, `end` is excluded. A normal three-byte instruction at `0x0800` has `start: 0x0800` and `end: 0x0803`.

Some listing rows produce zero-width segments where `start === end`. Those rows can still provide useful source context for stack display or symbol lookup, but `resolveExecutableLocation()` filters them out when binding breakpoints.

`loc.file` and `loc.line` may be `null`. That happens when the listing has no usable symbol anchor yet, a source path cannot be resolved, or a D8 segment intentionally carries no source line.

### Confidence

| Value | Meaning |
|---|---|
| `HIGH` | The segment is tied to a symbol anchor or native D8 data with high confidence. |
| `MEDIUM` | The segment was inferred between known anchors or came from duplicate-address conditions. |
| `LOW` | The segment has weak or missing source attribution. |

The current address lookup prefers the narrowest segment with a valid source line. It does not sort by confidence at lookup time. Confidence still matters for diagnostics and for understanding why a map may be approximate.

---

## SourceMapAnchor

Anchors come from asm80-style symbol table lines, not from file/line comments in the listing body. The parser recognizes lines shaped like:

```text
SYMBOL: 0800 DEFINED AT LINE 42 IN src/main.asm
```

Each match becomes:

```typescript
interface SourceMapAnchor {
  address: number;
  symbol: string;
  file: string;
  line: number;
}
```

Anchors give the mapper a known file and source line for a specific address. During `attachAnchors()`, each segment at an anchor address receives that exact source location. Later segments inherit the most recent current file and advance line numbers by listing-line distance.

Duplicate anchor addresses lower confidence because several symbols point at the same address. `USED AT LINE` symbol-table rows are ignored; Debug80 only treats definitions as anchors.

---

## SourceMapIndex

`buildSourceMapIndex()` turns a `MappingParseResult` into lookup structures:

```typescript
interface SourceMapIndex {
  segmentsByAddress: SourceMapSegment[];
  segmentsByFileLine: Map<string, Map<number, SourceMapSegment[]>>;
  anchorsByFile: Map<string, SourceMapAnchor[]>;
}
```

`segmentsByAddress` is sorted by `start`, then listing line. Address lookup scans this ordered array until the requested address is before the next segment.

`segmentsByFileLine` groups segments by normalized absolute file path and 1-based source line. Only segments with a resolved file and line are indexed here. Each line list is sorted by address.

`anchorsByFile` groups anchors by normalized absolute file path. Each list is sorted by source line, then address. `resolveLocation()` uses this only as a non-executable fallback; `resolveExecutableLocation()` skips anchor fallback so labels and directives do not become active breakpoints.

Path keys are normalized with `normalizePathForKey()` so source lookup is case-insensitive where the platform requires it.

---

## D8DebugMap

D8 is the structured debug-map format used by Debug80 and by native producers such as ZAX. The current v1 root object is:

```typescript
interface D8DebugMap {
  format: 'd8-debug-map';
  version: 1;
  arch: string;
  addressWidth: number;
  endianness: 'little' | 'big';
  files: Record<string, D8FileEntry>;
  lstText?: string[];
  segmentDefaults?: D8SegmentDefaults;
  symbolDefaults?: D8SymbolDefaults;
  memory?: D8MemoryLayout;
  generator?: D8Generator;
  diagnostics?: D8Diagnostics;
}
```

The JSON schema lives at `schemas/d8-debug-map.schema.json`. Required fields are `format`, `version`, `arch`, `addressWidth`, `endianness`, and `files`.

File entries group segments and symbols under a source path key. The empty string key represents unknown source.

```typescript
interface D8FileEntry {
  meta?: { sha256?: string; lineCount?: number };
  segments?: D8Segment[];
  symbols?: D8Symbol[];
}
```

### D8Segment

```typescript
interface D8Segment {
  start: number;          // Inclusive address
  end: number;            // Exclusive address
  line?: number | null;
  column?: number;
  kind?: 'code' | 'data' | 'directive' | 'label' | 'macro' | 'unknown';
  confidence?: 'high' | 'medium' | 'low';
  lstLine: number;
  lstText?: string;
  lstTextId?: number;
  includeChain?: string[];
  macro?: { name: string; callsite: { file: string; line: number; column?: number } };
}
```

`buildMappingFromD8DebugMap()` converts each D8 segment into a `SourceMapSegment`. If `line` is missing, it falls back to `lstLine`; values below 1 become `null`. If `lstTextId` is present, the text is read from the top-level `lstText` table.

### D8Symbol

```typescript
interface D8Symbol {
  name: string;
  address: number;
  line?: number;
  kind?: 'label' | 'constant' | 'data' | 'macro' | 'unknown';
  scope?: 'global' | 'local';
  size?: number;
}
```

Symbols with a source line become `SourceMapAnchor` entries during D8 import.

---

## Debug Map Selection

`buildMappingFromListing()` prefers sidecar native maps before cached Debug80 maps. Candidate paths are:

1. `<listing basename>.d8.json` beside the listing.
2. The cache path resolved for the target.
3. The legacy cache path.

Native maps win over generated listing caches and are not rejected because the listing has a newer mtime. Debug80-generated maps are checked for staleness against the listing.

If no usable map exists, Debug80 parses the listing, applies Layer 2 refinement, builds a D8 map with `generator: { name: 'debug80' }`, writes it to the cache path, then imports it through the same D8 path used for native maps.

---

## Summary

- `SourceMapSegment` now uses `start`, exclusive `end`, `loc`, `lst`, and `confidence`.
- `SourceMapAnchor` is an address/symbol/file/line record parsed from symbol definitions.
- `SourceMapIndex` has three lookup structures: by address, by file/line, and by file anchors.
- D8 v1 requires `format`, `version`, `arch`, `addressWidth`, `endianness`, and grouped `files`.
- D8 segments use `start` and exclusive `end`, matching runtime `SourceMapSegment` ranges.
- Native D8 maps are preferred over generated cache maps; listing-derived maps are regenerated when stale.

---

[Part VI](index.md) | [Parsing and Lookup →](15-parsing-and-lookup.md)
