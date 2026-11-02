# Citation check of the TEC-OS book, chapters 14 and 23, against commit 62d47ed

Method: both chapters were read in full from `debug80-docs-tec-os/tec-os/`. Every `file:line` citation was read at 98c6416 and at 62d47ed, and every claim about the code was checked against 62d47ed. Moved citations were then compared mechanically: the old range's text against the new range's. The source change was read as `git diff 98c6416 62d47ed -- src/`.

`dist/` in the TEC-OS checkout does not hold a build of 62d47ed. Its ROM has SHA-256 71865f50… and no `CHPOS`, `CHDROP` or `CCPCLR` symbol, so a capture from there would have tested older code. Building there would have written into that repository, so nothing was built or run in it, and it was left clean at 62d47ed. Both commits were instead exported with `git archive` to directories outside any repository and built with their own unmodified `npm run build` and `npm run media`, with `EDIT_COM` set to `edit/dist/EDIT.COM`, the input the media tool pins (SHA-256 2c9e7d0e…). Results:

| Commit | ROM SHA-256 | ROM bytes used | TPA | Starter card SHA-256 | `EDIT.COM` on the card |
| --- | --- | ---: | ---: | --- | --- |
| 98c6416 | 59f01f21… | 14,541 | 46,854 | 2d77a418… | ed88337e… |
| 62d47ed | 12a70955… | 14,777 | 46,854 | 2d77a418… | ed88337e… |

The 98c6416 hash matches the one recorded in `book-1.md`. The starter card and `EDIT.COM` are identical at both commits, and the `EDIT.COM` hash in both chapters is right. `capture.mjs` does not exist at 98c6416, so the old ROM was driven by the 62d47ed script with `--rom`.

T-state figures were taken on the serial board with the starter card, by cycle count at a routine's entry and again at its return address. The harness was calibrated on the 98c6416 ROM first: it reproduced every timing in chapter 14 exactly, except the one in F3.

## 1. Line numbers to fix

Each entry gives the chapter line, the citation as printed and its replacement. "Moved" means the same text at a new line. "Text changed" means the replacement range is the right one but its code differs, and section 2 says whether the sentence still holds.

**14-reset-and-boot.md (12 of 68):**

| Chapter line | Printed | Corrected | Kind |
| --- | --- | --- | --- |
| 106 | `src/boot.asm:290-308` | `src/boot.asm:291-309` | moved |
| 110 | `src/boot.asm:291-293` | `src/boot.asm:292-294` | moved |
| 112 | `src/boot.asm:310-319` | `src/boot.asm:311-320` | moved |
| 250 | `src/cpm/ccp.asm:213-216` | `src/cpm/ccp.asm:297-300` | moved |
| 251 | `src/cpm/bdos.asm:97-98` | `src/cpm/bdos.asm:132-133` | moved |
| 253 | `src/cpm/bdos.asm:336-340` | `src/cpm/bdos.asm:371-375` | text changed: `JP CHDROP` |
| 254 | `src/cpm/bdos.asm:2372-2375` | `src/cpm/bdos.asm:2434-2437` | text changed: `JP CHDROP` |
| 255 | `src/cpm/bdos.asm:2391-2394` | `src/cpm/bdos.asm:2453-2456` | text changed: `JP CHDROP` |
| 281 | `src/boot.asm:270-288` | `src/boot.asm:270-289` | text changed: `CPMINIT` starts at `CCPCLR` |
| 288 | `src/cache.asm:347-355` | `src/cache.asm:347-358` | text changed: `CHPOS` cleared |
| 301 | `src/cpm/ccp.asm:25-50` | `src/cpm/ccp.asm:29-66` | text changed: the drive check. The old range ended one line short, on `LD C,14`; the new one includes the `CALL BDOS` |
| 308 | `src/cpm/bdos.asm:445-507` | `src/cpm/bdos.asm:481-542` | text changed: `USERNO` line gone, which the sentence doesn't mention |

**23-command-history.md (18 of 36):**

