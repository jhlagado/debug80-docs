---
layout: default
title: "Appendix C — Image And Screenshot Plan"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 103
---

[← Appendix B — Project Configuration Reference](b-project-configuration.md) | [Book 1](../index.md) | [Appendix D — Glossary →](d-glossary.md)

# Appendix C — Image And Screenshot Plan

This appendix tracks this book's image set as a production checklist.

## Installation And Folder Setup

| Image | Type | Chapter |
|---|---|---|
| Debug80 in the VS Code Marketplace | Screenshot | Chapter 1; added as `marketplace-entry.png` |
| Run and Debug sidebar with Debug80 visible | Screenshot | Chapter 1; added as `run-debug-debug80-view.png` |
| View > Open View menu item | Screenshot | Chapter 1; added as `open-view-menu.png` |
| Open View picker showing Debug80 | Screenshot | Chapter 1; added as `open-view-debug80-picker.png` |
| Debug80 panel with an uninitialized folder selected | Screenshot | Chapter 1; added as `uninitialized-project-panel.png` |
| File > Add Folder to Workspace | Screenshot | Chapter 1; added as `add-folder-menu.png` |
| New folder dialog creating `project1` | Screenshot | Chapter 1; added as `create-project-folder-dialog.png` |
| Folder chooser with `project1` selected | Screenshot | Chapter 1; added as `add-project-folder-dialog.png` |
| Project selector showing uninitialized `project1` | Screenshot | Chapter 1; added as `select-project-folder-picker.png` |

## Project Creation

| Image | Type | Chapter |
|---|---|---|
| Command Palette with **Debug80: Create Project** | Screenshot | Chapter 2; lower priority because the panel path is now primary |
| Platform/profile picker with **TEC-1G / MON-3** selected | Screenshot | Chapter 2; added as `select-tec1g-platform.png` |
| Fresh TEC-1G project in Explorer | Screenshot | Chapter 2; added as `explorer-initialized-project.png` |
| Project section after creation | Screenshot | Chapter 2; added as `initialized-project-panel.png` |
| Starter `src/main.asm` | Screenshot | Chapter 2; added as part of `initialized-project-panel.png` |
| MON-3 address mode showing `4000` | Screenshot | Chapter 2; added as `monitor-edit-address-4000.png` |
| Starter program running in Machine section | Screenshot | Chapter 2; added as `starter-running-output.png` |

## Build And Debug

| Image | Type | Chapter |
|---|---|---|
| Project section with **Stop on entry** and **Build** during a paused launch | Screenshot | Chapter 3; added as `chapter3-stop-on-entry-build-paused.png` |
| Source editor paused at `ld sp,0x7fff` | Screenshot | Chapter 3; still useful as a tighter retake if available |
| Breakpoint beside an instruction line | Screenshot | Chapter 3; added as `chapter3-breakpoint-scan-hello.png` |
| **Run to Cursor** from the editor context menu | Screenshot | Chapter 3; added as `chapter3-run-to-cursor-menu.png` |
| Breakpoint gutter menu showing **Edit Breakpoint** | Screenshot | Chapter 3; added as `chapter3-edit-breakpoint-menu.png` |
| Conditional breakpoint editor with a Debug80 expression | Screenshot | Chapter 3; added as `chapter3-conditional-breakpoint-expression.png` |
| VS Code debug toolbar | Screenshot | Chapter 3; added as `chapter3-debug-toolbar.png` |

## Machine Inspection

| Image | Type | Chapter |
|---|---|---|
| Variables view with Symbols and Constants | Screenshot | Chapter 4 |
| Watch panel with Z80 expressions | Screenshot | Chapter 4 |
| Call Stack view with symbolic current frame | Screenshot | Chapter 4 |
| Debug80 Registers section | Screenshot | Chapter 4 |
| Memory section at `0x4000` | Screenshot | Chapter 4 |
| Machine section showing LCD, seven-segment display and keypad | Screenshot | Chapter 4 |
| Keypad focus annotation | Edited screenshot | Chapter 4 |

## Panel Walkthrough

| Image | Type | Chapter |
|---|---|---|
| Full TEC-1G accordion overview | Screenshot | Chapter 5 |
| Project section close-up | Screenshot | Chapter 5 |
| Project section source-map status line | Screenshot | Chapter 5 |
| Displays section | Screenshot | Chapter 5 |
| Matrix Keyboard section | Screenshot | Chapter 5 |
| Serial section | Screenshot | Chapter 5 |

## Artifacts And ROMs

| Image | Type | Chapter |
|---|---|---|
| Build folder with `.hex` and source-map output | Screenshot | Chapter 6 |
| Source map diagram | Generated diagram | Chapter 6 |
| Go to Definition on an assembly symbol | Screenshot | Chapter 6 |
| Workspace symbol picker with Debug80 symbols | Screenshot | Chapter 6 |
| Symbol hover with address and source location | Screenshot | Chapter 6 |
| **Debug80: Open ROM Source** command | Screenshot | Chapter 6 |
| MON-3 source beside user source | Screenshot | Chapter 6 |
| Copied bundled assets in Explorer | Screenshot | Chapter 6 |

## Hardware Transfer

| Image | Type | Chapter |
|---|---|---|
| CoolTerm Remote Control Socket setting | Screenshot | Chapter 7; added as `coolterm-remote-control-socket.png` |
| CoolTerm serial options | Screenshot | Chapter 7; added as `coolterm-serial-options.png` |
| **Send to Board** visible in Debug80 | Screenshot | Chapter 7 |
| TEC-1G MON-3 Intel HEX Load mode | Hardware photo | Chapter 7 |
| TEC-1G seven-segment display showing `PASS` after load | Hardware photo | Chapter 7 |
| TEC-1G seven-segment display showing `ERROR` after a rejected load, if practical | Hardware photo | Chapter 7 |
| Target selector with several targets | Screenshot | Chapter 7 |

## Generated Diagrams

- Folder -> Debug80 project -> target -> source file.
- Source -> AZM -> `.hex` and source-map output.
- Source line -> source map -> Z80 address -> breakpoint.
- Source map status -> build action -> editor/debugger feature availability.
- Emulator serial path versus CoolTerm hardware path.
- TEC-1G memory map for the MON-3 profile.

[← Appendix B — Project Configuration Reference](b-project-configuration.md) | [Book 1](../index.md) | [Appendix D — Glossary →](d-glossary.md)
