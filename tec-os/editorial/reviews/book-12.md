# Review of TEC-OS book, Appendix D, error messages (branch `tec-os-book`, 488786a, on TEC-OS bd15528)

Method: `tec-os/appendix-d-error-messages.md` from `origin/tec-os-book`, read against `tec-os/editorial/STYLE.md` and the vocabulary and code rules of the brief for the book's parts. The code is bd15528; the exported tree's `src/`, `drivers/`, `test/programs/` and `tools/` match that commit with no differences. Every cited `file:line` range was printed and read. All 35 distinct chapter links resolve under the site's slug rule, and each linked section was read for the row's message.

Completeness: every `DB` string and every `PUTS`, `PUTSTR`, `LCD3`, `LCDWRD` and `ERRTEXT` user in `src/` and `drivers/` was listed, with the strings in `test/programs/mount.asm` and `vols.asm`. Each string that a run can print is in the appendix, except the LCD's volume rows (F19). `drivers/` holds only service names. All message text in the appendix matches the source byte for byte, including the trailing space of `R retry, H header> `, the two spaces in `TEC-OS 0.1  TEC-1G`, and the 13 bad characters.

Runs: on the host model with the prebuilt ROM, `tools/capture.mjs` and a host script that drives the same `Machine` class. The script injects card faults as `test/cache.test.mjs` does, and answers the card's commands with chosen responses.

## 1. Factual errors and claims needing correction

**F1. `tecvol verify` doesn't pass either case (lines 91-93).** The text says verify passes code `28` on a format 1.0 card and code `29` for a drive past the header's number. At bd15528 it rejects both, and `tecvol create` rejects the second:

```text
$ tecvol verify order.img       (descriptors swapped, checksum good, format 1.0)
tecvol: volume 1: not after volume 0            exit 1
$ tecvol verify past.img        (format 1.1, 2 drives, volume on C)
tecvol: volume 1: drive C is past the card's 2 drive(s)     exit 1
$ tecvol create drv2.img --volume G1M:SYSTEM:A --volume G1M:EXTRA:C --drives 2
tecvol: volume 1: drive C is past the card's 2 drive(s)     exit 1
```

The ROM gives `28` and `29` on those two images. The checks are `tools/lib/container.mjs:174` and `:178`. The sentence comes from Appendix E, which is checked against 98c6416, and the code has moved since. Correction: delete "`tecvol verify` passes two cases ... the check for those." The next finding replaces it. Related: Appendix E, lines 155-160, 200-225, states the same two cases with transcripts that bd15528 no longer gives, and needs the same correction when it is rechecked.

**F2. `tecvol get` reads nothing from a card that stops the mount (line 90).** "Save what `tecvol get` can read" implies a route that doesn't exist for codes `21` to `2A`. `get`, `info` and `verify` all open the image through `parseContainer`, which stops at the same faults. `tecvol get past.img A VOLS.COM` ends with the same `tecvol: volume 1: drive C ...` line and exit 1, and `info` does too. Each of the ROM's checks has an equal or stricter one in `parseContainer` (`tools/lib/container.mjs:130-195`). Correction, at lines 90-93: "`tecvol verify` prints the fault in words. `tecvol get` makes the same check, so it reads no file from such a copy. Write a new image with `tecvol create` or a new starter card."

**F3. The remedy for `Write lost` fails for its own example (lines 195-196).** "Put right what stopped the write, such as a card taken out, and press `^C`" doesn't work for a card taken out. `SDINIT` has one caller, `src/boot.asm:37`, so a card put back is never started, and the model's card rejects `CMD24` and `CMD17` until `CMD0` and `ACMD41` have run. Run: changes in the cache, card out, key: `Write lost`; card back; `^C`, `^C`: `Write lost` each time; `DIR` prints nothing and then `Write lost`. A reset then mounts the card and the changes are gone (0 records in the file on the card). The only recovery route is a failure that clears with the card left in place: with injected write failures lifted, the next `^C` printed nothing and the flush reached the card. The physical board's behaviour is unconfirmed, but the code gives it no path to restart a card. Correction: "Put right what stopped the write and press `^C` at the prompt for another warm boot. A card that has been taken out can't be used again without a reset, since only cold boot starts a card, so its changes are lost." See D2. Chapter 19, line 250, needs no change: it says the message comes at each `^C`.

