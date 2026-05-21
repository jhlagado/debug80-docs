---
layout: default
title: "Introduction"
parent: "AZM Book 2 — Programming the TEC-1G"
grand_parent: "AZM Books"
nav_order: 1
---
[Book 2](index.md) | [The TEC-1G Reborn →](01-tec1g-reborn.md)

# Introduction

Book 1 kept the Z80 mostly platform-neutral. That was deliberate: before you can program a machine well, you need to understand registers, memory, flags, branches, the stack, and subroutines without a hardware manual interrupting every idea.

This book puts the hardware back in. The TEC-1G is the main target for this course: a Z80 single-board computer with MON-3, a hex keypad, a six-digit seven-segment display, an LCD, optional graphics and storage hardware, and a memory map designed for experiments.

The TEC-1G also has a longer story. It continues the spirit of the TEC-1 learning computers of the 1980s: small enough to understand, visible enough to teach, and direct enough that every byte and port still matters. The 2023 TEC-1G rebirth keeps that trainer-computer idea while adding modern conveniences and a richer monitor environment.

Debug80 makes that machine practical to learn. You can assemble AZM source, load a MON-3 ROM profile, step instructions, inspect ports and memory, and watch the simulated TEC-1G respond. The point is not to hide the hardware. The point is to make the hardware observable while you learn it.

---

## What this book will teach

You will learn how to:

- set up a Debug80 TEC-1G project
- place user code in the MON-3 workbench region
- call useful MON-3 API routines with `RST 10H`
- read keypad input through MON-3 conventions
- write text to the LCD
- display numbers on the six-digit seven-segment display
- understand scanning and persistence of vision
- generate simple sound from a one-bit speaker
- drive the 8x8 RGB matrix once the scanning model is clear
- organize a cooperative loop where display, input, sound, and logic all get time

The later chapters use Tetro and Pacmo as case studies. Both are small TEC-1G games designed around severe display limits. They are useful because they force real answers to real hardware questions: how do you keep displays refreshed, show status on other devices, read controls, update state, and still leave time for game logic?

---

## Status

This page is a roadmap stub. The book is safe to publish now because it explains the intended sequence, but the worked examples are still being written.

---

[Book 2](index.md) | [The TEC-1G Reborn →](01-tec1g-reborn.md)
