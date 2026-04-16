---
layout: default
title: "Appendix D — ROM Bundle Infrastructure"
parent: "Appendices"
grand_parent: "Understanding the debug80 Codebase"
nav_order: 4
---
[← Appendix C](c-session-state.md) | [Appendices](index.md)

# Appendix D — ROM Bundle Infrastructure

The debug80 extension ships ROM firmware, listing files, and related assets for supported platforms directly inside the VSIX package. These assets are called **ROM bundles**. When a TEC-1G project is created, the MON3 ROM bundle is *materialized* into the workspace — meaning the files are copied from the extension directory into the project folder, where the debug adapter can load them at launch.

This appendix covers the bundle manifest schema, the materialization function, the resource directory layout, and how the bundle is wired into the project scaffolding and command flows.

---

## Why bundles?

Shipping firmware inside the extension means users get a working TEC-1G project immediately, without needing to source a ROM image separately. The bundle approach also allows the extension to verify file integrity via SHA-256 checksums, and to map files to named roles (ROM, listing, source tree) rather than relying on naming conventions.

---

## Resource directory layout

Bundle files are stored under `resources/bundles/` in the extension root:

```
resources/
  bundles/
    tec1g/
      mon3/
        v1/
          bundle.json      Manifest (schema version, file list, workspace layout)
          mon3.bin         ROM binary image
          mon3.lst         Assembler listing (symbols and source map)
          README.md        Human-readable notes about the firmware version
```

The path segments under `bundles/` form the *bundle relative path* (`tec1g/mon3/v1`). This path is passed to `materializeBundledRom()` and used to locate the bundle root directory. The constant `BUNDLED_MON3_V1_REL = 'tec1g/mon3/v1'` in `bundle-materialize.ts` is the canonical reference to the shipped MON3 bundle.

---

## `BundleManifestV1` — the manifest schema

`bundle.json` is parsed into a `BundleManifestV1` object (defined in `src/extension/bundle-manifest.ts`):

```typescript
interface BundleManifestV1 {
  schemaVersion: 1;           // Must equal BUNDLE_MANIFEST_SCHEMA_VERSION
  id: string;                 // Stable bundle identifier, e.g. 'tec1g/mon3'
  version: string;            // Semver or upstream label, e.g. '1.6.0-bc25'
  platform: 'simple' | 'tec1' | 'tec1g';
  label: string;              // Human-readable name, e.g. 'MON3 (TEC-1G)'
  files: BundleFileEntry[];
  workspaceLayout: BundleWorkspaceLayout;
}

interface BundleFileEntry {
  role: 'rom' | 'listing' | 'source_tree';
  path: string;               // Path relative to the bundle root directory
  sha256?: string;            // Optional SHA-256 hex for integrity verification
}

interface BundleWorkspaceLayout {
  destination: string;        // Directory relative to workspace root, e.g. 'roms/tec1g/mon3'
}
```

The MON3 v1 `bundle.json`:

```json
{
  "schemaVersion": 1,
  "id": "tec1g/mon3",
  "version": "1.6.0-bc25",
  "platform": "tec1g",
  "label": "MON3 (TEC-1G)",
  "files": [
    {
      "role": "rom",
      "path": "mon3.bin",
      "sha256": "754555aa4029fc496352fbb4a7de91e67c7c7e58de76c7dc5fba2e85e4705401"
    },
    {
      "role": "listing",
      "path": "mon3.lst",
      "sha256": "f6f5032cc16dceed7e921efe863371d8f2773465860bd518c9d998d83a5b67bb"
    }
  ],
  "workspaceLayout": {
    "destination": "roms/tec1g/mon3"
  }
}
```

`isBundleManifestV1()` validates the parsed JSON before trusting it. Any manifest that fails validation is treated as absent.

---

## `materializeBundledRom()` — copying files into the workspace

`materializeBundledRom()` in `src/extension/bundle-materialize.ts` copies the bundle files from the extension directory into the workspace:

