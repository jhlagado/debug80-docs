# Check of the TEC-OS book at 7458352, chapters 1 to 13 (changes since 075fb41)


Book diff `075fb41..HEAD`. Code `1f9542d..7458352`. Runs were made on a copy of `$S/rev745` (`$S/r8a/t`, `$S/r8a/s10`), and every card was made fresh from that copy's `dist/starter.img`.

## Findings

### 1. `04-cards-and-volumes.md:114-117`: the `--align` check is misstated

Claim: "`--align` ... a whole number from 1 up. Anything else stops `tecvol` with its usage message, and no image is made."

Evidence: `tools/tecvol.mjs:50` takes 1 to 16,777,215 (`0xffffff`), and `tools/lib/container.mjs:90` then refuses any value that is not a multiple of 8. These runs used `create a.img --volume G1M:SYSTEM:A`:
- `--align 16777216` gives the usage message, exit 2. "From 1 up" is wrong at the top end.
- `--align 1` and `--align 16777215` each give `tecvol: alignment must be a multiple of 8 blocks`, exit 1, with no usage message. No image is made.
- `--align 8`, `2048` and `4096` succeed.

`appendix-f-tecvol.md:84-90` states both rules correctly, so the two passages disagree.

Smallest correction: "`--drives` takes a whole number from 1 to 4, and `--align`, which sets the multiple of blocks each volume starts on in place of 2,048, a multiple of 8 below 16,777,216. A value that isn't a whole number in those ranges stops `tecvol` with its usage message, and an `--align` that isn't a multiple of 8 stops it with `alignment must be a multiple of 8 blocks`. Either way no image is made."

### 2. `01-introduction.md:137-140`: the inserted sentences break "before then"

Claim: "... saved at the next try. A reload before then brings back the card as it was last saved".

Evidence: before the change, "before then" referred back to "until one succeeds". It now follows "the next try", so it reads as a reload before the next try. The code (`web/src/main.mjs:97-134`) and the two new sentences are otherwise right. A save during a save sets `cardDirty` and returns, the 2-second tick saves the newest copy, and the third failure in a row changes the message.

Smallest correction: "A reload before a save succeeds brings back the card as it was last saved". Alternatively, move the two new sentences after "can't afford to lose."

### 3. `01-introduction.md:241-242`: the reset jump's target

Claim: "The first instruction jumps to cold boot at its address in the ROM".

Evidence: the jump is now `JP RSTENT` (`src/reset.asm:7`). `RSTENT` tests `0002h` and falls through into `COLD` only at reset (`src/boot.asm:16-19`). `12-rom-and-build.md:36`, `14-reset-and-boot.md:286`, `appendix-c-memory-map.md:263` and `appendix-g-tec-1g.md:102` all name `RSTENT`. The sentence's outcome is still true at reset, but it doesn't match the rest of the book.

Smallest correction: "The first instruction jumps into the ROM at its own address, above `C000h`, and at reset that code goes on to cold boot."

### 4. `07-memory.md:319`: the citation covers only part of the sentence

Claim: warm boot "puts EXPAND 0 back and writes the cache's changes to the card as at any program's end (`src/boot.asm:16-18`)".

Evidence: lines 16-18 are `RSTENT`'s test and jump. The latch is restored at `src/boot.asm:74-77` and the cache is written at `src/boot.asm:88` (`CALL CWBOOT`). A model run confirms the behaviour. An `EX1.COM` that sets `LATEXP` in `0040h` and at port `FFh`, then does `JP 0000h`, passes `BF03h`, `BFFFh` and `C000h`. It reaches `RSTENT`, `WBOOTR` and `CWBOOT` once each and `COLD` never, and the prompt returns with latch `01h` and no violations.

Smallest correction: cite `src/boot.asm:16-18`, `src/boot.asm:74-88`, as `appendix-c-memory-map.md:266` does.

### 5. `05-startup-and-services.md:193-195`: the list of restart paths omits a jump to `C000h` (minor)

Claim: "An *ordinary exit* is a program's return, a `^C` or a jump to `0000h`."

Evidence: at 7458352 a program that jumps to `C000h` with EXPAND 0 in view also warm boots once. `RSTENT` finds `BFh` at `0002h` and goes to `WBOOTR` (`src/boot.asm:16-18`; `test/startup.test.mjs:212-224`). The sentence isn't wrong, but this path was a reset before B1 and is now an ordinary exit.

Smallest correction (optional): "... a `^C`, or a jump to `0000h` or to the ROM's first byte, `C000h`."

## Checked and found true

- **Chapter 3, user areas and the program search** (`03-command-line.md:351-381`, `:421-449`). Both captures were rerun on fresh starter cards and match byte for byte: `USER 3`/`SAVE`/`DIR B:`/`MOUNT`/`USER 0`/`DIR B:`, and `B:`/`A:MOUNT`/`MOUNT`/`STARTUP.CMD`. The search order agrees with `LOADA` and `CMDCOM` (`src/cpm/ccp.asm:283-295`, `:361-387`), with `test/search.test.mjs:72-113`, and with chapters 17, 21 and 24 and Appendix D:
  1. the current user on the named or current drive;
  2. then user 0 of that drive;
  3. then drive A in the same order, only for a plain name with drive A not current.
