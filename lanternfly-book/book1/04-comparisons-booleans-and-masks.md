---
layout: default
title: "Comparisons, Booleans and Bit Masks"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 4
---

# Comparisons, Booleans and Bit Masks

Chapter 3 produced numbers. Programs also need answers: is the change
large, is the device ready, has an error been seen? Lanternfly keeps such
answers in Chapter 2's `boolean` type, and this chapter covers the three
ways they arise — comparing values, combining earlier answers, and testing
individual bits.

```lanternfly
var changeMagnitude as u16 = 230
var changeIsLarge as boolean = false

sub classifyChange()
    changeIsLarge = changeMagnitude >= 100
end
```

## Comparisons

Comparisons produce Boolean values:

| Meaning               | Operator |
| --------------------- | -------- |
| equal                 | `=`      |
| unequal               | `<>`     |
| less than             | `<`      |
| less than or equal    | `<=`     |
| greater than          | `>`      |
| greater than or equal | `>=`     |

Compatible integers support all six comparisons, and Booleans support
equality and inequality. Later chapters introduce enumerations and
strings, each with its own comparison rules.

`=` therefore does two related jobs, and grammar keeps them apart. At the
start of a statement it assigns: the left side is a storage path receiving a
value. Inside an expression it compares for equality and produces a
`boolean`. `changeIsLarge = changeMagnitude >= 100` uses the first `=` to
store and the `>=` to compare.

Lanternfly rejects comparison chains. A range test joins two comparisons:

```lanternfly
inRange = minimum <= input and input <= maximum
```

## Boolean operators

`and`, `or`, `xor` and `not` combine Boolean values:

```lanternfly
var shouldRecord as boolean = false

sub assessChange()
    shouldRecord = deviceReady and changeMagnitude >= 100
end
```

Boolean `and` and `or` short-circuit. A false left side of `and` skips the
right side, while a true left side of `or` skips it. This allows an earlier
test to guard a later operation:

```lanternfly
highAverage = itemCount > 0 and total / itemCount > threshold
```

The division runs only after `itemCount > 0` succeeds, so a zero item count
can never divide.

## Bit masks

One byte can carry eight independent yes-or-no facts — a device ready
here, an error there — and that practical economy is what bit masks are
for. The same word operators act on individual bits when their operands
are integers:

```lanternfly
const readyMask as u8 = %00000001
const errorMask as u8 = %00000010

var statusFlags as u8 = readyMask

sub adjustFlags()
    statusFlags = statusFlags or errorMask
    statusFlags = statusFlags and not readyMask
    statusFlags = statusFlags xor errorMask
end
```

`or` sets selected bits, `and not` clears them and `xor` toggles them. A mask
test converts the selected bits into an ordinary Boolean:

```lanternfly
errorSeen = (statusFlags and errorMask) <> 0
```

## Grouping and precedence

Parentheses bind first and make an intended calculation visible:

```lanternfly
average = (first + second) / 2
```

Without the parentheses, division would occur before addition. The
precedence order runs from arithmetic through shifts and comparisons to
the Boolean operators, with `or` last; the complete ladder is in the
language reference, and parentheses make any line independent of it.

That ordering lets a Boolean expression read naturally:

```lanternfly
minimum <= input and input <= maximum
```

The comparisons run before the Boolean `and`. Parentheses are still valuable
when a line mixes bitwise and Boolean work:

```lanternfly
alarm = (statusFlags and errorMask) <> 0 and deviceReady
```

The first `and` combines bits; the second combines Boolean results.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/04-comparisons.txt)
classifies a stored change, combines the answer with a device flag, tests
a status mask and adjusts its bits. With `changeMagnitude` at 230 and
`deviceReady` true, `classifyChange` and `assessChange` leave both Boolean
variables true; `inspectStatus` reports no error before `adjustFlags`
runs, and `statusFlags` finishes as `%00000000` after the set, clear and
toggle.

## Exercises

1. With `statusFlags` at `%00000011`, `readyMask` `%00000001` and
   `errorMask` `%00000010`, what is `statusFlags and not errorMask`?
2. Why does `itemCount > 0 and total / itemCount > threshold` never
   divide by zero?
3. One of these is a compile error: `a = b = c` at the start of a
   statement, or `(b = c)` on its own line. Which, and why?

Answers: `%00000001` — `not errorMask` is `%11111101` and `and` keeps only
the ready bit; short-circuit `and` skips the right side when the left is
false, so the division is never reached with a zero count; `a = b = c` is
the error — assignment is a statement, not an expression, so it cannot be
chained, while `(b = c)` is a discarded equality test.

## Chapter summary

- Comparisons produce `boolean` values, and comparison chains are
  rejected — a range test joins two comparisons with `and`.
- Boolean `and` and `or` short-circuit, so an earlier test can guard a
  later operation.
- Integer word operators combine bits: `or` sets, `and not` clears, `xor`
  toggles, and a mask test ends in an ordinary comparison.
- Parentheses bind first; precedence runs from arithmetic through
  comparisons to the Boolean operators, with `or` last.

Expressions can now produce Boolean answers and store them. The next
chapter gives important values names of their own — and uses those
answers to choose between paths.
