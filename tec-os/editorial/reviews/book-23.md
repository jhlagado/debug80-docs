# Check of index.md and chapters 1-6 and 8-11 at 4d6eeaa

Worktree `~/projects/debug80-docs-tec-os`, `git diff 591a112 HEAD`. Cards were
remade fresh from a copy of `$S/revks37` (`$S/rv6/t`, `dist/starter.img`
identical to revks37's) by the chapters' own `sh` blocks (`$S/rv6/setup.sh`).
Sixty-six capture comments were rerun (`$S/rv6/runcaps.sh`, outputs in
`$S/rv6/out`). All 65 that start from the card as the book makes it match
exactly. The one that didn't, 06:106, was run on a card that already held
`SHOW.COM`. Rerun on a card holding only `HELLO.COM` (`$S/rv6/h1.out`), it
matches too. Chapter 6's `TED` round was rerun by an independent driver
(`$S/rv6/t/tedround.mjs`, output in `$S/rv6/ted.out`), and every block matches.

## Findings

1. **01-introduction.md:150-153.** The claim: "When you change the display or
   the width ... it writes the PICO9918's driver built for the chosen width to
   drive A as `PICO.SVC`." That holds only with the PICO9918 chosen.
   `web/src/main.mjs:67` fetches a driver only when `state.display === "tms"`,
   and `host/card.mjs:57` writes it only for `display === "tms"`. With "GLCD
   only" chosen, nothing is written. The page also does this at every power-on
   and only when the card's copy differs (`host/card.mjs:60`). Chapter 5:324-327
   states this correctly. Smallest correction: "Before it does, with the
   PICO9918 chosen, it writes the driver built for the chosen width to drive A
   as `PICO.SVC`, and it puts ...".

2. **06-first-program.md:308-309 (minor).** The claim: "31,510 with `PICO.SVC`
   installed". The run (`$S/rv6/texcap.mjs`, `$S/rv6/texcap.out`) gives the
   word at `TEXCAP` (`2551h`) as 33,067 on the serial board, where both drivers
   fail. It gives 31,510 on the PICO9918 board and also 31,510 on the GLCD
   board, where `GLCD.SVC` installs, since both drivers are 6 pages. The
   figures are right, but the condition is narrower than the code. Smallest
   correction: "and 31,510 with a display's driver installed".

3. **06-first-program.md:398-405 (observation, no correction needed).** The
   `DIR` order matches a run from `work.img` with `TED.COM` and `TAS.COM` added,
   as the comment says ("from the copies above"). A reader who does the
   chapter's examples in order on one card ran `ERA HELLO.COM` and `A:TAS HELLO`
   before the round, so `HELLO.DBG` and `HELLO.COM` hold earlier directory
   slots. That reader's listing has the same eight files and `8128K free` in a
   different order. It follows the book's convention that each capture starts
   from the card as built.

No other changed claim, transcript, figure or link was found wrong.

## What the TED round confirmed (06:289-405)

- `TED HELLO.ASM 7` opens at `L7 C1`. A typed `1` gives `*` and `L7 C2`.
- `^T B` prints `B>TAS HELLO.ASM`, then
  `HELLO.ASM:7:1: expected a label, instruction or directive`, then `B>TED`.
  `TED` then reopens with the message on row 24 and 14 blank rows between the
  text and the status row. The status row matches the book's exactly.
- Right arrow, key 6, gives `L7 C2`. `^H` gives `*  L7 C1` and leaves line 7 as
  `        CALL    BDOS`.
- `^T R` gives the book's block through `Press a key`. A space brings `TED` back
  at `L7 C1`.
- `^Q` and `DIR` give the book's listing exactly. No violations.
- The matrix keymap has no combination for `7Fh`
  (`getMatrixCombosForAscii(0x7f)` is empty). `src/data.asm:40-42` and
  `src/console.asm` `KBASCII` produce no `7Fh`. This bears out 02:253-255 and
  06:370-371.
- The `^T` table (06:300-306) agrees with `PRETAB` and `COMRUN`, `COMBLD`,
  `COMDBG`, `COMOPN` and `COMFLP` (Thorium 8fcc6ea
  `ted/src/editor-data.asm:104-121` and `editor-project.asm:198-300`). It also
  agrees with `TPLDBG` `"TDB ",2,"!TED"`.
- `THOR.$$$` and `THOR.BAK` around the `THOR.PRJ` rewrite: confirmed by
  `editor-start-promote.asm:1-120`.
- `THOR.ERR` written before a build and deleted at the next start: confirmed by
  `editor-data.asm:136-138` and `editor-start.asm` `STSWER`.

## Per file

- **index.md:** chapter 4, 6 and Appendix D summaries read against the
  chapters. No `VOLS` left, and no stale anchor.
- **01-introduction.md:** the hash, the `TAS_COM`/`TED_COM` paths against
  `tools/media.mjs:23-35,173-200` and `test/inputs.json`, the web-page paragraph
  (finding 1), and the six-file list. All 10 captures were rerun and match,
  including `DIR` (6 files, 984K) and `MOUNT`.
- **02-console.md:** the driver bullet, the `7Fh` claim, and the `long.img`
  recipe. All 9 captures were rerun, the three `LINES.TXT` ones included, and
  match.
- **03-command-line.md:** every `STARTUP.CMD` and `MOUNT` substitution, the
  record and 4 KiB arithmetic, and `build/errs.img`. All 13 captures were rerun
  and match.
- **04-cards-and-volumes.md:** `tecvol info` (6 files, 1007616), `dir`
  (`MOUNT.COM 768`, 670 bytes, six records), `my.img` info (8359936), the
  recipe entry (670 bytes, `e8db95fa...`), and `MOUNT`'s usage string against
  `test/programs/mount.asm:263`. All 5 captures were rerun and match.
- **05-startup-and-services.md:** the two services, `wide32.img` built by
  `put ... PICO.SVC`, `w40.img`, `old.img` with the `PICO GLCD` loop, and the
  web-page rewrite against `host/card.mjs:37-66` and `web/src/main.mjs:66-68`.
  The `PICO40.SVC` failure while `PICO.SVC` is in was checked by a run
  (`$S/rv6/w40b.out`: `PICO40.SVC?`, `SERVICES` shows `PICO 6`). The 14
  captures that need no `cut.img` or `dollar.img` (both unchanged) were rerun
  and match.
- **06-first-program.md:** the new section in full, the `TED` round rerun, the
  `TEXCAP` figures (finding 2), the `EDIT error 01` capture, and the sweep
  sentence against `src/boot.asm:231-271` (`PZSWP` keeps a `JP` whose target
  is above `PZTOP`, the word at `0006h`). All 4 captures were rerun and match.
- **08-programs-and-console.md:** `term.asm` assembles (95 bytes) and goes on
  `con.img`. The `B:TERM` screen, `KEY` and both `SIZE` captures were rerun and
  match. The section the text points to, "The BIOS's console calls", exists.
- **09-hardware-services.md:** `npx atom test/programs/demo.asm demo.com`
  assembles (1,191 bytes). The `B:DEMO` capture on `hw.img` was rerun and
  matches. `ABIVOL` is used by `MOUNT` only. No `DEMO` is presented as on the
  starter card. Other captures are unchanged and were not rerun.
- **10-prl-programs-and-services.md:** the sweep's bound as a word
  (`src/boot.asm:239-249`) and the failed `INIT`'s `SVCFRE` and sweep
  (`src/svc.asm:233-247,280-292`) agree with 10:346-352. No transcript changed.
- **11-chaining-commands.md:** all 7 captures (`mount!!`, `DIR *.SVC`,
  `EXISTS`, `RUN A:MOUNT!DIR`, `DIR C:!MOUNT`) were rerun on a fresh
  `chain.img` and match.
