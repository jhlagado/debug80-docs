---
title: J. Command reference
parent: TEC-OS
nav_order: 110
nav_group: "Reference"
---

# Appendix J. Command reference

<!-- Draft source checks: TEC-OS a1023bd0cbb4879c37ae61e6f670b442e1e60abe. The three historical captures below
     retain TEC-OS 78127ec and its starter inputs. They have not been rerun
     for the new source offer.
     The starter-card section cites TEC-OS
     12b2ec5f470844c46cd0c92fea132f1a0ab11c40 with a 12b2ec5: prefix,
     Thorium 967678c (TED.COM, SHA-256 150a19bd…), Thorium dbee66a (TAS.COM)
     and Baza ae6a00d (BAZA.COM ee8465ac…, BAZA.RTL, BOUNCE.BAS).
     Source reading only. -->

A command line contains a command and its arguments, separated by spaces.
Return or `^J` ends the line. The maximum is 127 characters and typing the
last available character also ends it. `^C` cancels only at the start of
the line. Later in the line it is ignored. Recall and editing keys are in
[The first session](01-first-session.md). Commands and arguments are converted to
capitals before execution. The echo retains the case typed.
[Work with files](04-work-with-files.md) explains the ordinary operations.
This appendix gives their exact forms and boundary cases.

## Names and patterns

A file reference has an optional drive, a name of up to eight characters
and an optional type of up to three. A full stop separates the name and type as in `B:NOTES.TXT`. With no drive the reference uses the current drive.
With no type its three stored type bytes are spaces.

Spaces separate arguments. These thirteen characters are rejected inside
name and type fields:

```text
< > , ; : [ ] % | ( ) / \
```

A colon belongs to the optional drive prefix. A full stop or equals sign
ends the current field. A field longer than its limit is rejected.
The parser and delimiter checks are in `src/cpm/ccpcmd.asm:466-585`,
`src/cpm/ccpcmd.asm:618-678` at the stated source revision.

`?` matches one character, including a padding space. `*` fills the rest of its
field with question marks. Thus `G*.*` is `G???????.???`. Text after a star in
the same field is ignored so `D*X` and `D*` select the same pattern. A short
field is padded with spaces. `????.COM` therefore matches names of up to four
characters with type COM, not every name ending in COM
(`src/cpm/ccpcmd.asm:562-585`, `src/cpm/ccpcmd.asm:640-661`).

DIR and ERA use patterns to select files. TYPE, REN and SAVE require
unambiguous names. COPY requires an unambiguous source and resolved
destination, with the blank-destination rules below. A program or service
command also requires one name.
The following retained capture shows an overlong name, a pattern where TYPE
requires one file and a second argument where DIR accepts only one.

<!-- Historical capture: TEC-OS 78127ec, original starter card.
     node tools/capture.mjs "DIR VERYLONGNAME.TXT" "TYPE *.CMD" "DIR A: B:" -->
```text
A>DIR VERYLONGNAME.TXT
VERYLONGNAME.TXT?

A>TYPE *.CMD
*.CMD?

A>DIR A: B:
A:?

A>
```

For built-ins other than COPY and UNLOAD, the word before `?` is the first
argument, even when a later argument is wrong. A missing required argument
usually produces `?` alone. TYPE with no name instead prints `NO FILE`.
CON is another exception: when a separated width is invalid, as in
`CON PICO 50`, it prints `50?`. COPY and UNLOAD print their own names. An unknown or unloadable program
prints its command name. [Appendix D](appendix-d-error-messages.md) lists
the causes and recovery actions.

## Command forms

The ten built-ins are DIR, TYPE, ERA, REN, SAVE, USER, CON, COPY, UNLOAD
and SERVICES. Drive selection, program launch and service installation have
additional forms handled by the command processor.

