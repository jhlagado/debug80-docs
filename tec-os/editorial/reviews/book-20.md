# Check of appendices A to G, `terms.md` and `STYLE.md` at 718c01b

No changed claim in appendices A to G is wrong about the BDOS, the addresses or
the transcripts. Every changed transcript reproduces. The findings below are one
rename that now names the wrong routine, leftover words, unchanged sentences the
code contradicts, and statements in `STYLE.md` and `terms.md` that the book does
not meet. Paths are under `tec-os/` unless they start `src/`, `tools/`, `host/`
or `web/`.

## Findings

### Changed text

**1. appendix-c-memory-map.md:157 and :192; also 13-memory-map.md:150.** Claim:
`MNTCNT` to `MNTCB` are "the mount entry's scratch". Evidence: `MNTBLK`,
`MNTPRV`, `MNTSUM`, `MNTDRV` and `MNTI` are used only by the ROM's `MOUNT` routine
and `RESEL` (`src/vol.asm:69-302`, `src/vol.asm:411-441`, `src/vol.asm:517`). The
mount entry touches only `MNTCB` and `MNTCNT` (`src/vol.asm:587`,
`src/vol.asm:710`). `terms.md` keeps the `MOUNT` routine and the mount entry
apart, so the direct rename made the sentence wrong. Correction: "the `MOUNT`
routine's scratch, which the mount entry also uses".

**2. appendix-d-error-messages.md:142.** Claim: "The web page reports a card with
`.DRV` display files when it powers on". Evidence: the report comes only when the
card lacks the chosen display's `.SVC` file (`host/card.mjs:35-38`). A card that
has that `.SVC` file and leftover `.DRV` files gets no report. Chapter 22:307 has
the condition right. Correction: "The web page reports a card with no `.SVC` file
for the chosen display and a `.DRV` display file when it powers on".

**3. appendix-b-rom-services.md:26 and :70.** Claim: "renumber the services" and
"No service calls the BDOS". Evidence: both mean hardware services, and in
`terms.md` a *service* alone is what a `.SVC` file installs. A loaded service can
call the BDOS. Appendix G's changes made this correction in full. Correction:
"renumber the hardware services", "No hardware service calls the BDOS".

**4. appendix-f-tecvol.md:10-12.** Claim: the header names `EDIT.COM` alone.
Evidence: the changed `dir` listing at :160 shows `TAS.COM`, and the changed
SHA-256 at :262-263 depends on it (`tools/media.mjs:59-62`, `test/inputs.json:18-24`).
`STYLE.md` requires the same line to name such a file's build and SHA-256.
Correction: add, as Chapter 3:12-14 does, "and its `TAS.COM` from Thorium 7604daa,
with the SHA-256
`ff18734807206127d4ede7a96bbd26acf36310361834a1c9ae998b20e2f98292`". That value
matches `dist/files/TAS.COM` and the pin.

### Unchanged sentences the code contradicts

**5. appendix-a-bdos-functions.md:138-139.** Claim: function 16 "Writes the FCB's
extent, record count and allocation map back". Evidence: an FCB on an earlier
extent than its entry's writes only the map (`src/cpm/bdos.asm:617-619`,
`src/cpm/bdos.asm:637-644`). Correction: add "An FCB on an earlier extent than its
entry's writes back only the allocation map."

**6. appendix-a-bdos-functions.md:195-197.** Claim: function 28's protection lasts
"until the next warm boot or disk reset". Evidence: function 37 also clears the
drive's bit (`src/cpm/bdos.asm:1637-1638`), as Appendix A:240-241 says. Correction:
"until the next warm boot, disk reset or function 37 for the drive".

**7. appendix-f-tecvol.md:44-46.** Claim: a command "writes the result to a
temporary file beside it, checks that file as a container and only then renames
it". Evidence: `saveImage` checks the bytes in memory first, then writes the
temporary file and renames it. The file is never checked
(`tools/tecvol.mjs:53-58`). Correction: "checks the result as a container, writes
it to a temporary file beside the image and renames that file over the image".

**8. appendix-e-container-format.md:10-12, appendix-f-tecvol.md:10-12; also
the headers of Chapters 3, 4, 7, 8, 11, 14, 16, 17, 19, 23 and 25.**
Claim: `EDIT.COM`'s copy on the card has the SHA-256 `ed88337e…`. Evidence: that is
the hash of `dist/files/EDIT.COM`, 7,931 bytes (`tools/capture.mjs:71-73`). The file
on the card is record-padded to 7,936 bytes: `tecvol get dist/starter.img A
EDIT.COM` gives `6fce65e8c35220f22a3451780762542b8a2d374ba8026873ba240a8dd927926c`.
Correction: "whose copy in `dist/files` has the SHA-256".

### `STYLE.md`

**9. STYLE.md:12-16 ("the same line names that file's build and SHA-256").** Not
true of Chapters 16, 23 and 25, beyond finding 4. Their transcripts show `976K
free` on the starter card (16-bdos.md:164, 23-command-history.md:58,
25-chaining-inside.md:102), a figure that depends on `TAS.COM`, and their headers
name only `EDIT.COM`. Correction: add `TAS.COM` to the three headers.

