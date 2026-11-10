---
title: G. The TEC-1G as TEC-OS uses it
parent: TEC-OS
nav_order: 107
nav_group: "Reference"
---

# Appendix G. The TEC-1G as TEC-OS uses it

<!-- Source-only mechanism inspection at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     No build, import, test, capture or physical-board run was performed.
     The diagnostics cost below retains the historical78127ec documentation
     account. Current cold-default claims use the source above. -->

TEC-OS shares several ports with the board's displays, serial line and speaker.
The tables here give the connections its code uses. They also identify the
places where the host model and the board documents describe different
hardware. Source inspection establishes the operations the ROM performs, not
what an untested physical board will return.

For the prepared board, fit a 32 KiB RAM chip in U9, set the CPU clock to FAST
with the 4 MHz oscillator and leave the hex-keypad non-maskable interrupt (NMI)
jumper off. Enable the Matrix switch when using the matrix keyboard. Chapter 28
describes the separate diagnostics ROM and the report needed to compare a
particular board with the model.

## The ports

The shared port names are in `src/layout.asm:9-17`, `src/abi.inc:284-298`. The individual drivers
define their other ports.

| Port | Direction | Device | TEC-OS's use |
| --- | --- | --- | --- |
| `00h` | in | Hex-keypad encoder | Read and discarded during serial waits |
| `01h` | out | Digit select, serial and speaker | Bits 0–5 select the six digits, bit 6 sends serial data and bit 7 drives the speaker |
| `02h` | out | Seven-segment patterns | Hardware service `DIGIT` |
| `03h` | in | System input | Bit 0 enables Matrix input, bit 6 reports a keypad key down and bit 7 receives serial data |
| `04h` | in, out | 20 × 4 LCD commands and status | Initialisation, row selection and the busy flag |
| `84h` | out | 20 × 4 LCD data | Characters for the selected row |
| `05h`, `06h`, `F8h`, `F9h` | out | 8 × 8 LEDs | No ROM service. DEMO writes these ports itself |
| `07h`, `87h` | in, out | ST7920 graphics LCD | The loaded `GLCD.SVC` driver |
| `BEh`, `BFh` | in, out | PICO9918 data and control | Cold-boot probe, ROM console and `VIDEO` restoration |
| `FCh` | in, out | DS1302 clock | Cold-boot probe and `RTC` |
| `FDh` | in, out | SD card adaptor | The SD card driver |
| `FEh` | in | Matrix keyboard and joystick | Keyboard scan, `KEYS` and `JOY` |
| `FFh` | out | System latch | Boot overlay, RAM banks and Caps lamp |

Reading `00h` does not supply a TEC-OS keypad character. In the Debug80 model
that read starts the next queued serial input byte. On the board it reads the
keypad encoder and the ROM discards the value. It is a model input trigger,
not a hardware serial buffer (`src/console.asm:10-18`,
`src/console.asm:193-213`, `src/console.asm:286-298`).

Cold boot probes the PICO9918 by writing and reading two patterns at video
memory (VRAM) address `3FFFh`. A successful probe sets its device bit. With the
Matrix switch enabled the ROM then installs its PICO console before printing the
banner (`src/tms.asm:13-41`, `src/video.asm:18-24`, `src/pico.asm:53-68`). The
current source starts that console at 40 columns. With the switch off it
performs no console setup after the probe. The entry to warm boot then writes
`80h` to the chip's register 1, which leaves its display blanked
(`src/boot.asm:128-136`, `src/pico.asm:323-359`). A program can still claim the
responding display through `VIDEO`.

## Port 01h and the serial line

The digit selects, serial output and speaker share one output byte. Bit 6
must remain high while the serial line is idle. Clearing it looks like the
start of another serial character. `DIGIT` sets that bit during each digit's
lit interval and afterwards. `TONE` keeps it set while toggling bit 7
(`src/services.asm:22-31`, `src/services.asm:100-132`,
`src/services.asm:234-258`). Programs use those services rather than replacing
the shared port value. Chapter 12 gives their calling interface.

The CPU generates the serial bits itself. It sends through `01h` bit 6 and
receives through `03h` bit 7. The connection uses 4800 baud, eight data bits, no
parity and two stop bits. The delay counts assume a 4 MHz clock so the board
requires FAST with the 4 MHz oscillator (`tools/build.mjs:26-27`,
`tools/build.mjs:38-77`, `src/console.asm:312-337`, `src/console.asm:369-399`).

There is no hardware receive buffer. A byte reaches TEC-OS only while the CPU
is polling for its start bit and sampling the following bits. A program that
is busy elsewhere can miss it. Model input queuing does not establish that a
physical board can receive an uninterrupted paste. Chapter 17 explains the
polling and the separate one-byte software reserves.

