---
layout: default
title: "Decisions"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 4
---

# Decisions

> [!IMPORTANT]
> This chapter uses the pre-0.3 draft syntax. See the
> [book revision notice](index.md).

A game can show one of three states. No lives means the round has ended. A
score of at least 100 means the target has been reached. Every other state is
still in progress.

```text
CONST Finished AS BYTE = 0
CONST Playing AS BYTE = 1
CONST Won AS BYTE = 2

DIM Lives AS INTEGER = 3
DIM Score AS INTEGER = 0
DIM Status AS BYTE = Playing

SUB UpdateStatus()
    IF Lives = 0 THEN
        Status = Finished
    ELSEIF Score >= 100 THEN
        Status = Won
    ELSE
        Status = Playing
    END IF
END SUB
```

The conditions are checked from top to bottom. The first true branch runs and
the remaining branches are skipped.

## One branch

The smallest block runs one action when its condition is true:

```text
IF Score >= 100 THEN
    Status = Won
END IF
```

`THEN` separates the condition from its body. `END IF` closes the block. The
body may contain declarations at its beginning, assignments, calls, loops or
another decision.

The book uses the block form even for one statement. The opening and closing
words keep edits safe when a second statement is added later.

## Alternatives

`ELSE` supplies a branch for every remaining value:

```text
IF Lives > 0 THEN
    Status = Playing
ELSE
    Status = Finished
END IF
```

`ELSEIF` adds another condition while keeping the chain at one indentation
level:

```text
IF Lives = 0 THEN
    Status = Finished
ELSEIF Score >= 100 THEN
    Status = Won
ELSE
    Status = Playing
END IF
```

Order carries meaning. Checking `Lives = 0` first gives the finished state
priority when both the life and score conditions apply.

## Choosing among named values

`SELECT CASE` suits one value with several recognised cases:

```text
CONST North AS BYTE = 0
CONST East AS BYTE = 1
CONST South AS BYTE = 2
CONST West AS BYTE = 3

DIM Direction AS BYTE = North
DIM DeltaX AS INTEGER
DIM DeltaY AS INTEGER

SUB FindStep()
    DeltaX = 0
    DeltaY = 0

    SELECT CASE Direction
    CASE North
        DeltaY = -1
    CASE East
        DeltaX = 1
    CASE South
        DeltaY = 1
    CASE West
        DeltaX = -1
    CASE ELSE
        DeltaX = 0
        DeltaY = 0
    END SELECT
END SUB
```

The expression after `SELECT CASE` is evaluated once. Each `CASE` names one or
more compile-time values. `CASE ELSE` handles values not listed above it. After
a matching case body finishes, execution continues after `END SELECT`.

`SELECT CASE` exposes a state table in the layout of the source. `IF` remains
better when each branch asks a different kind of question.

## Conditions are integer expressions

Zero is false and any nonzero integer is true:

```text
IF Lives THEN
    Status = Playing
END IF
```

The explicit comparison `Lives > 0` often communicates more when a quantity is
being tested. Direct numeric truth fits flags and functions whose documented
result already means yes or no.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt) combines the
status chain with the direction selection.

## Summary

- `IF`, `ELSEIF`, `ELSE` and `END IF` express ordered alternatives.
- Only the first true branch of an `IF` chain runs.
- `SELECT CASE` compares one value with several constant cases.
- A completed `CASE` continues after `END SELECT`.
- Zero is false and every nonzero integer is true.
