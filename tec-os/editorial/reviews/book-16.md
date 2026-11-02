# Second editorial pass, chapters 12 to 26: independent check

Compared `9d288de` with `origin/tec-os-book` (`951afaa`), sentence by sentence, in `tec-os/12-*.md` to `tec-os/26-*.md`. Line numbers are those of `951afaa`. Code was read at each chapter's named commit: 98c6416 (12, 13, 15, 18, 21, 24, 26), 62d47ed (14, 19, 23), 08da4d6 (16, 17, 25), bd15528 (20, 22). In each finding, "Before" is the text at `9d288de` and "After" is the text now. No repository was changed and no build was run.

**Result.** The pass is sound. Three new statements fail against the code (A1 to A3), and one chapter pair contradicts itself (C1), though not because of this pass. The rest are low-cost repairs. Most joins hold.

Shape checks:

- List items and table rows are the same in every chapter.
- No blank line was lost around a fence, table, list or heading.
- No citation was removed. Two were added (`src/boot.asm:140-142`, `drivers/pico.asm:17-18`), and both rest on what the code says.
- No moved citation left its claim.

## Named tests

| Claim | Verdict | Evidence |
| --- | --- | --- |
| 14:194-196, ALVINIT before RESEL, so neither slots nor TPA vary | Holds | `src/boot.asm:41-42`; `src/vol.asm:391-393` states it. RESEL doesn't touch `STUBAD` or the slots. |
| 14:150-152, added `src/boot.asm:140-142` | Holds | The comment says the same. MNCOPY copies `JP BF03h` to MAIN 1. |
| 15:351-353, PICO9918 pages, `drivers/pico.asm:17-18` | **Fails in part** | A2 |
| 15:26-28, fixed order gives the same offsets | Holds | `src/cpm/bdos.asm:14-28`, and what a CP/M reference states. |
| 15:51-52, a table a program may overwrite has to be in RAM | Holds | `src/boot.asm:45-47`. `src/bios.asm:1-3` gives page alignment as a second reason. The sentence isn't false, so no change is required. |
| 18:113, "A card can hold anything, so" | **Holds for the checks only** | A4 |
| 20:211, "ordered so that a load can fail at any of them" | **Fails** | A1 |
| 20:125-126, status 2 at PUTAT | Holds | `HWENODV` is 2 at both tests (`src/hwsvc.asm:29-30`, `:218-224`), and the comment at `:215-217` agrees. |
| 17:447, reason covers the FCBs | **Fails** | A3 |

Every other new `because`, `so`, `since`, `therefore`, `so that` and `which` was read against the code or the earlier text. Those not listed below hold. They include:

- 14:28, 14:163, 14:187, 14:197
- 15:86, 15:132, 15:293, 15:329
- 16:104, 16:253, 16:290, 16:306
- 17:47, 17:58, 17:103, 17:226, 17:335
- 18:182, 18:244, 18:299
- 19:75, 19:158, 19:193, 19:262
- 20:28, 20:125, 20:152, 20:353, 20:384
- 22:23, 22:59, 22:66, 22:188, 22:279
- 23:104, 23:112
- 26:21, 26:52, 26:85

## A. Question one: relations, pronouns, subjects

### A1. Chapter 20, line 211. Cause the code doesn't support (fault)

- **Before:** absent.
- **After:** "The steps are ordered so that a load can fail at any of them. Nothing but the file changes before the move in step 5, and the write of `PZTOP` in step 7 is the commit."
- **Why:** No comment gives this as a purpose, and the statement is untrue as worded. Step 5 is an `LDIR` with no failure path (`src/svc.asm:163-179`). After it a failure can keep the pages, status 2 (`src/svc.asm:54-56`, `:230-232`). The order doesn't make failure possible. It makes the early failures clean.
- **Fix:** "A load changes nothing but the file before the move in step 5, so a failure in the first four steps leaves memory as it was (`src/svc.asm:54-56`). The write of `PZTOP` in step 7 is the commit: until then a warm boot gives the pages back, as step 6 describes."

### A2. Chapter 15, lines 351-353. Gloss overstates the code (fault)

- **Before:** absent.
- **After:** "That driver keeps two copies of the screen in VRAM, its pages, so a move of rows can be built out of sight and shown with one register write (`drivers/pico.asm:17-18`)."
- **Why:** The code has "a second name table", not a second copy. `TMSMBEG` copies rows across only when a move begins (`drivers/pico.asm:301-305`), so between moves the hidden page is out of date. The clause "its pages" also has no clear owner, the driver or VRAM.
- **Fix:** "That driver has two name tables in VRAM, its two pages, one shown and one hidden, so a move of rows can be built out of sight and shown with one register write (`drivers/pico.asm:17-18`, `drivers/pico.asm:301-305`)."

