---
title: The hardware services
parent: TEC-OS
nav_order: 10
nav_group: "Part I: Using and programming TEC-OS"
---

# 10. The hardware services

<!-- Checked against TEC-OS 78127ec. The programs were assembled by the starter
     card's `TAS.COM`, from Thorium dbee66a, SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. `SIZE`
     and `DEMO` were assembled on the PC by ATOM from the repository's
     `atom-z80` 0.3.7. -->

The BDOS gives your program files and the console. It has nothing for the
7-segment digits, the speaker or the clock. TEC-OS reaches those through nine
numbered calls in the ROM, the *hardware services*. Each has a program here
that uses it, and `DEMO` at the end uses them together.

## The shared ports

A program could write the board's ports itself, but two of the devices are
shared with the console. Port `01h` selects a digit in bits 0 to 5, drives the
speaker in bit 7 and carries the serial transmit line in bit 6. A program that
scans the digits or beeps with bit 6 low sends noise down the serial line.
That line may be the console. The PICO9918 may be the console too, and a
program that writes its registers takes the screen from the terminal code.
The hardware services do these jobs with bit 6 held high and the console's
state kept right.

## The ROM table

A program finds the services through the *ROM table* at `C003h`, after the
reset jump. The table is the only part of the ROM at a fixed address, and
everything else can move from one build to the next.

| Address | Name | Contents |
| --- | --- | --- |
| `C003h` | `ABITAB` | the letters `TNA` |
| `C006h` | `ABIMAJ` | the major version, 5 |
| `C007h` | `ABIMIN` | the minor version, 1 |
| `C008h` | `ABICALL` | a jump: the numbered services |

`ABIEND`, `C00Bh`, is the first address after the table's 8 bytes. The
version is the table's ABI, its application binary interface, here 5.1. The
jump at `ABICALL` leads to 16 services, numbered 0 to 15. Numbers 0 to 8 are
the hardware services. `MOUNT` uses 9 to 11, which mount, unmount and
describe volumes. `GLCD.SVC` hands the ROM its table through 12 and draws
its characters from the console's font in the ROM, whose address 15 returns.
[Chapter 12](12-writing-services.md) describes 13 and 14, the registry of
services, and [Appendix B](appendix-b-rom-services.md) lists every number.

The names of the table's addresses, the service numbers and the status codes
are in `abi.inc`. The ROM is assembled from that file, and a build publishes
it as `dist/abi.inc`. The programs here include the file and use its
names.

## The check for TEC-OS

A CP/M program may run on a machine with no ROM table at `C003h`, so it tests
before it calls. The test has two parts: the three letters, and a major
version of exactly 5. A later major version may renumber the services, and a
later minor version only adds numbers at the end. A program written for 5.0
therefore runs on this ROM's 5.1 but can't use a 6 or a 4.

A program that finds something else is on another system and leaves the
board's devices alone. These programs print a line and end. `CHKHW` makes the
test, in a file of routines that this chapter's programs share:

```asm
; HWLIB.ASM: routines this chapter's programs share. It goes after a
; program's own code, since it makes bytes where it is included.

; Test for TEC-OS with ABI 5. Returns Z if the table's four bytes match,
; NZ if not. Changes AF, B, DE and HL.
CHKHW:	LD	HL,ABITAB	; signature, then the major version
	LD	DE,TAG		; what they must be
	LD	B,4		; a major of 6 fails as a wrong letter does
CHKH1:	LD	A,(DE)
	CP	(HL)
	RET	NZ		; NZ: not what TAG holds
	INC	HL		; on to the next of each
	INC	DE
	DJNZ	CHKH1
	RET			; Z from the last comparison

; End a program that found another system. Takes nothing, and returns to
; the CCP through the program's own return address.
NOTHW:	LD	DE,NOTMSG	; no board devices here, and no harm done
; Print the $-ended string at DE. A jump here prints and ends the program.
; Changes AF, BC, DE and HL.
SAY:	LD	C,9		; BDOS print string
	JP	BDOS		; its RET is this routine's

; Print the $-ended label at DE, then A in hex. Changes AF, BC and DE.
LABHEX:	PUSH	AF		; the value, across the BDOS call
	PUSH	HL		; the BDOS changes HL
	CALL	SAY
	POP	HL
	POP	AF		; on into HEX
; Print A as two hex digits, which also prints a BCD byte in decimal.
; Changes AF, BC and DE.
HEX:	PUSH	HL		; a caller may keep a value here
	PUSH	AF		; the low digit comes second
	RRCA			; the high digit down to bits 0 to 3
	RRCA
	RRCA
	RRCA
	CALL	NIBBLE		; the high digit
	POP	AF
	CALL	NIBBLE		; the low digit
	POP	HL
	RET

; Print the low four bits of A as a hex digit. Changes AF, BC, DE and HL.
NIBBLE:	AND	$0F		; one digit
	ADD	A,'0'
	CP	'9'+1		; past 9: the letters start seven later
	JR	C,NIBB1
	ADD	A,7
NIBB1:	LD	E,A		; BDOS console output
	LD	C,2
	JP	BDOS		; its RET is this routine's

TAG:	DB	"TNA",5
NOTMSG:	DB	"not TEC-OS with ABI 5",13,10,"$"
```

