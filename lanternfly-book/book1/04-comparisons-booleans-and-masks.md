---
layout: default
title: "Comparisons, Booleans and Bit Masks"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 4
---

# Comparisons, Booleans and Bit Masks

A data recorder should store a reading only when its device is ready and the
reading has changed enough to be useful. The program needs two yes-or-no
answers: is the change large, and should the reading be stored?

```lanternfly
const largeChangeThreshold as u16 = 100

var changeMagnitude as u16 = 230
var deviceReady as boolean = true
var changeIsLarge as boolean = false
var shouldRecord as boolean = false

sub assessChange()
    changeIsLarge = changeMagnitude >= largeChangeThreshold
    shouldRecord = deviceReady and changeIsLarge
end
```

The comparison `changeMagnitude >= largeChangeThreshold` produces `true`
because 230 is at least 100. The next statement combines that result with
`deviceReady`. Both values are true, so `shouldRecord` becomes true.

Lanternfly stores every yes-or-no value as `boolean`. Comparisons produce
Booleans, Boolean operators combine them and conditions use them to control
execution.

## Comparisons produce Boolean values

Lanternfly has six comparison operators:

| Operator | Meaning |
| -------- | ------- |
| `=` | equal |
| `<>` | unequal |
| `<` | less than |
| `<=` | less than or equal |
| `>` | greater than |
| `>=` | greater than or equal |

For `changeMagnitude` equal to 230 and the threshold equal to 100, the same two
values produce these results:

| Expression | Result |
| ---------- | ------ |
| `changeMagnitude = largeChangeThreshold` | `false` |
| `changeMagnitude <> largeChangeThreshold` | `true` |
| `changeMagnitude < largeChangeThreshold` | `false` |
| `changeMagnitude <= largeChangeThreshold` | `false` |
| `changeMagnitude > largeChangeThreshold` | `true` |
| `changeMagnitude >= largeChangeThreshold` | `true` |

Compatible integers support all six operators. Booleans support only `=` and
`<>`. Chapter 5 gives enumerations an explicit declaration order, and Chapter
8 defines text ordering.

The symbol `=` appears in assignments and equality comparisons. Its position
separates the two uses:

```lanternfly
changeIsLarge = changeMagnitude >= largeChangeThreshold
```

The first `=` begins an assignment statement: it stores a value in
`changeIsLarge`. The `>=` sits inside the expression and produces the Boolean
value that is stored. In a condition such as `changeMagnitude = 100`, `=` is
also inside an expression and tests equality.

One comparison has two operands. A test for a value between two limits needs
two comparisons joined by `and`:

```lanternfly
inRange = minimum <= input and input <= maximum
```

The left comparison tests the lower limit. The right comparison tests the
upper limit. The complete expression is true only when both tests are true.
Forms such as `minimum <= input <= maximum` are rejected because the first
comparison already produces a Boolean, which cannot then be compared with the
integer `maximum`.

## Combining Boolean values

`and`, `or`, `xor` and `not` combine Boolean operands. The complete table for
two operands is small:

| `left` | `right` | `left and right` | `left or right` | `left xor right` |
| ------ | ------- | ---------------- | --------------- | ---------------- |
| `false` | `false` | `false` | `false` | `false` |
| `false` | `true` | `false` | `true` | `true` |
| `true` | `false` | `false` | `true` | `true` |
| `true` | `true` | `true` | `true` | `false` |

`and` requires both operands to be true. `or` requires at least one. `xor`
means exclusive or: exactly one operand must be true. Unary `not` reverses one
Boolean, so `not true` is false and `not false` is true.

The recorder uses `and` because readiness and a large change are both required:

```lanternfly
shouldRecord = deviceReady and changeIsLarge
```

If either value is false, `shouldRecord` becomes false. An alarm that should
sound for either a sensor error or a low battery would use `or` instead.

## Short-circuit evaluation

Boolean `and` and `or` evaluate the left operand first. Sometimes that value
settles the result before the right operand is needed:

| Expression | Left value | Evaluation of the right operand | Result |
| ---------- | ---------- | ------------------------------- | ------ |
| `left and right` | `false` | skipped | `false` |
| `left and right` | `true` | evaluated | value of `right` |
| `left or right` | `true` | skipped | `true` |
| `left or right` | `false` | evaluated | value of `right` |

