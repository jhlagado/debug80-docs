---
layout: default
title: "Routines"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 9
---

# Routines

`sub` declares every user routine. Lanternfly has no separate `function`
keyword.

## Declarations

A result-free routine omits a trailing type:

```lanternfly
sub updateClock()
    frame = frame + 1
end
```

A result-bearing routine adds `as Type`:

```lanternfly
sub distance(left as i16, right as i16) as u16
    if left >= right then
        return left - right
    end

    return right - left
end
```

Parentheses appear in every declaration and invocation, including an empty
parameter list.

A result type must be an integer, Boolean, opaque address or `cstr`. Aggregate
return by value is deferred. A result-free invocation has the internal type
`unit`, which cannot be written in source or used as a value.

## Invocation

Lanternfly has no `call` keyword:

```lanternfly
updateClock()
separation = distance(playerX, enemyX)
distance(playerX, enemyX)
```

An invocation can be an expression statement. Any result is discarded. A
result-free invocation is invalid where a value is required.

Arguments evaluate from left to right.

## Scalar parameters

Scalar parameters pass values:

```lanternfly
sub addScore(amount as u16)
    score = score + amount
end
```

The destination conversion rules apply at the call boundary.

## Aggregate parameters

A record or array parameter creates a non-rebindable alias to caller storage:

```lanternfly
sub moveActor(actor as Actor, deltaX as i16, deltaY as i16)
    actor.position.x = actor.position.x + deltaX
    actor.position.y = actor.position.y + deltaY
end
```

Writing through `actor` changes the caller's record. The source type remains
`Actor`; no reference type appears.

An aggregate argument must be a compatible writable storage path or local
alias. A temporary initializer, constant aggregate or volatile aggregate is
invalid.

An unqualified aggregate parameter in a private routine uses the profile
default storage class. Exported routines, and private routines accepting
non-default storage, put `near` or `far` before the parameter name:

```lanternfly
export sub moveActor(near actor as Actor, deltaX as i16)
end
```

The leading class describes aggregate storage. Element types retain their own
classes, as in `far labels as near cstr[8]`.

## Scalar locals

Scalar locals use `var` and receive fresh storage on every invocation:

```lanternfly
sub updateActor(actor as Actor)
    var nextX as i16 = actor.position.x + actor.velocity.x
    var nextY as i16 = actor.position.y + actor.velocity.y

    actor.position.x = nextX
    actor.position.y = nextY
end
```

Local initializers execute in declaration order. Owned aggregate locals are
invalid.

## Local aggregate aliases

`alias` names aggregate storage allocated elsewhere:

```lanternfly
alias actor as Actor = actors[selectedActor]
```

The path is evaluated and checked once. The alias cannot be rebound and
allocates no record or array storage. Direct indexing remains clearer for a
single access; an alias suits repeated access or a nested aggregate call.

## Return

A result-free routine may use bare `return`:

```lanternfly
sub updateActor(actor as Actor)
    if not actor.active then
        return
    end

    actor.position.x = actor.position.x + 1
end
```

Reaching `end` also returns from a result-free routine.

A result-bearing routine uses `return expression`, and every reachable path
must return a compatible value. Bare `return` is invalid there.

`exit` is loop control and never substitutes for `return`.

## Calling convention

Source semantics give each invocation fresh scalar parameters and locals. A
backend may use registers, stack slots or both. Static temporaries are
permitted only when whole-program analysis proves that invocations cannot
overlap.

Recursion is a target-profile capability:

- a non-recursive profile rejects direct and mutual call cycles with the
  cycle path;
- a recursive profile supplies independent frames and documents stack,
  reentrancy and maximum-bound rules.

Native callbacks into source-defined Lanternfly routines or hosted bodies are
deferred.

Routine names are not values. Source code cannot take a routine address, store
one, return one or call indirectly. Runtime dispatch uses `select`; a backend
may lower a dense selection to a jump table.

