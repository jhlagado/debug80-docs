# Check of `tec-os/index.md` and Chapters 1 to 12 at 718c01b

Book at 3c67b61, diff from 3c8db97. No claim about the code in these files was
found false except finding 3, which is a sentence the diff left alone. The other
findings concern the chapter header rule, one antecedent, words and source
layout.

## Findings

1. `tec-os/11-chaining-commands.md:10-13`. The header names `EDIT.COM`'s build
   and SHA-256 and not `TAS.COM`'s. Evidence: the chapter's transcripts print
   `976K free` for drive A (lines 34, 99, 102, 105), a figure that depends on
   the size of `TAS.COM` as much as on that of `EDIT.COM`.
   `editorial/STYLE.md:13-15` requires the line to name each outside file an
   example depends on, and Chapters 3 and 4 carry both. Correction: add Chapter
   3's clause, "and its `TAS.COM` from Thorium 7604daa, with the SHA-256
   `ff18734807206127d4ede7a96bbd26acf36310361834a1c9ae998b20e2f98292`".

2. `tec-os/04-cards-and-volumes.md:350-352`. "The exception is a volume whose
   descriptor marks it written behind, `WORK` on the starter card, and `tecvol`
   marks one at most. Its writes go into the cache". The added clause puts
   `tecvol` between "a volume" and "Its". The fact is right
   (`tools/lib/container.mjs:85`). Correction: "The exception is a volume whose
   descriptor marks it written behind, and `tecvol` marks one at most. On the
   starter card that is `WORK`. The volume's writes go into the cache".

3. `tec-os/05-startup-and-services.md:38-40` (unchanged sentence). "The pages that
   loaded services hold, from the lowest service up to TEC-OS's workspace, are the
   *service resident memory*." Services end below the page of the BDOS entry
   jump, not at the workspace. `src/svc.asm` (`SVCLOAD`, at `SVCMOV`) places each
   service below the old `PZTOP`, so with no other service in, the pages end at
   `B7FFh`. `dist/tecos-debug80.census.json` then has the BDOS entry jump at
   `B806h`, the allocation vectors from `B818h` and the workspace at `B958h`. The
   sentence also differs from `editorial/terms.md`, "The pages loaded services
   hold". Correction: "from the lowest service up to the BDOS entry jump".

4. `editorial/STYLE.md:45-46` against `tec-os/07-memory.md:107,200,404`,
   `tec-os/08-programs-and-console.md:143-144` and
   `tec-os/11-chaining-commands.md:167-168`. STYLE says a program in an example
   is assembled on the model by the starter card's `TAS`, and "ATOM builds the
   ROM on the PC". These chapters assemble their programs with `npx atom` on the
   PC, and their headers say so. The transcripts pass either way. Chapter 6's
   first program is on the PC by design. Correction: either state the exception
   in STYLE ("except where a chapter's header names ATOM") or move the three
   chapters' builds to `TAS`.

5. `tec-os/09-hardware-services.md:58`. "A CP/M program may run on a machine with
   no table at `C003h`". This is the only form left near the old "table at
   `C003h`" (`editorial/terms.md`, "Forms changed to these"). It is true, and it
   describes a machine that has no ROM table. Correction, if the list is applied
   strictly: "with no ROM table at `C003h`".

6. Source layout only, no effect on rendering. A change left a line unwrapped at
   `tec-os/12-rom-and-build.md:56,150,253`,
   `tec-os/08-programs-and-console.md:173` and
   `tec-os/10-prl-programs-and-services.md:93,209`. Correction: rewrap.

## What was checked

- `index.md`: every changed line against the code and the chapters it summarises
  (nine hardware services, `HWTAB` 19 to 27; seven steps in Chapter 20; Appendix
  B's title); old-word search clean.
- Chapter 1: header hashes, `TAS_COM` and `EDIT_COM` paths, SD codes against
  `src/sd.asm:10-17` and `src/diag.asm`, all 11 runs, the no-Edit card
  (`12 files, 984K free`), screen clear in `src/console.asm`, `[more]` before
  README's last line, `host/card.mjs` web text.
- Chapter 2: all 9 runs; changed names; `[more]` prose against `PGPUT`.
- Chapter 3: all 13 runs (errs card remade); `000A` from 1,212-byte README; drive
  fallback against `CCPENT` and a run with `MOUNT B:` at `B>`; `File R/O` against
  `ROFCB`, `ROTEST` and their three callers; `TPA` limit against `LOADLOOP`.
- Chapter 4: all 5 runs; `tecvol info` line; one volume written behind; `Write
  lost` text against `CWBOOT`; reset discarding the cache against `MEMINIT`.
- Chapter 5: all 15 runs (chain card remade from the chapter); `STLINE` end of
  record; `withoutDisplay`, `cardProblem` and `powerOn` for the page's claims.
- Chapter 6: all 3 runs on a remade card; `TAS` statements against Thorium's
  `docs/language.md`; `CCPENT`.
- Chapter 7: all 4 runs; TPA figures against the census; the 6 header bytes
  against `DDEP`, `DFLG`, `DREM` and `SVCMOV`.
- Chapter 8: all 4 runs; warm boot and the table in EXPAND 0 against `WBOOTR`;
  `ROM table` sentence; BDOS's use of the RAM table.
- Chapter 9: all 9 runs; changed words only.
- Chapter 10: all 6 runs and the two comment-form runs (`CHEAT`, `NEEDS`), `AREA`
  on a remade card; the stray-characters transcript differs from the run only in
  the `^U` and eight `00h` the text declares; `PUTS`, `HWSPUT`, `makeSvc`'s format
  byte, `REGHEAD`, `SVCLIM`.
- Chapter 11: all 7 runs on a remade `chain.img`; `PGNEWL`, `PGDROP`, `CWBOOT`,
  `CHDROP`; runs of `^C`, Esc, `q`, `#` and `;` at `[more]` in a chained line.
- Chapter 12: every figure against the census and `.d8.json` (`COLD`, `ROMCODE`,
  `CODEEND`, `WSBASE`, `ABI*`, `OLDVOL`), `src/gen/*`, `npm run build` line format,
  all four ROM hashes, and all 61 citations read. Part I has no line citations,
  so the sample of 25 applied only here.
- Across 1 to 12: old-word search for every form in `terms.md` and every use of
  "driver"; only permitted uses remain, apart from finding 5. Internal links from
  these files resolve. The listing-key and `Write lost` statements agree with
  Chapters 14, 17, 19 and 25 and Appendix D.
