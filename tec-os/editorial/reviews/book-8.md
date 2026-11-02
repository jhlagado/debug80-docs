# Review of the additions to the TEC-OS book, f8eeff7..cc695d9 (branch `tec-os-book`), against TEC-OS 62d47ed

Scope: the changes since f8eeff7 to tec-os/03-command-line.md, 04-cards-and-volumes.md, 06-first-program.md, 07-memory.md, 08-programs-and-console.md, 19-block-cache.md and 21-prl-relocation.md. Chapters 14 and 23 are out of scope. Line numbers are those of cc695d9.

Basis: a clean archive of 62d47ed, `npm run build` and `npm run media` with `EDIT_COM` set to Edit 845d062 (12 starter files; ROM sha256 12a70955…, all four profiles; card sha256 2d77a418…; card `EDIT.COM` sha256 ed88337e…, the hash the chapters name). The ATOM assembler is `atom-z80` 0.3.7, as the chapters name. The listings were taken from the Markdown as published. 98c6416 and 08da4d6 were built the same way, to test the additions at the commits the chapter headers name.

Transcripts that match the capture byte for byte: chapter 3's `COPY README.TXT B:.DOC` run, chapter 7's `B:AREA` and chapter 8's `B:KEY`. `TERM` on the pico board matches. `TERM S` prints 30 lines, L00 to L29, on the serial and pico boards.

Listings that assemble and run: `AREA` (73 bytes, prints 46854, 45318 and 43782 with no driver, one and both, and 46086, 44550 and 43014 on a four-drive card), `KEY` (142 bytes, runs on the serial and pico boards), and `TOP` and `SIZE`, needed to build the cards.

## 1. Factual errors and claims needing correction

**F1. The cache's gain is stated without its limit (medium).** 04-cards-and-volumes.md:339-341 and 19-block-cache.md:102-106. The figures are correct for a 12,288-byte file, which fits the 30 lines. They don't generalise, and neither chapter says so. A second read gains nothing once the file no longer fits, because the lines are given out in turn and each is given up before it is read again (19-block-cache.md:73 states that order). Measured on a card with one G1M volume, with the same program:

| File size | First run, T-states | Second run, T-states | Second / first |
| --- | --- | --- | --- |
| 12,288 (on `time.img`) | 6,625,753 | 1,327,575 | 0.20 |
| 14,336 | 7,657,339 | 1,475,683 | 0.19 |
| 15,360 | 8,174,224 | 8,396,166 | 1.03 |
| 16,384 | 8,930,467 | 8,933,461 | 1.00 |
| 20,480 | 11,012,083 | 10,986,162 | 1.00 |

The change falls between 14,336 and 15,360 bytes, sizes between those two weren't tried. Since 1.66 and 0.33 seconds are the only read figures a Part I reader sees, STYLE.md's rule on keeping scope applies. Fix at 04:341, replacing "Chapter 19 gives the method.": "A file too large for the cache took as long the second time. Chapter 19 gives the method." Fix after 19:106: "The gain needs the whole file in the cache. A file of 15,360 bytes took about 2.0 seconds and then about 2.1, because `CTAKE` had given up each line before the second read reached it."

**F2. Chapter 19's header no longer describes its figures (medium).** 19-block-cache.md:10-13 and 93. Line 13 says the timings and traces were made on the starter card, and line 10 names 98c6416. The new figures were made on `time.img` at 62d47ed, so line 13 is now false for them, and line 93 puts a second commit in a chapter that STYLE.md gives one commit line. The exact counts depend on the commit. By one script at both commits:

| Run | 62d47ed | 98c6416 |
| --- | --- | --- |
| first read | 6,625,753 | 6,627,723 |
| second read | 1,327,575 | 1,329,545 |
| `SAVE 64` on `THROUGH` | 30,822,909 | 30,841,796 |
| `SAVE 64` on `BEHIND` | 9,905,568 | 9,924,638 |

The seconds and ratios in both chapters are the same at both commits. Fix: either recheck the chapter and move line 10 to 62d47ed, or keep 98c6416 and give that commit's counts, dropping "measured at TEC-OS 62d47ed". In both cases line 13 becomes "the timings and traces below were made on that card unless the text names another".

