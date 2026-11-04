---
title: The memory map
parent: TEC-OS
nav_order: 14
nav_group: "Part II: Inside TEC-OS"
---

# 14. The memory map

<!-- Checked against TEC-OS 78127ec. -->

TEC-OS keeps its own state in the top of EXPAND 0, in one byte of page zero
and in EXPAND 1. Each part of it is cleared by a different event. Chapter 8
describes the 64 KiB from a program's side. This chapter describes it from
TEC-OS's side: what is where, why, and which of it a cold boot, a warm boot or
neither clears. The addresses are those of the build at 78127ec
with the starter card in the socket, and Appendix C lists them byte by byte.

## The window and the latch

The Z80's address space has three regions. `0000h–7FFFh` is the board's fixed
RAM, `8000h–BFFFh` is a window onto one half of the RAM chip in U9, and
`C000h–FFFFh` is the ROM (`src/layout.asm:3-4`). The window's two halves are
EXPAND 0 and EXPAND 1, each 16 KiB.

The system latch at port `FFh` selects what is in view (`src/layout.asm:14`).
Bit 2, `LATEXP`, selects EXPAND 1 when it is set (`src/layout.asm:20`). Bit 0,
`LATSHAD`, high, turns off the boot overlay (`src/layout.asm:17`). The overlay
is the copy of the ROM's first 2 KiB that the board shows at `0000h` after a
reset. TEC-OS
runs with the latch at `LATCLAS`, `01h`: the overlay off and EXPAND 0 in view
(`src/layout.asm:21`).

The latch can be written but not read, so TEC-OS keeps what it last wrote in a
byte of page zero, `LATCHV` at `0040h` (`src/layout.asm:39`). A routine that
changes the bank for a moment reads `LATCHV`, sets `LATEXP` in it and writes
the result to the port. It writes `LATCHV` to the port unchanged when it is
done. The block cache's lookup is the pattern. It puts EXPAND 1 in view to
search the table of cache lines there, and ends with `LD A,(LATCHV)` and
`OUT (SYSLAT),A` (`src/cache.asm:24-26`, `src/cache.asm:56-57`). Because each
routine starts from `LATCHV`, a bank change leaves the latch's other bits as
they were. The matrix keyboard's Caps key toggles bit 7, which lights the Caps
LED, in `LATCHV` and in the latch together (`src/keyboard.asm:110-115`).

The latch moves `8000h–BFFFh` from one half to the other, so anything TEC-OS
reads while EXPAND 1 is in view has to be outside the window. `LATCHV` is that
byte, and it is the only state TEC-OS keeps in page zero
(`src/layout.asm:36-39`). The cache's copy routine `MVCOPY` also
reads and writes the part of a program's buffer that lies below `8000h` with
EXPAND 1 in view (`src/cache.asm:401-412`).

## Page zero as TEC-OS writes it

CP/M puts its fixed addresses in the first 256 bytes of memory, and TEC-OS
writes them as CP/M 2.2 does. Cold boot clears all of page zero
(`src/boot.asm:29-35`), and `PZINIT`, at cold boot and at every warm boot,
writes the parts TEC-OS sets (`src/boot.asm:221-283`):

| Address | Contents |
| --- | --- |
| `0000h` | `JP BF03h`, the warm boot entry of the RAM BIOS table |
| `0003h` | the IOBYTE |
| `0004h` | the current drive in bits 0–3 and the user number in bits 4–7 |
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
(`src/boot.asm:230-231`). It then rewrites the restart vectors, and one that
jumps above the top of the TPA, into a service, the workspace or the ROM,
keeps its jump (`src/boot.asm:238-283`). Chapter 15 explains the rule.

`PZINIT` doesn't write `0050h`. The CCP stores there the drive byte of the
command's FCB just before it starts a program, as CP/M 3 does. A program the
CCP found on A: by its search finds 1 there (`src/layout.asm:31`,
`src/cpm/ccp.asm:317-319`). Chapter 20 describes the search. The bytes
`0041h–004Fh` are the rest of the sixteen that CP/M 2.2 leaves to the BIOS,
and cold boot's clear leaves them 0. The console's state, which some BIOSes
keep there, is at the top of the workspace.

## The workspace and what clears it

The resident workspace is at the top of EXPAND 0, above the BDOS entry jump
and the allocation vectors. With the starter card in the socket and no service
loaded, memory from that jump to `BFFFh` is laid out like this. The last column
says which event clears each part:

| Addresses | Bytes | Region | Cleared by |
| --- | ---: | --- | --- |
| `B9A4h–B9A6h` | 3 | the BDOS entry jump | neither |
| `B9A7h–BAE6h` | 320 | the allocation vectors | neither |
| `BAE7h–BCC4h` | 478 | the BIOS's disk state and buffers, the PICO9918 console's block and the video terminal's state | cold boot |
| `BCC5h–BCECh` | 40 | the BIOS stack | cold boot |
| `BCEDh–BDB6h` | 202 | the CCP's two FCBs and its command line | cold boot |
| `BDB7h–BE75h` | 191 | the CCP's state, scratch, stack guard and stack | cold boot and warm boot |
| `BE76h–BEFFh` | 138 | the BDOS's state and stack | cold boot and warm boot |
| `BF00h–BF32h` | 51 | the RAM BIOS table | neither |
| `BF33h–BFFFh` | 205 | the SD card's, cache's, keyboard's, consoles', loader's, startup's and chained line's state, and the `MOUNT` routine's scratch | cold boot |

The image initialises none of it. `ram.asm` reserves each byte with `DS`, and
the two boots clear and set it (`src/ram.asm:1-4`). Cold boot clears the whole
workspace, from `WSBASE` at `BAE7h` to `WSEND` at `C000h`, in one `LDIR`
(`src/boot.asm:37-41`). Warm boot's `CPMINIT` clears 329 bytes, from `CCPCLR`
at `BDB7h` to `BDOSRME` at `BF00h`. The CCP and the BDOS then start each
program as a fresh load of them from disk would (`src/boot.asm:288-300`).
Everything else in the table outlives a warm boot, and the chapters that rest
on that fact point here: the drive table (Chapter 17), the logged-in drives
(Chapter 19), a chained line's command buffer (Chapter 21), the width `CON`
gave the PICO9918's console (Chapter 16), the services and their registry
(Chapter 24) and the startup file's record (Chapter 25).

Within the parts it keeps, warm boot sets a few bytes. It writes `LATCHV`
and the latch (`src/boot.asm:93-95`). It gives back the PICO9918 if a program
claimed it (`src/boot.asm:97-99`). It clears the flag that marks a service's
`INIT` or `REMOVE` as running (`src/boot.asm:101-102`) and puts the scroll
region and the display's mode back (`src/boot.asm:104-107`). `CPMINIT` also
sets the command buffer's maximum length to 127 and clears `BUFOK`, the key
that lets a write skip the read of its block, so the first write after a warm
boot reads its block (`src/boot.asm:301-311`). The flush at the end of warm
boot clears `CHPOS`, a chained line's position, when a write is lost
(`src/cache.asm:392-395`). Chapter 15 lists warm boot's steps in order.

The two regions marked neither are placed, not cleared. Cold boot places the
jump and the vectors after it has read the card, as the next section
describes. Each warm boot writes the jump again (`src/boot.asm:232-237`).
The BDOS fills a vector when it logs the drive in. Cold boot copies the RAM
BIOS table from the ROM, and warm boot leaves it. An entry a program has
replaced therefore stands until the next cold boot, as it does on CP/M 2.2
(`src/boot.asm:75-78`).

The part from `WSBASE` to `BEFFh`, 1,049 bytes, has fixed addresses for a
given build. Chapter 13 describes how the build places it so that it ends at
`BF00h`. It is three blocks, the BIOS's from `DSKCUR`, the CCP's from
`CCPRAM` and the BDOS's from `BDOSRAM`, each ending in its stack
(`src/ram.asm:9-77`, `src/ram.asm:82-139`, `src/ram.asm:142-216`). The RAM
BIOS table at `BF00h` is seventeen three-byte jumps at the start of a page
(`src/layout.asm:61-62`), which Chapter 16 describes. Above it, from `SDBYTE`
at `BF33h`, the build puts the rest at a fixed offset from the table, 51 bytes
on (`src/ram.asm:218`). That part ends at `WSEND`, `C000h`, with no byte
unused, and the build checks that it ends by `C000h` (`src/ram.asm:301-302`,
`tools/build.mjs:261`). Appendix C names every byte of the three blocks and of
the part above the table.

A program reads the console's size through the hardware service `INFO`. It
returns `VWID` in `L` and `VHGT` in `H` from the console's state above the
table (`src/services.asm:56-63`). Chapter 16 describes the rest of that state.

## The allocation vectors and the BDOS entry

A CP/M drive's allocation vector has one bit for each allocation block of its
disk, set while the block is in use. The BDOS keeps the vector in memory while
the drive is logged in. A drive is logged in once the BDOS has built the vector
from the directory, as Chapter 19 describes. Its size is `DSM / 8 + 1` bytes, where
`DSM` is the number of the disk's last allocation block. A G1M volume, with
`DSM` 511, needs 64 bytes, and a G8M volume, with `DSM` 2047, needs 256.

