---
title: Chaining inside
parent: TEC-OS
nav_order: 21
nav_group: "Part II: Inside TEC-OS"
---

# 21. Chaining inside

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

A program ends, and warm boot clears the CCP's and the BDOS's state as a fresh
load from disk would leave it. Yet the rest of the line that started the
program is still there when the prompt comes back. The CCP runs its next piece
before anything else. Chapter 11 showed that from the keyboard: a line
split at `!`, a `:` that tests the command before, a return code and function
47. This chapter follows the line through the warm boot and the CCP's loop,
from where it is kept to what drops it. Chapter 20 describes the CCP's other
routines named here, and `test/chain.test.mjs` checks these rules on the host
model of Chapter 27.

## The line kept across a warm boot

The rest of the line survives because the CCP's RAM is in two parts. Its first
202 bytes run from `CMDFCB` at `BCEDh` to `CCPCLR` at `BDB7h`. They hold the
two FCBs the built-ins parse names into and the command buffer that BDOS
function 10 fills: a byte for its maximum length, `CMDBUF`, a byte for the
length read, `CMDLEN`, and 128 bytes of characters, `CMDTXT`, at `BD37h`
(`src/ram.asm:140-160`). `CPMINIT`, which warm boot calls, clears from `CCPCLR`
to `BDOSRME`, the end of the BDOS's RAM, 329 bytes (`src/boot.asm:499-505`,
`src/boot.asm:195-196`). The command buffer and the two FCBs before it are kept.
The FCBs need no clearing, since each use parses a name into them in full and
clears the rest (`src/cpm/ccpcmd.asm:482-517`).

The position of the next piece is `CHPOS`, one byte at `BFE4h`
(`src/ram.asm:294`, `src/ram.asm:390-391`). It is in the part of the workspace
above the RAM BIOS table, which `CPMINIT` leaves alone. It holds the piece's offset in `CMDTXT`
plus one, and 0 when no piece is left, so one byte covers the 128 offsets with
0 to spare. The return code, `PRGCODE` at `BF54h`, is in the same block
(`src/ram.asm:357-359`). Cold boot clears the whole resident workspace, from
`WSBASE` to `WSEND`, which ends after `CHPOS` (`src/boot.asm:73-79`,
`src/ram.asm:447-449`). After a reset no piece is left and the code is 0.

`CPMINIT` sets the buffer's maximum length, 127, at every warm boot
(`src/boot.asm:509-511`). A startup line is cut to the same length. `STLINE`
copies at most 127 characters of a line of `STARTUP.CMD` into `CMDTXT`
(`src/cpm/ccpcmd.asm:897-898`, `src/cpm/ccpcmd.asm:916-920`). The rest of the line
is passed over.
Function 47 takes a line whose 0 is within 128 bytes, so at most 127
characters too (`src/cpm/bdos.asm:70-92`).

With that limit a piece's command tail fits the page-zero buffer at `0080h`. A
program's name has at least one character, so its tail has at most 126.
`PREPPAGE` copies the tail to `0081h` with a 0 after it, and the 0 lands at
`00FFh` at the latest (`src/cpm/ccpcmd.asm:446-465`). A tail one character
longer would put its 0 at `0100h`, the first byte of the program, which
`LOADCOM` has loaded by then (`src/cpm/ccp.asm:472-495`). The byte at `0050h`,
where the CCP stores the drive the program came from, is below the tail's
buffer, so no tail reaches it (`src/cpm/ccp.asm:496-499`).

## The main loop

The CCP's loop starts at `MAINLOOP`, after any command and after the entry
from a warm boot. `SAVEDU` stores the drive and user area at `0004h` and
returns the drive (`src/cpm/ccp.asm:346-367`). The loop prints the prompt with
it (`src/cpm/ccp.asm:115-143`). It then takes a line from
one of three places, in this order (`src/cpm/ccp.asm:144-162`):

1. The next piece of a chained line, found by `CHSKIP`.
2. The next line of the startup file, from `STLINE`, once `CHPOS` is 0.
3. A line typed at the keyboard, by BDOS function 10, with the history turned
   on for it through `HFLAG`.

A chained line's pieces therefore run before the startup file's next line.
That holds for a line from the startup file and for one from function 47,
called by a program that a startup line started. This card's startup file has three lines,
and the first two hold `!`:

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

