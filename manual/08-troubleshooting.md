---
layout: default
title: "Troubleshooting"
parent: "Using Debug80 in VS Code"
nav_order: 8
---
# Troubleshooting

Start with the Debug Console message. Debug80 usually reports the file, target, or artifact that failed.

## Project Not Detected

Check that the open workspace folder contains `debug80.json` or `.vscode/debug80.json`. If the file is in a child folder, open that child folder or add it to the workspace and select it from the Debug80 panel.

Run `Debug80: Open Debug80 View` to reveal the sidebar panel. If the panel says the project is uninitialized, run `Debug80: Create Project` or click Initialize Project.

## F5 Launches the Wrong Target

Check `defaultTarget` in `debug80.json`. If the project has several targets, use `Debug80: Select Active Target` or the target picker in the panel.

When a launch configuration sets `"target"`, it can override `defaultTarget`.

## Breakpoint Is Hollow

The source line did not map to generated code. Move the breakpoint to a real instruction line and restart the session.

If the line should assemble, inspect the generated `.lst` file. The source file may not be part of the active target, or an include path may be missing from `sourceRoots`.

## Assembler Fails

Read the first assembler diagnostic in the Debug Console. Then check:

- The target's `sourceFile` path.
- The selected `assembler` backend.
- The syntax expected by that backend.
- The output directory.
- Include paths and files referenced by the source.

For ZAX work, make sure the target uses `"assembler": "zax"` or a `.zax` source path that the project intends to assemble with ZAX.

## ROM Asset Missing

For bundled profiles, a missing workspace ROM is only a problem when the profile lacks a matching `bundledAssets` entry or the path is misspelled.

Run `Debug80: Copy Bundled Assets into Workspace` if you want to materialize the shipped ROM and listing files. If you are using a custom ROM, verify that the target's `romHex` and `extraListings` point to your files.

## Panel Does Not Update

The memory views refresh while the session is paused and the relevant panel/tab is visible. Pause the session, switch to the memory tab, and try again.

For keyboard input, click inside the webview first. VS Code sends key events to the editor until the webview has focus.

## Serial Input Looks Wrong

Check that you are using the correct platform panel. TEC-1 and TEC-1G serial workflows use platform-specific custom requests.

If monitor input appears truncated, send the file again and avoid interacting with the panel during transfer. Serial send intentionally uses small delays so monitor code has time to process input.

## Source Opens in the Wrong Column

Set these launch options when you want predictable editor placement:

```json
{
  "sourceColumn": 1,
  "panelColumn": 2,
  "openMainSourceOnLaunch": true,
  "openRomSourcesOnLaunch": true
}
```

`sourceColumn` controls source files opened by Debug80. `panelColumn` controls platform panels.

