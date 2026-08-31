---
layout: home
title: Home
aside: false
nav_order: 1
---

<div class="library-hall">
  <Mark class="library-hall__mark" book="debug80" size="46" />
  <p class="library-hall__eyebrow">$0000 · cold boot</p>
  <h1 class="library-hall__title">The Debug80 Library</h1>
  <p class="library-hall__tagline">Books on small-computer programming — a debugger, an assembler, languages and the machines they serve.</p>
</div>

<nav class="library-shelf">
  <a class="volume volume--debug80" href="/debug80-book/book1/01-install-debug80">
    <span class="volume__tag">Vol $00 · 1 book</span>
    <span class="volume__head"><Mark book="debug80" size="26" /><span class="volume__title">Debug80</span></span>
    <span class="volume__desc">Source-level Z80 debugging in VS Code — from installation to stepping real hardware projects and sending HEX to the board.</span>
    <span class="volume__enter">run →</span>
  </a>
  <a class="volume volume--azm" href="/azm-book/book1/00-introduction">
    <span class="volume__tag">Vol $01 · 3 books</span>
    <span class="volume__head"><Mark book="azm" size="26" /><span class="volume__title">AZM</span></span>
    <span class="volume__desc">An enhanced Z80 assembler — the reference manual, a from-zero teaching book, and algorithms in assembly.</span>
    <span class="volume__enter">assemble →</span>
  </a>
  <a class="volume volume--atom" href="/atom/">
    <span class="volume__tag">Vol $02 · assembler · 2 books</span>
    <span class="volume__head"><Mark book="atom" size="26" /><span class="volume__title">Atom</span></span>
    <span class="volume__desc">A single-pass Z80 assembler written in Z80 — use it from a desktop command or directly under CP/M.</span>
    <span class="volume__enter">stream →</span>
  </a>
  <a class="volume volume--glimmer" href="/glimmer-book/book1/00-introduction">
    <span class="volume__tag">Vol $03 · 2 books</span>
    <span class="volume__head"><Mark book="glimmer" size="26" /><span class="volume__title">Glimmer</span></span>
    <span class="volume__desc">A reactive game language that compiles to readable Z80 — first the language and its model, then complete games on two displays.</span>
    <span class="volume__enter">react →</span>
  </a>
  <a class="volume volume--nucleus" href="/nucleus/">
    <span class="volume__tag">Vol $04 · 2 specifications</span>
    <span class="volume__head"><Mark book="nucleus" size="26" /><span class="volume__title">Nucleus</span></span>
    <span class="volume__desc">A compact typed language, handwritten compiler, and direct runtime contract for the Z80.</span>
    <span class="volume__enter">inspect →</span>
  </a>
</nav>

## Debug80

### [Debug80 Book 1 — Getting Started](debug80-book/book1/)

A guided Debug80 book that starts from installation and walks through creating a TEC-1G project, building and stepping code, inspecting the machine, using the panel, reading artifacts, and sending HEX to hardware.

For readers who want a book-shaped route through the Debug80 workflow.

---

## About Debug80

Debug80 is a VS Code debugger extension for Z80 assembly programs targeting the TEC-1, TEC-1G, and compatible hardware. It turns an assembly project into a source-level debugging session: build the active target, run it in an emulated machine, set breakpoints, step through instructions, inspect registers and memory, and watch platform hardware update as the program runs.

For TEC-1G work, Debug80 includes a MON-3-oriented project path and an emulator panel for the machine's displays, keypad, serial behaviour and memory state. The same build artifacts can be used with real hardware: assemble in VS Code, debug the program, then send the generated HEX file to a board when you are ready to test outside the emulator.

