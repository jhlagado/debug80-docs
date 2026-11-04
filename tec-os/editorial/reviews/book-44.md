# Review 13-C: chapters 18 to 25, Appendices D and E, at 621201d

Book at `tec-os-book` HEAD (56864d0), against e29a5f9. Code read at 621201d from a
fresh archive. Captures rerun on a copy of `rev621`, each under the memory guard.

## Findings

1. **`18-sd-card-and-volumes.md:59` and `:90`: the new SD codes are given in
   decimal, "error 11, `SDEVOLT`" and "error 10, `SDEDTOK`".** `DIAG` prints the code
   as two hexadecimal digits (`src/boot.asm:477`, `src/text.asm:8`), so a card with a
   wrong CMD8 echo shows `No volume mounted, error 0B`
   (`test/sd-range.test.mjs:151-153` asserts `"0B"`). Appendix D's row is `0B`, and
   the chapter itself writes the prompt's codes as shown (`error 21`, `error 27`).
   With codes up to 9 the two forms agree. With these two they don't.
   Correction: "error `0Bh`, `SDEVOLT`" and "error `0Ah`, `SDEDTOK`".

2. **`24-chaining-inside.md:237-238`: "Two kinds of event go through `CHDROP`" is no
   longer true (KE-180).** `CHKKEY` now takes the key that ends a `^S` pause, and on
   `^C` it jumps to `CHDROP` (`src/cpm/bdoscon.asm:199-214`, the jump at `:212-213`).
   This is a third way to drop the rest of a chained line, and it can happen during
   any console output a program sends. Correction: "Three kinds of event", with a
   third bullet: "`^C` typed after `^S` has paused output. `CHKKEY` takes the next key
   and jumps to `CHDROP` on `^C`, and drops any other key
   (`src/cpm/bdoscon.asm:199-214`)."

