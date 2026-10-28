---
title: A first program
parent: TEC-OS
nav_order: 6
---

# A first program

This chapter writes two small programs, assembles them on a PC and runs
them on TEC-OS. The first prints a greeting and the size of the program
area. The second opens the file named on its command line and counts its
lines. Between them they use the parts of CP/M's interface that most
programs need: console output, the command line and reading a file.

## Calling the BDOS

A program reaches TEC-OS's services by calling the BDOS. It puts the
function number in `C`, a parameter in `DE` or `E`, and calls `0005h`. A
result comes back in `A`, or in `HL` for a 16-bit one. The BDOS may change
every register, so a program saves any value it needs across the call.

These functions are enough to start:

| Function | Name | Parameter | Result |
| ---: | --- | --- | --- |
| 1 | Console input | | `A` = the key, echoed |
| 2 | Console output | `E` = the character | |
| 9 | Print string | `DE` → text ending in `$` | |
| 15 | Open file | `DE` → file control block | `A` = `FFh` if not found |
| 20 | Read sequential | `DE` → file control block | `A` = 0 if a record was read |
| 26 | Set DMA address | `DE` → 128-byte buffer | |

TEC-OS provides CP/M 2.2's functions 0 to 40 with their documented
behaviour. Any CP/M 2.2 programmer's guide describes them, and Chapter 12
lists the few places where TEC-OS differs.

## Hello

```asm
; HELLO.COM: print a greeting and the size of the program area.
BDOS    EQU     $0005
PRINT   EQU     9               ; print a string ending in '$'

        ORG     $0100
        LD      DE,GREET
        LD      C,PRINT
        CALL    BDOS
        LD      HL,($0006)      ; the BDOS entry: the top of the program area
        LD      DE,$0100
        OR      A
        SBC     HL,DE           ; HL = bytes from 0100h up to the BDOS
        CALL    PUTDEC
        LD      DE,BYTES
        LD      C,PRINT
        JP      BDOS            ; print, then return to TEC-OS

; Print HL as a decimal number.
PUTDEC: LD      BC,-10000
        CALL    DIGIT
        LD      BC,-1000
        CALL    DIGIT
        LD      BC,-100
        CALL    DIGIT
        LD      BC,-10
        CALL    DIGIT
        LD      BC,-1
DIGIT:  LD      A,'0'-1
DLOOP:  INC     A
        ADD     HL,BC
        JR      C,DLOOP
        SBC     HL,BC           ; one too many: add the power back
        PUSH    HL
        LD      E,A
        LD      C,2             ; console output
        CALL    BDOS
        POP     HL
        RET

GREET:  DB      "Hello from TEC-OS.",13,10,"Program area: $"
BYTES:  DB      " bytes",13,10,"$"
```

The program starts at `0100h`, where TEC-OS loads every `.COM` file. Its
last instruction is `JP BDOS`. The BDOS prints the string and returns to the
address on top of the stack. TEC-OS put a return address there before
starting the program, so the return ends the program. A program can also
end with `RET`, with `JP 0000h` or by calling BDOS function 0.

`PUTDEC` prints each digit by adding a negative power of ten until the
total goes below zero, counting as it goes. It always prints five digits,
leading zeros included.

## Assembling it

The examples in this book are assembled with Atom, a Z80 assembler that
runs on a PC under Node.js and also under CP/M itself. The Atom books on
this site describe it. With the source saved as `hello.asm`:

```sh
atom hello.asm -o HELLO.COM
```

Atom writes the 116 bytes of `HELLO.COM`. Any assembler that writes a
binary for origin `0100h` will do, though the syntax of `EQU` lines and
strings varies between them.

## Running it

`tecvol`, from Chapter 4, copies the program to a card image:

```sh
node tools/tecvol.mjs put card.img B HELLO.COM
```

The browser page in Chapter 1 can copy a file onto its card directly, which
avoids the image. Either way, the program then runs from the prompt:

```text
A>B:HELLO
Hello from TEC-OS.
Program area: 46854 bytes

A>
```

46,854 is `B806h` less `0100h`. A card that mounts more drives, or a
resident program, gives a smaller figure, and the program reports it
without change.

## Reading a file

The second program counts the lines in a text file. It takes the file's
name from the command line:

```asm
; LINES.COM: count the lines in the file named on the command line.
; LINES NOTES.TXT reads NOTES.TXT a record at a time through the default
; file control block at 005Ch and the default buffer at 0080h.
BDOS    EQU     $0005
FCB     EQU     $005C
BUF     EQU     $0080
OPEN    EQU     15              ; DE -> FCB; A = FFh if not found
READ    EQU     20              ; next 128-byte record to the buffer; A = 0 if read
PRINT   EQU     9

        ORG     $0100
        XOR     A
        LD      (FCB+32),A      ; start at the first record
        LD      DE,FCB
        LD      C,OPEN
        CALL    BDOS
        INC     A               ; FFh becomes 0
        JR      Z,NOFILE
        LD      HL,0
        LD      (COUNT),HL

NEXT:   LD      DE,FCB
        LD      C,READ
        CALL    BDOS
        OR      A
        JR      NZ,DONE         ; no more records
        LD      HL,BUF
        LD      B,128
SCAN:   LD      A,(HL)
        CP      $1A             ; ^Z marks the end of a text file
        JR      Z,DONE
        CP      10              ; a line feed ends a line
        JR      NZ,NOTLF
        PUSH    HL
        LD      HL,(COUNT)
        INC     HL
        LD      (COUNT),HL
        POP     HL
NOTLF:  INC     HL
        DJNZ    SCAN
        JR      NEXT

DONE:   LD      HL,(COUNT)
        CALL    PUTDEC
        LD      DE,LINESM
        LD      C,PRINT
        JP      BDOS

NOFILE: LD      DE,NOFILEM
        LD      C,PRINT
        JP      BDOS

; PUTDEC as in HELLO.COM.

COUNT:  DW      0
LINESM: DB      " lines",13,10,"$"
NOFILEM:DB      "No such file",13,10,"$"
```

The listing leaves out `PUTDEC`, which is the same as in `HELLO.COM`.

Before starting the program, the command processor parsed `README.TXT`
from the command line into the file control block at `005Ch`. The block
holds the drive, the eight characters of the name and the three of the
extension, padded with spaces. The program sets the record number at
offset 32 to zero and opens the file.

Each call to function 20 reads the next 128-byte record into the buffer at
`0080h`, CP/M's default DMA address. The program scans the record for line
feeds. CP/M records a file's length in whole records, so a text file ends
with `^Z` (`1Ah`) and the program stops there. Function 20 returns a
nonzero `A` when no records are left.

```text
A>LINES README.TXT
00011 lines

A>LINES NOSUCH.TXT
No such file

A>
```

`LINES` with no file name gets `No such file` too, because the file control
block then holds a blank name, which matches nothing.

A program that reads into a buffer of its own sets the DMA address with
function 26 first. `LINES` uses the default at `0080h`, so it doesn't.

## Testing in the browser

The browser page from Chapter 1 runs the same Debug80 model the examples in
this book were checked on. A program copied to its card runs at the board's 4 MHz, with the same
console and devices. For stepping through a program
instruction by instruction, the Debug80 extension for VS Code runs the
TEC-1G model with a debugger. The Debug80 book on this site describes it.
