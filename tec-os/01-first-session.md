---
title: First session
parent: TEC-OS
nav_order: 1
nav_group: "Using the machine"
---

# 1. First session

<!-- Checked against TEC-OS e59e8c40ff26ac0f3c98dec0549d43988fe3c81c (main),
     ROM SHA-256 43ac0f18…, on its starter card, the one card the web page
     runs too (tools/media.mjs:200-231, tools/lib/starter.mjs:10-22,
     test/starter.test.mjs:48-82; Origo KD-278, KD-302). The screen
     excerpts are captures at fdd9e5b: node tools/capture.mjs --board pico
     --screen DIR B: A: "TAS SAMPLE" SAMPLE, the rows each comment names. The ^C excerpt is the same command's serial capture, node
     tools/capture.mjs ^C, since the capture tool cannot send ^C as a
     matrix key; the text is the console's either way. SHELL.SVC and the
     recall keys follow docs/shell.md:3-26 and :144-146. The steps in "More
     on the card" follow README.md:174-195, tools/media.mjs:241,
     test/programs/hello3.asm and test/starter.test.mjs:109-394; the LCD
     lines are HELLO3_ROWS (test/starter.test.mjs:219). With the Matrix
     switch on, MON3.SVC's key calls read the matrix, not the keypad
     (docs/mon3.md:245-247, :289-290, drivers/mon3api.asm:296-305). A:'s
     pending block follows docs/recovery.md:28-36 and :66-81. No capture of
     the MON-3 steps is claimed.
     The ROM, 43ac0f18…, is the same at e59e8c4 as at fdd9e5b, and e59e8c4's
     card differs only in TED.COM and HELLO3.ASM, so captures made at
     fdd9e5b that run neither stand for e59e8c4. -->

Your first session starts with the supplied files. You list them, change drive
and turn SAMPLE's source into a program you can run. Before finishing you write
any pending saved changes to the card.

## The prepared machine

The TEC-1G is already prepared with the TEC-OS ROM and starter card. It has the
required 32 KiB RAM chip in U9, the 4 MHz FAST setting and a PICO9918 display.
The Matrix switch enables the matrix keyboard. The keypad non-maskable
interrupt (NMI) jumper is off. The display uses the TEC Compact font at
40 columns and 24 rows. [Appendix G](appendix-g-tec-1g.md) gives the hardware
preparation details.

The screen examples below are from the host model, a software TEC-1G with that
configuration. They are text excerpts from its screen with unused blank rows
left out.

## The first prompt

Powering on starts TEC-OS. The screen names the system and the two volumes on
the starter card:

<!-- TEC-OS fdd9e5b: node tools/capture.mjs --board pico --screen,
     screen rows 1–10. Initial blank row retained; unused blank rows
     11–24 omitted. -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>SHELL.SVC

A>GLCD.SVC

