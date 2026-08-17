---
layout: default
title: "Sorting and Searching"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 13
---

# Sorting and Searching

A table algorithm has three moving pieces: a base address, an index and a rule
for stopping. Insertion sort adds a fourth: the current key that must survive
while larger entries move one place to the right.

[`examples/sorting.asm`](examples/sorting.asm) sorts eight bytes in place, then
searches the sorted table for the first value greater than or equal to 5.

## The table defines its length

The data declaration computes the length from the current address `$`:

```asm
ORG 8000H
VALUES:
    DB 9,4,6,2,8,1,7,3
ARRLEN EQU $-VALUES
```

At the `EQU` line, `$` is the address immediately after the last byte. The
difference is therefore 8. Adding or removing a byte updates every use of
`ARRLEN`.

The routine uses DE as the fixed table base. C is the outer index, beginning at
1 because a one-element prefix is already sorted.

## Selecting the key

Each outer pass loads `VALUES[C]` and stores it in `KEYBYTE`:

```asm
.OUTER:
    LD A,C
    LD (SORTIDX),A
    LD HL,SORTLEN
    LD B,(HL)
    CP B
    JR NC,.DONE
    PUSH DE
    POP HL
    LD B,0
    ADD HL,BC
    LD A,(HL)
    LD (KEYBYTE),A
```

`PUSH DE` followed by `POP HL` copies the base address without changing DE.
Clearing B turns the byte index in C into the word offset BC. `ADD HL,BC` then
points HL at the selected entry.

The workspace bytes make the routine easier to trace. `SORTIDX` retains the
outer index while B and C are reused. `SORTJ` walks backwards through the
sorted prefix. `SORTLEN` retains the table length.

## Shifting a larger entry

The inner loop compares the key with one earlier entry:

```asm
.INNER:
    LD A,(SORTJ)
    DEC A
    LD (SORTJ),A
    CP 0FFH
    JR Z,.PLACE
    PUSH DE
    POP HL
    LD C,A
    LD B,0
    ADD HL,BC
    LD A,(KEYBYTE)
    CP (HL)
    JR NC,.PLACE
    LD A,(HL)
    INC HL
    LD (HL),A
    JR .INNER
```

Decrementing zero wraps to `$FF`, which marks the position before the first
entry. Otherwise HL addresses `VALUES[J]`. If the key is smaller, the existing
entry moves to `VALUES[J+1]` and the loop continues left. When the key is at
least as large, `.PLACE` writes it into the open position.

Insertion sort is stable when the comparison stops on equality, as this one
does with `JR NC,.PLACE`. Equal entries keep their original order.

## Linear lower-bound search

Once the table is sorted, `FINDGE` returns the first index whose value is at
least C:

```asm
FINDGE:
    LD B,0
.SCAN:
    LD A,(HL)
    CP C
    JR NC,.FOUND
    INC HL
    INC B
    LD A,B
    CP ARRLEN
    JR C,.SCAN
    LD A,0FFH
    RET
.FOUND:
    LD A,B
    RET
```

`CP C` clears carry when A is greater than or equal to C, so `JR NC` selects
the result. `$FF` is the missing-value sentinel; all valid indices are 0
through 7.

After the complete program halts, `VALUES` contains 1, 2, 3, 4, 6, 7, 8, 9
and `FOUNDIDX` contains 4.

## Exercise

Change `LIMIT` to 8 and predict `FOUNDIDX`. Then change it to 10 and explain
why the routine returns `$FF`.
