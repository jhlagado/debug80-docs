---
title: The CCP
parent: TEC-OS
nav_order: 17
nav_group: "Part II: Inside TEC-OS"
---

# 17. The CCP

Checked against TEC-OS 58d4345, with the ATOM assembler from the repository's
`atom-z80` 0.3.7 and the starter card's `TED.COM` from Thorium
128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`.

The CCP prints the prompt, reads a command line and carries it out, as Chapter
3 describes from the keyboard's side. This chapter describes the CCP's code:
its entry from cold and warm boot, the prompt, and the parsing of the command
word and file names. It then covers the built-in commands, the loading of a
program with its page zero, and the CCP's RAM and stack.

## The CCP in the ROM

The CCP's code is `src/cpm/ccp.asm`. In the ROM that Chapter 12 describes it
runs from `CCPBAS`, `DCE2h`, to `E6A0h`, 2,495 bytes, followed directly by the
BDOS. Its messages are in the ROM's data block (`src/text.asm:12-50`,
`src/text.asm:64-66`), and so is `KEYTAB`, the table of its built-in commands'
names (`src/tables.asm:43-65`). What the CCP changes has to be
in RAM, so its variables, buffers and stack are there, from `CCPRAM`, `BCEDh`,
to `BE75h` (`src/ram.asm:79-139`).

In most of what it does the CCP is an ordinary CP/M program: it reads and
writes files and the console through `CALL 0005h`, as a program in the TPA
does. `DIR` lists with functions 17 and 18, `TYPE` reads with function 20 and
`ERA` erases with function 19 (`src/cpm/ccpfile.asm:61-62`,
`src/cpm/ccpfile.asm:144-145`, `src/cpm/ccp.asm:477-478`,
`src/cpm/ccpfile.asm:458-459`). Most of the calls that name one of the CCP's two
FCBs, 22 of them, go through `DOSSEQ`. Each `CALL DOSSEQ` is followed by one
byte, the function's number times 2, plus 1 for `RENFCB` or 0 for `CMDFCB`.
`DOSSEQ` reads the byte at its return address and moves that address past it,
puts the function in `C` and the FCB's address in `DE`, and jumps to `0005h`,
so the BDOS returns to the instruction after the byte
(`src/cpm/ccpfile.asm:651-664`).

Outside that interface the CCP reads a few of TEC-OS's own bytes: the
console's width and height, `VWID` and `VHGT`, the console mode, the service
loader's result and the top of the TPA at `0007h`. It also sets the BDOS's
flags `HFLAG` and `WRFLAG` and startup's `STFLAG`, and it reads and sets the
return code `PRGCODE` (`src/cpm/ccp.asm:52-53`, `src/cpm/ccp.asm:101-107`,
`src/cpm/ccp.asm:146`, `src/cpm/ccp.asm:177`, `src/cpm/ccp.asm:290-292`,
`src/cpm/ccp.asm:378`, `src/cpm/ccp.asm:425`, `src/cpm/ccpfile.asm:211`). It calls
a few of TEC-OS's routines directly: the service loader through `SVCGO`,
`SVCUNL` for `UNLOAD`, `GLCLD` for `CON UC1`, `CONFLD` for `CON`, the ROM
table's `ABICALL` and the PICO9918 console's width entry for `CON PICO`'s
width, `SVCABV` for `SERVICES`, the console's `HEXHL` for `COPY`'s count in
hexadecimal and the BDOS's division, `DIV16` (`src/cpm/ccp.asm:288`,
`src/cpm/ccpcmd.asm:8`, `src/cpm/ccpcmd.asm:119`, `src/cpm/ccpcmd.asm:116`,
`src/cpm/ccpcmd.asm:97-111`, `src/cpm/ccpcmd.asm:541`,
`src/cpm/ccpfile.asm:668-669`, `src/cpm/ccpfile.asm:343`). Startup's `STBOOT` and
`STLINE` and the `SERVICES` command's `CMDSVC` are in `ccp.asm` itself
(`src/cpm/ccpcmd.asm:526-639`).

## The entry from boot

A warm boot restarts the CCP, which has to come back on the drive and user it
was on, and the byte at `0004h` carries them across. Cold boot and warm boot
both end with a jump to `CCPENT`, with `C` holding that byte. It has the user
number in bits 4 to 7 and the drive in bits 0 to 3 (`src/boot.asm:109-111`,
`src/cpm/ccp.asm:23-66`). Cold boot sets it to 0, drive A and user 0, before
it falls into warm boot (`src/boot.asm:81-82`), and warm boot's `PZINIT`
leaves it as the CCP last wrote it (`src/boot.asm:221-224`).

`CCPENT` sets its stack and keeps the drive in `BOOTDRV`
(`src/cpm/ccp.asm:30-44`). It then sets `WRFLAG` and calls function 13, the
disk reset, which with that flag keeps the drives whose allocation vectors are
unchanged, as Chapter 16 describes. Warm boot has cleared the user number with
the rest of the BDOS's variables, so `CCPENT` calls function 32 with the user
number from the byte (`src/cpm/ccp.asm:45-59`). `STBOOT` comes next: it reads `A:STARTUP.CMD` the
first time it is called after a cold boot and does nothing later
(`src/cpm/ccp.asm:60`, `src/cpm/ccpcmd.asm:553-584`). Chapter 21 describes startup.
Last, if the drive is not A, the CCP selects it with function 14
(`src/cpm/ccp.asm:61-66`), then prints a new line and starts its loop at
`STARTED` (`src/cpm/ccp.asm:70-72`).

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

A>GLCD.SVC

A>
```

