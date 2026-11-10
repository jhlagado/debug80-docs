---
title: Build a BASIC program
parent: TEC-OS
nav_order: 3
nav_group: "Using the machine"
---

# 3. Build a BASIC program

<!-- Source and test contracts read at TEC-OS
     755636b130241173c5c30a0be8fe6b79cf2fee37 (branch card-r1b), with
     programs/TIMES.BAS, tools/media.mjs, docs/compatibility.md (TED and
     BAZA rows), test/times.test.mjs and test/ted-baza.test.mjs.
     TED.COM Thorium 967678c, SHA-256 150a19bd…; BAZA.COM and BAZA.RTL
     Baza fbfedb6, SHA-256 725570a6… and 5854bfb6…, as test/inputs.json pins.
     Baza README at fbfedb6; Thorium README at 967678c (TED's language table).
     The TIMES screen below is the screen test/times.test.mjs:24-39 and
     :90-100 checks on the host model at 40 columns. It is not a separate
     capture. No new execution occurred for this chapter, and no BAZA or
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

<!-- TEC-OS 755636b programs/TIMES.BAS, lines 1-22, complete. The starter
     card stores it with CRLF line ends and a final ^Z (tools/media.mjs). -->
```text
10 REM TIMES.BAS, A FIRST BASIC PROGRAM
20 REM BUILD IT WITH BAZA TIMES,
30 REM THEN TYPE TIMES TO RUN IT.
40 PRINT "HELLO FROM BASIC ON TEC-OS."
50 INPUT "WHAT IS YOUR NAME";N$
60 PRINT "HI, ";N$;"."
70 INPUT "PICK A NUMBER, 1 TO 12";N
80 IF N<1 OR N>12 THEN 100
90 IF N=INT(N) THEN 120
100 PRINT "PLEASE PICK 1 TO 12."
110 GOTO 70
120 PRINT "THE";N;"TIMES TABLE:"
130 T=0
140 FOR I=1 TO 12
150 P=I*N
160 PRINT I;TAB(4);"X";N;TAB(9);"=";P
170 T=T+P
180 NEXT I
190 PRINT "THEY ADD UP TO";T
200 PRINT "THAT IS";T/12;"ON AVERAGE."
210 PRINT "GOODBYE, ";N$;"!"
220 END
```

Each line starts with a line number, and the numbers ascend through the file.
`REM` lines are remarks for you to read. `PRINT` writes text and numbers,
`INPUT` prints its question and reads your answer into a variable, `N$` for
the name and `N` for the number. Lines 80 and 90 send any answer outside 1 to
12, or with a fraction, to line 100, which asks again. The `FOR` and `NEXT`
pair repeats lines 150 to 170 for each value of `I` from 1 to 12, printing
one row of the table and adding it to the total `T`. `TAB` moves the printing
position to a column so the rows line up.

## A compiler and its library

BAZA is a compiler for classic Microsoft BASIC. It reads the whole source and
writes a CP/M program, so `BAZA TIMES` turns TIMES.BAS into TIMES.COM. You
then run TIMES.COM as you ran SAMPLE.COM, and it needs neither the compiler
nor its library on the card. BAZA has no interactive commands such as `LIST`
or `RUN`: you edit the source as a text file and compile it again. A line
number that repeats or goes backwards is an error, not a replacement line.

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

<!-- TEC-OS 755636b test/times.test.mjs:24-39, the asserted output, with
     the screen check at :95-97: answers TEC, 13 and 7, trailing spaces
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

`INPUT` adds the `? ` after each question. A number prints with a space on
each side, as in Microsoft BASIC, so `TAB(4)` and `TAB(9)` keep the `X` and
the `=` in their columns whatever the width of the numbers. The answer 13
takes the program back to line 70 for another number. After `END` the
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
| `^T D` | Runs `TDB`, a debugger the starter card does not contain | Shows `No debugger` and runs nothing |

`^T B` on TIMES.BAS saves the file and runs `A:BAZA TIMES.BAS`, naming the
drive TED was loaded from. The console shows that line and `COM written`
before TED opens the source again at the place you left. After the first
good build the status row shows `THOR.PRJ: TIMES.BAS`: TED has recorded
TIMES.BAS in its project file as the source that the build keys use.

`^T R` builds the program again and runs TIMES. When the program ends TED
waits at `Press a key` so the output stays on the screen, and a key returns
you to the source at the same place. `^T D` leaves you in the editor with
`No debugger` on the status row. It runs nothing and writes no file.

From the `B>` prompt the same keys work on a TIMES.BAS that you keep on B.
TED and BAZA are loaded from A and BAZA reads `BAZA.RTL` from A, its load
drive. TIMES.COM is written on B beside the source.

## A failed compile

A mistake in the source stops the compile. In the model test a line
`95 PRINT (` was typed at the start of the file's line 10, between lines 90
and 100. The line number is in order but the expression after `PRINT` is
unfinished. `^T B` saved the file and BAZA printed its message on the
console:

```text
A>A:BAZA TIMES.BAS
?SYNTAX ERROR IN 95
```

The message names BASIC line 95. TED then opened TIMES.BAS with the cursor on
the file's line 10, where the faulty line is, and the same message on its
status row. BAZA records the file's line for TED in `THOR.ERR`, beside the
source, when TED's session file `THOR.SES` is there. TED reads that record
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
