---
title: B. The ROM table and hardware services
parent: TEC-OS
nav_order: 102
nav_group: "Appendices"
---

# Appendix B. The ROM table and hardware services

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

<!-- Mechanism coordinates below: TEC-OS ea3ef3de9133931e925a0220d51c0e971c1fd8dd.
     The original comments above retain their historical scope. Historical
     timings, depths and VTEST output have separate pins below and in the
     pass record. No execution or new assembly proof is supplied here.
     Compact-style assembly and the KS48 font/default workflow remain held. -->

The eight-byte ROM table at `C003h` has one jump for sixteen numbered services.
Numbers 0–8 control hardware, 9–11 manage volumes, 12 registers a display
driver, 13–14 read the registry and 15 returns the console font. The PICO record
provides a separate table of graphics routines. The complete hardware programs
are in Chapter 11, the dispatcher explanation in Chapter 23 and the
resident-service and registry contracts in Chapter 13.

This reference gives each service's inputs, results, status and stack bound.
Historical host model costs are labelled separately from the inspected source
contracts. A stack bound is an allowance for a caller, not a claim that every
path uses that many bytes.

## The ROM table

The inspected application binary interface (ABI) is 5.1. Before calling ABICALL,
a program compares the three bytes at ABITAB with `TNA` and ABIMAJ with exactly
5. A new major may renumber services. A new minor adds service numbers at the
end so code using the 5.0 calls can run on 5.1. A caller requiring FONT also
checks for minor version 1 or later (`src/abi.inc:1-32,163-168`,
`src/abi.asm:1-20`, `test/programs/demo.asm:19-31`).

| Address | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `C003h` | 3 | `ABITAB` | The signature, `TNA` |
| `C006h` | 1 | `ABIMAJ` | The major version, 5 |
| `C007h` | 1 | `ABIMIN` | The minor version, 1 |
| `C008h` | 3 | `ABICALL` | `JP` to the numbered services |

ABIEND is `C00Bh`, eight bytes after ABITAB. The read-only data block follows
the ABI table. ABICALL is a JP into the dispatcher rather than an array of fixed
routine addresses (`src/rom.asm:12-18`, `src/services.asm:35-68`).

## Calling a service

C selects the number. B, DE and HL carry the documented arguments. A is never an
input because selection uses it. Except for FIND and LIST, success returns A = 0
with Z set and carry clear. Failure returns a nonzero status with carry set. The
requested operation has not been applied. MOUNT/UNMNT can nevertheless have
written or dropped cache lines before refusing the drive change, as their
section explains (`src/abi.inc:34-65`, `src/services.asm:70-86`,
`src/volsvc.asm:246-279,326-368`).

| Status | `abi.inc` | Meaning |
| ---: | --- | --- |
| 0 | | Success |
| 1 | `TNEBAD` | No such number, an out-of-range argument or a rejected request |
| 2 | `TNENODV` | The device isn't fitted or isn't the console |

Hardware failures and an invalid service number set NZ as well as carry. Volume
and driver failures leave Z undefined so their callers test carry or A.
FIND/LIST use carry and return a generation in A on success
(`src/services.asm:70-86,617-658`, `src/volsvc.asm:360-368`,
`src/loader.asm:773-880`).

SVTAB holds one word per number. The dispatcher enters that routine with B, DE
and HL restored and the caller's return address next on the stack. A number from
TNCOUNT, 16, upwards returns status 1 with B, DE and HL unchanged
(`src/services.asm:35-68`, `src/tables.asm:99-132`). The historical
invalid-number path took 58 T-states and used no stack below that return address
at `60e0768`.

Every numbered call preserves its incoming interrupt state and uses the caller's
stack. IX, IY and the alternate registers are preserved except that MOUNT, UNMNT
and DESC may change IX and the alternates. Treat registers not documented as
results as destroyed (`src/abi.inc:34-65`).

