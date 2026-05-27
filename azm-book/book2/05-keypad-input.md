---
layout: default
title: "Chapter 5 — Keypad Input"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 6
---
[← First Program](04-first-program.md) | [Book 2](index.md) | [Text on the LCD →](06-lcd-output.md)

# Chapter 5 — Keypad Input

This chapter will teach keypad input as state, not just a single read.

Planned coverage:

- MON-3 `scanKeys` and `scanKeysWait`
- key constants for arrows, GO, AD, digits, and no-key
- zero and carry flag meanings from the key scan call
- waiting for a key vs polling for a key
- edge-triggered actions
- held-key repeat
- normalizing different physical keys to the same program action

Tetro and Pacmo both use keypad input, but in different ways. Tetro has movement, rotation, soft drop, pause, and restart. Pacmo normalizes directional controls for a scrolling maze. Those patterns should appear later, after the basic keypad contract is clear.

---

[← First Program](04-first-program.md) | [Book 2](index.md) | [Text on the LCD →](06-lcd-output.md)
