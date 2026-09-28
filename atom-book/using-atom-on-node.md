---
layout: default
title: "Using Atom on Node"
parent: "Atom Books"
nav_order: 1
has_children: false
---

# Using Atom on Node

The Node command is Atom's desktop build host. It reads source and project
files from the host operating system, runs the assembler core in a Z80
emulator and writes the formats requested on the command line. It does not
provide a CP/M console for the program being assembled.

This guide assumes that you already know how to use a shell and Node.js. It
covers the build workflow. The [Atom language reference](book1/) explains the
assembler itself.

## Install the command

Atom requires Node.js 20 or later:

```sh
npm install --global atom-z80
```

Check the installation with:

```sh
atom --help
```

## Build a first program

Save this source as `hello.asm`:

```asm
ORG $4000

START:
    LD A,42
    HALT
```

Assemble it from the directory containing the file:

```sh
atom hello.asm build/hello.bin
```

The output path selects the format. Atom recognises `.bin`, `.hex`, `.com`,
`.nobj`, `.lst` and `.d8.json` outputs. You can request several formats in one
build:

```sh
atom hello.asm build/hello.bin build/hello.lst build/hello.d8.json
```

When no output is named, Atom writes `build/hello.bin`.

## Build a CP/M program

The program above uses a generic memory layout. For a CP/M executable, use
the [HELLO source in the CP/M guide](using-atom-on-cpm.md#build-a-first-program),
which starts at `100H` and prints through BDOS. Save that source as
`hello-cpm.asm`, then select the CP/M target and a `.com` output:

```sh
atom --target cpm22 hello-cpm.asm build/hello.com
```

Transfer the resulting file to CP/M and run it there. The
[CP/M guide](using-atom-on-cpm.md) explains running it on your own computer or
in Triptych.

## Projects and host facilities

For a repeatable build, put the entry source, target and outputs in a project
file:

```json
{
  "assembler": "atom",
  "entry": "src/main.asm",
  "target": "generic",
  "outputs": ["build/main.bin", "build/main.d8.json"]
}
```

```sh
atom --project atom.json
```

The Node host also supports project-relative `%INCLUDE`, `%DEFINE`, conditional
source and `INCBIN`. These are host facilities. The native CP/M profile has a
smaller command line and supports leading `%INCLUDE` only.

For the complete option table and JavaScript API, use the
[command-line reference](appendices/03-cli-flags.md) and
[programming interface](appendices/06-programming-interface.md).

## Output files

Each output suffix selects a format:

| Suffix | Contents |
| --- | --- |
| `.bin` | Flat binary image |
| `.hex` | Intel HEX with addresses and checksums |
| `.com` | CP/M executable loaded and entered at `$0100` |
| `.nobj` | Object stream for later materialisation |
| `.lst` | Source listing with final addresses and bytes |
| `.d8.json` | Debug80 source and symbol map |

A BIN file begins at the lowest generated or reserved address and extends
through the highest used address. An initial `ORG 4000H` does not add
16 KiB of zeros at the front. Internal gaps and uninitialised reservations
are filled with zeros. Intel HEX contains the same image in addressed
16-byte records followed by an end record.

A COM file is a flat binary with no header. Both its load base and entry must
be `$0100`. Naming a `.com` output selects the `cpm22` target unless you
specified a target yourself. Incompatible source placement is an error.

The listing shows original source lines with their final patched bytes.
Long data lines continue in rows of up to eight bytes. Reserved storage has
an address and a `<COUNT RESERVED>` marker. A trailer lists labels and
constants with their source locations, keeping private declarations in
separate scopes distinct.

A D8 map supplies filenames, source locations and symbols for Debug80.
Load it with the corresponding BIN or HEX file for source-level debugging.
NOBJ preserves emitted bytes, replacement patches and layout information
for tools that need to materialise the image later.

Each format and destination may appear only once in a command. Atom stages
all requested files before replacing previous outputs. Source, assembly or
publication failures preserve the earlier output files.

## Diagnostics

A source failure identifies the project-relative filename, line and byte
column:

```text
lib/device.asm:14:9: UNDEFINED SYMBOL PORTBASE
```

Line and column numbers begin at one. Locations refer to the original source,
including files read through `%INCLUDE`.

The command returns status 0 for success, help or version information,
1 for a failed build and 2 for invalid command use.
