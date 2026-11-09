---
title: Diagnose the machine
parent: TEC-OS
nav_order: 27
nav_group: "Inside TEC-OS"
---

# 27. Diagnose the machine

<!-- Checked against TEC-OS 78127ec. The diagnostics ROM in this chapter is version
     0.2, image `D90143609F53FAAB`, as `npm run diag` builds it from that commit. -->

<!-- Source-only reading: TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Inline source coordinates refer to this revision. The retained build output,
     captures and model report remain evidence from 78127ec, not new results.
     The earlier C16 partial citation pass used fe2097f; it did not rerun them. -->

A card failure can stop TEC-OS before the first command prompt. The error code
and `R retry>` let you correct the card and try mounting it again. A separate
diagnostics ROM tests the board's memory and devices and prints a serial report.
Each check covers a particular behaviour. Host model results remain separate
from observations on a physical board.

## The diagnostic prompt

The message `No volume mounted, error ` precedes a two-digit hexadecimal
code. The character LCD shows `CARD?` on its last row. Both come from
`DIAG`, entered after card initialisation or container mounting fails
(`src/boot.asm:632-640`, `src/text.asm:14-16`, `src/lcd.asm:66-80`). The initialisation codes are
`01h` to `04h` and `0Bh`. Container errors are `20h` to `2Ah`
(`src/sd.asm:12-26`, `src/vol.asm:11-30`).

At `R retry> ` you can type a single key. The routine echoes its original
case and ends the line. Either `R` or `r` restarts the card operations. Every other key produces
another prompt so a digit appears unchanged even though the comparison uses a
masked value (`src/boot.asm:642-653`, `src/text.asm:15`).

Your available console determines where you can answer. Cold boot selects the
PICO9918 screen when that display responds and the Matrix switch enables
the keyboard.
Otherwise it selects serial. The GLCD console driver is on the card and has
not been loaded at this point (`src/console.asm:31-52`,
`src/video.asm:18-24`, `src/pico.asm:53-68`). A board with neither an active
PICO9918 console nor an attached terminal shows only `CARD?` on the LCD.

In this retained model capture the socket is empty and the console is the
PICO9918 with its matrix keyboard. Typing `H` produces another prompt.
Serial output is empty. The screen capture is historical `78127ec` evidence:

<!-- node tools/capture.mjs --card none --board pico --screen H -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 01
R retry> H
R retry>
```

`R` returns to `COLDRT`. That entry resets the BDOS stack and initialises the
20 × 4 LCD to clear `CARD?`. It then calls `SDINIT` and `MOUNT` again.
You can insert or correct the card while the prompt waits.
The retry needs no board reset (`src/boot.asm:92-100`, `652-652`).
`MOUNT` reads the container table afresh rather than accepting cached table
bytes (`src/vol.asm:42-47`, `376-418`). [Appendix D](appendix-d-error-messages.md)
lists each code's cause and remedy.

The banner appears before either card operation. The RAM check, console
initialisation and clock probe precede it (`src/boot.asm:60-77`). A board
without the required RAM stops at `TEC-OS needs 64K RAM` on serial
(`src/boot.asm:417-470`, `src/text.asm:11`). [Chapter 15](15-reset-and-boot.md#ram-before-the-workspace) explains that check.
`COLDRT` and `DIAG` use the BDOS stack before the CCP runs. Both failure
jumps follow completed calls so `DIAG` starts at that stack's top
(`src/boot.asm:66-66`, `92-100`, `622-640`).

A recognised reset can retain the selected volumes through a failed mount and
retry. `RSLCAP` copies the drive table before the cold clears. `RSLBUF`, its
scratch buffer, is at `0100h` in fixed RAM (`src/boot.asm:41-58`, `211-216`,
`src/layout.asm:121-133`). That buffer survives the route to `DIAG`: `MEMINIT`
clears EXPAND 1 and the mount uses a line in the block cache there for table
reads (`src/boot.asm:77-77`, `232-249`, `src/vol.asm:32-47`).
[Chapter 15](15-reset-and-boot.md#retained-drive-selection) explains recognition
and reselection.

## The diagnostics ROM

The card prompt diagnoses card startup and mounting. For memory, display,
serial and other device checks, the separate diagnostics image runs in
place of TEC-OS at `C000h–FFFFh`. It is 16 KiB and needs neither TEC-OS nor
a console driver to start. A card is optional for starting the ROM, though
its SD tests need one (`diag/diag.asm:1-16`, `diag/boot.asm:8-47`,
`diag/sd.asm:331-343`).

From the prepared host checkout of [Chapter
26](26-build-the-rom-and-media.md), the build command is:

```sh
npm run diag
```

The original chapter recorded the following build output at `78127ec`.
It identifies the image used in the retained report below. A build from a
later source revision must establish its own identity:

```text
diag: ROM 16318/16384 bytes, 56 free, image D90143609F53FAAB, checksum $47C0
```

`tools/diag.mjs` validates the selected TEC Compact font, its retained
original inputs and complete notices before generating files or assembling
(`tools/diag.mjs:103-110`, `tools/lib/font-package.mjs:8-21`). It then generates
`diag/gen/config.asm` and `diag/gen/font.asm`. The configuration contains
the version, serial delay counts and stopwatch constants. The font comes
from `format/font5x7.txt`, also used for the TEC-OS font (`tools/diag.mjs:52-78`). The serial counts
are derived from 4 MHz and 4800 baud (`tools/diag.mjs:38-50`). The script
assembles `diag/diag.asm` with TAS by default. Setting
`TECOS_ROM_ASSEMBLER=atom` selects the ATOM reference backend. It fills unused
image bytes with `FFh` and writes `build/diag/diag.rom`,
`build/diag/diag.d8.json` and `build/diag/diag.json`, with the separate
`build/diag/FONT-NOTICES.txt` companion
(`tools/diag.mjs:91-146`).

The report's image ID identifies the ROM whose results you are comparing.
It is the first eight bytes of a SHA-256 calculated with
`FFF6h–FFFFh` blanked to `FFh`. The build stores that ID at `FFF6h–FFFDh`.
Both the banner and the final report print it (`tools/diag.mjs:26-29`,
`84-89`, `126-128`, `diag/out.asm:111-120`, `757-763`). The word at
`FFFEh` is a separate 16-bit sum of `C000h–FFFDh`. T05 recalculates that sum
and compares it with the stored word (`tools/diag.mjs:129-132`,
`diag/memory.asm:201-233`).

Before writing the image, the build checks its entry points and reserved areas.
RESET must be at `C000h`, INT38 at `C038h` and NMIROM at `C066h`. COLD and START
must be within the first 2 KiB, visible through the boot overlay. CODEEND may
reach the image ID's address but must not exceed it. Variables must end by
`7F00h`. The non-maskable interrupt (NMI) handler copied to `0066h` must fit
within `38h` bytes (`tools/diag.mjs:117-125`).

At reset, the board maps the first 2 KiB of ROM at `0000h`. The reset code
jumps to COLD at its ROM address and removes the overlay
(`diag/boot.asm:8-34`). COLD installs an immediate `RETN` at `0066h` then
turns off the digits, speaker and 8 × 8 LEDs and deselects the SD card
(`diag/boot.asm:36-47`). The diagnostics variables occupy
`7E00h–7EFFh` and the stack occupies `7F00h–7FFFh`, both in fixed RAM
(`diag/defs.asm:56-57`).

## The run

Every later test uses the variables and stack at `7E00h–7FFFh`. T01 first
checks those pages using registers alone, before any stack use. Four passes
fill and verify an address-derived pattern (`diag/boot.asm:49-86`). A
failure produces a serial line without using the stack. It contains
`T01 HOME    FAIL  RAM 7E00-7FFF at `, the four-digit address,
` wrote ` and the written byte, then ` read ` and the byte read
(`diag/boot.asm:88-154`).

After a failure the ROM repeats that line indefinitely. The delay has 16
passes of a 65,536-iteration loop. Each iteration costs 26 T-states except
the final iteration, which costs 21. Counting the surrounding instructions
from HCWAIT through `JR HCMSG` gives 27,263,278 T-states
(`diag/boot.asm:144-151`). This is static instruction counting. At the
nominal 4 MHz it gives about 6.8 seconds of delay so the line repeats about
every seven seconds. It is not a new board timing measurement.

After T01 passes the ROM clears its variables, installs an NMI counter at
`0066h`, reads the Matrix switch and prints the banner
(`diag/main.asm:8-32`). It waits about five seconds for a key. `I` or `Y`
includes the interactive tests. Another key or the timeout selects automatic
tests alone (`diag/main.asm:33-49`). GETKEY polls serial, the hex keypad
and, when enabled by the Matrix switch, the matrix keyboard. Its timeout
unit is half a second. The keypad's `+` means `Y`, `-` means `N`, `GO` is
Return and `AD` is Esc (`diag/out.asm:242-329`).

Each test begins with a `-- T` heading, its number and its title. The LCD's
second row shows the number and seven-character name
(`diag/out.asm:653-674`). RESULT prints the number, name, result and
following details. While recording is enabled, OUTC also copies each
character to the report buffer at `1000h`, stopping before `3000h`
(`diag/out.asm:52-65`, `681-734`, `diag/defs.asm:54-55`). The LCD's third
row shows the result. Its fourth row displays running PASS, FAIL, INFO and
SKIP totals (`diag/out.asm:607-630`, `712-721`). The six result codes have
these meanings (`diag/defs.asm:68-74`, `diag/out.asm:724-729`):

| Result | Meaning |
| --- | --- |
| `PASS` | The board did what the test checks |
| `FAIL` | It didn't. The line gives what was expected and what was read |
| `INFO` | A value measured, with no verdict |
| `SKIP` | The test wasn't run |
| `LOOK` | A check by eye or ear in an automatic run, for the person at the board |
| `NONE` | The device isn't fitted or doesn't answer |

The automatic model comparison has its own configuration. It uses the
PICO9918 and matrix keyboard, RAM initially filled with `76h` and an empty
SYSTEM/WORK card with the starter's two volume geometries. It has no
DS1302 clock (`tools/diag-check.mjs:110-134`). This is a generated test card,
not the actual starter card with its applications and startup file.
[Chapter 28](28-the-host-model-as-evidence.md) explains the host model.
The retained reproduction recipe calls modelReport directly:

```sh
node --input-type=module -e '
import { modelReport } from "./tools/diag-check.mjs";
modelReport("build/diag/diag.rom");
'
```

modelReport keeps the serial log beside the image and reuses an existing
log with that image ID (`tools/diag-check.mjs:110-134`). The historical file
`build/diag/model-report-D90143609F53FAAB.txt` begins as follows. Its values
remain model evidence from `78127ec`:

```text


