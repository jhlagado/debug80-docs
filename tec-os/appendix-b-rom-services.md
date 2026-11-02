---
title: B. The ROM table and hardware services
parent: TEC-OS
nav_order: 102
nav_group: "Appendices"
---

# Appendix B. The ROM table and hardware services

Checked against TEC-OS 718c01b.

This appendix lists the ROM table at `C003h` entry by entry, then the hardware
services by number, and then the three other entries a program or a service
calls: `ABIVOL`, `ABIGLCD` and `ABISVC`. Chapter 9 describes the use of the
hardware services, with programs. The names are those of `src/abi.inc`, which
a build publishes as `dist/abi.inc` after checking every address and number
against the ROM (`src/abi.inc:1-5`). The stacks and T-states below were
measured on the model, the T-states from the `JP` at the entry to the final
`RET`, so a `CALL` adds 17 to each.

## The ROM table

The table is ABI 4.0. A program tests for `TNA` at `ABITAB` and for a major
version of exactly 4 at `ABIMAJ` before it uses anything after them
(`src/abi.inc:2-4`), since a new major version may move what follows `ABIMAIN`
and renumber the services (`src/abi.asm:3-5`,
`test/programs/demo.asm:29-30`). ABI 4 isn't frozen until a release, and the
table may gain entries at its end, `C018h`.

| Address | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `C003h` | 3 | `ABITAB` | The signature, `TNA` |
| `C006h` | 1 | `ABIMAJ` | The major version, 4 |
| `C007h` | 1 | `ABIMIN` | The minor version, 0 |
| `C008h` | 2 | `ABIVID` | The address of the console's columns, `0048h`, with the rows at the next byte; both are 0 for the serial terminal |
| `C00Ah` | 3 | `ABIHW` | `JP` to the hardware services |
| `C00Dh` | 2 | `ABIMAIN` | The address of the count of MAIN regions fitted, 1 or 2, `0041h` |
| `C00Fh` | 3 | `ABIVOL` | `JP` to mount, unmount and describe |
| `C012h` | 3 | `ABIGLCD` | `JP` to take a display driver's table |
| `C015h` | 3 | `ABISVC` | `JP` to the registry of services |

The rows are `src/abi.asm:7-19`, and the two addresses are `src/layout.asm:38`
and `src/layout.asm:45-46`. `abi.inc` keeps `ABIDRV` as another name for
`ABISVC`, for older sources (`src/abi.inc:17`).

The only other fixed address in the ROM is `C01Dh`, which holds a `RET`
(`src/data.asm:8-13`). The previous version of the table had its mount entry
there, and a card can still hold a `MOUNT.COM` or `VOLS.COM` from that time
that tests nothing. The `RET` returns to such a program with nothing done. The
build checks that it stays.

## Calling a hardware service

A program puts the number in `C` and the arguments in `B`, `DE` and `HL`, and
calls `ABIHW` (`src/hwsvc.asm:1-4`). On return `A` is the status, and results
are as each entry says. `IX`, `IY` and the alternate registers are kept. `BC`,
`DE` and `HL` are not kept, beyond what an entry returns.

| Status | `abi.inc` | Flags | Meaning |
| ---: | --- | --- | --- |
| 0 | | zero set, carry clear | Success (`src/hwsvc.asm:75-76`) |
| 1 | `HWEBAD` | carry set, zero clear | No such number, or an argument out of range |
| 2 | `HWENODV` | carry set, zero clear | The device isn't fitted, or isn't the console |

The failures return through `src/hwsvc.asm:72-74`. Every number outside 19 to
27 returns status 1 with `B`, `DE` and `HL` as they came, in 65 T-states with
no stack used (`src/hwsvc.asm:52-56`). `abi.inc` names the first number
`HWBASE`, 19, and the count `HWCOUNT`, 9.

No service calls the BDOS. Each runs on the caller's stack, and the deepest
takes 22 bytes below its return address (`src/hwsvc.asm:4-6`). The only state
they keep is the claim byte, `VCLAIM`, in the workspace (`src/ram.asm:57`).

