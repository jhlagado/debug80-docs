---
title: The BIOS and the console path
parent: TEC-OS
nav_order: 16
nav_group: "Part II: Inside TEC-OS"
---

# 16. The BIOS and the console path

<!-- Checked against TEC-OS 78127ec. -->

A key or a serial byte ends up in `RXCHAR`, a one-byte buffer above the RAM
BIOS table. `CONIN` returns it to the BDOS and a program prints its reply
through `CONOUT`. On a video console `VTOUT` turns each character into a cell
that `VPUT` draws. This chapter follows that path. It starts at the jump table
and the IOBYTE that selects the console. It ends at the two displays and a
program's claim on one of them. The table's disk entries are
[Chapter 17](17-sd-card-and-volumes.md)'s.

## The jump table in RAM

CP/M 2.2 defines the BIOS as a table of jumps at the start of a page, one for
each function in a fixed order. The BDOS and programs reach any machine's BIOS
at the same offsets. TEC-OS's table has the seventeen entries of CP/M 2.2
(`src/tables.asm:11-28`):

| Offset | Entry | Routine |
| ---: | --- | --- |
| `00h` | cold boot | `COLD` |
| `03h` | warm boot | `WBOOTR` |
| `06h` | `CONST` | `BCONSTC` |
| `09h` | `CONIN` | `BCONIN` |
| `0Ch` | `CONOUT` | `BCONOUT` |
| `0Fh` | `LIST` | `BLIST` |
| `12h` | `PUNCH` | `BPUNCH` |
| `15h` | `READER` | `BREADER` |
| `18h` | `HOME` | `BHOME` |
| `1Bh` | `SELDSK` | `BSELDSK` |
| `1Eh` | `SETTRK` | `BSETTRK` |
| `21h` | `SETSEC` | `BSETSEC` |
| `24h` | `SETDMA` | `BSETDMA` |
| `27h` | `READ` | `BREAD` |
| `2Ah` | `WRITE` | `BWRITE` |
| `2Dh` | `LISTST` | `BLISTST` |
| `30h` | `SECTRAN` | `BSECTRN` |

The table in the ROM is never called. Cold boot copies it to `BF00h`, the page
above the BDOS's workspace, and every caller goes through the copy
(`src/boot.asm:75-78`). A program finds the copy as CP/M 2.2 programs do. The
word at `0001h` points at the warm boot entry, `BF03h`, and the table starts 3
bytes below that. The BDOS's names for the entries are offsets from `RAMBIOS`,
so its calls go through the copy too (`src/cpm/bdos.asm:14-28`).

The copy is in RAM so that a program can write over an entry. A program may
put its own jump in the `CONOUT` slot and receive every character the BDOS
prints. It may put its own routine behind `CONIN` in the same way. Cold boot is
the only time the table is copied, so warm boot leaves a replaced entry in
place, as CP/M 2.2's does (`src/boot.asm:75-77`). A program that replaces an
entry has to put it back before it ends. Otherwise its code in the TPA is
called after the program has gone.

## The IOBYTE and the console mode

CP/M 2.2's IOBYTE, at `0003h`, gives each of four logical devices a field of
two bits. The low two bits are the console's, `CON:`, and TEC-OS uses the four
values for its four consoles (`src/console.asm:1-14`, `src/layout.asm:48-53`):

| Value | Device | Input | Output |
| ---: | --- | --- | --- |
| 0 | `TTY:` | the serial port | the serial port |
| 1 | `CRT:` | the matrix keyboard | the PICO9918 |
| 2 | `BAT:` | the serial port | the list device, which discards it |
| 3 | `UC1:` | the matrix keyboard | the graphics LCD |

An odd value is a display with the matrix keyboard. A program or the CCP's
`CON` command writes the field, and it can change at any moment with no call to
the BIOS. The console in effect is a separate byte, `CONMOD`. Every console
entry therefore starts with `CONSEL`. It compares the field with `CONMOD` and
returns when they match (`src/console.asm:56-66`). When they differ, `CONSW`
switches (`src/console.asm:75-117`).

