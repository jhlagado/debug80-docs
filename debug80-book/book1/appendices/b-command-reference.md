---
layout: default
title: "Appendix B — Command reference"
parent: "Debug80 Book 1 — Getting started"
nav_order: 102
---

# Appendix B — Command reference

This appendix lists the Debug80 commands available to users. The
Command Palette opens with **Shift-Command-P** on macOS or
**Shift-Control-P** on Windows and Linux; typing part of a title
filters the list.

## Projects and workspace folders

| Command | Does |
|---|---|
| **Debug80: Create Project** | Writes `debug80.json`, asking for a profile kit and a program file. Offers all five kits; the panel's Platform dropdown takes only the default kit for a platform. |
| **Debug80: Select Workspace Folder** | Chooses which open folder Debug80 is working on. |
| **Debug80: Add Workspace Folder** | Adds a folder to the workspace and offers to initialize it. |
| **Debug80: Remove Workspace Folder** | Removes a folder from the workspace. The folder stays on disk. |
| **Debug80: Configure Project** | Steps through project-level settings. |

## Targets

| Command | Does |
|---|---|
| **Debug80: Select Active Target** | Chooses which target Build and Run act on. |
| **Debug80: Add Target** | Adds a target from an eligible program file. |
| **Debug80: Remove Target** | Removes a target. Source files and build output stay on disk. |
| **Debug80: Set Program File** | Points a target at a file. Explorer and editor context menus only, on `.asm`, `.z80` and `.glim` files. |

## Building and running

| Command | Does |
|---|---|
| **Debug80: Build Current Target** | Assembles without launching. |
| **Debug80: Run Current Target** | Builds and starts the emulator, restarting any running session. |
| **Debug80: Start Debugging** | Starts the selected target, leaving any active debug session running. |
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
| **Debug80: Reset Panel Layout** | Restores the default section order and open state on the TEC-1 and TEC-1G panels. |
| **Debug80: Test CoolTerm Connection** | Pings CoolTerm's remote socket. Runs on an unbuilt project and leaves the serial port closed. |
| **Debug80: Send HEX to Board via CoolTerm** | Sends the active target's HEX file to a board. |
| **Debug80: Copy Monitor ROM into Project** | Copies the bundled monitor ROM source into the project. |
