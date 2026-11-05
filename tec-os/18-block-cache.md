---
title: The block cache
parent: TEC-OS
nav_order: 18
nav_group: "Part II: Inside TEC-OS"
---

# 18. The block cache

<!-- Checked against TEC-OS 78127ec, with the ATOM assembler from the repository's
     `atom-z80` 0.3.7 and the starter card's `TED.COM` from
     Thorium 128edb7, whose copy in `dist/files` has the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. The
     timings and traces below were made on that card unless the text names another. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

Reading a block from the SD card takes about 55 milliseconds, as
[Chapter 17](17-sd-card-and-volumes.md) measured. Every bit passes through a
port one at a time. A CP/M program reads the same blocks again and again, the
directory above all. The block cache keeps what it has read in EXPAND 1, so
that a second read of the same block is a copy in memory. Every write goes
through the same cache. On a volume written through the block's line goes to
the card before the write returns. The volume written behind keeps its writes
in the cache and writes them to the card in batches.

## Thirty lines and their table

The cache is 30 lines of 512 bytes, one card block each, at `8000h–BBFFh` in
EXPAND 1 (`src/cache.asm:1-26`, `src/layout.asm:40-46`). Line n starts at
`8000h` plus n times `200h`. `CLADR` works the address out by doubling n and
adding `80h`, which gives the high byte (`src/cache.asm:194-200`).

The cache's table is the next page. From `CTAB`, `BC00h`, each line has four
bytes for the number of its card block, `FFFFFFFFh` while the line is empty.
From `CDIRTY`, `BC80h`, each line has a byte that is nonzero while the line
holds changes the card lacks. A line is therefore empty, clean or dirty. An
empty line has no block. A clean line holds a block the card has too, and a
dirty line holds a block whose newest bytes are only here. Every line is
empty after a cold boot. The boot clears EXPAND 1 and marks each line empty
before it mounts the card, as [Chapter 15](15-reset-and-boot.md) describes
(`src/boot.asm:100-102`, `src/boot.asm:309-332`). The mount then reads the
container's table into a line, an ordinary clean one that `CTAKE` gives out
again in turn (Chapter 17).

The lines are keyed by the block's number on the card, `SDLBA`, and not by
drive and block within the volume. A block has the same number from every
drive, so at most a single line holds it.

The cache's lines and table are in EXPAND 1. Its four other bytes of state
are in the workspace above the RAM BIOS table (`src/ram.asm:309-313`):

- `CNEXT`, the next line to give out
- `CWTYPE`, the write type of the current BIOS `WRITE`, with bit 7 set for a
  volume written through and bit 6 once a line has been given out for the write
- `CIFF`, the interrupt state at the current BIOS call's entry

To reach the table, a routine takes from `CXON` the latch value with `LATEXP`
added to `LATCHV` and writes it to the latch. It reads or writes the bytes
with no `PUSH`, `POP` or `CALL` in between, then puts `LATCHV` back
(`src/cache.asm:31-53`).
[Chapter 14](14-memory-map.md#expand-1-and-the-no-stack-rule) explains why no
stack may be used while EXPAND 1 is in view.

## Reads through the cache

Every volume's reads go through the cache. BIOS `READ` maps the record to a
card block and a quarter of it, and calls `CREAD` (`src/bios.asm:229-234`,
`src/cache.asm:463-477`). `CLOOK` compares `SDLBA` with each line's block
number in turn, from line 0 (`src/cache.asm:59-116`). On a hit, `CRDREC`
copies the record's 128 bytes from the line to the DMA address. On a miss,
`CTAKE` gives out a line, `CFILL` reads the card block straight into it and
the record is then copied from the line.

The block goes from the card into EXPAND 1 with no copy through another
buffer. `CFILL` sets `SDXB` to `LATEXP` for the call, and `SDREAD`'s byte loop
puts EXPAND 1 in view while it fills the buffer (`src/cache.asm:217-240`,
`src/sd.asm:511-519`). A failed read leaves the line empty.

`CTAKE` gives out lines in turn (`src/cache.asm:355-412`). A clean line can be
given out at any time, since the card has the same bytes. A dirty line has to
reach the card first. So `CTAKE` starts at `CNEXT` and gives out the first
clean line from there on. It passes over dirty ones and wraps from line 29 to
line 0. It sets `CNEXT` to the line after the one it gave out. When every line
is dirty, `CTAKE` writes the line at `CNEXT` to the card first and gives out
that one. The order is round-robin and not least recently used. A block that
is read often is still given up when its turn comes, and read again from the
card at its next use.

On the model, with the starter card, a read in `DIR` that hit took 13,718
T-states, with the record going to the directory buffer `DIRBUF`. A read in
`DIR B:` that missed took 235,357, nearly all of it the card. `CLOOK` takes
259 T-states when the block is in line 0 and about 2,000 to search all 30.

The copy is the larger part of a hit. `CRDREC` and `CWRREC` put the two banks
in `XMDST` and `XMSRC` as 0 for the program's view and 1 for EXPAND 1. Both
then call `MVCOPY`, the cache's copy routine (`src/cache.asm:422-454`,
`src/cache.asm:433-454`). A copy within a single bank is one `LDIR` with that
bank in view (`src/cache.asm:713-717`, `src/cache.asm:808-816`). A copy
between EXPAND 1 and an address in EXPAND 0, such as `DIRBUF`, can't have both
ends in view. The two banks share the one window. The part of the bank-0 end below
`8000h` is in view whatever the latch holds. That part goes by one `LDIR` with
EXPAND 1 selected (`src/cache.asm:718-775`). The part in EXPAND 0 goes a byte
at a time, with the latch switched between each read and its write
(`src/cache.asm:777-806`). The copy uses no stack while EXPAND 1 is in view,
because the caller's stack may be in EXPAND 0. `MVEND` writes `LATCHV` back to
the latch and enables interrupts only if they were on at entry
(`src/cache.asm:818-835`). A hit to a DMA address below `8000h`, such as a
program's load at `0100h`, took 6,026 T-states in a run of `MOUNT`. A miss to
such an address took 226,445.

