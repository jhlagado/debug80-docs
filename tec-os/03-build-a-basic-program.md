---
title: Build a BASIC program
parent: TEC-OS
nav_order: 3
nav_group: "Using the machine"
---

# 3. Build a BASIC program

<!-- Source and test contracts read at TEC-OS
     55114e4dfb234c81da73aea7e2e2ccaaf873b80e, with
     programs/TIMES.BAS, tools/media.mjs, docs/compatibility.md (TED and
     BAZA rows), test/times.test.mjs, test/ted-baza.test.mjs and
     test/starter.test.mjs.
     TED.COM Thorium b69d544, SHA-256 4f622390…; BAZA.COM and BAZA.RTL
     Baza ab4d173, SHA-256 4e0fee6a… (17,536 bytes) and 14d7fd11…
     (12,032 bytes), as test/inputs.json pins. TIMES.COM built with them
     is 9,600 bytes (test/lib/inputs.mjs:21-22).
     Baza README, docs/language.md, docs/call.md, docs/speed.md, docs/mbasic.md,
     src/lex.asm and examples/BOUNCE.BAS at ab4d173; Thorium README at
     b69d544.
     The TIMES screen below is the screen test/times.test.mjs:25-40 and
     :101-108 checks on the host model at 40 columns. It is not a separate
     capture. The COPY step follows Chapter 4 and src/cpm/ccpmut.asm; the
     ^C step follows the card's instruction (tools/media.mjs:261).
     No new execution occurred for this chapter, and no BAZA or
     TED BASIC run on a physical TEC-1G is recorded. -->

The starter card holds a short program in BASIC, TIMES.BAS, beside SAMPLE's
assembly source. You compile it with BAZA and run it. Then you edit and build
it in TED with the same keys that Chapter 2 used for BANNER.

The results described here are from the host model, the software TEC-1G used
for Chapters 1 and 2. A run of BAZA and TED's BASIC keys on a physical TEC-1G
has still to be recorded.

## The BASIC source

TIMES.BAS is on A with the other supplied files. `TYPE TIMES.BAS` prints it
at the `A>` prompt. Chapter 4 explains `TYPE` and its pager. The complete
file is:

<!-- TEC-OS 55114e4 programs/TIMES.BAS, lines 1-22, complete. The starter
     card stores it with CRLF line ends and a final ^Z (tools/media.mjs). -->
```text
10 rem times.bas, a first basic program
20 rem build it with baza times,
30 rem then type times to run it.
40 print "HELLO FROM BASIC ON TEC-OS."
50 input "WHAT IS YOUR NAME"; n$
60 print "HI, "; n$; "."
70 input "PICK A NUMBER, 1 TO 12"; n
80 if n < 1 or n > 12 then 100
90 if n = int(n) then 120
100 print "PLEASE PICK 1 TO 12."
110 goto 70
120 print "THE"; n; "TIMES TABLE:"
130 t = 0
140 for i = 1 to 12
150 p = i * n
160 print i; tab(4); "X"; n; tab(9); "="; p
170 t = t + p
180 next i
190 print "THEY ADD UP TO"; t
200 print "THAT IS"; t / 12; "ON AVERAGE."
210 print "GOODBYE, "; n$; "!"
220 end
```

Each line starts with a line number, and the numbers ascend through the file.
`rem` lines are remarks for you to read. `print` writes text and numbers,
`input` prints its question and reads your answer into a variable, `n$` for
the name and `n` for the number. Lines 80 and 90 send any answer outside 1 to
12, or with a fraction, to line 100, which asks again. The `for` and `next`
pair repeats lines 150 to 170 for each value of `i` from 1 to 12, printing
one row of the table and adding it to the total `t`. `tab` moves the printing
position to a column so the rows line up.

