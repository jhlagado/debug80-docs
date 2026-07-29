---
layout: default
title: "Loops"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 5
---

# Loops

Everything a computer is admired for comes down to repetition. A
processor does nothing a patient person could not do with a pencil; it
simply does it millions of times a second without losing interest. The
game loop that wakes fifty times a second is a loop. The routine that
touches every entry in a table is a loop. The search that keeps looking
until it finds, the counter that ticks down to zero, the screen redrawn
row by row — all of them are one idea, a body of statements executed
again and again under some rule that says when to stop.

The stopping rule is the interesting part. A loop that stops too early
leaves work undone; a loop that stops too late corrupts what it
touches; a loop that never stops takes the whole machine down with it,
because on a small computer there is nothing else running to wrest
control back. Lanternfly has three loop statements, and they differ in
exactly one thing: the kind of stopping rule they announce. Learning
the three is learning to say, precisely, "this is what keeps me going
and this is what stops me" — and the compiler holds you to it.

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
range is inclusive at both ends: `1 to 10` visits ten values, not
nine. Fix that in place now, because half-open ranges in other
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

The test comes first, which has a consequence easy to state and easy
to forget: an initially false condition runs the body zero times. A
`while` is a guard and a loop in one — Chapter 1's `if lives > 0`
guard, applied afresh before every single pass — and the zero-times
case is a feature, not an edge: a loop over an empty list should do
nothing, and this one does nothing without any special handling.

Nothing here promises progress, though. The body must move the world
toward the condition turning false, and a body that forgets is an
infinite loop. Run the trace on `countDown`: 3 is above zero, becomes
2; 2 becomes 1; 1 becomes 0; and the fourth test finds 0, answers
false, and the loop is done — three passes, each visibly one step
closer to the exit. That "visibly closer" quality is what to check
whenever you write a `while`. Find the quantity that shrinks toward
the condition's edge, and if you cannot find one, you have written a
hope rather than a loop. The counted loop made this mistake
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

A `loop` with an `exit` can imitate either of the other two forms,
which tempts some programmers to use nothing else. Resist. The
opening word of a loop is the first thing a reader learns about it:
`for` promises a counted march, `while` names the continuing
condition before the body begins, and `loop` warns, honestly, that
the stopping rule is somewhere inside and must be hunted. Spending
the least powerful form that fits is a kindness to every future
reader, yourself included — it is the difference between a door
labelled with where it leads and a corridor you must walk to find
out.

## Skipping an iteration

`exit` abandons a loop; its milder sibling abandons only the current
pass. `continue` starts the next iteration immediately:

```lanternfly
for index = 0 to actorCount - 1
    if not actors[index].active then
        continue
    end

    updateActor(actors[index])
end
```

This is the standard filtering idiom: a table of game actors in which
only some slots are live, a quick test at the top of the body, and
`continue` to step past the rest. (The bracket-and-dot notation for
tables like `actors[index].active` arrives properly in Chapters 6
and 7; here it is enough that inactive actors skip the call.) In a
counted loop, `continue` proceeds to the next step and test — the
counter still advances, the range is still honoured, and only the
remainder of this one pass is abandoned.

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

The choice is the same judgement each time: which stopping rule is
*true* of this work? Announce that one. The opening line states what
controls repetition, and the statement serves two readers at once —
the human, who learns the loop's character before its body, and the
backend, which takes from that same line the information it needs to
form the branches, tests and counter updates. A well-chosen loop is
documentation and machine code from a single sentence.

## Example

The [chapter listing](/lanternfly-book/book1/code/05-loops.txt)
contains counted, conditional and indefinite loops. The indefinite
one deserves your pencil most: start `candidate` at 16, walk the
loop until `exit` fires, and confirm 24. Then start it at 15 and
notice you get 16 — the "advance before test" shape doing exactly
what it says, twice. If the two traces feel almost too easy, that is
the intended reward for four chapters of pencil work: you are
becoming fluent in running small machines by hand, just in time for
the next chapter to hand you real tables to run them over.
