---
title: The hardware services and the service loader
parent: TEC-OS
nav_order: 20
nav_group: "Part II: Inside TEC-OS"
---

# 20. The hardware services and the service loader

Checked against TEC-OS ea9c1c0. The six bytes below were left by the starter
card's `TAS.COM`, from Thorium dbee66a, SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

Chapters 9 and 10 use two sets of ROM routines from a program's side. This
chapter describes the code behind them: the dispatcher at `ABIHW` and each of
the nine hardware services, `XMOVE` and `MOVE`, the seven steps of a service's
load, the registry, removal and the stack figures the loader enforces. Chapter
21 describes the `.SVC` file's relocation data, and Chapter 22 the path of a
display line after the load.

## The dispatcher

`ABIHW`, at `C00Ah`, is a `JP` to `HWSVC` (`src/abi.asm:11`). A program calls
it with the service number in `C` and its arguments in `B`, `DE` and `HL`. The
dispatcher therefore has only `A` and the flags to work with until it has saved
what it needs.

The service numbers start at `HWBASE`, 19, so that the numbers of the table's
previous major version fail (`src/hwsvc.asm:27`). The range test is one
comparison: `SUB HWBASE` takes 19
from the number, so a number below 19 wraps to a large one, and `CP HWCOUNT`
then tests both ends (`src/hwsvc.asm:52-54`). The `LD A,HWEBAD` that follows
leaves the flags alone, so a number out of range leaves through `HWERR` with
status 1 and carry set, and with `B`, `DE` and `HL` unchanged
(`src/hwsvc.asm:55-56`, `src/hwsvc.asm:72-74`).

The lookup needs a register pair, and all three carry arguments, so `HWSVC`
pushes `HL` and `DE` and doubles the number into `DE`. It adds that to
`HWTAB0`, the table's address less twice `HWBASE` (`src/hwsvc.asm:46`,
`src/hwsvc.asm:57-64`). `HWTAB`, the 18 bytes of routine addresses, is in the
ROM's data block (`src/data3.asm:94-98`). The routine's address goes to `HL`
and the caller's `DE` comes back. Two instructions finish the job:
`EX (SP),HL` swaps the routine's address with the saved `HL` on the stack, and
`RET` jumps to it (`src/hwsvc.asm:65-71`). The routine starts with every
argument in place and the dispatcher's two words gone from the stack.

The two exits are `HWERR` and `HWOK`, whose `XOR A` gives status 0 with zero
set and carry clear (`src/hwsvc.asm:72-76`). No routine touches `IX`, `IY` or
the alternate registers (`src/hwsvc.asm:3-4`).

## The routines

The dispatcher, its exits and the nine routines are 467 bytes of the ROM's
code, by the symbol map of the `debug80` build. With `HWTAB` the whole set is
485:

| Number | Name | Routine | Bytes |
| ---: | --- | --- | ---: |
| | dispatcher, exits | `HWSVC` | 32 |
| 19 | `INFO` | `HWSINFO` | 24 |
| 20 | `DIGIT` | `HWSDIG` | 26 |
| 21 | `LCD` | `HWSLCD` | 44 |
| 22 | `VIDEO` | `HWSVID` | 81 |
| 23 | `TONE` | `HWSTONE` | 29 |
| 24 | `JOY` | `HWSJOY` | 10 |
| 25 | `KEYS` | `HWSKEYS` | 15 |
| 26 | `PUTAT` | `HWSPUT` | 68 |
| 27 | `RTC` | `HWSRTC`, with its clock routines | 138 |

