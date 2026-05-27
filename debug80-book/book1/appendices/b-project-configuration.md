---
layout: default
title: "Appendix B — Project Configuration Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 102
---
# Appendix B — Project Configuration Reference

Debug80 stores project configuration in the project folder. Book 1 uses the generated file, but reading the main fields helps when you add targets or inspect a copied project.

## File Locations

Debug80 can read project configuration from:

```text
debug80.json
.vscode/debug80.json
.debug80.json
package.json under a debug80 key
```

A VS Code launch configuration can also name a specific project file with `projectConfig`.

## Top-Level Shape

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

`projectPlatform` names the default platform family. `defaultProfile` names the profile used unless a target says otherwise. `defaultTarget` is the target Debug80 can choose when no remembered selection exists.

## Launch Overrides

Most users can launch through the Debug80 panel without a hand-written VS Code launch configuration. When a project needs one, launch options can override the project defaults for that session.

Use `projectConfig` when the configuration file is not in one of the standard locations. Use `target` when a launch configuration should always start a specific target, even if the Project section currently selects another one.

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

## Profiles

A profile records platform setup shared by targets. The TEC-1G / MON-3 profile identifies the platform and bundled ROM assets:

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
      "listing": {
        "bundleId": "tec1g/mon3/v1",
        "path": "mon3.lst",
        "destination": "roms/tec1g/mon3/mon3.lst"
      }
    }
  }
}
```

If the destination file exists in the workspace, Debug80 uses it. If it is absent, Debug80 can use the bundled copy from the extension.

## Targets

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

`sourceFile` is the file AZM assembles. `outputDir` receives generated artifacts. `artifactBase` becomes the file name base for files such as `.hex`, `.lst` and source-map output.

For small CPU-only programs, a Simple target can keep the platform setup minimal:

```json
"targets": {
  "app": {
    "sourceFile": "src/main.asm",
    "outputDir": "build",
    "artifactBase": "main",
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
```

Use a Simple target when the program needs Z80 execution, memory, registers and basic I/O without a TEC monitor profile.

## TEC-1G Platform Block

Generated TEC-1G targets include a `tec1g` block with memory regions, application start, entry point and ROM listing paths. Book 1 relies on the generated values.

The important user-level facts are:

- TEC-1G / MON-3 user code starts at `0x4000`.
- The ROM image and listing come from the bundled MON-3 profile unless you provide workspace copies.
- `sourceRoots` helps Debug80 resolve source paths from generated maps and ROM listings.

## AZM Options

Debug80 uses AZM for the current assembly workflow. Targets may carry an `azm` object for register-care options and related launch behaviour. Leave generated options alone until you are deliberately configuring register-care.

## Step Limits

`stepOverMaxInstructions` and `stepOutMaxInstructions` can limit how many Z80 instructions Debug80 executes while trying to complete a Step Over or Step Out request.

The default value is `0`, which means no cap. Set a positive value only when you need a guardrail for code that may not return in the way the debugger expects.
