---
title: Memory for programs
parent: TEC-OS
nav_order: 7
nav_group: "Part I: Using and programming TEC-OS"
---

# 7. Memory for programs

Checked against TEC-OS 98c6416, with the ATOM assembler from the
repository's `atom-z80` 0.3.7. The starter card's `EDIT.COM` is from Edit
845d062, and its copy on the card has the SHA-256
`ed88337e6dfa2626dd37a225a0ec09332f4927a0bde62114bbf8661d2d0fdc78`.

A program on TEC-OS has most of the Z80's memory to itself, and the rest is
TEC-OS's. This chapter starts with the Z80's 64 KiB as TEC-OS lays it out on a
TEC-1G. It then describes the TPA and the word at `0006h` that marks
its end, then page zero and the bytes TEC-OS keeps there. It ends with the
second half of the expansion RAM, which TEC-OS keeps for itself, and the two
CP/M 3 calls that copy memory.

## The Z80's 64 KiB

The Z80 addresses 64 KiB, and on a TEC-1G running TEC-OS they fall into
three parts:

| Addresses | Size | Contents |
| --- | --- | --- |
| `0000h–7FFFh` | 32 KiB | the board's fixed RAM |
| `8000h–BFFFh` | 16 KiB | EXPAND 0 or EXPAND 1, the two halves of the RAM in socket U9 |
| `C000h–FFFFh` | 16 KiB | the TEC-OS ROM |

The window at `8000h–BFFFh` shows one half of the RAM chip in U9 at a time,
and bit 2 of the board's system latch, at port `FFh`, selects which. EXPAND 0
is in view when TEC-OS starts a program, so a program has 48 KiB of RAM from
`0000h` to `BFFFh`, with the ROM above it.

TEC-OS uses the top of that RAM, and programs have the rest. Page zero,
`0000h–00FFh`, holds the jumps and buffers through which a program reaches
TEC-OS. The TPA, CP/M's Transient Program Area, runs from `0100h` up to the
BDOS's entry, with the drives' allocation vectors above it. Above them, at the
top of EXPAND 0, is TEC-OS's resident workspace. The workspace holds the buffer
for card blocks, the stacks and state of the BIOS, the CCP and the BDOS, and at
`BF00h` the BIOS jump table.

Cold boot also tests for a second 32 KiB at `0000h–7FFFh`, MAIN 1, which bit 3
of the latch would put in view in place of the fixed RAM, MAIN 0. Cold boot
stores 1 or 2 at `0041h` for the number of regions and gives the second its
own copy of page zero, but TEC-OS uses no other byte of it.

## The TPA and the word at 0006h

The memory a program has varies with the card and the drivers, so a CP/M
program reads the figure when it runs. The figure is the word at `0006h`, the
address in page zero's jump at `0005h`, through which every call to the BDOS
goes. CP/M also defines that word as the end of the TPA, so a program may use
memory from `0100h` up to the byte below that address. A program that sizes
its buffers from the word runs on any card and with any drivers.

Cold boot puts the BDOS's entry just below the allocation vectors, so the word
depends on the card's drives, as Chapter 4 explains. Each driver installed
lowers it again, because TEC-OS loads the driver below the old address and the
driver's own jump on to the BDOS becomes the target of the jump at `0005h`.
This program prints the word:

```asm
; TOP: print the word at 0006h, the first byte above the program area.
BDOS    EQU     $0005

        ORG     $0100
        LD      A,($0007)       ; the high byte first
        CALL    HEX
        LD      A,($0006)
        CALL    HEX
        LD      DE,CRLF
        LD      C,9
        JP      BDOS

HEX:    PUSH    AF              ; A as two hex digits
        RRCA
        RRCA
        RRCA
        RRCA
        CALL    DIGIT
        POP     AF
DIGIT:  AND     $0F
        ADD     A,'0'
        CP      '9'+1
        JR      C,DIGIT1
        ADD     A,'A'-'9'-1
DIGIT1: LD      E,A
        LD      C,2
        JP      BDOS
CRLF:   DB      "h",13,10,"$"
```

`DIGIT` turns the low four bits of `A` into a character from `0` to `F` and
prints it with function 2. `HEX` calls it for the high four bits and then
falls into it for the low four. `DIGIT` ends with `JP BDOS`, so the BDOS's
return is the return of both. The program is assembled as Chapter 6 describes
and copied to drive B of a copy of the starter card, and here it runs on a
board with only a serial terminal:

```sh
cp dist/starter.img mem.img
npx atom top.asm top.com
node tools/tecvol.mjs put mem.img B top.com
```

<!-- node book/capture.mjs --card mem.img B:TOP -->
```text
A>B:TOP
B806h

A>
```

On the web page's board the startup file installs `PICO.DRV` and `CON UC1`
then installs `GLCD.DRV`, so the word falls twice. `B:TOP`, its reply and the
echo of `CON UC1` appeared on the PICO9918, and the rest on the graphics LCD:

<!-- node book/capture.mjs --board pico --card mem.img B:TOP "CON UC1" B:TOP -->
```text
A>B:TOP
B206h

A>CON UC1
CON: UC1: GLCD
A>B:TOP
AC06h

A>
```

Each display driver takes 1,536 bytes, six pages of 256, so the TPA is 46,854
bytes on the starter card with no driver, 45,318 with one and 43,782 with
both. A card whose header gives four drives, such as `my.img` from Chapter 4,
has `B506h` in the word with no driver, and its TPA is then 46,086 bytes.

Cold boot sets up at most four drives, A to D, each with a vector of at most
256 bytes, so every card gives at least 46,086 bytes with no driver, 44,550
with one display driver and 43,014 with both, when the word is `A906h`. Any
other driver takes its own pages from those figures.

A program that sizes its buffers works from the TPA's size, the word less
`0100h`. This program finds it and prints it in decimal:

```asm
; AREA: print the size of the program area in bytes, in decimal.
BDOS	EQU	$0005

	ORG	$0100
	LD	HL,($0006)	; the first byte above the area
	LD	DE,$0100	; the area's first byte
	OR	A		; clear carry for the subtraction
	SBC	HL,DE		; HL = the size in bytes
	CALL	PUTDEC
	LD	DE,BYTES	; the text after the number
	LD	C,9		; BDOS function 9: print a string
	JP	BDOS		; print, and return from there

; PUTDEC: print HL in decimal, always as five digits. Takes HL.
; Returns nothing. Changes AF, BC, DE and HL.
PUTDEC:	LD	BC,-10000	; the ten-thousands digit
	CALL	DIGIT
	LD	BC,-1000	; the thousands, from what is left
	CALL	DIGIT
	LD	BC,-100		; the hundreds
	CALL	DIGIT
	LD	BC,-10		; the tens
	CALL	DIGIT
	LD	BC,-1		; the units: fall into DIGIT

; DIGIT: print how many times a power of ten goes into HL. Takes the
; negative of the power in BC and the number in HL. Returns the
; remainder in HL. Changes AF, BC and DE.
DIGIT:	LD	A,'0'-1		; one below the character for 0
DLOOP:	INC	A		; the next digit
	ADD	HL,BC		; take off one power of ten
	JR	C,DLOOP		; carry: HL is still 0 or more
	SBC	HL,BC		; one too many: add the power back
	PUSH	HL		; function 2 changes the registers
	LD	E,A
	LD	C,2		; BDOS function 2: print E
	CALL	BDOS
	POP	HL
	RET

BYTES:	DB	" bytes",13,10,"$"
```

`PUTDEC` finds each digit by adding a negative power of ten to `HL` and
counting until the total falls below zero, which clears the carry. `SBC HL,BC`
then adds that power back. Assembled and copied to `mem.img`, the program
gives the figure for the starter card with no driver:

```sh
npx atom area.asm area.com
node tools/tecvol.mjs put mem.img B area.com
```

<!-- node book/capture.mjs --card mem.img B:AREA -->
```text
A>B:AREA
46854 bytes

A>
```

The CCP loads a `.COM` file from `0100h`, a record of 128 bytes at a time, and
stops at the 256-byte page that holds the address in the word at `0006h`. On
the starter card with no driver the last record ends at `B7FFh`, so the
largest program file that loads is 46,848 bytes, six bytes short of the TPA. A
file one record longer fails like a missing one, with its name and a question
mark. By the same rule, the largest file that loads on a four-drive card with
both display drivers is 43,008 bytes. The limit applies to the file alone, and
a program's data may go on to the byte below the word at `0006h`.