`INFO` calls `RTCHAS` first, whose zero flag reports the clock, and that flag
survives the `LD A,(CONDEV)` after it (`src/hwsvc.asm:81-85`). `B` is
therefore the byte `CONDEV`, the devices found at cold boot, with bit 3 added
if the clock answered and with `VCLAIM` ORed in. `VCLAIM` holds `CDCLM`, which
has the value of `INFO`'s bit 4, while the chip is claimed
(`src/hwsvc.asm:86-88`, `src/layout.asm:42`, `src/ram.asm:57`,
`src/layout.asm:57`). `DE` is `ROMVER`, and one 16-bit load from `VWID` gets
`L` and `H` (`src/hwsvc.asm:89-91`), because the columns and rows are adjacent
bytes at `0048h` and `0049h` (`src/layout.asm:45-46`).

`DIGIT` walks one set bit in `C` from `20h` down, one bit for each digit, and
stops when `SRL C` empties the register (`src/hwsvc.asm:94`,
`src/hwsvc.asm:105-106`). For each digit it writes the pattern to `SEGPORT` and
the select bit with `TXIDLE` to `DIGPORT`. It then waits through 256 rounds of
`DJNZ` and writes `TXIDLE` alone (`src/hwsvc.asm:95-103`). Each write to port
`01h` carries bit 6, so the serial line stays high.

`LCD` tests the row before it does anything, then clears `CDWRD` for row 3, as
Chapter 22 explains (`src/hwsvc.asm:109-118`). `LCDROWS` gives the row's
display address, and then 20 characters go out, each after `LCDWAIT`
(`src/hwsvc.asm:119-131`, `src/data2.asm:6`).

`VIDEO` returns status 2 unless `CDTMS` is set, the bit of `CONDEV` that
records a PICO9918 answering at cold boot (`src/hwsvc.asm:138-141`,
`src/layout.asm:55`). A claim hides the cursor if the PICO9918 is the console,
and stores `CDCLM` in `VCLAIM` (`src/hwsvc.asm:145-150`). The console tests
that byte and `CONMOD` through `VTOWN`, so a claim stops it only while the
PICO9918 is the console (`src/term.asm:533-544`).

A release with no claim returns at once. A real release clears the byte and
then needs the driver to restore the chip. `PIVEC` holds `PICO.SVC`'s table,
and with 0 there the routine returns and the chip stays as the program left it
(`src/hwsvc.asm:151-159`). Otherwise it reads the word at offset 6, the
table's fourth entry, `VREST`, and calls it through `VHLJP`
(`src/hwsvc.asm:160-166`, `src/video.asm:20`). If the PICO9918 is the console,
it also clears the screen and homes the cursor (`src/hwsvc.asm:167-174`). Warm
boot calls `HWVREL` directly, which is why a program's claim doesn't outlive
it (`src/boot.asm:74`).

`TONE` toggles bit 7 of `A`, which starts as `TXIDLE`, and writes it to port
`01h` (`src/hwsvc.asm:182-184`). The inner loop counts `B` with `C`, and `A`
then holds the output while `C` is borrowed to test `DE` for zero
(`src/hwsvc.asm:185-193`). Counted from the instructions, a half cycle is 16 ×
`B` + 51 T-states, as Chapter 9's measurements show (`src/hwsvc.asm:177-178`).
`B` = 0 reaches `DEC C` with 0 and goes round 256 times. The routine ends with
`TXIDLE`, so the speaker stops low
(`src/hwsvc.asm:194-195`).

`JOY` and `KEYS` read the same port. `IN A,(C)` puts `B` on the top address
lines. `HWSKEYS` starts with `BC` = `FEFEh` and rotates `B` left, so one
address line is low at a time (`src/hwsvc.asm:205-210`). `RLC B` moves the old
top bit into carry. After the eighth read that bit is the 0, so the loop stops
at 8 rows (`src/hwsvc.asm:210-211`). `HWSJOY` makes one read with `BC` =
`F7FEh`, the fourth value of `HWSKEYS`'s `B`, which is why the joystick shares
row 3 (`src/hwsvc.asm:199-200`). Both complement the byte, so a key down reads
1.

