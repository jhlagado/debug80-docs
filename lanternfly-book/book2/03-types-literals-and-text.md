---
layout: default
title: "Types, Literals and Strings"
parent: "Lanternfly Book 2 — Language Reference"
nav_order: 3
---

# Types, Literals and Strings

Lanternfly makes the size and signedness of every scalar visible in its type.
That precision lets the same source retain its numerical meaning across
different targets.

## Scalar types

| Type           | Meaning                     |           Size |
| -------------- | --------------------------- | -------------: |
| `u8`           | unsigned 8-bit integer      |         1 byte |
| `i8`           | signed 8-bit integer        |         1 byte |
| `u16`          | unsigned 16-bit integer     |        2 bytes |
| `i16`          | signed 16-bit integer       |        2 bytes |
| `u32`          | unsigned 32-bit integer     |        4 bytes |
| `i32`          | signed 32-bit integer       |        4 bytes |
| `boolean`      | `true` or `false`           |         1 byte |
| `near address` | opaque near machine address | target-defined |
| `far address`  | opaque far machine address  | target-defined |

`boolean` is not an integer type. Its stored representation is exactly zero
for `false` and one for `true`, and comparisons and Boolean operators always
produce those canonical values. A native provider that supplies another
representation causes `F-INVALID-BOOLEAN`.

Opaque addresses support assignment and equality only with the same address
class. Source code cannot perform address arithmetic, index through an opaque
address, convert between near and far addresses, derive an address from
storage, or derive storage from an address.

## Ordinal types and ranges

Integers, enums and subranges are ordinal types: each has a finite ordered
domain. That domain can govern assignment checks, array indices, `select`
cases and counted loops.

An enum declares a nominal type with an explicit integer representation:

```lanternfly
enum Colour as u8
    red
    green
    blue
end
```

The first member has ordinal zero and later members follow in declaration
order; the last ordinal must fit the declared integer representation. Members
enter the surrounding value scope and need no qualification. All fixed-width
integers share the integer root family, while each enum begins a distinct
family and a subrange belongs to its host's family. Unrelated enums therefore
remain incompatible even when their representation and member count match.
Converting an enum to its representation exposes the ordinal; converting an
integer to an enum checks that a member exists.

A subrange gives a name to part of an integer or enum domain:

```lanternfly
range ScreenColumn as u8 = 0 until 32
range WarmColour as Colour = red to blue
```

`to` includes its upper endpoint and `until` excludes its boundary. A subrange
keeps its host representation but is a distinct nominal type. Its lower and
inclusive upper endpoints belong to the host domain. An exclusive integer
boundary may be one beyond the host's maximum because that boundary is not a
member; an enum boundary must still name a host member. After normalization,
the subrange must contain at least one value. Values entering it are checked;
a known failure is a compile error and a dynamic failure causes `F-RANGE`
before the destination changes.

A subrange widens silently to its host type. An integer subrange therefore
uses its host's arithmetic rules, while an enum subrange retains its enum's
non-arithmetic operations. Enums support assignment, all six comparisons,
`select`, counted loops and array indexing within the same nominal family.
They do not support integer arithmetic or bitwise operators.

Ranges are type and grammar forms, not runtime values. They cannot be stored,
passed or returned. An enum or subrange accepts all-zero initialization only
when its domain contains ordinal zero.

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

## String literals

A double-quoted literal contains nonzero payload bytes for a `string[N]`:

```lanternfly
const title as string[10] = "LANTERNFLY"
var prompt as string[6] = "READY?"
```

Direct characters range from ASCII space through `~`. Character escapes are
accepted except `\0` and `\x00`. An embedded zero, physical newline,
non-ASCII character or payload above 65,534 bytes is invalid. When a literal
initializes, assigns to or appends to string storage, the destination capacity
must hold its payload. The string representation supplies its own length
header and terminator.

## Strings

`string[N]` is Lanternfly's one text type. It stores text with a fixed payload
capacity:

```lanternfly
var playerName as string[24]
var contactName as string[24]
var contactCity as string[16]
```

`N` is a positive constant from 1 through 65,534 and is part of the type. The
capacity chooses the representation at compile time:

| Capacity           | Length header                           | Payload begins | Exact size |
| ------------------ | --------------------------------------- | -------------: | ---------: |
| 1 through 254      | `u8`; 255 is reserved                   |       offset 1 |    `N + 2` |
| 255 through 65,534 | target-endian `u16`; 65,535 is reserved |       offset 2 |    `N + 3` |

A length of 255 or more therefore implies a long string. The capacity, rather
than the current length, fixes the form: `string[255]` remains long even when
it is empty.

The payload contains no zero byte, and a zero terminator always follows its
current length. Bytes after that terminator are unspecified. All-zero storage
is a valid empty string.

The representation is sealed. No source path can select the length header,
payload cells or terminator. This keeps the count, payload and terminator in
step: source code cannot update one while forgetting the others.

## String operations

All six comparisons compare payload bytes as unsigned values from left to
right and stop at the first difference or terminator:

```lanternfly
if leftText < rightText then
    order = -1
end
```

Equality compares content rather than storage identity. Two strings may have
different capacities, and a string literal may appear on either side of any
comparison. Comparison uses content directly; unlike assignment, it does not
require the literal to fit the other operand's capacity.

`length(text)` returns the payload length as `u16`. It reads the string's one-
or two-byte header without scanning the payload, and folds a literal call at
compile time.

Assignment from a literal or another string checks that the content fits
before changing the destination. `append(destination, source)` accepts a
string, literal or one nonzero `u8` byte. A dynamic overflow or zero byte
causes `F-RANGE` before any destination write. `clear` restores the empty
all-zero representation.

At a native boundary, the maintained terminator lets a routine consume the
payload directly as zero-terminated bytes. This is an ABI property, not a
second source type or a source-level pointer conversion. An ordinary `u8`
array has no equivalent guarantee.

Counted strings are aggregate storage.
[Chapter 9](09-routines.md#aggregate-parameters) defines their exact-capacity
parameter and alias forms, together with the restrictions on returns and local
ownership. Byte indexing, slicing, capacity-generic parameters and deliberate
truncating copy remain deferred.

The optional standard text modules have two narrow exceptions to the
exact-capacity parameter rule. `writeText` may read a literal or `string[N]`
path of any capacity, while `readLine` may write a `string[N]` path of any
capacity. Their temporary carriers are not source-level references or general
parameter forms.
[Chapter 10](10-modules-and-programs.md#standard-text-modules) introduces the
module before Chapter 11 describes its target binding.
