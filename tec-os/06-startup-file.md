---
title: The startup file
parent: TEC-OS
nav_order: 6
nav_group: "Part I: Using and programming TEC-OS"
---

# 6. The startup file

<!-- Checked against TEC-OS 78127ec. -->

The `GLCD.SVC` that ran at Chapter 1's first prompt came from `STARTUP.CMD`, a
text file on drive A. TEC-OS runs the file's lines before it reads anything
from the keyboard. The file is where you set your board up: the display it
uses, the width of its screen and the drive it starts on.

## The startup file

The CCP reads `STARTUP.CMD` from drive A before it waits for the keyboard,
and it runs each line in turn. The starter card's file has one line:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
GLCD.SVC

A>
```

`GLCD.SVC` installs the graphics LCD's driver, a *service*: code that TEC-OS
reads from the card and keeps in memory until a reset. The last sections
describe services and the commands that list and remove them.

Any command you can type can be a line of the file. The card below is a copy
of the starter card with a startup file of six lines. `tecvol put`, from
Chapter 4, replaces the file of the same name. `--text` writes it as a CP/M
text file: each line ends in CR and LF, and a `^Z` follows the last.

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

At each prompt the CCP takes the next line of the file in place of the
keyboard. It echoes the line as it stands in the file, so `mount` appears in
small letters. Then it runs the line as if you had typed it. A line that fails
prints its usual message and the next line runs. Each line's effects last.
`B:` and `USER 3` change the drive and the user area for the lines after
them, and the prompts show both. `MOUNT.COM` is in user area 0 of drive A, and
`MOUNT` still runs from user area 3. The CCP's search for a program goes on to user area
0, as Chapter 3 describes. `DIR` lists area 3 of drive B, which is empty. The
first prompt you can type at is the last one, `B>`.

## The rules of a line

TEC-OS reads the file once, into memory, before the first line runs. The
changes of drive and user area above therefore had no effect on the reading.
It reads one 128-byte record, CP/M's unit of a file, and anything after that
record never runs. A line cut off by the record's end runs as far as it goes.
On this card sixty blank lines take 120 bytes, since `--text` gives each a CR
and an LF. The record's last 8 bytes then hold the start of `DIR *.CMD`, and
`USER 3` is past its end:

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

The rest of the rules are about a line's edges:

- A line ends at CR or at LF, and blank lines are passed over.
- `^Z`, a zero byte or the end of the record ends the file, and nothing after
  a `^Z` or a zero runs.
- A line runs its first 127 characters, the limit of a line typed at the
  prompt, and the rest of it is passed over.
- A line that would start at the record's last byte, the 128th, doesn't run.

The echo stops at a `$`, but the line itself runs whole. The echo goes through
the BDOS's function for printing a string, and that function ends at a `$`.
This card has a file named `NOTE$.TXT`, and its startup line types it:

```sh
printf 'It ran whole.\n' > 'NOTE$.TXT'
printf 'TYPE NOTE$.TXT\n' > startup.cmd
cp dist/starter.img dollar.img
node tools/tecvol.mjs put dollar.img A startup.cmd --text
node tools/tecvol.mjs put dollar.img A 'NOTE$.TXT' --text
```

<!-- node tools/capture.mjs --card dollar.img -->
```text
A>TYPE NOTE
It ran whole.

