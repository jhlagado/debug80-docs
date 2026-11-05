---
title: A. BDOS functions
parent: TEC-OS
nav_order: 101
nav_group: "Appendices"
---

# Appendix A. BDOS functions

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

This appendix lists the BDOS functions of TEC-OS in number order: 0 to 40,
then 44 to 48, 99 and 108, whose meanings come from CP/M 3. The table gives
each function's registers at a glance. The entries after it give, in a fixed
order, what the function does, what it returns, the errors it can give and
where it differs from CP/M 2.2. Chapter 19 explains the mechanism behind them.

| `C` | Name | In | Out |
| ---: | --- | --- | --- |
| 0 | System reset | | does not return |
| 1 | Console input | | `A` = character |
| 2 | Console output | `E` = character | |
| 3 | Reader input | | `A` = byte |
| 4 | Punch output | `E` = byte | |
| 5 | List output | `E` = byte | |
| 6 | Direct console I/O | `E` = `FFh` or character | `A` = character or 0 |
| 7 | Get IOBYTE | | `A` = IOBYTE |
| 8 | Set IOBYTE | `E` = IOBYTE | |
| 9 | Print string | `DE` → string ending `$` | |
| 10 | Read console buffer | `DE` → buffer | the line in the buffer |
| 11 | Get console status | | `A` = 1 or 0 |
| 12 | Return version number | | `HL` = `0022h` |
| 13 | Reset disk system | | `A` = 0 |
| 14 | Select disk | `E` = drive | |
| 15 | Open file | `DE` → FCB | `A` = directory code |
| 16 | Close file | `DE` → FCB | `A` = directory code |
| 17 | Search for first | `DE` → FCB | `A` = directory code |
| 18 | Search for next | | `A` = directory code |
| 19 | Delete file | `DE` → FCB | `A` = 0 or `FFh` |
| 20 | Read sequential | `DE` → FCB | `A` = 0 or 1 |
| 21 | Write sequential | `DE` → FCB | `A` = 0, 1 or 2 |
| 22 | Make file | `DE` → FCB | `A` = directory code |
| 23 | Rename file | `DE` → FCB | `A` = 0 or `FFh` |
| 24 | Return login vector | | `HL` = vector |
| 25 | Return current disk | | `A` = drive |
| 26 | Set DMA address | `DE` = address | |
| 27 | Get allocation vector address | | `HL` = address |
| 28 | Write protect disk | | |
| 29 | Get read-only vector | | `HL` = vector |
| 30 | Set file attributes | `DE` → FCB | `A` = 0 or `FFh` |
| 31 | Get disk parameter block address | | `HL` = address |
| 32 | Set or get user code | `E` = `FFh` or user | `A` = user or 0 |
| 33 | Read random | `DE` → FCB | `A` = 0, 1, 3, 4 or 6 |
| 34 | Write random | `DE` → FCB | `A` = 0, 2, 3, 5 or 6 |
| 35 | Compute file size | `DE` → FCB | `R0` to `R2` in the FCB |
| 36 | Set random record | `DE` → FCB | `R0` to `R2` in the FCB |
| 37 | Reset drive | `DE` = drives | `A` = 0 |
| 38 | Access drive | | `A` = 0 |
| 39 | Free drive | | `A` = 0 |
| 40 | Write random with zero fill | `DE` → FCB | as function 34 |
| 44 | Set multi-sector count | `E` = count | `A` = 0 or `FFh` |
| 45 | Set BDOS error mode | `E` = mode | `A` = 0 |
| 46 | Get disk free space | `E` = drive | 3 bytes at the DMA address |
| 47 | Chain to program | command at the DMA address | does not return, or `A` = `FFh` |
| 48 | Flush buffers | | `A` = 0 or `FFh` |
| 99 | Truncate file | | `A` = `FFh` |
| 108 | Get or set program return code | `DE` = `FFFFh` or code | `HL` = code or 0 |

## Calling a function

A program loads the function's number into `C` and its argument into `E` or
`DE` and calls `0005h`. The BDOS returns its result in `HL`, with the low byte
in `A` as well and the high byte in `B` (`src/cpm/bdos.asm:220-242`). A
function that returns a byte has 0 in `H` and `B`. One that returns nothing
returns 0. No other register is kept, as in CP/M 2.2. The call uses two bytes
of the program's stack, for its return address: the BDOS runs on its own
54-byte stack (`src/cpm/bdos.asm:133-138`, `src/layout.asm:128`).

