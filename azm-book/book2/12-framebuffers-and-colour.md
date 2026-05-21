---
layout: default
title: "Chapter 12 — Framebuffers and Colour"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 13
---
[← The 8x8 RGB Add-On](11-rgb-display.md) | [Book 2](index.md) | [A Cooperative Runtime →](13-cooperative-runtime.md)

# Chapter 12 — Framebuffers and Colour

This chapter will move from immediate matrix writes to drawing through RAM.

Planned coverage:

- front buffer vs back buffer
- eight rows, four bytes per row
- red, green, blue, and padding bytes
- composing a frame in RAM
- copying or swapping finished rows
- drawing cells and row masks
- avoiding half-drawn frames
- why a tiny framebuffer is still a serious design tool

The Tetro and Pacmo shared code uses a 32-byte framebuffer. That shape is small enough to inspect in Debug80 and large enough to support real colour programs.

---

[← The 8x8 RGB Add-On](11-rgb-display.md) | [Book 2](index.md) | [A Cooperative Runtime →](13-cooperative-runtime.md)