**F3. The method can't be rerun from the text (medium).** 19-block-cache.md:93-106 and 171-175. The figures are confirmed: a 24-byte program built from the description gave counts 264 to 272 T-states below each published count, a constant offset from where the count starts, and all the rounded seconds and ratios match. The program was open with function 15, return on failure, read with function 20 until `A` is nonzero, `JP 0`, with `DATA.BIN` as the file. But the text gives neither the program nor the file's name, and `book/capture.mjs` prints no cycle count, so a reader can't get the number without writing a script. STYLE.md's "Each example names its run" is written for transcripts, so this is a gap in the method statement and not a broken rule. Fix: name the files and show the program in a short `asm` block, or at least say how the count is read: "a script that drives `Machine` as `book/capture.mjs` does and reads `m.cycles` before and after".

**F4. The stack rule's "so" overstates the measurement (low).** 08-programs-and-console.md:70-73. A direct call with nothing pushed does fit, which confirms the claim. The deepest points found, from the program's entry `SP` and counting the call's own return word, were 6 bytes on the serial terminal, 20 on the PICO9918 at 80, 40 and 32 columns and on the graphics LCD, and 24 when the call also changes the console through the IOBYTE. So 8 bytes stay free, or 4 on that path, and "pushes anything" doesn't follow from "hold a direct call". The old `KEY` reached `CONOUT` with 8 bytes in use against 2 for a direct call, which comes to 26 bytes on the 20-byte paths and still fits. The rule is safe advice, and the new `KEY` is right to follow it, but the sentence presents it as a consequence. These are the deepest paths exercised, not a proved worst case. Fix: "A direct call with nothing pushed goes up to 24 bytes down the CCP's 28, on a display, so a program that pushes before it calls the BIOS sets up a stack of its own first."

**F5. The bytes named for the console's state are too wide and too few (low).** 08-programs-and-console.md:73-75. `0046h–004Ch` includes `0048h` and `0049h`, the console's size, which aren't the cursor or the sequence (src/layout.asm:43-49). The cursor's visibility and reverse video are also shared state, at `004Eh` and `004Fh`. The conclusion stands. Fix: "and they keep the cursor at `0046h`, the escape sequence at `004Ah–004Ch` and the video attributes at `004Eh`, `004Fh`, all fixed bytes, so an interrupt routine must not print through the console."

**F6. "Any assembler" needs "Z80" (low).** 06-first-program.md:85-88. The listing's `LD` and `CALL` are Z80 mnemonics, so an 8080 assembler that writes a binary won't do. The named differences also leave out the one in the first line of every listing, the `$0005` notation, against `0005H` in many assemblers. Fix: "so any Z80 assembler that writes a binary for origin `0100h` will do, though the syntax of numbers, `EQU` lines and strings varies between them."

**F7. The format's origin is slightly misstated (low).** 21-prl-relocation.md:104. The title and appendix are right: the running head is "CP/M 3 Programmer's Guide", and Appendix B, "PRL File Generation", gives the format in B.1. The appendix's layout matches the chapter: size at 0001-0002H, buffer memory at 0004-0005H, code from 0100H, the bitmap after it, bit 7 first, one bitmap byte for every 8 of code. But section 1.6 of the same guide treats PRL as MP/M's format, which CP/M 3's CCP loads like a COM file, so "for MP/M and CP/M 3" gives two origins for one. Fix: "Digital Research defined the format for MP/M, and CP/M 3 took it up; Appendix B of the CP/M 3 Programmer's Guide describes it."

**F8. The linker's name (low).** 21-prl-relocation.md:105. `[OP]` is confirmed: the guide's Appendix B shows `link dump[op]`, its RSX section shows `LINK ECHOVERS [OP]`, and section 15.4.10 of the Programmer's Utilities Guide and section 1.2.9 of the LINK-80 Operator's Guide both define the switch. Every one of those names the product LINK-80, which is the name a reader will search for. Fix: "Digital Research's linker, LINK-80, writes a PRL with its `[OP]` option."

**F9. A universal negative that can't be checked (low).** 21-prl-relocation.md:108. "none has been through the loader" claims that no LINK-made file has ever been loaded anywhere. What can be checked is the repository's tests. The citations are right: test/prl.test.mjs:37 calls `prl(name)` and test/lib/fixtures.mjs:63 defines it; test/ holds no `.PRL` file, and the one other maker, test/model/ks20/glcd.mjs, calls `makePrl`, which is also the repository's own code. Fix: "and a file from LINK-80 has the same layout by Appendix B, though the tests hold none: they make their PRL files with the repository's own code".

## 2. Fit, deletion test and rules

