---
title: The ROM and its build
parent: TEC-OS
nav_order: 13
nav_group: "Part II: Inside TEC-OS"
---

# 13. The ROM and its build

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

Part I showed what TEC-OS does at the prompt and for a program. Part II opens
the 16 KiB ROM and shows how it does those things and what it keeps where
while it does them. This chapter is the image itself: its parts, the source
order that produces them and the build that fixes every address the later
chapters cite.

## The image's parts

TEC-OS is one 16 KiB image for the addresses `C000h–FFFFh`, in five parts:

| Addresses | Bytes | Part |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump |
| `C003h–C00Ah` | 8 | the ROM table |
| `C00Bh–C609h` | 1,535 | the data |
| `C60Ah–FE91h` | 14,472 | the code |
| `FE92h–FFFFh` | 366 | free |

The figures are the build's at commit 78127ec, which it writes to
`build/tecos/census.json`. The used part, from `C000h` to the end of the code,
is 16,018 of the 16,384 bytes.

The first three bytes are `JP RSTENT` (`src/reset.asm:10-12`), a jump to `C60Ah`,
the first byte of the code. Chapter 15 describes how the Z80 reaches this jump
at reset.

The ROM table at `C003h` is the fixed interface for programs and services
(`src/abi.asm:13-21`). Its 8 bytes are the signature `TNA` and the ABI's major
and minor version, 5 and 1. At `C008h` is its one jump, to `SVCDSP`, the
dispatcher of the numbered services. Chapter 10 describes the table from a program's side
and Chapter 23 the services behind it. The table ends at `C00Bh`, where the
data begins.

The data block runs from the label `ROMDATA` (`src/tables.asm:15`) to `ROMCODE`
(`src/text.asm:86`). It holds every table and message the code reads: the
BIOS jump table `BIOSBAS`, the keyboard's tables, the built-in commands' words
with their handlers, the BDOS's function table, the table of the numbered
services, the container's name and disk parameters, the console's font and
the messages (`src/tables.asm:19-36`, `src/tables.asm:58-78`,
`src/tables.asm:86-93`, `src/tables.asm:101-115`). Each group is headed by the
name of the source file whose code uses it, so `CWMSG`, the text `Write lost`,
sits under `cache.asm` (`src/text.asm:84`). Nothing in the block runs where
it is. `BIOSBAS` is a table of jumps, but only the copy that cold boot makes at
`BF00h` is ever called (`src/tables.asm:8-13`), as Chapter 16 describes.

The code starts at `RSTENT` (`src/boot.asm:40-41`) and runs through every routine
of TEC-OS to `CODEEND`, which `src/end.asm:3` defines after the last file. The
free space is the rest of the ROM, in one gap, and the build fills it with
`FFh` (`tools/build.mjs:250-252`).

## The source order

The layout above follows from the order of the source files. The ROM's source
is in `src/`, and its top file, `src/rom.asm`, holds only includes, which the
assembler takes in the order listed (`src/rom.asm:1-44`):

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

The first five files emit no bytes. `abi.inc`, `gen/config.asm`,
`gen/format.asm` and `layout.asm` are equates. `layout.asm` names the ports,
the system latch's values, TEC-OS's one byte in page zero and the fixed
addresses in RAM (`src/layout.asm:13-149`). `abi.inc` is the file a program or
a service assembles with, so the ROM takes the table's addresses and the
services' numbers from the same equates as the program that calls them
(`src/abi.asm:4-10`). `ram.asm` names the resident workspace, which Chapter 14
describes. It sets the origin to `WSBASE` and reserves each variable with
`DS`, which defines a label and moves the address on without emitting
anything (`src/ram.asm:11-15`). A second origin, at `RAMBIOS+BIOSLEN`, places
the state above the RAM BIOS table (`src/ram.asm:294`).

Bytes start with `reset.asm` and its `ORG $C000` (`src/reset.asm:1`), and from
there each file's bytes follow the last file's. The table follows the reset
jump because `abi.asm` follows `reset.asm`. The data follows the table because
the four data files come next. The code follows the data because every file
after `text.asm` is code. So a code file's routines are in the code block, and
its strings and tables are in the data block under a heading with the file's
name (`src/tables.asm:1-10`, `src/text.asm:1-9`). The CCP, the BDOS and the
volume code are each split across files that follow one another, so their
bytes lie together as one file's would.

## The generated files

Four of the included files are written by the build before it assembles,
each headed with a line that says so (`tools/build.mjs:61-139`). They hold
what the source can't state for itself: the settings that depend on the build,
the container's layout and the font. The tools on the PC share the layout, and
the diagnostics ROM and the tests share the font.

