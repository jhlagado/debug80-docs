---
title: Writing services
parent: TEC-OS
nav_order: 12
nav_group: "Part I: Using and programming TEC-OS"
---

# 12. Writing services

<!-- Checked against TEC-OS 78127ec. The programs were assembled by the starter
     card's `TAS.COM`, from Thorium dbee66a, SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

Every program written so far has been a `.COM` file, which runs at `0100h`
and is gone when it ends. A `.SVC` file stays in memory after its command
ends. Here you write a service that counts the console's characters. You
install it, measure what it costs and publish the count for a program to
find.
[Chapter 24](24-service-loader.md) describes the loader, and
[Appendix H](appendix-h-service-file-format.md) the file's format.

## Code that stays

A program's memory is reused as soon as it ends, so nothing of it runs after
that. A *service* is what a `.SVC` file installs. TEC-OS reads it from the
card into whole pages of 256 bytes just below the BDOS. There it stays
through every warm boot, until a reset or the `UNLOAD` command removes it.
[Chapter 6](06-startup-file.md) gives the commands that install, list and
remove services. A *driver* is a service that drives hardware, and a
*library* is a service that provides routines for programs. The starter
card's one service, `GLCD.SVC`, is a driver. The example here is both.

The pages come from the TPA. Installing a service lowers the word at
`0006h`, the top of a program's memory, as [Chapter 8](08-memory.md)
describes. The pages that loaded services hold, from the lowest service up
to the BDOS entry jump's page, are the *service resident memory*. The
hardware services of [Chapter 10](10-hardware-services.md) are another
thing. They are numbered calls inside the ROM, which take no pages and which
`SERVICES` doesn't list. A loaded service reaches programs by publishing
named *records* in TEC-OS's registry. The two numbered services Chapter 10
left to this chapter read the registry.

A service reaches the programs that run after it through the BIOS jump
table. The table is in RAM at `BF00h`, and the word at `0001h` holds the
address of its `WBOOT` entry. Each entry is a 3-byte `JP`. Warm boot leaves
the table as it is, so a changed entry lasts through every warm boot. The
BDOS reaches the console and the disk through those entries. A replaced
entry therefore receives the console output of a program and of the CCP.
`PUTAT` and the ROM's own messages go straight to the ROM's routines and
miss the entry. A *hook* on an entry is a routine that does its own work and
then jumps to the address the entry held.

## COUNT.SVC

`COUNT.SVC` hooks `CONOUT` and counts the characters that pass through it:

```asm
; COUNT.SVC: count the characters that reach the BIOS's CONOUT, and publish
; the count in a record. REMOVE puts CONOUT back.
%INCLUDE "ABI.INC"

	ORG	$0100
HDR:	DB	'D',SVCFMT,0,1	; magic, format, no dependencies, removable
	DW	0,0,0,0		; REMOVE, size, extra memory, relocation
	DB	2,2,2		; bytes added to the BDOS, BIOS, CCP stacks
	DW	0		; INIT
	DB	"COUNT   "	; the name SERVICES prints

; Point CONOUT at MYCO, keeping the old target. Returns HL = the record,
; carry clear. Changes AF, DE and HL.
INIT:	CALL	CONSLOT		; HL = the address held by CONOUT's JP
	LD	E,(HL)		; DE = that jump's target
	INC	HL
	LD	D,(HL)
	LD	(OLDCO),DE	; MYCO ends by jumping there
	LD	DE,MYCO		; the hook goes in last
	LD	(HL),D
	DEC	HL
	LD	(HL),E
	LD	HL,REC		; the record for the loader
	OR	A		; carry clear: installed
	RET

; Put CONOUT back. Returns carry clear. Changes AF, DE and HL.
REMOVE:	CALL	CONSLOT		; HL = the address held by CONOUT's JP
	LD	DE,(OLDCO)	; the target INIT saved
	LD	(HL),E
	INC	HL
	LD	(HL),D
	OR	A		; carry clear: removal goes ahead
	RET

; Find CONOUT's slot in the BIOS table. Returns HL = the address held by its
; JP. Changes F and DE.
CONSLOT:LD	HL,($0001)	; HL = the WBOOT entry
	LD	DE,9+1		; three entries on, and past the JP's opcode
	ADD	HL,DE
	RET

; The hook: count a character, then CONOUT as it was. Keeps every register
; for that jump.
MYCO:	PUSH	HL		; two bytes of the caller's stack
	LD	HL,(CHARS)	; the count, a word
	INC	HL
	LD	(CHARS),HL
	POP	HL		; C still holds the character
	DB	$C3		; JP to the entry replaced
OLDCO:	DW	0		; INIT fills this in

; The record's one entry. Returns HL = the count. Changes nothing else.
GETCNT:	LD	HL,(CHARS)
	RET

REC:	DW	0		; the link: the loader fills it
	DB	"COUNT   "	; the record's name
	DB	1		; its interface version
	DW	TABLE		; its entry table
TABLE:	JP	GETCNT		; offset 0: the count
CHARS:	DW	0		; the count itself
```

