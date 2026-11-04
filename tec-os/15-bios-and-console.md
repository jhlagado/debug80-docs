---
title: The BIOS and the console path
parent: TEC-OS
nav_order: 15
nav_group: "Part II: Inside TEC-OS"
---

# 15. The BIOS and the console path

Checked against TEC-OS 78127ec.

The BIOS is the part of a CP/M system written for one machine, and on the TEC-1G
most of it is the console. That console has a serial port made of two port bits
and timing loops, a matrix keyboard scanned by software, a terminal emulator
that turns escape sequences into cursor moves and two displays: the PICO9918,
whose console is in the ROM, and the graphics LCD, whose driver is loaded from
the card.

This chapter starts with the BIOS jump table and the IOBYTE that selects the
console, and then follows a character in from a key and out to a screen. It also
covers the list, punch and reader, and the 20 × 4 LCD, which the BIOS writes to
but which is never the console. Chapter 18 describes the disk entries of the
table.

## The jump table

CP/M 2.2 defines the BIOS as a table of jumps at the start of a page, one for
each function, in a fixed order, so the BDOS and programs reach a machine's BIOS
at the same offsets wherever its routines are. TEC-OS's table has the seventeen
entries of CP/M 2.2 (`src/tables.asm:11-28`):

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

A CP/M program may write over an entry of this table, so TEC-OS's table has to
be in RAM. The table in the ROM is never called. Cold boot copies it to `BF00h`,
the start of the page above the BDOS's workspace (`src/boot.asm:75-78`), and
every caller goes through the copy. The word at `0001h` points at its warm boot
entry, `BF03h`, and a program reaches the table the way CP/M 2.2 programs do, by
taking that word and subtracting 3. The BDOS calls the same copy, since its
names for the BIOS entries are offsets from `RAMBIOS`
(`src/cpm/bdos.asm:14-28`).

Because every caller goes through RAM, the table is a set of hooks. A program
may write its own jump over an entry, to receive every character the BDOS
prints or to put its own routine behind `CONIN`, and the BDOS then calls the
program's routine. Cold boot is the only time the table is copied, so warm boot
leaves a replaced entry in place, as CP/M 2.2's warm boot does
(`src/boot.asm:75-77`). A program that replaces an entry has to put it back
before it ends, or the replacement's code in the TPA is called after the
program has gone.

## The IOBYTE and the console mode

CP/M 2.2's IOBYTE, at `0003h`, gives each of four logical devices a field of
two bits. The two low bits are the console's, `CON:`, and TEC-OS uses them for
its four consoles (`src/console.asm:1-24`, `src/layout.asm:48-53`):

| Value | Device | Input | Output |
| ---: | --- | --- | --- |
| 0 | `TTY:` | the serial port | the serial port |
| 1 | `CRT:` | the matrix keyboard | the PICO9918 |
| 2 | `BAT:` | the serial port | the list device, which discards it |
| 3 | `UC1:` | the matrix keyboard | the graphics LCD |

An odd value is a display with the matrix keyboard. The IOBYTE's console field
is what a program or the CCP's `CON` command writes, and the console mode in
effect is a separate byte, `CONMOD`. The field can change at any time with no
call to the BIOS, so every console entry starts with `CONSEL`, which compares
the field with `CONMOD`. It does nothing when they match
(`src/console.asm:53-65`). When they differ, `CONSW` switches
(`src/console.asm:68-117`).

For `CRT:` or `UC1:`, `CONSW` looks up the display's table in `PIVEC` or
`GLVEC`. With no table for that display, the PICO9918's console not started or
`GLCD.SVC` not loaded, it falls back to the serial terminal. With a table it
copies its seven vectors and the screen's columns and rows into the workspace,
then resets the scroll region and puts the mode in effect. Unless a program has
claimed the PICO9918, it also restores the display's mode, homes the cursor and
clears the screen. For `TTY:` or `BAT:` it sets `VWID` and `VHGT` to 0, so the
hardware service `INFO` returns 0 for the columns and rows: the console has no
screen of known size (`src/services.asm:53-63`).

