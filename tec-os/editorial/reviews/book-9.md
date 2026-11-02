# Review of TEC-OS book chapters 5 and 22 (branch `tec-os-book`, 339e513), against TEC-OS bd15528

Basis: both chapters were read from `origin/tec-os-book` at 339e513, where they were last changed by eaa294e. That commit removed the passages on a `:` left at the head of a line by the web page's rewrite (old 05:318-321, old 22:303-306); line numbers below are those of 339e513, 526 lines in chapter 5 and 303 in chapter 22. TEC-OS bd15528 was exported with `git archive` to a new directory and built with its own `npm run build` and `npm run media`, with `EDIT_COM` and `TAS_COM` set to the pinned inputs. All four ROM images are identical, SHA-256 debba41f…, ROM 14,778 bytes, TPA 46,854 bytes; the starter card is SHA-256 d827a539…, 13 files. Nothing from the clone's `dist/` was used. Standards: `tec-os/editorial/STYLE.md`, and the vocabulary and code rules for the book's parts.

`origin/ks33-model` has moved past bd15528 to e7962a0. `host/card.mjs` and `src/hwsvc.asm` differ, so chapter 22's citations of those two files need rechecking at the landing. Nothing here was checked at e7962a0.

## 1. What was confirmed

**Transcripts.** All 9 `sh` blocks ran, and all 15 transcripts of chapter 5 match their capture commands byte for byte: 2 whole and 13 as the tail of the output, starting at the first command's prompt, or at the LCD or screen rows for `--lcd` and `--screen`.

**Citations.** All 102 `file:line` citations in chapter 22 (100 distinct) were read at bd15528. None points at the wrong line. `test/startup.test.mjs`, `test/pico.test.mjs` and `test/svc.test.mjs` pass, 158 tests. The sentences resting on the citations are correct except where section 2 says otherwise.

**Figures with no capture command, measured from a script on the host model:**

| Claim | Where | Measured | Result |
| --- | --- | --- | --- |
| `B806h`, 46,854 | 5:44 | Serial board, starter card: `B806h` | Confirmed |
| `B206h`, 45,318 | 5:45 | `--board glcd`, `--board pico`, and `PICO40.SVC` and `PICO32.SVC` alone: `B206h`. Each driver shows 6 pages | Confirmed |
| `AC06h`, 43,782 | 5:46 | Pico board after `CON UC1`, and with `GLCD.SVC` before `PICO.SVC`: `AC06h` | Confirmed |
| 5,864,626 T-states at `STBOOT` | 22:66-67 | Pico board, starter card, from power-on: 5,864,626. Serial and glcd boards: 5,864,480. After `reset()` of a booted machine: 5,871,060 | Confirmed as printed; the figure is a power-on's |
| Keypad skip | 5:324-331, 22:62-65 | Key set before power-on, pico board: no file run, `STPOS` `FFh`, no services, `0006h` `B806h`, `PICO?` on the LCD. Key codes 00h, 01h, 0Fh, 12h, 13h all skip. Released at 4,000,000 T-states, or pressed at 6,000,000: the file runs | Confirmed on the model, with the limits in section 6 |
| Skip after a recognised reset | 5:334 | `MOUNT A: SPARE`, reset, key set: banner shows `A: SPARE`, nothing run | Confirmed |
| `^C` during a startup line | 5:178-180 | Own program calling function 10. `PROG`, `USER 7`: `^C` then `A>USER 7`. `PROG!USER 5`, `USER 7`: `^C`, `USER 5` dropped, `A>USER 7` | Confirmed |

**Start-up paths (5:184-200, 22:34-45).** The three paths are stated correctly in substance: warm boot never reaches `COLD`, and both resets enter it. They differ only by `RSLBUF`, and each clears `STPOS`. `RESEL` takes back the selection only if every retained drive matches, which "if the card still has those volumes" states. A reset from `SPARE` on a retained selection ran `SPARE`'s own file. F8 corrects the framing sentence.

