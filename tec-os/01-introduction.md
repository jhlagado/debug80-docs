---
title: Introduction and first boot
parent: TEC-OS
nav_order: 1
nav_group: "Part I: Using and programming TEC-OS"
---

# 1. Introduction and first boot

Checked against TEC-OS 621201d, with the starter card's `TED.COM` from Thorium
128edb7 and its `TAS.COM` from Thorium dbee66a.
<!-- TED.COM SHA-256 2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f
     TAS.COM SHA-256 45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2 -->

The TEC-1G starts in MON-3, its monitor ROM, which you work from the hex
keypad. With TEC-OS in the ROM socket instead, the same board is a small disk
computer. You type commands at a prompt, keep files on an SD card and run
programs written for CP/M 2.2. This chapter takes you from what TEC-OS needs to
a running program: you build it, start it, follow the first boot line by line
and run a program.

## CP/M and TEC-OS

CP/M was the operating system of many 8080 and Z80 machines of the late 1970s
and early 1980s. A CP/M program reaches everything outside its own memory
through one interface. To read a key, print a character or read a file, the
program puts a function number in register `C` and calls address `0005h`. That
address leads to the BDOS, the Basic Disk Operating System, which does the work
and returns.

Editors, assemblers, compilers, games and BASIC interpreters were all written
to that interface. TEC-OS implements it as CP/M 2.2 defined it. A CP/M 2.2
program therefore runs on the TEC-1G unchanged when it keeps to three rules. It
uses only the documented interface, takes its memory size from the word at
`0006h` and fits in the memory left for programs. On the starter card, the card
image built with TEC-OS, that memory is 47,268 bytes.

A CP/M system has three parts. The BDOS provides the functions at `0005h`. The
CCP, the Console Command Processor, prints the prompt, reads a command and runs
it. The BIOS, the Basic Input/Output System, is the part written for one
machine: it reads the keyboard, drives the screen and reads and writes the
disk.

A typical CP/M machine loaded the BDOS and the CCP from disk into RAM at start.
On the TEC-1G all three parts are in a 16 KiB ROM at `C000h–FFFFh`. The ROM
also holds the SD card driver, the serial terminal and the keyboard scan. It
holds the hardware services too, which are calls for the board's own devices.
From the card TEC-OS reads the programs you run and a startup file of commands.
It also reads the services you install, which are code added to TEC-OS in
memory.

TEC-OS has more than CP/M 2.2 had:

- Volumes, each an ordinary CP/M disk, held together on one SD card in a
  container. A container holds up to 127 of them, with four on drives at a
  time.
- A block cache of 15 KiB, so a block read from the card once is read again
  from memory.
- A work volume whose writes reach the card in batches.
- A console on the PICO9918 video card, on the 128 × 64 graphics LCD or on a
  serial terminal. The PICO9918's console is in the ROM. The graphics LCD's
  console is a driver loaded from the card.
- Hardware services, numbered calls through the ROM table at `C003h`. With them
  a program reaches the 7-segment digits, the 20 × 4 LCD, the PICO9918's
  graphics, the speaker, the joystick and the clock with no port numbers of its
  own.
- A startup file of commands run before the first prompt.
- A history of the command lines typed at the prompt.

## The board

TEC-OS needs a TEC-1G with 64 KiB of RAM. The board's fixed RAM is 32 KiB at
`0000h–7FFFh`. The other 32 KiB is a RAM chip in socket U9, which the board's
recommended build leaves empty. The chip's two 16 KiB halves, EXPAND 0 and
EXPAND 1, share the addresses `8000h–BFFFh`, and a bit in the board's system
latch selects the half that is there. Programs use EXPAND 0, and so does
TEC-OS's workspace, the memory that holds its variables, buffers and stacks.
TEC-OS keeps its block cache and command history in EXPAND 1.

Cold boot is the start after power-on or a reset. It checks the RAM once,
before it prints anything. It tests `8000h–BFFFh` and then tests for EXPAND 1
behind it. A board with either missing sends `TEC-OS needs 64K RAM` to the
serial port, and TEC-OS stops there.

