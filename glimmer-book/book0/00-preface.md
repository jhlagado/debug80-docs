---
layout: default
title: "Preface"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 0
---

[Book](index.md) | [The Shape of a Game →](01-the-shape-of-a-game.md)

# Preface

You can write a Z80 game as a set of facts, moments, and rules: declare
what the program remembers, name the events that arrive from the player,
and write what follows from each one as a few lines of assembly. Glimmer
is a language built on that idea, and this book teaches it from the
first lit pixel to complete, playable games.

The book is for you if you can read Z80 assembly: registers, flags,
memory access, a short routine with labels and branches. Everything
else is taught in place - what a game frame is, how game state works,
how a reactive program decides what runs, and every tool you touch. If
the Z80 itself is new to you, [AZM Book 1 - Z80
Fundamentals](../../azm-book/book1/) starts from nothing and leads
here.

Three tools share the work, and the book introduces each one where you
first need it:

- **Glimmer** is the language and its compiler. A `.glim` file holds
  your declarations and your assembly blocks; the compiler turns it
  into one readable assembly-language program.
- **AZM** is the assembler. Glimmer's output is ordinary AZM source,
  and AZM assembles it into the bytes the machine runs - checking
  register use across every routine as it goes. The [AZM
  books](../../azm-book/) hold the assembler's own story.
- **Debug80** is the workshop: a VS Code extension that builds your
  program, runs it on an emulated TEC-1G, and steps through it at
  source level - in your `.glim` file, for the code you wrote. [Debug80
  Book 1](../../debug80-book/book1/) covers the environment in depth.

The machine is the TEC-1G, a Z80 single-board computer, and every
program in the book runs in Debug80's emulation of it. The same HEX
file the build produces runs on a real board, so a physical TEC-1G
turns every exercise into blinking hardware - the emulator route and
the hardware route share every step but the last one.

The course moves in four stages. Chapters 1 through 5 build the mental
model: state, pulses, bindings, and the three phases a frame runs.
Chapters 6 through 11 add the instruments of the TEC-1G's 8x8 LED
matrix: drawing, timers, motion curves, shapes, sound, and structured
data. Chapters 12 through 14 give programs their grown-up shape:
helper routines, multiple files, and cards - the screens and modes of
a real game. The rest of the book spends everything you have learned
on complete games, first on the 8x8 RGB LED matrix, then on the
TMS9918 video display processor, and closes by comparing how those two
very different displays shape the games written for them.

The book teaches Glimmer 0.5.3. Every complete program in it was built
with `glimmer build` and runs.

---

[Book](index.md) | [The Shape of a Game →](01-the-shape-of-a-game.md)
