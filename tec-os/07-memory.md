---
title: Memory for programs
parent: TEC-OS
nav_order: 7
nav_group: "Part I: Using and programming TEC-OS"
---

# 7. Memory for programs

Checked against TEC-OS 621201d, with the ATOM assembler from the
repository's `atom-z80` 0.3.7.

A program on TEC-OS has most of the Z80's memory to itself, and the rest is
TEC-OS's. This chapter starts with the Z80's 64 KiB as TEC-OS lays it out on a
TEC-1G. It then describes the TPA and the word at `0006h` that marks
its end, then page zero and the bytes TEC-OS keeps there. It ends with the
second half of the expansion RAM, which TEC-OS keeps for itself.

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
BDOS's entry or, with a service installed, up to the lowest service's jump on to
that entry. The drives' allocation vectors are above the BDOS's entry. Above
them, at the top of EXPAND 0, is TEC-OS's resident workspace. The workspace
holds the stacks and state of the BIOS, the CCP and the BDOS, and at `BF00h`
the BIOS jump table.

## The TPA and the word at 0006h

The memory a program has varies with the card and the services, so a program that
sizes its buffers reads its limit when it runs. The limit is the word at
`0006h`, the address in page zero's jump at `0005h`, through which every call to
the BDOS goes. CP/M also defines that word as the end of the TPA, so a program
may use memory from `0100h` up to the byte below that address. A program that
sizes its buffers from the word runs on any card and with any services.

Cold boot puts the BDOS's entry just below the allocation vectors, so the word
depends on the card's drives, as Chapter 4 explains. Each service installed
lowers it again, because TEC-OS loads the service on a page boundary below the
old address and the service's own jump on to the BDOS becomes the target of
the jump at `0005h`.
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

<!-- node tools/capture.mjs --card mem.img B:TOP -->
```text
A>B:TOP
B9A4h

A>
```

With the starter card on a board with both displays, the PICO9918's console is in the ROM and takes no
memory below the word. The startup file's `GLCD.SVC` line passes over the
driver quietly while the PICO9918 is the console, so the word is as on the
serial board. `CON UC1` then loads `GLCD.SVC` from the card and makes the
graphics LCD the console, and the word falls once. `B:TOP`, its reply and the
echo of `CON UC1` appeared on the PICO9918, and the rest on the graphics LCD:

<!-- node tools/capture.mjs --board pico --card mem.img B:TOP "CON UC1" B:TOP -->
```text
A>B:TOP
B9A4h

A>CON UC1
CON: UC1:
A>B:TOP
B600h

A>
```

`GLCD.SVC` takes 768 bytes, three pages of 256. A service starts on a page
boundary, so the first one installed also takes the bytes of the page below
the BDOS's entry, which are `B900h–B9A3h` on the starter card. The TPA is
therefore 47,268 bytes on the starter card with no service and 46,336 with
`GLCD.SVC`. A card whose header gives four drives, such as `my.img` from
Chapter 4, has `B6E4h` in the word with no service, and its TPA is then 46,564
bytes.

Cold boot sets up at most four drives, A to D, each with a vector of at most
256 bytes, so every card gives at least 46,564 bytes with no service and
45,568 with `GLCD.SVC`, when the word is `B300h`. Any other service takes its
own pages from those figures.

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
gives the figure for the starter card with no service:

```sh
npx atom area.asm area.com
node tools/tecvol.mjs put mem.img B area.com
```

<!-- node tools/capture.mjs --card mem.img B:AREA -->
```text
A>B:AREA
47268 bytes

A>
```

The CCP loads a `.COM` file from `0100h`, a record of 128 bytes at a time, and
stops at the 256-byte page that holds the address in the word at `0006h`. On
the starter card with no service the last record ends at `B8FFh`, so the
largest program file that loads is 47,104 bytes, 164 bytes short of the TPA. A
file one record longer fails like a missing one, with its name and a question
mark. By the same rule, the largest file that loads on a four-drive card with
`GLCD.SVC` is 45,568 bytes, the whole TPA. The limit applies to the file alone, and
a program's data may go on to the byte below the word at `0006h`.

The memory above the word is TEC-OS's. A program that writes there corrupts
the drives' allocation vectors or the BDOS's state, and what follows is a
damaged card or a crash. The stack a program starts on is up there too: it is
the CCP's, in the workspace, with 30 bytes free below the return address, as
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
| `0040h` | TEC-OS's copy of the system latch, below |
| `0041h–004Fh` | unused |
| `0050h` | the drive the CCP loaded the program from, 0 for the current drive (Chapter 6) |
| `005Ch–007Fh` | the FCB the CCP fills from the first word of the command tail |
| `006Ch–007Bh` | the second word's name, inside the first FCB |
| `0080h–00FFh` | the command tail, then the default DMA buffer |

The word at `0001h`, `BF03h`, is the address of the warm boot entry in the
BIOS jump table, the table's second entry, so a program finds the table by
subtracting 3 from it. Chapter 8 describes the console's entries there.

The restart vectors are free for a program, and for a debugger, while the
program runs. At each warm boot TEC-OS writes seven zeros and a `RET` into
each one that doesn't hold a jump above the word at `0006h`, into a service,
the workspace or the ROM. It then puts `EI` and `RETI` back at `0038h` unless
a jump there was kept. An `RST` through a vector a finished program set therefore
returns at once.

The Z80 enters `0038h` on an interrupt in mode 1, the mode cold boot sets, and
TEC-OS has nothing there but the return. Warm boot disables interrupts and
nothing in TEC-OS enables them, so a program starts with them off. A program
that enables them keeps them on, except while TEC-OS reads or writes a card
block, sends or receives a serial byte or reads the command history, when
TEC-OS holds them off and then restores them.

`0066h`, where the Z80 goes on a non-maskable interrupt, lies inside the FCB
at `005Ch`. On a board with the keypad NMI jumper fitted, a key on the hex
keypad lands there, so Chapter 1 says to keep off the keypad while a program
runs.

## TEC-OS's byte at 0040h

CP/M 2.2 leaves `0040h–004Fh` to the BIOS. TEC-OS keeps one byte there,
`0040h`, the value last written to the system latch, which TEC-OS reads while
EXPAND 1 is in the window. Cold boot clears all of page zero, and nothing in
TEC-OS uses `0041h–004Fh` after that. The console's state, its size included,
is in the workspace.

A program reads the console's size through the ROM table, as Chapter 8
describes, and leaves `0040h` alone unless it writes the latch itself. The latch at port
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
| `BE00h–BFFFh` | free |

EXPAND 1 in the window takes EXPAND 0 out of it, and the BDOS's entry, the
BIOS jump table, the workspace and any of the program above `7FFFh` go with
it. The jump at `0005h` then leads into a cache line, and the return word on
the CCP's stack is out of view. A program on that stack has lost its stack and
the BDOS before it writes a byte. A write to the window then damages the
cache, and the next flush can write wrong data to the card. TEC-OS has no
call that gives a program space there.

A program that ends with `JP 0000h` while EXPAND 1 is in view still reaches a
warm boot. The jump at `0000h` leads to `BF03h`, which in EXPAND 1 holds zeros
unless a program wrote there, and the Z80 runs on through them into the ROM at
`C000h`. The ROM's reset entry tells this from a reset by the byte at `0002h`
and goes to the warm boot, which puts EXPAND 0 back and writes the cache's
changes to the card as at any program's end (`src/boot.asm:20-22`,
`src/boot.asm:92-108`). A reset
and BIOS function 0 run cold boot.

