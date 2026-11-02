---
title: Reset, cold boot and warm boot
parent: TEC-OS
nav_order: 14
nav_group: "Part II: Inside TEC-OS"
---

# 14. Reset, cold boot and warm boot

Checked against TEC-OS 62d47ed, with the starter card's `EDIT.COM` from
Edit 845d062, whose copy on the card has the SHA-256
`ed88337e6dfa2626dd37a225a0ec09332f4927a0bde62114bbf8661d2d0fdc78`; the
timings below were measured on that card.

TEC-OS starts in two ways. Cold boot runs after power-on, after the reset
button and when a program calls the BIOS table's first entry
(`src/boot.asm:4`). It builds everything from nothing: page zero, the
workspace, the card's drives, the cache. Warm boot runs at the end of every
program. It puts back only what a program may have changed, and it keeps the
drives, the drivers and the cache. This chapter follows cold boot from the
first instruction at `0000h` to the point where it falls into warm boot. It
then follows warm boot as far as the CCP, with its cost in T-states. On the way
it describes the two checks of the RAM, the count of the memory regions and the
test that separates a reset from a power-on.

## The boot overlay

When the TEC-1G comes out of reset its system latch is `00h`. With bit 0 of
the latch low, the board shows the ROM's first 2 KiB at `0000h–07FFh` as well
as at `C000h–C7FFh`. The Z80 starts at `0000h`, so it runs ROM code before any
RAM has been written. The ROM's first instruction is `JP COLD`
(`src/reset.asm:5-6`), and the Z80 runs it from the copy at `0000h`. The jump's
target is an address in `C000h–FFFFh`, so the next instruction comes from the
ROM proper. `COLD` executes `DI`, loads the stack pointer and then writes
`LATCLAS`, `01h`, to the latch (`src/boot.asm:9-12`). Bit 0 high turns the copy
off, `0000h–07FFh` is RAM again, and the latch now has MAIN 0 and EXPAND 0 in
view (`src/layout.asm:16`, `src/layout.asm:19`).

The Z80 comes out of reset with interrupts off. TEC-OS executes `EI` only to
restore a state it saved (`src/cache.asm:32`, `src/history.asm:39`,
`src/xmove.asm:136`). Its routines that must run with interrupts off put them
back as they were at entry. Interrupts therefore come on only if a program
enables them. Chapter 19 describes what that costs a program that does.

## Cold boot

`COLD` is one routine, `src/boot.asm:9-54`, and the steps of a cold boot are
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
   probes for the PICO9918, then the banner (`src/boot.asm:29-31`).
7. `LCDINIT` and the LCD's top row (`src/boot.asm:34-36`).
8. `SDINIT`, which starts the card, and `MOUNT`, which reads and checks the
   container and fills the drive table. Either failure goes to the
   diagnostic prompt, `DIAG` (`src/boot.asm:37-40`).
9. `ALVINIT`, which places the allocation vectors and the BDOS entry jump,
   and `RESEL`, which applies the kept selection if the card still has it
   (`src/boot.asm:41-42`).
10. `PZTOP`, the top of the TPA, set to the BDOS entry jump, since no driver
    is loaded yet (`src/boot.asm:43-44`).
11. The BIOS jump table copied from the ROM to `BF00h` (`src/boot.asm:45-48`).
12. The volumes printed on the console and on the LCD (`src/boot.asm:49-50`).
13. Drive A and user 0 at `0004h`, and page zero built by `PZINIT`
    (`src/boot.asm:51-53`).
14. `MEMINIT`, which counts the MAIN and EXPAND regions and clears EXPAND 1
    (`src/boot.asm:54`). When it returns, cold boot runs on into warm boot,
    the next routine in the file.

The order follows from what each step needs. The reset test comes first
because the steps after it clear the memory it reads. The workspace is cleared
only after the RAM check, since until then it may not be RAM. The stack moves
into the workspace only after it is cleared. Step 11 runs at cold boot only,
for the reason Chapter 15 gives. Chapter 18 describes steps 8 and 9, and the
rest of this chapter steps 2, 4 and 14.

The diagnostic prompt's `R` jumps back to `COLDRT`, step 7
(`src/diag.asm:22-23`, `src/boot.asm:32-34`). A retry clears the LCD, starts
the card again and mounts it, without clearing the memory or printing the
banner a second time.

On the starter card with the serial board, cold boot takes 1,279,382 T-states,
about 0.32 seconds, measured on the host model. That is from the first
instruction to the CCP's entry. Three steps take most of it. The banner is 25 characters at
9,372 T-states each through `CONOUT`. The read of the container's block 0
takes 219,137 T-states. `MEMINIT` takes about 347,000, most of it the clearing
of EXPAND 1. The startup file's commands then run before the first prompt. The
CCP's first call of `CONIN` at that prompt comes 8,907,139 T-states after
reset.

