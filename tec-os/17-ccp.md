---
title: The CCP
parent: TEC-OS
nav_order: 17
nav_group: "Part II: Inside TEC-OS"
---

# 17. The CCP

Checked against TEC-OS ea9c1c0, with the ATOM assembler from the repository's
`atom-z80` 0.3.7 and the starter card's `EDIT.COM` from Edit
845d062, whose copy in `dist/files` has the SHA-256
`ed88337e6dfa2626dd37a225a0ec09332f4927a0bde62114bbf8661d2d0fdc78`.

The CCP prints the prompt, reads a command line and carries it out, as Chapter
3 describes from the keyboard's side. This chapter describes the CCP's code:
its entry from cold and warm boot, the prompt, and the parsing of the command
word and file names. It then covers the built-in commands, the loading of a
program with its page zero, and the CCP's RAM and stack.

## The CCP in the ROM

The CCP's code is `src/cpm/ccp.asm`. In the debug80 build (Chapter 12) it runs
from `CCPBAS`, `D796h`, to `E0F4h`, 2,399 bytes, followed directly by the
BDOS. Its messages and the names of its built-in commands are in the ROM's
data block (`src/data3.asm:7-71`), except for `TYPE`, whose name sits in front
of the `RET` at `C01Dh` (`src/data.asm:9-14`). What the CCP changes has to be
in RAM, so its variables, buffers and stack are there, from `CCPRAM`, `BCEBh`,
to `BE76h` (`src/ram.asm:64-128`).

In most of what it does the CCP is an ordinary CP/M program: it reads and
writes files and the console through `CALL 0005h`, as a program in the TPA
does. `DIR` lists with functions 17 and 18, `TYPE` reads with function 20 and
`ERA` erases with function 19 (`src/cpm/ccp.asm:464-466`,
`src/cpm/ccp.asm:819-822`, `src/cpm/ccp.asm:892-895`).

Outside that interface the CCP reads a few of TEC-OS's own bytes: the
console's width and height at `0048h` and `0049h`, the console mode, the
IOBYTE and the top of the TPA at `0007h`. It also sets the BDOS's flags
`HFLAG` and `WRFLAG`, and it reads and sets the return code `PRGCODE`
(`src/cpm/ccp.asm:52-53`, `src/cpm/ccp.asm:86-87`, `src/cpm/ccp.asm:128`,
`src/cpm/ccp.asm:159`, `src/cpm/ccp.asm:352`). It calls a few of TEC-OS's
routines directly: startup's `STBOOT` and `STLINE`, the service loader and the
service commands' routines `CMDSVC` and `SVCUNL`. The others are `GLCLD` for
`CON UC1`, the PRL loader and the BDOS's division, `DIV16`
(`src/cpm/ccp.asm:260-263`, `src/cpm/ccp.asm:1101`, `src/cpm/ccp.asm:1135`).

## The entry from boot

A warm boot restarts the CCP, which has to come back on the drive and user it
was on, and the byte at `0004h` carries them across. Cold boot and warm boot
both end with a jump to `CCPENT`, with `C` holding that byte. It has the user
number in bits 4 to 7 and the drive in bits 0 to 3 (`src/boot.asm:80-82`,
`src/cpm/ccp.asm:23-66`). Cold boot sets it to 0, drive A and user 0, before
it falls into warm boot (`src/boot.asm:51-52`), and warm boot's `PZINIT`
leaves it as the CCP last wrote it (`src/boot.asm:216-218`).

`CCPENT` sets its stack and keeps the drive in `BOOTDRV`
(`src/cpm/ccp.asm:30-44`). It then sets `WRFLAG` and calls function 13, the
disk reset, which with that flag keeps the drives whose allocation vectors are
unchanged, as Chapter 16 describes. Warm boot has cleared the user number with
the rest of the BDOS's variables, so `CCPENT` calls function 32 with the user
number from the byte (`src/cpm/ccp.asm:45-59`). `STBOOT` comes next: it reads `A:STARTUP.CMD` the
first time it is called after a cold boot and does nothing later
(`src/cpm/ccp.asm:60`, `src/svc.asm:368-401`). Chapter 22 describes startup.
Last, if the drive is not A, the CCP selects it with function 14
(`src/cpm/ccp.asm:61-66`), then prints a new line and starts its loop at
`STARTED` (`src/cpm/ccp.asm:68-70`).

