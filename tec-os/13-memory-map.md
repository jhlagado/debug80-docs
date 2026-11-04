---
title: The memory map
parent: TEC-OS
nav_order: 13
nav_group: "Part II: Inside TEC-OS"
---

# 13. The memory map

Checked against TEC-OS 621201d.

TEC-OS has 16 KiB of ROM and, of RAM, the 64 KiB that a TEC-1G with U9 fitted
has. Chapter 7 describes that memory from a program's side, and this chapter
from TEC-OS's side. It starts with the way the system latch puts RAM and ROM
into the Z80's 64 KiB, and the byte TEC-OS keeps in page zero. It goes on to
the resident workspace at the top of EXPAND 0 and the allocation vectors below
it. It ends with the four stacks, the measurements that size them and TEC-OS's
use of EXPAND 1. The addresses are those of the build at 621201d with the starter
card in the socket. `docs/memory-map.md`, which `npm run media` writes from the
build's census, has the same figures.

## The address space and the latch

The Z80's address space has three regions. `0000h–7FFFh` is the board's fixed
RAM, `8000h–BFFFh` is a window onto one half of the RAM chip in U9, and
`C000h–FFFFh` is the ROM (`src/layout.asm:3-4`). The window's two halves are
EXPAND 0 and EXPAND 1, each 16 KiB.