The reset finds the card's volumes again with drive B left empty, because the
selection a reset keeps is the one that was in RAM, as Chapter 14 describes.

## The prompt and the line

A warm boot started by a program has to return to the drive and user in use,
so the byte at `0004h` is brought up to date before every prompt. `MAINLOOP`
sets the stack again and calls `SAVEDU`, which reads the user number with
function 32 and the drive with function 25 and writes both into the byte
(`src/cpm/ccp.asm:77-79`, `src/cpm/ccp.asm:225-245`). The prompt is the
drive's letter and `>`, after the user number in decimal for any user but 0, as
in CP/M 3: `A>` in user 0 and `3A>` in user 3 (`src/cpm/ccp.asm:80-96`).

A line has three sources, tried in order: what is left of a chained line, the
startup file through `STLINE` and the keyboard through BDOS function 10, with
`HFLAG` set for the history (`src/cpm/ccp.asm:97-109`). `STFLAG` records
where a new line came from, `FFh` for a line of the startup file and 0 for a
typed one, and a chained line's piece leaves it as it was
(`src/cpm/ccp.asm:100-103`). For the keyboard the
CCP's buffer is `CMDBUF`, with `CMDLEN` after it for the count and `CMDTXT`
for the characters (`src/ram.asm:90-95`). Warm boot sets the buffer's maximum
to 127 (`src/boot.asm:303-304`).

`MLTAKE` takes one piece of the line up to its `!`, turns its letters to
capitals and sets `PRGCODE`, the return code, to 0
(`src/cpm/ccp.asm:137-181`). Chapter 24 describes the chained line, the `:`
test, the return code and the ways the rest of a line is dropped, and Chapter
21 the startup file.

## Drive changes and the command word

With the piece ready, `MLTAKE` tests for a change of drive: a letter from `A`
to `P`, a colon and nothing after them but spaces (`src/cpm/ccp.asm:178-203`).
For a change the CCP stores the drive in `BOOTDRV`, selects it with function
14 and calls `SAVEDU`. A drive with no volume gives the `Select` error before
`SAVEDU` runs, so the byte at `0004h` keeps the old drive and the warm boot
after the error returns to it.

