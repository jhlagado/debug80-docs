---
title: Chaining inside
parent: TEC-OS
nav_order: 24
nav_group: "Part II: Inside TEC-OS"
---

# 24. Chaining inside

Checked against TEC-OS 7458352, with the starter card's `TED.COM` from Thorium
128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
`TAS.COM` from Thorium dbee66a, with the SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

Chapter 11 describes a command line split at `!`, the condition `:`, the return
code and BDOS function 47 as you use them. Behind them are a command line that
outlives the warm boot at the end of each program, one byte that marks the next
piece of it, a 16-bit code that holds the result and a copy that function 47
makes into the CCP's buffer. This chapter follows a line from the prompt through
the CCP's main loop, starting with where the line is kept and how the loop takes
a piece. It then covers the test of the code at `:`, the paths that drop the
rest of the line and function 47's checks and copy.

The code is in `src/cpm/ccp.asm`, with function 47 and function 108 in
`src/cpm/bdos.asm` and the line's storage in `src/ram.asm`. Chapter 17
describes the CCP's other routines named here, and Chapter 16 the BDOS's
entry. `test/chain.test.mjs` checks these rules on the host model of Chapter
25.

## The line kept across a warm boot

A program in a piece of a line ends with a warm boot, which clears the CCP's and
the BDOS's state as a fresh load of them from disk would leave it (Chapter 14).
The rest of the line survives because the CCP's RAM is in two parts. Its first
202 bytes run from `CMDFCB` at `BCEBh` to `CCPCLR` at `BDB5h`, and they hold the
two FCBs the built-ins parse names into and the command buffer that BDOS
function 10 fills. The buffer is a byte for its maximum length, `CMDBUF`, a byte
for the length read, `CMDLEN`, and 128 bytes of characters, `CMDTXT`, at `BD35h`
(`src/ram.asm:68-81`). `CPMINIT`, which warm boot calls, clears from `CCPCLR` to
`BDOSRME`, the end of the BDOS's RAM, 331 bytes, so the command buffer and the
two FCBs before it are kept (`src/boot.asm:261-268`, `src/boot.asm:82`). The
FCBs need no clearing, since each use of them parses a name into them in full
and clears the rest (`src/cpm/ccp.asm:1366-1391`).

The position of the next piece is `CHPOS`, one byte at `BFE4h`, in the part of
the workspace above the RAM BIOS table, which `CPMINIT` doesn't clear
(`src/ram.asm:192`, `src/ram.asm:239`). It holds the piece's offset in `CMDTXT`
plus one, and 0 when no piece is left, so one byte covers the 128 offsets with 0
to spare. The return code, `PRGCODE` at `BF56h`, is in the same block
(`src/ram.asm:228`). Cold boot clears the whole resident workspace, from
`WSBASE` to `WSEND`, which ends after `CHPOS` (`src/boot.asm:33-37`,
`src/ram.asm:240-241`), so after a reset no piece is left and the code is 0.

`CPMINIT` sets the buffer's maximum length, 127, at every warm boot and so at
every cold boot, which runs on into warm boot (`src/boot.asm:270-272`,
`src/boot.asm:69-74`). A startup line is cut to the same length, because
`STLINE` copies at most 127 characters of a line of `STARTUP.CMD` into `CMDTXT`
and passes over the rest of the line (`src/svc.asm:439`, `src/svc.asm:453-455`).
Function 47 takes a line whose 0 is within 128 bytes, so at most 127 characters
too (`src/cpm/bdos.asm:51-64`).

With that limit a piece's command tail fits the page-zero buffer at `0080h`. A
program's name has at least one character, so its tail has at most 126.
`PREPPAGE` (Chapter 17) copies the tail to `0081h` with a 0 after it, and the 0
lands at `00FFh` at the latest (`src/cpm/ccp.asm:1340-1357`). A tail one
character longer would put its 0 at `0100h`, the first byte of the program,
which `LOADCOM` (Chapter 17) has already loaded by then
(`src/cpm/ccp.asm:283-296`). The byte at `0050h`, where the CCP stores the
drive the program came from, is below the tail's buffer, so no tail reaches it
(`src/cpm/ccp.asm:297-298`).