| `C` | Name | `abi.inc` | Takes | Stack |
| ---: | --- | --- | --- | ---: |
| 19 | `INFO` | `HWINFO` | nothing | 6 |
| 20 | `DIGIT` | `HWDIGIT` | `HL` → 6 segment bytes | 4 |
| 21 | `LCD` | `HWLCD` | `B` = row, `HL` → 20 characters | 10 |
| 22 | `VIDEO` | `HWVIDEO` | `B` = 0 release, other claim | 10 |
| 23 | `TONE` | `HWTONE` | `B` = half period, `DE` = half cycles | 4 |
| 24 | `JOY` | `HWJOY` | nothing | 4 |
| 25 | `KEYS` | `HWKEYS` | `HL` → 8 bytes | 4 |
| 26 | `PUTAT` | `HWPUTAT` | `D` = row, `E` = column, `B` = count, `HL` → characters | 22 |
| 27 | `RTC` | `HWRTC` | `B` = 0 read, other set; `HL` → 7 bytes | 8 |

## The hardware services

**19 INFO.** Returns the devices in `B`, the ROM's version in `DE`, the
console's columns in `L` and its rows in `H`, both 0 for the serial terminal
(`src/hwsvc.asm:78-91`). Status is always 0. 1,552 T-states. The version has
the major in `D` and the minor in `E`, so `0001h` is 0.1
(`tools/build.mjs:72`). The bits of `B` are `CONDEV`'s, with bit 3 and bit 4
added (`src/hwsvc.asm:32-39`):

| Bit | Value | `abi.inc` | Set when |
| ---: | ---: | --- | --- |
| 0 | `01h` | `HWBMTX` | The matrix keyboard is enabled |
| 1 | `02h` | `HWBPICO` | A PICO9918 answered at cold boot |
| 2 | `04h` | `HWBGLCD` | `GLCD.SVC` is in |
| 3 | `08h` | `HWBRTC` | A DS1302 answers, tested at this call: its seconds read below `60h` (`src/hwsvc.asm:291-303`) |
| 4 | `10h` | `HWBCLM` | The PICO9918 is claimed |
| 7 | `80h` | `HWBWRD` | A word of the ROM's, `PICO?` or `GLCD?`, is on LCD row 3 |

**20 DIGIT.** Makes one pass over the six digits from the six segment patterns
at `HL`, the leftmost digit first (`src/hwsvc.asm:93-107`). For each it writes
the pattern to port `02h` and the digit's bit to port `01h`, bit 5 for the
leftmost and bit 0 for the rightmost, with bit 6 held high. A digit stays lit
for 3,348 T-states, 0.84 ms, of which a `DJNZ` count of 256 is 3,323, and it
is then turned off. All are off at the end. Status is always 0. 20,677
T-states.

**21 LCD.** Writes the 20 characters at `HL` to row `B`, 0 to 3, of the 20 × 4
LCD (`src/hwsvc.asm:109-132`). A row above 3 returns status 1. Row 3 also
clears `HWBWRD`, so that no display driver blanks the program's text. 4,922
T-states, or 4,942 on row 3.

**22 VIDEO.** With `B` not 0, claims the PICO9918. With `B` = 0, releases it
(`src/hwsvc.asm:134-174`). Status 2 with no PICO9918 either way.

A claim removes the cursor if the PICO9918 is the console and stores
`HWBCLM`'s value in `VCLAIM`, in 1,033 T-states with a cursor to remove. While
it holds, output to the PICO9918 is dropped, and no cursor or page flip
touches the chip.

A release with no claim does nothing and returns status 0. Otherwise it clears
`VCLAIM` and, with `PICO.SVC` in, calls the driver's restore routine for its
text mode, font and page. If the PICO9918 is the console it then clears the
screen and homes the cursor. With no `PICO.SVC`, nothing is restored. A
release with the PICO9918 as the console takes 213,242 T-states at 80 columns
and 145,685 with the console elsewhere. Warm boot makes the same call
(`src/boot.asm:74`).

