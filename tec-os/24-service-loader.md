---
title: The service loader
parent: TEC-OS
nav_order: 24
nav_group: "Part II: Inside TEC-OS"
---

# 24. The service loader

<!-- Checked against TEC-OS 78127ec, with the starter card's `TAS.COM` from Thorium
     dbee66a, SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

A `.SVC` file is read to `0100h` like a program and then moved to whole pages
just under the top of the TPA. There it stays through every warm boot. The
loader in `src/loader.asm` makes that move in seven steps. It keeps a registry
of what the resident services publish and takes the lowest service out again
at `UNLOAD`. This chapter follows one file through the steps, then through the
ways a load fails and the way a service leaves. It ends on what the loader can
check about a service and what it has to take on trust.

## A service's entry

The word at `0006h` has two jobs in CP/M. It is the target of the `JP` at
`0005h`, so every BDOS call passes through it. It is also the top of the TPA,
so a program sizes its memory from it. A program may also set `SP` from the
word and fill memory up to it. The starter card's `TAS.COM` does that, with
`LD HL,($0006)` and `LD SP,HL` at `010Dh`. A service takes the pages just below
the top of the TPA, and its first byte becomes the new top. So it has to hold a
BDOS entry at that address, with everything it needs at or above it. A BDOS
call should also cost the same however many services are in.

Relocation adds a page number to the high byte of each address, so a service
starts on a page boundary. With a service in, the word holds `xx00h`, the
page's start. Offset 0 of the page holds `JP BENTRY`, a jump straight into the
ROM (`src/loader.asm:229-232`, `test/svc.test.mjs:159`). Offset 0 is the
service's lowest byte, so nothing the service needs lies below the word. A
stack set from the word grows away from it (`test/svc.test.mjs:872`). No service
is on the path of a BDOS call, so each `JP` goes straight to `BENTRY`. A BDOS
call is therefore always two jumps, the one at `0005h` and the one at the word.
That holds with none, one or two services in (`test/svc.test.mjs:907`).

With no service in, the word holds the address of the BDOS entry jump, the
*stub*, and `STUBAD` keeps that address. `ALVINIT` puts the stub directly below
the lowest allocation vector, so the TPA keeps every byte up to the vectors
(`src/boot.asm:456-460`). On the starter card the vectors start at `B9A7h` and
the stub is at `B9A4h`. Its low byte varies with the card, so a program assumes
nothing of it. `PZINIT` writes the stub's three bytes at every warm boot
(`src/boot.asm:232-237`).

The loader takes its pages below the page of the top (`src/loader.asm:121-123`).
So the first service also costs the bytes from the start of the stub's page up
to the stub. On the starter card those are the 164 bytes from `B900h` to
`B9A3h`, and `COUNT.SVC`'s one page lowers the TPA by 420 bytes. A later
service's top is a page's start, so it costs its pages and nothing more. On a
board with the GLCD the startup file installs `GLCD.SVC`. The top of the TPA
then sits like this, with the pages a second service of one page would take:

| Addresses | What is there |
| --- | --- |
| `B9A7h` up | The allocation vectors, then the workspace |
| `B9A4h–B9A6h` | The stub, `JP BENTRY`, the top with no service in |
| `B900h–B9A3h` | 164 bytes no service can use |
| `B600h–B8FFh` | `GLCD.SVC`, three pages; `B600h` holds `JP BENTRY` |
| `B500h–B5FFh` | A second service of one page; `B500h` would hold `JP BENTRY` |
| `0100h` up | The TPA, its top at the word in `0006h` |

The file's header has the layout in [Chapter 12](12-writing-services.md) and
[Appendix H](appendix-h-service-file-format.md). In memory the loader has
written over some of its fields, and a loaded service's header holds:

| Offset | Bytes | In memory |
| ---: | ---: | --- |
| 0 | 3 | `JP BENTRY` |
| 3 | 1 | The flags, or 0 if a hook kept the pages |
| 4 | 2 | `REMOVE`, from the header's start |
| 6 | 2 | The registry's head before this service |
| 8 | 1 | The owner before it: the next older service's page, 0 at the last |
| 9 | 3 | Unused |
| 12 | 3 | Each stack's room left below this service |
| 15 | 2 | Unused |
| 17 | 8 | The name |

A header holds no copy of the old top. `SVCABV` turns an owner into the page
above a service, taking the stub's page when the owner is 0
(`src/loader.asm:395-399`). `SLTOP` rebuilds the top the same way when a service
goes (`src/loader.asm:39-47`).

