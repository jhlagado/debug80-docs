---
layout: default
title: "Loops"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 5
---

# Loops

Games repeat work: updating each table entry, searching until a match and
drawing a screen row by row. A loop repeats a body of statements under a rule
that says when to stop.

The stopping rule determines whether a loop completes its work. If its
stopping condition never occurs, the current routine or frame cannot reach
later statements; on a simple standalone target, the visible program may
stall completely.
Lanternfly has three loop statements, distinguished by where the stopping rule
is expressed.

The first is the counted loop. Adding the numbers from 1 through 10
repeats one assignment while a counter advances:

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

`number` takes each value from 1 through the inclusive limit 10, and
`total` finishes at 55. `total = total + number` is the
*accumulator* pattern — a variable that starts empty and gathers a
result piece by piece as the loop feeds it. Sums, counts, best-so-far
records and checksums all use this shape.

`number` is the book's first local variable. Local declarations appear at the
start of a subroutine, before executable statements. The name is visible only
inside that routine and each invocation receives its own scalar value. An
owned scalar local without an initializer begins with zero bits; here the
`for` statement assigns the first value before the body reads it.

## Counted loops

```lanternfly
for number = 1 to 10
    total = total + number
end
```

This example uses the local `number` as its control variable. More generally,
the control may be any previously declared writable integer variable. Once
Chapter 9 introduces parameters, a writable scalar integer parameter can also
serve. `for` does not declare a hidden variable. The range is inclusive at
both ends, so `1 to 10` visits ten values. The start, limit and effective step
are evaluated once, in that order, before the first pass. The loop therefore
fixes its bounds and direction when it begins.

Omitting `step` uses the mathematical step `+1`. An explicit step
changes the sequence. In the working language it must be a non-zero
compile-time integer:

```lanternfly
for column = 0 to 14 step 2
    evenCount = evenCount + 1
end
```

This visits 0, 2, 4, 6, 8, 10, 12 and 14 — eight iterations, still
ending inside the stated range. A negative step counts down:

```lanternfly
for row = 7 to 0 step -1
    remaining = remaining + 1
end
```

A negative step suits work that proceeds backward — drawing rows from
the bottom of the screen up, retiring particles from the end of a
list, draining a timer toward zero.

The loop body cannot modify its control variable, whether directly, through
an alias, through a call or across an unconstrained native boundary. A loop
whose body controls progress uses `while` or `loop` instead. Lanternfly
performs the step with mathematical integers and stops before a fixed-width
control variable would wrap past its boundary.

After the loop, the control variable retains the last value stored. If the
range admits no iteration, it retains the converted start value.

## Conditional loops

A counted loop fixes its bounds when it begins. Much of
the interesting work has no fixed range. Keep taking damage while shields
remain. Keep following the list until its end. Keep waiting until the
player presses something. In each case the number of repetitions is
unknowable at the top — what is known is the *condition* under which
work continues. A `while` loop announces exactly that:

```lanternfly
sub countDown()
    var remaining as i16 = 3

    while remaining > 0
        remaining = remaining - 1
    end
end
```

The test comes first, so an initially false condition runs the body zero
times. If `remaining` starts at zero, `countDown` reaches its `end` without
executing the assignment.

The body or the surrounding environment must be capable of changing the
condition. In `countDown`, the body provides that progress: 3 becomes 2, then
1, then 0, and the fourth test ends the loop. A polling loop may instead
depend on input or hardware state changing outside the routine. The fixed
starting value here makes the pre-test trace short; a typical `while` loop
starts from state established at runtime.

## Indefinite loops

Sometimes even the condition is awkward to state up front, because
the natural stopping rule lives in the *middle* of the work: produce
a candidate, then judge it. This shape is often called a "loop and a half" —
half a pass must run before the test makes sense.
Forcing it into a `while` means contorting the condition or
duplicating the producing step; Lanternfly instead provides `loop`,
which repeats until a statement leaves it:

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

The half-pass is visible on the page: advance the candidate — that is
the half — then test it, and `exit` leaves the innermost loop
immediately when the test is satisfied, continuing after its `end`.
Because the candidate advances before the test, a starting value of
16 produces 24, not 16 — the routine finds the *next* multiple. The `mod`
test recognises a multiple of eight by its zero remainder.

Although `loop` with `exit` can imitate the other forms, the opening word
should expose the real stopping rule. Use `for` for a counted range, `while`
for a condition tested before each pass and `loop` when the test belongs
inside the body.

## Skipping an iteration

`exit` abandons a loop; its milder sibling abandons only the current
pass. `continue` starts the next iteration immediately:

```lanternfly
for number = 1 to 10
    if number mod 2 = 0 then
        continue
    end

    total = total + number
end
```

This loop skips even numbers and adds the odd ones. In a counted loop,
`continue` proceeds to the next step and test: the control variable still
advances and only the remainder of the current pass is abandoned.

The alternative is wrapping the whole body in an `if`, which adds an
indentation level. An early `continue` handles the skipped case first and
leaves the remaining work at the loop body's main indentation. Chapter 9
uses the corresponding early `return` in a subroutine.

## Nested-loop exits

`exit` and `continue` always act on the innermost loop. That rule
never bends, so a search through a grid — a loop within a loop —
needs a plan for carrying "found it" past the inner boundary. An
early `return` can leave the whole subroutine on the spot, which is
often the cleanest answer for a routine whose only job was the
search. Code that must continue working after the outer loop can use
a Boolean flag:

```lanternfly
var found as boolean = false
```

The inner loop sets the flag and exits; the outer loop's condition or a test
after the inner `end` consults it. The name `found` records the fact being
carried across the loop boundary.

## Choosing a loop

| Repetition rule | Form |
| --- | --- |
| counter traverses an inclusive range | `for ... to ... end` |
| condition is tested before work | `while ... end` |
| statements repeat until they exit | `loop ... end` |

The appropriate form states the stopping rule in its opening line. That line also
gives the backend the range, condition or branch structure it must lower.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt)
contains counted, conditional and indefinite loops. Trace
`findNextMultiple` from 16 and from 15. Because the candidate advances before
the test, the expected results are 24 and 16.