Whichever mode `CONSW` takes, `CONMD` writes it into `CONMOD` and back into the
IOBYTE's field, so the field always names the console in use once the next
console call has acted on it. A field that named a display or keyboard that
isn't there then reads `TTY:` (`src/console.asm:89-95`, `src/console.asm:350-359`).

Since `CONSEL` runs at the next console call, a change to the IOBYTE takes
effect at the next character. `CON TTY` shows this on the web page's board,
where the ROM's PICO9918 console took the screen before the banner. It writes
the IOBYTE, and the reply is the first thing to reach the serial port since the
reset:

<!-- node tools/capture.mjs --board pico --serial CON "CON TTY" CON -->
```text
CON: TTY:
A>CON
CON: TTY:
A>
```

The banner, the drive list, the `CON` typed before the change, its reply and
the line `CON TTY` itself went to the PICO9918's screen.

`GLCD.SVC` takes the console when it loads. `SVCGO` calls the loader, and when
the service installed has the GLCD's table in its page, `SVCGO` calls `CONSW`
with `UC1:`. While the PICO9918's console is in effect the GLCD gives way: the
driver stays loaded, the console stays as it is and `CON UC1` later switches
with nothing to load (`src/loader.asm:527-550`). A line of `STARTUP.CMD` that
names `GLCD.SVC` while the field is `CRT:` installs nothing, as the section on
the displays' tables below explains, so on a board with both displays the GLCD
takes the console only through `CON UC1` or a load after `CON TTY`. The
PICO9918's console needs no load, since `PISTART` puts `CRT:` in the field at
cold boot.

## Console input

`CONST` may have to receive a character in order to report it, so `CONIN` and
`CONST` share one byte of buffer: `RXFULL` and `RXCHAR`, at `BFE5h` and `BFE6h`.
Whatever produces a character, the serial receiver or the keyboard scan, puts it
in `RXCHAR` and sets `RXFULL`, and `CONIN` returns it from there
(`src/console.asm:174-176`, `src/console.asm:189-198`).

`BCONST` reports a character ready when `RXFULL` is set. Otherwise it checks
the input once. On a video console it scans the whole keyboard, and on the
serial terminal it reads the serial input up to `RXPOLL` times, 77. At 38
T-states a poll, that covers three and a half bit times, and `BCONST` receives
the byte if a start bit comes in that time (`src/console.asm:133-167`).

The table's `CONST` entry is `BCONSTC`, which also draws the cursor on a video
console when nothing is ready, since a program that polls is waiting for a key.
The BDOS's own check for `^S` while it prints calls `BCONST` directly and draws
nothing (`src/console.asm:119-131`).

`BCONIN` waits for a character (`src/console.asm:169-220`). On a video console
it shows the cursor and scans the keyboard one row at a time until a key is
delivered, then takes the key and hides the cursor. On the serial terminal it
loops reading port `03h` until bit 7 goes low, the start bit, and receives the
byte. Bit 7 of every serial byte is cleared. A `NUL` is skipped, because the
Debug80 runtime sends one ahead of its first input byte
(`src/console.asm:169-171`). Each wait for the serial input reads port `00h`
first, because on the model the read lets a queued input byte start. On the
board that port is the hex keypad's encoder and the read does nothing
(`src/console.asm:19-20`).

## The serial port

The TEC-1G has no UART, so TEC-OS times each bit in code by counting T-states.
It sends on bit 6 of port `01h`, the port that also selects the 7-segment
digits, and receives on bit 7 of port `03h` (`src/layout.asm:10-11`). The
settings are 4800 baud, 8 data bits, no parity and 2 stop bits
(`src/console.asm:16-17`).

