---
layout: default
title: "Loops"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 5
---

# Loops

Everything a computer is admired for comes down to repetition. A
processor does nothing a patient person could not do with a pencil; it
simply does it millions of times a second, identically, for hours. The
game loop that wakes fifty times a second is a loop. The routine that
touches every entry in a table is a loop. The search that keeps looking
until it finds, the counter that ticks down to zero, the screen redrawn
row by row — all of them are one idea, a body of statements executed
again and again under some rule that says when to stop.

The stopping rule determines whether a loop completes its work. If it never
becomes false, the current routine or frame cannot reach later statements; on
a simple standalone target, the visible program may stall completely.
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
`total` finishes at 55. The body is worth naming, because you will
write it a thousand times: `total = total + number` is the
*accumulator* pattern — a variable that starts empty and gathers a
result piece by piece as the loop feeds it. Sums, counts, best-so-far
records and checksums are all accumulators with different verbs.
(A mathematician would reach this particular 55 in one step with the
formula n × (n + 1) / 2 — worth remembering, because the cheapest loop
is the one you replace with arithmetic. The loop earns its keep when
the work in the body is real, and for the rest of this chapter it will
be.)

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

The opening line is a compact contract with three clauses, and each
clause is a promise the rest of the program can lean on.

First, the loop variable — declared with the other locals at the start
of the subroutine — takes each value of the range in turn. Second, the
range is inclusive at both ends: `1 to 10` visits ten values, not nine — a detail worth pinning down at
once, because half-open ranges in other
languages train the opposite instinct, and the fence-post error — one
iteration too many or too few — is among the commonest bugs in all of
programming. In Lanternfly the rule is simply
that the loop visits both ends of the range you wrote. Third, the
start and limit are evaluated once, before the first pass, so nothing
the body does to the variables that produced them can stretch or
shrink a running loop. The contract is read once and honoured
throughout.

Omitting `step` uses the mathematical step `+1`. An explicit step
changes the sequence:

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

Counting down reads oddly at first and then becomes a favourite,
because so much game work runs backward naturally — drawing rows from
the bottom of the screen up, retiring particles from the end of a
list, draining a timer toward zero.

Two rules protect the contract. The loop body cannot assign to its
control variable: a counted loop's entire promise is that the counter
marches through the stated range, and a body that could silently
shove the counter around would turn every `for` into a puzzle — each
reader forced to scan the body for ambushes before trusting the
opening line. When you genuinely need a loop whose progress the body
controls, that is not a counted loop, and the `while` and `loop`
forms below say so honestly. Second, Lanternfly performs the step
using mathematical integers and stops before a fixed-width counter
can wrap past its boundary. Veterans of C will recognise what this
rule buries: the byte-sized counter asked to reach the top of its
range, which sails past 255, wraps to 0, and loops forever — Chapter
1's odometer, this time driving the loop itself. In Lanternfly the
counter arithmetic simply cannot wrap, and one of the classic
infinite loops goes extinct.

## Conditional loops

A counted loop knows in advance how many times it will run. Much of
the interesting work does not. Keep taking damage while shields
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

Nothing here promises progress, though. The body must move the world
toward the condition turning false, and a body that forgets is an
infinite loop. A trace of `countDown` shows it: 3 is above zero, becomes
2; 2 becomes 1; 1 becomes 0; and the fourth test finds 0, answers
false, and the loop is done — three passes, each visibly one step
closer to the exit. Every sound `while` has that "visibly closer" quality: some quantity
shrinks toward the condition's edge, and a loop without one is a hope
rather than a loop. The counted loop made this mistake
impossible; `while` trades the safety for flexibility and hands the
responsibility to you.

## Indefinite loops

Sometimes even the condition is awkward to state up front, because
the natural stopping rule lives in the *middle* of the work: produce
a candidate, then judge it. Computing scientists call this the "loop
and a half" — half a pass must run before the test makes sense.
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
16 produces 24, not 16 — the routine finds the *next* multiple, and
that one-line trace is the difference between the program you wrote
and the program you meant. (Chapter 3's `mod` is doing the judging:
divisible-by-eight means remainder zero. "Which and where inside"
strikes again.)

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

The alternative is wrapping the whole body in an `if`, which works,
and which buries the real work one indentation level deeper for
every condition added. The early `continue` disposes of the
irrelevant cases at the top and lets the code that matters stand
flat. Chapter 9 applies the same shape to subroutines under the name
of the guard clause; learn it once here and you get it twice.

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

The inner loop sets the flag and exits; the outer loop's condition,
or a test just past the inner `end`, consults it. It is two lines of
ceremony, and it buys something subtler than brevity: the flag has a
name. A reader meets `found` and knows what question the nested
search was asking, which no amount of bare control flow can say. The
pattern is Chapter 2's lesson about Booleans, paying rent — a fact
computed in one place, named, and consulted in another.

## Choosing a loop

| Repetition rule | Form |
| --- | --- |
| counter crosses an inclusive range | `for ... to ... end` |
| condition is tested before work | `while ... end` |
| statements repeat until they exit | `loop ... end` |

Choose the form whose opening line states the stopping rule. That line also
gives the backend the range, condition or branch structure it must lower.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt)
contains counted, conditional and indefinite loops. Trace
`findNextMultiple` from 16 and from 15. Because the candidate advances before
the test, the expected results are 24 and 16.
