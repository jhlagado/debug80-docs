---
title: The BDOS
parent: TEC-OS
nav_order: 16
nav_group: "Part II: Inside TEC-OS"
---

# 16. The BDOS

Checked against TEC-OS 1f9542d, with the starter card's `TED.COM` from Thorium
04ec086, whose copy in `dist/files` has the SHA-256
`d42b6d2a5ea3158ff76774abaef1d290a42dc76ea9bb34aa564e3ae87add7344`, and its
`TAS.COM` from Thorium dbee66a, with the SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

A CP/M program puts a function number in `C` and an argument in `E` or `DE`,
then calls `0005h`, as Chapter 6 describes. This chapter describes the BDOS
from that entry: the function table, the console functions, the way a file's
records are found and the allocation vectors with the scan at warm boot. It
then covers the BDOS errors, the two functions whose meanings come from CP/M 3
and the differences from Digital Research's BDOS.

## The BDOS in the ROM

TEC-OS's BDOS comes from Portable CP/M, an implementation of the documented
CP/M 2.2 interface that uses no Digital Research source
(`src/cpm/PROVENANCE.md:3-7`). Its code is in `src/cpm/bdos.asm`. In the ROM
that Chapter 12 describes it runs from `E108h`, `BDOSBAS`, to `F00Eh`, 3,847
bytes. Its table of functions and its error messages are in the
ROM's data block (`src/data3.asm:73-90`). None of it can be patched.

The BDOS's variables and its 54-byte stack are in RAM, in the block from
`BDOSRAM` to `BDOSRME`, `BE77h` to `BEFFh` (`src/ram.asm:130-190`,
`src/layout.asm:79`). Warm boot clears that block, as a fresh load of the BDOS
from disk would leave it, and sets the DMA address to `0080h`
(`src/boot.asm:261-280`).

A few of the BDOS's variables are outside that block, because a warm boot must
not clear them. `LOGINV`, in the BIOS's part of the workspace (`src/ram.asm:31`),
has a bit for each logged-in drive, a drive whose allocation vector the BDOS has
built from its directory, as the section on allocation vectors below describes.
`PRGCODE`, the code of function 108, is above the RAM BIOS table, where cold boot
clears it and warm boot does not (`src/ram.asm:228`, `src/boot.asm:33-37`). The
rest of what the BDOS keeps for a drive is in the drive's disk parameter header,
the DPH, 16 bytes holding the addresses of the drive's tables, which Chapter 18
describes.

The BDOS reaches the BIOS through the RAM BIOS table at `BF00h`. Its names for
the BIOS entries are offsets from `RAMBIOS` (`src/cpm/bdos.asm:10-28`), so a
program that replaces an entry there receives the BDOS's own calls, as Chapter 15
describes. The one exception is the check for `^S` made before each character
the BDOS prints, which calls the ROM's `BCONST` directly
(`src/cpm/bdos.asm:2452-2456`), since the table's `CONST` draws the video cursor
while no key is waiting (`src/console.asm:105-109`).

## The entry

The jump at `0005h` leads to the BDOS entry jump directly below the allocation
vectors or, with a service in, to the same jump at the start of the lowest
service's page, as Chapter 20 describes (`src/vol.asm:586-590`,
`src/boot.asm:200-212`, `src/svc.asm:203-206`). That jump goes
to `BENTRY` (`src/cpm/bdos.asm:79-115`).

`BENTRY` saves the caller's stack pointer in `OLDSP`, moves to the BDOS's own
stack and keeps `DE` in `PARAM` (`src/cpm/bdos.asm:80-82`). Every function, and
every BIOS call it makes, runs on that stack, so the caller's stack holds only
the return address of its `CALL`. `BENTRY` then tests for two functions by
number, 108 and 47 (`src/cpm/bdos.asm:83-87`). Any other number of 41 or more
returns 0 at once (`src/cpm/bdos.asm:88-89`).

