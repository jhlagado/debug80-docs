---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Appendices"
---

# Appendix D. Error messages

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

This appendix lists every message TEC-OS prints, with its cause and its
remedy, in the order a run can reach them: cold boot and the diagnostic
prompt, the LCD's words, the CCP, the BDOS and the block cache. `MOUNT`
follows, and then the lines that report no fault. The last column of each
table links to the chapter that explains the message or its subject and gives
the source.

In a message, `d` stands for a drive letter, `n` for a decimal number, `NAME`
for a word from the command line, `LABEL` for a volume's label and `nn` for a
code in hexadecimal. The rest is printed as it stands. `tecvol` runs on a PC,
and Appendix F describes it. The diagnostics ROM is a separate image, and
Chapter 26 describes it.

## Cold boot

Cold boot checks the RAM once, before the banner. This message goes straight to
the serial port, and TEC-OS then stops in a loop. It doesn't appear on a
display or on the LCD.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `TEC-OS needs 64K RAM` | `8000h–BFFFh` has no RAM, or EXPAND 1, the second half of the chip in U9, is missing. One check tests both. | Fit the 32 KiB RAM chip in socket U9, then reset. | [Appendix G](appendix-g-tec-1g.md#u9-and-the-ram), `src/boot.asm:71-72`, `src/boot.asm:545-595`, `src/text.asm:10` |

## The diagnostic prompt

A card that can't be started or mounted stops cold boot after the banner:

```text
No volume mounted, error nn
R retry> 
```

The console at this point is the ROM's PICO9918 console on a board with the
PICO9918 and the matrix keyboard, and the serial terminal on any other. The
LCD's last row shows `CARD?` (`src/boot.asm:772-784`, `src/text.asm:13-15`).
`R` starts the LCD, the card and the mount again, so a card fixed or put in
while TEC-OS waits at the prompt mounts with no reset. The key is echoed as
typed, and `r` retries too. Any other key gives the prompt again
(`src/boot.asm:786-802`).
[Chapter 26](26-diagnostics.md#the-diagnostic-prompt) explains the prompt.

Codes `01h` to `04h` and `0Bh` come from `SDINIT`, the start of the card
(`src/boot.asm:127-131`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | `CMD0`, the first command, didn't return the idle reply `01h` in 10 tries. An empty socket gives this code. | Put a card in and press `R`. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:216-246` |
| `02` | `ACMD41` didn't return ready in 256 tries, or the card answered a `CMD55` with an error bit set. | Press `R`. If the code comes back, use another card. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:286-328` |
| `03` | `CMD58`, which reads the card's capacity type, failed. | Press `R`. If the code comes back, use another card. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:330-372` |
| `04` | `CMD16`, which sets a standard-capacity card's block length, failed. | Press `R`. If the code comes back, use another card. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:353-366` |
| `0B` | The card's answer to `CMD8` echoed another voltage range than 2.7 to 3.6 V, or another check pattern than `AAh`. | Use another card. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:248-281` |

Codes `05h` to `0Ah` are the SD card driver's codes for a block read or write
(`src/sd.asm:21-29`, `src/sd.asm:374-388`). They never reach this prompt. The driver stores them in
`SDERR`, which nothing reads. A failed read during the mount is code `20h`,
and a failed read or write after it is a BDOS error or `Write lost`. The
`MOUNT` program's own reads and writes give the messages in its table below.

| Code | Meaning |
| --- | --- |
| `05` | The card rejected the command |
| `06` | No data token came |
| `07` | The card didn't accept the write |
| `08` | The card stayed busy |
| `09` | The block is 4 GiB or more into a standard-capacity card, rejected before any command |
| `0A` | A data error token came in place of the block's data |

Codes `20h` to `2Ah` come from the ROM's `MOUNT` routine, its check of the
container. The first check to fail stops the mount, and no drive stays mounted
(`src/vol.asm:407-415`, `src/volutil.asm:15-28`).
[Appendix E](appendix-e-container-format.md#the-checks-and-their-codes) gives
every check in order, and
[Chapter 17](17-sd-card-and-volumes.md#the-container-s-checks) explains them.

| Code | Cause | Constant |
| --- | --- | --- |
| `20` | Block 0, or a block of the table beyond it, can't be read. | `src/vol.asm:25-26`, `src/vol.asm:63-68`, `src/vol.asm:197-205`, `src/vol.asm:235-240` |
| `21` | Block 0 doesn't start with `TECOSVOL`: the card holds no container. | `src/vol.asm:27`, `src/vol.asm:71-85` |
| `22` | The container's major version isn't the one this ROM reads. | `src/vol.asm:28-29`, `src/vol.asm:86-91` |
| `23` | The header or descriptor size is wrong, or the header's drives field is above 4. | `src/vol.asm:30-31`, `src/vol.asm:92-106`, `src/vol.asm:166-173` |
| `24` | The number of volumes is 0, above 8 on a format 1.0 card or above 127. | `src/vol.asm:32`, `src/vol.asm:107-139` |
| `25` | The header's checksum differs, or on a format 1.1 card with a table past block 0 the table's sum. | `src/vol.asm:33`, `src/vol.asm:140-146`, `src/vol.asm:174-219` |
| `26` | A descriptor is bad: its id, flags, geometry, length or start. | `src/vol.asm:34-35`, `src/vol.asm:241-281`, `src/vol.asm:403-405` |
| `27` | A volume ends past the container, or on a standard-capacity card past block `7FFFFFh`, the last its byte addresses reach, 4 GiB into the card. | `src/vol.asm:37-38`, `src/vol.asm:295-347` |
| `28` | A volume starts before the end of the one before it in the table. | `src/vol.asm:39`, `src/vol.asm:282-292` |
| `29` | A drive letter is invalid, past the number of drives the header gives, or used twice. | `src/vol.asm:40-41`, `src/vol.asm:349-377` |
| `2A` | No volume is on drive A. | `src/vol.asm:42-43`, `src/vol.asm:393-401` |

For code `20h`, press `R`. For the others, and for a `20h` that comes back,
`R` gives the same code until the card changes. Copy the card to a PC and run
`tecvol verify` on the copy, as Chapter 5's
[recovery section](05-drives-and-cache.md#recovering-after-a-power-cut)
shows. `tecvol verify` prints the fault in words. `tecvol get` makes the same
check, so it reads no file from a copy that fails it. Write a new image with
`tecvol create` or a new starter card.

## The LCD's words

TEC-OS writes two words on the 20 × 4 LCD's last row, for a board that may
have no terminal attached.
[Chapter 6](06-startup-file.md#when-the-file-goes-wrong) explains when each
is written and cleared.

| Word | Cause | Remedy | See |
| --- | --- | --- | --- |
| `CARD?` | TEC-OS is waiting at the diagnostic prompt. | As for the prompt. `R` starts the LCD again, so a retry that works clears the word. | [Chapter 25](25-startup.md#the-lcd-s-words), `src/boot.asm:775-777`, `src/text.asm:15` |
| `GLCD?` | `CON UC1` couldn't load or install `A:GLCD.SVC`: the file is missing or bad, or the board has no graphics LCD or no matrix keyboard. The console stays where it was. | Put `GLCD.SVC` on drive A. A successful `GLCD.SVC` load, a later take of the console or a reset clears the word. | [Chapter 6](06-startup-file.md#when-the-file-goes-wrong), `src/loader.asm:839-857`, `src/loader.asm:887-902`, `drivers/glcd.asm:63-85`, `src/text.asm:78` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h`, and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:583-591`, `src/cpm/ccp.asm:224-237`).
[Chapter 11](11-return-codes-and-chaining.md#the-return-code)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched nothing, or only files with the system attribute. `TYPE` found no such file or was given no name. `ERA` matched nothing. `REN` found no file of the old name. | Check the name, the drive and the user area: a file in another user area isn't found. | [Chapter 3](03-command-line.md#failure-messages), `src/cpm/ccpfile.asm:230-234`, `src/cpm/ccpfile.asm:623-626`, `src/text.asm:21-22` |
| `FILE EXISTS` | A file with the new name is already on the drive. | `ERA` that file or choose another name. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:149-175`, `src/text.asm:52-53` |
| `NO SPACE` | `SAVE` couldn't make the file, write a record or close the file: the drive or its directory is full. `SAVE` erases any file of that name first, so an old copy is gone. After a failed write `SAVE` closes the file, which then holds the records written before the drive filled. | `ERA` the part file and other files on the drive, or `SAVE` to another drive. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpcmd.asm:343-350`, `src/cpm/ccpcmd.asm:351-421`, `src/text.asm:54-55` |
| `NO SOURCE` | `COPY`'s source isn't on its drive in the current user area. Nothing has changed. | Check the name, the drive and the user area. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:287-291`, `src/text.asm:33-34` |
| `CANNOT MAKE DEST` | `COPY` couldn't make the destination: its directory is full. | `ERA` files on that drive, or copy to another drive. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:292-302`, `src/text.asm:35-36` |
| `WRITE ERROR` | `COPY` couldn't write a record: the drive is full, or the directory has no entry for the next extent. `COPY` closes the destination first, so it holds the records written before the failure. | `ERA` the destination, free some space and copy again. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:314-321`, `src/cpm/ccpmut.asm:347-358`, `src/text.asm:37-38` |
| `CLOSE ERROR` | `COPY` read the whole source, but function 16 found no directory entry for the destination. | `DIR` the destination and copy again. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:328-334`, `src/text.asm:39-40` |

On the host model `CLOSE ERROR` came only from a run that altered the
destination's name in the FCB.

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:556-577`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Any other built-in prints
its first argument, whichever argument was wrong, and prints the question mark
alone when it requires an argument and has none.
[Chapter 3](03-command-line.md#failure-messages) has examples. The rows
for a program and a service give one cause each.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` on the drive in the current user area or in user 0. When the command names no drive and the current drive isn't A, none on drive A in the current user area or in user 0 either. A type other than `.SVC` is ignored, so `PICO.DRV` names `PICO.COM`. | Check the name, the drive and the user area, or name the drive, as `B:NAME`. A card from an older TEC-OS needs the steps under [A card from an older TEC-OS](#a-card-from-an-older-tec-os). | [Chapter 20](20-ccp.md#loading-a-program), `src/cpm/ccp.asm:463-491`, `src/cpm/ccp.asm:593-635` |
| A program's name | The name is ambiguous or has no name part, is longer than 8 and 3 characters, has a bad character or names a drive past P. | Correct the name. | [Chapter 3](03-command-line.md#file-names-and-wildcards), `src/cpm/ccp.asm:388-389`, `src/cpm/ccp.asm:425-429`, `src/cpm/ccpcmd.asm:482-613`, `src/cpm/ccpcmd.asm:625-670` |
| A program's name | `NAME.COM` doesn't fit below the page containing the BDOS entry, whose address is in the word at `0006h`. | Use `UNLOAD` to free service resident memory. | [Chapter 20](20-ccp.md#loading-a-program), `src/cpm/ccp.asm:658-663`, `src/cpm/ccp.asm:684-695` |
| `NAME.SVC` | The file is missing or doesn't read. | Check the name and the drive. | [Chapter 24](24-service-loader.md#a-failed-load), `src/cpm/ccp.asm:441-457`, `src/loader.asm:869-895` |
| `NAME.SVC` | The file isn't a service of format 4. A `.SVC` or `.DRV` from an older TEC-OS fails here. | Use the file from a new starter card. A card from an older TEC-OS needs the steps under [A card from an older TEC-OS](#a-card-from-an-older-tec-os). | [Chapter 24](24-service-loader.md#a-failed-load), `src/loader.asm:182-226` |
| `NAME.SVC` | The service's `INIT` failed. | Check the board and `SERVICES`. | [Chapter 24](24-service-loader.md#a-failed-load), `src/loader.asm:413-421`, `src/loader.asm:483-545` |
| `GLCD.SVC` | The board has no graphics LCD or no matrix keyboard, the driver is in already, or the ROM is before ABI 5.1. | Check the board and `SERVICES`. | [Chapter 24](24-service-loader.md#a-failed-load), `src/services.asm:591-631`, `src/video.asm:145-157`, `drivers/glcd.asm:63-85` |
| `PICO.SVC` | The file is from an older card: `CRT:`'s table is the ROM's own, so its `INIT` fails. | Remove the line from `STARTUP.CMD`. | [Chapter 24](24-service-loader.md#a-failed-load), `src/services.asm:591-631`, `src/video.asm:145-157` |
| `NAME.SVC` | The service's record was rejected after its `INIT` succeeded. The name is printed from `STARTUP.CMD` too, whatever `INIT` returned in `A`. | Check `SERVICES`. | [Chapter 24](24-service-loader.md#a-failed-load), `src/loader.asm:413-421`, `src/loader.asm:483-545` |
| `UNLOAD` | No service is installed, or the newest can't be removed: its flags mark it as not removable, or its `REMOVE` returned carry. | Services go newest first. | [Chapter 6](06-startup-file.md#services-at-the-prompt), `src/cpm/ccpcmd.asm:13-17`, `src/loader.asm:120-135` |
| `COPY` | A name is missing or has a wildcard, the destination is the source or something follows the destination. | Name one source and a destination that differs, and nothing after it. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:238-279` |
| `ERA` | No name, more than one, or a bad name. | `ERA NAME`. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:13-17` |
| `REN` | The form isn't `NEW=OLD`, a name has a wildcard, a name is missing, or the names give two different drives. | `REN NEW=OLD`, with a drive on one name or the same drive on both. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:93-141` |
| `SAVE` | The count isn't a decimal number below 256, it reaches the page of the address at `0006h`, or the name is missing or has a wildcard. | `SAVE n NAME.COM`, with a smaller count. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpcmd.asm:283-341` |
| `USER` | The argument isn't a number from 0 to 15. | `USER n`. | [Chapter 3](03-command-line.md#drives-and-user-areas), `src/cpm/ccpcmd.asm:236-273` |
| `CON` | The argument isn't `TTY`, `CRT`, `BAT`, `UC1`, `PICO` or `GLCD`, with or without a colon, or something follows it. | Use one of the six names. | [Chapter 2](02-console.md#moving-the-console-with-con), `src/cpm/ccpcmd.asm:64-204` |
| `CON`, the width | The width after `CRT` or `PICO` isn't 80, 40 or 32, or has no space before it, as in `CON CRT80`. The word printed is the width. | `CON PICO 40`, with a width of 80, 40 or 32. | [Chapter 2](02-console.md#moving-the-console-with-con), `src/cpm/ccpcmd.asm:64-204` |
| `CON`, the width | A width follows a name other than `CRT` or `PICO`. | A width goes only after `CRT` or `PICO`. | [Chapter 2](02-console.md#moving-the-console-with-con), `src/cpm/ccpcmd.asm:64-204` |
| `CON`, the width | The ROM's PICO9918 console isn't running, or a program has claimed the PICO9918. | A width works on a board with the PICO9918 and the matrix keyboard, with no claim held. | [Chapter 2](02-console.md#moving-the-console-with-con), `src/pico.asm:84-112` |
| `DIR` or `TYPE` | `DIR` has more than one argument or a bad name. `TYPE` has more than one, a wildcard, a bad name or an argument with no name part. With no argument at all, `TYPE` prints `NO FILE`. | Name one file for `TYPE`, one pattern for `DIR`. | [Chapter 3](03-command-line.md#file-names-and-wildcards), `src/cpm/ccpfile.asm:27-31`, `src/cpm/ccpfile.asm:560-565` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/text.asm:58-59`).

Some of these failures print nothing from `STARTUP.CMD`. A driver whose
`INIT` finds its device absent is quiet there, so the starter card's
`GLCD.SVC` line prints nothing on a board with no graphics LCD, and a width
line is quiet on a board with no PICO9918 console. On a board with both
displays a `GLCD.SVC` line in `STARTUP.CMD` loads nothing and prints nothing,
and a `GLCD.SVC` typed at the prompt loads, is replaced by the PICO9918 as the
console and prints nothing.
[Chapter 25](25-startup.md#the-quiet-rule) explains the rule. The web page
reports a card with no `GLCD.SVC` when it powers on, as
[Appendix I](appendix-i-web-page.md#the-card-s-startup-file) describes.

### A card from an older TEC-OS

Older cards hold their services in files of type `.DRV`, and this ROM doesn't
load them. The CCP takes `GLCD.DRV` as the name of a program and prints it
with a question mark, so a board with the graphics LCD keeps its console on
the serial terminal. A board with the PICO9918 and the matrix keyboard has its
console on the PICO9918 from cold boot, whatever the card holds. The web page
reports such a card when it powers on, as Appendix I describes.

There are two ways out. "New starter card" on the web page, or a new image
from `npm run media`, replaces the card. The other way keeps the card: rename
`GLCD.DRV` to `GLCD.SVC` and change `STARTUP.CMD` to match. That works when
the file's format, its second byte, is 4, the format this ROM loads. An older
card's `PICO.SVC` doesn't install under any name, because the ROM's table no
longer takes a driver for the PICO9918, and it leaves nothing installed. This
image is a copy of the starter card with an older card's two display drivers
under the old type: the `PICO.SVC` kept in the repository's tests and the
current `GLCD.SVC`:

```sh
cp dist/starter.img old.img
node tools/tecvol.mjs put old.img A test/fixtures/e5154ad/PICO.SVC PICO.DRV
node tools/tecvol.mjs put old.img A dist/files/GLCD.SVC GLCD.DRV
node tools/tecvol.mjs era old.img A GLCD.SVC
printf 'PICO.DRV\nGLCD.DRV\n' > startup.cmd
node tools/tecvol.mjs put old.img A startup.cmd --text
```

On the board with the graphics LCD both lines fail. Renamed, `PICO.SVC` still
fails, and `GLCD.SVC` installs and takes the console:

<!-- node tools/capture.mjs --card old.img --board glcd "REN PICO.SVC=PICO.DRV" "REN GLCD.SVC=GLCD.DRV" PICO.SVC GLCD.SVC CON SERVICES -->
```text
A>PICO.DRV
PICO.DRV?

A>GLCD.DRV
GLCD.DRV?

A>REN PICO.SVC=PICO.DRV
A>REN GLCD.SVC=GLCD.DRV
A>PICO.SVC
PICO.SVC?

A>GLCD.SVC

A>CON
CON: UC1:
A>SERVICES
GLCD 3
A>
```

`STARTUP.CMD` still names the old files, so the next reset prints the same two
failures until a new file replaces it, and `ERA PICO.SVC` removes the old
driver. The new file comes from `tecvol put` on a PC or "Copy file to drive"
on the web page. There, "Power cycle" does it too when the chosen display's
file is on the card, since the page's rewrite drops a display line of either
type. A `GLCD.SVC` of an older format fails under the new name too, as
`GLCD.SVC?`, and only a new starter card's copy, or one put on the card with
`tecvol`, replaces it.

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. By default the BDOS then waits for a key and ends the
program or command by warm boot with the rest of a chained line dropped,
whatever the key (`src/cpm/bdos.asm:112-116`, `src/cpm/bdoscon.asm:45-66`,
`src/cpm/bdoscon.asm:99-109`). A program can take the errors itself with BDOS
function 45. With `E` = `FFh` the error returns to the program with `A` =
`FFh`, `H` the code in the table and no message, and with `FEh` the message is
printed first and the error then returns the same way. Neither drops the rest
of a chained line, and a sequential read or write that returns an error leaves
the FCB on the record it didn't read or write. Every warm boot puts the default
back (`src/cpm/bdos.asm:250-264`, `src/ram.asm:215-218`).
[Chapter 19](19-bdos.md#the-entry) explains them and
[Appendix A](appendix-a-bdos-functions.md#the-errors) lists them by function.

| Message | Code | Cause | Remedy | See |
| --- | ---: | --- | --- | --- |
| `Bdos Err On d: Select` | 4 | The drive has no volume or is past D, or a program's FCB has `?` in its drive byte outside function 17. The warm boot gives a prompt on drive A if the drive at `0004h` has no volume (`src/cpm/ccp.asm:51-67`). | `MOUNT` a volume on the drive, or use another drive. | [Chapter 3](03-command-line.md#drives-and-user-areas), `src/cpm/bdoslog.asm:818-821`, `src/text.asm:69` |
| `Bdos Err On d: R/O` | 2 | A program changed a drive that function 28 made read-only: a write, a make, delete, rename or attribute change. A close writes nothing there and gives no error. | The warm boot clears the state, as CP/M 2.2's does. Run the program again, and correct a program that writes to a drive it protected. | [Chapter 3](03-command-line.md#failure-messages), `src/cpm/bdoslog.asm:808-813`, `src/cpm/bdosfile.asm:274-279`, `src/cpm/bdosfile.asm:53-69`, `src/text.asm:71` |
| `Bdos Err On d: R/O` | 2 | A change to a volume the card marks read-only. `SAVE`, `ERA`, `REN` and `COPY` onto such a volume give it too. The card isn't changed. | Use a volume that takes writes. The volume's read-only flag is set when the card is built. | [Chapter 3](03-command-line.md#failure-messages), `src/cpm/bdoslog.asm:226-236`, `src/cpm/bdoslog.asm:808-813`, `src/text.asm:71` |
| `Bdos Err On d: File R/O` | 3 | A delete, a rename or a sequential or random write reached a file with the read-only attribute. `ERA`, `REN`, `SAVE` and `COPY` onto such a file give it too. An `ERA` with a wildcard has already erased the matching files before it in the directory. | Clear the attribute with BDOS function 30, or on a PC `tecvol get` the file and `tecvol put` it with `--force` and without `--ro`, since `tecvol` rejects a write over a read-only file without `--force`. The CCP has no command for it. | [Chapter 3](03-command-line.md#failure-messages), `src/cpm/bdosfile.asm:403-418`, `src/cpm/bdosfile.asm:604-606`, `src/cpm/bdosfile.asm:671-683`, `src/cpm/bdosrec.asm:333-334`, `src/text.asm:72-73` |
| `Bdos Err On d: Bad Sector` | 1 | A record or a directory record couldn't be read from the card or written to it. An `ERA` that ends here keeps the file's entries from the one that couldn't be written on. A file with several entries loses those erased before it, and with a wildcard the files erased before it stay erased (`src/cpm/bdosfile.asm:432-467`). | Copy the card to a PC and run `tecvol verify`. Replace a card that keeps failing. | [Chapter 19](19-bdos.md#the-entry), `src/cpm/bdosrec.asm:269-270`, `src/cpm/bdosrec.asm:75-95`, `src/cpm/bdoslog.asm:103-115`, `src/cpm/bdoscon.asm:30-32` |
| `Bdos Err On d: Bad Sector` | 1 | The volume runs past the end of the card and the card rejects the block command. The ROM reports that rejection without transferring block data. A test of the host model checks that no other block changes. | Use a card that holds the whole container, or build the card again with `tecvol create` so that every volume lies on the card. | [Chapter 17](17-sd-card-and-volumes.md#the-sd-card-driver), `src/sd.asm:436-447`, `src/sd.asm:484-502`, `test/sd-range.test.mjs:86-107`, `src/sd.asm:717-727`, `src/sd.asm:484-502` |
| `Bdos Err On d: Bad Sector` | 1 | A directory entry names an allocation block past the end of the volume: the directory is damaged. The drive logs in and the rest of the volume works, and reading that block gives this. | `ERA` takes the file. Run `tecvol verify` on a copy, as in [Chapter 5](05-drives-and-cache.md#recovering-after-a-power-cut). | [Chapter 19](19-bdos.md#files-extents-and-records), `src/cpm/bdosrec.asm:808-819`, `src/cpm/bdoslog.asm:653-672`, `src/cpm/bdoscon.asm:75-80` |

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS writes every changed block in the cache to the
card. A block whose write fails is dropped, so the card keeps its old copy. If
any write failed, the message is printed once, on a line of its own, and the
rest of a chained line is dropped (`src/cache.asm:287-342`,
`src/cache.asm:638-653`, `src/text.asm:84`).

The changes in the dropped blocks are lost, and the next warm boot prints
nothing more. A directory block whose write fails, or whose preceding data flush
fails, is dropped during the run and the BDOS reports `Bad Sector` at once. If
only the directory write failed, its dropped block leaves nothing for the next
warm boot to retry, so that failure alone gives no `Write lost`. The data blocks
that failed stay in the cache, so a close tried again fails again until the card
takes them. The warm boot after the key writes them again and gives `Write lost`
if they still fail (`src/cache.asm:287-342`, `src/cache.asm:619-636`). The file
that was being written needs writing again, once the card is put right and the
board reset.

Putting the card back does not itself run `SDINIT`. The card is started at cold
boot or a diagnostic retry, not at warm boot (`src/boot.asm:119-131`,
`src/boot.asm:786-802`). If writes still fail at the next warm boot, the changed
lines are dropped and `Write lost` is printed (`src/cache.asm:301-342`,
`src/cache.asm:646-653`). BDOS function 48 reports a failure to a program at
once: it writes every changed block and returns `A` = `FFh` if any write failed
(`src/cpm/bdos.asm:266-278`). [Chapter 18](18-block-cache.md#write-lost)
explains the mechanism and [Chapter
5](05-drives-and-cache.md#the-block-cache-and-the-volume-written-behind) the
volume written behind.

## `MOUNT`

This program on the starter card prints its own messages
(`test/programs/mount.asm:27-31`, `test/programs/mount.asm:255-262`). After each
message the program returns to the prompt with a return code of 0, so a `:`
piece after it runs.
[Chapter 5](05-drives-and-cache.md#drives-and-mount) explains the program, and
[Chapter 17](17-sd-card-and-volumes.md#the-volume-services) the volume
services behind it.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `MOUNT [D: [NAME or INDEX]]` | The usage line: the argument doesn't start with a drive letter from A to D and a colon. | `MOUNT` alone to list the volumes, `MOUNT B: NAME`, `MOUNT B: 2`, or `MOUNT B:` to empty the drive. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `test/programs/mount.asm:33-44`, `test/programs/mount.asm:241-243`, `test/programs/mount.asm:262` |
| `No such volume` | No volume has that label or index. A failed read of the table gives this too. | `MOUNT` with no argument lists the labels and indexes. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `test/programs/mount.asm:98-107`, `test/programs/mount.asm:123-143`, `src/volsvc.asm:435-483` |
| `Cannot mount: in use or too large` | The volume is on another drive, the drive has no vector or one too small for the volume, or writing the cache's changes to the card failed. | Empty the other drive first with `MOUNT d:`. For size, use a drive whose vector takes the volume, as [Chapter 5](05-drives-and-cache.md#drives-and-mount) explains. A failed write drops the changes the cache held for those blocks, as under `Write lost`, and no message follows. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `src/volsvc.asm:232-246`, `src/volsvc.asm:278-296`, `src/volsvc.asm:392-408` |
| `Cannot unmount` | The drive is A, which always has a volume, or writing the cache's changes to the card failed. | Mount another volume on drive A in place of the one there. A failed write drops the changes the cache held for those blocks, as under `Write lost`, and no message follows. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `src/volsvc.asm:307-316` |
| `MOUNT needs TEC-OS with ABI 5.` | The ROM table is missing, or its major version isn't 5: the program is from another version of TEC-OS. | Use the `MOUNT.COM` that matches the ROM, from a new starter card. | [Chapter 10](10-hardware-services.md#the-check-for-tec-os), `test/programs/mount.asm:14-31` |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy. In `MOUNT`'s listing
`nn` is a volume's index in decimal.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The banner on the console at cold boot. The LCD's first row has `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-introduction.md#turning-it-on), `src/text.asm:11`, `src/text.asm:63` |
| `d: LABEL` | A drive and its volume's label, at cold boot. A volume the card marks read-only has ` (read-only)` after the label. The LCD's two rows below the banner show drives A and B in the same form, with no read-only mark. | [Chapter 1](01-introduction.md#turning-it-on), `src/boot.asm:602-637`, `src/lcd.asm:119-147`, `src/lcd.asm:157-180`, `src/text.asm:12` |
| `n files, nK free` | `DIR`'s last line: the files listed and the space free on the drive. One file gives `1 file, nK free`. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/text.asm:23-28` |
| `[more]` | `DIR` or `TYPE` has filled the screen. Any key shows the next screen. Esc, `Q`, `q` and `;` end the listing, and `^C` and `#` also drop the rest of a chained line, since the test clears bit 5 of the key before it compares. | [Chapter 2](02-console.md#pausing-output), `src/cpm/ccpfile.asm:443-490`, `src/text.asm:29-30` |
| `ALL (Y/N)?` | `ERA` was given a name that is all wildcards. A line that starts with `Y` or `y` erases every file of the current user area on the drive. Any other line erases nothing, and the command counts as a success. A Return alone is the whole answer and erases nothing. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:26-60`, `src/text.asm:56-57` |
| `COPIED nnnn` | `COPY` finished. `nnnn` is the number of records, in hexadecimal. | [Chapter 3](03-command-line.md#the-built-in-commands), `src/cpm/ccpmut.asm:335-345`, `src/text.asm:41-42` |
| `CON: TTY:`, `CON: CRT:`, `CON: UC1:` | The console mode in effect, after `CON`. A `CON CRT` on a board with no PICO9918 console reports `TTY:`, and a `CON UC1` that can't take effect reports the console in use. `CON: BAT:` is discarded by the BIOS's BAT output path, so it appears nowhere. | [Chapter 2](02-console.md#moving-the-console-with-con), `src/cpm/ccpcmd.asm:206-228`, `src/console.asm:89-96`, `src/console.asm:413-429`, `src/text.asm:43-51` |
| `NAME n` | `SERVICES`: a service's name and its pages, the newest first. | [Chapter 6](06-startup-file.md#services-at-the-prompt), `src/cpm/ccpcmd.asm:786-819` |
| `d: LABEL` from `MOUNT` | The drive and the volume now on it, also when the volume was there already. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `test/programs/mount.asm:149-157` |
| `Unmounted` | `MOUNT d:` has emptied the drive. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `test/programs/mount.asm:49-57` |
| `nn LABEL G1M`, `nn LABEL G8M` | `MOUNT` with no argument: a volume's index in decimal, its label and its geometry, with ` R/O` after a read-only volume and the drive after a mounted one, as `d:`. | [Chapter 5](05-drives-and-cache.md#drives-and-mount), `test/programs/mount.asm:159-234` |
