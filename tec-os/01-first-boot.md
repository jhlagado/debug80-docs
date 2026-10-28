---
title: First boot
parent: TEC-OS
nav_order: 1
---

# First boot

This chapter starts TEC-OS, looks around the starter card and runs a
program. You can follow it in a web browser or on a TEC-1G. The commands and
their output are the same in both.

## Running TEC-OS in a browser

The TEC-OS repository builds a web page that runs the Debug80 TEC-1G model
at 4 MHz with TEC-OS in its ROM. The page shows the PICO9918's screen, the
7-segment digits, the 20 × 4 LCD, the 8 × 8 LEDs, the graphics LCD and a
serial terminal. You need Node.js 20 or later and Python 3 to serve the page.
From a clone of the repository:

```sh
npm ci
npm run build
npm run media
npm run web
python3 -m http.server 8765 --directory web/dist
```

`npm run build` assembles the ROM images and `npm run media` writes the
starter card and its files to `dist/`. `npm run web` builds the page and the
last command serves it at `http://localhost:8765`.

Click the screen to give it the keyboard, and type. The page keeps its SD
card in the browser's storage, so files you save survive a reload. Its "New
starter card" button builds a fresh card from the starter recipe, checking
each file against the SHA-256 the recipe records.

## Running TEC-OS on a board

On a TEC-1G, TEC-OS replaces MON-3 in the ROM socket. Its image for a stock
board is `tecos-board.rom` in `dist/`. The board needs its 32 KiB RAM chip in
U9, as the introduction describes.

The card is a whole SD card given over to TEC-OS. `tecvol`, the card tool in
the repository, writes the starter card's image to it from a PC:

```sh
node tools/tecvol.mjs install dist/starter.img /dev/rdiskN --yes
```

Here `/dev/rdiskN` stands for the card's device on the PC. `install`
overwrites the device from its first block, so check the device name twice
before you run it.

TEC-OS chooses its console at power-on. With the board's Matrix switch on,
it uses the PICO9918 if one answers, otherwise the graphics LCD if that
answers. With the switch off, or with neither display fitted, it uses the
serial port. For a serial console, connect the board's FTDI port to a PC and
set the terminal program to 4800 baud, 8 data bits, no parity and 2 stop
bits.

## The first prompt

Whichever way you start it, TEC-OS greets you the same way:

```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>
```

The first line is the banner, with the version. The next two lines are the
volumes TEC-OS found on the card and the drives it mounted them on. The
starter card has two: a 1 MiB volume named `SYSTEM` on drive A and an 8 MiB
volume named `WORK` on drive B. The 20 × 4 LCD shows the same banner and
drives at start-up, whatever the console is.

`A>` is the prompt. The letter is the current drive, the one TEC-OS reads
and writes when a command names a file without a drive.

## Looking at the card

`DIR` lists the files on the current drive:

```text
A>DIR
TERM.COM     PROBE.COM    DEMO.COM     MOUNT.COM    VOLS.COM     GLCD.PRL
EDIT.COM     README.TXT
8 files, 994K free
A>
```

`TYPE` prints a text file. The starter card's `README.TXT` describes the
other files:

```text
A>TYPE README.TXT
TEC-OS starter disk

COPY SOURCE DEST   copy a file (built in), for example COPY TERM.COM B:TERM.COM
TERM               draw on the video console; TERM S also scrolls
PROBE              exercise the BDOS file functions
DEMO               the LCD, digits, 8x8 LEDs and PICO9918; any key stops
EDIT NAME.TXT      full-screen editor, if present: ^S save, ^Q quit
VOLS               list the card's volumes
MOUNT B: NAME      put a volume on a drive; MOUNT B: takes it off

B: is an empty work disk, written behind: its changes reach the card when a
file is closed, at ^C and at MOUNT. Press ^C at A> before reset or power off.
```

A file ending in `.COM` is a program. To run one, type its name without the
extension. `GLCD.PRL` is different: it is the graphics LCD console, a
resident program that TEC-OS loads itself on a board whose only display is
the graphics LCD. Chapter 8 explains `.PRL` files.

Typing a drive letter and a colon changes the current drive:

```text
A>B:
B>DIR
NO FILE
B>A:
A>
```

Drive B holds nothing yet. It is the place for your own files. TEC-OS
holds what you write to it in memory and writes it to the card in batches,
so before you press reset, turn the board off or take the card out, type
`^C` at the prompt. Chapter 4 explains why.

## Running a program

`DEMO` shows the hardware services that Chapter 7 describes. It beeps, then
puts a title on the LCD, runs a hex counter on the 7-segment digits and a
moving rainbow on the 8 × 8 LEDs. On a PICO9918 it also draws colour bars
and a bouncing ball in Graphics I. When the board has a DS1302 clock, the
LCD's last row shows the time. Any key stops it and gives the screen back
to the console.

```text
A>DEMO
```

When a program ends, TEC-OS performs a warm boot. It restarts the command
processor and returns to the prompt with the same drive and user area. Many
programs also stop when you type `^C`, and TEC-OS then warm boots in the
same way. Chapter 11 explains what a warm boot does.

`CON` reports the console in use:

```text
A>CON
CON: TTY: serial terminal
A>
```

`TTY:` is the serial terminal. On the PICO9918 the reply is `CON: CRT:
PICO9918`, and on the graphics LCD `CON: UC1: GLCD`. Chapter 2 covers moving the console from one device
to another.

## When the card is missing

TEC-OS stops after the banner when it can't read the card or finds no
volume on it. It shows an error code and a prompt:

```text
TEC-OS 0.1 for TEC-1G
No volume mounted, error 01
R retry, H header>
```

Error codes `01h` to `0Fh` come from the SD driver and `20h` to `2Fh` from
the checks on the card's contents. `01` means the card did not answer the
first command TEC-OS sent it, which is what happens when no card is
inserted.
Insert or fix the card and press `R` to try again. `H` shows the first 64
bytes of the last block read, which tells you whether the card holds a
TEC-OS container at all. Chapter 4 describes the container and Chapter 10
the SD driver's errors.

Never change a card on a PC while the TEC-1G is using it. TEC-OS keeps a map
of each drive's free space in memory, and a card changed behind its back no
longer matches that map. Type `^C` at the prompt before taking the card out,
and reset the board after putting a changed card back.
