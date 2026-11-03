---
title: PRL programs and services
parent: TEC-OS
nav_order: 10
nav_group: "Part I: Using and programming TEC-OS"
---

# 10. PRL programs and services

Checked against TEC-OS 60cfbdc. The programs were assembled by the starter
card's `TAS.COM`, from Thorium dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

Every program written so far has been a `.COM` file, which runs at `0100h` and
is gone when it ends. This chapter describes two other kinds of file. A `.PRL`
file is a program in a relocatable format, and a `.SVC` file stays in memory
after its command ends. You first make a PRL. You then write a service that
counts the console's characters, install it, measure what it costs and publish
the count for a program to find. Chapter 21 explains the relocation data in
both files, and Chapter 20 the loader.

## PRL programs

A PRL file is in Digital Research's page relocatable format: a program's code
and a bitmap of the bytes that hold addresses, in the layout Chapter 21 gives.
The bitmap is for a loader that puts the code somewhere else. To run the code
at page `p`, such a loader adds `p - 1` to every byte whose bit is set.

TEC-OS's loader never does this, because a program on TEC-OS always runs at
`0100h`, where the code was made to run. The loader moves the code down over
the header and starts it with no byte of it changed, so on TEC-OS a PRL does
what a `.COM` file does and takes more room on the card and in memory.

`TAS` doesn't write PRL files, but the repository's `makePrl` does, from the
source of a program. Here it makes one from `area.asm`, the `AREA` program of
Chapter 7, on a copy of the starter card that later sections use too:

```sh
cp dist/starter.img svc.img
node tools/tecvol.mjs put svc.img B dist/abi.inc --text
node tools/tecvol.mjs put svc.img B area.asm --text
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { makePrl } from "./tools/lib/prl.mjs";
writeFileSync("AREA.PRL", await makePrl("area.asm", "build/prl"));
'
node tools/tecvol.mjs put svc.img B AREA.PRL
```

`makePrl` assembles the source twice, and for the second assembly it rewrites
the source's `ORG` line. The source must therefore have the line `ORG $0100`,
indented and spelt that way, with no comment on it, exactly once. With no such
line the tool stops with `has no "ORG $0100" line`, so `ORG 100H` won't do,
although it means the same to the assembler. Only the first of two such lines
is rewritten. The file for `AREA` is 339 bytes: a header of 256 bytes, 73
bytes of code and 10 of bitmap.

With no `AREA.COM` on the drive, the CCP looks for `AREA.PRL` and runs that:

<!-- node tools/capture.mjs --card svc.img B: "DIR AREA.*" AREA -->
```text
A>B:
B>DIR AREA.*
AREA.ASM     AREA.PRL    
2 files, 8164K free
B>AREA
46869 bytes

B>
```

A file `NAME.COM` beside `NAME.PRL` is the one that runs. The whole file is in
memory before the code moves, so the largest PRL program is smaller than the
largest `.COM` file. Chapter 21 explains this with the figures.

## Code that stays

A program's memory is reused as soon as it ends, so nothing of it runs after
that. A *service* stays. TEC-OS reads a `.SVC` file into pages below the BDOS,
in the service resident memory, and lowers the word at `0006h` below them, as
Chapter 5 describes. The code stays there through every warm boot until a
reset or `UNLOAD`, and from there it can change the BIOS jump table, so that
its own code runs under whatever program comes next. A service can also be a
*library*, with routines for programs to share, and the example here does
both.

The BIOS jump table is in RAM, at `BF00h`, and Chapter 15 lists its entries. The
word at `0001h` holds the address of its `WBOOT` entry. Each entry is a 3-byte
`JP`, and warm boot leaves the table in EXPAND 0 as it is, so a changed entry
lasts through every warm boot. The BDOS reaches the console and the disk
through those entries, so a replaced entry receives the console output of a
program and of the CCP. `PUTAT` and the ROM's own messages go straight to the
ROM's routines and miss the entry. A *hook* on an entry is a routine that does its own
work and then jumps to the address the entry held.

