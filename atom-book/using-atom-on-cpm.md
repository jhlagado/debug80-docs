---
layout: default
title: "Using Atom on CP/M"
parent: "Atom Books"
nav_order: 3
has_children: false
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
```

An explicit output may be a `.COM`, `.BIN`, `.HEX` or `.ASO` file. The command
writes one output per invocation. A COM file is a flat image loaded and
entered at `0100H`; it has no header. BIN contains the same raw bytes. HEX
contains addressed records with checksums and an end-of-file record. ASO keeps
the ordered image-and-patch stream instead of materialising an executable.

## The command line

The native command accepts these forms:

```text
ATOM
ATOM ?
ATOM SOURCE
ATOM SOURCE OUTPUT
```

Bare `ATOM` displays usage and returns to CP/M. `ATOM ?` is an alias for the
same help.

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
It does not accept Node's `-D`, `--project` or repeatable output options. The
source language remains shared, but the command line is deliberately small.

## Include other source files

The CP/M source-composition facility is a leading `%INCLUDE` directive:

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
regard to letter case. `%INCLUDE` is the one
preprocessing directive available in the native CP/M profile. `%DEFINE`,
conditional preprocessing and `INCBIN` remain Node-hosted facilities.

## Output and failed builds

Atom assembles the complete include graph before replacing an output file.
COM, BIN and HEX builds first write an internal ASO spool, then materialise
the requested output in bounded memory windows. Atom publishes the completed
file through a temporary `.$$$` file and preserves an existing output as
`.BAK` until publication succeeds. An explicit `.ASO` output keeps the
operation stream as the requested file. If assembly or publication fails,
Atom removes temporary files and restores the earlier output when one exists.
A failed build therefore does not leave a half-written output in place.

The image is a flat sequence of bytes beginning at `0100H`. `ORG` changes the
logical address and uninitialised `DS` space is filled with zero bytes. CP/M
stores files in 128-byte records, so a physical COM or BIN file can contain
padding after the logical image. That padding is not part of the assembled
program.

## Messages and status codes

Successful output is reported by its filename:

```text
OUTPUT.COM written
```

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

The native command accepts at most 255 source parts. Each part can contain at
most 65,535 bytes. The output address span is 65,280 bytes, from `$0100` up to
`$10000`. This is the maximum span an output can cover; it does not mean that
CP/M can load and run a program of that size. The target machine's TPA and
BDOS placement determine how much program memory is actually available.
Running Atom itself requires a TPA of at least 58,112 bytes, with BDOS at
`$E400` or higher. CP/M disk capacity and the free space needed for the ASO
spool and final output can impose lower practical limits.

The CP/M command writes COM, BIN, HEX and ASO files. Listings, D8 maps, NOBJ
output and the JavaScript API remain Node-hosted facilities.

The [assembler reference](book1/) defines the source language and the
[Z80 programming book](book2/) develops instruction-level techniques.