**Measured and correct, with no finding:** the board table at 5:259-263; `PICO?` for no file, an empty file, a file with no display line and a skip, and none after a bad `PICO.SVC` with a good `GLCD.SVC`, or `PICO.SVC` then `CON TTY`; `PICO?` replacing `GLCD?` from a failed `CON UC1` in the file; both boards without a matrix keyboard failing both drivers with no word; `DEMO`'s row surviving `PICO.SVC`; a port write losing five columns to the take (`ZZZZZZZZ` became `     ZZZ`); `GLCD.SVC` under `PICO.SVC` clearing `GLCD?`; `B:PICO.SVC`; `.SVC` files that are empty, junk, absent or of format 2; `PICO40.SVC` failing while `PICO.SVC` is in; `UNLOAD` order; the width change, 40 columns after it; 127-character and 128-character lines; a line at the 128th byte; a `$` in a line; LF-only files; the table at 22:138-145, traced as 1, 10, 11, 20, 21, `80h`; `CMDFCB` zero at `STBOOT`; addresses `BF64h`, `BF65h–BFE4h`, `BDB4h`, `BDB5h`; a chained `:VOLS` after the web rewrite; the web rewrite's handling of `.DRV` cards, run through `host/card.mjs`.

The KS33 facts routed to the book that fall in these chapters, the echo's `$` and the 127-character line's `$` on `BOOTDRV`, are stated at 5:134-136 and 22:147-161. The vocabulary rules are kept: no "module", and "resident" appears only in the defined term at 5:39.

## 2. Factual errors

**F1. The cost of the reversed order.** 05:267-268 says that with `GLCD.SVC` first "programs have 3,072 bytes less". The sentence compares the two orders on a board with both displays. The starter order leaves `B206h`, 45,318 bytes, and the reversed order `AC06h`, 43,782: 1,536 bytes less. Correction: "With `GLCD.SVC` first, both drivers install, the PICO9918 takes the console and programs have 1,536 bytes less:"

**F2. `STPOS` has a value the table leaves out.** 22:27-32 gives four kinds of value and 22:183 two rotated results. A CR or LF in the record's last byte leaves `HL` one past the record, so `STL2` stores `81h` (`src/svc.asm:399-401`). Measured with a 127-character line and its CR: `STPOS` `81h` at `MLGOT`, then `STDONE`. `RLCA` gives `03h`, and the code works. Correction at 22:31: "| `80h`, `81h` | Finished, and `STDONE` hasn't run; `81h` after a CR or LF in the record's last byte |". At 22:183: "`01h` for `80h`, `03h` for `81h`, and `FFh` for `FFh`".

**F3. `GLCD.SVC` has two more tests, not one.** 22:233 says "has one more test". After the console test, `INIT1` calls `GLCWAIT`, and a controller that doesn't answer fails the load (`drivers/glcd.asm:43-45`). That test is the graphics LCD's counterpart of `PICO.SVC`'s `INFO` call, and it is what fails on a board with no graphics LCD. Correction, after 22:239: "`GLCD.SVC` then calls `GLCWAIT`, and a controller that doesn't answer fails the load (`drivers/glcd.asm:43-45`), as `INFO`'s answer does for `PICO.SVC`." At 22:233: "`GLCD.SVC` has two more tests, the first ahead of those".

**F4. A byte, not a word.** 22:235 says it "reads the word that `ABIVID` points at, the console's columns". `drivers/glcd.asm:38-39` loads one byte, and the column count is one byte (`src/abi.asm:10`). Correction: "it reads the byte that `ABIVID` points at, the console's columns".

**F5. Port `03h` is read many times.** 22:65, "The port is read this one time." `IN A,(STSPORT)` is also at `src/console.asm:41`, `:131`, `:184`, `:198` and `:284`. Correction: "Bit 6 is tested this one time."

**F6. The routines aren't at the end of the file.** 22:14, "at the end of `src/svc.asm`". They occupy lines 327-431 of 498, and `SVCREG` follows them. Correction: "in `src/svc.asm`".