| Form | Operation |
| --- | --- |
| `DIR [PATTERN]` | List matching files or all visible files with no pattern |
| `TYPE NAME` | Print one text file |
| `COPY SOURCE [DEST]` | Copy one file, with the destination rules below |
| `REN NEW=OLD` | Rename one file on one drive |
| `ERA PATTERN` | Erase matching files |
| `SAVE N NAME` | Save N memory pages from `0100h` |
| `USER N` | Select user area 0 to 15 |
| `CON [DEVICE [WIDTH]]` | Report or change the console |
| `SERVICES` | List installed services, newest first |
| `UNLOAD` | Attempt to remove the newest service |
| `D:` | Select drive D, with the same form for another drive |
| `NAME [ARGS]` | Load a COM program and pass its arguments |
| `NAME.SVC` | Load a resident service |

A built-in name must end at a space or the end of the command piece.
`DIRX`, `DIR.COM` and `A:DIR` are program commands, not forms of built-in
DIR. The last searches for `A:DIR.COM`. The keyword comparison uses the
original command word (`src/cpm/ccpcmd.asm:694-724`).

### DIR and TYPE

DIR accepts no argument, a drive alone or one pattern with an optional
drive. It lists the current user area's matching files except those with
the system attribute. Each file appears once. Its last line gives the number
listed and the free KiB on that drive. No match produces `NO FILE`.
A system file remains available to TYPE and to program lookup.

A displayed name has a 13-column field except at the end of a row. The number
of names per row follows the console width and is at least one. Serial uses the
80-column layout. This differs from Digital Research's DIR layout.
Both DIR and TYPE pause at `[more]`. The practical continuation and stop
keys are in [Chapter 4](04-work-with-files.md).

TYPE takes one name without wildcards and no extra argument. It prints
through the pager until the first Ctrl-Z byte, `1Ah`, or the end of the
last record. No name or no matching file produces `NO FILE`.

### COPY

COPY uses the current user area on both source and destination drives.
A name without a drive uses the current drive. A destination containing only
a drive takes the source's complete name and type. A destination with a type
but no name also takes the source's complete name and type, ignoring that
destination type. Omitting DEST applies the same rules to a blank destination.

The resolved source and destination must differ. A self-copy or an argument
after the destination produces `COPY?` before either file is opened.
A valid copy replaces any existing destination file, subject to protection.
On success `COPIED` is followed by the number of 128-byte records copied,
in hexadecimal (`src/cpm/ccpmut.asm:193-320`).

The type-only destination and self-copy cases below were captured on A
with the original starter card.

<!-- Historical capture: TEC-OS 78127ec, original starter card.
     node tools/capture.mjs "COPY STARTUP.CMD B:.DOC" "DIR B:" "COPY A:STARTUP.CMD STARTUP.CMD" "COPY STARTUP.CMD" -->
```text
A>COPY STARTUP.CMD B:.DOC
COPIED 0001

A>DIR B:
STARTUP.CMD 
1 file, 8172K free
A>COPY A:STARTUP.CMD STARTUP.CMD
COPY?

A>COPY STARTUP.CMD
COPY?

A>
```

On B, `COPY A:STARTUP.CMD` instead has distinct source and destination drives
and copies to B. If a copy fills the drive or directory, COPY closes its
partial destination before printing `WRITE ERROR`. If that close succeeds,
the destination retains the records written before the failure. The message
does not confirm that the close succeeded. Its other messages distinguish a
missing source, inability to make a destination and failure to close it.

### REN

REN requires `NEW=OLD` with no spaces around the equals sign. Both names must
be unambiguous. Either name may specify the drive. The other must omit it
or specify the same drive. Thus `REN B:NEW.TXT=OLD.TXT` and
`REN NEW.TXT=B:OLD.TXT` rename on B. Different drives are rejected.

REN checks the new name first. If it already exists, `FILE EXISTS` is printed
and nothing is renamed. An absent old name produces `NO FILE`
(`src/cpm/ccpmut.asm:74-145`).

### ERA

ERA accepts one name or pattern and no extra argument. If all eleven name
and type positions are question marks, as with `*.*`, it prints
`ALL (Y/N)?`. A Return alone leaves every file unchanged. Otherwise ERA
reads through the next Return and erases only when the answer's first
character is Y or y. Other answers leave the files unchanged.

