---
title: Startup
parent: TEC-OS
nav_order: 21
nav_group: "Part II: Inside TEC-OS"
---

# 21. Startup

<!-- Checked against TEC-OS 78127ec. -->

Chapter 5 describes the startup file, the display lines and the LCD's words as
you use them. Behind them are one byte of state, a 128-byte buffer and two
routines in `src/cpm/ccpcmd.asm`: `STBOOT` reads the file, and `STLINE` gives the
CCP one line at a time. This chapter describes them in that order, then the
path a display line takes, the rule that keeps some of the file's failures
quiet, the flag bit behind the LCD's words and the web page's rewrite of the
file.
`test/startup.test.mjs` and `test/pico.test.mjs` check these rules on the host
model of Chapter 25.

## One byte of state

Startup has to hold its place in the file across every program the file runs,
and to start again after a reset. All of its state is `STPOS`, at `BF63h`, with
the file's record after it in `STREC`, at `BF64h–BFE3h` (`src/ram.asm:270-271`).
The byte holds three kinds of value (`src/cpm/ccpcmd.asm:553-556`):

| `STPOS` | Meaning |
| --- | --- |
| `00h` | `STBOOT` hasn't run since cold boot |
| `01h–7Fh` | A record holds lines: the next byte's offset in `STREC`, plus 1 |
| `80h`, `81h` | Finished, `81h` after a CR or LF in the record's last byte |

The byte's place in memory separates an ordinary exit from a reset. The block
that holds it starts above the RAM BIOS table (`src/ram.asm:218`), past
`BDOSRME`, the end of the range `CPMINIT` clears (`src/boot.asm:295-300`,
`src/ram.asm:216`). An ordinary exit is a warm boot, which calls `CPMINIT` and
never comes to `COLD` (`src/boot.asm:4-8`, `src/boot.asm:92-110`), so `STPOS` and
`STREC` keep their values through every program in the file.

Both kinds of reset enter at `RSTENT` and go on to `COLD`
(`src/boot.asm:20-23`), and a recognised reset differs from an
unrecognised one only in what `RSLCAP` copies to `RSLBUF` before the clear, the
drive table (`src/boot.asm:28`, `src/boot.asm:160-167`). Cold boot then clears
the whole workspace, `STPOS` included (`src/boot.asm:37-41`,
`src/ram.asm:301-302`). A retry from the diagnostic prompt returns to `COLDRT`,
after that clear, with `STPOS` still 0, because the CCP hasn't run yet
(`src/boot.asm:63`, `src/boot.asm:487-488`).

## STBOOT

Every entry to the CCP sets the user number and then calls `STBOOT`
(`src/cpm/ccp.asm:54-60`). Cold boot sets the drive and user byte to 0 and then
runs on into warm boot, which passes that byte to the CCP (`src/boot.asm:81-83`,
`src/boot.asm:109-111`), so at the first call the user area is 0. `STBOOT` returns
at once if `STPOS` isn't 0 (`src/cpm/ccpcmd.asm:557-560`), which is the case at every
other entry.

A BDOS error during the read ends in a warm boot, so `STBOOT` marks the file
finished before it touches the card. Its next instruction sets bit 7, making
`STPOS` `80h`, before any part of the read (`src/cpm/ccpcmd.asm:561`). After a failure
the next call of `STBOOT` returns at the same test, so an unreadable file can't
repeat. `test/startup.test.mjs:221-241` makes the card fail at the file's block
and reaches a prompt with nothing from the file run.

The keypad test comes next, and it gives a way past a file that keeps the board
from reaching a prompt (`src/cpm/ccpcmd.asm:562-564`). `test/startup.test.mjs:46-58`
holds a key through reset to get past a service whose `INIT` never returns, and
`:246-259` does the same for a file that resets the board at every boot.
`STSPORT` is port `03h` (`src/layout.asm:11`), and bit 6 is low while a keypad
key is down, as Appendix G describes. A low bit returns from `STBOOT` with
`STPOS` at `80h`, so a skip is the same state as a file that wasn't there. Bit 6
is tested this one time, so the key has to be down when `STBOOT` starts, which
on the model, with the web page's board and the starter card, is 5,824,922
T-states after reset, about 1.46 seconds.