`DIR` on the starter card's drive A shows the effect. After the first prompt
the directory's blocks are in the cache, and `DIR`'s two BIOS reads are both
hits.

A program that reads a file shows the gain over a whole file. This one
assembles to 24 bytes, opens the file named on its command line and reads it
to `0080h` with function 20:

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

These commands make a card with the program and a file of 12,288 bytes on
drive A:

```sh
npx atom read.asm read.com
head -c 12288 /dev/zero > data.bin
node tools/tecvol.mjs create time.img --volume G1M:SYSTEM:A --volume G8M:THROUGH:B --volume G8M:BEHIND:C:wb
node tools/tecvol.mjs put time.img A read.com
node tools/tecvol.mjs put time.img A data.bin
```

`tools/capture.mjs` prints no T-state count, so the figures come from a script
that drives `Machine` as it does. The script reads the model's count,
`cycles` (`host/machine.mjs:265`), twice. The first reading is after
`READ DATA.BIN` has been typed and echoed, before the Return that ends it. The
second is at the next prompt. After a cold boot, the command's first run took
6,642,581 T-states, 1.66 seconds. The next run took 1,343,674, 0.34 seconds,
a fifth of the first. Both figures include loading the program from drive A.

The gain needs the whole file in the cache. A file of 15,360 bytes took about
2.0 seconds and then about 2.1. `CTAKE` had given up each line before the
next read reached it.

## Writes through

A volume whose descriptor does not have the written-behind flag is written
through: a BIOS `WRITE` returns only after the card has the block. Its record
goes into the block's line by the path the next section describes, and `WRITE`
sets bit 7 of `CWTYPE` first. `CWRBH` then writes the line to the card with
`CWRITE` (`src/bios.asm:396-409`, `src/cache.asm:591-617`). If that write
fails, the line is dropped, so the next read of the block comes from the card
(`src/cache.asm:632-636`). A written-through volume's lines are therefore
clean whenever a BIOS call returns.

A write that is given a line for its block sets bit 6 of `CWTYPE`
(`src/cache.asm:510-512`). `CWRBH` sets `CNEXT` back to such a line once the
card has it from a volume written through (`src/cache.asm:607-617`). The next
line given out is then the same one. A file written through passes through a
single line, block after block, and the cache keeps the lines that hold
programs and directories. The line keeps its block, so the block's next record
is a hit.

## Writes behind and the directory rule

Chapter 17 counted four card writes for each block of a new file on a volume
written through. So the block cache keeps the records of the volume written
behind and sends them to the card in batches. A volume is written behind when
its descriptor has bit 0 of its cache byte, byte 15, set. `tecvol` sets the
bit on one volume at most, and the ROM writes behind any volume that has it.
`MNFILL` copies the bit into bit 1 of the drive's flags in the drive table
(`src/vol.asm:678-684`). After its checks, BIOS `WRITE` sends a write on that
drive to `CWRBH` with bit 7 of `CWTYPE` clear (`src/bios.asm:396-406`). On the
starter card the volume is `WORK` on drive B.

