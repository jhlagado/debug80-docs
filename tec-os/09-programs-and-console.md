---
title: Programs and the console
parent: TEC-OS
nav_order: 9
nav_group: "Part I: Using and programming TEC-OS"
---

# 9. Programs and the console

<!-- Checked against TEC-OS 78127ec, with the ATOM assembler from the
     repository's `atom-z80` 0.3.7. -->

A program reaches the console at two levels. The BDOS's functions edit and
check what passes through them. The BIOS's calls beneath them move each byte
as it is. [Chapter 2](02-console.md) described the console from the
keyboard. This chapter describes it from a program, down to what a display
does with each byte it is sent.

## The BDOS's console functions

A program usually reaches the console through the BDOS, with the functions
of [Chapter 7](07-first-program.md) and a few more:

| Function | Name | Takes | Returns |
| --- | --- | --- | --- |
| 1 | Console input | nothing | `A`: the next key, which is also printed |
| 2 | Console output | `E`: the character | nothing |
| 6 | Direct console I/O | `E`: FFh to read, or a character to print | for FFh, `A`: the key, or 0 if none is waiting |
| 9 | Print string | `DE`: the string, ended by `$` | nothing |
| 10 | Read console buffer | `DE`: the buffer | the line in the buffer |
| 11 | Console status | nothing | `A`: 1 if a key is waiting, else 0 |

Functions 1, 2, 9 and 10 do more than move a byte. They expand a tab into
spaces up to the next multiple of 8 columns, counted from the last carriage
return. While `^P` has turned the copy on, they copy what they print to the
list device. Functions 2 and 9 also check for a key before each character
they print. `^S` stops the output until the next key, and `^P` turns the copy
on or off. Any other key is held for the program's next console read, as
Chapter 2 describes. The key that ends a `^S` pause is taken and dropped,
except a `^C`, which ends the program with a warm boot. Function 10 gives
the line the editing keys of Chapter 2. A `^C` as its first key ends the
program with a warm boot.

Function 6 does none of this. With a character in `E` it passes the byte
straight to the BIOS. With FFh it returns a waiting key, or 0, without
waiting and without printing it. A full-screen program uses function 6, or
the BIOS directly. Its keys then reach it as they are typed and its output
reaches the screen unchanged.

## The BIOS's console calls

The BDOS reaches the console through three entries of the BIOS jump table,
and a program can call them too. The table is in RAM at `BF00h`. It has a
jump of three bytes for each of the BIOS's functions, numbered from 0 for
cold boot and 1 for warm boot. The word at `0001h` is the address of
function 1's jump. A program works out each entry's address from that word
and doesn't depend on `BF00h`:

| BIOS function | Address | Name | Effect |
| --- | --- | --- | --- |
| 2 | `BF06h` | `CONST` | `A` = FFh if a key is waiting, 00h if not |
| 3 | `BF09h` | `CONIN` | waits for a key and returns it in `A`, with bit 7 clear |
| 4 | `BF0Ch` | `CONOUT` | prints the character in `C` |

The BIOS acts on no key. `^C`, `^S` and `^P` from `CONIN` are bytes like any
other. `CONOUT` expands no tab and checks for no key.

The routines behind these calls leave the interrupt state as they found it.
They keep the cursor, the escape sequence and the video attributes in fixed
bytes of the workspace. An interrupt routine must therefore not print
through the console. The calls run on the caller's stack. On a display the
ROM's terminal and the display's own routines run there too. The stack a
program starts on has 30 bytes free, as [Chapter 8](08-memory.md) says. A
program that pushes before it calls the BIOS sets up a stack of its own
first.

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

The program writes each entry's address into a `JP` of its own, at `CONIN`
and `CONOUT`. A `CALL` to the label then reaches the BIOS. Its stack holds
no return word, so it ends with `JP $0000`, as Chapter 7 describes. These
commands assemble it on the PC and put it on drive B of a copy of the
starter card:

```sh
cp dist/starter.img con.img
npx atom key.asm key.com
node tools/tecvol.mjs put con.img B key.com
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

## One level or the other

A program that mixes the two levels can lose a key. Functions 2, 9 and 11
read a key that is waiting and keep it inside the BDOS for the next BDOS
read. `CONIN` doesn't return a key the BDOS keeps. A program that prints
with function 2 and reads with `CONIN` therefore loses a key typed during
the printing. A program uses one level or the other for both.

The BDOS calls the BIOS through the same table in RAM. A program that
writes its own jump into an entry therefore receives the BDOS's console
calls as well as its own. An entry at `CONOUT` gets every character the
BDOS prints. The BDOS's check for a key during output is the exception: it
calls the ROM's `CONST` directly, not through the table. Warm boot leaves
the table as it is, as in CP/M 2.2. A program that replaces an entry puts
the old jump back before it ends, and that includes the warm boot entry.

## The video terminal

On the serial terminal, TEC-OS sends every byte unchanged and the terminal
program on the PC interprets it. On the PICO9918 or the graphics LCD there is
no terminal program, so TEC-OS interprets the bytes itself. It draws each
byte from `20h` to `7Eh` at the cursor and moves the cursor one column
right. It acts on six control characters:

| Byte | Name | Effect |
| --- | --- | --- |
| `08h` | BS | the cursor left one column, stopping at column 1 |
| `09h` | HT | the cursor right to the next multiple of 8 columns, stopping at the last |
| `0Ah` | LF | the cursor down one row, scrolling at the bottom |
| `0Ch` | FF | clears the screen and puts the cursor at the top left |
| `0Dh` | CR | the cursor to column 1 |
| `1Bh` | ESC | starts an escape sequence |

Other control characters, `7Fh` and the bytes from `80h` to `FFh` are not
drawn. The cursor stays where it was.

A character written in the last column leaves the cursor past the right
edge. The line wraps only when another printable character follows, as on a
VT100 terminal. A line exactly as wide as the screen, followed by a carriage
return and a line feed, therefore leaves no blank row.

An escape sequence is `ESC`, then `[`, then up to two decimal numbers
separated by `;`, then a letter that names the action. In the table, `n`,
`r`, `c`, `t` and `b` are the numbers:

| Sequence | Effect |
| --- | --- |
| `ESC [ n A`, `B`, `C`, `D` | the cursor up, down, right or left `n` places, stopping at the edge; `n` is 1 when it is left out or 0 |
| `ESC [ r ; c H`, or `f` | the cursor to row `r`, column `c`, counted from 1; a number left out is 1 |
| `ESC [ J` | clears from the cursor to the end of the screen, as does `ESC [ n J` for any `n` but 2 |
| `ESC [ 2 J` | clears the whole screen, leaving the cursor where it is |
| `ESC [ K` | clears from the cursor to the end of the line, as does `ESC [ n K` for any `n` |
| `ESC [ 7 m`, `ESC [ 0 m` | reverse video on, and off |
| `ESC [ n @`, `ESC [ n P` | inserts `n` blanks at the cursor, or deletes `n` characters there; the rest of the line moves right or left |
| `ESC [ t ; b r` | makes rows `t` to `b` the scroll region and puts the cursor at the top left |
| `ESC [ r` | makes the whole screen the scroll region and puts the cursor at the top left |
| `ESC [ n L`, `ESC [ n M` | inserts or deletes `n` lines at the cursor's row, within the scroll region; the rows below move, and the cursor goes to column 1 |

A line feed at the bottom of the scroll region moves its rows up one
and leaves the rows outside it as they are. Outside the region a line feed
moves the cursor down one row and stops at the last. The region goes back to
the whole screen when the console changes and at every warm boot.

TEC-OS reads any other sequence to its final letter and ignores it. An `ESC`
followed by anything but `[` ends there, and that byte isn't drawn. A
program written for a larger terminal therefore leaves no stray characters
on the screen.

A program that lays out a screen, such as an editor, needs the console's
size. TEC-OS reports it through the hardware service `INFO` of
[Chapter 10](10-hardware-services.md#the-boards-report). The columns and
rows are 0 for the serial terminal, whose size TEC-OS can't read. They
change whenever the console does, so a program reads them again after a
`CON`.

`TERM` uses several of the sequences. It clears the screen and writes
`ABCDEFG` at the top left. It then moves to row 1, column 3 and clears to the
end of the line, which leaves `AB`. Last it writes `X` at row 5, column 10
and a reverse `R` after it. `TERM` isn't on the starter card. Its source is
`test/programs/term.asm` in the repository. These commands assemble it on
the PC and put it on drive B of `con.img`:

```sh
npx atom test/programs/term.asm term.com
node tools/tecvol.mjs put con.img B term.com
```

On the PICO9918 the screen shows this after it ends. The screen text that
`capture.mjs` prints leaves out reverse video, so the `R` appears as an
ordinary letter:

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
position as its reverse image. It draws the cursor only while a program
waits for a key. That means during `CONIN`, and during `CONST` when no key
is waiting, as BDOS functions 6 and 11 poll it. The next byte printed
removes the cursor. A program that prints a screenful therefore never spends
time drawing the cursor between characters. The BDOS's own check for `^S`
during output draws no cursor. No cursor is drawn either while the cursor's
position is past the right edge, waiting for a wrap.

## The other devices

CP/M's IOBYTE at `0003h` has four fields of two bits. The console is in bits
0–1 and the reader in bits 2–3. The punch is in bits 4–5 and the list device
in bits 6–7. TEC-OS reads only the console field. Each of the other devices
has one fixed meaning, whatever its field holds:

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
punch and reads bytes from it through the reader. The console stays on the
screen throughout. Nothing holds a byte that arrives between two calls of
the reader. A program that reads a stream of bytes therefore calls the
reader again before the next byte starts.
