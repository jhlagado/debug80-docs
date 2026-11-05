---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Appendices"
---

# Appendix D. Error messages

<!-- Source mechanisms checked by text inspection at TEC-OS
     ea3ef3de9133931e925a0220d51c0e971c1fd8dd. Unprefixed ranges use that pin.
     The old-card recipe/capture retains78127ec. CLOSE ERROR
     retains its actualbd15528 experiment fromBook12:65. The diagnostic prompt fence is a literal message template.
     No execution, new capture or physical-board result is claimed. -->

An error message identifies the operation that stopped and the recovery still
available. The tables follow cold boot, the diagnostic prompt, the LCD, the
command processor and the BDOS, then failures in the block cache and `MOUNT`.
Ordinary status lines have a separate table at the end.

In a message `d` stands for a drive letter, `n` for a decimal number, `NAME`
for a word from the command line, `LABEL` for a volume's label and `nn` for a
code in hexadecimal. The rest is printed as it stands. `tecvol` runs on a PC
and [Appendix F](appendix-f-tecvol.md) describes it. The diagnostics ROM is
a separate image, described in [Chapter 27](27-diagnose-the-machine.md).

## Cold boot

Cold boot checks the RAM once before the banner. This message goes straight to
the serial port and TEC-OS then stops in a loop. It doesn't appear on a
display or on the LCD.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `TEC-OS needs 64K RAM` | The bank window at `8000h–BFFFh` failed the RAM patterns, or the bank probe did not find EXPAND 1 behind it. | Fit the required 32 KiB RAM chip in U9 and check the configuration, then reset. | [Appendix G](appendix-g-tec-1g.md), `src/boot.asm:579-632`, `src/text.asm:10` |

## The diagnostic prompt

A card that can't be started or mounted stops cold boot after the banner:

```text
No volume mounted, error nn
R retry> 
```

The prompt uses the ROM PICO9918 console when the PICO9918 responded at cold
boot and the Matrix switch enabled the matrix keyboard. Otherwise it uses
serial. This is a switch-enable test, not a keyboard-presence probe
(`src/console.asm:82-88`, `src/video.asm:22-29`, `src/pico.asm:64-86`).
The LCD's last row shows `CARD?` (`src/boot.asm:817-829`, `src/text.asm:13-15`).
`R` starts the LCD, card and mount again. A corrected or newly inserted card
can therefore mount without reset. The key is echoed as typed and `r`
retries too. Any other key gives the prompt again
(`src/boot.asm:119-132`, `831-847`).
[Chapter 27](27-diagnose-the-machine.md) explains the prompt.