**F4. The `NAME.SVC` row leaves out the commonest failure (line 140).** "A display driver also fails when its display or the matrix keyboard is missing, or when that display has a driver already." `GLCD.SVC` also fails when its display is there and has no driver, because another display is the console. `node tools/capture.mjs --board pico` prints `GLCD.SVC?` at every boot of the starter card. `drivers/glcd.asm:34-41` is the test, and only `CON UC1` passes it. Correction, after "already": "`GLCD.SVC` also fails while the PICO9918 is the console, and only `CON UC1` installs it then." Cite `drivers/glcd.asm:34-53` and `drivers/pico.asm:47-59`.

**F5. `WRITE ERROR`: the partial destination and the remedy (line 122).** Confirmed cause, for both a full drive and a directory with no entry for the next extent. "What remains of it is incomplete" understates it, and the remedy leaves out a step. Runs on a drive with room for 20 KiB and for 4 KiB:

| Source | Room | Destination on the card | `DIR`'s free space after | After `ERA` | After `^C` |
| --- | --- | --- | --- | --- | --- |
| 40,960 bytes | 20 KiB | 16,384 bytes, the one extent closed | 0K | 16K | 20K |
| 6,144 bytes | 4 KiB | 0 bytes, name only | 0K | not run | 4K |

The blocks written to the last, unclosed extent are on no directory entry, and they stay counted as used until the next warm boot. No built-in command makes a warm boot, so `ERA` followed by a copy can fail again with space that `DIR` doesn't show. Correction to the cause: "The destination isn't closed. It keeps only the extents already written to its directory, so its length is a multiple of 16 KiB, and 0 if the first extent was the one being written." Correction to the remedy: "`ERA` the destination, free some space, press `^C` to give back the blocks of the unclosed extent, and copy again."

**F6. `NO SPACE`: the same behaviour (line 119).** "A part of the new file can remain" is confirmed: `SAVE 100 B:SV.COM` with 20 KiB free left `SV.COM` at 16,384 bytes. `DIR` then showed `0K free`, and `4K free` after `^C`. The remedy's "`DIR` gives the space free" is therefore low until a warm boot. Correction: "... a part of the new file can remain, in whole extents of 16 KiB. Press `^C` before `DIR` to see the space free."

**F7. A sentence that can't apply (line 121).** "Any file of that name has been erased already." `CANNOT MAKE DEST` means function 22 found no free directory entry, and erasing a file of that name frees at least one, so the make can't fail after an erase. Runs: `COPY SMALL.DAT B:` on a directory with no free entry gives the message; `COPY BIG.DAT B:F1.DAT`, onto an existing name on the same directory, gets past the make and ends in `WRITE ERROR`. Correction: delete the sentence.

**F8. `ALL (Y/N)?` (line 232).** Two errors.
- "erases every file": it erases the files of the current user area on that drive. With `V.COM` in user 0 and `U.COM` in user 1 on B, `ERA B:*.*` and `yes` left `U.COM`.
- "Any other line erases nothing": true, but a bare Return isn't a line here. The first Return is taken as the answer's first character and `ERADRAIN` then reads to the next Return (`src/cpm/ccp.asm:872-881`), so the command waits for a second one. See D4.

Correction: "A line that starts with `Y` or `y` erases every file of the current user area on the drive. Any other line erases nothing, and the command counts as a success. A Return with nothing before it needs a second Return."

**F9. `CON: BAT: reader and list` doesn't appear (line 234).** The row says the line shows the console in use, after `CON`. After `CON BAT` the report goes to the list device, which discards it (`src/console.asm:274`): the serial port shows only the echoed command, and Chapter 2 says the same at lines 142-145. Correction: move `CON: BAT: reader and list` to a sentence of its own: "`CON: BAT: reader and list` goes to the list device, which discards it, so it appears nowhere."

**F10. `GLCD?` (line 105).** The cause "couldn't load `A:GLCD.SVC`" and the remedy "Put `GLCD.SVC` on drive A" don't cover the plainest case. On the serial board with `GLCD.SVC` on the card, `CON UC1` writes `GLCD?` because the service's INIT finds no controller (capture: `node tools/capture.mjs CON "CON CRT" "CON UC1" CON --lcd`, on the starter card). Also, `CON CRT` moves the console back but leaves the word on the LCD: on the pico board after a failed `CON UC1`, `CON CRT` reports `CON: CRT: PICO9918` and row 3 still shows `GLCD?`. Correction to the cause: "`CON UC1` couldn't load or install `A:GLCD.SVC`: the file is missing, or the board has no GLCD." Add to the remedy: "The word stays until a display driver takes the console or a reset."

