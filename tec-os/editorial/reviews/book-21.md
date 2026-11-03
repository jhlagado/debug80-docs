# Check of every `tec-os/` file changed since 238d65e, at TEC-OS ea9c1c0

Book worktree at 66db5fa, 34 files changed. Source compared with `git show ea9c1c0`;
runs made on a private copy of `$S/revea9` (`$S/rv4w`), with ROM SHA-256 c3f8164e and
card SHA-256 3e9a80d6 as the book states. Cards were remade from `dist/starter.img`.
No chapter changed, nothing committed.

## Findings

1. **`tec-os/18-sd-card-and-volumes.md:242-245`, `tec-os/16-bdos.md:488-491`.**
   Claim: a change through the BDOS never reaches the BIOS's read-only refusal, "so
   only a program that calls the BIOS itself receives the error"; the BDOS "refuses the
   change before any write to the card".
   Evidence: function 16 has no `CHKRO` (`src/cpm/bdos.asm:609-615`, `617-649`; the
   `CHKRO` sites are 686, 697, 731, 819, 825). A 9-byte program that calls function 16
   on the CCP's FCB at `005Ch`, with bit 7 of `S2` clear because nothing opened it, run
   as `CLOSER B:README.TXT` with B a read-only volume holding that file, printed
   `Bdos Err On B: Bad Sector`. The card's SHA-256 was unchanged. Appendix A's function
   list at `appendix-a-bdos-functions.md:41-43` is correct, since it leaves 16 out.
   Correction, Chapter 18: "A change made through the BDOS rarely gets this far, since
   the BDOS's own `R/O` error comes first. Function 16 has no such test, so a close that
   has something to write reaches the BIOS and gives `Bad Sector`." Chapter 16: "so the
   BDOS refuses a change from any function that tests the drive", or the same exception.

2. **`tec-os/22-startup.md:319-321`, `tec-os/05-startup-and-services.md:324-325`,
   `tec-os/26-host-model.md:294-295`.**
   Claim: a dropped piece passes its `:` to the piece after it "on its line", and
   "otherwise a `:` that waited on a dropped piece goes, on its line or first on the
   next".
   Evidence: `host/card.mjs:67`, `cond = i === 0 ? own && colon`, keeps a `:` first on
   the next line when the dropped piece had its own. `prepareCard` run on
   `DIR` / `:PICO.SVC` / `:VOLS` left `DIR` / `:VOLS`, and `DIR!:PICO.SVC` / `:VOLS`
   left the same. So the `:` stays, and it waits on `DIR`, which is right but is what
   the sentence denies. All other cases tried agree with the text, including both of
   Chapter 22's examples.
   Correction, Chapter 22: "A dropped piece passes its own `:` to the piece after it on
   its line, and leaves a `:` that starts the next line in place. Otherwise a `:` that
   waited on a dropped piece goes..."; the same in Chapters 5 and 26.

3. **`tec-os/10-prl-programs-and-services.md:224-225`.**
   Claim: "for any type but `.COM` and `.SVC` it writes a flat image".
   Evidence: Thorium dbee66a `src/tas/MAIN.ASM`, "The type SVC alone selects a driver
   build"; `test/tas.test.mjs:4` compares "the flat image under a .COM type". A `.COM`
   output is a flat image too, so excepting it implies otherwise. A run of
   `A:TAS COUNT Z.DBG` printed `usage: TAS NAME [OUT.TYP]` and wrote nothing, so `.DBG`
   is no exception to "any type" in the other direction (`NOTYPE` in `MAIN.ASM` also
   refuses types that start with `$`).
   Correction: "and for any other type it writes a flat image, except that it refuses
   `.DBG` and a type that starts with `$`."

4. **`tec-os/17-ccp.md:245`, `tec-os/03-command-line.md:265`,
   `tec-os/appendix-d-error-messages.md:235`.**
   Claim: `ERA` reads the answer "and, unless that was a CR, reads on to one"; `ERA`
   "reads a line".
   Evidence: `src/cpm/ccp.asm:874-877` applies `AND $DF` before `CP CR`, so `-` (2Dh)
   becomes 0Dh and ends the answer as Return does. Run: `@start ERA *.*`, `@key -` came
   back to the prompt with no Return and erased nothing. The result is the same as any
   other refusal, but the Return that follows then reaches the CCP's prompt.
   Correction: fix the code by comparing before the `AND`, or add to Chapter 17: "A `-`
   ends the answer too, since the case bit is masked off before the test."

