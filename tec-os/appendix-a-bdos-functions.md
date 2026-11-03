---
title: A. BDOS functions
parent: TEC-OS
nav_order: 101
nav_group: "Appendices"
---

# Appendix A. BDOS functions

Checked against TEC-OS 1f9542d.

This appendix lists the BDOS functions of TEC-OS in number order: 0 to 40,
then 47 and 108, whose meanings come from CP/M 3. Each entry gives the
registers the function takes, what it returns and where it differs from CP/M
2.2. Chapter 16 describes the mechanism behind them.

## Calling a function

A program loads the function's number into `C` and its argument into `E` or
`DE` and calls `0005h`. The BDOS returns its result in `HL`, with the low byte
in `A` as well and the high byte in `B` (`src/cpm/bdos.asm:117-128`). A
function that returns a byte has 0 in `H` and `B`. One that returns nothing
returns 0. No other register is kept, as in CP/M 2.2. The call uses two bytes
of the program's stack, for its return address: the BDOS runs on its own
54-byte stack (`src/cpm/bdos.asm:79-82`, `src/layout.asm:79`).

A function that takes an FCB, a 36-byte file control block whose layout
Chapter 16 gives, works on the drive in its first byte: 0 for the default
drive, 1 to 16 for A to P. The BDOS selects that drive before the function
runs, for functions 15, 16, 17, 19 to 23, 30, 33 to 35 and 40
(`src/data3.asm:84`, `src/cpm/bdos.asm:98-112`). A `?` in the drive byte is
allowed only for function 17.

A function that can't be carried out at all prints one of the BDOS's errors
and waits for a key, or takes the key already kept if one was typed during
output. It then ends the program by warm boot, whatever the key, and does not
return (`src/cpm/bdos.asm:2380-2431`). The errors are:

- `Bdos Err On d: Select`, for a drive with no volume, a drive past D or a `?`
  drive byte outside function 17.
- `Bdos Err On d: R/O`, for a change to a drive that function 28 has made
  read-only or to a volume the card marks read-only, by function 16, 19, 21,
  22, 23, 30, 34 or 40
  (`src/cpm/bdos.asm:2366-2378`).
- `Bdos Err On d: File R/O`, for function 19 or 23 on a directory entry whose
  read-only attribute is set, and for function 21, 34 or 40 through an FCB
  that has it (`src/cpm/bdos.asm:634-645`).
- `Bdos Err On d: Bad Sector`, for a record or a directory record that can't
  be read or written, or an allocation block number past the end of the volume
  in a read or a write (`src/cpm/bdos.asm:1285`, `src/cpm/bdos.asm:1836`,
  `src/cpm/bdos.asm:2399-2411`).

The file functions return a directory code in `A` where CP/M 2.2 does: 0 to 3,
the place in the 128-byte directory record of the entry found, or `FFh` for
none.

## The functions

**0 System reset.** Ends the program by warm boot, through the RAM BIOS
table's warm boot entry (`src/cpm/bdos.asm:130-131`). Does not return.

**1 Console input.** Waits for a character and returns it in `A`, echoed to
the console (`src/cpm/bdos.asm:147-153`). A character kept from an earlier
status call or typed during output comes first. Every character is echoed,
control characters too. CP/M 2.2 echoes only printing characters, CR, LF, tab
and backspace.

**2 Console output.** Prints the character in `E`
(`src/cpm/bdos.asm:155-159`). A tab becomes spaces to the next multiple of 8
columns. Before each character the BDOS checks for a key. `^S` stops the
output until the next key, which is discarded. `^P` turns the copy of the
output to the list device on or off. Any other key is kept for the next input
call (`src/cpm/bdos.asm:2454-2471`, `src/cpm/bdos.asm:2521-2544`). In CP/M 2.2
a `^C` after `^S` ends the program. In TEC-OS it resumes the output like any
other key.

**3 Reader input.** Waits for a byte from the reader device, the serial port,
and returns it in `A` (`src/cpm/bdos.asm:161-163`).

**4 Punch output.** Sends the byte in `E` to the punch device, the serial port
(`src/cpm/bdos.asm:165-169`).

**5 List output.** Sends the byte in `E` to the list device, which discards it
(`src/cpm/bdos.asm:171-175`).

**6 Direct console I/O.** With `E` = `FFh`, returns a waiting character in
`A`, not echoed, or 0 if none is waiting. With any other `E`, sends `E` to the
console, with no tab expansion, no `^S` check and no copy to the list device
(`src/cpm/bdos.asm:177-190`). The values `FEh` and `FDh`, which CP/M 3 gives a
meaning of their own, are sent as characters.

**7 Get IOBYTE.** Returns the byte at `0003h` in `A`
(`src/cpm/bdos.asm:192-194`).

**8 Set IOBYTE.** Writes `E` to `0003h` (`src/cpm/bdos.asm:196-199`). TEC-OS
acts only on the IOBYTE's console field.

**9 Print string.** Prints the characters from `DE` up to a `$`, which is not
printed, as function 2 prints each (`src/cpm/bdos.asm:201-213`).

