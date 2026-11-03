---
title: Introduction and first boot
parent: TEC-OS
nav_order: 1
nav_group: "Part I: Using and programming TEC-OS"
---

# 1. Introduction and first boot

Checked against TEC-OS 60e0768, with the starter card's `TED.COM` from Thorium
676075a and its `TAS.COM` from Thorium dbee66a. `TED.COM`'s SHA-256 is
`373d866bb667b26370933d494d3e0fca5af8f330090b085182ad450d952ac64a`, and
`TAS.COM`'s is
`45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`.

The TEC-1G starts in MON-3, its monitor ROM, which you work from the hex
keypad. With TEC-OS in the ROM socket instead, the same board is a small disk
computer: you type commands at a prompt, keep files on an SD card and run
programs written for CP/M 2.2. This chapter explains what TEC-OS is and what
it needs. You then build it, start it, follow the first boot line by line and
run a program.

## CP/M and TEC-OS

CP/M was the operating system of many 8080 and Z80 machines of the late 1970s
and early 1980s. A CP/M program reaches everything outside its own memory
through one interface. To read a key, print a character, open a file or read
128 bytes of the file, the program puts a function number in register `C` and
calls address `0005h`. That address leads to the BDOS, the Basic Disk
Operating System, which does the work and returns.

Many programs were written to that interface: editors, assemblers, compilers,
games and BASIC interpreters. TEC-OS implements the interface as CP/M 2.2
defined it, so a CP/M 2.2 program runs on the TEC-1G unchanged if it uses only
the documented interface, sizes its memory from the word at `0006h` and fits
in the memory left for programs. The starter card, the card image built with
TEC-OS, leaves 46,869 bytes.

A CP/M system has three parts. The BDOS provides the functions at `0005h`, and
the CCP, the Console Command Processor, prints the prompt, reads a command and
runs it. The BIOS, the Basic Input/Output System, is the part written for one
machine: it reads the keyboard, drives the screen and reads and writes the
disk.

On a typical CP/M machine the BDOS and the CCP were loaded from the disk into
RAM when the machine started, but on the TEC-1G all three are in a 16 KiB ROM
at `C000h–FFFFh`. The ROM also holds the driver for the SD card, the serial
terminal, the keyboard scan and the hardware services, calls for the board's
own devices. From the card TEC-OS reads the programs you run, a startup file of
commands and the services you install, which are code added to TEC-OS in
memory.

TEC-OS has more than CP/M 2.2 had:

- Volumes, each an ordinary CP/M disk, held together on one SD card in a
  container. A container holds up to 127 of them, with four on drives at a
  time.
- A block cache of 15 KiB, so that a block read from the card once is read
  again from memory.
- A work volume whose writes reach the card in batches.
- A console on the PICO9918 video card, on the 128 × 64 graphics LCD or on a
  serial terminal. Each display's console is a driver loaded from the card.
- Hardware services, numbered calls through the ROM table at `C003h`. With them
  a program reaches the 7-segment digits, the 20 × 4 LCD, the PICO9918's
  graphics, the speaker, the joystick and the clock with no port numbers of its
  own.
- A startup file of commands run before the first prompt.
- A history of the command lines typed at the prompt.

## The board

TEC-OS needs a TEC-1G with 64 KiB of RAM. The board's fixed RAM is 32 KiB at
`0000h–7FFFh`, and the other 32 KiB is a RAM chip in socket U9, which the
board's recommended build leaves empty. The chip's two 16 KiB halves, EXPAND 0
and EXPAND 1, share the addresses `8000h–BFFFh`, and a bit in the board's
system latch selects the half that is there. Programs and TEC-OS's workspace,
the memory that holds its variables, buffers and stacks, use EXPAND 0, and
TEC-OS holds its block cache and command history in EXPAND 1.

Cold boot, the start after power-on or a reset, checks the RAM once, before
it prints anything. It tests `8000h–BFFFh` and then looks for EXPAND 1 behind
it. A board without either sends `TEC-OS needs 64K RAM` to the serial port,
and TEC-OS stops there.