That selection would fail on a drive with no volume: function 14 would give the
`Select` error, and the error's warm boot would come back to `CCPENT` with the
same byte. `CCPENT` therefore tests the drive first, and a drive past D or with
no volume becomes drive A (`src/cpm/ccp.asm:33-44`). `SAVEDU` writes A into the
byte at the next prompt. A program that unmounts the current drive gives this
case. Here `MOUNT`, from drive A, takes the volume off drive B while B is the
current drive, so the prompt comes back on A. The reset button then starts a
cold boot:

<!-- node tools/capture.mjs B: "A:MOUNT B:" "@reset" -->
```text
A>B:
B>A:MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     

A>PICO.SVC
PICO.SVC?

A>GLCD.SVC
GLCD.SVC?

A>
```

The reset finds the card's volumes again with drive B left empty, because the
selection a reset keeps is the one that was in RAM, as Chapter 14 describes.

## The prompt and the line

A warm boot started by a program has to return to the drive and user in use,
so the byte at `0004h` is brought up to date before every prompt. `MAINLOOP`
sets the stack again and calls `SAVEDU`, which reads the user number with
function 32 and the drive with function 25 and writes both into the byte
(`src/cpm/ccp.asm:72-74`, `src/cpm/ccp.asm:206-225`). The prompt is the
drive's letter and `>` (`src/cpm/ccp.asm:75-79`), and the user number is not
shown.

A line has three sources, tried in order: what is left of a chained line, the
startup file through `STLINE` and the keyboard through BDOS function 10, with
`HFLAG` set for the history (`src/cpm/ccp.asm:80-89`). For the keyboard the
CCP's buffer is `CMDBUF`, with `CMDLEN` after it for the count and `CMDTXT`
for the characters (`src/ram.asm:75-80`). Warm boot sets the buffer's maximum
to 127 (`src/boot.asm:289-290`).

`MLTAKE` takes one piece of the line up to its `!`, turns its letters to
capitals and sets `PRGCODE`, the return code, to 0
(`src/cpm/ccp.asm:120-163`). Chapter 25 describes the chained line, the `:`
test, the return code and the ways the rest of a line is dropped, and Chapter
22 the startup file.

## Drive changes and the command word

With the piece ready, `MLTAKE` tests for a change of drive: a letter from `A`
to `P`, a colon and nothing after them but spaces (`src/cpm/ccp.asm:160-185`).
For a change the CCP stores the drive in `BOOTDRV`, selects it with function
14 and calls `SAVEDU`. A drive with no volume gives the `Select` error before
`SAVEDU` runs, so the byte at `0004h` keeps the old drive and the warm boot
after the error returns to it.

Anything else is a command. `NOTDRIVE` starts a new line on the screen, passes
over spaces and parses the first word with `CMDPARSE`, as a file name, into
`CMDFCB` (`src/cpm/ccp.asm:227-233`). `CMDSTRT` keeps where the word starts,
for an error message, and `ARGSTRT` keeps where it ends, the start of the
arguments. A word that doesn't parse as a file name is a bad command already
(`src/cpm/ccp.asm:323-328`).

The CCP then compares the word with the names of its ten built-in commands, in
the order `DIR`, `TYPE`, `ERA`, `REN`, `SAVE`, `USER`, `CON`, `COPY`, `UNLOAD`
and `SERVICES` (`src/cpm/ccp.asm:234-263`). `ISCMD` compares the text at
`CMDSTRT`, not the FCB, and requires a space or the end of the piece after the
name (`src/cpm/ccp.asm:1526-1546`). So `A:DIR` and `DIR.COM` are not the
built-in. The first is the program `DIR` on drive A and the second the program
`DIR`, and both fail with no `DIR.COM` on the card.

A word that is none of the built-ins names a program, and must be a single
file name with no wildcard (`src/cpm/ccp.asm:264-266`). The type selects what
follows. A type of `SVC` installs a service through `SVCGO`
(`src/cpm/ccp.asm:267-276`, `src/glcd.asm:68-93`), which Chapter 20 describes.
Any other type, or none, is replaced by `COM` (`src/cpm/ccp.asm:277-282`), so
`VOLS.TXT` runs `VOLS.COM`.

