---
layout: default
title: "Characters and Fixed-Capacity Strings"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 8
---

# Characters and Fixed-Capacity Strings

Chapter 2 used character literals such as `'H'` and `'>'`. Each literal is one
byte. The text `HELLO` needs five character bytes plus a way to record
that five of the available bytes currently belong to the text.

An ordinary byte array has a fixed element count, but it does not record a
current text length. Lanternfly uses a fixed-capacity string for that job:

```lanternfly
var playerName as string[12]
```

The capacity 12 is the maximum payload. The current length may be anything from
zero through 12. Both facts are needed: capacity determines how much storage
the program reserves, while length determines how much text the string
currently contains.

## Capacity and current length

`string[12]` reserves fourteen bytes:

- one byte for the current length;
- space for up to twelve payload bytes;
- one further byte so the longest payload can still be followed by zero.

The complete size is known during compilation: `12 + 2`, or 14 bytes. No
allocator runs when text is assigned or appended.

Suppose the string contains `HELLO`. Its relevant bytes are:

| Offset | Stored value | Meaning |
| -----: | ------------ | ------- |
| 0 | 5 | current payload length |
| 1 | `'H'` | first character |
| 2 | `'E'` | second character |
| 3 | `'L'` | third character |
| 4 | `'L'` | fourth character |
| 5 | `'O'` | fifth character |
| 6 | 0 | terminator immediately after the payload |
| 7–13 | unspecified | storage beyond the current terminator |

The terminating zero moves as the string grows. At the maximum length of 12,
the payload occupies offsets 1 through 12 and the terminator occupies offset
13. The zero is not part of the text and is not included in `length`.

The stored length and terminator support two common forms of text access.
`length(playerName)` reads the length byte and returns 5 as `u16`; it does not
scan for the end. A native routine that consumes zero-terminated bytes can stop
at the maintained terminator.

## Empty strings

All-zero storage represents the empty string:

| Offset | Value | Meaning |
| -----: | ----: | ------- |
| 0 | 0 | current length is zero |
| 1 | 0 | terminator follows the empty payload |

A module string without an initializer therefore begins empty. `clear` returns
any writable string to the same all-zero state:

```lanternfly
clear(playerName)
```

The fixed capacity remains 12. Clearing changes the current content, not the
type or amount of storage.

## String literals and assignment

A double-quoted literal supplies several character bytes:

```lanternfly
var greeting as string[8] = "HELLO"
var playerName as string[12]
```

The literal has five payload bytes. It fits both capacities. Assignment copies
the current content:

```lanternfly
playerName = greeting
```

After the assignment, `playerName` has length 5 and contains its own copy of
`HELLO`. A later change to `greeting` would not change `playerName`.

Source and destination capacities may differ because assignment copies the
current payload rather than the unused capacity. The complete payload must fit
the destination. A literal or constant that is too long is rejected during
compilation. When the source length is known only at runtime, the copy checks
the length before writing; an overflow causes the range fault and leaves the
destination unchanged.

After a failed copy, `playerName` still contains its complete earlier value
rather than a truncated prefix.

## Appending text

`append` adds a string, literal or one nonzero `u8` byte to the current payload:

```lanternfly
sub renameGuest()
    playerName = greeting
    append(playerName, '!')
end
```

The two statements change the destination in stages:

| Stage | Content | Length | Terminator offset |
| ----- | ------- | -----: | ----------------: |
| initial `playerName` | empty | 0 | 1 |
| after assignment | `HELLO` | 5 | 6 |
| after append | `HELLO!` | 6 | 7 |

Before writing, `append` checks that the combined payload fits and that a
single-byte source is nonzero. An overflow or zero byte causes the range fault
without changing the destination. The operation then writes the new payload,
updates the count and places zero after the new end.

Several appends can build a line from pieces:

```lanternfly
var statusLine as string[16]
var reportDigit as u8 = 2

sub buildStatusLine()
    clear(statusLine)
    append(statusLine, "MODE ")
    append(statusLine, u8('0' + reportDigit))
end
```

`clear` starts with empty content. The first append stores `MODE ` with length
5. Character `'0'` is byte 48, so adding `reportDigit` equal to 2 produces 50,
the byte for `'2'`. Chapter 3's byte addition widens to `u16`; the explicit
`u8(...)` converts the result back to the one byte required by `append`.

The finished string is `MODE 2`, with length 6 and its terminator at offset 7.

## Comparing text

String comparisons examine current payload bytes. Capacity has no effect on
the result:

```lanternfly
namesMatch = playerName = greeting
```

After `renameGuest`, `playerName` contains `HELLO!` and `greeting` contains
`HELLO`, so the equality comparison produces false. The two strings begin with
the same five bytes, but one has an additional byte.

All six comparison operators are available. Bytes are compared from left to
right as unsigned values. At the first differing byte, that byte determines
the order. When one complete payload is a prefix of the other, the shorter text
comes first, so `HELLO < HELLO!` is true.

## A sealed representation

Correct text operations depend on three values agreeing:

- the stored length;
- the nonzero payload bytes;
- the zero immediately after the payload.

Source code cannot index the internal bytes of a string. If one payload byte
could be changed without updating the other representation values, `length`
might report one text while comparison read another, and the next append might
write at the wrong offset.

Assignment, `append`, `clear`, comparison and `length` update or inspect the
representation as complete operations. A normal `u8` array has none of these
text rules. It remains the appropriate type for device bytes, encoded data and
other layouts where the program or service supplies a different convention.

The sealed representation also means a string does not convert to or from a
`u8` array. Native and standard services receive text through typed string
contracts, covered in Chapters 10, 13 and 16.

## Larger capacities

Capacities from 1 through 254 use the one-byte length layout described above,
for an exact size of `N + 2` bytes.

A capacity from 255 up to 64K uses a two-byte length field and occupies
`N + 3` bytes. Declaring this long form requires:

```lanternfly
import "standard/long-strings.lafy"
```

The source operations remain assignment, `append`, `clear`, comparison and
`length`. The capacity fixes the layout when the storage is declared; a short
current value inside a long-capacity string still uses the long layout.

## Strings inside other aggregates

Strings have fixed sizes, so they can be array elements and record fields:

```lanternfly
var recentNames as string[12][4]
```

The capacity brackets belong to the element type, and the final brackets give
the array count. This declaration reserves four `string[12]` values. Each
occupies fourteen bytes, so the array occupies 56 bytes.

An indexed path supports the same string operations:

```lanternfly
recentNames[0] = playerName
append(recentNames[0], '!')
```

Chapter 9 places a string at a named offset inside a record.

## Complete program

The complete module copies `HELLO` from an eight-character string into a
twelve-character destination and appends `!`, leaving `playerName` as
`HELLO!`. It builds `MODE 2` in `statusLine`. The final comparison leaves
`namesMatch` false because `HELLO!` and `HELLO` have different lengths.

<<< @/lanternfly-book/book1/code/08-strings.txt{lanternfly}


## Exercise

1. What is the exact size of `string[12]`, and where is the terminator when the
   current content is `HELLO`?

Answer: the string occupies 14 bytes. `HELLO` has five payload bytes at offsets
1 through 5, so the terminator is zero at offset 6.

## Chapter summary

- `string[N]` has a fixed capacity and a separate current length.
- A short string occupies `N + 2` bytes: one length byte, payload storage and
  room for a terminating zero.
- Assignment and `append` check the complete new payload before changing the
  destination.
- Comparisons examine text content rather than capacity or storage identity.
- The sealed representation keeps the length, payload and terminator in
  agreement.