`CWRBH`, the path of every write, puts the record into the block's line and
marks the line dirty (`src/cache.asm:499-636`). If no line holds the block,
`CTAKE` gives one out. The line is filled from the card first unless it
already held the block. It is cleared to zeros instead, with no read, when by
`WRITE`'s rule from Chapter 17 the card has nothing to supply
(`src/cache.asm:518-543`).

Either way, the record's 128 bytes are then copied from the DMA address into
the line with `CWRREC`, and `CDSET` marks the line dirty. On the volume
written behind a data write ends there and returns success with the card
unchanged. A write of type 1, a directory write, which bit 0 of `CWTYPE`
shows, goes on (`src/cache.asm:591-600`, `src/cache.asm:619-636`). The card's
directory may list a block only once the block's contents are on the card.
`CFLUSH` writes every dirty line except the directory's, and then, if every
one was written, `CWRITE` writes the directory's line. The data reaches the
card before the directory block that names it. If any of those writes fails,
the directory's line is dropped, leaving the card's directory as the copy
that is read next time. A data line whose write fails stays dirty, since it
holds the only copy of its records. The write then reports the error to the
BDOS. A second close fails in the same way until the card takes the data. It
then succeeds with every record on the card (`src/cache.asm:301-342`,
`src/cache.asm:619-636`).

The BDOS writes the directory at a file's creation, at its close and when an
extent fills. On a volume written behind the card is brought up to date at
those points.

A trace of `SAVE 8 X.COM` on drive B, after `B:`, shows the writes that reach
the card, by card block. The directory's first block, 4,096, is written when
the file is created. Nothing is written while the four data blocks go into the
cache. At the close come 4,130, 4,131, 4,128 and 4,129, the data in the order
of their lines, and then 4,096 again. The trace was taken on the host model by
recording `SDLBA` at each call of `SDWRITE`. Six card writes do what eighteen
do on drive A, which is written through (Chapter 17).

A larger file fills all 30 lines before its close. In `SAVE 160 Z.COM` on B,
80 blocks, every line is dirty before the BDOS next writes the directory.
`CTAKE` therefore writes three of the first 32 data blocks early.

On `time.img`, from the section on reads, `SAVE 64 X.COM`, 16 KiB, took
30,615,308 T-states, 7.65 seconds, on `THROUGH`. On `BEHIND` it took
9,951,810, 2.49 seconds, about a third of that. Each run followed a cold boot
and a change to the drive. The count, taken as for the reads, leaves out the
change of drive.

## The order of a flush and its five occasions

`CFLUSH` and `CFLALL` write the dirty lines in order, from 0 to 29. `CFLUSH`
leaves out the line numbered in `A`. `CFLALL` passes `FFh`, the number of no
line (`src/cache.asm:301-342`). That order is not the order of the blocks,
since `CTAKE` hands lines out in turn. The blocks of a file can therefore
reach the card in any order.

