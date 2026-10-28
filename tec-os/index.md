---
title: TEC-OS
nav_order: 13
has_children: true
nav_exclude: true
---

# TEC-OS: CP/M in ROM for the TEC-1G

Chapters are added as they are written. The ones listed under Chapters are
complete, and the plan for the rest follows them.

TEC-OS is an operating system for the TEC-1G held entirely in its 16 KiB
ROM. It runs CP/M 2.2 programs from volumes on an SD card and gives them the
board's displays, keyboard, LEDs and clock through a table of services. This
book explains how to use it, how to write programs for it and how it works
inside.

Everything in the book has been checked on the Debug80 TEC-1G model, which
also runs TEC-OS in a web page. TEC-OS has not yet run on a physical board.

## Chapters

- [Introduction](00-introduction.md): what TEC-OS is, what it needs and
  who the book is for.
- [First boot](01-first-boot.md): starting TEC-OS, the starter card and the
  first commands.
- [The console](02-the-console.md): the four console devices, choosing and
  changing the console, the video terminal and the matrix keyboard.

## Planned chapters

**Part I: Using TEC-OS**

3. **The command line.** The built-in commands, drives and user areas,
   command history, and running one command processor inside another.
4. **Cards and volumes.** The container on the card, `tecvol` on a PC, the
   starter card and mounting volumes at run time.

**Part II: Programming TEC-OS**

5. **Memory.** MAIN and EXPAND, the 46K program area, page zero and
   reaching EXPAND 1 by copying.
6. **A first program.** Assembling a COM file, calling the BDOS and running
   it in Debug80.
7. **The hardware services.** The table at `FF00h`: the LCD, the
   7-segment digits, the 8 × 8 LEDs, the PICO9918, the clock and sound.
8. **Relocatable programs, residents and drivers.** PRL files and the three
   things TEC-OS can do with them.

**Part III: How TEC-OS works**

9. **Boot.** From reset through the boot overlay to the first prompt.
10. **The disk.** The SD driver, deblocking, the write policy and what a
    power cut can leave behind.
11. **Warm boot.** What a program's exit costs and how TEC-OS keeps the
    drives logged in.
12. **Compatibility.** What a CP/M 2.2 program can rely on and where TEC-OS
    differs.
13. **Diagnostics.** The diagnostics ROM and what it tells you about a
    board.

**Appendices.** The memory map, the BDOS functions, the hardware services
and the error messages.
