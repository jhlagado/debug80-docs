---
layout: default
title: "Records and Exact Layout"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 7
---

# Records and Exact Layout

An x coordinate and a y coordinate are two numbers, but they describe one
thing: a position. A program that stores them as two unrelated variables —
`positionX` here, `positionY` there — is forever one refactoring away
from moving the first and forgetting the second, and nothing in the
language knows the two belong together. The knowledge lives only in the
programmer's head, which Chapter 1 already identified as the least
reliable storage a program has. A record repairs that. It gathers the
fields into a single named shape and makes the pair a type of its own:

```lanternfly
record Point
    var x as i8
    var y as i8
end

var position as Point

position.x = 12
position.y = -3
```

`Point` occupies two bytes: `x` is the first and `y` is the second. From
this chapter on, "a position" is something the program can declare, copy
and pass around as one value — and, just as important on our machines,
something whose exact bytes you can state from the source alone. That
second property gives the chapter its title, and by the end it will let
a Lanternfly record sit byte-for-byte on top of layouts the outside
world has already fixed.

Records also change what kind of thinking you do. Chapters 2 through 5
worked with quantities; Chapter 6 arranged quantities into sequences.
A record is the first construct whose subject is not a quantity at all
but a *thing* — a monster, a player, a particle — and designing one is
an act of modelling: deciding which few bytes capture what the game
needs to know about each thing it tracks. Get the model right and the
code that follows writes itself; get it wrong and every routine fights
the shape of its own data. The examples in this chapter are small
exercises in getting it right.

## Record declarations

```lanternfly
record Point
    var x as i8
    var y as i8
end
```

`record` introduces a type name, and the name is Pascal-cased — capital
first letter — where values and routines stay lower camel case. The
convention splits the vocabulary of a program in two at a glance:
`Point` is a kind of thing, `position` is a thing. Each field uses the
familiar `var name as Type` form, so a record body reads as a small run
of declarations, which is what it is. Everything Chapter 2 taught about
choosing types applies field by field: `i8` here because a coordinate
on this screen can be negative and never strays past two digits.

One distinction does more work in this chapter than any other: a
record declaration describes layout, and no storage exists until
another declaration uses the type.

```lanternfly
var position as Point
```

`record Point` is the blueprint; `var position as Point` is a
building. There can be one building, or forty in an array, or none at
all — the blueprint costs nothing either way. Keep the two roles
separate in your head and half of this chapter follows automatically:
blueprints are consulted at compile time, buildings occupy pigeonholes
at run time, and the compiler is the only party that ever needs both
at once.

A dot selects a field:

```lanternfly
position.x
position.y
```

The compiler turns each field name into a byte offset — `x` is "the
byte at offset zero", `y` "the byte at offset one" — while the source
keeps the coordinate names. Nothing is looked up at runtime; there is
no table of field names inside the machine, any more than there is a
table of variable names. Like every name in a compiled language, a
field name is free. You can afford exactly as many well-named fields
as clarity wants, and the generated code could not tell the
difference.

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