A directory line is never left dirty: a directory write is written to the
card at once, after the data (`src/cache.asm:619-636`). A flush at any other
time therefore writes only data. A power cut during a directory write's flush
leaves some of the new data on the card and the directory block unwritten. No
entry on the card then names a block that was missed, and nothing is rolled
back either. Once written, a block the file already had holds its new
contents on the card, with or without the directory block after it.
[Chapter 5](05-drives-and-cache.md#recovering-after-a-power-cut) describes
what you see after that.

`CWRITE` writes a single line to the card (`src/cache.asm:242-285`). It takes
the block number from the table and sets `SDXB` so that `SDWRITE` reads its
512 bytes straight from the line in EXPAND 1. On success it marks the line
clean. On a failure it leaves the line dirty and returns `NZ`. A flush writes
every dirty line, goes on past each failure and returns `NZ` if there was one.
`CFLALL` drops each line whose write fails, so the card's copy of that block
stands. `CFLUSH`, the directory write's, leaves such a line dirty for a later
flush (`src/cache.asm:301-342`). `CTAKE`'s write of one line, when every line
is dirty, keeps a failed line dirty in the same way. `CTAKE` then returns the
error with `CNEXT` moved past the line. The next miss writes the line after
it, so a single bad block can't fail every later miss
(`src/cache.asm:391-409`).

A flush has five occasions:

- a directory write on the volume written behind, as above
- `CTAKE` with every line dirty, which writes one line
- every warm boot, whose `CWBOOT` calls `CFLALL` (`src/boot.asm:206-207`,
  `src/cache.asm:646-653`)
- every call of the services `MOUNT` and `UNMNT`, whose `VFLUSH` calls
  `CFLALL` before any drive changes, and fails if a line failed
  (`src/volsvc.asm:392-408`)
- BDOS function 48, which calls `VFLUSH` and returns 0 in `A`, or `FFh` if a
  line failed and was dropped (`src/cpm/bdos.asm:266-278`)

The warm boot's flush is the one you can cause. A `^C` at the prompt is a
warm boot, and after it every change is on the card. A reset writes nothing,
since cold boot clears EXPAND 1 (`src/boot.asm:309-332`), and the changes the
cache still holds unwritten at a reset are lost. Some changes since the last
directory write may already be on the card. `CTAKE` wrote them when their
lines were given out for other blocks (`src/cache.asm:391-398`). The card can
then hold a mix of old and new blocks.

## Write lost

A data write on the volume written behind returns success with the card
unchanged. A failure when its line goes to the card later therefore needs a
report of its own, and that report is `Write lost`. `CWBOOT` calls `CFLALL`
at the warm boot. That writes every dirty line and drops each one the card
rejects. If any failed, `CWBOOT` drops the rest of a chained line and prints
`Write lost` on its own line (`src/cache.asm:646-653`, `src/text.asm:84`).
The dropped lines' changes are gone and the card keeps its old copy of each
block. So the message comes once: the next warm boot has nothing more to
write.

A directory write whose flush fails during a program's run is the BDOS's
`Bad Sector` instead. Its data lines that failed are still dirty, so the warm
boot after it writes them again. When the card rejects them again, the boot
prints `Write lost` and drops them. The directory's line was dropped when the
directory write failed. The card's directory is therefore as it was before,
whether or not the warm boot's writes succeed.

A card taken out while TEC-OS runs gives that, since every write then fails. The
first warm boot after it prints `Write lost` and drops the lines. Putting the
card back does not itself run `SDINIT`. The cold-boot path starts the card
(`src/boot.asm:119-132`). If writes still fail, a later change written behind
produces `Write lost` at the next warm boot. A reset discards the change, still
unwritten. While dirty lines stay dirty, fewer lines are free for reads. Every
`CTAKE` starts with a write once all 30 are dirty.

## Interrupts held off

The cache's routines put EXPAND 1 in view many times in each BIOS call. The
window at `8000h–BFFFh` then holds the cache and not the workspace and the
stacks. An interrupt taken then would push its return address into EXPAND 1
and run its handler with the wrong memory in the window. So the BIOS's `READ`
and `WRITE` run with interrupts off from start to end (`src/cache.asm:19-26`).

`CDI` at each entry calls `IFFGET`, whose `LD A,I` copies the interrupt
flip-flop into the P/V flag. An NMOS Z80 can clear that flag when it accepts
an interrupt during the instruction. `IFFGET` therefore repeats the test when
the flag is clear (`src/bios.asm:415-421`). `CDI` turns interrupts off with
`DI` and saves the flags in `CIFF` (`src/bios.asm:426-434`). `BRET` at each
exit turns the result's Z flag into `A`, 0 for success and 1 for an error.
`CEI` turns interrupts on again only if `CIFF` shows they were on at entry
(`src/bios.asm:440-458`, `src/bios.asm:229-234`, `src/bios.asm:267-278`). A
call made with interrupts off returns with them off. `VFLUSH`, in the volume
services, uses the same pair around its flush (`src/volsvc.asm:392-408`).
`MVCOPY` and the history's routines call `IFFGET` too and keep their own copy
of the state (`src/cache.asm:687-690`, `src/history.asm:47-76`).

Interrupts come on only when a program or a service enables them, as Chapter 15
states. The ROM executes `EI` only to restore a state it saved. The places are
`CEI`, `RXBITS`, `TXBYTE`, the history's access, `MVEND` and the PICO9918's
`VPAIR` (`src/bios.asm:453-454`, `src/console.asm:377-411`,
`src/console.asm:440-480`, `src/history.asm:47-76`, `src/cache.asm:831`,
`src/pico.asm:431-447`). The boot also writes `EI` followed by `RETI` at `0038h`
when no resident jump is retained there. That code runs on an interrupt or a
program's `RST 38h` (`src/boot.asm:470-480`). So what follows affects only a
program that has enabled interrupts itself.

For such a program a BIOS disk call holds interrupts off for its whole
length. A read that misses holds them off for about 235,000 T-states, 59
milliseconds. A directory write on the volume written behind holds them off
while every dirty line is written. On the model the close of a file of four
blocks took 1,111,542 T-states. A flush of all 30 lines takes about 30 ×
217,421, some 6.5 million T-states, or 1.6 seconds. A program that needs an
interrupt served within a bound therefore has two choices. It can make its
disk calls where a pause of that length is acceptable. Or it can keep its
files on a volume written through, where no call flushes the whole cache.
