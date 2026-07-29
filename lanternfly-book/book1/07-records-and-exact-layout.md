---
layout: default
title: "Records and Exact Layout"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 7
---

# Records and Exact Layout

An x coordinate and a y coordinate are two numbers that describe one
position. Separate variables do not tell the compiler that they share a
layout or should be copied together. A record gathers the fields into one
named type:

```lanternfly
record Point
    var x as i8
    var y as i8
end

var position as Point

position.x = 12
position.y = -3
```

`Point` occupies two bytes: `x` is first and `y` is second. The program can
declare and copy a position as one value. Later chapters show how subroutines
receive aggregate storage by alias or reference rather than by-value copying.
The exact field layout can also match an external byte layout.

Records model entities such as monsters, players and particles by naming the
few fields each instance needs. The `Monster` example later in this chapter
shows how those field choices determine both the source interface and exact
storage cost.

## Record declarations

```lanternfly
record Point
    var x as i8
    var y as i8
end
```

`record` introduces a type name. User-defined type names use Pascal case,
capitalising the first letter of every word, while values and routines use
lower camel case. The convention splits the vocabulary of a program in two at
a glance:
`Point` is a kind of thing, `position` is a thing. Each field uses the
familiar `var name as Type` form, so a record body reads as a small run
of declarations. Everything Chapter 2 taught about
choosing types applies field by field: `i8` here because a coordinate
in this example may be negative and is constrained to the `i8` range.

A record declaration describes layout; storage exists only when another
declaration uses the type. `record Point` fixes that layout at compile time;
`var position as Point` allocates bytes for one instance. A program may
allocate one instance, an array of them or none.

```lanternfly
var position as Point
```

A dot selects a field:

```lanternfly
position.x
position.y
```

The compiler turns each field name into a byte offset — `x` is "the
byte at offset zero", `y` "the byte at offset one" — while the source
keeps the coordinate names. Nothing is looked up at runtime; there is
no table of field names inside the machine. A longer field name costs no
runtime storage or lookup. Adding a field is different: it changes the record
layout and increases every instance by that field's size.

## Exact field layout

Fields appear in declaration order, and Lanternfly inserts no
implicit padding:

```lanternfly
record Monster
    var x as u8
    var y as u8
    var direction as u8
    var state as u8
    var timer as u8
    var frame as u8
end
```

