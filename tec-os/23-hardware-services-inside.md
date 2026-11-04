---
title: The hardware services in the ROM
parent: TEC-OS
nav_order: 23
nav_group: "Part II: Inside TEC-OS"
---

# 23. The hardware services in the ROM

<!-- Checked against TEC-OS 78127ec. -->

Behind `ABICALL` are a table of 16 routine addresses and 480 bytes of code.
The code is a dispatcher, the nine hardware services that
[Chapter 10](10-hardware-services.md) calls from a program and the font. This
chapter reads that code routine by routine. It ends on the rules the routines
share, which let any program call them from any stack.

## The table and the dispatcher

`ABICALL`, at `C008h`, is a `JP` to `SVCDSP` (`src/abi.asm:10`). It is the last
of the table's 8 bytes. Before it come the signature `TNA` and the major and
minor versions, 5 and 1 (`src/abi.asm:7-10`). A program calls it with the
service number in `C` and its arguments in `B`, `DE` and `HL`. `A` is never an
argument (`src/abi.inc:15-16`). The dispatcher therefore has `A` and the flags
to work with before it saves anything.

The services are numbered from 0 to 15, and `TNCOUNT`, 16, is their count
(`src/abi.inc:28-95`). The range test is one comparison, `CP TNCOUNT`, on a copy
of the number in `A`. The `LD A,TNEBAD` after it leaves the flags alone. A
number of 16 or more therefore leaves through `HWERR` with status 1 and carry
set, and `B`, `DE` and `HL` as they came (`src/services.asm:23-26`, `src/services.asm:45-47`).

The lookup needs a register pair, and all three carry arguments. So `SVCDSP`
pushes `HL` and `DE` and doubles the number into `DE`. It adds that to `SVTAB`,
the table of 16 routine addresses, 32 bytes in the ROM's data block
(`src/services.asm:27-34`, `src/tables.asm:82-89`). The routine's address goes to
`HL` and the caller's `DE` comes back. Two instructions finish the job.
`EX (SP),HL` swaps the routine's address with the saved `HL` on the stack, and
`RET` jumps to it (`src/services.asm:35-41`). The routine starts with every
argument in place and the dispatcher's two words gone from the stack.

The two exits are `HWERR` and `HWOK` (`src/services.asm:45-51`). `HWERR` sets
carry over the status in `A`. `HWOK`'s `XOR A` gives status 0 with zero set
and carry clear. Every service keeps `IX`, `IY` and the alternate registers.
The exceptions are `MOUNT`, `UNMNT` and `DESC`, which may change `IX` and the
alternates (`src/abi.inc:18-21`).

## The routines

