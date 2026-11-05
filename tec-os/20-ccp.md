---
title: The CCP
parent: TEC-OS
nav_order: 20
nav_group: "Part II: Inside TEC-OS"
---

# 20. The CCP

<!-- Checked against TEC-OS 78127ec, with the ATOM assembler from the repository's
     `atom-z80` 0.3.7 and the starter card's `TED.COM` from Thorium
     128edb7, whose copy in `dist/files` has the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

The CCP is a CP/M program. It reads a line with BDOS function 10, opens files
with function 15 and prints with function 9, all through `0005h`. Two things
set it apart from a program in the TPA. It runs from the ROM, and when a line
names a program it builds page zero and jumps to `0100h`. This chapter follows
a typed line from the prompt to that jump. Chapter 3 describes the same
commands from the keyboard's side.

## The CCP as a program in the ROM

The CCP's code is in four files, assembled in this order (`src/rom.asm:30-33`).
`src/cpm/ccp.asm` holds the entry, the main loop, the command word and the
loading of a program. `ccpfile.asm` holds `DIR` with its pager and `TYPE`.
`ccpmut.asm` holds `ERA`, `REN`, `COPY` and their BDOS call helper. `ccpcmd.asm`
holds `UNLOAD`, `CON`, `USER` and `SAVE`, the parsing of file names, page zero
for a program, `SERVICES` and the startup file. In the ROM of Chapter 13 the CCP
runs from `CCPBAS`, `DD2Ah`, to `E702h`, 2,521 bytes, with the BDOS directly
after it. Its messages and `KEYTAB`, the table of its built-in commands, are in
the ROM's data block (`src/text.asm:19-59`, `src/tables.asm:43-65`).

What the CCP changes is in RAM, from `CCPRAM`, `BCEDh`, to `BE75h`
(`src/ram.asm:138-208`). Appendix C lists the bytes. Warm boot clears them only
from `CCPCLR`, at `BDB7h`. The command line below that label has to outlive
the program a piece of it started, as Chapter 21 describes. The two FCBs below
the line need no clearing, since each use parses a name into them in full.

`DIR` lists with functions 17 and 18, `TYPE` reads with function 20 and `ERA`
erases with function 19 (`src/cpm/ccpfile.asm:101-103`,
`src/cpm/ccpfile.asm:222-224`, `src/cpm/ccpfile.asm:581-583`,
`src/cpm/ccpmut.asm:67-69`). Most of the calls that name one of the CCP's two
FCBs, 24 of them, go through `DOSSEQ`. Each `CALL DOSSEQ` is followed by one
byte: the function's number times 2, plus 1 for `RENFCB` or 0 for `CMDFCB`.
`DOSSEQ` reads the byte at its return address and moves that address past it.
It puts the function in `C` and the FCB in `DE` and jumps to `0005h`, so the
BDOS returns to the instruction after the byte
(`src/cpm/ccpmut.asm:369-386`).

Outside that interface the CCP reads a few of TEC-OS's own bytes. They are the
console's width and height, the console mode, the service loader's result and
the top of the TPA at `0007h`. It sets the BDOS's flags `HFLAG` and `WRFLAG`,
startup's `STFLAG` and the return code `PRGCODE`. It also calls a few of the
ROM's routines directly, and each is named below with the command that uses
it.

## The entry from boot

A warm boot restarts the CCP, which has to come back on the drive and user it
was on. The byte at `0004h` carries them across. Cold boot and warm boot both
end with a jump to `CCPENT` with that byte in `C`. It has the user number
in bits 4 to 7 and the drive in bits 0 to 3 (`src/boot.asm:208-211`,
`src/cpm/ccp.asm:32-100`). Cold boot sets the byte to 0, drive A and user 0,
before it runs on into warm boot (`src/boot.asm:155-157`). Warm boot's `PZINIT`
leaves it as the CCP last wrote it (`src/boot.asm:221-224`).

