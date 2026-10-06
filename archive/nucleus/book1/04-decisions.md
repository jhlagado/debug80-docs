---
layout: default
title: "Decisions"
parent: "Programming Nucleus"
nav_order: 4
---

# Decisions

A direction value may be negative, zero or positive. One decision classifies
its sign; another chooses an action for a particular integer value.

## Boolean chains

`if` tests a Boolean expression. Further tests use the single keyword
`elseif`, and an optional `else` handles the remaining path.

```nucleus
if direction > 0
    observed = 1
elseif direction < 0
    observed = 2
else
    observed = 3
end
```

Conditions are tested in order until one is true. Only that body runs. There
is one `end` for the complete chain.

`elseif` is a clause, not the two words `else if`. A nested conditional in an
`else` body is still available, but it begins on the following logical line and
has its own `end`. Use nesting when the inner decision belongs inside one outer
path; use `elseif` when the tests are peers in one chain.

## Integer selection

`select` evaluates one integer expression once, then compares it with constant
case values:

```nucleus
select direction
case -1
    observed = observed + 10
case 0
    observed = observed + 20
else
    observed = observed + 30
end
```

Several comma-separated values may share a case body. The first matching case
runs and then control continues after `end`; cases never fall through into one
another. `else` is optional and handles a value that matched no case.

Choose `select` when the question is equality against a short list of integer
constants. Choose `if` for ranges, Boolean combinations or conditions that are
not all comparisons with one value.

The companion classifies `-1`, then selects its matching case. It leaves
`observed` equal to 12.

<<< @/nucleus/book1/examples/04-decisions.nu{nucleus}

## Summary

- `if`, `elseif` and `else` form one flat Boolean chain.
- A nested `if` is an ordinary statement with its own `end`.
- `select` evaluates one integer selector once.
- Case values are compile-time integer constants and do not fall through.

See [conditional and selection control](../language/11-conditional-and-selection-control.md).
The checked companion is [`04-decisions.nu`](examples/04-decisions.nu).