`gen/config.asm` holds the settings that depend on the build. `WSBASE` is the
first byte of the resident workspace, which the build places as the next
section describes. `VERHI`, `VERLO` and `ROMVER` are the version, 0.1, which
the banner and the LCD's top row print from (`src/text.asm:11`,
`src/text.asm:63`). The last five, `TXDLY`, `TXSTOP`, `RXDLY`, `RXHALF` and
`RXPOLL`, are the delay counts for the bit-banged serial port. The build works
them out from the CPU's clock, 4,000,000 Hz, the baud rate, 4800, and the
T-states of the loops in `console.asm` (`tools/build.mjs:25-26`,
`tools/build.mjs:37-59`). At 78127ec they are 49, 105, 50, 70 and 77. The build
stops with an error if a count would not fit in a byte
(`tools/build.mjs:46-48`). Chapter 16 explains the loops and the arithmetic
behind the counts.

`gen/format.asm` and `gen/geom.asm` come from `format/format.json`, the one
definition of the card's container. That file gives the container's name,
`TECOSVOL`, the sizes of the header and of a volume descriptor and the offset
of each field in both. It also gives the limits on the number of volumes and
drives, and the two geometries with their disk parameter blocks. `gen/format.asm` turns the
offsets and limits into equates, such as `HCOUNT EQU 14` for the volume count's
offset in the header and `DMOUNT EQU 14` for the drive byte's offset in a
descriptor (`tools/build.mjs:80-114`). `gen/geom.asm` holds bytes, and it is
one of the two generated files in the data block (`src/rom.asm:14`). It has the
container's name as `FMTMAG` and the two disk parameter blocks, `DPB1` and
`DPB2`. Its table `GEOTAB` gives each geometry's id, its payload in blocks and
the address of its parameter block (`tools/build.mjs:115-135`).

`tools/lib/format.mjs` reads the same `format.json` for `tecvol` and the other
tools on the PC. So the ROM and the tools take the container's layout from one
file. The module's `geometryInfo` checks each geometry before either uses it.
A geometry must have 64 records a track, no reserved tracks and no check
vector, and its allocation vector must fit in 256 bytes. Its `EXM` and its
directory blocks must match the block size and the number of directory
entries (`tools/lib/format.mjs:9-41`). Chapter 17 describes the container and
Chapter 19 those fields of the parameter block.

`gen/font.asm`, the other generated file in the data block, holds the
console's 5×7 font as `FONT`. It is 8 bytes a character from `20h` to `7Fh`,
768 bytes in all, at `C179h–C478h`. The build writes it from `format/font5x7.txt`
through `tools/lib/font.mjs` (`tools/build.mjs:136-137`,
`tools/lib/font.mjs:9-44`). Both consoles draw from this one copy. The ROM's
PICO9918 console reads it by its label (`src/pico.asm:294`), and `GLCD.SVC`
calls service 15, which returns its address (`src/services.asm:572-577`,
`drivers/glcd.asm:63-69`).

## The two assemblies

The production build at TEC-OS `fe2097f` uses TAS on the PC. The same
backend assembles the main and diagnostic ROMs, `GLCD.SVC`, `MOUNT.COM` and
`DEMO.COM`. The earlier ATOM route remains available explicitly:

```sh
TECOS_ROM_ASSEMBLER=atom npm run build
```

That reference build needs no TAS host. The default is `tas`; an unknown
`TECOS_ROM_ASSEMBLER` value stops the build
(`tools/lib/tas-rom.mjs:120-124`, at `fe2097f`). The standalone ATOM examples
in Part I are separate from this production selection.

Before the default build, prepare the pinned applications with `npm ci` and
`npm run inputs`, and prepare the Thorium host as described in the source
repository's `README.md`, under “Build and test”. The host revision is
`3d16b30cb8ed7deccc0a8b0b04f1b961e29f5689`; the TAS executable is pinned to
`dbee66a90816df9a5884a08754ebc2d458a38325`. The preparation verifies the host's
runner, lock file and Z80 runtime, as well as TAS's bytes. Assembly then uses
local files without downloading them (`tools/lib/tas-rom.mjs:77-104`, at
`fe2097f`).

For `TAS.COM` and `TED.COM`, an explicit `TAS_COM` or `TED_COM` selects the
file first, then `.inputs/NAME`, then the legacy copy in
`../thorium/dist/NAME`. A selected file with the wrong size or hash stops the
operation; it does not fall through to another copy. An empty override also
stops it. `npm run inputs` prepares a pinned local copy when the legacy copy
is stale (`tools/lib/pins.mjs:10-48`, `tools/inputs.mjs:37-65`, at
`fe2097f`). The host is selected by
`TECOS_TAS_HOST`, or otherwise `.inputs/tas-host`.

