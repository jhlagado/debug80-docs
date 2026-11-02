# Check of the editorial pass on Part II (chapters 12 to 26)

Compared: `61372b1` with `origin/tec-os-book` at `6540097`. Later commits on the
branch touch Part I only, so every line number below holds at the branch head.
Line numbers are those of the edited chapter files. The code was read at each
chapter's named commit.

## Result

The pass is sound on facts. Every number, address, backticked name and `Chapter N`
or `Appendix X` reference survived, and no `file:line` citation was lost. All 16
findings come from sentence splits and rewordings. Four change what the text
states: findings 1 to 3 and, in its effect on the reader, finding 10. The rest are
pronouns or clauses that now attach to the wrong thing, one citation moved away
from its claim, and four reader problems.

## Question one: meaning

### 1. `tec-os/26-host-model.md:229`: a known difference weakened to a possibility

- Before: "A behaviour in which the model differs from the board as its documents describe it, such as a write under the boot overlay or the decoding of the latch's upper bits, gives a passing test and may give a different board."
- After: "The model may differ from the board as its documents describe it, as in a write under the boot overlay or the decoding of the latch's upper bits. A behaviour of that kind gives a passing test and may give a different board."
- Why: the two examples are real differences, not possible ones. The same chapter says the overlay write "goes to RAM in the runtime but to the ROM in the TEC-1G's own documents", and `docs/diagnostics.md:439` at 98c6416 records T08 as "Differs from the model, kept". The "may" belongs only to the board's result.
- Fix: "In some behaviours the model differs from the board as its documents describe it, such as a write under the boot overlay or the decoding of the latch's upper bits. Such a behaviour gives a passing test and may give a different board."

### 2. `tec-os/24-diagnostics.md:106-108` and `:122`: T01's range widened by a changed noun

- Before: "Every later test depends on that page, so test T01 checks it first, with no stack, using registers alone: four passes that fill the page with a pattern from each address and read it back"; later, "With its page proved, the ROM clears its variables".
- After: "Every later test depends on that RAM, so test T01 checks it first, with no stack and using registers alone. It makes four passes that fill the RAM with a pattern from each address and read it back"; later, "With that RAM proved, the ROM clears its variables".
- Why: the sentence before ends "in the fixed RAM", so "that RAM" reads as all of `0000h–7FFFh`. T01 tests only `7E00h–7FFFh` (`diag/boot.asm:45-49`, `diag/main.asm:57`); the rest of the fixed RAM belongs to the RAM tests that follow. "Page" was already loose, since the range is two pages.
- Fix: "Every later test depends on `7E00h–7FFFh`, so test T01 checks those two pages first, with no stack and using registers alone. It makes four passes that fill them with a pattern from each address and read them back". At line 122: "With those pages proved, the ROM clears its variables".

### 3. `tec-os/24-diagnostics.md:186`: a fact dropped and a false "so"

- Before: "The automatic tests run in the order `diag/main.asm:56-87` calls them, which is not the order of their numbers: T35 and T36 follow T18, and T37 follows T20."
- After: "The automatic tests run in the order `diag/main.asm:56-87` calls them, so T35 and T36 follow T18 and T37 follows T20."
- Why: "which is not the order of their numbers" is gone, and with it the reason the reader is given the example. "So" also claims a consequence the sentence doesn't support.
- Fix: restore the before text.

### 4. `tec-os/17-ccp.md:57`: pronoun now points at the disk reset

- Before: "It sets `WRFLAG` and calls function 13, the disk reset, which with that flag keeps the drives whose allocation vectors are unchanged, as Chapter 16 describes; then it calls function 32 with the user number from the byte"
- After: "It sets `WRFLAG` and calls function 13, the disk reset. With that flag the reset keeps the drives whose allocation vectors are unchanged, as Chapter 16 describes. It then calls function 32 with the user number from the byte"
- Why: the subject of the new middle sentence is "the reset", so "It" reads as the BDOS reset calling function 32. `CCPENT` makes that call (`src/cpm/ccp.asm:27-45` at 08da4d6).
- Fix: "`CCPENT` then calls function 32 with the user number from the byte".

### 5. `tec-os/23-command-history.md:213`: pronoun now points at `LINERASE`

- Before: "`HREC` erases what is in the buffer with `LINERASE`, the routine behind `^X`, which takes the characters off one at a time and erases each on the console (`src/cpm/bdos.asm:429-440`). It then copies the entry's bytes into the buffer with `HGET`"
- After: "`HREC` erases what is in the buffer with `LINERASE`, the routine behind `^X`. `LINERASE` takes the characters off one at a time and erases each on the console (`src/cpm/bdos.asm:429-440`). It then copies the entry's bytes into the buffer with `HGET`"
- Why: "It" now follows a sentence whose subject is `LINERASE`. `HREC` does the copy, at `HRCOPY` after the call returns (`src/history.asm:81-102` at 62d47ed).
- Fix: "`HREC` then copies the entry's bytes into the buffer with `HGET`".

