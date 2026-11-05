---
title: The host model
parent: TEC-OS
nav_order: 27
nav_group: "Part II: Inside TEC-OS"
---

# 27. The host model

<!-- Checked against TEC-OS 78127ec, with `@jhlagado/debug80-runtime` 0.3.3, the
     version `package.json` names. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

Every transcript in this book came from a TEC-1G that exists only as software.
The repository runs TEC-OS on the Debug80 TEC-1G runtime, a model of the
board's CPU, memory, latch and devices, through one module, `host/machine.mjs`.
The tests, the web page and `tools/capture.mjs` all drive that one machine.
What follows is the machine, then the tests and the page built on it, and
last what a passing test proves about a board.

## One machine for the tests, the page and the book

The tests and the capture script run under Node.js and the web page in a
browser. All of them use the same file because `host/machine.mjs` has no
Node.js dependency (`host/machine.mjs:1-16`). It imports only the runtime and
`tools/lib/bytes.mjs`. A caller gives it the ROM's bytes and the ROM's symbol
map, the names and addresses the build writes to the `.d8.json` file beside
each image. `symbolsFromD8` turns that file into a map
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

The runtime supplies the Z80, the latch and its decoding, the boot overlay,
the expansion banks, the keypad, the serial port's timing, the LCDs and the
PICO9918 (`host/machine.mjs:4-8`). The machine builds a runtime for a board
with RAM at `0000h–BFFFh` and ROM at `C000h–FFFFh`, starting at `0000h`
(`host/machine.mjs:61-78`), and loads the ROM's 16 KiB at `C000h`
(`host/machine.mjs:143-144`).

The runtime sends its display updates on a timer of the host's clock and
clears the queued LED and digit scans with each. What a test read would then
depend on the speed of the PC (`host/machine.mjs:80-84`). The machine turns
those updates off, and the tests and the web page read the display state
directly.

## The card and the clock

The runtime has an SD card model of its own, but the machine turns it off and
attaches its own instance of the runtime's `SdSpi` class on port `FDh`
(`host/machine.mjs:59`, `host/machine.mjs:69`, `host/machine.mjs:122-134`).
The card is then the caller's array of bytes. A write by TEC-OS changes that
array at once, and the caller can read the files from it, save it or swap it.
`swapCard` puts a different image, or none, in the socket for the next command
(`host/machine.mjs:522-526`), and the web page saves the same array to the
browser's storage.

A read or a write of a block past the end of the image gets an error, the
parameter-error bit of the card's first answer, and moves no data. TEC-OS's
driver then fails the access with error 5, and the image is unchanged. A
high-capacity card takes the block number as it is. With `highCapacity` false
the model takes byte addresses, as a standard-capacity card does.
`test/sd-range.test.mjs` uses such a card for the ROM's rejection at mount of
a volume past block `7FFFFFh`, which [Chapter 17](17-sd-card-and-volumes.md)
describes.

The DS1302 is attached the same way, on port `FCh`, with the runtime's
`rtcEnabled` turned off (`host/machine.mjs:72`, `host/machine.mjs:85`,
`host/machine.mjs:126`, `host/machine.mjs:135-137`). With no `clock` given it
reads the PC's own time, as on a board whose clock was set
(`host/machine.mjs:34-38`). With a `clock`, the machine starts the DS1302 at
that time and moves it on by the cycles run at 4 MHz. After TEC-OS writes a
time, it counts on from what was written, by the same emulated seconds
(`host/machine.mjs:86-119`).

The time a run reads is then the same on any PC, however fast it runs. The
tests start the clock at 1 January 2026, 12:00 (`test/lib/fixtures.mjs:72-73`).
`tools/capture.mjs` starts it at 1 November 2026, 12:00, so a capture that
reads the clock shows the same time on any PC.

## Checks on every write

Two kinds of write could make a program behave differently on the model and
on a board. The machine therefore passes every memory write through a check
of its own (`host/machine.mjs:215-234`). A write to `C000h–FFFFh`, the ROM,
is recorded as a `rom-write`. A write to `0000h–07FFh` while the boot overlay is
on is recorded as an `overlay-write`. Each goes in `violations` with the
address and the program counter.

