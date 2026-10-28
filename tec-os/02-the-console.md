---
title: The console
parent: TEC-OS
nav_order: 2
---

# The console

The console is the device you type commands on and read replies from. A
TEC-1G can have several displays at once, but TEC-OS uses one of them as the
console at a time. This chapter covers the four console devices, how TEC-OS
picks one at start-up, how to change it and what each device does with the
characters a program sends.

## The four devices

CP/M 2.2 keeps the choice of console in the IOBYTE, the byte at `0003h`.
Its low two bits name the console device, and TEC-OS gives each of the four
values a meaning:

| Name | IOBYTE value | Keys from | Output to | Screen |
| --- | ---: | --- | --- | --- |
| `TTY:` | 0 | Serial port | Serial port | The terminal program's own |
| `CRT:` | 1 | Matrix keyboard | PICO9918 | 80, 40 or 32 columns × 24 rows |
| `BAT:` | 2 | Serial port | Discarded | None |
| `UC1:` | 3 | Matrix keyboard | Graphics LCD | 21 columns × 8 rows |

`TTY:` is a terminal program on a PC, connected to the board's FTDI port.
`CRT:` is the PICO9918 video card. Its width depends on which TEC-OS ROM
image is burned: the `board` and `debug80` images give 80 columns, and
`debug80t40` and `debug80g32` give 40 and 32. `UC1:` is the 128 × 64
graphics LCD, which TEC-OS treats as 21 columns of 8 rows. `BAT:` is CP/M's
batch device. It takes its input from the serial port and throws its output
away, and it is rarely what you want.

The 20 × 4 character LCD is never the console. TEC-OS writes its banner and
the mounted drives there at start-up, and programs can write to it through
the hardware services in Chapter 7.

## The console at start-up

TEC-OS chooses the console when the board is reset. It checks for each
display in turn and takes the first that is present:

1. the PICO9918, if it answers and the board's Matrix switch is on;
2. the graphics LCD, if it answers and the Matrix switch is on;
3. otherwise the serial port.

The Matrix switch says whether the matrix keyboard is fitted. Without it
neither display has a keyboard, so TEC-OS uses the serial port.

The graphics LCD console works differently from the others. Its driver is a
file, `GLCD.PRL`, on drive A of the starter card. On a board with the graphics
LCD and no PICO9918, TEC-OS prints its banner and drives on the serial port
and the 20 × 4 LCD. It then loads `A:GLCD.PRL` before the first prompt, and
the prompt appears on the graphics LCD. If the file is missing, the console
stays on the serial port and the 20 × 4 LCD shows `GLCD?`.

## Changing the console

`CON` with no argument names the console in use:

```text
A>CON
CON: TTY: serial terminal
A>
```

`CON` followed by a device name moves the console there. The names are
`TTY`, `CRT`, `BAT` and `UC1`, with or without a colon. On a board with a
PICO9918 and the matrix keyboard, typing `CON TTY` on the matrix keyboard
moves the console to the serial port. The reply and the next prompt appear on
the PC's terminal:

```text
CON: TTY: serial terminal
A>
```

The PICO9918 keeps showing what was on it, but TEC-OS no longer writes there
or reads the matrix keyboard. `CON CRT` typed at the PC moves the console
back. TEC-OS clears the new screen and puts the cursor at the top left when
it takes over a display.

A device that is missing falls back to the serial port, so there is always a
console. On a board with no displays, `CON CRT` changes the IOBYTE and the
console stays where it was:

```text
A>CON CRT
CON: TTY: serial terminal
A>
```

A name TEC-OS does not know is echoed back with a question mark:

```text
A>CON XYZ
XYZ?

A>
```

A program changes the console the same way, by writing a new value to the
IOBYTE at `0003h`. TEC-OS acts on the change at the program's next console
call. That is how CP/M's own `STAT CON:=CRT:` works, so a copy of `STAT`
from another CP/M system can change the console too.

## The serial terminal

The serial port runs at 4800 baud with 8 data bits, no parity and 2 stop
bits. Set the terminal program on the PC to the same. TEC-OS passes every
byte through unchanged, so the terminal program interprets control
characters and escape sequences itself. A terminal that follows the ANSI or
VT100 conventions suits the programs written for TEC-OS.

