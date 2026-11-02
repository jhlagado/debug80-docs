# Review of TEC-OS book chapters 10 and 20, branch `tec-os-book` at dc83228, against TEC-OS bd15528

Method: both chapters were read from `origin/tec-os-book`, with chapter 21, `tec-os/editorial/STYLE.md`, the parts brief, `bindings/z80-cpm/assembly-style.md` and the cross-referenced chapters. The code is bd15528, from the prebuilt tree, whose sources were compared with `git archive bd15528` and are identical. All captures ran in a private copy of that tree. Listings were extracted from the chapter text byte for byte, and `area.asm` and `hwlib.asm` from chapters 7 and 9. Memory reads came from a copy of `tools/capture.mjs` with one added line type that prints memory, and otherwise the same run loop. `TAS.COM` on the card has the SHA-256 the chapter names, and `test/inputs.json` pins that hash to Thorium 7604daa. Every `file:line` citation in chapter 20 was opened. `test/stacks.test.mjs` was rerun; `test/svc.test.mjs` was read at the cited lines, not rerun.

Transcripts that match byte for byte: `DIR AREA.*` and `AREA` (10:66-76); the whole run at 10:241-287, in both parts; `CHEAT` (10:372-379); `RECS` on the pico board (10:521-534); `NEEDS` (10:603-626); `VTEST` (10:708-718); `GAPZERO` (20:263-271). Runs are as the comments give them. The `sed` in the comment at 10:372 works with the macOS `sed` too.

Figures confirmed: `AREA.PRL` 339 bytes (256 + 73 + 10); `COUNT.SVC` 111 bytes, 100 + 11; the first 111 bytes of `TAS`'s output equal `makeSvc`'s, and the rest of its 128 are zero; the count's rise of 18h, which repeats in a second run (`000C`, `0024`); the page `B7h`; `06h 0Ah 04h` at `B70Ch`; routine sizes 32, 24, 26, 44, 81, 29, 10, 15, 68 and 138, total 467, 485 with `HWTAB`; `TONE`'s 16 × `B` + 51, counted by hand, and chapter 9's table agrees; census 34, 16, 22 and base 32, 16, 16 from the rerun of `test/stacks.test.mjs`; each `SVCLIM` as the largest even figure leaving a quarter free.

Requested checks, in short:
- `TAS NAME NAME.DRV` then `REN`: correct. `src/tas/MAIN.ASM:72` at 7604daa selects a service for type `DRV` alone, and `src/tas/TAS.ASM:9` makes any other type but `COM` a flat image. `TAS COUNT COUNT.SVC` prints `COUNT.SVC written`, and the file then gives `COUNT.SVC?`. So does a file assembled to `COUNT.TMP` and renamed. One gap: see F10.
- The six bytes: reproduced, with exactly the bytes and addresses in the chapter, but the mechanism and the recovery are both wrong. See F1 and F2.
- `COUNT` and `GLCD.SVC`: reproduced in both orders, with a control. See F3.
- Marking as the behaviour at the chapter's commit: neither warning is marked. See F3.
- Chapter 21: both chapters repeat it. See S1 to S3.
- A reader new to the project: mostly followable, with the failures at F6, F12, F13, F14, G1 and G2.

## 1. Chapter 10 and both warnings

**F1. The six bytes are overwritten by the stack; the chapter says by memory use.** 10:312-314 and 20:424-427 say that `TAS` "uses memory up to that word" and that a program "that fills memory up to the word" writes over them. `TAS.COM` at 010Dh is `LD HL,($0006)`, `LD SP,HL`, and the six bytes it leaves are three return addresses, 1E7Fh, 17C6h and 17B7h. They are the same for `TAS AREA` and `TAS VTEST`, sources of different sizes. `EDIT.COM` does the same with `LD SP,($0006)` at 1D95h, and left `DE 1E D7 1D A7 1D`. A program of 35 bytes that only sets `SP` from the word and makes three nested calls left `11 01 0D 01 07 01`, and `SERVICES` then printed a stray line. So a program needs no large memory to do this; the CP/M habit of starting the stack at that word is enough, and that is what a reader must recognise in a program of their own. 10:311 also understates the bytes: they are the links, and also the flags and `REMOVE`'s offset, which is what sends `UNLOAD` astray.