On a board the first reaches the ROM chip. The second goes to RAM in the
runtime but to the ROM in the TEC-1G's own documents (`docs/diagnostics.md`,
T08). TEC-OS never makes either write, and 26 of the test files check that
`violations` is empty at their end.

A second watch covers EXPAND 1 (`host/machine.mjs:177-227`). From cold boot's
clear of EXPAND 1 until the next cold boot, only the block cache may write
`8000h–BCFFh`, and nothing may write the free pages `BE00h–BFFFh`. The
machine takes the end of the clear from the `LDIR` in `MEMINIT`. It takes the
cache's writers from their symbols: the cache's own code, the SD card's block
loops and `MVCOPY` when the cache called it. The history's page at `BD00h` is
left out of the watch, since `HSTORE` writes it (`host/machine.mjs:222`).

Any other write is recorded in the machine's `expand1Writes` and, for the
first 16, in `EXPAND1_WRITES`, shared by every machine in the process. The
Node.js wrapper the tests use fails a test file if that list isn't empty at
its end (`test/lib/machine.mjs:14-17`). In `test/expand.test.mjs:67-77` a
program puts EXPAND 1 in view and writes `BF80h`, and the watch records that
one write. In both checks the model is stricter than a board: a board takes
the write, and the model takes it and reports it.

## Driving the machine

`step` runs one instruction (`host/machine.mjs:259-267`). When the program
counter is at `BCONOUT`, the BIOS's console output, the byte in `C` goes into
`output` first. So `output` holds every byte TEC-OS put on the console,
whichever device it went to. A second record, `serial`, holds the bytes that
left the serial port. The runtime decodes them from the bit-banged line
(`host/machine.mjs:51-55`, `host/machine.mjs:77`).

Two runs of `capture.mjs` on the board with only the graphics LCD show the two
records apart, one printing the console and one the serial port. The console
record has the whole boot and the `CON` command:

<!-- node tools/capture.mjs --board glcd CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

A>CON
CON: UC1:
A>
```

The serial record stops where `GLCD.SVC` took the console:

<!-- node tools/capture.mjs --board glcd --serial CON -->
```text
TEC-OS 0.1 for TEC-1G
A: SYSTEM     
B: WORK       

A>GLCD.SVC

```

The graphics LCD shows what came after, since the driver cleared it:

<!-- the same --screen run's screen -->
```text