## The main loop

The CCP's loop starts at `MAINLOOP`, after any command and after the entry
from a warm boot. Chapter 17 describes the prompt and the line it reads.
`SAVEDU` stores the drive and user area at `0004h` and returns the drive
(`src/cpm/ccp.asm:206-225`), and the loop prints the prompt with it
(`src/cpm/ccp.asm:72-79`). It then takes a line from one of three places, in
this order (`src/cpm/ccp.asm:80-89`):

1. The next piece of a chained line, found by `CHSKIP`.
2. The next line of the startup file, from `STLINE`, once `CHPOS` is 0.
3. A line typed at the keyboard, by BDOS function 10, with the history turned
   on for it through `HFLAG`.

A chained line's pieces therefore run before the startup file's next line,
whether the line came from the startup file or from function 47 called by a
program that a startup line started. This card's startup file has three lines,
and the first two hold `!`:

```sh
printf 'DIR *.CMD!:TYPE STARTUP.CMD\nPICO.SVC!:MOUNT\nUSER 0\n' > startup.cmd
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
1 file, 978K free
A>:TYPE STARTUP.CMD
DIR *.CMD!:TYPE STARTUP.CMD
PICO.SVC!:MOUNT
USER 0

A>PICO.SVC!:MOUNT
PICO.SVC?

A>:MOUNT
A>USER 0
A>
```

`STLINE` echoes each line of the file whole, through BDOS function 9, so a `$`
in a line would end its echo there (`src/svc.asm:469-473`). The CCP echoes the
later pieces after their own prompts. `PICO.SVC` fails on this serial
board, so `:MOUNT` is dropped, and the loop goes on to the startup file's third
line.

`CHSKIP` reads `CHPOS` and returns at once with `Z` when it is 0. Otherwise it
points `HL` at `CMDTXT - 1` plus `CHPOS` and steps past spaces and `!`, and it
returns `Z` only if it reaches the line's 0 (`src/cpm/ccp.asm:187-204`). So
empty pieces and spaces between pieces are passed over there, and a line that
ends with `!` ends the same as one without it.

When a piece is left, the loop goes to `MLECHO`, which prints the piece after
the prompt, from `HL` up to its `!` or the line's 0 (`src/cpm/ccp.asm:105-118`).
The text is printed before the piece is turned into capitals, so the echo keeps
the case of what was typed.

A new line, typed or from the startup file, reaches `MLGOT` with its length in
`CMDLEN`. `MLGOT` writes a 0 after the line's last character, sets `CHPOS` to 1
for the line's first piece and calls `CHSKIP`, so a new line and a chained piece
are taken by the same code. A line of nothing but spaces and `!` goes straight
back to the prompt (`src/cpm/ccp.asm:91-103`). Function 10 has already echoed a
typed line and `STLINE` a startup line, so neither goes through `MLECHO`.

## Taking a piece

`MLTAKE` takes the piece at `HL` (`src/cpm/ccp.asm:120-163`). Its steps are:

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
the drive (`src/cpm/ccp.asm:164-185`), and anything else goes to `NOTDRIVE`
(Chapter 17), which compares the command with the built-ins' names and otherwise
loads a program or installs a service (`src/cpm/ccp.asm:227-304`). A program is
looked for on the drive named, or the current drive, in the current user and
then in that drive's user 0. One not found there is looked for on A:, in the
current user and then in user 0, when the command names no drive and the
current drive isn't A:, so `B:NAME` looks on B: alone
(`src/cpm/ccp.asm:283-295`, `src/cpm/ccp.asm:361-387`).

Every routine after `MLTAKE` reads the piece through `ARGSTRT` and stops at its
0, so a built-in or a program reads its own piece and nothing of the pieces
after it. `PREPPAGE` copies the command tail from `ARGSTRT` up to the 0, which
leaves the tail at `0080h` ending at the `!` (`src/cpm/ccp.asm:1329-1357`).

`CHPOS` is set before the command runs. A program that ends normally, by `RET`,
by a jump to `0000h` or by BDOS function 0 (`src/cpm/bdos.asm:130-131`), reaches
the warm boot, then the CCP's entry and `MAINLOOP`, and `CHSKIP` finds the next
piece where `MLTAKE` left it. A built-in ends with a jump to `MAINLOOP` or to
`STARTED`, which Chapter 17 describes, and reaches `CHSKIP` the same way.

