---
layout: default
title: "Appendix C — Debug80 File Formats"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 103
---

[← Appendix B — Command Reference](b-command-reference.md) | [Book 1](../index.md)

# Appendix C — Debug80 File Formats

Two generated formats are worth understanding: `debug80.json` and `.d8.json`.

`debug80.json` defines the Debug80 project. It tells Debug80 which platform the folder uses, which target to build, and where the target source and build output live.

`.d8.json` is the source map written by AZM after a successful build. It tells Debug80 how generated machine addresses connect back to source files, source lines and symbols.

Other build outputs matter for particular tasks, especially `.hex` when sending a program to hardware, but these two JSON formats explain most of Debug80's project and source-level debugging behaviour.

## Project Configuration

Debug80 project configuration lives at the root of the project folder:

```text
debug80.json
```

### Top-Level Shape

A generated TEC-1G project uses this general shape:

```json
{
  "projectVersion": 2,
  "projectPlatform": "tec1g",
  "defaultProfile": "mon3",
  "defaultTarget": "main",
  "profiles": {},
  "targets": {}
}
```

`projectPlatform` names the default platform family. `defaultProfile` names the profile used unless a target says otherwise. `defaultTarget` is the fallback target Debug80 can choose for the project.

### Launch Overrides

Most users can launch through the Debug80 panel. When a project needs a hand-written VS Code launch configuration, launch options can override the project defaults for that session.

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

`sourceFile` is the file AZM assembles. `outputDir` receives generated artifacts. `artifactBase` becomes the file name base for files such as `.hex` and source-map output.

### TEC-1G Platform Block

Generated TEC-1G targets include a `tec1g` block with memory regions, application start, entry point and ROM paths. The first workflow uses the generated values.

The important user-level facts are:

- TEC-1G / MON-3 user code starts at `0x4000`.
- The monitor ROM comes from Debug80's bundled platform assets for ordinary projects.
- A local monitor entry file such as `roms/tec1g/mon3/mon3.rom.asm` makes Debug80 build and load the project-local ROM source.
- `sourceRoots` helps Debug80 resolve source paths from generated maps and bundled source material.

### AZM Options

Debug80 uses AZM for the current assembly workflow. Targets may carry an `azm` object for register contract options and related launch behaviour. Leave generated options alone until you are deliberately configuring register contracts.

## Source Map Format

Debug80 uses its own D8 JSON mapping format for source maps. AZM writes the map beside the target artifacts:

```text
build/main.hex
build/main.d8.json
```

The `.d8.json` file is useful when you need to understand why Debug80 navigated to a line, named a call-stack frame, found a symbol, or bound a source breakpoint to a machine address. Most users read it indirectly through Debug80's editor and debugger features. Use the source-map status in the Project section and build the target when Debug80 needs fresh mapping data.

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
  segmentDefaults?: D8SegmentDefaults;
  symbolDefaults?: D8SymbolDefaults;
  memory?: D8MemoryLayout;
  generator?: D8Generator;
  diagnostics?: D8Diagnostics;
}
```

The required fields identify the file as a D8 debug map, declare the target architecture and collect mapping data by source file. Z80 maps normally use `arch: "z80"`, `addressWidth: 16` and `endianness: "little"`.

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

`start` is inclusive and `end` is exclusive. A two-byte instruction at `$4000` uses `start: 16384` and `end: 16386`. A zero-width segment, where `start` equals `end`, can preserve a label or directive location but does not describe executable bytes.

`confidence` tells Debug80 how strong the source association is:

| Value | Meaning |
|---|---|
| `high` | Direct assembler attribution. |
| `medium` | Derived mapping with enough context to be useful. |
| `low` | Approximate mapping. |

A symbol records a named label, data address or constant:

```typescript
interface D8Symbol {
  name: string;
  address?: number;
  value?: number;
  line?: number;
  kind?: 'label' | 'constant' | 'data' | 'macro' | 'unknown';
  scope?: 'global' | 'local';
  size?: number;
}
```

Address-backed symbols can be used for source navigation, call-stack naming and debugger display. Value-only constants can appear in symbol lookup and expression evaluation, but they are not breakpoint addresses.

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

[← Appendix B — Command Reference](b-command-reference.md) | [Book 1](../index.md)
