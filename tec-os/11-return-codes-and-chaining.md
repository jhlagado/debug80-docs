---
title: Return codes and chaining
parent: TEC-OS
nav_order: 11
nav_group: "Part I: Using and programming TEC-OS"
---

# 11. Return codes and chaining

<!-- Checked against TEC-OS 78127ec, with the ATOM assembler from the
     repository's `atom-z80` 0.3.7. The starter card's `TED.COM` is from Thorium
     128edb7, and its copy in `dist/files` has the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`. -->

`SHOW NOSUCH.TXT` in [Chapter 7](07-first-program.md) printed `No such file`
and, as far as the CCP could tell, succeeded. A program reports failure
through a *return code*, which the CCP tests for a `:` command on the same
line. A program can also end by handing the CCP its next command. Both come
from CP/M 3, and [Chapter 21](21-chaining-inside.md) describes the code
behind them.

## The return code

Success and failure are one 16-bit number, the program return code of CP/M 3.
BDOS function 108 sets and reads it, and the CCP tests it for a `:` piece,
as [Chapter 3](03-command-line.md) describes. The code is a failure when it
is from `FF00h` to `FFFEh`, and any other value is a success. A call with
`DE` set to `FFFFh` returns the code in `HL`, and a call with any other `DE`
sets the code to it. `FFFFh` itself can't be set, and it counts as a success.

The CCP sets the code to 0 as it takes each piece, after testing a `:` and
before it searches for the command. A program that reads the code when it
starts therefore always finds 0. A built-in that succeeds leaves the code at
0, and so does a program that never calls function 108. An ordinary CP/M 2.2
program therefore always succeeds.

The CCP sets the code to `FF00h` when a command fails at the CCP. That covers
a command that isn't found, a program that won't load and a service that
won't install. It also covers every built-in that prints `NAME?`, `NO FILE`,
`FILE EXISTS`, `NO SPACE` or one of `COPY`'s messages. An `ERA *.*` answered
with `N` erases nothing and is a success.

## A program that sets the code

A program sets the code to report on its own work. `EXISTS` fails when the
file named on its command line isn't there:

```asm
; EXISTS: a failure, return code FF00h, when the file named on the command
; line isn't there.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,$005C        ; the FCB the CCP filled from the tail
        LD      C,15            ; BDOS function 15: open the file
        CALL    BDOS
        INC     A               ; A = FFh: no such file
        RET     NZ              ; it is there: the code stays 0
        LD      DE,$FF00        ; a failure
        LD      C,108           ; BDOS function 108: set the return code
        CALL    BDOS
        RET
```

Function 15 opens the file whose FCB is at `DE`, as Chapter 7 describes. It
returns `FFh` in `A` when there is no such file. `EXISTS` prints nothing,
and its result is the code. These commands assemble it and `RUN`, the
program of a later section. They put both on drive B of a copy of the
starter card:

```sh
npx atom exists.asm exists.com
npx atom run.asm run.com
cp dist/starter.img chain.img
node tools/tecvol.mjs put chain.img B exists.com
node tools/tecvol.mjs put chain.img B run.com
```

`EXISTS NOTES.TXT!:TYPE NOTES.TXT` then types `NOTES.TXT` only if it is
there. Here the line runs once before `NOTES.TXT` is made and once after:

<!-- node tools/capture.mjs --card chain.img B: "EXISTS NOTES.TXT!:TYPE NOTES.TXT!DIR" "COPY A:STARTUP.CMD NOTES.TXT" "EXISTS NOTES.TXT!:TYPE NOTES.TXT!DIR" -->
```text
A>B:
B>EXISTS NOTES.TXT!:TYPE NOTES.TXT!DIR

B>:TYPE NOTES.TXT
B>COPY A:STARTUP.CMD NOTES.TXT
COPIED 0001

B>EXISTS NOTES.TXT!:TYPE NOTES.TXT!DIR

B>:TYPE NOTES.TXT
GLCD.SVC

B>DIR
EXISTS.COM   RUN.COM      NOTES.TXT   
3 files, 8164K free
B>
```

The blank line after each `EXISTS` is the CCP's, which starts a new line
after every program. The first time, `EXISTS` failed. `:TYPE NOTES.TXT` and
the `DIR` after it were dropped. The second time both ran.

A piece without `:` runs whatever the command before it returned, so a
failure stops the line only at a piece that starts with `:`:

<!-- node tools/capture.mjs --card chain.img B: "EXISTS NONE.TXT!DIR" "EXISTS NONE.TXT" ":DIR" "USER 0" ":DIR" -->
```text
A>B:
B>EXISTS NONE.TXT!DIR

B>DIR
EXISTS.COM   RUN.COM     
2 files, 8168K free
B>EXISTS NONE.TXT

