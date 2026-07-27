---
layout: default
title: "Preface"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 0
---

# Preface

This book teaches you to write Z80 games with Glimmer. Glimmer applies
reactive programming to a forty-year-old processor: you describe the
game while the compiler generates the frame loop, key scanning, timing
and change tracking that every game needs.

A Glimmer program describes four things: facts, moments, rules and pictures.
Facts hold game state, such as the player's position and current score.
Moments mark events, such as a key going down or a timer running out.
Rules connect those events to state changes: when this moment arrives,
change that fact. Pictures draw what the player sees from the facts. You
write the rules and pictures in real Z80 assembly, a few lines each,
and Glimmer builds the rest of the running program around them.

The intended reader can already read Z80 assembly: registers, flags,
memory access, a short routine with labels and branches. The book
introduces games, reactive programming and
each tool in the workflow as you meet
them. Readers new to the Z80 can begin with [AZM Book 2 - Z80
Fundamentals](../../azm-book/book2/), which starts at the bare machine
and leads here.

The workflow uses three tools, each introduced at the
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
  contains a full emulation of the target computer and gives you
  breakpoints and single-stepping in your own `.glim` source.
  [Debug80 Book 1](../../debug80-book/book1/) covers it in depth.

The target computer is the TEC-1G, a Z80 single-board machine with a
hex keypad, an 8x8 RGB LED matrix and other displays you will meet
along the way. Every program runs in Debug80's emulation, so the
lessons work without physical hardware. On a TEC-1G, the build
produces a HEX file you can send to the board, and the same program
runs on the physical machine.

The book first builds the reactive model from state, pulses, bindings
and compute/effect/render blocks. It then adds matrix drawing, time,
motion, resources, structured data and debugging before organising
those parts into complete games. The final chapters move from the 8x8
matrix to the TMS9918 video display processor and compare the demands
each display places on a game.
