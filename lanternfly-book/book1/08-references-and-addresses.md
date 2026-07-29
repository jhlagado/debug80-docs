---
layout: default
title: "References and Addresses"
parent: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 8
---

# References and Addresses

Chapter 7 ended with aggregate assignment, which copies a value out of
its storage. Copying is sometimes exactly wrong. A game that maintains
four monsters usually wants a notion of the *current* one — the monster
being updated this frame, the one the missile is homing on, the one the
cursor in the level editor is pointing at. Copy it into a working
variable and every change lands on the copy while the original sits
untouched in the array; the game pets a photograph of the monster and
wonders why the monster never moves.

The distinction underneath is worth naming, because this whole chapter
lives in it. There are two relationships a program can have with data:
holding a *value* — its own private bytes — or knowing a *location*,
the whereabouts of bytes that live elsewhere. Chapters 1 through 7
worked almost entirely in values. This chapter adds locations, and with
them a new kind of variable: one whose content is, in effect, an arrow
pointing at other storage. Lanternfly calls it a reference, and a
reference is a location *plus a type* — not "somewhere in memory"
but "a `Monster`, there":

```lanternfly
var monsters as Monster[4]
var current as near ref Monster = ref monsters[0]

sub selectMonster(index as i16)
    current = ref monsters[index]
    current.timer = 10
end
```

Rebinding `current` selects another array entry; assigning through
`current.timer` changes that entry inside `monsters`, originals and
all. One variable now stands for "whichever monster we mean right
now", and the rest of the program can say `current` without knowing or
caring which index is selected this frame. The selection is made in
one place and honoured everywhere — the same centralising move that
`sub` made for actions in Chapter 1, now made for *identity*.

If the word "pointer" just made you flinch, the flinch is earned but
the fear is misplaced. C's pointers arrive uninitialised, go null, and
dangle after the memory they aimed at is gone, and a generation
learned caution from the crashes. A Lanternfly reference keeps the
useful half of the idea: it must be initialised when it is created,
and first-edition references always identify valid storage. The
whereabouts may change; the fact that there is a real, typed
somewhere on the other end does not. You will spend this chapter
learning what references make easy, not what they make dangerous.

## Forming a reference

Prefix `ref` takes the location of a storage path:

```lanternfly
ref monsters[index]
ref player.position
ref board[row]
```

Any path that could stand on the left of an assignment can follow
`ref` — if you can store into it, you can point at it. The result
carries its referent type: `ref monsters[index]` has type
`ref Monster`, and `ref player.position.x` has type `ref i8`. The
type is what separates a reference from a bare address. An address
says only "pigeonhole 31,844"; a `ref Monster` says "a six-byte
monster laid out as Chapter 7 declared, starting there". The
compiler knows the shape of the far end, and everything in the next
section depends on that knowledge.

A reference is a scalar value, and a small one — on a Z80, a near
reference is the machine's natural two-byte address. It can be
stored, passed to a subroutine, returned or compared with a
compatible reference. That scalarity is the trick behind the whole
chapter: however large the monster, its whereabouts fit in two
bytes, and moving two bytes is cheap. Notice the trade against
Chapter 7's aggregate copy — the copy moves all the bytes and makes
an independent value; the reference moves two bytes and shares the
original. Independent snapshot or shared original: that is the whole
choice, and now you have both.

## Field and index access

Field and index paths pass through a reference:

```lanternfly
current.timer = current.timer + 1
current.x = 4
```

The declared referent type tells the compiler which field layout to
use — `current` is a `ref Monster`, so `.timer` means Chapter 7's
offset of four, applied to whatever address `current` holds this
frame. The path reads exactly as it would on the record itself,
which is the point: selecting a monster is one line, and the twenty
lines that update it are indifferent to whether they were handed
the array entry or a reference to it. Code written against "a
monster" keeps working when the monster starts arriving by
reference, and that stability is what lets programs grow without
being rewritten at every step.

One distinction has to be kept straight, and the language gives each
side its own spelling. Assignment to the reference variable rebinds
it — points the arrow somewhere new. An explicit `value` access
reads or writes the complete referent instead — the thing at the
arrow's tip:

```lanternfly
value(scoreReference) = value(scoreReference) + 1
value(current) = monsters[nextMonster]
```

The first line adds one to the score that `scoreReference` points
at — for a scalar referent, `value` is how you reach the thing
itself rather than the reference. The second copies a whole monster
into the storage `current` points at, aggregate assignment through a
reference. Compare it with the rebinding
`current = ref monsters[nextMonster]`: after the copy, `current`
still points where it pointed, and that monster now holds new
bytes; after the rebind, no bytes moved at all — only the arrow
swung. Two intentions, two spellings, no way to write one and get
the other. Languages that blur this line force every reader to
reconstruct the writer's intent from context; Lanternfly puts the
intent in the token.

## Local aggregate aliases

Chapter 7 noted that subroutine locals stay scalar. Here is the
promised way to work comfortably with an aggregate anyway — give
existing storage a short local name:

```lanternfly
sub resetSelected()
    ref monster as Monster = monsters[selectedIndex]

    monster.timer = 0
    monster.frame = 0
end
```