### A3. Chapter 17, lines 447-449. Reason doesn't cover what it governs (fault)

- **Before:** "The CCP's block of RAM has two parts, divided at `CCPCLR` (`src/ram.asm:67-128`). Below it are the parts that warm boot keeps: the two FCBs and the command line. The next piece of a chained line therefore survives the program before it."
- **After:** "The next piece of a chained line has to survive the program before it, so the CCP's block of RAM has two parts, divided at `CCPCLR` (`src/ram.asm:67-128`). Below it are the parts that warm boot keeps: the two FCBs and the command line."
- **Why:** The reason explains the command line only. `src/ram.asm:68-70` gives the FCBs a different reason: "which each use parses in full". Chapter 25 lines 40-42 state it correctly.
- **Fix:** "The next piece of a chained line has to survive the program before it, so warm boot clears the CCP's block of RAM only from `CCPCLR` (`src/ram.asm:67-128`). Below that label is the command line, and before it the two FCBs, which need no clearing because each use parses them in full (`src/ram.asm:68-70`). From `CCPCLR` on, warm boot clears the CCP's bytes along with the BDOS's (`src/boot.asm:270-277`)."

### A4. Chapter 18, lines 113-115. Cause covers too much

- **Before:** "The ROM's `MOUNT` routine reads block 0 into `BLKBUF` and checks it in a fixed order, stopping at the first failure with that check's code"
- **After:** "A card can hold anything, so the ROM's `MOUNT` routine reads block 0 into `BLKBUF` and checks it in a fixed order, stopping at the first failure with that check's code"
- **Why:** The cause supports the checking (`src/vol.asm:3-6`). It doesn't explain the read or the fixed order, which the `so` also governs.
- **Fix:** "A card can hold anything, so the ROM's `MOUNT` routine checks block 0 before it uses any of it. It reads the block into `BLKBUF` and makes the checks in a fixed order, stopping at the first failure with that check's code"

### A5. Chapter 20, lines 242-243. `so` on the wrong clause

- **Before:** "(`src/svc.asm:110-113`). `HL` then points at the room left on the three stacks:"
- **After:** "A service's code runs on its caller's stack, as the section on the stack figures describes, so `HL` then points at the room left on the three stacks:"
- **Why:** The caller's stack is the reason for the check, not for where `HL` points.
- **Fix:** "A service's code runs on its caller's stack, as the section on the stack figures describes, so each load has to fit its figures into the room left. `HL` then points at that room on the three stacks:"

### A6. Chapter 22, lines 61-63. Relation lost

- **Before:** "The next call of `STBOOT` then returns at the same test, so an unreadable file can't repeat."
- **After:** "After a failure the next call of `STBOOT` returns at the same test, and an unreadable file can't repeat."
- **Why:** `so` became `and`. The code states the consequence: "so that a failure can't repeat" (`src/svc.asm:327-328`).
- **Fix:** "After a failure the next call of `STBOOT` returns at the same test, so an unreadable file can't repeat."

### A7. Chapter 26, line 92. Clause on the wrong subject

- **Before:** "On a board the first reaches the ROM chip. The second goes to RAM in the runtime but to the ROM in the TEC-1G's own documents"
- **After:** "On a board the first reaches the ROM chip, and the second goes to RAM in the runtime but to the ROM in the TEC-1G's own documents"
- **Why:** "On a board" now also governs a statement about the runtime, which contradicts it.
- **Fix:** Restore the full stop after "chip".

### A8. Chapter 18, lines 184-187. `which` on the wrong noun

- **Before:** "`MNFILL` writes the drive's eight-byte entry in `DRVTAB`. It holds the start block in four bytes"
- **After:** "`MNFILL` writes the drive's eight-byte entry in `DRVTAB`, which holds the start block in four bytes"
- **Why:** `which` attaches to `DRVTAB`, but the entry holds those fields.
- **Fix:** "`MNFILL` writes the drive's eight-byte entry in `DRVTAB`: the start block in four bytes, the length in blocks in two, the geometry and a flags byte with read-only in bit 0 and written-behind in bit 1"

### A9. Chapter 21, lines 15-16. `which` on the wrong noun

