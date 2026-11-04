---
title: The SD card and the volumes
parent: TEC-OS
nav_order: 18
nav_group: "Part II: Inside TEC-OS"
---

# 18. The SD card and the volumes

Checked against TEC-OS 621201d.

The BDOS reads and writes tracks and sectors of 128 bytes, and the SD card
stores numbered blocks of 512. TEC-OS joins the two in three layers. At the
bottom is a driver that exchanges data with the card over SPI, bit by bit
through one port. Above it, cold boot reads the container in the card's first
blocks, checks it and then builds the drive table and each drive's disk
parameter header. At the top, the BIOS's disk entries turn a track and sector
into a block of the card and a quarter of that block.

This chapter takes the layers from the bottom up, and ends with the volume
services, through which `MOUNT` changes and lists the drives. Chapter
19 describes the block cache, which every read and write passes through.

## The SD card driver

The card is on the TEC-1G's SD card adaptor at port `FDh`
(`src/layout.asm:12`), and the driver makes every clock edge itself by writing
to that port. Three output bits drive the card's lines: bit 0 its data in
(MOSI), bit 1 its clock and bit 2 its chip select, active low. Bit 7 of the
input is the card's data out, MISO (`src/sd.asm:1-6`). Data changes while the
clock is low and the card samples it on the rising edge. Every routine returns
Z on success, and on failure NZ with an error code in `A` and in `SDERR`.

Sending a byte is eight passes of a loop. Each pass shifts the top bit of `C`
into the carry, puts it on bit 0 with the clock low, then writes the same bit
with the clock high (`src/sd.asm:22-33`). Receiving is the same loop with MOSI
held high: clock low, clock high, read the port and shift bit 7 into the
result (`src/sd.asm:35-49`). `SPIEND` raises chip select and gives the card
eight more clocks (`src/sd.asm:51-64`).

A command is six bytes after an idle `FFh`: the command number with bit 6 set,
four argument bytes from `SDARG`, most significant first, and a CRC byte
(`src/sd.asm:66-108`). In SPI mode the card checks the CRC only of `CMD0` and
`CMD8`, so `SDCMD` sends `95h` and `87h`, the correct bytes for those two with
the arguments TEC-OS uses, and `01h`, the end bit alone, for the rest. It then
reads up to 16 bytes, waiting for the response byte R1, whose bit 7 is 0.

`SDINIT` starts the card at cold boot, and each step has its own error code
(`src/sd.asm:137-230`):

1. Chip select high and 80 clocks, more than the 74 the card needs after
   power-up, then `CMD0`, which puts the card in SPI mode and its idle state.
   The card must answer R1 = `01h`. After ten tries with no such answer the
   error is 1, `SDENOCD`, which is what an empty socket gives.
2. `CMD8` with the argument `1AAh`, the voltage range and a check pattern. A
   card of version 2 answers `01h` and four more bytes, the last two of which
   are its echo of the argument: the low four bits of the third must be 1, the
   range of 2.7 to 3.6 V, and the fourth must be the pattern `AAh`. Any other
   echo is error 0Bh, `SDEVOLT` (`src/sd.asm:165-178`). An older card rejects
   the command, and initialisation goes on.
3. `CMD55` and `ACMD41` with the high-capacity bit set, repeated up to 256
   times with a short pause between, until R1 is 0, the card ready. Error 2,
   `SDEINIT`, if it never is. The same error comes at once, with no `ACMD41`
   sent, when `CMD55`'s R1 has any bit set but bit 0, the idle state
   (`src/sd.asm:186-187`, `src/sd.asm:199-202`).
4. `CMD58`, which returns the operating conditions register. Bit 6 of its
   first byte, CCS, is set on a high-capacity card, which takes block numbers
   as addresses. Error 3, `SDEOCR`, if the command fails.
5. On a standard-capacity card, which takes byte addresses, `SDBYTE` is set to
   1 and `CMD16` sets the block length to 512. Error 4, `SDEBLEN`, if it
   fails.

Every later access gives the driver a block number in `SDLBA`, four bytes,
least significant first. `LBAARG` turns it into the command's argument, which
depends on the card's capacity: a high-capacity card gets the number as it is,
and a standard one gets it shifted left by 9, the block times 512
(`src/sd.asm:243-267`). The argument has 32 bits, so a standard-capacity card
can't be given a block number of `800000h` or more, 4 GiB or more into the
card: the shift would lose its top bits and name a lower block. For such a
block `LBAARG` returns with carry set and `SDARG` unchanged. `SDREAD` and
`SDWRITE` then send no command and fail with error 9, `SDERNG`
(`src/sd.asm:18`, `src/sd.asm:272-274`, `src/sd.asm:313-315`,
`src/sd.asm:498-501`).

