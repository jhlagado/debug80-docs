---
title: From prompt to program
parent: TEC-OS
nav_order: 20
nav_group: "Inside TEC-OS"
---

# 20. From prompt to program

<!-- Source-only semantic check: TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Current source citations below use that revision. Historical output,
     addresses and size figures retain TEC-OS 78127ec, not a current build.
     The retained PC fixture used atom-z80 0.3.7. The historical starter's
     TED.COM was Thorium 128edb7, SHA-256
     2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f.
     Source proofs and preservation accounting: 20-pass-record.md.
     No current runtime check claimed. -->

The CCP reads your command through the BDOS, parses its name and either runs a
built-in or loads a file. A program command ends that path with page zero
prepared and a jump to `0100h`. This chapter follows the code from the command
prompt to that jump. [Appendix J](appendix-j-command-reference.md) gives the
exact command grammar.

## Code and working storage

The CCP uses CP/M calls for its ordinary work: function 10 reads a line,
function 15 opens a file and function 9 prints a string through `0005h`. Its own
code stays in ROM while program files load into the transient program area
(TPA). The four source files are assembled in this order (`src/rom.asm:31-35`):

| File | Work |
| --- | --- |
| `src/cpm/ccp.asm` | Boot entry, prompt, command dispatch and program loading |
| `src/cpm/ccpfile.asm` | DIR, TYPE and their pager |
| `src/cpm/ccpmut.asm` | ERA, REN, COPY and the shared BDOS call helper |
| `src/cpm/ccpcmd.asm` | Other built-ins, file-name parsing, page-zero preparation and startup |

The messages and `KEYTAB` are in the ROM data block. Each keyword in
`KEYTAB` has a zero terminator followed by its handler address. A final
zero ends the table (`src/tables.asm:53-80`). In the historical `78127ec`
build, `CCPBAS` was `DD2Ah` and the CCP ended at `E702h`. Its reported
2,521 bytes were followed by the BDOS.

The working state is in RAM. `CMDFCB` and `RENFCB` hold parsed file
references. The command buffer follows them and `CCPCLR` marks the start
of the state cleared by warm boot (`src/ram.asm:148-188`). The historical
state ran from `CCPRAM` at `BCEDh` to `BE75h`, with `CCPCLR` at `BDB7h`.
`CPMINIT` clears from `CCPCLR` through the BDOS state, leaving the command
buffer below it intact (`src/boot.asm:384-393`).
[Chapter 21](21-chains-across-warm-boot.md) explains the retained line.
[Appendix C](appendix-c-memory-map.md) lists the memory locations.

File operations share a short call helper. A `CALL DOSSEQ` has an inline byte
containing twice the BDOS function number plus a file control block (FCB)
selection bit. Bit 0 selects `CMDFCB` when clear and `RENFCB` when set. `DOSSEQ`
advances the stacked return address past that byte, decodes it into `C` and `DE`
and jumps to the BDOS. The BDOS returns after the inline byte
(`src/cpm/ccpmut.asm:334-345`). The historical source used this form for 24
calls. DIR's searches use functions 17 and 18, TYPE's reads use 20 and ERA's
deletion uses 19 (`src/cpm/ccpfile.asm:79-80`, `src/cpm/ccpfile.asm:192-194`,
`src/cpm/ccpfile.asm:538-540`, `src/cpm/ccpmut.asm:55-59`).

The CCP also reads the console geometry and mode, the loader's result
and the program ceiling at `0007h`. Its direct state includes `HFLAG`
for history input, `WRFLAG` for the disk reset, `STFLAG` for startup origin
and `PRGCODE` for the previous result
(`src/cpm/ccp.asm:46-149`, `src/cpm/ccp.asm:210-259`).

## Entry from boot

The prompt must return to the selected drive and user area after a program
ends. Both are packed into `0004h`: the user in bits 4 to 7 and the drive
in bits 0 to 3. Cold boot sets the byte to zero for A and user 0. Warm
boot preserves it and enters `CCPENT` with the byte in `C`
(`src/boot.asm:112-113`, `src/boot.asm:147-149`, `src/boot.asm:290-305`).

`CCPENT` establishes the CCP stack and checks the saved drive. A drive
past D or without a mounted volume becomes A. Otherwise the selection
would raise `Select` and its warm boot would repeat the failed selection.
The chosen drive is held in `BOOTDRV` while the disk state is reset
(`src/cpm/ccp.asm:46-75`).

