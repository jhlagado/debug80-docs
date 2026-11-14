---
title: Cache and persistence
parent: TEC-OS
nav_order: 19
nav_group: "Inside TEC-OS"
---

# 19. Cache and persistence

<!-- Checked against TEC-OS 46cf3f1f1c6ea7ff361a568672a41ab1a7e2c1ee (main),
     ROM SHA-256 ac86ad233696d22a46b4f98a4119c53b718bfe89881952a08e9f92223f3fa1c3.
     Unprefixed source citations use this revision. Explicit historical
     prefixes retain their stated revisions. Host-model capture recipes and
     raw output/hash receipts are retained in Origo
     studies/p3-tec-os/evidence/book-recovery-core/ and
     studies/p3-tec-os/evidence/book-recovery-host/. READ/SAVE/DIR timings use the measurements retained there.
     The tool inputs are the pinned TAS host 3d16b30 and TED a2fe556;
     Baza is the qualified 50dc512 payload. Source-derived excerpts are
     labelled separately from console captures. -->

A program can finish writing a record while its newest bytes are still only in
RAM. The block cache makes that possible by collecting records into card blocks.
Its write policy determines when a successful call also means that the block has
reached the card.

The historical measurements below put a block read at about 55 milliseconds, with bits
passing through a port one at a time. Chapter 18 explains that
transfer. A CP/M program reads the same blocks again and again, the directory
above all. The block cache keeps what it has read in EXPAND 1 so that a later
read is a memory copy while that block remains cached. Every write goes through
the same cache. A successful record write can mean its bytes are accepted
into RAM. The next admitted OS call can write that block before doing its own
work. A program that stops calling TEC-OS can leave its last write pending
indefinitely: this is cooperative service, not a timer-driven background task.

The housekeeping explanations in this draft cite candidate `a40d482` explicitly.
Final qualification and fresh book captures are pending. The unprefixed source
ranges and numeric receipts still belong to `46cf3f1`; historical costs below
are not measurements of the new containing-call paths
(`a40d482:docs/recovery.md:25-51`).

## Thirty lines and their table

The cache is 30 lines of 512 bytes, one card block each, at `8000h–BBFFh` in
EXPAND 1 (`src/cache.asm:1-17`, `src/layout.asm:32-42`). Line n starts at
`8000h` plus n times `200h`. `CLADR` works the address out by doubling n and
adding `80h`, which gives the high byte (`src/cache.asm:166-171`).

The cache's table is the next page. From `CTAB`, `BC00h`, each line has four
bytes for the number of its card block, `FFFFFFFFh` while the line is empty.
From `CDIRTY`, `BC80h`, each line has a byte that is nonzero while the line
holds changes the card lacks. A line is therefore empty, clean or dirty. An
empty line has no block. A clean line holds a block the card has too and a dirty
line holds a block whose newest bytes are only here. Every line is empty after a
cold boot. The boot clears EXPAND 1 and marks each line empty before it mounts
the card, as [Chapter 16](16-reset-and-boot.md) describes
(`src/boot.asm:77`, `src/boot.asm:235-252`). The mount then reads the
container's table into a line, an ordinary clean one that `CTAKE` gives out
again in turn (`src/vol.asm:380-416`). Chapter 18 explains the mount.

The lines are keyed by the block's number on the card, `SDLBA`, and not by
drive and block within the volume. The absolute card address identifies a
block independently of the drive used to reach it. The lookup therefore
prevents two lines from holding separate copies of the same block
(`src/cache.asm:49-91`).

The cache's lines and table are in EXPAND 1. Its five existing control bytes are
in the resident workspace above the RAM BIOS table (`src/ram.asm:310-325`):

- `CNEXT`, the next line to give out
- `CWTYPE`, the write type of the current BIOS `WRITE` in its low bits,
  with bit 5 set for a data write held to coalesce
- `CIFF`, the saved flags containing the interrupt state at the BIOS call's entry
- `CANY`, nonzero while a data line may be held behind on the logged drive
- `CPEND`, the pending block's line plus one, 0 for none

