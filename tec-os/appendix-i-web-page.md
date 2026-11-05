---
title: I. The web page
parent: TEC-OS
nav_order: 109
nav_group: "Appendices"
---

# Appendix I. The web page

<!-- Checked against TEC-OS 78127ec. -->

<!-- C16 source-only citation revisions: TEC-OS fe2097f.
     Only the entries in editorial/c16-citation-resolutions.json use that pin.
     Captures, measurements and other citations retain their earlier provenance. -->

This appendix lists the web page's controls, where the page keeps your card
and what it writes on it. The page runs the host model at 4 MHz with TEC-OS in
its ROM, draws the board's displays and has a serial terminal below them.
Chapter 27 describes the model and the page's build, and Chapter 25 the
startup file the page rewrites. `npm run web` builds the page into
`web/dist`, and a web server on that folder serves it:

```sh
npm run web
python3 -m http.server 8765 --directory web/dist
```

The page is then at `http://localhost:8765`.

## The controls

The controls are in `web/index.html:12-30` and `web/index.html:68-82`, and
their handlers in `web/src/main.mjs`.

| Control | Effect |
| --- | --- |
| "ROM" | Selects the PICO9918's width: 80, 40 or 32 columns. A change turns the board off and on. |
| "Display" | Selects a board with a PICO9918 card, which has the graphics LCD too, or one with only the graphics LCD. A change turns the board off and on. |
| "Reset" | The board's reset button. The RAM and the card keep their contents, and the serial terminal shows `[reset]`. |
| "Power cycle" | Turns the board off and on. The RAM is lost and the card is kept. |
| "Pause" | Stops the Z80, and reads "Run" while it is stopped. The speed beside it reads "paused". |
| "New starter card" | Builds a fresh card from the page's recipe, checks each file against the SHA-256 the recipe records, saves it and turns the board off and on. |
| "Open image" | Loads a card image from the PC, saves it and turns the board off and on. An image that isn't a container is rejected with `Not opened` and the reason under "SD card". |
| "Download image" | Saves the page's card to the PC as `tecos-card.img`, from memory, whatever happened to the saved copy. |
| "Drive" | Selects the drive whose files the page lists and copies to. |
| "Copy file to drive" | Writes files from the PC onto the volume on the selected drive, as text if "as text" is ticked, then presses reset. |
| "as text" | Makes "Copy file to drive" and the files' Download buttons convert line ends, as `tecvol`'s `--text` does. |
| "Download" on a file | Saves that file to the PC, as text when "as text" is ticked. |

The page's recipe has the starter card's files and `DEMO.COM`, the program
Chapter 10 describes (`tools/media.mjs:192-210`, `tools/media.mjs:230-239`, `tools/media.mjs:256-260`). The file list under "Drive"
shows each file's user area, name and size. It is read again every 5
seconds and after a reset (`web/src/main.mjs:569-582`,
`web/src/main.mjs:667-680`). The width and the display chosen are kept in the
browser's local storage, so a reload keeps them (`web/src/main.mjs:17-19`).
Once a second the speed reached is shown in MHz beside "Pause".

## Typing

Typing goes to the board by two routes, chosen by which part of the page has
focus (`web/src/main.mjs:388-427`):

| Focus | Route | Arrow keys |
| --- | --- | --- |
| The PICO9918's screen, or the graphics LCD | The matrix keyboard | The matrix keyboard's own arrow keys |
| The serial terminal | The serial port | Sent as `ESC [` and a letter |

A click on the PICO9918's screen or the graphics LCD gives it focus. The
serial terminal is the console after `CON TTY`, and `CON CRT` or `CON UC1`
brings the console back to a display. The terminal on the page drops the
escape sequences TEC-OS sends and acts on backspace
(`web/src/main.mjs:358-386`). On a phone or tablet a tap on a screen or the
terminal focuses a hidden text field, which brings up the on-screen keyboard.
A row of buttons under the screen gives Ctrl, Esc, Tab and the four arrows
(`web/index.html:36-44`, `web/src/main.mjs:429-524`).

## The card in the browser

The page keeps its card in the browser's IndexedDB, in the database `tecos`,
the store `cards`, under the key `current` (`web/src/store.mjs:6-8`). At
start it loads the card stored last time, or builds the starter card from the
recipe and stores it (`web/src/main.mjs:684-698`). Each write TEC-OS makes to
the card marks it changed, and every 2 seconds a changed card is stored again.
Files written on the card are therefore still there after a reload
(`web/src/main.mjs:92-94`, `web/src/main.mjs:106-110`). One save runs at a
time. A save due during another marks the card changed, and the next tick
saves the newest copy (`web/src/main.mjs:118-124`).

The line under the heading "SD card" names each drive's volume, and after it
reports a save that failed (`web/src/main.mjs:112-147`,
`web/src/main.mjs:540-549`, `web/src/main.mjs:684-698`):

| Notice | Cause | What the page does |
| --- | --- | --- |
| `Card not saved in this browser: ` and the reason | A save to the browser's storage failed. | The card stays in memory, marked unsaved, and is saved again 2 seconds later, and again until one succeeds. |
| `Saving the card in this browser keeps failing` and the reason | Three saves in a row failed. | As above. "Download image" keeps a copy. |
| `The saved card couldn't be read, so this card isn't saved; reload to try again.` | The stored card can't be read, or the browser's storage can't be opened. | The stored card is left as it is, and a starter card runs. Until a reload no save stores anything, a new or opened card included. |

A reload before a save succeeds brings back the card as it was last saved, so
"Download image" is the way to keep a copy you can't afford to lose.

