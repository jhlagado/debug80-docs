---
title: C. Memory map
parent: TEC-OS
nav_order: 103
nav_group: "Appendices"
---

# Appendix C. Memory map

Checked against TEC-OS 7458352.

This appendix gives the addresses TEC-OS uses: the CPU's address space, the
ROM, page zero, the resident workspace at the top of EXPAND 0, EXPAND 1 and
the stacks. Chapter 13 explains the layout and Chapter 7 describes it from a
program's side. The figures are those of the build at 7458352, whose one
profile is `tecos` and whose ROM has the SHA-256
`60abc9b43ce27071aabf50b6e4a336a5f79804494de4be5e67278905d5d36f76`. Where the
figures depend on the card they are those of the starter card, with a G1M
volume on drive A and a G8M volume on drive B, and no service installed.

## Taking the figures from the build

`npm run media` writes the summary tables to `docs/memory-map.md` from the
build's census, `build/tecos/census.json` (`tools/media.mjs:71-171`,
`tools/media.mjs:250`). The address of any label is in the build's symbol
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
CMDTXT BD35h
PRGCODE BF56h
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
| `0100h–B814h` | the TPA, 46,869 bytes |
| `B815h–BFFFh` | the BDOS entry jump and the resident workspace, in EXPAND 0 |
| `C000h–FFFFh` | the ROM |

The latch is the system latch at port `FFh`, which TEC-OS writes from the copy
it keeps at `0040h` (`src/layout.asm:13-20`). Its value while TEC-OS runs is
`01h`: the boot overlay off and EXPAND 0 in view. It is
`81h` while the matrix keyboard's Caps Lock is on, which sets bit 7
(`src/keyboard.asm:104-109`).

The TPA ends below the BDOS entry jump, whose address is in the word at
`0006h`. Cold boot places the jump directly below the lowest allocation vector
of the card's drives, 3 bytes under that vector's address (`src/boot.asm:434-438`).
A service goes in whole pages below the jump's page and lowers the word at `0006h`
to the start of its first page, which holds its own `JP BENTRY`. On the starter
card the first service's pages end at `B7FFh`, so the 21 bytes from `B800h` to
`B814h` leave the TPA with it.

| Card | Vectors | BDOS entry | TPA |
| --- | ---: | --- | ---: |
| the starter card, G1M on A and G8M on B | 320 bytes | `B815h` | 46,869 bytes |
| four G8M volumes | 1,024 bytes | `B555h` | 46,165 bytes |

## The ROM

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump, `JP RSTENT` |
| `C003h–C00Ah` | 8 | the ROM table |
| `C00Bh–C33Bh` | 817 | the read-only data, `ROMDATA` to `ROMCODE` |
| `C33Ch–F9EAh` | 13,999 | the code |
| `F9EBh–FFFFh` | 1,557 | free |

Within the code, the CCP is at `D7CDh–E157h`, 2,443 bytes, and the BDOS at
`E158h–F065h`, 3,854 bytes, in the order `src/rom.asm` includes them
(`src/rom.asm:25-27`). The ROM's own copy of the BIOS jump table is in the
data, at `BIOSBAS`, and is never called: cold boot copies it to `BF00h`
(`src/tables.asm:10-26`, `src/boot.asm:61-64`).

## Page zero

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, warm boot through the RAM BIOS table |
| `0003h` | the IOBYTE; TEC-OS acts on its console field, bits 0 and 1 |
| `0004h` | the current drive in bits 0–3 and the user number in bits 4–7 |
| `0005h` | `JP` to the BDOS entry jump or the start of the lowest service's page; the word at `0006h` is the top of the TPA |
| `0008h–0037h` | restart vectors 1 to 6: each a `RET` after seven zeros, unless it holds a `JP` whose target is above `PZTOP` |
| `0038h` | `EI`, `RETI`, for restart 7 and the interrupt of mode 1, unless it holds such a `JP` |
| `0040h–004Fh` | TEC-OS's state, below |
| `0050h` | the drive the CCP loaded the running program from: 0 for the current drive, 1 for A: and so on |
| `005Ch` | the default FCB |
| `006Ch` | the second FCB, overlapping the first's last 20 bytes |
| `0080h–00FFh` | the command tail and the default DMA buffer |

Cold boot clears page zero, and `PZINIT` writes it at cold boot and at every
warm boot, leaving the IOBYTE and the drive and user byte as they are
(`src/boot.asm:26-32`, `src/boot.asm:198-257`). An unload and a failed `INIT` clear
the first byte of each restart vector the service claimed and then run the
same sweep of the vectors, `PZSWP` (`src/loader.asm:61-72`,
`src/loader.asm:259-263`, `src/loader.asm:295-307`). The CCP writes the byte at
`0004h` at each prompt, and the FCBs, the tail and the byte at `0050h` before
it runs a program (`src/cpm/ccp.asm:206-225`, `src/cpm/ccp.asm:296-298`,
`src/cpm/ccp.asm:1328-1362`).