Anything else is a command. `NOTDRIVE` starts a new line on the screen, passes
over spaces and parses the first word with `CMDPARSE`, as a file name, into
`CMDFCB` (`src/cpm/ccp.asm:251-257`). `CMDSTRT` keeps where the word starts,
for an error message, and `ARGSTRT` keeps where it ends, the start of the
arguments. A word that doesn't parse as a file name is a bad command already
(`src/cpm/ccp.asm:350-357`).

The CCP then compares the word with the names of its ten built-in commands, in
the order `DIR`, `TYPE`, `ERA`, `REN`, `SAVE`, `USER`, `CON`, `COPY`, `UNLOAD`
and `SERVICES`. `KEYTAB` holds each name with a 0 after it and then its
routine's address, and a 0 ends the table. One loop, from `KEYNXT`, calls
`ISCMD` for each name and jumps to the routine of the one that matches
(`src/cpm/ccp.asm:258-277`, `src/tables.asm:43-65`). `ISCMD` compares the text at
`CMDSTRT`, not the FCB, and requires a space or the end of the piece after the
name (`src/cpm/ccpcmd.asm:486-507`). So `A:DIR` and `DIR.COM` are not the
built-in. The first is the program `DIR` on drive A and the second the program
`DIR`, and both fail with no `DIR.COM` on the card.

A word that is none of the built-ins names a program, and must be a single
file name with no wildcard (`src/cpm/ccp.asm:278-280`). The type selects what
follows. A type of `SVC` installs a service through `SVCGO`
(`src/cpm/ccp.asm:281-297`, `src/loader.asm:510-533`), which Chapter 20 describes.
A service that fails to install is a bad command, with one exception. When the
line came from the startup file and the service's `INIT` refused because its
device isn't there, `TNENODV`, the CCP says nothing and leaves the return code
0, so a `:` line after it runs (`src/cpm/ccp.asm:289-296`). That is how the
starter card's `GLCD.SVC` line passes quietly on a board with no GLCD.
Any other type, or none, is replaced by `COM` (`src/cpm/ccp.asm:298-303`), so
`MOUNT.TXT` runs `MOUNT.COM`. A program is looked for in user 0 after the
current user, and a command that names no drive runs a program from drive A
when the current drive has it in neither user, as the section on loading below
describes.

A command that fails ends at `BADCMD`, which prints the word from `CMDSTRT` up
to its first space with a question mark after it, then a new line
(`src/cpm/ccp.asm:358-373`). `BADCMD` and the built-ins' messages of failure
go through `ERRGO`, which sets the return code to `FF00h` first
(`src/cpm/ccp.asm:374-381`). Chapter 24 lists them. `ERRGO` and the built-ins
end at one of two labels: `STARTED` starts a new line and prints the prompt,
and `MAINLOOP` prints the prompt on the line the command left.

## File names

The CCP parses every file name through one routine. `PARSEFCB` reads one file
reference into the first 16 bytes of an FCB and leaves `HL` at the character
after it (`src/cpm/ccpcmd.asm:314-409`). It first clears all 36 bytes of the
FCB: 0 for the drive, spaces for the name and type, zeros for the rest. A
command after `TYPE` therefore loads from the start of its file and not from
where `TYPE` stopped (`src/cpm/ccpcmd.asm:320-343`). A letter and a colon at
the start set the drive byte, 1 to 16 for `A` to `P`, and any other character
before the colon is an error (`src/cpm/ccpcmd.asm:344-360`). Up to eight
characters go into the name and, after a full stop, up to three into the type
(`src/cpm/ccpcmd.asm:361-379`).

