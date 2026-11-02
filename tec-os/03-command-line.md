---
title: The command line
parent: TEC-OS
nav_order: 3
nav_group: "Part I: Using and programming TEC-OS"
---

# 3. The command line

Checked against TEC-OS 718c01b, with the starter card's `EDIT.COM` from Edit
845d062, whose copy in `dist/files` has the SHA-256
`ed88337e6dfa2626dd37a225a0ec09332f4927a0bde62114bbf8661d2d0fdc78`, and its
`TAS.COM` from Thorium 7604daa, with the SHA-256
`ff18734807206127d4ede7a96bbd26acf36310361834a1c9ae998b20e2f98292`.

Everything you do at the `A>` prompt goes through the CCP, the command
processor that Chapter 1 introduced. The CCP reads the line you type, finds
the command the line names and runs it. This chapter describes the line, its
file names and wildcards, and each command built into the CCP. It then
describes how a program is found and started, user areas, the messages a
failed command prints and the history of command lines behind `^W` and `^N`.

## The line

The CCP reads a line with BDOS function 10, CP/M's line input, which gives you
the editing keys that Chapter 2 lists. Return ends the line, which holds up to
127 characters, and a 127th character ends it as Return would. Before it
searches for the command, the CCP turns every lower-case letter into a
capital, so `dir *.com` and `DIR *.COM` are the same command:

<!-- node tools/capture.mjs "dir *.com" "DIR ????.COM" "DIR A:P*.*" "DIR B:" -->
```text
A>dir *.com
TERM.COM     PROBE.COM    DEMO.COM     MOUNT.COM    VOLS.COM     EDIT.COM
TAS.COM     
7 files, 976K free
A>DIR ????.COM
TERM.COM     DEMO.COM     VOLS.COM     EDIT.COM     TAS.COM     
5 files, 976K free
A>DIR A:P*.*
PROBE.COM    PICO.SVC     PICO40.SVC   PICO32.SVC  
4 files, 976K free
A>DIR B:
NO FILE
A>
```

The echo of the line is what you typed, in lower case if you typed it so. The
first word of the line is the command, and the words after it, separated by
spaces, are its arguments. A command is a built-in, one of the commands the
CCP carries in the ROM, or else the name of a program file on the card.

Two characters have a meaning of their own in a line. `!` separates commands,
so `DIR!TYPE README.TXT` runs `DIR` and then `TYPE`, and a command that starts
with `:` runs only if the one before it succeeded. Chapter 11 describes both.

## File names

A CP/M file name has up to eight characters, then a full stop and a type of up
to three: `README.TXT`, `PICO.SVC`. The type may be left out, with its full
stop, and then it is three spaces. A drive letter and a colon in front of the
name, as in `B:NOTES.TXT`, name a file on another drive. Without one, the name
is on the current drive, the one the prompt shows.