| Chapter line | Printed | Corrected | Kind |
| --- | --- | --- | --- |
| 102 | `src/ram.asm:216-217` | `src/ram.asm:220-221` | moved |
| 114 | `src/cpm/ccp.asm:67-71` | `src/cpm/ccp.asm:85-89` | moved |
| 114 | `src/ram.asm:137` | `src/ram.asm:141` | moved |
| 118 | `src/cpm/bdos.asm:407-420` | `src/cpm/bdos.asm:442-455` | moved |
| 121 | `src/cpm/bdos.asm:416-418` | `src/cpm/bdos.asm:451-453` | moved |
| 122 | `src/boot.asm:272-276` | `src/boot.asm:273-277` | text changed: `CCPCLR` |
| 124 | `src/cpm/ccp.asm:65-66` | `src/cpm/ccp.asm:83-84` | moved |
| 128 | `src/cpm/ccp.asm:73-92` | `src/cpm/ccp.asm:140-152` | rewritten: `UPLOOP` is gone; `MLTK1` to `MLTKN` capitalise one piece |
| 178 | `src/boot.asm:279-280` | `src/boot.asm:280-281` | moved |
| 185 | `src/cpm/bdos.asm:267-270` | `src/cpm/bdos.asm:302-305` | moved |
| 187 | `src/cpm/bdos.asm:298-301` | `src/cpm/bdos.asm:333-336` | moved |
| 188 | `src/cpm/bdos.asm:302` | `src/cpm/bdos.asm:337` | moved |
| 191 | `src/ram.asm:138` | `src/ram.asm:142` | moved |
| 193 | `src/cpm/bdos.asm:232-233` | `src/cpm/bdos.asm:267-268` | moved |
| 210 | `src/cpm/bdos.asm:394-405` | `src/cpm/bdos.asm:429-440` | moved |
| 221 | `src/boot.asm:272-276` | `src/boot.asm:273-277` | text changed: `CCPCLR` |
| 221 | `src/ram.asm:186` | `src/ram.asm:190` | moved |
| 222 | `src/ram.asm:217` | `src/ram.asm:221` | moved |

The other 74 citations are unchanged at 62d47ed and say what the chapters claim: 56 in chapter 14 and 18 in chapter 23. The whole of `src/history.asm` is unchanged, as are `src/reset.asm`, `src/layout.asm`, `src/diag.asm`, `src/vol.asm` and `src/xmove.asm`.

## 2. Claims false or incomplete at 62d47ed

Replacement sentences carry their corrected citations.

### False

**F1. `CPMINIT` no longer clears from `CCPRAM`.** Chapter 14, lines 276-281, says it clears "533 bytes from `CCPRAM` to `BDOSRME`". At 62d47ed it starts at `CCPCLR`, `BDB5h`, and clears 331 bytes (`src/boot.asm:273-277`). The 202 bytes below it hold the two FCBs and the command buffer (`src/ram.asm:68-81`). Chapter 25, lines 36-38, already has this right. Replacement:

> 5. `CPMINIT`, which clears the CCP's working memory and the BDOS's state, 331 bytes from `CCPCLR` to `BDOSRME`, as a fresh load of them from disk would leave it, keeps the command buffer below `CCPCLR` for a chained line's next piece, puts the DMA address back at `0080h`, sets the command buffer's maximum length to 127, fills the CCP stack's guard with `A5h` and marks the deblocking buffer empty so that a changed card is read again (`src/boot.asm:270-289`, `src/ram.asm:68-81`).

**F2. Cold boot's length.** Chapter 14, lines 91-92, gives 1,283,603 T-states. At 62d47ed it is 1,279,382: 4,242 fewer for the 202 bytes `CPMINIT` leaves, and 21 more for the extra workspace byte. "About 0.32 seconds" stands. Replacement: "cold boot takes 1,279,382 T-states from the first instruction to the CCP's entry, about 0.32 seconds".

**F3. The first call of `CONIN`.** Chapter 14, lines 97-98, gives 8,892,118 T-states. This doesn't reproduce at either commit. The first entry to `BCONIN` is at 8,908,349 at 98c6416 and 8,907,139 at 62d47ed. It matches no entry to `BCONOUT` or `BCONIN` near that prompt: at 98c6416 the `>` enters `BCONOUT` at 8,897,686. The error predates the chained line, and `book-2.md` F8 reported the same kind of mismatch for the figure then in the chapter. Replacement: "The CCP's first call of `CONIN` at that prompt comes 8,907,139 T-states after reset."

