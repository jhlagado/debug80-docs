---
layout: default
title: "Repeating Work"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 5
---

# Repeating Work

Many programs perform the same operation over a sequence of values. The
operation might add a range of numbers, search for a match, wait for input or
process every entry in a table. A loop states both the repeated work and the
rule that ends it.

This first loop adds the integers from 1 through 10:

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

`number` takes each value from 1 through 10, and `total` finishes at 55. The
variable `total` is an accumulator: it begins with an empty result and gathers
one value during each pass.

## Local variables

```lanternfly
var number as i16
```

This declaration appears inside `sumTen`, before its executable statements.
`number` is a scalar local: the name exists only while `sumTen` is running,
and each run receives its own value.

An owned scalar local with no initializer starts with zero bits. The `for`
statement stores its start value before the loop body reads it, so this routine
does not depend on the initial zero. A loop-control variable is all the
local storage we need for now; Chapter 9 completes the picture of locals,
their initializers and their lifetime.

## Counted loops

```lanternfly
for number = 1 to 10
    total = total + number
end
```

A counted loop visits an inclusive range. `1 to 10` runs ten times. The
control name must already denote a writable ordinal variable; `for` does
not declare it. An enumeration or enumeration-range
control advances by ordinal position, so a loop can visit every member of
a Chapter 4 enumeration by naming its first and last members; an
integer-range control counts with its host's arithmetic.

`until` is the exclusive twin: `for number = 0 until 10` visits 0 through 9,
stopping below its boundary. The half-open form matters most with
zero-based tables in Chapter 6, where an array's count can stand as the
boundary without a subtracted one.

The start and limit are evaluated once before the first pass. An optional
compile-time `step` changes the sequence:

```lanternfly
for address = 0 to 14 step 2
    evenAddressCount = evenAddressCount + 1
end
```

This loop visits 0, 2, 4, 6, 8, 10, 12 and 14. A negative step counts down:

```lanternfly
for position = 7 to 0 step -1
    bytesProcessed = bytesProcessed + 1
end
```

The loop computes its next value mathematically and stops before the control
variable would wrap beyond its boundary. The body must not assign to the
control variable — the loop owns its own progress. When the body itself must
control progress, `while` expresses that relationship.

## Conditional loops

A `while` loop tests its condition before each pass. The Euclidean algorithm
for a greatest common divisor repeats while the second working value remains
nonzero:

```lanternfly
var leftValue as u16 = 84
var rightValue as u16 = 30
var greatestCommonDivisor as u16 = 0

sub calculateGcd()
    var remainder as u16

    while rightValue <> 0
        remainder = leftValue mod rightValue
        leftValue = rightValue
        rightValue = remainder
    end

    greatestCommonDivisor = leftValue
end
```

The pairs are (84, 30), (30, 24), (24, 6) and (6, 0). The next condition is
false, so the loop ends and the result is 6.

An initially false condition runs the body zero times. This makes `while`
suitable when the program may already be finished before it reaches the loop.

## Indefinite loops

Some operations need to perform work before they can test whether they are
finished. `while true` states that outright: the condition never ends the
loop, and an `exit` statement inside the body does:

```lanternfly
sub findNextMultiple()
    var candidate as i16 = startValue

    while true
        candidate = candidate + 1

        if candidate mod 8 = 0 then
            result = candidate
            exit
        end
    end
end
```

The candidate advances before the test. Starting at 16 produces 24;
starting at 15 produces 16. `exit` leaves the innermost loop and continues
after its closing `end`.

An indefinite loop needs at least one reachable exit or an intentional design
reason to run forever. On a small standalone computer, an accidental endless
loop may prevent every later operation from running.

## Skipping one pass

`continue` abandons the remainder of the current pass and begins the next one:

```lanternfly
for number = 1 to 10
    if number mod 2 = 0 then
        continue
    end

    total = total + number
end
```

Even numbers skip the accumulator, so the loop adds 1, 3, 5, 7 and 9. In a
counted loop, the normal step and range test still occur after `continue`.

An early `continue` is useful when one condition excludes an entry from the
main work. It keeps the main path at the loop body's outer indentation.

## Nested loops

`exit` and `continue` act on the innermost loop. A loop inside another
loop pairs every value of one control with every value of the other: five
outer passes around ten inner passes make fifty inner bodies. When an
inner discovery must stop the whole nest, a Boolean flag declared `false`
before the loops carries the news out — the inner loop sets it and exits,
and the outer loop tests it before starting another pass.

## Choosing a loop

| Repetition rule                             | Form                      |
| ------------------------------------------- | ------------------------- |
| visit an inclusive numeric range            | `for ... to ... end`      |
| visit a half-open numeric range             | `for ... until ... end`   |
| visit every element of an array (Chapter 6) | `for each ... in ... end` |
| test before each pass                       | `while ... end`           |
| repeat until a statement exits              | `while true ... end`      |

The loop form should put the stopping rule where it naturally belongs. A
clear stopping rule is the difference between a loop we can reason about at
a glance and one we must trace to trust.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt)
contains each loop form. The `calculateGcd` trace ends at 6,
`findNextMultiple` advances from 13 to 16, and the enumeration-controlled
loop visits all three phases, leaving `phasesVisited` at 3.

## Chapter summary

- A local scalar belongs to one subroutine invocation.
- `for ... to` visits an inclusive range, and `for ... until` stops below
  its boundary; both take a fixed compile-time step.
- `while` tests before each pass, so its body may run zero times.
- `while true` repeats until `exit`, and `continue` skips the rest of one
  pass.
- `exit` and `continue` apply to the innermost loop.

Our loops so far have counted and calculated. In the next chapter we give
them something to walk: tables of fixed storage.
