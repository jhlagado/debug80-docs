---
title: "F. `tecvol`"
parent: TEC-OS
nav_order: 106
nav_group: "Appendices"
---

# Appendix F. `tecvol`

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

This appendix lists the nine commands of `tecvol`, the repository's tool for
TEC-OS cards on a PC, with their options and an example of each, and ends with
the card those examples make. `tecvol` makes a card image, lists and checks
one, copies files to and from its volumes, builds a card from a recipe and
writes an image to a card. It runs with Node.js from a clone of the
repository, as `node tools/tecvol.mjs`, and `package.json` also names it as
the command `tecvol` (`package.json:11-13`). Appendix E describes the
container the commands work on.

## Common rules

The commands and their arguments, as the comment at the top of
`tools/tecvol.mjs` gives them (`tools/tecvol.mjs:4-17`):

```text
tecvol create IMAGE --volume G1M:SYSTEM:A [--volume G8M:WORK:B:ro] [--align N] [--drives N]
tecvol info IMAGE
tecvol verify IMAGE
tecvol dir IMAGE [DRIVE] [--user N]
tecvol put IMAGE DRIVE FILE [CPMNAME] [--user N] [--text] [--ro] [--sys] [--force]
tecvol get IMAGE DRIVE CPMNAME [OUTFILE] [--user N] [--text]
tecvol era IMAGE DRIVE CPMNAME [--user N] [--force]
tecvol recipe RECIPE.json IMAGE
tecvol install IMAGE DEVICE --yes
```

The options may come anywhere after the command, and an unknown option is an
error (`tools/tecvol.mjs:41-63`). Every command but `create` and `recipe`
opens an existing image and checks it as a container first, with the checks
Appendix E lists. An image that fails is not used (`tools/tecvol.mjs:73-76`).
A command that changes an image checks the result as a container. It writes
the result to a temporary file beside the image and renames that file over
it, so a failure leaves the image as it was (`tools/tecvol.mjs:19-21`,
`tools/tecvol.mjs:65-71`).

`DRIVE` names a volume by its drive letter, with or without a colon, by its
label or by its id, tried in that order (`tools/lib/container.mjs:201-209`). A
volume on no drive is reached by its label or id. `--user N` selects user area
`N`, a whole number from 0 to 15 in one or two digits. Any other `N` is a
mistake in the command line, found before the image is opened
(`tools/tecvol.mjs:47-51`). Without it `put`, `get` and `era` use user area
0, and `dir` lists every user area (`tools/tecvol.mjs:107`,
`tools/tecvol.mjs:136`).

`tecvol` ends with one of two exit statuses. For a mistake in the command
line, it prints the reason and a line of usage and ends with exit status 2. A
name that `era` can't find counts as such a mistake. For any other failure,
such as a bad container, a full volume or a PC file that can't be read, it
prints `tecvol: ` and the reason and ends with exit status 1
(`tools/tecvol.mjs:29-33`, `tools/tecvol.mjs:164`,
`tools/tecvol.mjs:192-197`).

`tecvol` and TEC-OS must never change the same card at the same time
(`tools/tecvol.mjs:20-21`). TEC-OS holds each drive's map of free space in
memory, and a card changed on the PC is no longer the card the map describes.
Change a card on the PC only after a `^C` at the prompt and with the board off
or the card out, and press reset after putting it back.

## create

`create IMAGE --volume SPEC ...` makes a new image
(`tools/tecvol.mjs:109-114`). It fails if the image already exists. Each
`--volume` adds one volume, in the order given, from a spec of the form
`GEOMETRY:LABEL:DRIVE[:ro][:wb]` (`tools/tecvol.mjs:85-89`):

| Part | Meaning |
| --- | --- |
| `GEOMETRY` | `G1M` or `G8M` |
| `LABEL` | Up to 11 characters, put in capitals; labels must differ |
| `DRIVE` | `A` to `D`, or empty for a volume on no drive |
| `:ro` | The volume is read-only |
| `:wb` | The volume is written behind, for at most one volume and never with `:ro` |

`--align N` places each volume at a multiple of `N` blocks. `N` is a whole
number in decimal from 1 to 16,777,215 and a multiple of 8. The default is
2,048, 1 MiB (`tools/lib/container.mjs:14`, `tools/lib/container.mjs:89-99`).
`--drives N`, 1 to 4, records in the header the number of drives TEC-OS is to
set up at cold boot. Any other `N` for either option is a mistake in the
command line, found before the image is made (`tools/tecvol.mjs:35-39`,
`tools/tecvol.mjs:52-53`). With `--drives`, or with more than 8 volumes, the
card is format 1.1, and otherwise 1.0 (`tools/lib/container.mjs:79-80`).
Every payload is filled with `E5h`, so each volume starts as an empty CP/M
disk. One volume must be on drive A.

This card has a system volume on A, a work volume written behind on B and a
read-only volume on no drive:

```sh
node tools/tecvol.mjs create build/my.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G1M:ARCHIVE::ro
```

`create` prints nothing when it succeeds.

## info and verify

