---
title: The host model and the web page
parent: TEC-OS
nav_order: 25
nav_group: "Part II: Inside TEC-OS"
---

# 25. The host model and the web page

Checked against TEC-OS 1f9542d, with `@jhlagado/debug80-runtime` 0.3.3, the
version `package.json` names.

Every transcript in this book came from a TEC-1G that exists only as software.
The repository runs TEC-OS on the Debug80 TEC-1G runtime, a model of the board's
CPU, memory, latch and devices, through one module, `host/machine.mjs`, which
the tests, the web page and `tools/capture.mjs` all use. This chapter describes
that module, then the tests and the web page built on it.

## One machine for the tests, the page and the book

The tests and the capture script run under Node.js and the web page in a
browser, and all of them can use the same file because `host/machine.mjs` has no
Node.js dependencies (`host/machine.mjs:1-2`). It imports only the runtime and
`tools/lib/bytes.mjs`. A caller gives it the ROM's bytes and the ROM's symbol
map, which holds the names and addresses the build writes to the `.d8.json` file
beside each image. `symbolsFromD8` turns that file into a map
(`host/machine.mjs:23-28`). The machine reads its symbols by name, so the same
code works for any build of the ROM.

The constructor's options describe the board (`host/machine.mjs:33-49`):

- `sdImage`, the card's bytes, or nothing for an empty socket, and
  `highCapacity`, true for an SDHC card.
- `tms` for a PICO9918, and `matrix` for the matrix keyboard with its Matrix
  switch on.
- `glcd`, false for a board with no graphics LCD, whose busy flag then never
  clears.
- `rtc`, false for no DS1302, and `clock`, the time it starts at.
- `ramFill`, the byte all RAM holds at power-on.
- `windowRam`, false for a board with nothing at `8000h–BFFFh`.
- `ram96`, `mains` and `expands`, which decode the latch as the TEC-1G's own
  documents describe its RAM, with one or two regions of each kind.
- `onSdWrite`, a function called on each write to the card.

The runtime supplies the Z80, the latch and its decoding, the boot overlay, the
expansion banks, the keypad, the serial port's timing, the LCDs and the PICO9918
(`host/machine.mjs:4-8`). The machine builds a runtime for a board with RAM at
`0000h–BFFFh` and ROM at `C000h–FFFFh`, starting at `0000h`
(`host/machine.mjs:61-78`), and it loads the ROM's 16 KiB at `C000h`
(`host/machine.mjs:143-144`).

The runtime sends its display updates on a timer of the host's clock and clears
the queued LED and digit scans with each, so what a test read would depend on
the speed of the PC (`host/machine.mjs:79-84`). The machine therefore turns
those updates off, and the tests and the web page read the display state
directly.

## The card and the clock

The runtime has an SD card model of its own, but the machine turns it off and
attaches its own instance of the runtime's `SdSpi` class on port `FDh`
(`host/machine.mjs:59`, `host/machine.mjs:69`, `host/machine.mjs:122-135`). The
card is then the caller's array of bytes: a write by TEC-OS changes that array
at once, and the caller can read the files from it, save it or swap it.
`swapCard` puts a different image, or none, in the socket for the next command
(`host/machine.mjs:518-522`), and the web page saves the same array to the
browser's storage.

The card model answers a read or a write of a block past the end of the image
with an error, the parameter-error bit of its first answer, and moves no data.
TEC-OS's driver then fails the access with error 5, and the image is
unchanged. A high-capacity card takes the block number as it is. With
`highCapacity` false the model takes byte addresses, as a standard-capacity
card does, and `test/sd-range.test.mjs` uses such a card for the ROM's refusal
of a block 4 GiB or more into the card, which Chapter 18 describes.

The DS1302 is attached the same way, on port `FCh`, with the runtime's
`rtcEnabled` turned off (`host/machine.mjs:72`, `host/machine.mjs:85`,
`host/machine.mjs:126`, `host/machine.mjs:135-137`). With no `clock` given it
reads the PC's own time, as on a board whose clock was set
(`host/machine.mjs:35-37`). With a `clock`, the machine starts the DS1302 at
that time and moves it on by the cycles run at 4 MHz, 4,000,000 T-states to
the second. After TEC-OS writes a time, it counts on from what was written, by
the same emulated seconds (`host/machine.mjs:86-119`).

The time a run reads is then the same on any PC, however fast it runs. The tests
start the clock at 1 January 2026, 12:00 (`test/lib/fixtures.mjs:112-113`), and
`tools/capture.mjs` at 1 November 2026, 12:00, so a capture that reads the
clock shows the same time on any PC.

## Checks on every write