3. **`24-chaining-inside.md:247-248`: "A failed read of a directory record goes to
   `BADSECT` too (`src/cpm/bdosrec.asm:175`)". The citation shows another read.**
   `bdosrec.asm:175` is `READSEQ`'s data-record read (`JP NZ,BADSECT ; returned: the
   FCB on the record unread`). The old target, 58d4345's `bdos.asm:1899`, was
   `READDIR`'s test. At 621201d `READDIR` reaches `BADSECT` through `DMABACK`
   (`src/cpm/bdoslog.asm:29-30`, `src/cpm/bdoslog.asm:69-78`). This citation matched
   the code `JP NZ,BADSECT` alone. Correction: `src/cpm/bdoslog.asm:29-30` and
   `src/cpm/bdoslog.asm:76-78`.

4. **`21-startup.md:12-14`: "two routines in `src/cpm/ccp.asm`: `STBOOT` reads the
   file, and `STLINE` ...".** The split moved both routines to
   `src/cpm/ccpcmd.asm` (`STBOOT` at `:557`, `STLINE` at `:592`), and the chapter's own
   citations now name that file. Correction: "two routines in `src/cpm/ccpcmd.asm`".

5. **`24-chaining-inside.md:25-26`: "The code is in `src/cpm/ccp.asm`, with function
   47 and function 108 in `src/cpm/bdos.asm` ...".** The main loop, `CHSKIP`,
   `MLTAKE` and `ERRGO` are still in `ccp.asm`. The tail at `0080h` (`PREPPAGE`,
   `src/cpm/ccpcmd.asm:284`), the startup line (`STLINE`, `ccpcmd.asm:592`) and
   `COPY`'s failures (`ccpfile.asm:644-649`) now sit in the two new files, and the
   chapter cites all three. Correction: "The CCP's side is in `src/cpm/ccp.asm`,
   `src/cpm/ccpcmd.asm` and `src/cpm/ccpfile.asm`, ...".

6. **`25-host-model.md:134-145`: the fence differs from its capture (unchanged by the
   diff, and different at 58d4345 too).** `node tools/capture.mjs --board glcd
   --screen CON` prints the console record and then a `--- screen` section (`\nA>CON\nCON:
   UC1:\nA>`), as `recap621.json` shows and a rerun confirms. The fence has the
   console record alone. The same command without `--screen` gives the fence exactly
   (rerun). Correction: drop `--screen` from the comment, since the prose describes
   the console record.

7. **Oxford commas added by the diff.**
   - `appendix-d-error-messages.md:87`: "is 0, above 8 on a format 1.0 card, or
     above 127". Correction: "is 0, above 8 on a format 1.0 card or above 127".
   - `appendix-d-error-messages.md:149` (`COPY`): "has a wildcard, the destination
     is the source, or something follows the destination". Correction: "... the
     destination is the source or something follows the destination".
   - `appendix-e-container-format.md:143`: "is 0, more than 8 on a 1.0 card, or more
     than 127". Correction: "is 0, more than 8 on a 1.0 card or more than 127".

   The same pattern is older in Appendix D's rows `29`, `ERA`, `REN`, `SAVE` and
   `Cannot mount` (unchanged by the diff).

8. **`appendix-d-error-messages.md:65-68`: the codes `05h` to `0Ah` are listed out of
   order.** The list puts "a data error token in place of a block's data" fifth and
   the standard-capacity range refusal last. In the code these are 9, `SDERNG`, and
   10, `SDEDTOK` (`src/sd.asm:18-19`), so the text gives the meanings of `09h` and
   `0Ah` the wrong way round. Correction: "... card stayed busy, a standard-capacity
   card's block 4 GiB or more into it, rejected before any command, and a data error
   token in place of a block's data".

9. **`21-startup.md:234-236`, minor: "A line from the file doesn't get that far on
   such a board, because `SVDRV` has refused its table".** This holds for a
   `GLCD.SVC` line while `CON:` is `CRT:`. A `CON UC1` line from the file sets the
   field to `UC1:` first, so `SVDRV`'s test (`src/services.asm:371-380`) passes it,
   and `SVCGO` reaches the give-way with `CONMOD` still `CRT:`
   (`src/loader.asm:528-530`). The commit record for ef50545 describes this case.
   Correction: "A `GLCD.SVC` line from the file doesn't get that far ...".

No other finding. Checked and found true at 621201d:

- KE-182 and KE-183 in Chapter 18 (`src/sd.asm:160-202`, `:285-298`).
- KE-184 and KE-185 in Chapter 18 and Appendices D and E (`src/vol.asm:68-87`,
  `:107-112`).
- KE-187 in Chapter 19 (`src/cache.asm:210-250`).
- KE-190, KE-191, KE-192 and KE-200 in Chapters 20 and 21 and Appendix D
  (`src/video.asm:103-118`, `src/cpm/ccpcmd.asm:95-103`, `src/loader.asm:272-274`,
  `src/services.asm:356-386`, `drivers/glcd.asm:30-54`).
- KE-194 in Chapter 20 (`src/services.asm:281-291`).
- KE-195 and the stack change c232a8a in Chapter 23 and Appendix D
  (`src/boot.asm:463-489`).
- KE-174, KE-179 and KE-201 in Appendix D (`src/cpm/ccpcmd.asm:176-278`,
  `src/cpm/ccpfile.asm:571-649`).
- KE-189 in Chapter 25 (`tools/capture.mjs:147-153`).

No passage in these files still states the old behaviour of KE-189, KE-190,
KE-191 or KE-200.

## Runs

- **Chapter 18:** `build/short.img` and `build/bad.img`, built by the chapter's
  steps. Both fences match.
- **Chapter 20:** `--board pico SERVICES` matches the new fence. The fence carries
  the trailing part of the run, as before. `svc.img` was built from the 621201d
  starter, the `COUNT.SVC` binary and the chapter's `GAPZERO.SVC` step, and
  `B: GAPZERO.SVC SERVICES` matches.
- **Chapter 24:** `start.img`, built by the chapter's steps, matches.
- **Appendix E:** `build/swapped.img` matches, and `tecvol verify` gives the
  fence's line.
- **Chapter 25:** `--board glcd --screen CON` matches the fence without `--screen`,
  and differs with it (finding 6).
- **Timings:**
  - `STBOOT` on the page's board is 5,824,547 T-states, as Chapter 21 now says.
  - Chapter 19's measurement script gives, on this build, a hit of 6,026, a miss of
    226,445, reads of 6,642,581 and 1,343,674, `SAVE 64` of 30,609,632 and
    9,946,134, and a close of 1,111,504. Every figure equals the chapter's.
  - The changed token wait in `SDREAD` costs nothing on the model, whose card sends
    `FEh` as the first byte after R1. `SDREAD`'s 219,144 still holds, and the
    measurement gives the same.
- **Figures:**
  - Chapter 20's byte table sums to 480 from the symbol map.
  - The addresses checked against `tecos.d8.json` hold: `STPOS`, `STREC`, `STFLAG`,
    `CONDEV`, `VWID`, `VHGT`, `CMDTXT`, `BOOTDRV`, `SVCRC` and `SVCRA`.
  - The TPA figures hold: 47,268, 46,336 and 46,564.

## Per file

- `18-sd-card-and-volumes.md`: every changed claim and all 74 changed citations read
  at 621201d, with 12 unchanged. 3 transcripts, all rerun and matching. 2 findings
  (1).
- `19-block-cache.md`: KE-187 passage and about 25 changed citations read. Timings
  rerun by the chapter's script and matching. No finding.
- `20-hardware-services-and-service-loader.md`: every changed claim and about 150
  of 167 changed citations read, with 20 unchanged (`test/svc.test.mjs`,
  `abi.inc`). 2 transcripts rerun and matching. Byte table checked. No finding.
- `21-startup.md`: every changed claim and about 70 changed citations read, with 8
  unchanged. `STBOOT` timing rerun. No transcripts. 2 findings (4, 9).
- `22-command-history.md`: about 12 changed citations read. 7 transcripts, the
  same in `recap621.json`. No finding.
- `23-diagnostics.md`: every changed claim and 15 citations read. 1 transcript, the
  same in `recap621.json`. No finding.
- `24-chaining-inside.md`: about 30 changed citations read, with 4 unchanged. 1
  transcript rerun and matching. 3 findings (2, 3, 5).
- `25-host-model.md`: every changed claim and 10 citations read, the test-file
  count checked (54). 2 transcripts checked, 1 finding (6).
- `appendix-d-error-messages.md`: every row checked against the code that prints
  it, about 110 citations read. No transcripts. 2 findings (7, 8).
- `appendix-e-container-format.md`: all 27 changed citations read. 1 transcript
  rerun and matching. 1 finding (7).

## Resolved

All nine findings were applied in 9c88f4e: chapter 18 gives the codes as 0Bh and 0Ah; chapter 24 lists `^C` after `^S` as a third way through `CHDROP`, cites `src/cpm/bdoslog.asm:29-30` and `76-78` for a failed directory read, and names the three CCP files; chapter 21 names `ccpcmd.asm` and narrows its sentence to a `GLCD.SVC` line; chapter 25 drops `--screen` from the capture's comment; Appendices D and E lose their Oxford commas, and D lists codes 09h and 0Ah in order.
