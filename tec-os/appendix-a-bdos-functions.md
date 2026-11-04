---
title: A. BDOS functions
parent: TEC-OS
nav_order: 101
nav_group: "Appendices"
---

# Appendix A. BDOS functions

Checked against TEC-OS 78127ec.

This appendix lists the BDOS functions of TEC-OS in number order: 0 to 40,
then 44 to 48, 99 and 108, whose meanings come from CP/M 3. Each entry gives the
registers the function takes, what it returns and where it differs from CP/M
2.2. Chapter 16 describes the mechanism behind them.

## Calling a function

A program loads the function's number into `C` and its argument into `E` or
`DE` and calls `0005h`. The BDOS returns its result in `HL`, with the low byte
in `A` as well and the high byte in `B` (`src/cpm/bdos.asm:145-160`). A
function that returns a byte has 0 in `H` and `B`. One that returns nothing
returns 0. No other register is kept, as in CP/M 2.2. The call uses two bytes
of the program's stack, for its return address: the BDOS runs on its own
54-byte stack (`src/cpm/bdos.asm:89-92`, `src/layout.asm:71`).

A function that takes an FCB, a 36-byte file control block whose layout
Chapter 16 gives, works on the drive in its first byte: 0 for the default
drive, 1 to 16 for A to P. The BDOS selects that drive before the function
runs, for functions 15, 16, 17, 19 to 23, 30, 33 to 35 and 40
(`src/tables.asm:78`, `src/cpm/bdos.asm:118-133`). A `?` in the drive byte is
allowed only for function 17.

A function that can't be carried out at all gives one of the BDOS's errors. In
the default error mode it prints the error and waits for a key, or takes the
key already kept if one was typed during output. It then ends the program by
warm boot, whatever the key, and does not return. Function 45 can set a mode
in which the function returns instead, with `A` = `FFh` and the error's code in
`H` (`src/cpm/bdoscon.asm:19-41`). The errors are:

- `Bdos Err On d: Select`, code 4, for a drive with no volume, a drive past D
  or a `?` drive byte outside function 17 (`src/cpm/bdoslog.asm:575-578`).
- `Bdos Err On d: R/O`, code 2, for a change to a drive that function 28 has
  made read-only or to a volume the card marks read-only, by function 19, 21,
  22, 23, 30, 34 or 40 (`src/cpm/bdoslog.asm:563-571`).
- `Bdos Err On d: File R/O`, code 3, for function 19 or 23 on a directory
  entry whose read-only attribute is set, and for function 21, 34 or 40
  through an FCB that has it (`src/cpm/bdosfile.asm:249-261`).
- `Bdos Err On d: Bad Sector`, code 1, for a record or a directory record that
  can't be read or written, or an allocation block number past the end of the
  volume in a read or a write (`src/cpm/bdosrec.asm:552`,
  `src/cpm/bdosrec.asm:175`, `src/cpm/bdoscon.asm:21-23`,
  `src/cpm/bdoscon.asm:46-49`).

The file functions return a directory code in `A` where CP/M 2.2 does: 0 to 3,
the place in the 128-byte directory record of the entry found, or `FFh` for
none.

## The functions

**0 System reset.** Ends the program by warm boot, through the RAM BIOS
table's warm boot entry (`src/cpm/bdos.asm:163-164`). Does not return.

**1 Console input.** Waits for a character and returns it in `A`, echoed to
the console (`src/cpm/bdos.asm:198-204`). A character kept from an earlier
status call or typed during output comes first. Every character is echoed,
control characters too. CP/M 2.2 echoes only printing characters, CR, LF, tab
and backspace.

**2 Console output.** Prints the character in `E`
(`src/cpm/bdos.asm:208-212`). A tab becomes spaces to the next multiple of 8
columns. Before each character the BDOS checks for a key. `^S` stops the
output until the next key. A `^C` then ends the program by warm boot, as in
CP/M 2.2, and any other key resumes the output and is discarded. `^P` turns
the copy of the output to the list device on or off. Any other key is kept for
the next input call (`src/cpm/bdoscon.asm:107-126`,
`src/cpm/bdoscon.asm:199-233`).

**3 Reader input.** Waits for a byte from the reader device, the serial port,
and returns it in `A` (`src/cpm/bdos.asm:215-217`).

**4 Punch output.** Sends the byte in `E` to the punch device, the serial port
(`src/cpm/bdos.asm:220-224`).

**5 List output.** Sends the byte in `E` to the list device, which discards it
(`src/cpm/bdos.asm:227-231`).