`PUTAT` needs a video console the program hasn't claimed, so it has two tests
at its head, and either failure gives status 2. `VTOWN` gives nonzero for a
claimed console, and `RRCA` on `CONMOD` puts bit 0 in carry, which is set for
`CMCRT` and `CMUC1` and clear for the other two modes
(`src/hwsvc.asm:218-224`). A count of 0 returns before anything changes
(`src/hwsvc.asm:225-227`). The cursor comes off, and a row past `VHGT` leaves
with status 0 (`src/hwsvc.asm:231-238`). The loop then clips each cell against
`VWID` and calls `VPUT`, the driver's routine, with `A`, `B` and `C` as the
driver takes them (`src/hwsvc.asm:239-255`). `VPUT` jumps through the driver's
table (`src/video.asm:13`). `PUTAT` is the deepest hardware service, at 22
bytes on a `GLCD.SVC` console (`src/hwsvc.asm:4-6`).

`RTC` tests for the clock with `RTCHAS`, which reads the seconds register. It
counts any value below `60h` as an answer, on the ground that a seconds register
holds BCD (`src/hwsvc.asm:292-303`). `RTCCMD` raises the enable bit, and `RTCWR`
clocks a byte out least significant bit first (`src/hwsvc.asm:312-325`).
`HWSRTC` uses the DS1302's burst modes, command `BFh` to read and `BEh` to
write. A write first clears write protect with `RTCPUT`, and its burst carries
the 7 bytes and then the control byte, 0 (`src/hwsvc.asm:268-286`).

None of these routines calls the BDOS, and their one byte of state, `VCLAIM`,
is in the workspace (`src/hwsvc.asm:4-6`).

## XMOVE and MOVE

Chapter 16 follows function 50 to these two routines, and Chapter 7 uses them.
`XMOVE` stores its two bank numbers in `XMDST` and `XMSRC` and does nothing
else (`src/xmove.asm:10-14`, `src/ram.asm:224-225`). `MOVE` takes its ranges
from a program, so it checks each end against its bank with `MVRANGE`,
destination first, swapping `HL` and `DE` for the second call
(`src/xmove.asm:27-34`).

`MVRANGE` rejects a bank number of 2 or more (`src/xmove.asm:151-152`). For
bank 0 the limit is the word at `0006h`, read at each call. For bank 1 the
address must have bit 7 set, and the limit is `XMARK`'s page
(`src/xmove.asm:153-160`). Either way it adds the count, and an overflow or an
end past the limit gives carry (`src/xmove.asm:161-166`). Cold boot sets
`XMARK` to `80h` (`src/boot.asm:164-165`, `src/layout.asm:23`), so the limit
is `8000h`, the first address the range can hold, and every byte in bank 1 is
rejected. A failed check goes to `MVBAD`, which gives `A` = `FFh` with nothing
copied. Every exit clears both bank numbers, so `XMOVE` lasts for one `MOVE`
(`src/xmove.asm:139-145`).

`MVCOPY` is the copy without those checks. The block cache calls it directly
to move lines to and from EXPAND 1 (`src/cache.asm:269-276`,
`src/cache.asm:372-377`). Its cross-bank path is therefore the cache's alone,
since a program's `MOVE` to bank 1 never gets past `MVRANGE`.

A count of 0 returns at once (`src/xmove.asm:37-39`). Any other copy moves the
latch with interrupts off, so `LD A,I` copies the interrupt enable to the flag
`P/V`, and `DI` and `PUSH AF` keep it for the end (`src/xmove.asm:40-42`). `BC`,
`DE` and `HL` hold the copy's own values, so the two latch values go in the
alternate registers, whose old values are pushed first: `C'` is the port, and
`D'` and `E'` are `LATCHV` with `LATEXP` set for each end in bank 1
(`src/xmove.asm:43-57`). Equal values mean one bank, and
`MVLDIR` writes that latch, does an `LDIR` and goes to `MVEND`
(`src/xmove.asm:58-61`, `src/xmove.asm:122-127`).

