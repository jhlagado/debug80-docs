---
title: Reset, cold boot and warm boot
parent: TEC-OS
nav_order: 15
nav_group: "Part II: Inside TEC-OS"
---

# 15. Reset, cold boot and warm boot

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from
     Thorium 128edb7 and `TAS.COM` from Thorium dbee66a; the timings below were
     measured on the host model with that card and the serial board. -->

TEC-OS has two ways to a prompt. Cold boot runs after a reset or a call of
the BIOS's first entry. It builds everything from nothing: page zero, the
workspace, the card's drives and the cache. Warm boot runs at the end of
every program and puts back only what a program may have changed. This
chapter follows cold boot from the first instruction to the point where it
runs on into warm boot, then warm boot as far as the CCP. It ends with the
cost of each in T-states. Chapter 14 maps what each one writes.

## The first instruction

The Z80 starts at `0000h` after a reset and TEC-OS's ROM is at `C000h`. The
board therefore has to put ROM code at `0000h` for the first instruction. The
TEC-1G comes out of reset with its system latch at `00h`. The board shows
the ROM's first 2 KiB, the boot overlay, at `0000h–07FFh` as well as at
`C000h–C7FFh` while bit 0 of the latch is low. The ROM's first instruction is
`JP RSTENT` (`src/reset.asm:1-6`), and the Z80 runs it from the overlay at
`0000h`. Its target is in `C000h–FFFFh`, so the next instruction comes from
the ROM proper.

`RSTENT` reads the byte at `0002h` to tell a reset from the other way the
ROM's first bytes are reached (`src/boot.asm:11-22`). With the overlay on,
that byte is the jump's own high byte, `HIGH(RSTENT)`, and `RSTENT` goes on
to `COLD`. A program that ends with EXPAND 1 in view, by a return or a jump
to `0000h`, reaches the same jump another way. The jump at `0000h` leads to
`BF03h`, which in EXPAND 1 is free space that cold boot cleared. The Z80
runs the zeros there as `NOP`s on to `C000h`. The overlay is off by then, so
`0002h` holds `BFh`, the RAM BIOS table's high byte, and `RSTENT` goes to
warm boot instead. Warm boot puts EXPAND 0 back and writes the cache's dirty
lines, as it does at any program's end.

`COLD` executes `DI`, loads the stack pointer and writes `LATCLAS`, `01h`, to
the latch (`src/boot.asm:23-26`). Bit 0 high turns the overlay off, so
`0000h–07FFh` is RAM again, and the latch now has EXPAND 0 in view
(`src/layout.asm:17`, `src/layout.asm:21`). Interrupts stay off from here
unless a program or a service enables them. The ROM's own `EI`s only put back
a state a routine saved at its entry, as the BIOS's `CEI` does
(`src/bios.asm:294-300`). The only other `EI` is the one each boot writes at
`0038h` for a program's `RST 38h` (`src/boot.asm:274-283`). Chapter 18
describes what interrupts cost a program that enables them.

## Cold boot's steps

`COLD` is one routine, `src/boot.asm:23-83`, and the steps of a cold boot are
its lines in order:

1. `DI`, the stack at `8000h`, the latch at `LATCLAS` and interrupt mode 1
   (`src/boot.asm:23-27`).
2. `RSLCAP`, which reads what the RAM holds from before the reset, if it
   holds anything, and keeps the drive selection. It runs before anything it
   reads is cleared (`src/boot.asm:28`).
3. Page zero cleared, all 256 bytes, and `LATCHV` set to `LATCLAS`
   (`src/boot.asm:29-35`).
4. `RAMCHK`, which returns only if there is RAM at `8000h–BFFFh` and EXPAND 1
   behind it (`src/boot.asm:36`).
5. The resident workspace cleared, from `WSBASE` to `WSEND`, and the stack
   moved to the BDOS's stack inside it, which nothing else uses before the CCP
   runs (`src/boot.asm:37-42`).
6. `CONINIT`, which starts the serial terminal, reads the Matrix switch and
   probes for the PICO9918. On a board where the PICO9918 answers and the
   switch is on, `PISTART` starts the ROM's PICO9918 console at 80 columns.
   It puts `CRT:` in the IOBYTE, so the banner goes to the screen
   (`src/console.asm:48-51`, `src/video.asm:8-16`, `src/pico.asm:27-47`).
   `RTCHAS` then probes for the clock, and the banner is printed
   (`src/boot.asm:46-53`).
