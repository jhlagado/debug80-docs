---
title: Command history
parent: TEC-OS
nav_order: 22
nav_group: "Part II: Inside TEC-OS"
---

# 22. Command history

Checked against TEC-OS 58d4345, with the starter card's `TED.COM` from Thorium
128edb7, whose copy in `dist/files` has the SHA-256
`2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
`TAS.COM` from Thorium dbee66a, with the SHA-256
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

At the CCP's prompt, `^W` brings back the line typed before, and `^N` the line
after the one shown. Chapter 3 describes the keys from the prompt. This chapter
describes the store behind them, a ring of 256 bytes in EXPAND 1, then the way a
line goes into the ring, the way `^W` and `^N` walk it inside BDOS function 10
and what a warm boot and a reset leave of it. All of it is in `src/history.asm`,
with a few lines in the BDOS's line input and the CCP.

## Recalling a line

`^W` at an empty prompt puts the newest line from the history in the line buffer
and echoes it, as if it had been typed, and a second `^W` replaces it with the
line before that. The line can then be edited with the keys of BDOS function 10,
such as backspace, and Return runs it. Here two lines were typed, and then `^W`,
`^W` and Return, so the screen shows the recalled `CON` after the prompt, and
its reply:

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

A recall erases the line already on the console with a backspace, a space and a
backspace for each character. The PICO9918's screen shows the result of the
erasure where the serial output would show the bytes, so most of the transcripts
in this chapter come from that screen. The capture's `@start` line types its
keys and a Return together. `$'\x17'` is the shell's way of writing `^W`,
`$'\x0e'` `^N` and `$'\x08'` backspace.

A recalled line is the start of a new line, not a fixed copy. Here `DIR *.SVC`
was recalled with `^W`, its last three characters were taken off with backspace
and `CMD` was typed in their place:

<!-- node tools/capture.mjs --board pico --screen "DIR *.SVC" "@start "$'\x17\x08\x08\x08CMD' -->
```text
A>DIR *.SVC
GLCD.SVC
1 file, 980K free
A>DIR *.CMD
STARTUP.CMD
1 file, 980K free
A>
```

`^N` moves the other way, toward the newest line, and one step past the newest
it leaves an empty line. In this run `^W` `^W` showed `CON` and `^N` showed `DIR
*.CMD`. A second `^N` emptied the line, so the Return ran nothing and the CCP
printed the prompt again:

<!-- node tools/capture.mjs --board pico --screen CON "DIR *.CMD" "@start "$'\x17\x17\x0e\x0e' -->
```text
A>CON
CON: CRT:
A>DIR *.CMD
STARTUP.CMD
1 file, 980K free
A>
A>
```

At the oldest line `^W` changes nothing, and with no line shown `^N` changes
nothing.

## The ring at BD00h

The history is the page at `BD00h` in EXPAND 1, `HRING` (`src/history.asm:14`).
Chapter 13 lists EXPAND 1's other pages and explains why no stack is in use
while EXPAND 1 is in view. No BDOS function and no numbered service gives a
program a way into the page.

Two routines read and write the ring a byte at a time. `HGET` returns the byte
at offset `L` in `A`, and `HPUT` writes `A` there, with `H` holding the ring's
page, `BDh` (`src/history.asm:16-42`). Each saves the interrupt state, turns
interrupts off and writes the latch with `LATEXP` added to TEC-OS's copy of it
at `0040h`. It then makes the access, writes the latch back as it was and turns
interrupts on again if they were on before.

The offset into the page is `L` alone, so `INC L` from offset `FFh` reaches
offset `00h` and the page is a ring with no end. Each line is stored as its
characters followed by a byte of 0, written forward from the offset in `HHEAD`,
a byte of the workspace in EXPAND 0 (`src/ram.asm:224-225`). After a line's 0,
`HHEAD` holds the offset of the byte that follows it.

A walk back through a ring needs a place to stop, so the ring is kept with the
byte at `HHEAD` always 0, and the byte before it too, the newest line's
terminator (`src/history.asm:6-10`). A 0 that follows another 0 is an empty
entry, and the empty entry at `HHEAD` separates the newest line from the oldest.
A walk back from the newest line stops when it reaches an empty entry.

## Storing a line

The CCP and programs both read lines through BDOS function 10, so the CCP marks
its own call. With no chained piece and no startup line left, the CCP reads a
command line, and before the call of function 10 it sets the byte `HFLAG` to
`FFh` (`src/cpm/ccp.asm:91-103`, `src/ram.asm:147`). Function 10 ends at
`LINDONE`, after Return, after a line feed or when the buffer is full. There it
reads `HFLAG`, clears it and calls `HSTORE` if the flag was set and the line has
at least one character (`src/cpm/bdos.asm:424-437`).

When a program calls function 10 itself, `HFLAG` is clear. `LINDONE` cleared it
after the CCP's line (`src/cpm/bdos.asm:433-435`), and for a line the CCP
abandoned at `^C`, every warm boot clears it too, with the rest of the RAM from
`CCPCLR` up (`src/boot.asm:90`, `src/boot.asm:271-275`). So only the lines typed
at the CCP's prompt go into the history.

A chained line (Chapter 11) goes in once, whole, with its `!` and `:`, so `^W`
brings all of it back. The CCP takes the line's pieces, and a command from
function 47, from `CMDTXT` with no call of function 10, and they add no entry
(`src/cpm/ccp.asm:91-92`). The lines of `STARTUP.CMD` don't go in either, because
the CCP takes each of them from `STLINE` in place of function 10
(`src/cpm/ccp.asm:94-95`). After cold boot the history is therefore empty.

`HSTORE` stores the line as function 10 returns it. The CCP turns small letters
into capitals later, a piece at a time (`src/cpm/ccp.asm:151-163`), so a recalled
line comes back as it was typed:

<!-- node tools/capture.mjs --board pico --screen con "@start "$'\x17' -->
```text
A>con
CON: CRT:
A>con
CON: CRT:
A>
```

Two kinds of line are not stored (`src/history.asm:104-130`). One that holds a
byte of 0 would end early in the ring, and `HSTORE` passes over it. One that is
the same as the newest line, of the same length, is left out, so a command
repeated at the prompt takes one entry. To find the newest line, `HSTORE` starts
from its terminator at `HHEAD − 1` and goes back to the line's first byte with
`HSTART`, which steps back until the byte before is 0 (`src/history.asm:44-51`).
The comparison goes on to the end of the new line, counting differences in `C`,
and the line counts as a repeat only if there were none and the newest line ends
at the same place.

Here `CON` was typed twice and `DIR *.CMD` once. The ring holds two lines, so
`^W` three times reached `CON` and stayed there:

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

A line to be stored is written from `HHEAD` with `HPUT`, then its 0, and `HHEAD`
moves past the 0 (`src/history.asm:133-144`). When the ring is full, the new
line overwrites the oldest lines, and the last one it reaches may be cut part
way through. The loop at `HSCLR` deals with that remnant by writing 0 forward
from the new `HHEAD`, up to and including the first byte that was 0 already
(`src/history.asm:145-151`). That byte is the terminator of the line partly
overwritten, so the remnant is gone, the byte at `HHEAD` is 0 and the ring holds
only whole lines. When nothing was overwritten, the byte at `HHEAD` was already
0, and the loop clears that one byte.

Each line takes its length and one byte more. The CCP's buffer holds up to 127
characters (`src/boot.asm:278-279`), so a line of that length takes 128 bytes of
the ring, half of it, and short commands such as `DIR` take four bytes each.

## ^W and ^N in function 10

Function 10 passes `^W` and `^N`, codes 23 and 14 (`src/cpm/bdos.asm:41-42`), to
`LINHIST` (`src/cpm/bdos.asm:284-287`). With `HFLAG` clear, in a program's call,
`LINHIST` sends the code on as an ordinary character into the buffer, as CP/M
2.2's function 10 does (`src/cpm/bdos.asm:315-318`). With `HFLAG` set, it calls
`HREC` (`src/cpm/bdos.asm:319`).

`HPOS` records the line shown, as the offset of its terminator
(`src/ram.asm:148`). Each call of function 10 starts with `HPOS` equal to
`HHEAD`, the empty entry, which means no line is shown yet
(`src/cpm/bdos.asm:249-250`). `HREC` works from `HPOS`
(`src/history.asm:53-102`):

- For `^W` it steps back to the first byte of the shown entry with `HSTART`.
  The byte before that is the terminator of the entry before, and the byte
  before that terminator is that entry's last character. If that character is
  0, the entry before is empty. The walk has reached the oldest line, and
  `HREC` returns with the line as it is (`src/history.asm:62-68`). Otherwise
  the entry before's terminator becomes `HPOS`.
- For `^N` with no line shown, `HPOS` equal to `HHEAD`, `HREC` returns at once
  (`src/history.asm:70-72`). Otherwise it steps forward to the next byte of 0,
  the terminator of the entry after, which becomes `HPOS`
  (`src/history.asm:73-76`). After the newest line that next 0 is the one at
  `HHEAD`, so the entry shown is the empty one and the line becomes empty.

To show the entry, `HREC` erases what is in the buffer with `LINERASE`, the
routine behind `^X`, which takes the characters off one at a time and erases
each on the console (`src/cpm/bdos.asm:411-422`). `HREC` then copies the entry's
bytes into the buffer with `HGET`, counting and echoing each one, as if it had
been typed, up to the buffer's maximum (`src/history.asm:83-102`). Function 10
then goes on reading keys, and the recalled characters are edited like typed
ones.

## Warm boot and reset

A warm boot leaves the history as it was. Nothing in the warm boot path writes
to EXPAND 1's page at `BD00h`, and `HHEAD` is in the part of the workspace above
the RAM BIOS table at `BF00h`, outside the RAM that `CPMINIT` clears
(`src/boot.asm:81-97`, `src/boot.asm:271-275`, `src/ram.asm:196`,
`src/ram.asm:225`). A program's exit, a `^C` at the prompt and BDOS function 0
all keep it. Here `^C` at the prompt was followed by `^W`:

<!-- node tools/capture.mjs CON "^C" "@start "$'\x17' -->
```text
A>CON
CON: TTY:
A>^C
A>CON
CON: TTY:
A>
```

A reset clears it. Cold boot clears the resident workspace, `HHEAD` with it
(`src/boot.asm:34-38`), and `MEMINIT` fills all of EXPAND 1 with 0 before it
marks the cache's lines empty (`src/boot.asm:156-169`). The page at `BD00h` is
then all zeros, `HHEAD` is 0 and the byte before it, at offset `FFh`, is 0, so
the ring is empty and still kept as `HSTORE` and `HREC` require. This holds for
a recognised reset too, the one that keeps the selected volumes, since only the
drive table is carried across it (`src/boot.asm:147-151`). After the reset in
this run, `^W` and Return gave an empty line:

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
