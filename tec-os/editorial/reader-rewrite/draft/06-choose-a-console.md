---
title: Choose a console
parent: TEC-OS
nav_order: 6
nav_group: "Part I: Using and programming TEC-OS"
---

# 6. Choose a console

<!-- Checked against TEC-OS 78127ec. -->
<!-- Historical captures retained unchanged at that pin.
     Source-only semantic check: ea3ef3de9133931e925a0220d51c0e971c1fd8dd.
     No execution, new capture or physical-board result is claimed.
     The historical 80-column setup is not evidence for a new opening profile. -->

The console is the keyboard you type on and the display TEC-OS answers on. `CON`
moves that connection between a serial terminal, the PICO9918 and the graphics
LCD. Its reply appears on the console you select.

## Devices and their names

A serial terminal is a terminal program on a PC connected to the board's FTDI
serial port. The PICO9918 and graphics LCD use the TEC-1G's matrix keyboard. A
board can carry all three displays but TEC-OS uses one console at a time.

| Console name | Keys from | Output to |
| --- | --- | --- |
| `TTY:` | serial terminal | serial terminal |
| `CRT:` | matrix keyboard | PICO9918 |
| `UC1:` | matrix keyboard | graphics LCD |
| `BAT:` | serial port | nowhere |

TEC-OS uses CP/M's device names: `CRT:` names the PICO9918 console and `UC1:`
the graphics-LCD console. The command also accepts `PICO` for `CRT` and `GLCD`
for `UC1`. Chapter 16 explains the encoding of those names in memory.

The PICO9918 has 24 rows at widths of 80, 40 or 32 characters. The 128 × 64
graphics LCD has 21 columns and 8 rows. The separate 20 × 4 character LCD is
never the console. At cold boot it shows the version and drives. Programs can
write to it through the ROM services described in Chapter 11.

A warm boot restarts the command prompt when a program ends and keeps the
selected console. Reset runs cold boot and selects the console again from the
board's configuration. A responding PICO9918 and the enabled Matrix switch
select `CRT:` at cold boot in `ea3ef3d`. Otherwise the console starts on `TTY:`.
Chapter 7 explains the startup file that can then load the graphics-LCD console.

## The serial terminal

The PC terminal settings are 4800 baud, 8 data bits, no parity and 2 stop bits.
The board's clock must be on FAST, 4 MHz. TEC-OS generates the serial timing in
software so a different clock setting changes the bit timing. Appendix G lists
the physical preparation requirements.

TEC-OS sends output bytes to the serial terminal unchanged. The PC's terminal
program interprets control characters and escape sequences. Programs that clear
the screen or move the cursor need an ANSI-compatible terminal. TEC-OS cannot
read the terminal's dimensions. Its command listings use 80 columns and 24 rows
for pagination regardless of the terminal window size.

There is no hardware receive buffer on the board. Input is caught only while
TEC-OS polls the serial line. It polls while waiting for a key and briefly
during ordinary text output. Keys typed by hand at the prompt are caught.
Pasting text or typing ahead of a busy program can lose characters. A model's
queued input does not establish that the physical board can receive a paste.

## Moving between displays

`CON` alone reports the console in use. Its four replies are `CON: TTY:`, `CON: CRT:`, `CON: UC1:` and `CON: BAT:`. A name after the command selects that
console. `CON TTY` and `CON TTY:` are equivalent. An invalid name is printed
back with a question mark and leaves the console as it was.

The transcripts in this chapter are retained host-model captures from `78127ec`.
They show their original configurations and output, including the historical
80-column setup. Source inspection does not turn them into new runs or
observations of a physical board.

<!-- node tools/capture.mjs "CON XYZ" -->
```text
A>CON XYZ
XYZ?

A>
```

On a board using the PICO9918 and matrix keyboard, `CON TTY` moves the console
to the serial terminal. You type on the matrix keyboard and see the command
there. The reply and next prompt appear on the serial terminal. This capture
shows only the serial output:

<!-- node tools/capture.mjs --board pico --serial "CON TTY" -->
```text
CON: TTY:
A>
```

The boot text went to the PICO9918. The terminal's first line is the reply. The
PICO9918 keeps its old picture but receives no further console output. Input now
comes from the serial terminal too. `CON CRT` typed there moves both input and
output back to the PICO9918.

Selecting a different display clears it and puts the cursor at the top left. A
program's claim on the PICO9918 prevents that clear until the claim ends, as
Chapter 11 explains. After the move back the PICO9918 capture shows only the
reply and prompt:

<!-- node tools/capture.mjs --board pico --screen "CON TTY" "CON CRT" -->
```text
CON: CRT:
A>
```

## An unavailable display

`CRT:` requires the PICO9918 console to have started at cold boot. That needs
the PICO9918 and the enabled matrix keyboard. Where it did not start, `CON CRT`
selects the serial terminal and reports `CON: TTY:`.

`UC1:` requires the graphics LCD, the matrix keyboard and the console driver
`GLCD.SVC`. A driver is a resident service that handles a device. The PICO9918's
console is in ROM and takes no program memory. The graphics-LCD driver is a file
on drive A. It loads into RAM and reduces the space left for programs. Chapter
10 explains that memory boundary.

`CON UC1` loads `GLCD.SVC` from drive A if it is not installed. A failed load
leaves the console where it was and shows `GLCD?` on the 20 × 4 LCD. Here both
display selections leave a serial-only board on the terminal:

