---
title: C. Memory map
parent: TEC-OS
nav_order: 103
nav_group: "Appendices"
---

# Appendix C. Memory map

<!-- Checked against TEC-OS 78127ec. -->

This appendix gives the addresses TEC-OS uses: the CPU's address space, the
ROM, page zero, the resident workspace at the top of EXPAND 0, EXPAND 1 and
the stacks. Chapter 14 explains the layout and Chapter 8 describes it from a
program's side. The figures are those of the build at 78127ec, whose one
profile is `tecos` and whose ROM has the SHA-256
`8cad40923ce1c3c6079d3201a1a8cc294dbe501838ed54505ca12287672f8b9f`. The
card-dependent figures are the starter card's: a G1M volume on drive A, a G8M
volume on drive B and no service installed. Every address in the workspace
tables comes from the build's symbol file, `build/tecos/tecos.d8.json`, and
the last section says how to read it.

## The CPU's address space

The Z80's 64 KiB are three windows:

| Addresses | Contents |
| --- | --- |
| `0000h–7FFFh` | the fixed RAM |
| `8000h–BFFFh` | EXPAND 0, or EXPAND 1 while bit 2 of the latch is set |
| `C000h–FFFFh` | the ROM |

At reset the first 2 KiB of the ROM also appear at `0000h–07FFh`, until cold
boot sets bit 0 of the latch (`src/reset.asm:1-5`, `src/boot.asm:25-26`). With
EXPAND 0 in view, TEC-OS uses them in this way:

| Addresses | Contents |
| --- | --- |
| `0000h–00FFh` | page zero |
| `0100h–B9A3h` | the TPA, 47,268 bytes |
| `B9A4h–BFFFh` | the BDOS entry jump and the resident workspace, in EXPAND 0 |
| `C000h–FFFFh` | the ROM |

The latch is the system latch at port `FFh`, which TEC-OS writes from the copy
it keeps at `0040h` (`src/layout.asm:14-22`). Its value while TEC-OS runs is
`01h`: the boot overlay off and EXPAND 0 in view. It is `81h` while the matrix
keyboard's Caps Lock is on, which sets bit 7 (`src/keyboard.asm:110-115`).

The TPA ends below the BDOS entry jump, whose address is in the word at
`0006h`. Cold boot places the jump directly below the lowest allocation vector
of the card's drives, 3 bytes under that vector's address
(`src/boot.asm:456-460`). A loaded service lowers the word at `0006h` to the
start of its first page, as Chapter 24 explains.

| Card | Vectors | BDOS entry | TPA |
| --- | ---: | --- | ---: |
| the starter card, G1M on A and G8M on B | 320 bytes | `B9A4h` | 47,268 bytes |
| the starter card with `GLCD.SVC` installed | 320 bytes | `B600h` | 46,336 bytes |
| four G8M volumes | 1,024 bytes | `B6E4h` | 46,564 bytes |

## The ROM

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump, `JP RSTENT` |
| `C003h–C00Ah` | 8 | the ROM table |
| `C00Bh–C609h` | 1,535 | the read-only data, `ROMDATA` to `ROMCODE`, with the font, `FONT`, at `C179h–C478h` |
| `C60Ah–FE91h` | 14,472 | the code |
| `FE92h–FFFFh` | 366 | unused |

Within the code, the CCP's three files are at `DD2Ah–E702h`, 2,521 bytes, and
the BDOS's six at `E703h–F608h`, 3,846 bytes, in the order `src/rom.asm`
includes them (`src/rom.asm:27-36`). The ROM's own copy of the BIOS jump table
is in the data, at `BIOSBAS`, and is never called: cold boot copies it to
`BF00h` (`src/tables.asm:11-28`, `src/boot.asm:75-78`).

