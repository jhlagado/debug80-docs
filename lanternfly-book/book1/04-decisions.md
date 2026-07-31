---
layout: default
title: "Choosing a Path"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 4
---

# Choosing a Path

A batch-processing program can be working, complete or stopped by an error.
The status depends on two facts, and their priority matters. An error takes
precedence even when the last item has also been processed:

```lanternfly
const statusWorking as u8 = 0
const statusComplete as u8 = 1
const statusFailed as u8 = 2

var itemsRemaining as u16 = 40
var errorCount as u8 = 0
var status as u8 = statusWorking

sub updateStatus()
    if errorCount > 0 then
        status = statusFailed
    else if itemsRemaining = 0 then
        status = statusComplete
    else
        status = statusWorking
    end
end
```

Conditions are tested from top to bottom. The first true condition selects
its branch, and execution continues after the closing `end`.

## A single branch

```lanternfly
if itemsRemaining = 0 then
    status = statusComplete
end
```

`if` evaluates a Boolean condition. When the result is `true`, the body runs.
When it is `false`, execution moves directly past `end`.

The body may contain assignments, calls, loops or another decision. Nesting is
useful when an inner test belongs only to one outer state:

```lanternfly
if errorCount = 0 then
    if itemsRemaining = 0 then
        status = statusComplete
    end
end
```

When both tests are short and the body needs only their combined result,
Boolean `and` expresses the same rule in one condition:

```lanternfly
if errorCount = 0 and itemsRemaining = 0 then
    status = statusComplete
end
```

## Two alternatives

`else` supplies the path for a false condition:

```lanternfly
if itemsRemaining = 0 then
    status = statusComplete
else
    status = statusWorking
end
```

Exactly one assignment runs. This form is appropriate when both outcomes must
set the value. A single `if` is appropriate when the false case should preserve
the value already stored.

## Ordered conditions

An `else if` chain ranks several rules:

```lanternfly
if errorCount > 0 then
    status = statusFailed
else if itemsRemaining = 0 then
    status = statusComplete
else
    status = statusWorking
end
```

With `errorCount = 1` and `itemsRemaining = 0`, both comparisons are true,
but the first branch sets `statusFailed` and the second comparison is skipped.
Reversing the first two branches would classify the same state as complete.

Branch order states the policy we chose. A higher-priority condition
belongs first. When two conditions have equal priority, their frequency and
cost can guide the order because execution pays for each comparison it reaches.

## Selecting among named values

Sometimes every branch compares one value with a set of fixed alternatives.
`select` gives that pattern its own structure:

```lanternfly
const modeCompact as u8 = 0
const modeDetailed as u8 = 1
const modeDiagnostic as u8 = 2

var reportMode as u8 = modeCompact
var lineWidth as u8 = 40
var includeChecks as boolean = false

sub configureReport()
    select reportMode
    case modeCompact
        lineWidth = 40
        includeChecks = false
    case modeDetailed
        lineWidth = 80
        includeChecks = false
    case modeDiagnostic
        lineWidth = 80
        includeChecks = true
    else
        lineWidth = 40
        includeChecks = true
    end
end
```

`select` evaluates `reportMode` once. Each `case` contains compatible
compile-time ordinal values. A matching body runs, then execution continues
after `end`; Lanternfly cases never fall through.

The constants here are integers by construction, but Chapter 2's
enumerations suit this pattern even better. With
`var reportMode as ReportMode`, the cases name the members directly, an
invalid mode cannot enter the variable in the first place, and a `select`
whose cases cover every member is complete without an `else`. A case may
also span a run of values with a range: `case 0 to 9` includes both ends,
and `until` excludes its boundary.

The optional `else` handles values that match no case. Here it supplies a
conservative report configuration for an invalid mode. Omitting `else` would
leave the previous values unchanged.

Several constants may share one body:

```lanternfly
const inputSerial as u8 = 0
const inputFile as u8 = 1
const inputKeyboard as u8 = 2

select inputKind
case inputSerial, inputFile
    buffered = true
case inputKeyboard
    buffered = false
end
```

Duplicate case values are compile errors. Shared values belong on one `case`
line because there is one complete body for them.

## `if` and `select`

`if` fits a decision built from different questions — did an error occur?
is the batch complete? — while `select` fits branches that compare one
ordinal expression with named constant values.

The opening word tells you the shape of the decision. An `else if` chain
announces an ordered policy; a `select` announces a classification by one
value.

## Example

The [chapter listing](/lanternfly-book/book1/code/04-decisions.txt)
contains the batch-status policy and report-mode selection, and closes with
an enumeration selector whose `select` covers every member without an
`else`. With one error and zero remaining items, `updateStatus` produces
`statusFailed`. With no errors and zero remaining items, it produces
`statusComplete`.

## Chapter summary

- `if` runs one body when a Boolean condition is true.
- `else` supplies the false path, and `else if` ranks several conditions.
- The first true condition in a chain determines the result.
- `select` compares one ordinal expression with compile-time case values
  and ranges; an enumeration `select` covering every member is complete
  without `else`.
- Lanternfly cases do not fall through, and `else` handles unmatched values.

A decision runs its branch once. In the next chapter we repeat work, and
meet the rules that end the repetition.
