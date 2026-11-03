---
title: Reset, cold boot and warm boot
parent: TEC-OS
nav_order: 14
nav_group: "Part II: Inside TEC-OS"
---

# 14. Reset, cold boot and warm boot

Checked against TEC-OS 19ad916, with the starter card's `TED.COM` from
Thorium 8fcc6ea, whose copy in `dist/files` has the SHA-256
`9a9936cf9daeb285b585470faaf6f5885926c8aa00c227de2fafe79f762a413e`; the
timings below were measured on that card.

TEC-OS starts in two ways. Cold boot runs after power-on, after the reset
button and when a program calls the RAM BIOS table's first entry
(`src/boot.asm:4`), and it builds everything from nothing: page zero, the
workspace, the card's drives, the cache. Warm boot runs at the end of every
program, so it puts back only what a program may have changed and keeps the
drives, the services and the cache. This chapter follows cold boot from the
first instruction at `0000h` to the point where it falls into warm boot, and
then follows warm boot as far as the CCP, with its cost in T-states. On the way
it describes the two checks of the RAM, the count of the memory regions and the
test that separates a reset from a power-on.

## The boot overlay

The Z80 starts at `0000h` after a reset and TEC-OS's ROM is at `C000h`, so the
board has to put ROM code at `0000h` for the first instruction. When the TEC-1G
comes out of reset its system latch is `00h`, and with bit 0 of the latch low
the board shows the ROM's first 2 KiB, the boot overlay, at `0000h–07FFh` as
well as at `C000h–C7FFh`. The Z80 therefore runs ROM code before any RAM has
been written. The ROM's first instruction is `JP COLD` (`src/reset.asm:5-6`),
and the Z80 runs it from the overlay at `0000h`. The jump's target is an address
in `C000h–FFFFh`, so the next instruction comes from the ROM proper. `COLD`
executes `DI`, loads the stack pointer and then writes `LATCLAS`, `01h`, to the
latch (`src/boot.asm:9-12`). Bit 0 high turns the overlay off, so `0000h–07FFh`
is RAM again, and the latch now has MAIN 0 and EXPAND 0 in view
(`src/layout.asm:16`, `src/layout.asm:19`).

Interrupts come on only if a program or a service enables them, and nothing in
the ROM does. The Z80 comes out of reset
with interrupts off, and the ROM executes `EI` only to restore a state it saved:
the routines that must run with interrupts off put them back as they were at
entry (`src/cache.asm:39`, `src/console.asm:212`, `src/console.asm:248`,
`src/history.asm:39`, `src/xmove.asm:136`). `VPAIR`, the routine in `PICO.SVC`
that writes each pair to the VDP's control port, does the same
(`drivers/pico.asm:226-238`). The one
other `EI` is in page zero. Each boot writes it at `0038h` unless a jump is kept
there (`src/boot.asm:237-246`). It runs on an interrupt, which needs interrupts on
already, and on a program's `RST 38h`, which turns them on. Chapter 19
describes what interrupts cost a program that enables them.

## Cold boot

`COLD` is one routine, `src/boot.asm:9-59`, and the steps of a cold boot are
its lines in order:

1. `DI`, the stack at `8000h`, the latch at `LATCLAS` and interrupt mode 1
   (`src/boot.asm:9-13`).
2. `RSLCAP`, which reads what the RAM holds from before the reset, if it
   holds anything, and keeps the drive selection. It runs before anything it
   reads is cleared (`src/boot.asm:14`).
3. Page zero cleared, all 256 bytes, and `LATCHV` set to `LATCLAS`
   (`src/boot.asm:15-21`).
4. `RAMCHK`, which returns only if there is RAM at `8000h–BFFFh`
   (`src/boot.asm:22`).
5. The resident workspace cleared, from `WSBASE` to `WSEND`, and the stack
   moved to the BIOS stack inside it (`src/boot.asm:23-28`).
6. `CONINIT`, which starts the serial terminal, reads the Matrix switch and
   probes for the PICO9918, then the banner (`src/boot.asm:29-36`).
7. `LCDINIT` and the LCD's top row (`src/boot.asm:39-41`).
8. `SDINIT`, which starts the card, and `MOUNT`, which reads and checks the
   container and fills the drive table. Either failure goes to the
   diagnostic prompt, `DIAG` (`src/boot.asm:42-45`).
9. `ALVINIT`, which places the allocation vectors and the BDOS entry jump,
   and `RESEL`, which applies the kept selection if the card still has it
   (`src/boot.asm:46-47`).
10. `PZTOP`, the top of the TPA, set to the BDOS entry jump, since no service
    is loaded yet (`src/boot.asm:48-49`).
