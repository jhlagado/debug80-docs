---
title: C. Memory map
parent: TEC-OS
nav_order: 103
nav_group: "Appendices"
---

# Appendix C. Memory map

Checked against TEC-OS 58d4345.

This appendix gives the addresses TEC-OS uses: the CPU's address space, the
ROM, page zero, the resident workspace at the top of EXPAND 0, EXPAND 1 and
the stacks. Chapter 13 explains the layout and Chapter 7 describes it from a
program's side. The figures are those of the build at 58d4345, whose one
profile is `tecos` and whose ROM has the SHA-256
`8bb1637d52039f3c864d18a7b48819998f2315f0b5ad28fe2ea22e7150499e45`. Where the
figures depend on the card they are those of the starter card, with a G1M
volume on drive A and a G8M volume on drive B, and no service installed.

## Taking the figures from the build

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

Every address in the workspace tables below comes from that file. A change to
the source can move any of them, except the few the code fixes: page zero,
EXPAND 1's cache, cache table and history page, `BF00h` for the RAM BIOS table
and the ROM table at `C003h`.

## The CPU's address space

The Z80's 64 KiB are three windows:

| Addresses | Contents |
| --- | --- |
| `0000h–7FFFh` | the fixed RAM |
| `8000h–BFFFh` | EXPAND 0, or EXPAND 1 while bit 2 of the latch is set |
| `C000h–FFFFh` | the ROM |

At reset the first 2 KiB of the ROM also appear at `0000h–07FFh`, until cold
boot sets bit 0 of the latch (`src/reset.asm:1-3`, `src/boot.asm:22-23`). With
EXPAND 0 in view, TEC-OS uses them in this way:

| Addresses | Contents |
| --- | --- |
| `0000h–00FFh` | page zero |
| `0100h–B9A3h` | the TPA, 47,268 bytes |
| `B9A4h–BFFFh` | the BDOS entry jump and the resident workspace, in EXPAND 0 |
| `C000h–FFFFh` | the ROM |

The latch is the system latch at port `FFh`, which TEC-OS writes from the copy
it keeps at `0040h` (`src/layout.asm:13-20`). Its value while TEC-OS runs is
`01h`: the boot overlay off and EXPAND 0 in view. It is
`81h` while the matrix keyboard's Caps Lock is on, which sets bit 7
(`src/keyboard.asm:104-109`).

The TPA ends below the BDOS entry jump, whose address is in the word at
`0006h`. Cold boot places the jump directly below the lowest allocation vector
of the card's drives, 3 bytes under that vector's address (`src/boot.asm:418-422`).
A service goes in whole pages below the jump's page and lowers the word at `0006h`
to the start of its first page, which holds its own `JP BENTRY`. On the starter
card the first service's pages end at `B8FFh`, so the 164 bytes from `B900h` to
`B9A3h` leave the TPA with it.

| Card | Vectors | BDOS entry | TPA |
| --- | ---: | --- | ---: |
| the starter card, G1M on A and G8M on B | 320 bytes | `B9A4h` | 47,268 bytes |
| four G8M volumes | 1,024 bytes | `B6E4h` | 46,564 bytes |

## The ROM

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump, `JP RSTENT` |
| `C003h–C00Ah` | 8 | the ROM table |
| `C00Bh–C609h` | 1,535 | the read-only data, `ROMDATA` to `ROMCODE`, with the font, `FONT`, at `C179h–C478h` |
| `C60Ah–FE04h` | 14,331 | the code |
| `FE05h–FFFFh` | 507 | free |

Within the code, the CCP is at `DCE2h–E6A0h`, 2,495 bytes, and the BDOS at
`E6A1h–F5BFh`, 3,871 bytes, in the order `src/rom.asm` includes them
(`src/rom.asm:26-28`). The ROM's own copy of the BIOS jump table is in the
data, at `BIOSBAS`, and is never called: cold boot copies it to `BF00h`
(`src/tables.asm:10-26`, `src/boot.asm:68-71`).

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

