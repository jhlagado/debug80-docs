---
layout: default
title: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="glimmer" size="52" />

# Glimmer Book 1 — Reactive Programming for Z80 Games

Glimmer lets you describe a Z80 game through its state, inputs and
reactive rules, with the behaviour written in small blocks of assembly.
The compiler generates the frame loop, input polling, change tracking and
display support around those declarations.

This first book introduces the reactive model one construct at a time.
Its small programs lead into Canvas, which brings structured state,
dependency reports, multiple source files and cards together in one
interactive program. [Glimmer Book 2](../book2/) applies the completed
toolkit to Skyfall, Tetro and Rushlight.

The book teaches Glimmer 0.6. Every complete program in it is built with
`glimmer build`.

## Chapters

- [Introduction](00-introduction.md)

1. [The Shape of a Game](01-the-shape-of-a-game.md)
2. [First Light](02-first-light.md)
3. [State](03-state.md)
4. [Pulses and Bindings](04-pulses-and-bindings.md)
5. [Compute, Effect, Render](05-compute-effect-render.md)
6. [The 8x8 Matrix Profile](06-the-matrix-profile.md)
7. [Time](07-time.md)
8. [Motion Curves](08-motion-curves.md)
9. [Shapes, Sound and Displays on the Board](09-shapes-sound-and-displays.md)
10. [Arrays and Layout Types](10-arrays-and-layout-types.md)
11. [Dependency Reports and Debugging](11-dependency-reports-and-debugging.md)
12. [Routines, Parts and Imports](12-routines-parts-and-imports.md)
13. [Cards](13-cards.md)
- [Exercise Notes](exercise-notes.md)

## Appendices

The [Glimmer reference](../appendices/) covers declarations, both display
profiles, the build and debugging commands, and the generated AZM source.
