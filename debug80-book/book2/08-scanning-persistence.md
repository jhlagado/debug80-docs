---
layout: default
title: "Chapter 8 — Scanning and Persistence of Vision"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 9
---
[← Six-Digit Display](07-seven-segment-numbers.md) | [Book 2](index.md) | [Direct Seven-Segment Scanning →](09-direct-seven-segment.md)

# Chapter 8 — Scanning and Persistence of Vision

This chapter will explain the timing trick behind the TEC-1G displays.

Planned coverage:

- why the six digits are not all independently latched
- showing one digit at a time
- cycling quickly enough that the eye sees a stable display
- the old television analogy: scan repeatedly and depend on persistence of vision
- what happens when the scan loop is too slow
- why hardware refresh becomes part of the program's job
- how this same idea prepares you for the 8x8 RGB matrix

This is the conceptual hinge of Book 2. Once scanning is clear, the six-digit display, one-bit sound service, and 8x8 matrix all become easier to understand.

---

[← Six-Digit Display](07-seven-segment-numbers.md) | [Book 2](index.md) | [Direct Seven-Segment Scanning →](09-direct-seven-segment.md)