The page's card is a high-capacity card (`host/machine.mjs:49`), and "Open
image" rejects an image shorter than the length its header gives, with
`Not opened: image is truncated` (`web/src/main.mjs:598`,
`tools/lib/container.mjs:150-152`). Two failures of Appendix D therefore
never appear on the page: the diagnostic prompt's code `27h` and the
`Bad Sector` of a volume that runs past the end of the card.

## Copying files to the card

"Copy file to drive" pauses the machine and reads the PC's files. It then
writes them to a copy of the card and saves the copy. Only when the save
succeeds does it copy the result into the card the machine is using and press
reset (`web/src/main.mjs:617-649`). A failed save leaves the card as it was,
and the line under "SD card" says `Not copied` with the reason. A second copy
started while one runs is rejected with `Not copied: file import in
progress`. An "Open image" at that time is rejected with `Not opened: file
import in progress`.

The reset is a cold boot. TEC-OS rebuilds its map of each drive's free
space from the changed card, and its block cache from nothing. A change still
in that cache, on the work volume written behind, is lost by the reset, as it
would be on a board. A `^C` at the prompt before the copy puts it on the card
first.

The page makes one change to the card at a time. A power-on's rewrite of the
startup file and a copy of files take turns. A width chosen while files are
copied therefore reaches both the card in the machine and the stored card
(`web/src/main.mjs:67-80`).

## The card's startup file

At each power-on the page rewrites the first line of the card's `STARTUP.CMD`
for the display and width chosen, with `prepareCard` from `host/card.mjs`
(`web/src/main.mjs:82-84`, `host/card.mjs:58-73`). The page writes no driver:
the PICO9918's console is the ROM's, and the graphics LCD's driver must be on
the card already. The change is made on a copy of the card, which goes over
the card only once the change is made. The page reads user 0 of drive A, where
the ROM loads files at boot. It opens the drive read-only when the card's
descriptor says so (`host/card.mjs:18-24`).

The first line the page writes:

| Display chosen | First line |
| --- | --- |
| PICO9918 at 80 columns | none |
| PICO9918 at 40 columns | `CON PICO 40` |
| PICO9918 at 32 columns | `CON PICO 32` |
| Graphics LCD only | `GLCD.SVC` |

The file has no line for the other display (`host/card.mjs:104-117`). The
page's board with the PICO9918 has the graphics LCD as well, and there a
`GLCD.SVC` line would load nothing. `CON UC1` loads `GLCD.SVC` itself when
you move the console to it (`src/cpm/ccpcmd.asm:199-204`).

The file's other lines stay, less their display pieces
(`host/card.mjs:11-15`, `host/card.mjs:81-102`). A display piece is either of
two things, with or without a leading `:`. One is a display driver's name,
`PICO.SVC`, `PICO40.SVC`, `PICO32.SVC` or `GLCD.SVC`, under either type,
`.SVC` or `.DRV`. The other is a width line, `CON PICO` or `CON CRT` with a
width after it. A width line of the card's own goes too, since it would run
after the page's and override the width chosen. The `:` rules for a removed
piece:

| The line | Becomes | Rule |
| --- | --- | --- |
| `DIR!:GLCD.SVC!MOUNT` | `DIR!:MOUNT` | A removed piece passes its own `:` to the piece after it on its line. |
| `DIR`, then `:GLCD.SVC`, then `:MOUNT` | `DIR`, then `:MOUNT` | A `:` first on the next line stays if the removed piece had its own. |
| `GLCD.SVC!:MOUNT` | `MOUNT` | Otherwise a `:` that waited on a removed piece goes, since it must not wait on what now comes before it. |

Lines left blank are dropped. Nothing is written when the new text equals the
old. The starter card's `STARTUP.CMD`, `GLCD.SVC` alone, stays as it is for
the graphics LCD. For the PICO9918 it holds a `CON PICO` line, or nothing
but its `^Z` at 80 columns (`test/pico.test.mjs:834-846`).

## Cards left as they are

Before it writes, the page checks that the card can show the display chosen
(`host/card.mjs:26-50`). A card that fails the check gets no new
`STARTUP.CMD`. The reason goes to the serial terminal in brackets after
`[power on]` (`web/src/main.mjs:97-98`). A change that can't be made is
reported the same way, and the card stays as it was (`host/card.mjs:67-72`):

| The card | The terminal says |
| --- | --- |
| Has no drive A | `This card has no drive A: the diagnostic prompt is on the serial terminal below. A new starter card has one.` |
| Has no `GLCD.SVC`, with the graphics LCD chosen | `This card has no GLCD.SVC: it boots as its STARTUP.CMD says. A new starter card has it.` |
| Has a `.DRV` display file in place of `GLCD.SVC` | `This card is from an older TEC-OS: this ROM doesn't load NAME.DRV, so the card boots as its STARTUP.CMD says. A new starter card has GLCD.SVC.` |
| Has a `GLCD.SVC` of another format | `This card's GLCD.SVC is format n, from an older TEC-OS, and this ROM refuses it. A new starter card has the driver.` |
| Has a read-only drive A, or a full directory | `This card couldn't be prepared for the page (` the reason `), so it boots as it is.` |
| Has a `STARTUP.CMD` with the read-only attribute | `This card's STARTUP.CMD is read-only, so the page can't set its display line; it boots as it is` |

`NAME.DRV` is the chosen display's `.DRV` file if the card has it, and
otherwise the first `.DRV` display file in the directory
(`host/card.mjs:41-44`). The page doesn't force a write over a read-only
`STARTUP.CMD`. A card whose startup file must not change is best copied to the PC
before the page opens it.
