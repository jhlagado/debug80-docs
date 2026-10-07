---
title: "Taking the Measure"
parent: "Programming Basie"
nav_order: 11
nav_exclude: true
search_exclude: true
---

# Taking the Measure

Four readings have the values 12, 18, 16 and 14. Their total is 60, their mean is 15, and in sorted order they run 12, 14, 16, 18. This chapter's program, a small readings analyser, works those out.

The program has two kinds of routine. One reads the readings and calculates from them, the other rearranges them, and the declarations show which is which. Each calculation has to settle how wide its arithmetic needs to be, what happens when a result doesn't fit and whether a whole number will do.

## Counting in a wider type

The readings are records with a `u16` value and a flag saying whether each reading can be used, the same `Reading` record as in Chapter 4. A routine that takes a read-only open array calculates the total:

```basie
sub total(values as Reading[]) as u32
```

The result is a `u32` because a total can be much larger than any single reading. Four readings can't overflow sixteen bits, but forty large ones could. The routine widens each usable reading to `u32` before adding it:

```basie
sum = sum + u32(values[index].value)
```

The widening has to come *before* the addition, because Basie integer arithmetic is done in the type of its operands. If the program added two `u16` values and then widened the result, the addition would happen in sixteen bits, and a total that overflowed would be wrong before the conversion.

## Wrapping

When integer arithmetic produces a result too large for its type, it wraps around. Adding 1 to a `u8` holding 255 gives 0. Subtracting 1 from a `u16` holding 0 gives 65,535. That's how the Z80 does arithmetic, and Basie keeps that behaviour because it's fast and predictable.

Wrapping isn't a memory-safety problem. Every value it produces is a valid value of the type, and no storage outside the variable is touched. It can still be a correctness problem. If a total must never be wrong, choose a type wide enough for the largest total you'll see or check the inputs before the arithmetic. Chapter 14 shows a program doing the second.

Conversion is checked. Converting with `u8(...)` either gives the same number or traps with `narrowing`, as Chapter 2 described. Arithmetic wraps and conversion checks.

## Mixing types

An operation can combine two different integer types when one of them widens to the other without losing anything. A `u8` and a `u16` can be added, giving a `u16`. A `u16` and an `i16` can't, because neither holds every value of the other: the `u16` can be 40,000 and the `i16` can be -3. Basie has no rule for choosing between them, so you convert one yourself, usually to `i32`, which holds every value of both:

```basie
var a as u16 = 40000
var b as i16 = -3
assert i32(a) + b = 39997
```

Once `a` is an `i32`, `b` widens to match and the sum is calculated in 32 bits.

## Sorting complete records

The sorting routine's parameter is writable, so its declaration shows every caller that it changes the array:

```basie
sub sort(var values as Reading[])
```

It's an insertion sort. Starting with the second record, it takes each record out into a local variable, `saved`, shifts the larger records before it one place to the right and puts `saved` into the gap. Each of these moves copies a whole `Reading`, so a value and its usable flag always stay together. The writes go through the alias, so the caller's array ends up sorted.

The inner loop's condition does two jobs:

```basie
while at > 0 and values[at - 1].value > saved.value
```

When `at` reaches zero there's nothing left to compare. `at` is a `u16`, so `at - 1` would wrap to 65,535 and the index would trap, but the right side is never evaluated. For Boolean operands `and` stops as soon as its left side is false, so when `at > 0` fails the indexing on the right never happens. This is the ordinary way to protect an index in a condition, and Basie guarantees the left-to-right order it depends on. Every access that does happen is still bounds-checked.

## A fractional result

The mean of the four readings is 60 divided by 4, which is exactly 15. Change one reading and the mean might be 15.25, which integer division can't represent. Integer division truncates toward zero, so 61 divided by 4 gives 15, and converting that 15 to a fractional type afterwards can't bring back the lost quarter.

Convert *before* dividing instead:

```basie
var mean as f32 = f32(sum) / f32(sampleCount)
```

`f32` is Basie's floating-point type, a standard single-precision number in four bytes. With both operands converted, the division is done in floating point and keeps the fraction.