Function 13 resets the disks with `WRFLAG` set, preserving the allocation
vectors for unchanged drives. Warm boot has cleared the BDOS user variable
so function 32 restores the saved user. `STBOOT` then handles the first
record of `A:STARTUP.CMD` once after cold boot. Finally function 14 selects
the saved drive when it is not A and `STARTED` prints a new line before
the prompt (`src/cpm/ccp.asm:74-96`, `src/cpm/bdosfile.asm:46-77`).
[Chapter 19](19-a-file-through-the-bdos.md) explains the allocation-vector
reset and [Chapter 25](25-startup-inside-the-ccp.md) explains startup.

This retained capture shows the unavailable-drive case. MOUNT runs from A
while B is current and removes B's volume. The next prompt is on A.
The reset afterwards is part of the same historical run:

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

The reset leaves B empty because the selection retained in RAM has B
unmounted. It does not restore the original A/B assignment from the card.
[Chapter 15](15-reset-and-boot.md) explains that retained selection.

## The prompt and its input

`MAINLOOP` resets the stack and calls `SAVEDU` before printing each prompt.
`SAVEDU` reads the user with function 32 and the drive with function 25,
then packs them into `0004h`. The prompt prints a nonzero user number in
decimal before the drive letter and `>`, giving `A>` or `3A>`
(`src/cpm/ccp.asm:111-135`, `src/cpm/ccp.asm:335-353`). A program's ordinary
exit preserves that selection. Removing the current volume gives the
fallback to A described above. Cold reset starts from A and user 0.

Input has three sources in priority order: the next pending command piece,
the next startup line and a typed line. `CHSKIP` finds a pending piece.
Otherwise `STLINE` supplies startup text or function 10 reads the keyboard
with `HFLAG` enabled for command history (`src/cpm/ccp.asm:136-149`).
[Chapter 22](22-the-history-ring.md) explains storage and recall.

`STFLAG` is `FFh` for a startup line and zero for typed input. Pending
pieces retain that origin. Typed input uses `CMDBUF`, the maximum-length
byte, followed by `CMDLEN` and 128 bytes at `CMDTXT`. Warm boot sets the
maximum to 127 (`src/cpm/ccp.asm:139-165`, `src/ram.asm:152-157`,
`src/boot.asm:392-393`).

`MLTAKE` takes a piece up to its `!` or terminating zero. It converts
lower-case letters to capitals and clears `PRGCODE` after any leading
conditional test (`src/cpm/ccp.asm:210-259`).
[Chapter 12](12-results-and-command-chains.md) explains the practical
result rules and Chapter 21 explains the conditional test and drop paths.

## The parsed command

A drive selection is handled before keyword dispatch. `MLTAKE` recognises a
letter A to P followed by a colon and only spaces after it. It selects that
drive with function 14 and updates `0004h` through `SAVEDU`. A missing volume
raises `Select` before that update so the error's warm boot restores the
previous drive (`src/cpm/ccp.asm:260-287`).

Other pieces enter `NOTDRIVE`. It starts a new output line and calls
`CMDSKIP` to store the word's start in `CMDSTRT`. `CMDPARSE` parses a file
reference into `CMDFCB`. `ARGSTRT` is then set to its delimiter for the
handler's arguments. Invalid syntax reaches `BADCMD` before dispatch
(`src/cpm/ccp.asm:368-377`, `src/cpm/ccp.asm:499-544`).

`PARSEFCB` clears all 36 bytes of the destination FCB: zero drive, eleven
spaces for name and type and zeros for the remainder. Reusing an FCB after
TYPE therefore starts a later load at record zero. `FCBBASE` records the
FCB's address while the parser advances `DE`. On return `HL` points to the
reference's delimiter (`src/cpm/ccpcmd.asm:452-543`).

An initial letter and colon set the drive byte to 1 through 16 for A to P.
The parser fills up to eight name bytes and three type bytes after a dot.
`FCBEND` recognises zero, space, equals and dot. `PARSTAR` fills the remaining
field positions with question marks and skips text to the delimiter.
`VALIDCHR` checks the thirteen reserved characters in `BADCHARS`.
`PARLONG` skips an overlong field and returns carry
(`src/cpm/ccpcmd.asm:494-585`, `src/cpm/ccpcmd.asm:618-678`,
`src/text.asm:72-73`). Appendix J gives
the complete exclusion list, padding rules and accepted command forms.

