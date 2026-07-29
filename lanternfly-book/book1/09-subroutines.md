---
layout: default
title: "Subroutines"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 9
---

# Subroutines

Chapter 1 declared a subroutine and has been calling them ever since,
but `loseLife` had a limitation this book has quietly worked around for
eight chapters: it could only ever do exactly one thing to exactly one
variable. The moment a game wants "add some points" rather than "add
ten points", a routine needs to receive information from its caller.
Parameters are that channel — they let one subroutine work with values
supplied fresh at each call:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end

addScore(10)
```

`amount` receives its own scalar value for each invocation. Call
`addScore(10)` from the coin routine and `addScore(50)` from the bonus
routine, and the same three lines serve both — the routine describes
the transaction once, and the callers supply the particulars.

A program of any size is not
written as one long story; it is written as a *vocabulary*. Each `sub`
adds a word to the game's language — `loseLife`, `addScore`,
`findStep`, `updateStatus` — and the main loop, when you finally write
it, reads as a sentence built from those words: check input, update
each actor, settle the score, draw. Design the vocabulary well and the
top of your program reads like its own description; design it badly
and every routine needs a paragraph of apology. The craft of this
chapter is interface design in miniature — deciding, for each word,
what flows in, what flows out, and what the routine may keep private
in between.

The example above already contains one such decision, small but real.
`addScore` takes `amount` as a parameter but reaches `score` as a
global — the particulars travel in through the front door while the
subject of the transaction stays ambient. That split is defensible
here: there is one score, every caller means it, and forcing each call
to repeat `score` would add noise without information. But notice it
was a *choice*. A routine's parameters are the facts that vary per
call; its globals are the facts the whole program agrees on; and every routine draws that line somewhere — better on purpose than by
accident.

## One declaration form

Every user routine begins with `sub`. Pascal, this language's ancestor
in spirit, split its routines into two species — `procedure` for
actions and `function` for value-producers. Lanternfly keeps the
distinction but not the second keyword: a subroutine that performs an
action simply omits a result type:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end
```

The parameter list names each input and its type, in the same
`name as Type` shape as every declaration since Chapter 1 — a
parameter *is* a declaration, one whose initial value arrives from
outside. A call supplies arguments in the same order:

```lanternfly
addScore(bonus)
```

Arguments are evaluated from left to right before the invocation
begins — a small guarantee that removes a whole category of doubt.
When two argument expressions both have effects, the order those
effects happen in is part of the language, the same on every target,
and never a surprise discovered while debugging.

## Returning a value

A trailing `as Type` declares a result:

```lanternfly
sub limited(value as i16, limit as i16) as i16
    if value > limit then
        return limit
    end

    return value
end
```

This is a clamp — one of the small utilities game code reaches for
constantly, because scores, positions and timers all have ceilings
they must respect. The vocabulary idea plays out in the signature: the routine's name states what comes back, its two parameters are
transparently the question being asked, and a reader who never opens
the body can still use it correctly. That is the mark of a
well-designed value-producer, and it is worth more than cleverness
inside.

The caller uses the result in an expression, exactly where the
unclamped value would have gone:

```lanternfly
score = limited(score + bonus, 1000)
```

Read the whole line and watch the machinery of five chapters click
together: an expression computes the argument, the call transforms
it, the assignment stores the result under Chapter 2's rules. Calls
nest in expressions because a call with a result *is* an expression —
`limited(...)` stands wherever an `i16` may stand.

Every reachable path in a result-bearing subroutine returns a
compatible value, and the compiler checks this. The bug being
prevented is an old and humiliating one: a function with a branch
nobody finished, which in looser languages returns whatever garbage
the machine had lying around — and returns it only on the branch
your tests never took. Here the missing `return` is a compile error
on the day you write it, not a mystery on the day it ships.

A result-free call stands alone as a statement, and a result-bearing
call can also stand alone when its result is intentionally
discarded.

## Scalar locals

Parameters carry values in; locals give the routine private working
storage of its own:

```lanternfly
sub distanceSquared(x as i16, y as i16) as i32
    var xSquared as i32
    var ySquared as i32

    xSquared = i32(x) * i32(x)
    ySquared = i32(y) * i32(y)
    return xSquared + ySquared
end
```

Local declarations appear before executable statements and have
routine scope — a rule that doubles as documentation, since the top
of any routine lists everything it keeps. Each invocation gets its
own values, so a routine that calls another is never wondering whose
`index` is whose. Privacy is the quiet virtue here: nothing outside
the routine can see or disturb its locals, which shrinks the world a
reader must consider to the page in front of them. Eight chapters
of globals were fine for programs that fit on one page; locals are
what let programs grow past that without growing tangled.