The rest of the file is for printing. A jump to `SAY` prints a string and
ends the program. `LABHEX` prints a label and then a byte in hexadecimal,
through `HEX` and `NIBBLE`. `NOTHW` falls through into `SAY` and `LABHEX`
into `HEX`. A BCD byte holds one decimal digit in each half, so `HEX` prints
it in decimal.

## The call

The call has one form for every numbered service. The program puts the
service's number in `C` and the arguments in `B`, `DE` and `HL`. Then it
calls `ABICALL`. `A` takes no argument, because the dispatcher uses it to
look the number up. On return `A` holds a status, with the flags set to
match. The registry's two services return something else, as Chapter 12
describes.

| Status | Flags | Meaning |
| ---: | --- | --- |
| 0 | zero set, carry clear | success |
| 1 | carry set | no such service, an argument out of range, or a request rejected with nothing changed |
| 2 | carry set | the device isn't fitted, or isn't the console |

`JP NZ` and `JP C` both catch a failure. Results are in registers that differ
from service to service. `IX`, `IY` and the alternate registers keep their
values. The volume services, 9 to 11, are the exception and may change `IX`
and the alternates. A program treats `BC`, `DE` and `HL` as changed unless a
service returns something there. Any number from 16 up returns status 1 with
`B`, `DE` and `HL` as they were.

The services run on the caller's stack. `abi.inc` gives a bound for each, the
most it takes on top of the `CALL`'s return address, the dispatcher's
included. The nine are these:

| Number | `abi.inc` | Does | Stack bound |
| ---: | --- | --- | ---: |
| 0 | `TNINFO` | reports the board's devices, the ROM's version and the console's size | 6 |
| 1 | `TNDIGIT` | makes one pass over the six 7-segment digits | 4 |
| 2 | `TNLCD` | writes one row of the 20 × 4 LCD | 10 |
| 3 | `TNVIDEO` | claims or releases the PICO9918 | 12 |
| 4 | `TNTONE` | sounds the speaker | 4 |
| 5 | `TNJOY` | reads the joystick | 4 |
| 6 | `TNKEYS` | reads the matrix keyboard's rows | 4 |
| 7 | `TNPUTAT` | writes text at a screen position on a video console | 22 |
| 8 | `TNRTC` | reads or sets the DS1302 clock | 8 |

The deepest is `PUTAT` at 22 bytes, and that fits the stack a program starts
on, which [Chapter 8](08-memory.md) describes. No hardware service calls the
BDOS. A program can therefore call one from code that runs inside a BDOS
call, such as a routine reached through its own entry in the BIOS jump
table. The hardware services keep one byte of state, the claim on the
PICO9918, in TEC-OS's workspace.

## The board's report

A program tests what is on the board before it uses a device. `INFO`, number
0, takes no arguments. It returns the devices in `B`, the ROM's version in
`DE`, the console's columns in `L` and its rows in `H`. The bits of `B` are
these:

| `B` bit | Value | Set when |
| ---: | ---: | --- |
| 0 | `01h` | the matrix keyboard is enabled, by the board's Matrix switch |
| 1 | `02h` | a PICO9918 answered at cold boot |
| 2 | `04h` | `GLCD.SVC` is in |
| 3 | `08h` | a DS1302 clock answered at cold boot |
| 4 | `10h` | the PICO9918 is claimed |
| 7 | `80h` | the ROM's word `GLCD?` is on LCD row 3 |

`DE` holds the major version in `D` and the minor in `E`, so `0001h` is
version 0.1. `BOARD` prints all of it, then calls number 16, one past the
last service, to show a failure:

