---
title: Cards and volumes
parent: TEC-OS
nav_order: 4
nav_group: "Part I: Using and programming TEC-OS"
---

# 4. Cards and volumes

Checked against TEC-OS 7458352, with the starter card's `TED.COM` from Thorium
128edb7, with the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
`TAS.COM` from Thorium dbee66a, with the SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

TEC-OS reads everything but its own code from one SD card: the programs it
runs, its services, its startup file and your own files. This chapter describes
the card's layout, a container of volumes, and how you build and change a card
on a PC with `tecvol`. It then describes how TEC-OS uses the card: `MOUNT`,
what each drive costs in memory, the block cache and what a reset keeps. The
last sections describe putting an image on a card and recovering a card after
a power cut.

## The container and its volumes

A CP/M 2.2 disk is small. CP/M addresses at most 8 MiB on one drive and most
CP/M machines had floppy disks of a few hundred KiB, while an SD card holds
thousands of times that. So TEC-OS divides the card into volumes, each one an
ordinary CP/M disk of fixed size. It holds them in a container: a header in
the card's first 512-byte block, followed by the volumes. A volume has a label
of up to 11 characters, a number that identifies it in the container, a size
and, if any, the drive TEC-OS puts it on at cold boot. The header holds the
description of each volume, its descriptor, with the block where the volume
starts.

`tecvol`, the card tool in the repository's `tools/` directory, works on an
image of a card, a file on the PC holding the card's blocks in order. Its
`info` command prints the container and its volumes, and for the starter card
it prints this:

```sh
node tools/tecvol.mjs info dist/starter.img
```

```text
container: format 1.0, 20480 blocks (10485760 bytes), 2 volume(s)
  A: SYSTEM      id 1 G1M start 2048 rw 7 file(s), 1001472 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
```

The container is 20,480 blocks, 10 MiB. `SYSTEM` starts at block 2,048, 1 MiB
into the card, and is 1 MiB long. `WORK` follows it at block 4,096 and is 8
MiB long. By default `tecvol` starts each volume on a multiple of 2,048
blocks, a boundary at which SD cards commonly erase, so the 1 MiB below
`SYSTEM` holds only the header.

Each line gives the volume's drive, label, number (`id`), size and first
block. Next comes `rw` if the volume can be written or `ro` if not, then `wb`
if it is written behind, which the section on the block cache explains. The
rest of the line counts the files and the free space in bytes, as `tecvol`
reads them from the volume's directory.

A container holds up to 127 volumes, and up to four of them are on drives at a
time, as drives A to D. The header's format number, 1.0 or 1.1, sets how many
volumes the container can hold. A 1.0 container holds up to 8, so a container
of more than 8 is format 1.1, which continues the table of descriptors into
blocks 1 to 7. Format 1.1 also has a drives field, the number of drives the
card is to have, which the section on memory explains. Appendix E gives the
header and the descriptor byte by byte.

Before it mounts anything, cold boot checks the header: its name, its version,
its checksum and each descriptor. A card that fails any check mounts nothing,
and cold boot stops at the diagnostic prompt with the code of the check, as
Chapter 1 showed. Appendix D lists the codes.

## The two geometries

Every volume has one of two geometries, the CP/M disk parameters that set its
size and the layout of its directory:

| Geometry | Size | Allocation block | Directory entries |
| --- | --- | --- | --- |
| G1M | 1 MiB | 2 KiB | 256 |
| G8M | 8 MiB | 4 KiB | 512 |

CP/M gives space to a file in allocation blocks, so the smallest file with any
data in it takes 2 KiB on a G1M volume and 4 KiB on a G8M volume. A directory
entry describes up to 16 KiB of a file on a G1M volume and 32 KiB on a G8M
volume, and a larger file takes more than one entry. The directory is at the
start of the volume, in its first allocation blocks: 8 KiB on G1M and 16 KiB
on G8M. That is why an empty G8M volume has 8,372,224 bytes free, 16 KiB less
than 8 MiB. Both geometries have 128-byte records, the unit in which CP/M
reads and writes, and four of them fit a 512-byte block of the card.

A volume's contents are an ordinary CP/M 2.2 directory and data area. A PC
tool that reads CP/M disks, such as cpmtools, therefore reads a volume copied
out of the image, given the geometry's parameters. Appendix E lists them.