`UNAMBIG` checks the stored FCB through `FCBBASE`. It rejects a blank name or
any question mark in the eleven name/type positions. TYPE, REN, SAVE and program
dispatch use that check. COPY checks its destination after substituting the
source name for a blank destination name so a discarded destination type may
contain wildcards (`src/cpm/ccpcmd.asm:597-638`, `src/cpm/ccpmut.asm:193-209`).

The keyword loop compares the original command text at `CMDSTRT` with
`KEYTAB`, not the parsed FCB. Its order is DIR, TYPE, ERA, REN, SAVE,
USER, CON, COPY, UNLOAD and SERVICES. `ISCMD` requires a space or zero
immediately after the keyword. `A:DIR` and `DIR.COM` therefore name a
program file rather than built-in DIR. Both fail when the selected search
finds no `DIR.COM` (`src/cpm/ccp.asm:380-405`,
`src/cpm/ccpcmd.asm:705-724`, `src/tables.asm:53-80`).

A match jumps to the handler address in the table. With no match the CCP
requires an unambiguous file name. Type SVC calls `SVCGO` to load and install a
service. Other types are replaced by COM so `MOUNT.TXT` searches for `MOUNT.COM`
(`src/cpm/ccp.asm:403-455`). A startup service whose INIT reports `TNENODV` has
the quiet-success exception. Other installation failures reach `BADCMD`
(`src/cpm/ccp.asm:426-437`). [Chapter 24](24-loading-and-removing-services.md)
describes installation.

`BADCMD` prints the word at `CMDSTRT` up to space or zero, then `?` and a new
line. Built-ins can move `CMDSTRT` to an argument. CON moves it again for a
separated width so its error may name that width. `ERRGO` sets `FF00h` before
printing the error message. Successful handlers retain the zero set at piece
entry. They finish at `MAINLOOP` or at `STARTED`, which adds a new line first
(`src/cpm/ccp.asm:499-507`, `src/cpm/ccp.asm:553-587`,
`src/cpm/ccpcmd.asm:101-109`).

## The built-in handlers

The handlers use the same FCB and DMA interfaces as a disk program. This
table locates their implementations at `962853f`. Appendix J gives syntax
and [Appendix D](appendix-d-error-messages.md) gives recovery from messages.

| Command | Routine | Source |
| --- | --- | --- |
| DIR | `CMDDIR` | `src/cpm/ccpfile.asm:17-260` |
| TYPE | `CMDTYPE` | `src/cpm/ccpfile.asm:518-577` |
| ERA | `CMDERA` | `src/cpm/ccpmut.asm:10-63` |
| REN | `CMDREN` | `src/cpm/ccpmut.asm:74-145` |
| SAVE | `CMDSAVE` | `src/cpm/ccpcmd.asm:263-398` |
| USER | `CMDUSER` | `src/cpm/ccpcmd.asm:217-247` |
| CON | `CMDCON` | `src/cpm/ccpcmd.asm:51-208` |
| COPY | `CMDCOPY` | `src/cpm/ccpmut.asm:191-320` |
| UNLOAD | `CMDUNL` | `src/cpm/ccpcmd.asm:13-16`, `src/loader.asm:101-130` |
| SERVICES | `CMDSVC` | `src/cpm/ccpcmd.asm:760-786` |

### Directory listing and text output

DIR turns a blank name into eleven question marks and sets DMA to `LOADBUF`.
Functions 17 and 18 return matching directory entries. DIR skips a system
file by testing bit 7 of the second type byte. Its parsed FCB has extent
zero so the search returns each file once
(`src/cpm/ccpfile.asm:17-111`).

`DIRNCOL` is the console width `VWID` divided by 13, with a minimum of one.
A zero width uses 80 for serial output. DIR prints each name and type,
padding to twelve characters except at a row's end, with a separating
space before the next entry (`src/cpm/ccpfile.asm:55-77`,
`src/cpm/ccpfile.asm:113-185`). The layout differs from Digital Research's
DIR. The footer calls function 46 for the listed drive and divides its
three-byte free-record count by eight to print KiB. The default drive stays
unchanged. No listed file gives `NO FILE`
(`src/cpm/ccpfile.asm:203-260`, `src/cpm/bdosfn.asm:53-124`).