A pattern whose eleven stored positions are not all question marks, such
as `*.TXT`, is erased without confirmation. No match produces `NO FILE`
(`src/cpm/ccpmut.asm:10-63`). Protection and write failures can stop a
multi-file erase after some entries have already been erased. The exact
partial-result cases are in [Appendix D](appendix-d-error-messages.md).

The following historical run starts with an empty B drive and copies one
disposable file there. It records an `n` answer that leaves the file and a `y`
answer that erases it. This is a separate `78127ec` demonstration, not the card
used for BANNER in Chapter 2. `ERA *.*` would erase BANNER too on that card.

<!-- node tools/capture.mjs "COPY STARTUP.CMD B:" B: "@start ERA *.*" $'@key n\r' DIR "@start ERA *.*" $'@key y\r' DIR -->
```text
A>COPY STARTUP.CMD B:
COPIED 0001

A>B:
B>ERA *.*
ALL (Y/N)?n
B>DIR
STARTUP.CMD 
1 file, 8172K free
B>ERA *.*
ALL (Y/N)?y
B>DIR
NO FILE
B>
```

### SAVE

SAVE takes a decimal count from 0 to 255 and one unambiguous file name. It
writes that many 256-byte pages starting at `0100h`. A count of 0 makes an empty
file. The count must be less than the high byte of the word at `0006h` so the
saved pages stop below the resident entry's page.
[Memory for programs](11-memory-for-programs.md) gives the memory boundary and
the complete capacity example.

An existing file of the same name is erased first. A failed make, write or
close produces `NO SPACE`. After a write failure SAVE attempts to close the
file. If the close succeeds, its directory entry retains the records written.
`NO SPACE` does not confirm that the close succeeded. Digital Research's CP/M 2.2
SAVE leaves the file open in that case (`src/cpm/ccpcmd.asm:249-398`).

### Drives, USER and program lookup

A drive selection is a letter and colon with no other argument. A through D are
the available TEC-OS drives. The CP/M letters E through P parse as drives but
selection fails. USER accepts a single digit from 0 to 9 or one of 10 to 15.
Leading-zero forms such as `00` and `03` are rejected. A nonzero user number
appears before the drive in the command prompt.

For a program command the type is replaced by COM, except for SVC. Lookup starts
on the named drive or the current drive when none is named. On that drive it
searches the current user area followed by user 0. The current user is restored
after that search. A file in user 0 needs no system attribute.

If no file is found, a plain command on a drive other than A continues on A
in the same user order. An explicit drive suppresses that fallback.
A found file that cannot load stops the search rather than permitting
another copy on a later drive. These paths are in `src/cpm/ccp.asm:403-467`
and `src/cpm/ccp.asm:589-640`. [Chapter 5](05-drives-and-user-areas.md)
works through the resulting choices.

### CON

With no argument CON reports the console in effect. The device names are
TTY, CRT, BAT and UC1, with PICO as an alias for CRT and GLCD for UC1.
A colon may follow a device name. A width must be separated from CRT or PICO
by a space and must be 80, 40 or 32. Other devices take no width.
Extra text is rejected (`src/cpm/ccpcmd.asm:54-208`).

The reply goes through the selected console and is discarded in BAT mode.
Selecting an unavailable console can leave or restore another mode so the reply
reports the mode in effect, not merely the name typed. The practical
alternatives and recovery actions are in
[Choose a console](07-choose-a-console.md).

### Resident services

A command ending in SVC installs the named file from the current drive or
an explicitly named drive, in the current user area only. It uses neither
the COM search's retry in user 0 nor its fallback to drive A.
SERVICES lists installed names and page counts. UNLOAD acts on the newest
service. Removal fails if that service is not removable or its removal
routine reports failure. The practical installation rules are in
[Chapter 5](05-drives-and-user-areas.md) and authoring is in
[Chapter 14](14-write-a-resident-service.md).

