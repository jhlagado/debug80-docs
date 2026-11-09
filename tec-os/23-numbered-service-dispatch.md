---
title: Numbered-service dispatch
parent: TEC-OS
nav_order: 23
nav_group: "Inside TEC-OS"
---

# 23. Numbered-service dispatch

<!-- Source mechanisms checked by text inspection against TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe. Unprefixed source ranges use
     that pin. Historical byte accounting and workspace addresses retain
     78127ec. Receiver selection: book 9ba1f59, P3 proposal 18 / 43d5f328.
     No build, capture or measurement was performed. -->

A call to `ABICALL` selects a routine while keeping its arguments in the
registers. The lookup needs register pairs too. TEC-OS saves those pairs on
your stack and removes its temporary words before the routine starts
(`src/services.asm:33-56`). The same entry can therefore dispatch a call
from a program, the CCP or a resident routine without a separate argument
buffer.

## From a number to a routine

`ABICALL` is the jump at `C008h` to `SVCDSP`. It is the last three bytes of the
eight-byte ROM table. The preceding bytes are the signature `TNA` and
application binary interface (ABI) major and minor versions 5 and 1
(`src/abi.asm:9-14`, `src/abi.inc:14-30`). You supply the service number in `C`
and arguments in `B`, `DE` and `HL`. `A` is never an argument so the dispatcher
can use it and the flags before saving a register (`src/abi.inc:32-53`).

There are 16 entries, numbered 0 to 15. `SVCDSP` copies `C` to `A` and
compares it with `TNCOUNT`, 16. The following `LD A,TNEBAD` leaves the
comparison flags intact. A number of 16 or more branches to `HWERR`
without changing `B`, `DE` or `HL` (`src/services.asm:33-37`,
`src/abi.inc:220-222`). The error exit returns status 1 with carry set
and zero clear (`src/services.asm:62-65`).

For a valid number, the dispatcher pushes `HL` and `DE`. It doubles the
number into `DE` and adds that offset to `SVTAB`. Each entry is a routine
address so the 16 words occupy 32 bytes in the ROM's data block
(`src/services.asm:38-45`, `src/tables.asm:102-130`). This table is separate
from the eight-byte signature/version/jump table at `C003h`.

The selected address is loaded into `HL` and the saved `DE` is popped.
`EX (SP),HL` then exchanges the routine address with the saved argument
`HL`. The next `RET` consumes that address and enters the routine. Its
arguments are back in place and the caller's return word is next on the
stack. Neither of the dispatcher's saved pairs remains there
(`src/services.asm:46-56`).

The exit helpers `HWERR` and `HWOK` leave `B`, `DE` and `HL` as they
are on entry to those helpers. They do not restore values changed by the
selected routine. `HWERR` uses `OR A` and `SCF` to return a nonzero status
with carry set. `HWOK` uses `XOR A` to return status 0 with zero set and
carry clear (`src/services.asm:58-72`).
`FIND` and `LIST` have their own result convention, including the registry
generation in `A` (`src/abi.inc:193-208`). The ABI preserves `IX`, `IY`
and the alternate registers except for `MOUNT`, `UNMNT` and `DESC`, which
may change `IX` and the alternates. For the whole call, use the selected
service's documented results. Other registers may be destroyed
(`src/abi.inc:32-53`).

## The code behind the table

Services 0 to 8 are the hardware routines in `src/services.asm`.
`FONT`, 15, is there too. The volume entries 9 to 11 are in
`src/volsvc.asm`. [Chapter 17](17-card-blocks-and-volumes.md) explains those
operations. `DRVR`, 12, enters `SVDRV` to install or drop a display-driver
table. [Chapter 16](16-console-paths.md) explains that table and its
validation. `FIND` and `LIST`, 13 and 14, enter the registry routines in
`src/loader.asm`, explained in
[Chapter 24](24-loading-and-removing-services.md)
(`src/tables.asm:102-130`, `src/services.asm:525-557`).

The historical `78127ec` code account below totals 480 bytes for the
dispatcher, its exits, the nine hardware services and the font's access
routine. It excludes the font data and the other numbered routines.
These are retained build figures, separate from the source checks at
`a1023bd`.

| Number | Name | Routine | Bytes at `78127ec` |
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

## Stored state and the status LCD

`INFO` returns stored state without reading a device. It ORs `CONDEV` with
`VCLAIM` for the result in `B`, loads `ROMVER` into `DE` and reads the adjacent
`VWID` and `VHGT` bytes into `L` and `H` (`src/services.asm:80-87`,
`src/ram.asm:427-428`). In the historical `78127ec` resident workspace those
dimensions were at `BFEAh` and `BFEBh`, near its upper end
(`78127ec:src/ram.asm:281-282`).

The device bits and claim bit have different lifetimes. Cold boot calls
`RTCHAS` once and sets `CDRTC`, bit 3 of `CONDEV`, if the clock answers
(`src/boot.asm:68-72`, `src/layout.asm:73-73`). `VCLAIM` holds `CDCLM`,
bit 4 in the `INFO` result, while a program has claimed the PICO9918
(`src/ram.asm:128-128`, `src/layout.asm:74-74`). Reading `INFO` does not
repeat the clock probe or change the claim.

