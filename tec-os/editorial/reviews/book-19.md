# Check of chapters 13 to 26 at 718c01b

Read at book commit 3c67b61. The worktree moved to 02e00fd during the check, and that commit touches none of these chapters. All line numbers hold at both.

## Findings

Three findings, all small. No changed claim, changed figure, changed transcript or citation in the changed passages failed. No citation in the random samples failed.

### 1. A sentence the `Write lost` change has left too wide

`tec-os/25-chaining-inside.md:44-45`: `CHPOS` is "in the part of the workspace above the RAM BIOS table, which warm boot doesn't clear". `tec-os/14-reset-and-boot.md:318-320` says the same: with `CHPOS` kept, the rest of the line "outlives the warm boot".

Evidence: warm boot calls `CWBOOT` (`src/boot.asm:79`), and after a failed cache write `CWBOOT` clears `CHPOS` (`src/cache.asm:349-356`). The same chapters now state this at `25-chaining-inside.md:251-254`, `25-chaining-inside.md:281` and in step 7 of `14-reset-and-boot.md:306-309`. The older sentences were true before f3be90f and now read as a contradiction of those passages.

Smallest correction: in Chapter 25, "which `CPMINIT` doesn't clear". In Chapter 14, "therefore outlives `CPMINIT`".

### 2. `.DRV` with no old card in the text

`tec-os/22-startup.md:231`: "any other type goes on to `CMDCOM` and the search for a `.COM` file, which is what becomes of `PICO.DRV`". The sentence is true (`src/cpm/ccp.asm:267-277`), but nothing before it in Chapter 22 mentions an old card; the first such text is at line 307. `editorial/terms.md:178` keeps `.DRV` names to text about an old card or `TAS`'s output at its pin.

Smallest correction: "which is what becomes of an old card's `PICO.DRV`".

### 3. `PICO?` needs the matrix keyboard too

`tec-os/15-bios-and-console.md:396-398`: "`PICO?` appears when a board with a PICO9918 reaches its first prompt with no display driver".

Evidence: `STDONE` writes the word only when `CONDEV` has both `CDMTX` and `CDTMS` (`src/svc.asm:415-416`, `src/svc.asm:423-429`). `tec-os/22-startup.md:189` and `tec-os/appendix-d-error-messages.md:110` have the keyboard. The sentence's only change was a citation; it is reported as current behaviour.

Smallest correction: "a board with a PICO9918 and the matrix keyboard".

## Runs

- All 22 captures with a comment in chapters 13 to 26 were rerun on fresh copies of the cards, remade as each chapter says, and each fenced block is found in the output unchanged. `GAPZERO.SVC` from Chapter 20 was rerun by hand on a copy of `svc.img`, and gives `COUNTW 1`.
- Chapter 20's bytes at `B700h` match on all three rows. `CEB7h` lies in `SPIR`'s loop (`SPIRB` `CEB1h`, `SPIEND` `CEC6h`). After `UNLOAD`, `SERVICES` prints the same lines, a `COPY` gives `Bad Sector`, and a reset stops with error 02.
- Timings a changed sentence rests on, Chapter 14: 8,910,182 to the first `CONIN`, 122,499 for the warm boot after `SAVE 8 X.COM`, and the base figures 1,279,382 and 31,455, all exact. Chapter 14's 91,000 is 122,499 less 31,455. Chapter 19's four reads for `DIR` are exact.
- 1,038,529 for a program's function 13 was measured only with extra files on the card, since a file holding the call adds a directory entry: 1,040,167 with one, 1,041,796 with two. Taking the 1,629 per entry off gives 1,038,538, nine T-states from the book, which is consistent with the call's own instructions and a different start point. Not reproduced exactly.
- `PICO.SVC`'s `od` output in Chapter 21 matches `dist/files/PICO.SVC`. The diagnostics image ID and version in Chapter 24 match `build/diag/diag.json` and `tools/diag.mjs:24`.
- Not rerun, because the test suite is excluded: the census column of the stack table in `20-hardware-services-and-service-loader.md`. No text read contradicts it.

## Chapters

- 13: every changed claim, the workspace table and addresses against `dist/tecos-debug80.census.json` and the map, stack and `XMOVE` passages, 25 citations. No finding.
- 14: changed claims, step lists, 2 transcripts, timings above, 25 citations. Finding 1.
- 15: changed claims, `SVCGO` route, 1 transcript, 25 citations. Finding 3.
- 16: `E0E0h`, `F014h` and 3,893, the extent write, `RSTAIL`, `File R/O`, the removed differences, 2 transcripts, 25 citations. No finding.
- 17: `D796h`, `E0DFh` and 2,378, `CCPENT`, `[more]`, the built-in table, 3 transcripts, 25 citations. No finding.
- 18: mount entry passages, 2 transcripts, 25 citations. No finding.
- 19: four reads, `CWBOOT`, `VFLUSH`, 25 citations. No finding.
- 20: `VTOWN`, `TONE`, `LOADCOM`'s limit, the routine sizes, the bytes below `0006h`, 25 citations. No finding.
- 21: page sums, `SVCLOAD` and `makeSvc` passages with every citation, `od` output, 2 transcripts, and the 16 citations outside renamed paragraphs, which is the whole population. No finding.
- 22: `host/card.mjs` and `test/pico.test.mjs` claims, 25 citations. Finding 2.
- 23: 7 transcripts, 25 citations. No finding.
- 24: `SDINIT`'s and `MOUNT`'s codes, image ID, 25 citations. No finding.
- 25: `[more]`, `Write lost`, `File R/O` route, function 47, 1 transcript, 25 citations. Finding 1.
- 26: 38 test files, 24 that check `violations` (`diag.test.mjs` is the 25th to name it and expects entries), `test/inputs.json`, `ATOM.COM` unread, `prepareCard`, 2 transcripts, 25 citations. No finding.

Leftover words: outside findings 2, `.DRV` appears only in old-card text at `22-startup.md:307-310` and `26-host-model.md:297-299`. No `DRIVERS`, "mount service", "ROM services", "table at `C003h`" or "module" for a loaded file remains in these chapters, and each "driver" names a display driver, the SD card driver or a service that drives hardware. Stale figures from before (`986K`, `E0CAh`, `D795h`, 119,508 and the like) are gone from the whole book.
