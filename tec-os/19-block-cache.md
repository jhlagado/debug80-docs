---
title: The block cache
parent: TEC-OS
nav_order: 19
nav_group: "Part II: Inside TEC-OS"
---

# 19. The block cache

Checked against TEC-OS 7935507, with the ATOM assembler from the repository's
`atom-z80` 0.3.7 and the starter card's `TED.COM` from
Thorium 128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. The
timings and traces below were made on that card unless the text names another.

Reading a block from the SD card takes TEC-OS about 55 milliseconds, because
every bit of it passes through a port one at a time, as Chapter 18 describes.
A CP/M program reads the same blocks again and again, the directory above all. The
block cache keeps the blocks it has read in EXPAND 1, so that a second read of
a block is a copy in memory. The same cache holds the writes to one volume,
the volume written behind, and writes them to the card in batches.

This chapter describes the cache's lines and their table, the path of a read
and the two ways a write goes. It then gives the order and the times of a
flush, what `Write lost` reports and why every BIOS disk call runs with
interrupts off.

## Thirty lines

The cache is 30 lines of 512 bytes, one card block each, at `8000h–BBFFh` in
EXPAND 1 (`src/cache.asm:1-8`, `src/layout.asm:21-23`). Line n is at `8000h` +
n × `200h`, which `CLADR` works out by doubling n and adding `80h` to give the
high byte (`src/cache.asm:112-117`).

The cache's table is the next page. From `CTAB`, `BC00h`, each line has four
bytes holding the number of the card block it holds, `FFFFFFFFh` while it is
empty. From `CDIRTY`, `BC80h`, each line has a byte that is nonzero while the
line holds changes the card lacks. Every line starts empty and clean, since
cold boot clears EXPAND 1 and marks each line empty, as Chapter 14 describes.

The lines are keyed by the block's number on the card, `SDLBA`, and not by
drive and block within the volume. A block has one number whichever drive
reaches it, so it can be in at most one line.

All of the cache is in EXPAND 1, but all of its state outside the table is in
the workspace above the RAM BIOS table, at fixed addresses
(`src/ram.asm:200-205`):

- `CNEXT`, the next line to give out
- `CFAIL`, set when a line's write has failed since the last warm boot
- `CSKIP`, the line a flush leaves alone
- `CWTYPE`, the write type of the current BIOS `WRITE`
- `CIFF`, the interrupt state at the current BIOS call's entry

To read or write the table, a routine takes from `CXON` the latch value with
`LATEXP` added to `LATCHV` and writes it to the latch. It reads or writes the
bytes with no `PUSH`, `POP` or `CALL` in between, then writes `LATCHV` back to
the latch (`src/cache.asm:17-25`). Chapter 13 explains why no stack may be
used while EXPAND 1 is in view.

## Reads through the cache

Every volume's reads go through the cache. BIOS `READ` maps the record to a
card block and a quarter of it, and calls `CREAD` (`src/bios.asm:179-184`,
`src/cache.asm:252-262`). `CLOOK` compares `SDLBA` with each line's block
number in turn, from line 0 (`src/cache.asm:27-66`). On a hit, `CRDREC` copies
the record's 128 bytes from the line to the DMA address. On a miss, `CTAKE`
gives out a line, `CFILL` reads the card block straight into it, and the
record is then copied from the line.

The block goes from the card into EXPAND 1 with no copy through `BLKBUF`,
because `CFILL` sets `SDXB` to `LATEXP` for the call and `SDREAD`'s byte loop
puts EXPAND 1 in view while it fills the buffer (`src/cache.asm:119-139`,
`src/sd.asm:272-276`). A failed read leaves the line empty.

`CTAKE` gives out lines in turn (`src/cache.asm:195-229`). A clean line can be
given out at any time, since the card has the same bytes, but a dirty line has
to reach the card first. So `CTAKE` starts at `CNEXT` and takes the first
clean line from there on, passing over dirty lines and wrapping from line 29
to line 0. It sets `CNEXT` to the line after the one it took. When every line
is dirty, `CTAKE` writes the line at `CNEXT` to the card first and takes that
one. The order is round-robin, not least-recently-used, so a block that is
read often is still given up when its turn comes and read again from the card
at its next use.

On the model, with the starter card, a read that hits takes 13,635 T-states
when the record goes to the directory buffer `DIRBUF` at `BBD0h`. A read that
misses takes 235,335, nearly all of it the card. `CLOOK` takes 259 T-states
when the block is in line 0 and about 2,000 to search all 30.