**F4. Warm boot's length.** Chapter 14, lines 316-318, gives 35,602 T-states, "about 9 milliseconds". At 62d47ed it is 31,455, about 7.9 ms, on the same measure. Replacement: "warm boot takes 31,455 T-states, about 8 milliseconds".

**F5. `CPMINIT`'s length.** Chapter 14, line 320, gives 11,669. At 62d47ed it is 7,427.

**F6. The CCP's entry.** Chapter 14, line 322, gives 13,733. At 62d47ed it is 13,828, with 95 for the drive check. `CWBOOT`'s 8,002 is unchanged. Replacement for lines 320-322: "Of it, `CPMINIT` takes 7,427 T-states, the cache's flush in `CWBOOT`, with no line to write, 8,002, and the CCP's entry with its disk reset 13,828."

**F7. Warm boot after `SAVE 8 X.COM`.** Chapter 14, line 324, gives 123,655. At 62d47ed it is 119,508. The next sentence's "extra 88,000 or so" stands: 88,053 at both commits.

**F8. A program's disk reset.** Chapter 14, line 328, gives 1,035,495. At 62d47ed it is 1,035,496.

**F9. The first scan of drive B.** Chapter 14, line 331, gives 9,163,463. At 62d47ed it is 9,163,477. Its 32 block reads are confirmed.

**F10. What warm boot clears, in chapter 23.** Lines 119-122 say warm boot clears `HFLAG` "with the rest of the CCP's and the BDOS's RAM". The command buffer and the FCBs are CCP RAM and are kept (`src/ram.asm:68-81`). `HFLAG` itself is still cleared: it is above `CCPCLR` (`src/ram.asm:141`). Replacement: "`LINDONE` cleared it after the CCP's line, and every warm boot clears it too, with the rest of the RAM from `CCPCLR` up, for a line the CCP abandoned at `^C` (`src/cpm/bdos.asm:451-453`, `src/boot.asm:73`, `src/boot.asm:273-277`)."

### Incomplete

**I1. The ways a program reaches warm boot.** Chapter 14, lines 248-251, gives three and reads as the whole list. BDOS function 47 is a fourth (`src/cpm/bdos.asm:65-71`). `test/chain.test.mjs` passes at 62d47ed, 29 of 29, with function 47 among its cases. Replacement:

> A program reaches it by returning from `0100h`, since the CCP pushes `0000h` before it jumps there (`src/cpm/ccp.asm:14`, `src/cpm/ccp.asm:297-300`), by jumping to `0000h`, by calling BDOS function 0 (`src/cpm/bdos.asm:132-133`), or by a call of BDOS function 47 that succeeds (`src/cpm/bdos.asm:65-71`).

**I2. The BDOS's own exits.** Chapter 14, lines 251-255, is still true of where they end, but each now goes through `CHDROP`, which clears `CHPOS` first (`src/cpm/bdos.asm:75-77`). A `^C` at a program's line input and a BDOS error therefore end a chained line, where a program's ordinary warm boot goes on to the next piece. Replacement:

> The BDOS goes there itself, through `CHDROP`, which first drops the rest of a chained line (`src/cpm/bdos.asm:75-77`), after a `^C` typed as the first key of a line read with function 10 (`src/cpm/bdos.asm:371-375`) and after it has reported a disk error such as `Bdos Err On B: Select` (`src/cpm/bdos.asm:2434-2437`, `src/cpm/bdos.asm:2453-2456`).

**I3. `CWBOOT`.** Chapter 14, lines 286-288, leaves out that a failed write also drops the chained line (`src/cache.asm:354-356`). Replacement:

> 7. `CWBOOT`, which writes every changed line of the cache to the card and, if any write has failed since the last warm boot, prints `Write lost` and drops the rest of a chained line (`src/boot.asm:79`, `src/cache.asm:347-358`).

**I4. What warm boot leaves.** Chapter 14, lines 292-299, omits the part of the CCP's RAM that chaining depends on. Insert after "are outside what it clears too.":

> The two FCBs and the command buffer, the 202 bytes of the CCP's RAM below `CCPCLR`, are outside it as well, and so is `CHPOS` above the BIOS table, so the rest of a chained line outlives the warm boot (`src/ram.asm:68-81`, `src/ram.asm:240`). Chapter 25 describes that line.

