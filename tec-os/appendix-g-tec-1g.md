---
title: G. The TEC-1G as TEC-OS uses it
parent: TEC-OS
nav_order: 107
nav_group: "Appendices"
---

# Appendix G. The TEC-1G as TEC-OS uses it

<!-- Checked against TEC-OS 78127ec. -->

This appendix lists the parts of the TEC-1G that TEC-OS reads and writes. They
are its ports, the bits of the system latch, the configuration switches, the
RAM in socket U9, the hex keypad, the 20 × 4 LCD, the 8 × 8 LEDs, the DS1302
clock and the SD card adaptor. It describes the board as the code uses it.
TEC-OS has run only on the host model. Facts about the physical board come
from the board's own documents and from the tests of the diagnostics ROM, not
from `src/`. Where the model and the documents differ, the difference is noted
with the test that settles it (Chapter 26).

## The ports

The port numbers are defined in `src/layout.asm:8-14`, with the devices' own
in the files that drive them.

| Port | Direction | Device | TEC-OS's use |
| --- | --- | --- | --- |
| `00h` | in | Hex keypad encoder | Read and discarded in each serial wait loop |
| `01h` | out | Digit select and serial | Bits 0 to 5 select the 7-segment digits, bit 6 is the serial line's output, bit 7 the speaker |
| `02h` | out | 7-segment segments | Hardware service `DIGIT` |
| `03h` | in | System input | Bit 0 the Matrix switch, bit 6 a keypad key down, bit 7 the serial line's input |
| `04h` | in, out | 20 × 4 LCD, instructions and status | The busy flag, the LCD's setup and its rows |
| `84h` | out | 20 × 4 LCD, data | The same |
| `05h`, `06h`, `F8h`, `F9h` | out | 8 × 8 LEDs | No hardware service; Chapter 10's `DEMO` writes them |
| `07h`, `87h` | in, out | Graphics LCD, ST7920 | `GLCD.SVC` only |
| `BEh`, `BFh` | in, out | PICO9918, data and control | The probe at cold boot; the ROM's PICO9918 console, and hardware service `VIDEO`'s restore through it |
| `FCh` | in, out | DS1302 clock | The probe at cold boot and hardware service `RTC` |
| `FDh` | in, out | SD card adaptor | The SD card driver |
| `FEh` | in | Matrix keyboard and joystick | The keyboard scan, hardware services `KEYS` and `JOY` |
| `FFh` | out | System latch | Overlay, banks and the Caps lamp |

The read of port `00h` takes nothing from the keypad. It is there for the
Debug80 runtime, which delivers the next queued serial byte when a program
reads that port (`src/layout.asm:9`, `src/console.asm:149`,
`src/console.asm:213`, `src/console.asm:343`).

At cold boot TEC-OS probes the PICO9918 through ports `BEh` and `BFh`. When the
chip answers and the Matrix switch has enabled the keyboard, cold boot starts
the ROM's console on it at 80 columns, before the banner (`src/video.asm:8-16`,
`src/pico.asm:27-47`). With the switch off the chip stays unprogrammed until a
program claims it.

## Port 01h and the serial line

Port `01h` carries three things at once: the digit select in bits 0 to 5, the
serial line's output in bit 6 and the speaker in bit 7 (`src/layout.asm:10`).
Every write to it has to keep bit 6 high when the serial line is idle, or the
terminal receives a start bit. The ROM's own writes do. The hardware service
`DIGIT` lights each digit with bit 6 set, and `TONE` toggles bit 7 with bit 6
set (`src/services.asm:17`, `src/services.asm:65-81`,
`src/services.asm:166-187`). That shared port is why programs reach the digits
and the speaker through the hardware services of Chapter 10 and not by writing
the port.

The serial line is bit-banged. TEC-OS sends each bit by writing bit 6 of port
`01h` and receives by sampling bit 7 of port `03h`. The line runs at 4800
baud, 8 data bits, no parity and 2 stop bits (`src/console.asm:222-234`). The bit times are
counted for a 4 MHz clock (`tools/build.mjs:26`, `tools/build.mjs:37-55`), so
the board's CPU clock switch has to be on FAST with the 4 MHz oscillator.
There is no receive buffer in hardware: a byte reaches TEC-OS only while it is
polling bit 7 for a start bit. Chapter 16 describes the serial routines and
their timing.