TEC-OS also needs an SD card on the board's SD card adaptor and a console, the
device you type on and read from. The console is a terminal program on a PC
connected to the board's FTDI serial port, but it can also be a PICO9918 video
card or the graphics LCD, each with the matrix keyboard. The 20 × 4 character
LCD is never the console, though at cold boot TEC-OS writes its version and
the drives there.

## Building TEC-OS

The TEC-OS repository holds the ROM's source, the tools for building it and the
card, the host model, a software TEC-1G, and the web page. Building it requires
Node.js 20 or later, and from a clone of the repository three commands build
everything this chapter uses:

```sh
npm ci
npm run build
npm run media
```

`npm ci` installs the assembler, ATOM, and the Debug80 TEC-1G runtime that the
host model runs on. `npm run build` assembles the ROM, and `npm run media`
writes the ROM image, the starter card and its files to `dist/`. The starter
card is `dist/starter.img`, an image of a whole SD card.

The starter card holds `TAS.COM`, an assembler, and `TED.COM`, an editor, both
programs that run on TEC-OS and are built outside the repository.
`npm run media` reads them from the paths in the environment variables
`TAS_COM` and `TED_COM`, or else from `../thorium/dist/TAS.COM` and
`../thorium/dist/TED.COM`, beside the clone. The command stops if either file
isn't there or if its SHA-256 differs from the one in `test/inputs.json`.

## Running TEC-OS in a web page

You can try TEC-OS with no board at all, because the web page runs the host
model at 4 MHz with TEC-OS in its ROM. The page draws the board's displays,
which are the PICO9918's screen, the 7-segment digits, the 20 × 4 LCD, the 8 ×
8 LEDs and the graphics LCD, and below them it has a serial terminal. Two more
commands build the page and serve it, the second with Python 3:

```sh
npm run web
python3 -m http.server 8765 --directory web/dist
```

The page is then at `http://localhost:8765`, and a click on the PICO9918's
screen sends your typing to the matrix keyboard. The page keeps its SD card in
the browser's storage, saving it every two seconds while the card has changed,
so files written on the card are still there after a reload. A save that the
browser refuses goes unreported on the page: the page writes a warning to the
browser's console once and carries on with the card in memory, and it doesn't
try that save again. A reload then brings back the card as it was last saved,
so "Download image" is the way to keep a copy you can't afford to lose. These
are its controls:

- "Display" selects a board with a PICO9918 or one with only the graphics LCD.
- "ROM" selects the PICO9918's width: 80, 40 or 32 columns.
- "Reset" is the board's reset button, which leaves the RAM as it is.
- "Power cycle" turns the board off and on and so loses what the RAM held.
- "Pause" stops the Z80 and starts it again.
- "New starter card" builds a fresh card from the page's recipe, a file
  listing the card's contents: the starter card's six files and `DEMO.COM`,
  which Chapter 9 describes. It checks each file against the SHA-256 the
  recipe records.
- "Open image" loads a card image from the PC, and "Download image" saves the
  page's card to the PC.
- "Copy file to drive" writes files from the PC onto the volume on the drive
  selected in "Drive", as text if "as text" is ticked. It then presses reset
  so that TEC-OS reads the changed card.

When you change the display or the width, the page turns the board off and on.
At each power-on with the PICO9918 chosen, the page writes the driver built for
the chosen width to drive A as `PICO.SVC` when the card has no `PICO.SVC`, has
one of the page's own builds at another width or has one of an older format.
Any other `PICO.SVC` is one the card's owner built, and the page keeps it and
says so in brackets in the serial terminal. The page also makes the chosen
display's driver the only display line in the card's startup file, as its first
line.

## Running TEC-OS from Node.js

The web page and the tests run the same host model, `host/machine.mjs`. For a
run with no browser, the script `tools/capture.mjs` boots the model from a PC's
command line with the starter card, types the commands it is given and prints
everything TEC-OS sent to the console. The book's examples come from it:

```sh
node tools/capture.mjs DIR
```