A command that fails ends at `BADCMD`, which prints the word from `CMDSTRT` up
to its first space with a question mark after it, then a new line
(`src/cpm/ccp.asm:329-348`). `BADCMD` and the built-ins' messages of failure
go through `ERRGO`, which sets the return code to `FF00h` first
(`src/cpm/ccp.asm:349-355`). Chapter 25 lists them. `ERRGO` and the built-ins
end at one of two labels: `STARTED` starts a new line and prints the prompt,
and `MAINLOOP` prints the prompt on the line the command left.

## File names

The CCP parses every file name through one routine. `PARSEFCB` reads one file
reference into the first 16 bytes of an FCB and leaves `HL` at the character
after it (`src/cpm/ccp.asm:1331-1436`). It first clears all 36 bytes of the
FCB: 0 for the drive, spaces for the name and type, zeros for the rest. A
command after `TYPE` therefore loads from the start of its file and not from
where `TYPE` stopped (`src/cpm/ccp.asm:1335-1360`). A letter and a colon at
the start set the drive byte, 1 to 16 for `A` to `P`, and any other character
before the colon is an error (`src/cpm/ccp.asm:1362-1378`). Up to eight
characters go into the name and, after a full stop, up to three into the type
(`src/cpm/ccp.asm:1380-1400`).

A name ends at a 0, a space, `=` or `.` (`src/cpm/ccp.asm:1508-1517`). Inside
it, `*` fills the rest of its field with `?` (`src/cpm/ccp.asm:1493-1506`).
`VALIDCHR` rejects the thirteen characters in `BADCHARS`, the ones CP/M 2.2
reserves: `<`, `>`, `,`, `;`, `:`, `[`, `]`, `%`, `|`, `(`, `)`, `/` and `\`
(`src/cpm/ccp.asm:1468-1491`, `src/data3.asm:70-71`). A field with more
characters than it holds is an error too: `PARLONG` moves past the rest of the
word and returns the error flag (`src/cpm/ccp.asm:1418-1436`).

The commands that take exactly one file, `TYPE`, `REN`, `SAVE`, `COPY` and a
program's name, test the parsed FCB with `UNAMBIG`, which rejects an empty
name and any `?` (`src/cpm/ccp.asm:1438-1466`).

## The built-in commands

Each built-in is a routine in `ccp.asm` or, for the service commands, in
`svc.asm`:

| Command | Routine | Source |
| --- | --- | --- |
| `DIR` | `CMDDIR` | `src/cpm/ccp.asm:418-631` |
| `TYPE` | `CMDTYPE` | `src/cpm/ccp.asm:804-847` |
| `ERA` | `CMDERA` | `src/cpm/ccp.asm:853-901` |
| `REN` | `CMDREN` | `src/cpm/ccp.asm:903-963` |
| `SAVE` | `CMDSAVE` | `src/cpm/ccp.asm:1196-1294` |
| `USER` | `CMDUSER` | `src/cpm/ccp.asm:1164-1194` |
| `CON` | `CMDCON` | `src/cpm/ccp.asm:1105-1162` |
| `COPY` | `CMDCOPY` | `src/cpm/ccp.asm:965-1097` |
| `UNLOAD` | `CMDUNL` | `src/cpm/ccp.asm:1099-1103`, `src/svc.asm:28-66` |
| `SERVICES` | `CMDSVC` | `src/svc.asm:341-366` |

`DIR` turns a missing name into eleven `?`, sets the DMA address to `LOADBUF`
and lists the entries that function 17 and then function 18 return
(`src/cpm/ccp.asm:418-466`). It passes over an entry whose system attribute,
bit 7 of its second type byte, is set (`src/cpm/ccp.asm:481-486`). The CCP's
FCB has extent 0, so only the entry that holds a file's first extent matches,
and each file is listed once. The number of columns is the console's width at
`0048h` divided by 13, at least one, and a width of 0, on the serial terminal,
is taken as 80 (`src/cpm/ccp.asm:445-462`). Each name is printed as
`NAME.EXT`, padded to 12 characters unless it ends the row
(`src/cpm/ccp.asm:502-547`).

`DIR`'s last line gives the number of files and the free space on the drive it
listed (`src/cpm/ccp.asm:560-631`). For the free space it selects that drive
with function 14, if the listing named one. It takes the DPB's address from
function 31 and the allocation vector's from function 27, then counts the
clear bits for the `DSM` + 1 blocks of the volume. The count of blocks is
shifted left by `BSH` less 3 to give KiB: 2 KiB a block on G1M, 4 on G8M. Then
it selects the drive from `0004h` again. A listing with no file gives
`NO FILE`.

A listing longer than the screen would scroll out of view, so `DIR` and `TYPE`
print through the pager (`src/cpm/ccp.asm:633-751`). `PGINIT` takes the
console's height and width from `0049h` and `0048h`, or 24 and 80 on the
serial terminal, and keeps one row for the pause. `PGPUT` counts each
character's column: back to 0 at CR, back one at backspace and on to the next
multiple of 8 at a tab. It counts a new line at LF and at a character that
would pass the last column, as the screen wraps it. When the rows are full it
prints `[more]` and waits with function 6, so that the key is not echoed.
`UNMORE` then writes a CR, six spaces and a CR over `[more]`. `^C`, Esc and
`Q` or `q` stop the listing, and `^C` also drops the rest of a chained line.
The test clears one bit of the key, so `#` reads as `^C` and `;` as Esc. Any
other key shows the next screen.