## Page zero

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, warm boot through the RAM BIOS table |
| `0003h` | the IOBYTE; TEC-OS acts on its console field, bits 0 and 1 |
| `0004h` | the current drive in bits 0–3 and the user number in bits 4–7 |
| `0005h` | `JP` to the BDOS entry jump or the start of the lowest service's page; the word at `0006h` is the top of the TPA |
| `0008h–0037h` | restart vectors 1 to 6: each a `RET` after seven zeros, unless it holds a `JP` whose target is above `PZTOP` |
| `0038h` | `EI`, `RETI`, for restart 7 and the interrupt of mode 1, unless it holds such a `JP` |
| `0040h` | `LATCHV`, the copy of the system latch |
| `0041h–004Fh` | unused |
| `0050h` | the drive the CCP loaded the running program from: 0 for the current drive, 1 for A: and so on |
| `005Ch` | the default FCB |
| `006Ch` | the second FCB, overlapping the first's last 20 bytes |
| `0080h–00FFh` | the command tail and the default DMA buffer |

Cold boot clears page zero. `PZINIT` then writes it at every warm boot, cold
boot's end included, leaving the IOBYTE and the drive and user byte as they
are (`src/boot.asm:29-35`, `src/boot.asm:221-283`). An unload and a failed
`INIT` clear the first byte of each restart vector the service claimed and
then run the same sweep of the vectors, `PZSWP` (`src/loader.asm:78-89`,
`src/loader.asm:312-316`, `src/loader.asm:351-364`). The CCP writes the byte
at `0004h` at each prompt, and the FCBs, the tail and the byte at `0050h`
before it runs a program (`src/cpm/ccp.asm:225-245`, `src/cpm/ccp.asm:317-319`,
`src/cpm/ccpcmd.asm:280-312`).

Of the sixteen bytes that CP/M 2.2 leaves to the BIOS, TEC-OS keeps one,
`LATCHV`, the only byte it reads while EXPAND 1 is in view. `0041h–004Fh` are
unused, and cold boot's clear leaves them 0 (`src/layout.asm:36-39`). The
console's state is above the RAM BIOS table.

## The resident workspace

From the BDOS entry jump to `BFFFh`, on the starter card:

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `B9A4h–B9A6h` | 3 | the BDOS entry jump, `JP BENTRY` |
| `B9A7h–BAE6h` | 320 | the allocation vectors: B's 256 bytes at `B9A7h`, then A's 64 at `BAA7h` |
| `BAE7h–BCC4h` | 478 | the BIOS's disk state and buffers, the PICO9918 console's block, part of the `MOUNT` routine's scratch and the video terminal's state |
| `BCC5h–BCECh` | 40 | the BIOS stack |
| `BCEDh–BE75h` | 393 | the CCP's state and stack |
| `BE76h–BEFFh` | 138 | the BDOS's state and stack |
| `BF00h–BF32h` | 51 | the RAM BIOS table, 17 jumps |
| `BF33h–BFFFh` | 205 | state for the SD card, cache, keyboard, displays, loader, startup, chained line and console, and the rest of the `MOUNT` routine's scratch |

The part from `WSBASE`, `BAE7h`, to `BEFFh` has the same addresses on every
card. The build places `WSBASE` so that the part ends at `BF00h`
(`tools/build.mjs:232-237`, `src/layout.asm:57-60`). The part above the table
starts at `BF33h`, 51 bytes after `BF00h` (`src/ram.asm:218`).

Two sweeps clear the workspace. Cold boot clears all of it, from `WSBASE` up
to `WSEND`, `BAE7h` to `BFFFh` (`src/boot.asm:37-41`). Warm boot clears the
part from `CCPCLR`, `BDB7h`, to the end of the BDOS's block at `BEFFh` and
leaves the rest (`src/boot.asm:288-312`). The "Cleared by" column of each
table below says which sweeps reach a byte. A byte cleared by cold boot alone
survives a warm boot, though other code may write it between boots.

### The BIOS's block