TEC-OS also needs an SD card in the board's SD card adaptor, and a console. The
console is the device you type on and read from. It can be a terminal program
on a PC connected to the board's FTDI serial port. It can also be a PICO9918
video card or the graphics LCD, each with the matrix keyboard. The 20 × 4
character LCD is never the console, though cold boot writes the version and the
drives there.

## Building TEC-OS

The TEC-OS repository holds the ROM's source, the tools that build the ROM and
the card, the host model and the web page. The host model is a software TEC-1G.
Building needs Node.js 20 or later. From a clone of the repository, three
commands build everything this chapter uses:

```sh
npm ci
npm run build
npm run media
```

`npm ci` installs ATOM, the assembler, and the Debug80 TEC-1G runtime that the
host model runs on. `npm run build` assembles the ROM. `npm run media` writes
the ROM image, the starter card and its files to `dist/`. The starter card is
`dist/starter.img`, an image of a whole SD card.

The starter card holds two programs built outside the repository: `TAS.COM`, an
assembler, and `TED.COM`, an editor. On a fresh clone, run `npm run inputs`
before `npm run media`. It fetches each file into `.inputs/` at the commit that
`test/inputs.json` pins. `npm run media` stops if either file is missing or its
SHA-256 differs from the one in `test/inputs.json`. Chapter 12 lists the other
places the build reads them from.

## Running TEC-OS in a web page

You can try TEC-OS with no board at all. The web page runs the host model at
4 MHz with TEC-OS in its ROM. It draws the board's displays: the PICO9918's
screen, the 7-segment digits, the 20 × 4 LCD, the 8 × 8 LEDs and the graphics
LCD. Below them is a serial terminal. Two more commands build the page and
serve it, the second with Python 3:

```sh
npm run web
python3 -m http.server 8765 --directory web/dist
```

The page is then at `http://localhost:8765`. A click on the PICO9918's screen
sends your typing to the matrix keyboard. The page keeps its SD card in the
browser's storage and saves it every two seconds while the card has changed.
Files you write are still there after a reload. When a save fails, the page
says so under the heading "SD card" and keeps trying. "Download image" keeps a
copy on the PC. Chapter 25 describes the page's storage and what it does when
a save fails.

These are the page's controls:

- "Display" selects a board with a PICO9918 or one with only the graphics LCD.
- "ROM" selects the PICO9918's width: 80, 40 or 32 columns.
- "Reset" is the board's reset button, which leaves the RAM as it is.
- "Power cycle" turns the board off and on, which loses what the RAM held.
- "Pause" stops the Z80 and starts it again.
- "New starter card" builds a fresh card from the page's recipe, a file
  listing the card's contents: the starter card's six files and `DEMO.COM`,
  which Chapter 9 describes. It checks each file against the SHA-256 the
  recipe records.
- "Open image" loads a card image from the PC, and "Download image" saves the
  page's card to the PC.
- "Copy file to drive" writes files from the PC onto the volume on the drive
  selected in "Drive", as text if "as text" is ticked. It saves the changed
  card in the browser and then presses reset so that TEC-OS reads it. When
  the save fails, the page shows `Not copied` under "SD card", and the card is
  as it was.

Changing the display or the width turns the board off and on. At each power-on
the page rewrites the card's startup file so that it names the chosen display,
as Chapter 5 describes.

## Running TEC-OS from Node.js

The web page and the tests run the same host model, `host/machine.mjs`. The
script `tools/capture.mjs` runs it from a PC's command line with no browser. It
boots the model with the starter card, types the commands it is given and
prints everything TEC-OS sends to the console. The book's examples come from
it:

```sh
node tools/capture.mjs DIR
```

With no options the board has a serial terminal and nothing else. `--board
pico` adds the PICO9918, the graphics LCD and the matrix keyboard, as on the
web page. `--lcd` prints the 20 × 4 LCD's rows at the end, `--screen` the
display's text and `--serial` what left the serial port. `--card none` boots
with the socket empty. The comment at the top of the script lists the rest. On
stderr the script prints the card's SHA-256, which shows whether your card is
the one an example was captured from. A run of a few commands takes about a
second.