**E1. A paragraph stranded between REN and COPY (medium).** 03-command-line.md:220-221. The paragraph opens "A destination with a type and no name" straight after a paragraph on `REN` and `ERA`, and its "also" points back 42 lines to line 178. The next paragraph then starts on `COPY` again. Fix: move the two lines into the paragraph at 176-184, after "the copy has the source's name", as "A destination with a type and no name, such as `B:.DOC` or `B:.*`, also takes the whole of the source's name, so the type you typed has no effect."

**E2. The transcript opens on a case its introduction doesn't mention (low).** 03-command-line.md:227-243. The colon at line 227 promises the `COPY?` cases, but the transcript's first two commands show the `B:.DOC` copy from the paragraph before. If E1 moves that paragraph further away, the mismatch grows. Fix: end line 227 with a full stop and add "Here the first copy has a type and no name, and the next two fail:".

**E3. `AREA` has no motive and adds no figure (medium).** 07-memory.md:147-148. "`TOP` prints the word in hexadecimal. This program prints the size of the program area in decimal" gives the listing no reason, and STYLE.md asks for motivation before mechanism. The 41-line listing produces 46854, which line 136 has stated, so at section level the deletion test finds little that is lost. Decimal printing is also what the listing teaches, and that isn't this section's subject. The section's own hook is at lines 56-58, where a program sizes its buffers from the word. Fix, keeping the listing: "A program that sizes its buffers works from the area's size, the word less `0100h`. This program finds it and prints it in decimal:". The alternative is to cut lines 147-211. The surrounding text doesn't depend on them.

**E4. A sentence with nothing to do (low).** 07-memory.md:196-197. "It always prints five digits, leading zeros included." Every program area is 43,014 bytes or more unless other drivers are in, so `AREA` has no leading zero to show, and the header at line 164 says it too. Delete it.

**E5. "The smallest case" (low).** 07-memory.md:141. The case is the card, and the paragraph means the smallest program area. Fix: "No card gives less, with no driver, than that card."

**E6. Two jobs in one paragraph (low).** 08-programs-and-console.md:69-75. The stack and the interrupt rule are separate, and only the stack leads to `KEY`. STYLE.md gives a paragraph one job. Fix: move "The routines also run …" to a paragraph of its own, before or after, so that the stack sentence leads into "This program reads keys".

**E7. A weak bridge (low).** 19-block-cache.md:93. "A whole command shows the gain" follows "`DIR` … shows the effect", and `DIR` is a whole command. The sentence does carry the antecedent of "These figures", so it can't simply go. Fix: "A program that reads a file shows the gain over a whole file."

**E8. The loader's checks are stated twice within a page (low).** 21-prl-relocation.md:106-107. "TEC-OS's loader reads the length and checks that the code and the bitmap are in the records loaded" repeats the five steps that follow, under the same citation (`src/prl.asm:14-53`, which is correct). The new paragraph needs only the point about layout. Fix: start the sentence at the layout: "A file from LINK-80 has the layout that `PRLGO` checks, by Appendix B, though …".

**E9. One source line past the wrap (low).** 08-programs-and-console.md:129, 80 columns in prose wrapped at 76 to 78. Rewrap lines 129-132.

**Additions that pass.** Chapter 3's "The same rule makes …" (246). Chapter 4's two sentences apart from F1: `G8M` and `SAVE` are explained earlier, and "about a third" is right. Chapter 7's limits paragraph (141-145) and the 43,008 sentence (218-219). The CP/M 2.2 paragraph (229-232), which is a real contrast for a CP/M programmer and whose reasoning holds. The EXPAND 1 paragraph (309-315), which replaces a bare warning with its cause. Chapter 8's new `KEY` text. `TERM S` (237-238), which gives the reader a way to see the scrolling the section has just described. Chapter 19's `SAVE` paragraph apart from F2 and F3.

A search of the added lines for mind verbs, *serves as* and its kin, praise words, staged questions, attention directions and softened negatives found nothing. `AREA` uses tabs where the other listings use spaces. The comments fall at the same column at 8-column stops, so the page shows no difference, and no change is proposed.

## 3. Claims checked and confirmed

**Chapter 3.** `CMDCOPY` in src/cpm/ccp.asm:979 fills a 0 drive byte with the current drive (`CPPARSE`), takes the source's 11 name bytes for a blank destination name, and compares 12 bytes before any BDOS call. `COPY README.TXT A:`, `COPY A:README.TXT README.TXT`, bare `COPY README.TXT`, `B:.*` and `COPY A:README.TXT` on drive B all behave as stated. The transcript is also identical on the ROMs of 08da4d6, the commit chapter 3 names, and 98c6416.

**Chapter 4.** 1.66, 0.33, 7.71 and 2.48 seconds, "a fifth" (0.2004) and "about a third" (0.3214) hold at 62d47ed and 98c6416.

