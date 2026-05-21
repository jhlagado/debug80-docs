---
layout: default
title: "Chapter 9 — Direct Seven-Segment Scanning"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 10
---
[← Scanning and Persistence](08-scanning-persistence.md) | [Book 2](index.md) | [One-Bit Sound →](10-one-bit-sound.md)

# Chapter 9 — Direct Seven-Segment Scanning

This chapter will move below MON-3 and scan the six-digit display directly.

Planned coverage:

- `PortDigits` and `PortSegs`
- digit select masks
- segment glyph bytes
- a six-byte display buffer
- one scan step vs a full scan pass
- why the loop must keep returning to display service
- common mistakes: all digits off, wrong digit selected, ghosting, flicker

The goal is not to reject MON-3 helpers. The goal is to understand what those helpers are doing and to prepare for programs that must scan several devices cooperatively.

---

[← Scanning and Persistence](08-scanning-persistence.md) | [Book 2](index.md) | [One-Bit Sound →](10-one-bit-sound.md)
