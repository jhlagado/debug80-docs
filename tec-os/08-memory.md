---
title: Memory for programs
parent: TEC-OS
nav_order: 8
nav_group: "Part I: Using and programming TEC-OS"
---

# 8. Memory for programs

<!-- Checked against TEC-OS 78127ec, with the ATOM assembler from the
     repository's `atom-z80` 0.3.7. -->

A program on TEC-OS loads at `0100h` and has most of the Z80's 64 KiB to
itself. The rest is TEC-OS's. A program that writes there crashes the board
or damages the card. The line between the two moves with the card and the
services installed, so a program reads it from page zero when it runs.

## The 64 KiB on a TEC-1G

TEC-OS needs a TEC-1G with 64 KiB of RAM. The Z80's addresses then fall into
three parts:

| Addresses | Size | Contents |
| --- | --- | --- |
| `0000h–7FFFh` | 32 KiB | the board's fixed RAM |
| `8000h–BFFFh` | 16 KiB | EXPAND 0 or EXPAND 1, the two halves of the RAM in socket U9 |
| `C000h–FFFFh` | 16 KiB | the TEC-OS ROM |

The window at `8000h–BFFFh` shows one half of the chip in U9 at a time. Bit 2
of the board's system latch, at port `FFh`, selects the half. EXPAND 0 is in
view when TEC-OS starts a program. A program therefore has 48 KiB of RAM,
from `0000h` to `BFFFh`, with the ROM above it. EXPAND 1 is TEC-OS's own,
and the last section describes it.

TEC-OS keeps the top of that RAM and programs have the rest. Page zero,
`0000h–00FFh`, holds the jumps and buffers through which a program reaches
TEC-OS. The TPA, CP/M's transient program area, starts at `0100h`. Above it
are the drives' allocation vectors. Above them is TEC-OS's resident
workspace, which holds the state and stacks of the BIOS, the CCP and the
BDOS. The BIOS jump table is in the workspace at `BF00h`.

## The limit a program reads

The TPA ends at the BDOS's entry, the address in the jump at `0005h`. Every
call to the BDOS goes through that jump. CP/M also defines the word at
`0006h`, the jump's address, as the end of the TPA. A program may use memory
from `0100h` up to the byte below that address. The address depends on the
card's drives and on the services installed. A program that sizes its
buffers therefore reads the word when it runs, and such a program runs on
any card and with any services.

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
return is the return of both. The program is assembled on the PC as
[Chapter 7](07-first-program.md) describes. It then goes on drive B of a
copy of the starter card:

```sh
cp dist/starter.img mem.img
npx atom top.asm top.com
node tools/tecvol.mjs put mem.img B top.com
```

On a board with only a serial terminal it prints the starter card's figure:

<!-- node tools/capture.mjs --card mem.img B:TOP -->
```text
A>B:TOP
B9A4h

A>
```

On a board with both displays the PICO9918's console is in the ROM and takes
nothing below the word. The startup file's `GLCD.SVC` line passes over the
driver while the PICO9918 is the console, so the word is the same. `CON UC1`
then loads `GLCD.SVC` from the card and makes the graphics LCD the console,
and the word falls. The first `B:TOP`, its reply and the echo of `CON UC1`
appeared on the PICO9918, and the rest on the graphics LCD:

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

## The drives, the services and the word

Two things set the word: the card's drives and the services installed. The
table gives the word and the TPA for the starter card and for a card with
four drives, with and without `GLCD.SVC`. The last column is the largest
`.COM` file the CCP loads, which the next section explains.

| Card | Service | Word at `0006h` | TPA in bytes | Largest `.COM` that loads |
| --- | --- | --- | ---: | ---: |
| starter card | none | `B9A4h` | 47,268 | 47,104 |
| starter card | `GLCD.SVC` | `B600h` | 46,336 | 46,336 |
| four drives | none | `B6E4h` | 46,564 | 46,336 |
| four drives | `GLCD.SVC` | `B300h` | 45,568 | 45,568 |

Each drive that cold boot sets up costs memory, because the BDOS keeps an
allocation vector for it. The vector has one bit for each allocation block
of the drive's volume, set when a file uses the block. With it the BDOS
finds a free block without reading the directory. A G1M volume's vector is
64 bytes and a G8M volume's is 256. The vectors are directly below the
workspace. The BDOS's entry jump is directly below them, so they come out
of the TPA.

Cold boot gives out the vectors in one of two ways. A card whose header
gives no number of drives gets a vector for each drive with a volume, sized
for that volume. The starter card's two drives take 64 and 256 bytes, and
the word is `B9A4h`. A card whose header gives N drives, as
`tecvol create --drives N` makes it, gets a 256-byte vector for each of
drives A to the Nth. The drive gets its vector with or without a volume at
cold boot. `my.img` from [Chapter 4](04-cards-and-volumes.md) gives four, so
its vectors take 1,024 bytes and the word is `B6E4h`, 704 lower. Cold boot
sets up at most four drives, so no card takes the word below `B6E4h`.
[Chapter 5](05-drives-and-cache.md) explains what a drive's vector lets
`MOUNT` put on it.

A service lowers the word again. TEC-OS loads a service in whole pages of
256 bytes, and its last page is the page below the one that holds the word.
The service's own jump on to the BDOS becomes the target of the jump at
`0005h`, so the word falls to the service's first byte. `GLCD.SVC` takes
three pages. On the starter card it occupies `B600h–B8FFh`, and the bytes
above it up to the old word, `B900h–B9A3h`, go with it. That is why the
driver costs programs 932 bytes and not 768. A second service ends at the
page below the first. Each service takes its own pages from the figures in
the table.