This rule is called _short-circuit evaluation_. A skipped operand performs no
call, storage read, division, bounds check or fault. The rule is part of the
language, so every Lanternfly implementation produces the same observable
behaviour.

A guard uses the left operand to establish that the right operand is safe:

```lanternfly
highAverage = itemCount > 0 and total / itemCount > averageThreshold
```

When `itemCount` is zero, evaluation proceeds as follows:

1. `itemCount > 0` produces false.
2. A false left operand settles Boolean `and` as false.
3. `total / itemCount > averageThreshold` is skipped.
4. `highAverage` receives false, and no division occurs.

When `itemCount` is positive, the left operand is true, so the division and
comparison run. Reversing the operands would remove the guard because the
division would occur before the zero check.

Boolean `xor` always evaluates both operands. It needs both values to determine
whether exactly one is true.

## One byte as eight flags

Separate Boolean variables are clear when each fact has its own name. Hardware
registers and compact file formats often place several flags in one integer.
Each bit position then represents one fact:

```lanternfly
const readyMask as u8 = %00000001
const errorMask as u8 = %00000010

var statusFlags as u8 = readyMask
```

The low bit represents readiness and the next bit represents an error. The
remaining six bits are clear. With integer operands, `and`, `or`, `xor` and
`not` operate on corresponding bits rather than complete Boolean values.

The following routine sets the error bit, clears the ready bit and then toggles
the error bit:

```lanternfly
sub adjustFlags()
    statusFlags = statusFlags or errorMask
    statusFlags = statusFlags and not readyMask
    statusFlags = statusFlags xor errorMask
end
```

Each statement has a distinct purpose:

| Step | Calculation | Stored bits |
| ---- | ----------- | ----------- |
| initial value | `readyMask` | `%00000001` |
| set error | `%00000001 or %00000010` | `%00000011` |
| clear ready | `%00000011 and %11111110` | `%00000010` |
| toggle error | `%00000010 xor %00000010` | `%00000000` |

`or` sets every bit present in the mask. Integer `not readyMask` flips all
eight bits of the `u8`, producing `%11111110`; `and` then preserves every bit
except the ready position. `xor` flips the masked bit: a one becomes zero, and
a zero would become one.

Testing a mask ends with a comparison:

```lanternfly
errorSeen = (statusFlags and errorMask) <> 0
```

The integer `and` first clears every bit except the error position. The result
is either `%00000010` when the error bit is set or zero when it is clear. The
comparison converts that integer result into an ordinary Boolean.

## Grouping mixed expressions

Parentheses bind first. They are especially useful when one expression mixes
integer masks with Boolean conditions:

```lanternfly
alarm = (statusFlags and errorMask) <> 0 and deviceReady
```

Evaluation has three stages:

1. `statusFlags and errorMask` combines integer bits.
2. `<> 0` converts the masked result to `boolean`.
3. The final `and` combines that Boolean with `deviceReady`.

Arithmetic binds before comparisons, and comparisons bind before Boolean
`and`, `xor` and `or`. Parentheses make the integer part visible without
requiring the full precedence table to be recalled. Book Two, Chapter 4 lists
the complete order.

## Complete program

The complete module applies the three forms of Boolean work. With a change of
230 and a ready device, `assessChange` sets both `changeIsLarge` and
`shouldRecord`. `assessAverage` receives a zero item count, so short-circuit
evaluation leaves `highAverage` false without dividing. `inspectStatus` finds
the initial error bit clear. After `adjustFlags`, all eight status bits are
zero.

<<< @/lanternfly-book/book1/code/04-comparisons.txt{lanternfly}


## Exercise

1. Why is `itemCount > 0` placed before the division in the guarded-average
   expression?

Answer: Boolean `and` skips its right operand when the left operand is false.
With a zero count, the guard produces false before the division is reached.

## Chapter summary

- Comparisons produce `boolean` values.
- `and` requires both conditions, `or` requires at least one, `xor` requires
  exactly one and `not` reverses a Boolean.
- Boolean `and` and `or` may skip their right operand; the skipped expression
  performs no operation.
- Integer `or` sets masked bits, `and not` clears them, `xor` toggles them and
  `and` isolates them for testing.
