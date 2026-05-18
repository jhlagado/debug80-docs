---
layout: default
title: "Use the Debug80 Panel"
parent: "Using Debug80 in VS Code"
nav_order: 5
---
# Use the Debug80 Panel

The Debug80 panel lives in VS Code's Run and Debug sidebar. It gives you the project controls and the platform UI for the active target.

## Project Controls

The header shows the selected project folder and target. From there you can:

- Start or restart the current target.
- Switch the active target.
- Choose the main program file.
- Toggle stop on entry for the next explicit restart.
- Add or select a workspace folder.
- Initialize a project when the folder has no Debug80 config.

Once a project is initialized, the platform comes from `debug80.json`. Change the platform by editing the target config or creating a new target with another kit.

## Simple Platform

The Simple platform is useful for small RAM programs. It gives you a basic platform view and terminal-style I/O when the target config maps terminal ports.

Use Simple when you want to test Z80 execution, breakpoints, registers, and memory without a monitor ROM.

## TEC-1 Platform

The TEC-1 panel models the keypad, display, serial path, and memory inspector for TEC-1 monitor workflows.

Click inside the panel before using keyboard shortcuts. VS Code webviews only receive key events when the panel has focus. If a key press goes to the editor, click the panel and try again.

Use the memory tab while the session is paused. The panel polls memory during paused states and stops polling when hidden or switched away.

## TEC-1G Platform

The TEC-1G panel adds MON-3-oriented hardware: seven-segment display, LCD, GLCD, matrix display, matrix keyboard, serial, and memory views.

Panel visibility checkboxes let you hide sections you are not using. Visibility choices are remembered per workspace target, so a display-focused target and a serial-focused target can have different panel layouts.

Keyboard input follows the focused panel. Click the panel before using keypad or matrix-keyboard shortcuts. Use the on-screen controls when focus is ambiguous.

## ROM Sources

During TEC-1 and TEC-1G sessions, run:

```text
Debug80: Open ROM Listing/Source
```

Use this when the current PC is inside the monitor ROM or when you want to understand a monitor routine that your program calls.

