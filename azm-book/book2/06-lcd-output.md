---
layout: default
title: "Chapter 6 — Text on the LCD"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 7
---
[← Keypad Input](05-keypad-input.md) | [Book 2](index.md) | [Six-Digit Display →](07-seven-segment-numbers.md)

# Chapter 6 — Text on the LCD

This chapter will introduce the TEC-1G LCD as the first friendly output device.

Planned coverage:

- writing a character through MON-3
- writing a zero-terminated string through MON-3
- sending an LCD command through MON-3
- row positioning and useful row constants
- when to use the LCD for instructions, status, and mode text
- what the HD44780 instruction and data ports are doing underneath
- the point where direct LCD port access becomes useful

The case-study games use the LCD for splash screens, status messages, pause/game-over text, and instructions. That makes it a good output channel for teaching program state before using matrix pixels.

---

[← Keypad Input](05-keypad-input.md) | [Book 2](index.md) | [Six-Digit Display →](07-seven-segment-numbers.md)