`CCPENT` sets its stack and keeps the drive in `BOOTDRV`
(`src/cpm/ccp.asm:46-71`). It then sets `WRFLAG` and calls function 13, the
disk reset. With that flag the reset keeps the drives whose allocation vectors
are unchanged, as Chapter 19 describes. Warm boot has cleared the user number
with the rest of the BDOS's variables. `CCPENT` therefore calls function 32
with the user from the byte (`src/cpm/ccp.asm:72-91`). `STBOOT` comes next. It reads
`A:STARTUP.CMD` the first time it is called after a cold boot and does nothing
later (`src/cpm/ccp.asm:92`, `src/cpm/ccpcmd.asm:829-870`). Chapter 25 describes
startup. Last, if the drive is not A, the CCP selects it with function 14
(`src/cpm/ccp.asm:93-100`). It then prints a new line and starts its loop at
`STARTED` (`src/cpm/ccp.asm:105-108`).

That selection would fail on a drive with no volume. Function 14 would give the
`Select` error, and the error's warm boot would come back to `CCPENT` with the
same byte. `CCPENT` therefore tests the drive first, and a drive past D or with
no volume becomes drive A (`src/cpm/ccp.asm:51-71`). `SAVEDU` writes A into the
byte at the next prompt. A program that unmounts the current drive gives this
case. Here `MOUNT`, run from drive A, takes the volume off drive B while B is
the current drive, so the prompt comes back on A. The reset button then starts
a cold boot:

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

The reset finds the card's volumes again with drive B left empty. The
selection a reset keeps is the one that was in RAM, as Chapter 15 describes.

## The prompt and the line's sources

A warm boot started by a program has to return to the drive and user in use.
The byte at `0004h` is therefore brought up to date before every prompt.
`MAINLOOP` sets the stack again and calls `SAVEDU` (`src/cpm/ccp.asm:115-121`).
`SAVEDU` reads the user number with function 32 and the drive with function 25
and writes both into the byte (`src/cpm/ccp.asm:346-367`). The prompt is the
drive's letter and `>` (`src/cpm/ccp.asm:122-143`). For any user but 0 the user
number comes first in decimal, as in CP/M 3: `A>` in user 0 and `3A>` in
user 3.

A line has three sources, taken in order (`src/cpm/ccp.asm:144-162`). The first
is what is left of a chained line. The second is the startup file, through
`STLINE`. The third is the keyboard, through BDOS function 10 with `HFLAG` set
for the history. `STFLAG` records where a new line came from: `FFh` for a line
of the startup file and 0 for a typed one (`src/cpm/ccp.asm:149-154`). A
chained line's piece leaves it as it was. For the keyboard the CCP's buffer is
`CMDBUF`, with `CMDLEN` after it for the count and `CMDTXT` for the characters
(`src/ram.asm:154-159`). Warm boot sets the buffer's maximum to 127
(`src/boot.asm:509-511`).

`MLTAKE` takes one piece of the line up to its `!`, turns its letters to
capitals and sets `PRGCODE`, the return code, to 0 (`src/cpm/ccp.asm:219-280`).
Chapter 21 describes the chained line, the `:` test, the return code and the
ways the rest of a line is dropped. Chapter 25 describes the startup file.

## The command word and file names

With the piece ready, `MLTAKE` tests for a change of drive
(`src/cpm/ccp.asm:282-307`). A change is a letter from `A` to `P`, a colon and
nothing after them but spaces. For a change the CCP stores the drive in
`BOOTDRV`, selects it with function 14 and calls `SAVEDU`. A drive with no
volume gives the `Select` error before `SAVEDU` runs. The byte at `0004h`
then keeps the old drive, and the warm boot after the error returns to it.

Anything else is a command. `NOTDRIVE` starts a new line on the screen, passes
over spaces and parses the first word with `CMDPARSE`, as a file name, into
`CMDFCB` (`src/cpm/ccp.asm:380-391`). `CMDSTRT` keeps where the word starts,
for an error message, and `ARGSTRT` where it ends, the start of the arguments.
A word that doesn't parse as a file name is a bad command already
(`src/cpm/ccp.asm:549-556`).

The CCP then compares the word with the names of its ten built-in commands.
`KEYTAB` holds them in the order `DIR`, `TYPE`, `ERA`, `REN`, `SAVE`, `USER`,
`CON`, `COPY`, `UNLOAD` and `SERVICES`, each with a 0 after it and then its
routine's address, and a 0 ends the table (`src/tables.asm:43-65`). The loop at
`KEYNXT` calls `ISCMD` for each name and jumps to the routine of the name that
matches (`src/cpm/ccp.asm:392-424`). `ISCMD` compares the text at
`CMDSTRT`, not the FCB, and requires a space or the end of the piece after the
name (`src/cpm/ccpcmd.asm:733-756`). So `A:DIR` and `DIR.COM` are not the
built-in. The first is the program `DIR` on drive A and the second the program
`DIR`, and both fail with no `DIR.COM` on the card.

