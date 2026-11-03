# Check 10-A: chapters 1-11, 14, 19, 21, 25 and Appendix F at 626ee41

Read-only. Book at `tec-os-book` 94ccfc1, diffs against 54c552d. Code read with
`git -C ~/projects/tec-os show 626ee41:PATH`. Runs used a copy of `$S/rev626` (and
of `$S/rev793` for the deltas) in `$S/rv10a`, under mem-guard (peak 156 MB).

No finding contradicts the code. Four findings are minor: three about what the
text leaves out, one about wording.

## Findings

1. **25-host-model.md:289-295, and 01-introduction.md:143-146: saving stays off for
   every card, not only the starter.** Chapter 25 says "On the starter card that
   runs after a stored record couldn't be read, no save stores anything". Chapter 1
   says the page "runs a starter card that it doesn't save". But `state.noSave` is
   set once at `web/src/main.mjs:698` and nothing clears it. `save` returns at
   `main.mjs:125` and `importSave` at `main.mjs:161` for every card. That includes
   a card from "New starter card" or "Open image" (`useCard`, `main.mjs:599-609`,
   which calls `save` and then `refreshCard`, so the message stays,
   `main.mjs:551-552`). A reader could take opening an image to start saving again.
   Smallest correction, chapter 25: "From then until a reload, no save stores
   anything, the timer's, a copy's and a new or opened card's included, ...".
   Chapter 1: "...runs a starter card, and until a reload it saves no card, one
   opened or made new included, and the line under ...".

2. **01-introduction.md:143-144 (and 25-host-model.md:270-275): the trigger is
   wider than a stored card.** `loadCard` throws on any failure, the opening of
   the database included (`web/src/store.mjs:25-40`, the `open()` at 28). So a
   browser whose IndexedDB can't be opened at all gets the unsaved starter card
   and the message "The saved card couldn't be read", even with no card stored.
   Chapter 25's code-level wording ("throws on a failed read") is accurate.
   Chapter 1's "When the card the page stored can't be read" is narrower than the
   code. Smallest correction, chapter 1: "When the page can't read its stored
   card, or can't open the browser's storage at all, ...". This is optional.

3. **21-startup.md:321-324: `powerOn` and `powerOnNow`, and one awkward phrase.**
   "`powerOn` runs the preparation in its turn, one at a time with a copy of
   files onto the card" reads poorly ("one at a time with"). The next sentence's
   "it fetches the page's recipe" (`main.mjs:82-87`) is in `powerOnNow`, which
   `powerOn` queues through `serial` (`main.mjs:72-80`). The citations are right.
   Smallest correction: "`powerOn` queues the preparation, `powerOnNow`, to take
   its turn with any copy of files onto the card, as Chapter 25 describes
   (`web/src/main.mjs:67-80`). At each power-on with the PICO9918, `powerOnNow`
   fetches ...".

4. **25-host-model.md:229-232 and 01-introduction.md:112-114: the order of the
   lookup.** The text reads "from its environment variable, or else from its
   default path ..., or else from `.inputs/`". When the variable is set, it is
   the only path tried (`tools/lib/pins.mjs:13-16`: `if (env) return
   [resolve(env)]`). "Or else" could be read as falling back when the named file
   is missing. This is optional. The smallest correction: "from the path in its
   environment variable when that is set, and otherwise from its default path
   ..., or else from `.inputs/`".

## Verified, no finding

- **Web page (KE-163, 164, 165, 168, 170).**
  - Chapter 25's account of the import's save is correct: it waits for a save
    under way and saves under the same guard (`main.mjs:155-172`, 643).
  - The timer is held off by `importBusy` (`main.mjs:113`). `useCard` is refused
    during an import (`main.mjs:600-603`).
  - Start-up: a load failure or a parse failure gives `noSave`, the starter card
    is built and nothing is stored (`main.mjs:690-704`). The quoted message
    matches `main.mjs:552` word for word.
  - `holds` checks the whole file, zeros to the end of the last record included
    (`host/card.mjs:48-52`). This matches chapters 1, 5, 21 and 25.
  - Width (KE-168): the preparation and the import share one `serial` chain
    (`main.mjs:71-80`, 637). In either order, the later width is written into
    `state.card`, and the timer then stores it, so "the card in the machine and
    the stored card both keep" it holds.
  - `npm run inputs`, `README.md:34-41` and `test/inputs.json` match chapters 1
    and 25. There are 49 `*.test.mjs` files at 626ee41, as chapter 25 says.
- **Written-behind loss (19-block-cache.md:275-280, 04-cards-and-volumes.md:
  357-390 and 496-502).** These agree with `src/cache.asm:195-229`. `CTAKE` scans
  from `CNEXT` for a clean line, and with every line dirty it calls `CWRITE` on
  the line at `CNEXT` before it hands it out (`cache.asm:212-220`). So some
  changes can be on the card before the directory write, and a reset leaves a
  mix. Chapter 4's "A block TEC-OS has already written to make room in a full
  cache is on the card" already said this. The chapters agree with each other
  and with `docs/recovery.md` at 626ee41.
