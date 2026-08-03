---
layout: default
title: "Expecting Failure"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 14
---

# Expecting Failure

Programs go wrong in two ways. An array index outside its domain, a
division by zero, a value that cannot fit its checked destination —
these are bugs, and their checks fault: the failing operation does not
return, the target reports, traps or halts, and no program code
intercepts one.

This chapter is about the other kind of going wrong. A person at the
keyboard types `12X4`, or a number one digit too large. Nothing about
the program is broken — input like this is a normal event, and the
program must detect it, respond and carry on. This chapter introduces
routines that declare they can fail, call sites where the possibility
cannot be ignored, and a compiler that rejects source that ignores it.

[Book Two, Chapter 14](../book2/14-error-handling.md) states the
reference rules for this chapter and the next.

## Naming what can go wrong

An error is a value, and its type is an enum — Chapter 5's machinery,
doing a new job:

```lanternfly
enum EntryError as u8
    badDigit
    tooLarge
end
```

This is called an error set: the complete, closed list of ways a routine
can fail. Each member is an ordinary enum value that can
be stored, compared and selected over. The representation must be `u8`,
which keeps every error code one byte.

The set's omissions are also design. Our example is number entry at the
keyboard, and a person will sometimes press Enter on an empty line. An
empty line means *no entry yet*, and the friendlier response is to keep
waiting rather than to report a third error. An error is an outcome the
calling code must act on, and not every surprise qualifies.

## Raw keys and line endings

Chapter 13's `readCharacter` returns the entry one byte at a time — and
raw bytes carry an obligation the portable `readLine` had been handling:
targets use different line endings.
One device sends carriage return (13), another line feed (10), a third
sends both. Two rules cover all three conventions: either byte counts as
the end of a line, and a line with no digits is skipped rather than
reported. The two-byte convention then reads as a number followed by one
blank line, skipped like any other, and after an empty line the routine
waits for more input without printing another prompt. The equivalence
belongs to this entry protocol, not to the operations: after a
CR-terminated entry the LF is still queued, and a raw `readCharacter`
outside the protocol would return it.

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

Suppose the person types `12X4` and Enter. The `X` is where the routine
detects the problem — but `4` and the line ending are still queued in
the input. A failure reported immediately would leave the retry to read
that leftover `4` and accept it as a fresh, valid entry — a wrong answer
produced by the error handling itself. So `readNumber` drains the
invalid line with `skipRestOfLine` before returning an error, and the
retry begins at the next line.

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
the caller — failure is the other way a call can end. Both `fail`
statements stand *after* their `skipRestOfLine`: cleanup first, then
report.

Chapter 3 established that `u16` arithmetic wraps: `65530 * 10` is a
defined result, not a fault, so an unguarded accumulation would wrap
silently and `readNumber` would return nonsense. The guard turns
overflow into a declared error: any accumulated value above 6553 must
overflow when another digit arrives, and at exactly 6553 a final digit
above `'5'` pushes past 65535. `65535` is accepted and `65536` fails
with `tooLarge`.

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
`code` naming the error. The name is readable only inside
the block, and the block's contents are ordinary statements: here a
`select`, a message and a `continue` back around the loop for another
try.

Because `code` is an enum, Chapter 5's exhaustiveness rule applies:
cover every member or say `else`. Adding another member to `EntryError`
flags this handler until its `select` adds a case or an `else`.

A failable
call must be answered — in this chapter by an `on error` block, in
Chapter 15 by two further forms — and a bare call is rejected:

```lanternfly
readNumber()        // rejected: failure ignored
```

## Failure from the program entry

The entry itself may declare an error set:

```lanternfly
enum ProgramError as u8
    invalidArguments
    missingData
end

sub runProgram() fails ProgramError
    fail missingData
end

sub main() fails ProgramError
    runProgram() or fail
end
```

Reaching `end` or using bare `return` reports successful program termination.
Here, `fail missingData` reports unsuccessful termination with that enum member.
The enum remains an ordinary opaque, zero-based type inside Lanternfly. A
target that exposes a numeric exit status maps success to zero and a failed
member with ordinal `n` to `n + 1`; other targets deliver the same two outcomes
through their monitor, firmware or test runner.

## Complete program

The complete first version of the number-entry module contains the error set,
the two line helpers, `readNumber` and the retrying `main`. Typing `250`
sets the speed and prints `SET`; typing `12X4` prints the bad-digit
message once — the rest of the spoiled line is consumed, never
re-read — and the loop prompts again; an empty line is skipped without
comment; `65536` produces the range message. Every path back to the
prompt goes through the `on error` block.

<<< @/lanternfly-book/book1/code/14-number-entry.txt{lanternfly}


## Exercises

1. In `main`, why does `speed` keep its old value when `readNumber`
   fails?

Answer: the assignment bound to the `on error` block does not happen on
failure, so the destination remains unchanged.

## Chapter summary

- Faults are for bugs and do not return; errors are expected outcomes,
  carried as values from an enum error set — and choosing the set is
  design work, because not every surprise is an error.
- `fails` in a signature declares the error set; `fail member` ends the
  call with that error, as `return` ends it with success.
- `readNumber` drains an invalid line before failing, so a retry begins
  at the next line.
- An `on error` block binds to the failable statement before it, leaves
  the destination unwritten on failure, and its `select` over the code
  is checked for exhaustiveness.
- Ignoring a failable result is a compile error.
- A failable entry reports unsuccessful program termination with an error-set
  member; normal completion reports success.