## Building a card with tecvol

A card of your own starts with `tecvol create`, which makes a new image with
empty volumes. Each `--volume` gives one volume as its geometry, its label
and, if it is to be on one, its drive, separated by colons. `:ro` after the
drive makes the volume read-only and `:wb` makes it written behind. One volume
at most is written behind, and never a read-only one. This card has four
volumes, two of them on no drive, and `--drives 4` gives it four drives, which
makes it format 1.1:

```sh
node tools/tecvol.mjs create my.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G8M:GAMES --volume G1M:SPARE --drives 4
```

`create` fails if the image exists already. A card must have a volume on drive
A, and no two volumes on one drive. `--drives` takes a whole number from 1 to 4,
and `--align`, which sets the multiple of blocks each volume starts on in place
of 2,048, a multiple of 8 below 16,777,216. A value that isn't a whole number in
range stops `tecvol` with its usage message, and one that isn't a multiple of 8
with `alignment must be a multiple of 8 blocks`. Either way no image is made.

`tecvol put` then copies a file from the PC onto a volume, named by its drive
letter or its label, and `tecvol dir` lists a volume. A PC's file name becomes
the CP/M name in capitals, and a fourth argument gives another name. `--text`
turns each line feed into a carriage return and line feed and ends the file with
`^Z`, CP/M's end of a text file. That is the form in which CP/M programs and
`TYPE` read text. These commands put the starter card's `MOUNT.COM` on
`SYSTEM`, its `TAS.COM` on `GAMES` and a text file, `hello.txt`, holding the
line `Hello from the PC.`, on `SPARE`:

```sh
node tools/tecvol.mjs put my.img A dist/files/MOUNT.COM
node tools/tecvol.mjs put my.img GAMES dist/files/TAS.COM
node tools/tecvol.mjs put my.img SPARE hello.txt --text
node tools/tecvol.mjs dir my.img
```

The last of them lists drive A, the default, with each file's user area and
its size in bytes:

```text
 0 MOUNT.COM         768
```

The size is whole records of 128 bytes, because CP/M records a file's length
only in records. `MOUNT.COM` is 671 bytes on the PC and takes six records,
and `tecvol get`, which copies a file back to the PC, gives back all six.
With `--text`, `get` stops at the first `^Z` and turns each carriage return
and line feed back into a line feed.

`tecvol era` erases a file. `put`, `get` and `era` work in user area 0 unless
`--user N` names another, and `dir` lists every user area unless `--user N`
names one. `N` is a whole number from 0 to 15, and anything else, such as
`oops`, `1.5` or `16`, stops `tecvol` with its usage message before it changes
the image. `put` takes `--ro` and `--sys` to set the file's read-only and
system attributes.

`put` writes to a volume only if the volume can be written, so a read-only
volume made by `create` stays empty. A read-only volume with files on it comes
from a recipe, which the next section describes.

`tecvol` never edits an image in place. It writes the changed image to a new
file beside the old one, checks it as a container and renames it over the old
one, so an interrupted change leaves the old image whole. `tecvol info` on
`my.img` now shows the four volumes:

```text
container: format 1.1, 38912 blocks (19922944 bytes), 4 volume(s), 4 drive(s) wanted
  A: SYSTEM      id 1 G1M start 2048 rw 1 file(s), 1038336 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
  -: GAMES       id 3 G8M start 20480 rw 1 file(s), 8359936 bytes free
  -: SPARE       id 4 G1M start 36864 rw 1 file(s), 1038336 bytes free
```

`GAMES` and `SPARE` have `-` for their drive: their descriptors name none, so
TEC-OS puts them on no drive at cold boot. `tecvol info` and `tecvol verify`
both check each volume's directory and print any problem in it under the
volume's line. `verify` also exits with status 1 when there is one, as the last
section of this chapter describes.

## Recipes and the starter card

To build the same card again you use a recipe, a JSON file that describes a
whole card: its volumes, and each file to put on them with its size and
SHA-256. `tecvol recipe` builds the image from it, fetching each file from a
path relative to the recipe's directory or from a URL. It stops if a file's
size or SHA-256 differs from the recipe's. The starter card is built from
`dist/starter.recipe.json`, which `npm run media` writes, and the same recipe
builds the same image byte for byte:

```sh
node tools/tecvol.mjs recipe dist/starter.recipe.json mystarter.img
```

Its volumes, written here one to a line, are these:

```json
"volumes": [
  { "geometry": "G1M", "label": "SYSTEM", "mount": "A" },
  { "geometry": "G8M", "label": "WORK", "mount": "B", "writeBehind": true }
]
```

Each file, inside the `components` list, has an entry such as this one:

```json
{
  "name": "MOUNT.COM",
  "url": "files/MOUNT.COM",
  "drive": "A",
  "bytes": 671,
  "sha256": "5273f0ba443817f9168a1909fe7c934a5ad186ba1480d35b7ab169c27ead83cc"
}
```

A volume in a recipe can have `"readOnly": true`. `tecvol recipe` writes every
file first and sets the read-only flags last, so a recipe is the way to make a
read-only volume that holds files. The web page's "New starter card" builds
its card from `dist/page.recipe.json`, which `npm run media` also writes. It has
the same volumes and files with one more, `DEMO.COM` on drive A, and the page checks
the same SHA-256s and that one too.

## Drives and MOUNT

Cold boot puts each volume on the drive its descriptor names and prints the
drives that have one. On `my.img` the boot prints this, with the prompt
following at once because the card has no startup file:

<!-- node tools/capture.mjs --card my.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>
```

`MOUNT`, the starter card's program that `my.img` has too, works with the
volumes while TEC-OS runs. With no argument it lists every volume in the
container with its index, its label, its geometry and the drive it is on. With
a drive and a label or an index, it puts that volume on the drive:

<!-- node tools/capture.mjs --card my.img MOUNT "MOUNT C: GAMES" "MOUNT D: 3" MOUNT "DIR C:" "TYPE D:HELLO.TXT" "MOUNT C: SPARE" -->
```text
A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 GAMES       G8M
03 SPARE       G1M

A>MOUNT C: GAMES
C: GAMES      

A>MOUNT D: 3
D: SPARE      

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 GAMES       G8M C:
03 SPARE       G1M D:

A>DIR C:
TAS.COM     
1 file, 8164K free
A>TYPE D:HELLO.TXT
Hello from the PC.

A>MOUNT C: SPARE
Cannot mount: in use or too large

A>
```

`MOUNT C: SPARE` fails because `SPARE` is on drive D already, and a volume is
on one drive at most. `MOUNT B:`, with no volume, takes the volume off drive
B, and an argument `MOUNT` can't read makes it print how it is used,
`MOUNT [D: [NAME or INDEX]]`. Drive A always has a volume, so
`MOUNT A:` prints `Cannot unmount`, and a volume can be mounted on drive A
only in place of the one there.

`MOUNT` changes only TEC-OS's memory. The card's header still names the drives
it named before, so a power cycle puts the volumes back on them. Before a
drive's volume changes, TEC-OS writes to the card every change the block cache
holds, and it reads the directory again the next time the drive is used.

A drive with no volume can't be selected. On the starter card, where drive C
has none, `C:` gives a BDOS error, and a key returns to the prompt on drive A:

<!-- node tools/capture.mjs "@start C:" "@key x" -->
```text
A>C:
Bdos Err On C: Select
A>
```

## Drives and their cost in memory

A drive that cold boot sets up costs memory, because the BDOS keeps an
allocation vector for it. The vector has one bit for each allocation block of
the volume, set when a file uses the block. It is the map of the drive's free
space, built from the directory when the drive is first used, and with it the
BDOS finds a free block without reading the directory. A G1M volume's vector is
64 bytes and a G8M volume's 256 bytes.

The vectors are directly below TEC-OS's workspace, and the BDOS's entry is
below them, so they come out of the TPA, the memory programs have. Cold boot
gives out the space in one of two ways.

A card in format 1.0, or one in format 1.1 whose header gives no number of
drives, gets a vector for each drive cold boot puts a volume on, sized for its
volume. The starter card's two drives take 64 and 256 bytes, the word at
`0006h` is `B815h`, and programs have 46,869 bytes. Drives C and D get no
vector, so on the starter card no volume can be mounted on them. A drive keeps
its vector when `MOUNT` empties it, and drive B's, of 256 bytes, can take a
G1M or a G8M volume:

<!-- node tools/capture.mjs "MOUNT B:" "MOUNT C: WORK" "MOUNT B: WORK" -->
```text
A>MOUNT B:
Unmounted

