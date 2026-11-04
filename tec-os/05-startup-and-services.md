---
title: Startup and services
parent: TEC-OS
nav_order: 5
nav_group: "Part I: Using and programming TEC-OS"
---

# 5. Startup and services

<!-- Checked against TEC-OS 78127ec. -->

Chapter 1's first boot ran a command that nobody typed, `GLCD.SVC`, which on a
board with only a serial terminal failed without a word. This chapter explains
what the command installs and the file it comes from, with the startup file's
rules and the times it runs. It then gives the lines that set a
display and its width, the way to skip the file, the words TEC-OS shows on the
20 × 4 LCD and the commands that install, list and remove what the file
installs.

## Services

A *service* is what a `.SVC` file installs. It is code that TEC-OS reads from
the card into memory just below the BDOS, where it stays until a reset or
until the `UNLOAD` command removes it. A program's end leaves it in place. A
*driver* is a service that drives hardware, and a *library* is a service that
provides routines for programs. The starter card's one service is a driver,
`GLCD.SVC`, which holds the graphics LCD's console. The PICO9918's console is
in the ROM, so nothing is loaded for it.

The *hardware services* of Chapter 9 are another thing. They are numbered
calls inside the ROM, so nothing is loaded for them and the `SERVICES` command
doesn't list them. A loaded service can publish named *records* in TEC-OS's
registry, and a program finds the service through them. Chapter 10 describes
records and how a service is made.

A service takes whole pages of 256 bytes, and those bytes come from the TPA,
the memory programs have. Installing one lowers the word at `0006h`, the
address that gives a program the top of its memory (Chapter 7). The pages that
loaded services hold, from the lowest service up to the BDOS entry jump's page,
are the *service resident memory*. `GLCD.SVC` on the starter card takes three
pages, and a run on the model gives:

| Installed | Word at `0006h` | Bytes for programs |
| --- | --- | --- |
| Nothing | `B9A4h` | 47,268 |
| `GLCD.SVC` | `B600h` | 46,336 |

The first service's pages end at `B8FFh`, so the 164 bytes from `B900h` to `B9A3h`
go with it. The figures are the same on a board with the PICO9918, whose
console takes no pages.

## The startup file

Before the CCP waits for the first line from the keyboard, it reads
`STARTUP.CMD` from drive A and runs the lines in it. The starter card's file
has one line, the one you saw in Chapter 1:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
GLCD.SVC