The offset arithmetic at `MLTK2` uses only the low bytes of the addresses: `L`
less the low byte of `CMDTXT - 1` (`src/cpm/ccp.asm:153-157`). The difference
is below 256, so the 8-bit subtraction gives it whatever page the buffer is
on.

## The return code and the `:` test

BDOS function 108 is `FNRETC` (`src/cpm/bdos.asm:133-145`), and the BDOS's entry
sends function 108 there before its table, as it does 47
(`src/cpm/bdos.asm:79-88`). `FNRETC` tests `DE`: `H AND L` is `FFh` only for
`FFFFh`. For that value it returns `PRGCODE` in `HL`, with `A` and `B` set from
it as for every word the BDOS returns (`src/cpm/bdos.asm:124-128`). Any other
`DE` is stored in `PRGCODE` and the call returns 0. There is one code for every
program, and in the ROM only `FNRETC`, the CCP and cold boot write it.

At step 1 of `MLTAKE` the CCP reads `PRGCODE` into `DE`
(`src/cpm/ccp.asm:125-137`). If `D` isn't `FFh` the code is below `FF00h`, a
success. If `D` is `FFh` and `E` is too, the code is `FFFFh`, also a success.
Anything else, `FF00h` to `FFFEh`, is a failure. On a failure `CHPOS` is set to
0 and the loop goes to `STARTED`, which prints a new line and the prompt, and
with `CHPOS` at 0 nothing more of the line runs. `MLECHO` printed the piece
before `MLTAKE` read it, so the screen shows the `:` piece that didn't run.

A `:` at the start of a new line tests the code in the same way, and the code
there is that of the last command run, which may be the last piece of the line
before.

The code is cleared at step 5, after the test, so the test reads the code of the
command before and the command about to run starts from 0. A program that calls
function 108 with `DE = FFFFh` at its start reads that 0.

The CCP sets the code to a failure in one place, `ERRGO`, which Chapter 17
describes with `BADCMD`. `ERRGO` stores `RCFAIL`, `FF00h`, and prints the
message at `DE` before it goes to `STARTED` (`src/cpm/ccp.asm:20`,
`src/cpm/ccp.asm:353-359`). `BADCMD`, which prints a command or argument with
a question mark, falls through into it (`src/cpm/ccp.asm:333-356`). The
built-ins' messages go there by `JP ERRGO`: `NO FILE` from `FILENO`,
`FILE EXISTS` from `REN`, `NO SPACE` from `SAVE` and `COPY`'s four messages
through `CPFAIL` (`src/cpm/ccp.asm:881-883`, `src/cpm/ccp.asm:993-995`,
`src/cpm/ccp.asm:1324-1326`, `src/cpm/ccp.asm:1103-1104`).

A program that isn't found on the drives the search looks at, or fails to load,
or a service that fails to install, reaches `BADCMD` (`src/cpm/ccp.asm:264-295`). Every other end of a built-in
leaves the code at 0, including `COPY`'s `COPIED` line, which is printed through
`PRTGO`, the entry after the store (`src/cpm/ccp.asm:1095-1102`,
`src/cpm/ccp.asm:357`).

## Paths that drop the rest

A line is dropped by setting `CHPOS` to 0. Besides the failed `:` above, the
BDOS does it in `CHDROP`, which clears `CHPOS` and jumps to the warm boot
through the RAM BIOS table (`src/cpm/bdos.asm:73-77`). Two kinds of event go
through `CHDROP`:

- `^C` while a line read with function 10 is empty. `LINABRT` prints `^C` and
  jumps to `CHDROP` (`src/cpm/bdos.asm:314-324`). The CCP calls function 10 only
  with `CHPOS` at 0, so at its own prompt no piece is left, and only a line that
  a program reads has anything to drop.
