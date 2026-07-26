---
layout: default
title: "Appendix B — Command reference"
parent: "Debug80 Book 1 — Getting started"
nav_order: 102
---

[← Appendix A — Debug expressions](a-debug-expressions.md) | [Book 1](../index.md) | [Appendix C — Debug80 file formats →](c-project-configuration.md)

# Appendix B — Command reference

Every command Debug80 contributes. Open the Command Palette with **Shift-Command-P** on macOS or **Shift-Control-P** on Windows and Linux, then type part of the title.

Everything the panel can do is also a command. That is deliberate: it keeps the panel reachable from the keyboard, and it lets scripts and tests drive Debug80 without a mouse.

## Projects and workspace folders

| Command | Does |
|---|---|
| **Debug80: Create Project** | Writes `debug80.json`, asking for a profile kit and a program file. Offers all five kits, where the panel's Platform dropdown takes the default kit for a platform. |
| **Debug80: Select Workspace Folder** | Chooses which open folder Debug80 is working on. |
| **Debug80: Add Workspace Folder** | Adds a folder to the workspace and offers to initialize it. |
| **Debug80: Remove Workspace Folder** | Removes a folder from the workspace. Files on disk are untouched. |
| **Debug80: Configure Project** | Steps through project-level settings. |

## Targets

| Command | Does |
|---|---|
| **Debug80: Select Active Target** | Chooses which target Build and Run act on. |
| **Debug80: Add Target** | Adds a target from an eligible program file. |
| **Debug80: Remove Target** | Removes a target. Source files and build output are untouched. |
| **Debug80: Set Program File** | Points a target at a file. Explorer and editor context menus only, on `.asm`, `.z80` and `.glim` files. |

## Building and running

| Command | Does |
|---|---|
| **Debug80: Build Current Target** | Assembles without launching. |
| **Debug80: Run Current Target** | Builds and starts the emulator, restarting any running session. |
| **Debug80: Start Debugging** | Starts a session without stopping an existing one. Bound to **F5**. |
| **Run to Here** | Runs until execution returns to the selected frame. Call Stack context menu only. |

## Source and diagnostics

| Command | Does |
|---|---|
| **Debug80: Search Workspace Symbols** | Searches the active target's symbols. |
| **Debug80: Open Source File** | Opens a source file known to the current build. |
| **Debug80: Open Auxiliary Source** | Opens monitor ROM source. Needs an active session. |
| **Debug80: Show Source Map Status** | Reports whether the source map is current, and what it covers. |
| **Debug80: Copy Project Status (JSON)** | Copies the panel's whole view of the project to the clipboard as JSON. |

## Panel and hardware

| Command | Does |
|---|---|
| **Debug80: Open Debug80 View** | Reveals and focuses the panel. |
| **Debug80: Reset Panel Layout** | Restores the default section order and open state. No effect on the Simple platform. |
| **Debug80: Test CoolTerm Connection** | Pings CoolTerm's remote socket. Opens no port and needs no build. |
| **Debug80: Send HEX to Board via CoolTerm** | Sends the active target's HEX file to a board. |
| **Debug80: Copy Monitor ROM into Project** | Copies the bundled monitor ROM source into the project. |

## Not reachable from the palette

These are registered but hidden, either because something else drives them or because they are left over from earlier work. They are listed for completeness; nothing in this book asks you to run them.

| Command | Note |
|---|---|
| **Debug80: Open Project Configuration Panel** | Opens a settings editor that nothing currently invokes. |
| **Debug80: Show Platform Panel** | Hard-coded to the TEC-1 platform. |
| **Debug80: Show Platform Memory Panel** | Hard-coded to the TEC-1 platform. |
| **Debug80: Show Terminal Panel** | The standalone terminal opens by itself for unrecognised platforms. |
| **Debug80: Send Terminal Input** | Used by that terminal. |

## Keyboard shortcuts

Debug80 contributes exactly one keybinding of its own: **F5** starts a debug session when the workspace holds a project and no session is running. Everything else uses VS Code's own debug shortcuts - **F10**, **F11**, **Shift-F11** and **F12**.

---

[← Appendix A — Debug expressions](a-debug-expressions.md) | [Book 1](../index.md) | [Appendix C — Debug80 file formats →](c-project-configuration.md)
