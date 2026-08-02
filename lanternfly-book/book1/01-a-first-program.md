---
layout: default
title: "Your First Lanternfly Program"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 1
---

# Your First Lanternfly Program

Suppose an order has a subtotal of 120 and a postage charge of 15, and we
want the amount due. Here is the complete Lanternfly source:

```lanternfly
var subtotal as u16 = 120
var postage as u16 = 15
var total as u16 = 0

sub addPostage()
    total = subtotal + postage
end

sub main()
    addPostage()
end
```

Before `main` begins, `subtotal` contains 120, `postage` contains 15 and
`total` contains 0. Execution starts in `main`, whose one statement calls
`addPostage`; after the assignment inside `addPostage` has run, the first
two values are unchanged and `total` contains 135.

The program shows three facts: static storage, an explicit entry point
and a statement that changes a stored value.

## Three places in memory

```lanternfly
var subtotal as u16 = 120
var postage as u16 = 15
var total as u16 = 0
```

A declaration states a name, an exact type and an initial value. `u16` is
an unsigned sixteen-bit integer: two bytes, holding 0 through 65,535.
There is no untyped or dynamically typed variable, and the type is part
of the declaration rather than inferred; Chapter 2 examines the integer
types in detail.

Because these declarations stand at module level, outside any subroutine,
their storage is static. During the whole-program build, the compiler
reserves two bytes for each variable and assigns each an address; the six
bytes exist before `main` begins, with the initial values installed. No
allocation takes place while the program runs. The declarations state how
much storage the program needs, and execution changes only the values
held in it — a rule that persists for arrays and records: their
maximum sizes, too, are stated in the source.

## Subroutines and the entry point

An ordinary source file is a module: a sequence of declarations, such as
these three variables and two subroutines. Executable statements appear
only inside subroutines.

A module is checked strictly top to bottom: every name must be declared
before the line that uses it. (Chapter 10 explains the one declared
exception: a routine header stated ahead of its body.) The three
variables stand above `addPostage` because its statement uses them, and
`addPostage` stands above `main` because `main` calls it. The same rule
orders every program in this book, and a module is traced the same way
it is checked: from the top.

```lanternfly
sub addPostage()
    total = subtotal + postage
end
```

`sub` begins a subroutine, with parentheses even when there are no
parameters, and `end` closes it. Indentation is convention: the words
`sub` and `end` define the block, not the spaces. Chapter 10 covers
parameters and results.

Whenever a code fence in this book shows a statement or expression on
its own, it is an excerpt from inside a routine. The complete, correctly
ordered module always appears in the chapter listing.

The entry point is explicit. An executable build selects one
parameter-free, result-free, source-defined and non-failable subroutine
as the entry; `main` is a familiar convention, not a keyword, and any
suitable name serves. By the
time the entry begins, the module variables hold their initial values.

## Following the assignment

```lanternfly
total = subtotal + postage
```

At the beginning of a statement, `=` means assignment: identify the place
named on the left, evaluate the expression on the right, then store the
value in that place. The order matters once destinations involve work of
their own, such as an index expression; the store always comes last, so
the calculation completes before the destination changes.

Tracing by hand: 120 from `subtotal`, 15 from `postage`, their `u16` sum
135 written to the two bytes reserved for `total`, replacing 0. Neither
input changes, because neither appears on the left of the assignment.

| Variable   | Before | After |
| ---------- | -----: | ----: |
| `subtotal` |    120 |   120 |
| `postage`  |     15 |    15 |
| `total`    |      0 |   135 |

Comments begin with `//` and continue to the end of the line:

```lanternfly
// Charges are stored in whole cents.
var subtotal as u16 = 120
```

The comment records a fact the code cannot state: whether 120 means
$1.20, $120 or something else.

## A result without a screen

This first program leaves its result in memory instead of printing it. On
a desktop computer, a language runtime can usually assume a terminal or
window. The small computers Lanternfly targets share no standard output
device: one machine has a serial port, another a memory-mapped display,
another only a monitor routine in ROM. Lanternfly reaches such facilities
through typed services — portable text output in Chapter 13, a
platform's own machine services in Chapter 16.
Printing 135 would also mean converting the binary integer into the
character bytes `1`, `3` and `5`. This program stores its answer instead,
and inspection tools can read the bytes assigned to `total` by name,
because the compiler keeps symbol information alongside the generated
program.

The complete source is available as the
[chapter listing](/lanternfly-book/book1/code/01-first-program.txt).

## The build

The compiler turns this module into a runnable program: it checks the
declarations, the call and the assignment, chooses an address for each
variable, and emits Z80 machine code. When `main` returns, the target
performs its normal termination.

## Exercises

1. Suppose `main` called `addPostage()` twice. What does `total` contain
   at the end, and why is it not 270?

Answer: 135 — `addPostage` recomputes the sum from `subtotal` and
`postage`, which never change, and the assignment stores rather than
accumulates.

## Chapter summary

- A declaration states a name, an exact type and an initial value;
  module-level storage is static, reserved and initialized before entry.
- Executable statements appear only inside subroutines, and every name
  is declared before the line that uses it.
- The entry is a parameter-free, result-free, source-defined and
  non-failable subroutine named in the build manifest; `main` is a
  convention, not a keyword.
- At the start of a statement, `=` assigns: the right side is evaluated,
  then the value is stored, and only the destination changes.
- A comment records a fact the code cannot state.
