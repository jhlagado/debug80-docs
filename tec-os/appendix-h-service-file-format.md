---
title: H. The service file format
parent: TEC-OS
nav_order: 108
nav_group: "Reference"
---

# Appendix H. The service file format

<!-- Mechanisms checked by source inspection at TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     The GLCD dump was reproduced at 621201d and retained in the 78127ec
     review without rerunning its commands. The GAPZERO transcript was
     rerun at 78127ec using COUNT.SVC prepared by makeSvc.
     The historical starter's TAS.COM identity is Thorium dbee66a, SHA-256
     45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     That identity does not identify GAPZERO's builder. No example was
     rerun for this draft. -->

A service file contains the bytes to install, the records it needs and the
positions that require relocation. Its on-disk header describes that work. The
loader overwrites some fields after using them so an installed header must be
read differently from the file header below.
[Write a resident service](13-write-a-resident-service.md) covers authoring.
[Loading and removing services](24-loading-and-removing-services.md) follows
installation and gives the resident header. This reference retains a historical
GLCD.SVC dump to show the file fields and gap encoding together.

## The file

A `.SVC` file has four parts, in this order:

| Part | Size | Contents |
| --- | --- | --- |
| Header | 25 bytes | The fields below |
| Image | The size at offset 6, less 25 | The service's code and data |
| Dependencies | 9 bytes for each, the count at offset 2 | The records the service needs |
| Relocation data | The size at offset 10 | The gap list |

The header and image are assembled together for page 0. Addresses in the
image therefore count from the header's first byte. The loader moves both
to a page boundary and adds that page number at each relocation position.
The card stores the file in whole 128-byte records. Its trailing padding
is outside the relocation data and is not processed as another gap
(`src/loader.asm:258-290`, `src/loader.asm:316-338`).

## The header

The loader's field definitions are at `src/loader.asm:26-48`. The final
column gives the check applied to each field. Any failed check rejects the
load. A name has no content check.

| Offset | Bytes | Contents | The loader's check |
| ---: | ---: | --- | --- |
| 0 | 1 | The letter `D`, `44h` | Offsets 0 and 1 together are the word `0444h` (`src/loader.asm:150-153`) |
| 1 | 1 | The format, 4 | See offset 0 |
| 2 | 1 | The number of dependencies | The entries, 9 bytes each after the image, end within the records read (`src/loader.asm:191-214`) |
| 3 | 1 | Flags: bit 0 removable. Bits 1 to 7 claim `RST 1` to `RST 7` | No claimed vector holds a `JP` already (`src/loader.asm:299-319`) |
| 4 | 2 | `REMOVE`, from the header's start | From 25 to below the size at offset 6 (`src/loader.asm:170-172`, `src/loader.asm:613-620`) |
| 6 | 2 | The size of the header and image | The header and image end within the records read (`src/loader.asm:157-160`, `src/loader.asm:595-603`) |
| 8 | 2 | Extra memory after the image, not cleared | The pages for the image and the extra memory start at a page from `80h` up and below the page containing the top of the transient program area (TPA) (`src/loader.asm:176-186`) |
| 10 | 2 | The size of the relocation data | The data ends within the records read (`src/loader.asm:216-220`) |
| 12 | 3 | Stack bytes added: BDOS, BIOS, CCP | Each is at most the room left on that stack, `SVCLIM`'s figure less what the services in have taken (`src/loader.asm:221-249`) |
| 15 | 2 | `INIT`, from the header's start | As `REMOVE` (`src/loader.asm:164-166`) |
| 17 | 8 | The name, padded with spaces | None |

The loader compares the first two bytes, as a word, with `DMAGIC`, which is
`SVCFMT * 256 + 'D'` (`src/loader.asm:26-28`). `SVCFMT` is 4, from `abi.inc`,
and a file of any other format fails the load (`src/abi.inc:226-231`).

The source supplies the service's name, flags, extra-memory request and
stack declarations. `TAS` on the card or `makeSvc` on the PC fills the
measured fields and routine offsets (`tools/lib/svc.mjs:122-131`):

| Field | Written by |
| --- | --- |
| The letter `D` | The source, as `DB 'D',SVCFMT,0,1` with `abi.inc` included (`drivers/glcd.asm:26-35`) |
| The format | The source. `makeSvc` overwrites it with 4. Pinned TAS preserves it |
| The number of dependencies | `makeSvc` writes the count. Pinned TAS writes it when `DEPS` exists |
| The flags | The source |
| `REMOVE` and `INIT` | The tool |
| The two sizes | The tool |
| The extra memory | The source |
| The stack bytes | The source |
| The name | The source |

