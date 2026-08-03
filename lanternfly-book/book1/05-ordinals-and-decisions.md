---
layout: default
title: "Named Ordinals and Decisions"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 5
---

# Named Ordinals and Decisions

A batch can be working, complete or failed. These are three alternatives of
one kind, not three unrelated numbers. Lanternfly declares the set as an
enumeration:

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

The variable `status` can hold only a member of `Status`. The decision checks
the failure rule first, then the completion rule, then uses `working` for every
remaining case. Exactly one assignment runs.

## Enumerations close a set

```lanternfly
enum Status as u8
    working
    complete
    failed
end
```

`Status` is a new type. The `u8` after `as` fixes its one-byte representation.
The members receive ordinal positions in declaration order:

| Member | Ordinal |
| ------ | ------: |
| `working` | 0 |
| `complete` | 1 |
| `failed` | 2 |

The ordinal supplies storage layout and ordering. Ordinary program logic uses
the member names. A variable of type `Status` cannot hold 17, 255 or a member
of another enumeration, even though all of those values might fit in one byte.

Three `u8` constants could name the same states:

```lanternfly
const statusWorking as u8 = 0
const statusComplete as u8 = 1
const statusFailed as u8 = 2
```

Those constants would leave the variable itself as `u8`, so every value from 0
through 255 could enter it. The enumeration makes the permitted set part of
the type. A known invalid conversion is rejected during compilation; an
invalid value received at runtime causes the range fault before the variable
changes.

Member names appear without a type prefix:

```lanternfly
status = complete
```

An unannotated constant initialized from a member keeps the enum type:

```lanternfly
const initialStatus = working
```

`initialStatus` has type `Status`, not an integer type. Enumerations support
assignment and all six comparisons in declaration order. They do not support
arithmetic or bitwise operators.

## One conditional branch

An `if` statement runs a body only when its condition is true:

```lanternfly
if itemsRemaining = 0 then
    status = complete
end
```

The comparison produces a Boolean. If it is true, the assignment runs. If it
is false, execution continues after `end` and `status` keeps its previous
value.

Use a single branch when the false case should preserve the current value.
When both outcomes must assign a value, add `else`:

```lanternfly
if itemsRemaining = 0 then
    status = complete
else
    status = working
end
```

The condition is evaluated once. A true result runs the first body; a false
result runs the body after `else`. The two bodies are alternatives, so only one
runs.

## Several conditions in priority order

A batch with no remaining items might also have an error. The program must
state which status takes priority. An `else if` chain tests the rules from top
to bottom:

```lanternfly
if errorCount > 0 then
    status = failed
else if itemsRemaining = 0 then
    status = complete
else
    status = working
end
```

The words `else if` continue the same decision, and one `end` closes the whole
chain. Evaluation stops after the first true condition:

| `errorCount` | `itemsRemaining` | First true branch | Final status |
| -----------: | ---------------: | ----------------- | ------------ |
| 0 | 40 | `else` | `working` |
| 0 | 0 | `itemsRemaining = 0` | `complete` |
| 1 | 0 | `errorCount > 0` | `failed` |

In the last row, both comparisons would be true if both were evaluated. The
first branch sets `failed`, and the second comparison is skipped. Reversing the
first two branches would make an empty failed batch appear complete. Branch
order sets the priority.

Nested `if` statements are useful when the inner question belongs only to one
outer case:

```lanternfly
if errorCount = 0 then
    if itemsRemaining = 0 then
        status = complete
    end
end
```

When both tests form one short condition, Boolean `and` states the same rule
more directly:

```lanternfly
if errorCount = 0 and itemsRemaining = 0 then
    status = complete
end
```

## Selecting by one value

An `else if` chain can ask different questions. Another common decision keeps
comparing one value with members of the same set. `select` states that value
once:

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

`select` evaluates `reportMode` once. With `reportMode` equal to `detailed`,
the two assignments under `case detailed` run. Execution then continues after
the final `end`. The `diagnostic` body does not run.