For `CRT:` or `UC1:`, `CONSW` reads the display's table address from `PIVEC`
or `GLVEC`. The address is 0 when the PICO9918's console was not started or
`GLCD.SVC` is not loaded, and `CONSW` then takes the serial terminal. With a
table it copies the seven vectors and the screen's size into the workspace,
resets the scroll region and puts the mode in effect. Unless a program has
claimed the PICO9918 it also restores the display's mode, homes the cursor and
clears the screen. For `TTY:` or `BAT:` it sets `VWID` and `VHGT` to 0. The
hardware service `INFO` then reports a console with no screen of known size
(`src/services.asm:56-63`).

Whichever mode `CONSW` takes, `CONMD` writes it into `CONMOD` and back into the
IOBYTE's field (`src/console.asm:352-359`). So once the next console call has
acted on a change, the field names the console in use. A field that named a
display or keyboard the board lacks reads `TTY:` again.

Since `CONSEL` runs at the next console call, a change to the IOBYTE takes
effect at the next character. `CON TTY` shows this on the web page's board,
where the ROM's PICO9918 console took the screen before the banner. The command
writes the IOBYTE. Its reply is the first thing to reach the serial port since
the reset:

<!-- node tools/capture.mjs --board pico --serial CON "CON TTY" CON -->
```text
CON: TTY:
A>CON
CON: TTY:
A>
```

The banner, the drive list, the first `CON`, its reply and the line `CON TTY`
itself all went to the PICO9918's screen.

`GLCD.SVC` takes the console when it loads: `SVCGO` calls `CONSW` with `UC1:`
once the driver's table is in. While the PICO9918's console is in effect the
driver stays loaded and the console stays as it is. On a board with both
displays, `GLCD.SVC` typed at the prompt therefore loads and the screen stays
the PICO9918's, and `CON UC1` then switches with nothing to load
(`src/loader.asm:538-550`). The same line in `STARTUP.CMD` loads nothing on
such a board, because the driver's table is rejected, as the section on the
displays explains. [Chapter 25](25-startup.md) explains why the line says
nothing.

## Console input

`CONST` may have to receive a byte in order to report one ready. So it shares
a one-byte buffer with `CONIN`: `RXFULL` and `RXCHAR`, above the RAM BIOS
table. The serial receiver and the keyboard scan both put a character in
`RXCHAR` and set `RXFULL`. `CONIN` returns it from there
(`src/console.asm:174-176`, `src/console.asm:192-198`).

`BCONST` reports a character ready when `RXFULL` is set. Otherwise it checks
the input once. On a video console it scans the whole keyboard. On the serial
terminal it reads the serial input up to `RXPOLL` times, 77, and receives a
byte whose start bit arrives in that time. At 38 T-states a poll, that is
three and a half bit times (`src/console.asm:137-167`). The table's `CONST`
entry is `BCONSTC`, which also draws the cursor on a video console when
nothing is ready, since a program that polls is waiting for a key. The BDOS's
own check for `^S` while it prints calls `BCONST` directly and draws nothing
(`src/console.asm:123-131`).

`BCONIN` waits for a character (`src/console.asm:172-187`). On a video console
it shows the cursor and scans the keyboard one row at a time until a key is
delivered. It then takes the key and hides the cursor. On the serial terminal
it reads port `03h` until bit 7 goes low, the start bit, and receives the byte
(`src/console.asm:213-220`). Bit 7 of every serial byte is cleared. A `NUL` is
skipped, because the Debug80 runtime sends one ahead of its first input byte
(`src/console.asm:169-171`). Each wait for serial input reads port `00h`
first. On the model that read lets a queued input byte start. On the board the
port is the hex keypad's encoder and the read does nothing
(`src/console.asm:19-20`).

## The serial port, the punch and the reader

The TEC-1G has no UART, so TEC-OS times each bit in code by counting T-states.
It sends on bit 6 of port `01h`, which also selects the 7-segment digits, and
receives on bit 7 of port `03h` (`src/layout.asm:10-11`). The settings are
4800 baud, 8 data bits, no parity and 2 stop bits (`src/console.asm:16-17`).

