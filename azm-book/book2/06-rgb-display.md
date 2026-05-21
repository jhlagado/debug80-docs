---
layout: default
title: "Chapter 6 — The 8x8 RGB Display"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 7
---
[← Keypad Input](05-keypad-input.md) | [Book 2](index.md) | [Seven-Segment and Sound →](07-seven-segment-and-sound.md)

# Chapter 6 — The 8x8 RGB Display

This chapter will explain the TEC-1G's 8x8 RGB matrix as hardware you must keep alive.

Planned coverage:

- row selection
- red, green, and blue bit planes
- why one row is emitted at a time
- clearing the active row before changing colour data
- framebuffer layout
- double buffering
- avoiding visible flicker
- drawing one cell, one row, and a complete frame

The Tetro and Pacmo shared code uses a 32-byte framebuffer: eight rows, four bytes per row, with red, green, blue, and padding bytes. That shape is a strong teaching example because it is small enough to inspect and real enough to support complete programs.

---

[← Keypad Input](05-keypad-input.md) | [Book 2](index.md) | [Seven-Segment and Sound →](07-seven-segment-and-sound.md)
