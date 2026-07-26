---
layout: default
title: "Layout Types"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 13
---
[← Register Contracts](12-register-contracts-azmdoc.md) | [Book 2](index.md) | [Op Declarations →](14-op-declarations.md)

# Chapter 13 — Layout Types

`find_max` and `count_above` work on a table where each entry is a single byte.

Now consider a table where each entry holds three pieces of data: an x coordinate, a y coordinate and a color byte.

You can write that:

```asm
  ; sprite_table entry layout (manual):
  ;   offset 0: x (byte)
  ;   offset 1: y (byte)
  ;   offset 2: color (byte)
  ;   entry size: 3 bytes

  ld a, (hl)           ; read x
  inc hl
  ld a, (hl)           ; read y
  inc hl
  ld a, (hl)           ; read color
```

To move to the next entry, add 3 to HL. To read x from entry N, the address is `sprite_table + N * 3`. To read color, it is `sprite_table + N * 3 + 2`.

Add a field before color and every offset below it is wrong. Rename a field and every comment referring to it is stale. The code and the layout exist in two separate places (the bytes in memory, and the mental model in your head and comments) with no mechanism to keep them in sync.

AZM's layout type system closes that gap. You describe a record once, and the assembler computes every size and offset from that description at assembly time. The CPU still performs the actual address arithmetic at run time; AZM does not generate hidden indexing code.

---

## Scalar types: `byte`, `word` and `addr`

In AZM, `byte`, `word` and `addr` are layout type names:

| Type  | Size   | Meaning                                      |
| ----- | ------ | -------------------------------------------- |
| byte  | 1 byte | an 8-bit value                               |
| word  | 2 bytes | a 16-bit little-endian value                |
| addr  | 2 bytes | an address (same size as word; name shows intent) |

`sizeof` reports the size of each type:

```asm
BYTE_SIZE  .equ sizeof(byte)    ; = 1
WORD_SIZE  .equ sizeof(word)    ; = 2
ADDR_SIZE  .equ sizeof(addr)    ; = 2
```

These are compile-time constants, like any `.equ`.

When you reserve storage with `.ds`, you can pass a type expression directly instead of counting bytes:

```asm
OneByte:
    .ds byte              ; 1 byte

Scratch:
    .ds byte[32]          ; 32 bytes

Counter:
    .ds word              ; 2 bytes

Table:
    .ds word[8]           ; 16 bytes
```

`.ds byte[32]` means "reserve the same number of bytes as an array of 32 bytes", which is 32 bytes. The brackets here describe a type shape for size calculation, not a runtime container. Nothing is initialized; `.ds` only reserves space. An optional fill byte still works:

```asm
Zeros:
    .ds word[8], 0        ; 16 bytes, each filled with 0
```

You can still write `.ds sizeof(byte[32])` if you prefer the explicit form.

---

## Defining a record with `.type`

A record groups named fields into one layout. Declare it in a block:

```asm
Sprite .type
x       .byte
y       .byte
color   .byte
.endtype
```

Each line names a field and gives its type.

![One description, and every offset and size computed from it. Add a field and they all update.](../../assets/images/azm-book/book2/record-layout.svg)

Inside a layout block, `.byte`, `.word` and `.addr` are shorthands:

```asm
field .byte    ; same as: field .field byte
field .word    ; same as: field .field word
field .addr    ; same as: field .field addr
```

You can also write the size explicitly with `.field`:

```asm
Bullet .type
x       .field 1
y       .field 1
timer   .word
ptr     .addr
blob    .field 3
.endtype
```

`.field 3` means three raw bytes with no scalar name. `.word` and `.field word` both contribute 2 bytes to the record.

Field declarations do not allocate memory. Memory comes from `.db`, `.dw` or `.ds`:

```asm
sprite_table:
    .ds Sprite[8]         ; space for 8 sprites
```

`.ds Sprite[8]` reserves `sizeof(Sprite) * 8` bytes. The label `sprite_table` is an ordinary address. AZM does not permanently attach a type to it; you supply the layout when you need a constant offset (covered later in this chapter).

### Named element counts

When the number of elements is a named constant, multiply explicitly, since the current assembler accepts literal counts inside `Type[N]` for `.ds`, not a `.equ` name in those brackets:

```asm
NumSprites .equ 16

sprite_table:
    .ds NumSprites * sizeof(Sprite)   ; same bytes as .ds Sprite[16]
```

The form `Pair .type byte[2]` is rejected. AZM spells a one-line layout alias
with `.typealias`:

```asm
Pair .typealias byte[2]
```

