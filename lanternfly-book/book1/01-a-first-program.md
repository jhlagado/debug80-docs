---
layout: default
title: "Your First Lanternfly Program"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 1
---

# Your First Lanternfly Program

Lanternfly is meant for many kinds of work: calculations, text processing,
tools, device control and games. We will begin with a calculation because you
can follow every value from the start of the program to the end.

Suppose an order has a subtotal of 120 and a postage charge of 15. We want to
calculate the amount due. Here is the complete Lanternfly source:

```lanternfly
var subtotal as u16 = 120
var postage as u16 = 15
var total as u16 = 0

sub main()
    total = subtotal + postage
end
```

Before `main` begins, `subtotal` contains 120, `postage` contains 15 and
`total` contains 0. After the one statement inside `main` has run, the first
two values are unchanged and `total` contains 135.

By tracing this modest calculation, we can concentrate on three ideas: static
storage, an entry point and a statement that changes a stored value. You will
still use all three when you write programs with thousands of statements.

## Three places in memory

The first three lines declare variables:

```lanternfly
var subtotal as u16 = 120
var postage as u16 = 15
var total as u16 = 0
```

You declare a variable when you need a named place to store a value. The
declaration begins with `var`; you then write the name, the type and an initial
value. For the first variable, we chose the name `subtotal`, the type `u16` and
the initial value 120.

`u16` means an unsigned sixteen-bit integer. It can hold a whole number from 0
through 65,535 and occupies two bytes. We will examine Lanternfly's integer
types in detail in Chapter 2. All three values in this program fit comfortably
in `u16`.

Because we wrote these declarations at module level, outside any subroutine,
the compiler will give them static storage. During a whole-program build, it
will reserve two bytes for each variable and assign each one an address. The
six bytes already exist when execution reaches `main`, with the three initial
values installed.

No allocation takes place while this program runs. We decided how much storage
it needs when we wrote the declarations. When you later work with arrays and
records, you will still state their maximum size in the source and then change
the values held in that storage during execution.

## The entry point

In an ordinary Lanternfly source file, you write a module consisting of
declarations such as the three variables and the subroutine below. Executable
statements do not sit loose between those declarations; you put them inside a
subroutine.

```lanternfly
sub main()
    total = subtotal + postage
end
```

To begin a subroutine declaration, write `sub` followed by its name and a pair
of parentheses. No parameter names appear between the parentheses in `main()`,
so this subroutine accepts no arguments. The final `end` closes the subroutine.

We indent the body so that its boundary is visible, but the spaces themselves
do not define it. The parser treats indentation as whitespace and uses words
such as `sub` and `end` to recognise the block.

When you configure an executable build, you select one parameter-free
subroutine with no result as the entry. We use `main` for that job because the
convention is familiar, but `main` is not a special Lanternfly keyword. You may
choose another suitable name for a project.

By the time the selected entry begins, the module variables have their initial
values. The processor normally executes statements inside the entry from top
to bottom.

## Following the assignment

Here is that statement on its own:

```lanternfly
total = subtotal + postage
```

At the beginning of a statement, `=` means assignment: identify the place
named on the left, evaluate the expression on the right, then store the value
in that place. The order matters once destinations involve work of their own,
such as an index expression; the store always comes last, so Lanternfly
completes the calculation before it changes the destination.

To follow the assignment by hand, we begin with 120 from `subtotal` and 15 from
`postage`. We add the two `u16` values to obtain 135, then write 135 to the two
bytes reserved for `total`, replacing the previous value of 0. Neither input
variable changes because neither one appears on the left of the assignment.

We can account for all three variables before and after the statement:

| Variable | Before | After |
| --- | ---: | ---: |
| `subtotal` | 120 | 120 |
| `postage` | 15 | 15 |
| `total` | 0 | 135 |

In mathematics, an equals sign states that two expressions have the same
value. Assignment has a direction. A useful spoken reading is “put
`subtotal + postage` into `total`”: the left side chooses where the value
will go, the right side supplies it, and the store completes the statement.

Lanternfly comments begin with `//` and continue to the end of the line. A
comment can record a fact that a future programmer needs but cannot derive
from the calculation:

```lanternfly
// Charges are stored in whole cents.
var subtotal as u16 = 120
```

Repeating “declare the subtotal” in the comment would add no information. With
the comment above, another programmer knows whether 120 means $1.20, $120 or
something else.

## A result without a screen

This first program leaves its result in memory instead of printing it. On a
desktop computer, a language runtime can usually assume the presence of a
terminal or window. The small computers Lanternfly targets do not share one
standard output device. One machine may have a serial port, another a memory-
mapped display and another only a monitor routine supplied in ROM.

You make facilities like these available to Lanternfly by declaring machine
services. Later we will give such a service a typed name and call it like an
ordinary subroutine. Adding output here would require us to explain that
boundary before we have established how an ordinary assignment works.

Printing 135 also involves more than sending the value of `total` to a screen.
We would have to convert the binary integer into the character bytes `1`, `3`
and `5`, then deliver those bytes to the target's output routine. By storing
the numeric result, we can postpone those two separate jobs until we are ready
to study them.

A monitor or debugger can inspect the bytes assigned to `total`. The planned
toolchain will also retain symbol information so that programmers can work
with the name `total` rather than look up its address by hand.

The complete source is available as the
[chapter listing](/lanternfly-book/book1/code/01-first-program.txt).

## From Lanternfly to Z80 code

The Z80 cannot execute Lanternfly source directly. The planned compiler and
AZM assembler divide the translation into two stages:

```text
order.lf
    → Lanternfly compiler
    → order.asm
    → AZM
    → order.bin
```

The Lanternfly compiler will check the declarations and the assignment, choose
addresses for the three variables and emit Z80 assembly. AZM will resolve the
assembly labels and encode the instructions and data as bytes. The target
computer can then load and execute `order.bin`.

The toolchain will keep the generated assembly available for inspection. When
an address, instruction choice or cycle count becomes relevant, you can
examine what the compiler asked AZM to assemble. For everyday program logic,
you can work with names, types, expressions and subroutines instead of
managing registers and addresses for every operation.

When the entry returns, the target profile performs its normal termination
operation. In the next chapter, we will choose integer types deliberately
rather than accept `u16` on trust.
