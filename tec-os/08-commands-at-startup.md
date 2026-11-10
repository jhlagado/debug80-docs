---
title: Commands at startup
parent: TEC-OS
nav_order: 8
nav_group: "Using the machine"
---

# 8. Commands at startup

<!-- Source mechanisms inspected by git text at TEC-OS
     a1023bd0cbb4879c37ae61e6f670b442e1e60abe. Source-only draft.
     All nine retained captures, their recipes and the six shell fences
     retain TEC-OS 78127ec. No capture or workflow was rerun.
     Historical 80-column starts remain evidence of their original runs.
     Current cold-default and host-preparation claims use the source above. -->

`A:STARTUP.CMD` holds commands you want to repeat after reset. TEC-OS runs
them before accepting a command from the keyboard. You can use it to select
your display width, load the graphics LCD driver or choose your starting
drive and user area.

## A short file of commands

Each line supplies a command. The file belongs in user area 0 of drive A.
You can use the text editing from Chapter 2 or the card tools from
[Chapter 6](06-cards-on-the-pc.md). The changes take effect at the next
reset. `TYPE A:STARTUP.CMD` lets you read back the saved text before that
reset while user area 0 is selected.

After saving on the board, exit the editor normally before resetting.
A successful exit flush puts pending changes on the card. `Write lost`
means that failed cached writes were dropped so the intended file may
be incomplete. Read back the file and correct it before relying on the
next startup. Reset does not finish pending writes.

The historical starter card contained this single line:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
GLCD.SVC

A>
```

`GLCD.SVC` is the resident graphics LCD service introduced in
[Chapter 5](05-drives-and-user-areas.md). The PICO9918 console is in ROM
and needs no service file. The effect of the GLCD line depends on which
console cold boot selected.

A startup line uses the same command syntax as a typed command. With an action
on each line, its completion is followed by the next command prompt and command.
Chapter 13 explains multiple commands and conditional execution.

The following historical recipe copies the starter card and replaces its
startup file with six lines. The `tecvol put` command replaces an existing
file of the same name. Its `--text` option converts each line ending to CR
and LF and appends the CP/M text-end marker, `^Z`:

```sh
printf 'B:\nUSER 3\nmount\nDIR\nNOSUCH\nUSER 0\n' > startup.cmd
cp dist/starter.img lines.img
node tools/tecvol.mjs put lines.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card lines.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>B:
B>USER 3
3B>mount
00 SYSTEM      G1M A:
01 WORK        G8M B:

3B>DIR
NO FILE
3B>NOSUCH
NOSUCH?

3B>USER 0
B>
```

The CCP echoes each line as it appears in the file before running it.
That is why `mount` is lowercase in this capture. `B:` changes the drive
and `USER 3` changes the user area for subsequent lines. `DIR` therefore
lists area 3 of B, which is empty.

`MOUNT.COM` is in area 0 of A. The program search described in Chapter 5
still finds it from area 3 of B. `NOSUCH` prints its usual error and the
next line runs. `USER 0` leaves the first interactive prompt at `B>`.
TEC-OS takes the next startup line after the program finishes.

## The first 128 bytes

TEC-OS reads startup text into memory once before running its first line.
A drive or user-area change affects subsequent commands but does not change
the text already read. Only the first 128 bytes are used. That is a CP/M
*record*, the unit in which file data is read. Nothing in a later record runs.

That limit includes line endings. Sixty blank lines take 120 bytes after
`--text` conversion because each contains CR and LF. In this historical
example the remaining eight bytes contain only the start of `DIR *.CMD`.
`USER 3` lies beyond the record:

```sh
printf '\n%.0s' $(seq 60) > startup.cmd
printf 'DIR *.CMD\nUSER 3\n' >> startup.cmd
cp dist/starter.img cut.img
node tools/tecvol.mjs put cut.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card cut.img -->
```text
A>DIR *.CM
NO FILE
A>
```

The shortened `DIR *.CM` still runs. TEC-OS executes the part of a line
that fits instead of rejecting an incomplete final line. Count the complete
intended commands and their line endings when checking that the file fits.

These rules determine the boundaries:

- CR or LF ends a line. Blank lines are skipped.
- `^Z`, a zero byte or the end of the record ends startup text. Bytes after
  a zero or `^Z` are not commands.
- A line supplies at most its first 127 characters, matching the typed-line
  limit. Further characters on that line are skipped.
- A new line cannot start at the record's last byte, the 128th. A line
  already in progress can use that byte.

A `$` in a command ends its displayed echo early while the command still
runs in full within these limits.
[Chapter 26](26-startup-inside-the-ccp.md) explains the echo mechanism
and retains the complete historical example.

## Program exits and resets

After an ordinary program exit TEC-OS resumes any startup text it has
already read. Reset begins a new startup attempt. The three routes back
to a prompt have different effects:

- An ordinary program return or a `^C` that ends a program causes a warm
  boot. Installed services and mounted volumes remain and startup continues
  at its next unread line. [Chapter 9](09-call-tec-os.md) explains the
  program-exit routes.
