# Review 12-a: chapters 1 to 11, appendices F, G and H, and the contents, at 58d4345

Read-only. Every capture in these files was rerun on copies of `rev58d` (`rv12a`, `rv12b`, `rv12c`) under the guard: 86 capture comments, plus the `tecvol info`, `tecvol dir`, `xxd` and `sha256sum` outputs. Every fence matches its capture. Chapters 1, 2, 3 and 5 were read whole, in order. Taken together they give one consistent account of the console at power-on (the ROM's PICO9918 console started before the banner when the VDP and the matrix keyboard answer, the serial terminal otherwise), of `CON`'s replies and aliases, of the six-file starter card, of `STARTUP.CMD`'s one line and of the quiet startup rule. The code bears that account out (`src/video.asm:7-11`, `src/pico.asm:30-44`, `src/cpm/ccp.asm:94-97`, `src/cpm/ccp.asm:276-283`, `src/loader.asm:452-469`, `drivers/glcd.asm:34-43`). Four findings follow.

## Findings

**1. `02-console.md:103-107`: `UC1:` with a missing driver doesn't fall back to `TTY:`.**
The claim: "`UC1:` needs the graphics LCD, its driver and the matrix keyboard. If any of them is missing, the BIOS uses the serial terminal and puts `TTY:` back in the console field". When `GLCD.SVC` can't be loaded, `CON UC1` puts back the mode already in effect, and the console stays where it was. `GLCLD` writes `CONMOD` back into the field after a failed load (`src/loader.asm:433-447`: "the console stays, so the field goes back"). The BIOS's fallback to `TTY:` applies only when the field names a display whose table isn't hooked (`src/console.asm:62-80`). Run on a copy of the starter card with `STARTUP.CMD` and `GLCD.SVC` erased, `--board pico --lcd "CON UC1" CON` gives `CON: CRT:` twice, with `GLCD?` on the LCD. Chapter 5 (lines 396-397) says it correctly: "The console stays where it was". The two chapters disagree only on this case. On the serial board both rules give `TTY:`, which is why the transcript at line 111 can't show the difference.
Smallest correction: "`CRT:` needs the PICO9918's console, which cold boot starts only on a board with the PICO9918 and the matrix keyboard, and without it the BIOS uses the serial terminal and puts `TTY:` back in the console field. `UC1:` needs the graphics LCD, its driver and the matrix keyboard, and when `CON UC1` can't install the driver the console stays where it was. So there is always a console, and `CON` reports the device that has it."

**2. `07-memory.md:112-114`, `09-hardware-services.md:364-366`, `10-writing-services.md:503-505`: "the web page's board" with `GLCD.SVC` installed at startup.**
All three passages put `GLCD.SVC` in from the startup file "on the web page's board". Chapter 1 (lines 340-343) and Chapter 5 (lines 349-351) say that the page, with the PICO9918 chosen, writes no `GLCD.SVC` line. The code agrees (`host/card.mjs:107-109`: no display line for `tms` at 80 columns). The captures are `--board pico` with copies of the starter card, which keep the `GLCD.SVC` line, so the transcripts are right and only the framing is wrong. A reader who repeats `BOARD` on the page gets `Devices B = 0B`, not `0F`. `B:TOP` there gives `B9A4h` before `CON UC1`, not `B600h`. The note in Chapter 10 that `UNLOAD` must come first doesn't apply on the page. Chapter 3 (line 396) avoids the problem by saying "With the starter card on the web page's board".
Smallest correction: in each passage, "On the web page's board" becomes "On a board with both displays, with the starter card's startup file," (or "With the starter card on the web page's board," as in Chapter 3).

**3. `02-console.md:208-209`: Oxford comma.**
"Any other width, a width after another name, or a width with no space before it is printed back". This is a list of three with a comma before "or".
Smallest correction: "Any other width, a width after another name or a width with no space before it is printed back".

**4. `02-console.md:226-228`: a width refused "while a program has claimed the PICO9918" can't be shown with `CON`.**
`TMSWID` does refuse while `VCLAIM` is set (`src/pico.asm:50-55`). But `CON` runs only at the prompt, and a warm boot releases every claim first (`src/boot.asm:86`, `HWVREL`, which Chapter 9 describes). So no command typed or chained can meet a claimed PICO9918. The refusal applies to a program's own call of `PICOWID`, which Chapter 10 describes.
Smallest correction: delete ", and while a program has claimed the PICO9918, as Chapter 9 describes", or move it to Chapter 10's account of `PICOWID`.

## Checked and true, not findings

- The order at power-on: page zero cleared, then `CONINIT`, then `VIDINIT`, then `PISTART`, then the IOBYTE set to 1, then the banner (`src/boot.asm:27-50`, `src/console.asm:26-45`). The diagnostic prompt is on the PICO9918's screen when there is no card (`--board pico --card none --screen` was run).
- `CON`'s aliases and widths, and their refusals (`src/cpm/ccp.asm:1078-1176`). Extra runs: `CON PICO 40` on the GLCD board gives `40?` and the console stays on `UC1:`. `CON CRT 40` from `UC1:` gives `CON: CRT:`. `CON GLCD` is `UC1:`. `CON CRT` with no PICO9918 console gives `CON: TTY:`.
- The give-way happens only while `CRT:` is in effect (`src/loader.asm:464-467`). Typed `GLCD.SVC` with the driver already in gives `GLCD.SVC?`.
- `TNDRVR` refuses B = 1 (`src/services.asm:320-331`). The older `PICO.SVC` (`test/fixtures/e5154ad`) fails typed on the pico board, the serial board and the GLCD board, and installs nothing.
- `GLCD.SVC` and `COUNT.SVC` can't both be in: the CCP's stack limit is 6 (`src/tables.asm:91`), `GLCD.SVC` takes 6 and `COUNT` takes 2. A run shows `COUNT.SVC?`.
- `TED`'s text room is 33,466 bytes on the serial board and 32,534 on the board with both displays (word at `0006h` `B9A4h` and `B600h`), measured at `TEXCAP` (`0x2551`).
- The keypad's read before `STARTUP.CMD` is at `STBOOT`, 1.49 s after reset on the serial and GLCD boards and 1.46 s on the pico board, so "about 1.5 seconds" holds.
- Addresses: `PIBLK` `BBE3h` (95 bytes, to `BC41h`), `VROW`/`VCOL` `BFE8h`/`BFE9h`, `ESCST` `BFECh`, `VATTR` `BFF0h`, `VCURV` `BFF1h`, `LATCHV` `0040h`. No symbol lies in `0041h–004Fh` (`tecos.d8.json`). `B9A4h`/47,268, `B600h`/46,336, `B6E4h`/46,564, `B300h`/45,568, 164 bytes, 704 bytes, 47,104 and 184 pages all agree with the map.
- Appendix H's `GLCD.SVC` dump, header fields, 69 fixups ending at file offset 561 and 93-byte bitmap were checked against `dist/files/GLCD.SVC`.
- No gone label (`CONACT`, `CONBAT`, `CONCRT`, `CONMSGS`, `CONTTY`, `CONUC1`, `DIRANY`, `DIRENTP`, `DIRF…`, `PICMSG`, `STDONE`) appears in these files. `PICO.SVC` appears only as an older card's file that the ROM refuses (Chapter 5, Chapter 10 line 288). No citation of `drivers/pico.asm` remains.

Not rerun: Chapter 9's T-state figures (24,511 and 32,169 for the loop, 217,252 for the release, and the `PUTAT`/`CONOUT`/function 2 table) and Chapter 8's 22-of-30 stack figure. No cheap run covers them.

## Per file

- `01-introduction.md`: read whole. All claims checked against the code, 12 fences (10 captures) rerun and all the same, no citations. No findings.
- `02-console.md`: read whole. 11 captures rerun and all the same, no citations. Findings 1, 3 and 4.
- `03-command-line.md`: read whole. 13 captures rerun and all the same, no citations. No findings.
- `04-cards-and-volumes.md`: diff checked. 6 captures and `tecvol info` rerun and all the same. 2 citations read (`src/vol.asm:194-208`, `web/src/main.mjs:598`), both hold. No findings.
- `05-startup-and-services.md`: read whole. 15 captures rerun and all the same, no citations. Rules checked against `src/cpm/ccp.asm`, `src/loader.asm`, `drivers/glcd.asm` and `host/card.mjs`. No findings.
- `06-first-program.md`: diff checked. 3 captures rerun and all the same. `TED` figures measured. No citations. No findings.
- `07-memory.md`: diff checked. 3 captures rerun and all the same. 2 citations (`src/boot.asm:17-19`, `src/boot.asm:81-95`) hold. Figures checked. Finding 2.
- `08-programs-and-console.md`: diff checked. 4 captures rerun and all the same. Workspace addresses checked. No citations. No findings.
- `09-hardware-services.md`: diff checked. 9 captures rerun and all the same. Timings not rerun. No citations. Finding 2.
- `10-writing-services.md`: diff checked. 5 captures rerun and all the same. `TNENODV` = 2, `PICOWID` at offset 24 and `PICOVER` 3 checked in `src/abi.inc`. No citations. Finding 2.
- `11-chaining-commands.md`: diff checked. 7 captures rerun and all the same. The quiet-startup return code checked (`src/cpm/ccp.asm:168-170`, `src/cpm/ccp.asm:276-283`). No findings.
- `appendix-f-tecvol.md`: diff checked. 1 capture, `tecvol dir` and the recipe's SHA-256 rerun and all the same. All 37 citations read; the 3 that moved (`tools/media.mjs:206-225`, `tools/media.mjs:227-240`) hold. No findings.
- `appendix-g-tec-1g.md`: all 47 citations read at 58d4345, the 18 changed ones among them (`src/video.asm:7-11`, `src/pico.asm:30-44`, `src/console.asm:131/133/185/186/195-205/203/302`, `src/cpm/ccp.asm:1577-1579`, `src/boot.asm:44-47`, `src/boot.asm:296-326`, `src/services.asm:147-166/265-277/285-291`, `src/layout.asm:37`). All hold. No findings.
- `appendix-h-service-file-format.md`: all 21 citations read, the 11 changed ones among them (`src/abi.inc:101-103`, `tools/lib/svc.mjs:83/105/106/111/111-120`, `src/loader.asm:346-361`, `drivers/glcd.asm:16`, `drivers/glcd.asm:34-37`). All hold. The `xxd` outputs rerun and the same. No findings.
- `index.md`: diff checked against the chapters (ABI 5.1, services 0 to 15, functions 44 to 46 and 99, `STBOOT` and `STLINE`, one word on the LCD). The one transcript matches `CON`'s reply. No findings.

## Resolved

All four findings were applied in 2be6b7c: chapter 2 says `CRT:` falls back to `TTY:` while a `CON UC1` that cannot load the driver leaves the console where it was, drops the claimed-PICO9918 clause and the Oxford comma; chapters 7, 9 and 10 frame their captures as the starter card on a board with both displays.