TEC-OS has no interrupt-driven receiver and no buffer for incoming bytes.
It watches the serial line only while it waits for input. A character typed
while a program is busy and not reading the console is lost. Typing ahead
of a slow program loses characters, but at the prompt and in most
interactive programs TEC-OS is already waiting for the next key.

The serial console has no fixed size, so TEC-OS records it as 0 columns by 0
rows. Programs that need a size assume 80 × 24.

## The video terminal

On the PICO9918 and the graphics LCD, TEC-OS is the terminal. It draws each
printable character from `20h` to `7Eh` at the cursor and moves the cursor
on. A character in the last column leaves the cursor past the edge, and the
line wraps only when another printable character follows. A full-width line
followed by carriage return and line feed therefore leaves no blank line,
which is how a VT100 behaves.

It acts on these control characters:

| Byte | Name | Effect |
| --- | --- | --- |
| `08h` | BS | Moves the cursor left one column |
| `09h` | HT | Moves the cursor to the next multiple of 8 columns |
| `0Ah` | LF | Moves the cursor down a row, scrolling at the bottom |
| `0Ch` | FF | Clears the screen and puts the cursor at the top left |
| `0Dh` | CR | Moves the cursor to column 0 |

It also acts on a subset of the ANSI escape sequences, each starting with
`ESC [`. In the table, `n`, `r`, `c`, `t` and `b` are decimal numbers:

| Sequence | Effect |
| --- | --- |
| `ESC [ n A`, `B`, `C`, `D` | Cursor up, down, right or left `n` places, stopping at the edge; `n` is 1 when left out |
| `ESC [ r ; c H` or `f` | Cursor to row `r`, column `c`, counted from 1 |
| `ESC [ J` | Clear from the cursor to the end of the screen |
| `ESC [ 2 J` | Clear the whole screen |
| `ESC [ K` | Clear from the cursor to the end of the line |
| `ESC [ 7 m`, `ESC [ 0 m` | Reverse video on, off |
| `ESC [ n @`, `ESC [ n P` | Insert `n` blanks or delete `n` characters at the cursor, moving the rest of the line |
| `ESC [ t ; b r` | Make rows `t` to `b` the scroll region and put the cursor at the top left |
| `ESC [ r` | Make the whole screen the scroll region |
| `ESC [ n L`, `ESC [ n M` | Insert or delete `n` lines at the cursor row, within the scroll region |

TEC-OS reads any other escape sequence to its end and ignores it, so a
program written for a fuller terminal leaves no stray characters on the
screen. The scroll region goes back to the whole screen when the console
changes and when a program ends.

Characters `80h` to `FFh` are the reverse images of `00h` to `7Fh`. The
cursor is drawn as the reverse image of the character under it while a
program waits for a key.

The starter card's `TERM` program draws on the screen with these sequences.
`TERM S` also tests the scroll region. Chapter 6 shows how a program uses
them.

## The matrix keyboard

On `CRT:` and `UC1:` keys come from the matrix keyboard. Shift gives capitals
and the shifted symbols, and Ctrl with a letter gives its control code, so
Ctrl and C together is `^C`. The Caps key turns Caps Lock on and off and lights
the CAPS lamp to show it. A key is delivered once when it goes down, and
holding it doesn't repeat it.

The four arrow keys send the same escape sequences an ANSI terminal sends:

| Key | Sequence |
| --- | --- |
| Up | `ESC [ A` |
| Down | `ESC [ B` |
| Right | `ESC [ C` |
| Left | `ESC [ D` |

So a program that works with arrow keys on a PC terminal works with the
matrix keyboard too. TEC-OS scans the keyboard only while it waits for input,
so a key pressed while a program is busy is lost, as on the serial port.

## Pausing long output

`TYPE` and `DIR` count the lines they print, including lines that wrap. One
line short of a full screen they print `[more]` and wait for a key. `^C`,
Esc or `Q` stops the listing, and any other key shows the next screen. On
the serial console they assume 24 rows.

## The console's size for programs

A program can read the console's size instead of assuming 80 × 24. The
columns are at `0048h` and the rows at `0049h`, and both are 0 on the serial
console. The table of services at `FF00h` also holds the size, and Chapter 7
describes that table. An editor that reads the size lays out its screen for
the PICO9918 at 80 or 40 columns and for the graphics LCD without being
rebuilt.
