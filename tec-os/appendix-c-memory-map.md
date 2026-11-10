---
title: C. Memory map
parent: TEC-OS
nav_order: 103
nav_group: "Reference"
---

# Appendix C. Memory map

<!-- Mechanism authority: TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     All build-dependent ROM/RAM addresses, sizes and retained lookup output
     below remain historical78127ec evidence from frozen book10821b6.
     No new map, label command, build, import, test, run or capture occurred.
     Source proof and historical evidence boundaries: c-pass-record.md. -->

A memory address needs both a bank and a build identity. This reference
pairs the historical `78127ec` map with the source contracts for each region.
[Chapter 11](11-memory-for-programs.md) explains the program's memory limits.
[Chapter 15](15-state-and-memory.md) explains resident state and its lifetime.

The address tables retain the `tecos` build at `78127ec`, whose ROM SHA-256 is
`8cad40923ce1c3c6079d3201a1a8cc294dbe501838ed54505ca12287672f8b9f`. Its single
profile was `tecos`. The starter card mounted G1M on A and G8M on B with no
service installed unless a row says otherwise. The resident workspace addresses
came from `build/tecos/tecos.d8.json`.

Current field meanings and code contracts below use `a1023bd`. Later builds
require their own symbol files for build-dependent addresses.

## The CPU's address space

The 64 KiB CPU address space contains fixed RAM, a bank window and ROM
(`a1023bd:src/layout.asm:1-7`):

| Addresses | Contents |
| --- | --- |
| `0000h–7FFFh` | Fixed RAM |
| `8000h–BFFFh` | EXPAND 0, replaced by EXPAND 1 while latch bit 2 is set |
| `C000h–FFFFh` | ROM |

At reset the first 2 KiB of ROM also appear at `0000h–07FFh`. The overlaid
jump enters `RSTENT` in ROM. Cold boot then sets latch bit 0 to remove the
overlay (`a1023bd:src/reset.asm:1-13`, `a1023bd:src/boot.asm:22-40`).
The historical `78127ec` starter layout with EXPAND 0 selected was:

| Addresses | Contents |
| --- | --- |
| `0000h–00FFh` | Page zero |
| `0100h–B9A3h` | Transient program area (TPA), 47,268 bytes |
| `B9A4h–BFFFh` | BDOS entry jump and resident workspace in EXPAND 0 |
| `C000h–FFFFh` | ROM |

TEC-OS writes the system latch at port `FFh` from its shadow at `0040h`,
`LATCHV`. The ordinary EXPAND 0 value is `01h`. With matrix Caps Lock on bit 7
is set, producing `81h`. Temporary EXPAND 1 accesses set bit 2 and restore the
shadow value afterwards (`a1023bd:src/layout.asm:19-28`, `a1023bd:src/abi.inc:286-289`,
`a1023bd:src/layout.asm:64-69`, `a1023bd:src/abi.inc:291-293`, `a1023bd:src/keyboard.asm:137-143`,
`a1023bd:src/history.asm:30-62`). Warm boot writes `01h` before selecting its
resident stack (`a1023bd:src/boot.asm:128-133`).

The word at `0006h` is the exclusive top of the TPA. Without a resident service
it points to a three-byte BDOS entry stub below the allocation vectors.
`ALVINIT` packs those vectors down from `WSBASE` and reserves the jump below the
lowest vector (`a1023bd:src/boot.asm:522-620`). A format 1.1 card with a nonzero
drive count reserves 256 bytes for each requested drive. Otherwise each mounted
drive receives `(DSM >> 3) + 1` bytes. A service lowers `0006h` to its first
page during installation. `PZTOP` is updated when its pages are committed
(`a1023bd:src/loader.asm:327-340`, `a1023bd:src/loader.asm:485-490`).

These card-dependent figures are historical `78127ec` values:

| Card | Vectors | BDOS entry | TPA |
| --- | ---: | --- | ---: |
| Starter card, G1M on A and G8M on B | 320 bytes | `B9A4h` | 47,268 bytes |
| Starter card with `GLCD.SVC` installed | 320 bytes | `B600h` | 46,336 bytes |
| Four G8M volumes | 1,024 bytes | `B6E4h` | 46,564 bytes |

## The ROM

The historical `78127ec` ROM occupied these ranges:

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `C000h–C002h` | 3 | Reset jump, `JP RSTENT` |
| `C003h–C00Ah` | 8 | ROM table |
| `C00Bh–C609h` | 1,535 | Read-only data from `ROMDATA` up to `ROMCODE`, including `FONT` at `C179h–C478h` |
| `C60Ah–FE91h` | 14,472 | Code |
| `FE92h–FFFFh` | 366 | Unused |

In that build the CCP's three files occupied `DD2Ah–E702h`, 2,521 bytes.
The BDOS's six files occupied `E703h–F608h`, 3,846 bytes. The source at
`a1023bd` includes four CCP files, including `cpm/ccpmut.asm`, then six
BDOS files (`a1023bd:src/rom.asm:31-40`).

The ROM copy of the BIOS jump table is data at `BIOSBAS`. Cold boot copies
its 17 jumps to `BF00h`. Calls use the RAM table, whose entries can be
replaced by resident hooks. Warm boot leaves that table intact
(`a1023bd:src/tables.asm:9-31`, `a1023bd:src/layout.asm:98-99`,
`a1023bd:src/boot.asm:106-109`).

## Page zero

These fixed addresses identify the current page-zero contracts
(`a1023bd:src/layout.asm:44-69`, `a1023bd:src/abi.inc:291-293`, `a1023bd:src/console.asm:61-72`):

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, warm boot through the RAM BIOS table |
| `0003h` | IOBYTE. TEC-OS applies its console field in bits 0 and 1 |
| `0004h` | Current drive in bits 0–3 and user number in bits 4–7 |
| `0005h` | `JP` through the word at `0006h`, to the BDOS entry jump or lowest service page |
| `0008h–0037h` | Restart vectors 1–6. Each defaults to seven zeros followed by `RET`, unless a `JP` target is strictly above `PZTOP` |
| `0038h` | Restart 7 and mode 1 interrupt entry. Defaults to `EI`, `RETI` unless a qualifying `JP` remains |
| `0040h` | `LATCHV`, the system latch shadow |
| `0041h–004Fh` | Unused |
| `0050h` | Load-drive byte. 0 means current drive, 1 means A and so on |
| `005Ch` | First default file control block (FCB) |
| `006Ch` | Second FCB, overlapping the first FCB's last 20 bytes |
| `0080h–00FFh` | Command tail and default DMA buffer |

Cold boot clears page zero. `PZINIT` writes the entry jumps and stub at cold
boot's end and on each warm boot. It leaves `0003h` and `0004h` unchanged
(`a1023bd:src/boot.asm:52-59`, `a1023bd:src/boot.asm:112-141`,
`a1023bd:src/boot.asm:297-312`). The restart sweep preserves the three bytes of
a qualifying jump and clears its remaining five bytes. A target equal to `PZTOP`
does not qualify. The default `EI`, `RETI` sequence at `0038h` is written only
when no qualifying jump remains there (`a1023bd:src/boot.asm:326-368`).

Service-page release clears the first byte of each claimed restart slot
before the sweep. Successful unload and failure cleanup that releases the
pages both use this rule. A failed `INIT` can retain its pages when a BIOS
hook still targets them so failure alone does not imply slot release
(`a1023bd:src/loader.asm:101-130`, `a1023bd:src/loader.asm:422-461`,
`a1023bd:src/loader.asm:506-526`).

The CCP records the drive/user byte for its command prompt. Before program
launch it writes both FCBs, then the command tail and default DMA address, then
the load-drive byte (`a1023bd:src/cpm/ccp.asm:335-353`,
`a1023bd:src/cpm/ccpcmd.asm:400-450`, `a1023bd:src/cpm/ccp.asm:477-490`). The
second FCB reaches `008Fh` so tail publication follows FCB parsing.

