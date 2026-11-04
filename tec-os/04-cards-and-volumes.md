---
title: Cards and volumes
parent: TEC-OS
nav_order: 4
nav_group: "Part I: Using and programming TEC-OS"
---

# 4. Cards and volumes

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

A card of your own is made on a PC. `tecvol`, the card tool in the
repository's `tools/` directory, builds an image of the card. The image is a
file holding the card's blocks in order, and `tecvol` writes it to a card when
it is ready. Everything TEC-OS reads is on that card: its programs, its
services, its startup file and your own files.

## The container and its volumes

A CP/M disk is small. CP/M addresses at most 8 MiB on one drive, and most CP/M
machines had floppy disks of a few hundred KiB. An SD card holds thousands of
times that. So TEC-OS divides the card into volumes, each one an ordinary CP/M
disk of a fixed size. The volumes are held in a container: a header in the
card's first 512-byte block, with the volumes after it. The header holds a
descriptor for each volume. The descriptor gives the volume's label of up to
11 characters, a number that identifies it, its size and the block where it
starts. It also names the drive TEC-OS puts the volume on at cold boot, if
any.

`tecvol info` prints the container and its volumes. On the starter card it
prints this:

```sh
node tools/tecvol.mjs info dist/starter.img
```

```text
container: format 1.0, 20480 blocks (10485760 bytes), 2 volume(s)
  A: SYSTEM      id 1 G1M start 2048 rw 6 file(s), 1003520 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
```

The container is 20,480 blocks, 10 MiB. `SYSTEM` starts at block 2,048, 1 MiB
into the card, and is 1 MiB long. `WORK` follows it at block 4,096 and is 8
MiB long. By default `tecvol` starts each volume on a multiple of 2,048
blocks, a common erase-block multiple on SD cards. The 1 MiB below `SYSTEM`
therefore holds only the header.

Each line gives the volume's drive, its label, its number (`id`), its size and
its first block. Then comes `rw` if the volume can be written, or `ro` if not.
`wb` after that marks the volume written behind, which [Chapter
1](01-introduction.md#keeping-your-work) introduced and [Chapter
5](05-drives-and-cache.md) explains. The rest of the line counts the files and
the free space in bytes, as `tecvol` reads them from the volume's directory.

A container holds up to 127 volumes. Up to four of them are on drives at a
time, as drives A to D. Before it mounts anything, cold boot checks the
header: its name, its version, its checksum and each descriptor. A card that
fails any check mounts nothing. Cold boot then stops at the diagnostic prompt
with the code of the check. [Chapter 26](26-diagnostics.md) describes the
diagnostic prompt and [Appendix D](appendix-d-error-messages.md) lists the
codes. [Appendix E](appendix-e-container-format.md) gives the header and the
descriptor byte by byte.

## The two disk sizes

Every volume has one of two geometries, the CP/M disk parameters that set its
size and the layout of its directory:

| Geometry | Size | Allocation block | Directory entries |
| --- | --- | --- | --- |
| G1M | 1 MiB | 2 KiB | 256 |
| G8M | 8 MiB | 4 KiB | 512 |

CP/M gives space to a file in allocation blocks. The smallest file with any
data in it takes 2 KiB on a G1M volume and 4 KiB on a G8M volume. A directory
entry describes up to 16 KiB of a file on G1M and 32 KiB on G8M. A larger file
takes more than one entry. The directory is at the start of the volume, in its
first allocation blocks: 8 KiB on G1M and 16 KiB on G8M. That is why an empty
G8M volume has 8,372,224 bytes free, 16 KiB less than 8 MiB. Both geometries
have 128-byte records, the unit in which CP/M reads and writes. Four records
fit a 512-byte block of the card.

A volume's contents are an ordinary CP/M 2.2 directory and data area.
[Appendix E](appendix-e-container-format.md) lists each geometry's parameters.

## Building a card with tecvol

A card of your own starts with `tecvol create`, which makes a new image with
empty volumes. Each `--volume` gives one volume as its geometry, its label and
its drive, separated by colons. A volume to be on no drive leaves the drive
out. `:ro` after the drive makes the volume read-only and `:wb` makes it
written behind. One volume at most is written behind, and never a read-only
one. This card has four volumes, two of them on no drive. `--drives 4` gives
it four drives, so that any of the four can take a volume later, as [Chapter
5](05-drives-and-cache.md) explains:

```sh
node tools/tecvol.mjs create my.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G8M:GAMES --volume G1M:SPARE --drives 4
```

`create` fails if the image exists already. A card must have a volume on drive
A. No two volumes can share a drive or a label. `--drives` takes a whole
number from 1 to 4. `--align` sets the multiple of blocks each volume starts
on, in place of 2,048. It takes a whole number up to 16,777,215 that is a
multiple of 8. A value outside that stops `tecvol` with a message, and no
image is made.

