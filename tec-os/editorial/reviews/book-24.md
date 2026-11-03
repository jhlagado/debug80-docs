# Review of absorb 4: chapters 12, 14, 16-20, 22-26 at 4d6eeaa

Book worktree `~/projects/debug80-docs-tec-os` at 8a2fe28, diffs read from 591a112. Runs on a
private copy, `$S/rv7/w`, of `$S/revks37` (ROM 6f3e7467..., starter card 915684d5...), with
every card made fresh from that copy's `dist/starter.img`. Old figures were compared against
`$S/revks34` (60cfbdc) with the same scripts. Peak memory 198 MB.

## The two KS34 claims, by run

Run on the 4d6eeaa ROM with the harness of `test/svc.test.mjs` (`$S/rv7/w/test/rv7.test.mjs`):

- **A vector jumping to `PZTOP` itself gets its default: confirmed.** No service in (`PZTOP` =
  stub = `B815h`): `JP B815h` and `JP B814h` became seven zeros and `RET`, and `JP B816h` kept its
  jump. A `JP B815h` at `0038h` got `EI`, `RETI`. With one service in (`PZTOP` = `B700h`):
  `JP B700h` and `JP B6FFh` got the default, `JP B701h` was kept, and `JP B814h` (the stub's
  page below the stub) got the default. Chapter 14 (lines 263-265) and Chapter 20 (lines
  516-519) say this correctly.