11. The BIOS jump table copied from the ROM to `BF00h` (`src/boot.asm:50-53`).
12. The volumes printed on the console and on the LCD (`src/boot.asm:54-55`).
13. Drive A and user 0 at `0004h`, and page zero built by `PZINIT`
    (`src/boot.asm:56-58`).
14. `MEMINIT`, which counts the MAIN and EXPAND regions and clears EXPAND 1
    (`src/boot.asm:59`). When it returns, cold boot runs on into warm boot,
    the next routine in the file.

The order follows from what each step needs. The reset test comes first because
the steps after it clear the memory it reads. The workspace is cleared only
after the RAM check, since until then it may not be RAM, and only then does the
stack move into it. Step 11 runs at cold boot only, for the reason Chapter 15
gives. Chapter 18 describes steps 8 and 9, and the rest of this chapter steps 2,
4 and 14.

The diagnostic prompt's `R` jumps back to `COLDRT`, step 7 (`src/diag.asm:22-23`,
`src/boot.asm:37-39`), so a retry clears the LCD, starts the card again and
mounts it, without clearing the memory or printing the banner a second time.

On the starter card with the serial board, cold boot takes 1,284,328 T-states,
about 0.32 seconds, from the first instruction to the CCP's entry, measured on
the host model. Three steps take most of it. The banner is 25 characters at
9,448 T-states each through `CONOUT`, the read of the container's block 0 takes
219,137 T-states and `MEMINIT` takes about 347,000, most of it the clearing of
EXPAND 1. The startup file's commands then run before the first prompt, so the
CCP's first call of `CONIN` at that prompt comes 8,842,854 T-states after reset.

## The two RAM checks

TEC-OS needs RAM at `8000h–BFFFh`, because its workspace and stacks are there,
and it needs both halves of U9, because EXPAND 1 holds the cache.

The first check, `RAMCHK`, runs before anything has been printed, on the boot
stack in fixed RAM (`src/boot.asm:272-298`). It writes `55h` at `8000h` and
`AAh` at `BFFFh`, reads both back and does it again with the patterns swapped.
Both ends are written before either is read because a board with nothing in U9
has a floating data bus, and this order stops the bus returning the byte just
written (`src/boot.asm:273-275`). If either byte is wrong, `RAMBAD` sends
`TEC-OS needs 64K RAM` to the serial port and stops in a loop
(`src/boot.asm:300-309`). It calls the transmit routine `TXBYTE` directly,
since the console isn't started yet and that routine uses only the port and
the stack (`src/boot.asm:22`, `src/boot.asm:29`, `src/console.asm:225-249`).

The second check is in `MEMINIT`, near the end of cold boot, and it tests for
EXPAND 1 (`src/boot.asm:141`). It uses `DETECT`, the routine that also
counts MAIN regions. If the count is not 2, it jumps to the same `RAMBAD`, so
the same message goes to the serial port, this time after the volumes have been
printed. `EXPANDS` at `0044h` therefore always holds 2 once cold boot has
finished (`src/layout.asm:36`).

## Counting MAIN and EXPAND

`DETECT` tests whether setting a given latch bit puts different RAM at a given
address (`src/boot.asm:157-185`). A bit that selects nothing leaves the same RAM
in view, so a write made with the bit set still shows once the bit is clear. The
routine reads the byte at the address with the bit clear, sets the bit and reads
the byte again. It then writes the complement of the first byte and clears the
bit. If the byte read now, with the bit clear, is no longer the first byte, the
write landed in the same RAM, so the bit selects nothing and there is one region.
If the byte is unchanged, the write went to other RAM and there are two. Each
byte is put back as it was. The routine returns 1 or 2, with the latch values
without and with the bit in `D` and `E`. Nothing is pushed while the bit is set,
because the stack itself may be in the RAM the bit replaces.

`MEMINIT` tests EXPAND at `8000h` with `LATEXP`, and MAIN at `0100h` with
`LATMAIN` (`src/layout.asm:19-20`, `src/boot.asm:141-154`). With EXPAND 1
found, it uses `DETECT`'s latch value to put EXPAND 1 in view and clears all
16 KiB of it. It fills the cache's 120 bytes of line addresses with `FFh`,
which marks every line empty, and puts EXPAND 0 back (`src/boot.asm:141-154`).
It sets EXPAND 1's low mark to `80h`, which closes it to programs' copies
(`src/boot.asm:154`). The count of MAIN regions goes to `MAINS` at `0041h`,
which the ROM table's word at `C00Dh` points at. With a second MAIN, `MNCOPY`
copies page zero into it a byte at a time, switching the latch between each read and its
write (`src/boot.asm:154-155`). MAIN 1's `0000h` then also jumps to the RAM
BIOS table, so a program that ends with MAIN 1 in view still reaches warm boot
(`src/boot.asm:139-141`).

## The reset test

