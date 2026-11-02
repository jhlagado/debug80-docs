---
title: PRL relocation
parent: TEC-OS
nav_order: 21
nav_group: "Part II: Inside TEC-OS"
---

# 21. PRL relocation

Checked against TEC-OS 718c01b.

A `.COM` file holds code assembled for one address, `0100h`, and runs only
there. Code that is to run at an address chosen at load time has to carry a list
of the bytes that hold addresses, so that the loader can change them. TEC-OS
reads two files of that kind. A `.PRL` file is in Digital Research's page
relocatable format, and the CCP runs it as a program at `0100h`. A `.SVC` file is
in TEC-OS's own, and the service loader places it in whole pages below the BDOS.
This chapter follows a `.PRL` file from the tool that makes it to the jump to
`0100h`, and then a `.SVC` file's relocation data from the tool to the bytes in
memory. Chapter 10 describes both files from a programmer's side, and Chapter 20
the rest of a service's load.

## Relocation by pages

Both formats move code by whole pages of 256 bytes. When code assembled for one
page is placed some number of pages higher, the low byte of every address in it
stays the same and the high byte rises by that number. A loader therefore needs
only the positions of the high bytes of addresses, and it adds the same number
to each.

The tools in the repository find those bytes by assembling the source twice.
`assembleAt` in `tools/lib/prl.mjs:12` assembles a copy of the source with its
`ORG $0100` line changed to another origin, and `makePrl` and `makeSvc` both
assemble at `0000h` and at `0100h`. A byte that is the same in the two
assemblies is left alone, because it is no part of an address of the program's
own, or it is the low byte of one, which a move by whole pages doesn't change. A
byte that is one greater in the second assembly is the high byte of an address.
Any other difference is an error, reported as `byte N is not relocatable`
(`tools/lib/prl.mjs:35`, `tools/lib/svc.mjs:75`). Such a difference comes from
an expression the page rule can't relocate, such as half an address or twice
one, which differ between the two assemblies by something other than one.

An absolute address outside the program, such as `0005h`, is the same in both
assemblies and is never marked, so a program's `CALL 0005h` stays a call to the
BDOS wherever the code is put.

## The PRL file

`makePrl` in `tools/lib/prl.mjs:27` writes a PRL file in three parts:

- a header of 256 bytes, all zero except the code's length `n` as a word at
  offset 1 (`tools/lib/prl.mjs:39`);
- the `n` bytes of code assembled for `0100h` (`tools/lib/prl.mjs:40`);
- a bitmap of `n / 8` bytes, rounded up, with one bit for each byte of code,
  the most significant bit of each byte first, set for each byte that is the
  high byte of an address (`tools/lib/prl.mjs:32-37`).

The test program `test/programs/say.asm` is a small example that prints `PRL`
through BDOS function 9 and returns:

```asm
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,MSG
        LD      C,9
        CALL    BDOS
        RET
MSG:    DB      "PRL$"
```

From a clone of the repository with `npm run build` done, one Node.js command
makes its PRL file, and `od` shows it:

```sh
node --input-type=module -e '
import { writeFileSync } from "node:fs";
import { makePrl } from "./tools/lib/prl.mjs";
writeFileSync("build/SAY.PRL", await makePrl("test/programs/say.asm", "build/prl"));
'
od -A x -t x1 build/SAY.PRL
```

```text
000000 00 0d 00 00 00 00 00 00 00 00 00 00 00 00 00 00
000010 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
000100 11 09 01 0e 09 cd 05 00 c9 50 52 4c 24 20 00
00010f
```

The header's word at offset 1 is `000Dh`, the 13 bytes of code. The code at
offset `100h` begins `11 09 01`, which is `LD DE,0109h` with the address of
`MSG` for code at `0100h`. The two bytes after the code are the bitmap. Its
first byte, `20h`, has the third bit from the top set, which marks byte 2 of the
code, the `01h` of `LD DE,0109h`. The `CALL 0005h` at bytes 5 to 7 is unmarked,
and so is everything else. The second byte of the bitmap covers bytes 8 to 15,
and since the code ends at byte 12, its last bits cover nothing.

Digital Research's header also has a word at offset 4, the extra data memory
the program needs beyond its code (`src/prl.asm:2`). `makePrl` leaves it 0, and
TEC-OS's loader doesn't read it.

Digital Research defined the format for MP/M, and CP/M 3 loads it too. Appendix
B of the CP/M 3 Programmer's Guide describes it, and Digital Research's linker,
LINK-80, writes a PRL with its `[OP]` option. By Appendix B, a file from LINK-80
has the layout that TEC-OS's loader checks (`src/prl.asm:14-53`), but the tests
hold no such file: they make their PRL files with the repository's own code
(`test/prl.test.mjs:37`, `test/lib/fixtures.mjs:63`).

## A PRL program at 0100h