Codes `01h` to `04h` and `0Bh` come from `SDINIT`, the start of the card
(`src/boot.asm:127-131`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | `CMD0` did not return idle reply `01h` in 10 tries. An empty socket gives this code. | Insert a card and press `R`. | [Chapter 17](17-card-blocks-and-volumes.md), `src/sd.asm:215-252` |
| `02` | `ACMD41` did not return ready in 256 tries or `CMD55` returned an error bit. | Retry with `R`. If the fault persists, use another card. | [Chapter 17](17-card-blocks-and-volumes.md), `src/sd.asm:289-334` |
| `03` | `CMD58`, which reads the addressing type from the OCR, failed. | Retry, then use another card if it still fails. | `src/sd.asm:336-377` |
| `04` | `CMD16` failed to set a standard-capacity card's block length to 512 bytes. | Retry, then use another card if it still fails. | `src/sd.asm:355-372` |
| `0B` | The `CMD8` reply echoed a voltage range other than 2.7 to 3.6 V or a check pattern other than `AAh`. | Use another card. | `src/sd.asm:254-287` |

Codes `05h` to `0Ah` are the SD card driver's codes for a block read or write
(`src/sd.asm:20-30`, `385-395`). They do not reach this prompt directly.
The driver stores them in `SDERR`, with no later reader in the ROM. A failed
table read during mounting becomes code `20h`. A failed BDOS transfer gives
a disk error, while a failed warm-boot flush gives `Write lost`. The
`MOUNT` program's own reads and writes give the messages in its table below.

| Code | Meaning |
| --- | --- |
| `05` | The card rejected the command |
| `06` | No read data token arrived within 65,536 polls |
| `07` | The write response was not accepted, including no response within 16 polls |
| `08` | The card stayed busy for 65,536 polls |
| `09` | The block is 4 GiB or more into a standard-capacity card, rejected before any command |
| `0A` | A non-`FFh` byte other than the `FEh` start token arrived while waiting for read data |

These are polling bounds, not measured deadlines (`src/sd.asm:447-486`,
`735-806`). Code 05 precedes block-data transfer. Codes 07 and 08 can follow
transmission of all 512 bytes, so neither establishes rollback of a write.

Codes `20h` to `2Ah` come from the ROM's `MOUNT` routine, its check of the
container. The first check to fail stops the mount and no drive stays mounted
(`src/vol.asm:453-461`, `src/volutil.asm:15-28`).
[Appendix E](appendix-e-container-format.md#the-checks-and-their-codes) gives
every check in order and
[Chapter 17](17-card-blocks-and-volumes.md) explains them.

| Code | Cause | Constant |
| --- | --- | --- |
| `20` | Block 0 or an extension block of the volume table could not be read. | `src/vol.asm:63-68`, `215-223`, `255-260` |
| `21` | Block 0 does not begin with `TECOSVOL`. | `src/vol.asm:71-85` |
| `22` | The container's major version is unsupported. | `src/vol.asm:87-93` |
| `23` | The header or descriptor size is wrong or the applicable drives field exceeds 4. | `src/vol.asm:95-112`, `178-186` |
| `24` | The volume count is zero, above 8 for format 1.0 or above 127. | `src/vol.asm:114-146` |
| `25` | The header checksum or applicable extension-table sum differs. | `src/vol.asm:147-153`, `193-239` |
| `26` | Bad descriptor fields: zero id, invalid flags or geometry, length differing from its geometry or a zero/misaligned start. | `src/vol.asm:262-315`, `449-451` |
| `27` | A volume's exclusive end overflows 32 bits, exceeds the declared container or exceeds `800000h` on a standard-capacity card. That card's last addressable block is `7FFFFFh`, within its first 4 GiB. | `src/vol.asm:330-385` |
| `28` | A volume starts before the preceding volume's end. | `src/vol.asm:316-326` |
| `29` | A drive is invalid, exceeds the header's requested drive count or is assigned twice. | `src/vol.asm:389-421` |
| `2A` | No volume is assigned to drive A. | `src/vol.asm:438-445` |

For `20h`, `R` retries the read. A repeated read failure or a structural fault
needs card inspection. [Chapter 5](05-cards-on-the-pc.md#recovery-after-a-power-cut)
gives the copy-first procedure. `tecvol verify` reports container and directory
faults. `get` also validates the container before extraction, so a failed
container check prevents any file read. `get` does not perform the complete
directory check that `verify` does. A fresh image can be made with `create`
and `put` or a starter recipe
(`tools/tecvol.mjs:73-83`, `115-139`, `159-166`).

The browser uses a high-capacity card model and rejects truncated images
before opening them. It therefore does not reproduce the standard-capacity
limit or the historical short-image failure through Open image. Other code
27 causes remain ROM checks, including end overflow and the declared
container bound (`host/machine.mjs:49`, `web/src/main.mjs:593-615`,
`tools/lib/container.mjs:149-152`, `176`, `src/vol.asm:330-385`).

## The LCD's words

TEC-OS writes two words on the 20 × 4 LCD's last row for a board that may
have no terminal attached.
[Chapter 25](25-startup-inside-the-ccp.md#recovery-words-and-row-ownership) explains when each
is written and cleared.

| Word | Cause | Remedy | See |
| --- | --- | --- | --- |
| `CARD?` | Cold boot stopped at the diagnostic prompt. | `R` clears the LCD before retrying. A successful retry leaves the word cleared. | [Chapter 27](27-diagnose-the-machine.md), `src/boot.asm:119-132`, `817-845`, `src/text.asm:15` |
| `GLCD?` | `CON UC1` received a failure from loading or installing `A:GLCD.SVC`. Examples include a missing or invalid file, insufficient service space, a failed controller probe or a disabled Matrix switch. The old console mode is restored. A fatal BDOS disk error instead aborts the command before this path. | Check the file on A, board configuration and installed services. A successful GLCD load, a later console take or reset clears the ROM's word. Program text on that row has separate ownership. | [Chapter 25](25-startup-inside-the-ccp.md#recovery-words-and-row-ownership), `src/loader.asm:895-980`, `drivers/glcd.asm:66-88`, `src/video.asm:150-182` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h` and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:619-629`, `224-244`).
[Chapter 12](12-results-and-command-chains.md)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched no visible file, including a match consisting only of system files. `TYPE` found no file or had no name. `ERA` matched nothing. `REN` found no old name. | Check the name, drive and user area. | [Chapter 3](03-work-with-files.md), `src/cpm/ccpfile.asm:138-147`, `248-252`, `593-602`, `660-663`, `src/cpm/ccpmut.asm:71-77`, `171-175`, `src/text.asm:22-23` |
| `FILE EXISTS` | `REN` found the new name already in the current user area on that drive. | Choose another name or erase the unwanted file first. | [Chapter 3](03-work-with-files.md), `src/cpm/ccpmut.asm:149-184`, `src/text.asm:55-56` |
| `NO SPACE` | `SAVE` received a make, write or close failure. It erases an existing destination before making the replacement. After a returned write failure it attempts close, but a failed close does not guarantee a complete directory entry for the partial file. Fatal disk errors use BDOS messages instead. | Inspect the partial file, free space or save to another drive. Keep another copy of the original. | [Chapter 10](10-memory-for-programs.md), `src/cpm/ccpcmd.asm:356-442`, `src/text.asm:57-58` |
| `NO SOURCE` | `COPY` did not find its source in the current user area on the specified drive. No destination has changed. | Check the name, drive and user area. | [Chapter 3](03-work-with-files.md), `src/cpm/ccpmut.asm:296-306`, `src/text.asm:34-35` |
| `CANNOT MAKE DEST` | `COPY` could not allocate the destination's directory entry. An old destination has already been erased. | Free directory space or copy to another drive. | `src/cpm/ccpmut.asm:307-317`, `src/text.asm:36-37` |
| `WRITE ERROR` | `COPY` received a nonzero sequential-write result, such as no free block or no entry for the next extent. It attempts to close the destination before printing this message. That close can also fail. A successful close preserves the records already copied. | Inspect or erase the partial destination, free space and copy again. | `src/cpm/ccpmut.asm:324-338`, `370-381`, `src/cpm/bdosrec.asm:119-175`, `src/text.asm:38-39` |
| `CLOSE ERROR` | After reading the source, `COPY` received `FFh` from close because no directory entry matched the destination file control block (FCB). A fatal disk error aborts through the BDOS instead. | Inspect the destination and repeat the copy after correcting the cause. | `src/cpm/ccpmut.asm:347-353`, `src/cpm/bdosfile.asm:289-339`, `src/text.asm:40-41` |

The retained `bd15528` account records `CLOSE ERROR` from a host-model run
that altered the destination's name in the FCB. It is not a newly reproduced
failure or a claim that ordinary copies have been exhaustively tested.

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:588-629`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Other built-ins normally
print the first argument even when a later argument was wrong. CON updates
that position when it starts parsing a separated width, so a width error
names the width (`src/cpm/ccpcmd.asm:120-140`, `src/cpm/ccp.asm:544-554`).
A missing required argument normally gives the question mark alone. TYPE
instead gives `NO FILE` (`src/cpm/ccpfile.asm:593-602`).
[Chapter 3](03-work-with-files.md) has examples. Each row for a program or
service gives a distinct cause.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` was found on the named/current drive in the current area or area 0. A command with no explicit drive can also fall back to A in those two areas. Any type other than `.SVC` becomes COM, so `PICO.DRV` searches for `PICO.COM`. | Check the name, drive and area or use an explicit drive such as `B:NAME`. See the [old-card procedure](#a-card-from-an-older-tec-os) for obsolete display files. | [Chapter 20](20-from-prompt-to-program.md), `src/cpm/ccp.asm:487-517`, `639-673` |
| A program's name | An ambiguous, empty, overlong or invalid name or a drive beyond P. | Correct the name. | [Appendix J](appendix-j-command-reference.md), `src/cpm/ccpcmd.asm:511-670`, `682-700` |
| A program's name | The COM image would extend into the page containing the BDOS entry at `0006h`. | Remove a removable service with `UNLOAD` if that provides enough space or use a smaller program. | `src/cpm/ccp.asm:696-752` |
| `NAME.SVC` | The file is missing or its load returns a failure before installation. A default-mode BDOS disk error instead prints its disk message and aborts through `CHDROP`. | Check the name, drive and card. Services have no area-0 or drive-A lookup fallback. | [Chapter 24](24-loading-and-removing-services.md), `src/loader.asm:925-933`, `src/cpm/ccp.asm:451-481`, `src/cpm/bdoscon.asm:47-72` |
| `NAME.SVC` | The file lacks the service magic or format 4 or fails another loader check before `INIT`, such as size, entry, space, dependency, relocation or stack checks. A format-4 file is not rejected merely for its former `.DRV` type. | Use a matching service file. See the old-card procedure before replacing a whole card. | `src/loader.asm:189-322`, `324-390`, `src/abi.inc:190` |
| `NAME.SVC` | `INIT` returned carry. Failed cleanup can retain reserved pages without published records. | Check the board and `SERVICES` before retrying. | `src/loader.asm:445-455`, `536-587` |
| `GLCD.SVC` | Its controller did not respond, the Matrix switch disabled the keyboard, the UC1 table is occupied or the ROM predates application binary interface (ABI) 5.1. These are INIT failures, not an exhaustive list of load failures. | Check the configuration and `SERVICES`. | `drivers/glcd.asm:66-88`, `src/services.asm:618-658`, `src/video.asm:150-182` |
| `PICO.SVC` | An old driver passed a CRT table to `DRVR`, which accepts only UC1. | Remove its startup line. The ROM supplies the PICO console. | `src/services.asm:618-627` |
| `NAME.SVC` | Record validation failed after successful `INIT`. The status is cleared so startup also prints the name regardless of INIT's returned `A`. | Check `SERVICES`. The cleanup outcome determines whether pages remain reserved. | `src/loader.asm:458-587` |
| `UNLOAD` | The newest service cannot be removed or none exists. Reasons include an active INIT/REMOVE, a mismatched top, a non-removable flag or carry from REMOVE. | Remove services newest first and investigate the retained service. | [Chapter 4](04-drives-and-user-areas.md), `src/cpm/ccpcmd.asm:14-18`, `src/loader.asm:128-153` |
| `COPY` | A missing/ambiguous name, identical source and destination or text after the destination. | Give one source and a different destination with no further operand. | `src/cpm/ccpmut.asm:249-294` |
| `ERA` | A missing, extra or invalid name. | `ERA NAME`. | `src/cpm/ccpmut.asm:13-17` |
| `REN` | Invalid `NEW=OLD` syntax, a missing/ambiguous name or two different explicit drives. | Put a drive on one name or the same drive on both. | `src/cpm/ccpmut.asm:99-147` |
| `SAVE` | An invalid decimal count, a count of 256 or more, a count reaching the BDOS-entry page or a missing/ambiguous filename. | `SAVE n NAME.COM` with a count within the memory bound. | `src/cpm/ccpcmd.asm:290-354` |
| `USER` | The argument is not a single number from 0 to 15. | `USER n`. | `src/cpm/ccpcmd.asm:241-280` |
| `CON` | The device name is not TTY, CRT, BAT, UC1, PICO or GLCD, optionally followed by a colon, or the remaining text is invalid. CRT/PICO may take a separated width. | Use a supported name and width form. | [Chapter 6](06-choose-a-console.md), `src/cpm/ccpcmd.asm:66-231` |
| `CON`, the width | An unsupported width after CRT/PICO or a width joined to the name. `CON CRT80` prints `CRT80?`, not `80?`. | Separate a width of 80, 40 or 32 with a space, as in `CON PICO 40`. | `src/cpm/ccpcmd.asm:120-191`, `src/pico.asm:131-146` |
| `CON`, the width | A width follows another device name. | Put a width only after CRT or PICO. | `src/cpm/ccpcmd.asm:130-136` |
| `CON`, the width | The ROM PICO console did not start or an active claim prevents the width change. | The PICO must respond and the Matrix switch must enable the keyboard at cold boot. Release a program's claim before changing width. | `src/console.asm:82-88`, `src/pico.asm:64-86`, `98-117` |
| `DIR` or `TYPE` | Invalid or extra operands. TYPE also rejects a wildcard or an empty name part. With no operand TYPE gives `NO FILE`. | Use one filename for TYPE or one pattern for DIR. | [Chapter 3](03-work-with-files.md), `src/cpm/ccpfile.asm:25-30`, `593-602` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/text.asm:61-62`).

Startup suppresses an installation failure only when INIT returned `TNENODV`
and cleanup left nothing resident: `SVCRC` is 1 and `SVCRA` is 2. A missing
graphics controller can take that path. Startup registration while CRT is
active returns the same absent-device status, so that line installs nothing
and prints nothing. With both displays and the matrix keyboard enabled, a
successful typed GLCD load keeps the active PICO console selected. It does
not select that console again (`src/cpm/ccp.asm:465-484`,
`src/services.asm:629-647`, `src/loader.asm:925-958`).

A startup width line is also quiet when FIND returns no PICO console.
The typed equivalent prints the width with `?`
(`src/cpm/ccpcmd.asm:161-177`).
[Chapter 25](25-startup-inside-the-ccp.md#startup-origin-and-quiet-results)
derives both conditions. The browser's missing-driver notice is a separate
host check, described in [Appendix I](appendix-i-web-page.md).

### A card from an older TEC-OS

Older cards hold their services in files of type `.DRV` and this ROM doesn't
load them. The CCP takes `GLCD.DRV` as the name of a program and prints it
with a question mark, so a board with the graphics LCD keeps its console on
the serial terminal until a usable driver is installed and selected. A
responding PICO9918 with the Matrix switch enabled has its console from cold
boot without a card driver. The web page reports an old GLCD driver for a
GLCD display choice, as Appendix I describes (`host/card.mjs:26-48`).

New starter card on the web page or a new image from `npm run media`
replaces the card's contents. The other way keeps the card: rename
`GLCD.DRV` to `GLCD.SVC` and change `STARTUP.CMD` to match. That works when
the file's format, its second byte, is 4, the format this ROM loads. An older
card's `PICO.SVC` doesn't install under any name because the ROM's table no
longer takes a driver for the PICO9918. The retained `78127ec` recipe below
copies the historical starter card and adds two display drivers
under the old type: the `PICO.SVC` kept in the repository's tests and the
`GLCD.SVC` from that historical media set:

```sh
cp dist/starter.img old.img
node tools/tecvol.mjs put old.img A test/fixtures/e5154ad/PICO.SVC PICO.DRV
node tools/tecvol.mjs put old.img A dist/files/GLCD.SVC GLCD.DRV
node tools/tecvol.mjs era old.img A GLCD.SVC
printf 'PICO.DRV\nGLCD.DRV\n' > startup.cmd
node tools/tecvol.mjs put old.img A startup.cmd --text
```

In the retained graphics-LCD host-model capture both startup lines fail.
After renaming, PICO still fails and leaves no installed service. GLCD
installs and takes the console:

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

`STARTUP.CMD` still names the old files so the next board reset prints the
same two failures until it is updated. `ERA PICO.SVC` removes the old
driver. The new file comes from `tecvol put` on a PC or "Copy file to drive"
on the web page. A successful Power cycle preparation also removes display
lines of either type. The page checks the chosen driver and stages the
rewrite, so missing/old drivers or protected/full storage can leave the
startup file unchanged (`host/card.mjs:30-72`, `104-116`).
A `GLCD.SVC` of an older format fails under the new name too, as
`GLCD.SVC?`. A matching copy from a new starter card or one put on the card
with `tecvol` replaces it.

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. By default the BDOS then waits for a key and ends the
program or command by warm boot with the rest of a chained line dropped,
whatever the key returned by input (`src/cpm/bdos.asm:115-119`,
`src/cpm/bdoscon.asm:47-72`, `108-137`). An ordinary key retained during
message output can satisfy that wait. Output-time `^S` and `^P` still have
their separate console effects (`src/cpm/bdoscon.asm:318-350`).
A program can take the errors itself with BDOS function 45. With `E` = `FFh`
the error returns with `A` = `FFh`, `H` the code in the table and no message.
With `FEh` the message is printed first and the error returns the same way.
Returning an error preserves the remaining chain. A sequential read or write
that returns an error leaves
the FCB on the record it didn't read or write. Every warm boot puts the default
back (`src/cpm/bdos.asm:261-275`, `src/ram.asm:233-237`).
[Chapter 19](19-a-file-through-the-bdos.md#errors-returned-or-reported) explains them and
[Appendix A](appendix-a-bdos-functions.md#the-errors) lists them by function.

| Message | Code | Cause | Remedy | See |
| --- | ---: | --- | --- | --- |
| `Bdos Err On d: Select` | 4 | No volume on the drive, a drive past D or `?` in an FCB drive byte outside function 17. On warm entry the CCP falls back to A if the saved drive has no volume. | Mount a volume on a usable drive or select another. | [Chapter 4](04-drives-and-user-areas.md), `src/bios.asm:63-96`, `src/cpm/bdosfile.asm:211-234`, `src/cpm/ccp.asm:48-67`, `src/text.asm:74` |
| `Bdos Err On d: R/O` | 2 | A write, make, delete, rename or attribute change on a drive protected by function 28. Close instead succeeds without writing. | Warm boot clears temporary protection. Correct a program that protects a drive before changing it. | `src/cpm/bdosfn.asm:153-166`, `src/cpm/bdosfile.asm:35-41`, `289-298`, `src/cpm/bdoslog.asm:880-891` |
| `Bdos Err On d: R/O` | 2 | A change to a volume marked read-only, including SAVE, ERA, REN or COPY's destination. That volume is not written. | Use a writable volume. Its protection is an on-card property, reapplied at login. | `src/cpm/bdoslog.asm:254-264`, `880-891`, `src/text.asm:76` |
| `Bdos Err On d: File R/O` | 3 | Delete, rename or sequential/random write reached a read-only file. ERA, REN, SAVE and COPY can reach this check. Earlier matching entries in a wildcard ERA remain erased. | Set attributes with BDOS 30, or extract the file with tecvol and put it back with --force and without --ro. The CCP has no attribute-setting command. | `src/cpm/bdosfile.asm:430-445`, `477-501`, `653-664`, `672-678`, `733-745`, `src/cpm/bdosrec.asm:348-355`, `tools/lib/cpmfs.mjs:157-191`, `src/text.asm:77-78` |
| `Bdos Err On d: Bad Sector` | 1 | A data or directory transfer failed. ERA's earlier successful directory writes remain applied, including entries of the same file or earlier wildcard matches. The failing entry and later entries are not confirmed erased. A physical partial write can damage the failing card block. | Copy first and run tecvol verify on the copy. Inspect recoverable files and replace a persistently failing card. | [Chapter 5](05-cards-on-the-pc.md#recovery-after-a-power-cut), `src/cpm/bdosfile.asm:477-501`, `src/cpm/bdoslog.asm:100-136`, `src/cpm/bdosrec.asm:79-103`, `280-286` |
| `Bdos Err On d: Bad Sector` | 1 | A volume extends beyond the card and the card rejects the command. The ROM reports that rejection before transferring block data. The source of a host-model test checks that no image byte changes in this case. | Use a card large enough for the container or build a smaller container with create. | [Chapter 17](17-card-blocks-and-volumes.md), `src/sd.asm:447-458`, `495-515`, `735-745`, `test/sd-range.test.mjs:86-107` |
| `Bdos Err On d: Bad Sector` | 1 | A file's allocation map names a block beyond the volume. Login and delete skip that invalid reference rather than indexing outside the vector. Access to the block fails. | ERA can remove the damaged entry if the required directory writes succeed. Verify a copy before further changes. | [Chapter 19](19-a-file-through-the-bdos.md), `src/cpm/bdosrec.asm:871-873`, `src/cpm/bdoslog.asm:713-742`, `src/cpm/bdoscon.asm:82-101` |

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS writes every changed block in the cache to the
card. A line whose write fails is dropped from the cache. This does not undo
an earlier successful or partial physical write. If any write failed, the
message is printed once on a line of its own and the rest of a chained
line is dropped (`src/cache.asm:292-345`,
`653-668`, `src/text.asm:93`).

The cached changes in dropped lines are lost and the next warm boot has
no such lines left to retry. A directory line is dropped when its write
or preceding data flush fails. The BDOS reports `Bad Sector` at once. If
only the directory write failed, its dropped block leaves nothing for the next
warm boot to retry, so that failure alone gives no `Write lost`. The data blocks
that failed stay dirty in the cache. Another close or flush can retry them.
The warm boot after the recovery key writes them again and gives `Write lost`
if writes still fail (`src/cache.asm:292-345`, `632-651`). The file
that was being written needs writing again, once the card is put right and the
board reset.

Putting the card back does not itself run `SDINIT`. The card is started at cold
boot or a diagnostic retry, not at warm boot (`src/boot.asm:119-131`,
`src/boot.asm:831-847`). If writes still fail at the next warm boot, the changed
lines are dropped and `Write lost` is printed (`src/cache.asm:307-345`,
`661-668`). BDOS function 48 reports a failure to a program at
once: it writes every changed block and returns `A` = `FFh` if any write failed
(`src/cpm/bdos.asm:277-296`). [Chapter 18](18-cache-and-persistence.md)
explains the mechanism. [Chapter 5](05-cards-on-the-pc.md) explains the
image flag that selects write-behind.

## `MOUNT`

The starter card's `MOUNT.COM` prints these messages. Normal return leaves
the command result at 0, so even an error message does not by itself cancel
a following `:` piece. A failed warm-boot flush can still drop that piece
(`test/programs/mount.asm:27-31`, `241-262`, `src/cache.asm:661-668`).
[Chapter 4](04-drives-and-user-areas.md#changing-a-drives-volume) gives the
operator commands and [Chapter 17](17-card-blocks-and-volumes.md) explains
the volume services.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `MOUNT [D: [NAME or INDEX]]` | The argument does not begin with A to D followed by a colon. | MOUNT lists volumes. `MOUNT B: NAME` or `MOUNT B: 2` assigns one. `MOUNT B:` empties B. | `test/programs/mount.asm:33-57`, `241-243`, `262` |
| `No such volume` | No matching label/index or a failed descriptor/table read. | List labels and indexes with MOUNT and inspect the card if a known descriptor cannot be read. | `test/programs/mount.asm:98-143`, `src/volsvc.asm:463-506` |
| `Cannot mount: in use or too large` | The volume is already on another drive, the destination has no suitable allocation-vector slot or the pre-change flush failed. | Empty the other drive or choose a suitably sized slot. A failed flush leaves the assignment unchanged but drops failed cached lines. It prints no additional Write lost message on this path. | [Chapter 4](04-drives-and-user-areas.md#changing-a-drives-volume), `src/volsvc.asm:246-315`, `413-428`, `src/cache.asm:307-345` |
| `Cannot unmount` | An attempt to empty A or failure of the required flush. | Replace A's volume rather than emptying A. For a write fault, recover the card before proceeding. Failed cached lines are dropped with no additional Write lost message on this path. | `src/volsvc.asm:326-362`, `413-428`, `src/cache.asm:307-345` |
| `MOUNT needs TEC-OS with ABI 5.` | The ROM table lacks the TNA tag or its major version is not 5. | Use a MOUNT.COM matched to the ROM. | [Chapter 11](11-use-the-boards-devices.md), `test/programs/mount.asm:14-31` |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy. In `MOUNT`'s listing
`nn` is a volume's index in decimal.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The cold-boot console banner. The LCD banner is `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-first-session.md), `src/text.asm:11`, `67`, `tools/build.mjs:27` |
| `d: LABEL` | A mounted drive and volume at cold boot, with ` (read-only)` for a protected volume. LCD rows 1 and 2 show A and B without that suffix. | `src/boot.asm:640-677`, `src/lcd.asm:122-189`, `src/text.asm:12` |
| `n files, nK free` | DIR's listed-file count and free space. The singular is `1 file, nK free`. | [Chapter 3](03-work-with-files.md), `src/cpm/ccpfile.asm:248-311`, `src/text.asm:24-29` |
| `[more]` | DIR or TYPE paused at a screenful. An ordinary key continues. Esc, Q, q and `;` stop the listing. `^C` and `#` also drop the remaining chain because the comparison clears bit 5. | `src/cpm/ccpfile.asm:464-526`, `src/text.asm:30-31` |
| `ALL (Y/N)?` | ERA's pattern is all wildcards. A line starting with Y or y confirms the erase in the current user area. Other lines and Return alone cancel without failure. Confirming does not override file/volume protection or disk errors. | `src/cpm/ccpmut.asm:25-84`, `src/text.asm:59-60` |
| `COPIED nnnn` | COPY completed and closed its destination. The four hexadecimal digits count records. | `src/cpm/ccpmut.asm:347-368`, `src/text.asm:42-43` |
| `CON: TTY:`, `CON: CRT:`, `CON: UC1:` | The effective console after CON. An unavailable CRT falls back to TTY. A returned UC1 load failure leaves the previous mode. `CON: BAT:` is generated but discarded. | [Chapter 6](06-choose-a-console.md), `src/cpm/ccpcmd.asm:200-231`, `src/loader.asm:895-913`, `src/console.asm:127-199`, `429-440` |
| `NAME n` | SERVICES lists names and resident pages, newest first. | [Chapter 4](04-drives-and-user-areas.md), `src/cpm/ccpcmd.asm:829-864` |
| `d: LABEL` from MOUNT | The drive and volume now assigned, also when already assigned there. | `test/programs/mount.asm:123-157` |
| `Unmounted` | MOUNT emptied the named drive. | `test/programs/mount.asm:49-57`, `258` |
| `nn LABEL G1M`, `nn LABEL G8M` | MOUNT's index in decimal, label and geometry, followed by R/O for a protected volume and `d:` when assigned. Indexes 100 and above use three digits. | `test/programs/mount.asm:159-234` |
