# Review of the TEC-OS book at 78127ec: chapters 12 to 25 and appendices A to E

Read-only. Book at `fcf873f` on `tec-os-book`, against `d52778f`. Code read with
`git -C ~/projects/tec-os show 78127ec:PATH`. All runs were made under the guard in
copies (`$S/rv14b` of `rev781`, `$S/rv14b621` of `rev621`), one at a time.

## Chapter 20's stack figures: settled, and the book is right

- `node --test test/stacks.test.mjs` at 78127ec (ROM `8cad4092…`), guarded, exit 0.
  `build/stack-census.json` reads BDOS 30 of 54, CCP 18 of 32, BIOS 18 of 40. By
  run, the BDOS's figures are: serial 28, pico9918 30, glcd 30, writeBehind 28, diagnostics 12,
  diagnosticsPico 22, conUc1 30, conUc1Glcd 22, picoRom 26, recognisedReset 22,
  chained 28, serialPlain 22, resident 22. The base, the maximum over the `bare`
  runs at `test/stacks.test.mjs:253-255`, is 30, 18 and 18. The census is the same.
- With `SVCLIM` 8, 12 and 6, the sums are 38 of 54, 30 of 40 and 24 of 32, each
  within three quarters. The table (Reserved 54/40/32, Base 30/18/18, Census
  30/18/18) and the sentence "38 of 54, 30 of 40 and 24 of 32" are right. So is "GLCD.SVC
  declares 2, 0 and 6, more than the runs show it using on the BDOS's and the
  CCP's stacks": the glcd and conUc1 runs equal the base on both stacks.
