---
title: Programs and the console
parent: TEC-OS
nav_order: 8
nav_group: "Part I: Using and programming TEC-OS"
---

# 8. Programs and the console

Checked against TEC-OS 1f9542d, with the ATOM assembler from the
repository's `atom-z80` 0.3.7. The starter card's `TED.COM` is from Thorium
04ec086, and its copy in `dist/files` has the SHA-256
`d42b6d2a5ea3158ff76774abaef1d290a42dc76ea9bb34aa564e3ae87add7344`.

Chapter 2 described the console as you use it at the prompt. This chapter
describes it as a program uses it, starting with the BDOS's console functions
and the BIOS's own console calls beneath them. It then explains the control
characters and escape sequences TEC-OS acts on when the console is a display,
and how the cursor is drawn. It ends with the console's size and where a
program reads it, then the IOBYTE's other devices: the list device, the punch
and the reader.

## The BDOS's console functions

A program usually reaches the console through the BDOS, with the functions
of Chapter 6 and a few more:

| Function | Name | Takes | Returns |
| --- | --- | --- | --- |
| 1 | Console input | nothing | `A`: the next key, which is also printed |
| 2 | Console output | `E`: the character | nothing |
| 6 | Direct console I/O | `E`: FFh to read, or a character to print | for FFh, `A`: the key, or 0 if none is waiting |
| 9 | Print string | `DE`: the string, ended by `$` | nothing |
| 10 | Read console buffer | `DE`: the buffer | the line in the buffer |
| 11 | Console status | nothing | `A`: nonzero if a key is waiting |

Functions 1, 2, 9 and 10 do more than move a byte. They expand a tab into
spaces up to the next multiple of 8 columns, counting columns from the last
carriage return, and they copy what they print to the list device while `^P`
has turned the copy on. Functions 2 and 9 also check for a key before each
character they print: `^S` stops the output until the next key, `^P` turns the
copy on or off, and any other key is held for the program's next console read,
as Chapter 2 describes. Function 10 gives the line the editing keys of Chapter
2, and a `^C` as its first key ends the program with a warm boot.

Function 6 does none of this. With a character in `E` it passes the byte
straight to the BIOS, and with FFh it returns a waiting key, or 0, without
waiting and without printing it. A full-screen program uses function 6, or the
BIOS directly, so that its keys reach it as they are typed and its output
reaches the screen unchanged.

## The BIOS's console calls

The BDOS reaches the console through three entries of the BIOS jump table, and
a program can call them too. The table is in RAM at `BF00h`, with a jump of
three bytes for each of the BIOS's functions, numbered from 0 for cold boot
and 1 for warm boot. The word at `0001h` is the address of function 1's jump,
so a program works out each entry's address from that word and doesn't depend
on `BF00h`:

| BIOS function | Address | Name | Effect |
| --- | --- | --- | --- |
| 2 | `BF06h` | `CONST` | `A` = FFh if a key is waiting, 00h if not |
| 3 | `BF09h` | `CONIN` | waits for a key and returns it in `A`, with bit 7 clear |
| 4 | `BF0Ch` | `CONOUT` | prints the character in `C` |

The BIOS acts on no key: `^C`, `^S` and `^P` from `CONIN` are bytes like any
other, and `CONOUT` expands no tab and checks for no key.

The routines behind these calls leave the interrupt state as they found it. The
serial port's routines hold interrupts off while a byte goes out or comes in,
and `PICO.SVC` holds them off for each pair of writes to the video chip's
control port. The routines keep the cursor at `0046h–0047h`, the escape sequence at `004Ah–004Ch` and the
video attributes at `004Eh` and `004Fh`, all fixed bytes, so an interrupt
routine must not print through the console.

The calls also run on the caller's stack, and on a display so do the ROM's
terminal and the routines of `PICO.SVC` or `GLCD.SVC` beneath them. On the
model, a direct call with nothing pushed used at most 24 of the CCP's 28 bytes.
That figure is the lowest `SP` below its value at the program's entry, and it
counts the call's return word. It came from a call that cleared a display after
a change to the IOBYTE. That is the deepest path measured and not a proved worst
case. A program that pushes before it calls the BIOS therefore sets up a stack
of its own first.

This program reads keys through `CONIN` and prints each one's code through
`CONOUT` until Return. It pushes before it calls the BIOS, so it starts by
setting `SP` to a stack of its own:

```asm
; KEY: read keys through the BIOS and print each one's code in hex, until
; Return.
        ORG     $0100
        LD      SP,STACK        ; the BIOS's routines run on this stack
        LD      HL,($0001)      ; the BIOS's warm boot entry, table + 3
        LD      DE,6
        ADD     HL,DE
        LD      (CONIN+1),HL    ; table + 9: CONIN
        LD      DE,3
        ADD     HL,DE
        LD      (CONOUT+1),HL   ; table + 0Ch: CONOUT
NEXT:   CALL    CONIN           ; wait for a key; A = its code
        PUSH    AF
        CALL    HEX
        LD      C,' '
        CALL    CONOUT
        POP     AF
        CP      13
        JR      NZ,NEXT
        LD      C,13
        CALL    CONOUT
        LD      C,10
        CALL    CONOUT
        JP      $0000           ; no return word on this stack
CONOUT: JP      0               ; print C; the address goes here
CONIN:  JP      0               ; the address goes here

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
DIGIT1: LD      C,A
        JR      CONOUT

        DS      64
STACK:
```

The program writes each entry's address into a `JP` of its own, at `CONIN` and
`CONOUT`, so that a `CALL` to the label reaches the BIOS. Its stack holds no
return word, so it ends with `JP $0000`, as Chapter 6 describes. These
commands assemble it, `size.asm` from the section on the console's size and
the repository's `TERM` from the next section, and copy all three to drive B
of a copy of the starter card:

```sh
cp dist/starter.img con.img
npx atom size.asm size.com
npx atom key.asm key.com
npx atom test/programs/term.asm term.com
node tools/tecvol.mjs put con.img B size.com
node tools/tecvol.mjs put con.img B key.com
node tools/tecvol.mjs put con.img B term.com
```

Here `a`, `Z`, `^C`, Esc and Return were typed at the serial terminal:

<!-- node tools/capture.mjs --card con.img "@start B:KEY" $'@key aZ\x03\x1b\r' -->
```text
A>B:KEY
61 5A 03 1B 0D 

A>
```

The `^C` arrives as `03`, and the program goes on. Through the BDOS, the
same `^C` as the first key of function 10's line would have ended it.

A program that mixes the two levels can lose a key. Functions 2, 9 and 11 read
a key that is waiting and hold it inside the BDOS for the next BDOS read, but
`CONIN` doesn't return a key the BDOS holds. A program that prints with
function 2 and reads with `CONIN` therefore loses a key typed while it was
printing, so a program uses one level or the other for both.

The BDOS calls the BIOS through the same table in RAM, so a program that
writes its own jump into an entry receives the BDOS's console calls as well as
its own. An entry at `CONOUT` gets every character the BDOS prints. The BDOS's
check for a key during output is the exception: it calls the ROM's `CONST`
directly, not through the table. Warm boot leaves the table in EXPAND 0 as it
is, as in CP/M 2.2, so a program that replaces an entry, the warm boot entry included,
puts the old jump back before it ends.

## The video terminal

On the serial terminal, TEC-OS sends every byte unchanged and the terminal
program on the PC interprets it. On the PICO9918 or the graphics LCD there is
no terminal program, so TEC-OS interprets the bytes itself. It draws each
character from `20h` to `7Eh` at the cursor and moves the cursor one column
right, and it acts on six control characters:

| Byte | Name | Effect |
| --- | --- | --- |
| `08h` | BS | the cursor left one column, stopping at column 1 |
| `09h` | HT | the cursor right to the next multiple of 8 columns, stopping at the last |
| `0Ah` | LF | the cursor down one row, scrolling at the bottom |
| `0Ch` | FF | clears the screen and puts the cursor at the top left |
| `0Dh` | CR | the cursor to column 1 |
| `1Bh` | ESC | starts an escape sequence |

Other control characters, `7Fh` and the bytes from `80h` to `FFh` are not
drawn and leave the cursor where it was.

A character written in the last column leaves the cursor past the right edge,
and the line wraps only when another printable character follows, as on a
VT100 terminal. A line exactly as wide as the screen, followed by a carriage
return and a line feed, therefore leaves no blank row.

An escape sequence is `ESC`, then `[`, then up to two decimal numbers
separated by `;`, then a letter that names the action. In the table, `n`,
`r`, `c`, `t` and `b` are the numbers:

| Sequence | Effect |
| --- | --- |
| `ESC [ n A`, `B`, `C`, `D` | the cursor up, down, right or left `n` places, stopping at the edge; `n` is 1 when it is left out or 0 |
| `ESC [ r ; c H`, or `f` | the cursor to row `r`, column `c`, counted from 1; a number left out is 1 |
| `ESC [ J` | clears from the cursor to the end of the screen |
| `ESC [ 2 J` | clears the whole screen, leaving the cursor where it is |
| `ESC [ K` | clears from the cursor to the end of the line |
| `ESC [ 7 m`, `ESC [ 0 m` | reverse video on, and off |
| `ESC [ n @`, `ESC [ n P` | inserts `n` blanks at the cursor, or deletes `n` characters there; the rest of the line moves right or left |
| `ESC [ t ; b r` | makes rows `t` to `b` the scroll region and puts the cursor at the top left |
| `ESC [ r` | makes the whole screen the scroll region and puts the cursor at the top left |
| `ESC [ n L`, `ESC [ n M` | inserts or deletes `n` lines at the cursor's row, within the scroll region; the rows below move, and the cursor goes to column 1 |