Correction at 10:310-314: "Run `TAS` before you install a service. The word at `0006h` points 6 bytes into the lowest service's first page. Those 6 bytes hold the service's links, its flags and the offset of its `REMOVE`, and the word puts them in the program area. `TAS` starts its stack at that word, as `EDIT` does and as many CP/M programs do, so its first pushes land on them, and a program that fills the area reaches them too."

Correction at 20:424-426: "`LOADCOM` stops short of that page (`src/cpm/ccp.asm:369-371`), so loading a file can't reach them, but a program that sets `SP` from the word pushes onto them, and one that fills memory up to the word writes over them. Nothing tests for that. The starter card's `TAS.COM` sets its stack this way: …"

**F2. "A reset clears the damage" is false for the run the same sentence describes.** 10:316-317. A reset after `TAS` with no `UNLOAD` does recover. After the `UNLOAD`, on the serial board, it doesn't: `node tools/capture.mjs --card svc.img B: COUNT.SVC "A:TAS AREA" UNLOAD "@reset"` ends at `No volume mounted, error 02` and `R retry, H header>`, and `R` gives the same error again. The cause is at 20:430. `CEB7h` lies inside `SPIR`'s loop (`src/sd.asm:32-39`, `SPIRB` at `CEB1h`), so the stray `REMOVE` runs part of the ROM's card read and clocks the SD bus. Before any reset, `AREA` and `DIR` still work, and then `CHARS` gives `Bdos Err On B: Bad Sector`, and the run waits for a key. A new start of the model with the same card boots, so the card is not harmed in that run. 20:429-432 also stops short: `UNLOAD` copied `7Fh`, `1Eh`, `C6h` into `REGHEAD` and `SVCHEAD`, so `SERVICES` goes on printing the same stray lines afterwards. On the pico board the same `UNLOAD` lands in the keyboard code at `C9B7h`, and there a reset does recover, so 10:317-319 is correct for that board. The other bytes give other results: after the 35-byte program, `UNLOAD` left the word at `B706h`, and the next `AREA` printed its line twenty times.

Correction at 10:315-317: "… and the `UNLOAD` after it returned with `CONOUT` still pointing into the freed page. The service's code goes on running. A reset clears the damage if no `UNLOAD` has run. On the serial board the `UNLOAD` also runs part of the ROM's card routine, so on the model `B:` can then report `Bad Sector`, a reset stops at `No volume mounted, error 02`, and only turning the power off and on brings the system back."

Correction after 20:432: "`UNLOAD` also copied `7Fh`, `1Eh` and `C6h` to `REGHEAD` and `SVCHEAD`, so `SERVICES` prints the same lines afterwards. `CEB7h` is inside `SPIR`'s loop (`src/sd.asm:32-39`), and on the model the next read of the card fails with `Bad Sector`, and a reset then stops at the diagnostic prompt with error 02."

The phrase "turning the power off" rests on a new start of the model, not on a board. See section 6.

**F3. Neither warning is marked as the behaviour at the chapter's commit.** Both read as permanent properties: 10:310-319, 20:414-432, 10:367-368 and 20:456-458 are in the plain present, and only the line under each title gives the commit. Yet the first is an open ledger item with a planned change to the word at `0006h`, and the second rests on `SVCLIM` and `CCPSTN`, both left to a later decision. A reader of either chapter at a later commit would get a rule with no date on it. Both claims are true at bd15528: `GLCD.SVC` then `COUNT.SVC` fails with `COUNT.SVC?`; `COUNT.SVC` then `A:GLCD.SVC` fails; `COUNT` with its CCP figure changed to 0 goes in beside `GLCD.SVC` in either order; `CON UC1` on the pico board behaves the same way. The room left after `COUNT` is `04h`, against the 6 that `GLCD.SVC` asks for. The marking must state the commit and forecast nothing, since STYLE.md:198-200 leaves plans out.

