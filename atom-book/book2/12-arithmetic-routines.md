---
layout: default
title: "Arithmetic Routines"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 12
---

# Arithmetic Routines

The Z80 adds and subtracts bytes directly. Larger calculations come from
short routines that combine those instructions with loops and calls. This
chapter builds two of them: a greatest-common-divisor routine over 16-bit
values and an 8-bit power routine.

The complete program is [`examples/arithmetic.asm`](examples/arithmetic.asm).
After it halts, `GCDRES` contains 6 as a little-endian word and `POWRES`
contains 81.

## A routine interface

The GCD routine receives its two unsigned inputs in HL and DE. It returns the
result in HL and may change AF and DE:

```asm
; In: HL,DE. Out: HL. Clobbers: AF,DE.
GCDU16:
.LOOP:
    LD A,H
    OR L
    JR Z,.RIGHT
    LD A,D
    OR E
    JR Z,.LEFT
```

The comment records the agreement between caller and routine. `GCDU16` fits
Atom's eight-character symbol limit. Its private labels begin with a period and
belong to that global routine until the next global label.

The first four instructions test the two base cases. `LD A,H` followed by
`OR L` sets Z exactly when HL is zero. The same test on D and E detects a zero
in DE. If one input is zero, the other is the answer.

## Euclid by subtraction

For two non-zero values, Euclid's method repeatedly subtracts the smaller from
the larger. The pair eventually reaches a state where one side is zero.

```asm
    PUSH HL
    OR A
    SBC HL,DE
    POP HL
    JR C,.SWAP
    OR A
    SBC HL,DE
    JR .LOOP
.SWAP:
    EX DE,HL
    JR .LOOP
```

`OR A` clears carry without changing A. The first subtraction is a comparison:
HL is saved, `SBC HL,DE` sets carry when HL is smaller, then `POP HL` restores
the value. If HL is large enough, the second subtraction keeps its result. If
HL is smaller, `EX DE,HL` swaps the operands before control returns to `.LOOP`.

For 48 and 18, the successive pairs are 48/18, 30/18, 12/18, 18/12, 6/12,
12/6 and 6/6. One final subtraction reaches 0/6 and returns 6.

![Euclid's method reaches GCD(48, 18) by subtraction alone.](../../assets/images/azm-book/book3/gcd-euclid.svg)

## Repeated multiplication

The power routine receives an exponent in B and a base in C. It starts with
the multiplicative identity 1, then multiplies once for each exponent step:

```asm
POWERU8:
    LD E,1
.LOOP:
    LD A,B
    OR A
    JR Z,.DONE
    DEC B
    LD A,E
    PUSH BC
    CALL MUL8AC
    POP BC
    LD E,A
    JR .LOOP
.DONE:
    LD A,E
    RET
```

`PUSH BC` preserves both the remaining exponent and the base across the helper
call. `MUL8AC` consumes B as its own loop counter, so the matching `POP BC`
restores the caller's values before the next power step.

The helper computes A × C by adding C to a zero accumulator A times:

```asm
MUL8AC:
    OR A
    RET Z
    LD B,A
    XOR A
.LOOP:
    ADD A,C
    DJNZ .LOOP
    RET
```

The result wraps at eight bits. The demonstration uses 3^4, which is 81 and
fits in one byte. A caller that needs wider or checked arithmetic must choose a
wider result convention and detect overflow.

## Result storage

The program places its results in RAM:

```asm
ORG 8000H
GCDRES:
    DS 2
POWRES:
    DS 1
```

`DS 2` reserves two bytes for the word returned in HL. `DS 1` reserves the
single byte returned in A. The command below assembles the program and writes
its listing and launch images under `build/arithmetic.atom/current`:

```sh
atom --origin 0000H examples/arithmetic.asm
```

## Exercise

Trace `POWERU8` with B = 3 and C = 2. Record B, E and A immediately before and
after each call to `MUL8AC`, then give the final byte returned in A.