`SDREAD` reads a block with `CMD17` (`src/sd.asm:272-303`). A nonzero R1 is
error 5, `SDECMD`. The card then sends `FFh` until the data is ready and `FEh`
before it. The driver polls for that token up to 65,536 times before it gives
error 6, `SDETOK`. A card that can't read the block sends a data error token,
a byte of the form `000xxxxx`, in place of `FEh`. Any byte but `FFh` and `FEh`
ends the read at once with error 0Ah, `SDEDTOK` (`src/sd.asm:285-298`). The
512 bytes follow the token, then a two-byte CRC that the driver reads and
doesn't check.

`SDWRITE` writes a block with `CMD24` (`src/sd.asm:498-544`). R1 must be 0, or
the error is 5. The driver then sends `FFh`, the token `FEh`, the 512 bytes
and two CRC bytes. The card's data response must come within 16 bytes and have
`05h` in its low five bits, data accepted, or the error is 7, `SDEWRSP`. The
card then holds its data line at 0 while it programs the block. The driver
waits up to 65,536 reads for the line to rise before it gives error 8,
`SDEBUSY`. A write therefore returns success only after the card has stopped
reporting busy.

The two block loops, `SDRBLK` and `SDWBLK`, are unrolled, with eight bits
written out in full for each byte. `SDRBLK` keeps its count of 256 two-byte
passes in the Z80's `I` register, which is free in interrupt mode 1
(`src/sd.asm:317-492`). On the model `SDREAD` takes 219,144 T-states for one
block, about 55 milliseconds, and `SDWRITE` 216,164, nearly all of it the
4,096 bits of the block moved one at a time.

When `SDXB` holds `LATEXP` the buffer is a line of the block cache in
EXPAND 1. Each loop then puts EXPAND 1 in view around itself and uses no stack
while it is (`src/sd.asm:321-325`, `src/sd.asm:419-422`, `src/sd.asm:427-431`,
`src/sd.asm:490-491`).

## The container's checks

The card holds one container, and its block 0 is the header. The header has
the name `TECOSVOL`, the format's version and the sizes of the header and of a
volume descriptor. It also has the number of volumes, the container's length
in blocks and a checksum. In format 1.1 it adds a drives field and a sum over
the rest of the table. The volume descriptors follow, 32 bytes each, fifteen
in block 0 and sixteen in each of blocks 1 to 7. Chapter 4 describes the
container from the user's side and Appendix E lists its fields. The offsets
the ROM uses come from `format/format.json` through the generated
`gen/format.asm`, as Chapter 12 describes.

A card can hold anything, so the ROM's `MOUNT` routine checks block 0 before it
uses any of it (`src/vol.asm:3-6`). `MNBLK` reads each block of the table into
a line of the block cache, from the card whenever the mount asks for a table
block other than the last one it read, and the same path serves cold boot and the volume services. `MNCP` copies 32
bytes of the line into `MNBUF`, a buffer in the workspace, where the header's
fields and each descriptor are read (`src/vol.asm:32-39`,
`src/vol.asm:285-337`, `src/ram.asm:58`). `MOUNT` makes the checks in a fixed
order, stopping at the first failure with that check's code
(`src/vol.asm:13-24`, `src/vol.asm:32-145`):

| Code | Check |
| --- | --- |
| `20h` | block 0, or a block of the table, reads |
| `21h` | the first eight bytes are `TECOSVOL` |
| `22h` | the major version is 1 |
| `23h` | the header is 512 bytes and a descriptor 32; in 1.1, the drives field is at most 4 |
| `24h` | the volume count is from 1 to 8 on a 1.0 card, and from 1 to 127 on any other |
| `25h` | the header's checksum, the 16-bit sum of its other 510 bytes; in 1.1, the table's sum |

Format 1.0 allows eight volumes, `MAXVOL0` in `gen/format.asm`, so a 1.0 card
with nine is refused with `24h` (`src/vol.asm:68-87`). `tecvol` makes a card of
more than eight volumes in format 1.1 (`tools/lib/container.mjs:80`). Any minor
version other than 0 is read as 1.1 (`src/vol.asm:104-106`). A 1.1 drives field
above 4 is refused with `23h`, the size code, after the header's checksum is
checked (`src/vol.asm:107-112`). For a 1.1 card with more than fifteen volumes,
`MOUNT` reads each further block of the table and adds up its 512 bytes, and
the total must be the header's table sum (`src/vol.asm:116-145`). The table's
blocks and the header are added up by the same routine, `MNSUM`, which copies
the block from its line through `MNBUF` 32 bytes at a time and adds each 32
with `SUMDE`, since no code that uses the stack runs with EXPAND 1 in view
(`src/vol.asm:137`, `src/vol.asm:339-358`, `src/volutil.asm:53-84`).

