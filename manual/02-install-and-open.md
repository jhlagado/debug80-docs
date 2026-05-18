---
layout: default
title: "Install and Open a Project"
parent: "Using Debug80 in VS Code"
nav_order: 2
---
# Install and Open a Project

You need the Debug80 VS Code extension installed, a workspace folder open, and a project configuration file. The configuration file tells Debug80 which source file to assemble and which platform to emulate.

## Install a Local VSIX

When you are testing a local Debug80 build, package and install the VSIX from the Debug80 repository:

```bash
npm ci
npm run package:check
code --install-extension debug80-0.0.1.vsix --force
```

Reload VS Code after installing or replacing the extension.

## Open the Right Folder

Open the folder that owns your Z80 project files. Debug80 searches for project configuration from the current workspace, so opening a parent folder or the extension source tree can make the project appear missing.

For TEC-1 and TEC-1G examples, existing workspace repositories are often the fastest starting point. Use those when you want a complete monitor-oriented demo. Use `Debug80: Create Project` when you want to add Debug80 to a new or existing folder.

## Project Configuration Discovery

Debug80 looks for project configuration in these locations:

| Location | When to use it |
|---|---|
| `debug80.json` | Best default for a project dedicated to Debug80. |
| `.vscode/debug80.json` | Useful when you want VS Code-specific config beside `launch.json`. |
| `.debug80.json` | Legacy or local layout. |
| `package.json` under a `debug80` key | Useful for JavaScript-hosted projects that already centralize tool config. |

If a launch configuration sets `projectConfig`, that path wins.

## Required Shape

A practical project has:

- A source file such as `src/main.asm` or `src/main.zax`.
- A Debug80 config file with at least one target.
- An output directory such as `build`.
- A platform block for `simple`, `tec1`, or `tec1g`.

The scaffold command creates these pieces for you.

