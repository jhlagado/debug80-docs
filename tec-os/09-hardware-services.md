---
title: The hardware services
parent: TEC-OS
nav_order: 9
nav_group: "Part I: Using and programming TEC-OS"
---

# 9. The hardware services

Checked against TEC-OS bd15528. The programs were assembled by the starter
card's `TAS.COM`, from Thorium 7604daa, SHA-256
`ff18734807206127d4ede7a96bbd26acf36310361834a1c9ae998b20e2f98292`.

A CP/M program has the BDOS for files and the console, and nothing for a
7-segment digit or a speaker. This chapter describes the calls TEC-OS has for
the board's own devices. It starts with the table at `C003h`, the test a
program makes before using it and the calling convention. The nine hardware
services follow, most with a program of their own, and `DEMO` at the end uses
them together.

## The ROM table

A program can write the TEC-1G's ports itself, but two devices are shared with
TEC-OS. Port `01h` selects the digit in bits 0 to 5, drives the speaker in bit
7 and carries the serial transmit line in bit 6. A program that scans the
digits or beeps and lets bit 6 fall sends noise down the serial line, which
may be the console. The PICO9918 may be the console too, and a program that
sets its registers takes the screen away from the terminal code. The hardware
services do these jobs with bit 6 held high and with the console's state kept
right.

A program finds the services through the *ROM table*, which starts at `C003h`,
after the reset jump. The table and a `RET` at `C01Dh` are the ROM's only
fixed addresses. Everything else can move from one build to the next. Chapter
8 used the table to read the console's size.

| Address | Name | Contents |
| --- | --- | --- |
| `C003h` | `ABITAB` | the letters `TNA` |
| `C006h` | `ABIMAJ` | the major version, 4 |
| `C007h` | `ABIMIN` | the minor version, 0 |
| `C008h` | `ABIVID` | a word: the address of the console's columns, with the rows after |
| `C00Ah` | `ABIHW` | a jump: the hardware services |
| `C00Dh` | `ABIMAIN` | a word: the address of the count of MAIN regions fitted |
| `C00Fh` | `ABIVOL` | a jump: mount, unmount and describe volumes |
| `C012h` | `ABIGLCD` | a jump: a video driver hands the ROM its table |
| `C015h` | `ABISVC` | a jump: the registry of services |

The version is the table's ABI, its application binary interface, here 4.0.
This chapter uses `ABIHW`. `MOUNT` and `VOLS` use `ABIVOL`, Chapter 10
describes `ABISVC`, and Appendix B lists every entry. A build writes the
table's addresses, the service numbers and the status codes to `dist/abi.inc`,
and it checks that file against the ROM. A program includes the file and uses
its names, as these programs do.

## Checking for TEC-OS

A CP/M program may run on a machine with no table at `C003h`, so it tests
before it calls. The test has two parts: the three letters, and a major
version of exactly 4. A later major version may move the entries after
`ABIMAIN` and renumber the services, so a program written for 4 can't use a 5
or a 3. `SIZE` in Chapter 8 tests the same four bytes.

A program that finds something else is on another system and leaves the
board's devices alone: these programs print a line and end. `CHKHW` below
makes the test. It is in a file of routines that this chapter's programs
share:

```asm
; HWLIB.ASM: routines this chapter's programs share. It goes after a
; program's own code, since it makes bytes where it is included.

; Test for TEC-OS with ABI 4. Returns Z if the table's four bytes match,
; NZ if not. Changes AF, B, DE and HL.
CHKHW:	LD	HL,ABITAB	; signature, then the major version
	LD	DE,TAG		; what they must be
	LD	B,4		; a major of 5 fails as a wrong letter does
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

TAG:	DB	"TNA",4
NOTMSG:	DB	"not TEC-OS with ABI 4",13,10,"$"
```

`LABHEX` falls through into `HEX`, and `NOTHW` into `SAY`. A BCD byte holds
one decimal digit in each half.

## Calling a hardware service

The call has one form for all nine. The program puts the service's number in
`C` and the arguments in `B`, `DE` and `HL`, and calls `ABIHW`. `A` takes no
argument: the dispatcher uses it to look the number up. On return `A` holds a
status, with the flags set to match:

| Status | Flags | Meaning |
| ---: | --- | --- |
| 0 | zero set, carry clear | success |
| 1 | carry set | no such service, or an argument out of range |
| 2 | carry set | the device isn't fitted, or isn't the console |