EXPAND 0 and EXPAND 1 share the addresses `8000h–BFFFh`, so a copy between
them can't have both in view. The part of the bank-0 end below `8000h` is in
MAIN 0, which stays in view, so that part goes by one `LDIR` with EXPAND 1
selected (`src/xmove.asm:62-99`). The part in EXPAND 0 goes one byte at a
time, with the latch written between the read and the write
(`src/xmove.asm:104-120`). While EXPAND 1 is in view the code uses no stack,
because the caller's stack may be in EXPAND 0 (`src/xmove.asm:21-22`).

`MVEND` writes `LATCHV` back to the latch, pops the alternates and enables
interrupts only if `P/V` shows they were on (`src/xmove.asm:128-136`). A copy
never selects another MAIN (`src/xmove.asm:6`).

## From the command to the loader

A command whose type is `SVC` calls `SVCGO`, as Chapter 17 explains
(`src/cpm/ccp.asm:267-276`). `SVCGO` calls `LOADCOM`, the routine that reads a
`.COM` file to `0100h`. The file is then in the TPA, up to the page of the
word at `0006h`, and `LOADTOP` gives its end (`src/glcd.asm:71-72`,
`src/cpm/ccp.asm:359-371`, `src/ram.asm:230`). `SVCGO` then calls `SVCLOAD`
(`src/glcd.asm:73`). Chapter 22 describes what the console does after a good
load.

`SVCLOAD` works on the file at `DF`, `0100h`, where the header's fields have
the offsets in Chapter 10's table (`src/svc.asm:11-24`). It reports through
carry and `SVCRC` (`src/svc.asm:69-71`), and the CCP treats every carry alike,
as a name with a question mark.

## The seven steps

Before the move in step 5 a load changes only the file and the loader's own
variables, so a failure in the first four steps leaves the rest of memory as it
was (`src/svc.asm:69-71`). The write of `PZTOP` in step 7 is the commit: until
then a warm boot gives the pages back, as step 6 describes.

### 1. The file's checks

`SVCLOAD` zeroes `SVCRC` and tests `SVCBSY`, which is `80h` while an `INIT` or
`REMOVE` runs (`src/svc.asm:72-76`, `src/ram.asm:233`). It compares the first
two bytes with `DMAGIC`, the letter `D` and format 3 (`src/svc.asm:11`,
`src/svc.asm:77-80`). `SVCEXT` checks that the size at offset 6 lies within the
records read (`src/svc.asm:81-84`, `src/svc.asm:324-330`). `SVCIN` checks that
`INIT` and `REMOVE` each lie between the header and the image's end
(`src/svc.asm:85-90`, `src/svc.asm:333-339`).

The page comes next, by the sum in Chapter 21. An overflow, a borrow or a page
below `80h` fails the load, and the page goes in `PRLDL`
(`src/svc.asm:91-101`). For `COUNT.SVC` on the serial board, with the top at
`B806h` and 100 bytes, the page is `B7h`.

### 2. The dependencies

The dependencies follow the image, and `HL` walks them with a count from
offset 2 (`src/svc.asm:102-107`). Each must lie within the records read, and
`REGFIND`, described below, looks up its 8-byte name with its least version in
`C` (`src/svc.asm:110-118`). `EX (SP),HL` keeps the next entry's address on the
stack across the lookup (`src/svc.asm:112`). A missing record ends the load
(`src/svc.asm:119-121`).

### 3. The stacks

The relocation data must lie within the records read too
(`src/svc.asm:125-128`). A service's code runs on its caller's stack, as the
section on the stack figures describes, so each load has to fit its figures
into the room left. `HL` then points at that room on the three stacks: `SVCLIM`
with no service in, and otherwise offset 12 of
the newest service's header (`src/svc.asm:129-134`). The loop takes each
figure in the new header from that room and fails on a borrow, and it stores
the difference over the figure in the new header (`src/svc.asm:135-145`). The
header in memory then holds the room left below this service, and the loader
keeps no other total. On the serial board, with limits 8, 12 and 6,
`COUNT.SVC`'s figures of 2 each leave `06h`, `0Ah` and `04h` at `B70Ch`, as
the script under "The bytes below 0006h" prints.