A>
```

A line can start a program, and the next line runs when the program ends. A
`^C` that ends the program doesn't end the file: the next line still runs. A
`^C` at a program's line input drops the rest of a line that holds `!`, and
then the file's next line runs.

The `!` and `:` of [Chapter 3](03-command-line.md#several-commands-on-one-line)
work in a startup line too, and the file has one rule of its own for them. A
`.SVC` file that doesn't install is a failed command, so a command after it
that starts with `:` is dropped. The exception is a line whose driver finds
its device missing, or a display line of the kind described below with
nothing to do on its board. Such a line *passes quietly*. It prints nothing,
as `GLCD.SVC` did in Chapter 1, and it counts as a success, so a `:` command
after it runs. Here the file's two lines are `GLCD.SVC!:MOUNT` and
`NOSUCH.SVC!:MOUNT`, on the board with only a serial terminal:

```sh
printf 'GLCD.SVC!:MOUNT\nNOSUCH.SVC!:MOUNT\n' > startup.cmd
cp dist/starter.img chain.img
node tools/tecvol.mjs put chain.img A startup.cmd --text
```

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

`GLCD.SVC` finds no graphics LCD and passes quietly, and the `:MOUNT` after it
runs. `NOSUCH.SVC` isn't on the card. That is a failure of any other kind, so its
`:MOUNT` is echoed and dropped. Only a line of the file passes quietly.
Typed at the prompt, `GLCD.SVC` with no graphics LCD fails with `GLCD.SVC?`.

## When the file runs

TEC-OS comes back to a prompt in three ways, and the file runs on two of
them:

- An *ordinary exit* is a program's return, a `^C`, or a jump to `0000h`. It
  is a warm boot: services stay, the drives hold the volumes they held and the
  startup file doesn't run.
- A *recognised reset* is a press of the reset button that finds a running
  TEC-OS's marks in RAM. The drives keep the volumes that were on them, if the
  card still has those volumes, as
  [Chapter 5](05-drives-and-cache.md#the-drives-after-a-reset) describes.
  Everything else TEC-OS holds in memory is rebuilt.
- An *unrecognised reset* is a reset that finds no such marks, as at power-on.
  The drives take the volumes the card's header names, and everything else is
  rebuilt.

Each reset is a cold boot. It removes every service and returns to drive A
and user area 0. The console starts as at power-on: on the PICO9918 at 80
columns where the board has the PICO9918 and the matrix keyboard, and
otherwise on the serial terminal. The startup file then runs once, on either
kind of reset. Its lines put back the width or the graphics LCD's console.

The file is the one on the drive A of that moment, in user area 0. After a
recognised reset drive A may hold another volume. Then that volume's
`STARTUP.CMD` runs, or nothing runs if it has no such file. This card has a
third volume, `SPARE`, with its own startup file, and `MOUNT A: SPARE` is typed
before the reset button is pressed:

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

Every recognised reset puts the selection back. Suppose a board with the
graphics LCD has a volume with no `GLCD.SVC` on drive A. It then stays without
the graphics LCD's console until the board loses power or you mount the other
volume back. That needs `MOUNT.COM` on a mounted drive. On this card it is
only on `SYSTEM`, so only a loss of power puts `SYSTEM` back on drive A.

## Display lines

The file's main use is to start the display your board has, and one card can
start every board. The PICO9918 needs no line. Where the board has the
PICO9918 and the matrix keyboard, cold boot makes it the console at 80
columns before the file runs. The graphics LCD needs a line, `GLCD.SVC`, which
installs its driver:

- On a board with the graphics LCD and the matrix keyboard, and no PICO9918
  console, the line makes the graphics LCD the console.
- On a board where the PICO9918 is the console, the line installs nothing and
  passes quietly. The console stays on the PICO9918, and `CON UC1` later loads
  the driver and moves the console to the graphics LCD.
- On a board with no graphics LCD the line passes quietly, as Chapter 1
  showed.

On a board with the graphics LCD and no matrix keyboard the line fails with
`GLCD.SVC?`. In every case the next line runs. The
starter card's line gives these results on the three boards of
`tools/capture.mjs`:

| Board | `GLCD.SVC` | Console at the first prompt |
| --- | --- | --- |
| Serial terminal only, `--board serial` | Passes quietly | `TTY:` |
| Graphics LCD and matrix keyboard, `--board glcd` | Installs | `UC1:` |
| Both displays and matrix keyboard, `--board pico` | Passes quietly | `CRT:` |

On the last board no driver is installed while the PICO9918 has the console:

<!-- node tools/capture.mjs --board pico SERVICES CON -->
```text
A>SERVICES
A>CON
CON: CRT:
A>
```

On the other two boards the banner and the volumes go to the serial terminal
and the 20 × 4 LCD until the `GLCD.SVC` line runs.

A line sets the PICO9918's width too. `CON PICO 40` or `CON PICO 32`, the
command of [Chapter 2](02-console.md#moving-the-console-with-con), sets the
width for the rest of the session, and a reset puts 80 columns back. In the
startup file the command sets the width at every reset. This card's file has a
width line before the starter card's line:

```sh
printf 'CON PICO 32\nGLCD.SVC\n' > startup.cmd
cp dist/starter.img w32.img
node tools/tecvol.mjs put w32.img A startup.cmd --text
```

The banner and the volumes appear at 80 columns, and the screen is cleared at
32 columns before the reply to `CON PICO 32`. After a `DIR` the PICO9918 shows
this:

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

On a board where the PICO9918's console didn't start, the width line passes
quietly at each boot, so a `:` command after it runs. Typed at the prompt
there, the same command fails with `32?`. On the serial board the card boots like this:

<!-- node tools/capture.mjs --card w32.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>CON PICO 32

A>GLCD.SVC

A>
```

The web page's "Display" control rewrites the card's `STARTUP.CMD` at each
power-on. It puts the chosen display's line first and keeps your other lines,
as [Appendix I](appendix-i-web-page.md) describes.

## Services at the prompt

A service is what a `.SVC` file installs. TEC-OS reads its code from the card
into memory just below the BDOS. It stays there until a reset or until the
`UNLOAD` command removes it, and a program's end leaves it in place. The
graphics LCD's driver is the starter card's one service. The PICO9918's
console is in the ROM, so nothing is installed for it. A service takes whole
pages of 256 bytes from the memory programs have, and Chapter 8 gives the
figures. Chapter 12 describes how a service is written.

