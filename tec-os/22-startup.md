---
title: Startup
parent: TEC-OS
nav_order: 22
nav_group: "Part II: Inside TEC-OS"
---

# 22. Startup

Checked against TEC-OS 19ad916.

Chapter 5 describes the startup file, the display lines and the LCD's words as
you use them. Behind them are one byte of state, a 128-byte buffer and three
routines in `src/svc.asm`: `STBOOT` reads the file, `STLINE` gives the CCP one
line at a time, and `STDONE` runs once when the lines are finished. This chapter
describes them in that order, then the path a display line takes, the flag bit
behind the LCD's words and the web page's rewrite of the file.
`test/startup.test.mjs` and `test/pico.test.mjs` check these rules on the host
model of Chapter 26.

## One byte of state

Startup has to hold its place in the file across every program the file runs,
and to start again after a reset. All of its state is `STPOS`, at `BF64h`, with
the file's record after it in `STREC`, at `BF65h–BFE4h` (`src/ram.asm:237-238`).
The byte holds four kinds of value (`src/svc.asm:389-392`):

| `STPOS` | Meaning |
| --- | --- |
| `00h` | `STBOOT` hasn't run since cold boot |
| `01h–7Fh` | A record holds lines: the next byte's offset in `STREC`, plus 1 |
| `80h`, `81h` | Finished, and `STDONE` hasn't run; `81h` after a CR or LF in the record's last byte |
| `FFh` | Finished, and `STDONE` has run |

The byte's place in memory separates an ordinary exit from a reset. The block
that holds it starts above the RAM BIOS table (`src/ram.asm:192`), past
`BDOSRME`, the end of the range `CPMINIT` clears (`src/boot.asm:254-258`,
`src/ram.asm:190`). An ordinary exit is a warm boot, which calls `CPMINIT` and
never comes to `COLD` (`src/boot.asm:4-7`, `src/boot.asm:64-81`), so `STPOS` and
`STREC` keep their values through every program in the file.

Both kinds of reset enter at `COLD`, and a recognised reset differs from an
unrecognised one only in what `RSLCAP` copies to `RSLBUF` before the clear, the
drive table (`src/boot.asm:14`, `src/boot.asm:130-137`). Cold boot then clears
the whole workspace, `STPOS` included (`src/boot.asm:23-27`,
`src/ram.asm:240-241`). A retry from the diagnostic prompt returns to `COLDRT`,
after that clear, with `STPOS` still 0, because the CCP hasn't run yet
(`src/boot.asm:37-39`, `src/diag.asm:22-23`).

## STBOOT

Every entry to the CCP sets the user number and then calls `STBOOT`
(`src/cpm/ccp.asm:54-60`). Cold boot sets the drive and user byte to 0 and then
runs on into warm boot, which passes that byte to the CCP (`src/boot.asm:56-59`,
`src/boot.asm:79-81`), so at the first call the user area is 0. `STBOOT` returns
at once if `STPOS` isn't 0 (`src/svc.asm:393-396`), which is the case at every
other entry.

A BDOS error during the read ends in a warm boot, so `STBOOT` marks the file
finished before it touches the card. Its next instruction sets bit 7, making
`STPOS` `80h`, before any part of the read (`src/svc.asm:397`). After a failure
the next call of `STBOOT` returns at the same test, so an unreadable file can't
repeat. `test/startup.test.mjs:172-192` makes the card fail at the file's block
and reaches a prompt with nothing from the file run.

The keypad test comes next, and it gives a way past a file that keeps the board
from reaching a prompt (`src/svc.asm:398-400`). `test/startup.test.mjs:46-58`
holds a key through reset to get past a service whose `INIT` never returns, and
`:194-207` does the same for a file that resets the board at every boot.
`STSPORT` is port `03h` (`src/layout.asm:11`), and bit 6 is low while a keypad
key is down, as Appendix G describes. A low bit returns from `STBOOT` with
`STPOS` at `80h`, so a skip is the same state as a file that wasn't there. Bit 6
is tested this one time, so the key has to be down when `STBOOT` starts, which
on the model, with the web page's board and the starter card, is 5,864,134
T-states after reset, about 1.47 seconds.