An omitted initializer starts an owned scalar local with zero bits,
and reference locals require valid initializers — Chapter 8's
promise holding firm: there is never a moment, even one statement
long, in which a reference exists but points nowhere.

Where do locals actually live? The honest answer is: wherever the
backend can cheapest put them. Registers when they fit, stack slots
when they must, or proven-safe static scratch — a fixed memory cell
that analysis has shown no overlapping invocation can disturb. That
last option is a venerable Z80 economy, because stack traffic costs
instructions on a small processor, and assembly programmers have
always hoarded fixed scratch bytes for exactly this reason. The
compiler plays the same trick with a proof instead of a hope, and
source semantics still provide fresh values for overlapping
invocations. You write locals; the backend chooses their lodging; the meaning never moves.

## Aggregate parameters

Scalars pass by value, but copying a whole record or array into
every call would be movement for its own sake — Chapter 7 priced a
monster table at 24 bytes, and no frame budget wants that spent per
call. A private aggregate parameter therefore aliases the caller's
existing storage:

```lanternfly
sub clearRow(row as u8[8])
    var index as i16

    for index = 0 to count(row) - 1
        row[index] = 0
    end
end
```

The call passes a compatible storage path:

```lanternfly
clearRow(boardRows[selectedRow])
```

Within the call, `row` is Chapter 8's alias by another door: the
caller performs the selection, the routine receives the whereabouts,
and updating `row[index]` updates the selected row in the caller —
at the cost of passing one reference rather than eight bytes. The
routine is written against "a row", any row, and the caller decides
which row this call means. That division — routine holds the
procedure, caller holds the identity — is how one `clearRow` serves
a whole board.

One consequence follows directly: a temporary array initializer
cannot serve as a writable aggregate argument, since writes into
storage that exists only for the duration of the call would be words
spoken into a void.

An exported routine states the reference class:

```lanternfly
export sub clearSharedRow(row as near ref (u8[8]))
    ...
end
```

Inside one compilation, the compiler may pass private aggregates
however the target prefers. A public interface is a promise to
callers compiled elsewhere, and promises name their terms: the
explicit `near ref` makes the calling convention independent of a
backend default, so the day the default changes, the interface does
not.

## Early return

A result-free subroutine may leave early with bare `return`:

```lanternfly
sub updateActor(actor as Actor)
    if not actor.active then
        return
    end

    actor.x = actor.x + actor.velocityX
end
```

This is the guard-clause shape — Chapter 5's `continue` idiom
translated from loops to routines, as promised. Dispose of the cases
that do not apply, then write the real work flat, unindented,
uncluttered. The alternative — wrapping the whole body in an `if` —
nests deeper with every condition until the interesting code huddles
in the middle of the screen. Reaching the closing `end` also returns
from a result-free subroutine, so the simplest routines need no
`return` at all.

## Recursion and target profiles

A routine that calls itself needs a fresh copy of its parameters and
locals for every call in flight — independent frames, in the jargon
— and whether that is affordable is a property of the machine, not
of the language. Lanternfly handles the split honestly. A
recursion-capable target profile defines its stack rules and reports
frame costs, and recursion simply works there, priced like
everything else. A profile that uses fixed scratch — the
static-lodging economy described above, on targets where it is the
only economical choice — rejects direct or mutual call cycles at
compile time, because a second frame would overwrite the first — a fact the compiler
reports rather than hides.

The routine body keeps the same source meaning under either profile;
the profile determines only whether the required storage can be
supplied. If you are coming from big machines, where recursion is as
unremarkable as addition, the compile-time rejection may feel
strict. It is the strictness of a language that would rather refuse
a program than run it wrong — the same temperament you have met at
every boundary since Chapter 1, applied to the machine's deepest
constraint. And in practice, game logic on small machines leans on
iteration anyway: the loops of Chapter 5 over the arrays of Chapter
6 cover nearly everything a frame must do, with costs that never
depend on how deep a call tree happened to grow.

## Example

The [chapter listing](/lanternfly-book/book1/code/09-routines.txt)
contains an action, two result-bearing subroutines and an aggregate
parameter. Traced with a score of 980 and a bonus of 50, `limited(score + bonus,
1000)` evaluates its argument first: 1030 travels in, the comparison
trips, and 1000 comes back. With a bonus of 10, the other path runs. Two pencil passes
cover every reachable line of the routine — which is, not
coincidentally, exactly what the compiler checked when it accepted
the declaration. You and it are converging on the same habits; the
difference is that it never gets tired, and you get to decide what
is worth checking.