| `C` | Name | `abi.inc` | Takes | Stack bound | Historical T-states |
| ---: | --- | --- | --- | ---: | ---: |
| 0 | `INFO` | `TNINFO` | nothing | 6 | 244 |
| 1 | `DIGIT` | `TNDIGIT` | `HL` → 6 segment bytes | 4 | 20,670 |
| 2 | `LCD` | `TNLCD` | `B` = row, `HL` → 20 characters | 10 | 4,915 |
| 3 | `VIDEO` | `TNVIDEO` | `B` = 1 claim, 0 release | 12 | see the entry |
| 4 | `TONE` | `TNTONE` | `B` = half period, `DE` = half cycles | 4 | see the entry |
| 5 | `JOY` | `TNJOY` | nothing | 4 | 214 |
| 6 | `KEYS` | `TNKEYS` | `HL` → 8 bytes | 4 | 581 |
| 7 | `PUTAT` | `TNPUTAT` | `D` = row, `E` = column, `B` = count, `HL` → characters | 22 | see the entry |
| 8 | `RTC` | `TNRTC` | `B` = 0 read, 1 set, `HL` → 7 bytes | 8 | 6,946 or 7,780 |
| 9 | `MOUNT` | `TNMOUNT` | `B` = drive, `E` = container index | 24 | |
| 10 | `UNMNT` | `TNUNMNT` | `B` = drive | 24 | |
| 11 | `DESC` | `TNDESC` | `E` = container index, `HL` → 32 bytes | 24 | |
| 12 | `DRVR` | `TNDRVR` | `B` = 3 `UC1:`, `HL` = a driver's table | 4 | |
| 13 | `FIND` | `TNFIND` | `DE` → a record's name, `B` = the least version | 8 | |
| 14 | `LIST` | `TNLIST` | `B` = an index | 8 | |
| 15 | `FONT` | `TNFONT` | nothing | 4 | 194 |

The names and bounds come from `src/abi.inc:66-168`. The build's ABI check
compares the fixed table bytes, verifies that the service entries lie in code
and checks INFO's bits. It does not prove every routine's contract. Media
generation publishes the include as `dist/abi.inc` (`tools/build.mjs:143-157`,
`tools/media.mjs:251-257`).

### Historical costs and depths

The table's stack figures are current source bounds below the service's return
address, including dispatcher use. The dispatcher's temporary pushes are gone
when the selected routine begins so its depth is not added to a routine's
depth. The caller must allow for its own return word, saved registers and
nesting too (`src/services.asm:45-68`).

The cost figures start at the JP at ABICALL and end after the final RET. A CALL
adds 17 T-states. Their retained model provenance is:

| Figures | Historical source/result pin |
| --- | --- |
| Invalid number 58, INFO 244, DIGIT 20,670, LCD 4,915/4,935, TONE formula, JOY 214 and KEYS 581 | `60e0768`, model timing and instruction-count check |
| DIGIT lit interval 3,348, including DJNZ 3,323 | `bd15528`, port-write timing trace and instruction count |
| VIDEO claim 1,232 and releases 217,252/187,492/147,031 | `58d4345`, model timing under the entry's conditions |
| PUTAT PICO cell about 509 and depths 22/18/18/14 | `58d4345`, model cell/depth checks |
| PUTAT GLCD cell about 36,900 | `621201d`, recorded model measurement 36,909 |
| RTC read 6,946 | `7458352`, model measurement |
| RTC set 7,780 | `60e0768` measured 7,752 plus the 28-T-state mode guard checked at `7458352` |
| FONT 194 and depth 4 | `58d4345`, model timing/depth check |

The RTC set figure is an instruction adjustment to an earlier measurement, not a
newly measured total. No cost was recorded here for services 9–14. None of these
figures is a timing or stack measurement at ea3ef3d.

## The hardware services

Numbers 0–8 are implemented in `src/services.asm`. None calls the BDOS. VCLAIM
holds the PICO claim flag, LCD can clear CONDEV's ROM-word bit and VIDEO release
can reset the selected console's row and column. These are resident workspace
changes, not state stored in a transient program
(`src/services.asm:1-25,152-279`).

### 0 INFO