`TYPE` opens its one file and reads it a record at a time into `LOADBUF`. It
prints each byte through the pager up to the first `^Z`, `1Ah`, or the end of
the file (`src/cpm/ccp.asm:804-847`). A file that is not there gives
`NO FILE`.

`ERA` with a name that is all `?`, as `*.*` gives, prints `ALL (Y/N)?`, reads
the answer with function 1 and, unless that was a CR, reads on to one. The
test follows an `AND DFh`, so a `-` counts as a CR here and the Return after it
reaches the prompt. Any answer but `Y` or `y` erases nothing (`src/cpm/ccp.asm:864-890`). The erase itself is function 19,
and `NO FILE` when nothing matched (`src/cpm/ccp.asm:892-901`).

`REN NEW=OLD` parses the new name into `RENFCB` and the old one into `CMDFCB`.
The two names share one drive: a name with no drive takes the other's, and two
different drives are a bad command (`src/cpm/ccp.asm:926-939`). The command then
searches for the new name. If it is there it gives `FILE EXISTS` with nothing
changed (`src/cpm/ccp.asm:940-948`, `src/cpm/ccp.asm:961-963`). Otherwise the
first 12 bytes of `RENFCB` are copied to offset 16 of `CMDFCB`, the second
drive byte, so the new name follows it at offset 17, the place function 23
reads it. The rename gives `NO FILE` if the old name is not there
(`src/cpm/ccp.asm:950-963`).

`SAVE N NAME` reads a decimal count of 256-byte pages and rejects any count
that reaches the page of the word at `0006h`. It erases the file, makes it
again and writes the pages from `0100h` on, two records each
(`src/cpm/ccp.asm:1196-1294`). On the starter card that page is `B8h`, so the
largest `SAVE` is 183 pages, `0100h` to `B7FFh`. A failed make, write or close
gives `NO SPACE`.

`USER N` takes 0 to 15 and calls function 32 (`src/cpm/ccp.asm:1164-1194`).

`CON` with no argument names the console in use. With `TTY`, `CRT`, `BAT` or
`UC1`, a colon after it allowed, it sets the IOBYTE's console field, and for
`UC1` it also loads `GLCD.SVC` if it is not in (`src/cpm/ccp.asm:1105-1162`).
Chapter 15 describes the BIOS's side.

`COPY SOURCE DEST` copies a file within the user area
(`src/cpm/ccp.asm:965-1097`). Both names are parsed with the current drive put
in a 0 drive byte, so that they can be compared. A destination with no name
takes the source's whole name, and a destination equal to the source, all 12
bytes, is a bad command, with nothing opened (`src/cpm/ccp.asm:998-1024`). The
copy goes a record at a time through the default DMA buffer at `0080h`, so it
uses none of the TPA. The count of records is kept in `DIRNUM` and printed in
hexadecimal after `COPIED` (`src/cpm/ccp.asm:1025-1070`).

`SERVICES` prints each service's name and its pages from the list of services,
and `UNLOAD` removes the lowest. `NAME.SVC` as a command installs one. Chapter
20 describes the three.

## Loading a program

`LOADCOM` loads a `.COM` file at `0100h` through the BDOS
(`src/cpm/ccp.asm:357-416`). It opens `CMDFCB`, and if there is no such file
it returns with the carry flag and the zero flag set. Otherwise it reads the
file a record at a time, with function 26 setting the DMA address to each
record's place from `0100h` up. The reading stops at the end of the file or
when the address reaches the page of the word at `0006h`, the byte at `0007h`
(`src/cpm/ccp.asm:366-384`).