Correction: open 10:310 with "At the commit named at the head of this chapter, the word at `0006h` points 6 bytes into …". Open 20:416 with "At bd15528 the word at `0006h` points at `xx06h` because …". At 10:367: "At this commit `GLCD.SVC` declares 6 for the CCP's, so it and `COUNT.SVC` can't both be in." At 20:456: "At this commit `GLCD.SVC` declares 2, 0 and 6 …".

**F4. 20:10 leaves out the `TAS.COM` build.** 20:426-428 gives bytes that come from the starter card's `TAS.COM`, a file from outside the repository, and STYLE.md:14-15 puts that file's build and SHA-256 on the line under the title. Chapter 10's line has them. Correction: "Checked against TEC-OS bd15528. The six bytes below were left by the starter card's `TAS.COM`, from Thorium 7604daa, SHA-256 `ff18734807206127d4ede7a96bbd26acf36310361834a1c9ae998b20e2f98292`."

**F5. 20:238-239 and 20:427 name no run.** "as a read of memory on the model shows" and "on the model" give the reader nothing to repeat, and `capture.mjs` has no way to read memory (STYLE.md:45-47). The chapter's six bytes can't be reproduced from its text, and neither chapter shows the stray output its warning describes. Correction: put a transcript in chapter 10 after line 316. This comes from a run at bd15528, and it needs `COUNT.SVC` on the card from 10:307:

````
<!-- node tools/capture.mjs --card svc.img B: COUNT.SVC "A:TAS AREA" SERVICES UNLOAD SERVICES -->
```text
B>COUNT.SVC

B>A:TAS AREA
AREA.COM written

B>SERVICES
COUNT 1
I:b97(: 39
         214
B>UNLOAD

B>SERVICES
I:b97(: 39
         214
B>
```
````

At 20:238 and 20:427, say that the bytes were read from the host model's memory with a script around `Machine`, and give that script in the chapter's `sh` style, or keep only what the transcript shows.

**F6. 10:231, "`chars.asm` is the next section's".** The next section is "What INIT and REMOVE must do". The listing is at 10:418, three sections on, in "Publishing a record". A reader goes to the next section for a file and doesn't find it, and needs that file for the run at 10:241. Correction: "`chars.asm` is listed under "Publishing a record"; it reads the count that `COUNT.SVC` publishes."

**F7. 10:230, "`count.asm` and two programs go on the card".** The block puts one program on the card, `chars.asm`. `area.asm` went on at 10:46. Correction: "`count.asm` and `chars.asm` go on the card, along with `HWLIB.ASM` from Chapter 9."

**F8. 10:353 is too broad.** "`makeSvc` rejects a source that writes a ROM address as a number." The test matches two hexadecimal forms only (`tools/lib/svc.mjs:16-17`, and its comment says so). `CALL $C300` is rejected, and `CALL 49920` makes a file of 114 bytes. The chapter's route is `TAS`, and `TAS` has no such test: `A:TAS ROMX ROMX.DRV` with `CALL $C300` in the source prints `ROMX.DRV written`. Correction: "`makeSvc` rejects a source that writes a ROM address in hexadecimal. `TAS` makes no such test."

**F9. 10:168-170 doesn't say the tool finds `INIT` and `REMOVE` by those label names.** The table at 10:181 and 10:186 says the tool writes the offsets, and the listing has the labels, but the rule is left to inference, and a reader adapting `COUNT` needs it. `REMOVE` is needed even by a service with bit 0 clear, because the loader tests the offset (`src/svc.asm:73-75`). Without the label `TAS` stops with `NOREM.ASM:54:1: INIT and REMOVE required`. Correction, after "so the source leaves those at 0": "The tool finds `INIT` and `REMOVE` by those label names, and every service has both, even one that `UNLOAD` can't remove."

**F10. 10:227-228 leaves out the second assembly.** The first assembly works, but a reader's second one doesn't: `REN COUNT.SVC=COUNT.DRV` then prints `FILE EXISTS`, leaving the old service in place under its name. Anyone correcting a listing meets this at once, and the new `.DRV` is easily missed. Correction: add "When `COUNT.SVC` is already on the drive, `REN` prints `FILE EXISTS` and changes nothing, so `ERA COUNT.SVC` comes first."