`TXBYTE` sends a byte (`src/console.asm:262-285`). It reads the interrupt
state with `IFFGET` and turns interrupts off, so that none can stretch a bit.
After the stop bits it puts them back as they were. Its loop runs nine times,
for the start bit and then the eight data bits from the lowest. Each pass turns
the carry into `00h` or `40h` with `SBC A,A` and `AND 40h` and writes the
port. It then waits `TXDLY` passes of a 16-T-state delay and shifts the next
bit into the carry. A pass takes 49 + 16 × `TXDLY` T-states. With `TXDLY` at
49 that is 833, one bit at 4800 baud from a 4 MHz clock. The stop bits are the
line held high for `TXSTOP` passes, 105. On the model `TXBYTE` takes 9,293
T-states for a whole character. `BCONOUT`'s tests before it bring that to
9,448, so the serial terminal shows about 420 characters a second.

`RXBITS` receives a byte (`src/console.asm:225-243`). It is called just after
a poll has read the start bit, and it turns interrupts off for the whole byte
as `TXBYTE` does. It waits `RXHALF` passes, 70, to reach the middle of the
first data bit. It then samples the line eight times with `RXDLY` passes, 50,
between samples. A pass of that loop takes 38 + 16 × `RXDLY` T-states, 838.

The five counts come from the build, which counts T-states against the bit
time, 4,000,000 divided by 4800, about 833 (`tools/build.mjs:37-55`).
`TXDLY` is the bit time less the 49 T-states of a `TXB` pass, divided by 16
and rounded, and `RXDLY` is the same with the 38 of an `RXB` pass. `TXSTOP`
is two bit times in 16-T-state passes, plus one. `RXPOLL` is three and a half
bit times in 38-T-state polls, rounded up. `RXHALF` has to reach the middle of
the first data bit from the start bit's edge, one and a half bit times on.
The polling loops read the line every 38 T-states, so the edge can be up to
38 T-states old when it is seen, and `RXHALF` allows for half of that. It also
allows for the 65 or 52 T-states `RXBITS` spends on the interrupt state and
for the fixed 51 T-states around its loop (`src/console.asm:23-24`,
`src/console.asm:225-226`). The counts hold only for a 4 MHz clock, so on a
board the CPU clock switch has to be on FAST. [Chapter 13](13-rom-and-build.md)
describes the file the build writes them to.

The serial input has no hardware buffer. A byte is received only while a
routine is polling for its start bit (`src/console.asm:17-19`), and a byte
that arrives while TEC-OS is doing something else is lost. Text sent from a PC
therefore reaches TEC-OS whole only as fast as the program reading it calls
`CONIN` or `READER`.

CP/M 2.2 gives a program three more character devices through the BIOS. The
list device, a printer, and the punch are for output, and the reader is for
input. TEC-OS has no printer, and the other two are the serial port under
other names (`src/console.asm:328-348`):

- `LIST` returns at once, so whatever a program prints to the list device is
  discarded. `LISTST` returns `FFh`, ready, so a program that waits for the
  printer never waits.
- `PUNCH` sends the byte in `C` with `TXBYTE`, all eight bits, whatever the
  console is.
- `READER` waits for a start bit on the serial input and returns the byte with
  `RXBITS`, all eight bits, with no `NUL` skipped.

The punch and reader stay on the serial port while the console is a display.
A program on the PICO9918's console can therefore exchange binary data with a
PC over the serial line. A byte that `CONST` has already received stays in
`RXCHAR` for the console, and `READER` does not return it
(`src/console.asm:336-339`). The console mode `BAT:` takes its input from the
serial port as the reader does. `CONIN` serves it through `CINLP`, which clears
bit 7 and skips `NUL` (`src/console.asm:177-179`, `src/console.asm:213-220`).
Its output goes to the list device, and so is discarded
(`src/console.asm:255-256`).

## The matrix keyboard