**I5. The CCP's entry.** Chapter 14, lines 301-312, misses two changes. The CCP now tests the drive it was given: a drive past D:, or one with no volume, becomes A: (`src/cpm/ccp.asm:33-44`). The capture `"B:" "A:MOUNT B:" CON` shows it: the prompt after `MOUNT` is `A>`, and `SAVEDU` then writes A: to `0004h`. And the main loop takes a chained line's next piece before anything else (`src/cpm/ccp.asm:80-84`). Replacement for lines 301-302:

> The CCP's entry does the rest (`src/cpm/ccp.asm:29-66`). It sets its stack, puts A: in place of a drive with no volume, since selecting one would give a `Select` error and a warm boot back to the same place (`src/cpm/ccp.asm:33-44`), and sets `WRFLAG` before it calls BDOS function 13, the disk reset.

Add after "selects the drive if it is not A.":

> Its main loop then takes a chained line's next piece, if one is left, before the startup file's next line and before the console (`src/cpm/ccp.asm:80-84`).

**I6. What goes into the history.** Chapter 23, lines 122-125, is true but predates chaining, and a reader of Chapter 11 will ask what a chained line does. A chained line goes in once, whole, with its `!` and `:`, and later pieces add nothing. Capture: `con!dir *.cmd` then `^W` recalled the whole line in small letters and ran both pieces. Lines 113-114 are also conditional now: `HFLAG` is set only when no piece and no startup line is left (`src/cpm/ccp.asm:80-89`). Replacement for lines 122-125:

> So only the lines typed at the CCP's prompt go into the history. A chained line goes in once, whole, with its `!` and `:`, so `^W` brings all of it back. The CCP takes the line's pieces, and a command from function 47, from `CMDTXT` with no call of function 10, and they add no entry (`src/cpm/ccp.asm:80-81`). The lines of `STARTUP.CMD` don't go in either: the CCP takes each of them from `STLINE` in place of function 10 (`src/cpm/ccp.asm:83-84`), so after cold boot the history is empty.

**I7. Capitals.** Chapter 23, lines 127-128, is true, but the capitalising it cites is a different loop that stops at each piece's `!`. Replacement: "`HSTORE` stores the line as function 10 returns it, before the CCP turns small letters into capitals, which it does a piece at a time (`src/cpm/ccp.asm:140-152`), so a recalled line comes back as it was typed:".

**I8. `RSLCAP`'s addresses.** Chapter 14, line 156, says the test "reads only fixed addresses". It also reads the three bytes at the address held in `STUBAD` (`src/boot.asm:105-120`), which comes from the old RAM, and the chapter's own third bullet says so. The comment at `src/boot.asm:84-85` has the same wording. This predates the chained line. Replacement: "and it reads only page zero, `STUBAD`, the three bytes `STUBAD` names and the drive table, and runs none of the code it reads."

### Other edits

- **Commit lines.** Both chapters' `Checked against TEC-OS 98c6416` become `62d47ed` once the corrections are in (14:10, 23:10). The Edit commit and hash stay.
- **Chapter 22.** Chapter 14, line 311, says "Chapter 22 describes it", and no `22-*.md` exists among the chapters. `index.md:197` lists Startup as chapter 22 with no link. `17-ccp.md:59,116` has the same reference. This isn't a code claim and isn't counted below. The reference stands only if the chapter is written.

## 3. Figures and claims confirmed unchanged

- Banner: 25 characters, `BCONOUT` 9,372 T-states each.
- First block read: `SDREAD` 219,137.
- `MEMINIT`: 347,088, "about 347,000".
- `CWBOOT` with nothing to write: 8,002.
- A warm boot with nothing changed and one after `SAVE` both make no call of `SDREAD`, and the program's disk reset makes none. The first scan of B makes 32.
- `test/warmboot.test.mjs` passes at 62d47ed, 8 of 8, with its bound of 386,604 as cited.

Cold boot's fourteen steps and warm boot's steps 1-4, 6 and 8, the `DETECT`, `MEMINIT`, `RAMCHK`, `RESEL` and `PZINIT` descriptions, the reset test's four conditions, and all of chapter 23's ring, `HGET`, `HPUT`, `HSTORE`, `HSCLR` and `HREC` descriptions hold at 62d47ed. `EI` is an instruction in `src/` only at the three lines cited, and nowhere in `drivers/`; the `EI` at `0038h` is the byte `PZINIT` writes (`src/boot.asm:231-234`), which line 235 describes. Addresses checked: `MAINS` at `C00Dh`, `WSBASE` unchanged, `EXPANDS` at `0044h`. Cross-references to Chapters 3, 13, 15, 18 and 19 point at text that exists.