The CCP opens `NAME.PRL` only after an open of `NAME.COM` has failed
(`src/cpm/ccp.asm:277-290`). If `NAME.COM` is on the drive but doesn't load,
because it is too large or a read fails, the command fails there, with no search
for the PRL (`src/cpm/ccp.asm:285`). With `SAY.PRL` copied to the starter card,
the command `SAY` runs it:

```sh
cp dist/starter.img build/say.img
node tools/tecvol.mjs put build/say.img A build/SAY.PRL
```

<!-- node tools/capture.mjs --card build/say.img SAY -->
```text
A>SAY
PRL
A>
```

`LOADCOM` (`src/cpm/ccp.asm:359`) reads the file the same way for both types. It
opens the file and then reads it one record of 128 bytes at a time into memory
from `0100h` up (`src/cpm/ccp.asm:368-384`), stopping at the page given by the
high byte of the word at `0006h`, the page of the BDOS's entry or, with a
service in, of the lowest service (`src/cpm/ccp.asm:369`). A file with more
records than that is read one record further into a scratch buffer, and that read separates a file that exactly fills
the space from one that is too large (`src/cpm/ccp.asm:388-400`). For a file
that fits, `LOADCOM` stores the address just past its last record in `LOADTOP`
(`src/cpm/ccp.asm:407`, `src/ram.asm:230`), and for a PRL file the CCP then
calls `PRLGO` (`src/cpm/ccp.asm:292`).

At that moment the whole file is in memory: the header at `0100h`, the code at
`0200h` and the bitmap after it. The code was assembled for `0100h`, one page
below where it lies, and the program runs at `0100h`. So `PRLGO` moves the code
down by one page and changes no byte of it (`src/prl.asm:5-6`,
`src/prl.asm:54-57`). It checks that the bitmap was read and never reads it.

Before the move `PRLGO` checks the file in five steps, and returns carry set for
the first one that fails (`src/prl.asm:14-53`):

1. The records read must cover the whole header page: `LOADTOP` at `0200h` or
   above.
2. The code's length `n` must not be 0, since `LDIR` with a count of 0 copies
   65,536 bytes.
3. `0200h` plus `n` must not pass `FFFFh`.
4. The bitmap's end, `0200h` plus `n` plus `n / 8` rounded up, must not pass
   `FFFFh`, and must be at or below `LOADTOP`, so that the code and the bitmap
   were both in the records read. The rounding is done as `(n − 1) / 8 + 1`,
   which can't overflow as `n + 7` can (`src/prl.asm:29-36`).
5. The code's end at its destination, `0100h` plus `n`, must be at or below
   the start of the page given by the word at `0006h`.

A check that fails changes nothing, and the CCP prints the command with a
question mark, as for a command it can't find (`src/cpm/ccp.asm:292-293`,
`src/cpm/ccp.asm:329-355`). When all five pass, the `LDIR` runs, and the CCP
then sets up page zero and jumps to `0100h` as it does for a `.COM` file
(`src/cpm/ccp.asm:294-300`).

The file is in memory whole before the code moves, so a PRL program has less
room than a `.COM` file. On the starter card with no service installed the load
stops at `B800h`, and the file, from `0100h`, can be up to 46,848 bytes. Its
header takes 256 of them and its bitmap one byte for every eight of code, which
leaves room for at most 41,415 bytes of code. A PRL file of 41,416 bytes of code
ends with its command printed back with a question mark.

## The SVC file and its relocation data

A service is the code that does move. The loader puts it in whole pages
immediately below the current top of the TPA, so its page depends on the services
already installed. `makeSvc` in `tools/lib/svc.mjs:87` assembles the service's
source at `0000h` and at `0100h` and keeps the first assembly, made for page 0,
with the service's 25-byte header at its start (`tools/lib/svc.mjs:103-113`).
Placed at page `p`, every address in it needs `p` added to its high byte.

The bytes that need it, the fixups, are found by the same comparison as a PRL's
(`tools/lib/svc.mjs:71-80`). A difference inside the 25-byte header is an error
(`tools/lib/svc.mjs:76`), since the relocation data can mark only bytes of the
image. Each fixup is counted from the end of the header, so fixup 0 is the
image's first byte.

The fixups are recorded as a list of gaps (`tools/lib/svc.mjs:37-47`). Each byte
of the list is the distance from one fixup to the next, the first counted from
the byte before the image. A gap of 255 or more is written as bytes of 255, each
moving 255 bytes on with nothing fixed, and then the rest. Fixups at image bytes
2 and 9 become the list `3 7`, and one fixup at byte 600 becomes `255 255 91`:
601 bytes from the byte before the image, 255 and 255 and 91 more
(`test/svc.test.mjs:340-341`). When the rest is 0, the last byte of the list for
that fixup is 0, a gap of 0 that fixes the byte the 255s reached.

`PICO.SVC` on the starter card shows the list in a real file. Its header gives
the size of the header and image, `0515h` or 1,301 bytes, at offset 6, and the
length of the relocation data, `003Bh` or 59 bytes, at offset 10. The file has
no dependencies, so the relocation data starts at offset 1,301, `515h`:

```sh
od -A x -t x1 -N 48 dist/files/PICO.SVC
od -A x -t x1 -j 1301 dist/files/PICO.SVC
```

```text
000000 44 03 00 01 5d 00 15 05 00 00 3b 00 00 00 00 43
000010 00 50 49 43 4f 20 20 20 20 79 01 84 01 8d 01 9c
000020 00 3f 01 68 01 77 00 50 18 e5 00 ed 00 fa 00 08
000030
000515 02 02 02 02 02 02 02 04 02 02 02 0d 13 07 03 23
000525 04 04 03 06 05 0b 12 03 03 03 06 13 1e 0c 0e 27
000535 08 08 06 04 03 03 04 06 03 03 0b 03 03 0a 03 07
000545 03 0a 03 0e 03 07 04 05 05 11 06
000550
```

The image starts at offset 25, `19h`, with the table of words the driver passes
to the ROM's terminal: `0179h`, `0184h`, `018Dh` and so on, addresses in an
image made for page 0. The list's first gap, 2, counts from offset 24 to offset
26, the high byte of `0179h`, and each of the next six 2s reaches the next
word's high byte. The 59 bytes mark 59 fixups, and a bitmap for the same 1,276
bytes of image would take 160.

## The loader's relocation pass

`SVCLOAD` (`src/svc.asm:57`) works on the file where `LOADCOM` read it, at
`0100h`, and relocates it there before it moves it. It first checks the magic,
`44h` and format 3 (`src/svc.asm:11`, `src/svc.asm:62-65`), and then that the
header and image lie within the records read (`src/svc.asm:66-69`).

The loader works out the page from the size. It adds the extra memory named in the
header, the word at offset 8, to the size of the header and image, subtracts one
and takes the high byte (`src/svc.asm:76-79`). The service's page is the current
top's page, less one, less that high byte (`src/svc.asm:80-82`), and `PZTOP`
holds the current top, the word that warm boot puts at `0006h`
(`src/ram.asm:228`). A service larger than the space below the top fails the load
(`src/svc.asm:83`), and so does a page below `80h` (`src/svc.asm:84-85`). The
page goes into `PRLDL` (`src/svc.asm:86`, `src/ram.asm:232`). For `PICO.SVC` on
the starter card, the top is `B806h`, and 1,301 bytes less one is `0514h`, so
the page is `B7h − 05h`, `B2h`.

The relocation data follows the image and the dependencies, and it must lie
within the records read too (`src/svc.asm:110-113`). The pass is at
`src/svc.asm:133-161`. `HL` starts at `0118h`, the file's offset 24, the byte
before the image (`src/svc.asm:136`), and `BC` counts the bytes of the list. For
each byte, the loader:

1. adds the gap to `HL` (`src/svc.asm:141-146`);
2. checks that `HL` is still inside the header and image, below `0100h` plus
   the size at offset 6, and fails the load if not (`src/svc.asm:148-155`);
3. if the gap was 255, goes on to the next byte with nothing fixed
   (`src/svc.asm:147`, `src/svc.asm:156-157`);
4. otherwise adds `PRLDL` to the byte at `HL` (`src/svc.asm:158-160`).

The check in step 2 is made for a gap of 255 too, so a list can't step past the
image even with nothing fixed. A failure here leaves the file at `0100h` partly
relocated, and nothing else changed: the service's pages, `0006h` and `PZTOP` are
as they were. The CCP reports it with the command's name and a question mark.

When the list is used up, the loader writes its own fields into the header
(`src/svc.asm:163-171`). Offsets 0 to 2 take the registry's head and the lowest
service's page from before this load, and offset 6 takes a `JP` to the old top,
written over the size that the pass needed until then. One `LDIR` then moves the
header and image together to the chosen page, and `0006h` becomes that page's
`xx06h`, where the `JP` now is (`src/svc.asm:172-179`).

On the web page's board the startup file installs `PICO.SVC` at `B200h`. After
the move the image's table there reads `B379h`, `B384h`, `B38Dh`, each high byte
raised by `B2h`. Offset 6 holds `JP B806h`, a jump to the BDOS entry that was
the top before the driver. Offsets 12 to 14 hold `08h`, `0Ch` and `06h`, the
room left on each of the three stacks, which the loader wrote over the driver's
declared use (`src/svc.asm:114-130`). The word at `0006h` is `B206h`, and
`SERVICES` lists the driver with its pages:

<!-- node tools/capture.mjs --board pico SERVICES -->
```text
A>SERVICES
PICO 6
A>
```

`SERVICES` prints each page count as the page above the service, the high byte
of the `JP`'s address at offset 8, less the service's own page
(`src/svc.asm:314-319`). That byte is the old top's page, `B8h`, so the count
includes the part of the last page the service doesn't fill. `PICO.SVC`'s 1,301
bytes take six pages, 1,536 bytes of the TPA.