TEC-OS's own bytes are fourteen of the sixteen that CP/M 2.2 leaves to the
BIOS. `0041h` and `0044h` are unused (`src/layout.asm:34-49`):

| Address | Name | Contents |
| --- | --- | --- |
| `0040h` | `LATCHV` | the copy of the system latch |
| `0042h` | `RXFULL` | nonzero while a console byte waits in `RXCHAR` |
| `0043h` | `RXCHAR` | that byte |
| `0045h` | `CONDEV` | the console devices present, a bit each |
| `0046h` | `VROW` | the video terminal's cursor row |
| `0047h` | `VCOL` | and column |
| `0048h` | `VWID` | the video console's columns, 0 on the serial terminal |
| `0049h` | `VHGT` | its rows |
| `004Ah` | `ESCST` | the escape parser's state |
| `004Bh` | `ESCP1` | its first numeric parameter |
| `004Ch` | `ESCP2` | its second |
| `004Dh` | `KBLAST` | the matrix key held at the last poll, `FFh` for none |
| `004Eh` | `VATTR` | `80h` while reverse video is on |
| `004Fh` | `VCURV` | 1 while the cursor cell is drawn as its reverse image |

## The resident workspace

From the BDOS entry jump to `BFFFh`, on the starter card:

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `B815h–B817h` | 3 | the BDOS entry jump, `JP BENTRY` |
| `B818h–B957h` | 320 | the allocation vectors: B's 256 bytes at `B818h`, then A's 64 at `B918h` |
| `B958h–BCC4h` | 877 | the BIOS's disk state and buffers, the `MOUNT` routine's scratch and the video terminal's state |
| `BCC5h–BCEAh` | 38 | the BIOS stack |
| `BCEBh–BE76h` | 396 | the CCP's state and stack |
| `BE77h–BEFFh` | 137 | the BDOS's state and stack |
| `BF00h–BF32h` | 51 | the RAM BIOS table, 17 jumps |
| `BF33h–BFE4h` | 178 | the SD card's, cache's, keyboard's, display drivers', loader's, startup's and chained line's state |
| `BFE5h–BFFFh` | 27 | unused |

The part from `WSBASE`, `B958h`, to `BEFFh` has the same addresses on every
card. The build places `WSBASE` so that the part ends at `BF00h`
(`tools/build.mjs:228-233`, `src/layout.asm:67-70`). The part above the table
starts at `BF33h`, 51 bytes after `BF00h` (`src/ram.asm:192`). Cold boot
clears the workspace from `WSBASE` up to `WSEND`, `B958h` to `BFE4h`
(`src/boot.asm:34-38`). Warm boot clears the part from `CCPCLR` to the end of
the BDOS's block and leaves the rest (`src/boot.asm:262-281`).

### The BIOS's block

`src/ram.asm:8-62`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `B958h` | 1 | `DSKCUR` | the drive the BIOS has selected |
| `B959h–B95Eh` | 6 | `DSKTRK`, `DSKSEC`, `DSKDMA` | the track, sector and DMA address the BDOS last set |
| `B95Fh–B961h` | 3 | `BLKOFF`, `BLKSLOT` | the block within the volume and the record within the block |
| `B962h–B965h` | 4 | `BUFOK`, `BUFDRV`, `BUFBLK` | the deblocking buffer's state and key |
| `B966h–BB65h` | 512 | `BLKBUF` | the deblocking buffer |
| `BB66h–BB85h` | 32 | `DRVTAB` | the drive table, 8 bytes a drive |
| `BB86h–BB89h` | 4 | `DRVIDX` | each drive's volume, its index + 1 |
| `BB8Ah–BB8Dh` | 4 | `DRVSLOT` | each drive's vector slot |
| `BB8Eh–BBCDh` | 64 | `DPHTAB` | the four DPHs, 16 bytes each |
| `BBCEh–BBCFh` | 2 | `LOGINV` | the BDOS's logged-in drives |
| `BBD0h–BC4Fh` | 128 | `DIRBUF` | the directory buffer every drive shares |
| `BC50h–BC51h` | 2 | `CSVDUM` | the unused check vector |
| `BC52h–BC53h` | 2 | `STUBAD` | the BDOS entry jump's address |
| `BC54h–BC61h` | 14 | `MNTCNT` to `MNTCB` | the `MOUNT` routine's scratch, which the volume services also use |
| `BC62h–BCB1h` | 80 | `LINEBUF` | one display row, for scrolling |
| `BCB2h–BCBFh` | 14 | `VPUTV` to `VFNV` | the seven vectors into the display driver |
| `BCC0h–BCC4h` | 5 | `VSTOP` to `CONMOD` | the scroll region, the console field acted on, the PICO9918's claim and the console mode |
| `BCC5h–BCEAh` | 38 | `BSTKB` | the BIOS stack, up to `BSTK` |