**F11. `Bad Sector` for a block past the end of the volume (line 171).** The row reads as a fault in one file. The check runs when the drive is logged in (`src/cpm/bdos.asm:2318`), so the first use of the drive gives it whichever file is named: `DIR B:` and `TYPE B:OK.TXT` both gave it, with `OK.TXT` sound. On drive A it comes at cold boot before any prompt, and again after every key (D3). Add to the cause: "The first use of the drive gives this, whichever file is named. On drive A it comes at cold boot and after each key, and no prompt appears."

**F12. Two statements about failed card access disagree (lines 63-64 against 173).** Line 64 says a failed read or write after the mount "is a BDOS error or `Write lost`". Line 173 says a directory read that fails prints nothing, which a run confirms (`DIR C:!USER 0!USER 1` printed nothing and dropped the chain). Also, a failed read of the volume table in `MOUNT` or `VOLS` isn't a BDOS error: `VDESC` returns NZ and `MOUNT` prints `No such volume` (`src/vol.asm:708-736`), which line 216 leaves out. That path was read in the code and not run. Correction at line 64: "... is a BDOS error, `Write lost` or, for a directory read, no message at all." Add to line 216's cause: "A failed read of the table gives this too."

**F13. The `DIR` or `TYPE` row is incomplete (line 148).** "`DIR` has more than one argument, or `TYPE` has a wildcard." Runs: `TYPE A B` gives `A?`, `TYPE B:` gives `B:?`, `DIR <` gives `<?`. Correction: "`DIR` has more than one argument or a bad name. `TYPE` has more than one, a wildcard, a bad name or no name part."

**F14. "With the return code unchanged" (line 208).** The CCP clears the code before each piece (`src/cpm/ccp.asm:158-159`), so the code after `MOUNT` is 0, whatever came before. `NOSUCH!MOUNT!:DIR README.TXT` ran `:DIR`. Correction: "with a return code of 0".

**F15. Code `25`'s table sum (line 79).** The ROM adds up only the table's blocks after block 0 (`src/vol.asm:95-101`). A format 1.1 card with 2 volumes and a wrong table sum boots; with 20 volumes it gives `25`. Correction: "The header's checksum differs, or on a card with a table past block 0 the table's sum."

**F16. `FILE EXISTS` confirmed, with a hazard left out (line 118).** `REN B:NEW.COM=OLD.COM` with `B:NEW.COM` present gives `FILE EXISTS`; with it absent, it renames `A:OLD.COM` to `A:NEW.COM`, and `B:OLD.COM` stays. The row covers that form. The other form does harm: `REN X.COM=B:OLD.COM` tests drive A, renames on drive B, and gives B two files named `X.COM` when it already has one (D1). Add: "`REN NEW=B:OLD` tests the current drive and renames on drive B, and can leave two files of one name there."

**F17. `CLOSE ERROR`: the cause is right, and no ordinary run reaches it (line 123).** Function 16 returns FFh only from `FINDEXCT` (`src/cpm/bdos.asm:620-623`), which is the row's cause. With the destination's name altered in `RENFCB` at `CPDONE`, the run printed `CLOSE ERROR`, and `DIR` showed the destination with 0 bytes. No other way to it was found: the make and the writes succeed on the same FCB, nothing else runs during `COPY`, and a failed directory read ends in a warm boot before the test. Optional addition: "No ordinary run gives this message."

