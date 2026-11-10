---
title: "F. `tecvol`"
parent: TEC-OS
nav_order: 106
nav_group: "Reference"
---

# Appendix F. `tecvol`

<!-- Source mechanisms inspected at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe. No product import or execution.
     All25 retained fences and the capture command are historical78127ec
     results/recipes, explicitly rerun in Book45:80. Historical raw binary
     inputs in dist/files: TED.COM Thorium128edb7 SHA-256
     2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f;
     TAS.COM Thoriumdbee66a SHA-256
     45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     No example, artifact or application pin was refreshed.
     Citations prefixed 7fa2823: use TEC-OS
     7fa2823357b2a96330d0b90bd120702347043116 (main).
     Citations prefixed 755636b: and the release-card file list use TEC-OS
     755636b130241173c5c30a0be8fe6b79cf2fee37 (tools/media.mjs,
     test/starter.test.mjs). No release-card tecvol listing was captured. -->

`tecvol` edits TEC-OS card images on a PC. It creates volumes, inspects their
files and directories, copies files and writes an image to a physical device.
Run it from a repository clone as `node tools/tecvol.mjs`. The package also
names the command `tecvol` (`package.json:11-13`). Chapter 6 gives the working
procedures and recovery precautions. Appendix E defines the container format.

## Common rules

The nine commands have these arguments (`tools/tecvol.mjs:4-17`):

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

Options can appear anywhere after the command. An unknown `--` option is a
usage error. Argument parsing checks `--user`, `--align` and `--drives`
before opening or changing an image (`tools/tecvol.mjs:35-63`). Except for
`create` and `recipe`, commands open an existing image and validate its
container first. That validation is separate from the directory checks made
by `info` and `verify` (`tools/tecvol.mjs:73-82`, `tools/tecvol.mjs:109-197`).

`DRIVE` selects a volume by drive letter, with or without a colon, then by
label and finally by id. The first matching form wins. A label or id reaches
a volume that has no assigned drive (`tools/lib/container.mjs:202-209`).
There is no CCP program-search fallback in a host file operation.

`--user N` takes one or two decimal digits with a value from 0 to 15.
Without it `put`, `get` and `era` use area 0 while `dir` lists all areas.
A malformed user value stops before the image is opened
(`tools/tecvol.mjs:47-51`, `tools/tecvol.mjs:107-107`,
`tools/tecvol.mjs:142-174`).

Successful commands exit with status 0. A usage error prints its reason and
the usage line and exits with status 2. An absent file in `era` is a usage
error too. Other failures print `tecvol: ` and the reason and exit with
status 1. `verify` also returns 1 for reported directory problems
(`tools/tecvol.mjs:29-33`, `tools/tecvol.mjs:139-139`,
`tools/tecvol.mjs:173-173`, `tools/tecvol.mjs:201-206`).

Image replacement validates the changed bytes in memory, writes a temporary
file beside the image and renames that file over it. A failure before the
rename leaves the original image unchanged. It does not reread the temporary
file or explicitly synchronise it to durable storage. This is distinct from
`install` writing directly to a device (`tools/tecvol.mjs:65-71`).

Never change a card on the PC while TEC-OS is using it. At the board's command
prompt, a successful `^C` flush must finish before removal. `Write lost` means
that some changes were dropped. Reset after returning a PC-changed card because
TEC-OS's cached blocks and allocation maps otherwise describe its old contents.
Chapter 6 gives the copy-first procedure.

The examples below are retained historical runs with prepared `dist/` inputs
and an existing `build/` directory. Follow their order when constructing the
worked card. `build/my.img` is this appendix's separate fixture, not Chapter 5's
four-volume `my.img`. Historical figures and hashes are not current-build
constants.

## create

`create IMAGE --volume SPEC ...` makes an empty image and rejects an output
path that already exists (`tools/tecvol.mjs:109-114`). Each `--volume` adds
one descriptor in the given order:

| Part of `GEOMETRY:LABEL:DRIVE[:ro][:wb]` | Meaning |
| --- | --- |
| `GEOMETRY` | `G1M` or `G8M` |
| `LABEL` | Capitalised and limited to 11 characters. The resulting labels must differ |
| `DRIVE` | A–D or empty for a volume on no drive |
| `:ro` | Read-only volume |
| `:wb` | Written-behind volume. At most one and never together with `:ro` |

`--align N` places volumes at multiples of N card blocks. The decimal value must
be from 1 to 16,777,215 and must also be a multiple of 8. The default is 2,048
blocks or 1 MiB. A value outside the decimal range gives a usage error. A value
inside it that is not a multiple of 8 fails container creation with
`alignment must be a multiple of 8 blocks` and status 1
(`tools/tecvol.mjs:35-39`, `tools/tecvol.mjs:52-53`,
`tools/lib/container.mjs:89-99`).

