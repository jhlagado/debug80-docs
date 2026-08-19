---
layout: default
title: "Routines and Calls"
parent: "Programming Nucleus"
nav_order: 10
---

# Routines and Calls

Routines give a calculation a name and define the values it needs. Nucleus has
one routine family, introduced by `sub`; a result type distinguishes a value
routine from a result-free one.

```nucleus
sub choose(left as u8, right as u8) as u8
    if left > right
        return left
    end
    return right
end
```

Parameters are declared individually. Scalar arguments are copied into a new
activation for the call. Scalar locals belong to that activation and must be
declared before its statements. A recursive call receives its own parameter
and local values.

## Calls evaluate arguments left to right

The order is observable when arguments call routines or change storage:

```nucleus
observed = u16(choose(mark(2), mark(7))) + u16(sequence)
```

`mark(2)` completes before `mark(7)` begins. The compiler retains the first
result while evaluating the second, then starts `choose`. The companion uses
that order to build `sequence = 27`.

## Returning successfully

A result-free routine may use bare `return` or reach its closing `end`. A value
routine uses `return expression`; every reachable path must return a compatible
value. The compiler checks this from the structured statement forms rather than
inventing a default result.

`return` may occur inside a conditional or loop. It ends the current call
immediately. Nucleus has no destructors or deferred cleanup to run on the way
out.

Routine scope contains its parameters and scalar locals. A parameter or local
may shadow a program name, but it cannot duplicate another parameter or earlier
local in the same routine. Outside the routine, the program binding is visible
again.

The companion proves left-to-right argument evaluation and early return. It
leaves `observed` equal to 34.

<<< @/nucleus/book1/examples/10-routines.nu{nucleus}

## Summary

- `sub` declares both result-free and result-bearing routines.
- Scalar parameters and locals belong to one call activation.
- Arguments are evaluated from left to right before the call begins.
- Value routines must return a value on every reachable path.
- `return` ends the current activation immediately.

See [names and scopes](../language/05-names-and-scopes.md) and
[routines and calls](../language/13-routines-and-calls.md). The checked
companion is [`10-routines.nu`](examples/10-routines.nu).