```asm
; BOARD: print what INFO reports, then what a bad number returns.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	C,TNINFO
	CALL	ABICALL
	PUSH	HL		; the size, across the printing
	PUSH	DE		; and the version
	LD	A,B		; the device bits
	LD	DE,MSGB		; the first line
	CALL	LABHEX
	POP	HL		; the version, high byte first
	LD	A,H
	LD	DE,MSGVER	; the second
	CALL	LABHEX
	LD	A,L		; then the low byte on the same line
	CALL	HEX
	POP	HL		; the console's size
	PUSH	HL		; the rows, for the next line
	LD	A,L		; the columns
	LD	DE,MSGCOL	; the third
	CALL	LABHEX
	POP	HL		; the rows
	LD	A,H
	LD	DE,MSGROW	; the fourth
	CALL	LABHEX
	LD	C,TNCOUNT	; the number after the last service
	CALL	ABICALL
	PUSH	AF		; the status, and its carry
	LD	DE,MSGBAD
	CALL	LABHEX
	POP	AF		; only the carry is wanted now
	LD	DE,MSGNC
	JP	NC,SAY		; prints and ends the program
	LD	DE,MSGC		; the carry was set
	JP	SAY		; prints and ends the program

; What each line starts with, and how the last ends.
MSGB:	DB	"Devices  B = $"
MSGVER:	DB	13,10,"Version DE = $"
MSGCOL:	DB	13,10,"Columns  L = $"
MSGROW:	DB	13,10,"Rows     H = $"
; The last line: the status, then its carry.
MSGBAD:	DB	13,10,"Number 16: status $"
MSGC:	DB	", carry set",13,10,"$"
MSGNC:	DB	", carry clear",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

`TAS` assembles the program on the board, so `ABI.INC` and `HWLIB.ASM` go on
the card beside the source. On a PC these commands put the three files on a
copy of the starter card:

```sh
cp dist/starter.img hw.img
node tools/tecvol.mjs put hw.img B dist/abi.inc --text
node tools/tecvol.mjs put hw.img B hwlib.asm --text
node tools/tecvol.mjs put hw.img B board.asm --text
```

Each later program's source goes on `hw.img` the same way. `TAS BOARD`
reads `BOARD.ASM` from the current drive and writes `BOARD.COM` beside it.
`TAS.COM` is on drive A, and [Chapter 3](03-command-line.md) explains how
the CCP finds a program that isn't on the current drive. On the serial board,
where the clock is the one device, `BOARD` prints this:

<!-- node tools/capture.mjs --card hw.img B: "TAS BOARD" BOARD -->
```text
A>B:
B>TAS BOARD
BOARD.COM written

B>BOARD
Devices  B = 08
Version DE = 0001
Columns  L = 00
Rows     H = 00
Number 16: status 01, carry set

B>
```

On the web page's board the ROM's console is on the PICO9918. Bits 0 and 1
are set as well, and the console has a size, `50h` columns and `18h` rows.
Bit 2 stays clear, because the startup file's `GLCD.SVC` line installs
nothing while the PICO9918 is the console, as
[Chapter 6](06-startup-file.md) explains:

<!-- node tools/capture.mjs --card hw.img --board pico B: "TAS BOARD" BOARD -->
```text
A>B:
B>TAS BOARD
BOARD.COM written

B>BOARD
Devices  B = 0B
Version DE = 0001
Columns  L = 50
Rows     H = 18
Number 16: status 01, carry set

B>
```

With only the graphics LCD, `GLCD.SVC` installs and is the console. There
the same program gives `0D` for the devices, `15` for the columns and `08`
for the rows.

A program that lays out a screen, such as an editor, uses the size `INFO`
returns. TEC-OS can't read the serial terminal's size, so while that is the
console it gives both figures as 0. A program then uses 80 by 24, as the CCP
does for `[more]`. `SIZE` prints the size in decimal. It carries its own copy
of the check and needs nothing from `HWLIB.ASM`, so it is assembled on the PC
with ATOM, as [Chapter 7](07-first-program.md) describes:

```asm
; SIZE: print the console's size, read through TEC-OS's table.
BDOS    EQU     $0005
ABITAB  EQU     $C003           ; "TNA", then the major version
ABICALL EQU     $C008           ; a jump to the service numbered in C
TNINFO  EQU     0               ; INFO: L = the columns, H = the rows

        ORG     $0100
        LD      HL,ABITAB       ; is this TEC-OS with ABI 5?
        LD      DE,TAG
        LD      B,4
