# Review of appendices A to H, terms.md and STYLE.md at 60e0768

Scope: `tec-os/appendix-a` to `appendix-h`, `tec-os/editorial/terms.md` and
`tec-os/editorial/STYLE.md` in `~/projects/debug80-docs-tec-os` at 51ea0e9.
Appendices B and H were read whole; the others by `git diff 4445919 HEAD`.

Every run was on a copy of `$S/rev36a` at `$S/r12`, which has the same
`src/abi.inc`, `src/hwsvc.asm`, `src/vol.asm`, `src/svc.asm`, `src/glcd.asm` and
`drivers/pico.asm` as 60e0768. Its `dist/tecos.rom` and `build/tecos/tecos.rom`
are the same bytes, SHA-256 `f26c3215…7186`. The services were timed by
`$S/r12/r12-svc.mjs`, which calls each one at `ABICALL` the way
`test/hwsvc.test.mjs` does, from the `JP` to the return, and records every
write below the return address. It ran once under mem-guard, with a peak of
144 MB. The EXPAND 1 cards were made fresh from `dist/starter.img` by
`$S/r12/r12-exp1card.mjs`.

## Findings

1. **`terms.md:126`, "host model", Explained in "Chapter 1, in full 26".** The
   renumbering missed this cell. Columns 5 and 6 of the same row were changed
   to Chapter 25, and chapter 26 doesn't exist any more (`25-host-model.md`).
   Correction: "Chapter 1, in full 25".

2. **`terms.md:185-186`: "`.DRV` names appear only where the text is about an
   old card, as in Chapters 1, 5, 21 and 25 and Appendix D."** `grep -c '\.DRV'`
   finds none in `01-introduction.md`. The only hits are chapters 5 (17),
   21 (4) and 25 (3) and Appendix D (1). Correction: "as in Chapters 5, 21 and
   25 and Appendix D".

3. **`appendix-b-rom-services.md:16-19`: a build publishes `dist/abi.inc` "after
   checking the table's bytes and the services' numbers against the ROM"
   (`tools/build.mjs:139-154`).** `checkAbi` (`tools/build.mjs:143-154` at
   60e0768) checks the 8 table bytes, `SVCFMT`, that each of `TNCOUNT` `SVTAB`
   words points into the code, and the `HWB*` bits. Nothing checks that
   number *n* reaches the routine `abi.inc` names for it. `SVTAB`'s order is
   fixed only by `src/data3.asm:93-101`, and the only number checked is the
   count. Correction: "after checking the table's bytes, the number of
   services and `INFO`'s bits against the ROM". The same overstatement is in
   the code's own comment at `src/abi.inc:3-4`, which isn't the book's to fix.

4. **`appendix-b-rom-services.md:19-20` and the Stack column at lines 70-86:
   "The stacks are `abi.inc`'s: the most each service takes below its return
   address, the dispatcher's included."** The figures are upper bounds, and for
   some services they are above what the code can take. At service entry the
   dispatcher's two pushes are gone (`src/hwsvc.asm:37-39`), so its
   contribution is 4 bytes. Measured: `INFO` 4 (column 6), `LIST` 4
   (column 8), `FIND` 6 (column 8), `MOUNT` 18, `UNMNT` 16 and `DESC` 20 on
   the paths run (column 24). Every other row matched exactly: `DIGIT` 4,
   `LCD` 10, `VIDEO` 12, `TONE`/`JOY`/`KEYS` 4, `PUTAT` 22, `RTC` 8 and `DRVR`
   4. `INFO`, `FIND` and `LIST` have one path each, with no calls, so their
   "most" is 4, 6 and 4. Correction: "The stacks are `abi.inc`'s: a bound on
   what each service takes below its return address, the dispatcher's
   included." Changing the figures themselves would be a change to
   `abi.inc`.

No other finding. The claims below were checked and hold.

## Appendix B checks that hold

- Table: `TNA`, 5, 0, `JP SVCDSP` at C003h to C00Ah, with `ABIEND` C00Bh
  (`src/abi.asm:7-10`, `src/abi.inc:9-13`, and the census table region of 8
  bytes).
- Numbers 0 to 14 and `SVTAB`'s order (`src/data3.asm:94-101`).
- Status codes and flags. Hardware failures go through `HWERR` (`OR A`, `SCF`),
  so zero is clear. Volume and driver failures keep zero as it falls. The run
  bears this out: `UNMNT 0` returned A=1, carry and Z=1.
