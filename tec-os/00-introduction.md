---
title: Introduction
parent: TEC-OS
nav_order: 0
---

# Introduction

The TEC-1G starts in MON-3, a monitor that reads the hex keypad and shows
addresses on six 7-segment digits. It is a good way to learn the Z80 one
instruction at a time. TEC-OS turns the same board into a small disk-based
computer. You type commands at a prompt, keep files on an SD card and run
programs written for CP/M 2.2. CP/M was the operating system of most Z80
business machines of the late 1970s and early 1980s.

TEC-OS lives in a 16 KiB ROM at `C000h–FFFFh`. That one chip holds the
whole system: the command processor, the disk operating system, a set of
services for the board's hardware and the drivers for the SD card and the
displays. Apart from one display driver, programs load from the card only
when you run them.

## The CP/M interface

A CP/M program reaches everything outside its own memory through the
operating system. It reads a key, prints a character, opens a file or reads a
128-byte record by putting a function number in register `C` and calling
address `0005h`. Thousands of programs were written to that one interface:
editors, assemblers, compilers, games and BASIC interpreters. TEC-OS
provides the interface as CP/M 2.2 defined it, so many of those programs
run unchanged.

CP/M programs also expect a particular memory layout. They load at `0100h`
and may use memory up to the operating system, whose address they read from
`0006h`. On the starter card a TEC-OS program has 46,854 bytes, from
`0100h` to `B805h`.

## Additions to CP/M

TEC-OS is more than a port of CP/M. It adds:

- a console on whichever display the board has: an 80-column screen on the
  PICO9918, the 128 × 64 graphics LCD or a serial terminal on a PC
- up to 127 volumes on an SD card, mounted on drives while TEC-OS runs
- a table of hardware services, so programs can use the LCD, the 7-segment
  digits, the 8 × 8 LEDs, the PICO9918's graphics, the clock and the speaker
  without knowing their ports
- command history at the prompt and command processors nested one inside
  another
- relocatable programs that stay resident below the system or load as
  drivers into memory that programs never see

## Requirements

TEC-OS needs a TEC-1G with 64 KiB of RAM. The board's fixed RAM gives
32 KiB at `0000h–7FFFh`. The other 32 KiB is a RAM chip in socket U9, whose
two 16 KiB halves, EXPAND 0 and EXPAND 1, share the addresses
`8000h–BFFFh`. TEC-OS checks for both halves at start-up and stops with a
message if either is missing.

You also need an SD card and something to talk to TEC-OS through. That can
be a PICO9918 video card or the graphics LCD, each with the matrix keyboard.
It can also be a PC running a terminal program on the board's FTDI serial
port.

You don't need a board to follow this book. The Debug80 TEC-1G model runs
TEC-OS in VS Code, and the same model runs it in a web browser. Every
example in the book was run on that model, and the output shown is the
output it produced.

## The reader

This book is for someone who knows the TEC-1G or a similar Z80 board and
wants to use it as a computer rather than a trainer. Part I needs no
programming. Part II assumes you can read Z80 assembly and explains
everything else, CP/M included. Part III is for readers who want to know how
an operating system fits in 16 KiB and why it is built the way it is.

## Conventions

Addresses and bytes are hexadecimal with a trailing `h`, as in `0100h`,
following the Z80 assemblers of CP/M's time. Sizes in bytes are decimal.
Times are given in T-states, the Z80's clock cycles. At the TEC-1G's 4 MHz
one T-state is a quarter of a microsecond, so 4,000,000 T-states is one
second.

What you type is shown after the prompt in examples:

```text
A>DIR
```

TEC-OS's replies follow on the next lines. Keys held with Ctrl are written
with a caret, so `^C` means Ctrl and C together.
