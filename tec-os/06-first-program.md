---
title: A first program
parent: TEC-OS
nav_order: 6
nav_group: "Part I: Using and programming TEC-OS"
---

# 6. A first program

Checked against TEC-OS 19ad916, with the ATOM assembler from the
repository's `atom-z80` 0.3.7 on the PC and, on the TEC-1G, the starter card's
`TAS.COM` from Thorium dbee66a, with the SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. The
starter card's `TED.COM` is from Thorium 8fcc6ea, with the SHA-256
`9a9936cf9daeb285b585470faaf6f5885926c8aa00c227de2fafe79f762a413e`.

A program for TEC-OS is a CP/M program: Z80 code that TEC-OS loads at `0100h`
and that reaches the console and the files through the BDOS. This chapter
describes two of them. You assemble the first, which prints a line, with ATOM
on a PC, then copy it to a card and run it. The second prints the file named
on its command line. Through it the chapter explains how the CCP passes a
command line to a program and how a program opens and reads a file. You then
assemble the first program again on the TEC-1G itself, and edit, build and run
it there with the editor `TED`. The last section describes the ways a program
returns to TEC-OS.

## Calling the BDOS

A program calls one of the BDOS's functions by putting the function's number
in register `C` and calling address `0005h`. A function that takes a byte,
such as a character to print, takes it in register `E`, and one that takes an
address, such as a string's or a file's, takes it in `DE`. A function that
returns a byte returns it in `A`, and one that returns a word returns it in
`HL`. CP/M 2.2 defines no register as kept across a call, so a program saves
in its own memory, or on its stack, every value it uses after the call.

The word at `0006h`, inside the jump at `0005h`, is the address that jump
leads to: the BDOS's entry or a service's jump on to it. It is also the end of
the memory a program may use, as Chapter 7 explains. A program may read that
word, but it makes its calls at `0005h`.

The functions this chapter uses are in the table below. An FCB, which two of
them take, is a block of memory that names a file, and the section on the
command line explains it:

| Function | Name | Takes | Returns |
| --- | --- | --- | --- |
| 2 | Console output | `E`: the character | nothing |
| 9 | Print string | `DE`: the string, ended by `$` | nothing |
| 15 | Open file | `DE`: the file's FCB | `A`: FFh if there is no such file |
| 20 | Read sequential | `DE`: the file's FCB | `A`: 0 for a record read, 1 at the end of the file |

Appendix A lists every function.

## A program that prints

This program prints a line with function 9 and returns:

```asm
; HELLO: print a line and return to the CCP.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MESSAGE      ; the string, ended by $
        LD      C,9             ; BDOS function 9: print a string
        CALL    BDOS
        RET                     ; back to TEC-OS
MESSAGE:DB      "Hello from the TEC-1G",13,10,"$"
```

`ORG $0100` places it at `0100h`, where the CCP loads every program and starts
it. Function 9 prints each character from the address in `DE` up to the `$`,
which isn't printed. The 13 and 10 before the `$`, a carriage return and a
line feed, end the line, and the `RET` at the end returns to TEC-OS, as the
last section explains.

ATOM is a Z80 assembler that runs on a PC and on CP/M, and `npm ci` installs
it with the repository. Saved as `hello.asm` in the clone, the program
assembles with this command, which writes the 33 bytes of `hello.com`:

```sh
npx atom hello.asm hello.com
```

The output file's type, `.com`, gives a CP/M program: the bytes of the code
from `0100h` on, with nothing before them. The CCP reads those bytes to
`0100h` as they stand. Any Z80 assembler that writes a binary for origin
`0100h` will do, though the syntax of numbers, `EQU` lines and strings varies
between them.

## Copying the program to a card

`tecvol`, from Chapter 4, puts the program on a card image. These commands work
on a copy, so the starter card stays as it was:

```sh
cp dist/starter.img work.img
node tools/tecvol.mjs put work.img B hello.com
```

`put` names the file `HELLO.COM` on drive B. `tools/capture.mjs` boots `work.img`
and types the commands in the transcript below. On a board, `tecvol install`
from Chapter 4 writes `work.img` to the card. `B:` makes drive B current, `DIR`
shows the program, and `HELLO`, the program's name without its type, runs it:

<!-- node tools/capture.mjs --card work.img B: DIR HELLO -->
```text
A>B:
B>DIR
HELLO.COM   
1 file, 8172K free
B>HELLO
Hello from the TEC-1G

B>
```

