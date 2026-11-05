---
title: The BDOS
parent: TEC-OS
nav_order: 19
nav_group: "Part II: Inside TEC-OS"
---

# 19. The BDOS

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

A program puts a function number in `C` and an argument in `DE`, then calls
`0005h`, as Chapter 7 showed. Behind that call is the BDOS. It keeps a drive's
directory in step with the files a program opens, writes and closes. It reaches
the card through the BIOS of Chapter 17 and the cache of Chapter 18.
This chapter follows a file through its life, from `0005h` to the card block
that holds its record, and ends where TEC-OS's BDOS differs from the one
Digital Research shipped. Appendix A gives each function's registers and return
codes.

## The BDOS in the ROM and in RAM

TEC-OS's BDOS comes from Portable CP/M, an implementation of the documented
CP/M 2.2 interface written without Digital Research's source
(`src/cpm/PROVENANCE.md:3-7`). Its code is in six files under `src/cpm/`, which
the ROM assembles in this order (`src/rom.asm:34-39`):

| File | Contents |
| --- | --- |
| `bdos.asm` | the entry, the dispatch and the console functions |
| `bdosfile.asm` | the disk reset, the selection of a drive and the functions on whole entries: open, close, search, delete, make, rename and the attributes |
| `bdosrec.asm` | the records, the FCB's fields and the allocation of blocks |
| `bdosfn.asm` | the functions that read the BDOS's tables and the directory search |
| `bdoslog.asm` | the directory records, the login and the allocation vectors |
| `bdoscon.asm` | the errors and the console's output |

In the ROM of Chapter 13 the BDOS runs from `BDOSBAS`, `E703h`, to `F608h`,
3,846 bytes. Its function table and its four error messages are in the ROM's
data block (`src/tables.asm:86-94`, `src/text.asm:67-73`). None of it can be
patched.

Everything the BDOS changes is in RAM, in the block from `BDOSRAM` to
`BDOSRME`, `BE76h` to `BEFFh` (`src/ram.asm:213-292`). Its 54-byte stack is at
the top of the block (`src/layout.asm:128`). Warm boot clears the block, as a
fresh load of the BDOS from disk would leave it, and sets the DMA address to
`0080h` (`src/boot.asm:499-526`). Two of the BDOS's variables are outside the
block because a warm boot must not clear them. `LOGINV`, in the BIOS's part of
the workspace, has a bit for each drive whose allocation vector the BDOS has
built (`src/ram.asm:55-56`). `PRGCODE`, the return code of function 108, is above
the RAM BIOS table, where only cold boot clears it (`src/ram.asm:357`,
`src/boot.asm:73-79`). What the BDOS keeps for each drive is in the drive's DPH,
the 16-byte disk parameter header that Chapter 17 describes.

The BDOS reaches the BIOS through the RAM BIOS table at `BF00h`. Its names for
the entries are offsets from `RAMBIOS` (`src/cpm/bdos.asm:16-37`). A program
that replaces an entry there therefore receives the BDOS's own calls, as
Chapter 16 describes. The one exception is the check for `^S` before each
character the BDOS prints. That check calls the ROM's `BCONST` directly,
because the table's `CONST` draws the video cursor while no key is waiting
(`src/cpm/bdoscon.asm:145-151`, `src/console.asm:198-217`).

## The entry

The jump at `0005h` leads to `JP BENTRY`, which cold boot puts directly below
the allocation vectors, as Chapter 14 describes. With a service loaded the same
jump is at the start of the lowest service's page (`src/boot.asm:749-754`,
`src/boot.asm:392-410`, `src/loader.asm:393-398`).

`BENTRY` saves the caller's stack pointer in `OLDSP`, moves to the BDOS's own
stack and keeps `DE` in `PARAM` (`src/cpm/bdos.asm:133-138`). Every function and
every BIOS call it makes runs on that stack. The caller's stack holds only the
return address of its `CALL`. `BENTRY` then tests for seven numbers above 40
that have the meanings CP/M 3 gave them: 44, 45, 46, 47, 48, 99 and 108
(`src/cpm/bdos.asm:139-157`). Appendix A lists them. Chapter 21 describes 47 and
108, and the section on errors below describes function 45, the error mode. Any
other number above 40 returns 0 at once (`src/cpm/bdos.asm:158-161`).

