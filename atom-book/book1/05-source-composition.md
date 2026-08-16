---
layout: default
title: "Source Composition and Conditional Assembly"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 5
---

# Source Composition and Conditional Assembly

Atom keeps filesystem and dependency work outside the resident Z80 core. The
host reads `%` directives, constructs an ordered source plan, and masks
host-owned syntax before native assembly begins.

## A multipart entry

An entry source can name dependencies in its leading header:

```asm
%DEFINE DEBUG 1

%IF DEBUG
%INCLUDE "LIB/DEBUG.ATM"
%ELSE
%INCLUDE "LIB/RELEASE.ATM"
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

Every file remains a separate source part with its own logical identity and
byte offsets. Atom accepts at most 16 native parts, and every part must fit the
Mac runner's 24 KiB source window.

## `%DEFINE`

`%DEFINE NAME VALUE` binds one immutable 16-bit host value:

```asm
%DEFINE DEBUG %1
%DEFINE TARGET 4000H
```

It performs no text substitution and declares no assembler symbol. Source that
needs the same value during native assembly must also declare an `EQU`.

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

The original and compiler buffers therefore have identical lengths. A native
part ordinal and byte offset still identify the original filename, line, and
column. The resident tokenizer also has a dedicated error for an unprocessed
line-start host directive, so a broken host boundary fails explicitly.

The same `%` byte remains available in native expressions:

```asm
LD A,%10101010
DB 7 % 3
```

## Path rules

An include path resolves relative to the importing source. The resolver
rejects absolute paths, lexical `..` escapes, symlink targets outside the
project root, case-conflicting physical spellings, missing files, repeated
direct dependencies, and dependency cycles.

The graph retains three identities: the physical host path, the canonical
dependency identity used for cycles and diamonds, and a project-relative
logical identity used in diagnostics, source plans, listings, and D8 maps.

## Source plan

The host may serialize the result as an SP1 source plan:

```text
SP1 3
P 0 LIB/HARDWARE.ATM
P 0 LIB/CONSOLE.ATM
P 0 SRC/MAIN.ATM
END
```

Line order determines native part order. Current Atom builds require bank zero.
The native assembler does not parse SP1; a host or operating adapter loads the
ordered byte intervals described by the plan.
