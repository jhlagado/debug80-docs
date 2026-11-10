---
title: D. Error messages
parent: TEC-OS
nav_order: 104
nav_group: "Reference"
---

# Appendix D. Error messages

<!-- Source mechanisms checked by text inspection at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe. Unprefixed ranges use that pin.
     The old-card recipe/capture retains78127ec. CLOSE ERROR
     retains its actualbd15528 experiment fromBook12:65. The diagnostic prompt fence is a literal message template.
     DEL and TED's load error cite TEC-OS
     31b60837d24cf801b5e8cf4daa4856f520227795 with a 31b6083: prefix and
     Thorium b69d544.
     No execution, new capture or physical-board result is claimed. -->

An error message identifies the operation that stopped and the recovery still
available. The tables follow cold boot, the diagnostic prompt, the LCD, the
command processor and the BDOS, then failures in the block cache and `MOUNT`.
Ordinary status lines have a separate table at the end.

In a message `d` stands for a drive letter, `n` for a decimal number, `NAME`
for a word from the command line, `LABEL` for a volume's label and `nn` for a
code in hexadecimal. The rest is printed as it stands. `tecvol` runs on a PC
and [Appendix F](appendix-f-tecvol.md) describes it. The board diagnostics
are a separate program that MON3 loads, described in
[Chapter 28](28-diagnose-the-machine.md).

## Cold boot

Cold boot checks the RAM once before the banner. This message goes straight to
the serial port and TEC-OS then stops in a loop. It doesn't appear on a
display or on the LCD.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `TEC-OS needs 64K RAM` | The bank window at `8000h–BFFFh` failed the RAM patterns or the bank probe did not find EXPAND 1 behind it. | Fit the required 32 KiB RAM chip in U9 and check the configuration, then reset. | [Appendix G](appendix-g-tec-1g.md), `src/boot.asm:417-470`, `src/text.asm:11` |

## The diagnostic prompt

A card that can't be started or mounted stops cold boot after the banner:

```text
No volume mounted, error nn
R retry> 
```

The prompt uses the ROM PICO9918 console when the PICO9918 responded at cold
boot and the Matrix switch enabled the matrix keyboard. Otherwise it uses
serial. This is a switch-enable test, not a keyboard-presence probe
(`src/console.asm:49-52`, `src/video.asm:18-24`, `src/pico.asm:53-68`).
The LCD's last row shows `CARD?` (`src/boot.asm:632-640`, `src/text.asm:14-16`).
`R` starts the LCD, card and mount again. A corrected or newly inserted card
can therefore mount without reset. The key is echoed as typed and `r`
retries too. Any other key gives the prompt again
(`src/boot.asm:92-100`, `642-653`).
[Chapter 28](28-diagnose-the-machine.md) explains the prompt.

Codes `01h` to `04h` and `0Bh` come from `SDINIT`, the start of the card
(`src/boot.asm:97-100`):

| Code | Cause | Remedy | See |
| --- | --- | --- | --- |
| `01` | `CMD0` did not return idle reply `01h` in 10 tries. An empty socket gives this code. | Insert a card and press `R`. | [Chapter 18](18-card-blocks-and-volumes.md), `src/sd.asm:183-215` |
| `02` | `ACMD41` did not return ready in 256 tries or `CMD55` returned an error bit. | Retry with `R`. If the fault persists, use another card. | [Chapter 18](18-card-blocks-and-volumes.md), `src/sd.asm:249-288` |
| `03` | `CMD58`, which reads the addressing type from the OCR, failed. | Retry, then use another card if it still fails. | `src/sd.asm:298-328` |
| `04` | `CMD16` failed to set a standard-capacity card's block length to 512 bytes. | Retry, then use another card if it still fails. | `src/sd.asm:313-324` |
| `0B` | The `CMD8` reply echoed a voltage range other than 2.7 to 3.6 V or a check pattern other than `AAh`. | Use another card. | `src/sd.asm:226-247` |