The system latch at port `FFh` (`src/layout.asm:14`) selects what is in view.
Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:20`).
Bit 0, `LATSHAD`, high, turns off the boot overlay, the copy of the ROM's first
2 KiB that the board shows at `0000h` after a reset (`src/layout.asm:17`).
TEC-OS runs with the latch at `LATCLAS`, `01h`: the overlay off and EXPAND 0 in
view (`src/layout.asm:21`).

The latch can be written but not read, so TEC-OS keeps what it last wrote in a
byte of page zero, `LATCHV` at `0040h` (`src/layout.asm:39`). A routine that
changes a bank for a moment reads `LATCHV`, sets its bit and writes the result
to the port, and when it is done it writes `LATCHV` to the port unchanged. The
block cache's lookup is an example. It writes `LATCHV` with `LATEXP` added to
put EXPAND 1 in view and searches the table of cache lines there, as Chapter 19
describes, and it ends with `LD A,(LATCHV)` and `OUT (SYSLAT),A`
(`src/cache.asm:24-26`, `src/cache.asm:56-57`).

Because each routine starts from `LATCHV`, a bank change leaves the latch's
other bits as they were. Those are bit 0, bit 1, which the board calls PROTECT,
and bit 7, CAPS. The equate `LATKEEP`, `83h`, names those bits, but no routine
uses it (`src/layout.asm:18`). The matrix keyboard's Caps key toggles bit 7 in
`LATCHV` and in the latch (`src/keyboard.asm:110-115`).

The latch moves `8000h–BFFFh` from one half to the other, so anything TEC-OS
must reach while EXPAND 1 is in view has to be outside the window. `LATCHV` is
the one such byte. While a routine has EXPAND 1 in view, as the cache's lookup
above does, the only state of TEC-OS's own that it reads outside EXPAND 1 is
`LATCHV`. The cache's copy routine `MVCOPY` also copies the part of a buffer that
lies below `8000h` then (`src/cache.asm:388-399`).
`LATCHV` is TEC-OS's one byte in page zero.

## Page zero

CP/M puts its fixed addresses in the first 256 bytes of memory, and TEC-OS
writes them as CP/M 2.2 does. Cold boot clears all of page zero
(`src/boot.asm:29-35`), and `PZINIT`, at cold boot and at every warm boot, writes
the parts TEC-OS sets (`src/boot.asm:221-283`):

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, the warm boot entry of the RAM BIOS table |
| `0003h` | the IOBYTE |
| `0004h` | the current drive in bits 0–3 and user number in bits 4–7 |
| `0005h` | `JP` to the BDOS entry; the word at `0006h` is the top of the TPA |
| `0008h–0037h` | the restart vectors 1 to 6, each a `RET` unless it jumps above the top of the TPA |
| `0038h` | `EI` and `RETI`, for restart 7 and the interrupt of mode 1, unless it jumps above the top of the TPA |
| `0040h` | `LATCHV`, the copy of the system latch |
| `0041h–004Fh` | unused |
| `0050h` | the drive the CCP loaded the running program from: 0 for the current drive, 1 for A: and so on |
| `005Ch` | the default file control block |
| `0080h` | the default DMA buffer and the command tail |

`PZINIT` leaves the IOBYTE and the drive and user byte as they are
(`src/boot.asm:221-224`). The word it writes at `0006h` is `PZTOP`, the entry
of the lowest service or, with none, the BDOS entry jump itself
(`src/boot.asm:230-231`). At each warm boot `PZINIT` also rewrites the restart
vectors, as Chapter 14 describes. A vector that jumps above the top of the TPA,
into a service, the workspace or the ROM, keeps its jump
(`src/boot.asm:238-283`).

`PZINIT` doesn't write `0050h`. The CCP stores there the drive byte of the
command's FCB just before it starts a program, as CP/M 3 does. A program that
the CCP found on A: by its search finds 1 there (`src/layout.asm:31`,
`src/cpm/ccp.asm:317-319`). Chapter 17 describes the search.

The bytes `0040h–004Fh` are the sixteen that CP/M 2.2 leaves to the BIOS.
TEC-OS keeps one there, `LATCHV`, the one byte it reads while EXPAND 1 is in
view. `0041h–004Fh` are unused, and cold boot's clear of page zero leaves them
0 (`src/layout.asm:36-39`). The console's state is at the top of the
workspace, as the next section describes.

## The resident workspace

The workspace is at the top of EXPAND 0, above the BDOS entry jump and the
allocation vectors. With the starter card in the socket and no service loaded,
memory from that jump to `BFFFh` is laid out like this:

| Addresses | Bytes | Region |
| --- | ---: | --- |
| `B9A4h–B9A6h` | 3 | the BDOS entry jump |
| `B9A7h–BAE6h` | 320 | allocation vectors |
| `BAE7h–BCC4h` | 478 | BIOS disk state and buffers |
| `BCC5h–BCECh` | 40 | BIOS stack |
| `BCEDh–BE75h` | 393 | CCP state and stack |
| `BE76h–BEFFh` | 138 | BDOS state and stack |
| `BF00h–BF32h` | 51 | RAM BIOS table |
| `BF33h–BFFFh` | 205 | SD card, cache, keyboard, display, loader, startup, chained line and console state, and the rest of the `MOUNT` scratch |

The image initialises none of it. `ram.asm` reserves each byte with `DS`, and
cold boot and warm boot clear and set it (`src/ram.asm:1-4`).

The fixed workspace, from `WSBASE` at `BAE7h` to `BEFFh`, has fixed addresses
for a given build. Its size, 1,049 bytes, sets `WSBASE`, and Chapter 12
describes how the build places it so that it ends at `BF00h`. This part is
three blocks, one after the other (`src/ram.asm:1-4`).

The first block is the BIOS's, from `DSKCUR` to the BIOS stack
(`src/ram.asm:9-77`). It begins with the disk state: the drive, track, sector
and DMA address the BDOS last set, and the block and record they map to. Next
is a 4-byte key, a flag with the drive and block of the last block that a
write cleared rather than read (`src/ram.asm:19-21`, `src/bios.asm:146-156`). After it come
the drive table, the drives' disk parameter headers, the DPHs, and the 128-byte
directory buffer `DIRBUF` that every drive shares. Chapter 18 describes the key
and these tables. Then come the word `STUBAD`, which holds the BDOS entry
jump's address, and `PIBLK`, the PICO9918 console's 95 bytes at
`BBE3h–BC41h`: its table, its width's columns, rows and entries, its record in
the registry, the pages it draws and shows, and the address of each row in its
name table
(`src/ram.asm:41-54`). Chapter 15 describes them. Two of the `MOUNT` routine's
scratch areas follow, which the volume services also use: the count `MNTCNT`
and `MNBUF`, 32 bytes of the container's table copied from the cache line that
holds it (`src/ram.asm:56-58`). The video terminal's state follows: an 80-byte
row buffer for scrolling, the seven vectors into the display's table, the scroll
region, the PICO9918's claim and the console mode (`src/ram.asm:60-73`).

The second block is the CCP's, from `CCPRAM` at `BCEDh` (`src/ram.asm:79-80`).
It holds the CCP's two FCBs, the command buffer with its 128 characters, the
state of the directory listing and the pager, and a 128-byte scratch buffer,
`LOADBUF`. A guard and the CCP's stack follow (`src/ram.asm:82-139`).

The third block is the BDOS's, from `BDOSRAM` at `BE76h`. It starts with the
saved stack pointer, function 45's error mode `ERRMODE`, the console column and the line editor's state. Then come
`CURDRV`, the bound drive, `DEFDRV`, the default drive, the user number,
the read-only vector and the drives to rebuild at warm boot. The pointers into
the bound drive's DPH, its disk parameter block, the DPB, and its vector
follow, then the directory search state, the file's position and the BDOS's
stack (`src/ram.asm:142-216`). The block ends at `BDOSRME`, `BF00h`.

`BF00h–BF32h` is the RAM BIOS table, seventeen three-byte jumps at the start
of a page (`src/layout.asm:61-62`). Chapter 15 describes it.

Above the table, from `SDBYTE` at `BF33h`, is state that the build puts at a
fixed offset from it, 51 bytes on (`src/ram.asm:218`). It starts with the SD
card driver's command argument, block address and last error. The block cache's
next line, the type of the BIOS write and the saved interrupt state follow. Next are the matrix
keyboard's scan state and the two consoles' table addresses, `PIBLK`'s and
`GLCD.SVC`'s. The history's head, `MVCOPY`'s banks, `PZTOP` and the program
return code `PRGCODE` come next. After them come the service loader's state,
the registry's head and `STFLAG`, which is `FFh` while a line from
`STARTUP.CMD` runs. Then come the 128-byte record of `A:STARTUP.CMD` that
startup reads and `CHPOS`, the next command, or piece, of a chained line
(Chapter 11, `src/ram.asm:218-272`).

The console's state is next, at `BFE5h–BFF1h`, read only while EXPAND 0 is in
view (`src/ram.asm:275-288`):

| Address | Name | Contents |
| --- | --- | --- |
| `BFE5h` | `RXFULL` | nonzero while a console byte waits in `RXCHAR` |
| `BFE6h` | `RXCHAR` | that byte |
| `BFE7h` | `CONDEV` | console devices present, a bit each |
| `BFE8h` | `VROW` | video terminal cursor row |
| `BFE9h` | `VCOL` | and column |
| `BFEAh` | `VWID` | video columns, 0 on the serial terminal |
| `BFEBh` | `VHGT` | video rows |
| `BFECh` | `ESCST` | escape parser state |
| `BFEDh` | `ESCP1` | first numeric parameter |
| `BFEEh` | `ESCP2` | second numeric parameter |
| `BFEFh` | `KBLAST` | matrix key held at the last poll, `FFh` none |
| `BFF0h` | `VATTR` | `80h` while reverse video is on |
| `BFF1h` | `VCURV` | 1 while the cursor cell is drawn as its reverse image |

A program finds the console's size through the hardware service `INFO`, which
returns `VWID` in `L` and `VHGT` in `H` (`src/services.asm:56-63`). Chapter 15
describes the console's bytes.

The last 14 bytes, `BFF2h–BFFFh`, are the rest of the `MOUNT` routine's
scratch, from `MNTBLK` to `MNTLN` (`src/ram.asm:290-300`). This state ends at
`WSEND`, `C000h`, with no byte unused above the table, and the build checks
that it ends by `C000h` (`src/ram.asm:301-302`, `tools/build.mjs:257`).

## The allocation vectors and the BDOS entry

A CP/M drive's allocation vector has one bit for each allocation block of its
disk, set while the block is in use. The BDOS keeps the vector in memory while
the drive is logged in, which it is once the BDOS has built the vector from
the directory (Chapter 16). Its size is `DSM / 8 + 1` bytes, where `DSM` is the
number of the disk's last allocation block. A G1M volume, with `DSM` 511,
needs 64 bytes, and a G8M volume, with `DSM` 2047, needs 256.

Cold boot places the vectors after it has read the card, because the space
each drive gets depends on the card. `ALVINIT` starts at `WSBASE` and works
down, giving each drive its vector in drive order and putting each one's
address in the drive's DPH (`src/boot.asm:385-461`).

A card of container format 1.1 whose drives field is N gets a 256-byte slot for
each of drives A to the Nth, mounted or not, so any of those drives can later
take any volume. Any other card, including every format 1.0 card, gets a slot
for each drive it mounts, of the size its volume needs (`src/boot.asm:402-430`).
`DRVSLOT` records each drive's slot: 0 for none, 1 for 64 bytes and 2 for 256
(`src/ram.asm:31-33`, `src/boot.asm:431-436`). The starter card is format 1.0 with
a G1M volume on A and a G8M volume on B. Its vectors take 64 and 256 bytes, 320
in all, from `B9A7h` to `BAE6h`.

Directly under the vectors goes the BDOS entry jump, `JP BENTRY`. `ALVINIT`
takes the lowest vector's address and subtracts 3 (`src/boot.asm:456-461`). For
the starter card that puts the jump at `B9A4h`, with no byte between it and the
vectors. `STUBAD` keeps the address, and `PZINIT` writes the jump there. With no
service loaded, `PZTOP`, the word `PZINIT` puts at `0006h`, is this address
(`src/ram.asm:39`, `src/boot.asm:230-237`).

A service's header and image are moved to a page boundary below the BDOS entry
jump. The loader writes `JP BENTRY` over the header's first three bytes, at
offset 0 of the page, and lowers the word at `0006h` to that address, of the
form `xx00h` (`src/loader.asm:1-16`, `src/loader.asm:229-241`). Chapter 20 describes
the loader.

The word at `0006h` is the top of the TPA, so the card sets how much memory
programs have. The starter card gives 47,268 bytes, from `0100h` to `B9A3h`.
The largest card, four G8M volumes, takes four 256-byte vectors, puts the entry
at `B6E4h` and leaves 46,564 bytes. The build works out both figures in its
census and checks that the starter card's TPA is at least 45,830 bytes
(`tools/build.mjs:210-220`, `tools/build.mjs:260-261`).

## The four stacks

TEC-OS uses four stacks, and only the first is outside the workspace.

The boot stack starts at `8000h`, `BOOTSTK`, and grows down into fixed RAM
(`src/layout.asm:56`). Cold boot sets it first (`src/boot.asm:24`), because the
workspace is not yet known to be RAM. On this stack cold boot tests for a
reset, clears page zero and runs the RAM check. After the check has passed and
the workspace has been cleared, cold boot moves to the BDOS's stack
(`src/boot.asm:36-42`), as described below.

The BIOS stack, `BSTKB` to `BSTK`, is 40 bytes at `BCC5h–BCECh`
(`src/ram.asm:75-77`). Warm boot sets it as soon as EXPAND 0 is back in view
(`src/boot.asm:92-96`).

The CCP's stack, `CSTKBAS` to `CSTKTOP`, is 32 bytes at `BE56h–BE75h`
(`src/ram.asm:136-138`). The CCP sets it on entry and at the top of its main
loop. It is also the stack a program starts with. The CCP sets it again, pushes
the address of warm boot and jumps to `0100h`, which leaves the program 30
bytes below that return word (`src/cpm/ccp.asm:317-326`). CP/M 2.2 gives a
program eight levels of stack and the return word, and those take 18 of the
32 bytes (`src/layout.asm:64-70`). Below the stack is a
guard of 11 bytes, `STKGUARD`, which warm boot fills with `A5h`
(`src/ram.asm:130-135`, `src/boot.asm:305-309`). The guard and the stack
share 43 bytes (`src/layout.asm:72`, `src/ram.asm:133-137`), and a guard byte that is no
longer `A5h` shows that the stack went past its bottom.

The BDOS's stack, `STKBASE` to `STKTOP`, is 54 bytes at `BECAh–BEFFh`
(`src/ram.asm:213-215`). The BDOS moves to it on entry, keeping the caller's
stack pointer in `OLDSP`. It runs every function on this stack, the BIOS calls
from the BDOS included. Cold boot uses it too, because nothing calls the BDOS
before the CCP runs. Cold boot sets it after the workspace's clear and again
at `COLDRT`, where a retry from the diagnostic console comes back
(`src/boot.asm:42`, `src/boot.asm:63`). The console's start, the banner, the
mount, the drive listing and the diagnostic console all run on it. `DIAG` is
entered only by `COLDRT`'s jumps, with the stack at its top, and runs on it
as it finds it (`src/boot.asm:463-470`).

The three sizes in the workspace are equates in `layout.asm`: 54 for the BDOS,
32 for the CCP and 40 for the BIOS (`src/layout.asm:71-73`). The comment above
them gives the rule. Each holds its base, the deepest use with no service
loaded, and the most the services may add to it, with a quarter of it still
free. The base of the BIOS's stack is warm boot's, 18 bytes, and the CCP's is
also 18 (`src/layout.asm:64-70`).

The measurement is `test/stacks.test.mjs`. The test boots the model under the
heaviest workloads of the test suite, and it runs them on each console, on a
volume written behind, without a card, on chained lines and on the CCP's
deepest paths. It
records every write to memory, the clearing `LDIR`s excepted, and the lowest
address written in each stack gives its depth. It passes when each stack's
deepest use leaves at least a quarter of it free, no guard byte has changed and
each stack's base with its services' limit takes at most three quarters of it
(`test/stacks.test.mjs:212`, `test/stacks.test.mjs:245-258`). It presses the
keypad's NMI at each new depth only while `0066h` holds a `RETN`
(`test/stacks.test.mjs:62-69`). TEC-OS puts no handler there, so the measured
depths include no NMI frame, as the comment at `src/layout.asm:64-70` says.

A loaded service runs on its caller's stack, so the services' own depths add
to these. `SVCLIM` gives the most that the services together may add to each
stack: 8 bytes on the BDOS's, 12 on the BIOS's and 6 on the CCP's
(`src/tables.asm:96`). Chapter 20 describes how the loader uses them.

## EXPAND 1

EXPAND 1 is TEC-OS's own, and no call of the BDOS, the BIOS or the hardware
services gives a program a range in it. Cold boot clears all 16 KiB of it and
marks every cache line empty, as Chapter 14 describes. Its pages are:

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `8000h–BBFFh` | 15,360 | the block cache's 30 lines, 512 bytes each |
| `BC00h–BC77h` | 120 | each line's card block, 4 bytes, `FFFFFFFFh` while empty |
| `BC80h–BC9Dh` | 30 | each line's dirty byte, nonzero while the line holds changes the card lacks |
| `BD00h–BDFFh` | 256 | the command history |
| `BE00h–BFFFh` | 512 | free |

The cache's lines and its table are at fixed addresses
(`src/layout.asm:23-25`), and so is the history's page, `HRING`
(`src/history.asm:14`). Chapter 19 describes the cache and Chapter 22 the
history. The two pages from `BE00h` are unused.

The cache's copies from its lines to the DMA buffer and back go through
`MVCOPY`, which copies between EXPAND 0 and EXPAND 1
(`src/cache.asm:388-399`, `src/cache.asm:263-273`).

All three resident stacks are in the window, so the routines that put EXPAND 1
in view use no stack until EXPAND 0 is back. A `PUSH` with EXPAND 1 in view
would write into EXPAND 1, and the `POP` after it would read EXPAND 0. The
cache's routines, the history's and `DETECT`, which the RAM check calls to
find EXPAND 1, state the rule at their heads (`src/cache.asm:17-19`,
`src/history.asm:16-19`, `src/boot.asm:190-194`). The SD card driver's block
loops keep to it when a cache line is the buffer (`src/sd.asm:321-323`).