### 6. `tec-os/14-reset-and-boot.md:304-308`: pronoun cut off from `CPMINIT`, and a term defined after its use

- Before: "The drive table, the DPHs and `LOGINV`, the BDOS's record of the logged-in drives, are in the BIOS's part of the workspace, which `CPMINIT` does not clear (`src/ram.asm:22-34`); the allocation vectors below `WSBASE` and the BIOS table at `BF00h` are outside what it clears too."
- After: "The drive table, the DPHs and `LOGINV` are in the BIOS's part of the workspace, which `CPMINIT` does not clear (`src/ram.asm:22-34`). `LOGINV` is the BDOS's record of the logged-in drives. The allocation vectors below `WSBASE` and the BIOS table at `BF00h` are outside what it clears too."
- Why: the inserted sentence comes between `CPMINIT` and "it", whose nearest candidates are now `LOGINV` and the BDOS. The move also puts the definition after the first use, where the style guide wants it in the same sentence or the one before.
- Fix: "The drive table, the DPHs and `LOGINV`, the BDOS's record of the logged-in drives, are in the BIOS's part of the workspace, which `CPMINIT` does not clear (`src/ram.asm:22-34`). The allocation vectors below `WSBASE` and the BIOS table at `BF00h` are outside what `CPMINIT` clears too."

### 7. `tec-os/26-host-model.md:295-296`: "the file" now points at the driver

- Before: "and if so makes the first line of `STARTUP.CMD` that file's name, followed by `GLCD.DRV` on a board with the PICO9918, keeping its other lines that name no display driver"
- After: "If it does, the first line of `STARTUP.CMD` becomes that file's name, followed by `GLCD.DRV` on a board with the PICO9918. The file's other lines stay if they name no display driver"
- Why: "that file" is the driver file, and "The file's" in the next sentence reads as the same file. The lines kept are `STARTUP.CMD`'s (`host/card.mjs`, `setDisplayLine`).
- Fix: "`STARTUP.CMD`'s other lines stay if they name no display driver".

### 8. `tec-os/14-reset-and-boot.md:262-263`: "It does so" has two candidates

- Before: "The BDOS goes there itself, through `CHDROP`, which first drops the rest of a chained line, a line split at `!` (Chapter 11; `src/cpm/bdos.asm:75-77`), after a `^C` typed as the first key of a line read with function 10 (`src/cpm/bdos.asm:371-375`) and after it has reported a disk error"
- After: "The BDOS goes there itself through `CHDROP`, which first drops the rest of a chained line, a line split at `!` (Chapter 11, `src/cpm/bdos.asm:75-77`). It does so after a `^C` typed as the first key of a line read with function 10 (`src/cpm/bdos.asm:371-375`). It does so too after it has reported a disk error"
- Why: the nearest action before "does so" is `CHDROP` dropping the chained line, while the sentence means the BDOS going to warm boot. "It" and "it" in the last clause also split between the BDOS and the reader's guess.
- Fix: "The BDOS takes that route after a `^C` typed as the first key of a line read with function 10 (`src/cpm/bdos.asm:371-375`), and after it has reported a disk error such as ...".

### 9. `tec-os/13-memory-map.md:149`: `STUBAD` appears to hold the scratch bytes

- Before: "the word `STUBAD` that holds the BDOS entry jump's address, the mount service's scratch bytes, and the video terminal's state"
- After: "Then come the word `STUBAD` that holds the BDOS entry jump's address and the mount service's scratch bytes."
- Why: losing the list's comma lets "and the mount service's scratch bytes" attach to what `STUBAD` holds. They are separate items.
- Fix: "Then come the word `STUBAD`, which holds the BDOS entry jump's address, and the mount service's scratch bytes."

### 10. `tec-os/19-block-cache.md:181-187`: the record copy now reads as one branch of the test

- Before: one paragraph, "Then there are two cases ... If it might, the line is filled from the card first ... If it can't, ... the line is cleared to zeros instead ... (`src/cache.asm:298-316`). The record's 128 bytes are copied from the DMA address into the line with `CWRREC`, and `CDSET` marks the line dirty."
- After: "Two cases follow" (line 177) ends with the card-read branch. A new paragraph at line 181 opens "The block holds nothing the card has to supply in two cases" and ends with "The record's 128 bytes are copied from the DMA address into the line with `CWRREC`, and `CDSET` marks the line dirty."
- Why: the copy now sits inside the cleared-line paragraph and reads as part of that branch. Every path runs it: both branches reach `CWB2`, which calls `CWRREC` and `CDSET` (`src/cache.asm:298-332` at 62d47ed). The paragraph also gives "two cases" a second meaning straight after line 177's.
- Fix: open line 181 with "It can't when the write is CP/M's type 2, the first to a newly allocated block, or a write to the next block of an allocation block whose first block was handled that way." Move the copy to its own opening, ahead of the paragraph at the next `A data write`: "Either way, the record's 128 bytes are then copied from the DMA address into the line with `CWRREC`, and `CDSET` marks the line dirty."

