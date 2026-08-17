---
layout: default
title: "Strings"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 14
---

# Strings

A null-terminated string stores its bytes in order and ends with zero. The
terminator gives traversal routines a stopping rule, while the caller remains
responsible for providing enough destination space.

[`examples/strings.asm`](examples/strings.asm) measures `"HELLO"`, copies it,
compares the copy with the source and finds the first `L`.

## Storage and capacity

```asm
ORG 8000H
MESSAGE:
    DB "HELLO",0
BUFFER:
    DS 8
```

`MESSAGE` occupies six bytes: five characters and the zero terminator.
`BUFFER` has a capacity of eight bytes. A copy into it is valid only when the
source length plus its terminator is at most eight.

Atom can also write the same representation with `CSTR "HELLO"`. The explicit
`DB` form keeps the terminator visible while the loop is being learned.

![A string's length excludes its terminator, while its storage includes it.](../../assets/images/azm-book/book3/string-layout.svg)

## Measuring a string

`STRLEN` returns the count in A and advances HL through the source:

```asm
STRLEN:
    LD B,0
.LOOP:
    LD A,(HL)
    OR A
    JR Z,.DONE
    INC HL
    INC B
    JR .LOOP
.DONE:
    LD A,B
    RET
```

At `.LOOP`, B equals the number of non-zero bytes already passed. The zero
byte ends the scan without being added to the count.

An 8-bit result limits the represented length to 255. The routine also assumes
that a terminator is present before the address wraps. Those are interface
conditions, even though the instruction sequence cannot prove them.

## Copying through the terminator

HL points at the source and DE points at the destination:

```asm
STRCOPY:
.LOOP:
    LD A,(HL)
    LD (DE),A
    INC HL
    INC DE
    OR A
    JR NZ,.LOOP
    RET
```

The store happens before the test, so the zero byte is copied too. On return,
HL and DE both point one byte beyond their respective terminators.

![HL reads and DE writes in step until the copied zero ends the loop.](../../assets/images/azm-book/book3/two-pointer-copy.svg)

## Comparing two strings

Lexicographic comparison examines corresponding bytes until they differ or
both reach zero. The routine returns 0 for equality, 1 when the HL string is
greater and `$FF` when it is less.

```asm
.LOOP:
    LD A,(HL)
    PUSH AF
    LD A,(DE)
    POP BC
    CP B
    JR C,.GREATER
    JR NZ,.LESS
    OR A
    JR Z,.EQUAL
    INC HL
    INC DE
    JR .LOOP
```

The push/pop pair transfers the HL byte from A into B while A loads the DE
byte. `CP B` compares the DE byte in A against the HL byte in B, which explains
the apparent reversal of the carry branches.

## Finding a character

`STRFIND` uses B as an index. It tests the terminator first, then compares the
live byte with C. The result is the first matching index or `$FF` when the
terminator arrives first.

After the program halts, `STRLENB` is 5, `COPYOK` is 1 and `FINDIDX` is 2.

## Exercise

Change the search character to `'Z'` and predict the return value. Then shorten
`BUFFER` to five bytes and identify the address overwritten by the terminator.
