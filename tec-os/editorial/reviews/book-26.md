# Check of the TEC-OS book's changes since 6341e65, at TEC-OS 19ad916

Scope: the 17 files under `tec-os/` in `git diff --stat 6341e65 HEAD`. Runs were made in
a fresh copy of `$S/rev19a` (`$S/r9`), with every card built fresh from that copy's
`dist/starter.img` or `dist/page.recipe.json`. The scripts and images are in `$S/r9-run`.

## Findings

1. **appendix-f-tecvol.md:249, broken anchor.** The link to Chapter 22 uses the anchor `the-web-pages-rewrite`.
   The site's slug for `## The web page's rewrite` is `the-web-page-s-rewrite`. The
   built page `.vitepress/dist/tec-os/22-startup.html` has `id="the-web-page-s-rewrite"`,
   and the book's other apostrophe headings link this way (`#the-ccp-s-messages`,
   `#the-lcd-s-words`). Correction: `22-startup.md#the-web-page-s-rewrite`.

2. **13-memory-map.md:53-55, a claim the code contradicts.** "the routines that put EXPAND 1
   in view ... read no byte outside EXPAND 1 but `LATCHV` while it is in view." In `MVCOPY`
   (function 50's `MOVE`, and the cache's `CREFR`), the cross-bank copy puts EXPAND 1 in
   view and runs `LDIR` over the bank-0 end's part below `8000h`, in MAIN 0
   (`src/xmove.asm:21-26`, `src/xmove.asm:88-95`). So it reads or writes the program's bytes
   outside the window while EXPAND 1 is in view. Correct only for TEC-OS's own state: none
   of the cache, history, SD or boot routines reads any other state outside EXPAND 1
   (`src/cache.asm:55-92`, `src/history.asm:25-37`, `src/sd.asm:258-262`,
   `src/xmove.asm:86-101`, where `MVREST` is written before the switch and read after it).
   Correction: "read none of TEC-OS's own state outside EXPAND 1 but `LATCHV` while it is
   in view; `MOVE` also copies a program's bytes below `8000h` then".

3. **13-memory-map.md:84-85, the citation disagrees with the sentence.** "of which only
   `LATCHV` has to be in view whatever the window shows (`src/layout.asm:35-52`)". Lines 35-36
   of that range are the comment "TEC-OS keeps the state that must stay visible whatever the
   bank window shows here", which is the rationale the sentence now rejects. Correction: cite
   `src/layout.asm:37-52`, the EQUs.

4. **22-startup.md:315-316, overstated.** "It compares the whole file with each build, padded
   to whole records (`host/card.mjs:47`)." `holds` compares the file's length with the build's
   length rounded up to whole records, and the build's bytes with the file's first bytes
   (`host/card.mjs:47`). It doesn't compare the padding after the build. Correction: "It takes
   the file for a build when the file is that build padded to whole records, whatever the
   padding holds."

5. **22-startup.md:343-345, the test cited doesn't show the claim.** "a `GLCD.SVC` line after
   `PICO.SVC` would only give way and print `GLCD.SVC?` ... (`test/pico.test.mjs:816-827`, ...)".
   That test makes its machine with `glcd: false` (`test/pico.test.mjs:823`). It shows that
   `:VOLS` runs when there is no `GLCD.SVC` line, and no test prints `GLCD.SVC?` on a board
   with both displays. The behaviour itself is right: on a fresh starter card,
   `capture.mjs --board pico --screen` prints `A>GLCD.SVC` / `GLCD.SVC?`. `CON UC1` on the page's
   card loads `GLCD.SVC`, and `SERVICES` then lists `GLCD 6` and `PICO 6`. Correction: keep
   `src/cpm/ccp.asm:1133-1135` and point to Chapter 1's boot transcript for the `GLCD.SVC?`,
   or cite the test only for the line that runs.

6. **04-cards-and-volumes.md:444-445, the reason given is not the one that applies.** "The web page
   can't show either failure, because its card reads zeros and drops writes past the end of
   the image." The page refuses an image shorter than its container before it uses it:
   `useCard` and the start-up path call `parseContainer` with `requireLength` on
   (`web/src/main.mjs:527`, `web/src/main.mjs:614`, `tools/lib/container.mjs:151-153`), and the
   walk refuses a volume past the container (`src/vol.asm:211-215`). So on the page no volume
   reaches past the image, and the model's zero reads never come into play. Its card is also
   high-capacity (`host/machine.mjs:49`), so the standard-card wrap can't arise. The line is
   also longer than the paragraph's wrap. Correction: "The web page can't show either failure:
   it refuses an image shorter than its container, and its card is a high-capacity one."

7. **04-cards-and-volumes.md:211-212, 26-host-model.md:244, appendix-f-tecvol.md:238-240, minor.**
   "the same recipe with one more file" / "the starter card's with one more file" / "the
   starter card's with one more component". The page's recipe also has its own `id`, `name`
   and `instruction` (`tools/media.mjs:233-237`; a diff of the two built recipes shows exactly
   these three fields and the `DEMO.COM` component). The page doesn't show those fields
   (no use in `web/src/main.mjs` or `web/index.html`). Correction, if wanted: "the same
   volumes, widths and files, with one more file".

