---
title: Memory
parent: TEC-OS
nav_order: 5
---

# Memory

Part II is for writing programs. It assumes you can read Z80 assembly and
explains the rest, CP/M included. This chapter shows where a program sits in the Z80's 64 KiB and what
TEC-OS keeps around it. It ends with the 16 KiB of RAM that programs reach
only by copying.

## The address space

The Z80 addresses 64 KiB. On a TEC-1G running TEC-OS it is divided into
three regions:

| Addresses | Contents |
| --- | --- |
| `0000h–7FFFh` | MAIN: the board's fixed 32 KiB of RAM |
| `8000h–BFFFh` | EXPAND 0 or EXPAND 1: one half of the 32 KiB RAM chip in U9 |
| `C000h–FFFFh` | The TEC-OS ROM |

The RAM chip in U9 holds 32 KiB, but only 16 KiB of it fits at
`8000h–BFFFh`. Bit 2 of the board's system latch, a write-only register at
port `FFh`, chooses which half appears there. The halves are called EXPAND 0
and EXPAND 1. TEC-OS keeps EXPAND 0 in view almost all the time, and
programs always see it.

At reset the board also shows the first 2 KiB of the ROM at `0000h`, so the
Z80 starts in ROM. TEC-OS jumps to the same code at its normal address in
the `C000h` region and turns the overlay off. From then on `0000h–07FFh` is
RAM.

## A program's view

A CP/M program has one block of memory, from `0000h` to the top of
EXPAND 0:

| Addresses | Contents |
| --- | --- |
| `0000h–00FFh` | Page zero: CP/M's fixed addresses |
| `0100h–B805h` | The program area, 46,854 bytes on the starter card |
| `B806h–BFFFh` | The BDOS entry and TEC-OS's workspace |

CP/M calls the program area the TPA, for transient program area. A program
loads at `0100h` and starts there. It may use memory up to the BDOS entry,
whose address is the word at `0006h`. On the starter card that word is
`B806h`. The figure changes with the card and with any resident programs, so
programs read it rather than assume it. Chapter 4 explains how the drives
a card mounts move it down, and Chapter 8 shows a resident program moving it
down further. On a board that loads the graphics LCD console, a resident
itself, the word is `B506h` on the starter card and programs have 46,086
bytes.

Above the BDOS entry is TEC-OS's workspace in EXPAND 0. It holds the
drives' maps of free space, the disk buffers and the stacks of the BIOS,
the BDOS and the command processor. The BIOS jump table is at its top, at
`BF00h`. The command
processor and the BDOS run from ROM, so unlike CP/M on other machines they
take no space in the program area. A program can't gain memory by
overwriting them.

## Page zero

CP/M fixes the use of the first 256 bytes:

| Address | Contents |
| --- | --- |
| `0000h` | `JP` to the BIOS warm boot. A program that jumps to `0000h` ends |
| `0001h` | The address of the warm boot entry in the BIOS jump table at `BF03h` |
| `0003h` | The IOBYTE, whose low two bits choose the console (Chapter 2) |
| `0004h` | The current drive in the low four bits and the user area in the high four |
| `0005h` | `JP` to the BDOS. A program calls here for every system function |
| `0006h` | The BDOS entry address, the top of the program area |
| `0008h–0037h` | Restart vectors for `RST 08h` to `RST 30h`, free for programs |
| `0040h–004Fh` | TEC-OS's own state |
| `005Ch` | The first default file control block |
| `006Ch` | The second default file control block |
| `0080h` | The command tail, and the default 128-byte disk buffer |

The default file control blocks hold the first two file names on the
command line, already parsed. For `EDIT NOTES.TXT`, the block at `005Ch`
names `NOTES.TXT` on the current drive, and a program can open it without
parsing the command tail. Chapter 6 uses the BDOS's file functions.

TEC-OS keeps sixteen bytes at `0040h–004Fh`, a range CP/M leaves to the
BIOS. They hold state that must stay in view whichever half of U9 is at
`8000h`. Two of them are of use to programs: the console's columns at
`0048h` and its rows at `0049h`. Chapter 2 describes them. A program
should leave the rest alone.

A program may use the restart vectors for its own `RST` handlers. When it
ends, warm boot fills each vector that doesn't jump into ROM with seven
zeros and a `RET`. An `RST` that later reaches one returns at once.

## EXPAND 1

Programs can't see EXPAND 1's 16 KiB. EXPAND 0 occupies the same
addresses, and it holds the BDOS entry, TEC-OS's workspace and the top of
the program area. TEC-OS uses all of EXPAND 1 for itself:

| Addresses | Contents |
| --- | --- |
| `8000h–BBFFh` | The block cache's 30 blocks of 512 bytes (Chapter 4) |
| `BC00h–BCFFh` | The cache's table: the card block each one holds, and whether it holds changes |
| `BD00h–BDFFh` | The command history (Chapter 3) |
| `BE00h–BEFFh` | The saved state of nested command processors (Chapter 3) |
| `BF00h–BFFFh` | Reserved |

A reset clears it all.

Two entries in the table at `FF00h` copy memory. They work as CP/M 3's
BIOS functions of the same names:

- `XMOVE` at `FF12h` sets the source and destination of the next copy. `C`
  is the source and `B` the destination, each 0 for the program's memory or
  1 for EXPAND 1.
- `MOVE` at `FF15h` copies `BC` bytes from `DE` to `HL` and returns `A = 0`.
  It copies nothing and returns `A = FFh` if either end of the copy is
  outside its region.

In the program's memory, the region is `0000h` up to the BDOS entry. In
EXPAND 1 it is `8000h` up to a low mark, and the word at `FF18h` holds the
address of a byte that holds the mark's page. The mark is `80h`, so EXPAND
1 has no region for programs and `MOVE` refuses every copy that touches
it. A CP/M 3 program that checks the result carries on without the extra
memory. Between two places in the program's own memory, with both banks 0,
`MOVE` copies as `LDIR` does.

A program should not switch EXPAND 1 in by writing the latch itself. With
EXPAND 1 in view, the BDOS entry and TEC-OS's workspace are gone, and so is
the top of the program. Anything it wrote there would also overwrite the
cache's blocks, and with them changes on their way to the card.