`JP NZ` and `JP C` both catch a failure. Results are in registers that differ
from service to service. `IX`, `IY` and the alternate registers keep their
values. A program treats `BC`, `DE` and `HL` as changed unless a service
returns something there.

The numbers run from 19 to 27. Every other number returns status 1 with `B`,
`DE` and `HL` as they were. The numbers start at 19 because the previous
version of the table stopped at 18. A program written for that version gets a
failure in place of the wrong service.

The services run on the caller's stack. The deepest is `PUTAT` on the graphics
LCD, which takes 22 bytes on top of the `CALL`'s return address. That fits the
28 bytes of the CCP's stack in a program that has pushed nothing. No service
calls the BDOS. A program can therefore call one from code that runs inside a
BDOS call, such as a routine reached through its own jump in the BIOS's table.
The services keep their one byte of state, the claim on the PICO9918 described
later in this chapter, in TEC-OS's workspace.

## A message on the LCD

`LCD`, number 21, writes one row of the 20 × 4 LCD. `B` is the row, 0 to 3,
and `HL` points at 20 characters, so a program pads a shorter message with
spaces. A row of 4 or more returns status 1. `TONE`, number 23, sounds the
speaker. This program uses both, after the check:

```asm
; LCDMSG: write a row of the 20 x 4 LCD and beep, on TEC-OS only.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
	JP	NZ,NOTHW
	LD	B,1		; the LCD's second row
	LD	HL,TEXT		; exactly 20 characters
	LD	C,HWLCD
	CALL	ABIHW		; A is the status, 0 for this row
	LD	B,120		; about 1 kHz
	LD	DE,400		; 400 half cycles, about 0.2 s
	LD	C,HWTONE
	CALL	ABIHW		; returns when the tone ends
	LD	DE,DONE
	JP	SAY		; prints and ends the program

TEXT:	DB	"Hello on the LCD    "
DONE:	DB	"Written and beeped",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

`ABI.INC` and `HWLIB.ASM` go on the card beside the source. `TAS`, on drive A
of the starter card, assembles the program on the board. On a PC, these
commands put the three files on a copy of the starter card:

```sh
cp dist/starter.img hw.img
node tools/tecvol.mjs put hw.img B dist/abi.inc --text
node tools/tecvol.mjs put hw.img B hwlib.asm --text
node tools/tecvol.mjs put hw.img B lcdmsg.asm --text
```

Each later program's source goes on `hw.img` the same way.

`TAS LCDMSG` reads `LCDMSG.ASM` from the current drive and writes `LCDMSG.COM`
and `LCDMSG.DBG` beside it. `A:` goes in front of the command because
`TAS.COM` isn't on drive B. The run:

<!-- node tools/capture.mjs --card hw.img --lcd B: "A:TAS LCDMSG" LCDMSG -->
```text
A>B:
B>A:TAS LCDMSG
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

The row stays after the program ends. On a ROM whose major version isn't 4,
the same program prints `not TEC-OS with ABI 4` and leaves the LCD alone.

A program may write row 3 as freely as the others, and that row has one rule
of its own. TEC-OS puts the words `PICO?` and `GLCD?` there, as Chapter 5
describes. It blanks the row when a display driver takes the console, but only
while its own word is there. `LCD` on row 3 clears the mark that records the
word, so a program's text there isn't blanked.

## The speaker

`TONE` makes a square wave on port `01h` bit 7. `B` sets the pitch and `DE`
the number of half cycles. Each half cycle takes 16 × `B` + 51 T-states, and a
whole cycle is two of them. At 4 MHz the frequency in Hz is 2,000,000 divided
by that sum. These were measured on the model between one write to the port
and the next:

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

The Z80 counts every half cycle, so `TONE` returns only when the sound ends
and nothing else in the program runs in the meantime. The speaker ends off and
the serial line stays idle throughout.

## The board's report

`INFO`, number 19, reports what is on the board and takes no arguments. It
returns the devices in `B`, the ROM's version in `DE`, the console's columns
in `L` and its rows in `H`. The columns and rows are 0 for the serial
terminal. The bits of `B` are these:

| `B` bit | Value | Set when |
| ---: | ---: | --- |
| 0 | `01h` | the matrix keyboard is enabled, by the board's Matrix switch |
| 1 | `02h` | a PICO9918 answered at cold boot |
| 2 | `04h` | `GLCD.SVC` is in |
| 3 | `08h` | a DS1302 clock answers |
| 4 | `10h` | the PICO9918 is claimed |
| 7 | `80h` | a word of the ROM's, `PICO?` or `GLCD?`, is on LCD row 3 |

`INFO` tests bit 3 at each call by reading the clock's seconds, so it takes
about 1,550 T-states. `DE` holds the major version in `D` and the minor in
`E`, so `0001h` is version 0.1. This program prints all of it, then calls
number 18 to show a failure:

```asm
; BOARD: print what INFO reports, then what a bad number returns.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
	JP	NZ,NOTHW
	LD	C,HWINFO
	CALL	ABIHW
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
	LD	C,HWBASE-1	; the number below the first service
	CALL	ABIHW
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
MSGBAD:	DB	13,10,"Number 18: status $"
MSGC:	DB	", carry set",13,10,"$"
MSGNC:	DB	", carry clear",13,10,"$"
%INCLUDE "HWLIB.ASM"
```

On the board with only a serial terminal, the clock is the one device:

<!-- node tools/capture.mjs --card hw.img B: "A:TAS BOARD" BOARD -->
```text
A>B:
B>A:TAS BOARD
BOARD.COM written

B>BOARD
Devices  B = 08
Version DE = 0001
Columns  L = 00
Rows     H = 00
Number 18: status 01, carry set

B>
```

On the web page's board, with `PICO.SVC` in, bits 0 and 1 are set as well. The
console also has a size, 50h columns and 18h rows:

<!-- node tools/capture.mjs --card hw.img --board pico B: "A:TAS BOARD" BOARD -->
```text
A>B:
B>A:TAS BOARD
BOARD.COM written

B>BOARD
Devices  B = 0B
Version DE = 0001
Columns  L = 50
Rows     H = 18
Number 18: status 01, carry set

B>
```

With only the graphics LCD, the same program gives `0D` for the devices, `15`
for the columns and `08` for the rows.

## The 7-segment digits

The TEC-1G's six digits share one set of segment lines. Port `02h` holds the
pattern and port `01h` selects a digit, so the board lights one digit at a
time. The display looks steady only while the Z80 goes round the six fast
enough for the eye to merge them. Each digit is lit for its turn alone.

`DIGIT`, number 20, makes one pass. `HL` points at six segment patterns, the
leftmost digit first. The service lights each digit for about 0.84 ms and
turns them all off at the end. A pass takes 20,677 T-states, about 5.2 ms, and
the program calls the service again and again from its main loop. Each byte is
the pattern of lit segments. No service turns a number into a pattern, so a
program holds its own table.

`DIGCLK` shows the time. Its loop makes one pass, checks for a key with BDOS
function 6 and goes round. One pass in 32 it reads the clock first:

```asm
; DIGCLK: the time on the 7-segment digits, until a key.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
	JP	NZ,NOTHW
LOOP:	LD	HL,PASSES	; the clock is read one pass in 32
	INC	(HL)
	LD	A,(HL)
	AND	31		; 0 on every 32nd pass
	CALL	Z,TOSEG
	LD	HL,DIGS		; one pass over the six digits
	LD	C,HWDIGIT
	CALL	ABIHW
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
	LD	C,HWRTC
	CALL	ABIHW
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

On the model's serial board the loop goes round every 24,456 T-states, 164
times a second. Every 32nd round takes 32,093 for the clock. A video console
saves 630 to 750 a round. The digits are dark for the time the program spends
outside `DIGIT`, about 15 percent of the loop here. A loop's other work
therefore costs brightness and, if it runs long, flicker. `DIGCLK` has no code
to clear the digits at its end, since they are dark as soon as the calls stop.

## The clock

`RTC`, number 27, reads or sets a DS1302 clock. `HL` points at seven bytes in
BCD: seconds, minutes, hours, date, month, weekday and year. `B = 0` reads
them into memory, and any other value sets the clock from them. With no clock
the service returns status 2, and bit 3 of `INFO` gives the same answer in
advance.

```asm
; NOW: print the date and time from the clock.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
	JP	NZ,NOTHW
	LD	HL,TIME		; seven BCD bytes
	LD	B,0		; B = 0: read
	LD	C,HWRTC
	CALL	ABIHW
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

`PLAN` holds pairs of an offset into the seven bytes and the character to
print after that field. The pairs turn the clock's order into the order people
write dates in:

<!-- node tools/capture.mjs --card hw.img B: "A:TAS NOW" NOW -->
```text
A>B:
B>A:TAS NOW
NOW.COM written

B>NOW
2026-11-01 12:00:08 07

B>
```

The model's clock started at 12:00 on 1 November 2026 when the run began, and
it counts the emulated T-states. It numbers the weekdays from Monday as 1, so
this Sunday is `07`.

## The joystick and the matrix keyboard

`KEYS`, number 25, reads the matrix keyboard's eight rows into eight bytes at
`HL`, row 0 first, with a 1 for each key down. The BDOS and the BIOS give keys
as characters, one at a time. `KEYS` gives every key held down at that moment,
which a game reads. `JOY`, number 24, returns the joystick in `B`, again with
a 1 for each line active.

Both always return status 0, and `INFO`'s bit 0 reports whether there is a
keyboard. `ROWS` tests that bit, waits for a key and prints what the two
services returned:

```asm
; ROWS: wait for a key on the matrix keyboard, then print the eight rows
; and the joystick's byte.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
	JP	NZ,NOTHW
	LD	C,HWINFO	; is there a matrix keyboard to wait for?
	CALL	ABIHW
	BIT	0,B		; INFO's matrix bit
	LD	DE,NOMTX
	JP	Z,SAY		; none: the wait would never end
WAIT:	CALL	SCAN		; until a key is down
	JR	Z,WAIT
	LD	C,HWJOY		; the same moment, read as the joystick
	CALL	ABIHW
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
	LD	C,HWKEYS
	CALL	ABIHW
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

`--board pico` has a matrix keyboard, and `@key` presses a key on it. The key
`x` is in row 7:

<!-- node tools/capture.mjs --card hw.img --board pico B: "A:TAS ROWS" "@start ROWS" "@key x" -->
```text
A>B:
B>A:TAS ROWS
ROWS.COM written

B>ROWS
00 00 00 00 00 00 00 08  JOY 00

B>
```

`JOY` reads port `FEh` with address line 11 low, and that is also how `KEYS`
selects row 3, so the two share a row. The key `5` is in row 3, and it shows
in both:

<!-- node tools/capture.mjs --card hw.img --board pico B: "A:TAS ROWS" "@start ROWS" "@key 5" -->
```text
A>B:
B>A:TAS ROWS
ROWS.COM written

B>ROWS
00 00 00 01 00 00 00 00  JOY 01

B>
```

On a board with a matrix keyboard, then, a key in row 3 reads as a joystick
bit. A joystick line reads as a key in row 3, on the console too: on the
model, bit 0 types `5`. The diagnostics ROM's joystick test labels the bits,
after MON-3: `01h` up, `02h` down, `04h` left, `08h` right, `10h` fire 2,
`20h` pin 9, `40h` fire 1 and `80h` fire 3. The model's joystick is one byte
with no names, so a run confirms that each bit reaches `B` and leaves the
labels unconfirmed.

## Claiming the PICO9918

For graphics on the PICO9918, a program first claims it with `VIDEO`, service
number 22. Any nonzero `B` claims and `B = 0` releases. On a board with no
PICO9918 both return status 2.

While the chip is claimed, the terminal code leaves it alone: output to it is
dropped, no cursor is drawn and no pages flip. The program may set any mode
and use all of the VRAM. It reaches the chip by its ports, `BEh` for data and
`BFh` for control, or through the graphics entries of `PICO.SVC`, which
Appendix B lists. Nothing the program prints reaches the PICO9918 until the
release, so its messages go on the LCD or are printed before the claim.

A release with `PICO.SVC` in restores the driver's text mode, font and page.
If the PICO9918 is the console it also clears the screen and puts the cursor
at the top left. That took 213,242 T-states on the model, about 53 ms, at 80
columns. With `PICO.SVC` out, nothing is restored and the chip stays as the
program left it. The claim records no owner, and a warm boot releases it in
the same way. A program that ends without a release therefore still gets the
console back. A release with no claim does nothing and returns status 0.

`DEMO` on the starter card is the worked example, with its source in
`test/programs/demo.asm`. It claims the chip if `INFO`'s bit 1 is set and sets
Graphics I by the ports. It draws colour bars and a ball until a key, then
releases the chip:

<!-- node tools/capture.mjs --card hw.img --board pico --screen "@start DEMO" "@key x" -->
```text
A>DEMO

