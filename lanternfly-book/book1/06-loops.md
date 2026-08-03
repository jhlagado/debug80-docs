---
layout: default
title: "Repeating Work"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 6
---

# Repeating Work

Adding the integers from 1 through 10 requires the same addition ten times.
Writing ten assignment statements would repeat the operation and bury the
actual rule. A counted loop states the changing value and the stopping point:

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

`number` is a scalar local of `sumTen`, like `amountDue` in Chapter 1. The
`for` statement assigns each value from 1 through 10 to it. After each
assignment, the body adds that value to `total`.

The first passes establish the pattern, and the last pass finishes it:

| `number` | `total` before the body | `total` after the body |
| -------: | ----------------------: | ---------------------: |
| 1 | 0 | 1 |
| 2 | 1 | 3 |
| 3 | 3 | 6 |
| 4 | 6 | 10 |
| … | … | … |
| 10 | 45 | 55 |

The variable `total` is an accumulator: it stores the partial result from one
pass to the next. Resetting it before the loop ensures that every call to
`sumTen` begins the calculation at zero.

## Counted loops

The general counted-loop form is:

```lanternfly
for control = start to boundary
    statements
end
```

The control name must already denote a writable ordinal variable. `for` does
not declare it, which is why `number` appears with the other local declarations
before the statements in `sumTen`.

The loop follows this sequence:

1. Evaluate the start and boundary once.
2. Store the start value in the control variable.
3. Test whether that value belongs in the loop.
4. Run the body when it does.
5. Advance the control value and test again.

With a positive step, `to` includes the boundary, so `1 to 10` runs with 10 as
well as 1. After the final body, the next mathematical value is
11; it fails the boundary test and is not stored.

`until` names the first excluded value:

```lanternfly
for number = 0 until 10
    total = total + number
end
```

This loop visits 0 through 9. The two forms are useful in different
situations:

| Form | Values visited | Useful boundary |
| ---- | -------------- | --------------- |
| `1 to 10` | 1 through 10 | the last included value |
| `0 until 10` | 0 through 9 | the count or first excluded value |

Zero-based arrays use `until` naturally because `0 until count` visits exactly
`count` positions. Chapter 7 applies that form to array indices.

## Changing the step

The default step is 1. A compile-time `step` selects another nonzero distance:

```lanternfly
for address = 0 to 14 step 2
    evenAddressCount = evenAddressCount + 1
end
```

The stored values are 0, 2, 4, 6, 8, 10, 12 and 14. The inclusive boundary is
visited because the sequence reaches it exactly.

A negative step counts down:

```lanternfly
for position = 7 to 0 step -1
    bytesProcessed = bytesProcessed + 1
end
```

This loop visits 7, 6, 5, 4, 3, 2, 1 and 0. The next mathematical value would
be -1, so the loop ends without storing it in `position`.

The sign of the step fixes the direction. If this loop used `step 1`, its
first test would be `7 <= 0`. That test is false, so the body would run zero
times. The loop would not wrap around or run forever, and `position` would
remain 7.

The loop body cannot assign to its control variable. The `for` statement is
responsible for the sequence and boundary test; another assignment would make
the next value ambiguous. Use `while` when the body itself must determine the
progress.

## Counting through enumeration members

Enumerations are ordered by declaration, so they can also control a counted
loop:

```lanternfly
enum Phase as u8
    warmup
    working
    cooldown
end

var phase as Phase = warmup
var phasesVisited as u8 = 0

sub visitPhases()
    for phase = warmup to cooldown
        phasesVisited = phasesVisited + 1
    end
end
```

The loop visits `warmup`, `working` and `cooldown` in declaration order.
Arithmetic on `Phase` remains invalid; the counted loop advances by ordinal
position as part of its own control rule.

## Loops controlled by a condition

A counted loop suits a known sequence. Some calculations instead repeat while
a changing condition remains true. The Euclidean algorithm finds the greatest
common divisor of two integers by repeatedly replacing the pair with the
second value and the remainder:

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

`while` tests its Boolean condition before every pass. The values change as
follows:

| `leftValue` | `rightValue` | Remainder | Pair after the body |
| ----------: | -----------: | --------: | ------------------- |
| 84 | 30 | 24 | 30, 24 |
| 30 | 24 | 6 | 24, 6 |
| 24 | 6 | 0 | 6, 0 |

The next condition tests `0 <> 0` and produces false. The loop ends, and
`leftValue` contains the result 6.

Because the condition comes first, a false initial condition runs the body
zero times. If `rightValue` were already zero, the division and remainder
operation would never run, and the initial `leftValue` would be copied to the
result.

## Work before the stopping test

Some loops perform work before their stopping condition can be evaluated.
`while true` repeats until an `exit` statement leaves the loop:

```lanternfly
var startValue as i16 = 13
var result as i16 = 0

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

Starting at 13, the routine tests 14, then 15, then 16. The third remainder is
zero, so `result` receives 16 and `exit` continues execution after the loop's
closing `end`.

The increment comes before the test. Starting at 16 returns 24, not 16. The
routine finds the next multiple after the starting value.

Every indefinite loop needs a reachable `exit` unless continuous execution is
deliberate. A missing exit prevents every statement after that loop from
running.

## Skipping the rest of one pass

`continue` stops the current body and begins the next pass. The counted loop
still advances and checks its boundary:

```lanternfly
var oddTotal as i16 = 0

sub sumOdds()
    var number as i16

    oddTotal = 0
    for number = 1 to 10
        if number mod 2 = 0 then
            continue
        end

        oddTotal = oddTotal + number
    end
end
```

An even number reaches `continue`, so the addition beneath it is skipped. The
values 1, 3, 5, 7 and 9 reach the accumulator and produce 25. Testing the
excluded case first keeps the main addition at the outer indentation of the
loop body.

## Nested loops

Two controls are needed to search a rectangular grid. The outer loop selects a
row, and the inner loop selects each column in that row:

```lanternfly
var target as u8 = 6
var found as boolean = false

sub findInGrid()
    var row as u8
    var column as u8

    found = false
    for row = 0 until 3
        if found then
            continue
        end

        for column = 0 until 4
            if row * 4 + column = target then
                found = true
                exit
            end
        end
    end
end
```

The inner expression assigns element numbers 0 through 3 to row 0, 4 through 7
to row 1 and 8 through 11 to row 2. Target 6 is found at row 1, column 2.

Bare `exit` leaves only the innermost loop. After the match, the outer loop
continues with row 2. The `found` test then executes `continue`, preventing
another inner search. The Boolean is needed because Lanternfly has no labelled
exit that leaves both loops at once.

`exit` and `continue` always apply to the innermost enclosing `for` or `while`.
`return`, covered with subroutine results in Chapter 10, leaves the complete
subroutine instead.

## Choosing a loop

The stopping rule determines the loop form:

| Repetition needed | Form |
| ----------------- | ---- |
| visit a sequence including its final value | `for ... to ... end` |
| visit values before a count or boundary | `for ... until ... end` |
| repeat while a condition remains true | `while ... end` |
| perform work before deciding whether to stop | `while true ... exit ... end` |

Chapter 7 adds `for each` for work that needs every array element but not its
index.

## Complete program

The complete module leaves `total` at 55, `greatestCommonDivisor` at 6 and
`result` at 16. The enum loop visits three phases, `sumOdds` produces 25 and
the nested search finds target 6 at row 1, column 2.

<<< @/lanternfly-book/book1/code/06-loops.txt{lanternfly}


## Exercise

1. Which values does `for address = 0 until 9 step 2` visit, and why is 9
   absent?

Answer: 0, 2, 4, 6 and 8. `until` excludes 9, and the next step from 8 would
cross that boundary.

## Chapter summary

- `for ... to` includes its boundary; `for ... until` stops before it.
- A compile-time `step` changes the distance and direction between control
  values.
- `while` tests before every pass, so its body may run zero times.
- `while true` repeats until `exit`; `continue` skips the rest of one pass.
- In nested loops, bare `exit` and `continue` affect the innermost loop.