**F7. The way back to the other volume fails on the chapter's own card.** 5:240-242 says the board stays as it is "until you mount the other volume back or the board loses power". `MOUNT` is a program, and `SPARE` holds only `STARTUP.CMD`. Run on `spare.img`, after the reset the transcript shows, `MOUNT A: SYSTEM` prints `MOUNT?` in user area 2 and again in user area 0, and `B:MOUNT` prints `B:MOUNT?`. Correction: "…stays without one until you mount the other volume back, which needs `MOUNT.COM` on a drive that is mounted, or the board loses power. On this card only a loss of power brings `SYSTEM` back to drive A."

**F8. The sentence that introduces the three paths.** 5:184-185, "TEC-OS comes back from a program, or from a press of the reset button, by one of three paths", leaves out power-on, which is the third path's own example at 5:193. A program can also take a reset's path: chapter 14 lists the BIOS table's first entry as a cold boot, and a program that jumps to `BF00h` after `MOUNT A: SPARE` came back with `A: SPARE` and ran `SPARE`'s file. Chapter 5 needs this, since 5:323 speaks of a line "that resets the board" and gives no means. Correction at 5:184-185: "TEC-OS restarts by one of three paths:". At 5:190: "A *recognised reset* is a press of the reset button, or a program's call of the BIOS's cold boot entry, that finds a running TEC-OS's marks in RAM."

**F9. "Nothing can be" installed.** 5:410 says that on the serial board "nothing is installed and nothing can be". A service that isn't a display driver installs there: a one-page fixture built from `test/programs/svcdemo.asm` loaded, listed as `LIBX 1` and unloaded on that board. Correction: "nothing is installed and neither display driver can be".

**F10. A claim can't be in force at `UNLOAD`.** 5:443-444 says `PICO.SVC` can't be removed "while a program has claimed the PICO9918". `REMOVE` does test the claim (`drivers/pico.asm:64-69`), but `UNLOAD` is a CCP command with one caller of `SVCUNL` (`src/cpm/ccp.asm:1082`), the CCP runs only after a warm boot or a cold boot, and warm boot releases the claim (`src/boot.asm:74`; chapter 9 says the same). `test/pico.test.mjs:496-510` reaches the state by calling the service at the prompt. Only a service's own code could hold a claim there. Correction: delete ", or while a program has claimed the PICO9918". The term is also unexplained in chapter 5.

**F11. A third way to replace the old lines.** 5:523-525 says the old `STARTUP.CMD` stays "until a new file replaces it, with `tecvol put` on a PC or 'Copy file to drive' on the web page". With the files renamed, a power-on of the page rewrites the file with no copy: `prepareCard` returned `changed: true`, and the file became `PICO.SVC`, `GLCD.SVC`, because `DISPLAY_PIECE` matches both types (`host/card.mjs:10-12`). The Reset button doesn't run `prepareCard`. Correction: "…until a new file replaces it, with `tecvol put` on a PC or 'Copy file to drive' on the web page. There, 'Power cycle' does it too, since the page's rewrite drops a display line of either type."

**F12. Recovery doesn't need the serial terminal.** 5:333, "Recovery needs the serial terminal". The card can be corrected on a PC, as chapter 4 and 5:64 describe. Correction: "On the board, recovery needs the serial terminal: `ERA STARTUP.CMD` or a corrected file, and then a reset. Otherwise take the card to a PC and use `tecvol`."

**F13. A failed `CON UC1` also moves the console.** 5:347 and 5:378-379 show the case only on the serial board, where the console is already there. On a board with the PICO9918, with `PICO.SVC` in and no `GLCD.SVC` on drive A, `CON UC1` leaves the console on the serial terminal and the matrix keyboard unread, which chapter 2:105 implies and which is the reason for the word. `CON CRT` from the terminal brings it back, and `GLCD?` stays on the LCD after that. Correction, added to 5:347: "- `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`. The console is then on the serial terminal, even from the PICO9918, and `CON CRT` typed there moves it back."

## 3. A physical board

Chapter 22 and the rest of chapter 5 stay within what the book says. Bit 6 and the single test are in Appendix G, the dark screen in chapter 1, the loss of RAM at power-off in chapter 14. Times are marked as the model's.