- **A failed `INIT` frees its claimed slots: confirmed.** With `0008h` claimed (flags 3) and
  `INIT` writing `JP ABIHW` (`C00Ah`, outside its pages) there and then failing, the load gave
  carry with `SVCRC` 1, the word at `0006h` and `PZTOP` both went back to `B815h`, `0008h` was
  back to its default, and a later load claiming `0008h` succeeded. With the slot unclaimed
  (flags 1), the same `JP C00Ah` stayed, as Chapter 20 says ("A jump the service set outside its
  pages in a vector it didn't claim passes the bound"). Chapter 20 (lines 428-432, 528-530) is
  correct.

## Chapter 12's build output

The four lines at `12-rom-and-build.md:260-263` match the build's real output at 4d6eeaa
character for character (`debug80: ROM 14947/16384 bytes, TPA $0100-$B814 (46869 bytes), sha256
6f3e7467744ec00e`, and the same for `debug80t40`, `debug80g32` and `board`). The fifth line the
build printed, `dist: 4 ROM profiles, 6 starter files, starter.img`, is `npm run media`'s
(`tools/media.mjs:229`), not `npm run build`'s, so its absence from a block introduced as `npm run
build`'s output is right. The census (`dist/tecos-debug80.census.json`) gives used 14,947, free
1,437, code `C33Eh`-`FA62h` 14,117, and all four ROMs hash to `6f3e7467...82f1`, as the chapter
says.

## Findings

1. **`20-hardware-services-and-service-loader.md:378-379`.** Claim: "The sweep in `PZINIT` takes
   any restart vector `INIT` has set, since the new pages lie below `PZTOP`". Evidence: a run of
   `INIT` that writes `JP C00Ah` at `0008h` and then jumps to 0 leaves `C3 0A C0 00 00 00 00 00`
   at `0008h` after the warm boot, claimed (flags 3) or not (flags 1), and a later load claiming
   `0008h` is then refused (carry, `SVCRC` 0) until a reset (`$S/rv7/w/test/rv7b.test.mjs`). The
   sweep keeps a jump above `PZTOP` (`src/boot.asm:244-252`), and warm boot runs no `SVCFRE`
   (`src/boot.asm:59-82`). The changed line drops "page" but keeps the over-broad "any".
   Correction: "takes any restart vector `INIT` has pointed into its pages, since the new pages
   lie below `PZTOP`".

2. **`26-host-model.md:301-304`.** Claim: "A card that fails the check is left as it is ... The
   reason is no drive A, a `.DRV` display file from an older TEC-OS, no such driver or a driver of
   another format." Evidence: with the PICO9918 chosen, a missing `PICO.SVC` or one of another
   format matches `prepareCard`'s test and is written over before the check runs again
   (`host/card.mjs:57-64`), so those two reasons reach the terminal only with the graphics LCD
   chosen. The paragraph now states the write two sentences earlier, so the list reads as true
   for both displays. Correction: "The reason is no drive A or a `.DRV` display file from an older
   TEC-OS, and with the graphics LCD also no `GLCD.SVC` or one of another format."

3. **`12-rom-and-build.md:189-190`.** Claim: "`npm run media` uses it to build the starter card's
   `MOUNT.COM`". Evidence: `media.mjs` also builds `PICO.SVC` and `GLCD.SVC` (and the 40 and
   32-column drivers) through `makeSvc` (`tools/lib/starter.mjs:12-13`, `:25`), which assembles
   through the same module at `0100h` (`tools/lib/svc.mjs:9`, `:104`). The sentence names one of
   three files on the card that the module builds. Correction: "uses it to build the starter
   card's `MOUNT.COM` and, through `makeSvc`, its two drivers".

4. **`19-block-cache.md:101-102`.** Claim: "`DIR`'s two BIOS reads are all hits". True: at the
   first prompt `DIR` on A makes two BIOS reads, track 0 sectors 0 and 1, to `DIRBUF`, with no
   cache fill (run, `$S/rv7/scripts/dirlog.mjs`). The wording is wrong only for two: "all" was
   right for the old four. Correction: "`DIR`'s two BIOS reads are both hits".

No other finding.

## Timings remeasured (Chapters 14 and 22)

All by run on the serial board unless stated, and each reproduces the book exactly once the
measuring instruction is taken off; the same scripts on `revks34` reproduce the old figures:

| Figure | Book | Run |
| --- | ---: | ---: |
| First `CONIN` after reset (14:106) | 8,842,854 | 8,842,854 |
| Warm boot, unchanged (14:358) | 32,025 | 32,025 |
| CCP entry within it (14:364) | 14,086 | 14,086 |
| Warm boot after `SAVE 8 X.COM` (14:366) | 112,647 | 112,647 (extra 80,622) |
| Function 13 (14:370) | 1,033,091 | 1,033,108 less the `CALL`'s 17 |
| First scan of B (14:373) | 9,174,256 | 9,174,287 less 31 for `LD C`, `LD E`, `CALL` |
| `STBOOT` on the web page's board (22:74) | 5,864,134 | 5,864,134 |

## Transcripts rerun

`18:324` (`MOUNT C: WORK` ... `MOUNT`), `23:56` (`DIR *.SVC` with `^W` and backspaces, screen),
`25:96` (`start.img` made from a fresh starter card by the chapter's three commands): each
identical to the book. Also run for prose claims: `PICO.SVC` loaded twice on the pico board
gives `PICO.SVC?` the second time and `SERVICES` lists one `PICO` (22:243); `MOUNT.TXT` runs
`MOUNT.COM` and lists the volumes (17:153).

## Per file

- **12**: line numbers, census figures, the four build lines against the real output, the
  four ROM hashes, `media.mjs` pins and copies (27-36, 173-174, 178-183, 197-200),
  `assemble.mjs` use: finding 3.
- **14**: `RSLCAP` at 4d6eeaa (floor test moved ahead, lines 117-130), every `boot.asm` citation
  (84-138, 131-138, 140-183, 185-213, 215-274, 239-264, 244-252), the sweep's bound by run, and
  every timing by run: no finding.
- **16**: `BDOSBAS` `E113h` and `F057h` from the map, `boot.asm:218-230`, `svc.asm:189-192`: no
  finding.
- **17**: `CCPBAS` `D7B4h`-`E112h`, `boot.asm:215-217`, `svc.asm:28-58`, `:60`, `:348-373`,
  `:375-408`, `MOUNT.TXT` by run: no finding.
- **18**: `MOUNT` rewording, `mount.asm:160-209`, capture rerun: no finding.
- **19**: the two `DIR` reads by run, `boot.asm:149-155`: finding 4.
- **20**: every changed `svc.asm`, `boot.asm` and `svc.test.mjs` citation line by line; `SVCFRE`
  and the bound by run; a warm boot inside `INIT` by run: finding 1.
- **22**: every `svc.asm` citation of `STBOOT`, `STLINE` and `STDONE`; `host/card.mjs` and
  `web/src/main.mjs` citations; the `withoutDisplay` examples traced through the code; `DEMO`'s
  row 3 against `demo.asm`; `STBOOT`'s time and the second `PICO.SVC` load by run: no finding.
- **23**: capture rerun, `boot.asm:149-160`, `:131-135`: no finding.
- **24**: `Checked against` only; `diag/` unchanged between 60cfbdc and 4d6eeaa: no finding.
- **25**: startup example remade and rerun, `svc.asm:425`, `:435-438`, `:439-441`, `:455-459`:
  no finding.
- **26**: `test/inputs.json` entries and which tests read them, `web/build.mjs:14`, `:31-43`,
  every changed `main.mjs` and `card.mjs` citation: finding 2.

No leftover `README.TXT`, `VOLS`, `EDIT`, `TERM`, `DEMO`, `PROBE`, `PICO40` or `PICO32`
presented as on the starter card in these files (`12:65` names `VOLS.COM` on an older card;
`22:308` names `PICO40.SVC` and `PICO32.SVC` among the page's files, both correct). None of the
files holds a link, so no anchor is broken.
