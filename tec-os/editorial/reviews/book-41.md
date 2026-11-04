# Review of chapters 18 to 25 and appendices D and E at 58d4345

Read-only check of the book at `08371a2` (branch `tec-os-book`) against TEC-OS
58d4345. Runs on copies of `$S/rev58d` and `$S/rev5a2` in `$S/rc12`, each under
`mem-guard` (`--limit 900`), peak 158 MB.

## Findings

### 1. Chapter 19's READ DATA.BIN timings are out of date

`19-block-cache.md:162-163`: "the command's first run took 6,637,045 T-states,
1.66 seconds, and its second 1,338,138, 0.33 seconds".

Evidence: the chapter's method, rerun. The run builds `time.img` with the
chapter's commands (`read.com` from `$S/ab14`, 24 bytes, `data.bin` of 12,288
zeros). It then boots a `Machine` on `dist/tecos.rom` with the serial board
(`glcd: false`), as `tools/capture.mjs` does. It reads `cycles` once `READ
DATA.BIN` has been typed and echoed and again at the next prompt, twice after
one cold boot. Script `$S/rc12/t/time.mjs`.

| Build | First run | Second run | Ratio |
| --- | ---: | ---: | ---: |
| 5a25178 | 6,637,045 (1.659 s) | 1,338,138 (0.335 s) | 0.2016 |
| 58d4345 | 6,642,461 (1.661 s) | 1,343,554 (0.336 s) | 0.2023 |

At 5a25178 the method gives the book's figures exactly. At 58d4345 each run
takes 5,416 T-states more. That fits the three new tests in `BENTRY` for
functions 44, 46 and 99 (`src/cpm/bdos.asm:87-96`), which every call below 41
passes.

Correction: "the command's first run took 6,642,461 T-states, 1.66 seconds, and
its second 1,343,554, 0.34 seconds, a fifth of that."

### 2. Chapter 19's SAVE timings are out of date too

`19-block-cache.md:241-243`: "`SAVE 64 X.COM`, 16 KiB, took 30,596,582
T-states, 7.65 seconds, on `THROUGH`. On `BEHIND` it took 9,933,063, 2.48
seconds".

Evidence: the same dispatcher change, measured as the chapter describes: a cold
boot on `time.img`, `B:` or `C:`, then the count from the echoed line to the
next prompt. Script `$S/rc12/t/save.mjs`. At 5a25178 the run gives 30,596,582
and 9,933,063, the book's figures. At 58d4345 it gives 30,609,364 (7.652 s) and
9,945,845 (2.486 s).

Correction: "took 30,609,364 T-states, 7.65 seconds, on `THROUGH`. On `BEHIND`
it took 9,945,845, 2.49 seconds, about a third of that."

The chapter's BIOS-level figures (13,718, 235,357, 259, 6,270, 226,445 and
1,111,809) don't change, since `src/cache.asm`, `src/bios.asm`, `src/sd.asm` and
`src/vol.asm` are the same at both commits.

### 3. Chapter 20: service 15 is no longer past the table

`20-hardware-services-and-service-loader.md:517-518`: "Number 15, one past
`LIST`, returns carry from the dispatcher, and the service stays found
(`test/svc.test.mjs:342`)."

Evidence: `src/abi.inc:89-93` makes 15 `TNFONT`, with `TNCOUNT` 16, and
`src/tables.asm:84` puts `HWSFONT` in `SVTAB`. The test now calls 16:
`test/svc.test.mjs:345` has `{ b: 0, c: 16 }` with the comment `past the last,
TNFONT`. The chapter's own range test, at line 36, already says 16 or more.

Correction: "Number 16, one past `FONT`, the last, returns carry from the
dispatcher, and the service stays found (`test/svc.test.mjs:342-346`)."

### 4. Chapter 20: `DRVR` now records one table

`20-hardware-services-and-service-loader.md:485-486`: "the tables that `DRVR`
records for the display modes are beyond it".

Evidence: `src/services.asm:321-327` takes `B` = 3 alone, so `DRVR` writes only
`UC1:`'s word, `GLVEC`. `CRT:`'s `PIVEC` is set by `PISTART`
(`src/pico.asm:38-39`), not by `DRVR`. The cited test checks `GLVEC` alone
(`test/svc.test.mjs:531-537`).

Correction: "the table that `DRVR` records for `UC1:`, in `GLVEC`, is beyond it".

