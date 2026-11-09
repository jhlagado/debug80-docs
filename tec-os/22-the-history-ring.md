---
title: The history ring
parent: TEC-OS
nav_order: 22
nav_group: "Inside TEC-OS"
---

# 22. The history ring

<!-- Source mechanisms checked against TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe by source inspection only.
     All source ranges below use that revision. No captures were rerun. -->

<!-- Historical capture provenance: TEC-OS 78127ec, with the starter card's
     `TED.COM` from Thorium 128edb7, whose copy in `dist/files` has the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.
     The five retained captures and their recipes belong to that build. -->

You can recall whole command lines even after newer input has overwritten
older history. TEC-OS keeps those lines in a 256-byte ring. When an insertion
cuts through an old line, the remaining fragment is cleared before recall
can reach it (`src/history.asm:216-251`).

## A page of whole lines

The history page is `HRING` at `BD00h` in EXPAND 1
(`src/history.asm:16`). Each entry contains a line's characters followed by a
zero byte. `HHEAD` is the offset where the next entry will start. It is a
byte in the resident workspace in EXPAND 0 (`src/ram.asm:352-357`). After an
insertion it points immediately past the newest entry's zero
(`src/history.asm:225-235`).

The high byte of a ring address stays at `BDh`. Only the low byte changes
as a routine steps along the page. `INC L` advances from offset `FFh` to
`00h` so a line can continue across the end of the page without a separate
wrap test (`src/history.asm:225-235`). A line's position in this order is
independent of whether its address is above or below another line's address.

The byte at `HHEAD` is also zero. Together with the newest line's terminator
at `HHEAD − 1`, it forms an empty entry between the newest and oldest lines.
A backwards scan stops at that empty entry instead of continuing around the
page into the newest line again (`src/history.asm:8-14`,
`src/history.asm:94-100`). The ring therefore needs a zero beyond the bytes
occupied by its entries.

A line costs its character count plus a terminator. `DIR` occupies four
bytes. The command buffer accepts up to 127 characters so a longest line
occupies 128 bytes of the ring (`src/boot.asm:392-393`,
`src/history.asm:225-235`). Long commands displace more history than short
ones. There is no fixed count of stored lines.

The ring shares its address window with the resident workspace and stack in
EXPAND 0. Reading a history byte requires EXPAND 1 to be visible briefly.
The routines `HGET` and `HPUT` make that change for each byte. `HGET` returns
the byte at `HL` in `A`. `HPUT` writes `A` there and reads the byte back
(`src/history.asm:18-62`). Both keep `BC`, `DE` and `HL`.

## Lines from the prompt

A program and the CCP both call BDOS function 10 to read a line. The CCP
marks its own input by setting `HFLAG` to `FFh` immediately before the call.
That call occurs after the checks for a remaining chained piece and a startup
line (`src/cpm/ccp.asm:136-149`, `src/ram.asm:237-240`).

Function 10 completes a line at Return, at a line feed or when the buffer
fills (`src/cpm/bdos.asm:414-417`, `src/cpm/bdos.asm:440-462`). At
`LINDONE` it writes the character count into the caller's buffer, reads
`HFLAG` and clears it. It calls `HSTORE` only for a marked line containing
at least one character (`src/cpm/bdos.asm:651-666`). A program's later input
therefore has history disabled. An empty line adds no entry.

An abandoned line at the command prompt follows a different exit. `^C` at the
start of function 10 jumps through `CHDROP` to warm boot before `LINDONE` runs
(`src/cpm/bdos.asm:529-540`, `src/cpm/bdos.asm:100-103`). Warm boot clears
`HFLAG` with the BDOS workspace so that abandoned read cannot enable history in
a later program (`src/boot.asm:138-141`, `src/boot.asm:384-389`,
`src/ram.asm:217-240`).

A typed chain is stored as the whole line, including its `!` and `:`.
Its individual pieces add no entries because the CCP takes them directly
from `CMDTXT`. A line supplied through function 47 follows that same path.
Startup lines come from `STLINE` and also bypass the marked function-10
call (`src/cpm/ccp.asm:136-149`, `src/cpm/bdos.asm:85-93`). History is
empty after cold boot until you complete a nonempty prompt line that passes
`HSTORE`'s checks.

The stored bytes still have the case you typed. `HSTORE` runs before
function 10 returns to the CCP. Only afterwards does `MLTAKE` convert each
piece's letters to capitals (`src/cpm/bdos.asm:665-666`,
`src/cpm/ccp.asm:232-247`). The transcripts here were recorded on TEC-OS
`78127ec`. They retain that historical build's output, separate from the
source checks at `962853f`. In this PICO9918 screen capture, recalling `con`
preserves the small letters:

<!-- node tools/capture.mjs --board pico --screen con "@start "$'\x17' -->
```text
A>con
CON: CRT:
A>con
CON: CRT:
A>
```

## Insertion and the oldest line

A zero inside a line would end recall before the rest of its characters.
`HSTORE` checks every incoming character and leaves the ring unchanged if
it encounters a zero (`src/history.asm:194-197`,
`src/history.asm:257-260`). That check occurs before any new bytes are
written so a rejected line cannot leave a partial entry.

Consecutive duplicates also consume no new space. `HSTORE` first locates
the newest entry from its terminator at `HHEAD − 1`. It calls `HSTART`,
which scans backwards until the preceding byte is zero. On return `L`
points to the entry's first byte (`src/history.asm:70-77`,
`src/history.asm:176-184`). This scan also handles an empty entry by
returning its original offset.

The comparison reads the newest entry alongside the incoming line. `C`
counts differing bytes. A duplicate requires both a zero difference count
and equal lengths, checked by comparing the final offset with `HHEAD − 1`
(`src/history.asm:194-213`). Repeating the newest command therefore leaves
its existing entry in place. In this retained screen capture `CON` was
typed twice before `DIR *.CMD`. Three `^W` presses reached `CON` and then
stopped because there were only two entries:

<!-- node tools/capture.mjs --board pico --screen CON CON "DIR *.CMD" "@start "$'\x17\x17\x17' -->
```text
A>CON
CON: CRT:
A>CON
CON: CRT:
A>DIR *.CMD
STARTUP.CMD
1 file, 980K free
A>CON
CON: CRT:
A>
```

For an accepted line, `HSTORE` writes each character from `HHEAD` forwards
through `HPUT`. It adds the zero terminator and advances `HHEAD` to the next
byte (`src/history.asm:214-235`). That byte may still contain part of an
older line. Returning at this point would permit recall of a suffix whose
first characters had already been overwritten.

`HSCLR` removes that suffix. It reads the byte at the new `HHEAD`, writes
zero over it and advances. The loop continues until it has also cleared a
byte that was already zero (`src/history.asm:243-251`). When an insertion
partly overwrote an old entry, that existing zero was its terminator. The
whole remainder of the entry is erased. When the new `HHEAD` already held
zero, the loop clears that byte and ends immediately.

After cleanup, the newest terminator at `HHEAD − 1` and the zero at
`HHEAD` separate the surviving whole entries. The backwards test can stop
before wrapping into newer text (`src/history.asm:94-100`,
`src/history.asm:231-251`).

## Access through the bank window

`HGET` and `HPUT` each save `BC` before entering the shared access code. `IFFGET`
returns the interrupt state in the parity/overflow flag. The access code
then disables interrupts and saves that flag on the stack
(`src/history.asm:30-43`, `src/bios.asm:390-401`). It reads the latch shadow
at `0040h`, sets `LATEXP` and writes the latch to select EXPAND 1
(`src/history.asm:44-46`, `src/abi.inc:288-289`, `src/layout.asm:64-69`, `src/abi.inc:291-293`).

