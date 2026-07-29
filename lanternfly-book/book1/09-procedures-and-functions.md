---
layout: default
title: "Subroutines"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 9
---

# Subroutines

Parameters let one subroutine work with values supplied by each caller:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end

addScore(10)
```

`amount` receives a fresh scalar value for the invocation.

## One declaration form

Every user routine begins with `sub`. A subroutine that performs an action
omits a result type:

```lanternfly
sub addScore(amount as i16)
    score = score + amount
end
```

The parameter list names each input and its type. A call supplies arguments in
the same order:

```lanternfly
addScore(bonus)
```

Arguments are evaluated from left to right before the invocation begins.

## Returning a value

A trailing `as Type` declares a result:

```lanternfly
sub limited(value as i16, limit as i16) as i16
    if value > limit then
        return limit
    end

    return value
end
```

The caller can use the result in an expression:

```lanternfly
score = limited(score + bonus, 1000)
```

Every reachable path in a result-bearing subroutine returns a compatible
value. A result-free call can stand alone as a statement. A result-bearing call
can also stand alone when its result is intentionally discarded.

## Scalar locals

Local scalar storage belongs to one invocation:

```lanternfly
sub distanceSquared(x as i16, y as i16) as i32
    var xSquared as i32
    var ySquared as i32

    xSquared = i32(x) * i32(x)
    ySquared = i32(y) * i32(y)
    return xSquared + ySquared
end
```

Local declarations appear before executable statements and have routine scope.
An omitted initializer starts an owned scalar local with zero bits. Reference
locals require valid initializers.

The backend can place locals in registers, stack slots or proven-safe static
scratch. Source semantics still provide fresh values for overlapping
invocations.

## Aggregate parameters

A private aggregate parameter aliases the caller's existing storage:

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
clearRow(boardRows[selectedRow])
```

Updating `row[index]` updates the selected row in the caller. A temporary array
initializer cannot serve as a writable aggregate argument.

An exported routine states the reference class:

```lanternfly
export sub clearSharedRow(row as near ref (u8[8]))
    ...
end
```

The explicit class makes the public calling convention independent of a
backend default.

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

Reaching the closing `end` also returns from a result-free subroutine.

## Recursion and target profiles

Recursive calls need independent frames. A recursion-capable target profile
defines its stack rules and reports frame costs. A profile that uses fixed
scratch rejects direct or mutual call cycles at compile time.

The routine body keeps the same source meaning under either profile. The
profile determines whether it can supply the required storage.

## Example

The [chapter listing](/lanternfly-book/book1/code/09-routines.txt) contains an
action, two result-bearing subroutines and an aggregate parameter.

## Summary

- `sub` declares routines with and without results.
- Parameters receive arguments from left to right.
- `return expression` supplies a result and bare `return` leaves an action.
- Scalar locals hold per-invocation intermediate values.
- Aggregate parameters alias compatible caller storage.
