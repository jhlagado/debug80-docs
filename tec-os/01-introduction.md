---
title: Introduction
parent: TEC-OS
nav_order: 1
nav_group: "Part I: Using and programming TEC-OS"
---

# 1. Introduction

<!-- Checked against TEC-OS 78127ec, with TED.COM from Thorium 128edb7 and
     TAS.COM from Thorium dbee66a. -->

TEC-OS turns the TEC-1G into a small disk computer. In place of MON-3 and the
hex keypad you get a prompt, a keyboard and files on an SD card. You type a
command, and TEC-OS runs it. The programs it runs are written for CP/M 2.2,
the operating system of many 8080 and Z80 machines of the early 1980s, so
editors, assemblers and games from that time run on the TEC-1G unchanged.

## TEC-OS and CP/M

TEC-OS is CP/M 2.2 rebuilt for the TEC-1G. All of it is in the 16 KiB ROM that
MON-3 used to occupy, so there is nothing to load before it starts. Your files
are on an SD card in the board's card adaptor.

Like CP/M, TEC-OS has three parts. The CCP reads the commands you type. The
BDOS gives programs their files, their keyboard and their screen. The BIOS is
the part written for the TEC-1G itself: it drives the SD card, the displays and
the keyboards. A CP/M program calls the BDOS for all of these and never touches
the hardware, so it runs on any machine that has a BDOS.

TEC-OS adds some things CP/M never had. Its SD card holds many disks at once,
and it keeps a cache of recently read blocks in the board's second bank of RAM.
It can show its console on a PICO9918 video card or the graphics LCD as well as
on a serial terminal. Programs can also reach the TEC-1G's own devices, such as
the 7-segment digits, the 20 × 4 LCD and the speaker, through a set of numbered
services in the ROM.

## Turning it on

You switch the TEC-1G on and TEC-OS starts. On a board with a serial terminal
this is what you see:

<!-- node tools/capture.mjs -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>
```

The first line names TEC-OS and its version. The next two list the disks on
the card, which TEC-OS calls volumes. `SYSTEM` is on drive A and `WORK` is on
drive B. The same lines appear on the 20 × 4 LCD.

`A>` is the prompt. The letter is the current drive, the one TEC-OS uses when
you name a file without a drive. You didn't type the `GLCD.SVC` after the first
prompt. It comes from a startup file on the card, which loads the graphics
LCD's console on boards that have one. This board doesn't, so the line does
nothing, and the second prompt is where you start typing. Chapter 6 explains
the startup file.

Where you type depends on the board. With a PICO9918 video card and the matrix
keyboard, TEC-OS shows everything on the video screen and reads the matrix
keyboard, and you need no terminal at all. Otherwise it uses a terminal program
on a PC connected to the board's serial port. Chapter 2 describes each console
and how to switch between them.

## Drives and files

TEC-OS gives you up to four drives, `A` to `D`, and each drive holds one
volume from the card. The starter card has two. Drive A holds TEC-OS's own
files and the programs that come with it. Drive B is empty, ready for yours.

`DIR` lists the files on the current drive:

<!-- node tools/capture.mjs DIR -->
```text
A>DIR
MOUNT.COM    GLCD.SVC     STARTUP.CMD  TED.COM      SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

A file name has up to eight characters, then a full stop and a type of up to
three. The type says what kind of file it is. A `.COM` file is a program, and
its name without the type is the command that runs it. `TED` is a text editor,
`TAS` is an assembler and `MOUNT` manages the volumes on the card. `SAMPLE.ASM`
is the source of a small program.

To change drive, type its letter and a colon:

<!-- node tools/capture.mjs B: DIR A: -->
```text
A>B:
B>DIR
NO FILE
B>A:
A>
```

Chapter 3 covers the commands you type at the prompt, and Chapter 4 the card
and its volumes.

## Running a program

You run a program by typing its name. `SAMPLE.ASM` becomes a program in two
steps: `TAS SAMPLE` assembles it into `SAMPLE.COM`, and `SAMPLE` runs it.

<!-- node tools/capture.mjs --lcd "TAS SAMPLE" SAMPLE -->
```text
A>TAS SAMPLE
SAMPLE.COM written

A>SAMPLE
Hello from TEC-OS.
Screen: 0 by 0
Back to the prompt.

A>
```

`SAMPLE` prints three lines and uses some of the board's own devices. It writes
`Hello from SAMPLE` on the 20 × 4 LCD, shows `123456` on the 7-segment digits
and beeps. It also reads the size of the screen from TEC-OS, which is 0 by 0 on
a serial terminal and 80 by 24 on the PICO9918. When a program ends, TEC-OS
prints the prompt again. Chapter 7 shows how to write a program like this one
on the TEC-1G itself, with `TED` and `TAS`.

A name that is neither a command nor a program comes back with a question mark:

<!-- node tools/capture.mjs NOSUCH -->
```text
A>NOSUCH
NOSUCH?

A>
```

## The memory

TEC-OS needs a TEC-1G with 64 KiB of RAM: the board's own 32 KiB and a second
32 KiB chip in the expansion socket. The address space then divides like this:

| Addresses | What is there |
| --- | --- |
| `0000h–00FFh` | Page zero, the small area CP/M programs expect at the bottom |
| `0100h–B9A3h` | Your program, up to 47,268 bytes on the starter card |
| `B9A4h–BFFFh` | TEC-OS's working memory |
| `C000h–FFFFh` | The ROM, which holds TEC-OS itself |

Every CP/M program loads at `0100h` and can use everything up to TEC-OS's
working memory. A program reads where that memory begins from page zero, so the
same program fits whatever room is left.

The second RAM chip has two 16 KiB halves that share the addresses
`8000h–BFFFh`. Your program uses one of them. TEC-OS keeps its disk cache and
your command history in the other, so they take no room from your program.
Chapter 8 explains a program's memory in detail.

## Keeping your work

Drive B is *written behind*. When a program saves a file there, TEC-OS holds
the change in its cache for a while and writes it to the card later. Writing in
batches is faster than writing every change as it happens, but for a
moment the card can be behind what you have just saved.

`^C`, Ctrl and C together, typed at the prompt brings the card up to date.
TEC-OS writes every change it is holding and gives you a fresh prompt. Type
`^C` before you switch the board off, press reset or take the card out, and
nothing is lost. Chapter 5 explains when TEC-OS writes to the card by itself.

Don't change a card on a PC while the TEC-1G is using it. TEC-OS keeps a map of
each drive's free space in memory, and a change made elsewhere leaves that map
out of step with the card. Take the card out after a `^C`, and press reset
after you put it back.
