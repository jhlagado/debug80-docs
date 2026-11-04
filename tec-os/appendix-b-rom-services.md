---
title: B. The ROM table and hardware services
parent: TEC-OS
nav_order: 102
nav_group: "Appendices"
---

# Appendix B. The ROM table and hardware services

Checked against TEC-OS 78127ec.

This appendix lists the ROM table at `C003h`, then the numbered services behind
its one jump: the hardware services 0 to 8, the volume services 9 to 11, the
display driver's service 12, the registry's services 13 and 14 and the font's
service 15. Chapter 9
describes the use of the hardware services, with programs. The names are those
of `src/abi.inc`, which the ROM assembles from and which a build publishes as
`dist/abi.inc` after checking the table's bytes, the number of services and `INFO`'s bits
against the ROM (`src/abi.inc:1-7`, `tools/build.mjs:143-157`,
`tools/media.mjs:204`). The stacks are `abi.inc`'s: a bound on what each service takes
below its return address, the dispatcher's included. The T-states were measured
on the model from the `JP` at `ABICALL` to the final `RET`, so a `CALL` adds 17
to each.

## The ROM table

The table is ABI 5.1. A program tests for `TNA` at `ABITAB` and for a major
version of exactly 5 at `ABIMAJ` before it calls `ABICALL`
(`src/abi.inc:1-7`, `test/programs/demo.asm:29-31`). A new major version may
renumber the services, and a new minor version only adds numbers at the end.
Minor version 1 added service 15, the font (`src/abi.asm:9`).

| Address | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `C003h` | 3 | `ABITAB` | The signature, `TNA` |
| `C006h` | 1 | `ABIMAJ` | The major version, 5 |
| `C007h` | 1 | `ABIMIN` | The minor version, 1 |
| `C008h` | 3 | `ABICALL` | `JP` to the numbered services |

The rows are `src/abi.asm:7-10`. The table ends at `ABIEND`, `C00Bh`, 8 bytes
after it starts, and the ROM's data block follows it (`src/abi.inc:9-13`).

## Calling a service

A program puts the service's number in `C` and the arguments in `B`, `DE` and
`HL`, and calls `ABICALL`. `A` is never an argument. A service returns `A` = 0
with zero set and carry clear on success, or a status with carry set and
nothing changed. `FIND` and `LIST` return otherwise, as their entries say
(`src/abi.inc:15-27`, `src/services.asm:45-51`).

| Status | `abi.inc` | Meaning |
| ---: | --- | --- |
| 0 | | Success |
| 1 | `TNEBAD` | No such number, an argument out of range, or a request refused with nothing changed |
| 2 | `TNENODV` | The device isn't fitted, or isn't the console |

A program tests carry or `A` after a failure. The hardware services and the
dispatcher clear zero with the status, and the volume and display services
leave it as it falls (`src/vol.asm:675-677`, `src/services.asm:362-386`).

The dispatcher reads the service's address from `SVTAB`, one word for each
number, and jumps to it with `B`, `DE` and `HL` as they came
(`src/services.asm:18-41`, `src/tables.asm:82-89`). Any number from `TNCOUNT`, 16,
up returns status 1 with `B`, `DE` and `HL` as they came, in 58 T-states with
no stack used (`src/services.asm:23-26`).

Each service returns with the interrupt state as it found it and runs on the
caller's stack. Each keeps `IX`, `IY` and the alternate registers, except
`MOUNT`, `UNMNT` and `DESC`, which may change `IX` and the alternates.
Registers not named as results are destroyed (`src/abi.inc:18-26`).

| `C` | Name | `abi.inc` | Takes | Stack |
| ---: | --- | --- | --- | ---: |
| 0 | `INFO` | `TNINFO` | nothing | 6 |
| 1 | `DIGIT` | `TNDIGIT` | `HL` → 6 segment bytes | 4 |
| 2 | `LCD` | `TNLCD` | `B` = row, `HL` → 20 characters | 10 |
| 3 | `VIDEO` | `TNVIDEO` | `B` = 1 claim, 0 release | 12 |
| 4 | `TONE` | `TNTONE` | `B` = half period, `DE` = half cycles | 4 |
| 5 | `JOY` | `TNJOY` | nothing | 4 |
| 6 | `KEYS` | `TNKEYS` | `HL` → 8 bytes | 4 |
| 7 | `PUTAT` | `TNPUTAT` | `D` = row, `E` = column, `B` = count, `HL` → characters | 22 |
| 8 | `RTC` | `TNRTC` | `B` = 0 read, 1 set; `HL` → 7 bytes | 8 |
| 9 | `MOUNT` | `TNMOUNT` | `B` = drive, `E` = container index | 24 |
| 10 | `UNMNT` | `TNUNMNT` | `B` = drive | 24 |
| 11 | `DESC` | `TNDESC` | `E` = container index, `HL` → 32 bytes | 24 |
| 12 | `DRVR` | `TNDRVR` | `B` = 3 `UC1:`, `HL` = a driver's table | 4 |
| 13 | `FIND` | `TNFIND` | `DE` → a record's name, `B` = the least version | 8 |
| 14 | `LIST` | `TNLIST` | `B` = an index | 8 |
| 15 | `FONT` | `TNFONT` | nothing | 4 |

