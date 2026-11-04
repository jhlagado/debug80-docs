---
title: The hardware services and the service loader
parent: TEC-OS
nav_order: 20
nav_group: "Part II: Inside TEC-OS"
---

# 20. The hardware services and the service loader

Checked against TEC-OS 58d4345, with the starter card's `TAS.COM` from Thorium
dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

Chapters 9 and 10 use the ROM's numbered services and its service loader from a
program's side. This chapter describes the code behind them: the dispatcher at
`ABICALL`, each of the nine hardware services and the font, a service's entry, the
relocation of its addresses, the seven steps of its load, the registry, removal,
the restart vectors and the stack figures the loader enforces. Appendix H lists
the `.SVC` file's format, and Chapter 21 describes the path of a display line
after the load.

## The dispatcher

`ABICALL`, at `C008h`, is a `JP` to `SVCDSP` (`src/abi.asm:10`). It is the last
of the table's 8 bytes, after the signature `TNA` and the major and minor
versions, 5 and 1 (`src/abi.asm:7-10`). A program calls it with the service
number in `C` and its arguments in `B`, `DE` and `HL`, and `A` is never an
argument (`src/abi.inc:15-16`). The dispatcher therefore has `A` and the flags
to work with until it has saved what it needs.

The services are numbered from 0 to 15, and `TNCOUNT`, 16, is their count
(`src/abi.inc:28-93`). The range test is one comparison, `CP TNCOUNT`, on a copy
of the number in `A`. The `LD A,TNEBAD` that follows leaves the flags alone, so
a number of 16 or more leaves through `HWERR` with status 1 and carry set, and
with `B`, `DE` and `HL` unchanged (`src/services.asm:21-24`,
`src/services.asm:40-42`).

The lookup needs a register pair, and all three carry arguments, so `SVCDSP`
pushes `HL` and `DE` and doubles the number into `DE`. It adds that to `SVTAB`,
the table of 16 routine addresses, 32 bytes in the ROM's data block
(`src/services.asm:25-32`, `src/tables.asm:77-84`). The routine's address goes to
`HL` and the caller's `DE` comes back. Two instructions finish the job:
`EX (SP),HL` swaps the routine's address with the saved `HL` on the stack, and
`RET` jumps to it (`src/services.asm:33-39`). The routine starts with every
argument in place and the dispatcher's two words gone from the stack.

The two exits are `HWERR`, which sets carry over the status in `A`, and `HWOK`,
whose `XOR A` gives status 0 with zero set and carry clear
(`src/services.asm:40-44`). Every service keeps `IX`, `IY` and the alternate
registers, except `MOUNT`, `UNMNT` and `DESC`, which may change `IX` and the
alternates (`src/abi.inc:18-21`).

## The routines

Services 0 to 8 are the hardware services, in `src/services.asm`. The volume
services, 9 to 11, are in `src/vol.asm` and Chapter 18 describes them. `DRVR`,
12, is `SVDRV`, also in `src/services.asm`. It takes `UC1:` alone, `B` = 3,
and refuses `B` = 1 with `TNEBAD`, since `CRT:`'s table is the ROM's own. For
`UC1:` it calls `VIDHOOK`, the display driver's hook in `src/video.asm`, which
Chapter 21 describes. `FIND` and `LIST`, 13 and 14, are the registry's, described below
(`src/services.asm:4-6`, `src/services.asm:320-331`, `src/tables.asm:77-84`).
`FONT`, 15, is `HWSFONT`, also in `src/services.asm`. It loads `HL` with the
address of `FONT`, the ROM's font, 96 characters of 8 bytes from `20h`, and
leaves through `HWOK` (`src/services.asm:315-318`, `src/abi.inc:89-92`).
`GLCD.SVC`'s `INIT` asks for it first. On a ROM before ABI 5.1 the number is
past the table, the call returns carry and `INIT` fails with it
(`drivers/glcd.asm:34-37`).

The dispatcher, its exits, the nine hardware routines and `HWSFONT` are 480
bytes of the ROM's code, by the symbol map of the build:

| Number | Name | Routine | Bytes |
| ---: | --- | --- | ---: |
| | dispatcher, exits | `SVCDSP` | 30 |
| 0 | `INFO` | `HWSINFO` | 17 |
| 1 | `DIGIT` | `HWSDIG` | 26 |
| 2 | `LCD` | `HWSLCD` | 44 |
| 3 | `VIDEO` | `HWSVID` | 89 |
| 4 | `TONE` | `HWSTONE` | 29 |
| 5 | `JOY` | `HWSJOY` | 10 |
| 6 | `KEYS` | `HWSKEYS` | 15 |
| 7 | `PUTAT` | `HWSPUT` | 68 |
| 8 | `RTC` | `HWSRTC`, with its clock routines | 146 |
| 15 | `FONT` | `HWSFONT` | 6 |