A>MOUNT C: WORK
Cannot mount: in use or too large

A>MOUNT B: WORK
B: WORK       

A>
```

A drive A with a 64-byte vector can take only a G1M volume.

A card in format 1.1 whose header gives N drives, as
`tecvol create --drives N` makes it, gets a 256-byte vector for each of drives
A to the Nth. Each gets one whether a volume is on it at cold boot or not, so
any of those drives can take any volume later. `my.img`'s header gives four,
so its vectors take 1,024 bytes, the word at `0006h` is `B555h` and programs
have 46,165 bytes. That is 704 fewer than on the starter card, the difference
between the two cards' vectors. A drive past the Nth gets no vector, and a card whose header puts a volume on such a drive
fails the checks at cold boot. Chapter 7 describes the TPA, and Chapter 13 the
rest of the map.

## The block cache and the volume written behind

Reading the card takes time, so TEC-OS keeps up to 30 blocks read from it, 15
KiB, in EXPAND 1, the half of the board's second RAM chip that is TEC-OS's
own. Every drive's reads go through this block cache: a block TEC-OS read
before and still holds is copied from memory, and only a block it doesn't hold
is read from the card. A block written to the card is also brought up to date
in the cache, so the cache never holds a stale copy. On the model, a program
took 1.66 seconds to read a 12 KiB file the first time and 0.33 seconds the
second time, a fifth of that. A file too large for the cache took as long the
second time. Chapter 19 gives the method.

A volume is *written through* by default: a write reaches the card before
TEC-OS reports it done. When a program writes a record, TEC-OS writes the
record's whole block to the card and waits until the card reports it accepted.
The exception is a volume whose descriptor marks it written behind, and
`tecvol` marks one at most. On the starter card that is `WORK`. The volume's
writes go into the cache and stay there, and TEC-OS writes them to the card later:

- When a program writes to the volume's directory, for instance by closing a
  file, TEC-OS first writes every data block the cache holds changed, and then
  the directory block.
- When every block in the cache holds changes and TEC-OS needs a block for
  something else.
- At every warm boot, so `^C` at the prompt or the end of any program writes
  everything.
- When `MOUNT` changes a drive.

Writing behind saves card writes when a program writes a file a record at a
time, because the four records of a block reach the card in one write of the
block. A *flush* writes all the cache's changes to the card, and a block written
many times between two flushes reaches the card once, unless the cache fills
between them. On the model, `SAVE 64`, which writes 16 KiB, took 7.71 seconds on
a G8M volume written through and 2.48 seconds, about a third of that, on one
written behind.

The order of the writes keeps the card's directory true to its data. TEC-OS
writes a directory block only after every changed data block the cache holds,
so the directory never names a block whose data isn't on the card.

When a changed data block can't be written, it stays in the cache, and each
warm boot repeats the write and prints `Write lost` while the write still
fails. A directory block that can't be written is dropped from the cache, and
the directory is read from the card again. A reset or a power cut discards a
data block held in this way. When a card comes out with changed data blocks in the cache,
they stay held in this way even if the same card goes back: only cold boot
starts a card, so each warm boot prints `Write lost` again, and the reset that
starts the card discards them.

## The drives after a reset

A reset runs cold boot, and cold boot rebuilds TEC-OS's memory, so the cache,
the services, the command history and the open files are all gone after it. So
is any change in the cache that hadn't reached the card. The one thing a reset
can keep is the selection of volumes on the drives. The selection survives if
TEC-OS had reached a prompt before the reset and each volume on a drive is
still on the card, at the same place and of the same size and kind. The drives
then hold the same volumes after the reset as before it:

<!-- node tools/capture.mjs --card my.img "MOUNT C: GAMES" "MOUNT B:" "@reset" MOUNT -->
```text
A>MOUNT C: GAMES
C: GAMES      

A>MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
C: GAMES      

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M
02 GAMES       G8M C:
03 SPARE       G1M