`info IMAGE` prints one line for the container and one for each volume
(`tools/tecvol.mjs:115-132`):

```sh
node tools/tecvol.mjs info build/my.img
```

```text
container: format 1.0, 22528 blocks (11534336 bytes), 3 volume(s)
  A: SYSTEM      id 1 G1M start 2048 rw 0 file(s), 1040384 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
  -: ARCHIVE     id 3 G1M start 20480 ro 0 file(s), 1040384 bytes free
```

The container's line is its format, its length and its number of volumes,
with the number of drives a 1.1 card gives. A volume's line is its drive or
`-`, its label, its id, its geometry, its start block, `rw` or `ro`, `wb` if
it is written behind, its number of files and its free bytes. `WORK` ends at
block 20,480, a multiple of 2,048, so the third volume starts there. A G1M
volume's free bytes are its 512 allocation blocks less the directory's four,
at 2 KiB each.

Under a volume whose CP/M directory has a fault, such as two directory
entries for one part of a file, `info` prints a line for each fault, starting
`problem:` (`tools/lib/cpmfs.mjs:240-267`). A block given to two files, or a
block number above the volume's last, DSM, stops the command instead. It ends
with exit status 1 and a message naming the file and the block, before the
volume's line is printed (`tools/lib/cpmfs.mjs:78-89`,
`tools/tecvol.mjs:124-127`).

`verify IMAGE` prints the same lines and ends with exit status 1 if any volume
has a fault. A container that fails its own checks fails both commands before
they print anything. A copy of the starter card with one header byte changed
gives:

```sh
cp dist/starter.img build/badsum.img
printf 'X' | dd of=build/badsum.img bs=1 seek=25 conv=notrunc
node tools/tecvol.mjs verify build/badsum.img
```

```text
tecvol: header checksum mismatch
```

## dir

`dir IMAGE [DRIVE]` lists a volume's files, drive A's by default, one line
each: the user area, the name and the size (`tools/tecvol.mjs:133-140`). The
size is in whole records, 128 bytes each, since CP/M stores a file's size
only in records. `R/O` and `SYS` follow a file with those attributes. The
starter card's drive A:

```sh
node tools/tecvol.mjs dir dist/starter.img A
```

```text
 0 GLCD.SVC          896
 0 MOUNT.COM         768
 0 SAMPLE.ASM       4480
 0 STARTUP.CMD       128
 0 TAS.COM         10368
 0 TED.COM         12032
```

`MOUNT.COM` is 671 bytes on the PC and six records on the card.

## put

`put IMAGE DRIVE FILE [CPMNAME]` copies a file from the PC to a volume
(`tools/tecvol.mjs:141-149`). The name on the card is `CPMNAME`, or the PC
file's own name in capitals. It must be a CP/M name: up to 8 characters, then
optionally a full stop and up to 3 (`tools/lib/cpmfs.mjs:15-20`). A file of
the same name in the same user area is replaced, unless it has the read-only
attribute. TEC-OS rejects a write over such a file, and so does `put` unless
`--force` is given. The copy fails if the volume is read-only, if the file
there is read-only or if its blocks or directory entries run out. The image
is then left as it was (`tools/lib/cpmfs.mjs:180-206`).

The file is stored in whole records of 128 bytes. A binary file's last record
is padded with zeros. With `--text`, each line end becomes CR LF, a `^Z` is
added at the end and the last record is padded with `^Z`, as CP/M text files
are kept (`tools/lib/cpmfs.mjs:184-188`). `--ro` sets the file's read-only
attribute and `--sys` its system attribute. `--user N` puts it in user area
`N`.

```sh
printf 'hello\nworld\n' > build/hello.txt
node tools/tecvol.mjs put build/my.img A build/hello.txt --text
node tools/tecvol.mjs put build/my.img A dist/files/MOUNT.COM
node tools/tecvol.mjs put build/my.img B dist/files/TAS.COM --user 3
```

A copy to the read-only volume fails:

```sh
node tools/tecvol.mjs put build/my.img ARCHIVE build/hello.txt
```

```text
tecvol: volume is read-only
```

A user area that isn't a number from 0 to 15 stops the command with exit
status 2 before the image is opened:

```sh
node tools/tecvol.mjs put build/my.img A build/hello.txt --user 1.5
```

```text
tecvol: --user "1.5": a user number 0 to 15
usage: tecvol create|info|verify|dir|put|get|era|recipe|install ... (see tools/tecvol.mjs)
```

## get

`get IMAGE DRIVE CPMNAME [OUTFILE]` copies a file from a volume to the PC,
into `OUTFILE`, or to the standard output with none
(`tools/tecvol.mjs:150-159`). Without `--text` the copy is every record,
padding included. With `--text` it stops at the first `^Z` and turns each CR
LF into a line feed (`tools/lib/cpmfs.mjs:123-150`). Each directory entry gives
the records up to its own record count and no further. The records of a
sparse file that no entry holds, the gaps a program's random writes can leave,
come back as zeros (`tools/lib/cpmfs.mjs:133-146`). An entry that names a block
above DSM is damage. `get` then stops with exit status 1, names the file, the
extent, the entry and the block, and writes no file
(`tools/lib/cpmfs.mjs:140`).

