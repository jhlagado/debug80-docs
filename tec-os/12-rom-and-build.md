---
title: The ROM and its build
parent: TEC-OS
nav_order: 12
nav_group: "Part II: Inside TEC-OS"
---

# 12. The ROM and its build

Checked against TEC-OS 98c6416.

TEC-OS is one 16 KiB image for the addresses `C000h–FFFFh`. This chapter
describes the image's layout, from the jump at its first byte to the free
space at its end. It then follows the build that makes the image: the source
files and their order, the include files the build generates and the two
assemblies that place the workspace. The chapter ends with the checks on the
result and the four names of the one image.

## The image from C000h

The ROM has five parts, in this order:

| Addresses | Bytes | Part |
| --- | ---: | --- |
| `C000h–C002h` | 3 | the reset jump |
| `C003h–C017h` | 21 | the table |
| `C018h–C33Ch` | 805 | the data |
| `C33Dh–F8CCh` | 13,712 | the code |
| `F8CDh–FFFFh` | 1,843 | free |

The figures are those of the build at commit 98c6416. The build writes them to
`build/debug80/census.json` and, through `npm run media`, to the ROM table
in `docs/memory-map.md`. The used part, from `C000h` to the end of the code,
is 14,541 of the 16,384 bytes.

The first three bytes are a jump, `JP COLD` (`src/reset.asm:6`), to `C33Dh`,
the first byte of the code. Chapter 14 describes how the Z80 reaches it at
reset.

The table at `C003h` is the fixed interface for programs and drivers
(`src/abi.asm:7-21`). It starts with the signature `TNA` and the ABI's major
and minor version, 4 and 0. Next comes a word, `0048h`, that points at the
console's columns and rows in page zero. After it are a jump to the hardware
services at `C00Ah` and a word at `C00Dh` that points at the count of MAIN
regions. Three more jumps follow: the mount service at `C00Fh`, the video
drivers' hook at `C012h` and the driver registry at `C015h`. Chapter 9
describes the table from a program's side and Chapter 20 the services behind
it. The table ends at `C018h`, where the data begins.

The data block runs from the label `ROMDATA` (`src/data.asm:6`) to `ROMCODE`
(`src/data3.asm:114`). Four files that follow one another in the assembly make
it up: `data.asm`, `data2.asm`, the generated `gen/geom.asm` and `data3.asm`.
They hold the messages, the keyword strings, the keyboard's tables, the
container's name and disk parameters, the BDOS's function table and the
hardware services' table. Each group is headed by the name of the source file
whose code uses it, so `CWMSG`, the text `Write lost`, sits under `cache.asm`
(`src/data3.asm:108-109`). Apart from the `RET` at `C01Dh`, described below,
nothing in the block runs where it is. The BIOS jump table `BIOSBAS`
(`src/data.asm:20-36`) is in the block as the source of the copy that programs
and the BDOS call, which Chapter 15 describes.

The `RET` at `C01Dh` (`src/data.asm:13`) is there for programs from the
previous ABI. ABI 3 had its mount service at `C01Dh`, and a card from that
time can hold a `MOUNT.COM` or `VOLS.COM` that calls `C01Dh` without testing
the table. The `RET` sends such a call straight back with nothing done
(`src/data.asm:8-10`). The five bytes between the table's end and that address
are the first of the block, the CCP's keyword `TYPE` and its zero
(`src/data.asm:11-12`).

The code starts at `COLD` and runs through every routine of TEC-OS. It ends at
the label `CODEEND`, which `src/end.asm:2` defines after the last file. The
free space is the rest of the ROM, in one gap, and the build fills it with
`FFh` (`tools/build.mjs:256-259`).

## The source files and their order

The layout above follows from the order of the source files. The ROM's source
is in `src/`, and its top file, `src/rom.asm`, holds only includes, which are
assembled in the order they are listed (`src/rom.asm:1-3`):

```asm
%INCLUDE "gen/config.asm"
%INCLUDE "gen/format.asm"
%INCLUDE "layout.asm"
%INCLUDE "ram.asm"
%INCLUDE "reset.asm"
%INCLUDE "abi.asm"
%INCLUDE "data.asm"
%INCLUDE "data2.asm"
%INCLUDE "gen/geom.asm"
%INCLUDE "data3.asm"
%INCLUDE "boot.asm"
```

The list goes on through `bios.asm`, `console.asm`, `term.asm`, `video.asm`,
`tms.asm`, `lcd.asm`, `sd.asm`, `vol.asm`, `diag.asm`, `cpm/ccp.asm`,
`cpm/bdos.asm`, `hwsvc.asm`, `xmove.asm`, `glcd.asm`, `cache.asm`,
`history.asm`, `prl.asm` and `drv.asm`, and ends with `end.asm`
(`src/rom.asm:4-33`).