`--drives N` takes 1 to 4 and records the number of drive slots to reserve
at cold boot. Supplying it or requesting more than eight volumes selects
format 1.1. Otherwise creation uses 1.0. One volume must be assigned to A.
Each payload is filled with `E5h`, producing an empty CP/M directory and data
area (`tools/lib/container.mjs:79-125`).

This historical fixture has SYSTEM on A, written-behind WORK on B and a
read-only ARCHIVE on no drive:

```sh
node tools/tecvol.mjs create build/my.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G1M:ARCHIVE::ro
```

Successful creation prints nothing.

## info and verify

`info IMAGE` prints the container and then every volume
(`tools/tecvol.mjs:115-140`):

```sh
node tools/tecvol.mjs info build/my.img
```

```text
container: format 1.0, 22528 blocks (11534336 bytes), 3 volume(s)
  A: SYSTEM      id 1 G1M start 2048 rw 0 file(s), 1040384 bytes free
  B: WORK        id 2 G8M start 4096 rw wb 0 file(s), 8372224 bytes free
  -: ARCHIVE     id 3 G1M start 20480 ro 0 file(s), 1040384 bytes free
```

The container line gives format, block/byte length and volume count. A
format-1.1 card gives its requested drive count when that field is nonzero. Each volume line gives
drive or `-`, label, id, geometry, start block, protection, optional `wb`,
file count and free space. WORK ends at exclusive block 20,480, where ARCHIVE
starts. G1M's free space is its 512 allocation blocks less four directory
blocks, at 2 KiB each.

At the inspected source, directory faults are printed as `problem:` lines.
If duplicate allocations or a block beyond DSM prevent a free-space count,
the volume line says `free unknown` and later volumes are still listed.
These are source-derived reporting rules, not new output added to the
historical healthy-card example (`tools/tecvol.mjs:119-138`,
`tools/lib/cpmfs.mjs:78-89`, `tools/lib/cpmfs.mjs:241-267`).

`verify IMAGE` prints the same report and returns status 1 if any directory
problem was found. `info` does not turn those reported problems alone into
a failing status. A malformed container fails either command before its report.
This historical header-check example gives status 1:

```sh
cp dist/starter.img build/badsum.img
printf 'X' | dd of=build/badsum.img bs=1 seek=25 conv=notrunc
node tools/tecvol.mjs verify build/badsum.img
```

```text
tecvol: header checksum mismatch
```

## dir

`dir IMAGE [DRIVE]` lists A by default. Each line gives user area, filename and
record-rounded byte length. `R/O` and `SYS` mark file attributes
(`tools/tecvol.mjs:142-149`). CP/M records are 128 bytes so the listing includes
padding rather than a PC file's original byte length. The historical starter's A
directory was:

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

MOUNT was 671 bytes in `dist/files` and occupies six records, 768 bytes, on
the card. The other sizes likewise belong to those historical inputs. The
release starter card's A holds nine files: these six, with the release
TED.COM and SAMPLE.ASM, and TIMES.BAS, BAZA.COM and BAZA.RTL
(`755636b:tools/media.mjs:197-211`, `755636b:test/starter.test.mjs:36-62`).

## put

`put IMAGE DRIVE FILE [CPMNAME]` copies a PC file to the selected volume.
The card name is `CPMNAME` or the capitalised PC basename. The host validates
that name as an 8.3 spelling (`tools/tecvol.mjs:150-157`,
`tools/lib/cpmfs.mjs:15-20`).

A file of the same name in the same area is replaced unless its read-only
attribute blocks the operation. `--force` overrides that file attribute but
never a read-only volume. Insufficient data blocks or directory entries stop
the copy before the image is replaced (`tools/lib/cpmfs.mjs:180-206`).

Binary files are padded with zero bytes to complete their final record. `--text`
converts LF and CR LF endings to CR LF, appends `^Z` and pads with `^Z`. `--ro`
and `--sys` set the two file attributes and `--user N` selects the destination
area (`tools/lib/cpmfs.mjs:180-188`, `tools/lib/cpmfs.mjs:216-218`). These
retained commands make a text file and copy the prepared binaries:

```sh
printf 'hello\nworld\n' > build/hello.txt
node tools/tecvol.mjs put build/my.img A build/hello.txt --text
node tools/tecvol.mjs put build/my.img A dist/files/MOUNT.COM
node tools/tecvol.mjs put build/my.img B dist/files/TAS.COM --user 3
```

Copying to the read-only volume fails without changing the image:

```sh
node tools/tecvol.mjs put build/my.img ARCHIVE build/hello.txt
```

```text
tecvol: volume is read-only
```

The invalid user value is rejected with status 2 before opening the image:

```sh
node tools/tecvol.mjs put build/my.img A build/hello.txt --user 1.5
```

```text
tecvol: --user "1.5": a user number 0 to 15
usage: tecvol create|info|verify|dir|put|get|era|recipe|install ... (see tools/tecvol.mjs)
```

