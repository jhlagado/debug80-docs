---
layout: default
title: "Appendix B — Command Reference"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 102
---

[← Appendix A — Debug Expressions](a-debug-expressions.md) | [Book 1](../index.md) | [Appendix C — Debug80 File Formats →](c-project-configuration.md)

# Appendix B — Command Reference

These Debug80 commands are exposed in the VS Code Command Palette. Command titles are taken from the current Debug80 extension manifest.

Open the VS Code Command Palette to run these commands directly. On macOS, press **Shift-Command-P**. On Windows and Linux, press **Shift-Control-P**.

## Project Setup

| Command | Use |
|---|---|
| **Debug80: Create Project** | Initialize a selected workspace folder as a Debug80 project. |
| **Debug80: Select Workspace Folder** | Choose the folder Debug80 should treat as the active project. |
| **Debug80: Select Active Target** | Choose the target used by Build, F5 and source-map-backed features. |
| **Debug80: Configure Project** | Open the project configuration flow for the active folder. |

## Debug Sessions

| Command | Use |
|---|---|
| **Debug80: Start Debugging** | Build and start the selected target. |
| **Debug80: Build Current Target** | Build the selected target from the command palette. |
| **Debug80: Open Debug80 View** | Reveal the Debug80 panel in the Run and Debug sidebar. |

## Source Navigation

| Command | Use |
|---|---|
| **Debug80: Open Source File** | Open a source file known to Debug80. |
| **Debug80: Show Source Map Status** | Show the source-map status for the active target. |
| **Debug80: Search Workspace Symbols** | Open VS Code's workspace symbol picker for Debug80 source-map symbols. |
| **Debug80: Open Auxiliary Source** | Open bundled or workspace auxiliary source material for the active platform. |

## Hardware

| Command | Use |
|---|---|
| **Debug80: Test CoolTerm Connection** | Check whether Debug80 can reach CoolTerm's Remote Control Socket. |
| **Debug80: Send HEX to Board via CoolTerm** | Send the active target's HEX file to hardware through CoolTerm. |

[← Appendix A — Debug Expressions](a-debug-expressions.md) | [Book 1](../index.md) | [Appendix C — Debug80 File Formats →](c-project-configuration.md)
