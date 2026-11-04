# Review 13-a: chapters 1 to 11, appendices F, G and H, and the index, at 621201d

Every capture in chapters 1 to 11 and Appendix F was rerun at 621201d on a copy of
`rev621` (`r13a/w2`, cards built by each chapter's own steps), and so was each
transcript the diff changed or added. All of them match their fences. The ROM's
behaviour behind the new text holds: `GLCD.SVC` passing quietly from `STARTUP.CMD`
on the board with both displays, a typed `GLCD.SVC` still installing there, `UNLOAD`
keeping the PICO9918's screen, a `CON PICO 32` line quiet on the serial and GLCD
boards with its `:` line run, typed `CON PICO 32` and `CON CRT 40` refused there,
`SAVE 256`, `320` and `185` refused, `COPY ... JUNK` refused, and `SAVE` and `COPY`
on a full drive keeping what they wrote. The findings are in the prose around these
facts.

## Findings

1. **`02-console.md:245-246`.** The claim: "Chapter 1 showed the starter card's
   startup file installing it before the first prompt." This is now untrue. Chapter 1
   shows the line on two boards only. On the serial board it fails quietly
   (`01-introduction.md:307-310`), and on the board with both displays it "installs
   nothing and passes quietly" (`01-introduction.md:337-338`). The code agrees: a
   table offered from `STARTUP.CMD` while CON: is CRT: is refused with `TNENODV`
   (`src/services.asm:368-381`). Smallest correction: "The starter card's startup
   file installs it before the first prompt on a board with the graphics LCD and no
   PICO9918 console (Chapter 5)."

2. **`01-introduction.md:526-527`.** The claim: "Each key typed there is echoed on a
   line of its own." The echo is not on a line of its own. It goes after the prompt
   on the prompt's line, and a new line follows it (`src/boot.asm:479-489`: `PUTS`
   prompt, `PUTA`, `PUTCRLF`). The run `node tools/capture.mjs --card none "@key x1"`
   gives `R retry> x`, then `R retry> 1`, then `R retry> `. Correction: "Each key
   typed there is echoed after the prompt, and any key but `R` or `r` then prints
   the prompt again on the next line."

3. **`09-hardware-services.md:726-727`.** The claim: "`GLCD: no` is `INFO`'s bit 2,
   clear on this board because the startup file leaves `GLCD.SVC` out." `hw.img` is
   a copy of the starter card, and its `STARTUP.CMD` holds the `GLCD.SVC` line
   (`03-command-line.md:163-169`). The line runs and installs nothing. The sentence
   also gives an artefact agency. Correction: "... clear on this board because the
   startup file's `GLCD.SVC` line installs nothing while the PICO9918 is the
   console."

4. **`10-writing-services.md:505-507`.** The claim: "the startup file leaves
   `GLCD.SVC` out while the PICO9918 is the console, so `COUNT.SVC` loads." This has
   the same fault as finding 3, for `svc.img`, a copy of the starter card.
   Correction: "the startup file's `GLCD.SVC` line installs nothing while the
   PICO9918 is the console, so `COUNT.SVC` loads."

5. **`11-chaining-commands.md:116-120`.** The claim: "A `:` that starts the first
   line typed therefore runs there, as it does on the boards where `GLCD.SVC`
   installs." This passage was left alone, and it now names boards that no longer
   exist. Only the GLCD-only board installs the driver at startup. On the board with
   both displays the line passes quietly (`src/services.asm:368-381`), and a `:`
   still runs there: `node tools/capture.mjs --board pico ":DIR *.SVC"` lists
   `GLCD.SVC`. Correction: "... as it does on the board with both displays, where
   the line passes quietly, and on the board with only the graphics LCD, where it
   installs."