The matrix keyboard is read one row at a time through port `FEh`. An
`IN A,(C)` with `C` at `FEh` puts `B` on the high half of the address bus, and
the low bit in `B` selects one of eight rows. The byte read has a low bit for
each key down in that row. Key number k is row k / 8, bit k mod 8. Keys 0, 1
and 2 are Shift, Ctrl and Fn. Keys 3 to 6 are the arrows and key 7 is Caps
Lock (`src/keyboard.asm:4-7`, `src/keyboard.asm:28-31`,
`src/keyboard.asm:80-83`).

TEC-OS reads the keyboard only when the board's Matrix switch was on at cold
boot. `CONINIT` copies bit 0 of port `03h` into `CONDEV`'s bit `CDMTX`
(`src/console.asm:48-50`), and without it `KBPOLL` returns at once
(`src/keyboard.asm:13-15`).

`KBSTEP` reads one row each time it is called (`src/keyboard.asm:28-58`).
`CONIN` calls it in a loop, and `CONST` calls `KBPOLL`, which runs the eight
steps of one full scan (`src/console.asm:181-182`, `src/keyboard.asm:9-23`).
`KBMASK` holds the row's select byte, rotated left after each row, and
`KBBASE` the number of the row's first key. For each key down, `KBSTEP` moves
the last key seen, `KBE`, into `KBD` and records the new one in `KBE`. After a
scan `KBE` holds the highest-numbered key down and `KBD` the one below it.

After the eighth row `KBEVAL` evaluates the scan (`src/keyboard.asm:59-115`).
A key that is still the one held at the last scan, `KBLAST`, gives nothing. So
a key is delivered once when it goes down, and holding it does not repeat. A
second key down must be a modifier, since the modifiers have the lowest
numbers. A modifier alone gives nothing. Caps Lock toggles bit 7 of the latch
and of `LATCHV`. An arrow becomes the three bytes `ESC`, `[` and `A`, `B`, `D`
or `C`. The first is delivered at once. The other two are kept in `KBT1` and
`KBT2` for the next two calls of `CONIN`.

Any other key goes through `KBASCII` (`src/keyboard.asm:120-179`). Return,
Esc, space, quote and backslash come from a table of plain and shifted values.
Digits and punctuation come with their shifted forms from `KBSHIFT`. Letters
come in lower case, in upper case with Shift or Caps Lock, and as the control
codes `01h` to `1Ah` with Ctrl.

## The video terminal

On the serial terminal the terminal program on the PC interprets escape
sequences, and `BCONOUT` sends every byte untouched. A display has no such
program. On a video console every character of output therefore goes through
`VTOUT`, a terminal emulator of the VT100's kind (`src/term.asm:1-22`).

`BCONOUT` itself is short (`src/console.asm:248-257`). After `CONSEL` it drops
the character if a program has claimed the PICO9918 and the PICO9918 is the
console. For `CRT:` and `UC1:` it goes to `VTOUT`. For `BAT:` it returns with
the character dropped, and for `TTY:` it sends to the serial port.

`VTOUT` keeps the cursor in `VROW` and `VCOL`, above the RAM BIOS table, and
draws through the display's vectors. `VPUT` puts a character at a row and
column, `VGET` reads one back and `VCLREOL` clears from a column to the end of
its row. `VRDROW` and `VWRROW` copy a whole row to and from the 80-byte
`LINEBUF` (`src/video.asm:18-41`, `src/ram.asm:61-69`).

A printable character, `20h` to `7Eh`, goes at the cursor with `VATTR` added
to it. `VATTR` is `80h` while reverse video is on, because the display's font
draws the codes `80h` to `FFh` as the reverse images of `00h` to `7Fh`
(`src/term.asm:15-16`, `src/term.asm:36-37`). A character in the last column
leaves the cursor one past the edge. The line wraps only when another
printable character comes, as on a VT100 (`src/term.asm:5-6`,
`src/term.asm:39-56`). Bytes from `7Fh` up are dropped. The control characters
`VTOUT` acts on are `CR`, `LF`, `BS`, `HT` with stops every eight columns,
`FF`, which clears the screen and homes the cursor, and `ESC`
(`src/term.asm:61-104`).

