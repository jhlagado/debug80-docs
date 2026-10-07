---
title: "Coming and Going"
parent: "Programming Basie"
nav_order: 3
nav_exclude: true
search_exclude: true
---

# Coming and Going

The postage calculation in Chapter 1 worked for one order. A shop has many orders, and writing out the same addition for each of them would be tedious and easy to get wrong. A routine holds the calculation once, and the program calls it for each order. While it runs, the routine needs storage for its own working values. Writes to that storage must leave the caller's variables alone.

## A routine for the calculation

```basie
sub amountDue(amount as u16, shipping as u16) as u16
    var due as u16 = amount + shipping
    amount = 0
    return due
end
```

`sub` begins the declaration and `amountDue` is the routine's name. `amount` and `shipping` are its **parameters**, each with a type. The `as u16` after the closing parenthesis is the type of the value the routine returns.

A call supplies one **argument** for each parameter, in order:

```basie
total = amountDue(subtotal, postage)
```

The call copies `subtotal` into `amount` and `postage` into `shipping`, runs the body and returns the value of `due`. The assignment stores that value in `total`.

A scalar parameter holds a copy of its argument, so the routine can assign to it without touching the caller's variable. A real routine would have no reason to clear `amount`. This one does it to show that `subtotal` keeps its value, and the complete program checks that with an assertion:

<<< @/basie/book1/examples/CALLS.BSI{basie}

The first call returns 135 and leaves `subtotal` at 120. The second call passes the constant 200 directly and returns 215.

## Storage for each call

Each call gets fresh storage for its parameters and local variables, known as an **activation**. For `amountDue` it holds `amount`, `shipping` and `due`. The second call in `CALLS.BSI` gets a new activation that holds none of the first call's values. If one routine calls another, both activations exist until the inner routine returns.

![Program storage persists while a routine's parameters and locals exist during its call.](../../assets/images/basie-book/book1/call-lifetime.svg)

Program variables such as `subtotal` and `total` last for the whole run. An activation lasts only for its call. The returned value is copied to the caller before the activation ends, which is why it survives the call.

Activations are held on the Z80's stack, which grows on each call and shrinks on each return. You don't manage the stack yourself, because the compiler works out how much each routine needs. Chapter 13 explains how Basie stops the stack from growing into other storage.

## Scope and lifetime

A name's **scope** is the part of the source where the name can be used. The scope of `due` runs from its declaration to the end of the block that contains it, which here is the end of the routine.

A piece of storage's **lifetime** is the part of the run during which it exists. `due` is created and given its initial value when execution reaches its declaration. Its lifetime ends when execution leaves the block by any exit, including `end` and `return`. A local declared without an initial value starts at zero or its type's equivalent.

Scope belongs to the source text and lifetime belongs to the run. For a local the two line up, which makes them easy to confuse. Chapter 4 introduces ways to reach storage through other names, and from then on they often differ.

## One name, one meaning

The parameters are called `amount` and `shipping` because `subtotal` and `postage` are already in use. A local or parameter can't reuse a name that is visible where it is declared. That includes the names of program variables, constants and built-in services. Many languages let an inner name hide an outer one, but in Basie every use of a name refers to exactly one declaration.

Names must also be declared before they are used. The compiler reads the source once from top to bottom, so a routine must appear above any routine that calls it. Chapter 13 covers the exception for routines that call each other.

## Returning a result

A routine with a result type must return a value on every path through its body. The compiler rejects a routine whose closing `end` can be reached without a `return`. A routine with no result type, such as `main`, can run to its `end` or use `return` on its own to leave early.

A returned number is a copy, so the caller can always use it safely. Returning access to the routine's own local storage would not be safe, because that storage ends when the routine returns. The caller would then read whatever a later call had written to that part of the stack. In C this is the classic dangling pointer. Basie rejects it at compile time with the message "a result can't refer to a local". Chapter 4 introduces the records and access that make the mistake possible. Chapter 9 shows routines that return access to records that outlive the call.

## The order of arguments

Basie evaluates a call's arguments from left to right and finishes each one before starting the next. The order matters only when an argument has a side effect, such as a call that assigns to a variable:

<<< @/basie/book1/examples/10-routines.BSI{basie}

`mark` appends a digit to `sequence` and returns the digit. In `choose(mark(2), mark(7))` the left argument runs first and sets `sequence` to 2. The right argument then sets it to 27. `choose` returns the larger argument, 7, so `observed` ends as 7 plus 27, or 34. Evaluated right to left, `sequence` would be 72 and the assertion would fail.

## Things to try

Add a third call that charges 80 with postage of 15 and assert that the result is 95. The routine handles the new order with no new program variables.

Then move `amount = 0` above the declaration of `due`. The routine now adds zero to the shipping and returns 15, so the first assertion fails. `subtotal` is still 120, because clearing the copy earlier alters the result but can't reach the caller's variable.

## Summary

- A routine's parameters receive copies of scalar arguments, and an assignment to a parameter affects only the copy.
- Each call gets its own activation holding its parameters and locals. The activation ends when the call returns.
- Scope is where a name can be used in the source. Lifetime is when its storage exists during the run.
- A local or parameter can't reuse a name that is already visible, and every name is declared before it is used.
- A routine with a result must return a value on every path. A returned scalar is a copy, so it survives the end of the call.
- A routine can't return access to its own local storage. The compiler rejects it.
- Arguments are evaluated from left to right.