<!-- node tools/capture.mjs CON "CON CRT" "CON UC1" CON -->
```text
A>CON
CON: TTY:
A>CON CRT
CON: TTY:
A>CON UC1
CON: TTY:
A>CON
CON: TTY:
A>
```

On a board with both displays cold boot selects the PICO9918. The starter
card's `GLCD.SVC` startup line then installs nothing. `CON UC1` loads the driver
and selects the graphics LCD. The web page's board has both displays. Its
graphics LCD showed this after the command:

<!-- node tools/capture.mjs --board pico --screen "CON UC1" CON -->
```text
CON: UC1:
A>CON
CON: UC1:
A>
```

`CON CRT` needs no driver load because its console is in ROM. A board with the
graphics LCD and matrix keyboard can also start without a terminal. Where no
PICO9918 console started, the starter card's startup file installs `GLCD.SVC`
before the first prompt. The graphics LCD is the console from then on. Chapter 7
explains the startup conditions.

## A silent console and recovery

`BAT:` is CP/M's batch-device name. In TEC-OS it reads the serial port and
discards console output. After `CON BAT` even the reply disappears. Commands
still run when you type them on the serial terminal.

`CON TTY` typed blind on that terminal brings the visible console back. The
matrix keyboard is not the input device in `BAT:`. In this historical run `DIR`
ran between the two `CON` commands but printed nothing on the terminal:

<!-- node tools/capture.mjs --serial "@start CON BAT" "@start DIR" "CON TTY" -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>CON BAT
CON: TTY:
A>
```

The visible reply belongs to `CON TTY`, which also restores serial output. If a
display goes quiet after a console change, the selected keyboard and display are
the first things to check. A move to `TTY:` needs the serial terminal for both.
A move to `CRT:` or `UC1:` needs the matrix keyboard. Reset selects the cold-boot console again but loses pending card writes. A console change lets you
recover without resetting the machine.

## Choosing the PICO9918 width

A width after `PICO` or `CRT` sets the PICO9918's width and makes it the
console. There must be a space before the number. `CON PICO 40` selects 40
columns and `CON CRT 32` selects 32. Both text widths, 80 and 40, have 24 rows.
The 32-column width also has 24 rows and uses Graphics I mode. The screen clears
when the new width takes effect.

The historical captures used a cold-boot width of 80. The inspected `ea3ef3d`
source also starts the PICO9918 at 80 columns. A warm boot keeps an explicitly
selected width and reset restores that source revision's cold width. This
capture selects 32 columns, runs `MOUNT` and then lists files:

<!-- node tools/capture.mjs --board pico --screen "CON PICO 32" MOUNT DIR -->
```text
CON: CRT:
A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>DIR
MOUNT.COM    GLCD.SVC
STARTUP.CMD  TED.COM
SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

`MOUNT` ended in a warm boot, which kept 32 columns. `DIR` fits two names on
each row here instead of the six in an 80-column listing.

An unsupported width, a width after another device name or a number joined to
`CRT` without a space produces a question mark. The console remains as it was:

<!-- node tools/capture.mjs --board pico "CON CRT80" "CON TTY 40" "CON PICO 50" -->
```text
A>CON CRT80
CRT80?

A>CON TTY 40
40?

A>CON PICO 50
50?

A>
```

A width command typed at the prompt also produces a question mark where cold
boot did not start the PICO9918 console. The same line in `STARTUP.CMD` passes
quietly on that board, as Chapter 7 explains.

## The matrix keyboard

`CRT:` and `UC1:` read the matrix keyboard, not the serial terminal. `TTY:` and
`BAT:` read the serial terminal, not the matrix keyboard. The basic Shift and
Ctrl combinations were introduced with the first commands. Fn gives the same
character as the key alone. A modifier pressed alone sends nothing. Two ordinary
keys held together send nothing either.

Caps turns Caps Lock on and off. The CAPS lamp lights while it is on. With Caps
Lock on, letters are capitals with Shift or without it. The `{` key gives `[`
and the other keys are unchanged.

The arrow keys send standard ANSI sequences. Programs such as `TED` read them on
the matrix keyboard too. The keyboard lacks `]`, `}`, `` ` `` and `~`. It also
has no Delete key. Backspace remains the way to remove the character before the
cursor. On a serial terminal that has Delete, its command-line effect differs
from backspace:

| Key | Effect |
| --- | --- |
| Delete, `7Fh` | Removes the last character and prints it again, as CP/M 2.2 does on a printing terminal |

A matrix key is sent once when pressed. Holding it does not repeat it. A press
and release while the program is busy elsewhere can be lost. Chapter 16 explains
the scan timing and character encodings.

## Text and the cursor on a display

On the PICO9918 or graphics LCD, TEC-OS interprets the text itself. Each
printable character is drawn at the cursor and advances it one column. Control
characters move the cursor or clear the screen. ANSI sequences provide cursor
positioning, screen clearing and reverse video. They also insert or delete
characters and lines. Chapter 16 lists the exact terminal subset. A program
requiring sequences outside that subset may need a serial terminal with fuller
ANSI support.

While a program waits for input on a display, the cursor appears as the reverse
image of the character underneath it. The next output byte removes that cursor.
No cursor is drawn while its position is past the right edge. A character in the
last column leaves the cursor past the edge. Wrapping occurs when another
printable character follows. A full-width line followed by carriage return and
line feed leaves no extra blank row.