The first four files emit no bytes. `gen/config.asm` and `gen/format.asm` are
equates. So is `layout.asm`, which names the ports, the system latch's values,
TEC-OS's bytes in page zero and the fixed addresses in RAM
(`src/layout.asm:8-95`). `ram.asm` names the resident workspace. It sets the
origin to `WSBASE` and reserves each variable with `DS`, which defines a label
and moves the address on without emitting anything (`src/ram.asm:6`,
`src/ram.asm:9-186`). A second origin, at `RAMBIOS+BIOSLEN`, places the state
that sits above the RAM BIOS table (`src/ram.asm:188-237`). Chapter 13
describes that memory. Bytes start with `reset.asm` and its `ORG $C000`
(`src/reset.asm:5`), and from there each file's bytes follow the last's.

The table follows the reset jump because `abi.asm` follows `reset.asm`. The
data follows the table because the four data files come next, and the code
follows the data because every file after `data3.asm` is code. So a code
file's routines are in the code block. Its strings and tables are in the data
block, under a heading with the file's name.

## The generated files

Before it assembles, the build writes three files into `src/gen/`. Each is
headed with a line saying it is generated and not to be edited
(`tools/build.mjs:63-139`).

`gen/config.asm` holds the settings that depend on the build. `WSBASE` is the
first byte of the resident workspace, which the build places as the next
section describes. `VERHI`, `VERLO` and `ROMVER` are the version, 0.1, which
the banner and the LCD's top row print from (`src/data.asm:17`,
`src/data2.asm:8`). The last five, `TXDLY`, `TXSTOP`, `RXDLY`, `RXHALF` and
`RXPOLL`, are the delay counts for the bit-banged serial port. The build works
them out from the CPU's clock, 4,000,000 Hz, the baud rate, 4800, and the
T-states of the loops in `console.asm` (`tools/build.mjs:24-25`,
`tools/build.mjs:40-61`). At 98c6416 they are 49, 105, 50, 74 and 77. The
build stops with an error if a count would not fit in a byte. Chapter 15
explains the loops and the arithmetic behind the counts.

`gen/format.asm` and `gen/geom.asm` come from `format/format.json`, the one
definition of the card's container. That file gives the container's name,
`TECOSVOL`, the sizes of the header and of a volume descriptor, and the offset
of each field in both. It also gives the limits on the number of volumes and
drives, and the two geometries with their disk parameter blocks.

`gen/format.asm` turns the field offsets and limits into equates, such as
`HCOUNT EQU 14` for the volume count's offset in the header and `DMOUNT EQU 14`
for the drive byte's offset in a descriptor (`tools/build.mjs:82-116`).
`gen/geom.asm` holds bytes, and it is the one generated file included in the
data block. It has the container's name as `FMTMAG` and the two disk parameter
blocks, `DPB1` and `DPB2`. Its table `GEOTAB` gives each geometry's id, its
payload in blocks and the address of its disk parameter block
(`tools/build.mjs:117-137`).

`tools/lib/format.mjs` reads the same `format.json`, and `tecvol` and the other
tools on the PC use that module. The ROM and the tools therefore take the
container's layout from one file. `geometryInfo` in the module checks each
geometry before either uses it. A geometry must have 64 records a track, no
reserved tracks and no check vector. Its allocation vector must be at most 256
bytes. Its `EXM` and directory blocks must match the block size and the number
of directory entries (`tools/lib/format.mjs:9-41`). Chapter 18 describes the
container.

## ATOM and the two assemblies

The assembler is ATOM, the npm package `atom-z80` at version 0.3.7.
`npm run build` runs `tools/build.mjs`, which calls ATOM as a library. It calls
`assembleAtomProject` with `src/` as the root and `rom.asm` as the entry, then
`writeAtomD8` for the symbol map (`tools/build.mjs:208-214`).

The build assembles the ROM twice, because the workspace's position depends on
its size. The workspace runs up to the RAM BIOS table at `BF00h`, which has a
fixed address. Its first byte, `WSBASE`, is therefore `BF00h` less the
workspace's size, and the size is known only after an assembly. The first
assembly is a probe, with `WSBASE` set to `8000h`. The build reads the address
of `BDOSRME`, the label at the workspace's end, and takes `8000h` from it
(`tools/build.mjs:244-248`). At 98c6416 the workspace is 1,448 bytes, so the
second assembly has `WSBASE` at `B958h` (`tools/build.mjs:249-251`).

The second assembly's output is the ROM. `materializeAtomGeneration` turns it
into bytes from `C000h`, filling every gap with `FFh`. The build copies them
into a 16,384-byte array that is `FFh` everywhere else
(`tools/build.mjs:256-259`).