The chapter 14 claim that a drive empty before a reset stays empty (lines 196-197) can't be reached for drive A: `MOUNT A:` prints `Cannot unmount`, so the case where `RESEL` would read a geometry of 0 as no selection doesn't arise from `MOUNT`.

## 4. Transcripts

All nine transcripts were rerun at 62d47ed and all nine match the chapter byte for byte, each as the tail of its capture. All nine give the same output on the 98c6416 ROM.

| Chapter line | Capture |
| --- | --- |
| 14:203 | `"MOUNT B:" "@reset"` |
| 14:258 | `^C` |
| 23:30 | `--board pico --screen`, recall of `CON` |
| 23:54 | `--board pico --screen`, editing `DIR *.DRV` |
| 23:70 | `--board pico --screen`, `^N` past the newest |
| 23:131 | `--board pico --screen con`, small letters kept |
| 23:153 | `--board pico --screen`, the repeat left out |
| 23:225 | `CON "^C"`, then `^W` |
| 23:244 | `CON "@reset"`, then `^W` |

None was rerun from `dist/` in the TEC-OS checkout, because that build isn't 62d47ed. All nine ran from the separate export described under Method.

## 5. Claims that couldn't be confirmed

- The hardware statements in chapter 14: the latch at `00h` out of reset, the ROM's copy at `0000h`, a floating bus with U9 empty, and what RAM holds at power-on. These rest on code comments and the model, not on a board.
- "As CP/M 2.2 does" (14:309, 23:187). This agrees with the comments in the source. No CP/M 2.2 reference was checked.
- The `Write lost` branch of `CWBOOT` and the `RAMBAD` paths were read, not run. The sentences in I3 rest on `src/cache.asm:354-356`.

## 6. Defects in TEC-OS

**D1. `FNDELETE` frees each directory entry's blocks twice.** `src/cpm/bdos.asm:712-713` holds two consecutive `CALL FREEENT` lines. The doubling came in with `ROTEST` in b947e1e, which replaced the `DELFREE:` label and left one call too many; the commit before it has one. `CLRBLK` only clears bits (`src/cpm/bdos.asm:2306-2312`), so the second call gives the same vector and no wrong result. The cost is 3 bytes of ROM and the time of a second `FREEENT` for each entry erased, 1,645 T-states for the file in the reproduction.

Reproduction, on a 62d47ed build:

```sh
node --input-type=module -e '
import { readFileSync } from "node:fs";
import { Machine, symbolsFromD8 } from "./host/machine.mjs";
import { fontBytes } from "./tools/lib/font.mjs";
Machine.font = fontBytes(process.cwd() + "/");
const rom = readFileSync("dist/tecos-debug80.rom");
const symbols = symbolsFromD8(JSON.parse(readFileSync("dist/tecos-debug80.d8.json")));
const m = new Machine({ rom, symbols, sdImage: new Uint8Array(readFileSync("dist/starter.img")), glcd: false });
const done = () => (m.pumpInput(), !m.pending?.length) && m.ready() && /[A-P]>$/.test(m.text(0));
m.runUntil(done, 400000000, "boot");
m.enqueueInput("SAVE 1 X.COM\r", "serial"); m.runUntil(done, 400000000, "save");
const f = m.sym("FREEENT"), step = m.step.bind(m); let n = 0;
m.step = () => { if (m.pc === f) n += 1; return step(); };
m.enqueueInput("ERA X.COM\r", "serial"); m.runUntil(done, 400000000, "era");
console.log("FREEENT calls for one entry:", n);'
```

It prints 2 at 62d47ed and 1 at 98c6416. Correction: delete line 713.

No other defect was found in the code these chapters cover.

## 7. Counts

| | Chapter 14 | Chapter 23 | Total |
| --- | ---: | ---: | ---: |
| Citations checked | 68 | 36 | 104 |
| Line numbers to fix | 12 | 18 | 30 |
| Claims false | 9 | 1 | 10 |
| Claims incomplete | 6 | 2 | 8 |
| Claims wrong | 15 | 3 | 18 |
