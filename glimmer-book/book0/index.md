---
layout: default
title: "Glimmer Book: Reactive Games for the Z80"
nav_order: 7
has_children: true
has_toc: false
---

# Glimmer Book: Reactive Games for the Z80

Glimmer lets you write a Z80 game as a set of declarations: this is the
state, these are the inputs, these rules run when these facts change. The
behaviour itself lives in small blocks of real assembly. From those
declarations it generates the whole running program as readable AZM source:
the main loop, the input polling, the change tracking, and the display glue.

This book is the guided course. You bring some Z80 assembly; everything else
is taught here, one construct at a time, with each chapter ending in a
program you build and run in Debug80. The course closes with complete games
on two displays: the TEC-1G's 8x8 RGB LED matrix and the TMS9918 video
display processor. The final chapter compares how each display shapes the
program you write.

The book teaches Glimmer 0.5.3. Every complete program in it is built with
`glimmer build`.

## Chapters

Drafting is in progress; chapter links appear here as each one lands.

1. [Preface](00-preface.md)
2. [The Shape of a Game](01-the-shape-of-a-game.md)
3. [First Light](02-first-light.md)
4. State
5. Pulses and Bindings
6. Compute, Effect, Render
7. The Matrix Profile
8. Time
9. Motion Curves
10. Shapes, Sound and Displays on the Board
11. Arrays and Layout Types
12. Dependency Reports and Debugging
13. Routines, Parts and Imports
14. Cards
15. A Small Matrix Game
16. Reading Tetro
17. The TMS9918 Profile
18. A VDP Game
19. Two Displays, One Language

## Appendices

- Appendix A - Declaration Reference
- Appendix B - The Matrix Profile
- Appendix C - The TMS9918 Profile
- Appendix D - Build and Debug
- Appendix E - AZM Touchpoints