With no options the board has a serial terminal and nothing else: no PICO9918,
no graphics LCD and no matrix keyboard. `--board pico` gives it the PICO9918,
the graphics LCD and the matrix keyboard, as the web page has. `--lcd` prints
the 20 × 4 LCD's rows at the end, `--screen` the display's text and `--serial`
what left the serial port. `--card none` boots with the socket empty. The
comment at the top of the script lists the rest. On stderr the script prints the
card's SHA-256, which shows whether your card is the one an example was
captured from. A run of a few commands takes about a second.

## Running TEC-OS on a board

TEC-OS has not yet run on a physical TEC-1G, so what follows comes from the
code and the repository's documents.

On a TEC-1G, TEC-OS replaces MON-3, and its image is `dist/tecos.rom`, 16 KiB
for `C000h–FFFFh`. The same image runs on the board, in the host model and in
the web page. In a 32 KiB ROM chip the image goes into both halves, at `0000h`
and at `4000h`, so that the board's ROM Lo/Hi switch runs it in either
position.

The repository also has a diagnostics ROM for testing a board's hardware,
built by `npm run diag` into `build/diag/diag.rom`. `docs/board-run.md` is the
plan for running the diagnostics ROM, and it describes the ROM chip, its
jumpers and the board's switches, which are set the same way for TEC-OS.

The SD card is given over to TEC-OS whole. `tecvol`, the card tool in the
repository, writes the starter card's image to it from the PC:

```sh
node tools/tecvol.mjs install dist/starter.img /dev/rdiskN --yes
```

`/dev/rdiskN` stands for the card's device on the PC. `install` overwrites the
device from its first block, so check the device name twice before you run the
command.

For a serial console, connect the board's FTDI port to the PC and set the
terminal program to 4800 baud, 8 data bits, no parity and 2 stop bits. The
serial timing is counted in the Z80's clock cycles, so the link works only
with the CPU clock switch on FAST and the 4 MHz oscillator.

A board with the matrix keyboard has its Matrix configuration switch on. Cold
boot reads the switch, bit 0 of port `03h`, and TEC-OS reads the matrix
keyboard only when the switch is on. With it off, both display drivers fail to
install and the console stays on the serial terminal.

Keep off the hex keypad while a program runs. With the board's keypad NMI
jumper fitted, a key press interrupts the Z80 at `0066h`, and TEC-OS has no
handler there. That address is inside CP/M's default file control block at
`005Ch`, the block of memory that names a file for a program.
`docs/board-run.md` lists TEC-OS as running with that jumper off.

## The first boot

At reset the TEC-1G shows the first 2 KiB of the ROM at `0000h` as well as at
`C000h`, so the Z80, which starts at `0000h`, runs ROM code. The first
instruction jumps to cold boot at its address in the ROM, above `C000h`. Cold
boot turns the copy at `0000h` off, leaving RAM there, and then checks the RAM
at `8000h–BFFFh`, clears the workspace, starts the serial terminal and prints
the banner. Here is the whole of a first boot on a board with only a serial
terminal:

<!-- node tools/capture.mjs -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>PICO.SVC
PICO.SVC?

A>GLCD.SVC
GLCD.SVC?