**10 Read console buffer.** Reads a line into the buffer at `DE`
(`src/cpm/bdos.asm:215-405`). The buffer's first byte gives the most
characters it takes. The BDOS returns the number read in the second byte, with
the characters from the third on. Return or LF ends the line, and so does the
last character the buffer takes. The editing keys are backspace, Delete, `^U`,
`^R`, `^X`, `^E`, `^P` and `^C` as the line's first key, as Chapter 16
describes. When the CCP calls it for the prompt, `^W` and `^N` recall lines
from the command history. For a program they are characters
(`src/cpm/bdos.asm:282-287`).

**11 Get console status.** Returns 1 in `A` if a character is waiting and 0 if
not (`src/cpm/bdos.asm:407-421`). A character the BIOS has is read and kept
for the next input call.

**12 Return version number.** Returns `0022h` in `HL`: CP/M 2.2
(`src/cpm/bdos.asm:423-425`).

**13 Reset disk system.** Logs out every drive, clears the read-only vector,
selects drive A and sets the DMA address to `0080h`. Drive A is logged in again
(`src/cpm/bdos.asm:427-451`). Returns 0. The user number stays as it is, as in
CP/M 2.2. The CCP's call at each warm boot sets a flag first, and then the
drives whose allocation vectors are unchanged stay logged in
(`src/cpm/bdos.asm:453-492`).

**14 Select disk.** Makes the drive in `E`, 0 to 15 for A to P, the default
drive, logging it in if it is not (`src/cpm/bdos.asm:494-508`). A drive past D
or with no volume is the `Select` error.

**15 Open file.** Searches for the FCB's file and extent and copies the
directory entry into the FCB, so that `?` in the name is replaced
(`src/cpm/bdos.asm:547-552`, `src/cpm/bdos.asm:1670-1716`). Returns the
directory code, or `FFh` if there is no such file. The FCB's `CR` is not
changed: a program sets it to 0 before reading from the start.

**16 Close file.** Writes the FCB's extent, record count and allocation map
back to the file's directory entry (`src/cpm/bdos.asm:554-600`). An FCB on an
earlier extent than its entry's writes back only the allocation map
(`src/cpm/bdos.asm:566-568`, `src/cpm/bdos.asm:588-595`). Returns the
directory code, or `FFh` if the entry is not found. If nothing has been
written through the FCB since its open, the call writes nothing and returns 0.
Any other FCB on a read-only drive is the `R/O` error before the directory is
searched, so an FCB that was never opened is one too
(`src/cpm/bdos.asm:558-571`).

**17 Search for first.** Searches for the first entry that matches the FCB,
with `?` matching any character, and copies the directory record that holds it
to the DMA address (`src/cpm/bdos.asm:610-627`). Returns the directory code,
or `FFh` if none matches. A `?` in the FCB's extent byte matches every extent.
Otherwise only the entries of that extent match. A `?` in the drive byte
returns every directory entry of the default drive, in use or not.

**18 Search for next.** Continues the last search from the entry after the one
found (`src/cpm/bdos.asm:629-632`). `DE` is not used.

**19 Delete file.** Erases every entry that matches the FCB, `?` allowed, and
frees its allocation blocks (`src/cpm/bdos.asm:647-677`). Returns 0, or `FFh`
if no file matched. A matching file with its read-only attribute set is the
`File R/O` error. The entries erased before it stay erased.

**20 Read sequential.** Reads the record at the FCB's `CR` into the DMA
address and moves on, to the next extent after record 127
(`src/cpm/bdos.asm:914-960`). Returns 0, or 1 at the end of the file.

**21 Write sequential.** Writes the record at the DMA address at the FCB's
`CR` and moves on, taking a new allocation block and a new extent when it needs them
(`src/cpm/bdos.asm:762-912`). Returns 0, 1 if the directory has no entry for a
new extent, or 2 if the drive is full. After a 1 the FCB stays on its extent
with `CR` at 128, so a write after an entry is freed makes the extent it needs
(`src/cpm/bdos.asm:857-893`). An FCB with the read-only attribute set is the
`File R/O` error (`src/cpm/bdos.asm:637-645`).

**22 Make file.** Creates an empty entry for the FCB's name in the current
user area, writes it to the directory and opens it
(`src/cpm/bdos.asm:679-760`). Returns the directory code, or `FFh` if the
directory is full. Does not test for a file of the same name. The FCB's `EX`
and `S2` are set to 0, so the entry is always the file's first extent
(`src/cpm/bdos.asm:711-719`). CP/M 2.2 keeps them.

**23 Rename file.** Gives every entry of the file named in the FCB's first 16
bytes the name and type at offsets 17 to 27 (`src/cpm/bdos.asm:775-813`).
Returns 0, or `FFh` if there is no such file. The second drive byte, at offset
16, is not read. An entry with its read-only attribute set is the `File R/O`
error (`src/cpm/bdos.asm:797-803`).

**24 Return login vector.** Returns in `HL` a bit for each logged-in drive,
bit 0 for A (`src/cpm/bdos.asm:1394-1396`).

