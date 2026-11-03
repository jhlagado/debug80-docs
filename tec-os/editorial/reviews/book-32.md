# Check of the TEC-OS book at 7458352, chapters 14 to 25 and the appendices (changes since 075fb41)


Scope: `git diff 075fb41 HEAD` of 14-reset-and-boot.md to 25-host-model.md and appendix-a to appendix-h, against `git -C ~/projects/tec-os diff 1f9542d 7458352` (tec-os HEAD is 7458352). Every card was remade from a copy of `$S/rev745` at `$S/rb8/w`, from that copy's `dist/starter.img`.

## Findings

1. **18-sd-card-and-volumes.md:145, 162, 167; 25-host-model.md:75. The standard-card bound reads as one block too high.**
   - Claim: error 27h allows a volume that "ends ... at or before block `800000h`". The chapter refuses one "that ends past block `800000h`" and says "a volume ending at `800000h` itself mounts". Chapter 25 says the same: "ends past block `800000h`".
   - Evidence: `src/vol.asm:219-230` treats the end as exclusive and accepts it only up to 800000h. A volume whose last block is 800000h (end 800001h) is refused. Read "ends at block 800000h" as "its last block is 800000h" and all three sentences say it mounts, which is wrong. `test/sd-range.test.mjs:43` uses the exclusive end (`farCard(0x800000 - 0x4000)`). Appendices D:88, E:149 and G:180 state the bound as last block `7FFFFFh`, so the book disagrees with itself in wording.
   - Smallest correction: in 18:145, "and on a standard-capacity card no block past `7FFFFFh`". In 18:162, "a volume that reaches past block `7FFFFFh`". In 18:167, "A volume whose last block is `7FFFFFh` itself mounts". In 25:75, "a volume that reaches past block `7FFFFFh`".

2. **17-ccp.md:153-156. The changed sentence has a dangling "neither".**
   - Claim: "A program is looked for in user 0 after the current user, and a command that names no drive runs a program from drive A when the current drive has neither".
   - Evidence: "neither" has no pair of nouns to refer to. The behaviour itself is right (`src/cpm/ccp.asm:283-295`, `361-387`).
   - Smallest correction: "when the current drive has it in neither user".

3. **25-host-model.md:280-282. "One save runs at a time" says more than the code does.**
   - Claim: "One save runs at a time: a save asked for while another runs marks the card changed, and the next tick saves the newest copy".
   - Evidence: the guard is `state.saving`, and only `save()` checks it (`web/src/main.mjs:109-114`). The import path calls `saveCard(staged)` directly (`web/src/main.mjs:596`) and checks only `importBusy`. The tick does not start while `importBusy` is set (`web/src/main.mjs:98`), but a tick save already under way can overlap the import's save. The sentence is true of the timer and of `useCard`.
   - Smallest correction: "One save by the timer or by a new card runs at a time: …". Alternatively, leave the book as it is and record this as a code defect, since the import's save can finish before an older tick's save does.

4. **appendix-f-tecvol.md:86-90. Low; optional.**
   - Claim: `--align` takes "a whole number in decimal, from 1 to 16,777,215 … Any other `N` is a mistake in the command line".
   - Evidence, by run:
     - `--align 0`, `--align 1.5`, `--align 16777216`, `--drives 0`, `--drives 5` and `--drives x` each give the usage line, exit 2, and no image.
     - `--align 3` and `--align 16777215` give `tecvol: alignment must be a multiple of 8 blocks`, exit 1, and no image.
     - So the largest accepted value is 16,777,208.
   - The sentence is not wrong, since the multiple-of-8 rule is stated just before it. A reader may still take 16,777,215 for a usable value.
   - Smallest correction, optional: "… for `--align`, which must also be a multiple of 8, and from 1 to 4 for `--drives`".

No other changed claim, transcript, figure or citation was found wrong.

## Runs and checks behind the passes