A command that names a file of type `.SVC` installs the service in it. The
file comes from the current drive or from a drive named in the command, such
as `B:NAME.SVC`. The command must include the type, because `NAME` alone makes
the CCP search for the program `NAME.COM`. `SERVICES` lists what is installed
and `UNLOAD` removes the newest. On the board with both displays the startup
file's line installed nothing. There, `GLCD.SVC` typed at the prompt installs
the driver and leaves the console on the PICO9918:

<!-- node tools/capture.mjs --board pico GLCD.SVC SERVICES UNLOAD SERVICES UNLOAD -->
```text
A>GLCD.SVC

A>SERVICES
GLCD 3
A>UNLOAD

A>SERVICES
A>UNLOAD
UNLOAD?

A>
```

`SERVICES` prints one line for each service, the newest first: its name and
the number of pages it holds. `GLCD` holds three, and with nothing installed
the list is empty. The first `UNLOAD` removes the driver, and the PICO9918
stays the console. The second has nothing to remove and prints `UNLOAD?`. It
prints the same when the newest service can't be removed, and then nothing
changes. Services go in the opposite order to their installation. An older one
stays until every newer one has gone. A warm boot keeps all of them, and a
reset empties the list.

A file that doesn't read, isn't a service or fails while installing gets its
name back with a question mark, whatever the reason. A second copy of the
graphics LCD's driver fails that way. On the board with the graphics LCD the
startup file installed one, so `GLCD.SVC` typed again gives `GLCD.SVC?`:

<!-- node tools/capture.mjs --board glcd GLCD.SVC SERVICES -->
```text
A>GLCD.SVC
GLCD.SVC?

A>SERVICES
GLCD 3
A>
```

`UNLOAD` can remove the graphics LCD's driver while the graphics LCD is the
console. The console then goes to the PICO9918 if cold boot started its
console, and otherwise to the serial terminal. `CON UC1` installs
`A:GLCD.SVC` when the driver is out, so a card with no `GLCD.SVC` line still
reaches the graphics LCD:

<!-- node tools/capture.mjs --board pico "CON UC1" SERVICES UNLOAD CON -->
```text
A>CON UC1
CON: UC1:
A>SERVICES
GLCD 3
A>UNLOAD

A>CON
CON: CRT:
A>
```

A card from an older TEC-OS holds its services in files of type `.DRV`, and
this ROM doesn't load them. The CCP takes `GLCD.DRV` as the name of a program
and prints `GLCD.DRV?`. Renaming the file to `GLCD.SVC`, and changing
`STARTUP.CMD` to match, works when the file's second byte is 4. That byte is
the file's format, and 4 is the format this ROM loads. An older `PICO.SVC`
doesn't install under any name, since the PICO9918's console is now in the
ROM. [Appendix D](appendix-d-error-messages.md#a-card-from-an-older-tec-os)
shows the renaming on such a card.

## When the file goes wrong

A startup line that hangs, or that resets the board, would run at every boot.
To get past one, hold any key on the hex keypad from the reset until the
prompt appears. TEC-OS reads the keypad's state once, just before it opens the
file, about 1.5 seconds after a reset on the model. With a key down it leaves
the file unread. With the board's keypad NMI jumper fitted a key press is a
crash, so the skip is for a board with that jumper off. [Appendix
G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi) describes the jumper.

After a skip there are no services, and the console stays where cold boot put
it. A board with the PICO9918 and the matrix keyboard has its console on the
PICO9918 as always. Any other board has only the 20 × 4 LCD and the serial
terminal, since the matrix keyboard is read only once the graphics LCD's
driver is in. On such a board you recover at the serial terminal:
`ERA STARTUP.CMD` or a corrected file, and then a reset. Otherwise you take
the card to a PC and use `tecvol`. A recognised reset with a skip keeps the drives'
volumes as one without a skip does. The web page has no keypad, so a bad file
there is replaced with "Copy file to drive" or "New starter card".

The 20 × 4 LCD's last row is for a board that may have no terminal attached.
TEC-OS writes one of two words there:

- `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`. The console stays
  where it was.
- `CARD?` appears each time a card won't mount, with the diagnostic prompt
  that Chapter 26 describes.

Here `CON UC1` fails on the serial board, where the driver's installation
fails, with a card that has no startup file:

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

An installation of the graphics LCD's driver clears `GLCD?`, whether the
driver takes the console or leaves it on the PICO9918. On this card the driver
is on drive A under another name, `G.SVC`. On the board with the graphics LCD
`CON UC1` then finds no `GLCD.SVC`. `G.SVC` typed after it installs the driver
and clears the word:

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

The reply to `CON UC1` and the echo of `G.SVC` are on the serial terminal.
The rest is on the graphics LCD, which `G.SVC` made the console.

Clearing writes blanks only over the word itself, and only while the word is
still there. A program can write the LCD's last row through the LCD's hardware service, as
Chapter 10's `DEMO` does. That takes the row over, and a driver installed
later leaves the row alone. A program that writes the LCD's
port directly bypasses TEC-OS, so the driver's next installation writes five
blanks over the start of the row. `CARD?` goes when `R` at the diagnostic
prompt starts the LCD again, so a retry that works clears it.