### 5. Chapter 21: a test citation the move missed

`21-startup.md:70`: "`:194-207` does the same for a file that resets the board
at every boot."

Evidence: at 58d4345 `test/startup.test.mjs:194-207` is the end of the
line-equality tests and the start of the unreadable-file test. The cold-boot
test is at `test/startup.test.mjs:221-234` ("a file that cold boots the
machine runs for ever, and the skip breaks it"). The bare `:NNN` form was
outside the script's pattern. The citation before it in the same paragraph
moved by 24 (172 to 196).

Correction: "`:221-234` does the same".

### 6. Chapter 23: the serial terminal is silent in the new transcript

`23-diagnostics.md:55-56`: "Here the model has a PICO9918 and an empty socket,
and `H` was typed at the prompt. The screen shows what the serial terminal
shows:"

Evidence: on this board the console is `CRT:` from before the banner
(`src/console.asm:45`, `src/video.asm:7-11`, `src/pico.asm:30-44`), so nothing
leaves the serial port. `node tools/capture.mjs --card none --board pico
--serial H` prints only an empty line. The fence is the screen, and the same
text as the serial terminal shows on a board without the PICO9918.

Correction: "The screen shows the lines that the serial terminal shows on a
board without the PICO9918, and the serial terminal here shows nothing:"

### 7. Chapter 23: "Only the RAM check comes before it" contradicts the chapter

`23-diagnostics.md:29-30`: "The banner is printed before the card is touched
(`src/boot.asm:49-50`), so it appears whatever the card holds. Only the RAM
check comes before it."

Evidence: `src/boot.asm:33-48` runs `RAMCHK`, then `CONINIT`, which ends in
`JP VIDINIT` (`src/console.asm:45`), and `VIDINIT` starts the ROM's PICO9918
console with `PISTART` (`src/video.asm:7-11`). The clock test `RTCHAS` follows.
Only then comes `BANNER`. The same chapter says at line 50 that cold boot
starts the PICO9918's console "before the banner". The sentence was left
unchanged, and KS39 put the console's start ahead of the banner.

Correction: "Before it come only the RAM check, the console's start, the ROM's
PICO9918 console included, and the test for the clock (`src/boot.asm:33-47`)."

### 8. Chapter 24: five workspace figures from 5a25178

`24-chaining-inside.md:36-46`. The diff changed the citations in this passage
but not the addresses:

| Line | Book | 58d4345 (`tecos.d8.json`) |
| ---: | --- | --- |
| 36 | `CMDFCB` at `BCEAh` | `BCEDh` |
| 36 | `CCPCLR` at `BDB4h` | `BDB7h` |
| 39 | `CMDTXT` at `BD34h` | `BD37h` |
| 41 | `CCPCLR` to `BDOSRME`, 332 bytes | `BF00h` − `BDB7h` = 329 bytes |
| 46 | `CHPOS` at `BFE2h` | `BFE4h` |

At 5a25178 the book's values were right: `CMDFCB` `BCEAh`, `CCPCLR` `BDB4h`,
`CMDTXT` `BD34h`, `CHPOS` `BFE2h`, and 332 bytes. The 202 bytes from `CMDFCB`
to `CCPCLR` and `PRGCODE` at `BF54h` still hold. Chapter 21 already gives
`CMDTXT`'s last byte as `BDB6h` (`21-startup.md:167`), which matches `BD37h`,
so the two chapters now disagree.

Correction: `BCEDh`, `BDB7h`, `BD37h`, "329 bytes" and `BFE4h`.

## Per file

- `18-sd-card-and-volumes.md`: diff read, 10 changed citations read at
  58d4345, sample of unchanged ones (abi.inc, layout.asm) read, 3 transcripts
  rerun (`short.img` and `bad.img` rebuilt by the chapter's commands, `MOUNT`):
  all match. The TPA of 46,564 and the 704 fewer agree with the README and 47,268.
  No findings.
- `19-block-cache.md`: diff read, 8 changed citations read, the DIRBUF address
  checked, two timing pairs rerun at both commits: findings 1 and 2.
- `20-hardware-services-and-service-loader.md`: diff and whole chapter read,
  130 changed citations read in full and 81 unchanged ones read (dispatcher,
  INFO, loader steps). Two transcripts: the `--board pico SERVICES` capture was
  rerun and matches. The `GAPZERO.SVC` capture wasn't rerun, since it needs
  Chapter 10's `COUNT.SVC` on `svc.img`. These figures check against the map
  and `GLCD.SVC` itself: `BFEAh` and `BFEBh`, `B9A4h` and `B9A7h`, the 164
  bytes and 420, `B600h`, the words `00F0h`, `014Bh` and `0150h`, the 765
  bytes and three pages, 47,268 to 46,336, 480 bytes and the 6 of `HWSFONT`.
  The stack table matches `build/stack-census.json` from
  `test/stacks.test.mjs` (`$S/ab12-stacks.out`), with base 32, 18 and 18.
  Findings 3 and 4.
- `21-startup.md`: diff and whole chapter read, 117 changed and 12 unchanged
  citations read. No transcripts. These figures agree with the map: `STPOS`
  `BF63h`, `STREC` `BF64h–BFE3h`, `STFLAG` `BF62h`, `CONDEV` `BFE7h`, `BDB6h`
  and `BDB7h`, and the 11-byte starter file's table. The STBOOT time of
  5,825,597 T-states (1.46 s) was rerun on the pico board with the starter card
  and matches, and the same script gives the old 5,954,548 at 5a25178. The
  quiet rule was checked against `src/cpm/ccp.asm:277-283` and
  `test/startup.test.mjs:60-93`. Finding 5.
- `22-command-history.md`: diff read, 23 changed and a sample of unchanged
  citations read, 7 transcripts rerun: all match. No findings.
- `23-diagnostics.md`: diff and the prompt and board-run sections read, 20
  changed and a sample of the 50 unchanged citations read. The new transcript
  was rerun and matches on the screen, with `--serial` also run. The diag ROM's
  inputs (`diag/`, `tools/diag.mjs`, `format/`) are unchanged between 5a25178
  and 58d4345, so the image ID stands. Findings 6 and 7.
- `24-chaining-inside.md`: diff read, all 67 changed citations read. The changed
  transcript was rerun and matches, and its new claim was run with
  `GLCD.SVC!:MOUNT` in place of `NOSUCH.SVC!:MOUNT` on the serial board: the
  line is quiet and `:MOUNT` runs. The dispatcher list was checked against
  `src/cpm/bdos.asm:81-100`. Finding 8.
- `25-host-model.md`: diff read, 38 changed and 59 unchanged citations read,
  including every `web/src/main.mjs` move, `host/card.mjs`,
  `test/lib/fixtures.mjs`, `tools/media.mjs` and `web/build.mjs`. Two
  transcripts were rerun and both match, the `--screen` one as the console fence
  plus the screen fence. 53 test files counted at 58d4345. No findings.
- `appendix-d-error-messages.md`: diff read, all 105 changed citations read and
  37 unchanged ones listed. These runs check the `CON` row: `CON CRT`, `CON
  UC1`, `CON GLCD` and `CON` on the serial board give `CON: TTY:`, `CON PICO 40`
  and `CON TTY 40` give `40?`, and `CON CRT80` gives `CRT80?`. On the pico
  board `CON PICO 50` gives `50?`, and `CON CRT 32`, `CON TTY` and `CON PICO 40`
  each take effect. The diagnostic-prompt console was checked by the run in
  finding 6. Every anchor in these files resolves. No findings.
- `appendix-e-container-format.md`: diff read, 3 changed and 37 unchanged
  citations listed. The `od` dump of the new starter image, `tecvol verify` on
  `swapped.img`, its capture and the `--drives 2` refusal were rerun: all
  match. No findings.

No semicolons or em dashes in the changed lines of these files, and no gone
label or current `PICO.SVC` named. `PICO.SVC` appears only as an older card's
file the ROM refuses (`21-startup.md:222`, `21-startup.md:354`,
`appendix-d-error-messages.md:145`).

## Resolved

All eight findings were applied in da73f72: chapter 19 and chapter 4 take the timings at 58d4345 (6,642,461 and 1,343,554, 0.34 s; 30,609,364 and 9,945,845, 2.49 s); chapter 20 gives number 16 past `FONT` and the one table `DRVR` records; chapter 21 cites `test/startup.test.mjs:221-234`; chapter 23 names `CONINIT` and the clock test before the banner and says the serial terminal shows nothing; chapter 24 takes the workspace addresses and the 329 bytes at 58d4345.
