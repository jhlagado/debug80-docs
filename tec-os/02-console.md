---
title: The console
parent: TEC-OS
nav_order: 2
nav_group: "Part I: Using and programming TEC-OS"
---

# 2. The console

<!-- Checked against TEC-OS 78127ec. -->

The console is the device you type on and the one TEC-OS answers on. A
TEC-1G can carry a serial terminal, a PICO9918 video card and a graphics LCD
at once. TEC-OS uses one of them at a time. The board decides which one it
starts on, and the `CON` command moves it.

## The four console devices

CP/M 2.2 records the choice of console in the IOBYTE, the byte at address
`0003h`. Its low two bits name the console device. CP/M calls the four values
`TTY:`, `CRT:`, `BAT:` and `UC1:`, and TEC-OS gives each name a device of the
TEC-1G:

| Name | IOBYTE bits | Keys from | Output to |
| --- | --- | --- | --- |
| `TTY:` | 0 | serial port | serial port |
| `CRT:` | 1 | matrix keyboard | PICO9918 |
| `BAT:` | 2 | serial port | nowhere |
| `UC1:` | 3 | matrix keyboard | graphics LCD |

`TTY:` is a terminal program on a PC, connected to the board's FTDI serial
port. `CRT:` is the PICO9918 with the matrix keyboard, at 80, 40 or 32
columns and 24 rows. `UC1:` is the 128 × 64 graphics LCD with the matrix
keyboard. TEC-OS draws 21 columns and 8 rows of characters on it.

`BAT:` is CP/M's batch device. It reads the reader device and prints on the
list device, CP/M's printer. TEC-OS's reader is the serial port, and its list
device discards what it is given. So on `BAT:` TEC-OS reads the serial port
and prints nothing. [Chapter 9](09-programs-and-console.md) describes the
reader and the list device.

The 20 × 4 LCD is never the console. TEC-OS writes its version and the drives
there at cold boot. A program writes to it through the hardware services of
[Chapter 10](10-hardware-services.md).

## The console at cold boot

Cold boot, after power-on or a reset, clears page zero, the first 256 bytes of
memory. That sets the IOBYTE to 0, `TTY:`. On a board where the PICO9918
answers and the Matrix configuration switch is on, cold boot then starts the
PICO9918's console. It sets the console field to 1, `CRT:`, before it prints
the banner. So the console starts on `CRT:` on that board and on `TTY:` on
any other. A PICO9918 with the switch off stays dark, and the console stays on
the serial terminal.

A warm boot is the restart of the CCP when a program ends. It leaves the
IOBYTE as it was, and the console with it. A reset is a cold boot, and the
console starts again as above.

## The serial terminal

The serial port runs at 4800 baud with 8 data bits, no parity and 2 stop bits.
The terminal program on the PC is set the same way. TEC-OS sends and receives
each bit itself, through bit 6 of port `01h` for output and bit 7 of port
`03h` for input. It times each bit by counting the Z80's clock cycles, about
833 T-states at 4 MHz. The counts are for 4 MHz, so the serial link needs the
board's clock on FAST, as Appendix G explains.

TEC-OS passes every byte to the serial terminal unchanged. The terminal
program interprets control characters and escape sequences itself. A program
that moves the cursor or clears the screen therefore needs a terminal program
that follows the ANSI conventions, as most do. TEC-OS has no way to read the
size of a serial terminal. The CCP takes it to be 80 columns by 24 rows, the
size most programs written for CP/M use.

The board has no hardware to hold an incoming byte, and TEC-OS takes no
interrupt from the serial line. A byte is caught only while TEC-OS polls the
line. It polls while a program waits for a key, and for a moment before each
character the BDOS prints. A byte that arrives while TEC-OS is doing anything
else is lost. Keys typed by hand at the prompt are caught. Text pasted into
the terminal program, or typed ahead of a busy program, can lose characters.

## A display as the console

The PICO9918's console is in the ROM, and it takes no memory from programs.
Cold boot starts it when the PICO9918 answers and the matrix keyboard is
there. With either missing it stays unstarted.

The graphics LCD's console is a driver, `GLCD.SVC`, a file on the card. TEC-OS
loads it into memory below the BDOS. On a board with the graphics LCD and no
PICO9918 console, the starter card's startup file installs it before the first
prompt. The graphics LCD is the console from then on.
[Chapter 6](06-startup-file.md) gives the rules for the startup file and for
what the driver's line does on each board.

A console on a display is a *video console*, and there TEC-OS is the terminal.
It draws each character at the cursor and moves the cursor on. It acts on the
control characters and the ANSI escape sequences that
[Chapter 9](09-programs-and-console.md) lists. While TEC-OS waits for a key on
a display, the cursor is drawn as the reverse image of the character under it.
The next character printed removes it.

## Moving the console with CON

`CON` with no argument names the console in use. Its four replies are
`CON: TTY:`, `CON: CRT:`, `CON: BAT:` and `CON: UC1:`.