7. `MEMINIT`, which clears EXPAND 1 and marks every cache line empty
   (`src/boot.asm:54`).
8. At `COLDRT`, the BDOS's stack set again, then `LCDINIT`, which clears the
   20 × 4 LCD, and `TEC-OS 0.1  TEC-1G` on its top row (`src/boot.asm:63-66`,
   `src/text.asm:53`).
9. `SDINIT`, which starts the card, and `MOUNT`, which reads the container's
   table through a cache line, checks it and fills the drive table. Either
   failure goes to the diagnostic prompt, `DIAG` (`src/boot.asm:67-70`).
10. `ALVINIT`, which places the allocation vectors and the BDOS entry jump,
    and `RESEL`, which applies the kept selection if the card still has it
    (`src/boot.asm:71-72`).
11. `PZTOP`, the top of the TPA, set to the BDOS entry jump, since no service
    is loaded yet (`src/boot.asm:73-74`).
12. The BIOS jump table copied from the ROM to `BF00h` (`src/boot.asm:75-78`).
13. The volumes printed on the console, a line a drive, and the letters and
    labels of drives A and B on the LCD's rows 1 and 2 (`src/boot.asm:79-80`,
    `src/boot.asm:363-383`, `src/lcd.asm:69-89`).
14. Drive A and user 0 at `0004h` (`src/boot.asm:81-83`). Cold boot then runs
    on into warm boot, the next routine in the file, whose `PZINIT` builds
    page zero, once (`src/boot.asm:92-100`).

The order follows from what each step needs. The reset test comes first
because the steps after it clear the memory it reads. The workspace is cleared
only after the RAM check, since until then it may not be RAM. Only then does
the stack move into it. `MEMINIT` comes before the card is started
because the mount reads the container's table through a cache line, so the
mount's lines start empty. Step 12 runs at cold boot only, for the reason
Chapter 16 gives. Chapter 17 describes steps 9 and 10. Chapter 14 describes
the memory that steps 3, 5 and 10 lay out. The rest of this chapter describes
steps 2, 4 and 7.

The LCD costs a board without one almost nothing. Before each command or
character `LCDWAIT` reads the display's busy flag at most 256 times, so a
missing display costs only that wait (`src/lcd.asm:18-27`). Drives C and D
have no row. Row 3 is for one of two words TEC-OS shows for a board with no
terminal. `CARD?` appears at the diagnostic prompt (`src/boot.asm:472-473`),
and `GLCD?` when `CON UC1` fails to load `GLCD.SVC`, as Chapter 25 describes.
Appendix G gives the display's ports and commands.

The diagnostic prompt's `R` jumps back to `COLDRT`, step 8
(`src/boot.asm:487-488`, `src/boot.asm:56-64`). A retry therefore resets the
stack, clears the LCD, starts the card again and mounts it, with the memory
uncleared and no second banner. The mount reads every block of the table from
the card again (`src/vol.asm:32-36`). Chapter 26 describes the prompt.

## The RAM check

TEC-OS needs RAM at `8000h–BFFFh`, because its workspace and stacks are there.
It needs both halves of U9, because EXPAND 1 holds the cache.

The check, `RAMCHK`, runs before anything has been printed, on the boot stack
in fixed RAM (`src/boot.asm:314-345`). It writes `55h` at `8000h` and `AAh` at
`BFFFh`, reads both back and does it again with the patterns swapped. Both
ends are written before either is read because a board with nothing in U9 has
a floating data bus. This order stops the bus returning the byte just written
(`src/boot.asm:314-322`). It then calls `DETECT` to test for EXPAND 1
at `8000h` with `LATEXP` (`src/boot.asm:327-332`). With either byte wrong or
the count not 2, `RAMBAD` sends `TEC-OS needs 64K RAM` to the serial port and
stops in a loop (`src/boot.asm:346-358`). It calls the transmit routine
`TXBYTE` directly, because the console isn't started yet. That routine uses
only the port and the stack (`src/console.asm:259-285`).