### 4. The relocation

Chapter 21 describes this pass. Each byte of the list is a gap, 255 is a gap
and no fixup, and the check stops a list running past the image
(`src/svc.asm:148-176`). `HL` starts at `DF+DHLEN-1`, the byte before the
image (`src/svc.asm:151`). A list whose first gap is 0 therefore adds the page
to header byte 24, the name's last. `makeSvc` never writes such a list, since
its first gap counts from the byte before the image to a fixup at offset 0 or
later (`tools/lib/svc.mjs:37-44`), and the loader doesn't test for one. This
file is `COUNT.SVC` from Chapter 10 with a 0 put at the front of its list:

```sh
node -e '
const { readFileSync, writeFileSync } = require("node:fs");
const f = readFileSync("COUNT.SVC");
const out = Buffer.concat([f.subarray(0, 100), Buffer.from([0]), f.subarray(100)]);
out[10] += 1;
writeFileSync("GAPZERO.SVC", out);
'
node tools/tecvol.mjs put svc.img B GAPZERO.SVC
```

<!-- node tools/capture.mjs --card svc.img B: GAPZERO.SVC SERVICES -->
```text
A>B:
B>GAPZERO.SVC

B>SERVICES
COUNTW 1
B>
```

The space at byte 24 has become `20h` + `B7h`, `D7h`, and `PUTTRIM` masks bit
7 (`src/cpm/ccp.asm:755-757`), so the name prints with a `W`.

### 5. The move

Chapter 21 gives the fields the loader writes over the header, the `LDIR` that
moves it and the new word at `0006h` (`src/svc.asm:194-210`). `PZTOP`, the word
that warm boot puts at `0006h`, isn't written (`src/ram.asm:228`). Offset 8, the
high byte of the `JP` written at offset 6, is the old top's page, the page above
this service's last. `SVCBND` reads it there for the loader's bounds
(`src/svc.asm:300-306`).

### 6. INIT

`SVCCALL` sets `SVCBSY`, reads the 2-byte offset at `HL`, adds the page to its
high byte and jumps (`src/svc.asm:211-212`, `src/svc.asm:289-297`). The header
is on a page boundary, so no 16-bit addition is needed. `INIT` returns to the
instruction after the call, on the CCP's stack (`src/cpm/ccp.asm:274`).

A warm boot during `INIT` leaves the word at `0006h` correct, because `PZTOP` is
untouched. `PZINIT` writes `PZTOP` to `0006h` (`src/boot.asm:224-225`), and warm
boot clears `SVCBSY` (`src/boot.asm:71-72`). The pages go back as if the load
had never started, and `test/svc.test.mjs:432-445` checks that a later load
works. A hook already in the table then points into the TPA, which is
why hooks go last (`test/svc.test.mjs:461-468`). A reset during a hung `INIT` is
recognised all the same, because `RSLCAP` doesn't compare the word at `0006h`
with `PZTOP` (`src/boot.asm:88-89`).

### 7. The records and the commit

`SVCBND` loads `D` with the service's page and `E` with the page above its last,
and carry from `INIT` goes to the failure path (`src/svc.asm:213-214`,
`src/svc.asm:300-306`). With `HL` at the first record, the walk checks each
record's first byte, then its last, then the high byte of its table address.
Each check uses `SVCCK` against `D` and `E` (`src/svc.asm:217-236`,
`src/svc.asm:316-321`). Since `SVCCK` compares pages, a record can't cross out
of the service and a link can't leave it. `B` starts at 0, so `DJNZ` allows 255
records, and a list of 256, or one that loops, ends the walk (`src/svc.asm:216`,
`src/svc.asm:237`, `test/svc.test.mjs:256`).