A name may hold any character but a space and these: `<`, `>`, `,`, `;`, `:`,
`[`, `]`, `%`, `|`, `(`, `)`, `/` and `\`. `.` and `=` are taken as the ends
of a name's parts. A name that breaks these rules, or a part that is too long,
makes the command fail, and the CCP prints back the word it was reading with a
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

`TYPE *.CMD` fails because `TYPE` takes one file and `*.CMD` is a wildcard,
which the next section explains. `DIR A: B:` fails because `DIR` takes one
argument, and the word printed back is the command's first argument, `A:`, not
the extra one after it.

Every built-in but `COPY` and `UNLOAD` prints its first argument in this way.
A built-in that needs an argument and has none prints the question mark alone:
`ERA` with no name prints `?`. The exception is `TYPE`, which prints
`NO FILE`. `COPY` and `UNLOAD` print their own names, `COPY?` and `UNLOAD?`,
and so do an unknown command and a program that won't load.

## Wildcards

Two characters in a name match a group of files. `?` matches any one character
in its place, and `*` matches the rest of the part it is in: in the name, up
to eight characters, or in the type, up to three. The CCP turns a `*` into `?`
characters to the end of its part, so `P*.*` is `P???????.???` and matches
every file whose name starts with `P`, whatever its type. Characters after a
`*` in the same part are passed over, so `D*X` is the same as `D*`.

A `?` also matches a space, and a name shorter than eight characters is padded
with spaces. So `????.COM` is `????` and four spaces, which is why in the
transcript above it matches the names of up to four characters with the type
`COM`, and not `PROBE.COM` or `MOUNT.COM`.

Only `DIR` and `ERA` take a name with wildcards. `TYPE`, `REN`, `SAVE` and
`COPY` each work on one file, and a wildcard in their names makes the command
fail, as `TYPE *.CMD` did. The command's own name may hold no wildcard either.

## The built-in commands

The CCP's built-in commands are these:

| Command | Effect |
| --- | --- |
| `DIR` | Lists files on a drive |
| `TYPE NAME` | Prints a text file |
| `COPY SOURCE DEST` | Copies a file |
| `REN NEW=OLD` | Renames a file |
| `ERA NAME` | Erases a file, or every file a name with wildcards matches |
| `SAVE N NAME` | Writes the first `N` pages of the TPA (Chapter 1) to a file |
| `USER N` | Selects user area `N` |
| `B:` | Selects drive B, and so on for the other drives |
| `CON` | Names or changes the console (Chapter 2) |
| `NAME.SVC` | Installs the service in the file `NAME.SVC` |
| `SERVICES` | Lists the services installed |
| `UNLOAD` | Removes the service installed last |

A built-in's name is matched only as a whole word, followed by a space or the
end of the line, so `DIRX` is the name of a program, not `DIR` with something
after it. A drive in front of a built-in's name, as in `A:DIR`, also makes it
the name of a program, here `DIR.COM` on drive A.

## DIR

`DIR` with no argument lists every file on the current drive, and `DIR B:`
every file on drive B. A name, with or without a drive, lists only the files
it matches. Each file appears as its name and type, in columns 13 characters
wide, and the console's width sets how many columns fit: six on the serial
terminal and on the PICO9918 at 80 columns, and one on the graphics LCD. The
last line gives the number of files listed and the free space on the drive
listed, in KiB. When no file matches, `DIR` prints `NO FILE`.

A listing longer than the screen stops with `[more]`, as Chapter 2 describes.
`DIR` lists only the files of the current user area, described below, and it
leaves out a file whose system attribute is set. `tecvol put --sys` sets that
attribute on a file put on a card from a PC, and a program can set it with
BDOS function 30. A system file is still there for every other command: `TYPE`
prints it and a command runs it.

`DIR`'s layout is TEC-OS's own, and CP/M 2.2's `DIR` prints the names in a
different layout.

## TYPE

`TYPE` prints a text file. It reads the file a record of 128 bytes at a time
and stops at the first `^Z`, the byte `1Ah` that ends a CP/M text file, or at
the end of the file's last record:

<!-- node tools/capture.mjs "TYPE STARTUP.CMD" -->
```text
A>TYPE STARTUP.CMD
PICO.SVC
GLCD.SVC

A>
```

`STARTUP.CMD` ends its last line with a carriage return and a line feed, and
the blank line after it is the one the CCP prints before the prompt. A file
that isn't there gives `NO FILE`, and so does `TYPE` with no name. Like `DIR`,
`TYPE` stops at `[more]` when the screen fills.

## COPY, REN and ERA

`COPY` copies one file to another name, to another drive or both. Chapter 1
showed it in the starter card's `README.TXT`. When the destination is a drive
alone, as in `COPY README.TXT B:`, the copy has the source's name. A
destination with a type and no name, such as `B:.DOC` or `B:.*`, also takes
the whole of the source's name, and the type you typed has no effect. The copy
goes a record at a time, and `COPIED` and a number report the records copied,
in hexadecimal: `000A` is ten records, 1,280 bytes. A file of the destination's
name is erased first, so `COPY` replaces it.

`REN` renames a file, with the new name first, an equals sign and the old name
after it, as CP/M 2.2 has it. `ERA` erases files. Here a copy of `README.TXT`
is made on drive B under two names, and one is renamed and then erased:

<!-- node tools/capture.mjs "COPY README.TXT B:" "COPY README.TXT B:COPY.TXT" B: DIR "REN NOTES.TXT=COPY.TXT" "REN NOTES.TXT=README.TXT" DIR "ERA NOTES.TXT" "ERA NOTES.TXT" DIR -->
```text
A>COPY README.TXT B:
COPIED 000A

A>COPY README.TXT B:COPY.TXT
COPIED 000A