Returns B = device bits, DE = ROM product version, L = console columns and H =
console rows. Serial dimensions are both zero. Status is always 0. Stack bound:
6 bytes. Historical cost: 244 T-states at `60e0768`, with no device read. D is
the version's major and E its minor so `0001h` means product version 0.1 rather
than ABI 5.1 (`src/services.asm:88-105`, `tools/build.mjs:27-27,63-70`).

| Bit | Value | `abi.inc` | Set when |
| ---: | ---: | --- | --- |
| 0 | `01h` | `HWBMTX` | The matrix keyboard is enabled |
| 1 | `02h` | `HWBPICO` | A PICO9918 answered at cold boot |
| 2 | `04h` | `HWBGLCD` | `GLCD.SVC` is in |
| 3 | `08h` | `HWBRTC` | A DS1302 answered at cold boot |
| 4 | `10h` | `HWBCLM` | The PICO9918 is claimed |
| 7 | `80h` | `HWBWRD` | The ROM's word `GLCD?` is on LCD row 3 |

B combines CONDEV with VCLAIM. The DS1302 cold-boot bit records whether its
seconds register read below `60h`. It is not a full BCD/date validation or a new
probe on each INFO call (`src/abi.inc:192-203`, `src/boot.asm:90-94`,
`src/services.asm:484-511`).

### 1 DIGIT

Takes HL pointing to six segment patterns, leftmost first, and scans once.
Status is always 0. Stack bound: 4 bytes. Historical cost: 20,670 T-states at
`60e0768` (`src/services.asm:107-150`).

For each digit it writes the pattern to port `02h` and selects the digit through
port `01h`, from bit 5 for the leftmost to bit 0 for the rightmost. Bit 6
remains high for serial idle. The retained lit interval is 3,348 T-states, about
0.84 ms at 4 MHz, including 3,323 T-states for a DJNZ count of 256. It turns the
digit off after its interval and all six are off on return. The lit interval
comes from a port-write trace at `bd15528`, with the DJNZ component counted from
the instructions. It is not a physical brightness or refresh measurement.

### 2 LCD

Takes B = row 0–3 and HL pointing to exactly 20 characters for the 20 × 4 LCD.
Status is 0 on success or 1 for a row above 3, rejected before a write. Stack
bound: 10 bytes. Historical cost at `60e0768`: 4,915 T-states or 4,935 for row
3 (`src/services.asm:152-193`).

Writing row 3 clears HWBWRD. A later GLCD.SVC installation therefore preserves
the program's replacement text instead of blanking it as the ROM's `GLCD?`
message.

### 3 VIDEO

Takes B = 1 to claim the PICO9918 or 0 to release it. Another B returns status 1
before any device test or claim change. For valid modes, status 2 means no
PICO9918 answered at cold boot. Success returns 0. Stack bound: 12 bytes
(`src/services.asm:194-279`).

Historical timings at `58d4345` are 1,232 T-states for a claim with a cursor to
remove, 217,252 for release with PICO selected at 80 columns, 187,492 with PICO
selected at 40 columns and 147,031 with the console elsewhere. These are
conditional model results rather than a universal release cost.

A claim removes the selected PICO console's cursor and stores HWBCLM in VCLAIM.
While claimed, PICO console output is discarded and its cursor and page-flip
paths do not draw on the chip. The program can use its registers and video
memory (VRAM) through the graphics entries or ports.

Release with no claim returns status 0 without restoring anything. Otherwise it
clears VCLAIM and calls the ROM PICO console's restore routine when that console
started at cold boot. Mode, font and displayed page are restored. If PICO is
selected, release also clears its screen and homes its cursor. With the
Matrix switch disabled the ROM console did not start so release leaves the chip's
programmed state alone. Warm boot releases an active claim before rebuilding
page zero (`src/boot.asm:178-215`, `src/pico.asm:54-87`).

### 4 TONE

Takes B = delay count and DE = half-cycle count. It drives port `01h` bit 7
while holding bit 6 high. Status is always 0. Stack bound: 4 bytes
(`src/services.asm:281-322`).