Then it walks the descriptors in table order, checking each one and mounting
it as it goes (`src/vol.asm:147-264`):

| Code | Check |
| --- | --- |
| `26h` | the volume id is not 0; no flag but read-only is set; the geometry is known; the length is that geometry's payload exactly; the start block is not 0 and a multiple of 8 |
| `28h` | the start is at or after the previous volume's end |
| `27h` | start plus length has no carry out of 32 bits and ends within the container, and on a standard-capacity card with its last block at or below `7FFFFFh` |
| `29h` | the drive byte is `FFh` or 0 to 3, below a 1.1 header's drives field when that field is not 0, and not a drive already taken |
| `2Ah` | after the last descriptor, drive A has a volume |

The checks of code `26h` share one failure path: each jumps to `MNDBAD`, which
loads the code and runs on into `MNTERR` (`src/vol.asm:160-190`,
`src/vol.asm:271-272`).

The order check makes overlapping volumes impossible, since each must start
where the one before it ended or later. The descriptors therefore have to be
in ascending order of their start block. The ROM uses only bit 0 of a
descriptor's cache byte, the written-behind flag, and doesn't check the others
(`src/vol.asm:429-433`).

Any failure unmounts every drive that the walk had mounted, so a card is
mounted whole or not at all (`src/vol.asm:272-276`). The ROM can't find the
card's capacity, and the walk checks a volume against the container's length.
A volume that runs past the end of the card is mounted, and the card rejects
an access that reaches a block beyond its end. The driver returns error 5, and
the BDOS reports `Bad Sector` for that drive while the rest of the card works.
On a standard-capacity card the walk also refuses, with error `27h`, a volume
that runs past block `7FFFFFh`, whether it starts beyond that block or
straddles it, since `LBAARG` can't name its blocks (`src/vol.asm:221-236`).
`test/sd-range.test.mjs` places drive B's volume of a standard-capacity card at
block `800800h` and then at `7FF000h`. Both times cold boot stops at the
diagnostic prompt with error 27 and no byte of the card changes. A volume
whose last block is `7FFFFFh` mounts, and so does the straddling volume on a
high-capacity card (`test/sd-range.test.mjs:36-45`).

The host model's card fails an access past the end of its image in the same way
and changes nothing. For the run below, a copy of `dist/starter.img` was cut to
its first 4,112 blocks with `truncate -s 2105344 build/short.img`, which leaves
the first 16 of drive B's 32 directory blocks. `DIR B:` logs the drive in, and
the read of its 17th directory block fails:

<!-- node tools/capture.mjs --card build/short.img "@start DIR B:" "@key x" "DIR A:*.CMD" -->
```text
A>DIR B:

Bdos Err On B: Bad Sector
A>DIR A:*.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

Cold boot sends any failure, of the card or of the container, to the
diagnostic prompt (`src/boot.asm:67-70`). For the run below, the starter
card's first byte was changed from `T` to `X` with
`printf X | dd of=build/bad.img bs=1 seek=0 conv=notrunc` on a copy of
`dist/starter.img`. `H` was then typed at the prompt:

<!-- node tools/capture.mjs --card build/bad.img H -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 21
R retry> H
R retry> 
```

Error 21 is `MEMAGIC`, the check of the name (`src/vol.asm:14`). Any key but
`R` gives the prompt again (`src/boot.asm:479-489`), and the header's bytes can
be read on a PC, as Appendix E shows.

## The drive table and the DPHs

The BIOS needs a volume's place on the card and the BDOS needs its parameters,
so mounting builds an entry in the drive table and a DPH. Each descriptor that
names a drive is mounted by `MNONE` (`src/vol.asm:398-411`). `MNFILL` writes
the drive's eight-byte entry in `DRVTAB`: the start block in four
bytes, the length in blocks in two, the geometry and a flags byte with
read-only in bit 0 and written-behind in bit 1. The start and the length's low
half lie together in the descriptor, so one `LDIR` copies those six bytes
(`src/vol.asm:413-434`,
`src/ram.asm:23-27`). `DRVIDX` records which volume each drive holds, as its
index in the container plus 1, 0 for none (`src/ram.asm:29`). The geometry
byte is 0 for a drive with no volume, and for such a drive the BIOS's `SELDSK`
returns 0, no such drive (`src/bios.asm:36-60`).