TEC-OS hardware services demo
PICO9918: yes   GLCD: no   clock: yes
Watch the LCD, the digits, the LEDs and the screen.
Press any key to stop.

Demo stopped.

A>
```

The transcript is everything the console was sent. The PICO9918 showed the
first lines until the claim, and what it shows after the release is this:

<!-- the same run's --screen output -->
```text

Demo stopped.

A>
```

## Text at a screen position

`PUTAT`, number 26, writes `B` characters from `HL` at row `D`, column `E`,
counted from 0, on a video console. It leaves the cursor's position as it was
and doesn't pass through the escape-sequence parser. A full-screen program can
therefore use it to redraw part of the screen. The text is clipped at the
right edge. A row below the screen writes nothing and a count of 0 does
nothing, and both return status 0.

`PLACE` writes one word twice. The second copy has bit 7 of each byte set:

```asm
; PLACE: write a word at two screen positions with PUTAT, plain and in
; reverse, leaving the cursor where it is.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 4
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
	LD	C,HWPUTAT
	JP	ABIHW		; its RET is this routine's

PLAIN:	DB	"TEC-OS"
INVERT:	DB	$D4,$C5,$C3	; "TEC" with bit 7 set: reverse images
	DB	$AD,$CF,$D3	; "-OS", the same
MSG:	DB	"PUTAT status $"
CRLF:	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

`PUTAT` passes each byte to the driver, and both display drivers draw bytes
`80h` to `FFh` as the reverse images of `00h` to `7Fh`. `CONOUT` drops those
bytes, as Chapter 8 says, so `PUTAT` is how a program draws reverse characters
with no escape sequence. On the PICO9918 the screen ends like this, with the
second copy in reverse, though a text capture shows the two the same:

<!-- node tools/capture.mjs --card hw.img --board pico --screen B: "A:TAS PLACE" PLACE -->
```text

A>GLCD.SVC
GLCD.SVC?

A>B:
B>A:TAS PLACE
PLACE.COM written

B>PLACE
PUTAT status 00
                              TEC-OS
B>                            TEC-OS
```

The cursor stayed in the flow of the console's text, and the next prompt
reached row 11 and left the word in place. On the graphics LCD, whose screen
has 8 rows, row 10 is below the screen, so `PLACE` writes nothing and reports
status 0. On the serial terminal it reports status 2:

<!-- node tools/capture.mjs --card hw.img B: "A:TAS PLACE" PLACE -->
```text
A>B:
B>A:TAS PLACE
PLACE.COM written

B>PLACE
PUTAT status 02

B>
```

Status 2 also comes back while the PICO9918 is claimed and is the console.
With the console on the graphics LCD, a claim of the PICO9918 doesn't affect
`PUTAT`. A portable program uses `PUTAT` only after it has found the
signature, and it keeps a path through the BDOS for status 2.

The gain depends on the display. These are T-states for one character in the
middle of a row, measured on the model with no scrolling. The run was 60 cells
on the PICO9918 at 80 columns. On the graphics LCD it was 15 from column 2,
and the figure falls by up to a tenth at other columns. A `CALL` adds 17 to
the BIOS and BDOS rows, and to each string in the first row.

| Path | PICO9918 | Graphics LCD |
| --- | ---: | ---: |
| `PUTAT`, the whole string in one call | 423 | 35,100 |
| BIOS `CONOUT` | 714 | 35,400 |
| BDOS function 2 | 3,860 | 38,400 |

On the PICO9918 `PUTAT` is about nine times faster than the BDOS. On the
graphics LCD, which draws each cell pixel by pixel, nearly all the time goes
on the drawing and the three paths come out close.

## DEMO

`DEMO` puts these calls together. It tests the table, calls `INFO` and prints
which devices it found. It beeps with `B = 120` and `DE = 400` and writes the
LCD's four rows. If bit 1 was set it claims the PICO9918. Its main loop then
reads the clock one pass in 32 and shows it on LCD row 3. The loop also makes
a pass of `DIGIT` with a hex counter, draws the ball and polls for a key. At
the end `DEMO` releases the chip.

No hardware service drives the 8 × 8 LEDs. `DEMO` makes its rainbow by writing
their ports itself, as Appendix G describes, a pass of the eight rows in each
round of the loop. Those ports carry nothing of the serial line or the
console, so TEC-OS has no state there to protect.