- The same test on `rev621` (ROM `bee18e1e…`, 621201d's hash) also gives 30, 18
  and 18, with pico9918 and glcd at 30. The figure of 32 doesn't come from 621201d. The
  32 in `$S/ab12w/build/stack-census.json` belongs to a ROM with SHA-256
  `8bb1637d…`, another build. The book's figures at `d52778f` (32 and 40 of 54)
  were therefore not true of 621201d either, and the new 30 and 38 are true of both
  commits.

## Findings

1. **19-block-cache.md:114.** The claim is "While EXPAND 1 is in view the copy uses
   no stack, because the caller's stack may be in EXPAND 0
   (`src/cache.asm:401-412`)". The old citation, 394-395, named the two lines of the
   rule. The new one names all of `MVCOPY`'s 12-line header. The rule is at
   `src/cache.asm:407-408`, "EXPAND 1 is switched in only around code that uses
   no / stack, as the caller's stack may be in EXPAND 0" (cite-flags14 `COMMENT
   394-395 -> 401-412`). Correction: `src/cache.asm:407-408`.

2. **18-sd-card-and-volumes.md:372.** The claim is "with every line dirty … all
   three take 24 (`test/storage-boundaries.test.mjs:176-241`)". The figures are
   right. The run of that test's `--test-name-pattern="abi.inc's 24 bytes"` prints
   `{"UNMOUNT":24,"MOUNT":24,"DESCRIBE":22,"UNMOUNT, every line dirty":24,"MOUNT,
   every line dirty":24,"DESCRIBE, every line dirty":24}`. But the range now
   starts at `const dirtyLines`. It leaves out the comment at 172-175 that states the
   24-byte bound and the every-line-dirty case, which the old range 172-224
   included. Correction: `test/storage-boundaries.test.mjs:172-241`.

3. **16-bdos.md:392.** "Function 19 marks every entry that matches `E5h`, writes
   its directory record and only then frees its blocks". This reads as entries
   that match `E5h`. The code marks each matching entry `E5h`
   (`src/cpm/bdosfile.asm:285-286`). Correction: "Function 19 marks each matching
   entry empty, `E5h`, writes its directory record and only then frees its blocks".

No other finding. Each changed claim below was checked against the code at
78127ec and holds:

- The erase order and its failure, `src/cpm/bdosfile.asm:279-293`, with
  `WRDIRNOW` → `DMABACK` → `BADSECT` at `src/cpm/bdoslog.asm:56-78`.
- `RANDBACK`/`EXSWAP`/`SWAPB` (`src/cpm/bdosrec.asm:315-353`), and functions 33 and
  34 after a 4 or a 5.
- The key dropped at `CWBK` (`src/cache.asm:338-355`): dropped unless the block and
  the drive are the key's.
- `CFLUSH` keeping a failed line dirty and `CFLALL` dropping it
  (`src/cache.asm:182-215`, `378-386`), the retried close, and `Write lost` after
  a directory write's failed flush.
- `MNLBA` after `CTAKE` (`src/vol.asm:300-319`).
- `VMNTRS` and functions 27 and 31 (`src/vol.asm:679-691`).
- `SVCNT`: B = 1 − N, 256 − N allowed, 255 with none (`src/loader.asm:250-267`,
  288). The 128/127/128 example matches `test/svc.test.mjs:276-306`.
- The atom budget (`tools/build.mjs:192-194`). The package's defaults are 200
  million instructions and 2 billion T-states at
  `node_modules/atom-z80/src/host/harness/native-atom-runner.mjs:910-920`.
- `host/card.mjs:68-70` and the serial terminal's `[problem]`
  (`web/src/main.mjs:98`).
- `cpmfs` `read`/`erase`/`write` with `force` (`tools/lib/cpmfs.mjs:123-191`).

## Checks made

- **Figures.** ROM regions, used and free, SHA-256 and the build line match
  `rev781/dist/tecos.census.json` and `docs/memory-map.md`. BDOS `E703h–F608h`,
  3,846 bytes, and CCP `DD2Ah–E702h`, 2,521 bytes, come from the d8 labels (`BDOSBAS`,
  `CCPBAS`, `SVCDSP` at `F609h`). `WSBASE` `BAE7h` gives 1,049 bytes. A script checked every
  ROM address of `C000h` and up in the 30 files against the 78127ec symbols and
  the old addresses in `moved-syms14.json`. None is stale. Each one with no label is
  a range end. `MAKESRCH` and `SDI8R` are named nowhere.
- **Timings.** Rerun on `$S/rv14b` with a `time.img` built by chapter 19's steps
  and `$S/b14p2-t/measure.mjs`. The figures were cold boot 1,371,558, first
  `CONIN` 7,067,777, `STBOOT` 5,824,922, close 1,111,542, `SAVE 64` 30,615,308 and
  9,951,810, and `READ` 6,642,581 and 1,343,674. All match chapters 14, 19 and 21.
- **Transcripts.** The diff changes no fenced capture. The build line in chapter 12
  matches the census. The eight captures that failed in `recap781.json` were
  rerun on cards built by their chapters' own steps: ch17 at 416, 456 and 548, ch18
  at 201 and 218, ch20 at 392 (COUNT.SVC by `makeSvc`, then GAPZERO), ch24 at 99,
  and appendix E at 185. Each matches its fence, the five whose fences begin
  at the first command after the boot lines included. `tecvol verify
  build/swapped.img` gives the fence's line. Every other capture of these files
  in `recap781.json` is `same`.
- **Appendix D's remedy.** `tecvol put` over a file written `--ro` fails with
  `tecvol: 0/RO.TXT is read-only`, exit 1. With `--force` it succeeds.
- **Unchanged citations.** All 1,485 citations on lines that the diff left alone, in the 30 files,
  point at lines that are identical at 621201d and 78127ec. The three exceptions are
  generated `src/gen/geom.asm` lines. 40 of them in chapter 20 were read in full.
  Every cite-flags14 entry for these files (NOTFOUND, COMMENT, ENDS, AMBIG,
  HEADER) was checked by hand.
- **Unchanged statements.** Searched for erase, random reads and writes, the
  key, close and flush failures, `Write lost`, `MOUNT` onto the current drive,
  every line dirty, the registry's size, `tecvol` on read-only or sparse files and
  `STARTUP.CMD`. None that the writers left is contradicted.
- **Links.** Every cross-chapter anchor resolves, including the new chapter 1
  and appendix G anchors in appendix D.

## Per file

- 12-rom-and-build.md: figures, budget sentence and build line. 22 changed and 51 unchanged citations, no transcript.
- 13-memory-map.md: 7 changed and 73 unchanged citations, addresses by script, no transcript.
- 14-reset-and-boot.md: timings rerun. 7 changed and 85 unchanged citations, 2 transcripts `same`.
- 15-bios-and-console.md: 4 changed and 94 unchanged citations, 1 transcript `same`.
- 16-bdos.md: BDOS span, erase, random and mount. 29 changed and 129 unchanged citations, 2 transcripts `same`. Finding 3.
- 17-ccp.md: CCP span. 4 changed and 124 unchanged citations, 6 transcripts (3 rerun on `ccp.img`).
- 18-sd-card-and-volumes.md: MNLBA, key, mount and stack figures rerun. 24 changed and 65 unchanged citations, 3 transcripts (2 rerun). Finding 2.
- 19-block-cache.md: flush, key and `Write lost`, timings rerun. 37 changed and 23 unchanged citations, no capture fence. Finding 1.
- 20-hardware-services-and-service-loader.md: registry count and stack census rerun at both commits. 69 changed and 145 unchanged citations, 2 transcripts (1 rerun).
- 21-startup.md: page and read-only `STARTUP.CMD`, timing. 29 changed and 110 unchanged citations, no changed transcript.
- 22-command-history.md: comment line only. Its citations unchanged, 7 transcripts `same`.
- 23-diagnostics.md: 1 changed citation, 1 transcript `same`, diag sources unchanged.
- 24-chaining-inside.md: 2 changed and 76 unchanged citations, 1 transcript rerun on `start.img`.
- 25-host-model.md: `cpmfs` and page. 6 changed and 91 unchanged citations, 2 transcripts `same`.
- appendix-a-bdos-functions.md: functions 19, 27, 31, 33 and 34. 20 changed and 69 unchanged citations.
- appendix-b-rom-services.md: mount and registry. Changed citations read, unchanged ones by script.
- appendix-c-memory-map.md: regions and spans by census and d8. Citations read.
- appendix-d-error-messages.md: `Write lost`, `File R/O` remedy run, mount rows. 39 changed and 108 unchanged citations, anchors resolved.
- appendix-e-container-format.md: 1 changed citation, `swapped.img` verify and capture rerun.

## Resolved

All three findings were applied in e1dce87. Chapter 20's stack figures stand at 78127ec.
