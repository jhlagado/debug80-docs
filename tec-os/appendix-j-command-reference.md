---
title: J. Command reference
parent: TEC-OS
nav_order: 110
nav_group: "Reference"
---

# Appendix J. Command reference

<!-- Checked against TEC-OS fdd9e5b9a241af2a740d7baac2673f9ddd181bf9 (main).
     Unprefixed source ranges use that revision, as do those prefixed
     fdd9e5b:, with Thorium b69d544 (TED.COM, SHA-256 4f622390…), Thorium
     3d1e2c0 (TAS.COM, e648a1d0…) and Baza 50dc512 (BAZA.COM 280ee372…,
     BAZA.RTL 14d7fd11…, BOUNCE.BAS 615693a5…). The three captures were
     made at fdd9e5b with the commands in their comments. DEL in the ROM
     cites 402f30e: (TEC-OS 402f30ef67c2d800d6c6b6bec4460697b3a4d125). -->

A command line contains a command and its arguments, separated by spaces.
Return or `^J` ends the line. The maximum is 127 characters and typing the
last available character also ends it. `^C` cancels only at the start of
the line. Later in the line it is ignored. Recall and editing keys are in
[The first session](01-first-session.md). At TEC-OS `fdd9e5b` the ROM's
command processor runs the built-ins marked ROM below, and the shell,
`SHELL.SVC`, which the starter card's startup file installs, adds those
marked shell, recall, the `[more]` pause, lines of several commands and
`.CMD` scripts (`fdd9e5b:docs/shell.md:1-44`). Commands and arguments are converted to
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
The parser and delimiter checks are in `src/cpm/ccpcmd.asm:457-569`,
`src/cpm/ccpcmd.asm:602-662` at the stated source revision.

`?` matches one character, including a padding space. `*` fills the rest of its
field with question marks. Thus `G*.*` is `G???????.???`. Text after a star in
the same field is ignored so `D*X` and `D*` select the same pattern. A short
field is padded with spaces. `????.COM` therefore matches names of up to four
characters with type COM, not every name ending in COM
(`src/cpm/ccpcmd.asm:546-569`, `src/cpm/ccpcmd.asm:624-645`).

DIR and ERA use patterns to select files. TYPE, REN and SAVE require
unambiguous names. COPY requires an unambiguous source and resolved
destination, with the blank-destination rules below. A program or service
command also requires one name.
The following retained capture shows an overlong name, a pattern where TYPE
requires one file and a second argument where DIR accepts only one.

<!-- TEC-OS fdd9e5b: node tools/capture.mjs "DIR VERYLONGNAME.TXT" "TYPE *.CMD"
     "DIR A: B:". Boot rows omitted; the output is the same as at 78127ec. -->
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

At TEC-OS `fdd9e5b` the ROM holds eight built-ins, DIR, TYPE, ERA, REN,
SAVE, USER, CON and UNLOAD, and the shell three more, COPY, DEL and SERVICES
(`fdd9e5b:src/tables.asm:53-76`, `fdd9e5b:drivers/shell.asm:541-548`). The
release-1 ROM at `a1023bd` held ten, with COPY and SERVICES, and the ROM at
`402f30e` eleven, with DEL. Drive selection, program launch and service
installation have additional forms handled by the command processor.

| Form | In | Operation |
| --- | --- | --- |
| `DIR [PATTERN]` | ROM | List matching files or all visible files with no pattern |
| `TYPE NAME` | ROM | Print one text file |
| `COPY SOURCE [DEST]` | Shell | Copy one file, with the destination rules below |
| `REN NEW=OLD` | ROM | Rename one file on one drive |
| `ERA PATTERN` | ROM | Erase matching files |
| `DEL PATTERN` | Shell | Erase matching files, as another name for ERA |
| `SAVE N NAME` | ROM | Save N memory pages from `0100h` |
| `USER N` | ROM | Select user area 0 to 15 |
| `CON [DEVICE [WIDTH]]` | ROM | Report or change the console |
| `SERVICES` | Shell | List installed services, newest first |
| `UNLOAD` | ROM | Attempt to remove the newest service |
| `D:` | ROM | Select drive D, with the same form for another drive |
| `NAME [ARGS]` | ROM | Load a COM program and pass its arguments |
| `NAME.SVC [ARGS]` | ROM | Load a resident service, and enter its application when it has one |
| `NAME.CMD` | Shell | Run a script of command lines. Without the shell, run `NAME.COM` |