**6 Direct console I/O.** With `E` = `FFh`, returns a waiting character in
`A`, not echoed, or 0 if none is waiting. With any other `E`, sends `E` to the
console, with no tab expansion, no `^S` check and no copy to the list device
(`src/cpm/bdos.asm:235-250`). The values `FEh` and `FDh`, which CP/M 3 gives a
meaning of their own, are sent as characters.

**7 Get IOBYTE.** Returns the byte at `0003h` in `A`
(`src/cpm/bdos.asm:253-255`).

**8 Set IOBYTE.** Writes `E` to `0003h` (`src/cpm/bdos.asm:258-261`). TEC-OS
acts only on the IOBYTE's console field.

**9 Print string.** Prints the characters from `DE` up to a `$`, which is not
printed, as function 2 prints each (`src/cpm/bdos.asm:265-276`).

**10 Read console buffer.** Reads a line into the buffer at `DE`
(`src/cpm/bdos.asm:287-495`). The buffer's first byte gives the most
characters it takes. The BDOS returns the number read in the second byte, with
the characters from the third on. Return or LF ends the line, and so does the
last character the buffer takes. The editing keys are backspace, Delete, `^U`,
`^R`, `^X`, `^E`, `^P` and `^C` as the line's first key, as Chapter 16
describes. When the CCP calls it for the prompt, `^W` and `^N` recall lines
from the command history. For a program they are characters
(`src/cpm/bdos.asm:356-361`).

**11 Get console status.** Returns 1 in `A` if a character is waiting and 0 if
not (`src/cpm/bdos.asm:499-512`). A character the BIOS has is read and kept
for the next input call.

**12 Return version number.** Returns `0022h` in `HL`: CP/M 2.2
(`src/cpm/bdos.asm:515-517`).

**13 Reset disk system.** Logs out every drive, clears the read-only vector,
selects drive A and sets the DMA address to `0080h`. Drive A is logged in again
(`src/cpm/bdosfile.asm:5-31`). Returns 0. The user number stays as it is, as in
CP/M 2.2. The CCP's call at each warm boot sets a flag first, and then the
drives whose allocation vectors are unchanged stay logged in
(`src/cpm/bdosfile.asm:41-75`).

**14 Select disk.** Makes the drive in `E`, 0 to 15 for A to P, the default
drive, logging it in if it is not (`src/cpm/bdosfile.asm:80-95`). A drive past D
or with no volume is the `Select` error.

**15 Open file.** Searches for the FCB's file and extent and copies the
directory entry into the FCB, so that `?` in the name is replaced
(`src/cpm/bdosfile.asm:137-144`, `src/cpm/bdosfn.asm:376-426`). Returns the
directory code, or `FFh` if there is no such file. The FCB's `CR` is not
changed: a program sets it to 0 before reading from the start.

**16 Close file.** Writes the FCB's extent, record count and allocation map
back to the file's directory entry (`src/cpm/bdosfile.asm:148-201`). An FCB on an
earlier extent than its entry's writes back only the allocation map
(`src/cpm/bdosfile.asm:165-168`, `src/cpm/bdosfile.asm:189-196`). Returns the
directory code, or `FFh` if the entry is not found. If nothing has been
written through the FCB since its open, the call writes nothing and returns 0.
On a read-only drive it writes nothing and returns 0 for any FCB, one that was
never opened too, as CP/M 2.2's close does (`src/cpm/bdosfile.asm:157-172`).

**17 Search for first.** Searches for the first entry that matches the FCB,
with `?` matching any character, and copies the directory record that holds it
to the DMA address (`src/cpm/bdosfile.asm:219-240`). Returns the directory code,
or `FFh` if none matches. A `?` in the FCB's extent byte matches every extent.
Otherwise only the entries of that extent match. A `?` in the drive byte
returns every directory entry of the default drive, in use or not.

**18 Search for next.** Continues the last search from the entry after the one
found (`src/cpm/bdosfile.asm:245-247`). `DE` is not used.

**19 Delete file.** Erases every entry that matches the FCB, `?` allowed, and
frees its allocation blocks (`src/cpm/bdosfile.asm:263-303`). Returns 0, or `FFh`
if no file matched. A matching file with its read-only attribute set is the
`File R/O` error. The entries erased before it stay erased. Each entry's blocks
are freed only once its directory write has returned, so a write that fails
in a mode of function 45 that returns the error leaves that entry's blocks in
use, as the card has them.

**20 Read sequential.** Reads the record at the FCB's `CR` into the DMA
address and moves on, to the next extent after record 127
(`src/cpm/bdosrec.asm:128-184`). Returns 0, or 1 at the end of the file.