The stack can be hidden by that bank change. All pushes happen before it
and all pops happen after EXPAND 0 is restored. The access itself uses the
registers and the byte at `HL`. The final latch write restores the original
view. Interrupts are enabled again only when the saved flag records that
they were enabled on entry (`src/history.asm:47-62`).
[Chapter 14](14-state-and-memory.md#expand-1-and-the-stack-boundary) explains
the same no-stack rule for the other uses of EXPAND 1.

History storage is internal to line input. The BDOS table provides function
10, whose history branches call these private routines. There is no separate
history entry in the numbered-service table (`src/tables.asm:87-95`,
`src/tables.asm:102-130`, `src/cpm/bdos.asm:478-484`,
`src/cpm/bdos.asm:651-666`).

## Recall in the line buffer

`HPOS` is the offset of the terminator of the entry currently shown.
Function 10 starts each read with `HPOS` equal to `HHEAD`, the empty entry
(`src/ram.asm:239-240`, `src/cpm/bdos.asm:397-399`). You can move backwards
from there through older entries with `^W` then forwards with `^N`.
Moving forwards past the newest entry selects the empty entry again
(`src/history.asm:87-119`).

Function 10 compares input with the codes 23 and 14 for `^W` and `^N`. Its
`LINHIST` branch tests `HFLAG` before calling `HREC`. At the prompt the
flag enables recall. In a program's ordinary function-10 call the codes
enter the buffer as characters, as in CP/M 2.2
(`src/cpm/bdos.asm:47-48`, `src/cpm/bdos.asm:435-438`,
`src/cpm/bdos.asm:478-484`).

For `^W`, `HREC` calls `HSTART` on the shown entry's terminator. It then
steps back to the previous entry's terminator and one byte further to test
its last character. A zero there means the previous entry is empty so
`HREC` returns with the current line unchanged. Otherwise that previous
terminator becomes the new `HPOS` (`src/history.asm:94-101`,
`src/history.asm:128-130`). At the oldest line, another `^W` leaves the
buffer and its edited text as they are.

For `^N`, `HREC` first compares `HPOS` with `HHEAD`. Equality means there is
no newer entry to show so it returns immediately. Otherwise it advances
through the ring to the next zero, which terminates the next entry
(`src/history.asm:110-119`). The zero at `HHEAD` follows the newest
terminator. Selecting it clears the line buffer to an empty line.

To replace the line, `HRSHOW` stores the new `HPOS`, calls `HSTART` to find
the entry's beginning and calls `LINERASE` to remove the existing input
(`src/history.asm:128-134`). `LINERASE` backs up `LINPTR` and reduces
`LINCNT` to zero. It erases each character with backspace, space and
backspace through the BIOS (`src/cpm/bdos.asm:622-636`,
`src/cpm/bdoscon.asm:345-352`). The same routine implements `^X`
(`src/cpm/bdos.asm:609-611`).

`HRCOPY` then reads the entry through `HGET` and copies its characters into
the line buffer. It advances `LINPTR`, increments `LINCNT` and echoes each
character. Copying stops at the entry's terminator or the buffer's maximum
(`src/history.asm:145-166`). Function 10 resumes its input loop after the
call to `HREC`. You can edit the recalled text with backspace and the other
line-input keys before pressing Return (`src/cpm/bdos.asm:411-503`).

Here two commands were typed before `^W`, `^W` and Return selected `CON`:

<!-- node tools/capture.mjs --board pico --screen CON "TYPE STARTUP.CMD" "@start "$'\x17\x17' -->
```text
A>CON
CON: CRT:
A>TYPE STARTUP.CMD
GLCD.SVC

A>CON
CON: CRT:
A>
```

The capture records the PICO9918 screen after erasure so it shows the
replacement line. Serial output would also contain the backspace and space
bytes used to erase the previous input. In the capture recipe, `@start`
sends its keys and Return together (`tools/capture.mjs:102-106`).
The shell notation `$'\x17'` supplies
`^W` (`src/cpm/bdoscon.asm:345-352`).

## Warm boot and reset

An ordinary program exit keeps both the ring and `HHEAD`. Warm boot runs
`CPMINIT`, whose clear starts at `CCPCLR` and ends before `BDOSRME`.
`HHEAD` is above that range, beyond the RAM BIOS table
(`src/boot.asm:138-141`, `src/boot.asm:384-389`,
`src/ram.asm:295-305`, `src/ram.asm:352-357`). `HFLAG` and `HPOS` are inside
the cleared range. The next function-10 call sets `HPOS` from the retained
`HHEAD` (`src/ram.asm:237-240`, `src/cpm/bdos.asm:397-399`).

The warm-boot path leaves the history page in EXPAND 1 untouched
(`src/boot.asm:128-149`). A program's exit, BDOS function 0 and `^C` at an
empty prompt all follow that path (`src/cpm/bdos.asm:214-215`,
`src/cpm/bdos.asm:529-540`). In this retained capture `^C` was followed by
`^W`, which recalled `CON`:

<!-- node tools/capture.mjs CON "^C" "@start "$'\x17' -->
```text
A>CON
CON: TTY:
A>^C
A>CON
CON: TTY:
A>
```

A reset enters cold boot. The workspace clear includes `HHEAD`, setting
its offset to zero (`src/boot.asm:61-65`, `src/ram.asm:352-357`).
`MEMINIT` then zeros all of EXPAND 1 before marking the cache lines empty
(`src/boot.asm:232-249`). Both the history byte at offset `00h` and its
predecessor at `FFh` are zero. The ring starts with the same empty-entry
boundary that insertion preserves.

A recognised reset can retain the drive selection but that retention
copies only the drive table (`src/boot.asm:211-216`). It leaves the history
subject to the cold-boot clears. In this historical run `^W` and Return
after the reset produced an empty line:

<!-- node tools/capture.mjs CON "@reset" "@start "$'\x17' -->
```text
A>CON
CON: TTY:
A>
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>
A>
```

`HREC` started from the empty entry at `HHEAD`. Its backwards test found
zero before any stored line so it returned without replacing the empty
buffer (`src/history.asm:87-100`). The subsequent Return completed an
empty line so the CCP printed another prompt (`src/cpm/ccp.asm:159-169`).
