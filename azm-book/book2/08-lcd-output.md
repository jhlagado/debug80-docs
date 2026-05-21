---
layout: default
title: "Chapter 8 — LCD Output"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 9
---
[← Seven-Segment and Sound](07-seven-segment-and-sound.md) | [Book 2](index.md) | [A Cooperative Runtime →](09-cooperative-runtime.md)

# Chapter 8 — LCD Output

This chapter will introduce the TEC-1G LCD as a place for instructions, status, and mode text.

Planned coverage:

- HD44780 instruction and data ports
- busy-flag polling
- clear display and row positioning
- zero-terminated strings
- small screen scripts
- table-indexed characters
- when to use the LCD instead of the RGB matrix or seven-segment display

The case-study games use the LCD for splash screens, status messages, pause/game-over text, and instructions. That makes it a good output channel for teaching program state without using matrix pixels.

---

[← Seven-Segment and Sound](07-seven-segment-and-sound.md) | [Book 2](index.md) | [A Cooperative Runtime →](09-cooperative-runtime.md)
