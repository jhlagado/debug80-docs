---
layout: default
title: "Diagnostics and Output"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 6
---

# Diagnostics and Output

A build either publishes every requested output or publishes none of them.
Source, preprocessing, assembly, rendering and filesystem failures leave
earlier output files in place.

## Source diagnostics

Desktop source failures name the project-relative file, one-based line and
one-based byte column:

```text
lib/device.asm:14:9: UNDEFINED SYMBOL PORTBASE
```

Preprocessing preserves line endings and byte positions, so diagnostics still
refer to the source text you wrote. Undefined-symbol diagnostics show the
case-insensitive symbol name.

Dependency and preprocessing errors use the same project-relative paths.
Missing files, root escapes, cycles, duplicate definitions, malformed
conditionals, and invalid `INCBIN` paths stop the build before assembly.

Native CP/M reports an assembly status, zero-based source-part ordinal and byte
offset. File-provider failures identify the relevant CP/M name when available.
The native command preflights the complete include graph, so a missing file,
cycle or malformed include stops the build before the output transaction
begins.

## Desktop command status

The command returns:

| Status | Meaning |
| ---: | --- |
| 0 | Assembly and publication succeeded |
| 1 | Assembly, preprocessing, artifact, or publication failed |
| 2 | Command-line usage was invalid |

## Select desktop outputs

With no output path, the desktop command writes one BIN file:

```text
atom src/main.asm
```

This creates `build/main.bin`.

Name each additional output after the input, or use repeatable `-o` options:

```sh
atom src/main.asm build/main.bin build/main.hex build/main.lst
atom -o build/main.nobj -o build/main.d8.json src/main.asm
```

The suffix selects the format:

| Suffix | Contents |
| --- | --- |
| `.bin` | Flat materialised bytes |
| `.hex` | Intel HEX |
| `.com` | Flat CP/M program loaded and entered at `$0100` |
| `.nobj` | Append-only Atom object stream |
| `.lst` | Source listing with final bytes |
| `.d8.json` | Debug80 source and symbol map |

Output selection is positive: Atom writes only the paths you name. A command
cannot repeat a format or destination path. Every requested file is staged
before any earlier output is replaced.

## NOBJ

Atom NOBJ profile 0.2 preserves the append-only assembly result:

```text
BEGIN IMAGE* PATCH* MAP COMMIT EOF
```

IMAGE records contain source-order bytes. PATCH records contain final
replacement bytes in symbol-resolution order and carry no symbol name or
expression. The flat MAP records entry address, used length, final cursor,
source-part count, and bank-zero placement. COMMIT carries the record count,
entry, and CRC-16/CCITT-FALSE.

NOBJ retains the distinction between emitted bytes, forward-reference patches,
and reserved storage. The binary and HEX files are materialised launch views.

## BIN, Intel HEX and COM

The flat binary begins at the lowest generated or reserved address and extends
through the logical high-water mark. An initial `ORG 4000H` therefore does not
add 16 KiB of zero bytes to the front of a BIN file. Zero bytes fill internal
gaps and uninitialised `DS` reservations. PATCH bytes replace their IMAGE
placeholders before the file is written.

Intel HEX contains the same contiguous materialised image in 16-byte data
records followed by the standard EOF record.

A COM file is also a flat binary; it has no header. Atom accepts COM output
only when the load base and entry are both `$0100`. If no target was selected,
a `.com` output selects the `cpm22` profile. Atom rejects incompatible source
placement instead of silently relocating labels.

## Listing

The listing uses original source rather than masked compiler text. It prints
addresses and final patched bytes beside the line that produced them. A long
line continues in rows of up to eight bytes. An uninitialised reservation has
an address and a `<COUNT RESERVED>` marker. Included files retain their own
logical names, and `INCBIN` bytes remain attached to the original directive.

The trailer contains labels and constants with their source locations. Private
names reused under different global labels remain separate declarations.

## D8 map

The D8 JSON artifact contains source files, line ranges, listing locations,
code/data/directive classification, symbols, scope, visibility, entry address,
and target segment. Debug80 can load it with the corresponding BIN or HEX file
for source-level stepping and symbol lookup.

## Native CP/M output

Native CP/M Atom writes one COM, BIN or HEX file per command:

```text
A>ATOM MAIN.ASM MAIN.HEX

MAIN.HEX written
```

COM and BIN contain the same logical bytes; COM selects the CP/M `$0100`
load-and-entry convention. CP/M stores files in 128-byte records, so the
physical COM or BIN file may have padding after the logical image. HEX may
contain CP/M text padding after its end record.

The native command writes a temporary `.$$$` file, preserves an earlier output
as `.BAK` during replacement, and restores it if publication fails. Listing,
D8 and NOBJ output remain desktop facilities.

The complete desktop and native command forms appear in [Appendix
3](../appendices/03-cli-flags.md).
