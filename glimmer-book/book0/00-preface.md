---
layout: default
title: "Preface"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 0
---

[Book](index.md) | [The Shape of a Game →](01-the-shape-of-a-game.md)

# Preface

This book teaches you to write Z80 games with Glimmer. Glimmer applies
reactive programming to a forty-year-old processor: you describe the
game while the compiler generates the frame loop, key scanning, timing
and change tracking that every game needs.

A Glimmer program describes four things: facts, moments, rules and pictures.
The facts are what the game remembers, such as where the player is and
what the score says. The moments are the things that happen, such as a
key going down or a timer running out. The rules are the game's
decisions: when this moment arrives, change that fact. And the pictures
are what the player sees, drawn from the facts. You write the rules and
the pictures yourself, in real Z80 assembly, a few lines each. Glimmer
builds the rest of the running program around them.

You will get the most from the book if you can already read Z80
assembly: registers, flags, memory access, a short routine with
labels and branches. Games, reactive
programming, and every tool in the workflow are taught as you meet
them. If the Z80 itself is new to you, start with [AZM Book 2 - Z80
Fundamentals](../../azm-book/book2/), which begins from nothing and
leads here.

Three tools do the work, and the book introduces each one at the
point you first need it:

- **Glimmer** is the language and its compiler. You write a `.glim`
  file holding your declarations and your assembly. The compiler
  turns that file into a complete assembly-language program you can
  read.
- **AZM** is the assembler. It turns the generated program into bytes
  the Z80 can run, and it checks register use across every routine
  while it does. AZM is also the name of the assembly dialect
  involved; after this page the book calls it plain assembly. The
  [AZM books](../../azm-book/) describe the assembler itself.
- **Debug80** is a VS Code extension that runs the result. It
  contains a full emulation of the target computer, and it gives you
  breakpoints and single-stepping in your own `.glim` source.
  [Debug80 Book 1](../../debug80-book/book1/) covers it in depth.

The target computer is the TEC-1G, a Z80 single-board machine with a
hex keypad, an 8x8 RGB LED matrix and other displays you will meet
along the way. You need no hardware to follow the book: every program
runs in Debug80's emulation. If you do own a TEC-1G, the build
produces a HEX file you can send to the board, and the same program
runs on the real thing.

The book first builds the reactive model from state, pulses, bindings
and compute/effect/render blocks. It then adds matrix drawing, time,
motion, resources, structured data and debugging before organising
those parts into complete games. The final chapters move from the 8x8
matrix to the TMS9918 video display processor and compare what each
display asks of a game.

---

[Book](index.md) | [The Shape of a Game →](01-the-shape-of-a-game.md)