- Every T-state figure was measured, and they agree to the T-state with
  counting the instructions by hand:

  | Service | Figure |
  | --- | --- |
  | Out of range | 58, with no stack |
  | `INFO` | 244 |
  | `DIGIT` | 20,670 (3,414 a digit, the last 5 less, plus 160 in the dispatcher) |
  | `LCD` | 4,915, and 4,935 on row 3 |
  | `TONE` | DE × (16B + 51) + 222: 33,242 for B=100, DE=20, and 4,369 for B=0, DE=1 |
  | `JOY` | 214 |
  | `KEYS` | 581 |
  | `RTC` | 6,918 to read, 7,752 to set |
  | `VIDEO` claim with a cursor | 1,160 |
  | `VIDEO` release | 216,023 with the PICO9918 as the console, 146,738 with `GLCD.SVC` as the console |
  | `PUTAT` on `PICO.SVC` | 487 a cell, (2,917 − 969) / 4 |
  | `PUTAT` on `GLCD.SVC` | 35,707 a cell for columns 3 to 6; the book's "about 35,750" is within 0.2% |

  The table of `TONE`'s instructions and "5 T-states less" for the last half
  cycle also hold.
- Behaviour:
  - `INFO` gives B=0Bh, HL=1850h (80 × 24) and DE=0001h on the PICO9918
    board, and HL=0 on serial.
  - A claim sets bit 4, and `PUTAT` refuses while the PICO9918 is claimed and
    is the console, but not on the GLCD.
  - `PUTAT` with a row past the bottom or a count of 0 returns 0.
  - `LCD` refuses row 4.
  - `DRVR` refuses with no matrix keyboard, and when the mode already has a
    table.
  - `DESC` byte 14 is the drive.
  - `MOUNT` and `DESC` changed IX (1111h to B986h and B9A6h), and `UNMNT`
    didn't.
  - The refusals for an index past the table, A: and a volume already on A:
    all hold.
  - `FIND` finds `PICO` at version 2 and not at 3, and `LIST` stops past the
    last record. A is 0, the generation.
- Citations checked in full, all apt: `src/abi.inc:1-7, 9-13, 15-26, 18-25,
  103-109`, `src/hwsvc.asm` (every range), `src/data3.asm:92-100`,
  `src/ram.asm:57, 235`, `src/boot.asm:30-33, 73`, `src/console.asm:159`,
  `src/term.asm:533-544`, `src/vol.asm:577-604, 616, 653, 657-667, 670-672`,
  `src/glcd.asm:5-18, 42-56`, `src/video.asm:37-45`, `src/svc.asm:25,
  494-556`, `drivers/pico.asm:16, 33-41, 166-210`, `drivers/glcd.asm:25, 338`,
  `diag/interact.asm:556`, `test/programs/demo.asm:29-31`,
  `tools/build.mjs:26, 69` and `tools/media.mjs:206`.

## Appendix H checks that hold

- `xxd` of `dist/files/PICO.SVC` (1,379 bytes) matches both dumps byte for
  byte.
- Header fields: `44 04`, 0 dependencies, flags 1, `REMOVE` 005Fh, size 0523h,
  relocation 40h, `INIT` 0043h and `PICO`.
- Decoding the 64 gap bytes gives 64 fixups at 26, 28, … 38, 42 … 481, with no
  255 in them and a largest gap of 34. The 7 table words' high bytes are
  26 to 38. A bitmap would take ceil(1,290 / 8) = 162 bytes.
- The encoder `delta` (`tools/lib/svc.mjs:35-47`) gives `3 7`, `255 255 91` and
  `255 255 0` for the examples (`test/svc.test.mjs:335-337`).
- Loader: `DMAGIC` = `SVCFMT*256+'D'` (`src/svc.asm:11, 82-85`), `SVCFMT` 4
  (`src/abi.inc:91-93`), and `FORMAT` 4 (`tools/lib/svc-format.mjs:3`), which
  is written at `tools/lib/svc.mjs:115`.
- The checks on the entry offsets (`SVCIN`, 25 to below the size), the
  records (`SVCEXT`), the page at 80h or above and the stack's room left hold
  (`src/svc.asm:86-106, 134-150, 345-360`).
- The relocation loop's bound counts a 255 too, and a first gap of 0 fixes
  header byte 24 (`src/svc.asm:153-181`).
- Dependency lookup (`src/svc.asm:107-126`), and the 8-byte name limit
  (`tools/lib/svc.mjs:109`).
- At Thorium dbee66a, `TAS` takes `DEPS` as whole 9-byte entries and writes
  offsets 2, 4, 6 and 15 (`src/tas/DRV.ASM:76-120`). It doesn't write the
  format byte, which agrees with the text.

## Appendix C: EXPAND 1 at a program's end

The test took three programs on a card made fresh from `dist/starter.img`:

- `E1`: `LD A,05h`, `OUT (FFh),A`, `JP 0000h`
- `E2`: the same, but it also stores 05h at `0040h` and ends with `RET`
- `E0`: a control, which writes 01h

`node tools/capture.mjs --card exp1.img E1` printed the banner `TEC-OS 0.1 for
TEC-1G` and the cold boot's volumes and startup lines a second time, so the
machine cold booted. `E2` did the same, with the banner twice in its output.
`E0` warm booted to `A>` with the banner once. The appendix's claim holds.

## Other checks on the changed lines

- C:
  - ROM SHA-256 `f26c3215…`.
  - `CMDTXT` BD35h, `PRGCODE` BF56h, `CHPOS` BFE4h, `WSBASE` B958h, `WSEND`
    BFE5h, `XMDST`/`MVREST` BF50h to BF53h, `PZTOP` BF54h, `LOADTOP` BF58h,
    `SLDL` BF5Ch, `SVCBSY` BF5Dh, `SVCRC` BF62h, `STPOS` BF63h and `STREC`
    BF64h, all from `build/tecos/tecos.d8.json`.
  - The ROM's regions 8, 817, 13,860 and 1,696 match the census.
  - The CCP is D791h to E0EFh, 2,399 bytes, and the BDOS E0F0h to EFF6h,
    3,847 bytes, by the symbols' files.
  - `0041h` and `0044h` are absent from `src/layout.asm:32-47`.
  - `MEMINIT` clears EXPAND 1 (`src/boot.asm:139-147`).
  - The layout citations are apt.
- A:
  - The function 16 R/O check, `CLOSEDIR` → `CHKRO` (`src/cpm/bdos.asm:558-571`).
  - 41 to 255, other than 47 and 108, go to `RETZERO`
    (`src/cpm/bdos.asm:83-89`).
  - `boot.asm:97-98` is apt for 0001h.
- D:
  - One `RAMCHK` tests both halves (`src/boot.asm:22, 279-309`).
  - The A: search is made only with no drive named and a current drive other
    than A (`src/cpm/ccp.asm:277-295`).
  - The `MOUNT` ABI 5 message (`test/programs/mount.asm:14-31`) and format 4
    hold.
  - The links resolve, `#the-volume-services` among them.
- E, F and G:
  - The `TED.COM` SHA-256 `373d866b…` and `TAS.COM` `45c0cf05…` match
    `dist/files`.
  - `MOUNT.COM` is 671 bytes and 768 on the card, six records.
  - `tecvol dir` output matches.
  - The recipe rebuild gives `3671751c…` for both images.
  - The `RTCHAS` and `CDRTC` description in G (`src/boot.asm:30-33`,
    `src/hwsvc.asm:256-268`) holds, and MAIN "Not set" holds.
- The renumbering:
  - Every link in the eight appendices, terms.md and STYLE.md resolves to an
    existing file and heading.
  - The text references to Chapters 20, 21, 23 and 25 name the right
    chapters, and so do Chapter 10's dependency and generation text and
    Chapter 20's in-memory header table.
- Leftover words:
  - In the appendices, none of `PRL`, MAIN 1, `XMOVE`, `ABIHW`, the mount entry,
    ABI 4, format 3, `'D',3`, `debug80t40`, `debug80g32`, `C01Dh` or the old
    `TED` pin.
  - `0041h` and `0044h` appear only as unused.
  - Function 50 appears only as a no-op.
  - terms.md keeps them only in its "don't use" table.

## Files checked

- appendix-a-bdos-functions.md: the diff. Function 16's R/O addition, the
  removal of function 50 and the new citations, against the code.
- appendix-b-rom-services.md: whole. Every number, register, flag, stack figure
  and T-state, against the code and runs, and every citation. Findings 3 and 4.
- appendix-c-memory-map.md: the diff. Addresses against d8.json and the
  census, citations, and the EXPAND 1 cold boot run.
- appendix-d-error-messages.md: the diff. RAMCHK, the A: search, the R/O row,
  `MOUNT`'s ABI 5 message, and links.
- appendix-e-container-format.md: the diff. Pins and SHA-256s; the moved
  citations only.
- appendix-f-tecvol.md: the diff. Pins, `MOUNT.COM`'s size, `tecvol dir`, and
  the recipe's SHA-256 rerun.
- appendix-g-tec-1g.md: the diff. The RTC probe, the latch's bits, the RAM
  check and the citations.
- appendix-h-service-file-format.md: whole. The header fields, the gap
  encoding, the `PICO.SVC` dump, the loader's checks and `TAS`'s `DEPS`.
- editorial/terms.md: the diff and the renumbered rows. Findings 1 and 2.
- editorial/STYLE.md: the diff, a changed example sentence. Nothing to report.