## The two RAM checks

TEC-OS needs RAM at `8000h–BFFFh`, because its workspace and stacks are there,
and it needs both halves of U9, because EXPAND 1 holds the cache.

The first check, `RAMCHK`, runs before anything has been printed, on the boot
stack in fixed RAM (`src/boot.asm:291-309`). It writes `55h` at `8000h` and
`AAh` at `BFFFh`, reads both back, and does it again with the patterns swapped.
Both ends are written before either is read. A board with nothing in U9 has a
floating data bus, and this order stops it returning the byte just written from
the bus itself (`src/boot.asm:292-294`). If either byte is wrong, `RAMBAD` sends
`TEC-OS needs 64K RAM` to the serial port and stops in a loop
(`src/boot.asm:311-320`). It calls the transmit routine `TXBYTE` directly,
since the console isn't started yet and that routine uses only the port and
the stack.

The second check is in `MEMINIT`, near the end of cold boot, and it tests for
EXPAND 1 (`src/boot.asm:143-148`). It uses `DETECT`, the routine that also
counts MAIN regions. If the count is not 2, it jumps to the same `RAMBAD`. The
same message then goes to the serial port, after the volumes have been printed.
`EXPANDS` at `0044h` therefore always holds 2 once cold boot has finished
(`src/layout.asm:41`).

## Counting MAIN and EXPAND

`DETECT` tests whether setting a given latch bit puts different RAM at a given
address (`src/boot.asm:185-213`). It reads the byte at the address with the bit
clear, sets the bit and reads the byte again. It then writes the complement of
the first byte and clears the bit. If the byte read now, with the bit clear, is
no longer the first byte, the write landed in the same RAM. The bit then
selects nothing and there is one region. If the byte is unchanged, the write
went to other RAM, and there are two. Each byte is put back as it was. The
routine returns 1 or 2, with the latch values without and with the bit in `D`
and `E`. Nothing is pushed while the bit is set, because the stack itself may
be in the RAM the bit replaces.

`MEMINIT` tests EXPAND at `8000h` with `LATEXP`, and MAIN at `0100h` with
`LATMAIN` (`src/layout.asm:21-22`, `src/boot.asm:143-171`). With EXPAND 1
found, it uses `DETECT`'s latch value to put EXPAND 1 in view and clears all
16 KiB of it. It fills the cache's 120 bytes of line addresses with `FFh`,
which marks every line empty, and puts EXPAND 0 back (`src/boot.asm:149-162`).
It sets EXPAND 1's low mark to `80h`, which closes it to programs' copies
(`src/boot.asm:163-165`). The count of MAIN regions goes to `MAINS` at `0041h`,
which the table at `C00Dh` points at. With a second MAIN, `MNCOPY` copies page
zero into it a byte at a time, switching the latch between each read and its
write (`src/boot.asm:172-183`). MAIN 1's `0000h` then also jumps to the RAM
BIOS table.

## The reset test

The TEC-1G's reset button and its power-on reset the Z80 in the same way. The
difference is in the RAM. After power-on it holds whatever the chips came up
with, and after the button it still holds what TEC-OS left there. TEC-OS uses
that to keep one thing across a reset, the selection of volumes on the drives.
A reset of a board whose drives were changed with `MOUNT` then comes back with
the same drives.

The test is `RSLCAP` (`src/boot.asm:84-138`). It reads only page zero, the word
`STUBAD`, the three bytes at the address that word holds and the drive table.
It runs none of the code it reads. The RAM passes when all of these hold:

- `0000h` holds a `JP` to `BF03h`, the RAM BIOS table's warm boot entry.
- `0005h` holds a `JP`.
- The word in `STUBAD`, the address where cold boot put the BDOS entry jump,
  is an address of the form `xx06h`, and the three bytes there are
  `JP BENTRY`, the BDOS entry of this ROM.
- The word at `0006h` is of the form `xx06h`, at least `8000h`, and no
  higher than `STUBAD`'s page.

The last condition allows for drivers, which lower the word at `0006h`. The
word is not compared with `PZTOP`, so that a reset pressed to recover from a
driver's `INIT` that hung still passes (`src/boot.asm:88-89`). The test depends
on two addresses of this build, `STUBAD`'s own and `BENTRY`. RAM left by a
build with either one elsewhere fails it (`src/boot.asm:90-91`).

A reset whose RAM passes the test is a recognised reset, and any other reset
gives the card's own drives. Cold boot clears page zero at its start and writes
its jumps again only at step 13. A reset pressed during cold boot before that
step, or at the diagnostic prompt, therefore fails the test too.