`STBOOT` then makes the read in the CCP's own FCB. It copies 12 bytes of
`STFCB`, a drive byte of 1 and the name `STARTUP CMD`, to `CMDFCB`
(`src/svc.asm:401-404`, `src/data3.asm:109`), and cold boot's clear has left the
rest of `CMDFCB` zero. Drive byte 1 is drive A whichever drive is current, and
`RESEL` has already put back a recognised reset's selection (`src/boot.asm:47`),
so the file comes from the volume on drive A at that moment, as Chapter 5's
`SPARE` example shows. Three BDOS calls follow (`src/svc.asm:405-417`):

- function 26 points the DMA address at `STREC`;
- function 15 opens the file, and `INC A` turns its `FFh` for no file into zero;
- function 20 reads the first record, and any result but 0 means an empty file
  or an error.

After a good read `A` is 0, and `INC A` stores `STPOS` as 1, the file's first
byte (`src/svc.asm:418-419`). Each failure jumps past that store and leaves
`80h`. `test/startup.test.mjs:97-106` writes a line into `STREC` before a read
that returns an error, and the line doesn't run. All three outcomes meet at
`STBDMA`, which writes `DEFDMA` straight to `CURDMA` (`src/svc.asm:420-422`), so
a program started by the first line finds the DMA address at `0080h`, with or
without a file (`test/startup.test.mjs:89-95`).

There is no second read and no close. The record stays in the workspace for
every later line, so a `USER` or a drive change in the file has no effect on
reading the lines after it. The workspace holds one record, which sets the
file's limit at 128 bytes.

## STLINE

The CCP takes one line for each prompt. `MLREAD` prints the prompt and then goes
to a chained line's next piece, to `STLINE` and to the keyboard, in that order
(`src/cpm/ccp.asm:74-89`). `STLINE` returns with carry clear when it has put a
line in the command buffer, and the CCP goes straight to `MLGOT`. With carry set
the CCP sets `HFLAG` and reads the keyboard with function 10. `HFLAG` is set on
that path alone, and function 10 stores a line in the history only if it is set
(`src/cpm/bdos.asm:400-404`), so startup lines are not in the history.

`STLINE` starts by rotating `STPOS` left, which moves the finished bit to carry
and sends a finished file to `STDONE`. Otherwise it rotates the position back
and adds it to `STREC`'s low byte (`src/svc.asm:430-437`). The record lies within
one page, `BFxxh`, so the sum needs no high byte. `DE` is `CMDTXT`, and `B`
counts down from 127, the characters a line may hold (`src/svc.asm:438-439`).

The loop tests the record's end before each read, and then reads a byte and
tests it for 0, `^Z`, CR and LF (`src/svc.asm:440-452`). Any other byte is a
character. The characters past the 127th are read and dropped, by the test of
`B` at `src/svc.asm:453-455`, so the scan still reaches the line's real end and
the next line starts in the right place.

The loop has two ways out. A CR or LF jumps to `STL2` with `HL` past it, and the
record's end, a zero or `^Z` jumps to `STLE`, which first sets `L` to the
record's last byte, `STLAST` (`src/svc.asm:26`, `src/svc.asm:460`). `STL2` then
computes the next byte's offset plus 1 from `L` and stores it
(`src/svc.asm:461-463`).

From `STLE` that sum is exactly `80h`, finished. Any characters already in
`CMDTXT` still run as a line, so a line cut off by the record's end runs as far
as it goes. The same value comes out of a CR or LF that leaves the next byte at
offset 127. A line starting at the 128th byte therefore never runs, because its
position would be `80h`. A CR or LF in the record's last byte leaves `HL` one
past the record, and `STL2` stores `81h`, also finished
(`src/svc.asm:461-463`). A test fills the record to its last byte with a line at
the end, and that line runs (`test/startup.test.mjs:74-79`).