**F11. 10:57-58 misses a case of the `ORG` rule.** `ORG $0100 ; comment` is refused too, with the same message, because the pattern allows nothing after the number (`tools/lib/prl.mjs:15`). The assembly style's half-commented lines make this a likely form. Correction: "so the source must have the line `ORG $0100`, indented and spelt that way, with no comment on it, exactly once."

**F12. 10:14, "Everything up to here has been a `.COM` file".** Chapters 5 and 9 have installed `.SVC` files already, and chapter 5 defines the service. Correction: "Every program written so far has been a `.COM` file, which runs at `0100h` and is gone when it ends."

**F13. Two terms are used before they are explained** (STYLE.md:61-62). "client" at 10:408, explained at 10:411. "generation" at 10:553, explained at 10:555. Correction: at 10:408, "and a program or service that names version 1 still works"; then 10:411 stands. At 10:553: "It looks the record up each time, or compares the generation, a byte described below."

**F14. Vocabulary.** 10:89-90: "A service can also hold routines for programs to share" is where the brief's *library* belongs, and chapter 5 has defined it. Correction: "A service can also be a *library*, with routines for programs to share." 10:351: "the table at `C003h`" should be "the ROM table at `C003h`". `*service resident memory*`, from 5:39, isn't used, and 10:85 could use it: "TEC-OS reads a `.SVC` file into pages below the BDOS, in the service resident memory". No use of "module" or "resident module" appears in either chapter's prose.

**F15. 10:321, "What INIT and REMOVE must do", is a banned heading form** (STYLE.md:172-175). Correction: "The rules for INIT and REMOVE".

**F16. Sentence rules.** 10:312, "a program counts them as its own memory" gives a program a judgment; F1's text removes it. 10:347, "No service owns an interrupt": nothing in the code defines that ownership (STYLE.md:111-113). Correction: "A service can't keep an interrupt handler." 10:354-355, "stands in for it" is the kin of *stand as* (STYLE.md:100-101). Correction: "since a file of format 3 loads only on a ROM with this table." 10:331, "looks through": use "reads". Lines 10:548-549 are 81 characters, past the brief's wrap.

**F17. Listings against the assembly style.** Machine check of all five: tabs, comment column 33, line length, label length and density all pass (61, 56, 51, 50 and 52 percent). Each comment was read, and none is filler. Three points remain.
- Runs of more than four uncommented code lines: 10:443-448 in `CHARS` (5), 10:587-595 in `NEEDS` (6), 10:694-698 in `VTEST` (5). Correction: comment the data, for example `NAME: DB "COUNT   " ; the record to find`, `TABLE: DW 0 ; the table, once found`, `BACK: DB ... ; PICORD fills the four ?`.
- Operands past 15 characters: 10:446 and 10:696 at 27 and 26 characters, 10:698 at 16. Correction: `NONE:` over two lines, the text then `DB 13,10,"$"`; the same for `BACK`.
- 10:442: `CALLHL`'s header leaves out what it takes and changes. Correction: "; Call the routine at HL, which returns to this CALL's caller. Changes what that routine changes."

## 2. Chapter 20

**G1. "The ceiling" is used twice and defined nowhere.** 20:298-299 and 20:302. No chapter of the book that was searched uses the word, which comes from the tests' titles. Correction: 20:298, "`PZTOP` being untouched is what makes a warm boot during `INIT` harmless to the word at `0006h`." 20:302, "A hook already in the table then points into the program area, which is why hooks go last".

**G2. `CDTMS` and `CONDEV` reach the reader unexplained.** 20:68 and 20:87. Nothing in the chapter says what either is, and the bit table is two chapters on (22:201). A reader of Part II who hasn't seen the project stops at "unless `CDTMS` is set". Correction: 20:68, "`B` is therefore the byte `CONDEV`, the devices found at cold boot, with bit 3 added …". 20:87, "`VIDEO` returns status 2 unless `CDTMS`, the bit of `CONDEV` that a PICO9918 sets at cold boot, is set".