A line feed at the bottom of the scroll region scrolls the region up one row
and leaves the rows outside it as they are. Below the region, a line feed
stops at the last row. The region goes back to the whole screen when the
console changes and at every warm boot.

TEC-OS reads any other sequence to its final letter and ignores it, and an
`ESC` followed by anything but `[` ends there. A program written for a larger
terminal therefore leaves no stray characters on the screen.

`TERM` uses several of these. It clears the screen, writes `ABCDEFG` at the
top left, moves to row 1, column 3 and clears to the end of the line, which
leaves `AB`. It then writes `X` at row 5, column 10 and a reverse `R` after
it. It isn't on the starter card. Its source is `test/programs/term.asm`, and
the commands under "The BIOS's console calls" assemble it on the PC and put it
on drive B of `con.img`. On the PICO9918 the screen shows this after it ends.
The screen text that `capture.mjs` prints leaves out reverse video, so the
`R` appears as an ordinary letter:

<!-- node tools/capture.mjs --board pico --screen --card con.img B:TERM -->
```text
AB



         XR

A>
```

With anything after its name, as in `B:TERM S`, `TERM` goes on to print 30
numbered lines, `L00` to `L29`, which scroll the screen.

## The cursor

On a display, TEC-OS shows the cursor by drawing the cell at the cursor
position as its reverse image. It draws the cursor only while a program waits
for a key, which means during `CONIN` and when a program polls with `CONST`
and no key is waiting, as BDOS functions 6 and 11 do. The next character
printed removes it, so a program that prints a screenful never spends time
drawing the cursor between characters. The BDOS's own check for `^S` during
output draws no cursor. No cursor is drawn either while the cursor's position
is past the right edge, waiting for a wrap.

## The console's size

A program that lays out a screen, such as an editor, uses the console's size.
TEC-OS gives both the columns and the rows as 0 while the console is the
serial terminal, whose size TEC-OS can't read, so a program then uses 80 by
24, as the CCP does for `[more]`.

A program reads the size through the ROM table at `C003h`, which Chapter 9
describes. The table starts with the letters `TNA` and its major version, 5,
the version of its ABI, its application binary interface. At `C008h` is a jump
to TEC-OS's numbered services, and service 0, `INFO`, returns the columns in
`L` and the rows in `H`. A program that checks the letters and the version
and then calls `INFO` works on every TEC-OS with this version of the table,
wherever a later ROM keeps the size:

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
digit. On a board with only a serial terminal the program prints this:

<!-- node tools/capture.mjs --card con.img B:SIZE -->
```text
A>B:SIZE
serial terminal

A>
```

On the web page's board the PICO9918 is the console at 80 columns, and after
`CON UC1` the graphics LCD is. The lines up to the echo of `CON UC1` were on
the PICO9918, and the rest on the graphics LCD:

<!-- node tools/capture.mjs --board pico --card con.img B:SIZE "CON UC1" B:SIZE -->
```text
A>B:SIZE
80 columns, 24 rows

A>CON UC1
CON: UC1: GLCD
A>B:SIZE
21 columns, 8 rows

A>
```

The size changes whenever the console does, so a program reads it again
after it changes the console, and a later run reads it afresh.

## The IOBYTE's other devices

CP/M's IOBYTE at `0003h` has four fields of two bits: the console in bits 0–1,
the reader in bits 2–3, the punch in bits 4–5 and the list device in bits 6–7.
TEC-OS reads only the console field, so each of the other devices has one
fixed meaning, whatever its field holds:

- The list device, BDOS function 5 and the BIOS's `LIST`, is the printer in
  CP/M. The TEC-1G has none, so TEC-OS discards each byte sent to it. Its
  status, BIOS `LISTST`, always reports it ready, so a program that prints
  never waits.
- The punch, BDOS function 4 and the BIOS's `PUNCH`, sends its byte to the
  serial port, all eight bits, whichever device is the console. On a serial
  console its bytes reach the serial terminal between the console's own.
- The reader, BDOS function 3 and the BIOS's `READER`, waits for a byte from
  the serial port and returns all eight bits. It has no timeout, so a program
  that reads it waits until a byte arrives. A byte the console has already
  taken stays with the console.

The punch and the reader make the serial port a byte channel for a program
whose console is a display. Such a program sends bytes to the PC through the
punch and reads bytes from it through the reader, while the console stays on
the screen. Nothing holds a byte that arrives between two calls of the reader,
so a program that reads a stream of bytes calls the reader again before the
next byte starts.