**23 TONE.** Makes a square wave on port `01h` bit 7, with bit 6 held high,
for `DE` half cycles, each of 16 × `B` + 51 T-states
(`src/hwsvc.asm:179-196`). `B` = 0 counts as 256. `DE` = 0 returns at once. A
call takes `DE` half cycles plus 229 T-states. The speaker ends off. Status is
always 0.

| Instructions | T-states |
| --- | ---: |
| `XOR $80`, `OUT (DIGPORT),A`, `LD C,B` | 22 |
| `DEC C`, `JR NZ` for `B` rounds, the last not taken | 16 × `B` − 5 |
| `DEC DE`, `LD C,A`, `LD A,D`, `OR E`, `LD A,C` | 22 |
| `JR NZ`, taken | 12 |

The last half cycle takes 5 T-states less, measured between the two writes
that bound it.

**24 JOY.** Returns the joystick in `B`, 1 for each active line, read from
port `FEh` with `BC` = `F7FEh` and complemented (`src/hwsvc.asm:199-203`).
Status is always 0. 221 T-states. That port address also selects row 3 of the
matrix keyboard, so a key in that row sets a bit here, and a line here reads
as a key in that row. The diagnostics ROM's test labels the bits, after MON-3:
`01h` up, `02h` down, `04h` left, `08h` right, `10h` fire 2, `20h` pin 9,
`40h` fire 1 and `80h` fire 3 (`diag/interact.asm:556`). These labels are
unconfirmed.

**25 KEYS.** Reads the matrix keyboard's eight rows into the eight bytes at
`HL`, row 0 first, 1 for each key down (`src/hwsvc.asm:205-212`). Each read is
of port `FEh` with one bit low in the high byte of the address, `FEh` for row
0 to `7Fh` for row 7. Status is always 0. 588 T-states. `HWBMTX` reports
whether there is a matrix keyboard.

**26 PUTAT.** On a video console, writes `B` characters from `HL` at row `D`,
column `E`, both from 0, through the driver's cell routine
(`src/hwsvc.asm:214-256`). The cursor's position is unchanged, though its cell
is removed. The console draws it again when it next waits for a key
(`src/console.asm:158`). The escape parser isn't used, and bytes `80h` to
`FFh` reach the driver, which draws them as reverse images of `00h` to `7Fh`
(`drivers/pico.asm:16`, `drivers/glcd.asm:336`).

Text is clipped at the right edge. A row past the bottom writes nothing and
returns status 0, and so does a count of 0, which also leaves the cursor
alone. Status 2 means the console is the serial terminal, or the PICO9918 is
claimed and is the console (`src/term.asm:533-544`). A claim doesn't stop
`PUTAT` on the graphics LCD. The stack is 22 bytes on the graphics LCD and 16
on `PICO.SVC` with a cursor to remove, and 18 and 12 with none. A cell along a
row takes about 423 T-states on `PICO.SVC` at 80 columns and about 35,100 on
`GLCD.SVC`.

**27 RTC.** With `B` = 0, reads the DS1302 into the seven bytes at `HL`. With
`B` not 0, sets it from them (`src/hwsvc.asm:258-289`). The bytes are BCD:
seconds, minutes, hours, date, month, weekday, year. Status 2 if no clock
answers. A read takes 6,925 T-states and a set 7,759. A set turns off the
chip's write protect first and writes 0 to its control byte last.

## ABIVOL, mount and describe

`CALL ABIVOL` with the operation in `A` (`src/vol.asm:578-604`):

| `A` | Takes | Effect |
| ---: | --- | --- |
| 0 | `C` = drive, `E` = container index | Mounts that volume on the drive, in place of any volume there |
| 1 | `C` = drive | Unmounts the drive |
| 2 | `E` = container index, `HL` → 32 bytes | Copies the volume's descriptor there, with its byte 14 the drive it is on now, or `FFh` for none |