- **Before:** "A `.PRL` file is Digital Research's page relocatable format, and the CCP runs one as a program at `0100h`."
- **After:** "A `.PRL` file is Digital Research's page relocatable format, which the CCP runs as a program at `0100h`."
- **Why:** The CCP runs a file, not a format.
- **Fix:** "A `.PRL` file is in Digital Research's page relocatable format, and the CCP runs it as a program at `0100h`."

### A10. Chapter 19, lines 168-170. Clause on the wrong subject

- **Before:** absent.
- **After:** "Writing through costs four card writes for each block of a new file, as Chapter 18 shows, so the volume written behind keeps its records in the cache and sends them to the card in batches."
- **Why:** The reason holds, but the cache does the keeping and the sending, not the volume. Line 19 has the right subject.
- **Fix:** "...as Chapter 18 shows, so the block cache keeps the records of the volume written behind and sends them to the card in batches."

### A11. Chapter 14, line 244. Pronoun

- **Before:** "`PZINIT` writes page zero's fixed parts at the end of cold boot and again at every warm boot"
- **After:** "A program is free to write over page zero, so `PZINIT` writes its fixed parts at every warm boot as well as at the end of cold boot"
- **Why:** "its" now follows `PZINIT` and reads as the routine's.
- **Fix:** "...so `PZINIT` writes page zero's fixed parts at every warm boot..."

### A12. Chapter 15, lines 260-261. Pronoun

- **Before:** "Serial output bypasses it: `BCONOUT` sends its bytes untouched and the terminal program on the PC interprets them."
- **After:** "On the serial terminal the terminal program on the PC interprets escape sequences, and `BCONOUT` sends its bytes untouched."
- **Why:** "its" had "serial output" behind it. Now it has no antecedent, or the wrong one.
- **Fix:** "...and `BCONOUT` sends every byte untouched."

### A13. Chapter 12, lines 120-121. Pronoun

- **Before:** "Before it assembles, the build writes three files"
- **After:** "The source needs settings that depend on the build, and a container layout it shares with the tools on the PC. So before it assembles, the build writes three files"
- **Why:** "it" in the first sentence is the source. The second "it" now reads the same way.
- **Fix:** "So before assembling, the build writes three files"

### A14. Chapter 21, line 236, and chapter 24, line 123. Style: *chooses*

- **Before:** 21: "The page is chosen from the size. The loader adds". 24: unchanged, moved.
- **After:** 21: "The loader chooses the page from the size. It adds". 24: "`I` or `Y` chooses the interactive tests".
- **Why:** STYLE.md lists *chooses* among the verbs a program doesn't take. The pass introduced it in 21 and moved it in 24.
- **Fix:** 21: "The loader works out the page from the size." 24: "`I` or `Y` selects the interactive tests".

## B. Noticed faults, with proposed fixes

### B1. Chapter 17, lines 38-39

- **Before and after:** "It also reads the BDOS's flags `HFLAG` and `WRFLAG` and the return code `PRGCODE`."
- **Why:** The CCP sets both flags (`src/cpm/ccp.asm:38-39`, `:72-73`). The BDOS reads them (`src/cpm/bdos.asm:334`, `:451`, `:481`). The CCP reads `PRGCODE` at `:114` and writes it at `:145` and `:338`.
- **Fix:** "It also sets the BDOS's flags `HFLAG` and `WRFLAG`, and it reads and sets the return code `PRGCODE` (`src/cpm/ccp.asm:38-39`, `src/cpm/ccp.asm:72-73`, `src/cpm/ccp.asm:114`, `src/cpm/ccp.asm:145`, `src/cpm/ccp.asm:338`)."

### B2. Chapter 18, lines 16-17

- **Before:** "...checks it. It then builds a drive table and a disk parameter header for each drive."
- **After:** "...checks it and then builds a drive table and a disk parameter header for each drive."
- **Why:** It reads as one table a drive. There is one `DRVTAB` of four entries.
- **Fix:** "...checks it and then builds the drive table and each drive's disk parameter header."

### B3. Chapter 14, lines 237-239

- **Before:** "...passes the test again while the card still holds those volumes. Only losing the RAM returns the card's own drives, and `docs/recovery.md` sets out these limits for the user."
- **After:** "...passes the test again while the card still holds those volumes, so only losing the RAM returns the card's own drives. `docs/recovery.md` sets out these limits for the user."
- **Why:** Lines 183-185 of the same chapter give other routes: a reset during cold boot or at the diagnostic prompt fails the test without losing the RAM. So does a card whose volumes no longer match. Chapter 18 lines 309-310 and `docs/recovery.md:117-121` both list these.
- **Fix:** "Once a recognised reset has applied a selection, the next reset passes the test and applies it again while the card still holds those volumes. On that card its own drives come back only after a power-off or a reset that fails the test, such as one pressed during cold boot. `docs/recovery.md` sets out these limits for the user."

