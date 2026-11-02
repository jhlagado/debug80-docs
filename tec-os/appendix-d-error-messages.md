---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Appendices"
---

# Appendix D. Error messages

Checked against TEC-OS bd15528.

This appendix lists every message TEC-OS prints, with its cause and its
remedy, in the order a run can reach them: cold boot and the diagnostic
prompt, the LCD's words, the CCP, the BDOS and the block cache. `MOUNT` and
`VOLS` follow, and then the lines that report no fault. The `See` column of
each table links to the chapter that explains the message or its subject and
gives the source.

In a message, `d` stands for a drive letter, `nn` for a code in hexadecimal and
`NAME` for a word from the command line. The rest is the text the ROM holds.
`tecvol` runs on a PC, and Appendix F describes it. The diagnostics ROM is a
separate image, and Chapter 24 describes it.

## Cold boot

Cold boot checks for RAM twice. This message goes straight to the serial port,
and TEC-OS then stops in a loop. It doesn't appear on a display or on the LCD.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `TEC-OS needs 64K RAM` | `8000h–BFFFh` has no RAM, or EXPAND 1, the second half of the chip in U9, is missing. The test of `8000h–BFFFh` comes before the banner and the test of EXPAND 1 after the volumes. | Fit the 32 KiB RAM chip in socket U9, then reset. | [Chapter 1](01-introduction.md#the-board), `src/boot.asm:147-148`, `src/boot.asm:297-320`, `src/data.asm:16` |

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
(`src/diag.asm:22-46`). [Chapter 24](24-diagnostics.md#the-diagnostic-prompt)
explains the prompt and [Chapter 1](01-introduction.md#a-card-that-won-t-mount)
shows it.

Codes `01h` to `04h` come from `SDINIT`, the start of the card
(`src/boot.asm:37-38`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | No answer to `CMD0`, the first command, in 10 tries. An empty socket gives this code. | Put a card in and press `R`. | [Chapter 18](18-sd-card-and-volumes.md#the-spi-driver), `src/sd.asm:119-137` |
| `02` | `ACMD41` didn't report the card ready in 256 tries. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-spi-driver), `src/sd.asm:152-170` |
| `03` | `CMD58`, which reads the card's capacity type, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-spi-driver), `src/sd.asm:171-198` |
| `04` | `CMD16`, which sets a standard-capacity card's block length, failed. | Press `R`. If the code comes back, use another card. | [Chapter 18](18-sd-card-and-volumes.md#the-spi-driver), `src/sd.asm:187-196` |

Codes `05h` to `08h` are the SD driver's codes for a block read or write:
command rejected, no data token, write not accepted and card stayed busy
(`src/sd.asm:14-17`). They never reach this prompt. The driver stores them in
`SDERR`, which nothing reads. A failed read during the mount is code `20h`,
and a failed read or write after it is a BDOS error, `Write lost` or, for a
directory read, no message at all. The `MOUNT` program's own reads and writes
give the messages in its table below.

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
| `CARD?` | TEC-OS is waiting at the diagnostic prompt. | As for the prompt. `R` starts the LCD again, so a retry that works clears the word. | [Chapter 22](22-startup.md#the-lcd-s-words), `src/diag.asm:7-8`, `src/data3.asm:103` |
| `PICO?` | At the first prompt after startup, a board with a PICO9918 and a matrix keyboard has no display driver in. The driver's file may be missing or bad, `STARTUP.CMD` may be missing or have no display line, or startup was skipped. | Correct the card from the serial terminal or on a PC. On a running board, a `PICO.SVC` that loads clears the word. | [Chapter 22](22-startup.md#stdone), `src/svc.asm:420-431`, `src/data3.asm:104` |
| `GLCD?` | `CON UC1` couldn't load or install `A:GLCD.SVC`: the file is missing or bad, or the board has no GLCD or no matrix keyboard. The console is on the serial terminal. | Put `GLCD.SVC` on drive A, or go back with `CON CRT` from the serial terminal. The word stays until a display driver takes the console or a reset. | [Chapter 5](05-startup-and-services.md#words-on-the-lcd), `src/glcd.asm:53-63`, `src/glcd.asm:84-86`, `drivers/glcd.asm:43-45`, `src/data3.asm:102` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h`, and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:351-355`, `src/cpm/ccp.asm:125-137`).
[Chapter 11](11-chaining-commands.md#a-command-that-depends-on-the-one-before)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched nothing, or only files with the system attribute. `TYPE` found no such file or was given no name. `ERA` matched nothing. `REN` found no file of the old name. | Check the name, the drive and the user area: a file in another user area isn't found. | [Chapter 3](03-command-line.md#the-ccp-s-messages), `src/cpm/ccp.asm:555-558`, `src/cpm/ccp.asm:849-851`, `src/data3.asm:10-11` |
| `FILE EXISTS` | `REN` found a file with the new name. The test reads the drive written with the new name, and the rename acts on the drive written with the old one, so `REN B:NEW=OLD` tests drive B and renames on the current drive. `REN NEW=B:OLD` tests the current drive and renames on drive B, and can leave two files of one name there. | `ERA` that file or choose another name. Write the same drive on both sides. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:925-944`, `src/data3.asm:64-65` |
| `NO SPACE` | `SAVE` couldn't make the file, write a record or close the file: the drive or its directory is full. `SAVE` erases any file of that name first, so an old copy is gone and a part of the new file can remain, in whole extents of 16 KiB. | `ERA` files on the drive, or `SAVE` to another drive. Press `^C` before `DIR` to see the space free: the blocks of the unclosed extent stay counted as used until a warm boot. | [Chapter 3](03-command-line.md#save), `src/cpm/ccp.asm:1227-1236`, `src/cpm/ccp.asm:1254-1278`, `src/data3.asm:66-67` |
| `NO SOURCE` | `COPY`'s source isn't on its drive in the current user area. Nothing has changed. | Check the name, the drive and the user area. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1010-1014`, `src/data3.asm:40-41` |
| `CANNOT MAKE DEST` | `COPY` couldn't make the destination: its directory is full. | `ERA` files on that drive, or copy to another drive. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1015-1021`, `src/data3.asm:42-43` |
| `WRITE ERROR` | `COPY` couldn't write a record: the drive is full, or the directory has no entry for the next extent. The destination isn't closed. It keeps only the extents already written to its directory, so its length is a multiple of 16 KiB, and 0 if the first extent was the one being written. | `ERA` the destination, free some space, press `^C` to give back the blocks of the unclosed extent, and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1028-1033`, `src/data3.asm:44-45` |
| `CLOSE ERROR` | `COPY` read the whole source, but function 16 found no directory entry for the destination. On the host model this message came only from a run that altered the destination's name in the FCB. | `DIR` the destination and copy again. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1038-1043`, `src/data3.asm:46-47` |

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:329-349`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Any other built-in prints
its first argument, whichever argument was wrong, and prints the question mark
alone when it needs an argument and has none.
[Chapter 3](03-command-line.md#file-names) has examples.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` and no `NAME.PRL` on the drive in the current user area. A type other than `.SVC` is ignored, so `PICO.DRV` looks for `PICO.COM`. | Check the name, the drive and the user area, or name the drive, as `B:NAME`. | [Chapter 3](03-command-line.md#running-a-program), `src/cpm/ccp.asm:277-291` |
| A program's name | The name is ambiguous or has no name part, is longer than 8 and 3 characters, has a bad character or names a drive past P. | Correct the name. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccp.asm:232`, `src/cpm/ccp.asm:264-266`, `src/cpm/ccp.asm:1318-1420`, `src/cpm/ccp.asm:1425-1475` |
| A program's name | `NAME.COM` doesn't fit below the BDOS's entry, the address in the word at `0006h`. | Use `UNLOAD` to free service resident memory. | [Chapter 17](17-ccp.md#loading-a-program), `src/cpm/ccp.asm:369-371`, `src/cpm/ccp.asm:388-400` |
| A program's name | `NAME.PRL` is too short for its header, its code and its bitmap, its code length is 0, or the code doesn't fit. | Replace the file, or use `UNLOAD` to free service resident memory. | [Chapter 17](17-ccp.md#loading-a-program), `src/prl.asm:14-53` |
| `NAME.SVC` | The file is missing or doesn't read, isn't a service of format 3, or fails while installing. A display driver also fails when its display or the matrix keyboard is missing, or when that display has a driver already. `GLCD.SVC` also fails while the PICO9918 is the console, and only `CON UC1` installs it then, so the starter card's `STARTUP.CMD` gives `GLCD.SVC?` at each boot on a board with both displays. | Check the board, the name and `SERVICES`. A card from an older TEC-OS needs the steps in Chapter 5. With the PICO9918 as the console, `GLCD.SVC?` from `STARTUP.CMD` needs no remedy. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), [Chapter 20](20-hardware-services-and-service-loader.md#a-failed-load), `src/glcd.asm:68-83`, `src/svc.asm:57-85`, `drivers/pico.asm:47-59`, `drivers/glcd.asm:34-53` |
| `UNLOAD` | No service is installed, or the newest can't be removed, as `PICO.SVC` can't be while the PICO9918 is the console. | `CON TTY` first for a console driver. Services go newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/cpm/ccp.asm:1082-1084`, `src/svc.asm:28-37` |
| `COPY` | A name is missing or has a wildcard, or the destination is the source. | Name one source and a destination that differs. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:979-1005` |
| `ERA` | No name, more than one, or a bad name. | `ERA NAME`. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:854-858` |
| `REN` | The form isn't `NEW=OLD`, a name has a wildcard, or a name is missing. | `REN NEW=OLD`. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:901-920` |
| `SAVE` | The count isn't decimal, it reaches the page of the address at `0006h`, or the name is missing or has a wildcard. | `SAVE n NAME.COM`, with a smaller count. | [Chapter 3](03-command-line.md#save), `src/cpm/ccp.asm:1182-1226` |
| `USER` | The argument isn't a number from 0 to 15. | `USER n`. | [Chapter 3](03-command-line.md#user-areas), `src/cpm/ccp.asm:1149-1176` |
| `CON` | The argument isn't `TTY`, `CRT`, `BAT` or `UC1`, or something follows it. | Use one of the four names. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccp.asm:1090-1146` |
| `DIR` or `TYPE` | `DIR` has more than one argument or a bad name. `TYPE` has more than one, a wildcard, a bad name or no name part. | Name one file for `TYPE`, one pattern for `DIR`. | [Chapter 3](03-command-line.md#file-names), `src/cpm/ccp.asm:420-422`, `src/cpm/ccp.asm:805-808` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/data3.asm:70-71`).

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. The BDOS then waits for a key and ends the program or
command by warm boot with the rest of a chained line dropped, whatever the key
(`src/cpm/bdos.asm:75-77`, `src/cpm/bdos.asm:2458-2468`).
[Chapter 16](16-bdos.md#disk-errors) explains them and
[Appendix A](appendix-a-bdos-functions.md#calling-a-function) lists them by
function.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `Bdos Err On d: Select` | The drive has no volume or is past D, or a program's FCB has `?` in its drive byte outside function 17. The warm boot gives a prompt on drive A if the drive at `0004h` has no volume (`src/cpm/ccp.asm:33-43`). | `MOUNT` a volume on the drive, or use another drive. | [Chapter 3](03-command-line.md#drives), `src/cpm/bdos.asm:2434-2437`, `src/data3.asm:87` |
| `Bdos Err On d: R/O` | A program changed a drive that function 28 made read-only: a write, make, delete, rename or attribute change. | The warm boot clears the state, as CP/M 2.2's does. Run the program again, and correct a program that writes to a drive it protected. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdos.asm:2417-2429`, `src/cpm/bdos.asm:508-509`, `src/data3.asm:89` |
| `Bdos Err On d: File R/O` | A delete, a rename or a sequential or random write reached a file with the read-only attribute. `ERA`, `REN`, `SAVE` and `COPY` onto such a file give it too. An `ERA` with a wildcard has already erased the matching files before it in the directory. | Clear the attribute with BDOS function 30, or on a PC `tecvol get` the file and `tecvol put` it without `--ro`. The CCP has no command for it. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/cpm/bdos.asm:686-694`, `src/cpm/bdos.asm:813`, `src/cpm/bdos.asm:848-853`, `src/cpm/bdos.asm:1032`, `src/data3.asm:90` |
| `Bdos Err On d: Bad Sector` | A write to a volume the card marks read-only. The BIOS rejects the write, and the BDOS reports any failed write this way. `R/O` is for function 28 alone. | Use a volume that takes writes. The volume's read-only flag is set when the card is built. | [Chapter 3](03-command-line.md#the-bdos-s-messages), `src/bios.asm:204-208`, `src/cpm/bdos.asm:904-905`, `src/data3.asm:88` |
| `Bdos Err On d: Bad Sector` | A record of a file couldn't be read from the card, or a record or a directory record couldn't be written. | Copy the card to a PC and run `tecvol verify`. Replace a card that keeps failing. | [Chapter 16](16-bdos.md#disk-errors), `src/cpm/bdos.asm:1005`, `src/cpm/bdos.asm:1316`, `src/cpm/bdos.asm:1921` |
| `Bdos Err On d: Bad Sector` | A directory entry names a block past the end of the volume: the directory is damaged. The first use of the drive gives this, whichever file is named. On drive A it comes at cold boot and after each key, and no prompt appears. | Run `tecvol verify` on a copy, as in [Chapter 4](04-cards-and-volumes.md#recovery-after-a-power-cut). | [Chapter 16](16-bdos.md#files-extents-and-records), `src/cpm/bdos.asm:2318`, `src/cpm/bdos.asm:2348-2356` |

A directory record that can't be read gives no message. The program ends by
warm boot, with no key to wait for and the rest of a chained line dropped
(`src/cpm/bdos.asm:1886`, `src/cpm/bdos.asm:2450-2451`). An early return to
the prompt with no message can have this cause, and the remedy is the one for
a `Bad Sector` from the card.

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS writes every changed block in the cache, then
prints this message on a line of its own if any such write has failed since the
last warm boot, including one that a later attempt got through. It also drops
the rest of a chained line (`src/cache.asm:349-358`, `src/data3.asm:109`).

A flush stops at the first block that fails. That block and those after it stay
in the cache, and each warm boot writes them again and prints the message again
while the failure lasts (`src/cache.asm:197-212`). A directory block that can't
be written isn't kept: its cache line is dropped, the BDOS reports `Bad Sector`,
and the warm boot after the key prints `Write lost` too
(`src/cache.asm:338-345`).

The data stays in the cache until a reset or a loss of power, either of which
discards it, so don't reset the board first. Put right what stopped the write
and press `^C` at the prompt for another warm boot. A warm boot with no message
means the flush reached the card. On the [host model](26-host-model.md), a
write failure that cleared with the card left in place gave that result at the
next `^C`. A card taken out and put back gave `Write lost` at each `^C`, since
only cold boot starts a card (`src/boot.asm:37`), and the reset that started it
lost the changes. If the message keeps coming and the board has to be reset,
the changes are lost and the file needs writing again.
[Chapter 19](19-block-cache.md#write-lost) explains the mechanism and
[Chapter 4](04-cards-and-volumes.md#the-block-cache-and-the-volume-written-behind)
the volume written behind.

## `MOUNT` and `VOLS`

These two programs on the starter card print their own messages
(`test/programs/mount.asm:171-178`, `test/programs/vols.asm:27`). After each
message the program returns to the prompt with a return code of 0, so a `:`
piece after it runs.
[Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount) explains the
programs, and [Chapter 18](18-sd-card-and-volumes.md#the-mount-service) the
service behind them.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `MOUNT D: [NAME or INDEX]` | The usage line: `MOUNT` has no drive letter from A to D and colon. | `MOUNT B: NAME`, `MOUNT B: 2`, or `MOUNT B:` to empty the drive. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `test/programs/mount.asm:32-42`, `test/programs/mount.asm:157-158` |
| `No such volume` | No volume has that label or index. A failed read of the table gives this too. | `VOLS` lists the labels and indexes. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `test/programs/mount.asm:104-105`, `test/programs/mount.asm:127-128`, `src/vol.asm:708-736` |
| `Cannot mount: in use or too large` | The volume is on another drive, the drive has no vector or one too small for the volume, or writing the cache's changes to the card failed. | Empty the other drive first with `MOUNT d:`. For size, use a drive whose vector takes the volume, as [Chapter 4](04-cards-and-volumes.md#drives-and-their-cost-in-memory) explains. A failed write is `Write lost`'s case. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `src/vol.asm:611-623`, `src/vol.asm:641-651`, `src/vol.asm:681-690` |
| `Cannot unmount` | The drive is A, which always has a volume, or writing the cache's changes to the card failed. | Mount another volume on drive A in place of the one there. A failed write is `Write lost`'s case. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `src/vol.asm:653-659` |
| `MOUNT needs TEC-OS with ABI 4.` | The ROM table is missing, or its major version isn't 4: the program is from another version of TEC-OS. | Use the `MOUNT.COM` that matches the ROM, from a new starter card. | [Chapter 9](09-hardware-services.md#checking-for-tec-os), `test/programs/mount.asm:14-31` |
| `VOLS needs TEC-OS with ABI 4.` | The same test in `VOLS`. | Use the `VOLS.COM` that matches the ROM, from a new starter card. | [Chapter 9](09-hardware-services.md#checking-for-tec-os), `test/programs/vols.asm:27` |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The banner on the console at cold boot. The LCD's first row has `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-introduction.md#the-first-boot), `src/data.asm:17`, `src/data2.asm:8` |
| `d: LABEL` | A drive and its volume's label, at cold boot. A volume the card marks read-only has ` (read-only)` after the label. The LCD's two rows below the banner show drives A and B in the same form, with no read-only mark. | [Chapter 1](01-introduction.md#the-first-boot), `src/vol.asm:805-834`, `src/lcd.asm:67-104`, `src/data2.asm:11` |
| `n files, nK free` | `DIR`'s last line: the files listed and the space free on the drive. One file gives `1 file, nK free`. | [Chapter 3](03-command-line.md#dir), `src/data3.asm:12-17` |
| `[more]` | `DIR` or `TYPE` has filled the screen. Any key shows the next screen. Esc, `Q`, `q` and `;` end the listing, and `^C` and `#` also drop the rest of a chained line, since the test clears bit 5 of the key before it compares. | [Chapter 2](02-console.md#pauses-in-long-listings), `src/cpm/ccp.asm:719-751`, `src/data3.asm:18-19` |
| `ALL (Y/N)?` | `ERA` was given a name that is all wildcards. A line that starts with `Y` or `y` erases every file of the current user area on the drive. Any other line erases nothing, and the command counts as a success. A Return with nothing before it needs a second Return. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:864-887`, `src/data3.asm:68-69` |
| `COPIED nnnn` | `COPY` finished. `nnnn` is the number of records, in hexadecimal. | [Chapter 3](03-command-line.md#copy-ren-and-era), `src/cpm/ccp.asm:1044-1050`, `src/data3.asm:48-49` |
| `CON: TTY: serial terminal`, `CON: CRT: PICO9918`, `CON: UC1: GLCD` | The console in use, after `CON`. A `CON CRT` or `CON UC1` that can't take effect reports the serial terminal. `CON: BAT: reader and list` goes to the list device, which discards it, so it appears nowhere. | [Chapter 2](02-console.md#the-con-command), `src/cpm/ccp.asm:1120-1134`, `src/console.asm:274`, `src/data3.asm:52-61` |
| `NAME n` | `SERVICES`: a service's name and its pages, the newest first. | [Chapter 5](05-startup-and-services.md#installing-listing-and-removing-services), `src/svc.asm:302-325` |
| `d: LABEL` from `MOUNT` | The drive and the volume now on it, also when the volume was there already. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `test/programs/mount.asm:147-155` |
| `Unmounted` | `MOUNT d:` has emptied the drive. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `test/programs/mount.asm:47-55` |
| `nn LABEL G1M`, `nn LABEL G8M` | `VOLS`: an index in decimal, a label and a geometry, with ` R/O` after a read-only volume and the drive letter after a mounted one. | [Chapter 4](04-cards-and-volumes.md#drives-vols-and-mount), `test/programs/vols.asm:107-111` |
