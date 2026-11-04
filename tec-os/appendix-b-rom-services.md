---
title: B. The ROM table and hardware services
parent: TEC-OS
nav_order: 102
nav_group: "Appendices"
---

# Appendix B. The ROM table and hardware services

Checked against TEC-OS 5a25178.

This appendix lists the ROM table at `C003h`, then the numbered services behind
its one jump: the hardware services 0 to 8, the volume services 9 to 11, the
display drivers' service 12 and the registry's services 13 and 14. Chapter 9
describes the use of the hardware services, with programs. The names are those
of `src/abi.inc`, which the ROM assembles from and which a build publishes as
`dist/abi.inc` after checking the table's bytes, the number of services and `INFO`'s bits
against the ROM (`src/abi.inc:1-4`, `tools/build.mjs:141-156`,
`tools/media.mjs:204`). The stacks are `abi.inc`'s: a bound on what each service takes
below its return address, the dispatcher's included. The T-states were measured
on the model from the `JP` at `ABICALL` to the final `RET`, so a `CALL` adds 17
to each.

## The ROM table

The table is ABI 5.0. A program tests for `TNA` at `ABITAB` and for a major
version of exactly 5 at `ABIMAJ` before it calls `ABICALL`
(`src/abi.inc:1-7`, `test/programs/demo.asm:29-31`). A new major version may
renumber the services, and a new minor version only adds numbers at the end.

| Address | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `C003h` | 3 | `ABITAB` | The signature, `TNA` |
| `C006h` | 1 | `ABIMAJ` | The major version, 5 |
| `C007h` | 1 | `ABIMIN` | The minor version, 0 |
| `C008h` | 3 | `ABICALL` | `JP` to the numbered services |

The rows are `src/abi.asm:7-10`. The table ends at `ABIEND`, `C00Bh`, 8 bytes
after it starts, and the ROM's data block follows it (`src/abi.inc:9-13`).

## Calling a service

A program puts the service's number in `C` and the arguments in `B`, `DE` and
`HL`, and calls `ABICALL`. `A` is never an argument. A service returns `A` = 0
with zero set and carry clear on success, or a status with carry set and
nothing changed. `FIND` and `LIST` return otherwise, as their entries say
(`src/abi.inc:15-27`, `src/services.asm:40-44`).

| Status | `abi.inc` | Meaning |
| ---: | --- | --- |
| 0 | | Success |
| 1 | `TNEBAD` | No such number, an argument out of range, or a request refused with nothing changed |
| 2 | `TNENODV` | The device isn't fitted, or isn't the console |

A program tests carry or `A` after a failure. The hardware services and the
dispatcher clear zero with the status, and the volume and display services
leave it as it falls (`src/vol.asm:624-626`, `src/services.asm:321-331`).

The dispatcher reads the service's address from `SVTAB`, one word for each
number, and jumps to it with `B`, `DE` and `HL` as they came
(`src/services.asm:18-39`, `src/tables.asm:77-84`). Any number from `TNCOUNT`, 15,
up returns status 1 with `B`, `DE` and `HL` as they came, in 58 T-states with
no stack used (`src/services.asm:21-24`).

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
| 12 | `DRVR` | `TNDRVR` | `B` = 1 `CRT:` or 3 `UC1:`, `HL` = a driver's table | 4 |
| 13 | `FIND` | `TNFIND` | `DE` → a record's name, `B` = the least version | 8 |
| 14 | `LIST` | `TNLIST` | `B` = an index | 8 |

## The hardware services

The hardware services, 0 to 8, are in `src/services.asm`. None of them calls the
BDOS, and the only state they keep is the claim byte, `VCLAIM`, in the
workspace (`src/services.asm:1-7`, `src/ram.asm:66`).

**0 INFO.** Returns the devices in `B`, the ROM's version in `DE`, the
console's columns in `L` and its rows in `H`, both 0 for the serial terminal
(`src/services.asm:46-56`). Status is always 0. It reads no device and takes 244
T-states. The version has the major in `D` and the minor in `E`, so `0001h` is
0.1 (`tools/build.mjs:26`, `tools/build.mjs:69`). The bits of `B` are
`CONDEV`'s, with bit 4 added from `VCLAIM`:

| Bit | Value | `abi.inc` | Set when |
| ---: | ---: | --- | --- |
| 0 | `01h` | `HWBMTX` | The matrix keyboard is enabled |
| 1 | `02h` | `HWBPICO` | A PICO9918 answered at cold boot |
| 2 | `04h` | `HWBGLCD` | `GLCD.SVC` is in |
| 3 | `08h` | `HWBRTC` | A DS1302 answered at cold boot: its seconds read below `60h` (`src/boot.asm:44-47`, `src/services.asm:265-277`) |
| 4 | `10h` | `HWBCLM` | The PICO9918 is claimed |
| 7 | `80h` | `HWBWRD` | A word of the ROM's, `PICO?` or `GLCD?`, is on LCD row 3 |

**1 DIGIT.** Makes one pass over the six digits from the six segment patterns
at `HL`, the leftmost digit first (`src/services.asm:58-72`). For each it writes
the pattern to port `02h` and the digit's bit to port `01h`, bit 5 for the
leftmost and bit 0 for the rightmost, with bit 6 held high. A digit stays lit
for 3,348 T-states, 0.84 ms, of which a `DJNZ` count of 256 is 3,323, and it
is then turned off. All are off at the end. Status is always 0. 20,670
T-states.

**2 LCD.** Writes the 20 characters at `HL` to row `B`, 0 to 3, of the 20 × 4
LCD (`src/services.asm:74-97`). A row above 3 returns status 1. Row 3 also
clears `HWBWRD`, so that no display driver blanks the program's text. 4,915
T-states, or 4,935 on row 3.

**3 VIDEO.** With `B` = 1, claims the PICO9918. With `B` = 0, releases it
(`src/services.asm:99-144`). Any other `B` returns status 1 with nothing
changed. With `B` = 0 or 1, status 2 means there is no PICO9918.

A claim removes the cursor if the PICO9918 is the console and stores
`HWBCLM`'s value in `VCLAIM`, in 1,188 T-states with a cursor to remove. While
it holds, output to the PICO9918 is dropped, and no cursor or page flip
touches the chip.

A release with no claim does nothing and returns status 0. Otherwise it clears
`VCLAIM` and, with `PICO.SVC` in, calls the driver's restore routine for its
text mode, font and page. If the PICO9918 is the console it then clears the
screen and homes the cursor. With no `PICO.SVC`, nothing is restored. A
release with the PICO9918 as the console takes 216,051 T-states at 80 columns
and 146,766 with the console elsewhere. Warm boot makes the same call before it
rebuilds page zero (`src/boot.asm:86-88`).

**4 TONE.** Makes a square wave on port `01h` bit 7, with bit 6 held high,
for `DE` half cycles, each of 16 × `B` + 51 T-states
(`src/services.asm:147-166`). `B` = 0 counts as 256. `DE` = 0 returns at once. A
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
port `FEh` with `BC` = `F7FEh` and complemented (`src/services.asm:169-173`).
Status is always 0. 214 T-states. That port address also selects row 3 of the
matrix keyboard, so a key in that row sets a bit here, and a line here reads
as a key in that row. The diagnostics ROM's test labels the bits, after MON-3:
`01h` up, `02h` down, `04h` left, `08h` right, `10h` fire 2, `20h` pin 9,
`40h` fire 1 and `80h` fire 3 (`diag/interact.asm:556`). These labels are
unconfirmed.

**6 KEYS.** Reads the matrix keyboard's eight rows into the eight bytes at
`HL`, row 0 first, 1 for each key down (`src/services.asm:175-182`). Each read is
of port `FEh` with one bit low in the high byte of the address, `FEh` for row
0 to `7Fh` for row 7. Status is always 0. 581 T-states. `HWBMTX` reports
whether there is a matrix keyboard.

**7 PUTAT.** On a video console, writes `B` characters from `HL` at row `D`,
column `E`, both from 0, through the driver's cell routine
(`src/services.asm:184-226`). The cursor's position is unchanged, though its cell
is removed. The console draws it again when it next waits for a key
(`src/console.asm:160`). The escape parser isn't used, and bytes `80h` to
`FFh` reach the driver, which draws them as reverse images of `00h` to `7Fh`
(`drivers/pico.asm:16`, `drivers/glcd.asm:334`).