```typescript
function materializeBundledRom(
  extensionUri: vscode.Uri,
  workspaceRoot: string,
  bundleRelPath: string,
  options?: { overwrite?: boolean }
): MaterializeBundledRomResult
```

**Steps:**

1. Read `bundle.json` from `<extensionUri>/resources/bundles/<bundleRelPath>/bundle.json` and validate it.
2. Resolve the destination directory: `<workspaceRoot>/<workspaceLayout.destination>`. Create it if needed.
3. For each file entry in the manifest:
   - Verify the source file exists in the extension bundle.
   - If `sha256` is specified, compute the SHA-256 of the source file and compare. Return `{ ok: false }` on mismatch.
   - If the destination file already exists and `overwrite` is not true, skip the copy (but still record the path).
   - Otherwise copy with `fs.copyFileSync()`.
4. Return `{ ok: true, destinationRelative, romRelativePath, listingRelativePath? }`.

The return value distinguishes between `ok: true` and `ok: false` with a `reason` string. On success, `romRelativePath` and `listingRelativePath` are workspace-relative paths (using `/` separators) that can be written directly into `debug80.json` as `romHex` and `extraListings` entries.

The `overwrite: false` default means subsequent calls on the same workspace are idempotent — files already present are not clobbered, but their paths are still resolved and returned.

---

## Integration points

### Project scaffolding

When `scaffoldProject()` in `src/extension/project-scaffolding.ts` creates a new TEC-1G project, it calls `materializeBundledRom(extensionUri, workspaceRoot, BUNDLED_MON3_V1_REL)`. On success, the scaffold plan is augmented with `bundledMon3: MaterializeBundledRomResult`. The resulting `debug80.json` includes `romHex` pointing at the materialized ROM binary and `extraListings` pointing at the materialized `.lst` file.

This means a brand-new TEC-1G project is immediately debuggable — the ROM is already on disk, referenced in config, and ready to load.

### Explicit command

The `debug80.materializeBundledRom` VS Code command (registered in `src/extension/commands.ts`) lets users re-run materialization manually. The command:

1. Prompts for a workspace folder.
2. Asks the user to confirm or pick the bundle (currently only MON3 v1 is available).
3. Calls `materializeBundledRom()` with `overwrite: false`.
4. Reports success or failure via `vscode.window.showInformationMessage()`.

This is useful if a user accidentally deleted the ROM files from their workspace and wants to restore them without recreating the project.

---

## Adding a new bundle

To add a second bundle (e.g. a different firmware version or a TEC-1 ROM):

1. Create a new directory under `resources/bundles/`, e.g. `tec1g/mon3/v2/`.
2. Place the files there and create a `bundle.json` with `schemaVersion: 1`.
3. Add a constant for the new relative path (e.g. `BUNDLED_MON3_V2_REL`).
4. Call `materializeBundledRom()` with the new path wherever it should be materialized.

The manifest validator (`isBundleManifestV1`) checks `schemaVersion === 1`. Future schema versions would add a new `isBundleManifestV2` validator and a migration path, leaving V1 parsing unchanged.

---

## Source files

| File | Role |
|------|------|
| `src/extension/bundle-manifest.ts` | `BundleManifestV1` type, `BundleFileEntry`, `BundleWorkspaceLayout`, `isBundleManifestV1()` |
| `src/extension/bundle-materialize.ts` | `materializeBundledRom()`, `BUNDLED_MON3_V1_REL`, `MaterializeBundledRomResult` |
| `src/extension/project-scaffolding.ts` | Calls `materializeBundledRom()` during TEC-1G project creation |
| `src/extension/commands.ts` | Registers `debug80.materializeBundledRom` command |
| `resources/bundles/tec1g/mon3/v1/` | Shipped bundle files: `bundle.json`, `mon3.bin`, `mon3.lst` |
| `tests/extension/bundle-materialize.test.ts` | Unit tests for `materializeBundledRom()` |

---

[← Appendix C](c-session-state.md) | [Appendices](index.md)