## The hardware services

The hardware services, 0 to 8, are in `src/services.asm`. None of them calls the
BDOS, and the only state they keep is the claim byte, `VCLAIM`, in the
workspace (`src/services.asm:1-11`, `src/ram.asm:72`).

**0 INFO.** Returns the devices in `B`, the ROM's version in `DE`, the
console's columns in `L` and its rows in `H`, both 0 for the serial terminal
(`src/services.asm:53-63`). Status is always 0. It reads no device and takes 244
T-states. The version has the major in `D` and the minor in `E`, so `0001h` is
0.1 (`tools/build.mjs:27`, `tools/build.mjs:70`). The bits of `B` are
`CONDEV`'s, with bit 4 added from `VCLAIM`:

| Bit | Value | `abi.inc` | Set when |
| ---: | ---: | --- | --- |
| 0 | `01h` | `HWBMTX` | The matrix keyboard is enabled |
| 1 | `02h` | `HWBPICO` | A PICO9918 answered at cold boot |
| 2 | `04h` | `HWBGLCD` | `GLCD.SVC` is in |
| 3 | `08h` | `HWBRTC` | A DS1302 answered at cold boot: its seconds read below `60h` (`src/boot.asm:47-50`, `src/services.asm:296-309`) |
| 4 | `10h` | `HWBCLM` | The PICO9918 is claimed |
| 7 | `80h` | `HWBWRD` | The ROM's word `GLCD?` is on LCD row 3 |

**1 DIGIT.** Makes one pass over the six digits from the six segment patterns
at `HL`, the leftmost digit first (`src/services.asm:65-81`). For each it writes
the pattern to port `02h` and the digit's bit to port `01h`, bit 5 for the
leftmost and bit 0 for the rightmost, with bit 6 held high. A digit stays lit
for 3,348 T-states, 0.84 ms, of which a `DJNZ` count of 256 is 3,323, and it
is then turned off. All are off at the end. Status is always 0. 20,670
T-states.

**2 LCD.** Writes the 20 characters at `HL` to row `B`, 0 to 3, of the 20 × 4
LCD (`src/services.asm:87-110`). A row above 3 returns status 1. Row 3 also
clears `HWBWRD`, so that a later load of `GLCD.SVC` doesn't blank the program's
text. 4,915
T-states, or 4,935 on row 3.

**3 VIDEO.** With `B` = 1, claims the PICO9918. With `B` = 0, releases it
(`src/services.asm:112-164`). Any other `B` returns status 1 with nothing
changed. With `B` = 0 or 1, status 2 means there is no PICO9918.

A claim removes the cursor if the PICO9918 is the console and stores
`HWBCLM`'s value in `VCLAIM`, in 1,232 T-states with a cursor to remove. While
it holds, output to the PICO9918 is dropped, and no cursor or page flip
touches the chip.

A release with no claim does nothing and returns status 0. Otherwise it clears
`VCLAIM` and, when the ROM's PICO9918 console started at cold boot, calls the
console's restore routine for its text mode, font and page. If the PICO9918 is
the console it then clears the screen and homes the cursor. On a board where
the console didn't start, one with no matrix keyboard, nothing is restored. A
release with the PICO9918 as the console takes 217,252 T-states at 80 columns
and 187,492 at 40, and 147,031 with the console elsewhere. Warm boot makes the same call before it
rebuilds page zero (`src/boot.asm:97-101`).

**4 TONE.** Makes a square wave on port `01h` bit 7, with bit 6 held high,
for `DE` half cycles, each of 16 × `B` + 51 T-states
(`src/services.asm:166-187`). `B` = 0 counts as 256. `DE` = 0 returns at once. A
call takes `DE` half cycles plus 222 T-states. The speaker ends off. Status is
always 0.

| Instructions | T-states |
| --- | ---: |
| `XOR $80`, `OUT (DIGPORT),A`, `LD C,B` | 22 |
| `DEC C`, `JR NZ` for `B` rounds, the last not taken | 16 × `B` − 5 |
| `DEC DE`, `LD C,A`, `LD A,D`, `OR E`, `LD A,C` | 22 |
| `JR NZ`, taken | 12 |