## Port 03h and the switches

TEC-OS reads these three input bits:

| Bit | Meaning | When read | Effect |
| ---: | --- | --- | --- |
| 0 | Matrix switch | Once at cold boot into `CONDEV` | Enables matrix scanning, the ROM PICO console and GLCD registration |
| 6 | A hex-keypad key is down when low | Once before the startup-file open | Skips startup when a key is held |
| 7 | Serial receive line | During serial status and input calls | Supplies the incoming bits |

`CONINIT` records bit 0 directly. It does not probe for a keyboard response
(`src/console.asm:49-52`). With the switch off the console does not scan the
matrix, PICO console setup returns and GLCD registration fails
(`src/keyboard.asm:17-30`, `src/pico.asm:53-55`, `src/video.asm:142-166`).
The keypad sample and serial input are separate reads
(`src/cpm/ccpcmd.asm:806-808`, `src/console.asm:193-213`,
`src/console.asm:286-337`).

The board documents and the model describe other bits of `03h` differently.
Both describe bit 6 as low while a keypad key is down. Diagnostic T11 records
the port's behaviour on the board being tested. The physical Protect and
Expand switches are not input conditions checked by TEC-OS. They are distinct
from the similarly named bits it writes to the system latch.

## The system latch

The board documents describe `FFh` as write-only. TEC-OS keeps its last value
at `0040h`, named `LATCHV`, and constructs later writes from that copy
(`src/layout.asm:19-28`, `src/abi.inc:286-289`, `src/layout.asm:64-69`, `src/abi.inc:291-293`).

| Bit | Value | Name | TEC-OS's use |
| ---: | ---: | --- | --- |
| 0 | `01h` | SHADOW | Set at cold boot to remove the boot overlay and not cleared afterwards |
| 1 | `02h` | PROTECT | Not set by TEC-OS. A program setting it protects `4000h–7FFFh` against writes |
| 2 | `04h` | EXPAND | Selects EXPAND 1 in the `8000h–BFFFh` bank window for access to the block cache and history |
| 3 | `08h` | MAIN | Not set |
| 7 | `80h` | CAPS | Toggled by matrix Caps Lock, with the Caps lamp |

At reset the latch is `00h`. With SHADOW low the first 2 KiB of ROM also
appear at `0000h–07FFh`. The Z80 starts at `0000h` and executes the overlaid
copy of the ROM jump at `C000h`, whose target is `RSTENT`. At reset that entry
continues to `COLD`,
which writes `01h` to remove the overlay (`src/reset.asm:1-13`,
`src/boot.asm:22-40`). Chapter 16 distinguishes this from a program reaching
the reset entry while EXPAND 1 is selected.

A program writing the latch must also update `0040h`. Otherwise the next
TEC-OS latch write starts from an obsolete copy. Cache and history accesses
restore that recorded value after using EXPAND 1. They perform no stack
operation while that bank is visible because it hides the resident stacks
in EXPAND 0 (`src/history.asm:18-62`, `src/cache.asm:12-16`). Chapter 15
explains the memory boundary.

The model decodes bits 3–6 as a further bank field. The board documents
show them unconnected to U9. TEC-OS uses only bit 2 among bits 2–6.
Diagnostic T12 records how an actual board decodes those bits rather than
assuming the model's extra banks exist there.

## U9 and the RAM

The board's fixed RAM provides `0000h–7FFFh`. A 32 KiB chip in U9 supplies
two 16 KiB halves behind `8000h–BFFFh`, called EXPAND 0 and EXPAND 1.
TEC-OS needs both, for 64 KiB of physical RAM in total. The board's recommended
build leaves U9 empty. The prepared setup therefore adds a 62256 or similar
and sets the EXPAND jumpers for a 32 KiB chip, as `docs/board-run.md` specifies.

Before printing the banner, cold boot checks both ends of the visible window
with complementary patterns and checks for the separate half behind it. Failure
prints `TEC-OS needs 64K RAM` on serial and stops. The serial failure path uses
the boot stack in fixed RAM and does not require the resident workspace in U9
(`src/boot.asm:59-65`, `src/boot.asm:406-480`). Chapters 11 and 15 give the
program and resident layouts once this check succeeds.

## The hex keypad and its NMI

TEC-OS reads no hex-keypad key codes. It uses only the key-down bit for the
startup bypass. Hold a key through reset with the NMI jumper off to cover
that single sample. Chapter 8 gives the recovery procedure.

With the keypad NMI jumper fitted, a press raises a non-maskable interrupt. The
CPU pushes its return address and enters `0066h`, inside the default file
control block (FCB) at `005Ch–007Fh`. TEC-OS installs no NMI handler there. The
bytes can be file metadata rather than instructions so a press can crash the
machine. The supported TEC-OS setup leaves the jumper off. The diagnostics ROM
has its own NMI test and different keypad instructions, which must not be
applied to an ordinary TEC-OS session.

