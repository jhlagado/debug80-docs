# Review 10-B: the TEC-OS book at 626ee41, Part II chapters 12-24 and appendices A-E, G, H

Read-only. Book at `tec-os-book` HEAD (94ccfc1), against `git diff 54c552d HEAD`. Code at 626ee41, read with `git archive`. Addresses checked against `rev626/dist/tecos.d8.json`, `tecos.census.json` and `moved-syms10.json`. One model run on a copy of `rev626`, under mem-guard (peak 92 MB, 0.8 s):
`node tools/capture.mjs --lcd -- "COPY SAMPLE.ASM X.ASM" "A:DIR" "DIR.COM" "SERVICES" "ERA X.ASM" "DIR"`.

## Findings

No changed claim, changed citation, ROM address or span was found false at 626ee41. Three points remain, all minor.

1. **17-ccp.md:516-517.** The claim: "cold boot's `SHOWVOL` builds each drive's line of its list in `CMDTXT`". `DRVLAB` builds only the drive's letter, `: ` and the label in `CMDTXT` (`src/boot.asm:327-330`, `src/lcd.asm:88-111`). The ` (read-only)` mark and the line's end are printed after it, from `ROTXT` and by `PUTCRLF`, and neither goes into the buffer (`src/boot.asm:331-336`). Smallest correction: "builds each drive's letter and label in `CMDTXT`".

2. **appendix-c-memory-map.md:195.** The row is `LINEBUF` "one display row, for scrolling". This was already incomplete at 7935507 and is not new. At 626ee41 cold boot's `LCDVOLS` also builds the LCD's drive rows there through `DRVLAB` (`src/lcd.asm:73-74`). The terminal also edits rows in it (15-bios-and-console.md:322). The code's reason for moving `SHOWVOL` to `CMDTXT` is that `LINEBUF` is the terminal's (`src/boot.asm:329`). Optional correction: "one display row, for the terminal's row moves and the LCD's drive rows".

3. **17-ccp.md:51.** The citation `src/cpm/ccp.asm:1079-1084` for "the console's `HEXHL`" is correct but wide. It takes in `CPHEX`'s header and `CPHEXC`, and the jump to `HEXHL` is line 1082. Optional: `src/cpm/ccp.asm:1081-1082`.

## What was checked and found to hold

- **Chapter 17, merged code.** Every changed citation was read at 626ee41:
  - `KEYTAB` (`src/tables.asm:38-60`) and its loop from `KEYNXT` (`src/cpm/ccp.asm:232-253`).
  - `CPSRC` (`src/cpm/ccp.asm:1069-1074`, with `BDOS` = 0005h at `ccp.asm:13`).
  - `CPHEX`, `CPHEXC` and `HEXHL` (`src/cpm/ccp.asm:1079-1084`, `src/console.asm:269-287`).
  - The `DIR`, `TYPE`, `ERA`, `REN`, `SAVE`, `COPY`, `USER`, `CON`, `UNLOAD` and `SERVICES` spans. Each span's start and end match the old span's, less the deleted `LD DE,CMDFCB` lines.
  - The startup file (`src/cpm/ccp.asm:1571-1602`, `1546-1673`).

  "Each call on the command's FCB goes through `CPSRC`" holds. The only `LD DE,CMDFCB` lines left are not BDOS calls: they are an `UNAMBIG` argument, `CMDPARSE`, a `CPNAME` argument and `STBOOT`'s `LDIR` (`ccp.asm:254, 319, 995, 1584`). `RENTEST`'s search uses `RENFCB`.

  The run agrees with the chapter. `A:DIR?` and `DIR.COM?` show that neither is the built-in, `COPIED 0023` shows the count through `CPHEX`, and the drive lines and LCD rows are as described.
- **Chapter 18.**
  - `SUMDE` (`src/vol.asm:116`, `690`, `701-714`) is the one sum for the header and the table blocks.
  - All eight checks of code `26h` jump to `MNDBAD`, which loads `MEDESC` and falls into `MNTERR` (`src/vol.asm:142-168`, `250-251`). No `LD A,MEDESC` is left elsewhere.
  - `MNFILL`'s six-byte `LDIR` (`src/vol.asm:322-343`) matches the chapter.
  - `MNDPH` calls `DPHADR` (`src/vol.asm:347`, `src/bios.asm:33-42`), which `BSELDSK` runs into.
- **`PUTCHAR`, `SHOWVOL`, `LINEBUF` and the CCP's stack.**
  - None of my files names `PUTCHAR`'s registers or a caller's saves. Only the 17-ccp.md sentence (finding 1) says where `SHOWVOL` builds its lines.
  - The `LINEBUF` passages in chapter 15 and appendix B are about the terminal's row routines and `VIDHOOK`'s return, and they still hold.
  - The CCP's stack figures still hold: 30 bytes at `BE59h-BE76h`, a 13-byte guard at `BE4Ch`, 28 bytes below the return word, and in 20-hardware-services-and-service-loader.md:584-595 a base of 16 and a census of 22. Evidence: `test/model/ks38b/kg42.json` records a CCP deepest of 22 of 30 with `PUTCHAR`'s change. The main checkout's `build/stack-census.json` was written after the `PUTCHAR` commit and gives serial 16, PICO9918 16 and written behind 16, with `conUc1Glcd` at 22. The stacks test itself was not rerun, since it is too heavy for this machine.