Ordinary toggle spacing is 16 × B + 51 T-states, with B = 0 meaning 256. For
nonzero DE, the retained total is DE × (16 × B + 51) + 222 T-states. It was
measured and checked by instruction counting at `60e0768`. DE = 0 returns
immediately before writing the port. A nonempty tone ends with the speaker off.
A zero-duration call leaves the port untouched.

| Instructions | T-states |
| --- | ---: |
| `XOR $80`, `OUT (DIGPORT),A`, `LD C,B` | 22 |
| `DEC C`, `JR NZ` for `B` rounds, the last not taken | 16 × `B` − 5 |
| `DEC DE`, `LD C,A`, `LD A,D`, `OR E`, `LD A,C` | 22 |
| `JR NZ`, taken | 12 |

The last half cycle is five T-states shorter between its bounding writes. At 4
MHz the ordinary half period gives these calculated frequencies, not
measurements of a physical oscillator:

| `B` | T-states a half cycle | Frequency |
| ---: | ---: | ---: |
| 1 | 67 | 29,851 Hz |
| 10 | 211 | 9,479 Hz |
| 100 | 1,651 | 1,211 Hz |
| 120 | 1,971 | 1,015 Hz |
| 255 | 4,131 | 484 Hz |
| 0 | 4,147 | 482 Hz |

### 5 JOY

Returns B = active joystick lines as 1 bits, from complemented input at port
`FEh` with BC = `F7FEh`. Status is always 0. Stack bound: 4 bytes. Historical
cost: 214 T-states at `60e0768` (`src/services.asm:324-337`).

That address also selects matrix row 3. A pressed switch there can appear as a
joystick bit and a joystick line can appear as a matrix key. The diagnostic ROM
labels the bits after MON-3 as `01h` up, `02h` down, `04h` left, `08h` right,
`10h` fire 2, `20h` pin 9, `40h` fire 1 and `80h` fire 3. Those physical labels
remain unconfirmed (`diag/interact.asm:553-557`).

### 6 KEYS

Takes HL pointing to eight bytes and stores matrix rows 0–7, with a 1 for each
pressed switch. Status is always 0. Stack bound: 4 bytes. Historical cost: 581
T-states at `60e0768` (`src/services.asm:339-356`).

Each input reads port `FEh` with one low bit in the high address byte, from
`FEh` for row 0 to `7Fh` for row 7. KEYS does not test keyboard presence. INFO's
HWBMTX bit reports whether the matrix keyboard is enabled.

### 7 PUTAT

Takes D = row, E = column, B = count and HL pointing to characters. Row and
column are zero-based. It writes through the display's cell routine without
moving the console cursor or using the escape parser. Stack bound: 22 bytes
(`src/services.asm:360-427`).

Status 2 means no usable video console: serial/BAT or PICO both claimed and
selected. These checks precede count and row checks. On an available video
console, B = 0 returns status 0 without reading source bytes or changing the
cursor image. For a nonzero count, the cursor image is removed before checking
the row. A row past the bottom returns 0 without writing. Right-edge clipping
occurs before each source read. A PICO claim leaves PUTAT available on the GLCD
console.

The cursor's stored position remains unchanged. CONST redraws its image when no
character is ready and CONIN while waiting for input
(`src/console.asm:200-225,296-332`). Bytes `80h–FFh` reach the display as
reverse images of `00h–7Fh` while the ordinary video-console path filters those
high bytes (`src/pico.asm:277-331`, `drivers/glcd.asm:604-641`,
`src/term.asm:49-65`).

Historical measured depths at `58d4345` were 22 bytes on GLCD and 18 on PICO
with a cursor to remove or 18 and 14 respectively without one. These are
measured paths, distinct from the source's 22-byte bound. A cell along a row
cost about 509 T-states on the 80-column PICO at `58d4345` and about 36,900 on
GLCD at `621201d`.

### 8 RTC

