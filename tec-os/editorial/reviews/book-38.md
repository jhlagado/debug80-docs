# Check of chapters 18-25 and Appendices D and E at 5a25178

Book at `tec-os-book` HEAD (95eba3f), diffed against caff1e8. Code read at
5a25178 (`git archive` into the scratchpad). Runs were made on a copy of
`$S/rev5a2`, one at a time under the memory guard. The copy's
`tools/capture.mjs` was patched to wait for `retry> `.

## Findings

1. **appendix-d-error-messages.md:181, a duplicated citation.** The first
   `Bdos Err On d: Bad Sector` row cites `src/cpm/bdos.asm:1277` twice. At
   caff1e8 it cited 957, the sequential read's `CALL NZ,BADSECT`, and 1268,
   the zero-fill write's. The read's site is now
   `src/cpm/bdos.asm:974` (`JP NZ,BADSECT ; returned: the FCB on the record
   unread`), and 1277 is the zero-fill write's (`ZEROLOOP`, 1271-1277).
   Correction: make the first citation `src/cpm/bdos.asm:974`.

2. **appendix-d-error-messages.md:223-224, a remedy left untrue.** Both rows
   (`Cannot mount: in use or too large` and `Cannot unmount`) say "A failed
   write is `Write lost`'s case." At 5a25178 `VFLUSH` calls `CFLALL`, which
   drops every line whose write fails (`src/cache.asm:188-195`), and `VMNT`
   and `VUNM` then return `TNEBAD` with no message (`src/vol.asm:570-571`,
   `src/vol.asm:607-608`, `src/vol.asm:637-646`). The dropped lines are no
   longer dirty, so the next warm boot's `CFLALL` returns Z and `CWBOOT` says
   nothing (`src/cache.asm:354-355`). No `Write lost` ever follows this
   failure, and a second `MOUNT` succeeds over the lost changes. Correction:
   "A failed write drops the changes the cache held for those blocks, as under
   `Write lost`, and no message follows."

3. **18-sd-card-and-volumes.md:120-122, a wrong rule.** The sentence says
   `MNBLK` reads a table block "from the card the first time a mount asks for
   it". `MNBLK` reads from the card whenever the block asked for isn't the one
   `MNTCB` names, the last table block read (`src/vol.asm:251-254`,
   `src/vol.asm:262-272`). On a 1.1 card with more than fifteen volumes, the
   sum pass leaves `MNTCB` at the last sum block (`src/vol.asm:105-115`), so
   `DESCIX` for descriptor 0 reads block 0 from the card again
   (`src/vol.asm:129-130`, `src/vol.asm:348-350`), and descriptor 15 reads
   block 1 again. Each table block is read twice in one mount. Correction:
   "from the card whenever the mount asks for a table block other than the
   last one it read".