Source: [github.com/jhlagado/debug80](https://github.com/jhlagado/debug80)

---

## AZM

### [AZM Book 1 — Assembler Manual](azm-book/book1/)

The definitive reference for AZM, an enhanced Z80 assembler with modern programming features. Covers AZM source format, syntax, directives, layout types, ops, diagnostics, and output formats.

For programmers who want the exact assembler rules and the supported programming features in one place.

### [AZM Book 2 — Z80 Fundamentals](azm-book/book2/)

A teaching book that starts from no prior knowledge and covers the Z80 from bare machine code through assembly language, ops, layout types, and register contracts.

For readers learning Z80 assembly programming with AZM.

### [AZM Book 3 — Algorithms and Data Structures](azm-book/book3/)

A follow-on AZM book about sorting, searching, recursion, composition, pointer structures, and larger assembly program design.

For readers who know the Z80 basics and want to build more substantial AZM programs.

---

## About AZM

AZM is an enhanced Z80 assembler with modern programming features. It keeps the generated machine code explicit, while adding assembler-time structure for larger programs: layout types, register contracts, op declarations, directive aliases, diagnostics, listings, Intel HEX output and Debug80 source maps.

You can use AZM directly from the terminal with `@jhlagado/azm`, or through Debug80 when you build and debug `.asm` files in VS Code. The assembler output is meant to serve both paths: readable listings for the programmer, binary and HEX artifacts for machines, and `.d8.json` metadata for source-level debugging.

---

## Atom

### [Atom assembler](atom/)

Install the `atom` command, assemble a first `.asm` file and find the package,
source and manuals from one place.

### [Atom Book 1 — Assembler Reference](atom-book/book1/)

The definitive reference for Atom source, expressions, instructions,
directives, host preprocessing, binary inclusion, diagnostics and output
artifacts.

For Z80 programmers and tool authors who need the exact current Atom rules.

### [Atom Book 2 — Z80 Programming](atom-book/book2/)

A from-zero route through the Z80, followed by arithmetic, sorting, strings,
packed flags and recursion in verified Atom programs.

For readers learning assembly or moving from instruction exercises into
complete routines.

### [Atom and Z80 Reference](atom-book/appendices/)

The programming API and compact references for Atom syntax, limits, Z80
registers, addressing forms and instructions.

---

## About Atom

Atom is a single-pass Z80 assembler whose native core is written in Z80
assembly. The desktop command runs that core in a Z80 emulator while a Node
host resolves source dependencies, conditional assembly, binary inputs,
listings, D8 maps, Intel HEX and atomic output publication. Native `ATOM.COM`
runs the same core under CP/M 2.2 with CP/M file services and a compact
positional command.

Atom source uses bare directives such as `ORG`, `DB`, and `DW`; a leading period
marks a private symbol. Source and symbols are case-insensitive. The
conventional source extension is `.asm`; build configuration selects the
assembler flavour.

Source: [github.com/jhlagado/debug80/tree/main/packages/atom](https://github.com/jhlagado/debug80/tree/main/packages/atom)

---

## Glimmer

### [Glimmer Book 1 — Reactive Programming for Z80 Games](glimmer-book/book1/)

The guided introduction to Glimmer. Focused programs develop the reactive model, frame phases, timing, drawing, structured state, source organisation and cards before those ideas meet in Canvas.

For readers who can read Z80 assembly and want to understand the Glimmer language.

### [Glimmer Book 2 — Building Complete Z80 Games](glimmer-book/book2/)

The application book. It builds Skyfall, studies the larger Tetro codebase, introduces the TMS9918 display profile and then builds Rushlight.

For readers ready to apply Glimmer to complete games.

---

## About Glimmer

Glimmer is a reactive game language that compiles to readable Z80 assembly, built as a thin layer in front of the assembler. You declare a program's state, inputs, and rules; you write the behaviour in small blocks of real Z80 assembly; and Glimmer generates the running program around them as one readable AZM source file: the main loop, the input polling, the change tracking and the display glue.

Glimmer programs build with `@jhlagado/glimmer` and run under Debug80's TEC-1G emulation, with breakpoints and stepping landing in `.glim` source.

---

## Nucleus

### [Nucleus 0.1 Language Specification](nucleus/language/)

The complete source-language contract, presented as 21 linked chapters while
preserving the single repository source as the authority. It defines syntax,
types, storage, control flow, routines, failure, grammar, semantics, and
conformance.

For compiler implementers and programmers who need the exact Nucleus rules.

### [Nucleus Z80 Runtime and Backend Contract 0.1](nucleus/runtime/)

The direct execution contract, presented as 10 linked chapters. It defines
packed representation, storage, checked access, calls, activation state,
failure, traps, services, generated-code integrity, and conformance evidence.

For compiler, runtime, and target-adapter implementers.

---

## About Nucleus

Nucleus is a small, safe, statically typed language compiled directly to Z80
machine code. Its first compiler is a handwritten Z80 program whose executable
core and required immutable data must fit in one 16 KiB bank.
The design uses fixed layouts, bounded resources, streaming compilation,
predictive parsing, and explicit failure so that implementation cost remains
visible and measurable.

---

## About TEC-1G

The TEC-1G is a modern Z80 single-board learning computer designed by Mark Jelic. It is a direct descendant of the original Talking Electronics TEC-1, a 1980s Australian kit computer created to teach how microprocessors work from the machine-code level upward.

The TEC-1G keeps that educational purpose and TEC-1 compatibility, while expanding the machine with a 4 MHz Z80A, more RAM and ROM, a 20x4 LCD, keypad and keyboard options, serial transfer, expansion connectors, and modern add-on hardware. Debug80 includes TEC-1G emulation so you can assemble and debug programs in VS Code, then send the same HEX output to real hardware.

To learn about the hardware, see Mark Jelic's [TEC-1G project page on Hackaday](https://hackaday.io/project/193968-tec-1g-40-year-anniversary-z80-sbc) and the [TEC-1G source and assembly documentation on GitHub](https://github.com/MarkJelic/TEC-1G). Kits and add-ons are available from [TEC-1 Inc. on Tindie](https://www.tindie.com/products/tec1/tec-1g-z80-single-board-computer-kit/) when stock is available.
