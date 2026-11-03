---
title: Reset, cold boot and warm boot
parent: TEC-OS
nav_order: 14
nav_group: "Part II: Inside TEC-OS"
---

# 14. Reset, cold boot and warm boot

Checked against TEC-OS 7458352, with the starter card's `TED.COM` from
Thorium 128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`; the
timings below were measured on that card.

TEC-OS starts in two ways. Cold boot runs after power-on, after the reset
button and when a program calls the RAM BIOS table's first entry
(`src/boot.asm:5`), and it builds everything from nothing: page zero, the
workspace, the card's drives, the cache. Warm boot runs at the end of every
program, so it puts back only what a program may have changed and keeps the
drives, the services and the cache. This chapter follows cold boot from the
first instruction at `0000h` to the point where it falls into warm boot, and
then follows warm boot as far as the CCP, with its cost in T-states. On the way
it describes the check of the RAM and the test that separates a reset from a
power-on.

## The boot overlay

The Z80 starts at `0000h` after a reset and TEC-OS's ROM is at `C000h`, so the
board has to put ROM code at `0000h` for the first instruction. When the TEC-1G
comes out of reset its system latch is `00h`, and with bit 0 of the latch low
the board shows the ROM's first 2 KiB, the boot overlay, at `0000h–07FFh` as
well as at `C000h–C7FFh`. The Z80 therefore runs ROM code before any RAM has
been written. The ROM's first instruction is `JP RSTENT` (`src/reset.asm:6-7`),
and the Z80 runs it from the overlay at `0000h`. The jump's target is an address
in `C000h–FFFFh`, so the next instruction comes from the ROM proper. `RSTENT`
reads the byte at `0002h`, which with the overlay on is the jump's own high
byte, and when it is `HIGH(RSTENT)` goes on to `COLD` (`src/boot.asm:17-20`).
`COLD` executes `DI`, loads the stack pointer and then writes `LATCLAS`, `01h`, to the
latch (`src/boot.asm:20-23`). Bit 0 high turns the overlay off, so `0000h–07FFh`
is RAM again, and the latch now has EXPAND 0 in view
(`src/layout.asm:16`, `src/layout.asm:19`).

Interrupts come on only if a program or a service enables them, and nothing in
the ROM does. The Z80 comes out of reset
with interrupts off, and the ROM executes `EI` only to restore a state it saved:
the routines that must run with interrupts off put them back as they were at
entry (`src/cache.asm:466`, `src/console.asm:212`, `src/console.asm:248`,
`src/history.asm:39`, `src/cache.asm:466`). `VPAIR`, the routine in `PICO.SVC`
that writes each pair to the VDP's control port, does the same
(`drivers/pico.asm:226-238`). The one
other `EI` is in page zero. Each boot writes it at `0038h` unless a jump is kept
there (`src/boot.asm:248-257`). It runs on an interrupt, which needs interrupts on
already, and on a program's `RST 38h`, which turns them on. Chapter 19
describes what interrupts cost a program that enables them.

## Cold boot

`COLD` is one routine, `src/boot.asm:20-70`, and the steps of a cold boot are
its lines in order:

1. `DI`, the stack at `8000h`, the latch at `LATCLAS` and interrupt mode 1
   (`src/boot.asm:20-24`).
2. `RSLCAP`, which reads what the RAM holds from before the reset, if it
   holds anything, and keeps the drive selection. It runs before anything it
   reads is cleared (`src/boot.asm:25`).
3. Page zero cleared, all 256 bytes, and `LATCHV` set to `LATCLAS`
   (`src/boot.asm:26-32`).
4. `RAMCHK`, which returns only if there is RAM at `8000h–BFFFh` and EXPAND 1
   behind it (`src/boot.asm:33`).
5. The resident workspace cleared, from `WSBASE` to `WSEND`, and the stack
   moved to the BIOS stack inside it (`src/boot.asm:34-39`).
6. `CONINIT`, which starts the serial terminal, reads the Matrix switch and
   probes for the PICO9918. Then `RTCHAS`, which probes for the clock and sets
   bit 3 of `CONDEV` when one answers, and the banner (`src/boot.asm:40-47`).
7. `LCDINIT` and the LCD's top row (`src/boot.asm:50-52`).
8. `SDINIT`, which starts the card, and `MOUNT`, which reads and checks the
   container and fills the drive table. Either failure goes to the
   diagnostic prompt, `DIAG` (`src/boot.asm:53-56`).
9. `ALVINIT`, which places the allocation vectors and the BDOS entry jump,
   and `RESEL`, which applies the kept selection if the card still has it
   (`src/boot.asm:57-58`).
10. `PZTOP`, the top of the TPA, set to the BDOS entry jump, since no service
    is loaded yet (`src/boot.asm:59-60`).
11. The BIOS jump table copied from the ROM to `BF00h` (`src/boot.asm:61-64`).
12. The volumes printed on the console and on the LCD (`src/boot.asm:65-66`).
13. Drive A and user 0 at `0004h`, and page zero built by `PZINIT`
    (`src/boot.asm:67-69`).
14. `MEMINIT`, which clears EXPAND 1 and marks every cache line empty
    (`src/boot.asm:70`). When it returns, cold boot runs on into warm boot,
    the next routine in the file.

The order follows from what each step needs. The reset test comes first because
the steps after it clear the memory it reads. The workspace is cleared only
after the RAM check, since until then it may not be RAM, and only then does the
stack move into it. Step 11 runs at cold boot only, for the reason Chapter 15
gives. Chapter 18 describes steps 8 and 9, and the rest of this chapter steps 2,
4 and 14.

The diagnostic prompt's `R` jumps back to `COLDRT`, step 7 (`src/boot.asm:462-463`,
`src/boot.asm:48-50`), so a retry clears the LCD, starts the card again and
mounts it, without clearing the memory or printing the banner a second time.

On the starter card with the serial board, cold boot takes 1,285,483 T-states,
about 0.32 seconds, from the first instruction to the CCP's entry, measured on
the host model. Three steps take most of it. The banner is 25 characters at
9,448 T-states each through `CONOUT`, the read of the container's block 0 takes
219,144 T-states and `MEMINIT` takes about 347,000, most of it the clearing of
EXPAND 1. The startup file's commands then run before the first prompt, so the
CCP's first call of `CONIN` at that prompt comes 8,838,438 T-states after reset.

## The RAM check

TEC-OS needs RAM at `8000h–BFFFh`, because its workspace and stacks are there,
and it needs both halves of U9, because EXPAND 1 holds the cache.

The check, `RAMCHK`, runs before anything has been printed, on the boot stack
in fixed RAM (`src/boot.asm:283-309`). It writes `55h` at `8000h` and `AAh` at
`BFFFh`, reads both back and does it again with the patterns swapped. Both ends
are written before either is read because a board with nothing in U9 has a
floating data bus, and this order stops the bus returning the byte just
written (`src/boot.asm:286-288`). It then calls `DETECT` to test for EXPAND 1
at `8000h` with `LATEXP` (`src/boot.asm:294-299`). If either byte is wrong, or
the count is not 2, `RAMBAD` sends `TEC-OS needs 64K RAM` to the serial port
and stops in a loop (`src/boot.asm:311-320`). It calls the transmit routine `TXBYTE` directly,
since the console isn't started yet and that routine uses only the port and
the stack (`src/boot.asm:33`, `src/boot.asm:40`, `src/console.asm:225-249`).

`DETECT` tests whether setting a given latch bit puts different RAM at a given
address (`src/boot.asm:168-196`). A bit that selects nothing leaves the same RAM
in view, so a write made with the bit set still shows once the bit is clear. The
routine reads the byte at the address with the bit clear, sets the bit and reads
the byte again. It then writes the complement of the first byte and clears the
bit. If the byte read now, with the bit clear, is no longer the first byte, the
write landed in the same RAM, so the bit selects nothing and there is one region.
If the byte is unchanged, the write went to other RAM and there are two. Each
byte is put back as it was, and the routine returns 1 or 2. Nothing is pushed
while the bit is set, because the stack itself may be in the RAM the bit
replaces.

`MEMINIT`, the last step of cold boot, puts EXPAND 1 in view and clears all
16 KiB of it. It fills the cache's 120 bytes of line addresses with `FFh`,
which marks every line empty, and puts EXPAND 0 back (`src/boot.asm:150-166`).

## The reset test

The TEC-1G's reset button and its power-on reset the Z80 in the same way. The
difference is in the RAM. After power-on it holds whatever the chips came up
with, and after the button it still holds what TEC-OS left there. TEC-OS uses
that to keep one thing across a reset, the selection of volumes on the drives,
so a reset of a board whose drives were changed with `MOUNT` comes back with the
same drives.

The test is `RSLCAP` (`src/boot.asm:94-148`). The RAM may hold anything at this
point, so `RSLCAP` reads only page zero, the word `STUBAD`, the three bytes at
the address that word holds and the drive table, and it runs none of the code it
reads. The RAM passes when all of these hold:

- `0000h` holds a `JP` to `BF03h`, the RAM BIOS table's warm boot entry.
- `0005h` holds a `JP`.
- The word in `STUBAD` is the address where cold boot put the BDOS entry jump,
  and the three bytes there are `JP BENTRY`, the BDOS entry of this ROM.
- The word at `0006h` is at least `8000h`, and it is that address or a page's
  start no higher than `STUBAD`'s page.

`RSLCAP` tests the floor of `8000h` before it compares the word with the one
in `STUBAD` (`src/boot.asm:127-140`). The last condition allows for services, which lower
the word at `0006h`. The word is not compared with `PZTOP`, so that a reset
pressed to recover from a service's `INIT` that hung still passes
(`src/boot.asm:98-99`). The test depends
on two addresses of this build, `STUBAD`'s own and `BENTRY`, so RAM left by a
build with either one elsewhere fails it (`src/boot.asm:100-101`).

A reset whose RAM passes the test is a recognised reset, and any other reset
gives the card's own drives. Cold boot clears page zero at its start and writes
its jumps again only at step 13, so a reset pressed during cold boot before that
step, or at the diagnostic prompt, fails the test too.

Cold boot is about to clear the drive table, so when the RAM passes, `RSLCAP`
copies it, 32 bytes, to `RSLBUF` at `0100h` in the TPA (`src/boot.asm:141-145`,
`src/layout.asm:88-94`). Nothing writes there between `COLD` and `MEMINIT`, so
the copy survives the clearing of the workspace and is still there for the
diagnostic prompt's retry. When the RAM fails, `RSLCAP` puts 0 in drive A's
geometry byte in `RSLBUF`, which means no selection (`src/boot.asm:146-148`).

`RESEL` applies the selection after `MOUNT` has accepted the card in the socket
and `ALVINIT` has given its drives their vectors in the usual way, so neither
the slots nor the TPA varies with the selection (`src/vol.asm:407-496`). The card
in the socket may no longer hold the kept volumes, so `RESEL` works in two steps
and changes the drives only if the first step succeeds. The first step changes
no drive. It walks the card's descriptors and compares each with every kept
drive in `RSLBUF`, on the eight bytes a drive-table entry holds: the start, the
length, the geometry and the flags. A descriptor goes to the first
kept drive it matches, and the volume must fit that drive's vector slot. `RESEL`
returns and the card's own drives stand in three cases: a read fails, a matching
volume would not fit its slot, or a kept drive is left with no match.

The second step runs only when every kept drive has matched. It copies `RSLBUF`
over the drive table and the drives' indexes and builds each drive's DPH. That
step reads nothing and can't fail. A drive that was empty before the reset stays
empty, even if the card names a volume for it (`src/vol.asm:418-420`).

The run below unmounts drive B with `MOUNT B:`, then presses reset. The kept
selection has no volume on B and the starter card's two volumes still match, so
after the reset only A is listed:

<!-- node tools/capture.mjs "MOUNT B:" "@reset" -->
```text
A>MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     