A>
```

The first line is the banner, with the version, 0.1. After a reset the console
is always the serial terminal, so the banner goes there on every board.

The next two lines are the volumes on the drives. A volume is one CP/M disk
inside the container on the card, and a drive is one of the letters `A` to `D`
through which programs reach a volume. The starter card has two volumes:
`SYSTEM`, of 1 MiB, on drive A and `WORK`, of 8 MiB, on drive B. Each line is
the drive and the volume's label, which has 11 characters, padded with spaces,
and a read-only volume has ` (read-only)` after its label. Before it prints
these lines, cold boot starts the card and checks the header of the container,
which Chapter 4 describes.

The 20 × 4 LCD shows the version and the drives at the same time:

<!-- node tools/capture.mjs --lcd -->
```text
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK
```

After a blank line comes the prompt, `A>`. The letter is the current drive,
the one a command uses when it names a file with no drive. Here the prompt is
followed at once by `PICO.SVC`, though nobody typed it. Before the CCP waits
for the first line from the keyboard, it reads the first 128 bytes of the file
`STARTUP.CMD` from drive A, if the file is there, and runs each line as a
command, echoed after the prompt as if it had been typed. The starter card's
`STARTUP.CMD` has two lines, `PICO.SVC` and `GLCD.SVC`.

A command that names a `.SVC` file installs a service from that file: TEC-OS
loads the service from the card into memory below the BDOS, where it stays
until a reset or until the `UNLOAD` command removes it. A service that drives
hardware is a driver. `PICO.SVC` holds the PICO9918's console at 80 columns and
makes the PICO9918 the console when it is installed. `GLCD.SVC` holds the
graphics LCD's console and makes the graphics LCD the console unless `PICO.SVC`
is in.

This board has neither display nor a matrix keyboard, so both installations
fail and the CCP prints the name of each failed command with a question mark:
`PICO.SVC?` and `GLCD.SVC?`. The console stays on the serial terminal. The
startup file is read only once, after cold boot, and a program's exit doesn't
run it again.

## The first boot with a PICO9918

The web page's board has a PICO9918, the graphics LCD and the matrix keyboard,
and there the boot goes differently. Its serial terminal shows this:

<!-- node tools/capture.mjs --board pico --serial -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>PICO.SVC

```

When `PICO.SVC` installs, the PICO9918 becomes the console, and from then on
TEC-OS writes nothing more to the serial terminal and reads the matrix keyboard
in place of the serial port. The BIOS clears the screen when `PICO.SVC` takes
the console, so the PICO9918 shows only what followed:

<!-- node tools/capture.mjs --board pico --screen -->
```text

A>GLCD.SVC
GLCD.SVC?

A>
```

`GLCD.SVC` fails here because the PICO9918 is already the console. The
graphics LCD's driver installs only while the console is the serial terminal,
or for the command `CON UC1`, which moves the console to the graphics LCD.
Chapter 5 gives the rules for display drivers. The web page's own card has no
`GLCD.SVC` line, because the page leaves only the chosen display's line in its
startup file, and so the page's screen shows the prompt alone after the boot.

A display driver takes 1,536 bytes of memory below the BDOS, which leaves less
for programs. CP/M calls the memory a program may use the TPA, the Transient
Program Area. It starts at `0100h` and ends below the address in the word at
`0006h`, which is the BDOS's entry or, with a service installed, the lowest
service's jump to it. On the starter card with no service the word is `B815h`,
and programs have 46,869 bytes. With `PICO.SVC` installed it is `B200h`, and
programs have 45,312: the driver's pages end at `B7FFh`, so the 21 bytes from
`B800h` to `B814h` go too. Chapter 7 explains a program's memory.

A board with a PICO9918 and the matrix keyboard has a dark screen if no display
driver was installed by the time of the first prompt, and the 20 × 4 LCD's last
row then shows `PICO?`. That board may have no serial terminal attached.

## The starter card

`DIR` lists the files on the current drive:

<!-- node tools/capture.mjs DIR -->
```text
A>DIR
MOUNT.COM    PICO.SVC     GLCD.SVC     STARTUP.CMD  TED.COM      TAS.COM
6 files, 984K free
A>
```

A file name has up to eight characters, a full stop and a type of up to three.
A file of type `.COM` is a program, and its name without the type is the
command that runs it. The last line of the listing is the number of files and
the space left on the drive. The starter card's six files are these:

- `STARTUP.CMD` holds the commands the first boot ran.
- `PICO.SVC` and `GLCD.SVC` are the display drivers. The starter card's
  `PICO.SVC` draws 80 columns, and Chapter 5 describes a card made for 40 or
  32.
- `MOUNT.COM` lists the card's volumes and puts a volume on a drive, as
  Chapter 4 describes.
- `TAS.COM` is an assembler and `TED.COM` an editor. Chapter 6 describes
  writing and building a program with them on the TEC-1G.

A drive letter and a colon, typed alone, change the current drive:

<!-- node tools/capture.mjs B: DIR A: -->
```text
A>B:
B>DIR
NO FILE
B>A:
A>
```

Drive B is empty, and it is the place for your own files. Its volume is
*written behind*: TEC-OS holds what a program writes to it in the block cache
and writes it to the card later, at times that Chapter 4 lists. One of them is
a `^C`, Ctrl and C together, typed at the prompt, which ends the CCP, writes to
the card every change the cache holds and starts the CCP again.
A `^C` at the prompt before you press reset, turn the board off or take the
card out therefore puts every change on the card. Chapter 4 explains the cache
and what a power cut can lose.

## Running a program

`MOUNT` is a program, and typed with no argument it lists the volumes on the
card, each with its number, its label, its size and the drive it is on.
Chapter 4 explains the list:

<!-- node tools/capture.mjs MOUNT -->
```text
A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>
```

When a program ends, TEC-OS runs a warm boot: it writes the cache's changes to
the card, starts the CCP again and prints the prompt with the same drive and
user area as before. A user area is one of 16 groups, numbered 0 to 15, into
which CP/M divides the files on a drive, and Chapter 3 explains them. The `^C`
at the prompt is a warm boot too, and so is a `^C` typed as the first key of a
line that a program reads with BDOS function 10, CP/M's line input. Chapter 14
explains the warm boot.

A command that is neither built into the CCP nor the name of a program file on
the current drive or on drive A is printed back with a question mark:

<!-- node tools/capture.mjs NOSUCH -->
```text
A>NOSUCH
NOSUCH?

A>
```

`CON` names the console in use:

<!-- node tools/capture.mjs CON -->
```text
A>CON
CON: TTY: serial terminal
A>
```

`TTY:` is the serial terminal. With the PICO9918 as the console the reply is
`CON: CRT: PICO9918`, and with the graphics LCD it is `CON: UC1: GLCD`.
Chapter 2 explains the console devices and moving the console from one to
another.

## Reset and power

Pressing reset runs cold boot again, so the banner, the volumes and the startup
file's lines appear, the console starts on the serial terminal and the prompt is
on drive A in user area 0. One thing survives a reset pressed after TEC-OS has
reached a prompt: the selection of volumes on the drives. A volume put on a
drive while TEC-OS ran is on that drive again after the reset, as long as the
card still has it. Everything else TEC-OS holds in memory, the cache included,
is rebuilt, so a change in the cache that hadn't reached the card is lost.
Turning the board off loses the RAM, and the drives then hold the volumes the
card's header names. Chapter 4 describes how volumes are moved between drives.

A card must never be changed on a PC while the TEC-1G is using it. TEC-OS
holds a map of each drive's free space in memory, and after a change made on
the PC the card no longer matches the map. So take the card out after a `^C`
at the prompt, and press reset after putting a changed card back.

## A card that won't mount

When the card doesn't answer, or its contents don't pass the checks, cold boot
stops after the banner and prints the diagnostic prompt. Here the socket is
empty, and `H` was typed at the prompt:

<!-- node tools/capture.mjs --card none --lcd H -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 01
R retry, H header> H
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 
00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 
R retry, H header> 
```

The number after `error` is a code in hexadecimal. Codes `01` to `04` come from
the SD card driver and identify the step of starting the card that failed. `01`
is no answer to the first command sent to the card, which is what an empty
socket gives. Codes `20` to `2A` come from the checks on the container: `21` is
a block 0 that doesn't start with the container's name, `TECOSVOL`, and `2A` is
a card with no volume for drive A. Appendix D lists them all.

`H` prints the first 64 bytes of the last block read from the card, in
hexadecimal, and they show whether the card holds a TEC-OS container at all.
With no card no block was read, so the bytes are zeros. `R` starts cold boot
again from the point where it sets up the LCD and the card, so after you fix
or insert the card `R` reaches the prompt without a reset. While TEC-OS waits
at the diagnostic prompt, the LCD's last row shows `CARD?`, for a board with
no terminal attached:

<!-- the same run's --lcd output -->
```text
TEC-OS 0.1  TEC-1G


CARD?
```
