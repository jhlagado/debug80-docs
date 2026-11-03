---
title: The BIOS and the console path
parent: TEC-OS
nav_order: 15
nav_group: "Part II: Inside TEC-OS"
---

# 15. The BIOS and the console path

Checked against TEC-OS 7935507.

The BIOS is the part of a CP/M system written for one machine, and on the TEC-1G
most of it is the console. That console has a serial port made of two port bits
and timing loops, a matrix keyboard scanned by software, a terminal emulator
that turns escape sequences into cursor moves and displays whose code is loaded
from the card.

This chapter starts with the BIOS jump table and the IOBYTE that selects the
console, and then follows a character in from a key and out to a screen. It also
covers the list, punch and reader, and the 20 × 4 LCD, which the BIOS writes to
but which is never the console. Chapter 18 describes the disk entries of the
table.

## The jump table

CP/M 2.2 defines the BIOS as a table of jumps at the start of a page, one for
each function, in a fixed order, so the BDOS and programs reach a machine's BIOS
at the same offsets wherever its routines are. TEC-OS's table has the seventeen
entries of CP/M 2.2 (`src/tables.asm:10-26`):

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
the start of the page above the BDOS's workspace (`src/boot.asm:61-64`), and
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
(`src/boot.asm:61-63`). A program that replaces an entry has to put it back
before it ends, or the replacement's code in the TPA is called after the
program has gone.

## The IOBYTE and the console mode

CP/M 2.2's IOBYTE, at `0003h`, gives each of four logical devices a field of
two bits. The two low bits are the console's, `CON:`, and TEC-OS uses them for
its four consoles (`src/console.asm:1-8`, `src/layout.asm:58-63`):

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
the field with `CONACT`, the field it last acted on. It does nothing when they
match (`src/console.asm:47-59`). When they differ, `CONSW` switches
(`src/console.asm:61-103`).

For `CRT:` or `UC1:`, `CONSW` looks up the display driver's table in `PIVEC` or
`GLVEC`. With no driver loaded for that display it falls back to the serial
terminal. With a driver it copies the driver's seven vectors and the screen's
columns and rows into the workspace, then resets the scroll region and sets the
mode. Unless a program has claimed the PICO9918, it also restores the display's
mode, homes the cursor and clears the screen. For `TTY:` or `BAT:` it sets
`VWID` and `VHGT` at `0048h` to 0, so the hardware service `INFO` returns 0 for
the columns and rows: the console has no screen of known size
(`src/services.asm:46-56`).

Since `CONSEL` runs at the next console call, a change to the IOBYTE takes
effect at the next character. `CON TTY` shows this on the web page's board,
with `PICO.SVC` as the console. It writes the IOBYTE, and the reply is the
first thing to reach the serial port after the boot, which had ended there with
`PICO.SVC`:

<!-- node tools/capture.mjs --board pico --serial CON "CON TTY" CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>PICO.SVC
CON: TTY: serial terminal
A>CON
CON: TTY: serial terminal
A>
```

The `CON` typed before the change, its reply and the line `CON TTY` itself
went to the PICO9918's screen, and so did everything after `PICO.SVC` up to the
change.

A display driver takes the console by the same route. `SVCGO` calls the
loader, and when the service installed has a video table in its page, `SVCGO`
writes the mode into the console field and sets `CONACT` to `FFh`, a value no
field has, so that the `CONSEL` it calls next switches (`src/loader.asm:447-472`).
`PICO.SVC` always takes the console, and `GLCD.SVC` takes it only when
`PICO.SVC` is not in.

## Console input

`CONST` may have to receive a character in order to report it, so `CONIN` and
`CONST` share one byte of buffer: `RXFULL` and `RXCHAR`, at `0042h` and `0043h`.
Whatever produces a character, the serial receiver or the keyboard scan, puts it
in `RXCHAR` and sets `RXFULL`, and `CONIN` returns it from there
(`src/console.asm:167-172`).

`BCONST` reports a character ready when `RXFULL` is set. Otherwise it checks
the input once. On a video console it scans the whole keyboard, and on the
serial terminal it reads the serial input up to `RXPOLL` times, 77. At 38
T-states a poll, that covers three and a half bit times, and `BCONST` receives
the byte if a start bit comes in that time (`src/console.asm:118-147`).

The table's `CONST` entry is `BCONSTC`, which also draws the cursor on a video
console when nothing is ready, since a program that polls is waiting for a key.
The BDOS's own check for `^S` while it prints calls `BCONST` directly and draws
nothing (`src/console.asm:105-116`).

`BCONIN` waits for a character (`src/console.asm:149-191`). On a video console
it shows the cursor and scans the keyboard one row at a time until a key is
delivered, then takes the key and hides the cursor. On the serial terminal it
loops reading port `03h` until bit 7 goes low, the start bit, and receives the
byte. Bit 7 of every serial byte is cleared. A `NUL` is skipped, because the
Debug80 runtime sends one ahead of its first input byte
(`src/console.asm:149-150`). Each wait for the serial input reads port `00h`
first, because on the model the read lets a queued input byte start. On the
board that port is the hex keypad's encoder and the read does nothing
(`src/console.asm:19-20`).

## The serial port

The TEC-1G has no UART, so TEC-OS times each bit in code by counting T-states.
It sends on bit 6 of port `01h`, the port that also selects the 7-segment
digits, and receives on bit 7 of port `03h` (`src/layout.asm:10-11`). The
settings are 4800 baud, 8 data bits, no parity and 2 stop bits
(`src/console.asm:16-17`).

`TXBYTE` sends a byte (`src/console.asm:225-249`). It reads the interrupt state
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

`RXBITS` receives a byte (`src/console.asm:193-213`). It is called just after a
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
`src/console.asm:195-196`, `tools/build.mjs:36-44`). The counts come from the build, as Chapter 12
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
(`src/console.asm:289-306`):

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
the console, and `READER` does not return it (`src/console.asm:296-297`). The
console mode `BAT:` takes its input from the serial port, as the reader does,
but `CONIN` serves it through `CINLP`, which clears bit 7 and skips `NUL`
(`src/console.asm:156-158`, `src/console.asm:183-191`). It sends its output to
the list device, and so discards it (`src/console.asm:222-223`).

## The matrix keyboard

The matrix keyboard is read one row at a time through port `FEh`. An `IN A,(C)`
with `C` at `FEh` puts `B` on the high half of the address bus, and the low bit
in `B` selects one of eight rows. The byte read has a low bit for each key down
in that row. Key number k is row k / 8, bit k mod 8. Keys 0, 1 and 2 are Shift,
Ctrl and Fn, keys 3 to 6 are the arrows and key 7 is Caps Lock
(`src/keyboard.asm:4-7`, `src/keyboard.asm:78-79`).

TEC-OS reads the keyboard only when the board's Matrix switch was on at cold
boot. `CONINIT` copies bit 0 of port `03h` into `CONDEV`'s bit `CDMTX`
(`src/console.asm:42-44`), and `KBPOLL` returns at once without it
(`src/keyboard.asm:11-13`).

`KBSTEP` reads one row each time it is called (`src/keyboard.asm:23-54`).
`CONIN` calls it in a loop, and `CONST` calls `KBPOLL`, which runs the eight
steps of one full scan (`src/console.asm:160-161`,
`src/keyboard.asm:9-21`). `KBMASK` holds the row's select byte, rotated left
after each row, and `KBBASE` the number of the row's first key. For each key
down, `KBSTEP` moves the last key seen, `KBE`, into `KBD` and records the new
one in `KBE`, so after a scan `KBE` holds the highest-numbered key down and `KBD`
the one below it.

After the eighth row `KBEVAL` evaluates the scan (`src/keyboard.asm:55-103`).
A key that is still the one held at the last scan, `KBLAST`, gives nothing, so
a key is delivered once when it goes down and holding it does not repeat. A
second key down must be a modifier, since modifiers have the lowest numbers, and
a modifier alone gives nothing. Caps Lock toggles bit 7 of the latch and of
`LATCHV`. An arrow becomes the three bytes `ESC`, `[` and `A`, `B`, `D` or `C`.
The first is delivered at once, and the other two are kept in `KBT1` and `KBT2`
for the next two calls of `CONIN`.

Any other key goes through `KBASCII`, which looks it up
(`src/keyboard.asm:111-166`). Return, Esc, space, quote and backslash come from a
table of plain and shifted values. Digits and punctuation come with their
shifted forms from `KBSHIFT`. Letters come in lower case, in upper case with
Shift or Caps Lock, and as control codes 01h to 1Ah with Ctrl.

## The video terminal

On the serial terminal the terminal program on the PC interprets escape
sequences, and `BCONOUT` sends every byte untouched. A display has no such
program, so on a video console every character of output goes through `VTOUT`, a
terminal emulator of the VT100's kind (`src/term.asm:1-21`).

`BCONOUT` itself is short (`src/console.asm:215-224`). After `CONSEL` it drops
the character if a program has claimed the PICO9918 and the PICO9918 is the
console. It goes to `VTOUT` for `CRT:` and `UC1:`. For `BAT:`, whose output goes
to the list device and so is discarded, it returns with the character dropped.
For `TTY:` it sends to the serial port.

`VTOUT` keeps the cursor in `VROW` and `VCOL` in page zero and draws through the
driver's vectors. `VPUT` puts a character at a row and column, `VGET` reads one
back and `VCLREOL` clears from a column to the end of its row. `VRDROW` and
`VWRROW` copy a whole row to and from the 80-byte `LINEBUF`
(`src/video.asm:1-24`).

A printable character, `20h` to `7Eh`, goes at the cursor with `VATTR` added to
it, `80h` while reverse video is on, because the display's font draws codes
`80h` to `FFh` as the reverse images of `00h` to `7Fh` (`src/term.asm:15-16`,
`src/term.asm:33-34`). A character in the last column leaves the cursor one past
the edge, and the line wraps only when another printable character comes, as on
a VT100 (`src/term.asm:5-6`, `src/term.asm:36-53`). Bytes from `7Fh` up are
dropped. The control characters `VTOUT` acts on are `CR`, `LF`, `BS`, `HT` with
stops every eight columns, `FF`, which clears the screen and homes the cursor,
and `ESC` (`src/term.asm:55-98`).

An `LF` on the last row of the scroll region scrolls the region up a line, which
is a delete of the region's top line (`src/term.asm:100-115`). Lines move
through `LINEBUF`: each row is read into it and written back one row higher, and
the freed row is cleared (`src/term.asm:489-524`). Below the region, an `LF`
moves the cursor down and stops at the screen's last row.

A sequence reaches `VTOUT` one byte at a time, so the escape parser keeps its
state in `ESCST` at `004Ah`. The state is 0 normally, 1 after `ESC`, 2 while
reading the first number and 3 while reading the second, which starts at a `;`
(`src/term.asm:137-178`). `ESC` and `[` start a sequence, and any other byte
after `ESC` ends it. Digits build the current number in a byte. A `?` and any
other byte below `40h` are skipped, so a private or unknown sequence is read to
its end. The byte that ends the sequence selects the action
(`src/term.asm:179-214`):

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

Any other final byte ends the sequence with nothing done. Inserts and deletes
of characters edit the cursor's row in `LINEBUF` and write it back as one row
(`src/term.asm:339-429`). A scroll region must cover at least two rows, or the
sequence is ignored (`src/term.asm:216-245`).

The cursor is the cell at `VROW` and `VCOL` drawn in reverse: the terminal reads
the cell with `VGET`, flips bit 7 and writes it back with `VPUT`
(`src/term.asm:546-576`). `VCURV` records whether it is drawn. It is shown only
while input is awaited, by `CONIN` and by `CONST` when nothing is ready, so that
output does not pay for drawing a cursor on every character
(`src/term.asm:16-17`). The next character of output removes it first
(`src/term.asm:24`). There is no cursor cell while a wrap is pending.

## The display drivers and their service

The terminal's code is in the ROM and the drivers for the two displays are on
the card, so the ROM needs the addresses of each driver's routines. `PICO.SVC`,
in its three widths, and `GLCD.SVC` each give the ROM a table through `DRVR`,
service 12, which goes to `SVDRV` and from there to `VIDHOOK`
(`src/tables.asm:83`, `src/services.asm:323`, `src/video.asm:47-57`). The table is eight words. The
first six are the terminal vectors `VPUT`, `VGET`, `VCLREOL`, `VREST`, `VRDROW`
and `VWRROW`. The seventh is for the PICO9918's page functions, and the last
word holds the screen's columns and rows.

A driver calls the service with the mode in `B`, `CMCRT`, 1, for the PICO9918
or `CMUC1`, 3, for the graphics LCD, and the table's address in `HL`. `SVDRV`
passes the mode to `VIDHOOK` in `A` (`src/services.asm:314-327`). Any other value in
`B` returns `TNEBAD` with carry set, and nothing changes (`src/services.asm:315-322`).
`VIDHOOK` keeps the address in `PIVEC` or `GLVEC`, above the RAM BIOS table, and
returns `HL` pointing at `LINEBUF`, the buffer that the driver's row routines
use (`src/video.asm:58-80`). When there is no matrix keyboard or the display already
has a table, it changes nothing, and the service returns status 1, `TNEBAD`,
with carry set.

A driver's `REMOVE` calls the service with `HL` 0, and `VIDHOOK` then drops the
display's table and sets the mode back to the serial terminal. It also sets
`CONACT` to `FFh`, so that the next console call selects the console again from
the IOBYTE (`src/video.asm:81-95`).

The seventh vector carries three functions that only the PICO9918's driver
needs (`src/video.asm:26-45`). That driver has two name tables in VRAM, its two
pages, one shown and one hidden, so a move of rows can be built out of sight and
shown with one register write (`drivers/pico.asm:17-18`,
`drivers/pico.asm:315-319`). Function 0 shows the page the terminal has drawn.
`CONST` and `CONIN` call it, so that by the time a program
waits for a key the screen shows what it drew (`src/console.asm:119`,
`src/console.asm:152`). Functions 1 and 2 begin and end a move of rows, around a
scroll or a line insert or delete (`src/term.asm:465`, `src/term.asm:524`). The
terminal calls them only when the console is the PICO9918 and no program has
claimed it.

A program claims the PICO9918 through the hardware service `VIDEO`, number 3,
to draw on it directly (`src/services.asm:99-119`). While it is claimed and is the console,
`VTOWN` reports it and the terminal leaves the display alone: `BCONOUT` drops
output, and there is no cursor and no page flip (`src/term.asm:533-544`). The
claim ends with the hardware service's release or at warm boot, when `HWVREL`
gives the display back to the driver (`src/boot.asm:84`).

The ROM's own part of the PICO9918 is the probe at cold boot. `TMSINIT` writes
`5Ah` to VRAM address `3FFFh` through ports `BFh` and `BEh` and reads it
back, then does the same with `A5h`. If both come back, `VIDINIT` sets `CDTMS`
in `CONDEV` (`src/tms.asm:1-30`, `src/video.asm:7-11`).

## The 20 × 4 LCD

The 20 × 4 LCD is an HD44780 on port `04h` for commands and `84h` for data
(`src/lcd.asm:1-6`). `LCDINIT` sends four commands, `38h`, `0Ch`, `06h` and
`01h`. The first three set an eight-bit interface with two-line addressing, the
display on with no cursor and the address moving right after each character, and
the last clears the display (`src/lcd.asm:8-15`, `src/tables.asm:34`). Before each
command or character `LCDWAIT` reads the busy flag, bit 7 of port `04h`, at most
256 times, so a board with no LCD costs only that wait and no hang
(`src/lcd.asm:17-25`). The rows start at display addresses `80h`, `C0h`, `94h`
and `D4h` (`src/tables.asm:36`), and `LCDROW` writes a string from column 0 of a
row (`src/lcd.asm:45-66`).

Cold boot writes `TEC-OS 0.1  TEC-1G` on row 0 and the letters and labels of
drives A and B on rows 1 and 2. Drives C and D have no row
(`src/boot.asm:50-52`, `src/boot.asm:66`, `src/lcd.asm:67-86`).

Row 3 is for one of three words that TEC-OS shows when a board may have no
terminal to show a message on. `CARD?` appears at the diagnostic prompt
(`src/boot.asm:425-426`). `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`
(`src/cpm/ccp.asm:1122`, `src/loader.asm:428-445`). `PICO?` appears when a board
with a PICO9918 and the matrix keyboard reaches its first prompt with no display
driver
(`src/cpm/ccp.asm:1672-1673`).

Writing `PICO?` or `GLCD?` sets `CDWRD` in `CONDEV` (`src/lcd.asm:34-39`), and
`WRDCLR` writes blanks over the row only while that bit is set. A word TEC-OS
wrote is therefore cleared when a display driver is installed, and a row a
program wrote is left alone (`src/loader.asm:474-486`). Programs reach the LCD
through the hardware service `LCD`, number 2, as Chapter 9 describes.