The TEC-1G's reset button and its power-on reset the Z80 in the same way. The
difference is in the RAM. After power-on it holds whatever the chips came up
with, and after the button it still holds what TEC-OS left there. TEC-OS uses
that to keep one thing across a reset, the selection of volumes on the drives,
so a reset of a board whose drives were changed with `MOUNT` comes back with the
same drives.

The test is `RSLCAP` (`src/boot.asm:83-137`). The RAM may hold anything at this
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
in `STUBAD` (`src/boot.asm:116-129`). The last condition allows for services, which lower
the word at `0006h`. The word is not compared with `PZTOP`, so that a reset
pressed to recover from a service's `INIT` that hung still passes
(`src/boot.asm:87-88`). The test depends
on two addresses of this build, `STUBAD`'s own and `BENTRY`, so RAM left by a
build with either one elsewhere fails it (`src/boot.asm:89-90`).

A reset whose RAM passes the test is a recognised reset, and any other reset
gives the card's own drives. Cold boot clears page zero at its start and writes
its jumps again only at step 13, so a reset pressed during cold boot before that
step, or at the diagnostic prompt, fails the test too.

Cold boot is about to clear the drive table, so when the RAM passes, `RSLCAP`
copies it, 32 bytes, to `RSLBUF` at `0100h` in the TPA (`src/boot.asm:130-134`,
`src/layout.asm:86-92`). Nothing writes there between `COLD` and `MEMINIT`, so
the copy survives the clearing of the workspace and is still there for the
diagnostic prompt's retry. When the RAM fails, `RSLCAP` puts 0 in drive A's
geometry byte in `RSLBUF`, which means no selection (`src/boot.asm:135-137`).