`INFO` reads no device. `B` is the byte `CONDEV`, the devices found at cold
boot, with `VCLAIM` ORed in (`src/services.asm:49-53`). Bit 3 of `CONDEV`,
`CDRTC`, is set once at cold boot, when `RTCHAS` finds the clock
(`src/boot.asm:44-47`, `src/layout.asm:42`). `VCLAIM` holds `CDCLM`, which has
the value of `INFO`'s bit 4, while the chip is claimed (`src/ram.asm:66`,
`src/layout.asm:43`). `DE` is `ROMVER`, and one 16-bit load from `VWID` gets
`L` and `H` (`src/services.asm:54-56`), because the columns and rows are adjacent
bytes at `BFEAh` and `BFEBh`, at the workspace's end (`src/ram.asm:253-254`).

`DIGIT` walks one set bit in `C` from `20h` down, one bit for each digit, and
stops when `SRL C` empties the register (`src/services.asm:59`,
`src/services.asm:70-71`). For each digit it writes the pattern to `SEGPORT` and
the select bit with `TXIDLE` to `DIGPORT`. It then waits through 256 rounds of
`DJNZ` and writes `TXIDLE` alone (`src/services.asm:60-68`). Each write to port
`01h` carries bit 6, so the serial line stays high.

`LCD` tests the row before it does anything, then clears `CDWRD` for row 3, as
Chapter 21 explains (`src/services.asm:74-83`). `LCDROWS` gives the row's
display address, and then 20 characters go out, each after `LCDWAIT`
(`src/services.asm:84-96`, `src/tables.asm:36`).

`VIDEO` refuses any `B` but 0 and 1 with `TNEBAD`, before anything changes
(`src/services.asm:104-107`). It then returns status 2 unless `CDTMS` is set, the
bit of `CONDEV` that records a PICO9918 answering at cold boot
(`src/services.asm:108-111`, `src/layout.asm:40`). A claim hides the cursor if the PICO9918 is the console,
and stores `CDCLM` in `VCLAIM` (`src/services.asm:115-120`). The console tests
that byte and `CONMOD` through `VTOWN`, so a claim stops it only while the
PICO9918 is the console (`src/term.asm:533-544`).

A release with no claim returns at once. A real release clears the byte and
then needs the console's driver to restore the chip. `PIVEC` holds the table of
the ROM's PICO9918 console, `PIBLK`, which `PISTART` sets at cold boot when the
PICO9918 and the matrix keyboard both answer (`src/pico.asm:30-39`,
`src/ram.asm:221`). With 0 there the routine returns and the chip stays as the
program left it (`src/services.asm:121-129`). Otherwise it reads the word at offset 6, the
table's fourth entry, `VREST`, and calls it through `VHLJP`
(`src/services.asm:130-136`, `src/video.asm:20`). If the PICO9918 is the console,
it also clears the screen and homes the cursor (`src/services.asm:137-144`). Warm
boot calls `HWVREL` directly, which is why a program's claim doesn't outlive
it. The call comes first, before `PZINIT` rebuilds page zero, so the chip's
interrupt, an NMI on the board, is off by then (`src/boot.asm:86-87`).

`TONE` toggles bit 7 of `A`, which starts as `TXIDLE`, and writes it to port
`01h` (`src/services.asm:152-154`). The inner loop counts `B` with `C`, and `A`
then holds the output while `C` is borrowed to test `DE` for zero
(`src/services.asm:155-163`). Counted from the instructions, a half cycle is 16 ×
`B` + 51 T-states, as Chapter 9's measurements show (`src/services.asm:147-148`).
`B` = 0 reaches `DEC C` with 0 and goes round 256 times. The routine ends with
`TXIDLE`, so the speaker stops low
(`src/services.asm:164-165`).

`JOY` and `KEYS` read the same port. `IN A,(C)` puts `B` on the top address
lines. `HWSKEYS` starts with `BC` = `FEFEh` and rotates `B` left, so one
address line is low at a time (`src/services.asm:175-180`). `RLC B` moves the old
top bit into carry. After the eighth read that bit is the 0, so the loop stops
at 8 rows (`src/services.asm:180-181`). `HWSJOY` makes one read with `BC` =
`F7FEh`, the fourth value of `HWSKEYS`'s `B`, which is why the joystick shares
row 3 (`src/services.asm:169-170`). Both complement the byte, so a key down reads
1.