A>B:
B>DIR
README.TXT   COPY.TXT    
2 files, 8168K free
B>REN NOTES.TXT=COPY.TXT
B>REN NOTES.TXT=README.TXT
FILE EXISTS
B>DIR
README.TXT   NOTES.TXT   
2 files, 8168K free
B>ERA NOTES.TXT
B>ERA NOTES.TXT
NO FILE
B>DIR
README.TXT  
1 file, 8172K free
B>
```

Each 1,280-byte file takes 4 KiB of the drive, since the volume on drive B,
`WORK`, gives space to files in allocation blocks of 4 KiB. Chapter 4
describes the volumes and their allocation blocks. The second `REN` fails
because a file of the new name, `NOTES.TXT`, is there already, and `REN`
changes nothing then. A `REN` whose old name isn't there prints `NO FILE`, and
so does an `ERA` that matches no file, as the second `ERA` above shows.

`COPY` works in the current user area, on both drives. A name with no drive
means the current drive, so a destination can turn out to be the same file as
the source, and that fails with `COPY?` before any file is opened. On drive A
that covers `COPY README.TXT A:`, `COPY A:README.TXT README.TXT` and
`COPY README.TXT` with no destination, which has the source's name and the
current drive. Here the first copy has a type and no name, and the next two
fail:

<!-- node tools/capture.mjs "COPY README.TXT B:.DOC" "DIR B:" "COPY A:README.TXT README.TXT" "COPY README.TXT" -->
```text
A>COPY README.TXT B:.DOC
COPIED 000A

A>DIR B:
README.TXT  
1 file, 8172K free
A>COPY A:README.TXT README.TXT
COPY?

A>COPY README.TXT
COPY?

A>
```

The same rule makes `COPY A:README.TXT` on drive B a copy to drive B.

`COPY` has four messages of its own. `NO SOURCE` means the source isn't there,
and `CANNOT MAKE DEST` means the destination's directory is full.
`WRITE ERROR` means a record can't be written, as on a full drive, and
`CLOSE ERROR` means the finished copy can't be closed.

Before it erases with a name that matches every file, such as `*.*` or
`B:*.*`, `ERA` prints `ALL (Y/N)?` and reads a line. A `Y` as the line's first
character, in either case, erases the files, and anything else leaves them:

<!-- node tools/capture.mjs "COPY README.TXT B:" B: "@start ERA *.*" $'@key n\r' DIR "@start ERA *.*" $'@key y\r' DIR -->
```text
A>COPY README.TXT B:
COPIED 000A

A>B:
B>ERA *.*
ALL (Y/N)?n
B>DIR
README.TXT  
1 file, 8172K free
B>ERA *.*
ALL (Y/N)?y
B>DIR
NO FILE
B>
```

A name with wildcards that matches only some files, such as `ERA *.TXT`, erases
them with no question.

## SAVE

`SAVE` writes memory to a file, from `0100h`, in pages of 256 bytes:
`SAVE 2 TWO.COM` writes the 512 bytes at `0100h–02FFh`. `0100h` is where the
CCP loads each program, so `SAVE` keeps whatever the last program loaded or
left there. In CP/M 2.2 it was the way to keep a program loaded and patched
with a debugger. The number is decimal and may be 0, which makes an empty
file.

The pages must stay below the address in the word at `0006h`, so the number
must be less than the high byte of that word. On the starter card with no
service installed the word is `B806h`, and `SAVE` takes up to 183 pages:

<!-- node tools/capture.mjs B: "SAVE 2 TWO.COM" "SAVE 184 BIG.COM" DIR -->
```text
A>B:
B>SAVE 2 TWO.COM
B>SAVE 184 BIG.COM
184?

B>DIR
TWO.COM     
1 file, 8172K free
B>
```

A file of the same name is erased first. When the drive or its directory is
full, `SAVE` prints `NO SPACE`.

## Drives

A drive letter and a colon, alone on the line, select that drive. The prompt
shows it, and file names with no drive are on it. TEC-OS has four drives, A to
D, but a drive has a volume only when the card's header or the `MOUNT` program
put one there, as Chapter 4 describes. The starter card has volumes on A and
B. Selecting a drive with no volume, or naming a file on one, gives the BDOS's
error for an empty drive, and the prompt stays on the drive it was on:

<!-- node tools/capture.mjs B: "@start C:" "@key x" "@start DIR C:" "@key x" -->
```text
A>B:
B>C:
Bdos Err On C: Select
B>DIR C:

Bdos Err On C: Select
B>
```

After the message TEC-OS waits for a key, `x` in this run, and then prints the
prompt. The section on the BDOS's messages, below, explains the wait. The
letters `E:` to `P:` name drives as CP/M 2.2 has them and give the same error,
but `Q:` and the letters after it aren't drives, so the CCP prints `Q:?`.

The CCP stores the drive and the user area in the byte at `0004h` each time it
prints the prompt. A program's end leaves the prompt on that drive, or on drive
A if the drive has lost its volume, and a reset returns it to drive A.

## User areas

CP/M divides the files on a drive into 16 user areas, numbered 0 to 15, and
every file belongs to one. A command, a program and `DIR` work only on the
files of the current user area, on every drive. TEC-OS starts in user area 0,
where the starter card's files all are, and `USER` and a number select another
area. The prompt doesn't show the area, so the files of area 0 disappear from
view after `USER 3`:

<!-- node tools/capture.mjs "USER 3" "SAVE 1 B:MINE.COM" "DIR B:" VOLS "USER 0" "DIR B:" -->
```text
A>USER 3
A>SAVE 1 B:MINE.COM
A>DIR B:
MINE.COM    
1 file, 8172K free
A>VOLS
VOLS?

A>USER 0
A>DIR B:
NO FILE
A>
```

In area 3 the program `VOLS` isn't found, since `VOLS.COM` is in area 0, and
back in area 0 `MINE.COM` is out of view. `COPY` works within one area, so it
can't move a file from one area to another, but `tecvol put --user N`, from
Chapter 4, puts a file from a PC into area `N`. A number outside 0 to 15, or
`USER` with no number, fails with a question mark.

The user area survives a program's end and a warm boot, like the drive, and a
reset returns to area 0.

## Services

A command that names a file of type `.SVC` installs the service it holds. A
service is code that TEC-OS keeps in memory below the BDOS until a reset or
`UNLOAD`, as Chapter 1 explained for the display drivers. `SERVICES` lists the
services installed, the newest first, each with the number of 256-byte pages it
takes. `UNLOAD` removes the newest one if that service can be removed, and
otherwise it changes nothing and prints `UNLOAD?`. It prints the same with no
service installed. On the web page's board, where `PICO.SVC` is installed at
startup, the PICO9918's screen shows this, from the startup file's second line
on:

<!-- node tools/capture.mjs --board pico --screen SERVICES UNLOAD -->
```text

A>GLCD.SVC
GLCD.SVC?

A>SERVICES
PICO 6
A>UNLOAD
UNLOAD?

A>
```

`PICO.SVC` takes six pages, 1,536 bytes, and its removal fails while the
PICO9918 is the console. A `.SVC` file that isn't there, or that doesn't
install, gives the command's name with a question mark, as `GLCD.SVC?` shows
here. Chapter 5 gives the rules for installing and removing services, and
Chapter 10 describes how a service is made.

## Running a program

A command that isn't a built-in names a program. The CCP searches the
directory of the current drive, in the current user area, for the file
`NAME.COM`, then loads the file at `0100h` and starts it. If there is no
`NAME.COM`, it searches for `NAME.PRL`, a program in Digital Research's
relocatable PRL format, which Chapter 10 describes. A drive in front of the
name runs the program from that drive, and the CCP searches no other:

<!-- node tools/capture.mjs B: "A:VOLS" VOLS "README.TXT" -->
```text
A>B:
B>A:VOLS
00 SYSTEM      G1M A:
01 WORK        G8M B:

B>VOLS
VOLS?

B>README.TXT
README.TXT?

