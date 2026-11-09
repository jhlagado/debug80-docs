---
title: State and memory inside TEC-OS
parent: TEC-OS
nav_order: 14
nav_group: "Inside TEC-OS"
---

# 14. State and memory inside TEC-OS

<!-- Source-only reading against release-1 TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     This is not final artifact qualification. Address examples and measured stack
     figures explicitly labelled 78127ec retain that historical provenance. -->

A program ends and the command prompt returns. The next program has a fresh BDOS
workspace while your command history and installed services remain in RAM. A
reset clears much more RAM. The difference comes from the addresses the boot
routines clear and the state they rebuild afterwards.

The CCP processes commands and the BDOS supplies file and console calls. The
BIOS operates the board for them. Their code is in ROM while their changing
state is in RAM. The numbered ROM services also provide access to the board's
own devices, including the digits, 20 × 4 character LCD and speaker. Console
output can go to serial, the PICO9918 or the graphics LCD. The SD container
holds several volumes. The separate expansion bank holds the block cache and
command history so those buffers occupy none of the transient program area (TPA)
(`a1023bd:src/rom.asm:17-44`, `a1023bd:src/layout.asm:77-86`,
`a1023bd:format/format.json:20-25`, `a1023bd:src/services.asm:1-19`,
`a1023bd:src/abi.inc:62-103`).

## Two banks at the same addresses

The Z80 can address 64 KiB at once. The TEC-1G's fixed RAM occupies
`0000h–7FFFh` and the ROM occupies `C000h–FFFFh`. Between them `8000h–BFFFh` is
a 16 KiB bank window onto either half of the RAM in U9. The two halves are
EXPAND 0 and EXPAND 1. Selecting a bank changes the bytes visible at those
addresses (`a1023bd:src/layout.asm:1-7`, `a1023bd:src/abi.inc:288-289`).

Programs normally run with EXPAND 0 selected. Their upper buffers share
that bank with the resident workspace and stacks. EXPAND 1 contains the
cache and history instead. The address `BF00h` reaches the
RAM BIOS table in EXPAND 0 but a different byte in EXPAND 1. Fixed RAM
and ROM remain visible during this switch.

The system latch at port `FFh` controls the window. Its bit 2 selects
EXPAND 1 when set. Bit 0 turns off the boot overlay when set.
After reset that overlay shows the first 2 KiB of ROM at `0000h–07FFh`.
Cold boot removes it and selects EXPAND 0 with `LATCLAS`, `01h`
(`a1023bd:src/layout.asm:19-28`, `a1023bd:src/abi.inc:286-289`, `a1023bd:src/reset.asm:1-13`,
`a1023bd:src/boot.asm:35-59`).

The latch is write-only so TEC-OS stores its normal value in `LATCHV` at
`0040h`, below the banked window. A temporary bank switch reads that byte,
sets bit 2 in the value sent to the port and restores the saved normal
value afterwards. The cache lookup does this around its table scan.
The other latch bits survive the temporary switch, including Caps Lock's
bit 7. The keyboard routine toggles that bit in both `LATCHV` and the
latch (`a1023bd:src/layout.asm:64-69`, `a1023bd:src/abi.inc:291-293`, `a1023bd:src/cache.asm:37-92`,
`a1023bd:src/keyboard.asm:137-143`).

CP/M reserves `0040h–004Fh` for BIOS scratch. TEC-OS uses only `0040h`
there and cold boot leaves the other fifteen bytes zero.
Console state is above the RAM BIOS table. `MVCOPY` can access program
buffers below `8000h` while EXPAND 1 is selected for transfers to fixed RAM
(`a1023bd:src/layout.asm:64-69`, `a1023bd:src/abi.inc:291-293`, `a1023bd:src/ram.asm:416-434`,
`a1023bd:src/cache.asm:576-584`).

## The workspace across a program exit