Takes B = 0 to read the DS1302 into seven bytes at HL or B = 1 to set it from
them. Another B returns status 1 before clock access. Each valid call probes the
clock again and returns status 2 if it does not answer. Success returns 0. Stack
bound: 8 bytes (`src/services.asm:432-595`).

The seven bytes are BCD seconds, minutes, hours, date, month, weekday and year.
Setting first disables write protection and then writes `80h` as the final
control byte to enable it again. The historical read figure is 6,946 T-states at
`7458352`. The set figure is 7,780 by the earlier measurement plus the
mode-guard count described above.

## The volume services

Numbers 9–11 use `src/volsvc.asm`. Drives count from 0 for A. Each returns A = 0
with carry clear or TNEBAD with carry. Z is undefined on failure. All three have
a 24-byte source stack bound and may change IX and the alternate registers.
Appendix E defines the 32-byte descriptor (`src/abi.inc:115-138`,
`src/volsvc.asm:186-236,360-368`).

| Condition | Rejected by |
| --- | --- |
| An index past the table or an unreadable descriptor block | MOUNT, DESC |
| A drive past D | MOUNT, UNMNT |
| A volume already on any drive, including the requested drive | MOUNT |
| A missing slot or one too small for the volume | MOUNT |
| An attempt to leave drive A empty | UNMNT |
| A failed cache flush | MOUNT, UNMNT |

A failed flush leaves the drive mapping unchanged. It may already have written
other dirty blocks. Each line whose write failed is dropped and its pending
changes lost. This is the exception to reading a rejected operation as an
unchanged cache (`src/volsvc.asm:246-279,326-337,413-429`,
`src/cache.asm:292-350`).

A format 1.0 card reserves slots only for drives mounted at cold boot. A format
1.1 card reserves a G8M-sized slot for each requested drive, mounted or not. A
later mount must fit that reservation (`src/boot.asm:679-800`,
`src/volsvc.asm:287-315`).

MOUNT and UNMNT flush the card's dirty cache lines before changing a drive. They
reset that drive through BDOS function 37 on the BDOS's own stack so its next
access logs it in from the directory. When MOUNT changes the default drive it
also selects it again through function 14, making functions 27 and 31 report the
new volume immediately. They must be called from outside an active BDOS call.
DESC makes no such BDOS call (`src/volsvc.asm:246-279,326-391`).

### 9 MOUNT

Takes B = drive 0–3 and E = container index. It mounts that volume in place of
any volume on the selected drive. Status is 0 or TNEBAD. Stack bound: 24 bytes.
A volume already mounted anywhere is refused, including on the same drive
(`src/volsvc.asm:246-279`).

### 10 UNMNT

Takes B = drive 1–3 and removes its mount. Drive A cannot be emptied. Status is
0 or TNEBAD. Stack bound: 24 bytes (`src/volsvc.asm:326-368`).

### 11 DESC

Takes E = container index and HL pointing to 32 destination bytes. It copies the
descriptor and sets byte 14 to the drive on which the volume is currently
mounted or `FFh` for none. Status is 0 or TNEBAD. Stack bound: 24 bytes
(`src/volsvc.asm:212-236,457-506`, `format/format.json:27-38`).

## A display driver's table

### 12 DRVR

Takes B = 3 for UC1: and HL pointing to its driver table. Success returns A = 0,
carry clear and HL = LINEBUF for the row read/write routines. HL = 0 instead
drops UC1:'s table and returns A = 0 with carry clear and HL destroyed. Stack
bound: 4 bytes (`src/services.asm:605-658`, `src/video.asm:125-212`).

For an installation, TNEBAD with carry means B is not 3, a UC1: table is already
installed or the Matrix switch is disabled. TNENODV means a STARTUP.CMD line
offered the table while the CON: field was CRT:. A drop with B = 3 is accepted
before those installation checks. B = 1 is always refused because CRT:'s table
belongs to the ROM. Failed calls leave the table unchanged and Z undefined.