A word that is none of the built-ins names a program or a service, and must be
a single file name with no wildcard (`src/cpm/ccp.asm:425-429`). The type
selects which. A type of `SVC` installs a service through `SVCGO`
(`src/cpm/ccp.asm:431-461`, `src/loader.asm:869-902`), which Chapter 24
describes. A service that fails to install is a bad command, with one
exception. A line from the startup file whose service's `INIT` reported its
device absent, `TNENODV`, ends with nothing printed and the return code still
0 (`src/cpm/ccp.asm:443-457`). A `:` line after it therefore runs. That is how
the starter card's `GLCD.SVC` line passes quietly on a board with no GLCD, and
Chapter 25 gives the rule in full. Any other type, or none, is replaced by
`COM` (`src/cpm/ccp.asm:463-471`), so `MOUNT.TXT` runs `MOUNT.COM`.

A command that fails ends at `BADCMD` (`src/cpm/ccp.asm:556-577`). It prints
the word from `CMDSTRT` up to its first space, a question mark and a new line. `BADCMD` and the built-ins' messages of failure go
through `ERRGO`, which sets the return code to `FF00h` first
(`src/cpm/ccp.asm:583-591`). `ERRGO` and the built-ins end at one of two
labels. `STARTED` starts a new line and prints the prompt, and `MAINLOOP`
prints the prompt on the line the command left.

The CCP parses every file name through one routine. `PARSEFCB` reads one file
reference into the first 16 bytes of an FCB and leaves `HL` at the character
after it (`src/cpm/ccpcmd.asm:482-613`). It first clears all 36 bytes of the
FCB: 0 for the drive, spaces for the name and type, zeros for the rest. A
command after `TYPE` therefore loads from the start of its file, not from the
record where `TYPE` stopped (`src/cpm/ccpcmd.asm:482-522`). A letter and a
colon at the start set the drive byte, 1 to 16 for `A` to `P`
(`src/cpm/ccpcmd.asm:523-541`). Any other character before the colon is an
error. Up to
eight characters go into the name and, after a full stop, up to three into the
type (`src/cpm/ccpcmd.asm:543-568`).