### The CCP's block

`src/ram.asm:67-128`. Warm boot keeps the bytes below `CCPCLR`, `BDB5h`, and
clears the rest:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BCEBh–BD0Eh` | 36 | `CMDFCB` | the command's FCB |
| `BD0Fh–BD32h` | 36 | `RENFCB` | the second FCB of `REN` and `COPY` |
| `BD33h` | 1 | `CMDBUF` | function 10's maximum, 127 |
| `BD34h` | 1 | `CMDLEN` | the line's length |
| `BD35h–BDB4h` | 128 | `CMDTXT` | the command line |
| `BDB5h` | 1 | `BOOTDRV` | the drive at the CCP's entry |
| `BDB6h–BDCBh` | 22 | `CMDSTRT` to `ERAALL` | the parser's pointers and the state of `DIR`, the pager, `SAVE` and `ERA` |
| `BDCCh–BE4Bh` | 128 | `LOADBUF` | the CCP's scratch record |
| `BE4Ch–BE58h` | 13 | `STKGUARD` | the CCP stack's guard, `A5h` in each byte |
| `BE59h–BE76h` | 30 | `CSTKBAS` | the CCP's stack, up to `CSTKTOP` |

### The BDOS's block

`src/ram.asm:130-190`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BE77h–BE7Ah` | 4 | `OLDSP`, `PARAM` | the caller's stack pointer and `DE` |
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

`src/ram.asm:192-241`:

| Addresses | Bytes | Name | Contents |
| --- | ---: | --- | --- |
| `BF33h–BF3Dh` | 11 | `SDBYTE` to `SDXB` | the SD card driver's state |
| `BF3Eh–BF43h` | 6 | `CNEXT` to `CIFF` | the block cache's state |
| `BF44h–BF4Ah` | 7 | `KBMASK` to `KBT2` | the matrix keyboard's scan |
| `BF4Bh–BF4Eh` | 4 | `PIVEC`, `GLVEC` | the display drivers' tables |
| `BF4Fh` | 1 | `HHEAD` | the history's head |
| `BF50h–BF53h` | 4 | `XMDST` to `MVREST` | the banks and count of the cache's copy, `MVCOPY` |
| `BF54h–BF55h` | 2 | `PZTOP` | the word warm boot puts at `0006h` |
| `BF56h–BF57h` | 2 | `PRGCODE` | function 108's return code |
| `BF58h–BF5Ch` | 5 | `LOADTOP` to `SLDL` | the CCP's and the service loader's figures |
| `BF5Dh–BF62h` | 6 | `SVCBSY` to `SVCRC` | the service loader's and registry's state |
| `BF63h` | 1 | `STPOS` | startup's position |
| `BF64h–BFE3h` | 128 | `STREC` | the record of `A:STARTUP.CMD` |
| `BFE4h` | 1 | `CHPOS` | the chained line's next piece |

## EXPAND 1

Cold boot clears all of EXPAND 1 (`src/boot.asm:150-158`). No BDOS or BIOS
call gives a program a range in it. A program that writes the latch can still
switch it in. If it ends with EXPAND 1 in view, the jump at `0000h` goes to
`BF03h` in EXPAND 1. That page holds zeros, which the Z80 runs as `NOP`s up to
the reset jump at `C000h`. The jump's target, `RSTENT`, reads the byte at
`0002h`, which holds the jump's own high byte only at reset, while the boot
overlay is on. Here it holds the RAM BIOS table's, and the machine warm boots:
EXPAND 0 comes back into view and the cache's dirty lines are written to the
card, as at any exit (`src/boot.asm:11-19`, `src/boot.asm:75-89`). A reset and
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
| boot | below `8000h` | | cold boot, until the workspace is cleared (`src/layout.asm:66`, `src/boot.asm:21`) |
| BIOS | `BCC5h–BCEAh` | 38 | cold boot after the RAM check, warm boot and the diagnostic prompt |
| CCP | `BE59h–BE76h` | 30 | the CCP, and a program from its start, with `0000h` pushed |
| BDOS | `BECAh–BEFFh` | 54 | every BDOS function and the BIOS calls it makes |

The sizes are `BIOSSTN`, `CCPSTN` and `BDOSSTN` in `src/layout.asm:74-81`. A
loaded service runs on its caller's stack, and `SVCLIM` gives what the services
together may add: 8 bytes to the BDOS's, 12 to the BIOS's and 6 to the CCP's
(`src/data3.asm:115`).