No passage in the changes names a defect number, the plan or a later fix, and no changed
passage presents `README.TXT`, `VOLS`, `EDIT`, `TERM`, `DEMO`, `PROBE`, `PICO40` or `PICO32` as on
the starter card. `PICO40.SVC` and `PICO32.SVC` are named as page files, and `DEMO` as on the
page's card only. The links to `04-cards-and-volumes.md#recovery-after-a-power-cut` resolve.

## Runs that confirm the changed statements

- `prepareCard` from Node on fresh cards (`$S/r9-run/prep.mjs`), with the drivers from
  `widthDrivers(page recipe)`:
  - The starter card at 80 and 40 columns gets `STARTUP.CMD` = `PICO.SVC` alone, with the
    chosen width written. With the graphics LCD it gets `GLCD.SVC` alone.
  - With no drivers, as after a failed fetch, the starter card's `GLCD.SVC` line still goes
    (`changed: true`).
  - An owner's `PICO.SVC` (one byte changed) is kept, with the note `This card's own PICO.SVC
    is kept, at the width it was built for.`
  - An older-format `PICO.SVC` is replaced.
  - `wide32.img`, made as Chapter 5 says, is given the 80-column driver.
  - A read-only drive A (flag set) gets `PICO.SVC` and `STARTUP.CMD` all the same.
  - A `PICO.SVC` in user 1 only throws `0/PICO.SVC not found`.
  - In a full directory, a missing `STARTUP.CMD` or a missing `PICO.SVC` throws
    `directory full`, and an existing file is replaced without error.
  - A recipe with no `widths` gives `The PICO9918's drivers couldn't be fetched (the recipe
    names no drivers), so the card is left as it is.`
- The page's card, built from `dist/page.recipe.json` and prepared, holds the six starter
  files and `DEMO.COM`. On `--board pico` it boots to `A>PICO.SVC` and then the prompt, and
  the screen shows the prompt alone. `:DIR *.SVC` as the first line runs. `CON UC1` loads
  `GLCD.SVC`. `DEMO` runs and stops at a key. The starter card's `:DIR *.SVC` on the same
  board runs nothing.
- `DEMO.COM` from `npx atom test/programs/demo.asm` is byte-identical to `dist/files/DEMO.COM`
  (1,191 bytes).
- `ERA *.*` on B: answered `-y` and Return: `ALL (Y/N)?-`, then `B>y`, `Y?`, and `DIR` still
  lists `STARTUP.CMD`.
- `TED`'s text room, the word at `2551h`, after `ted x.asm`: 33,067 on the serial board, and
  31,510 with both displays, on a GLCD-only board and on the page's card.
- A standard-capacity card (`highCapacity: false`) with B's volume moved to block `800800h`:
  `SAVE 1 X.COM` on B: succeeds. The changed blocks are `800h` and `8A0h`, inside drive A, and
  B's `DIR` lists drive A's files.
- `saveCard` with a failing IndexedDB resolves twice with one console warning.
- Chapter 3's `SERVICES UNLOAD` capture on `--board pico` matches the book.
- `src/` is unchanged from 4d6eeaa to 19ad916. The census figures (14,947 used, 1,437 free, the
  serial counts 49, 105, 50, 70, 77) and the ROM's SHA-256 `6f3e7467…82f1` hold.

## Per file

- 01-introduction.md: storage-failure paragraph, controls, the `PICO.SVC` rule and the boot
  sentence, checked against `web/src/store.mjs`, `web/src/main.mjs` and `host/card.mjs`, and by runs. No findings.
- 03-command-line.md: the `-` answer, by run against `ccp.asm:874-888`; the reworded `UNLOAD`
  lead-in, by rerunning its capture. No findings.
- 04-cards-and-volumes.md: page recipe, standard-card wrap (run) and recovery bullet,
  checked against `bios.asm` and `cache.asm`. Findings 6 and 7.
- 05-startup-and-services.md: the page's `PICO.SVC` rule, `wide32.img` and the single display
  line, by runs. No findings.
- 06-first-program.md: `TED` room on each board, by run. No findings.
- 09-hardware-services.md: `DEMO` on the page's card and in `dist/files`, by runs. No findings.
- 11-chaining-commands.md: the `:` rule on the serial, both-display and page boards, by runs. No findings.
- 12-rom-and-build.md: `DEMO.COM` assembly citation `tools/media.mjs:231` and the census
  figures. No findings.
- 13-memory-map.md (changed sentences only): checked against every latch write in `src/`.
  Findings 2 and 3.
- 14-reset-and-boot.md: recovery link and the warm-boot jump sentence. No findings.
- 18-sd-card-and-volumes.md: `LBAARG` (`sd.asm:208-221`), the walk (`vol.asm:195-215`), the model
  (`sd-spi.js:290-305`), by the wrap run. No findings.
- 19-block-cache.md: recovery link. No findings.
- 22-startup.md: every claim and citation against `host/card.mjs`, `web/src/main.mjs` and
  `test/pico.test.mjs`, by the `prepareCard` runs. Findings 4 and 5.
- 26-host-model.md: `web/build.mjs`, `tools/media.mjs`, store and timer, every `main.mjs` range,
  and the test count (41). Finding 7.
- appendix-c-memory-map.md: `tools/media.mjs:244` and the ROM SHA-256. No findings.
- appendix-d-error-messages.md: `host/card.mjs:35-38`. No findings.
- appendix-f-tecvol.md: page recipe, `widths` (`tools/media.mjs:195-201`, `:215`), and that
  `tecvol` doesn't read `widths`. Findings 1 and 7.
