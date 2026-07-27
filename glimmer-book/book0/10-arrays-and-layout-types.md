---
layout: default
title: "Arrays and Layout Types"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 10
---

# Arrays and Layout Types

Every game you have written so far has kept its whole world in a
handful of named bytes. Today the world itself
becomes data. The picture in a painting program, the wall of settled
pieces in a falling-block game, the body of a snake: each of those
is many related bytes that persist together, change together, and
redraw together: one fact that happens to be sixty-four pixels wide.

Choosing which facts a game remembers is one design decision. This
chapter introduces another: choosing the *shape* those facts take in
memory. You could declare sixty-four separate cells, but Glimmer's
limit of 32 flag-carrying cells means a
board of one-byte facts would overflow the change banks before the
program drew a pixel. The deeper mismatch, though, is one of meaning. When
you stamp one pixel, *the picture* changed. A render that draws the
picture watches one name and tests one flag.

So this chapter adds the two declarations that model group facts.
Array state reserves a run of bytes under one name and one flag.
Layout types name an arrangement of fields, so that bytes which
belong together (an x and a y, a piece's origin and colour) travel
under one declaration.

## Canvas

Canvas is a painting program. Keys 2, 4, 6, and 8 steer a white
cursor around the 8x8 RGB LED matrix; GO stamps a green pixel where
the cursor stands; the stamped pixels stay put while the cursor moves
on. That last clause is a first for this book: every program until now
kept its facts (a position, a colour, a score) but redrew its whole
picture from them each time, so nothing you saw outlived the facts
behind it. In Canvas the picture *is* the state, so it
outlives your touch: steer the cursor away and your work stays. The
picture is an eight-byte array, and the cursor is a two-field layout
called `Point`.

```text
program Canvas

platform tec1g-mon3
display matrix8x8

type Point
    x : byte
    y : byte
end

state Cursor  : Point changed
state Picture : byte[8] changed

pulse Up
pulse Down
pulse Left
pulse Right
pulse Paint

bind key KEY_2 held period 8 -> Up
bind key KEY_8 held period 8 -> Down
bind key KEY_4 held period 8 -> Left
bind key KEY_6 held period 8 -> Right
bind key KEY_GO rising -> Paint

effect MoveUp
    on Up
    updates Cursor
begin
    ld a,(Cursor + offset(Point, y))
    or a
    jr z,_stop      ; at the top edge: stay
    dec a
    ld (Cursor + offset(Point, y)),a
_stop:
end

effect MoveDown
    on Down
    updates Cursor
begin
    ld a,(Cursor + offset(Point, y))
    cp 7
    jr nc,_stop     ; at the bottom edge: stay
    inc a
    ld (Cursor + offset(Point, y)),a
_stop:
end

effect MoveLeft
    on Left
    updates Cursor
begin
    ld a,(Cursor + offset(Point, x))
    or a
    jr z,_stop      ; at the left edge: stay
    dec a
    ld (Cursor + offset(Point, x)),a
_stop:
end

effect MoveRight
    on Right
    updates Cursor
begin
    ld a,(Cursor + offset(Point, x))
    cp 7
    jr nc,_stop     ; at the right edge: stay
    inc a
    ld (Cursor + offset(Point, x)),a
_stop:
end

effect PaintPixel
    on Paint
    updates Picture
begin
    ld a,(Cursor + offset(Point, x))
    call MxMask     ; A = the column's pixel mask
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Picture
    add hl,de       ; HL -> the cursor's row byte
    ld a,(hl)
    or b
    ld (hl),a
end

render DrawCanvas
    on Picture, Cursor
begin
    call FbClear
    ld hl,Picture
    ld de,Framebuffer + 1        ; green plane of row 0
    ld b,8
_row:
    ld a,(hl)
    ld (de),a       ; one row mask -> one green row
    inc hl
    inc de
    inc de
    inc de
    inc de          ; next row: 4 bytes per row
    djnz _row
    ld a,(Cursor + offset(Point, x))
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld c,a
    ld a,COLOR_WHITE
    call FbPlot
end
```

A running Debug80 build provides a canvas on which GO paints at the
current cursor position.

## One fact, eight bytes

```text
state Picture : byte[8] changed
```

`byte[N]` reserves N bytes of state under one name, with N anywhere
from 1 to 256. An array starts zero-filled and takes no initializer,
so the declaration reads directly:
*Picture is eight bytes, already changed*.

One change flag covers the whole run. Stamping a pixel changes the
picture, not byte three of some array. A board changes *as a unit*,
and the render that watches it asks one question: do I need to
redraw? Per-cell flags would spend your whole flag budget tracking which
byte moved, sixty-four bits that no block ever tests. So `updates Picture`
raises the one flag whichever byte a block wrote, and `on Picture`
fires when any byte did. The array name is legal exactly where a byte
cell's name is legal, in `on` lines and in `updates` lines, and it
spends one bit of `Changed0`, leaving the banks as roomy as before.

Eight bytes hold sixty-four pixels because each byte is a **row
mask**: one row of the 8x8 matrix, one bit per column, bit 7 the
leftmost. The `MxMask` library helper takes a column number in A
and returns the column's mask in A, clobbering B on the way.

![Eight row masks, and the picture they light.](../../assets/images/glimmer-book/book0/picture-as-state.svg)

## Painting a pixel

Stamping a pixel means finding one byte in the array and setting one
bit in it. `PaintPixel` does both:

```text
effect PaintPixel
    on Paint
    updates Picture
begin
    ld a,(Cursor + offset(Point, x))
    call MxMask     ; A = the column's pixel mask
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Picture
    add hl,de       ; HL -> the cursor's row byte
    ld a,(hl)
    or b
    ld (hl),a
end
```

This addressing is the Z80 you already know: `Picture` is a label, the
row number goes in DE,
`add hl,de` lands HL on the row's byte, and OR folds the new pixel
into whatever the row already held. Glimmer supplies the label, the
storage behind it, and the flag that `updates Picture` raises; the
arithmetic between them is yours, instruction by instruction. GO fires
`Paint`, the logic phase runs `PaintPixel`, and `Picture`'s change is
delivered to the render phase later the same frame. One press of GO
therefore produces one visible pixel in one frame.

## Redrawing the picture

`DrawCanvas` watches both facts (`on Picture, Cursor`) so a stamp
and a move each trigger a redraw. Redrawing means rebuilding the
whole frame from state, and the heart of it is one loop:

```text
    ld hl,Picture
    ld de,Framebuffer + 1        ; green plane of row 0
    ld b,8
_row:
    ld a,(hl)
    ld (de),a       ; one row mask -> one green row
    inc hl
    inc de
    inc de
    inc de
    inc de          ; next row: 4 bytes per row
    djnz _row
```

The framebuffer gives each row four bytes (red, green, blue, and an
aux byte) so the loop drops each of Picture's row masks into the
green plane and steps DE by four to reach the next row. Because
`Picture` and the framebuffer share the row-mask convention, the
whole painting transfers in one eight-pass loop. The cursor goes on
top afterwards, white, through `FbPlot`. On a painted pixel the cursor
shows white; after it moves away, the next redraw restores the green
underneath.

## Two bytes that travel together

The cursor is one fact with two parts: an x and a y that move
together, change together, and mean nothing apart. Glimmer models it
with a layout type and a typed state cell:

```text
type Point
    x : byte
    y : byte
end

state Cursor : Point changed
```

A `type` declaration names an arrangement of bytes: `Point` is two
byte fields, `x` at the start and `y` after it. The type reserves no
storage by itself; it is a name for a shape. Storage
arrives with the state line, which reads *Cursor is a Point, already
changed* and reserves two zero-filled bytes in that shape.

Typed state follows the array rules: zero-filled, no initializer, one
change flag for the whole cell. Zero-filled has a visible consequence
here: Cursor starts as (0,0), so the program opens with the cursor
in the top-left corner. And the single flag is what lets every
movement effect say `updates Cursor` and the render say `on Cursor`,
whichever field moved.

Inside a block, a field is reached by adding its offset to the
cell's label. Every load and store in the movement effects takes this
shape:

```text
    ld a,(Cursor + offset(Point, y))
```

`offset(Point, y)` is a constant computed at assemble time (1, since
`y` sits one byte into the layout), so the whole operand folds to a
fixed address and the instruction is a plain absolute load. You could
write `Cursor + 1` and reach the
same byte today. The reason not to is concrete: adding a field at the top
of the layout silently shifts every hand-counted offset below it, and the bug
that follows points nowhere near its cause. Written as `offset`, the addresses
follow the definition instead: when the layout grows, every one of them moves
with it without requiring changes to the instructions.

## Layout fields

Point is the smallest useful layout. Fields come in five kinds, and a
game piece shows them all:

```text
type Sprite
    pos    : Point
    speed  : byte
    score  : word
    frames : 4
    tile   : addr
end
```

`byte` and `word` you know. `addr` is a two-byte field that holds an
address: a pointer to a shape table, a curve, a routine. A bare
number reserves that many raw bytes, so `frames : 4` is a four-byte
scratch run with one name. And a field can be another type: `pos :
Point` nests the whole two-byte layout inside this one.

Two functions read a layout's measurements inside any block body.
`sizeof(Name)` is the layout's full size (`sizeof(Point)` is 2,
`sizeof(Sprite)` is 11), which is what you multiply by to step
through a table of records. `offset(Type, field)` is a field's
distance from the start, and nested fields chain by addition:

```text
ld hl,Hero + offset(Sprite, pos) + offset(Point, y)
```

Both are constants by the time the Z80 sees them; the instruction
above assembles to one `ld hl,nn`.

![An array, a record, and the byte that base plus index times stride plus offset lands on.](../../assets/images/glimmer-book/book0/record-layout.svg)

A type can also rename an existing shape:

```text
type Board = byte[8]

state Grid : Board
```

The alias form gives a shape a name of its own, so a program with
three boards declares `Board` once and `sizeof(Board)`, 8 here,
follows the definition. State declared through an alias is typed
state like any other: zero-filled, one flag.

## The declarations, compiled

In `canvas.main.asm`, the two new declarations tell their whole story
in two short sections. First the
layout:

```asm
; --- layout types ---
; AZM owns the type system: sizeof, offset, and layout casts
; work on these names in block bodies.
Point .type
    x             .byte
    y             .byte
.endtype
```

`type Point` compiled to an assembler `.type` record, field names and byte
widths carried straight through, and the generated comment names the
division of labour: Glimmer names the layout, the assembler owns the type
system. `sizeof` and `offset` work inside your blocks because they
are assembler expressions, evaluated over this record when the generated
file assembles. The alias form compiles to the matching
directive, from the Board example's generated file:

```asm
Board             .typealias byte[8]
```

Then the storage:

```asm
; --- state storage ---
Cursor:           .ds Point, 0   ; typed state
Picture:          .ds 8, 0   ; byte array
```

`.ds Point, 0` reserves `sizeof(Point)` bytes of zeroes; `.ds 8, 0`
reserves the array. These are the same storage idea at a larger size:
a label, a reservation and zero-filled bytes.

And the change tracking confirms what the declarations promised. Two
cells, two bits:

```asm
CHG_CURSOR        .equ %00000001
CHG_PICTURE       .equ %00000010
```

```asm
Changed0:         .db %00000011   ; flags dispatch tests
```

Ten bytes of program state, two flags, and both marked `changed` so
`DrawCanvas` paints the opening frame: the blank picture, the cursor
in its corner.

Canvas is now the largest program in the book, a good subject for what
comes next: reading the dependency report, heeding the warnings, and
debugging a reactive program methodically: [Dependency Reports and
Debugging](11-dependency-reports-and-debugging.md).
