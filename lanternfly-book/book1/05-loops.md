---
layout: default
title: "Loops"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 5
---

# Loops

Adding the numbers from 1 through 10 repeats one assignment while a counter
advances:

```lanternfly
var total as i16 = 0

sub sumTen()
    var number as i16

    total = 0
    for number = 1 to 10
        total = total + number
    end
end
```

`number` takes each value from 1 through the inclusive limit 10. `total`
finishes at 55.

## Counted loops

```lanternfly
for number = 1 to 10
    total = total + number
end
```

The loop variable is declared with the other locals at the start of the
subroutine. The start and limit are evaluated once. Omitting `step` uses the
mathematical step `+1`.

An explicit step changes the sequence:

```lanternfly
for column = 0 to 14 step 2
    evenCount = evenCount + 1
end
```

This visits 0, 2, 4, 6, 8, 10, 12 and 14. A negative step counts down:

```lanternfly
for row = 7 to 0 step -1
    remaining = remaining + 1
end
```

The loop body cannot assign to its control variable. Lanternfly performs the
step using mathematical integers and stops before a fixed-width counter can
wrap past its boundary.

## Conditional loops

A `while` loop tests before each iteration:

```lanternfly
sub countDown()
    var remaining as i16 = 3

    while remaining > 0
        remaining = remaining - 1
    end
end
```

An initially false condition runs the body zero times. This shape fits a search
or update whose continuation depends on current state.

## Indefinite loops

`loop` repeats until a statement leaves it:

```lanternfly
sub findNextMultiple()
    var candidate as i16 = startValue

    loop
        candidate = candidate + 1

        if candidate mod 8 = 0 then
            result = candidate
            exit
        end
    end
end
```

The candidate advances before the test, so a starting value of 16 produces 24.
`exit` leaves the innermost loop.

## Skipping an iteration

`continue` starts the next iteration immediately:

```lanternfly
for index = 0 to actorCount - 1
    if not actors[index].active then
        continue
    end

    updateActor(actors[index])
end
```

Inactive actors skip the call. In a counted loop, `continue` proceeds to the
next step and test.

## Nested-loop exits

`exit` and `continue` always act on the innermost loop. An early `return` can
leave a subroutine during a nested search. Code that must continue after the
outer loop can use a Boolean flag:

```lanternfly
var found as boolean = false
```

The explicit flag records why the outer condition changes.

## Choosing a loop

| Repetition rule | Form |
| --- | --- |
| counter crosses an inclusive range | `for ... to ... end` |
| condition is tested before work | `while ... end` |
| statements repeat until they exit | `loop ... end` |

The opening line states what controls repetition and gives the backend the
information needed to form branches, tests and counter updates.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt) contains counted,
conditional and indefinite loops.