The transcript leaves out the boot before `B:`. The blank line before the
prompt comes from TEC-OS: when a program ends, the CCP starts a new line
before it prints the prompt again. The CCP searches for the program on the
current drive only, so at `A>` the command `HELLO` gives `HELLO?`, and
`B:HELLO` runs the program from drive B.

The web page copies a file from the PC to its card without `tecvol`. Its "Drive"
list holds the drives the card's header names, and "Copy file to drive" writes
the chosen files onto the volume of the drive selected there. Each name becomes
the CP/M name in capitals, and "as text" makes the copy a text file, as
`tecvol put --text` does. The page then presses the board's reset, so that
TEC-OS starts again with the changed card. The reset loses any change still in
the block cache. A `^C` at the prompt before the copy puts those changes on the
card first. The list below the button shows the files on the selected drive,
each with a "Download" button that copies it back to the PC.

## The command line

The second program, `SHOW`, prints a text file. The file's name is the first
word after the command: `SHOW HELLO.ASM` prints `HELLO.ASM`. Before the CCP
starts a program it prepares two things in page zero, the first 256 bytes of
memory, and `SHOW` uses one of them.

The first is the command tail at `0080h`. Its first byte is the number of
characters typed after the command's name, and the characters follow it. They
include the space before the first word, and letters are in capitals, as the
CCP turns every command line into capitals. For `SHOW b:hello.asm x` the byte
at `0080h` is 14, and `0081h` onwards holds ` B:HELLO.ASM X`.

The second is a file control block, an FCB, of 36 bytes. A program names a
file to the BDOS through it, and the BDOS keeps its place in the file there.
The CCP fills the FCB at `005Ch` from the first word of the tail and the 16
bytes at `006Ch` from the second word, if there is one. An FCB starts with the
drive, 0 for the current drive or 1 to 16 for A to P, and then come 8 bytes of
name and 3 of type, each padded with spaces. For `SHOW b:hello.asm x` the FCB
at `005Ch` holds 2, for drive B, then `HELLO   ASM`, and the bytes at `006Ch`
hold 0 and `X`, padded. A program that takes one file name opens the FCB at
`005Ch` as it stands.

The FCB's byte 32, at `007Ch` for the FCB at `005Ch`, is the current record.
This is the number of the next 128-byte record that a sequential read takes,
within the part of the file the FCB is on. A program sets it to 0 before the
first read. The CCP clears it already, but a program that opens a file from
its own FCB, or opens the same FCB again, sets it itself.

## A program that reads a file

This is `SHOW`:

```asm
; SHOW NAME: print the text file NAME on the console.
BDOS    EQU     $0005
FCB     EQU     $005C           ; the CCP's FCB for the first name
DMA     EQU     $0080           ; where the BDOS reads a record

        ORG     $0100
        XOR     A
        LD      (FCB+32),A      ; read from the first record
        LD      DE,FCB
        LD      C,15            ; open the file
        CALL    BDOS
        INC     A               ; FFh: no such file
        JR      Z,NOFILE
NEXT:   LD      DE,FCB
        LD      C,20            ; read the next record into DMA
        CALL    BDOS
        OR      A
        RET     NZ              ; no more records
        LD      HL,DMA
        LD      B,128
PUT:    LD      A,(HL)
        CP      $1A             ; ^Z ends a text file
        RET     Z
        PUSH    HL
        PUSH    BC
        LD      E,A
        LD      C,2             ; print the character in E
        CALL    BDOS
        POP     BC
        POP     HL
        INC     HL
        DJNZ    PUT
        JR      NEXT
NOFILE: LD      DE,NOMSG
        LD      C,9
        JP      BDOS            ; print, and return from there
NOMSG:  DB      "No such file",13,10,"$"
```

Function 15 opens the file the FCB names. It finds the file's directory entry,
copies the entry's allocation into the FCB and returns FFh in `A` if there is
no such file. `INC A` turns FFh into 0 and sets the zero flag, so `JR Z` takes
that case. Function 20 then reads one record of 128 bytes into the DMA
address, the buffer the BDOS reads into and writes from. That address is
`0080h` until a program changes it with function 26. The same 128 bytes held
the command tail, so a program that uses its tail copies it before the first
read. Function 20 returns 0 in `A` for a record read and 1 when there is no
record left.