An `LF` on the last row of the scroll region scrolls the region up a line.
That is a delete of the region's top line (`src/term.asm:109-122`). The rows
move through `LINEBUF`: each is read into it and written back one row higher,
and the freed row is cleared (`src/term.asm:530-565`). Below the region an
`LF` moves the cursor down and stops at the screen's last row.

A sequence reaches `VTOUT` one byte at a time, so the escape parser keeps its
state in `ESCST`. The state is 0 normally and 1 after `ESC`. It is 2 while
reading the first number and 3 while reading the second, which starts at a `;`
(`src/term.asm:145-189`). `ESC` and `[` start a sequence. Any other byte after
`ESC` ends it and is dropped. Digits build the current number in a byte. A `?`
and any other byte below `40h` are skipped, so a private or unknown sequence is
read to its end. The byte that ends the sequence selects the action
(`src/term.asm:190-225`):

| Sequence | Action |
| --- | --- |
| `ESC [ n A`, `B`, `C`, `D` | the cursor up, down, right or left n, at least 1, stopping at the edge |
| `ESC [ r ; c H` or `f` | the cursor to row r, column c, counted from 1 |
| `ESC [ J` | clear to the end of the screen |
| `ESC [ 2 J` | clear the screen |
| `ESC [ K` | clear to the end of the line |
| `ESC [ 0 m`, `ESC [ 7 m` | normal or reverse video |
| `ESC [ n @`, `ESC [ n P` | insert or delete n characters at the cursor |
| `ESC [ n L`, `ESC [ n M` | insert or delete n lines at the cursor's row, in the scroll region |
| `ESC [ t ; b r` | the scroll region from row t to row b, and the cursor home |

The parameter of `J` is compared only with 2. So `ESC [ 1 J`, which clears to
the start of the screen on a VT100, clears to the end of it here, as any
parameter but 2 does. `K` ignores its parameter, so `ESC [ 1 K` and
`ESC [ 2 K` also clear to the end of the line (`src/term.asm:323-347`). Any
other final byte ends the sequence with nothing done. Inserts and deletes of
characters edit the cursor's row in `LINEBUF` and write it back as one row
(`src/term.asm:368-464`). A scroll region must cover at least two rows, or
the sequence is ignored (`src/term.asm:227-257`).

The cursor is the cell at `VROW` and `VCOL` drawn in reverse. The terminal
reads the cell with `VGET`, flips bit 7 and writes it back with `VPUT`
(`src/term.asm:587-622`). `VCURV` records whether it is drawn. The cursor is
shown only while input is awaited, by `CONIN` and by `CONST` when nothing is
ready. Output then pays nothing for a cursor on every character
(`src/term.asm:16-18`), and the next character of output removes it first
(`src/term.asm:27`). There is no cursor cell while a wrap is pending.

## The displays and the claim

The terminal reaches either display through a table of eight words. The first
six are the vectors `VPUT`, `VGET`, `VCLREOL`, `VREST`, `VRDROW` and `VWRROW`.
The seventh is for the PICO9918's page functions, and the last word holds the
screen's columns and rows. `PIVEC` and `GLVEC`, above the RAM BIOS table, hold
each display's table address. `CONSW` takes the one its mode names
(`src/video.asm:72-78`, `src/ram.asm:242-244`, `src/console.asm:79-86`).

