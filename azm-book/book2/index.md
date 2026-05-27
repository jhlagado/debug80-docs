---
layout: default
title: "AZM Book 2 — Programming the TEC-1G"
nav_order: 5
has_children: true
---
# AZM Book 2 — Programming the TEC-1G

This book is being written now. The chapter pages are publishable stubs: they show the intended path through the TEC-1G, MON-3, Debug80, and the hardware features that make the machine worth programming.

Book 1 taught the Z80 without tying you to one machine. Book 2 makes the machine concrete. It starts with the TEC-1G as a modern rebirth of a 1980s learning-computer idea, then uses MON-3 services and Debug80 before moving down to direct ports and timing-sensitive display work.

The 8x8 RGB matrix is an add-on rather than the core machine, but this book uses it as the main visual target once the basics are in place. It forces useful lessons: scanning, persistence of vision, bit-plane colour, framebuffers, and cooperative timing. Tetro and Pacmo become larger case studies after those ideas are earned.

---

## Learning arc

1. **The TEC-1G reborn** — the 1980s learning-computer idea, rebuilt around a Z80 with modern tooling and richer peripherals.
2. **Running under MON-3** — the monitor as the first programming environment: API calls, `$4000`, keypad, LCD, seven-segment helpers, sound, serial, and GLCD support.
3. **Debug80 workflow** — project files, profiles, targets, bundled monitor ROMs, source mapping, breakpoints, registers, memory, and listings.
4. **First program at `$4000`** — user RAM, entry point, running from MON-3, and proving execution in Debug80.
5. **Keypad input** — MON-3 key scanning, raw key codes, new press vs held key, and simple input state.
6. **Text on the LCD** — write useful messages through MON-3 first, then understand the HD44780 command/data ports.
7. **Numbers on the six-digit display** — segment glyphs, MON-3 conversion helpers, and the idea of scanned numeric output.
8. **Scanning and persistence of vision** — why multiplexed displays work and why your program must keep refreshing them.
9. **Direct seven-segment scanning** — digit masks, segment bytes, `PortDigits`, `PortSegs`, and timing mistakes.
10. **One-bit sound** — MON-3 sound helpers, then direct speaker-bit toggling as timed output.
11. **The 8x8 RGB add-on** — row scanning, red/green/blue bit planes, row select, and colour.
12. **Framebuffers and colour** — compose pixels in RAM, then scan rows out without corrupting the display.
13. **A cooperative runtime** — keep keypad, LCD, seven-segment scan, sound, matrix scan, and program logic moving without interrupts.
14. **Shared game architecture** — the common Tetro/Pacmo hardware layer: scan tick, framebuffer helpers, LCD, HUD, sound, and include boundaries.
15. **Tetro case study** — falling coloured tiles on an 8x8 matrix, with scoring, LCD state, sound cues, and pause/restart flow.
16. **Pacmo case study** — a scrolling multicolour maze on an 8x8 viewport, with monsters, consumable paths, score, LCD, and sound.
17. **Beyond the core** — GLCD, matrix keyboard, RTC, storage, serial workflows, and expansion topics for later chapters or a future book.

---

## Chapter table

| Ch | File | Status | What it covers |
|----|------|--------|----------------|
| — | [Introduction](00-introduction.md) | **Stub** | Why the TEC-1G book sits between fundamentals and algorithms |
| 1 | [The TEC-1G Reborn](01-tec1g-reborn.md) | **Stub** | History, learning-computer purpose, Z80, MON-3, Debug80 |
| 2 | [Running Under MON-3](02-running-under-mon3.md) | **Stub** | Monitor services, `RST 10H`, API call convention, `$4000` |
| 3 | [Debug80 Workflow](03-debug80-workflow.md) | **Stub** | `debug80.json`, profiles, targets, bundled ROMs, listings |
| 4 | [First Program at `$4000`](04-first-program.md) | **Stub** | User RAM, entry point, visible proof of execution |
| 5 | [Keypad Input](05-keypad-input.md) | **Stub** | MON-3 API scanning, key constants, edge vs held input |
| 6 | [Text on the LCD](06-lcd-output.md) | **Stub** | MON-3 LCD calls, HD44780 commands, strings |
| 7 | [Numbers on the Six-Digit Display](07-seven-segment-numbers.md) | **Stub** | Segment glyphs, conversion helpers, scanned output |
| 8 | [Scanning and Persistence of Vision](08-scanning-persistence.md) | **Stub** | Multiplexing, timing, display refresh as program work |
| 9 | [Direct Seven-Segment Scanning](09-direct-seven-segment.md) | **Stub** | `PortDigits`, `PortSegs`, masks, scan loops |
| 10 | [One-Bit Sound](10-one-bit-sound.md) | **Stub** | MON-3 sound calls, direct speaker-bit toggling |
| 11 | [The 8x8 RGB Add-On](11-rgb-display.md) | **Stub** | Row scan, colour planes, matrix ports |
| 12 | [Framebuffers and Colour](12-framebuffers-and-colour.md) | **Stub** | Back buffers, row layout, drawing cells and rows |
| 13 | [A Cooperative Runtime](13-cooperative-runtime.md) | **Stub** | Scan tick, logic slices, hardware maintenance |
| 14 | [Shared Game Architecture](14-shared-game-architecture.md) | **Stub** | Common Tetro/Pacmo hardware layer and boundaries |
| 15 | [Tetro Case Study](15-tetro-case-study.md) | **Stub** | Falling-block program structure on the TEC-1G |
| 16 | [Pacmo Case Study](16-pacmo-case-study.md) | **Stub** | Scrolling maze program structure on the TEC-1G |
| 17 | [Beyond the Core](17-beyond-core.md) | **Stub** | GLCD, matrix keyboard, RTC, storage, serial, expansion |

---

## Sources for this book

The monitor-first chapters will use MON-3 API documentation and Debug80's TEC-1G platform support. The display and game chapters will use the Tetro repository as source material for real keypad, LCD, seven-segment, sound, framebuffer, and cooperative-loop patterns.

---

[← AZM Books](../index.md) | [Introduction →](00-introduction.md)
