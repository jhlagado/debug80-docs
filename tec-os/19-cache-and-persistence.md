---
title: Cache and persistence
parent: TEC-OS
nav_order: 19
nav_group: "Inside TEC-OS"
---

# 19. Cache and persistence

<!-- Mechanisms inspected by source text at TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Unprefixed citations use that revision. Historical READ/SAVE timings
     retain their recorded 78127ec run. CLOOK costs retain 60cfbdc and the
     larger-file/write-order examples retain 5a25178. Specific run records
     and endpoint methods are accounted for in 18-pass-record.md.
     The READ listing/recipe and nodata.img failed-close fixture are historical.
     The listed 24-byte READ program was used by the recorded timing work.
     No TED workflow is implied by its presence on a historical starter card.
     No import, assembly, build, test, capture or measurement was performed.
     No current font/default, KS48 workflow or hardware result is qualified.
     Coalescing update: the section "A pending block on a volume written
     through" and the citations prefixed fdd9e5b: use TEC-OS
     fdd9e5b9a241af2a740d7baac2673f9ddd181bf9 (main), source reading with
     docs/recovery.md. Its card-write counts and the BOUNCE compile time are
     the host-model measurements recorded for fdd9e5b in Origo KD-303,
     not runs made for this chapter. -->

A program can finish writing a record while its newest bytes are still only in
RAM. The block cache makes that possible by collecting records into card blocks.
Its write policy determines when a successful call also means that the block has
reached the card.

The historical host-model block read took about 55 milliseconds at `78127ec`,
with bits passing through a port one at a time. Chapter 18 explains that
transfer. A CP/M program reads the same blocks again and again, the directory
above all. The block cache keeps what it has read in EXPAND 1 so that a later
read is a memory copy while that block remains cached. Every write goes through
the same cache. At `a1023bd` a successful write on a volume written through
returned after its line had reached the card. At TEC-OS `fdd9e5b` such a volume,
A among them, holds one pending block and writes it at the next flush point, as
the section on the pending block explains. A volume written behind keeps its
writes in the cache and writes them to the card in batches. Chapter 1 introduced the consequence for
saved work: until a successful flush, the card can lag behind the saved file
(`src/cache.asm:417-429`, `src/cache.asm:546-555`).

## Thirty lines and their table

The cache is 30 lines of 512 bytes, one card block each, at `8000h–BBFFh` in
EXPAND 1 (`src/cache.asm:1-16`, `src/layout.asm:32-42`). Line n starts at
`8000h` plus n times `200h`. `CLADR` works the address out by doubling n and
adding `80h`, which gives the high byte (`src/cache.asm:167-172`).

The cache's table is the next page. From `CTAB`, `BC00h`, each line has four
bytes for the number of its card block, `FFFFFFFFh` while the line is empty.
From `CDIRTY`, `BC80h`, each line has a byte that is nonzero while the line
holds changes the card lacks. A line is therefore empty, clean or dirty. An
empty line has no block. A clean line holds a block the card has too and a dirty
line holds a block whose newest bytes are only here. Every line is empty after a
cold boot. The boot clears EXPAND 1 and marks each line empty before it mounts
the card, as [Chapter 16](16-reset-and-boot.md) describes
(`src/boot.asm:77-77`, `src/boot.asm:232-249`). The mount then reads the
container's table into a line, an ordinary clean one that `CTAKE` gives out
again in turn (`src/vol.asm:378-414`). Chapter 18 explains the mount.

The lines are keyed by the block's number on the card, `SDLBA`, and not by
drive and block within the volume. The absolute card address identifies a
block independently of the drive used to reach it. The lookup therefore
prevents two lines from holding separate copies of the same block
(`src/cache.asm:48-92`).

The cache's lines and table are in EXPAND 1. Its four other bytes of state are
in the resident workspace above the RAM BIOS table (`src/ram.asm:323-329`):