`PUTAT` needs a video console the program hasn't claimed, so it has two tests
at its head, and either failure gives status 2. `VTOWN` gives nonzero for a
claimed console, and `RRCA` on `CONMOD` puts bit 0 in carry, which is set for
`CMCRT` and `CMUC1` and clear for the other two modes
(`src/services.asm:188-194`). A count of 0 returns before anything changes
(`src/services.asm:195-197`). The cursor comes off, and a row past `VHGT` leaves
with status 0 (`src/services.asm:201-208`). The loop then clips each cell against
`VWID` and calls `VPUT`, the driver's routine, with `A`, `B` and `C` as the
driver takes them (`src/services.asm:209-225`). `VPUT` jumps through the driver's
table (`src/video.asm:13`). `PUTAT` is the deepest hardware service, and
`abi.inc` gives 22 bytes as the bound on its stack, the dispatcher's included
(`src/abi.inc:24-25`, `src/abi.inc:47-52`).

`RTC` refuses any `B` but 0 and 1 with `TNEBAD`, the clock untouched
(`src/services.asm:230-233`). It then tests for the clock with `RTCHAS`, which
reads the seconds register. It counts any value below `60h` as an answer, on
the ground that a seconds register holds BCD (`src/services.asm:266-277`). `RTCCMD` raises the enable bit, and `RTCWR`
clocks a byte out least significant bit first (`src/services.asm:286-299`).
`HWSRTC` uses the DS1302's burst modes, command `BFh` to read and `BEh` to
write. A write first clears write protect with `RTCPUT`, and its burst carries
the 7 bytes and then the control byte, 0 (`src/services.asm:242-260`).

None of these routines calls the BDOS, and their one byte of state, `VCLAIM`,
is in the workspace (`src/abi.inc:21-23`, `src/services.asm:6-7`).

## From the command to the loader

A command whose type is `SVC` calls `SVCGO`, as Chapter 17 explains
(`src/cpm/ccp.asm:268-276`). `SVCGO` clears `SVCRC` and calls `LOADCOM`, the
routine that reads a `.COM` file to `0100h`. The file is then in the TPA, up to
the page of the word at `0006h`, and `LOADTOP` gives its end (`src/loader.asm:452-455`,
`src/cpm/ccp.asm:396-408`, `src/ram.asm:233`). `SVCGO` then calls `SVCLOAD`
(`src/loader.asm:456`). Chapter 21 describes what the console does after a good
load.

`SVCLOAD` works on the file at `DF`, `0100h`, where the header's fields have
the offsets in Chapter 10's table and Appendix H (`src/loader.asm:11-24`). It reports through
carry and `SVCRC` (`src/loader.asm:74-76`), and it keeps the `A` that `INIT`
returns in `SVCRA`, beside `SVCRC` (`src/loader.asm:216-218`,
`src/ram.asm:240-241`). The CCP treats a carry as a name with a question mark,
except for one case in a line from `STARTUP.CMD`, which Chapter 21 describes.

## A service's entry