B>
```

A type after a program's name is replaced, so `VOLS.COM` runs `VOLS`, and
`README.TXT` as a command searches for `README.COM` and then `README.PRL` and
finds neither. The exception is `.SVC`, which installs a service.

The command fails, with its name and a question mark, when neither file is
there. It also fails when `NAME.COM` is there but is too large for the TPA. A
`NAME.COM` that is too large is not passed over for a `NAME.PRL`. A read that
fails on the card gives the BDOS's `Bad Sector` message, described below, and
no question mark.

The rest of the line after the program's name is the command tail. The CCP
copies it to `0080h` for the program and fills the two file control blocks at
`005Ch` and `006Ch` from the tail's first two words, so a file name is ready
for a program that takes one. Chapter 6 describes both. When the program ends,
TEC-OS runs a warm boot, and the CCP then starts a new line and prints the
prompt.

## The CCP's messages

When a command fails, the CCP prints one of these messages:

| Message | Printed by | Cause |
| --- | --- | --- |
| `NAME?` | any command | an unknown command, a bad name or argument, a program that won't load, a service that won't install |
| `NO FILE` | `DIR`, `TYPE`, `ERA`, `REN` | no file of that name, or none that matches |
| `FILE EXISTS` | `REN` | the new name is taken |
| `NO SPACE` | `SAVE` | the drive or its directory is full |
| `NO SOURCE` | `COPY` | no source file |
| `CANNOT MAKE DEST` | `COPY` | the destination's directory is full |
| `WRITE ERROR` | `COPY` | a record couldn't be written |
| `CLOSE ERROR` | `COPY` | the destination couldn't be closed |

Appendix D lists every message TEC-OS prints.

## The BDOS's messages

The BDOS prints its own message when a disk operation can't be done at all.
The message is `Bdos Err On`, the drive and one of four causes:

| Message | Cause |
| --- | --- |
| `Bdos Err On C: Select` | the drive has no volume |
| `Bdos Err On C: Bad Sector` | a record couldn't be read from the card or written to it, or the volume is read-only |
| `Bdos Err On B: File R/O` | the file to be written, renamed or erased has its read-only attribute set |
| `Bdos Err On B: R/O` | the drive was made read-only by BDOS function 28 |

After printing the message, the BDOS waits for a key, and any key ends the
command, or the program that made the call, with a warm boot.

A write to a read-only volume, such as one made with `tecvol create`'s `:ro`
in Chapter 4, gives `Bad Sector`, the message for a failed disk write. These
commands make a card with the starter card's `README.TXT` on drive B, its
read-only attribute set, and a read-only volume on drive C:

```sh
node tools/tecvol.mjs create build/errs.img --volume G1M:SYSTEM:A --volume G8M:WORK:B:wb --volume G1M:ARCHIVE:C:ro
node tools/tecvol.mjs put build/errs.img B dist/files/README.TXT --ro
```

<!-- node tools/capture.mjs --card build/errs.img "@start SAVE 1 C:X.COM" "@key x" "@start ERA B:README.TXT" "@key x" "DIR B:" -->
```text
A>SAVE 1 C:X.COM

Bdos Err On C: Bad Sector
A>ERA B:README.TXT

Bdos Err On B: File R/O
A>DIR B:
README.TXT  
1 file, 8172K free
A>
```

Neither command changed the card: `SAVE` made no file on drive C, and
`README.TXT` is still on drive B. A drive made read-only by function 28, the
cause of `R/O`, stays so until the next warm boot.

## Command history

You can bring back an earlier command line and save typing it again, because
TEC-OS keeps the lines typed at the CCP's prompt, in a store that Chapter 23
describes. `^W` at the prompt replaces the line being typed with the line
typed before it, and a second `^W` with the one before that. `^N` moves the
other way, toward the newest, and one step past the newest leaves an empty
line. A line brought back can be edited with the keys of Chapter 2 and run
with Return, as if it had been typed. Here `DIR *.SVC` and `CON` were typed,
then `^W`, `^W` and Return, and the PICO9918's screen shows `DIR *.SVC`
brought back and run again:

<!-- node tools/capture.mjs --board pico --screen "DIR *.SVC" CON "@start "$'\x17\x17' -->
```text

A>GLCD.SVC
GLCD.SVC?

A>DIR *.SVC
PICO.SVC     PICO40.SVC   PICO32.SVC   GLCD.SVC
4 files, 976K free
A>CON
CON: CRT: PICO9918
A>DIR *.SVC
PICO.SVC     PICO40.SVC   PICO32.SVC   GLCD.SVC
4 files, 976K free
A>
```

The history holds 256 bytes of lines, and the oldest go first when it fills. A
line the same as the newest is not stored again, and the lines of the startup
file are not stored at all. A warm boot keeps the history, and a reset empties
it. In a line that a program reads with function 10, `^W` and `^N` are
characters like any other.