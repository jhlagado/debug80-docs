---
layout: default
title: "Appendix A — Command Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 101
---
# Appendix A — Command Reference

This appendix lists the Debug80 commands used in Book 1. Command titles are taken from the current Debug80 extension manifest.

## Project Setup

| Command | Use |
|---|---|
| **Debug80: Create Project** | Create `debug80.json`, starter source and build setup for the selected folder. |
| **Debug80: Select Workspace Folder** | Choose the folder Debug80 should treat as the active project. |
| **Debug80: Select Active Target** | Choose the target launched by F5 and the panel build button. |
| **Debug80: Set Program File** | Bind an `.asm` or `.z80` source file to the current target. |
| **Debug80: Configure Project** | Change project settings through the extension command flow. |
| **Debug80: Open Project Configuration Panel** | Open the project configuration panel for the active folder. |

## Debug Sessions

| Command | Use |
|---|---|
| **Debug80: Start Debugging** | Build and start the selected target. |
| **Debug80: Restart Debugging (Current Target)** | Rebuild and relaunch the active target. |
| **Debug80: Open Debug80 View** | Reveal the Debug80 panel in the Run and Debug sidebar. |

## Platform Panels

| Command | Use |
|---|---|
| **Debug80: Show Terminal Panel** | Open the terminal panel. |
| **Debug80: Send Terminal Input** | Send text to the terminal path. |
| **Debug80: Show TEC-1 Panel** | Open the TEC-1 panel. |
| **Debug80: Show TEC-1 Memory Panel** | Open the TEC-1 memory panel. |

## ROM And Hardware

| Command | Use |
|---|---|
| **Debug80: Open ROM Source** | Open bundled or workspace ROM source material for the active profile. |
| **Debug80: Copy Bundled Assets into Workspace** | Copy bundled ROM and source assets into the project folder. |
| **Debug80: Send HEX to Board via CoolTerm** | Send the active target's HEX file to hardware through CoolTerm. |
