# Check of chapters 1 to 11, appendices F, G and H and the index at 78127ec

Read-only. The code is `git -C ~/projects/tec-os show 78127ec:PATH`. Runs were on a copy of `rev781`, `$S/rv14a-run/<chapter>`, under the memory guard (two jobs, peak 153 MB). Each chapter's cards were built by its own `sh` steps, from sources each confirmed equal to the chapter's fences. The outputs are `$S/rv14a-<chapter>.json` and `$S/rv14a-all.out`, and appendix F's tecvol run is in `$S/rv14a-f.sh`.

## Findings

### Facts changed by this landing

1. **04-cards-and-volumes.md:499-503.** "and the record went into the cache. The close's flush couldn't write the record's block". `SAVE 1` writes one page, which is two records: `src/cpm/ccpcmd.asm:172-176` and `SAVELOOP`, where each page is two `SAVE128` calls of function 21. Correction: "and its two records went into the cache. The close's flush couldn't write their block". The transcript itself reruns the same.

2. **05-startup-and-services.md:372-375.** "A card whose drive A is read-only, whose `STARTUP.CMD` has its read-only attribute set, or whose directory has no room ..." has an Oxford comma, which STYLE.md forbids. Correction: "... whose `STARTUP.CMD` has its read-only attribute set or whose directory has no room for a new `STARTUP.CMD` is left as it was when the file needs a change ...". The facts match `host/card.mjs:58-73` and `web/src/main.mjs:83-99`.

### Cross-references that chapter 1's rewrite has left untrue

The new chapter 1 has no `CON` run, no serial timing, no `GLCD.SVC` memory figure, no TPA, no `UNLOAD`, no diagnostic prompt, no `tecvol install`, no keypad advice and no RAM check. These passages in this batch still send the reader there for those things:

3. **02-console.md:59.** "as Chapter 1 showed" (`CON` with no argument). Correction: delete "as Chapter 1 showed". The capture at :112 shows it.
4. **02-console.md:219-220.** "That is why, as Chapter 1 says, the serial link works only with the CPU clock switch on FAST". Correction: "as Appendix G says", since appendix-g-tec-1g.md:66-68 says it.
5. **02-console.md:251-252.** "The driver takes 932 bytes from programs, as Chapter 1 explained." Correction: "as Chapter 5 shows". 05-startup-and-services.md:41-50 gives the 164 bytes below `B9A4h` plus the pages, and 164 + 768 = 932.
6. **03-command-line.md:124.** "the first `N` pages of the TPA (Chapter 1)". Correction: "(Chapter 7)". terms.md:14 also still says the TPA is introduced in Chapter 1. That file is not in this batch.
7. **03-command-line.md:399-400.** "as Chapter 1 explained for the graphics LCD's driver". Correction: delete the clause, or write "as Chapter 5 explains".
8. **04-cards-and-volumes.md:74-75.** "cold boot stops at the diagnostic prompt with the code of the check, as Chapter 1 showed". Correction: "as Chapter 23 shows".
9. **04-cards-and-volumes.md:449.** "`tecvol install`, which Chapter 1 used for the starter card". The new chapter 1 has no `tecvol`. Correction: "`tecvol install`, which Appendix F describes, writes any image to a card".
10. **04-cards-and-volumes.md:457-458.** "As Chapter 1 says, `install` overwrites the device from block 0". Correction: "As Appendix F says, ...".
11. **05-startup-and-services.md:408-409.** "with the diagnostic prompt of Chapter 1". Correction: "of Chapter 23".
12. **07-memory.md:269-271.** "so Chapter 1 says to keep off the keypad while a program runs". Correction: "so Appendix G says ..." (appendix-g-tec-1g.md, "The hex keypad and its NMI"), or delete the clause.
13. **appendix-g-tec-1g.md:130.** "Chapter 1 describes the check". Chapter 1 now says only that 64 KiB is needed. Correction: delete the clause, keeping "Chapter 13 describes what TEC-OS keeps in each half".

Outside this batch, the same fault is in 23-diagnostics.md:18 ("Chapter 1 shows the prompt from the user's side") and 25-host-model.md:333 ("Chapter 1 lists the page's controls").