`MNDPH` builds the drive's disk parameter header, the 16 bytes through
which the BDOS reaches a drive's parameters and buffers, at the address that
`DPHADR` computes, for `SELDSK` too (`src/vol.asm:436-466`,
`src/bios.asm:49-58`):

| Offset | Contents |
| ---: | --- |
| 0 | the sector translation table: 0, no skew |
| 2–7 | three words for the BDOS's own use, zeroed |
| 8 | `DIRBUF`, the 128-byte directory buffer every drive shares |
| 10 | the disk parameter block of the volume's geometry |
| 12 | `CSVDUM`, a check vector that is never used, since `CKS` is 0 |
| 14 | the allocation vector, set by `ALVINIT` |

The disk parameter blocks are `DPB1` and `DPB2` in `gen/geom.asm`. Both
geometries have 64 records a track, no reserved tracks and four directory
allocation blocks. G8M has 2,048 blocks of 4 KiB and 512 directory entries,
and G1M has 512 blocks of 2 KiB and 256 entries. `CKS` is 0 in both: CP/M 2.2
uses the check vector to detect a changed floppy, and the card is treated as
fixed media.

To keep a drive logged in across a warm boot, TEC-OS's BDOS uses the three
scratch words for a sum of its allocation vector, a flag set when it has
changed and a mark, the number of directory entries to read when the vector is
rebuilt (`src/cpm/bdosfile.asm:41-75`). Chapter 16 describes that, and Chapter
13 how `ALVINIT` places the vectors at cold boot.

## Deblocking

The BDOS reads and writes 128-byte records through the BIOS, by track and
sector. Every geometry has 64 records a track and no reserved tracks, so the
BIOS numbers the volume's records straight through, record = track × 64 +
sector. Four records share one 512-byte block of the card
(`src/bios.asm:5-10`). `SETTRK`, `SETSEC` and `SETDMA` store their values,
`HOME` sets track 0, and `SECTRAN` returns the sector unchanged
(`src/bios.asm:12-34`).

`MAPREC` does the arithmetic (`src/bios.asm:74-144`). It rejects a sector of
64 or more and a track of 1,024 or more, whose record number would not fit in
16 bits. It keeps the record's low two bits as `BLKSLOT`, the quarter of the
block, and the record divided by 4 becomes `BLKOFF`, the block within the
volume. `BLKOFF` must be less than the volume's length from the drive table,
and the volume's start block is then added to it, in 32 bits, to give `SDLBA`,
the block of the card. A G8M volume's 16,384 blocks are 65,536 records, 1,024
tracks, and a G1M volume has 128 tracks.

`READ` maps the record and copies it to the DMA address through the block
cache, as Chapter 19 describes. `WRITE` has more to do
(`src/bios.asm:171-271`). After mapping it rejects a write to a read-only
volume before anything changes, with error 1 (`src/bios.asm:191-195`). A change
made through the BDOS doesn't get this far, since the BDOS's own `R/O` error
comes first (`src/cpm/bdoslog.asm:567-571`). Function 16 tests the drive too,
before it writes the directory entry, and on a read-only drive it writes
nothing and returns success, as CP/M 2.2's close does. Closing an FCB that was
never opened on such a drive returns 0 with the card unchanged
(`src/cpm/bdosfile.asm:169-172`, `test/cpm22.test.mjs:174`). Only a program that
calls the BIOS itself receives the error.

A write to the directory can change which blocks are in use, so `WRITE` then
tests for one of the directory's blocks, the first 32 blocks of a G8M volume
or 16 of a G1M. For such a block it sets the drive's changed flag in the DPH
and raises its mark to cover the 16 entries of this block, so that the next
warm boot rebuilds the drive's vector from the entries up to there
(`src/bios.asm:197-235`).

A record is a quarter of a block, so a write merges its record into a whole
block. Every BIOS `WRITE` does this in the block's line of the block cache,
which is the one write path: `WRITE` decides whether the block has to be read
first and then goes to `CWRBH` (`src/bios.asm:171-181`, `src/bios.asm:236-271`).

The read is skipped when the card's copy of the block holds nothing that has
to be kept. CP/M's write type 2 marks the first write to an allocation block
the BDOS has just given the file, and for it the line is cleared to zeros
instead. The next write may go to the next block of the same allocation block,
with the block before it cleared. `GETKEY` records such a block in its key,
`BUFDRV` and `BUFBLK` with `BUFOK` at 2, and the next block is then cleared too
and not read (`src/bios.asm:146-156`, `src/bios.asm:236-263`,
`src/cache.asm:317-335`).