6. **`03-command-line.md:321-325`.** The claim: "When the drive or its directory is
   full, `SAVE` closes the file and prints `NO SPACE`, so the file keeps the pages
   written before the drive filled." If the directory is full at the make, there is
   no file to close. `SAVE` goes straight to `SAVENOSP` (`src/cpm/ccpcmd.asm:224-226`),
   and only a write error goes through the close (`src/cpm/ccpcmd.asm:233-236`,
   `270-274`). The CP/M 2.2 sentence is also too broad. Extents that 2.2 closed at an
   extent change are in the directory, so only the open extent's pages are lost.
   Correction: "When the directory has no room for the file, `SAVE` prints
   `NO SPACE` and makes none. When the drive or the directory fills during the
   writes, `SAVE` closes the file and then prints `NO SPACE`, so the file keeps the
   pages written. CP/M 2.2's `SAVE` leaves the file open there, and the pages of its
   last extent in no directory entry." The run on a card whose C: had 4K free gave
   `SAVE 32 C:X.COM` → `NO SPACE`, then `DIR C:` listed `X.COM` with 0K free. That
   agrees with the corrected text.

7. **`05-startup-and-services.md:163-166` and `333-334`.** The same quiet startup
   line is called two things. Line 165 says a display line with nothing to do
   "fails quietly, as `GLCD.SVC` did in Chapter 1". The table at line 289, line 274
   and Chapter 1 (`01-introduction.md:338`) say "passes quietly". Line 333-334 then
   says the width line "passes quietly ... as a driver's line for a missing device
   does", although lines 163-165 and 277 say such a line "fails quietly". A
   newcomer reads these as two behaviours. Smallest correction: keep "fails quietly"
   for an absent device and "passes quietly" for a line with nothing to do. Make
   line 165 "Each is quiet, as `GLCD.SVC` was in Chapter 1", and make line 334 "as a
   driver's line for a missing device is quiet".

8. **`03-command-line.md:402-404`.** The claim: "On the web page's board the startup
   file's `GLCD.SVC` line installs nothing, as Chapter 1 showed." Chapter 1 says the
   page's own card has no `GLCD.SVC` line with the PICO9918 chosen
   (`01-introduction.md:340-343`). Read in order, "the startup file's `GLCD.SVC`
   line" on the web page's board names a line that isn't there. The capture runs the
   starter card on that board. Correction: "On the web page's board with the
   starter card, the startup file's `GLCD.SVC` line installs nothing ..."

