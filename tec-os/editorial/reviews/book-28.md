# Review absorb 11: chapters 12 to 25 at 60e0768

Scope: `git diff -M 4445919 HEAD` for chapters 12 and 14 to 25 (renamed files diffed against their old names), chapter 13 whole, chapter 20 whole against `src/svc.asm`, `src/hwsvc.asm`, `src/abi.asm`, `src/abi.inc` and `tools/lib/svc.mjs`. Work ran in a private copy of `$S/rev36a` (`$S/r11/t`, sources byte-identical to 60e0768 for the files checked); every card was made fresh from that copy's `dist/starter.img` (SHA-256 3671751c...).

## Findings

1. **19-block-cache.md:156-157.** Claim: `READ DATA.BIN` took 6,633,385 T-states, then 1,335,056. Evidence: a script that follows the chapter's own method (count from `READ DATA.BIN` typed and echoed, before the Return, to the next prompt), on `time.img` made with the chapter's commands, gives exactly the old 6,641,268 and 1,342,939 on the 19ad916 build in `$S/rev19a`. The same script gives 6,633,371 and 1,335,042 at 60e0768. The 735 added to the builder's figures overshoots by 14 at 60e0768. Correction: 6,633,371 and 1,335,042 (1.66 s and 0.33 s stand).

2. **19-block-cache.md:234-235.** Claim: `SAVE 64 X.COM` took 30,829,851 on `THROUGH` and 9,909,718 on `BEHIND`. Evidence: the same script, after a cold boot and an untimed `B:` or `C:`, reproduces the old 30,833,645 and 9,921,552 exactly at 19ad916 and gives 30,829,837 and 9,909,704 at 60e0768. Correction: 30,829,837 and 9,909,704 (7.71 s and 2.48 s stand).

3. **16-bdos.md:461.** Claim: "The volume services `MOUNT` and `UNMOUNT`". Evidence: `src/abi.inc:61` names service 10 `TNUNMNT`; chapters 18 (`:304`), 19 (`:268`), 20 (`:50`) and Appendix B (`:82`) all call it `UNMNT`. Correction: `UNMNT`.

4. **12-rom-and-build.md:91-93.** The inserted sentence about `abi.inc` sits between "`gen/format.asm` are equates" and "So is `layout.asm`, which names the ports...", so "So is" now reads as "is the file programs assemble with". Correction: move the `abi.inc` sentence after the `layout.asm` sentence, or write "`layout.asm` is equates too, naming the ports...".

5. **12-rom-and-build.md:88.** Claim: the list "ends with `end.asm` (`src/rom.asm:16-31`)". Evidence: `src/rom.asm:31` is `svc.asm`; `end.asm` is at `:32`. Correction: `src/rom.asm:16-32`.

6. **12-rom-and-build.md:247-248.** Claim: media "builds the starter card and writes `docs/memory-map.md` from the census (`tools/media.mjs:244`)". Evidence: `:244` writes the memory map only; the starter card is built at `tools/media.mjs:227-228`. Correction: cite `tools/media.mjs:227-228`, `tools/media.mjs:244`.

7. **25-host-model.md:107-109.** Claim: the history's page is left out of the EXPAND 1 watch "since `HSTORE` writes it, and so is the page at `BF00h`, which is free (`host/machine.mjs:219`)". Evidence: `host/machine.mjs:219` watches `a < 0xbd00` and `0xbe00 <= a < 0xbf00`, so the other free page, `BE00h`, is watched; being free is not why `BF00h` is left out. With the warm-boot jump gone the sentence gives a reason that doesn't hold. Correction: "and so is the page at `BF00h`, though nothing writes it now".

8. **21-startup.md:236.** Claim: for an old card's `PICO.DRV`, "no `PICO.COM` is found on either drive". Evidence: the first startup line runs with drive A current (cold boot sets `0004h` to 0, `src/boot.asm:56-57`), and the A: search runs only when the current drive isn't A (`src/cpm/ccp.asm:290-292`), so one drive is searched. Correction: "no `PICO.COM` is found on drive A, and the line fails".

9. **17-ccp.md:248.** "and an answer but `Y` or `y` erases nothing" doesn't read as English. Correction: "and any answer but `Y` or `y` erases nothing".

10. **13-memory-map.md:53-55.** "read none of TEC-OS's own state outside EXPAND 1 but `LATCHV` while it is in view" is hard to parse. Correction: "read no state of TEC-OS's but `LATCHV` while EXPAND 1 is in view, apart from what is in EXPAND 1 itself."

Notes outside the book, for the code: stale comments at 60e0768 still name MAIN or old meanings: `src/cache.asm:389-390` ("in MAIN 0"), `src/cache.asm:484` ("page zero is in MAIN 0"), `src/boot.asm:65` ("MAIN 0, EXPAND 0"), `src/ram.asm:230` (`SLN` "code length", but it holds the last record, `src/svc.asm:225`), `tools/lib/svc.mjs:14` ("Version 3 ... ABI 4"). The book quotes none of them.