Each of the four drives has a 16-byte disk parameter header in the workspace
whatever the card holds (`src/ram.asm:34`, `src/layout.asm:77`). The vectors
are placed only after cold boot has read the card, because the space each
drive gets depends on the card. `ALVINIT` starts at `WSBASE` and works
down, giving each drive its vector in drive order. It puts each vector's
address in the drive's disk parameter header, its DPH
(`src/boot.asm:385-461`). A card of container format 1.1 whose header names
N drives gets a 256-byte slot for each of drives A to the Nth, mounted or not.
Any of those drives can then take any volume. Any other card, every
format 1.0 card among them, gets a slot for each drive it mounts, of the size
its volume needs (`src/boot.asm:402-430`). `DRVSLOT` records each drive's
slot: 0 for none, 1 for 64 bytes and 2 for 256 (`src/ram.asm:31-33`,
`src/boot.asm:431-436`). The starter card is format 1.0 with a G1M volume on A
and a G8M volume on B. Its vectors take 64 and 256 bytes, 320 in all, from
`B9A7h` to `BAE6h`.

Directly under the vectors goes the BDOS entry jump, `JP BENTRY`. `ALVINIT`
takes the lowest vector's address and subtracts 3 (`src/boot.asm:456-461`).
For the starter card that puts the jump at `B9A4h`, with no byte between it
and the vectors. `STUBAD` keeps the address, and `PZINIT` writes the jump
there. With no service loaded, `PZTOP`, the word `PZINIT` puts at `0006h`, is
this address (`src/ram.asm:39`, `src/boot.asm:230-237`).

A service's header and image are moved to a page boundary below the BDOS
entry jump. The loader writes `JP BENTRY` over the header's first three bytes,
at offset 0 of the page. It then lowers the word at `0006h` to that address,
of the form `xx00h` (`src/loader.asm:1-16`, `src/loader.asm:229-241`). Chapter 24
describes the loader.

The word at `0006h` is the top of the TPA, so the card sets how much memory
programs have. The starter card gives 47,268 bytes, from `0100h` to `B9A3h`.
The largest card, four G8M volumes, takes four 256-byte vectors, puts the entry
at `B6E4h` and leaves 46,564 bytes. The build works out both figures in its
census and checks that the starter card's TPA is at least 45,830 bytes
(`tools/build.mjs:214-224`, `tools/build.mjs:264-265`).

## The four stacks

TEC-OS uses four stacks, and only the first is outside the workspace.

The boot stack starts at `8000h`, `BOOTSTK`, and grows down into fixed RAM
(`src/layout.asm:56`). Cold boot sets it first (`src/boot.asm:24`), because
the workspace is not yet known to be RAM. On this stack cold boot tests for a
reset, clears page zero and runs the RAM check. After the check has passed and
the workspace has been cleared, cold boot moves to the BDOS's stack
(`src/boot.asm:36-42`).

The BIOS stack, `BSTKB` to `BSTK`, is 40 bytes at `BCC5h–BCECh`
(`src/ram.asm:75-77`). Warm boot sets it as soon as EXPAND 0 is back in view
and runs on it (`src/boot.asm:92-96`).

The CCP's stack, `CSTKBAS` to `CSTKTOP`, is 32 bytes at `BE56h–BE75h`
(`src/ram.asm:136-138`). The CCP sets it on entry and at the top of its main
loop, and it is also the stack a program starts with. The CCP sets it again,
pushes the address of warm boot and jumps to `0100h`. That leaves the program
30 bytes below the return word (`src/cpm/ccp.asm:317-326`). CP/M 2.2 gives a
program eight levels of stack and the return word, and those take 18 of the
32 bytes (`src/layout.asm:64-70`). Below the stack is a guard of 11 bytes,
`STKGUARD`, which warm boot fills with `A5h` (`src/ram.asm:130-135`,
`src/boot.asm:305-309`). The guard and the stack share 43 bytes
(`src/layout.asm:72`, `src/ram.asm:133-137`). A guard byte that is no longer
`A5h` shows that the stack went past its bottom.