A function from 0 to 40 has a routine in `FNTAB`, a table of 41 words
(`src/tables.asm:86-93`, `src/cpm/bdos.asm:162-172`). Functions 38 and 39, which
CP/M 2.2 leaves undefined, return 0.

Some functions take an FCB, a file control block, and work on the drive its
first byte names. That drive is selected before the routine runs. `FCBMAP`
has a bit for each function, set for 15, 16, 17, 19 to 23, 30, 33 to 35 and 40
(`src/tables.asm:94`, `src/cpm/bdos.asm:174-199`). For those `BENTRY` calls
`FCBSEL`, which reads the FCB's first byte: 0 for the default drive and 1 to 16
for A to P (`src/cpm/bdosfile.asm:187-221`). A `?` is allowed only for
function 17, where it selects every entry of the default drive's directory. In
any other function it is the `Select` error.

The selection, `SELDRV`, rejects a drive of 16 or more
(`src/cpm/bdosfile.asm:161-185`). It calls `LOGIN` unless the drive is the one
already bound and still logged in. An FCB can name a drive other than the
current one, so the BDOS keeps two. `CURDRV` is the bound drive, the one the
function in hand works on. `DEFDRV` is the default drive, the one the prompt
shows, and only function 14 and the disk reset change it
(`src/cpm/bdosfile.asm:149-159`). The FCB's drive byte is read and never
rewritten.

The routine runs with `DE` restored from `PARAM` and ends at one of three
exits (`src/cpm/bdos.asm:201-205`, `src/cpm/bdos.asm:220-242`). `RETZERO`
returns 0, `RETA` the byte in `A` and `RETWORD` the word in `HL`. All three put
the result in `HL`, with its low byte in `A` and its high byte in `B`, as CP/M
2.2 does. They then restore the caller's stack pointer and return, and no other
register is kept.

## The console functions

The BDOS tests for `^S` while it prints, and the test takes any key typed off
the console. The console functions therefore keep one character in reserve.
`PENDING` is set while `PENDCHR` holds a character the BIOS has delivered and
no program has read (`src/ram.asm:222-225`). `GETCHAR` returns that character
if there is one and otherwise calls `CONIN` (`src/cpm/bdoscon.asm:116-125`). The
status routines report a character waiting while `PENDING` is set
(`src/cpm/bdoscon.asm:132-151`).

The reserve is filled during output. Every character of functions 2 and 9
goes through `OUTCHAR`, which expands a tab to spaces up to the next multiple
of 8 (`src/cpm/bdoscon.asm:160-185`). Before each character `CHKKEY` tests the
console's status and reads any key waiting (`src/cpm/bdoscon.asm:293-321`). A
`^S` stops the output until the next key, which is read too. A `^C` there ends
the program by warm boot through `CHDROP`, as in CP/M 2.2, and any other key
after a `^S` is discarded. A `^P` turns the copy of the console's output to
the list device on or off. Any other key goes into `PENDCHR`, to be the next
character the program reads, so a key typed while a program prints is kept.

`ECHORAW` sends each character to `CONOUT`, and to `LIST` while the `^P` copy
is on (`src/cpm/bdoscon.asm:208-242`). Before either call `ECHOCOL` moves
`COLUMN`, the console column that the tabs need, so nothing reads `C` after
a BIOS call. A `CONOUT` or `LIST` put in the RAM BIOS table need not keep it.

Function 1 reads a character with `GETCHAR` and echoes it, a control character
too (`src/cpm/bdos.asm:304-313`). Function 6 is direct console I/O. With
`E` = `FFh` it returns a waiting character without echo, or 0 if none is
waiting. With any other `E` it sends `E` straight to `CONOUT`: no tab is expanded, no
key is taken, nothing goes to the list device and the column stays as it was
(`src/cpm/bdos.asm:354-374`). Function 11 returns 1 when a character is waiting
and 0 otherwise. A character the BIOS has is read at once into `PENDCHR`, and
the next function 1 or 6 returns it (`src/cpm/bdos.asm:719-737`).

Function 10 reads a line into a buffer whose first byte gives its maximum
length, 1 to 255. It returns the count in the second byte, with the characters
after it (`src/cpm/bdos.asm:427-713`). The line ends at a CR or LF, which is
echoed and not stored, or when the buffer is full. The editing keys are CP/M
2.2's (`src/cpm/bdos.asm:443-473`):

