---
title: Chains across a warm boot
parent: TEC-OS
nav_order: 21
nav_group: "Inside TEC-OS"
---

# 21. Chains across a warm boot

<!-- Source mechanisms checked by inspection against TEC-OS
     962853f499f05faf281f6cdff1deca8959f58c2b. Source ranges use that revision
     unless explicitly marked otherwise. No current runtime check claimed.
     Historical recipe, output and map figures retain TEC-OS 78127ec. -->

A program's ordinary exit rebuilds the CCP's working state, yet the next
piece of its command line can still run. The line and its position survive
in RAM outside the warm-boot clear. Chapter 12 explains their practical
use.

## The retained line

Warm boot calls `CPMINIT` to clear the CCP's scratch space and the BDOS's state.
The clear begins at `CCPCLR` and stops before `BDOSRME`. The command buffer lies
below that range, together with the two file control blocks (FCBs) used by
built-in commands (`src/boot.asm:194-200`, `src/boot.asm:530-536`,
`src/ram.asm:153-173`).

That retained span is 202 bytes: two 36-byte FCBs, the maximum-length byte
`CMDBUF`, the input-length byte `CMDLEN` and 128 character bytes at `CMDTXT`
(`src/ram.asm:163-173`). Each use of an FCB parses a fresh name and clears
all 36 bytes (`src/cpm/ccpcmd.asm:511-545`). The next command therefore
starts with a fresh file position despite the retained blocks.

The line's text alone would leave the CCP with no position from which to
resume. `CHPOS` supplies it as an offset in `CMDTXT` plus one. A zero value
means no piece remains. One byte can therefore represent all 128 offsets
and the finished state (`src/ram.asm:421-424`). `CHPOS` is above the RAM
BIOS table, outside the `CPMINIT` clear. The 16-bit return code `PRGCODE`
is in that upper block too (`src/ram.asm:312-319`, `src/ram.asm:386-388`).

The earlier map at `78127ec` placed these boundaries as follows. These are
historical map figures, separate from the source inspection at `962853f`:

| Item | Historical location or size |
| --- | --- |
| Retained span, `CMDFCB` to before `CCPCLR` | `BCEDh` to before `BDB7h`, 202 bytes |
| Character buffer, `CMDTXT` | `BD37h` |
| Cleared span, `CCPCLR` to before `BDOSRME` | 329 bytes |
| Next-piece offset, `CHPOS` | `BFE4h` |
| Return code, `PRGCODE` | `BF54h` |

Cold boot clears the entire resident workspace from `WSBASE` through the span
ending at `WSEND`. That includes the retained command buffer, `CHPOS` and
`PRGCODE` so a reset starts with no pending piece and a zero result
(`src/boot.asm:73-79`, `src/ram.asm:483-485`). Warm boot's narrower clear is
what permits ordinary program exits to continue a chain.

## The line and tail limits

A preserved line must also fit the command tail prepared for each program.
`CPMINIT` sets `CMDBUF` to 127 at every warm boot. `STLINE` copies at most
127 characters from a startup line and passes over any further characters.
Function 47 requires a zero within its first 128 bytes, giving the same
127-character maximum (`src/boot.asm:540-542`,
`src/cpm/ccpcmd.asm:947-975`, `src/cpm/bdos.asm:71-93`).

A program name occupies at least one character of its piece, leaving at most 126
for the tail. `PREPPAGE` copies that tail to `0081h` and appends a zero. At the
maximum length, the zero lands at `00FFh`. One further character would put it at
`0100h`, over the program's first byte (`src/cpm/ccp.asm:19-25`,
`src/cpm/ccpcmd.asm:456-497`). Loading precedes `PREPPAGE` so the limit protects
code already in memory. The load-drive byte at `0050h` lies below the tail and
is written separately before entry (`src/cpm/ccp.asm:498-525`,
`src/layout.asm:72-79`).

## The next command source

