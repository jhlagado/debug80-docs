---
title: The block cache
parent: TEC-OS
nav_order: 19
nav_group: "Part II: Inside TEC-OS"
---

# 19. The block cache

Checked against TEC-OS 621201d, with the ATOM assembler from the repository's
`atom-z80` 0.3.7 and the starter card's `TED.COM` from
Thorium 128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. The
timings and traces below were made on that card unless the text names another.

Reading a block from the SD card takes TEC-OS about 55 milliseconds, because
every bit of it passes through a port one at a time, as Chapter 18 describes.
A CP/M program reads the same blocks again and again, the directory above all. The
block cache keeps the blocks it has read in EXPAND 1, so that a second read of
a block is a copy in memory. Every write goes through the same cache. On a
volume written through the block's line goes to the card before the write
returns, and the volume written behind keeps its writes in the cache and
writes them to the card in batches.

This chapter describes the cache's lines and their table, the path of a read
and the two ways a write goes. It then gives the order and the times of a
flush, what `Write lost` reports and why every BIOS disk call runs with
interrupts off.

## Thirty lines

The cache is 30 lines of 512 bytes, one card block each, at `8000h–BBFFh` in
EXPAND 1 (`src/cache.asm:1-13`, `src/layout.asm:23-25`). Line n is at `8000h` +
n × `200h`, which `CLADR` works out by doubling n and adding `80h` to give the
high byte (`src/cache.asm:115-120`).

The cache's table is the next page. From `CTAB`, `BC00h`, each line has four
bytes holding the number of the card block it holds, `FFFFFFFFh` while it is
empty. From `CDIRTY`, `BC80h`, each line has a byte that is nonzero while the
line holds changes the card lacks. Every line starts empty and clean, since
cold boot clears EXPAND 1 and marks each line empty before it mounts the card,
as Chapter 14 describes (`src/boot.asm:54`). The mount then reads the
container's table into a line, an ordinary clean one that `CTAKE` gives out
again in turn (Chapter 18).

The lines are keyed by the block's number on the card, `SDLBA`, and not by
drive and block within the volume. A block has one number whichever drive
reaches it, so it can be in at most one line.

All of the cache is in EXPAND 1, but all of its state outside the table is in
the workspace above the RAM BIOS table, at fixed addresses
(`src/ram.asm:227-229`):

- `CNEXT`, the next line to give out
- `CWTYPE`, the write type of the current BIOS `WRITE`, with bit 7 set for a
  volume written through and bit 6 once a line has been taken for the write
- `CIFF`, the interrupt state at the current BIOS call's entry

To read or write the table, a routine takes from `CXON` the latch value with
`LATEXP` added to `LATCHV` and writes it to the latch. It reads or writes the
bytes with no `PUSH`, `POP` or `CALL` in between, then writes `LATCHV` back to
the latch (`src/cache.asm:17-26`). Chapter 13 explains why no stack may be
used while EXPAND 1 is in view.

## Reads through the cache

Every volume's reads go through the cache. BIOS `READ` maps the record to a
card block and a quarter of it, and calls `CREAD` (`src/bios.asm:158-164`,
`src/cache.asm:275-287`). `CLOOK` compares `SDLBA` with each line's block
number in turn, from line 0 (`src/cache.asm:28-67`). On a hit, `CRDREC` copies
the record's 128 bytes from the line to the DMA address. On a miss, `CTAKE`
gives out a line, `CFILL` reads the card block straight into it, and the
record is then copied from the line.

The block goes from the card into EXPAND 1 with no copy through another
buffer, because `CFILL` sets `SDXB` to `LATEXP` for the call and `SDREAD`'s byte loop
puts EXPAND 1 in view while it fills the buffer (`src/cache.asm:122-144`,
`src/sd.asm:321-325`). A failed read leaves the line empty.

`CTAKE` gives out lines in turn (`src/cache.asm:210-250`). A clean line can be
given out at any time, since the card has the same bytes, but a dirty line has
to reach the card first. So `CTAKE` starts at `CNEXT` and takes the first
clean line from there on, passing over dirty lines and wrapping from line 29
to line 0. It sets `CNEXT` to the line after the one it took. When every line
is dirty, `CTAKE` writes the line at `CNEXT` to the card first and takes that
one. The order is round-robin, not least-recently-used, so a block that is
read often is still given up when its turn comes and read again from the card
at its next use.

