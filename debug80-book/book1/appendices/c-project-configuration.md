---
layout: default
title: "Appendix C — Debug80 file formats"
parent: "Debug80 Book 1 — Getting started"
nav_order: 103
---

[← Appendix B — Command reference](b-command-reference.md) | [Book 1](../index.md) | [Appendix D — The AZM options row →](d-azm-options-row.md)

# Appendix C — Debug80 file formats

Two generated formats are worth understanding: `debug80.json` and `.d8.json`.

`debug80.json` defines the Debug80 project: the folder's platform, available targets, source locations and build-output locations.

`.d8.json` is the source map written by AZM after a successful build. It maps generated machine addresses back to source files, source lines and symbols.

## Project configuration

Debug80 project configuration lives at the root of the project folder:

```text
debug80.json
```

Debug80 also accepts it at `.vscode/debug80.json`, and looks for the root copy first.

No JSON schema ships for this file, so editing it by hand gets no completion or validation in the editor. Prefer the panel and the Debug80 commands for routine changes, and use this appendix when you need to read or hand-edit something they do not cover.

### Top-level shape

A generated TEC-1G project uses this general shape:

```json
{
  "projectVersion": 2,
  "projectPlatform": "tec1g",
  "defaultProfile": "mon3",
  "defaultTarget": "main",
  "azm": { "symbolCase": "strict" },
  "profiles": {},
  "targets": {}
}
```

`projectPlatform` names the default platform family. `defaultProfile` names the profile used unless a target overrides it. `defaultTarget` is the project's fallback target.

Initialization writes `"targets": {}` and omits `defaultTarget` when you choose **No target yet**, and adds a top-level `outputDir` instead.

### Launch overrides

When a project needs a hand-written VS Code launch configuration, launch options can override the project defaults for that session. These keys go in a `.vscode/launch.json` entry with `"type": "z80"`.

Use `target` when a launch configuration should always start a specific target, even if the Project section currently selects another one.

Debug80 can also control where it opens files:

```json
{
  "sourceColumn": 1,
  "panelColumn": 2,
  "openMainSourceOnLaunch": true,
  "openRomSourcesOnLaunch": true
}
```

`sourceColumn` controls source files opened by Debug80. `panelColumn` controls the platform panel. The two automatic-open settings are useful when you want a repeatable screen layout for teaching, screenshots or demonstrations.

### Profiles

A profile records platform setup shared by targets. The TEC-1G / MON-3 profile identifies the platform and bundled monitor assets:

```json
"profiles": {
  "mon3": {
    "platform": "tec1g",
    "description": "TEC-1G monitor-first profile with user code at 0x4000.",
    "bundledAssets": {
      "romHex": {
        "bundleId": "tec1g/mon3/v1",
        "path": "mon3.bin",
        "destination": "roms/tec1g/mon3/mon3.bin"
      },
      "debugMap": {
        "bundleId": "tec1g/mon3/v1",
        "path": "mon3.d8.json",
        "destination": "roms/tec1g/mon3/mon3.d8.json"
      }
    }
  }
}
```

Ordinary TEC-1 and TEC-1G projects use the monitor ROM supplied by Debug80. Monitor development uses a local `*.rom.asm` entry file copied by **Debug80: Copy Monitor ROM into Project**.

### Targets

A target is a named runnable program:

```json
"targets": {
  "main": {
    "sourceFile": "src/main.asm",
    "outputDir": "build",
    "artifactBase": "main",
    "platform": "tec1g",
    "profile": "mon3"
  }
}
```

`sourceFile` is the entry file passed to the target's build backend. `outputDir` receives generated artifacts. `artifactBase` becomes the file name base for files such as `.hex` and source-map output.

### TEC-1G platform block

Generated TEC-1G targets include a `tec1g` block with memory regions, application start, entry point and ROM paths.

The important user-level facts are:

- TEC-1G / MON-3 user code starts at `0x4000`.
- The monitor ROM comes from Debug80's bundled platform assets for ordinary projects.
- A local monitor entry file such as `roms/tec1g/mon3/mon3.rom.asm` makes Debug80 build and load the project-local ROM source.
- `sourceRoots` helps Debug80 resolve source paths from generated maps and bundled source material.

### AZM options

An `azm` object carries assembler options, at the project root or on an individual target.

| Key | Values | Meaning |
|---|---|---|
| `symbolCase` | `strict`, `insensitive` | Whether label capitalization must match exactly. Anything other than the literal `insensitive` is treated as `strict`. |
| `registerContracts` | `off`, `audit`, `warn`, `error`, `strict` | How register contract conflicts are reported. `error` and `strict` fail the build. |
| `emitRegisterReport` | boolean | Write the `.regcontracts.txt` report beside the other artifacts. |
| `emitRegisterInterface` | boolean | Write the `.asmi` interface file. |

`symbolCase` is the one you will meet without going looking for it: the **Strict labels** checkbox in the panel writes it, and it is the only panel control that changes `debug80.json` as you click it. Scaffolding sets `strict` for new projects. Turn it off for legacy source with inconsistent capitalization.

The remaining register-contract options are generated with sensible defaults.

One trap: a `registerContracts` value written here is overridden by the panel's **Register Contracts** dropdown for any build started from the panel, so the file is not the last word it appears to be. [Appendix D](d-azm-options-row.md) covers that row and what survives a restart.

## Source map format

Debug80 uses its own D8 JSON mapping format for source maps. AZM writes the map beside the target artifacts:

```text
build/main.hex
build/main.d8.json
```

The `.d8.json` file is useful when you need to understand why Debug80 navigated to a line, named a call-stack frame, found a symbol, or bound a source breakpoint to a machine address. Use the source-map status in the Project section and build the target when Debug80 needs fresh mapping data.

A D8 v1 file is a JSON object with this root shape:

```typescript
interface D8DebugMap {
  format: 'd8-debug-map';
  version: 1;
  arch: string;
  addressWidth: number;
  endianness: 'little' | 'big';
  files: Record<string, D8FileEntry>;
  lstText?: string[];
  segments?: Array<{ start: number; end: number }>;
  fileList?: string[];
  symbols?: Array<D8Symbol & { file?: string }>;
  segmentDefaults?: D8SegmentDefaults;
  symbolDefaults?: D8SymbolDefaults;
  memory?: D8MemoryLayout;
  generator?: D8Generator;
  diagnostics?: D8Diagnostics;
}
```

The required fields identify the file as a D8 debug map, declare the target architecture and collect mapping data by source file. Z80 maps normally use `arch: "z80"`, `addressWidth: 16` and `endianness: "little"`.

Current AZM maps also include three root indexes. `segments` records the address ranges written by the build, `fileList` gives a stable source-file order, and `symbols` provides a flat symbol index with a `file` field on each source-backed symbol. The per-file entries remain the portable mapping data required by Debug80; consumers that do not need the root indexes may ignore them.

The optional root objects have these shapes:

```typescript
interface D8SegmentDefaults {
  kind?: 'code' | 'data' | 'directive' | 'label' | 'macro' | 'unknown';
  confidence?: 'high' | 'medium' | 'low';
}

interface D8SymbolDefaults {
  kind?: 'label' | 'constant' | 'data' | 'macro' | 'unknown';
  scope?: 'global' | 'local';
}

interface D8MemoryLayout {
  segments: Array<{
    name: string;
    start: number;
    end: number;
    kind?: 'rom' | 'ram' | 'io' | 'banked' | 'unknown';
    bank?: number;
  }>;
}

interface D8Generator {
  name?: string;
  tool?: string;
  version?: string;
  args?: string[];
  createdAt?: string;
  inputs?: Record<string, string>;
  entrySymbol?: string;
  entryAddress?: number;
}

interface D8Diagnostics {
  warnings?: string[];
  errors?: string[];
}
```