Leave the measured sizes, dependency count and routine-offset fields zero in the
source. Supply `SVCFMT` in the format byte. `makeSvc` overwrites that byte with
its own format value (`tools/lib/svc-format.mjs:3`, `tools/lib/svc.mjs:122`).
TAS at Thorium `dbee66a` preserves it. That TAS writes the dependency count only
when the source has `DEPS` so the zero in a source without dependencies must
already be correct (`Thorium dbee66a:src/tas/DRV.ASM:92-120`,
`Thorium dbee66a:src/tas/DRV.ASM:252-258`).

## The dependencies

Each 9-byte dependency contains a minimum version followed by an 8-byte
name padded with spaces (`tools/lib/svc.mjs:117`). Dependencies follow the
image and are not relocated. For each entry the loader searches the
registry for that name at the requested version or later. An absent record
or one below the minimum version rejects the load
(`src/loader.asm:191-214`). `makeSvc` takes them from its `deps` option and rejects a name of more than 8 bytes
(`tools/lib/svc.mjs:116`). `TAS` takes them from what follows a label named
`DEPS` in the source, as whole 9-byte entries in `DB`.

## The relocation data

Relocation positions are encoded as one-byte gaps. At each fixup the loader adds
the service's base page to an address's high byte. The first gap starts at
header byte 24, immediately before the image. Each later gap starts at the
previous fixup (`tools/lib/svc.mjs:37-49`). A gap of 255 moves on 255 bytes with
nothing fixed and the next byte carries on from there. A distance of 255 or more
is therefore written as bytes of 255 and then the rest:

| Fixups, as image bytes | Gap list |
| --- | --- |
| 2 and 9 | `3 7` |
| 600 | `255 255 91` |
| 509 | `255 255 0` |

Image byte 600 is 601 bytes from header byte 24, which is 255 and 255 and 91
more (`test/svc.test.mjs:462-466`). When the rest is 0, as for image byte 509,
the last byte is a gap of 0. That fixes the byte the 255s reached.

Every position the list reaches, a gap of 255 included, must lie below the
size at offset 6, inside the header and image. Otherwise the load fails
(`src/loader.asm:258-290`). The loader doesn't test for a first gap of 0,
which fixes header byte 24, the name's last. `makeSvc` never writes one, since
every fixup it finds lies in the image. The example below shows what such a
list does.

The repository also has bitmap and 16-bit-offset encoders for comparison
(`tools/lib/svc.mjs:28-36`). `makeSvc` writes the gap list unless its options
name another. The loader reads only the gap list
(`tools/lib/svc.mjs:83`).

### A first gap of 0

This historical example uses `COUNT.SVC` from Chapter 13's PC `makeSvc`
route. It inserts a zero at the front of the gap list and raises the size
at offset 10 by one:

```sh
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const f = readFileSync("COUNT.SVC");
const out = Buffer.concat([f.subarray(0, 100), Buffer.from([0]), f.subarray(100)]);
out[10] += 1;
writeFileSync("GAPZERO.SVC", out);
'
node tools/tecvol.mjs put svc.img B GAPZERO.SVC
```

<!-- node tools/capture.mjs --card svc.img B: GAPZERO.SVC SERVICES -->
```text
A>B:
B>GAPZERO.SVC

B>SERVICES
COUNTX 1
B>
```

In this historical run the service loaded at page `B8h`. The inserted zero gap
changed header byte 24 from a space, `20h`, to `D8h`. `PUTTRIM` masks bit 7
(`src/cpm/ccpfile.asm:464-470`) so the name prints with an `X`.

## GLCD.SVC

This dump was reproduced from the starter card's graphics LCD driver at
`621201d`. The first command prints its header and initial image bytes. The second
starts at its relocation data, offset 767.

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

The dump has no dependencies so its relocation data follows the image
immediately at offset 767, `2FFh`. The image begins at offset 25, `19h`, with
the table of words the driver passes through service 12. Its entries include
`00F2h`, `014Dh` and `0152h`, assembled for page 0.

The first gap, 2, advances from offset 24 to 26, the high byte of `00F2h`. Each
of the next five 2s reaches the next word's high byte. None of the 69 gaps is
255 so all 69 mark fixups. The last reaches file offset 563. A bitmap with one
bit for each of the 742 image bytes would take 93 bytes.

The driver contains no font. Its `INIT` obtains the ROM font address through
service 15 and stores it for drawing (`drivers/glcd.asm:60-64`).