**F18. The "Typed" column (lines 134, 138, 139).** The column's head says what was typed, but `NAME.COM` and `NAME.PRL` are the files. The word printed is what was typed: `BIG` gives `BIG?` and `BIG.COM` gives `BIG.COM?`, whichever the file. Correction: head the column "Word", and use `A program's name` in both rows, with the file named in the cause.

**F19. The LCD's volume rows are missing (line 229).** Cold boot also writes each drive on the LCD (`src/lcd.asm:68` on), and the captures show `A: SYSTEM` and `B: WORK` on rows 2 and 3 of the display. The banner row at line 228 gives the LCD's version of its text, and this row doesn't. Add: "The LCD's rows below the banner show the same, with no read-only mark." The missing mark was read in the code (`LCDVOLS` copies the label only) and not run on a read-only volume.

**F20. Lines 16 and 209 promise more than the chapters hold.** "links to the chapter that explains the message" and "Chapter 4 explains them". `No such volume` and `MOUNT D: [NAME or INDEX]` appear in no chapter; Chapter 4 says only that `MOUNT` alone prints how it is used. `MOUNT needs TEC-OS with ABI 4.` and the `VOLS` line appear in no chapter either; Chapter 9's section explains the test and not these programs. Correction: at line 16, "links to the chapter that explains the message or its subject"; at line 209, "Chapter 4 explains the programs".

## 2. Citations

The range, or the fix:

- **C1.** Line 104, `src/svc.asm:420-433`: lines 432-433 are the next routine's header. Use `420-431`.
- **C2.** Line 137, `src/cpm/ccp.asm:264-266` and `1425-1475`: these cover ambiguous names and bad characters. Names too long and a drive past P fail in `PARSEFCB`. Add `src/cpm/ccp.asm:232` and `1318-1420`.
- **C3.** Line 138, `src/cpm/ccp.asm:388-420`: lines 401-420 are the end of `LOADCOM` and the start of `CMDDIR`, and the limit's test isn't included. Use `369-371` and `388-400`.
- **C4.** Line 139, `src/prl.asm:14-55`: lines 54-55 are the move. Use `14-53`.
- **C5.** Line 140, `src/glcd.asm:68-83`: this shows the load and none of the failures named. Add `src/svc.asm:57-85`, `drivers/pico.asm:47-59` and `drivers/glcd.asm:34-53`.
- **C6.** Line 147, `src/cpm/ccp.asm:1090-1148`: lines 1147-1148 are a blank and the next routine's comment. Use `1090-1146`.
- **C7.** Line 168 claims random writes, and `813` is `FNWRITE`. Add `src/cpm/bdos.asm:1032`.
- **C8.** Line 217 claims a failed flush, and neither range holds it. Add `src/vol.asm:681-690`.
- **C9.** Line 229, `src/vol.asm:821-835`: this is the label's loop and the next line. `SHOWVOL` is `src/vol.asm:805-834`.

All others point at what they claim. `src/cpm/bdos.asm:508-509` (line 167) is a comment; it is accurate, and the code is at `495`.

## 3. Vocabulary and style

**S1. Service resident memory (lines 138, 139).** "Use `UNLOAD` to free the memory services hold" and "use `UNLOAD` to free memory". The agreed term is *service resident memory*. Correction: "Use `UNLOAD` to free service resident memory."

**S2. ROM table (line 219).** "The table at `C003h` is missing". Correction: "The ROM table is missing, or its major version isn't 4".

**S3. A prompt that waits (lines 43, 103).** "while the prompt waits", "The diagnostic prompt is waiting." Correction, as in the review of Chapter 1: "while TEC-OS waits at the prompt", "TEC-OS is waiting at the diagnostic prompt."

**S4. Line lengths.** Lines 68 (96 characters), 98 (83) and 201 (82) run past "about 78", all from links. Low.

Front matter, the commit line, heading forms, nav order, the absence of mind verbs, and the terms `.SVC`, service, driver and record are all as the standards require. No line names a development stage, a decision or a defect. The text block at lines 36-39 has placeholders and isn't a transcript, so it needs no capture comment.

## 4. TEC-OS defects

**D1. `REN` can give two files one name.** The new name is tested on the drive written with it, and the rename acts on the drive written with the old name (`src/cpm/ccp.asm:925-937`).

```sh
node tools/capture.mjs "SAVE 1 B:OLD.COM" "SAVE 1 B:X.COM" "REN X.COM=B:OLD.COM" "DIR B:"
```

```text
A>DIR B:
X.COM        X.COM       
2 files, 8168K free
```

`tecvol verify` reports the card's volume as `two directory entries for extent group 0`. Fix: copy the old name's drive byte into `RENFCB` before the test, or reject two different drive letters.

**D2. A card put back can't be used without a reset.** `SDINIT` runs only at `src/boot.asm:37`, so nothing restarts a card after it has been out, and the reset that would restart it discards the cache. Reproduction on the model: start a program that makes a file on the written-behind drive, writes a record and waits for a key. Set `m.sd = null`; press a key (`Write lost`); `m.swapCard(image)` with the same image; `^C` (`Write lost`, each time); `DIR` (no listing, then `Write lost`); `m.reset()` (mounts, record lost). Fix: on a failed card access, or at a warm boot with dirty lines, try `SDINIT` again before the flush.

**D3. A block number past the end in drive A's directory stops every boot.** Reproduction: on a one-volume card, set bytes 16-17 of a file's first directory entry to `FFh 7Fh`. Cold boot prints the banner and the volume, then `Bdos Err On A: Bad Sector`, and each key gives the same message. No prompt is reached. The card can be read only on a PC. This may be accepted behaviour for a damaged drive A; the appendix should say so (F11) either way.

**D4. `ERA *.*` answered with a bare Return waits for a second Return.** The answer's first character is read, then `ERADRAIN` reads until a Return, without testing the first (`src/cpm/ccp.asm:872-881`). Reproduction, with the serial console: `ERA B:*.*`, Return, Return. After the first Return the CCP is still reading and no prompt appears. Fix: skip the drain when the first character is CR.

Noted, not defects: `SDERR` is written and never read (`src/sd.asm:199`, `:203`), so codes 5 to 8 have no effect; the `CLOSE ERROR` path has no ordinary route (F17); the blocks of an unclosed extent stay used until a warm boot (F5, F6).

## 5. What was confirmed and what wasn't

**Confirmed by a run, with the exact text:**
- `TEC-OS needs 64K RAM` on the serial port only, both ways: with no RAM at `8000h–BFFFh` it comes before the banner, and with a 16 KiB U9 after the volume lines. In both cases it stopped in `RAMSTOP`.
- The diagnostic prompt, `H`, another key, `R` with no card and `R` with a card put in, which mounted and cleared `CARD?`.
- Codes `01` to `04`, by no card or chosen card responses. Codes `21` to `2A`, by altered images, covering each cause in the table: both sizes and the drives field for `23`, 0 and 128 for `24`, and id, flags, geometry, length and start for `26`.
- **Codes 05 to 08 never reach the prompt.** A rejected read and a read with no data token, on block 0 and on a table block past it, each gave `20`. The mount does no writes, `MNTERR` replaces the code in each case (`src/vol.asm:28`, `:110`, `:145`), and `SDERR` has no reader in `src/`, `drivers/`, `test/programs/`, `host/` or `tools/`.
- `PICO?` with no startup file and with no display line, cleared by `PICO.SVC`. With `STARTUP.CMD`'s two display lines and a bad `PICO.SVC`, the `GLCD.SVC` line installs on the pico board and no word appears, as "no display driver in" requires.
- `CON CRT` and `CON UC1` reporting the serial terminal on the serial board, and `CON CRT` on the glcd board and after `UNLOAD` on the pico board.
- Every row of the CCP table and `NAME?` table, with the word printed. `.COM` too large, `.PRL` short, zero-length, truncated and too large, `.COM` before `.PRL`, `.SVC` bad, format 2, missing, and a second load of the same service. `UNLOAD` with none, while the PICO9918 is the console, after `CON TTY`, and newest first.
- All chained-line behaviour claimed: `:` after a failure, and `MOUNT`'s messages keeping the chain.
- `Select` on an empty drive, past D, by `E:` and in an FCB, with `?` in the drive byte, and the prompt on A after the current drive was emptied.
- `R/O` for make, delete, write, rename and attribute change, and its clearing at warm boot. `File R/O` from `ERA`, `REN`, `SAVE` and `COPY`, and a wildcard `ERA` after erasing the file before it. Function 30 clearing the attribute.
- `Bad Sector` on a read-only volume, from a failed file read, from failed data and directory writes, and from a bad block number.
- `Write lost`: repeated while writes fail, none after they recover, after a directory write that failed, and after a failure a later attempt got through.
- All `MOUNT` and `VOLS` messages, including a slot too small and no slot; the two ABI lines came from copies of the programs patched to test for 5.
- All `[more]` keys: `Q`, `q`, `;` and Esc keep the chain, `^C` and `#` drop it, and another key continues.

**Unconfirmed:**
- Everything on a physical board, including F3 and D2. A card's faults are the model's, or injected responses and write failures. Codes `02` to `04` have been seen only by such responses.
- `CLOSE ERROR` from anything but an altered FCB (F17).
- The startup skip behind `PICO?`: the keypad isn't driven by the capture script. The code is `src/svc.asm:336-338`.
- `File R/O` from a random write, and `No such volume` from a failed table read: read in the code, not run.
- "In CP/M 2.2 a key other than `^C` after `Bad Sector` lets the program go on" (line 158): stated from common knowledge of CP/M, with no authority in the repository.
