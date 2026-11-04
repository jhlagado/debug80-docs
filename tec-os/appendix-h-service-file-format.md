---
title: H. The service file format
parent: TEC-OS
nav_order: 108
nav_group: "Appendices"
---

# Appendix H. The service file format

Checked against TEC-OS 621201d, with the starter card's `TAS.COM` from Thorium
dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

This appendix lists the `.SVC` file's format: the header's fields and the
loader's check of each, the dependencies and the relocation data, with
`GLCD.SVC` from the starter card as an example. Chapter 10 describes writing a
service, and Chapter 20 describes the load and the relocation.

## The file

A `.SVC` file has four parts, in this order:

| Part | Size | Contents |
| --- | --- | --- |
| Header | 25 bytes | The fields below |
| Image | The size at offset 6, less 25 | The service's code and data |
| Dependencies | 9 bytes for each, the count at offset 2 | The records the service needs |
| Relocation data | The size at offset 10 | The gap list |

The header and the image are one assembly made for page 0, with the header at
its start, so an address in the image counts from the header's first byte. The
loader moves the header and the image together to a page boundary and writes
its own fields over some of the header's, as Chapter 20's table shows. A file's
end is rounded up to a whole record of 128 bytes on the card, and the loader
reads nothing after the relocation data (`src/loader.asm:177-181`).

## The header

The loader names the fields at `src/loader.asm:18-32`.

| Offset | Bytes | Contents | The loader's check |
| ---: | ---: | --- | --- |
| 0 | 1 | The letter `D`, `44h` | With offset 1, the word `0444h` |
| 1 | 1 | The format, 4 | The same word |
| 2 | 1 | The number of dependencies | Each entry lies within the records read |
| 3 | 1 | Flags: bit 0, removable; bits 1 to 7, `RST 1` to `RST 7` claimed | A claimed vector holding a `JP` fails the load |
| 4 | 2 | `REMOVE`, from the header's start | From 25 to below the size at offset 6 |
| 6 | 2 | The size of the header and image | Within the records read |
| 8 | 2 | Extra memory after the image, not cleared | With the size, a page at `80h` or above |
| 10 | 2 | The size of the relocation data | Within the records read |
| 12 | 3 | Stack bytes added: BDOS, BIOS, CCP | Each within the room left |
| 15 | 2 | `INIT`, from the header's start | As `REMOVE` |
| 17 | 8 | The name, padded with spaces | None |

The loader compares the first two bytes, as a word, with `DMAGIC`, which is
`SVCFMT * 256 + 'D'` (`src/loader.asm:18`, `src/loader.asm:103-106`). `SVCFMT` is 4,
from `abi.inc`, and a file of any other format fails the load
(`src/abi.inc:103-105`). A source writes the byte by that name, as
`DB 'D',SVCFMT,0,1` with `abi.inc` included, which is how `GLCD.SVC` writes it
(`drivers/glcd.asm:17`). `makeSvc`
writes its own figure for the format over the source's byte
(`tools/lib/svc-format.mjs:3`, `tools/lib/svc.mjs:111`), and that figure is 4
as well.

The source writes the letter, the format, the flags, the extra memory, the stack
figures and the name, and it leaves the other fields 0. The tool that makes the
file, `TAS` on the card or `makeSvc` on a PC, writes the number of
dependencies, the two entry offsets and the two sizes
(`tools/lib/svc.mjs:111-120`).
The loader's checks of the entry offsets, the sizes and the page are at
`src/loader.asm:107-127`, `src/loader.asm:395-412`, and of the stack figures at
`src/loader.asm:155-171`.

## The dependencies

Each dependency is 9 bytes: the least version of the record, then its 8-byte
name, padded with spaces (`tools/lib/svc.mjs:106`). The entries follow the
image and are no part of it, so the loader relocates none of their bytes. It
looks each one up in the registry, and a name that isn't there, or is there at
a lower version, fails the load (`src/loader.asm:128-147`). `makeSvc` takes them
from its `deps` option and rejects a name of more than 8 bytes
(`tools/lib/svc.mjs:105`). `TAS` takes them from what follows a label named
`DEPS` in the source, as whole 9-byte entries in `DB`.

## The relocation data