A function from 0 to 40 is found in `FNTAB`, a table of 41 words, one routine
each (`src/data3.asm:76-83`, `src/cpm/bdos.asm:90-97`). Functions 38 and 39,
which CP/M 2.2 leaves undefined and MP/M uses, are `RETZERO`.

Some functions take an FCB, a file control block, and work on the drive its
first byte names, so that drive has to be selected before such a function runs.
`FCBMAP`, six bytes, has a bit for each function, bit n mod 8 of byte n / 8,
set where the FCB's drive is selected first (`src/data3.asm:84`). The bits are
set for functions 15, 16, 17, 19 to 23, 30, 33 to 35 and 40. `BENTRY` finds
the byte by subtracting 8 from the number until it goes below zero. It rotates
the byte left until the function's bit is in the carry flag, and if the bit is
set it calls `FCBSEL` before the routine (`src/cpm/bdos.asm:98-112`).

`FCBSEL` reads the FCB's drive byte (`src/cpm/bdos.asm:526-545`). A 0 means
the default drive and 1 to 16 mean drives A to P. A `?` is allowed only for
function 17, where it selects every directory entry on the default drive, and
for any other function it is the `Select` error.

The selection itself, `SELDRV`, rejects a drive of 16 or more. It calls
`LOGIN` unless the drive is the one already bound and is logged in
(`src/cpm/bdos.asm:510-524`). An FCB can name a drive other than the current
one, so the BDOS has two drive variables. `CURDRV` is the drive the current
function works on, the bound drive, which an FCB may change. `DEFDRV` is the
default drive, the current drive that the prompt shows, which only function 14
and the disk reset change (`src/cpm/bdos.asm:498-508`). The FCB's drive byte is
read and never rewritten.

The routine runs with `DE` back from `PARAM`, entered by `JP (HL)`
(`src/cpm/bdos.asm:113-115`), and ends at one of three exits
(`src/cpm/bdos.asm:117-128`). `RETZERO` returns 0, `RETA` returns the byte in
`A` and `RETWORD` returns the word in `HL`. All three put the result in `HL`,
its low byte in `A` as well and its high byte in `B`, as CP/M 2.2 does, then
restore the caller's stack pointer and return. The other registers are not kept.

## The console functions

The BDOS checks for `^S` while it prints, and the check takes any key typed off
the console, so the console functions keep one character in reserve. `PENDING` is
set while `PENDCHR` holds a character the BIOS has delivered and no program has
read yet (`src/ram.asm:136-137`). `GETCHAR` returns that character if there is
one and otherwise calls `CONIN` (`src/cpm/bdos.asm:2437-2444`), and the status
routines report a character waiting when `PENDING` is set
(`src/cpm/bdos.asm:2446-2456`).

The reserve is filled during output. Every character the BDOS prints for
functions 2 and 9 goes through `OUTCHAR`, which expands a tab to spaces up to
the next multiple of 8. Before each character it calls `CHKKEY`
(`src/cpm/bdos.asm:2458-2475`), which tests the console's status and, if a key
is waiting, reads it (`src/cpm/bdos.asm:2525-2542`). A `^S` stops the output
until the next key, which is read and discarded, and a `^P` turns on or off the
copy of the console's output to the list device. Any other key goes into
`PENDCHR`, to be the next character a program reads, so a key typed while a
program prints is kept, as it is in CP/M 2.2.

`ECHORAW` sends each character to `CONOUT`, and to `LIST` while the `^P` copy
is on. It also keeps `COLUMN`, the console column, for the tabs
(`src/cpm/bdos.asm:2482-2497`).

Function 1 reads a character with `GETCHAR` and echoes it, a control character
too (`src/cpm/bdos.asm:147-153`). Function 6 is direct console I/O. With `E` =
`FFh` it returns a waiting character, without echo, or 0 if there is none.
With any other `E` it sends `E` to `CONOUT` with no tab expansion, no `^S`
check, no copy to the list device and no change to the column
(`src/cpm/bdos.asm:177-190`). Function 11 returns 1 when a character is
waiting and 0 otherwise. If the BIOS has one, the function reads it at once
into `PENDCHR`, so the character a program reads next with function 1 or 6 is
that one (`src/cpm/bdos.asm:407-421`).