Without the alias, both statements would spell out
`monsters[selectedIndex]`, and the backend would happily recompute
the `index * 6` address arithmetic each time. The alias performs the
selection once and reuses the result — it needs only reference-sized
local state, leaves the `Monster` exactly where it lives in the
global array, and cannot be rebound later in the subroutine.

That last restriction is what makes an alias an alias rather than a
reference variable, and it is a gift to the reader as much as a
rule for the writer: within this routine, `monster` *is*
`monsters[selectedIndex]`, a fixed nickname rather than a movable
arrow, and anyone reading the body can substitute one for the other
without checking the intervening lines for a sneaky rebind. The
reference variable and the alias are the same machinery at two
levels of promise — one may move, one may not — and choosing the
stricter form whenever it suffices is the same kindness Chapter 5
taught with loops: announce the least power you need.

## Arrays of references

References are scalar values, and scalar values can fill arrays —
which solves a problem layout alone cannot. Several boards of the
same shape can be allocated separately, wherever they each need to
live, and still be collected into one lookup table:

```lanternfly
var boardRed as u8[8]
var boardGreen as u8[8]
var boardBlue as u8[8]

var boardPlanes as (near ref (u8[8]))[3] = [
    ref boardRed,
    ref boardGreen,
    ref boardBlue
]
```

Each element is one near reference to an eight-byte array; the board
arrays keep their separate storage. The type spelling
`(near ref (u8[8]))[3]` rewards reading from the inside out — an
array of eight bytes, a near reference to such an array, three of
those — and the parentheses keep each layer explicit.

![Three reference slots point to three independently allocated board arrays.](../../assets/images/lanternfly-book/book1/array-of-references.svg)

```lanternfly
value(boardPlanes[planeIndex]) = clearPlane
```

`boardPlanes[planeIndex]` evaluates to a reference value;
`value(...)` selects the referenced array; aggregate assignment
copies the clear plane into it. Three chapters of machinery in one
line — and a shape worth recognising, because an array of references
is how a small machine does what bigger languages call indirection:
one integer chooses among structures that live in entirely different
places. Chapter 6 taught tables of data replacing decisions; this is
a table of *locations* replacing them, and between the two idioms
you can route almost anything by index.

## Near and far references

So far "location" has meant an address in the target's ordinary
memory. On real hardware, ordinary needs qualifying. A near
reference reaches storage in the target's current memory context:

```lanternfly
var current as near ref Monster = ref monsters[0]
```

A far reference retains extra target context:

```lanternfly
var remoteMonster as far ref Monster = ref monsters[0]
```

The classic Z80 predicament explains why both exist. The processor
can address 65,536 bytes and not one more — sixteen address lines,
two to the sixteenth pigeonholes, the arithmetic of Chapter 2
applied to the address bus itself. Machines that wanted more memory
added banking hardware: a switch that swaps different physical
memory into a window of the address space, like a bookcase whose
middle shelf can be rotated to show different books. A two-byte
address is only meaningful if you also know which bank was switched
in when you use it — and that is precisely what a far reference
remembers. On a banked Z80 target, far may be a bank identifier
beside a 16-bit offset; an 8086 backend may use its native segment
and offset; a flat-memory target may represent both classes
identically. Near is smaller and cheaper to follow, far reaches
anywhere; the choice is a cost decision like `u8` against `u32`,
made with the same two questions — how far must this reach, and
what does the reach cost?

![On one possible banked Z80 target, a near reference uses the current bank while a far reference carries the bank identifier.](../../assets/images/lanternfly-book/book1/banked-references.svg)

Stored references and public interfaces state `near` or `far`,
because a reference that outlives a moment, or crosses between
separately compiled parts, must have one agreed size and meaning.
An unqualified `ref Monster` is available for local reference
variables and private parameters, where the target's default class
is sufficient and the source stays portable across targets whose
defaults differ.

## Opaque addresses

One rung remains below the typed reference. Some interfaces need a
location whose record shape belongs to a target service rather than
to your program:

```lanternfly
var entryPoint as far address
```

`near address` and `far address` retain an address class and support
assignment and equality — and that is all. There is no field access
and no indexing, because there is no declared referent to give such
access meaning; a typed reference is precisely an address plus that
shape, and `address` is the address alone.

Deliberate opacity has its uses on real machines. A display service
can hand out a VRAM address on a target where video memory is not in
the CPU's ordinary address space at all — the address means
something to the display hardware, nothing to CPU indexing, and the
type system's refusal to let you index it is not pedantry but a true
statement about the machine. The service that issued the address
knows how to use it; your program's job is only to hold it, pass it
back, and compare it, which is exactly the interface `address`
grants. A type that says "you may hold this but not open it" turns
out to be one of the most honest types in the language.

## Example

The [chapter listing](/lanternfly-book/book1/code/08-references.txt)
selects a monster by reference, creates a local alias and clears one
of several referenced board planes. As you read it, keep asking the
chapter's one question at every assignment: is this line moving a
reference, or moving the bytes it refers to? Ask it at
`current = ref monsters[index]`, at `monster.timer = 0`, at
`value(boardPlanes[planeIndex]) = clearPlane`, and check yourself
against the spellings — rebinds touch the arrow, `value(...)` and
field paths touch the bytes. When those two operations are
effortless to tell apart, references are yours.