Both DIR and TYPE print through the pager. `PGINIT` takes its dimensions from
`VHGT` and `VWID` or uses 24 rows and 80 columns for serial. It reserves a row
for `[more]`. `PGPUT` resets its column at carriage return, steps back at
backspace and advances to the next multiple of eight at a tab. It counts a new
line at LF or before a printable character beyond the last column
(`src/cpm/ccpfile.asm:278-410`). At a pause function 6 reads a key without echo.
`UNMORE` erases the prompt with CR, six spaces and CR (`src/text.asm:35-36`).
The key mask makes `#` equivalent to `^C` and `;` equivalent to Esc. `^C` and
`#` drop the chain. Esc, `Q`, `q` and `;` stop only the listing. Other keys
continue (`src/cpm/ccpfile.asm:414-451`). Chapter 21 explains the chain
distinction.

TYPE opens its file and reads 128-byte records into `LOADBUF`. It prints
through the pager until `1Ah`, the first Ctrl-Z, or the file's end. It then
closes the file. No name or a missing file produces `NO FILE`
(`src/cpm/ccpfile.asm:518-587`).

### Erase, rename and save

ERA tests all eleven stored name/type bytes for question marks before
printing `ALL (Y/N)?`. Function 1 reads the first echoed answer byte.
Return alone cancels deletion. Otherwise ERA drains the answer to Return
and deletes only for an initial Y or y. Other patterns delete without that
question. Function 19 performs the deletion and no match gives `NO FILE`
(`src/cpm/ccpmut.asm:10-63`).

REN parses NEW into `RENFCB` and OLD into `CMDFCB`. The names share a drive
from either reference and different explicit drives are rejected. Function
17 checks the new name first. A match gives `FILE EXISTS` before mutation.
Otherwise REN copies twelve bytes from `RENFCB` to `CMDFCB+16`, placing
the new name at offset 17 for function 23. An absent old name gives
`NO FILE` (`src/cpm/ccpmut.asm:74-145`).

SAVE converts a decimal page count with a carry check at every arithmetic
step. It rejects values above 255 and counts reaching the high byte of
the word at `0006h`. In the historical starter build that byte was `B9h`:
184 pages covered `0100h` through `B8FFh`. Both 185 and 320 were rejected
in this retained capture (`src/cpm/ccpcmd.asm:263-311`):

<!-- node tools/capture.mjs "SAVE 320 B:X.COM" "SAVE 185 B:X.COM" -->
```text
A>SAVE 320 B:X.COM
320?

A>SAVE 185 B:X.COM
185?

A>
```

SAVE erases an existing file, makes it again and writes two 128-byte records per
page from `0100h`. A failed make, write or close gives `NO SPACE`. After a
failed write it attempts close before reporting the error. A successful close
records the partial file. The error path discards the close result so the
message does not certify that update. Digital Research's CP/M 2.2 SAVE leaves
the file open on that path (`src/cpm/ccpcmd.asm:313-398`).

SAVE reads the TPA. The other file-operation handlers use resident workspace and
page-zero buffers so they leave program memory available to save. Loading a COM
program or a service overwrites that memory, including a GLCD service loaded by
CON (`src/cpm/ccpcmd.asm:319-368`, `src/loader.asm:731-764`,
`src/cpm/ccpmut.asm:240-273`, `src/cpm/ccp.asm:642-679`).

### Selection and consoles

USER validates a single digit 0 to 9 or a two-digit value 10 to 15 and
calls function 32. CON uses its device-name table to set the IOBYTE console
field through `CONFLD`. PICO aliases CRT and GLCD aliases UC1. Selecting
UC1 calls `GLCLD` to load `GLCD.SVC` from A if required. A failed load puts
the field back to the active mode (`src/cpm/ccpcmd.asm:51-208`,
`src/cpm/ccpcmd.asm:217-247`, `src/loader.asm:731-745`).

CON's report prints `CON:` and the mode read from `CONMOD` after the BIOS has
acted on the field. A missing display or keyboard can force TTY while a failed
GLCD load restores the previous mode. Output uses the selected console and BAT
discards it. [Chapter 16](16-console-paths.md) explains the BIOS transition
(`src/cpm/ccpcmd.asm:183-208`, `src/console.asm:345-353`).