Function 10 reads a line into a buffer whose first byte is its length, from 1
to 255. It returns the count of characters in the second byte, with the
characters after it (`src/cpm/bdos.asm:215-405`). The line ends at a CR or LF,
which is echoed but not stored, or when the buffer is full. The editing keys
are those of CP/M 2.2 (`src/cpm/bdos.asm:228-254`):

- Backspace, `08h`, removes the last character and erases it on the screen
  with backspace, space, backspace (`src/cpm/bdos.asm:289-299`,
  `src/cpm/bdos.asm:2550-2557`).
- Delete, `7Fh`, removes the last character and echoes it, as a printing
  terminal shows a rubout (`src/cpm/bdos.asm:301-312`).
- `^U` prints `#`, starts a new line and empties the buffer. `^R` prints `#`
  and types the line again on a new line. `^X` erases the line on the screen
  and empties the buffer (`src/cpm/bdos.asm:333-389`).
- `^E` starts a new line on the screen and leaves the buffer as it is
  (`src/cpm/bdos.asm:326-331`).
- `^P` turns the list device's copy on or off (`src/cpm/bdos.asm:278-280`).
- `^C` as the first character of the line prints `^C` and ends the program by
  warm boot. Later in the line it is passed over (`src/cpm/bdos.asm:314-324`).

At the prompt, a `^U` partway through `TYPE X` starts the line again, and a
`^R` after `DIR *.CMD` types the line out once more before Return sends it:

<!-- node tools/capture.mjs $'TYPE X\x15DIR *.CMD' $'DIR *.CMD\x12' -->
```text
A>TYPE X#
DIR *.CMD
STARTUP.CMD 
1 file, 978K free
A>DIR *.CMD#
DIR *.CMD
STARTUP.CMD 
1 file, 978K free
A>
```

Four Deletes after `TYPE` take its four letters off one by one, each echoed as
it goes, so the line on the screen reads backwards before `DIR *.CMD` is
typed:

<!-- node tools/capture.mjs $'TYPE\x7f\x7f\x7f\x7fDIR *.CMD' -->
```text
A>TYPEEPYTDIR *.CMD
STARTUP.CMD 
1 file, 978K free
A>
```

Two more keys belong to the CCP alone. `^W` and `^N` recall lines from the
command history when `HFLAG` is set, which the CCP does immediately before its
own call of function 10, so for a program's call they are characters like any
other (`src/cpm/bdos.asm:282-287`). The line the CCP reads is stored in the
history when it ends (`src/cpm/bdos.asm:400-404`). Chapter 22 describes the
history.

Function 9 prints from `DE` up to a `$`, through `OUTCHAR`
(`src/cpm/bdos.asm:201-213`). Functions 3, 4 and 5 pass a byte to or from the
BIOS's `READER`, `PUNCH` and `LIST`, and functions 7 and 8 read and write the
IOBYTE at `0003h` (`src/cpm/bdos.asm:161-199`).

## Files, extents and records

A CP/M file is a sequence of 128-byte records, and the BDOS finds them through
the directory, a table of 32-byte entries at the start of the volume. Each entry
names a file in a user area and lists up to 16 bytes of allocation block
numbers, the blocks of the volume that hold the file's records. In this chapter
*block* alone means an allocation block, and a *card block* is 512 bytes of the
card. A program names a file in an FCB of 36 bytes, and the BDOS fills the FCB
from the entry and keeps it up to date as the program reads and writes:

| Offset | Field | Contents |
| ---: | --- | --- |
| 0 | `DR` | drive: 0 the default, 1 to 16 A to P |
| 1–8 | `F1`–`F8` | the name, in capitals, padded with spaces |
| 9–11 | `T1`–`T3` | the type; bit 7 of `T1` is the read-only attribute, of `T2` the system attribute |
| 12 | `EX` | the extent, 0 to 31 |
| 13 | `S1` | unused |
| 14 | `S2` | the extent's high bits, 0 to 63, and in bit 7 the mark of an FCB not written since its open |
| 15 | `RC` | the count of records in the extent, 0 to 128 |
| 16–31 | `D0`–`D15` | the allocation map |
| 32 | `CR` | the next record in the extent for a sequential read or write |
| 33–35 | `R0`–`R2` | the record number for a random read or write |