`STLINE` echoes each line of the file whole, through BDOS function 9, so a `$`
in a line would end its echo there (`src/cpm/ccpcmd.asm:943-952`). The CCP
echoes the later pieces after their own prompts. The card has no `NOSUCH.SVC`,
so the service fails, `:MOUNT` is dropped and the loop goes on to the startup
file's third line. A `GLCD.SVC` in its place would fail quietly on this board,
which has no graphics LCD, and leave the code at 0. `:MOUNT` would then run,
as Chapter 25 describes.

`CHSKIP` reads `CHPOS` and returns at once with `Z` when it is 0
(`src/cpm/ccp.asm:314-338`). Otherwise it points `HL` at `CMDTXT - 1` plus
`CHPOS` and steps past spaces and `!`. It returns `Z` only if it reaches the
line's 0. Empty pieces and spaces between pieces are passed over there, and a
line that ends with `!` ends the same as one without it.

With a piece left, the loop goes to `MLECHO`, which prints the piece after the
prompt, from `HL` up to its `!` or the line's 0 (`src/cpm/ccp.asm:184-203`).
The text is printed before the piece is turned into capitals, so the echo keeps
the case of what was typed.

A new line, typed or from the startup file, reaches `MLGOT` with its length in
`CMDLEN` (`src/cpm/ccp.asm:164-182`). `MLGOT` writes a 0 after the line's last
character and calls `CHSK1` with `HL` at `CMDTXT` to find the first piece. A new
line and a chained piece are therefore taken by the same code. A line of nothing
but spaces and `!` goes straight back to the prompt. Function 10 has already
echoed a typed line and `STLINE` a startup line, so neither goes through
`MLECHO`.

## Taking a piece

`MLTAKE` takes the piece at `HL` (`src/cpm/ccp.asm:219-280`). Its steps are:

1. If the piece starts with `:`, the code is tested, as the next section
   describes, and `HL` moves past the `:`.
2. `ARGSTRT` is set to the piece's start.
3. The loop at `MLTK1` turns each small letter into a capital, up to the
   piece's `!` or the line's 0.
4. At a `!`, `MLTK2` writes a 0 over it, so the piece ends there for every
   routine that reads it, and sets `CHPOS` to the offset of the byte after it,
   plus one. At the line's 0, `CHPOS` is set to 0.
5. `PRGCODE` is set to 0.
6. Spaces are passed over. A piece with nothing left, such as a `:` alone,
   goes back to the prompt.

The CCP then tests what the piece is. A drive letter and a colon alone select
the drive (`src/cpm/ccp.asm:282-307`). Anything else goes to `NOTDRIVE` (`src/cpm/ccp.asm:380-509`). `NOTDRIVE`
compares the command with the built-ins' names. A name that matches none
loads a program or installs a service. Chapter 20 gives the order
in which the drives and user areas are searched for the program.

Every routine after `MLTAKE` reads the piece through `ARGSTRT` and stops at its
0. A built-in or a program therefore reads its own piece and nothing of the
pieces after it. `PREPPAGE` copies the command tail from `ARGSTRT` up to the 0,
which leaves the tail at `0080h` ending at the `!`
(`src/cpm/ccpcmd.asm:432-465`).

`CHPOS` is set before the command runs. A program ends normally by `RET`, by a
jump to `0000h` or by BDOS function 0 (`src/cpm/bdos.asm:246-248`). Each
reaches the warm boot, then the CCP's entry and `MAINLOOP`, and `CHSKIP` finds
the next piece where `MLTAKE` left it. A built-in ends with a jump to `MAINLOOP` or
to `STARTED` and reaches `CHSKIP` the same way.

The offset arithmetic at `MLTK2` uses only the low bytes of the addresses: `L`
less the low byte of `CMDTXT - 1` (`src/cpm/ccp.asm:262-272`). The difference
is below 256, so the 8-bit subtraction gives it whatever page the buffer is on.

## The return code and the `:` test

