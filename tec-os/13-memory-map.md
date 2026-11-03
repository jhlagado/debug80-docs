---
title: The memory map
parent: TEC-OS
nav_order: 13
nav_group: "Part II: Inside TEC-OS"
---

# 13. The memory map

Checked against TEC-OS 1f9542d.

TEC-OS has 16 KiB of ROM and, of RAM, the 64 KiB that a TEC-1G with U9 fitted
has. Chapter 7 describes that memory from a program's side, and this chapter
from TEC-OS's side. It starts with the way the system latch puts RAM and ROM
into the Z80's 64 KiB, and the state TEC-OS keeps in page zero. It goes on to
the resident workspace at the top of EXPAND 0 and the allocation vectors below
it. It ends with the four stacks, the measurements that size them and TEC-OS's
use of EXPAND 1. The addresses are those of the build at 1f9542d with the starter
card in the socket. `docs/memory-map.md`, which `npm run media` writes from the
build's census, has the same figures.

## The address space and the latch

The Z80's address space has three regions. `0000h–7FFFh` is the board's fixed
RAM, `8000h–BFFFh` is a window onto one half of the RAM chip in U9, and
`C000h–FFFFh` is the ROM (`src/layout.asm:3-6`). The window's two halves are
EXPAND 0 and EXPAND 1, each 16 KiB.

