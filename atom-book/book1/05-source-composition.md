---
layout: default
title: "Source Composition and Conditional Assembly"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 5
---

# Source Composition and Conditional Assembly

Atom's host reads `%` directives, resolves dependencies, and removes
host-only text before assembly begins. The Node host implements the complete
preprocessing language. Native CP/M implements leading `%INCLUDE` directives
but not definitions, conditionals or binary inclusion.

## A multipart entry

On the desktop, an entry source can name dependencies in its leading header:

```asm
%DEFINE DEBUG 1

%IF DEBUG
%INCLUDE "lib/debug.asm"
%ELSE
%INCLUDE "lib/release.asm"
%ENDIF

ORG 4000H
START:
    CALL INITIALISE
    RET
```

`%INCLUDE` creates an import-once dependency edge. It does not paste the same
file repeatedly. Dependencies are assembled before their importer in
deterministic depth-first postorder, and a shared dependency in a diamond
appears once.

Every file remains a separate source part with its own filename and byte
offsets. One project may contain up to 255 parts, and one part may contain up to
65,535 bytes.

## `%DEFINE`

`%DEFINE NAME VALUE` binds one immutable 16-bit host value:

```asm
%DEFINE DEBUG %1
%DEFINE TARGET 4000H
```

It performs no text substitution and declares no assembler symbol. Source that
needs the same value in an assembly expression must also declare an `EQU`.

Source definitions occur only in the entry file's leading preprocessing
header. Command-line `-DNAME[=VALUE]` definitions are loaded first. A duplicate
name is an error even when the values match. Dependencies may test the frozen
definition environment but may not add definitions.

Definition values accept decimal, `$` hexadecimal, `%` binary, Intel `H`
hexadecimal, Intel `B` binary, or an earlier definition name. Values range from
0 through 65,535.

## Conditional source

`%IF` tests one literal or defined name. Zero selects the optional `%ELSE`
branch; every other value selects the first branch:

```asm
%IF DEBUG
    CALL TRACEBYTE
%ELSE
    NOP
%ENDIF
```

Conditional blocks may nest but must balance inside one physical file. An
include-selecting conditional must close before ordinary assembler source
begins. Body conditionals may select ordinary lines but cannot add `%INCLUDE`
or `%DEFINE` directives.

Inactive includes trigger no filesystem read. The host still validates their
conditional structure, so repeated `%ELSE`, unmatched `%ENDIF`, and missing
`%ENDIF` remain errors.

## Equal-length masking

A host directive begins when `%` is the first non-space byte on a line and an
ASCII letter follows it. The host replaces every non-newline byte of directive
lines and inactive ordinary lines with an ASCII space. CR and LF bytes remain
unchanged.

The source text and prepared text have identical lengths, so Atom can still
report the original filename, line and column. If an unprocessed
line-start `%` directive reaches the assembler, Atom reports it as an error.

The same `%` byte remains available in assembly expressions:

```asm
LD A,%10101010
DB 7 % 3
```

## Path rules

On the desktop, an include path resolves relative to the importing source.
Atom rejects absolute paths, `..` paths that escape the project root, symlink
targets outside the root, references to the same file with conflicting
capitalisation, missing files and dependency cycles. Repeated imports of the
same file resolve to one source part.

Diagnostics, listings and D8 maps use project-relative paths. Atom currently
produces one flat, unbanked output image.

Native CP/M accepts quoted current-drive 8.3 filenames such as
`%INCLUDE "MATH.ASM"`. It resolves nested imports and dependency diamonds with
the same import-once ordering, but has no directories or search paths. An
include must remain in the leading header of its own file on both hosts.