A directory entry has the same first 32 bytes, with the user number in place
of the drive. The allocation map holds 16 one-byte block numbers when the
volume has 256 blocks or fewer, and 8 two-byte numbers otherwise. `FCBLOCK`
and `BLOCKIDX` test the high byte of the disk's last block number, `DSM`, to
choose (`src/cpm/bdos.asm:1102-1114`, `src/cpm/bdos.asm:1157-1175`). Both of
TEC-OS's geometries have more than 256 blocks, so every map on a TEC-OS card
holds eight two-byte numbers.

An extent is 128 records, 16 KiB, and one directory entry holds as many extents
as its map has room for. The disk parameter block, the DPB, gives the numbers the
arithmetic needs (`src/gen/geom.asm:9-20`):

| Field | G1M | G8M | Meaning |
| --- | ---: | ---: | --- |
| `SPT` | 64 | 64 | records a track |
| `BSH` | 4 | 5 | records a block, as a power of 2 |
| `BLM` | 15 | 31 | records a block, less 1 |
| `EXM` | 0 | 1 | extents an entry holds, less 1 |
| `DSM` | 511 | 2,047 | the last block's number |
| `DRM` | 255 | 511 | the last directory entry's number |
| `AL0`, `AL1` | `F0h`, 0 | `F0h`, 0 | the directory's blocks, a bit each |
| `CKS` | 0 | 0 | the check vector's length |
| `OFF` | 0 | 0 | reserved tracks |

A G1M block is 2 KiB, so an entry's eight blocks are 16 KiB, one extent. A G8M
block is 4 KiB, so an entry holds 32 KiB, two extents, and `EXM` is 1.

To read or write a record the BDOS needs the record's place on the volume.
`FCBADDR` takes the extent's place within its entry, `EX` AND `EXM`,
times 128. It adds `CR` and shifts right by `BSH` to give the index of the
block in the map (`src/cpm/bdos.asm:1131-1155`). `POSREC` then turns the block
and record into the record's number on the volume: the block shifted left by
`BSH`, plus `CR` AND `BLM` (`src/cpm/bdos.asm:1285-1313`).

The BIOS's interface takes a track and a sector, so `POSREC` divides that number
by `SPT` with `DIV16`, which gives the track as the quotient and the sector as
the remainder. It adds the reserved tracks and passes both to the BIOS through
`SETTRK`, `SECTRAN` and `SETSEC` (`src/cpm/bdos.asm:1315-1336`). `DIV16` is a
16-bit division by shifts and trial subtractions, 16 steps whatever the number
(`src/cpm/bdos.asm:1338-1358`). The BIOS turns track and sector back into one
record number, and four records into one 512-byte card block, as Chapter 18
describes.

`POSREC` checks the block number first. `CHKBLK` compares it with `DSM`, and a
number past the end of the volume, which only a damaged directory holds, is a
`Bad Sector` error (`src/cpm/bdos.asm:1287`, `src/cpm/bdos.asm:2411-2423`).

### The directory search

Every function that names a file works through one search routine, `FINDENT`,
set up by `NEWSRCH` with a mode in `OPENMOD` (`src/cpm/bdos.asm:1595-1670`).
It reads the directory a record at a time, four entries, into the DPH's
directory buffer, `DIRBUF`, and compares each entry with the FCB in `MATCHFCB`
(`src/cpm/bdos.asm:1728-1809`).

An entry matches when its user number is the current one and its name and type
match the FCB's. Bit 7 of each byte is left out so that the attributes don't
count, and a `?` in the FCB matches any character. In every mode but 2 the
extent and `S2` must match too, unless the FCB's extent is `?`. The extent is
compared outside the bits `EXM` covers, since one entry holds `EXM` + 1
extents (`src/cpm/bdos.asm:1769-1801`). The modes are:

| Mode | Used by | Matches |
| ---: | --- | --- |
| 0 | functions 17 and 18 | name and extent; the record goes to the DMA address |
| 1 | open, and the move to the next extent | name and extent; the entry's fields go into the FCB |
| 2 | delete, rename, set attributes, file size | name, any extent |
| 3 | make | an empty entry, `E5h` in its first byte |
| 4 | close | name and extent, nothing copied |
| 5 | function 17 with `?` in the drive byte | every entry |

On a volume with few files most of the directory is unused, so a search stops at
the drive's directory mark, `DIRUSED`, the number of entries up to the last one
in use. Modes 3 and 5 are the exceptions, and go to the end of the directory
(`src/cpm/bdos.asm:1614-1627`). The starter card's drive B has 512 entries, 32
card blocks of them, and with no files a search there reads none. `MAKEFCB`
raises the mark when it uses an entry beyond it (`src/cpm/bdos.asm:750-757`).

### Open, read, write and close

Function 15, open, searches in mode 1 and copies bytes 1 to 31 of the entry
into the FCB, so a `?` in the FCB's name becomes the entry's character. The FCB
keeps its own extent (`src/cpm/bdos.asm:1672-1718`). The entry's `RC` is the
record count of its highest extent. In a G8M file whose entry holds two extents,
an FCB naming the earlier extent gets 128 records, and one naming a later, empty
extent gets 0.

A file that was only read has nothing to write back at its close, so the open
sets bit 7 of `S2`, which records that nothing has been written through this FCB
since. `ADVWRITE` clears it at the first write (`src/cpm/bdos.asm:897-914`).
Function 16, close, returns at once when the bit is still set, with nothing
written (`src/cpm/bdos.asm:558-564`). Otherwise it finds the entry again and
copies the FCB's extent, record count and map into it, or only the map when the
FCB is on an earlier extent than the entry records. It then writes the directory
record back (`src/cpm/bdos.asm:566-602`).

Function 20 reads the record at `CR` into the DMA address and moves `CR` on
(`src/cpm/bdos.asm:920-962`). At `CR` = 128 it closes the FCB, opens the next
extent and starts it at record 0. It returns 1, end of file, when there is no
next extent, when `CR` has reached `RC` or when the record's block is 0.

Function 21 writes the record at `CR` (`src/cpm/bdos.asm:817-857`). If the map
has no block for it, `ALLOCBLK` takes the first free block of the drive, and the
record then goes to the BIOS with write type 2, which marks the block as new
(`src/cpm/bdos.asm:832-843`). The BIOS's other write types are 0, an ordinary
data write, and 1, a write of the directory, which every directory write uses
(`src/cpm/bdos.asm:1859-1865`). The write after record 127 finds `CR` at 128,
and it first closes the extent and makes or opens the next
(`src/cpm/bdos.asm:818-827`, `src/cpm/bdos.asm:859-885`).

The write returns 2 when the drive has no free block. It returns 1 when the
file needs a new directory entry for its next extent and the directory has
none. The FCB then goes back to its extent with `CR` still at 128, so a write
after an entry is freed makes the extent it needs
(`src/cpm/bdos.asm:859-895`).

Functions 33 and 34 read and write a record by number, from `R0` and `R1`
(`src/cpm/bdos.asm:964-997`). `RANDPREP` splits the number into the record
within the extent and the extent, `EX` and `S2`, and if the extent is not the
FCB's it closes the FCB and opens the one wanted
(`src/cpm/bdos.asm:999-1083`). A number with `R2` not 0 is error 6 before
anything changes. A read of a record the extent doesn't hold returns 1, and a
read of an extent that has no entry is error 4. A write makes the extent, and
is error 5 if the directory is full (`src/cpm/bdos.asm:1085-1096`). A failed
close of the old extent is error 3. Function 40 is function 34 with each newly
allocated block filled with zeros first (`src/cpm/bdos.asm:972-980`,
`src/cpm/bdos.asm:1234-1283`).

