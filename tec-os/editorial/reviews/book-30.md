# Check of the TEC-OS book at 1f9542d (changes since 471086f)

Book: `~/projects/debug80-docs-tec-os/tec-os/`, branch `tec-os-book`, at e264c9e.
Every file `git diff --stat 471086f HEAD -- tec-os/` lists was read by its diff.

Product: a copy of `$S/rev1f9` at `$S/rv13`. Every tracked file matches
`git show 1f9542d:` byte for byte. ROM SHA-256 `704dcc07…1754`, starter image
`4eb807c1…d786d`. `dist/files/TED.COM` is the same file as `$S/TED-04ec086.COM`
(`d42b6d2a…7344`). Every card was made fresh from `$S/rv13/dist/starter.img`. The
60e0768 build is `$S/rev36a`, checked the same way against `git show 60e0768:`. Both
copies link the same `node_modules`, with debug80-runtime 0.3.3. Scripts and
outputs are in `$S/rv13w`. Four capture and measurement batches ran under
mem-guard, none nested, with a peak of 222 MB.

## Findings

1. **`21-startup.md:297-298`: "`test/pico.test.mjs:563` and `:571` check it for
   both words."** The first number was carried and the second wasn't. At 60e0768
   the two tests start at 562 and 571. At 1f9542d they start at 563 and 572, and
   line 571 is blank (`git show 1f9542d:test/pico.test.mjs`, lines 563 and 572).
   Correction: "`:572`".

2. **`01-introduction.md:168-170` and `05-startup-and-services.md:348-350`: "A card
   whose drive A is read-only or whose directory is full is therefore left as it
   was and boots as it is."** For a full directory this holds only when the page
   has to make a new directory entry. Run (`$S/rv13w/prep.mjs`, `prepareCard` from
   `host/card.mjs`):
   - Starter card, drive A filled to `directory full` (249 more files), PICO9918 at
     40 or 80 columns: `changed=true`. `STARTUP.CMD` was rewritten to `PICO.SVC`
     alone and `PICO.SVC` was replaced.
   - Same card with `PICO.SVC` erased first, then filled: the PICO9918 gives
     `This card couldn't be prepared for the page (directory full), so it boots
     as it is.` and the card is unchanged. With GLCD chosen, `STARTUP.CMD` is still
     rewritten (`changed=true`).

   A rewrite of a file the card already has needs no new entry, so the card is
   changed. Chapters 21:326-328 and 25:343-344 say it correctly: "a change it
   can't make, to a read-only drive A or in a full directory". Smallest correction,
   in both chapters: "A card whose drive A is read-only, or whose directory has no
   room for a file the page must add, …".

3. **`25-host-model.md:282` and `25-host-model.md:350`: "the line under the board
   says `Card not saved in this browser`" and "the line under the board says
   `Not copied`".** Both messages go to `#cardinfo` (`web/src/main.mjs:114`,
   `:587`), and that line is in the "SD card" section, after the serial console
   (`web/index.html:68-75`). It is not under the board (`web/index.html:53-61`).
   Chapter 1 puts both messages under the heading "SD card"
   (`01-introduction.md:136`, `:155`). In Chapter 25 itself, line 294 uses "under
   the board" for the latch line, which is in the board's section. Correction: "the
   line under the heading "SD card"" at both places.

4. **`21-startup.md:366-368`: "so the starter card's `STARTUP.CMD` loses its
   `GLCD.SVC` line and holds `PICO.SVC` alone".** This is true only with the
   PICO9918 chosen. With the GLCD chosen, the same run leaves `"GLCD.SVC\r\n"`
   (`prep.mjs`, "starter glcd"). The sentence is about any card that passes
   `cardProblem`. Correction: "and holds the chosen display's line alone".

