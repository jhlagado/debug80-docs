---
layout: default
title: "Chapter 7 — Numbers on the Six-Digit Display"
parent: "AZM Book 2 — Programming the TEC-1G"
nav_order: 8
---
[← Text on the LCD](06-lcd-output.md) | [Book 2](index.md) | [Scanning and Persistence →](08-scanning-persistence.md)

# Chapter 7 — Numbers on the Six-Digit Display

This chapter will teach the seven-segment display as numeric output before teaching full scan loops.

Planned coverage:

- what a seven-segment glyph is
- why digits are stored as segment bit patterns, not as ASCII
- MON-3 conversion helpers such as byte-to-segment and ASCII-to-segment
- preparing a six-byte display buffer
- using MON-3 to scan segment data
- displaying a counter, key code, or score-like value

The important idea is representation: a number in A or HL is not yet display data. You must convert it into segment patterns before the hardware can show it.

---

[← Text on the LCD](06-lcd-output.md) | [Book 2](index.md) | [Scanning and Persistence →](08-scanning-persistence.md)