CP/M reserves `0040h–004Fh` for BIOS scratch. TEC-OS uses only `0040h`
there. It is the resident state byte read while EXPAND 1 hides the upper
workspace. Cold boot leaves the other 15 bytes zero. Console state is above
the RAM BIOS table (`a1023bd:src/layout.asm:64-69`, `a1023bd:src/abi.inc:291-293`,
`a1023bd:src/ram.asm:416-434`).

## The resident workspace

The following tables retain every address and size from the historical
`78127ec` starter layout. Field descriptions use the `a1023bd` declarations
and their clearing paths. A row's clearing column names the boot sweeps that
reach it. Other routines can still overwrite a retained field.

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `B9A4h–B9A6h` | 3 | BDOS entry jump, `JP BENTRY` |
| `B9A7h–BAE6h` | 320 | Allocation vectors, B's 256 bytes at `B9A7h` then A's 64 at `BAA7h` |
| `BAE7h–BCC4h` | 478 | BIOS disk state/buffers, PICO console block, mount scratch and terminal state |
| `BCC5h–BCECh` | 40 | BIOS stack |
| `BCEDh–BE75h` | 393 | CCP state and stack |
| `BE76h–BEFFh` | 138 | BDOS state and stack |
| `BF00h–BF32h` | 51 | RAM BIOS table, 17 jumps |
| `BF33h–BFFFh` | 205 | SD, cache, keyboard, display, loader, startup, chain and console state plus remaining mount scratch |

The build places `WSBASE` so that the lower workspace ends immediately before
`BF00h`. Its upper span starts after the 51-byte RAM BIOS table at `BF33h`
(`a1023bd:tools/build.mjs:237-267`, `a1023bd:src/ram.asm:305-307`).
Within the historical build these spans had fixed addresses across cards.
Allocation vectors below `WSBASE` varied with the card.

Cold boot clears the workspace from `WSBASE` up to but excluding `WSEND`.
Warm boot clears `CCPCLR` up to but excluding `BDOSRME`, then sets the DMA
address, command-buffer maximum and stack guard. It separately clears `BUFOK`
(`a1023bd:src/boot.asm:61-66`, `a1023bd:src/boot.asm:384-404`).
In the historical map those sweeps were `BAE7h–BFFFh` and
`BDB7h–BEFFh` respectively. Warm boot also writes retained fields outside
its clearing span, including `LATCHV` and `SVCBSY`
(`a1023bd:src/boot.asm:128-141`).

### The BIOS's block

