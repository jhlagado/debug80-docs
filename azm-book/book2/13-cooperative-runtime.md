---
layout: default
title: "Chapter 13 — A Cooperative Runtime"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 14
---
[← Framebuffers and Colour](12-framebuffers-and-colour.md) | [Book 2](index.md) | [Shared Game Architecture →](14-shared-game-architecture.md)

# Chapter 13 — A Cooperative Runtime

This chapter will bring the hardware pieces together.

Planned coverage:

- the no-background-task constraint
- a main loop shaped as scan service plus logic service
- keeping the matrix visible while doing useful work
- servicing sound and seven-segment scan during the same loop
- polling keypad input without blocking scanout
- spreading a logical frame across several passes
- deciding what belongs in shared hardware routines and what belongs in program logic

The key pattern is:

```asm
main_loop:
    call scan_tick
    call logic_tick
    jr main_loop
```

The real work is deciding what each tick is allowed to do before the hardware needs service again.

---

[← Framebuffers and Colour](12-framebuffers-and-colour.md) | [Book 2](index.md) | [Shared Game Architecture →](14-shared-game-architecture.md)