With the walk done, `SVCLK` writes the first record's address to `REGHEAD`, the
head of the registry. It writes the old head into the last record's link, which
`PRLN` has held (`src/svc.asm:265-274`, `src/ram.asm:234`). A service's records
thus join the front of the list as one chain, and a service with none leaves the
list alone (`src/svc.asm:266-268`). `SVCCOM` sets `SVCHEAD`, the lowest
service's page, to this page and writes `PZTOP`, and that write is the commit
(`src/svc.asm:275-279`, `src/ram.asm:235`). `SVCSHUT` clears `SVCBSY`, and a
final `CP 1` and `CCF` turn `SVCRC` into the carry (`src/svc.asm:280-286`).

## A failed load

Until `SVCMOV` nothing but the file has changed, and each failure returns carry
with `SVCRC` at 0. After the move there are three outcomes, and the labels
`SVCSCAN`, `SVCRF` and `SVCKEEP` separate them.

| `SVCRC` | Case | State after |
| ---: | --- | --- |
| 0 | Rejected before the move | As it was |
| 1 | `INIT` or a record failed, nothing left behind | As it was; `0006h` put back |
| 2 | A hook left behind, or `REMOVE` rejected the undo | Pages kept |

A carry from `INIT` goes straight to `SVCSCAN`, since a failed `INIT` has undone
its own work (`src/svc.asm:213-214`). A record that fails its check goes to
`SVCRF`, which calls `REMOVE` to undo a good `INIT` (`src/svc.asm:238-241`). If
`REMOVE` fails, `SVCKEEP` records 2 and commits with the pages kept and no
record linked (`src/svc.asm:242-243`, `src/svc.asm:262-264`,
`test/svc.test.mjs:400`).

A failed load may have left a hook in the RAM BIOS table, and the service's
pages can't go while one points at them. So `SVCSCAN` tests the high byte of
each of the 17 targets in the table against the service's pages
(`src/svc.asm:245-253`, `src/layout.asm:74`). With no hit, the word at `0006h`
goes back to `PZTOP` and the result is 1 (`src/svc.asm:254-258`). A hit writes
0 over the flags, so `UNLOAD` will reject the service, and it goes to
`SVCKEEP` (`src/svc.asm:259-264`). A hook left in the table then points at
pages the service still holds, and `test/svc.test.mjs:386-398` shows them
surviving a warm boot. The scan reads only that table, so `ABIGLCD`'s vectors
are beyond it (`test/svc.test.mjs:535`).

A service kept this way appears in `SERVICES`, because `CMDSVC` walks the owner
list from `SVCHEAD`, not the registry (`src/svc.asm:342-366`). Each header's
offset 2 is the next older service's page, 0 at the end.

## The registry

A client reaches the registry through `ABISVC`, at `C015h`, which jumps to
`SVCREG` (`src/abi.asm:19`). `SVCREG` moves `B` to `C`, clears `B` and
branches on the selector, and any selector but 0 or 1 returns carry
(`src/svc.asm:476-483`). `ABIDRV`, in `abi.inc`, is an old name for the same
entry (`src/abi.inc:17`).

Enumerate walks from `REGHEAD`, counting `C` down, and returns the record with
the generation in `A` (`src/svc.asm:484-496`, `src/svc.asm:527-529`).
`REGFIND` compares 8 bytes at offset 2 and tests the version at offset 10 with
`CP C`. On a match it returns the table's address from offset 11
(`src/svc.asm:499-529`). Newer records are at the front of the list, so a find
reaches the newest of a name first, and a removal uncovers the older
(`test/svc.test.mjs:499`).