The declarations are at `a1023bd:src/ram.asm:15-136`. Addresses below
remain historical `78127ec` values.

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BAE7h` | 1 | `DSKCUR` | Selected BIOS drive | Cold boot |
| `BAE8h–BAEDh` | 6 | `DSKTRK`, `DSKSEC`, `DSKDMA` | Last track, sector and DMA address set through the BIOS | Cold boot |
| `BAEEh–BAF0h` | 3 | `BLKOFF`, `BLKSLOT` | Block within the volume and 128-byte record within that block | Cold boot |
| `BAF1h–BAF4h` | 4 | `BUFOK`, `BUFDRV`, `BUFBLK` | Validity flag, drive and block of the write-cleared key | Cold boot. Warm boot also clears `BUFOK` |
| `BAF5h–BB14h` | 32 | `DRVTAB` | Four drive entries, 8 bytes each | Cold boot |
| `BB15h–BB18h` | 4 | `DRVIDX` | Volume index + 1 for each drive, 0 for none | Cold boot |
| `BB19h–BB1Ch` | 4 | `DRVSLOT` | Vector slot per drive, 0 for none, 1 for 64 bytes or 2 for 256 | Cold boot |
| `BB1Dh–BB5Ch` | 64 | `DPHTAB` | Four 16-byte DPHs | Cold boot |
| `BB5Dh–BB5Eh` | 2 | `LOGINV` | BDOS logged-in drive vector | Cold boot |
| `BB5Fh–BBDEh` | 128 | `DIRBUF` | Shared directory buffer | Cold boot |
| `BBDFh–BBE0h` | 2 | `CSVDUM` | Unused check-vector placeholder | Cold boot |
| `BBE1h–BBE2h` | 2 | `STUBAD` | BDOS entry jump address | Cold boot |
| `BBE3h–BC41h` | 95 | `PIBLK` to `PIROWT` | PICO console table, width, registry record, pages, registers and row addresses | Cold boot |
| `BC42h` | 1 | `MNTCNT` | Mount/volume-service scratch count | Cold boot |
| `BC43h–BC62h` | 32 | `MNBUF` | Container header or descriptor copied from a cache line | Cold boot |
| `BC63h–BCB2h` | 80 | `LINEBUF` | Display-row scratch for terminal moves and LCD drive rows | Cold boot |
| `BCB3h–BCC0h` | 14 | `VPUTV` to `VFNV` | Seven display-table vectors | Cold boot |
| `BCC1h–BCC4h` | 4 | `VSTOP` to `CONMOD` | Scroll-region limits, PICO claim and applied console mode | Cold boot |
| `BCC5h–BCECh` | 40 | `BSTKB` | BIOS stack up to exclusive top `BSTK` | Cold boot |

The write-cleared key identifies a block cleared for a new allocation rather
than read from the card. Clearing `BUFOK` prevents reuse of the old key.
A new type-2 write can still clear its block without a pre-read
(`a1023bd:src/bios.asm:340-388`).

### The CCP's block

The declarations are at `a1023bd:src/ram.asm:141-210`. The historical
`CCPCLR` address was `BDB7h`. The FCBs and command buffer below it survive
the warm clearing sweep for another chained piece.

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BCEDh–BD10h` | 36 | `CMDFCB` | Command FCB | Cold boot |
| `BD11h–BD34h` | 36 | `RENFCB` | Second FCB for `REN` and `COPY` | Cold boot |
| `BD35h` | 1 | `CMDBUF` | Function 10 maximum, 127 | Cold boot. Warm boot writes 127 |
| `BD36h` | 1 | `CMDLEN` | Command-line length | Cold boot |
| `BD37h–BDB6h` | 128 | `CMDTXT` | Retained command line | Cold boot |
| `BDB7h` | 1 | `BOOTDRV` | Drive selected for CCP entry | Cold and warm boot |
| `BDB8h–BDCAh` | 19 | `CMDSTRT` to `ERAALL` | Parser pointers and DIR, pager, SAVE and ERA state | Cold and warm boot |
| `BDCBh–BE4Ah` | 128 | `LOADBUF` | CCP scratch record | Cold and warm boot |
| `BE4Bh–BE55h` | 11 | `STKGUARD` | CCP stack guard, `A5h` in each byte | Cold and warm boot. Warm boot then writes `A5h` |
| `BE56h–BE75h` | 32 | `CSTKBAS` | CCP stack up to exclusive top `CSTKTOP` | Cold and warm boot |

Retention of the line does not guarantee execution of its remaining pieces. A
failed warm-boot flush clears `CHPOS` after dropping failed cache lines
(`a1023bd:src/cache.asm:265-299`, `a1023bd:src/cache.asm:557-572`).
[Chapter 22](22-chains-across-warm-boot.md) explains the other cancellation
paths.

### The BDOS's block

