---
layout: default
title: "A First Program"
parent: "Programming Nucleus"
nav_order: 1
---

# A First Program

A price calculation needs three stored values: the subtotal, the postage and
the total. The program below adds the first two values and stores the result in
the third.

```nucleus
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

At startup, the three variables receive the values 120, 15 and 0. Execution
then enters `main`, which calls `addPostage`. That call creates `amountDue`,
adds the subtotal and postage, then copies 135 into `total`. The call returns,
`main` reaches its `end` and the program finishes. The local `amountDue` is
gone, but the program variable `total` still contains 135.

The three declarations at the top allocate **program variables**. Their values
exist for the complete run. Each declaration gives the variable a name, a type
and an initial value:

```nucleus
var subtotal as u16 = 120
```

`u16` is an unsigned integer type with values from 0 through 65,535. The next
chapter develops the complete scalar type model. The three `u16` variables can
hold 120, 15 and their sum of 135.

## Routines organise execution

Program-variable declarations allocate storage but perform no source-level
steps. Execution begins in the routine named `main`:

```nucleus
sub main()
    addPostage()
end
```

Every Nucleus program defines exactly one `main` routine. Its name and empty
parameter list are fixed. Neither routine has an `as Type` result clause, so
both are **result-free**. Here, `main` calls `addPostage`, waits for that call to
return and then reaches its own `end`. Reaching the end of a result-free
routine returns successfully. Successful completion of `main` ends the
program.

The parentheses belong to both the routine definition and the call. They show
that `main` and `addPostage` take no arguments.

## A local calculation

`addPostage` declares one **local variable**:

```nucleus
var amountDue as u16
```

A local variable belongs to one call. Its lifetime runs from its declaration to
the end of that call. Nucleus places local declarations at the start of the
routine body, before its statements. An omitted initializer gives a scalar
local its zero value, so `amountDue` begins at zero each time `addPostage` is
called.

The first assignment calculates the amount due:

```nucleus
amountDue = subtotal + postage
```

For this simple-name destination, the compiler evaluates the expression on the
right and copies its result into `amountDue`. A later chapter gives the full
evaluation rule for indexed and field destinations. The second assignment
copies the local value into the program variable `total`:

```nucleus
total = amountDue
```

The complete state change is small enough to trace directly:

| Point                       | `subtotal` | `postage` | `amountDue` | `total` |
| --------------------------- | ---------: | --------: | ----------: | ------: |
| Before `addPostage`         |        120 |        15 |           — |       0 |
| After the first assignment  |        120 |        15 |         135 |       0 |
| After the second assignment |        120 |        15 |         135 |     135 |
| After the call returns      |        120 |        15 |           — |     135 |

The dash marks a time when the local variable has no active call storage. The
program variables remain, so the final total is still 135 after `addPostage`
returns. This program writes no screen output: its result is the new value in
`total`, as shown by the state trace above.

## Source order

Nucleus processes declarations from top to bottom. A name becomes available
after its declaration has been checked. The three program variables therefore
appear before `addPostage`, and `addPostage` appears before the call in `main`.

The same rule applies to constants, variables and record types. A later chapter
introduces `forward sub` for routines that need an earlier declaration.

Indentation visually separates the routine bodies. A statement ends at its
logical newline. The `end` line closes the routine body.

## Building the program

From the directory containing the companion `examples` folder, this command
compiles the program:

```sh
nucleus build --quiet -o build/postage.nobj examples/01-postage.nu
```

The compiler creates `build/postage.nobj`. This file contains the compiled
program and its placement information. Chapter 15 uses an explicit target
profile to produce a launchable Intel HEX file and a D8 source map for Debug80.

The complete companion source is available here:

<<< @/nucleus/book1/examples/01-postage.nu{nucleus}

## Try one change

What happens if `main` calls `addPostage()` twice? The final total is still 135:
each call calculates `subtotal + postage` and assigns that value to `total`.
It does not add another 135 to the value already there.

To accumulate both calls, the second assignment would need to read the old
total:

```nucleus
total = total + amountDue
```

With two calls, that version finishes with `total` equal to 270.

## Summary

- Program variables retain values for the complete run.
- Execution begins in the single `main()` routine.
- Scalar locals exist during one routine call and begin with their declared or
  zero initial value.
- Assignment to a simple variable copies the right-side value into that
  variable.
- Declarations precede their uses.

The exact rules appear in the specification chapters on
[program structure](../language/04-program-and-compilation-structure.md),
[storage and lifetime](../language/07-storage-values-and-lifetime.md),
[declarations](../language/08-constants-and-declarations.md),
[statements](../language/10-statements.md) and
[routines](../language/13-routines-and-calls.md).
