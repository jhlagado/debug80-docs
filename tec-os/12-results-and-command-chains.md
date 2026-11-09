---
title: Results and command chains
parent: TEC-OS
nav_order: 12
nav_group: "Writing programs"
---

# 12. Results and command chains

<!-- Source-only semantic check: TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe.
     Source proofs and old-unit dispositions: 12-pass-record.md. No current runtime check claimed.
     All retained output below is historical model evidence at TEC-OS 78127ec.
     The PC fixtures used atom-z80 0.3.7. Application provenance where relevant:
     TAS.COM, Thorium dbee66a, SHA-256
     45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2.
     TED.COM, Thorium 128edb7, SHA-256
     2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f. -->

You can join commands on a line and make later pieces depend on success.
Your programs report that result through a return code. They can also
supply a new command line when they end, as TED does for a build and
return to the editor.

## Several commands on one line

`!` separates commands. Each command after the first is echoed at its own
command prompt before it runs. This is TEC-OS's form of CP/M 3 command chaining.
CP/M 2.2 runs one command per line.

The following historical capture shows two commands on the first line.
The second line also contains empty pieces:

<!-- node tools/capture.mjs "DIR *.CMD!TYPE STARTUP.CMD" "mount!!  ! dir b:!" -->
```text
A>DIR *.CMD!TYPE STARTUP.CMD
STARTUP.CMD 
1 file, 980K free
A>TYPE STARTUP.CMD
GLCD.SVC

A>mount!!  ! dir b:!
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>dir b:
NO FILE
A>
```

A *piece* is the text bounded by `!` or the line's edges. The CCP passes over empty pieces and pieces of spaces.
`mount!!  ! dir b:!` therefore runs two commands. A line made entirely
of spaces and `!` runs nothing. The CCP echoes each later piece as typed
before converting its letters to capitals for execution. The lower-case
`dir b:` above therefore runs as `DIR B:`.

Each piece is a whole command whose drive or user-area selection applies
to the following pieces. Here `B:` selects drive B before `COPY` creates
`NOTES.TXT`:

<!-- node tools/capture.mjs "B:!COPY A:STARTUP.CMD NOTES.TXT!DIR" -->
```text
A>B:!COPY A:STARTUP.CMD NOTES.TXT!DIR
B>COPY A:STARTUP.CMD NOTES.TXT
COPIED 0001

B>DIR
NOTES.TXT   
1 file, 8172K free
B>
```

A program receives only the command tail of its own piece. The separator ends
that tail so `!` cannot occur inside a command or argument. The later pieces
remain available after the program's ordinary exit.

The complete line has the usual limit of 127 characters. For example,
32 three-letter commands and their 31 separators fit exactly. Command
history stores a typed line once, whole and as typed. `^W` recalls the
whole chain. A startup line can also contain several pieces, which run
before the file's next line.

## Conditional pieces

A piece beginning with `:` runs only after success. After failure it is
echoed but skipped, together with every remaining piece on that line.
The remaining pieces are dropped even when they have no `:` of their own:

<!-- node tools/capture.mjs "NOSUCH!:DIR *.CMD!DIR *.SVC" "DIR *.SVC!:DIR *.CMD" ":DIR *.CMD" -->
```text
A>NOSUCH!:DIR *.CMD!DIR *.SVC
NOSUCH?

A>:DIR *.CMD
A>DIR *.SVC!:DIR *.CMD
GLCD.SVC    
1 file, 980K free
A>:DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>:DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

`NOSUCH` failed so neither directory command after it ran. The next line began
with a successful `DIR *.SVC` so its `:DIR *.CMD` ran. The final `:DIR *.CMD`
was typed on a new line. It tested the last command of the previous line, which
also succeeded. A colon at the start of a fresh line still tests the previous
result.

A built-in command reports failure through its result as well as its
message. A program must set its own return code to report failure.
Printing an error message alone leaves a conditional piece free to run.
For example, `SHOW NOSUCH.TXT` from Chapter 9 prints `No such file` but
never sets a failure code. A `:` piece after it runs.

## The return code

BDOS function 108 reads or sets the 16-bit program return code, using the
CP/M 3 convention. Values from `FF00h` through `FFFEh` mean failure.
Every other value means success. With `DE = FFFFh`, the call reads the code
into `HL`. Any other value in `DE` sets the code. `FFFFh` itself cannot be
set because it selects the read operation, though the CCP treats that value
as success.

The CCP tests a leading `:` before clearing the code to 0 for the next
command. Your program therefore reads 0 at entry. A successful built-in
leaves 0, as does an ordinary CP/M 2.2 program that never calls function 108.
A reset also clears the code.

A command that fails in the CCP sets `FF00h`. That includes a missing
command, a failed program load and an unsuccessful service installation.
Built-in error messages include `NAME?`, `NO FILE`, `FILE EXISTS`, `NO SPACE`
and COPY's errors. Answering `N` to `ERA *.*` erases nothing
and counts as success. Startup's quiet device outcomes have a separate
rule described below.

## A program that reports failure

`EXISTS` reports whether its named file is present. It opens the default file
control block (FCB) at `005Ch`, using the file-call conventions from Chapter 9:

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

Function 15 returns `FFh` when there is no such file. `INC A` turns that value
into zero so `RET NZ` returns immediately when the file exists. Otherwise
`EXISTS` sets `FF00h` with function 108 before returning. It prints nothing in
either case.

The historical card for this example also contains `RUN`, whose complete
source appears below. Both sources were assembled on the PC with ATOM
0.3.7 and copied to drive B of a starter-card copy:

```sh
npx atom exists.asm exists.com
npx atom run.asm run.com
cp dist/starter.img chain.img
node tools/tecvol.mjs put chain.img B exists.com
node tools/tecvol.mjs put chain.img B run.com
```

`EXISTS NOTES.TXT!:TYPE NOTES.TXT` prints the file only when it is present.
This retained capture runs the longer chain before and after creating it:

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

The CCP prints a new line after each program, including the silent
`EXISTS`. On the first attempt its failure drops `:TYPE NOTES.TXT` and
`DIR`. After `COPY` makes the file, both pieces run.

A failure by itself does not drop an unconditional piece. This capture
also shows the result persisting into the next typed line:

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

`DIR` after `EXISTS NONE.TXT!` runs because it has no colon. The separate
`EXISTS NONE.TXT` then leaves `FF00h` so the first typed `:DIR` runs nothing.
`USER 0` succeeds and clears the result to 0. The second `:DIR` therefore lists
the files.

Your program should set a failure code when its work fails, including when
it prints an error message. Function 45 can select BDOS errors as return
values for your program to handle. The return code for the CCP remains
your responsibility. A returned BDOS error allows the program and its
chain to continue. In the default error mode,
a BDOS error ends the program and drops the remaining pieces.

## Ends that drop the chain

An ordinary `RET`, jump to `0000h` or call of BDOS function 0 leaves the
remaining pieces available after warm boot. These events drop them:

- A conditional piece tests a failure code.
- `^C` is typed while a line read with function 10 is empty, including at
  the CCP prompt. At that prompt there is already no remaining piece.
- `^C` ends a `^S` pause during a program's output.
- `^C` ends the `[more]` pause in a TYPE or DIR listing.
- A key ends a BDOS error in the default error mode.
- Warm boot reports `Write lost` after a failed cache flush.
- A reset clears the pending commands.

A reset starts the startup file again. After the other events the CCP takes
its next unread startup line or waits for typed input. Dropping the current
chain leaves any later startup lines available.

In this historical capture, drive C has no volume. The key `x` ends the
BDOS error and the `MOUNT` piece is dropped:

<!-- node tools/capture.mjs "@start DIR C:!MOUNT" "@key x" -->
```text
A>DIR C:!MOUNT