The workspace has a fixed position for a given build. Below the RAM BIOS
table at `BF00h` are the BIOS, CCP and BDOS blocks, each ending in a
stack. Above the table are the SD driver, cache controls and other retained
state. `ram.asm` reserves these bytes with `DS`. Initialisation comes from
the boot code rather than bytes loaded from the ROM image
(`a1023bd:src/ram.asm:1-11`, `a1023bd:src/ram.asm:131-139`,
`a1023bd:src/ram.asm:204-217`, `a1023bd:src/ram.asm:295-307`).

Cold boot clears the workspace from `WSBASE` to `WSEND`. Warm boot clears a
shorter span, from `CCPCLR` through the end of the BDOS block. The CCP's two
file control blocks (FCBs) and command buffer lie below that span. Its parser
scratch and stack lie inside it, as does the whole BDOS block. The unexecuted
command text therefore remains available across an ordinary exit while the next
program starts with fresh BDOS state (`a1023bd:src/boot.asm:61-66`,
`a1023bd:src/boot.asm:384-404`, `a1023bd:src/ram.asm:141-217`).

The storage regions receive these treatments at warm boot:

| Storage | Warm-boot treatment |
| --- | --- |
| BIOS disk and display state | Outside the clearing sweep, with selected fields restored separately |
| CCP FCBs and command text | Outside the sweep |
| CCP working state and BDOS block | Cleared by `CPMINIT` |
| RAM BIOS jump table | Left in place |
| State above that table | Outside the sweep, with selected fields updated separately |
| EXPAND 1 | Outside the sweep, with dirty cache lines flushed |

A retained byte can still receive a new value. Warm boot restores EXPAND 0
and `LATCHV`, releases a program's PICO9918 claim and clears the service
loader's busy flag. It restores the video mode and scroll region too.
`CPMINIT` sets the DMA address to `0080h`, restores the command buffer's
maximum of 127 and fills the stack guard with `A5h`
(`a1023bd:src/boot.asm:128-149`, `a1023bd:src/boot.asm:384-404`).

It also clears `BUFOK`, the BIOS key for continuing writes without a
pre-read. A write after warm boot cannot reuse that old key.
A newly allocated block can still qualify for clearing without a read.
At the end of warm boot the cache flush writes pending changes.
If a write fails, its line is dropped and `CWBOOT` clears `CHPOS` before
printing `Write lost`. The remaining command chain is then cancelled
(`a1023bd:src/boot.asm:402-404`, `a1023bd:src/bios.asm:340-388`,
`a1023bd:src/cache.asm:265-299`, `a1023bd:src/cache.asm:566-572`).

The drive table and logged-in vector remain in the BIOS block.
The installed-service registry, program return code and startup position
remain above the RAM BIOS table. The PICO9918 width remains in its console
block. Those values remain available while warm boot reconstructs the next
program's environment. Reset follows the cold path and clears these regions,
although a recognised reset can reconstruct a retained drive selection
(`a1023bd:src/ram.asm:37-69`, `a1023bd:src/ram.asm:71-99`,
`a1023bd:src/ram.asm:376-420`, `a1023bd:src/boot.asm:35-65`,
`a1023bd:src/boot.asm:99-102`).

Cold boot copies seventeen three-byte BIOS jumps from ROM to `BF00h`. Warm boot
leaves that table in place so a replacement entry survives a program exit. The
allocation vectors are filled when the BDOS logs their drives in. The three-byte
BDOS entry is written by `PZINIT` on each warm boot
(`a1023bd:src/layout.asm:98-99`, `a1023bd:src/boot.asm:106-109`,
`a1023bd:src/boot.asm:307-312`).