A file may end exactly at that page, so `LOADLIM` reads one more record, into
`LOADBUF`, where it can't reach the resident CCP, to find out. If that read
is the end of the file the load is
complete. Otherwise the file is too large, and the carry flag is set with the
zero flag clear (`src/cpm/ccp.asm:386-400`). A file that fits leaves in
`LOADTOP` the address after its last record, which the PRL loader uses, and is
closed (`src/cpm/ccp.asm:402-412`).

The largest program is therefore the 256-byte pages from `0100h` up to the
page that holds the BDOS entry. On the starter card, whose entry is at
`B806h`, that is 46,848 bytes, six fewer than the TPA. With a service loaded
the word at `0006h` is the service's jump, at offset 6 of the service's first
page, and the limit is then that page.

The examples from here on use a copy of the starter card with three files on
drive B. Two are programs that are a `RET` and zeros, of 46,848 and 46,849
bytes. The third is `ARGS`, whose source, saved as `build/args.asm`, is in the
section on page zero below:

```sh
node -e 'const b = n => { const x = Buffer.alloc(n); x[0] = 0xC9; return x; };
require("fs").writeFileSync("build/fits.com", b(46848));
require("fs").writeFileSync("build/big.com", b(46849));'
npx atom build/args.asm build/args.com
cp dist/starter.img build/ccp.img
node tools/tecvol.mjs put build/ccp.img B build/args.com
node tools/tecvol.mjs put build/ccp.img B build/fits.com
node tools/tecvol.mjs put build/ccp.img B build/big.com
```

`FITS.COM`, 46,848 bytes, loads and runs, and `BIG.COM`, one byte more,
doesn't:

<!-- node tools/capture.mjs --card build/ccp.img B: FITS BIG -->
```text
A>B:
B>FITS

B>BIG
BIG?

B>
```

`NOTDRIVE` calls `LOADCOM` for `NAME.COM` first (`src/cpm/ccp.asm:277-285`),
and the zero flag separates the two failures. A file that is there but too
large is a bad command at once. Only when there is no `NAME.COM` does the CCP
change the type to `PRL` and call `LOADCOM` again. It then calls `PRLGO`,
which checks the PRL's header against what was loaded and moves the code down
from `0200h` to `0100h` (`src/cpm/ccp.asm:286-293`, `src/prl.asm:12-58`).
Chapter 21 describes the PRL loader. A read error during a load is a
`Bad Sector` from the BDOS, which ends the command by warm boot before
`LOADCOM` returns.

## Page zero and the jump

A loaded program gets the page zero that CP/M 2.2 defines. `PREPPAGE` parses
the first two words of the arguments into the FCBs at `005Ch` and `006Ch`. It
copies the arguments to `0080h`, the command tail, with their length in front
and a 0 after them, and sets the DMA address to `0080h` with function 26
(`src/cpm/ccp.asm:1296-1329`). The tail starts with the space after the
command's name and ends at the end of the piece, and its letters are the
capitals `MLTAKE` made.

The two FCBs overlap, since the second starts 16 bytes after the first.
`PREPPAGE` parses the second FCB after the first, so its drive and name are
complete and the first FCB's last 20 bytes are not. The tail, written last,
takes the second FCB's last 16 bytes in turn.

`ARGS` prints what the CCP left there: each FCB's drive byte as a digit and
its eleven name bytes, then the tail between brackets.

```asm
; ARGS: prints the two FCBs and the command tail that the CCP leaves in
; page zero: each FCB's drive byte as a digit and its eleven name bytes,
; then the tail between brackets.
BDOS    EQU     $0005

        ORG     $0100
        LD      HL,$005C        ; the first FCB
        CALL    SHOWFCB
        LD      HL,$006C        ; the second
        CALL    SHOWFCB
        LD      A,'['
        CALL    PUT
        LD      HL,$0080        ; the tail's length, then its characters
        LD      B,(HL)
TAIL:   LD      A,B
        OR      A
        JR      Z,TEND
        INC     HL
        LD      A,(HL)
        CALL    PUT
        DEC     B
        JR      TAIL
TEND:   LD      A,']'
        JP      PUT

SHOWFCB:LD      A,(HL)          ; the drive: 0 for the current one
        ADD     A,'0'
        CALL    PUT
        LD      A,' '
        CALL    PUT
        LD      B,11            ; the name and type, as stored
NAME:   INC     HL
        LD      A,(HL)
        CALL    PUT
        DJNZ    NAME
        LD      A,13
        CALL    PUT
        LD      A,10

; Print A by function 2, keeping B and HL.
PUT:    PUSH    HL
        PUSH    BC
        LD      E,A
        LD      C,2
        CALL    BDOS
        POP     BC
        POP     HL
        RET
```