Text is clipped at the right edge. A row past the bottom writes nothing and
returns status 0, and so does a count of 0, which also leaves the cursor
alone. Status 2 means the console is the serial terminal, or the PICO9918 is
claimed and is the console (`src/term.asm:533-544`). A claim doesn't stop
`PUTAT` on the graphics LCD. The stack is 22 bytes on the graphics LCD and 18
on `PICO.SVC` with a cursor to remove, and 18 and 14 with none. A cell along a
row takes about 487 T-states on `PICO.SVC` at 80 columns and about 35,750 on
`GLCD.SVC`.

**8 RTC.** With `B` = 0, reads the DS1302 into the seven bytes at `HL`. With
`B` = 1, sets it from them (`src/services.asm:228-263`). Any other `B` returns
status 1 and touches no clock. The bytes are BCD: seconds, minutes, hours,
date, month, weekday, year. Each call tests the clock again, and status 2 means
no clock answers. A read takes 6,946 T-states and a set 7,780. A set
turns off the chip's write protect first and writes 0 to its control byte
last.

## The volume services, 9 to 11

The volume services are `MOUNT`, `UNMNT` and `DESC` (`src/vol.asm:532-558`):

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
the drive by BDOS function 37 on the BDOS's own stack (`src/vol.asm:570`,
`src/vol.asm:607`, `src/vol.asm:611-621`), so that the next access logs it in
from its directory. A program therefore calls them from outside its own BDOS
calls, unlike the other services. On the model a mount or a describe changed
`IX`.

## A display driver's table, 12

A display driver calls `DRVR` from its `INIT` with `B` = 1 for `CRT:` or 3 for
`UC1:` and `HL` pointing at its table (`src/services.asm:320-331`,
`src/video.asm:52-57`). The table is eight words: six routines the terminal
calls, a routine for the page functions and a last word holding the columns
and then the rows. The six, in order, are put, get, clear to the end of the
line, restore, read a row and write a row. Only `CRT:` calls the seventh, which
may be 0 elsewhere (`src/video.asm:37-45`, `drivers/glcd.asm:25`).

On success `HL` returns `LINEBUF`'s address, where the row routines read and
write a row, with `A` = 0 and carry clear. `TNEBAD` with carry means nothing
changed: `B` is neither 1 nor 3, that mode has a table already, or there is no
matrix keyboard (`src/services.asm:320-331`).

`HL` = 0 drops the mode's table, with `A` = 0, carry clear and `HL` destroyed,
and the console is chosen again at its next call (`src/video.asm:81-90`). Each `REMOVE` calls it that way.

## The registry, 13 and 14

`FIND` and `LIST` read the records that services have published
(`src/loader.asm:363-425`).

| `C` | Takes | Returns |
| ---: | --- | --- |
| 13, `FIND` | `DE` → a record's name, 8 bytes padded with spaces; `B` = the least interface version | Carry clear: `HL` = the record's table, `A` = the generation. Carry set: none |
| 14, `LIST` | `B` = an index from 0, newest first | Carry clear: `HL` = that record, `A` = the generation. Carry set: past the last |

A record is 13 bytes: a link word, the 8-byte name, a version byte and the
address of its table (`src/loader.asm:25`). `FIND` takes the newest record whose
name matches and whose version is at least `B`. Each walk stops after 256
records. Neither makes a BDOS or BIOS call, so either can be made on any stack.

The generation is `SVCGEN`, raised by each removal (`src/ram.asm:239`). It is
8 bits, so after 256 removals it repeats. A program can keep a record's
address until it exits, since no service can be removed while the program
runs. A service that looks a record up later compares the generation or names
the record as a dependency, as Chapter 10 describes.

`PICO.SVC` publishes one record, `PICO`, version 2, at each width
(`drivers/pico.asm:33-41`). Its table is the eight words above, followed by
four more:

| Offset | `abi.inc` | Takes | Effect |
| ---: | --- | --- | --- |
| 16 | `PICOREG` | `B` = register, `A` = value | Writes the register |
| 18 | `PICOFIL` | `HL` = VRAM address, `DE` = count, `A` = value | Fills VRAM |
| 20 | `PICOWR` | `HL` = VRAM address, `DE` = source, `BC` = count | Copies RAM to VRAM |
| 22 | `PICORD` | `HL` = VRAM address, `DE` = destination, `BC` = count | Copies VRAM to RAM |

The caller must hold the claim. Each entry checks nothing and changes `AF`,
`BC`, `DE` and `HL` (`src/abi.inc:113-119`). A count of 0 moves nothing
(`drivers/pico.asm:166-210`).
