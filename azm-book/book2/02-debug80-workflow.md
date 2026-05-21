---
layout: default
title: "Chapter 2 — Debug80 Workflow"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 3
---
[← The TEC-1G Target](01-tec1g-target.md) | [Book 2](index.md) | [First Program →](03-first-program.md)

# Chapter 2 — Debug80 Workflow

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

The Tetro repository has two Debug80 targets, one for Tetro and one for Pacmo. This chapter will use that shape as inspiration for multi-target TEC-1G projects.

---

[← The TEC-1G Target](01-tec1g-target.md) | [Book 2](index.md) | [First Program →](03-first-program.md)
