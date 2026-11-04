# Check of the TEC-OS book at 5a25178: chapters 1 to 17, appendices A, B, C, F, G, H and the index

Read-only. Code read at `git show 5a25178:PATH`, figures from `rev5a2/dist/tecos.d8.json`,
`tecos.census.json` and `docs/memory-map.md`, runs on a copy of `rev5a2` under the memory guard.

## Findings

**1. `14-reset-and-boot.md:110`, the cold boot's time.** The claim is "cold boot takes 1,371,228
T-states, about 0.32 seconds". 1,371,228 T-states is confirmed by a run (cold boot to `CCPENT`
1,371,228, `MEMINIT` 346,677, block 0 219,144, first `CONIN` 8,938,578, warm boot 32,507 with
`CPMINIT` 7,448, `CWBOOT` 8,437 and the CCP 14,176, after `SAVE 8` 117,862, function 13 1,037,455,
function 14 for B 9,166,907: every other figure in the chapter matches). At 4 MHz that is 0.343
seconds. The 0.32 belonged to the old 1,286,306. Correction: "about 0.34 seconds".

**2. `14-reset-and-boot.md:314-315`, warm boot step 5.** The claim is that `CPMINIT` "clears the key that
lets a write skip reading its block, so that a changed card is read again". At 5a25178 the key
(`BUFOK`, `src/ram.asm:17-19`) is used only by BIOS `WRITE`'s rule that skips a block's pre-read
(`src/bios.asm:126-138`, `src/bios.asm:211-238`). Clearing it at `src/boot.asm:279-280` makes the
next write read its block before changing it. It makes nothing read again from a changed card. Reads
come from the cache, which warm boot keeps, as the same chapter says at line 338. The clause came
over from the deblocking buffer, which had to be forgotten, and the stale code comment at
`src/boot.asm:262-264` still describes that buffer. Correction: "It clears the key that lets a write
skip reading its block, so that the first write after the warm boot reads its block before changing it."

**3. `appendix-b-rom-services.md:205-210`, the volume services' refusal.** The claim is that each
service returns "`TNEBAD` with carry and nothing changed", and that a refusal covers "a failed write
of the cache". At 5a25178 `VMNT` and `VUNM` refuse when `VFLUSH` fails (`src/vol.asm:570-571`,
`src/vol.asm:607-608`). `VFLUSH` calls `CFLALL`, which now tries every dirty line, writes the ones it
can and drops each one that fails (`src/vol.asm:637-646`, `src/cache.asm:177-202`). A refusal for a
failed flush therefore leaves the drives as they were, but the cache has written some lines and
dropped the changes in others. Before KS36b the failed line stayed dirty, so "nothing changed" held.
Correction, after "a failed write of the cache": add "A refusal for a failed write still leaves the
cache flushed, and the changes in the lines that failed are lost, as in any flush." The general table
in `09-hardware-services.md:144` and `appendix-b-rom-services.md:52` ("refused with nothing changed")
reads the same way for these two services and can rest on that sentence.

**4. `13-memory-map.md:146-148`, the BIOS block's key.** The claim is "a 4-byte key, the drive and
block of the last block that a write cleared rather than read". The four bytes are `BUFOK`, the flag
that says whether such a block exists (2 for cleared), then `BUFDRV` and the 2-byte `BUFBLK`
(`src/ram.asm:17-19`, `src/bios.asm:126-138`). Drive and block make three bytes. Appendix C's row
(`appendix-c-memory-map.md:181`) describes them correctly. Correction: "a 4-byte key, whether a write
cleared a block rather than read it and that block's drive and number".

## Outside the book

The code comments `src/boot.asm:262-264` ("forget the deblocking buffer so a changed card is reread")
and `src/ram.asm:16` ("One-block deblocking buffer") still describe `BLKBUF`, which 5a25178 has
removed. That is the product's concern, not the book's.

## Checked, per file

- `01-introduction.md`: TPA 47,347, `B9F3h`, `PICO.SVC` at `B300h` with 45,568 and 243 bytes from
  `B900h` to `B9F2h`, all checked against the census. The diagnostic transcript matches the prompt
  `R retry> ` (`src/text.asm:9`) and `DGLOOP`'s "any other key" (`src/boot.asm:432-442`). No citations.
- `02-console.md`: only the `Checked against` line. No citations.
- `03-command-line.md`: `SAVE 184`/`185?`, `TWO.COM` and `8172K free` checked against the recap and a run
  (`SAVE 184` succeeds and `SAVE 185` gives `185?`). The function 45 sentence was checked against
  `src/cpm/bdos.asm:137-143`. No citations.
- `04-cards-and-volumes.md`: `B9F3h`/47,347, `B733h`/46,643/704 checked against the census. The
  write-through drop (`src/cache.asm:334-349`), the flush that tries every line, `Write lost` said
  once (`src/cache.asm:177-202`, `src/cache.asm:351-359`) and function 48 in the flush list were read
  against the code. The `SAVE 64` time of 7.65 s was not rerun. 2 citations, 1 changed.
- `05-startup-and-services.md`: the TPA table (`B9F3h`, `B300h`, `AD00h`; 47,347, 45,568, 44,032)
  checked against the census and a ch. 7 run. No citations.
- `06`, `08`, `09`: only the `Checked against` line. Unchanged stack and service figures rest on unchanged
  code. No citations in 06, 08 or 09.