## The 20 × 4 LCD

The HD44780 character LCD uses `04h` for commands and status and `84h` for
data (`src/abi.inc:294-296`). Cold boot sends four initialisation commands
(`src/lcd.asm:13-21`, `src/tables.asm:44-51`):

| Command | Effect |
| --- | --- |
| `38h` | Eight-bit interface with two-line addressing |
| `0Ch` | Display on, cursor off |
| `06h` | Advance the address after each character |
| `01h` | Clear the display |

Before a command or character `LCDWAIT` reads the busy flag, bit 7 of port
`04h`, at most 256 times. The write follows readiness or expiry of that limit so
a missing LCD cannot hold this wait indefinitely (`src/lcd.asm:29-54`). The four
row address commands are `80h`, `C0h`, `94h` and `D4h` (`src/tables.asm:50-51`).

Cold boot writes the banner on row 0 and drives A and B on rows 1 and 2.
Row 3 holds the recovery words `CARD?` and `GLCD?`, described in Appendix D.
The `LCD` hardware service writes a complete row for a program. Writing row 3
through that call clears its recovery-word ownership flag so later console
selection leaves the program's text alone (`src/lcd.asm:116-147`,
`src/services.asm:134-162`). Chapter 26 explains that ownership boundary.

## The 8 × 8 LEDs

The ROM supplies no service for the 8 × 8 LEDs and does not write their ports.
DEMO writes them itself. Its host-model mapping uses `05h` for row selection
and `06h`, `F8h` and `F9h` for red, green and blue column patterns
(`test/programs/demo.asm:14-17`). Chapter 12 retains the program and its
historical preparation. It is not a starter-card file.

The board's port list instead gives `05h` and `06h` as the X and Y axes of
a single-colour matrix. DEMO's pattern need not look the same on that wiring.
Diagnostic T24 provides a visual procedure for recording the actual pattern.
A host-model picture cannot settle that board difference.

## The DS1302 clock

The clock add-on uses port `FCh` (`src/services.asm:18-21`):

| Bit | Use |
| ---: | --- |
| 0 | Data read from the chip |
| 4 | Chip enable |
| 5 | Read direction |
| 6 | Clock |
| 7 | Data sent to the chip |

The command and data bytes travel least significant bit first. `RTCHAS`
reads the seconds register and treats a value below `60h` as a responding
clock. An empty port returning `FFh` fails that check. This is the ROM's
presence test, not validation of every BCD digit or the date
(`src/services.asm:415-441`, `src/services.asm:446-501`).

Cold boot makes the test once and records the result in `CONDEV` bit 3.
`INFO` reports it in bit 3 of `B` without a port read. `RTC` tests again on
each valid call and transfers seven BCD fields: seconds, minutes, hours,
date, month, weekday and year. Chapter 12 gives the read/set contract
(`src/boot.asm:68-72`, `src/services.asm:80-87`,
`src/services.asm:357-419`).

## The SD card adaptor

The SD adaptor uses port `FDh` (`src/layout.asm:15-20`, `src/sd.asm:1-7`):

| Bit | Use |
| ---: | --- |
| 0 | Data sent to the card |
| 1 | Clock |
| 2 | Chip select, low to select |
| 7 | Data read from the card |

Output data changes while the clock is low and the card samples it on a
rising edge. Idle output is `05h`: chip select high, data high and clock low
(`src/sd.asm:35-89`).

High-capacity cards take a block number as the command address.
Standard-capacity cards take a 32-bit byte address. Their last addressable
512-byte block is `7FFFFFh`. A volume including `800000h` or a later block fails mount
validation with `27h`. A direct transfer beyond the bound returns driver
error 9 before sending a command (`src/vol.asm:273-298`,
`src/sd.asm:350-381`, `src/sd.asm:391-394`, `src/sd.asm:664-667`).

Every card wait has a finite limit. A missing or unsuitable response returns
one of the driver codes in Appendix D. Chapter 18 follows initialisation,
block transfers and the container checks.

For cache transfers the block loop selects EXPAND 1 and restores the recorded
latch afterwards. It uses no stack while the bank is visible
(`src/sd.asm:466-475`, `src/sd.asm:563-588`, `src/sd.asm:643-652`). The
historical diagnostics documentation at `78127ec` gives 354,216 T-states per
block plus 678 for each token poll, about 89 ms at 4 MHz. That is the separate
diagnostics driver's cost account, not a fresh TEC-OS block measurement.
Diagnostic T20 and the timed T34 procedure allow a board's behaviour to be
recorded alongside its image and board revision.
