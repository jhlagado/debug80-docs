---
title: Startup inside the CCP
parent: TEC-OS
nav_order: 25
nav_group: "Part II: Inside TEC-OS"
---

# 25. Startup inside the CCP

<!-- Source mechanisms checked by text inspection against TEC-OS
     ea3ef3de9133931e925a0220d51c0e971c1fd8dd. Unprefixed source ranges use
     that revision. Historical addresses, bypass timing and the retained
     dollar-echo recipe/capture remain at 78127ec. No new execution result. -->

A startup command can run a program that ends through warm boot. The next
startup line must still be available when the CCP starts again. TEC-OS
keeps the first record of `A:STARTUP.CMD` and its next-byte position outside
the warm-boot clear (`src/ram.asm:416-424`, `src/boot.asm:530-536`).
The practical file setup is in [Chapter 7](07-commands-at-startup.md).

## A record across warm boot

`STPOS` is a byte followed by the 128-byte buffer `STREC`
(`src/ram.asm:416-420`). In the historical `78127ec` resident workspace, `STPOS`
was at `BF63h` and the record occupied `BF64h–BFE3h`
(`78127ec:src/ram.asm:270-271`). The position encodes both progress and
completion (`src/cpm/ccpcmd.asm:866-910`, `933-990`):

| `STPOS` | Meaning |
| --- | --- |
| `00h` | `STBOOT` hasn't run since cold boot |
| `01h–7Fh` | A record holds lines: the next byte's offset in `STREC`, plus 1 |
| `80h`, `81h` | Finished, `81h` after a CR or LF in the record's last byte |