Function 35 puts the file's size in records in `R0` to `R2`: the end of the
last record of whichever of the file's entries ends highest
(`src/cpm/bdos.asm:1452-1520`). Function 36 sets `R0` to `R2` from the FCB's
sequential position (`src/cpm/bdos.asm:1522-1545`).

Function 22, make, takes the first empty entry and fills in the FCB's name,
the current user number and an empty map. It writes the entry to the directory
at once (`src/cpm/bdos.asm:681-762`). It clears the FCB from `EX` through the
map first, so `EX` and `S2` are 0 and the entry is always the file's first
extent (`src/cpm/bdos.asm:713-721`).

Function 19 erases every entry that matches, frees its blocks and writes each
changed directory record (`src/cpm/bdos.asm:649-679`). Function 23 renames
every entry of the file to the name at offset 17 of the FCB. Function 30
copies the FCB's name and its attribute bits into every entry
(`src/cpm/bdos.asm:771-815`).

## Allocation vectors

The BDOS has to find a free block without reading the whole directory for each
write. Each drive therefore has an allocation vector, one bit for each block
of the volume, set while the block is in use. A vector is 64 bytes for a G1M
volume and 256 for a G8M volume. Cold boot places it below the workspace, as
Chapter 13 describes. The DPH holds its address, and `LOGIN` copies it into
`ALVPTR` (`src/cpm/bdos.asm:1941-1944`).

`ALLOCBLK` scans the vector from block 0 for the first clear bit, sets it and
puts the block's number in the FCB's map (`src/cpm/bdos.asm:1177-1232`). A
delete clears the bits of each block the entry lists
(`src/cpm/bdos.asm:2215-2270`). The blocks the directory itself occupies are
set from `AL0` and `AL1` when the vector is built, and are never given out
(`src/cpm/bdos.asm:2101-2139`). The vector changes as soon as a block is
taken, before the file is closed, so a block that a program has written but not
yet closed is already in use for every other file.

A vector is built when a drive is logged in, the first time it is selected
after a disk reset (`src/cpm/bdos.asm:1900-2008`). `LOGIN` calls
the BIOS's `SELDSK` for the drive's DPH, and a drive with no volume gets 0,
which is the `Select` error (`src/cpm/bdos.asm:1909-1917`). It copies from the
DPH the addresses of the translation table, the directory buffer, the DPB and
the vector. A volume the card marks read-only then goes into the read-only
vector (`src/cpm/bdos.asm:1946-1951`).

For a drive not in `LOGINV`, `INITALV` clears the vector and sets the
directory's bits, and the drive's bit in `LOGINV` is set. The whole directory
is then read, a record at a time. `PARENT` sets the bit of every block that
each entry in use lists, and moves the directory mark past the entry
(`src/cpm/bdos.asm:1952-2008`, `src/cpm/bdos.asm:2141-2213`). A block number
past the end of the volume has no bit, so `BITPTR` passes over it, the drive
logs in, and a delete of that file passes over it too
(`src/cpm/bdos.asm:2257-2281`). For a drive
already in `LOGINV`, `LOGIN` reads nothing: `LOGFAST` takes the drive's mark
from its DPH (`src/cpm/bdos.asm:2010-2028`).

The DPH has three words for the BDOS's own use, at offsets 2, 4 and 6, which
`MNDPH` clears when it builds the DPH (`src/vol.asm:379-382`). TEC-OS's BDOS
puts in them what the scan at warm boot needs:

| Offset | Contents | Written by |
| ---: | --- | --- |
| 2 | the sum of the vector's bytes at the end of the last scan | `LOGDONE` (`src/cpm/bdos.asm:2030-2045`) |
| 4 | the changed flag: 1 once the vector may differ from the directory | `ALFOUND` (`src/cpm/bdos.asm:1208-1215`) and BIOS `WRITE` of a directory card block (`src/bios.asm:210-227`) set it; `LOGDONE` clears it |
| 6 | the directory mark, `DIRUSED` | `DUSAVE` (`src/cpm/bdos.asm:2047-2065`), BIOS `WRITE` of a directory card block (`src/bios.asm:228-248`) |

