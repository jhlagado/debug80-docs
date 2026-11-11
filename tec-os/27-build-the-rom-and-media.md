---
title: Build the ROM and media
parent: TEC-OS
nav_order: 27
nav_group: "Inside TEC-OS"
---

# 27. Build the ROM and media

<!-- Source mechanisms inspected at release-1 TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe. Unprefixed source ranges use
     that revision. No build, import, test or capture was performed. -->

<!-- Historical evidence: the ROM region figures, full SHA-256 and printed build
     line are confirmed at 78127ec by book-46. HELLO's source, error/repair
     screens and PC recipe/output are retained byte-exactly from frozen10821b6.
     The TED round and 33-byte ATOM result have explicit run evidence at7458352
     in book-31; later captures are recorded in book-42 and book-45.
     TAS is Thorium dbee66a, SHA-256
     45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     TED is Thorium128edb7, SHA-256
     2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f.
     Historical PC assembly used atom-z80 0.3.7. No BANNER40 proof is implied.
     Release-card passages (the four application inputs, the board
     diagnostics and the nine starter files) cite TEC-OS
     755636b130241173c5c30a0be8fe6b79cf2fee37 with a 755636b: prefix.
     Release TED.COM is Thorium 967678c (150a19bd…); BAZA.COM and BAZA.RTL
     were Baza fbfedb6 (725570a6…, 5854bfb6…) there. Passages prefixed
     12b2ec5: use TEC-OS 12b2ec5f470844c46cd0c92fea132f1a0ab11c40 (branch
     card-lower). The 7fa2823: memory-map passage uses TEC-OS
     7fa2823357b2a96330d0b90bd120702347043116 (ROM 3ed68c47… with DEL).
     Passages prefixed 31b6083: use TEC-OS
     31b60837d24cf801b5e8cf4daa4856f520227795 (main): the five application
     inputs and MON3.BIN, TED.COM Thorium b69d544 (4f622390…, 12,334
     bytes), BAZA.COM Baza 747b9a7 (27724068…, 16,128 bytes), BAZA.RTL
     7c0cda03… (11,136 bytes), the eleven-file page card, MON3.SVC beside
     the ROM on no card, and ROM 3e5311d2… with DEL and NAME.SVC /E.
     Passages prefixed 55114e4: use TEC-OS
     55114e4dfb234c81da73aea7e2e2ccaaf873b80e: the six application
     inputs, MON3.BIN and MON-3's sources, TAS.COM Thorium 3d1e2c0
     (e648a1d0…, 10,343 bytes) and CHAIN.ASM from it, TED.COM Thorium
     b69d544 as before, BAZA.COM Baza ab4d173 (4e0fee6a…, 17,536 bytes),
     BAZA.RTL 14d7fd11… (12,032 bytes), the one fifteen-file card with
     MON3.SVC, HELLO3 and CHAIN.ASM, and ROM 95467cae… after the ROM
     squeeze. Source reading only. -->

A ROM and its symbol map must describe the same addresses. Card programs
must use the interfaces supplied by that ROM. TEC-OS produces the image,
map and memory census together. Media preparation checks the selected map
generator and the ROM size/hash against the census
(`tools/build.mjs:273-323`, `tools/media.mjs:169-184`).

The host setup in [Chapter 6](06-cards-on-the-pc.md) is the starting point.
The build adds the pinned assembler host described below. These procedures
explain the release-1 source at `a1023bd`. The numerical image and HELLO examples
retain their separate historical evidence.

## Prepared tools and selected assembler

The repository requires Node.js 20 or later. `npm ci` installs its locked
host dependencies and `npm run inputs` prepares the application inputs.
At TEC-OS `55114e4` these are TED.COM, TAS.COM and the demonstration source
CHAIN.ASM from Thorium and BAZA.COM, BAZA.RTL and BOUNCE.BAS from Baza. The
same step also fetches MON-3's ROM, `MON3.BIN`, and thirteen of MON-3's
program and library sources, which only the tests read: they compare
`MON3.SVC` with MON-3 itself (`55114e4:test/inputs.json:3-205`,
`55114e4:docs/mon3.md:13-16`, `55114e4:docs/mon3.md:353-360`).
The inspected `package.json` selects `atom-z80` 0.3.7. The normal production
path uses TAS for the main ROM, the board diagnostics, `GLCD.SVC`,
`MOUNT.COM`, `DEMO.COM`, `MON3.SVC` and `HELLO3.BIN`. The diagnostics always
use TAS. The standalone ATOM examples use a separate assembly path
(`package.json:1-31`, `tools/build.mjs:342-351`,
`755636b:tools/diag.mjs:143-146`, `55114e4:tools/media.mjs:195-246`,
`55114e4:README.md:91-95`).