The record and position are above the RAM BIOS table. Warm boot's
`CPMINIT` clears from `CCPCLR` to `BDOSRME`, below them. An ordinary
program exit therefore preserves both. Reset enters `COLD` and clears
the whole workspace including `STPOS`. The next startup read begins
from zero (`src/ram.asm:309-319`, `src/boot.asm:38-79`, `530-536`).
[Chapter 14](14-state-and-memory.md#the-workspace-across-a-program-exit)
explains the two clearing spans.

A diagnostic retry returns to `COLDRT`, after the cold clear but before
the CCP has run. `STPOS` is still zero. Once the card mounts, startup can
begin as it would after an uninterrupted cold boot
(`src/boot.asm:119-158`, `831-847`).

## The first read and the bypass

Each `CCPENT` resets the disks, restores the user number and calls
`STBOOT` before selecting the entry drive (`src/cpm/ccp.asm:69-102`).
Cold boot sets page zero to drive A and user 0. Warm boot passes that
byte to the CCP so the first startup open uses user area 0
(`src/boot.asm:157-158`, `210-215`). `STBOOT` returns immediately on
later entries because `STPOS` is already nonzero
(`src/cpm/ccpcmd.asm:874-879`).

The routine marks startup finished before attempting any file operation.
It sets bit 7 of `STPOS`, making `80h` (`src/cpm/ccpcmd.asm:880-881`).
A BDOS error can warm boot from inside the open or read. On the next
entry the nonzero position prevents another attempt at that file.
The source test at `test/startup.test.mjs:221-241` injects a failure at
the file's card block and asserts a usable command prompt with `Bad Sector`
and no execution of the stored command.

The keypad bypass occurs after the finished mark and before the open.
`STBOOT` reads port `03h` once and returns if bit 6 is low, meaning a
hex-keypad key is down (`src/layout.asm:19-20`,
`src/cpm/ccpcmd.asm:883-887`). The position stays at `80h`, just as for
an absent file. Holding a key through reset covers that single sample.
The historical `78127ec` account recorded the sample at 5,824,922
T-states after reset on the web-page board with the starter card, about
1.46 seconds. That retained measurement is not a current deadline.
The hanging-`INIT` and repeated-cold-boot tests both exercise a held key
as the recovery route (`test/startup.test.mjs:46-58`, `243-259`).

Without the bypass, `STBOOT` copies twelve bytes from `STFCB` into
`CMDFCB`: drive byte 1 and `STARTUP CMD`. The rest of the file control block (FCB) is still
zero from cold boot. Drive byte 1 names A regardless of the current drive
(`src/tables.asm:139`, `src/cpm/ccpcmd.asm:888-893`,
`src/ram.asm:163-164`). A recognised reset has already run `RESEL` so
this is the volume currently selected as A, not necessarily the card's
original SYSTEM volume (`src/boot.asm:130-137`, `src/volsvc.asm:1-37`).
Chapter 7's `SPARE` example demonstrates that selection.

Three BDOS calls acquire the record (`src/cpm/ccpcmd.asm:894-910`):

- Function 26 sets the DMA address to `STREC`.
- Function 15 opens the file. `INC A` makes the no-file result `FFh` zero
  for the branch to `STBDMA`.
- Function 20 reads the first record. A nonzero result also branches to
  `STBDMA`, leaving startup finished.

The open and read use `DOSSEQ`. Its inline descriptor byte holds twice
the function number plus an FCB-selection bit. `SRL C` extracts the
number and selects `CMDFCB` for these two calls
(`src/cpm/ccpmut.asm:383-410`). A good read leaves `A` at zero, which
`INC A` converts to position 1. All normal open/read outcomes then
restore `CURDMA` directly to `DEFDMA`, `0080h`
(`src/cpm/ccpcmd.asm:899-919`). A program launched by the first line
therefore has the default DMA address. The bypass keeps the default
already established by warm boot (`src/boot.asm:537-539`).

There is no second read or close. `STREC` supplies every later line from
the same 128 bytes (`src/cpm/ccpcmd.asm:874-919`, `933-1011`). A `USER`
or drive command changes the execution context for following commands
but cannot change the record from which their text is taken.

## Bounded line extraction

`MLREAD` prints a prompt before acquiring input. It takes a remaining
chained piece first, then calls `STLINE` and finally reads the keyboard.
`STLINE` returns carry clear for a supplied line and carry set when
startup is finished (`src/cpm/ccp.asm:123-166`,
`src/cpm/ccpcmd.asm:921-939`, `1008-1011`). Only the keyboard path sets
`HFLAG` before BDOS function 10. That flag enables `HSTORE` at line
completion so startup text adds no history entry
(`src/cpm/ccp.asm:161-166`, `src/cpm/bdos.asm:740-765`).

`STLINE` rotates `STPOS` left to put its finished bit into carry and
returns if that bit is set. Otherwise it rotates the value back and
adds `LOW(STREC)-1`. Since the record lies within a page, that low-byte
calculation and `HIGH(STREC)` give the source pointer without a carry
into another page. `DE` starts at `CMDTXT` and `B` at 127
(`src/cpm/ccpcmd.asm:933-949`).

The scan tests the record boundary before reading each byte. Zero and
`^Z` end the file. CR and LF end the current line. Other bytes are
copied while `B` is nonzero. Once 127 characters have been copied, the
routine continues scanning but drops further characters until the real
line ending (`src/cpm/ccpcmd.asm:951-976`). It can then advance to the
correct next position without running the discarded suffix separately.

A CR or LF reaches `STL2` with `HL` just past the delimiter. End of
record, zero or `^Z` instead reaches `STLE`, which sets `L` to the last
record byte, `STLAST`. Both routes calculate the next offset plus 1
and store it in `STPOS` (`src/loader.asm:66-68`,
`src/cpm/ccpcmd.asm:978-990`). The `STLE` route therefore stores `80h`.
Characters already copied still run even when the record ends mid-line.

The position encoding also excludes a new line starting at offset 127,
the record's last byte. A preceding CR or LF leaves position `80h` and
the next call returns without reading that new line. A line already in
progress can consume the last byte. A delimiter in that byte advances
the pointer one further and stores `81h`, also finished
(`src/cpm/ccpcmd.asm:933-990`). The exact-record test places `USER 13`
after 121 CR bytes and asserts that the complete seven-character line
runs without reading beyond the record (`test/startup.test.mjs:123-128`).

No copied characters means a blank line so `STLINE` repeats its state
test and scan (`src/cpm/ccpcmd.asm:991-995`). CR/LF therefore uses two
passes: CR ends a line and LF produces a blank one. The starter file's
eleven bytes are `GLCD.SVC`, CR, LF and `^Z`. Their positions produce
this sequence:

| Call | `STPOS` on entry | Bytes read | `STPOS` after | Result |
| --- | --- | --- | --- | --- |
| First | 1 | offsets 0–8 | 10 | `GLCD.SVC`, length 8 |
| Second | 10 | offset 9, the LF | 11 | Blank: goes round |
| | 11 | offset 10, `^Z` | `80h` | Blank: goes round |
| | `80h` | | | Carry: the keyboard |

## The echo and the command buffer

For a nonempty line, `STLINE` stores `CMDLEN` and appends CR and `$`
to the copied text. It calls `PUTSTR`, which prints through BDOS
function 9 (`src/cpm/ccpcmd.asm:995-1011`, `798-805`). A `$` already in
the text ends that echo early. The command buffer still contains the
whole line and its original case. `NOTDRIVE` prints `CRLFMSG` before
dispatch so command output starts on a new row even when the echo
did not reach its appended CR (`src/cpm/ccp.asm:396-399`).

The following recipe and capture are retained unchanged from the
`78127ec` example. The prepared card contains `NOTE$.TXT` and its startup
line types that file. These are historical results, separate from the
current source inspection:

```sh
printf 'It ran whole.\n' > 'NOTE$.TXT'
printf 'TYPE NOTE$.TXT\n' > startup.cmd
cp dist/starter.img dollar.img
node tools/tecvol.mjs put dollar.img A startup.cmd --text
node tools/tecvol.mjs put dollar.img A 'NOTE$.TXT' --text
```

<!-- node tools/capture.mjs --card dollar.img -->
```text
A>TYPE NOTE
It ran whole.

A>
```

At the maximum copied length, the echo's CR fills the last byte of
128-byte `CMDTXT`. The `$` goes one byte further into `BOOTDRV`, which
immediately follows it (`src/ram.asm:171-175`,
`src/cpm/ccpcmd.asm:997-1006`). In the historical workspace those two
bytes were `BDB6h` and `BDB7h`. `BOOTDRV` has one reader, in
`CCPENT`. That read precedes line extraction and each new entry writes
`BOOTDRV` before reading it. The temporary `$` is overwritten before
it can become a drive selection (`src/cpm/ccp.asm:69-102`).

`MLGOT` replaces the appended CR with zero and selects the first command
piece. `CHPOS` was cleared before `STLINE` ran
(`src/cpm/ccp.asm:148-184`). `MLTAKE` then capitalises the piece in
place, after the echo (`src/cpm/ccp.asm:249-284`). The source test
compares file-supplied and typed lines from `MLGOT` to the next
`MLREAD`, including their BDOS calls. It normalises letter case for
the output comparison (`test/startup.test.mjs:172-219`).

Built-ins and failed commands return to `STARTED` or `MAINLOOP`.
A program returns through the warm-boot word pushed by `CMDRUN`.
On the next `CCPENT`, `STBOOT` returns without rereading and `MLREAD`
reaches the retained startup position again
(`src/cpm/ccp.asm:104-123`, `483-484`, `519-536`,
`src/cpm/ccpcmd.asm:874-879`). `^C` ending a program follows warm boot
too. It can discard that command's remaining chain without discarding
the next startup line. [Chapter 12](12-results-and-command-chains.md)
explains the operators and
[Chapter 21](21-chains-across-warm-boot.md) follows the retained pieces.

## Display loading and console selection

The PICO9918 console starts from ROM when the display answers and the
Matrix switch enables the matrix keyboard at cold boot. It needs no
service line in the file (`src/console.asm:82-88`,
`src/video.asm:22-29`, `src/pico.asm:64-86`). The supplied display line
loads `GLCD.SVC`. The CCP compares all three type bytes in `CMDFCB`:
`SVC` calls `SVCGO`, while another type goes to the `.COM` search
(`src/cpm/ccp.asm:451-495`).
[Chapter 20](20-from-prompt-to-program.md) explains that search.

`SVCGO` calls `LOADCOM` and `SVCLOAD`, returning carry on either failure
(`src/loader.asm:925-933`). Within `GLCD.SVC`, `INIT` first calls
`FONT`, service 15. A pre-5.1 ROM rejects that number and the driver
returns with carry. Next it calls `GLCWAIT`. An unanswered controller
returns `TNENODV`. Finally it passes its table through `DRVR`, service
12, with `B` at 3 for `UC1:` (`drivers/glcd.asm:66-88`).
[Chapter 24](24-loading-and-removing-services.md) covers the loader's
other checks and rollback.

`SVDRV` uses both the startup mark and the console field. A nonzero
table supplied from startup while that field is `CRT:` is rejected with
`TNENODV`, as for an absent device (`src/services.asm:629-647`). A
controller that answers still needs the matrix keyboard enabled by the
Matrix switch and a free UC1 table slot. `VIDHOOK` returns carry for
either a disabled keyboard or an occupied slot, which `SVDRV` returns
as `TNEBAD`
(`src/video.asm:150-182`, `src/services.asm:649-658`). A second
`GLCD.SVC` therefore fails while the first is installed. An older card's
`PICO.SVC` also fails when it passes a table for `CRT:` because `DRVR`
accepts only `UC1:` (`src/services.asm:618-627`).
[Chapter 16](16-console-paths.md) explains the console tables and claims.

After a successful load, `SVCGO` compares the new service's page in
`SVCHEAD` with the table page in `GLVEC`. No match leaves the console
unchanged. A match sets `CDGLC`. If `CONMOD` is `CMCRT`, it clears only
the LCD recovery word and keeps the PICO9918 selected. Otherwise
`CONSET` clears that word and passes `CMUC1` to `CONSW`
(`src/loader.asm:934-958`). `CONSW` selects the driver and writes the
effective mode to the console field (`src/console.asm:127-184`, `606-620`).
It tests `VTOWN` before restoring or clearing the screen so a selected
PICO9918 with an active claim is left alone (`src/console.asm:184-199`).

The startup and typed cases therefore have different results on a board
with both displays and the matrix keyboard enabled. Startup rejects
GLCD registration while `CRT:` is selected. A typed `GLCD.SVC` can
install the service while leaving the
PICO9918 console in use, ready for a later `CON UC1`. With the matrix
keyboard enabled by the Matrix switch and the controller answering but
no selected PICO9918 console, the startup line can select the graphics
LCD. Successful web-page card preparation sets the line for the chosen display
(`host/card.mjs:58-72`, `104-116`), as
[Appendix I](appendix-i-web-page.md) explains.

## Recovery words and row ownership

`CARD?` and `GLCD?` use row 3 of the 20 × 4 character LCD. `LCD3` sets
`B` to 3 and enters `LCDROW`. That routine selects the row and writes
up to the string's zero terminator, then returns carry set. A failure
path can finish with a jump to it (`src/lcd.asm:77-120`). Each word is
five characters. `PICCLR` is five blanks and a zero
(`src/text.asm:15`, `84-88`).

`GLCLD`, used by `CON UC1`, tests `CDGLC` and returns immediately if the
driver is already installed. A failed `SVCGO` instead restores the mode
from `CONMOD` into the console field with `CONFLD` and writes `GLCD?`
through `LCDWRD` (`src/loader.asm:895-913`, `src/console.asm:610-620`).
`LCDWRD` first sets `CDWRD`, bit 7 of `CONDEV`
(`src/lcd.asm:65-70`, `src/layout.asm:101-102`). The historical address
of `CONDEV` was `BFE7h`. The byte combines these device and ownership
bits (`src/ram.asm:433-434`, `src/layout.asm:92-102`):

| Bit | Name | Meaning |
| --- | --- | --- |
| 0 | `CDMTX` | The Matrix switch is on, so the matrix keyboard is read |
| 1 | `CDTMS` | The PICO9918 answered at cold boot |
| 2 | `CDGLC` | `GLCD.SVC` is in |
| 3 | `CDRTC` | The DS1302 clock answered at cold boot |
| 4 | `CDCLM` | A program has claimed the PICO9918 |
| 7 | `CDWRD` | One of the ROM's words is on the LCD's row 3 |

The row may have program text by the next console selection.
`WRDCLR` returns at once when `CDWRD` is clear. Otherwise it clears the
bit and writes five blanks. `CONSET` calls it, as does a successful typed
GLCD load that leaves the PICO9918 selected (`src/loader.asm:945-980`).
Hardware service `LCD` clears the bit when a program writes row 3,
without writing blanks
first (`src/services.asm:157-192`). A later console selection leaves
that program text alone. Direct port writes bypass the flag change.
If `CDWRD` remains set, a later selection overwrites the first five
characters of the program's row.

`DIAG` writes `CARD?` directly through `LCD3` without setting `CDWRD`.
No console selection occurs at its retry prompt. `R` returns to
`COLDRT`, where `LCDINIT` clears the whole display. Another mount
failure writes `CARD?` again (`src/boot.asm:119-132`, `817-845`).
Cold boot initialises `CONDEV` to zero before reading `CDMTX` from the
Matrix switch so no reset starts with a retained recovery-word flag
(`src/console.asm:57-88`).

## Startup origin and quiet results

The CCP records the source of each new line in `STFLAG`. After `STLINE`,
`CCF` and `SBC A,A` turn carry clear into `FFh` for startup and carry
set into zero for keyboard input. A chained piece is taken before that
call and keeps its line's mark (`src/cpm/ccp.asm:148-158`). The
historical address of `STFLAG` was `BF62h`
(`78127ec:src/ram.asm:268-269`).

There are three readers of this mark: the failed-service path, `DRVR`
registration and the PICO width command when `FIND` returns no console
(`src/cpm/ccp.asm:465-481`, `src/services.asm:629-647`,
`src/cpm/ccpcmd.asm:161-177`). `SVCLOAD` stores `INIT`'s returned `A`
in `SVCRA`, beside the result code `SVCRC`. Record rejection after a
successful `INIT` clears `SVCRA` so the later check cannot accept that
result as an `INIT` device-absence status (`src/loader.asm:445-455`, `520-526`,
`src/ram.asm:407-410`).

The failed-service path reads the two result bytes as a word, `SVCRC`
in `L` and `SVCRA` in `H`. `AND H` keeps the status only for startup.
`XOR TNENODV` gives zero only for status 2. `DEC L` and `OR L` keep
zero only for `SVCRC` 1, a failed installation with nothing left
resident. Only that combined result reaches `SVCOK` without a message.
Other failures returned to this check reach `BADCMD` and print the name with `?`
(`src/cpm/ccp.asm:465-484`, `588-612`, `src/loader.asm:536-587`).

An absent graphics controller and startup registration blocked by an
active PICO9918 console both return `TNENODV`. They can take that quiet
path. A load failure that returns before `INIT` leaves `SVCRC` zero
and prints the file's name with `?`. A disk error under the default
BDOS error mode instead prints its disk message, waits for a key and
warm boots through `CHDROP`, discarding the remaining chain. It does
not return to that name-reporting path (`src/cpm/bdoscon.asm:26-72`,
`src/cpm/bdos.asm:110-119`).

A controller that answers while the Matrix switch disables the matrix
keyboard fails with `TNEBAD`. That failure still prints the name from
startup. Typed on a board without the graphics controller, `GLCD.SVC`
prints `GLCD.SVC?`. Typed with both displays and the matrix keyboard
enabled it can install while leaving the PICO9918 selected
(`src/loader.asm:925-958`, `drivers/glcd.asm:66-88`,
`src/services.asm:618-658`).

The width path first uses `FIND` to locate the ROM PICO9918 console
before passing a width to it. A `CON PICO` or `CON CRT` width line from
startup reaches `STARTED` silently if that console is absent, as on a
serial board. The same line typed at the prompt reaches `BADCMD` and
prints the width with `?` (`src/cpm/ccpcmd.asm:161-191`).

Quiet handling also preserves the result used by `:`. `MLTAKE` clears
`PRGCODE` before each command. A quiet service or unavailable-console
width line leaves that zero intact. `BADCMD` instead reaches `ERRGO`,
which stores `RCFAIL`, `FF00h` (`src/cpm/ccp.asm:280-284`, `613-629`).
The conditional test checks the previous code before clearing it
(`src/cpm/ccp.asm:224-244`). On a board without the graphics controller,
startup `GLCD.SVC!:MOUNT` can therefore run `MOUNT`. The same typed
line reports `GLCD.SVC?` and drops its `:MOUNT` piece.