Every link to a file and an anchor in this batch lands on a heading that exists. That includes 05:384-385 to `appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi`, and the only links into chapter 1 left in the book (appendix D:236-237, `#turning-it-on`).

### Chapter 1's facts at 78127ec

14. **01-introduction.md:112-123.** The capture comment has `--lcd`, but the fence holds only the serial text. The rerun ends with `--- LCD` / `TEC-OS 0.1  TEC-1G` / `Hello from SAMPLE` / `B: WORK`, so the fence differs from its run. Correction: drop `--lcd` from the comment, or add that output as a second fence marked as the same run's `--lcd` output, as 09:229-238 does.
15. **01-introduction.md:56.** "The same lines appear on the 20 × 4 LCD." The LCD's first row is `TEC-OS 0.1  TEC-1G` (`src/text.asm:53`, `LCDBAN`), not the serial banner (`src/text.asm:6`), and the LCD shows drives A and B only (appendix D:236-237). Correction: "The 20 × 4 LCD shows the name and the first two drives too."
16. **01-introduction.md:65-68.** "Otherwise it uses a terminal program on a PC". A board with the graphics LCD and the matrix keyboard gets its console on the GLCD from the startup file's `GLCD.SVC`, as :59-62 says. Correction: "Otherwise it uses the graphics LCD, if the board has one and the startup file loads its driver, or a terminal program on a PC ...". This is minor.

Everything else in chapter 1 holds:

- 47,268 bytes and `B9A4h`: `B9A4h - 0100h` = 47,268, and the TPA is unchanged at 78127ec.
- The 64 KiB as 32 KiB plus a 32 KiB chip in U9, and EXPAND 1 holding the cache and the history (appendix G:102, 122-125).
- `SAMPLE`'s three lines, LCD text, digits and tone (`programs/SAMPLE.ASM:43-78`, :128-136).
- The PICO9918 as the console with the matrix keyboard (`src/pico.asm:27-47`).
- Four drives, and `^C`'s flush.

The other four transcripts (:43, :79, :95, :134) rerun the same.

### Other

17. **03-command-line.md:518-520.** "An `ERA` that ends in `Bad Sector` leaves on the card the file whose entry couldn't be written". `FNDELETE` writes each entry on its own (`src/cpm/bdosfile.asm:279-293`). A file with several directory entries therefore loses the entries before the one that failed, and isn't left whole. Correction, if the case matters: "... leaves on the card the directory entry that couldn't be written, and the entries erased before it, of that file or others, stay erased." This is low priority.
18. **index.md:46-48.** "Each chapter names, at its top, the TEC-OS commit its claims were checked against." The line is now an HTML comment, so a reader of the site doesn't see it. That change is outside this check, but the sentence it leaves untrue is in index.md. Correction: "Each chapter's source names, under its title, ...", or show the line again.
19. **10-writing-services.md:388-389.** "A find or a list walks 256 records at most, so one service may publish at most 255". The per-service 255 doesn't follow from the walk. It is the loader's own limit, `B = 0` with one or no record in (`src/loader.asm:250-267`). Correction: "One service may publish at most 255 records, and since a find or a list walks 256 at most, a service whose records would take the registry past 256 is refused." This is low priority.

The code confirms the rest of the changed claims:

- **03:516-518** (warm boot retries, `Write lost`): `src/cache.asm:182-209`, :389-396.
- **04:284-286** (a mount onto the current drive is read at once): `VMNTRS` at `src/vol.asm:679-691`, and `FNSEL`/`SELDRV` logging in at `src/cpm/bdosfile.asm:77-110`.
- **04:388-400** (`CFLUSH` keeps a failed data line, `CWB3` drops the directory line, `CFLALL` drops): `src/cache.asm:182-209`, :378-386.
- **09:162-164** (functions 27 and 31 after a mount onto the default drive): `VMNTRS` and `SETDEF`.
- **10:388-392**: the arithmetic of `SVCNT`/`SVCNE` gives 256 − N more for N ≥ 1 and 255 with none. A refusal goes `SVCRF`, then `REMOVE`, then `SVCRC` 1, and the CCP's `BADCMD` prints `NAME?` (`src/cpm/ccp.asm:288-297`).
- **F:113-116** (info and verify stop on a doubly allocated block or a block past DSM, the known behaviour): `usedBlocks` at `tools/lib/cpmfs.mjs:78-89`, reached from `freeBytes` inside the volume line at `tools/tecvol.mjs:124-127`.
- **F:176-181, 225-231, 244-248**: `tools/lib/cpmfs.mjs:180-206`, :133-146, :140, :157-169.

