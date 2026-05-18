---
layout: default
title: "ROMs, Bundled Assets, and Serial"
parent: "Using Debug80 in VS Code"
nav_order: 6
---
# ROMs, Bundled Assets, and Serial

Monitor-backed profiles need ROM and listing assets. Debug80 ships stock bundles for the built-in monitor kits and lets you override them from your workspace.

## Bundled Assets

TEC-1 / MON-1B and TEC-1G / MON-3 profiles include bundled ROM assets. A scaffolded project records stable workspace-relative paths such as:

```text
roms/tec1/mon1b/mon-1b.bin
roms/tec1/mon1b/mon-1b.lst
roms/tec1g/mon3/mon3.bin
roms/tec1g/mon3/mon3.lst
```

If the file exists in the workspace, Debug80 uses that file. If it does not exist and the profile has a matching `bundledAssets` entry, Debug80 uses the copy inside the extension.

This lets a project run immediately while still giving you a simple override path when you want to inspect or replace a ROM.

## Copy Bundled Assets

Run this command when you want local copies in your workspace:

```text
Debug80: Copy Bundled Assets into Workspace
```

Copy assets when you want to inspect a listing, compare a ROM, or keep a project self-contained. You do not need to copy assets for normal debugging when the profile already references the bundle.

## Serial Send and Save

TEC-1 and TEC-1G panels include serial workflows:

- Send a text or HEX file to the emulated serial input.
- Save the current serial buffer to a file.
- Clear the serial buffer.

Serial send transmits text progressively, with short delays between characters and lines. This matters because monitor software often expects input at human or device speed, not as one instant block.

When saved serial text looks like Intel HEX, Debug80 offers a `.hex` file filter.

