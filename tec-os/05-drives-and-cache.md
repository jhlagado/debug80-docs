---
title: Drives, the cache and your work
parent: TEC-OS
nav_order: 5
nav_group: "Part I: Using and programming TEC-OS"
---

# 5. Drives, the cache and your work

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

At the board, TEC-OS reaches the card through its drives and its block cache.
Each drive holds one of the card's volumes. The cache holds the blocks TEC-OS
read or wrote last, so a change you make can be in memory before it is on the
card. The examples here run on `my.img`, the four-volume card [Chapter
4](04-cards-and-volumes.md) built, and on the starter card.

## Drives and MOUNT

Cold boot puts each volume on the drive its descriptor names and prints the
drives that have one. On `my.img` the boot prints this. The prompt follows at
once because the card has no startup file:

<!-- node tools/capture.mjs --card my.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>
```

`MOUNT`, the starter card's program that `my.img` has too, works with the
volumes while TEC-OS runs. With no argument it lists every volume in the
container. Each line gives the volume's index, its label, its geometry and the
drive it is on. With a drive and a label or an index, `MOUNT` puts that volume
on the drive:

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

`MOUNT C: SPARE` fails because `SPARE` is on drive D already. A volume is on
one drive at most. A label or an index that no descriptor has prints `No such
volume`. `MOUNT B:`, with no volume, takes the volume off drive B and prints
`Unmounted`. Drive A always has a volume, so `MOUNT A:` prints `Cannot
unmount`. A volume goes on drive A only in place of the one there. An argument
`MOUNT` can't read makes it print how it is used, `MOUNT [D: [NAME or
INDEX]]`.

`MOUNT` changes only TEC-OS's memory. The card's header still names the drives
it named before, so a power cycle puts the volumes back on them. Before a
drive's volume changes, TEC-OS writes to the card every change the cache
holds. It reads the directory again the next time the drive is used. A volume
mounted on the current drive is read at once, because TEC-OS selects the drive
again as the mount ends.

A drive with no volume can't be selected. On the starter card, where drive C
has none, `C:` gives the BDOS error that
[Chapter 3](03-command-line.md#drives-and-user-areas) showed.

Which drives can take a volume depends on the card. A drive that cold boot
sets up costs memory, because the BDOS keeps an allocation vector for it. The
vector is the map of the volume's free space, sized for the volume on the
drive at cold boot. The starter card gives drives C and D no volume. They get
no vector, so no volume can be mounted on them. Drive B's vector is sized for
a G8M volume, and drive B takes a G1M or a G8M. Drive A's vector is sized for
a G1M, and drive A takes only a G1M. A drive keeps its vector when `MOUNT`
empties it:

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

A card made with `tecvol create --drives N` gives drives A to the Nth a
full-size vector each. Each gets one whether a volume is on the drive at cold
boot or not, so any of those drives takes any volume later. That is why
`my.img` could take `GAMES` on drive C and `SPARE` on drive D. [Chapter
8](08-memory.md) gives the cost of the vectors in bytes.

## The block cache and the volume written behind

Reading the card takes time. So TEC-OS keeps up to 30 blocks read from it, 15
KiB, in EXPAND 1, the half of the board's second RAM chip that is TEC-OS's
own. Every drive's reads go through this block cache. A block TEC-OS read
before and still holds is copied from memory. Only a block it doesn't hold is
read from the card. A block written to the card is also brought up to date in
the cache, so the cache never holds a stale copy. On the model, a program took
1.66 seconds to read a 12 KiB file the first time. The second time took 0.34
seconds, a fifth of that. A file too large for the cache took as long the
second time. [Chapter 18](18-block-cache.md) gives the method.

A volume is *written through* by default: a write reaches the card before
TEC-OS reports it done. When a program writes a record, TEC-OS writes the
record's whole block to the card. It waits until the card reports the block
accepted. If that write fails, the cache drops its copy of the block. The next
read of the block then comes from the card.

The exception is the volume written behind, which [Chapter
1](01-introduction.md#keeping-your-work) introduced. Its descriptor marks it,
`tecvol` marks one at most, and on the starter card it is `WORK`. The volume's
writes go into the cache and stay there. TEC-OS writes them to the card at
five times:

- When a program writes to the volume's directory, for instance by closing a
  file. TEC-OS first writes every data block the cache holds changed, and then
  the directory block.
- When every block in the cache holds changes and TEC-OS needs a block for
  something else.
- At every warm boot, so `^C` at the prompt or the end of any program writes
  everything.
- When `MOUNT` changes a drive.
- When a program calls BDOS function 48.

Writing behind saves card writes when a program writes a file a record at a
time. The four records of a block then reach the card in one write of the
block. A *flush* writes all the cache's changes to the card. A block written
many times between two flushes reaches the card once, unless the cache fills
between them. On the model, `SAVE 64`, which writes 16 KiB, took 7.65 seconds
on a G8M volume written through. On one written behind it took 2.49 seconds,
about a third of that.

The order of the writes keeps the card's directory true to its data. TEC-OS
writes a directory block only after every changed data block the cache holds.
The directory therefore never names a block whose data isn't on the card.

A block that can't be written while a program runs gives the program the BDOS
error `Bad Sector`. A flush tries every changed block. The flush before a
directory write keeps each data block it can't write in the cache, still to be
written. It drops the directory block, so the card's directory stays as it was
and is read from the card again. A program that has the error returned with
function 45 and closes the file again gets the error again. It gets it until
the data can be written. The flushes at a warm boot, at `MOUNT` and at
function 48 drop from the cache each block they can't write. The card then
keeps its old copy and the change is lost. A warm boot whose flush dropped a
block prints `Write lost` once. The next warm boot has nothing more to report.

A card too small for its container shows the whole sequence. Here the starter
card's image ends 32 blocks into `WORK`, just past the volume's directory. The
directory is on the card and the data area is not:

```sh
cp dist/starter.img nodata.img
truncate -s 2113536 nodata.img
```

<!-- node tools/capture.mjs --card nodata.img "@start SAVE 1 B:X.COM" "@key x" "DIR B:" -->
```text
A>SAVE 1 B:X.COM