A name ends at a 0, a space, `=` or `.` (`src/cpm/ccpcmd.asm:699-710`). Inside
it, `*` fills the rest of its field with `?` (`src/cpm/ccpcmd.asm:677-692`).
`VALIDCHR` rejects the thirteen characters CP/M 2.2 reserves
(`src/cpm/ccpcmd.asm:650-670`). `BADCHARS` holds them: `<`, `>`, `,`, `;`, `:`,
`[`, `]`, `%`, `|`, `(`, `)`, `/` and `\` (`src/text.asm:58-59`). A field with
more characters than it holds is an error too. `PARLONG` moves past the rest
of the word and returns the error flag (`src/cpm/ccpcmd.asm:600-613`). The
commands that take exactly one file test the parsed FCB with `UNAMBIG`, which
rejects an empty name and any `?` (`src/cpm/ccpcmd.asm:625-639`). They are
`TYPE`, `REN`, `SAVE`, `COPY` and a program's name.

## The built-in commands

Each built-in is a routine in `ccpfile.asm`, `ccpmut.asm` or `ccpcmd.asm`, and
the one for `UNLOAD` calls `SVCUNL` in `loader.asm`:

| Command | Routine | Source |
| --- | --- | --- |
| `DIR` | `CMDDIR` | `src/cpm/ccpfile.asm:26-288` |
| `TYPE` | `CMDTYPE` | `src/cpm/ccpfile.asm:560-619` |
| `ERA` | `CMDERA` | `src/cpm/ccpmut.asm:13-79` |
| `REN` | `CMDREN` | `src/cpm/ccpmut.asm:93-175` |
| `SAVE` | `CMDSAVE` | `src/cpm/ccpcmd.asm:283-421` |
| `USER` | `CMDUSER` | `src/cpm/ccpcmd.asm:236-273` |
| `CON` | `CMDCON` | `src/cpm/ccpcmd.asm:64-228` |
| `COPY` | `CMDCOPY` | `src/cpm/ccpmut.asm:238-358` |
| `UNLOAD` | `CMDUNL` | `src/cpm/ccpcmd.asm:13-17`, `src/loader.asm:120-165` |
| `SERVICES` | `CMDSVC` | `src/cpm/ccpcmd.asm:786-819` |

`DIR` turns a missing name into eleven `?` and sets the DMA address to
`LOADBUF`. It lists the entries that function 17 and then function 18 return
(`src/cpm/ccpfile.asm:26-103`). It passes over an entry whose system attribute,
bit 7 of its second type byte, is set (`src/cpm/ccpfile.asm:128-136`). The CCP's
FCB has extent 0, so only the entry that holds a file's first extent matches.
Each file is therefore listed once. The number of columns is the console's width,
`VWID`, divided by 13, at least one. A width of 0, on the serial terminal, is
taken as 80 (`src/cpm/ccpfile.asm:70-98`). Each name is printed as `NAME.EXT`,
padded to 12 characters unless it ends the row
(`src/cpm/ccpfile.asm:176-217`).

`DIR`'s last line gives the number of files and the free space on the drive it
listed (`src/cpm/ccpfile.asm:230-288`). For the free space it calls function 46
for that drive, with the DMA address still at `LOADBUF`. The function returns
the free records in three bytes there, and `DIR` divides them by 8 to give
KiB. Function 46 leaves the default drive as it was, so `DIR` selects nothing.
A listing with no file gives `NO FILE`.

A listing longer than the screen would scroll out of view, so `DIR` and `TYPE`
print through the pager (`src/cpm/ccpfile.asm:310-490`). `PGINIT` takes the
console's height and width from `VHGT` and `VWID`, or 24 and 80 on the serial
terminal. It keeps one row for the pause. `PGPUT` counts each character's
column: back to 0 at CR, back one at backspace and on to the next multiple of 8
at a tab. It counts a new line at LF and at a character that would pass the
last column, as the screen wraps it. With the rows full it prints `[more]` and
waits with function 6, so that the key is not echoed. `UNMORE` then writes a
CR, six spaces and a CR over `[more]`. `^C`, Esc and `Q` or `q` stop the
listing. `^C` also drops the rest of a chained line. The test clears one bit
of the key, so `#` reads as `^C` and `;` as Esc. Any other key shows the next
screen.

`TYPE` opens its one file and reads it a record at a time into `LOADBUF`. It
prints each byte through the pager up to the first `^Z`, `1Ah`, or the end of
the file (`src/cpm/ccpfile.asm:560-619`). A file that is not there gives
`NO FILE`.

`ERA` with a name that is all `?`, as `*.*` gives, prints `ALL (Y/N)?` and
reads the answer with function 1. A Return alone is no. After any other key the
CCP reads on to a Return. Any answer but `Y` or `y` erases nothing
(`src/cpm/ccpmut.asm:26-60`). The erase itself is function 19, and `NO FILE`
when nothing matched (`src/cpm/ccpmut.asm:66-79`).

`REN NEW=OLD` parses the new name into `RENFCB` and the old one into `CMDFCB`.
The two names share one drive: a name with no drive takes the other's, and two
different drives are a bad command (`src/cpm/ccpmut.asm:119-141`). The command
then searches for the new name. A new name already on the drive gives
`FILE EXISTS` with nothing changed (`src/cpm/ccpmut.asm:143-155`,
`src/cpm/ccpmut.asm:172-175`).
Otherwise the first 12 bytes of `RENFCB` are copied to offset 16 of `CMDFCB`,
the second drive byte, so the new name follows it at offset 17, where function
23 reads it. The rename gives `NO FILE` if the old name is not there
(`src/cpm/ccpmut.asm:157-168`).

`SAVE N NAME` reads a decimal count of 256-byte pages and rejects any count
that reaches the page of the word at `0006h`. A count past 255 is a bad
command too, since each step of the decimal conversion tests for a carry
(`src/cpm/ccpcmd.asm:293-335`). On the starter card that page is `B9h`, so the
largest `SAVE` is 184 pages, `0100h` to `B8FFh`. 185 is rejected as 320 is:

<!-- node tools/capture.mjs "SAVE 320 B:X.COM" "SAVE 185 B:X.COM" -->
```text
A>SAVE 320 B:X.COM
320?

A>SAVE 185 B:X.COM
185?

A>
```

`SAVE` then erases the file, makes it again and writes the pages from `0100h`
on, two records each (`src/cpm/ccpcmd.asm:343-394`). A failed make, write or
close gives `NO SPACE`. After a failed write `SAVE` closes the file first, so
the records it wrote stay in the file's entry. CP/M 2.2's `SAVE` leaves the
file unclosed (`src/cpm/ccpcmd.asm:396-421`). `SAVE` is the one built-in that
reads the TPA. The CCP writes nothing there until it loads a program or a
service, so `SAVE` writes what a program or a loaded service file left in
memory.

`USER N` takes 0 to 15 and calls function 32 (`src/cpm/ccpcmd.asm:236-273`).

`CON` with no argument names the console in use. It takes six names, with a
colon after each allowed. `TTY`, `CRT`, `BAT` and `UC1` are the IOBYTE's own,
and `PICO` stands for `CRT:` and `GLCD` for `UC1:`. The name sets the IOBYTE's
console field through `CONFLD` (`src/cpm/ccpcmd.asm:64-204`,
`src/text.asm:43-49`). For `UC1:` the command also loads `GLCD.SVC` through
`GLCLD` if it is not in. Its reply is `CON:` and the name of the mode the BIOS
took, read from `CONMOD` after the BIOS has acted on the field
(`src/cpm/ccpcmd.asm:206-228`). A display or keyboard that isn't there
therefore gives `CON: TTY:`. Chapter 16 describes the BIOS's side.

After `CRT` or `PICO`, and a space, `CON` takes a width of two digits
(`src/cpm/ccpcmd.asm:118-190`). It finds the PICO9918 console's record with the
ROM table's `TNFIND`, under the name `PICO` at version 3. It then calls the
table's `PICOWID` entry with the width, which accepts 80, 40 or 32. Four cases
are bad commands: a name run into its width, a width after any other name, any
other width and a board with no PICO9918 console. The error names the width,
or the whole word for a name run into its width. A line of `STARTUP.CMD` with
a width on a board with no PICO9918 console is the exception. It passes with
nothing said and the return code 0, as a line for an absent device does. On
the web page's board:

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
`PIBLK`, which a warm boot leaves (`src/ram.asm:65-86`, `src/pico.asm:84-112`).
It therefore lasts until a reset, which starts the console at 80 columns
again.

`COPY SOURCE DEST` copies a file within the user area
(`src/cpm/ccpmut.asm:238-358`). Both names are parsed with the current drive
put in a 0 drive byte, so that they can be compared. A destination with no
name takes the source's whole name. A destination equal to the source, all 12
bytes, is a bad command with nothing opened, and so is any text after the
destination (`src/cpm/ccpmut.asm:238-279`). The copy goes a record at a time
through the default DMA buffer at `0080h`, so it uses none of the TPA. The
count of records is kept in `DIRNUM` and printed in hexadecimal after
`COPIED`, through the console's `HEXHL` (`src/cpm/ccpmut.asm:281-345`,
`src/cpm/ccpmut.asm:392-395`). On a write error, a full disk or directory,
`COPY` closes the destination before it prints `WRITE ERROR`
(`src/cpm/ccpmut.asm:347-358`). The records it wrote therefore stay in the
destination's entry.

`SERVICES` prints each service's name and its pages from the list of services,
with `SVCABV` for the page above each (`src/cpm/ccpcmd.asm:786-819`). `UNLOAD`
removes the lowest through `SVCUNL`, and `NAME.SVC` as a command installs one.
Chapter 24 describes all three.

## Loading a program

`LOADCOM` loads a `.COM` file at `0100h` through the BDOS
(`src/cpm/ccp.asm:647-739`). It opens `CMDFCB`. With no such file it returns
with the carry flag and the zero flag set. Otherwise it reads the file a record
at a time through `READSRC`. `READSRC` sets the DMA address with function 26
to each record's place from `0100h` up and reads with function 20. The reading
stops at the end of the file or when the address reaches the page of the word
at `0006h`, the byte at `0007h` (`src/cpm/ccp.asm:655-675`).