Codes `05h` to `0Ah` are the SD card driver's codes for a block read or write
(`src/sd.asm:18-26`, `336-347`). They do not reach this prompt directly.
The driver stores them in `SDERR`, with no later reader in the ROM. A failed
table read during mounting becomes code `20h`. A failed BDOS transfer gives
a disk error while a failed warm-boot flush gives `Write lost`. The
`MOUNT` program's own reads and writes give the messages in its table below.

| Code | Meaning |
| --- | --- |
| `05` | The card rejected the command |
| `06` | No read data token arrived within 65,536 polls |
| `07` | The write response was not accepted, including no response within 16 polls |
| `08` | The card stayed busy for 65,536 polls |
| `09` | The block is 4 GiB or more into a standard-capacity card, rejected before any command |
| `0A` | A non-`FFh` byte other than the `FEh` start token arrived while waiting for read data |

These are polling bounds, not measured deadlines (`src/sd.asm:391-428`,
`664-736`). Code 05 precedes block-data transfer. Codes 07 and 08 can follow
transmission of all 512 bytes so neither establishes rollback of a write.

Codes `20h` to `2Ah` come from the ROM's `MOUNT` routine, its check of the
container. The first check to fail stops the mount and no drive stays mounted
(`src/vol.asm:358-363`, `src/volutil.asm:10-20`).
[Appendix E](appendix-e-container-format.md#the-checks-and-their-codes) gives
every check in order and
[Chapter 18](18-card-blocks-and-volumes.md) explains them.

| Code | Cause | Constant |
| --- | --- | --- |
| `20` | Block 0 or an extension block of the volume table could not be read. | `src/vol.asm:46-49`, `165-171`, `200-204` |
| `21` | Block 0 does not begin with `TECOSVOL`. | `src/vol.asm:51-62` |
| `22` | The container's major version is unsupported. | `src/vol.asm:64-72` |
| `23` | The header or descriptor size is wrong or the applicable drives field exceeds 4. | `src/vol.asm:74-85`, `143-147` |
| `24` | The volume count is zero, above 8 for format 1.0 or above 127. | `src/vol.asm:87-110` |
| `25` | The header checksum or applicable extension-table sum differs. | `src/vol.asm:116-120`, `152-182` |
| `26` | Bad descriptor fields: zero id, invalid flags or geometry, length differing from its geometry or a zero/misaligned start. | `src/vol.asm:206-242`, `355-356` |
| `27` | A volume's exclusive end overflows 32 bits, exceeds the declared container or exceeds `800000h` on a standard-capacity card. That card's last addressable block is `7FFFFFh`, within its first 4 GiB. | `src/vol.asm:253-298` |
| `28` | A volume starts before the preceding volume's end. | `src/vol.asm:243-250` |
| `29` | A drive is invalid, exceeds the header's requested drive count or is assigned twice. | `src/vol.asm:302-328` |
| `2A` | No volume is assigned to drive A. | `src/vol.asm:341-351` |

For `20h`, `R` retries the read. A repeated read failure or a structural fault
needs card inspection. [Chapter 6](06-cards-on-the-pc.md#recovery-after-a-power-cut)
gives the copy-first procedure. `tecvol verify` reports container and directory
faults. `get` also validates the container before extraction so a failed
container check prevents any file read. `get` does not perform the complete
directory check that `verify` does. A fresh image can be made with `create`
and `put` or a starter recipe
(`tools/tecvol.mjs:73-83`, `115-139`, `159-166`).

The browser uses a high-capacity card model and rejects truncated images
before opening them. It therefore does not reproduce the standard-capacity
limit or the historical short-image failure through Open image. Other code
27 causes remain ROM checks, including end overflow and the declared
container bound (`host/machine.mjs:49`, `web/src/main.mjs:593-615`,
`tools/lib/container.mjs:149-152`, `176`, `src/vol.asm:253-298`).

## The LCD's words

TEC-OS writes two words on the 20 × 4 LCD's last row for a board that may
have no terminal attached.
[Chapter 26](26-startup-inside-the-ccp.md#recovery-words-and-row-ownership) explains when each
is written and cleared.

| Word | Cause | Remedy | See |
| --- | --- | --- | --- |
| `CARD?` | Cold boot stopped at the diagnostic prompt. | `R` clears the LCD before retrying. A successful retry leaves the word cleared. | [Chapter 28](28-diagnose-the-machine.md), `src/boot.asm:92-100`, `632-652`, `src/text.asm:16` |
| `GLCD?` | `CON UC1` received a failure from loading or installing `A:GLCD.SVC`. Examples include a missing or invalid file, insufficient service space, a failed controller probe or a disabled Matrix switch. The old console mode is restored. A fatal BDOS disk error instead aborts the command before this path. | Check the file on A, board configuration and installed services. A successful GLCD load, a later console take or reset clears the ROM's word. Program text on that row has separate ownership. | [Chapter 26](26-startup-inside-the-ccp.md#recovery-words-and-row-ownership), `src/loader.asm:731-801`, `drivers/glcd.asm:60-73`, `src/video.asm:142-166` |

## The CCP's failures

Each failure in this section sets the return code to `FF00h` and a `:` piece
after it in a chained line then drops the rest of the line
(`src/cpm/ccp.asm:580-587`, `210-227`).
[Chapter 13](13-results-and-command-chains.md)
explains the code.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `NO FILE` | `DIR` matched no visible file, including a match consisting only of system files. `TYPE` found no file or had no name. `ERA` matched nothing. `REN` found no old name. | Check the name, drive and user area. | [Chapter 4](04-work-with-files.md), `src/cpm/ccpfile.asm:105-111`, `203-207`, `518-525`, `585-587`, `src/cpm/ccpmut.asm:55-59`, `134-137`, `src/text.asm:25-26` |
| `FILE EXISTS` | `REN` found the new name already in the current user area on that drive. | Choose another name or erase the unwanted file first. | [Chapter 4](04-work-with-files.md), `src/cpm/ccpmut.asm:119-145`, `src/text.asm:66-67` |
| `NO SPACE` | `SAVE` received a make, write or close failure. It erases an existing destination before making the replacement. After a returned write failure it attempts close but a failed close does not guarantee a complete directory entry for the partial file. Fatal disk errors use BDOS messages instead. | Inspect the partial file, free space or save to another drive. Keep another copy of the original. | [Chapter 11](11-memory-for-programs.md), `src/cpm/ccpcmd.asm:313-396`, `src/text.asm:68-69` |
| `NO SOURCE` | `COPY` did not find its source in the current user area on the specified drive. No destination has changed. | Check the name, drive and user area. | [Chapter 4](04-work-with-files.md), `src/cpm/ccpmut.asm:240-248`, `src/text.asm:37-38` |
| `CANNOT MAKE DEST` | `COPY` could not allocate the destination's directory entry. An old destination has already been erased. | Free directory space or copy to another drive. | `src/cpm/ccpmut.asm:249-255`, `src/text.asm:39-40` |
| `WRITE ERROR` | `COPY` received a nonzero sequential-write result, such as no free block or no entry for the next extent. It attempts to close the destination before printing this message. That close can also fail. A successful close preserves the records already copied. | Inspect or erase the partial destination, free space and copy again. | `src/cpm/ccpmut.asm:267-275`, `314-320`, `src/cpm/bdosrec.asm:94-135`, `src/text.asm:41-42` |
| `CLOSE ERROR` | After reading the source, `COPY` received `FFh` from close because no directory entry matched the destination file control block (FCB). A fatal disk error aborts through the BDOS instead. | Inspect the destination and repeat the copy after correcting the cause. | `src/cpm/ccpmut.asm:289-294`, `src/cpm/bdosfile.asm:247-282`, `src/text.asm:43-44` |

The retained `bd15528` account records `CLOSE ERROR` from a host-model run
that altered the destination's name in the FCB. It is not a newly reproduced
failure or a claim that ordinary copies have been exhaustively tested.

### `NAME?`

The CCP prints the word it stopped at, up to the next space, with a question
mark and a blank line (`src/cpm/ccp.asm:553-587`). For a program, a service,
`COPY` and `UNLOAD` the word is the command's own. Other built-ins normally
print the first argument even when a later argument was wrong. CON updates
that position when it starts parsing a separated width so a width error
names the width (`src/cpm/ccpcmd.asm:101-114`, `src/cpm/ccp.asm:499-507`).
A missing required argument normally gives the question mark alone. TYPE
instead gives `NO FILE` (`src/cpm/ccpfile.asm:518-525`).
[Chapter 4](04-work-with-files.md) has examples. Each row for a program or
service gives a distinct cause.

| Word or command | Cause | Remedy | See |
| --- | --- | --- | --- |
| A program's name | No `NAME.COM` was found on the named/current drive in the current area or area 0. A command with no explicit drive can also fall back to A in those two areas. Any type other than `.SVC` becomes COM so `PICO.DRV` searches for `PICO.COM`. | Check the name, drive and area or use an explicit drive such as `B:NAME`. See the [old-card procedure](#a-card-from-an-older-tec-os) for obsolete display files. | [Chapter 21](21-from-prompt-to-program.md), `src/cpm/ccp.asm:447-467`, `601-626` |
| A program's name | An ambiguous, empty, overlong or invalid name or a drive beyond P. | Correct the name. | [Appendix J](appendix-j-command-reference.md), `src/cpm/ccpcmd.asm:466-608`, `618-636` |
| A program's name | The COM image would extend into the page containing the BDOS entry at `0006h`. | Remove a removable service with `UNLOAD` if that provides enough space or use a smaller program. | `src/cpm/ccp.asm:652-704` |
| `NAME.SVC` | The file is missing or its load returns a failure before installation. A default-mode BDOS disk error instead prints its disk message and aborts through `CHDROP`. | Check the name, drive and card. Services have no area-0 or drive-A lookup fallback. | [Chapter 25](25-loading-and-removing-services.md), `src/loader.asm:759-765`, `src/cpm/ccp.asm:407-434`, `src/cpm/bdoscon.asm:46-64` |
| `NAME.SVC` | The file lacks the service magic or format 4 or fails another loader check before `INIT`, such as size, entry, space, dependency, relocation or stack checks. A format-4 file is not rejected merely for its former `.DRV` type. | Use a matching service file. See the old-card procedure before replacing a whole card. | `src/loader.asm:144-249`, `251-301`, `src/abi.inc:231` |
| `NAME.SVC` | `INIT` returned carry. Failed cleanup can retain reserved pages without published records. | Check the board and `SERVICES` before retrying. | `src/loader.asm:351-356`, `422-466` |
| `GLCD.SVC` | Its controller did not respond, the Matrix switch disabled the keyboard, the UC1 table is occupied or the ROM predates application binary interface (ABI) 5.1. These are INIT failures, not an exhaustive list of load failures. | Check the configuration and `SERVICES`. | `drivers/glcd.asm:60-73`, `src/services.asm:525-557`, `src/video.asm:142-166` |
| `PICO.SVC` | An old driver passed a CRT table to `DRVR`, which accepts only UC1. | Remove its startup line. The ROM supplies the PICO console. | `src/services.asm:525-531` |
| `NAME.SVC` | Record validation failed after successful `INIT`. The status is cleared so startup also prints the name regardless of INIT's returned `A`. | Check `SERVICES`. The cleanup outcome determines whether pages remain reserved. | `src/loader.asm:359-466` |
| `UNLOAD` | The newest service cannot be removed or none exists. Reasons include an active INIT/REMOVE, a mismatched top, a non-removable flag or carry from REMOVE. | Remove services newest first and investigate the retained service. | [Chapter 5](05-drives-and-user-areas.md), `src/cpm/ccpcmd.asm:13-16`, `src/loader.asm:101-118` |
| `COPY` | A missing/ambiguous name, identical source and destination or text after the destination. | Give one source and a different destination with no further operand. | `src/cpm/ccpmut.asm:191-230` |
| `ERA` | A missing, extra or invalid name. `DEL`, another name for ERA present at TEC-OS `31b6083`, fails on the same conditions with the same output. | `ERA NAME` or `DEL NAME`. | `src/cpm/ccpmut.asm:10-14`, `31b6083:src/tables.asm:64-67` |
| `REN` | Invalid `NEW=OLD` syntax, a missing/ambiguous name or two different explicit drives. | Put a drive on one name or the same drive on both. | `src/cpm/ccpmut.asm:74-109` |
| `SAVE` | An invalid decimal count, a count of 256 or more, a count reaching the BDOS-entry page or a missing/ambiguous filename. | `SAVE n NAME.COM` with a count within the memory bound. | `src/cpm/ccpcmd.asm:263-311` |
| `USER` | The argument is not a single number from 0 to 15. | `USER n`. | `src/cpm/ccpcmd.asm:217-247` |
| `CON` | The device name is not TTY, CRT, BAT, UC1, PICO or GLCD, optionally followed by a colon, or the remaining text is invalid. CRT/PICO may take a separated width. | Use a supported name and width form. | [Chapter 7](07-choose-a-console.md), `src/cpm/ccpcmd.asm:51-207` |
| `CON`, the width | An unsupported width after CRT/PICO or a width joined to the name. `CON CRT80` prints `CRT80?`, not `80?`. | Separate a width of 80, 40 or 32 with a space, as in `CON PICO 40`. | `src/cpm/ccpcmd.asm:101-165`, `src/pico.asm:104-118` |
| `CON`, the width | A width follows another device name. | Put a width only after CRT or PICO. | `src/cpm/ccpcmd.asm:107-111` |
| `CON`, the width | The ROM PICO console did not start or an active claim prevents the width change. | The PICO must respond and the Matrix switch must enable the keyboard at cold boot. Release a program's claim before changing width. | `src/console.asm:49-52`, `src/pico.asm:53-68`, `src/pico.asm:81-94` |
| `DIR` or `TYPE` | Invalid or extra operands. TYPE also rejects a wildcard or an empty name part. With no operand TYPE gives `NO FILE`. | Use one filename for TYPE or one pattern for DIR. | [Chapter 4](04-work-with-files.md), `src/cpm/ccpfile.asm:17-20`, `518-525` |

The bad characters in a name are `<>,;:[]%|()/\`, from `BADCHARS`
(`src/text.asm:72-73`).

Startup suppresses an installation failure only when INIT returned `TNENODV`
and cleanup left nothing resident: `SVCRC` is 1 and `SVCRA` is 2. A missing
graphics controller can take that path. Startup registration while CRT is
active returns the same absent-device status so that line installs nothing
and prints nothing. With both displays and the matrix keyboard enabled, a
successful typed GLCD load keeps the active PICO console selected. It does
not select that console again (`src/cpm/ccp.asm:426-437`,
`src/services.asm:533-549`, `src/loader.asm:759-780`).

A startup width line is also quiet when FIND returns no PICO console.
The typed equivalent prints the width with `?`
(`src/cpm/ccpcmd.asm:130-146`).
[Chapter 26](26-startup-inside-the-ccp.md#startup-origin-and-quiet-results)
derives both conditions. The browser's missing-driver notice is a separate
host check, described in [Appendix I](appendix-i-web-page.md).

### A card from an older TEC-OS

Older cards hold their services in files of type `.DRV` and this ROM doesn't
load them. The CCP takes `GLCD.DRV` as the name of a program and prints it
with a question mark so a board with the graphics LCD keeps its console on
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
rewrite so missing/old drivers or protected/full storage can leave the
startup file unchanged (`host/card.mjs:30-72`, `host/card.mjs:104-117`).
A `GLCD.SVC` of an older format fails under the new name too, as
`GLCD.SVC?`. A matching copy from a new starter card or one put on the card
with `tecvol` replaces it.

## The BDOS's errors

The BDOS prints these messages when a disk operation can't be done at all.
Each starts a new line. By default the BDOS then waits for a key and ends the
program or command by warm boot with the rest of a chained line dropped,
whatever the key returned by input (`src/cpm/bdos.asm:100-103`,
`src/cpm/bdoscon.asm:46-64`, `99-127`). An ordinary key retained during
message output can satisfy that wait. Output-time `^S` and `^P` still have
their separate console effects (`src/cpm/bdoscon.asm:297-322`).
A program can take the errors itself with BDOS function 45. With `E` = `FFh`
the error returns with `A` = `FFh`, `H` the code in the table and no message.
With `FEh` the message is printed first and the error returns the same way.
Returning an error preserves the remaining chain. A sequential read or write
that returns an error leaves
the FCB on the record it didn't read or write. Every warm boot puts the default
back (`src/cpm/bdos.asm:217-229`, `src/ram.asm:224-225`).
[Chapter 20](20-a-file-through-the-bdos.md#errors-returned-or-reported) explains them and
[Appendix A](appendix-a-bdos-functions.md#the-errors) lists them by function.

| Message | Code | Cause | Remedy | See |
| --- | ---: | --- | --- | --- |
| `Bdos Err On d: Select` | 4 | No volume on the drive, a drive past D or `?` in an FCB drive byte outside function 17. On warm entry the CCP falls back to A if the saved drive has no volume. | Mount a volume on a usable drive or select another. | [Chapter 5](05-drives-and-user-areas.md), `src/bios.asm:61-92`, `src/cpm/bdosfile.asm:173-192`, `src/cpm/ccp.asm:48-62`, `src/text.asm:87` |
| `Bdos Err On d: R/O` | 2 | A write, make, delete, rename or attribute change on a drive protected by function 28. Close instead succeeds without writing. | Warm boot clears temporary protection. Correct a program that protects a drive before changing it. | `src/cpm/bdosfn.asm:126-138`, `src/cpm/bdosfile.asm:30-35`, `247-253`, `src/cpm/bdoslog.asm:758-767` |
| `Bdos Err On d: R/O` | 2 | A change to a volume marked read-only, including SAVE, ERA, REN or COPY's destination. That volume is not written. | Use a writable volume. Its protection is an on-card property, reapplied at login. | `src/cpm/bdoslog.asm:215-220`, `758-767`, `src/text.asm:89` |
| `Bdos Err On d: File R/O` | 3 | Delete, rename or sequential/random write reached a read-only file. ERA, REN, SAVE and COPY can reach this check. Earlier matching entries in a wildcard ERA remain erased. | Set attributes with BDOS 30 or extract the file with tecvol and put it back with --force and without --ro. The CCP has no attribute-setting command. | `src/cpm/bdosfile.asm:357-368`, `393-413`, `539-545`, `556-560`, `610-617`, `src/cpm/bdosrec.asm:276-285`, `tools/lib/cpmfs.mjs:157-191`, `src/text.asm:90-91` |
| `Bdos Err On d: Bad Sector` | 1 | A data or directory transfer failed. ERA's earlier successful directory writes remain applied, including entries of the same file or earlier wildcard matches. The failing entry and later entries are not confirmed erased. A physical partial write can damage the failing card block. | Copy first and run tecvol verify on the copy. Inspect recoverable files and replace a persistently failing card. | [Chapter 6](06-cards-on-the-pc.md#recovery-after-a-power-cut), `src/cpm/bdosfile.asm:393-413`, `src/cpm/bdoslog.asm:83-112`, `src/cpm/bdosrec.asm:69-82`, `222-225` |
| `Bdos Err On d: Bad Sector` | 1 | A volume extends beyond the card and the card rejects the command. The ROM reports that rejection before transferring block data. The source of a host-model test checks that no image byte changes in this case. | Use a card large enough for the container or build a smaller container with create. | [Chapter 18](18-card-blocks-and-volumes.md), `src/sd.asm:391-399`, `437-454`, `664-672`, `test/sd-range.test.mjs:86-107` |
| `Bdos Err On d: Bad Sector` | 1 | A file's allocation map names a block beyond the volume. Login and delete skip that invalid reference rather than indexing outside the vector. Access to the block fails. | ERA can remove the damaged entry if the required directory writes succeed. Verify a copy before further changes. | [Chapter 20](20-a-file-through-the-bdos.md), `src/cpm/bdosrec.asm:705-706`, `src/cpm/bdoslog.asm:599-627`, `src/cpm/bdoscon.asm:75-91` |

## `Write lost`

`Write lost` applies to a volume written behind, whose writes wait in the block
cache. At each warm boot TEC-OS writes every changed block in the cache to the
card. A line whose write fails is dropped from the cache. This does not undo
an earlier successful or partial physical write. If any write failed, the
message is printed once on a line of its own and the rest of a chained
line is dropped (`src/cache.asm:254-295`,
`557-572`, `src/text.asm:108`).

The cached changes in dropped lines are lost and the next warm boot has
no such lines left to retry. A directory line is dropped when its write
or preceding data flush fails. The BDOS reports `Bad Sector` at once. If
only the directory write failed, its dropped block leaves nothing for the next
warm boot to retry so that failure alone gives no `Write lost`. The data blocks
that failed stay dirty in the cache. Another close or flush can retry them.
The warm boot after the recovery key writes them again and gives `Write lost`
if writes still fail (`src/cache.asm:254-295`, `546-555`). The file
that was being written needs writing again, once the card is put right and the
board reset.

Putting the card back does not itself run `SDINIT`. The card is started at cold
boot or a diagnostic retry, not at warm boot (`src/boot.asm:92-100`,
`src/boot.asm:642-653`). If writes still fail at the next warm boot, the changed
lines are dropped and `Write lost` is printed (`src/cache.asm:265-295`,
`566-572`). BDOS function 48 reports a failure to a program at
once: it writes every changed block and returns `A` = `FFh` if any write failed
(`src/cpm/bdos.asm:231-250`). [Chapter 19](19-cache-and-persistence.md)
explains the mechanism. [Chapter 6](06-cards-on-the-pc.md) explains the
image flag that selects write-behind.

## `MOUNT`

The starter card's `MOUNT.COM` prints these messages. Normal return leaves
the command result at 0 so even an error message does not by itself cancel
a following `:` piece. A failed warm-boot flush can still drop that piece
(`test/programs/mount.asm:26-30`, `245-266`, `src/cache.asm:566-572`).
[Chapter 5](05-drives-and-user-areas.md#changing-a-drive-s-volume) gives the
operator commands and [Chapter 18](18-card-blocks-and-volumes.md) explains
the volume services.

| Message | Cause | Remedy | See |
| --- | --- | --- | --- |
| `MOUNT [D: [NAME or INDEX]]` | The argument does not begin with A to D followed by a colon. | MOUNT lists volumes. `MOUNT B: NAME` or `MOUNT B: 2` assigns one. `MOUNT B:` empties B. | `test/programs/mount.asm:32-56`, `245-247`, `266` |
| `No such volume` | No matching label/index or a failed descriptor/table read. | List labels and indexes with MOUNT and inspect the card if a known descriptor cannot be read. | `test/programs/mount.asm:101-146`, `src/volsvc.asm:424-458` |
| `Cannot mount: in use or too large` | The volume is already on another drive, the destination has no suitable allocation-vector slot or the pre-change flush failed. | Empty the other drive or choose a suitably sized slot. A failed flush leaves the assignment unchanged but drops failed cached lines. It prints no additional Write lost message on this path. | [Chapter 5](05-drives-and-user-areas.md#changing-a-drive-s-volume), `src/volsvc.asm:211-266`, `372-386`, `src/cache.asm:265-295` |
| `Cannot unmount` | An attempt to empty A or failure of the required flush. | Replace A's volume rather than emptying A. For a write fault, recover the card before proceeding. Failed cached lines are dropped with no additional Write lost message on this path. | `src/volsvc.asm:276-315`, `372-386`, `src/cache.asm:265-295` |
| `MOUNT needs TEC-OS with ABI 5.` | The ROM table lacks the TNA tag or its major version is not 5. | Use a MOUNT.COM matched to the ROM. | [Chapter 12](12-use-the-boards-devices.md), `test/programs/mount.asm:13-30` |

## TED's load error

The starter card's TED at TEC-OS `31b6083` (Thorium `b69d544`) prints this
line and returns to the prompt when the file it is opening holds a byte it
rejects
(`Thorium b69d544:README.md:25-30`, `31b6083:docs/compatibility.md:196`,
`31b6083:test/ted.test.mjs:92-120`). The earlier TED, Thorium `967678c` on
the release card, also rejects `00h` padding at the end of a file and gives
error 03 without a line or column
(`Thorium 967678c:ted/src/load.asm:48-53`, `121-125`).

| Message | Cause | Action |
| --- | --- | --- |
| `EDIT error 03 Ln Cn` | The byte at that line and column is one TED rejects: a control other than tab, LF and a CR before LF, a byte from `7Fh` up, or a `00h` that is not part of a run filling the rest of the last record. Each byte counts as one column, a tab included. | Correct that byte on the PC and put the file again. A file that ends at its first `^Z`, or in `00h` filling the rest of its last record, opens without this error. |

## Lines that report no fault

These lines appear in ordinary runs and need no remedy. In `MOUNT`'s listing
`nn` is a volume's index in decimal.

| Line | Meaning | See |
| --- | --- | --- |
| `TEC-OS 0.1 for TEC-1G` | The cold-boot console banner. The LCD banner is `TEC-OS 0.1  TEC-1G`. | [Chapter 1](01-first-session.md), `src/text.asm:12`, `79`, `tools/build.mjs:28` |
| `d: LABEL` | A mounted drive and volume at cold boot, with ` (read-only)` for a protected volume. LCD rows 1 and 2 show A and B without that suffix. | `src/boot.asm:482-509`, `src/lcd.asm:105-169`, `src/text.asm:13` |
| `n files, nK free` | DIR's listed-file count and free space. The singular is `1 file, nK free`. | [Chapter 4](04-work-with-files.md), `src/cpm/ccpfile.asm:203-259`, `src/text.asm:27-32` |
| `[more]` | DIR or TYPE paused at a screenful. An ordinary key continues. Esc, Q, q and `;` stop the listing. `^C` and `#` also drop the remaining chain because the comparison clears bit 5. | `src/cpm/ccpfile.asm:405-462`, `src/text.asm:33-34` |
| `ALL (Y/N)?` | ERA's or DEL's pattern is all wildcards. A line starting with Y or y confirms the erase in the current user area. Other lines and Return alone cancel without failure. Confirming does not override file/volume protection or disk errors. | `src/cpm/ccpmut.asm:18-63`, `src/text.asm:70-71` |
| `COPIED nnnn` | COPY completed and closed its destination. The four hexadecimal digits count records. | `src/cpm/ccpmut.asm:289-304`, `src/text.asm:45-46` |
| `CON: TTY:`, `CON: CRT:`, `CON: UC1:` | The effective console after CON. An unavailable CRT falls back to TTY. A returned UC1 load failure leaves the previous mode. `CON: BAT:` is generated but discarded. | [Chapter 7](07-choose-a-console.md), `src/cpm/ccpcmd.asm:183-207`, `src/loader.asm:731-745`, `src/console.asm:82-142`, `345-353` |
| `NAME n` | SERVICES lists names and resident pages, newest first. | [Chapter 5](05-drives-and-user-areas.md), `src/cpm/ccpcmd.asm:760-786` |
| `d: LABEL` from MOUNT | The drive and volume now assigned, also when already assigned there. | `test/programs/mount.asm:126-161` |
| `Unmounted` | MOUNT emptied the named drive. | `test/programs/mount.asm:48-56`, `262` |
| `nn LABEL G1M`, `nn LABEL G8M` | MOUNT's index in decimal, label and geometry, followed by R/O for a protected volume and `d:` when assigned. Indexes 100 and above use three digits. | `test/programs/mount.asm:163-238` |
