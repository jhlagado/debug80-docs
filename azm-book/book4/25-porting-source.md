---
layout: default
title: "Chapter 25 — Porting Existing Z80 Source to AZM"
parent: "AZM Assembler Manual"
grand_parent: "AZM Books"
nav_order: 25
---
[← ASM80 Output](24-asm80-output.md) | [Manual](index.md) | [Style Guide →](26-style-guide.md)

# Chapter 25 — Porting Existing Z80 Source to AZM

This chapter will give experienced assembly programmers a practical migration path: assemble first, normalize syntax, then adopt AZM features only where they improve clarity.

## Planned sections

- Start with compatibility syntax
- Normalize numeric literals and directives
- Replace hard-coded constants with `.equ`
- Replace hand-counted offsets with layout types
- Introduce enums for states and commands
- Add contracts to stable subroutines
- Replace repeated idioms with ops
- Compare binaries while migrating

---

[← ASM80 Output](24-asm80-output.md) | [Manual](index.md) | [Style Guide →](26-style-guide.md)