The last half cycle takes 5 T-states less, measured between the two writes
that bound it.

**5 JOY.** Returns the joystick in `B`, 1 for each active line, read from
port `FEh` with `BC` = `F7FEh` and complemented (`src/services.asm:192-196`).
Status is always 0. 214 T-states. That port address also selects row 3 of the
matrix keyboard, so a key in that row sets a bit here, and a line here reads
as a key in that row. The diagnostics ROM's test labels the bits, after MON-3:
`01h` up, `02h` down, `04h` left, `08h` right, `10h` fire 2, `20h` pin 9,
`40h` fire 1 and `80h` fire 3 (`diag/interact.asm:556`). These labels are
unconfirmed.

**6 KEYS.** Reads the matrix keyboard's eight rows into the eight bytes at
`HL`, row 0 first, 1 for each key down (`src/services.asm:200-207`). Each read is
of port `FEh` with one bit low in the high byte of the address, `FEh` for row
0 to `7Fh` for row 7. Status is always 0. 581 T-states. `HWBMTX` reports
whether there is a matrix keyboard.

**7 PUTAT.** On a video console, writes `B` characters from `HL` at row `D`,
column `E`, both from 0, through the display's cell routine
(`src/services.asm:209-253`). The cursor's position is unchanged, though its cell
is removed. The next `CONST` or `CONIN` draws it again, as after any output
(`src/console.asm:119-131`, `src/console.asm:169-187`). The escape parser isn't used, and bytes `80h` to
`FFh` reach the display, which draws them as reverse images of `00h` to `7Fh`
(`src/pico.asm:143-147`, `drivers/glcd.asm:374-376`).

Text is clipped at the right edge. A row past the bottom writes nothing and
returns status 0, and so does a count of 0, which also leaves the cursor
alone. Status 2 means the console is the serial terminal, or the PICO9918 is
claimed and is the console (`src/term.asm:574-585`). A claim doesn't stop
`PUTAT` on the graphics LCD. The stack is 22 bytes on the graphics LCD and 18
on the PICO9918 with a cursor to remove, and 18 and 14 with none. A cell along
a row takes about 509 T-states on the PICO9918 at 80 columns and about 36,900
on `GLCD.SVC`.

**8 RTC.** With `B` = 0, reads the DS1302 into the seven bytes at `HL`. With
`B` = 1, sets it from them (`src/services.asm:255-294`). Any other `B` returns
status 1 and touches no clock. The bytes are BCD: seconds, minutes, hours,
date, month, weekday, year. Each call tests the clock again, and status 2 means
no clock answers. A read takes 6,946 T-states and a set 7,780. A set
turns off the chip's write protect first and writes `80h` to its control byte
last, which turns the protect on again (`src/services.asm:281-291`).

## The volume services, 9 to 11

The volume services are `MOUNT`, `UNMNT` and `DESC` (`src/vol.asm:575-601`):

| `C` | Takes | Effect |
| ---: | --- | --- |
| 9 | `B` = drive, 0 to 3, `E` = container index | Mounts that volume on the drive, in place of any volume there |
| 10 | `B` = drive, 1 to 3 | Unmounts the drive |
| 11 | `E` = container index, `HL` → 32 bytes | Copies the volume's descriptor there, with its byte 14 the drive it is on now, or `FFh` for none |

Drives count from 0 for A. Appendix E gives the descriptor's fields. Each
service returns `A` = 0 with carry clear, or `TNEBAD` with carry and nothing
changed. It refuses an index past the table, a drive past D, a volume already
on a drive, a drive with no slot or a slot too small for the volume, an
attempt to leave drive A empty and a failed write of the cache. After a failed
write of the cache the drives are as they were, but each changed block that
couldn't be written has been dropped from the cache and its change lost. A format 1.0
card gives a slot only to the drives mounted at cold boot.

A mount or an unmount writes the cache's changes for the card first and resets
the drive by BDOS function 37 on the BDOS's own stack (`src/vol.asm:617`,
`src/vol.asm:658`, `src/vol.asm:662-672`), so that the next access logs it in
from its directory. A mount onto the default drive then selects it again with
function 14, which logs the new volume in, so functions 27 and 31 answer for it
at once (`src/vol.asm:679-691`). A program therefore calls them from outside its own BDOS
calls, unlike the other services. On the model a mount or a describe changed
`IX`.

## A display driver's table, 12

`GLCD.SVC` calls `DRVR` from its `INIT` with `B` = 3 for `UC1:` and `HL`
pointing at its table (`src/services.asm:356-386`, `src/video.asm:72-102`). The
table is eight words: six routines the terminal calls, a routine for the page
functions and a last word holding the columns and then the rows. The six, in
order, are put, get, clear to the end of the line, restore, read a row and
write a row. Only `CRT:` calls the seventh, so a driver's may be 0
(`src/video.asm:57-65`, `drivers/glcd.asm:26`).

