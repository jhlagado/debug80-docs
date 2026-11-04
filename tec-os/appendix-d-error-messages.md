---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Appendices"
---

# Appendix D. Error messages

Checked against TEC-OS 621201d.

This appendix lists every message TEC-OS prints, with its cause and its
remedy, in the order a run can reach them: cold boot and the diagnostic
prompt, the LCD's words, the CCP, the BDOS and the block cache. `MOUNT`
follows, and then the lines that report no fault. The last column of
each table links to the chapter that explains the message or its subject and
gives the source.

In a message, `d` stands for a drive letter, `n` for a decimal number, `NAME` for
a word from the command line and `LABEL` for a volume's label. `nn` stands for a
code in hexadecimal, except in the list of volumes `MOUNT` prints, where it is
a volume's index in decimal. The rest is printed as it stands.
`tecvol` runs on a PC, and Appendix F describes it. The diagnostics ROM is a
separate image, and Chapter 23 describes it.

## Cold boot

Cold boot checks the RAM once, before the banner. This message goes straight to
the serial port, and TEC-OS then stops in a loop. It doesn't appear on a
display or on the LCD.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `TEC-OS needs 64K RAM` | `8000h–BFFFh` has no RAM, or EXPAND 1, the second half of the chip in U9, is missing. One check tests both. | Fit the 32 KiB RAM chip in socket U9, then reset. | [Appendix G](appendix-g-tec-1g.md#u9-and-the-ram), `src/boot.asm:36`, `src/boot.asm:323-358`, `src/text.asm:5` |

## The diagnostic prompt

A card that can't be started or mounted stops cold boot after the banner:

```text
No volume mounted, error nn
R retry> 
```

The console at this point is the ROM's PICO9918 console on a board with the
PICO9918 and the matrix keyboard, and the serial terminal on any other. The
LCD's last row shows `CARD?` (`src/boot.asm:471-478`, `src/text.asm:8-10`). `R` starts the LCD, the card
and the mount again, so a card fixed or put in while TEC-OS waits at the prompt
mounts with no reset. The key is echoed as typed, and `r` retries too. Any
other key gives the prompt again (`src/boot.asm:479-489`). [Chapter 23](23-diagnostics.md#the-diagnostic-prompt)
explains the prompt.

Codes `01h` to `04h` and `0Bh` come from `SDINIT`, the start of the card
(`src/boot.asm:67-68`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | No answer to `CMD0`, the first command, in 10 tries. An empty socket gives this code. | Put a card in and press `R`. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:141-159` |
| `02` | `ACMD41` didn't report the card ready in 256 tries, or the card answered a `CMD55` with an error bit set. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:180-202` |
| `03` | `CMD58`, which reads the card's capacity type, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:203-230` |
| `04` | `CMD16`, which sets a standard-capacity card's block length, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:219-228` |
| `0B` | The card's answer to `CMD8` echoed another voltage range than 2.7 to 3.6 V, or another check pattern than `AAh`. | Use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:160-178` |

Codes `05h` to `0Ah` are the SD card driver's codes for a block read or write:
command rejected, no data token, write not accepted, card stayed busy, a
standard-capacity card's block 4 GiB or more into it and a data error token
in place of a block's data, rejected before any command
(`src/sd.asm:14-19`). They never reach this prompt. The driver stores them in
`SDERR`, which nothing reads. A failed read during the mount is code `20h`,
and a failed read or write after it is a BDOS error or `Write lost`. The
`MOUNT` program's own reads and writes give the messages in its table below.

Codes `20h` to `2Ah` come from the ROM's `MOUNT` routine, its check of the
container. The first check to fail stops the mount, and no drive stays mounted
(`src/vol.asm:272-276`).
[Appendix E](appendix-e-container-format.md#the-checks-and-their-codes) gives
every check in order, and
[Chapter 18](18-sd-card-and-volumes.md#the-container-s-checks) explains them.

| Code | Cause | Constant |
| --- | --- | --- |
| `20` | Block 0, or a block of the table beyond it, can't be read. | `src/vol.asm:13` |
| `21` | Block 0 doesn't start with `TECOSVOL`: the card holds no container. | `src/vol.asm:14` |
| `22` | The container's major version isn't the one this ROM reads. | `src/vol.asm:15` |
| `23` | The header or descriptor size is wrong, or the header's drives field is above 4. | `src/vol.asm:16` |
| `24` | The number of volumes is 0, above 8 on a format 1.0 card or above 127. | `src/vol.asm:17` |
| `25` | The header's checksum differs, or on a format 1.1 card with a table past block 0 the table's sum. | `src/vol.asm:18` |
| `26` | A descriptor is bad: its id, flags, geometry, length or start. | `src/vol.asm:19` |
| `27` | A volume ends past the container, or on a standard-capacity card past block `7FFFFFh`, the last its byte addresses reach, 4 GiB into the card. A volume that straddles that block is refused too. | `src/vol.asm:21` |
| `28` | A volume starts before the end of the one before it in the table. | `src/vol.asm:22` |
| `29` | A drive letter is invalid, past the number of drives the header gives, or used twice. | `src/vol.asm:23` |
| `2A` | No volume is on drive A. | `src/vol.asm:24` |

For code `20h`, press `R`. For the others, and for a `20h` that comes back,
`R` gives the same code until the card changes. Copy the card to a PC and run
`tecvol verify` on the copy, as Chapter 4's
[recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut) shows.
`tecvol verify` prints the fault in words. `tecvol get` makes the same check,
so it reads no file from a copy that fails it. Write a new image with
`tecvol create` or a new starter card.

## The LCD's words

TEC-OS writes two words on the 20 × 4 LCD's last row, for a board that may
have no terminal attached.
[Chapter 5](05-startup-and-services.md#words-on-the-lcd) explains when each is
written and cleared.

| Word | Cause | Remedy | See |
| --- | --- | --- | --- |
| `CARD?` | TEC-OS is waiting at the diagnostic prompt. | As for the prompt. `R` starts the LCD again, so a retry that works clears the word. | [Chapter 21](21-startup.md#the-lcd-s-words), `src/boot.asm:472-473`, `src/text.asm:10` |
| `GLCD?` | `CON UC1` couldn't load or install `A:GLCD.SVC`: the file is missing or bad, or the board has no graphics LCD or no matrix keyboard. The console stays where it was. | Put `GLCD.SVC` on drive A. The word stays until `GLCD.SVC` loads or a reset. | [Chapter 5](05-startup-and-services.md#words-on-the-lcd), `src/loader.asm:495-508`, `src/loader.asm:527-533`, `drivers/glcd.asm:38-50`, `src/text.asm:65` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h`, and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:377-381`, `src/cpm/ccp.asm:143-155`).
[Chapter 11](11-chaining-commands.md#a-command-that-depends-on-the-one-before)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched nothing, or only files with the system attribute. `TYPE` found no such file or was given no name. `ERA` matched nothing. `REN` found no file of the old name. | Check the name, the drive and the user area: a file in another user area isn't found. | [Chapter 3](03-command-line.md#the-ccp-s-messages), `src/cpm/ccpfile.asm:150-154`, `src/cpm/ccpfile.asm:410-412`, `src/text.asm:15-16` |
| `FILE EXISTS` | `REN` found a file with the new name on its drive. | `ERA` that file or choose another name. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:512-531`, `src/text.asm:43-44` |
| `NO SPACE` | `SAVE` couldn't make the file, write a record or close the file: the drive or its directory is full. `SAVE` erases any file of that name first, so an old copy is gone. After a failed write `SAVE` closes the file, which then holds the records written before the drive filled. | `ERA` the part file and other files on the drive, or `SAVE` to another drive. | [Chapter 3](03-command-line.md#save), `src/cpm/ccpcmd.asm:221-228`, `src/cpm/ccpcmd.asm:229-278`, `src/text.asm:45-46` |
| `NO SOURCE` | `COPY`'s source isn't on its drive in the current user area. Nothing has changed. | Check the name, the drive and the user area. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:603-607`, `src/text.asm:27-28` |
| `CANNOT MAKE DEST` | `COPY` couldn't make the destination: its directory is full. | `ERA` files on that drive, or copy to another drive. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:608-614`, `src/text.asm:29-30` |
| `WRITE ERROR` | `COPY` couldn't write a record: the drive is full, or the directory has no entry for the next extent. `COPY` closes the destination first, so it holds the records written before the failure. | `ERA` the destination, free some space and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:622-625`, `src/cpm/ccpfile.asm:644-649`, `src/text.asm:31-32` |
| `CLOSE ERROR` | `COPY` read the whole source, but function 16 found no directory entry for the destination. On the host model this message came only from a run that altered the destination's name in the FCB. | `DIR` the destination and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:630-635`, `src/text.asm:33-34` |

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:358-373`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Any other built-in prints
its first argument, whichever argument was wrong, and prints the question mark
alone when it needs an argument and has none.
[Chapter 3](03-command-line.md#file-names) has examples.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` on the drive in the current user area or in user 0. When the command names no drive and the current drive isn't A, none on drive A in the current user area or in user 0 either. A type other than `.SVC` is ignored, so `PICO.DRV` looks for `PICO.COM`. With the graphics LCD chosen, the web page reports a card with no `GLCD.SVC` and a `.DRV` display file when it powers on, naming `GLCD.DRV` if the card has it and another of them if not. | Check the name, the drive and the user area, or name the drive, as `B:NAME`. A card from an older TEC-OS needs the steps in [Chapter 5](05-startup-and-services.md#a-card-from-an-older-tec-os). | [Chapter 3](03-command-line.md#running-a-program), `src/cpm/ccp.asm:298-316`, `src/cpm/ccp.asm:383-410`, `host/card.mjs:41-44` |
| A program's name | The name is ambiguous or has no name part, is longer than 8 and 3 characters, has a bad character or names a drive past P. | Correct the name. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccp.asm:256`, `src/cpm/ccp.asm:278-280`, `src/cpm/ccpcmd.asm:319-409`, `src/cpm/ccpcmd.asm:415-446` |
| A program's name | `NAME.COM` doesn't fit below the BDOS's entry, the address in the word at `0006h`. | Use `UNLOAD` to free service resident memory. | [Chapter 17](17-ccp.md#loading-a-program), `src/cpm/ccp.asm:425-427`, `src/cpm/ccp.asm:441-449` |
| `NAME.SVC` | The file is missing or doesn't read, isn't a service of format 4, or fails while installing. `GLCD.SVC` also fails when the graphics LCD or the matrix keyboard is missing, when it is in already, or on a ROM before ABI 5.1. An old card's `PICO.SVC` fails too, since `CRT:`'s table is the ROM's. From `STARTUP.CMD`, a driver whose `INIT` finds its device absent prints nothing, so the starter card's `GLCD.SVC` line is quiet on a board with no graphics LCD. On a board with both displays a `GLCD.SVC` line in `STARTUP.CMD` passes over quietly and loads nothing, and a `GLCD.SVC` typed at the prompt loads and gives way to the PICO9918 with no message. A service whose record is refused after its `INIT` succeeds prints its name from `STARTUP.CMD`, whatever `INIT` returned in `A`. | Check the board, the name and `SERVICES`. A card from an older TEC-OS needs the steps in Chapter 5, and its `PICO.SVC` line can go. | [Chapter 21](21-startup.md#the-quiet-rule), [Chapter 20](20-hardware-services-and-service-loader.md#a-failed-load), `src/loader.asm:515-530`, `src/loader.asm:97-127`, `src/loader.asm:272-274`, `src/cpm/ccp.asm:288-296`, `src/services.asm:368-380`, `drivers/glcd.asm:38-50` |
| `UNLOAD` | No service is installed, or the newest can't be removed: its flags mark it as not removable, or its `REMOVE` returned carry. | Services go newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/cpm/ccpcmd.asm:8-10`, `src/loader.asm:61-71` |
| `COPY` | A name is missing or has a wildcard, the destination is the source or something follows the destination. | Name one source and a destination that differs, and nothing after it. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:571-598` |
| `ERA` | No name, more than one, or a bad name. | `ERA NAME`. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:420-424` |
| `REN` | The form isn't `NEW=OLD`, a name has a wildcard, a name is missing, or the names give two different drives. | `REN NEW=OLD`, with a drive on one name or the same drive on both. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:473-507` |
| `SAVE` | The count isn't a decimal number below 256, it reaches the page of the address at `0006h`, or the name is missing or has a wildcard. | `SAVE n NAME.COM`, with a smaller count. | [Chapter 3](03-command-line.md#save), `src/cpm/ccpcmd.asm:176-219` |
| `USER` | The argument isn't a number from 0 to 15. | `USER n`. | [Chapter 3](03-command-line.md#user-areas), `src/cpm/ccpcmd.asm:142-168` |
| `CON` | The argument isn't `TTY`, `CRT`, `BAT`, `UC1`, `PICO` or `GLCD`, with or without a colon, or something follows it. A width after `CRT` or `PICO` that isn't 80, 40 or 32, a width with no space before it, as in `CON CRT80`, a width after another name, and a width while the ROM's PICO9918 console isn't running or while a program has claimed the PICO9918 are refused too. The word printed is the width when a width follows the name. From `STARTUP.CMD`, a width line on a board with no PICO9918 console prints nothing. | Use one of the six names, and a width of 80, 40 or 32 after `CRT` or `PICO` on a board with the PICO9918 and the matrix keyboard. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccpcmd.asm:38-119`, `src/pico.asm:49-65` |
| `DIR` or `TYPE` | `DIR` has more than one argument or a bad name. `TYPE` has more than one, a wildcard, a bad name or no name part. | Name one file for `TYPE`, one pattern for `DIR`. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccpfile.asm:15-17`, `src/cpm/ccpfile.asm:363-366` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/text.asm:49-50`).

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. By default the BDOS then waits for a key and ends the
program or command by warm boot with the rest of a chained line dropped,
whatever the key (`src/cpm/bdos.asm:77-79`, `src/cpm/bdoscon.asm:25-41`,
`src/cpm/bdoscon.asm:61-72`). A program can take the errors itself with BDOS
function 45. With `E` = `FFh` the error returns to the program with `A` =
`FFh`, `H` the code in the table and no message, and with `FEh` the message is
printed first and the error then returns the same way. Neither drops the rest
of a chained line, and a sequential read or write that returns an error leaves
the FCB on the record it didn't read or write. Every warm boot puts the default
back (`src/cpm/bdos.asm:166-173`, `src/ram.asm:144-146`).
[Chapter 16](16-bdos.md#bdos-errors) explains them and
[Appendix A](appendix-a-bdos-functions.md#calling-a-function) lists them by
function.

| Message | Code | Cause | Remedy | See |
| --- | ---: | --- | --- | --- |
| `Bdos Err On d: Select` | 4 | The drive has no volume or is past D, or a program's FCB has `?` in its drive byte outside function 17. The warm boot gives a prompt on drive A if the drive at `0004h` has no volume (`src/cpm/ccp.asm:33-43`). | `MOUNT` a volume on the drive, or use another drive. | [Chapter 3](03-command-line.md#drives), `src/cpm/bdoslog.asm:575-578`, `src/text.asm:58` |
| `Bdos Err On d: R/O` | 2 | A program changed a drive that function 28 made read-only: a write, a make, delete, rename or attribute change. A close writes nothing there and gives no error. | The warm boot clears the state, as CP/M 2.2's does. Run the program again, and correct a program that writes to a drive it protected. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdoslog.asm:567-571`, `src/cpm/bdosfile.asm:169-172`, `src/cpm/bdosfile.asm:33-40`, `src/text.asm:60` |
| `Bdos Err On d: R/O` | 2 | A change to a volume the card marks read-only. `SAVE`, `ERA`, `REN` and `COPY` onto such a volume give it too. The card isn't changed. | Use a volume that takes writes. The volume's read-only flag is set when the card is built. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdoslog.asm:159-164`, `src/cpm/bdoslog.asm:567-571`, `src/text.asm:60` |
| `Bdos Err On d: File R/O` | 3 | A delete, a rename or a sequential or random write reached a file with the read-only attribute. `ERA`, `REN`, `SAVE` and `COPY` onto such a file give it too. An `ERA` with a wildcard has already erased the matching files before it in the directory. | Clear the attribute with BDOS function 30, or on a PC `tecvol get` the file and `tecvol put` it without `--ro`. The CCP has no command for it. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdosfile.asm:253-261`, `src/cpm/bdosfile.asm:385`, `src/cpm/bdosfile.asm:428-433`, `src/cpm/bdosrec.asm:217`, `src/text.asm:61-62` |
| `Bdos Err On d: Bad Sector` | 1 | A record or a directory record couldn't be read from the card or written to it. | Copy the card to a PC and run `tecvol verify`. Replace a card that keeps failing. | [Chapter 16](16-bdos.md#bdos-errors), `src/cpm/bdosrec.asm:175`, `src/cpm/bdosrec.asm:48-57`, `src/cpm/bdoslog.asm:76-78`, `src/cpm/bdoscon.asm:21-23` |
| `Bdos Err On d: Bad Sector` | 1 | The volume runs past the end of the card. The card rejects a block past its end, and no other block of the card changes. | Use a card that holds the whole container, or build the card again with `tecvol create` so that every volume lies on the card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:272-279`, `src/sd.asm:498-506` |
| `Bdos Err On d: Bad Sector` | 1 | A directory entry names an allocation block past the end of the volume: the directory is damaged. The drive logs in and the rest of the volume works, and reading that block gives this. | `ERA` takes the file. Run `tecvol verify` on a copy, as in [Chapter 4](04-cards-and-volumes.md#recovery-after-a-power-cut). | [Chapter 16](16-bdos.md#files-extents-and-records), `src/cpm/bdosrec.asm:534`, `src/cpm/bdoslog.asm:468-475`, `src/cpm/bdoscon.asm:46-49` |

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS tries every changed block in the cache, drops
each one whose write fails, so that the card keeps its old copy of that block,
and prints this message once, on a line of its own, if any failed. It also
drops the rest of a chained line (`src/cache.asm:182-208`,
`src/cache.asm:375-384`, `src/text.asm:69`).

The changes in the dropped blocks are lost, and the next warm boot has nothing
more to say. A directory block that can't be written, or whose data blocks
can't, isn't kept either: its cache line is dropped and the BDOS reports `Bad
Sector` during the run, and the warm boot after the key says nothing
(`src/cache.asm:367-373`). The file that was being written needs writing
again, once the card is put right and the board reset. Changes still in the
cache when a card comes out are lost, even with the same card put back, since
only cold boot starts a card (`src/boot.asm:67`), and the first warm boot after
it gives `Write lost`. BDOS function 48 reports a failure to a program at
once: it writes every changed block and returns `A` = `FFh` if any write failed
(`src/cpm/bdos.asm:175-180`).
[Chapter 19](19-block-cache.md#write-lost) explains the mechanism and
[Chapter 4](04-cards-and-volumes.md#the-block-cache-and-the-volume-written-behind)
the volume written behind.

## `MOUNT`

This program on the starter card prints its own messages
(`test/programs/mount.asm:31`, `test/programs/mount.asm:255-262`). After each
message the program returns to the prompt with a return code of 0, so a `:`
piece after it runs.
[Chapter 4](04-cards-and-volumes.md#drives-and-mount) explains the
program, and [Chapter 18](18-sd-card-and-volumes.md#the-volume-services) the
volume services behind it.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `MOUNT [D: [NAME or INDEX]]` | The usage line: the argument doesn't start with a drive letter from A to D and a colon. | `MOUNT` alone to list the volumes, `MOUNT B: NAME`, `MOUNT B: 2`, or `MOUNT B:` to empty the drive. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:33-44`, `test/programs/mount.asm:241-242` |
| `No such volume` | No volume has that label or index. A failed read of the table gives this too. | `MOUNT` with no argument lists the labels and indexes. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:106-107`, `test/programs/mount.asm:129-130`, `src/vol.asm:707-737` |
| `Cannot mount: in use or too large` | The volume is on another drive, the drive has no vector or one too small for the volume, or writing the cache's changes to the card failed. | Empty the other drive first with `MOUNT d:`. For size, use a drive whose vector takes the volume, as [Chapter 4](04-cards-and-volumes.md#drives-and-their-cost-in-memory) explains. A failed write drops the changes the cache held for those blocks, as under `Write lost`, and no message follows. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `src/vol.asm:596-608`, `src/vol.asm:626-636`, `src/vol.asm:679-688` |
| `Cannot unmount` | The drive is A, which always has a volume, or writing the cache's changes to the card failed. | Mount another volume on drive A in place of the one there. A failed write drops the changes the cache held for those blocks, as under `Write lost`, and no message follows. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `src/vol.asm:642-648` |
| `MOUNT needs TEC-OS with ABI 5.` | The ROM table is missing, or its major version isn't 5: the program is from another version of TEC-OS. | Use the `MOUNT.COM` that matches the ROM, from a new starter card. | [Chapter 9](09-hardware-services.md#checking-for-tec-os), `test/programs/mount.asm:14-31` |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The banner on the console at cold boot. The LCD's first row has `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-introduction.md#turning-it-on), `src/text.asm:6`, `src/text.asm:53` |
| `d: LABEL` | A drive and its volume's label, at cold boot. A volume the card marks read-only has ` (read-only)` after the label. The LCD's two rows below the banner show drives A and B in the same form, with no read-only mark. | [Chapter 1](01-introduction.md#turning-it-on), `src/boot.asm:360-383`, `src/lcd.asm:69-89`, `src/lcd.asm:91-114`, `src/text.asm:7` |
| `n files, nK free` | `DIR`'s last line: the files listed and the space free on the drive. One file gives `1 file, nK free`. | [Chapter 3](03-command-line.md#dir), `src/text.asm:17-22` |
| `[more]` | `DIR` or `TYPE` has filled the screen. Any key shows the next screen. Esc, `Q`, `q` and `;` end the listing, and `^C` and `#` also drop the rest of a chained line, since the test clears bit 5 of the key before it compares. | [Chapter 2](02-console.md#pauses-in-long-listings), `src/cpm/ccpfile.asm:288-320`, `src/text.asm:23-24` |
| `ALL (Y/N)?` | `ERA` was given a name that is all wildcards. A line that starts with `Y` or `y` erases every file of the current user area on the drive. Any other line erases nothing, and the command counts as a success. A Return alone is the whole answer and erases nothing. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:429-453`, `src/text.asm:47-48` |
| `COPIED nnnn` | `COPY` finished. `nnnn` is the number of records, in hexadecimal. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccpfile.asm:636-642`, `src/text.asm:35-36` |
| `CON: TTY:`, `CON: CRT:`, `CON: UC1:` | The console mode in effect, after `CON`. A `CON CRT` on a board with no PICO9918 console reports `TTY:`, and a `CON UC1` that can't take effect reports the console in use. `CON: BAT:` goes to the list device, which discards it, so it appears nowhere. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccpcmd.asm:120-137`, `src/console.asm:53-55`, `src/console.asm:331`, `src/text.asm:37-42` |
| `NAME n` | `SERVICES`: a service's name and its pages, the newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/cpm/ccpcmd.asm:529-551` |
| `d: LABEL` from `MOUNT` | The drive and the volume now on it, also when the volume was there already. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:149-157` |
| `Unmounted` | `MOUNT d:` has emptied the drive. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:49-57` |
| `nn LABEL G1M`, `nn LABEL G8M` | `MOUNT` with no argument: a volume's index in decimal, its label and its geometry, with ` R/O` after a read-only volume and the drive after a mounted one, as `d:`. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:159-208` |
