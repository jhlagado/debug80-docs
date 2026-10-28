---
title: Cards and volumes
parent: TEC-OS
nav_order: 4
---

# Cards and volumes

A CP/M drive holds one disk. A TEC-OS card holds many disks, called
volumes, and TEC-OS puts up to four of them on drives A to D. This chapter
describes how a card is laid out, how to build and change one on a PC with
`tecvol`, how TEC-OS caches the card's blocks and writes a volume behind,
and how to change which volumes are on which drives while TEC-OS runs.

## Volumes and the container

The card holds one container. Its first block, block 0, is a header that
lists the volumes. Each volume is an ordinary CP/M 2.2 disk inside the
container, with its own directory and files, and each has:

- a label of up to 11 characters, such as `SYSTEM`;
- a geometry, which sets its size and layout;
- a drive letter it is mounted on at start-up, or none;
- a read-only flag;
- a written-behind flag, described below.

There are two geometries:

| Geometry | Size | Allocation block | Directory entries |
| --- | ---: | ---: | ---: |
| `G1M` | 1 MiB | 2 KiB | 256 |
| `G8M` | 8 MiB | 4 KiB | 512 |

The allocation block is the unit of space a file takes on the volume, so a
file of 100 bytes uses 2 KiB on a `G1M` volume and 4 KiB on a `G8M` one.
The directory entries limit the number of files: a file takes one entry for
each 16 KiB on `G1M` and each 32 KiB on `G8M`. A card can hold up to 127
volumes.

The starter card has two volumes, `SYSTEM` on A and `WORK` on B. Since each
volume is a standard CP/M disk, other CP/M tools can read it. Chapter 10
gives the disk definitions they need.

## tecvol

`tecvol` is the card tool in the TEC-OS repository. It runs on a PC with
Node.js and works on an image file, a copy of the card kept as an ordinary
file. You build or change the image on the PC, then write it to a card.

Every change `tecvol` makes is written to a new file beside the image and
renamed over it only after the new image passes the same checks TEC-OS
makes. An interrupted change leaves the old image as it was.

### Creating a card

`create` makes an image with the volumes you name. Each `--volume` gives a
geometry, a label and, if the volume is to be mounted at start-up, a drive:

```sh
node tools/tecvol.mjs create card.img --volume G1M:SYSTEM:A --volume G8M:WORK:B --volume G8M:GAMES
```

`info` lists what is on the image:

```text
container: format 1.0, 36864 blocks (18874368 bytes), 3 volume(s)
  A: SYSTEM      id 1 G1M start 2048 rw 0 file(s), 1040384 bytes free
  B: WORK        id 2 G8M start 4096 rw 0 file(s), 8372224 bytes free
  -: GAMES       id 3 G8M start 20480 rw 0 file(s), 8372224 bytes free
```

`GAMES` has no drive, so TEC-OS leaves it off the drives at start-up. Add
`:ro` after the drive to make a volume read-only, or `:wb` to have it
written behind, as `G8M:WORK:B:wb`. One volume on a card at most can be
written behind, and not one that is read-only. `info` shows `wb` beside it.

### Copying files

`put` copies a file from the PC onto a volume, and `get` copies one back.
Each names the volume by its drive. `--text` is for text files. On the way in it ends each line with
carriage return and line feed, as CP/M expects, and adds `^Z`, CP/M's
end-of-text mark. On the way out it stops at the `^Z` and converts the line
endings back:

```sh
node tools/tecvol.mjs put card.img A HELLO.COM
node tools/tecvol.mjs put card.img B notes.txt NOTES.TXT --text
node tools/tecvol.mjs get card.img B NOTES.TXT notes.txt --text
```

`dir` lists a volume's files with their sizes, `era` erases one, and
`--user` reaches a user area other than 0. `verify` checks the whole image
and reports blocks allocated twice, blocks beyond a volume and missing
directory entries.

The starter card comes from a recipe, a JSON file listing its volumes and
files with a SHA-256 for each file. `recipe` builds the image from it:

```sh
node tools/tecvol.mjs recipe dist/starter.recipe.json card.img
```

### Writing the card

`install` writes the image to an SD card from its first block:

```sh
node tools/tecvol.mjs install card.img /dev/rdiskN --yes
```

The device name depends on the PC. `install` replaces everything on the
card, so check the name before running it.

TEC-OS keeps a map of each drive's free space in memory, and on a volume
written behind it also holds changes the card hasn't had yet. Never change
a card on a PC while the TEC-1G is using it. Type `^C` at the prompt before
taking the card out, and reset the TEC-1G after putting a changed card back.

## The block cache

TEC-OS keeps the 30 card blocks it used most recently, 15 KiB in all, in
memory that programs never see (Chapter 5). Every volume's reads go through
this cache. A block read before and still held costs a copy in memory, not
a read from the card, so a 12 KiB file read a second time comes back about
five times faster than from the card.

Writes on most volumes go straight to the card, as before: when a program's
write returns, the card has the block. A volume written behind is
different. Its writes go into the cache, and the card catches up in
batches:

- when a file on the volume is closed, or anything else changes its
  directory
- when every block in the cache holds changes and another block is needed
- at every warm boot, so `^C` at the prompt writes everything
- when `MOUNT` changes a drive

Each time, TEC-OS writes the changed data blocks first and the directory
block last, so the directory on the card never names data the card hasn't
got.

Writing a block once instead of once for each of its four records makes a
16 KiB `SAVE` about three times faster. The cost is that a reset, a power
cut or a card taken out loses what the volume has been given since the last
of those. A closed file is safe, which is CP/M's own rule. Data written to
a file still open is not.

The starter card's `WORK` volume, drive B, is written behind. Type `^C` at
the prompt before you press reset, turn the board off or take the card out.
If a block can't be written, it stays in the cache and each warm boot tries
it again and says `Write lost` while it still fails. Only a reset gives it
up.

## Volumes at run time

Two programs on the starter card change the drives while TEC-OS runs.
`VOLS` lists the volumes and where they are mounted:

```text
A>VOLS
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 GAMES       G8M

A>
```

`MOUNT` puts a volume on a drive, by its label or by its number in that
list:

```text
A>MOUNT B: GAMES
B: GAMES

A>VOLS
00 SYSTEM      G1M A:
01 WORK        G8M
02 GAMES       G8M B:

A>
```

`WORK` came off B to make room. `MOUNT B:` with no volume takes the volume
off B and leaves the drive empty. Drive A always holds a volume, so
`MOUNT A:` answers `Cannot unmount`. A volume can be on one drive at a
time.

Mounts last until a reset, which puts the card's own assignments back. A
nested command processor's `EXIT`, from Chapter 3, gives its parent the
mounts it had.

## Drives and memory

Each mounted drive takes memory for its map of free space, the allocation
vector. TEC-OS places those maps just below the operating system at
start-up, so the more drives a card mounts, the less memory programs have.
The card in the examples above gives programs the same 46,854 bytes as the
starter card.

That arrangement limits `MOUNT`. A drive that had no volume at start-up has
no map, and a drive's map is sized for the volume it started with. So on
the card above `MOUNT C: GAMES` fails:

```text
A>MOUNT C: GAMES
Cannot mount: in use or too large

A>
```

The same answer comes from mounting a volume that is already on another
drive.

A card can ask for its drives up front. `--drives` on `create` gives each
drive from A up to the number named a map large enough for a `G8M` volume,
whether it is mounted or not:

```sh
node tools/tecvol.mjs create card.img --volume G1M:SYSTEM:A --volume G8M:WORK:B --volume G8M:GAMES --drives 4
```

On that card `MOUNT C: GAMES` works, and any of the four drives can take
any volume. The cost is memory: the word at `0006h` falls from `B806h` to
`B506h`, and programs have 46,086 bytes. That is the smallest any card
gives. A board that loads the graphics LCD console, from Chapter 2, gives
768 bytes less again, 45,318, so a program that fits in 45,318 bytes runs
on any board with any card.
