---
title: "Using Atom on CP/M"
parent: "Book 0 — Using Atom"
nav_order: 1
nav_group: "CP/M"
---

# Using Atom on CP/M

Atom uses the same assembler language on Node and CP/M. The difference is the
way the program reaches the assembler. On Node, a package installed in the
host operating system can use project files, directories and several output
formats. On CP/M, `ATOM.COM` is a transient command. It reads files from the
current drive, writes output through CP/M file services and returns to CP/M
when it finishes.

This guide assumes that you already know how to use CP/M. It covers the few
things you need to know about Atom's CP/M command and points to the shared
language reference for the assembler itself.

## Choose where to run CP/M

The commands here work on a CP/M computer or inside Triptych, a Z80 computer
emulator that runs CP/M. Triptych gives you a browser-based CP/M machine; it
does not change Atom's command or source language.

To try it in a browser, open the [Atom downloads page](https://jhlagado.github.io/atom/)
and choose **Run Atom in Triptych**. The supplied disk image starts CP/M from
the writable A: drive. It contains `ATOM.COM`, `EDIT.COM`, `HELLO.ASM` and
`HELLO.COM`. The examples below use A: for the source, assembler and output.
On a physical CP/M computer, put `ATOM.COM` and your source files on a writable
A: disk and make A: the current drive.

## Put `ATOM.COM` on a disk

Download `ATOM.COM` from the [latest Atom release](https://github.com/jhlagado/atom/releases/latest)
or copy it from the Atom disk image. Put it on A:. Keep source files and
included files on A: as well, then make A: the current drive before running
Atom.

Atom uses CP/M's ordinary current-drive file services. It does not read a
Node project file, search a directory tree or resolve a path outside the
drive's 8.3 namespace.

## Build a first program

On a physical CP/M computer, save this source as `HELLO.ASM`. The Triptych disk
image already contains the same example:

```asm
        ORG 100H                       ; CP/M loads transient commands at 0100H.

START:                                 ; Entry point at CP/M's 0100H load address.
        LD DE,MESSAGE                  ; Point DE at the dollar-terminated text.
        LD C,9                         ; Select the BDOS print-string service.
        CALL 5                         ; Enter the CP/M BDOS.
        RET                            ; Return to the command processor.

MESSAGE:                               ; String printed by BDOS function 9.
        DB "HELLO FROM ATOM",13,10,"$"  ; End with '$' for BDOS function 9.
```

This is a small CP/M program rather than an assembler-only example. CP/M's
BDOS uses `CALL 5` as its entry point. Function 9, selected by putting `9` in
`C`, writes the dollar-terminated string addressed by `DE`.

On the writable A: drive in Triptych, assemble and run the program:

```text
A>ATOM HELLO.ASM

HELLO.COM written

A>HELLO
HELLO FROM ATOM
```

Use the same A: setup on a physical CP/M computer: save `HELLO.ASM` on A: and
run Atom with A: current.

With one source name on CP/M, Atom derives a `.COM` output from the same
basename. To choose the output name and format yourself, give the source and
output as two arguments:

```text
A>ATOM HELLO.ASM HELLO.COM

HELLO.COM written

A>
```

An explicit output may be a `.COM`, `.BIN` or `.HEX` file. The command writes
one output per invocation. A COM file is a flat image loaded and entered at
`0100H`; it has no header. BIN contains the same raw bytes. HEX contains
addressed records with checksums and an end-of-file record.

## Edit a program

The Triptych disk image also contains `EDIT.COM`, a small full-screen text
editor for CP/M. Open the example source with:

```text
A>EDIT HELLO.ASM
```

Change the message text, press `^S` to save and `^Q` to leave the editor. Then run
`ATOM HELLO.ASM` again and run `HELLO` to see the new message.

## The command line

The CP/M command accepts these forms:

```text
ATOM
ATOM SOURCE
ATOM SOURCE OUTPUT
```

Bare `ATOM` displays usage and returns to CP/M without opening a file:

```text
Usage: ATOM [SOURCE [OUTPUT]]
```

A third argument also prints the usage line. A name that Atom cannot accept
prints `Invalid source name` or `Invalid output name`. For example, `ATOM ?`
prints `Invalid source name`.

With one source name, Atom accepts the complete current-drive filename and
derives the `.COM` output. `ATOM HELLO.ASM` reads `HELLO.ASM` and writes
`HELLO.COM`. It also accepts the shorter `ATOM HELLO` form. With two names, use
the complete filenames when you need a different extension:

```text
A>ATOM HELLO.ASM HELLO.HEX
```

Names are CP/M 8.3 names on the current drive. Lowercase command input is
accepted and canonicalised. Drive prefixes, wildcards, directory paths,
extra arguments and invalid filename characters are rejected.

The CP/M command has no options for a target, definitions or a project file.
It does not accept Node's `-D`, `--project` or repeatable output options.
Definitions come from `%DEFINE` lines in the source instead. The source
language remains shared, but the command line is deliberately small.

## Include other source files

A source file names other source files with leading `%INCLUDE` directives:

```asm
%INCLUDE "MESSAGE.ASM"

ORG 100H
```

`MESSAGE.ASM` is a file that you provide on the same drive. An included file
may include further files. Atom discovers the complete dependency graph before
assembly and assembles each dependency before the file that names it. Sibling
dependencies follow the order of their directives. `%INCLUDE` declares a
dependency; it does not insert text at that point in the source. Atom rejects
a missing file, an include cycle or an include that appears after ordinary
source has begun. Blank lines, whitespace and comments may appear before the
first ordinary source line.

Include names are quoted current-drive CP/M 8.3 names and are matched without
regard to letter case. Atom does not read project files, search paths or
directory paths on CP/M.

## Definitions and conditional source

`%DEFINE` gives a name to a number. `%IF`, `%ELSE` and `%ENDIF` use that number
to select source lines or includes:

```asm
%DEFINE DEBUG 1

%IF DEBUG
%INCLUDE "TRACE.ASM"
%ENDIF

ORG 100H
```

Put every `%DEFINE` in the root file's leading header, before any `%INCLUDE`
or conditional directive. The root file may hold up to 32 definitions. Names
are case-insensitive and may be up to 17 characters. Values may be decimal,
`$`-prefixed hexadecimal, `%`-prefixed binary or Intel `H` and `B` suffix
values. An Intel hexadecimal value that starts with a letter needs a leading
zero, as in `0FFFFH`. A definition can refer to an earlier definition.

Each `%IF` condition is one numeric literal or previously defined name. Zero
selects the `%ELSE` branch; any other value selects the first branch.
Conditionals may nest up to 16 levels and must balance within each file. A
conditional `%INCLUDE` must be complete in the leading header before ordinary
source begins. Atom does not open an include in an inactive branch.

A definition does not substitute text into assembler source. Declare an `EQU`
when an instruction needs the same value.

## Binary data

`INCBIN` emits bytes from a binary file on the current drive. On CP/M, give
the file's 8.3 name and a byte count:

```asm
ORG 100H
PAYLOAD: INCBIN "FONT.BIN", 2048
RET
```

The count is required on CP/M. CP/M stores files in 128-byte records, so the
padding in a file's final record cannot be told apart from its data. Choose the
count from the real length of the binary. Atom emits that many bytes from the
start of the file; a count of zero is allowed. The count may be decimal,
`$`-prefixed hexadecimal, `%`-prefixed binary or an Intel `H` or `B` suffix
value. If the count needs a record that the file does not contain, Atom stops
and leaves any previous output unchanged.

One assembly may have at most 32 active `INCBIN` statements. `INCBIN` works in
included files and in active conditional branches. Atom does not open the file
named by an `INCBIN` in an inactive branch. The same counted form also
assembles on Node.

## Output and failed builds

Atom checks the complete include graph before it starts an output. A missing
file, malformed directive, cycle or oversized source therefore leaves an
earlier output untouched.

For an output named `NAME.EXT`, Atom uses two work files on the current drive.
`NAME.$$B` holds the assembled program while Atom runs. `NAME.$$$` receives the
finished output. Atom then moves an existing `NAME.EXT` to `NAME.$$B`, renames
`NAME.$$$` to `NAME.EXT` and erases `NAME.$$B`. If assembly or publication
fails, Atom removes the work files and keeps the previous output. Atom never
uses `NAME.BAK`, so an editor's backup of your source is left alone. No source
file may use the output or work-file names.

Both work files are normally gone when Atom finishes. If a run is interrupted,
for example by a reset, one may remain. The next build then stops before it
writes anything and names the file:

```text
A>ATOM HELLO

HELLO.$$B exists: erase it first
```

After an interruption during publication, `NAME.$$B` can hold the only copy
of the previous output. Check it before you erase it.

The image is a flat sequence of bytes beginning at `0100H`. `ORG` changes the
logical address and uninitialised `DS` space is filled with zero bytes. CP/M
stores files in 128-byte records, so a physical COM or BIN file can contain
padding after the logical image. That padding is not part of the assembled
program.

## Messages and status codes

Atom always returns to CP/M through a warm boot, whether the build succeeds or
fails.

Successful output is reported by its filename:

```text
OUTPUT.COM written
```

Problems with the command, the files or the source directives produce a
plain-text message. `NAME` stands for the file concerned:

| Message | Meaning |
| --- | --- |
| `Usage: ATOM [SOURCE [OUTPUT]]` | No arguments, or more than two |
| `Invalid source name` | The source name is not a current-drive 8.3 name |
| `Invalid output name` | The output name is not a current-drive 8.3 name ending `.COM`, `.BIN` or `.HEX` |
| `Source/output conflict` | The source has the same name as the output or one of its work files |
| `NAME exists: erase it first` | A work file from an interrupted run remains |
| `NAME read failed` | A source or included file cannot be read |
| `Invalid %INCLUDE` | An `%INCLUDE` line is malformed |
| `Invalid source directive` | A preprocessing directive is malformed or misplaced, or a conditional is not closed |
| `Include cycle` | Files include each other in a loop |
| `Too many sources` | The include graph names more than 255 files |
| `Invalid INCBIN` | An `INCBIN` statement is malformed, for example without a count |
| `Too many INCBIN files` | More than 32 active `INCBIN` statements |
| `NAME binary read failed` | The file named by `INCBIN` cannot be read |
| `NAME conflicts with output` | `INCBIN` names the output or one of its work files |
| `Insufficient transient memory` | The TPA is too small to run Atom |

`INCBIN` messages also give the source file, line and column of the
statement.

Errors found during assembly use a numbered form.

An assembly error identifies the status, source file, line and column:

```text
Atom error 02 INPUT.ASM:2:1
```

Line and column numbers start at one. The column counts bytes in the source
line. When an included file causes the error, Atom names that file rather than
the root source.

A disk or materialisation error names the destination file and has no source
line or column:

```text
Atom error 04 OUTPUT.COM
```

The status codes are:

| Code | Meaning |
| ---: | --- |
| `01` | Invalid build configuration |
| `02` | Source statement rejected |
| `03` | Undefined symbol at the end of assembly |
| `04` | Output service failure |
| `05` | Internal invariant failure |

If Atom cannot reread the source after an error, it reports the filename and
the original hexadecimal byte offset instead of inventing a line and column.

## Limits and current boundaries

The CP/M command accepts at most 255 source parts. Each part can contain at
most 65,535 bytes. The output address span is 65,280 bytes, from `$0100` up to
`$10000`. This is the maximum span an output can cover; it does not mean that
CP/M can load and run a program of that size. The target machine's TPA and
BDOS placement determine how much program memory is actually available.
Running Atom itself requires a TPA of at least 58,112 bytes, with BDOS at
`$E400` or higher. CP/M disk capacity and the free space needed for the
work files and final output can impose lower practical limits.

The CP/M command writes COM, BIN and HEX files. Listings, D8 maps and the
JavaScript API are available through the Node host.

The [assembler reference](book1/) defines the source language and the
[Z80 programming book](book2/) develops instruction-level techniques.