- **Addresses and spans.**
  - All 92 ROM addresses in my files resolve to a label or a region bound in the map.
  - Data `C00Bh-C350h` (838 bytes), code `C351h-F934h` (13,796) and free `F935h-FFFF` (1,739) match the census, and so do 14,645 used.
  - The CCP runs from `D801h` to `E1D8h` (2,520 bytes) and the BDOS from `E1D9h` to `F0E6h` (3,854). `SVCDSP` is at `F0E7h`.
  - The SHA-256 `9eebcf3a…5bd5a` matches `dist/tecos.rom`, and the build line matches `build626.out`.
  - No gone label (`PUTNIB`, `CPNIB`, `MNSUM`, `MNSUM1`, `HSL`, `HSN`, `SHVL`, the ten `...KEY` words) appears in any of my files.
- **Unchanged citations into changed sources.** Every citation string present both at 54c552d and at HEAD, into `ccp.asm`, `vol.asm`, `boot.asm`, `lcd.asm`, `console.asm`, `bios.asm`, `tables.asm`, `text.asm`, `main.mjs`, `store.mjs` or `card.mjs`, was compared line for line between 7935507 and 626ee41. That is 196 citations, and 193 cite identical lines.
  - The other three are in appendix D at 125, 126 and 236: `text.asm:51-52`, `53-54` and `55-56`. Each is a string the old file used for another row, and each now correctly cites `FILEEX`, `NOSPACE` and `ALLQUERY`.
- **The web page.** None of my files describes the page's handling of a stored card or of `PICO.SVC` (KE-163 to KE-168). `host/card.mjs:37-40`, cited in appendix D, is unchanged.
- **Style.** The inserted sentences use Australian English. They have no Oxford comma, no semicolon or dash, and no mind verb with a non-human subject.

## Per file

- 12-rom-and-build.md: region table, used bytes, hash and build line checked against the census and map. 12 changed citations read, 5 unchanged compared.
- 13-memory-map.md: `ALVINIT` spans, stub, stacks and `SVCLIM` checked. 9 changed citations read, 11 unchanged compared.
- 15-bios-and-console.md: serial and reader, `DRVR`, the LCD rows (`lcd.asm:67-111`) and the words checked. 12 changed read, 36 unchanged compared.
- 16-bdos.md: BDOS span, `FNTAB`, `FCBMAP`, messages, DPH words and `VRESET` checked. 14 changed read, 6 unchanged compared.
- 17-ccp.md: all 92 changed citations read, 18 unchanged compared, RAM table checked against the map, model run. Findings 1 and 3.
- 18-sd-card-and-volumes.md: `SUMDE`, `MNDBAD`, `MNFILL`, `DPHADR`, the BIOS and volume-service spans checked. 34 changed read, 6 unchanged compared.
- 20-hardware-services-and-service-loader.md: `SVTAB`, the `LOADCOM`, `SERVICES` and `PUTTRIM` citations and the stack figures checked. 16 changed read, 11 unchanged compared.
- 22-command-history.md: 1 changed read, 11 unchanged compared.
- 23-diagnostics.md: `DIAG` spans checked, and the diagnostics-ROM addresses are outside the TEC-OS map. 8 changed read, 14 unchanged compared.
- 24-chaining-inside.md: 32 changed read, including the `BADCMD`, `ERRGO` and `PRTGO` exits, and 13 unchanged compared.
- appendix-a-bdos-functions.md: 5 changed read, 1 unchanged compared.
- appendix-b-rom-services.md: volume services, `SVTAB` and `VBAD` checked. 8 changed read, 3 unchanged compared.
- appendix-c-memory-map.md: ROM table, CCP and BDOS spans and hash checked. 5 changed read, 12 unchanged compared. Finding 2.
- appendix-d-error-messages.md: all 91 changed citations read, including every CCP message row. 28 unchanged compared, of which 3 were reused strings, all correct.
- appendix-e-container-format.md: the checks table (`vol.asm:121-250`), `HDRSUM` and `SUMDE`, `GEOFIND` and `ALVINIT` checked. 14 changed read, 9 unchanged compared.
- appendix-g-tec-1g.md: 5 changed read, 12 unchanged compared.
- appendix-h-service-file-format.md: only the commit line changed, and it has no citations into the changed sources.

## Resolved

All three findings were applied in 52d0e3d: chapter 17 says `SHOWVOL` builds each drive's letter and label in `CMDTXT` and cites `src/cpm/ccp.asm:1081-1082` for `HEXHL`; Appendix C gives `LINEBUF` as the terminal's row moves and the LCD's drive rows.