Two kinds of write could make a program behave differently on the model and on a
board, so the machine passes every memory write through a check of its own
(`host/machine.mjs:210-230`). A write to `C000h–FFFFh`, the ROM, is recorded as
a `rom-write`, and a write to `0000h–07FFh` while the boot overlay is on is
recorded as an `overlay-write`. Each goes in `violations` with the address and
the program counter.

On a board the first reaches the ROM chip. The second goes to RAM in the
runtime but to the ROM in the TEC-1G's own documents (`docs/diagnostics.md`,
T08). TEC-OS never makes either write, and 25 of the test files check that
`violations` is empty.

A second watch covers EXPAND 1 (`host/machine.mjs:180-223`). From cold boot's
clear of EXPAND 1 until the next cold boot, only the block cache may write
`8000h–BCFFh`, and nothing may write the free page `BE00h–BEFFh` in that time.
The machine takes the end of the clear from its `LDIR` in `MEMINIT`, and the
cache's writers from their symbols: the cache's own routines, the SD card's
block loops and the copy routine `MVCOPY` when the cache called it.

Any other write is recorded in the machine's `expand1Writes` and, for the first
16, in `EXPAND1_WRITES`, shared by every machine in the process. The Node.js
wrapper the tests use fails a test file if that list isn't empty at its end
(`test/lib/machine.mjs:14-17`). The history's page at `BD00h` is left out of the
watch, since `HSTORE` writes it, and so is the page at `BF00h`, though nothing
writes it now (`host/machine.mjs:219`).

## Driving the machine

`step` runs one instruction (`host/machine.mjs:256-264`). Before the instruction
runs, when the program counter is at `BCONOUT`, the BIOS's console output, the
byte in `C` goes into `output`, so `output` holds every byte TEC-OS put on the
console, whichever device it went to. A second record, `serial`, holds the bytes
that left the serial port, which the runtime decodes from the bit-banged line
(`host/machine.mjs:53-55`, `host/machine.mjs:77`).

Two runs of `capture.mjs` on the board with only the graphics LCD show the two
records apart, one printing the console and one the serial port. The console
record has the whole boot and the `CON` command:

<!-- node tools/capture.mjs --board glcd --screen CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>PICO.SVC
PICO.SVC?

A>GLCD.SVC

A>CON
CON: UC1: GLCD
A>
```

The serial record stops where `GLCD.SVC` took the console:

<!-- node tools/capture.mjs --board glcd --serial CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>PICO.SVC
PICO.SVC?

A>GLCD.SVC

```

The graphics LCD shows what came after, since the driver cleared it:

<!-- the same --screen run's screen -->
```text

A>CON
CON: UC1: GLCD
A>
```

`runUntil` steps until a test function returns true, and fails after a limit of
cycles (`host/machine.mjs:266-277`). `expect` runs until the console output
matches a pattern, testing it only when the output has grown, and then runs on
until the console waits, so that the last character has reached the screen
(`host/machine.mjs:299-318`). `waitingForInput` is true while the program
counter is in one of the console's input loops, found by symbol
(`host/machine.mjs:320-332`). `ready` adds that the startup file has finished
and the CCP is reading a line, from `STPOS` and `HFLAG`
(`host/machine.mjs:334-339`), and `capture.mjs` waits on `ready` and on output
ending in a prompt.

Typing takes two forms. `type` sends each character to the serial port only when
TEC-OS is waiting for one, and waits until TEC-OS has taken it
(`host/machine.mjs:351-368`). With a display as the console it presses keys on
the matrix keyboard instead, holding each, with its Shift or Ctrl, until
TEC-OS's scan has read it and then releasing it (`host/machine.mjs:449-463`).
`enqueueInput` and `pumpInput` do the same without blocking, one step at a time,
for the web page's run loop and for `capture.mjs` (`host/machine.mjs:465-517`).
Either way the model paces input to TEC-OS, but a terminal on a board sends each
character when it is typed.

The rest reads or sets the board's state. `screen` turns the PICO9918's name
table into rows of text, from the layout its registers select
(`host/machine.mjs:377-402`). `glcdScreen` matches each 6 × 8 cell of the
graphics LCD's memory against the font, which the caller supplies in
`Machine.font` since the ROM holds none (`host/machine.mjs:406-446`).
`ramImage` and `loadRam` copy all of RAM, EXPAND 1 included, out and in.
`reset` resets the CPU and the latches and leaves RAM and the card as they
were, as the board's reset button does (`host/machine.mjs:523-583`).

## The tests

`npm test` runs every file in `test/` that ends `.test.mjs`, one at a time, with
Node.js's own test runner (`package.json:17`). There are 45 such files, from
`arith.test.mjs` to `write.test.mjs`, each on one part of TEC-OS. Most build
their machines with `boot` in `test/lib/fixtures.mjs`, which reads the one ROM,
`build/tecos/tecos.rom`, and, when the board has a matrix keyboard, puts a
display driver and a startup file on the card. A test's profile name sets
only the width of that driver. It then runs to the first prompt with the
clock at the tests' starting time (`test/lib/fixtures.mjs:22-28`,
`test/lib/fixtures.mjs:145-153`, `test/lib/fixtures.mjs:156-163`).