## Running TEC-OS on a board

TEC-OS has not yet run on a physical TEC-1G, so what follows comes from the
code and the repository's documents.

On a TEC-1G, TEC-OS replaces MON-3. Its image is `dist/tecos.rom`, 16 KiB for
`C000h–FFFFh`. The same image runs on the board, in the host model and in the
web page. In a 32 KiB ROM chip the image goes into both halves, at `0000h` and
at `4000h`, so the board's ROM Lo/Hi switch runs it in either position.

The repository also has a diagnostics ROM for testing a board's hardware.
`npm run diag` builds it into `build/diag/diag.rom`. `docs/board-run.md` is the
plan for running it. It describes the ROM chip, its jumpers and the board's
switches, which are set the same way for TEC-OS.

TEC-OS takes the whole SD card. `tecvol`, the card tool in the repository,
writes the starter card's image to it from the PC:

```sh
node tools/tecvol.mjs install dist/starter.img /dev/rdiskN --yes
```

`/dev/rdiskN` stands for the card's device on the PC. `install` overwrites the
device from its first block, so check the device name twice before you run the
command.

For a serial console, connect the board's FTDI port to the PC. Set the terminal
program to 4800 baud, 8 data bits, no parity and 2 stop bits. The serial timing
is counted in the Z80's clock cycles, so the link works only with the CPU clock
switch on FAST and the 4 MHz oscillator.

A board with the matrix keyboard has its Matrix configuration switch on. Cold
boot reads the switch, bit 0 of port `03h`, and TEC-OS reads the matrix
keyboard only when it is on. With the switch off the PICO9918's console doesn't
start, the graphics LCD's driver fails to install and the console stays on the
serial terminal.

Keep off the hex keypad while a program runs. With the board's keypad NMI
jumper fitted, a key press interrupts the Z80 at `0066h`, and TEC-OS has no
handler there. That address is inside CP/M's default file control block at
`005Ch`, the block of memory that names a file for a program.
`docs/board-run.md` lists TEC-OS as running with that jumper off.

## The first boot

At reset the TEC-1G shows the first 2 KiB of the ROM at `0000h` as well as at
`C000h`. The Z80 starts at `0000h`, so it runs ROM code. The first instruction
jumps to the ROM's own address above `C000h`, where cold boot begins. Cold boot
turns the copy at `0000h` off and leaves RAM there. It then checks the RAM at
`8000h–BFFFh`, clears the workspace, starts the console and prints the banner.
This is the whole of a first boot on a board with only a serial terminal:

<!-- node tools/capture.mjs -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>
```

The first line is the banner, with the version, 0.1. Cold boot starts the
console on the PICO9918 when the board has one and the matrix keyboard, and on
the serial terminal otherwise. The banner goes to that console.

The next two lines are the volumes on the drives. A volume is one CP/M disk
inside the container on the card. A drive is one of the letters `A` to `D`
through which programs reach a volume. The starter card has two volumes:
`SYSTEM`, of 1 MiB, on drive A and `WORK`, of 8 MiB, on drive B. Each line
gives the drive and the volume's label, which has 11 characters padded with
spaces. A read-only volume has ` (read-only)` after its label. Before it prints
these lines, cold boot starts the card and checks the header of the container,
which Chapter 4 describes.

The 20 × 4 LCD shows the version and the drives at the same time:

<!-- node tools/capture.mjs --lcd -->
```text
TEC-OS 0.1  TEC-1G
A: SYSTEM
B: WORK
```

After a blank line comes the prompt, `A>`. The letter is the current drive, the
one a command uses when it names a file with no drive. Here the prompt is
followed at once by `GLCD.SVC`, though nobody typed it. The CCP reads the file
`STARTUP.CMD` from drive A before it waits for the first line from the
keyboard. It takes the file's first 128 bytes and runs each line as a command,
echoed after the prompt as if you had typed it. The starter card's
`STARTUP.CMD` has one line, `GLCD.SVC`.

A command that names a `.SVC` file installs a service from that file. TEC-OS
loads the service into memory below the BDOS, where it stays until a reset or
until the `UNLOAD` command removes it. A service that drives hardware is a
driver. `GLCD.SVC` holds the graphics LCD's console, and it makes the graphics
LCD the console unless the PICO9918 has it.

This board has no graphics LCD, so the installation fails. A command that fails
is normally printed back with a question mark. A line from `STARTUP.CMD` whose
driver finds no device fails quietly, so here the line is followed only by the
blank line before the next prompt. The console stays on the serial terminal.
The startup file is read once after cold boot, and a program's exit doesn't run
it again.

## The first boot with a PICO9918

The web page's board has a PICO9918, the graphics LCD and the matrix keyboard,
and there the boot goes differently. The PICO9918's console is in the ROM, and
cold boot starts it before the banner, so the PICO9918 shows the whole boot:

<!-- node tools/capture.mjs --board pico --screen -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>GLCD.SVC

A>
```

