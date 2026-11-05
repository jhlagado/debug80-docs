---
title: A. BDOS functions
parent: TEC-OS
nav_order: 101
nav_group: "Appendices"
---

# Appendix A. BDOS functions

<!-- Contracts checked by source text at TEC-OS
     962853f499f05faf281f6cdff1deca8959f58c2b. Every source range below uses
     that pin. No execution, measurement or new output is claimed. -->

Use the function number to find its registers in the table, then its effects and
failure results in the numbered entry. TEC-OS implements the CP/M 2.2 interface
with selected additions numbered 44 to 48, 99 and 108. Those additions do not
establish general CP/M 3 compatibility. Unsupported calls are listed at the end.
[Chapter 19](19-a-file-through-the-bdos.md) explains the file machinery behind
these contracts and the file control block (FCB).

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
| 35 | Compute file size | `DE` → FCB | `R0` to `R2` in the FCB, `A` = `FFh` |
| 36 | Set random record | `DE` → FCB | `R0` to `R2` in the FCB, `A` = 0 |
| 37 | Reset drive | `DE` = drives | `A` = 0 |
| 38 | Access drive | | `A` = 0 |
| 39 | Free drive | | `A` = 0 |
| 40 | Write random with zero fill | `DE` → FCB | as function 34 |
| 44 | Set multi-sector count | `E` = count | `A` = 0 or `FFh` |
| 45 | Set BDOS error mode | `E` = mode | `A` = 0 |
| 46 | Get disk free space | `E` = drive | 3 bytes at the DMA address, `A` = 0 |
| 47 | Chain to program | command at the DMA address | does not return or `A` = `FFh` |
| 48 | Flush buffers | | `A` = 0 or `FFh` |
| 99 | Truncate file | | `A` = `FFh` |
| 108 | Get or set program return code | `DE` = `FFFFh` or code | `HL` = code or 0 |

These are ordinary results. A disk error can instead abort the call or
return the error registers described below.

## Calling a function

A program loads the function number into `C`, loads its argument into `E` or
`DE` and calls `0005h`. On return `HL` holds the result, `A` copies its low
byte and `B` copies its high byte (`src/cpm/bdos.asm:228-252`). Byte results
have 0 in `H` and `B`. An entry that says “returns nothing” returns 0. No
other register or result flag is promised. Test the returned value rather
than treating carry as a success flag. The call places a two-byte return
address on the program's stack, then the BDOS switches to its own stack.
That stack's declared allocation is 54 bytes
(`src/cpm/bdos.asm:137-141`, `src/layout.asm:152`).

A function that takes an FCB uses its first byte to select a drive: 0 for
the default drive, 1 to 16 for A to P. The FCB is a 36-byte file control
block, laid out in [Chapter 19](19-a-file-through-the-bdos.md). Selection
precedes functions 15, 16, 17, 19 to 23, 30, 33 to 35 and 40
(`src/tables.asm:89-97`, `src/cpm/bdos.asm:178-213`). A `?` in the drive byte
is allowed only for function 17. An explicit FCB drive changes the selected
drive for that operation without changing the logical default. The caller's
drive byte is left intact (`src/cpm/bdosfile.asm:157-234`).

The file functions return a directory code in `A` where CP/M 2.2 does: 0 to 3,
the place in the 128-byte directory record of the entry found or `FFh` for
none.

## The errors

A disk operation that cannot proceed gives one of four BDOS errors. By
default the BDOS prints the message, takes a key and warm boots without
returning. An ordinary key retained during output can satisfy that wait.
Output-time `^S` and `^P` have their separate console effects. The remaining
command chain is dropped (`src/cpm/bdoscon.asm:47-72`, `126-137`, `318-350`,
`src/cpm/bdos.asm:115-119`). Function 45 instead permits silent or printed
returns with `A` = `L` = `FFh` and `H` = `B` = the error code. Those returns
preserve the chain. They are distinct from an ordinary not-found, end-of-file
or full-directory result listed under a function.