Drives count from 0 for A. Appendix E gives the descriptor's fields. The call
returns `A` = 0, or `A` = `FFh` with nothing changed: for an index past the
table, a drive past D, a volume already on a drive, a drive with no slot or a
slot too small for the volume, an attempt to leave drive A empty, a failed
write of the cache or any other value of `A`. A format 1.0 card gives a slot
only to the drives mounted at cold boot. A program tests `A`, since the flags
mean nothing on the failure.

A mount or an unmount writes the cache's changes for the card first and resets
the drive by BDOS function 37 (`src/vol.asm:621`, `src/vol.asm:658`,
`src/vol.asm:662-672`), so that the next access logs it in from its directory.
A mount or an unmount therefore can't be called from inside a BDOS call,
unlike the hardware services. The call changes `BC`, `DE` and `HL`, and on the
model a mount or a describe also changed `IX`. The most stack measured was 22
bytes, for a mount or an unmount with a dirty cache line to write.

## ABIGLCD, a display driver's table

A display driver calls this from its `INIT` with `A` = 1 for `CRT:` or 3 for
`UC1:` and `HL` pointing at its table (`src/glcd.asm:5-11`). The table is
eight words: six routines the terminal calls, a routine for the page functions
and a last word holding the columns and then the rows. The six, in order, are
put, get, clear to the end of the line, restore, read a row and write a row.
Only `CRT:` calls the seventh, which may be 0 elsewhere
(`src/video.asm:37-45`, `drivers/glcd.asm:26`).

On success `HL` returns `LINEBUF`'s address, where the row routines read and
write a row, with carry clear. Carry set means nothing changed: that mode has
a table already, or there is no matrix keyboard.

`HL` = 0 drops the mode's table, with carry clear, and the console is chosen
again at its next call (`src/glcd.asm:34-48`). Each `REMOVE` calls it that
way. `A`, `DE` and `HL` are changed, `BC` is kept and no stack is used beyond
the return address.

## ABISVC, the registry

`ABISVC` finds the records that services have published
(`src/svc.asm:435-498`).

| `C` | Takes | Returns |
| ---: | --- | --- |
| 0, find | `DE` → a record's name, 8 bytes padded with spaces; `B` = the least interface version | Carry clear: `HL` = the record's table, `A` = the generation. Carry set: none |
| 1, enumerate | `B` = an index from 0, newest first | Carry clear: `HL` = that record, `A` = the generation. Carry set: past the last |
| anything else | | Carry set |

A record is 13 bytes: a link word, the 8-byte name, a version byte and the
address of its table (`src/svc.asm:23`). Find takes the newest record whose
name matches and whose version is at least `B`. Each walk stops after 256
records. Find takes 6 bytes of stack below its return address, and enumerate
none. `AF`, `BC`, `DE` and `HL` are changed. `IX` and `IY` are kept. The call
can be made on any stack, since it makes no BDOS or BIOS call.

The generation is `SVCGEN`, raised by each removal (`src/ram.asm:236`). It is
8 bits, so after 256 removals it repeats. A program can keep a record's
address until it exits, since no service can be removed while the program
runs. A service that looks a record up later compares the generation or names
the record as a dependency, as Chapter 10 describes.

`PICO.SVC` publishes one record, `PICO`, version 2, at each width
(`drivers/pico.asm:35-41`). Its table is the eight words above, followed by
four more:

| Offset | `abi.inc` | Takes | Effect |
| ---: | --- | --- | --- |
| 16 | `PICOREG` | `B` = register, `A` = value | Writes the register |
| 18 | `PICOFIL` | `HL` = VRAM address, `DE` = count, `A` = value | Fills VRAM |
| 20 | `PICOWR` | `HL` = VRAM address, `DE` = source, `BC` = count | Copies RAM to VRAM |
| 22 | `PICORD` | `HL` = VRAM address, `DE` = destination, `BC` = count | Copies VRAM to RAM |

The caller must hold the claim. Each entry checks nothing and changes `AF`,
`BC`, `DE` and `HL` (`src/abi.inc:48-54`). A count of 0 moves nothing
(`drivers/pico.asm:164-199`).