The table is eight words. Its first six are routines in this order: put, get,
clear to end of line, restore, read row and write row. The seventh handles page
functions and only CRT: calls it so the GLCD table uses 0. The last word stores
columns then rows as bytes (`src/video.asm:134-148`, `drivers/glcd.asm:39-46`).
GLCD.SVC installs from INIT and drops from REMOVE (`drivers/glcd.asm:66-129`).

Dropping the selected mode's table causes the next console call to choose its
console again. Another selected mode and its screen are preserved
(`src/video.asm:184-212`).

## The registry

FIND and LIST read published records without calling BDOS or BIOS. They can
therefore run on the caller's stack within their eight-byte bounds. A record
contains a link word, an eight-byte name, a version byte and a table address: 13
bytes in all (`src/loader.asm:60-64,773-880`).

FIND examines at most 256 records. LIST's byte index selects 0–255. The loader
admits at most 256 records in total and at most 255 from one new service,
validating their locations before linking the chain
(`src/loader.asm:458-518,589-606`). Both return the eight-bit SVCGEN on success.
Successful removal increments it and can wrap it from 255 to 0
(`src/loader.asm:128-174,864-868`). Chapter 13 explains pointer lifetime and
generation checks.

### 13 FIND

Takes DE pointing to an eight-byte space-padded name and B = minimum version. It
returns the newest matching record whose version is at least B, with carry
clear, HL = table address and A = generation. Carry set means none. Stack bound:
8 bytes (`src/loader.asm:773-784,816-880`).

### 14 LIST

Takes B = index from 0, newest first. It returns carry clear, HL = record
address and A = generation or carry set past the end. Stack bound: 8 bytes
(`src/loader.asm:786-814`).

## The PICO record

When the ROM PICO console starts at cold boot it publishes the permanent
registry tail `PICO`, version 3, in PIBLK. UNLOAD removes resident owners rather
than that tail (`src/pico.asm:31-87`, `src/loader.asm:110-174`). The historical
`78127ec` layout in Appendix C places the table at `BBE3h`. That is a layout
coordinate, not a fixed ABI address. Programs obtain the table through FIND. Its
first eight words are the display table described under DRVR, followed by five
entry words:

| Offset | `abi.inc` | Takes | Effect |
| ---: | --- | --- | --- |
| 16 | `PICOREG` | `B` = register, `A` = value | Writes the register |
| 18 | `PICOFIL` | `HL` = VRAM address, `DE` = count, `A` = value | Fills VRAM |
| 20 | `PICOWR` | `HL` = VRAM address, `DE` = source, `BC` = count | Copies RAM to VRAM |
| 22 | `PICORD` | `HL` = VRAM address, `DE` = destination, `BC` = count | Copies VRAM to RAM |
| 24 | `PICOWID` | `A` = 80, 40 or 32 | Sets the console's width to `A` |

The first four entries require the caller to hold VIDEO's claim. They perform no
claim or argument validation and may change AF, BC, DE and HL. Zero count
transfers no data bytes, though the address-setup routine still writes the
control port (`src/abi.inc:205-218`, `src/pico.asm:353-445`).

PICOWID was added in record version 3 and is the entry used by CON PICO 40. It
requires an unclaimed chip. Any other width or an active claim returns carry
with no width change. Success changes the saved width and marks selected CRT:
for reselection so the next console call clears its screen at that width
(`src/abi.inc:220-243`, `src/pico.asm:89-174`).

Debugger offsets from the table are PICOVRB = 36 for the record version, PICOTPD
= 41 for the drawn page and PICOTPS = 42 for the shown page
(`src/ram.asm:75-107`). These are state bytes rather than routine entries.

VTEST is a retained historical program. It finds a version-2-or-later PICO
record, claims the chip, writes four bytes to VRAM, reads them back, releases it
and prints the buffer. Its ENTRY helper reads a word pointer, unlike COUNT's JP
entry in Chapter 13. EX (SP),HL followed by RET enters that routine with HL
restored. Chapter 23 explains the same dispatch technique. HWLIB.ASM comes from
Chapter 11. The program performs no removal so it does not recheck the saved
table's generation before these calls.