`CON` followed by a device name sets the IOBYTE's console field to that
device. The names are `TTY`, `CRT`, `BAT` and `UC1`, and a colon may follow
them. `PICO` is another name for `CRT` and `GLCD` another for `UC1`. The BIOS
acts on the new bits at its next console call. That call is the one that
prints `CON`'s reply, so the reply appears on the new console. Any other name
is printed back with a question mark:

<!-- node tools/capture.mjs "CON XYZ" -->
```text
A>CON XYZ
XYZ?

A>
```

On a board with a PICO9918 and the matrix keyboard, the PICO9918 is the
console from cold boot. There `CON TTY` typed on the matrix keyboard moves
the console to the serial terminal. The echo of the command appears on the
PICO9918. The reply and the next prompt appear on the serial terminal, which
shows this:

<!-- node tools/capture.mjs --board pico --serial "CON TTY" -->
```text
CON: TTY:
A>
```

The terminal shows nothing of the boot, which went to the PICO9918. Its first
line is the reply to `CON TTY`. The PICO9918 keeps what was on it, but TEC-OS
writes nothing more there and stops reading the matrix keyboard. `CON CRT`
typed on the PC moves the console back. Whenever a display becomes the
console, the BIOS clears its screen and puts the cursor at the top left. The
one exception is a PICO9918 that a program has claimed, as
[Chapter 10](10-hardware-services.md) describes. So after `CON CRT` the
PICO9918 shows only the reply and the prompt:

<!-- node tools/capture.mjs --board pico --screen "CON TTY" "CON CRT" -->
```text
CON: CRT:
A>
```

`CRT:` needs the PICO9918's console. Cold boot starts it only on a board with
the PICO9918 and the matrix keyboard. Where it didn't start, the BIOS uses the
serial terminal and puts `TTY:` back in the console field. So there is always
a console, and `CON` reports the device that took it. `UC1:` needs the
graphics LCD, its driver and the matrix keyboard. If the driver isn't
installed, `CON UC1` first loads `GLCD.SVC` from drive A. When the load fails,
as on a board with no graphics LCD, the console stays where it was. The 20 × 4
LCD then shows `GLCD?`. On a board with only a serial terminal, `CON CRT` and
`CON UC1` both leave the console there:

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

On a board with both displays the PICO9918 is the console from cold boot, and
the starter card's `GLCD.SVC` line installs nothing. `CON UC1` then loads the
driver and moves the console to the graphics LCD. The web page's board is
one, and its graphics LCD shows this after `CON UC1`:

<!-- node tools/capture.mjs --board pico --screen "CON UC1" CON -->
```text
CON: UC1:
A>CON
CON: UC1:
A>
```

`CON CRT` has no such load, because the PICO9918's console is in the ROM.

`BAT:` sends the console's output nowhere. After `CON BAT` the serial terminal
shows nothing at all. TEC-OS still reads the commands typed there, and
`CON TTY` typed blind brings the console back. In this run `DIR` was typed
after `CON BAT` and ran. Its listing went nowhere, so the terminal shows only
the line before and the reply after:

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

A program changes the console in the same way, by writing the IOBYTE's
console field. TEC-OS acts on the change at the program's next console call.
Digital Research's `STAT CON:=CRT:` works like this, so a copy of `STAT` from
another CP/M system changes the console too.

The PICO9918's console has three widths, each of 24 rows. Two are text, 80
columns and 40, and the third is 32 columns in the PICO9918's Graphics I mode.
Cold boot starts it at 80. A width after `CRT` or `PICO`, with a space before
it, sets the width and makes the PICO9918 the console. `CON PICO 40` and
`CON CRT 32` both work. The BIOS clears the screen at the new width at its
next console call. A warm boot keeps the width, and a reset sets 80 again.
Here is the web page's PICO9918 after `CON PICO 32`, the program `MOUNT` and
`DIR`:

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

`MOUNT` ended in a warm boot, which kept the width. `DIR` puts two names on a
row of 32 columns where it puts six on a row of 80. Any other width is printed
back with a question mark. So is a width after another name, or one with no
space before it. The console then stays as it was:

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

A width typed at the prompt gets the same question mark on a board where cold
boot didn't start the PICO9918's console. [Chapter 6](06-startup-file.md)
describes the same line in the startup file, where it passes quietly.

## The keyboard and the line

On `CRT:` and `UC1:` keys come from the matrix keyboard, and TEC-OS doesn't
read the serial port. On `TTY:` and `BAT:` it reads only the serial port.

Three keys of the matrix keyboard are modifiers, held down with another key:
Shift, Ctrl and Fn. Shift gives capital letters and the symbols above the
other keys. On the digit keys these are the symbols of a PC keyboard: `)` on
0, `!` on 1, `@` on 2 and so on to `(` on 9. Ctrl with a letter gives that
letter's control code, from `01h` for A to `1Ah` for Z. So Ctrl and C
together is `^C`. Fn gives the same character as the key alone. A modifier
pressed alone sends nothing. Two keys held together send nothing either,
unless one of them is a modifier.

