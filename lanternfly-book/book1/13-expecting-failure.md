---
layout: default
title: "Expecting Failure"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 13
---

# Expecting Failure

Programs go wrong in two ways, and the two kinds need different
treatment. An array index outside its domain, a division by zero, a value
that cannot fit its checked destination — these are bugs. Earlier
chapters met the checks that catch them, and the response is always the
same: the program stops with a fault report, because continuing past a
contract violation would only move the damage somewhere harder to find.
No program code intercepts a fault.

This chapter is about the other kind of going wrong. A person at the
keyboard types `12X4`. A number arrives one digit too large. Nothing
about the program is broken — input like this is a normal event in
normal operation, and stopping would be absurd. The program must detect
it, respond and carry on. Chapter 12 gave us our first taste of that
obligation: `readLine` returns a Boolean, and acting on it is our code's
job. This chapter gives the idea a proper language: routines that
declare they can fail, call sites where the possibility cannot be
ignored, and a compiler that rejects source that ignores it anyway.

One status note before we begin. This material is the provisional 0.6
revision of the language — the first addition since the 0.5 baseline the
rest of this book documents. The
[specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
is authoritative, and the reference details live in
[Book Two, Chapter 14](../book2/14-error-handling.md).

## Naming what can go wrong

An error is a value, and its type is an enum — Chapter 4's machinery,
doing a new job:

```lanternfly
enum EntryError as u8
    badDigit
    tooLarge
end
```

This is called an error set: the complete, closed list of ways one corner
of the program can fail. Each member is an ordinary enum value that can
be stored, compared and selected over. The representation must be `u8`,
which keeps every error code one byte.

What is *not* in the set matters as much as what is. Our example for
this chapter is number entry at the keyboard, and a person will
sometimes press Enter on an empty line. We could treat that as a third
error — but an empty line has an obvious harmless meaning, *no entry
yet*, and the friendlier response is to keep waiting. Choosing an error
set is design work: an error is an outcome the calling code must act
on, and not every surprise qualifies.

## Raw keys and line endings

The number will arrive as keystrokes, so we read it with Chapter 12's
`readCharacter` — and that choice comes with an obligation the portable
`readLine` had been handling for us. `readCharacter` supplies raw
bytes, and targets do not agree on how a line ends: one device sends
carriage return (13), another line feed (10), a third sends both. Two
small rules make all three conventions work without any special cases:
either byte counts as the end of a line, and a line with no digits is
skipped rather than reported. Under those rules the two-byte convention
simply looks like a number followed by one blank line, and the blank
line is skipped like any other.

Two helpers state the rules once:

```lanternfly
sub isLineEnd(key as u8) as boolean
    return key = lineFeed or key = carriageReturn
end

sub skipRestOfLine(key as u8)
    while not isLineEnd(key)
        key = readCharacter()
    end
end
```

`skipRestOfLine` is the important one, and its purpose becomes clear the
moment we ask what should happen *after* a failure. Suppose the person
types `12X4` and Enter. The `X` is where the routine detects the
problem — but `4` and the line ending are still queued in the input. If
the routine reported the failure immediately, the retry would begin by
reading that leftover `4` and could accept it as a fresh, valid entry —
a wrong answer born entirely on the error path. The rule this teaches
generalises: **a routine that fails must first put the world back in
order** — here, by consuming the rest of the spoiled line so the retry
starts clean.

## A routine that can fail

Now the routine itself. Two things can go wrong — a character may not
be a digit, and the number may not fit in sixteen bits — and its
signature says so with `fails`:

```lanternfly
sub readNumber() as u16 fails EntryError
    var value as u16 = 0
    var sawDigit as boolean = false
    var key as u8 = 0

    while true
        key = readCharacter()

        if isLineEnd(key) then
            if sawDigit then
                return value
            end

            continue
        end

        if key < '0' or key > '9' then
            skipRestOfLine(key)
            fail badDigit
        end

        if value > 6553 or (value = 6553 and key > '5') then
            skipRestOfLine(key)
            fail tooLarge
        end

        value = value * 10 + u16(key - '0')
        sawDigit = true
    end
end
```

Every invocation of this routine now ends in exactly one of two ways:
success, carrying a `u16`, or failure, carrying one member of
`EntryError`. `return` delivers success as always. `fail` is the new
statement: it ends the call at once, carrying the named error to the
caller. It reads like `return`, and that is the right instinct — a
failure is not an emergency, just the other kind of answer. Both `fail`
statements stand *after* their `skipRestOfLine`: cleanup first, then
report.

The digit accumulation is worth a second look, because it shows the
difference between this chapter and the fault machinery. Chapter 3
established that `u16` arithmetic wraps: `65530 * 10` is a defined
result, not a fault. If we simply multiplied and added, an over-long
number would wrap silently and `readNumber` would return nonsense. The
guard turns overflow into a declared error: any accumulated value above
6553 must overflow when another digit arrives, and at exactly 6553 a
final digit above `'5'` pushes past 65535. So `65535` is accepted and
`65536` fails with `tooLarge` — the boundary is exact, and it is our
code, not a runtime check, that draws it. Expected failure is always the
programmer's own definition of what must not pass.

## Handling failure with `on error`

A failable call cannot stand bare. The calling code must state what
happens on failure, and the fullest answer is an `on error` block bound
to the statement that failed:

```lanternfly
sub main()
    while true
        speed = promptForSpeed()
        on error code
            select code
            case badDigit
                writeText("DIGITS 0 TO 9 ONLY")
            case tooLarge
                writeText("65535 IS THE LARGEST")
            end

            writeNewline()
            continue
        end

        writeText("SET")
        writeNewline()
        return
    end
end
```

On success, the block is skipped entirely. On failure, the assignment
does not happen — `speed` keeps its old value — and the block runs with
`code` naming the error, ready to use. The name is readable only inside
the block, and the block's contents are ordinary statements: here a
`select`, a message and a `continue` back around the loop for another
try.

The `select` carries a guarantee. Because `code` is an enum,
Chapter 4's exhaustiveness rule applies: cover every member or say
`else`. Add a third member to `EntryError` next month and every handler
that selects over it is flagged until the new case is covered. The
error set is a checklist, and the compiler checks it against every
handler.

`on error` is BASIC ancestry, modernised: where `ON ERROR GOTO` sent the
whole program to one line number, this block belongs to one statement,
names its error as a typed value, and ends like any other block.

## Passing failure on with `or fail`

Between the routine that detects a failure and the routine that can do
something about it, there are often layers that can do neither. They
pass the failure down, and their signatures say so too:

```lanternfly
sub promptForSpeed() as u16 fails EntryError
    writeText("SPEED? ")
    return readNumber() or fail
end
```

Read it aloud: return the number, or fail. If `readNumber` fails,
`promptForSpeed` fails with the same code, and the failure continues
toward `main`, where the `on error` block handles it. Two rules keep
this honest. A routine may only use `or fail` if its own signature
declares `fails` with the same error set — failure cannot pass silently
through a signature that declares success only. And the failure arrives
unchanged: the code `main` receives is the one `readNumber` raised,
however many layers it crossed.

This is the shape worth remembering: detection at the bottom, handling
at the top, one word per layer in between. The human at the keyboard is
the only agent who can fix a typo, so the error travels to the routine
that prompts the person.

## What the compiler rejects

The rules above have teeth, and the teeth are compile-time errors:

```lanternfly
readNumber()                     // rejected: failure ignored

sub updateClock()
    frame = readNumber() or fail // rejected: updateClock does not
end                              // declare 'fails'
```

The first is the important one. In many languages a failure code is a
return value like any other, and ignoring it is not just possible but
easy — the source of a thousand quiet disasters. Here a failable call
must be handled, propagated or given a default, and there is no fourth
option. The second rejection is the same rule seen from below: a
routine cannot forward a failure its signature does not admit. Between
them, `fails` clauses form an unbroken chain from every `fail` statement
to some `on error` block, and the chain is visible in the signatures
alone.

## A value instead: `or` with a default

Sometimes the response to failure is simply a sensible substitute, and a
whole handler block is ceremony. Putting a value after `or` supplies the
fallback:

```lanternfly
speed = promptForSpeed() or 100
```

Parse the entry, or use 100. The default expression is evaluated only
when the call fails, and it must fit the call's result type. This form
suits configuration and cosmetics — places where any reasonable value
is better than another round trip at the prompt. It would be wrong for
`main` above, where the person deserves to know their entry was
rejected.

## Tidy exits with `defer`

Propagation adds exits to a routine — every `or fail` is a place the
routine may leave — and some routines have tidying that must happen on
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
output is a balanced `[]` followed by whatever the caller prints. The
brackets can never be left open, because the compiler routes every
exit, including the ones `or fail` inserts, through the deferred
statement. That is the whole purpose of `defer`: once failure can leave
a routine from the middle, cleanup placed by hand at the bottom is no
longer enough. A deferred statement must itself be simple — an
assignment or an infallible call, registered at the routine's top
level — and when there are several, they run in reverse order, latest
first.

`skipRestOfLine` and `defer` are the same lesson at two scales: failure
paths have housekeeping duties, and the language can automate them
inside one routine but not across the input stream — that part remains
our design responsibility.

## Errors are not faults

The two kinds of going wrong stay strictly apart, and the boundary is
worth restating now that both sides are familiar. A fault — the bounds
check of Chapter 6, the range check of Chapter 4, division by zero — is
a broken contract, and no `on error` block can catch one. An error is an
expected outcome, declared in a signature and carried as a value. The
temptation to blur the line runs both ways. Using errors for bugs buries
evidence: a corrupted index should stop the program at the scene, not
limp upward as a code. Using faults for input turns a typo into a
crash. The test is one question: could this happen in a correct program?
A typed `X` can. An index past the end of an array cannot.

## What it costs

As always in this book, the question is what the generated code costs,
and the answer here is small and exact. In the candidate Z80 lowering, `fail`
is three instructions — load the code, set a flag, return — four bytes
in all, and the code itself is the one byte of data that travels.
`or fail` compiles to a single conditional return: one byte, and zero
bytes when it ends the routine, because the ordinary final return then
carries both outcomes. An `on error` block adds one two-byte
conditional branch at its call site. There are no hidden tables and no
unwinding machinery, and a program that declares no failable routine
contains none of this. The exact lowering contract belongs to Book Two.

## Example

The [chapter listing](/lanternfly-book/book1/code/13-number-entry.txt)
is the complete number-entry module: the error set, the two line
helpers, `readNumber`, `promptForSpeed`, the retrying `main` and the
bracketed `echoNumber` variant. Typing `250` sets the speed and prints
`SET`; typing `12X4` prints the digit complaint once — the rest of the
spoiled line is consumed, never re-read — and the loop prompts again; an
empty line is skipped without comment; `65536` produces the range
message. Every path back to the prompt goes through the `on error`
block, and there is no path on which a failure goes unanswered.

## Chapter summary

- Faults are for bugs and stop the program; errors are expected
  outcomes, carried as values from an enum error set — and choosing the
  set is design work, because not every surprise is an error.
- `fails` in a signature declares the error set; `fail member` ends the
  call with that error, as `return` ends it with success.
- A failing routine puts the world back in order first — here, by
  consuming the rest of a spoiled input line so a retry starts clean.
- A failable call must be answered: an `on error` block handles the
  failure and leaves the destination unwritten, `or fail` passes it to a
  caller whose signature also says `fails`, and `or value` substitutes a
  default.
- An `on error` block's `select` over the code is checked for
  exhaustiveness like any enum selection.
- `defer` registers cleanup that runs at every exit, including the exits
  `or fail` inserts.
- Ignoring a failable result is a compile error, so failability is
  visible in signatures all the way from detection to handling.

Our programs now handle whatever the person at the keyboard types. What
they still cannot do is reach the parts of a machine no portable
contract covers — and that, at last, is the final chapter.