CHECK:  LD      A,(DE)
        CP      (HL)
        JR      NZ,OTHER
        INC     HL
        INC     DE
        DJNZ    CHECK
        LD      C,TNINFO
        CALL    ABICALL
        LD      A,L             ; the columns
        OR      A
        JR      Z,SERIAL        ; 0: the serial terminal
        LD      B,H             ; the rows
        PUSH    BC
        CALL    DEC
        LD      DE,BY
        LD      C,9
        CALL    BDOS
        POP     BC
        LD      A,B
        CALL    DEC
        LD      DE,ROWS
        JR      SAY
SERIAL: LD      DE,SERMSG
        JR      SAY
OTHER:  LD      DE,NOTMSG
SAY:    LD      C,9
        JP      BDOS

DEC:    LD      B,'0'-1         ; print A, 0 to 99, in decimal
TENS:   INC     B
        SUB     10
        JR      NC,TENS
        ADD     A,10+'0'
        PUSH    AF
        LD      A,B
        CP      '0'
        JR      Z,UNITS         ; no leading zero
        LD      E,A
        LD      C,2
        CALL    BDOS
UNITS:  POP     AF
        LD      E,A
        LD      C,2
        JP      BDOS

TAG:    DB      "TNA",5
BY:     DB      " columns, $"
ROWS:   DB      " rows",13,10,"$"
SERMSG: DB      "serial terminal",13,10,"$"
NOTMSG: DB      "not TEC-OS with ABI 5",13,10,"$"
```

`DEC` counts tens in `B` by subtracting 10 until the subtraction borrows. The
borrow leaves `A` 10 below the units, so adding `10+'0'` gives the units
digit. These commands put the program on `hw.img`:

```sh
npx atom size.asm size.com
node tools/tecvol.mjs put hw.img B size.com
```

On the serial board the program prints this:

<!-- node tools/capture.mjs --card hw.img B:SIZE -->
```text
A>B:SIZE
serial terminal

A>
```

On the web page's board the PICO9918 is the console at 80 columns, and after
`CON UC1` the graphics LCD is. The lines up to the echo of `CON UC1` were on
the PICO9918, and the rest on the graphics LCD:

<!-- node tools/capture.mjs --board pico --card hw.img B:SIZE "CON UC1" B:SIZE -->
```text
A>B:SIZE
80 columns, 24 rows

A>CON UC1
CON: UC1:
A>B:SIZE
21 columns, 8 rows

A>
```

The size changes whenever the console does. A program that changes the
console reads the size again, and a later run reads it afresh.

## The LCD and the speaker

The 20 × 4 LCD is the one display a program can write without touching the
console, since it is never the console. `LCD`, number 2, writes one row of it.
`B` is the row, 0 to 3, and `HL` points at 20 characters, so a program pads a
shorter message with spaces. A row of 4 or more returns status 1. `TONE`,
number 4, sounds the speaker, and `LCDMSG` uses both, after the check:

```asm
; LCDMSG: write a row of the 20 x 4 LCD and beep, on TEC-OS only.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	B,1		; the LCD's second row
	LD	HL,TEXT		; exactly 20 characters
	LD	C,TNLCD
	CALL	ABICALL		; A is the status, 0 for this row
	LD	B,120		; about 1 kHz
	LD	DE,400		; 400 half cycles, about 0.2 s
	LD	C,TNTONE
	CALL	ABICALL		; returns when the tone ends
	LD	DE,DONE
	JP	SAY		; prints and ends the program

TEXT:	DB	"Hello on the LCD    "
DONE:	DB	"Written and beeped",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

The run, with `--lcd` to print the LCD's rows at the end:

<!-- node tools/capture.mjs --card hw.img --lcd B: "TAS LCDMSG" LCDMSG -->
```text
A>B:
B>TAS LCDMSG
LCDMSG.COM written

B>LCDMSG
Written and beeped

B>
```

The LCD's second row now holds the message, and the rest is what cold boot
wrote there:

<!-- the same run's --lcd output -->
```text
TEC-OS 0.1  TEC-1G
Hello on the LCD
B: WORK
```

The row stays after the program ends. On a ROM whose major version isn't 5,
the same program prints `not TEC-OS with ABI 5` and leaves the LCD alone.

A program may write row 3 as freely as the others, and that row has one rule
of its own. TEC-OS puts the word `GLCD?` there, as Chapter 6 describes. When
`GLCD.SVC` installs, TEC-OS blanks the word, but only while the word is
there. `LCD` on row 3 clears the mark that records the word, so a program's
text there isn't blanked.

`TONE` makes a square wave on port `01h` bit 7. `B` sets the pitch and `DE`
the number of half cycles. Each half cycle takes 16 × `B` + 51 T-states and a
whole cycle is two of them. At 4 MHz the frequency in Hz is therefore
2,000,000 divided by that sum. These were measured on the model between one
write to the port and the next:

| `B` | T-states a half cycle | Frequency |
| ---: | ---: | ---: |
| 1 | 67 | 29,851 Hz |
| 10 | 211 | 9,479 Hz |
| 100 | 1,651 | 1,211 Hz |
| 120 | 1,971 | 1,015 Hz |
| 255 | 4,131 | 484 Hz |
| 0 | 4,147 | 482 Hz |

`B = 0` counts as 256, the lowest note. `B = 120` is the 1 kHz of `LCDMSG`,
and its `DE = 400` lasts 400 × 1,971 = 788,400 T-states, 0.2 seconds. For a
length in seconds, `DE` is the frequency × 2 × the seconds. `DE = 0` makes no
sound and returns at once.

The Z80 counts every half cycle, so `TONE` returns only when the sound ends.
Nothing else in the program runs in the meantime. The speaker ends off and
the serial line stays idle throughout.

## The digits and the clock

A number on the 7-segment digits takes more than one call, because the
board lights a single digit at a time. The six digits share one set of
segment lines. Port `02h` holds the pattern and port `01h` selects a digit.
The display looks steady only while the Z80 goes round the six fast enough
for the eye to merge them.

`DIGIT`, number 1, makes one pass. `HL` points at six bytes, the leftmost
digit first, and each byte is the pattern of lit segments. The service lights
each digit for about 0.84 ms and turns them all off at the end. A program
therefore calls it again and again from its main loop. A pass takes 20,670
T-states, about 5.2 ms, measured on the model. No service turns a number
into a pattern, so a program holds its own table.

`RTC`, number 8, reads or sets a DS1302 clock. `HL` points at seven bytes in
BCD: seconds, minutes, hours, date, month, weekday and year. `B = 0` reads
them into memory, and `B = 1` sets the clock from them and leaves the clock's
write protect on. Any other `B` returns status 1 and leaves the clock alone.
With no clock the service returns status 2, and bit 3 of `INFO` records
whether a clock answered at cold boot.

`DIGCLK` shows the time on the digits. Its loop makes one pass, checks for a
key with BDOS function 6 and goes round. One pass in 32 it reads the clock
first:

```asm
; DIGCLK: the time on the 7-segment digits, until a key.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
LOOP:	LD	HL,PASSES	; the clock is read one pass in 32
	INC	(HL)
	LD	A,(HL)
	AND	31		; 0 on every 32nd pass
	CALL	Z,TOSEG
	LD	HL,DIGS		; one pass over the six digits
	LD	C,TNDIGIT
	CALL	ABICALL
	LD	E,$FF		; BDOS direct input: a key, or 0
	LD	C,6
	CALL	BDOS
	OR	A
	JR	Z,LOOP		; no key: the digits need another pass
	RET			; DIGIT left them dark

; Read the clock and turn hours, minutes and seconds into six patterns at
; DIGS. Changes AF, BC, DE and HL; with no clock DIGS stays as it was.
TOSEG:	LD	HL,TIME		; seven BCD bytes, seconds first
	LD	B,0		; B = 0: read
	LD	C,TNRTC
	CALL	ABICALL
	RET	NZ		; status 2: no clock
	LD	DE,DIGS		; the leftmost digit's pattern first
	LD	A,(TIME+2)	; hours
	CALL	PAIR
	LD	A,(TIME+1)	; minutes
	CALL	PAIR
	LD	A,(TIME)	; seconds, and PAIR's RET ends TOSEG
; Store the two digits of the BCD byte in A as patterns at DE, which moves
; on by two. Changes AF, BC and HL.
PAIR:	PUSH	AF		; the units digit, for after the tens
	RRCA			; the tens digit down to bits 0 to 3
	RRCA
	RRCA
	RRCA
	CALL	SEG		; the tens
	POP	AF		; on into SEG for the units
; Store the low four bits of A as a pattern at DE, which moves on. Changes
; AF, BC and HL.
SEG:	AND	$0F		; one digit
	LD	C,A		; BC = the digit
	LD	B,0
	LD	HL,SEGTAB	; the digit's segments, one bit each
	ADD	HL,BC
	LD	A,(HL)
	LD	(DE),A		; into the row of six
	INC	DE
	RET

; The digits 0 to 9 as segment patterns.
SEGTAB:	DB	$EB,$28,$CD,$AD	; 0 to 3
	DB	$2E,$A7,$E7,$29	; 4 to 7
	DB	$EF,$AF		; 8 and 9
PASSES:	DB	31		; 31: the first pass reads the clock
DIGS:	DB	0,0,0,0,0,0
TIME:	DS	7
%INCLUDE "HWLIB.ASM"
```