The declarations are at `a1023bd:src/ram.asm:217-298`. Warm boot clears this
whole block before setting the DMA address to `0080h`.

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BE76h–BE7Ah` | 5 | `OLDSP`, `ERRMODE`, `PARAM` | Caller SP, function 45 error mode and caller DE | Cold and warm boot |
| `BE7Bh–BE7Eh` | 4 | `COLUMN`, `LISTEN`, `PENDING`, `PENDCHR` | Console column, `^P` list-copy flag and pending-character flag/byte | Cold and warm boot |
| `BE7Fh–BE84h` | 6 | `LINPTR` to `HPOS` | Line-input pointer/counts, CCP-history flag `HFLAG` and shown history terminator offset `HPOS` | Cold and warm boot |
| `BE85h–BE8Ah` | 6 | `CURDRV` to `DEFALV` | Bound/default drive and default DPB/vector pointers | Cold and warm boot |
| `BE8Bh` | 1 | `USERNO` | User number | Cold and warm boot |
| `BE8Ch` | 1 | `WRFLAG` | CCP-set flag for its disk reset | Cold and warm boot |
| `BE8Dh–BE8Eh` | 2 | `WARMV` | Drives whose allocation vectors need rebuilding to their mark | Cold and warm boot |
| `BE8Fh–BE90h` | 2 | `ROVEC` | Read-only drive vector | Cold and warm boot |
| `BE91h–BE92h` | 2 | `CURDMA` | DMA address | Cold and warm boot. Warm boot then writes `0080h` |
| `BE93h–BE9Ch` | 10 | `DPHPTR` to `XLTPTR` | Bound DPH, DPB, directory buffer, allocation vector and translation-table pointers | Cold and warm boot |
| `BE9Dh–BEC9h` | 45 | `CURTRK` to `DIRSEC` | Directory search, allocation scan and file-position state | Cold and warm boot |
| `BECAh–BEFFh` | 54 | `STKBASE` | BDOS stack up to exclusive top `STKTOP` | Cold and warm boot |

### Above the RAM BIOS table

The declarations are at `a1023bd:src/ram.asm:305-464`. These historical
addresses lie above the warm clearing span. Cold-only clearing therefore
describes storage lifetime, not an assurance that its value remains unchanged.

| Addresses | Bytes | Name | Contents | Cleared by |
| --- | ---: | --- | --- | --- |
| `BF33h–BF3Dh` | 11 | `SDBYTE` to `SDXB` | SD addressing flag, big-endian argument, little-endian block address, last error and cache-transfer bank selector | Cold boot |
| `BF3Eh–BF41h` | 4 | `CNEXT` to `CIFF` | Replacement index, BIOS write type and two-byte saved interrupt state | Cold boot |
| `BF42h–BF48h` | 7 | `KBMASK` to `KBT2` | Matrix scan and pending arrow-sequence state | Cold boot |
| `BF49h–BF4Ch` | 4 | `PIVEC`, `GLVEC` | Console-table pointers, `PIBLK` for PICO or 0 when absent, and GLCD's table | Cold boot |
| `BF4Dh` | 1 | `HHEAD` | Next history write offset | Cold boot |
| `BF4Eh–BF51h` | 4 | `XMDST` to `MVREST` | MVCOPY source/destination banks and remaining byte count | Cold boot |
| `BF52h–BF53h` | 2 | `PZTOP` | Committed top restored to `0006h` by warm boot | Cold boot |
| `BF54h–BF55h` | 2 | `PRGCODE` | Function 108 program return code | Cold boot |
| `BF56h–BF5Ah` | 5 | `LOADTOP` to `SLDL` | Exclusive loaded-record end, last service-loader record and relocation delta | Cold boot |
| `BF5Bh–BF61h` | 7 | `SVCBSY` to `SVCRA` | Loader busy flag, registry head, lowest service page, generation, failure code and INIT's A | Cold boot |
| `BF62h` | 1 | `STFLAG` | `FFh` during a startup line, 0 during a typed line | Cold boot |
| `BF63h` | 1 | `STPOS` | Startup state and position | Cold boot |
| `BF64h–BFE3h` | 128 | `STREC` | One record of `A:STARTUP.CMD` | Cold boot |
| `BFE4h` | 1 | `CHPOS` | Next chained piece, offset in `CMDTXT` + 1, or 0 for none | Cold boot |
| `BFE5h` | 1 | `RXFULL` | Nonzero while a console byte is pending in `RXCHAR` | Cold boot |
| `BFE6h` | 1 | `RXCHAR` | Pending console byte | Cold boot |
| `BFE7h` | 1 | `CONDEV` | Device/switch status and LCD recovery-word ownership bits | Cold boot |
| `BFE8h` | 1 | `VROW` | Terminal cursor row | Cold boot |
| `BFE9h` | 1 | `VCOL` | Terminal cursor column | Cold boot |
| `BFEAh` | 1 | `VWID` | Video-console columns, 0 for serial | Cold boot |
| `BFEBh` | 1 | `VHGT` | Video-console rows | Cold boot |
| `BFECh` | 1 | `ESCST` | Escape-parser state | Cold boot |
| `BFEDh` | 1 | `ESCP1` | First numeric escape parameter | Cold boot |
| `BFEEh` | 1 | `ESCP2` | Second numeric escape parameter | Cold boot |
| `BFEFh` | 1 | `KBLAST` | Last held matrix key, `FFh` for none | Cold boot |
| `BFF0h` | 1 | `VATTR` | `80h` for reverse video | Cold boot |
| `BFF1h` | 1 | `VCURV` | 1 while the cursor cell is drawn reversed | Cold boot |
| `BFF2h–BFFFh` | 14 | `MNTBLK` to `MNTLN` | Remaining mount/volume-service scratch | Cold boot |

`CIFF` occupies two bytes. `HFLAG` marks the CCP's line-input call with `FFh`.
`HPOS` is a byte offset into the history page. `CONDEV` combines switch, probe
and ownership state so its bits do not all prove device presence
(`a1023bd:src/ram.asm:237-240`, `a1023bd:src/ram.asm:323-329`,
`a1023bd:src/layout.asm:70-75`, `a1023bd:src/cpm/ccp.asm:145-149`). `SVCRA`
identifies a cause only when `SVCRC` is 1. Record-validation failure after
successful INIT sets it to 0 (`a1023bd:src/loader.asm:412-430`).
[Chapter 25](25-loading-and-removing-services.md) explains those load outcomes.

## EXPAND 1

These fixed bank addresses hold the cache and history at `a1023bd`. They
also occur in the historical map (`a1023bd:src/layout.asm:32-42`,
`a1023bd:src/history.asm:16`):

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `8000h–BBFFh` | 15,360 | 30 cache lines of 512 bytes |
| `BC00h–BC77h` | 120 | `CTAB`, four-byte card-block key per line, `FFFFFFFFh` when empty |
| `BC78h–BC7Fh` | 8 | Unused |
| `BC80h–BC9Dh` | 30 | `CDIRTY`, one dirty byte per line |
| `BC9Eh–BCFFh` | 98 | Unused |
| `BD00h–BDFFh` | 256 | `HRING`, command history |
| `BE00h–BEFFh` | 256 | Unused |
| `BF00h–BFFFh` | 256 | Unused |

Cold boot clears the whole bank and then marks every cache key empty
(`a1023bd:src/boot.asm:232-249`). No BDOS or BIOS interface allocates a
program range there. Direct latch access can expose the bank but the
resident EXPAND 0 stacks disappear while it is selected. Cache/history
routines exclude maskable interrupts and restore the latch before any stack
operation (`a1023bd:src/history.asm:30-62`,
`a1023bd:src/bios.asm:410-440`, `a1023bd:src/sd.asm:466-571`,
`a1023bd:src/sd.asm:583-652`).

A jump to `0000h` with EXPAND 1 still selected reaches `BF03h` in that bank.
With its normally cleared unused bytes, execution continues through zeros
into the ROM at `C000h`. `RSTENT` distinguishes that entry from reset and
warm boot selects EXPAND 0 before setting its stack. Modified bank contents
can break that route. A program using the inherited stack also loses access
to its return word while EXPAND 1 is visible
(`a1023bd:src/boot.asm:22-40`, `a1023bd:src/boot.asm:128-133`,
`a1023bd:src/boot.asm:297-302`, `a1023bd:src/cpm/ccp.asm:482-490`).
[Chapter 16](16-reset-and-boot.md) explains the exit paths and their limits.

## The stacks

The addresses in this table are historical `78127ec` values. Current stack
reservations remain defined by `BOOTSTK`, `BIOSSTN`, `CCPSTN` and `BDOSSTN`
(`a1023bd:src/layout.asm:94`, `a1023bd:src/layout.asm:113-115`).

| Stack | Historical addresses | Bytes | Use |
| --- | --- | ---: | --- |
| Boot | Below `8000h` | | Cold boot until workspace clearing finishes |
| BIOS | `BCC5h–BCECh` | 40 | Warm boot |
| CCP | `BE56h–BE75h` | 32 | CCP and a program's inherited stack, with `0000h` pushed at launch |
| BDOS | `BECAh–BEFFh` | 54 | BDOS functions and their BIOS calls, plus cold boot after workspace clearing |

Cold boot switches from `BOOTSTK` to `STKTOP` after clearing the workspace.
Console initialisation, banner, mount, drive listing and the diagnostic prompt
use that BDOS stack before the CCP starts. Diagnostic retries set `STKTOP`
again (`a1023bd:src/boot.asm:35-68`, `a1023bd:src/boot.asm:79-111`).
A BDOS call saves caller SP in `OLDSP`, sets SP to `STKTOP` and restores
caller SP on return (`a1023bd:src/cpm/bdos.asm:120-123`,
`a1023bd:src/cpm/bdos.asm:204-208`).

Services run on their caller's stack. `SVCLIM` limits the combined additional
use to 8 bytes on BDOS, 12 on BIOS and 6 on CCP
(`a1023bd:src/tables.asm:139-144`, `a1023bd:src/loader.asm:216-245`). The
historical `78127ec` host-model census measured bases of 30, 18 and 18 bytes
respectively. Adding the declared limits gives 38/54, 30/40 and 24/32 bytes.
These are historical measurements and bounds, not a measurement of the inspected
source. [Chapter 15](15-state-and-memory.md#four-stacks-for-different-stages)
explains their scope and [Chapter 25](25-loading-and-removing-services.md)
explains declaration checks.

## Reproducing the figures

Historically `npm run media` wrote the summary into `docs/memory-map.md` from
`build/tecos/census.json` and the build's symbol file. The inspected media
writer still reads those artifacts and writes the summary
(`a1023bd:tools/media.mjs:66-91`, `a1023bd:tools/media.mjs:169-188`,
`a1023bd:tools/media.mjs:259`). Chapter 27 describes ROM/media construction.
The retained lookup below reads an existing `build/tecos/tecos.d8.json`.
It requires the matching historical artifact to reproduce these addresses:

```sh
node -e '
const s = JSON.parse(require("fs").readFileSync("build/tecos/tecos.d8.json", "utf8")).symbols;
for (const n of process.argv.slice(1)) {
  const x = s.find((y) => y.name === n);
  console.log(n, (x.address ?? x.value).toString(16).toUpperCase() + "h");
}' CMDTXT PRGCODE CHPOS
```

The retained historical lookup output is:

```text
CMDTXT BD37h
PRGCODE BF54h
CHPOS BFE4h
```

A source change can move build-dependent addresses. Page zero, the cache and
history addresses, RAM BIOS origin `BF00h` and ROM table origin `C003h` are
fixed by the inspected contract (`a1023bd:src/layout.asm:30-69`, `a1023bd:src/abi.inc:291-293`,
`a1023bd:src/layout.asm:98-99`, `a1023bd:src/history.asm:16`,
`a1023bd:tools/build.mjs:256-267`). A symbol lookup is valid for the artifact
it reads so a later map needs that build's symbols and identity.