## Programs on the starter card

The starter card's A holds nine files. Six are programs or sources you use
by name at the prompt. `GLCD.SVC` and `STARTUP.CMD` belong to the display
setup and `BAZA.RTL` is read by BAZA (`12b2ec5:tools/media.mjs:29-31`,
`12b2ec5:tools/media.mjs:197-211`, `12b2ec5:tools/lib/starter.mjs:13-16`):

| File | Use |
| --- | --- |
| `MOUNT.COM` | `MOUNT` lists the card's volumes. `MOUNT B: NAME` or `MOUNT B: INDEX` mounts one on a drive and `MOUNT B:` unmounts that drive |
| `TED.COM` | `TED [NAME.EXT [LINE]]` edits a text file, opening it at `LINE` when one is given. With no name it opens the project's file |
| `TAS.COM` | `TAS NAME [OUT.TYP]` assembles `NAME.ASM` to `NAME.COM` and `NAME.DBG`, or to `OUT.TYP`, where a type of `SVC` makes a service |
| `BAZA.COM` | `BAZA NAME` compiles `NAME.BAS`, or `NAME.BAZ` when there is no `.BAS`, to `NAME.COM` on the same drive |
| `BAZA.RTL` | BAZA's runtime library, read from the current drive or from the drive `BAZA.COM` was loaded from |
| `SAMPLE.ASM` | Assembly source for `TAS SAMPLE`, then `SAMPLE` |
| `TIMES.BAS` | BASIC source for `BAZA TIMES`, then `TIMES` |
| `GLCD.SVC` | The graphics LCD console driver, a resident service |
| `STARTUP.CMD` | The startup file, holding the line `GLCD.SVC` |

TED's `^T B` and `^T R` build an `.ASM` file with `TAS NAME.ASM` and a
`.BAS` file with `BAZA NAME.BAS`. `^T D` chains `TDB NAME` for an `.ASM`
file, which fails with `A:TDB?` on the starter card, and shows
`No debugger` for a `.BAS` file
(`Thorium 967678c:README.md:14-34`, `12b2ec5:docs/compatibility.md:188`).
`TAS` and `BAZA` both set the failure return code `FF00h` when a build
fails. A failed BAZA compile leaves an existing `NAME.COM` unchanged, and a
failed TAS build normally keeps its earlier outputs
(`12b2ec5:docs/compatibility.md:190-191`, `Baza ae6a00d:README.md:26-32`,
`Thorium 967678c:README.md:65-66`).
[Make a small program](02-make-a-small-program.md) and
[Build a BASIC program](03-build-a-basic-program.md) use them.

The web page's card holds these nine files and three more, twelve in all
(`12b2ec5:tools/media.mjs:240-252`, `12b2ec5:README.md:158-165`,
`12b2ec5:test/demo.test.mjs:1-4`, `12b2ec5:test/starter.test.mjs:104-158`):

| File | Use |
| --- | --- |
| `DEMO.COM` | `DEMO` shows the LCD, the 7-segment digits, the 8 × 8 LEDs and the PICO9918 |
| `DEMO.ASM` | DEMO.COM's source. `TED DEMO.ASM` opens it and `TAS DEMO` builds the same DEMO.COM |
| `BOUNCE.BAS` | A sprite game for the PICO9918, which it needs. `BAZA BOUNCE`, then `BOUNCE`. Tap W, A, S and D to steer and Q to quit |


## Several commands

An exclamation mark ends one command piece and starts another. Empty pieces
and spaces between pieces are ignored. The same 127-character bound applies
to the whole line. A colon at a piece's start tests the previous return code.
Failure skips that piece and drops the remaining line. A colon at the start
of a fresh line tests the last command's code.

A program's command tail ends at its piece's separator. Neither a file name nor
an argument can contain a literal exclamation mark.
[Results and command chains](13-results-and-command-chains.md) gives the success
interval, every drop path and function 47's replacement-line contract.
