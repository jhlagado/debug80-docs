---
title: Startup
parent: TEC-OS
nav_order: 25
nav_group: "Part II: Inside TEC-OS"
---

# 25. Startup

<!-- Checked against TEC-OS 78127ec. -->

The startup file runs a line at a time, across every program it starts, from
one byte of state and one record in the workspace. Two routines in
`src/cpm/ccpcmd.asm` do the work. `STBOOT` reads the record once after cold
boot, and `STLINE` gives the CCP one line from it at each prompt. What a
display line does rests on the loader of Chapter 24 and the console of
Chapter 16. Whether a failed line says so rests on a mark the CCP keeps for
each line.

## One record of state

Startup has to hold its place in the file across every program the file runs,
and start again after a reset. Its state is `STPOS`, one byte at `BF63h`. The
file's record follows it in `STREC`, at `BF64h–BFE3h` (`src/ram.asm:270-271`).
The byte holds three kinds of value (`src/cpm/ccpcmd.asm:553-556`):

| `STPOS` | Meaning |
| --- | --- |
| `00h` | `STBOOT` hasn't run since cold boot |
| `01h–7Fh` | A record holds lines: the next byte's offset in `STREC`, plus 1 |
| `80h`, `81h` | Finished, `81h` after a CR or LF in the record's last byte |

The byte's place in memory separates an ordinary exit from a reset. `STPOS`
and `STREC` lie above the RAM BIOS table, past `BDOSRME`, where the range
`CPMINIT` clears at every warm boot ends (`src/ram.asm:216-218`,
`src/boot.asm:295-300`). An ordinary exit is a warm boot, which never comes to
`COLD` (`src/boot.asm:20-22`). The position and the record therefore survive
every program in the file. Both kinds of reset go on to `COLD`, and cold boot
clears the whole workspace, `STPOS` included (`src/boot.asm:37-41`). [Chapter
14](14-memory-map.md#the-workspace-and-what-clears-it) gives the two clears.

A retry from the diagnostic prompt returns to `COLDRT`, after that clear, with
`STPOS` still 0, because the CCP hasn't run yet (`src/boot.asm:63`,
`src/boot.asm:487-488`). The file runs after a retry as after any cold boot.

## Starting the file

Every entry to the CCP resets the disks, sets the user number and then calls
`STBOOT` (`src/cpm/ccp.asm:52-60`). Cold boot stores drive A and user 0 in
page zero and runs on into warm boot, which passes that byte to the CCP
(`src/boot.asm:81-83`, `src/boot.asm:109-111`). At the first call the user
area is therefore 0. `STBOOT` returns at once when `STPOS` isn't 0
(`src/cpm/ccpcmd.asm:557-560`), as it is at every later entry.

A BDOS error during the read ends in a warm boot, so `STBOOT` marks the file
finished before it touches the card. Its next instruction sets bit 7, making
`STPOS` `80h` (`src/cpm/ccpcmd.asm:561`). After a failure the next call returns
at the first test, so an unreadable file can't run twice. A test makes the card
fail at the file's block. The machine reaches a prompt with `Bad Sector`
printed and nothing from the file run (`test/startup.test.mjs:221-241`).

The keypad test comes next. It gives a way past a file that keeps the board
from reaching a prompt (`src/cpm/ccpcmd.asm:562-564`). `STSPORT` is port `03h`,
and bit 6 is low while a key of the hex keypad is down (`src/layout.asm:11`).
A low bit returns from `STBOOT` with `STPOS` at `80h`, the same state as a file
that wasn't there. The bit is read this once, so the key has to be down when
`STBOOT` starts. On the model, with the web page's board and the starter card,
that is 5,824,922 T-states after a reset, about 1.46 seconds.
One test holds a key through a reset to get past a service whose `INIT` never
returns. Another does the same for a file that resets the board at every boot
(`test/startup.test.mjs:46-58`, `test/startup.test.mjs:246-259`).