### The header

The first 25 bytes of the file are the header, and the source writes it as
data at `0100h`. A service sets a few of its fields and leaves the rest at
0. The tool that makes the file, `TAS` or `makeSvc`, fills those in. The
tool finds `INIT` and `REMOVE` by those label names. Every service has both,
even one that `UNLOAD` can't remove. The flags byte's bit 0 lets `UNLOAD`
remove the service, and bits 1 to 7 claim restart vectors, as a later
section explains. The format byte is `SVCFMT`, which `abi.inc` defines as 4
at this commit. The loader rejects a file of any other format. A service
that needs a buffer past its image gives the size as its extra memory, and
the loader sets aside that many bytes, not cleared. The name, 8 bytes padded
with spaces, is what `SERVICES` prints.

| Offset | Bytes | Contents | Written by |
| ---: | ---: | --- | --- |
| 0 | 1 | The letter `D`, `44h` | the source |
| 1 | 1 | The format, 4, `SVCFMT` in `abi.inc` | the source, and `makeSvc` writes 4 over it |
| 2 | 1 | Number of dependencies | the tool |
| 3 | 1 | Flags: bit 0, removable; bits 1 to 7, `RST 1` to `RST 7` claimed | the source |
| 4 | 2 | `REMOVE`, from the header's start | the tool |
| 6 | 2 | Size of the header and image | the tool |
| 8 | 2 | Extra memory after the image | the source |
| 10 | 2 | Size of the relocation data | the tool |
| 12 | 3 | Stack bytes added: BDOS, BIOS, CCP | the source |
| 15 | 2 | `INIT`, from the header's start | the tool |
| 17 | 8 | The name | the source |

After the header the file holds the image, then any dependencies, then the
relocation data, which Appendix H describes. A file's end is rounded up to a
whole record on the card, and the loader ignores what follows the relocation
data.

### INIT

`INIT` runs once, after the loader has put the service in its pages and
adjusted the addresses in the image. `CONSLOT` finds `CONOUT`'s entry from
the word at `0001h`. After the `WBOOT` entry come `CONST`, `CONIN` and
`CONOUT`, so `CONOUT`'s `JP` is at the word's value plus 9. The `+ 1` steps
past the `JP`'s opcode to the two bytes of its target. `INIT` saves those
two bytes in `OLDCO` and writes the address of `MYCO` over them.

A return with carry clear means that the service is ready, and `HL` gives
its record, which a later section describes. A service that publishes no
record returns `HL` = 0.

### The hook

`MYCO` runs inside every call of the `CONOUT` entry. `CONOUT` takes its
character in `C`. `MYCO` puts back the one register it uses, so the entry it
replaced runs with the registers it would have had. `MYCO`'s last
instruction is a `JP` written as data, whose target is the two bytes `INIT`
filled in at `OLDCO`. The old `CONOUT` therefore returns straight to the
caller.