The program is in lower case with spaces between its words, and its quoted
text is in capitals. Outside quotes, `rem` remarks and `data` items, BAZA
folds letters to capitals and ignores spaces and tabs, so `print` and
`PRINT` are the same keyword and `n<1` and `n < 1` the same comparison. The
bytes inside quotes are kept as written, which is why the program's output
is in capitals (`Baza ab4d173:docs/language.md:19`). The lexer does the
folding and keeps quotes, remarks and `data` items as they are
(`Baza ab4d173:src/lex.asm:17-19`). Commands typed at the prompt, such as
`BAZA TIMES`, are written in capitals in this book, though the command
processor also accepts them in lower case. The host-model test types
`baza times` (`test/times.test.mjs:79`).

## A compiler and its library

BAZA is a compiler for classic Microsoft BASIC. It reads the whole source and
writes a CP/M program, so `BAZA TIMES` turns TIMES.BAS into TIMES.COM. You
then run TIMES.COM as you ran SAMPLE.COM, and it needs neither the compiler
nor its library on the card. BAZA has no interactive commands such as `list`
or `run`: you edit the source as a text file and compile it again. A line
number that repeats or goes backwards is an error, not a replacement line.
BAZA also takes a few additions from Microsoft's later BASIC-80 for CP/M:
`&H` hexadecimal constants and `HEX$`, `MOD` and `\` for the remainder and
whole-number division, `XOR`, `WAIT port, mask` to wait for a port's bit,
and `SWAP a, b` to exchange two variables
(`Baza ab4d173:docs/mbasic.md:10-12`, `:38-50`).

The compiler is two files on A. `BAZA.COM` is the program and `BAZA.RTL` is
its runtime library, the routines that BAZA copies into each program it
writes. BAZA reads `BAZA.RTL` from the current drive, or from the drive
`BAZA.COM` was loaded from when the current drive has none. A program on B
therefore compiles with the supplied files left on A.

## Compiling and running TIMES

At `A>`, `BAZA TIMES` reads TIMES.BAS and writes TIMES.COM on the same drive.
You type the name without a type, as with `TAS SAMPLE`. A successful compile
prints `COM written` before the prompt returns.

Typing `TIMES` runs the program. The screen below is the one the TEC-OS host
model test checks on the 40-column console, with the answers `TEC`, then 13,
then 7. Its starting `A>TIMES` line is omitted:

<!-- TEC-OS 55114e4 test/times.test.mjs:25-40, the asserted output, with
     the screen check at :106-108: answers TEC, 13 and 7, trailing spaces
     removed. Not a separate capture. -->
```text
HELLO FROM BASIC ON TEC-OS.
WHAT IS YOUR NAME? TEC
HI, TEC.
PICK A NUMBER, 1 TO 12? 13
PLEASE PICK 1 TO 12.
PICK A NUMBER, 1 TO 12? 7
THE 7 TIMES TABLE:
 1  X 7  = 7
 2  X 7  = 14
 3  X 7  = 21
 4  X 7  = 28
 5  X 7  = 35
 6  X 7  = 42
 7  X 7  = 49
 8  X 7  = 56
 9  X 7  = 63
 10 X 7  = 70
 11 X 7  = 77
 12 X 7  = 84
THEY ADD UP TO 546
THAT IS 45.5 ON AVERAGE.
GOODBYE, TEC!

