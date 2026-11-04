---
title: The ROM and its build
parent: TEC-OS
nav_order: 12
nav_group: "Part II: Inside TEC-OS"
---

# 12. The ROM and its build

Checked against TEC-OS 5a25178.

TEC-OS is one 16 KiB image for the addresses `C000h–FFFFh`. This chapter
describes the image's layout, from the jump at its first byte to the free
space at its end. It then follows the build that makes the image: the source
files and their order, the include files the build generates and the two
assemblies that place the workspace. The chapter ends with the checks on the
result and the files the build writes.

## The image from C000h

The ROM has five parts, in this order:

| Addresses | Bytes | Part |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump |
| `C003h–C00Ah` | 8 | the ROM table |
| `C00Bh–C346h` | 828 | the data |
| `C347h–F85Ch` | 13,590 | the code |
| `F85Dh–FFFFh` | 1,955 | free |

The figures are those of the build at commit 5a25178. The build writes them to
`build/tecos/census.json` and, through `npm run media`, to the table of the
ROM's regions in `docs/memory-map.md`. The used part, from `C000h` to the end
of the code, is 14,429 of the 16,384 bytes.

The first three bytes are a jump, `JP RSTENT` (`src/reset.asm:7`), to `C347h`,
the first byte of the code. Chapter 14 describes how the Z80 reaches it at
reset.

The ROM table at `C003h` is the fixed interface for programs and services
(`src/abi.asm:7-10`). It is 8 bytes long. It starts with the signature `TNA`
and the ABI's major and minor version, 5 and 0. At `C008h` is its one jump, to
`SVCDSP`, the dispatcher of the numbered services. Chapter 9 describes the
table from a program's side and Chapter 20 the services behind it. The table
ends at `C00Bh`, where the data begins.

The data block runs from the label `ROMDATA` (`src/tables.asm:7`) to `ROMCODE`
(`src/text.asm:69`). Three files that follow one another in the assembly make
it up: `tables.asm`, the generated `gen/geom.asm` and `text.asm`
(`src/rom.asm:11-14`). They hold the messages, the table of the built-in
commands' words and their handlers, the keyboard's tables, the container's name
and disk parameters, the BDOS's function table and the table of the numbered
services (`src/tables.asm:29-31`, `src/tables.asm:40-60`, `src/tables.asm:65`,
`src/tables.asm:77`). Each group is headed by the name of the source file
whose code uses it, so `CWMSG`, the text `Write lost`, sits under `cache.asm`
(`src/text.asm:66-67`). Nothing in the block runs where it is. The BIOS jump table `BIOSBAS`
(`src/tables.asm:10-26`) is in the block as the source of the copy that programs
and the BDOS call, which Chapter 15 describes.

The code starts at `RSTENT` (`src/boot.asm:17`) and runs through every routine of TEC-OS to the label
`CODEEND`, which `src/end.asm:2` defines after the last file. The free space is
the rest of the ROM, in one gap, and the build fills it with
`FFh` (`tools/build.mjs:239-242`).

## The source files and their order

The layout above follows from the order of the source files. The ROM's source
is in `src/`, and its top file, `src/rom.asm`, holds only includes, which are
assembled in the order they are listed (`src/rom.asm:1-3`):

```asm
%INCLUDE "abi.inc"
%INCLUDE "gen/config.asm"
%INCLUDE "gen/format.asm"
%INCLUDE "layout.asm"
%INCLUDE "ram.asm"
%INCLUDE "reset.asm"
%INCLUDE "abi.asm"
%INCLUDE "tables.asm"
%INCLUDE "gen/geom.asm"
%INCLUDE "text.asm"
%INCLUDE "boot.asm"
```

The list goes on through `bios.asm`, `console.asm`, `keyboard.asm`, `term.asm`,
`video.asm`, `tms.asm`, `lcd.asm`, `sd.asm`, `vol.asm`, `cpm/ccp.asm`,
`cpm/bdos.asm`, `services.asm`, `cache.asm`, `history.asm` and `loader.asm`,
and ends with `end.asm` (`src/rom.asm:16-32`).

The first five files emit no bytes. `abi.inc`, `gen/config.asm` and
`gen/format.asm` are equates. So is `layout.asm`, which names the ports, the
system latch's values, TEC-OS's bytes in page zero and the fixed addresses in
RAM (`src/layout.asm:8-84`). `abi.inc` is the file that programs and services
assemble with, so the ROM takes the table's addresses and the services' numbers
from the same equates as a program does (`src/rom.asm:4`). `ram.asm` names the resident workspace: it sets the
origin to `WSBASE` and reserves each variable with `DS`, which defines a label
and moves the address on without emitting anything (`src/ram.asm:6`,
`src/ram.asm:9-195`). A second origin, at `RAMBIOS+BIOSLEN`, places the state
that sits above the RAM BIOS table (`src/ram.asm:197-272`). Chapter 13
describes that memory. Bytes start with `reset.asm` and its `ORG $C000`
(`src/reset.asm:6`), and from there each file's bytes follow the last's.

