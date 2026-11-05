---
title: Diagnostics
parent: TEC-OS
nav_order: 26
nav_group: "Part II: Inside TEC-OS"
---

# 26. Diagnostics

<!-- Checked against TEC-OS 78127ec. The diagnostics ROM in this chapter is version
     0.2, image `D90143609F53FAAB`, as `npm run diag` builds it from that commit. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

Cold boot stops in one place. When the card won't start or its container
won't mount, TEC-OS waits at a diagnostic prompt with a code. Everything else
that can be wrong with a board is tested by a second image, the diagnostics
ROM. It is burned in place of TEC-OS and prints a report over the serial port.
The prompt comes first, then the ROM, its run on the model, and the comparison
of a board's report with the model's.

## The diagnostic prompt

Cold boot sets up the 20 × 4 LCD and the card at `COLDRT`, on the BDOS's
stack, which nothing else uses before the CCP runs (`src/boot.asm:119-123`). It
starts the card with `SDINIT` and checks the container with `MOUNT`. A
failure of either jumps to `DIAG` with an error code in `A`
(`src/boot.asm:127-132`). The code is one of `SDINIT`'s, `01h` to `04h` and
`0Bh`, or one of `MOUNT`'s, `20h` to `2Ah` (`src/sd.asm:16-31`,
`src/vol.asm:25-43`). The banner is printed before the card is touched
(`src/boot.asm:97-99`), so it appears whatever the card holds. Only the RAM
check, the console's start and the clock's test come before the banner
(`src/boot.asm:71-96`). A board with less than 64 KiB stops in the RAM check
with `TEC-OS needs 64K RAM` on the serial port, as [Chapter
15](15-reset-and-boot.md#the-ram-check) describes.

`DIAG` runs on the BDOS's stack as `COLDRT` set it. Both jumps to `DIAG` are
`COLDRT`'s, made after its calls have returned, so the stack is at its top
(`src/boot.asm:757-774`). `DIAG` writes `CARD?` on the LCD's last row
(`src/boot.asm:775-777`, `src/text.asm:15`) and then prints `No volume
mounted, error ` and the code as two hexadecimal digits
(`src/boot.asm:778-784`, `src/text.asm:13`).

At the prompt `R retry> ` (`src/text.asm:14`), `DIAG` reads one key with
`BCONIN`, echoes it as typed and ends the line. Only then does it turn a small
letter into a capital for the test. So `r` retries too, and a digit echoes as
the digit (`src/boot.asm:786-798`). Any key but `R` gives the prompt again
(`src/boot.asm:801-802`). On a board with the PICO9918 and the matrix keyboard the
console is the ROM's PICO9918 console, which cold boot starts before the
banner (`src/video.asm:16-27`, `src/pico.asm:50-82`). The prompt is then on
that screen, and the key comes from the matrix keyboard. On any other board
the console is the serial terminal, since the graphics LCD's driver is on the
card. A board with no PICO9918 and no terminal attached shows only the LCD's
`CARD?`. Here the model has a PICO9918 and an empty socket, and `H` was typed
at the prompt. The serial terminal shows nothing, and the screen shows:

<!-- node tools/capture.mjs --card none --board pico --screen H -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 01
R retry> H
R retry>
```

`R` jumps back to `COLDRT` (`src/boot.asm:798-800`). That starts the LCD
again, which clears `CARD?`, and then repeats the card's start and the mount.
A card fixed or put in while the prompt waits is mounted without a reset.
`MOUNT` reads each block of the table from the card again, whatever a cache
line holds (`src/vol.asm:56-65`).

The retry keeps a selection of volumes carried over from a recognised reset,
which [Chapter 15](15-reset-and-boot.md#the-reset-test) explains. `RSLCAP`
copies the drive table to `RSLBUF` before cold boot clears anything
(`src/boot.asm:59-60`). `RSLBUF` is at `0100h`, in the fixed RAM
(`src/layout.asm:147`), and nothing on the path from there to the prompt
writes it. `MEMINIT` clears EXPAND 1 alone, and the mount reads the table into
a line in EXPAND 1 (`src/boot.asm:100-102`, `src/boot.asm:302-332`). [Appendix
D](appendix-d-error-messages.md) gives each code's cause and remedy.

## The diagnostics ROM

The diagnostics ROM is a second 16 KiB image for `C000h–FFFFh`, made to be
burned in place of TEC-OS. It tests the board, and it needs no card, no
console driver and no TEC-OS. One command builds it:

```sh
npm run diag
```

```text
diag: ROM 16318/16384 bytes, 56 free, image D90143609F53FAAB, checksum $47C0
```

`tools/diag.mjs` generates two files first (`tools/diag.mjs:51-77`).
`diag/gen/config.asm` holds the version, the serial delay counts and the
stopwatch constants, and `diag/gen/font.asm` comes from `format/font5x7.txt`,
the file the TEC-OS ROM's own font is built from. The serial delays are worked
out from 4 MHz and 4800 baud as for TEC-OS (`tools/diag.mjs:37-49`). The script
then assembles `diag/diag.asm` with the selected backend, TAS by default or ATOM
with `TECOS_ROM_ASSEMBLER=atom`, fills the unused bytes with `FFh` and writes
`build/diag/diag.rom`, its symbol map and `build/diag/diag.json`
(`tools/diag.mjs:90-143`).

Two values in the image identify it, so that a report names the image that
produced it and a test can check the ROM on the board. The image ID is the
first 8 bytes of the SHA-256 of the image with its last 10 bytes,
`FFF6h–FFFFh`, set to `FFh` (`tools/diag.mjs:25-28`, `tools/diag.mjs:83-88`).
The build stores it at `FFF6h` (`tools/diag.mjs:126`), and the banner and the
report both print it. The last two bytes, at `FFFEh`, hold the 16-bit sum of
`C000h–FFFDh` (`tools/diag.mjs:127-130`), which test T05 checks on the board.

The build checks the image before writing it (`tools/diag.mjs:115-123`). The
reset entry must be at `C000h` and the interrupt entries at `C038h` and
`C066h`. Cold boot and the first RAM check must lie in the first 2 KiB, which
is all the board shows at `0000h` after a reset. The code must end below the
image ID and the variables below the stack's page. The NMI handler the ROM
copies to `0066h` must be at most `38h` bytes, so that it fits in page zero.

The ROM starts as TEC-OS does. At reset the board's boot overlay shows the
first 2 KiB of the ROM at `0000h`. The code there jumps to `COLD` at its
`C000h` address and turns the overlay off (`diag/boot.asm:8-27`). `COLD` first
puts a `RETN` at `0066h`, so that an NMI returns at once, and then turns off
the digits, the speaker, the 8 × 8 LEDs and the SD card
(`diag/boot.asm:29-40`). The ROM's own variables are at `7E00h–7EFFh` and its
stack at `7F00h–7FFFh`, in the fixed RAM (`diag/defs.asm:43-44`).

## The run

Every later test depends on `7E00h–7FFFh`, so test T01 checks those two pages
first, with no stack and registers alone. It makes four passes, each filling
them with a pattern derived from the address and reading it back
(`diag/boot.asm:43-73`). On a failure the ROM sends one line to the serial port,
again without a stack, from the pattern `HCTEXT` (`diag/boot.asm:127-128`). The
line is `T01 HOME    FAIL  RAM 7E00-7FFF at `, the failing address in four
hexadecimal digits, ` wrote ` and the byte written, then ` read ` and the byte
read. The ROM then waits and sends the line again, for ever
(`diag/boot.asm:118-125`). The wait makes 16 passes of a 65,536-iteration loop.
Each iteration takes 26 T-states except the last, which takes 21. Counting the
surrounding instructions from `HCWAIT` through `JR HCMSG` gives 27,263,278
T-states. On a board the line therefore comes back about every 7 seconds.

With those pages proved, the ROM clears its variables, installs an NMI handler
at `0066h` that counts NMIs, reads the Matrix switch and prints its banner
(`diag/main.asm:4-28`). It then waits about 5 seconds for a key
(`diag/main.asm:29-35`). `I` or `Y` selects the interactive tests as well as
the automatic ones. Anything else, or nothing, runs the automatic tests alone.
`GETKEY` takes a key from the serial port, from the hex keypad, or from the
matrix keyboard when the Matrix switch is on (`diag/out.asm:241-273`). Its
time-out is counted in half seconds. On the keypad `+` reads as `Y`, `-` as `N`,
`GO` as Return and `AD` as Esc (`diag/out.asm:326`).

Each test starts with `TBEGIN`, which prints `-- T`, the test's number and
its title (`diag/out.asm:637-658`). The LCD's second row shows the number and
the test's seven-character name. Each test ends with one result line from
`RESULT`: `T`, the number, the name, one of six results and the details
(`diag/out.asm:663-711`). While a result line is printed, every character is
also kept in the report buffer at `1000h` (`diag/out.asm:49-62`,
`diag/defs.asm:41`). The LCD's third row shows the result and its fourth the
running totals (`diag/out.asm:592-615`). The six results are these
(`diag/defs.asm:50-56`, `diag/out.asm:706-711`):

| Result | Meaning |
| --- | --- |
| `PASS` | The board did what the test checks |
| `FAIL` | It didn't. The line gives what was expected and what was read |
| `INFO` | A value measured, with no verdict |
| `SKIP` | The test wasn't run |
| `LOOK` | A check by eye or ear in an automatic run, for the person at the board |
| `NONE` | The device isn't fitted or doesn't answer |

`tools/diag-check.mjs` runs the ROM on the host model of Chapter 27 and keeps
what the serial port printed in `build/diag` beside the image. The model has
the PICO9918, the matrix keyboard, a new card with the starter card's two
volumes, empty, and no DS1302 clock (`tools/diag-check.mjs:110-134`). One
Node.js command makes that run on its own:

```sh
node --input-type=module -e '
import { modelReport } from "./tools/diag-check.mjs";
modelReport("build/diag/diag.rom");
'
```

Its file, `build/diag/model-report-D90143609F53FAAB.txt`, starts like this:

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

The automatic tests run in the order `diag/main.asm:56-87` calls them. T35
and T36 follow T18, and T37 follows T20. The RAM tests T02 to T04 run before
T01's line is printed, and their lines come after it. The interactive tests
run after T26 when they were chosen at the start, or later from the report's
prompt (`diag/main.asm:88-119`). Each test's title is the text its `TBEGIN`
prints:

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

The tests reach the hardware as TEC-OS does, where TEC-OS has a way. The serial
output is bit-banged as TEC-OS's is (`diag/out.asm:10-28`). T19's card start
follows TEC-OS's SD command sequence while recording the replies
(`diag/sd.asm:115-212`, `src/sd.asm:209-371`). T17 detects the PICO9918 as
TEC-OS does and selects the 80-column text mode used by the console
(`diag/display.asm:334-346`, `diag/display.asm:349-372`, `src/tms.asm:17-46`).
T35 checks the page flip that console uses (`diag/display.asm:751-803`). The
others measure what TEC-OS requires of the board. T03 measures the RAM in socket
U9 that holds EXPAND 0, and T12 and T13 the bank behind EXPAND 1. T07 measures
the boot overlay that cold boot starts through, and T11 the bits of port `03h`.

Only T37 writes to the card. It writes block 7, and only on a card whose block
0 holds `TECOSVOL` (`diag/sd.asm:616-683`). No volume can use that block,
since every volume starts at a nonzero multiple of 8 blocks. T37 puts the
block back afterwards.

## The report

After the last test, `PRREP` prints the report (`diag/out.asm:737-789`). It
has a heading, a line with the version and the image ID, every result line
kept in the buffer, the totals and an end line. The ROM then prints `R prints
the report again; I runs the interactive tests.` and waits for one of those
keys (`diag/main.asm:91-106`). The model's run, from the same file, ends with
this report:

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

These answers show what the model does, and on three lines they say nothing
about a board. T08 says a write under the overlay reaches the RAM underneath.
T10 says port `FFh` reads back what was written to it. T12 says that the
latch's bits 3 to 6 select nine banks. `docs/diagnostics.md` compares each
test with the TEC-1G's own documents. The documents describe the latch as
write-only and bits 3 to 6 as unconnected to U9, and they select the ROM, not
the RAM, for a write under the overlay. A board can therefore answer all three
differently. TEC-OS depends on none of them. It keeps a copy of the latch at
`0040h` and never reads port `FFh` (`src/layout.asm:23-24`,
`src/layout.asm:62-70`). It selects EXPAND 1 with bit 2 alone
(`src/layout.asm:33-34`), and it never writes below `0800h` while the overlay is
on.

## Comparing a board's report with the model's

`docs/board-run.md` lists the board's settings for a run, which are the ones
TEC-OS needs:

1. Burn `diag.rom` into both halves of a 32 KiB ROM chip, at `0000h` and
   `4000h`, so that the ROM Lo/Hi switch runs it in either position. Fit the
   chip in place of MON-3.
2. Fit a 32 KiB RAM in U9, as TEC-OS needs. Without it T03 fails, and the
   tests of EXPAND 1 have no RAM to test.
3. Set the CPU clock switch to FAST with the 4 MHz oscillator. Set the Matrix
   switch on if the matrix keyboard is fitted.
4. Connect a terminal program to the FTDI port at 4800 baud, 8 data bits, no
   parity and 2 stop bits, with its session log on.
5. Write the starter card's image to an SD card and put it in the adaptor, so
   that T19, T20 and T37 have a TEC-OS card to read.
6. Press reset. Press `I` on the terminal or `+` on the keypad within 5
   seconds for the interactive tests.
7. Keep off the hex keypad during the RAM tests, T09 and T25, except to answer
   a question.

The keypad's warning has the same cause as TEC-OS's. With the keypad NMI
jumper fitted, a key press makes an NMI, and the Z80 pushes its return address
and jumps to `0066h`. During the RAM tests the patterns under test overwrite
the NMI handler at `0066h`. In T09 and T25 the latch's PROTECT bit makes the
stack's page read-only, so the pushed return address is lost. TEC-OS has no
NMI handler and runs with that jumper off, as [Appendix
G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi) describes.

The terminal's session log holds the whole run, from the banner to the last
`==== END ====`, and the report in it is the one `tools/diag-check.mjs` reads:

```sh
node tools/diag-check.mjs board-log.txt
```

It first checks that the report's image ID is the one in
`build/diag/diag.rom`. If it isn't, it stops with exit status 2
(`tools/diag-check.mjs:148-152`). It then compares each result line with the
model's (`tools/diag-check.mjs:82-107`). A line whose result and details both
match is passed over. A visual check answered `PASS` on the board matches the
model's `LOOK`. Lines that carry measured values are compared by the form of
their details, and the board's numbers are printed beside the model's
(`tools/diag-check.mjs:36-47`). These are T14's bit times, T15's and T16's
busy polls, T18's frame, T19's card answers, T20's and T37's polls and T21's
clock. Every other difference is printed with the TEC-OS behaviour it
affects, taken from the last table in `docs/board-run.md`
(`tools/diag-check.mjs:65-73`). The exit status is 0 with no differences and 1
with some.

A board built as its documents describe differs from the model on T08, T10
and T12. The printed lines say what each affects: nothing for T08 and T10,
and EXPAND 1 for T12, which T13's pattern passes then settle. Every other line
that matches says the board did what the model did on a point TEC-OS depends
on. Those points are the RAM at every address it uses, the overlay it boots
through, the bank behind EXPAND 1, the serial rate, the card's answers to its
own driver and each device it drives.