A>
```

A *volume* is a disk's worth of files on the card. SYSTEM is assigned to drive
A and WORK to drive B. The letter before `>` identifies the *current drive*,
the one used when you name a file without a drive letter. At `A>` you are
working on SYSTEM. The prompt is where you type a command.

The `SHELL.SVC` and `GLCD.SVC` lines were automatic. They came from the
card's startup file. `SHELL.SVC` loads the *shell*, a program that stays in
memory and reads each command line you type. It supplies the recall keys
below, the pause in long listings and the `COPY` command of Chapter 4. The
PICO9918 is already the console, the screen and keyboard used for commands,
so the `GLCD.SVC` line leaves it selected. You begin typing at the final
`A>`. The separate 20 × 4 LCD also shows the system name and assigned drives.

## Files at the prompt

`DIR` lists the files on the current drive. You type the letters after the
prompt and press Return. The prompt itself is already on the screen and is
not part of the command. In the same session the listing was:

<!-- TEC-OS fdd9e5b: node tools/capture.mjs --board pico --screen DIR,
     screen rows 10–16. Earlier boot rows omitted; unused rows below the
     prompt omitted. -->
```text
A>DIR
MOUNT.COM    SHELL.SVC    GLCD.SVC
STARTUP.CMD  TED.COM      SAMPLE.ASM
TIMES.BAS    TAS.COM      BAZA.COM
BAZA.RTL     BOUNCE.BAS   DEMO.ASM
MON3.SVC     HELLO3.BIN   HELLO3.ASM
15 files, 912K free
A>
```

Each name has up to eight characters followed by a type of up to three
characters. A full stop separates the two when you type a name. In
`SAMPLE.ASM`, SAMPLE is the name and ASM is the type. The `.ASM` file holds
source text. A `.COM` file holds a program that TEC-OS can run.

`TAS` is the assembler supplied on the card. It turns source text into a
program. `TED` is the supplied text editor and `MOUNT` manages volumes.
`BAZA` is a BASIC compiler, which uses its library `BAZA.RTL`, and
`TIMES.BAS` is a BASIC program for it. The automatic display setup uses
`GLCD.SVC` and `STARTUP.CMD`, and `SHELL.SVC` is the shell. Leave them as
supplied for this session. The other files are demonstrations, which
[More on the card](#more-on-the-card) lists.

The last line reports the number of files and the free space on A. That
space is in KiB, units of 1,024 bytes. The spelling `912K` is the listing's notation.
The card's WORK volume on B starts empty and is available for your files.

## Correcting and recalling a line

You can change a command before Return runs it. Letter case does not change
the command: `dir` and `DIR` name the same operation. Shift supplies capital
letters and the symbols above the matrix keyboard's other keys. Each press
sends one character so holding a key does not repeat it.

Control keys use Ctrl with a letter. `^X` means hold Ctrl while pressing X.
These command-line actions let you correct a name or start again:

| Key | Action before Return |
| --- | --- |
| Backspace or `^H` | Removes the last character and erases it from the screen |
| `^X` | Erases the whole line being typed |
| `^U` | Discards the line, prints `#` and starts a new screen line |
| `^W` | Brings back the previous command and earlier ones on further presses |
| `^N` | Moves forward through recalled commands with an empty line past the newest |

Return runs a recalled line just as it runs a newly typed one. You can edit
its last characters first with Backspace or discard it with `^X`. Recall is
useful for another `DIR` after a file has changed. It applies at the command
prompt, not inside an arbitrary program's own input. `^W` and `^N` belong to
the shell, which keeps the lines you type. Without the shell, as after the
startup bypass of Chapter 8, the other keys still work and recall does not.

A mistyped command can fail with a question mark after its name. The command
has then finished and the prompt is ready for a corrected line. `^C` has a
different use at an empty prompt, described at the end of this session.

## Drive A and drive B

A drive letter followed by a colon changes the current drive. `B:` selects
WORK and `A:` returns to SYSTEM. The next excerpt continues after the listing:

<!-- TEC-OS fdd9e5b: the same --screen run with B: and A: after DIR, their screen rows. -->
```text
A>B:
B>A:
A>
```

The current drive supplies the location for a plain file name. The files on A
remain there when the prompt is on B. Returning to A puts the supplied SAMPLE
source and assembler on the current drive for the build below.

## Supplied source and a running program

`SAMPLE.ASM` is already on A. `TAS SAMPLE` reads that source and writes the
program as `SAMPLE.COM`. You type SAMPLE without `.ASM` in the build
command because TAS supplies the file types. The assembler's completion
message gives the output file's name:

<!-- TEC-OS fdd9e5b: the same run, the rows of "TAS SAMPLE". -->
```text
A>TAS SAMPLE
SAMPLE.COM written

A>
```

The source and program are separate files. An edit to the source affects the
program only after another assembly. The `.ASM` file remains available to read
or edit after the build.

Typing `SAMPLE` now runs `SAMPLE.COM`. TEC-OS loads the program and starts it.
The program prints its greeting and screen size then returns to the prompt:

<!-- TEC-OS fdd9e5b: the same run, the rows of SAMPLE, the screen's last. -->
```text
A>SAMPLE
Hello from TEC-OS.
Screen: 40 by 24
Back to the prompt.

A>
```