After a command or warm boot, `MAINLOOP` restores the CCP stack and calls
`SAVEDU`. That routine records the current drive and user area at `0004h`. The
command prompt uses those values (`src/cpm/ccp.asm:119-147`,
`src/cpm/ccp.asm:363-384`). The next input then comes from the first available
source in this order (`src/cpm/ccp.asm:148-166`):

1. A remaining piece found by `CHSKIP`.
2. The next startup line from `STLINE` when no piece remains.
3. A line read with BDOS function 10, with `HFLAG` set for command history.

A startup line's pieces therefore precede the next line of the file.
The same priority applies to a line supplied through function 47 by a
program started during startup. The historical example below uses three
startup lines. The first two contain conditional TYPE and MOUNT pieces. The complete card recipe and output remain
from `78127ec`:

```sh
printf 'DIR *.CMD!:TYPE STARTUP.CMD\nNOSUCH.SVC!:MOUNT\nUSER 0\n' > startup.cmd
cp dist/starter.img start.img
node tools/tecvol.mjs put start.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card start.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>DIR *.CMD!:TYPE STARTUP.CMD
STARTUP.CMD 
1 file, 980K free
A>:TYPE STARTUP.CMD
DIR *.CMD!:TYPE STARTUP.CMD
NOSUCH.SVC!:MOUNT
USER 0

A>NOSUCH.SVC!:MOUNT
NOSUCH.SVC?

A>:MOUNT
A>USER 0
A>
```

The first `DIR` succeeds so its `:TYPE STARTUP.CMD` runs before the `NOSUCH.SVC`
line. That service file is missing. Its `:MOUNT` is echoed but skipped and the
CCP proceeds to `USER 0`, the file's third line. The path back to `STLINE`
depends on `CHPOS` being zero, not on the previous command having succeeded
(`src/cpm/ccp.asm:148-166`, `src/cpm/ccp.asm:224-241`,
`src/cpm/ccp.asm:465-485`).

`STLINE` echoes a new startup line whole through BDOS function 9. A `$`
ends that echo but not the line's execution. Later pieces are echoed at
their own prompts by `MLECHO` (`src/cpm/ccpcmd.asm:995-1009`,
`src/cpm/ccp.asm:192-209`). The quiet absent-device exception changes the
result too: on this serial-only board, replacing `NOSUCH.SVC` with
`GLCD.SVC` would leave success and allow `:MOUNT` to run. The CCP tests
both startup origin and the absent-device installation result before taking
that quiet path (`src/cpm/ccp.asm:465-485`). Chapter 25 explains the full
startup and display rules.

## Finding and taking a piece

A zero `CHPOS` returns immediately from `CHSKIP` with `Z` set. Otherwise
`CHSKIP` calculates `CMDTXT - 1 + CHPOS` in `HL`. `CHSK1` then passes over
spaces and `!` until it reaches a character or the line's zero.
The final `OR A` sets `Z` only for that zero. Empty pieces, pieces of
spaces and a trailing `!` therefore need no separate command cases
(`src/cpm/ccp.asm:328-354`).

A remaining piece goes through `MLECHO`, which prints from `HL` up to
its `!` or zero. This happens before conversion to capitals, preserving
the case originally typed in the echo (`src/cpm/ccp.asm:192-209`,
`src/cpm/ccp.asm:249-267`). A newly read line instead reaches `MLGOT`
with its length in `CMDLEN`. `MLGOT` appends a zero and calls `CHSK1`
at `CMDTXT` to locate the first piece. A line containing only spaces and
separators goes straight back to the prompt (`src/cpm/ccp.asm:173-187`).

The first piece needs no additional echo. Function 10 already echoed typed
input and `STLINE` echoed startup input. Both now join the pending-piece
path at `MLTAKE` (`src/cpm/ccp.asm:148-187`). It processes the piece in
this order (`src/cpm/ccp.asm:224-289`):

1. A leading `:` tests the previous return code. Failure drops the line.
   On success, `HL` moves past the colon.