BDOS function 108 is `FNRETC` (`src/cpm/bdos.asm:280-298`). The BDOS's entry
sends it there before its table, as it does the other functions above 40
(`src/cpm/bdos.asm:133-159`). `FNRETC` tests `DE`: `H AND L` is `FFh`
only for `FFFFh`. For that value it returns `PRGCODE` in `HL`, with `A` and `B`
set from it as for every word the BDOS returns (`src/cpm/bdos.asm:235-242`).
Any other `DE` is stored in `PRGCODE` and the call returns 0. There is one code
for every program, and in the ROM only `FNRETC`, the CCP and cold boot write
it.

At step 1 of `MLTAKE` the CCP reads `PRGCODE` into `DE`
(`src/cpm/ccp.asm:224-237`). If `D` isn't `FFh` the code is below `FF00h`, a
success. If `D` is `FFh` and `E` is too, the code is `FFFFh`, also a success.
Anything else, `FF00h` to `FFFEh`, is a failure. On a failure `CHPOS` is set to
0 and the loop goes to `STARTED` for a new line and the prompt. With `CHPOS`
at 0 nothing more of the line runs. `MLECHO` printed the piece before
`MLTAKE` read it, so the screen shows the `:` piece that didn't run.

A `:` at the start of a new line tests the code in the same way. The code
there is that of the last command run, which may be the last piece of the line
before.

The code is cleared at step 5, after the test. The test therefore reads the
code of the command before, and the command about to run starts from 0. A
program that calls function 108 with `DE = FFFFh` at its start reads that 0.

The CCP sets the code to a failure in one place, `ERRGO`, which Chapter 20
describes with `BADCMD`. `ERRGO` stores `RCFAIL`, `FF00h`, and prints the
message at `DE` before it goes to `STARTED` (`src/cpm/ccp.asm:27-29`,
`src/cpm/ccp.asm:583-591`). `BADCMD`, which prints a command or argument with
a question mark, falls through into it (`src/cpm/ccp.asm:556-586`). The
built-ins' messages go there by `JP ERRGO`. They are `NO FILE` from `FILENO`,
`FILE EXISTS` from `REN`, `NO SPACE` from `SAVE` and `COPY`'s four messages
through `CPFAIL` (`src/cpm/ccpfile.asm:623-626`, `src/cpm/ccpmut.asm:172-175`,
`src/cpm/ccpcmd.asm:418-421`, `src/cpm/ccpmut.asm:356-358`).

A program that is on none of the drives searched, or fails to load, or a
service that fails to install, reaches `BADCMD` (`src/cpm/ccp.asm:425-491`).
The one exception is a line from the startup file whose service reports its
device absent (`src/cpm/ccp.asm:444-461`). That line goes to the prompt with
the code at 0. Every other end of a built-in leaves the code at 0. `COPY`'s
`COPIED` line is one, since it is printed through `PRTGO`, the entry after the
store (`src/cpm/ccpmut.asm:335-345`, `src/cpm/ccp.asm:588-591`).

## The paths that drop the rest

A line is dropped by setting `CHPOS` to 0. Besides the failed `:` above, the
BDOS does it in `CHDROP` (`src/cpm/bdos.asm:107-116`). `CHDROP` clears `CHPOS`
and jumps to the warm boot through the RAM BIOS table. Three kinds of event go
through `CHDROP`:

- `^C` while a line read with function 10 is empty. `LINABRT` prints `^C` and
  jumps to `CHDROP` (`src/cpm/bdos.asm:568-581`). The CCP calls function 10
  only with `CHPOS` at 0, so at its own prompt no piece is left. Only a line
  that a program reads has anything to drop.
- `^C` as the key that ends a `^S` pause during output. `CHKKEY` takes the key
  after `^S` and jumps to `CHDROP` for `^C`, dropping any other key
  (`src/cpm/bdoscon.asm:283-306`).
- A BDOS error in the default mode. `BDERR` reads `ERRMODE`, the mode BDOS
  function 45 sets, and in the default mode `DISKMSG` prints `Bdos Err On`,
  the drive and the cause. A key is waited for and the routine jumps to
  `CHDROP` (`src/cpm/bdoscon.asm:45-66`, `src/cpm/bdoscon.asm:99-109`). Chapter
  19 lists the four causes.