## Relocation by pages

A service's page depends on the services already in, so its code is made for
one address and moved at load time. The move is by whole pages of 256 bytes.
Code made for page 0 and placed at page `p` keeps the low byte of every
address in it, and the high byte rises by `p`. The loader therefore needs
only the positions of the high bytes of addresses, the *fixups*, and it adds
the same page to each.

On a PC the repository's `makeSvc` finds the fixups by assembling the source
twice (`tools/lib/svc.mjs:83`). `assembleAt` assembles a copy of the source with
its `ORG $0100` line changed to another origin (`tools/lib/prl.mjs:37-48`). That
line has to be indented, with nothing after it (`tools/lib/prl.mjs:34`).
`makeSvc` assembles at `0000h` and at `0100h` and keeps the first assembly,
made for page 0, with the 25-byte header at its start
(`tools/lib/svc.mjs:99-110`). It stops with `INIT and REMOVE required` for a
source with no `INIT` or `REMOVE` (`tools/lib/svc.mjs:101`). It also rejects a
source that names a ROM address, since only `abi.inc`'s names may reach the
ROM (`tools/lib/svc.mjs:19-26`, `tools/lib/svc.mjs:85`).

A byte that is the same in the two assemblies is left alone. It is no part of
an address of the service's own, or it is the low byte of one. A move by whole
pages changes neither. A byte that is one greater in the second assembly
is the high byte of an address. Any other difference stops `makeSvc` with
`byte N is not relocatable`. So does a difference inside the header, since the
relocation data can mark only bytes of the image (`tools/lib/svc.mjs:67-76`).
Such a difference comes from an expression the page rule can't relocate, such
as half an address or twice one. An absolute
address outside the service, such as `0005h`, is the same in both assemblies
and is never marked. So a `CALL 0005h` stays a call to the BDOS wherever the
code is put.

Each fixup is counted from the end of the header, so fixup 0 is the image's
first byte. `makeSvc` writes the fixups as a list of gaps after the image and
the dependencies (`tools/lib/svc.mjs:39-49`, `tools/lib/svc.mjs:107-110`).
Each byte of the list is the distance from one fixup to the next, the first
counted from the byte before the image. A byte of 255 moves on with nothing
fixed. Appendix H lists the file's header, its dependencies and the gap list byte by
byte. `TAS` writes a `.SVC` file on the card with the same fields, as
Chapter 12 shows.

## The seven steps

