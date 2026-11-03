# Check of the TEC-OS book at 7935507, chapters 1 to 17 (changes since adfa305)


Read-only check of `tec-os/01-introduction.md` to `tec-os/17-ccp.md` and
`tec-os/index.md` (branch `tec-os-book`, HEAD 67df490) against
`git diff adfa305 HEAD`. Every citation was checked. For each one the cited text
at 7935507 was compared with the old citation's text at 7458352, and so was the
nearest label before it, allowing for the four renames. Every mismatch was then
read by hand against its sentence. Every one-line and two-line citation was read
in its context. ROM addresses were checked against `rev793/dist/tecos.d8.json`,
`tecos.census.json` and `moved-syms8.json`.

## Findings

1. **15-bios-and-console.md:340-341.** The claim is that service 12 "goes to
   `SVDRV` and from there to `VIDHOOK` (`src/tables.asm:59`,
   `src/video.asm:47-57`)". At 7458352 the old citation `src/glcd.asm:1-25`
   took in the hook's heading, all of `SVDRV` (glcd.asm:5-18) and `VIDHOOK`'s
   header. `SVDRV` is now in `services.asm`, so `src/video.asm:47-57` holds
   only the heading and `VIDHOOK`'s header comment. Nothing cited shows the
   step from `SVDRV` to `VIDHOOK`, which is `services.asm:323`
   (`SVDRV1: CALL VIDHOOK`). Smallest correction:
   `(src/tables.asm:59, src/services.asm:323, src/video.asm:47-57)`.

2. **17-ccp.md:40-44.** The claim is that the CCP "calls a few of TEC-OS's
   routines directly: the service loader through `SVCGO`, `SVCUNL` for
   `UNLOAD`, `GLCLD` for `CON UC1` and the BDOS's division, `DIV16`". `CMDSVC`
   and `STDONE` moved into `ccp.asm`, and they brought two more outside calls:
   `CALL SVCABV` at `src/cpm/ccp.asm:1603`, defined at `src/loader.asm:330`,
   and `JP LCDWRD` at `src/cpm/ccp.asm:1719`, defined at `src/lcd.asm:36`. The
   list was also missing `CALL CONFLD` (`src/cpm/ccp.asm:1164`, now defined at
   `src/console.asm:304`) at 7458352, before this change. At 7935507 these are
   all the CCP's calls outside `ccp.asm` besides the BDOS. Smallest
   correction: add "`SVCABV` for `SERVICES`, `CONFLD` for `CON`, `LCDWRD` for
   the `PICO?` word" with `src/cpm/ccp.asm:1603`, `src/cpm/ccp.asm:1164` and
   `src/cpm/ccp.asm:1719`.

3. **17-ccp.md:24-25 (minor).** The claim is that the CCP's "messages and the
   names of its built-in commands are in the ROM's data block
   (`src/text.asm:12-78`)". `STDONE` and `STBOOT` are in `ccp.asm` now. So the
   CCP also uses `PICMSG`/`PICCLR`, under the heading `loader.asm and
   cpm/ccp.asm` at `src/text.asm:90-93`, and `STFCB` at `src/tables.asm:62-64`.
   Both lie outside the cited range. Smallest correction: add
   `src/text.asm:90-93` to the citation.

No other finding. Every other moved citation shows what its sentence claims,
and so did the old citation at 7458352. That includes all the one-line and
two-line ones:

- the five `EI` sites at 14:47-48 (`bios.asm:324`, `console.asm:212`,
  `console.asm:248`, `history.asm:39`, `cache.asm:466`), which are exactly the
  ROM's `EI`s at 7935507;
- `boot.asm:445` (13:243);
- `boot.asm:447-448` and `ccp.asm:1718-1719` (15:403, 15:406);
- `boot.asm:462-463` (14:99);
- `loader.asm:450` (17:539);
- `tables.asm:67` (13:281);
- `ccp.asm:274` and `ccp.asm:808` (17:43-44);
- `text.asm:6`, `text.asm:81`, `text.asm:95-96` and `text.asm:98` (12:48-55,
  12:119-120).

The unchanged citations into the files whose source moved all still land on the
same text. The one text change inside a cited range is the `PIVEC` comment at
`ram.asm:217` (GLHOOK to VIDHOOK), which is within `ram.asm:192-241` and
`ram.asm:193-239` and harmless. No gone file name or old label is left in these
files. The one mention of 7458352 is a provenance comment at
06-first-program.md:335 recording where a run was made. Every sentence saying
what a file holds is true at 7935507: 12:47-56, 12:84-87, 12:103-107 and the
data-block headings. Every ROM address and span matches the build:

- the five regions at 12:25-29: C00Bh-C33Bh is 817 bytes, C33Ch-F9EAh is
  13,999 and F9EBh-FFFFh is 1,557;
- `RSTENT`/`ROMCODE` at C33Ch;
- the BDOS from E28Fh to F19Ch, 3,854 bytes, with `services.asm` from F19Dh;
- the CCP from D82Dh to E28Eh, 2,658 bytes.

## Per file

- 01-introduction.md: header; 0 citations; 7 ROM addresses checked.
- 02-console.md: header; 0 citations.
- 03-command-line.md: header; 0 citations.
- 04-cards-and-volumes.md: header; 2 citations, unchanged, checked.
- 05-startup-and-services.md: header; 0 citations; 1 ROM address.
- 06-first-program.md: header; 0 source citations (`HELLO.ASM:7` is a TED argument); provenance comment noted.
- 07-memory.md: header; 2 citations, both moved, both right; 3 ROM addresses.
- 08-programs-and-console.md: header; 0 citations; 2 ROM addresses.
- 09-hardware-services.md: header; 0 citations; 8 ROM addresses.
- 10-writing-services.md: header; 0 citations; 2 ROM addresses.
- 11-chaining-commands.md: header; 0 citations; 6 ROM-range values (return codes, not labels).
- index.md: unchanged; 0 citations; 2 ROM addresses.
- 12-rom-and-build.md: 65 citations (18 moved, 47 unchanged), file list and include listing, 23 ROM addresses, build line and SHA; no finding.
- 13-memory-map.md: 71 citations (31 moved, 40 unchanged), 3 ROM addresses; no finding.
- 14-reset-and-boot.md: 81 citations (58 moved, 23 unchanged), 6 ROM addresses; no finding.
- 15-bios-and-console.md: 88 citations (31 moved, 57 unchanged), label renames; 1 finding.
- 16-bdos.md: 136 citations (15 moved, 121 unchanged), 3 ROM addresses; no finding.
- 17-ccp.md: 103 citations (23 moved, 80 unchanged), 3 ROM addresses, built-in table; 2 findings.