The PICO9918's table is the ROM's. Its console starts with a probe at cold
boot. `TMSINIT` writes `5Ah` to VRAM address `3FFFh` through ports `BFh` and
`BEh`, reads it back and does the same with `A5h`. If both come back,
`VIDINIT` sets `CDTMS` in `CONDEV` and goes on to `PISTART`
(`src/tms.asm:11-30`, `src/video.asm:11-16`). `PISTART` copies the template
`PITPL` into `PIBLK`, in the BIOS's part of the workspace. It sets the width at
80 columns and puts `PIBLK`'s address in `PIVEC`. It does so only when the
matrix keyboard is enabled too. On any other board `PIVEC` stays 0, so `CRT:`
takes the serial terminal (`src/pico.asm:32-47`). `TMSW` sets the width to 80,
40 or 32. It chooses the VDP's registers, the name table and a table of each
row's address to match (`src/pico.asm:72-110`). `PIBLK` also holds the
console's record, the last in the registry, named `PICO` at version 3. A
program finds the table with `TNFIND` as it would a driver's
(`src/pico.asm:15-24`, `src/pico.asm:43-44`). `CON` sets the width through the
table's `PICOWID` entry, as [Chapter 20](20-ccp.md) describes.

At `fe2097f`, the PICO9918's normal text is light green on black at all
three widths. The colour byte is `31h` in `TMSCOL` and in each width's
register template (`src/pico.asm:324-327`, `src/pico.asm:645-647`, at
`fe2097f`). This palette change occupies four ROM bytes; it does not move
the console's interface.

`GLCD.SVC` gives the ROM its table through `DRVR`, service 12. The service's
routine `SVDRV` tests the mode and the caller and passes the table to
`VIDHOOK`, which keeps its address in `GLVEC` (`src/services.asm:362-385`, `src/video.asm:79-102`). The
driver calls the service with `CMUC1`, 3, in `B` and the table's address in
`HL`. `SVDRV` rejects any other value in `B` with `TNEBAD` and carry set and
changes nothing, since the PICO9918's table is the ROM's own
(`src/services.asm:362-367`). An older card's `PICO.SVC` offered its table
with `B` at 1, so on this ROM its `INIT` fails. A table offered from a line of
`STARTUP.CMD` while the `CON:` field is `CRT:` is rejected with `TNENODV`,
the status of an absent device. Such a driver could only stand behind the
PICO9918's console, so the startup file does not install it
(`src/services.asm:368-380`). `VIDHOOK` then rejects the table with `TNEBAD`
when there is no matrix keyboard or the display already has a table.
Otherwise it keeps the table and returns `HL` pointing at `LINEBUF`, the
buffer the driver's row routines use.

The driver's `REMOVE` calls the service with `HL` at 0, a drop, which is never
rejected: `SVDRV` skips the startup test for it, and `VIDHOOK` clears `GLVEC`
whatever it held (`src/services.asm:368-370`, `src/video.asm:103-107`). When
`UC1:` is the mode in effect, `VIDHOOK` puts the serial terminal in `CONMOD`.
The field still names `UC1:`, so the next console call acts on it and, with no
table now, takes the serial terminal. When the mode in effect is `CRT:`,
`VIDHOOK` leaves it as it is, so the PICO9918's screen and its text stay
(`src/video.asm:108-118`).

The seventh vector carries three functions that only the PICO9918's console
needs (`src/video.asm:43-65`). That console has two name tables in VRAM, its
two pages, one shown and one hidden. A move of rows can be built out of sight
and shown with one register write (`src/pico.asm:67-71`,
`src/pico.asm:364-402`). Function 0 shows the page the terminal has drawn.
`CONST` and `CONIN` call it, so by the time a program waits for a key the
screen shows what it drew (`src/console.asm:138`, `src/console.asm:173`).
Functions 1 and 2 begin and end a move of rows, around a scroll or a line
insert or delete (`src/term.asm:504`, `src/term.asm:531`,
`src/term.asm:565`). The terminal calls them only when the console is the
PICO9918 and no program has claimed it.

A program claims the PICO9918 through the hardware service `VIDEO`, number 3,
to draw on it directly (`src/services.asm:120-136`). `VTOWN` reports a claim
on the display that is the console, and the terminal then leaves the display
alone: `BCONOUT` drops output, and there is no cursor and no page flip
(`src/term.asm:574-585`). The claim ends with the service's release or at warm
boot. `HWVREL` then puts the display's registers, font and page back and gives
it to the console again, before page zero is rebuilt
(`src/services.asm:141-160`, `src/boot.asm:97-100`).