The relocation data is a list of gaps, one byte each. Each fixup is a byte of
the image that holds the high byte of an address, and the loader adds the
service's page to it. The first gap counts from header byte 24, the byte before
the image, and each later gap from the previous fixup
(`tools/lib/svc.mjs:37-49`). A gap of 255 moves on 255 bytes with nothing fixed,
and the next byte carries on from there. A distance of 255 or more is therefore
written as bytes of 255 and then the rest:

| Fixups, as image bytes | Gap list |
| --- | --- |
| 2 and 9 | `3 7` |
| 600 | `255 255 91` |
| 509 | `255 255 0` |

Image byte 600 is 601 bytes from header byte 24, which is 255 and 255 and 91
more (`test/svc.test.mjs:335-337`). When the rest is 0, as for image byte 509,
the last byte for that fixup is a gap of 0, which fixes the byte the 255s
reached.

Every position the list reaches, a gap of 255 included, must lie inside the
header and image, below the size at offset 6, or the load fails
(`src/loader.asm:174-203`). A first gap of 0 fixes header byte 24, the name's last.
`makeSvc` never writes one, since every fixup it finds lies in the image. The
loader doesn't test for one, and Chapter 20 shows what such a list does.

The repository's encoders also write a bitmap and a list of 16-bit offsets, for
comparison (`tools/lib/svc.mjs:28-36`). `makeSvc` writes the gap list unless it
is asked for another, and the loader reads only the gap list
(`tools/lib/svc.mjs:83`).

## GLCD.SVC

`GLCD.SVC` on the starter card is the graphics LCD's driver. Its header and the
first part of its image, and then its relocation data from offset 767:

```sh
xxd -g 1 -l 48 dist/files/GLCD.SVC
xxd -g 1 -s 767 dist/files/GLCD.SVC
```

```text
00000000: 44 04 00 01 4e 00 ff 02 00 00 45 00 02 00 06 2b  D...N.....E....+
00000010: 00 47 4c 43 44 20 20 20 20 f2 00 4d 01 52 01 c9  .GLCD    ..M.R..
00000020: 00 a7 00 b6 00 00 00 15 08 00 00 0e 0f cd 08 c0  ................
000002ff: 02 02 02 02 02 02 0f 03 09 09 08 29 08 04 0a 03  ...........)....
0000030f: 03 07 03 03 09 04 0c 04 09 03 04 06 0d 13 08 04  ................
0000031f: 22 06 05 03 04 04 05 09 08 09 10 03 07 06 04 03  "...............
0000032f: 04 04 03 0a 08 0f 03 06 03 04 11 0a 07 0a 06 06  ................
0000033f: 18 05 17 07 05                                   .....
```

The header's fields are:

| Offset | Bytes | Field |
| ---: | --- | --- |
| 0 | `44 04` | `D` and format 4 |
| 2 | `00` | No dependencies |
| 3 | `01` | Removable, no restart vector claimed |
| 4 | `4e 00` | `REMOVE` at offset `004Eh` |
| 6 | `ff 02` | Header and image, `02FFh` or 767 bytes |
| 8 | `00 00` | No extra memory |
| 10 | `45 00` | Relocation data, `0045h` or 69 bytes |
| 12 | `02 00 06` | Stack bytes over the base: 2 on the BDOS's, none on the BIOS's, 6 on the CCP's |
| 15 | `2b 00` | `INIT` at offset `002Bh` |
| 17 | `47 4c 43 44 20 20 20 20` | The name, `GLCD` |

With no dependencies the relocation data starts at offset 767, `2FFh`, right
after the image. The image starts at offset 25, `19h`, with the table of words
the driver passes to the ROM's terminal through service 12: `00F2h`, `014Dh`,
`0152h` and so on, addresses in an image made for page 0. The list's first gap,
2, counts from offset 24 to offset 26, the high byte of `00F2h`, and each of the
next five 2s reaches the next word's high byte. The 69 bytes hold no 255, so
they mark 69 fixups, and the last is at file offset 563. The driver holds no
font: its `INIT` asks the ROM for the console's font through service 15 and
keeps the address (`drivers/glcd.asm:38-41`). A bitmap with a bit for each of
the 742 bytes of image would take 93 bytes.