Cold boot clears page zero, and `PZINIT` writes it at cold boot and at every
warm boot, leaving the IOBYTE and the drive and user byte as they are
(`src/boot.asm:26-32`, `src/boot.asm:204-263`). An unload and a failed `INIT` clear
the first byte of each restart vector the service claimed and then run the
same sweep of the vectors, `PZSWP` (`src/loader.asm:61-72`,
`src/loader.asm:260-264`, `src/loader.asm:296-308`). The CCP writes the byte at
`0004h` at each prompt, and the FCBs, the tail and the byte at `0050h` before
it runs a program (`src/cpm/ccp.asm:217-236`, `src/cpm/ccp.asm:304-306`,
`src/cpm/ccp.asm:1310-1342`).

Of the sixteen bytes that CP/M 2.2 leaves to the BIOS, TEC-OS keeps one,
`LATCHV`, the only byte it reads while EXPAND 1 is in view. `0041h–004Fh` are
unused, and cold boot's clear leaves them 0 (`src/layout.asm:34-37`). The
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
| `BF33h–BFFFh` | 205 | the SD card's, cache's, keyboard's, consoles', loader's, startup's and chained line's state, the console's state and the rest of the `MOUNT` routine's scratch |

The part from `WSBASE`, `BAE7h`, to `BEFFh` has the same addresses on every
card. The build places `WSBASE` so that the part ends at `BF00h`
(`tools/build.mjs:227-232`, `src/layout.asm:55-58`). The part above the table
starts at `BF33h`, 51 bytes after `BF00h` (`src/ram.asm:198`). Cold boot
clears the workspace from `WSBASE` up to `WSEND`, `BAE7h` to `BFFFh`
(`src/boot.asm:34-38`). Warm boot clears the part from `CCPCLR` to the end of
the BDOS's block and leaves the rest (`src/boot.asm:268-287`).

### The BIOS's block

`src/ram.asm:8-71`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BAE7h` | 1 | `DSKCUR` | the drive the BIOS has selected |
| `BAE8h–BAEDh` | 6 | `DSKTRK`, `DSKSEC`, `DSKDMA` | the track, sector and DMA address the BDOS last set |
| `BAEEh–BAF0h` | 3 | `BLKOFF`, `BLKSLOT` | the block within the volume and the record within the block |
| `BAF1h–BAF4h` | 4 | `BUFOK`, `BUFDRV`, `BUFBLK` | whether a write cleared a block rather than read it, and that block's drive and number |
| `BAF5h–BB14h` | 32 | `DRVTAB` | the drive table, 8 bytes a drive |
| `BB15h–BB18h` | 4 | `DRVIDX` | each drive's volume, its index + 1 |
| `BB19h–BB1Ch` | 4 | `DRVSLOT` | each drive's vector slot |
| `BB1Dh–BB5Ch` | 64 | `DPHTAB` | the four DPHs, 16 bytes each |
| `BB5Dh–BB5Eh` | 2 | `LOGINV` | the BDOS's logged-in drives |
| `BB5Fh–BBDEh` | 128 | `DIRBUF` | the directory buffer every drive shares |
| `BBDFh–BBE0h` | 2 | `CSVDUM` | the unused check vector |
| `BBE1h–BBE2h` | 2 | `STUBAD` | the BDOS entry jump's address |
| `BBE3h–BC41h` | 95 | `PIBLK` to `PIROWT` | the PICO9918 console's block: its table, width, record in the registry, pages, registers and row addresses |
| `BC42h` | 1 | `MNTCNT` | the `MOUNT` routine's count, part of the scratch the volume services also use |
| `BC43h–BC62h` | 32 | `MNBUF` | 32 bytes of the container's table, copied from the cache line that holds it |
| `BC63h–BCB2h` | 80 | `LINEBUF` | one display row, for the terminal's row moves and the LCD's drive rows |
| `BCB3h–BCC0h` | 14 | `VPUTV` to `VFNV` | the seven vectors into the display's table |
| `BCC1h–BCC4h` | 4 | `VSTOP` to `CONMOD` | the scroll region, the PICO9918's claim and the console mode |
| `BCC5h–BCECh` | 40 | `BSTKB` | the BIOS stack, up to `BSTK` |

### The CCP's block

`src/ram.asm:76-133`. Warm boot keeps the bytes below `CCPCLR`, `BDB7h`, and
clears the rest:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BCEDh–BD10h` | 36 | `CMDFCB` | the command's FCB |
| `BD11h–BD34h` | 36 | `RENFCB` | the second FCB of `REN` and `COPY` |
| `BD35h` | 1 | `CMDBUF` | function 10's maximum, 127 |
| `BD36h` | 1 | `CMDLEN` | the line's length |
| `BD37h–BDB6h` | 128 | `CMDTXT` | the command line |
| `BDB7h` | 1 | `BOOTDRV` | the drive at the CCP's entry |
| `BDB8h–BDCAh` | 19 | `CMDSTRT` to `ERAALL` | the parser's pointers and the state of `DIR`, the pager, `SAVE` and `ERA` |
| `BDCBh–BE4Ah` | 128 | `LOADBUF` | the CCP's scratch record |
| `BE4Bh–BE55h` | 11 | `STKGUARD` | the CCP stack's guard, `A5h` in each byte |
| `BE56h–BE75h` | 32 | `CSTKBAS` | the CCP's stack, up to `CSTKTOP` |

