---
layout: default
title: "Chapter 16 — Pacmo Case Study"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 17
---
[← Tetro Case Study](15-tetro-case-study.md) | [Book 2](index.md) | [Beyond the Core →](17-beyond-core.md)

# Chapter 16 — Pacmo Case Study

This chapter will begin the Pacmo code tour. Like the Tetro material, it may split into several chapters once the full treatment is written.

Planned coverage:

- reusing the shared TEC-1G hardware layer
- representing a larger maze behind an 8x8 viewport
- scrolling by moving the view origin
- consumable paths and power-state timing
- monster records and movement periods
- rendering world state into the matrix framebuffer
- scoring on the seven-segment display
- LCD messages and sound cues
- how the same hardware services support a very different program structure

Pacmo is useful because it stresses a different part of the same machine. Tetro is about pieces and collision in a fixed board. Pacmo is about a larger world seen through a tiny display.

---

[← Tetro Case Study](15-tetro-case-study.md) | [Book 2](index.md) | [Beyond the Core →](17-beyond-core.md)