Writing the status LCD changes another bit in `CONDEV`. `HWSLCD` first
checks that the row in `B` is below 4. An invalid row returns `TNEBAD`
before any write. For row 3 it clears `CDWRD`, which records that the
bottom row contains a ROM recovery word (`src/services.asm:134-144`).
Your text can then remain there without a later recovery-word clear
erasing it (`src/loader.asm:782-801`).
[Chapter 25](25-startup-inside-the-ccp.md) explains that use of the bottom row.

`LCDROWS` supplies the row's display address. `HWSLCD` sends that command
and then writes exactly 20 bytes from `HL`, advancing the pointer after
each. Every character follows a call to `LCDWAIT`
(`src/tables.asm:50-51`, `src/services.asm:146-162`). This is fixed-width
output, including zero bytes. `LCDWAIT` polls the busy flag at most 256
times so an absent display does not cause an endless wait
(`src/lcd.asm:23-39`).

## Digits and sound on port 01h

The digits, speaker and serial transmitter share port `01h`. A digit
select or speaker change must keep serial bit 6 high. Both `DIGIT` and
`TONE` include `TXIDLE`, `40h`, in every value they write there
(`src/services.asm:1-23`, `src/services.asm:99-122`,
`src/services.asm:242-264`). Sound and digit output can therefore use
their own bits without transmitting a false serial start bit.

`DIGIT` scans six patterns from `HL`, leftmost first. It starts `C` at
`20h` so only the leftmost select bit is set. Each pattern goes to
`SEGPORT` before that digit is enabled through `DIGPORT`. A `DJNZ` loop
starting with `B` at zero makes 256 turns, about 0.8 ms at 4 MHz.
The routine writes `TXIDLE` alone to turn the digit off, advances `HL`
and shifts `C` right. The scan ends when the select bit leaves the
register (`src/services.asm:89-122`).

`TONE` starts its port value at `TXIDLE` and toggles bit 7 for each half
cycle. `B` supplies the delay count and `DE` the number of half cycles.
The loop copies `B` to `C`, counts it down and uses `C` again to save the
port value while testing `DE` for zero (`src/services.asm:242-261`).
Between successive loop toggles the instruction cost is `16 × B + 51`
T-states. `B` at zero makes 256 delay turns because `DEC C` wraps to
`FFh`. Zero half cycles return immediately. After a nonempty tone the
last port write is `TXIDLE`, leaving the speaker low and the serial line
high (`src/services.asm:234-264`). This instruction-derived interval is
separate from the historical program-side measurements in
[Chapter 11](11-use-the-boards-devices.md).

## Matrix rows and the joystick

`JOY` and `KEYS` read port `FEh`. The `IN A,(C)` instruction puts `B`
on the upper address lines, where a low bit selects a matrix row.
`HWSKEYS` begins with `BC` at `FEFEh`. It complements each input byte,
stores it through `HL` and rotates `B` left for the next row
(`src/services.asm:279-295`). A pressed key therefore becomes a 1 in
the returned buffer.

`RLC B` also copies the old top bit to carry. The low select bit reaches
that position for the eighth read, after which carry is clear and the
loop ends. The buffer contains eight row bytes. `HWSJOY` uses `F7FEh`
for its single read, the fourth select value in that scan. The joystick
therefore shares row 3. It also complements the port byte, returning a 1
for each pressed input (`src/services.asm:270-295`).

## Clock transfers

The clock service checks its mode before contacting the DS1302. `B` must
be 0 for a read or 1 for a write. Other values return `TNEBAD` with the
clock untouched (`src/services.asm:368-372`). A valid call probes the
seconds register through `RTCHAS`. A byte below `60h` counts as an answer
because the seconds are BCD. This is the implemented presence test, not
full validation of every BCD digit (`src/services.asm:373-377`,
`src/services.asm:415-435`). An unanswered probe returns `TNENODV`.

`RTCCMD` raises the enable line and enters `RTCWR` to send the command.
`RTCWR` shifts the byte in `D` out least significant bit first, setting
each data bit before raising the clock (`src/services.asm:454-477`).
The service uses burst command `BFh` to read seven time bytes into the
buffer at `HL`:
seconds, minutes, hours, date, month, weekday and year. Each read byte
advances `HL` (`src/services.asm:357-366`, `src/services.asm:378-390`).

A write first calls `RTCPUT` with `8E00h` in `DE` to clear write protect.
It then sends burst command `BEh`, the seven bytes from `HL` and control
byte `80h` to turn protection on again. Both directions finish by taking
enable low (`src/services.asm:392-413`, `src/services.asm:441-447`). The
probe happens on each `RTC` call even though `INFO` reports the bit saved
at cold boot.

## Display claims and positioned text

A program can change the PICO9918's mode and video memory (VRAM) while the
console is configured to use it. `VIDEO` records the claim that prevents console
drawing during that interval. It validates `B` as 0 or 1 before changing
anything, then requires `CDTMS` in `CONDEV`. Invalid modes return status 1 and
an absent PICO9918 returns status 2 (`src/services.asm:164-183`).