The BIOS's block is `src/ram.asm:9-77`:

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BAE7h` | 1 | `DSKCUR` | the drive the BIOS has selected | cold boot |
| `BAE8h–BAEDh` | 6 | `DSKTRK`, `DSKSEC`, `DSKDMA` | the track, sector and DMA address the BDOS last set | cold boot |
| `BAEEh–BAF0h` | 3 | `BLKOFF`, `BLKSLOT` | the block within the volume and the record within the block | cold boot |
| `BAF1h–BAF4h` | 4 | `BUFOK`, `BUFDRV`, `BUFBLK` | the write-cleared key: a flag, and the drive and number of the last block a write cleared rather than read | cold boot; warm boot writes 0 to `BUFOK` |
| `BAF5h–BB14h` | 32 | `DRVTAB` | the drive table, 8 bytes a drive | cold boot |
| `BB15h–BB18h` | 4 | `DRVIDX` | each drive's volume, its index + 1 | cold boot |
| `BB19h–BB1Ch` | 4 | `DRVSLOT` | each drive's vector slot | cold boot |
| `BB1Dh–BB5Ch` | 64 | `DPHTAB` | the four DPHs, 16 bytes each | cold boot |
| `BB5Dh–BB5Eh` | 2 | `LOGINV` | the BDOS's logged-in drives | cold boot |
| `BB5Fh–BBDEh` | 128 | `DIRBUF` | the directory buffer every drive shares | cold boot |
| `BBDFh–BBE0h` | 2 | `CSVDUM` | the unused check vector | cold boot |
| `BBE1h–BBE2h` | 2 | `STUBAD` | the BDOS entry jump's address | cold boot |
| `BBE3h–BC41h` | 95 | `PIBLK` to `PIROWT` | the PICO9918 console's block: its table, width, record in the registry, pages, registers and row addresses | cold boot |
| `BC42h` | 1 | `MNTCNT` | the `MOUNT` routine's count, part of the scratch the volume services also use | cold boot |
| `BC43h–BC62h` | 32 | `MNBUF` | 32 bytes of the container's table, copied from the cache line that holds it | cold boot |
| `BC63h–BCB2h` | 80 | `LINEBUF` | one display row, for the terminal's row moves and the LCD's drive rows | cold boot |
| `BCB3h–BCC0h` | 14 | `VPUTV` to `VFNV` | the seven vectors into the display's table | cold boot |
| `BCC1h–BCC4h` | 4 | `VSTOP` to `CONMOD` | the scroll region, the PICO9918's claim and the console mode | cold boot |
| `BCC5h–BCECh` | 40 | `BSTKB` | the BIOS stack, up to `BSTK` | cold boot |

### The CCP's block

The CCP's block is `src/ram.asm:82-139`. Warm boot's sweep starts at
`CCPCLR`, `BDB7h`, so the command line below it survives a warm boot, for a
chained line's next piece:

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BCEDh–BD10h` | 36 | `CMDFCB` | the command's FCB | cold boot |
| `BD11h–BD34h` | 36 | `RENFCB` | the second FCB of `REN` and `COPY` | cold boot |
| `BD35h` | 1 | `CMDBUF` | function 10's maximum, 127 | cold boot; warm boot writes 127 |
| `BD36h` | 1 | `CMDLEN` | the line's length | cold boot |
| `BD37h–BDB6h` | 128 | `CMDTXT` | the command line | cold boot |
| `BDB7h` | 1 | `BOOTDRV` | the drive at the CCP's entry | cold boot and warm boot |
| `BDB8h–BDCAh` | 19 | `CMDSTRT` to `ERAALL` | the parser's pointers and the state of `DIR`, the pager, `SAVE` and `ERA` | cold boot and warm boot |
| `BDCBh–BE4Ah` | 128 | `LOADBUF` | the CCP's scratch record | cold boot and warm boot |
| `BE4Bh–BE55h` | 11 | `STKGUARD` | the CCP stack's guard, `A5h` in each byte | cold boot and warm boot; warm boot then writes the pattern |
| `BE56h–BE75h` | 32 | `CSTKBAS` | the CCP's stack, up to `CSTKTOP` | cold boot and warm boot |

### The BDOS's block