```asm
; VTEST: write four bytes to the PICO9918's VRAM and read them back through
; the graphics entries of the ROM's PICO9918 console.
BDOS	EQU	$0005
VRAM	EQU	$3000		; an address the text modes leave alone
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	DE,NAME		; the record's eight-byte name
	LD	B,2		; version 2 has the graphics entries
	LD	C,TNFIND	; the registry's find
	CALL	ABICALL
	LD	DE,NONE
	JP	C,SAY		; carry: no such record, so print and end
	LD	(TABLE),HL	; good until this program exits
	LD	B,1		; claim the PICO9918
	LD	C,TNVIDEO
	CALL	ABICALL
	LD	HL,VRAM		; PICOWR: BC bytes from DE to VRAM at HL
	LD	DE,DATA		; the bytes to write
	LD	BC,4
	LD	A,PICOWR	; the entry's offset in the table
	CALL	ENTRY
	LD	HL,VRAM		; PICORD: BC bytes from VRAM at HL to DE
	LD	DE,BACK		; where to put them
	LD	BC,4
	LD	A,PICORD	; the entry's offset in the table
	CALL	ENTRY
	LD	B,0		; give it back: the console's screen returns
	LD	C,TNVIDEO
	CALL	ABICALL
	LD	DE,BACK		; the four bytes, as text
	JP	SAY		; prints and ends the program

; Run the table's entry at offset A, with its arguments in BC, DE and HL.
; Changes what the entry changes.
ENTRY:	PUSH	HL		; the entry's HL
	PUSH	DE		; and its DE
	LD	E,A		; DE = the offset
	LD	D,0
	LD	HL,(TABLE)
	ADD	HL,DE		; HL = the entry's word
	LD	E,(HL)
	INC	HL
	LD	D,(HL)
	EX	DE,HL		; HL = the routine
	POP	DE		; the entry's DE back
	EX	(SP),HL		; the routine goes on the stack, HL comes back
	RET			; a jump to it, with HL free

TABLE:	DW	0		; the table, once found
NAME:	DB	"PICO    "	; the record to find
NONE:	DB	"no PICO "	; printed when there is no record
	DB	"record"
	DB	13,10,"$"
DATA:	DB	"VRAM"		; the four bytes to write
BACK:	DB	"????"		; PICORD fills these four
	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

The retained TAS/run result is recorded at `60e0768` with starter TAS from
Thorium `dbee66a`, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. That run
obtained the PICO record from the then-loaded PICO.SVC rather than the later ROM
console. It is a historical host-model VRAM round trip, not a new ea3ef3d or
physical-board result. The recipe assumes the earlier service chapter's
`svc.img`, ABI.INC and HWLIB.ASM preparation:

<!-- node tools/tecvol.mjs put svc.img B vtest.asm --text; node tools/capture.mjs --card svc.img --board pico B: "TAS VTEST" VTEST -->
```text
A>B:
B>TAS VTEST
VTEST.COM written

B>VTEST
VRAM

B>
```

Without a started ROM PICO console there is no PICO record. The existing program
then takes its `no PICO record` branch, including on serial-only configuration
or a PICO board with the Matrix switch disabled. A program using such a chip
directly still claims it before writing its ports.

## The font

### 15 FONT

Returns HL = the ROM console font address. Status is always 0. Stack bound: 4
bytes. Historical timing/depth at `58d4345`: 194 T-states and 4 bytes
(`src/services.asm:597-603`, `src/abi.inc:163-168`).

The font contains 96 characters from `20h`, eight bytes each, top row first. In
this source format each row's five pixels occupy bits 7–3
(`tools/lib/font.mjs:9-31`). The historical `58d4345` layout puts FONT at
`C179h`. Programs use the returned address rather than embedding that
coordinate. The PICO console uses the FONT label and GLCD.SVC obtains the
address through this call during INIT (`src/pico.asm:277-331`,
`drivers/glcd.asm:66-72`). On ABI 5.0 the number is out of range and returns
status 1 so this GLCD driver's INIT refuses installation there.
