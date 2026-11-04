# Check of the TEC-OS book at 58d4345: chapters 12 to 17, appendices A to C

Read-only. Code read at `git -C ~/projects/tec-os show 58d4345:PATH`; addresses
from `rev58d/dist/tecos.d8.json`, `tecos.census.json` and `docs/memory-map.md`.
Runs were made on a copy of `rev58d` under the memory guard.

## Findings

1. **13-memory-map.md:136-138.** "Two of the `MOUNT` routine's scratch bytes
   follow ... the count `MNTCNT` and `MNBUF`, 32 bytes". `MNTCNT` is 1 byte and
   `MNBUF` 32 (`src/ram.asm:52-53`, `BC42h` and `BC43h–BC62h`), so 33 bytes
   follow. Correction: "Two of the `MOUNT` routine's scratch areas follow".

2. **13-memory-map.md:140.** "the seven vectors into the display driver". For
   `CRT:` the table is the ROM's `PIBLK`, not a driver's (`src/console.asm:62-73`,
   `src/pico.asm:36-39`). Correction: "the seven vectors into the display's
   table".

3. **14-reset-and-boot.md:305-307** (left unchanged, now untrue). "`HWVREL` ...
   so that the driver's registers, its interrupt among them, are restored". No
   driver is involved at 58d4345. `HWVREL` restores through `PIVEC`, the ROM
   console's table (`src/services.asm:121-129`, `src/pico.asm:36-39`).
   Correction: "the console's registers".

4. **17-ccp.md:303-306.** "A name run into its width, a width after any other
   name, any other width and a board with no PICO9918 console are bad commands,
   and the error names the width". For a name run into its width the error
   names the whole argument, as the chapter's own capture shows (`CON CRT80`
   gives `CRT80?`). `CMDCON` starts with `ARGSKIP`, and a word that matches no
   name goes to `BADCMD` from `CONNO`. Only after a space does `CMDSKIP` move
   `CMDSTRT` to the width (`src/cpm/ccp.asm:1066-1075`, `1085-1086`,
   `1115-1119`, `316-322`). Correction: "... are bad commands. The error names
   the width, or the whole word for a name run into its width".

5. **17-ccp.md:326-328.** "It is kept in `PIBLK`, which a warm boot leaves ...
   (`src/pico.asm:46-62`, Chapter 15)". Chapter 15 never says that the width
   outlives a warm boot. Chapter 14 says it (14-reset-and-boot.md:340-342), and
   so does `src/ram.asm:39`. Correction: "(`src/ram.asm:36-39`,
   `src/pico.asm:46-62`, Chapter 14)".

6. **appendix-b-rom-services.md:182.** `drivers/glcd.asm:333-334`: line 333 is
   blank and 334 holds only the first half of `GLGLY`'s comment. The reversal
   is stated across 334-335. Correction: `drivers/glcd.asm:334-335`.

7. **appendix-b-rom-services.md:176-177** (left unchanged, now inexact).
   `PUTAT` writes "through the driver's cell routine". On `CRT:` the cell
   routine is the ROM's `TMSPUT`, from `PITPL` (`src/pico.asm:17`), and only
   on `UC1:` is it a driver's. Correction: "through the display's cell
   routine".

8. **appendix-b-rom-services.md:238-239.** "`B` is not 3, `UC1:` has a table
   already, or there is no matrix keyboard" uses an Oxford comma, which the
   style rules forbid. Correction: drop the comma before "or".

9. **15-bios-and-console.md:367-370.** "`VIDHOOK` then drops the table and puts
   the serial terminal in `CONMOD`. The field still names `UC1:`". That holds
   only when `UC1:` was the console. After a give-way the field names `CRT:`,
   and the next console call takes `CRT:` again (`src/video.asm:81-92`). The
   behaviour that follows is KE-190, already reported. The prose only needs to
   be exact. Correction: "The field still names the console it named, `UC1:`
   unless the GLCD gave way, so the next console call acts on it ...".

10. **12-rom-and-build.md:250-251.** "40 or 32 through `CON` (Chapter 15)".
    Chapter 17 describes `CON`'s width (17-ccp.md:301-328). Chapter 15 only
    names `PICOWID` and points on to Chapter 17. Correction: "(Chapters 15 and
    17)" or "(Chapter 17)".

11. **13-memory-map.md:114** (minor). The row label "SD, keyboard, graphics LCD
    and console state" for `BF33h–BFFFh` leaves out the loader's, startup's and
    chained line's state and the 14 bytes of `MOUNT` scratch. The chapter's
    prose below the table describes them all. Appendix C's matching row
    (appendix-c-memory-map.md:150) names them, but reads "consoles' ... the
    console's state", which is awkward. Correction for C: "... keyboard's, the
    two consoles' tables, the loader's, startup's and chained line's state, the
    console's bytes and the rest of the `MOUNT` routine's scratch".

