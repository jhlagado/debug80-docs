---
layout: default
title: "Appendix C — Image And Screenshot Plan"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 103
---
# Appendix C — Image And Screenshot Plan

Book 1 now carries visible image placeholders in the chapter text. This appendix tracks the same image set as a production checklist.

## Installation And Folder Setup

| Image | Type | Chapter |
|---|---|---|
| Debug80 in the VS Code Marketplace | Screenshot | Chapter 1 |
| Run and Debug sidebar with Debug80 visible | Screenshot | Chapter 1 |
| Debug80 panel with no project configured | Screenshot | Chapter 1 |
| Debug80 panel with an uninitialized folder selected | Screenshot | Chapter 1 |

## Project Creation

| Image | Type | Chapter |
|---|---|---|
| Command Palette with **Debug80: Create Project** | Screenshot | Chapter 2 |
| Platform/profile picker with **TEC-1G / MON-3** selected | Screenshot | Chapter 2 |
| Fresh TEC-1G project in Explorer | Screenshot | Chapter 2 |
| Project section after creation | Screenshot | Chapter 2 |
| Starter `src/main.asm` | Screenshot | Chapter 2 |

## Build And Debug

| Image | Type | Chapter |
|---|---|---|
| Project section with **Stop on entry** and **Build** | Screenshot | Chapter 3 |
| Source editor paused at `NOP` | Screenshot | Chapter 3 |
| Breakpoint beside an instruction line | Screenshot | Chapter 3 |
| Conditional breakpoint editor with a Debug80 expression | Screenshot | Chapter 3 |
| VS Code debug toolbar annotated | Screenshot or diagram | Chapter 3 |

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
| Build folder with `.hex`, `.lst` and source-map output | Screenshot | Chapter 6 |
| Source beside listing excerpt | Screenshot | Chapter 6 |
| Source map diagram | Generated diagram | Chapter 6 |
| Go to Definition on an assembly symbol | Screenshot | Chapter 6 |
| Workspace symbol picker with Debug80 symbols | Screenshot | Chapter 6 |
| Symbol hover with address and source location | Screenshot | Chapter 6 |
| **Debug80: Open ROM Source** command | Screenshot | Chapter 6 |
| MON-3 source or listing beside user source | Screenshot | Chapter 6 |
| Copied bundled assets in Explorer | Screenshot | Chapter 6 |

## Hardware Transfer

| Image | Type | Chapter |
|---|---|---|
| CoolTerm Remote Control Socket setting | Screenshot | Chapter 7 |
| CoolTerm serial options | Screenshot | Chapter 7 |
| **Send to Board** visible in Debug80 | Screenshot | Chapter 7 |
| TEC-1G receive mode | Hardware photo | Chapter 7 |
| Successful `PASSED` response | Screenshot or photo | Chapter 7 |
| Target selector with several targets | Screenshot | Chapter 7 |

## Generated Diagrams

- Folder -> Debug80 project -> target -> source file.
- Source -> AZM -> `.hex`, `.lst` and source-map output.
- Source line -> source map -> Z80 address -> breakpoint.
- Source map status -> build action -> editor/debugger feature availability.
- Emulator serial path versus CoolTerm hardware path.
- TEC-1G memory map for the MON-3 profile.