If no character was copied the line was blank, and `STLINE` goes round again
(`src/svc.asm:464-466`). A CR and LF therefore take two passes, the CR ending
the line and the LF being a blank line. The starter card's file has 21 bytes,
`PICO.SVC`, `GLCD.SVC` and `^Z` with a CR and LF after each name:

| Call | `STPOS` on entry | Bytes read | `STPOS` after | Result |
| --- | --- | --- | --- | --- |
| First | 1 | offsets 0–8 | 10 | `PICO.SVC`, length 8 |
| Second | 10 | offset 9, the LF | 11 | Blank: goes round |
| | 11 | offsets 10–18 | 20 | `GLCD.SVC`, length 8 |
| Third | 20 | offset 19, the LF | 21 | Blank: goes round |
| | 21 | offset 20, `^Z` | `80h` | Blank: goes round |
| | `80h` | | | `STDONE` |

With a line in hand, `STLINE` stores its length in `CMDLEN`, writes CR and `$`
after it and prints the line from `CMDTXT` through `PUTSTR`, which is BDOS
function 9 (`src/svc.asm:467-473`, `src/cpm/ccp.asm:1550-1552`). Function 9 ends
at the first `$`, so a `$` in the line ends the echo there, but the characters
in `CMDTXT` aren't changed and the line runs whole. The CCP's own `CRLFMSG` at
`NOTDRIVE` ends the echo's row whether or not the CR was reached
(`src/cpm/ccp.asm:227-229`), so the output after a cut echo starts on a new row,
as Chapter 5's transcript shows.

The `$` needs one more byte than the buffer. `CMDTXT` is 128 bytes and is
followed at once by `BOOTDRV` (`src/ram.asm:79-83`), so a line of 127 characters
puts its CR in the last byte of `CMDTXT`, at `BDB4h`, and its `$` at `BDB5h`, in
`BOOTDRV`. The order in `CCPENT` makes this harmless. `BOOTDRV` has one reader,
at `src/cpm/ccp.asm:61`, and the CCP's entry writes the byte before that
(`src/cpm/ccp.asm:44`), so the `$` is rewritten before it is read.

`MLGOT` treats a startup line and a typed one alike from there. It writes a 0
over the CR, sets `CHPOS` to 1 and takes the first piece
(`src/cpm/ccp.asm:93-103`). `MLTAKE` turns the piece's letters to capitals in
place, after the echo (`src/cpm/ccp.asm:145-150`), which is why the echo keeps a
line's small letters. `test/startup.test.mjs:153-170` compares each line run
from the file with the same line typed, in its output and its BDOS calls, apart
from that difference of letter case.

The next line comes by whatever route the CCP takes back to `MLREAD`. A built-in
or a failed command jumps to `STARTED` or `MAINLOOP` (`src/cpm/ccp.asm:68-74`,
`src/cpm/ccp.asm:276`, `src/cpm/ccp.asm:1153`). A program returns to the `WBOOT`
address that `CMDRUN` pushed (`src/cpm/ccp.asm:300-301`), and the warm boot
enters the CCP at `CCPENT`, where `STBOOT` returns at once. The loop then
reaches `STLINE` with `STPOS` where the last line left it. A `^C` that ends a
program is a warm boot too, so it leaves the file's position alone. Chapter 25
describes what `CHPOS` does for a line's pieces.

## STDONE

A board with a PICO9918 and a matrix keyboard but no display driver in reaches
its first keyboard prompt with a dark screen, and it may have no serial
terminal. `STDONE` writes `PICO?` on the LCD for that board. `STLINE` jumps to
it at every prompt once the file has finished, with carry set and `A` holding
`STPOS` rotated left: `01h` for `80h`, `03h` for `81h` and `FFh` for `FFh`.
`INC A` leaves carry alone and gives zero only for `FFh`, so every prompt after
the first returns at once with carry set, for the keyboard
(`src/svc.asm:482-483`). The first one stores `FFh` and tests the board
(`src/svc.asm:484`).