Pause on the design before the layout, because this record is a
compact answer to a modelling question: what must the game remember
about a monster between frames? Where it is (`x`, `y`), where it is
heading (`direction` — an index into Chapter 6's step tables), what
it is doing (`state` — the named-constant idiom from Chapter 4), how
long until it changes (`timer`), and which picture shows it
(`frame`). Six questions, six bytes. A monster also has things the
game need *not* remember — its speed if all monsters share one, its
appearance if `frame` selects it from a table — and leaving those
out is as much a part of the model as putting the six in. Every byte
in a record is multiplied by every instance of it, so a record earns
its fields the way a sentence earns its words.

Now the layout. If you have worked in C, you will feel how strong
the no-padding promise is. A C compiler may slide invisible padding
bytes between struct members to suit an architecture's alignment
taste, and the same struct can have different sizes under different
compilers. A Lanternfly record has one layout, derivable by eye:
fields in order, each at the offset where the previous one ended.
`Monster` occupies six bytes and its field offsets run from zero
through five, and both facts can be asked for by name:

```lanternfly
const monsterBytes as u8 = size(type Monster)
const timerOffset as u8 = offset(Monster.timer)
```

`monsterBytes` is six and `timerOffset` is four. Exact layout is
what lets a record match something that already exists — a firmware
table whose bytes were fixed a decade ago, a file format, a block of
game state at a documented address. Declare a record whose fields
mirror the documented bytes, and the dot notation becomes a set of
honest names for someone else's layout: the manual says "byte 4 is
the timer", your source says `.timer`, and the two are provably the
same byte.

![Monster occupies six bytes in declaration order, with timer at offset four.](../../assets/images/lanternfly-book/book1/monster-layout.svg)

## Arrays of records

The natural home of a record is an array of them — a game does not
have one monster:

```lanternfly
var monsters as Monster[4]
```

The array occupies 24 bytes, four true six-byte strides with nothing
between, exactly as Chapter 6 promised. A field path selects an
entry and then one of its fields:

```lanternfly
monsters[index].timer = monsters[index].timer + 1
```

Both selection rules compose in one address: the backend calculates
`index * 6`, adds the timer offset of four, and accesses a single
byte. Read the path aloud and you can hear the arithmetic — bracket
says multiply, dot says add. A six-byte stride remains six on every
target, because the layout is the contract and the contract does not
renegotiate per machine.

![Each Monster begins six bytes after the previous one; monsters[2].timer is byte offset 16.](../../assets/images/lanternfly-book/book1/record-array-stride.svg)

It is worth noticing that the same 24 bytes could have been organised
the other way: six parallel arrays of four bytes each — `monsterX`,
`monsterY`, `monsterTimer` and so on — Chapter 6's parallel-array
idiom scaled up. Both arrangements store identical information;
they differ in what sits next to what. The array of records keeps
each monster's six facts adjacent, which suits code that works on
one monster at a time — update this one, copy that one. Parallel
arrays keep each *aspect* adjacent, which suits code that sweeps one
fact across everybody. Most game logic lives monster-at-a-time, so
the record array is the usual right answer, but the choice is a real
one, and knowing you are making it is the point.

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
history of past ones — eleven bytes altogether: two, then eight,
then one, in that order, by the same rules as ever. The model grows
by composition: a `Mover` is not six loose coordinates but "a
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

One shape is refused. A record cannot contain its own type by value,
directly or through mutual containment — picture `Mover` holding a
`Mover` holding a `Mover`, and the size has no bottom. A by-value
containment cycle has no finite size, so the compiler rejects it.
When two records genuinely need to point at one another, that is a
job for Chapter 8's references, which connect separately allocated
records instead of nesting one inside the other.

## Record initializers

A record initializer names every field:

```lanternfly
const origin as Point = Point(x = 0, y = 0)
```

Each field appears exactly once — naming them all is the point,
since a positional form would quietly break the day a field is added
in the middle. The written order controls initializer evaluation
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
may inline a small copy, emit a loop or call a runtime helper, and
the generated listings and cost reports expose that choice — a
two-byte `Point` will move differently from a twenty-four-byte
monster table, and the language's habit of showing costs applies to
its conveniences too.

Subroutine locals, for their part, stay scalar: a local declaration
does not carve record or array storage out of the stack. Chapter 8
introduces the local alias, which gives a subroutine a short name
for existing aggregate storage instead — reference-sized, and honest
about where the bytes actually live.

## Example

The [chapter listing](/lanternfly-book/book1/code/07-records.txt)
declares points, monsters and a mover with a position history. The
trace worth doing here is an offset walk: from the declarations
alone, predict `size(type Mover)` and the byte offset of
`player.previous[2].y`, then check against the layout rules. Two
bytes for `position`, then two strides of two into `previous`, then
one more for `y` — the arithmetic is short, and being able to run it
from the source alone is exactly what "exact layout" means. When a
record of yours must one day match a datasheet, this is the
five-minute skill that does it.