A name ends at a 0, a space, `=` or `.` (`src/cpm/ccpcmd.asm:464-474`). Inside
it, `*` fills the rest of its field with `?` (`src/cpm/ccpcmd.asm:451-462`).
`VALIDCHR` rejects the thirteen characters in `BADCHARS`, the ones CP/M 2.2
reserves: `<`, `>`, `,`, `;`, `:`, `[`, `]`, `%`, `|`, `(`, `)`, `/` and `\`
(`src/cpm/ccpcmd.asm:428-446`, `src/text.asm:49-50`). A field with more
characters than it holds is an error too: `PARLONG` moves past the rest of the
word and returns the error flag (`src/cpm/ccpcmd.asm:400-409`).

The commands that take exactly one file, `TYPE`, `REN`, `SAVE`, `COPY` and a
program's name, test the parsed FCB with `UNAMBIG`, which rejects an empty
name and any `?` (`src/cpm/ccpcmd.asm:411-426`, `src/cpm/ccpcmd.asm:439-446`).

## The built-in commands

Each built-in is a routine in `ccp.asm`, and the one for `UNLOAD` calls
`SVCUNL` in `loader.asm`:

| Command | Routine | Source |
| --- | --- | --- |
| `DIR` | `CMDDIR` | `src/cpm/ccp.asm:455-615` |
| `TYPE` | `CMDTYPE` | `src/cpm/ccpfile.asm:358-407` |
| `ERA` | `CMDERA` | `src/cpm/ccpfile.asm:414-465` |
| `REN` | `CMDREN` | `src/cpm/ccpfile.asm:467-531` |
| `SAVE` | `CMDSAVE` | `src/cpm/ccpcmd.asm:176-278` |
| `USER` | `CMDUSER` | `src/cpm/ccpcmd.asm:139-170` |
| `CON` | `CMDCON` | `src/cpm/ccp.asm:1065-1180` |
| `COPY` | `CMDCOPY` | `src/cpm/ccpfile.asm:538-671` |
| `UNLOAD` | `CMDUNL` | `src/cpm/ccpcmd.asm:6-10`, `src/loader.asm:53-89` |
| `SERVICES` | `CMDSVC` | `src/cpm/ccpcmd.asm:526-551` |

`DIR` turns a missing name into eleven `?`, sets the DMA address to `LOADBUF`
and lists the entries that function 17 and then function 18 return
(`src/cpm/ccpfile.asm:5-62`). It passes over an entry whose system attribute,
bit 7 of its second type byte, is set (`src/cpm/ccpfile.asm:80-85`). The CCP's
FCB has extent 0, so only the entry that holds a file's first extent matches,
and each file is listed once. The number of columns is the console's width,
`VWID`, divided by 13, at least one, and a width of 0, on the serial terminal,
is taken as 80 (`src/cpm/ccpfile.asm:42-59`). Each name is printed as
`NAME.EXT`, padded to 12 characters unless it ends the row
(`src/cpm/ccpfile.asm:108-140`).

`DIR`'s last line gives the number of files and the free space on the drive it
listed (`src/cpm/ccp.asm:583-615`). For the free space it calls function 46
for that drive, the one the listing named or the current one, with the DMA
address still at `LOADBUF`. The function returns the free records in three
bytes there, and `DIR` divides them by 8 to give KiB. Function 46 leaves the
default drive as it was, so `DIR` selects nothing. A listing with no file
gives `NO FILE`.

A listing longer than the screen would scroll out of view, so `DIR` and `TYPE`
print through the pager (`src/cpm/ccpfile.asm:197-320`). `PGINIT` takes the
console's height and width from `VHGT` and `VWID`, or 24 and 80 on the
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
the file (`src/cpm/ccpfile.asm:358-407`). A file that is not there gives
`NO FILE`.

`ERA` with a name that is all `?`, as `*.*` gives, prints `ALL (Y/N)?` and
reads the answer with function 1. A Return alone is no. After any other key the
CCP reads on to a Return, and any answer but `Y` or `y` erases nothing
(`src/cpm/ccpfile.asm:429-453`). The erase itself is function 19,
and `NO FILE` when nothing matched (`src/cpm/ccpfile.asm:457-465`).

`REN NEW=OLD` parses the new name into `RENFCB` and the old one into `CMDFCB`.
The two names share one drive: a name with no drive takes the other's, and two
different drives are a bad command (`src/cpm/ccpfile.asm:494-507`). The command then
searches for the new name. If it is there it gives `FILE EXISTS` with nothing
changed (`src/cpm/ccpfile.asm:508-516`, `src/cpm/ccpfile.asm:529-531`). Otherwise the
first 12 bytes of `RENFCB` are copied to offset 16 of `CMDFCB`, the second
drive byte, so the new name follows it at offset 17, the place function 23
reads it. The rename gives `NO FILE` if the old name is not there
(`src/cpm/ccpfile.asm:518-531`).

`SAVE N NAME` reads a decimal count of 256-byte pages and rejects any count
that reaches the page of the word at `0006h`. It erases the file, makes it
again and writes the pages from `0100h` on, two records each
(`src/cpm/ccpcmd.asm:176-278`). On the starter card that page is `B9h`, so the
largest `SAVE` is 184 pages, `0100h` to `B8FFh`. A failed make, write or close
gives `NO SPACE`.

`USER N` takes 0 to 15 and calls function 32 (`src/cpm/ccpcmd.asm:139-170`).

`CON` with no argument names the console in use. It takes six names, a colon
after each allowed: `TTY`, `CRT`, `BAT` and `UC1`, and `PICO` for `CRT:` and
`GLCD` for `UC1:`. The name sets the IOBYTE's console field, and for `UC1:` it
also loads `GLCD.SVC` if it is not in (`src/cpm/ccpcmd.asm:16-119`,
`src/text.asm:37-40`). Its reply is `CON:` and the name of the mode the BIOS
took, read from `CONMOD` after the BIOS has acted on the field, so a display
or keyboard that isn't there gives `CON: TTY:` (`src/cpm/ccpcmd.asm:120-137`).
Chapter 15 describes the BIOS's side.

After `CRT` or `PICO`, and a space, `CON` takes a width of two digits. It
finds the PICO9918 console's record with `TNFIND`, under the name `PICO` at
version 3, and calls the table's `PICOWID` entry with the width, which accepts
80, 40 or 32. A name run into its width, a width after any other name, any
other width and a board with no PICO9918 console are bad commands. The
error names the width, or the whole word for a name run into its width (`src/cpm/ccpcmd.asm:68-115`). On the web page's board:

<!-- node tools/capture.mjs --board pico "CON PICO 40" "CON CRT80" "CON PICO 50" "CON TTY 80" "CON CRT: 32" -->
```text
A>CON PICO 40
CON: CRT:
A>CON CRT80
CRT80?

