# Check of the TEC-OS book at 7935507, chapters 18 to 25 and the appendices (changes since adfa305)


Book at `tec-os-book` 67df490, diffed against adfa305. Method: every citation in
each file at adfa305 was paired with its counterpart at HEAD (aligned on the
prose before it), and the cited lines were compared, old at 7458352 against new
at 7935507: the text of the lines, three lines either side, and the nearest
label above. Every pair that differed in any of the three was read by hand with
its sentence. Unchanged citations were put through the same comparison, so each
citation into `console.asm`, `boot.asm`, `bios.asm`, `cache.asm`, `video.asm`,
`vol.asm`, `cpm/ccp.asm`, `rom.asm` and `ram.asm` was checked to still land on
the same text. Addresses were checked against `$S/rev793/dist/tecos.d8.json`
(symbols and per-file segments) and `tecos.census.json`. The ROM built at
`$S/rev793` has SHA-256 `9c946bc2...7a0c`, the value Appendix C gives.

## Findings

No wrong citation, gone name or wrong address was found in these files.

All one-line and two-line citations that the script moved land on the intended
copy, including the short generic ones:
- 21-startup.md:219-220, the `SCF`/`RET NZ` and `LD HL,PICMSG`/`JP LCDWRD` pair
  at `src/cpm/ccp.asm:1716-1719`
- 20-hardware-services-and-service-loader.md:495, `DJNZ REGF1`/`SCF`/`RET` at
  `src/loader.asm:422-424`
- 21-startup.md:291-299, `src/loader.asm:434`, `:441-443`, `:466`, `:468`
- 22-command-history.md:125, `src/boot.asm:83`
- 23-diagnostics.md:37-42, `src/boot.asm:445-453`, `src/text.asm:8-10`

The citations added at 20-hardware-services-and-service-loader.md:60
(`src/services.asm:314-327`, `SVDRV`) and 21-startup.md:283
(`src/text.asm:91-93`, `GLCMSG`, `PICMSG`, `PICCLR`) show what their sentences
say.

One layout nit, not an error:

- 21-startup.md:283. The rewrite of "The strings are in `src/text.asm:10` and
  `src/text.asm:91-93`." left one source line of about 110 characters, unwrapped
  with the rest of the paragraph. It renders normally. The fix, optional, is to
  rewrap lines 281-285. (Two other long lines, 21-startup.md:261 and
  appendix-b-rom-services.md:236, were already long at adfa305.)

Statements checked and true at 7935507:
- 20:55-60 and appendix-b:90. Services 0-8 and `SVDRV` are in `services.asm`,
  `VIDHOOK` is in `video.asm` (line 58), the volume services are in `vol.asm`
  (`VSMNT` at 512) and the registry is in `loader.asm`.
- terms.md:118-119.
- 21:14. `STBOOT` and `STLINE` are in `cpm/ccp.asm`.
- 19:168. The write-through path is in `bios.asm`.
- 20:62-76. The 474-byte table: `SVCDSP` 30, `HWSINFO` 17, `HWSDIG` 26, `HWSLCD`
  44, `HWSVID` 89, `HWSTONE` 29, `HWSJOY` 10, `HWSKEYS` 15, `HWSPUT` 68 and
  `HWSRTC` to `SVDRV` 146, from `F19Dh` to `F377h`. `services.asm` is 495 bytes
  in all, and the other 21 are `SVDRV`'s, which the sentence doesn't count.
- 25:106-117. `host/machine.mjs:177-226` and `:222` match the new watch code,
  which now starts the cache's range at `CTADR`. "The cache's own routines" is
  still accurate.

Names: none of `hwsvc.asm`, `svc.asm`, `data.asm`, `data2.asm`, `data3.asm`,
`diag.asm` (as `src/`), `glcd.asm` (as `src/`), `GLHOOK`, `GLHOFF`, `GLHF1` or
`DGLCD` is left in these files. The remaining `glcd.asm` names are all
`drivers/glcd.asm`, and `diag/diag.asm` (23:85) is the diagnostics ROM's own
file. `editorial/salvage.md` still uses `hwsvc.asm`, `glcd.asm` and `data3.asm`,
but it isn't in this set.

Addresses: these match the build.
- Appendix C's ROM table: `C000h-C002h` 3, `C003h-C00Ah` 8, `C00Bh-C33Bh` 817
  (`ROMDATA` `C00Bh` to `ROMCODE` `C33Ch`), `C33Ch-F9EAh` 13,999 and
  `F9EBh-FFFFh` 1,557.
- The CCP at `D82Dh-E28Eh`, 2,658 bytes, and the BDOS at `E28Fh-F19Ch`, 3,854
  bytes (from the d8 file segments).
- `C003h`, `C006h`, `C007h`, `C008h` and `ABIEND` `C00Bh`.
- No other ROM label address is given in these files. The other `C000h-FFFFh`
  values are fixed entry points, values in the diagnostics ROM or port and data
  values.

## Per file

- 18-sd-card-and-volumes.md: 66 citations, 9 changed, all correct. 35 into moved source files, all still land.
- 19-block-cache.md: 51 citations, 37 changed (`cache.asm` to `bios.asm` for `IFFGET`, `CDI`, `BRET`, `CEI`), all correct.
- 20-hardware-services-and-service-loader.md: 202 citations (one new), 125 changed, all correct. The routine-size table was checked against the symbols.
- 21-startup.md: 122 citations (one new), 56 changed, all correct. One long unwrapped line, above.
- 22-command-history.md: 37 citations, 8 changed, all correct.
- 23-diagnostics.md: 65 citations, 18 changed, all correct. `DGCARD` is used throughout.
- 24-chaining-inside.md: 72 citations, 14 changed, all correct.
- 25-host-model.md: 91 citations, 15 changed, all correct, including `host/machine.mjs`, which changed in this commit.
- appendix-a-bdos-functions.md: 74 citations, 3 changed, all correct.
- appendix-b-rom-services.md: 52 citations, 29 changed, all correct. The file statements are true.
- appendix-c-memory-map.md: 38 citations, 19 changed, all correct. The SHA-256, the ROM regions and the CCP and BDOS spans match the build.
- appendix-d-error-messages.md: 137 citations, 49 changed, all correct.
- appendix-e-container-format.md: 38 citations, 3 changed, all correct.
- appendix-f-tecvol.md: 39 citations, none changed. Its sources didn't change.
- appendix-g-tec-1g.md: 45 citations, 14 changed (`keyboard.asm` for Caps Lock, `cpm/ccp.asm` for the keypad bit), all correct.
- appendix-h-service-file-format.md: 22 citations, 9 changed, all correct.
- editorial/terms.md: no citations. The one changed row, `src/services.asm`, is true. No old name is left.