- Backspace, `08h`, removes the last character and erases it on the screen
  with backspace, space, backspace (`src/cpm/bdos.asm:526-540`,
  `src/cpm/bdoscon.asm:336-344`).
- Delete, `7Fh`, removes the last character and echoes it, as a printing
  terminal shows a rubout (`src/cpm/bdos.asm:546-561`).
- `^U` prints `#`, starts a new line and empties the buffer. `^R` prints `#`
  and types the line again on a new line. `^X` erases the line on the screen
  and empties the buffer (`src/cpm/bdos.asm:596-680`).
- `^E` starts a new line on the screen and leaves the buffer as it is
  (`src/cpm/bdos.asm:586-592`).
- `^P` turns the list device's copy on or off (`src/cpm/bdos.asm:504-506`).
- `^C` as the first character of the line prints `^C` and ends the program by
  warm boot. Later in the line it is passed over (`src/cpm/bdos.asm:568-581`).

At the prompt a `^U` partway through `TYPE X` starts the line again, and a
`^R` after `DIR *.CMD` types the line out once more before Return sends it:

<!-- node tools/capture.mjs $'TYPE X\x15DIR *.CMD' $'DIR *.CMD\x12' -->
```text
A>TYPE X#
DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>DIR *.CMD#
DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

Two more keys belong to the CCP alone. `^W` and `^N` recall lines from the
command history while `HFLAG` is set, which the CCP does immediately before its
own call of function 10. For a program's call they are characters like any
other (`src/cpm/bdos.asm:513-521`). The line the CCP reads is stored in the
history when it ends (`src/cpm/bdos.asm:703-713`). Chapter 22 describes the
history.

Function 9 prints from `DE` up to a `$` through `OUTCHAR`
(`src/cpm/bdos.asm:393-407`). Functions 3, 4 and 5 pass a byte to or from the
BIOS's `READER`, `PUNCH` and `LIST`. Functions 7 and 8 read and write the
IOBYTE at `0003h` (`src/cpm/bdos.asm:327-387`).

## Files, extents and records

A CP/M file is a sequence of 128-byte records. The BDOS finds them through the
directory, a table of 32-byte entries at the start of the volume. Each entry
names a file in a user area and holds a map of allocation block numbers, the
blocks of the volume that hold the file's records. In this chapter *block*
alone means an allocation block, and a *card block* is 512 bytes of the card,
as in Chapter 17. A program names a file in an FCB of 36 bytes. The BDOS fills
the FCB from the entry and keeps it up to date as the program reads and
writes:

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

A directory entry has the same first 32 bytes, with the user number in place of
the drive. The map holds 16 one-byte block numbers on a volume of 256 blocks or
fewer and 8 two-byte numbers otherwise. `FCBLOCK` and `BLOCKIDX` test the high
byte of the volume's last block number, `DSM`, to choose
(`src/cpm/bdosrec.asm:528-549`, `src/cpm/bdosrec.asm:612-633`). Both of TEC-OS's
geometries have more than 256 blocks, so every map on a TEC-OS card holds eight
two-byte numbers.

An extent is 128 records, 16 KiB, and one entry holds as many extents as its
map has room for. The disk parameter block, the DPB, gives the numbers the
arithmetic needs (`format/format.json:47-59`):

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

A G1M block is 2 KiB, so an entry's eight blocks hold 16 KiB, one extent. A
G8M block is 4 KiB, so an entry holds 32 KiB, two extents, and `EXM` is 1.

To read or write a record the BDOS needs the record's place on the volume.
`FCBADDR` takes the extent's place within its entry, `EX` AND `EXM`, times
128, adds `CR` and shifts the sum right by `BSH`. The result is the index of
the record's block in the map (`src/cpm/bdosrec.asm:581-610`). `POSREC` then
turns the block and record into a record number on the volume: the block
shifted left by `BSH`, plus `CR` AND `BLM` (`src/cpm/bdosrec.asm:817-849`). The
BIOS takes a track and a sector, so `POSREC` divides that number by `SPT`. The
division is `DIV16`, 16 steps of shift and trial subtraction. The quotient goes
to the BIOS through `SETTRK` and the remainder through `SECTRAN` and `SETSEC`
(`src/cpm/bdosrec.asm:852-918`). The BIOS's `MAPREC` turns track and sector back
into a record number, as Chapter 17 describes. From that it takes `BLKOFF`, the
card block within the volume, and `BLKSLOT`, the record's quarter of it.

Take record 37 of extent 0 of a file on drive A, a G1M volume, whose third map
cell holds block 300. `FCBADDR` gives 0 × 128 + 37 = 37, and 37 shifted right
by 4 is 2, the third cell. `POSREC` shifts 300 left by 4 to get 4,800 and adds
37 AND 15, which is 5. The record is 4,805 of the volume, and 4,805 divided by
64 is track 75, sector 5. `MAPREC` makes 75 × 64 + 5 = 4,805 again. `BLKOFF` is
4,805 divided by 4, card block 1,201 of the volume, and `BLKSLOT` is the
remainder, 1. The card block is the volume's start block plus 1,201.

`POSREC` checks the block number first. `CHKBLK` compares it with `DSM`, and a
number past the end of the volume is the `Bad Sector` error
(`src/cpm/bdosrec.asm:818-819`, `src/cpm/bdoscon.asm:75-93`). Only a damaged
directory holds such a number.

Every function that names a file works through one search routine, `FINDENT`,
which `NEWSRCH` starts from the first entry with a mode in `OPENMOD`
(`src/cpm/bdosfn.asm:431-557`). It reads the directory a record at a time, four
entries, into the DPH's directory buffer, and `MATCHFCB` compares each entry
with the FCB (`src/cpm/bdosfn.asm:674-779`). An entry matches when its user
number is the current one and its name and type match the FCB's. Bit 7 of each
byte is left out so that the attributes don't count, and a `?` in the FCB
matches any character. In every mode but 2 the extent and `S2` must match as
well, unless the FCB's extent is `?`. The extent is compared outside the bits
`EXM` covers, since one entry holds `EXM` + 1 extents
(`src/cpm/bdosfn.asm:724-766`). The modes are:

| Mode | Used by | Matches |
| ---: | --- | --- |
| 0 | functions 17 and 18 | name and extent; the record goes to the DMA address |
| 1 | open, and the move to the next extent | name and extent; the entry's fields go into the FCB |
| 2 | delete, rename, set attributes, file size | name, any extent |
| 3 | make | an empty entry, `E5h` in its first byte |
| 4 | close | name and extent, nothing copied |
| 5 | function 17 with `?` in the drive byte | every entry |

On a volume with few files most of the directory is unused. A search therefore
stops at the drive's directory mark, `DIRUSED`, the count of entries up to the
last one in use (`src/cpm/bdosfn.asm:474-494`). Modes 3 and 5 are the
exceptions and go to the end of the directory. The starter card's drive B has
512 entries, 32 card blocks of them. With no files on it a search there reads
no block at all. `MAKEFCB`
raises the mark when it takes an entry beyond it
(`src/cpm/bdosfile.asm:577-587`). The mark also sets how much of the directory
a warm boot reads, as the scan at warm boot shows below.

## One file's life

A program that writes a new file makes it, writes its records, closes it and
later opens and reads it. Each step is one BDOS function, and together they
show what the directory and the FCB go through.

Function 22, make, searches in mode 3 for the first empty entry. It fills the
entry with the FCB's name, the current user number and an empty map, and
writes the entry's directory record at once (`src/cpm/bdosfile.asm:493-593`).
As in CP/M 2.2 it clears `S2` and keeps `EX`, so the entry is the extent `EX`
names among the file's first 32. It clears `S1`, `RC` and the map in the FCB
too (`src/cpm/bdosfile.asm:482-503`, `src/cpm/bdosfile.asm:536-553`). Every
directory write goes to the BIOS as write type 1 (`src/cpm/bdoslog.asm:84-92`).
On the volume written behind, that is the write that flushes the data lines
before it, as Chapter 18 describes.

A file that was only read has nothing to write back at its close. Make and
open therefore set bit 7 of `S2` (`src/cpm/bdosfile.asm:569-575`,
`src/cpm/bdosfn.asm:623-630`). `ADVWRITE` clears the bit at each write that
succeeds (`src/cpm/bdosrec.asm:167-196`). `ALLOCBLK` clears it as soon as it
puts a new block in the map (`src/cpm/bdosrec.asm:688-720`).

Function 21 writes the record at `CR` (`src/cpm/bdosrec.asm:23-95`). If the map
has no block for the record, `ALLOCBLK` takes the first free block of the
drive. The record then goes to the BIOS as write type 2, the first write to a
new block (`src/cpm/bdosrec.asm:49-68`). For that type the BIOS clears the
block's cache line instead of reading it, as Chapter 17 describes. Any other
write of a record is type 0. `CR` moves on only after the BIOS has returned success, so
a write that fails leaves the FCB on the record it didn't write
(`src/cpm/bdosrec.asm:75-95`).

The write after record 127 finds `CR` at 128. It closes the extent, then opens
the next extent or makes it (`src/cpm/bdosrec.asm:24-36`,
`src/cpm/bdosrec.asm:97-149`). The write returns 2 when the drive has no free
block. It returns 1 when the next extent needs a directory entry and the
directory is full. The FCB then stays on its extent with `CR` at 128, so a
write after an entry is freed makes the extent it needs
(`src/cpm/bdosrec.asm:97-165`). It returns 1 in the same way when the close of
the extent it leaves finds no entry for it (`src/cpm/bdosrec.asm:111-118`). That
is the case after the file was deleted under the open FCB.

Function 16, close, returns at once when bit 7 of `S2` is still set, with
nothing written (`src/cpm/bdosfile.asm:255-263`). On a read-only drive it also
returns success with nothing written (`src/cpm/bdosfile.asm:274-279`).
Otherwise it searches in mode 4 for the entry again and copies the FCB's
extent, record count and map into it, or only the map when the FCB is on an
earlier extent than the entry records. It then writes the directory record
back (`src/cpm/bdosfile.asm:274-320`). On the volume written behind that
directory write is what puts the file's data on the card.

Function 15, open, searches in mode 1 and copies bytes 1 to 31 of the entry
into the FCB (`src/cpm/bdosfn.asm:573-633`). A `?` in the FCB's name becomes
the entry's character. The FCB keeps its own extent. The entry's `RC` is
the count of its highest extent. In a G8M file whose entry holds two extents,
an FCB naming the earlier extent gets 128 records and one naming a later, empty
extent gets 0.

Function 20 reads the record at `CR` into the DMA address and moves `CR` on
(`src/cpm/bdosrec.asm:214-281`). At `CR` = 128 it closes the FCB, opens the
next extent and starts it at record 0. It returns 1, end of file, in three cases: no next
extent, `CR` at `RC`, or a record whose block is 0.

Function 19, delete, marks each matching entry empty, `E5h`, writes its directory
record and only then frees its blocks (`src/cpm/bdosfile.asm:432-479`). The
random functions 33, 34 and 40, the size and rename functions and the
attributes work on the same entries and FCBs. Appendix A gives each with its
return codes.

## The allocation vectors and the scan at warm boot

The BDOS has to find a free block for each write without reading the whole
directory. Each drive therefore has an allocation vector, one bit for each
block of the volume, set while the block is in use. Chapter 14 describes where
cold boot places the vectors. The DPH holds the vector's address and `LOGIN` copies it
into `ALVPTR` (`src/cpm/bdoslog.asm:220-224`).

`ALLOCBLK` scans the vector from block 0 for the first clear bit, sets it and
puts the block's number in the FCB's map (`src/cpm/bdosrec.asm:644-726`). A
delete clears the bits of each block the entry lists
(`src/cpm/bdoslog.asm:576-651`). The directory's own blocks are set from `AL0`
and `AL1` when the vector is built (`src/cpm/bdoslog.asm:456-482`), and they
are never given out. The vector changes as soon as a block is taken, before the
file is closed. A block a program has written but not yet closed is therefore
already in use for every other file. `ALLOCBLK` also marks the FCB as changed
(`src/cpm/bdosrec.asm:688-720`). A close after a failed write therefore still
writes the entry that holds the block, and no block stays in use with no entry
holding it.

A vector is built when a drive is logged in, the first time it is selected
after a disk reset (`src/cpm/bdoslog.asm:174-316`). `LOGIN` calls the BIOS's
`SELDSK` for the drive's DPH, and a drive with no volume gets 0, which is the
`Select` error (`src/cpm/bdoslog.asm:184-194`). It copies from the DPH the
addresses of the translation table, the directory buffer, the DPB and the
vector. A volume the card marks read-only then goes into the read-only vector
(`src/cpm/bdoslog.asm:226-236`). For a drive not in `LOGINV`, `INITALV` clears
the vector and sets the directory's bits, and the drive's bit in `LOGINV` is
set. The whole directory is then read a record at a time. `PARENT` sets the bit
of every block that each entry in use lists and moves the mark past the entry
(`src/cpm/bdoslog.asm:237-316`, `src/cpm/bdoslog.asm:489-569`). A block number
past the end of the volume has no bit, and `BITPTR` passes over it
(`src/cpm/bdoslog.asm:664-672`). The drive still logs in, and a delete of that
file passes over the number too. For a drive already in `LOGINV`, `LOGIN` reads
nothing: `LOGFAST` takes the drive's mark from its DPH
(`src/cpm/bdoslog.asm:328-348`).

The DPH has three words for the BDOS's own use, at offsets 2, 4 and 6.
`MNDPH` clears them when it builds the DPH (`src/vol.asm:694-700`). TEC-OS's
BDOS keeps in them what the scan at warm boot needs:

| Offset | Contents | Written by |
| ---: | --- | --- |
| 2 | the sum of the vector's bytes at the end of the last scan | `LOGDONE` (`src/cpm/bdoslog.asm:356-374`) |
| 4 | the changed flag: 1 once the vector may differ from the directory | `ALFOUND` (`src/cpm/bdosrec.asm:693-698`) and BIOS `WRITE` of a directory card block (`src/bios.asm:292-320`) set it, and `LOGDONE` clears it |
| 6 | the directory mark, `DIRUSED` | `DUSAVE` (`src/cpm/bdoslog.asm:376-400`), BIOS `WRITE` of a directory card block (`src/bios.asm:321-349`) |

The BIOS's part is in its `WRITE`, which tests whether the card block being
written is one of the directory's. For such a block it sets the changed flag
and raises the mark to the end of that block's 16 entries
(`src/bios.asm:292-349`). It does that for every write, so a program's own
directory write through BIOS `WRITE` sets the flag and raises the mark as well.
`DUSAVE` writes the BDOS's mark only when it is higher than the one there, so
the higher of the two stands.

CP/M 2.2's CCP resets the disk system at every warm boot. Every drive is then
logged in again, and its directory read, at its next selection. On a G8M
volume that is 32 card blocks, and Chapter 15 gives the times. TEC-OS's CCP
makes the same call, function 13, but sets `WRFLAG` first
(`src/cpm/ccp.asm:80-86`). With the flag set function 13 goes to `WRESET`
(`src/cpm/bdosfile.asm:19-27`).

`WRESET` goes through drives 0 to 15 and passes over each one that is not in
`LOGINV` (`src/cpm/bdosfile.asm:70-127`). For a logged-in drive it calls
`LOGIN`, which binds the drive's pointers and reads nothing. It then tests the
drive's DPH:

- If the changed flag is set, the drive is taken out of `LOGINV` and put in
  `WARMV`, the vector of drives to rebuild to their mark (`src/ram.asm:240-241`).
  At its next selection `LOGIN` builds the vector again, but reads the
  directory only up to the mark (`src/cpm/bdoslog.asm:268-288`). Every entry
  beyond the mark is empty, and an empty entry holds no block.
- If the flag is clear, `ALVSUM` adds up the vector's bytes with `SUMDE`, the
  routine that also sums the container's table
  (`src/cpm/bdoslog.asm:406-414`, `src/cpm/bdoslog.asm:431-450`,
  `src/volutil.asm:112-133`). If the sum is what `LOGDONE` stored, the drive
  stays logged in with its vector as it is. Any other sum means a change that
  neither an allocation nor a directory write recorded, such as a stray write
  by a program. The drive is then taken out of `LOGINV` and scanned in full at
  its next selection.

After the loop `WRESET` joins the ordinary reset at `RSTAIL`
(`src/cpm/bdosfile.asm:35-51`). `RSTAIL` clears the read-only vector, selects
drive A, sets the DMA address to `0080h` and logs drive A in. At the end of
each full or partial scan `LOGDONE` saves the mark and stores the new sum
(`src/cpm/bdoslog.asm:356-374`). It also clears the changed flag and the
drive's bit in `WARMV`. A warm boot after a program that wrote nothing
therefore reads no card block. One after a program that changed drive A reads
A's directory only as far as its last entry in use.

A program's own call of function 13 finds `WRFLAG` clear and empties `LOGINV`
and `WARMV` (`src/cpm/bdosfile.asm:28-33`). Every drive is then scanned in full
at its next selection, as in CP/M 2.2. Function 37 takes the drives named by
the bits of `DE` out of `LOGINV`, the read-only vector and `WARMV`
(`src/cpm/bdosfn.asm:402-418`). The volume services `MOUNT` and `UNMNT` call it
for a drive whose volume they have changed (`src/volsvc.asm:320-342`). A `MOUNT`
onto the default drive then selects the drive again with function 14, which
logs the new volume in (`src/volsvc.asm:351-371`). Functions 27 and 31 answer for
that volume at once.

## BDOS errors and the error mode

The BDOS has four errors, each printed after `Bdos Err On` and the drive's
letter (`src/text.asm:67-73`):

- `Select`, code 4, for a drive past D, a drive with no volume or a `?` drive
  byte outside function 17 (`src/cpm/bdoslog.asm:818-821`).
- `R/O`, code 2, for a change to a drive that function 28 has made read-only
  or to a volume the card marks read-only (`src/cpm/bdoslog.asm:797-813`).
- `File R/O`, code 3, for function 19 or 23 on an entry with the read-only
  attribute, and for function 21, 34 or 40 through an FCB that has it
  (`src/cpm/bdosfile.asm:403-418`).
- `Bad Sector`, code 1, for a BIOS `READ` or `WRITE` that fails, a directory
  record that won't read or write, and a block number past the end of the
  volume (`src/cpm/bdosrec.asm:269-270`, `src/cpm/bdoscon.asm:30-32`).

Each goes to `BDERR` with its message and code. What `BDERR` does is set by the
error mode, which function 45 puts in `ERRMODE` (`src/cpm/bdos.asm:250-264`,
`src/cpm/bdoscon.asm:45-66`). In the default mode `DISKMSG` prints the message
and `BDERR` waits for a key with `GETCHAR` (`src/cpm/bdoscon.asm:99-125`). A key
typed during the output is the key it takes. `CHDROP` then ends the program by
warm boot, whatever the key, so the function never returns to the program
(`src/cpm/bdos.asm:112-116`). `CHDROP` also drops the rest of a chained line,
which Chapter 21 describes.

With `ERRMODE` at `FFh` the error returns to the program with `A` = `FFh` and
the error's code in `H`. Nothing is printed and the rest of a chained line is
kept. With `FEh` the message is printed first and the error returns in the
same way. Warm boot clears `ERRMODE` with the rest of the BDOS's state, so each
program starts in the default mode (`src/ram.asm:215-217`). A read or write
that returns an error leaves the FCB on the record it didn't read or write, as
CP/M 3's does (`src/cpm/bdosrec.asm:75-95`, `src/cpm/bdosrec.asm:264-275`).

Chapter 3 shows `R/O` from a read-only volume and `File R/O` from `ERA`. The
volume's read-only flag is in the drive table. `LOGIN` sets the drive's bit in
the read-only vector from it (`src/cpm/bdoslog.asm:226-236`), so the BDOS
rejects the change before any write reaches the card. A warm boot clears the
vector, and the drive's next selection sets the bit again.

## Differences from Digital Research's BDOS

TEC-OS's BDOS has the interface of CP/M 2.2, and function 12 returns `22h`
(`src/cpm/bdos.asm:741-744`). It differs from the BDOS that Digital Research
shipped in these ways:

- It is in ROM (`src/rom.asm:34-39`). A write to the BDOS's code changes
  nothing, and a hook goes in the RAM BIOS table.
- Functions 44, 45, 46, 47, 48, 99 and 108 have meanings that come from
  CP/M 3, and every other function above 40 returns 0.
- The CCP's disk reset at warm boot keeps each drive whose vector is
  unchanged and rebuilds a changed one from its directory up to the mark. A
  program's function 13 resets every drive, as in CP/M 2.2.
- A `^P` typed while the BDOS prints turns the list device's copy on or off
  (`src/cpm/bdoscon.asm:312-314`). Digital Research's keeps such a key for the
  next read and takes `^P` only in line input.
- Function 1 echoes every character, control characters too. Digital
  Research's echoes only printing characters, CR, LF, tab and backspace.
- Function 10 called by the CCP takes `^W` and `^N` as the history's keys.
  Called by a program it is CP/M 2.2's.
- The check vector is unused, since `CKS` is 0 in both geometries
  (`format/format.json:52`, `format/format.json:59`). With no check vector, a card
  changed while TEC-OS runs is not detected.
