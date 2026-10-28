---
title: The hardware services
parent: TEC-OS
nav_order: 7
---

# The hardware services

CP/M's devices are a console, a printer, a paper-tape reader and punch and
the disks. The TEC-1G has many more: six 7-segment digits, a 20 × 4 LCD, an 8 × 8
grid of coloured LEDs, a speaker, a joystick port, a clock and the
PICO9918's graphics. TEC-OS gives programs these devices through a table of
entry points at `FF00h`. A program that uses the table needs no port numbers or timing loops of its
own. It can also check that it is running on TEC-OS before it uses them.

## The table at FF00h

The table's layout is fixed. New entries are only ever added at the end,
with the minor version raised, so a program written for one version runs on
every later one.

| Address | Contents |
| --- | --- |
| `FF00h` | The signature `TNA` |
| `FF03h` | The major version, 2 |
| `FF04h` | The minor version, 6 at present |
| `FF09h` | The address of the console size: columns, then rows |
| `FF0Bh` | `JP` to the hardware services |
| `FF12h`, `FF15h` | `JP XMOVE` and `JP MOVE`, for copies to and from EXPAND 1 (Chapter 5) |
| `FF18h` | The address of EXPAND 1's low mark (Chapter 5) |
| `FF1Ah`, `FF1Dh` | `JP` to a nested command processor, or to one command line (Chapter 3) |
| `FF20h` | `JP` to the volume service that `MOUNT` uses (Chapter 4) |
| `FF23h` | The address of the console font, for drivers (Chapter 8) |

A program first checks the signature and the version. A CP/M program that
finds no signature is on another system, and it can carry on without the
TEC-1G's devices.

## Calling a service

The services share one entry point at `FF0Bh`. A program puts the service
number in `C` and its arguments in `A`, `B`, `DE` and `HL`, then calls
`FF0Bh`. `A` comes back with a status, with the zero flag set and carry
clear on success:

| Status | Meaning |
| ---: | --- |
| 0 | Success |
| 1 | No such service, or an argument out of range |
| 2 | The device is not fitted, or is not the console |
| 3 | Nothing arrived in time |
| 4 | The card did not read |
| 5 | The PICO9918 is not claimed |

`IX`, `IY` and the alternate registers come back unchanged. A service uses at most 16 bytes of the caller's stack. No service calls
the BDOS, so a program can call one from code that runs inside a BDOS call,
such as a hook on the BIOS jump table.

## The services

| `C` | Service | Arguments | Result |
| ---: | --- | --- | --- |
| 0 | `INFO` | | `B` = devices present: bit 0 matrix keyboard, 1 PICO9918, 2 GLCD, 3 clock. `DE` = ROM version. `L`, `H` = console columns and rows |
| 1 | `DIGITS` | `HL` → 6 segment bytes, leftmost first | One scan of the digits, then all off |
| 2 | `HEXSEG` | `A` = 0 to 15 | `B` = the digit's segment pattern, in MON-3's layout |
| 3 | `LEDS` | `HL` → 8 rows of red, green and blue bytes | One scan of the 8 × 8 LEDs, then off |
| 4 | `LCDROW` | `B` = row 0 to 3, `HL` → 20 characters | The LCD row written |
| 5 | `VIDEO` | `B` = 1 to claim the PICO9918, 0 to give it back | Status 2 without a PICO9918 |
| 6 | `TONE` | `B` = half period in units of 16 T-states, `DE` = half cycles | A square wave on the speaker |
| 7 | `JOY` | | `B` = the joystick, a bit set for each switch pressed |
| 8 | `KEYS` | `HL` → 8-byte buffer | The matrix keyboard's 8 rows, a bit set for each key down |
| 9 | `SERIAL` | `B` = 0 to send `A`, or 1 to wait up to `DE` ms | `B` = the byte received, or status 3 |
| 10 | `BLOCK` | `HL` → 4-byte block number, `DE` → 512-byte buffer | The card's raw block, or status 4 |
| 11 | `DELAY` | `DE` = milliseconds | |
| 12 | `VREG` | `B` = register, `A` = value | A PICO9918 register written |
| 13 | `VFILL` | `HL` = VRAM address, `DE` = count, `A` = value | VRAM filled |
| 14 | `VWRITE` | `HL` → VRAM address, RAM address and count | RAM copied to VRAM |
| 15 | `VREAD` | As `VWRITE` | VRAM copied to RAM |
| 16 | `PUTAT` | `D` = row, `E` = column, `B` = count, `HL` → characters | Characters written on the video console without moving the cursor |
| 17 | `RANDOM` | | `HL` = the next pseudo-random number |
| 18 | `RTC` | `B` = 0 to read, 1 to set, `HL` → 7 BCD bytes | The clock read or set: seconds, minutes, hours, date, month, weekday, year |