## Port 03h and the switches

TEC-OS reads three bits of port `03h` (`src/layout.asm:11`):

| Bit | Name | Read | TEC-OS's use |
| ---: | --- | --- | --- |
| 0 | The Matrix switch | Once, at cold boot, into `CONDEV` (`src/console.asm:48-50`) | With the switch off the console never scans the matrix keyboard, the ROM's PICO9918 console doesn't start and `GLCD.SVC` fails to install, since each needs the keyboard |
| 6 | A keypad key down | Once, at cold boot, just before the startup file is opened (`src/cpm/ccpcmd.asm:562-564`) | A low bit skips the file |
| 7 | The serial line's input | By the serial routines (`src/console.asm:152`, `src/console.asm:214`, `src/console.asm:232`) | The received bits |

The TEC-1G's documents and the Debug80 runtime describe the other bits of port
`03h` differently. On bit 6 the two agree: it is low while a keypad key is
down, which is how TEC-OS reads it. `docs/diagnostics.md` records the
comparison, and test T11 reads the port on a board. The Protect and Expand
switches are not read.

## The system latch

On the board's documents the system latch at port `FFh` can be written but
not read. TEC-OS therefore keeps a copy of the last value written at `0040h`,
`LATCHV`, and builds each new value from the copy (`src/layout.asm:14`,
`src/layout.asm:39`). Its bits:

| Bit | Value | Name | TEC-OS's use |
| ---: | ---: | --- | --- |
| 0 | `01h` | SHADOW | Set at cold boot to turn the boot overlay off, and never cleared (`src/boot.asm:25-26`) |
| 1 | `02h` | PROTECT | Not set; a program that sets it makes `4000h–7FFFh` read-only |
| 2 | `04h` | EXPAND | EXPAND 1 at `8000h–BFFFh` in place of EXPAND 0, for the block cache and the history (`src/layout.asm:20`) |
| 3 | `08h` | MAIN | Not set |
| 7 | `80h` | CAPS | The Caps lamp, toggled with Caps Lock on the matrix keyboard (`src/keyboard.asm:110-113`) |

At reset the latch is `00h`, and with bit 0 low the first 2 KiB of the ROM
also appear at `0000h–07FFh`. That is how the Z80, which starts at `0000h`,
reaches the ROM. The jump there leads to `RSTENT` at its `C000h` address.
At reset `RSTENT` continues to `COLD`, which writes `01h` to the latch
(`src/reset.asm:1-6`, `src/boot.asm:11-26`). A program that writes the latch
itself has to write `0040h` to match, since TEC-OS's next write to the latch
is made from the copy.

EXPAND is set only while no stack is in use. The stacks TEC-OS uses once cold
boot has set them up are in `8000h–BFFFh`, in EXPAND 0
(`src/history.asm:16-43`, `src/cache.asm:10-13`). Bits 3 to 6 are a bank field
for the window in the Debug80 runtime, and unconnected to U9 in the board's
documents. Of bits 2 to 6, TEC-OS uses only bit 2, for EXPAND 1. Test T12 of
the diagnostics ROM reports what a board does with bits 3 to 6.

## U9 and the RAM

TEC-OS needs 64 KiB of RAM: the board's fixed 32 KiB at `0000h–7FFFh` and a 32
KiB RAM in socket U9 for `8000h–BFFFh`. The chip's two 16 KiB halves are
EXPAND 0 and EXPAND 1. The board's recommended build leaves U9 empty.
`docs/board-run.md` gives the chip as a 62256 or similar, with the board's
EXPAND jumpers set for a 32 KiB chip. Cold boot tests `8000h–BFFFh` and then
EXPAND 1 behind it before it prints anything. It stops with `TEC-OS needs 64K
RAM` on the serial terminal if either is missing (`src/boot.asm:36`,
`src/boot.asm:323-358`). Chapter 15 describes the check, and Chapter 14 what
TEC-OS keeps in each half.

## The hex keypad and its NMI

TEC-OS takes no keys from the hex keypad. Its one use of the keypad is the
key-down bit of port `03h`, read once at cold boot for the startup file's
skip.