The digits are dark for the time the program spends outside `DIGIT`. A
loop's other work therefore costs brightness and, if it runs long, flicker.
Here that work is a BDOS call and, every 32nd round, the clock. `DIGCLK` has
no code to clear the digits at its end, since they are dark as soon as the
calls stop.

`NOW` reads the clock and prints the date and time:

```asm
; NOW: print the date and time from the clock.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	HL,TIME		; seven BCD bytes
	LD	B,0		; B = 0: read
	LD	C,TNRTC
	CALL	ABICALL
	LD	DE,NOCLK
	JP	NZ,SAY		; status 2: no clock answered
	LD	DE,CENTY	; the clock holds two digits of the year
	CALL	SAY
	LD	HL,PLAN		; each field's offset, then what follows it
NEXT:	LD	C,(HL)		; BC = the field's offset in TIME
	LD	B,0
	INC	HL
	PUSH	HL		; the plan, across the printing
	LD	HL,TIME
	ADD	HL,BC
	LD	A,(HL)		; a BCD byte prints as decimal
	CALL	HEX
	POP	HL
	LD	E,(HL)		; the separator
	INC	HL
	PUSH	HL		; the plan again
	LD	C,2		; BDOS console output
	CALL	BDOS
	POP	HL
	LD	A,(HL)		; another field?
	INC	A
	JR	NZ,NEXT		; FFh ends the plan
	LD	DE,ENDLN
	JP	SAY		; prints and ends the program

PLAN:	DB	6,'-',4,'-'	; year, month
	DB	3,' ',2,':'	; date, hours
	DB	1,':',0,' '	; minutes, seconds
	DB	5,13,$FF	; weekday, 1 to 7; FFh ends the plan
CENTY:	DB	"20$"
NOCLK:	DB	"no clock",13,10,"$"
ENDLN:	DB	10,"$"		; after the plan's carriage return
TIME:	DS	7
%INCLUDE "HWLIB.ASM"
```

`PLAN` holds pairs: an offset into the seven bytes, then the character to
print after that field. The pairs turn the clock's order into the order
people write dates in:

<!-- node tools/capture.mjs --card hw.img B: "TAS NOW" NOW -->
```text
A>B:
B>TAS NOW
NOW.COM written

B>NOW
2026-11-01 12:00:08 07

B>
```

The model's clock started at 12:00 on 1 November 2026 when the run began,
and it counts the emulated T-states. It numbers the weekdays from Monday as
1, so this Sunday is `07`.

## The keys and the joystick

A game reads every key held down at a given moment, but the BDOS and the
BIOS give keys as characters, one at a time. `KEYS`, number 6, reads the
matrix keyboard's eight rows into eight bytes at `HL`, row 0 first, with a 1
for each key down. `JOY`, number 5, returns the joystick in `B`, again with a
1 for each line active.

Both always return status 0, so it is `INFO`'s bit 0 that reports whether
there is a matrix keyboard. `ROWS` tests that bit, waits for a key and prints
what the two services returned:

```asm
; ROWS: wait for a key on the matrix keyboard, then print the eight rows
; and the joystick's byte.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	C,TNINFO	; is there a matrix keyboard to wait for?
	CALL	ABICALL
	BIT	0,B		; INFO's matrix bit
	LD	DE,NOMTX
	JP	Z,SAY		; none: the wait would never end
WAIT:	CALL	SCAN		; until a key is down
	JR	Z,WAIT
	LD	C,TNJOY		; the same moment, read as the joystick
	CALL	ABICALL
	LD	A,B		; its bits
	LD	(STICK),A	; printed after the rows
	LD	HL,BUF		; the eight rows, on one line
	LD	B,8
SHOW:	LD	A,(HL)		; one row's byte
	INC	HL
	PUSH	BC		; the count, across the printing
	CALL	HEX
	LD	E,' '		; BDOS console output
	LD	C,2
	PUSH	HL		; the BDOS changes HL
	CALL	BDOS
	POP	HL
	POP	BC
	DJNZ	SHOW
	LD	A,(STICK)	; JOY's bits
	LD	DE,MSGJOY
	CALL	LABHEX
	LD	DE,CRLF		; end the line
	CALL	SAY
DRAIN:	CALL	SCAN		; end only when every key is up
	JR	NZ,DRAIN
	RET

; Read the rows into BUF. Returns Z if no key is down, NZ if one is.
; Changes AF, BC, DE and HL.
SCAN:	LD	HL,BUF		; eight bytes, row 0 first
	LD	C,TNKEYS
	CALL	ABICALL
	LD	HL,BUF		; OR the rows together
	LD	B,8
	XOR	A		; nothing seen yet
SCAN1:	OR	(HL)		; a key leaves a bit set
	INC	HL
	DJNZ	SCAN1
	OR	A		; Z if every row was 0
	RET

NOMTX:	DB	"no matrix keyboard",13,10,"$"
MSGJOY:	DB	" JOY $"
CRLF:	DB	13,10,"$"
BUF:	DS	8		; the rows, as KEYS leaves them
STICK:	DS	1		; JOY's byte
%INCLUDE "HWLIB.ASM"
```