`STBOOT` then makes the read in the CCP's own FCB. It copies 12 bytes of
`STFCB`, a drive byte of 1 and the name `STARTUP CMD`, to `CMDFCB`
(`src/cpm/ccpcmd.asm:565-568`, `src/tables.asm:93`), and cold boot's clear has left the
rest of `CMDFCB` zero. Drive byte 1 is drive A whichever drive is current, and
`RESEL` has already put back a recognised reset's selection (`src/boot.asm:72`),
so the file comes from the volume on drive A at that moment, as Chapter 5's
`SPARE` example shows. Three BDOS calls follow, the second and third through
`DOSSEQ`, which takes the function's number from the byte after its `CALL` and
points `DE` at `CMDFCB` (`src/cpm/ccpcmd.asm:569-579`,
`src/cpm/ccpfile.asm:651-662`):

- function 26 points the DMA address at `STREC`;
- function 15 opens the file, and `INC A` turns its `FFh` for no file into zero;
- function 20 reads the first record, and any result but 0 means an empty file
  or an error.

After a good read `A` is 0, and `INC A` stores `STPOS` as 1, the file's first
byte (`src/cpm/ccpcmd.asm:580-581`). Each failure jumps past that store and leaves
`80h`. `test/startup.test.mjs:146-155` writes a line into `STREC` before a read
that returns an error, and the line doesn't run. All three outcomes meet at
`STBDMA`, which writes `DEFDMA` straight to `CURDMA` (`src/cpm/ccpcmd.asm:582-584`), so
a program started by the first line finds the DMA address at `0080h`, with or
without a file (`test/startup.test.mjs:138-144`).

There is no second read and no close. The record stays in the workspace for
every later line, so a `USER` or a drive change in the file has no effect on
reading the lines after it. The workspace holds one record, which sets the
file's limit at 128 bytes.

## STLINE

The CCP takes one line for each prompt. `MLREAD` prints the prompt and then goes
to a chained line's next piece, to `STLINE` and to the keyboard, in that order
(`src/cpm/ccp.asm:79-109`). `STLINE` returns with carry clear when it has put a
line in the command buffer, and the CCP goes straight to `MLGOT`. With carry set
the CCP sets `HFLAG` and reads the keyboard with function 10. `HFLAG` is set on
that path alone, and function 10 stores a line in the history only if it is set
(`src/cpm/bdos.asm:490-494`), so startup lines are not in the history.

`STLINE` starts by rotating `STPOS` left, which moves the finished bit to carry,
and a finished file returns at once with carry set, for the keyboard. Otherwise
it rotates the position back and adds it to `STREC`'s low byte (`src/cpm/ccpcmd.asm:592-599`). The record lies within
one page, `BFxxh`, so the sum needs no high byte. `DE` is `CMDTXT`, and `B`
counts down from 127, the characters a line may hold (`src/cpm/ccpcmd.asm:600-601`).

The loop tests the record's end before each read, and then reads a byte and
tests it for 0, `^Z`, CR and LF (`src/cpm/ccpcmd.asm:602-614`). Any other byte is a
character. The characters past the 127th are read and dropped, by the test of
`B` at `src/cpm/ccpcmd.asm:615-617`, so the scan still reaches the line's real end and
the next line starts in the right place.

The loop has two ways out. A CR or LF jumps to `STL2` with `HL` past it, and the
record's end, a zero or `^Z` jumps to `STLE`, which first sets `L` to the
record's last byte, `STLAST` (`src/loader.asm:34`, `src/cpm/ccpcmd.asm:622`). `STL2` then
computes the next byte's offset plus 1 from `L` and stores it
(`src/cpm/ccpcmd.asm:623-625`).

From `STLE` that sum is exactly `80h`, finished. Any characters already in
`CMDTXT` still run as a line, so a line cut off by the record's end runs as far
as it goes. The same value comes out of a CR or LF that leaves the next byte at
offset 127. A line starting at the 128th byte therefore never runs, because its
position would be `80h`. A CR or LF in the record's last byte leaves `HL` one
past the record, and `STL2` stores `81h`, also finished
(`src/cpm/ccpcmd.asm:623-625`). A test fills the record to its last byte with a line at
the end, and that line runs (`test/startup.test.mjs:123-128`).

If no character was copied the line was blank, and `STLINE` goes round again
(`src/cpm/ccpcmd.asm:626-628`). A CR and LF therefore take two passes, the CR ending
the line and the LF being a blank line. The starter card's file has 11 bytes,
`GLCD.SVC`, a CR and LF and `^Z`:

| Call | `STPOS` on entry | Bytes read | `STPOS` after | Result |
| --- | --- | --- | --- | --- |
| First | 1 | offsets 0–8 | 10 | `GLCD.SVC`, length 8 |
| Second | 10 | offset 9, the LF | 11 | Blank: goes round |
| | 11 | offset 10, `^Z` | `80h` | Blank: goes round |
| | `80h` | | | Carry: the keyboard |

With a line in hand, `STLINE` stores its length in `CMDLEN`, writes CR and `$`
after it and prints the line from `CMDTXT` through `PUTSTR`, which is BDOS
function 9 (`src/cpm/ccpcmd.asm:629-637`, `src/cpm/ccpcmd.asm:511-513`). Function 9 ends
at the first `$`, so a `$` in the line ends the echo there, but the characters
in `CMDTXT` aren't changed and the line runs whole. The CCP's own `CRLFMSG` at
`NOTDRIVE` ends the echo's row whether or not the CR was reached
(`src/cpm/ccp.asm:251-253`), so the output after a cut echo starts on a new row,
as Chapter 5's transcript shows.

The `$` needs one more byte than the buffer. `CMDTXT` is 128 bytes and is
followed at once by `BOOTDRV` (`src/ram.asm:94-98`), so a line of 127 characters
puts its CR in the last byte of `CMDTXT`, at `BDB6h`, and its `$` at `BDB7h`, in
`BOOTDRV`. The order in `CCPENT` makes this harmless. `BOOTDRV` has one reader,
at `src/cpm/ccp.asm:61`, and the CCP's entry writes the byte before that
(`src/cpm/ccp.asm:44`), so the `$` is rewritten before it is read.

`MLGOT` treats a startup line and a typed one alike from there. It writes a 0
over the CR, sets `CHPOS` to 1 and takes the first piece
(`src/cpm/ccp.asm:113-122`). `MLTAKE` turns the piece's letters to capitals in
place, after the echo (`src/cpm/ccp.asm:163-168`), which is why the echo keeps a
line's small letters. `test/startup.test.mjs:202-219` compares each line run
from the file with the same line typed, in its output and its BDOS calls, apart
from that difference of letter case.

The next line comes by whatever route the CCP takes back to `MLREAD`. A built-in
or a failed command jumps to `STARTED` or `MAINLOOP` (`src/cpm/ccp.asm:70-79`,
`src/cpm/ccp.asm:203`, `src/cpm/ccpfile.asm:526`). A program returns to the `WBOOT`
address that `CMDRUN` pushed (`src/cpm/ccp.asm:324-325`), and the warm boot
enters the CCP at `CCPENT`, where `STBOOT` returns at once. The loop then
reaches `STLINE` with `STPOS` where the last line left it. A `^C` that ends a
program is a warm boot too, so it leaves the file's position alone. Chapter 24
describes what `CHPOS` does for a line's pieces.

## The path of a display line

The CCP separates a service from a program by the three type bytes in `CMDFCB`.
`SVC` calls `SVCGO`, and any other type goes on to `CMDCOM` and the search for a
`.COM` file (`src/cpm/ccp.asm:281-298`). The search looks on the drive the
command names, or the current drive, in the current user and then in that
drive's user 0. Then, for a plain name only and only when the current drive
isn't A:, it looks on A: in the current user and then in A:'s user 0
(`src/cpm/ccp.asm:304-316`, `src/cpm/ccp.asm:383-410`,
`test/search.test.mjs:72-113`). That is what becomes of an old card's `PICO.DRV`:
no `PICO.COM` is found on drive A, the current drive at startup, and the line
fails.
`SVCGO` reads the file with `LOADCOM` and installs it with `SVCLOAD`, and a
failure of either returns carry to the CCP (`src/loader.asm:532-537`,
`src/cpm/ccp.asm:288-289`). Chapter 20 describes the loader and the relocation,
and Appendix H the file.

Only the GLCD has a display line. The PICO9918's console is the ROM's, started
at cold boot when the PICO9918 and the matrix keyboard answer, so no line in the
file loads it (`src/video.asm:8-10`, `src/pico.asm:27-47`).