An `f32` holds about seven significant decimal digits, and most decimal fractions, such as 0.1, have no exact binary form, so results are rounded to the nearest value the type can hold. Converting a `u32` or `i32` to `f32` may round for the same reason, which is why that conversion has to be written. Very small results are rounded down to zero.

Basie's `f32` holds only ordinary finite numbers. Many languages have special values for infinity and "not a number", and Basie has neither. Dividing by zero traps with `division-by-zero` and a result too large for `f32` traps with `float-overflow`, so no special value can spread silently through later calculations. Converting an `f32` back to an integer truncates toward zero and traps with `narrowing` if the result doesn't fit.

Floating point is for measurements, where a tiny rounding error doesn't affect the answer. For money, counts and anything else that must be exact, keep to integers. Store prices in cents, for example, and format them with a decimal point only when you print them.

## From a calculation to a report

The program uses the library's `appendF32` to turn the mean into text:

```basie
appendF32(report, mean, 1) else fail
```

The last argument is the number of decimal places, here one. The routine rounds to that many places and appends the digits to `report`, failing if the string has no room. The program then sends the report to the console:

```text
Mean: 15.0
```

Here is the complete analyser:

<<< @/basie/book1/examples/READINGS.BSI{basie}

`main` totals the readings and checks that the total is 60. It sorts them and checks that the first is now 12 and the last 18. Then it calculates the mean, builds the report and prints it.

Dividing by `sampleCount` gives the right mean only because all four readings are marked usable. `total` skips unusable readings, but the division still uses the full count of four. A program that discards readings has to count the ones it includes and divide by that count. If no reading is usable, that count is zero, and you have to decide what the program reports before it divides, because `f32` division by zero traps.

## Other integer operations

Integer division and `mod` both work toward zero, and the result of `mod` takes the sign of the number being divided. So `-17 / 5` is -3 and `-17 mod 5` is -2.

`and`, `or`, `xor` and `not` work on Booleans and on integers. On Booleans they combine truth values, with `and` and `or` stopping early as in the sort. `xor` always evaluates both sides. On integers they work bit by bit, which is how programs test and set individual flags in a byte. `shl` and `shr` shift bits left and right, keeping the type of the value being shifted. Shifting a signed value right keeps its sign bit, so `-8 shr 1` is -4. Shifting an unsigned value right brings in zeros.

This example uses several of them:

<<< @/basie/book1/examples/03-expressions.BSI{basie}

`-17 mod 5` is -2, and adding 2 gives 0. `$5A` is `%01011010`, so `not mask` is `%10100101`, and `xor $FF` flips every bit back to `$5A`, which is 90. The total is 90.

The [numeric checks](examples/NUMBERS.md) program tests shifts, wrapping and mixed-type arithmetic in the same way. When an expression combines arithmetic, comparisons and bit operations, parentheses make the grouping obvious to the next person who reads it, even when the precedence rules would give the same answer.

## Things to try

Change the last reading from 14 to 15. The total becomes 61, the mean becomes 15.25 and the report, rounded to one decimal place, prints `Mean: 15.3`. Update the first assertion to match.

Then put the 14 back but mark that reading unusable by changing its `true` to `false`. The total drops to 46 and the program prints `Mean: 11.5`, though the mean of the three usable readings is about 15.3. Fix it by counting the usable readings in `total`'s loop, or in a second routine, and dividing by that count.

## Summary

- Integer arithmetic happens in the type of its operands. Widen before the operation, not after.
- Integer arithmetic wraps on overflow. That's safe for memory but may be wrong for your program, so choose types wide enough.
- Mixed operations need one type that holds every value of both. Otherwise convert one operand explicitly.
- In `a and b`, `b` is evaluated only when `a` is true. That makes `at > 0 and values[at - 1]` safe.
- `f32` is single-precision floating point with finite values only. Division by zero and overflow trap.
- Convert integers to `f32` before dividing to keep the fraction. Use integers for exact quantities.
- `appendF32` formats a floating-point number to a chosen number of decimal places.
- Integer `and`, `or`, `xor`, `not`, `shl` and `shr` work on bits. Signed right shifts keep the sign.
