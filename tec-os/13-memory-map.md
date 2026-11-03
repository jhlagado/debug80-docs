---
title: The memory map
parent: TEC-OS
nav_order: 13
nav_group: "Part II: Inside TEC-OS"
---

# 13. The memory map

Checked against TEC-OS ea9c1c0.

TEC-OS has 16 KiB of ROM and, of RAM, the 64 KiB that a TEC-1G with U9 fitted
has. Chapter 7 describes that memory from a program's side, and this chapter
from TEC-OS's side. It starts with the way the system latch puts RAM and ROM
into the Z80's 64 KiB, and the state TEC-OS keeps in page zero. It goes on to
the resident workspace at the top of EXPAND 0 and the allocation vectors below
it. It ends with the four stacks, the measurements that size them and TEC-OS's
use of EXPAND 1. The addresses are those of the build at ea9c1c0 with the starter
card in the socket. `docs/memory-map.md`, which `npm run media` writes from the
build's census, has the same figures.

## The address space and the latch

The Z80's address space has three regions. `0000h–7FFFh` is the board's fixed
RAM, `8000h–BFFFh` is a window onto one half of the RAM chip in U9, and
`C000h–FFFFh` is the ROM (`src/layout.asm:3-6`). The window's two halves are
EXPAND 0 and EXPAND 1, each 16 KiB.