A program can make the list into a cycle, so the walk has a limit. `B` is 0 at
`REGF1`, so `DJNZ` allows 256 rounds, and such a list can't hold the caller
(`src/svc.asm:537-539`, `test/svc.test.mjs:543`). That walk uses at most 8
bytes of the caller's stack, three `PUSH`es and the return address
(`src/svc.asm:504-506`). The registry has no entry for removal, so a selector
of 2 returns carry (`test/svc.test.mjs:346`).

A record is visible to a client only once `SVCLK` has linked it, so a service
can't find its own record during `INIT` (`test/svc.test.mjs:424`).

## Removal

Only the lowest service can go, and that rule keeps true the three bytes each
header saves, the registry's head and the lowest service's page. Each header
holds that state from before its own load (Chapter 21), and the states are
stacked in memory in the order of the loads.

`UNLOAD` calls `SVCUNL` (`src/cpm/ccp.asm:1101-1103`), which rejects the
command while `SVCBSY` is set. It uses the 0 it read there as `L`, making `HL`
the base of the page in `PZTOP` (`src/svc.asm:30-34`). That page must equal
`SVCHEAD`, which is 0 with no service in, so the test then fails. Bit 0 of the
flags must also be set (`src/svc.asm:35-40`).

`SVCCALL` then runs `REMOVE`. `SVCSHUT` clears `SVCBSY` without touching the
flags, and carry from `REMOVE` returns with nothing changed
(`src/svc.asm:41-46`). With no carry, `A` is the 0 from `SVCSHUT`, so `LD L,A`
points `HL` at the header's start. `LDIR` copies 3 bytes back to `REGHEAD` and
`SVCHEAD` (`src/svc.asm:47-62`), and this one copy removes all the service's
records, whatever their number. `DE` is left at `SVCGEN`, and the code raises it
by swapping registers for one `INC (HL)` (`src/svc.asm:63-65`,
`src/ram.asm:236`). `PRLTOP` reads the old top from the `JP`'s address at offset
7 and writes it to `PZTOP` and `0006h` (`src/svc.asm:66`, `src/prl.asm:60-69`).

A warm boot keeps all of this, since `REGHEAD`, `SVCHEAD` and `PZTOP` lie past
`BDOSRME`, the end of the range `CPMINIT` clears (`src/ram.asm:190-192`).
Chapter 22 describes that boundary. Cold boot clears the workspace, so a reset
empties both lists (`src/boot.asm:23-27`, `test/svc.test.mjs:353`).

## The bytes below 0006h

At ea9c1c0 the word at `0006h` points at `xx06h` because the BDOS entry has
that form in CP/M 2.2, as Chapter 13 explains, and the header keeps it by
placing its `JP` at offset 6 (`src/svc.asm:208-210`). So offsets 0 to 5 of the
lowest service lie below the word, in the TPA. Those six bytes are
live: `SERVICES` reads the owner link at offset 2 (`src/svc.asm:364-365`),
`UNLOAD` reads the flags at offset 3, `REMOVE`'s offset at 4 and 5, and
restores from offsets 0 to 2 (`src/svc.asm:38-62`).

`LOADCOM` stops short of that page (`src/cpm/ccp.asm:369-371`), so loading a
file can't reach them, but a program that sets `SP` from the word pushes onto
them, and one that fills memory up to the word writes over them. Nothing tests
for that. The starter card's `TAS.COM` sets its stack this way, with `LD
HL,($0006)` and `LD SP,HL` at `010Dh`. This script runs the host model's
`Machine` class, which `tools/capture.mjs` runs too, on `svc.img` from Chapter
10, and prints the 16 bytes at `B700h` after each command:

```sh
node --input-type=module -e '
import { readFileSync } from "node:fs";
import { Machine, symbolsFromD8 } from "./host/machine.mjs";
import { fontBytes } from "./tools/lib/font.mjs";
Machine.font = fontBytes("./");
const rom = readFileSync("dist/tecos-debug80.rom");
const d8 = JSON.parse(readFileSync("dist/tecos-debug80.d8.json", "utf8"));
const sdImage = new Uint8Array(readFileSync("svc.img"));
const symbols = symbolsFromD8(d8);
const m = new Machine({ rom, symbols, sdImage, glcd: false });
const prompt = (from) => () => (m.pumpInput(), !m.pending?.length
  && m.ready() && /[A-P]>$/.test(m.text(from)));
