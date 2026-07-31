---
layout: default
title: "A Program Changes Stored Data"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
---

# A Program Changes Stored Data

Every program answers two questions, and answers them in that order. What
data must it represent? What algorithm operates on that data? A payroll
system represents employees and hours and computes wages. A game represents
positions and scores and computes the next frame. A thermostat represents a
temperature and a setpoint and computes a switch. The data comes first,
because until the facts have a shape, there is nothing for the algorithm to
transform.

This book teaches Lanternfly by asking those two questions of one program
after another. Lanternfly is a statically typed structured BASIC for
fixed-memory systems: source that reads in short English words, compiled
once — whole — into a program for a small machine such as a Z80. There is
no interpreter reading the source while it runs: a declaration corresponds
to storage with a size you can state, and a statement corresponds to
instructions a listing will show you. On a machine with sixty-five thousand
bytes of memory and a frame deadline, both properties matter, and this book
keeps both visible.

The first program is an invoice. Its data: a running total and a count of
items, both starting at nothing. Its algorithm: add three fixed prices, one
after another, counting as it goes.

```lanternfly
// Fixed facts: prices in whole pence.
const applePrice as u16 = 120
const breadPrice as u16 = 95
const milkPrice as u16 = 78

// Changing facts: the invoice's state.
var total as u16 = 0
var itemCount as u8 = 0

sub main()
    total = total + applePrice
    itemCount = itemCount + 1

    total = total + breadPrice
    itemCount = itemCount + 1

    total = total + milkPrice
    itemCount = itemCount + 1
end
```

Three fixed prices, two changing facts, one routine that runs from top to
bottom.

## Choosing the representation

The program's first decisions happen before any statement: the shape of
each fact. Lanternfly makes the decisions visible, because every
declaration names a type, and a type is a recorded choice about size and
range.

The total is money. Money in a program is best kept in whole small units —
pence here — because a whole number of pence is exact where fractions of a
pound invite rounding trouble. How large can this total grow? A `u16`
holds 0 through 65,535: over six hundred pounds of groceries, unsigned
because an invoice total has no business being negative. The item count is
smaller still: `u8` holds 0 through 255, and an invoice with 256 lines is
a different program's problem. So the two facts get two different types,
each one a sentence about the fact it holds: *this value is never
negative, and never larger than this*.

The prices are also facts, but of a different kind: they do not change
while the program runs. That difference is worth its own keyword.

## Fixed facts: `const`

```lanternfly
const applePrice as u16 = 120
```

`const` declares a compile-time value. `applePrice` names it, `as u16`
types it, and `= 120` supplies it. From here on the source reads
`applePrice` wherever that price appears, and the day the shop changes the
price, one line changes with it.

A scalar constant normally occupies no storage at all. The compiler folds
the value into the places that use it, so the three price constants cost
the running program nothing — a name in the source, a number in the
generated instructions, no byte of memory in between. The distinction
between the two declaration keywords is exactly the distinction between
the two kinds of fact: `const` for a fact fixed before the program runs,
`var` for a fact that changes while it runs.

## Changing facts: `var`

```lanternfly
var total as u16 = 0
var itemCount as u8 = 0
```

`var` declares storage. These are module-level declarations, so each owns
static storage: a fixed place in the machine's memory, chosen by the
compiler, existing for the whole run. `total` occupies two bytes there and
`itemCount` one — three bytes of state, which is the entire memory cost of
this program's data.

The `= 0` initializers are installed before the program's entry point
begins, so no statement ever sees either variable in an undefined state.
The rule behind this is broader and worth meeting now: all module storage
is allocated, and every static initializer installed, before an executable
program's entry runs.

## The entry point

```lanternfly
sub main()
    ...
end
```