`COUNT.SVC` hooks `CONOUT` and counts the characters that pass through it:

```asm
; COUNT.SVC: count the characters that reach the BIOS's CONOUT, and publish
; the count in a record. REMOVE puts CONOUT back.
	ORG	$0100
HDR:	DB	'D',3,0,1	; magic, format, no dependencies, removable
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
data at `0100h`. A service sets a few of its fields and leaves the rest at 0,
for the tool that makes the file, `TAS` or `makeSvc`, to fill in. The tool
finds `INIT` and `REMOVE` by those label names, and every service has both,
even one that `UNLOAD` can't remove. `makeSvc` stops with `INIT and REMOVE
required` if either is missing. The flags byte's bit 0 lets `UNLOAD`
remove the service, and bits 1 to 7 claim restart vectors, as the rules below
explain. A service that needs a buffer past its image gives the
size as its extra memory, and the loader sets aside that many bytes, not
cleared. The name, 8 bytes padded with spaces, is what `SERVICES` prints.

| Offset | Bytes | Contents | Written by |
| ---: | ---: | --- | --- |
| 0 | 1 | The letter `D`, `44h` | the source |
| 1 | 1 | The format, 3 | the source, and `makeSvc` writes 3 over it |
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
relocation data, which Chapter 21 describes. A file's end is rounded up to a
whole record on the card, and the loader ignores what follows the relocation
data.

### INIT

`INIT` runs once, after the loader has put the service in its pages and
adjusted the addresses in the image. `CONSLOT` finds `CONOUT`'s entry from the
word at `0001h`. After the `WBOOT` entry come `CONST`, `CONIN` and `CONOUT`, so
`CONOUT`'s `JP` is at the word's value plus 9, and the `+ 1` steps past the
`JP`'s opcode to the two bytes of its target. `INIT` saves those two bytes in
`OLDCO` and writes the address of `MYCO` over them.

A return with carry clear means that the service is ready, and `HL` gives its
record, which a later section describes. A service that publishes no record
returns `HL` = 0. `test/programs/res.asm` in the repository does this: that
file is this hook with no record.

### The hook

`MYCO` runs inside every call of the `CONOUT` entry. `CONOUT` takes its
character in `C`, and `MYCO` puts back the one register it uses, so the entry
it replaced runs with the registers it would have had. `MYCO`'s last instruction is a `JP`
written as data, whose target is `OLDCO`, the two bytes `INIT` filled in, so
the old `CONOUT` returns straight to the caller.

### REMOVE

`REMOVE` undoes `INIT`, and `UNLOAD` calls it. A return with carry clear lets
the removal go ahead, and carry set stops it with nothing changed, which is
how `PICO.SVC` stays while the PICO9918 is the console.

## Assembling and installing

Assembling a service follows Chapter 9's route, with the output named.
`TAS NAME OUT.TYP` writes the output file named. For the output type `.SVC` it
fills in the header's fields and the relocation data, and for any other type it
writes a flat image, except that it refuses `.DBG` and a type that starts with
`$`. So `TAS COUNT COUNT.SVC` writes the
service, in place of any `COUNT.SVC` already on the drive.

`count.asm` and `chars.asm` go on the card, along with `HWLIB.ASM` from
Chapter 9. `chars.asm` reads the count that `COUNT.SVC` publishes, and it is
listed under "Publishing a record":

```sh
node tools/tecvol.mjs put svc.img B hwlib.asm --text
node tools/tecvol.mjs put svc.img B count.asm --text
node tools/tecvol.mjs put svc.img B chars.asm --text
```

The run assembles `AREA` and `CHARS`, then the service:

<!-- node tools/capture.mjs --card svc.img B: "A:TAS AREA" "A:TAS CHARS" "A:TAS COUNT COUNT.SVC" AREA COUNT.SVC SERVICES AREA CHARS CHARS UNLOAD SERVICES AREA CHARS -->
```text
A>B:
B>A:TAS AREA
AREA.COM written

