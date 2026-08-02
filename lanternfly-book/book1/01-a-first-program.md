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
    var amountDue as u16

    amountDue = subtotal + postage
    total = amountDue
end

sub main()
    addPostage()
end
```

Before `main` begins, `subtotal` contains 120, `postage` contains 15 and
`total` contains 0. Execution starts in `main`, whose one statement calls
`addPostage`. On entry to `addPostage`, `amountDue` contains zero. The first
assignment stores 135 there, and the second copies 135 into `total`. The first
two module variables remain unchanged.

This program contains module variables, a local variable, an entry point and
assignments that change stored values.

## Module variables

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

## Subroutines and local variables

An ordinary source file is a module: a sequence of declarations, such as
these three variables and two subroutines. Executable statements appear
only inside subroutines.

A module is checked strictly top to bottom: every name must be declared
before the line that uses it. Chapter 10 explains the permitted forward
reference: `forward sub` states a routine header before its body. The three
variables stand above `addPostage` because its statement uses them, and
`addPostage` stands above `main` because `main` calls it. The same rule
orders every program in this book, and a module is traced the same way
it is checked: from the top.

```lanternfly
sub addPostage()
    var amountDue as u16

    amountDue = subtotal + postage
    total = amountDue
end
```

`sub` begins a subroutine, with parentheses even when there are no
parameters, and `end` closes it. Indentation is convention: the words
`sub` and `end` define the block, not the spaces. Chapter 10 covers
parameters and results.

A declaration inside a subroutine creates a local variable. `amountDue` can be
named only inside `addPostage`, and each invocation has its own value. Local
declarations appear before the executable statements. This `u16` local has no
initializer, so it starts with zero bits; the first assignment replaces that
zero before any expression reads it. An initializer may instead supply the
starting value:

```lanternfly
var amountDue as u16 = subtotal + postage
```

The initializer runs on every call. Chapter 10 explains the complete rules for
local initializers, lifetime and overlapping calls.

Whenever a code fence in this book shows a statement or expression on
its own, it is an excerpt from inside a routine. The complete, correctly
ordered module always appears in the chapter listing.

## The entry point

An executable build starts with `main` in its root module unless the build
manifest names another entry. `main` is not a keyword, but it is the default
entry name. The selected subroutine is source-defined and has no parameters or
result. Chapter 12 explains how a program receives launcher arguments, and
Chapter 14 explains how an entry can report failure. By the time the entry
begins, the module variables hold their initial values.

## Following the assignment

```lanternfly
amountDue = subtotal + postage
total = amountDue
```

At the beginning of a statement, `=` assigns: evaluate the expression on the
right, then store its value in the place named on the left. The first statement
stores 135 in `amountDue`; the second stores the same value in `total`.
`subtotal` and `postage` remain unchanged because neither appears on the left.
`amountDue` contains 135 until `addPostage` returns. The module variables finish
with these values:

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

The value `120` alone has no unit. The comment identifies the unit as cents,
so `120` represents $1.20.

## A result without a screen

This program leaves its result in `total`. Small computers provide different
output devices. Chapter 13 specifies portable text output through typed
services, and Chapter 16 covers platform services. Printing 135 would also
require conversion from an integer to the character bytes `1`, `3` and `5`;
for now, the stored value is the answer.

## Complete program

<<< @/public/lanternfly-book/book1/code/01-first-program.txt{lanternfly}

The source is also available as
[01-first-program.txt](/lanternfly-book/book1/code/01-first-program.txt).

## The build

The compiler turns this module into a runnable program: it checks the
declarations, the call and the assignments, chooses storage for each variable
and emits Z80 machine code. When `main` returns, the target reports
successful termination. Chapter 14 adds unsuccessful termination through
`fail`.

## Exercises

1. Suppose `main` called `addPostage()` twice. What does `total` contain
   at the end, and why is it not 270?

Answer: 135 — `addPostage` recomputes the sum from `subtotal` and
`postage`, which never change, and the assignment stores rather than
accumulates.

## Chapter summary

- A variable declaration states a name and an exact type; an initializer may
  also state its first value. Module-level storage is static and exists before
  entry.
- Executable statements appear only inside subroutines. Scalar locals are
  declared before those statements and can be named only within their
  subroutine.
- Every name is declared before the line that uses it.
- An executable starts with the root module's `main` unless its manifest names
  another parameter-free, result-free, source-defined entry.
- At the start of a statement, `=` assigns: the right side is evaluated,
  then the value is stored, and only the destination changes.
- A comment can identify units and other facts absent from declarations.