The design comes before the layout, because this record is a compact
answer to a modelling question: what must the game remember
about a monster between frames? Where it is (`x`, `y`), where it is
heading (`direction` — an index into Chapter 6's step tables), what
it is doing (`state` — the named-constant idiom from Chapter 4), how
long until it changes (`timer`), and which picture shows it
(`frame`). Those choices produce six fields and six bytes. A monster also has things the
game need *not* remember — its speed if all monsters share one, its
appearance if `frame` selects it from a table — and leaving those
out is as important as including the state each instance needs. Every field's
size is multiplied by the number of instances.

A C implementation may add padding bytes between struct members to satisfy
alignment requirements, so the same struct can have different sizes under
different compilers. A Lanternfly record has one layout, derivable by eye:
fields in order, each at the offset where the previous one ended.
`Monster` occupies six bytes and its field offsets run from zero
through five, and both facts can be asked for by name:

```lanternfly
const monsterBytes as u8 = size(type Monster)
const timerOffset as u8 = offset(Monster.timer)
```

`monsterBytes` is six and `timerOffset` is four. Exact layout lets the
field offsets match a firmware table, file format or documented state block.
Reaching the external bytes still requires placed storage, an imported
contract or a typed reference established by the target. Once that base
location is supplied, `.timer` selects the documented byte at offset four.

![Monster occupies six bytes in declaration order, with timer at offset four.](../../assets/images/lanternfly-book/book1/monster-layout.svg)

## Arrays of records

Games often need several monsters, so records commonly become array elements:

```lanternfly
var monsters as Monster[4]
```

The array occupies 24 bytes, with a six-byte stride and no padding between
entries. A field path selects an entry and then one of its fields:

```lanternfly
monsters[index].timer = monsters[index].timer + 1
```

Both selection rules compose in one address: the backend calculates
`index * 6`, adds the timer offset of four, and accesses a single byte. The
six-byte stride is fixed across targets.

![Each Monster begins six bytes after the previous one; monsters[2].timer is byte offset 16.](../../assets/images/lanternfly-book/book1/record-array-stride.svg)

The same information could use six parallel arrays such as `monsterX`,
`monsterY` and `monsterTimer`. An array of records keeps one monster's fields
adjacent, which suits routines that consume most fields of one entity.
Parallel arrays keep one field adjacent across many entities, which suits
loops that process the same field for every entity. Choose from the program's
access pattern.

## Nested records and arrays

A record can contain another record or a fixed array:

```lanternfly
record Mover
    var position as Point
    var previous as Point[4]
    var savedCount as u8
end

var player as Mover
```

`Mover` describes a moving thing with a current position and a short
history of past ones — eleven bytes altogether: two for `position`, eight for
`previous`, then one for `savedCount`. The model grows
by composition: a `Mover` is not ten loose coordinates and a count but "a
`Point`, four more `Point`s, and a count", each layer named at its
own level of meaning. Paths retain a type at every step:

```lanternfly
player.previous[index].x = player.position.x
```

`player.previous` has type `Point[4]`. Indexing selects one `Point`,
and `.x` selects its `i8` field. However deep the nesting, each link
of the path is checked against a declared type, and each link
contributes a fixed offset or a stride multiply to one flat address
calculation — the reading is layered, the arithmetic is flat.

A record cannot contain its own type by value,
directly or through mutual containment — a `Mover` holding a `Mover`
holding a `Mover`, with no bottom to the size. A by-value
containment cycle has no finite size, so the compiler rejects it.
When two records genuinely need to point at one another, that is a
job for Chapter 8's references, which connect separately allocated
records instead of nesting one inside the other.

## Record initializers

A record initializer names every field:

```lanternfly
const origin as Point = Point(x = 0, y = 0)
```

Each field appears exactly once. Naming them all keeps each initializer tied
to its field even when the declaration changes. The written order controls
initializer evaluation
while the declaration order controls storage, so you may write the
fields in whatever order reads best.

A record type and a subroutine cannot share the same
case-insensitive name. That rule keeps `Point(...)` unambiguously a
record initializer even though Lanternfly otherwise keeps type and
value names in separate namespaces — a small tax on the namespace,
paid to keep every call-shaped expression readable without a
glossary.

## Aggregate assignment

Records and arrays with identical types can be assigned as whole
values:

```lanternfly
savedPosition = player.position
actors[0] = actors[1]
```

The complete fixed-size value is copied — every byte of it, in one
statement. This is where the modelling pays off in plain
convenience: "remember where the player was" is one line, because
the position is one value. Copying has snapshot semantics: an
overlapping source and destination behave as though the source value
was read in full first, so even shuffling entries within one array
cannot smear a half-written value into its own input. The backend
may inline a small copy, emit a loop or call a runtime helper. Once a compiler
exists, its generated listings and cost reports can expose that choice — a
two-byte `Point` will move differently from a twenty-four-byte monster table.

Subroutine locals, for their part, stay scalar: a local declaration
does not carve record or array storage out of the stack. Chapter 8
introduces the local alias, which gives a subroutine a short name
for existing aggregate storage instead. The local holds a reference-sized
location while the aggregate bytes remain in their original storage.

## Example

The [chapter listing](/lanternfly-book/book1/code/07-records.txt)
declares points, monsters and a mover with a position history. From the
declarations, calculate `size(type Mover)` and the byte offset of
`player.previous[2].y`. The expected size is 11 bytes and the expected
offset is 7.