The copy is the larger part of a hit. `CRDREC` and `CWRREC` put the two banks
in `XMDST` and `XMSRC`, 0 for the program's view and 1 for EXPAND 1, and call
`MVCOPY`, the cache's copy (`src/cache.asm:231-250`, `src/cache.asm:355-366`).
A count of 0 returns at once. Any other copy runs with interrupts off:
`IFFGET` reads the interrupt state, and `DI` and `PUSH AF` keep it for the end
(`src/cache.asm:367-372`). `BC`, `DE` and `HL` hold the copy's own values, so
the two latch values go in the alternate registers, whose old values are pushed
first. `C'` is the port, and `D'` and `E'` are `LATCHV` with `LATEXP` set for
each end in EXPAND 1 (`src/cache.asm:373-387`). Equal values mean one bank, and
`MVLDIR` writes that latch and does one `LDIR` (`src/cache.asm:388-391`,
`src/cache.asm:452-457`).

A copy between EXPAND 1 and an address in EXPAND 0, such as `DIRBUF`, can't have
both in view, because the two share the window. The part of the bank-0 end
below `8000h` stays in view whatever the latch holds, so it goes by one `LDIR`
with EXPAND 1 selected (`src/cache.asm:392-432`). The part in EXPAND 0 goes a
byte at a time, and the latch is switched between each read and its write
(`src/cache.asm:433-451`). While EXPAND 1 is in view the copy uses no stack,
because the caller's stack may be in EXPAND 0 (`src/cache.asm:361-362`).
`MVEND` writes `LATCHV` back to the latch, pops the alternates and enables
interrupts only if `P/V` shows they were on (`src/cache.asm:458-468`). A hit to
a DMA address below `8000h`, such as the CCP's loads at `0100h` and up, takes
from 4,745 T-states, in line 0. A miss to such an address takes 226,445.

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
cold boot, the command's first run took 6,633,600 T-states, 1.66 seconds, and
its second 1,335,103, 0.33 seconds, a fifth of that. Both figures include
loading the program from drive A.

The gain needs the whole file in the cache. A file of 15,360 bytes took about
2.0 seconds and then about 2.1, because `CTAKE` had given up each line before
the second read reached it.

## Writes through

A volume whose descriptor does not have the written-behind flag is written
through: a BIOS `WRITE` returns only after the card has the block. Its path is
in `bios.asm`, and Chapter 18 describes it. The block is read into the
deblocking buffer `BLKBUF` unless that holds it already or the write needs no
read. The record is then merged and `SDWRITE` writes `BLKBUF` to the card. The
read into `BLKBUF`, when there is one, comes from the card, not from the cache
(`src/bios.asm:127-164`).

A later read of the block must not return the old contents, so the cache is
kept up to date after such a write. `CREFR` looks the block up, and if a line
holds it, copies the 512 bytes of `BLKBUF` over the line (`src/bios.asm:298`,
`src/cache.asm:341-352`). A block not in the cache is not added to it. If the
card write fails, the block's line is dropped, since neither it nor `BLKBUF`
can be known to match the card (`src/bios.asm:291-297`). A written-through
volume's lines are therefore always clean.

## Writes behind

Writing through costs four card writes for each block of a new file, as
Chapter 18 shows, so the block cache keeps the records of the volume written
behind and sends them to the card in batches. A volume is written behind when its
descriptor has bit 0 of its cache byte, byte 15, set. `tecvol` sets the bit on
one volume at most, and the ROM writes behind any volume that has it. `MNFILL`
copies that bit into bit 1 of the drive's flags in the drive table
(`src/vol.asm:362-366`). After its checks, BIOS `WRITE` sends a write on that
drive to `CWRBH` in place of the written-through path
(`src/bios.asm:277-281`). On the starter card the volume is `WORK` on drive B.

`CWRBH` puts the record into the block's line and marks the line dirty
(`src/cache.asm:264-326`). If no line holds the block, `CTAKE` gives one out.
Two cases follow, decided by the same rule `WRITE` uses for `BLKBUF`: whether
the block holds anything the card's copy has to supply. If it might, the line
is filled from the card first, unless it already held the block.

The card has nothing to supply when the write is CP/M's type 2, the first to a
new allocation block, or a write to the next card block of an allocation block
whose first card block was handled that way. The line is then cleared to zeros
instead, with no read. `BLKBUF`'s key is set to record that block as cleared,
so that the rule holds for the block after it (`src/cache.asm:279-297`).

Either way, the record's 128 bytes are then copied from the DMA address into
the line with `CWRREC`, and `CDSET` marks the line dirty. A data write ends
there and returns success with the card unchanged. A write of type 1, a
directory write, goes on (`src/cache.asm:314-326`), because the card's
directory must never list a block whose contents are not yet on the card.
`CFLUSH` writes every dirty line except the directory's, and then `CWRITE`
writes the directory's line, so the data reaches the card before the directory
block that names it. If either step fails, the directory's line is dropped,
leaving the card's directory as the copy that is read next time. The write
then reports the error to the BDOS.

The BDOS writes the directory when a file is created, when it is closed and
when a file's extent fills, so on a volume written behind the card is brought
up to date at those points.

A trace of `SAVE 8 X.COM` on drive B, after `B:`, shows the writes that reach
the card, by card block. The directory's first block, 4,096, is written when
the file is created. Nothing is written while the four data blocks go into the
cache. At the close come 4,131, 4,128, 4,129 and 4,130, the data in the order
of their lines, and then 4,096 again. The trace was taken on the host model by
recording `SDLBA` at each call of `SDWRITE`. Six card writes do what eighteen
do on drive A, which is written through (Chapter 18).

