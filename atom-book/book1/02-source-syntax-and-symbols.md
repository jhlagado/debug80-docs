---
layout: default
title: "Source Syntax and Symbols"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 2
---

# Source Syntax and Symbols

Atom source is case-insensitive. The spellings `START`, `Start`, and `start`
name the same symbol, and the same rule applies to instruction mnemonics,
registers, assembler directives, hexadecimal digits, and host-preprocessor
names. This book uses uppercase assembly consistently.

## Line structure

One source line contains at most one label, equate, directive, or instruction.
A label may precede an instruction or data directive on the same line:

```asm
START:  LD A,0
BUFFER: DS 32
```

A label may also occupy a line by itself:

```asm
START:
    LD A,0
```

Spaces and tabs separate tokens. Commas separate instruction operands and
lists accepted by `DB` and `DW`.

## Comments

A semicolon starts a comment extending to the end of the line:

```asm
; THIS WHOLE LINE IS A COMMENT.
LD A,0      ; THE COMMENT STARTS AFTER THE OPERAND.
```

Atom has no block comment or line-continuation syntax. One physical line is one
statement boundary.

## Global labels

A global label is a name followed by a colon. It receives the current logical
output address:

```asm
READBYTE:
    LD A,(HL)
    INC HL
    RET
```

An Atom name begins with an ASCII letter or underscore and continues with
ASCII letters, digits, or underscores. A global name contains one through
eight characters. Names are exact RADIX-40 values; Atom reports an overlength
name instead of truncating or hashing it.

Global labels remain available for the complete build. Two definitions of the
same case-insensitive name are an error.

## Private labels

A leading period marks a private name. The period is syntax and does not count
towards the eight significant characters:

```asm
COPYROW:
    LD B,8
.LOOP:
    LD A,(DE)
    LD (HL),A
    INC DE
    INC HL
    DJNZ .LOOP
    RET

CLEARROW:
    LD B,8
.LOOP:
    LD (HL),0
    INC HL
    DJNZ .LOOP
    RET
```

The two `.LOOP` declarations have different scopes. A global label begins a
new private scope and evicts the private symbols belonging to the previous
global. A private reference requires a preceding global label.

Private scope crosses source-part boundaries. An included part may continue the
current scope until the next global label appears in compilation order. Atom
reports an undefined-private-symbol error if a scope transition would evict an
unresolved private reference.

## Constants with `EQU`

`EQU` binds a name to a resolved assembler-time value:

```asm
WIDTH EQU 32
HEIGHT EQU 24
BUFFER_SIZE EQU WIDTH*HEIGHT
```

Atom accepts a colon before `EQU` because that punctuation is a common source
habit:

```asm
LIMIT: EQU 100
```

Both forms declare a constant. The colon in the second form does not create an
address label or change private scope. A global `EQU` also leaves the current
private scope open.

An equate expression must already be resolved. Atom does not implement forward
equates:

```asm
; ERROR: ENDPOINT IS NOT YET DEFINED.
LIMIT EQU ENDPOINT-START
```

A private equate uses the ordinary private-name rules and therefore needs a
current global scope.

## Reserved words

Assembler directives are bare words such as `ORG`, `DB`, and `ALIGN`. A dotted
word is always a private symbol, never a directive:

```asm
ORG 4000H       ; DIRECTIVE
.ORG:           ; PRIVATE LABEL NAMED ORG
```

Dotted directive aliases such as `.ORG` are deliberately absent. Host
directives use a separate `%` prefix and are removed before native assembly;
Chapter 5 covers them.