The table follows the reset jump because `abi.asm` follows `reset.asm`. The
data follows the table because the three data files come next, and the code
follows the data because every file after `text.asm` is code. So a code
file's routines are in the code block, and its strings and tables are in the
data block, under a heading with the file's name (`src/rom.asm:9-15`,
`src/text.asm:66`).

## The generated files

The source needs settings that depend on the build, and a container layout it
shares with the tools on the PC. So before assembling, the build writes three
files into `src/gen/`, each headed with a line saying it is generated and not
to be edited (`tools/build.mjs:60-138`).

`gen/config.asm` holds the settings that depend on the build. `WSBASE` is the
first byte of the resident workspace, which the build places as the next
section describes. `VERHI`, `VERLO` and `ROMVER` are the version, 0.1, which
the banner and the LCD's top row print from (`src/text.asm:6`,
`src/text.asm:53`). The last five, `TXDLY`, `TXSTOP`, `RXDLY`, `RXHALF` and
`RXPOLL`, are the delay counts for the bit-banged serial port. The build works
them out from the CPU's clock, 4,000,000 Hz, the baud rate, 4800, and the
T-states of the loops in `console.asm` (`tools/build.mjs:24-25`,
`tools/build.mjs:36-58`). At 5a25178 they are 49, 105, 50, 70 and 77, and the
build stops with an error if a count would not fit in a byte
(`tools/build.mjs:45-47`). Chapter 15 explains the loops and the arithmetic
behind the counts.

`gen/format.asm` and `gen/geom.asm` come from `format/format.json`, the one
definition of the card's container. That file gives the container's name,
`TECOSVOL`, the sizes of the header and of a volume descriptor, and the offset
of each field in both. It also gives the limits on the number of volumes and
drives, and the two geometries with their disk parameter blocks.

`gen/format.asm` turns the field offsets and limits into equates, such as
`HCOUNT EQU 14` for the volume count's offset in the header and `DMOUNT EQU 14`
for the drive byte's offset in a descriptor (`tools/build.mjs:79-113`).
`gen/geom.asm` holds bytes, and it is the one generated file included in the
data block (`src/rom.asm:12`). It has the container's name as `FMTMAG` and the two disk parameter
blocks, `DPB1` and `DPB2`. Its table `GEOTAB` gives each geometry's id, its
payload in blocks and the address of its disk parameter block
(`tools/build.mjs:114-134`).

`tools/lib/format.mjs` reads the same `format.json`, and `tecvol` and the other
tools on the PC use that module, so the ROM and the tools take the container's
layout from one file. `geometryInfo` in the module checks each
geometry before either uses it. A geometry must have 64 records a track, no
reserved tracks and no check vector. Its allocation vector must be at most 256
bytes. Its `EXM` and directory blocks must match the block size and the number
of directory entries (`tools/lib/format.mjs:9-41`). Chapter 16 describes those
fields, and Chapter 18 the container.

## ATOM and the two assemblies

The ROM is assembled on the PC by ATOM, the npm package `atom-z80` at version
0.3.7.
`npm run build` runs `tools/build.mjs`, which calls ATOM as a library: first
`assembleAtomProject` with `src/` as the root and `rom.asm` as the entry, then
`writeAtomD8` for the symbol map (`tools/build.mjs:191-197`).

The build assembles the ROM twice, because the workspace's position depends on
its size. The fixed workspace, the part below the RAM BIOS table, runs up to
the table at `BF00h`, which has a fixed address. Its first byte, `WSBASE`, is
therefore `BF00h` less the workspace's size, and the size is known only after
an assembly. The first assembly is a probe, with `WSBASE` set to `8000h`. The
build reads the address of `BDOSRME`, the label at the workspace's end, and
takes `8000h` from it (`tools/build.mjs:227-231`). At 5a25178 that part is
970 bytes, so the second assembly has `WSBASE` at `BB36h`
(`tools/build.mjs:232-234`).

The second assembly's output is the ROM. `materializeAtomGeneration` turns it
into bytes from `C000h`, filling every gap with `FFh`, and the build copies
them into a 16,384-byte array that is `FFh` everywhere else
(`tools/build.mjs:239-242`).