`STBOOT` then reads the file through the CCP's own FCB. It copies the 12 bytes
of `STFCB`, a drive byte of 1 and the name `STARTUP CMD`, to `CMDFCB`
(`src/cpm/ccpcmd.asm:565-568`, `src/tables.asm:93`). Cold boot's clear of the
workspace has left the rest of `CMDFCB` zero. Drive byte 1 is drive A
whichever drive is current. `RESEL` has already put back a recognised reset's
selection (`src/boot.asm:72`), so the file comes from the volume on drive A at
that moment, as [Chapter 6](06-startup-file.md)'s `SPARE` example shows. Three
BDOS calls follow (`src/cpm/ccpcmd.asm:569-579`). The
second and third go through `DOSSEQ`, which takes the function's number from
the byte after its `CALL` and points `DE` at `CMDFCB`
(`src/cpm/ccpfile.asm:655-664`):

- function 26 points the DMA address at `STREC`;
- function 15 opens the file, and `INC A` turns its `FFh` for no file into zero;
- function 20 reads the first record, and a result other than 0 reports an
  empty file or an error.

After a good read `A` is 0, and `INC A` stores `STPOS` as 1, the file's first
byte (`src/cpm/ccpcmd.asm:580-581`). Each failure jumps past that store and
leaves `80h`. All three outcomes meet at `STBDMA`, which writes `DEFDMA`
straight to `CURDMA` (`src/cpm/ccpcmd.asm:582-584`). A program started by the
first line therefore finds the DMA address at `0080h`, with or without a file.

There is no second read and no close. The record stays in the workspace for
every later line. A `USER` or a drive change in the file has no effect on the
lines after it, and one record sets the file's limit at 128 bytes.

## Taking a line

The CCP takes one line for each prompt. `MLREAD` prints the prompt and then
goes to a chained line's next piece, to `STLINE` and to the keyboard, in that
order (`src/cpm/ccp.asm:79-109`). `STLINE` returns with carry clear when it has
put a line in the command buffer, and the CCP goes straight to `MLGOT`. With
carry set the CCP sets `HFLAG` and reads the keyboard with function 10. `HFLAG`
is set on that path alone. Function 10 stores a line in the history only when
it is set (`src/cpm/bdos.asm:490-494`), so startup lines are never in the
history.

`STLINE` starts by rotating `STPOS` left, which moves the finished bit into
carry. A finished file returns at once with carry set
(`src/cpm/ccpcmd.asm:592-595`). Otherwise it rotates the position back and adds
it to `STREC`'s low byte (`src/cpm/ccpcmd.asm:596-599`). The record lies within
one page, `BFxxh`, so the sum needs no high byte. `DE` is `CMDTXT`, and `B`
counts down from 127, the characters a line may hold
(`src/cpm/ccpcmd.asm:600-601`).

The loop tests the record's end before each read. It then reads a byte and
tests it for 0, `^Z`, CR and LF (`src/cpm/ccpcmd.asm:602-614`). Any other byte
is a character. The characters past the 127th are read and dropped, by the
test of `B` at `src/cpm/ccpcmd.asm:615-617`. The scan still reaches the line's
real end, and the next line starts in the right place.

The loop has two ways out. A CR or LF jumps to `STL2` with `HL` past it. The
record's end, a zero or `^Z` jumps to `STLE`, which first sets `L` to the
record's last byte, `STLAST` (`src/loader.asm:34`, `src/cpm/ccpcmd.asm:622`).
`STL2` then computes the next byte's offset plus 1 from `L` and stores it
(`src/cpm/ccpcmd.asm:623-625`).

From `STLE` that sum is exactly `80h`, finished. Any characters already in
`CMDTXT` still run as a line, so a line cut off by the record's end runs as far
as it goes. The same value comes from a CR or LF that leaves the next byte at
offset 127. A line starting at the 128th byte therefore never runs. A CR or LF
in the record's last byte leaves `HL` one past the record, and `STL2` stores
`81h`, also finished. A test fills a record to its last byte with a line at
the end, and that line runs (`test/startup.test.mjs:123-128`).

If no character was copied the line was blank, and `STLINE` goes round again
(`src/cpm/ccpcmd.asm:626-628`). A CR and LF therefore take two passes, the CR
ending the line and the LF being a blank line. The starter card's file has 11
bytes, `GLCD.SVC`, a CR and LF and `^Z`:

| Call | `STPOS` on entry | Bytes read | `STPOS` after | Result |
| --- | --- | --- | --- | --- |
| First | 1 | offsets 0–8 | 10 | `GLCD.SVC`, length 8 |
| Second | 10 | offset 9, the LF | 11 | Blank: goes round |
| | 11 | offset 10, `^Z` | `80h` | Blank: goes round |
| | `80h` | | | Carry: the keyboard |

With a line in hand, `STLINE` stores its length in `CMDLEN` and writes CR and
`$` after it. It then prints the line from `CMDTXT` through `PUTSTR`, which is
BDOS function 9 (`src/cpm/ccpcmd.asm:629-637`, `src/cpm/ccpcmd.asm:511-513`).
Function 9 ends at the first `$`, so a `$` in the line ends the echo there. The
characters in `CMDTXT` aren't changed, and the line runs whole. The CCP's own
`CRLFMSG` at `NOTDRIVE` ends the echo's row whether or not the CR was reached
(`src/cpm/ccp.asm:251-253`). The output after a cut echo therefore starts on a
new row, as Chapter 6's transcript shows.

The `$` needs one more byte than the buffer. `CMDTXT` is 128 bytes and is
followed at once by `BOOTDRV` (`src/ram.asm:94-98`). A line of 127 characters
puts its CR in the last byte of `CMDTXT`, at `BDB6h`, and its `$` at `BDB7h`,
in `BOOTDRV`. The order in `CCPENT` makes this harmless. `BOOTDRV` has one
reader, at `src/cpm/ccp.asm:61`, and the CCP's entry writes the byte before
that (`src/cpm/ccp.asm:44`). The `$` is overwritten before it is read.

`MLGOT` treats a startup line and a typed one alike from there. It writes a 0
over the CR and takes the first piece (`src/cpm/ccp.asm:113-122`). `CHPOS` was
cleared before `STLINE` was called (`src/cpm/ccp.asm:99`). `MLTAKE` turns the
piece's letters to capitals in place, after the echo
(`src/cpm/ccp.asm:163-168`), which is why the echo keeps a line's small letters.
A test compares each line run from the file with the same line typed, in its
output and its BDOS calls. The only difference is that letter case
(`test/startup.test.mjs:202-219`).

The next line comes by whatever route the CCP takes back to `MLREAD`. A
built-in or a failed command jumps to `STARTED` or `MAINLOOP`
(`src/cpm/ccp.asm:70-79`, `src/cpm/ccp.asm:203`, `src/cpm/ccpfile.asm:526`). A
program returns to the `WBOOT` address that `CMDRUN` pushed
(`src/cpm/ccp.asm:323-325`). The warm boot enters the CCP at `CCPENT`, where
`STBOOT` returns at once, and the loop reaches `STLINE` with `STPOS` where the
last line left it. A `^C` that ends a program is a warm boot too, so it leaves
the file's position alone. [Chapter 21](21-chaining-inside.md) describes what
`CHPOS` does for a line's pieces.

## The display line's two outcomes