TEC-1G diagnostics 0.2 image D90143609F53FAAB
RAM 7E00-7FFF (variables and stack) passed.
Press I, Y or keypad + within 5 s to include the interactive tests.
Automatic tests only.
RAM tests take about 6 s. Keep off the keypad: its NMI would
land in the RAM under test.

-- T01 RAM 7E00h-7FFFh, before any stack use
T01 HOME    PASS  4 passes, registers only

-- T02 Fixed RAM 0000h-7DFFh, 4 pattern passes
T02 RAMLO   PASS  all bits both ways, no aliasing
```

## The tests

The automatic call sequence fixes the order. T35 and T36 run after T18, with
T37 after T20 (`diag/main.asm:60-91`). T02–T04 run before T01's result is
printed because their RAM tests overwrite the report-buffer area. Their
saved results are printed after T01 (`diag/main.asm:47-68`,
`diag/memory.asm:100-158`). The selected interactive tests follow T26.
You can also start them later with `I` at the report prompt
(`diag/main.asm:92-123`).

The complete list gives each test's name and TBEGIN title. A title describes
the operation under test, not a passing result (`diag/out.asm:649-674`).
T01's result is emitted by the main sequence (`diag/main.asm:60-66`).

<!-- Test title definitions at 962853f:
(`diag/memory.asm:148-158`, `201-260`, `316-350`,
`403-454`, `499-500`, `607-608`, `diag/display.asm:6-7`, `63-64`,
`285-286`, `406-407`, `746-747`, `851-852`, `909-910`,
`diag/sd.asm:331-332`, `472-473`, `656-657`, `diag/misc.asm:47-48`,
`455-456`, `512-513`, `580-581`, `609-610`, `640-641`,
`diag/interact.asm:71-72`, `144-145`, `264-265`, `380-381`, `421-422`,
`571-572`, `703-704`, `758-759`) -->

| Test | Name | Title |
| --- | --- | --- |
| T01 | `HOME` | RAM 7E00h-7FFFh, before any stack use |
| T02 | `RAMLO` | Fixed RAM 0000h-7DFFh, 4 pattern passes |
| T03 | `RAMWIN` | Window RAM 8000h-BFFFh, EXPAND off, 4 passes |
| T04 | `RAMHOME` | RAM 7E00h-7FFFh again, 4 passes, stack in the window |
| T05 | `ROMSUM` | ROM C000h-FFFDh sums to the word at FFFEh |
| T06 | `ROMWR` | Writes to ROM are ignored |
| T07 | `OVERLAY` | Latch bit 0: ROM C000h-C7FFh appears at 0000h-07FFh |
| T08 | `OVLWR` | A write to 07FFh with the overlay on |
| T09 | `PROTECT` | Latch bit 1: 4000h-7FFFh read-only, 3FFFh writable |
| T10 | `LATCHRD` | Reading port FFh after writing it |
| T11 | `STATUS` | Port 03h for latch values 01h, 03h, 05h, 81h |
| T12 | `BANKS` | What each bank field value (latch bits 3-6) selects |
| T13 | `BANKRAM` | Each distinct bank, 8000h-BFFFh, 2 passes |
| T14 | `SERTX` | Serial TX at 4800 8N2: two known lines follow |
| T15 | `LCD` | HD44780 at 04h/84h: busy flag, DDRAM read-back |
| T16 | `GLCD` | ST7920 at 07h/87h: busy flag, graphics RAM read-back |
| T17 | `VDP` | PICO9918 at BEh/BFh: VRAM size, speed, 80 columns |
| T18 | `VDPCLK` | PICO9918 frame flag as a clock: 16 frames |
| T35 | `VDPPAGE` | PICO9918 page select: R2 07h and 0Bh |
| T36 | `F18A` | F18A identity, version and vertical scroll |
| T19 | `SD` | SD card on FDh: initialise, CSD, CID, block 0 |
| T20 | `SDBLKS` | Blocks 0-63: errors and token waits |
| T37 | `SDWRITE` | SD write on block 7, outside every volume, then restored |
| T21 | `RTC` | DS1302 on FCh (optional): time, ticking, clock check |
| T22 | `SEG7` | 7-segment: each segment, then each digit |
| T23 | `SPEAKER` | Speaker: 600, 1200 and 2400 Hz for 0.3 s each |
| T24 | `RGB8X8` | 8 x 8 matrix on 05h/06h/F8h/F9h |
| T25 | `LEDBAR` | Latch FFh on the STATUS LED bar and the CAPS lamp |
| T26 | `NMI` | NMIs during the automatic tests (none expected) |
| T27 | `SERRX` | Serial RX: typed characters come back |
| T28 | `SERBIT` | The terminal's bit time from typed U |
| T29 | `KEYPAD` | Hex keypad on 00h: every key and Shift |
| T30 | `KEYNMI` | NMIs taken for those keypad presses |
| T31 | `MATRIX` | Matrix keyboard on FEh: row and bit of each key |
| T32 | `JOY` | Joystick on FEh with A11 low |
| T33 | `CLOCK` | CPU clock by stopwatch, about 60 s |
| T34 | `SDTIME` | SD read rate by stopwatch: 256 blocks, 128 KiB |

Some tests use the same low-level method as TEC-OS. Serial output is
bit-banged (`diag/out.asm:1-29`, `src/console.asm:10-14`). T19 follows the
CMD0, CMD8, ACMD41 and CMD58 card-start sequence and records replies.
Both initialisers also use CMD16 for a byte-addressed card. The diagnostics
version omits some production validation. TEC-OS verifies the CMD8 echo and
CMD55 result before continuing
(`diag/sd.asm:122-223`, `src/sd.asm:183-323`).

T17 uses the same two-pattern PICO9918 probe and selects the console's
supported 80-column text mode (`diag/display.asm:385-429`, `src/tms.asm:13-41`).
T35 checks the page switching that console uses
(`diag/display.asm:845-898`). T03 checks the U9 window with EXPAND off.
T12 maps the additional bank
selection and T13 pattern-tests each distinct bank. T07 checks the boot
overlay and T11 records status-port bits (`diag/memory.asm:100-117`,
`259-343`, `448-484`, `487-665`).

Only T37 writes the SD card. It requires the `TECOSVOL` magic in block 0,
saves block 7 and tests a pattern there. Volume payloads begin at nonzero
multiples of eight blocks so block 7 is outside every volume
(`diag/sd.asm:645-717`, `src/vol.asm:234-243`,
`format/format.json:43`). That does not mean it is always unused: a large format-1.1 descriptor table can extend through
blocks 1–7 (`tools/lib/container.mjs:33-42`).

On success T37 writes the saved block back and checks it. Restoration can
fail and the result includes `restore failed` or `restore read back wrong`
as appropriate (`diag/sd.asm:697-764`). Use a writable prepared card whose
image you have kept. The magic check alone is not full container validation.

## The report

PRREP prints the report heading, version and image ID, stored result lines,
totals and end marker (`diag/out.asm:757-809`). The ROM then prints
`R prints the report again; I runs the interactive tests.` and waits for
one of those keys (`diag/main.asm:95-110`). The following complete report
is retained from the same historical model log:

```text
==== TEC-1G DIAGNOSTICS REPORT ====
ROM diag 0.2 image D90143609F53FAAB, 4800 8N2, times in T-states (4 MHz nominal), error counts expect 0
T01 HOME    PASS  4 passes, registers only
T02 RAMLO   PASS  all bits both ways, no aliasing
T03 RAMWIN  PASS  all bits both ways, no aliasing
T04 RAMHOME PASS  all bits both ways, no aliasing
T05 ROMSUM  PASS  sum 47C0 stored 47C0
T06 ROMWR   PASS  wrote 5A at CDB4, expect A5, read A5
T07 OVERLAY PASS  07FF read CD (ROM C7FF CD), 0800 read AB (RAM, expect AB)
T08 OVLWR   INFO  reaches the RAM underneath; read under overlay CD
T09 PROTECT PASS  wrote A5 over 5A, expect 5A 5A A5: 4000 5A 7DFF 5A 3FFF A5
T10 LATCHRD INFO  01>01 05>05 0D>0D 81>81 reads back
T11 STATUS  INFO  01>C1 03>C3 05>C5 81>C1 (bit 7 RX, 6 KDA)
T12 BANKS   INFO  field 0-F: 0122446688AACCEE (B base, - none); 9 banks + base
T13 BANKRAM PASS  9 banks pass
T14 SERTX   LOOK  TX bit 833 T, stop bits 1691 T
T15 LCD     PASS  read-back errors 0/20, clear busy 128 polls x 50 T
T16 GLCD    LOOK  read-back errors 0/1024, clear busy 127 polls x 50 T, pattern drawn
T17 VDP     LOOK  tags 11 22 33 44 (11 22 33 44 = 16K); errors at 16 T/byte 0, at 104 T/byte 0 (of 16384, then 1920)
T18 VDPCLK  INFO  frame 79999 T; CPU at 50 Hz 3999950 Hz, at 60 Hz 4799940 Hz
T35 VDPPAGE LOOK  R2 0Bh for page 2000h, 07h for 1000h; left at 07h
T36 F18A    INFO  not F18A-compatible: SR1 read 00 (F18A E0h-EFh), locked 80
T19 SD      PASS  v2 SDHC/XC, CMD0 x1, R7 00 00 01 AA, ACMD41 x2, OCR C0 00 00 00, block 0 ends 0000, token polls 0
T20 SDBLKS  PASS  block 0 twice same; 64 blocks, errors 0, token polls min 0 max 0 (x678 T)
T37 SDWRITE PASS  pattern read back, block restored; busy polls 1
T21 RTC     NONE  no DS1302 (read FF)
T22 SEG7    LOOK  segment bits a01 b08 c20 d80 e40 f02 g04 dp10 on port 02h
T23 SPEAKER LOOK  port 01h bit 7
T24 RGB8X8  LOOK  rows on 05h, red 06h, green F8h, blue F9h
T25 LEDBAR  LOOK  01 03 05 09 11 21 41 81 00 01
T26 NMI     PASS  0 taken through 0066h
TOTAL PASS 14 FAIL 0 INFO 6 SKIP 0 LOOK 8 NONE 1
==== END ====
```

Three INFO lines record model behaviours that a board need not share.
T08's write under the overlay reaches RAM. T10 reads back port `FFh`.
T12's latch field selects nine banks plus the base
(`diag/memory.asm:316-343`, `403-446`, `487-561`). The board documentation describes a write-only latch with
bits 3–6 unconnected to U9. It selects ROM rather than RAM for an overlay write,
as recorded in `docs/diagnostics.md:142-164`, `185-199`. Those are documented
expectations, not observations of a board made for this chapter.

TEC-OS uses a shadow latch byte at `0040h` instead of reading port `FFh`.
Its EXPAND-1 selection uses bit 2, not the extra bank field
(`src/layout.asm:19-28`, `src/abi.inc:286-289`, `src/layout.asm:64-69`, `src/abi.inc:291-293`). The reset path removes the overlay
before writing low RAM (`src/boot.asm:35-59`). These choices avoid reliance
on the disputed latch read-back, extra bank decoding and overlay-write
behaviour. T12 still has a useful board result: its map determines which
RAM T13 will test (`diag/memory.asm:607-665`).

## Comparing a board's report with the model's

A physical run needs the board preparation described in
`docs/board-run.md`. The following settings retain the original procedure.
They are instructions for collecting board evidence, not a record that this
chapter's model results were observed on hardware.

1. Burn `diag.rom` into both halves of a 32 KiB ROM chip, at `0000h` and
   `4000h`, so that the ROM Lo/Hi switch runs it in either position. Fit the
   chip in place of MON-3.
2. Fit a 32 KiB RAM in U9, as TEC-OS needs. Without it T03 fails and the tests
   of EXPAND 1 have no RAM to test.
3. Set the CPU clock switch to FAST with the 4 MHz oscillator. Set the Matrix
   switch on if the matrix keyboard is fitted.
4. Connect a terminal program to the FTDI port at 4800 baud, 8 data bits, no
   parity and 2 stop bits, with its session log on.
5. Write the starter card's image to an SD card and put it in the adaptor so
   that T19, T20 and T37 have a TEC-OS card to read.
6. Press reset. Press `I` on the terminal or `+` on the keypad within 5 seconds
   for the interactive tests.
7. Keep off the hex keypad during the RAM tests, T09 and T25, except to answer a
   question.

The keypad restriction concerns the return from an NMI. With its jumper fitted,
a keypad press makes the Z80 push a return address and jump to `0066h`. The
diagnostics RAM tests overwrite that handler. T09 and T25 instead enable PROTECT
over the stack page so an NMI cannot store its return address there
(`diag/memory.asm:100-110`, `345-371`, `diag/misc.asm:604-626`). The counter
handler normally preserves registers and uses RETN (`diag/main.asm:129-151`).
Overwritten code or a lost return address prevents that normal path. TEC-OS
itself installs no NMI handler and uses `0066h` within its default file control
block (FCB) area. Its normal setup has the keypad NMI jumper off
(`src/boot.asm:52-58`, `326-368`, `src/cpm/ccp.asm:21-22`), as [Appendix
G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi) explains.

Keep the terminal's complete session log from the banner through the last
`==== END ====`. The comparison command takes that file:

```sh
node tools/diag-check.mjs board-log.txt
```

The checker selects the last report in the log and checks its image ID
against `build/diag/diag.rom`. An absent report or different ID ends with
status 2 (`tools/diag-check.mjs:49-62`, `136-152`). It then compares the
board's result lines with the automatic model report for that same image
(`tools/diag-check.mjs:82-107`, `153-159`).

A matching result and detail produce no difference. A board's visual PASS
can match the model's LOOK. For measured lines, the checker matches the
form of the details and prints the board's values beside the model's.
T14 supplies bit times and T15/T16 supply busy polls. The other patterns
cover T18's frame, T19's card answers, T20/T37 polls and T21's clock
(`tools/diag-check.mjs:36-47`, `96-104`). Different numeric values can
therefore pass the comparison. It does not establish that every reported timing is acceptable on your board.

Other differences include the affected TEC-OS behaviour, taken from the
last table in `docs/board-run.md` (`tools/diag-check.mjs:65-73`, `104`).
Lines from board tests absent from the automatic model run are printed as
`not compared, no model run`. A missing end marker is reported as a cut-short
log. Neither condition alone forces a failure status: the command exits 0
when its differences list is empty and 1 otherwise
(`tools/diag-check.mjs:87-106`, `153-159`). You still need to inspect the
uncompared and incomplete parts of the log.

A board following its documented circuit can differ on T08, T10 and T12.
The dependency descriptions assign no TEC-OS effect to the first two.
T12 concerns EXPAND 1, whose discovered banks receive T13's pattern tests
(`docs/board-run.md`, `diag/memory.asm:607-665`). An actual board report
can establish agreement for the conditions tested.
Those include the addressed RAM, reset overlay, EXPAND-1 bank and serial
output, along with card replies and device operations. The matching lines
must remain attached to that board's configuration and the diagnostic image ID.
