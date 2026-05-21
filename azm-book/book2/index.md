---
layout: default
title: "AZM Book 2 — Programming the TEC-1G"
parent: "AZM Books"
nav_order: 3
has_children: true
---
# AZM Book 2 — Programming the TEC-1G

This book is being written now. The chapter pages are publishable stubs: they show the intended path through Debug80, MON-3, and the TEC-1G hardware while leaving room for the worked examples.

Book 1 taught the Z80 without tying you to one machine. Book 2 makes the machine concrete. You will assemble AZM programs, run them under Debug80's TEC-1G target, inspect memory and ports, and then write programs that use the TEC-1G display, keypad, LCD, seven-segment display, and speaker.

The larger examples will draw on the **Tetro** and **Pacmo** codebases as TEC-1G case studies. They are small 8x8 game programs built for the TEC-1G's RGB matrix, LCD, six-digit seven-segment display, keypad, and one-bit sound output. They are not prerequisites for the early chapters; they become useful once you understand the hardware loop.

---

## Learning arc

1. **The TEC-1G target** — what the machine gives you: MON-3, RAM/ROM regions, ports, keypad, displays, sound, and expansion space.
2. **Debug80 workflow** — project files, profiles, targets, bundled monitor ROMs, source mapping, breakpoints, registers, memory, and listings.
3. **First program at `$4000`** — the MON-3 workbench address, loading code, and proving execution with visible state.
4. **Ports and output** — writing to hardware ports deliberately, with the matrix and display hardware kept visible.
5. **Keypad input** — MON-3 key scanning, raw key codes, repeat handling, and input state.
6. **The 8x8 RGB display** — row scanning, colour planes, double buffering, and why a program must keep refreshing hardware.
7. **Seven-segment display and speaker** — multiplexing six digits and sharing the digit latch with one-bit sound.
8. **LCD output** — HD44780 commands, row addresses, strings, scripts, and status screens.
9. **A cooperative runtime** — keeping scanout, input, sound, and game logic moving without interrupts.
10. **Tetro as a case study** — falling blocks on an 8x8 matrix: pieces, collision, display buffers, scoring, and LCD/HUD wrappers.
11. **Pacmo as a case study** — a scrolling maze on an 8x8 viewport: world representation, movement, consumable paths, monsters, scoring, and sound cues.
12. **Capstone project** — a small TEC-1G program that combines input, matrix output, LCD text, seven-segment status, and sound.

---

## Chapter table

| Ch | File | Status | What it covers |
|----|------|--------|----------------|
| — | [Introduction](00-introduction.md) | **Stub** | Why the TEC-1G book sits between fundamentals and algorithms |
| 1 | [The TEC-1G Target](01-tec1g-target.md) | **Stub** | MON-3, memory map, ports, displays, keypad, sound |
| 2 | [Debug80 Workflow](02-debug80-workflow.md) | **Stub** | `debug80.json`, profiles, targets, bundled ROMs, listings |
| 3 | [First Program at `$4000`](03-first-program.md) | **Stub** | User RAM, entry point, visible proof of execution |
| 4 | [Ports and Output](04-ports-and-output.md) | **Stub** | `in`, `out`, port discipline, first hardware writes |
| 5 | [Keypad Input](05-keypad-input.md) | **Stub** | MON-3 API scanning, key constants, edge vs held input |
| 6 | [The 8x8 RGB Display](06-rgb-display.md) | **Stub** | Row scan, colour planes, framebuffers, flicker discipline |
| 7 | [Seven-Segment Display and Sound](07-seven-segment-and-sound.md) | **Stub** | Digit multiplexing, score formatting, speaker bit |
| 8 | [LCD Output](08-lcd-output.md) | **Stub** | HD44780 commands, row strings, screen scripts |
| 9 | [A Cooperative Runtime](09-cooperative-runtime.md) | **Stub** | Scan tick, logic slices, hardware maintenance |
| 10 | [Tetro Case Study](10-tetro-case-study.md) | **Stub** | Falling-block game structure on the TEC-1G |
| 11 | [Pacmo Case Study](11-pacmo-case-study.md) | **Stub** | Scrolling maze structure on the TEC-1G |
| 12 | [Capstone Project](12-capstone-project.md) | **Stub** | A complete small TEC-1G program |

---

## Sources for this book

The first chapters will use the Debug80 TEC-1G platform documentation and MON-3 profile behavior. The later case-study chapters will use the local Tetro repository as source material for real display, keypad, LCD, HUD, sound, and cooperative-loop patterns.

---

[← AZM Books](../index.md) | [Introduction →](00-introduction.md)