Without the shell `COPY`, `DEL` and `SERVICES` are names like any other, so
each looks for a program of that name and normally prints the name with a
question mark (`fdd9e5b:docs/shell.md:28-41`).

A built-in name must end at a space or the end of the command piece.
`DIRX`, `DIR.COM` and `A:DIR` are program commands, not forms of built-in
DIR. The last searches for `A:DIR.COM`. The keyword comparison uses the
original command word (`src/cpm/ccpcmd.asm:678-708`).

### DIR and TYPE

DIR accepts no argument, a drive alone or one pattern with an optional
drive. It lists the current user area's matching files except those with
the system attribute. Each file appears once. Its last line gives the number
listed and the free KiB on that drive. No match produces `NO FILE`.
A system file remains available to TYPE and to program lookup.

A displayed name has a 13-column field except at the end of a row. The number
of names per row follows the console width and is at least one. Serial uses the
80-column layout. This differs from Digital Research's DIR layout.
Under the shell both DIR and TYPE pause at `[more]`, one row before a full
screen. Without it they list to the end. The practical continuation and stop
keys are in [Chapter 4](04-work-with-files.md).

TYPE takes one name without wildcards and no extra argument. It prints
through the pager until the first Ctrl-Z byte, `1Ah`, or the end of the
last record. No name or no matching file produces `NO FILE`.

### COPY

COPY is the shell's (`drivers/shellcmd.asm:54-220`,
`docs/compatibility.md:123-131`).
COPY uses the current user area on both source and destination drives.
A name without a drive uses the current drive. A destination containing only
a drive takes the source's complete name and type. A destination with a type
but no name also takes the source's complete name and type, ignoring that
destination type. Omitting DEST applies the same rules to a blank destination.

The resolved source and destination must differ. A self-copy or an argument
after the destination produces `COPY?` before either file is opened.
A valid copy replaces any existing destination file, subject to protection.
On success `COPIED` is followed by the number of 128-byte records copied,
in hexadecimal (`drivers/shellcmd.asm:54-155`).

The type-only destination and self-copy cases below were captured on A
with the starter card.

<!-- TEC-OS fdd9e5b: node tools/capture.mjs "COPY STARTUP.CMD B:.DOC" "DIR B:"
     "COPY A:STARTUP.CMD STARTUP.CMD" "COPY STARTUP.CMD". Boot rows omitted. -->
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
(`src/cpm/ccpmut.asm:81-149`).

### ERA

ERA accepts one name or pattern and no extra argument. If all eleven name
and type positions are question marks, as with `*.*`, it prints
`ALL (Y/N)?`. A Return alone leaves every file unchanged. Otherwise ERA
reads through the next Return and erases only when the answer's first
character is Y or y. Other answers leave the files unchanged.

A pattern whose eleven stored positions are not all question marks, such
as `*.TXT`, is erased without confirmation. No match produces `NO FILE`
(`src/cpm/ccpmut.asm:10-67`). Protection and write failures can stop a
multi-file erase after some entries have already been erased. The exact
partial-result cases are in [Appendix D](appendix-d-error-messages.md).