B>:DIR
B>USER 0
B>:DIR
EXISTS.COM   RUN.COM     
2 files, 8168K free
B>
```

The `:DIR` typed after the failure ran nothing, because the code was still
`FF00h` from `EXISTS`. `USER 0`, a built-in that succeeded, set the code back
to 0, and the second `:DIR` ran.

## The rule a program follows

The CCP can't read a program's messages. A program that prints its own error
message and returns has therefore succeeded, unless it set the code. `SHOW`
is such a program, and a `:` piece after `SHOW NOSUCH.TXT` runs. A program
that reports a failure in words sets the code to `FF00h` as well. A `:`
piece after it then matches what it said.

A BDOS error ends a program with the rest of its line, as Chapter 3 shows.
A program that asked for errors back with BDOS function 45 gets each as a
return value instead. The line then goes on. Such a program sets the code
itself when the error is a failure of its work.

## A program that starts another

A program can end by giving the CCP a command line to run next, with BDOS
function 47. CP/M 3 calls this *chain to program*. The program puts the
line in memory, ended by a 0 byte. It sets the DMA address (Chapter 7) to
the line with function 26 and calls function 47. When the line is accepted
the call doesn't return. TEC-OS copies the line and ends the program with a
warm boot. The CCP then runs the line next, in place of whatever was left of
the line the program came from. The warm boot writes the cache's changes to
the card first, so what the program wrote is on the card before the chained
command runs. `TED`'s `^T` keys end this way. That is how `^T B` saves the
file and then runs `TAS` on it.

`RUN` ends by running the rest of its own command line as a command:

```asm
; RUN: end by running the rest of the command line as a command.
BDOS    EQU     $0005

        ORG     $0100
        LD      DE,$0081        ; the command tail, ended by a 0
        LD      C,26            ; BDOS function 26: set the DMA address
        CALL    BDOS
        LD      C,47            ; BDOS function 47: chain to the command
        CALL    BDOS
        LD      DE,NOTRUN       ; back here only if it was rejected
        LD      C,9
        CALL    BDOS
        RET
NOTRUN: DB      "Not run",13,10,"$"
```

The CCP puts a 0 after the command tail at `0081h`, so the tail is a line
ready for function 47. The tail starts with the space before its first word,
which the CCP passes over, and `RUN DIR` runs `DIR`. A line from function 47
takes the place of what was left of the line. In `RUN A:MOUNT!DIR` the `DIR`
therefore never runs:

<!-- node tools/capture.mjs --card chain.img B: "RUN DIR" "RUN A:MOUNT!DIR" "RUN NOSUCH!DIR" "RUN" -->
```text
A>B:
B>RUN DIR

B>DIR
EXISTS.COM   RUN.COM     
2 files, 8168K free
B>RUN A:MOUNT!DIR

B>A:MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>RUN NOSUCH!DIR

B>NOSUCH
NOSUCH?

B>RUN

B>
```

The chained command is echoed after the prompt, as a piece is. A command
from function 47 that isn't found, or doesn't load, fails as a typed one
does, with its name and a question mark. `RUN` alone chains an empty line.
That ends the program, runs nothing, and the prompt comes back.

The line may be up to 127 characters. It may hold `!` and `:`, which the CCP
treats as in a typed line, and a `:` at its start tests the code the program
set before the call. The line is copied as soon as the function is called.
It may therefore be anywhere in memory, even where the next program loads.
CP/M 3's function 47 also takes register `E`, which TEC-OS ignores. The
chained command runs on the drive and in the user area held in the byte at
`0004h`, as any command after a program's end does.

Function 47 rejects a line with no 0 in its first 128 bytes, or with a
carriage return or a line feed before the 0. It then returns with `A = FFh`,
the program goes on and the line it came from is unchanged. In `RUN` the
message `Not run` would follow, but a tail can hold neither character, so
`RUN` itself never prints it.

A call of function 47 is a warm boot wherever it is made. A service's `INIT`
or `REMOVE` may call it too, and [Chapter 12](12-writing-services.md) says
what that does to the service.

## Chaining from the startup file

A line of `STARTUP.CMD` can hold `!` and `:`, as [Chapter 6](06-startup-file.md)
describes, and a program started from such a line can chain. The chained
line runs before the file's next line. The file's order therefore holds,
whatever a program chains.

The code is left where the file's last command left it. A `:` at the start
of the first line you type therefore tests the file's last command. On this
card the file ends in a command that isn't there:

```sh
printf 'B:RUN A:MOUNT\nNOSUCH\n' > startup.cmd
cp chain.img chain2.img
node tools/tecvol.mjs put chain2.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card chain2.img ":DIR A:*.CMD" "DIR A:*.CMD" -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>B:RUN A:MOUNT

A>A:MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>NOSUCH
NOSUCH?

A>:DIR A:*.CMD
A>DIR A:*.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

`A:MOUNT` ran before `NOSUCH`, the file's second line. The `:DIR` typed at
the first prompt ran nothing, because `NOSUCH` had left the code at `FF00h`.
The `DIR` without `:` ran. One failure leaves the code at 0: a startup line
whose service finds its device absent, as Chapter 6 explains. A `:` after
that line runs.