The BDOS's stack, `STKBASE` to `STKTOP`, is 54 bytes at `BECAh–BEFFh`
(`src/ram.asm:213-215`). The BDOS moves to it on entry, keeping the caller's
stack pointer in `OLDSP`. It runs every function on it, the BIOS calls from
the BDOS included. Cold boot uses it too, because nothing calls the BDOS
before the CCP runs. Cold boot sets it after the workspace's clear and again
at `COLDRT`, where a retry from the diagnostic prompt comes back
(`src/boot.asm:42`, `src/boot.asm:63`). The console's start, the banner, the
mount, the drive listing and the diagnostic prompt all run on it. `DIAG` is
entered only by `COLDRT`'s jumps, with the stack at its top, and runs on it as
it finds it (`src/boot.asm:463-470`).

The three sizes in the workspace are equates in `layout.asm`: 54 for the
BDOS, 32 for the CCP and 40 for the BIOS (`src/layout.asm:71-73`). The comment
above them gives the rule. Each holds its base, the deepest use with no service
loaded, and the most the services may add to it, with a quarter of it still
free. The base of the BIOS's stack is warm boot's, 18 bytes, and the CCP's is
also 18 (`src/layout.asm:64-70`).

The sizes rest on a measurement, `test/stacks.test.mjs`. The test boots the
model under the heaviest workloads of the test suite. It runs them on each console, on a
volume written behind, without a card, on chained lines and on the CCP's
deepest paths. It records every write to memory, the clearing `LDIR`s
excepted, and the lowest address written in each stack gives its depth. It
passes when each stack's deepest use leaves at least a quarter of it free and
no guard byte has changed. Each stack's base with its services' limit must
also take at most three quarters of it (`test/stacks.test.mjs:212`,
`test/stacks.test.mjs:245-258`). It presses the keypad's NMI at each new depth
only while `0066h` holds a `RETN` (`test/stacks.test.mjs:62-69`). TEC-OS puts
no handler there, so the measured depths include no NMI frame, as the comment
at `src/layout.asm:64-70` says.

A loaded service runs on its caller's stack, so the services' own depths add
to these. `SVCLIM` gives the most that the services together may add to each
stack: 8 bytes on the BDOS's, 12 on the BIOS's and 6 on the CCP's
(`src/tables.asm:96`). The figures together:

| Stack | Reserved | Base | Census | `SVCLIM` |
| --- | ---: | ---: | ---: | ---: |
| BDOS | 54 | 30 | 30 | 8 |
| BIOS | 40 | 18 | 18 | 12 |
| CCP | 32 | 18 | 18 | 6 |

The census column is the deepest use the test found in any run, and the base
is the same figure from the runs with no service loaded
(`test/stacks.test.mjs:236-237`, `test/stacks.test.mjs:253-255`). The base
with `SVCLIM` gives 38 of 54, 30 of 40 and 24 of 32, so each stack
keeps a quarter free with its limit taken. Chapter 24 describes how the loader
holds each service to its share.

## EXPAND 1 and the no-stack rule

EXPAND 1 is TEC-OS's own, and no call of the BDOS, the BIOS or the hardware
services gives a program a range in it. Cold boot clears all 16 KiB of it and
marks every cache line empty, as Chapter 15 describes, and warm boot leaves
it. Its pages are:

| Addresses | Bytes | Contents |
| --- | ---: | --- |
| `8000h–BBFFh` | 15,360 | the block cache's 30 lines, 512 bytes each |
| `BC00h–BC77h` | 120 | each line's card block, 4 bytes, `FFFFFFFFh` while empty |
| `BC80h–BC9Dh` | 30 | each line's dirty byte, nonzero while the line holds changes the card lacks |
| `BD00h–BDFFh` | 256 | the command history |
| `BE00h–BFFFh` | 512 | free |

The cache's lines and its table are at fixed addresses
(`src/layout.asm:23-25`), and so is the history's page, `HRING`
(`src/history.asm:14`). Chapter 18 describes the cache and Chapter 22 the
history. The cache's copies between its lines and a program's buffer go
through `MVCOPY`, which copies between EXPAND 0 and EXPAND 1
(`src/cache.asm:401-412`).

All three resident stacks are in the window, so a routine that puts EXPAND 1
in view uses no stack until EXPAND 0 is back. A `PUSH` with EXPAND 1 in view
would write into EXPAND 1, and the `POP` after it would read EXPAND 0. The
cache's routines, the history's and `DETECT`, which the RAM check calls to find
EXPAND 1, state the rule at their heads (`src/cache.asm:10-13`,
`src/history.asm:16-19`, `src/boot.asm:190-194`). The SD card driver's block
loops keep to it when a cache line is the buffer (`src/sd.asm:321-325`). The
same rule reaches a program: one that switches EXPAND 1 in has lost its stack
and the BDOS before it writes a byte, as Chapter 8 says.
