---
layout: default
title: "Create or Configure a Project"
parent: "Using Debug80 in VS Code"
nav_order: 3
---
# Create or Configure a Project

Use the scaffold command when a folder does not already have a Debug80 target. It creates a starter source file when needed, writes `debug80.json`, and can create a VS Code launch configuration.

## Create a Project

Open the Command Palette and run:

```text
Debug80: Create Project
```

Choose the profile kit that matches your target machine:

| Kit | Platform | Starts user code at |
|---|---|---:|
| Simple / Default | `simple` | `0x0900` |
| TEC-1 / MON-1B | `tec1` | `0x0800` |
| TEC-1 / Classic 2K | `tec1` | `0x0900` |
| TEC-1G / MON-3 | `tec1g` | `0x4000` |

The Run and Debug sidebar can also show an Initialize Project button when a folder has no project file. That path uses the default kit for the selected platform.

## Minimal Simple Config

This target assembles `test/fixtures/echo.asm`, writes artifacts into `build`, and runs on the Simple platform:

```json
{
  "defaultTarget": "app",
  "targets": {
    "app": {
      "sourceFile": "test/fixtures/echo.asm",
      "outputDir": "build",
      "artifactBase": "echo",
      "platform": "simple",
      "simple": {
        "regions": [
          { "start": 0, "end": 2047, "kind": "rom" },
          { "start": 2048, "end": 65535, "kind": "ram" }
        ],
        "appStart": 2304,
        "entry": 0
      }
    }
  }
}
```

`sourceFile` is the file Debug80 assembles. `outputDir` receives generated artifacts. `artifactBase` becomes the base file name for those artifacts. `platform` selects the runtime. The platform block gives the runtime its memory map and application start.

## TEC-1G MON-3 Config

The TEC-1G MON-3 kit uses a monitor ROM and places your program at `0x4000`:

```json
{
  "projectVersion": 2,
  "projectPlatform": "tec1g",
  "defaultProfile": "mon3",
  "defaultTarget": "main",
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
        "listing": {
          "bundleId": "tec1g/mon3/v1",
          "path": "mon3.lst",
          "destination": "roms/tec1g/mon3/mon3.lst"
        }
      }
    }
  },
  "targets": {
    "main": {
      "sourceFile": "src/main.asm",
      "outputDir": "build",
      "artifactBase": "main",
      "platform": "tec1g",
      "profile": "mon3",
      "tec1g": {
        "regions": [
          { "start": 0, "end": 16383, "kind": "rom" },
          { "start": 16384, "end": 49151, "kind": "ram" },
          { "start": 49152, "end": 65535, "kind": "rom" }
        ],
        "appStart": 16384,
        "entry": 0,
        "romHex": "roms/tec1g/mon3/mon3.bin",
        "extraListings": ["roms/tec1g/mon3/mon3.lst"],
        "sourceRoots": ["src", "roms/tec1g/mon3"]
      }
    }
  }
}
```

The ROM path is stable and workspace-relative. If the ROM file exists in your workspace, Debug80 treats it as a local override. If it is absent and the profile has a `bundledAssets` entry, Debug80 resolves the copy shipped with the extension.

## Multiple Targets

Add another entry under `targets` when the same folder has more than one program. Set `defaultTarget` to the one F5 should launch first. Use `Debug80: Select Active Target` or the Debug80 panel target selector to switch targets.

