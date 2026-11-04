---
title: Command history
parent: TEC-OS
nav_order: 22
nav_group: "Part II: Inside TEC-OS"
---

# 22. Command history

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, whose copy in `dist/files` has the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

The lines that `^W` brings back at the prompt live in one page of EXPAND 1, a
ring of 256 bytes at `BD00h`. The code that keeps the ring is in
`src/history.asm`, with a few lines in the BDOS's line input and the CCP. This
chapter follows a line into the ring and out again, then shows what a warm boot
and a reset leave of it.

## Recalling a line

`^W` at the prompt replaces the line typed so far with the newest line in the
history, echoed as if it had been typed. A second `^W` replaces that with the
line before. `^N` moves the other way, and one step past the newest line leaves
the line empty. A recalled line is the start of a new line, so backspace and
the other keys of BDOS function 10 edit it before Return runs it. The
[history section of Chapter 3](03-command-line.md#command-history) shows the
keys from the user's side. Here two lines were typed, then `^W`, `^W` and
Return. The screen shows the recalled `CON` after the prompt and its reply:

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
backspace for each character. The serial output would show those bytes, so the
transcripts in this chapter read the PICO9918's screen, where only the result
of the erasure shows. The capture's `@start` line types its keys and a Return
together, and `$'\x17'` is the shell's way of writing `^W`.

## The ring at BD00h

The history is the page at `BD00h` in EXPAND 1, `HRING` (`src/history.asm:14`).
[Chapter 14](14-memory-map.md#expand-1-and-the-no-stack-rule) lists EXPAND 1's other pages and
explains why no stack is in use while EXPAND 1 is in view. No BDOS function and
no numbered service reaches the page, so only the ROM's own code reads it.

Two routines read and write the ring a byte at a time. `HGET` returns the byte
at offset `L` in `A` and `HPUT` writes `A` there, with `H` holding the ring's
page, `BDh` (`src/history.asm:20-43`). Each saves the interrupt state and turns
interrupts off. It writes the latch with `LATEXP` added to TEC-OS's copy of it
at `0040h`, makes the one access and writes the latch back as it was. Interrupts
come on again only if they were on before.

The offset is `L` alone, so `INC L` from offset `FFh` reaches offset `00h` and
the page is a ring with no end. Each line is stored as its characters followed
by a byte of 0. The bytes are written forward from the offset in `HHEAD`, a
byte of the workspace in EXPAND 0 (`src/ram.asm:246-247`). After a line's 0,
`HHEAD` holds the offset of the byte that follows it.

A walk back through a ring needs a place to stop. The ring is therefore kept
with the byte at `HHEAD` always 0, and the byte before it 0 too, the newest
line's terminator (`src/history.asm:6-10`). A 0 that follows another 0 is an
empty entry, and the empty entry at `HHEAD` separates the newest line from the
oldest. A walk back from the newest line stops when it reaches an empty entry.
Everything else in this chapter rests on that rule.

## Storing a line

The CCP and programs both read lines through BDOS function 10, so the CCP marks
its own call. With no chained piece and no startup line left, the CCP reads a
command line. Before the call of function 10 it sets the byte `HFLAG` to `FFh`
(`src/cpm/ccp.asm:97-109`, `src/ram.asm:157`). Function 10 ends at `LINDONE`,
after Return, after a line feed or when the buffer is full. There it reads
`HFLAG` and clears it. It calls `HSTORE` if the flag was set and the line has
at least one character (`src/cpm/bdos.asm:481-494`).

When a program calls function 10 itself, `HFLAG` is clear. `LINDONE` cleared it
after the CCP's line. For a line the CCP abandoned at `^C`, every warm boot
clears it with the rest of the RAM from `CCPCLR` up (`src/boot.asm:103`,
`src/boot.asm:295-300`). So only the lines typed at the CCP's prompt go into
the history.

A chained line ([Chapter 21](21-chaining-inside.md)) goes in once, whole, with
its `!` and `:`, so `^W` brings all of it back. The CCP takes the line's pieces
from `CMDTXT` with no call of function 10, and a command from function 47 the
same way, so they add no entry (`src/cpm/ccp.asm:97-98`). The lines of
`STARTUP.CMD` add none either. The CCP takes each of them from `STLINE` in
place of function 10 (`src/cpm/ccp.asm:100-101`). After cold boot the history
is therefore empty until the first line is typed.

`HSTORE` stores the line as function 10 returns it. The CCP turns small letters
into capitals later, a piece at a time (`src/cpm/ccp.asm:158-170`), so a recalled
line comes back as it was typed:

<!-- node tools/capture.mjs --board pico --screen con "@start "$'\x17' -->
```text
A>con
CON: CRT:
A>con
CON: CRT:
A>
```

Two kinds of line are not stored (`src/history.asm:108-135`). One that holds a
byte of 0 would end early in the ring, and `HSTORE` passes over it. One that is
the same as the newest line, of the same length, is left out, so a repeated
command takes one entry. To find the newest line, `HSTORE` starts from its
terminator at `HHEAD − 1` and calls `HSTART`. `HSTART` steps back until the
byte before is 0, the line's first byte (`src/history.asm:45-53`). The
comparison then runs to the end of the new line and counts differences in `C`.
The line is a repeat only if there were none and the newest line ends at the
same place. Here `CON` was typed twice and `DIR *.CMD` once. The ring holds two
lines, so `^W` three times reached `CON` and stayed there:

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
moves past the 0 (`src/history.asm:138-149`). When the ring is full, the new
line overwrites the oldest entries, and the last one it reaches may be cut part
way through. The loop at `HSCLR` clears that remnant. It writes 0 forward from
the new `HHEAD`, up to and including the first byte that was 0 already
(`src/history.asm:150-156`). That byte is the terminator of the entry partly
overwritten. So the remnant is gone, the byte at `HHEAD` is 0 and the ring
holds only whole lines. When nothing was overwritten, the byte at `HHEAD` was
already 0 and the loop clears that one byte.

Each line takes its length and one byte more. The CCP's buffer holds up to 127
characters (`src/boot.asm:303-304`). A line of that length fills 128 bytes of
the ring, half of it, and a short command such as `DIR` fills four.

## ^W and ^N in function 10

Function 10 passes `^W` and `^N`, codes 23 and 14 (`src/cpm/bdos.asm:41-42`), to
`LINHIST` (`src/cpm/bdos.asm:322-325`). With `HFLAG` clear, in a program's call,
`LINHIST` sends the code on as an ordinary character into the buffer. That is
what CP/M 2.2's function 10 does with it (`src/cpm/bdos.asm:356-359`). With
`HFLAG` set, `LINHIST` calls `HREC` (`src/cpm/bdos.asm:360`).

`HPOS` records the line shown, as the offset of its terminator
(`src/ram.asm:158`). Each call of function 10 starts with `HPOS` equal to
`HHEAD`, the empty entry, which means no line is shown yet
(`src/cpm/bdos.asm:288-289`). `HREC` walks from `HPOS` (`src/history.asm:55-106`):

- For `^W` it steps back to the first byte of the shown entry with `HSTART`.
  The byte before that is the terminator of the entry before, and the byte
  before that terminator is that entry's last character. A 0 there means the
  entry before is empty. The walk has reached the oldest line, and `HREC`
  returns with the line as it is (`src/history.asm:66-72`). Otherwise the entry
  before's terminator becomes `HPOS`.
- For `^N` with no line shown, `HPOS` equal to `HHEAD`, `HREC` returns at once
  (`src/history.asm:74-76`). Otherwise it steps forward to the next byte of 0,
  the terminator of the entry after, which becomes `HPOS`
  (`src/history.asm:77-80`). After the newest line that next 0 is the byte at
  `HHEAD`, so the entry shown is the empty one and the line becomes empty.

To show the entry, `HREC` erases what is in the buffer with `LINERASE`, the
routine behind `^X`. `LINERASE` takes the characters off one at a time and
erases each on the console (`src/cpm/bdos.asm:464-475`). `HREC` then copies the
entry's bytes into the buffer with `HGET`, counting and echoing each one, up to
the buffer's maximum (`src/history.asm:87-106`). Function 10 then goes on
reading keys, and the recalled characters are edited like typed ones. At the
oldest line `^W` changes nothing, and with no line shown `^N` changes nothing.

## Warm boot and reset

A warm boot leaves the history as it was. Nothing in the warm boot path writes
to EXPAND 1's page at `BD00h` (`src/boot.asm:92-110`). `HHEAD` is in the part
of the workspace above the RAM BIOS table at `BF00h`, outside the RAM that
`CPMINIT` clears (`src/boot.asm:295-300`, `src/ram.asm:216`, `src/ram.asm:247`).
A program's exit, a `^C` at the prompt and BDOS function 0 all keep it. Here
`^C` at the prompt was followed by `^W`:

<!-- node tools/capture.mjs CON "^C" "@start "$'\x17' -->
```text
A>CON
CON: TTY:
A>^C
A>CON
CON: TTY:
A>
```

A reset clears the history. Cold boot clears the resident workspace, `HHEAD`
with it (`src/boot.asm:37-41`). `MEMINIT` then fills all of EXPAND 1 with 0
before it marks the cache's lines empty (`src/boot.asm:172-188`). The page at
`BD00h` is all zeros, `HHEAD` is 0 and the byte before it, at offset `FFh`, is
0. The ring is empty and still kept as `HSTORE` and `HREC` require. This holds
for a recognised reset too, the one that keeps the selected volumes, since only
the drive table is carried across it (`src/boot.asm:160-164`). After the reset
in this run, `^W` and Return gave an empty line:

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

That `^W` stepped back from `HHEAD` and read a 0 at once, the sign of the oldest
line. The line stayed empty and Return ran nothing.