`DETECT` tests whether setting a given latch bit puts different RAM at a given
address (`src/boot.asm:190-219`). A bit that selects nothing leaves the same
RAM in view, so a write made with the bit set still shows once the bit is
clear. The routine reads the byte at the address with the bit clear, sets the
bit and reads the byte again. It then writes the complement of the first byte
and clears the bit. A byte that now differs from the first means the write
landed in the same RAM: the bit selects nothing and there is one region. A
byte that is unchanged means the write went to other RAM and there are two.
Each byte is put back as it was, and the routine returns 1 or 2. Nothing is
pushed while the bit is set, because the stack itself may be in the RAM the
bit replaces.

`MEMINIT`, step 7 of cold boot, puts EXPAND 1 in view and clears all 16 KiB
of it. It fills the cache's 120 bytes of line addresses with `FFh`, which
marks every line empty, and puts EXPAND 0 back (`src/boot.asm:169-188`).

## The reset test

The TEC-1G's reset button and its power-on reset the Z80 in the same way. The
difference is in the RAM: after power-on it holds whatever the chips came up
with, and after the button it still holds what TEC-OS left there. TEC-OS uses
that to keep one thing across a reset, the selection of volumes on the drives.
A board whose drives were changed with `MOUNT` comes back from a reset with
the same drives.

The test is `RSLCAP` (`src/boot.asm:113-167`). The RAM may hold anything at
this point, so `RSLCAP` runs none of the code it reads. It reads only page
zero, the word `STUBAD`, the three bytes at the address that word holds and
the drive table. The RAM passes when all of these hold:

- `0000h` holds a `JP` to `BF03h`, the RAM BIOS table's warm boot entry.
- `0005h` holds a `JP`.
- The word in `STUBAD` is the address where cold boot put the BDOS entry
  jump, and the three bytes there are `JP BENTRY`, the BDOS entry of this ROM.
- The word at `0006h` is at least `8000h`, and it is that address or a page's
  start no higher than `STUBAD`'s page.

`RSLCAP` tests the floor of `8000h` before it compares the word with the one
in `STUBAD` (`src/boot.asm:146-159`). The last condition allows for services,
which lower the word at `0006h`. The word is not compared with `PZTOP`, so a
reset pressed to recover from a service's `INIT` that hung still passes
(`src/boot.asm:113-123`). The test depends on two addresses of this build,
`STUBAD`'s own and `BENTRY`, so RAM left by a build with either one elsewhere
fails it.

A reset whose RAM passes the test is a recognised reset, and any other reset
gives the card's own drives. Cold boot clears page zero at its start and
writes its jumps again only in warm boot's `PZINIT`, after step 14. A reset
pressed during cold boot before then, or at the diagnostic prompt, therefore
fails the test too.

Cold boot is about to clear the drive table. When the RAM passes, `RSLCAP`
therefore copies the table, 32 bytes, to `RSLBUF` at `0100h` in the TPA
(`src/boot.asm:160-164`, `src/layout.asm:80-86`). Nothing writes there
between `COLD` and `RESEL`, so the copy survives the clearing of the workspace
and is still there for the diagnostic prompt's retry. When the RAM fails,
`RSLCAP` puts 0 in drive A's geometry byte in `RSLBUF`, which means no
selection (`src/boot.asm:165-167`).

`RESEL` applies the selection after `MOUNT` has accepted the card in the socket
and `ALVINIT` has given its drives their vectors in the usual way. Neither the
slots nor the TPA therefore varies with the selection (`src/vol.asm:468-559`).
The card in the socket may no longer hold the kept volumes, so `RESEL` works
in two steps. The first step changes no drive. It walks the card's
descriptors and compares each with every kept drive in `RSLBUF`. The
comparison is on the eight bytes a drive-table entry holds: the start, the
length, the geometry and the flags. A descriptor goes to the first kept drive
it matches, and the volume must fit that drive's vector slot. The card's own
drives stand in three cases: a read fails, a matched volume is too big for
its slot, or a kept drive is left unmatched.

The second step runs only when every kept drive has matched. It copies
`RSLBUF` over the drive table and the drives' indexes and builds each drive's
DPH. That step reads nothing and can't fail. A drive that was empty before the
reset stays empty, even if the card names a volume for it
(`src/vol.asm:468-482`).