`sub` declares a subroutine — a named sequence of statements — and this
one is special only by appointment: the build names one parameterless,
result-free routine as the program's entry, and `main` is this program's.
Nothing in the source marks it; the build manifest does the naming, the
way a linker script names an entry symbol in an assembly project. When
`main` returns, the program is over: control passes to the target's
program-termination service, and what remains is the storage the program
leaves behind.

That frame — storage installed, entry runs, termination service — is the
whole life of a Lanternfly program, and it gives this book its standard of
proof. A program's observable result is the final state of its storage
(later chapters add services, whose calls are observable too). The
invoice program's answer is not printed anywhere; it is the 293 sitting
in `total` when `main` returns. Printing needs the machine's help, and
the machine's help is Chapter 15's business; every program before then
proves itself through its final storage, which is also exactly how the
language's own conformance fixtures are judged.

## Assignment, in order

```lanternfly
total = total + applePrice
```

New programmers sometimes stall on this shape, and they are right to
stall: as algebra it is false. No number equals itself plus 120. The line
makes sense because it is not an equation but an instruction with a fixed
order of events, and the order is part of the language.

An assignment names a destination on the left of `=`, and an expression
on the right. The destination is worked out first — trivial here, since
`total` names one fixed spot, but in later chapters a destination like
`log[nextIndex()]` involves real work, and the language promises that
work happens before the right-hand side is touched. Then the right-hand
expression is evaluated using the values storage holds *now*. Then the
result is stored. Reading the line as "the new `total` is the old `total`
plus the apple's price" dissolves the algebra problem: the two mentions
of `total` name the same storage at two moments in time, old value on the
right, new value on the left.

The count works the same way:

```lanternfly
itemCount = itemCount + 1
```

`itemCount` is a `u8`, and byte arithmetic in Lanternfly widens: the sum
has more room than a byte, and the result is narrowed back when it is
stored. Chapter 3 gives
the rules; what matters now is the silence. An update that starts from a
variable's own type and returns to it is the ordinary arithmetic of that
variable, and the compiler treats it as such, without a warning. The
warnings are saved for conversions that genuinely lose something —
Chapter 2 shows those — so that when this compiler does speak up, the
message is worth reading.

## The program as a story

Statements execute in source order. `main` has six, and the program is
therefore a story with a beginning, six events and an end — no branches
yet, no repetition, just sequence, the oldest control structure.

Because the story is finite and the state is three bytes, the whole run
fits in a small table:

| after                    | total | itemCount |
| ------------------------ | ----: | --------: |
| entry                    |     0 |         0 |
| apple added and counted  |   120 |         1 |
| bread added and counted  |   215 |         2 |
| milk added and counted   |   293 |         3 |

This table is a hand trace: the machine's run, performed on paper. We
will make tables like this one throughout the book, and the final row is
always the program's answer — here, total 293, three items.

## Memory and instructions

Memory, on the machines this book has in mind, is a single long row of
numbered byte-sized cells — on a Z80, exactly 65,536 of them, each
holding a value from 0 to 255, each with a number called its address.
`total` is two of those cells at an address the compiler chose;
`itemCount` is one more. There is no label in the machine, no record of
what the bytes mean; meaning lives in the program.

One accumulation line compiles to a handful of instructions in the shape
of load, add, store: bring the two bytes of `total` into a register pair,
add the price, put the bytes back. The count's line is shorter still.
Nothing else is generated: the program contains exactly what the source
asked for, and the generated listing shows each line's instructions
against the line that produced them. This program is three bytes of state
and a few dozen bytes of code, and both numbers can be read off the
build's own artifacts.

## The listing

The [chapter listing](/lanternfly-book/book1/code/01-invoice.txt) holds
the complete program with its trace. The trace above was worked from that
listing; reproduced on paper, it takes five minutes.

The two questions have their first answers. Data: two typed cells and
three folded constants. Algorithm: six statements in a straight line.
Chapter 2 stays with the first question and goes deeper: where the types
come from, what each one costs, and what the machine's bytes can and
cannot hold.