<!-- node tools/capture.mjs --card build/ccp.img B: "args one.txt a:*.c" "ARGS X Y ! ARGS" -->
```text
A>B:
B>args one.txt a:*.c
0 ONE     TXT
1 ????????C  
[ ONE.TXT A:*.C]
B>ARGS X Y ! ARGS
0 X          
0 Y          
[ X Y ]
B>ARGS
0            
0            
[]
B>
```

The first FCB names the current drive with 0 and the second drive A with 1.
The `*` of `*.C` is eight `?`. The tail of `ARGS X Y` keeps the space before
the `!`, and a command with no arguments gets blank FCBs and a tail of
length 0.

With page zero ready, the CCP starts the program (`src/cpm/ccp.asm:294-300`).
It sets the stack pointer to `CSTKTOP`, the top of its own stack, pushes
`0000h` and jumps to `0100h`. A program that ends with `RET` returns to
`0000h`, the jump to warm boot, and so does one that jumps to `0000h` or calls
function 0. The CCP prints a new line at `STARTED` after the warm boot, so a
program that ends its output with a new line is followed by a blank line
before the prompt.

## The CCP's RAM and stack

The next piece of a chained line has to survive the program before it, so warm
boot clears the CCP's block of RAM only from `CCPCLR` (`src/ram.asm:67-128`).
Below that label is the command line, and before it the two FCBs, which need no
clearing because each use parses them in full (`src/ram.asm:68-70`). From
`CCPCLR` on, warm boot clears the CCP's bytes along with the BDOS's
(`src/boot.asm:279-286`).

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BCEBh–BD0Eh` | 36 | `CMDFCB` | the command's FCB, and the source's for `COPY` |
| `BD0Fh–BD32h` | 36 | `RENFCB` | the new name's FCB for `REN`, the destination's for `COPY` |
| `BD33h` | 1 | `CMDBUF` | function 10's maximum, 127 |
| `BD34h` | 1 | `CMDLEN` | the line's length |
| `BD35h–BDB4h` | 128 | `CMDTXT` | the line |
| `BDB5h` | 1 | `BOOTDRV` | the drive from `0004h` at entry, or of a drive change |
| `BDB6h–BDCBh` | 22 | | the parser's pointers and the state of `DIR`, the pager, `SAVE` and `ERA` |
| `BDCCh–BE4Bh` | 128 | `LOADBUF` | scratch: `DIR`'s and `REN`'s directory records, `TYPE`'s records, the load's extra record |
| `BE4Ch–BE58h` | 13 | `STKGUARD` | the stack guard, `A5h` in each byte |
| `BE59h–BE76h` | 30 | `CSTKBAS` | the CCP's stack, up to `CSTKTOP` at `BE77h` |

The addresses are those of the debug80 build. The guard is 43 bytes less the
stack's 30 (`src/ram.asm:119-124`), and warm boot fills it with `A5h`
(`src/boot.asm:291-295`), so a guard byte that is no longer `A5h` shows that
the stack has run past its bottom. `test/stacks.test.mjs` checks the guard
after the CCP's deepest paths, and Chapter 13 describes the measurement behind
the stack's size.

The stack is the CCP's and, from the jump to `0100h`, the program's. With
`0000h` pushed, the program starts with 28 bytes below its return word, more
than the 16 of CP/M 2.2's eight levels. Its stack pointer is in the workspace
above the TPA (`src/cpm/ccp.asm:295-297`, `src/layout.asm:76-82`). A program
that needs more sets its own stack, as many CP/M programs do. Every BDOS call
moves to the BDOS's stack, so a program's calls of `0005h` use only two bytes
of the program's stack.

The CCP keeps nothing in the TPA: it leaves the TPA from `0100h` untouched
until it loads a program or a service there, a service for `NAME.SVC` or
`CON UC1` (`src/glcd.asm:71`, `src/svc.asm:69`). Only `SAVE` reads that area,
which is how `SAVE` writes what a program or a loaded service file left in
memory.