**21 Write sequential.** Writes the record at the DMA address at the FCB's
`CR` and moves on, taking a new allocation block and a new extent when it needs them
(`src/cpm/bdosrec.asm:5-124`). Returns 0, 1 if the directory has no entry for a
new extent or the close of the extent it leaves finds no entry for it, or 2 if
the drive is full. After a 1 the FCB stays on its extent with `CR` at 128, so a
write after an entry is freed makes the extent it needs
(`src/cpm/bdosrec.asm:59-103`). A block taken for a write that then fails
stays in the FCB's map, and the close writes it into the entry
(`src/cpm/bdosrec.asm:460-477`). An FCB with the read-only attribute set is the
`File R/O` error (`src/cpm/bdosfile.asm:253-261`).

**22 Make file.** Creates an empty entry for the FCB's name in the current
user area, writes it to the directory and opens it
(`src/cpm/bdosfile.asm:311-382`). Returns the directory code, or `FFh` if the
directory is full. Does not test for a file of the same name. As in CP/M 2.2,
the FCB's `S2` is set to 0 and its `EX` kept, so the entry is the extent `EX`
names among the file's first 32, and `S1`, `RC` and the map are cleared
(`src/cpm/bdosfile.asm:305-318`, `src/cpm/bdosfile.asm:338-351`).

**23 Rename file.** Gives every entry of the file named in the FCB's first 16
bytes the name and type at offsets 17 to 27 (`src/cpm/bdosfile.asm:407-447`).
Returns 0, or `FFh` if there is no such file. The second drive byte, at offset
16, is not read. An entry with its read-only attribute set is the `File R/O`
error (`src/cpm/bdosfile.asm:431-437`).

**24 Return login vector.** Returns in `HL` a bit for each logged-in drive,
bit 0 for A (`src/cpm/bdosfn.asm:9-11`).

**25 Return current disk.** Returns the default drive in `A`, 0 for A
(`src/cpm/bdosfn.asm:15-17`).

**26 Set DMA address.** Sets the address of the 128-byte record buffer to `DE`
(`src/cpm/bdosfn.asm:23-29`).

**27 Get allocation vector address.** Returns in `HL` the address of the
default drive's allocation vector (`src/cpm/bdosfn.asm:34-36`). A `MOUNT`
onto the default drive selects it again, so this is the new volume's vector at
once (`src/vol.asm:679-691`).

**28 Write protect disk.** Sets the default drive's bit in the read-only
vector, so that a later change to the drive is the `R/O` error, until the next
warm boot, disk reset or function 37 for the drive
(`src/cpm/bdosfn.asm:87-99`, `src/cpm/bdosfn.asm:278-279`).

**29 Get read-only vector.** Returns the read-only vector in `HL`, bit 0 for A
(`src/cpm/bdosfn.asm:103-105`). A volume that the card marks read-only appears
in it once its drive has been selected (`src/cpm/bdoslog.asm:159-164`).

**30 Set file attributes.** Copies the FCB's name and type, with their bit 7
attributes, into every entry of the file (`src/cpm/bdosfile.asm:398-402`,
`src/cpm/bdosfile.asm:417-447`). Returns 0, or `FFh` if there is no such file. Bit
7 of the first type byte is the read-only attribute and of the second the
system attribute, which `DIR` hides.

**31 Get disk parameter block address.** Returns in `HL` the address of the
default drive's DPB (`src/cpm/bdosfn.asm:109-111`), the new volume's at once
after a `MOUNT` onto that drive, as for function 27.

**32 Set or get user code.** With `E` = `FFh`, returns the user number in `A`.
With any other `E`, sets the user number to the low five bits of `E` and
returns 0, as in CP/M 2.2 (`src/cpm/bdosfn.asm:113-128`). The CCP's `USER`
command takes 0 to 15, and the byte at `0004h` holds only four bits of the
number (`src/cpm/ccp.asm:225-245`).

**33 Read random.** Reads the record whose number is in the FCB's `R0` and
`R1` into the DMA address and leaves the FCB's extent and `CR` at that record,
so that a sequential read after it reads the same record
(`src/cpm/bdosrec.asm:189-195`, `src/cpm/bdosrec.asm:235-353`). Returns 0, or 1 if
the record has not been written, 3 if the current extent can't be closed, 4 if
the extent has not been written or 6 if `R2` is not 0. After a 4 the FCB's `EX`
and `S2` are its own again, naming the extent its record count and map
describe, so a second read of that record is 4 again and a write to it makes
the extent.

**34 Write random.** Writes the record at the DMA address to the record whose
number is in `R0` and `R1`, making its extent if needed
(`src/cpm/bdosrec.asm:200-353`). Returns 0, or 2 if the drive is full, 3 if the
current extent can't be closed, 5 if the directory has no entry for the extent
or 6 if `R2` is not 0. After a 5 the FCB is back on its own extent, as after
function 33's 4, so a write once an entry is freed makes the extent. An FCB with the read-only attribute set is the
`File R/O` error.

