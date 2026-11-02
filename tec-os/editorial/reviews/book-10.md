# Review of TEC-OS book chapter 9 and Appendix B, branch `tec-os-book` at 339e513, against TEC-OS bd15528

Scope: tec-os/09-hardware-services.md (hardware services) and tec-os/appendix-b-rom-services.md (ROM services). Line numbers are those of the two files at 339e513. Standards: tec-os/editorial/STYLE.md, the vocabulary and code rules of the brief for the book's remaining parts, and the assembly style at origo/bindings/z80-cpm/assembly-style.md.

Method: a clean archive of bd15528 with `node_modules` linked; `npm run build` and `npm run media` with `TAS_COM` set to Thorium's build (four ROM profiles, all sha256 debba41f1c4bbdbf…; 12 starter files; `TAS.COM` sha256 ff187348…, equal to the chapter's line; `dist/abi.inc` identical to `src/abi.inc`). `hw.img` was built by the chapter's own `sh` block from the listings as printed, tabs included. The clone's `dist/` wasn't used. Figures outside transcripts were measured on the host model by calling the entries directly, with a write watch on the caller's stack, a trace of port writes with their cycle counts, and sentinel values in `IX`, `IY` and the alternate registers. `test/hwsvc.test.mjs` passes 5 of 5.