### REMOVE

`REMOVE` undoes `INIT`, and `UNLOAD` calls it. A return with carry clear
lets the removal go ahead, and carry set stops it with nothing changed.

## Assembling, installing and measuring

`TAS NAME OUT.TYP` writes the output under the name given. For the output
type `.SVC` it fills in the header's fields and the relocation data. For any
other type it writes a flat image, except that it rejects `.DBG` and a type
that starts with `$`. So `TAS COUNT COUNT.SVC` writes the service, in place
of any `COUNT.SVC` already on the drive.

These commands put `count.asm` on a copy of the starter card, with
`abi.inc` and `HWLIB.ASM` from Chapter 10 and `area.asm`, the `AREA`
program of Chapter 8. `chars.asm` reads the count that `COUNT.SVC`
publishes, and it is listed under "Publishing a record":

```sh
cp dist/starter.img svc.img
node tools/tecvol.mjs put svc.img B dist/abi.inc --text
node tools/tecvol.mjs put svc.img B area.asm --text
node tools/tecvol.mjs put svc.img B hwlib.asm --text
node tools/tecvol.mjs put svc.img B count.asm --text
node tools/tecvol.mjs put svc.img B chars.asm --text
```

The run assembles `AREA` and `CHARS`, then the service:

<!-- node tools/capture.mjs --card svc.img B: "TAS AREA" "TAS CHARS" "TAS COUNT COUNT.SVC" AREA COUNT.SVC SERVICES AREA CHARS CHARS UNLOAD SERVICES AREA CHARS -->
```text
A>B:
B>TAS AREA
AREA.COM written

B>TAS CHARS
CHARS.COM written

B>TAS COUNT COUNT.SVC
COUNT.SVC written
```

`AREA` now measures the TPA before and after the service, and `UNLOAD`
takes it out again. The rest of the same run:

<!-- the same run, continued -->
```text
B>AREA
47268 bytes

B>COUNT.SVC

B>SERVICES
COUNT 1
B>AREA
46848 bytes

B>CHARS
count 003A

B>CHARS
count 0052

B>UNLOAD

B>SERVICES
B>AREA
47268 bytes

B>CHARS
no COUNT record

B>
```

The file is 100 bytes of header and image and 11 of relocation data. It
takes a whole page, so `SERVICES` shows 1 page. The TPA falls by 420 bytes,
and `UNLOAD` gives them back. The page is 256 of them. The other 164 are the
bytes from `B900h` to `B9A3h`, between the first service's page and the
BDOS entry jump, which Chapter 8 shows go with the first service. The count
rose by `18h`, 24, between the two `CHARS` commands. Those are the
characters the console printed in between, counted because the hook stayed
through each program's warm boot.

On a PC the repository's `makeSvc` does the same job as `TAS`. It needs the
line `ORG $0100` spelt that way, and `tools/lib/svc.mjs` states its other
rules. It writes the same 111 bytes, where `TAS`'s file is rounded up to the
record's 128:

```sh
cp dist/abi.inc .
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { makeSvc } from "./tools/lib/svc.mjs";
const { file } = await makeSvc("count.asm", { work: "build/svc" });
writeFileSync("COUNT.SVC", file);
'
node tools/tecvol.mjs put svc.img B COUNT.SVC
```

## The rules for INIT and REMOVE

The loader checks the file, the dependencies, the stacks and the records,
and it moves the image. What `INIT` and `REMOVE` do is beyond its reach. The
rules here are what the loader can't put right.

### A failed INIT

`INIT` returns carry set only after undoing everything it did, and the load
then fails with the name and a question mark. `FAIL.SVC` does nothing but
that. The run below leaves out the lines that assemble it and `AREA`:

```asm
; FAIL.SVC: a service whose INIT returns carry set, so the load fails.
%INCLUDE "ABI.INC"

	ORG	$0100
HDR:	DB	'D',SVCFMT,0,1	; magic, format, no dependencies, removable
	DW	0,0,0,0		; REMOVE, size, extra memory, relocation
	DB	0,0,0		; no stack bytes added
	DW	0		; INIT
	DB	"FAIL    "	; the name SERVICES would print

; Nothing was done, so there is nothing to undo. Returns carry set: not
; installed.
INIT:	SCF
	RET

; Never reached: a failed INIT runs no REMOVE. Returns carry clear.
REMOVE:	OR	A
	RET
```

<!-- node tools/tecvol.mjs put svc.img B fail.asm --text; node tools/capture.mjs --card svc.img B: "TAS AREA" "TAS FAIL FAIL.SVC" FAIL.SVC SERVICES AREA -->
```text
B>FAIL.SVC
FAIL.SVC?

B>SERVICES
B>AREA
47268 bytes

B>
```

The pages went back, so `AREA` reports the TPA as it was. `GLCD.SVC` fails
this way on a board without the graphics LCD or the matrix keyboard. An
`INIT` that returns status 2 in `A` with the carry reports its device
absent. In a line of `STARTUP.CMD` that failure prints nothing and counts as
a success for a `:` after it, as Chapter 6 explains. `GLCD.SVC` returns
status 2 when no graphics LCD answers.

After a failed `INIT` the loader reads the 17 entries of the BIOS jump
table for one that points into the service. If it finds one it keeps the
pages, marks them as not removable and publishes no record. The scan covers
the BIOS jump table alone. A vector anywhere else, such as a display
driver's table handed to the ROM through service 12, is the service's own
to undo. A failed `INIT` runs no `REMOVE`, so `INIT` also turns off any
source of interrupts it started.

A call of BDOS function 47 from `INIT` or `REMOVE` is a warm boot there, as
[Chapter 11](11-return-codes-and-chaining.md) says of every call. Its line
runs. From `INIT` the load rolls back, and from `REMOVE` the service stays
listed. A warm boot during `INIT` takes the pages back with no call to the
service, and a hook already made would then point into free memory. `INIT`
therefore makes its hooks last, as `COUNT` does.

### Hooks and REMOVE

`REMOVE` restores hooks in the reverse order of `INIT`. Only the lowest
service can go. When each `REMOVE` puts back what its `INIT` found, a hook
on a hook therefore comes off in the right order. `UNLOAD` calls `REMOVE`
from the CCP, so no program is running. `REMOVE` may also run after a good
`INIT` whose records the loader rejected.

While `INIT` or `REMOVE` runs, another load or removal is rejected. No
command can reach that case. The test stops a service that calls the ROM's
routines by their addresses. A service calls the ROM only through the ROM
table at `C003h`, with `abi.inc`'s names, because the addresses behind it
change from one build to the next. `makeSvc` rejects a source that writes a
ROM address in hexadecimal, but `TAS` makes no such test. A service makes no
test of the table's version, since a file of format 4 loads only on a ROM
with this table.

### Restart vectors

A service can keep a handler in a restart vector. Flags bits 1 to 7 claim
`RST 1` to `RST 7`, the vectors at `0008h` to `0038h`, and `INIT` writes the
`JP` itself. A load whose claimed vector holds a `JP` fails with nothing
changed. A jump into the ROM that a finished program left there counts until
a reset. The loader reads only the flags, so a vector `INIT` writes without
claiming it goes unseen.

A sweep of `0008h` to `003Fh` runs at cold boot, at every warm boot, after
an unload and after a failed `INIT`. It keeps a `JP` whose target is above
the top of the TPA. Anything else gets its default: seven zeros and a `RET`,
or `EI` and `RETI` at `0038h`. A handler in the service's pages therefore
stays through warm boots and goes with the service. `UNLOAD` also gives each
claimed vector its default, whatever it holds. So does a failed `INIT` whose
pages the loader frees. `REMOVE` restores any jump the service set in a
vector it didn't claim and that leads outside its pages.