The run below unmounts drive B with `MOUNT B:`, then presses reset. The kept
selection has no volume on B and the starter card's two volumes still match,
so after the reset only A is listed:

<!-- node tools/capture.mjs "MOUNT B:" "@reset" -->
```text
A>MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     

A>GLCD.SVC

A>
```

The selection is all that a reset keeps. Cold boot clears page zero, the
workspace and EXPAND 1 as on any cold boot. Services, the registry, the
cache, open files and the history are gone. The console is the one cold boot
starts: the PICO9918's on a board with it and the matrix keyboard, the serial
terminal on any other (`src/boot.asm:29-53`, `src/boot.asm:174-180`).
A change the cache held for the card is lost. One the cache had already
written stays on the card, since nothing is rolled back. Once a recognised
reset has applied a selection, each later reset applies it again while the
card still holds those volumes. The card's own drives come back only when the
test fails, after a power cycle or a reset pressed during cold boot. Chapter
5's [section on the drives after a reset](05-drives-and-cache.md#the-drives-after-a-reset)
sets out what a lost change leaves on the card and how to check it.

## Page zero

A program is free to write over page zero, so `PZINIT` writes page zero's
fixed parts at every warm boot. Cold boot runs on into warm boot, so the same
call builds page zero at cold boot, once (`src/boot.asm:81-100`,
`src/boot.asm:221-237`). It puts `JP BF03h` at `0000h`, a `JP` at `0005h` to
`PZTOP` and `JP BENTRY` at the address in `STUBAD`. It then runs on into
`PZSWP`, which rewrites the restart vectors at `0008h–003Fh`. Chapter 14
lists page zero in full.

The sweep keeps a vector a program pointed into the TPA from outliving the
program. A vector into a service lasts as long as the service. The rule
compares a vector's `JP` target with `PZTOP` as a word. A target above
`PZTOP` is in a service, the workspace or the ROM, and the vector keeps its
jump with the rest of its eight bytes zeroed. Any other vector becomes seven
zeros and a `RET`, so an `RST` through it returns at once with the interrupt
state unchanged (`src/boot.asm:247-273`). The bound is exact. A jump to
`PZTOP` itself, the first byte of the lowest service or of the BDOS entry
jump, gets the default, and a jump to the byte after it stays
(`src/boot.asm:252-260`, `test/svc.test.mjs:772-796`). `0038h`, where
interrupt mode 1 and `RST 38h` go, then gets `EI` and `RETI` unless it kept a
jump (`src/boot.asm:274-283`).
The IOBYTE at `0003h` and the drive and user byte at `0004h` are left as they
are. Chapter 24 describes how a service claims a vector, and the unload and
the failed `INIT` that also run this sweep.

## Warm boot

Warm boot is `WBOOTR`, `src/boot.asm:85-111`, the second entry of the BIOS
jump table. The jump at `0000h` leads to it through the RAM BIOS table at
`BF03h`. A program reaches it by returning from `0100h`, since the CCP pushes
`0000h` before it jumps there (`src/cpm/ccp.asm:14`,
`src/cpm/ccp.asm:323-326`). A program also reaches it by jumping to `0000h`
or through BDOS function 0 (`src/cpm/bdos.asm:163-164`), and a successful
function 47 ends there too (`src/cpm/bdos.asm:67-73`).

The BDOS goes there itself through `CHDROP`, which first drops the rest of a
chained line (`src/cpm/bdos.asm:77-79`). The BDOS takes that route in three
cases:

- a `^C` typed as the first key of a line read with function 10
  (`src/cpm/bdos.asm:400-404`);
- a `^C` typed to resume output that `^S` paused
  (`src/cpm/bdoscon.asm:209-214`);
- a BDOS error such as `Bdos Err On B: Select`, reported in the default error
  mode, which function 45 can change (`src/cpm/bdoslog.asm:575-578`,
  `src/cpm/bdoscon.asm:25-41`).

A `^C` at the prompt is the first case, since the CCP reads its line with
function 10:

<!-- node tools/capture.mjs ^C -->
```text
A>^C
A>
```

Warm boot's steps are:

1. `DI`, the latch and `LATCHV` set to `LATCLAS`, which puts EXPAND 0 back,
   and the stack set to the BIOS stack (`src/boot.asm:92-96`). The latch comes
   before the stack because the BIOS stack is in EXPAND 0.