**25 Return current disk.** Returns the default drive in `A`, 0 for A
(`src/cpm/bdos.asm:1398-1400`).

**26 Set DMA address.** Sets the address of the 128-byte record buffer to `DE`
(`src/cpm/bdos.asm:1402-1408`).

**27 Get allocation vector address.** Returns in `HL` the address of the
default drive's allocation vector (`src/cpm/bdos.asm:1410-1412`).

**28 Write protect disk.** Sets the default drive's bit in the read-only
vector, so that a later change to the drive is the `R/O` error, until the next
warm boot, disk reset or function 37 for the drive
(`src/cpm/bdos.asm:1414-1426`, `src/cpm/bdos.asm:1587-1588`).

**29 Get read-only vector.** Returns the read-only vector in `HL`, bit 0 for A
(`src/cpm/bdos.asm:1428-1430`). A volume that the card marks read-only appears
in it once its drive has been selected (`src/cpm/bdos.asm:1944-1949`).

**30 Set file attributes.** Copies the FCB's name and type, with their bit 7
attributes, into every entry of the file (`src/cpm/bdos.asm:769-773`,
`src/cpm/bdos.asm:783-813`). Returns 0, or `FFh` if there is no such file. Bit
7 of the first type byte is the read-only attribute and of the second the
system attribute, which `DIR` hides.

**31 Get disk parameter block address.** Returns in `HL` the address of the
default drive's DPB (`src/cpm/bdos.asm:1432-1434`).

**32 Set or get user code.** With `E` = `FFh`, returns the user number in `A`.
With any other `E`, sets the user number to the low five bits of `E` and
returns 0, as in CP/M 2.2 (`src/cpm/bdos.asm:1436-1448`). The CCP's `USER`
command takes 0 to 15, and the byte at `0004h` holds only four bits of the
number (`src/cpm/ccp.asm:206-225`).

**33 Read random.** Reads the record whose number is in the FCB's `R0` and
`R1` into the DMA address and leaves the FCB's extent and `CR` at that record,
so that a sequential read after it reads the same record
(`src/cpm/bdos.asm:962-968`, `src/cpm/bdos.asm:987-1098`). Returns 0, or 1 if
the record has not been written, 3 if the current extent can't be closed, 4 if
the extent has not been written or 6 if `R2` is not 0.

**34 Write random.** Writes the record at the DMA address to the record whose
number is in `R0` and `R1`, making its extent if needed
(`src/cpm/bdos.asm:970-1098`). Returns 0, or 2 if the drive is full, 3 if the
current extent can't be closed, 5 if the directory has no entry for the extent
or 6 if `R2` is not 0. An FCB with the read-only attribute set is the
`File R/O` error.

**35 Compute file size.** Sets `R0` to `R2` to the file's size in records,
from whichever of its entries ends highest, or to 0 if there is no such file
(`src/cpm/bdos.asm:1450-1518`). Returns `FFh` in `A`.

**36 Set random record.** Sets `R0` to `R2` from the FCB's extent and `CR`,
the record the next sequential call would read or write
(`src/cpm/bdos.asm:1520-1543`). Returns 0.

**37 Reset drive.** Logs out each drive whose bit is set in `DE`, bit 0 for A,
and clears its bit in the read-only vector (`src/cpm/bdos.asm:1577-1591`).
Returns 0. The drive is logged in again, and its directory read, at its next
selection.

**38 Access drive** and **39 Free drive.** MP/M's functions, which CP/M 2.2
does not define. Both return 0 and do nothing (`src/data3.asm:83`).

**40 Write random with zero fill.** Function 34, with each allocation block the
write newly allocates filled with zeros before the record is written
(`src/cpm/bdos.asm:970-981`, `src/cpm/bdos.asm:1232-1281`).

**47 Chain to program.** Replaces what is left of the CCP's command line with
the command at the DMA address, which ends with a 0 within its first 128
bytes, and ends the program by warm boot. The CCP runs the command next
(`src/cpm/bdos.asm:46-71`). The command may hold `!` and `:`. A command with
no 0 in its first 128 bytes, or with a CR or LF before the 0, returns `FFh` in
`A`, and the program goes on with the line unchanged. `E` is ignored.

**108 Get or set program return code.** With `DE` = `FFFFh`, returns the code
in `HL`. With any other `DE`, sets the code to `DE` and returns 0
(`src/cpm/bdos.asm:133-145`). All programs share one code. A reset clears it
to 0 and a warm boot keeps it. The CCP sets it to 0 as it takes each command
and to `FF00h` when a command fails, and a piece of a command line that starts
with `:` runs only when the code is not from `FF00h` to `FFFEh`
(`src/cpm/ccp.asm:125-137`).

## Other numbers

Every other function number, from 41 to 255 except 47 and 108, returns 0 in
`A` and `HL` and does nothing (`src/cpm/bdos.asm:88-89`). Function 50, CP/M
3's direct BIOS call, is one of them. A program reaches the BIOS through its
jump table, whose warm boot entry is the address at `0001h`
(`src/boot.asm:97-98`).