A larger file fills the lines. In `SAVE 160 Z.COM` on B, 80 blocks, `CTAKE`
writes three of the first 32 data blocks early, because all 30 lines are dirty
before the BDOS next writes the directory.

On `time.img`, from the section on reads, `SAVE 64 X.COM`, 16 KiB, took
30,834,679 T-states, 7.71 seconds, on `THROUGH`. On `BEHIND` it took
9,913,579, 2.48 seconds, about a third of that. Each run followed a cold boot
and a change to the drive. The count, taken as for the reads, leaves out the
change of drive.

## The order of a flush

`CFLUSH` and `CFLALL` write dirty lines in line order, from line 0 to line 29.
`CFLUSH` leaves out the line in `CSKIP`, and `CFLALL` sets `CSKIP` to `FFh`,
which is no line (`src/cache.asm:178-193`). Line order is not block order,
since `CTAKE` gives lines out in turn. The blocks of a file can therefore
reach the card in any order.

A directory line is never left dirty: a directory write is written to the card
at once, after the data (`src/cache.asm:264-267`). A flush at any other time
therefore writes only data. A power cut during a directory write's flush
leaves some of the new data blocks on the card and the directory block not yet
written, so no entry on the card names a block that was missed. Nothing is
rolled back either: a block the file already had, once written, holds its new
contents on the card whether or not the directory block follows
(Chapter 4's [recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut)
describes what the user sees).

`CWRITE` writes one line (`src/cache.asm:119-176`). It takes the block number
from the table and sets `SDXB` so that `SDWRITE` reads its 512 bytes straight
from the line in EXPAND 1. On success it marks the line clean. On a failure it
sets `CFAIL` and leaves the line dirty, and the flush stops: `CFLUSH` and
`CFLALL` return at the first line that fails, and the lines after it stay
dirty for the next flush (`src/cache.asm:178-188`).

A flush has four occasions:

- a directory write on the volume written behind, as above
- `CTAKE` with every line dirty, which writes one line
- every warm boot, whose `CWBOOT` calls `CFLALL` (`src/boot.asm:89`,
  `src/cache.asm:328-339`)
- every call of the services `MOUNT` and `UNMNT`, whose `VFLUSH` calls
  `CFLALL` before any drive changes, and fails if it fails
  (`src/vol.asm:615-627`)

The warm boot's flush is the one you can cause. A `^C` at the prompt is a warm
boot, and after it every change is on the card. A reset writes nothing, since
cold boot clears EXPAND 1 (`src/boot.asm:150-158`), and the changes in the
cache at the time of a reset are lost.

## Write lost

A data write on the volume written behind returns success with the card
unchanged, so a failure when its line goes to the card later needs a report of
its own. That report is `Write lost`. `CWBOOT` writes every dirty line and
then tests `CFAIL`, which is set if a line's write has failed since the last
warm boot, including the flush it has just made. If it is set, `CWBOOT` clears
it, drops the rest of a chained line and prints `Write lost` on its own line
(`src/cache.asm:328-339`, `src/text.asm:96`). The failed lines are still dirty and still hold their
data, so each warm boot writes them again and prints the message again while
the write still fails.

A card taken out while TEC-OS runs gives that: every write fails and the
message comes at each `^C`, even with the same card put back, since only cold
boot starts a card (`src/boot.asm:53`). The data that is only in the cache is lost when
the board is reset or turned off. While dirty lines stay dirty, fewer lines
are free for reads, and once all 30 are dirty every `CTAKE` starts with a
write.

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
clear (`src/bios.asm:302-307`). `CDI` turns interrupts off with `DI` and
saves the flags in `CIFF` (`src/bios.asm:309-316`). `BRET` at each exit turns
the result's Z flag into `A`, 0 for success and 1 for an error. `CEI` turns
interrupts on again only if `CIFF` shows they were on at entry
(`src/bios.asm:317-326`, `src/bios.asm:181-184`, `src/bios.asm:195-199`), so a
call made with interrupts off returns with them off. `VFLUSH`, in the volume
services, uses the same pair around its flush (`src/vol.asm:618-627`). `MVCOPY`
and the history's routines call `IFFGET` too and keep their own copy of the state
(`src/cache.asm:370-372`, `src/history.asm:25-27`).

For a program that uses interrupts, a BIOS disk call holds them off for its
whole length. A read that misses holds them off for about 235,000 T-states, 59
milliseconds. A directory write on the volume written behind holds them off
while every dirty line is written. On the model the close of a file of four
blocks took 1,111,319 T-states. A flush of all 30 lines takes about 30 ×
217,421, some 6.5 million T-states, or 1.6 seconds. Interrupts are on only
when a program has enabled them, as Chapter 14 describes, so this affects only
such a program.
