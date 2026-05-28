---
layout: default
title: "Appendix B — Project Configuration Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 102
---
# Appendix B — Project Configuration Reference

Debug80 stores project configuration in the project folder. Book 1 uses the generated file, but reading the main fields helps when you add targets or inspect a copied project.

## File Location

Debug80 project configuration lives at the root of the project folder:

```text
debug80.json
```

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

`projectPlatform` names the default platform family. `defaultProfile` names the profile used unless a target says otherwise. `defaultTarget` is the fallback target Debug80 can choose for the project.

## Launch Overrides

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

`sourceFile` is the file AZM assembles. `outputDir` receives generated artifacts. `artifactBase` becomes the file name base for files such as `.hex` and source-map output.

## TEC-1G Platform Block

Generated TEC-1G targets include a `tec1g` block with memory regions, application start, entry point and ROM paths. Book 1 relies on the generated values.

The important user-level facts are:

- TEC-1G / MON-3 user code starts at `0x4000`.
- The ROM image comes from the bundled MON-3 profile unless you provide a workspace copy.
- `sourceRoots` helps Debug80 resolve source paths from generated maps and bundled source material.

## AZM Options

Debug80 uses AZM for the current assembly workflow. Targets may carry an `azm` object for register-care options and related launch behaviour. Leave generated options alone until you are deliberately configuring register-care.