`segmentDefaults` and `symbolDefaults` supply omitted values throughout the file. `memory` describes the target's address regions. `generator` identifies the tool and inputs that produced the map. Its optional `entrySymbol` and `entryAddress` identify the program entry selected by the producer. `diagnostics` can preserve warnings and errors from generation.

Each file entry can hold segments and symbols:

```typescript
interface D8FileEntry {
  meta?: {
    sha256?: string;
    lineCount?: number;
  };
  segments?: D8Segment[];
  symbols?: D8Symbol[];
}
```

Keys in `files` identify source paths. Producers should use forward slashes and project-relative paths for sources inside the project so a map remains portable between operating systems and workspaces. An absolute path is appropriate only when a source lies outside the project root. Debug80 also accepts the empty key for a segment whose source file is unknown.

A segment maps generated bytes back to source:

```typescript
interface D8Segment {
  start: number;
  end: number;
  line?: number | null;
  column?: number;
  kind?: 'code' | 'data' | 'directive' | 'label' | 'macro' | 'unknown';
  confidence?: 'high' | 'medium' | 'low';
  lstLine: number;
  lstText?: string;
  lstTextId?: number;
  includeChain?: string[];
  macro?: {
    name: string;
    callsite: {
      file: string;
      line: number;
      column?: number;
    };
  };
}
```

`start` is inclusive and `end` is exclusive. A two-byte instruction at `$4000` uses `start: 16384` and `end: 16386`. Usable mappings have `end` greater than `start`; Debug80 accepts an empty range structurally but reports it as a map-quality warning because it describes no generated bytes.

`lstLine` is required and records the one-based line in the assembler's source context. `line` records the one-based line in the original source file when that location is known; it may be omitted or `null` otherwise. `column` and `macro.callsite.column` are also one-based when present. `lstText` stores source-context text directly on the segment. As an alternative, `lstTextId` is a zero-based index into the root `lstText` array and must refer to an existing entry.

`confidence` records the strength of the source association:

| Value | Meaning |
|---|---|
| `high` | Direct assembler attribution. |
| `medium` | Derived mapping with enough context to be useful. |
| `low` | Approximate mapping. |

A symbol records a named label, data address or constant:

```typescript
interface D8Symbol {
  name: string;
  identity?: string;
  address?: number;
  value?: number;
  line?: number;
  kind?: 'label' | 'constant' | 'data' | 'macro' | 'unknown';
  scope?: 'global' | 'local';
  visibility?: 'exported' | 'source' | 'local';
  sourceUnit?: string;
  size?: number;
}
```

Every symbol must have an `address`, except a symbol whose effective kind is `constant`, which may have a numeric `value` instead. Address-backed symbols can be used for source navigation, call-stack naming and debugger display. Value-only constants can appear in symbol lookup and expression evaluation, but they are not breakpoint addresses. A symbol's optional `line` is one-based.

`identity` is a stable declaration identity emitted by AZM. `scope` records global or local lookup scope, while `visibility` records whether AZM exported the declaration, kept it visible to its source unit or kept it local. `sourceUnit` names the assembled source unit that owns the declaration.

This is a minimal source map for a one-byte instruction at `$0800`, tied to line 5 of `src/main.asm`:

```json
{
  "format": "d8-debug-map",
  "version": 1,
  "arch": "z80",
  "addressWidth": 16,
  "endianness": "little",
  "files": {
    "src/main.asm": {
      "segments": [
        {
          "start": 2048,
          "end": 2049,
          "lstLine": 5,
          "line": 5,
          "confidence": "high",
          "kind": "code"
        }
      ],
      "symbols": [
        {
          "name": "Start",
          "address": 2048,
          "line": 5,
          "kind": "label",
          "scope": "global"
        }
      ]
    }
  }
}
```

Debug80 validates the file before importing it. Invalid JSON or an unsupported D8 version leaves source-map-backed features unavailable until the target builds successfully again.

---

[← Appendix B — Command reference](b-command-reference.md) | [Book 1](../index.md) | [Appendix D — The AZM options row →](d-azm-options-row.md)