**B1. The skip contradicts the book's warning about the keypad.** 5:324 tells the reader to hold a key on the hex keypad. Chapter 1 says to keep off the keypad, and Appendix G says a press with the NMI jumper fitted "is a crash", and that TEC-OS is listed as running with that jumper off. Chapter 5 mentions neither. The model's tests use a key with the NMI suppressed. With the NMI raised, a key set at power-on produced no output in 20 million T-states (`pc` at `C8F0h`), and a key raised at 1,000,000 T-states booted and skipped. Neither run is evidence for a board. Correction after 5:324's sentence: "The skip is for a board with the keypad NMI jumper off, as chapter 1 describes; with it fitted, a key press is a crash."

**B2. "Every board".** 5:256, "so one card can start every board". Only the model's boards were run. Correction: "so one card starts each of the boards below."

## 4. Clarity for a reader new to the project

**R1. "A missing file".** 5:345 lists "a missing file, a bad file, no `STARTUP.CMD`", and a reader takes the first and third for one case. The source's comment is the origin (`src/svc.asm:418`). The first two mean a display driver's file, and they lead to `PICO?` only if no other driver installs: with the starter card's lines and `PICO.SVC` erased, `GLCD.SVC` installs and no word appears. 22:209-210 repeats the list. Correction at 5:345-346: "It covers a driver's file that is missing or bad with no other display driver installed, no `STARTUP.CMD`, a file with no display line and a skip." At 22:209-210: "No `STARTUP.CMD`, an empty one, a driver's file missing or bad with no other driver in, and a skip all arrive with nothing in `PIVEC` and `CDGLC` clear."

**R2. Installing without the display.** 5:246-247, "installs it and, if the board has the display, moves the console there", says the driver installs on a board without the display. 5:254-255 says it fails. Correction: "On a board with the display, a line that names a display driver installs it and moves the console there:"

**R3. "Record" with two meanings.** 5:31 defines a service's *records*, and 5:103 uses "record" for CP/M's 128 bytes with no warning. Both senses are then in use in the chapter. Correction at 5:103: "It reads one record, CP/M's unit of a file, of 128 bytes, which has nothing to do with a service's records,".

**R4. A format the reader can't find.** 5:491 says to rename "if its format is 3" and 5:525 mentions an older format, and the chapter doesn't say what the format is or how to read it. Correction: "if its format, the file's second byte, is 3".

**R5. "Take" as a noun, and "row 3".** 5:395-400 uses "a later take", "a take" and "row 3" in a chapter whose other text says "last row". Correction for 5:395-400, as far as "the row": "The blanks go only over the word itself. A program that writes the LCD's last row through the LCD's hardware service replaces the word, and when a driver later takes the console that row is left alone. `DEMO` is such a program, and its last screen stays through a later `PICO.SVC`. TEC-OS has no record of a program's write to the LCD's port, so the next driver to take the console writes five blanks over the start of the row."

**R6. "Divide on this byte".** 22:34, "The three paths of Chapter 5 divide on this byte." The byte separates an ordinary exit from a reset. The two resets treat it alike, as the same paragraph says. Correction: "This byte separates an ordinary exit from a reset."

**R7. Two rules in a tangled sentence.** 22:231-233, "Those are the two rules that a driver needs the matrix keyboard, and that a second `PICO40.SVC` fails while `PICO.SVC` is in." Correction: "So a driver needs the matrix keyboard, and `PICO40.SVC` fails while `PICO.SVC` is in."

## 5. Style

**Y1. Lines and prompts as actors.** The same pattern `book-1.md` reported in chapter 1.
- 5:94, "Each prompt takes the next line". Correction: "At each prompt the CCP takes the next line".
- 5:96, "A line that fails prints its usual message". Correction: "The CCP prints a failed line's usual message".
- 5:255, "the line prints its name with a question mark". Correction: "the CCP prints the line's name with a question mark".
- 5:376-377, "`PICO?` stays away too". Correction: "TEC-OS doesn't write `PICO?` either".
- 5:432-433, "gives its name with a question mark". Correction: "is printed back with a question mark".

**Y2. The chapter speaking of itself.** 5:327-329, "`tools/capture.mjs` has no option for holding a key, so this chapter has no transcript of a skip", concerns how the chapter was made. Correction: "`test/startup.test.mjs` runs the case: a service that hangs while installing reaches a prompt with a key held."