const hex = (b) => b.toString(16).padStart(2, "0");
m.runUntil(prompt(0), 800_000_000, "boot");
for (const line of ["B:", "COUNT.SVC", "A:TAS AREA"]) {
  const from = m.output.length;
  m.enqueueInput(`${line}\r`, "serial");
  m.runUntil(prompt(from), 800_000_000, line);
  const bytes = Array.from({ length: 16 }, (_, i) => m.read(0xB700 + i));
  console.log(line.padEnd(12), bytes.map(hex).join(" "));
}
'
```

```text
B:           00 00 00 00 70 08 78 88 78 00 80 80 b0 c8 88 88
COUNT.SVC    00 00 00 01 2e 00 c3 06 b8 00 0b 00 06 0a 04 19
A:TAS AREA   2b 1f c9 17 ba 17 c3 06 b8 00 0b 00 06 0a 04 19
```

The first row is what memory held before the load. In the last, `TAS`'s three
return addresses, `1F2Bh`, `17C9h` and `17BAh`, lie at offsets 0 to 5.
`SERVICES` then follows the owner link to page `C9h`, in the ROM, and prints
what it finds there, as the transcript in Chapter 10 shows. The `UNLOAD` after
it takes `17BAh` as `REMOVE`'s offset and jumps into the ROM at `CEBAh`, and
with no hook restored it frees the page with `CONOUT`'s target still at
`B742h`. `UNLOAD` also copies `2Bh`, `1Fh` and `C9h` to `REGHEAD` and
`SVCHEAD`, so `SERVICES` prints the same lines afterwards. `CEBAh` is inside
`SPIR`'s loop (`src/sd.asm:32-39`), and on the model a later read of the card
fails with `Bad Sector`, and a reset then stops at the diagnostic prompt with
error 02.

## The stack figures

A service's code runs on its caller's stack (`drivers/glcd.asm:5`), and the ROM
reserves three stacks, of the sizes at `src/layout.asm:81-83`:

| Stack | Reserved | Base | Census | `SVCLIM` |
| --- | ---: | ---: | ---: | ---: |
| BDOS | 54 | 32 | 34 | 8 |
| BIOS | 38 | 16 | 16 | 12 |
| CCP | 30 | 16 | 22 | 6 |

The census column is the deepest use of each stack in `test/stacks.test.mjs`,
which records every write to memory under the heaviest workloads. The test
passes only with a quarter of each stack free (`test/stacks.test.mjs:244-245`).
Base is the same figure from its runs on the serial terminal and the PICO9918
alone, with the run on a volume written behind: 32, 16 and 16
(`test/stacks.test.mjs:212-223`). The census is higher for the BDOS and the CCP
because of the runs with `GLCD.SVC`, which give 34 and 22.

`SVCLIM` holds the limits (`src/data3.asm:112`), and they are counted from the
base. Each limit is the largest even figure that, added to the base, leaves a
quarter of the stack free: 40 of 54, 28 of 38 and 22 of 30. At this commit
`GLCD.SVC` declares 2, 0 and 6 (`drivers/glcd.asm:19`), the difference between
the base and the census. It therefore takes the whole of the CCP's allowance,
and `COUNT.SVC` with its 2 can't then load. `PICO.SVC` declares 0, 0 and 0,
since its figures are in the base (`drivers/pico.asm:29`).

The loader can check only the sum of what the headers state.
`test/svc.test.mjs:694` shows the way to prove a figure: a stack watch on the
model, in which a service that declares 2 and uses 6 still loads.
