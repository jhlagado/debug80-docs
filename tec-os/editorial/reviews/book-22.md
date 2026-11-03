# Check of every `tec-os/` file changed since bd497a5, chapters 7, 13 and 21 aside, at TEC-OS 60cfbdc

Book worktree `~/projects/debug80-docs-tec-os` at 7998e04, branch `tec-os-book`. Source read
with `git show 60cfbdc`. Runs made on a private copy of `$S/revks34` (`$S/rv5/w`), ROM SHA-256
61fced03, starter card SHA-256 e2a3f041. Cards were remade from `dist/starter.img`. No chapter
changed, nothing committed. Scripts and outputs are in `$S/rv5`.

## Findings

1. **`tec-os/09-hardware-services.md:682`.** Claim: a release with the PICO9918 as the
   console "took 213,242 T-states". Evidence: `$S/rv5/pico.mjs` gives 213,242 at ea9c1c0,
   which confirms the method, and 216,030 at 60cfbdc. Appendix B now says 216,030, so the
   two chapters disagree. Correction: "216,030 T-states on the model, about 54 ms".

2. **`tec-os/09-hardware-services.md:816-820`.** Claim: the table gives `PUTAT` 423,
   BIOS `CONOUT` 714 and BDOS function 2 at 3,860 on the PICO9918, and `PUTAT` is "about
   nine times faster than the BDOS". Evidence: the same script follows the chapter's
   method: 60 cells at 80 columns, and characters in the middle of a row with no scrolling.
   At ea9c1c0 it reproduces 423 (29709/60 at 60cfbdc against 25389/60 at ea9c1c0) and 714.
   At 60cfbdc it gives `PUTAT` 495, matching Appendix B, and `CONOUT` 786 for every
   character. For function 2 the run gives 3,844 or 3,878 at ea9c1c0 and 3,906 or 3,940 at
   60cfbdc. Each character's cost rose by 62 T-states, so the chapter's 3,860 becomes
   3,922. The `VPAIR` mask costs each path 62 to 72 T-states. 3,922 / 495 is 7.9.
   Correction: 495, 786 and 3,922 in the PICO9918 column, and "about eight times faster".
   The graphics LCD column has no PICO9918 call on its path and stands.

3. **`tec-os/18-sd-card-and-volumes.md:346-347`.** This passage is unchanged, and it is
   now wrong. Claim: "with four of them the TPA is 46,086 bytes, 768 fewer than the starter
   card gives". Evidence: `dist/tecos-debug80.census.json` gives `fourG8M` an entry at
   `B555h` and a TPA of 46,165. 46,869 − 46,165 = 704. Chapter 4 and Appendix C already
   carry the new figures. Correction: "46,165 bytes, 704 fewer".

4. **`tec-os/20-hardware-services-and-service-loader.md:534-535`.** Claim: "A warm-boot
   hook can't do it, since a hook chains into `WBOOTR` and no service code runs after
   that." Evidence: a hook on another BIOS entry runs after every warm boot. `HOOK.SVC`
   (svcdemo, `V_HOOK`) hooks `CONOUT`, and its hit count at `B763h` rose from `04h` to
   `B4h` across later prompts. Chapter 10's `COUNT` transcript shows the same thing. The
   sentence is true only of the warm-boot hook itself. Correction: "A warm-boot hook can't
   do it, since it chains into `WBOOTR`, whose first instruction is `DI`; only code that
   runs later, such as a program or a hooked BIOS entry, can."

5. **`tec-os/14-reset-and-boot.md:49-50`.** Claim: "`PZINIT` writes it at `0038h`
   (`src/boot.asm:268-273`)". Evidence: lines 265-273 are in `PZSWP`. `PZINIT` runs on
   into `PZSWP`, and `UNLOAD` and a failed `INIT` call `PZSWP` directly
   (`src/svc.asm:67`, `src/svc.asm:256`). `PZSWP` writes the `EI` only when `0038h` kept no
   `JP` (`src/boot.asm:265-267`). The same chapter's lines 252-259 say this correctly.
   Correction: "`PZSWP`, which `PZINIT` runs into, writes it at `0038h` unless a jump is
   kept there (`src/boot.asm:265-273`)."

6. **`tec-os/20-hardware-services-and-service-loader.md:221-223`.** Claim: "A service sits
   directly under the top of the TPA, so it has to hold a BDOS entry at the word's
   address". The service lies above the TPA, and its first byte becomes the new top, so the
   sentence reads backwards. Correction: "A service takes the pages directly below the old
   top, and its first byte becomes the new one, so it has to hold a BDOS entry at the word's
   address".

7. **`tec-os/10-prl-programs-and-services.md:288-290`** (minor). The edit left an
   unwrapped line of 112 characters at line 290. The content is correct.

Not verified: the stack census and base figures in Chapter 20's table (32, 16 and 16, and
32, 16 and 22). They come only from `test/stacks.test.mjs`, which this check doesn't run.
The limits 8, 12 and 6 agree with `src/data3.asm:112` and with the header bytes a load
writes at `B70Ch`.

## What each file was checked for

- **01:** the TPA figures, `B815h`, `B200h` and 45,312, against the census and a pico-board
  boot (`B200h`).