- `CNEXT`, the next line to give out
- `CWTYPE`, the write type of the current BIOS `WRITE`, with bit 7 set for a
  volume written through and bit 6 once a line has been given out for the
  write
- `CIFF`, the interrupt state at the current BIOS call's entry

To reach the table, a routine takes from `CXON` the latch value with
`LATEXP` ORed into `LATCHV` and writes it to the latch. It reads or writes
the bytes with no `PUSH`, `POP` or `CALL` in between, then puts `LATCHV`
back (`src/cache.asm:29-40`). [Chapter 15](15-state-and-memory.md#expand-1-and-the-stack-boundary) explains why no
stack may be used while EXPAND 1 is in view.

## A record read through the cache

Every volume's reads go through the cache. BIOS `READ` maps the record to a card
block and a quarter of it and calls `CREAD` (`src/bios.asm:223-227`,
`src/cache.asm:405-416`). `CLOOK` compares `SDLBA` with each line's block number
in turn, from line 0 (`src/cache.asm:48-92`). On a hit, `CRDREC` copies the
record's 128 bytes from the line to the DMA address. On a miss, `CTAKE` gives
out a line, `CFILL` reads the card block straight into it and the record is then
copied from the line.

The block goes from the card into EXPAND 1 with no copy through another buffer.
`CFILL` sets `SDXB` to `LATEXP` for the call and `SDREAD`'s byte loop puts
EXPAND 1 in view while it fills the buffer (`src/cache.asm:184-202`,
`src/sd.asm:466-475`). A failed read leaves the line empty.

`CTAKE` gives out lines in turn (`src/cache.asm:311-357`). A clean line can be
given out at any time, since the card has the same bytes. A dirty line has to
reach the card first. So `CTAKE` starts at `CNEXT` and gives out the first clean
line from there on. It passes over dirty ones and wraps from line 29 to line 0.
It sets `CNEXT` to the line after the one it gave out. When every line is dirty,
`CTAKE` writes the line at `CNEXT` to the card first and gives out that one. The
order is round-robin and not least recently used. A block that is read often is
still given up when its turn comes and read again from the card at its next use.

In the retained `78127ec` starter-card run, a BIOS read in `DIR` that hit
took 13,718 T-states, with its record going to the directory buffer
`DIRBUF`. A read in `DIR B:` that missed took 235,357. These are examples of
complete BIOS reads, including lookup and copying.

A separate `60cfbdc` measurement timed `CLOOK` itself at 259 T-states for a
block in line 0 and 1,979, about 2,000, for the full search. Those earlier
routine costs are not a breakdown of the `78127ec` read.

`CRDREC` and `CWRREC` put the two banks in `XMDST` and `XMSRC` as 0 for the
program's view and 1 for EXPAND 1. Both then call `MVCOPY`, the cache's copy
routine (`src/cache.asm:369-394`). A copy within a
single bank is one `LDIR` with that bank in view (`src/cache.asm:612-616`,
`src/cache.asm:709-715`). A copy between EXPAND 1 and an address in EXPAND
0, such as `DIRBUF`, can't have both ends in view. The two banks share the
one window. The part of the bank-0 end below `8000h` is in view whatever the
latch holds. That part goes by one `LDIR` with EXPAND 1 selected
(`src/cache.asm:617-671`). The part in EXPAND 0 goes a byte at a time, with
the latch switched between each read and its write
(`src/cache.asm:674-703`). The copy uses no stack while EXPAND 1 is in view,
because the caller's stack may be in EXPAND 0 (`src/cache.asm:12-16`).
`MVEND` writes `LATCHV` back to the latch and enables interrupts only if
they were on at entry (`src/cache.asm:722-736`). A BIOS read to a DMA
address below `8000h` can use the faster fixed-RAM copy path. In the
retained `78127ec` runs of `MOUNT`, a hit took 6,026 T-states and a miss
226,445. A program loaded at `0100h` uses that kind of address too.

In the same historical starter-card run, `DIR` on A made two BIOS reads.
Both hit because the directory blocks were still in the cache after boot.

The historical READ program gives a complete-file comparison. Its 24-byte
binary opens the file named on its command line and repeatedly reads records
to `0080h` with function 20. The listing and preparation commands below are
retained from that example:

```asm
; READ: open the file named on the command line and read it to the end.
BDOS    EQU     $0005
FCB     EQU     $005C           ; the name from the command line
        ORG     $0100
        LD      DE,FCB
        LD      C,15            ; BDOS function 15: open a file
        CALL    BDOS
        INC     A               ; FFh, no such file, becomes 0
        RET     Z
NEXT:   LD      DE,FCB
        LD      C,20            ; BDOS function 20: read a record to 0080h
        CALL    BDOS
        OR      A               ; 0: a record was read
        JR      Z,NEXT
        JP      $0000
```

The historical recipe places READ and a 12,288-byte file on A, with
written-through and written-behind G8M volumes for the later write
comparison:

```sh
npx atom read.asm read.com
head -c 12288 /dev/zero > data.bin
node tools/tecvol.mjs create time.img --volume G1M:SYSTEM:A --volume G8M:THROUGH:B --volume G8M:BEHIND:C:wb
node tools/tecvol.mjs put time.img A read.com
node tools/tecvol.mjs put time.img A data.bin
```

`tools/capture.mjs` prints no T-state count so the figures come from a script
that drives `Machine` as it does. The script reads the model's count, `cycles`
(`host/machine.mjs:265`), twice. The first reading is after `READ
DATA.BIN` has been typed and echoed, before the Return that ends it. The second
is at the next prompt. At `78127ec`, after a cold boot, the command's first run
took 6,642,581 T-states, 1.66 seconds. The next run took 1,343,674, 0.34
seconds, a fifth of the first. Both figures include loading the program from
drive A.

The gain depends on which blocks remain in the cache. In a separate
`5a25178` run, the 15,360-byte file took about 2.0 seconds and then about
2.1. The recorded counts were about 8.19 and 8.41 million T-states. `CTAKE`
had given up each line before the next read reached it. The file data alone
occupied all 30 lines, leaving no room for the directory and program blocks
read along the way.

## A write that reaches the card

At `a1023bd` a volume whose descriptor does not have the written-behind flag
is written through: a successful BIOS `WRITE` returns after the card has
accepted the block
and stopped reporting busy (`src/sd.asm:654-662`). Its record goes into the
block's line by the path the next section describes and `WRITE` sets bit 7 of
`CWTYPE` first. `CWRBH` then writes the line to the card with `CWRITE`
(`src/bios.asm:380-388`, `src/cache.asm:508-536`). A successful card write
leaves that line clean. A failed card write drops it so the next read comes from
the card (`src/cache.asm:552-555`). A failure while obtaining a line earlier in
the call can instead leave an older dirty line for a later retry
(`src/cache.asm:311-357`, `src/cache.asm:430-438`).

A write that is given a line for its block sets bit 6 of `CWTYPE`
(`src/cache.asm:439-440`). `CWRBH` sets `CNEXT` back to such a line once the
card has it from a volume written through (`src/cache.asm:531-536`). The next
line given out is then the same one. A file written through passes through a
single line, block after block, and the cache keeps the lines that hold programs
and directories. The line keeps its block so the block's next record is a hit.

## A pending block on a volume written through

Writing each record through writes a block once for each of its four
records. At TEC-OS `fdd9e5b` a data write on a volume written through, the
BDOS's functions 21, 34 and 40 and `SAVE`, goes into its block's line and
returns once the record is there. BIOS `WRITE` sets bit 5 of `CWTYPE` for
such a write, and `CWCO` records the line in `CPEND`, the line's number plus
one, or 0 when no block is pending. A directory write still sets bit 7 and
goes to the card before it returns (`fdd9e5b:src/bios.asm:336-350`,
`fdd9e5b:src/cache.asm:499-529`, `fdd9e5b:src/ram.asm:303-318`).

At most one block is pending, and it reaches the card at the first flush
point (`fdd9e5b:docs/recovery.md:64-97`):

- the file's close and any other directory request: an open, make, search,
  delete, rename, attribute change, size, login or the extent change inside
  a write. `FNCLSE` and `READDIR` call `CPOUT` first, so the directory never
  names a block whose data is not on the card
  (`fdd9e5b:src/cpm/bdosfile.asm:214-217`, `fdd9e5b:src/cpm/bdoslog.asm:17-19`)
- a BIOS write to another block, on any drive. `BWGET` calls `CPMOVE`, which
  keeps the pending line when the new write is to the same block and
  otherwise writes it with `CPFLSH` (`fdd9e5b:src/bios.asm:342-345`,
  `fdd9e5b:src/cache.asm:568-597`)
- a console read: BDOS functions 1, 10 and 11, function 6 with `E = FFh`,
  and the BIOS's `CONIN`. A program that waits for a key therefore leaves
  nothing unwritten while it waits (`fdd9e5b:src/cpm/bdos.asm:281`, `:333`,
  `:404` and `:708`,
  `fdd9e5b:src/console.asm:215-226`)
- function 48, `MOUNT`, unmount and warm boot

A reset or power loss before that point loses the records written into the
pending block since it was last written, at most one block of four records,
512 bytes. The card keeps the block's old contents. A block the card rejects
stays pending. A close or another directory request then returns the error,
`Bad Sector` or function 45's returned error. A console read does not report
the failure: the program gets its key and the next flush point that is not a
console read reports it. Warm boot writes the block once more and drops it
with `Write lost` (`fdd9e5b:docs/recovery.md:99-112`).

In the host-model measurements for `fdd9e5b`, `BAZA BOUNCE` compiling to A
took 19.04 seconds with 48 card writes, against 25.82 seconds when every
record was written through. A 16 KiB file took 33 card writes in place of 129,
and `SAVE 16` 10 in place of 34.

## Collecting records before the directory write

A card block holds four CP/M records. Writing each record through can therefore
write the same block four times. Writing behind combines those changes in one
line before a flush. Chapter 18 explains the record-to-block mapping
(`src/cache.asm:359-394`, `src/cache.asm:508-536`). A volume is written behind
when its descriptor has bit 0 of its cache byte, byte 15, set. `tecvol` permits
the bit on one volume at most (`tools/lib/container.mjs:85-86`). The ROM applies
the flag per volume so the host restriction is not a ROM count limit. `MNFILL`
copies the bit into bit 1 of the drive's flags in the drive table
(`src/vol.asm:605-611`). After its checks, BIOS `WRITE` sends a write on that
drive to `CWRBH` with bit 7 of `CWTYPE` clear (`src/bios.asm:380-385`). On the
starter card the volume is `WORK` on drive B.

`CWRBH`, the path of every write, puts the record into the block's line and
marks the line dirty (`src/cache.asm:430-555`). If no line holds the block,
`CTAKE` gives one out. The line is filled from the card first unless it
already held the block. It is cleared to zeros instead, with no read, when
by `WRITE`'s rule from Chapter 18 the card has nothing to supply
(`src/cache.asm:450-469`).

Either way, the record's 128 bytes are then copied from the DMA address into the
line with `CWRREC` and `CDSET` marks the line dirty. On a volume written behind
a data write ends there. Success at this point means the record is in the cache.
A miss may already have forced an older dirty line to the card so the complete
call need not leave the card unchanged. A write of type 1, a directory write,
which bit 0 of `CWTYPE` shows, goes on (`src/cache.asm:508-520`,
`src/cache.asm:546-555`). The new directory entry must not reach the card before
the data blocks it names. `CFLUSH` writes every dirty line except the
directory's and then, if every one was written, `CWRITE` writes the directory's
line. The data reaches the card before the directory block that names it. If any
of those writes fails, the directory's cached line is dropped so its next read
comes from the card. A data line whose write fails stays dirty, since it holds
the only copy of its records. The write then reports the error to the BDOS. When
function 45 returns the error to a program, another close can retry the retained
dirty data. If those writes and the directory write succeed, the close succeeds
(`src/cache.asm:265-299`, `src/cache.asm:546-555`).

The BDOS writes the directory when it creates a file and when it closes a
changed file control block (FCB), including at an extent transition
(`src/cpm/bdosfile.asm:224-282`, `src/cpm/bdosfile.asm:524-528`,
`src/cpm/bdosrec.asm:94-98`). On a volume written behind a successful
directory write brings pending cache data to the card first
(`src/cpm/bdoslog.asm:83-90`).

A retained `5a25178` trace of `SAVE 8 X.COM` on B, after `B:`, shows the
writes that reach the card, by card block. The directory's first block,
4,096, is written when the file is created. Nothing is written while the
four data blocks go into the cache. At the close come 4,130, 4,131, 4,128
and 4,129, the data in the order of their lines, and then 4,096 again. The
trace was taken on the host model by recording `SDLBA` at each call of
`SDWRITE`. That run used six card writes, compared with eighteen on
written-through A. These are historical traces, not new measurements of the
offered source.

The `5a25178` run of `SAVE 160 Z.COM` on B filled every line before close.
The 80-block file forced `CTAKE` to write three of the first 32 data blocks
early: 4,128, 4,129 and 4,130. The third write was caused by a read needing
a line, not by the data write itself.

In the retained `78127ec` run on `time.img`, `SAVE 64 X.COM`, 16 KiB, took
30,615,308 T-states, 7.65 seconds, on `THROUGH`. On `BEHIND` it took
9,951,810, 2.49 seconds, about a third of that. Each run followed a cold
boot and a change to the drive. The count, taken as for the reads, leaves
out the change of drive.

## Flush order and interrupted updates

`CFLUSH` and `CFLALL` write the dirty lines in line order, from 0 to 29. `CFLUSH`
leaves out the line numbered in `A`. `CFLALL` passes `FFh`, the number of no
line (`src/cache.asm:265-299`). That order is not the order of the blocks,
since `CTAKE` hands lines out in turn. The blocks of a file can therefore
reach the card in any order.

A type-1 directory write ends with its line clean after success or absent
after failure. On a volume written behind the data flush precedes that
line's write (`src/cache.asm:546-555`). With the BDOS's directory write
types, later flushes have only data lines left. A power cut during the
data phase of a directory write's flush leaves some new data on the card and its directory update unwritten.
The ordering prevents publishing that update before all its data writes
succeed. It provides no rollback. A successfully written block the file
already had holds its new contents on the card, with or without the directory block
after it. [Chapter 6](06-cards-on-the-pc.md#recovery-after-a-power-cut)
describes recovery after that. A cut during the directory block's own write
can damage any of its 16 entries. Card-reported completion is also not a
verification of the card's physical power-loss durability
(`docs/recovery.md:69-70`, `docs/recovery.md:92-94`).

`CWRITE` writes a single line to the card (`src/cache.asm:214-252`). It takes
the block number from the table and sets `SDXB` so that `SDWRITE` reads its 512
bytes straight from the line in EXPAND 1. On success it marks the line clean. On
a failure it leaves the line dirty and returns `NZ`. A flush writes every dirty
line, goes on past each failure and returns `NZ` if there was one. `CFLALL`
drops each line whose write fails so the card's copy of that block stands.
`CFLUSH`, the directory write's, leaves such a line dirty for a later flush
(`src/cache.asm:265-299`). `CTAKE`'s write of one line, when every line is
dirty, keeps a failed line dirty in the same way. `CTAKE` then returns the error
with `CNEXT` moved past the line. The next miss writes the line after it so a
single bad block can't fail every later miss (`src/cache.asm:340-357`).

### Five flush occasions

At `a1023bd` dirty cache lines reach the card on five occasions. At
`fdd9e5b` a volume written through adds its pending block's flush points,
described above:

- a directory write on the volume written behind, as above
- `CTAKE` with every line dirty, which writes one line
- every warm boot, whose `CWBOOT` calls `CFLALL` (`src/boot.asm:146-149`,
  `src/cache.asm:566-572`)
- a valid change through the services `MOUNT` or `UNMNT`, whose `VFLUSH` calls
  `CFLALL` before any drive changes and fails if a line failed
  (`src/volsvc.asm:372-387`)
- BDOS function 48, which calls `VFLUSH` and returns 0 in `A` or `FFh` if a line
  failed and was dropped (`src/cpm/bdos.asm:238-241`)

At `fdd9e5b` `VFLUSH` calls `CFLUSH` with no line excluded, so `MOUNT`,
unmount and function 48 keep a line whose write fails for the next flush.
Only warm boot's `CFLALL` drops one (`fdd9e5b:src/volsvc.asm:360-389`,
`fdd9e5b:src/cache.asm:255-300`).

A `^C` at the prompt causes a warm boot. When its flush succeeds, every pending
cache change has reached the card. A failure prints `Write lost`, whose
consequence is described below. Reset does not flush the old cache. Cold boot
clears EXPAND 1 (`src/boot.asm:232-249`) so changes still unwritten at reset are
lost. Some changes since the last directory write may already be on the card.
`CTAKE` wrote them when their lines were given out for other blocks
(`src/cache.asm:340-344`). The card can then hold a mix of old and new blocks.

## A failed flush

A data write on a volume written behind can return success before its record has
reached the card. A failure when its line goes to the card later therefore needs
a report of its own and that report is `Write lost`. `CWBOOT` calls `CFLALL` at
the warm boot. That writes every dirty line and drops each one the card rejects.
If any failed, `CWBOOT` drops the rest of a chained line and prints `Write lost`
on its own line (`src/cache.asm:566-572`, `src/text.asm:108`). The dropped lines'
changes are gone from RAM. Blocks the card rejected before programming retain
their earlier contents. A partially programmed block has the corruption risk
described above. The message is printed once for that flush. With no new dirty
data, the next warm boot has nothing more to write.

A directory write whose flush fails during a program's run is the BDOS's
`Bad Sector` instead. Its data lines that failed are still dirty so the warm
boot after it writes them again. When the card rejects them again, the boot
prints `Write lost` and drops them. The directory's line was dropped when the
directory write failed. The failed directory update is not retried by that
flush. If the card rejected the directory write before changing it, the previous
directory remains. A card error or power loss during programming can instead
leave a partly changed block.

A card taken out while TEC-OS runs gives that, since every write then fails.
The first warm boot after it prints `Write lost` and drops the lines.
Putting the card back does not itself run `SDINIT`. The cold-boot path
starts the card (`src/boot.asm:92-100`). If writes still fail, a later
change written behind produces `Write lost` at the next warm boot. A reset
discards the change, still unwritten. While dirty lines stay dirty, fewer
lines are free for reads. Every `CTAKE` starts with a write once all 30 are
dirty.

The retained `78127ec` run below left X.COM in the directory after a failed
close. Its buffered records did not reach the card. It used that revision's
prepared starter image and matching ROM. The PC setup is described in
[Chapter 6](06-cards-on-the-pc.md#the-host-tools) and matching media in
[Chapter 27](27-build-the-rom-and-media.md). The historical shell recipe also
requires `cp` and `truncate`. It changes a separate image, not the working card.

The image ends 32 card blocks into WORK, just past its directory. The directory
is present but the file's data area is outside the shortened image:

<!-- Retained historical TEC-OS 78127ec fixture, frozen old05:180–205.
     This is not a current-source run or a physical-card experiment. -->
```sh
cp dist/starter.img nodata.img
truncate -s 2113536 nodata.img
```

<!-- node tools/capture.mjs --card nodata.img "@start SAVE 1 B:X.COM" "@key x" "DIR B:" -->
```text
A>SAVE 1 B:X.COM

Bdos Err On B: Bad Sector
Write lost
A>DIR B:
X.COM       
1 file, 8176K free
A>
```

`SAVE` first made X.COM's empty directory entry and buffered its two records.
The close's data flush could not write their block and failed with
`Bad Sector`. After the recovery key, `x` in this capture, warm boot tried the
block again, dropped it and printed `Write lost`. The failed close did not publish
the updated record count or allocation map. In this fixture the on-card file
therefore still had no records
(`78127ec:src/cpm/ccpcmd.asm:216–270`,
`78127ec:src/cpm/bdosfile.asm:157–201,328–381`,
`78127ec:src/cache.asm:189–219,378–399`).

DIR still listed X.COM because making the empty entry had succeeded before the
failed close. Its name in the listing does not establish that the two buffered
records reached the card.

## Time with maskable interrupts off

The cache's routines put EXPAND 1 in view many times in each BIOS call. The
window at `8000h–BFFFh` then holds the cache and not the workspace and the
stacks. An interrupt taken then would push its return address into EXPAND 1
and run its handler with the wrong memory in the window. So the BIOS's
`READ` and `WRITE` disable maskable interrupts across their mapping and
cache work (`src/cache.asm:12-16`).

`CDI` at each entry calls `IFFGET`, whose `LD A,I` copies the interrupt
flip-flop into the P/V flag. An NMOS Z80 can clear that flag when it accepts
an interrupt during the instruction. `IFFGET` therefore repeats the test
when the flag is clear (`src/bios.asm:397-401`). `CDI` turns interrupts off
with `DI` and saves the flags in `CIFF` (`src/bios.asm:410-416`). `BRET` at
each exit turns the result's Z flag into `A`, 0 for success and 1 for an
error. `CEI` turns interrupts on again only if `CIFF` shows they were on at
entry (`src/bios.asm:426-440`, `src/bios.asm:223-227`,
`src/bios.asm:254-259`). A call made with interrupts off returns with them
off. `VFLUSH`, in the volume services, uses the same pair around its flush
(`src/volsvc.asm:372-387`). `MVCOPY` and the history's routines call
`IFFGET` too and keep their own copy of the state (`src/cache.asm:591-593`,
`src/history.asm:41-68`).

Maskable interrupts come on only when a program or a service enables them, as
Chapter 16 states. The ROM's executable `EI` instructions restore a saved state.
The places are `CEI`, `RXBITS`, `TXBYTE`, the history's access, `MVEND` and the
PICO9918's `VPAIR` (`src/bios.asm:431-440`, `src/console.asm:312-337`,
`src/console.asm:369-399`, `src/history.asm:41-68`, `src/cache.asm:731-736`,
`src/pico.asm:442-453`). The boot also writes `EI` followed by `RETI` at `0038h`
when no resident jump is retained there. That code runs on an interrupt or a
program's `RST 38h` (`src/boot.asm:359-368`). DI does not block a non-maskable
interrupt (NMI). These routines therefore require the NMI conditions described
in Chapter 15 as well as their maskable-interrupt protection.

For a program that enables maskable interrupts, the protected portion of a BIOS
disk call holds them off across mapping, cache work and card I/O. A read that
misses holds them off for about 235,000 T-states, 59 milliseconds. A directory
write on the volume written behind holds them off while every dirty line is
written. In the retained `78127ec` run the close of a file of four blocks took
1,111,542 T-states. The retained `78127ec` per-line `CWRITE` cost was 217,421
T-states. Multiplying it by 30 gives about 6.5 million T-states, or 1.6 seconds,
for data transfer alone. That is an estimate from the model cost, not a measured
all-dirty flush or an upper bound for a physical card. A program with an
interrupt response requirement can place disk calls outside the interval that
needs a short response. Writing through avoids a directory-triggered all-line
flush on that volume but a cache miss may still write one dirty line. Warm boot,
mount changes and function 48 can flush the whole cache whatever volume the
program uses. Those operations must also fall outside that interval.