A function that takes an FCB, a 36-byte file control block whose layout
Chapter 19 gives, works on the drive in its first byte: 0 for the default
drive, 1 to 16 for A to P. The BDOS selects that drive before the function
runs, for functions 15, 16, 17, 19 to 23, 30, 33 to 35 and 40
(`src/tables.asm:94`, `src/cpm/bdos.asm:174-199`). A `?` in the drive byte is
allowed only for function 17.

The file functions return a directory code in `A` where CP/M 2.2 does: 0 to 3,
the place in the 128-byte directory record of the entry found, or `FFh` for
none.

## The errors

A function that can't be carried out at all gives one of four errors. In the
default error mode the BDOS prints the error and waits for a key, or takes the
key already kept if one was typed during output. It then ends the program by
warm boot, whatever the key, and does not return. Function 45 can set a mode
in which the function returns instead, with `A` = `FFh` and the error's code in
`H` (`src/cpm/bdoscon.asm:30-66`). The errors, by code:

| Code | Message | Given for |
| ---: | --- | --- |
| 1 | `Bdos Err On d: Bad Sector` | A record or a directory record that can't be read or written, or an allocation block number past the end of the volume in a read or a write (`src/cpm/bdosrec.asm:818-819`, `src/cpm/bdosrec.asm:269-270`, `src/cpm/bdoscon.asm:30-32`, `src/cpm/bdoscon.asm:75-80`) |
| 2 | `Bdos Err On d: R/O` | A change by function 19, 21, 22, 23, 30, 34 or 40 to a drive that function 28 has made read-only or to a volume the card marks read-only (`src/cpm/bdoslog.asm:797-813`) |
| 3 | `Bdos Err On d: File R/O` | Function 19 or 23 on a directory entry whose read-only attribute is set, or function 21, 34 or 40 through an FCB that has it (`src/cpm/bdosfile.asm:403-418`) |
| 4 | `Bdos Err On d: Select` | A drive with no volume, a drive past D, or a `?` drive byte outside function 17 (`src/cpm/bdoslog.asm:818-821`) |

Appendix D gives each error's remedy.

## The functions

**0 System reset.** Ends the program by warm boot, through the RAM BIOS
table's warm boot entry (`src/cpm/bdos.asm:246-248`). Does not return.

**1 Console input.** Waits for a character and echoes it to the console. A
character kept from an earlier status call or typed during output comes first
(`src/cpm/bdos.asm:304-313`). Returns the character in `A`. Every character is
echoed, control characters too. CP/M 2.2 echoes only printing characters, CR,
LF, tab and backspace.

**2 Console output.** Prints the character in `E`. A tab becomes spaces to the
next multiple of 8 columns. Before each character the BDOS checks for a key.
`^S` stops the output until the next key. A `^C` then ends the program by warm
boot, and any other key resumes the output and is discarded. `^P` turns the
copy of the output to the list device on or off. Any other key is kept for the
next input call (`src/cpm/bdos.asm:319-323`, `src/cpm/bdoscon.asm:160-185`,
`src/cpm/bdoscon.asm:293-329`). Returns nothing. The `^C` after `^S` ends the
program in CP/M 2.2 too.

**3 Reader input.** Waits for a byte from the reader device, the serial port
(`src/cpm/bdos.asm:327-330`). Returns it in `A`.

**4 Punch output.** Sends the byte in `E` to the punch device, the serial port
(`src/cpm/bdos.asm:334-339`). Returns nothing.

**5 List output.** Sends the byte in `E` to the list device, which discards it
(`src/cpm/bdos.asm:343-348`). Returns nothing.

**6 Direct console I/O.** With `E` = `FFh`, reads a waiting character without
echo. With any other `E`, sends `E` to the console, with no tab expansion, no
`^S` check and no copy to the list device (`src/cpm/bdos.asm:354-374`).
Returns the character in `A`, or 0 if none is waiting. The values `FEh` and
`FDh`, which CP/M 3 gives a meaning of their own, are sent as characters.

**7 Get IOBYTE.** Reads the byte at `0003h` (`src/cpm/bdos.asm:378-380`).
Returns it in `A`.

**8 Set IOBYTE.** Writes `E` to `0003h` (`src/cpm/bdos.asm:384-387`). Returns
nothing. TEC-OS acts only on the IOBYTE's console field.

**9 Print string.** Prints the characters from `DE` up to a `$`, which is not
printed, as function 2 prints each (`src/cpm/bdos.asm:393-407`). Returns
nothing.