`--board pico` has a matrix keyboard, and `@key` presses a key on it. The
key `x` is in row 7:

<!-- node tools/capture.mjs --card hw.img --board pico B: "TAS ROWS" "@start ROWS" "@key x" -->
```text
A>B:
B>TAS ROWS
ROWS.COM written

B>ROWS
00 00 00 00 00 00 00 08  JOY 00

B>
```

`JOY` reads port `FEh` with address line 11 low, and that is also how `KEYS`
selects row 3, so the two share a row. The key `5` is in row 3, and it shows
in both:

<!-- node tools/capture.mjs --card hw.img --board pico B: "TAS ROWS" "@start ROWS" "@key 5" -->
```text
A>B:
B>TAS ROWS
ROWS.COM written

B>ROWS
00 00 00 01 00 00 00 00  JOY 01

B>
```

On a board with a matrix keyboard, then, a key in row 3 reads as a joystick
bit. A joystick line reads as a key in row 3, on the console too: on the
model, bit 0 types `5`. [Appendix G](appendix-g-tec-1g.md) gives the
joystick's bits their names.

## Claiming the PICO9918

For graphics on the PICO9918, a program first claims it with `VIDEO`, number
3. `B = 1` claims and `B = 0` releases. Any other `B` returns status 1 with
nothing changed. On a board with no PICO9918 a claim and a release both
return status 2.

While the chip is claimed, the terminal code leaves it alone: output to it is
dropped, no cursor is drawn and no pages flip. The program may therefore set
any mode and use all of the VRAM, the chip's video memory. It reaches the
chip by its ports, `BEh` for data and `BFh` for control. It can also use the
graphics entries of the ROM's PICO9918 console, which Appendix B lists.
Nothing the program prints reaches the PICO9918 until the release. Its
messages go on the LCD, or they are printed before the claim.

Where the ROM's PICO9918 console started at cold boot, a release restores the
console's text mode, font and page. It also clears the screen and puts the
cursor at the top left, if the PICO9918 is the console. That took 217,252
T-states on the model, about 54 ms, at 80 columns. On a board with no
matrix keyboard the console doesn't start. A release there restores nothing,
and the chip stays as the program left it. The claim records no owner, and a
warm boot releases the chip in the same way. A program that ends without a
release therefore still gets the console back. A release with no claim does
nothing and returns status 0.

`DEMO`, at the end of this chapter, claims the chip when `INFO`'s bit 1 is
set. It draws on the chip by the ports until a key and then releases it.

## Text at a screen position

A full-screen program redraws part of the screen without moving the cursor
or scrolling. `PUTAT`, number 7, writes `B` characters from `HL` at row `D`,
column `E`, counted from 0, on a video console. It leaves the cursor's
position as it was and doesn't pass through the escape-sequence parser. It
removes the cursor's image first. The next wait for a key draws the cursor
again, as after any output. The text is clipped at the right edge. A row
below the screen writes nothing, and so does a count of 0. Both return status
0.

`PLACE` writes one word twice, and the second copy has bit 7 of each byte
set:

```asm
; PLACE: write a word at two screen positions with PUTAT, plain and in
; reverse, leaving the cursor where it is.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
	LD	DE,$0A1E	; row 10, column 30
	LD	HL,PLAIN
	CALL	WRITE
	LD	DE,$0B1E	; the row below
	LD	HL,INVERT
	CALL	WRITE
	LD	DE,MSG		; A holds the second call's status
	CALL	LABHEX
	LD	DE,CRLF		; end the line
	JP	SAY		; prints and ends the program

; Write the six characters at HL at row D, column E. Returns the status
; in A. Changes F, BC, DE and HL.
WRITE:	LD	B,6
	LD	C,TNPUTAT
	JP	ABICALL		; its RET is this routine's

PLAIN:	DB	"TEC-OS"
INVERT:	DB	$D4,$C5,$C3	; "TEC" with bit 7 set: reverse images
	DB	$AD,$CF,$D3	; "-OS", the same
MSG:	DB	"PUTAT status $"
CRLF:	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

`PUTAT` passes each byte to the display's routines. Both the ROM's PICO9918
console and `GLCD.SVC` draw `80h` to `FFh` as the reverse images of `00h` to
`7Fh`. `CONOUT` drops those bytes, as Chapter 9 says, so `PUTAT` is how a
program draws reverse characters with no escape sequence. On the PICO9918
the screen ends like this, with the second copy in reverse. A text capture
shows the two the same:

<!-- node tools/capture.mjs --card hw.img --board pico --screen B: "TAS PLACE" PLACE -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>GLCD.SVC

A>B:
B>TAS PLACE
PLACE.COM written
                              TEC-OS
B>PLACE                       TEC-OS
PUTAT status 00

B>
```

The cursor stayed where it was, at the start of row 12. The program's own
line and the next prompt therefore went below the word and left it in place.
The second copy shares row 11 with the command that ran the program. The
graphics LCD's screen has 8 rows, so there row 10 is below the screen, and
`PLACE` writes nothing and reports status 0. On the serial terminal it
reports status 2:

<!-- node tools/capture.mjs --card hw.img B: "TAS PLACE" PLACE -->
```text
A>B:
B>TAS PLACE
PLACE.COM written

B>PLACE
PUTAT status 02

B>
```

Status 2 also comes back while the PICO9918 is claimed and is the console.
With the console on the graphics LCD, a claim of the PICO9918 doesn't affect
`PUTAT`. A portable program uses `PUTAT` only after it has found the table's
letters and version. It keeps a path through the BDOS for status 2.

`PUTAT` is also faster than the console calls, by a margin that depends on
the display. The table gives T-states for one character, measured on the
model from the routine's entry to its return. On the PICO9918 at 80 columns
each path wrote 60 characters along one row, from column 2. On the graphics
LCD each wrote 15 characters from column 2. Nothing scrolled. A `CALL` adds
17 to the BIOS and BDOS rows, and to each string in the first row.

| Path | PICO9918 | Graphics LCD |
| --- | ---: | ---: |
| `PUTAT`, the whole string in one call | 517 | 39,600 |
| BIOS `CONOUT` | 822 | 39,700 |
| BDOS function 2 | 4,050 | 42,800 |

On the PICO9918 `PUTAT` is about eight times faster than the BDOS. The
graphics LCD is drawn pixel by pixel, so nearly all the time goes on the
drawing and the three paths come out close.

## DEMO

`DEMO` uses every service above. It tests the table, calls `INFO` and prints
which devices it found. Then it beeps with `B = 120` and `DE = 400` and
writes the LCD's four rows. If bit 1 was set it claims the PICO9918, sets
Graphics I by the ports and draws colour bars and a ball. Its main loop
reads the clock every 32nd round and shows it on LCD row 3. Each round also
makes a pass of `DIGIT` with a hexadecimal counter, moves the ball and polls
for a key. At the end `DEMO` releases the chip.

`DEMO` isn't on the starter card, but the web page's card has it on drive A,
so there `DEMO` at the prompt runs it. Its source is `test/programs/demo.asm`
in the repository, and `npm run media` writes the same program to
`dist/files/DEMO.COM`. These commands assemble it on the PC and put it on
drive B of `hw.img`:

```sh
npx atom test/programs/demo.asm demo.com
node tools/tecvol.mjs put hw.img B demo.com
```

<!-- node tools/capture.mjs --card hw.img --board pico --screen "@start B:DEMO" "@key x" -->
```text
A>B:DEMO

TEC-OS hardware services demo
PICO9918: yes   GLCD: no   clock: yes
Watch the LCD, the digits, the LEDs and the screen.
Press any key to stop.

Demo stopped.

A>
```

`GLCD: no` is `INFO`'s bit 2, clear on this board because the startup file's
`GLCD.SVC` line installs nothing while the PICO9918 is the console. The
transcript is everything the console was sent. The PICO9918 showed the first
lines until the claim. After the release it shows this:

<!-- the same run's --screen output -->
```text

Demo stopped.

A>
```

No hardware service drives the 8 × 8 LEDs. `DEMO` makes its rainbow by
writing their ports itself, one pass of the eight rows in each round of the
loop, as Appendix G describes. Those ports carry nothing of the serial line
or the console, so TEC-OS has no state there to protect.