The build still assembles the ROM twice to place its fixed workspace below
`BF00h`. It first assembles with `WSBASE` at `8000h`, reads the real end label
`BDOSRME`, and subtracts `8000h` to obtain the size. It then assembles with
`WSBASE` at `BF00h` less that size and checks the final placement
(`tools/build.mjs:234-249`, at `fe2097f`). TAS's output is converted to the
image and symbol data consumed by the build; the probe is not replaced by a
hard-coded workspace size.

This toolchain description is a source check at `fe2097f`. The image figures
and captured build output elsewhere in this chapter remain from `78127ec`;
they are not a new build transcript. A complete check against the eventual
accepted source revision is still required.

## The build's checks

Between the second assembly and the writing of the image, the build checks the
result against the rules the layout depends on. When a rule fails, the build
stops with `placement check failed:` and the rule's text
(`tools/build.mjs:218-220`). The rules are:

- The image is at most 16 KiB. ATOM checks that each emitted image starts
  at `C000h` or above. The TAS conversion validates the reserved RAM and
  ROM extents before extracting the ROM bytes
  (`tools/build.mjs:196-205`, `tools/lib/tas-d8.mjs:183-255`,
  `tools/build.mjs:249-252`).
- `RESET` is at `C000h` and the ROM table at `C003h`. The data block starts
  where the table ends, the table, the data and the code are in that order,
  and the code ends within the ROM (`tools/build.mjs:255-259`).
- The table holds `TNA` and the version 5.1, its jump is `JP SVCDSP`, and it
  is 8 bytes long. `SVCFMT` in `abi.inc` is the service format that the tools
  on the PC write. Every entry in the service table `SVTAB` is in the code,
  and the device bits in `abi.inc` are the `CD` bits of `layout.asm`
  (`tools/build.mjs:146-157`, `tools/build.mjs:260`).
- The offsets of the PICO console's table in `abi.inc` name the right entries
  in `PITPL`, the ROM's template that `PIBLK` is filled from, and the places a
  debugger reads lie at their offsets in `PIBLK` (`tools/build.mjs:159-176`,
  `tools/build.mjs:261`).
- Each service's source in `drivers/` and each `svc*.asm` in `test/programs/`
  reaches the ROM only through the names in `abi.inc`, and `drivers/glcd.asm`
  is among the files checked (`tools/build.mjs:178-190`,
  `tools/build.mjs:262`).
- The RAM BIOS table is at `BF00h`, and the fixed workspace ends exactly there.
  The state above the table starts 51 bytes after it, at `SDBYTE`, and all of
  it ends by `C000h` (`tools/build.mjs:263-266`).
- The BIOS stack ends at or below the start of the CCP's workspace
  (`tools/build.mjs:267`).
- On the starter card the TPA is at least 45,830 bytes
  (`tools/build.mjs:269-270`).

The last check works out the TPA without running the ROM. `cardLayout` follows
the arithmetic of cold boot's `ALVINIT`, which Chapter 14 describes. The
allocation vectors are packed down from `WSBASE`, and the BDOS entry jump goes
below them (`tools/build.mjs:228-232`). The starter card has two volumes, a G1M
whose last allocation block, `DSM`, is 511 and a G8M whose `DSM` is 2047. Their
vectors take 320 bytes and the entry is at `B9A4h`, which leaves 47,268 bytes
from `0100h`.

## One image for every board

When the checks pass, the build writes three files into `build/tecos/`:
`tecos.rom`, the image, `tecos.d8.json`, the symbol map in Debug80's D8
format, which `tools/capture.mjs` reads to find TEC-OS's labels, and
`census.json`, the figures for the ROM's parts, the RAM's regions and the
stacks (`tools/build.mjs:272-322`). When `dist/` exists, from an earlier `npm run
media`, the build copies the three files there too, as `tecos.rom`,
`tecos.d8.json` and `tecos.census.json`. A built `dist/` therefore holds the
same ROM as `build/tecos/` (`tools/build.mjs:325-339`). `npm run media` then builds the
starter card from it, as Chapter 27 describes.

The build has one profile, `tecos`, and stops with an error when it is given
any other name (`tools/build.mjs:29-32`, `tools/build.mjs:353`). One image
serves every TEC-1G because nothing that differs between boards is in the
image's layout. The PICO9918's console is in the ROM at each of its three
widths, 80 columns from reset and 40 or 32 through `CON`, and the graphics
LCD's console is a driver on the card. `npm run build` prints one line:

```text
tecos: ROM 16018/16384 bytes, TPA $0100-$B9A3 (47268 bytes), sha256 8cad40923ce1c3c6
```

The hash is the first 16 hexadecimal digits of the image's SHA-256
(`tools/build.mjs:355-359`). The whole of it, at 78127ec, is
`8cad40923ce1c3c6079d3201a1a8cc294dbe501838ed54505ca12287672f8b9f`, and every
address in the chapters that follow is that image's.