**10 Read console buffer.** Reads a line into the buffer at `DE`. The buffer's
first byte is the maximum number of characters it takes. Return or LF ends the
line, and so does the last character the buffer takes. The editing keys are
backspace, Delete, `^U`, `^R`, `^X`, `^E`, `^P` and `^C` as the line's first
key, as Chapter 19 describes. When the CCP calls it for the prompt, `^W` and
`^N` recall lines from the command history. For a program they are characters
(`src/cpm/bdos.asm:427-713`, `src/cpm/bdos.asm:513-521`). Returns the number
read in the buffer's second byte, with the characters from the third on.

**11 Get console status.** Tests for a waiting character. A character the BIOS
has is read and kept for the next input call (`src/cpm/bdos.asm:719-737`).
Returns 1 in `A` if a character is waiting and 0 if not.

**12 Return version number.** Returns `0022h` in `HL`: CP/M 2.2
(`src/cpm/bdos.asm:741-744`).

**13 Reset disk system.** Logs out every drive, clears the read-only vector,
selects drive A and sets the DMA address to `0080h`. Drive A is logged in again
(`src/cpm/bdosfile.asm:19-51`). Returns 0. The user number stays as it is, as in
CP/M 2.2. The CCP's call at each warm boot sets a flag first, and then the
drives whose allocation vectors are unchanged stay logged in
(`src/cpm/bdosfile.asm:70-127`).

**14 Select disk.** Makes the drive in `E`, 0 to 15 for A to P, the default
drive, logging it in if it is not (`src/cpm/bdosfile.asm:135-159`). Returns
nothing. A drive past D or with no volume gives the `Select` error.

**15 Open file.** Searches for the FCB's file and extent and copies the
directory entry into the FCB, so that `?` in the name is replaced
(`src/cpm/bdosfile.asm:223-234`, `src/cpm/bdosfn.asm:573-633`). Returns the
directory code, or `FFh` if there is no such file. The FCB's `CR` is not
changed: a program sets it to 0 before reading from the start.

**16 Close file.** Writes the FCB's extent, record count and allocation map
back to the file's directory entry. An FCB on an earlier extent than its
entry's writes back only the allocation map (`src/cpm/bdosfile.asm:240-320`,
`src/cpm/bdosfile.asm:265-273`, `src/cpm/bdosfile.asm:292-315`). Returns the
directory code, or `FFh` if the entry is not found. Returns 0 and writes
nothing when nothing has been written through the FCB since its open. On a
read-only drive it writes nothing and returns 0 for any FCB, one that was
never opened too, as CP/M 2.2's close does (`src/cpm/bdosfile.asm:255-279`).

**17 Search for first.** Searches for the first entry that matches the FCB,
with `?` matching any character, and copies the directory record that holds it
to the DMA address (`src/cpm/bdosfile.asm:350-381`). A `?` in the FCB's extent
byte matches every extent. Otherwise only the entries of that extent match. A
`?` in the drive byte matches every directory entry of the default drive, in
use or not. Returns the directory code, or `FFh` if none matches.

**18 Search for next.** Continues the last search from the entry after the one
found (`src/cpm/bdosfile.asm:390-393`). `DE` is not used. Returns the
directory code, or `FFh` if none matches.

**19 Delete file.** Erases every entry that matches the FCB, `?` allowed, and
frees its allocation blocks (`src/cpm/bdosfile.asm:432-479`). Each entry's
blocks are freed only once its directory write has returned. A write that
fails in a mode of function 45 that returns the error therefore leaves that
entry's blocks in use, as the card has them. Returns 0, or `FFh` if no file
matched. A matching file with its read-only attribute set gives the `File R/O`
error. The entries erased before it stay erased.

**20 Read sequential.** Reads the record at the FCB's `CR` into the DMA
address and moves on, to the next extent after record 127
(`src/cpm/bdosrec.asm:202-281`). Returns 0, or 1 at the end of the file.

**21 Write sequential.** Writes the record at the DMA address at the FCB's
`CR` and moves on. It takes a new allocation block or a new extent when the
record falls in one (`src/cpm/bdosrec.asm:23-196`). Returns 0 on success.
Returns 1 when the directory has no entry for a new extent, or when the close
of the extent it leaves finds no entry for it. Returns 2 when the drive is
full. After a 1 the FCB stays on its extent with `CR` at 128, so a later
write, once an entry has been freed, makes the extent the FCB needs
(`src/cpm/bdosrec.asm:97-165`). A block taken for a write that then fails
stays in the FCB's map, and the close writes it into the entry
(`src/cpm/bdosrec.asm:688-720`). An FCB with the read-only attribute set gives
the `File R/O` error (`src/cpm/bdosfile.asm:403-418`).