- **02:** 3,093 = 46,869 − 43,776, read from a both-drivers boot (`AC00h`).
- **03:** `B815h` and the 183-page `SAVE` limit, by arithmetic from the high byte.
- **04:** `B555h`, 46,165 and 704, against `fourG8M` in the census.
- **05:** the table rerun on the serial board, the pico board and `both.img` (`B815h`,
  `B200h`, `AC00h`), the 21 bytes and the `UNLOAD` sentence.
- **06:** the sweep sentence, against `PZSWP` and runs.
- **08:** the interrupt sentence, against `RXBITS`, `TXBYTE` and `VPAIR`. Every
  control-port pair in `PICO.SVC` goes through `VPAIR`. The ROM's own pairs in `tms.asm`
  are in the cold-boot probe only, with interrupts off.
- **09:** the timings remeasured (findings 1 and 2). The 22-byte deepest stack stands.
- **10:** both changed transcripts rerun (46869, 46592 and the `COUNT` run) and identical.
  The removed `TAS` warning was retested: `COUNT.SVC`, then `TAS AREA`, leaves the header
  at `B700h` untouched, and `SERVICES` and `UNLOAD` work. The claims, flags and rule
  paragraphs were tested by runs (below).
- **11, 24, 26 and Appendices A and F:** only the `Checked against` line changed.
- **12:** the ROM regions, 14,937, the TPA and the SHA-256 against all four census files;
  the build's print format against `tools/build.mjs:362-366`; the serial counts
  49, 105, 50, 70 and 77 against `src/gen/config.asm`. Every moved citation's text matches.
  `cardLayout` (239-243) now gives `alvBase - 3`, which matches the text.
- **14:** cold boot 1,284,328, 9,448 and 8,934,115; warm boot 32,024 and 14,085; 123,795;
  1,044,290; 9,174,102, all rerun and identical. `RSLCAP`'s conditions against
  `src/boot.asm:117-131`. The sweep paragraph against `PZSWP`. Finding 5.
- **15:** `TXBYTE` 9,293 and `BCONOUT` 9,448 rerun; 420 characters a second; the 65 and 52
  T-states counted by hand from `IFFGET`; `RXHALF` 70 from the build formula.
- **16:** `BDOSBAS` `E111h`, `F055h` and 3,909 against the d8 map; the entry-jump sentence
  and its three citations.
- **17:** `CCPBAS` `D7B2h`–`E110h`; 46,848 and 21; the service-page limit against
  `src/prl.asm:48-53`.
- **18:** citations only, all identical in content. Finding 3, in unchanged text.
- **19:** 13,698, 226,501, 259/1,979, 6,641,268 and 1,342,939, 30,833,645, 9,921,552,
  1,111,332 and 217,411 rerun and identical. 235,391 and 4,808 hold the same differences
  as before. The `IFFGET` passage was checked against `src/cache.asm:17-41`.
- **20:** "A service's entry" and "Restart vectors" read in full against `svc.asm`,
  `boot.asm` and `prl.asm`. Each claim was tested on the model with svcdemo variants on a
  remade card (`$S/rv5/claims.mjs`):
  - A claim of `RST 2` is refused when the slot holds `JP`, both from a second service and
    from a finished program's `JP C00Ah`, with `(0006h)` unchanged.
  - A vector into the service's pages is kept across a program's warm boot, and its
    `RST 10h` reached the handler (`RESULT` = `5Ah`).
  - After `UNLOAD` the claimed slot has its default, and so does an unclaimed `0038h`
    vector into the pages (`FB ED 4D`). An unclaimed `0038h` into the pages is kept over a
    warm boot.
  - A failed `INIT`'s vector and a warm boot inside `INIT` both leave the default. Function
    47 from `INIT` rolls the load back; from `REMOVE` the service stays listed.
  - A `TPA` jump at `0028h` is swept.
  - `SMASH` (SP from `(0006h)`, three pushes) with a service in leaves the header intact,
    and `SERVICES` and `UNLOAD` work.
  - The in-memory header table matches the bytes after a load.
  - `TAS.COM` holds `2A 06 00 F9` at `010Dh`, and its first 10,295 bytes have the SHA-256
    the chapter gives.

  Every new citation was read. Findings 4 and 6. The stack table is in the note above.
- **22 and 23:** `STBOOT` 5,875,333 rerun. Citations are identical in content.
- **25, Appendix E and Appendix G:** citations only, identical in content apart from those
  checked against the new `RXBITS` and `build.mjs`.
- **Appendix B:** `VIDEO` stack 12, claim 1,167, release 216,030, release with the console
  on the serial terminal 146,745 (rerun: 145,685 at ea9c1c0, 146,745 at 60cfbdc), `PUTAT`
  stacks 14 with no cursor and cell 495, all rerun. The `pico.asm` citation now covers
  `GFXREG`'s `JP VPAIR`, which agrees with the text.
- **Appendix C:** the regions, `0005h`, the restart vector rows and the `PZSWP` sentence,
  against the census and the code.
- **Appendix D:** citations only, identical in content.
- **STYLE.md and terms.md:** the figure and the definition agree with the code.

Search for leftover words in all scoped files: no `xx06h`, `B806h`, 46,854, `KE-136` or
`0037h` (apart from Appendix C's correct `0008h–0037h` row). `.DRV` appears only in
old-card text. No `DRIVERS`, "mount service", "ROM services" or "the table at `C003h`".
"Module" is used only of JavaScript modules.