A>
```

Any command you can type can be a line of the file. A file of your own on a
copy of the starter card shows the rules. `tecvol`'s `put` replaces the file
of the same name. `--text` writes it as a CP/M text file, with each line
ending in CR and LF and a `^Z` after the last, as Appendix F explains:

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

At each prompt the CCP takes the next line in place of the keyboard. The line
is echoed as it stands in the file, so `mount` appears in small letters, and it
then runs as if typed. The CCP prints a failed line's usual message and the
next line runs. Each line's effects last: `B:` and `USER 3` change the drive
and the user area for the lines after them, and the prompts show both. The
first prompt you can type at is `B>`. `MOUNT` runs although `MOUNT.COM` is in user area 0 of drive A,
because the CCP's search for a program goes on to area 0 of each drive it
searches, as Chapter 3 describes. `DIR` lists area 3 of drive B, which is
empty.

TEC-OS reads the file once, into memory, before the first line runs, so the
changes of drive and user area had no effect on reading it. It reads one
128-byte record, and anything after that record never runs. This record is
CP/M's unit of a file and a different thing from a service's records. A line
cut off by the record's end runs as far as it goes. Sixty blank lines take up
120 bytes here, since `--text` gives each a CR and an LF. The record's last 8
bytes then hold the start of `DIR *.CMD`, and `USER 3` is past its end:

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
  prompt, and the rest of it is passed over. A line of 127 characters runs
  whole.
- A line that would start at the record's last byte, the 128th, doesn't run.

The echo stops at a `$`, but the line itself runs whole, because the echo goes
through the BDOS's function for printing a string, which ends there. This card
has a file named `NOTE$.TXT`, and its startup line types it:

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

A line can start a program, and the next line runs when the program ends.
Chapter 11's `!` and `:` work in a startup line too. A `.SVC` file that
doesn't install counts as a failed command, so a command after it that starts
with `:` is dropped. The exception is a startup line whose driver finds its
device missing, or one of the display lines described below that has nothing
to do on its board. Each is quiet, as `GLCD.SVC` was in Chapter 1, and doesn't
count as a failure, so a `:` command after it runs. Here the file's two lines
are `GLCD.SVC!:MOUNT` and `NOSUCH.SVC!:MOUNT`, on the board with only a serial
terminal:

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

`GLCD.SVC` finds no graphics LCD and says nothing, and the `:MOUNT` after it
runs. `NOSUCH.SVC` isn't on the card, which is a failure of any other kind, so
its `:MOUNT` is echoed and dropped.

A `^C` that ends a program started by a line doesn't end the file: the next line
still runs. A `^C` at a program's line input drops the rest of a line that holds
`!`, and then the file's next line runs.

## Restarts and the startup file

TEC-OS restarts by one of three paths:

- An *ordinary exit* is a program's return, a `^C`, or a jump to `0000h` or to
  `C000h`. It is
  a warm boot: services stay, the drives hold the volumes they held and the
  startup file doesn't run.
- A *recognised reset* is a press of the reset button, or a program's call of
  the BIOS's cold boot entry, that finds a running TEC-OS's marks in RAM. The
  drives keep the volumes that were on them, if the card still has those
  volumes, and everything else TEC-OS holds in memory is rebuilt.
- An *unrecognised reset* is a reset that finds no such marks, as at power-on.
  The drives take the volumes the card's header names, and everything else is
  rebuilt.

Each reset is a cold boot, so it removes every service, returns to drive A and
user area 0 and starts the console as at power-on: on the PICO9918, at 80
columns, on a board with the PICO9918 and the matrix keyboard, and on the
serial terminal on any other. The startup file then runs once, on either kind
of reset, and its lines put back a width or the graphics LCD's console.

The file is the one on the drive A of that moment, in user area 0. After a
recognised reset drive A may hold another volume, and then that volume's
`STARTUP.CMD` runs, or nothing runs if it has no such file. This card has a
third volume, `SPARE`, with its own startup file:

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

Every recognised reset puts the selection back. A board with the graphics LCD
whose selected drive A has no `GLCD.SVC` therefore stays without the graphics
LCD's console until the board loses power or you mount the other volume back. That needs `MOUNT.COM` on a drive that is
mounted. On this card it is only on `SYSTEM`, so only a loss of power puts
`SYSTEM` back on drive A.

## Display lines

The PICO9918 needs no line in the file. On a board with the PICO9918 and the
matrix keyboard, cold boot has made the PICO9918 the console at 80 columns
before the file runs. The graphics LCD needs a line, `GLCD.SVC`, which installs
its driver:

- On a board with the graphics LCD and the matrix keyboard, and no PICO9918
  console, the line makes the graphics LCD the console.
- On a board where the PICO9918 is the console, the line installs nothing and
  passes quietly, and the next line runs. The console stays on the PICO9918,
  and `CON UC1` then loads the driver and moves the console to the graphics
  LCD.
- On a board with no graphics LCD the line fails quietly, as Chapter 1 showed,
  and the next line runs.

On a board with the graphics LCD and no matrix keyboard the installation fails
with `GLCD.SVC?` and leaves nothing installed. Either way the next line runs,
so one card starts every board. The starter card's line gives these results on
the three boards of `tools/capture.mjs`:

| Board | `GLCD.SVC` | Console at the first prompt |
| --- | --- | --- |
| Serial terminal only, `--board serial` | Fails quietly | `TTY:` |
| Graphics LCD and matrix keyboard, `--board glcd` | Installs | `UC1:` |
| Both displays and matrix keyboard, `--board pico` | Passes quietly | `CRT:` |

On the last board no driver is installed while the PICO9918 has the console,
so programs have 47,268 bytes, as the table under "Services" gives:

<!-- node tools/capture.mjs --board pico SERVICES CON -->
```text
A>SERVICES
A>CON
CON: CRT:
A>
```

Where the PICO9918's console doesn't start, the banner and the volumes go to
the serial terminal and the 20 × 4 LCD until the `GLCD.SVC` line runs.

A line sets the PICO9918's width too. `CON PICO 40` or `CON PICO 32`, the
command of Chapter 2, sets the width for the rest of the session, and in the
startup file it sets it at every reset. This card's file has a width line
before the starter card's line:

```sh
printf 'CON PICO 32\nGLCD.SVC\n' > startup.cmd
cp dist/starter.img w32.img
node tools/tecvol.mjs put w32.img A startup.cmd --text
```

The banner and the volumes appear at 80 columns, and the screen is cleared at
32 columns before the reply to `CON PICO 32`. After `DIR` the web page's
PICO9918 shows this:

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
quietly at each boot, as a driver's line for a missing device is, so a `:`
command after it runs. Typed at the prompt there, the same command fails with
`32?`. On the serial board the card boots like this:

<!-- node tools/capture.mjs --card w32.img -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>CON PICO 32

A>GLCD.SVC

A>
```