Only the graphics LCD has a display line. The PICO9918's console is the ROM's,
started at cold boot when the PICO9918 and the matrix keyboard answer, so no
line in the file loads it (`src/video.asm:8-15`, `src/pico.asm:27-47`). The CCP
separates a service from a program by the three type bytes in `CMDFCB`
(`src/cpm/ccp.asm:281-298`). `SVC` calls `SVCGO`. Any other type goes to the
search for a `.COM` file that [Chapter 20](20-ccp.md#loading-a-program)
describes. `SVCGO` reads the file with `LOADCOM` and installs it with
`SVCLOAD`, and a failure of either returns carry to the CCP
(`src/loader.asm:532-537`).

`GLCD.SVC`'s load fails from inside, in the driver's own `INIT`. It first takes
the ROM's font with service 15, `FONT`, a number past the table of a ROM
before ABI 5.1 (`drivers/glcd.asm:38-41`). It then calls `GLCWAIT`, and a
controller that doesn't answer returns `TNENODV` with carry
(`drivers/glcd.asm:42-45`). Last, it passes its table to service 12, `DRVR`,
with the console mode in `B`, 3 for `UC1:` (`drivers/glcd.asm:46-50`). `SVDRV`
rejects the table in two cases that concern the file. In a line from the file
while the console field is `CRT:`, the PICO9918's console, the status is
`TNENODV`, as for an absent device (`src/services.asm:368-380`). With no matrix
keyboard, or with `UC1:`'s slot already holding a table, it is `TNEBAD`
(`src/services.asm:381-386`, `src/video.asm:86-95`). The driver therefore
needs the matrix keyboard, and a second `GLCD.SVC` fails while the first is in.
[Chapter 16](16-bios-and-console.md#the-displays-and-the-claim) describes
`SVDRV`'s other rejections, among them the `TNEBAD` that an older card's
`PICO.SVC` gets for a table it passes for `CRT:` (`test/ks39.test.mjs:124-135`).

After a good load `SVCGO` compares `SVCHEAD`, the new service's page, with the
page of the table in `GLVEC` (`src/loader.asm:538-541`). No match is some
other service, and the console stays. A match sets `CDGLC`
(`src/loader.asm:542-543`), and the mode in effect then decides. With `CRT:`
in effect, which only a typed `GLCD.SVC` reaches, `SVCGO` goes to `WRDCLR`
alone (`src/loader.asm:544-547`). The console stays on the PICO9918, with
`GLCD.SVC` in for a later `CON UC1`. Otherwise `CONSET` clears the LCD's word
and passes `CMUC1` to `CONSW` (`src/loader.asm:548-550`). `CONSW` moves the
console and writes the mode it takes into the console field, as [Chapter
16](16-bios-and-console.md#the-displays-and-the-claim) describes.

A line `GLCD.SVC` on a board with the matrix keyboard therefore has two
outcomes. The console moves to the graphics LCD, or `INIT` fails with
`TNENODV` and nothing is left in memory. The web page sets that line for the
display chosen, and [Appendix I](appendix-i-web-page.md) gives its rules.

## The LCD's words

Two words go to the 20 × 4 LCD's row 3 through `LCD3`, which is `LCDROW` with
`B` at 3 (`src/lcd.asm:45`). `LCDROW` selects the row, writes up to the zero
and returns with carry set (`src/lcd.asm:47-68`). A routine reporting a failure
can therefore end with a jump to it. The strings are in `src/text.asm:10` and
`src/text.asm:65-66`. Each word has five characters, and `PICCLR`, five blanks
and a zero, wipes either of them.

`GLCD?` goes through `LCDWRD`, which sets `CDWRD` first (`src/lcd.asm:38-41`).
It comes from `GLCLD`, the path of `CON UC1`, when `SVCGO` returns carry
(`src/loader.asm:512-525`). `GLCLD` first puts the mode from `CONMOD` back in
the console field through `CONFLD`, since the console hasn't moved
(`src/loader.asm:521-523`, `src/console.asm:355-359`). With `GLCD.SVC` already
in, `GLCLD` returns at its first test and writes nothing
(`src/loader.asm:512-514`).

`CDWRD` is bit 7 of `CONDEV`, the byte at `BFE7h` that records the console
devices (`src/ram.asm:278`, `src/layout.asm:41-46`):

| Bit | Name | Meaning |
| --- | --- | --- |
| 0 | `CDMTX` | The Matrix switch is on, so the matrix keyboard is read |
| 1 | `CDTMS` | The PICO9918 answered at cold boot |
| 2 | `CDGLC` | `GLCD.SVC` is in |
| 3 | `CDRTC` | The DS1302 clock answered at cold boot |
| 4 | `CDCLM` | A program has claimed the PICO9918 |
| 7 | `CDWRD` | One of the ROM's words is on the LCD's row 3 |

A take of the console clears a word from the LCD. By then the row may be a
program's, and `CDWRD` separates the two cases. `WRDCLR` writes the blanks only
if the bit is set, and clears the bit (`src/loader.asm:555-564`). `CONSET`
calls it, so any take of the console clears a word (`src/loader.asm:548`). A
`GLCD.SVC` that leaves the console on the PICO9918 clears one too
(`src/loader.asm:544-547`). Hardware service `LCD` clears the bit, with no
write of blanks, when a program writes row 3 (`src/services.asm:92-96`). The
row is then the program's, and a later take leaves it alone. A program that
writes the LCD's port goes round this test. The bit then stays set, and a later
take writes its five blanks over the start of the program's row.

`CARD?` takes the other route. `DIAG` writes it with `LCD3` and leaves `CDWRD`
clear (`src/boot.asm:472-473`), since no take can happen at the diagnostic
prompt. `R` jumps to `COLDRT`, where `LCDINIT` clears the whole display
(`src/boot.asm:487-488`, `src/boot.asm:63-64`), and a retry that fails writes
the word again. `CONDEV` itself starts each cold boot at 0, with `CDMTX` then
read from the port (`src/console.asm:34-36`, `src/console.asm:48-50`). No
reset begins with `CDWRD` set.

## The quiet rule

Each line the CCP takes carries a mark of where it came from. After the call of
`STLINE`, `CCF` and `SBC A,A` turn its carry into `FFh` for a line from the
file and 0 for a typed line. The result goes in `STFLAG`, at `BF62h`
(`src/cpm/ccp.asm:100-103`, `src/ram.asm:268`). A chained piece is taken
before `STLINE` is called, so it keeps the mark of the line it came from
(`src/cpm/ccp.asm:97-98`).

The mark is read at one place, a service's failed load. `SVCLOAD` keeps the `A`
that `INIT` returned in `SVCRA`, beside `SVCRC`, which says why the load failed
(`src/loader.asm:243-246`, `src/ram.asm:266-267`). A record the loader rejects
after a good `INIT` sets `SVCRA` to 0, so that failure can't pass for an
absent device
(`src/loader.asm:289-291`). The CCP reads the two bytes as one word, `SVCRC`
in `L` and `SVCRA` in `H`. Four instructions combine them with the mark
(`src/cpm/ccp.asm:290-296`). `AND H` keeps `INIT`'s status only for a line
from the file. `XOR TNENODV` makes the result zero only for status 2, the
device absent. `DEC L` and `OR L` keep it zero only for `SVCRC` 1, an `INIT`
that failed with nothing left behind. A zero result goes to `SVCOK` and the
next prompt, with no message. Any other goes to `BADCMD`, which prints the
name with a question mark.

A line `GLCD.SVC` in the file is therefore quiet on two boards. On a board
with no graphics LCD, `INIT` finds no controller. On a board where the
PICO9918's console is in effect, `SVDRV` rejects the table with the same
status. Typed at the prompt, the same line gives `GLCD.SVC?`. A missing or
damaged file fails before `INIT` runs, with `SVCRC` 0. A board with no matrix
keyboard fails at `DRVR` with `TNEBAD`. Both print the name from the file too
(`test/startup.test.mjs:60-69`, `test/startup.test.mjs:94-105`).

A width line follows the same rule. `CON PICO` or `CON CRT` with a width finds
the ROM's PICO9918 console with `FIND` before it passes the width. With no such
console, as on a serial board, a line from the file goes to `STARTED` with no
message. The same line typed prints the width with a question mark
(`src/cpm/ccpcmd.asm:95-103`, `test/startup.test.mjs:82-93`).

The rule reaches the next piece. `BADCMD` ends at `ERRGO`, which stores the
failure code `RCFAIL` in `PRGCODE` (`src/cpm/ccp.asm:370-378`). A piece that
starts with `:` runs only when the code shows no failure
(`src/cpm/ccp.asm:143-155`). The quiet path leaves the 0 that `MLTAKE` wrote
there before the command (`src/cpm/ccp.asm:175-177`). On a board without the
graphics LCD the line `GLCD.SVC!:MOUNT` therefore runs `MOUNT`. After a
`GLCD.SVC?` typed at the prompt, the same `:MOUNT` is dropped. [Chapter
21](21-chaining-inside.md#the-return-code-and-the-test) describes the code and
the `:` test.