The older colon form (`x: byte`) is also not AZM syntax.

---

## `sizeof` and `offset`

`sizeof(Type)` returns the total byte size:

```asm
SpriteSize  .equ sizeof(Sprite)        ; = 3
```

`sizeof` accepts scalar types, named records, unions and arrays:

```asm
sizeof(byte)
sizeof(word)
sizeof(Sprite)
sizeof(Sprite[16])      ; 16 * sizeof(Sprite)
```

`offset(Type, path)` returns the byte offset of a field from the start of the layout:

```asm
SpriteX     .equ offset(Sprite, x)       ; = 0
SpriteY     .equ offset(Sprite, y)       ; = 1
SpriteColor .equ offset(Sprite, color)   ; = 2
```

For a field inside a nested record, continue the path with dots:

```asm
Pos .type
x       .byte
y       .byte
.endtype

Actor .type
tile    .byte
pos     .field Pos
.endtype

ActorTileX  .equ offset(Actor, pos.x)    ; = 1
```

For an array field inside a record, combine the field offset, element stride and
element field offset explicitly:

```asm
Scene .type
header  .word
sprites .field Sprite[4]
.endtype

Idx .equ 2
ThirdColor .equ offset(Scene, sprites) + Idx * sizeof(Sprite) + offset(Sprite, color)
```

You can also index from the array type directly:

```asm
ThirdColorOffset .equ offset(Sprite[16], [2].color)
```

Both expressions fold to constants at assembly time. Add a field to `Sprite` and every `sizeof` and `offset` that refers to it updates automatically.

`offset` is the AZM form, and there is no `offsetof` alias. In the current
assembler, an array index inside an `offset` path must be a non-negative decimal
literal: `offset(Sprite[16], [2].color)` is valid, while `[Idx]` and `[1 + 1]`
are not. A named constant remains valid in the surrounding expression, as in
the `ThirdColor` calculation above. Layout casts accept constant index
expressions.

---

## Using offsets in code

With the constants defined, reading a field from a record at address HL uses straightforward arithmetic:

```asm
  ; HL points to start of a Sprite record
  ld de, SpriteColor     ; DE = 2
  add hl, de             ; HL now points to the color byte
  ld a, (hl)             ; A = color
```

For small offsets, the IX-relative form is more compact. If IX points to the start of a Sprite:

```asm
  ld a, (ix + SpriteColor)   ; read color directly
  ld a, (ix + SpriteX)       ; read x directly
```

This works because `SpriteColor` is the constant 2, and `(ix+d)` accepts any signed 8-bit displacement.

The offset of a later field in a larger type might exceed 127. In that case, IX-relative access fails and you need the `add hl, de` form instead.

For run-time indexing ("give me the Nth sprite" where N is not known until the program runs), you write the Z80 instructions that compute the address. Load the stride into DE, multiply the index by the stride, add the base address, add the field offset.

---

## Arrays of records

To reserve space for N records, use an array type expression with `.ds`:

```asm
sprite_table:
    .ds Sprite[8]
```

You can also put an array inside a record:

```asm
Row .type
cells   .field byte[16]
score   .word
.endtype

RowSize  .equ sizeof(Row)              ; 16 + 2 = 18
ScoreOff .equ offset(Row, score)       ; = 16
```

Array stride is always `sizeof(element)`. A record whose fields do not add up to a power of two still gets an exact packed size; AZM does not round layouts up for you.

![The stride between records is the element size, and the arithmetic that reaches one field of one element.](../../assets/images/azm-book/book2/array-of-records.svg)

---

## Unions

A union declares overlapping fields that share the same memory. You reach for one when the same bytes have more than one legitimate reading: a hardware register you sometimes take as a status byte and sometimes as a 16-bit value, or a message payload whose shape depends on a type field next to it. The union's total size is the size of its largest member:

```asm
Payload .union
asByte  .byte
asWord  .word
.endunion
```

`sizeof(Payload)` is 2, the size of `asWord`. Both fields start at offset 0. Reading `asByte` reads the low byte of whatever 16-bit value is stored there.

![Two named readings of the same bytes, both starting at offset 0.](../../assets/images/azm-book/book2/union-overlay.svg)

Unions can hold named types:

```asm
Pair .type
lo      .byte
hi      .byte
.endtype

Cell .union
raw     .word
pair    .field Pair
tag     .byte
.endunion

sizeof(Cell)                  ; = 2
offset(Cell, raw)             ; = 0
offset(Cell, pair.lo)         ; = 0
offset(Cell, pair.hi)         ; = 1
```