The timings in 04:352-355 and 04:380-382 still hold by arithmetic. KE-AR7's `CWBK` adds about 55 T-states to each record that keeps a line's bytes, about 2 ms over `SAVE 64`'s 128 records. That is below the 0.01 s shown. The read timings don't cross the changed code.

## Per file

- **01-introduction.md:** facts checked against code and runs. 0 citations. 5 transcripts rerun, 4 the same and 1 differing (finding 14). 4 places checked against other chapters.
- **02-console.md:** only the Checked against comment changed. 11 transcripts rerun (long.img built), all the same. 3 stale cross-references (3 to 5).
- **03-command-line.md:** 1 changed passage checked against `cache.asm` and `bdosfile.asm`. 13 transcripts rerun (errs.img built), all the same. 2 stale cross-references (6, 7) and finding 17.
- **04-cards-and-volumes.md:** 2 changed passages and the new `nodata.img` transcript checked. 7 transcripts rerun, including the new one, all the same. 2 unchanged citations read and correct. Findings 1 and 8 to 10.
- **05-startup-and-services.md:** 1 changed passage checked against `card.mjs` and `main.mjs`. 15 transcripts rerun, all the same. The retargeted link resolves. Findings 2 and 11.
- **06-first-program.md:** comment only. 3 transcripts rerun. 2 the same, and 1 differs only because this setup put every file on the card before the run. The chapter's order gives the fence. 0 citations.
- **07-memory.md:** comment only. 3 transcripts rerun, all the same. 2 unchanged citations (`src/boot.asm:20-22`, :92-108) correct. Finding 12.
- **08-programs-and-console.md:** comment only. 4 transcripts rerun, all the same. 0 citations.
- **09-hardware-services.md:** 1 changed sentence checked against `vol.asm` and `bdosfile.asm`. 9 transcripts rerun. 7 the same, and 2 differ only in their `--lcd`/`--screen` output, which sits in the chapter's following fence as the same run's output. Stack figures unchanged (`docs/rom-services.md:143-158`). 0 citations.
- **10-writing-services.md:** 1 changed passage checked against `loader.asm` and `ccp.asm`. 2 transcripts rerun. 1 the same, and 1 split across two fences whose joined text matches. Figures 47,268, 46,848 and 420 confirmed. Finding 19.
- **11-chaining-commands.md:** comment only. 7 transcripts rerun (chain.img built), all the same.
- **appendix-f-tecvol.md:** 42 citations, of which 30 were changed. Every changed one was read at 78127ec and lands on the claimed lines, and the 12 unchanged ones (container, recipe, media, package.json) are correct. Every tecvol transcript was rerun: info, verify, dir, put, the read-only volume, `--user 1.5`, get, era, the new read-only `put`/`era`/`--force` sequence and recipe. All give the fences' text and exit statuses, and the image's SHA-256 is unchanged across the two refusals. The 1 capture reruns the same. No findings.
- **appendix-g-tec-1g.md:** comment only. All 50 unchanged citations read at 78127ec and correct. Finding 13.
- **appendix-h-service-file-format.md:** 21 citations. The 2 changed ones (`src/loader.asm:412-429` for `SVCEXT`/`SVCIN`, and `test/svc.test.mjs:376-378`) are correct, and the 19 unchanged ones are correct. Its two `xxd` commands were not rerun, because `GLCD.SVC` is unchanged at 78127ec.
- **index.md:** chapter 1's new description agrees with the new chapter. Finding 18.

## Resolved

Findings 1 to 19 were applied in cbf60ac, except the matching line of `editorial/terms.md`, which the style pass holds. The pointers outside this batch, at 23-diagnostics.md:18 and 25-host-model.md:333, were corrected in the same commit.