**G3. 20:445-451 gives Base no citation.** STYLE.md:52-53 requires one for each claim. The runs are `test/stacks.test.mjs:211-222`, and the figures are correct: `serial`, `pico9918` and `writeBehind` give 32, 16, 16, and `glcd` and `conUc1Glcd` give the 34 and 22. Correction: add "(`test/stacks.test.mjs:211-222`)" after "with the write-behind run: 32, 16 and 16".

**G4. Two figures of speech.** 20:364, "divides on the selector": use "branches on". 20:359, "the next page down the list": the list runs up in memory, from the lowest service to the oldest, so "down" misleads in a section about pages. Correction: "Each header's offset 2 is the next older service's page, 0 at the end."

**G5. 20:104-105 will go stale.** "although the comment at `src/hwsvc.asm:177-178` says 59" is true at bd15528. At `ks33-model` tip f1b7cd9 the comment says 51, so the clause must go at the recheck. No change now.

## 3. Repetition of chapter 21

Chapter 21:20-21 gives chapter 10 "a programmer's side" and chapter 20 "the rest of a driver's load", so chapter 21 holds the format and the pass.

**S1. 20:212-215 repeats 21:238-245.** The same sum, in the same order, with the same checks; only the example differs. Correction: "The page comes next, by the sum in Chapter 21: an overflow, a borrow or a page below `80h` fails the load, and the page goes in `PRLDL` (`src/svc.asm:76-86`). For `COUNT.SVC` on the serial board …".

**S2. 20:278-285 and 20:287-289 repeat 21:268-273 and 21:290-292.** The loader's writes into the header, the `LDIR`, the new word at `0006h`, and the use of offset 8 by the listing. What chapter 20 adds is `PZTOP` left unwritten and the loader's bounds. Correction: reduce step 5 to "Chapter 21 gives the fields the loader writes over the header and the `LDIR` that moves it (`src/svc.asm:163-179`). `PZTOP` isn't written. The `JP`'s high byte at offset 8 is the old top's page, the page above this service's last, and `SVCBND` reads it there for the loader's bounds (`src/svc.asm:268-273`)."

**S3. Chapter 10 restates the file format and the two assemblies.** 10:25-29 repeats 21:49-56; 10:33-35 repeats 21:142-147; 10:55-56 repeats 21:31-37. Some of this is needed in Part I, and 10:79-80 already defers the figures properly. Correction: cut 10:26-29 to "A PRL file is Digital Research's page relocatable format, which holds a program's code and a map of the bytes that hold addresses, and Chapter 21 gives its layout." Cut 10:55-57 to "`makePrl` assembles the source twice, and for the second assembly it rewrites the source's `ORG` line, so the source must have the line …". The figures at 10:61 keep their sense, with "the header" given as "a header of 256 bytes".

20:243-249 is not a repetition: it points to chapter 21 and adds the case of a first gap of 0. 20:231-237 overlaps 21:277-280 on the room left, but chapter 21 gives it only as an example, so it stays.

## 4. Notes on neighbouring files, for the pass that changes the old words

Not faults of these two chapters, and listed because they send a reader of them astray.
- 20:188, "as Chapter 17 explains": `17-ccp.md:160` still says `DRVGO`, at 08da4d6.
- 20:243 and 10:20 send the reader to chapter 21, which is checked at 98c6416 and cites `src/drv.asm`, `tools/lib/drv.mjs` and `DRIVERS`; none is present at bd15528.
- 20:416 sends the reader to chapter 13, whose text at 13:200-210 is on the old words.
- `index.md:188-192` still says "a driver's load" and lists `src/drv.asm` and `docs/drivers.md`, and it should list `src/svc.asm` and `docs/services.md`.
- `07-memory.md:218` and `:224` tell a program that its data, and a stack of its own, may run to the word at `0006h`. With any service in, that is the behaviour F1 warns of. The sentence wants the same qualification.
- STYLE.md:28-36 still names `book/capture.mjs`; both chapters correctly use `tools/capture.mjs`.

## 5. TEC-OS defects

**T1. Offsets 0 to 5 of the lowest service are program memory.** This is KE-136, open, reproduced at bd15528. Two additions to the ledger's text: the common cause is `SP` set from the word, not filling memory (`EDIT.COM` too), and see T2.