The system latch at port `FFh` (`src/layout.asm:13`) selects what is in view.
Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:18`).
Bit 0, `LATSHAD`, high, turns off the boot overlay, the copy of the ROM's first
2 KiB that the board shows at `0000h` after a reset (`src/layout.asm:16`).
TEC-OS runs with the latch at `LATCLAS`, `01h`: the overlay off and EXPAND 0 in
view (`src/layout.asm:19`).

The latch can be written but not read, so TEC-OS keeps what it last wrote in a
byte of page zero, `LATCHV` at `0040h` (`src/layout.asm:36`). A routine that
changes a bank for a moment reads `LATCHV`, sets its bit and writes the result
to the port, and when it is done it writes `LATCHV` to the port unchanged. The
block cache's lookup is an example. It writes `LATCHV` with `LATEXP` added to
put EXPAND 1 in view and searches the table of cache lines there, as Chapter 19
describes, and it ends with `LD A,(LATCHV)` and `OUT (SYSLAT),A`
(`src/cache.asm:49-51`, `src/cache.asm:81-82`).

Because each routine starts from `LATCHV`, a bank change leaves the latch's
other bits as they were. Those are bit 0, bit 1, which the board calls PROTECT,
and bit 7, CAPS. The equate `LATKEEP`, `83h`, names those bits, but no routine
uses it (`src/layout.asm:17`). The matrix keyboard's Caps key toggles bit 7 in
`LATCHV` and in the latch (`src/console.asm:405-410`).

The latch moves `8000h–BFFFh` from one half to the other, so anything TEC-OS
must reach while EXPAND 1 is in view has to be outside the window. `LATCHV` is
the one such byte. While a routine has EXPAND 1 in view, as the cache's lookup
above does, the only state of TEC-OS's own that it reads outside EXPAND 1 is
`LATCHV`. The cache's copy routine `MVCOPY` also copies the part of a buffer that
lies below `8000h` then (`src/cache.asm:387-392`).
`LATCHV` is in page zero with the rest of TEC-OS's fixed state.

## Page zero

CP/M puts its fixed addresses in the first 256 bytes of memory, and TEC-OS
writes them as CP/M 2.2 does. Cold boot clears all of page zero
(`src/boot.asm:15-21`), and `PZINIT`, at cold boot and at every warm boot, writes
the parts TEC-OS sets (`src/boot.asm:190-246`):

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, the warm boot entry of the RAM BIOS table |
| `0003h` | the IOBYTE |
| `0004h` | the current drive in bits 0–3 and user number in bits 4–7 |
| `0005h` | `JP` to the BDOS entry; the word at `0006h` is the top of the TPA |
| `0008h–0037h` | the restart vectors 1 to 6, each a `RET` unless it jumps above the top of the TPA |
| `0038h` | `EI` and `RETI`, for restart 7 and the interrupt of mode 1, unless it jumps above the top of the TPA |
| `0040h–004Fh` | TEC-OS's state |
| `0050h` | the drive the CCP loaded the running program from: 0 for the current drive, 1 for A: and so on |
| `005Ch` | the default file control block |
| `0080h` | the default DMA buffer and the command tail |

`PZINIT` leaves the IOBYTE and the drive and user byte as they are
(`src/boot.asm:187-189`). The word it writes at `0006h` is `PZTOP`, the entry
of the lowest service or, with none, the BDOS entry jump itself
(`src/boot.asm:195-196`). At each warm boot `PZINIT` also rewrites the restart
vectors, as Chapter 14 describes. A vector that jumps above the top of the TPA,
into a service, the workspace or the ROM, keeps its jump
(`src/boot.asm:203-246`).

`PZINIT` doesn't write `0050h`. The CCP stores there the drive byte of the
command's FCB just before it starts a program, as CP/M 3 does. A program that
the CCP found on A: by its search sees 1 (`src/layout.asm:29-30`,
`src/cpm/ccp.asm:296-298`). Chapter 17 describes the search.

The bytes `0040h–004Fh` are the sixteen that CP/M 2.2 leaves to the BIOS, and
TEC-OS keeps fourteen bytes of its state there, of which only `LATCHV` has to be
in view whatever the window shows (`src/layout.asm:36-49`). `0041h` and `0044h`
are unused:

| Address | Name | Contents |
| --- | --- | --- |
| `0040h` | `LATCHV` | the copy of the system latch |
| `0042h` | `RXFULL` | nonzero while a console byte waits in `RXCHAR` |
| `0043h` | `RXCHAR` | that byte |
| `0045h` | `CONDEV` | console devices present, a bit each |
| `0046h` | `VROW` | video terminal cursor row |
| `0047h` | `VCOL` | and column |
| `0048h` | `VWID` | video columns, 0 on the serial terminal |
| `0049h` | `VHGT` | video rows |
| `004Ah` | `ESCST` | escape parser state |
| `004Bh` | `ESCP1` | first numeric parameter |
| `004Ch` | `ESCP2` | second numeric parameter |
| `004Dh` | `KBLAST` | matrix key held at the last poll, `FFh` none |
| `004Eh` | `VATTR` | `80h` while reverse video is on |
| `004Fh` | `VCURV` | 1 while the cursor cell is drawn as its reverse image |

A program finds the console's size through the hardware service `INFO`, which
returns `VWID` in `L` and `VHGT` in `H` (`src/hwsvc.asm:49-56`). Chapter 15
describes the console's bytes.

## The resident workspace

The workspace is at the top of EXPAND 0, above the BDOS entry jump and the
allocation vectors. With the starter card in the socket and no service loaded,
memory from that jump to `BFFFh` is laid out like this:

| Addresses | Bytes | Region |
| --- | ---: | --- |
| `B815h–B817h` | 3 | the BDOS entry jump |
| `B818h–B957h` | 320 | allocation vectors |
| `B958h–BCC4h` | 877 | BIOS disk state and buffers |
| `BCC5h–BCEAh` | 38 | BIOS stack |
| `BCEBh–BE76h` | 396 | CCP state and stack |
| `BE77h–BEFFh` | 137 | BDOS state and stack |
| `BF00h–BF32h` | 51 | RAM BIOS table |
| `BF33h–BFE4h` | 178 | SD, keyboard and graphics LCD state |
| `BFE5h–BFFFh` | 27 | unused |

The image initialises none of it. `ram.asm` reserves each byte with `DS`, and
cold boot and warm boot clear and set it (`src/ram.asm:1-4`).

The fixed workspace, from `WSBASE` at `B958h` to `BEFFh`, has fixed addresses
for a given build. Its size, 1,448 bytes, sets `WSBASE`, and Chapter 12
describes how the build places it so that it ends at `BF00h`. This part is
three blocks, one after the other (`src/ram.asm:1-3`).

The first block is the BIOS's, from `DSKCUR` to the BIOS stack
(`src/ram.asm:8-62`). It begins with the disk state: the drive, track, sector
and DMA address the BDOS last set, and the block and record they map to. Next
is the 512-byte deblocking buffer `BLKBUF` at `B966h` with its key
(`src/ram.asm:16-20`). After it come the drive table, the drives' disk
parameter headers, the DPHs, and the 128-byte directory buffer `DIRBUF` that
every drive shares. Chapter 18 describes deblocking and these tables. Then come
the word `STUBAD`, which holds the BDOS entry
jump's address, and the `MOUNT` routine's scratch bytes, which the volume
services also use. The video terminal's
state follows: an 80-byte row buffer for scrolling, the seven vectors into the
display driver, the scroll region and the console mode (`src/ram.asm:45-58`).

The second block is the CCP's, from `CCPRAM` at `BCEBh` (`src/ram.asm:64-65`).
It holds the CCP's two FCBs, the command buffer with its 128 characters, the
state of the directory listing and the pager, and a 128-byte scratch buffer,
`LOADBUF`. A guard and the CCP's stack follow (`src/ram.asm:67-128`).

The third block is the BDOS's, from `BDOSRAM` at `BE77h`. It starts with the
saved stack pointer, the console column and the line editor's state. Then come
`CURDRV`, the bound drive, `DEFDRV`, the default drive, the user number,
the read-only vector and the drives to rebuild at warm boot. The pointers into
the bound drive's DPH, its disk parameter block, the DPB, and its vector
follow, then the directory search state, the file's position and the BDOS's
stack (`src/ram.asm:130-190`). The block ends at `BDOSRME`, `BF00h`.

`BF00h–BF32h` is the RAM BIOS table, seventeen three-byte jumps at the start
of a page (`src/layout.asm:71-72`). Chapter 15 describes it.

Above the table, from `SDBYTE` at `BF33h`, is state that the build puts at a
fixed offset from it, 51 bytes on (`src/ram.asm:192`). It starts with the SD
card driver's command argument, block address and last error. The block cache's
next line, failure flag and saved interrupt state follow. Next are the matrix
keyboard's scan state, the two display drivers' table addresses, the history's
head, `MVCOPY`'s banks, `PZTOP` and the program return code `PRGCODE`. After
them come the service loader's state and the registry's head.
The last items are the 128-byte record of `A:STARTUP.CMD` that startup reads,
and `CHPOS`, the next command, or piece, of a chained line (Chapter 11,
`src/ram.asm:193-239`). This state ends at
`WSEND`, `BFE5h`, and the build checks that it ends by `C000h`
(`src/ram.asm:240-241`, `tools/build.mjs:258`).

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
address in the drive's DPH (`src/vol.asm:496-569`).

A card of container format 1.1 whose drives field is N gets a 256-byte slot for
each of drives A to the Nth, mounted or not, so any of those drives can later
take any volume. Any other card, including every format 1.0 card, gets a slot
for each drive it mounts, of the size its volume needs (`src/vol.asm:516-544`).
`DRVSLOT` records each drive's slot: 0 for none, 1 for 64 bytes and 2 for 256
(`src/ram.asm:29`, `src/vol.asm:545-550`). The starter card is format 1.0 with
a G1M volume on A and a G8M volume on B. Its vectors take 64 and 256 bytes, 320
in all, from `B818h` to `B957h`.

Directly under the vectors goes the BDOS entry jump, `JP BENTRY`. `ALVINIT`
takes the lowest vector's address and subtracts 3 (`src/vol.asm:570-575`). For
the starter card that puts the jump at `B815h`, with no byte between it and the
vectors. `STUBAD` keeps the address, and `PZINIT` writes the jump there. With no
service loaded, `PZTOP`, the word `PZINIT` puts at `0006h`, is this address
(`src/ram.asm:34`, `src/boot.asm:195-202`).

A service's header and image are moved to a page boundary below the BDOS entry
jump. The loader writes `JP BENTRY` over the header's first three bytes, at
offset 0 of the page, and lowers the word at `0006h` to that address, of the
form `xx00h` (`src/svc.asm:1-5`, `src/svc.asm:203-215`). Chapter 20 describes
the loader.

The word at `0006h` is the top of the TPA, so the card sets how much memory
programs have. The starter card gives 46,869 bytes, from `0100h` to `B814h`.
The largest card, four G8M volumes, takes four 256-byte vectors, puts the entry
at `B555h` and leaves 46,165 bytes. The build works out both figures in its
census and checks that the starter card's TPA is at least 45,830 bytes
(`tools/build.mjs:210-220`, `tools/build.mjs:261-262`).

## The four stacks

TEC-OS uses four stacks, and only the first is outside the workspace.

The boot stack starts at `8000h`, `BOOTSTK`, and grows down into fixed RAM
(`src/layout.asm:66`). Cold boot sets it first (`src/boot.asm:10`), because the
workspace is not yet known to be RAM. On this stack cold boot tests for a
reset, clears page zero and runs the RAM check. After the check has passed and
the workspace has been cleared, cold boot moves to the BIOS stack
(`src/boot.asm:22-28`).

The BIOS stack, `BSTKB` to `BSTK`, is 38 bytes at `BCC5h–BCEAh`
(`src/ram.asm:60-62`). Cold boot runs on it from the end of the RAM check. Warm
boot sets it as soon as EXPAND 0 is back in view (`src/boot.asm:65-68`), and
the diagnostic prompt sets it again on entry (`src/diag.asm:5`).

The CCP's stack, `CSTKBAS` to `CSTKTOP`, is 30 bytes at `BE59h–BE76h`
(`src/ram.asm:125-127`). The CCP sets it on entry and at the top of its main
loop. It is also the stack a program starts with. The CCP sets it again, pushes
the address of warm boot and jumps to `0100h`, which leaves the program 28
bytes below that return word (`src/cpm/ccp.asm:296-304`). CP/M 2.2 gives a
program eight levels of stack and the return word, and those take 18 of the
30 bytes (`src/layout.asm:77-78`). Below the stack is a
guard of 13 bytes, `STKGUARD`, which warm boot fills with `A5h`
(`src/ram.asm:119-124`, `src/boot.asm:263-267`), so a guard byte that is no
longer `A5h` shows that the stack went past its bottom.

The BDOS's stack, `STKBASE` to `STKTOP`, is 54 bytes at `BECAh–BEFFh`
(`src/ram.asm:187-189`). The BDOS moves to it on entry, keeping the caller's
stack pointer in `OLDSP`. It runs every function on this stack, the BIOS calls
from the BDOS included.

The three sizes in the workspace are equates in `layout.asm`: 54 for the BDOS,
30 for the CCP and 38 for the BIOS (`src/layout.asm:79-81`). The comment above
them gives the rule: each is the deepest use and a quarter more
(`src/layout.asm:74-75`).

The measurement is `test/stacks.test.mjs`. The test boots the model under the
heaviest workloads of the test suite, and it runs them on each console, on a
volume written behind, without a card, on chained lines and on the CCP's
deepest paths. It
records every write to memory, the clearing `LDIR`s excepted, and the lowest
address written in each stack gives its depth. It passes when each stack's
deepest use leaves at least a quarter of it free and no guard byte has changed
(`test/stacks.test.mjs:211`, `test/stacks.test.mjs:243-246`). It presses the
keypad's NMI at each new depth only while `0066h` holds a `RETN`
(`test/stacks.test.mjs:62-69`). TEC-OS puts no handler there, so the measured
depths include no NMI frame, as the comment at `src/layout.asm:75-77` says.

A loaded service runs on its caller's stack, so the services' own depths add
to these. `SVCLIM` gives the most that the services together may add to each
stack: 8 bytes on the BDOS's, 12 on the BIOS's and 6 on the CCP's
(`src/data3.asm:115`). Chapter 20 describes how the loader uses them.

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
(`src/layout.asm:21-23`), and so is the history's page, `HRING`
(`src/history.asm:14`). Chapter 19 describes the cache and Chapter 22 the
history. The two pages from `BE00h` are unused.

The cache's copies from its lines to the DMA buffer and back go through
`MVCOPY`, which copies between EXPAND 0 and EXPAND 1
(`src/cache.asm:381-392`, `src/cache.asm:266-276`).

All three resident stacks are in the window, so the routines that put EXPAND 1
in view use no stack until EXPAND 0 is back. A `PUSH` with EXPAND 1 in view
would write into EXPAND 1, and the `POP` after it would read EXPAND 0. The
cache's routines, the history's and `DETECT`, which the RAM check calls to
find EXPAND 1, state the rule at their heads (`src/cache.asm:10-13`,
`src/history.asm:16-18`, `src/boot.asm:157-160`). The SD card driver's block
loops keep to it when a cache line is the buffer (`src/sd.asm:272-274`).