- A recognised reset finds TEC-OS's retained marks in RAM. It rebuilds the
  working state and can restore the previous drive-to-volume assignments
  when the card and retained selection are valid.
- An unrecognised reset, including normal power-on, has no valid retained
  selection. The drives take the assignments in the card's header.

Either kind of reset is a cold boot. It removes installed services,
selects drive A and user area 0 and runs the startup file once. At the
current source, a responding PICO9918 with the Matrix switch enabled
starts as the 40-column console. Otherwise the console starts on
serial. A startup width or GLCD line can then select the intended display.

The file is always taken from user area 0 of the volume assigned to A at
that reset. If a recognised reset restores another volume to A, that
volume's startup file runs. An absent file leaves no startup commands.
[Chapter 5](05-drives-and-user-areas.md) explains retained assignments and
fallback to the card's defaults.

This historical card has a third volume, SPARE, with a different startup
file. Its initial A file runs `MOUNT`. After `MOUNT A: SPARE` and reset,
the new A file runs `USER 2`:

```sh
node tools/tecvol.mjs create spare.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G1M:SPARE --drives 4
node tools/tecvol.mjs put spare.img A dist/files/MOUNT.COM
printf 'MOUNT\n' > startup.cmd
node tools/tecvol.mjs put spare.img A startup.cmd --text
printf 'USER 2\n' > startup.cmd
node tools/tecvol.mjs put spare.img SPARE startup.cmd --text
```

<!-- node tools/capture.mjs --card spare.img "MOUNT A: SPARE" @reset -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:
02 SPARE       G1M

A>MOUNT A: SPARE
A: SPARE      

A>
TEC-OS 0.1 for TEC-1G
A: SPARE      
B: WORK       

A>USER 2
2A>
```

The reset has kept SPARE on A so the final prompt is `2A>`. SYSTEM is no longer
mounted, which can remove the tools needed for recovery.

For example, suppose the GLCD driver is absent from the new A volume.
A recognised reset that retains that assignment cannot load the driver.
You need `MOUNT.COM` on a mounted drive to put the original volume back.
In this historical recipe MOUNT exists only on SYSTEM, which is no longer
mounted. A power loss clears the retained selection so the next boot uses
the header's SYSTEM assignment again. Merely resetting repeats the
retained assignment while it remains valid.

## Display commands in the file

The supplied `GLCD.SVC` line supports different board configurations.
With the Matrix switch enabled a responding PICO9918 starts its ROM
console before that line. The GLCD service then has these outcomes:

- With no active PICO9918 console, the line selects GLCD if its controller
  responds and the Matrix switch is enabled.
- With PICO9918 already selected, the startup line installs nothing and
  passes quietly. `CON UC1` can later load the service and select GLCD.
- An absent graphics LCD controller also makes the startup line pass quietly.

Quiet means that the command prints no error and the next startup line
can run. It does not mean that a driver was installed. A responding GLCD
controller with the Matrix switch off instead gives `GLCD.SVC?`. That
failure still allows the next line. Typing `GLCD.SVC` at the prompt has
a different result on a board with both displays: it can install the
service while leaving PICO9918 selected, as Chapter 5 demonstrated.

The historical capture configurations produced this table:

| Board | `GLCD.SVC` | Console at the first prompt |
| --- | --- | --- |
| Serial terminal only, `--board serial` | Passes quietly | `TTY:` |
| Graphics LCD and matrix keyboard, `--board glcd` | Installs | `UC1:` |
| Both displays and matrix keyboard, `--board pico` | Passes quietly | `CRT:` |

The last configuration has no resident GLCD driver after startup.
`SERVICES` prints no entry and `CON` reports the ROM console:

<!-- node tools/capture.mjs --board pico SERVICES CON -->
```text
A>SERVICES
A>CON
CON: CRT:
A>
```

On the serial and GLCD configurations, the banner and volume names first
go to serial and the 20 × 4 character LCD. The GLCD can become the console
only after its startup service loads.

A startup width command selects the intended PICO width after each reset.
Cold boot starts at 40 columns before the startup file runs. An explicit
width command can select 80, 40 or 32 columns. Bare `CON CRT` and `CON PICO`
retain the current width and any program claim. This historical recipe puts
a 32-column command before the supplied GLCD line:

```sh
printf 'CON PICO 32\nGLCD.SVC\n' > startup.cmd
cp dist/starter.img w32.img
node tools/tecvol.mjs put w32.img A startup.cmd --text
```

In this historical run the banner and volumes appeared at 80 columns.
The width command cleared the screen at 32 columns before printing its
reply. After `DIR` the PICO screen contained:

<!-- node tools/capture.mjs --card w32.img --board pico --screen DIR -->
```text
CON: CRT:
A>GLCD.SVC

A>DIR
MOUNT.COM    GLCD.SVC
STARTUP.CMD  TED.COM
SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