DEL is another name for ERA. At `402f30e` its keyword in the ROM selected
the same routine (`402f30e:src/tables.asm:64-67`). At `fdd9e5b` DEL is the
shell's: the shell rewrites the word as `ERA` and hands the piece to the
ROM, so it takes the same names and patterns and prints the same
`ALL (Y/N)?` question. Because a built-in is matched before a program is
looked up, plain `DEL` under the shell does not run a `DEL.COM`, as plain
`ERA` never runs an `ERA.COM`. `A:DEL` or `DEL.COM` still runs that file
(`fdd9e5b:drivers/shell.asm:530-539`, `fdd9e5b:docs/compatibility.md:119-122`,
`fdd9e5b:test/commands.test.mjs:163-213`).

The following run starts with an empty B drive and copies one
disposable file there. It records an `n` answer that leaves the file and a `y`
answer that erases it. This is a separate demonstration, not the card
used for BANNER in Chapter 2. `ERA *.*` would erase BANNER too on that card.

<!-- TEC-OS fdd9e5b: node tools/capture.mjs "COPY STARTUP.CMD B:" B: "@start ERA *.*" $'@key n\r' DIR "@start ERA *.*" $'@key y\r' DIR -->
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
SAVE leaves the file open in that case (`src/cpm/ccpcmd.asm:252-390`).

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
another copy on a later drive. These paths are in `src/cpm/ccp.asm:373-439`
and `src/cpm/ccp.asm:571-622`. [Chapter 5](05-drives-and-user-areas.md)
works through the resulting choices.

### CON

With no argument CON reports the console in effect. The device names are
TTY, CRT, BAT and UC1, with PICO as an alias for CRT and GLCD for UC1.
A colon may follow a device name. A width must be separated from CRT or PICO
by a space and must be 80, 40 or 32. Other devices take no width.
Extra text is rejected (`src/cpm/ccpcmd.asm:58-214`).

The reply goes through the selected console and is discarded in BAT mode.
Selecting an unavailable console can leave or restore another mode so the reply
reports the mode in effect, not merely the name typed. The practical
alternatives and recovery actions are in
[Choose a console](07-choose-a-console.md).

### Resident services

A command ending in SVC installs the named file from the current drive or
an explicitly named drive, in the current user area only. It uses neither
the COM search's retry in user 0 nor its fallback to drive A.
SERVICES, the shell's, lists installed names and page counts. UNLOAD acts on
the newest service. Removal fails if that service is not removable or its removal
routine reports failure. The practical installation rules are in
[Chapter 5](05-drives-and-user-areas.md) and authoring is in
[Chapter 14](14-write-a-resident-service.md).

