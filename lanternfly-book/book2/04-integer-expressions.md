---
layout: default
title: "Integer Expressions and Conversions"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 4
---

# Integer Expressions and Conversions

Integer arithmetic is one of the easiest places for a cross-target language
to become unpredictable. Lanternfly therefore fixes integer width,
signedness and evaluation rules across every backend. A backend cannot inherit
the promotion rules of its host language or target CPU.

## Literal typing

An integer literal begins as an exact mathematical value. It adopts an
expected integer type when it fits, with that expectation coming from:

- constant and variable initializers;
- assignment destinations;
- scalar arguments and returned values;
- the value passed to `fill`;
- counted-loop starts.

An exact literal that does not fit the expected type is a compile error.
Explicit conversion requests low-bit truncation:

```lanternfly
var wrapped as u8 = u8(300)  // 44
```

An expression containing only literals defaults to `i16` when no expected
type is available. A value outside that range requires an explicit conversion.

Unary minus treats an immediately following exact literal as one negative
value. This permits the complete minimum value of each signed type:

```lanternfly
const byteMinimum as i8 = -128
const wordMinimum as i16 = -32768
const longMinimum as i32 = i32(-2147483648)
```

Other unary expressions type their operand before applying the operator.

## Compatible operand types

Matching operand types use the result table below. A narrower operand may
widen to the type already present on the other side when that conversion
preserves every source value:

| Source | Permitted wider operand type |
| ------ | ---------------------------- |
| `u8`   | `u16`, `i16`, `u32`, `i32`   |
| `i8`   | `i16`, `i32`                 |
| `u16`  | `u32`, `i32`                 |
| `i16`  | `i32`                        |

The compiler never invents a third common type. `u8 + u16` operates as
`u16 + u16`; `u8 + i8` and `i16 + u16` require an explicit conversion.

## Result types

| Operator             | `u8` result  | `i8` result  | 16/32-bit result |
| -------------------- | ------------ | ------------ | ---------------- |
| `+`, `*`, `/`, `mod` | `u16`        | `i16`        | operand type     |
| `-`                  | `i16`        | `i16`        | operand type     |
| `and`, `or`, `xor`   | operand type | operand type | operand type     |
| `shl`, `shr`         | left type    | left type    | left type        |
| `^`                  | `u16`        | `i16`        | base type        |
| comparisons          | `boolean`    | `boolean`    | `boolean`        |

The `u8 - u8` rule covers the mathematical range -255 through 255. It supports
coordinate differences without first converting both operands.

Because each operator selects its own result type, written order can affect
the intermediate types:

```lanternfly
elementNumber = row * 20 + column
delta = x - y + adjustment
```

With `u8` values, the multiplication becomes `u16`, while the subtraction
becomes `i16`. In contrast, `x + 1 - y` performs the addition as `u16` and
the subsequent subtraction under `u16` rules. A calculation requiring a
signed final range can state it directly:

```lanternfly
delta = i16(x) + 1 - i16(y)
```

Once selected, the result width also determines wrapping.

## Unary operations

Unary `+` retains the operand type.

Unary `-`:

- produces `i16` from `u8` or `i8`;
- retains `i16` or `i32`;
- requires an explicit signed conversion for `u16` or `u32`.

Integer `not` retains the operand type and complements every bit.

## Explicit integer conversions

Writing an integer type like a call performs an explicit conversion:

```lanternfly
i32(signedValue) + i32(unsignedValue)
```

- Signed widening sign-extends.
- Unsigned widening zero-extends.
- Narrowing retains the low destination-width bits.
- Same-width signedness conversion preserves the bit pattern.
- A signed destination interprets its bits as two's complement.
- Converting an exact integer takes its residue modulo the destination width.

Conversions between `boolean` and integers are deferred.

## Division and remainder

Division truncates toward zero. `mod` satisfies:

```text
left = (left / right) * right + (left mod right)
```

A constant zero divisor is a compile error. A runtime zero divisor causes
`F-DIV-ZERO`.

## Shifts

The right operand may have any integer type. Lanternfly interprets it as a
mathematical count rather than converting it to the left operand's type.

- `shl` fills low bits with zero.
- Unsigned `shr` fills high bits with zero.
- Signed `shr` fills high bits with the sign bit.
- A count at least as large as the width produces zero for `shl` and unsigned
  `shr`, or all sign bits for signed `shr`.
- A negative count is a compile-time error or `F-NEGATIVE-SHIFT`.

## Power

The exponent in `base ^ exponent` may have any integer type and must be
non-negative. The result type stays fixed through repeated products.
`x ^ 0` is one in that result type, including `0 ^ 0`.

A negative exponent is a compile-time error or `F-NEGATIVE-POWER`.

## Boolean and binary operators

`not`, `and`, `xor` and `or` accept either Boolean operands or compatible
integer operands:

```lanternfly
visible = active and onScreen
maskedFlags = flags and visibleMask
```

Boolean `and` and `or` short-circuit. Boolean `xor` evaluates both operands.
Integer forms always evaluate both operands and combine their bits.

A condition must have type `boolean`; integers do not convert to conditions:

```lanternfly
if (flags and visibleMask) <> 0 then
    drawActor()
end
```

## Precedence and associativity

From highest to lowest:

1. calls, indexing, field access and parentheses;
2. power;
3. unary arithmetic;
4. multiplication, division and `mod`;
5. addition and subtraction;
6. `shl` and `shr`;
7. comparisons;
8. `not`;
9. `and`;
10. `xor`;
11. `or`.

Power associates right to left. Every other binary operator associates left
to right. Comparisons bind more tightly than `not`, so `not x = y` means
`not (x = y)`.

## Target-address constant expressions

Placement and absolute external bindings need to express addresses that may
not fit the ordinary default `i16`. In this separate constant-expression
context, exact literals and the results of `size`, `count`, `offset`, and
integer-domain `lower` and `upper` remain mathematical through:

```text
unary +  unary -  +  -  *  /  mod  ^  shl
```

`shr`, `and`, `or` and `xor` need at least one typed operand because they
depend on a finite width. A typed constant or explicit conversion ends exact
evaluation in its containing operation.

The target profile validates the final address against its address space,
alignment and representation. This permits `$8000` on a 16-bit profile even
though the literal does not fit default `i16`.