From the banner on, TEC-OS writes to the PICO9918 and reads the matrix keyboard
in place of the serial port. The serial terminal shows nothing at all, so a
board with a PICO9918 and the matrix keyboard needs no terminal attached.

Here the PICO9918 is already the console, so the `GLCD.SVC` line installs
nothing and passes quietly. No driver stays in memory. The command `CON UC1`
loads `GLCD.SVC` and moves the console to the graphics LCD. Chapter 5 gives the
rules for display drivers. The web page's own card has no `GLCD.SVC` line
when the PICO9918 is chosen, so the page's screen shows the banner, the volumes
and the prompt and nothing else.

A display driver takes memory below the BDOS, which leaves less for programs.
CP/M calls the memory a program may use the TPA, the Transient Program Area. On
the starter card with no service it is 47,268 bytes, and with `GLCD.SVC`
installed it is 46,336. The PICO9918's console costs programs nothing, because
its code is in the ROM and its state in TEC-OS's workspace. Chapter 7 explains a
program's memory and where each byte goes.

## The starter card

`DIR` lists the files on the current drive:

<!-- node tools/capture.mjs DIR -->
```text
A>DIR
MOUNT.COM    GLCD.SVC     STARTUP.CMD  TED.COM      SAMPLE.ASM   TAS.COM
6 files, 980K free
A>
```

A file name has up to eight characters, a full stop and a type of up to three.
A file of type `.COM` is a program, and its name without the type is the
command that runs it. The listing's last line gives the number of files and the
space left on the drive. These are the starter card's six files:

- `STARTUP.CMD` holds the command the first boot ran.
- `GLCD.SVC` is the graphics LCD's driver. The PICO9918 needs no file, and
  Chapter 2 describes its widths of 80, 40 and 32 columns.
- `MOUNT.COM` lists the card's volumes and puts a volume on a drive, as
  Chapter 4 describes.
- `TAS.COM` is an assembler and `TED.COM` an editor. Chapter 6 describes
  writing and building a program with them on the TEC-1G.
- `SAMPLE.ASM` is the source of a short program, a text file that `TAS`
  assembles in the next section.

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
*written behind*: TEC-OS keeps what a program writes to it in the block cache
and writes it to the card later. One of those times is a `^C`, Ctrl and C
together, typed at the prompt. It writes every change the cache holds to the
card and starts the CCP again. Type `^C` at the prompt before you press reset,
turn the board off or take the card out, and every change is on the card.
Chapter 4 explains the cache and what a power cut can lose.

## Running a program

`MOUNT` is a program. Typed with no argument it lists the volumes on the card,
each with its number, its label, its size and the drive it is on. Chapter 4
explains the list:

<!-- node tools/capture.mjs MOUNT -->
```text
A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>
```