The next sections explain the services that need more than the table says.

## A message on the LCD

This program writes a row of the LCD and beeps:

```asm
; LCDMSG.COM: a message on the 20 x 4 LCD and a beep, through the
; hardware services at FF0Bh.
BDOS    EQU     $0005
HWSVC   EQU     $FF0B
LCDROW  EQU     4               ; B = row, HL -> 20 characters
TONE    EQU     6               ; B = half period / 16 T-states, DE = half cycles

        ORG     $0100
        LD      HL,($FF00)      ; "TN" of the "TNA" signature?
        LD      DE,'T'+256*'N'
        OR      A
        SBC     HL,DE
        JR      NZ,NOTEC
        LD      A,($FF02)
        CP      'A'
        JR      NZ,NOTEC
        LD      B,1             ; LCD row 1
        LD      HL,MSG
        LD      C,LCDROW
        CALL    HWSVC
        LD      B,120           ; about 1 kHz
        LD      DE,400          ; 200 cycles: 0.2 s
        LD      C,TONE
        JP      HWSVC           ; beep, then return to TEC-OS

NOTEC:  LD      DE,NOTMSG
        LD      C,9
        JP      BDOS

MSG:    DB      "Hello on the LCD    "
NOTMSG: DB      "Not TEC-OS",13,10,"$"
```

After it runs, the LCD's second row reads `Hello on the LCD`. The other
rows keep what TEC-OS wrote there at start-up. A real program would
also check the version at `FF03h`. This one uses only services that every
version has.

`TONE`'s pitch comes from `B`. Each half cycle of the square wave takes
16 × `B` + 59 T-states, so `B = 120` gives half cycles of 1,979 T-states,
about 0.5 ms at 4 MHz, and a tone of about 1 kHz. `DE` counts half cycles,
so 400 of them last 0.2 s.

## The digits and the LEDs

The 7-segment digits and the 8 × 8 LEDs are multiplexed. The board lights
one digit or one row of LEDs at a time, and the display looks steady only
while the Z80 keeps cycling through them. `DIGITS` and `LEDS` each make one pass
and then turn everything off. A program calls them in its main loop, once
per pass, for as long as it wants the display lit. `DIGITS` takes about
0.8 ms per digit and `LEDS` about 0.4 ms per row.

`DIGITS` takes six segment bytes. `HEXSEG` converts a value from 0 to 15
into the segment byte MON-3 uses for that hexadecimal digit, which saves a
program its own table.

## The PICO9918

The PICO9918 is usually TEC-OS's console. To use its graphics, a program first claims it with `VIDEO` and `B = 1`.
While the program holds it, the console writes nothing to the PICO9918. The
program may set any mode and use all of the VRAM through `VREG`, `VFILL`,
`VWRITE` and `VREAD`.
Those four return status 5 when the PICO9918 isn't claimed.

`VIDEO` with `B = 0` gives the PICO9918 back. TEC-OS then restores its text
mode, font and screen and clears it. A program that ends without giving the
display back gets the same treatment at warm boot. `DEMO` on the starter
card claims the PICO9918 for its colour bars and bouncing ball and gives it
back when a key is pressed.

## Fast screen output

`PUTAT` writes characters straight onto the video console at a row and
column, without moving the cursor and without the escape-sequence handling
that console output goes through. A full-screen program such as an editor
can redraw a screen much faster with it. It returns status 2 on the serial
console and while a program has claimed the PICO9918. A program written to run on other CP/M systems as well uses `PUTAT` when it
finds the signature and ordinary console output when it doesn't.

## The clock

`RTC` reads or sets the DS1302 clock through a 7-byte buffer of BCD values:
seconds, minutes, hours, date, month, weekday and year. A board without the
clock gets status 2. `INFO` reports in bit 3 of `B` whether the clock is
fitted.

## The serial port and the card

`SERIAL` sends or receives a byte on the serial port at 4800 baud, whatever
the console is. It passes all eight bits, `00h` included, which is what a
file-transfer program needs. With `B = 1` it waits up to `DE` milliseconds
for a byte and returns status 3 if none arrives.

`BLOCK` reads one 512-byte block from the card, by its number from the
card's start, into the program's buffer. It reads only. Chapter 4 describes
what the blocks hold.