`PUT` prints the record's bytes one at a time with function 2, which takes its
character in `E`. Function 2 changes the registers, so `PUSH` and `POP` keep
the pointer in `HL` and the count in `B` across each call. The loop stops at a
`^Z`, the byte with which a CP/M text file ends. A CP/M file's length is a
whole number of records, so the end of the text is marked inside the last
record. The rest of that record is commonly `^Z` too, as `tecvol put --text`
fills it. A file with no `^Z` stops at its last record, when function 20
returns 1.

When there is no file, `NOFILE` prints a message with `JP BDOS` in place of a
`CALL` followed by `RET`. The BDOS returns to the address on top of the stack,
which is the `0000h` the CCP left there, and the program ends.

The program assembles to 72 bytes. These commands assemble it and put it on
drive B with `hello.asm` as a text file to print:

```sh
npx atom show.asm show.com
node tools/tecvol.mjs put work.img B show.com
node tools/tecvol.mjs put work.img B hello.asm --text
```

<!-- node tools/capture.mjs --card work.img B: "SHOW HELLO.ASM" "SHOW NOSUCH.TXT" -->
```text
A>B:
B>SHOW HELLO.ASM
; HELLO: print a line and return to the CCP.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MESSAGE      ; the string, ended by $
        LD      C,9             ; BDOS function 9: print a string
        CALL    BDOS
        RET                     ; back to TEC-OS
MESSAGE:DB      "Hello from the TEC-1G",13,10,"$"

B>SHOW NOSUCH.TXT
No such file

B>
```

`SHOW` with no name opens an FCB of spaces, finds no such file and prints
the same message.

## Assembling on the TEC-1G

`TAS` is a Z80 assembler that runs on TEC-OS itself, as a CP/M program, and
`TAS.COM` is on the starter card's drive A. It takes the language of ATOM's CP/M
assembler, so `HELLO.ASM` assembles unchanged.

`A:TAS HELLO` assembles `HELLO.ASM`, the copy of the source that `SHOW`
printed, from the current drive. It writes `HELLO.COM` beside it, with a debug
file, `HELLO.DBG`. Here the `HELLO.COM` from the PC is erased first, so that the
one `DIR` lists is `TAS`'s:

<!-- node tools/capture.mjs --card work.img B: "ERA HELLO.COM" "A:TAS HELLO" DIR HELLO -->
```text
A>B:
B>ERA HELLO.COM
B>A:TAS HELLO
HELLO.COM written

B>DIR
HELLO.DBG    SHOW.COM     HELLO.ASM    HELLO.COM   
4 files, 8160K free
B>HELLO
Hello from the TEC-1G

B>
```

## Editing on the TEC-1G

`TED`, the starter card's editor, works with `TAS`, so the whole cycle of
editing, assembling and running a program takes place on the TEC-1G. `TED`
takes a file's name and, as a second argument, a line number:
`TED HELLO.ASM 7` opens `HELLO.ASM` with the cursor at line 7. The arrow keys move the cursor, `^S`
saves the file and `^Q` quits. `^T` followed by a letter chains commands
through the CCP, with BDOS function 47 (Chapter 11), and `TED` comes back
after them:

| Keys | Effect |
| --- | --- |
| `^T B` | Saves the file and builds it with `TAS`. A failed build opens at the error |
| `^T R` | Builds the program as `^T B` does, then runs it |
| `^T D` | Runs the program under `TDB`, a debugger |
| `^T O` | Opens another file, named at a prompt |
| `^T F` | Opens the previous file again |

The starter card holds no `TDB.COM`, so `^T D` gets `TDB?` from the CCP and
`TED` comes back at its place. On the starter card `TED` holds a file of up to
33,067 bytes on a board with only a serial terminal, where no display's driver
installs. On a board with both displays one driver installs as it boots, and
`TED` holds 31,510 bytes.

`TED` has two limits that bear on the work on drive B. It takes no drive in its
argument, so the file must be on the current drive. The CCP searches only the
current drive for the commands `TED` chains, which are `TAS` and `TED` itself.
So `TED.COM` and `TAS.COM` need copies on drive B:

<!-- node tools/capture.mjs --card work.img "TED B:HELLO.ASM" B: "TED HELLO.ASM" "COPY A:TED.COM B:" "COPY A:TAS.COM B:" -->
```text
A>TED B:HELLO.ASM

EDIT error 01

A>B:
B>TED HELLO.ASM
TED?

B>COPY A:TED.COM B:
COPIED 005D

B>COPY A:TAS.COM B:
COPIED 0051

B>
```

