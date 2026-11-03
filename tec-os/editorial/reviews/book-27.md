# Check of tec-os/index.md and chapters 1 to 11 at 60e0768

Book at debug80-docs-tec-os 51ea0e9 (branch `tec-os-book`), against 4445919.
The runs used a copy of `$S/rev36a` in `$S/rx10`. Every card was made fresh from
that copy's `dist/starter.img` by following the chapters' `sh` blocks in order,
and the programs were taken from the chapters' `asm` blocks. `dist/files/TED.COM`
matches `$S/TED-676075a.COM` (SHA-256 `373d866b…`), and `TAS.COM` matches the
`dbee66a` pin.

## Findings

1. **09-hardware-services.md:830.** The claim: "BDOS function 2 | 3,906". This
   is the figure for one character in the middle of a row on the PICO9918 at
   80 columns, which was 3,922 at 19ad916.
   Evidence: the same program (70 calls of function 2 from column 0, each
   timed from `0005h` to its return) was run on both ROMs. At 19ad916
   (`$S/rev19a`, `tecos-debug80.rom`) a call takes 3,906 or 3,940 T-states,
   and 3,921 once. At 60e0768 the same cells take 3,892 or 3,926, and 3,907
   once. Every cell is exactly 14 T-states faster, so the book's own method
   turns 3,922 into 3,908, not 3,906. The other rows check: BIOS `CONOUT` is
   786 on both ROMs, and `PUTAT` with 60 characters in one call takes 29,702
   T-states, 495 a character.
   Correction: 3,906 → 3,908.

2. **07-memory.md:258–260** (whole-chapter check). The claim: "A program that
   enables them keeps them on, except while TEC-OS reads or writes a card
   block, when TEC-OS holds them off and then restores them."
   Evidence: TEC-OS also holds interrupts off for each serial byte
   (`src/console.asm:195–197`, `RXBITS`, and `:227–229`, `TXBYTE`, then
   `RET PO`/`EI` at `:211–212` and `:247–248`) and for each access to the
   history ring (`src/history.asm:25–26`, restored at `:38–39`).
   Correction: "…except while TEC-OS reads or writes a card block, sends or
   receives a serial byte or reads the command history, when it holds them off
   and then restores them."

3. **index.md:167.** There is a blank line between items 20 and 21 of the
   Part II list. It is left over from deleting item 21, and it makes the list
   loose, so every item of the list renders as its own paragraph.
   Correction: delete the blank line.

No other finding. Every changed claim, transcript, figure and link in these
files checks against the code and the runs.

## Runs and checks

- **Transcripts.** All 83 `capture.mjs` comments in chapters 1 to 11 were run
  in book order, with the cards built as the chapters build them: `long.img`,
  `build/errs.img`, `my.img`, `lines.img`, `cut.img`, `dollar.img`,
  `chain.img`, `spare.img`, `both.img`, `wide32.img`, `nostart.img`,
  `w40.img`, `old.img`, `work.img`, `mem.img`, `con.img`, `hw.img`, `svc.img`
  and chapter 11's `chain.img`. Each of the book's text blocks appears
  verbatim in its run's output. The `CHEAT`, `NEEDS` and `VTEST` comments were
  run with their `sed` and `tecvol` steps.
- **Chapter 6's `TED` round.** It was driven on `work.img` as
  `test/ted.test.mjs` at 60e0768 drives `TED` (fixtures `boot` with the
  PICO9918 and the matrix keyboard, and keys fed when TEC-OS waits). The steps
  were `B:`, `TED HELLO.ASM 7`, `1`, `^T B`, Right (matrix key 6), `^H`,
  `^T R`, a space, `^Q` and `DIR`. The console text after `^T B`, the screen
  with its status row `TED  HELLO.ASM    expected a label, instruction or
  directive  ^S Save  ^Q Quit` and 14 blank rows, the `^T R` text up to
  `Press a key`, and the `DIR` listing (6 files, 8152K free) all match. No
  violations. `TED B:HELLO.ASM` at `A>` opens the file (status
  `TED  HELLO.ASM    L1 C1`). With `TED X.ASM` the word at `2551h` holds
  33,067 bytes on the serial board and 31,510 on the board with both
  displays, as the chapter says.