12. **16-bdos.md:412** (style). The changed table row ends "set it; `LOGDONE`
    clears it", with a semicolon. Correction: "set it, and `LOGDONE` clears
    it".

No other finding. Every address, span, byte count, TPA, stack and timing in
the nine files agrees with the map, the census, `docs/memory-map.md` and the
runs. No gone label is named as current, and no `drivers/pico.asm` citation
remains. `PICO.SVC` appears only at appendix-b-rom-services.md:241, as an older
card's file that the ROM refuses.

## Evidence summary

- **Workspace rows** (13's tables, the four tables in appendix C, 17's CCP
  table): each start address and length was checked against the D8 symbol of
  its label. These include `PIBLK` `BBE3h`–`PIROWT`+48 `BC41h` (95 bytes),
  `MNTCNT` `BC42h`, `VCLAIM` `BCC3h`, `CONMOD` `BCC4h`, `CCPCLR` `BDB7h`,
  `STKGUARD` `BE4Bh` (11), `CSTKBAS` `BE56h` (32), `STFLAG` `BF62h`,
  `CHPOS` `BFE4h`, `RXFULL`–`VCURV` `BFE5h–BFF1h`, `MNTBLK`–`MNTLN`
  `BFF2h–BFFFh` and `WSEND` `C000h`. Derived figures were also checked:
  1,049-byte fixed workspace, 329 bytes cleared by `CPMINIT`, 202 kept below
  `CCPCLR`, CCP `DCE2h–E6A0h` (2,495), BDOS `E6A1h–F5BFh` (3,871, services from
  `F5C0h`), `FONT` `C179h–C478h` (768), `B9A4h` entry, TPA 47,268 and 46,564,
  and the largest program 47,104, 164 below the TPA.
- **Captures rerun** on the 58d4345 copy:
  - `17-ccp.md:308`, `CON PICO 40` and others, on the pico board (new in the
    diff): matches.
  - `17-ccp.md:386`, `426` and `518`, on `build/ccp.img` built from the
    chapter's own commands: match. The `3B>` prompts are confirmed.
  - The other fences in these files match `recap58d.json` once the boot
    preamble is set aside: 14:216, 14:285, 15:112 (exact), 16:162, 16:179,
    17:93 and 17:410.
  - The `npm run build` and `dist:` lines in chapter 12 match
    `build58d.out`.
- **Timings rerun:** chapter 14's cold and warm boot figures (1,373,385;
  7,068,146; 32,482, 7,327, 8,437, 14,272; 115,826; 1,035,509; 9,165,367;
  `MEMINIT` 346,677) were reproduced. So were appendix B's (`FONT` 194, stack
  4; claim 1,232; release 217,252, 187,492 and 147,031; `PUTAT` 509 and
  36,709 a cell; stacks 22, 18, 18 and 14; `INFO` 244; past `TNCOUNT` 58).
- **Moved from `drivers/pico.asm`:** each new citation was read at 58d4345 and
  shows what its sentence says: `src/pico.asm:253-266` (`VPAIR`), `15-44`,
  `22-24`, `27-44`, `40-41`, `46-62`, `64-66`, `64-106`, `108-134`,
  `136-139`, `170` and `197-241`. The exception is finding 6, which is
  `glcd.asm`.

## Per file

- **12-rom-and-build.md:** regions, figures, build lines and the font passage.
  71 citations, 54 changed (all read), 0 captures, 2 output lines checked
  against the build.
- **13-memory-map.md:** every page-zero, workspace, console and stack row.
  80 citations, 56 changed (all read), 24 unchanged (all read).
- **14-reset-and-boot.md:** boot steps, stacks, timings rerun and the reset
  passage. 89 citations, 68 changed (all read), 21 unchanged (all read),
  2 transcripts.
- **15-bios-and-console.md:** `CONSW`, `CONMD`, `PISTART`, `SVDRV`,
  `VIDHOOK`, the LCD words. 95 citations, 55 changed (all read), 40 unchanged
  (all read), 1 transcript.
- **16-bdos.md:** functions 44, 46 and 99, the entry and the figures.
  150 citations, 137 changed (all read), 2 transcripts.
- **17-ccp.md:** `CON`, the prompt, `STFLAG`, `TNENODV`, `DIR` by function
  46, the CCP table. 123 citations, 116 changed (all read), 6 transcripts
  (4 rerun).
- **appendix-a-bdos-functions.md:** entries 44 to 48, 99 and 108, and the
  ranges. 86 citations, 84 changed (all read).
- **appendix-b-rom-services.md:** ABI 5.1, the service table, `DRVR`, the
  `PICO` record, `FONT`, timings rerun. 61 citations, 41 changed (all read),
  20 unchanged (all read).
- **appendix-c-memory-map.md:** every row against the D8 map and the census,
  and the label command's output. 42 citations, all read.

## Resolved

All twelve findings were applied in f0a9901.