The web page's "Display" and "ROM" controls change the card for you, through
`host/card.mjs`. At each power-on the page takes the display lines out of the
card's `STARTUP.CMD` and puts the chosen display's line first, keeping your
other lines. A display line is a line or chained piece that names a display
driver's file, `GLCD.SVC` or an older card's `PICO.SVC`, `PICO40.SVC` or
`PICO32.SVC`, under the type `.SVC` or `.DRV`. A `CON PICO` or `CON CRT` command
with a width is one too, since it would override the width the page chose. The chosen display's line is `GLCD.SVC` for
the graphics LCD, `CON PICO 40` or `CON PICO 32` for the PICO9918 at that
width, and none for the PICO9918 at 80 columns. On the page's board, with both
displays, the page writes no `GLCD.SVC` line with the PICO9918 chosen, and
`CON UC1` loads `GLCD.SVC` when you want the graphics LCD.

A display line chained in one of your lines is taken out and the rest of the
line kept. The piece taken out passes its own `:` to the piece after it on its
line, and a `:` first on the next line stays if the piece taken out had its
own. Any other `:` that waited on a piece taken out goes, on its line or first
on the next, so that piece runs as an ordinary command. So does a piece with
`:` first in your first line, which would otherwise wait on the display line.

The page reads only the files of user area 0 on drive A, the area from which
TEC-OS loads `STARTUP.CMD` and `GLCD.SVC`. It makes its change on a copy of the
card, and the copy replaces the card only once the change is made. A card whose
drive A is read-only, whose `STARTUP.CMD` has its read-only attribute set or
whose directory has no room for a new `STARTUP.CMD` is left as it was when the
file needs a change, and the page says in the serial terminal that it boots as
it is. With the graphics LCD chosen, a card with no `GLCD.SVC` on drive A, or one
of an older format, is left as it is too, and the page says so.

## The keypad skip

A startup line that hangs, or that resets the board, would run at every boot.
To get past one, hold any key on the hex keypad from the reset until the
prompt appears. With the board's keypad NMI jumper fitted a key press is a
crash, so the skip is for a board with that jumper off, as [Appendix
G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi) describes. TEC-OS reads the
keypad's state once, just before it opens the file, about 1.5 seconds after a
reset on the model, and with a key down it doesn't read the file.
`test/startup.test.mjs` runs the case: with a key held, a card whose service
hangs while installing reaches a prompt.

After a skip there are no services, and the console stays where cold boot put
it. A board with the PICO9918 and the matrix keyboard has its console on the
PICO9918 as always. Any other board has the 20 × 4 LCD and the serial terminal
and nothing else, because there the matrix keyboard is read only once the
graphics LCD's driver is in. So on such a board, recovery needs the serial
terminal: `ERA STARTUP.CMD` or a corrected file, and then a reset. Otherwise take the card
to a PC and use `tecvol`. A recognised reset with a skip keeps the drives'
volumes as one without a skip does. The web page has no keypad, so a bad file
there is replaced with "Copy file to drive" or "New starter card".

## Words on the LCD

The 20 × 4 LCD's last row is for a board that may have no terminal attached.
TEC-OS writes one of two words there:

- `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`. The console stays where
  it was.
- `CARD?` appears each time a card won't mount, with the diagnostic prompt of
  Chapter 23.

A board with the PICO9918 and the matrix keyboard has its console from cold
boot, so it needs no word for a missing driver. A failed `CON UC1` leaves
`GLCD?`. Here it fails on the serial board, where the driver's installation
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
is on drive A under another name, `G.SVC`, so `CON UC1` finds no `GLCD.SVC` on
the board with the graphics LCD, and `G.SVC` typed after it installs the driver
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

The reply to `CON UC1` and the echo of `G.SVC` are on the serial terminal, and
the rest is on the graphics LCD, which `G.SVC` made the console.

Clearing writes blanks only over the word itself. A program that writes the
LCD's last row through the LCD's hardware service replaces the word, and when
the driver later installs, that row is left alone. `DEMO`, the program Chapter
9 describes, is such a program, and its last screen stays through a later
`GLCD.SVC`. A program that writes over the word at the LCD's port bypasses
TEC-OS, so the driver's next installation writes five blanks over the start of
the row. `CARD?` goes when `R` at the diagnostic prompt starts the LCD again,
so a retry that works clears it.

## Installing, listing and removing services

A command that names a file of type `.SVC` installs the service in it. The file
comes from the current drive or from a drive named in the command, such as
`B:NAME.SVC`. The command must include the type, because `NAME` alone makes the
CCP search for the program `NAME.COM`. `NAME.DRV` is an ordinary file
name to the CCP, which searches for a program. `SERVICES` lists what is
installed and `UNLOAD` removes it. On a card with no startup file, on the serial
board, nothing is installed and the graphics LCD's driver can't be:

<!-- node tools/capture.mjs --card nostart.img SERVICES UNLOAD GLCD GLCD.DRV GLCD.SVC -->
```text
A>SERVICES
A>UNLOAD
UNLOAD?

A>GLCD
GLCD?

A>GLCD.DRV
GLCD.DRV?

A>GLCD.SVC
GLCD.SVC?

A>
```

`SERVICES` prints one line for each service, the newest first: its name and
the number of pages it holds. With nothing installed it prints nothing. If a
file doesn't read, isn't a service or fails while installing, the CCP prints
its name with a question mark, whatever the reason. Typed at the prompt,
`GLCD.SVC` with no graphics LCD is such a failure. Only a line of the startup
file fails quietly for a missing device. A second copy of the graphics LCD's
driver fails the same way, so on the board with the graphics LCD, where the
startup file installed one, `GLCD.SVC` typed again gives `GLCD.SVC?`:

<!-- node tools/capture.mjs --board glcd GLCD.SVC SERVICES -->
```text
A>GLCD.SVC
GLCD.SVC?

A>SERVICES
GLCD 3
A>
```

`UNLOAD` removes the newest service, the one lowest in memory, and the word at
`0006h` goes back to what it held before that service. If that service can't be removed, nothing
changes and `UNLOAD?` is printed. Services therefore go in the opposite order to
their installation, and an older one stays until every newer one has gone. A
warm boot keeps all of them, and a reset empties the list.

The PICO9918's console is in the ROM, and `UNLOAD` never removes it.
`GLCD.SVC`, once it is the newest, can always be removed. If the graphics LCD
is the console, the console goes to the PICO9918 if cold boot started its
console, and otherwise to the serial terminal:

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

`CON UC1` installs `A:GLCD.SVC` if it isn't in, so a card with no `GLCD.SVC`
line still reaches the graphics LCD.

## A card from an older TEC-OS

Older cards hold their services in files of type `.DRV`, and this ROM doesn't
load them. The CCP takes `GLCD.DRV` as the name of a program and prints it
with a question mark, so a board with the graphics LCD keeps its console on the
serial terminal. A board with the PICO9918 and the matrix keyboard has its
console on the PICO9918 from cold boot, whatever the card holds. The web page,
with the graphics LCD chosen, reports such a card when it powers on, naming
`GLCD.DRV` if the card has it, or else another of the old display files, and
leaves the card as it is. With the PICO9918 chosen, the page takes the old
display lines out of `STARTUP.CMD`, as it does every display line.

There are two ways out. "New starter card",
or a new image from `npm run media`, replaces the card. The other way keeps
the card: rename `GLCD.DRV` to `GLCD.SVC` and change `STARTUP.CMD` to match,
which works if the file's format, its second byte, is 4, the format this ROM
loads. An older card's `PICO.SVC` doesn't install under any name, because the
ROM's table no longer takes a driver for the PICO9918, and it leaves nothing
installed. This image is a copy of the starter card with an older card's two
display drivers, the `PICO.SVC` kept in the repository's tests and the current
`GLCD.SVC`, under the old type:

```sh
cp dist/starter.img old.img
node tools/tecvol.mjs put old.img A test/fixtures/e5154ad/PICO.SVC PICO.DRV
node tools/tecvol.mjs put old.img A dist/files/GLCD.SVC GLCD.DRV
node tools/tecvol.mjs era old.img A GLCD.SVC
printf 'PICO.DRV\nGLCD.DRV\n' > startup.cmd
node tools/tecvol.mjs put old.img A startup.cmd --text
```

On the board with the graphics LCD both lines fail. Renamed, `PICO.SVC` still
fails, and `GLCD.SVC` installs and takes the console:

<!-- node tools/capture.mjs --card old.img --board glcd "REN PICO.SVC=PICO.DRV" "REN GLCD.SVC=GLCD.DRV" PICO.SVC GLCD.SVC CON SERVICES -->
```text
A>PICO.DRV
PICO.DRV?

A>GLCD.DRV
GLCD.DRV?

A>REN PICO.SVC=PICO.DRV
A>REN GLCD.SVC=GLCD.DRV
A>PICO.SVC
PICO.SVC?

A>GLCD.SVC

A>CON
CON: UC1:
A>SERVICES
GLCD 3
A>
```

`STARTUP.CMD` still names the old files, so the next reset prints the same two
failures until a new file replaces it, and `ERA PICO.SVC` removes the old driver.
The new file comes from `tecvol put` on a PC or "Copy file to drive" on the web
page. There, "Power cycle" does it too when the chosen display's file is on the
card, since the page's rewrite drops a display line of either type. A
`GLCD.SVC` of an older format fails under the new name too, as `GLCD.SVC?`, and
only a new starter card's copy, or one put on the card with `tecvol`, replaces
it.