- A BDOS error. `DISKERR` prints `Bdos Err On`, the drive and the cause, and
  waits for a key (`src/cpm/bdos.asm:2425-2435`). The routine for each cause
  then jumps to `CHDROP`: `File R/O` from `ROTEST`, `R/O` from `CHKRO`,
  `Select` from `SELFAIL` and `Bad Sector` from `BADSECT`
  (`src/cpm/bdos.asm:639-647`, `src/cpm/bdos.asm:2368-2390`,
  `src/cpm/bdos.asm:2403-2406`). A failed read of a directory record goes to
  `BADSECT` too (`src/cpm/bdos.asm:1838`).

A reset drops the line by clearing `CHPOS` with the rest of the workspace
(`src/boot.asm:33-37`).

A `[more]` pause drops the line only on `^C`. `PGWAIT` reads a key, clears its
bit 5 with `AND DFh` and compares it with `03h`, `1Bh` and `Q`, so `^C`, Esc,
`Q` and `q` stop a listing, and so do `#` and `;`, which the mask turns into `^C`
and Esc. `^C` and `#` go to `PGDROP`, which clears `CHPOS`. The other keys leave
`CHPOS` as it was, and the line runs on. A key that stops the listing sets carry
in `PGNEWL`, and `DIR` and `TYPE` then end through `STARTED` like a listing that
ran to its end (`src/cpm/ccp.asm:753-783`, `src/cpm/ccp.asm:532`,
`src/cpm/ccp.asm:594`, `src/cpm/ccp.asm:870-879`).

`Write lost` drops the line too. `CWBOOT` prints that message at a warm boot when
a cache write has failed since the last one, after clearing `CFAIL` and `CHPOS`.
`WBOOTR` then jumps to the CCP's entry with `CHPOS` at 0 (`src/ram.asm:202`,
`src/cache.asm:198`, `src/cache.asm:354-365`, `src/boot.asm:88-91`).

## Function 47

Function 47 is `FNCHAIN` (`src/cpm/bdos.asm:46-71`), and the BDOS's entry sends
it there before its table (`src/cpm/bdos.asm:86-87`). It reads the line at
`CURDMA`, the DMA address, in two passes.

The first pass checks the line. `B` counts 128 bytes from the DMA address, and
the loop stops at the first 0. A carriage return or a line feed before it, or
128 bytes with no 0, sends the call to `FNCHNO`, which returns `FFh` in `A`
through `RETA`, with the program's stack back and nothing changed
(`src/cpm/bdos.asm:51-64`, `src/cpm/bdos.asm:120-128`). A line from the keyboard
or the startup file can hold neither character, since function 10 and `STLINE`
both end a line there (`src/svc.asm:449-452`).

The second pass copies. `LDIR` copies 128 bytes from the DMA address into
`CMDTXT`: the line, its 0 and whatever follows the 0. `CHPOS` is set to 1, the
line's first piece (`src/cpm/bdos.asm:65-70`). `CMDTXT` has 128 bytes, so the
copy fills it exactly. The copy is made during the call, before the warm boot
and before the next program is loaded, so the line may be anywhere in the
caller's memory, even where the chained program loads. `CMDLEN` isn't set: from
here on the line is read only up to its 0.

`FNCHAIN` then jumps to `BIOWBT`, the warm boot entry of the RAM BIOS table at
`BF03h` (`src/cpm/bdos.asm:14`, `src/cpm/bdos.asm:71`). A program that has
replaced that entry gets the call, as it does for the other warm boots the BDOS
makes. The warm boot keeps `CMDTXT`, and `CHPOS` too unless a cache write has
failed, and at `MAINLOOP` `CHSKIP` finds the line's first piece. The loop echoes it with `MLECHO` and takes it with
`MLTAKE` as it does any chained piece, so a `:` at its start tests the code the
calling program left.

TEC-OS doesn't read `E`, which CP/M 3's function 47 reads. The CCP's entry
takes the drive and user area from `0004h`, as after any program
(`src/boot.asm:89-91`, `src/cpm/ccp.asm:29-66`).

The line from function 47 replaces the whole of the old line, and `CHPOS` points
at its start, so the pieces of the old line after the program are gone. An empty
line, a 0 at the DMA address, leaves `CHSKIP` nothing to find, and the CCP then
goes on to the startup file or the keyboard.