- `07-memory.md`: the three captures rerun (`B9F3h`; `B300h`, `AD00h`; `47347 bytes`), and the four-drive
  figures (46,643, 45,056, 43,520, `AB00h`) checked by arithmetic against the census. 2 citations, both
  sampled.
- `10-writing-services.md`: 47,347, 46,848, the 499 bytes and the `RECS` tables `B25F`/`B319` checked
  against the writers' rerun at 5a25178 and the census. No citations.
- `11-chaining-commands.md`: the added sentences checked against `src/cpm/bdos.asm:46-71`,
  `src/cache.asm:351-359` and `src/cpm/bdos.asm:2365-2373`. No citations.
- `12-rom-and-build.md`: ROM regions, 14,429/1,955, `C347h`, WSBASE `BB36h`/970, the TPA figures and the
  hash checked against the census and the map. 10 changed `tools/media.mjs` and `src/ram.asm` citations
  read, plus 7 unchanged ones sampled. 65 citations.
- `13-memory-map.md`: every row of the workspace table and the stack ranges checked against the map,
  and the text's addresses (`BB36h`, `BCEAh`, `BE76h`, `BFE3h`, 970 bytes) against the symbols. 21
  changed citations read, 22 unchanged sampled. Finding 4.
- `14-reset-and-boot.md`: the new step order against `src/boot.asm:20-92`, `HWVREL` before `PZINIT`, the
  332 bytes of `CPMINIT` (`BF00h`-`BDB4h`), `ERRMODE` inside that span (`BE78h`), the flush and the retry's
  fresh read of the table (`src/vol.asm:250-283`), and every timing by a run. 34 changed citations read
  (all 11 listed in `hunkfall11.txt`), 41 unchanged sampled. Findings 1 and 2.
- `15-bios-and-console.md`: `HWVREL`'s new place and the changed `boot.asm`/`ccp.asm` citations read.
  7 changed, 89 in all.
- `16-bdos.md`: the BDOS span `E145h`-`F011h`, 3,789 bytes (checked against `BDOSBAS` and the end of `ERASE1`),
  `BE76h`, the dispatcher's 108, 47, 45 and 48 (`src/cpm/bdos.asm:83-93`), `BDERR` and codes 1 to 4,
  function 45's modes, the FCB left on the failed record (`src/cpm/bdos.asm:864-873`, `971-978`, and
  `RANDPOS` for the random case), function 48, `ALVSUM`/`ALVLEN`/`SUMDE` and the walkers.
  Functions 45 and 48 were run on the model: in mode `FFh`, function 14 for F: returned `A` = `FFh`,
  `H` = 4 with nothing printed. In mode `FEh` it printed the message and returned. Function 48 returned 0.
  In the default mode it waited for a key. All 122 changed citations read, 13 unchanged sampled. No
  finding.
- `17-ccp.md`: the CCP span `D7C1h`-`E144h`, 2,436 bytes, `DOSSEQ` (`src/cpm/ccp.asm:1053-1067`) and its 22
  calls with their inline bytes, `READSRC`, `LOADCOM`/`LOADLIM`, the pager and the RAM table (each row
  against the symbols), `SAVE` 184 pages to `B8FFh`, 47,104/243 bytes. `FITS`/`BIG` were rerun. All 98
  changed citations read, 9 unchanged sampled. No finding.
- `appendix-a-bdos-functions.md`: functions 45, 47 and 48 and the error codes against `src/cpm/bdos.asm`.
  All 76 changed citations read (41 of them not shared with chapter 16), 3 unchanged sampled. No finding.
- `appendix-b-rom-services.md`: the volume services' citations (`src/vol.asm:532-558`, `570`, `607`,
  `611-621`, `624-626`) and the 24-byte stacks checked against `abi.inc`. 8 changed, 52 in all. Finding 3.
- `appendix-c-memory-map.md`: every table row's start and length checked against the symbols by script
  (75 rows, no mismatch), and the ROM regions, the TPA, the spans, the hash and the label printout
  checked. 11 changed citations, 10 unchanged sampled. 38 in all.
- `appendix-f-tecvol.md`: 4 changed `tools/media.mjs` citations read. 39 in all.
- `appendix-g-tec-1g.md`: 3 changed citations (`src/cpm/ccp.asm:1537-1539` twice, `src/vol.asm:194-208`)
  read, 6 unchanged sampled. 45 in all.
- `appendix-h-service-file-format.md`: only the `Checked against` line. Its 22 citations are in files
  5a25178 doesn't change.
- `index.md`: the entries for chapter 16 and appendix A name 45 and 48. "Deblocking" in chapter 18's
  entry matches that chapter's own section heading. No citations.

No gone label is named as current in these files (grep for all 28 names). No 46,869, `B815h` or other
626ee41 address is left. The added text has no semicolons, em dashes or Oxford commas.

## Resolved

All four findings were applied in 4d9748b: chapter 14 gives cold boot as about 0.34 seconds and says warm boot clears the skip-read key so that the first write after it reads its block; Appendix B says a mount or unmount refused for a failed write of the cache leaves the drives as they were with the unwritten changes dropped; chapter 13 gives the key as a flag with the drive and block. The comments at `src/boot.asm:262-264` and `src/ram.asm:16` are the product's, reported (KE-173).