Every transcript matches the capture byte for byte: `LCDMSG` with the LCD (the capture's empty fourth row is left off the block), `BOARD` on the serial and pico boards, `NOW`, `ROWS` with `x` and with `5`, `DEMO` with its screen, `PLACE` on the pico board's screen and on the serial board. `BOARD` on `--board glcd` gives `0D`, `15` and `08` (09:371-372). `PLACE` on `--board glcd` gives status 00 (09:772-773).

All seven listings assemble under the starter card's `TAS` and run. `HWLIB` is exercised by all six programs. `DIGCLK` shows 12 00 and the seconds in the right order at the right segment patterns, on all three boards, and ends on a key. `ROWS` on the serial board prints `no matrix keyboard`. With the model's clock removed, `NOW` prints `no clock`, `BOARD` gives devices `00` and `DEMO` prints `clock: no`.

Figures confirmed exactly: all six rows of the `TONE` table and 16 × `B` + 51; the last half cycle 5 less; 229 T-states of overhead; 199 for `DE` = 0; `INFO` 1,552; `DIGIT` 20,677; `LCD` 4,922 and 4,942; claim 1,033; release 213,242; `JOY` 221; `KEYS` 588; `RTC` 6,925 and 7,759; bad numbers 65 with no stack; every stack figure in Appendix B's table at 73-83, with `PUTAT` at 22 only when a cursor is removed (F1); 28 bytes of stack at program entry (`SP` = BE75h, `CSTKBAS` = BE59h) on all three boards; `IX`, `IY` and the alternates kept by every hardware service on every path tried; `PUTAT` 423, `CONOUT` 714 and BDOS function 2 3,860 on the PICO9918; `CONOUT` 35,400 and function 2 38,400 on the graphics LCD. Every `src/` and `drivers/` citation in Appendix B lands on the line it claims, except for the one in F12. The ROM's bytes C000h to C01Dh match the table, including `0048h`, `0041h` and the `RET`.

Behaviour confirmed by run: a ROM patched to major 3 and to major 5 prints `not TEC-OS with ABI 4` and leaves the LCD alone; `PICO?` is blanked by a display driver's load, and after `LCD` on row 3 the same load leaves the program's text in place; output while claimed reaches neither the VDP nor the serial port; a warm boot releases the claim and restores text mode; with `PICO.SVC` out a release writes no port; a claim on `CON UC1` leaves `PUTAT` working, and the release restores the VDP (2,068 writes) without clearing or homing; `CON TTY` gives columns and rows 0; `PUTAT` draws 80h to FFh reversed on both displays and `CONOUT` drops them; `PICOREG`, `PICOFIL`, `PICOWR` and `PICORD` work through the record's table; find, enumerate, `ABIGLCD`'s three outcomes and `ABIVOL`'s failure cases behave as written, except for F9 and F10.

## 1. Factual errors and claims needing correction

**F1. `PUTAT`'s stack on `PICO.SVC` is 16, and the two figures mix conditions.** Appendix B:171-172 says "22 bytes on the graphics LCD and 12 on `PICO.SVC`". The 22 is with a cursor to remove and the 12 is without one. Measured at the prompt, with the cursor showing: 22 on the graphics LCD, and 16 on `PICO.SVC` at 80, 40 and 32 columns. With the cursor already off: 18 and 12. `test/hwsvc.test.mjs` records the 16 too. Correction: "The stack is 22 bytes on the graphics LCD and 16 on `PICO.SVC` with a cursor to remove, and 18 and 12 with none."

**F2. `ABIVOL`'s deepest stack is 22, not 20.** Appendix B:202-203 says "The most stack measured was 20 bytes, for a describe." That holds only on a clean cache. With a changed line on a written-behind drive, an unmount takes 22 bytes (227,060 T-states) and a mount takes 22 (448,182). Clean, they take 16 and 18, and a describe 20. Reproduction: a container with `WORK` on B written behind and an unmounted G1M volume at index 2; BDOS 22 and three of 21 on `B:DIRTY.BIN` with no warm boot; then `ABIVOL` with `A` = 0, `C` = 1, `E` = 2. The SD write count rises by one. Correction: "The most stack measured was 22 bytes, for a mount or an unmount with a changed cache line to write."

**F3. `PUTAT` on the graphics LCD is not 35,400.** 09:798 and Appendix B:172-173 give about 35,400. The `CONOUT` and function 2 figures in that column are right, at 35,402 and 38,407 for 15 `A`s from row 3, column 1 or 2. `PUTAT`'s figure at that same place is 35,136, and its marginal cost is less. The table's equal figures for `PUTAT` and `CONOUT` overstate `PUTAT`: it saves 266 T-states a cell there. All three figures also move with the starting column: `PUTAT` gave 35,171 from column 0, 33,116 from column 3 and 31,839 from column 6, so "in the middle of a row" (09:792-794) doesn't define the run. Correction at 09:798: `423 | 35,100`. At 09:792-794: "… in a run of 60 cells on the PICO9918 at 80 columns and of 15 from column 2 on the graphics LCD, where the figure falls by up to a tenth at other columns. A `CALL` adds 17 to the BIOS and BDOS rows, and to each string in the first." At Appendix B:173: "about 35,100 on `GLCD.SVC`".

**F4. A digit is lit for 3,348 T-states, not 3,323.** Appendix B:106-107 calls 3,323 the time a digit "stays lit", and 09:382 rounds it to about 0.83 ms. 3,323 is the `DJNZ` alone. Between the write that selects a digit and the write that turns it off, the trace shows 3,348, every time, which is 0.84 ms. Correction at 09:382: "about 0.84 ms". At Appendix B:106-108: "A digit stays lit for 3,348 T-states, 0.84 ms, of which a `DJNZ` count of 256 is 3,323, and it is then turned off."

**F5. The joystick statement claims more about the model than is true, and less doubt about the names than the repository records.** 09:648-650: "The diagnostics ROM's joystick test names the bits: … The model has no joystick of its own to confirm those names."
- The model has a joystick input. `tec1g.setJoystickState(mask)` takes it, `test/diag.test.mjs:396` and `test/hwsvc.test.mjs:127` use it, and each of the eight bits comes back from `JOY` in its own position (run for 01h to 80h). What the model lacks is names: the input is a bare byte. `capture.mjs` has no line for it and the web page no control, so neither reaches it.
- What was checked is therefore the path from a bit to `B`, and the wording should say that. What wasn't checked is which physical line each bit is. docs/diagnostics.md:460 and 494 record the names as assumption A6, taken from MON-3, and say that the board's J9 document wires two buttons and nothing to pins 5 and 9, which differs from the labels `pin 9` and `fire 3`.
- "The joystick reads port `FEh`" at 09:631 is stated of the device. The code supports it of the service.

Correction at 09:631: "`JOY` reads port `FEh` with address line 11 low, and that is also how `KEYS` selects row 3, so the two share a row." At 09:648-650: "The diagnostics ROM's joystick test labels the bits, after MON-3: `01h` up, `02h` down, `04h` left, `08h` right, `10h` fire 2, `20h` pin 9, `40h` fire 1 and `80h` fire 3. The model's joystick is one byte with no names, so a run confirms that each bit reaches `B` and leaves the labels unconfirmed." Appendix B:149-151 needs the same change: "The diagnostics ROM's test labels the bits, after MON-3, … (`diag/interact.asm:556`), and those labels are unconfirmed."

**F6. The sharing of row 3 runs both ways, and the text gives one.** 09:647 and Appendix B:148-149 say that a key in row 3 reads as a joystick bit. On the model the reverse holds as well: `setJoystickState(n)` shows `n` in `KEYS`'s row 3 byte, and `setJoystickState(1)` at the prompt on the pico board types `5` at the console. A program on a video console that reads keys through the BDOS gets joystick lines as characters, and `ROWS`'s wait ends on one. Correction at 09:647: "On a board with a matrix keyboard, then, a key in row 3 reads as a joystick bit, and a joystick line reads as a key in row 3, on the console too: on the model, bit 0 types `5`." Appendix B:148-149: "That port address also selects row 3 of the matrix keyboard, so a key in that row sets a bit here, and a line here reads as a key in that row."

**F7. Wrong chapter for `GLCD?`.** 09:230-232 says TEC-OS puts `PICO?` and `GLCD?` on row 3 "as Chapter 1 describes". Chapter 1 mentions `PICO?` once (01-introduction.md:321-323) and never `GLCD?`. Chapter 5 has both, and the clearing (05-startup-and-services.md:347, 378, 393). Correction: "as Chapter 5 describes".

**F8. `DIGCLK`'s loop figures are the serial board's, and the text doesn't say so.** 09:456-458 says "On the model the loop goes round every 24,456 T-states". Measured: serial 24,456 and 32,093; pico 23,828 and 31,465; glcd 23,703 and 31,340. The time outside `DIGIT` is 15.5, 13.2 and 12.8 percent. Function 6 costs less with a video console. The block has no capture line. Correction: "On the model's serial board the loop goes round every 24,456 T-states, 164 times a second, and every 32nd round takes 32,093 for the clock; a video console saves 630 to 750 a round." And "about 15 percent of the loop here" stays, since "here" then means that board.

**F9. `ABIVOL`'s failure list isn't exact.** Appendix B:192-195.
- "a volume already on another drive": a volume already on the same drive fails too (`vol.asm:617-618` takes any drive; run: 0FFh).
- "a slot too small for the volume": a drive with no slot at all is the common case. On a format 1.0 card, which the starter card is, only the mounted drives have a slot (`vol.asm:498-500`), so `C` and `D` always fail there (run: `DRVSLOT` 1, 2, 0, 0; a G1M volume onto C returns 0FFh). A reader will take "a drive past D" to mean that C and D are open.
- A failed write of the cache also returns 0FFh (`vol.asm:621-622`, `658-659`); this path was read, not run.
- The table at 187 doesn't say that a mount replaces what's on the drive. Run: `BIG` onto a drive holding `EXTRA` returns 0 and replaces it.

Correction at 187: "Mounts that volume on the drive, in place of any volume there". At 192-195: "… for an index past the table, a drive past D, a volume already on a drive, a drive with no slot or a slot too small for the volume, an attempt to leave drive A empty, a failed write of the cache, or any other value of `A`. A format 1.0 card gives a slot only to the drives mounted at cold boot."

**F10. `ABIGLCD`'s dropped table changes `HL` too.** Appendix B:221: "`A` and `DE` are changed, `BC` is kept". Run with `A` = 3, `HL` = 0: `HL` returns 0045h; with `A` = 1 it would hold `PIVEC`+1 (`glcd.asm:34-41`). Correction: "`A`, `DE` and `HL` are changed, `BC` is kept".

**F11. The release's cost has a condition the sentence drops.** Appendix B:126-127, "A release costs 213,242 T-states at 80 columns". That is with the PICO9918 as the console. Measured: 183,482 at 40 columns, 178,704 at 32, 145,685 at 80 with the console on the graphics LCD, and 316 with no `PICO.SVC`. Correction: "A release with the PICO9918 as the console costs 213,242 T-states at 80 columns, and 145,685 with the console elsewhere." 09:667 is right where it stands, after "if the PICO9918 is the console".

**F12. A citation carries half its claim.** Appendix B:25-26 cites `src/abi.asm:3-5` for "may move what follows `ABIMAIN` and renumber the services". Those lines say only the first. The second is at `test/programs/demo.asm:29-30`. Correction: add that citation, or end the clause at "`ABIMAIN`" and put the renumbering in as the reason for the exact test.

**F13. The prose and the listings disagree about a failed test.** 09:63-64: "A program that finds something else is on another system, and it carries on without the board's devices." Every listing ends instead, through `NOTHW`, and `NOTHW`'s header says so. Correction: "A program that finds something else is on another system, and it leaves the board's devices alone: these programs print a line and end."

**F14. `TAS` writes two files.** 09:202-203 says it "writes `LCDMSG.COM` beside it". `DIR` after the run shows `LCDMSG.DBG` as well. Correction: "writes `LCDMSG.COM` and `LCDMSG.DBG` beside it".

**F15. "When the Z80 stops, the digits go dark" isn't what the mechanism does.** 09:378-379. The digits go dark because `DIGIT` ends with all six off, which 09:381-383 then states. A selected digit stays lit until a write to port `01h` changes it. Correction: "The display looks steady only while the Z80 goes round the six fast enough for the eye to merge them, with each digit lit for its turn alone."

**Claims that couldn't be confirmed from the code or a run:**
- Anything physical: the joystick's wiring and labels (F5), the Matrix switch, port behaviour on a board, what the digits look like, a real DS1302's weekday. The weekday numbering at 09:537 is the model's, and it says so.
- 09:155-156, calling a service from a hook inside a BDOS call. The source shows no path to the BDOS, but no such hook was run, and the room on the BDOS's stack against 22 bytes wasn't measured.
- `ABIVOL`'s failed cache write (F9) and `ABISVC`'s 256-record stop and the generation's wrap (Appendix B:237-238, 243) were read, not run.
- Appendix B:243-244, "no service can leave while it runs", rests on docs/services.md:215-216 and on `UNLOAD` being reached only from the CCP. No exhaustive search of the paths was made.
- Appendix B:46-48: the `RET` at C01Dh and the build's check are confirmed. No old `MOUNT.COM` or `VOLS.COM` was run.
- Thorium `7604daa` at 09:11: the SHA-256 matches `dist/files/TAS.COM`, and docs/compatibility.md:171 names the commit. `TAS.COM` wasn't rebuilt from that commit.
- The web page's board as `--board pico` (09:352): read from `web/src/main.mjs:75`, not run in a browser.
- The frequencies at 09:246-251 are arithmetic from measured T-states at the 4 MHz the book assumes, which is correct arithmetic and not a measurement of a clock.

## 2. Structure

**S1. Chapter 10 doesn't exist yet.** 09:49 sends the reader to Chapter 10 for `ABISVC`. There is no `10-*.md` on the branch. index.md:132-136 plans one, under old names. Appendix B has the entry now. Correction: "`MOUNT` and `VOLS` use `ABIVOL`, and Appendix B lists every entry, `ABISVC` among them." Add Chapter 10 when it's written.

**S2. Appendix B:245-246 points at `docs/services.md`,** which is a repository document, for the rule on keeping a record. It's the only such pointer in the appendix's reference text. Keep it until Chapter 10 exists, then point there.

**S3. A reference that Appendix G meets only in part.** 09:816-817 says "a pass of the eight rows in each round of the loop, as Appendix G describes". Appendix G:138-148 describes the ports and not the pass. Correction: "`DEMO` writes their ports itself, as Appendix G describes, a pass of the eight rows in each round of the loop."

**S4. No routed row applies.** No row of the KS33 table "The book's findings" that says the book states it falls in these two parts.

## 3. Assembly style

Checked with Thorium's `tools/source-check.mjs` and by reading.

**L1. `BOARD` is under the density floor.** 37 percent, against a floor of 40 (09:282-331).

**L2. Runs of more than four uncommented lines.** `BOARD`, the eight lines from `MSGB` to `%INCLUDE` (09:323-330). `ROWS`, from `NOMTX` to `%INCLUDE` (09:608-613).

**L3. An operand of 39 characters.** `SEGTAB` at 09:449, against a limit of 15.

Corrections, assembled and rerun with the output unchanged, and clean on all three faults: in `BOARD`, a line above `MSGB`, "; What each line starts with, and how the last ends.", a line above `MSGBAD`, "; The last line: the status, then its carry.", and comments on the five `LD DE,` lines that select a message. In `ROWS`:

```asm
BUF:	DS	8		; the rows, as KEYS leaves them
STICK:	DS	1		; JOY's byte
```

In `DIGCLK`:

```asm
SEGTAB:	DB	$EB,$28,$CD,$AD	; 0 to 3
	DB	$2E,$A7,$E7,$29	; 4 to 7
	DB	$EF,$AF		; 8 and 9
```

The checker's other eight faults are interior branch labels (`CHKH1`, `NIBB1`, `LOOP`, `NEXT`, `WAIT`, `SHOW`, `DRAIN`, `SCAN1`), which the style's rule on routine headers doesn't reach. Everything else passes: tabs, columns, comment widths, file sizes, and a header on every routine. The comments were read for filler and none was found. `PLAN`'s, `PAIR`'s and `SEG`'s headers state their registers correctly.

## 4. Writing, in the guide's order

**Mechanical search of both files:** no praise words, no *honest*, no attention directions, no staged questions, no dashes, no bold in running prose, no account of development beyond the permitted reasons for the `RET` and the numbering. No *module*, *resident module* or `.DRV`. `ABIDRV` appears only as the stated alias. *Driver* is used only of hardware. *Hardware service*, *ROM table*, *service* and *record* follow the KS33 definitions. All headings are noun phrases. Lines over 80 characters are capture comments or table rows.

**Substance (deletion test):**
- 09:815-816: "Its rainbow on the 8 × 8 LEDs takes no service. No hardware service drives those LEDs:" says one thing twice. Correction: "No hardware service drives the 8 × 8 LEDs: `DEMO` makes its rainbow by writing their ports itself, …".
- 09:819-820 repeats "itself" from 816. Correction: end the paragraph at "no state there to protect", or keep only "`DEMO` also carries its segment patterns and its random numbers."
- 09:126-127, the second sentence repeats the listing's comment at 98. Correction: delete it and let 09:466 explain BCD, where it is used.
- Appendix B:227, "`abi.inc` also calls it `ABIDRV`", repeats 42-43. Correction: delete it.

**Agency:** none found. *Finds* at 09:31, 63 and 789 is a search a program really makes, and it stays under the operation-idiom test.

**Conventions:**
- 09:190, "`abi.inc` and `HWLIB.ASM` go on the card". On the card the file is `ABI.INC`, as the listings' `%INCLUDE` has it. Correction: "`ABI.INC` and `HWLIB.ASM`".
- 09:203 ends "on drive A:", where the colon reads as part of the drive's name. Correction: "… beside it, and `A:` goes in front of the command because `TAS.COM` isn't on drive B. The run:".

**Opening:** states the subject and the route. **Ending:** substantive, with no recap (see the deletion notes above).

**STYLE.md at bd15528:** lines 28, 33-35 and 47 name `book/capture.mjs`. bd15528 has no `book/` directory, and the script is `tools/capture.mjs`, which is what these two parts use.

## 5. TEC-OS defects

All are in comments, documents or test messages. No behavioural defect was found in the code these parts describe.

**D1. A half cycle's constant is wrong in three places.** `src/hwsvc.asm:177-178` says "plus 59 a half cycle", docs/rom-services.md:152 says "16 × B + 59", and `test/hwsvc.test.mjs:120` says "about 1,659" for `B` = 100. The instructions at `src/hwsvc.asm:183-193` sum to 51 and the trace gives 1,651. Reproduction: call `TONE` with `B` = 100, `DE` = 6 and take the cycle difference between `OUT`s to port 01h: 1651, five times, then 1646.

**D2. `VIDEO`'s stack.** docs/rom-services.md:151 gives 8. A claim with the cursor showing takes 10. Reproduction: at the pico board's prompt, `VIDEO` with `B` = 1, watching the caller's stack.

**D3. `PUTAT` and the claim.** docs/rom-services.md:155 and `src/hwsvc.asm:216-217` say status 2 "while claimed". With `CON UC1` and a claim, `PUTAT` returns 0 and draws. Reproduction: on the starter card with `--board pico`, `CON UC1`, then `VIDEO` with `B` = 1, then `PUTAT`. The check at `src/term.asm:533-543` is right and the words are too wide.

**D4. The test's joystick message.** `test/hwsvc.test.mjs:128` calls 05h "joystick up and right". Under the diagnostics ROM's labels, 05h is up and left.

**D5. Status 2's comment.** `src/abi.inc:38` and `src/hwsvc.asm:30` say "the device is not fitted". `PUTAT` also returns it when the console is the serial terminal with a video driver installed.

**D6. `VOLSVC`'s header.** `src/vol.asm:580-583` has the omissions of F9.

**D7. Open decision: the `B` contract.** `src/abi.inc:27` and `:33`, and `src/hwsvc.asm:18` and `:25`, say `B` = 1 for a claim and for a set. The code takes any nonzero value, and the book states that (09:467, 09:655, Appendix B:115, 175). Either the comments widen or the book narrows to `B` = 1 as the documented value. The book is right about the code as it stands.

## Counts

Factual findings 15 (F1 to F15), structure 3 and one note (S1 to S3, S4), assembly style 3 (L1 to L3), writing 6 and one note on STYLE.md, TEC-OS defects 6 and one open decision (D1 to D7), claims unconfirmed 8.