The word at `0006h` has two jobs in CP/M. It is the target of the `JP` at `0005h`,
so every BDOS call passes through it. It is also the top of the TPA, so a program
sizes its memory from it. A program may also set `SP` from the word and fill
memory up to it. The starter card's `TAS.COM` sets its stack this way, with `LD
HL,($0006)` and `LD SP,HL` at `010Dh`. A service takes the pages just below the top of
the TPA and its first byte becomes the new top, so it has to hold a BDOS entry at
that address and keep everything it needs at or above it. A BDOS call should also cost the same however
many services are in.

Relocation adds a page number to the high byte of each address, so a service
starts on a page boundary. With a service in, the word holds `xx00h`, the page's
start. Offset 0 of the page holds `JP BENTRY`, a jump straight into the
ROM (`src/loader.asm:203-206`, `test/svc.test.mjs:159`). Offset 0 is the service's
lowest byte, so nothing the service needs lies below the word, and a stack set
from the word grows away from it (`test/svc.test.mjs:831`). The loader puts no
service on the path of a BDOS call, so each `JP` can go straight to `BENTRY`. A BDOS call is therefore
always two jumps, the one at `0005h` and the one at the word, with none, one or
two services in (`test/svc.test.mjs:866`).

With no service in, the word holds the address of the BDOS entry jump, the *stub*,
and `STUBAD` keeps that address. `ALVINIT` puts the stub directly below the lowest
allocation vector, so the TPA keeps every byte up to the vectors
(`src/boot.asm:418-422`). On the starter card the vectors start at `B9A7h` and the
stub is at `B9A4h`. Its low byte varies with the card, so a program assumes
nothing of it. `PZINIT` writes the stub's three bytes at every
warm boot (`src/boot.asm:214-219`).

The loader takes its pages below the page of the top (`src/loader.asm:100-102`), so
the first service also costs the bytes from the start of the stub's page up to
the stub. On the starter card those are the 164 bytes from `B900h` to `B9A3h`, and
`COUNT.SVC`'s one page lowers the TPA by 420 bytes. A later service's top is a
page's start, so it costs its pages and nothing more.

The file's header has the layout in Chapter 10's table and Appendix H. In memory the loader has
written over some of its fields, and a loaded service's header holds:

| Offset | Bytes | In memory |
| ---: | ---: | --- |
| 0 | 3 | `JP BENTRY` |
| 3 | 1 | The flags, or 0 if a hook kept the pages |
| 4 | 2 | `REMOVE`, from the header's start |
| 6 | 2 | The registry's head before this service |
| 8 | 1 | The owner before it: the next older service's page, 0 at the last |
| 9 | 3 | Unused |
| 12 | 3 | Each stack's room left below this service |
| 15 | 2 | Unused |
| 17 | 8 | The name |

A header holds no copy of the old top. `SVCABV` turns an owner into the page above a
service, taking the stub's page when the owner is 0 (`src/loader.asm:330-335`).
`SLTOP` rebuilds the top in the same way when a service goes
(`src/loader.asm:28-38`).

## Relocation by pages

A service's page depends on the services already in, so its code is made for
one address and moved at load time. The move is by whole pages of 256 bytes.
When code made for page 0 is placed at page `p`, the low byte of every address
in it stays the same and the high byte rises by `p`. The loader therefore needs
only the positions of the high bytes of addresses, the *fixups*, and it adds the
same page to each.

On a PC the repository's `makeSvc` finds the fixups by assembling the source
twice (`tools/lib/svc.mjs:83`). `assembleAt` assembles a copy of the source with
its `ORG $0100` line changed to another origin (`tools/lib/prl.mjs:37-48`). That
line has to be indented, with nothing after it (`tools/lib/prl.mjs:34`).
`makeSvc` assembles at `0000h` and at `0100h` and keeps the first assembly,
made for page 0, with the 25-byte header at its start
(`tools/lib/svc.mjs:99-110`). It stops with `INIT and REMOVE required` for a
source with no `INIT` or `REMOVE` (`tools/lib/svc.mjs:101`), and it rejects a
source that names a ROM address, since only `abi.inc`'s names may reach the ROM
(`tools/lib/svc.mjs:19-26`, `tools/lib/svc.mjs:85`).

A byte that is the same in the two assemblies is left alone. It is no part of
an address of the service's own, or it is the low byte of one, which a move by
whole pages doesn't change. A byte that is one greater in the second assembly
is the high byte of an address. Any other difference stops `makeSvc` with
`byte N is not relocatable`, and so does a difference inside the header, since
the relocation data can mark only bytes of the image
(`tools/lib/svc.mjs:67-76`). Such a difference comes from an expression the
page rule can't relocate, such as half an address or twice one. An absolute
address outside the service, such as `0005h`, is the same in both assemblies
and is never marked, so a `CALL 0005h` stays a call to the BDOS wherever the
code is put.

Each fixup is counted from the end of the header, so fixup 0 is the image's
first byte. `makeSvc` writes the fixups as a list of gaps after the image and
the dependencies (`tools/lib/svc.mjs:39-49`, `tools/lib/svc.mjs:107-110`).
Each byte of the list is the distance from one fixup to the next, the first
counted from the byte before the image, and 255 moves on with nothing fixed.
Appendix H lists the file's header, its dependencies and the gap list byte by
byte. `TAS` writes a `.SVC` file on the card with the same fields, as Chapter 10
shows.

## The seven steps

Before the move in step 5 a load changes only the file and the loader's own
variables, so a failure before it leaves the rest of memory as it
was (`src/loader.asm:74-76`). The write of `PZTOP` in step 7 is the commit: until
then a warm boot gives the pages back, as step 6 describes.

### 1. The file's checks

`SVCLOAD` zeroes `SVCRC` and tests `SVCBSY`, which is `80h` while an `INIT` or
`REMOVE` runs (`src/loader.asm:77-81`, `src/ram.asm:236`). It compares the first
two bytes with `DMAGIC`, the letter `D` and the format, `SVCFMT` from
`abi.inc`, which is 4 (`src/loader.asm:11`, `src/abi.inc:103`,
`src/loader.asm:82-85`). A file of another format fails here. `SVCEXT` checks
that the size at offset 6 lies within the records read (`src/loader.asm:86-89`, `src/loader.asm:346-352`). `SVCIN` checks that
`INIT` and `REMOVE` each lie between the header and the image's end
(`src/loader.asm:90-95`, `src/loader.asm:355-361`).

The page comes next. The loader adds the extra memory named at offset 8 to the
size of the header and image, subtracts one and takes the high byte, which is
the number of pages less one. The service's page is the page of `PZTOP`, less
one, less that number. An overflow, a borrow or a page below `80h` fails the
load, and the page goes in `SLDL` (`src/loader.asm:96-106`, `src/ram.asm:235`).
For `COUNT.SVC` on the serial board, with the top at `B9A4h` and 100 bytes, the
page is `B8h`.

### 2. The dependencies

The dependencies follow the image, and `HL` walks them with a count from
offset 2 (`src/loader.asm:107-112`). Each must lie within the records read, and
`REGFIND`, described below, looks up its 8-byte name with its least version in
`C` (`src/loader.asm:115-123`). `EX (SP),HL` keeps the next entry's address on the
stack across the lookup (`src/loader.asm:117`). A missing record ends the load
(`src/loader.asm:124-126`).

### 3. The stacks

The relocation data must lie within the records read too
(`src/loader.asm:130-133`). A service's code runs on its caller's stack, as the
section on the stack figures describes, so each load has to fit its figures
into the room left. `HL` then points at that room on the three stacks: `SVCLIM`
with no service in, and otherwise offset 12 of
the newest service's header (`src/loader.asm:134-139`). The loop takes each
figure in the new header from that room and fails on a borrow, and it stores
the difference over the figure in the new header (`src/loader.asm:140-150`). The
header in memory then holds the room left below this service, and the loader
keeps no other total. On the serial board, with limits 8, 12 and 6,
`COUNT.SVC`'s figures of 2 each leave `06h`, `0Ah` and `04h` at `B80Ch`.

### 4. The relocation

The pass works on the file where `LOADCOM` read it, at `0100h`, before the move
(`src/loader.asm:153-181`). `BC` counts the bytes of the list, and `HL` starts at
`DF+DHLEN-1`, `0118h`, the byte before the image (`src/loader.asm:155-156`). For
each byte the loader:

1. adds the gap to `HL` (`src/loader.asm:160-166`)
2. checks that `HL` is still inside the header and image, below `0100h` plus
   the size at offset 6, and fails the load if not (`src/loader.asm:167-175`)
3. if the gap was 255, goes on to the next byte with nothing fixed
   (`src/loader.asm:176-177`)
4. otherwise adds `SLDL` to the byte at `HL` (`src/loader.asm:178-181`).

The check in step 2 is made for a gap of 255 too, so a list can't step past the
image even with nothing fixed. A failure here leaves the file at `0100h` partly
relocated and the rest of memory as it was.

On a board with the GLCD the starter card's startup file installs `GLCD.SVC`
at `B600h`. Its image starts with the table of words the driver passes to the
ROM's terminal, `00F0h`, `014Bh`, `0150h` and so on in the file. After the load
they read `B6F0h`, `B74Bh` and `B750h` at `B619h`, each high byte raised by
`B6h`. `SERVICES` prints each page count as the page above the service less the
service's own page (`src/cpm/ccp.asm:1554-1561`), so the count includes the part of
the last page the service doesn't fill. `GLCD.SVC`'s 765 bytes of header and
image take three pages, and with the 164 bytes below the stub they lower the TPA
from 47,268 bytes to 46,336. On a board with the PICO9918 as well, the service
loads and gives way to the ROM's console, as Chapter 21 describes, and
`SERVICES` lists it all the same:

<!-- node tools/capture.mjs --board pico SERVICES -->
```text
A>SERVICES
GLCD 3
A>
```

A list whose first gap is 0 adds the page to header byte 24, the name's last. `makeSvc` never writes such a list, since
its first gap counts from the byte before the image to a fixup at offset 0 or
later (`tools/lib/svc.mjs:39-46`), and the loader doesn't test for one. This
file is `COUNT.SVC` from Chapter 10 with a 0 put at the front of its list:

```sh
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const f = readFileSync("COUNT.SVC");
const out = Buffer.concat([f.subarray(0, 100), Buffer.from([0]), f.subarray(100)]);
out[10] += 1;
writeFileSync("GAPZERO.SVC", out);
'
node tools/tecvol.mjs put svc.img B GAPZERO.SVC
```

<!-- node tools/capture.mjs --card svc.img B: GAPZERO.SVC SERVICES -->
```text
A>B:
B>GAPZERO.SVC

