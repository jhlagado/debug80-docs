---
layout: default
title: "Subroutines"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 9
---

# Subroutines

Chapter 1 declared a parameter-free subroutine. A routine that must add an
amount chosen by its caller needs an input. Parameters let one body work with
values supplied afresh at each call:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end

addScore(10)
```

`amount` receives its own scalar value for each invocation. Call
`addScore(10)` from the coin routine and `addScore(50)` from the bonus
routine, and the same three lines serve both — the routine describes
the transaction once, and the callers supply the particulars.

Each routine defines an interface: parameters supply values that vary by call,
an optional result carries a value back, locals hold private working state and
module variables provide shared state. In `addScore`, `amount` varies by call
while `score` is the one shared destination.

## One declaration form

Every user routine begins with `sub`. Lanternfly distinguishes an action from
a value-producing routine through the presence of a result type rather than a
second declaration keyword. A subroutine that performs an action omits the
result type:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end
```

The parameter list names each input and its type, in the same
`name as Type` shape as variable, constant and field declarations. A parameter
is a declaration whose initial value arrives from outside. A call supplies
arguments in the same order:

```lanternfly
addScore(bonus)
```

Arguments are evaluated from left to right before the invocation begins. When
two argument expressions both have effects, that order is part of the
language and remains the same on every target.

## Returning a value

A trailing `as Type` declares a result:

```lanternfly
sub atMost(input as i16, maximum as i16) as i16
    if input > maximum then
        return maximum
    end

    return input
end
```

`atMost` applies an upper bound. Its name and parameter names expose that
single rule; a full clamp would also accept and enforce a lower bound.

The caller uses the result in an expression, exactly where the
unclamped value would have gone:

```lanternfly
score = atMost(score + bonus, 1000)
```

In this line, `score + bonus` computes the first argument and `1000` supplies
the second. The call transforms those inputs, and the assignment stores the
result under Chapter 2's rules. Calls
nest in expressions because a call with a result *is* an expression —
`atMost(...)` stands wherever an `i16` may stand.

Every reachable path in a result-bearing subroutine returns a compatible
integer, Boolean, opaque-address or typed-reference scalar. Returning an array
or record by value is deferred. A path that reaches `end` without a result is
a compile error.

A result-free call stands alone as a statement, and a result-bearing
call can also stand alone when its result is intentionally
discarded.

## Scalar locals

Chapter 5 introduced a loop-control local. More generally, parameters carry
values in and locals provide private working storage:

```lanternfly
sub distanceSquared(x as i16, y as i16) as u32
    var xMagnitude as u32 = abs(x)
    var yMagnitude as u32 = abs(y)
    var xSquared as u32
    var ySquared as u32

    xSquared = xMagnitude * xMagnitude
    ySquared = yMagnitude * yMagnitude
    return xSquared + ySquared
end
```

Local declarations appear before executable statements and have
routine scope, so the top of a routine lists its private storage. Each
invocation receives its own scalar values, and code outside the routine cannot
name or modify them.

An omitted initializer starts an owned scalar local with zero bits. A
reference local requires a valid initializer and cannot temporarily point
nowhere.

A backend may place locals in registers, stack slots or proven-safe static
scratch. Whatever lowering it chooses, source semantics provide independent
values for overlapping invocations.

## Aggregate parameters

Scalars pass by value. A private aggregate parameter instead aliases the
caller's existing storage:

```lanternfly
sub clearRow(row as u8[8])
    var index as i16

    for index = 0 to count(row) - 1
        row[index] = 0
    end
end
```

The call passes a compatible storage path:

```lanternfly
clearRow(selectedRow)
```

The caller selects the storage and updating `row[index]` updates that storage.
The source semantics do not copy the eight-byte array. A backend may choose
its private aggregate carrier; a future generated report can expose that
physical choice.

An aggregate parameter is a writable alias, so its argument must be a
compatible caller-owned storage path or typed reference. A general expression
or temporary aggregate initializer has no writable storage identity and is
rejected.

Chapter 10 defines modules and exports. For an aggregate parameter in a public
interface, the reference class must be explicit:

```lanternfly
export sub clearSharedRow(row as near ref (u8[8]))
    var index as i16

    for index = 0 to count(row) - 1
        row[index] = 0
    end
end
```

Inside one compilation, the backend selects a private aggregate carrier
according to its ABI and lowering rules. A public interface states `near ref`
explicitly so its calling convention does not depend on a backend default.

## Early return

A result-free subroutine may leave early with bare `return`:

```lanternfly
sub updateActor(actor as Actor)
    if not actor.active then
        return
    end

    actor.x = actor.x + actor.velocityX
end
```

This early return handles the inactive case before the position update. The
remaining work stays outside another level of conditional nesting. Reaching
the closing `end` also returns from a result-free subroutine.

## Recursion and target profiles

A routine that calls itself needs an independent frame for every active call.
A recursion-capable target profile defines its frame layout, reports frame
size and states the configured stack bounds under which recursive calls are
permitted. A profile that uses fixed scratch rejects direct or mutual call
cycles because a second frame would overwrite the first.

The routine body has the same source meaning under either profile; the profile
determines whether it can supply the required independent storage.

## Example

The [chapter listing](/lanternfly-book/book1/code/09-routines.txt)
contains an action, two result-bearing subroutines and an aggregate parameter.
With a score of 980 and a bonus of 50,
`atMost(score + bonus, 1000)` returns 1000. With a bonus of 10 it returns
990. These two traces cover both return paths.
