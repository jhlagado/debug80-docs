---
layout: default
title: "Expecting Failure"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 14
---

# Expecting Failure

Programs go wrong in two ways, and the two kinds need different
treatment. An array index outside its domain, a division by zero, a value
that cannot fit its checked destination — these are bugs. Earlier
chapters met the checks that catch them. A fault does not return to the
failing operation, because continuing past a contract violation would
only move the damage somewhere harder to find. What happens instead
belongs to the target: it may report the fault, trap it, halt, or enter
a fault monitor, and debug artifacts preserve the fault's class and
source location. No program code intercepts one.

This chapter is about the other kind of going wrong. A person at the
keyboard types `12X4`. A number arrives one digit too large. Nothing
about the program is broken — input like this is a normal event in
normal operation, and stopping would be absurd. The program must detect
it, respond and carry on. Chapter 13 met this obligation first:
`readLine` returns a Boolean, and acting on it is our code's job. This
chapter gives the idea a proper language: routines that declare they can
fail, call sites where the possibility cannot be ignored, and a compiler
that rejects source that ignores it anyway.

One status note before we begin. Error handling is the newest part of the
language and remains provisional: its details may change before the first
compiler. The reference rules live in
[Book Two, Chapter 14](../book2/14-error-handling.md).

## Naming what can go wrong

An error is a value, and its type is an enum — Chapter 5's machinery,
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

The number will arrive as keystrokes, so we read it with Chapter 13's
`readCharacter` — and that choice comes with an obligation the portable
`readLine` had been handling for us. `readCharacter` supplies raw
bytes, and targets do not agree on how a line ends: one device sends
carriage return (13), another line feed (10), a third sends both. Two
small rules make all three conventions work without any special cases:
either byte counts as the end of a line, and a line with no digits is
skipped rather than reported. Under those rules the two-byte convention
simply looks like a number followed by one blank line, and the blank
line is skipped like any other. The equivalence belongs to this entry
protocol, though, not to the operations themselves: after a CR-terminated
entry the LF is still queued, and a raw `readCharacter` outside the
protocol would see it. Skipping blank lines also means that after an
empty line the routine waits for more input without printing another
prompt.

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
a wrong answer produced by the error handling itself. The rule this
teaches generalises: **a routine that fails must first restore whatever
its own partial work disturbed** — here the input stream, by consuming
the rest of the spoiled line so the retry starts clean.

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

In the absence of a fault, every invocation of this routine now ends in
one of two ways: success, carrying a `u16`, or failure, carrying one
member of `EntryError`. `return` delivers success as always. `fail` is
the new statement: it ends the call at once, carrying the named error to
the caller. It reads like `return` because it works like `return`:
failure is the other way a call can end. Both `fail` statements stand
*after* their `skipRestOfLine`: cleanup first, then report.

The digit accumulation shows the difference between this chapter and
the fault machinery. Chapter 3 established that `u16` arithmetic wraps:
`65530 * 10` is a defined result, not a fault. If we simply multiplied
and added, an over-long number would wrap silently and `readNumber`
would return nonsense. The guard turns overflow into a declared error:
any accumulated value above 6553 must overflow when another digit
arrives, and at exactly 6553 a final digit above `'5'` pushes past
65535. So `65535` is accepted and `65536` fails with `tooLarge` — the
boundary is exact, and it is our code, not a runtime check, that draws
it.

## Handling failure with `on error`

A failable call cannot stand alone. The calling code must state what
happens on failure, and the fullest answer is an `on error` block bound
to the statement that failed:

```lanternfly
sub main()
    while true
        writeText("SPEED? ")

        speed = readNumber()
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

Because `code` is an enum, Chapter 5's exhaustiveness rule applies:
cover every member or say `else`. Add a third member to `EntryError`
next month and every handler that selects over it is flagged until the
new case is covered.

`on error` descends from BASIC's `ON ERROR GOTO`: where that form sent the
whole program to one line number, this block belongs to one statement,
names its error as a typed value, and ends like any other block.

One rule already has teeth here, and it is the important one. A failable
call must be answered — in this chapter by an `on error` block, in the
next by two further forms — and a bare call is rejected:

```lanternfly
readNumber()        // rejected: failure ignored
```

In many languages a failure code is a return value like any other, and
ignoring one is easy and common. Here there is no way to look away.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/14-number-entry.txt)
is the complete first version of the number-entry module: the error set,
the two line helpers, `readNumber` and the retrying `main`. Typing `250`
sets the speed and prints `SET`; typing `12X4` prints the bad-digit
message once — the rest of the spoiled line is consumed, never
re-read — and the loop prompts again; an empty line is skipped without
comment; `65536` produces the range message. Every path back to the
prompt goes through the `on error` block.

## Exercises

1. The person types `99999` and Enter. Which error does `readNumber`
   raise, and at which digit?
2. In `main`, why does `speed` keep its old value when `readNumber`
   fails?
3. A member `emptyLine` is added to `EntryError`. What happens to `main`
   at the next compile, and why might the addition itself be a design
   mistake?

Answers: `tooLarge` at the fifth digit — the accumulated 9999 exceeds
6553 before the final 9 is used; on failure the assignment bound to the
`on error` block does not happen, so the destination stays unwritten;
the handler's `select` no longer covers every member, so it is flagged
until `emptyLine` has a case — and the chapter argued an empty line
means *no entry yet*, an outcome the calling code should not be forced
to act on.

## Chapter summary

- Faults are for bugs and do not return; errors are expected outcomes,
  carried as values from an enum error set — and choosing the set is
  design work, because not every surprise is an error.
- `fails` in a signature declares the error set; `fail member` ends the
  call with that error, as `return` ends it with success.
- A failing routine first restores whatever its own partial work
  disturbed — here, by consuming the rest of a spoiled input line so a
  retry starts clean.
- An `on error` block binds to the failable statement before it, leaves
  the destination unwritten on failure, and its `select` over the code
  is checked for exhaustiveness.
- Ignoring a failable result is a compile error.

Detection and handling sat side by side in this chapter: `main` called
`readNumber` and answered for it on the spot. Real programs put layers
between the two — and the next chapter is about what failure does on the
way through.
