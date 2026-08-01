---
layout: default
title: "Building with Subroutines"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 9
---

# Building with Subroutines

The routines in earlier chapters mostly read module variables. A reusable
routine receives the values that vary from one call to another:

```lanternfly
var total as i16 = 0

sub addToTotal(amount as i16)
    total = total + amount
end

sub main()
    addToTotal(10)
    addToTotal(25)
end
```

Each call supplies a fresh value for `amount`. The routine defines the update
once, and each call site supplies its own quantity.

## Parameters and arguments

Every user routine begins with `sub`. Parameters use the same
`name as Type` form as other declarations:

```lanternfly
sub addToTotal(amount as i16)
    total = total + amount
end
```

At the call site, an argument supplies the parameter value:

```lanternfly
addToTotal(nextAmount)
```

Scalar parameters pass by value. Changing `amount` inside the routine would
change its private parameter value, not `nextAmount` in the caller.

Arguments are evaluated from left to right before the routine begins. This
order matters when argument expressions call routines or perform other visible
work.

## Returning a result

A trailing result type turns a call into an expression:

```lanternfly
sub atMost(input as i16, maximum as i16) as i16
    if input > maximum then
        return maximum
    end

    return input
end
```

We can place the returned `i16` wherever an `i16` expression belongs:

```lanternfly
total = atMost(total + nextAmount, 1000)
```

Every reachable path in a result-bearing routine must return a compatible
scalar value. (The scalar kinds — ordinals, Booleans, opaque addresses —
are catalogued in the language reference.) Strings, records and arrays
remain in caller-owned storage and are reached through aggregate
parameters and aliases.

A result-bearing call may stand alone when its side effects matter and its
result may be discarded. A result-free routine cannot appear where an
expression value is required.

## Scalar locals

Locals hold working values that belong to one invocation:

```lanternfly
sub absoluteDifference(left as i16, right as i16) as u16
    var difference as i16 = left - right

    return abs(difference)
end
```

Local declarations appear before executable statements. An initializer may
use parameters, module declarations and earlier locals. Code outside the
routine cannot name `difference`.

An owned scalar local with no initializer starts with zero bits. A string,
record or array is aggregate storage, so a routine reaches one through a
parameter, or through the alias form the next chapter introduces, rather
than owning a local copy.

The source-level guarantee comes first: overlapping invocations receive
independent scalar parameters and locals. Where a backend keeps them —
registers, stack slots or proven-safe static scratch — never changes that
rule.

## Aggregate parameters

An array, record or string parameter aliases the caller's existing storage:

```lanternfly
sub clearBlock(block as u8[8])
    var index as i16

    for index = 0 until count(block)
        block[index] = 0
    end
end
```

The call supplies a compatible storage path:

```lanternfly
clearBlock(workspace)
```

Writing `block[index]` changes `workspace[index]`. The aggregate is not copied
into local stack storage.

An aggregate parameter states its exact shape. A string parameter names
its exact capacity, because the alias must match the caller's layout byte
for byte: `line as string[40]` accepts a `string[40]` and nothing else.

That is the ordinary rule for every routine we can write; Chapter 12's
standard text services hold the language's two narrow exceptions. Routines
shared between modules also state where the aggregate lives, and Chapter
13 introduces that spelling with the interfaces that need it.

## Early return

A result-free routine can leave early with bare `return`:

```lanternfly
sub normaliseReading(reading as Reading)
    if reading.quality = qualityInvalid then
        return
    end

    reading.value = atMost(reading.value, maximumReading)
end
```

The invalid case ends the call before the update. Handling it first keeps the
main work at the routine's outer indentation. Reaching the closing `end` also
returns from a result-free routine.

`return` leaves the subroutine. `exit` leaves the innermost loop, so the two
words describe different control boundaries.

## Calling order and recursion

Chapter 1's declaration order governs calls too. A routine body may call
imported routines, routines declared earlier in the module, and itself —
the routine's own name becomes visible at its header, so a direct
self-call is legal source. A call to a later routine is a
declaration-before-use error, which makes mutual recursion — two routines
each calling the other — unwritable in one module.

Whether that self-call is actually available depends on the selected
target. The reason is storage: every active invocation needs an
independent parameter-and-local frame, so a recursion-capable profile
defines frame layout and stack bounds, while a profile based on fixed
scratch storage rejects a self-call that would overwrite the active
frame. The complete frame and capability rules live in the language
reference.

## Example

The [chapter listing](/lanternfly-book/book1/code/09-routines.txt)
contains value parameters, returned results, scalar locals and an aggregate
parameter. Two calls to `addToTotal` produce 35. Applying
`atMost(total, 30)` then returns 30.

## Chapter summary

- Scalar parameters receive values from the caller, and arguments are
  evaluated from left to right.
- A trailing `as Type` declares a scalar result returned with `return`.
- Scalar locals hold private working values for one invocation.
- Record, array and string parameters alias caller-owned storage.
- A routine calls imported routines, earlier routines or itself; recursion
  depends on whether the selected target profile can provide independent
  active frames.

Routines now receive values, return results and work on caller-owned
aggregates through temporary names. The next chapter widens that last idea
into Lanternfly's whole answer to a classic question: how does a program
keep hold of _which_ piece of storage an operation applies to?
