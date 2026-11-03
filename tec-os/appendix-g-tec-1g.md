---
title: G. The TEC-1G as TEC-OS uses it
parent: TEC-OS
nav_order: 107
nav_group: "Appendices"
---

# Appendix G. The TEC-1G as TEC-OS uses it

Checked against TEC-OS 7458352.

This appendix lists the parts of the TEC-1G that TEC-OS reads and writes: its
ports, the bits of the system latch, the configuration switches, the RAM in
socket U9, the hex keypad, the 8 × 8 LEDs, the DS1302 clock and the SD card
adaptor. It describes the board as the code uses it. TEC-OS has run only on
the host model, and where the model and the TEC-1G's own
documents differ, the difference is noted with the test of the diagnostics ROM
that settles it (Chapter 23).

## The ports

The port numbers are defined in `src/layout.asm:8-13`, with the devices' own
in the files that drive them.

| Port | Direction | Device | TEC-OS's use |
| --- | --- | --- | --- |
| `00h` | in | Hex keypad encoder | Read and discarded in each serial wait loop |
| `01h` | out | Digit select and serial | Bits 0 to 5 select the 7-segment digits, bit 6 is the serial line's output, bit 7 the speaker |
| `02h` | out | 7-segment segments | Hardware service `DIGIT` |
| `03h` | in | System input | Bit 0 the Matrix switch, bit 6 a keypad key down, bit 7 the serial line's input |
| `04h` | in, out | 20 × 4 LCD, instructions and status | The busy flag, the LCD's setup and its rows |
| `84h` | out | 20 × 4 LCD, data | The same |
| `05h`, `06h`, `F8h`, `F9h` | out | 8 × 8 LEDs | No hardware service; Chapter 9's `DEMO` writes them |
| `07h`, `87h` | in, out | Graphics LCD, ST7920 | `GLCD.SVC` only |
| `BEh`, `BFh` | in, out | PICO9918, data and control | The probe at cold boot; the console and hardware service `VIDEO`'s restore, both in `PICO.SVC` |
| `FCh` | in, out | DS1302 clock | The probe at cold boot and hardware service `RTC` |
| `FDh` | in, out | SD card adaptor | The SD card driver |
| `FEh` | in | Matrix keyboard and joystick | The keyboard scan, hardware services `KEYS` and `JOY` |
| `FFh` | out | System latch | Overlay, banks and the Caps lamp |

The read of port `00h` takes nothing from the keypad. It is there for the
Debug80 runtime, whose serial input starts a queued byte at a read of that port
(`src/layout.asm:9`, `src/console.asm:130`, `src/console.asm:184`,
`src/console.asm:296`).

## Port 01h and the serial line

Port `01h` carries three things at once: the digit select in bits 0 to 5, the
serial line's output in bit 6 and the speaker in bit 7 (`src/layout.asm:10`).
Every write to it has to keep bit 6 high when the serial line is idle, or the
terminal receives a start bit. The ROM's own writes do: the hardware service
`DIGIT` lights each digit with bit 6 set, and `TONE` toggles bit 7 with bit 6
set (`src/services.asm:17`, `src/services.asm:58-72`,
`src/services.asm:146-165`). That shared port is why programs reach the digits
and the speaker through the hardware services of Chapter 9 and not by writing
the port.

The serial line is bit-banged: TEC-OS sends each bit by writing bit 6 of port
`01h` and receives by sampling bit 7 of port `03h`, at 4800 baud, 8 data bits,
no parity and 2 stop bits. The bit times are counted in T-states for a 4 MHz
clock (`tools/build.mjs:25`, `tools/build.mjs:36-54`,
`src/console.asm:194-204`), so the board's CPU clock switch has to be on FAST
with the 4 MHz oscillator. There is no receive buffer in hardware: a byte
reaches TEC-OS only while it is polling bit 7 for a start bit.

## Port 03h and the switches

TEC-OS reads three bits of port `03h` (`src/layout.asm:11`):

- **Bit 0, the Matrix switch.** Read once, at cold boot, into `CONDEV`
  (`src/console.asm:42-44`). With the switch off the console never scans the
  matrix keyboard, and both display drivers fail to install, since each needs
  the keyboard.
- **Bit 6, a keypad key down.** Read once, at cold boot, just before the
  startup file is opened. A low bit skips the file (`src/cpm/ccp.asm:1624-1626`).
- **Bit 7, the serial line's input.** Read by the serial routines
  (`src/console.asm:132`, `src/console.asm:185`, `src/console.asm:202`).

The TEC-1G's documents and the Debug80 runtime describe the other bits of port
`03h` differently. On bit 6 the two agree: it is low while a keypad key is
down, which is how TEC-OS reads it (`src/cpm/ccp.asm:1624-1626`).
`docs/diagnostics.md` records the comparison, and test T11 reads the port on a
board. The Protect and Expand switches are not read.

## The system latch

The system latch at port `FFh` can be written but, on the board's documents,
not read, so TEC-OS keeps a copy of the last value written at `0040h`,
`LATCHV`, and builds each new value from the copy (`src/layout.asm:13`,
`src/layout.asm:36`). Its bits:

| Bit | Value | Name | TEC-OS's use |
| ---: | ---: | --- | --- |
| 0 | `01h` | SHADOW | Set at cold boot to turn the boot overlay off, and never cleared (`src/boot.asm:22-23`) |
| 1 | `02h` | PROTECT | Not set; a program that sets it makes `4000h–7FFFh` read-only |
| 2 | `04h` | EXPAND | EXPAND 1 at `8000h–BFFFh` in place of EXPAND 0, for the block cache and the history (`src/layout.asm:18`) |
| 3 | `08h` | MAIN | Not set |
| 7 | `80h` | CAPS | The Caps lamp, toggled with Caps Lock on the matrix keyboard (`src/keyboard.asm:104-107`) |