**10. STYLE.md:46-47 ("a program a chapter builds on the PC, where its header
names ATOM's version").** Not true of Chapters 17 and 19. They run `npx atom`
(17-ccp.md:316, 19-block-cache.md:129), and their headers don't name ATOM.
Chapters 6, 7, 8 and 11 do. Correction: add "with the ATOM assembler from the
repository's `atom-z80` 0.3.7" to both headers.

The rest of `STYLE.md` holds at 718c01b:

- All 33 chapters and appendices carry the line for 718c01b.
- Part I has no line-numbered citations.
- No heading starts What, How or Why.
- No work records and no mention of the writing tools appear.
- `tools/capture.mjs` has the options, special lines and clock stated, and its
  three example commands run.
- `DIR` shows thirteen files on the starter card.
- `npm run build` and `npm run media` exist.

### `terms.md`

**11. terms.md, "registry record", also the "record" row of the Cards table.** The
full form appears in no chapter or appendix, so "A short form is the full form
with a word left out, used once the full form has appeared in the chapter" is
false for it. Chapter 5:32 and Chapter 10 say "records", and Chapter 5:105 says "a
service's records". Correction: make the form "record, of a service" with
"registry record" dropped.

**12. terms.md, "Explained in" and "Correct and distinct" columns.** The named
chapter doesn't use the form it is credited with:

| Form | Credited to | What that chapter says | Full form first in |
| --- | --- | --- | --- |
| resident workspace | Chapter 1 | "workspace" (01-introduction.md:78, :233) | Chapter 7 |
| BDOS entry jump | Chapter 1 | "BDOS's entry" | Chapter 5 |
| BDOS error | Chapter 3 | "the BDOS's messages" (:467) | Chapter 4 |
| vector slot | Chapter 13 | "slot" (:197-201) | Chapter 14 |
| dirty line | Chapter 13 | "dirty byte", "cache line" (:294) | Chapter 14 |
| cache line, in full | Chapter 19 | "line" only | Chapter 7 |
| ROM image | Chapter 12 | "image" (:12-19) | Chapter 1 |
| service's image | Chapter 10 | "image" (:168-186) | none |

Correction: credit the chapter where the form is used, or put the short form in
the table. Each short use before the full form also breaks the sentence quoted in
finding 11.

**13. terms.md, "web page's board".** Meaning given: "A board with the PICO9918,
the graphics LCD and the matrix keyboard". Evidence: with Display on the graphics
LCD the page builds a board with no PICO9918 (`web/src/main.mjs:74`,
01-introduction.md:144). Correction: add "with Display on the PICO9918; on the
graphics LCD it is `--board glcd`".

**14. terms.md, "Words in force".** Claim: `.DRV` names appear "as in Chapters 5, 10
and 22". The rule holds, but the list is short: Chapter 1:392, Chapter 26:297-299
and Appendix D:142 have them too, all on old cards. Correction: "as in Chapters 1,
5, 10, 22 and 26 and Appendix D".

The other statements in `terms.md` hold against the code: addresses, field numbers
and symbols, `RSLCAP`, `DEFDRV`, `CURDRV`, `XMARK`, `CONMOD`, `VOLSVC`, `DRVTAB`,
the "Power cycle" label (`web/index.html:27`), `README.TXT`'s "starter disk"
(`tools/media.mjs:32`), the "program area" comments in Chapter 7:68 and :151, and
`--board serial` and `--board pico`. The old forms were searched across the book
and none survives outside fenced text.

## What was checked

- **Appendix A:** every changed claim read against `src/cpm/bdos.asm`, `src/data3.asm`, `src/xmove.asm` and `src/cpm/ccp.asm`, including function 21's return of 1 and the `File R/O` paths; all citations in changed passages; 25 unchanged citations; agreement with Chapters 3, 16 and 17. Findings 5, 6.
- **Appendix B:** title and the one moved citation; 25 unchanged citations. The source differs from bd15528 only in comments of `src/hwsvc.asm`, so the measured figures were not rerun. Finding 3.
- **Appendix C:** every workspace row checked by script against `dist/tecos-debug80.d8.json`; ROM, BDOS, CCP and stack figures against the census and symbols; ROM SHA-256; changed citations; 25 unchanged citations. Finding 1.
- **Appendix D:** changed rows against `host/card.mjs`, `web/src/main.mjs`, `src/svc.asm` and `src/cpm/ccp.asm`; `File R/O` row against `ERA`, `REN`, `SAVE` and `COPY`; cross-links resolve; 25 unchanged citations. Finding 2.
- **Appendix E:** header dump, swapped-card run, `--drives` run and all changed citations; 25 unchanged citations. Bytes match, though `od` here prints a wider offset column. Finding 8.
- **Appendix F:** every transcript rerun on fresh card copies, from `create` to the capture of the finished card, including `dir`, the recipe SHA-256 and exit statuses; all match; 25 unchanged citations. Findings 4, 7, 8.
- **Appendix G:** changed rows and passages against `src/layout.asm`, `src/hwsvc.asm`, `src/console.asm` and `src/svc.asm`; `docs/` references and test numbers exist; 25 unchanged citations. No finding.
- **`terms.md` and `STYLE.md`:** each stated fact against the product at 718c01b and the book, with chapter credits checked by whole-book search. Not checked: that each example in Chapters 1 to 26 names its run, and the prose rules sentence by sentence.