## Checked and correct

- Timings. Chapter 14, by the chapter's own method and reproducing every old figure at 19ad916 first: cold boot 1,285,388, first `CONIN` 8,835,792, warm boot 31,933 with CCP entry 14,058, after `SAVE 8` 112,303. Chapter 19's per-call figures: hit 13,635 and miss 235,328 (old 13,698 and 235,391 reproduced). Chapter 21's `STBOOT` at 5,861,134 on the web page's board is right as printed, measured directly (old 5,864,134 reproduced); it needs no constant. The 735 constant is right only for none of these: in chapter 19 it leaves each prompt-to-prompt figure 14 too high (findings 1 and 2).
- Chapter 20 in full: dispatcher, `SVTAB`, the routine sizes (458 bytes, each row matched against the `.d8.json` map), every hardware service's description, the seven load steps, the failure table, the registry, removal, restart vectors, against `src/svc.asm`, `src/hwsvc.asm`, `src/abi.asm`, `src/abi.inc`, `tools/lib/svc.mjs` and `tools/lib/prl.mjs`. On the model: `COUNT.SVC` (built by the chapter 10 `makeSvc` route, which worked here on a case-insensitive file system) loads at `B700h` with `06 0A 04` at `B70Ch`, TPA 46,592; `PICO.SVC` (1,315 bytes of header and image) at `B200h` with `B387h`, `B392h`, `B39Bh` at `B219h`, TPA 45,312; `TAS.COM` has `2A 06 00 F9` at `010Dh`; `GLCD.SVC` declares 2, 0, 6. Captures `SERVICES` (`PICO 6`) and `GAPZERO.SVC` (`COUNTW 1`) match.
- Chapter 17's new A: search capture matches exactly. Every capture in chapters 14 to 25 that needs no prepared card (14:204, 14:274, 15:106, 16:162, 16:179, 17:79, 17:351, 18:343, 20:345, the seven of chapter 22, 25:124, 25:142) was rerun under the memory guard and matches. 25:142 differs only by the comparison stripping a trailing blank line. The cards `bad.img`, `ccp.img` and `start.img` were not remade; their transcripts are unchanged by this diff.

## One line per file

- 12: diff read; layout table, sizes, hash, build output lines, checks and all cited lines checked against `build.mjs`, `media.mjs`, the census and a fresh build's output; findings 4 to 6.
- 13: whole file read; every citation dumped and checked, every address checked against the `.d8.json` map and the census (workspace table, stacks, EXPAND 1, TPA 46,869 and 46,165); finding 10.
- 14: diff read; steps, citations and all seven re-measured timings checked; two captures rerun; no findings.
- 15: diff read; `DRVR`/`SVDRV`/`GLHOOK` section and every shifted citation checked; capture rerun; no findings.
- 16: diff read; BDOS span `E0F0h–EFF6h`, function 47/108 dispatch, close on a read-only drive (`CHKRO` at `:570-571`), shifted citations checked; captures rerun; finding 3.
- 17: diff read; CCP span, A: search (`ccp.asm:286-295`), `ERA` answer, `LOADTOP`, citations checked; captures rerun; finding 9.
- 18: diff read; volume services against `vol.asm:577-692` and `abi.inc:15-24`, `:55-67`, KE-148 test cited; capture rerun; no findings.
- 19: diff read; `MVCOPY` description against `cache.asm:381-494`; per-call and prompt-to-prompt timings re-measured; findings 1 and 2.
- 20: whole file checked against the code and on the model, as above; captures rerun; no findings.
- 21: diff against the old 22-startup.md read; `STPOS`/`STREC` addresses, `CDRTC`, `DRVR` path, `INFO`'s L, `STBOOT` timing checked; finding 8.
- 22: diff read; citations and the EXPAND 1 sentence checked; captures rerun; no findings.
- 23: diff read; RAM-check sentence and citations checked; no findings.
- 24: diff read; `CHPOS` `BFE4h`, `PRGCODE` `BF56h`, A: search sentence, function 47/108 dispatch, citations checked; no findings.
- 25: diff read; 41 test files, 25 asserting empty `violations`, `fixtures.mjs` and `machine.mjs` citations checked; captures rerun; finding 7.
- All 14: leftover-word search (PRL, MAIN, function 50, `MOVE`/`XMOVE`, `ABI*` entries, ABI 4, format 3, profiles, mount entry, old TED pin, functions 44 to 48 and 99, user number in the prompt) finds none current. Every "Chapter N" names the right chapter, and the one link (`04-cards-and-volumes.md#recovery-after-a-power-cut`) resolves.