The test is a piece of arithmetic on `CONDEV`, the byte at `0045h` that records
the console devices (`src/layout.asm:37`, `src/layout.asm:49-54`):

| Bit | Name | Meaning |
| --- | --- | --- |
| 0 | `CDMTX` | The Matrix switch is on, so the matrix keyboard is read |
| 1 | `CDTMS` | The PICO9918 answered at cold boot |
| 2 | `CDGLC` | `GLCD.SVC` is in |
| 7 | `CDWRD` | One of the ROM's words is on the LCD's row 3 |

`STDONE` masks off `CDWRD`, because `GLCD?` may already be there from a failed
`CON UC1` in the file, and subtracts `CDMTX+CDTMS` (`src/svc.asm:485-487`). The
result is zero only on a board with a PICO9918 and a matrix keyboard where
`GLCD.SVC` isn't in. `OR` with the high byte of `PIVEC`, `PICO.SVC`'s table,
comes next, and the result stays zero only if no PICO9918 driver is in either,
since a table in RAM is at `0100h` or above (`src/svc.asm:488-489`,
`src/ram.asm:217`). `SCF` sets carry for the return, and any non-zero result
leaves (`src/svc.asm:490-491`). A zero result writes `PICO?` with `LCDWRD`,
which also returns carry set (`src/svc.asm:492-493`, `src/lcd.asm:45-46`).

That one test gives the cases Chapter 5 lists. No `STARTUP.CMD`, an empty one, a
driver's file missing or bad with no other driver in, and a skip all arrive with
nothing in `PIVEC` and `CDGLC` clear. A bad `PICO.SVC` followed by a good
`GLCD.SVC` sets `CDGLC`, and a good load followed by `CON TTY` leaves the table
in `PIVEC`, so neither shows a word. A board with no matrix keyboard has `CDMTX`
clear and can't reach zero. The test runs at this one prompt, and nothing later
writes `PICO?`.

## The path of a display line

The CCP separates a service from a program by the three type bytes in `CMDFCB`.
`SVC` calls `SVCGO`, and any other type goes on to `CMDCOM` and the search for a
`.COM` file, which is what becomes of an old card's `PICO.DRV` (`src/cpm/ccp.asm:267-277`).
`SVCGO` reads the file with `LOADCOM` and installs it with `SVCLOAD`, and a
failure of either returns carry to `BADCMD` for the name and question mark
(`src/glcd.asm:79-82`, `src/cpm/ccp.asm:274-275`). Chapter 21 describes the file
and its relocation, and Chapter 20 the loader.

A display driver's load fails from inside, in the driver's own `INIT`.
`PICO.SVC`'s `INIT` calls hardware service `INFO` for whether a PICO9918
answered at cold boot (`drivers/pico.asm:47-51`). Each driver then passes its
table to `GLHOOK` through `ABIGLCD` (`drivers/pico.asm:52-56`,
`drivers/glcd.asm:46-50`), and `GLHOOK` returns carry if `CDMTX` is clear or if
that slot already holds a table (`src/glcd.asm:25-34`). So a driver needs the
matrix keyboard, and a second load of `PICO.SVC` fails while the first is in.

`GLCD.SVC` has two more tests, both ahead of those. If the console field of the
IOBYTE is 3, `UC1:`, it goes on. Otherwise it reads the byte that `ABIVID`
points at, the console's columns, and it fails if that byte isn't 0, which is
the case while any display is the console (`drivers/glcd.asm:33-42`,
`src/abi.asm:10`). `CMDCON` writes the field before it calls `GLCLD`
(`src/cpm/ccp.asm:1134-1137`), so `CON UC1` reaches the load with the field
already 3, and a startup line `GLCD.SVC` under a PICO9918 console doesn't.
`GLCD.SVC` then calls `GLCWAIT`, and a controller that doesn't answer fails the
load (`drivers/glcd.asm:43-45`), as `INFO`'s answer does for `PICO.SVC`.