The BDOS's block is `src/ram.asm:142-216`. Warm boot's sweep clears all of it
and then sets the DMA address to `0080h`:

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BE76h–BE7Ah` | 5 | `OLDSP`, `ERRMODE`, `PARAM` | the caller's stack pointer, function 45's error mode and the caller's `DE` | cold boot and warm boot |
| `BE7Bh–BE7Eh` | 4 | `COLUMN`, `LISTEN`, `PENDING`, `PENDCHR` | the console column, the `^P` copy and the kept character | cold boot and warm boot |
| `BE7Fh–BE84h` | 6 | `LINPTR` to `HPOS` | function 10's state, `HFLAG` and the history line shown | cold boot and warm boot |
| `BE85h–BE8Ah` | 6 | `CURDRV` to `DEFALV` | the bound drive and the default drive with its DPB and vector | cold boot and warm boot |
| `BE8Bh` | 1 | `USERNO` | the user number | cold boot and warm boot |
| `BE8Ch` | 1 | `WRFLAG` | set by the CCP for its reset | cold boot and warm boot |
| `BE8Dh–BE8Eh` | 2 | `WARMV` | the drives to rebuild to their mark | cold boot and warm boot |
| `BE8Fh–BE90h` | 2 | `ROVEC` | the read-only vector | cold boot and warm boot |
| `BE91h–BE92h` | 2 | `CURDMA` | the DMA address | cold boot and warm boot; warm boot then writes `0080h` |
| `BE93h–BE9Ch` | 10 | `DPHPTR` to `XLTPTR` | the bound drive's DPH, DPB, directory buffer, vector and translation table | cold boot and warm boot |
| `BE9Dh–BEC9h` | 45 | `CURTRK` to `DIRSEC` | the directory search, the scan and the file position | cold boot and warm boot |
| `BECAh–BEFFh` | 54 | `STKBASE` | the BDOS's stack, up to `STKTOP` | cold boot and warm boot |

### Above the RAM BIOS table

The block above the table is `src/ram.asm:218-301`. Warm boot's sweep stops
at `BEFFh`, so every byte here survives a warm boot unless the code named in
its row writes it:

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BF33h–BF3Dh` | 11 | `SDBYTE` to `SDXB` | the SD card driver's state: the addressing flag, the command argument, the block address, the last error and the latch value while a block is a cache line | cold boot |
| `BF3Eh–BF41h` | 4 | `CNEXT` to `CIFF` | the block cache's state: the next line in turn, the BIOS write's type and the saved interrupt state | cold boot |
| `BF42h–BF48h` | 7 | `KBMASK` to `KBT2` | the matrix keyboard's scan | cold boot |
| `BF49h–BF4Ch` | 4 | `PIVEC`, `GLVEC` | the two consoles' tables: `PIBLK`, or 0 with no PICO9918 console, and `GLCD.SVC`'s | cold boot |
| `BF4Dh` | 1 | `HHEAD` | the history's head | cold boot |
| `BF4Eh–BF51h` | 4 | `XMDST` to `MVREST` | the banks and count of the cache's copy, `MVCOPY` | cold boot |
| `BF52h–BF53h` | 2 | `PZTOP` | the word warm boot puts at `0006h` | cold boot |
| `BF54h–BF55h` | 2 | `PRGCODE` | function 108's return code | cold boot |
| `BF56h–BF5Ah` | 5 | `LOADTOP` to `SLDL` | the CCP's and the service loader's figures: the loaded file's end, the last record and the relocation delta | cold boot |
| `BF5Bh–BF61h` | 7 | `SVCBSY` to `SVCRA` | the service loader's and registry's state: the busy flag, the registry's head, the lowest service's page, the generation, the last load's failure code and `INIT`'s `A` | cold boot |
| `BF62h` | 1 | `STFLAG` | `FFh` while a line from `STARTUP.CMD` runs, 0 for a typed one | cold boot |
| `BF63h` | 1 | `STPOS` | startup's position | cold boot |
| `BF64h–BFE3h` | 128 | `STREC` | the record of `A:STARTUP.CMD` | cold boot |
| `BFE4h` | 1 | `CHPOS` | the chained line's next piece | cold boot |
| `BFE5h` | 1 | `RXFULL` | nonzero while a console byte waits in `RXCHAR` | cold boot |
| `BFE6h` | 1 | `RXCHAR` | that byte | cold boot |
| `BFE7h` | 1 | `CONDEV` | the console devices present, a bit each | cold boot |
| `BFE8h` | 1 | `VROW` | the video terminal's cursor row | cold boot |
| `BFE9h` | 1 | `VCOL` | the video terminal's cursor column | cold boot |
| `BFEAh` | 1 | `VWID` | the video console's columns, 0 on the serial terminal | cold boot |
| `BFEBh` | 1 | `VHGT` | the video console's rows | cold boot |
| `BFECh` | 1 | `ESCST` | the escape parser's state | cold boot |
| `BFEDh` | 1 | `ESCP1` | the escape parser's first numeric parameter | cold boot |
| `BFEEh` | 1 | `ESCP2` | the escape parser's second numeric parameter | cold boot |
| `BFEFh` | 1 | `KBLAST` | the matrix key held at the last poll, `FFh` for none | cold boot |
| `BFF0h` | 1 | `VATTR` | `80h` while reverse video is on | cold boot |
| `BFF1h` | 1 | `VCURV` | 1 while the cursor cell is drawn as its reverse image | cold boot |
| `BFF2h–BFFFh` | 14 | `MNTBLK` to `MNTLN` | the rest of the `MOUNT` routine's scratch | cold boot |

