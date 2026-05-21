---
layout: default
title: "Chapter 5 — Keypad Input"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 6
---
[← Ports and Output](04-ports-and-output.md) | [Book 2](index.md) | [The 8x8 RGB Display →](06-rgb-display.md)

# Chapter 5 — Keypad Input

This chapter will teach keypad input as state, not just a single read.

Planned coverage:

- MON-3 key scanning conventions
- key constants for arrows, GO, AD, digits, and no-key
- waiting for a key vs polling for a key
- edge-triggered actions
- held-key repeat
- normalizing different physical keys to the same game action

Tetro and Pacmo both use keypad input, but in different ways. Tetro has movement, rotation, soft drop, pause, and restart. Pacmo normalizes directional controls for a scrolling maze. Those patterns will become examples later.

---

[← Ports and Output](04-ports-and-output.md) | [Book 2](index.md) | [The 8x8 RGB Display →](06-rgb-display.md)