`RESEL` applies the selection after `MOUNT` has accepted the card in the socket
and `ALVINIT` has given its drives their vectors in the usual way, so neither
the slots nor the TPA varies with the selection (`src/vol.asm:391-480`). The card
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
empty, even if the card names a volume for it (`src/vol.asm:402-404`).

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
(`src/boot.asm:15-28`, `src/boot.asm:141-147`). A change the cache held for the
card is lost. Once a recognised reset has applied a selection, the next reset
passes the test and applies it again while the card still holds those volumes.
That card's own drives come back at a reset only when the test fails, as it does
after a power cycle or for a reset pressed during cold boot. Chapter 4's
[recovery section](04-cards-and-volumes.md#recovery-after-a-power-cut) sets out
what a lost change leaves on the card and how to check it.

## Page zero

A program is free to write over page zero, so `PZINIT` writes page zero's fixed
parts at every warm boot as well as at the end of cold boot
(`src/boot.asm:187-246`).
It puts `JP BF03h` at `0000h`, a `JP` at `0005h` to `PZTOP` and `JP BENTRY` at
the address in `STUBAD`. It then runs on into `PZSWP`, which rewrites the restart
vectors at `0008h–003Fh`.

The vectors are rewritten so that a vector a program pointed into the TPA does
not outlive the program, and a vector into a service lasts as long as the
service. A vector holding a `JP` whose target is above `PZTOP`, compared as a
word, keeps its jump and has the rest of its eight bytes zeroed, which keeps a
jump into a service, the workspace or the ROM. Any other becomes seven zeros and
a `RET`, so that an `RST` through it returns at once with the interrupt state
unchanged (`src/boot.asm:211-236`). A jump to `PZTOP` itself, the BDOS entry,
gets the default too, and so does a jump into the TPA's bytes on the stub's
page (`src/boot.asm:216-224`). `0038h`, where interrupt mode 1 and `RST 38h`
go, then gets `EI` and `RETI` unless it kept a jump (`src/boot.asm:237-246`).
Chapter 20 describes how a service claims a vector, and the unload and the failed
`INIT` that also run this sweep. The IOBYTE at `0003h` and the drive and user byte at
`0004h` are left as they are. Chapter 13 lists page zero in full.

## Warm boot

Warm boot is `WBOOTR`, `src/boot.asm:61-81`, the second entry of the BIOS jump
table, and the jump at `0000h` leads to it through the RAM BIOS table at
`BF03h`. A program reaches it by returning from `0100h`, since the CCP pushes
`0000h` before it jumps there (`src/cpm/ccp.asm:14`,
`src/cpm/ccp.asm:299-302`). A program also reaches it by jumping to `0000h` or
by calling BDOS function 0 (`src/cpm/bdos.asm:130-131`). A call of BDOS function
47 that succeeds ends there too (`src/cpm/bdos.asm:65-71`).

The BDOS goes there itself through `CHDROP`, which first drops the rest of a
chained line, a line split at `!` (Chapter 11, `src/cpm/bdos.asm:75-77`). The
BDOS takes that route after a `^C` typed as the first key of a line read with
function 10 (`src/cpm/bdos.asm:320-324`), and after it has reported a BDOS error
such as `Bdos Err On B: Select` (`src/cpm/bdos.asm:2383-2386`,
`src/cpm/bdos.asm:2399-2402`). A `^C` at the prompt is the first case, since
the CCP reads its line with function 10:

<!-- node tools/capture.mjs ^C -->
```text
A>^C
A>
```

Warm boot's steps are:

1. `DI`, then EXPAND 1 in view, and `JP WBOOTR` written at `BF03h` in EXPAND
   1 (`src/boot.asm:64`). The jump is for a program that ends with
   EXPAND 1 in view: its jump to `0000h` reaches `BF03h` in EXPAND 1, where
   this jump is. Only a program that writes the latch itself can end that way,
   since every TEC-OS routine that puts EXPAND 1 in view puts EXPAND 0 back
   before it returns.
2. The latch and `LATCHV` set to `LATCLAS`, which puts MAIN 0 and EXPAND 0
   back, and the stack set to the BIOS stack (`src/boot.asm:65-68`). The
   latch comes before the stack because the BIOS stack is in EXPAND 0.
3. `PZINIT`, as above (`src/boot.asm:69`).
4. `SVCBSY` cleared, so that a service's `INIT` or `REMOVE` that a program's
   end interrupted is not taken to be still running (`src/boot.asm:70-71`).
5. `CPMINIT`, which clears the CCP's state and the BDOS's,
   331 bytes from `CCPCLR` to `BDOSRME`, as a fresh load of them from disk
   would leave it. It keeps the command buffer below `CCPCLR` for a chained
   line's next piece. It puts the DMA address back at `0080h`, sets the command
   buffer's maximum length to 127 and fills the CCP stack's guard with `A5h`.
   It marks the deblocking buffer empty so that a changed card is read again
   (`src/boot.asm:251-270`, `src/ram.asm:68-81`).
6. The console put right. `HWVREL` gives back the PICO9918 if a program
   claimed it, `VREST` restores the display's mode if the console is
   on one, and `VTREGR` resets the scroll region to the whole screen
   (`src/boot.asm:73-77`).
7. `CWBOOT`, which writes every dirty line of the cache (Chapter 19) to the
   card. If any write has failed since the last warm boot, it prints
   `Write lost` and drops the rest of a chained line (`src/boot.asm:78`,
   `src/cache.asm:354-365`).
8. A jump to the CCP's entry, `CCPENT`, with `C` holding the drive and user
   byte from `0004h` (`src/boot.asm:79-81`).

Warm boot leaves the rest alone. The drive table, the DPHs and `LOGINV`, the
BDOS's record of the logged-in drives (Chapter 16), are in the BIOS's part of
the workspace, which `CPMINIT` does not clear (`src/ram.asm:22-34`). The
allocation vectors below `WSBASE` and the RAM BIOS table at `BF00h` are outside
what `CPMINIT` clears too. So are the two FCBs and the command buffer, the 202
bytes of the CCP's RAM below `CCPCLR`, and `CHPOS`, the byte above the RAM BIOS
table that marks a chained line's next piece. The rest of the line therefore
outlives `CPMINIT` (`src/ram.asm:68-81`, `src/ram.asm:239`), as Chapter 25
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
`STBOOT`, which starts the startup file once after a cold boot (Chapter 22
describes it), and it selects the drive if it is not A. Its main loop then takes a
chained line's next piece, if one is left, before the startup file's next line
and before the console (`src/cpm/ccp.asm:80-84`).

## The cost of a warm boot

On the starter card with the serial board, warm boot takes 32,025 T-states,
about 8 milliseconds, from the first instruction of `WBOOTR` to the CCP's label
`STARTED`, where it starts printing the prompt. The figure was measured on the
host model with nothing changed since the last warm boot, and in that case warm
boot reads no block. Of it, `CPMINIT` takes 7,427 T-states, the cache's flush in
`CWBOOT`, with no line to write, takes 8,002 and the CCP's entry with its disk
reset 14,086.

A warm boot after `SAVE 8 X.COM` on drive A takes 112,647 T-states on the same
measure. The extra 80,000 or so are the rebuild of A's vector from its directory
up to the last entry in use, and the directory is read from the block cache with
no card access. For comparison, a disk reset of the kind a program makes drops
drive A and scans its whole directory again, which takes 1,033,091 T-states on
the starter card even with the directory in the cache. The first scan of drive
B's 512 entries, with the card read for each of its 32 directory blocks, takes
9,174,256. The test `test/warmboot.test.mjs` checks the unchanged case on its
own card: a warm boot that reads no block and takes at most 386,604 T-states
(`test/warmboot.test.mjs:11-17`).
