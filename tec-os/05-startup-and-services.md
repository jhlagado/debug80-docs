---
title: Startup and services
parent: TEC-OS
nav_order: 5
nav_group: "Part I: Using and programming TEC-OS"
---

# 5. Startup and services

Checked against TEC-OS 7458352.

Chapter 1's first boot ran two commands that nobody typed, and on the web
page's board the first of them moved the console to the PICO9918. This chapter
explains what those commands install and the file they come from, with the
startup file's rules and the times it runs. It then gives the lines that set a
display and its width, the way to skip the file, the words TEC-OS shows on the
20 × 4 LCD and the commands that install, list and remove what the file
installs.

## Services

A *service* is what a `.SVC` file installs. It is code that TEC-OS reads from
the card into memory just below the BDOS, where it stays until a reset or
until the `UNLOAD` command removes it. A program's end leaves it in place. A
*driver* is a service that drives hardware, and a *library* is a service that
provides routines for programs. The starter card's two services are both
drivers: `PICO.SVC` holds the PICO9918's console, at 80 columns, and
`GLCD.SVC` holds the graphics LCD's.

The *hardware services* of Chapter 9 are another thing. They are numbered
calls inside the ROM, so nothing is loaded for them and the `SERVICES` command
doesn't list them. A loaded service can publish named *records* in TEC-OS's
registry, and a program finds the service through them. Chapter 10 describes
records and how a service is made.

A service takes whole pages of 256 bytes, and those bytes come from the TPA,
the memory programs have. Installing one lowers the word at `0006h`, the
address that gives a program the top of its memory (Chapter 7). The pages that
loaded services hold, from the lowest service up to the BDOS entry jump's page,
are the *service resident memory*. A display driver on the starter card takes six
pages, and a run on the model gives:

| Installed | Word at `0006h` | Bytes for programs |
| --- | --- | --- |
| Nothing | `B815h` | 46,869 |
| One display driver | `B200h` | 45,312 |
| Both displays' drivers | `AC00h` | 43,776 |

The first service's pages end at `B7FFh`, so the 21 bytes from `B800h` to `B814h`
go with it.

## The startup file

Before the CCP waits for the first line from the keyboard, it reads
`STARTUP.CMD` from drive A and runs the lines in it. The starter card's file
has two lines, the two you saw in Chapter 1:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
PICO.SVC
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
B>mount
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>DIR
NO FILE
B>NOSUCH
NOSUCH?

B>USER 0
B>
```

At each prompt the CCP takes the next line in place of the keyboard. The line
is echoed as it stands in the file, so `mount` appears in small letters, and it
then runs as if typed. The CCP prints a failed line's usual message and the
next line runs. Each line's effects last: `B:` and `USER 3` change the drive
and the user area for the lines after them, so the first prompt you can type at
is `B>`. `MOUNT` runs although `MOUNT.COM` is in user area 0 of drive A,
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
doesn't install counts as a failed command, so a command after it that
starts with `:` is dropped. Here the first line is `PICO.SVC!:MOUNT` on the
board with only a serial terminal:

```sh
printf 'PICO.SVC!:MOUNT\nGLCD.SVC\n' > startup.cmd
cp dist/starter.img chain.img
node tools/tecvol.mjs put chain.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card chain.img -->
```text
A>PICO.SVC!:MOUNT
PICO.SVC?

A>:MOUNT
A>GLCD.SVC
GLCD.SVC?

A>
```

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
user area 0 and puts the console on the serial terminal. The startup file then
runs once, on either kind of reset, and its display line puts the console back
on the display.

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
A>
```

Every recognised reset puts the selection back. A board whose selected drive A
has no display driver therefore stays without one until the board loses power or
you mount the other volume back. That needs `MOUNT.COM` on a drive that is
mounted. On this card it is only on `SYSTEM`, so only a loss of power puts
`SYSTEM` back on drive A.

## Display lines

On a board with the display, a line that names a display driver installs it
and moves the console there:

- `PICO.SVC` makes the PICO9918 the console.
- `GLCD.SVC` makes the graphics LCD the console if no PICO9918 driver is in.
  While a display is the console, this line fails, and only the command
  `CON UC1` installs the file.

Each driver needs its display and the matrix keyboard. Where either is missing
the installation fails, the CCP prints the line's name with a question mark
and the next line runs, so one card starts each of the boards below. The
starter card's two lines give these results on the three boards of
`tools/capture.mjs`:

| Board | `PICO.SVC` | `GLCD.SVC` | Console at the first prompt |
| --- | --- | --- | --- |
| Serial terminal only, `--board serial` | Fails | Fails | `TTY:` |
| Graphics LCD and matrix keyboard, `--board glcd` | Fails | Installs | `UC1:` |
| Both displays and matrix keyboard, `--board pico` | Installs | Fails | `CRT:` |

Until a display's line runs, the banner and the volumes go to the serial
terminal and the 20 × 4 LCD. On a board with both displays, a file with
`GLCD.SVC` first installs both drivers. `PICO.SVC` takes the console whenever it
installs, so the PICO9918 has it. Programs have 1,536 bytes less than with the
starter card's file, which installs one driver:

```sh
printf 'GLCD.SVC\nPICO.SVC\n' > startup.cmd
cp dist/starter.img both.img
node tools/tecvol.mjs put both.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card both.img --board pico SERVICES CON -->
```text
A>GLCD.SVC

A>PICO.SVC

A>SERVICES
PICO 6
GLCD 6
A>CON
CON: CRT: PICO9918
A>
```