2. `ARGSTRT` is set to the piece's start.
3. `MLTK1` converts letters to capitals up to `!` or zero.
4. `MLTK2` replaces `!` with zero and records the following offset plus one
   in `CHPOS`. At the line's zero, `CHPOS` becomes zero instead.
5. `PRGCODE` is cleared for the new command.
6. Spaces are skipped. An empty command, including a colon alone after a
   successful test, returns to the prompt.

Replacing the separator gives every later parser a zero-terminated command.
A built-in reads from `ARGSTRT` and a loaded program receives a copy of
only that piece's tail. Neither includes the following pieces
(`src/cpm/ccp.asm:247-284`, `src/cpm/ccpcmd.asm:456-497`).

The stored position uses only low-byte arithmetic. After advancing past `!`,
`MLTK2` subtracts `LOW(CMDTXT - 1)` from `L`. The difference is below 256 so the
8-bit subtraction gives the required offset plus one across page boundaries too
(`src/cpm/ccp.asm:269-281`).

A drive letter and colon alone select that drive. Other text reaches
`NOTDRIVE`, which compares the built-in names and otherwise loads a COM
program or installs an SVC service (`src/cpm/ccp.asm:291-320`,
`src/cpm/ccp.asm:386-465`). Chapter 20 explains program search and launch.
`CHPOS` is already set before any of those commands runs.

An ordinary program exit reaches warm boot through the inherited return
word, a jump to `0000h` or BDOS function 0. After a successful flush,
the CCP resumes at the saved piece. Built-ins return through `MAINLOOP`
or `STARTED` and use the same next-piece check
(`src/cpm/ccp.asm:108-151`, `src/cpm/ccp.asm:532-536`,
`src/cpm/bdos.asm:257-259`, `src/boot.asm:194-215`). The failure case is
explained below because it cancels that saved position.

## The result before the next piece

The conditional test must read the previous command's result before the
CCP clears it for the new command. `MLTAKE` loads `PRGCODE` into `DE`.
The CCP copies `D` into `A` and increments `A`. A nonzero result accepts
codes below `FF00h`. When `D` is `FFh` it repeats the test with `E`.
A zero result then accepts `FFFFh`. The remaining values, `FF00h` through
`FFFEh`, are failures (`src/cpm/ccp.asm:224-241`).

A failed test clears `CHPOS` and jumps to `STARTED`. No later piece of
that line remains available. `MLECHO` ran before the test, which is why
the screen shows a colon piece that never executed. A colon at the start
of a new line uses the same test on the last command's retained result
(`src/cpm/ccp.asm:173-241`). The later clear at `MLTK3` occurs only after
the conditional test passes or an unconditional piece is taken. A program
therefore begins with a zero code (`src/cpm/ccp.asm:280-289`).

BDOS function 108 reaches `FNRETC` directly from `BENTRY`, before the
ordinary function table. The entry saves `DE` in `PARAM`. `FNRETC` loads
it into `HL`, ANDs the two bytes and increments the result. Only `FFFFh`
produces zero. That query returns `PRGCODE` in `HL`, with `A = L` and
`B = H` through `RETWORD`. Every other argument stores the code and returns
zero through `RETZERO` (`src/cpm/bdos.asm:137-149`,
`src/cpm/bdos.asm:228-252`, `src/cpm/bdos.asm:296-314`).

There is one shared return code. The explicit stores in the ROM are in
`FNRETC`, `MLTK3` and `ERRGO`. Cold boot also zeros its workspace location
(`src/cpm/bdos.asm:306-307`, `src/cpm/ccp.asm:280-284`,
`src/cpm/ccp.asm:619-624`, `src/boot.asm:73-79`). A program that leaves
this code untouched returns the zero established when its piece was taken.