A>CON PICO 50
50?

A>CON TTY 80
80?

A>CON CRT: 32
CON: CRT:
A>
```

The new width clears the screen at the next console call. It is kept in
`PIBLK`, which a warm boot leaves, so it lasts until a reset, which starts the
console at 80 columns again (`src/ram.asm:41-44`, `src/pico.asm:49-65`, Chapter 14).

`COPY SOURCE DEST` copies a file within the user area
(`src/cpm/ccpfile.asm:538-671`). Both names are parsed with the current drive put
in a 0 drive byte, so that they can be compared. A destination with no name
takes the source's whole name, and a destination equal to the source, all 12
bytes, is a bad command, with nothing opened (`src/cpm/ccpfile.asm:571-598`). The
copy goes a record at a time through the default DMA buffer at `0080h`, so it
uses none of the TPA. The count of records is kept in `DIRNUM` and printed in
hexadecimal after `COPIED` (`src/cpm/ccpfile.asm:599-643`).

`SERVICES` prints each service's name and its pages from the list of services,
and `UNLOAD` removes the lowest. `NAME.SVC` as a command installs one. Chapter
20 describes the three.

## Loading a program

`LOADCOM` loads a `.COM` file at `0100h` through the BDOS
(`src/cpm/ccp.asm:412-479`). It opens `CMDFCB`, and if there is no such file
it returns with the carry flag and the zero flag set. Otherwise it reads the
file a record at a time through `READSRC`, which sets the DMA address with
function 26 to each record's place from `0100h` up and reads with function 20. The reading stops at the end of the file or
when the address reaches the page of the word at `0006h`, the byte at `0007h`
(`src/cpm/ccp.asm:423-436`).

A file may end exactly at that page, so `LOADLIM` reads one more record, into
`LOADBUF`, where it can't reach the resident CCP, to find out. If that read
is the end of the file the load is
complete. Otherwise the file is too large, and the carry flag is set with the
zero flag clear (`src/cpm/ccp.asm:438-449`). A file that fits leaves in
`LOADTOP` the address after its last record, which the service loader uses,
and is closed (`src/cpm/ccp.asm:453-464`).

The largest program is therefore the 256-byte pages from `0100h` up to the
page that holds the BDOS entry. On the starter card, whose entry is at
`B9A4h`, that is 47,104 bytes, 164 fewer than the TPA. With a service loaded
the word at `0006h` is the start of the service's first page, and the limit is
then that page.

The examples from here on use a copy of the starter card with three files on
drive B. Two are programs that are a `RET` and zeros, of 47,104 and 47,105
bytes. The third is `ARGS`, whose source, saved as `build/args.asm`, is in the
section on page zero below:

```sh
node -e 'const b = n => { const x = Buffer.alloc(n); x[0] = 0xC9; return x; };
require("fs").writeFileSync("build/fits.com", b(47104));
require("fs").writeFileSync("build/big.com", b(47105));'
npx atom build/args.asm build/args.com
cp dist/starter.img build/ccp.img
node tools/tecvol.mjs put build/ccp.img B build/args.com
node tools/tecvol.mjs put build/ccp.img B build/fits.com
node tools/tecvol.mjs put build/ccp.img B build/big.com
```

`FITS.COM`, 47,104 bytes, loads and runs, and `BIG.COM`, one byte more,
doesn't:

<!-- node tools/capture.mjs --card build/ccp.img B: FITS BIG -->
```text
A>B:
B>FITS