The ROM is one image for every board, and the PICO9918's width is the width
`PICO.SVC` was built for. The starter card's is built for 80 columns. A card
for 40 or 32 columns is a different card, made with the driver built for that
width under the same name, `PICO.SVC`. `npm run media` builds those two
drivers as well and writes them to `dist/files` as `PICO40.SVC` and
`PICO32.SVC`, but not to the starter card. `tecvol put` with a fourth argument,
the name on the card, makes a copy of the starter card for 32 columns, and its
PICO9918 wraps a long line at the 32nd column:

```sh
cp dist/starter.img wide32.img
node tools/tecvol.mjs put wide32.img A dist/files/PICO32.SVC PICO.SVC
```

<!-- node tools/capture.mjs --card wide32.img --board pico --screen ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF -->
```text

A>GLCD.SVC
GLCD.SVC?

A>ABCDEFGHIJKLMNOPQRSTUVWXYZ0123
456789ABCDEF
ABCDEFGHIJKLMNOPQRSTUVWXYZ012345
6789ABCDEF?

A>
```

The web page's "Display" and "ROM" controls change the card for you, through
`host/card.mjs`. At each power-on with the PICO9918 chosen, the page writes the
driver built for the chosen width to drive A as `PICO.SVC` when the card has no
`PICO.SVC`, has one of the page's own three builds or has one of an older
format. A `wide32.img` made as above holds one of those builds, so the page
gives it the chosen width. Any other `PICO.SVC` counts as one you built
yourself, and the page keeps it and says so in the serial terminal, so that
card stays at its own width whatever "ROM" says. The page then makes the card's
first line the file for the chosen display, with no line for the other display,
and keeps your other lines. On the
page's board, with both displays, a `GLCD.SVC` line would only give way to
`PICO.SVC` and print `GLCD.SVC?`, and `CON UC1` loads `GLCD.SVC` when you want
the graphics LCD. A display driver chained in one of your lines is taken out and
the rest of the line kept. The piece
taken out passes its own `:` to the piece after it on its line, and a `:` first
on the next line stays if the piece taken out had its own. Any other `:` that
waited on a piece taken out goes, on its line or first on the next, so that
piece runs as an ordinary command. So does a piece with `:` first in your first
line, which would otherwise wait on the display lines.

The page reads only the files of user area 0 on drive A, the area from which
TEC-OS loads `STARTUP.CMD` and the display drivers. It makes its changes on a
copy of the card, and the copy replaces the card only once every change is
made. A card whose drive A is read-only, or whose directory has no room for a file
the page must add, is left as it was, and the page says in the serial terminal that it
boots as it is. When the page can't fetch its builds of the driver, it leaves
the card as it is and says so too.

## The keypad skip

