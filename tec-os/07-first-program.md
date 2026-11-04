---
title: A first program
parent: TEC-OS
nav_order: 7
nav_group: "Part I: Using and programming TEC-OS"
---

# 7. A first program

<!-- Checked against TEC-OS 78127ec, with the starter card's `TAS.COM` from
     Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`, the
     starter card's `TED.COM` from Thorium 128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and
     the ATOM assembler from the repository's `atom-z80` 0.3.7 on the PC. -->

In Chapter 1 you typed `TAS SAMPLE` and ran the program it built. Now you
write one of your own. `HELLO` prints a line. You type, build and run it on
the TEC-1G itself, with the starter card's `TED` and `TAS`. Then you build
the same program on a PC, the route later chapters use. `SHOW`, the second
program, prints the file named on its command line.

## A program and the BDOS

A program for TEC-OS is a CP/M program: Z80 code in a `.COM` file. The CCP
reads the file's bytes to `0100h` as they stand and starts the program there.
The file holds the code and nothing else. The program reaches the console
and the files through the BDOS and never touches the hardware.

A program calls one of the BDOS's functions by putting the function's number
in register `C` and calling address `0005h`. A function that takes a byte,
such as a character to print, takes it in register `E`. One that takes an
address, such as a string's or a file's, takes it in `DE`. A function that
returns a byte returns it in `A`. One that returns a word returns it in
`HL`. CP/M 2.2 defines no register as kept across a call. A program saves every
value it needs afterwards in its own memory or on its stack. The word
at `0006h`, inside the jump at `0005h`, is the end of the memory a program may
use, as Chapter 8 explains.

This chapter's two programs use four functions. An FCB, which two of them
take, is a block of memory that names a file, and the section on the command
line explains it:

| Function | Name | Takes | Returns |
| --- | --- | --- | --- |
| 2 | Console output | `E`: the character | nothing |
| 9 | Print string | `DE`: the string, ended by `$` | nothing |
| 15 | Open file | `DE`: the file's FCB | `A`: FFh if there is no such file |
| 20 | Read sequential | `DE`: the file's FCB | `A`: 0 for a record read, 1 at the end of the file |

Appendix A lists every function.

## A program that prints

`HELLO` prints a line with function 9 and returns:

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

`ORG $0100` places the code at `0100h`, where the CCP loads every program.
Function 9 prints each character from the address in `DE` up to the `$`,
which isn't printed. The 13 and 10 before the `$`, a carriage return and a
line feed, end the line. The `RET` returns to TEC-OS, as the last section
explains. Assembled, the program is 33 bytes.

## Building and running it on the TEC-1G

`TED` is the starter card's editor and `TAS` its assembler. Both are on drive
A, and the program goes on drive B, so first type `B:`. At `B>`, `TED
HELLO.ASM` opens an empty file of that name, since there is no `HELLO.ASM`
on the drive yet. A line number after the name, as `TED HELLO.ASM 7`, opens
the file with the cursor at line 7. Type the program in. The arrow keys move
the cursor and `^H` removes the character before it. `^S` saves the file and
`^Q` quits. The status row is the last row of the screen. It starts with
`TED` and the file's name, then a `*` while the file has unsaved changes,
then the cursor's line and column, as `L7 C1`.

`^T` followed by a letter hands a command to the CCP. `TED` ends and the command
runs. Then the CCP starts `TED` again at the same place, by the chaining that
Chapter 11 describes:

| Keys | Effect |
| --- | --- |
| `^T B` | Saves the file and builds it with `TAS`. A failed build opens at the error |
| `^T R` | Builds the program as `^T B` does, then runs it |
| `^T D` | Runs the program under `TDB`, a debugger the starter card doesn't hold |
| `^T O` | Opens another file, named at a prompt |
| `^T F` | Opens the previous file again |

The byte at `0050h` holds the drive the CCP loaded a program from. `TED`
reads it and names that drive in each command it chains. Run from drive A with drive B
current, it chains `A:TAS` and `A:TED`. The source stays on drive B and the
tools on drive A.

A mistake shows the whole round. With `HELLO.ASM` typed in and saved, `TED
HELLO.ASM 7` opens it at line 7, the `CALL BDOS`. Type a `1` at the start of
the line and press `^T B`. `TED` saves the file and chains `A:TAS HELLO.ASM`
and then `A:TED`. On the PICO9918 the screen shows this before `TED` draws
its own again:

<!-- a run on the host model with work.img, driven as test/ted.test.mjs at 7458352 drives TED: B:, TED HELLO.ASM 7, 1, ^T B, Right, ^H, ^T R, a space, ^Q, DIR -->
```text