On the model, with the starter card, a read in `DIR` that hits took 13,718
T-states, with the record going to the directory buffer `DIRBUF` at `BB5Fh`. A
read in `DIR B:` that missed took 235,357, nearly all of it the card. `CLOOK`
takes 259 T-states when the block is in line 0 and about 2,000 to search all
30.

The copy is the larger part of a hit. `CRDREC` and `CWRREC` put the two banks
in `XMDST` and `XMSRC`, 0 for the program's view and 1 for EXPAND 1, and call
`MVCOPY`, the cache's copy (`src/cache.asm:252-273`, `src/cache.asm:388-399`).
A count of 0 returns at once. Any other copy runs with interrupts off:
`IFFGET` reads the interrupt state, and `DI` and `PUSH AF` keep it for the end
(`src/cache.asm:400-405`). `BC`, `DE` and `HL` hold the copy's own values, so
the two latch values go in the alternate registers, whose old values are pushed
first. `C'` is the port, and `D'` and `E'` are `LATCHV` with `LATEXP` set for
each end in EXPAND 1 (`src/cache.asm:406-421`). Equal values mean one bank, and
`MVLDIR` writes that latch and does one `LDIR` (`src/cache.asm:423-426`,
`src/cache.asm:487-492`).

A copy between EXPAND 1 and an address in EXPAND 0, such as `DIRBUF`, can't have
both in view, because the two share the window. The part of the bank-0 end
below `8000h` stays in view whatever the latch holds, so it goes by one `LDIR`
with EXPAND 1 selected (`src/cache.asm:427-467`). The part in EXPAND 0 goes a
byte at a time, and the latch is switched between each read and its write
(`src/cache.asm:468-486`). While EXPAND 1 is in view the copy uses no stack,
because the caller's stack may be in EXPAND 0 (`src/cache.asm:394-395`).
`MVEND` writes `LATCHV` back to the latch, pops the alternates and enables
interrupts only if `P/V` shows they were on (`src/cache.asm:493-504`). A hit to
a DMA address below `8000h`, such as the CCP's loads at `0100h` and up, took
6,026 T-states in a load of `MOUNT.COM`, and a miss to such an address
226,445.

`DIR` on the starter card's drive A shows the effect: after the first prompt
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

`tools/capture.mjs` prints no count. The figures come from a script that drives
`Machine` as `tools/capture.mjs` does. It reads the model's T-state count,
`cycles` (`host/machine.mjs:265`), twice: when `READ DATA.BIN` has been typed
and echoed, before the Return that ends it, and at the next prompt. After a
cold boot, the command's first run took 6,642,581 T-states, 1.66 seconds, and
its second 1,343,674, 0.34 seconds, a fifth of that. Both figures include
loading the program from drive A.

The gain needs the whole file in the cache. A file of 15,360 bytes took about
2.0 seconds and then about 2.1, because `CTAKE` had given up each line before
the second read reached it.

## Writes through

A volume whose descriptor does not have the written-behind flag is written
through: a BIOS `WRITE` returns only after the card has the block. Its record
goes into the block's line by the path the next section describes, and `WRITE`
sets bit 7 of `CWTYPE` first, so that `CWRBH` then writes the line to the card
with `CWRITE` (`src/bios.asm:264-271`, `src/cache.asm:351-366`). If that write
fails, the line is dropped, so the next read of the block comes from the card
(`src/cache.asm:371-373`). A written-through volume's lines are therefore clean
whenever a BIOS call returns.

A write that has to take a line for its block sets bit 6 of `CWTYPE`
(`src/cache.asm:305-306`). Once the card has such a line from a volume written
through, `CWRBH` sets `CNEXT` back to it, so the next line given out is the
same one (`src/cache.asm:361-365`). A file written through then passes through
one line, block after block, and the lines that hold programs and directories
stay in the cache. The line keeps its block, so the block's next record is a
hit.

## Writes behind