`test/lib/fixtures.mjs` also makes the files the tests load. `program` assembles
a source in `test/programs/` with ATOM and keeps the result in
`build/test-programs` (`test/lib/fixtures.mjs:81-96`), filed under a digest of
the source and every file it includes, so that a changed include assembles again
(`test/lib/fixtures.mjs:31-43`). `prl` makes a file in Digital Research's PRL
format from two assemblies, which TEC-OS no longer loads, and `service` a `.SVC`
file with `makeSvc` (`test/lib/fixtures.mjs:58-79`,
`test/lib/fixtures.mjs:115-116`). `standardCard` is a new container with the
starter card's two volumes, `SYSTEM` on A and `WORK` on B, both empty
(`test/lib/fixtures.mjs:97-104`), and `volume` opens a drive of it as a CP/M
file system for a test to write files into.

Two inputs the tests use come from outside the repository: the starter card's
assembler, `TAS.COM`, and its editor, `TED.COM`. `test/inputs.json` records the
default path, size and SHA-256 of each. It also has entries for ATOM's CP/M
build, `ATOM.COM`, and a directory of the package `triptych-headless`, which no
`.test.mjs` file reads. `test/lib/inputs.mjs` reads
each from its environment variable or its default path beside the clone. A file
whose SHA-256 differs fails its test, and a missing one skips it, or fails it
with `STRICT=1`, which `npm run test:strict` sets (`test/lib/inputs.mjs:1-6`,
`package.json:18`). The web page's tests, `test/web-touch.test.mjs` and
`test/web-store.test.mjs`, drive Chromium through `playwright`, which
`package.json` pins at 1.62.1, and `npx playwright install chromium` fetches
the browser that version expects (`package.json:27`, `README.md:36`).
`test/deps.test.mjs` checks the pin and that the README gives the install.

Every test is evidence from the model. In some behaviours the model differs from
the board as its documents describe it, such as a write under the boot overlay
or the decoding of the latch's upper bits, and such a behaviour gives a passing
test and may give a different result on a board. Chapter 23 describes the
diagnostics ROM, which tests those points on a board.

## The web page

`npm run web` builds the page into `web/dist`, after `npm run build` and
`npm run media` (`web/build.mjs:1-4`). It bundles `web/src/main.mjs` and
everything it imports into one file, `app.js`, with esbuild, and
`host/machine.mjs` and the container and file system modules from `tools/lib` go
in with it. The one import of Node.js's `fs` among them is pointed at a stub
(`web/build.mjs:20-30`, `web/stub/fs.mjs`). The build first deletes `web/dist`,
so no file of an older build is left there (`web/build.mjs:16`). It copies the
page, its style sheet, the ROM, `tecos.rom`, with a list of its symbols, the page's
recipe and the files in `dist/files` (`web/build.mjs:32-45`). The page's recipe,
`dist/page.recipe.json`, has the starter card's volumes and files with one more, `DEMO.COM`,
and the build copies it under the name the page fetches, `starter.recipe.json`.
`npm run media` writes it, and it assembles `DEMO.COM` from
`test/programs/demo.asm` into `dist/files` (`tools/media.mjs:234-247`). The files
are the starter card's, `DEMO.COM` and the PICO9918's driver built at 40 and 32
columns. The recipe's `widths` pins each of the three drivers by its URL and
SHA-256 (`tools/media.mjs:195-201`, `tools/media.mjs:219`). The page uses one
ROM for every display, since the PICO9918's width is the build of the card's
`PICO.SVC` (`web/build.mjs:14`).

At start the page loads the card it stored last time. If there is none, or the
stored one isn't a valid container, it builds the starter card from the recipe
(`web/src/main.mjs:629-641`). Building from the recipe fetches each file,
checks its length and SHA-256 against the recipe and writes it to its drive
(`tools/lib/recipe.mjs:14-26`).

The card is kept in the browser's IndexedDB, in the database `tecos`, the
store `cards`, under the key `current` (`web/src/store.mjs:5-7`). Each write
TEC-OS makes to the card marks it changed (`web/src/main.mjs:83-85`), and
every 2 seconds a changed card is stored again (`web/src/main.mjs:97-101`). The
timer clears the mark before it stores the card. When the browser's storage
fails, `saveCard` writes a warning to the browser's console, the first of the
session only, and passes the failure on (`web/src/store.mjs:18-22`,
`web/src/store.mjs:38-52`). The page then marks the card changed again, so the
next tick tries the save again, and the line under the board says `Card not
saved in this browser`, with the reason, and that the card is kept in memory
and saved again shortly. The words stay until a save succeeds
(`web/src/main.mjs:103-117`, `web/src/main.mjs:491-496`). A reload before then
brings back the card last stored. "Download image" saves the card in memory
whatever happened to the store.