A separate module, `tools/lib/assemble.mjs`, assembles stand-alone programs
with the same assembler, at `0100h` for a `.COM` file
(`tools/lib/assemble.mjs:10-20`). `npm run media` uses it to build the starter
card's `MOUNT.COM` and, through `makeSvc`, its two drivers
(`tools/lib/svc.mjs:100`), and the web page's `DEMO.COM`
(`tools/media.mjs:228`). `npm run media` also copies `programs/SAMPLE.ASM` to the card as a
CP/M text file, with CR LF line ends and a `^Z` at the end
(`tools/media.mjs:198-201`). The ROM's build does not use the module. The card's `TAS.COM` and
`TED.COM` are built outside this repository, and the media step takes each
from its pinned build and refuses one whose SHA-256 differs
(`tools/media.mjs:28-37`, `tools/media.mjs:174-175`, `tools/media.mjs:196-197`,
`tools/media.mjs:202-203`).

## The build's checks

Between the second assembly and writing the image, the build checks the result
against the rules the layout depends on. When a rule fails, the build stops
with `placement check failed:` and the rule's text
(`tools/build.mjs:205-207`). The checks are:

- Every byte the assembly emitted is at `C000h` or above, so that no part of
  the source puts bytes in RAM, and the image is at most 16 KiB
  (`tools/build.mjs:236-240`).
- `RESET` is at `C000h` and the ROM table at `C003h`. The data block starts where
  the table ends (`tools/build.mjs:245-247`).
- The table, the data and the code are in that order, and the code ends
  within the ROM (`tools/build.mjs:248-249`).
- The table holds `TNA` and the version 5.0, its jump is `JP SVCDSP`, and it is
  8 bytes long. `SVCFMT` in `abi.inc` is the service format that the tools on
  the PC write. Every entry in the service table `SVTAB` is in the code, and the
  device bits in `abi.inc` are the `CD` bits of `layout.asm`
  (`tools/build.mjs:145-156`, `tools/build.mjs:250`).
- The PICO driver's table offsets in `abi.inc` name the right entries in each
  width of `PICO.SVC`, which the check builds (`tools/build.mjs:158-175`).
- `drivers/font.asm` is the font that
  `format/font5x7.txt` gives (`tools/build.mjs:176-176`).
- Each service's source reaches the ROM only through the
  names in `abi.inc` (`tools/build.mjs:178-189`).
- The RAM BIOS table is at `BF00h`, and the fixed workspace ends exactly there. The
  state above the table starts 51 bytes after it, at `SDBYTE`, and all of it
  ends by `C000h` (`tools/build.mjs:253-256`).
- The BIOS stack ends at or below the start of the
  CCP's workspace (`tools/build.mjs:257`).
- On the starter card the TPA is at
  least 45,830 bytes (`tools/build.mjs:259-260`).

The last check works out the TPA without running the ROM. `cardLayout` follows
the arithmetic of cold boot's `ALVINIT`, which Chapter 13 describes: the
allocation vectors packed down from `WSBASE`, and the BDOS entry jump below
them (`tools/build.mjs:215-219`). The starter card has two volumes, a G1M
whose last allocation block, `DSM`, is 511 and a G8M whose `DSM` is 2047. Their
vectors take 320 bytes and the entry is at `B9F3h`, which leaves 47,347 bytes
from `0100h`.

## One image

When the checks pass, the build writes three files into `build/tecos/`.
`tecos.rom` is the image. `tecos.d8.json` is the symbol map in Debug80's D8
format, which `tools/capture.mjs` reads to find TEC-OS's labels. `census.json`
holds the figures for the ROM's parts, the RAM's regions and the stacks
(`tools/build.mjs:262-310`).

The PICO9918's width is set by the driver loaded at startup (Chapter 5), so
every board takes the same image. The build has one profile, `tecos`, and stops
with an error when it is given any other name (`tools/build.mjs:28-31`,
`tools/build.mjs:321`). `npm run build` prints one line:

```text
tecos: ROM 14429/16384 bytes, TPA $0100-$B9F2 (47347 bytes), sha256 3bcf5d24c78445fd
```

The hash is the first 16 hexadecimal digits of the image's SHA-256. `npm run
media` then copies the three files to `dist/` as `tecos.rom`, `tecos.d8.json`
and `tecos.census.json` (`tools/media.mjs:179-185`). It builds the starter card
(`tools/media.mjs:224-225`) and writes `docs/memory-map.md` from the census
(`tools/media.mjs:241`), and
prints a line of its own:

```text
dist: 1 ROM profiles, 7 starter files, starter.img
```

The ROM in `dist/` has the SHA-256
`3bcf5d24c78445fdf965c85c42447cae9192c4dd2818d2d116bbbab775564e4f`.