`ERRGO` stores `RCFAIL`, or `FF00h`, before printing the error message.
`BADCMD` echoes the failed command or argument with a question mark and
falls through to that store (`src/cpm/ccp.asm:27-30`,
`src/cpm/ccp.asm:588-629`). `NO FILE` from `FILENO`, `FILE EXISTS` from
REN, `NO SPACE` from SAVE and COPY's four error messages all use `ERRGO`
(`src/cpm/ccpfile.asm:660-662`, `src/cpm/ccpmut.asm:181-184`,
`src/cpm/ccpcmd.asm:439-445`, `src/cpm/ccpmut.asm:379-381`,
`src/text.asm:34-41`). Missing programs, failed loads and unsuccessful
service installations reach `BADCMD` too. Startup's quiet absent-device
service path instead returns through `SVCOK` with the initial zero
(`src/cpm/ccp.asm:465-517`). Successful built-ins leave that zero.
COPY prints `COPIED` and its count, then sends the final newline through
`PRTGO`. That entry bypasses `ERRGO`'s failure store so the result remains zero
(`src/cpm/ccpmut.asm:347-368`, `src/cpm/ccp.asm:619-629`).

## Cancellation instead of continuation

Cancelling a chain clears `CHPOS`. The retained text can remain in memory
because the next-piece check no longer selects it. A failed colon test
clears the byte in `MLTAKE`. The BDOS uses `CHDROP`, which clears it and
jumps through the RAM BIOS warm-boot entry `BIOWBT`
(`src/cpm/ccp.asm:238-241`, `src/cpm/bdos.asm:115-119`). Three paths reach
`CHDROP`:

- `LINABRT` takes `^C` when function 10's input is empty. It prints `^C` before
  jumping. Within a nonempty line, the key is ignored. At the CCP prompt `CHPOS`
  is already zero so there is no pending piece to cancel
  (`src/cpm/bdos.asm:606-621`, `src/cpm/ccp.asm:148-166`).
- `CHKKEY` reads the key after a `^S` output pause. `^C` jumps to `CHDROP`. Any
  other resume key is consumed and output continues
  (`src/cpm/bdoscon.asm:318-331`).
- `BDERR` takes the default disk-error path. `DISKMSG` prints `Bdos Err On`, the
  drive and the cause, then `GETCHAR` waits for a key. The exit jumps to
  `CHDROP` (`src/cpm/bdoscon.asm:47-72`, `src/cpm/bdoscon.asm:108-118`). Chapter
  19 explains the four causes.

Function 45 can select a returned error instead. With `ERRMODE = FFh`,
`BDERR` returns `A = FFh` and `H` holding the error code from 1 to 4,
with no message. With `FEh`, it prints first and returns the same values.
Neither path clears `CHPOS`. The application can therefore handle the
error and leave its remaining pieces available. Warm boot clears `ERRMODE`
with the rest of the BDOS workspace, restoring the default for the next
program (`src/cpm/bdos.asm:261-275`, `src/cpm/bdoscon.asm:47-72`,
`src/ram.asm:231-237`, `src/boot.asm:530-536`).

The listing pager has its own cancellation path. At `[more]`, `PGWAIT`
clears bit 5 of the key with `AND DFh`, then compares the result with
`03h`, `1Bh` and `Q`. This makes `^C`, Esc, `Q` and `q` stop the listing.
It also maps `#` to `^C` and `;` to Esc. `^C` and `#` go through `PGDROP`,
which clears `CHPOS`. Esc, `;`, `Q` and `q` go straight to `PGSTOP`, leaving
the next piece available (`src/cpm/ccpfile.asm:475-519`).

Both stop paths return carry set. DIR and TYPE use that carry to finish
the listing and return through `STARTED`, as at an ordinary listing end
(`src/cpm/ccpfile.asm:180-182`, `src/cpm/ccpfile.asm:257-258`,
`src/cpm/ccpfile.asm:629-654`). The difference between stopping a listing
and dropping its chain is the store to `CHPOS`, not the carry result.

