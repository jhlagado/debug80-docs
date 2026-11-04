# Review of the TEC-OS book at 621201d: chapters 12 to 17 and Appendices A to C

The book is on branch `tec-os-book` at 56864d0. Every file was read as `git diff e29a5f9 HEAD`, and the code as `git archive 621201d`. Captures ran on a copy of `$S/rev621`, under mem-guard.

## Findings

1. **17-ccp.md:42.** The claim is "Most of the calls that name one of the CCP's two FCBs, 22 of them, go through `DOSSEQ`."
   The evidence: at 621201d there are 24 `CALL DOSSEQ` sites. `ccp.asm` has 3, `ccpfile.asm` has 14 and `ccpcmd.asm` has 7. At 58d4345 and at e7f7c49 there were 22. KE-179 and KE-201 add two closes: `CPWERR`'s at `src/cpm/ccpfile.asm:645-646` and `SAVEWER`'s at `src/cpm/ccpcmd.asm:273-274`.
   Correction: "24 of them".

2. **15-bios-and-console.md:238.** The citation `src/keyboard.asm:9-12` is given for "Key number k is row k / 8, bit k mod 8. Keys 0, 1 and 2 are Shift, Ctrl and Fn, keys 3 to 6 are the arrows and key 7 is Caps Lock".
   The evidence: at 621201d, lines 9-12 are `KBPOLL`'s header. The key layout is the comment at `src/keyboard.asm:4-7`, where the old citation pointed and where it still is. The script took the comment above the next code (cite-flags13: `COMMENT src/keyboard.asm:4-7 -> 9-12`).
   Correction: `src/keyboard.asm:4-7`.

3. **13-memory-map.md:332.** The citation `src/cache.asm:17-19` is given for "The cache's routines ... state the rule at their heads", the rule being no stack while EXPAND 1 is in view.
   The evidence: lines 17-19 are `CTADR`'s header, which says nothing about the stack. The rule is in the file's header at `src/cache.asm:10-13`: "Nothing here uses the stack while EXPAND 1 is in view". Those lines are unchanged since 58d4345, and the old citation pointed there (cite-flags13: `COMMENT src/cache.asm:10-13 -> 17-19`).
   Correction: `src/cache.asm:10-13`.

4. **15-bios-and-console.md:254 and 264.** These are minor range errors.
   - `KBEVAL` is cited as `src/keyboard.asm:55-108`. The label `KBEVAL` is at line 59, since lines 55-58 are the end of `KBSTEP`. The Caps Lock toggle that the paragraph describes is `KBCAPS`, at 110-115, which falls outside the range. The old citation began at the label.
     Correction: `src/keyboard.asm:59-115`.
   - `KBASCII` is cited as `src/keyboard.asm:117-180`, but the file has 179 lines.
     Correction: `src/keyboard.asm:117-179`.

5. **15-bios-and-console.md:128-130.** The claim is "so on a board with both displays the GLCD takes the console only through `CON UC1` or a load typed after `CON TTY`."
   The evidence: `SVDRV` refuses a table only when `STFLAG` is `FFh` and the IOBYTE's `CON:` field is `CRT:` (`src/services.asm:371-380`). So a `GLCD.SVC` line in `STARTUP.CMD` that follows a `CON TTY` line installs, and takes the console through `SVCGO` (`src/loader.asm:525-533`). The load doesn't have to be typed.
   Correction: "or a load after `CON TTY`".

Nothing else was found. These checks found no error:

- **Fixed behaviour.** KE-189, KE-190, KE-191 and KE-200 are stated as fixed wherever these files touch them (15:127-132, 15:368-386, 17:384-388, B:241-250). No passage states the old behaviour.
- **Other changes.** The book matches the code for:
  - `SAVE`'s count, 255 and the TPA's page (`ccpcmd.asm:183-213`).
  - `SAVE` and `COPY` closing the file on a write error (`ccpcmd.asm:261-278`, `ccpfile.asm:644-649`).
  - `COPY`'s `ENDCHK` (`ccpfile.asm:577`).
  - `^S` then `^C` (`bdoscon.asm:204-214`).
  - Function 22's `EX` and `S2` (`bdosfile.asm:301-347`).
  - `ADVEXT`'s close (`bdosrec.asm:66-70`).
  - The DMA after `ZEROBLK` (`bdosrec.asm:477-527`, `bdoslog.asm:64-78`).
  - `ALLOCBLK`'s mark (`bdosrec.asm:442-459`).
  - `ECHOCOL` (`bdoscon.asm:136-166`).
  - The terminal's `J` and `K` (`term.asm:323-347`).
  - `ESC` and any byte but `[` (`term.asm:150-161`).
  - `PUTAT`'s cursor (`console.asm:119-131`, `169-187`).
  - The clock's protect (`services.asm:281-291`).
  - `PZINIT` running once (`boot.asm:81-100`).
  - The `IOBYTE` that `PISTART` writes (`pico.asm:45-47`).
  - `SVCRA` after a refused record (`loader.asm:94-95`).
  - `dist/`'s ROM after a build (`tools/build.mjs:316-330`).
