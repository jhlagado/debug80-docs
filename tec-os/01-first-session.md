---
title: First session
parent: TEC-OS
nav_order: 1
nav_group: "Using the machine"
---

# 1. First session

<!-- Source contracts inspected at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe, tested source 8b8664a.
     ROM SHA-256 fa63989b65d1e7e7a07f45e2a2b33e52f785d74216a3fde38af86b2d913f302d.
     Cold 40-column TEC Compact / PICO record v3 evidence: attempt02,
     Origo e77c7ef0, Machine 1 phases 001–007. Scoped result review:
     Origo 4b5b5a50, reviews/book-opening-workflows.md.
     TAS.COM is Thorium dbee66a; exact tool/card hashes and excerpt boundaries
     are in 01-pass-record.md. No new execution occurred for this chapter.
     Whole batch FAILED later; no advanced-service, physical, browser or audio
     acceptance.
     Keyboard correction/recall and failure advice are source-backed actions,
     not additional captured workflows. Historical material keeps its pins
     in the pass record. No final integration or publication claim.
     Release-card text: the nine starter files are those of TEC-OS
     755636b130241173c5c30a0be8fe6b79cf2fee37 tools/media.mjs and
     test/starter.test.mjs. The DIR excerpt below keeps the six-file card
     of attempt02; no nine-file DIR capture is claimed. -->

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

<!-- attempt02 Machine 1, 001-SAMPLE-cold.json, screen rows 1–8 (one-based).
     Initial blank row retained; unused blank rows 9–24 omitted. -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>GLCD.SVC

A>
```

A *volume* is a disk's worth of files on the card. SYSTEM is assigned to drive
A and WORK to drive B. The letter before `>` identifies the *current drive*,
the one used when you name a file without a drive letter. At `A>` you are
working on SYSTEM. The prompt is where you type a command.

The `GLCD.SVC` line was automatic. It came from the card's startup file.
The PICO9918 is already the console, the screen and keyboard used for commands,
so this startup line leaves it selected. You begin typing at the final `A>`.
The separate 20 × 4 LCD also shows the system name and assigned drives.

## Files at the prompt

`DIR` lists the files on the current drive. You type the letters after the
prompt and press Return. The prompt itself is already on the screen and is
not part of the command. In the same session the listing was:

<!-- attempt02 Machine 1, 002-opening-dir.json, screen rows 8–12.
     Earlier boot rows omitted; unused rows below the prompt omitted. -->
```text
A>DIR
MOUNT.COM    GLCD.SVC     STARTUP.CMD
TED.COM      SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

That listing is from an earlier starter card with six files. The release
card also holds TIMES.BAS, BAZA.COM and BAZA.RTL, so its listing has nine
names and its last line reports nine files.

Each name has up to eight characters followed by a type of up to three
characters. A full stop separates the two when you type a name. In
`SAMPLE.ASM`, SAMPLE is the name and ASM is the type. The `.ASM` file holds
source text. A `.COM` file holds a program that TEC-OS can run.

`TAS` is the assembler supplied on the card. It turns source text into a
program. `TED` is the supplied text editor and `MOUNT` manages volumes.
`BAZA` is a BASIC compiler, which uses its library `BAZA.RTL`, and
`TIMES.BAS` is a BASIC program for it. The automatic display setup uses
`GLCD.SVC` and `STARTUP.CMD`. Leave them as supplied for this session.

The last line reports the number of files and the free space on A. That
space is in KiB, units of 1,024 bytes. The spelling `980K` is the listing's notation.
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
prompt, not inside an arbitrary program's own input.

A mistyped command can fail with a question mark after its name. The command
has then finished and the prompt is ready for a corrected line. `^C` has a
different use at an empty prompt, described at the end of this session.

## Drive A and drive B

A drive letter followed by a colon changes the current drive. `B:` selects
WORK and `A:` returns to SYSTEM. The next excerpt continues after the listing:

<!-- attempt02 Machine 1, 004-opening-system.json, screen rows 12–14.
     Earlier boot/listing rows omitted; no commands omitted within the excerpt. -->
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

<!-- attempt02 Machine 1, 005-opening-direct-build.json, screen rows 14–17.
     Earlier commands omitted; build response and blank row retained. -->
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

<!-- attempt02 Machine 1, 006-opening-direct-run.json, screen rows 17–22.
     Earlier commands omitted; response and blank row retained. -->
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

## Saved work before reset or removal

A program can report that it has saved a file while some changes remain in
memory. WORK on B permits this delayed writing. Resetting the machine or
removing power discards changes that have not reached the card. The same
precaution is useful even when your current prompt is on A.

Finish the program and return to the prompt before ending the session. At an
empty prompt, Ctrl and C together, written `^C`, starts a *warm boot*: TEC-OS
attempts pending card writes and returns to the prompt. In the same SAMPLE
session the successful ending was:

<!-- attempt02 Machine 1, 007-opening-direct-flush.json, screen rows 22–23.
     Earlier commands omitted. One matrix Ctrl-C input, no extra Return. -->
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