- **Chapter 5's `lines.img` capture** was rerun from a fresh card and matches, including `mount` running from user 0 of drive A.
- **Chapter 6's `TED` round** was driven as `test/ted.test.mjs` drives it, on a fresh `work.img` built by the chapter's commands (ATOM `hello.com` 33 bytes, `show.com` 72 bytes). All four fences match:
  - `B>A:TAS HELLO.ASM`, the error, and `B>A:TED`;
  - the screen with 14 blank rows and the status row;
  - the `^T R` transcript ending `Press a key`;
  - `DIR` with 6 files, 8152K free.

  `TED`'s text room is 33,067 bytes on the serial board and 31,510 on the board with both displays, read from the word at `2551h` on the model. The `C:TED` claim is the case of `test/ted.test.mjs:195`.
- **Hashes.** `TED.COM` and `TAS.COM` in `dist/files` have the stated SHA-256s, and `TED.COM` matches `$S/TED-128edb7.COM`. The ROM's SHA-256 is `60abc9b4...6f76`.
- **Chapter 4's standard-card paragraph** agrees with `src/vol.asm:216-230`, `MERANGE` = `27h` (`src/vol.asm:15`) and `test/sd-range.test.mjs:36-45`. The citation `web/src/main.mjs:562` is `parseContainer`, which refuses a truncated image (`tools/lib/container.mjs:150-151`).
- **Chapter 4's `--drives` check.** Runs of `0`, `5` and `2x` give the usage message, and `4` succeeds. The `--user` text matches `tools/tecvol.mjs:46-47`.
- **Chapter 7's EXPAND 1 exit** was shown by a run (finding 4). BIOS function 0 is `JP COLD` (`src/data.asm:16`).
- **Chapter 9's B values** for `VIDEO` and `RTC` match `src/hwsvc.asm:103-106` and `:229-232` and agree with Appendix B. With `B` = 0 or 1, status 2 means no device.
- **Chapter 9's timings.** The release measured 216,068 T-states from the `CALL` to the next instruction. Less the `CALL`'s 17, that is 216,051. An `RTC` read measured 6,946 the same way, which matches Appendix B. The `DIGCLK` figure, 32,065 + 28 = 32,093, is consistent with the 28 T-states the new check adds (`LD A,B`, `CP 2`, `LD A,n` and a `JP NC` not taken).
- **Chapter 9's stack text** agrees with `abi.inc`'s "bound" (`PUTAT` 22, the largest of services 0 to 8).
- **Chapter 10's service route.** On a fresh `svc.img`, the 15-command capture matches. On a PC, `cp dist/abi.inc .` and the `makeSvc` script write a 111-byte `COUNT.SVC`. That file put on a fresh card gives the same transcript: 46,869 bytes, then 46,592, then `count 003A`, `count 0052`, and `no COUNT record`. Case-insensitive matching is `onDisk` (`tools/lib/prl.mjs:12-30`).
- **Chapter 12's figures** match `dist/tecos.census.json` and the `.d8.json`: code `C33Ch–F9EAh` 13,999 bytes, free `F9EBh–FFFFh` 1,557, used 14,827, `RSTENT` = `C33Ch`, `CODEEND` = `F9EBh`, the build line, and the ROM hash. All citations in changed lines say what they are cited for.
- **Chapter 13's addresses** match the census: `WSBASE` `B958h`, vectors `B818h–B957h`, entry `B815h`, the three stacks, and `WSEND` `BFE5h`. The shifted `boot.asm` and `vol.asm` citations land on the code described.
- **Other checks.** No HTML entities appear in any fence. No functions 44, 45, 46, 48 or 99 and no user number in the prompt appear in chapters 1 to 13.

## Per file

- `01-introduction.md`: pins and hash; the web page's saving against `web/src/main.mjs` and `web/src/store.mjs`; findings 2 and 3.
- `02-console.md`: the `Checked against` line only.
- `03-command-line.md`: the user-area and search text against the CCP; both changed captures rerun; agrees with chapters 5, 17, 21 and 24 and Appendix D.
- `04-cards-and-volumes.md`: pins; `--drives`, `--align` and `--user` by runs; the standard card's refusal at mount against `vol.asm` and its test; finding 1.
- `05-startup-and-services.md`: the startup capture rerun; the search explanation; finding 5.
- `06-first-program.md`: pins; the `TED` round rerun as `ted.test.mjs` drives it; `TED`'s text room measured; the `0050h` text.
- `07-memory.md`: the new EXPAND 1 paragraph by a model run and the code; finding 4.
- `08-programs-and-console.md`: pins and hash only.
- `09-hardware-services.md`: B values for `VIDEO` and `RTC`; the stack-bound text; the release and RTC timings measured, and the `DIGCLK` figure by arithmetic.
- `10-writing-services.md`: the `TAS` capture and the PC `makeSvc` route, both from fresh cards; case-insensitive include matching in the code.
- `11-chaining-commands.md`: pins and hash only.
- `12-rom-and-build.md`: the region table, totals, build line and hash against the census and map; `RSTENT`; every changed citation.
- `13-memory-map.md`: every changed citation; addresses against the census and map; the EXPAND 1 table against `host/machine.mjs`'s free `BE00h–BFFFh`.