For a claim, the routine hides the cursor if `CONMOD` is `CMCRT` and
stores `CDCLM` in `VCLAIM` (`src/services.asm:184-192`). The terminal's
`VTOWN` test combines the claim with `CONMOD`. It returns nonzero only
when the claimed PICO9918 is the console (`src/term.asm:857-874`). A
claim therefore stops PICO9918 console drawing while output to another
selected console can continue.

Release returns at once if there is no claim. Otherwise `HWVREL` clears
`VCLAIM` and reads `PIVEC`. Cold boot sets that pointer to `PIBLK` when
the PICO9918 responds and the Matrix switch enables the keyboard
(`src/services.asm:208-217`,
`src/video.asm:18-24`, `src/pico.asm:53-68`). A zero pointer leaves the
chip as the program set it. With a table present, release reads the
fourth word at offset 6 and calls the restore routine through `VHLJP`
(`src/services.asm:218-224`, `src/video.asm:61-66`).

The restore routine reinstates the mode, font and displayed page. Release also
clears the screen and homes the cursor when the PICO9918 is the console
(`src/pico.asm:198-274`, `src/services.asm:225-232`). Warm boot calls `PIICLR`
and then `HWVREL` before `PZINIT`. `PIICLR` clears the tracked interrupt-enable
bit and writes register 1 with the chip's interrupt off, so the interrupt is off
before page zero is rebuilt. A restore during a claim keeps a tracked enable bit
that the program set through `PICOREG` (`src/boot.asm:128-138`,
`src/pico.asm:211-233`, `src/pico.asm:323-359`, `src/pico.asm:641-643`). A program's claim ends with its exit.

`PUTAT` writes through the selected video driver while leaving the console
cursor position unchanged. Its first test is `VTOWN`, followed by the low
bit of `CONMOD`. A claimed PICO9918 console or a non-video mode returns
status 2. The low bit is set for `CMCRT` and `CMUC1`, clear for serial
and batch (`src/services.asm:297-317`, `src/layout.asm:77-86`). These
tests precede the zero-count return. On an available video console a
count of zero reads no source and changes no cursor state
(`src/services.asm:318-320`).

For a nonzero count, `PUTAT` hides the cursor before checking the row.
A row beyond the screen returns status 0 with no text written.
The cell loop clips the column against `VWID`, then saves `BC`, `DE`
and `HL` around `VPUT`. It passes character `A`, row `B` and column `C`
to the driver. The source pointer and column advance until the count
expires or the right edge is reached (`src/services.asm:321-355`).
`VPUT` jumps through `VPUTV`, the vector copied from the driver's table
(`src/video.asm:26-34`).

## The ROM font

The display drivers use the ROM's font (`src/pico.asm:250-272`,
`drivers/glcd.asm:527-555`). `FONT`, service 15, loads its address into
`HL` and jumps to `HWOK` (`src/services.asm:504-510`). The font has 96
characters from code `20h`, each eight bytes in top-to-bottom row order
(`src/abi.inc:210-218`). Its 768 data bytes are separate from the
six-byte access routine in the historical code table.

The selected data is TEC Compact from `format/font5x7.txt`. Its parser puts
each row's five pixels in bits 7–3 and requires eight rows per character
(`tools/lib/font.mjs:9-35`). The source package checks the selected font
identity (`tools/lib/font-package.mjs:8-16`).

`GLCD.SVC` calls `FONT` first in `INIT` and stores the returned pointer.
On a ROM before ABI 5.1, number 15 is beyond the dispatch table. The
call returns carry set and `INIT` exits with that failure before probing
the controller (`drivers/glcd.asm:60-68`).

## Space on the caller's stack

The hardware routines and `FONT` run on the caller's stack and make no
BDOS call. Their state changes use resident bytes such as `VCLAIM` and
`CONDEV`. They can therefore be called from a resident service's `INIT`
or within a BDOS call without re-entering the BDOS. `MOUNT` and `UNMNT`
are the exceptions among numbered services: they reset a drive through
BDOS function 37 and must be called from outside an existing BDOS call
(`src/services.asm:1-15`, `src/abi.inc:32-53`).

The caller may be a program, the CCP or the BDOS with part of its stack
already occupied. The byte counts in `abi.inc` bound additional space
below the caller's return address. They include the dispatcher's two
pushes, even though those words are gone before the routine begins.
They are upper bounds, not a claim that every path reaches the limit
(`src/abi.inc:47-50`). The routines also preserve the caller's interrupt
state (`src/abi.inc:40-41`).

`JOY`, `KEYS`, `DIGIT`, `TONE` and `FONT` each have a four-byte bound,
the dispatcher's saved pairs alone (`src/abi.inc:68-119`,
`src/abi.inc:210-218`). `PUTAT` has the deepest hardware bound at 22
bytes. Its six saved register bytes remain on the stack during a driver
call, with the driver's nested drawing calls below them
(`src/services.asm:342-351`, `src/abi.inc:121-132`). You therefore leave
22 bytes free to write positioned text and four to sound a tone.
