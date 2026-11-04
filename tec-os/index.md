---
title: TEC-OS
nav_order: 13
has_children: true
nav_exclude: true
---

# TEC-OS: CP/M in ROM for the TEC-1G

TEC-OS is an operating system for the TEC-1G, held entirely in the board's 16
KiB ROM. It runs CP/M 2.2 programs from volumes on an SD card, and it gives
programs the board's displays, keyboards, LEDs and clock through the hardware
services. Part I of this book explains how to use TEC-OS and write programs for
it. Part II explains how it works inside, and the appendices are the reference.

## The reader

The book is written for someone who knows the TEC-1G, or a Z80 board like it,
and wants to use the board as a small disk computer rather than a trainer.
Chapters 1 to 5 begin at the first prompt, and a reader of them needs no
programming. Chapters 6 to 11 are for readers of Z80 assembly, and they
explain each part of CP/M where a program first uses it. Part II is for
readers who want the mechanism: how an operating system with a CP/M interface
fits in 16 KiB, and the reasons for its layout.

## Examples and sources

Part I works through transcripts. Each one is a real run of TEC-OS: what you
type at the prompt and what TEC-OS printed in reply, copied unchanged, with the
command that produced it. You can repeat any run on a PC with TEC-OS's script
`tools/capture.mjs`, which runs the same host model from Node.js. In the web
page that the repository builds you can repeat a run on a board with a display.
Part II explains the code itself. Each of its statements about the code gives
the source file and line it rests on, so you can follow the explanation into
the ROM.

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
CON: TTY: serial terminal
A>
```

A transcript usually starts at the prompt where its first command is typed,
and leaves out the boot before it. A key held with Ctrl is written with a
caret, so `^C` means Ctrl and C together.

## Contents

### Part I: Using and programming TEC-OS

1. **[Introduction and first boot](01-introduction.md).** What TEC-OS is and
   what it needs, then building it and running it in the web page, from
   Node.js and on a board. The chapter follows the first boot line by line. It
   then covers the starter card, running a program, reset and power, and the
   diagnostic prompt for a card that won't mount.
2. **[The console](02-console.md).** The four console devices, `TTY:`, `CRT:`,
   `BAT:` and `UC1:`, and the `CON` command that moves the console between
   them. The chapter then describes the serial terminal, a display driver
   taking the console, the matrix keyboard, the keys that edit a line and
   `[more]` in long listings.
3. **[The command line](03-command-line.md).** File names, wildcards and each
   command built into the CCP. The chapter also covers running a `.COM` file,
   from the current drive or from drive A, user areas, the messages a failed
   command prints and command history with `^W` and `^N`.
4. **[Cards and volumes](04-cards-and-volumes.md).** The container and its
   volumes, the two geometries, and building and changing a card image on a PC
   with `tecvol`. The chapter then covers `MOUNT`, what each drive costs in
   memory, the block cache and what a reset keeps. It ends with
   putting an image on a card and recovering after a power cut.
5. **[Startup and services](05-startup-and-services.md).** The services TEC-OS
   loads, and the startup file that installs them. The chapter covers the
   file's rules, the display lines and the PICO9918's three widths, and the
   keypad skip. It also covers the words `PICO?`, `GLCD?` and `CARD?` on the
   LCD, and the commands that install, list and remove a service.
6. **[A first program](06-first-program.md).** Two programs that call the
   BDOS: one prints a line, and the other prints the file named on its command
   line. You assemble the first on a PC, copy it to a card and run it, then
   assemble it again on the TEC-1G with `TAS` and edit, build and run it there
   with `TED`. The chapter ends with the ways a program returns to TEC-OS.
7. **[Memory for programs](07-memory.md).** The Z80's 64 KiB on a TEC-1G, the
   TPA and the word at `0006h` that marks its end, page zero and
   TEC-OS's own bytes at `0040h`. The chapter ends with EXPAND 1, which TEC-OS
   keeps for itself.
8. **[Programs and the console](08-programs-and-console.md).** The console as
   a program uses it: the BDOS's console functions, the BIOS's console calls,
   the control characters and ANSI escape sequences the video terminal acts
   on, and the cursor. The chapter ends with the console's size, which a
   program reads from the hardware service `INFO`, and the IOBYTE's other
   devices, the list device, the punch and the reader.
9. **[The hardware services](09-hardware-services.md).** The calls TEC-OS has
   for the board's own devices. The chapter starts with the ROM table and the
   check for TEC-OS. It then covers the nine hardware services, numbered 0 to
   8, most with a program of their own, and `DEMO`, which uses them together.
10. **[Writing services](10-writing-services.md).** A `.SVC` file
    holds a service, code that stays in memory after its command ends. You
    write a service that counts the console's characters, install it and
    measure what it costs. You then publish the count for a program to find.
11. **[Chaining commands](11-chaining-commands.md).** Several commands on one
    line with `!`, and a command that runs only after a success with `:`. The
    chapter describes the return code of BDOS function 108 and a program that
    ends by starting another with BDOS function 47. It ends with the events
    that drop the rest of a line.

### Part II: Inside TEC-OS

12. **[The ROM and its build](12-rom-and-build.md).** The 16 KiB image from
    the jump at `C000h` to the free space at its end. The chapter then follows
    the build: the source files and their order, the generated include files,
    ATOM and `tools/build.mjs`, the checks on the result and the one image,
    `dist/tecos.rom`.
13. **[The memory map](13-memory-map.md).** Memory from TEC-OS's side: the
    system latch, page zero, the resident workspace and the allocation vectors
    below it. The chapter ends with the four stacks and their limits and
    TEC-OS's use of EXPAND 1.
14. **[Reset, cold boot and warm boot](14-reset-and-boot.md).** Cold boot from
    its first instruction at `0000h` to the point where it falls into warm
    boot, then warm boot as far as the CCP, with its cost in T-states. On the
    way the chapter describes the boot overlay, the RAM check, the reset test
    and the rebuilding of page zero.
15. **[The BIOS and the console path](15-bios-and-console.md).** The RAM BIOS
    table at `BF00h`, the console by IOBYTE, and the list, punch and reader
    entries. The chapter also covers the bit-banged serial port, the matrix
    keyboard scan, the terminal's escape parser, the display drivers with
    their service, number 12, and the 20 × 4 LCD.
16. **[The BDOS](16-bdos.md).** The entry, the function table and the console
    functions, then files, extents and records, and the allocation vectors
    with the scan at warm boot. The chapter ends with BDOS errors, functions
    108, 47, 45 and 48 and the differences from Digital Research's BDOS.
17. **[The CCP](17-ccp.md).** The entry from boot, the prompt, and the parsing
    of the command word and file names. The chapter then covers the built-in
    commands, `LOADCOM`, `PREPPAGE` and the jump to `0100h`, and the CCP's RAM
    and stack.
18. **[The SD card and the volumes](18-sd-card-and-volumes.md).** The layers
    between the BDOS's 128-byte records and the card's 512-byte blocks. The
    chapter covers the SD card driver and its error codes, the container's checks,
    the drive table, deblocking and the volume services, numbers 9 to 11.
    Chapter 13 describes the allocation vectors at cold boot.
19. **[The block cache](19-block-cache.md).** Thirty lines in EXPAND 1, reads
    through the cache, and writes through and behind. The chapter also covers
    the order of a flush, the flush at warm boot, `Write lost` and the
    interrupts held off across a block.
20. **[The hardware services and the service
    loader](20-hardware-services-and-service-loader.md).** The code behind
    Chapters 9 and 10: the dispatcher at `ABICALL` and each of the nine
    hardware services. The chapter then covers a service's entry, the
    relocation of its addresses and the seven steps of its load, and it ends
    with the registry, removal and the stack figures.
21. **[Startup](21-startup.md).** `STBOOT`, `STLINE` and `STDONE`, with the
    one byte of state and the 128-byte record behind them. The chapter then
    follows a display line and covers the flag bit behind the LCD's words and
    the web page's rewrite of the file.
22. **[Command history](22-command-history.md).** The 256-byte ring at `BD00h`
    in EXPAND 1, storing a line, `^W` and `^N` inside BDOS function 10, and
    the effect of a warm boot and of a reset.
23. **[Diagnostics](23-diagnostics.md).** The diagnostic prompt in the ROM and
    the separate diagnostics ROM, with its tests and its report. The chapter
    ends with running that ROM on a board and comparing the board's report
    with the model's.
24. **[Chaining inside](24-chaining-inside.md).** The code behind Chapter 11.
    The chapter follows a line through the CCP's main loop, from the line and
    `CHPOS` kept across a warm boot to taking a piece at `!`. It then covers
    the return code and `:`, the paths that drop the rest of a line and
    function 47's checks and copy.
25. **[The host model and the web page](25-host-model.md).**
    `host/machine.mjs` on the Debug80 TEC-1G runtime, with the SD card and
    clock attached to it and its checks on every write. The chapter then
    describes the tests and the web page: its build, its card in IndexedDB and
    its keyboards.

### Appendices

- **[A. BDOS functions](appendix-a-bdos-functions.md).** Each function from 0
  to 40, with 45, 47, 48 and 108: its registers, its result and any difference from
  CP/M 2.2.
- **[B. The ROM table and hardware services](appendix-b-rom-services.md).**
  The ROM table at `C003h`, then the numbered services behind its jump, 0 to
  14, with their registers and status codes.
- **[C. Memory map](appendix-c-memory-map.md).** The CPU's address space, the
  ROM, page zero, the resident workspace, EXPAND 1 and the stacks, with the
  figures taken from the build.
- **[D. Error messages](appendix-d-error-messages.md).** Every message TEC-OS
  prints, with its cause and its remedy: cold boot, the diagnostic prompt's
  codes, the LCD's words, the CCP, the BDOS, `Write lost` and `MOUNT`.
- **[E. The container format](appendix-e-container-format.md).** The header's
  fields, the volume descriptors, the table beyond block 0, the checks with
  their codes and the G1M and G8M geometries.
- **[F. `tecvol`](appendix-f-tecvol.md).** Each of its nine commands,
  `create`, `info`, `verify`, `dir`, `put`, `get`, `era`, `recipe` and
  `install`, with its options and an example.
- **[G. The TEC-1G as TEC-OS uses it](appendix-g-tec-1g.md).** The ports
  TEC-OS reads and writes, the system latch's bits, the configuration switches
  and U9. The appendix also covers the hex keypad and its NMI, the 8 × 8 LEDs,
  the DS1302 clock and the SD card adaptor.
- **[H. The service file format](appendix-h-service-file-format.md).** The
  `.SVC` file's header with the loader's check of each field, its dependencies
  and its relocation data, with the starter card's `PICO.SVC` as an example.