On a volume written through, `WRITE` sets bit 7 of `CWTYPE` before it goes to
`CWRBH`, and the line goes to the card before the call returns. If that write
fails, the line is dropped, so the next read of the block comes from the card
(`src/bios.asm:264-271`, `src/cache.asm:362-386`). On the volume written
behind the line stays dirty, as Chapter 19 describes.

A program that writes a new file sequentially on a volume written through
therefore causes no card reads for its data, but it causes four card writes
for each block, since the line goes to the card after each of its records.
`SAVE 8 X.COM` on drive A, 16 records in four blocks, writes 18 blocks, the 16
and two of the directory, and reads none: the directory's block is already in
a line.

## The volume services

`MOUNT` on the starter card is a program, so it changes and lists the drives
through three of the ROM's numbered services, called through `ABICALL` with the
number in `C`, as Chapter 20 describes (`src/abi.asm:10`, `src/abi.inc:58-70`):

- `MOUNT`, 9, mounts the volume at container index `E` on the drive in `B`, 0
  to 3 for A to D.
- `UNMNT`, 10, unmounts the drive in `B`, 1 to 3.
- `DESC`, 11, copies the descriptor at index `E` to the 32 bytes at `HL`, with
  its drive byte replaced by the drive the volume is on now, `FFh` for none.

The three routines, `VSMNT`, `VSUNM` and `VSDSC`, each start with `VSIN`, which
moves the drive from `B` to `C` and sets `MNTCB` to `FFh`, so that the table's
blocks are read again from the card (`src/vol.asm:575-587`,
`src/vol.asm:693-698`).
Each returns `A` = 0 with carry clear, or `TNEBAD`, 1, with carry set and
nothing changed (`src/vol.asm:673-677`). A mount fails in four cases: an index
past the table, a drive past D, a volume already on a drive and a drive whose
vector slot is too small for the volume. An unmount fails for drive A, which is
never left empty, and for a drive past D (`src/vol.asm:596-650`). The slot rule
is `VSLOT`'s: a volume of 4,096 blocks or more, a G8M, needs a 256-byte slot,
and any other needs a slot of either size (`src/vol.asm:634-647`). Chapter 13
describes how cold boot gives out the slots. The three services may change `IX`
and the alternate registers, and `abi.inc` gives 24 bytes as a bound on the
stack each takes (`src/abi.inc:18-25`, `src/abi.inc:58-70`). On the model
`MOUNT` and `UNMNT` each take 24 and `DESC` 22, and with every line dirty, so
that the line taken for the table is written first, all three take 24
(`test/storage-boundaries.test.mjs:176-241`).

A volume's data has to be on the card before the volume leaves its drive. So
before a mount or unmount changes a drive, `VFLUSH` writes every dirty line of
the block cache to the card, with interrupts off. A line whose write fails is
dropped and the rest are still written, and the call then fails
(`src/vol.asm:700-713`, `src/cache.asm:182-208`). A mount then clears the drive's old
entry, fills the new one and its DPH with `MNONE`, and records the index. An
unmount clears the entry. Either way the service ends by clearing `GETKEY`'s
key and calling BDOS function 37 to reset the drive, so that the drive's
next access logs it in from its new directory (`src/vol.asm:662-674`). That
call runs on the BDOS's own stack, so a program calls `MOUNT` and `UNMNT` from
outside its own BDOS calls (`src/abi.inc:21-23`).

The services write nothing of their own to the card, so the card's header still
names its own drives, and a power-off, or a reset whose kept selection no
longer matches, brings them back.

The run below shows the slot rule on the starter card. It is a format 1.0 card
whose two drives have vector slots, and whose C and D have none.
`MOUNT C: WORK` fails first because `WORK` is on B, and again after B is
unmounted because C has no slot. `MOUNT B: WORK` puts it back, and `MOUNT`
with no argument lists the container through the describe function
(`test/programs/mount.asm:159-208`):

<!-- node tools/capture.mjs "MOUNT C: WORK" "MOUNT B:" "MOUNT C: WORK" "MOUNT B: WORK" MOUNT -->
```text
A>MOUNT C: WORK
Cannot mount: in use or too large

A>MOUNT B:
Unmounted

A>MOUNT C: WORK
Cannot mount: in use or too large

A>MOUNT B: WORK
B: WORK       

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>
```

A card of format 1.1 with a drives field of 4 gives each of A to D a 256-byte
slot at cold boot, so on such a card `MOUNT C:` with a volume that is on no
other drive succeeds. The slots cost TPA: with four of them the TPA is 46,564
bytes, 704 fewer than the starter card gives.