The memory above the word is TEC-OS's. A program that writes there corrupts
the drives' allocation vectors or the BDOS's state, and what follows is a
damaged card or a crash. The stack a program starts on is up there too: it is
the CCP's, in the workspace, with 28 bytes free below the return address, as
Chapter 6 says. A program that uses more sets `SP` to a stack of its own below
the word at `0006h`.

On CP/M 2.2 the CCP is in RAM below the BDOS, and a program may overwrite it,
since warm boot reads the CCP back from disk. On TEC-OS that gains a program
nothing, because the CCP and the BDOS are in the ROM and the TPA already runs
up to the word at `0006h`.

## Page zero

CP/M fixes the use of the first 256 bytes, and TEC-OS follows it:

| Addresses | Contents |
| --- | --- |
| `0000h–0002h` | a jump to the BIOS's warm boot, at `BF03h` |
| `0003h` | the IOBYTE |
| `0004h` | the current drive, in bits 0–3, and user area, in bits 4–7 |
| `0005h–0007h` | the jump to the BDOS, whose address is the end of the TPA |
| `0008h–0037h` | the restart vectors of `RST 08h` to `RST 30h` |
| `0038h–003Ah` | `EI` and `RETI`, the return from an interrupt in mode 1 |
| `0040h–004Fh` | TEC-OS's own bytes, below |
| `005Ch–007Fh` | the FCB the CCP fills from the first word of the command tail |
| `006Ch–007Bh` | the second word's name, inside the first FCB |
| `0080h–00FFh` | the command tail, then the default DMA buffer |

The word at `0001h`, `BF03h`, is the address of the warm boot entry in the
BIOS jump table, the table's second entry, so a program finds the table by
subtracting 3 from it. Chapter 8 describes the console's entries there.

The restart vectors are free for a program, and for a debugger, while the
program runs. At each warm boot TEC-OS writes seven zeros and a `RET` into
each one that doesn't hold a jump into the ROM. An `RST` through a vector a
finished program set therefore returns at once.

The Z80 enters `0038h` on an interrupt in mode 1, the mode cold boot sets, and
TEC-OS has nothing there but the return. Warm boot disables interrupts and
nothing in TEC-OS enables them, so a program starts with them off. A program
that enables them keeps them on, except while TEC-OS reads or writes a card
block, when TEC-OS holds them off and then restores them.

`0066h`, where the Z80 goes on a non-maskable interrupt, lies inside the FCB
at `005Ch`. On a board with the keypad NMI jumper fitted, a key on the hex
keypad lands there, so Chapter 1 says to keep off the keypad while a program
runs.

## TEC-OS's bytes at 0040h

CP/M 2.2 leaves `0040h–004Fh` to the BIOS, and TEC-OS keeps there the state
that must stay in view whichever half of the expansion RAM is in the window:

| Address | Contents |
| --- | --- |
| `0040h` | the value last written to the system latch |
| `0041h` | the number of 32 KiB regions at `0000h`, 1 or 2 |
| `0042h` | nonzero while a console byte is waiting at `0043h` |
| `0043h` | the waiting byte |
| `0044h` | the number of halves of the expansion RAM, 2 |
| `0045h` | bits for the matrix keyboard, the displays and the LCD's word |
| `0046h`, `0047h` | the video console's cursor row and column |
| `0048h`, `0049h` | the console's columns and rows, 0 on the serial terminal |
| `004Ah–004Ch` | the state of the escape sequence being read, and its two numbers |
| `004Dh` | the matrix key down at the last scan, FFh for none |
| `004Eh` | 80h while reverse video is on |
| `004Fh` | 1 while the cursor's cell is drawn as its reverse image |

A program reads the console's size at `0048h`, as Chapter 8 describes, and
leaves the rest alone unless it writes the latch itself. The latch at port
`FFh` can only be written, so `0040h` is TEC-OS's record of what it holds. A
program that writes the latch writes the same value to `0040h`, because
otherwise TEC-OS's next change to the latch puts back the bits as `0040h`
recorded them.

## EXPAND 1

The second half of the expansion RAM, EXPAND 1, is TEC-OS's alone. Cold boot
clears it, and TEC-OS keeps in it:

| Addresses | Contents |
| --- | --- |
| `8000h–BBFFh` | the block cache's 30 lines, each with room for one card block of 512 bytes |
| `BC00h–BC9Dh` | the cache's table: the card block each line holds, and whether it has changes |
| `BD00h–BDFFh` | the history of command lines |
| `BE00h–BEFFh` | free |
| `BF00h–BFFFh` | reserved |