9. **`appendix-g-tec-1g.md:161`.** The citation `src/services.asm:13` is too short.
   Line 13 gives bit 4 enable, bit 6 clock and bit 7 data out. The sentence's "bit 5
   set to read and the data read on bit 0" is on line 14 (`5 data in, read on bit
   0`). Correction: `src/services.asm:13-14`.

10. **`10-writing-services.md:286-290` (newly worth a sentence).** The text lists
    `TNDRVR`'s refusals for a display driver's `INIT`, but not the new one. A table
    offered for UC1: by a line from `STARTUP.CMD` while CON: is CRT: is refused with
    `TNENODV`, status 2 (`src/abi.inc:71-79`, `src/services.asm:356-381`). A writer
    of a display driver that passes `TNDRVR`'s status back as `GLCD.SVC` does
    (`drivers/glcd.asm:30-35`) gets the quiet pass. One sentence after "refuses
    `B = 1` ...": "In a line of `STARTUP.CMD` while CON: is CRT: it refuses with
    status 2, so a driver that returns that status passes quietly and stays out."

Not rerun: the `PUTAT`, `CONOUT` and function 2 timings at
`09-hardware-services.md:840-846`. Their path crosses the changed console echo and
the changed `GLCD.SVC`, and the figures were taken as given.

## Files

- `01-introduction.md`: read whole. 10 captures rerun, all matching. The new
  diagnostic text was checked against `src/boot.asm:479-489` and by a run (finding
  2). The SD codes `0B` and 2 were checked against `src/sd.asm:10-20`, `160-202`.
  The TPA figures were checked against `docs/memory-map.md`. No citations.
- `02-console.md`: read whole. 11 captures rerun, all matching, the two changed
  ones (lines 131, 175) included. ^S then ^C was checked against
  `src/cpm/bdoscon.asm:204-215`. One finding (1). No citations.
- `03-command-line.md`: read whole. 13 captures rerun, all matching, the changed
  one at line 406 included (screen kept after `UNLOAD`). `SAVE` was checked against
  `src/cpm/ccpcmd.asm:172-279`, and `COPY`'s `ENDCHK` and `CPWERR` against
  `src/cpm/ccpfile.asm:577`, `625`, `644`. `SAVE 320`, `256` and `185`,
  `COPY ... JUNK`, and `SAVE` and `COPY` on a full C: were all run. Findings 6
  and 8. No citations.
- `04-cards-and-volumes.md`: diff checked. 6 captures rerun, all matching. Line 242
  matches once `hello.txt` is made, which the chapter describes in words only. One
  citation changed (`src/vol.asm:221-235`), checked. Error 24 on a 1.0 header was
  checked against `src/vol.asm:16-17`, `68-83`.
- `05-startup-and-services.md`: read whole. 14 captures rerun, all matching, the
  changed ones at lines 294, 320 and 338 included. A `CON PICO 32!:USER 3` line was
  also run on the serial and GLCD boards. Finding 7. No citations.
- `06-first-program.md`: diff checked. 3 captures rerun, all matching. The TED
  figures are consistent with the TPA. No citations.
- `07-memory.md`: diff checked. 3 captures rerun, all matching, the changed one at
  line 118 included (`B9A4h`, then `B600h`). Two citations changed
  (`src/boot.asm:20-22`, `92-108`), both correct.
- `08-programs-and-console.md`: diff checked. 4 captures rerun, all matching. The
  erase sequences and `ESC` were checked against `src/term.asm:149-161`, `195-228`.
  ^S was checked against `bdoscon.asm`. No citations.
- `09-hardware-services.md`: diff checked. 9 captures rerun, all matching, the
  changed ones (`BOARD` `0B` and `DEMO`'s `GLCD: no`) included. `RTC`'s protect was
  checked against `src/services.asm:255-292`. `PUTAT` was checked against KE-193's
  ending. Finding 3. Timings not rerun. No citations.
- `10-writing-services.md`: diff checked. 5 captures rerun, all matching, the
  changed `RECS` run included. The stack limits were checked against
  `src/loader.asm:155-171`. Findings 4 and 10. No citations.
- `11-chaining-commands.md`: diff checked, and the unchanged lines 116-122 checked
  by a run. 7 captures rerun, all matching. Finding 5. No citations.
- `appendix-f-tecvol.md`: diff checked. 1 capture rerun, matching. The
  starter-image SHA-256 was reproduced with `tecvol recipe`, and the directory sizes
  were checked. 37 citations, none changed, all in files with no diff between
  58d4345 and 621201d. 14 of them were read at 621201d.
- `appendix-g-tec-1g.md`: diff checked. 49 citations, 45 changed. Every changed one
  in `layout.asm`, `console.asm`, `video.asm`, `pico.asm`, `services.asm`,
  `build.mjs`, `keyboard.asm`, `boot.asm`, `reset.asm`, `history.asm`, `cache.asm`,
  `ccpcmd.asm` and `sd.asm` was read at 621201d. One is short (finding 9). The new
  SD text (`0Ah`, `0Bh`, CMD55 code 2, 11 T-states a poll) was checked against
  `src/sd.asm:160-202`, `280-298`. No transcripts.
- `appendix-h-service-file-format.md`: diff checked. The `xxd` dump, the offsets
  767 and `2FFh`, 69 fixups, the last at 563, and 742 bytes of image were all
  reproduced from `dist/files/GLCD.SVC`. 21 citations, 12 changed, all read and
  correct. 9 unchanged ones in `tools/lib/svc.mjs`, `svc-format.mjs` and
  `test/svc.test.mjs` were read.
- `index.md`: read for chapter descriptions touching these landings. No change
  needed, no citations, no transcripts.

About 60 changed citations and 32 unchanged ones were read at 621201d in all.
87 captures were rerun.

## Resolved

All ten findings were applied in 95de254 and 34dd208.