**35 Compute file size.** Sets `R0` to `R2` to the file's size in records,
from whichever of its entries ends highest, or to 0 if there is no such file
(`src/cpm/bdosfn.asm:130-195`). Returns `FFh` in `A`.

**36 Set random record.** Sets `R0` to `R2` from the FCB's extent and `CR`,
the record the next sequential call would read or write
(`src/cpm/bdosfn.asm:197-215`). Returns 0.

**37 Reset drive.** Logs out each drive whose bit is set in `DE`, bit 0 for A,
and clears its bit in the read-only vector (`src/cpm/bdosfn.asm:268-282`).
Returns 0. The drive is logged in again, and its directory read, at its next
selection.

**38 Access drive** and **39 Free drive.** MP/M's functions, which CP/M 2.2
does not define. Both return 0 and do nothing (`src/tables.asm:77`).

**40 Write random with zero fill.** Function 34, with each allocation block the
write newly allocates filled with zeros before the record is written
(`src/cpm/bdosrec.asm:197-216`, `src/cpm/bdosrec.asm:495-545`). The BIOS's DMA
address is put back on the program's after each of the zero-fill's writes, so
a failed write that function 45 returns leaves the program's DMA address in
the BIOS.

**44 Set multi-sector count.** With `E` = 1 returns 0. With any other `E`
returns `FFh` in `A` and changes nothing (`src/cpm/bdos.asm:138-146`). TEC-OS
reads and writes one record a call, so 1 is the only count.

**45 Set BDOS error mode.** Sets the mode to `E` and returns 0
(`src/cpm/bdos.asm:166-173`). With `E` = `FFh` a BDOS error returns to the
program with `A` = `FFh` and the error's code in `H`, prints nothing and keeps
the rest of a chained line. With `E` = `FEh` it prints the message first and
then returns in the same way. Any other `E` is the default, the message, a key
and the end of the program with the rest of a chained line dropped
(`src/cpm/bdoscon.asm:25-41`). A warm boot puts the default back. A read or
write that returns an error leaves the FCB on the record it didn't read or
write, as in CP/M 3 (`src/cpm/bdosrec.asm:44-51`, `src/cpm/bdosrec.asm:172-179`).

**46 Get disk free space.** Selects the drive in `E`, 0 to 15 for A to P, as
an FCB's drive is selected, and puts its free space, in records, in the three
bytes at the DMA address, low byte first (`src/cpm/bdosfn.asm:38-82`).
Returns 0. The default drive stays as it was. A drive past D or with no volume
is the `Select` error.

**47 Chain to program.** Replaces what is left of the CCP's command line with
the command at the DMA address, which ends with a 0 within its first 128
bytes, and ends the program by warm boot. The CCP runs the command next
(`src/cpm/bdos.asm:47-73`). The command may hold `!` and `:`. A command with
no 0 in its first 128 bytes, or with a CR or LF before the 0, returns `FFh` in
`A`, and the program goes on with the line unchanged. `E` is ignored. Warm
boot's flush puts the records written behind on the card before the CCP loads
the chained command.

**48 Flush buffers.** Writes every changed line of the block cache to the card
and returns 0 in `A`, or `FFh` if a write failed and its line was dropped
(`src/cpm/bdos.asm:175-180`, `src/vol.asm:700-713`). `E` = `FFh`, CP/M 3's
purge, gives the same flush.

**99 Truncate file.** Returns `FFh` in `A` and changes nothing
(`src/cpm/bdos.asm:65-66`, `src/cpm/bdos.asm:106-107`). TEC-OS has no truncate.

**108 Get or set program return code.** With `DE` = `FFFFh`, returns the code
in `HL`. With any other `DE`, sets the code to `DE` and returns 0
(`src/cpm/bdos.asm:182-194`). All programs share one code. A reset clears it
to 0 and a warm boot keeps it. The CCP sets it to 0 as it takes each command
and to `FF00h` when a command fails, and a piece of a command line that starts
with `:` runs only when the code is not from `FF00h` to `FFFEh`
(`src/cpm/ccp.asm:143-155`).

## Other numbers

Every other function number, from 41 to 255 except 44 to 48, 99 and 108,
returns 0 in `A` and `HL` and does nothing (`src/cpm/bdos.asm:108-109`). Function 50, CP/M
3's direct BIOS call, is one of them. A program reaches the BIOS through its
jump table, whose warm boot entry is the address at `0001h`
(`src/boot.asm:225-228`).