B>A:TAS CHARS
CHARS.COM written

B>A:TAS COUNT COUNT.SVC
COUNT.SVC written
```

`AREA` now measures the TPA before and after the service, and
`UNLOAD` takes it out again. The rest of the same run:

<!-- the same run, continued -->
```text
B>AREA
46869 bytes

B>COUNT.SVC

B>SERVICES
COUNT 1
B>AREA
46592 bytes

B>CHARS
count 003A

B>CHARS
count 0052

B>UNLOAD

B>SERVICES
B>AREA
46869 bytes

B>CHARS
no COUNT record

B>
```

The file is 100 bytes of header and image and 11 of relocation data. It takes
a whole page, so `SERVICES` shows 1 page. The TPA falls by 277 bytes, that page
and the 21 bytes from `B800h` to `B814h`, and `UNLOAD` gives them back. The count rose by 18h, 24, between the two
`CHARS` commands, the characters the console printed in between, because the
hook stayed through each program's warm boot.

On a PC the repository's `makeSvc` does the same job as `TAS`, by the two
assemblies that `makePrl` uses, so it needs the same `ORG $0100` line. It writes
the same 111 bytes, where `TAS`'s file is rounded up to the record's 128:

```sh
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { makeSvc } from "./tools/lib/svc.mjs";
const { file } = await makeSvc("count.asm", { work: "build/svc" });
writeFileSync("COUNT.SVC", file);
'
node tools/tecvol.mjs put svc.img B COUNT.SVC
```

## The rules for INIT and REMOVE

The rules for `INIT` and `REMOVE` come from what the loader can and can't put
right. Chapter 20 describes the code.

`INIT` returns carry set only after undoing everything it did, and the load
then fails with the name and a question mark. `GLCD.SVC` and `PICO.SVC` fail
this way on a board without their display. `INIT` makes its hooks last, as
`COUNT` does, because a warm boot during `INIT` takes the pages back with no
call to the service, and a hook already made would then point into free
memory. A call of function 47 from `INIT` or `REMOVE` is a warm boot there: its
line runs, from `INIT` the load rolls back, and from `REMOVE` the service stays
listed.

After a failed `INIT` the loader reads the 17 entries of the BIOS jump table for
one that points into the service. If it finds one it keeps the pages, marks
them as not removable and publishes no record. The scan covers the BIOS jump table
alone, so the service itself must undo a vector anywhere else, such as a video
table handed to `ABIGLCD`. The restart vectors have the rules given below.

`REMOVE` restores hooks in the reverse order of `INIT`. Only the lowest service
can go, so when each `REMOVE` puts back what its `INIT` found, a hook on a hook
comes off in the right order. `UNLOAD` calls `REMOVE` from the CCP, so no
program is running. `REMOVE` may also run after a good `INIT` whose records
the loader rejected.

While `INIT` or `REMOVE` runs, another load or removal is rejected. No command
can reach that case, and the test stops a service that calls the ROM's
routines by their addresses.

A service can keep a handler in a restart vector. Flags bits 1 to 7 claim
`RST 1` to `RST 7`, the vectors at `0008h` to `0038h`, and `INIT` writes the `JP`
itself. A load whose claimed vector holds a `JP` fails with nothing changed, and
a jump into the ROM that a finished program left there counts until a reset. The
loader reads only the flags, so a vector `INIT` writes without claiming it goes
unseen.

At cold boot, at every warm boot, after an unload and after a failed `INIT`, a
sweep of `0008h` to `003Fh` keeps a `JP` whose target's page is at or above the
page of the word at `0006h`, and gives anything else its default: seven zeros and
a `RET`, or `EI` and `RETI` at `0038h`. A handler in the service's pages therefore
stays through warm boots and goes with the service. `UNLOAD` also gives each
claimed vector its default, whatever it holds. `REMOVE` restores any jump the
service set in a vector it didn't claim and that leads outside its pages. A
failed `INIT` runs no `REMOVE`, so `INIT` restores such a jump itself and turns
off any source of interrupts it started. A warm boot inside `INIT` leaves that
source on.

Nothing in the ROM turns interrupts on. Cold boot and warm boot leave them off,
and each routine that masks them puts back the state it found, so a handler at
`0038h` runs after a warm boot only once a program or a service sets `EI`.

A service calls the ROM only through the ROM table at `C003h`, with
`abi.inc`'s names, because the addresses behind it change from one build to
the next. `makeSvc` rejects a source that writes a ROM address in hexadecimal,
but `TAS` makes no such test. A service makes no test of the table's version,
since a file of format 3 loads only on a ROM with this table.

## Stacks

A service's code runs on its caller's stack, and TEC-OS's three stacks are
small, so each header gives the bytes the service adds to each of them, in the
order BDOS, BIOS, CCP. `MYCO` pushes one word while it runs inside `CONOUT`,
and `CONOUT` can be called on any of the three, so `COUNT` declares 2, 2 and 2.

The loader adds each figure to those of the services already in, and the load
fails if a sum would pass the limit: 8 bytes on the BDOS's stack, 12 on the
BIOS's and 6 on the CCP's. At this commit `GLCD.SVC` declares 6 for the CCP's,
so it and `COUNT.SVC` can't both be in. A copy of `COUNT` that declares 9 for
the BDOS fails on its own, on any board. This run leaves out the lines that
assemble it:

<!-- sed 's/^\tDB\t2,2,2/\tDB\t9,2,2/;s/COUNT   "\t; the name/CHEAT   "\t; the name/' count.asm > cheat.asm; node tools/tecvol.mjs put svc.img B cheat.asm --text; node tools/capture.mjs --card svc.img B: "A:TAS CHEAT CHEAT.SVC" CHEAT.SVC SERVICES -->
```text
B>CHEAT.SVC
CHEAT.SVC?