`TXBYTE` sends a byte (`src/console.asm:259-285`). It reads the interrupt state
with `IFFGET`, which Chapter 19 describes, turns interrupts off so that none can
stretch a bit, and puts them back as they were after the stop bits. Its loop runs
nine times,
for the start bit and the eight data bits from the lowest. Each pass turns the
carry into `00h` or `40h` with `SBC A,A` and `AND 40h` and writes the port, then
waits `TXDLY` passes of a 16-T-state delay and shifts the next bit into the
carry. A pass takes 49 + 16 × `TXDLY` T-states, so with `TXDLY` at 49 it takes
833, one bit at 4800 baud from a 4 MHz clock. The stop bits are the line held
high for `TXSTOP` passes, 105. On the model `TXBYTE` takes 9,293 T-states for a
whole character, and `BCONOUT`'s tests before it bring that to 9,448, so the
serial terminal shows about 420 characters a second.

`RXBITS` receives a byte (`src/console.asm:222-243`). It is called just after a
poll has read the start bit, and the poll runs with interrupts as the caller left
them. `RXBITS` turns them off for the whole byte, as `TXBYTE` does, and waits
`RXHALF` passes, 70, to reach the
middle of the first data bit. It then samples the line eight times, shifting
each sample into `C`, with `RXDLY`, 50, passes between samples. A pass of its
loop takes 38 + 16 × `RXDLY` T-states, 838.

The polling loops that test for the start bit take 38 T-states a pass, so the
edge can be up to 38 T-states old when it is read. `RXHALF` is reduced by half
of that, and by 58.5 for the 65 or 52 T-states `RXBITS` spends on the interrupt
state, to centre the samples on the bits (`src/console.asm:23-24`,
`src/console.asm:225-226`, `tools/build.mjs:37-45`). The counts come from the build, as Chapter 12
describes, and they hold only for a 4 MHz clock, so on a board the CPU clock
switch has to be on FAST.

The serial input has no hardware buffer, so a byte is received only if a routine
is polling for its start bit when it comes (`src/console.asm:18-19`). A byte
that comes while TEC-OS is doing something else is lost. Text sent to TEC-OS
from a PC therefore reaches it whole only as fast as the program reading it
calls `CONIN` or `READER`.

## The list, punch and reader

CP/M 2.2 gives a program three more character devices through the BIOS. The
list device, a printer, and the punch are for output, and the reader is for
input. TEC-OS has no printer, and it puts the other two on the serial port
(`src/console.asm:331-348`):

- `LIST` returns at once, so whatever a program prints to the list device is
  discarded. `LISTST` returns `FFh`, ready, so a program that waits for the
  printer never waits.
- `PUNCH` sends the byte in `C` with `TXBYTE`, all eight bits, whatever the
  console is.
- `READER` waits for a start bit on the serial input and returns the byte
  with `RXBITS`, all eight bits, with no `NUL` skipped.

The punch and reader are the serial port even while the console is a display,
so a program on the PICO9918's console can exchange binary data with a PC over
the serial line. A byte that `CONST` has already received stays in `RXCHAR` for
the console, and `READER` does not return it (`src/console.asm:336-339`). The
console mode `BAT:` takes its input from the serial port, as the reader does,
but `CONIN` serves it through `CINLP`, which clears bit 7 and skips `NUL`
(`src/console.asm:177-179`, `src/console.asm:211-220`). It sends its output to
the list device, and so discards it (`src/console.asm:255-256`).

## The matrix keyboard

The matrix keyboard is read one row at a time through port `FEh`. An `IN A,(C)`
with `C` at `FEh` puts `B` on the high half of the address bus, and the low bit
in `B` selects one of eight rows. The byte read has a low bit for each key down
in that row. Key number k is row k / 8, bit k mod 8. Keys 0, 1 and 2 are Shift,
Ctrl and Fn, keys 3 to 6 are the arrows and key 7 is Caps Lock
(`src/keyboard.asm:4-7`, `src/keyboard.asm:80-82`).