The first-dirty queue and its frozen-round copy live separately in classic
RAM with worker context. Each stores line numbers whose cache entries retain
their complete block tags. A received rewrite neither duplicates an entry nor
moves its first-dirty position. Successful removal invalidates the old frozen
slot before reuse (`a40d482:src/hk.asm:1-122`,
`a40d482:src/ram.asm:412-426`).

To reach the table, a routine takes from `CXON` the latch value with
`LATEXP` ORed into `LATCHV` and writes it to the latch. It reads or writes
the bytes with no `PUSH`, `POP` or `CALL` in between, then puts `LATCHV`
back (`src/cache.asm:30-41`). [Chapter 15](15-state-and-memory.md#expand-1-and-the-stack-boundary) explains why no
stack may be used while EXPAND 1 is in view.

## A record read through the cache

Every volume's reads go through the cache. BIOS `READ` maps the record to a card
block and a quarter of it and calls `CREAD` (`src/bios.asm:395-399`,
`src/cache.asm:406-417`). `CLOOK` compares `SDLBA` with each line's block number
in turn, from line 0 (`src/cache.asm:49-91`). On a hit, `CRDREC` copies the
record's 128 bytes from the line to the DMA address. On a miss, `CTAKE` gives
out a line, `CFILL` reads the card block straight into it and the record is then
copied from the line.

The block goes from the card into EXPAND 1 with no copy through another buffer.
`CFILL` sets `SDXB` to `LATEXP` for the call and `SDREAD`'s byte loop puts
EXPAND 1 in view while it fills the buffer (`src/cache.asm:183-201`,
`src/sd.asm:469-478`). A failed read leaves the line empty.

`CTAKE` still chooses a clean line cyclically from `CNEXT`, wrapping from
29 to 0. This read-cache replacement policy is not least recently used. When
all lines are dirty, a bounded first-dirty pass tries every eligible line once.
It can use any clean slot freed even if another line refused. If none is freed,
allocation fails and every acknowledged dirty line stays available for retry
(`a40d482:src/cache.asm:308-374`).

### Historical read measurements

The following BIOS, CLOOK, READ and BIG.BIN costs are the `46cf3f1` receipts.
They preserve the workload and byte/EOF observations. Wrappers and queued work
require new containing-call measurements.

On the four-drive starter, a BIOS read in `DIR /W` that hits takes 13,538
T-states, with its record going to the directory buffer `DIRBUF`. In
`DIR /W B:`, misses take 235,235–235,280. These are complete BIOS reads,
including lookup and copying. The four reads on A all hit; the empty WORK
directory makes 32 misses and 96 hits while it is scanned.

`CLOOK` itself takes 264 T-states for a hit in line 0 in the READ workload.
Its misses take 1,977–2,021 across these READ, SAVE and directory workloads;
the saved Z flag distinguishes hits from misses in the trace.

`CRDREC` and `CWRREC` put the two banks in `XMDST` and `XMSRC` as 0 for the
program's view and 1 for EXPAND 1. Both then call `MVCOPY`, the cache's copy
routine (`src/cache.asm:370-395`). A copy within a
single bank is one `LDIR` with that bank in view (`src/cache.asm:680-684`,
`src/cache.asm:777-783`). A copy between EXPAND 1 and an address in EXPAND
0, such as `DIRBUF`, can't have both ends in view. The two banks share the
one window. The part of the bank-0 end below `8000h` is in view whatever the
latch holds. That part goes by one `LDIR` with EXPAND 1 selected
(`src/cache.asm:685-739`). The part in EXPAND 0 goes a byte at a time, with
the latch switched between each read and its write
(`src/cache.asm:742-771`). The copy uses no stack while EXPAND 1 is in view,
because the caller's stack may be in EXPAND 0 (`src/cache.asm:13-17`).
`MVEND` writes `LATCHV` back to the latch and enables interrupts only if
they were on at entry (`src/cache.asm:790-804`). A BIOS read to a DMA
address below `8000h` can use the faster fixed-RAM copy path. In the READ workload below, reads to `0080h` take 4,565–6,334 T-states on
a hit and 226,345–226,346 on a miss. The directory buffer uses the slower
EXPAND-0 copy path; those timings must not be interchanged.

The READ program gives a complete-file comparison. Its 24-byte binary opens
the file named on its command line and repeatedly reads records to `0080h`
with function 20:

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

This recipe assembles READ on the PC with TAS, as Chapter 27 explains, and
places it and a 12,288-byte file on A, with a G8M volume on B for the later
write comparison:

```sh
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { assembleProgram } from "./tools/lib/assemble.mjs";
const [src, out] = process.argv.slice(1);
writeFileSync(out, (await assembleProgram(src)).bytes);
' read.asm read.com
head -c 12288 /dev/zero > data.bin
node tools/tecvol.mjs create time.img --volume G1M:SYSTEM:A --volume G8M:WORK:B
node tools/tecvol.mjs put time.img A read.com
node tools/tecvol.mjs put time.img A data.bin
```

`tools/capture.mjs` prints no T-state count so the figures come from a script
that drives `Machine` as it does, on `time.img`, which has no startup file and
so no shell. The script reads the model's count, `cycles`
(`host/machine.mjs:284`), twice. The first reading is after `READ
DATA.BIN` has been typed and echoed, before the Return that ends it. The second
is at the next prompt. After a cold boot, the command's first run took
6,617,943 T-states, 1.65 seconds. The next run took 1,318,031, 0.33 seconds,
a fifth of the first. Both figures include loading the program from
drive A. The trace counts the loader separately: it reads READ.COM's
one record and its EOF. The program's data loop makes one function-20 call
per data record, followed by its own EOF call.

The gain depends on which blocks remain in the cache. A 15,360-byte file,
`BIG.BIN` on a copy of `time.img`, took 2.04 seconds and then 2.10. The
counts were 8,165,728 and 8,388,441 T-states. `CTAKE`
had given up each line before the next read reached it. The file data alone
occupied all 30 lines, leaving no room for the directory and program blocks
read along the way.

## Two kinds of drive, one queue

The logged drive is the CCP's `BOOTDRV`, selected at the prompt. It can retain
multiple changed blocks. All other volumes still share one pending block,
`CPEND`; changing blocks flushes it. A program's function 14 does not itself
redefine the logged drive. Read-only volumes still refuse writes
(`a40d482:src/bios.asm:329-358`, `a40d482:src/cache.asm:543-601`).

These boundaries no longer describe every occasion on which data reaches SD.
Each admitted outer BDOS, hardware-service or returning BIOS entry attempts one
eligible dirty block before its normal operation. Nested public calls inherit
that context rather than recursively scheduling workers. `OUTCHAR` and
`READDIR` have selected additional private opportunities
(`a40d482:src/hk.asm:124-202`, `a40d482:src/services.asm:26-68`,
`a40d482:src/cpm/bdoslog.asm:17-22`).

Updates already received still merge into one cached block, preserving its other
records. TEC-OS does not delay a ready write to await possible future updates.
The next public write can commit the preceding update to that same block: four
separately issued record calls can produce four block writes. There is no
cross-call promise of one SD write per block.

### Required writes and ordinary opportunities

A directory write attempts all data prerequisites before its own metadata.
A failed prerequisite or metadata write rejects and drops that unpublished
directory image. It must never be replayed later by queue retries. Failed
acknowledged data, by contrast, remains dirty and queued
(`a40d482:src/cache.asm:265-306`, `a40d482:src/cache.asm:550-569`).

BDOS 1, 10 and 11, function 6 input and BIOS `CONIN` retain their required
input drains, subject to errors. BIOS `CONST` and the raw reader get ordinary
entry service, not a new full-drain promise. Function 48, warm boot, directory
work and valid drive/volume changes keep their required flush paths. Invalid
or same-selection paths can return earlier. An unmodified or read-only close
need not globally drain the queue
(`a40d482:docs/recovery.md:53-66`, `a40d482:src/cache.asm:603-649`).

| Operation or event | Effect on cached writes |
| --- | --- |
| Admitted outer OS call | One eligible dirty block attempted before the call's normal work |
| Required full flush | A bounded pass attempts eligible lines, retaining acknowledged data that refuses |
| Directory publication | Data prerequisites first, metadata only after success |
| Immediate guest stop after a successful record call | The newest record can still be only in RAM |
| Cold reset or power loss | Uncommitted RAM changes are lost; previous physical writes are not undone |

An unrelated maintenance refusal does not replace the operation's own result.
The separate notices below report pending state. A prompt after `Write pending`
is not proof of completion; queue clearance does not close an unclosed file.

### Historical off-drive SAVE measurements

The following times and write counts are the `46cf3f1` observations. Entry
service intentionally changes traffic across public record calls. Retain their
source, input sizes and actual byte/file-length checks when retaking them.

The SAVE comparison uses a fresh `time.img` for each run, with the same
READ and DATA files still on A. SAVE counts 256-byte pages, so 8, 16 and
160 pages mean 2,048, 4,096 and 40,960 bytes, or 16, 32 and 320 records.
With A logged, `SAVE 8 B:X.COM` took 2.782 seconds, `SAVE 16` 3.069 and
`SAVE 160` 8.607. Each interval starts before Return and ends at the next
prompt, including B's first directory login. The recorded SDWRITE calls all
returned success, and the file read from the resulting card matched the
RAM bytes saved.

The 8-page run wrote six blocks in this order: directory block 4096,
data blocks 4128–4131, then directory block 4096 again. Each of the four
data blocks was written once, after its records had been collected. The
16-page run made ten writes: eight data blocks and two directory writes.
The 160-page run made 85 writes: 80 data blocks and five directory writes,
including extent transitions. These are measured counts, not a promise
that every workload writes each block only once.

## Collecting records on the logged drive

A card block holds four 128-byte records. On a miss it is filled from the card,
unless the new-allocation rule allows zeros. Ordinary overwrites preserve other
records. `CWRREC` copies the record and `CDSET` marks the line changed; `HKADD`
adds it only if it is not already queued. A successful data return can mean
acceptance into cache rather than completed SD output
(`a40d482:src/cache.asm:143-164`, `a40d482:src/cache.asm:449-543`,
`a40d482:src/hk.asm:5-27`).

Descriptor byte 15 stays reserved. The logged drive's multiple-block rule is
not a volume attribute. Ordinary entry service applies to this drive too; it
can write a line before a later call rewrites it.

A directory write excludes its unpublished line while attempting prerequisites.
It publishes that line only after success. Failed acknowledged data stays
queued, but rejected metadata is dropped whether the failure was a prerequisite
or the directory write itself. A later data flush cannot repair that rejected
directory update; the program must check the API error and complete or repeat
its file operation (`a40d482:src/cache.asm:550-569`).

### Historical logged-drive SAVE measurements

The following comparison, line-number transfer order and close costs belong to
`46cf3f1`. They are retained evidence, not the housekeeping queue's ordering or
traffic. Fresh paired measurements must retain these workloads and byte oracles.

Selecting `B:` before the measured command makes the same destination
the logged drive. On fresh two-volume cards, the results were:

| SAVE pages | Bytes | A logged, seconds | B logged, seconds | SDWRITE calls in either run |
| ---: | ---: | ---: | ---: | ---: |
| 8 | 2,048 | 2.782 | 0.488 | 6 |
| 16 | 4,096 | 3.069 | 0.767 | 10 |
| 160 | 40,960 | 8.607 | 6.205 | 85 |

B's directory was already logged by the drive change, outside its timed
interval; the faster total is therefore not a measurement of write policy
alone. The larger logged-drive run also flushed data blocks in cache-line
order rather than ascending block order. The trace contains the same
80 data-block writes and five directory writes, and the completed file
again matched the saved RAM bytes.

The close in the logged-B 8-page run took 1,129,449 T-states, including the
four retained data blocks and the directory update. With A logged, each
preceding off-drive block transition had already flushed the earlier
pending block; that close took 477,956 T-states. Both obey the same
data-before-directory rule.

## First-dirty order and bounded passes

`HKQ` records first-dirty order. `HKROUND` freezes eligible line numbers for a
service round, which advances after refusal as well as success. New arrivals
cannot extend it. Rewriting a dirty line leaves its position intact. Successful
removal invalidates stale round slots before reuse. Later healthy lines can
progress, while continued arrivals cannot indefinitely postpone the failed
line's next eligible retry (`a40d482:src/hk.asm:1-122`).

`CFLUSH` takes a fresh snapshot, excludes the caller's directory line when
needed and attempts each eligible line once. `CFLALL` is the no-exclusion warm
boot path. Both retain failed acknowledged data. All-dirty pressure also takes
a bounded pass and uses any freed clean slot. This ordering is separate from
the cyclic clean-line replacement cursor (`a40d482:src/cache.asm:265-374`).

Data precedes metadata that names it, but there is no journal or rollback.
Existing files can contain mixed old and new blocks; an unclosed new file can
have data on SD without completed directory metadata. A physical block write
can leave old, new or mixed contents and a damaged directory block can affect
sixteen entries (`a40d482:docs/recovery.md:106-131`).

## A failed write and its notices

An acknowledged data line that later fails stays dirty and queued, including
through warm boot. `CWBOOT` cancels remaining chained commands after a failed
pass, but retains the data. Rejected directory metadata has a different lifetime:
it is dropped so a later retry cannot publish an operation already refused
(`a40d482:src/cache.asm:638-649`, `a40d482:src/cache.asm:550-569`).

`HKNOTICE` reports the cache separately from API return registers:

- `Write pending` warns once during a failed-write episode with dirty retries.
- `Cache clear` follows a reported pending episode after its queue drains.
- `Write error` reports an otherwise unreported failure with no dirty retry,
  such as rejected metadata; it does not claim recovery.

Function 45's silent `FFh` mode defers notices while preserving the event.
An unrelated query or hardware call keeps its own result despite a maintenance
refusal (`a40d482:src/hk.asm:204-237`).

`Cache clear` describes cached record writes, not file closure, repair of a
rejected directory entry, browser persistence or physical power-loss durability.
Close the file normally, check its result and await successful cache completion
before reset. A prompt after `Write pending` is not proof of preservation.

Card reinsertion does not establish a usable original backend. There is no
card-detect line or CID check here, and neither warm boot nor the Enter-retry
console runs `SDINIT`. Enter is not permission to replay the queue onto an
inserted stranger. Resolve the original initialised backend failure, or accept
that cold reset discards retained RAM. A full dirty cache can refuse a new
allocation without throwing away acknowledged data
(`a40d482:docs/recovery.md:206-222`).

### Historical failed-close capture

The following short-image recipe and complete transcript remain the `46cf3f1`
evidence. They show its old discard behaviour, not housekeeping output. That
permanently short image can now enter bootstrap recovery. Its replacement must
be captured separately, alongside a case of retained data and later `Cache clear`
on the original initialised backend. Check rejected metadata and failed-close
file length too: queue recovery alone does not repair the directory.

The run below left X.COM in the directory after a failed close. Its buffered
records did not reach the card. It uses the prepared starter image and
matching ROM. The PC setup is described in
[Chapter 6](06-cards-on-the-pc.md#the-host-tools) and matching media in
[Chapter 27](27-build-the-rom-and-media.md). The shell recipe also
requires `cp` and `truncate`. It changes a separate image, not the working card.

The image ends 32 card blocks into WORK, just past its directory. The directory
is present but the file's data area is outside the shortened image:

<!-- Not a physical-card experiment. -->
```sh
cp dist/starter.img nodata.img
truncate -s 2113536 nodata.img
```

<!-- TEC-OS 46cf3f1: node tools/capture.mjs --card nodata.img '@start SAVE 1 B:X.COM' '@key x' 'DIR B:'. Complete captured console transcript. -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK
C: PROJECTS

A>SHELL.SVC

A:SYSTEM>GLCD.SVC

A:SYSTEM>SAVE 1 B:X.COM

Bdos Err On B: Bad Sector
Write lost
A:SYSTEM>DIR B:

X       .COM       0
1 file, 0 bytes
8372224 free on B:WORK
A:SYSTEM>
```

In this historical run, `SAVE` first made X.COM's empty directory entry and buffered its two records.
The close's data flush could not write their block and failed with
`Bad Sector`. After the recovery key, `x` in this capture, warm boot tried the
block again, dropped it and printed `Write lost`. The failed close did not publish
the updated record count or allocation map. In this fixture the on-card file
therefore still had no records
(`src/cpm/ccpcmd.asm:266-390`, `src/cpm/bdosfile.asm:210-217`,
`src/cache.asm:624-640`).

DIR still listed X.COM because making the empty entry had succeeded before the
failed close. Its name in the listing does not establish that the two buffered
records reached the card.

## Time with maskable interrupts off

The timings below are historical `46cf3f1` receipts. Entry work on the private
stack changes containing-call costs and write traffic; fresh measurements are
pending. Long TONE and raw-reader calls have no new progress deadline.
The separate registered TED-save ceiling is 1,682.95425 ms for the pinned
60-line source on PICO80. It is a fixture-specific acceptance bound, not a new
measurement of the READ/SAVE examples here or a promise for every source and
display. Fresh book receipts must keep those workloads separate.

The cache's routines put EXPAND 1 in view many times in each BIOS call. The
window at `8000h–BFFFh` then holds the cache and not the workspace and the
stacks. An interrupt taken then would push its return address into EXPAND 1
and run its handler with the wrong memory in the window. So the BIOS's
`READ` and `WRITE` disable maskable interrupts across their mapping and
cache work (`src/cache.asm:13-17`).

`CDI` at each entry calls `IFFGET`, whose `LD A,I` copies the interrupt
flip-flop into the P/V flag. An NMOS Z80 can clear that flag when it accepts
an interrupt during the instruction. `IFFGET` therefore repeats the test
when the flag is clear (`src/bios.asm:367-371`). `CDI` turns interrupts off
with `DI` and saves the flags in `CIFF` (`src/bios.asm:379-386`). `BRET` at
each exit turns the result's Z flag into `A`, 0 for success and 1 for an
error. `CEI` turns interrupts on again only if `CIFF` shows they were on at
entry (`src/bios.asm:432-446`, `src/bios.asm:395-399`,
`src/bios.asm:418-422`). A call made with interrupts off returns with them
off. `VFLUSH`, in the volume services, uses the same pair around its flush
(`src/volsvc.asm:373-389`). `MVCOPY` calls `IFFGET` too and keeps its own copy of the state
(`src/cache.asm:659-661`).

Maskable interrupts come on only when a program or a service enables them, as
Chapter 16 states. The ROM's executable `EI` instructions restore a saved state.
The places are `CEI`, `RXBITS`, `TXBYTE`, `MVEND` and the
PICO9918's `VPAIR` (`src/bios.asm:437-446`, `src/console.asm:306-331`,
`src/console.asm:363-393`, `src/cache.asm:799-804`,
`src/pico.asm:443-454`). The boot also writes `EI` followed by `RETI` at `0038h`
when no resident jump is retained there. That code runs on an interrupt or a
program's `RST 38h` (`src/boot.asm:373-382`). DI does not block a non-maskable
interrupt (NMI). These routines therefore require the NMI conditions described
in Chapter 15 as well as their maskable-interrupt protection.

For a program that enables maskable interrupts, the protected portion of a BIOS
disk call holds them off across mapping, cache work and card I/O. A read that
misses holds them off for about 235,000 T-states, 59 milliseconds. A directory
write, on any drive, holds them off while every dirty line is written, and so
does a console read when a line may be held behind. After `SAVE 8 B:X.COM` the close of that file of four blocks takes
1,129,449 T-states in the logged-B measurement above. Each line's `CWRITE` costs 217,338 T-states. Multiplying it by 30 gives about 6.5 million T-states, or 1.6 seconds,
for data transfer alone. That is an estimate from the model cost, not a measured
all-dirty flush or an upper bound for a physical card.

Under housekeeping, avoiding explicit disk or flush calls is insufficient for
an interval that requires short interrupt response. An admitted light BDOS call,
hardware query or returning BIOS call can first attempt a queued SD write.
The selected private opportunities in `OUTCHAR` and `READDIR` can do that too.
The worker calls `CDI`, attempts the line and then calls `CEI`, so these ordinary
opportunities can incur the disk-critical interrupt-off interval before the
operation's usual work (`a40d482:src/hk.asm:124-202`,
`a40d482:src/cpm/bdoscon.asm:169-171`, `a40d482:src/cpm/bdoslog.asm:17-22`).

Plan storage work and resolve pending writes before a latency-sensitive interval;
account for ordinary public/private opportunities as well as required input,
directory and explicit flush paths. A read-cache miss can also require SD I/O.
There is no new wall-clock deadline or universal short-call timing guarantee.