### Alternate views of the same bytes

```asm
Pair .type
lo      .byte
hi      .byte
.endtype

WordView .union
raw     .word
bytes   .field Pair
.endunion

WORD_LO .equ offset(WordView, bytes.lo)
WORD_HI .equ offset(WordView, bytes.hi)
```

At run time you still use plain `ld` / `ld (hl)`, and the union only documents that the low byte of the word and `bytes.lo` share the same offset.

Unions nest inside records:

```asm
Packet .type
header  .byte
data    .field Payload
.endtype
```

`sizeof(Packet)` = `sizeof(byte) + sizeof(Payload)` = 1 + 2 = 3.

---

## Enums

An enum declares a set of named integer constants grouped under a common name:

```asm
Direction .enum North, South, East, West
```

You reach a member through its group name:

```asm
  ld a, Direction.South    ; A = 1
```

Unqualified names are rejected:

```asm
  ld a, South              ; error: Enum member "South" must be qualified.
```

The qualification requirement prevents accidental name collisions when two enums share a short name. `Direction.East` and `Axis.East` can coexist.

Enums produce no memory allocation. Each member is a compile-time constant that can appear anywhere a constant is legal: instruction immediates, `.equ`, `.db`, `.dw` and `.ds`:

```asm
Tile .enum Empty, Wall, Pill, Power

StartTile  .equ Tile.Pill

tile_map:
    .db Tile.Empty, Tile.Wall, Tile.Pill, Tile.Power
```

Member values are assigned sequentially from 0: `North = 0`, `South = 1`, `East = 2`, `West = 3`.

### Enums as state and command names

Enums are **grouped constants with collision protection**: named states, command bytes and token kinds that would otherwise be bare `$00`, `$01`, `$02`.

Store a mode byte in RAM and branch on it:

```asm
GameMode .enum Title, Playing, Paused, GameOver

game_mode:
    .db GameMode.Title

    ...
    ld a, (game_mode)
    cp GameMode.Playing
    jr z, _playing
    cp GameMode.Paused
    jr z, _paused
```

Command dispatch uses the same pattern:

```asm
Command .enum MoveLeft, MoveRight, Rotate, Drop

pending:
    .db Command.Rotate

    ...
    ld a, (pending)
    cp Command.Rotate
    jr z, _do_rotate
```

`Command.Rotate` is still just a byte in memory and in A. For tables of handlers you would still index by that byte yourself; the enum documents which values are legal, not how to jump.

---

## Layout cast syntax

When the base address and the layout are known at assembly time, a layout cast computes a field address in one expression:

```asm
  ld hl, <Sprite[8]>sprite_table[0].color
```

This has four parts:

- `<Sprite[8]>` is the array layout type to apply
- `sprite_table` is the base label
- `[0]` is a compile-time array index (omit when accessing a single record)
- `.color` is the field path

The assembler computes `sprite_table + 0 * sizeof(Sprite) + offset(Sprite, color)` and substitutes the result as an immediate constant.

A higher index with an array qualifier:

```asm
  ld hl, <Sprite[8]>sprite_table[3].color
```

Expands to `sprite_table + 3 * sizeof(Sprite) + offset(Sprite, color)` = `sprite_table + 9 + 2` = `sprite_table + 11`.

Nested fields work the same way:

```asm
  ld hl, <Actor>player.pos.x
```

The index inside the brackets must be a compile-time constant. A named `.equ` used in an **expression** is fine for layout-cast indexes:

```asm
BASE .equ 2
  ld hl, <Sprite[16]>sprite_table[BASE + 1].color
```

That is different from `.ds Sprite[NumSprites]`: reservation with `Type[N]` requires a **literal** `N` in the current assembler; use `.ds NumSprites * sizeof(Sprite)` for a named count.

A runtime register is not valid:

```asm
  ld hl, <Sprite[8]>sprite_table[hl].color    ; invalid: HL is not a constant
```

Layout casts fold to a **constant address** at assembly time. The CPU never sees `<Sprite>`; it only sees `ld hl, imm16` or `ld a, (imm16)`.

Layout casts also work inside memory operands. The parentheses are ordinary Z80 dereference syntax, meaning "byte at address":

```asm
  ld a, (<Sprite[8]>sprite_table[3].color)
```

After folding, this is `ld a, (sprite_table + 11)`, not a special typed load.

The long form and the cast form must agree:

```asm
ld hl, sprite_table + (3 * sizeof(Sprite)) + offset(Sprite, color)
ld hl, <Sprite[8]>sprite_table[3].color
```

