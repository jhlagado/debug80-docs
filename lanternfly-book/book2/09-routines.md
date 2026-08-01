---
layout: default
title: "Routines"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 9
---

# Routines

One declaration form covers every user routine. A `sub` may return a scalar
value or no value at all, so Lanternfly needs no separate `function` keyword.

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
        return u16(left - right)
    end

    return u16(right - left)
end
```

Parentheses appear in every declaration and invocation, including an empty
parameter list.

A result type must be an ordinal, Boolean or opaque address. String and other
aggregate return by value is deferred. A result-free invocation has the
internal type `unit`, which cannot be written in source or used as a value.

## Invocation

Lanternfly has no `call` keyword:

```lanternfly
updateClock()
separation = distance(playerX, enemyX)
distance(playerX, enemyX)
```

An invocation may stand alone as an expression statement, in which case any
result is discarded. A result-free invocation is invalid where a value is
required.

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

A counted-string, record or array parameter temporarily names the caller's
storage:

```lanternfly
sub moveActor(actor as Actor, deltaX as i16, deltaY as i16)
    actor.position.x = actor.position.x + deltaX
    actor.position.y = actor.position.y + deltaY
end
```

Writing through `actor` changes the caller's record. The parameter cannot be
rebound, and its source type remains `Actor`; no reference type appears.

An aggregate argument must be a compatible writable storage path or local
alias. A temporary initializer, constant aggregate or volatile aggregate is
invalid.

An unqualified aggregate parameter in a private routine uses the profile
default storage class. A private routine accepting non-default storage puts
`near` or `far` before the parameter name:

```lanternfly
sub moveActor(far actor as Actor, deltaX as i16)
end
```

A near path may bind to a far parameter when the profile can attach the
current mapping context. Far storage cannot bind to a near parameter. The
leading class describes aggregate storage. In `far labels as string[16][8]`,
the array is far while `string[16]` is its element type.

A counted-string parameter states its exact capacity:

```lanternfly
sub readName(destination as string[24])
end
```

It is a writable, non-rebindable alias to the caller's `string[24]`, not a
copied string value or source reference.

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

Local initializers execute in declaration order. Owned counted-string and
other aggregate locals are invalid.

## Local aggregate aliases

`alias` gives counted-string or other aggregate storage allocated elsewhere a
local name:

```lanternfly
alias actor as Actor = actors[selectedActor]
```

The initializer must be a writable storage path with the exact aggregate type,
including a counted string's capacity. The path is evaluated and checked once;
the alias then denotes the same storage until the routine returns. It allocates
no counted-string, record or array storage.

A bare alias copies its referent in aggregate assignment:

```lanternfly
destination = actor
actor = source
```

The alias cannot be rebound, stored, returned, compared or converted. Scalar,
constant and volatile targets are invalid. Direct indexing remains clearer for
a single access; an alias suits repeated access or a nested aggregate call.

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

## Forward declarations

`forward sub` states a routine's complete signature before its body:

```lanternfly
forward sub updateEnemies()
```

- the forward header is checked as an ordinary header, and the routine name
  enters the module value scope at that point;
- from that point the routine may be called wherever a completed routine
  could be called;
- the completing `sub` appears later in the same module and repeats the
  forward header exactly — name spelling, export status, parameter storage
  classes, names, types and order, and result form — or the compiler
  reports `E-FORWARD-002`;
- each routine has at most one forward declaration, under the ordinary
  duplicate-name rules;
- a module that ends with an uncompleted forward declaration is
  `E-FORWARD-001`;
- `extern sub` is complete without a body and takes no part in forward
  declaration; hosted bodies contain no routine declarations;
- the program entry may be forward-declared;
- the reference backend resolves early calls by backpatching and an
  assembly-generating backend emits symbolic calls; either way a forward
  declaration adds no runtime cost.

## Calling convention

At source level, each invocation receives fresh scalar parameters and locals.
A backend may realize them with registers, stack slots or both. It may use
static temporaries only when whole-program analysis proves that invocations
cannot overlap.

Recursion is a target-profile capability:

- a routine may call itself, and forward declarations make mutual recursion
  expressible;
- a non-recursive profile rejects any source call-graph cycle, direct or
  through forward-declared routines;
- a recursive profile supplies independent frames and documents stack,
  reentrancy and maximum-bound rules.

Native callbacks into source-defined Lanternfly routines or hosted bodies are
deferred.

Routine names are not values. Source code cannot take a routine address, store
one, return one or call indirectly. Runtime dispatch uses `select`; a backend
may lower a dense selection to a jump table.
