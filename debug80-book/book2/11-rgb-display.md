---
layout: default
title: "Chapter 11 — The 8x8 RGB Add-On"
parent: "Debug80 Book 2 — Programming the TEC-1G"
nav_order: 12
---
[← One-Bit Sound](10-one-bit-sound.md) | [Book 2](index.md) | [Framebuffers and Colour →](12-framebuffers-and-colour.md)

# Chapter 11 — The 8x8 RGB Add-On

This chapter will introduce the 8x8 RGB matrix after the scanning model is already familiar.

Planned coverage:

- the matrix as an add-on, not the core TEC-1G display
- row selection
- one byte for the red pixels in a row
- one byte for the green pixels in a row
- one byte for the blue pixels in a row
- combining red, green, and blue planes into visible colours
- why one row is emitted at a time
- clearing the active row before changing colour data
- drawing a single coloured cell

The RGB matrix becomes the main visual programming target because it makes timing, representation, colour, and hardware refresh impossible to ignore.

---

[← One-Bit Sound](10-one-bit-sound.md) | [Book 2](index.md) | [Framebuffers and Colour →](12-framebuffers-and-colour.md)