**Y3. Line wrapping.** 5:105 ends after "Sixty", and 22:124 runs to 92 columns. Rewrap both paragraphs. The other long lines are tables, `sh` lines and capture comments.

Searches of both chapters found no fused-relative heading, staged question, attention direction, praise word, mind verb other than the idioms STYLE.md keeps, or account of development. *Just* appears twice, as position (5:22 and 5:326), which is not the praise word. Both endings land on substance, and both openings state the subject and route. Part I carries no line numbers. "Older cards" at 5:484 is history that explains the product.

Three things are not findings against these chapters and depend on other work: chapter 1 still prints `PICO.DRV` where 5:12 and 5:52 refer to it, Appendix G still cites `src/drv.asm`, and `index.md` still titles chapter 5 "Startup and drivers".

## 6. Not confirmed

- **All physical behaviour.** Nothing was run on a board: bit 6 of port `03h`, any key doing the same, the skip, the NMI and the Matrix switch. The model's key handling and Appendix G agree, and that is the whole evidence.
- **A key held through the reset button.** `resetState` clears the model's key latch, so a key set before `reset()` is lost. The case after a reset was measured with the key set just after `reset()`, and the power-on case with the key set before the first instruction.
- **Claims at 5:335-336 and the web page generally.** The controls, the labels and `prepareCard` were read in `web/index.html` and `web/src/main.mjs`, and `host/card.mjs` was run under Node.js. The page was not opened in a browser, so its message at 5:487 and the behaviour of "Copy file to drive" and "New starter card" were not exercised.
- **"CP/M's unit of a file"** is common knowledge, not checked against a reference.

## 7. TEC-OS defects

**D1. A failed `CON UC1` leaves the IOBYTE and `CONACT` out of step with the console.** After the failure the `CON:` field and `CONACT` are 3 and `CONMOD` is 0. If `GLCD.SVC` then loads, `INIT` passes on the stale field even under `PICO.SVC`, and `CON UC1` does nothing, because `CONSEL` sees no change (`src/console.asm:47-51`) and `GLCLD` returns at once (`src/glcd.asm:53-55`). `CON` keeps reporting the serial terminal with the driver in.

Reproduction, on `--board pico`:

```sh
cp dist/starter.img d1.img
node tools/tecvol.mjs get d1.img A GLCD.SVC glcd.bin
node tools/tecvol.mjs put d1.img A glcd.bin G.BIN
node tools/tecvol.mjs era d1.img A GLCD.SVC
printf 'PICO.SVC\n' > startup.cmd
node tools/tecvol.mjs put d1.img A startup.cmd --text
node tools/capture.mjs --card d1.img --board pico "CON UC1" "REN GLCD.SVC=G.BIN" GLCD.SVC CON "CON UC1"
```

Expected: the last `CON UC1` prints `CON: UC1: GLCD`. Measured: it prints `CON: TTY: serial terminal`, with IOBYTE `03h`, `CONACT` `03h`, `CONMOD` 0 and `0006h` `AC06h`. `CON CRT` then `CON UC1` recovers. Severity is low, and the case needs a missing file first.

A related state, not a defect in itself: `UNLOAD` of `GLCD.SVC` with no PICO9918 driver leaves the `CON:` field at 3 with the console on the serial terminal (`--board glcd`, `UNLOAD`: IOBYTE `03h`, `CONMOD` 0). `CON` reports it correctly and a later load works, so this is only a value a program would misread.

No other defect was found. `src/svc.asm:329`'s "80h up" already allows for F2's `81h`.

## 8. Counts

| Kind | Count |
| --- | --- |
| Factual errors (F) | 13 |
| Physical board (B) | 2 |
| Clarity (R) | 7 |
| Style (Y) | 3 |
| Findings in all | 25 |
| In chapter 5 only | 16 |
| In chapter 22 only | 7 |
| In both | 2 |
| TEC-OS defects | 1 |
| Transcripts rerun and matching | 15 of 15 |
| Citations correct | 102 of 102 |
| Figures with no capture command confirmed | 7 of 7, on the model |
| Items not confirmed | 4 |