When a program ends, TEC-OS runs a warm boot. It writes the cache's changes to
the card, starts the CCP again and prints the prompt with the same drive and
user area as before. A user area is one of 16 groups, numbered 0 to 15, into
which CP/M divides the files on a drive. Chapter 3 explains user areas. The
`^C` at the prompt is a warm boot too, and so is a `^C` typed as the first key
of a line that a program reads with BDOS function 10, CP/M's line input.
Chapter 14 explains the warm boot.

`SAMPLE.ASM` becomes a program in two commands. `TAS SAMPLE` assembles the
source into `SAMPLE.COM` on the same drive, and `SAMPLE` runs it:

<!-- node tools/capture.mjs --lcd "TAS SAMPLE" SAMPLE -->
```text
A>TAS SAMPLE
SAMPLE.COM written

A>SAMPLE
Hello from TEC-OS.
Screen: 0 by 0
Back to the prompt.

A>
```

`SAMPLE` prints its lines on the console. It reaches the board's own devices
through the hardware services that Chapter 9 describes. It reads the screen's
size, which is 0 by 0 on the serial terminal and 80 by 24 on the PICO9918. It
writes `Hello from SAMPLE` on the second row of the 20 × 4 LCD, shows `123456`
on the 7-segment digits for about a second and beeps. After the run the LCD
shows this:

<!-- the same run's --lcd output -->
```text
TEC-OS 0.1  TEC-1G
Hello from SAMPLE
B: WORK
```

`TAS` also writes `SAMPLE.DBG`, a debug file, beside `SAMPLE.COM`, so drive A
then holds eight files. Chapter 6 explains how a program such as this one is
written.

A command that is neither built into the CCP nor a program file is printed
back with a question mark. The CCP searches for the file on the current drive
and then on drive A:

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
CON: TTY:
A>
```

`TTY:` is the serial terminal. With the PICO9918 as the console the reply is
`CON: CRT:`, and with the graphics LCD it is `CON: UC1:`. Chapter 2 explains
the console devices and moving the console from one to another.

## Reset and power

Pressing reset runs cold boot again. The console starts as it did at power-on.
The banner, the volumes and the startup file's lines appear, and the prompt is
on drive A in user area 0. One thing survives a reset pressed after TEC-OS has
reached a prompt: the choice of volume on each drive. A volume put on a drive
while TEC-OS ran is on that drive again after the reset, as long as the card
still has it. Everything else TEC-OS holds in memory is rebuilt, the cache
included, so a change that hadn't reached the card is lost. Turning the board
off loses the RAM, and the drives then hold the volumes the card's header
names. Chapter 4 describes how volumes move between drives.

Never change a card on a PC while the TEC-1G is using it. TEC-OS holds a map of
each drive's free space in memory, and a change made on the PC leaves the card
out of step with that map. Take the card out after a `^C` at the prompt, and
press reset after you put a changed card back.

## A card that won't mount

Cold boot stops after the banner when the card doesn't answer or its contents
fail the checks. It prints the diagnostic prompt on the console, which on a
board with the PICO9918 and the matrix keyboard is the PICO9918's screen. Here
the socket is empty:

<!-- node tools/capture.mjs --card none --lcd -->
```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 01
R retry> 
```

The number after `error` is a code in hexadecimal. Codes `01` to `04` and `0B`
come from the SD card driver, and each names the step of starting the card that
failed. `01` is no answer to the first command sent to the card, which is what
an empty socket gives. Codes `20` to `2A` come from the checks on the
container. `21` is a block 0 that doesn't start with the container's name,
`TECOSVOL`, and `2A` is a card with no volume for drive A. Appendix D lists
them all.

`R` or `r` starts cold boot again from the point where it sets up the LCD and
the card. After you fix or insert the card, `R` reaches the prompt without a
reset. Each key typed at the diagnostic prompt is echoed after it. Any key but `R`
or `r` then prints the prompt again on the next line. While TEC-OS waits
there, the LCD's last row shows `CARD?`, for a board with no terminal attached:

<!-- the same run's --lcd output -->
```text
TEC-OS 0.1  TEC-1G


CARD?
```

On such a board, fit a working card and press reset, and cold boot goes on to
the prompt.
