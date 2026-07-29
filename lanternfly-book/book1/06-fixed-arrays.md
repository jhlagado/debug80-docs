---
layout: default
title: "Fixed Arrays"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 6
---

# Fixed Arrays

Chapter 5 ended with loops that touch every entry in a table, and
quietly assumed the table. Without arrays the table cannot usefully be built, and the failure is
instructive. A program that needs eight sound samples can declare eight
separate variables (`sample0`, `sample1`, up to `sample7`), but a loop
cannot reach them:
`for index = 0 to 7` has no way to turn the value of `index` into a
choice among eight *names*. And the reason is worth spelling out,
because it deepens something Chapter 1 began. Names are gone by the
time the program runs. The compiler's ledger — which name means which
address — is spent during translation and never reaches the machine;
at runtime there are only addresses. So a runtime choice among eight
storage locations must be made with the tools that survive translation,
and those are numbers and arithmetic. What the loop needs is storage
selectable *by arithmetic*. An array is exactly that — one name for a
complete fixed sequence, indexed by number:

```lanternfly
var samples as u8[8]

sub fillSamples()
    var index as i16

    for index = 0 to count(samples) - 1
        samples[index] = u8(index * 2)
    end
end
```

`samples[0]` receives 0, `samples[1]` receives 2 and the final entry
receives 14. Loops and arrays are a matched pair — this chapter and the
last are really two halves of one lesson — and between them they carry
most of the data a game keeps: tables of actors, rows of tiles, planes
of pixels, histories of positions. From here to the end of the book,
almost every example will have an array in it somewhere.

## The type contains the shape

```lanternfly
var samples as u8[8]
```

`u8[8]` means an array of eight `u8` elements. The count is part of
the type, fixed at compile time, which is the small-machine bargain
again: the compiler can lay the whole thing out as eight consecutive
bytes at a known address, with no allocator, no hidden length field,
no runtime negotiation. What you declared is what exists, exactly —
eight pigeonholes in a row on Chapter 1's long street. Languages with
growable arrays buy their convenience with machinery you would have to
pay for on every target; the fixed array asks you to decide the size,
and repays the decision with storage as cheap and predictable as a
single variable.

Valid indices run from 0 through 7, because Lanternfly arrays are
zero-based. Zero-basing puzzles newcomers — the first entry is entry
number zero? — until you see what an index actually is. It is not a
rank but a *distance*: how many elements stand between the start of
the array and the one you want. The first element is zero elements
from the start, so its index is zero. Under that reading the
arithmetic becomes effortless — the address of an element is the base
plus the distance — and the loop idiom
`for index = 0 to count(samples) - 1` walks precisely the valid
range, first element to last, inclusively, in the manner Chapter 5
drilled.

`count(samples)` produces eight at compile time, and `size(samples)`
produces the exact byte size — also eight here, though the two part
company the moment elements grow wider than a byte:

```lanternfly
const sampleCount as u8 = count(samples)
const sampleBytes as u8 = size(samples)
```

The query inspects the declared type, and writing `count(samples)`
instead of a literal 8 keeps the loop and the declaration joined at
one point: resize the array and every loop over it follows, with no
hunt for stray eights. It is the magic-number lesson of Chapter 2, applied to shapes: the count
already has a name.

## Selecting an entry

```lanternfly
samples[index] = u8(index * 2)
```

Here `index` is `i16` while an array entry is `u8`, so the explicit
conversion from Chapter 2 reappears, recording the deliberate
cross-type store. An ordinary update based on the old `u8` entry
would convert back automatically, as ever.

Underneath, selection is arithmetic. The backend combines the array's
base address, the runtime index and the element size to locate the
destination — base plus index times size, the formula that makes an
array an array. A constant index follows the same rule with the
multiplication done at compile time:

```lanternfly
samples[3] = 10
```

Now the uncomfortable question this chapter cannot dodge: what if
`index` is 9? On a big machine the operating system might catch a
wild access. A Z80 has no such guardian — no memory protection, no
supervisor, nothing between your store and the byte it lands on.
`samples[9]` would compute an address one byte past the array and
write to whatever lives there: another variable, a saved state, your
own machine code. And here is what makes the species truly vicious —
nothing fails *at the store*. The program strides on, apparently
healthy, while some unrelated count now holds nonsense, and the crash
or the glitch arrives minutes later in code that was always innocent.
The victim misbehaves long after the culprit has run, which inverts
every debugging instinct you have.

Lanternfly's answer is layered, and each layer catches what the one
above lets through. A constant out-of-range index is a compile error
— caught before the program exists. A dynamic index is checked at
runtime, unless the compiler can prove it lies inside the array; a
loop bounded by `count(...)` is exactly the kind of proof it looks
for, which means the idiomatic loop pays no checking cost at all —
another quiet reward for writing the standard shape. And when a check
does fail, it invokes the target's bounds-fault service *before* any
load or store, so the mistake announces itself at the boundary, loud
and immediate, rather than corrupting from inside. The wild store is
the small machine's most expensive bug; this is the language spending
its vigilance where the danger actually lives.

## Element size controls the stride

```lanternfly
var scores as u16[5]
```

Each `u16` occupies two bytes, so `scores` occupies ten. Entry 3
begins six bytes after entry 0, and the address calculation
multiplies the index by two. The distance from one element's start to
the next is called the *stride*, and here it simply equals the
element size:

![Each u16 entry occupies two adjacent bytes, so scores[3] begins at byte offset six.](../../assets/images/lanternfly-book/book1/array-stride.svg)

The same rule applies to elements that occupy three, six or another
exact byte count — there is no padding and no rounding to convenient
powers of two. Lanternfly calls this the true stride, and it is a
promise with consequences in both directions. Inward, it means
`size(...)` of an array is always exactly count times element size,
with no slack to account for. Outward, it means an array can lie
byte-for-byte on top of a layout something else defined — a firmware
table, a file format, a hardware buffer — which is the door Chapter 7
walks through with records.

## Multidimensional arrays

A tile map has rows and columns:

```lanternfly
const mapRows as u8 = 24
const mapColumns as u8 = 32

var tiles as u8[mapRows, mapColumns]
```

Two indices select one tile:

```lanternfly
tiles[row, column] = tileNumber
```

Memory itself has no rows; it is Chapter 1's single long street of
pigeonholes. A two-dimensional array is therefore a filing convention:
Lanternfly stores the rightmost dimension contiguously, laying row 0
end to end, then row 1 immediately after it, and so on through row
23. The element number is:

```text
row * mapColumns + column
```

![Rows occupy consecutive runs of four bytes; row 1, column 2 is element 6.](../../assets/images/lanternfly-book/book1/row-major-array.svg)

You have met this formula before. Chapter 3's width example computed
`row * 20 + column` into a `u16` — that was this calculation, done by
hand for a screen twenty columns wide, and Chapter 3 even traced its
types for you. The multidimensional array asks the compiler to write
the same formula on every access, without the off-by-one, and the
type checker rides along for free.

The filing convention also settles loop order. With rows in the outer loop
and columns in the inner one, consecutive iterations touch consecutive
bytes — the address simply
steps forward by one each time. With the loops swapped, each iteration leaps a whole row's width of bytes. Both orders visit every tile;
the first keeps the address arithmetic trivial, and on a small
processor trivial arithmetic is the kind you want in your innermost
loop, where every instruction is multiplied by seven hundred and
sixty-eight passes.

`count(tiles, 0)` produces 24 and `count(tiles, 1)` produces 32. The
dimension argument is required for a multidimensional array so the
requested extent is explicit — an unadorned `count(tiles)` would
leave the reader guessing which direction was meant.

## Array initializers

Square brackets provide one initializer per element:

```lanternfly
const stepX as i8[4] = [0, 1, 0, -1]
const stepY as i8[4] = [-1, 0, 1, 0]
```

Those two tables are Chapter 4's `findStep` wearing a different shape.
Indexed with the direction constants — north is 0, east is 1, south is 2,
west is 3 — `stepX[direction]` and `stepY[direction]` yield the same offsets the
four-case `select` produced: north steps (0, -1), east steps (1, 0),
and so on around the compass. An entire decision has become data —
two table lookups, no branches at all — and adding a new direction
means appending a number to each table rather than writing a case.

The arrangement has a name worth knowing: `stepX` and `stepY` are
*parallel arrays*, two tables ridden by one index, entry *n* of each
describing one aspect of the same thing. And the trade they embody —
replacing decisions with tables — is one of the oldest and best in
the small-machine book. Code that branches must be read to be
understood; a table can be *seen* whole, checked entry by entry
against the design, extended without touching a working routine.
A `select` whose every case merely assigns different constants is better
written as a pair of tables.

A multidimensional initializer mirrors the declared shape:

```lanternfly
const smallMap as u8[2, 4] = [
    [0, 0, 1, 1],
    [2, 2, 3, 3]
]
```

The rank, nested shape and element count must match exactly — the compiler rejects a lopsided table outright rather than guessing which
row was shorted. Constant aggregate data can be placed in ROM by a target
profile, which on a cartridge-based or embedded machine means your
tables cost no precious RAM at all: the direction tables, the level
maps, the sprite data all live in the read-only space the hardware
already provides, and the sixty-four-kilobyte street keeps its
pigeonholes for values that actually change.

## Clearing and filling

Initialization at declaration is one thing; wiping a table at the
start of each round is another, and writing the loop by hand every
time grows old. Two standard procedures handle repeated stores:

```lanternfly
clear(samples)
fill(tiles, emptyTile)
```

`clear` writes the all-zero representation to an array or record
whose fields permit it. `fill` writes one compatible scalar value to
every entry of a fixed array, including every cell of a
multidimensional one. Each says in a word what a loop would say in
three lines, and the reader learns the intent — "this table starts
empty", "this map starts as open floor" — without simulating any
loop in their head. The backend may implement either with a loop, a
native operation or a runtime helper while preserving the same
result; the language's usual promise applies, and the generated
listing will show which choice was made.

## Example

The [chapter listing](/lanternfly-book/book1/code/06-fixed-arrays.txt)
fills a sample array, clears it and declares a two-dimensional tile
map with direction tables. Two traces are worth the pencil: the byte offset of `tiles[1, 2]` from the
row-major formula — one full row of columns, then two more — and
`stepX[west]` beside `stepY[west]`, checked against Chapter 4's `select`. Both checks take a minute, and both are the
exact checks you will one day perform on a program that matters —
because when a tile map scrolls wrong or a monster walks east on a
north command, the bug is in this chapter's arithmetic, and the
pencil is still the fastest way to catch it.
