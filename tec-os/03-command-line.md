---
title: The command line
parent: TEC-OS
nav_order: 3
nav_group: "Part I: Using and programming TEC-OS"
---

# 3. The command line

<!-- Checked against TEC-OS 78127ec, with the starter card's `TED.COM` from Thorium
     128edb7, with the SHA-256
     `2b9291a8c50fc2fbf6673112627bcfc849cf0f7578d20e4104b86f9e1516e49f`, and its
     `TAS.COM` from Thorium dbee66a, with the SHA-256
     `45c0cf054c089163b18d40d9d009715d01a691ffee1c797a61333c3fb7963bd2`. -->

Everything you type at the `A>` prompt goes to the CCP, the command processor
of Chapter 1. The CCP reads the line, finds the command it names and runs it.
A command is one built into the ROM, or a program on the card, and either
can fail with a message.

## The line

The CCP reads a line with BDOS function 10, CP/M's line input, so the editing
keys of [Chapter 2](02-console.md#the-keyboard-and-the-line) work on it.
Return ends the line. The line holds up to 127 characters, and a 127th
character ends it as Return would. Before it searches for the command, the
CCP turns every lower-case letter into a capital. So `dir *.com` and
`DIR *.COM` are the same command:

<!-- node tools/capture.mjs "dir *.com" "DIR ????.COM" "DIR A:G*.*" "DIR B:" -->
```text
A>dir *.com
MOUNT.COM    TED.COM      TAS.COM     
3 files, 980K free
A>DIR ????.COM
TED.COM      TAS.COM     
2 files, 980K free
A>DIR A:G*.*
GLCD.SVC    
1 file, 980K free
A>DIR B:
NO FILE
A>
```

The echo of the line is what you typed, in lower case if you typed it so. The
first word of the line is the command. The words after it, separated by
spaces, are its arguments. A built-in is a command the CCP carries in the
ROM. Any other command is the name of a program file on the card.

Two characters have a meaning of their own in a line. `!` separates two
commands on one line, and a command that starts with `:` runs only if the one
before it succeeded. Both are described below, once the commands they join
have been.

## File names and wildcards

A CP/M file name has up to eight characters, then a full stop and a type of up
to three: `STARTUP.CMD`, `GLCD.SVC`. The type may be left out, with its full
stop, and then it is three spaces. A drive letter and a colon in front of the
name, as in `B:NOTES.TXT`, name a file on another drive. Without one, the
name is on the current drive, the one the prompt shows.

A name may hold any character but a space and these thirteen:
`< > , ; : [ ] % | ( ) / \`. A `.` or `=` ends a part of a name. A name that
breaks these rules, or a part that is too long, makes the command fail. The CCP
then prints back the word it was reading with a
question mark:

<!-- node tools/capture.mjs "DIR VERYLONGNAME.TXT" "TYPE *.CMD" "DIR A: B:" -->
```text
A>DIR VERYLONGNAME.TXT
VERYLONGNAME.TXT?

A>TYPE *.CMD
*.CMD?

A>DIR A: B:
A:?

A>
```

`TYPE *.CMD` fails because `TYPE` takes one file and `*.CMD` is a wildcard.
`DIR A: B:` fails because `DIR` takes one argument. The word printed back is
the command's first argument, `A:`, and not the extra one after it.

Two characters in a name match a group of files. `?` matches any one
character in its place. `*` matches the rest of the part it is in: up to
eight characters in the name, or three in the type. The CCP turns a `*` into
`?` characters to the end of its part. So `G*.*` is `G???????.???`. It matches
every file whose name starts with `G`, whatever its type. Characters
after a `*` in the same part are passed over, so `D*X` is the same as `D*`.

A `?` also matches a space, and a name shorter than eight characters is padded
with spaces. So `????.COM` is `????` and four spaces. That is why, in the
transcript above, it matches the names of up to four characters with the type
`COM`, and not `MOUNT.COM`.

## The built-in commands

The CCP's built-in commands are these:

| Command | Effect |
| --- | --- |
| `DIR` | Lists files on a drive |
| `TYPE NAME` | Prints a text file |
| `COPY SOURCE DEST` | Copies a file |
| `REN NEW=OLD` | Renames a file |
| `ERA NAME` | Erases a file, or every file a name with wildcards matches |
| `SAVE N NAME` | Writes the first `N` pages of memory from `0100h` to a file |
| `USER N` | Selects user area `N` |
| `B:` | Selects drive B, and so on for the other drives |
| `CON` | Names or changes the console ([Chapter 2](02-console.md#moving-the-console-with-con)) |
| `NAME.SVC` | Installs the service in the file `NAME.SVC` ([Chapter 6](06-startup-file.md)) |
| `SERVICES` | Lists the services installed ([Chapter 6](06-startup-file.md)) |
| `UNLOAD` | Removes the service installed last ([Chapter 6](06-startup-file.md)) |

A built-in's name is matched only as a whole word, followed by a space or the
end of the line. So `DIRX` is the name of a program, not `DIR` with something
after it. A drive in front of a built-in's name, as in `A:DIR`, also makes it
the name of a program, here `DIR.COM` on drive A.

Only `DIR` and `ERA` take a name with wildcards. `TYPE`, `REN`, `SAVE` and
`COPY` each work on one file, and a wildcard in their names makes the command
fail, as `TYPE *.CMD` did. The command's own name may hold no wildcard
either.

### DIR

`DIR` with no argument lists every file on the current drive, and `DIR B:`
every file on drive B. A name, with or without a drive, lists only the files
it matches. Each file appears as its name and type, in columns 13 characters
wide. The console's width sets how many columns fit. Six fit on the serial
terminal and on the PICO9918 at 80 columns, and one on the graphics LCD. The
last line gives the number of files listed and the free space on that drive,
in KiB. When no file matches, `DIR` prints `NO FILE`.

A listing longer than the screen stops with `[more]`, as
[Chapter 2](02-console.md#pausing-output) describes. `DIR` lists only the
files of the current user area, described below. It also leaves out a file
whose system attribute is set. `tecvol put --sys` sets that attribute on a
file put on a card from a PC, and a program can set it with BDOS function 30.
A system file is still there for every other command: `TYPE` prints it and a
command runs it.

`DIR`'s layout is TEC-OS's own. CP/M 2.2's `DIR` prints the names in a
different layout.

### TYPE

`TYPE` prints a text file. It reads the file a record of 128 bytes at a time.
It stops at the first `^Z`, the byte `1Ah` that ends a CP/M text file, or at
the end of the file's last record:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
GLCD.SVC

A>
```

`STARTUP.CMD` ends its line with a carriage return and a line feed. The blank
line after it is the one the CCP prints before the prompt. A file that isn't
there gives `NO FILE`, and so does `TYPE` with no name. Like `DIR`, `TYPE`
stops at `[more]` when the screen fills.

### COPY, REN and ERA

`COPY` copies one file to another name, to another drive or both. When the
destination is a drive alone, as in `COPY STARTUP.CMD B:`, the copy has the
source's name. A destination with a type and no name, such as `B:.DOC` or
`B:.*`, also takes the whole of the source's name. The type you typed has no
effect. The copy goes a record at a time. `COPIED` and a number report the
records copied, in hexadecimal: `000A` is ten records, 1,280 bytes. A file of
the destination's name is erased first, so `COPY` replaces it.

`REN` renames a file, with the new name first, an equals sign and the old
name after it, as CP/M 2.2 has it. `ERA` erases files. Here a copy of
`STARTUP.CMD` is made on drive B under two names, and one is renamed and
then erased:

<!-- node tools/capture.mjs "COPY STARTUP.CMD B:" "COPY STARTUP.CMD B:COPY.TXT" B: DIR "REN NOTES.TXT=COPY.TXT" "REN NOTES.TXT=STARTUP.CMD" DIR "ERA NOTES.TXT" "ERA NOTES.TXT" DIR -->
```text
A>COPY STARTUP.CMD B:
COPIED 0001

A>COPY STARTUP.CMD B:COPY.TXT
COPIED 0001

A>B:
B>DIR
STARTUP.CMD  COPY.TXT    
2 files, 8168K free
B>REN NOTES.TXT=COPY.TXT
B>REN NOTES.TXT=STARTUP.CMD
FILE EXISTS
B>DIR
STARTUP.CMD  NOTES.TXT   
2 files, 8168K free
B>ERA NOTES.TXT
B>ERA NOTES.TXT
NO FILE
B>DIR
STARTUP.CMD 
1 file, 8172K free
B>
```

`STARTUP.CMD` is one record, and each copy of it takes 4 KiB of the drive.
The volume on drive B, `WORK`, gives space to files in allocation blocks of
4 KiB, as [Chapter 4](04-cards-and-volumes.md) describes. The second `REN`
fails because a file of the new name, `NOTES.TXT`, is there already, and
`REN` changes nothing then. A `REN` whose old name isn't there prints
`NO FILE`. So does an `ERA` that matches no file, as the second `ERA` above
shows.

`REN` takes one drive for both names, from either name. So
`REN B:NEW.TXT=OLD.TXT` and `REN NEW.TXT=B:OLD.TXT` both rename on drive B.
With two different drives it fails, and prints its argument with a question
mark, as `A:NEW.TXT=B:OLD.TXT?`.

`COPY` works in the current user area, on both drives. A name with no drive
means the current drive, so a destination can turn out to be the same file as
the source. That fails with `COPY?` before any file is opened. On drive A it
covers `COPY STARTUP.CMD A:`, `COPY A:STARTUP.CMD STARTUP.CMD` and
`COPY STARTUP.CMD` with no destination at all. Here the first copy has a type
and no name, and the next two fail:

<!-- node tools/capture.mjs "COPY STARTUP.CMD B:.DOC" "DIR B:" "COPY A:STARTUP.CMD STARTUP.CMD" "COPY STARTUP.CMD" -->
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

The same rule makes `COPY A:STARTUP.CMD` on drive B a copy to drive B. A word
after the destination, as in `COPY STARTUP.CMD B:X.TXT JUNK`, also gives
`COPY?` before any file is opened. `COPY`'s four messages of its own are in
the table of failure messages below.

Before it erases with a name that matches every file, such as `*.*` or
`B:*.*`, `ERA` prints `ALL (Y/N)?` and reads your answer up to Return. A `Y`
as the answer's first character, in either case, erases the files. Anything
else leaves them, as Return alone does:

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

A name with wildcards that matches only some files, such as `ERA *.TXT`,
erases them with no question.

### SAVE

`SAVE` writes memory to a file, from `0100h`, in pages of 256 bytes:
`SAVE 2 TWO.COM` writes the 512 bytes at `0100h–02FFh`. The CCP loads each
program at `0100h`, so `SAVE` keeps whatever the last program loaded or left
there. In CP/M 2.2 it was the way to keep a program loaded and patched with a
debugger. The number is decimal and may be 0, which makes an empty
file.

The pages must stay below TEC-OS's own memory, whose start
[Chapter 8](08-memory.md) gives. On the starter card with no service
installed, `SAVE` takes up to 184 pages:

<!-- node tools/capture.mjs B: "SAVE 2 TWO.COM" "SAVE 185 BIG.COM" DIR -->
```text
A>B:
B>SAVE 2 TWO.COM
B>SAVE 185 BIG.COM
185?

B>DIR
TWO.COM     
1 file, 8172K free
B>
```

A number above 255 gets the same question mark, as `SAVE 320 X.COM` gives
`320?`. A file of the same name is erased first. When the directory has no
room for the file, `SAVE` prints `NO SPACE` and makes none. When the drive or
the directory fills during the writes, `SAVE` closes the file and then prints
`NO SPACE`. The file keeps the pages written. CP/M 2.2's `SAVE` leaves the
file open there, and the pages of its last extent in no directory entry.

## Drives and user areas

A drive letter and a colon, alone on the line, select that drive. The prompt
shows it, and file names with no drive are on it. TEC-OS has four drives, A
to D. A drive has a volume only when the card's header or the `MOUNT` program
put one there, as [Chapter 5](05-drives-and-cache.md) describes. The starter
card has volumes on A and B. Selecting a drive with no volume, or naming a
file on one, gives the BDOS's error for an empty drive. The prompt stays on
the drive it was on:

<!-- node tools/capture.mjs B: "@start C:" "@key x" "@start DIR C:" "@key x" -->
```text
A>B:
B>C:
Bdos Err On C: Select
B>DIR C:

Bdos Err On C: Select
B>
```

After the message TEC-OS waits for a key, `x` in this run, and then prints
the prompt. The section on failure messages, below, explains the wait. The
letters `E:` to `P:` name drives as CP/M 2.2 has them and give the same
error. `Q:` and the letters after it aren't drives, so the CCP prints `Q:?`.

CP/M divides the files on a drive into 16 user areas, numbered 0 to 15, and
every file belongs to one. The built-in commands, and a program's files, are
those of the current user area, on every drive. The one exception is the
search for a program, which also looks in area 0, as the next section
describes. TEC-OS starts in user area 0, where the starter card's files all
are. `USER` and a number select another area. In an area other than 0 the
prompt shows the area's number before the drive, as CP/M 3's does. The files
of area 0 are then out of view:

<!-- node tools/capture.mjs "USER 3" "SAVE 1 B:MINE.COM" "DIR B:" MOUNT "USER 0" "DIR B:" -->
```text
A>USER 3
3A>SAVE 1 B:MINE.COM
3A>DIR B:
MINE.COM    
1 file, 8172K free
3A>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

3A>USER 0
A>DIR B:
NO FILE
A>
```

`DIR B:` in area 3 lists only `MINE.COM`, and back in area 0 `MINE.COM` is
out of view. `MOUNT` still runs in area 3, because the search for a program
goes on to area 0 when the current area has no `MOUNT.COM`. `COPY` works
within one area, so it can't move a file from one area to another.
`tecvol put --user N`, from [Chapter 4](04-cards-and-volumes.md), puts a file
from a PC into area `N`. A number outside 0 to 15, or `USER` with no number,
fails with a question mark.

The CCP stores the drive and the user area in the byte at `0004h` each time
it prints the prompt. Both survive a program's end. The one exception is a
drive whose volume `MOUNT` took away while the prompt was on it: the next
prompt is then on drive A. A reset returns to drive A and area 0.

## Running a program

A command that isn't a built-in names a program. The CCP searches the
directory of the current drive for the file `NAME.COM`. It searches the
current user area first and then, if that area isn't 0, area 0. It then
loads the file at `0100h` and starts it. A file in area 0 is found whether or
not its system attribute is set. The current user area stays as it was.
Suppose the current drive has no `NAME.COM` in either area, the command names
no drive and the current drive isn't A. The CCP then searches drive A in the
same way and runs the program
from there, and the current drive stays as it was. A drive in front of the
name runs the program from that drive, in the current user area or area 0.
The CCP then searches no other drive:

<!-- node tools/capture.mjs B: "A:MOUNT" MOUNT "STARTUP.CMD" -->
```text
A>B:
B>A:MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>MOUNT
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>STARTUP.CMD
STARTUP.CMD?

B>
```

A type after a program's name is replaced, so `MOUNT.COM` runs `MOUNT`.
`STARTUP.CMD` as a command searches for `STARTUP.COM` on drive B and then on
drive A, and finds it on neither. The exception is `.SVC`. It installs a service
from the current drive or the drive named, and never from drive A in its
place.

The command fails, with its name and a question mark, when no `NAME.COM` is
found. It also fails when `NAME.COM` is there but is too large for the memory
a program may use. The CCP then searches no further. So a `NAME.COM` too
large on drive B is not passed over for one on drive A. A read that fails on
the card gives the BDOS's `Bad Sector` message, described below, and no
question mark.

The rest of the line after the program's name is the command tail. The CCP
copies it to page zero for the program, as
[Chapter 7](07-first-program.md) describes. When the program ends, TEC-OS
runs a warm boot. The warm boot writes the cache's changes to the card, and
the CCP then starts a new line and prints the prompt. The prompt is on the
drive and in the user area the program started from, and on the same
console. [Chapter 5](05-drives-and-cache.md) describes what a reset keeps.

## Several commands on one line

`!` between two commands runs the first and then the second. CP/M 2.2 runs
one command per line, and TEC-OS takes this rule from CP/M 3's CCP. Each
command after the first is echoed after its own prompt. The screen reads as
if you had typed them one at a time:

<!-- node tools/capture.mjs "DIR *.CMD!TYPE STARTUP.CMD" "mount!!  ! dir b:!" -->
```text
A>DIR *.CMD!TYPE STARTUP.CMD
STARTUP.CMD 
1 file, 980K free
A>TYPE STARTUP.CMD
GLCD.SVC

A>mount!!  ! dir b:!
00 SYSTEM      G1M A:
01 WORK        G8M B:

A>dir b:
NO FILE
A>
```

The part of a line between two `!`, or between a `!` and an end of the line,
is a *piece*. In the second line the CCP passes over an empty piece, a piece
of spaces and a `!` at the end. So `mount!!  ! dir b:!` is two commands. A
line of nothing but spaces and `!` runs nothing. The CCP turns each piece into
capitals as it takes it to run. The echo of a piece is as you
typed it, so `dir b:` stays in lower case on the screen.

A piece is a whole command, and whatever it changes holds for the pieces
after it. A drive change or a `USER` command in one piece sets the drive or
user area of the next:

<!-- node tools/capture.mjs "B:!COPY A:STARTUP.CMD NOTES.TXT!DIR" -->
```text
A>B:!COPY A:STARTUP.CMD NOTES.TXT!DIR
B>COPY A:STARTUP.CMD NOTES.TXT
COPIED 0001

B>DIR
NOTES.TXT   
1 file, 8172K free
B>
```

`NOTES.TXT`, with no drive, was made on drive B, because the first piece had
made B the current drive. A program in a piece starts as it would from a line
of its own, with the command tail from its own piece. The tail ends at the
`!` after the piece. The pieces that follow are outside the tail, and no
command or argument can hold a `!`.

The whole line holds up to 127 characters, as a typed line does. A line of 32
commands of three letters each, with 31 `!`, fits. The history, described at
the end of this chapter, stores the line once, whole and as typed. `^W`
brings it back to run again. A line of `STARTUP.CMD` may hold `!` as well,
and its pieces all run before the startup file's next line.

A piece that starts with `:` runs only if the command before it succeeded.
If that command failed, the `:` piece is echoed and nothing runs. The rest of
the line is dropped, the pieces without `:` after it included:

<!-- node tools/capture.mjs "NOSUCH!:DIR *.CMD!DIR *.SVC" "DIR *.SVC!:DIR *.CMD" ":DIR *.CMD" -->
```text
A>NOSUCH!:DIR *.CMD!DIR *.SVC
NOSUCH?

A>:DIR *.CMD
A>DIR *.SVC!:DIR *.CMD
GLCD.SVC    
1 file, 980K free
A>:DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>:DIR *.CMD
STARTUP.CMD 
1 file, 980K free
A>
```

`NOSUCH` isn't a command, so `:DIR *.CMD` didn't run, and `DIR *.SVC` after
it was dropped with the rest of the line. In the second line `DIR *.SVC`
succeeded and `:DIR *.CMD` ran. The third line starts with `:`. The command
it tests is the last one of the line before, the `DIR *.CMD` that succeeded.
A `:` at the start of a line typed after a failure runs nothing.

A built-in succeeds unless it ends with one of the failure messages below. A
program succeeds unless it reports otherwise. A program reports failure through
a return code, which
[Chapter 11](11-return-codes-and-chaining.md) describes for programmers. A
program that prints its own error message and returns has succeeded unless
it set that code. A program can also end by handing the CCP a line of its
own. That line runs in place of the rest of the line the program came from.
The starter card's editor `TED` does this, and Chapter 11 describes how.

These events drop what is left of a line:

- a `:` piece after a failure
- `^C` typed while a line that a program reads with function 10 is empty,
  which includes the CCP's own prompt
- `^C` typed after `^S` has stopped a program's output
- `^C` at the `[more]` of a `TYPE` or `DIR` listing
- the key that ends a BDOS error, such as `Bdos Err On C: Select`
- a `Write lost` message at a warm boot, which
  [Chapter 5](05-drives-and-cache.md) describes
- a reset

After a reset TEC-OS starts again from the startup file. After the others the
CCP prints the prompt and waits for a new line. Here the BDOS error for a
drive with no volume, ended by the key `x`, drops the `MOUNT` after it:

<!-- node tools/capture.mjs "@start DIR C:!MOUNT" "@key x" -->
```text
A>DIR C:!MOUNT

Bdos Err On C: Select
A>
```

Other ways a command can end leave the rest of the line to run. Esc or `Q` at
`[more]` ends only the listing. The line's next piece then runs, as it does
after a listing that ran to its end.

## Failure messages

When a command fails, the CCP prints one of these messages:

| Message | Printed by | Cause |
| --- | --- | --- |
| `NAME?` | any command | an unknown command, a bad name or argument, a program that won't load, a service that won't install |
| `NO FILE` | `DIR`, `TYPE`, `ERA`, `REN` | no file of that name, or none that matches |
| `FILE EXISTS` | `REN` | the new name is taken |
| `NO SPACE` | `SAVE` | the drive or its directory is full |
| `NO SOURCE` | `COPY` | no source file |
| `CANNOT MAKE DEST` | `COPY` | the destination's directory is full |
| `WRITE ERROR` | `COPY` | a record couldn't be written, as on a full drive; the destination is closed first and keeps the records copied |
| `CLOSE ERROR` | `COPY` | the finished copy couldn't be closed |

The `NAME` in `NAME?` is the word the CCP was reading when the command
failed. Every built-in but `COPY` and `UNLOAD` prints its first argument
there, as `DIR A: B:` printed `A:?`. A built-in that needs an argument and
has none prints the question mark alone: `ERA` with no name prints `?`. The
exception is `TYPE`, which prints `NO FILE`. `COPY` and `UNLOAD` print their
own names, `COPY?` and `UNLOAD?`. So do an unknown command and a program that
won't load. Appendix D lists every message TEC-OS prints.

The BDOS prints its own message when a disk operation can't be done at all.
The message is `Bdos Err On`, the drive and one of four causes:

| Message | Cause |
| --- | --- |
| `Bdos Err On C: Select` | the drive has no volume |
| `Bdos Err On C: Bad Sector` | a record couldn't be read from the card or written to it |
| `Bdos Err On B: File R/O` | the file to be written, renamed or erased has its read-only attribute set |
| `Bdos Err On C: R/O` | the volume is read-only, or the drive was made read-only by BDOS function 28 |

After printing the message, the BDOS waits for a key. Any key then ends the
command, or the program that made the call, with a warm boot. A program can
instead have the error returned to it, with BDOS function 45, which
Appendix A describes. On the volume written behind, the warm boot after the
key writes the cache's changes again. It prints `Write lost` if one still
can't be written, as [Chapter 5](05-drives-and-cache.md) describes.

A write to a read-only volume, such as one made with `tecvol create`'s `:ro`
in [Chapter 4](04-cards-and-volumes.md), gives `R/O`. These commands make a
card with the starter card's `STARTUP.CMD` on drive B, its read-only
attribute set, and a read-only volume on drive C:

```sh
node tools/tecvol.mjs create build/errs.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G1M:ARCHIVE:C:ro
node tools/tecvol.mjs put build/errs.img B dist/files/STARTUP.CMD --ro
```

<!-- node tools/capture.mjs --card build/errs.img "@start SAVE 1 C:X.COM" "@key x" "@start ERA B:STARTUP.CMD" "@key x" "DIR B:" -->
```text
A>SAVE 1 C:X.COM

Bdos Err On C: R/O
A>ERA B:STARTUP.CMD

Bdos Err On B: File R/O
A>DIR B:
STARTUP.CMD 
1 file, 8172K free
A>
```

Neither command changed the card: `SAVE` made no file on drive C, and
`STARTUP.CMD` is still on drive B. A drive made read-only by function 28
stays so until the next warm boot. A read-only volume stays so after it.

## Command history

You can bring back an earlier command line and save typing it again. TEC-OS
keeps the lines typed at the CCP's prompt, in a store that
[Chapter 22](22-command-history.md) describes. `^W` at the prompt replaces
the line being typed with the line typed before it, and a second `^W` with
the one before that. `^N` moves the other way, toward the newest. One step
past the newest leaves an empty line. A line brought back can be edited with
the keys of Chapter 2 and run with Return, as if it had been typed. Here
`DIR *.SVC` and `CON` were typed, then `^W`, `^W` and Return. The PICO9918's
screen shows `DIR *.SVC` brought back and run again:

<!-- node tools/capture.mjs --board pico --screen "DIR *.SVC" CON "@start "$'\x17\x17' -->
```text

TEC-OS 0.1 for TEC-1G
A: SYSTEM
B: WORK

A>GLCD.SVC

A>DIR *.SVC
GLCD.SVC
1 file, 980K free
A>CON
CON: CRT:
A>DIR *.SVC
GLCD.SVC
1 file, 980K free
A>
```

The history holds 256 bytes of lines, and the oldest go first when it fills.
A line the same as the newest is not stored again. The lines of the startup
file are not stored at all. A warm boot keeps the history, and a reset
empties it.