With the board's keypad NMI jumper fitted, a key press makes a non-maskable
interrupt, and the Z80 pushes its return address and jumps to `0066h`. TEC-OS
puts no handler there. `0066h` is inside CP/M's default file control block,
`005Ch–007Fh`, which programs and the CCP write. An NMI therefore runs
whatever bytes the FCB holds. `docs/board-run.md` lists TEC-OS as running with the jumper
off. A press with the jumper fitted is a crash.

## The 20 × 4 LCD

The 20 × 4 LCD is an HD44780 on port `04h` for commands and the busy flag and
`84h` for data (`src/lcd.asm:5-6`). `LCDINIT` sends four commands at cold
boot (`src/lcd.asm:8-16`, `src/tables.asm:38`):

| Command | Effect |
| --- | --- |
| `38h` | An eight-bit interface with two-line addressing |
| `0Ch` | The display on, with no cursor |
| `06h` | The address moves right after each character |
| `01h` | The display cleared |

Before each command or character `LCDWAIT` reads the busy flag, bit 7 of port
`04h`, at most 256 times. A board with no LCD costs only that wait and no
hang (`src/lcd.asm:18-27`). The rows start at display addresses `80h`, `C0h`,
`94h` and `D4h` (`src/tables.asm:40-41`). Cold boot writes the banner on row 0
and drives A and B on rows 1 and 2. Row 3 holds the words `CARD?` and
`GLCD?` that Appendix D lists. The hardware service `LCD` writes a row for
a program, and Appendix B gives its cost.

## The 8 × 8 LEDs

No hardware service drives the 8 × 8 LEDs, and the ROM never writes their
ports. `DEMO`, the program Chapter 10 builds, writes them itself as the
Debug80 runtime decodes them. Port `05h` selects a row, and ports `06h`,
`F8h` and `F9h` light its red, green and blue columns
(`test/programs/demo.asm:14-17`, `test/programs/demo.asm:273-286`). `DEMO`
isn't on the starter card. The TEC-1G port list makes `05h` and `06h` the X
and Y axes of a single-colour matrix. `DEMO`'s pattern may therefore look
different on a board. Test T24 of the diagnostics ROM records what a board shows.

## The DS1302 clock

The DS1302 is an add-on on port `FCh` (`src/services.asm:13-14`):

| Bit | Use |
| ---: | --- |
| 0 | The data read from the chip |
| 4 | The chip's enable |
| 5 | Set to read |
| 6 | The chip's clock |
| 7 | The data sent to the chip |

Each register is reached by a command byte sent least significant bit first (`src/services.asm:318-326`). TEC-OS counts the
clock as present when a read of the seconds register gives a value below
`60h`. A clock that answers gives such a value and an empty port's `FFh`
doesn't (`src/services.asm:296-309`). Cold boot makes that test once and keeps
the result in bit 3 of `CONDEV` (`src/boot.asm:47-50`). The hardware service
`INFO` reports that bit in bit 3 of `B` without reading the port. `RTC` makes
the test again at each call, and reads and sets the clock's seven BCD
registers (Chapter 10).

## The SD card adaptor

The SD card adaptor is on port `FDh`, driven in SPI mode by bit-banging
(`src/layout.asm:12`, `src/sd.asm:3-8`):

| Bit | Use |
| ---: | --- |
| 0 | The data to the card |
| 1 | The clock |
| 2 | The card's select, low to select it |
| 7 | The data from the card |

The data changes while the clock is low, and the card samples it on the
rising edge. With nothing selected the port is written `05h`: select high,
data high, clock low.

A high-capacity card takes a block's number as its address. A
standard-capacity card takes the block's byte address in 32 bits. The driver
can therefore name no block 4 GiB or more into such a card
(`src/sd.asm:243-274`). Every wait for the card has a limit. A card that
doesn't answer, or answers wrongly, fails with one of the driver's codes
(`src/sd.asm:10-20`). Appendix D lists the codes and Chapter 17 the driver.

When a block goes to or from the block cache, the transfer loop runs with
EXPAND 1 in view. The driver writes the latch before the loop and its copy
back after (`src/sd.asm:321-325`, `src/sd.asm:420-421`,
`src/sd.asm:427-431`, `src/sd.asm:490-491`). `docs/diagnostics.md` gives the
cost of a block read with the diagnostics ROM's copy of the driver as 354,216
T-states, about 89 ms at 4 MHz. Test T20 measures it on a board.