Writing through costs four card writes for each block of a new file, as
Chapter 18 shows, so the block cache keeps the records of the volume written
behind and sends them to the card in batches. A volume is written behind when its
descriptor has bit 0 of its cache byte, byte 15, set. `tecvol` sets the bit on
one volume at most, and the ROM writes behind any volume that has it. `MNFILL`
copies that bit into bit 1 of the drive's flags in the drive table
(`src/vol.asm:420-424`). After its checks, BIOS `WRITE` sends a write on that
drive to `CWRBH` with bit 7 of `CWTYPE` clear (`src/bios.asm:264-268`). On the
starter card the volume is `WORK` on drive B.

`CWRBH`, the path of every write, puts the record into the block's line and marks the line dirty
(`src/cache.asm:289-373`). If no line holds the block, `CTAKE` gives one out.
Two cases follow, decided by `WRITE`'s rule from Chapter 18: whether the block
holds anything the card's copy has to supply. If it might, the line
is filled from the card first, unless it already held the block.

The card has nothing to supply when the write is CP/M's type 2, the first to a
new allocation block, or a write to the next card block of an allocation block
whose first card block was handled that way. The line is then cleared to zeros
instead, with no read. `GETKEY`'s key is set to record that block as cleared,
so that the rule holds for the block after it (`src/cache.asm:310-328`).

Either way, the record's 128 bytes are then copied from the DMA address into
the line with `CWRREC`, and `CDSET` marks the line dirty. On the volume
written behind a data write ends there and returns success with the card
unchanged. A write of type 1, a directory write, which bit 0 of `CWTYPE` shows,
goes on (`src/cache.asm:351-357`, `src/cache.asm:367-373`), because the card's
directory must never list a block whose contents are not yet on the card.
`CFLUSH` tries every dirty line except the directory's, and then, if every one
was written, `CWRITE` writes the directory's line, so the data reaches the card
before the directory block that names it. If any of those writes fails, the
directory's line is dropped, leaving the card's directory as the copy that is
read next time. The write then reports the error to the BDOS.

The BDOS writes the directory when a file is created, when it is closed and
when a file's extent fills, so on a volume written behind the card is brought
up to date at those points.

A trace of `SAVE 8 X.COM` on drive B, after `B:`, shows the writes that reach
the card, by card block. The directory's first block, 4,096, is written when
the file is created. Nothing is written while the four data blocks go into the
cache. At the close come 4,130, 4,131, 4,128 and 4,129, the data in the order
of their lines, and then 4,096 again. The trace was taken on the host model by
recording `SDLBA` at each call of `SDWRITE`. Six card writes do what eighteen
do on drive A, which is written through (Chapter 18).

A larger file fills the lines. In `SAVE 160 Z.COM` on B, 80 blocks, `CTAKE`
writes three of the first 32 data blocks early, because all 30 lines are dirty
before the BDOS next writes the directory.

On `time.img`, from the section on reads, `SAVE 64 X.COM`, 16 KiB, took
30,609,632 T-states, 7.65 seconds, on `THROUGH`. On `BEHIND` it took
9,946,134, 2.49 seconds, about a third of that. Each run followed a cold boot
and a change to the drive. The count, taken as for the reads, leaves out the
change of drive.

## The order of a flush

`CFLUSH` and `CFLALL` write dirty lines in line order, from line 0 to line 29.
`CFLUSH` leaves out the line given in `A`, and `CFLALL` gives `FFh`, which is
no line (`src/cache.asm:182-208`). Line order is not block order,
since `CTAKE` gives lines out in turn. The blocks of a file can therefore
reach the card in any order.

A directory line is never left dirty: a directory write is written to the card
at once, after the data (`src/cache.asm:367-373`). A flush at any other time
therefore writes only data. A power cut during a directory write's flush
leaves some of the new data blocks on the card and the directory block not yet
written, so no entry on the card names a block that was missed. Nothing is
rolled back either: a block the file already had, once written, holds its new
contents on the card whether or not the directory block follows
(Chapter 4's [recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut)
describes what the user sees).

`CWRITE` writes one line (`src/cache.asm:122-180`). It takes the block number
from the table and sets `SDXB` so that `SDWRITE` reads its 512 bytes straight
from the line in EXPAND 1. On success it marks the line clean, and on a
failure it leaves the line dirty and returns `NZ`. A flush tries every line:
`CFLUSH` and `CFLALL` drop each line whose write fails, so the card's copy of
that block stands, go on to the next and return `NZ` if any failed
(`src/cache.asm:182-208`). `CTAKE`'s write of one line, when every line is
dirty, is the exception: a line that fails there stays dirty for a later
flush to try, and `CTAKE` returns the error with `CNEXT` moved past it. The
next miss then writes the line after it, so one failing block can't fail
every later miss (`src/cache.asm:237-247`).