A file may end exactly at that page. `LOADLIM` therefore reads one more
record, into `LOADBUF`, where it can't reach the resident CCP. When that read
returns the end of the file, the load is complete. Any other result means the
file is too large, and the carry flag is set with the zero flag clear
(`src/cpm/ccp.asm:684-695`). A file that fits leaves in `LOADTOP` the address
after its last record, which the service loader uses, and is closed
(`src/cpm/ccp.asm:700-717`).

The largest program is therefore the 256-byte pages from `0100h` up to the
page that holds the BDOS entry. On the starter card, whose entry is at `B9A4h`,
that is 47,104 bytes, 164 fewer than the TPA. With a service loaded the word at
`0006h` is the start of the service's first page, and the limit is then that
page.

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

A read error during a load is a `Bad Sector` from the BDOS, which ends the
command by warm boot before `LOADCOM` returns.

## The search order

A program is searched for on at most two drives, in at most two user areas of
each. The order is the current drive and then drive A, each in the current user
area and then in user 0. This section gives the rule in full, and Chapters 3,
21 and 25 and Appendix D rest on it.

`NOTDRIVE` calls `LOADA` for `NAME.COM` on the drive the command names, or on
the current drive (`src/cpm/ccp.asm:463-474`). `LOADA` calls `LOADCOM` in the
current user area (`src/cpm/ccp.asm:593-635`). With no such file there, and a
user other than 0, it calls `LOADCOM` again in user 0, with function 32 before
and after the second call. The file needs no system attribute, and the user is
put back before `LOADA` returns. The zero flag separates the two failures. A
file that is there but too large is a bad command at once, and the search goes
no further. With no such file on the drive, the CCP searches drive A, but only
when the command names no drive and the current drive is not A. It sets the
FCB's drive byte to 1, for A, and calls `LOADA` again
(`src/cpm/ccp.asm:477-491`). A's current user area therefore comes before its
user 0. So from drive B a plain `MOUNT` runs `A:MOUNT.COM`, and `B:MOUNT` is
searched for on B alone:

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

A service is the exception: `NAME.SVC` installs from the current drive or the
drive named, and never from drive A in its place. Under user 3 on the card
above, `ARGS` runs from user 0 of drive B and `MOUNT` from user 0 of drive A.
`DIR` lists user 3, which holds no file:

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

## Page zero and the jump

A loaded program gets the page zero that CP/M 2.2 defines. `PREPPAGE` parses
the first two words of the arguments into the FCBs at `005Ch` and `006Ch`. It
copies the arguments to `0080h`, the command tail, with their length in front
and a 0 after them (`src/cpm/ccpcmd.asm:432-469`). It then sets the DMA
address to `0080h` with function 26. The tail starts with the space after the
command's name and ends at the end of the piece. Its letters are the capitals
`MLTAKE` made.

The two FCBs overlap, since the second starts 16 bytes after the first.
`PREPPAGE` parses the second FCB after the first. The second FCB's drive and
name are therefore complete, and the first FCB's last 20 bytes are not. The tail, written last,
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
the `!`, and a command with no arguments gets blank FCBs and a tail of length
0.

With page zero ready, the CCP starts the program (`src/cpm/ccp.asm:493-509`).
It first stores the drive byte of `CMDFCB` at `0050h`, as CP/M 3 does
(`src/cpm/ccp.asm:496-499`). The program reads there the drive it came from:
0 for a plain name found on the current drive and the drive's number for a
name such as `B:ARGS`. It is 1 for a program the search found on drive A,
since the search set the FCB's drive byte to 1. The CCP then sets the stack
pointer to `CSTKTOP`, the top of its own 32-byte stack, pushes `0000h` and
jumps to `0100h`. The program starts with 30 bytes of stack below that return
word, more than the 16 of CP/M 2.2's eight levels. Chapter 14 gives the
measurement behind the size. A program that ends with `RET` returns to
`0000h`, the jump to warm boot. So does one that jumps to `0000h` or calls
function 0. After the warm boot the CCP prints a new line at `STARTED`. A
program that ends its output with a new line is therefore followed by a blank
line before the prompt.