B>SERVICES
B>
```

The figures are the programmer's count, and the loader can't check them. A
program's own stack can't be checked either, so a service's documentation
states what it needs there. A service running on the BDOS's stack may not call
the BDOS, so a hook on `CONOUT` can't print through function 9.

## Publishing a record

To read the count, as `CHARS` did in the run above, a program needs a way to
find it. A service reaches programs by publishing named *records* in TEC-OS's
*registry*, a linked list with its head in TEC-OS's workspace. A record is 13
bytes in the service's own memory:

| Offset | Bytes | Contents |
| ---: | ---: | --- |
| 0 | 2 | The next record, 0 at the last |
| 2 | 8 | The record's name, padded with spaces |
| 10 | 1 | Its interface version |
| 11 | 2 | Its entry table's address |

`INIT` returns the address of its first record in `HL`, and the records are
linked through their first words. `COUNT` has one, `REC`, and the loader
writes the link when it joins the list to the older records. The loader checks
that each record and its table's address lie in the service's pages, but it
can't check what is in a table.

The layout of an entry table is the service's own, and the record's name and
version identify it. Version 1 of `COUNT`'s table is one `JP`, at offset 0, to
a routine that returns the count in `HL`. A later version can add entries
after it, and a program or service that names version 1 still works, because a
find takes any record at that version or above.

A client is a program or service that uses a record. It finds the table with
`ABISVC`, the ROM table's entry at `C015h`. The call takes `C` = 0, `DE` at
the 8-byte name and `B` holding the least version. It returns carry clear with
the table in `HL`, or carry set if there is no such record. `CHARS` is a
client, and it uses the routines in `HWLIB.ASM`:

```asm
; CHARS: print the count that COUNT.SVC publishes, in hex.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; ABISVC is at C015h on ABI 4 only
	JP	NZ,NOTHW	; prints and ends the program
	LD	DE,NAME		; the record's eight-byte name
	LD	B,1		; the least interface version
	LD	C,0		; ABISVC's find
	CALL	ABISVC
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
test at the top comes first because `ABISVC` is an address on TEC-OS with ABI
4 alone, and on any other system a call to `C015h` would run whatever is
there. In the transcript above, `no COUNT record` is what `CHARS` printed once
the service had gone.

