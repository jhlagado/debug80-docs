---
layout: default
title: "Types, Literals and Static Text"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 3
---

# Types, Literals and Static Text

Lanternfly makes the size and signedness of every scalar visible in its type.
That precision lets the same source retain its numerical meaning across
different targets.

## Scalar types

| Type | Meaning | Size |
|---|---|---:|
| `u8` | unsigned 8-bit integer | 1 byte |
| `i8` | signed 8-bit integer | 1 byte |
| `u16` | unsigned 16-bit integer | 2 bytes |
| `i16` | signed 16-bit integer | 2 bytes |
| `u32` | unsigned 32-bit integer | 4 bytes |
| `i32` | signed 32-bit integer | 4 bytes |
| `boolean` | `true` or `false` | 1 byte |
| `near address` | opaque near machine address | target-defined |
| `far address` | opaque far machine address | target-defined |
| `near cstr` | near static C-string view | target-defined |
| `far cstr` | far static C-string view | target-defined |

`boolean` is not an integer type. Its stored representation is exactly zero
for `false` and one for `true`, and comparisons and Boolean operators always
produce those canonical values. A native provider that supplies another
representation causes `F-INVALID-BOOLEAN`.

Opaque addresses support assignment and equality only with the same address
class. Source code cannot perform address arithmetic, index through an opaque
address, convert between near and far addresses, derive an address from
storage, or derive storage from an address.

## Integer literals

Integer literals use decimal, hexadecimal or binary notation:

```lanternfly
42
$2a
%00101010
```

A leading `+` or `-` is a unary operator rather than part of the literal.
Digit separators and octal literals are absent.

An integer literal begins as an exact, untyped value. Expected destination
types and expression rules determine when it adopts a fixed type.
[Chapter 4](04-integer-expressions.md#literal-typing) gives the complete
rules.

## Character literals

A character literal represents one byte:

```lanternfly
'A'
'\n'
'\x7f'
```

Accepted escapes are:

```text
\0  \n  \r  \t  \'  \"  \\  \xHH
```

`HH` contains exactly two hexadecimal digits. The result is an exact,
untyped integer from 0 through 255. Empty, multi-character, non-ASCII and
unterminated character literals are errors.

## Static C strings

A double-quoted literal in an expression creates a static, NUL-terminated byte
sequence:

```lanternfly
const title as near cstr = "LANTERNFLY"
var prompt as near cstr = "READY?"
```

Direct characters range from ASCII space through `~`. Character escapes are
accepted except `\0` and `\x00`; the compiler appends the single terminator.
An embedded zero, physical newline, non-ASCII character or payload above
65,534 bytes is invalid.

The resulting `cstr` is a non-null, read-only view. It carries no hidden
length, capacity, ownership flag or allocation. Assignment copies the view's
target-specific carrier, not the payload bytes. Every `cstr` contract
guarantees immutable, NUL-terminated storage that remains accessible for the
program's lifetime.

## C-string address classes

Stored variables, constants, record fields, exported declarations and routine
results must state `near cstr` or `far cstr`. Unqualified `cstr` uses the
target profile's default class and is permitted for private parameters and
local variables.

A literal adopts an expected address class. Without one, the profile uses its
default class.

The explicit conversions are:

| Form | Operation |
|---|---|
| `near cstr(value)` | identity for near; checked far-to-near conversion |
| `far cstr(value)` | identity for far; permitted near-to-far widening |
| `cstr(value)` | conversion to the profile's default C-string class |

A near-to-far conversion requires a profile that can attach the current
mapping context. A far-to-near conversion must prove representability at
compile time for a constant value; a failing runtime conversion causes
`F-ADDRESS`.

No C-string conversion changes the bytes or their lifetime. C strings do not
convert to or from integers or opaque addresses.

## C-string operations

All six comparisons compare payload bytes as unsigned values from left to
right and stop at the first difference or terminator:

```lanternfly
if leftText < rightText then
    order = -1
end
```

Equality compares content rather than storage identity. Compatible near and
far operands use the permitted near-to-far conversion first.

`length(text)` scans to the terminator and returns the payload length as
`u16`. A literal call folds at compile time.

For text that must change at runtime, use an ordinary `u8` array and track its
occupied length or terminator explicitly. Lanternfly 0.4 provides no implicit
writable-buffer-to-`cstr` conversion.

## Compile-time text positions

Import paths and external substrate symbols also use double-quoted tokens:

```lanternfly
import "display.lf"
extern sub waitForKey() from "ROM_WAIT_KEY"
```

These positions accept only `\"` and `\\`. They decode to compile-time text
and do not allocate a runtime C string.