`GLCD.SVC`'s load fails from inside, in the driver's own `INIT`. It asks first
for the ROM's font with service `FONT`, 15, a number past the table on a ROM
before ABI 5.1 (`drivers/glcd.asm:38-41`). It then calls `GLCWAIT`, and a
controller that doesn't answer returns `TNENODV` with carry
(`drivers/glcd.asm:42-45`). Last, it passes its table to the numbered service
`DRVR`, 12, with the console mode in `B`, 3 for `UC1:`
(`drivers/glcd.asm:46-50`). `SVDRV` refuses any other mode with `TNEBAD` and
carry, nothing changed, and that includes 1 for `CRT:`, whose table is the
ROM's own. In a line from the file while the IOBYTE's `CON:` field is `CRT:`
it refuses the table with `TNENODV`, as for an absent device
(`src/services.asm:368-380`). Otherwise it passes 3 to `VIDHOOK`, which returns
carry if `CDMTX` is clear or if `UC1:`'s slot already holds a table, and `SVDRV`
then returns `TNEBAD` with carry (`src/services.asm:381-386`,
`src/video.asm:86-95`). So the driver needs
the matrix keyboard, and a second load of `GLCD.SVC` fails while the first is
in. An old card's `PICO.SVC` asks for `CRT:` and fails at the same refusal,
with nothing left (`test/ks39.test.mjs:124-135`).

After a good load `SVCGO` compares `SVCHEAD`, the new service's page, with the
page of `GLCD.SVC`'s table in `GLVEC` (`src/loader.asm:538-541`). No match means
some other service, and the console stays. A match sets `CDGLC`
(`src/loader.asm:542-543`). If `CRT:`, the ROM's PICO9918 console, is the mode
in effect, the GLCD gives way: `SVCGO` goes to `WRDCLR` alone, and the console
stays where it is, with `GLCD.SVC` in for a later `CON UC1`
(`src/loader.asm:544-547`, `test/pico.test.mjs:579-586`). A `GLCD.SVC` line from the
file doesn't get that far on such a board, because `SVDRV` has refused its table,
so the starter card's `GLCD.SVC` line leaves nothing in memory there
(`test/pico.test.mjs:92-108`). The give-way follows a `GLCD.SVC` typed at the
prompt. An `UNLOAD` of a `GLCD.SVC` that gave way drops `UC1:`'s table and
leaves `CRT:` and its screen as they were, since `VIDHOFF` resets the console
mode only when the mode it drops is the one in effect
(`src/video.asm:103-118`). Otherwise `CONSET` clears
the LCD's word and passes `CMUC1` to `CONSW`, which moves the console and
writes the mode it takes into the console field of the IOBYTE
(`src/loader.asm:548-550`, `src/console.asm:53-55`). `CMDCON` writes the field
before it calls `GLCLD`, and `GLCLD` returns at once if `CDGLC` is set
(`src/cpm/ccpcmd.asm:115-119`, `src/loader.asm:512-514`). So `CON UC1` on a
board where the GLCD gave way loads nothing, and the console moves at the next
console call, as `CONSEL` finds the field changed (`src/console.asm:56-65`).

## The quiet rule

Each line the CCP takes carries a mark of where it came from. After the call of
`STLINE`, `CCF` and `SBC A,A` turn its carry into `FFh` for a line from the
file and 0 for a line from the keyboard, and the result goes in `STFLAG`, at
`BF62h` (`src/cpm/ccp.asm:100-103`, `src/ram.asm:268`). A chained piece is taken
before `STLINE` is called, so it keeps the mark of the line it came from
(`src/cpm/ccp.asm:97-98`).

The mark matters at one place, a service's failed load. `SVCLOAD` keeps the
`A` that `INIT` returned in `SVCRA`, beside `SVCRC`, which says why the load
failed (`src/loader.asm:243-246`, `src/ram.asm:266-267`). A record refused
after a good `INIT` sets `SVCRA` to 0, so that failure is never taken for an
absent device (`src/loader.asm:289-291`, `test/startup.test.mjs:107-122`).
The CCP reads the two
bytes as one word, `SVCRC` in `L` and `SVCRA` in `H`, and combines them with the
mark (`src/cpm/ccp.asm:290-296`). `AND H` keeps `INIT`'s status only for a line
from the file. `XOR TNENODV` makes the result zero only for status 2, the device
absent, and `DEC L` and `OR L` keep it zero only for `SVCRC` 1, an `INIT` that
failed with nothing left behind. A zero result goes to `SVCOK` and the next
prompt, with no message. Any other goes to `BADCMD`, which prints the name with
a question mark.