```sh
cp dist/starter.img t.img
node tools/tecvol.mjs put t.img B area.asm --text
node tools/tecvol.mjs put t.img B COUNT.SVC
node tools/capture.mjs --card t.img B: COUNT.SVC "A:TAS AREA" SERVICES UNLOAD SERVICES
```

Before `TAS`: `00 00 00 01 2E 00` at `B700h`. After it: `7F 1E C6 17 B7 17`. `SERVICES` prints `I:b97(: 39` and `214`. After `UNLOAD`, the word at `0006h` is `B806h` and `BF0Ch` still holds `JP B742h`.

The same with a program that only sets the stack:

```asm
	ORG	$0100
	LD	HL,($0006)
	LD	SP,HL
	CALL	SUB1
	JP	0
SUB1:	CALL	SUB2
	RET
SUB2:	CALL	SUB3
	RET
SUB3:	LD	DE,MSG
	LD	C,9
	CALL	$0005
	RET
MSG:	DB	"hello",13,10,"$"
```

**T2. `UNLOAD` calls an unchecked offset, which can leave card reads failing until a new start.** `SVCUNL` trusts offsets 4 and 5, which `SVCIN` tested only at the load (`src/svc.asm:39-41`, `:257-265`). After T1, on the serial board, the jump lands in `SPIR`'s loop at `CEB7h`, with `/CS` low. Reproduction: T1's card, then `node tools/capture.mjs --card t.img B: COUNT.SVC "A:TAS AREA" UNLOAD "@start CHARS"` (with `CHARS.COM` on the card) gives `Bdos Err On B: Bad Sector`, and `... UNLOAD "@reset"` gives `No volume mounted, error 02`, with `R` failing each time. A new run on the saved card boots. T1's fix removes this route. If T1 is not fixed first, a check of the offset against the header's bounds at `UNLOAD` would cost a few bytes. Seen on the model only.

**T3. `makeSvc` writes a file from a source with no `REMOVE`.** `tools/lib/svc.mjs` writes `symbols.REMOVE - 0x100` with no test, and a source with the label removed builds a 97-byte file with `REMOVE` 0, which the loader then rejects. `TAS` stops with `INIT and REMOVE required`. The PC tool should stop too.

**T4. Comment at `src/cpm/ccp.asm:753`.** `PUTTRIM`'s "stopping at a space" is wrong: a space is skipped and printing goes on (`:759`, `:767-769`), which is why `COUNT   W` prints as `COUNTW` at 20:269.

**T5. `test/programs/res.asm:8` declares 0, 0, 0** while `MYCO` pushes a word on `CONOUT`'s path. It is a fixture, but 10:203-204 points the reader to it as this hook, and chapter 10's Stacks section says the same hook needs 2.

**T6. Low.** `tools/lib/prl.mjs:15`: `\s+` matches a newline, so an unindented `ORG $0100` after a blank line is accepted, against the rule that the line be indented, while a trailing comment is refused. The chapter states the stricter rule, which is safe.

**T7. Observation.** With `COUNT.SVC` in on the pico board, a failed `CON UC1` leaves `CON: TTY: serial terminal`. This is the state KE-135 records; no separate defect is claimed.

## 6. Not confirmed

- Anything on a physical board. In particular F2's account of the card reads, and "turning the power off", rest on a new start of the host model. The card model's state across the reset button may differ from a real card's.
- The web page itself. "The web page's board" was run as `--board pico`.
- `test/svc.test.mjs` was read at each cited line and not run, so the claims resting on it are confirmed as what the test says: warm boot inside `INIT` (20:298-303), the kept pages (20:353), the cycle (20:376-378), a selector of 2, and the 255 records. The walk's limit was also traced by hand.
- The 256-removal wrap of the generation (10:558) was read from `src/svc.asm:49-51`, not run.
- `PICO40.SVC` and `PICO32.SVC` publishing version 2 (10:630) was read from the shared source, and only `PICO.SVC` was run.
- "No command can reach that case" at 10:343-345 was read and agrees with the code, but a negative of that kind can't be shown by a run.
- 10:25, the format's origin, was not checked against a reference. It agrees with chapter 21.
- Chapter 7's and chapter 9's listings were taken as given, apart from assembling and running them here.