A>CON
CON: UC1:
A>
```

`runUntil` steps until a test function returns true, and fails after a limit of
cycles (`host/machine.mjs:269-279`). `expect` runs until the console output
matches a pattern, testing it only when the output has grown. It then runs on
until the console waits or a bounded settling interval expires, allowing the
last character to reach the screen (`host/machine.mjs:301-321`).
`waitingForInput` is true while the program counter is in one of the console's
input loops, found by symbol (`host/machine.mjs:323-335`). `ready` adds that the
startup file has finished and the CCP is reading a line, from `STPOS` and
`HFLAG` (`host/machine.mjs:337-342`). `capture.mjs` waits on `ready` and on
output ending in a prompt.

Typing takes two forms. `type` sends each character to the serial port only
when TEC-OS is waiting for one. It then waits until TEC-OS has taken it
(`host/machine.mjs:354-371`). With a display as the console it presses keys on
the matrix keyboard instead. It holds each key, with its Shift or Ctrl, until
TEC-OS's scan has read it, and then releases it (`host/machine.mjs:453-468`).
`enqueueInput` and `pumpInput` do the same without blocking, one step at a
time, for the web page's run loop and for `capture.mjs`
(`host/machine.mjs:470-520`). Either way the model paces input to TEC-OS. A
terminal on a board sends each character when it is typed.

The rest reads or sets the board's state. `screen` turns the PICO9918's name
table into rows of text, from the layout its registers select or a width the
caller gives (`host/machine.mjs:380-404`). `capture.mjs --screen` gives it the
width of the ROM's console at `PIWID`, which `CON CRT 40` and `32` set
(`tools/capture.mjs:147-153`). A 40- or 32-column screen therefore comes out
in rows of that width. `glcdScreen` matches each 6 × 8 cell of the graphics
LCD's memory against the font, which the caller supplies in `Machine.font`
(`host/machine.mjs:412-450`). `ramImage` and `loadRam` copy all of RAM,
EXPAND 1 included, out and in. `reset` is the board's reset button: the CPU
and the latches start again, and RAM and the card stay as they were
(`host/machine.mjs:528-587`).

## The tests

`npm test` runs every file in `test/` that ends `.test.mjs`, one at a time, with
Node.js's own test runner (`package.json:17`). There are 56 such files, from
`arith.test.mjs` to `write.test.mjs`, each on one part of TEC-OS. Most build
their machines with `boot` in `test/lib/fixtures.mjs`. It reads the one ROM,
`build/tecos/tecos.rom`, and readies the card for the board's display
(`test/lib/fixtures.mjs:21-27`, `test/lib/fixtures.mjs:93-121`). With the
graphics LCD and the matrix keyboard the card gets `GLCD.SVC` and a startup file
naming it. With the PICO9918 the console is the ROM's, so the card gets a
startup file only for a width other than 80, a `CON PICO` line. A card that has
a `STARTUP.CMD` keeps it. `boot` then runs to the first prompt with the clock at
the tests' starting time.

`test/lib/fixtures.mjs` also makes the files the tests load. `program`
assembles a source in `test/programs/` with ATOM and keeps the result in
`build/test-programs` (`test/lib/fixtures.mjs:41-55`). The result is filed
under a digest of the source and of every file it includes, so a changed
include assembles again (`test/lib/fixtures.mjs:29-38`). `service` makes a `.SVC` file with
`makeSvc` (`test/lib/fixtures.mjs:75-76`). `standardCard` is a new container
with the starter card's two volumes, `SYSTEM` on A and `WORK` on B, both
empty (`test/lib/fixtures.mjs:57-64`). `volume` opens a drive of it as a CP/M
file system for a test to write files into. That file system is `CpmVolume`,
from `tools/lib/cpmfs.mjs`, which `tecvol` and the page use too. Its `read`
throws for an entry that names a block past `DSM`. Its `write` over a file
with the read-only attribute, and its `erase` of one, are rejected as the BDOS
rejects them, unless the call sets `force` (`tools/lib/cpmfs.mjs:123-150`,
`tools/lib/cpmfs.mjs:152-160`, `tools/lib/cpmfs.mjs:175-191`).

Two inputs the tests use come from outside the repository: the starter card's
assembler, `TAS.COM`, and its editor, `TED.COM`. `test/inputs.json` records the
default path, size and SHA-256 of each, and the repository, commit and path it
comes from. `test/lib/inputs.mjs` reads each from its environment variable when
that is set, or else from `.inputs/`, or finally from its legacy default path
beside the clone (`tools/lib/pins.mjs:10-35`). `npm run inputs` fetches a
missing file into `.inputs/` from its repository at its commit. The README's
setup runs `npm run inputs` after `npm ci` and then prepares the pinned TAS
host. It lists the browser's install separately after setup (`README.md:34-64`).
A file whose SHA-256 differs fails its test. A missing one skips it, or fails it
with `STRICT=1`, which `npm run test:strict` sets (`test/lib/inputs.mjs:24-41`,
`package.json:18`). The web page's tests, `test/web-touch.test.mjs` and
`test/web-store.test.mjs`, drive Chromium through `playwright`, which
`package.json` pins at 1.62.1 (`package.json:28`). `npx playwright install
chromium` fetches the browser that version expects, and `test/deps.test.mjs`
checks the pin and that the README gives the install.

## The web page

The web page is one more driver of the machine. `npm run web` builds it into
`web/dist`, after `npm run build` and `npm run media` (`web/build.mjs:1-4`).
It bundles `web/src/main.mjs` and everything it imports into one file,
`app.js`, with esbuild. `host/machine.mjs` and the container and file system
modules from `tools/lib` go in with it. The one import of Node.js's `fs` among
them is pointed at a stub (`web/build.mjs:20-30`, `web/stub/fs.mjs`). The
build first deletes `web/dist`, so no file of an older build is left there
(`web/build.mjs:16`). It copies the page, its style sheet, the ROM with a list
of its symbols, the page's recipe and the files in `dist/files`
(`web/build.mjs:32-45`). The page's recipe has the starter card's volumes and
files with one more, `DEMO.COM`, which `npm run media` assembles from
`test/programs/demo.asm` (`tools/media.mjs:192-210`, `tools/media.mjs:230-239`, `tools/media.mjs:256-260`). The page uses one ROM
for every display and every width (`web/build.mjs:14`). The PICO9918's console
is the ROM's, and a `CON PICO` line in the startup file sets its width
(`host/card.mjs:1-4`).

Each frame of the browser's display, the page runs the machine for the time
since the last frame at 4 MHz, at most 100 ms of it. It checks a 30 ms budget
every 1,024 instructions and stops when a check finds that budget exhausted
(`web/src/main.mjs:174-190`). Between steps it pumps any typed input in. It then
draws the PICO9918's screen, the 7-segment digits, the 8 × 8 LEDs, the 20 × 4
LCD and the graphics LCD from the runtime's state. Under the board it shows the
latch's value, the bank in the window and the Caps lamp
(`web/src/main.mjs:222-233`). Once a second it shows the speed reached, in MHz
(`web/src/main.mjs:191-195`). The machine is made with no `clock`, so its DS1302
reads the PC's time (`web/src/main.mjs:86-95`).

Typing goes to the board two ways (`web/src/main.mjs:411-427`). With the
PICO9918's screen or the graphics LCD focused, a key goes to the matrix
keyboard. With the serial terminal focused, a key goes to the serial port.
The serial terminal on the page drops the escape sequences TEC-OS sends and
acts on backspace (`web/src/main.mjs:358-386`).

The page's card is the same array the machine writes. It is kept in the
browser's IndexedDB, in the database `tecos`, the store `cards`, under the key
`current` (`web/src/store.mjs:6-8`). Each write TEC-OS makes marks the card
changed, and every 2 seconds a changed card is stored again
(`web/src/main.mjs:92-94`, `web/src/main.mjs:106-110`). At each power-on the
page prepares the card for the display and width chosen
(`web/src/main.mjs:82-84`). `prepareCard` in `host/card.mjs` makes the first
line of `STARTUP.CMD` the display's line, `GLCD.SVC` or a `CON PICO` width,
and keeps the file's other lines less their display pieces. [Appendix I](appendix-i-web-page.md)
gives the page's controls, its notices and the rules of that rewrite.

"Copy file to drive" writes the PC's files to a copy of the card and saves
it. Only then does it copy the result into the card the machine is using and
press reset (`web/src/main.mjs:617-649`). The reset is a cold boot, so TEC-OS rebuilds
its map of each drive's free space from the changed card and its block cache
from nothing. A change still in that cache, on the work volume, written
behind, is lost by the reset, as it would be on a board. A `^C` at the prompt
before the copy puts it on the card first.

## The model's evidence and its limit

Every transcript in this book, every T-state figure and every passing test is
evidence from the model. TEC-OS at this commit has run nowhere else: the
README states that everything it describes has run only in the Debug80 TEC-1G
model and not yet on a physical board (`README.md:27-28`).

The model is stricter than a board in two ways. On a board a write to the ROM
or under the overlay goes unreported, and the model records it as a
violation. A write to EXPAND 1 by anything but the cache fails a test file. A
program that passes here makes neither write.

The model also differs from the board's documents in three ways, all in its
runtime and none in TEC-OS. A write under the boot overlay reaches the RAM
in the runtime, and in the documents the overlay selects the ROM. The latch's
bits 3 to 6 select nine banks in the runtime and nothing in the documents.
The latch reads back in the runtime and is write-only in the documents.
TEC-OS depends on none of those behaviours. A test that crosses one of them
still passes on the model and may give a different result on a board.

The diagnostics ROM of [Chapter 26](26-diagnostics.md) tests each of those
points on a board, in T08, T10 and T12, beside every other point TEC-OS
depends on. Its report, compared with the model's by `tools/diag-check.mjs`,
is the step from this book's evidence to a board. Each line that matches is a
point on which the board does what the model did. Each line that differs
names what in TEC-OS it affects.