After a good load `SVCGO` compares `SVCHEAD`, the new service's page, with the
page of each display's table (`src/glcd.asm:83-90`). A match with `PIVEC`
selects `CMCRT` and goes to `CONSET`. No match with `GLVEC` means some other
service, and the console stays. A match with `GLVEC` sets `CDGLC`, and then only
if `PIVEC` is empty does it select `CMUC1` and go to `CONSET`
(`src/glcd.asm:91-96`). `CONSET` writes the mode into the console field of the
IOBYTE and sets `CONACT` to `FFh` so that the field counts as changed, and it
then jumps to `CONSEL`, which moves the console (`src/glcd.asm:97-101`,
`src/console.asm:48-59`).

## The LCD's words

All three words go to the LCD's row 3 through `LCD3`, which is `LCDROW` with `B`
at 3 (`src/lcd.asm:41-43`). `LCDROW` selects the row, writes up to the zero and
returns with carry set, so a routine reporting a failure can end with a jump to
it (`src/lcd.asm:45-66`). The strings are in `src/data3.asm:105-108`. `PICMSG`
has no zero of its own and runs on into `PICCLR`, five blanks and a zero, so
`PICO?` also blanks the five columns after it, and `PICCLR` alone wipes any of
the words, all three having five characters.

`PICO?` and `GLCD?` go through `LCDWRD`, which sets `CDWRD` first
(`src/lcd.asm:36-39`). `GLCD?` comes from `GLCLD`, the path of `CON UC1`, when
`SVCGO` returns carry (`src/glcd.asm:61-74`). It first puts the mode from
`CONMOD` back in the console field through `CONFLD`, since the console hasn't
moved (`src/glcd.asm:70-72`, `src/glcd.asm:104-108`). `GLCLD` returns with
`GLCD.SVC` already in at `src/glcd.asm:63`, so that case writes nothing.

A take of the console clears a word from the LCD, but by then the row may be a
program's, and `CDWRD` separates the two cases. `WRDCLR` writes the blanks only
if the bit is set, and clears the bit (`src/glcd.asm:113-122`). `CONSET` calls
it, so any take of the console clears a word (`src/glcd.asm:97`), and `GLCD.SVC`
loading under `PICO.SVC`, which keeps the console, clears one too
(`src/glcd.asm:95`). Hardware service `LCD` clears the bit, with no write of
blanks, when a program writes row 3 (`src/hwsvc.asm:79-83`), so the row is
then the program's and a later take leaves it alone. `DEMO`, whose source is
`test/programs/demo.asm`, writes its row 3 this way, and `test/pico.test.mjs:562`
and `:571` check it for both words. A
program that writes the LCD's port goes round this test. The bit then stays set,
and a later take writes its five blanks over the start of the program's row.

`CARD?` takes the other route. `DIAG` writes it with `LCD3`, with no `CDWRD`
(`src/diag.asm:7-8`), since no take can happen at the diagnostic prompt. `R`
jumps to `COLDRT`, where `LCDINIT` clears the whole display
(`src/diag.asm:22-23`, `src/boot.asm:37-39`), and a retry that fails writes the
word again. `CONDEV` itself starts each cold boot at 0, with `CDMTX` then read
from the port, so no reset begins with `CDWRD` set (`src/console.asm:30`,
`src/console.asm:42-44`).

## The web page's rewrite

