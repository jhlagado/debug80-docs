# Review 8: appendices A to G and terms.md at 4d6eeaa

Scope: `git diff 591a112 HEAD` in `~/projects/debug80-docs-tec-os` (HEAD 8a2fe28) for
`tec-os/appendix-a` to `appendix-g` and `tec-os/editorial/terms.md`. Build: a fresh
copy of `$S/revks37` in `$S/rv8/w`; `src/svc.asm`, `src/boot.asm`, `tools/media.mjs`
and `test/programs/mount.asm` there are byte-identical to `git show 4d6eeaa:`.

## Findings

1. `tec-os/editorial/terms.md:105` (the `project` row). Claim: `THOR.PRJ` is "the
   file `TED` keeps beside the source". Evidence: Thorium 8fcc6ea
   `ted/src/editor-data.asm:104` builds the name as `THONAM: DB 0,"THOR    "`, drive
   byte 0, copied unchanged into the transaction FCB by `ted/src/editor-project.asm:28-37`
   (`THOFCB`); nothing else writes `TRAFCB+0`. `THOR.PRJ` is on the current drive,
   not the source's: `TED B:HELLO.ASM` typed at `A>` keeps it on A. Chapter 6's run
   is at `B>` with the source on B, so it holds there. Smallest correction: "`THOR.PRJ`,
   the file `TED` keeps on the current drive, naming the source its build keys take".

2. `tec-os/appendix-g-tec-1g.md:142-144`. The new clause leaves one line of about
   120 characters (line 144, unwrapped) and a heavy sentence: "`DEMO`, a program
   Chapter 9 describes that isn't on the starter card, writes them itself, as the
   Debug80 runtime decodes them: ...". Not wrong. Smallest correction: rewrap
   lines 142-145 to the file's width; optionally "`DEMO`, which Chapter 9 builds and
   which isn't on the starter card, writes them itself, ...".

No other finding. Every changed claim, figure, citation and transcript in these
files agrees with 4d6eeaa and with the runs below.

## Evidence for the passages that hold

- Links: all 69 links in appendices A to G resolve to a file and to a heading
  anchor that exists (VitePress slug rules; a negative test confirms
  `#drives-vols-and-mount` is reported missing). The 8 links to
  `04-cards-and-volumes.md#drives-and-mount` match `## Drives and MOUNT` (line 213).
  `terms.md` has no links.
- Appendix C: ROM SHA-256 `6f3e7467...82f1` is the hash of all four `dist/*.rom`;
  census regions give code `C33Eh`-`FA62h` 14,117 and free `FA63h`-`FFFFh` 1,437.
  From `tecos.d8.json` segments, `cpm/ccp.asm` spans `D7B4h`-`E112h` (2,399) and
  `cpm/bdos.asm` `E113h`-`F057h` (3,909). The label command prints `BD35h`, `BF57h`,
  `BFE5h`. `PZSWP` (`src/boot.asm:239-252`) keeps a `JP` only when its target is above
  `PZTOP`, matching the row at line 115. `SVCFRE` (`src/svc.asm:281-293`) clears the
  first byte of each claimed slot; unload calls it then `PZSWP` (47-58); a failed
  `INIT` does the same (245-249). `src/boot.asm:215-274` is `PZINIT` through `PZSWP`.
  `tools/media.mjs:70-169` is `memoryMap`, 223 writes `docs/memory-map.md`, 203-222
  the recipe and image.
- Appendix D: `mount.asm` citations 15-32, 34-45, 50-58, 107-108, 130-131, 150-158,
  160-209, 242-243, 256-263 say what the rows claim; the usage text is
  `MOUNT [D: [NAME or INDEX]]` (263); an empty tail goes to `LIST` (36-37); list lines
  are two decimal digits, label, geometry, ` R/O`, ` d:` (160-209). `src/svc.asm`
  63-91, 349-373, 468-479, `src/boot.asm:147-148`, `host/card.mjs:37-40` match. The
  return code of 0 holds: the CCP zeroes `PRGCODE` per piece (`src/cpm/ccp.asm:158-159`).
- Appendices E and F: `TED.COM` is 11,781 bytes with SHA-256 `9a9936cf...413e`,
  pinned in `test/inputs.json` as Thorium 8fcc6ea; `TAS.COM` matches its pin.
  `od` of the fresh `dist/starter.img` matches Appendix E's dump.
- Appendix F runs, in order on a fresh copy: `dir dist/starter.img A` gives the six
  lines shown; `MOUNT.COM` is 670 bytes; `create`, `info`, `put` (three files),
  the read-only failure, `get --text`, both `era` lines (exit 2, then 0), `recipe`
  (both images `915684d5...f188`) and the final `dir` all print what the appendix
  shows. `node tools/capture.mjs --card build/my.img DIR "TYPE HELLO.TXT" MOUNT`
  matches lines 301-317 byte for byte. Every file the examples need is in
  `dist/files` or made by an earlier step.
- Appendix G: `src/svc.asm:384-386`, `src/boot.asm:143-148`, `166-183` match;
  `DEMO` is in `test/programs/demo.asm` and not in `dist/starter.recipe.json`.
- terms.md: the recipe holds exactly `MOUNT.COM`, `PICO.SVC`, `GLCD.SVC`,
  `STARTUP.CMD`, `TED.COM`, `TAS.COM` on A and nothing on B; `TED`'s status prefix
  is `STAPRE: DB "EDIT ",0` (`ted/src/editor-data.asm:46`).
- Words left over: `VOLS.COM` at `appendix-b-rom-services.md:48` speaks of an older
  card, which is correct. No `README.TXT`, `EDIT`, `TERM`, `PROBE`, `PICO40` or
  `PICO32` is presented as on the starter card.

## Checked, per file

- appendix-a-bdos-functions.md: only the `Checked against` line changed; links resolved.
- appendix-b-rom-services.md: the `svc.asm:483-546` citation; links resolved; `VOLS.COM` leftover read as historical.
- appendix-c-memory-map.md: hash, ROM regions, CCP and BDOS spans, label command, page-zero row, unload and failed-`INIT` sentence and its citations.
- appendix-d-error-messages.md: the `MOUNT` section rewritten from `VOLS`, every changed citation, every link anchor.
- appendix-e-container-format.md: `TED.COM` provenance and hash; header dump rerun.
- appendix-f-tecvol.md: every changed transcript rerun, sizes, hashes, the capture, the order of examples.
- appendix-g-tec-1g.md: changed citations, the `DEMO` wording, sentence readability.
- editorial/terms.md: the starter card's six files, `MOUNT`, `TED`, `project`, retired words, and the fenced-block exception for `TED`'s status row.