The BIOS's part is in its `WRITE`. It tests whether the card block being written
is one of the directory's, the first 16 card blocks of a G1M volume or 32 of a
G8M volume. For such a card block it sets the changed flag and raises the mark to
the end of that card block's 16 entries (`src/bios.asm:210-248`). It does that for
every write, so a program's own directory write through BIOS `WRITE` sets the
flag and raises the mark as well. `DUSAVE` writes the BDOS's mark only when it
is higher than the one there, and so keeps the higher of the two.

## The scan at warm boot

CP/M 2.2's CCP resets the disk system at every warm boot, so every drive is
logged in again, and its directory read, at its next selection. On a G8M volume
that is 32 card blocks, and Chapter 14 gives the times. TEC-OS's CCP makes the
same call, function 13, but sets `WRFLAG` first (`src/cpm/ccp.asm:52-55`), and
with the flag set function 13 goes to `WRESET` (`src/cpm/bdos.asm:430-435`).

`WRESET` goes through drives 0 to 15 and does nothing for one not in `LOGINV`
(`src/cpm/bdos.asm:453-492`). For a logged-in drive it calls `LOGIN`, which
binds the drive's pointers and reads nothing, and tests the drive's DPH:

- If the changed flag is set, the drive is taken out of `LOGINV` and put in
  `WARMV`, the vector of drives to rebuild to their mark (`src/ram.asm:149`).
  At its next selection `LOGIN` builds the allocation vector again, but reads
  the directory only up to the mark (`src/cpm/bdos.asm:1975-1989`). No entry
  beyond the mark is in use, so none of them can hold a block.
- If the flag is clear, `ALVSUM` adds up the vector's bytes
  (`src/cpm/bdos.asm:2067-2093`). If the sum is what `LOGDONE` stored, the
  drive stays logged in with its vector as it is. Any other sum means the
  vector has changed in a way that neither an allocation nor a directory write
  recorded, such as a stray write by a program. The drive is then taken out of
  `LOGINV`, to be scanned in full at its next selection.

After the loop `WRESET` joins the ordinary reset at `RSTAIL`, which clears the
read-only vector, sets drive A, sets the DMA address to `0080h` and logs in
drive A (`src/cpm/bdos.asm:440-451`). The CCP then sets the user
number again from page zero. At the end of each full or partial scan,
`LOGDONE` saves the mark, stores the new sum and clears the changed flag and
the drive's bit in `WARMV` (`src/cpm/bdos.asm:2030-2045`).

A warm boot after a program that wrote nothing therefore reads no card block. One
after a program that changed drive A reads A's directory only as far as its
last entry in use.

A program's own call of function 13 finds `WRFLAG` clear, and empties `LOGINV`
and `WARMV`. Every drive is then scanned in full at its next selection, as in
CP/M 2.2 (`src/cpm/bdos.asm:436-439`). Function 37 takes the drives named by
the bits of `DE` out of `LOGINV`, the read-only vector and `WARMV`
(`src/cpm/bdos.asm:1579-1593`). The volume services `MOUNT` and `UNMNT` call
it for a drive whose volume they have changed (`src/vol.asm:673-684`).

## BDOS errors

The BDOS has four error messages, each printed after `Bdos Err On` and the
drive letter (`src/data3.asm:86-90`):

- `Select`, for a drive past D, which the BIOS doesn't have, a drive with no
  volume or a `?` drive byte outside function 17
  (`src/cpm/bdos.asm:2384-2390`).
- `R/O`, for a change to a drive that function 28 has made read-only or to a
  volume the card marks read-only, a close that would write the directory
  included (`src/cpm/bdos.asm:570-571`, `src/cpm/bdos.asm:2368-2382`).
- `File R/O`, for function 19 or 23 on a directory entry with the read-only
  attribute, and for function 21, 34 or 40 through an FCB that has it
  (`src/cpm/bdos.asm:636-647`).
