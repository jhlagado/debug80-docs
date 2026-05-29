---
layout: default
title: "Appendix A — Command Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 101
---

[← Send To Hardware And Keep Working](../07-send-to-hardware-and-keep-working.md) | [Book 1](../index.md) | [Appendix B — Project Configuration Reference →](b-project-configuration.md)

# Appendix A — Command Reference

This appendix lists the Debug80 commands used here. Command titles are taken from the current Debug80 extension manifest.

Open the VS Code Command Palette to run these commands directly. On macOS, press **Shift-Command-P**. On Windows and Linux, press **Shift-Control-P**.

## Project Setup

| Command | Use |
|---|---|
| **Debug80: Create Project** | Create `debug80.json`, starter target and build setup for the selected folder. |
| **Debug80: Select Workspace Folder** | Choose the folder Debug80 should treat as the active project. |
| **Debug80: Select Active Target** | Choose the target launched by F5 and the panel build button. |
| **Debug80: Set Program File** | Bind an `.asm` or `.z80` file to the current target. |
| **Debug80: Configure Project** | Change project settings through the extension command flow. |
| **Debug80: Open Project Configuration Panel** | Open the project configuration panel for the active folder. |

## Debug Sessions

| Command | Use |
|---|---|
| **Debug80: Start Debugging** | Build and start the selected target. |
| **Debug80: Build Current Target** | Build the selected target from the command palette. |
| **Debug80: Open Debug80 View** | Reveal the Debug80 panel in the Run and Debug sidebar. |
| **Run to Here** | Continue execution to the selected stack frame location. |

## Platform Panels

| Command | Use |
|---|---|
| **Debug80: Show Terminal Panel** | Open the terminal panel. |
| **Debug80: Send Terminal Input** | Send text to the terminal path. |
| **Debug80: Show Platform Panel** | Open the active platform panel. |
| **Debug80: Show Platform Memory Panel** | Open the active platform memory panel. |
| **Debug80: Open Source File** | Open a source file known to Debug80. |
| **Debug80: Show Source Map Status** | Show the source-map status for the active target. |

## ROM And Hardware

| Command | Use |
|---|---|
| **Debug80: Open Auxiliary Source** | Open bundled or workspace auxiliary source material for the active platform. |
| **Debug80: Copy Bundled Assets into Workspace** | Copy bundled ROM and source assets into the project folder. |
| **Debug80: Test CoolTerm Connection** | Check whether Debug80 can reach CoolTerm's Remote Control Socket. |
| **Debug80: Send HEX to Board via CoolTerm** | Send the active target's HEX file to hardware through CoolTerm. |

[← Send To Hardware And Keep Working](../07-send-to-hardware-and-keep-working.md) | [Book 1](../index.md) | [Appendix B — Project Configuration Reference →](b-project-configuration.md)
