---
layout: default
title: "Chapter 3 — Debug80 Workflow"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 4
---
[← Running Under MON-3](02-running-under-mon3.md) | [Book 2](index.md) | [First Program →](04-first-program.md)

# Chapter 3 — Debug80 Workflow

This chapter will show how a TEC-1G AZM project is configured and debugged in VS Code.

Planned coverage:

- `debug80.json` project structure
- `projectPlatform: "tec1g"`
- MON-3 profiles and bundled ROM assets
- target entries for separate programs
- `appStart` at `$4000`
- source roots and monitor listings
- F5 launch, breakpoints, stepping, registers, memory, and listings
- how AZM artifacts fit into the Debug80 workflow
- how the TEC-1G panel lets you observe keypad, LCD, seven-segment, matrix, and other platform state

The Tetro repository has two Debug80 targets, one for Tetro and one for Pacmo. This chapter will use that shape later as inspiration for multi-target TEC-1G projects, but the first examples should stay much smaller.

---

[← Running Under MON-3](02-running-under-mon3.md) | [Book 2](index.md) | [First Program →](04-first-program.md)