**22 Make file.** Creates an empty entry for the FCB's name in the current
user area, writes it to the directory and opens it
(`src/cpm/bdosfile.asm:493-593`). Does not test for a file of the same name.
Returns the directory code, or `FFh` if the directory is full. As in CP/M 2.2,
the FCB's `S2` is set to 0 and its `EX` kept, so the entry is the extent `EX`
names among the file's first 32, and `S1`, `RC` and the map are cleared
(`src/cpm/bdosfile.asm:482-503`, `src/cpm/bdosfile.asm:536-553`).

**23 Rename file.** Gives every entry of the file named in the FCB's first 16
bytes the name and type at offsets 17 to 27 (`src/cpm/bdosfile.asm:634-698`).
The second drive byte, at offset 16, is not read. Returns 0, or `FFh` if there
is no such file. An entry with its read-only attribute set gives the `File
R/O` error (`src/cpm/bdosfile.asm:673-683`).

**24 Return login vector.** Returns in `HL` a bit for each logged-in drive,
bit 0 for A (`src/cpm/bdosfn.asm:16-19`).

**25 Return current disk.** Returns the default drive in `A`, 0 for A
(`src/cpm/bdosfn.asm:26-29`).

**26 Set DMA address.** Sets the address of the 128-byte record buffer to `DE`
(`src/cpm/bdosfn.asm:40-47`). Returns nothing.

**27 Get allocation vector address.** Returns in `HL` the address of the
default drive's allocation vector (`src/cpm/bdosfn.asm:56-60`). A `MOUNT`
onto the default drive selects it again, so this is the new volume's vector at
once (`src/volsvc.asm:351-371`).

**28 Write protect disk.** Sets the default drive's bit in the read-only
vector, until the next warm boot, disk reset or function 37 for the drive
(`src/cpm/bdosfn.asm:145-158`, `src/cpm/bdosfn.asm:413-414`). Returns nothing.
A later change to the drive gives the `R/O` error.

**29 Get read-only vector.** Returns the read-only vector in `HL`, bit 0 for A
(`src/cpm/bdosfn.asm:164-167`). A volume that the card marks read-only appears
in it once its drive has been selected (`src/cpm/bdoslog.asm:226-236`).

**30 Set file attributes.** Copies the FCB's name and type, with their bit 7
attributes, into every entry of the file (`src/cpm/bdosfile.asm:619-625`,
`src/cpm/bdosfile.asm:652-698`). Bit 7 of the first type byte is the
read-only attribute and bit 7 of the second the system attribute, which `DIR`
hides. Returns 0, or `FFh` if there is no such file.

**31 Get disk parameter block address.** Returns in `HL` the address of the
default drive's DPB (`src/cpm/bdosfn.asm:173-177`). After a `MOUNT` onto that
drive it is the new volume's at once, as for function 27.

**32 Set or get user code.** With `E` = `FFh`, reads the user number. With any
other `E`, sets the user number to the low five bits of `E`, as in CP/M 2.2
(`src/cpm/bdosfn.asm:185-199`). Returns the user number in `A`, or 0 after a
set. The CCP's `USER` command takes 0 to 15, and the byte at `0004h` holds
only four bits of the number (`src/cpm/ccpcmd.asm:236-273`, `src/cpm/ccp.asm:346-367`).

**33 Read random.** Reads the record whose number is in the FCB's `R0` and
`R1` into the DMA address and leaves the FCB's extent and `CR` at that record,
so that a sequential read after it reads the same record
(`src/cpm/bdosrec.asm:289-298`, `src/cpm/bdosrec.asm:372-526`). Returns 0 on
success. Returns 1 when the record has not been written. Returns 3 when the
current extent can't be closed. Returns 4 when the extent has not been
written. Returns 6 when `R2` is not 0. After a 4 the FCB's `EX` and `S2` are
its own again, naming the extent its record count and map describe, so a
second read of that record is 4 again and a write to it makes the extent.

**34 Write random.** Writes the record at the DMA address to the record whose
number is in `R0` and `R1`. It makes the extent when the record falls in one
the file lacks (`src/cpm/bdosrec.asm:309-526`). Returns 0 on success. Returns
2 when the drive is full. Returns 3 when the current extent can't be closed.
Returns 5 when the directory has no entry for the extent. Returns 6 when `R2`
is not 0. After a 5 the FCB is back on its own extent, as after function 33's
4, so a write once an entry is freed makes the extent. An FCB with the
read-only attribute set gives the `File R/O` error.