The Caps key turns Caps Lock on and off. The CAPS lamp, bit 7 of the board's
system latch, lights while it is on. With Caps Lock on, the letter keys give
capitals with Shift or without it, and the `{` key gives `[`. The other keys
are unchanged.

Return sends `0Dh` and Esc `1Bh`. `^H` is backspace, `08h`, and `^I` is tab,
`09h`. The four arrow keys send the escape sequences of an ANSI terminal:

| Key | Bytes |
| --- | --- |
| Up | `ESC [ A` |
| Down | `ESC [ B` |
| Right | `ESC [ C` |
| Left | `ESC [ D` |

So a program written for the arrow keys of a PC's terminal program, such as
the starter card's editor `TED`, reads them from the matrix keyboard too. The
keyboard gives no `]`, `}`, `` ` `` or `~`, and no Delete, `7Fh`.

A key is sent once, when it goes down. Holding it doesn't repeat it. TEC-OS
scans the keyboard while it waits for a key, and when the BDOS checks for one
during output. A key pressed and released while a program is busy elsewhere
is lost.

Whichever keyboard you type on, the CCP reads each command line with BDOS
function 10, CP/M's line input. Function 10 gives you these keys to edit the
line before Return ends it:

| Key | Effect |
| --- | --- |
| `^H`, backspace | Removes the last character, rubbing it out on the screen |
| Delete, `7Fh` | Removes the last character and prints it again, as CP/M 2.2 does on a printing terminal |
| `^X` | Removes the whole line, rubbing it out |
| `^U` | Removes the whole line, prints `#` and starts a new line |
| `^R` | Prints `#` and the line so far again on a new line |
| `^E` | Starts a new line on the screen and leaves the line being typed as it was |
| `^C` | As the first key of a line, prints `^C` and runs a warm boot |
| `^P` | Turns the copy of console output to the list device on or off |
| `^W`, `^N` | Bring back an earlier command line, at the prompt only |

Return or `^J` ends the line, and so does a full one: the CCP's line holds 127
characters. A `^C` anywhere but at the start of the line is ignored.
[Chapter 3](03-command-line.md#command-history) describes the history of
command lines behind `^W` and `^N`.

Two keys act while the BDOS prints. `^S` stops the output, and the next key
starts it again. A `^C` as that key ends the program, as it does in CP/M 2.2.
Any other key is used up and does nothing else. `^P` turns the copy to the
list device on or off, as it does in a line. TEC-OS's list device discards
what it is sent, so `^P` has no effect that you can see. The first other key
typed during output is kept for the program's next console read. Until the
program reads it, TEC-OS reads no further key.

## Pausing output

A long listing would scroll off the screen before you could read it. So `TYPE`
and `DIR` count the lines they print. A line that wraps at the console's right
edge counts once for each row it takes. One line short of a full screen they
print `[more]` on the last row and wait for a key. On the serial terminal they
count as for 80 columns and 24 rows.

The graphics LCD, with 8 rows of 21 characters, shows the pause soonest. The
starter card's `STARTUP.CMD` is too short to fill it, so this card adds
`LINES.TXT`, a text file of ten lines. `tecvol`, the card tool that
[Chapter 4](04-cards-and-volumes.md) describes, puts it on a copy of the
starter card:

```sh
printf 'The graphics LCD has 8 rows of 21 characters.\nA line wider than that goes on in the next row.\nThree\nFour\nFive\nSix\nSeven\nEight\nNine\nTen\n' > lines.txt
cp dist/starter.img long.img
node tools/tecvol.mjs put long.img A lines.txt --text
```

On a board with the graphics LCD and no PICO9918, `TYPE LINES.TXT` stops after
seven rows, and the screen shows this:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" -->
```text
The graphics LCD has
8 rows of 21 characte
rs.
A line wider than tha
t goes on in the next
 row.
Three
[more]
```

The file's first two lines are longer than the screen is wide, and each takes
three rows. The count starts at the listing's first row. So the command line
above it has scrolled away by the time `[more]` appears. A key, `x` in this
run, rubs out `[more]` and prints the next seven rows:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" "@key x" -->
```text
Four
Five
Six
Seven
Eight
Nine
Ten
[more]
```

`^C`, Esc or `Q` at `[more]`, in capitals or not, rubs out `[more]` and ends
the listing there. The test clears one bit of the key before comparing it, so
`#` reads as `^C` and `;` as Esc. A line can hold several commands, as
[Chapter 3](03-command-line.md#several-commands-on-one-line) describes, and
`^C` here drops the rest of such a line. Esc and `Q` end only the listing.
After `q` at the first pause the CCP starts a new line for the prompt, below
the row `[more]` was on. The rest of the file stays unprinted. The graphics
LCD shows this:

<!-- node tools/capture.mjs --card long.img --board glcd --screen "TYPE LINES.TXT" "@key q" -->
```text
8 rows of 21 characte
rs.
A line wider than tha
t goes on in the next
 row.
Three

A>
```