`tecvol put` then copies a file from the PC onto a volume, named by its drive
letter or its label. `tecvol dir` lists a volume. A PC's file name becomes the
CP/M name in capitals, and a fourth argument gives another name. `--text`
turns each line feed into a carriage return and line feed. It also ends the
file with `^Z`, CP/M's end of a text file. That is the form in which CP/M
programs and `TYPE` read text. These commands put the starter card's
`MOUNT.COM` on `SYSTEM` and its `TAS.COM` on `GAMES`. They also put a text
file, `hello.txt`, holding the line `Hello from the PC.`, on `SPARE`:

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
only in records. `MOUNT.COM` is 671 bytes on the PC and takes six records.
`tecvol get`, which copies a file back to the PC, gives back all six. With
`--text`, `get` stops at the first `^Z`. It turns each carriage return and
line feed back into a line feed.

`tecvol era` erases a file. `put`, `get` and `era` work in user area 0 unless
`--user N` names another. `dir` lists every user area unless `--user N` names
one. `N` is a whole number from 0 to 15. Anything else, such as `oops`, `1.5`
or `16`, stops `tecvol` before it changes the image. `put` takes `--ro` and
`--sys` to set the file's read-only and system attributes. A file with the
read-only attribute is left alone by `put` and `era`, as TEC-OS leaves it
alone, unless `--force` is given.

`put` writes to a volume only if the volume can be written. A read-only volume
made by `create` therefore stays empty. A read-only volume with files on it
comes from a recipe, which the next section describes.

`tecvol` never edits an image in place. It writes the changed image to a new
file beside the old one, checks it as a container and renames it over the old
one. An interrupted change therefore leaves the old image whole. `tecvol info`
on `my.img` now shows the four volumes:

```text
container: format 1.1, 38912 blocks (19922944 bytes), 4 volume(s), 4 drive(s) wanted
  A: SYSTEM      id 1 G1M start 2048 rw 1 file(s), 1038336 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
  -: GAMES       id 3 G8M start 20480 rw 1 file(s), 8359936 bytes free
  -: SPARE       id 4 G1M start 36864 rw 1 file(s), 1038336 bytes free
```

`GAMES` and `SPARE` have `-` for their drive. Their descriptors name none, so
TEC-OS puts them on no drive at cold boot. The container is format 1.1, the
format of a card with more than eight volumes or with a `--drives` count.
`tecvol info` and `tecvol verify` both check each volume's directory. Each
prints any problem it found under the volume's line. `verify` also exits with
status 1 when there is one, which [Chapter 5](05-drives-and-cache.md) uses to
recover a card.

## Recipes and the starter card

To build the same card again you use a recipe, a JSON file that describes a
whole card. It lists the volumes, and each file to put on them with its size
and SHA-256. `tecvol recipe` builds the image from it. It fetches each file
from a path relative to the recipe's directory, or from a URL. It stops if a
file's size or SHA-256 differs from the recipe's. The starter card is built
from `dist/starter.recipe.json`, which `npm run media` writes. The same recipe
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
file first and sets the read-only flags last. A recipe is therefore the way to
make a read-only volume that holds files. The web page's "New starter card"
builds its card from `dist/page.recipe.json`, which `npm run media` also
writes. That recipe has the same volumes and files with one more, `DEMO.COM`
on drive A. The page checks the same SHA-256s and that one too.

## Putting an image on a card

`tecvol install` writes an image to a card:

```sh
node tools/tecvol.mjs install my.img /dev/rdiskN --yes
```

`/dev/rdiskN` stands for the card's device. On a Mac the device has a name of
that form, and on Linux one such as `/dev/sdb`. `install` overwrites the
device from block 0, and it does nothing without `--yes`. TEC-OS and the PC
must never write the same card at the same time. A card changed on a PC needs
a reset when it goes back into the board, as [Chapter
1](01-introduction.md#keeping-your-work) said, and [Chapter
5](05-drives-and-cache.md) explains why. The web page's "Open image" loads an
image file into the page's card, and "Download image" saves the page's card as
one. The same image therefore runs in the page and on a board.

The card must be at least as large as the container. TEC-OS doesn't read the
card's size. On a smaller card, a volume that runs past the card's end gives
the BDOS error `Bad Sector` when TEC-OS reaches the missing blocks. Here the
starter card's image is cut to 4,110 blocks. It ends 14 blocks into `WORK`,
inside the volume's directory:

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

A card that ends past the volume's directory fails later, at the first write
to a missing block. [Chapter 5](05-drives-and-cache.md) shows such a write on
the volume written behind, where it fails at the close of the file.

An older, standard-capacity card is addressed in bytes. TEC-OS can name only
its first 4 GiB, the blocks below `800000h`. A volume that ends past that
point, or starts past it, fails the checks on the container. Cold boot then
stops at the diagnostic prompt with error 27, and the card stays as it was.