`TAS.COM` is pinned to Thorium
`3d1e2c0ea5269e1dfa4138671fab850c158f1670`. Its prepared host is from
`3d16b30cb8ed7deccc0a8b0b04f1b961e29f5689`. The source repository's
`README.md`, under Build and test, supplies the setup procedure. It prepares
a temporary host, installs that host's locked dependencies and verifies it
before moving it to `.inputs/tas-host`. Repeating setup validates an
existing host. The checks cover the runner, lock file, locked Z80 runtime
and the 10,343-byte TAS executable (`55114e4:tools/lib/tas-rom.mjs:10-11`,
`55114e4:tools/lib/tas-rom.mjs:77-98`, `55114e4:test/inputs.json:4-13`).

This TAS takes several statements on a line and rejects a line with more
than 128 characters of code, as
[Chapter 2](02-make-a-small-program.md#several-statements-on-a-line)
describes. TEC-OS's own sources keep one statement to a line and none is
that long, so the ROM, `GLCD.SVC`, `MON3.SVC`, `MOUNT.COM`, `DEMO.COM`,
`HELLO3.BIN` and the test programs assemble to the same bytes as under the
earlier `dbee66a` (`55114e4:docs/compatibility.md:199`). The ROM's map gives
each source line one statement, so the build rejects a ROM source line that
holds a `\` outside quotes and comments
(`55114e4:tools/lib/tas-d8.mjs:105-121`,
`55114e4:tools/lib/tas-d8.mjs:155-157`).

The input selection order is an explicit `TAS_COM`, `TED_COM`, `CHAIN_ASM`,
`BAZA_COM`, `BAZA_RTL` or `BOUNCE_BAS` then `.inputs/NAME` then the legacy
sibling file under `../thorium/dist/`, `../thorium/demo/chain/`,
`../baza/dist/` or `../baza/examples/` (`55114e4:README.md:79-89`).
The selected file must match its size and SHA-256. An empty override,
invalid local file or wrong selected binary stops the operation. Selection
does not fall through to another candidate after a mismatch
(`tools/lib/pins.mjs:10-48`). Input preparation may fetch a pinned local
copy when only the legacy sibling is missing or stale. It verifies the
temporary download before replacing the local input
(`tools/inputs.mjs:37-65`).

`TECOS_TAS_HOST` selects the prepared host, otherwise `.inputs/tas-host`
is used. An empty host override is an error. Assembly reads local prepared
files and does not download them (`tools/lib/tas-rom.mjs:77-107`).
After preparation, `npm run build` constructs the main ROM, `npm run diag`
assembles the board diagnostics, `DIAG.HEX` and `DIAG.BIN` for MON-3 to load
at `4000h`, and `npm run media` prepares the distribution
(`package.json:14-23`, `755636b:tools/diag.mjs:1-9`). Chapter 28 describes
the diagnostics. The explicit ATOM reference selection is:

```sh
TECOS_ROM_ASSEMBLER=atom npm run build
```

The default value of `TECOS_ROM_ASSEMBLER` is `tas`. Any value other than
`tas` or `atom` is rejected. The ATOM reference path needs no TAS host
(`tools/lib/tas-rom.mjs:120-124`, `tools/build.mjs:342-351`).

## Image regions and their addresses

The ROM occupies `C000h–FFFFh`, exactly 16 KiB. Its fixed beginning contains
the reset jump followed by the numbered-call interface. Read-only data and
code follow, with a single free gap at the end (`src/reset.asm:1-13`,
`src/abi.asm:9-14`, `src/rom.asm:1-17`, `src/end.asm:1-4`). The historical
`78127ec` image had these regions:

| Addresses | Bytes | Region |
| --- | ---: | --- |
| `C000h–C002h` | 3 | Reset jump |
| `C003h–C00Ah` | 8 | ROM interface |
| `C00Bh–C609h` | 1,535 | Read-only data |
| `C60Ah–FE91h` | 14,472 | Code |
| `FE92h–FFFFh` | 366 | Free |

Its used extent was 16,018 of 16,384 bytes. These figures describe that
historical image, not positions in the release-1 image. The map that the
`a1023bd` media step generated records 16,071 bytes used and 313 free, with
code ending at `FEC6h` (`docs/memory-map.md:1-30`). At TEC-OS `7fa2823`,
which adds DEL's record to the command table, the map records 16,077 bytes
used and 307 free, with code ending at `FECCh`
(`7fa2823:docs/memory-map.md:1-30`). At `31b6083`, which adds the
`NAME.SVC /E` path to the command processor and the loader, it records
16,247 bytes used and 137 free, with code ending at `FF76h`
(`31b6083:docs/memory-map.md:1-30`). At `55114e4`, after a pass that
shortened code throughout the ROM, it records 15,363 bytes used and 1,021
free, with data ending at `C639h` and code at `FC02h`. The ROM's SHA-256 is
`95467cae75ac86f0881f1deff468fdf7fd6b72ba8dfb460513daca3e28a4f902`
(`55114e4:docs/memory-map.md:1-30`). The census
stores each region's start and exclusive end while the table above prints
the last occupied address (`tools/build.mjs:273-288`).

At `C000h`, `JP RSTENT` transfers control into the code. The historical target
was `C60Ah`. The interface at `C003h` contains `TNA`, major 5, minor 1 and a
jump at `C008h` to `SVCDSP`. Its exclusive end is `C00Bh`
(`src/reset.asm:12-13`, `src/abi.asm:9-14`). The boot overlay and entry path
are explained in [Chapter 16](16-reset-and-boot.md).

The data region starts at `ROMDATA` and ends at `ROMCODE`. It contains
the BIOS jump table, keyboard tables, command names and handlers, BDOS
function table, numbered-service table, container geometry, font and
messages. Group headings name the source whose routines use each item.
For example, `CWMSG` contains `Write lost` under the `cache.asm` heading
(`src/tables.asm:1-14`, `src/tables.asm:38-144`, `src/text.asm:106-110`).
The BIOS jumps in this region execute through the RAM copy made at
`BF00h` during cold boot (`src/boot.asm:106-109`).

Code extends from `RSTENT` to the label `CODEEND` after the last included
file. The build fills the remaining image bytes with `FFh`
(`src/boot.asm:22-35`, `src/end.asm:1-4`, `tools/build.mjs:250-253`).
A map from a different ROM can assign valid-looking labels to the wrong
instructions so the ROM, map and census belong to the same build.

## Source order and reserved RAM

`src/rom.asm` includes the files in assembly order. The complete retained
include listing is:

```asm
	%INCLUDE	"abi.inc"
	%INCLUDE	"gen/config.asm"
	%INCLUDE	"gen/format.asm"
	%INCLUDE	"layout.asm"
	%INCLUDE	"ram.asm"
	%INCLUDE	"reset.asm"
	%INCLUDE	"abi.asm"
	%INCLUDE	"tables.asm"
	%INCLUDE	"gen/geom.asm"
	%INCLUDE	"gen/font.asm"
	%INCLUDE	"text.asm"
	%INCLUDE	"boot.asm"
	%INCLUDE	"bios.asm"
	%INCLUDE	"console.asm"
	%INCLUDE	"keyboard.asm"
	%INCLUDE	"term.asm"
	%INCLUDE	"video.asm"
	%INCLUDE	"tms.asm"
	%INCLUDE	"pico.asm"
	%INCLUDE	"lcd.asm"
	%INCLUDE	"sd.asm"
	%INCLUDE	"vol.asm"
	%INCLUDE	"volsvc.asm"
	%INCLUDE	"volutil.asm"
	%INCLUDE	"cpm/ccp.asm"
	%INCLUDE	"cpm/ccpfile.asm"
	%INCLUDE	"cpm/ccpmut.asm"
	%INCLUDE	"cpm/ccpcmd.asm"
	%INCLUDE	"cpm/bdos.asm"
	%INCLUDE	"cpm/bdosfile.asm"
	%INCLUDE	"cpm/bdosrec.asm"
	%INCLUDE	"cpm/bdosfn.asm"
	%INCLUDE	"cpm/bdoslog.asm"
	%INCLUDE	"cpm/bdoscon.asm"
	%INCLUDE	"services.asm"
	%INCLUDE	"cache.asm"
	%INCLUDE	"history.asm"
	%INCLUDE	"loader.asm"
	%INCLUDE	"end.asm"
```

The first four included files define equates. `abi.inc` supplies the same
interface addresses and service numbers used by programs. Configuration
and format equates come from generated files. `layout.asm` names ports,
latch values, page-zero state and fixed RAM addresses
(`src/rom.asm:7-10`, `src/layout.asm:9-99`).

`ram.asm` declares resident workspace before the reset origin. Its first `ORG`
is `WSBASE`. Unfilled `DS` declarations reserve addresses for variables and
stacks. They are RAM declarations, not initial data that cold boot copies from
the ROM. The second origin is `RAMBIOS+BIOSLEN`, placing the upper state after
the 51-byte RAM jump table (`src/ram.asm:1-18`, `src/ram.asm:295-308`). The
build interprets reservations according to the selected backend and extracts the
ROM extent after them (`tools/build.mjs:197-206`,
`tools/lib/tas-d8.mjs:183-188`, `tools/lib/tas-d8.mjs:239-279`).

`reset.asm` then sets `ORG $C000`. `abi.asm` follows its jump then the
four data files and finally the routine files. The CCP, BDOS and volume
routines each occupy consecutive included files. Their bytes remain together in the image (`src/rom.asm:12-45`). [Chapter 15](15-state-and-memory.md)
explains the workspace lifetimes separately from these address declarations.

## Generated configuration, geometry and font

Before generating files or assembling, the build validates the selected font,
its retained original inputs and complete notices
(`tools/build.mjs:342-351`, `tools/lib/font-package.mjs:8-21`).
It then writes four included files before assembly: `config.asm`,
`format.asm`, `geom.asm` and `font.asm` under `src/gen/`. The first two
supply equates and the last two supply ROM data. Each has a generated-file
heading (`tools/build.mjs:62-139`).

`config.asm` defines `WSBASE`, version values `VERHI`, `VERLO`, `ROMVER`
and serial delay counts. The inspected version is 0.1, printed in the boot
banner and LCD top row (`src/text.asm:12-12`, `src/text.asm:79-79`).
The serial calculation uses 4,000,000 Hz and 4,800 baud with the instruction
costs of the transmit, receive and polling loops. It produces `TXDLY`,
`TXSTOP`, `RXDLY`, `RXHALF` and `RXPOLL`. The historical values are 49, 105,
50, 70 and 77.
A count outside 1–255 raises an error (`tools/build.mjs:26-28`,
`tools/build.mjs:38-76`). [Chapter 17](17-console-paths.md) explains their
bit-level timing scope.

`format/format.json` defines `TECOSVOL`, the header and descriptor sizes,
field offsets, volume and drive limits and both DPBs. `gen/format.asm`
turns these into equates. `HCOUNT EQU 14` and `DMOUNT EQU 14` refer to
fields in different structures. `gen/geom.asm` emits `FMTMAG`, `GEOTAB`
and `DPB1`/`DPB2`. Each geometry-table entry has an id, payload length
and DPB address (`format/format.json:2-59`, `tools/build.mjs:79-136`).

The host tools read the same JSON through `tools/lib/format.mjs`.
`geometryInfo` checks 64 records per track, zero reserved tracks and `CKS`,
a maximum 256-byte allocation vector and consistency of block size, `EXM`
and directory allocation. It also bounds payload and record counts
(`tools/lib/format.mjs:9-40`). Shared definitions prevent different field
offsets, though the host and ROM still perform different validation checks.
[Chapter 18](18-card-blocks-and-volumes.md) explains those boundaries.

`FONT` comes from the selected TEC Compact data in `format/font5x7.txt`.
Its 96 characters from `20h` through `7Fh` have eight rows each, for 768 bytes.
Each row has five pixels in bits 7–3. The parser requires a unique header
for every code from `20h` through `7Fh`. It requires eight rows per character
and rejects malformed or misplaced pixel data before generating `DB` lines
(`tools/lib/font.mjs:9-47`).
The font package checks SHA-256 identities for the selected font, both
retained original inputs and the complete `format/FONT-NOTICES.txt`
(`tools/lib/font-package.mjs:8-21`). The notices record the derivative's
sources, edits and limits of the original glyph attribution
(`format/FONT-NOTICES.txt:1-47`).

In the historical `78127ec` map the font occupied `C179h–C478h`. PICO accesses
`FONT` by label and GLCD obtains its address through numbered service 15
(`src/pico.asm:250-257`, `src/services.asm:504-510`,
`drivers/glcd.asm:60-64`). The tests use the same font parser
(`test/lib/machine.mjs:8-10`).

## Two passes to place the workspace

The workspace must end immediately below the RAM BIOS table at `BF00h`.
Its size depends on the declarations and stack sizes so the build obtains
that size from an assembled label (`tools/build.mjs:235-250`).

The probe assembly uses `WSBASE = 8000h`. Its map must contain a real label
named `BDOSRME`. Subtracting `8000h` gives the workspace size. The final
base is `BF00h` minus that size. The build regenerates configuration at the
final base, assembles again and checks that the reported `WSBASE` agrees.
An absent marker, an equate substituted for the marker or an invalid extent
stops this placement (`tools/build.mjs:237-250`).

The TAS path stages the included sources under unambiguous CP/M names.
It rejects an include escaping the source root, repeated includes,
unsupported statements and a missing real workspace marker. Its conversion checks
TDBG origin, extent, checksum, padding, source definitions and emission
positions before extracting ROM bytes. It also validates RAM reservations
against their allowed extent (`tools/lib/tas-rom.mjs:15-69`,
`tools/lib/tas-d8.mjs:13-45`, `tools/lib/tas-d8.mjs:119-162`,
`tools/lib/tas-d8.mjs:183-255`). The resulting D8 map records source files,
labels and segments
(`tools/lib/tas-d8.mjs:257-279`).

The ATOM path checks that each emitted image starts at or above `C000h`
and materialises the ROM with `FFh` fill (`tools/build.mjs:197-206`).
The two backends reach the same placement checks through their respective
image/map conversions. Those checks inspect constructed artifacts. They do
not establish a runtime result or a board qualification.

## Placement and interface checks

A failed placement rule raises `placement check failed:` followed by its
reason. Missing map symbols also stop the build (`tools/build.mjs:213-221`).
Before writing the outputs, the build checks these properties:

- The ROM byte extent fits within 16 KiB. `RESET` is at `C000h` and the
  interface is at `C003h`. The data starts exactly at the interface's end.
  Data and code have valid order, with exclusive `CODEEND` at or below
  `10000h`
  (`tools/build.mjs:250-260`).
- The interface contains `TNA`, version 5.1 and `JP SVCDSP`, with an
  eight-byte extent. `SVCFMT` equals the PC writer's format constant.
  Every `SVTAB` target is in the code and interface device bits equal their
  `CONDEV` definitions (`tools/build.mjs:147-158`).
- PICO table offsets name the intended entries in `PITPL`. Debugger-visible
  places have their declared offsets in `PIBLK`
  (`tools/build.mjs:160-177`).
- Service sources in `drivers/` and `svc*.asm` files in `test/programs/`
  pass the ROM-literal interface check. The checked set must include
  `drivers/glcd.asm` and `test/programs/svcdemo.asm`
  (`tools/build.mjs:179-191`). This is a check of specific hexadecimal
  spellings, not proof about every possible expression
  (`tools/lib/svc.mjs:18-25`).
- `RAMBIOS` is `BF00h` and `BDOSRME` equals it. `SDBYTE` follows the
  51-byte BIOS table. Upper state ends by `C000h` and the BIOS stack ends
  no higher than the CCP workspace (`tools/build.mjs:264-268`).
- The starter transient program area (TPA) has at least 45,830 bytes
  (`tools/build.mjs:270-271`).

The last check is arithmetic, not a boot. `cardLayout` packs allocation
vectors down from `WSBASE` using `floor(DSM / 8) + 1` bytes each then
subtracts three bytes for the BDOS entry. The starter's `DSM` values 511
and 2047 give 64 and 256 bytes for 320 together
(`tools/build.mjs:223-232`). In the historical `78127ec` layout the entry
was `B9A4h`, leaving 47,268 bytes from `0100h`. A current build must supply
its own census instead of copying that historical ceiling.

## Matching the ROM and media

The main build writes `build/tecos/tecos.rom`, `tecos.d8.json` and
`census.json`. The census includes the ROM's SHA-256, used/free regions,
serial counts, RAM regions, card-layout figures and stack extents
(`tools/build.mjs:273-321`). `tools/capture.mjs` reads the D8 file beside
the selected ROM to locate labels (`tools/capture.mjs:65-72`).

When `dist/` exists, the build also copies the ROM, map and census there,
renaming the last to `tecos.census.json`. It updates an existing manifest's
profile figures. It does not rebuild the card or its program files at that
point (`tools/build.mjs:326-339`). After the build succeeds it also copies
`FONT-NOTICES.txt` into an existing `dist/` (`tools/build.mjs:349-351`).
`npm run media` prepares those outputs from the selected build
(`tools/media.mjs:169-207`).

Media preparation validates the font package before preparing or replacing
outputs (`tools/media.mjs:169-170`). It checks the map's generator against
the selected backend then checks ROM length and SHA-256 against the census.
It assembles MOUNT, GLCD, DEMO, MON3.SVC and HELLO3.BIN through that
selection and validates pinned TED, TAS, BAZA.COM, BAZA.RTL, BOUNCE.BAS and
CHAIN.ASM before preparing the recipe (`55114e4:tools/media.mjs:174-251`).
HELLO3.BIN is a flat image whose own `ORG` must put it at `4000h`, where
MON-3 programs load (`55114e4:tools/media.mjs:202-212`). The TAS
GLCD writer compares flat assemblies at `0100h` and `0200h`, checks their
header and relative symbols and packs the relocation data. The distribution
COM writer checks the declared zero-filled buffers of MOUNT and DEMO
(`tools/lib/tas-distribution.mjs:12-55`).

The starter recipe contains SYSTEM as G1M on A and written-behind WORK as
G8M on B. At `55114e4` it is the only card recipe: the web page builds the
same card, so media no longer writes a page recipe. A holds fifteen files:
MOUNT, GLCD, STARTUP, TED, the SAMPLE assembly source, the TIMES BASIC
source, TAS, BAZA, BAZA's runtime library `BAZA.RTL`, the BASIC game
BOUNCE.BAS pinned from Baza, DEMO's source DEMO.ASM, MON3.SVC, the MON-3
program HELLO3.BIN with its source HELLO3.ASM, and CHAIN.ASM pinned from
Thorium. `STARTUP.CMD` contains the GLCD installation line. Media still
builds and checks DEMO.COM but writes it beside the card's files, not onto
the card, where `TAS DEMO` makes it. It also writes a copy of MON3.SVC
beside the ROM (`55114e4:tools/media.mjs:213-273`,
`55114e4:tools/media.mjs:289-297`). Component entries record each file's
size and SHA-256. Assemblies and recipe construction finish before the output
replacement begins (`55114e4:tools/media.mjs:274-282`,
`tools/lib/starter.mjs:10-16`). Output files are replaced individually after
those preparation checks. The distribution also receives `FONT-NOTICES.txt`
as a companion to its artifacts, separate from the fifteen card files
(`55114e4:tools/media.mjs:293`).

Media also writes `docs/memory-map.md` and refreshes the ROM-space spans
in `docs/rom-services.md` from the census (`tools/media.mjs:46-65`,
`tools/media.mjs:258-262`). The image profile is `tecos`. Any other command-line
profile name is rejected (`tools/build.mjs:30-33`, `tools/build.mjs:354-367`).
The same image supports the detected board devices. A responding PICO9918
with the Matrix switch enabled starts at 40 columns. Explicit 80, 40 and
32-column selections remain available while GLCD uses its card driver
(`src/pico.asm:19-68`, `src/pico.asm:70-124`,
`tools/lib/starter.mjs:10-16`).

The retained `78127ec` build line is actual historical output:

```text
tecos: ROM 16018/16384 bytes, TPA $0100-$B9A3 (47268 bytes), sha256 8cad40923ce1c3c6
```

Its printed hash is the first sixteen hexadecimal digits of the full
SHA-256. That historical ROM's full digest is
`8cad40923ce1c3c6079d3201a1a8cc294dbe501838ed54505ca12287672f8b9f`
(`tools/build.mjs:276-276`, `tools/build.mjs:359-362`).

## HELLO as a historical tool round

The retained HELLO example connects the two assembly routes. This is the
historical program and error/repair round, distinct from the new BANNER
exercise. Its complete source is:

```asm
; HELLO: print a line and return to the CCP.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MESSAGE      ; the string, ended by $
        LD      C,9             ; BDOS function 9: print a string
        CALL    BDOS
        RET                     ; back to TEC-OS
MESSAGE:DB      "Hello from the TEC-1G",13,10,"$"
```

`ORG $0100` places the program at the CCP's load address. Function 9 prints
from `DE` until `$` without printing the terminator. The bytes 13 and 10
end the line. The final `RET` uses the return word installed by the CCP
(`src/cpm/bdos.asm:361-379`, `src/cpm/ccp.asm:477-490`). The historical
ATOM output was 33 bytes.

The historical editor round used HELLO saved on B with TED and TAS on A.
`TED HELLO.ASM 7` opened at the `CALL BDOS` line. Inserting `1` at its
start and pressing `^T B` saved the source and chained `A:TAS HELLO.ASM`
followed by `A:TED`. These PICO screen captures retain the explicit
`7458352` model-round provenance:

<!-- a run on the host model with work.img, driven as test/ted.test.mjs at 7458352 drives TED: B:, TED HELLO.ASM 7, 1, ^T B, Right, ^H, ^T R, a space, ^Q, DIR -->
```text

B>A:TAS HELLO.ASM
HELLO.ASM:7:1: expected a label, instruction or directive

B>A:TED
```

The diagnostic gives the source filename, line and column. TED reopened
at that position and displayed the message on its status row. Fourteen blank rows
between the source and status row are omitted from this retained screen:

<!-- the same run -->
```text
; HELLO: print a line and return to the CCP.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MESSAGE      ; the string, ended by $
        LD      C,9             ; BDOS function 9: print a string
1        CALL    BDOS
        RET                     ; back to TEC-OS
MESSAGE:DB      "Hello from the TEC-1G",13,10,"$"
TED  HELLO.ASM    expected a label, instruction or directive  ^S Save  ^Q Quit
```

The matrix keyboard has no Delete key. Right moved the cursor past `1`
and `^H` removed it. `^T R` then saved, assembled and ran the corrected
source. TED waited for a key before redrawing:

<!-- the same run -->
```text

B>A:TAS HELLO.ASM
HELLO.COM written

B>A:TED

B>HELLO
Hello from the TEC-1G

B>A:TED
Press a key
```

A key restored TED at line 7 and `^Q` ended the editor. TAS wrote
`HELLO.COM` and the debug file `HELLO.DBG` beside the source. TED's
`THOR.PRJ` names the source for the build keys after the first good build.
`THOR.SES` stores the work file and saved editing position. These files belong to
the editor/assembler round, separate from the ROM's D8 map.

## HELLO assembled on the PC

The PC route recorded at `7458352` used ATOM 0.3.7 installed with the
repository's `npm ci`. With the same source saved as `hello.asm`, this
command wrote `hello.com`:

```sh
npx atom hello.asm hello.com
```

A COM file is the raw binary for origin `0100h`. Another Z80 assembler
can supply that form, though number, equate and string syntax can differ.
The two recipes here retain their historical ATOM route. They do not
select the production ROM backend.

The next commands put the program on a separate image, leaving the starter
image as the source copy:

```sh
cp dist/starter.img work.img
node tools/tecvol.mjs put work.img B hello.com
```

`put` names it `HELLO.COM` on B (`tools/tecvol.mjs:149-156`). On a board,
`tecvol install` writes
`work.img` to the card as described in Chapter 6. The retained host-model
capture boots that image and enters `B:`, `DIR` and `HELLO`:

<!-- node tools/capture.mjs --card work.img B: DIR HELLO -->
```text
A>B:
B>DIR
HELLO.COM   
1 file, 8172K free
B>HELLO
Hello from the TEC-1G

B>
```

The blank line before the command prompt comes from the CCP's program-return
path (`src/cpm/ccp.asm:90-96`).