## get

`get IMAGE DRIVE CPMNAME [OUTFILE]` extracts a file into OUTFILE or writes
its bytes to standard output when no output path is supplied. Without `--text`
it returns whole records, including padding. With it extraction stops at
the first `^Z` and converts CR LF to LF (`tools/tecvol.mjs:159-167`,
`tools/lib/cpmfs.mjs:128-150`).

Each directory entry supplies records only through its recorded extent/count.
Records not held by an entry remain zero, including holes from sparse random
writes. A block number above DSM is damaged metadata. Extraction then fails
with status 1 before writing an output file, with the filename, extent, entry
and block in the error (`tools/lib/cpmfs.mjs:128-150`).

```sh
node tools/tecvol.mjs get build/my.img A HELLO.TXT --text
```

```text
hello
world
```

## era

`era IMAGE DRIVE CPMNAME` erases the file in area 0 or the area given by
`--user`. An absent name gives usage status 2. A read-only file fails with
status 1 unless `--force` is supplied. The volume itself must be writable
(`tools/tecvol.mjs:169-175`, `tools/lib/cpmfs.mjs:157-173`).

```sh
node tools/tecvol.mjs era build/my.img B TAS.COM
node tools/tecvol.mjs era build/my.img B TAS.COM --user 3
```

```text
tecvol: TAS.COM not found
usage: tecvol create|info|verify|dir|put|get|era|recipe|install ... (see tools/tecvol.mjs)
```

The first command searches area 0, where TAS is absent. The second erases
its area-3 copy and prints nothing. The next sequence separately exercises
the file's read-only attribute:

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

The middle two operations fail without changing the image. The last erases
NOTE.TXT with `--force`.

## recipe

`recipe RECIPE.json IMAGE` constructs an image from the
`tecos-file-recipe-v1` JSON schema. A recipe lists volumes and components
separately. Volume entries give geometry, label, `mount` and optional
`readOnly` or `writeBehind`. Components contain files. File entries give
name, URL/path, `drive`,
byte size, SHA-256 and optional user area (`tools/lib/recipe.mjs:14-26`).
Unlike `create`, this command can replace an existing output image
(`tools/tecvol.mjs:177-182`).

An `http://` or `https://` URL is fetched from that address. A relative
file path is resolved from the recipe's directory. Each fetched component
must match its size and SHA-256 before placement. Read-only volume flags
are applied after the files are written (`tools/tecvol.mjs:92-101`,
`tools/lib/recipe.mjs:14-44`). The web page uses the same recipe function
for New starter card.

`npm run media` prepares `dist/starter.recipe.json` and its image. It also
writes `dist/page.recipe.json`, which has the starter files plus DEMO.ASM
and BOUNCE.BAS and its own id, revision, name and instructions
(`7fa2823:tools/media.mjs:222-251`, `277`). Chapter 27
describes that preparation. The retained historical rebuild produced these
matching hashes:

```sh
node tools/tecvol.mjs recipe dist/starter.recipe.json build/fresh.img
sha256sum build/fresh.img dist/starter.img
```

```text
22881c466664eedeed4c7482fba6e9a798b77d83d2c6666d9a2a2e8b05286f70  build/fresh.img
22881c466664eedeed4c7482fba6e9a798b77d83d2c6666d9a2a2e8b05286f70  dist/starter.img
```

The image construction uses fixed placement, fill bytes and file contents.
With the same recipe and matching inputs its bytes do not depend on the PC's
clock. The printed hashes identify this historical recipe's result, not the
future opening card.

## install

`install IMAGE DEVICE --yes` validates the image as a container, opens the
device and writes from offset 0. Without `--yes` it gives a usage error
(`tools/tecvol.mjs:184-195`).

```sh
node tools/tecvol.mjs install dist/starter.img /dev/rdiskN --yes
```

`/dev/rdiskN` is a placeholder for the identified removable card's raw Mac
device. A Linux device may have a name such as `/dev/sdX`. Check its identity
and capacity and unmount its filesystems before writing. Opening it usually
requires administrator rights. `--yes` authorises the overwrite, not device
identification or a backup. The tool does not check whether the named device
is the intended card. Naming the PC's disk overwrites that disk instead.

This is a direct write, unlike temporary-file replacement. An interrupted
operation can leave a partial card. Chapter 6 gives the backup and physical card
transfer procedure.

## The worked card

Following the historical commands from create through era leaves HELLO and
MOUNT on A. The final directory was:

```sh
node tools/tecvol.mjs dir build/my.img A
```

```text
 0 HELLO.TXT         128
 0 MOUNT.COM         768
```

The same card's retained TEC-OS capture reads the text and lists all volumes:

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

There is no STARTUP.CMD on this card so the first prompt follows the volume list
without a startup command. MOUNT with no argument lists ARCHIVE too, even though
it has no assigned drive.