Each frame of the browser's display, the page runs the machine for the time
since the last frame at 4 MHz, at most 100 ms of it, and it stops early after 30
ms of the PC's time (`web/src/main.mjs:125-141`). It then draws the PICO9918's
screen, the 7-segment digits, the 8 × 8 LEDs, the 20 × 4 LCD and the graphics
LCD from the runtime's state, and it shows the latch's value, the bank in the
window and the Caps lamp under the board (`web/src/main.mjs:173-184`). Once a
second it shows the speed reached, in MHz (`web/src/main.mjs:142-146`). The
machine is made with no `clock`, so its DS1302 reads the PC's time
(`web/src/main.mjs:77-86`).

Typing goes to the board two ways (`web/src/main.mjs:339-378`). With the
PICO9918's screen or the graphics LCD focused, a key goes to the matrix
keyboard, and the arrow keys become its own arrow keys. With the serial
terminal focused, a key goes to the serial port, and an arrow key is sent as
`ESC [` and a letter. On a phone or tablet a tap on either gives focus to a
hidden text field that brings up the on-screen keyboard
(`web/src/main.mjs:380-475`). A row of buttons gives Ctrl, Esc, Tab and the
arrows (`web/index.html:36-44`). The serial terminal on the page drops the
escape sequences TEC-OS sends and acts on backspace
(`web/src/main.mjs:309-337`).

Chapter 1 lists the page's controls (`web/index.html:12-30`,
`web/index.html:68-82`). The page also lists each file of the drive chosen in
"Drive", with its user area, its size and a Download button, which saves the
file to the PC, as text when "as text" is ticked (`web/src/main.mjs:516-529`).

The width and the display are kept in the browser's local storage
(`web/src/main.mjs:17-19`, `web/src/main.mjs:599-611`). A power-on comes from a
change to either of them, the Power cycle button or a new card, and it first
prepares the card with `prepareCard` from `host/card.mjs`
(`web/src/main.mjs:67-90`). For the PICO9918 the page fetches the recipe and the
three drivers its `widths` pins, each checked by its SHA-256
(`host/card.mjs:99-113`). When one can't be had, `prepareCard` changes nothing.
Otherwise it works on a copy of the card, which goes over the card only once
every change is made, and it reads user 0 of drive A, read-only when the card
says so (`host/card.mjs:15-21`, `host/card.mjs:58-71`). `prepareCard` writes the
driver at the chosen width to drive A as `PICO.SVC` when the card has no
`PICO.SVC`, has one of those three builds or has one of an older format. Any other `PICO.SVC` is kept, with a note
that it is the card's own, and a card with no drive A or from an older TEC-OS
gets no driver (`host/card.mjs:58-90`). `prepareCard` checks that drive A has
the display's driver file, in the format this ROM loads. If it does, the first
line of `STARTUP.CMD` becomes that file's name, with no line for the other
display. `STARTUP.CMD`'s other lines stay, less their display pieces. A removed
piece passes its own `:` to the piece after it on its line, a `:` first on the
next line stays if the removed piece had its own, and otherwise a `:` that
waited on a removed piece goes, on its line or first on the next
(`host/card.mjs:115-156`). A card that fails the check gets no new `STARTUP.CMD`,
and the reason goes to the serial terminal after the words `[power on]`, as do a
failed fetch and the note (`web/src/main.mjs:88-89`). The reason is no drive A
or a `.DRV` display file from an older TEC-OS, and with the graphics LCD chosen
also no such driver or a driver of another format, since with the PICO9918
chosen the page writes `PICO.SVC` (`host/card.mjs:77-87`). The message for an
older card names the display's own `.DRV` file if the card has it, and
otherwise the first `.DRV` display file in the directory (`host/card.mjs:37-40`).
A change that can't be made, to a read-only drive A or in a full directory,
leaves the card as it was, and the serial terminal says that it couldn't be
prepared and boots as it is. Chapter 21 describes the preparation in full.

"Copy file to drive" writes to a copy of the card while the machine is paused
and saves it. Only when the save succeeds does it copy it into the card the
machine is using and press reset (`web/src/main.mjs:564-594`). A failed save
leaves the card as it was, and the line under the board says `Not copied` with
the reason. The reset is a cold boot, so TEC-OS
rebuilds its map of each drive's free space from the changed card and its
block cache from nothing. A change still in that cache, on the work volume,
written behind, is lost by the reset, as it would be on a board. A `^C` at the
prompt before the copy puts it on the card first.