B>A:TAS HELLO.ASM
HELLO.ASM:7:1: expected a label, instruction or directive

B>A:TED
```

`TAS`'s message gives the file, the line and the column of the error. `TED`
opens again with the cursor there and the message on its status row. The 14
blank rows between the text and the status row are left out here:

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
TED  HELLO.ASM    expected a label, instruction or directive  ^S Save  ^Q Quit
```

The matrix keyboard has no Delete key. So the fix is the Right arrow, which
moves the cursor past the `1`, and then `^H`, which removes it. `^T R` then
saves the file, builds the program and runs it. `TED` waits for a key before
it draws its screen again:

<!-- the same run -->
```text

B>A:TAS HELLO.ASM
HELLO.COM written

B>A:TED

B>HELLO
Hello from the TEC-1G

B>A:TED
Press a key
```

A key brings `TED` back with the cursor at line 7, and `^Q` ends it. `TAS`
writes `HELLO.COM` beside the source, with a debug file, `HELLO.DBG`. `TED`
keeps two files of its own there. `THOR.PRJ` names the source the build keys
take, from the first good build on. `THOR.SES` holds the file and the place
`TED` was at when it last left.

From now on `HELLO` typed at `B>` runs the program. The CCP searches for a
program on the current drive and then on drive A. At `A>` the command `HELLO`
therefore gives `HELLO?`, and `B:HELLO` runs it from drive B.

## The same program from a PC

A program assembled on a PC reaches the card through `tecvol`, and later
chapters build some of their programs this way. ATOM is a Z80 assembler that runs on a
PC, and `npm ci` installs it with the repository. `TAS` takes ATOM's language,
so the same source assembles on either. Saved as `hello.asm` in the clone, the
program assembles with this command, which writes the 33 bytes of `hello.com`:

```sh
npx atom hello.asm hello.com
```

Any Z80 assembler that writes a binary for origin `0100h` will do, though the
syntax of numbers, `EQU` lines and strings varies between them. `tecvol put`,
from Chapter 4, copies the program to a card image. These commands work on a
copy, so the starter card stays as it was:

```sh
cp dist/starter.img work.img
node tools/tecvol.mjs put work.img B hello.com
```

`put` names the file `HELLO.COM` on drive B, and `tecvol install` writes
`work.img` to the card. On the TEC-1G, `B:` makes drive B current, `DIR` shows
the program and `HELLO` runs it:

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

The blank line before the prompt comes from TEC-OS: when a program ends, the
CCP starts a new line before it prints the prompt again.

The web page copies a file from the PC to its card without `tecvol`. "Copy
file to drive" writes the chosen files onto the drive selected in its "Drive"
list, each under its CP/M name in capitals. "As text" makes the copy a text
file. The page then presses the board's reset, which loses any change still in
the block cache, so type `^C` at the prompt before the copy. The list below the
button shows the files on the selected drive, each with a "Download" button
that copies it back to the PC.

## The command line a program receives

The second program, `SHOW`, prints a text file. The file's name is the first
word after the command: `SHOW HELLO.ASM` prints `HELLO.ASM`. Before the CCP
starts a program it prepares three things in page zero, the first 256 bytes
of memory, and `SHOW` uses one of them.

The first is the command tail at `0080h`. Its first byte is the number of
characters typed after the command's name, and the characters follow it. They
include the space before the first word, and letters are in capitals, as the
CCP turns every command line into capitals. For `SHOW b:hello.asm x` the byte
at `0080h` is 14, and `0081h` onwards holds ` B:HELLO.ASM X`.

