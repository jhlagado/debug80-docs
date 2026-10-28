---
title: The command line
parent: TEC-OS
nav_order: 3
---

# The command line

The prompt belongs to the command processor, CP/M's CCP. It reads a line,
runs a built-in command or loads a program, and prints the prompt again.
TEC-OS's command processor has CP/M 2.2's built-in commands and a few of its
own. This chapter covers files and their names, the built-in commands, user
areas, command history and command processors nested inside each other.

## File names

A CP/M file name has up to eight characters, a full stop and an extension of
up to three, as in `README.TXT`. TEC-OS converts names to capitals, so
`readme.txt` names the same file. A drive letter and a colon in front name a
file on another drive: `B:NOTES.TXT`. Without one, the name refers to the
current drive.

Two wildcards match groups of files. `?` matches any one character and `*`
matches the rest of the name or the extension. `*.COM` matches every
program, and `*.*` matches every file.

## Running a program

A command that is not built in names a program. The command processor looks
on the current drive for `NAME.COM` and runs it. If there is no `NAME.COM`
it looks for `NAME.PRL`, a relocatable program that Chapter 8 describes. A
drive letter in front runs a program from another drive, as in `A:DEMO`.

When neither file exists, the command processor repeats the name with a
question mark:

```text
A>NOSUCH
NOSUCH?

A>
```

The rest of the line after the program's name is the command tail. The command processor passes it to the program at `0080h` as a length byte
followed by the text. For `EDIT NOTES.TXT`, `EDIT.COM` finds the length 10
and ` NOTES.TXT`, with its leading space.

## Built-in commands

These commands are part of the command processor. Their names can't be
used for programs.

| Command | Effect |
| --- | --- |
| `DIR` | List the files on a drive, or those matching a name |
| `TYPE NAME` | Print a text file |
| `ERA NAME` | Erase files |
| `REN NEW=OLD` | Rename a file |
| `SAVE n NAME` | Save `n` pages of memory from `0100h` as a file |
| `USER n` | Change the user area |
| `COPY SOURCE DEST` | Copy a file |
| `CON` | Show or change the console (Chapter 2) |
| `CCP`, `EXIT` | Start a nested command processor, and leave it |
| `UNLOAD` | Remove the most recent resident program (Chapter 8) |
| `B:` | Change the current drive |

### DIR

`DIR` alone lists the current drive. A drive, a name or a pattern narrows
the list:

```text
A>DIR A:*.COM
TERM.COM     PROBE.COM    DEMO.COM     MOUNT.COM    VOLS.COM     EDIT.COM
6 files, 994K free
A>
```

TEC-OS fits as many columns as the console is wide, then prints the number
of files and the space left on the drive. CP/M 2.2's own `DIR` shows the
names differently, so a program that reads `DIR`'s output to find files
won't work. When nothing matches, `DIR` prints `NO FILE`.

### COPY

`COPY` copies one file. The destination needs a full name, with a drive if
it is on another one:

```text
A>COPY EDIT.COM B:EDIT.COM
COPIED 003E

A>
```

The number after `COPIED` counts the 128-byte records copied, in
hexadecimal. `3Eh` is 62 records, 7,936 bytes. A destination that is only a
drive, such as `B:`, is not a name, and `COPY` answers `COPY?`. An existing
file of the same name is replaced.

### TYPE, ERA and REN

`TYPE` prints a file, pausing with `[more]` at each full screen as
Chapter 2 describes. `ERA` erases a file or, with a pattern, every file
that matches it. `ERA *.*` asks first:

```text
A>ERA B:*.*
ALL (Y/N)?
```

`REN` takes the new name first, then an equals sign and the old name. This
follows CP/M 2.2, and it reads like an assignment:

```text
B>REN TEXT.TXT=NOTES.TXT
B>
```

Commands that succeed print nothing more. When the file isn't there, `ERA`,
`REN` and `TYPE` print `NO FILE`.

### SAVE

`SAVE` writes memory from `0100h` to a file, in pages of 256 bytes.
`SAVE 2 EMPTY.COM` writes 512 bytes. It was CP/M's way to keep a program
you had loaded and patched in memory with a debugger.

## User areas

Each drive is divided into 16 user areas, numbered 0 to 15. A file belongs
to one of them, and `DIR` shows only the files in the current one. TEC-OS
starts in user area 0, and the files on the starter card are there.

`USER` followed by a number changes the area. The prompt doesn't show the
area, so it is easy to lose track:

```text
B>USER 3
B>DIR
NO FILE
B>USER 0
B>
```

A number outside 0 to 15 is refused with a question mark, and so is `USER`
alone. While area 3 is current, a program can open only the files in area 3, on
every drive. To run a program from area 0 while you work in another area, copy it
into that area first. The user area survives a program's exit, but a reset
returns to area 0.

## Drives

A command that names a drive with nothing on it gets CP/M's error:

```text
A>DIR B:

Bdos Err On B: Select
A>
```

After the message, TEC-OS waits for a key and then returns to the prompt.
Chapter 4 shows how drives get their volumes.

## Command history

The command processor remembers the lines you type at the prompt. `^W`
brings back the line before the one shown, replacing whatever you had
typed, and `^N` brings back the line after. Past the newest line the input
is empty again. A line brought back can be edited with the backspace key and
sent with Return, as if you had typed it.

The history holds 256 bytes of lines, enough for a dozen or more typical
commands. The oldest lines go first when it fills. A line the same as the
newest one is not stored twice. The history survives a program's exit and
is cleared by a reset.

History works only at the command prompt. A program that reads a line from
the console through CP/M's line-input function gets CP/M 2.2's behaviour,
where `^W` and `^N` are ordinary characters.

## Nested command processors

`CCP` starts a second command processor inside the first. It prints a
blank line and the prompt, which looks the same. You can change drives,
change user areas, mount volumes and run programs in it. `EXIT` returns to
the command processor that started it, with that one's drive, user area and
mounted volumes back:

```text
A>CCP

A>B:
B>EXIT

A>
```

Command processors nest six deep. `EXIT` at the first one is refused with
`EXIT?`.

A nested command processor is more useful to a program than to you at the
prompt. An editor can start one to let you run a command and then carry on
where it was. While the nested command processor runs, TEC-OS keeps the
program's memory in EXPAND 1 and puts it back at `EXIT`. Chapter 5 explains
EXPAND 1.