Where the ROM PICO console did not start, a startup width command passes
quietly. The same command typed there reports the width with `?`, such as
`32?`. The historical serial-only run of that same card showed both
display commands without an error:

<!-- node tools/capture.mjs --card w32.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>CON PICO 32

A>GLCD.SVC

A>
```

The web page's Display control prepares the startup file at power-on.
Successful preparation places the selected display command first. Every
PICO width has an explicit line: `CON PICO 80`, `CON PICO 40` or `CON PICO 32`.
The page's default remains 80 columns, selected through that startup line
after the ROM's 40-column cold start. GLCD selection puts `GLCD.SVC` first.
Other commands are kept. If preparation fails, the page reports the problem
and boots the card unchanged.
[Appendix I](appendix-i-web-page.md) gives the exact rewrite and failure rules.

## An older card's display file

An older card may name its driver `GLCD.DRV`. This ROM treats that name
as a program command and reports `GLCD.DRV?`. Changing the name to
`GLCD.SVC` and updating the startup line can work when the file is already
service format 4. Renaming does not convert an incompatible format.
[Appendix H](appendix-h-service-file-format.md#the-header) gives the
service-format fields and checks.

An old `PICO.SVC` cannot install under another name because the PICO9918
console is now in ROM. [Appendix D](appendix-d-error-messages.md#a-card-from-an-older-tec-os)
retains the complete old-card renaming example.

## Bypassing a bad startup file

A program that hangs or resets the board can prevent startup from reaching an
interactive prompt. With the keypad non-maskable interrupt (NMI) jumper off,
hold any hex-keypad key from reset until the prompt appears. TEC-OS samples the
keypad once just before opening the file and skips startup when a key is down.
The host model run at `58d4345` placed that sample about 1.5 seconds after
reset.

The NMI jumper must be off for this bypass. A key press with it fitted
causes a non-maskable interrupt at an address TEC-OS uses for other data
and can crash the system. [Appendix G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi)
gives the board requirement.

After a skip no service has been installed. A responding PICO9918 with
the Matrix switch enabled remains the console. Otherwise the board has
serial and the 20 × 4 LCD until a GLCD driver is loaded. In that latter
configuration, matrix input becomes available with the GLCD console after
installation, provided the Matrix switch is enabled.

At the serial prompt you can erase the bad file with `ERA STARTUP.CMD` or
replace it with corrected text then reset. The startup file is in user area 0 of
A so recovery must address that location. Without a usable terminal, the Chapter
5 card tools can replace or erase it on a PC. A recognised reset with a skip
retains valid drive assignments just as it does without a skip.

The web page has no hex keypad. Its Copy file to drive and New starter card
controls provide recovery from a bad file, as Appendix I explains.

## Recovery words on the character LCD

The last row of the 20 × 4 LCD gives a result even without an attached
terminal. `GLCD?` reports a load or installation failure returned by
`CON UC1`, with the console still where it was. A fatal card-read error
instead prints the BDOS disk-error message and ends the command.
`CARD?` accompanies a card-mount failure and the diagnostic prompt described in
[Chapter 28](28-diagnose-the-machine.md).

The next historical recipe removes the startup file. On the serial board,
`CON UC1` then fails to install GLCD and leaves `GLCD?` on that LCD row:

```sh
cp dist/starter.img nostart.img
node tools/tecvol.mjs era nostart.img A STARTUP.CMD
```

<!-- node tools/capture.mjs --card nostart.img --lcd "CON UC1" -->
```text
A>CON UC1
CON: TTY:
A>
--- LCD
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK
GLCD?
```

A successful GLCD installation clears that recovery word, whether GLCD
becomes the console or PICO9918 stays selected. The next historical card
keeps the driver as `G.SVC` instead. `CON UC1` cannot find `GLCD.SVC`,
then typing `G.SVC` installs it and clears the word:

```sh
cp nostart.img gname.img
node tools/tecvol.mjs put gname.img A dist/files/GLCD.SVC G.SVC
node tools/tecvol.mjs era gname.img A GLCD.SVC
```

<!-- node tools/capture.mjs --card gname.img --board glcd --lcd "CON UC1" G.SVC CON -->
```text
A>CON UC1
CON: TTY:
A>G.SVC

A>CON
CON: UC1:
A>
--- LCD
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK

```

The `CON UC1` reply and the typed `G.SVC` line are on serial. The later
prompt and `CON: UC1:` report are on GLCD.

Clearing `GLCD?` writes blanks over only its five characters.
[Chapter 12](12-use-the-boards-devices.md#the-lcd-and-the-speaker) explains
how a program replaces the row through the LCD service.
[Chapter 26](26-startup-inside-the-ccp.md#recovery-words-and-row-ownership)
explains when later console changes preserve or clear its text.

`CARD?` is cleared differently. `R` at the diagnostic prompt reinitialises
the LCD before retrying the card so a successful retry clears the word.
Another mount failure writes it again.