A program that sizes its buffers works from the TPA's size, the word less
`0100h`. This program finds that size and prints it in decimal:

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

`PUTDEC` finds each digit by adding a negative power of ten to `HL`. It
counts until the total falls below zero, which clears the carry, and
`SBC HL,BC` then adds that power back. Assembled and copied to `mem.img`,
the program gives the starter card's figure with no service:

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

## The largest program that loads

The CCP loads a `.COM` file from `0100h`, a record of 128 bytes at a time.
It stops at the 256-byte page that holds the word's address. On the starter
card with no service the last record ends at `B8FFh`. The largest file that
loads is therefore 47,104 bytes, 164 short of the TPA. A file one record
longer fails like a missing file, with its name and a question mark. With a
service installed the word is on a page boundary, and the largest file is
then the whole TPA. The limit is on the file alone. A program's data may go
on to the byte below the word.

The memory above the word is TEC-OS's. A program that writes there corrupts
the drives' allocation vectors or the BDOS's state. What follows is a
damaged card or a crash. The stack a program starts on is up there too. It
is the CCP's, with 30 bytes free below the return address, as
[Chapter 7](07-first-program.md) says. A program that uses more sets `SP` to
a stack of its own below the word.

On CP/M 2.2 the CCP is in RAM below the BDOS. A program may overwrite it,
because warm boot reads the CCP back from disk. On TEC-OS the CCP and the
BDOS are in the ROM. Nothing below the word is TEC-OS's, so a program gains
nothing by the same trick.

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
| `0040h` | TEC-OS's copy of the system latch, in the next section |
| `0041h–004Fh` | unused |
| `0050h` | the drive the CCP loaded the program from, 0 for the current drive (Chapter 7) |
| `005Ch–007Fh` | the FCB the CCP fills from the first word of the command tail |
| `006Ch–007Bh` | the second word's name, inside the first FCB |
| `0080h–00FFh` | the command tail, then the default DMA buffer |

The word at `0001h`, `BF03h`, is the address of the warm boot entry in the
BIOS jump table, the table's second entry. A program finds the table by
subtracting 3 from it. [Chapter 9](09-programs-and-console.md) describes the
console's entries there.

The restart vectors are free for a program, and for a debugger, while the
program runs. At each warm boot TEC-OS sweeps them. A vector keeps a jump
whose target is above the word at `0006h`: into a service, the workspace or
the ROM. Every other vector gets seven zeros and a `RET`. TEC-OS then puts
`EI` and `RETI` back at `0038h` unless a jump there was kept. An `RST`
through a vector a finished program set therefore returns at once.

The Z80 enters `0038h` on an interrupt in mode 1, the mode cold boot sets,
and TEC-OS has nothing there but the return. Warm boot disables interrupts
and nothing in TEC-OS enables them, so a program starts with them off. A
program that enables them keeps them on, with four exceptions. TEC-OS holds
them off while it reads or writes a card block, and while it sends or
receives a serial byte. It also holds them off while it writes a pair of
bytes to the PICO9918's control port, and while it reads the command
history. In each case it then restores them.

`0066h`, where the Z80 goes on a non-maskable interrupt, lies inside the FCB
at `005Ch`. On a board with the keypad NMI jumper fitted, a key on the hex
keypad runs whatever the FCB holds. TEC-OS runs with the jumper off, and
[Appendix G](appendix-g-tec-1g.md) has the detail.

## The latch byte

CP/M 2.2 leaves `0040h–004Fh` to the BIOS. TEC-OS keeps one byte there,
`0040h`, the value last written to the system latch. The latch at port `FFh`
can only be written, so `0040h` is TEC-OS's record of what it holds. It is
also the one byte TEC-OS reads while EXPAND 1 is in the window. Cold boot
clears all of page zero, and nothing in TEC-OS uses `0041h–004Fh` after
that.

A program that writes the latch itself writes the same value to `0040h`.
Otherwise TEC-OS's next change to the latch puts back the bits as `0040h`
recorded them. A program that leaves the latch alone leaves `0040h` alone
too.

## EXPAND 1

The second half of the expansion RAM, EXPAND 1, is TEC-OS's alone. Cold boot
clears it, and TEC-OS keeps in it:

| Addresses | Contents |
| --- | --- |
| `8000h–BBFFh` | the block cache's 30 lines, each with room for one card block of 512 bytes |
| `BC00h–BC9Dh` | the cache's table: the card block each line holds, and whether it has changes |
| `BD00h–BDFFh` | the history of command lines |
| `BE00h–BFFFh` | free |

EXPAND 1 in the window takes EXPAND 0 out of it. With EXPAND 0 go the BDOS's
entry, the BIOS jump table, the workspace and any part of the program above
`7FFFh`. The jump at `0005h` then leads into a cache line, and the return
word on the CCP's stack is out of view. A program on that stack has lost its
stack and the BDOS before it writes a byte. A write to the window then
damages the cache, and the next flush can write wrong data to the card.
TEC-OS has no call that gives a program space there.

A program that ends with `JP 0000h` while EXPAND 1 is in view still reaches
a warm boot. The jump at `0000h` leads to `BF03h`. In EXPAND 1 that address
holds zeros unless a program wrote there, and the Z80 runs on through them
into the ROM at `C000h`. The ROM's reset entry tells this from a reset by
the byte at `0002h` and goes to the warm boot. The warm boot puts EXPAND 0
back and writes the cache's changes to the card, as at any program's end. A
reset and BIOS function 0 run cold boot instead.
