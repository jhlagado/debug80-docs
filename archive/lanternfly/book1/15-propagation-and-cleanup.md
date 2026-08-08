---
layout: default
title: "Propagation and Cleanup"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 15
---

# Propagation and Cleanup

Chapter 14 kept detection and handling side by side: `main` called
`readNumber` and answered for its failure on the spot. Real programs put
layers between the two: a prompting routine sits between `main` and
`readNumber`. We follow a failure through those layers — passing it
back with `or fail`, substituting a default with `or`, and running
cleanup at every exit with `defer`.

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

If `readNumber`
fails, `promptForSpeed` fails with the same code, and the failure
continues toward `main`, where the `on error` block handles it. Two
rules govern propagation. A routine may only use `or fail` if its own
signature declares `fails` with the same error set — failure cannot pass
silently through a signature that declares success only. And the failure
arrives unchanged: the code `main` receives is the one `readNumber`
raised, however many layers it crossed.

## The propagation rule

Chapter 14 showed the first rejection: a failable call with no answer.
Propagation adds the second:

```lanternfly
sub updateClock()
    frame = readNumber() or fail // rejected: updateClock does not
end                              // declare 'fails'
```

A routine cannot forward a failure its signature does not admit.
`fails` clauses therefore form an unbroken chain from every `fail`
statement to a handler or a default, visible in the signatures alone.

## A value instead: `or` with a default

Sometimes the response to failure is a sensible substitute, and a full
handler block is unnecessary. Suppose a routine of `promptForSpeed`'s
shape reads a nonessential calibration value — one the program can serve
without. A spoiled entry can fall back to the designed default, written
after `or`:

```lanternfly
toneDivider = promptForTone() or 512
```

Parse the entry, or use 512. The default expression is evaluated only
when the call fails, and it must fit the call's result type. The speed
entry is different: `main` must report a rejected entry to the person
who typed it, so it keeps its `on error` block.

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
deferred statement. Once failure can leave a routine from the middle,
cleanup placed by hand at the bottom is not enough. A deferred statement
must itself be
simple — an assignment or a result-free infallible call, registered at
the routine's top level — and it covers only the exits that come after
it; when several are registered, they run in reverse order, latest
first.

## Errors and faults

A fault — the bounds check of Chapter 7, the range check of Chapter 5,
division by zero — is a broken contract, and no `on error` block can
catch one. An error is an expected outcome, declared in a signature and
carried as a value. Blurring the line fails both ways: an error used for
a bug lets a corrupted index travel upward as a code instead of stopping
the program at the point of damage, and a fault used for input turns a
typo into a crash. The test is one question: could this happen in a
correct program? A typed `X` can. An index past the end of an array
cannot.

## Cost

A program that declares no failable routine contains none of this
machinery: no hidden tables, no unwinding, no failure channel. The
constructs themselves cost little, and
[Book Two, Chapter 14](../book2/14-error-handling.md) tabulates the
costs.

## Complete program

The finished number-entry module contains Chapter 14's error set, helpers and
`readNumber`, with the prompting layer, the bracketed `echoNumber` and a `main`
that exercises both. Typing `250` sets the speed, prints `SET`,
and then `echoNumber` reads a confirmation entry: a valid one prints
`[OK]`, a spoiled one prints the balanced `[]` and `NO ECHO`. The two
entries fail along different paths: a spoiled speed entry crosses
`promptForSpeed` unchanged, while a spoiled confirmation propagates from
`echoNumber` directly. Both are answered in `main`.

<<< @/lanternfly-book/book1/code/15-number-entry.txt{lanternfly}


## Exercises

1. In `echoNumber`, the person types `7X` and Enter. Write the exact
   output, in order.

Answer: `[` then `]`, followed by `NO ECHO` from `main`'s second handler.
`skipRestOfLine` consumes the spoiled line before `fail` runs.

## Chapter summary

- `or fail` passes a failure back to the caller unchanged, and is legal
  only where the signature's own `fails` clause admits it — so the chain
  from `fail` to handler or default is visible in signatures alone.
- `or value` substitutes a default, evaluated only on failure.
- `defer` registers cleanup that runs at every exit that comes after it,
  including the exits `or fail` inserts, in reverse order.
- Errors are declared, expected outcomes; faults are broken contracts —
  the test is whether it could happen in a correct program.
- A program without failable routines carries none of their machinery;
  the language reference tabulates the construct costs.