Bdos Err On B: Bad Sector
Write lost
A>DIR B:
X.COM       
1 file, 8176K free
A>
```

`SAVE` made `X.COM`'s directory entry as it opened the file, and the record
went into the cache. The close's flush couldn't write the record's block, so
the close failed with `Bad Sector`. The warm boot after the key tried the
block again, dropped it and printed `Write lost`. `X.COM` is on the card with
no records.

A card that comes out of the board gets no more writes from the cache, even
when the same card goes back in. Only cold boot starts a card. So the first
warm boot after the card came out prints `Write lost` and drops the changed
blocks, and a reset discards anything written behind after that.

## The drives after a reset

A reset runs cold boot, and cold boot rebuilds TEC-OS's memory. The cache, the
services, the command history and the open files are all gone after it. So is
any change in the cache that hadn't reached the card. The one thing a reset
can keep is the selection of volumes on the drives. The selection survives if
TEC-OS had reached a prompt before the reset and each volume on a drive is
still on the card. Each must be at the same place, of the same size and of the
same kind. The drives then hold the same volumes after the reset as before it:

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

Drive B, emptied before the reset, is still empty after it. The whole
selection is dropped if any volume on a drive matches no descriptor on the
card in the socket. The drives then get the volumes the header names, as after
a power cycle. Turning the board off always gives the header's drives, since
the selection is held only in RAM. [Chapter 15](15-reset-and-boot.md)
describes the test cold boot applies to the RAM a reset leaves.

A reset is also what a card changed on a PC needs when it goes back into the
board, as [Chapter 1](01-introduction.md#keeping-your-work) said. Across warm
boots TEC-OS keeps each drive's allocation vector and the cache's copies of
blocks. A warm boot doesn't read the card again. A card changed on the PC
matches neither, and TEC-OS starts the card only at cold boot.

## Recovering after a power cut

CP/M writes a file's data blocks first and its directory entry after them.
TEC-OS adds no journal. Once a file is closed, its data and its directory
entry are both on the card. Before the close, some of a file's writes may be
on the card and others not. Nothing puts the old contents back. A power cut or
a reset then leaves the file in one of these ways:

- On a volume written through, each record a program writes is on the card at
  once. A cut between the data and the directory leaves new data in allocation
  blocks the directory doesn't name. Those blocks are free space again the
  next time the drive's allocation vector is built. A record written over one
  the file already had replaces it on the card at once. After a cut the file
  holds the new records with the old ones the program hadn't reached. Nothing
  on the card keeps the old file.
- On the volume written behind, a change since the last flush is lost if it is
  still in the cache. A block TEC-OS wrote early to make room in a full cache
  is on the card. So are the blocks a flush finished before the cut. Any new
  data block among them has no directory entry naming it, as above. A block
  the file already had holds the new records in place of the old. A cut never
  leaves an entry naming a block whose data isn't there.
- A cut during the write of one block can leave that block with old, new or
  mixed contents. If the block is part of a directory, it holds 16 directory
  entries, and any of them can be damaged.

To recover a card after a cut, copy it to the PC first and work on the copy.
`dd` copies the starter card's 20,480 blocks from the card's device, named as
in [Chapter 4](04-cards-and-volumes.md#putting-an-image-on-a-card):

```sh
dd if=/dev/rdiskN of=card.img bs=512 count=20480
node tools/tecvol.mjs verify card.img
```

`tecvol verify` reads each volume's directory. It reports the faults that
would make files share or lose allocation blocks:

- An allocation block that two files claim.
- An allocation block number past the end of the volume.
- Two directory entries for the same part of a file.
- An entry with a record count above 128.
- An entry that names more allocation blocks than its records need.

It exits with status 1 if it found a problem. `tecvol get` then copies off
what it can read. A fresh image built with `create` and `put`, or from a
recipe, goes back on the card with `install`.
