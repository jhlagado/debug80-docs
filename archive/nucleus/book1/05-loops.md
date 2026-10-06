---
layout: default
title: "Loops"
parent: "Programming Nucleus"
nav_order: 5
---

# Loops

Nucleus has one condition-controlled loop and one counted loop. Between them
they cover indefinite work, fixed ranges and array traversal without hiding a
counter or iterator object.

## `while` tests a condition

```nucleus
while value <= 0
    value = value + 1
end
```

The condition is Boolean and is tested before every iteration. `while true`
is the indefinite form. When such a loop has no `exit` that targets it, the
compiler knows it cannot fall through. A value routine may therefore return
from inside it without adding an unreachable return after `end`.

## `for` uses a declared local

The counter in a `for` header must already be a scalar local:

```nucleus
var index as i8

for index = -3 to 3 step + (1 + 1)
    // body
end
```

The compiler evaluates the start and bound once. `to` includes the bound;
`until` excludes it. The step defaults to positive one and may instead be a
nonzero compile-time constant magnitude with an optional sign. The companion
writes `step + (1 + 1)`, making both the direction and folded magnitude visible.

The counter is read-only inside the active loop. This prevents the body and
the loop machinery from disagreeing about its next value. A value that would
continue but overflow the counter type causes the `loop-range` safety trap
rather than wrapping.

## Leaving and continuing

`continue` moves to the next condition test in `while`, or to the increment
and next test in `for`. `exit` leaves the nearest enclosing loop. Both are
unlabelled; a nested loop receives them before an outer loop does.

The companion skips `-1`, leaves before processing `3`, and calls a routine
whose constant-true loop returns the first positive value. It finishes with
`observed` equal to 3.

<<< @/nucleus/book1/examples/05-loops.nu{nucleus}

## Summary

- `while` tests a Boolean condition before each iteration.
- A folded constant-true `while` with no targeting `exit` does not fall through.
- A `for` counter is a previously declared integer local.
- `to` is inclusive and `until` is exclusive.
- `exit` and `continue` target the nearest loop.

See [loop control](../language/12-loop-control.md) and
[routine fallthrough](../language/13-routines-and-calls.md#137-value-routine-completion).
The checked companion is [`05-loops.nu`](examples/05-loops.nu).
