---
layout: default
title: "Install Debug80"
parent: "Debug80 Book 1 — Getting started"
nav_order: 1
---

[Book 1](index.md) | [Open a folder, make a project →](02-open-a-folder.md)

# Install Debug80

Debug80 is a Z80 development environment that runs inside VS Code. You write assembly, it assembles the code, loads it into an emulated TEC-1G, and lets you step through your own source while the emulated machine runs. When you are ready for real hardware, the same build produces a HEX file you can send to a board.

One install gets all of it. The extension carries the AZM assembler, the Glimmer compiler and the TEC-1 and TEC-1G emulation inside itself. There is no toolchain to download, no path to configure and no separate emulator to launch.

## Install VS Code

Debug80 needs VS Code **1.100.0** or later. Download it from [code.visualstudio.com](https://code.visualstudio.com/).

## Install the extension

Open the **Extensions** view from the Activity Bar down the left edge of the window.

Search for `debug80` and install **Debug80 IDE for Z80 Development**, published by `jhlagado`.

The extension takes over `.asm`, `.z80` and `.asmi` files for syntax highlighting, and `.glim` files for Glimmer. If you already have another Z80 assembly extension installed you do not need it, and Debug80 will set the language mode on those files itself.

## Find the Debug80 panel

Debug80 puts its panel in the **Run and Debug** sidebar rather than an activity bar icon of its own. Open that sidebar.

![The Debug80 section collapsed beneath Run in the Run and Debug sidebar](../../assets/images/debug80-book/book1/panel-sidebar-location.svg)

On a fresh install the sidebar opens with a **Run** section filling it, and Debug80 sits below as a collapsed section labelled **DEBUG80**. Click that header to expand it, and collapse **Run** above it to give Debug80 the room.

You work from that panel for the rest of this book. From there you choose a project, pick what to build, build it, run it, and watch the emulated machine while it runs.

If the panel is not there at all, the extension has not activated. Use VS Code's **View > Open View…** picker and choose Debug80 from the list.

## The empty state

With no folder open, the panel has one thing to say:

```text
Add projects or folders to the workspace to start with Debug80.
```

and one button, **Open Folder**.

![The Debug80 panel with no folder open](../../assets/images/debug80-book/book1/panel-state-no-folder.svg) The panel has nothing more to offer until a folder exists, because Debug80 works on folders. There is no separate "new project" wizard and nothing to name before you begin.

## Summary

- Debug80 requires VS Code **1.100.0** or later and installs from the marketplace as **Debug80 IDE for Z80 Development**.
- The assembler, the Glimmer compiler and the TEC-1 and TEC-1G emulation all ship inside the extension. Nothing else to install.
- The panel lives in the **Run and Debug** sidebar, collapsed at the bottom on a fresh install. Expand **DEBUG80** and collapse **Run**.
- With no folder open the panel offers **Open Folder** and nothing else.

---

[Book 1](index.md) | [Open a folder, make a project →](02-open-a-folder.md)