A flush has five occasions:

- a directory write on the volume written behind, as above
- `CTAKE` with every line dirty, which writes one line
- every warm boot, whose `CWBOOT` calls `CFLALL` (`src/boot.asm:108`,
  `src/cache.asm:375-384`)
- every call of the services `MOUNT` and `UNMNT`, whose `VFLUSH` calls
  `CFLALL` before any drive changes, and fails if a line failed
  (`src/vol.asm:675-688`)
- BDOS function 48, which calls `VFLUSH` and returns `A` = 0, or `FFh` if a
  line failed and was dropped (`src/cpm/bdos.asm:175-180`)

The warm boot's flush is the one you can cause. A `^C` at the prompt is a warm
boot, and after it every change is on the card. A reset writes nothing, since
cold boot clears EXPAND 1 (`src/boot.asm:169-188`), and the changes the cache
still holds unwritten at the time of a reset are lost. Some changes since the
last directory write may already be on the card, written by `CTAKE` when their
lines were given out for other blocks (`src/cache.asm:234-241`), so the card
can then hold a mix of old and new blocks.

## Write lost

A data write on the volume written behind returns success with the card
unchanged, so a failure when its line goes to the card later needs a report of
its own. That report is `Write lost`. `CWBOOT` calls `CFLALL`, which tries
every dirty line and drops each whose write fails. If any failed, `CWBOOT`
drops the rest of a chained line and prints `Write lost` on its own line
(`src/cache.asm:375-384`, `src/text.asm:69`). The dropped lines' changes are
gone and the card keeps its old copy of each block, so the message comes once:
the next warm boot has nothing more to write. A directory write whose flush
fails during a program's run is the BDOS's `Bad Sector` instead, and the warm
boot after it says nothing, since the failed lines were dropped then.

A card taken out while TEC-OS runs gives that: every write fails, and the
first warm boot after it says `Write lost` and drops the lines, even with the
same card put back, since only cold boot starts a card (`src/boot.asm:67`).
A later change written behind that reaches a line meets the same failure at
the next warm boot, which says `Write lost` again, and a reset discards it. While
dirty lines stay dirty, fewer lines are free for reads, and once all 30 are
dirty every `CTAKE` starts with a write.

## Interrupts held off

The cache's routines put EXPAND 1 in view many times in each BIOS call. While
it is in view the `8000h–BFFFh` window holds the cache, not the workspace and
the stacks. An interrupt taken then would push its return address into EXPAND
1 and run its handler with the wrong memory in the window. So the BIOS's
`READ` and `WRITE` run with interrupts off from start to end
(`src/cache.asm:10-13`).

`CDI` at each entry calls `IFFGET`, whose `LD A,I` copies the
interrupt flip-flop into the P/V flag. An NMOS Z80 can clear that flag if an
interrupt is accepted during the read, so `IFFGET` reads again when the flag is
clear (`src/bios.asm:273-278`). `CDI` turns interrupts off with `DI` and
saves the flags in `CIFF` (`src/bios.asm:280-287`). `BRET` at each exit turns
the result's Z flag into `A`, 0 for success and 1 for an error. `CEI` turns
interrupts on again only if `CIFF` shows they were on at entry
(`src/bios.asm:291-300`, `src/bios.asm:161-164`, `src/bios.asm:182-186`), so a
call made with interrupts off returns with them off. `VFLUSH`, in the volume
services, uses the same pair around its flush (`src/vol.asm:679-688`). `MVCOPY`
and the history's routines call `IFFGET` too and keep their own copy of the state
(`src/cache.asm:403-405`, `src/history.asm:26-28`).

For a program that uses interrupts, a BIOS disk call holds them off for its
whole length. A read that misses holds them off for about 235,000 T-states, 59
milliseconds. A directory write on the volume written behind holds them off
while every dirty line is written. On the model the close of a file of four
blocks took 1,111,504 T-states. A flush of all 30 lines takes about 30 ×
217,421, some 6.5 million T-states, or 1.6 seconds. Interrupts are on only
when a program has enabled them, as Chapter 14 describes, so this affects only
such a program.
