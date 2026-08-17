---
layout: default
title: "Recursion"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 16
---

# Recursion

A recursive routine calls itself with a smaller problem. Each unfinished call
keeps its return address and saved values on the stack until the base case
returns.

[`examples/recursion.asm`](examples/recursion.asm) computes 5! both recursively
and iteratively, then sums a five-byte table with a recursive walk.

## Set the stack first

The program establishes SP before its first call:

```asm
STACKTOP EQU 9FFFH

ORG 0000H
MAIN:
    LD SP,STACKTOP
```

The chosen region must be writable and must not collide with code, data or the
machine's monitor workspace. The example data begins at `$8000`, so its stack
grows down from `$9FFF` with ample separation for this bounded demonstration.

## Recursive factorial

Factorial has one base case, 0! = 1, and one recursive rule, n! = n × (n−1)!.

```asm
FACTREC:
    LD A,B
    OR A
    JR Z,.ONE
    PUSH BC
    DEC B
    CALL FACTREC
    POP BC
    LD C,B
    CALL MUL8AC
    RET
.ONE:
    LD A,1
    RET
```

Each non-base level saves BC, then `CALL FACTREC` adds a return address. When
the deeper call returns, BC restores the current n and `MUL8AC` multiplies the
partial result by it.

![Factorial saves one value per level and multiplies while the calls return.](../../assets/images/azm-book/book3/factorial-frames.svg)

## Measure the stack budget

The source records the arithmetic behind its bound:

```asm
FACTN EQU 5
FSTEP EQU 4
FBASE EQU 2
FDEPTH EQU FACTN+1
FSTACK EQU FACTN*FSTEP+FBASE
```

Each of the five non-base levels contributes two bytes for saved BC and two for
the recursive return address. The base call contributes its two-byte return
address. The deepest occupancy is therefore 5 × 4 + 2 = 22 bytes across six
active calls.

The constants document the bound; Atom does not perform stack-depth analysis.
Changing `FACTN` requires checking both the 8-bit result range and the available
stack region.

## Iterative factorial

`FACTITER` keeps the accumulated product in E and the remaining multiplier in
C. One call frame handles every iteration, so its stack use does not grow with
n. It produces the same byte result as `FACTREC` for inputs that fit.

![The recursive version grows a stack of pending work; the iterative version keeps the work in registers.](../../assets/images/azm-book/book3/recursive-vs-iterative.svg)

The recursive form mirrors the mathematical definition. The iterative form
uses a fixed stack budget and avoids call overhead. On a small machine, that
space difference is often decisive.

## A recursive table walk

`SUMREC` consumes one byte before each recursive call, then adds that byte as
the calls return:

```asm
SUMREC:
    OR A
    JR Z,.ZERO
    LD B,A
    LD A,(HL)
    PUSH AF
    INC HL
    DEC B
    LD A,B
    CALL SUMREC
    POP AF
    LD E,A
    LD D,0
    ADD HL,DE
    RET
.ZERO:
    LD HL,0
    RET
```

The input count in A supplies the bound. HL changes role across the call: it is
the source pointer on the way down and the 16-bit sum on the way back up. The
current byte is therefore saved in AF before recursion.

After the program halts, `FACTR` and `FACTI` both contain `$78` (120), while
`SUMR` contains `$001A` (26).

## Exercise

Trace `FACTREC` with `FACTN EQU 3`. Draw the stack immediately after the base
call begins, including every return address and saved BC word, then list the
three multiplications performed while the calls return.