TEC-OS reads the keyboard only when the board's Matrix switch was on at cold
boot. `CONINIT` copies bit 0 of port `03h` into `CONDEV`'s bit `CDMTX`
(`src/console.asm:48-50`), and `KBPOLL` returns at once without it
(`src/keyboard.asm:13-15`).

`KBSTEP` reads one row each time it is called (`src/keyboard.asm:25-58`).
`CONIN` calls it in a loop, and `CONST` calls `KBPOLL`, which runs the eight
steps of one full scan (`src/console.asm:181-182`,
`src/keyboard.asm:9-23`). `KBMASK` holds the row's select byte, rotated left
after each row, and `KBBASE` the number of the row's first key. For each key
down, `KBSTEP` moves the last key seen, `KBE`, into `KBD` and records the new
one in `KBE`, so after a scan `KBE` holds the highest-numbered key down and `KBD`
the one below it.

After the eighth row `KBEVAL` evaluates the scan (`src/keyboard.asm:59-115`).
A key that is still the one held at the last scan, `KBLAST`, gives nothing, so
a key is delivered once when it goes down and holding it does not repeat. A
second key down must be a modifier, since modifiers have the lowest numbers, and
a modifier alone gives nothing. Caps Lock toggles bit 7 of the latch and of
`LATCHV`. An arrow becomes the three bytes `ESC`, `[` and `A`, `B`, `D` or `C`.
The first is delivered at once, and the other two are kept in `KBT1` and `KBT2`
for the next two calls of `CONIN`.

Any other key goes through `KBASCII`, which looks it up
(`src/keyboard.asm:117-179`). Return, Esc, space, quote and backslash come from a
table of plain and shifted values. Digits and punctuation come with their
shifted forms from `KBSHIFT`. Letters come in lower case, in upper case with
Shift or Caps Lock, and as control codes 01h to 1Ah with Ctrl.

## The video terminal

On the serial terminal the terminal program on the PC interprets escape
sequences, and `BCONOUT` sends every byte untouched. A display has no such
program, so on a video console every character of output goes through `VTOUT`, a
terminal emulator of the VT100's kind (`src/term.asm:1-22`).

`BCONOUT` itself is short (`src/console.asm:245-257`). After `CONSEL` it drops
the character if a program has claimed the PICO9918 and the PICO9918 is the
console. It goes to `VTOUT` for `CRT:` and `UC1:`. For `BAT:`, whose output goes
to the list device and so is discarded, it returns with the character dropped.
For `TTY:` it sends to the serial port.

`VTOUT` keeps the cursor in `VROW` and `VCOL`, above the RAM BIOS table, and
draws through the display's vectors. `VPUT` puts a character at a row and column, `VGET` reads one
back and `VCLREOL` clears from a column to the end of its row. `VRDROW` and
`VWRROW` copy a whole row to and from the 80-byte `LINEBUF`
(`src/video.asm:1-41`).

A printable character, `20h` to `7Eh`, goes at the cursor with `VATTR` added to
it, `80h` while reverse video is on, because the display's font draws codes
`80h` to `FFh` as the reverse images of `00h` to `7Fh` (`src/term.asm:15-16`,
`src/term.asm:36-37`). A character in the last column leaves the cursor one past
the edge, and the line wraps only when another printable character comes, as on
a VT100 (`src/term.asm:5-6`, `src/term.asm:39-56`). Bytes from `7Fh` up are
dropped. The control characters `VTOUT` acts on are `CR`, `LF`, `BS`, `HT` with
stops every eight columns, `FF`, which clears the screen and homes the cursor,
and `ESC` (`src/term.asm:61-104`).

An `LF` on the last row of the scroll region scrolls the region up a line, which
is a delete of the region's top line (`src/term.asm:106-122`). Lines move
through `LINEBUF`: each row is read into it and written back one row higher, and
the freed row is cleared (`src/term.asm:528-565`). Below the region, an `LF`
moves the cursor down and stops at the screen's last row.