### The BDOS's block

`src/ram.asm:135-196`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BE76h–BE7Ah` | 5 | `OLDSP`, `ERRMODE`, `PARAM` | the caller's stack pointer, function 45's error mode and the caller's `DE` |
| `BE7Bh–BE7Eh` | 4 | `COLUMN`, `LISTEN`, `PENDING`, `PENDCHR` | the console column, the `^P` copy and the kept character |
| `BE7Fh–BE84h` | 6 | `LINPTR` to `HPOS` | function 10's state, `HFLAG` and the history line shown |
| `BE85h–BE8Ah` | 6 | `CURDRV` to `DEFALV` | the bound drive and the default drive with its DPB and vector |
| `BE8Bh` | 1 | `USERNO` | the user number |
| `BE8Ch` | 1 | `WRFLAG` | set by the CCP for its reset |
| `BE8Dh–BE8Eh` | 2 | `WARMV` | the drives to rebuild to their mark |
| `BE8Fh–BE90h` | 2 | `ROVEC` | the read-only vector |
| `BE91h–BE92h` | 2 | `CURDMA` | the DMA address |
| `BE93h–BE9Ch` | 10 | `DPHPTR` to `XLTPTR` | the bound drive's DPH, DPB, directory buffer, vector and translation table |
| `BE9Dh–BEC9h` | 45 | `CURTRK` to `DIRSEC` | the directory search, the scan and the file position |
| `BECAh–BEFFh` | 54 | `STKBASE` | the BDOS's stack, up to `STKTOP` |

### Above the RAM BIOS table

`src/ram.asm:198-272`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BF33h–BF3Dh` | 11 | `SDBYTE` to `SDXB` | the SD card driver's state |
| `BF3Eh–BF41h` | 4 | `CNEXT` to `CIFF` | the block cache's state |
| `BF42h–BF48h` | 7 | `KBMASK` to `KBT2` | the matrix keyboard's scan |
| `BF49h–BF4Ch` | 4 | `PIVEC`, `GLVEC` | the two consoles' tables: `PIBLK`, or 0 with no PICO9918 console, and `GLCD.SVC`'s |
| `BF4Dh` | 1 | `HHEAD` | the history's head |
| `BF4Eh–BF51h` | 4 | `XMDST` to `MVREST` | the banks and count of the cache's copy, `MVCOPY` |
| `BF52h–BF53h` | 2 | `PZTOP` | the word warm boot puts at `0006h` |
| `BF54h–BF55h` | 2 | `PRGCODE` | function 108's return code |
| `BF56h–BF5Ah` | 5 | `LOADTOP` to `SLDL` | the CCP's and the service loader's figures |
| `BF5Bh–BF61h` | 7 | `SVCBSY` to `SVCRA` | the service loader's and registry's state, with the last load's failure and its `INIT`'s `A` |
| `BF62h` | 1 | `STFLAG` | `FFh` while a line from `STARTUP.CMD` runs, 0 for a typed one |
| `BF63h` | 1 | `STPOS` | startup's position |
| `BF64h–BFE3h` | 128 | `STREC` | the record of `A:STARTUP.CMD` |
| `BFE4h` | 1 | `CHPOS` | the chained line's next piece |
| `BFE5h` | 1 | `RXFULL` | nonzero while a console byte waits in `RXCHAR` |
| `BFE6h` | 1 | `RXCHAR` | that byte |
| `BFE7h` | 1 | `CONDEV` | the console devices present, a bit each |
| `BFE8h` | 1 | `VROW` | the video terminal's cursor row |
| `BFE9h` | 1 | `VCOL` | and column |
| `BFEAh` | 1 | `VWID` | the video console's columns, 0 on the serial terminal |
| `BFEBh` | 1 | `VHGT` | its rows |
| `BFECh` | 1 | `ESCST` | the escape parser's state |
| `BFEDh` | 1 | `ESCP1` | its first numeric parameter |
| `BFEEh` | 1 | `ESCP2` | its second |
| `BFEFh` | 1 | `KBLAST` | the matrix key held at the last poll, `FFh` for none |
| `BFF0h` | 1 | `VATTR` | `80h` while reverse video is on |
| `BFF1h` | 1 | `VCURV` | 1 while the cursor cell is drawn as its reverse image |
| `BFF2h–BFFFh` | 14 | `MNTBLK` to `MNTLN` | the rest of the `MOUNT` routine's scratch |