A separate module, `tools/lib/assemble.mjs`, assembles stand-alone programs
with the same assembler, at `0100h` for a `.COM` file
(`tools/lib/assemble.mjs:10-20`). `npm run media` uses it to build the starter
card's programs, and the ROM's build does not.

## The build's checks

Between the second assembly and writing the image, the build checks the result
against the rules the layout depends on. When a rule fails, the build stops
with `placement check failed:` and the rule's text
(`tools/build.mjs:222-224`). The checks are:

- Every byte the assembly emitted is at `C000h` or above, so that no part of
  the source puts bytes in RAM, and the image is at most 16 KiB
  (`tools/build.mjs:253-257`).
- `RESET` is at `C000h` and the table at `C003h`. The data block starts where
  the table ends, and the `RET` at `C01Dh` is a `C9h`
  (`tools/build.mjs:262-265`).
- The table, the data and the code are in that order, and the code ends
  within the ROM (`tools/build.mjs:266-267`).
- Every address in `src/abi.inc`, the include file that programs and drivers
  assemble with, equals the address of the matching label in `abi.asm`. Every
  label there has an entry (`tools/build.mjs:145-151`, `tools/build.mjs:268`).
- The hardware services' numbers and status codes in `abi.inc` are the ones
  in `hwsvc.asm`, and their bits match the `CD` bits of `layout.asm`
  (`tools/build.mjs:155-165`).
- The PICO driver's table offsets in `abi.inc` name the right entries in each
  width of `PICO.DRV`, which the check builds (`tools/build.mjs:169-181`).
- `drivers/font.asm` is the font that
  `format/font5x7.txt` gives (`tools/build.mjs:185-187`).
- No `.asm` file in `src`, `drivers`, `diag` or `test/programs` names an
  address from `FF00h` to `FF27h`,
  where an older table was (`tools/build.mjs:190-197`).
- Each driver's source reaches the ROM only through the
  names in `abi.inc` (`tools/build.mjs:200-206`).
- The RAM BIOS table is at `BF00h`, and the workspace ends exactly there. The
  state above the table starts 51 bytes after it, at `SDBYTE`, and all of it
  ends by `C000h` (`tools/build.mjs:274-277`).
- The BIOS stack ends at or below the start of the
  CCP's workspace (`tools/build.mjs:278`).
- On the starter card the TPA is at
  least 45,830 bytes (`tools/build.mjs:280-281`).

The last check works out the TPA without running the ROM. `cardLayout` follows
the arithmetic of cold boot's `ALVINIT`, which Chapter 13 describes: the
allocation vectors packed down from `WSBASE`, and the BDOS entry jump below
them (`tools/build.mjs:232-236`). The starter card has two volumes, a G1M
with `DSM` 511 and a G8M with `DSM` 2047. Their vectors take 320 bytes and the
entry is at `B806h`, which leaves 46,854 bytes from `0100h`.

## One image, four names

When the checks pass, the build writes three files into `build/<profile>/`.
`tecos.rom` is the image. `tecos.d8.json` is the symbol map in Debug80's D8
format, which `book/capture.mjs` reads to find TEC-OS's labels. `census.json`
holds the figures for the ROM's parts, the RAM's regions and the stacks
(`tools/build.mjs:283-331`).

The PICO9918's width is set by the driver loaded at startup (Chapter 5), so
every board takes the same image. The build's four profile names, `debug80`,
`debug80t40`, `debug80g32` and `board`, all name that image
(`tools/build.mjs:28-35`). The build assembles the first profile and copies its
image and map to the other three. Only the name and the description change in
each census (`tools/build.mjs:335-349`). `npm run build` prints one line for
each:

```text
debug80: ROM 14541/16384 bytes, TPA $0100-$B805 (46854 bytes), sha256 59f01f21287f0d9b
debug80t40: ROM 14541/16384 bytes, TPA $0100-$B805 (46854 bytes), sha256 59f01f21287f0d9b
debug80g32: ROM 14541/16384 bytes, TPA $0100-$B805 (46854 bytes), sha256 59f01f21287f0d9b
board: ROM 14541/16384 bytes, TPA $0100-$B805 (46854 bytes), sha256 59f01f21287f0d9b
```

The hash is the first 16 hexadecimal digits of the image's SHA-256. `npm run
media` then copies each profile's three files to `dist/` as
`tecos-<profile>.rom`, `tecos-<profile>.d8.json` and
`tecos-<profile>.census.json` (`tools/media.mjs:183-188`). It also writes
`docs/memory-map.md` from the `debug80` census. The four ROM files in `dist/`
have the same SHA-256,
`59f01f21287f0d9b1b6dd30b3fbe8df5f1971a14b9bb033715c90bd592d95932`. The names
are kept so that anything that reads a ROM by its profile's name still has a
file to read.
