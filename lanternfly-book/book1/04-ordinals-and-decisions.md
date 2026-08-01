---
layout: default
title: "Named Ordinals and Decisions"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 4
---

# Named Ordinals and Decisions

A batch-processing program is always in exactly one of three states: still
working, complete, or stopped by an error. The states are not numbers — no
arithmetic on them makes sense — and they are not Booleans, because there
are three. They are a fixed set of named alternatives, and Lanternfly lets
us declare that set as a type of its own before we write the rules that
move between them:

```lanternfly
enum Status as u8
    working
    complete
    failed
end

var itemsRemaining as u16 = 40
var errorCount as u8 = 0
var status as Status = working

sub updateStatus()
    if errorCount > 0 then
        status = failed
    else if itemsRemaining = 0 then
        status = complete
    else
        status = working
    end
end
```

The enumeration gives the states their names; the decision ranks the rules
that select one. Conditions are tested from top to bottom, the first true
condition selects its branch, and execution continues after the closing
`end`.

## Enumerations

```lanternfly
enum Status as u8
    working
    complete
    failed
end
```

The representation type follows `as`. Members take numbered positions
from zero in declaration order — each member's number is its _ordinal_,
the term this book uses from here on — and their names are written
without qualification. An
enumeration supports assignment and all six comparisons, and deliberately
nothing arithmetic: adding two statuses has no meaning, and the type says
so. Converting an integer into an enumeration is checked: an invalid
constant is a compile error, and an invalid runtime value invokes the
range fault before any store, so a `Status` variable never holds an
invalid state.

That guarantee is the working difference from Chapter 2's integer
constants. Three constants named `statusWorking`, `statusComplete` and
`statusFailed` would give the states names, but any `u8` from 0 through 255
could still enter the variable. The enumeration closes the set.

## Ranges

A range constrains a host type to part of its domain:

```lanternfly
range ScreenColumn as u8 = 0 until 32
range VerboseMode as Status = complete to failed
```

A range value widens silently to its host, while any value entering the
range, by assignment or conversion, is checked against its domain. The
range form itself is grammar rather than a value (`0 until 32` cannot be
stored or passed), while a variable of a range type holds an ordinary host
value, checked at every boundary it crosses. Chapter 6 puts both ordinal
kinds to work as array index domains, where a suitably typed index makes a
bounds check unnecessary because the type already proves it.

## A single branch

```lanternfly
if itemsRemaining = 0 then
    status = complete
end
```

`if` evaluates a Boolean condition. When the result is `true`, the body runs.
When it is `false`, execution moves directly past `end`.

The body may contain assignments, calls or another decision. Nesting is
useful when an inner test belongs only to one outer state:

```lanternfly
if errorCount = 0 then
    if itemsRemaining = 0 then
        status = complete
    end
end
```

When both tests are short and the body needs only their combined result,
Boolean `and` expresses the same rule in one condition:

```lanternfly
if errorCount = 0 and itemsRemaining = 0 then
    status = complete
end
```

## Two alternatives

`else` supplies the path for a false condition:

```lanternfly
if itemsRemaining = 0 then
    status = complete
else
    status = working
end
```

Exactly one assignment runs. This form is appropriate when both outcomes must
set the value. A single `if` is appropriate when the false case should preserve
the value already stored.

## Ordered conditions

An `else if` chain ranks several rules, as `updateStatus` does. With
`errorCount = 1` and `itemsRemaining = 0`, both comparisons are true, but
the first branch sets `failed` and the second comparison is skipped.
Reversing the first two branches would classify the same state as complete.

Branch order states the policy we chose. A higher-priority condition
belongs first. When two conditions have equal priority, their frequency and
cost can guide the order because execution pays for each comparison it
reaches.

## Selecting among named values

Sometimes every branch compares one value with the members of a set.
`select` gives that pattern its own structure:

```lanternfly
enum ReportMode as u8
    compact
    detailed
    diagnostic
end

var reportMode as ReportMode = compact
var lineWidth as u8 = 40
var includeChecks as boolean = false

sub configureReport()
    select reportMode
    case compact
        lineWidth = 40
        includeChecks = false
    case detailed
        lineWidth = 80
        includeChecks = false
    case diagnostic
        lineWidth = 80
        includeChecks = true
    end
end
```

`select` evaluates `reportMode` once. Each `case` names compatible
compile-time ordinal values. A matching body runs, then execution continues
after `end`; Lanternfly cases never fall through. Because a `ReportMode`
variable can only hold a valid member and every member has a case, this
`select` is complete without an `else` — no value can escape it.

An ordinal selector that is not an enumeration can hold a value with no
matching case, so its `select` needs `else` to supply the result for the
unmatched rest. A `case` may also span a run of values with a range —
`case 2 to 9` includes both ends, and `until` excludes its boundary:

```lanternfly
sub configureChannel()
    select channelCode
    case 0, 1
        buffered = true
    case 2 to 9
        buffered = false
    else
        buffered = true
    end
end
```

Several values sharing one body sit on one `case` line, as `0, 1` do here.
Duplicate case values are compile errors. Omitting `else` on an integer
selector leaves unmatched values changing nothing.

## `if` and `select`

`if` fits a decision built from different questions — did an error occur?
is the batch complete? — while `select` fits branches that compare one
ordinal expression with named constant values.

An `else if` chain announces an ordered policy; a `select` announces a
classification by one value.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt)
declares the `Status` and `ReportMode` enumerations, ranks the batch-status
rules, configures a report by complete `select`, and classifies a device
channel code with case ranges and `else`. With one error and zero remaining
items, `updateStatus` produces `failed`; with no errors and zero remaining
items, it produces `complete`.

## Chapter summary

- An enumeration names a fixed set of alternatives as a checked type with
  no arithmetic; an invalid value cannot enter it silently.
- A range constrains a host type to part of its domain and is checked at
  every boundary.
- `if` runs one body when a Boolean condition is true; `else` supplies the
  false path, and `else if` ranks several conditions in policy order.
- `select` compares one ordinal expression with compile-time case values
  and ranges; an enumeration `select` covering every member is complete
  without `else`.
- Lanternfly cases do not fall through, and `else` handles unmatched values
  of an open selector.

A decision runs its branch once. In the next chapter we repeat work, and
meet the rules that end the repetition.