**Chapter 6.** `LOADCOM` reads the file to `0100h` unchanged.

**Chapter 7.**
- 46,086, 44,550 and 43,014 bytes are confirmed by run. `TOP` gives `B506h`, `AF06h` and `A906h` on a card made with `--drives 4`, with `PICO.DRV` and then `CON UC1`.
- 43,008 is confirmed by run. A 43,008-byte file loads and runs at `A906h`, and a file of 43,136 bytes prints `B:OVER?`.
- "At most four drives" is `MAXDRV` (src/layout.asm:85). tecvol rejects `--drives` above 4 and the ROM rejects a header above 4 (src/vol.asm:88). "At most 256 bytes" is G8M's DSM of 2047, or the fixed 256 in `ALVINIT` (src/vol.asm:496-575).
- A format 1.0 card with four G8M volumes also gives `B506h`, so no card is smaller.
- `PICO32.DRV` and `PICO40.DRV` also give `B206h`, so "one display driver" covers them.
- `AREA` itself uses 8 bytes of the CCP's stack, and `PUTDEC`'s arithmetic is correct.
- The EXPAND 1 paragraph holds: the CCP's return word is at `BE75h`, and every word value lies in the cache's `8000h–BBFFh`.
- The CP/M 2.2 manual confirms that a transient may overlay the CCP, in its description of the word at `0006h`.

**Chapter 8.** bios and console code holds no `DI`, `EI` or `LD SP` (src/console.asm, src/video.asm, src/glcd.asm, drivers/). The lowest `SP` during the calls fell inside the drivers' code path. Chapter 13:269 agrees that a driver runs on its caller's stack. `JP 0000h` is at 06-first-program.md:323. `TERM S` is test/programs/term.asm: any nonzero tail length. `AREA`, `KEY` and the COPY transcript were also rerun on the 98c6416 ROM, and the output is identical.

**Chapter 19.** `cycles` is at host/machine.mjs:261, unchanged since 98c6416. The `tecvol create` line works as printed.

**Chapter 21.** Lines 106-110's citations are right and unchanged since 98c6416.

## 4. TEC-OS defects

None found. The behaviour behind F1 is the documented round-robin, and none of the checks above produced a fault in the ROM, the drivers or the tools.

## 5. Could not be confirmed

- "A file from `LINK` has the same layout" (21:108) rests on Appendix B alone. No LINK-80 output was examined or loaded, and no LINK-80 was run. The LINK-80 guides leave the file format to the MP/M II Programmer's Guide, which wasn't read. Two related points are unverified: how a PRL with a separate data segment is laid out, and whether a file linked with `[Mnnnn]`, which sets the word at offset 4, needs that memory on TEC-OS, whose loader ignores it. Base-page symbols that LINK-80 treats as relocatable can't matter at `0100h`, since the loader applies no relocation.
- That 24 bytes is the worst case of F4. Those are the deepest paths exercised: the control characters and escape sequences in the chapter's tables except the `f` form of cursor positioning, scrolling, wrap, cursor show and hide, keys, and IOBYTE changes among three consoles. Arrow keys on the matrix keyboard were not exercised, and no analysis of all paths was made.
- The exact chapter 19 counts. The reconstructed program and start point give a constant 264 to 272 T-states less. The original program and script aren't available, so identical bytes can't be shown.
- That the CCP of CP/M 2.2 is 2 KiB (07:229). This is standard, but the text extracted from the CP/M 2.2 manual gave no direct statement of it.
- Nothing was run on a physical TEC-1G or SD card. Every time is the model's.

Sources for chapter 21: [CP/M Plus Programmer's Guide](http://www.cpm.z80.de/manuals/cpm3-pgr.pdf) (Appendix B; section 1.6; the RSX construction example), [CP/M Programmer's Utilities Guide, Sep 1982](https://ftp.mirrorservice.org/sites/www.bitsavers.org/pdf/digitalResearch/cpm_plus/CPM_Programmers_Utilities_Guide_Sep82.pdf) (sections 15.4.10 and 15.6), [LINK-80 Operator's Guide, Dec 1980](https://ftp.mirrorservice.org/sites/www.bitsavers.org/pdf/digitalResearch/cpm/LINK-80_Operators_Guide_Dec80.pdf) (sections 1.2.9 and 1.3).

Counts: 18 findings, 0 high, 5 medium, 13 low; 9 factual (F1-F9), 9 on fit and style (E1-E9); 0 TEC-OS defects.