Services 0 to 8 are the hardware services, in `src/services.asm`, and 15 is
the font. The volume services, 9 to 11, are in `src/vol.asm`, and
[Chapter 17](17-sd-card-and-volumes.md#the-volume-services) describes them.
`DRVR`, 12, is `SVDRV`, the entry through which a display driver passes its
table to the ROM (`src/services.asm:362-386`).
[Chapter 16](16-bios-and-console.md#the-displays-and-the-claim) describes the
table and what `SVDRV` rejects. `FIND` and `LIST`, 13 and 14, read the
registry. [Chapter 24](24-service-loader.md) describes them with it. The dispatcher, its exits, the nine hardware routines and the font's take 480
bytes of the ROM's code:

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
boot, with `VCLAIM` ORed in (`src/services.asm:56-60`). Bit 3 of `CONDEV`,
`CDRTC`, is set once at cold boot, when `RTCHAS` finds the clock
(`src/boot.asm:47-50`, `src/layout.asm:44`). `VCLAIM` holds `CDCLM`, which has
the value of `INFO`'s bit 4, while the chip is claimed (`src/ram.asm:72`,
`src/layout.asm:45`). `DE` is `ROMVER`. One 16-bit load from `VWID` fills `L`
and `H` (`src/services.asm:61-63`). The columns and rows are adjacent bytes at
`BFEAh` and `BFEBh`, at the workspace's end (`src/ram.asm:281-282`).

`DIGIT` and `TONE` write port `01h`, which also carries the serial transmit
line. So each write to the port carries bit 6, `TXIDLE`, and the line stays
high (`src/services.asm:9-11`, `src/services.asm:17`). `DIGIT`
walks one set bit in `C` from `20h` down, one bit for each digit, and stops
when `SRL C` empties the register (`src/services.asm:68`,
`src/services.asm:79-80`). For each digit it writes the pattern to `SEGPORT`
and the select bit with `TXIDLE` to `DIGPORT`. It then waits through 256 rounds
of `DJNZ`, about 0.8 ms, and writes `TXIDLE` alone (`src/services.asm:69-77`).

`LCD` tests the row before it does anything. For row 3 it then clears
`CDWRD`, the bit that records a word of the ROM's on that row
(`src/services.asm:87-96`). `LCDROWS` gives the row's display address, and then
20 characters go out, each after `LCDWAIT` (`src/services.asm:97-109`,
`src/tables.asm:40-41`). [Chapter 25](25-startup.md#the-lcd-s-words) explains
the ROM's words and why a program's row 3 clears the bit.

`TONE` toggles bit 7 of `A`, which starts as `TXIDLE`, and writes it to port
`01h` (`src/services.asm:173-175`). The inner loop counts `B` down in `C`, and
`A` then holds the output while `C` is borrowed to test `DE` for zero
(`src/services.asm:176-184`). Counted from the instructions, a half cycle is 16 ×
`B` + 51 T-states, as Chapter 10's measurements show (`src/services.asm:166-169`).
`B` = 0 reaches `DEC C` with 0 and goes round 256 times. The routine ends with
`TXIDLE`, so the speaker stops low (`src/services.asm:185-186`).

`JOY` and `KEYS` read the same port. `IN A,(C)` puts `B` on the top address
lines. `HWSKEYS` starts with `BC` = `FEFEh` and rotates `B` left, so one
address line is low at a time (`src/services.asm:200-205`). `RLC B` moves the old
top bit into carry. After the eighth read that bit is the 0, so the loop stops
at 8 rows (`src/services.asm:205-206`). `HWSJOY` makes one read with `BC` =
`F7FEh`, the fourth value of `HWSKEYS`'s `B`, which is why the joystick shares
row 3 (`src/services.asm:192-193`). Both complement the byte, so a key down reads
1.

`RTC` rejects any `B` but 0 and 1 with `TNEBAD`, the clock untouched
(`src/services.asm:261-264`). It then tests for the clock with `RTCHAS`, which
reads the seconds register. Any value below `60h` counts as an answer, since a
seconds register holds BCD (`src/services.asm:298-309`). `RTCCMD` raises the
enable bit, and `RTCWR` clocks a byte out least significant bit first
(`src/services.asm:320-334`). `HWSRTC` uses the DS1302's burst modes, command
`BFh` to read and `BEh` to write. A write first clears write protect with
`RTCPUT`. Its burst carries the 7 bytes and then the control byte, `80h`, which
sets write protect again (`src/services.asm:281-291`).

`VIDEO` and `PUTAT` are the pair that touch the PICO9918. Each has to agree
with the console about who is drawing on it. `VIDEO` rejects any `B` but
0 and 1 with `TNEBAD`, before anything changes (`src/services.asm:120-123`). It
then returns status 2 unless `CDTMS` is set, the bit of `CONDEV` that records a
PICO9918 answering at cold boot (`src/services.asm:124-127`,
`src/layout.asm:42`). A claim hides the cursor if the PICO9918 is the console,
and stores `CDCLM` in `VCLAIM` (`src/services.asm:131-136`). The console tests
that byte and `CONMOD` through `VTOWN`, so a claim stops it only while the
PICO9918 is the console (`src/term.asm:576-585`).

A release with no claim returns at once. A real release clears the byte and
then needs the console's driver to restore the chip. `PIVEC` holds the table of
the ROM's PICO9918 console, `PIBLK`. `PISTART` sets it at cold boot when the
PICO9918 and the matrix keyboard both answer (`src/pico.asm:32-42`,
`src/ram.asm:242`). With 0 there the routine returns and the chip stays as the
program left it (`src/services.asm:141-149`). Otherwise it reads the word at
offset 6, the table's fourth entry, `VREST`, and calls it through `VHLJP`
(`src/services.asm:150-156`, `src/video.asm:35`). If the PICO9918 is the console,
it also clears the screen and homes the cursor (`src/services.asm:157-164`). Warm
boot calls `HWVREL` directly, which is why a program's claim doesn't outlive
it. The call comes first, before `PZINIT` rebuilds page zero, so the chip's
interrupt, an NMI on the board, is off by then (`src/boot.asm:97-100`).

`PUTAT` needs a video console the program hasn't claimed, so it has two tests
at its head, and either failure gives status 2. `VTOWN` gives nonzero for a
claimed console. `RRCA` on `CONMOD` puts bit 0 in carry. That bit is set for
`CMCRT` and `CMUC1` and clear for the other two modes
(`src/services.asm:215-221`). A count of 0 returns before anything changes
(`src/services.asm:222-224`). The cursor comes off, and a row past `VHGT` leaves
with status 0 (`src/services.asm:228-235`). The loop then clips each cell against
`VWID` and calls `VPUT`, the driver's routine, with `A`, `B` and `C` as the
driver takes them (`src/services.asm:236-252`). `VPUT` jumps through the
driver's table (`src/video.asm:23`).

`FONT`, 15, is `HWSFONT`. It loads `HL` with the address of `FONT`, the ROM's
font, 96 characters of 8 bytes from `20h`, and leaves through `HWOK`
(`src/services.asm:351-354`, `src/abi.inc:91`). `GLCD.SVC`'s `INIT` calls it
first. On a ROM before ABI 5.1 the number is past the table, the call returns
carry and `INIT` fails with it (`drivers/glcd.asm:38-41`).

## The shared rules

None of these routines calls the BDOS (`src/abi.inc:21-23`). A program may
therefore call any of them from inside a BDOS call of its own or from a
service's `INIT`. Only the two mount services forbid that. Their state is in
the resident workspace (`src/services.asm:6-7`). It is `VCLAIM`, the claim,
and the bits of `CONDEV` that `LCD` and a release change. Warm boot clears the
claim through `HWVREL`.

Each runs on the caller's stack. The caller can be the CCP, a program or the
BDOS with a few bytes of its own stack left. So `abi.inc` gives each service a
bound on the bytes it takes below its return address, the dispatcher's two
pushes included. None takes more (`src/abi.inc:24-25`).
`JOY`, `KEYS`, `DIGIT`, `TONE` and `FONT` are bounded at 4, the dispatcher's
pushes alone. `PUTAT` is the deepest, at 22 (`src/abi.inc:47-52`). At each cell
it saves `BC`, `DE` and `HL`, six bytes, and calls the display driver
(`src/services.asm:241-249`). The driver's `VPUT` draws the character on the
same stack, and the bound covers that use too. A caller must therefore leave
22 bytes free to write text at a position and only 4 to beep.