Continuing from one case body into the next is called _fall-through_. A
Lanternfly case never falls through, so no `break` statement is needed. When
several values require the same body, place them on one `case` line:

```lanternfly
case compact, detailed
    lineWidth = 80
```

Every `ReportMode` value names one of the three declared members. The original
`select` has a case for all three, so it is complete without `else`. A
`select` over an integer may receive an unmatched value; an `else` body handles
that remainder.

## Ranges name consecutive values

A range type permits a consecutive part of an integer or enumeration:

```lanternfly
range ScreenColumn as u8 = 0 until 32
range DetailedReportMode as ReportMode = detailed to diagnostic
```

The first value is always included. The word between the values determines
whether the second value is included:

| Written range | Included values | Meaning of the second value |
| ------------- | --------------- | --------------------------- |
| `0 to 31` | 0 through 31 | 31 is the last included value. |
| `0 until 32` | 0 through 31 | 32 is the first excluded value. |

Both integer ranges contain the same 32 values. Use `to` when the final valid
value is the useful fact. Use `until` when the stopping boundary or count is
the useful fact. Thirty-two columns numbered from zero are `0 until 32`, and
`0 until count` contains exactly `count` values. Adjacent ranges can meet at
one boundary: `0 until 32` covers 0 through 31, and `32 until 64` covers 32
through 63.

The enum range uses declaration order. `detailed to diagnostic` includes both
members. `detailed until diagnostic` would contain only `detailed`, because
`diagnostic` would be the first excluded member.

A variable of range type is checked when a value enters it:

```lanternfly
var rawColumn as u8 = 31
var column as ScreenColumn = 0

sub acceptColumn()
    column = rawColumn
end
```

The value 31 passes. A literal 32 is rejected during compilation. If
`rawColumn` contains 32 at runtime, the range fault occurs before `column`
changes. A `ScreenColumn` value can be used wherever a `u8` is accepted;
assignment in the other direction needs the check because a general `u8` can
also hold 32 through 255.

## Case values and case ranges

An integer `select` can group individual values and consecutive ranges:

```lanternfly
var channelCode as u8 = 7
var buffered as boolean = false

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

Codes 0 and 1 share the first body. Codes 2 through 9, including both ends,
share the second. Every other `u8` value reaches `else`. With `channelCode`
equal to 7, only `buffered = false` runs, followed by the statements after the
complete `select`.

Case values must be compile-time constants. Duplicate or overlapping cases
are errors because one selected value must identify at most one body.

## Choosing `if` or `select`

Use `if` when the branches ask different questions or when ranges depend on
runtime expressions. The batch decision asks about an error count and a number
of remaining items, so an `else if` chain states its priority.

Use `select` when every branch classifies one ordinal value. The report-mode
decision and channel-code table both have that shape. Writing the selected
expression once also guarantees that it is evaluated once.

## Complete program

The complete module moves a batch through all three statuses: it begins
`working`, becomes `complete` when no items remain and finally becomes
`failed` when an error is recorded. It configures a detailed report, classifies
channel 7 as unbuffered and accepts column 31 as a valid `ScreenColumn`.

<<< @/lanternfly-book/book1/code/05-decisions.txt{lanternfly}


## Exercise

1. Why does `errorCount > 0` appear before `itemsRemaining = 0` in
   `updateStatus`?

Answer: both conditions can be true at once. The first true branch wins, so
placing the error test first gives failure priority over completion.

## Chapter summary

- An enumeration defines a closed set of named values in declaration order.
- `if`, `else if` and `else` test conditions from top to bottom and run one
  body.
- `select` evaluates one ordinal value and runs at most one matching case body;
  execution resumes after the final `end`.
- A range includes its first value. `to` includes the second value, while
  `until` stops before it.
- Values entering an enum or range are checked before the destination changes.