B>SERVICES
COUNTX 1
B>
```

The space at byte 24 has become `20h` + `B8h`, `D8h`, and `PUTTRIM` masks bit
7 (`src/cpm/ccp.asm:739-741`), so the name prints with an `X`.

### 5. The claims and the move

`SVCMOV` reads the flags first. For each of bits 1 to 7 that is set it reads the
first byte of that restart vector, and a `JP` there fails the load, with carry,
`SVCRC` at 0 and nothing changed but the file (`src/loader.asm:183-196`). The section
on restart vectors gives the reason.

The size at offset 6 goes on the stack, since the resident fields are about to
overwrite it. `LDIR` copies `REGHEAD` and `SVCHEAD`, 3 bytes, to offset 6, and
`JP BENTRY` goes in at offset 0 (`src/loader.asm:197-207`). A second `LDIR` moves the
header and image to the page, and the word at `0006h` becomes the page's start, with
the 0 that `LDIR` leaves in `B` as its low byte (`src/loader.asm:208-215`). `PZTOP`,
the word that warm boot puts at `0006h`, isn't written (`src/ram.asm:231`).
`SVCBND` reads the owner at offset 8 for the loader's bounds, the page above this
service's last (`src/loader.asm:322-335`).

### 6. INIT

`SVCCALL` sets `SVCBSY`, reads the 2-byte offset at `HL`, adds the page to its
high byte and jumps (`src/loader.asm:216-217`, `src/loader.asm:311-319`). The header
is on a page boundary, so no 16-bit addition is needed. `INIT` returns to the
instruction after the call, on the CCP's stack (`src/cpm/ccp.asm:275`).

A warm boot during `INIT` leaves the word at `0006h` correct, because `PZTOP` is
untouched. `PZINIT` writes `PZTOP` to `0006h` (`src/boot.asm:212-213`), and warm
boot clears `SVCBSY` (`src/boot.asm:88-89`). The pages go back as if the load
had never started, and `test/svc.test.mjs:428-441` checks that a later load
works. Function 47 from `INIT` is a warm boot at the same point
(`test/svc.test.mjs:890`). The sweep in `PZINIT` takes any restart vector `INIT`
has pointed into its pages, since the new pages lie below `PZTOP` (`test/svc.test.mjs:792`).
A hook already in the table then points into the TPA, which is
why hooks go last (`test/svc.test.mjs:457-464`). A reset during a hung `INIT` is
recognised all the same, because `RSLCAP` doesn't compare the word at `0006h`
with `PZTOP` (`src/boot.asm:104-105`).

### 7. The records and the commit

`SVCBND` loads `D` with the service's page and `E` with the page above its last,
and carry from `INIT` goes to the failure path (`src/loader.asm:219-220`,
`src/loader.asm:322-328`). With `HL` at the first record, the walk checks each
record's first byte, then its last, then the high byte of its table address.
Each check uses `SVCCK` against `D` and `E` (`src/loader.asm:223-242`,
`src/loader.asm:338-343`). Since `SVCCK` compares pages, a record can't cross out
of the service and a link can't leave it. `B` starts at 0, so `DJNZ` allows 255
records, and a list of 256, or one that loops, ends the walk (`src/loader.asm:222`,
`src/loader.asm:243`, `test/svc.test.mjs:256`).

With the walk done, `SVCLK` writes the first record's address to `REGHEAD`, the
head of the registry. It writes the old head into the last record's link, which
`SLN` has held (`src/loader.asm:273-282`, `src/ram.asm:234`). A service's records
thus join the front of the list as one chain, and a service with none leaves the
list alone (`src/loader.asm:274-276`). `SVCCOM` sets `SVCHEAD`, the lowest
service's page, to this page and writes `PZTOP`, and that write is the commit
(`src/loader.asm:283-287`, `src/ram.asm:238`). `SVCSHUT` clears `SVCBSY`, and a
final `CP 1` and `CCF` turn `SVCRC` into the carry (`src/loader.asm:288-294`).

## A failed load

Until the move nothing but the file has changed, and each failure returns carry
with `SVCRC` at 0. After the move there are three outcomes, and the labels
`SVCSCAN`, `SVCRF` and `SVCKEEP` separate them.

| `SVCRC` | Case | State after |
| ---: | --- | --- |
| 0 | Rejected before the move | As it was |
| 1 | `INIT` or a record failed, nothing left behind | As it was; `0006h` put back and the vectors swept |
| 2 | A hook left behind, or `REMOVE` rejected the undo | Pages kept |

A carry from `INIT` goes straight to `SVCSCAN`, since a failed `INIT` has undone
its own work (`src/loader.asm:219-220`). A record that fails its check goes to
`SVCRF`, which calls `REMOVE` to undo a good `INIT` (`src/loader.asm:244-247`). If
`REMOVE` fails, `SVCKEEP` records 2 and commits with the pages kept and no
record linked (`src/loader.asm:248-249`, `src/loader.asm:270-272`,
`test/svc.test.mjs:396`).

A failed load may have left a hook in the RAM BIOS table, and the service's
pages can't go while one points at them. So `SVCSCAN` tests the high byte of
each of the 17 targets in the table against the service's pages
(`src/loader.asm:251-259`, `src/layout.asm:60`). With no hit, `SVCFRE` clears the
first byte of each restart vector the flags claim, and the word at `0006h` goes
back to `PZTOP`. `PZSWP` then gives those vectors their defaults and takes any
other vector into the pages, and the result is 1 (`src/loader.asm:260-266`,
`src/loader.asm:296-308`). A hit writes
0 over the flags, so `UNLOAD` will reject the service, and it goes to
`SVCKEEP` (`src/loader.asm:267-272`). A hook left in the table then points at
pages the service still holds, and `test/svc.test.mjs:382-394` shows them
surviving a warm boot. The scan reads only that table, so the tables that `DRVR`
records for the display modes are beyond it (`test/svc.test.mjs:531`).

A service kept this way appears in `SERVICES`, because `CMDSVC` walks the owner
list from `SVCHEAD`, not the registry (`src/cpm/ccp.asm:1545-1567`). Each header's
offset 8 is the next older service's page, 0 at the end.

## The registry

A client reaches the registry through two numbered services, `FIND`, 13, and
`LIST`, 14, whose routines are `SVFND` and `SVLST` (`src/abi.inc:80-88`,
`src/tables.asm:83-84`). `FIND` takes the name at `DE` and the least version
in `B`. `SVFND` moves `B` to `C`, clears `B` and goes to `REGFIND`. `LIST`
takes an index in `B`, and `SVLST` moves it to `C` (`src/loader.asm:363-369`).

`LIST` walks from `REGHEAD`, counting `C` down, and returns the record with
the generation in `A` (`src/loader.asm:369-382`, `src/loader.asm:413-415`).
`REGFIND` compares 8 bytes at offset 2 and tests the version at offset 10 with
`CP C`. On a match it returns the table's address from offset 11
(`src/loader.asm:385-415`). Newer records are at the front of the list, so a find
reaches the newest of a name first, and a removal uncovers the older
(`test/svc.test.mjs:495`). On a board where the ROM's PICO9918 console started,
`PISTART` writes its record, `PIREC`, to `REGHEAD` at cold boot, before any
service loads, so that record is the list's last and no removal reaches it
(`src/pico.asm:40-41`).

A program can make the list into a cycle, so the walk has a limit. `B` is 0 at
`REGF1`, so `DJNZ` allows 256 rounds, and such a list can't hold the caller
(`src/loader.asm:423-425`, `test/svc.test.mjs:539`). That walk uses at most 8
bytes of the caller's stack, three `PUSH`es and the return address
(`src/loader.asm:390-392`). `abi.inc` gives 8 bytes as the bound for each of the
two, the dispatcher's included (`src/abi.inc:80-88`). The registry has no service for
removal. Number 15, one past `LIST`, returns carry from the dispatcher, and the
service stays found (`test/svc.test.mjs:342`).

A record is visible to a client only once `SVCLK` has linked it, so a service
can't find its own record during `INIT` (`test/svc.test.mjs:420`).

## Removal

Only the lowest service can go, and that rule keeps true the three bytes each
header saves, the registry's head and the lowest service's page. Each header
holds that state from before its own load, and the states are
stacked in memory in the order of the loads.

`UNLOAD` calls `SVCUNL` (`src/cpm/ccp.asm:1061-1063`), which rejects the
command while `SVCBSY` is set. It uses the 0 it read there as `L`, making `HL`
the base of the page in `PZTOP` (`src/loader.asm:44-48`). That page must equal
`SVCHEAD`, which is 0 with no service in, so the test then fails. Bit 0 of the
flags must also be set (`src/loader.asm:49-54`).

`SVCCALL` then runs `REMOVE`. `SVCSHUT` clears `SVCBSY` without touching the
flags, and carry from `REMOVE` returns with nothing changed
(`src/loader.asm:55-60`). Function 47 from `REMOVE` is a warm boot there, and the
service stays listed (`test/svc.test.mjs:899`). With no carry, `SVCFRE` writes 0
over the first byte of each restart vector the flags claim (`src/loader.asm:61-63`,
`src/loader.asm:296-308`).
`LDIR` copies the 3 bytes at offset 6 back to `REGHEAD` and
`SVCHEAD` (`src/loader.asm:64-67`), and this one copy removes all the service's
records, whatever their number. `DE` is left at `SVCGEN`, and the code raises it
by swapping registers for one `INC (HL)` (`src/loader.asm:68-70`,
`src/ram.asm:239`). `SLTOP` then sets `PZTOP` and `0006h` from the `SVCHEAD` just
restored, to that page's start, or to the stub if it is 0 (`src/loader.asm:71`,
`src/loader.asm:28-38`). `PZSWP` runs last and leaves carry clear, so `UNLOAD` reports
success (`src/loader.asm:72`).

A warm boot keeps all of this, since `REGHEAD`, `SVCHEAD` and `PZTOP` lie past
`BDOSRME`, the end of the range `CPMINIT` clears (`src/ram.asm:196-198`).
Chapter 21 describes that boundary. Cold boot clears the workspace, so a reset
empties both lists (`src/boot.asm:34-38`, `test/svc.test.mjs:349`).

## Restart vectors

A service that takes an interrupt or an `RST` needs its `JP` in page zero to last
through warm boots and to go when its pages go. A program's vector into the TPA
must go when the program ends, as Chapter 14 explains. One test separates the
cases, where the jump lands.

`PZSWP` walks the vectors from `0008h` to `003Fh`. A vector holding a `JP` whose
target is above `PZTOP`, compared as a word, keeps its three bytes and has its other
five cleared. That bound takes in the services, the workspace and the ROM. Any other
vector gets seven zeros and a `RET`, and if `0038h` holds no kept jump it gets `EI`
and `RETI` (`src/boot.asm:228-263`). `PZINIT` runs into `PZSWP` at cold boot and at
every warm boot. `UNLOAD` and a failed `INIT` call it once the top is back, so a
vector into freed pages then fails the bound (`src/loader.asm:71-72`,
`src/loader.asm:262-264`, `test/svc.test.mjs:769`, `test/svc.test.mjs:777`). A jump
to `PZTOP` itself goes, and so does one into the bytes of the stub's page below the
stub, which are the TPA's. A jump into a service's header past the lowest service's
first byte stays (`src/boot.asm:233-241`, `test/svc.test.mjs:731-756`). A reset clears page zero,
so a vector goes with its service then too (`test/svc.test.mjs:817`).

Two services can't share a vector, and `INIT` writes its own after the move, so the
loader needs the claim in the header. Flags bits 1 to 7 name `RST 1` to `RST 7`, the
vectors at `0008h` to `0038h`. Step 5 fails a load whose claimed vector holds a `JP`
(`test/svc.test.mjs:799`). The test reads one byte, so a jump into the ROM that a
finished program left there counts as held until a reset. The loader reads only the
flags, so a vector `INIT` writes with no claim goes unseen, as a vector in a table that `DRVR`
records does. `UNLOAD` and a failed `INIT` clear the first byte of each claimed vector
before the sweep, which gives it its default whatever it held
(`test/svc.test.mjs:757`, `test/svc.test.mjs:784`). A jump the
service set outside its pages in a vector it didn't claim passes the bound, so
`REMOVE` restores it. A failed `INIT` runs no `REMOVE`, so `INIT` restores it. `INIT`
also turns off any source of interrupts it started, because an interrupt left on under
the default `EI` and `RETI` repeats for ever. A warm boot inside `INIT` leaves that source
on.

Nothing in the ROM enables interrupts, as Chapter 14 describes. `WBOOTR` starts with
`DI`, so a kept `0038h` runs after a warm boot only once a program or a service sets
`EI` (`src/boot.asm:81`). A warm-boot hook can't do it, since a hook chains into
`WBOOTR`, whose first instruction is `DI`. Only code that runs later, such as a
program or a hooked BIOS entry, can.

## The stack figures

A service's code runs on its caller's stack (`drivers/glcd.asm:5`), and the ROM
reserves three stacks, of the sizes at `src/layout.asm:69-71`:

| Stack | Reserved | Base | Census | `SVCLIM` |
| --- | ---: | ---: | ---: | ---: |
| BDOS | 54 | 32 | 32 | 8 |
| BIOS | 40 | 18 | 18 | 12 |
| CCP | 32 | 18 | 18 | 6 |

The census column is the deepest use of each stack in `test/stacks.test.mjs`,
which records every write to memory under the heaviest workloads. The test
passes only with a quarter of each stack free (`test/stacks.test.mjs:246-247`).
Base is the same figure from the runs with no service in, on the serial
terminal, the PICO9918 and a volume written behind, at the diagnostic console,
through `CON PICO 40`, `32` and `80`, at a recognised reset and with chained
lines: 32, 18 and 18 (`test/stacks.test.mjs:253-255`). The BIOS's 18 is warm
boot's write of the lines written behind. Cold boot mounts and lists the drives
on the BDOS's stack, which nothing uses before the CCP runs, and the diagnostic
console runs there too (`src/boot.asm:54-57`, `src/boot.asm:429-431`). No run
goes deeper than the base, the runs with `GLCD.SVC` included, so the census and
the base are the same.

`SVCLIM` holds the limits, 8, 12 and 6 (`src/tables.asm:91`), and they are
counted from the base. Added to the base they give 40 of 54, 30 of 40 and 24 of
32, so each stack keeps at least a quarter free with its limit taken, as the
test checks (`test/stacks.test.mjs:254-258`). At this commit `GLCD.SVC` declares
2, 0 and 6 (`drivers/glcd.asm:18`), more than the runs show it using on the BDOS's
and the CCP's stacks. It takes the whole of the CCP's allowance, and
`COUNT.SVC` with its 2 can't then load. The ROM's PICO9918 console is no
service and declares nothing, since its use is in the base.

The loader can check only the sum of what the headers state.
`test/svc.test.mjs:690` shows the way to prove a figure: a stack watch on the
model, in which a service that declares 2 and uses 6 still loads.
