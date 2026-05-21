---
layout: default
title: "Chapter 7 — Seven-Segment Display and Sound"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 8
---
[← The 8x8 RGB Display](06-rgb-display.md) | [Book 2](index.md) | [LCD Output →](08-lcd-output.md)

# Chapter 7 — Seven-Segment Display and Sound

This chapter will cover two time-sensitive outputs that share the cooperative loop.

Planned coverage:

- six-digit seven-segment multiplexing
- digit masks and segment glyphs
- formatting a small score or counter
- the speaker bit on the digit port
- one-bit sound as a timed toggle
- why sound and display service must run often

Tetro and Pacmo both use the six-digit display for scoring and a small speaker service for sound cues. The shared code treats both as hardware maintenance work that runs alongside the matrix scan.

---

[← The 8x8 RGB Display](06-rgb-display.md) | [Book 2](index.md) | [LCD Output →](08-lcd-output.md)