| Code | Message | Given for |
| ---: | --- | --- |
| 1 | `Bdos Err On d: Bad Sector` | A failed data/directory transfer or a read/write allocation-block reference beyond the volume (`src/cpm/bdosrec.asm:79-103`, `280-286`, `871-873`, `src/cpm/bdoslog.asm:100-136`, `src/cpm/bdoscon.asm:31-33`, `82-101`) |
| 2 | `Bdos Err On d: R/O` | A change by function 19, 21, 22, 23, 30, 34 or 40 to a drive protected by function 28 or by the mounted volume's flag. Close instead succeeds without writing (`src/cpm/bdoslog.asm:254-264`, `880-891`, `src/cpm/bdosfile.asm:289-298`) |
| 3 | `Bdos Err On d: File R/O` | Function 19 or 23 reached a read-only directory entry or function 21, 34 or 40 received an FCB with that attribute (`src/cpm/bdosfile.asm:430-445`, `477-485`, `653-664`, `733-745`, `src/cpm/bdosrec.asm:350-355`) |
| 4 | `Bdos Err On d: Select` | An unmounted drive, a drive past D or an FCB's `?` drive outside function 17 (`src/bios.asm:63-96`, `src/cpm/bdosfile.asm:211-234`, `src/cpm/bdoslog.asm:897-900`) |