A sequence reaches `VTOUT` one byte at a time, so the escape parser keeps its
state in `ESCST` at `BFECh`. The state is 0 normally, 1 after `ESC`, 2 while
reading the first number and 3 while reading the second, which starts at a `;`
(`src/term.asm:145-189`). `ESC` and `[` start a sequence, and any other byte
after `ESC` ends it and is dropped. Digits build the current number in a byte. A `?` and any
other byte below `40h` are skipped, so a private or unknown sequence is read to
its end. The byte that ends the sequence selects the action
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

The parameter of `J` is compared only with 2, so `ESC [ 1 J`, which clears to
the start of the screen on a VT100, clears to the end of it here, as any
parameter but 2 does. `K` ignores its parameter, so `ESC [ 1 K` and
`ESC [ 2 K` also clear to the end of the line (`src/term.asm:323-347`). Any
other final byte ends the sequence with nothing done. Inserts and deletes
of characters edit the cursor's row in `LINEBUF` and write it back as one row
(`src/term.asm:371-464`). A scroll region must cover at least two rows, or the
sequence is ignored (`src/term.asm:227-257`).

The cursor is the cell at `VROW` and `VCOL` drawn in reverse: the terminal reads
the cell with `VGET`, flips bit 7 and writes it back with `VPUT`
(`src/term.asm:587-622`). `VCURV` records whether it is drawn. It is shown only
while input is awaited, by `CONIN` and by `CONST` when nothing is ready, so that
output does not pay for drawing a cursor on every character
(`src/term.asm:16-17`). The next character of output removes it first
(`src/term.asm:27`). There is no cursor cell while a wrap is pending.

## The displays' tables

The terminal reaches either display through a table of eight words. The first
six are the terminal vectors `VPUT`, `VGET`, `VCLREOL`, `VREST`, `VRDROW` and
`VWRROW`. The seventh is for the PICO9918's page functions, and the last word
holds the screen's columns and rows. `PIVEC` and `GLVEC`, above the RAM BIOS
table, hold each display's table address, and `CONSW` takes the one its mode
names (`src/ram.asm:242-243`, `src/console.asm:75-86`).

The PICO9918's table is the ROM's. At cold boot `PISTART` copies the template
`PITPL` into `PIBLK`, in the BIOS's part of the workspace, sets the width at 80
columns and puts `PIBLK`'s address in `PIVEC`. It does so only when the
PICO9918 has answered the probe and the matrix keyboard is enabled, and on any
other board `PIVEC` stays 0, so `CRT:` falls back to the serial terminal
(`src/pico.asm:15-47`). The table's columns byte is the width. `TMSW` sets it
to 80, 40 or 32 and chooses the VDP's registers, the name table and a table of
each row's address to match (`src/pico.asm:67-110`). `PIBLK` also holds the
console's record, the last in the registry, named `PICO` at version 3, so a
program finds the table with `TNFIND` as it would a driver's
(`src/pico.asm:22-24`, `src/pico.asm:43-44`). `CON` sets the width through the
table's `PICOWID` entry, as Chapter 17 describes.

`GLCD.SVC` gives the ROM its table through `DRVR`, service 12, which goes to
`SVDRV` and from there to `VIDHOOK` (`src/tables.asm:88`,
`src/services.asm:362-382`, `src/video.asm:67-79`). The driver calls the service
with `CMUC1`, 3, in `B` and the table's address in `HL`. Any other value in
`B`, `CMCRT` among them, returns `TNEBAD` with carry set and changes nothing,
since the PICO9918's table is the ROM's (`src/services.asm:362-367`). A table
offered while a line of `STARTUP.CMD` runs and the `CON:` field is `CRT:` is
refused with `TNENODV`, the status of an absent device, so a driver that could
only give way to the PICO9918's console is not installed from the startup file
(`src/services.asm:356-380`).
`VIDHOOK` keeps the address in `GLVEC` and returns `HL` pointing at `LINEBUF`,
the buffer that the driver's row routines use (`src/video.asm:72-102`). When
there is no matrix keyboard or the display already has a table, it changes
nothing, and the service returns status 1, `TNEBAD`, with carry set.