`ABISVC` also enumerates the registry. With `C` = 1 and `B` a number from 0, it
returns the record itself in `HL`, the newest first, and carry set past the
last. This program lists every record:

```asm
; RECS: list the registry, newest record first: each record's name, its
; interface version and the address of its entry table.
BDOS	EQU	$0005
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; ABISVC is at C015h on ABI 4 only
	JP	NZ,NOTHW
NEXT:	LD	A,(INDEX)	; the next record's number
	LD	B,A		; B = that number
	LD	C,1		; ABISVC's enumerate
	CALL	ABISVC
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

`recs.asm` goes on the card as the others did. On the web page's board, with
`COUNT.SVC` from `makeSvc` on the card, it finds two records:

<!-- node tools/capture.mjs --card svc.img --board pico B: "A:TAS RECS" COUNT.SVC RECS -->
```text
A>B:
B>A:TAS RECS
RECS.COM written

B>COUNT.SVC

B>RECS
COUNT    version 01 table B15F
PICO     version 02 table B219

B>
```

`SERVICES` lists services, and a service may publish several records or none.
`GLCD.SVC` publishes none, so `RECS` doesn't show it. When two services
publish one name, a find returns the newer, and `UNLOAD` of that one uncovers
the older.

## Keeping a pointer

A table's address is good only while its service is in, and what a client may
do with it depends on what the client is:

- A program may keep it until it exits. `UNLOAD` is a CCP command, so no
  service can go while a program runs.
- A service that needs another names the record as a dependency and may keep
  the pointer. The dependency must be installed first, so it sits above the
  dependent in memory. Only the lowest service can go, so the dependent goes
  first.
- A service that looks a record up later, after its own `INIT`, may not keep
  the pointer, because removal frees the pages and a kept pointer then runs
  whatever is there. It looks the record up each time, or compares the
  generation, a byte described below.

The *generation* is a byte that each removal raises by one, and `ABISVC`
returns it in `A` from both calls. A service that kept a pointer compares the
generation it stored with the one `ABISVC` returns now, and a difference means
that some service has gone. The byte wraps, so after exactly 256 removals a
stale pointer passes the comparison.

A dependency is 9 bytes: the least version, then the record's name. In a `TAS`
source they come at the end, after a label `DEPS`, and `TAS` counts them for
the header, keeps them out of the image and writes them after it. `NEEDS.SVC`
does nothing but bind to `COUNT`:

```asm
; NEEDS.SVC: a service that names COUNT's record as a dependency and binds to
; it once, at INIT. Its own entry would use TABLE.
%INCLUDE "ABI.INC"

	ORG	$0100
HDR:	DB	'D',3,0,1	; the tool writes the dependency count
	DW	0,0,0,0		; REMOVE, size, extra memory, relocation
	DB	0,0,0		; no stack bytes added
	DW	0		; INIT
	DB	"NEEDS   "

; Find COUNT's table and keep it. Returns HL = 0, no record, carry clear.
; Changes AF, BC and DE.
INIT:	LD	DE,NAME		; the same name and version as the dependency
	LD	B,1
	LD	C,0		; ABISVC's find
	CALL	ABISVC
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

The loader checks each dependency before it changes anything, so `INIT`'s find
can't fail. With no `COUNT.SVC` the load fails. With `COUNT.SVC` in, the two go
in and come out last in, first out:

<!-- node tools/tecvol.mjs put svc.img B needs.asm --text; node tools/capture.mjs --card svc.img B: "A:TAS NEEDS NEEDS.SVC" NEEDS.SVC COUNT.SVC NEEDS.SVC SERVICES UNLOAD UNLOAD SERVICES -->
```text
A>B:
B>A:TAS NEEDS NEEDS.SVC
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

## The PICO record

`PICO.SVC`, at each width, publishes the record `PICO`, version 2, which is
how another service or a program finds the driver. Its table starts with the
eight words it hands to `ABIGLCD`, and four words follow them, at offsets 16
to 22. `abi.inc` names them `PICOREG`, `PICOFIL`, `PICOWR` and `PICORD`, and
[Appendix B](appendix-b-rom-services.md) lists their registers. They write a
register of the PICO9918's video chip, fill VRAM and copy between RAM and VRAM.

A caller of these entries must hold the claim of Chapter 9, as a program
writing the ports must, and the entries check nothing. `VTEST` claims the
PICO9918, writes four bytes to VRAM, reads them back into a buffer, releases
the chip and then prints what came back:

```asm
; VTEST: write four bytes to the PICO9918's VRAM and read them back through
; PICO.SVC's graphics entries.
BDOS	EQU	$0005
VRAM	EQU	$3000		; an address the text modes leave alone
%INCLUDE "ABI.INC"

	ORG	$0100
	CALL	CHKHW		; ABISVC is at C015h on ABI 4 only
	JP	NZ,NOTHW
	LD	DE,NAME		; the record's eight-byte name
	LD	B,2		; version 2 has the graphics entries
	LD	C,0		; ABISVC's find
	CALL	ABISVC
	LD	DE,NONE
	JP	C,SAY		; carry: no such record, so print and end
	LD	(TABLE),HL	; good until this program exits
	LD	B,1		; claim the PICO9918
	LD	C,HWVIDEO
	CALL	ABIHW
	LD	HL,VRAM		; PICOWR: BC bytes from DE to VRAM at HL
	LD	DE,DATA		; the bytes to write
	LD	BC,4
	LD	A,PICOWR	; the entry's offset in the table
	CALL	ENTRY
	LD	HL,VRAM		; PICORD: BC bytes from VRAM at HL to DE
	LD	DE,BACK		; where to put them
	LD	BC,4
	LD	A,PICORD	; the entry's offset in the table
	CALL	ENTRY
	LD	B,0		; give it back: the console's screen returns
	LD	C,HWVIDEO
	CALL	ABIHW
	LD	DE,BACK		; the four bytes, as text
	JP	SAY		; prints and ends the program

; Run the table's entry at offset A, with its arguments in BC, DE and HL.
; Changes what the entry changes.
ENTRY:	PUSH	HL		; the entry's HL
	PUSH	DE		; and its DE
	LD	E,A		; DE = the offset
	LD	D,0
	LD	HL,(TABLE)
	ADD	HL,DE		; HL = the entry's word
	LD	E,(HL)
	INC	HL
	LD	D,(HL)
	EX	DE,HL		; HL = the routine
	POP	DE		; the entry's DE back
	EX	(SP),HL		; the routine goes on the stack, HL comes back
	RET			; a jump to it, with HL free

TABLE:	DW	0		; the table, once found
NAME:	DB	"PICO    "	; the record to find
NONE:	DB	"no PICO "	; printed when there is no record
	DB	"record"
	DB	13,10,"$"
DATA:	DB	"VRAM"		; the four bytes to write
BACK:	DB	"????"		; PICORD fills these four
	DB	13,10,"$"
%INCLUDE "HWLIB.ASM"
```

These entries are words, where `COUNT`'s table holds a `JP`, so `ENTRY` reads
the word at the offset. `EX (SP),HL` and `RET` then jump to the routine with
`HL` restored for it, as the hardware services' dispatcher does in Chapter 20.
`TABLE` needs no generation test, because the program ends before any service
can go.

<!-- node tools/tecvol.mjs put svc.img B vtest.asm --text; node tools/capture.mjs --card svc.img --board pico B: "A:TAS VTEST" VTEST -->
```text
A>B:
B>A:TAS VTEST
VTEST.COM written

B>VTEST
VRAM

B>
```

The record exists only while the driver is in, so on the serial board the
program prints `no PICO record`. It prints the same on a board with a PICO9918
and no matrix keyboard, where the driver's load fails. A program on such a
board claims the chip and writes the ports.