### B4. Chapter 14, line 198

- **Before:** "The first reads and changes nothing in the drive table."
- **After:** "The first step reads and changes nothing in the drive table."
- **Why:** True of the table (`VSLOT` reads `DRVSLOT`, and the comparison is with `RSLBUF`). But "reads … nothing" stops the reader, since the next sentence reads the card and line 203 has a read that can fail.
- **Fix:** "The first step changes no drive. It walks the card's descriptors and compares each with every kept drive in `RSLBUF`, on the eight bytes a drive-table entry holds: the start, the length, the geometry and the flags."

### B5. Chapters 14 and 15: 9,372 and 9,217 T-states

- **Sites:** 14:98-99 ("at 9,372 T-states each through `CONOUT`"), 15:174-175 ("On the model a whole character takes 9,217 T-states"). Unchanged in substance by the pass.
- **Why:** Both figures are right, and they count different things. Counted from the instructions at 98c6416, with `console.asm` and `term.asm` unchanged at 62d47ed:
  - `TXBYTE`, entry to `RET`, is 9,217: 15, 7,492 for nine passes, 25, 1,675 and 10.
  - `BCONOUT` adds exactly 155 before it: `CONSEL` 65, `VTOWN` 45, then `RET NZ`, the two mode tests and `LD A,C`, 45.
- **Fix, chapter 15 only:** "On the model `TXBYTE` takes 9,217 T-states for a whole character, and `BCONOUT`'s tests before it bring that to 9,372, so the serial terminal shows about 430 characters a second." Chapter 14 stays. Its figure is the one this sentence ends on.

## C. Question two: the reader

| Chapter | Reason before mechanism | Staccato or tangled |
| --- | --- | --- |
| 12 | Yes, except "One image, four names" (C5) | No |
| 13 | Yes | The workspace blocks are a catalogue, which suits the material |
| 14 | Yes | No |
| 15 | Yes | One repetition (C7) |
| 16 | Yes | The function paragraphs are reference by nature |
| 17 | Yes, except one join (C4) | No, but see C1 |
| 18 | Yes | No |
| 19 | Yes | No |
| 20 | Yes in the loader, thin in the copy path (C2, C3) | C3 |
| 21 | Yes | No |
| 22 | Yes | One loose end (C6) |
| 23 | Yes | No |
| 24 | Yes | No |
| 25 | Yes | No |
| 26 | Yes | No |

### C1. Chapter 17, lines 55 and 67-73, against chapter 14, lines 323-326. Contradiction

- **Before and after:** Chapter 17: "The selection at the end can fail. If the drive in the byte has lost its volume, function 14 gives the `Select` error … the same drive is selected again and the error repeats … only the reset button … ends it". Chapter 14: "puts A: in place of a drive past D: or with no volume, because selecting such a drive would give a `Select` error and a warm boot back to the same place".
- **Why:** Each is true at its commit. 08da4d6 has the loop, and 62d47ed has `CCPDA` (`src/cpm/ccp.asm:29-44`). A reader going in order meets the fix in Chapter 14 and the fault three chapters later. This pass didn't cause it.
- **Fix:** Recheck the section against 62d47ed and move Chapter 17's commit line. That also changes its line references and needs a new capture of the transcript. Proposed text, with the output to be recaptured:

  > `CCPENT` sets its stack and keeps the drive in `BOOTDRV`, with A: in place of a drive past D: or with no volume (`src/cpm/ccp.asm:29-44`). Selecting such a drive would give the `Select` error, whose warm boot would come back to `CCPENT` with the same byte. Here `MOUNT`, from drive A, takes the volume off drive B while B is the current drive:

### C2. Chapter 20, line 28. Term before its explanation

- **Before:** "(`src/hwsvc.asm:55-56`, `src/hwsvc.asm:72-74`). `HWBASE` is 19 so that the numbers of the table's previous major version fail (`src/hwsvc.asm:27`)."
- **After:** "`HWBASE` is 19 so that the numbers of the table's previous major version fail (`src/hwsvc.asm:27`)."
- **Why:** The move puts the reason first, which is right, but this is the first use of `HWBASE` in the chapter.
- **Fix:** "The service numbers start at `HWBASE`, 19, so that the numbers of the table's previous major version fail (`src/hwsvc.asm:27`)."