The dimensions are 40 columns by 24 rows, matching this console. On the
separate 20 × 4 LCD SAMPLE writes `Hello from SAMPLE` and its digit output is
`123456`. The source also includes a short speaker tone.

The new `A>` means the program has finished and you can type another command.
The same prompt is also the place to finish the session safely.

## More on the card

The other files on A are programs to try in the same way, each with a
command or two at `A>`:

| Commands | Result |
| --- | --- |
| `TAS DEMO`, then `DEMO` | Builds and runs a tour of the hardware on the LCD, the digits, the 8 × 8 LEDs and the PICO9918, until you press a key. [Chapter 12](12-use-the-boards-devices.md) describes it |
| `BAZA BOUNCE`, then `BOUNCE` | Compiles and runs a sprite game on the PICO9918. Tap W, A, S and D, or the arrow keys, to steer and Q to quit. [Chapter 3](03-build-a-basic-program.md) describes it |

`TED DEMO.ASM` and `TED BOUNCE.BAS` open those sources. BOUNCE.BAS's
longest line is 79 columns wide, so at 40 columns TED scrolls sideways to
show the rest of a line. After `CON PICO 80` it shows every line whole, and
`CON PICO 40` returns to 40 columns.
[Chapter 7](07-choose-a-console.md) explains the widths.

`MON3.SVC` runs programs written for MON-3, the TEC-1G's own monitor.
Typing `MON3.SVC` installs it and gives its prompt, `MON3>`. There
`LOAD HELLO3.BIN` loads the supplied MON-3 program and `GO` runs it. HELLO3
writes four lines on the 20 × 4 LCD through MON-3's calls, then beeps:

<!-- TEC-OS e59e8c4 test/starter.test.mjs:219, the LCD rows the host-model
     test checks, trailing spaces removed. Not a separate capture. -->
```text
MON-3 ON TEC-OS
LCD BY RST 10H
DIGITS BY RST 20H
KEY BEEPS, AD QUITS
```

It then counts on the digits. Another key beeps and shows its code on the
right two digits. With the matrix keyboard enabled, as here, the
service reads the matrix and not the keypad, so Esc on the matrix keyboard
ends the program and returns to `MON3>`. With the Matrix switch off, AD on
the keypad does the same. `EXIT` returns to `A>`. `HELLO3.ASM` is the
program's source, and `TAS HELLO3 HELLO3.BIN` builds it.
[Chapter 5](05-drives-and-user-areas.md) explains the service and what it
keeps in memory.

## Saved work before reset or removal

A program can report that it has saved a file while some changes remain in
memory. WORK on B permits this delayed writing. Resetting the machine or
removing power discards changes that have not reached the card. On A a
program's writes into one 512-byte block of the card wait in memory until
the program closes the file, uses the directory, writes another block,
reads the console or ends. The prompt's own console read writes that block,
so the precaution below is the same on A.

Finish the program and return to the prompt before ending the session. At an
empty prompt, Ctrl and C together, written `^C`, starts a *warm boot*: TEC-OS
attempts pending card writes and returns to the prompt. A successful ending looks like this:

<!-- TEC-OS fdd9e5b: node tools/capture.mjs ^C, the serial console's text. -->
```text
A>^C
A>
```

If a line is partly typed or recalled, `^X` erases it first. `^C` is ignored
while that line still contains characters. You do not press Return after the
empty-prompt `^C` action. Wait for the new prompt before switching off,
pressing reset or removing the card.

A `Write lost` message means that some pending changes could not be written.
The new prompt after that message does not establish successful preservation.
Those failed changes have been dropped so another `^C` cannot recover them.
Keep a separate copy of valuable work. [Chapter 6](06-cards-on-the-pc.md)
explains card copies and recovery and
[Appendix D](appendix-d-error-messages.md) explains the failure messages.

Only a successful completion brings pending saved changes up to date on the
card. Save the file and exit an editor normally before this step. `^C` cannot
preserve edits that exist only inside the editor.

The card must be out of the TEC-1G before you change it on a PC. After putting
it back, press reset before using it again.
