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
once, and callers choose the quantity.

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

The caller can place the returned `i16` wherever an `i16` expression belongs:

```lanternfly
total = atMost(total + nextAmount, 1000)
```

Every reachable path in a result-bearing routine must return a compatible
scalar. First-edition results may be ordinals — integers, enumerations and
ranges — Booleans or opaque addresses. Strings, records and arrays remain in
caller-owned storage and are reached through aggregate parameters and
aliases.

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

An owned scalar local with no initializer starts with zero bits. A string is
aggregate storage, so a routine reaches one through a parameter or a Chapter
8 alias rather than owning a local copy.

A backend may keep locals in registers, stack slots or proven-safe static
scratch. The source rule remains the same: overlapping invocations receive
independent scalar parameters and locals.

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

This shorthand suits private routines, where the parameter uses the target
profile's default storage class. An exported interface states the storage
class before the parameter's name:

```lanternfly
export sub clearSharedBlock(near block as u8[8])
    var index as i16

    for index = 0 until count(block)
        block[index] = 0
    end
end
```

The leading `near` fixes the storage class that importing modules and the
target calling convention must share. It qualifies the aggregate itself; an
element type carries its own spelling, so an array of near opaque addresses
held in far storage is written `far handles as near address[8]`. A string
parameter states its exact capacity — `line as string[40]` accepts a
`string[40]` and nothing else — because the alias must match the caller's
layout byte for byte.

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

## Recursion and target profiles

A recursive call needs an independent parameter-and-local frame for every
active invocation. A recursion-capable target profile defines the frame
layout, stack bounds and reentrancy rules. A profile based on fixed scratch
storage rejects direct and mutual recursion because another invocation would
overwrite the active frame.

Target profiles may disagree about whether a recursive source program is
valid. The generated report identifies frame size and the profile capability
that governs the call.

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
- Recursion depends on whether the selected target profile can provide
  independent active frames.

Our programs can compute anything but touch nothing; in the final chapter
we reach the machine itself, through modules, typed services and assembly.