- **Warm boot and cold boot, by capture on a starter copy with probe programs on B:.**
  - A program that writes 05h to the latch and then `RET`s ends at a warm boot: `B>EXP` is followed by a blank line and `B>`, with no banner. The same holds for `JP 0000h` (EXPJ) and for `JP C000h` (JC).
  - BIOS function 0, by `LD HL,(0001h)`, three `DEC HL` and `JP (HL)`, gives the banner and a cold boot, and so does `@reset`.
  - `test/expand.test.mjs`, run alone under the guard, passes 6 of 6, including B1 (the file's lines reach the card) and A12 (the write at BF80h is seen).
  - `RSTENT` is at C33Ch, so at reset 0002h holds C3h, and after a boot it holds BFh, which matches chapter 14 and appendix C.
- **Program search, by rerunning chapter 17's new capture.** The capture was `--card build/ccp.img B: "USER 3" ARGS MOUNT B:MOUNT DIR`, with the card remade as the chapter says. Its output matches the fence byte for byte, including the trailing spaces.
- **Close on a read-only drive, by capture.** A probe program makes and writes `ROTEST.TMP`, calls function 28, then closes that FCB and an FCB that was never opened. Both closes return `00`, there is no `R/O` error, and the directory entry is not updated.
- **Each value of B, by capture of ABICALL from a probe program. Each result is A, then carry.**
  - `VIDEO` with B = 2 and with B = FFh gives 01 01.
  - `RTC` with B = 2 gives 01 01.
  - `DRVR` with B = 0 and HL = 4000h, and with B = 2 and HL = 0, gives 01 01.
  - `DRVR` with B = 1 and HL = 0 gives 00 00.
- **Mount refusal.** `test/sd-range.test.mjs`, run alone under the guard, passes 3 of 3.
- **Stack figure.** `test/storage-boundaries.test.mjs`, run alone, reports `{"UNMOUNT":22,"MOUNT":22}` and passes 22 of 22.
- **Timings, rerun on the model.**
  - Cold boot to `CCPENT` takes 1,285,483 T-states. The CCP's last `BCONIN` before the first prompt comes at 8,838,438, and `STBOOT` on the web page's board at 5,863,724.
  - Chapter 19's `READ DATA.BIN` on `time.img` takes 6,633,600, then 1,335,103.
  - `SAVE 64 X.COM` takes 30,834,679 on B: and 9,913,579 on C:.
  - Appendix B's +28 T-states on `VIDEO` and `RTC` is the guard's `LD A,B`, `CP 2`, `LD A,n` and `JP NC`.
- **Figures, against `dist/tecos.census.json` and `dist/tecos.d8.json`.**
  - ROM regions: code C33Ch–F9EAh, 13,999 bytes; free F9EBh–FFFFh, 1,557 bytes.
  - The CCP runs from D7CDh, and the BDOS from E158h; the BDOS ends at F065h, 3,854 bytes.
  - Hardware routines: `HWSVID` 89 bytes, `HWSRTC` 146 bytes, 474 bytes in all from F066h to F240h.
  - `tecvol recipe` rebuilds a card with the SHA-256 0764d1b7…, identical to `dist/starter.img`. `TED.COM` is 11,923 bytes, 12,032 on the card, and its hash is 2b9291a8….
- **Web page saving**, by reading `web/src/main.mjs:103-134`, `508-513` and `web/src/store.mjs:41-58`. The test file's Node cases were started under the guard but stalled with no output and were stopped after 300 s. Another session's full test run (`k38-quick`) was running at the same time, so no further heavy job was started.
- **Fences.** No `&gt;`, `&lt;` or `&amp;` anywhere in the book's source.
- **Functions 44, 45, 46, 48 and 99, and a user number in the prompt.** The book mentions none of them.
- **Consistency across the book.**
  - The `VIDEO` and `RTC` B values agree in 09:481 and 673, 20:98 and 147, and appendix B:124 and 189, and agree with the code.
  - `DRVR` agrees in 15:347, 21:252 and appendix B:232.
  - A program ending with EXPAND 1 in view agrees in 07:316-320, 14:283-290 and appendix C:258-268.
  - The search order agrees in 03:423-431, 05:104, 17:153 and 345-353, 21:233-237, 24:164-167 and appendix D:143.
  - The standard-card bound is the exception in finding 1.

## What was checked, file by file

- 14-reset-and-boot.md: the `RSTENT` passage and the new warm-boot paragraph, by run and against `src/boot.asm` and `src/reset.asm`; every moved `boot.asm` citation against the numbered file; both timings rerun.
- 15-bios-and-console.md: the `SVDRV` refusal (`src/glcd.asm:6-13`) by run; the moved `glcd.asm`, `hwsvc.asm` and `boot.asm` citations.
- 16-bdos.md: the close on a read-only drive, by run and against `bdos.asm:558-602` and `2368-2382`; the BDOS's range against the map; the `R/O` list.
- 17-ccp.md: `LOADA`, by the new capture and against `ccp.asm:277-295` and `361-387`; the CCP's range; the cited line numbers.
- 18-sd-card-and-volumes.md: the mount refusal, by test and against `vol.asm:216-231`; the close sentence and `cpm22.test.mjs:174`; the stack of 22 by test. Finding 1.
- 19-block-cache.md: four timings rerun; citations.
- 20-hardware-services-and-service-loader.md: the `VIDEO` and `RTC` guards, by run; the byte table against the map; the `abi.inc`, `svc.mjs` and `prl.mjs` citations.
- 21-startup.md: `RSTENT`, the search order, the `SVDRV` refusal and the `STBOOT` timing (rerun).
- 22-command-history.md: moved `boot.asm` citations only.
- 23-diagnostics.md: moved `boot.asm` citations only.
- 24-chaining-inside.md: the search-order sentence; moved citations.
- 25-host-model.md: the EXPAND 1 watch (`machine.mjs:177-223`, the A12 test at `expand.test.mjs:67-77`); the count of 26 test files; the citations into fixtures, inputs and `package.json`; saving, by reading the code. Findings 1 and 3.
- appendix-a-bdos-functions.md: function 16 and the `R/O` list, by run; citations.
- appendix-b-rom-services.md: `VIDEO`, `RTC` and `DRVR`, by run; the T-state changes by the instructions' count; citations.
- appendix-c-memory-map.md: the ROM table against the census; the EXPAND 1 paragraph, by run; citations.
- appendix-d-error-messages.md: rows 27 and `R/O`, the program-name row and the `Bad Sector` row against the code; citations.
- appendix-e-container-format.md: row 27h against `vol.asm:194-230`; citations.
- appendix-f-tecvol.md: `--align` and `--drives`, by run; the `dir` listing and the rebuild from the recipe, by run. Finding 4.
- appendix-g-tec-1g.md: `RSTENT`, the mount refusal; citations.
- appendix-h-service-file-format.md: moved `abi.inc` and `svc.mjs` citations.