At TEC-OS `fdd9e5b`, `NAME.SVC` also enters a service's application when the
service has its enter-on-install bit set. Only a service whose image starts
with an execution record that has its enter bit set has one. On the starter
card those are `MON3.SVC` and `SHELL.SVC`. Text after the name is the
application's command tail, and no switch is parsed, so an older card's
`MON3.SVC /E` enters with `/E` as its tail. A service installed from a file
of that name is entered without reading the card. Otherwise the file is read
from the named or current drive and installed, then entered once its `INIT`
has made it ready. An install that never becomes ready is removed again and
the command is refused. A service with no such record, such as `GLCD.SVC`,
only installs, and each typing installs another copy. With two entering
copies installed the command is refused until `UNLOAD` leaves one. Each
refusal prints the command's name with a question mark, as `MON3.SVC?`, and
sets return code FF00h. The application ends with a warm boot and its
service stays installed, so `UNLOAD` removes it as before
(`fdd9e5b:docs/services.md:82-89`, `fdd9e5b:docs/services.md:101-130`,
`fdd9e5b:docs/services.md:157-180`, `fdd9e5b:src/loader.asm:734-783`,
`fdd9e5b:docs/shell.md:220-235`). The `NAME.SVC /E` form of `31b6083` and
`402f30e` is gone. [Appendix H](appendix-h-service-file-format.md#the-execution-record)
gives the record.

`MON3.SVC` gives the `MON3>` line, which BDOS function 10 reads and the
service converts to capitals. It takes three commands. Anything else prints
`?` (`fdd9e5b:docs/mon3.md:37-43`, `fdd9e5b:docs/mon3.md:55-109`):

| Form | Operation |
| --- | --- |
| `LOAD [D:]NAME[.TYP] [ADDR]` | Load the file at `4000h`, or at `ADDR`, one to four hexadecimal digits, in whole records. Any type but `HEX` loads this way |
| `LOAD [D:]NAME.HEX` | Load an Intel HEX file at its records' addresses. It takes no address |
| `GO [ADDR]` | Run the last good load, or the program at `ADDR` |
| `EXIT` | Restore page zero, reset the drives and warm boot to `A>` |

The drive is A to P. The name has at most eight characters and the type
three, and neither may hold `?` or `*`. Such a name is refused with `?`
before it is looked up. `^C` at `MON3>` also ends the session. The service
stays installed after `EXIT`, and `MON3.SVC` enters it again without
reading the card. [Chapter 5](05-drives-and-user-areas.md#a-mon-3-session)
describes the session and
[Appendix D](appendix-d-error-messages.md#the-mon-3-session) its messages.

## Programs on the starter card

The starter card's A holds fifteen files, and the web page runs the same
card. Ten are programs or sources you use by name at the prompt.
`SHELL.SVC`, `GLCD.SVC` and `STARTUP.CMD` belong to the startup setup,
`BAZA.RTL` is read by BAZA and `HELLO3.BIN` is loaded at `MON3>`
(`fdd9e5b:tools/media.mjs:29-31`, `fdd9e5b:tools/media.mjs:200-231`,
`fdd9e5b:tools/lib/starter.mjs:10-22`, `fdd9e5b:README.md:156-185`,
`fdd9e5b:test/demo.test.mjs:1-4`, `fdd9e5b:test/starter.test.mjs:46-392`):

| File | Use |
| --- | --- |
| `MOUNT.COM` | `MOUNT` lists the card's volumes. `MOUNT B: NAME` or `MOUNT B: INDEX` mounts one on a drive and `MOUNT B:` unmounts that drive |
| `TED.COM` | `TED [NAME.EXT [LINE]]` edits a text file, opening it at `LINE` when one is given. With no name it opens the project's file |
| `TAS.COM` | `TAS NAME [OUT.TYP]` assembles `NAME.ASM` to `NAME.COM` and `NAME.DBG`, or to `OUT.TYP`, where a type of `SVC` makes a service. A line may hold several statements with `\` between them |
| `BAZA.COM` | `BAZA NAME` compiles `NAME.BAS`, or `NAME.BAZ` when there is no `.BAS`, to `NAME.COM` on the same drive |
| `BAZA.RTL` | BAZA's runtime library, read from the current drive or from the drive `BAZA.COM` was loaded from |
| `SAMPLE.ASM` | Assembly source for `TAS SAMPLE`, then `SAMPLE` |
| `TIMES.BAS` | BASIC source for `BAZA TIMES`, then `TIMES` |
| `BOUNCE.BAS` | A sprite game for the PICO9918, which it needs. `BAZA BOUNCE`, then `BOUNCE`. Tap W, A, S and D, or the arrow keys, to steer and Q to quit |
| `DEMO.ASM` | The source of DEMO. `TAS DEMO` builds DEMO.COM, then `DEMO` shows the LCD, the 7-segment digits, the 8 × 8 LEDs and the PICO9918. `TED DEMO.ASM` opens the source |
| `MON3.SVC` | A resident service that runs MON-3 programs. `MON3.SVC` installs it and gives the `MON3>` line |
| `HELLO3.BIN` | A MON-3 program for `LOAD HELLO3.BIN`, then `GO`, at `MON3>`. It writes four lines on the LCD and counts on the digits until Esc on the matrix keyboard, or AD on the keypad with the Matrix switch off |
| `HELLO3.ASM` | HELLO3's source, for `TAS HELLO3 HELLO3.BIN` |
| `SHELL.SVC` | The shell, a resident service: recall, COPY, DEL, SERVICES, the `[more]` pause, lines of several commands and `.CMD` scripts |
| `GLCD.SVC` | The graphics LCD console driver, a resident service |
| `STARTUP.CMD` | The startup file, holding the lines `SHELL.SVC` and `GLCD.SVC` |

TED's `^T B` and `^T R` build an `.ASM` file with `TAS NAME.ASM` and a
`.BAS` file with `BAZA NAME.BAS`. `^T D` chains `TDB NAME` for an `.ASM`
file, which fails with `A:TDB?` on the starter card, and shows
`No debugger` for a `.BAS` file
(`Thorium b69d544:README.md:14-41`, `fdd9e5b:docs/compatibility.md:223`).
`TAS` and `BAZA` both set the failure return code `FF00h` when a build
fails. A failed BAZA compile leaves an existing `NAME.COM` unchanged, and a
failed TAS build normally keeps its earlier outputs
(`fdd9e5b:docs/compatibility.md:225-226`, `Baza 50dc512:README.md:32-37`,
`Thorium 3d1e2c0:docs/language.md:17-20`).
[Make a small program](02-make-a-small-program.md) and
[Build a BASIC program](03-build-a-basic-program.md) use them.

## Several commands

Under the shell an exclamation mark ends one command piece and starts
another, which runs whatever the previous command returned. `&` after a space,
a tab or another separator does the same, but its piece runs only if the
previous command's return code is not `FF00h` to `FFFEh`. A skipped piece is
not echoed and leaves the code as it was, so in `A &B &C` a failing A skips
B and C, and in `A &B !C` C runs. A run of separators and blanks is one
separator, conditional when it holds only `&`. Empty pieces and spaces
between pieces are ignored. The same 127-character bound applies to the
whole line, typed, from a script or supplied by function 47
(`fdd9e5b:docs/shell.md:46-82`).

A program's command tail ends before the blanks in front of its piece's
separator. Neither a file name nor an argument can contain a literal
exclamation mark. An `&` inside a word is text, so a tail such as
`/M:&HE000` passes whole. A line whose first piece starts with `&` is
refused as `&WORD?` and none of it runs. CP/M 3's leading `:` is not
provided, and a piece starting with `:` is refused as a bad name.

Without the shell `!` and `&` are ordinary characters. `DIR!TYPE X` is then
one word, refused as `DIR!TYPE?`, and a function 47 line runs whole as one
command (`fdd9e5b:docs/shell.md:28-44`).
[Results and command chains](13-results-and-command-chains.md) gives the success
interval, every drop path and function 47's replacement-line contract.

## Scripts

Under the shell, typing `NAME.CMD` runs the script `NAME.CMD` from the named
drive, or else the current one, in the current user area, with no fallback to
A. It is a text file read 128 bytes at a time, ending at `^Z`, a zero or the
end of its last record. CR, LF or CR LF ends a line, of which the first 127
characters are kept. Empty lines, lines of blanks and `!` alone, and lines
whose first character is `;` are passed over and not echoed. Every other
line is echoed whole after the prompt and runs as a typed line. Scripts do
not nest: a `NAME.CMD` piece inside a script, or one followed by more
pieces, is refused as `NAME.CMD?` with FF00h. A missing script gives the same
refusal (`fdd9e5b:docs/shell.md:91-113`).

`STARTUP.CMD` is read the same way after the ROM has run its first line,
when that line installs the shell. Typing `STARTUP.CMD` runs the whole file
again as a typed script. Without the shell a typed `NAME.CMD` runs
`NAME.COM`, and only the first line of `STARTUP.CMD` runs
(`fdd9e5b:docs/shell.md:115-133`).