4. **23-diagnostics.md:63, a citation that no longer supports its claim.**
   The sentence says nothing on the path from `RSLCAP` to the prompt writes
   `RSLBUF`. It cites `src/boot.asm:101-102`, whose comment rests the claim on
   "nothing writes before MEMINIT". At 5a25178 `MEMINIT` runs before the first
   mount (`src/boot.asm:48`), so that comment no longer covers the path to the
   prompt. The sentence itself is true: page zero's clear stops at `00FFh`
   (`src/boot.asm:27-31`) and `MEMINIT` writes only EXPAND 1
   (`src/boot.asm:151-166`). Correction: drop `src/boot.asm:101-102` and cite
   `src/boot.asm:27-31` in its place. (The stale comments at
   `src/boot.asm:101-102`, `src/layout.asm:88-89`, `src/ram.asm:16` and
   `src/boot.asm:263` are product matters, not the book's.)

5. **18-sd-card-and-volumes.md:315, a short citation.** "If that write fails,
   the line is dropped" cites `src/cache.asm:327-342`. That range reaches the
   jump (`JR NZ,CWBX`, 336) but not the drop, `CWBX`'s `CDROP` at 347-349.
   Chapter 19:178 cites 347-349 for the same point. Correction: make it
   `src/cache.asm:327-349`.

No other finding. The following were checked and hold at 5a25178.

- **Write path.** Every BIOS write goes to `CWRBH`, with bit 7 of `CWTYPE` set
  for a volume written through (`src/bios.asm:239-246`). Bit 6 is set when a
  line is taken (`src/cache.asm:287-288`), and `CNEXT` is set back to that line
  after a written-through write (`src/cache.asm:337-341`). A failed
  written-through write drops the line. A directory write on the volume
  written behind is recognised by bit 0 (`src/cache.asm:327-333`).
- **Flush.** `CFLUSH` and `CFLALL` try every line and drop each failure
  (`src/cache.asm:177-202`). `CWB3` drops the directory line if any data
  line, or the directory line itself, fails (`src/cache.asm:343-349`).
  `CTAKE`'s single write leaves a failed line dirty (`src/cache.asm:227-229`).
- **Write lost and functions 45, 47 and 48.** `CWBOOT` says `Write lost`
  once and clears `CHPOS` (`src/cache.asm:354-359`). Functions 45 and 48
  dispatch from `BENTRY` (`src/cpm/bdos.asm:88-91`, `src/cpm/bdos.asm:141-150`).
  `BDERR` handles FFh and FEh and leaves `CHPOS` alone
  (`src/cpm/bdos.asm:2365-2376`). Warm boot clears `ERRMODE` (`CPMINIT` clears
  `CCPCLR` to `BDOSRME`, with `ERRMODE` at `BE78h`). The FCB stays on the
  failed record (`src/cpm/bdos.asm:870-876`, `src/cpm/bdos.asm:972-976`).
  Function 47's flush is the warm boot's (`src/boot.asm:89`).
- **Boot order.** `MEMINIT` runs before `SDINIT`, and `HWVREL` runs before
  `PZINIT` (`src/boot.asm:48-57`, `src/boot.asm:80-81`).
- **Recovery after a cut.** The statements in chapter 19 and Appendix D match
  `docs/recovery.md` and the code.
- **Runs on the model.** Each figure below matches the book exactly.
  - `SAVE 8 X.COM` on A makes 18 card writes and no card read.
  - `SAVE 8 X.COM` on B writes 4096, then 4130, 4131, 4128, 4129 and 4096.
    Its close takes 1,111,809 T-states.
  - `SAVE 160 Z.COM` on B writes 4128, 4129 and 4130 early. The third is
    written by a read's `CTAKE`.
  - A `DIR` hit takes 13,718 T-states, with `DIRBUF` at `BBAEh`. A miss in
    `DIR B:` takes 235,357.
  - In the `MOUNT.COM` load after cold boot, a hit takes 6,270 T-states and a
    miss 226,445.
  - `READ DATA.BIN` takes 6,637,045 and then 1,338,138 T-states. The
    15,360-byte file takes 8.19 and then 8.41 million.
  - `SAVE 64` takes 30,596,582 T-states on `THROUGH` and 9,933,063 on
    `BEHIND`.
  - `STBOOT` is reached 5,954,548 T-states after reset on the pico board.
  - The volume services' stack depths are 24, 24 and 22, and 24 with every
    line dirty (storage-boundaries A3).
  - The census bases are 32, 22 and 18, and the census figures 32, 22 and 22
    (`rev5a2-w3/build/stack-census.json`).
  - The diagnostics ROM is image `D90143609F53FAAB`.
- **Captures.** The captures with new cards (`bad.img` with `H`, `short.img`,
  `svc.img` with `COUNTX 1`, `start.img` and `swapped.img`) match the book.
- **Addresses.** These match `tecos.d8.json`: `CMDFCB` `BCEAh`, `CCPCLR`
  `BDB4h`, `CMDTXT` `BD34h`, `CHPOS` `BFE2h`, `PRGCODE` `BF54h`, `STPOS`
  `BF61h` and `STREC` `BF62h`. So do the 202 and 332 byte counts and the stub
  at `B9F3h`. The 243 bytes, 499 bytes, page `B8h`, `B80Ch`, `PICO.SVC` at
  `B300h`, the TPA of 45,568, 46,643 with four slots and 47,347 are all
  consistent.
- **Gone labels.** No label that 5a25178 removed is named as current in these
  files.

## Per file

- `18-sd-card-and-volumes.md`: write path, mount path, volume services and
  the TPA figure checked. 79 citations, all 50 in changed lines and 7
  unchanged ones read. A save and a stack run made, and 3 captures rerun.
  Findings 3 and 5.
- `19-block-cache.md`: every changed claim and figure rerun or read. 57
  citations, all 46 changed and 9 unchanged ones read. Timings, the trace
  and the flush and `Write lost` logic checked. No finding.
- `20-hardware-services-and-service-loader.md`: `HWVREL`, the stub, the
  pages, the TPA and the stack table checked. 17 changed and 16 unchanged
  citations read. `svc.img` rerun. No finding beyond the known BIOS base.
- `21-startup.md`: `DOSSEQ`, the addresses and the `STBOOT` timing checked.
  60 changed and 15 unchanged citations read. Timing rerun. No finding.
- `22-command-history.md`: 18 changed and 8 unchanged citations read. No
  finding.
- `23-diagnostics.md`: the prompt, `MEMINIT`'s order, `RSLBUF` and the diag
  hash checked. 15 changed and 15 unchanged citations read. Finding 4.
- `24-chaining-inside.md`: the addresses, `BDERR` and `ERRMODE`, function
  47's flush and `Write lost` checked. 62 changed and 17 unchanged citations
  read. No finding.
- `25-host-model.md`: 3 changed citations (`tools/media.mjs`) and the EXPAND 1
  watch passage read. No finding.
- `appendix-d-error-messages.md`: the codes, function 45, function 48 and
  `Write lost` checked. 95 changed and about 40 unchanged citations read.
  Findings 1 and 2.
- `appendix-e-container-format.md`: 22 changed and 4 unchanged citations
  read, and `swapped.img` rerun. No finding.

## Resolved

All five findings were applied in 3e89bfb: Appendix D cites `src/cpm/bdos.asm:974` for the sequential read's error and says a refused mount or unmount drops the unwritten changes with no message; chapter 18 says `MNBLK` reads a table block whenever the mount asks for one other than the last it read, and cites `src/cache.asm:327-349`; chapter 23 cites `src/boot.asm:48` for `MEMINIT` before the mount.