5. **`tec-os/04-cards-and-volumes.md:379-382`.**
   Claim: "When a card comes out with changes in the cache, they stay held in this way".
   Evidence: the same paragraph, lines 377-378, says a directory block that can't be
   written is dropped, not held; "this way" covers only data blocks.
   Correction: "When a card comes out with changed data blocks in the cache, they stay
   held in this way..."

## What was checked

Citations: each changed citation in every chapter was compared by a line map from
718c01b to ea9c1c0 with the text at both commits; all plain moves land on the same
lines, and the 32 that are new or widened were read and say what the sentences claim.
No hexadecimal ROM address in the book names a symbol that moved. Leftover words:
`.DRV` appears only in Chapters 1, 5, 22 and 26 and Appendix D, as `terms.md` now
states; no `DRIVERS`, loaded-file "module", "mount service", "ROM services" as a name
for the calls, or "the table at `C003h`" remain. `RDFAIL` is gone from all chapters.

- Chapter 1: help text and `DIR` figures against `README.TXT` and a run; correct.
- Chapter 2: pin line only; `CON UC1` text agrees with the code.
- Chapter 3: `REN` with each drive form, the two-drive refusal, `ERA` with Return,
  `R/O` transcript on `build/errs.img`, `R/O` again after a warm boot on the current
  drive; finding 4.
- Chapter 4: `tecvol info` figure; put-back passage against `test/cache.test.mjs`;
  finding 5. `SDINIT` has one caller, `src/boot.asm:37`.
- Chapter 5: `GLCD?` on serial and PICO9918 boards, startup passage; finding 2.
- Chapters 6 to 9: pin lines; only the `TAS`-related wording read, and those
  transcripts were not rerun, as they did not change.
- Chapter 10: all changed transcripts rerun, including stray bytes (`0Eh` and `1Ah`
  left out of line one), `TAS` writing over an existing `COUNT.SVC`, `.DRV` output,
  111 bytes from `makeSvc`, the `INIT and REMOVE required` stop, and `Bad Sector` then
  error 02 after `UNLOAD`; finding 3.
- Chapter 11: figures only, consistent.
- Chapter 12: table, totals and hash against `dist/*.census.json` and the ROMs.
- Chapter 13: moved citations, `test/stacks.test.mjs`; RAM symbols are unchanged.
- Chapter 14: all seven T-state figures rerun, all match.
- Chapter 15: citations only.
- Chapter 16: `E0F5h`, `F039h` and 3,909 against the map, damaged-directory and
  read-only text by run; finding 1.
- Chapter 17: `CCPBAS`, end address, size, `REN` and `ERA` against the code; finding 4.
- Chapter 18: `WRITE` passage; finding 1. The claim at line 151 that a volume past the
  card's end fails when read can't be shown on the model, which returned no error for
  a truncated image.
- Chapter 19: both pairs of figures rerun, all match.
- Chapter 20: byte rows, `CEBAh` inside `SPIR`'s loop, addresses; all match.
- Chapter 21: `ORG_LINE` and `makeSvc` claims against the code and a run.
- Chapter 22: `STBOOT` at 5,865,139 rerun, `GLCLD` text, `withoutDisplay`; finding 2.
- Chapter 23: citations only. Chapter 24: pin only.
- Chapter 25: directory read path against the code.
- Chapter 26: 39 test files counted; finding 2.
- Appendix A: read-only and `Bad Sector` text, function 29 against the code.
- Appendix B: moved citations only.
- Appendix C: addresses, sizes and hash against the map and census.
- Appendix D: all changed rows against code and runs, damaged directory run (`VOLS`
  gives `Bad Sector`, other files read, `ERA` takes it), `R/O` from `SAVE`, `ERA`, `REN`
  and `COPY`, `CON` reports; finding 4.
- Appendix E: moved citations only.
- Appendix F: `TAS.COM` size by `tecvol dir`, card hash against `dist/starter.img`. The
  rebuild that the hash compares was not run, as builds are excluded.
- Appendix G: pin only.
- `editorial/terms.md`: the changed sentence matches the grep; no other editorial file
  changed.
