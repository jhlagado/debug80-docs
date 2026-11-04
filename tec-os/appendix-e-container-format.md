---
title: E. The container format
parent: TEC-OS
nav_order: 105
nav_group: "Appendices"
---

# Appendix E. The container format

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. -->

This appendix lists the container format: the header's fields, the volume
descriptors, the table's blocks beyond block 0, the ROM's checks with their
error codes and the two geometries. A TEC-OS card holds one container: block
0 is its header, and its volumes follow, each an ordinary CP/M disk. Chapter 4
describes the container from the user's side and Chapter 17 the ROM's mount.

The format is defined once, in `format/format.json`. The build generates the
ROM's field offsets and its geometry table from that file, as
`src/gen/format.asm` and `src/gen/geom.asm` (`tools/build.mjs:80-135`), and
`tools/lib/container.mjs` and `tecvol` read the same file through
`tools/lib/format.mjs`. All numbers of more than one byte are little-endian. A
block is 512 bytes, and block numbers count from the start of the container,
which `tecvol install` puts at the card's block 0.

## The header

The starter card's first 96 bytes hold the header's fields and the first two
descriptors:

```sh
od -A x -t x1 -N 96 dist/starter.img
```

```text
000000 54 45 43 4f 53 56 4f 4c 01 00 00 02 20 00 02 00
000010 00 50 00 00 f4 07 00 00 00 00 00 00 00 00 00 00
000020 01 00 00 00 00 08 00 00 00 08 00 00 02 00 00 00
000030 53 59 53 54 45 4d 20 20 20 20 20 00 00 00 00 00
000040 02 00 00 00 00 10 00 00 00 40 00 00 01 00 01 01
000050 57 4f 52 4b 20 20 20 20 20 20 20 00 00 00 00 00
000060
```

The header's fields (`format/format.json`, `header`):

| Offset | Bytes | Field | Starter card |
| ---: | ---: | --- | --- |
| 0 | 8 | Magic, `TECOSVOL` | `TECOSVOL` |
| 8 | 1 | Major version, 1 | 1 |
| 9 | 1 | Minor version, 0 or 1 | 0 |
| 10 | 2 | Header bytes, 512 | `0200h` |
| 12 | 2 | Descriptor bytes, 32 | `0020h` |
| 14 | 2 | Number of volumes | 2 |
| 16 | 4 | Container length in blocks | `00005000h`, 20,480 |
| 20 | 2 | Checksum | `07F4h` |
| 22 | 1 | 1.1: the number of drives to set up, 0 to 4; 0 in 1.0 | 0 |
| 23 | 2 | 1.1: the table's sum; 0 in 1.0 | 0 |
| 25 | 7 | Reserved, 0 | 0 |
| 32 | 32 each | The first 15 volume descriptors | 2 |

The checksum is the 16-bit sum of all 512 bytes of block 0 except the two
bytes of the checksum itself (`tools/lib/container.mjs:51-59`). The ROM sums
all 512, 32 at a time from the block's cache line, and then takes the two
checksum bytes back out (`src/vol.asm:339-358`, `src/volutil.asm:53-84`). The
sum covers the descriptors in block 0 as well as the header's fields, so a
change to any byte of block 0 needs a new checksum.

A card's minor version sets three things. A 1.0 card has no drives field and
no table sum, and `tecvol` gives it at most 8 volumes. A 1.1 card may have up
to 127, may give a number of drives and has the table sum
(`tools/lib/container.mjs:76-80`, `tools/lib/container.mjs:140-148`).
`tecvol create` makes a 1.1 card when it is given more than 8 volumes or
`--drives`, and a 1.0 card otherwise. The ROM rejects a 1.0 card of more than
8 volumes with code `24h` (`src/vol.asm:68-87`), and treats any minor version
other than 0 as 1.1 (`src/vol.asm:104-106`).

## The volume descriptor

Each descriptor is 32 bytes (`format/format.json`, `descriptor`):

| Offset | Bytes | Field |
| ---: | ---: | --- |
| 0 | 4 | Volume id: not 0, and different from every other volume's |
| 4 | 4 | Start block: not 0, a multiple of 8 |
| 8 | 4 | Length in blocks: the geometry's payload exactly |
| 12 | 1 | Geometry id: 1 for G8M, 2 for G1M |
| 13 | 1 | Flags: bit 0 read-only; the other bits 0 |
| 14 | 1 | Drive: 0 to 3 for A to D, `FFh` for none |
| 15 | 1 | Cache flags: bit 0 written behind; the other bits 0 |
| 16 | 11 | Label, ASCII, padded with spaces |
| 27 | 5 | Reserved, 0 |