Use whichever reads more clearly at the call site.

---

## A worked example: a table of 2D points

Define a record for a 2D point with integer coordinates:

```asm
Point .type
x   .byte
y   .byte
.endtype

POINT_SIZE  .equ sizeof(Point)
POINT_X     .equ offset(Point, x)
POINT_Y     .equ offset(Point, y)

NumPoints   .equ 4

points:
    .ds NumPoints * sizeof(Point)   ; 8 bytes: space for 4 points
```

To initialize the table instead of reserving uninitialized storage, replace the
`points` declaration above with:

```asm
points:
  .db 10, 20    ; Point 0: x=10, y=20
  .db 30, 15    ; Point 1: x=30, y=15
  .db  5, 40    ; Point 2: x=5,  y=40
  .db 25, 25    ; Point 3: x=25, y=25
```

A loop that reads every x coordinate and accumulates a sum:

```asm
; In:  (no register inputs — reads from 'points' table directly)
; Out: A = sum of all x coordinates (mod 256)
; Clobbers: B, D, E, F, HL
sum_x_coords:
  ld hl, points          ; HL = base of points table
  ld b, NumPoints        ; B  = loop count
  ld a, 0                ; A  = running sum
  ld d, 0                ; D  = high byte for HL arithmetic
  ld e, POINT_SIZE       ; E  = stride (sizeof(Point) = 2)
SumXLoop:
  add a, (hl)            ; add x coordinate (field offset 0)
  add hl, de             ; advance HL by POINT_SIZE to next point
  djnz SumXLoop
  ret
```

Reading the y coordinate instead of x requires adjusting the starting offset. Since `POINT_Y = 1`, add 1 to HL before the loop:

```asm
  ld hl, points + POINT_Y    ; HL = address of first y coordinate
```

The expression `points + POINT_Y` is computed at assembly time: `points + 1`.

For a two-field read (both x and y from the same entry), load x, then add 1 to HL, then load y:

```asm
ReadXYLoop:
  ld c, (hl)             ; C = x coordinate
  inc hl                 ; advance to y
  ld d, (hl)             ; D = y coordinate; B remains the loop count
  ; process C (x) and D (y) here
  inc hl                 ; advance past y to next entry
  djnz ReadXYLoop
```

Because `sizeof(Point) = 2` and the fields are at offsets 0 and 1, each `inc hl` steps exactly one field. For a type with more fields, load DE with `POINT_SIZE` once before the loop and use `add hl, de` to step.

If you need a specific entry's address at assembly time, the layout cast gives it directly:

```asm
  ld hl, <Point[4]>points[2].y    ; address of y in Point 2
```

The assembler computes `points + 2 * sizeof(Point) + offset(Point, y)` = `points + 4 + 1` = `points + 5` and loads that constant address into HL.

---

## Exercises

**1. Compute sizes and offsets by hand.** Given this type:

```asm
Enemy .type
hp      .byte
x       .word
y       .word
flags   .byte
.endtype
```

Without running AZM, compute `sizeof(Enemy)`, `offset(Enemy, x)`, `offset(Enemy, y)` and `offset(Enemy, flags)`. Then write the `.equ` lines for each. Finally, write the `.ds` line that allocates space for 16 enemies using the array type form.

**2. Read a field with IX.** A subroutine receives a pointer to an `Enemy` record in IX. Write the instructions to load the `hp` field into A, the `x` field into DE (low byte in E, high byte in D) and the `flags` field into C. Use the symbolic offset constants from Exercise 1, not hardcoded numbers.

**3. Write a layout cast.** Using the `Enemy` type from Exercise 1, write the instruction that loads the address of the `flags` field of `enemy_table[4]` into HL, where `enemy_table` is the base label. Verify your answer: what numeric offset from `enemy_table` does this expand to?

**4. Enum in a dispatch.** Define an enum `Command` with members `Move`, `Attack`, `Wait`, `Retreat`. Write the instruction that loads the value of `Command.Attack` into A. Then write a comment explaining why `ld a, Attack` would fail to assemble.

**5. Union offsets.** Given `WordView` from this chapter (`raw` as `.word`, `bytes` as `.field Pair`), write `.equ` lines for `WORD_LO` and `WORD_HI` using `offset`. What is `sizeof(WordView)`? Why are `offset(WordView, raw)` and `offset(WordView, bytes.lo)` both 0?

---

[← Register Contracts](12-register-contracts-azmdoc.md) | [Book 2](index.md) | [Op Declarations →](14-op-declarations.md)