Bdos Err On C: Select
A>
```

Esc or `Q` at `[more]` stops only the listing. Its next piece still runs,
as after a listing that reaches its end. This differs from `^C`, which
drops the rest of the chain.

## A program that supplies the next command

An editor's build key must save the source, run the assembler and reopen
the editor. BDOS function 47 lets a program finish by supplying the next
command line. CP/M 3 calls it *chain to program*.

Your program places a zero-terminated line in memory and sets the DMA
address to it with function 26. It then calls function 47. An accepted
line is copied immediately and the call ends the program by warm boot.
The copied line replaces everything left of the original chain.
The call does not return on acceptance.

Warm boot flushes pending card writes before the next program loads.
A successful flush therefore puts your writes on the card first.
A failed flush drops the failed cache lines and prints `Write lost`.
It also cancels the chain, including a line accepted by function 47.
Acceptance of the line does not guarantee its execution.

`RUN` supplies the rest of its own command tail as the new command:

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

The CCP puts a zero after the tail at `0081h`. Its initial space is allowed and
the CCP passes over it so `RUN DIR` supplies ` DIR`. Function 26 takes the
tail's address, not the length byte at `0080h`.

The original line's later pieces lie outside that tail. In `RUN A:MOUNT!DIR`,
`RUN` supplies only ` A:MOUNT`. That replaces the old chain so its `DIR` is
gone:

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

The CCP echoes each supplied command after the prompt. A missing command
or one that cannot load fails as a typed command does, with its name and
a question mark. `RUN` alone supplies an empty line, which ends the program
and runs nothing before the next prompt.

A supplied line may contain up to 127 characters, including `!` and `:`.
A leading `:` tests the code your program set before calling function 47.
The immediate copy allows the line to occupy memory that the next program
will overwrite. TEC-OS ignores register `E`, which CP/M 3's function 47
also takes. The next command uses the drive and user area in `0004h`, as
after an ordinary program exit.

Function 47 rejects a line with no zero in its first 128 bytes. It also rejects
a carriage return or line feed before that zero. Rejection returns `A = FFh` and
leaves the original chain unchanged so your program can handle it. `RUN` would
print `Not run` on that path. A CCP-prepared tail has the required terminator
and contains neither CR nor LF. Its line always passes this validation.

A service's `INIT` or `REMOVE` can also call function 47. An accepted call
still causes warm boot. Chapter 13 explains the installation and removal
consequences. Chapter 21 explains how the command buffer survives warm boot
and how the CCP processes the copied line.

## TED's build and return

TED's `^T` prefix uses function 47 to end the current editor program and
run a command. For a build, its line invokes TAS and then TED again.
The editor's file and cursor position are saved for that new invocation.
The operational build and run keys from Chapter 2 are included here with
the other prefix commands:

| Keys | Effect |
| --- | --- |
| `^T B` | Saves the file and builds it with `TAS`. A failed build opens at the error |
| `^T R` | Builds the program as `^T B` does, then runs it |
| `^T D` | Runs the program under `TDB`, a debugger the starter card does not contain |
| `^T O` | Opens another file, named at a prompt |
| `^T F` | Opens the previous file again |

Chapter 10 explains the load-drive byte at `0050h`. TED uses that byte to
prefix the tools' names. With tools loaded from A and source on current
drive B, the build line invokes `A:TAS` and `A:TED`. The tools remain on A
and the source on B. The editor is a new program invocation each
time it returns through the CCP.

TAS writes a `.DBG` debug file beside the source and its `.COM` output.
For the historical `HELLO` example these are `HELLO.DBG` and `HELLO.COM`.
TED also keeps `THOR.PRJ` and `THOR.SES` beside the source in this setup.
After the first successful build and project-file update, `THOR.PRJ` names
the source for the build keys. `THOR.SES` records the file and editing position from the previous
exit. The full historical HELLO error, repair and run capture is retained
in Chapter 26, with its original recipe and application provenance.

## Chains in the startup file

A line of `STARTUP.CMD` can contain the same `!` and `:` pieces.
Its remaining pieces run before the file's next line. A program started by
startup can also call function 47. The supplied command runs before the
next startup line, subject to the same failed-flush cancellation.
A `^C` that ends a program or its input drops the current chain but leaves
the next startup line available.

Startup has a special success rule for absent devices. A service line that
reports its device absent passes quietly, with no failure message and a
success code. Display commands with nothing to do on that board can also
pass quietly. A following conditional piece therefore runs. Other failed
installations report failure and drop a following `:` piece.

These historical commands prepare two startup lines on a starter-card
copy. This `chain.img` is a separate fixture from the EXISTS/RUN card:

```sh
printf 'GLCD.SVC!:MOUNT\nNOSUCH.SVC!:MOUNT\n' > startup.cmd
cp dist/starter.img chain.img
node tools/tecvol.mjs put chain.img A startup.cmd --text
```

The capture uses the serial-only board:

<!-- node tools/capture.mjs --card chain.img -->
```text
A>GLCD.SVC!:MOUNT

A>:MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>NOSUCH.SVC!:MOUNT
NOSUCH.SVC?

A>:MOUNT
A>
```

`GLCD.SVC` reports an absent graphics LCD and passes quietly so its `:MOUNT`
runs. `NOSUCH.SVC` is missing from the card, which is an ordinary failure. Its
`:MOUNT` is echoed and dropped. Quiet absence applies to a startup line. Typed
at the prompt on this board, `GLCD.SVC` fails with `GLCD.SVC?`.

The last startup command also leaves its result for the first line you
type. This final historical fixture starts from the earlier EXISTS/RUN
`chain.img`. Recreating that card with the ATOM and copy commands above
puts `RUN.COM` back before preparing `chain2.img`:

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

`A:MOUNT`, supplied by `RUN`, finishes before the next startup line, `NOSUCH`.
That missing command leaves `FF00h` so the first typed `:DIR` runs nothing.
`DIR` without the colon runs. A quiet absent-device startup line would instead
leave success and allow the conditional command.