The second is a file control block, an FCB, of 36 bytes. A program names a
file to the BDOS through it, and the BDOS keeps its place in the file there.
An FCB starts with the drive, 0 for the current drive or 1 to 16 for A to P.
Then come 8 bytes of name and 3 of type, each padded with spaces. The CCP
fills the FCB at `005Ch` from the first word of the tail. It fills the 16
bytes at `006Ch` from the second word, if there is one. For `SHOW b:hello.asm x` the
FCB at `005Ch` holds 2, for drive B, then `HELLO   ASM`, and the bytes at
`006Ch` hold 0 and `X`, padded. A program that takes one file name opens the
FCB at `005Ch` as it stands.

The FCB's byte 32, at `007Ch` for the FCB at `005Ch`, is the current record.
It is the number of the next 128-byte record that a sequential read takes. A
program sets it to 0 before the first read. The CCP clears it already, but a
program that opens a file from its own FCB, or opens the same FCB again, sets
it itself.

The third is the byte at `0050h`, which holds the drive the CCP loaded the
program from, as CP/M 3 keeps it. It is 0 for a program found on the current
drive and 1 for one found by the search of drive A. A drive typed in front of
the name gives its number, so `B:SHOW` at `A>` leaves 2 there. `TED` read
this byte to name the drive of `TAS` above.

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
that case. Function 20 then reads one record of 128 bytes to the DMA address,
the buffer the BDOS reads into and writes from. That address is `0080h` until
a program changes it with function 26. The same 128 bytes held the command
tail, so a program that uses its tail copies it before the first read.
Function 20 returns 0 in `A` for a record read and 1 when there is no record
left.

`PUT` prints the record's bytes one at a time with function 2, which takes
its character in `E`. Function 2 changes the registers, so `PUSH` and `POP`
keep the pointer in `HL` and the count in `B` across each call. The loop stops
at a `^Z`, the byte that ends a CP/M text file. A CP/M file's length is a
whole number of records, so the end of the text is marked inside the last
record. The rest of that record is commonly `^Z` too, as `tecvol put --text`
fills it. A file with no `^Z` stops at its last record, when function 20
returns 1.

When there is no file, `NOFILE` prints a message with `JP BDOS` in place of a
`CALL` followed by `RET`. The BDOS returns to the address on top of the stack,
which is the one the CCP left there, and the program ends.

The program assembles to 72 bytes, with `TAS` or with ATOM. Here it is built
on the PC and put on drive B of `work.img`, with `hello.asm` as a text file
to print:

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

`SHOW` with no name opens an FCB of spaces, finds no such file and prints the
same message.

## The ways a program ends

The CCP starts a program with `0000h` on the stack, and page zero holds a
jump there to the BIOS's warm boot. A `RET` from the program's first level is
therefore a warm boot, and so is every other ordinary end:

- a `RET` with the stack as the program found it
- a jump to `0000h`
- BDOS function 0, which runs the warm boot itself
- a `^C` typed as the first key of a line that the program reads with BDOS
  function 10
- a `^C` typed after a `^S` has stopped the program's output through BDOS
  function 2 or 9, as Chapter 9 describes
- a key pressed after a BDOS error such as `Bdos Err On B: Bad Sector`

The warm boot writes the block cache's changes to the card and puts back the
jumps in page zero. Services stay installed, and the console stays where it
was. The warm boot then starts the CCP again. The CCP prints the prompt on the
drive and in the user area held in the byte at `0004h`. It wrote that byte
before it started the program, so the prompt is where the program started,
unless the program changed the byte. If the byte names a drive
with no volume, the CCP takes drive A. Chapter 15 describes the warm boot
step by step.

The stack the CCP gives a program is the CCP's own. It has 30 bytes free
below the return address, room for a few levels of calls and pushes. A program
that uses more points `SP` at a stack in its own memory. A
`RET` at the end then doesn't reach `0000h`, so such a program ends with
function 0 or `JP 0000h`.

A program that never ends, or one that has crashed, is stopped with the reset
button. A reset runs cold boot, which loses the changes still in the block
cache, as Chapter 5 describes, and keeps the drives' volumes.