A startup line that hangs, or that resets the board, would run at every boot.
To get past one, hold any key on the hex keypad from the reset until the
prompt appears. With the board's keypad NMI jumper fitted a key press is a
crash, so the skip is for a board with that jumper off, as [Chapter
1](01-introduction.md#running-tec-os-on-a-board) and [Appendix
G](appendix-g-tec-1g.md#the-hex-keypad-and-its-nmi) describe. TEC-OS reads the
keypad's state once, just before it opens the file, about 1.5 seconds after a
reset on the model, and with a key down it doesn't read the file.
`test/startup.test.mjs` runs the case: with a key held, a card whose service
hangs while installing reaches a prompt.

After a skip there are no services. The board has the 20 × 4 LCD and the serial
terminal and nothing else, because the matrix keyboard is read only once a
display's driver is in. So on the board, recovery needs the serial terminal:
`ERA STARTUP.CMD` or a corrected file, and then a reset. Otherwise take the card
to a PC and use `tecvol`. A recognised reset with a skip keeps the drives'
volumes as one without a skip does. The web page has no keypad, so a bad file
there is replaced with "Copy file to drive" or "New starter card".

## Words on the LCD

The 20 × 4 LCD's last row is for a board that may have no terminal attached.
TEC-OS writes one of three words there:

- `PICO?` appears once, at the first prompt after startup, on a board with a
  PICO9918 and a matrix keyboard if no display driver is installed. The
  causes are a driver's file that is missing or bad with no other display
  driver installed, no `STARTUP.CMD`, a file with no display line and a skip.
  That board's screen is dark.
- `GLCD?` appears when `CON UC1` can't load `GLCD.SVC`. The console stays where
  it was.
- `CARD?` appears each time a card won't mount, with the diagnostic prompt of
  Chapter 1.

Here a card with no startup file boots on the web page's board, and a later
`PICO.SVC` clears the word:

```sh
cp dist/starter.img nostart.img
node tools/tecvol.mjs era nostart.img A STARTUP.CMD
```

<!-- node tools/capture.mjs --card nostart.img --board pico --lcd -->
```text
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK
PICO?
```

<!-- node tools/capture.mjs --card nostart.img --board pico --lcd PICO.SVC -->
```text
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK

```

`PICO?` never appears on the board with only a serial terminal or on a board
with no matrix keyboard, where both drivers fail anyway. TEC-OS doesn't write
it either when the graphics LCD has taken the console after a bad `PICO.SVC`,
or after a good load followed by `CON TTY`. A failed `CON UC1` leaves `GLCD?`,
here on the serial board, where the driver's installation fails:

<!-- node tools/capture.mjs --card nostart.img --lcd "CON UC1" -->
```text
A>CON UC1
CON: TTY: serial terminal
A>
--- LCD
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK
GLCD?
```

A display driver that takes the console clears `PICO?` or `GLCD?`, and so does
`GLCD.SVC` loading under `PICO.SVC`, which leaves the console where it is.
Clearing writes blanks only over the word itself. A program that writes the
LCD's last row through the LCD's hardware service replaces the word, and when
a driver later takes the console, that row is left alone. `DEMO`, the program
Chapter 9 describes, is such a program, and its last screen stays through a later `PICO.SVC`. A program that
writes over the word at the LCD's port bypasses TEC-OS, so the next driver to
take the console writes five blanks over the start of the row. `CARD?` goes
when `R` at the diagnostic prompt starts the LCD again, so a retry that works
clears it.

## Installing, listing and removing services

A command that names a file of type `.SVC` installs the service in it. The file
comes from the current drive or from a drive named in the command, such as
`B:NAME.SVC`. The command must include the type, because `NAME` alone makes the
CCP search for the program `NAME.COM`. `NAME.DRV` is an ordinary file
name to the CCP, which searches for a program. `SERVICES` lists what is
installed and `UNLOAD` removes it. On a card with no startup file, on the serial
board, nothing is installed and neither display driver can be:

<!-- node tools/capture.mjs --card nostart.img SERVICES UNLOAD PICO PICO.DRV PICO.SVC -->
```text
A>SERVICES
A>UNLOAD
UNLOAD?

A>PICO
PICO?

A>PICO.DRV
PICO.DRV?

A>PICO.SVC
PICO.SVC?

A>
```

`SERVICES` prints one line for each service, the newest first: its name and
the number of pages it holds. With nothing installed it prints nothing. If a
file doesn't read, isn't a service or fails while installing, the CCP prints
its name with a question mark, whatever the reason. A second driver for a
display that already has one fails the same way. On the card with a second
build of the PICO9918's driver, described below, `PICO40.SVC` fails while
`PICO.SVC` is in.

`UNLOAD` removes the newest service, the one lowest in memory, and the word at
`0006h` goes back to what it held before that service. If that service can't be removed, nothing
changes and `UNLOAD?` is printed. Services therefore go in the opposite order to
their installation, and an older one stays until every newer one has gone. A
warm boot keeps all of them, and a reset empties the list.

The display drivers each have their own rule. `PICO.SVC` can't be removed
while the PICO9918 is the console, since `CON CRT` can't load it back.
`GLCD.SVC`, once it is the newest, can always be removed. If the graphics LCD
is the console, the console goes to the PICO9918 if a PICO9918 driver is in,
and otherwise to the serial terminal:

<!-- node tools/capture.mjs --board pico "CON UC1" SERVICES UNLOAD CON -->
```text
A>CON UC1
CON: UC1: GLCD
A>SERVICES
GLCD 6
PICO 6
A>UNLOAD

A>CON
CON: CRT: PICO9918
A>
```

`CON UC1` installs `A:GLCD.SVC` if it isn't in, which is how a board with both
displays gets the second driver after the first.

A card can hold a second build of the PICO9918's driver under another name,
and then the width can change with no reset, because a PICO9918 driver takes
the console when it installs. This card is a copy of the starter card with the
40-column build from `dist/files` added as `PICO40.SVC`:

```sh
cp dist/starter.img w40.img
node tools/tecvol.mjs put w40.img A dist/files/PICO40.SVC
```

Moving the console to the serial terminal lets `UNLOAD` remove the driver, and
the driver for the new width takes the console back. As one chained line the
change works from the matrix keyboard too:

<!-- node tools/capture.mjs --card w40.img --board pico "CON TTY!UNLOAD!PICO40.SVC!CON" -->
```text
A>CON TTY!UNLOAD!PICO40.SVC!CON
CON: TTY: serial terminal
A>UNLOAD

A>PICO40.SVC

A>CON
CON: CRT: PICO9918
A>
```

## A card from an older TEC-OS

Older cards hold their services in files of type `.DRV`, and this ROM doesn't
load them. The CCP takes `PICO.DRV` as the name of a program and prints it
with a question mark, so the board keeps its console on the serial terminal.
The web page reports such a card when it powers on, naming `PICO.DRV` or
`GLCD.DRV`, for the chosen display, if the card has that file, or else another
of the old display files, and leaves the card as it is.

There are two ways out. "New starter card",
or a new image from `npm run media`, replaces the card. The other way keeps
the card: rename each file `.SVC` and change `STARTUP.CMD` to match, which
works if the file's format, its second byte, is 4, the format this ROM loads.
This image is a copy of the starter card with its display drivers under the
old type:

```sh
cp dist/starter.img old.img
for n in PICO GLCD; do
  node tools/tecvol.mjs put old.img A dist/files/$n.SVC $n.DRV
  node tools/tecvol.mjs era old.img A $n.SVC
done
printf 'PICO.DRV\nGLCD.DRV\n' > startup.cmd
node tools/tecvol.mjs put old.img A startup.cmd --text
```

<!-- node tools/capture.mjs --card old.img --board pico "REN PICO.SVC=PICO.DRV" "REN GLCD.SVC=GLCD.DRV" PICO.SVC CON -->
```text
A>PICO.DRV
PICO.DRV?

A>GLCD.DRV
GLCD.DRV?

A>REN PICO.SVC=PICO.DRV
A>REN GLCD.SVC=GLCD.DRV
A>PICO.SVC

A>CON
CON: CRT: PICO9918
A>
```

`STARTUP.CMD` still names the old files, so the next reset prints the same two
failures until a new file replaces it. The new file comes from `tecvol put` on
a PC or "Copy file to drive" on the web page. There, "Power cycle" does it too
when the chosen display's file is on the card, since the page's rewrite drops
a display line of either type. A file of an older format fails under the new
name too, as `PICO.SVC?`. On the web page with the PICO9918 chosen, a power-on
writes the current `PICO.SVC` over such a file. Otherwise only a new starter
card's copy replaces it.
