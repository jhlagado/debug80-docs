---
layout: default
title: "Diagnostics and Output"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 6
---

# Diagnostics and Output

A successful command publishes one complete artifact generation. A source,
preprocessing, execution, rendering, or publication failure selects no partial
generation and leaves any previously selected generation in place.

## Source diagnostics

Source failures name the project-relative file, one-based line, and one-based
byte column:

```text
lib/device.asm:14:9: UNDEFINED SYMBOL PORTBASE
```

Preprocessing preserves line endings and byte positions, so diagnostics still
refer to the source text you wrote. Undefined-symbol diagnostics show the
case-insensitive symbol name.

Dependency and preprocessing errors use the same project-relative paths.
Missing files, root escapes, cycles, duplicate definitions, malformed
conditionals, and invalid `INCBIN` paths stop the build before assembly.

## Command status

The command returns:

| Status | Meaning |
| ---: | --- |
| 0 | Assembly and publication succeeded |
| 1 | Assembly, preprocessing, artifact, or publication failed |
| 2 | Command-line usage was invalid |

## Artifact bundle

For `src/main.asm`, the default bundle is `build/main.atom`. The `current`
symlink points to one content-addressed immutable generation:

```text
build/main.atom/current/main.nobj
build/main.atom/current/main.bin
build/main.atom/current/main.hex
build/main.atom/current/main.lst
build/main.atom/current/main.d8.json
build/main.atom/current/manifest.json
```

Atom selects `current` only after every artifact has been written successfully.
A failed build leaves the previous successful generation selected. Older
successful generations remain in the bundle.

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

## Flat binary and Intel HEX

The flat binary begins at the configured target start and extends through the
largest IMAGE end, logical high-water mark, or final cursor. The selected fill
byte supplies gaps and uninitialised `DS` reservations. PATCH bytes overwrite
their corresponding IMAGE placeholders.

Intel HEX contains the same contiguous materialised image in 16-byte data
records followed by the standard EOF record.

`--fill` changes only materialisation. It does not change the IMAGE and PATCH
records or convert uninitialised storage into emitted bytes.

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

## Manifest

`manifest.json` records the ordered artifact names, byte counts, and SHA-256
values. A tool can verify one generation before loading it without trusting the
directory name or symlink alone.

## Command options

The common build options are:

```sh
atom --root . --origin 4000H --capacity 8000H \
  --entry 4000H --fill 0 -DDEBUG=1 src/main.asm
```

`-o` or `--output` selects the bundle directory. The complete table appears in
[Appendix 3](../appendices/03-cli-flags.md).