With `ERRMODE` at `FFh` the error returns to the program with `A` = `FFh` and
`H` its code, 1 to 4, and nothing printed. With `FEh` the message is printed
first and the error returns the same way. Neither touches `CHPOS`, so a program
that takes its own errors leaves the chained line to run on
(`src/cpm/bdoscon.asm:45-59`). `ERRMODE` is in the BDOS's RAM, which every warm
boot clears, so each program entered after a warm boot starts in the default
mode (`src/ram.asm:215-218`, `src/boot.asm:499-505`).

A reset drops the line by clearing `CHPOS` with the rest of the workspace
(`src/boot.asm:73-79`).

A `[more]` pause drops the line only on `^C`. `PGWAIT` reads a key, clears its
bit 5 with `AND DFh` and compares it with `03h`, `1Bh` and `Q`
(`src/cpm/ccpfile.asm:447-490`). `^C`, Esc, `Q` and `q` stop a listing. So do `#`
and `;`, which the mask turns into `^C` and Esc. `^C` and `#` go to `PGDROP`,
which clears `CHPOS`. The other keys leave `CHPOS` as it was, and the line runs
on. A key that stops the listing sets carry in `PGNEWL`. `DIR` and `TYPE` then
end through `STARTED` like a listing that ran to its end
(`src/cpm/ccpfile.asm:168-169`, `src/cpm/ccpfile.asm:238-240`,
`src/cpm/ccpfile.asm:606-619`).

`Write lost` drops the line too. `CWBOOT` prints that message at a warm boot
when a line of the block cache fails to reach the card in its flush
(`src/cache.asm:638-653`). It clears `CHPOS` first. `WBOOTR` then jumps to the CCP's
entry with `CHPOS` at 0 (`src/boot.asm:206-211`). Chapter 18 describes the
flush.

## Function 47

Function 47 is `FNCHAIN` (`src/cpm/bdos.asm:68-105`), and the BDOS's entry sends
it there before its table (`src/cpm/bdos.asm:144-145`). It reads the line at
`CURDMA`, the DMA address, in two passes.

The first pass checks the line. `B` counts 128 bytes from the DMA address, and
the loop stops at the first 0. A carriage return or a line feed before it, or
128 bytes with no 0, sends the call to `FNCHNO`, which returns `FFh` in `A`
through `RETA`, with the program's stack back and nothing changed
(`src/cpm/bdos.asm:70-92`, `src/cpm/bdos.asm:226-242`). A line from the keyboard
or the startup file holds neither character. Function 10 and `STLINE` both end
a line there (`src/cpm/ccpcmd.asm:911-915`).

The second pass copies. `LDIR` copies 128 bytes from the DMA address into
`CMDTXT`: the line, its 0 and whatever follows the 0. `CHPOS` is set to 1, the
line's first piece (`src/cpm/bdos.asm:94-103`). `CMDTXT` has 128 bytes, so the
copy fills it exactly. The copy is made during the call, before the warm boot
and before the next program is loaded, so the line may be anywhere in the
caller's memory, even where the chained program loads. `CMDLEN` isn't set:
from here on the line is read only up to its 0.

`FNCHAIN` then jumps to `BIOWBT`, the warm boot entry of the RAM BIOS table at
`BF03h` (`src/cpm/bdos.asm:23`, `src/cpm/bdos.asm:104-105`). A program that has
replaced that entry gets the call, as it does for the other warm boots the
BDOS makes. The warm boot writes the block cache's dirty lines before it
enters the CCP (`src/boot.asm:206-211`). The records the program wrote behind
are therefore on the card before the chained program is loaded. The warm boot
keeps `CMDTXT`, and `CHPOS` too unless a line failed to reach the card. At
`MAINLOOP` `CHSKIP` finds the line's first piece. The loop echoes it with
`MLECHO` and takes it with `MLTAKE` as it does any chained piece. A `:` at its
start therefore tests the code the calling program left.

TEC-OS doesn't read `E`, which CP/M 3's function 47 reads. The CCP's entry
takes the drive and user area from `0004h`, as after any program
(`src/boot.asm:208-211`, `src/cpm/ccp.asm:46-100`).

The line from function 47 replaces the whole of the old line, and `CHPOS`
points at its start. The pieces of the old line after the program are gone. An
empty line, a 0 at the DMA address, leaves `CHSKIP` nothing to find. The CCP
then goes on to the startup file or the keyboard.