### 11. `tec-os/21-prl-relocation.md:136`: new clause gives the buffer the job, with a banned verb

- Before: "is read one record further into a scratch buffer, so that a file that exactly fills the space is told apart from one that is too large"
- After: "is read one record further into a scratch buffer, which tells a file that exactly fills the space from one that is too large"
- Why: "which" attaches to the buffer, but the read makes the separation (`src/cpm/ccp.asm:298-299`, "One scratch read distinguishes"). *Tells* is on the style guide's list of verbs not used of artifacts.
- Fix: "is read one record further into a scratch buffer. That read separates a file that exactly fills the space from one that is too large".

### 12. `tec-os/13-memory-map.md:30`: a citation left a sentence away from its claim

- Before: "and bit 2 of the system latch at port `FFh`, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:13`, `src/layout.asm:18`)."
- After: "The system latch at port `FFh` selects what is in view. Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:13`, `src/layout.asm:18`)."
- Why: `src/layout.asm:13` is `SYSLAT EQU $FF`, the port. It supports the first sentence, which now has no citation; bit 2 rests on line 18 alone.
- Fix: "The system latch at port `FFh` (`src/layout.asm:13`) selects what is in view. Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:18`)."

## Question two: the reader

### 13. `tec-os/20-hardware-services-and-service-loader.md:381`: term used before it is explained

- Before: the paragraph came last in "Removal", after "`LDIR` copies 3 bytes back to `REGHEAD` and `SVCHEAD`": "The rule that only the lowest service can go is what keeps those saved bytes true."
- After: it opens the section: "Only the lowest service can go, and that rule keeps the bytes saved in each header true."
- Why: the move is sound, but "the bytes saved in each header" now comes before anything in this chapter says a header saves bytes. The earlier mention is only "the fields the loader writes over the header", which defers to Chapter 21.
- Fix: "Only the lowest service can go, and that rule keeps true the three bytes each header saves, the registry's head and the lowest service's page. Each header holds that state from before its own load (Chapter 21), and the states are stacked in memory in the order of the loads."

### 14. `tec-os/19-block-cache.md:144`: causal link lost

- Before: "A file of 15,360 bytes took about 2.0 seconds and then about 2.1, because `CTAKE` had given up each line before the second read reached it."
- After: "A file of 15,360 bytes took about 2.0 seconds and then about 2.1. `CTAKE` had given up each line before the second read reached it."
- Why: this sentence is the explanation of the figures, and the reader now has to supply that.
- Fix: restore "because", or begin the second sentence "By then `CTAKE` had given up each line".

### 15. `tec-os/19-block-cache.md:211`: causal link lost

- Before: "`CTAKE` writes three of the first 32 data blocks early, because all 30 lines are dirty before the BDOS next writes the directory."
- After: "`CTAKE` writes three of the first 32 data blocks early. All 30 lines are dirty before the BDOS next writes the directory."
- Why: as in finding 14, the second sentence is the reason and no longer says so.
- Fix: restore "because".

### 16. `tec-os/19-block-cache.md:15`: causal link lost in the opening

- Before: "Reading a block from the SD card takes TEC-OS about 55 milliseconds, because every bit of it passes through a port one at a time"
- After: "Reading a block from the SD card takes TEC-OS about 55 milliseconds. Every bit of it passes through a port one at a time"
- Why: the chapter's opening motivation, cost then cause, now reads as two separate statements.
- Fix: restore "because".

## Checked, nothing to report

- Lists: none collapsed into a paragraph. Several went the other way, into lists or separate paragraphs, without loss.
- Chapter endings: all fifteen end on a substantive point, and none became a recap.
- Moved material: the build block in Chapter 17 moved later, and no transcript before its new position needs `build/ccp.img`.
- Split citations: `web/src/main.mjs:76-78` and `:90-94`, `web/index.html:36-44`, `test/lib/fixtures.mjs:29-41` and `:80-95`, `diag/display.asm:334`, `:353` and `:751`, `src/boot.asm:14`, `:54` and `:91-92`, and `src/hwsvc.asm:89-91` with `src/layout.asm:45-46` each support the claim they now sit on.

## Counts

- Chapters compared: 15
- Question one (meaning): 12 findings
  - Changed or weakened fact: 3 (findings 1 to 3)
  - Wrong pronoun or clause attachment: 8 (findings 4 to 11)
  - Citation moved from its claim: 1 (finding 12)
- Question two (the reader): 4 findings
  - Term used before it is explained: 1 (finding 13)
  - Choppy run that lost its connection: 3 (findings 14 to 16)
  - Broken transition: 0
  - List collapsed into a paragraph: 0
  - Chapter ending that recaps: 0
- Total: 16