EXPAND 1 in the window takes EXPAND 0 out of it, and the BDOS's entry, the
BIOS jump table, the workspace and any of the program above `7FFFh` go with
it. The jump at `0005h` then leads into a cache line, and the return word on
the CCP's stack is out of view. A program on that stack has lost its stack and
the BDOS before it writes a byte. A write to the window then damages the
cache, and the next flush can write wrong data to the card. TEC-OS has no
service that gives a program space there.

## XMOVE and MOVE

CP/M 3 gives programs two BIOS calls for copying memory between banks,
separately switched regions of memory that share addresses, and TEC-OS has
them with CP/M 3's numbers and registers. `XMOVE`, BIOS function 29, takes the
destination bank in `B` and the source bank in `C` for the next copy. `MOVE`,
BIOS function 25, copies `BC` bytes from the address in `DE` to the address in
`HL`, forwards as `LDIR` does. It copies between the banks `XMOVE` named, or
within bank 0 if `XMOVE` wasn't called. Each `MOVE` uses the banks once, and
the next is in bank 0 again. A program reaches both through BDOS function 50,
CP/M 3's direct BIOS call. `DE` points at a BIOS parameter block of eight
bytes, which holds the BIOS function and then the values for `A`, `BC`, `DE`
and `HL`.

On TEC-OS, bank 0 is the program's view of memory, from `0000h` up to the word
at `0006h`, and bank 1 is EXPAND 1. Since EXPAND 1 is TEC-OS's, bank 1 has no
bytes a program may use. A `MOVE` with any byte in bank 1 therefore copies
nothing and returns `FFh` in `A`, and a copy that runs past the word at
`0006h` does the same. A `MOVE` within bank 0 copies and returns 0. A copy
puts the latch and the interrupt state back as they were before it. This
program makes a `MOVE` into bank 1 and one within bank 0:

```asm
; BANKS: try CP/M 3's MOVE into bank 1, then within bank 0, and print the
; result of each, 00 for a copy made and FF for one refused.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,TOBANK1      ; XMOVE: the next MOVE goes to bank 1
        CALL    BIOS
        LD      DE,MOVE1        ; MOVE 16 bytes to 8000h in bank 1
        CALL    BIOS
        CALL    SHOW
        LD      DE,MOVE0        ; MOVE 16 bytes within bank 0
        CALL    BIOS
        CALL    SHOW
        LD      DE,COPY         ; print the copy
        LD      C,9
        JP      BDOS

BIOS:   LD      C,50            ; BDOS function 50: call the BIOS
        JP      BDOS

SHOW:   PUSH    AF              ; print A as two hex digits, then CR LF
        RRCA
        RRCA
        RRCA
        RRCA
        CALL    DIGIT
        POP     AF
        CALL    DIGIT
        LD      DE,CRLF
        LD      C,9
        JP      BDOS
DIGIT:  AND     $0F
        ADD     A,'0'
        CP      '9'+1
        JR      C,DIGIT1
        ADD     A,'A'-'9'-1
DIGIT1: LD      E,A
        LD      C,2
        JP      BDOS

; Each BIOS parameter block: the BIOS function, then A, BC, DE and HL.
TOBANK1:DB      29,0
        DW      $0100,0,0       ; B = 1, the destination; C = 0, the source
MOVE1:  DB      25,0
        DW      16,TEXT,$8000   ; 16 bytes from TEXT to 8000h
MOVE0:  DB      25,0
        DW      16,TEXT,COPY    ; 16 bytes from TEXT to COPY
TEXT:   DB      "copied in bank 0"
CRLF:   DB      13,10,"$"
COPY:   DS      16,'.'
        DB      13,10,"$"
```

Function 50 returns the registers the BIOS call left, so `A` after the call
is `MOVE`'s result. `DS 16,'.'` fills the 16 bytes of `COPY` with full stops
in the file, so that a copy that didn't happen would show as dots:

```sh
npx atom banks.asm banks.com
node tools/tecvol.mjs put mem.img B banks.com
```

<!-- node book/capture.mjs --card mem.img B:BANKS -->
```text
A>B:BANKS
FF
00
copied in bank 0

A>
```

A CP/M 3 program that keeps data in a second bank therefore needs a version
that keeps it in bank 0.