At reset the latch is `00h`, and with bit 0 low the first 2 KiB of the ROM
also appear at `0000h–07FFh`. That is how the Z80, which starts at `0000h`,
reaches the ROM: the jump there leads to `RSTENT` at its `C000h` address,
which goes on at reset to `COLD`, and `COLD` writes `01h` to the latch
(`src/reset.asm:1-7`, `src/boot.asm:11-23`). A
program that writes the latch itself has to write `0040h` to match, since
TEC-OS's next write to the latch is made from the copy.

EXPAND is set only while no stack is in use, since the stacks TEC-OS uses once
cold boot has set them up are in `8000h–BFFFh`, in EXPAND 0
(`src/history.asm:16-42`, `src/cache.asm:11-14`). Bits 3 to 6 are a bank field
for the window in the Debug80 runtime, and unconnected to U9 in the board's
documents. Of bits 2 to 6, TEC-OS uses only bit 2, for EXPAND 1. Test T12 of
the diagnostics ROM reports what a board does with bits 3 to 6.

## U9 and the RAM

TEC-OS needs 64 KiB of RAM: the board's fixed 32 KiB at `0000h–7FFFh` and a 32
KiB RAM in socket U9 for `8000h–BFFFh`, whose two 16 KiB halves are EXPAND 0
and EXPAND 1. The board's recommended build leaves U9 empty, and
`docs/board-run.md` gives the chip as a 62256 or similar, with the board's
EXPAND jumpers set for a 32 KiB chip. Before it prints anything, cold boot
tests `8000h–BFFFh` and then EXPAND 1 behind it, and stops with `TEC-OS needs
64K RAM` on the serial terminal if either is missing (`src/boot.asm:33`,
`src/boot.asm:290-320`). Chapter 1 describes the check, and Chapter 13 what
TEC-OS keeps in each half.

## The hex keypad and its NMI

TEC-OS takes no keys from the hex keypad. Its one use of the keypad is the
key-down bit of port `03h`, read once at cold boot for the startup file's
skip.

With the board's keypad NMI jumper fitted, a key press makes a non-maskable
interrupt, and the Z80 pushes its return address and jumps to `0066h`. TEC-OS
puts no handler there. `0066h` is inside CP/M's default file control block,
`005Ch–007Fh`, which programs and the CCP write, so an NMI runs whatever bytes
the FCB holds. `docs/board-run.md` lists TEC-OS as running with the jumper
off. A press with the jumper fitted is a crash.

## The 8 × 8 LEDs

No hardware service drives the 8 × 8 LEDs, and the ROM never writes their ports.
`DEMO`, which Chapter 9 builds and which isn't on the starter card, writes them
itself, as the Debug80 runtime decodes them: port `05h` selects a row, and `06h`,
`F8h` and `F9h` light its red, green and blue columns (`test/programs/demo.asm:14-17`,
`test/programs/demo.asm:273-286`). The TEC-1G port list makes `05h` and `06h`
the X and Y axes of a single-colour matrix, so `DEMO`'s pattern may look
different on a board. Test T24 of the diagnostics ROM records what a board
shows.

## The DS1302 clock

The DS1302 is an add-on on port `FCh`, with bit 4 the chip's enable, bit 6 its
clock, bit 7 the data sent to it, bit 5 set to read and the data read on bit 0
(`src/services.asm:13-14`). Each register is reached by a command byte sent least
significant bit first (`src/services.asm:284-290`). TEC-OS counts the clock as
present when a read of the seconds register gives a value below `60h`, which a
clock that answers gives and an empty port's `FFh` doesn't
(`src/services.asm:264-276`). Cold boot makes that test once and keeps the result
in bit 3 of `CONDEV` (`src/boot.asm:41-44`). The hardware service `INFO`
reports that bit in bit 3 of `B` without reading the port. `RTC` makes the
test again at each call, and reads and sets the clock's seven BCD registers
(Chapter 9).

## The SD card adaptor

The SD card adaptor is on port `FDh`, driven in SPI mode by bit-banging: bit 0
is the data to the card, bit 1 the clock and bit 2 the card's select, low to
select it, and the card's data comes back on bit 7 (`src/layout.asm:12`,
`src/sd.asm:1-8`). The data changes while the clock is low, and the card
samples it on the rising edge. With nothing selected the port is written
`05h`: select high, data high, clock low.

Every wait for the card has a limit, and a card that doesn't answer gives one
of the error codes of Chapter 23 and Appendix D (`src/sd.asm:4-18`). A
high-capacity card takes a block's number as its address, and a
standard-capacity card takes the block's byte address in 32 bits, so the
driver can name no block 4 GiB or more into a standard card. It rejects such a
block before any command, with code 9. A standard card with a volume that
reaches past block `7FFFFFh`, the last below 4 GiB, fails the mount with code
`27h` (`src/sd.asm:207-236`, `src/vol.asm:216-230`, Chapter 18). When a
block goes to or from the block cache, the transfer loop runs with EXPAND 1 in
view, writing the latch before the loop and its copy back after
(`src/sd.asm:273-277`, `src/sd.asm:371-372`, `src/sd.asm:379-382`,
`src/sd.asm:441-442`). `docs/diagnostics.md` gives the cost of a block read
with the same driver in the diagnostics ROM as 354,216 T-states and 678 for
each wait for the card, about 89 ms at 4 MHz, and test T20 measures it on a
board.