2. `HWVREL`, which gives back the PICO9918 if a program claimed it, so that
   the console's registers, its interrupt among them, are restored before
   page zero is rebuilt (`src/boot.asm:97-99`, `src/services.asm:141-149`).
3. `PZINIT`, as above (`src/boot.asm:100`).
4. `SVCBSY` cleared, so that a service's `INIT` or `REMOVE` that a program's
   end interrupted is not taken to be still running (`src/boot.asm:101-102`).
5. `CPMINIT`, which clears the CCP's state and the BDOS's, 329 bytes from
   `CCPCLR` to `BDOSRME`, as a fresh load of them from disk would leave it.
   That puts function 45's error mode back to the default. The command buffer
   below `CCPCLR` is kept for a chained line's next piece. `CPMINIT` puts the
   DMA address back at `0080h`, sets the command buffer's maximum length to
   127 and fills the CCP stack's guard with `A5h`. It also clears the key that
   lets a write skip reading its block. The first write after the warm boot
   therefore reads its block before changing it (`src/boot.asm:288-312`,
   `src/ram.asm:82-96`).
6. The console put right. `VREST` restores the display's mode if the console
   is on one, and `VTREGR` resets the scroll region to the whole screen
   (`src/boot.asm:104-107`).
7. `CWBOOT`, which writes each dirty line of the cache to the card. A line
   whose write fails is dropped, so the card's copy stands, and the flush goes
   on to the next. After any failure `CWBOOT` prints `Write lost` once and
   drops the rest of a chained line (`src/boot.asm:108`,
   `src/cache.asm:182-215`, `src/cache.asm:388-397`). After function 47 this
   flush puts the records written behind on the card before the CCP loads the
   chained program. Chapter 18 describes the flush.
8. A jump to the CCP's entry, `CCPENT`, with `C` holding the drive and user
   byte from `0004h` (`src/boot.asm:109-111`).

Warm boot leaves the rest of memory alone, and the table in Chapter 14's
[section on the workspace](14-memory-map.md#the-workspace-and-what-clears-it)
says which parts those are. The CCP's entry does the rest. It sets `WRFLAG`
and calls BDOS function 13. With the flag set, the disk reset keeps a drive
logged in while nothing has changed its vector. It then calls `STBOOT`,
which starts the startup file once after a cold boot (`src/cpm/ccp.asm:29-66`).
Chapter 20 describes the entry, Chapter 19 the flagged reset and Chapter 25
the startup file.

## The cost of each boot

On the starter card with the serial board, cold boot takes 1,371,558 T-states
from the first instruction to the CCP's entry, about 0.34 seconds. The
figures in this section are measured on the host model. Three steps take most
of cold boot. The banner is 25 characters at
9,448 T-states each through `CONOUT`, 238,122 in all. The read of the
container's block 0 takes 219,144. `MEMINIT` takes 346,677, most of it the
clearing of EXPAND 1. The startup file's commands then run before the first
prompt, so the CCP's first call of `CONIN` at that prompt comes 7,200,316
T-states after reset.

Warm boot takes 32,502 T-states, about 8 milliseconds, from the first
instruction of `WBOOTR` to the CCP's label `STARTED`, where it starts printing
the prompt. The figure is for a warm boot with nothing changed since the last,
which reads no block. `CPMINIT` takes 7,327 T-states of it. The cache's flush
in `CWBOOT`, with no line to write, takes 8,437, and the CCP's entry with its
disk reset 14,272.

A warm boot after `SAVE 8 X.COM` on drive A takes 115,918 T-states on the same
measure. The extra 83,000 or so are the rebuild of A's vector from its
directory up to the last entry in use. The directory is read from the block
cache with no card access. For comparison, a disk reset of the kind a program makes drops drive
A and scans its whole directory again. That takes 1,036,661 T-states on the
starter card even with the directory in the cache. The first scan of drive
B's 512 entries, with the card read for each of its 32 directory blocks, takes
9,167,671. The test `test/warmboot.test.mjs` checks the unchanged case on its
own card: a warm boot that reads no block and takes at most 386,604 T-states
(`test/warmboot.test.mjs:11-17`).