A command whose type is `SVC` reaches `SVCGO` (`src/cpm/ccp.asm:281-289`).
`SVCGO` reads the file to `0100h` with `LOADCOM` and calls `SVCLOAD`
(`src/loader.asm:532-536`). [Chapter 20](20-ccp.md#loading-a-program) describes
the read. `SVCLOAD` works on the file at `DF`, `0100h`, and `LOADTOP` holds the
end of the records read (`src/loader.asm:18-32`, `src/ram.asm:256`). It reports
through carry and `SVCRC` (`src/loader.asm:91-96`). It keeps the `A` that
`INIT` returns in `SVCRA`, beside `SVCRC`, and sets it to 0 if a record is
then rejected (`src/loader.asm:246`, `src/loader.asm:289-291`,
`src/ram.asm:266-267`). The CCP treats a carry as a name with a question mark,
except for one case in a line from `STARTUP.CMD`, which
[Chapter 25](25-startup.md#the-quiet-rule) describes.

Before the move in step 5 a load changes only the file and the loader's own
variables. A failure before it leaves the rest of memory as it was. The
write of `PZTOP` in step 7 is the commit. Until then a warm boot gives the
pages back, as step 6 describes.

### 1. The file's checks

`SVCLOAD` zeroes `SVCRC` and tests `SVCBSY`, which is `80h` while an `INIT` or
`REMOVE` runs (`src/loader.asm:97-102`, `src/ram.asm:260`). It compares the first
two bytes with `DMAGIC`, the letter `D` and the format, `SVCFMT` from
`abi.inc`, which is 4 (`src/loader.asm:18`, `src/abi.inc:105`,
`src/loader.asm:103-106`). A file of another format fails here. `SVCEXT` checks
that the size at offset 6 lies within the records read (`src/loader.asm:107-110`,
`src/loader.asm:412-418`). `SVCIN` checks that `INIT` and `REMOVE` each lie
between the header and the image's end (`src/loader.asm:111-116`,
`src/loader.asm:423-429`).

The page comes next. The loader adds the extra memory named at offset 8 to the
size of the header and image, subtracts one and takes the high byte. That is
the number of pages less one. The service's page is the page of `PZTOP`, less
one, less that number. An overflow, a borrow or a page below `80h` fails the
load, and the page goes in `SLDL` (`src/loader.asm:117-127`, `src/ram.asm:259`).
For `COUNT.SVC` on the serial board, with the top at `B9A4h` and 100 bytes, the
page is `B8h`.

### 2. The dependencies

The dependencies follow the image, and `HL` walks them with a count from
offset 2 (`src/loader.asm:128-133`). Each must lie within the records read.
`REGFIND`, described with the registry below, looks up its 8-byte name with
its least version in `C` (`src/loader.asm:136-144`). `EX (SP),HL` keeps the next
entry's address on the stack across the lookup (`src/loader.asm:138`). A missing
record ends the load (`src/loader.asm:145-147`).

### 3. The stacks

The relocation data must lie within the records read too
(`src/loader.asm:151-154`). A service's code runs on its caller's stack, so each
load has to fit its three stack figures into the room left. `HL` points at
that room: `SVCLIM` with no service in, and otherwise offset 12 of the newest
service's header (`src/loader.asm:155-160`). The loop takes each figure in the
new header from that room and fails on a borrow. It stores the difference over
the figure in the new header (`src/loader.asm:161-171`). The header in memory
then holds the room left below this service, and the loader keeps no other
total. On the serial board, with limits 8, 12 and 6, `COUNT.SVC`'s figures of 2
each leave `06h`, `0Ah` and `04h` at `B80Ch`.

### 4. The relocation

The pass works on the file where `LOADCOM` read it, at `0100h`, before the move
(`src/loader.asm:174-203`). `BC` counts the bytes of the list, and `HL` starts at
`DF+DHLEN-1`, `0118h`, the byte before the image (`src/loader.asm:177-178`). For
each byte the loader:

1. adds the gap to `HL` (`src/loader.asm:182-188`)
2. checks that `HL` is still inside the header and image, below `0100h` plus
   the size at offset 6, and fails the load if not (`src/loader.asm:189-197`)
3. if the gap was 255, goes on to the next byte with nothing fixed
   (`src/loader.asm:198-199`)
4. otherwise adds `SLDL` to the byte at `HL` (`src/loader.asm:200-203`).

The check in step 2 is made for a gap of 255 too, so a list can't step past the
image even with nothing fixed. A failure here leaves the file at `0100h` partly
relocated and the rest of memory as it was.

On a board with the GLCD the starter card's startup file installs `GLCD.SVC`
at `B600h`. Its image starts with the table of words the driver passes to the
ROM's terminal, `00F0h`, `014Bh`, `0150h` and so on in the file. After the load
they read `B6F0h`, `B74Bh` and `B750h` at `B619h`, each high byte raised by
`B6h`. `SERVICES` prints each page count as the page above the service less the
service's own page (`src/cpm/ccpcmd.asm:538-545`). The count therefore includes
the part of the last page the service doesn't fill. `GLCD.SVC`'s 765 bytes of
header and image take three pages. With the 164 bytes below the stub they
lower the TPA from 47,268 bytes to 46,336.

On a board with the PICO9918 as well, the ROM's console is `CRT:` when the
startup line runs. `DRVR` then rejects `INIT`'s table with `TNENODV`. `INIT`
returns that status and the load fails with `SVCRC` at 1. The pages go back,
and the line passes over quietly, as Chapter 25 describes. `SERVICES` lists
nothing, and the TPA stays at 47,268:

<!-- node tools/capture.mjs --board pico SERVICES -->
```text
A>SERVICES
A>
```

### 5. The claims and the move

`SVCMOV` reads the flags first. For each of bits 1 to 7 that is set it reads
the first byte of that restart vector. A `JP` there fails the load, with carry,
`SVCRC` at 0 and nothing changed but the file (`src/loader.asm:209-222`). The
chapter's last section gives the reason.

The size at offset 6 goes on the stack, since the resident fields are about to
overwrite it. `LDIR` copies `REGHEAD` and `SVCHEAD`, 3 bytes, to offset 6, and
`JP BENTRY` goes in at offset 0 (`src/loader.asm:223-233`). A second `LDIR`
moves the header and image to the page. The word at `0006h` becomes the page's
start, with the 0 that `LDIR` leaves in `B` as its low byte
(`src/loader.asm:234-241`). `PZTOP`, the word that warm boot puts at `0006h`,
isn't written (`src/ram.asm:253`). `SVCBND` reads the owner at offset 8 for the
loader's bounds, the page above this service's last (`src/loader.asm:384-399`).

### 6. INIT

`SVCCALL` sets `SVCBSY`, reads the 2-byte offset at `HL`, adds the page to its
high byte and jumps (`src/loader.asm:243-244`, `src/loader.asm:370-379`). The
header is on a page boundary, so no 16-bit addition is needed. `INIT` returns to
the instruction after the call, on the CCP's stack (`src/cpm/ccp.asm:288`).

A warm boot during `INIT` leaves the word at `0006h` correct, because `PZTOP` is
untouched. `PZINIT` writes `PZTOP` to `0006h` (`src/boot.asm:230-231`), and warm
boot clears `SVCBSY` (`src/boot.asm:101-102`). The pages go back as if the load
had never started, and `test/svc.test.mjs:469-482` checks that a later load
works. Function 47 from `INIT` is a warm boot at the same point
(`test/svc.test.mjs:931`). The sweep in `PZINIT` takes any restart vector `INIT`
has pointed into its pages, since the new pages lie below `PZTOP`
(`test/svc.test.mjs:833`). A hook already in the table then points into the
TPA, which is why hooks go last (`test/svc.test.mjs:498-505`). A reset during a
hung `INIT` is recognised all the same, because `RSLCAP` doesn't compare the
word at `0006h` with `PZTOP` (`src/boot.asm:113-123`).

### 7. The records and the commit

`SVCBND` loads `D` with the service's page and `E` with the page above its
last (`src/loader.asm:247-248`, `src/loader.asm:384-390`). Carry from `INIT`
goes to the failure path. With `HL` at the first record, the walk checks each
record's first byte, then its last, then the high byte of its table address.
Each check uses `SVCCK` against `D` and `E` (`src/loader.asm:268-287`,
`src/loader.asm:403-408`). Since `SVCCK` compares pages, a record can't cross
out of the service and a link can't leave it.

Before the walk, `SVCNT` follows the links from `REGHEAD` to count the N
records already in the registry. `B` starts at 1 − N, or at 0 with the registry
empty (`src/loader.asm:250-267`). `DJNZ` then allows 256 − N records, or 255
with the registry empty. The registry therefore never holds more than the 256
records that `FIND` and `LIST` walk. A list longer than that, or one that
loops, ends the walk and the load fails (`src/loader.asm:288`,
`test/svc.test.mjs:256`, `test/svc.test.mjs:267-306`). On a board whose PICO9918 console started, a
service of 128 records and then one of 127 load. The console's record is the
256th and still found, and a second service of 128 is rejected.

With the walk done, `SVCLK` writes the first record's address to `REGHEAD`, the
head of the registry. It writes the old head into the last record's link, which
`SLN` has held (`src/loader.asm:326-335`, `src/ram.asm:258`). A service's records
thus join the front of the list as one chain, and a service with none leaves
the list alone (`src/loader.asm:327-329`). `SVCCOM` sets `SVCHEAD`, the lowest
service's page, to this page and writes `PZTOP`. That write is the commit
(`src/loader.asm:336-340`, `src/ram.asm:263`). `SVCSHUT` clears `SVCBSY`, and a
final `CP 1` and `CCF` turn `SVCRC` into the carry (`src/loader.asm:341-349`).

## A failed load

Until the move nothing but the file has changed. Each failure there returns
carry with `SVCRC` at 0. After the move there are three outcomes, and the labels
`SVCSCAN`, `SVCRF` and `SVCKEEP` separate them.

| `SVCRC` | Case | State after |
| ---: | --- | --- |
| 0 | Rejected before the move | As it was |
| 1 | `INIT` or a record failed, nothing left behind | As it was; `0006h` put back and the vectors swept |
| 2 | A hook left behind, or `REMOVE` rejected the undo | Pages kept |

A carry from `INIT` goes straight to `SVCSCAN`, since a failed `INIT` has undone
its own work (`src/loader.asm:247-248`). A record that fails its check goes to
`SVCRF`. That sets `SVCRA` to 0, so that `INIT`'s status can't be taken for the
cause, and calls `REMOVE` to undo a good `INIT` (`src/loader.asm:289-294`). If
`REMOVE` fails, `SVCKEEP` records 2 and commits. The pages are kept and no
record is linked (`src/loader.asm:295-296`, `src/loader.asm:322-325`,
`test/svc.test.mjs:437`).

A failed load may have left a hook in the RAM BIOS table, and the service's
pages can't go while one points at them. So `SVCSCAN` tests the high byte of
each of the 17 targets in the table against the service's pages
(`src/loader.asm:302-311`, `src/layout.asm:62`). With no hit, `SVCFRE` clears the
first byte of each restart vector the flags claim, and the word at `0006h` goes
back to `PZTOP`. `PZSWP` then gives those vectors their defaults and takes any
other vector into the pages, and the result is 1 (`src/loader.asm:312-318`,
`src/loader.asm:354-364`). A hit writes 0 over the flags, so `UNLOAD` will reject
the service, and it goes to `SVCKEEP` (`src/loader.asm:319-325`). A hook left in
the table then points at pages the service still holds, and
`test/svc.test.mjs:423-435` shows them surviving a warm boot. The scan reads
only that table, so the table that `DRVR` records for `UC1:` is beyond it
(`test/svc.test.mjs:572`).

A service kept this way appears in `SERVICES`, because `CMDSVC` walks the owner
list from `SVCHEAD`, not the registry (`src/cpm/ccpcmd.asm:529-551`). Each
header's offset 8 is the next older service's page, 0 at the end.

## The registry and removal

A client reaches the registry through two numbered services, `FIND`, 13, and
`LIST`, 14. Their routines are `SVFND` and `SVLST` (`src/abi.inc:82-90`,
`src/tables.asm:88-89`). `FIND` takes the name at `DE` and the least version in
`B`. `SVFND` moves `B` to `C`, clears `B` and goes to `REGFIND`. `LIST` takes an
index in `B`, and `SVLST` moves it to `C` (`src/loader.asm:434-441`).

`LIST` walks from `REGHEAD`, counting `C` down, and returns the record with
the generation in `A` (`src/loader.asm:441-454`, `src/loader.asm:490-492`).
`REGFIND` compares 8 bytes at offset 2 and tests the version at offset 10 with
`CP C`. On a match it returns the table's address from offset 11
(`src/loader.asm:460-485`). Newer records are at the front of the list, so a find
reaches the newest of a name first. A removal uncovers the older
(`test/svc.test.mjs:536`). On a board where the ROM's PICO9918 console started,
`PISTART` writes its record, `PIREC`, to `REGHEAD` at cold boot, before any
service loads. That record is the list's last and no removal reaches it
(`src/pico.asm:43-44`).

A program can make the list into a cycle, so the walk has a limit. `B` is 0 at
`REGF1`, so `DJNZ` allows 256 rounds, and such a list can't hold the caller
(`src/loader.asm:500-502`, `test/svc.test.mjs:580`). The walk uses at most 8
bytes of the caller's stack, three `PUSH`es and the return address
(`src/loader.asm:466-468`). `abi.inc` gives 8 bytes as the bound for each of the
two, the dispatcher's included (`src/abi.inc:82-90`). The loader's count of the
registry before a load has no limit of rounds. `SVCNT` stops only at a link of
0. After a program has made the list a cycle, the next service load never
returns and only a reset ends it (`src/loader.asm:258-265`). The registry has no
service for removal. Number 16, one past `FONT`, returns carry from the
dispatcher, and the service stays found (`test/svc.test.mjs:386`). A record is
visible to a client only once `SVCLK` has linked it, so a service can't find
its own record during `INIT` (`test/svc.test.mjs:461`).

Only the lowest service can go. That rule keeps true the three bytes each
header saves, the registry's head and the lowest service's page. Each header
holds that state from before its own load, and the states are stacked in
memory in the order of the loads.

`UNLOAD` calls `SVCUNL` (`src/cpm/ccpcmd.asm:8-10`), which rejects the command
while `SVCBSY` is set. It uses the 0 it read there as `L`, making `HL` the base
of the page in `PZTOP` (`src/loader.asm:61-65`). That page must equal `SVCHEAD`,
which is 0 with no service in, so the test then fails. Bit 0 of the flags must
also be set (`src/loader.asm:66-71`).

`SVCCALL` then runs `REMOVE`. `SVCSHUT` clears `SVCBSY` without touching the
flags, and carry from `REMOVE` returns with nothing changed
(`src/loader.asm:72-77`). Function 47 from `REMOVE` is a warm boot there, and the
service stays listed (`test/svc.test.mjs:940`). With no carry, `SVCFRE` writes 0
over the first byte of each restart vector the flags claim
(`src/loader.asm:78-80`, `src/loader.asm:354-364`). `LDIR` copies the 3 bytes at
offset 6 back to `REGHEAD` and `SVCHEAD` (`src/loader.asm:81-84`). This one copy
removes all the service's records, whatever their number. `DE` is left at
`SVCGEN`, and the code raises it by swapping registers for one `INC (HL)`
(`src/loader.asm:85-87`, `src/ram.asm:265`). `SLTOP` then sets `PZTOP` and
`0006h` from the `SVCHEAD` just restored: that page's start, or the stub if it
is 0 (`src/loader.asm:88`, `src/loader.asm:39-47`). `PZSWP` runs last and
leaves carry clear, so `UNLOAD` reports success (`src/loader.asm:89`).

The generation is what a client has to go on once it holds a record's address.
`SVCGEN` is one byte, so it repeats after 256 removals (`src/ram.asm:265`).
Only `UNLOAD` removes a service, and `UNLOAD` is a command of the CCP, so no
record goes while a program runs. A program can therefore keep a record's
address until it exits. A service that keeps one for longer compares the
generation `FIND` returned with the one `LIST` or `FIND` returns now, or names
the record as a dependency so that its own load fails without it, as
[Chapter 12](12-writing-services.md#keeping-a-pointer) describes.

A warm boot keeps all of this, since `REGHEAD`, `SVCHEAD` and `PZTOP` lie past
`BDOSRME`, the end of the range `CPMINIT` clears (`src/ram.asm:216-218`,
`src/ram.asm:253-264`). Cold boot clears the workspace, so a reset empties both
lists (`src/boot.asm:37-41`, `test/svc.test.mjs:390`).

## The limits of the loader's checks

The loader reads a header's claims and checks each against what it can read
back from memory. Its checks stop where the header is the only source.

A service that takes an interrupt or an `RST` needs its `JP` in page zero to
last through warm boots and to go when its pages go. The sweep in `PZSWP`
keeps a vector whose jump lands above `PZTOP` and clears the rest, as
[Chapter 15](15-reset-and-boot.md#page-zero) describes. `UNLOAD` and a failed
`INIT` call it once the top is back. A vector into freed pages then fails the
bound (`src/loader.asm:88-89`, `src/loader.asm:314-316`,
`test/svc.test.mjs:810`, `test/svc.test.mjs:818`). A reset clears page zero, so
a vector goes with its service then too (`test/svc.test.mjs:858`).

Two services can't share a vector, and `INIT` writes its own after the move, so
the loader needs the claim in the header. Flags bits 1 to 7 name `RST 1` to
`RST 7`, the vectors at `0008h` to `0038h`. Step 5 fails a load whose claimed
vector holds a `JP` (`test/svc.test.mjs:840`). The test reads one byte, so a
jump into the ROM that a finished program left there counts as held until a
reset. The loader reads only the flags. A vector `INIT` writes with no claim
goes unseen, as a vector in a table that `DRVR` records does. `UNLOAD` and a
failed `INIT` clear the first byte of each claimed vector before the sweep. The
sweep then gives it its default whatever it held (`test/svc.test.mjs:798`,
`test/svc.test.mjs:825`). A jump the service set outside its pages in a vector
it didn't claim passes the bound, so `REMOVE` restores it. A failed `INIT` runs
no `REMOVE`, so `INIT` restores it. `INIT` also turns off any source of
interrupts it started, because an interrupt left on under the default `EI` and
`RETI` repeats for ever. A warm boot inside `INIT` leaves that source on.

The stack figures are the other claim. The ROM reserves three stacks. `SVCLIM`
holds the room services may take on each, 8, 12 and 6 bytes for the BDOS, the
BIOS and the CCP (`src/tables.asm:96`). Those limits are counted from the
deepest use of each stack with no service in.
[Chapter 14](14-memory-map.md#the-four-stacks) gives the measurements behind
them and the quarter of each stack that stays free with the limit taken.
Step 3 sums the figures the headers state and fails a load that passes a
limit. At this commit
`GLCD.SVC` declares 2, 0 and 6 (`drivers/glcd.asm:19`). On a board with the GLCD
alone it takes the whole of the CCP's allowance, and `COUNT.SVC` with its 2
can't then load. On a board with the PICO9918 as well the startup line leaves
`GLCD.SVC` out, as above, and `COUNT.SVC` loads. The ROM's PICO9918 console is
no service and declares nothing: its use is in the base.

A service's real use shows only in a run. `test/svc.test.mjs:731` watches the
stacks on the host model, and a service that declares 2 and uses 6 on each
stack loads all the same. The loader can check only the sum of what the
headers state.
