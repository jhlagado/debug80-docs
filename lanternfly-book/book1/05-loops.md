---
layout: default
title: "Loops"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 5
---

# Loops

Adding the numbers from 1 through 10 repeats one assignment while a counter
advances. A `FOR` loop states the counter's start and inclusive limit in its
opening line:

```text
DIM Total AS INTEGER

SUB SumTen()
    DIM Number AS INTEGER

    Total = 0
    FOR Number = 1 TO 10
        Total = Total + Number
    NEXT Number
END SUB
```

`Number` takes the values 1, 2, 3 and so on through 10. `Total` finishes at 55.

## Counted repetition

```text
FOR Number = 1 TO 10
    Total = Total + Number
NEXT Number
```

The start and limit are evaluated once. `NEXT Number` advances the counter and
returns to the test. Naming the counter after `NEXT` helps match the ends of
nested loops.

`STEP` changes the amount added each time:

```text
FOR Column = 0 TO 14 STEP 2
    EvenCount = EvenCount + 1
NEXT Column
```

This visits 0, 2, 4, 6, 8, 10, 12 and 14. A negative step counts down:

```text
FOR Row = 7 TO 0 STEP -1
    Remaining = Remaining + 1
NEXT Row
```

The limit remains inclusive in both directions.

## Repeating while a condition holds

A `WHILE` loop tests before each iteration:

```text
SUB CountDown()
    DIM Remaining AS INTEGER

    Remaining = 3
    WHILE Remaining > 0
        Remaining = Remaining - 1
    END WHILE
END SUB
```

When the initial condition is false, the body runs zero times. This form suits
a search or update whose work is needed only while a known condition holds.

## Testing after the body

Some operations must run once before their stopping condition can be checked.
The following routine advances to the next multiple of eight:

```text
DIM StartValue AS INTEGER = 13
DIM Result AS INTEGER

SUB FindNextMultiple()
    DIM Candidate AS INTEGER

    Candidate = StartValue
    DO
        Candidate = Candidate + 1
    LOOP UNTIL Candidate MOD 8 = 0

    Result = Candidate
END SUB
```

The body runs before `UNTIL` is tested, so `Candidate` advances at least once.
Starting at 13 produces 16. Starting at 16 produces 24 because the routine
asks for the next multiple rather than the current one.

`LOOP WHILE condition` provides the matching form when repetition should
continue while the final condition is true.

## Leaving or continuing a loop

The loop kind appears in an early exit:

```text
IF Candidate > MaximumValue THEN
    EXIT WHILE
END IF
```

`EXIT FOR`, `EXIT WHILE` and `EXIT DO` leave the nearest enclosing loop of that
kind. `CONTINUE FOR`, `CONTINUE WHILE` and `CONTINUE DO` skip the rest of the
current iteration and return to the loop's next test or step.

Naming the loop kind makes the destination visible. In a nested `FOR` inside a
`WHILE`, `EXIT FOR` and `EXIT WHILE` select different enclosing blocks.

## Choosing a loop

Use the opening line to state what controls repetition:

| Known rule                       | Form                      |
| -------------------------------- | ------------------------- |
| counter runs through a range     | `FOR ... TO ... NEXT`     |
| condition is checked before work | `WHILE ... END WHILE`     |
| work runs before the condition   | `DO ... LOOP WHILE/UNTIL` |

The choice records the algorithm's stopping rule. That rule also lets the
compiler generate the target's branches and counter operations.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt) contains the
three complete loop routines.

## Summary

- `FOR` walks through an inclusive numeric range.
- `STEP` changes the counter increment and may be negative.
- `WHILE` tests before each iteration.
- `DO` with `LOOP WHILE` or `LOOP UNTIL` tests after each iteration.
- `EXIT` and `CONTINUE` name the kind of loop they affect.
