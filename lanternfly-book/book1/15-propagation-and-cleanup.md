---
layout: default
title: "Propagation and Cleanup"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 15
---

# Propagation and Cleanup

Chapter 14 kept detection and handling side by side: `main` called
`readNumber` and answered for its failure on the spot. Real programs put
layers between the two. A prompting routine sits between `main` and
`readNumber`; a file loader sits between a menu and the routine that
reads one record. This chapter follows a failure through those layers —
passing it back with `or fail`, substituting a default with `or`, and
keeping every exit tidy with `defer`.

## Passing failure back with `or fail`

Between the routine that detects a failure and the routine that can do
something about it, there are often layers that can do neither. They
pass the failure back to their callers, and their signatures say so too:

```lanternfly
sub promptForSpeed() as u16 fails EntryError
    writeText("SPEED? ")
    return readNumber() or fail
end
```

The line reads as English: return the number, or fail. If `readNumber`
fails, `promptForSpeed` fails with the same code, and the failure
continues toward `main`, where the `on error` block handles it. Two
rules govern propagation. A routine may only use `or fail` if its own
signature declares `fails` with the same error set — failure cannot pass
silently through a signature that declares success only. And the failure
arrives unchanged: the code `main` receives is the one `readNumber`
raised, however many layers it crossed.

In a deep call chain the shape becomes: detection at the bottom, handling
at the top, one word per layer in between. Not every program needs the
full depth — a default can consume a failure on the spot — but when the
human at the keyboard is the only agent who can fix a typo, the error
must travel back to the routine that prompts the person.

## What the compiler rejects

Chapter 14 showed the first rejection: a failable call with no answer.
Propagation adds the second:

```lanternfly
sub updateClock()
    frame = readNumber() or fail // rejected: updateClock does not
end                              // declare 'fails'
```

It is the same rule seen from below: a routine cannot forward a failure
its signature does not admit. Between them, `fails` clauses form an
unbroken chain from every `fail` statement to a handler or a default,
and the chain is visible in the signatures alone.

## A value instead: `or` with a default

Sometimes the response to failure is a sensible substitute, and a
full handler block is unnecessary. Putting a value after `or` supplies
the fallback:

```lanternfly
speed = promptForSpeed() or 100
```

Parse the entry, or use 100. The default expression is evaluated only
when the call fails, and it must fit the call's result type. This form
suits places where any reasonable value is better than another round
trip at the prompt. It would be wrong for `main`, where the person
deserves to know their entry was rejected.

## Cleanup at every exit with `defer`

Propagation adds exits to a routine — every `or fail` is a place the
routine may leave — and some routines have cleanup that must happen on
the way out, whichever exit is taken. `defer` registers one statement to
run at every exit:

```lanternfly
sub echoNumber() fails EntryError
    writeText("[")
    defer writeText("]")

    readNumber() or fail
    writeText("OK")
end
```

On success the output is `[OK]`. When `readNumber` fails, the routine
leaves at `or fail` — and the deferred `writeText` still runs, so the
output is a balanced `[]` followed by whatever the caller prints. Short
of a fault, the brackets cannot be left open, because the compiler
routes every exit, including the ones `or fail` inserts, through the
deferred statement. That is the whole purpose of `defer`: once failure
can leave a routine from the middle, cleanup placed by hand at the
bottom is no longer enough. A deferred statement must itself be
simple — an assignment or a result-free infallible call, registered at
the routine's top level — and it covers only the exits that come after
it; when several are registered, they run in reverse order, latest
first.

`skipRestOfLine` and `defer` are the same lesson at two scales: failure
paths still have cleanup to do, and the language automates it inside one
routine but not across the input stream — that part remains our
responsibility.

## Errors are not faults

The two kinds of going wrong stay strictly apart, and the boundary is
worth restating now that both sides are familiar. A fault — the bounds
check of Chapter 7, the range check of Chapter 5, division by zero — is
a broken contract, and no `on error` block can catch one. An error is an
expected outcome, declared in a signature and carried as a value. The
temptation to blur the line runs both ways. Using errors for bugs hides
the cause: a corrupted index should stop the program at the point of
damage, not travel upward as an error code. Using faults for input turns
a typo into a crash. The test is one question: could this happen in a
correct program? A typed `X` can. An index past the end of an array
cannot.

## What it costs

As always in this book, the question is what the generated code costs,
and the answer is small. There are no hidden tables and no unwinding
machinery, and a program that declares no failable routine contains none
of this. In the best case — a frameless routine under the candidate Z80
lowering — raising a failure is three instructions, propagation is a
single conditional return, and a handler adds one conditional branch;
frames, deferred cleanup and code layout add instructions. The candidate
lowering and its byte counts are tabulated in
[Book Two, Chapter 14](../book2/14-error-handling.md).

## Complete program

The [chapter listing](/lanternfly-book/book1/code/15-number-entry.txt)
is the finished number-entry module: Chapter 14's error set, helpers and
`readNumber`, with the prompting layer, the bracketed `echoNumber` and a
`main` that exercises both. Typing `250` sets the speed, prints `SET`,
and then `echoNumber` reads a confirmation entry: a valid one prints
`[OK]`, a spoiled one prints the balanced `[]` and `NO ECHO`. Every
failure from `readNumber` crosses `promptForSpeed` unchanged and is
answered in `main`.

## Exercises

1. `promptForSpeed` prints its prompt before calling `readNumber`. On a
   `badDigit` failure, has the prompt already been printed, and who
   prints the error message?
2. Rewrite the propagation line of `promptForSpeed` so that a failed
   entry silently becomes 100 instead. What does `main`'s handler see
   afterwards?
3. In `echoNumber`, the person types `7X` and Enter. Write the exact
   output, in order.

Answers: yes — the prompt is printed before the failure exists, and the
message comes from `main`'s handler, the only layer that answers;
`return readNumber() or 100` — the routine then never fails, `main`'s
handler never runs, and its `fails` clause becomes removable; the output
is `[` then `]` — the deferred write — with `NO ECHO` printed afterwards
by `main`'s second handler, and the spoiled line is consumed by
`skipRestOfLine` before `fail`.

## Chapter summary

- `or fail` passes a failure back to the caller unchanged, and is legal
  only where the signature's own `fails` clause admits it — so the chain
  from `fail` to handler or default is visible in signatures alone.
- `or value` substitutes a default, evaluated only on failure, where any
  reasonable value beats another round trip.
- `defer` registers cleanup that runs at every exit that comes after it,
  including the exits `or fail` inserts, in reverse order.
- Errors are declared, expected outcomes; faults are broken contracts —
  the test is whether it could happen in a correct program.
- The best-case cost is one conditional return per propagation and one
  conditional branch per handler; nothing exists in programs without
  failable routines.

A program can now handle whatever the person at the keyboard types. What
it still cannot do is reach the parts of a machine no portable contract
covers — and that, at last, is the final chapter.