### C3. Chapter 20, lines 173-180. Staccato, with the reason absent

- **Before and after:** "A count of 0 returns at once (…). `LD A,I` copies the interrupt enable to the flag `P/V`, and `DI` and `PUSH AF` keep it for the end (…). The two latch values are built in the alternate registers: `C'` is the port, and `D'` and `E'` are `LATCHV` with `LATEXP` set for each end in bank 1 (…). The old values of those registers go on the stack, so they are kept. Equal values mean one bank, and `MVLDIR` writes that latch, does an `LDIR` and goes to `MVEND` (…)."
- **Why:** A run of steps. Nothing says why interrupts go off or why the alternates are used, and both reasons are in the code (`src/xmove.asm:21-26`, `:43-46`).
- **Fix:** "A count of 0 returns at once (`src/xmove.asm:37-39`). Any other copy moves the latch with interrupts off, so `LD A,I` copies the interrupt enable to the flag `P/V`, and `DI` and `PUSH AF` keep it for the end (`src/xmove.asm:40-42`). `BC`, `DE` and `HL` hold the copy's own values, so the two latch values go in the alternate registers, whose old values are pushed first: `C'` is the port, and `D'` and `E'` are `LATCHV` with `LATEXP` set for each end in bank 1 (`src/xmove.asm:43-57`). Equal values mean one bank, and `MVLDIR` writes that latch, does an `LDIR` and goes to `MVEND` (`src/xmove.asm:58-61`, `src/xmove.asm:122-127`)."

### C4. Chapter 17, line 292. Reason joined but not stated

- **Before:** "At that page the file still has to end. `LOADLIM` reads one more record into `LOADBUF` to find out."
- **After:** "At that page the file still has to end, so `LOADLIM` reads one more record into `LOADBUF` to find out."
- **Why:** The `so` joins two sentences that needed the actual reason, which is at `src/cpm/ccp.asm:372-373`.
- **Fix:** "A file may end exactly at that page, so `LOADLIM` reads one more record, into `LOADBUF`, where it can't reach the resident CCP, to find out."

### C5. Chapter 12, lines 244-267. Reason at the end of the section

- **Before and after:** The section explains four names for one image, and only its last sentence says why: "The names are kept so that anything that reads a ROM by its profile's name still has a file to read."
- **Why:** The reader meets the mechanism, a table of identical lines and the hash first.
- **Fix:** Lines 245-247 become "The build keeps four profile names, `debug80`, `debug80t40`, `debug80g32` and `board`, so that anything that reads a ROM by its profile's name still has a file to read, and all four name that image (`tools/build.mjs:28-35`)." Delete the last sentence of the section. It then ends on the SHA-256.

### C6. Chapter 22, lines 72-74. Figure with no connection

- **Before:** The same sentences, with the two test citations after them.
- **After:** "Bit 6 is tested this one time. On the model, with the web page's board and the starter card, `STBOOT` starts 5,864,626 T-states after reset, about 1.47 seconds."
- **Why:** The move of the test sentences leaves the figure at the end of the paragraph with nothing saying why it matters.
- **Fix:** "Bit 6 is tested this one time, so the key has to be down when `STBOOT` starts, which on the model, with the web page's board and the starter card, is 5,864,626 T-states after reset, about 1.47 seconds."

### C7. Chapter 15, lines 222 and 234-235. Repetition from the move

- **Before:** "`CONIN` calls `KBSTEP` in a loop, a row at a time."
- **After:** Line 222, "The matrix keyboard is read one row at a time through port `FEh`." Line 234, "`KBSTEP` reads one row each time it is called". Line 235, "`CONIN` calls it in a loop, a row at a time".
- **Why:** Three statements of one fact in fourteen lines. The third fails the deletion test.
- **Fix:** Line 235: "`CONIN` calls it in a loop, and `CONST` calls `KBPOLL`, which runs the eight steps of one full scan".

## Counts

| Section | Findings |
| --- | --- |
| A. Relations, pronouns, subjects | 14 |
| of which faults against the code | 3 |
| B. Noticed faults, fixes proposed | 5 |
| C. Reader | 7 |
| of which contradiction between chapters | 1 |
| **Total** | **26** |

Named claims tested: 9. Held: 5. Failed: 3. Held in part: 1.
Lists collapsed: 0. Blank lines lost: 0. Citations moved off a claim: 0. Conditions dropped: 0.