[Appendix D](appendix-d-error-messages.md#the-bdos-s-errors) gives recovery
procedures. Earlier or partial physical writes are not rolled back when a
transfer fails.

## The functions

**0 System reset.** Ends the program by warm boot through the RAM BIOS
table's warm boot entry (`src/cpm/bdos.asm:257-259`). Does not return.

**1 Console input.** Waits for a character and echoes it to the console. A
character kept from an earlier status call or typed during output comes first
(`src/cpm/bdos.asm:321-330`). Returns the character in `A`. Every character is
echoed, including control characters. Tab is expanded to spaces. This
differs from CP/M 2.2's restricted echo of printing characters, CR, LF, tab
and backspace (`src/cpm/bdoscon.asm:273-286`).

**2 Console output.** Prints the character in `E`. A tab becomes spaces to the
next multiple of 8 columns. Before each character the BDOS checks for a key.
`^S` stops the output until the next key. A `^C` then ends the program by warm
boot and any other key resumes the output and is discarded. `^P` turns the
copy of the output to the list device on or off. Any other key is kept for the
next input call (`src/cpm/bdos.asm:337-341`, `src/cpm/bdoscon.asm:178-204`,
`src/cpm/bdoscon.asm:318-350`). Returns nothing. The `^C` after `^S` ends the
program in CP/M 2.2 too.

**3 Reader input.** Waits for a byte from the reader device, the serial port
(`src/cpm/bdos.asm:346-349`, `src/console.asm:585-599`). Returns it in `A`.

**4 Punch output.** Sends the byte in `E` to the punch device, the serial port
(`src/cpm/bdos.asm:354-359`, `src/console.asm:581-583`). Returns nothing.

**5 List output.** Sends the byte in `E` to the list device, which discards it
(`src/cpm/bdos.asm:364-369`, `src/console.asm:566-567`). Returns nothing.

**6 Direct console I/O.** With `E` = `FFh`, reads a waiting character without
echo. With any other `E`, sends `E` to the console with no tab expansion, no
`^S` check and no copy to the list device (`src/cpm/bdos.asm:376-397`).
Returns the character in `A` or 0 if none is waiting. The values `FEh` and
`FDh`, which CP/M 3 gives a meaning of their own, are sent as characters.

**7 Get IOBYTE.** Reads the byte at `0003h` (`src/cpm/bdos.asm:402-404`).
Returns it in `A`.

**8 Set IOBYTE.** Writes `E` to `0003h` (`src/cpm/bdos.asm:409-412`). Returns
nothing. TEC-OS acts only on the IOBYTE's console field
(`src/console.asm:127-199`).

**9 Print string.** Prints the characters from `DE` up to a `$`, which is not
printed, as function 2 prints each (`src/cpm/bdos.asm:419-433`). Returns
nothing.

**10 Read console buffer.** Reads a line into the buffer at `DE`. The buffer's
first byte is the maximum number of characters it takes. Return or LF ends the
line. Reaching the buffer's maximum ends it too. The editing keys are
backspace, Delete, `^U`, `^R`, `^X`, `^E`, `^P` and `^C` while the line is
empty. At the CCP's prompt `^W` and `^N` recall lines from command history.
For a program they are characters
(`src/cpm/bdos.asm:454-765`, `src/cpm/bdos.asm:545-553`). Returns the number
read in the buffer's second byte, with the characters from the third on.
Returns 0 in `A`. The returned line excludes the editing controls. Backspace
erases the removed character on screen while Delete echoes it. `^C` is
ignored while the line contains characters. On an empty line it ends the
program by warm boot and drops the remaining command chain. Deleting or
clearing all characters restores that abort condition
(`src/cpm/bdos.asm:559-620`, `675-729`).
[Chapter 22](22-the-history-ring.md) explains the history storage.

**11 Get console status.** Tests for a waiting character. A character the BIOS
has is read and kept for the next input call (`src/cpm/bdos.asm:772-792`).
Returns 1 in `A` if a character is waiting and 0 if not.

**12 Return version number.** Returns `0022h` in `HL`: CP/M 2.2
(`src/cpm/bdos.asm:797-800`).

**13 Reset disk system.** Logs out every drive, clears the read-only vector,
selects drive A and sets the DMA address to `0080h`. Drive A is logged in again
(`src/cpm/bdosfile.asm:19-53`). Returns 0. The user number stays as it is, as in
CP/M 2.2. The CCP's call at each warm boot sets a flag first. Drives with no
dirty flag and a matching allocation-vector sum then stay logged in
(`src/cpm/bdosfile.asm:72-132`).

**14 Select disk.** Makes the drive in `E`, 0 to 15 for A to P, the default
drive, logging it in if it is not (`src/cpm/bdosfile.asm:142-171`). Returns
nothing. A drive past D or with no volume gives the `Select` error.

**15 Open file.** Searches for the FCB's file and logical extent and copies
the entry's name through allocation map into the FCB, replacing any `?` in
the name. EX retains the requested logical extent. RC describes that extent
and S2's bit 7 marks the FCB unmodified
(`src/cpm/bdosfile.asm:246-248`, `src/cpm/bdosfn.asm:621-685`). Returns the
directory code or `FFh` if there is no such file. The FCB's `CR` is not
changed: a program sets it to 0 before reading from the start.

**16 Close file.** Writes the FCB's extent, record count and allocation map
back to the file's directory entry. An FCB on an earlier extent than its
entry's writes back only the allocation map (`src/cpm/bdosfile.asm:270-339`).
Returns the directory code or `FFh` if the entry is not found. Returns 0
and writes nothing when S2's bit 7 marks the FCB unmodified since open or
make. On a read-only drive it writes nothing and returns 0 even for an FCB
that was never opened, as CP/M 2.2's close does
(`src/cpm/bdosfile.asm:270-298`).

**17 Search for first.** Searches for the first entry that matches the FCB,
with `?` matching any character. It copies the containing directory record
to the DMA address (`src/cpm/bdosfile.asm:373-407`). A `?` in the FCB's extent
byte matches every extent. Otherwise matching respects the DPB's extent
mask and uses module 0 because ordinary search clears S2. A `?` in the drive
byte matches every directory entry of the default drive, in use or not.
Returns the directory code or `FFh` if none matches
(`src/cpm/bdosfn.asm:747-829`).

**18 Search for next.** Continues the last search from the entry after the one
found (`src/cpm/bdosfile.asm:416-419`). `DE` is not used. Returns the
directory code or `FFh` if none matches.

**19 Delete file.** Erases every entry that matches the FCB and frees its
allocation blocks. `?` is allowed (`src/cpm/bdosfile.asm:458-514`). Each entry's
blocks are freed only once its directory write has returned. A write that
fails in a mode of function 45 that returns the error therefore leaves that
entry's blocks in use. It does not establish that a failed physical write
left the card unchanged. Returns 0 or `FFh` if no file matched. A matching
file with its read-only attribute set gives the `File R/O`
error. The entries erased before it stay erased.

**20 Read sequential.** Reads the record at the FCB's `CR` into the DMA
address and moves on to the next extent after record 127
(`src/cpm/bdosrec.asm:227-298`). Returns 0 on success. It returns 1 when CR
reaches RC, when a needed map block is missing, when the next extent is
absent or when closing the extent returns `FFh`. A transfer failure instead
takes the BDOS error path.

**21 Write sequential.** Writes the record at the DMA address at the FCB's
`CR` and moves on. It takes a new allocation block or a new extent when the
record falls in one (`src/cpm/bdosrec.asm:22-207`). Returns 0 on success.
Returns 1 when the directory has no entry for a new extent or when the close
of the extent it leaves finds no entry for it. Returns 2 when the drive is
full. After a 1 the FCB stays on its extent with `CR` at 128 so a later
write, once an entry has been freed, makes the extent the FCB needs
(`src/cpm/bdosrec.asm:119-175`). A block taken for a write that then fails
stays in the FCB's map. A later successful close publishes it in the entry
(`src/cpm/bdosrec.asm:733-767`). An FCB with the read-only attribute set gives
the `File R/O` error (`src/cpm/bdosfile.asm:430-445`).

**22 Make file.** Creates an empty entry for the FCB's name in the current
user area, writes it to the directory and opens it
(`src/cpm/bdosfile.asm:529-643`). Does not test for a file of the same name.
Returns the directory code or `FFh` if the directory is full. After the
drive-write check it clears `S2` before searching for a free entry and keeps
`EX`, selecting an extent among the file's first 32 as in CP/M 2.2. This
`S2` reset occurs even when the directory is full
(`src/cpm/bdosfile.asm:529-538`, `558-572`). On the successful path it clears
`S1`, `RC` and the allocation map, then copies the entry with module 0 into
the directory buffer. It sets the FCB's `S2` bit 7 before calling the
directory write. The returned FCB's `S2` is therefore `80h`, marking it
unmodified (`src/cpm/bdosfile.asm:574-643`).

**23 Rename file.** Gives every entry of the file named in the FCB's first 16
bytes the name and type at offsets 17 to 27 (`src/cpm/bdosfile.asm:687-764`).
The second drive byte, at offset 16, is not read. Returns 0 or `FFh` if there
is no such file. An entry with its read-only attribute set gives the `File
R/O` error (`src/cpm/bdosfile.asm:733-745`).

**24 Return login vector.** Returns in `HL` a bit for each logged-in drive,
bit 0 for A (`src/cpm/bdosfn.asm:16-21`).

**25 Return current disk.** Returns the default drive in `A`, 0 for A
(`src/cpm/bdosfn.asm:28-31`).

**26 Set DMA address.** Sets the address of the 128-byte record buffer to `DE`
(`src/cpm/bdosfn.asm:43-50`). Returns nothing.

**27 Get allocation vector address.** Returns in `HL` the address of the
default drive's allocation vector (`src/cpm/bdosfn.asm:58-64`). A `MOUNT`
onto the default drive selects it again so this is the new volume's vector at
once (`src/volsvc.asm:377-391`).

**28 Write protect disk.** Sets the default drive's bit in the read-only
vector until the next warm boot, disk reset or function 37 for the drive
(`src/cpm/bdosfn.asm:153-166`, `src/cpm/bdosfn.asm:431-447`). Returns nothing.
A later modifying call gives the `R/O` error. Close is the exception: it
succeeds without writing.

**29 Get read-only vector.** Returns the read-only vector in `HL`, bit 0 for A
(`src/cpm/bdosfn.asm:173-176`). A volume that the card marks read-only appears
in it once its drive has been selected (`src/cpm/bdoslog.asm:254-264`).

**30 Set file attributes.** Copies the FCB's name and type with their bit 7
attributes into every entry of the file (`src/cpm/bdosfile.asm:672-678`,
`src/cpm/bdosfile.asm:704-764`). Bit 7 of the first type byte is the
read-only attribute and bit 7 of the second the system attribute, which `DIR`
hides. Returns 0 or `FFh` if there is no such file.

**31 Get disk parameter block address.** Returns in `HL` the address of the
default drive's DPB (`src/cpm/bdosfn.asm:183-189`). After a `MOUNT` onto that
drive it is the new volume's at once, as for function 27.

**32 Set or get user code.** With `E` = `FFh`, reads the user number. With any
other `E`, sets the user number to the low five bits of `E`, as in CP/M 2.2
(`src/cpm/bdosfn.asm:198-213`). Returns the user number in `A` or 0 after a
set. The CCP's `USER` command takes 0 to 15 and the byte at `0004h` holds
only four bits of the number
(`src/cpm/ccpcmd.asm:241-280`, `src/cpm/ccp.asm:363-384`).

**33 Read random.** Reads the record whose number is in the FCB's `R0` and
`R1` into the DMA address and leaves the FCB's extent and `CR` at that record
so that a sequential read after it reads the same record
(`src/cpm/bdosrec.asm:307-316`, `src/cpm/bdosrec.asm:393-531`). Returns 0 on
success. Returns 1 when the record has not been written. Returns 3 when the
current extent can't be closed. Returns 4 when the extent has not been
written. Returns 6 when `R2` is not 0. After a 4 the FCB's `EX` and `S2`
are restored to name the extent described by its record count and allocation
map. A second read of that record returns 4 again and a write can make the
requested extent.

**34 Write random.** Writes the record at the DMA address to the record whose
number is in `R0` and `R1`. It makes the extent when the record falls in one
the file lacks (`src/cpm/bdosrec.asm:328-531`). Returns 0 on success. Returns
2 when the drive is full. Returns 3 when the current extent can't be closed.
Returns 5 when the directory has no entry for the extent. Returns 6 when `R2`
is not 0. After a 5 the FCB's `EX` and `S2` are restored to name the extent
described by its record count and allocation map, as after function 33's 4.
A later write can make the requested extent once a directory entry is free.
An FCB with the read-only attribute set gives the `File R/O` error.

**35 Compute file size.** Sets `R0` to `R2` to the file's size in records,
from whichever of its entries ends highest or to 0 if there is no such file
(`src/cpm/bdosfn.asm:230-325`). Returns `FFh` in `A`.

**36 Set random record.** Sets `R0` to `R2` from the FCB's extent and `CR`,
the record the next sequential call would read or write
(`src/cpm/bdosfn.asm:336-370`). Returns 0.

**37 Reset drive.** Logs out each drive whose bit is set in `DE`, bit 0 for A,
and clears its bit in the read-only vector (`src/cpm/bdosfn.asm:431-447`). The
drive's next selection logs it in again with a full directory scan.
Returns 0.

**38 Access drive** and **39 Free drive.** MP/M's functions, which CP/M 2.2
does not define. Both do nothing and return 0 (`src/tables.asm:96`).

**40 Write random with zero fill.** Function 34, with each allocation block the
write newly allocates filled with zeros before the record is written
(`src/cpm/bdosrec.asm:328-359`, `src/cpm/bdosrec.asm:794-860`). After each
zero-fill write the BIOS DMA address is restored to the program's DMA buffer
before error handling (`src/cpm/bdoslog.asm:122-136`). It is already restored
if the BDOS returns a write error in the mode set by function 45. Returns as
function 34 does.

**44 Set multi-sector count.** With `E` = 1 returns 0. With any other `E`
changes nothing and returns `FFh` in `A` (`src/cpm/bdos.asm:221-237`). TEC-OS
reads and writes one record a call so 1 is the only count.

**45 Set BDOS error mode.** Sets the mode to `E` (`src/cpm/bdos.asm:271-275`).
With `E` = `FFh` a BDOS error returns to the program with `A` = `FFh` and the
error's code in `H`, prints nothing and keeps the rest of a chained line. With
`E` = `FEh` it prints the message first and then returns in the same way. Any
other `E` is the default: the message, a key and the end of the program, with
the rest of a chained line dropped (`src/cpm/bdoscon.asm:47-72`). A warm boot
puts the default back (`src/boot.asm:530-539`, `src/ram.asm:233-237`). Returns 0.
A sequential read or write that returns a transfer error leaves
the FCB on the record it didn't read or write, as in CP/M 3
(`src/cpm/bdosrec.asm:79-103`, `src/cpm/bdosrec.asm:280-288`).

**46 Get disk free space.** Selects the drive in `E`, 0 to 15 for A to P, as
it selects an FCB's drive. It puts the drive's free space in records in the
three bytes at the DMA address, low byte first (`src/cpm/bdosfn.asm:77-145`).
The default drive stays as it was. Returns 0. A drive past D or with no volume
gives the `Select` error.

**47 Chain to program.** Replaces what is left of the CCP's command line with
the command at the DMA address, which ends with a 0 within its first 128
bytes. It ends the program by warm boot and the CCP runs the command next
(`src/cpm/bdos.asm:67-108`). The command may hold `!` and `:`. `E` is ignored.
Warm boot flushes the write-behind records before the CCP loads the command.
If that flush fails, failed cache lines are dropped and `Write lost` cancels
the chain (`src/cache.asm:292-345`, `653-668`). Does not return on success.
Returns `FFh` in `A` for a command with no 0 in its first 128 bytes or with
a CR or LF before the 0. The program then continues with the line unchanged.

**48 Flush buffers.** Writes every changed line of the block cache to the card
(`src/cpm/bdos.asm:285-289`, `src/volsvc.asm:413-428`). `E` = `FFh`, CP/M 3's
purge, gives the same flush. Returns 0 in `A` or `FFh` if any write failed.
Failed lines are dropped, leaving no cached copy for a later retry. Earlier
or partial card writes are not undone. This explicit call reports failure
through its return value, not the warm-boot `Write lost` path
(`src/cache.asm:292-345`, `653-668`).

**99 Truncate file.** Changes nothing (`src/cpm/bdos.asm:90-93`,
`src/cpm/bdos.asm:159-161`). Returns `FFh` in `A`. TEC-OS has no truncate.

**108 Get or set program return code.** With `DE` = `FFFFh`, reads the code.
With any other `DE`, sets the code to `DE` (`src/cpm/bdos.asm:296-314`). All
programs share one code. A cold reset clears it to 0 and warm boot keeps it
(`src/boot.asm:73-79`, `530-539`, `src/ram.asm:310-314`, `386-388`). The
CCP sets the code to 0 as it takes each command and to `FF00h` when a command
fails. A piece of a command line that starts with `:` runs only when the code
is outside `FF00h` to `FFFEh`
(`src/cpm/ccp.asm:224-244`, `280-284`, `619-629`). Returns the code in
`HL` or 0 after a set.

## Other numbers

Every other function number, from 41 to 255 except 44 to 48, 99 and 108, does
nothing and returns 0 in `A` and `HL` (`src/cpm/bdos.asm:162-165`). Function
50, CP/M 3's direct BIOS call, is one of them. A program reaches the BIOS
through its jump table, whose warm boot entry is the address at `0001h`
(`src/boot.asm:419-433`).

## Differences from Digital Research's BDOS

Function 12 reports CP/M 2.2. TEC-OS derives from Portable CP/M, an original
implementation of that interface (`src/cpm/PROVENANCE.md:1-7`). Code written
for Digital Research's BDOS encounters these differences:

- The BDOS code is in ROM. Writing to it cannot install a hook. The BDOS
  calls the RAM BIOS jump table, where a program can replace an entry
  (`src/rom.asm:35-40`, `src/cpm/bdos.asm:14-35`).
- Functions 44 to 48, 99 and 108 occupy selected CP/M 3 numbers with the
  limited meanings above. Function 99 returns `FFh` without truncating.
  Every other number above 40 returns 0 without doing anything
  (`src/cpm/bdos.asm:143-165`).
- The CCP's warm-entry disk reset retains clean drives whose allocation
  vector sums still match. Dirty drives rebuild from the directory up to
  the retained bound while an unmarked sum mismatch requires a full scan.
  A program's function 13 resets every drive
  (`src/cpm/bdosfile.asm:19-132`).
- `^P` during output toggles the list copy. Digital Research's BDOS retains
  that key for input and handles the toggle in line input. TEC-OS also
  echoes every character in function 1, including control characters,
  rather than restricting the echo to printing characters, CR, LF, tab and
  backspace (`src/cpm/bdos.asm:321-330`, `src/cpm/bdoscon.asm:273-286`,
  `318-350`).
- Function 10 uses `^W` and `^N` for history only at the CCP's prompt. A
  program receives those keys as characters (`src/cpm/bdos.asm:545-553`).
- Neither geometry uses the check vector: both set CKS to 0. This mechanism
  therefore does not detect a card exchanged while TEC-OS is running
  (`format/format.json:52`, `59`). Follow the card-change procedure in
  [Chapter 5](05-cards-on-the-pc.md#writing-the-physical-card).