Nothing in the ROM turns interrupts on. Cold boot and warm boot leave them
off, and each routine that masks them puts back the state it found. A
handler at `0038h` therefore runs after a warm boot only once a program or a
service sets `EI`.

## Stacks

A service's code runs on its caller's stack, and TEC-OS's three stacks are
small. Each header therefore gives the bytes the service adds to each of
them, in the order BDOS, BIOS, CCP. `MYCO` pushes one word while it runs
inside `CONOUT`. `CONOUT` can be called on any of the three, so `COUNT`
declares 2, 2 and 2.

The loader adds each figure to those of the services already in. The load
fails if a sum would pass the limit: 8 bytes on the BDOS's stack, 12 on the
BIOS's and 6 on the CCP's. At this commit `GLCD.SVC` declares 6 for the
CCP's, so it and `COUNT.SVC` can't both be in. On a board with only the
graphics LCD the startup file installs `GLCD.SVC`, and the load of
`COUNT.SVC` then fails with `COUNT.SVC?`. A copy of `COUNT` that declares 9
for the BDOS fails on its own, on any board. This run leaves out the lines
that assemble it:

<!-- sed 's/^\tDB\t2,2,2/\tDB\t9,2,2/;s/COUNT   "\t; the name/CHEAT   "\t; the name/' count.asm > cheat.asm; node tools/tecvol.mjs put svc.img B cheat.asm --text; node tools/capture.mjs --card svc.img B: "TAS CHEAT CHEAT.SVC" CHEAT.SVC SERVICES -->
```text
B>CHEAT.SVC
CHEAT.SVC?

B>SERVICES
B>
```

The figures are the programmer's count, and the loader can't check them. A
program's own stack can't be checked either, so a service's documentation
states what it needs there. A service running on the BDOS's stack may not
call the BDOS, so a hook on `CONOUT` can't print through function 9.

## Publishing a record

To read the count, as `CHARS` did in the run above, a program needs a way
to find it. A service reaches programs by publishing named records in
TEC-OS's *registry*, a linked list with its head in TEC-OS's workspace. A
record is 13 bytes in the service's own memory:

| Offset | Bytes | Contents |
| ---: | ---: | --- |
| 0 | 2 | The next record, 0 at the last |
| 2 | 8 | The record's name, padded with spaces |
| 10 | 1 | Its interface version |
| 11 | 2 | Its entry table's address |

`INIT` returns the address of its first record in `HL`, and the records are
linked through their first words. `COUNT` has one, `REC`. The loader writes
the link when it joins the list to the older records. The loader tests that
each record and its table's address lie in the service's pages, but it can't
test what is in a table. A find or a list walks 256 records at most. One
service may therefore publish at most 255, and a service whose records would
take the registry past 256 is rejected. A rejected service's `REMOVE` undoes
its `INIT`, and the load fails with the name and a question mark.

The layout of an entry table is the service's own, and the record's name
and version identify it. Version 1 of `COUNT`'s table is one `JP`, at offset
0, to a routine that returns the count in `HL`. A later version can add
entries after it. A program or service that names version 1 still works,
because a find takes any record at that version or above.

A client is a program or service that uses a record. It finds the table
with `FIND`, service 13, which `abi.inc` names `TNFIND`. The call takes `C`
= 13, `DE` at the 8-byte name and `B` holding the least version, through
`ABICALL`. It returns carry clear with the table in `HL`, or carry set if
there is no such record. `CHARS` is a client, and it uses the routines in
`HWLIB.ASM`:

```asm
; CHARS: print the count that COUNT.SVC publishes, in hex.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW	; prints and ends the program
	LD	DE,NAME		; the record's eight-byte name
	LD	B,1		; the least interface version
	LD	C,TNFIND	; the registry's find
	CALL	ABICALL
	LD	DE,NONE
	JP	C,SAY		; carry: no such record, so print and end
	CALL	CALLHL		; offset 0 of the table: HL = the count
	PUSH	HL		; the low byte, for after the label
	LD	A,H		; the high byte first
	LD	DE,MSG		; the label
	CALL	LABHEX		; A is the high byte
	POP	HL
	LD	A,L		; the low byte, on the same line
	CALL	HEX
	LD	DE,CRLF		; end the line
	JP	SAY		; prints and ends the program

; Call the routine at HL, whose RET returns to the caller of CALLHL. Changes
; what that routine changes.
CALLHL:	JP	(HL)

NAME:	DB	"COUNT   "	; the record to find
NONE:	DB	"no COUNT "	; printed when there is no record
	DB	"record"
	DB	13,10,"$"
MSG:	DB	"count $"	; the label before the count
CRLF:	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

The Z80 has no indirect call, so a `CALL` to a `JP (HL)` does the job. The
test at the top comes first because the service numbers hold on TEC-OS with
ABI 5 alone. On any other system a call to `C008h` would run whatever is
there. In the transcript above, `no COUNT record` is what `CHARS` printed
once the service had gone.

`LIST`, service 14, `TNLIST`, enumerates the registry. With `B` a number
from 0, it returns the record itself in `HL`, the newest first, and carry
set past the last. `RECS` lists every record:

```asm
; RECS: list the registry, newest record first: each record's name, its
; interface version and the address of its entry table.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; the numbers below hold only on ABI 5
	JP	NZ,NOTHW
NEXT:	LD	A,(INDEX)	; the next record's number
	LD	B,A		; B = that number
	LD	C,TNLIST	; the registry's enumerate
	CALL	ABICALL
	RET	C		; carry: past the last record
	LD	A,(INDEX)	; the next one, for the next round
	INC	A
	LD	(INDEX),A
	CALL	SHOW		; one line for this record
	JR	NEXT		; until the carry above

; Print the record at HL on one line. Changes AF, BC, DE and HL.
SHOW:	INC	HL		; past the link word
	INC	HL		; HL = the name
	LD	B,8		; the eight bytes of the name
SHOW1:	LD	E,(HL)		; BDOS console output
	LD	C,2
	PUSH	BC		; the BDOS changes these
	PUSH	HL
	CALL	BDOS
	POP	HL
	POP	BC
	INC	HL		; the name's next byte
	DJNZ	SHOW1
	LD	A,(HL)		; the version, after the name
	INC	HL		; HL = the table's word
	LD	DE,VERS
	CALL	LABHEX		; LABHEX and HEX keep HL
	LD	E,(HL)		; DE = the table's address
	INC	HL
	LD	D,(HL)
	EX	DE,HL		; HL = it, which HEX keeps
	LD	A,H		; high byte first
	LD	DE,TABL
	CALL	LABHEX
	LD	A,L		; the low byte, on the same line
	CALL	HEX
	LD	DE,CRLF		; end the line
	JP	SAY		; its RET is this routine's

INDEX:	DB	0
VERS:	DB	" version $"
TABL:	DB	" table $"
CRLF:	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

`recs.asm` goes on the card as the others did. On the web page's board the
startup file's `GLCD.SVC` line installs nothing while the PICO9918 is the
console, so `COUNT.SVC` loads. With `COUNT.SVC` from `makeSvc` on the card,
`RECS` then finds two records:

<!-- node tools/capture.mjs --card svc.img --board pico B: "TAS RECS" COUNT.SVC RECS -->
```text
A>B:
B>TAS RECS
RECS.COM written

B>COUNT.SVC

B>RECS
COUNT    version 01 table B85F
PICO     version 03 table BBE3

B>
```