When the RAM passes, `RSLCAP` copies the drive table, 32 bytes, to `RSLBUF` at
`0100h` in the TPA (`src/boot.asm:131-135`, `src/layout.asm:89-95`). Nothing
writes there between `COLD` and `MEMINIT`, so the copy survives the clearing of
the workspace and is still there for the diagnostic prompt's retry. When the
RAM fails, `RSLCAP` puts 0 in drive A's geometry byte in `RSLBUF`, which means
no selection (`src/boot.asm:136-138`).

`RESEL` applies the selection after `MOUNT` has accepted the card in the socket
and `ALVINIT` has given its drives their vectors in the usual way
(`src/vol.asm:391-480`). It works in two steps. The first reads and changes
nothing in the drive table. It walks the card's descriptors and compares each
with every kept drive. The comparison uses the eight bytes a drive-table entry
holds: the start, the length, the geometry and the flags. A descriptor goes to
the first kept drive it matches, and the volume must fit that drive's vector
slot. `RESEL` returns and the card's own drives stand in three cases: a read
fails, a matching volume would not fit its slot, or a kept drive is left with
no match.

The second step runs only when every kept drive has matched. It copies `RSLBUF`
over the drive table and the drives' indexes and builds each drive's DPH. That
step reads nothing and can't fail. A drive that was empty before the reset stays empty,
even if the card names a volume for it (`src/vol.asm:402-404`).

The run below unmounts drive B with `MOUNT B:`, then presses reset. The kept
selection has no volume on B, the starter card's two volumes still match, and
after the reset only A is listed:

<!-- node book/capture.mjs "MOUNT B:" "@reset" -->
```text
A>MOUNT B:
Unmounted

A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     

A>PICO.DRV
PICO.DRV?

A>GLCD.DRV
GLCD.DRV?

A>
```

The selection is all that a reset keeps. Cold boot clears page zero, the
workspace and EXPAND 1 as on any cold boot. Drivers, the registry, the cache,
open files and the history are gone, and the console is the serial terminal
again (`src/boot.asm:15-28`, `src/boot.asm:149-155`). A change the cache held
for the card is lost. Once a recognised reset has applied a selection, the next
reset passes the test again while the card still holds those volumes. Only
losing the RAM returns the drives to the card's own choice, and
`docs/recovery.md` sets out these limits for the user.

## Page zero

`PZINIT` writes page zero's fixed parts at the end of cold boot and again at
every warm boot (`src/boot.asm:215-265`). It puts `JP BF03h` at `0000h`, a
`JP` at `0005h` to `PZTOP`, and `JP BENTRY` at the address in `STUBAD`. It
writes `EI` and `RETI` at `0038h`, where interrupt mode 1 and `RST 38h` go, and
it rewrites the restart vectors at `0008h–0037h`.

A vector that jumps into the ROM keeps its jump and has the rest of its eight
bytes zeroed. Any other becomes seven zeros and a `RET`, so that an `RST`
through it returns at once with the interrupt state unchanged. A vector that a
program pointed into the TPA therefore does not outlive the program
(`src/boot.asm:235-265`). The IOBYTE at `0003h` and the drive and user byte at
`0004h` are left as they are. Chapter 13 lists page zero in full.

## Warm boot

Warm boot is `WBOOTR`, `src/boot.asm:56-82`. It is the second entry of the
BIOS table, and the jump at `0000h` leads to it through the RAM table at
`BF03h`. A program reaches it by returning from `0100h`, since the CCP pushes
`0000h` before it jumps there (`src/cpm/ccp.asm:14`,
`src/cpm/ccp.asm:297-300`). A program also reaches it by jumping to `0000h` or
by calling BDOS function 0 (`src/cpm/bdos.asm:132-133`). A call of BDOS function
47 that succeeds ends there too (`src/cpm/bdos.asm:65-71`).

The BDOS goes there itself through `CHDROP`, which first drops the rest of a
chained line, a line split at `!` (Chapter 11, `src/cpm/bdos.asm:75-77`). The
BDOS takes that route after a `^C` typed as the first key of a line read with
function 10 (`src/cpm/bdos.asm:371-375`), and after it has reported a disk error
such as `Bdos Err On B: Select` (`src/cpm/bdos.asm:2434-2437`,
`src/cpm/bdos.asm:2453-2456`). A `^C` at the prompt is the first case, since
the CCP reads its line with function 10:

<!-- node book/capture.mjs ^C -->
```text
A>^C
A>
```

Warm boot's steps are:

1. `DI`, then EXPAND 1 in view, and `JP WBOOTR` written at `BF03h` in EXPAND
   1 (`src/boot.asm:59-65`). The jump is for a program that ends with
   EXPAND 1 in view: its jump to `0000h` reaches `BF03h` in EXPAND 1, where
   this jump is.