The driver's `REMOVE` calls the service with `HL` 0, and `VIDHOOK` then drops
the table. When `UC1:` is the mode in effect, it puts the serial terminal in
`CONMOD`. The field still names `UC1:`, so the next console call acts on it
and, with no table now, falls back to the serial terminal. When the GLCD gave
way, the mode in effect is `CRT:`, which `VIDHOOK` leaves as it is, so the
PICO9918's screen and its text stay (`src/video.asm:103-118`).

The seventh vector carries three functions that only the PICO9918's console
needs (`src/video.asm:43-65`). That console has two name tables in VRAM, its
two pages, one shown and one hidden, so a move of rows can be built out of
sight and shown with one register write (`src/pico.asm:67-71`,
`src/pico.asm:114-141`). Function 0 shows the page the terminal has drawn.
`CONST` and `CONIN` call it, so that by the time a program
waits for a key the screen shows what it drew (`src/console.asm:138`,
`src/console.asm:173`). Functions 1 and 2 begin and end a move of rows, around a
scroll or a line insert or delete (`src/term.asm:504`, `src/term.asm:565`). The
terminal calls them only when the console is the PICO9918 and no program has
claimed it.

A program claims the PICO9918 through the hardware service `VIDEO`, number 3,
to draw on it directly (`src/services.asm:112-136`). While it is claimed and is the console,
`VTOWN` reports it and the terminal leaves the display alone: `BCONOUT` drops
output, and there is no cursor and no page flip (`src/term.asm:574-585`). The
claim ends with the hardware service's release or at warm boot, when `HWVREL`
gives the display back to the console before it rebuilds page zero
(`src/boot.asm:97-101`).

The PICO9918's console starts with the probe at cold boot. `TMSINIT` writes
`5Ah` to VRAM address `3FFFh` through ports `BFh` and `BEh` and reads it back,
then does the same with `A5h`. If both come back, `VIDINIT` sets `CDTMS` in
`CONDEV` and goes on to `PISTART` (`src/tms.asm:1-30`, `src/video.asm:8-16`).

## The 20 × 4 LCD

The 20 × 4 LCD is an HD44780 on port `04h` for commands and `84h` for data
(`src/lcd.asm:5-6`). `LCDINIT` sends four commands, `38h`, `0Ch`, `06h` and
`01h`. The first three set an eight-bit interface with two-line addressing, the
display on with no cursor and the address moving right after each character, and
the last clears the display (`src/lcd.asm:8-16`, `src/tables.asm:38`). Before each
command or character `LCDWAIT` reads the busy flag, bit 7 of port `04h`, at most
256 times, so a board with no LCD costs only that wait and no hang
(`src/lcd.asm:18-27`). The rows start at display addresses `80h`, `C0h`, `94h`
and `D4h` (`src/tables.asm:40-41`), and `LCDROW` writes a string from column 0 of a
row (`src/lcd.asm:47-68`).

Cold boot writes `TEC-OS 0.1  TEC-1G` on row 0 and the letters and labels of
drives A and B on rows 1 and 2. Drives C and D have no row
(`src/boot.asm:63-66`, `src/boot.asm:80`, `src/lcd.asm:69-114`).

Row 3 is for one of two words that TEC-OS shows when a board may have no
terminal to show a message on. `CARD?` appears at the diagnostic prompt
(`src/boot.asm:472-473`). `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`
(`src/cpm/ccpcmd.asm:119`, `src/loader.asm:507-525`).

Writing `GLCD?` sets `CDWRD` in `CONDEV` (`src/lcd.asm:36-41`), and `WRDCLR`
writes blanks over the row only while that bit is set. The word is therefore
cleared when `GLCD.SVC` is installed, and a row a program wrote is left alone
(`src/loader.asm:552-564`). Programs reach the LCD
through the hardware service `LCD`, number 2, as Chapter 9 describes.