The build derives `WSBASE` so the lower workspace ends at `BF00h`.
The state above the table starts 51 bytes later at `BF33h`.
Source reservations extend to `WSEND` at the end of that region and the
build checks that they stay below the ROM. These are placement checks,
not checks on every store a program makes. Appendix C has the individual
variables and their historical addresses
([resident workspace](appendix-c-memory-map.md#the-resident-workspace)).
Through `INFO` a program obtains `VWID` in `L` and `VHGT` in `H`.
It can read the console dimensions without using variable addresses
(`a1023bd:tools/build.mjs:237-267`, `a1023bd:src/ram.asm:305-307`,
`a1023bd:src/ram.asm:462-464`, `a1023bd:src/services.asm:80-87`).

## Allocation vectors below the workspace

The workspace ends at fixed addresses for a build but the allocation
vectors below it depend on the card. Each vector has a bit for every
allocation block of its volume. A set bit marks a block in use.
The BDOS builds that map from the directory when the drive is logged in.
It can then allocate blocks by scanning RAM.
The vector needs `DSM / 8 + 1`
bytes, where `DSM` is the last allocation block number. G1M's `DSM` of
511 needs 64 bytes and G8M's 2047 needs 256
(`a1023bd:format/format.json:47-59`, `a1023bd:src/cpm/bdoslog.asm:169-286`,
`a1023bd:src/cpm/bdosrec.asm:557-628`).

Every drive has a 16-byte disk parameter header, or DPH, in the workspace.
Its allocation-vector pointer is filled by `ALVINIT` after the card mounts.
The routine starts at `WSBASE` and subtracts each slot's size in drive
order. A format 1.1 card can specify a drive count in its header.
A nonzero count reserves that many 256-byte slots, starting with A and
including unmounted drives. Each can hold either supported
geometry's vector
(`a1023bd:src/layout.asm:117-119`, `a1023bd:src/ram.asm:57-68`,
`a1023bd:src/boot.asm:522-549`).

With no drives field, including every format 1.0 card, only mounted drives
receive slots. Each slot is sized from its volume's `DSM`. `DRVSLOT` records 0
for no slot, 1 for 64 bytes and 2 for 256. A later mount must fit the slot
allocated at cold boot. The starter card's G1M on A and G8M on B therefore need
320 bytes. Four G8M-sized slots need 1,024 bytes and reduce the TPA by another
704 bytes (`a1023bd:src/boot.asm:555-619`, `a1023bd:src/volsvc.asm:254-266`).

`ALVINIT` reserves three more bytes for the BDOS entry stub directly below the
lowest vector. `STUBAD` stores that address and `PZINIT` writes `JP BENTRY`
there. With no resident service, `PZTOP` is the stub address. The word at
`0006h` contains that same top-of-TPA value. A service occupies whole pages
below it. Its relocated header starts with another `JP BENTRY` and the word at
`0006h` is lowered to the service's page boundary
(`a1023bd:src/boot.asm:104-105`, `a1023bd:src/boot.asm:615-620`,
`a1023bd:src/boot.asm:297-312`, `a1023bd:src/loader.asm:1-10`,
`a1023bd:src/loader.asm:327-340`, `a1023bd:src/loader.asm:485-490`).

The earlier `78127ec` build gives a concrete example of that subtraction.
Its workspace began at `BAE7h`, above the starter vectors at `B9A7h–BAE6h`
and the stub at `B9A4h–B9A6h`. Programs had 47,268 bytes from
`0100h` to `B9A3h`. With four full-sized slots the stub was at `B6E4h`
and the TPA was 46,564 bytes. These are the historical figures in
[Appendix C](appendix-c-memory-map.md#the-cpu-s-address-space),
with their original build provenance. The workspace below `BF00h` occupied
1,049 bytes in that build. The warm-boot sweep cleared 329 of them, from
`BDB7h` through `BEFFh`. The 205 bytes above the RAM BIOS table extended
from `BF33h` through `BFFFh`.
The offered build still checks a minimum starter TPA of 45,830 bytes
(`a1023bd:tools/build.mjs:223-232`, `a1023bd:tools/build.mjs:270-271`).

## Page zero is rebuilt selectively

Page zero provides fixed entry points below the program area.
Cold boot clears the first 256 bytes. Then `PZINIT` writes the jumps
needed by programs. At `0000h` it writes `JP BF03h`, the RAM BIOS
warm-boot entry. At `0005h` it writes the jump through `PZTOP`.
Warm boot repeats those writes and rewrites the stub.
It leaves the IOBYTE at `0003h` and drive/user byte at `0004h` unchanged
(`a1023bd:src/boot.asm:52-59`, `a1023bd:src/boot.asm:297-312`).

The restart vectors receive a separate sweep. A vector keeps a `JP`
whose target is strictly above `PZTOP` in resident memory or ROM.
Other vectors receive seven zero bytes followed by `RET`.
At `0038h` the default is `EI` followed by `RETI` unless a qualifying
jump was preserved there. Cold boot selects interrupt mode 1, whose
maskable interrupt enters at `0038h`
(`a1023bd:src/boot.asm:326-368`, `a1023bd:src/boot.asm:40-40`).

The CCP fills the program's FCB at `005Ch` and command tail at `0080h`
before launch. That tail storage is also the default DMA buffer.
The load-drive byte at `0050h` is written by the CCP, not `PZINIT`.
It contains the command FCB's drive byte, with 0 for the current drive
and 1 for A. A program found by fallback to A therefore receives 1.
The full page-zero table is in
[Appendix C](appendix-c-memory-map.md#page-zero)
(`a1023bd:src/cpm/ccp.asm:459-490`,
`a1023bd:src/cpm/ccpcmd.asm:400-450`, `a1023bd:src/layout.asm:44-69`, `a1023bd:src/abi.inc:291-293`).

## Four stacks for different stages

Cold boot starts with `SP` at `BOOTSTK`, `8000h`, so its stack grows down
into fixed RAM. It can clear page zero and check the expansion RAM
without depending on a stack in the untested window. After the check and
workspace clear, it switches to `STKTOP`, the BDOS stack.
`COLDRT` sets that stack again for each diagnostic retry.
The console initialisation, banner, mount, drive listing and diagnostic
prompt use it before the CCP starts
(`a1023bd:src/layout.asm:94`, `a1023bd:src/boot.asm:35-68`,
`a1023bd:src/boot.asm:79-93`, `a1023bd:src/boot.asm:97-111`).

Warm boot selects EXPAND 0 before setting
`SP` to `BSTK`, the top of the 40-byte BIOS stack.
Its clearing sweep can then erase the CCP and BDOS stacks safely.
The CCP's own stack is 32 bytes from `CSTKBAS` to `CSTKTOP`.
At program launch the CCP resets `SP` there and pushes the warm-boot
address before jumping to `0100h`. That return word leaves 30 bytes
below it for the program's calls and saved registers
(`a1023bd:src/boot.asm:128-141`, `a1023bd:src/layout.asm:113-115`,
`a1023bd:src/ram.asm:204-209`, `a1023bd:src/cpm/ccp.asm:477-490`).

A BDOS call switches to its 54-byte stack from `STKBASE` to `STKTOP`.
`BENTRY` stores the caller's `SP` in `OLDSP` and runs the function on
that separate stack, including BIOS calls made by the function.
The result path restores `SP` before returning to the program.
The caller's stack therefore retains the return word while BDOS runs
(`a1023bd:src/ram.asm:295-298`, `a1023bd:src/cpm/bdos.asm:120-123`,
`a1023bd:src/cpm/bdos.asm:204-208`).

Below the CCP stack is an eleven-byte guard. It shares a 43-byte
reservation with the 32-byte stack. Warm boot writes `A5h` into each
guard byte. A different value is evidence of an overwrite below the
stack, though the byte alone cannot identify which instruction wrote it.
CP/M's eight call levels plus the inherited return word occupy 18 bytes
of the reserved stack (`a1023bd:src/ram.asm:204-209`,
`a1023bd:src/boot.asm:395-401`, `a1023bd:src/layout.asm:101-115`).

The historical census at `78127ec` measured 30 bytes for BDOS and 18 each
for BIOS and CCP with no loaded services. The deepest census values were
the same. The service limits were 8, 12 and 6 respectively.
Base plus limit therefore used 38 of 54 bytes, 30 of 40 and 24 of 32.
Each left at least a quarter free. These are historical host-model
measurements, not results from the offered build.
[Appendix C](appendix-c-memory-map.md#the-stacks) retains the
historical stack addresses and reservations.

The offered source declares the same reservations and service limits. A loaded
service runs on its caller's stack so its nested use adds to that caller's
depth. `SVCLIM` limits the combined service declarations on each resident stack.
The stack test watches memory writes and excludes `LDIR` writes from its depth
calculation. Its workloads include the consoles, write-behind, diagnostic
failures, command chains and deep CCP paths. It checks the guard and requires
both measured use and base plus service limit to leave a quarter free. Reading
these assertions establishes the test's scope, not a fresh passing result
(`a1023bd:src/tables.asm:139-144`, `a1023bd:src/loader.asm:216-245`,
`a1023bd:src/abi.inc:32-50`, `a1023bd:test/stacks.test.mjs:43-78`,
`a1023bd:test/stacks.test.mjs:212-264`).

The test triggers a keypad non-maskable interrupt (NMI) only at a new stack
depth where `0066h` contains `RETN`. The quoted depths exclude an NMI frame
because TEC-OS installs no handler there. A keypad interrupt normally enters
inside the default FCB at `005Ch`. The required disabled keypad NMI jumper
prevents that entry into FCB bytes during ordinary use
(`a1023bd:test/stacks.test.mjs:1-11`, `a1023bd:test/stacks.test.mjs:59-69`).

## EXPAND 1 and the stack boundary

EXPAND 1 contains 30 cache lines of 512 bytes at `8000h–BBFFh`.
Their four-byte card-block keys occupy `BC00h–BC77h` and their dirty
bytes occupy `BC80h–BC9Dh`. An empty line has key `FFFFFFFFh`.
A nonzero dirty byte marks data newer than the card's copy.
The history ring occupies `BD00h–BDFFh`. The final 512 bytes at
`BE00h–BFFFh` are unused. The cache and history addresses are fixed
in the source (`a1023bd:src/cache.asm:1-16`,
`a1023bd:src/layout.asm:39-42`, `a1023bd:src/history.asm:1-16`).

Cold boot clears that whole 16 KiB bank and marks the cache lines empty.
Warm boot leaves the history and cache storage in place and flushes
pending writes. No BDOS, BIOS or numbered hardware call allocates a
program buffer in EXPAND 1. A direct write there can corrupt a cached
block whose bytes may later be written to the card
(`a1023bd:src/boot.asm:232-249`, `a1023bd:src/cache.asm:254-299`).

All three resident stacks are in the banked window. Selecting EXPAND 1
hides their saved registers and return addresses along with the workspace
and RAM BIOS table. A `PUSH` then writes the other bank.
Restoring EXPAND 0 before a `POP` would read different bytes.
Calls, returns and interrupts also use the stack.
During an EXPAND 1 access the resident routines hold maskable interrupts
off and use registers for temporary values. The history access saves flags
before switching banks. It restores EXPAND 0 before popping those flags
and restores the saved interrupt state
(`a1023bd:src/history.asm:30-62`, `a1023bd:src/bios.asm:410-440`).

The cache lookup, RAM-detection routine and SD block loops obey the same
visibility rule. `MVCOPY` can copy directly between a cache line and fixed RAM
with EXPAND 1 selected. For a buffer in EXPAND 0 it switches the window between
each byte's read and write. Temporary values stay in registers until the normal
bank is visible again (`a1023bd:src/cache.asm:48-92`,
`a1023bd:src/cache.asm:587-736`, `a1023bd:src/boot.asm:251-288`,
`a1023bd:src/sd.asm:466-571`, `a1023bd:src/sd.asm:583-652`).

Your program's stack may also be in EXPAND 0. Switching banks then hides
its return word before the first store to the window. The jump at
`0005h` still exists in fixed RAM but its target can now be a cache line.
Ordinary BDOS calls and returns require the program's normal memory view.