B>BIG
BIG?

B>
```

`NOTDRIVE` calls `LOADA` for `NAME.COM` on the drive the command names, or on
the current drive (`src/cpm/ccp.asm:298-306`). `LOADA` calls `LOADCOM` in the
current user and, when there is no such file and the user is not 0, again in
user 0, with function 32 before and after the second call. The file needs no
system attribute, and the user is put back before `LOADA` returns
(`src/cpm/ccp.asm:383-410`). The zero flag separates the two failures. A file
that is there but too large is a bad command at once. When there is no such
file, the CCP looks on drive A, but only when the command names no drive and
the current drive is not A. It sets the FCB's drive byte to 1, for A, and
calls `LOADA` again, so A's current user comes before its user 0
(`src/cpm/ccp.asm:307-316`). So from drive B a plain `MOUNT` runs
`A:MOUNT.COM`, and `B:MOUNT` looks on B alone:

<!-- node tools/capture.mjs B: MOUNT B:MOUNT -->
```text
A>B:
B>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>B:MOUNT
B:MOUNT?

B>
```

Under user 3 on the card above, `ARGS` runs from user 0 of drive B and `MOUNT`
from user 0 of drive A, while `DIR` lists user 3, which holds no file:

<!-- node tools/capture.mjs --card build/ccp.img B: "USER 3" ARGS MOUNT B:MOUNT DIR -->
```text
A>B:
B>USER 3
3B>ARGS
0            
0            
[]
3B>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

3B>B:MOUNT
B:MOUNT?