A>
```

If any of the volumes doesn't match a descriptor on the card in the socket,
the whole selection is dropped and the drives get the volumes the header
names, as after a power cycle. Turning the board off always gives the header's
drives, since the selection is held only in RAM. Chapter 14 describes the test
cold boot applies to the RAM a reset leaves.

A `^C` at the prompt before a reset puts the cache's changes on the card, as
Chapter 1 says.

## Putting an image on a card

`tecvol install`, which Chapter 1 used for the starter card, writes any image
to a card in the same way:

```sh
node tools/tecvol.mjs install my.img /dev/rdiskN --yes
```

`/dev/rdiskN` stands for the card's device, which on a Mac is a name of that
form and on Linux one such as `/dev/sdb`. As Chapter 1 says, `install`
overwrites the device from block 0, and it does nothing without `--yes`. The
card must be at least as large as the container. TEC-OS can't read the card's
size, so on a smaller card a volume that runs past the card's end gives the
BDOS error `Bad Sector` when TEC-OS reaches the missing blocks. Here the
starter card's image is cut to 4,110 blocks, so that it ends 14 blocks into
`WORK`, inside the volume's directory:

```sh
cp dist/starter.img short.img
truncate -s 2104320 short.img
```

<!-- node tools/capture.mjs --card short.img "@start DIR B:" "@key x" -->
```text
A>DIR B:

Bdos Err On B: Bad Sector
A>
```

An older, standard-capacity card is addressed in bytes, and TEC-OS can name
only its first 4 GiB, the blocks below `800000h`. On such a card, a volume that
ends past that point, or starts past it, fails the checks on the container, and
cold boot stops at the diagnostic prompt with error 27 (`src/vol.asm:216-230`).
The card stays as it was. The web page can't show either failure: it refuses an
image smaller than its container (`web/src/main.mjs:562`), and its card is
high-capacity.

The web page's "Open image" loads an image file from the PC into the page's
card, and "Download image" saves the page's card as one. The same image
therefore runs in the page and on a board.

TEC-OS and the PC must never write the same card at the same time. A card
changed on a PC needs a reset when it goes back into the board, because TEC-OS
starts the card only at cold boot. Across warm boots it keeps each drive's
allocation vector and the cache's copies of blocks. A card changed on the PC
doesn't match them, and a warm boot doesn't read the card again.

## Recovery after a power cut

CP/M writes a file's data blocks first and its directory entry after them, and
TEC-OS adds no journal. Once a file is closed, its data and its directory
entry are both on the card. Before the close, some of a file's writes may
already be on the card and others not, and nothing puts the old contents back.
A power cut or a reset then leaves the file in one of these ways:

- On a volume written through, each record a program writes is on the card at
  once. A cut between the data and the directory leaves new data in allocation
  blocks the directory doesn't name, and those blocks are free space again the
  next time the drive's allocation vector is built. A record written over one
  the file already had replaces it on the card at once, so after a cut the file
  holds the new records with the old ones the program hadn't reached. Nothing
  on the card keeps the old file.
- On the volume written behind, a change since the last directory write, warm
  boot or `MOUNT` is lost if it is still in the cache. A block TEC-OS has
  already written to make room in a full cache is on the card, and so are the
  blocks a flush finished before the cut. Any new data block among them has no
  directory entry naming it, as above, and a block the file already had holds
  the new records in place of the old. A cut never leaves an entry naming a
  block whose data isn't there.
- A cut during the write of one block can leave that block with old, new or
  mixed contents. If the block is part of a directory, it holds 16 directory
  entries, and any of them can be damaged.

To recover a card after a cut, copy it to the PC first and work on the copy.
On Linux, `dd` copies the starter card's 20,480 blocks:

```sh
dd if=/dev/sdb of=card.img bs=512 count=20480
node tools/tecvol.mjs verify card.img
```

`tecvol verify` reads each volume's directory and reports the faults that
would make files share or lose allocation blocks:

- An allocation block that two files claim.
- An allocation block number past the end of the volume.
- Two directory entries for the same part of a file.
- An entry with a record count above 128.
- An entry that names more allocation blocks than its records need.

It exits with status 1 if it found a problem. `tecvol get` then copies off
what it can read, and a fresh image built with `create` and `put`, or from a
recipe, goes back on the card with `install`.