On success `HL` returns `LINEBUF`'s address, where the row routines read and
write a row, with `A` = 0 and carry clear. `TNEBAD` with carry means nothing
changed: `B` is not 3, `UC1:` has a table already or there is no matrix
keyboard (`src/services.asm:362-386`). `B` = 1 is refused because `CRT:`'s
table is the ROM's own, so a `PICO.SVC` from an older card fails at its
`INIT`. `TNENODV` with carry, nothing changed, refuses a table offered while a
line of `STARTUP.CMD` runs and the `CON:` field is `CRT:`, so a driver that
would only give way to the PICO9918's console is not installed from the
startup file (`src/services.asm:356-380`).

`HL` = 0 drops the mode's table, with `A` = 0, carry clear and `HL` destroyed.
When that mode is the one in effect, the console is chosen again at its next
call. Any other mode in effect is left as it is, its screen kept
(`src/video.asm:103-118`). Each `REMOVE` calls it that way.

## The registry, 13 and 14

`FIND` and `LIST` read the records that services have published
(`src/loader.asm:431-502`).

| `C` | Takes | Returns |
| ---: | --- | --- |
| 13, `FIND` | `DE` → a record's name, 8 bytes padded with spaces; `B` = the least interface version | Carry clear: `HL` = the record's table, `A` = the generation. Carry set: none |
| 14, `LIST` | `B` = an index from 0, newest first | Carry clear: `HL` = that record, `A` = the generation. Carry set: past the last |

A record is 13 bytes: a link word, the 8-byte name, a version byte and the
address of its table (`src/loader.asm:33`). `FIND` takes the newest record whose
name matches and whose version is at least `B`. Each walk stops after 256
records, and the loader refuses a service whose records would take the
registry past 256, so every record is found (`src/loader.asm:250-267`, Chapter
20). Neither makes a BDOS or BIOS call, so either can be made on any stack.

The generation is `SVCGEN`, raised by each removal (`src/ram.asm:265`). It is
8 bits, so after 256 removals it repeats. A program can keep a record's
address until it exits, since no service can be removed while the program
runs. A service that looks a record up later compares the generation or names
the record as a dependency, as Chapter 10 describes.

The ROM's PICO9918 console publishes one record, `PICO`, version 3, in its
block `PIBLK`. `PISTART` makes it the registry's last record at cold boot, and
`UNLOAD`, which removes services, never removes it (`src/pico.asm:22-24`,
`src/pico.asm:43-44`). Its
table is the eight words above, followed by five more:

| Offset | `abi.inc` | Takes | Effect |
| ---: | --- | --- | --- |
| 16 | `PICOREG` | `B` = register, `A` = value | Writes the register |
| 18 | `PICOFIL` | `HL` = VRAM address, `DE` = count, `A` = value | Fills VRAM |
| 20 | `PICOWR` | `HL` = VRAM address, `DE` = source, `BC` = count | Copies RAM to VRAM |
| 22 | `PICORD` | `HL` = VRAM address, `DE` = destination, `BC` = count | Copies VRAM to RAM |
| 24 | `PICOWID` | `A` = 80, 40 or 32 | Sets the console's width. While `CRT:` is in effect, the next console call clears the screen at the new width. Carry for any other width or while the PICO9918 is claimed, with nothing changed |

For the first four the caller must hold the claim. Each checks nothing and
changes `AF`, `BC`, `DE` and `HL` (`src/abi.inc:115-121`), and a count of 0
moves nothing (`src/pico.asm:209-249`). `PICOWID` takes no claim and is the
entry that `CON PICO 40` calls, version 3's addition (`src/abi.inc:123-127`,
`src/pico.asm:49-65`). Three more offsets from the table name bytes of the
console's state for a debugger: `PICOVRB`, 36, the record's version byte, and
`PICOTPD` and `PICOTPS`, 41 and 42, the page drawn and the page shown
(`src/abi.inc:131-135`).

## The font, 15

**15 FONT.** Returns in `HL` the address of the console's font in the ROM,
`FONT` at `C179h`: 96 characters from `20h`, 8 bytes each, one for each row
from the top, with a row's five pixels in bits 7 to 3 (`src/services.asm:351-354`,
`src/abi.inc:91`, `tools/lib/font.mjs:23`). Status is always 0. 194
T-states. The PICO9918's console reads the font by its label, and `GLCD.SVC`
asks for it at `INIT`. A ROM of ABI 5.0 returns status 1 for the number, so
the driver's `INIT` fails there (`drivers/glcd.asm:38-40`).