- `Bad Sector`, for a BIOS `READ` or `WRITE` of a file's record that fails, a
  directory record that won't read, a failed directory write and a block
  number past the end of the volume (`src/cpm/bdos.asm:1838`,
  `src/cpm/bdos.asm:2403-2406`).

`DISKERR` prints the message and waits for a key with `GETCHAR`, or takes the
key already kept, if one was typed during output
(`src/cpm/bdos.asm:2425-2444`). `CHDROP` then ends the program by warm boot,
whatever the key (`src/cpm/bdos.asm:73-77`), so the function never returns to the
program. `CHDROP` also drops the rest of a chained line, which Chapter 24
describes.

Chapter 3 shows `R/O` from a read-only volume and `File R/O` from `ERA`. The
volume's read-only flag is in the drive table, and `LOGIN` sets the drive's bit
in the read-only vector from it, so the BDOS refuses the change before any write
to the card (`src/cpm/bdos.asm:1946-1951`). Function 16 makes the same test
before it writes the entry back, as CP/M 2.2's close does, so a file written
on such a drive gives `R/O` at its close. A close of a file only read returns
before the test (`src/cpm/bdos.asm:558-571`). A warm boot clears the vector,
and the drive's next selection sets the bit again.

## Functions 108 and 47

Function 108 is CP/M 3's program return code (`src/cpm/bdos.asm:133-145`).
With `DE` = `FFFFh` it returns the code in `HL`, and with any other `DE` it sets
the code to `DE` and returns 0. There is one code, `PRGCODE`, for every program.
Cold boot clears it with the rest of the workspace and warm boot leaves it, so a
command finds the code its predecessor set (`src/ram.asm:228`,
`src/boot.asm:33-37`).

Function 47 is TEC-OS's chain to another command, from CP/M 3's
(`src/cpm/bdos.asm:46-71`). The command is at the DMA address and ends with a
0 within its first 128 bytes. The function returns `A` = `FFh` and the program
goes on if the command holds a CR or an LF before the 0, or has no 0 there.
Otherwise the function copies 128 bytes over the CCP's command line, `CMDTXT`,
which warm boot keeps, and ends the program by warm boot. It does not return.
`E` is ignored.

Chapter 24 describes the CCP's side of both, the `:` that tests the code and
the pieces of a chained line. Chapter 11 shows both in use.

## Differences from Digital Research's BDOS

TEC-OS's BDOS has the interface of CP/M 2.2, and function 12 returns `22h`
(`src/cpm/bdos.asm:423-425`). Its differences from the BDOS that Digital
Research shipped are these:

- It is in ROM (`src/rom.asm:25-26`). A write to the BDOS's code changes
  nothing, and a hook goes in the RAM BIOS table.
- Functions 47 and 108 have meanings that come from CP/M 3, and every other
  function above 40 returns 0.
- A key after `^S` resumes the output and is discarded, `^C` included. In
  Digital Research's BDOS a `^C` there ends the program.
- The CCP's disk reset at warm boot keeps each drive whose vector is
  unchanged, and rebuilds a changed one from its directory up to the mark. A
  program's function 13 resets every drive, as in CP/M 2.2.
- Function 22 always makes extent 0, with `EX` and `S2` cleared
  (`src/cpm/bdos.asm:713-721`). Digital Research's keeps the FCB's `EX` and
  `S2`.
- A `^P` typed while the BDOS prints turns the list device's copy on or off
  (`src/cpm/bdos.asm:2534-2536`). Digital Research's keeps such a key for the
  next read and takes `^P` only in line input.
- Function 1 echoes every character, control characters too. Digital
  Research's echoes only printing characters, CR, LF, tab and backspace.
- Function 10 called by the CCP takes `^W` and `^N` as the history's keys.
  Called by a program it is CP/M 2.2's.
- The check vector is unused, since `CKS` is 0 in both geometries
  (`src/gen/geom.asm:14`, `src/gen/geom.asm:20`). With no check vector, a card
  changed while TEC-OS runs is not detected.