The system latch at port `FFh` (`src/layout.asm:13`) selects what is in view.
Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:18`).
Bit 3, `LATMAIN`, selects a second 32 KiB at `0000h–7FFFh`, MAIN 1, on a board
that has one (`src/layout.asm:20`). Bit 0, `LATSHAD`, high, turns off the boot
overlay, the copy of the ROM's first 2 KiB that the board shows at `0000h` after a
reset (`src/layout.asm:16`). TEC-OS runs with the latch at `LATCLAS`, `01h`: the
overlay off, MAIN 0 and EXPAND 0 in view (`src/layout.asm:19`).

The latch can be written but not read, so TEC-OS keeps what it last wrote in a
byte of page zero, `LATCHV` at `0040h` (`src/layout.asm:37`). A routine that
changes a bank for a moment reads `LATCHV`, sets its bit and writes the result
to the port, and when it is done it writes `LATCHV` to the port unchanged. The
block cache's lookup is an example. It writes `LATCHV` with `LATEXP` added to
put EXPAND 1 in view and searches the table of cache lines there, as Chapter 19
describes, and it ends with `LD A,(LATCHV)` and `OUT (SYSLAT),A`
(`src/cache.asm:42-44`, `src/cache.asm:74-75`).

Because each routine starts from `LATCHV`, a bank change leaves the latch's
other bits as they were. Those are bit 0, bit 1, which the board calls PROTECT,
and bit 7, CAPS. The equate `LATKEEP`, `83h`, names those bits, but no routine
uses it (`src/layout.asm:17`). The matrix keyboard's Caps key toggles bit 7 in
`LATCHV` and in the latch (`src/console.asm:392-397`).

The latch moves `8000h–BFFFh` from one half to the other, so anything TEC-OS
must reach while EXPAND 1 is in view has to be outside the window. `LATCHV` is
the one such byte: the routines that put EXPAND 1 in view, such as the cache's
lookup above, read no byte outside EXPAND 1 but `LATCHV` while it is in view.
`LATCHV` is in page zero with the rest of TEC-OS's fixed state.

## Page zero

CP/M puts its fixed addresses in the first 256 bytes of memory, and TEC-OS
writes them as CP/M 2.2 does. Cold boot clears all of page zero
(`src/boot.asm:15-21`), and `PZINIT`, at cold boot and at every warm boot, writes
the parts TEC-OS sets (`src/boot.asm:218-265`):

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, the warm boot entry of the RAM BIOS table |
| `0003h` | the IOBYTE |
| `0004h` | the current drive in bits 0–3 and user number in bits 4–7 |
| `0005h` | `JP` to the BDOS entry; the word at `0006h` is the top of the TPA |
| `0008h–0037h` | the restart vectors 1 to 6, each a `RET` unless it jumps into ROM |
| `0038h` | `EI` and `RETI`, for restart 7 and the interrupt of mode 1 |
| `0040h–004Fh` | TEC-OS's state |
| `005Ch` | the default file control block |
| `0080h` | the default DMA buffer and the command tail |

`PZINIT` leaves the IOBYTE and the drive and user byte as they are
(`src/boot.asm:215-217`). The word it writes at `0006h` is `PZTOP`, the entry
of the lowest service or, with none, the BDOS entry jump itself
(`src/boot.asm:223-224`). At each warm boot `PZINIT` also rewrites the restart
vectors, as Chapter 14 describes.

The bytes `0040h–004Fh` are the sixteen that CP/M 2.2 leaves to the BIOS, and
TEC-OS keeps sixteen bytes of its state there, of which only `LATCHV` has to be
in view whatever the window shows (`src/layout.asm:35-52`):

| Address | Name | Contents |
| --- | --- | --- |
| `0040h` | `LATCHV` | the copy of the system latch |
| `0041h` | `MAINS` | MAIN regions fitted, 1 or 2 |
| `0042h` | `RXFULL` | nonzero while a console byte waits in `RXCHAR` |
| `0043h` | `RXCHAR` | that byte |
| `0044h` | `EXPANDS` | EXPAND regions fitted, always 2 |
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

Two of these are published. The ROM table has a word at `C008h` that
points at `VWID`, so a program can find the console's size, and a word at
`C00Dh` that points at `MAINS` (`src/abi.asm:10-13`). Chapter 15 describes the
console's bytes.

On a board with MAIN 1, cold boot copies page zero into it as well
(`src/boot.asm:140-142`, `src/boot.asm:172-183`). The jump at MAIN 1's `0000h`
then leads to the RAM BIOS table in EXPAND 0, so a program that ends with
MAIN 1 in view still reaches warm boot.

## The resident workspace

The workspace is at the top of EXPAND 0, above the BDOS entry jump and the
allocation vectors. With the starter card in the socket and no service loaded,
memory from that jump to `BFFFh` is laid out like this:

| Addresses | Bytes | Region |
| --- | ---: | --- |
| `B806h–B808h` | 3 | the BDOS entry jump |
| `B809h–B817h` | 15 | unused |
| `B818h–B957h` | 320 | allocation vectors |
| `B958h–BCC4h` | 877 | BIOS disk state and buffers |
| `BCC5h–BCEAh` | 38 | BIOS stack |
| `BCEBh–BE76h` | 396 | CCP state and stack |
| `BE77h–BEFFh` | 137 | BDOS state and stack |
| `BF00h–BF32h` | 51 | RAM BIOS table |
| `BF33h–BFE5h` | 179 | SD, keyboard and graphics LCD state |
| `BFE6h–BFFFh` | 26 | unused |

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
jump's address, and the `MOUNT` routine's scratch bytes, which the mount entry
also uses. The video terminal's
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
of a page (`src/layout.asm:73-74`). Chapter 15 describes it.

Above the table, from `SDBYTE` at `BF33h`, is state that the build puts at a
fixed offset from it, 51 bytes on (`src/ram.asm:192`). It starts with the SD
card driver's command argument, block address and last error. The block cache's
next line, failure flag and saved interrupt state follow. Next are the matrix
keyboard's scan state, the two display drivers' table addresses, the history's
head, `XMOVE`'s banks, `PZTOP` and the program return code `PRGCODE`. After
them come the PRL loader's and service loader's state and the registry's head.
The last items are the 128-byte record of `A:STARTUP.CMD` that startup reads,
and `CHPOS`, the next command, or piece, of a chained line (Chapter 11,
`src/ram.asm:193-240`). This state ends at
`WSEND`, `BFE6h`, and the build checks that it ends by `C000h`
(`src/ram.asm:241-242`, `tools/build.mjs:283`).

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
address in the drive's DPH (`src/vol.asm:496-570`).

A card of container format 1.1 whose drives field is N gets a 256-byte slot for
each of drives A to the Nth, mounted or not, so any of those drives can later
take any volume. Any other card, including every format 1.0 card, gets a slot
for each drive it mounts, of the size its volume needs (`src/vol.asm:517-545`).
`DRVSLOT` records each drive's slot: 0 for none, 1 for 64 bytes and 2 for 256
(`src/ram.asm:29`, `src/vol.asm:546-551`). The starter card is format 1.0 with
a G1M volume on A and a G8M volume on B. Its vectors take 64 and 256 bytes, 320
in all, from `B818h` to `B957h`.

Under the vectors goes the BDOS entry jump, `JP BENTRY`. CP/M 2.2's own BDOS
starts on a page boundary and is entered six bytes in, after its serial number.
The word at `0006h` therefore has the form `xx06h`, and TEC-OS gives its jump
the same form. `ALVINIT` takes the lowest vector's address, subtracts 9 and sets the low
byte to 6 (`src/vol.asm:571-576`). The result is the highest address of the
form `xx06h` at which the three-byte jump still ends below the vectors. For the
starter card that is `B806h`, and the bytes from `B809h` to `B817h` are left
unused. `STUBAD` keeps the address, and `PZINIT` writes the jump there. With no
service loaded, `PZTOP`, the word `PZINIT` puts at `0006h`, is this address
(`src/ram.asm:34`, `src/boot.asm:223-230`).

Every service keeps that form. A service's header and image are moved to a
page boundary below the BDOS entry jump, so the header's bytes at offset 6
are at an address of the form `xx06h`. They become the service's jump, and
loading the service lowers the word at `0006h` to that jump (`src/svc.asm:1-5`,
`src/svc.asm:16`, `src/boot.asm:121-124`). Chapter 20 describes the loader.

The word at `0006h` is the top of the TPA, so the card sets how much memory
programs have. The starter card gives 46,854 bytes, from `0100h` to `B805h`.
The largest card, four G8M volumes, takes four 256-byte vectors, puts the entry
at `B506h` and leaves 46,086 bytes. The build works out both figures in its
census and checks that the starter card's TPA is at least 45,830 bytes
(`tools/build.mjs:232-242`, `tools/build.mjs:286-287`).

## The four stacks

TEC-OS uses four stacks, and only the first is outside the workspace.

The boot stack starts at `8000h`, `BOOTSTK`, and grows down into fixed RAM
(`src/layout.asm:68`). Cold boot sets it first (`src/boot.asm:10`), because the
workspace is not yet known to be RAM. On this stack cold boot tests for a
reset, clears page zero and runs the RAM check. After the check has passed and
the workspace has been cleared, cold boot moves to the BIOS stack
(`src/boot.asm:22-28`).

The BIOS stack, `BSTKB` to `BSTK`, is 38 bytes at `BCC5h–BCEAh`
(`src/ram.asm:60-62`). Cold boot runs on it from the end of the RAM check. Warm
boot sets it as soon as EXPAND 0 is back in view (`src/boot.asm:66-69`), and
the diagnostic prompt sets it again on entry (`src/diag.asm:5`).

The CCP's stack, `CSTKBAS` to `CSTKTOP`, is 30 bytes at `BE59h–BE76h`
(`src/ram.asm:125-127`). The CCP sets it on entry and at the top of its main
loop. It is also the stack a program starts with. The CCP sets it again, pushes
the address of warm boot and jumps to `0100h`, which leaves the program 28
bytes below that return word (`src/cpm/ccp.asm:294-300`). CP/M 2.2 gives a
program eight levels of stack and the return word, and those take 18 of the
30 bytes (`src/layout.asm:79-80`). Below the stack is a
guard of 13 bytes, `STKGUARD`, which warm boot fills with `A5h`
(`src/ram.asm:119-124`, `src/boot.asm:282-286`), so a guard byte that is no
longer `A5h` shows that the stack went past its bottom.

The BDOS's stack, `STKBASE` to `STKTOP`, is 54 bytes at `BECAh–BEFFh`
(`src/ram.asm:187-189`). The BDOS moves to it on entry, keeping the caller's
stack pointer in `OLDSP`. It runs every function on this stack, the BIOS calls
from the BDOS included.

The three sizes in the workspace are equates in `layout.asm`: 54 for the BDOS,
30 for the CCP and 38 for the BIOS (`src/layout.asm:81-83`). The comment above
them gives the rule: each is the deepest use and a quarter more
(`src/layout.asm:76-77`).

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
depths include no NMI frame, as the comment at `src/layout.asm:77-79` says.

A loaded service runs on its caller's stack, so the services' own depths add
to these. `SVCLIM` gives the most that the services together may add to each
stack: 8 bytes on the BDOS's, 12 on the BIOS's and 6 on the CCP's
(`src/data3.asm:112`). Chapter 20 describes how the loader uses them.

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
| `BE00h–BEFFh` | 256 | free |
| `BF00h–BFFFh` | 256 | reserved |

The cache's lines and its table are at fixed addresses
(`src/layout.asm:24-26`), and so is the history's page, `HRING`
(`src/history.asm:14`). Chapter 19 describes the cache and Chapter 23 the
history. The page at `BE00h` is unused. The page at `BF00h` matches the RAM
BIOS table's page in EXPAND 0. Warm boot writes one jump into it, at `BF03h`,
for a program that ends with EXPAND 1 in view, and Chapter 14 describes that
jump. Only a program that writes the latch itself can end that way, since every
TEC-OS routine that puts EXPAND 1 in view puts EXPAND 0 back before it returns.

CP/M 3's `XMOVE` and `MOVE` copy between banks, and TEC-OS gives them to
programs through BDOS function 50 (`src/cpm/bdos.asm:135-137`). They treat
bank 1 as EXPAND 1 from `8000h` up to a low mark, `XMARK`. Cold boot sets the
mark to `80h`, the start of the window, so that bank 1 has no bytes a program may copy to or from
(`src/xmove.asm:1-7`, `src/boot.asm:163-165`, `src/layout.asm:23`). `MVRANGE`
rejects every range in bank 1 that does not lie between `8000h` and the mark,
and in bank 0 every range that does not end by the word at `0006h`
(`src/xmove.asm:147-169`). TEC-OS's own copies, from the cache's lines to the
DMA buffer and back, use the same routine without the check, `MVCOPY`
(`src/xmove.asm:27-37`, `src/cache.asm:259-269`).

All three resident stacks are in the window, so the routines that put EXPAND 1
in view use no stack until EXPAND 0 is back. A `PUSH` with EXPAND 1 in view
would write into EXPAND 1, and the `POP` after it would read EXPAND 0. The
cache's routines, the history's and `DETECT`, which counts the regions at cold
boot, state the rule at their heads (`src/cache.asm:10-13`,
`src/history.asm:16-18`, `src/boot.asm:185-188`). The SD card driver's block
loops keep to it when a cache line is the buffer (`src/sd.asm:258-260`).
