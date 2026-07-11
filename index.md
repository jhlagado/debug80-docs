---
layout: home
title: Home
nav_order: 1
---

# Debug80 Documentation

Technical documentation for the **Debug80** Z80 debugger extension and the **AZM** assembler for Visual Studio Code.

## Debug80

### [Debug80 Book 1 — Getting Started](debug80-book/book1/)

A guided Debug80 book that starts from installation and walks through creating a TEC-1G project, building and stepping code, inspecting the machine, using the panel, reading artifacts, and sending HEX to hardware.

For readers who want a book-shaped route through the Debug80 workflow.

### [Debug80 Book 2 — Programming the TEC-1G](debug80-book/book2/)

In development. A Debug80-oriented outline for programming the TEC-1G with MON-3, Debug80 projects and targets, display hardware, sound, and larger interactive examples.

---

## About Debug80

Debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It turns an assembly project into a source-level debugging session: build the active target, run it in an emulated machine, set breakpoints, step through instructions, inspect registers and memory, and watch platform hardware update as the program runs.

For TEC-1G work, Debug80 includes a MON-3-oriented project path and an emulator panel for the machine's displays, keypad, serial behaviour and memory state. The same build artifacts can be used with real hardware: assemble in VS Code, debug the program, then send the generated HEX file to a board when you are ready to test outside the emulator.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80)

---

## AZM

### [AZM Book 0 — Assembler Manual](azm-book/book0/)

The definitive reference for AZM, an enhanced Z80 assembler with modern programming features. Covers AZM source format, syntax, directives, layout types, ops, diagnostics, and output formats.

For programmers who want the exact assembler rules and the supported programming features in one place.

### [AZM Book 1 — Z80 Fundamentals](azm-book/book1/)

A teaching book that starts from no prior knowledge and covers the Z80 from bare machine code through assembly language, ops, layout types, and register contracts.

For readers learning Z80 assembly programming with AZM.

### [AZM Book 2 — Algorithms and Data Structures](azm-book/book2/)

A follow-on AZM book about sorting, searching, recursion, composition, pointer structures, and larger assembly program design.

For readers who know the Z80 basics and want to build more substantial AZM programs.

---

## About AZM

AZM is an enhanced Z80 assembler with modern programming features. It keeps the generated machine code explicit, while adding assembler-time structure for larger programs: layout types, register contracts, op declarations, directive aliases, diagnostics, listings, Intel HEX output and Debug80 source maps.

You can use AZM directly from the terminal with `@jhlagado/azm`, or through Debug80 when you build and debug `.asm` files in VS Code. The assembler output is meant to serve both paths: readable listings for the programmer, binary and HEX artifacts for machines, and `.d8.json` metadata for source-level debugging.

---

## Glimmer

### [Glimmer Book — Reactive Games for the Z80](glimmer-book/book0/)

The guided Glimmer course, in progress and published as chapters land. Starting from Z80 assembly alone, it builds up the whole Glimmer language one construct at a time and finishes with complete games on two displays: the TEC-1G's 8x8 RGB LED matrix and the TMS9918 video display processor.

For readers who can read Z80 assembly and want to write games with it.

---

## About Glimmer

Glimmer is a reactive framework for Z80 games, built as a thin layer in front of the AZM assembler. You declare a program's state, inputs, and rules; you write the behaviour in small blocks of real Z80 assembly; and Glimmer generates the running program around them as one readable AZM source file — the main loop, the input polling, the change tracking, and the display glue.

Glimmer programs build with `@jhlagado/glimmer` and run under Debug80's TEC-1G emulation, with breakpoints and stepping landing in `.glim` source.

---

## About TEC-1G

The TEC-1G is a modern Z80 single-board learning computer designed by Mark Jelic. It is a direct descendant of the original Talking Electronics TEC-1, a 1980s Australian kit computer created to teach how microprocessors work from the machine-code level upward.

The TEC-1G keeps that educational purpose and TEC-1 compatibility, while expanding the machine with a 4 MHz Z80A, more RAM and ROM, a 20x4 LCD, keypad and keyboard options, serial transfer, expansion connectors, and modern add-on hardware. Debug80 includes TEC-1G emulation so you can assemble and debug programs in VS Code, then send the same HEX output to real hardware.

To learn about the hardware, see Mark Jelic's [TEC-1G project page on Hackaday](https://hackaday.io/project/193968-tec-1g-40-year-anniversary-z80-sbc) and the [TEC-1G source and assembly documentation on GitHub](https://github.com/MarkJelic/TEC-1G). Kits and add-ons are available from [TEC-1 Inc. on Tindie](https://www.tindie.com/products/tec1/tec-1g-z80-single-board-computer-kit/) when stock is available.
