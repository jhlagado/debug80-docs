---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Appendices"
---

# Appendix D. Error messages

Checked against TEC-OS 1f9542d.

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
| `TEC-OS needs 64K RAM` | `8000h–BFFFh` has no RAM, or EXPAND 1, the second half of the chip in U9, is missing. One check tests both. | Fit the 32 KiB RAM chip in socket U9, then reset. | [Chapter 1](01-introduction.md#the-board), `src/boot.asm:22`, `src/boot.asm:279-309`, `src/data.asm:12` |

## The diagnostic prompt

A card that can't be started or mounted stops cold boot after the banner:

```text
No volume mounted, error nn
R retry, H header> 
```

The console is the serial terminal at this point, and the LCD's last row shows
`CARD?` (`src/diag.asm:5-14`, `src/data3.asm:4-5`). `R` starts the LCD, the card
and the mount again, so a card fixed or put in while TEC-OS waits at the prompt
mounts with no reset. `H` prints the first 64 bytes of the last block read and
gives the prompt again, and so does any other key, with no bytes printed
(`src/diag.asm:22-46`). [Chapter 23](23-diagnostics.md#the-diagnostic-prompt)
explains the prompt and [Chapter 1](01-introduction.md#a-card-that-won-t-mount)
shows it.

Codes `01h` to `04h` come from `SDINIT`, the start of the card
(`src/boot.asm:42-43`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | No answer to `CMD0`, the first command, in 10 tries. An empty socket gives this code. | Put a card in and press `R`. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:120-138` |
| `02` | `ACMD41` didn't report the card ready in 256 tries. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:153-171` |
| `03` | `CMD58`, which reads the card's capacity type, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:172-199` |
| `04` | `CMD16`, which sets a standard-capacity card's block length, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:188-197` |

Codes `05h` to `09h` are the SD card driver's codes for a block read or write:
command rejected, no data token, write not accepted, card stayed busy and a
standard-capacity card's block 4 GiB or more into it, rejected before any
command (`src/sd.asm:14-18`). They never reach this prompt. The driver stores them in
`SDERR`, which nothing reads. A failed read during the mount is code `20h`,
and a failed read or write after it is a BDOS error or `Write lost`. The
`MOUNT` program's own reads and writes give the messages in its table below.

Codes `20h` to `2Ah` come from the ROM's `MOUNT` routine, its check of the
container. The first check to fail stops the mount, and no drive stays mounted
(`src/vol.asm:251-255`).
[Appendix E](appendix-e-container-format.md#the-checks-and-their-codes) gives
every check in order, and
[Chapter 18](18-sd-card-and-volumes.md#the-container-s-checks) explains them.

| Code | Cause | Constant |
| --- | --- | --- |
| `20` | Block 0, or a block of the table beyond it, can't be read. | `src/vol.asm:8` |
| `21` | Block 0 doesn't start with `TECOSVOL`: the card holds no container. | `src/vol.asm:9` |
| `22` | The container's major version isn't the one this ROM reads. | `src/vol.asm:10` |
| `23` | The header or descriptor size is wrong, or the header's drives field is above 4. | `src/vol.asm:11` |
| `24` | The number of volumes is 0 or above 127. | `src/vol.asm:12` |
| `25` | The header's checksum differs, or on a format 1.1 card with a table past block 0 the table's sum. | `src/vol.asm:13` |
| `26` | A descriptor is bad: its id, flags, geometry, length or start. | `src/vol.asm:14` |
| `27` | A volume ends past the container. | `src/vol.asm:15` |
| `28` | A volume starts before the end of the one before it in the table. | `src/vol.asm:16` |
| `29` | A drive letter is invalid, past the number of drives the header gives, or used twice. | `src/vol.asm:17` |
| `2A` | No volume is on drive A. | `src/vol.asm:18` |

For code `20h`, press `R`. For the others, and for a `20h` that comes back,
`R` gives the same code until the card changes. Copy the card to a PC and run
`tecvol verify` on the copy, as Chapter 4's
[recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut) shows.
`tecvol verify` prints the fault in words. `tecvol get` makes the same check,
so it reads no file from a copy that fails it. Write a new image with
`tecvol create` or a new starter card.

## The LCD's words

TEC-OS writes three words on the 20 × 4 LCD's last row, for a board that may
have no terminal attached.
[Chapter 5](05-startup-and-services.md#words-on-the-lcd) explains when each is
written and cleared.

| Word | Cause | Remedy | See |
| --- | --- | --- | --- |
| `CARD?` | TEC-OS is waiting at the diagnostic prompt. | As for the prompt. `R` starts the LCD again, so a retry that works clears the word. | [Chapter 21](21-startup.md#the-lcd-s-words), `src/diag.asm:7-8`, `src/data3.asm:106` |
| `PICO?` | At the first prompt after startup, a board with a PICO9918 and a matrix keyboard has no display driver in. The driver's file may be missing or bad, `STARTUP.CMD` may be missing or have no display line, or startup was skipped. | Correct the card from the serial terminal or on a PC. On a running board, a `PICO.SVC` that loads clears the word. | [Chapter 21](21-startup.md#stdone), `src/svc.asm:482-493`, `src/data3.asm:107` |
| `GLCD?` | `CON UC1` couldn't load or install `A:GLCD.SVC`: the file is missing or bad, or the board has no graphics LCD or no matrix keyboard. The console stays where it was. | Put `GLCD.SVC` on drive A. The word stays until a display driver takes the console or a reset. | [Chapter 5](05-startup-and-services.md#words-on-the-lcd), `src/glcd.asm:61-74`, `src/glcd.asm:95-97`, `drivers/glcd.asm:43-45`, `src/data3.asm:105` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h`, and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:355-359`, `src/cpm/ccp.asm:125-137`).
[Chapter 11](11-chaining-commands.md#a-command-that-depends-on-the-one-before)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched nothing, or only files with the system attribute. `TYPE` found no such file or was given no name. `ERA` matched nothing. `REN` found no file of the old name. | Check the name, the drive and the user area: a file in another user area isn't found. | [Chapter 3](03-command-line.md#the-ccp-s-messages), `src/cpm/ccp.asm:559-562`, `src/cpm/ccp.asm:853-855`, `src/data3.asm:10-11` |
| `FILE EXISTS` | `REN` found a file with the new name on its drive. | `ERA` that file or choose another name. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:948-967`, `src/data3.asm:64-65` |
| `NO SPACE` | `SAVE` couldn't make the file, write a record or close the file: the drive or its directory is full. `SAVE` erases any file of that name first, so an old copy is gone and a part of the new file can remain, in whole extents of 16 KiB. | `ERA` files on the drive, or `SAVE` to another drive. Press `^C` before `DIR` to see the space free: the allocation blocks of the unclosed extent stay counted as used until a warm boot. | [Chapter 3](03-command-line.md#save), `src/cpm/ccp.asm:1247-1256`, `src/cpm/ccp.asm:1274-1298`, `src/data3.asm:66-67` |
| `NO SOURCE` | `COPY`'s source isn't on its drive in the current user area. Nothing has changed. | Check the name, the drive and the user area. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1033-1037`, `src/data3.asm:40-41` |
| `CANNOT MAKE DEST` | `COPY` couldn't make the destination: its directory is full. | `ERA` files on that drive, or copy to another drive. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1038-1044`, `src/data3.asm:42-43` |
| `WRITE ERROR` | `COPY` couldn't write a record: the drive is full, or the directory has no entry for the next extent. The destination isn't closed. It keeps only the extents already written to its directory, so its length is a multiple of 16 KiB, and 0 if the first extent was the one being written. | `ERA` the destination, free some space, press `^C` to give back the allocation blocks of the unclosed extent, and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1051-1056`, `src/data3.asm:44-45` |
| `CLOSE ERROR` | `COPY` read the whole source, but function 16 found no directory entry for the destination. On the host model this message came only from a run that altered the destination's name in the FCB. | `DIR` the destination and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1061-1066`, `src/data3.asm:46-47` |

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:333-353`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Any other built-in prints
its first argument, whichever argument was wrong, and prints the question mark
alone when it needs an argument and has none.
[Chapter 3](03-command-line.md#file-names) has examples.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` on the drive in the current user area, and none on drive A either when the command names no drive. A type other than `.SVC` is ignored, so `PICO.DRV` looks for `PICO.COM`. The web page reports a card with no `.SVC` file for the chosen display and a `.DRV` display file when it powers on, naming the chosen display's `.DRV` file if the card has it and another of them if not. | Check the name, the drive and the user area, or name the drive, as `B:NAME`. A card from an older TEC-OS needs the steps in [Chapter 5](05-startup-and-services.md#a-card-from-an-older-tec-os). | [Chapter 3](03-command-line.md#running-a-program), `src/cpm/ccp.asm:277-295`, `host/card.mjs:37-40` |
| A program's name | The name is ambiguous or has no name part, is longer than 8 and 3 characters, has a bad character or names a drive past P. | Correct the name. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccp.asm:232`, `src/cpm/ccp.asm:264-266`, `src/cpm/ccp.asm:1338-1440`, `src/cpm/ccp.asm:1445-1495` |
| A program's name | `NAME.COM` doesn't fit below the BDOS's entry, the address in the word at `0006h`. | Use `UNLOAD` to free service resident memory. | [Chapter 17](17-ccp.md#loading-a-program), `src/cpm/ccp.asm:373-375`, `src/cpm/ccp.asm:392-404` |
| `NAME.SVC` | The file is missing or doesn't read, isn't a service of format 4, or fails while installing. A display driver also fails when its display or the matrix keyboard is missing, or when that display has a driver already. `GLCD.SVC` also fails while the PICO9918 is the console, and only `CON UC1` installs it then, so the starter card's `STARTUP.CMD` gives `GLCD.SVC?` at each boot on a board with both displays. | Check the board, the name and `SERVICES`. A card from an older TEC-OS needs the steps in Chapter 5. With the PICO9918 as the console, `GLCD.SVC?` from `STARTUP.CMD` needs no remedy. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), [Chapter 20](20-hardware-services-and-service-loader.md#a-failed-load), `src/glcd.asm:79-94`, `src/svc.asm:77-105`, `drivers/pico.asm:47-60`, `drivers/glcd.asm:33-54` |
| `UNLOAD` | No service is installed, or the newest can't be removed, as `PICO.SVC` can't be while the PICO9918 is the console. | `CON TTY` first for a console driver. Services go newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/cpm/ccp.asm:1105-1107`, `src/svc.asm:44-54` |
| `COPY` | A name is missing or has a wildcard, or the destination is the source. | Name one source and a destination that differs. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1002-1028` |
| `ERA` | No name, more than one, or a bad name. | `ERA NAME`. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:858-862` |
| `REN` | The form isn't `NEW=OLD`, a name has a wildcard, a name is missing, or the names give two different drives. | `REN NEW=OLD`, with a drive on one name or the same drive on both. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:909-943` |
| `SAVE` | The count isn't decimal, it reaches the page of the address at `0006h`, or the name is missing or has a wildcard. | `SAVE n NAME.COM`, with a smaller count. | [Chapter 3](03-command-line.md#save), `src/cpm/ccp.asm:1202-1246` |
| `USER` | The argument isn't a number from 0 to 15. | `USER n`. | [Chapter 3](03-command-line.md#user-areas), `src/cpm/ccp.asm:1169-1196` |
| `CON` | The argument isn't `TTY`, `CRT`, `BAT` or `UC1`, or something follows it. | Use one of the four names. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccp.asm:1113-1166` |
| `DIR` or `TYPE` | `DIR` has more than one argument or a bad name. `TYPE` has more than one, a wildcard, a bad name or no name part. | Name one file for `TYPE`, one pattern for `DIR`. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccp.asm:424-426`, `src/cpm/ccp.asm:809-812` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/data3.asm:70-71`).

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. The BDOS then waits for a key and ends the program or
command by warm boot with the rest of a chained line dropped, whatever the key
(`src/cpm/bdos.asm:75-77`, `src/cpm/bdos.asm:2421-2431`).
[Chapter 16](16-bdos.md#bdos-errors) explains them and
[Appendix A](appendix-a-bdos-functions.md#calling-a-function) lists them by
function.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `Bdos Err On d: Select` | The drive has no volume or is past D, or a program's FCB has `?` in its drive byte outside function 17. The warm boot gives a prompt on drive A if the drive at `0004h` has no volume (`src/cpm/ccp.asm:33-43`). | `MOUNT` a volume on the drive, or use another drive. | [Chapter 3](03-command-line.md#drives), `src/cpm/bdos.asm:2383-2386`, `src/data3.asm:87` |
| `Bdos Err On d: R/O` | A program changed a drive that function 28 made read-only: a write, the close of a file written to, a make, delete, rename or attribute change. | The warm boot clears the state, as CP/M 2.2's does. Run the program again, and correct a program that writes to a drive it protected. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdos.asm:2366-2378`, `src/cpm/bdos.asm:570-571`, `src/cpm/bdos.asm:457-458`, `src/data3.asm:89` |
| `Bdos Err On d: R/O` | A change to a volume the card marks read-only. `SAVE`, `ERA`, `REN` and `COPY` onto such a volume give it too. The card isn't changed. | Use a volume that takes writes. The volume's read-only flag is set when the card is built. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdos.asm:1944-1949`, `src/cpm/bdos.asm:2366-2378`, `src/data3.asm:89` |
| `Bdos Err On d: File R/O` | A delete, a rename or a sequential or random write reached a file with the read-only attribute. `ERA`, `REN`, `SAVE` and `COPY` onto such a file give it too. An `ERA` with a wildcard has already erased the matching files before it in the directory. | Clear the attribute with BDOS function 30, or on a PC `tecvol get` the file and `tecvol put` it without `--ro`. The CCP has no command for it. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdos.asm:637-645`, `src/cpm/bdos.asm:763`, `src/cpm/bdos.asm:798-803`, `src/cpm/bdos.asm:982`, `src/data3.asm:90` |
| `Bdos Err On d: Bad Sector` | A record or a directory record couldn't be read from the card or written to it. | Copy the card to a PC and run `tecvol verify`. Replace a card that keeps failing. | [Chapter 16](16-bdos.md#bdos-errors), `src/cpm/bdos.asm:955`, `src/cpm/bdos.asm:1266`, `src/cpm/bdos.asm:1836`, `src/cpm/bdos.asm:1871` |
| `Bdos Err On d: Bad Sector` | The volume runs past the end of the card, or lies 4 GiB or more into a standard-capacity card, whose byte addresses can't reach that far. The card rejects a block past its end, and the driver rejects a block past 4 GiB before any command. No other block of the card changes. | Use a card that holds the whole container, or for a volume past 4 GiB a high-capacity card. Or build the card again with `tecvol create` so that every volume lies below both limits. | [Chapter 18](18-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:207-236`, `src/sd.asm:264-266`, `src/sd.asm:447-449` |
| `Bdos Err On d: Bad Sector` | A directory entry names an allocation block past the end of the volume: the directory is damaged. The drive logs in and the rest of the volume works, and reading that block gives this. | `ERA` takes the file. Run `tecvol verify` on a copy, as in [Chapter 4](04-cards-and-volumes.md#recovery-after-a-power-cut). | [Chapter 16](16-bdos.md#files-extents-and-records), `src/cpm/bdos.asm:1285`, `src/cpm/bdos.asm:2272-2279`, `src/cpm/bdos.asm:2407-2411` |

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS writes every changed block in the cache, then
prints this message on a line of its own if any such write has failed since the
last warm boot, including one that a later attempt got through. It also drops
the rest of a chained line (`src/cache.asm:356-365`, `src/data3.asm:112`).

A flush stops at the first block that fails. That block and those after it stay
in the cache, and each warm boot writes them again and prints the message again
while the failure lasts (`src/cache.asm:204-219`). A directory block that can't
be written isn't kept: its cache line is dropped, the BDOS reports `Bad Sector`,
and the warm boot after the key prints `Write lost` too
(`src/cache.asm:345-352`).

The data stays in the cache until a reset or a loss of power, either of which
discards it, so don't reset the board first. Put right what stopped the write
and press `^C` at the prompt for another warm boot. A warm boot with no message
means the flush reached the card. On the [host model](25-host-model.md), a
write failure that cleared with the card left in place gave that result at the
next `^C`. Changes still in the cache when a card comes out are lost, even with
the same card put back: each `^C` gives `Write lost` again, since only cold boot
starts a card (`src/boot.asm:42`), and the reset that starts it discards them.
If the message keeps coming and the board has to be reset, the changes are lost
and the file needs writing again.
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
| `No such volume` | No volume has that label or index. A failed read of the table gives this too. | `MOUNT` with no argument lists the labels and indexes. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:106-107`, `test/programs/mount.asm:129-130`, `src/vol.asm:710-738` |
| `Cannot mount: in use or too large` | The volume is on another drive, the drive has no vector or one too small for the volume, or writing the cache's changes to the card failed. | Empty the other drive first with `MOUNT d:`. For size, use a drive whose vector takes the volume, as [Chapter 4](04-cards-and-volumes.md#drives-and-their-cost-in-memory) explains. A failed write is `Write lost`'s case. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `src/vol.asm:606-618`, `src/vol.asm:636-646`, `src/vol.asm:683-692` |
| `Cannot unmount` | The drive is A, which always has a volume, or writing the cache's changes to the card failed. | Mount another volume on drive A in place of the one there. A failed write is `Write lost`'s case. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `src/vol.asm:648-654` |
| `MOUNT needs TEC-OS with ABI 5.` | The ROM table is missing, or its major version isn't 5: the program is from another version of TEC-OS. | Use the `MOUNT.COM` that matches the ROM, from a new starter card. | [Chapter 9](09-hardware-services.md#checking-for-tec-os), `test/programs/mount.asm:14-31` |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The banner on the console at cold boot. The LCD's first row has `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-introduction.md#the-first-boot), `src/data.asm:13`, `src/data2.asm:8` |
| `d: LABEL` | A drive and its volume's label, at cold boot. A volume the card marks read-only has ` (read-only)` after the label. The LCD's two rows below the banner show drives A and B in the same form, with no read-only mark. | [Chapter 1](01-introduction.md#the-first-boot), `src/vol.asm:807-836`, `src/lcd.asm:67-104`, `src/data2.asm:11` |
| `n files, nK free` | `DIR`'s last line: the files listed and the space free on the drive. One file gives `1 file, nK free`. | [Chapter 3](03-command-line.md#dir), `src/data3.asm:12-17` |
| `[more]` | `DIR` or `TYPE` has filled the screen. Any key shows the next screen. Esc, `Q`, `q` and `;` end the listing, and `^C` and `#` also drop the rest of a chained line, since the test clears bit 5 of the key before it compares. | [Chapter 2](02-console.md#pauses-in-long-listings), `src/cpm/ccp.asm:723-755`, `src/data3.asm:18-19` |
| `ALL (Y/N)?` | `ERA` was given a name that is all wildcards. A line that starts with `Y` or `y` erases every file of the current user area on the drive. Any other line erases nothing, and the command counts as a success. A Return alone is the whole answer and erases nothing. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:868-895`, `src/data3.asm:68-69` |
| `COPIED nnnn` | `COPY` finished. `nnnn` is the number of records, in hexadecimal. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1067-1073`, `src/data3.asm:48-49` |
| `CON: TTY: serial terminal`, `CON: CRT: PICO9918`, `CON: UC1: GLCD` | The console in use, after `CON`. A `CON CRT` that can't take effect reports the serial terminal, and a `CON UC1` that can't take effect reports the console in use. `CON: BAT: reader and list` goes to the list device, which discards it, so it appears nowhere. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccp.asm:1140-1154`, `src/console.asm:287`, `src/data3.asm:52-61` |
| `NAME n` | `SERVICES`: a service's name and its pages, the newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/svc.asm:363-387` |
| `d: LABEL` from `MOUNT` | The drive and the volume now on it, also when the volume was there already. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:149-157` |
| `Unmounted` | `MOUNT d:` has emptied the drive. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:49-57` |
| `nn LABEL G1M`, `nn LABEL G8M` | `MOUNT` with no argument: a volume's index in decimal, its label and its geometry, with ` R/O` after a read-only volume and the drive after a mounted one, as `d:`. | [Chapter 4](04-cards-and-volumes.md#drives-and-mount), `test/programs/mount.asm:159-208` |