- **Timings, rerun.**
  - Chapter 14, cold boot to `CCPENT` on the serial board (`glcd: false`),
    starter card: 1,286,306. The first `BCONIN` with `STPOS` at or above 80h:
    8,844,627. Both are exact.
  - Chapter 21, first `STBOOT` on the page's board (`tms`, `matrix`): 5,864,547,
    exact.
  - On 7935507 the same script gives 1,285,483, 8,838,438 and 5,863,724, the old
    figures.
  - Chapter 19, on `time.img` built by the chapter's commands (`READ.COM` 24
    bytes). The script's start point differs from the book's by a constant
    8,860, so the deltas were checked instead:
    - READ first: +2,141 (book +2,141)
    - READ second: +2,141 (book +2,141)
    - SAVE 64 on `THROUGH`: +2,165 (book +2,165)
    - SAVE 64 on `BEHIND`: +2,165 (book +2,165)
- **Changed citations checked at 626ee41.** The shifted cites cover the same code
  as before:
  - `bios.asm:325, 180-185, 128-165, 299, 292-298, 278-282, 303-308, 310-317,
    318-327, 182-185, 196-200`
  - `boot.asm:440-441, 425-426`
  - `vol.asm:199-213, 376-465, 387-389, 338-342` (inside `MNFILL`, which
    survives at 327), `584-596, 587-596`
  - `text.asm:76, 71-73`
  - `tables.asm:88` (`STFCB`)
  - `console.asm:309-313`
  - `cache.asm:212-220`
  - `ccp.asm:1571-1574` up to `1672-1673` (all 25 in chapter 21), `1072-1074`
    (`CPSRC`), `1531-1533, 225-227, 143-148, 266, 1138, 292-293, 291-294,
    257-267, 273-285, 349-375, 264-265, 1119-1122, 1120-1122`
  - `main.mjs:604, 67-80, 82-87, 67-105, 98-100, 112-116, 124-130, 160-172, 125,
    161, 551-552, 118-153, 546-555, 180-196, 228-239, 197-201, 92-101, 394-433,
    435-530, 364-392, 575-588, 660-672, 103-104, 623-655, 690-704`
  - `store.mjs:6-8, 19-23, 25-40, 42-59`
  - `card.mjs:48-52, 61-63, 64-70, 71-72, 76-91, 92, 102-116, 118-159, 124-145,
    147-159, 61-74, 61-93, 80-90`
  - `pins.mjs:12-23`, `README.md:34-41`, `pico.test.mjs:846-858`
- **Unchanged citations sampled (over 40).** All are in code the diff didn't
  touch or move:
  - `boot.asm:5, 17-19, 17-20, 20-70, 34-38, 48-50, 53, 67-70, 75-89, 90-92,
    146-148, 150-158, 283-309, 286-288, 294-299, 311-320`
  - `ccp.asm:14, 29-66, 44, 54-60, 61, 68-74, 74-89, 80-84, 93-103`
  - `console.asm:212, 248` (still `EI`)
  - `lcd.asm:36-39, 41-43, 45-66`
  - `text.asm:10`
  - `card.mjs:12, 15-21`
- **Labels.** None of `PUTNIB`, `CPNIB`, `MNSUM`, `SHVL` or the `...KEY` words is
  named in these files. `CPSRC` (chapter 21) is current.
- **Unchanged statements.** No statement in these files describes what
  `PUTCHAR` keeps, how `SHOWVOL` builds its lines or how the CCP matches its
  command words. The stored-card statements are covered in findings 1 and 2.
- **Addresses.** `C003h`, `C006h`, `C007h`, `C008h` and `C00Bh` match
  `ABITAB`/`ABIMAJ`/`ABIMIN`/`ABICALL`/`ABIEND` in `dist/tecos.d8.json`.
  `C000h`, `C7FFh` and `FFFFh` are fixed bounds.
- **Style of the changed sentences.** No Oxford comma, semicolon or em dash
  appears outside the quoted page message.

## Per file

- 01-introduction.md: inputs, saving, width and `PICO.SVC` against
  `main.mjs`/`store.mjs`/`card.mjs`/`pins.mjs`. No citations. Findings 1, 2
  and 4.
- 02, 03, 06-11, appendix-f: the header line only. No changed claims. Chapter
  7's 2 boot cites were checked.
- 04-cards-and-volumes.md: 2 changed citations checked. The written-behind
  passages were checked against `cache.asm`.
- 05-startup-and-services.md: the `PICO.SVC` match was checked against
  `card.mjs:48-52`. No citations.
- 14-reset-and-boot.md: 6 changed citations and 2 timings (both rerun, exact),
  plus 40 unchanged citations sampled.
- 19-block-cache.md: 17 changed citations, the new `CTAKE` sentence, and 4
  timings (deltas rerun, all exact).
- 21-startup.md: 46 changed citations and 1 timing (rerun, exact). Finding 3.
- 25-host-model.md: 40 changed citations and the test count. Findings 1, 2
  and 4.

## Resolved

All four findings were applied in ca7277e: chapters 1 and 25 say no card is saved until a reload, a new or opened one included, and chapter 1 names storage that can't be opened; chapter 21 names `powerOnNow`; chapters 1 and 25 say the environment variable, when set, is the only path tried.