Warm boot can cancel a line after a program has already ended. `WBOOTR`
calls `CWBOOT` before entering the CCP. `CWBOOT` calls `CFLALL` to attempt
all dirty cache lines. If a write fails, that cache line is dropped. On
any failure `CWBOOT` clears `CHPOS` and prints `Write lost` once
(`src/boot.asm:210-215`, `src/cache.asm:307-350`,
`src/cache.asm:661-668`). A successful flush leaves the saved position
available. Chapter 18 explains the card-write consequences.

A reset instead clears `CHPOS` with the whole workspace. Cold boot then
starts with no remaining chain (`src/boot.asm:73-79`,
`src/ram.asm:421-424`, `src/ram.asm:483-485`).

## A replacement line from function 47

Function 47 creates a new chain using the same buffer and next-piece
position. `BENTRY` dispatches directly to `FNCHAIN`, which reads from
`CURDMA` in two passes: validation before copying
(`src/cpm/bdos.asm:67-108`, `src/cpm/bdos.asm:148-149`).

The validation loop counts 128 bytes in `B`. The first zero accepts the line.
The loop branches to `FNCHNO` on a CR or LF before the first zero or on
exhaustion of all 128 bytes without zero. That returns `A = FFh` through `RETA`
and restores the caller's stack through `RETWORD`. Neither the command buffer
nor `CHPOS` has been written so rejection leaves the original line available
(`src/cpm/bdos.asm:71-93`, `src/cpm/bdos.asm:235-252`). Keyboard and startup
input end at CR or LF before building this zero-terminated line
(`src/cpm/bdos.asm:435-440`, `src/cpm/ccpcmd.asm:958-966`,
`src/cpm/ccp.asm:173-180`).

On acceptance, `FNCH2` copies exactly 128 bytes to `CMDTXT` with `LDIR`.
That includes the line, its zero and any bytes after the zero. The
128-byte buffer is filled without setting `CMDLEN`, because the pending
path reads only to zero. `CHPOS` becomes 1, selecting offset zero
(`src/cpm/bdos.asm:95-108`, `src/ram.asm:171-172`).

This copy finishes during the call, before the next program can overwrite
the caller's memory. The line can therefore occupy caller memory that the
next load will replace. `FNCHAIN` jumps through `BIOWBT`, the RAM BIOS
warm-boot entry at `BF03h`. A program that replaced that entry receives
the call just as for other BDOS warm boots (`src/cpm/bdos.asm:22-23`, `src/layout.asm:134-135`,
`src/cpm/bdos.asm:95-119`, `src/cpm/bdos.asm:257-258`).

The normal warm-boot path flushes pending writes before the CCP can load
another program. Only a successful flush guarantees that those pending
writes reached the card. A failure drops failed lines, reports `Write lost`
and clears the newly set `CHPOS`, cancelling this replacement chain too
(`src/boot.asm:194-215`, `src/cache.asm:307-350`,
`src/cache.asm:661-668`). An accepted function-47 call ends the caller but
does not guarantee execution of the supplied command.

With a successful flush, `CHSKIP` finds the first new piece and `MLECHO`
echoes it. `MLTAKE` then applies the same colon test before clearing
`PRGCODE`. A leading `:` therefore tests the code left by the calling
program (`src/cpm/ccp.asm:148-151`, `src/cpm/ccp.asm:224-284`). Register
`E` selects no additional operation in this implementation. The CCP uses
the drive and user area from `0004h`, passed in `C` by warm boot
(`src/cpm/bdos.asm:67-108`, `src/boot.asm:212-215`,
`src/cpm/ccp.asm:46-102`).

The copy replaces the old command text and position so none of its later pieces
survives. An empty supplied line is valid: its first byte is zero. `CHSKIP` then
finds no piece and the CCP proceeds to the next startup line or keyboard input
(`src/cpm/bdos.asm:75-108`, `src/cpm/ccp.asm:148-166`,
`src/cpm/ccp.asm:328-354`).