A mistake shows the round of `^T B`. Here `TED HELLO.ASM 7` opened the source
on the PICO9918 and a `1` was typed at the start of line 7. `^T B` saved the
file and chained `TAS HELLO.ASM` and then `TED`. The screen showed this before
`TED` drew its own again:

<!-- a run on the host model, driven as test/ted.test.mjs drives TED, from the copies above: TED HELLO.ASM 7, 1, ^T B, Right, ^H, ^T R, a space, ^Q, DIR -->
```text

B>TAS HELLO.ASM
HELLO.ASM:7:1: expected a label, instruction or directive

B>TED
```

`TAS`'s message gives the file, the line and the column of the error. `TED`
opened again with the cursor there and the message on its status row, the
last of the screen's 24 rows. Here the 14 blank rows between the text and the
status row are left out:

<!-- the same run -->
```text
; HELLO: print a line and return to the CCP.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MESSAGE      ; the string, ended by $
        LD      C,9             ; BDOS function 9: print a string
1        CALL    BDOS
        RET                     ; back to TEC-OS
MESSAGE:DB      "Hello from the TEC-1G",13,10,"$"
EDIT HELLO.ASM    expected a label, instruction or directive  ^S Save  ^Q Quit
```

The status row starts with `EDIT` and the file's name, though the program is
`TED`. Otherwise it shows the cursor's line and column, as `L7 C1`. A `*`
follows the name while the file has changes not yet saved. The matrix keyboard
has no key for Delete, `7Fh`. So the fix here was the Right arrow, which moved
the cursor past the `1`, and then `^H`, which removed it. `^T R` then saved the
file, built the program and ran it, and `TED` waited for a key before it drew
its screen again:

<!-- the same run -->
```text

B>TAS HELLO.ASM
HELLO.COM written

B>TED

B>HELLO
Hello from the TEC-1G

B>TED
Press a key
```

A key brought `TED` back with the cursor at line 7, and `^Q` ended it. `TED`
keeps its own files beside the source. `THOR.PRJ` is the project. After the
first good build it names `HELLO.ASM` as the source the build keys take.
`THOR.SES` holds the file and the place `TED` was at when it last left. `TED`
also writes `THOR.ERR` before it chains a build, and `THOR.$$$` and
`THOR.BAK` while it rewrites `THOR.PRJ`. A `DIR` after `^Q` shows the drive:

<!-- the same run -->
```text
B>DIR
THOR.PRJ     SHOW.COM     HELLO.ASM    TED.COM      TAS.COM      THOR.SES
HELLO.DBG    HELLO.COM
8 files, 8128K free
B>
```

## The ways a program ends

When the CCP starts a program it puts the address `0000h` on the stack, so a
`RET` from the program's first level jumps to `0000h`. Page zero holds a
jump there to the BIOS's warm boot, and so every ordinary end of a program
is a warm boot:

- a `RET` with the stack as the program found it
- a jump to `0000h`
- BDOS function 0, which runs the warm boot itself
- a `^C` typed as the first key of a line that the program reads with BDOS
  function 10
- a key pressed after a BDOS error such as `Bdos Err On B: Bad Sector`

The warm boot writes the block cache's changes to the card and puts back the
jumps in page zero. The restart vectors at `0008h–003Fh` are the addresses
that `RST` instructions call (Chapter 7), and the warm boot gives each one a
program set its default, keeping only a `JP` whose target is above the address
in the word at `0006h`. The warm boot then starts the
CCP again and prints the prompt on the drive and in the user area held in the
byte at `0004h`. The CCP writes that byte before it starts a program, so the
prompt is on the drive and user area current then, unless the program changed
the byte. If the byte names a drive with no volume, the CCP takes drive A.
Services stay installed, and the IOBYTE keeps its value. Chapter 14
describes the warm boot step by step.

The stack the CCP gives a program is the CCP's own, with 28 bytes free below
the return address, enough for a few levels of calls and pushes. A program
that uses more points `SP` at a stack in its own memory. A `RET` at the end
then doesn't reach `0000h`, so such a program ends with function 0 or
`JP 0000h`.

A program that never ends, or one that has crashed, is stopped with the
reset button. A reset runs cold boot, which loses the changes still in the
block cache, as Chapter 4 describes, and keeps the drives' volumes.
