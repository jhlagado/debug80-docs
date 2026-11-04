---
title: TEC-OS
nav_order: 13
has_children: true
nav_exclude: true
---

# TEC-OS: CP/M in ROM for the TEC-1G

TEC-OS is an operating system for the TEC-1G, held entirely in the board's 16
KiB ROM. It runs CP/M 2.2 programs from volumes on an SD card, and it gives
programs the board's displays, keyboards, LEDs and clock through numbered
services in the ROM. This book answers one question: how do you use a TEC-1G
running TEC-OS, write programs for it and understand how it works inside?

## The reader

This book is for someone who knows the TEC-1G, or a Z80 board like it,
and wants to use the board as a small disk computer. Chapters 1 to 6 begin at
the first prompt, and a reader of them needs no programming. Chapters 7 to 12
are for readers of Z80 assembly, and they explain each part of CP/M where a
program first uses it. Part II is for readers who want the mechanism: how an
operating system with a CP/M interface fits in 16 KiB, and what it keeps
where while it runs. The appendices are the reference.

## Examples and sources

Part I works through transcripts. Each one is a real run of TEC-OS: what you
type at the prompt and what TEC-OS printed in reply, copied unchanged, with the
command that produced it. You can repeat any run on a PC with TEC-OS's script
`tools/capture.mjs`, which runs the same host model from Node.js, or on the
web page that the repository builds, which Appendix I describes. Part II
explains the code itself. Each of its statements about the code gives the
source file and line it rests on, so you can follow the explanation into the
ROM.

Every example was run on the host model, a software TEC-1G on the Debug80
TEC-1G runtime. TEC-OS has not yet run on a physical board, so what the book
says about a board is what the code requires of one.

Each chapter names, at its top, the TEC-OS commit its claims were checked
against. The code is the authority: where a chapter's statement differs from
the source at that commit, the source is right and the statement is a fault to
correct.

## Conventions

Addresses and bytes are hexadecimal with a trailing `h`, as in `0100h`, as the
Z80 assemblers of CP/M's time wrote them. Sizes in bytes are decimal. A KiB is
1,024 bytes and a MiB is 1,024 KiB. Times are in T-states, the Z80's clock
cycles. At the TEC-1G's 4 MHz one T-state is a quarter of a microsecond.

A transcript shows the prompt with what you type after it, then TEC-OS's
reply:

```text
A>CON
CON: TTY:
A>
```

A transcript usually starts at the prompt where its first command is typed,
and leaves out the boot before it. A key held with Ctrl is written with a
caret, so `^C` means Ctrl and C together.

## Contents

### Part I: Using and programming TEC-OS

Part I is an operator's and programmer's manual. Its question: how do I use
TEC-OS and write programs for it?

1. **[Introduction](01-introduction.md).** What is TEC-OS, and what is it
   like to use?
2. **[The console](02-console.md).** Where do I type, where does TEC-OS
   answer, and how do I move between the terminal and the board's screens?
3. **[The command line](03-command-line.md).** What can I type at the prompt,
   and what happens when it works and when it doesn't?
4. **[Cards and volumes](04-cards-and-volumes.md).** How do I make a card of
   my own?
5. **[Drives, the cache and your work](05-drives-and-cache.md).** How does
   TEC-OS use the card, and when is my work safely on it?
6. **[The startup file](06-startup-file.md).** What ran at boot that I didn't
   type, and how do I make my board start the way I want?
7. **[A first program](07-first-program.md).** How do I write a program for
   TEC-OS and run it?
8. **[Memory for programs](08-memory.md).** How much memory does my program
   have, and what must it leave alone?
9. **[Programs and the console](09-programs-and-console.md).** How does my
   program read keys and draw on the screen?
10. **[The hardware services](10-hardware-services.md).** How does my program
    reach the board's own devices without breaking the console?
11. **[Return codes and chaining](11-return-codes-and-chaining.md).** How does
    my program report success, or hand TEC-OS its next command?
12. **[Writing services](12-writing-services.md).** How do I write code that
    stays in memory after its command ends, and how do other programs find
    it?

### Part II: Inside TEC-OS

Part II explains the internals, one mechanism a chapter. Its question: how
does the 16 KiB ROM do what Part I showed, and what does it keep where while
it does it?

13. **[The ROM and its build](13-rom-and-build.md).** Where is everything in
    the 16 KiB, and how is the image made?
14. **[The memory map](14-memory-map.md).** Where does TEC-OS keep its own
    state, and which of it survives a warm boot?
15. **[Reset, cold boot and warm boot](15-reset-and-boot.md).** What happens
    between a reset, or a program's end, and the next prompt?
16. **[The BIOS and the console path](16-bios-and-console.md).** What does a
    character go through between a key and the screen?
17. **[The SD card and the volumes](17-sd-card-and-volumes.md).** How does a
    128-byte record become a block on the card?
18. **[The block cache](18-block-cache.md).** Why is a second read fast, and
    when does the card actually hold what a program wrote?
19. **[The BDOS](19-bdos.md).** What does a BDOS call do to the directory and
    the file, and where does TEC-OS differ from CP/M 2.2?
20. **[The CCP](20-ccp.md).** How does the CCP turn a typed line into a
    running program?
21. **[Chaining inside](21-chaining-inside.md).** How does the rest of a line
    survive the program that ran its first piece?
22. **[Command history](22-command-history.md).** Where do recalled lines
    live, and why does a reset lose them when a program doesn't?
23. **[The hardware services](23-hardware-services-inside.md).** What does
    each numbered service do in the ROM?
24. **[The service loader](24-service-loader.md).** How does a `.SVC` file
    become resident code, and how does it leave?
25. **[Startup](25-startup.md).** How does TEC-OS run the startup file a line
    at a time, and why do some failures say nothing?
26. **[Diagnostics](26-diagnostics.md).** When TEC-OS can't start, what can
    the board tell me, and how do I test the board itself?
27. **[The host model](27-host-model.md).** What machine did every example in
    this book run on, and what does a passing test prove about a board?

### Appendices

The appendices are reference: tables and numbered entries for the reader who
has one question.

- **[A. BDOS functions](appendix-a-bdos-functions.md).** What does function N
  take and return, and does it differ from CP/M 2.2?
- **[B. The ROM table and hardware services](appendix-b-rom-services.md).**
  What goes in the registers for service N, what comes back, and how deep is
  the stack?
- **[C. Memory map](appendix-c-memory-map.md).** What is at address X, where
  is label Y, and does it survive a warm boot?
- **[D. Error messages](appendix-d-error-messages.md).** I saw this message:
  what caused it, and what do I do?
- **[E. The container format](appendix-e-container-format.md).** What is byte
  N of block 0, and which check does the ROM make on it?
- **[F. `tecvol`](appendix-f-tecvol.md).** What is the command, its arguments
  and its options?
- **[G. The TEC-1G as TEC-OS uses it](appendix-g-tec-1g.md).** Which port and
  which bit does TEC-OS use for X, and what does the board need to have?
- **[H. The service file format](appendix-h-service-file-format.md).** What
  is byte N of a `.SVC` header, who writes it, and what does the loader
  check?
- **[I. The web page](appendix-i-web-page.md).** What does each control on
  the page do, where is my card kept, and what does the page change on it?
