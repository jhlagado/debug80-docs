---
layout: default
title: "Values and Constants"
parent: "Programming Nucleus"
nav_order: 2
---

# Values and Constants

A program often begins with facts rather than storage: a screen has a fixed
number of rows, a protocol assigns a byte value to a command and a feature is
either enabled or disabled. Nucleus represents those facts with constants.

```nucleus
const rows = 4
const columns = $08
const enabled = true
const stepBack = -1
assert rows * columns = %100000
```

The initializer determines a scalar constant's type. `enabled` is Boolean.
The other constants are **exact integers**: the compiler retains their
mathematical values and chooses a stored integer type each time they are used.
This lets `rows` fit a `u8` use in one place and a `u16` use in another.

## Five scalar types

Nucleus has four integer types and one Boolean type.

| Type      |                 Values |
| --------- | ---------------------: |
| `u8`      |          0 through 255 |
| `u16`     |       0 through 65,535 |
| `i8`      |       -128 through 127 |
| `i16`     | -32,768 through 32,767 |
| `boolean` |      `false` or `true` |

Unsigned types suit byte values, sizes and addresses within a bounded object.
Signed types suit quantities that may cross zero. A Boolean is not an integer:
Nucleus does not treat zero as false or one as true.

Decimal literals need no prefix. `$` introduces hexadecimal and `%` introduces
binary. A character literal such as `'A'` has the byte value 65. These forms all
describe integers; the surrounding use chooses a suitable type.

## Checked conversion

Nucleus permits only value-preserving implicit conversions: `u8` to `u16`,
`u8` to `i16` and `i8` to `i16`. Other conversions must be visible:

```nucleus
var byteValue as u8 = u8(wordValue)
```

`u8(...)`, `u16(...)`, `i8(...)` and `i16(...)` check the value at run time
when it is not already known. A value outside the destination range causes a
safety trap; it is never silently truncated. When the compiler knows the value
is out of range, it rejects the source instead.

## Assertions check the design

`assert` requires a Boolean constant expression. It emits no target code.
The declaration above records that the chosen dimensions multiply to 32. If a
later edit changes one constant but not the relationship, compilation stops at
the assertion.

The companion program combines all three literal bases, a character value, a
negative exact constant and a checked conversion. It finishes with `observed`
equal to 97.

<<< @/nucleus/book1/examples/02-values.nu{nucleus}

## Summary

- Scalar constants infer Boolean or exact-integer values.
- Exact integers adopt a suitable stored integer type at each use.
- Explicit integer conversion checks the mathematical value.
- `$` and `%` introduce hexadecimal and binary literals.
- `assert` checks a Boolean constant expression without generating code.

The governing rules are in the specification chapters on
[source text](../language/03-source-text-and-lexical-rules.md),
[types](../language/06-types.md) and
[declarations](../language/08-constants-and-declarations.md). The checked
companion is [`02-values.nu`](examples/02-values.nu).