The starter card's first descriptor, at `20h`, is volume 1, starting at block
`0800h` (2,048), 2,048 blocks long, geometry 2, not read-only, on drive A,
written through, labelled `SYSTEM`. Its second, at `40h`, is volume 2,
starting at block `1000h` (4,096), 16,384 blocks long, geometry 1, on drive B,
written behind, labelled `WORK`.

The drive byte is the drive the volume takes at cold boot. The volume id is
the name that stays with the volume. At most one volume is written behind, and
never a read-only one (`tools/lib/container.mjs:85-86`,
`tools/lib/container.mjs:187-188`). `tecvol create` starts the first volume at
block 2,048, 1 MiB into the card. Each later volume starts at the next
multiple of 2,048 blocks after the one before. `--align` puts another multiple
of 8 in place of 2,048 (`tools/lib/container.mjs:14`,
`tools/lib/container.mjs:89-99`). `tecvol create` fills each payload with
`E5h`, an empty CP/M directory (`tools/lib/container.mjs:121`).

## The table beyond block 0

Block 0 holds the header and descriptors 0 to 14, at offsets 32 to 511. A 1.1
card with more than 15 volumes goes on in blocks 1 to 7, 16 descriptors to a
block, which with block 0's 15 gives the limit of 127
(`tools/lib/container.mjs:33-42`, `format/format.json`). Descriptor `i`, for
`i` of 15 or more, is in block `1 + (i − 15) / 16`, at `32 × ((i − 15) mod
16)` within it. No volume can start below block 8, so blocks 1 to 7 are free
on every card, whether or not the table uses them.

The table sum in the header, at offset 23, is the 16-bit sum of every byte of
the blocks after block 0 that hold descriptors
(`tools/lib/container.mjs:44-49`). The ROM reads `count / 16` of them, rounded
down, and sums them (`src/vol.asm:116-145`). With 15 descriptors in block 0,
that is the number of blocks the table needs. A difference gives code `25h`,
as the header's checksum does.

## The checks and their codes

The ROM's `MOUNT` checks the header first and then each descriptor in table
order, in one pass, mounting each one as it passes (`src/vol.asm:32-264`). The
first check to fail stops the mount, unmounts any drive mounted so far and
returns its code, which cold boot prints at the diagnostic prompt (Chapter
26). The checks, in the order the ROM makes them:

| Code | Check | Source |
| --- | --- | --- |
| `20h` | Block 0 can't be read | `src/vol.asm:33-38` |
| `21h` | The first 8 bytes are not `TECOSVOL` | `src/vol.asm:39-49` |
| `22h` | The major version is not 1 | `src/vol.asm:51-54` |
| `23h` | The header bytes are not 512, or the descriptor bytes not 32 | `src/vol.asm:56-67` |
| `24h` | The number of volumes is 0, more than 8 on a 1.0 card or more than 127 | `src/vol.asm:68-87` |
| `25h` | The checksum differs | `src/vol.asm:90-94` |
| `23h` | 1.1: the drives field is more than 4 | `src/vol.asm:108-112` |
| `20h` | 1.1: a block of the table can't be read | `src/vol.asm:130-135` |
| `25h` | 1.1: the table sum differs | `src/vol.asm:141-145` |
| `26h` | A volume's id is 0, a flag other than read-only is set, the geometry is unknown, the length is not the geometry's, or the start is 0 or not a multiple of 8 | `src/vol.asm:160-190`, `src/vol.asm:271` |
| `28h` | A volume starts before the end of the one before it in the table | `src/vol.asm:191-198` |
| `27h` | A volume's end passes `FFFFFFFFh` or the container's length, or on a standard-capacity card block `7FFFFFh`, the last its byte addresses reach | `src/vol.asm:199-235` |
| `29h` | A drive byte is neither `FFh` nor 0 to 3, the drive is past the number the drives field gives, or two volumes name one drive | `src/vol.asm:237-255` |
| `2Ah` | No volume is on drive A | `src/vol.asm:265-268` |

The ascending order behind `28h` is checked on every card, 1.0 and 1.1 alike.
It keeps two volumes from overlapping: each must start at or after the end of
the one before it in the table. `tecvol` makes the same check on every card
(`tools/lib/container.mjs:174`). A card whose two descriptors were swapped,
with its checksum made good, fails `tecvol verify`, and the ROM stops at the
diagnostic prompt with code `28h`. One Node.js command makes such a card,
`build/swapped.img`, from the starter card:

```sh
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
import { headerChecksum } from "./tools/lib/container.mjs";
const img = new Uint8Array(readFileSync("dist/starter.img"));
const a = img.slice(32, 64);
img.copyWithin(32, 64, 96);
img.set(a, 64);
const s = headerChecksum(img.subarray(0, 512));
img[20] = s & 255;
img[21] = s >> 8;
writeFileSync("build/swapped.img", img);
'
```

```sh
node tools/tecvol.mjs verify build/swapped.img
```

```text
tecvol: volume 1: not after volume 0
```

<!-- node tools/capture.mjs --card build/swapped.img -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 28
R retry> 
```

`tecvol create` and the starter card's recipe always place the volumes in
order, so a card made by either passes the ROM's order check.

The drives field limits the drive bytes. On a 1.1 card that gives N drives, a
volume may name only drives A to the Nth. With N of 0, or on a 1.0 card, a
volume may name any of the four (`src/vol.asm:243-247`). The ROM stops a card
that breaks this at the diagnostic prompt with code `29h`. `tecvol` makes the
same check (`tools/lib/container.mjs:178`), so `tecvol verify` rejects such a
card, and `tecvol create` rejects a volume on drive C with `--drives 2`:

```sh
node tools/tecvol.mjs create build/drv2.img --volume G1M:SYSTEM:A --volume G1M:EXTRA:C --drives 2
```

```text
tecvol: volume 1: drive C is past the card's 2 drive(s)
```

`tecvol` makes all the ROM's checks and more
(`tools/lib/container.mjs:130-194`). Its further requirements:

| `tecvol` also requires |
| --- |
| At most 8 volumes on a 1.0 card |
| A known cache flag |
| Volume ids different from each other |
| Unique labels on a 1.1 card |
| No volume both read-only and written behind |
| At most one volume written behind |
| An image as long as the header's container length |

The ROM checks none of the cache byte, the label, the reserved bytes or
whether two volumes share an id, and it can't check the card's size.

## The geometries

Both geometries have 128-byte records, 64 records to a track, no reserved
tracks, no sector skew and no check vector, since the card is not removable
media in CP/M's sense (`format/format.json`, `geometries`). Record `r` of a
volume is the 128 bytes at `128 × r` in its payload, so four records share a
block.

| Id | Name | Payload | Blocks | Allocation block | Directory entries | Allocation vector |
| ---: | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | G8M | 8 MiB | 16,384 | 4 KiB | 512 | 256 bytes |
| 2 | G1M | 1 MiB | 2,048 | 2 KiB | 256 | 64 bytes |

The allocation vector is the drive's map of free space in TEC-OS's memory,
one bit for each allocation block, `DSM / 8 + 1` bytes. Chapter 14 explains
how cold boot sizes the vectors for a card.

Their disk parameter blocks, as `src/gen/geom.asm` holds them:

| Field | G8M | G1M | Meaning |
| --- | ---: | ---: | --- |
| SPT | 64 | 64 | Records per track |
| BSH | 5 | 4 | Block shift: an allocation block is 128 × 2^BSH bytes |
| BLM | 31 | 15 | Block mask, 2^BSH − 1 |
| EXM | 1 | 0 | Extent mask |
| DSM | 2,047 | 511 | The highest allocation block number |
| DRM | 511 | 255 | The highest directory entry number |
| AL0 | `F0h` | `F0h` | The allocation blocks the directory takes: the first four |
| AL1 | 0 | 0 | |
| CKS | 0 | 0 | No check vector |
| OFF | 0 | 0 | No reserved tracks |

The directory takes four allocation blocks in each: 512 entries of 32 bytes
are 16 KiB, four G8M allocation blocks, and 256 entries are 8 KiB, four G1M
allocation blocks. A G8M volume has 2,048 allocation blocks and a G1M volume
512, of which four are the directory's.

The ROM's geometry table has an entry of 6 bytes for each geometry: the id, a
0, the payload in blocks as a word and the address of the disk parameter block
(`src/gen/geom.asm`). `GEOFIND` looks an id up in it (`src/volutil.asm:18-29`),
and the length check compares the descriptor's length with that word and
requires its two high bytes to be 0 (`src/vol.asm:171-182`).
