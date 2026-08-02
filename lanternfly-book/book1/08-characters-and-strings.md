---
layout: default
title: "Characters and Fixed-Capacity Strings"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 8
---

# Characters and Fixed-Capacity Strings

Text is byte data with one extra fact to record: where it ends. Chapter 2's
character literals give the bytes readable spellings (`'H'` is exactly the
byte 72), so a `u8` array can hold text-shaped bytes. But an array's count
describes its capacity, and nothing in it records how much of that capacity
is currently meaningful. Lanternfly's string type carries that fact itself:

```lanternfly
var playerName as string[12]
```

## The counted layout

`string[12]` is a counted string. The capacity is
part of the type, and the layout is as concrete as any array's: one length
byte, twelve payload cells, and a zero byte after the current payload, for
exactly fourteen bytes settled at compile time. There is no allocator and no
hidden buffer; the declaration is the cost. A capacity from 255 through
the maximum of 65,534 widens the length field to two bytes, `N + 3` in
all, and nothing else changes —
though a capacity that large is a declared dependency: the module states
`import "standard/long-strings.lafy"` at its top; chapter 12 explains
capability imports.

The trailing zero byte is the _terminator_, and every string operation
maintains it, so the payload is always valid NUL-terminated text. A firmware
or platform routine that requires the classic C convention can read the
bytes as they sit — no terminator scan to find the end, no terminator to
insert, no payload to copy — while `length` never scans for the
zero: it reads the stored count and returns it as a `u16`.

## Literals, copies and growth

A double-quoted literal supplies text wherever it fits:

```lanternfly
var greeting as string[12] = "HELLO"

sub renameGuest()
    playerName = greeting
    append(playerName, '!')
end
```

Assignment copies content, not identity, and the capacities of source and
destination need not match — the copy is checked instead. A source the
compiler can see is rejected at compile time when it cannot fit; a runtime
copy or `append` that would overflow invokes the range-fault service before
any destination byte changes, the same guarantee an array's bounds check
gives.

`append` grows a string in place, by another string, a literal or one
nonzero byte. Repeated appends build a line piece by piece:

```lanternfly
sub buildStatusLine()
    clear(statusLine)
    append(statusLine, "MODE ")
    append(statusLine, u8('0' + reportDigit))
end
```

With `reportDigit` at 2, the finished text is `MODE 2`: `clear` empties the
string, the literal supplies five bytes, and `'0' + reportDigit` computes
the digit's character byte. The `u8(...)` wrapper is there because Chapter
3's byte addition widens to `u16`, and the byte append takes exactly one
`u8`.

## Comparison and the empty string

All six comparison operators examine the payload bytes, so
`playerName = greeting` as a condition tests whether the text matches, not
whether two names share storage. Shorter text compares before longer text
with the same prefix, and capacities play no part.

All-zero storage is the valid empty string. A module string therefore needs
no initializer (it simply begins empty), and `clear` restores that state at
any time.

## The sealed representation

The length byte, the payload cells and the terminator have no names, and no
index reaches them. The whole arrangement depends on three facts staying in
agreement: the stored count, the nonzero payload, and the terminator sitting
immediately after it. One mismatch shows why the sealing matters: if a
payload byte could change without the count and terminator moving with it,
`length` would report one string, comparison would read another, and the
next `append` would write somewhere between them.

Assignment, `append`, `clear`, comparison and `length`
are the built-in interface, and each operation preserves what the others
rely on. Chapter 13's portable text services extend the family, reading
and writing whole strings at the program's edge through compiler-managed
carriers, without ever exposing the representation.

A `u8` array maintains none of these invariants, so it never converts into
a string, and a string is not an array of its bytes. Byte storage under other
text conventions — a high-bit terminator, machine-specific display codes —
remains ordinary `u8` data under an explicit service contract that assigns
each byte its meaning.

## Strings in tables

Strings sit in arrays like any other fixed-size data. `string[12][8]`
declares eight strings of capacity twelve (the capacity brackets belong to
the element type), and each element supports the full string interface
through its indexed path. The next chapter adds the remaining location: a
string as one named field inside a record, occupying its exact bytes at a
fixed offset.

## Complete program

The [chapter listing](/lanternfly-book/book1/code/08-strings.txt)
copies a greeting with a checked assignment, appends a byte, builds a
status line from a literal and a computed digit, and compares two names by
content. `playerName` finishes as `HELLO!` and `statusLine` as `MODE 2`.

## Exercises

1. What is the exact size of `var name as string[40]`, and where does
   the terminator sit when the string holds five bytes?
2. `append` would push a string past its capacity at runtime. What
   happens, and what state is the string left in?
3. Comparing a `string[12]` with a `string[24]` is legal. Why does the
   capacity difference not matter?

Answers: 42 bytes — one length byte, forty payload cells, one
terminator — with the terminator at offset 6 after five payload bytes;
the range-fault service runs before any destination byte changes, so
the string keeps its previous valid content; comparison examines the
current payload bytes, and capacities play no part.

## Chapter summary

- `string[N]` is a counted string of exact size `N + 2` through capacity
  254 and `N + 3` beyond, with its capacity in the type and no allocator.
- The payload always ends with a zero byte, so C-convention services read
  it directly and `length` reads the count without scanning.
- Assignment and `append` are checked copies: an overflow faults before any
  destination byte changes.
- Comparisons examine text content; all-zero storage is the valid empty
  string.
- The representation is sealed — assignment, `append`, `clear`, comparison
  and `length` are the built-in interface, and later services reach
  strings only through checked operations.

A string keeps values of one kind in order. In the next chapter we group
values of different kinds into records, and lay them out byte by byte.
