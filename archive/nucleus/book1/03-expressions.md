---
layout: default
title: "Expressions"
parent: "Programming Nucleus"
nav_order: 3
---

# Expressions

Suppose a controller must reduce a signed measurement and also test a hardware
mask. Both jobs use integers, but they depend on different details: signed
division for the measurement and bitwise operations for the mask.

```nucleus
observed = u16(i16(left mod right) + 2)
observed = observed + u16((not mask) xor $FF)
```

Nucleus evaluates operands from left to right. Parentheses change grouping,
not that order. Calls and checked accesses in an earlier operand therefore
happen before anything in a later operand.

## Arithmetic keeps its type

The arithmetic operators are `+`, `-`, `*`, `/` and `mod`. Division truncates
toward zero. A signed remainder has the dividend's sign, so `-17 mod 5` is
`-2`. Division or remainder by zero is a safety trap. The compiler rejects a
constant zero divisor before generating the program.

Signed and unsigned operands may mix only when a value-preserving common type
exists. For example, `u8` and `i8` can meet in `i16`. `u16` and `i16` cannot:
neither type contains every value of the other, so source must choose and write
a checked conversion.

## Boolean and bitwise operations

Comparisons produce `boolean`. The operators `and` and `or` short-circuit when
their operands are Boolean: `false and right` never evaluates `right`, and
`true or right` never evaluates it.

The same words also operate on integers, where they combine every bit and
evaluate both operands. Integer `not` complements every bit. `xor` is
integer-only, avoiding a Boolean operator that eagerly evaluates both arms
beside two short-circuit operators.

This makes grouping important:

```nucleus
not mask and readyMask
(not (mask and readyMask))
```

The first complements `mask` before `and`. The second complements the complete
intersection. Parentheses are the clearest way to show which operation you
intend.

## Precedence

Postfix field and index selection bind most tightly, followed by unary
operators, multiplication and division, addition and subtraction, comparisons,
then `and`, and finally `or` and `xor`. Binary operators at one level associate
from left to right. Comparisons do not chain: write
`minimum <= value and value <= maximum`.

The companion program uses signed `mod`, Boolean short-circuiting, integer
complement and `xor`. Its final value is 90.

<<< @/nucleus/book1/examples/03-expressions.nu{nucleus}

## Summary

- Operands are evaluated from left to right.
- Arithmetic is typed; questionable conversions must be explicit and checked.
- Boolean `and` and `or` short-circuit.
- Integer `and`, `or`, `xor` and `not` operate on bits.
- Division truncates toward zero; `mod` keeps the dividend's sign.

See [expressions](../language/09-expressions.md) and
[safety failures](../language/15-safety-failures-and-traps.md). The checked
companion is [`03-expressions.nu`](examples/03-expressions.nu).
