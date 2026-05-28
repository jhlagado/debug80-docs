---
layout: default
title: "Chapter 10 — One-Bit Sound"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 11
---
[← Direct Seven-Segment Scanning](09-direct-seven-segment.md) | [Book 2](index.md) | [The 8x8 RGB Add-On →](11-rgb-display.md)

# Chapter 10 — One-Bit Sound

This chapter will teach sound as timed output.

Planned coverage:

- MON-3 beep, note, and tune helpers
- the speaker as a single output bit
- the speaker bit sharing the digit latch
- toggling the bit to create a tone
- duration counters and divider counters
- why sound service belongs in the same cooperative loop as display scanning

Sound is a good bridge between simple output and timed hardware service. A bit that changes once is a click; a bit toggled regularly becomes a tone.

---

[← Direct Seven-Segment Scanning](09-direct-seven-segment.md) | [Book 2](index.md) | [The 8x8 RGB Add-On →](11-rgb-display.md)