`PICO` is the record of the ROM's PICO9918 console. Cold boot registers it
where that console starts, and no `UNLOAD` takes it. Its table holds the
graphics entries a program uses under the claim of Chapter 10, and Appendix
B lists them. A service may publish several records or none. `GLCD.SVC`
publishes none, so `RECS` doesn't show it. When two services publish the
same name, a find returns the newer, and `UNLOAD` of that one uncovers the
older.

## Depending on another service

A table's address is good only while its service is in, and what a client
may do with it depends on what the client is:

- A program may keep it until it exits. `UNLOAD` is a CCP command, so no
  service can go while a program runs.
- A service that needs another names the record as a dependency and may
  keep the pointer. The dependency must be installed first, so it sits above
  the dependent in memory. Only the lowest service can go, so the dependent
  goes first.
- A service that finds a record later, after its own `INIT`, may not keep
  the pointer, because removal frees the pages and a kept pointer then runs
  whatever is there. It finds the record each time, or compares the
  generation.

The *generation* is a byte that each removal raises by one, and `TNFIND` and
`TNLIST` return it in `A`. A service that kept a pointer compares the
generation it stored with the one a find returns now. A difference means
that some service has gone. The byte wraps, so after exactly 256 removals a
stale pointer passes the comparison.

A dependency is 9 bytes: the least version, then the record's name. In a
`TAS` source they come at the end, after a label `DEPS`. `TAS` counts them
for the header, keeps them out of the image and writes them after it.
`NEEDS.SVC` does nothing but bind to `COUNT`:

```asm
; NEEDS.SVC: a service that names COUNT's record as a dependency and binds to
; it once, at INIT. Its own entry would use TABLE.
%INCLUDE "ABI.INC"

	ORG	$0100
HDR:	DB	'D',SVCFMT,0,1	; the tool writes the dependency count
	DW	0,0,0,0		; REMOVE, size, extra memory, relocation
	DB	0,0,0		; no stack bytes added
	DW	0		; INIT
	DB	"NEEDS   "

; Find COUNT's table and keep it. Returns HL = 0, no record, carry clear.
; Changes AF, BC and DE.
INIT:	LD	DE,NAME		; the same name and version as the dependency
	LD	B,1
	LD	C,TNFIND	; the registry's find
	CALL	ABICALL
	RET	C		; the loader has checked this already
	LD	(TABLE),HL	; safe to keep: COUNT can't leave first
	LD	HL,0		; no record of its own
	OR	A
	RET

; Nothing to undo. Returns carry clear.
REMOVE:	OR	A		; carry clear: removal goes ahead
	RET

NAME:	DB	"COUNT   "	; the record to find
TABLE:	DW	0		; the table, once found
DEPS:	DB	1,"COUNT   "	; the least version, then the record's name
```

The loader checks each dependency before it changes anything, so `INIT`'s
find can't fail. With no `COUNT.SVC` in, the load fails. With `COUNT.SVC`
in, the two go in and come out last in, first out:

<!-- node tools/tecvol.mjs put svc.img B needs.asm --text; node tools/capture.mjs --card svc.img B: "TAS NEEDS NEEDS.SVC" NEEDS.SVC COUNT.SVC NEEDS.SVC SERVICES UNLOAD UNLOAD SERVICES -->
```text
A>B:
B>TAS NEEDS NEEDS.SVC
NEEDS.SVC written

B>NEEDS.SVC
NEEDS.SVC?

B>COUNT.SVC

B>NEEDS.SVC

B>SERVICES
NEEDS 1
COUNT 1
B>UNLOAD

B>UNLOAD

B>SERVICES
B>
```

The first `UNLOAD` removes `NEEDS`, the lowest, and only then can the second
remove `COUNT`. That order is what lets `NEEDS` keep the pointer it found at
`INIT`. The table it holds is in pages that can't be freed while `NEEDS` is
in.