3B>DIR
NO FILE
3B>
```

A read error during a load is a `Bad Sector` from the BDOS, which ends the
command by warm boot before `LOADCOM` returns.

## Page zero and the jump

A loaded program gets the page zero that CP/M 2.2 defines. `PREPPAGE` parses
the first two words of the arguments into the FCBs at `005Ch` and `006Ch`. It
copies the arguments to `0080h`, the command tail, with their length in front
and a 0 after them, and sets the DMA address to `0080h` with function 26
(`src/cpm/ccpcmd.asm:280-312`). The tail starts with the space after the
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

With page zero ready, the CCP starts the program (`src/cpm/ccp.asm:317-326`).
It first stores the drive byte of `CMDFCB` at `0050h`, as CP/M 3 does, so the
program can find the drive it came from (`src/cpm/ccp.asm:318-319`). The byte
is 0 for a plain name found on the current drive and the drive's number for a
name such as `B:ARGS`. It is 1 for a program the search found on drive A, since
the search set the FCB's drive byte to 1. The CCP then sets the stack pointer to `CSTKTOP`, the top of its own stack, pushes
`0000h` and jumps to `0100h`. A program that ends with `RET` returns to
`0000h`, the jump to warm boot, and so does one that jumps to `0000h` or calls
function 0. The CCP prints a new line at `STARTED` after the warm boot, so a
program that ends its output with a new line is followed by a blank line
before the prompt.

## The CCP's RAM and stack

The next piece of a chained line has to survive the program before it, so warm
boot clears the CCP's block of RAM only from `CCPCLR` (`src/ram.asm:82-139`).
Below that label is the command line, and before it the two FCBs, which need no
clearing because each use parses them in full (`src/ram.asm:82-85`). From
`CCPCLR` on, warm boot clears the CCP's bytes along with the BDOS's
(`src/boot.asm:268-275`). Before the CCP first runs, cold boot's `SHOWVOL`
builds each drive's letter and label in `CMDTXT` (`src/boot.asm:328-336`).

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BCEDh–BD10h` | 36 | `CMDFCB` | the command's FCB, and the source's for `COPY` |
| `BD11h–BD34h` | 36 | `RENFCB` | the new name's FCB for `REN`, the destination's for `COPY` |
| `BD35h` | 1 | `CMDBUF` | function 10's maximum, 127 |
| `BD36h` | 1 | `CMDLEN` | the line's length |
| `BD37h–BDB6h` | 128 | `CMDTXT` | the line |
| `BDB7h` | 1 | `BOOTDRV` | the drive from `0004h` at entry, or of a drive change |
| `BDB8h–BDCAh` | 19 | | the parser's pointers and the state of `DIR`, the pager, `SAVE` and `ERA` |
| `BDCBh–BE4Ah` | 128 | `LOADBUF` | scratch: `DIR`'s and `REN`'s directory records, `DIR`'s free records, `TYPE`'s records, the load's extra record |
| `BE4Bh–BE55h` | 11 | `STKGUARD` | the stack guard, `A5h` in each byte |
| `BE56h–BE75h` | 32 | `CSTKBAS` | the CCP's stack, up to `CSTKTOP` at `BE76h` |

The addresses are those of the build at 58d4345. The guard is 43 bytes less the
stack's 32 (`src/ram.asm:130-135`), and warm boot fills it with `A5h`
(`src/boot.asm:305-309`), so a guard byte that is no longer `A5h` shows that
the stack has run past its bottom. `test/stacks.test.mjs` checks the guard
after the CCP's deepest paths, and Chapter 13 describes the measurement behind
the stack's size.

The stack is the CCP's and, from the jump to `0100h`, the program's. With
`0000h` pushed, the program starts with 30 bytes below its return word, more
than the 16 of CP/M 2.2's eight levels. Its stack pointer is in the workspace
above the TPA (`src/cpm/ccp.asm:323-325`, `src/layout.asm:64-73`). A program
that needs more sets its own stack, as many CP/M programs do. Every BDOS call
moves to the BDOS's stack, so a program's calls of `0005h` use only two bytes
of the program's stack.

The CCP keeps nothing in the TPA: it leaves the TPA from `0100h` untouched
until it loads a program or a service there, a service for `NAME.SVC` or
`CON UC1` (`src/loader.asm:515-520`, `src/loader.asm:74`). Only `SAVE` reads that area,
which is how `SAVE` writes what a program or a loaded service file left in
memory.