## EXPAND 1

Cold boot clears all of EXPAND 1 (`src/boot.asm:156-164`). No BDOS or BIOS
call gives a program a range in it. A program that writes the latch can still
switch it in. If it ends with EXPAND 1 in view, the jump at `0000h` goes to
`BF03h` in EXPAND 1. That page holds zeros, which the Z80 runs as `NOP`s up to
the reset jump at `C000h`. The jump's target, `RSTENT`, reads the byte at
`0002h`, which holds the jump's own high byte only at reset, while the boot
overlay is on. Here it holds the RAM BIOS table's, and the machine warm boots:
EXPAND 0 comes back into view and the cache's dirty lines are written to the
card, as at any exit (`src/boot.asm:11-19`, `src/boot.asm:81-95`). A reset and
BIOS function 0 cold boot (`src/tables.asm:10`).

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

The cache's addresses are in `src/layout.asm:21-23` and the history's page in
`src/history.asm:14`.

## The stacks

| Stack | Addresses | Bytes | Used by |
| --- | --- | ---: | --- |
| boot | below `8000h` | | cold boot, until the workspace is cleared (`src/layout.asm:54`, `src/boot.asm:21`) |
| BIOS | `BCC5h–BCECh` | 40 | warm boot (`src/boot.asm:85`) |
| CCP | `BE56h–BE75h` | 32 | the CCP, and a program from its start, with `0000h` pushed |
| BDOS | `BECAh–BEFFh` | 54 | every BDOS function and the BIOS calls it makes, and cold boot from the workspace's clear to the CCP: the console's start, the banner, the mount, the drive listing and the diagnostic prompt (`src/boot.asm:39-42`, `src/boot.asm:54-57`, `src/boot.asm:429-431`) |

The sizes are `BIOSSTN`, `CCPSTN` and `BDOSSTN` in `src/layout.asm:62-71`. A
loaded service runs on its caller's stack, and `SVCLIM` gives what the services
together may add: 8 bytes to the BDOS's, 12 to the BIOS's and 6 to the CCP's
(`src/tables.asm:91`).