So a line `GLCD.SVC` in the file says nothing on a board with no GLCD, where
`INIT` finds no controller. Typed at the prompt, the same line gives
`GLCD.SVC?`. A missing or damaged file fails before `INIT` runs, with `SVCRC`
0, and a board with no matrix keyboard fails at `TNDRVR` with `TNEBAD`, so both
print the name from the file too (`test/startup.test.mjs:60-69`,
`test/startup.test.mjs:94-105`).

A width line follows the same rule. `CON PICO` or `CON CRT` with a width finds
the ROM's PICO9918 console with `FIND` before it passes the width. With no such
console, as on a serial board, a line from the file goes to `STARTED` with no
message and the code still 0, and the same line typed prints the width with a
question mark (`src/cpm/ccpcmd.asm:95-103`, `test/startup.test.mjs:82-93`).

`BADCMD` stores the failure code `RCFAIL` in `PRGCODE`, and a piece that starts
with `:` runs only when the code shows no failure (`src/cpm/ccp.asm:143-155`,
`src/cpm/ccp.asm:374-378`). The quiet path leaves the 0 that `MLTAKE` wrote
there before the command (`src/cpm/ccp.asm:175-177`), so a `:` line after a
quiet `GLCD.SVC` runs, and after a `GLCD.SVC?` it goes. Chapter 24 describes
the code and the `:`.

## The LCD's words

Two words go to the LCD's row 3 through `LCD3`, which is `LCDROW` with `B` at 3
(`src/lcd.asm:43-45`). `LCDROW` selects the row, writes up to the zero and
returns with carry set, so a routine reporting a failure can end with a jump to
it (`src/lcd.asm:47-68`). The strings are in `src/text.asm:10` and
`src/text.asm:64-66`. Each word has five characters, and `PICCLR`, five blanks
and a zero, wipes either of them.

`GLCD?` goes through `LCDWRD`, which sets `CDWRD` first (`src/lcd.asm:38-41`).
It comes from `GLCLD`, the path of `CON UC1`, when `SVCGO` returns carry
(`src/loader.asm:512-525`). `GLCLD` first puts the mode from `CONMOD` back in
the console field through `CONFLD`, since the console hasn't moved
(`src/loader.asm:521-523`, `src/console.asm:355-359`). `GLCLD` returns with
`GLCD.SVC` already in at `src/loader.asm:514`, so that case writes nothing.

`CDWRD` is bit 7 of `CONDEV`, the byte at `BFE7h`, at the workspace's end, that
records the console devices (`src/ram.asm:278`, `src/layout.asm:41-46`):

| Bit | Name | Meaning |
| --- | --- | --- |
| 0 | `CDMTX` | The Matrix switch is on, so the matrix keyboard is read |
| 1 | `CDTMS` | The PICO9918 answered at cold boot |
| 2 | `CDGLC` | `GLCD.SVC` is in |
| 3 | `CDRTC` | The DS1302 clock answered at cold boot |
| 7 | `CDWRD` | One of the ROM's words is on the LCD's row 3 |

A take of the console clears a word from the LCD, but by then the row may be a
program's, and `CDWRD` separates the two cases. `WRDCLR` writes the blanks only
if the bit is set, and clears the bit (`src/loader.asm:555-564`). `CONSET` calls
it, so any take of the console clears a word (`src/loader.asm:548`), and
`GLCD.SVC` giving way to the ROM's console clears one too
(`src/loader.asm:544-547`). Hardware service `LCD` clears the bit, with no write
of blanks, when a program writes row 3 (`src/services.asm:92-96`), so the row is
then the program's and a later take leaves it alone
(`test/pico.test.mjs:559-564`). `DEMO`, whose source is
`test/programs/demo.asm`, writes its row 3 through that service. A program that
writes the LCD's port goes round this test. The bit then stays set, and a later
take writes its five blanks over the start of the program's row.

`CARD?` takes the other route. `DIAG` writes it with `LCD3`, with no `CDWRD`
(`src/boot.asm:472-473`), since no take can happen at the diagnostic prompt. `R`
jumps to `COLDRT`, where `LCDINIT` clears the whole display
(`src/boot.asm:487-488`, `src/boot.asm:63-64`), and a retry that fails writes the
word again. `CONDEV` itself starts each cold boot at 0, with `CDMTX` then read
from the port, so no reset begins with `CDWRD` set (`src/console.asm:36`,
`src/console.asm:48-50`).

## The web page's rewrite