**35 Compute file size.** Sets `R0` to `R2` to the file's size in records,
from whichever of its entries ends highest, or to 0 if there is no such file
(`src/cpm/bdosfn.asm:215-297`). Returns `FFh` in `A`.

**36 Set random record.** Sets `R0` to `R2` from the FCB's extent and `CR`,
the record the next sequential call would read or write
(`src/cpm/bdosfn.asm:299-326`). Returns 0.

**37 Reset drive.** Logs out each drive whose bit is set in `DE`, bit 0 for A,
and clears its bit in the read-only vector (`src/cpm/bdosfn.asm:402-418`). The
drive is logged in again, and its directory read, at its next selection.
Returns 0.

**38 Access drive** and **39 Free drive.** MP/M's functions, which CP/M 2.2
does not define. Both do nothing and return 0 (`src/tables.asm:93`).

**40 Write random with zero fill.** Function 34, with each allocation block the
write newly allocates filled with zeros before the record is written
(`src/cpm/bdosrec.asm:300-332`, `src/cpm/bdosrec.asm:746-806`). The BIOS's DMA
address is put back on the program's after each of the zero-fill's writes, so
a failed write that function 45 returns leaves the program's DMA address in
the BIOS. Returns as function 34 does.

**44 Set multi-sector count.** With `E` = 1 returns 0. With any other `E`
changes nothing and returns `FFh` in `A` (`src/cpm/bdos.asm:207-222`). TEC-OS
reads and writes one record a call, so 1 is the only count.

**45 Set BDOS error mode.** Sets the mode to `E` (`src/cpm/bdos.asm:250-264`).
With `E` = `FFh` a BDOS error returns to the program with `A` = `FFh` and the
error's code in `H`, prints nothing and keeps the rest of a chained line. With
`E` = `FEh` it prints the message first and then returns in the same way. Any
other `E` is the default: the message, a key and the end of the program, with
the rest of a chained line dropped (`src/cpm/bdoscon.asm:45-66`). A warm boot
puts the default back. Returns 0. A read or write that returns an error leaves
the FCB on the record it didn't read or write, as in CP/M 3
(`src/cpm/bdosrec.asm:75-95`, `src/cpm/bdosrec.asm:264-275`).

**46 Get disk free space.** Selects the drive in `E`, 0 to 15 for A to P, as
it selects an FCB's drive. It puts the drive's free space in records in the
three bytes at the DMA address, low byte first (`src/cpm/bdosfn.asm:74-138`).
The default drive stays as it was. Returns 0. A drive past D or with no volume
gives the `Select` error.

**47 Chain to program.** Replaces what is left of the CCP's command line with
the command at the DMA address, which ends with a 0 within its first 128
bytes, and ends the program by warm boot. The CCP runs the command next
(`src/cpm/bdos.asm:68-105`). The command may hold `!` and `:`. `E` is ignored.
Warm boot's flush puts the records written behind on the card before the CCP
loads the chained command. Does not return on success. Returns `FFh` in `A`
for a command with no 0 in its first 128 bytes, or with a CR or LF before the
0, and the program goes on with the line unchanged.

**48 Flush buffers.** Writes every changed line of the block cache to the card
(`src/cpm/bdos.asm:266-278`, `src/volsvc.asm:384-408`). `E` = `FFh`, CP/M 3's
purge, gives the same flush. Returns 0 in `A`, or `FFh` if a write failed and
its line was dropped.

**99 Truncate file.** Changes nothing (`src/cpm/bdos.asm:89-92`,
`src/cpm/bdos.asm:155-157`). Returns `FFh` in `A`. TEC-OS has no truncate.

**108 Get or set program return code.** With `DE` = `FFFFh`, reads the code.
With any other `DE`, sets the code to `DE` (`src/cpm/bdos.asm:284-298`). All
programs share one code. A reset clears it to 0 and a warm boot keeps it. The
CCP sets the code to 0 as it takes each command and to `FF00h` when a command
fails. A piece of a command line that starts with `:` runs only when the code
is outside `FF00h` to `FFFEh` (`src/cpm/ccp.asm:219-234`). Returns the code in
`HL`, or 0 after a set.

## Other numbers

Every other function number, from 41 to 255 except 44 to 48, 99 and 108, does
nothing and returns 0 in `A` and `HL` (`src/cpm/bdos.asm:158-161`). Function
50, CP/M 3's direct BIOS call, is one of them. A program reaches the BIOS
through its jump table, whose warm boot entry is the address at `0001h`
(`src/boot.asm:392-402`).