A>
```

`input` adds the `? ` after each question. A number prints with a space on
each side, as in Microsoft BASIC, so `tab(4)` and `tab(9)` keep the `X` and
the `=` in their columns whatever the width of the numbers. The answer 13
takes the program back to line 70 for another number. After `end` the
program returns to the prompt.

## TIMES in TED

`TED TIMES.BAS` opens the source in TED. Editing is the same as for
BANNER.ASM: the arrow keys, Backspace, `^G`, `^S` to save and `^Q` to quit.
The `^T` keys take the tools from the type of the file being edited. For an
`.ASM` file they use TAS, and for a `.BAS` file they use BAZA:

| Keys | `.ASM` file | `.BAS` file |
| --- | --- | --- |
| `^T B` | Saves and builds with `TAS` | Saves and builds with `BAZA` |
| `^T R` | Builds with `TAS`, then runs the program | Builds with `BAZA`, then runs the program |
| `^T D` | Chains `TDB`, which the starter card does not contain, so the CCP prints `A:TDB?` and TED returns | Shows `No debugger` and runs nothing |

`^T B` on TIMES.BAS saves the file and runs `A:BAZA TIMES.BAS`, naming the
drive TED was loaded from. The console shows that line and `COM written`
before TED opens the source again at the place you left. After the first
good build the status row shows `THOR.PRJ: TIMES.BAS`: TED has recorded
TIMES.BAS in its project file as the source that the build keys use.

`^T R` builds the program again and runs TIMES. When the program ends TED
waits at `Press a key` so the output stays on the screen, and a key returns
you to the source at the same place. `^T D` leaves you in the editor with
`No debugger` on the status row. It runs nothing and writes no file.

From the `B>` prompt `^T B` builds a TIMES.BAS that you keep on B. TED and
BAZA are loaded from A and BAZA reads `BAZA.RTL` from A, its load drive.
TIMES.COM is written on B beside the source.

## A change of your own

Editing A:TIMES.BAS changes the supplied copy on SYSTEM. A copy on B, as in
Chapter 2, keeps your work on WORK and leaves the original as it was. At the
`A>` prompt, COPY makes the copy and prints `COPIED` with the number of
records. Chapter 4 explains its forms:

```text
A>COPY A:TIMES.BAS B:TIMES.BAS
```

`B:` makes WORK the current drive. At `B>`, `TED TIMES.BAS` opens your copy,
with TED loaded from A. Move to line 40, the file's fourth line, and change
the text between the quotes, keeping the line number, the `print` and both
quotes. For example:

```text
40 print "HELLO FROM MY FIRST BASIC."
```

`^S` saves the change and `^T B` compiles it with A's BAZA, writing
TIMES.COM on B. `^T R` builds and runs it in one step, and the program's
first line is then your new text. The host-model tests ran `^T R` with
TIMES.BAS on A and the build with it on B. Answer the questions and press a
key to return to TED.

`^Q` quits TED and returns to `B>`. Before a reset or power-off, `A:` returns
to drive A and `^C` at the empty `A>` prompt writes any pending changes to
the card, as the starter card's instructions say. Wait for the new prompt.
Chapter 1 explains why.

## A failed compile

A mistake in the source stops the compile. In the model test a line
`95 print (` was typed at the start of the file's line 10, between lines 90
and 100. The line number is in order but the expression after `print` is
unfinished. `^T B` saved the file and BAZA printed its message on the
console:

<!-- TEC-OS 55114e4 test/ted-baza.test.mjs:90-101, the asserted console
     text. Not a separate capture. -->
```text
A>A:BAZA TIMES.BAS
?SYNTAX ERROR IN 95
```

The message names BASIC line 95. TED then opened TIMES.BAS with the cursor on
the file's line 10, where the faulty line is, and the same message on its
status row. BAZA records the file's line for TED in `THOR.ERR` when TED's
session file `THOR.SES` is on the current drive, beside the source in these
examples. TED reads that record
and removes it. Correct or delete the line, then build again.

The failed compile left the earlier TIMES.COM exactly as it was. BAZA writes
a new program under a temporary name and gives it the name TIMES.COM only
when the compile succeeds. A failure therefore never leaves a partly
written TIMES.COM, and the previous one remains until the next successful
compile replaces it.

A failed compile also sets the failure return code, as a failed TAS build
does. Chapter 13 explains return codes and command chains. At the prompt you
can make running the program depend on the compile:

```text
A>BAZA TIMES!:TIMES
```

`!` starts a second command on the line and `:` runs it only if the command
before it succeeded. After a good compile TIMES runs. After a failed one the
`:TIMES` piece is skipped and the prompt returns, so a program left from an
earlier compile does not run in its place.

## Machine code from BASIC

BAZA has no graphics or sound statements. A program reaches the board's
devices by calling machine code: a ROM service, an entry of a service in
memory, or a routine at an address. `def call` gives the routine a name,
`call` runs it with the registers you list, and `reg` reads a register it
left afterwards (`Baza ab4d173:docs/call.md:1-6`). Chapter 12 describes the
ROM services from the assembly side.

BOUNCE.BAS, a sprite game on the card, does all its drawing this
way. Three of its lines show the pattern
(`Baza ab4d173:examples/BOUNCE.BAS:5`, `10`, `17`):

<!-- Baza ab4d173 examples/BOUNCE.BAS file lines 5, 10 and 17, as the
     card holds it (TEC-OS 55114e4 tools/media.mjs:229-232). -->
```text
50 def call vi = rom 3: def call bp = rom 4: def call ft = rom 15
100 call vi, b = 1
170 call ft: f = reg("HL"): call vw, hl = 256, de = f, bc = 768
```

A colon separates statements on one line.

`rom 3` names the ROM's video service, `rom 4` its tone service and
`rom 15` the font service. A name can also be a quoted service record with
a version and an entry number, found when the `def call` runs, or an
address (`Baza ab4d173:docs/call.md:16-26`). Each argument of `call` loads
one register: `a`, `b`, `c`, `d`, `e`, `h` and `l` take a byte and `bc`,
`de` and `hl` a word, or the address of a string variable's bytes. After
the call `reg("HL")` gives the value the routine left in HL, and
`reg("CY")` its carry. `call` raises no error itself, so a routine that
reports failure is checked with `reg`
(`Baza ab4d173:docs/call.md:51-64`, `Baza ab4d173:docs/call.md:72-82`).
Line 170 asks the font service for the
font's address and copies 768 bytes from it to the PICO9918's memory with
`vw`. Line 90 defines `vw` as `"PICO", 3, 10`, entry 10 of the PICO
console's record, which copies RAM to VRAM
(`Baza ab4d173:examples/BOUNCE.BAS:9`, `Baza ab4d173:docs/call.md:24-25`).

BAZA's ordinary numbers are 32-bit floating-point values, and their
arithmetic is slow on a Z80: an addition takes about 3,000 T-states, close
to a millisecond at 4 MHz. A name ending in `%`, such as `x%`, holds a whole
number from -32768 to 32767. BAZA compiles a simple statement as short
16-bit code when every operand in it is an integer variable, a whole number
from 0 to 32767, or an element of an integer array whose one subscript is
itself an integer variable or a whole number. The simple statements are a
copy, one addition, subtraction, multiplication or division, one `\`, `MOD`,
`AND`, `OR` or `XOR`, an `if` with one relation, and `for` and `next` on an
integer variable. A quotient is rounded down. Anything else, such as a
statement with more than one operator, still works, through the
floating-point routines (`Baza ab4d173:docs/speed.md:3-31`). BOUNCE moves
its balls this way, one step to a statement
(`Baza ab4d173:examples/BOUNCE.BAS:46-47`, `61-64`):

<!-- Baza ab4d173 examples/BOUNCE.BAS file lines 61 to 64. -->
```text
560 for i% = 0 to 3
570 x%(i%) = x%(i%) + dx%(i%)
572 if x%(i%) < 8 then 580
574 if x%(i%) <= 232 then 590
```

`varptr(v)` gives the address of a variable or an array element, which
`peek`, `poke` and `call` accept. A program can therefore `poke` a short
routine into a dimensioned array, which never moves, and name its address
with `def call` (`Baza ab4d173:docs/call.md:26-38`,
`Baza ab4d173:docs/call.md:91-99`).

While a program holds the PICO9918, TEC-OS hides the console. If the
program then stops on a run-time error, it gives the display back before
printing, so the message shows at the prompt. The host-model test checks
this with a program that claims the display and then divides by zero
(`Baza ab4d173:docs/call.md:66-70`, `test/times.test.mjs:195-218`).

On the card, `BAZA BOUNCE` compiles it and `BOUNCE` runs it on
the PICO9918, which it needs. Tap W, A, S and D to steer the ship. Q ends
the game, gives the display back as the console and prints the score at
`A>`. The host-model test checks each of these steps
(`tools/media.mjs:229-232`, `test/starter.test.mjs:112-169`).