```sh
node tools/tecvol.mjs get build/my.img A HELLO.TXT --text
```

```text
hello
world
```

## era

`era IMAGE DRIVE CPMNAME` erases a file from one user area, 0 or the one
`--user` gives (`tools/tecvol.mjs:160-167`). A name not found there is a
mistake in the command line, with exit status 2. A file with the read-only
attribute is rejected, as TEC-OS rejects it, unless `--force` is given
(`tools/lib/cpmfs.mjs:157-169`).

```sh
node tools/tecvol.mjs era build/my.img B TAS.COM
node tools/tecvol.mjs era build/my.img B TAS.COM --user 3
```

```text
tecvol: TAS.COM not found
usage: tecvol create|info|verify|dir|put|get|era|recipe|install ... (see tools/tecvol.mjs)
```

The first command searched user area 0, which has no `TAS.COM`. The second
erased the file from user area 3 and printed nothing.

Here a file is put on drive B with its read-only attribute. A second `put` over
it and an `era` of it are both rejected with exit status 1, and the image stays
as it was. The last command erases it:

```sh
node tools/tecvol.mjs put build/my.img B build/hello.txt NOTE.TXT --ro
node tools/tecvol.mjs put build/my.img B build/hello.txt NOTE.TXT
node tools/tecvol.mjs era build/my.img B NOTE.TXT
node tools/tecvol.mjs era build/my.img B NOTE.TXT --force
```

```text
tecvol: 0/NOTE.TXT is read-only
tecvol: 0/NOTE.TXT is read-only
```

## recipe

`recipe RECIPE.json IMAGE` builds a card from a recipe, a JSON file that lists
the volumes and the files to put on them (`tools/tecvol.mjs:168-174`).
`npm run media` writes the starter card's recipe as `dist/starter.recipe.json`
and builds `dist/starter.img` from it (`tools/media.mjs:212-229`, `tools/media.mjs:240-241`, `tools/media.mjs:258-259`). It also
writes the web page's recipe, `dist/page.recipe.json`, which adds `DEMO.COM`
to the starter card's files (`tools/media.mjs:192-210`, `tools/media.mjs:230-239`, `tools/media.mjs:256-260`). A recipe has the
schema `tecos-file-recipe-v1`, a list of `volumes` and a list of
`components`, each with `files`. Each volume is in `create`'s terms: a
geometry, a label, a drive and `readOnly` or `writeBehind`. Each file has a
name, a `url`, a drive, a size in `bytes`, a `sha256` and optionally a user
area (`tools/lib/recipe.mjs:13-26`).

A file's `url` is a web address if it starts `http://` or `https://`.
Otherwise it is a path from the recipe's own folder
(`tools/tecvol.mjs:91-101`). It checks each file's size and SHA-256 against the
recipe and stops at the first that differs. The read-only flags go on last,
after every file is written (`tools/lib/recipe.mjs:27-34`). The web page
builds its "New starter card" from its own recipe with the same function.

```sh
node tools/tecvol.mjs recipe dist/starter.recipe.json build/fresh.img
sha256sum build/fresh.img dist/starter.img
```

```text
22881c466664eedeed4c7482fba6e9a798b77d83d2c6666d9a2a2e8b05286f70  build/fresh.img
22881c466664eedeed4c7482fba6e9a798b77d83d2c6666d9a2a2e8b05286f70  dist/starter.img
```

The two images are the same to the byte. Nothing in the header, the volumes'
places, the `E5h` fill or the files' blocks depends on the time or the PC.

## install

`install IMAGE DEVICE --yes` writes the image to a device, from its first
block (`tools/tecvol.mjs:175-186`). It checks the image as a container and
writes it whole, over whatever the device held. Without `--yes` it stops with
a usage error.

```sh
node tools/tecvol.mjs install dist/starter.img /dev/rdiskN --yes
```

`/dev/rdiskN` stands for the card's raw device on a Mac. On Linux it is a
device such as `/dev/sdX`. Opening a device usually needs the PC's
administrator rights. `install` checks nothing about the device. Check the
device name twice before the command runs: given the PC's own disk, it
overwrites that disk's first blocks.

## A worked example

The commands above, run in order from `create` to `era`, make a card with a
text file and a program on drive A. `dir` lists them:

```sh
node tools/tecvol.mjs dir build/my.img A
```

```text
 0 HELLO.TXT         128
 0 MOUNT.COM         768
```

The card boots with its two drives, and the text file reads back with TEC-OS's
`TYPE`:

<!-- node tools/capture.mjs --card build/my.img DIR "TYPE HELLO.TXT" MOUNT -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>DIR
HELLO.TXT    MOUNT.COM   
2 files, 1012K free
A>TYPE HELLO.TXT
hello
world

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 ARCHIVE     G1M R/O

A>
```

The card has no `STARTUP.CMD`, so no lines follow the volumes before the first
prompt. `MOUNT` with no argument lists all three volumes, `ARCHIVE` on no
drive.