2. The latch and `LATCHV` set to `LATCLAS`, which puts MAIN 0 and EXPAND 0
   back, and the stack set to the BIOS stack (`src/boot.asm:66-69`). The
   latch comes before the stack because the BIOS stack is in EXPAND 0.
3. `PZINIT`, as above (`src/boot.asm:70`).
4. `DRVBSY` cleared, so that a driver's `INIT` or `REMOVE` that a program's
   end interrupted is not taken to be still running (`src/boot.asm:71-72`).
5. `CPMINIT`, which clears the CCP's working memory and the BDOS's state,
   331 bytes from `CCPCLR` to `BDOSRME`, as a fresh load of them from disk
   would leave it. It keeps the command buffer below `CCPCLR` for a chained
   line's next piece. It puts the DMA address back at `0080h`, sets the command
   buffer's maximum length to 127 and fills the CCP stack's guard with `A5h`.
   It marks the deblocking buffer empty so that a changed card is read again
   (`src/boot.asm:270-289`, `src/ram.asm:68-81`).
6. The console put right. `HWVREL` gives back the PICO9918 if a program
   claimed it, `VREST` restores the video display's mode if the console is
   on one, and `VTREGR` resets the scroll region to the whole screen
   (`src/boot.asm:74-78`).
7. `CWBOOT`, which writes every changed line of the cache to the card. If any
   write has failed since the last warm boot, it prints `Write lost` and
   drops the rest of a chained line (`src/boot.asm:79`,
   `src/cache.asm:347-358`).
8. A jump to the CCP's entry, `CCPENT`, with `C` holding the drive and user
   byte from `0004h` (`src/boot.asm:80-82`).

Warm boot leaves the rest alone. The drive table, the DPHs and `LOGINV`, the
BDOS's record of the logged-in drives, are in the BIOS's part of the workspace,
which `CPMINIT` does not clear (`src/ram.asm:22-34`). The allocation vectors
below `WSBASE` and the BIOS table at `BF00h` are outside what `CPMINIT` clears
too. So are the two FCBs and the command buffer, the 202 bytes of the CCP's RAM below
`CCPCLR`. So is `CHPOS`, the byte above the BIOS table that marks a chained
line's next piece. The rest of the line therefore outlives the warm boot
(`src/ram.asm:68-81`, `src/ram.asm:240`), as Chapter 25 describes. The drivers
below the BDOS entry are kept too. So are the registry's head and the video
drivers' tables above the BIOS table, and the cache's lines and the history in
EXPAND 1.

The CCP's entry does the rest (`src/cpm/ccp.asm:29-66`). It sets its stack and
puts A: in place of a drive past D: or with no volume. Selecting such a drive
would give a `Select` error and a warm boot back to the same place
(`src/cpm/ccp.asm:33-44`). It sets `WRFLAG` before it calls BDOS function 13,
the disk reset. With that flag set, function 13 keeps a logged-in drive if
nothing has changed its vector since it was last built and the vector still
sums as it did then. A drive that a write has changed is marked for a rebuild
at its next selection, from its directory entries up to the highest one in use.
Any other is dropped and is scanned in full when it is next selected
(`src/cpm/bdos.asm:481-542`). A program's own call of function 13 has no flag
set and drops every drive, as CP/M 2.2 does.

The CCP then sets the user number from the byte it was given. It calls
`STBOOT`, which starts the startup file once after a cold boot (Chapter 22
describes it), and it selects the drive if it is not A. Its main loop then takes a
chained line's next piece, if one is left, before the startup file's next line
and before the console (`src/cpm/ccp.asm:80-84`).

## The cost of a warm boot

On the starter card with the serial board, warm boot takes 31,455 T-states,
about 8 milliseconds. That runs from the first instruction of `WBOOTR` to the
CCP's label `STARTED`, where it starts printing the prompt. The figure was
measured on the host model with nothing changed since the last warm boot, and
in that case warm boot reads no block. Of it, `CPMINIT` takes 7,427 T-states.
The cache's flush in `CWBOOT`, with no line to write, takes 8,002, and the
CCP's entry with its disk reset 13,828.

A warm boot after `SAVE 8 X.COM` on drive A takes 119,508 T-states on the same
measure. The extra 88,000 or so are the rebuild of A's vector from its directory
up to the last entry in use. The directory is read from the block cache with no
card access.
For comparison, a disk reset of the kind a program makes drops drive A and
scans its whole directory again. It takes 1,035,496 T-states on the starter
card even with the directory in the cache. The first scan of drive B's 512
entries, with the card read for each of its 32 directory blocks, takes
9,163,477. The test `test/warmboot.test.mjs` checks the unchanged case on its
own card: a warm boot that reads no block and takes at most 386,604 T-states
(`test/warmboot.test.mjs:11-17`).