The web page sets the display and the width from its "Display" and "ROM"
controls, and it keeps the first line of the card's startup file in step with
them. `powerOn` queues the preparation, `powerOnNow`, to take its turn with any
copy of files onto the card, as Chapter 25 describes (`web/src/main.mjs:67-80`).
At each power-on `powerOnNow` passes the card, the display and the width to
`prepareCard` (`web/src/main.mjs:82-84`). The PICO9918's console is the ROM's,
so the page writes no driver. A width other than 80 goes in a `CON PICO` line
(`host/card.mjs:1-4`).

`prepareCard` makes its change on a copy of the image, and the copy goes over
the card only once the change is made (`host/card.mjs:58-66`). It opens drive A
read-only when the card's descriptor says so, and it looks only at user 0's
files, the ones the ROM loads (`host/card.mjs:18-24`). A change it can't make,
to a read-only drive A or in a full directory, throws, and the card stays as it
was. The serial terminal then shows `This card couldn't be prepared for the
page`, the reason in parentheses and `so it boots as it is.`
(`host/card.mjs:67-72`). The write over a `STARTUP.CMD` with the read-only
attribute is refused in the same way, and the page doesn't force it, so a
change to the file's first line leaves the card as it was and the terminal shows
`This card's STARTUP.CMD is read-only, so the page can't set its display line;
it boots as it is` (`host/card.mjs:68-70`, `tools/lib/cpmfs.mjs:186-191`).

`cardProblem` finds first whether the card can show the display chosen. A card
with no drive A has a problem of its own. With a drive A, the PICO9918 needs no
file, and the GLCD needs `GLCD.SVC` in user 0 in the format this ROM loads
(`host/card.mjs:26-50`). A card with no such file but with a `.DRV` display file
gets a message of its own, and the test for it reads the directory only
(`host/card.mjs:16`, `host/card.mjs:41-44`). The message names the chosen
display's `.DRV` file if the card has it, and otherwise the first `.DRV` display
file in the directory. A card with a problem has nothing written, its startup
file included (`host/card.mjs:63-65`).

Otherwise `setDisplayLine` reads the file up to its `^Z` and splits it into
lines. `withoutDisplay` splits each line at `!`, drops every display piece and
joins the rest (`host/card.mjs:11-15`, `host/card.mjs:81-102`). A display piece is
one of the display drivers' names, `PICO.SVC`, `PICO40.SVC`, `PICO32.SVC` and
`GLCD.SVC`, under either type, `.SVC` or `.DRV`. A width line, `CON PICO` or
`CON CRT` with a width after it, is a display piece too. Either may have a
leading `:`. A width
line of the card's own goes too, since it would run after the page's and
override the width chosen (`test/pico.test.mjs:700-712`). A dropped piece passes
its own `:` to the piece after it on its line, so `DIR!:GLCD.SVC!MOUNT` becomes
`DIR!:MOUNT`. A `:` first on the next line stays if the dropped piece had its
own, so the lines `DIR`, `:GLCD.SVC` and `:MOUNT` become `DIR` and `:MOUNT`.
Otherwise a `:` that waited on a dropped piece goes, on its line or first on the
next, since it must not wait on what now comes before it. The line
`GLCD.SVC!:MOUNT` becomes `MOUNT`, an ordinary line that runs after the
display's line whatever that line did (`test/pico.test.mjs:773-784`). Lines left
blank are dropped.

The new file is the chosen display's line, then the remaining lines, and
nothing is written if that equals the old text (`host/card.mjs:104-117`). For
the GLCD the line is `GLCD.SVC`. For the PICO9918 it is `CON PICO 40` or `CON
PICO 32`, and at 80 columns there is none, since the ROM's console starts at 80
(`host/card.mjs:112`). The file has no line for the other display. On the page's
board with the PICO9918, which has the GLCD as well, a `GLCD.SVC` line would pass
over quietly and load nothing, and `CON UC1` loads `GLCD.SVC` itself when it is wanted
(`src/cpm/ccpcmd.asm:117-119`).

A card that passes `cardProblem` has its startup file rewritten to that form
whatever it held. The starter card's `STARTUP.CMD`, `GLCD.SVC` alone, stays as
it is for the GLCD, and for the PICO9918 it holds a `CON PICO` line, or nothing
but its `^Z` at 80 columns (`test/pico.test.mjs:832-844`). A card whose startup
file has to stay as it is is best copied to the PC before the page opens it.