A width after CRT or PICO is parsed as two decimal digits. CON finds the PICO
version-3 record with `TNFIND` and calls its `PICOWID` entry for 80, 40 or 32
columns. A joined name and width, a width after another device, an unsupported
width or a missing PICO interface is an error. In startup the missing-interface
path passes quietly. A separated width becomes the error word while a joined
form names the whole token (`src/cpm/ccpcmd.asm:101-170`). The historical PICO
capture shows both:

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

`PICOWID` also rejects a change while the display is claimed. An accepted
width change clears the screen at the next console call. Its state in
`PIBLK` survives warm boot. Reset initialises the PICO console to 40 columns
when the display probe succeeds and the Matrix switch is enabled. Otherwise
serial remains selected. Bare `CON CRT` and `CON PICO` retain the chosen
width and any active claim
(`src/console.asm:31-52`, `src/video.asm:18-24`,
`src/pico.asm:44-68`, `src/pico.asm:70-94`,
`src/cpm/ccpcmd.asm:101-187`, `src/console.asm:120-142`).

### Copies and resident services

COPY resolves both drive bytes, substituting the current drive for zero.
A destination with a blank name takes the source's eleven name/type bytes.
After checking the result for ambiguity, COPY compares all twelve bytes
for a self-copy and rejects extra operands before opening either file
(`src/cpm/ccpmut.asm:158-179`, `src/cpm/ccpmut.asm:193-230`).

The copy uses DMA at `0080h` and leaves the TPA untouched. It opens the
source, erases and makes the destination and transfers records through
functions 20 and 21. `DIRNUM` counts records and `CPHEX` prints the count
in hexadecimal through the console's `HEXHL`. A write error attempts to
close the partial destination before `WRITE ERROR`. Retention of the
written records depends on that close succeeding. The error path ignores
its result (`src/cpm/ccpmut.asm:240-320`, `src/cpm/ccpmut.asm:353-359`).

SERVICES walks the owner list from its lowest page upwards, printing each
name and decimal page count. `SVCABV` supplies the page above an owner to
calculate that count. UNLOAD calls `SVCUNL` for the lowest owner, the newest
service. It fails there if removal is disallowed or REMOVE returns carry.
It does not skip to another service (`src/cpm/ccpcmd.asm:13-16`,
`src/cpm/ccpcmd.asm:760-786`, `src/loader.asm:101-130`). Chapter 24 explains
the registry and removal checks.

## Program lookup and capacity

A COM command uses `LOADA` on the named drive or the current drive.
`LOADA` first calls `LOADCOM` in the current user area. Only a missing file
permits a retry in user 0 and user 0 is skipped when already current.
Function 32 changes the user before that retry and restores it afterwards.
No system attribute is required (`src/cpm/ccp.asm:601-626`).

`LOADCOM` distinguishes absence from an unloadable file with flags. Carry
and zero mean missing. Carry with NZ means a file was found but could not
load. `LOADA` returns the latter failure immediately. The CCP retries drive
A only after absence on the first drive, when no drive was explicit and
the current drive is not A. It writes 1 into the FCB drive byte and calls
`LOADA` again. A's current user therefore precedes A's user 0
(`src/cpm/ccp.asm:455-467`).

This retained starter-card capture contrasts a plain command with an
explicit B drive. The plain MOUNT reaches A while `B:MOUNT` stays on B:

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

A service command calls `LOADCOM` directly through `SVCGO`. It searches
only its named or current drive and the current user area. It has neither
the user-0 retry nor the drive-A fallback
(`src/cpm/ccp.asm:426-427`, `src/loader.asm:759-764`).

`LOADCOM` opens `CMDFCB` and starts at `0100h`. `READSRC` sets DMA with
function 26 before each function-20 read. Each successful record advances
the destination by 128 bytes. The loop stops at EOF or at the page given
by `0007h`, the high byte of the entry word at `0006h`
(`src/cpm/ccp.asm:642-665`, `src/cpm/ccp.asm:733-739`).

Reaching that page does not establish that the file is oversized.
`LOADLIM` reads once more into workspace `LOADBUF`. EOF means an exact
fit. A further record or another error returns carry with NZ. Below the
ceiling, `LOADEND` also requires EOF for success. `LOADOK` stores the
record-rounded end in `LOADTOP` for the service loader then calls close.
It clears carry without checking close's result
(`src/cpm/ccp.asm:675-720`). Thus a larger file stops lookup rather than
falling through to another drive. In the default BDOS error mode a card
read failure prints `Bad Sector` and warm-boots before this routine returns
(`src/cpm/bdoscon.asm:46-64`).

