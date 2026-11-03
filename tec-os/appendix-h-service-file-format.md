---
title: H. The service file format
parent: TEC-OS
nav_order: 108
nav_group: "Appendices"
---

# Appendix H. The service file format

Checked against TEC-OS 7935507, with the starter card's `TAS.COM` from Thorium
dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

This appendix lists the `.SVC` file's format: the header's fields and the
loader's check of each, the dependencies and the relocation data, with
`PICO.SVC` from the starter card as an example. Chapter 10 describes writing a
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
reads nothing after the relocation data (`src/loader.asm:155-159`).

## The header

The loader names the fields at `src/loader.asm:11-24`.

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
`SVCFMT * 256 + 'D'` (`src/loader.asm:11`, `src/loader.asm:82-85`). `SVCFMT` is 4,
from `abi.inc`, and a file of any other format fails the load
(`src/abi.inc:96-98`). A source writes the byte by that name, as
`DB 'D',SVCFMT,0,1` with `abi.inc` included, which is how `PICO.SVC` and
`GLCD.SVC` write it (`drivers/pico.asm:27`, `drivers/glcd.asm:16`). `makeSvc`
writes its own figure for the format over the source's byte
(`tools/lib/svc-format.mjs:3`, `tools/lib/svc.mjs:117`), and that figure is 4
as well.

The source writes the letter, the format, the flags, the extra memory, the stack
figures and the name, and it leaves the other fields 0. The tool that makes the
file, `TAS` on the card or `makeSvc` on a PC, writes the number of
dependencies, the two entry offsets and the two sizes
(`tools/lib/svc.mjs:117-126`).
The loader's checks of the entry offsets, the sizes and the page are at
`src/loader.asm:86-106`, `src/loader.asm:345-360`, and of the stack figures at
`src/loader.asm:134-150`.

## The dependencies

Each dependency is 9 bytes: the least version of the record, then its 8-byte
name, padded with spaces (`tools/lib/svc.mjs:112`). The entries follow the
image and are no part of it, so the loader relocates none of their bytes. It
looks each one up in the registry, and a name that isn't there, or is there at
a lower version, fails the load (`src/loader.asm:107-126`). `makeSvc` takes them
from its `deps` option and rejects a name of more than 8 bytes
(`tools/lib/svc.mjs:111`). `TAS` takes them from what follows a label named
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
(`src/loader.asm:153-181`). A first gap of 0 fixes header byte 24, the name's last.
`makeSvc` never writes one, since every fixup it finds lies in the image. The
loader doesn't test for one, and Chapter 20 shows what such a list does.

The repository's encoders also write a bitmap and a list of 16-bit offsets, for
comparison (`tools/lib/svc.mjs:28-36`). `makeSvc` writes the gap list unless it
is asked for another, and the loader reads only the gap list
(`tools/lib/svc.mjs:89`).

## PICO.SVC

`PICO.SVC` on the starter card is the PICO9918's driver. Its header and the
first part of its image, and then its relocation data from offset 1,315:

```sh
xxd -g 1 -l 48 dist/files/PICO.SVC
xxd -g 1 -s 1315 dist/files/PICO.SVC
```

```text
00000000: 44 04 00 01 5f 00 23 05 00 00 40 00 00 00 00 43  D..._.#...@....C
00000010: 00 50 49 43 4f 20 20 20 20 87 01 92 01 9b 01 9c  .PICO    .......
00000020: 00 4d 01 76 01 78 00 50 18 e7 00 ef 00 fc 00 0a  .M.v.x.P........
00000523: 02 02 02 02 02 02 02 04 02 02 02 0d 13 09 03 22  ..............."
00000533: 04 04 03 06 05 07 03 0b 09 03 03 03 06 13 1a 04  ................
00000543: 0c 0e 14 09 16 08 08 06 04 03 03 04 06 03 03 0b  ................
00000553: 03 03 0a 03 07 03 0a 03 0e 03 07 04 05 05 11 06  ................
```

The header's fields are:

| Offset | Bytes | Field |
| ---: | --- | --- |
| 0 | `44 04` | `D` and format 4 |
| 2 | `00` | No dependencies |
| 3 | `01` | Removable, no restart vector claimed |
| 4 | `5f 00` | `REMOVE` at offset `005Fh` |
| 6 | `23 05` | Header and image, `0523h` or 1,315 bytes |
| 8 | `00 00` | No extra memory |
| 10 | `40 00` | Relocation data, `0040h` or 64 bytes |
| 12 | `00 00 00` | No stack bytes over the base |
| 15 | `43 00` | `INIT` at offset `0043h` |
| 17 | `50 49 43 4f 20 20 20 20` | The name, `PICO` |

With no dependencies the relocation data starts at offset 1,315, `523h`, right
after the image. The image starts at offset 25, `19h`, with the table of words
the driver passes to the ROM's terminal: `0187h`, `0192h`, `019Bh` and so on,
addresses in an image made for page 0. The list's first gap, 2, counts from
offset 24 to offset 26, the high byte of `0187h`, and each of the next six 2s
reaches the next word's high byte. The 64 bytes hold no 255, so they mark 64
fixups, and the last is at file offset 481. The driver's font comes last in the
image and holds no addresses (`drivers/pico.asm:379-380`). A bitmap with a bit
for each of the 1,290 bytes of image would take 162 bytes.
