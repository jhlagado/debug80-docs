---
layout: default
title: "Debug80 Book 1 — Getting Started"
nav_order: 3
has_children: true
has_toc: false
---

# Debug80 Book 1 — Getting Started

Debug80 turns Visual Studio Code into a Z80 development environment. You write assembly, run it in an emulated TEC-1G, step through it with source-level breakpoints, and send the same program to a real board over a serial cable.

This book walks that whole path once, from an empty folder to running hardware. You will install the extension, create a TEC-1G project, use the debugger, read the panel that shows the emulated machine, find the files each build produces, and send the generated HEX file to a TEC-1G through CoolTerm.

By the end you will know how to take a Z80 program all the way to hardware, and which part of Debug80 to reach for at each step.

## Main Path

1. [Install And Add A Folder](01-install-and-add-a-folder.md)
2. [Create A TEC-1G Project](02-create-a-tec1g-project.md)
3. [Run The Debugger](03-build-and-step.md)
4. [Inspect A Running Program](04-inspect-the-machine.md)
5. [Build Options And Source Maps](05-use-the-debug80-panel.md)
6. [Source Navigation And ROM Source](06-artifacts-roms-and-mapping.md)
7. [Send To TEC-1G Hardware](07-send-to-hardware-and-keep-working.md)

## Appendices

- [Appendix A — Debug Expressions](appendices/a-debug-expressions.md)
- [Appendix B — Command Reference](appendices/b-command-reference.md)
- [Appendix C — Debug80 File Formats](appendices/c-project-configuration.md)