- **Gone labels.** No gone label (`MAKESRCH`, `SDI8R`) is named in these files.
- **Addresses and figures.** All of these agree with `dist/tecos.d8.json`, `dist/tecos.census.json` and `docs/memory-map.md`:
  - The ROM: regions, 15,942 used and 442 free, and SHA-256 `bee18e1e…`.
  - The CCP, `DD0Ah–E6E2h`, 2,521 bytes, and the BDOS, `E6E3h–F5E0h`, 3,838 bytes.
  - The BDOS's block, `BE76h–BEFFh`, and the CCP's RAM table, every row.
  - Every name and span row in Appendix C and Chapter 13, checked by a script against the symbol map.
  - The stacks, 40, 32 and 54, and the TPA, 47,268.
  - The 329 bytes `CPMINIT` clears and the 202 bytes below `CCPCLR`.
  - `WSBASE` at `BAE7h`, 1,049 bytes.
- **Timings.** Chapter 14's timings were rerun on the model: cold boot 1,371,183, block 0 219,144, first `CONIN` 7,067,402, clean warm boot 32,482, warm boot after `SAVE` 115,898, `RESET13` 1,036,661 and drive B's first scan 9,167,671. All match. Appendix B's `PUTAT` figure on the GLCD, about 36,900 per cell, matches the measurement in `ab13/svc621.json` (36,909).
- **Style.** No semicolon, em dash or Oxford comma was found in the added prose.

## Per file

- **12-rom-and-build.md.** 48 changed citations read at 621201d, and 24 unchanged ones (`tools/build.mjs`, `tools/media.mjs`, `rom.asm`, `abi.asm`, `text.asm`, `starter.mjs`, `format.mjs`). The build line and the SHA-256 were checked against `build621.out` and the census. No transcript. No finding.
- **13-memory-map.md.** 75 changed citations read, including all 10 COMMENT, 3 HEADER and 6 NOTFOUND entries, and 5 unchanged ones (`stacks.test.mjs`, `history.asm`). Every address row was checked by script. No transcript. Finding 3.
- **14-reset-and-boot.md.** 91 changed citations read, including the COMMENT and NOTFOUND entries and both AMBIG `EI` sites (`console.asm:242`, `284`), and 1 unchanged one (`warmboot.test.mjs`). The timings were rerun. Two transcripts were compared with recap621 and both are the same. No finding.
- **15-bios-and-console.md.** 90 changed citations read, all of them, with 8 unchanged ones. One transcript was compared with recap621 and is the same. Findings 2, 4 and 5.
- **16-bdos.md.** 152 changed citations read: every split-file citation across `bdos.asm`, `bdoscon.asm`, `bdosfile.asm`, `bdosrec.asm`, `bdosfn.asm` and `bdoslog.asm`, plus the six-file table against `rom.asm:30-35` and each file's header. 4 unchanged ones were read, `geom.asm` among them. Two transcripts were compared with recap621 and both are the same. No finding.
- **17-ccp.md.** 127 changed citations read, all of them, with 1 unchanged one. Seven transcripts in all:
  - The new `SAVE 320` and `SAVE 185` transcript was rerun on the starter card and is the same.
  - The three on `build/ccp.img`, at lines 416, 456 and 548, were rerun after building the card by the chapter's own steps. All three are the same.
  - Three were compared with recap621 and are the same.

  Finding 1.
- **appendix-a-bdos-functions.md.** 88 changed citations read, all of them. No transcript. No finding.
- **appendix-b-rom-services.md.** 55 changed citations read, all of them, including the AMBIG and HEADER entries, and 8 unchanged ones. The RTC and `PUTAT` figures were checked against the writer's measurement. No transcript. No finding.
- **appendix-c-memory-map.md.** 39 changed citations read and 3 unchanged ones. Every address row was checked by script. No transcript. No finding.

## Resolved

All five findings were applied in 3baf568: 24 `DOSSEQ` calls, `src/keyboard.asm:4-7`, `59-115` and `117-179`, `src/cache.asm:10-13`, and "a load after `CON TTY`".