The historical starter build had its resident entry at `B9A4h`. Its load
ceiling was `B900h`, allowing 47,104 bytes from `0100h`, 164 fewer than the
TPA's byte-address limit. An installed service lowers the entry word to
its first page and lowers the load ceiling with it
(`src/cpm/ccp.asm:654-656`, `src/loader.asm:480-493`).

The retained capacity fixture places FITS, BIG and ARGS on B. FITS and BIG
contain RET followed by zeros. ARGS has the complete listing below.
FITS has 47,104 bytes and BIG has 47,105. This is the original PC recipe
using ATOM 0.3.7, not a current build:

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

In the historical run FITS returned to the prompt and BIG was rejected:

<!-- node tools/capture.mjs --card build/ccp.img B: FITS BIG -->
```text
A>B:
B>FITS

B>BIG
BIG?

B>
```

The same historical fixture also demonstrates user fallback. Under user 3,
ARGS is found in B's user 0 and MOUNT in A's user 0. DIR still lists only
the empty current area:

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

## Page zero before entry

A successful load reaches `PREPPAGE`. It parses the first two argument
references into the FCBs at `005Ch` and `006Ch`, ignoring parse errors for those
program arguments. It then copies the command tail to `0081h`, writes its length
at `0080h` and appends zero. Function 26 restores DMA to `0080h`. The tail
includes the initial space and any spaces before the piece's separator. Its
letters have already been converted to capitals (`src/cpm/ccpcmd.asm:410-450`).

The two FCBs start sixteen bytes apart. Parsing the second overwrites the last
twenty bytes of the first. The tail begins at `0080h` within the second FCB's
last sixteen bytes so those bytes are shared with tail storage. Each FCB's drive
and eleven name/type bytes remain intact (`src/cpm/ccpcmd.asm:410-450`). The
complete FCB and DMA contracts are explained in
[Chapter 9](09-read-and-write-a-file.md).

ARGS prints those drive and name fields, then the tail between brackets.
This complete historical listing is the `build/args.asm` used in the
capacity-card recipe above:

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

`PUT` saves BC and HL across function 2, preserving the caller's count and
pointer. `SHOWFCB` prints eleven name/type bytes and `TAIL` uses the length
byte at `0080h`. In this retained capture the parsed names use padded FCB
fields while the tail preserves the spaces within the piece:

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

The first FCB has drive zero for the current drive and the second has 1
for A. The star in `*.C` expands to eight question marks. `ARGS X Y`
retains its space before `!`. With no arguments both names are blank and
the tail length is zero (`src/cpm/ccpcmd.asm:466-543`,
`src/cpm/ccpcmd.asm:648-661`).

## The jump and return

After `PREPPAGE`, the CCP writes the load drive from `CMDFCB` to `0050h`. Zero
means a plain name loaded on the current drive. An explicit drive keeps its FCB
number so `B:ARGS` gives 2. A plain command found by fallback on A gives 1
because lookup set the FCB byte to A (`src/cpm/ccp.asm:458-480`).

`CMDRUN` resets SP to `CSTKTOP`, pushes `0000h` and jumps to `0100h`.
The source reserves a 32-byte CCP stack, leaving thirty bytes below that
return word. A guard separates the stack from command scratch
(`src/cpm/ccp.asm:482-490`, `src/layout.asm:114-115`,
`src/ram.asm:198-210`). CP/M 2.2's eight levels provide sixteen bytes.
[Chapter 14](14-state-and-memory.md) distinguishes configured stack sizes
from historical measurements and bounds.

A top-level RET reaches the warm-boot jump at `0000h`. A direct jump there or
function 0 reaches warm boot too (`src/cpm/ccp.asm:487-490`,
`src/cpm/bdos.asm:210-215`). Warm boot flushes the block cache before
re-entering the CCP. A failed flush prints `Write lost` and cancels pending
pieces (`src/boot.asm:138-149`, `src/cache.asm:566-572`). The CCP enters at
`STARTED` and prints a new line before its prompt. A program whose output
already ended with a new line therefore has a blank line before that prompt.