`SVCRA` is a cause only when `SVCRC` is 1, and it is 0 when a record failed
its check after `INIT` (`src/ram.asm:266-267`). Chapter 24 explains the two.

## EXPAND 1

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `8000h–BBFFh` | 15,360 | the block cache's 30 lines, 512 bytes each |
| `BC00h–BC77h` | 120 | `CTAB`: each line's card block, 4 bytes, `FFFFFFFFh` while empty |
| `BC78h–BC7Fh` | 8 | unused |
| `BC80h–BC9Dh` | 30 | `CDIRTY`: each line's dirty byte |
| `BC9Eh–BCFFh` | 98 | unused |
| `BD00h–BDFFh` | 256 | `HRING`: the command history |
| `BE00h–BEFFh` | 256 | unused |
| `BF00h–BFFFh` | 256 | unused |

The cache's addresses are in `src/layout.asm:23-25` and the history's page in
`src/history.asm:14`. Cold boot clears all of EXPAND 1
(`src/boot.asm:169-180`). No BDOS or BIOS call gives a program a range in it.
A program that writes the latch can still switch it in, and Chapter 15
explains what happens to a program that ends with EXPAND 1 in view.

## The stacks

| Stack | Addresses | Bytes | Used by |
| --- | --- | ---: | --- |
| boot | below `8000h` | | cold boot, until the workspace is cleared (`src/layout.asm:56`, `src/boot.asm:24`) |
| BIOS | `BCC5h–BCECh` | 40 | warm boot (`src/boot.asm:96`) |
| CCP | `BE56h–BE75h` | 32 | the CCP, and a program from its start, with `0000h` pushed |
| BDOS | `BECAh–BEFFh` | 54 | every BDOS function and the BIOS calls it makes, and cold boot from the workspace's clear to the CCP: the console's start, the banner, the mount, the drive listing and the diagnostic prompt (`src/boot.asm:42`, `src/boot.asm:63`, `src/boot.asm:463-470`) |

The sizes are `BIOSSTN`, `CCPSTN` and `BDOSSTN` in `src/layout.asm:64-73`. A
loaded service runs on its caller's stack, and `SVCLIM` gives what the services
together may add: 8 bytes to the BDOS's, 12 to the BIOS's and 6 to the CCP's
(`src/tables.asm:96`). [Chapter 14](14-memory-map.md#the-four-stacks) gives
each stack's measured base, and Chapter 24 what the loader does with
`SVCLIM`.

## Reproducing the figures

`npm run media` writes the summary tables to `docs/memory-map.md` from the
build's census, `build/tecos/census.json` (`tools/media.mjs:71-171`,
`tools/media.mjs:241`). The address of any label is in the build's symbol
file, `build/tecos/tecos.d8.json`. This command prints the addresses of the
labels named after it:

```sh
node -e '
const s = JSON.parse(require("fs").readFileSync("build/tecos/tecos.d8.json", "utf8")).symbols;
for (const n of process.argv.slice(1)) {
  const x = s.find((y) => y.name === n);
  console.log(n, (x.address ?? x.value).toString(16).toUpperCase() + "h");
}' CMDTXT PRGCODE CHPOS
```

```text
CMDTXT BD37h
PRGCODE BF54h
CHPOS BFE4h
```

A change to the source can move any address in the workspace tables, except
the few the code fixes: page zero, EXPAND 1's cache, cache table and history
page, `BF00h` for the RAM BIOS table and the ROM table at `C003h`.