A>PICO.SVC
PICO.SVC?

A>GLCD.SVC
GLCD.SVC?

A>
```

The selection is all that a reset keeps. Cold boot clears page zero, the
workspace and EXPAND 1 as on any cold boot, so services, the registry, the cache,
open files and the history are gone and the console is the serial terminal again
(`src/boot.asm:26-39`, `src/boot.asm:152-158`). A change the cache held for the
card is lost, and one the cache had already written stays on the card, since
nothing is rolled back. Once a recognised reset has applied a selection, the next reset
passes the test and applies it again while the card still holds those volumes.
That card's own drives come back at a reset only when the test fails, as it does
after a power cycle or for a reset pressed during cold boot. Chapter 4's
[recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut) sets out
what a lost change leaves on the card and how to check it.

## Page zero

A program is free to write over page zero, so `PZINIT` writes page zero's fixed
parts at every warm boot as well as at the end of cold boot
(`src/boot.asm:198-257`).
It puts `JP BF03h` at `0000h`, a `JP` at `0005h` to `PZTOP` and `JP BENTRY` at
the address in `STUBAD`. It then runs on into `PZSWP`, which rewrites the restart
vectors at `0008h–003Fh`.

The vectors are rewritten so that a vector a program pointed into the TPA does
not outlive the program, and a vector into a service lasts as long as the
service. A vector holding a `JP` whose target is above `PZTOP`, compared as a
word, keeps its jump and has the rest of its eight bytes zeroed, which keeps a
jump into a service, the workspace or the ROM. Any other becomes seven zeros and
a `RET`, so that an `RST` through it returns at once with the interrupt state
unchanged (`src/boot.asm:222-247`). A jump to `PZTOP` itself, the BDOS entry,
gets the default too, and so does a jump into the TPA's bytes on the stub's
page (`src/boot.asm:227-235`). `0038h`, where interrupt mode 1 and `RST 38h`
go, then gets `EI` and `RETI` unless it kept a jump (`src/boot.asm:248-257`).
Chapter 20 describes how a service claims a vector, and the unload and the failed
`INIT` that also run this sweep. The IOBYTE at `0003h` and the drive and user byte at
`0004h` are left as they are. Chapter 13 lists page zero in full.

## Warm boot

Warm boot is `WBOOTR`, `src/boot.asm:72-92`, the second entry of the BIOS jump
table, and the jump at `0000h` leads to it through the RAM BIOS table at
`BF03h`. A program reaches it by returning from `0100h`, since the CCP pushes
`0000h` before it jumps there (`src/cpm/ccp.asm:14`,
`src/cpm/ccp.asm:301-304`). A program also reaches it by jumping to `0000h` or
by calling BDOS function 0 (`src/cpm/bdos.asm:130-131`). A call of BDOS function
47 that succeeds ends there too (`src/cpm/bdos.asm:65-71`).

The BDOS goes there itself through `CHDROP`, which first drops the rest of a
chained line, a line split at `!` (Chapter 11, `src/cpm/bdos.asm:75-77`). The
BDOS takes that route after a `^C` typed as the first key of a line read with
function 10 (`src/cpm/bdos.asm:320-324`), and after it has reported a BDOS error
such as `Bdos Err On B: Select` (`src/cpm/bdos.asm:2387-2390`,
`src/cpm/bdos.asm:2403-2406`). A `^C` at the prompt is the first case, since
the CCP reads its line with function 10:

<!-- node tools/capture.mjs ^C -->
```text
A>^C
A>
```

A program that ends with EXPAND 1 in view, by a return or a jump to `0000h`,
reaches warm boot through the reset jump. The jump at `0000h` leads to
`BF03h`, which in EXPAND 1 is part of the free space that cold boot clears, so
the Z80 runs its zeros as `NOP`s on to `C000h` and `JP RSTENT`. The overlay is
off, so `0002h` holds `BFh`, the RAM BIOS table's high byte, and `RSTENT` goes
to `WBOOTR` (`src/boot.asm:11-19`). Warm boot then puts EXPAND 0 back and
writes the cache's dirty lines, as it does at any program's end. A reset and
BIOS function 0 cold boot.

Warm boot's steps are:

1. `DI`, the latch and `LATCHV` set to `LATCLAS`, which puts EXPAND 0 back,
   and the stack set to the BIOS stack (`src/boot.asm:75-79`). The latch comes
   before the stack because the BIOS stack is in EXPAND 0.
2. `PZINIT`, as above (`src/boot.asm:80`).
3. `SVCBSY` cleared, so that a service's `INIT` or `REMOVE` that a program's
   end interrupted is not taken to be still running (`src/boot.asm:81-82`).
4. `CPMINIT`, which clears the CCP's state and the BDOS's,
   331 bytes from `CCPCLR` to `BDOSRME`, as a fresh load of them from disk
   would leave it. It keeps the command buffer below `CCPCLR` for a chained
   line's next piece. It puts the DMA address back at `0080h`, sets the command
   buffer's maximum length to 127 and fills the CCP stack's guard with `A5h`.
   It marks the deblocking buffer empty so that a changed card is read again
   (`src/boot.asm:262-281`, `src/ram.asm:68-81`).
5. The console put right. `HWVREL` gives back the PICO9918 if a program
   claimed it, `VREST` restores the display's mode if the console is
   on one, and `VTREGR` resets the scroll region to the whole screen
   (`src/boot.asm:84-88`).
6. `CWBOOT`, which writes every dirty line of the cache (Chapter 19) to the
   card. If any write has failed since the last warm boot, it prints
   `Write lost` and drops the rest of a chained line (`src/boot.asm:89`,
   `src/cache.asm:328-339`).
7. A jump to the CCP's entry, `CCPENT`, with `C` holding the drive and user
   byte from `0004h` (`src/boot.asm:90-92`).

Warm boot leaves the rest alone. The drive table, the DPHs and `LOGINV`, the
BDOS's record of the logged-in drives (Chapter 16), are in the BIOS's part of
the workspace, which `CPMINIT` does not clear (`src/ram.asm:22-34`). The
allocation vectors below `WSBASE` and the RAM BIOS table at `BF00h` are outside
what `CPMINIT` clears too. So are the two FCBs and the command buffer, the 202
bytes of the CCP's RAM below `CCPCLR`, and `CHPOS`, the byte above the RAM BIOS
table that marks a chained line's next piece. The rest of the line therefore
outlives `CPMINIT` (`src/ram.asm:68-81`, `src/ram.asm:239`), as Chapter 24
describes. The services below the BDOS entry are kept too, and so are the
registry's head and the display drivers' tables above the RAM BIOS table. The
cache's lines and the history in EXPAND 1 stay as well.

The CCP's entry does the rest (`src/cpm/ccp.asm:29-66`). It sets its stack and
puts A: in place of a drive past D: or with no volume, because selecting such a
drive would give a `Select` error and a warm boot back to the same place
(`src/cpm/ccp.asm:33-44`). It sets `WRFLAG` before it calls BDOS function 13,
the disk reset, so that the reset doesn't read every directory again. With that
flag set, function 13 keeps a logged-in drive if nothing has changed its vector
since it was last built and the vector still sums as it did then. A drive that a
write has changed is marked for a rebuild at its next selection, from its
directory entries up to the highest one in use.
Any other is dropped and is scanned in full when it is next selected
(`src/cpm/bdos.asm:430-491`). A program's own call of function 13 has no flag
set and drops every drive, as CP/M 2.2 does.

The CCP then sets the user number from the byte it was given. It calls
`STBOOT`, which starts the startup file once after a cold boot (Chapter 21
describes it), and it selects the drive if it is not A. Its main loop then takes a
chained line's next piece, if one is left, before the startup file's next line
and before the console (`src/cpm/ccp.asm:80-84`).

## The cost of a warm boot

On the starter card with the serial board, warm boot takes 31,933 T-states,
about 8 milliseconds, from the first instruction of `WBOOTR` to the CCP's label
`STARTED`, where it starts printing the prompt. The figure was measured on the
host model with nothing changed since the last warm boot, and in that case warm
boot reads no block. Of it, `CPMINIT` takes 7,427 T-states, the cache's flush in
`CWBOOT`, with no line to write, takes 8,002 and the CCP's entry with its disk
reset 14,058.

A warm boot after `SAVE 8 X.COM` on drive A takes 114,737 T-states on the same
measure. The extra 80,000 or so are the rebuild of A's vector from its directory
up to the last entry in use, and the directory is read from the block cache with
no card access. For comparison, a disk reset of the kind a program makes drops
drive A and scans its whole directory again, which takes 1,031,428 T-states on
the starter card even with the directory in the cache. The first scan of drive
B's 512 entries, with the card read for each of its 32 directory blocks, takes
9,166,402. The test `test/warmboot.test.mjs` checks the unchanged case on its
own card: a warm boot that reads no block and takes at most 386,604 T-states
(`test/warmboot.test.mjs:11-17`).