The web page sets the display and the width from its "Display" and "ROM"
controls, and it keeps the card's `PICO.SVC` and first lines in step with them.
At each power-on with the PICO9918, `powerOn` fetches the page's recipe and
passes it to `widthDrivers` (`web/src/main.mjs:66-72`). The recipe's `widths`
names three of the page's files, `PICO.SVC`, `PICO40.SVC` and `PICO32.SVC`, and
`widthDrivers` fetches each and checks it against the SHA-256 there
(`host/card.mjs:82-96`). If one can't be fetched or doesn't match, `prepareCard`
gets no drivers and the page reports that the drivers couldn't be fetched.
Otherwise `prepareCard` writes the driver at the chosen width to drive A as
`PICO.SVC` when the card has none, has one of the three pinned builds at any
width or has one of another format. It compares the build's bytes and the file's length in whole records with
each build (`host/card.mjs:47`). Any other `PICO.SVC` is the card
owner's build, so it stays, and the note `This card's own PICO.SVC is kept, at
the width it was built for.` goes to the serial terminal. `prepareCard` writes
nothing to a card with no drive A or with an older TEC-OS's `.DRV` files
(`host/card.mjs:56-71`). It then leaves the startup file alone if `cardProblem`
finds drive A missing, the display's file missing or that file in another
format, and otherwise calls `setDisplayLine` (`host/card.mjs:25-44`,
`host/card.mjs:72`). A card with no such file but with a `.DRV` display file
gets a message of its own, and the test for it reads the directory only
(`host/card.mjs:13`, `host/card.mjs:35-38`). The message names the chosen
display's `.DRV` file if the card has it, and otherwise the first `.DRV` display
file in the directory.

`setDisplayLine` reads the file up to its `^Z` and splits it into lines.
`withoutDisplay` splits each line at `!`, drops every piece that is a display
driver's name under either type, with or without a leading `:`, and joins the
rest (`host/card.mjs:12`, `host/card.mjs:104-125`). A dropped piece passes its
own `:` to the piece after it on its line, so `DIR!:PICO.SVC!MOUNT` becomes
`DIR!:MOUNT`. A `:` first on the next line stays if the dropped piece had its
own, so the lines `DIR`, `:PICO.SVC` and `:MOUNT` become `DIR` and `:MOUNT`.
Otherwise a `:` that waited on a dropped piece goes, on its line or
first on the next, since it must not wait on what now comes before it. The line
`PICO.SVC!:MOUNT` becomes `MOUNT`, an ordinary line that runs after the
display's line whatever that line did (`test/pico.test.mjs:829-841`). Lines left
blank are dropped. The new file is the chosen display's file, then the
remaining lines, and nothing is written if that equals the old text
(`host/card.mjs:127-139`). The file has no line for the other display. On the
page's board, which has both, a `GLCD.SVC` line after `PICO.SVC` would only give
way and print `GLCD.SVC?`, and `CON UC1` loads `GLCD.SVC` itself when it is
wanted (`src/cpm/ccp.asm:1135-1137`).

The preparation can change or stop on a card that its messages say it leaves
alone. A failed fetch gives the message that the card is left as it is
(`host/card.mjs:94`). `setDisplayLine` still runs on a card that passes
`cardProblem`, though, so the starter card's `STARTUP.CMD` loses its `GLCD.SVC`
line (`host/card.mjs:60-72`). `driveA` opens drive A for writing
whatever its descriptor says, so a read-only drive A gets the page's
`PICO.SVC` and `STARTUP.CMD` all the same (`host/card.mjs:15-19`). `cardProblem`
looks for the display's file in every user area and then reads it from user 0,
so a card whose only `PICO.SVC` is in user 1 makes the read throw
(`host/card.mjs:35`, `host/card.mjs:41`). A `STARTUP.CMD` or `PICO.SVC` that
must be made new in a full directory throws too. A throw stops the power-on
before the machine is made, and its message reaches only the browser's console
(`web/src/main.mjs:72-75`). A card you need is best copied to the PC before the
page opens it. A card that stops the power-on can still be saved with "Download
image" and mended with `tecvol`.