5. **`12-rom-and-build.md:182`: "It also copies `programs/SAMPLE.ASM` to the
   card …".** The new sentence sits between two sentences whose "it" is the
   module `tools/lib/assemble.mjs`. Its own "It" has to mean `npm run media`, and
   the next sentence has to name "the module" to recover. Correction: "`npm run
   media` also copies …".

6. **`12-rom-and-build.md:246` and `:257`: the build line `tecos: ROM 14712/16384
   bytes, TPA $0100-$B814 (46869 bytes), sha256 704dcc07cf70fead` and the media line
   `dist: 1 ROM profiles, 7 starter files, starter.img`.** No run produced these
   lines. STYLE.md ("Examples are real") requires one.
   - The build line matches the format string at `tools/build.mjs:324-328`, filled
     from `dist/tecos.census.json`: used 14712, TPA end 47125 (`B815h`), 46869
     bytes, SHA-256 `704dcc07cf70fead…`.
   - The media line matches `tools/media.mjs:254` with 7 entries in `files`, the
     seven files of the starter card's `dir`.

   The content is right. Correction: replace both lines with a capture when a
   build may be run.

7. **STYLE.md's verbs ("People act; programs operate"), in new sentences only:**
   - `01-introduction.md:133-134`: "When the browser refuses a save". Use "When a
     save to the browser's storage fails".
   - `01-introduction.md:136`: "It tries the save again". Use "It saves again".
   - `25-host-model.md:282`: "the next tick tries the save again". Use "the next
     tick saves again".
   - `13-memory-map.md:88-89`: "A program that the CCP found on A: by its search
     sees 1". Use "… finds 1 there".
   - `18-sd-card-and-volumes.md:162`: "refused by `LBAARG`". Use "rejected by
     `LBAARG`".
   - `appendix-d-error-messages.md:66`: "refused before any command". Use
     "rejected before any command".
   - `appendix-d-error-messages.md:176`: "the driver refuses a block". Use "the
     driver rejects a block".
   - `appendix-g-tec-1g.md:177`: "It refuses such a block". Use "It rejects such a
     block".
   - `25-host-model.md:74`: "the ROM's refusal of a block". Use "the ROM's
     rejection of a block".

No other finding. No passage names a BDOS function 44, 45, 46, 48 or 99, or a
user number in the prompt. Function 47, which the book describes, is in the code
(`src/cpm/bdos.asm:46`). No `984K`, `six files`, `6 file(s)`, `1007616`, old ROM
hash or old `TED` pin is left in a chapter or in `terms.md`. Each ROM address of
`C000h` or above in the book was compared with both symbol maps. None is the old
address of a label that moved.

## Runs and measurements

- **Changed transcripts.** All 14 changed capture fences were rerun, and each is
  contained in the run's output. They are:
  - 1:357 (DIR), 1:428 (TAS SAMPLE, SAMPLE, with the LCD);
  - 3:31, 3:539;
  - 4:451 (`short.img`, cut to 2104320 bytes);
  - 11:32, 11:93;
  - 16:162, 16:179;
  - 18:173 (`build/short.img`, cut to 2105344 bytes);
  - 22:56, 22:72, 22:161;
  - 24:98 (`start.img`, made by the chapter's commands), identical.

  Every capture in the book with the starter card, 54 in all, was also rerun. 52
  match. The other two, 1:309 and 25:150, differ only by the fence's final blank
  line, which the comparison trimmed.
- **`SAMPLE.ASM`.** On a new starter card, `TAS SAMPLE` gives `SAMPLE.COM written`,
  and `SAMPLE` gives the chapter's three lines. The LCD's second row is
  `Hello from SAMPLE`. A `DIR` after the run gives 9 files and 974K free, and
  lists `SAMPLE.DBG` and `SAMPLE.COM`. Screen sizes: `Screen: 80 by 24` on the pico
  board, `21 by 8` on the GLCD board and `0 by 0` on serial. From the source: 200
  `DIGIT` calls at 20,670 T-states are about 1.03 s, and the beep is 400 × (16 × 60 +
  51) + 222 = 404,622 T-states.
- **`0050h`.** An 11-byte program printing `(0050h)` + `0` was put on A: as
  `LDRA.COM` and on B: as `LDRV.COM`. Results:
  - At `A>`: `B:LDRV` 2, `LDRA` 0, `A:LDRA` 1.
  - At `B>`: `LDRA` 1 (the search), `A:LDRA` 1, `LDRV` 0, `B:LDRV` 2.

  `PZINIT` (`src/boot.asm:190-246`) writes no byte at `0050h`.
- **Chapter 6's `TED` round** was driven by matrix keys as `keys()` in
  `test/ted.test.mjs` at 1f9542d drives them, on the pico board, with `work.img`
  made by the chapter's commands (`hello.com` 33 bytes, `show.com` 72 bytes, by
  ATOM 0.3.7). Results:
  - All four fences match: the failed build, the screen with 14 blank rows, the
    `^T R` round with `Press a key`, and the DIR with 6 files and 8152K free.
  - The status row reads `L7 C2` after Right and `*  L7 C1` after `^H`, and
    `L7 C1` after the key.
  - Word `2551h` is 31,510. There are no violations.
  - `THOR.PRJ` is `MAIN   HELLO.ASM ; learned from TAS`.
- **Timings** were measured by `$S/rv13w/measure.mjs`, which hooks `Machine.step`
  to time calls from entry to return and to mark the first entry of a label. The
  same script on the 60e0768 build gave every old figure exactly.

  | Figure | 60e0768 | 1f9542d |
  | --- | --- | --- |
  | cold boot to `CCPENT` | 1,285,388 | 1,285,395 |
  | block 0 `SDREAD` | 219,137 | 219,144 |
  | `BCONIN` at the first prompt, its only call | 8,835,792 | 8,838,350 |
  | warm boot after `SAVE 8 X.COM` | 112,303 | 114,737 |
  | function 13 | 1,029,045 | 1,031,428 |
  | function 14 for B: | 9,166,178 | 9,166,402 |
  | `STBOOT` on the page's board | 5,861,134 | 5,863,636 |
  | close of 4 blocks on B: | 1,111,269 | 1,111,319 |
  | `CWRITE` | 217,411 | 217,421 |
  | `SDWRITE` | 216,154 | 216,164 |
  | `READ DATA.BIN`, first run | 6,633,371 | 6,633,572 |
  | `READ DATA.BIN`, second run | 1,335,042 | 1,335,075 |
  | `SAVE 64` on `THROUGH` | 30,829,837 | 30,831,158 |
  | `SAVE 64` on `BEHIND` | 9,909,704 | 9,910,058 |
  | low miss (`MOUNT`'s load) | 226,438 | 226,445 |

  These hold on both builds: warm boot 31,933, `CPMINIT` 7,427, `CWBOOT` 8,002,
  CCP 14,058, `MEMINIT` 346,677, hit 13,635, `CLOOK` 259, and `DIR` on A: with two
  hits.

  **The high miss of 235,335 is now measured.** The first `DIR B:` after boot
  makes 32 `BREAD` misses to `DIRBUF`. On 1f9542d, 9 of them take 235,335, the
  old figure's group, which is 235,328 on 60e0768; the others take 235,356 or
  235,357. The book's figure is therefore a measurement. The seconds and ratios
  derived from these figures (0.32 s, 1.66 s, 0.33 s, 7.71 s, 2.48 s, 1.47 s and
  6.5 million) all hold.
- **Defect passages:**
  - **Short card.** On an image cut to 4,110 or 4,112 blocks, the failing read is
    `SDLBA` 100Eh or 1010h, the 15th or 17th directory block of `WORK`. `SDERR` is
    5, `DIR A:*.CMD` still works, and no byte changed.
  - **Standard card.** On a standard-capacity card (`highCapacity: false`) with
    B: moved to 800800h, `SAVE 1 B:X.COM` and `DIR B:` give
    `Bdos Err On B: Bad Sector`. `SDERR` is 9, no `SDCMD` runs for the access, 0
    bytes changed and there are no violations.
  - **The page's preparation**, by `prepareCard` (`prep.mjs`):
    - With drivers null, the card is unchanged.
    - A read-only A: (built by recipe) gives `… couldn't be prepared … (volume is
      read-only), so it boots as it is.` and the card is unchanged.
    - A `PICO.SVC` in user 1 only is no longer read: user 0 gets the driver.
    - A full directory: see finding 2.
    - A bad SHA-256 gives `The PICO9918's drivers couldn't be fetched (…), so the
      card is left as it is.`
  - **The save path.** `web/src/store.mjs` was run against a failing
    `indexedDB` stand-in. `saveCard` throws on an error and on an abort, and warns
    once in the session. The page's handling was read: `save()` at
    `web/src/main.mjs:103-117`, the 2-second timer at `:97-101`, `refreshCard` at
    `:491-496`, and "Copy file to drive" at `:564-594`, which saves before
    `state.card.set`.
  - **`tecvol --user`.** `oops`, `1.5`, `16`, `-1`, `""` and `015` each give
    `tecvol: --user "…": a user number 0 to 15` and the usage line, with exit
    status 2, and the image is unchanged. `07`, `15` and `00` are accepted. A
    missing image with `--user 1.5` gives the same exit 2, so the check is made
    before the image is opened.
- **`tecvol`:** `info` gives `7 file(s), 1001472 bytes free`. `dir` matches
  Appendix F with `SAMPLE.ASM 4480`. A rebuild by `recipe` gives `4eb807c1…` for
  both images.

## Per file

- `01-introduction.md`: save, Copy and preparation prose against `web/src/` and
  `host/card.mjs`; seven files; DIR and SAMPLE runs; LCD; nine files.
  Findings 2 and 7.
- `02-console.md`: the `STARTUP.CMD` sentence.
- `03-command-line.md`: 978K transcripts rerun; `0050h` sentences by run.
- `04-cards-and-volumes.md`:
  - `tecvol info`, `--user` by run;
  - `short.img` truncation, 14 blocks into `WORK`, and its capture;
  - the standard-card paragraph by run;
  - `main.mjs:545` (`parseContainer` in `useCard`);
  - recovery prose against `docs/recovery.md` and the cache.
- `05-startup-and-services.md`: preparation paragraph by run, and `STBOOT`
  reading from user 0. Finding 2.
- `06-first-program.md`: `0050h` paragraph by run; `SAMPLE.ASM` paragraph against
  the source; the `TED` round rerun.
- `07-memory.md`: `0050h` row.
- `08`–`11`: checked lines; chapter 11's 978K transcripts rerun.
- `12-rom-and-build.md`:
  - ROM table against the census;
  - `media.mjs` lines 202-209, 231-232, 235 and 248;
  - the CR LF and `^Z` conversion; the counts 49, 105, 50, 70 and 77; 1,448 and
    `B958h`.

  Findings 5 and 6.
- `13-memory-map.md`: `0050h` row and paragraph, `PZINIT`, `layout.asm:29-30`,
  `ccp.asm:296-304`. Finding 7.
- `14-reset-and-boot.md`: every timing measured; the recovery clause.
- `15-bios-and-console.md`: moved citations only.
- `16-bdos.md`: BDOS span `E108h`–`F00Eh` = 3,847 from the map; 978K transcripts
  rerun.
- `17-ccp.md`: CCP span `D7A3h`–`E107h` = 2,405; `0050h` paragraph by run and
  `ccp.asm:286-304` (the `INC (HL)` at 293).
- `18-sd-card-and-volumes.md`:
  - `LBAARG` against `sd.asm:207-231`, the bound by `sd-range.test.mjs`'s logic
    and by run, and error 9;
  - `SDREAD`/`SDWRITE` timings measured;
  - the short-card capture, with error 5 and the 17th block by run;
  - every `sd.asm` citation.

  Finding 7.
- `19-block-cache.md`: every timing measured, the high miss included; the
  rolled-back sentence.
- `20-hardware-services-and-service-loader.md`: moved citations only.
- `21-startup.md`: `STBOOT` timing; the preparation rewrite against
  `host/card.mjs` by run; every citation, compared with the 60e0768 text. Findings
  1 and 4.
- `22-command-history.md`: 978K transcripts rerun.
- `23-diagnostics.md`: checked line; `diag/` is unchanged and has its own
  `sd.asm`.
- `24-chaining-inside.md`: `start.img` capture rerun; the `0050h` sentence.
- `25-host-model.md`:
  - runtime 0.3.3 against `package.json` and `sd-spi.js`; 45 test files;
  - playwright `package.json:27`, `README.md:36`, `deps.test.mjs`;
  - the save, preparation and Copy prose with their citations.

  Findings 3 and 7.
- `appendix-a`, `appendix-b`, `appendix-e`, `appendix-h`: checked lines and moved
  citations only.
- `appendix-c-memory-map.md`: ROM table, the CCP and BDOS spans, the hash, the
  `0050h` row and sentence. The EXPAND 1 cold-boot statement is unchanged.
- `appendix-d-error-messages.md`: codes `05h`–`09h` against `sd.asm:14-18`; the
  new `Bad Sector` row by run; `SDERR` is still read by nothing in the ROM.
  Finding 7.
- `appendix-f-tecvol.md`: the `--user` rule against `tecvol.mjs:39-43` and by run;
  the `1.5` example; the `dir` listing; the recipe hashes.
- `appendix-g-tec-1g.md`: the standard-capacity sentence against `sd.asm:207-236`.
  Finding 7.
- `editorial/terms.md`: the starter card's seven files and the `SAMPLE.ASM` row,
  against the `dir` listing and Chapter 1.