- **Timings.** Chapter 9's figures were measured on the model by the
  chapter's method, from the `CALL`'s target to the return address:
  - `DIGIT` takes 20,670 T-states.
  - The `VIDEO` release takes 216,023 T-states, about 54 ms.
  - On the serial board, `DIGCLK` (assembled by `TAS` on `hw.img`) goes
    round its loop at `0106h` in 24,435 T-states, and every 32nd round in
    32,065.
  - The loop is 23,797 on the PICO9918 and 23,672 on the graphics LCD, which
    saves 638 to 763 T-states a round (the book's "640 to 760").
  - The digits are dark about 15.4 percent of the time.
- **Service listings.** `LCDMSG`, `BOARD`, `NOW`, `ROWS`, `PLACE`, `AREA`,
  `CHARS`, `COUNT`, `CHEAT`, `RECS`, `NEEDS` and `VTEST` were assembled by
  `TAS` on the model and run as the chapters show. On the PC, chapter 10's
  `makeSvc` route (`cp dist/abi.inc ABI.INC`, then the `node` block) writes a
  111-byte `COUNT.SVC`. That file is byte for byte the first 111 bytes of
  `TAS`'s 128-byte file, which ends in zeros. The `%INCLUDE "ABI.INC"` in
  `count.asm` resolves against the file the chapter creates by that name, so
  the route works on a case-sensitive file system too
  (`tools/lib/svc.mjs:100–101`). `dist/abi.inc` is identical to
  `src/abi.inc`.

### What was checked in each file

- **index.md:** each changed description against the chapter it names and
  against `src/abi.inc` (services 0 to 8, 9 to 11, 12, 13 and 14, and
  `ABICALL`). Every link exists, and Appendix H has its `PICO.SVC` section.
  Finding 3.
- **01-introduction.md:** the single RAM check against
  `src/boot.asm:22,273–309`. The one image `dist/tecos.rom` against
  `tools/media.mjs` and `web/build.mjs`. The drive-A clause against
  `src/cpm/ccp.asm:283–295`. All transcripts were rerun.
- **02-console.md:** only the commit line changed. All transcripts were rerun.
- **03-command-line.md:** the drive-A search, that a named drive gives no
  fallback, that a too-large file stops the search, and that `.SVC` never
  falls back, against `src/cpm/ccp.asm:266–295,361–418`. The `MOUNT`
  transcript at `B>` was rerun. "Chapter 22" is right.
- **04-cards-and-volumes.md:** `MOUNT.COM` is 671 bytes with SHA-256
  `5273f0ba…`, from `dist/files` and `dist/starter.recipe.json`. All
  transcripts and `tecvol` outputs were rerun.
- **05-startup-and-services.md:** the user-area clause against the CCP's
  search, and format 4 against `SVCFMT` (`src/abi.inc`) and `PICO.SVC`'s
  second byte, `04h`. All transcripts were rerun.
- **06-first-program.md:** the search sentence, the `TED` round, `TED`'s
  drive argument and the capacities. See above.
- **07-memory.md (whole):**
  - The latch bit (`LATEXP` `04h`).
  - The page-zero table and the restart-vector rule (`src/boot.asm:190–245`).
  - The `0040h`–`004Fh` table against `src/layout.asm:34–47`, with nothing at
    `0041h` or `0044h`.
  - The EXPAND 1 table: `CTAB` `BC00h`, `CDIRTY` `BC80h`, 30 lines, `HRING`
    `BD00h`, and nothing at `BE00h` and above.
  - The interrupt statements (finding 2).
  - All TPA and file-size figures, by arithmetic and by the `TOP` and `AREA`
    runs.
- **08-programs-and-console.md:** `SIZE` against `TNINFO` (`src/hwsvc.asm:46–56`,
  `L` = `VWID`, `H` = `VHGT`) and the dispatcher (`src/hwsvc.asm:21–39`). It
  was assembled and run on the serial board and the PICO9918 board.
- **09-hardware-services.md:**
  - The table against `src/abi.asm` and `src/abi.inc`.
  - The calling convention: the status codes, `IX` and the alternate
    registers, numbers 15 and up, stack depths with the dispatcher's bytes,
    and the BDOS calls of `MOUNT` and `UNMOUNT`.
  - The service numbers, and `INFO`'s bit 3 against `src/boot.asm:30–33`.
  - All transcripts, and the timings (finding 1).
- **10-writing-services.md:**
  - The header's format byte against `SVCFMT` (4), `tools/lib/svc-format.mjs:3`
    and `src/svc.asm:11,83`.
  - `FIND` and `LIST` against `src/svc.asm:494–547`.
  - The error texts of `makeSvc` and `assembleAt`, the rule for the
    `ORG $0100` line (`tools/lib/prl.mjs:12–18`), and the check for ROM
    addresses (`tools/lib/svc.mjs:19–23`).
  - `TNDRVR` for the display driver's table.
  - The 111 bytes and the 277 bytes of TPA, and every transcript.
  - The links to Chapter 20 and Appendices B and H.
- **11-chaining-commands.md:** "Chapter 24" is right. All transcripts were
  rerun.
- **Words left over:** none in these files: no `PRL`/`.PRL`, MAIN 1, function
  50, `BANKS`, `MOVE`/`XMOVE`, ABI 4, format 3, the old profiles, `ABIHW`,
  `ABIVOL`, `ABIGLCD`, `ABISVC` or `ABIVID`, the old `TED` pin, copies of
  `TED`/`TAS` to B:, functions 44, 45, 46, 48 or 99, or a user number in the
  prompt.
