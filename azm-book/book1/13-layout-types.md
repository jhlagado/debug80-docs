---
layout: default
title: "Chapter 13 — Layout Types"
parent: "AZM Book 1 — Z80 Fundamentals"
grand_parent: "AZM Books"
nav_order: 13
---
[← Register Contracts](12-register-contracts-azmdoc.md) | [Book 1](index.md) | [Op Declarations →](14-op-declarations.md)

# Chapter 13 — Layout Types

`find_max` and `count_above` work on a table where each entry is a single byte. Every entry is the same size, and the loop stepping is simple: `inc hl`.

Now consider a table where each entry holds three pieces of data — an x coordinate, a y coordinate, and a color byte. Each entry is 3 bytes wide. The x is at offset 0 within the entry, y at offset 1, color at offset 2.

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

That works as long as the layout never changes. Add a field before color and every offset below it is wrong. Rename a field and every comment referring to it is stale. The code and the layout exist in two separate places — the bytes in memory, and the mental model in your head and comments — with no mechanism to keep them in sync.

AZM's layout type system closes that gap. You describe a record once, and the assembler computes every size and offset from that description at assembly time. The CPU still performs the actual address arithmetic at run time — AZM does not generate hidden indexing code. It gives you named constants so the layout lives in one place.

**AZM does not add hidden data access. It gives names to layout facts.** Layout types are not runtime types — they are **compile-time memory contracts**, the same way AZMDoc documents register boundaries at subroutine calls. One names what crosses a `call`; the other names what sits at each byte offset in a record. Both keep intent explicit while the emitted machine code stays visible.

---

## Scalar types: `byte`, `word`, and `addr`

Before you define a record, you need names for the basic building blocks.

In AZM, `byte`, `word`, and `addr` are layout type names:

| Type  | Size   | Meaning                                      |
| ----- | ------ | -------------------------------------------- |
| byte  | 1 byte | an 8-bit value                               |
| word  | 2 bytes| a 16-bit little-endian value                 |
| addr  | 2 bytes| an address (same size as word; name shows intent) |

You can ask the assembler how big each one is:

```asm
BYTE_SIZE  .equ sizeof(byte)    ; = 1
WORD_SIZE  .equ sizeof(word)    ; = 2
ADDR_SIZE  .equ sizeof(addr)    ; = 2
```

These are compile-time constants, like any `.equ`. They fold to plain numbers in your instructions.

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

`.ds byte[32]` means "reserve the same number of bytes as an array of 32 bytes" — 32 bytes. The brackets here describe a type shape for size calculation, not a runtime container. Nothing is initialized; `.ds` only reserves space. An optional fill byte still works:

```asm
Zeros:
    .ds word[8], 0        ; 16 bytes, each filled with 0
```

You can still write `.ds sizeof(byte[32])` if you prefer the explicit form. Both mean the same thing.

---

## Defining a record with `.type`

A record groups named fields into one layout. Declare it in a block:

```asm
.type Sprite
x       .byte
y       .byte
color   .byte
.endtype
```

`.type Name` opens the block. `.endtype` closes it. Each line names a field and gives its type.

Inside a layout block, `.byte`, `.word`, and `.addr` are shorthands:

```asm
field .byte    ; same as: field .field byte
field .word    ; same as: field .field word
field .addr    ; same as: field .field addr
```

You can also spell out the size explicitly with `.field`:

```asm
.type Bullet
x       .field 1
y       .field 1
timer   .word
ptr     .addr
blob    .field 3
.endtype
```

`.field 3` means three raw bytes with no scalar name. `.word` and `.field word` both contribute 2 bytes to the record.

Field declarations do not allocate memory. A `.type` block is a layout description — it tells the assembler the shape of a record so it can compute offsets and sizes. Memory comes from `.db`, `.dw`, or `.ds`:

```asm
sprite_table:
    .ds Sprite[8]         ; space for 8 sprites
```

`.ds Sprite[8]` reserves `sizeof(Sprite) * 8` bytes. The label `sprite_table` is an ordinary address. AZM does not permanently attach a type to it; you supply the layout when you need a constant offset (covered later in this chapter).

### Named element counts

When the number of elements is a named constant, multiply explicitly — the current assembler accepts literal counts inside `Type[N]` for `.ds`, not a `.equ` name in those brackets:

```asm
NumSprites .equ 16

sprite_table:
    .ds NumSprites * sizeof(Sprite)   ; same bytes as .ds Sprite[16]
```

Use `.ds Sprite[16]` when the count is written as a literal in source. Use `.ds Count * sizeof(Sprite)` when the count lives in a `.equ`. Book 3's ring buffer uses the same idea for scalar buffers: `.ds RING_CAP` alongside `.ds byte[8]` for a fixed width.

A `.type` block must list fields. One-line aliases such as `.type Pair byte[2]` are rejected — if you need a pair of bytes, write the fields:

```asm
.type Pair
lo      .byte
hi      .byte
.endtype
```

The older colon form (`x: byte`) is also not AZM syntax. Use the block form above.

---

## `sizeof` and `offset`

Two compile-time expressions derive constants from a layout.

`sizeof(Type)` returns the total byte size:

```asm
SpriteSize  .equ sizeof(Sprite)        ; = 3
```

`sizeof` accepts scalar types, named records, unions, and arrays:

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
.type Pos
x       .byte
y       .byte
.endtype

.type Actor
tile    .byte
pos     .field Pos
.endtype

ActorTileX  .equ offset(Actor, pos.x)    ; = 1
```

For an array field inside a record, put the index in brackets:

```asm
.type Scene
header  .word
sprites .field Sprite[4]
.endtype

Idx .equ 3
ThirdColor .equ offset(Scene, sprites[Idx].color)
```

You can also index from the array type directly:

```asm
FlagsOffset .equ offset(Sprite[16], [2].flags)
```

Both expressions fold to constants at assembly time. Add a field to `Sprite` and every `sizeof` and `offset` that refers to it updates automatically.

`offset` is the only AZM spelling — there is no `offsetof` alias. Unknown types, unknown fields, and non-constant indexes are rejected.

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

This works because `SpriteColor` is the constant 2, and `(ix+d)` accepts any signed 8-bit displacement. As long as the offset fits in one byte (0 to 127), the constants drop directly into indexed load instructions.

The offset of a later field in a larger type might exceed 127. In that case, IX-relative access fails and you need the `add hl, de` form instead.

For run-time indexing — "give me the Nth sprite" where N is not known until the program runs — you write the Z80 instructions that compute the address. Load the stride into DE, multiply the index by the stride, add the base address, add the field offset. AZM gives you `sizeof(Sprite)` and `offset(Sprite, color)` as named constants; the multiply and add are yours to write.

---

## Arrays of records

To reserve space for N records, use an array type expression with `.ds`:

```asm
sprite_table:
    .ds Sprite[8]
```

That reserves exactly `8 * sizeof(Sprite)` bytes. The equivalent spelling `.ds sizeof(Sprite[8])` means the same thing.

You can also put an array inside a record:

```asm
.type Row
cells   .field byte[16]
score   .word
.endtype

RowSize  .equ sizeof(Row)              ; 16 + 2 = 18
ScoreOff .equ offset(Row, score)       ; = 16
```

Array stride is always `sizeof(element)`. A record whose fields do not add up to a power of two still gets an exact packed size — AZM does not round layouts up for you.

---

## Unions

A union declares overlapping fields that share the same memory. The union's total size is the size of its largest member:

```asm
.union Payload
asByte  .byte
asWord  .word
.endunion
```

`sizeof(Payload)` is 2 — the size of `asWord`. Both fields start at offset 0. Reading `asByte` reads the low byte of whatever 16-bit value is stored there. Reading `asWord` reads both bytes as a word.

Unions can hold named types:

```asm
.type Pair
lo      .byte
hi      .byte
.endtype

.union Cell
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

Unions matter when the **same address** should be described two ways — as a 16-bit quantity or as low/high bytes, as a raw port byte or as flag bits:

```asm
.type Pair
lo      .byte
hi      .byte
.endtype

.union WordView
raw     .word
bytes   .field Pair
.endunion

WORD_LO .equ offset(WordView, bytes.lo)
WORD_HI .equ offset(WordView, bytes.hi)
```

`sizeof(WordView)` is 2. `offset(WordView, raw)` and `offset(WordView, bytes.lo)` are both 0; `offset(WordView, bytes.hi)` is 1. At run time you still use plain `ld` / `ld (hl)` — the union only documents that the low byte of the word and `bytes.lo` share the same offset. Book 3's bit-pattern chapter treats a status byte as flags; a union could also name `raw` vs `flags` views of one hardware register when you want both spellings in layout constants.

Unions nest inside records:

```asm
.type Packet
header  .byte
data    .field Payload
.endtype
```

`sizeof(Packet)` = `sizeof(byte) + sizeof(Payload)` = 1 + 2 = 3. The offset of `data` is 1.

---

## Enums

An enum declares a set of named integer constants grouped under a common name:

```asm
enum Direction North, South, East, West
```

Members are accessed with qualified syntax:

```asm
  ld a, Direction.South    ; A = 1
```

Unqualified names are rejected:

```asm
  ld a, South              ; error: unqualified enum member
```

The qualification requirement prevents accidental name collisions when two enums share a short name. `Direction.East` and `Axis.East` can coexist.

Enums produce no memory allocation. Each member is a compile-time constant that can appear anywhere a constant is legal — instruction immediates, `.equ`, `.db`, `.dw`, and `.ds`:

```asm
enum Tile Empty, Wall, Pill, Power

StartTile  .equ Tile.Pill

tile_map:
    .db Tile.Empty, Tile.Wall, Tile.Pill, Tile.Power
```

Member values are assigned sequentially from 0: `North = 0`, `South = 1`, `East = 2`, `West = 3`.

### Enums as state and command names

Enums are not high-level data types. They are **grouped constants with collision protection** — named states, command bytes, and token kinds that would otherwise be bare `$00`, `$01`, `$02`.

Store a mode byte in RAM and branch on it:

```asm
enum GameMode Title, Playing, Paused, GameOver

game_mode:
    .db GameMode.Title

    ...
    ld a, (game_mode)
    cp GameMode.Playing
    jr z, .playing
    cp GameMode.Paused
    jr z, .paused
```

`GameMode.Playing` assembles to the constant `1`. The qualification prevents a short name like `Playing` from colliding with a label elsewhere.

Command dispatch uses the same pattern:

```asm
enum Command MoveLeft, MoveRight, Rotate, Drop

pending:
    .db Command.Rotate

    ...
    ld a, (pending)
    cp Command.Rotate
    jr z, .do_rotate
```

`Command.Rotate` is still just a byte in memory and in A. The enum carries **intent** for the reader and the assembler; it does not add runtime checking. For tables of handlers you would still index by that byte yourself — the enum documents which values are legal, not how to jump.

---

## Layout cast syntax

When the base address and the layout are known at assembly time, a layout cast computes a field address in one expression:

```asm
  ld hl, <Sprite>sprite_table[0].color
```

This has four parts:

- `<Sprite>` — the layout type to apply
- `sprite_table` — the base label
- `[0]` — a compile-time array index (omit when accessing a single record)
- `.color` — the field path

The assembler computes `sprite_table + 0 * sizeof(Sprite) + offset(Sprite, color)` and substitutes the result as an immediate constant. The generated instruction loads a constant address into HL.

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

That is different from `.ds Sprite[NumSprites]` — reservation with `Type[N]` requires a **literal** `N` in the current assembler; use `.ds NumSprites * sizeof(Sprite)` for a named count.

A runtime register is not valid:

```asm
  ld hl, <Sprite>sprite_table[hl].color    ; invalid: HL is not a constant
```

Layout casts fold to a **constant address** at assembly time. `<Sprite[8]>sprite_table[3].color` is not a typed pointer, not a load, and not runtime indexing — the assembler replaces the whole expression with one number (for example `sprite_table + 11`) that you could have written by hand. The CPU never sees `<Sprite>`; it only sees `ld hl, imm16` or `ld a, (imm16)`. If the index is not known until the program runs, you cannot use a layout cast; write the multiply-and-add in Z80 instructions yourself.

Layout casts also work inside memory operands. The parentheses are ordinary Z80 dereference syntax — they mean "byte at address":

```asm
  ld a, (<Sprite[8]>sprite_table[3].color)
```

After folding, this is `ld a, (sprite_table + 11)`, not a special typed load.

The long form and the cast form must agree:

```asm
ld hl, sprite_table + (3 * sizeof(Sprite)) + offset(Sprite, color)
ld hl, <Sprite[8]>sprite_table[3].color
```

Both assemble to the same constant. Use whichever reads more clearly at the call site.

---

## A worked example: a table of 2D points

Define a record for a 2D point with integer coordinates:

```asm
.type Point
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

Named counts work through ordinary expression arithmetic, not through `Point[NumPoints]` in `.ds`.

Initialize the table in ROM with four points:

```asm
  .db 10, 20    ; Point 0: x=10, y=20
  .db 30, 15    ; Point 1: x=30, y=15
  .db  5, 40    ; Point 2: x=5,  y=40
  .db 25, 25    ; Point 3: x=25, y=25
```

A loop that reads every x coordinate and accumulates a sum:

```asm
; In:  (no register inputs — reads from 'points' table directly)
; Out: A = sum of all x coordinates (mod 256)
; Clobbers: B, D, E, HL
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

Each iteration reads the byte at HL (which starts at `points` and steps by `POINT_SIZE` each time), accumulates it in A, and advances HL to the next entry.

Reading the y coordinate instead of x requires adjusting the starting offset. Since `POINT_Y = 1`, add 1 to HL before the loop:

```asm
  ld hl, points + POINT_Y    ; HL = address of first y coordinate
```

Now the loop reads every y coordinate. The expression `points + POINT_Y` is computed at assembly time: `points + 1`.

For a two-field read (both x and y from the same entry), load x, then add 1 to HL, then load y:

```asm
ReadXYLoop:
  ld c, (hl)             ; C = x coordinate
  inc hl                 ; advance to y
  ld b, (hl)             ; B = y coordinate
  ; process C (x) and B (y) here
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

## Summary

- `byte`, `word`, and `addr` are scalar layout types. `sizeof(byte)` is 1; `sizeof(word)` is 2.
- `.type Name` / `.endtype` declares a packed record layout. Fields use `.byte`, `.word`, `.addr`, or `.field N`. Field declarations do not allocate memory.
- `.ds TypeExpr` reserves storage: `.ds byte`, `.ds word[8]`, `.ds Sprite`, `.ds Sprite[16]`, or `.ds Count * sizeof(Sprite)` for a named element count.
- `sizeof(Type)` returns the exact byte size. `sizeof(Sprite[16])` returns `16 * sizeof(Sprite)`.
- `offset(Type, path)` returns a field's byte offset. Paths can nest (`pos.x`) and index arrays (`sprites[3].color`, or `offset(Sprite[16], [2].flags)`).
- Use `.equ` to name these constants, then use the names in instructions and `.ds` directives.
- Offsets that fit in a signed byte (0–127) can go directly into `(ix+d)` instructions.
- `<TypeExpr>label[i].field` computes a constant field address. Indexes must be compile-time constants; runtime registers are rejected.
- `.union Name` / `.endunion` declares overlapping fields. The union's size is the size of its largest member.
- `enum Name Member1, Member2, ...` defines qualified integer constants. Access them as `Name.Member`. Enums do not emit bytes.

---

## Exercises

**1. Compute sizes and offsets by hand.** Given this type:

```asm
.type Enemy
hp      .byte
x       .word
y       .word
flags   .byte
.endtype
```

Without running AZM, compute `sizeof(Enemy)`, `offset(Enemy, x)`, `offset(Enemy, y)`, and `offset(Enemy, flags)`. Then write the `.equ` lines for each. Finally, write the `.ds` line that allocates space for 16 enemies using the array type form.

**2. Read a field with IX.** A subroutine receives a pointer to an `Enemy` record in IX. Write the instructions to load the `hp` field into A, the `x` field into DE (low byte in E, high byte in D), and the `flags` field into C. Use the symbolic offset constants from Exercise 1, not hardcoded numbers.

**3. Write a layout cast.** Using the `Enemy` type from Exercise 1, write the instruction that loads the address of the `flags` field of `enemy_table[4]` into HL, where `enemy_table` is the base label. Verify your answer: what numeric offset from `enemy_table` does this expand to?

**4. Enum in a dispatch.** Define an enum `Command` with members `Move`, `Attack`, `Wait`, `Retreat`. Write the instruction that loads the value of `Command.Attack` into A. Then write a comment explaining why `ld a, Attack` would fail to assemble.

**5. Union offsets.** Given `WordView` from this chapter (`raw` as `.word`, `bytes` as `.field Pair`), write `.equ` lines for `WORD_LO` and `WORD_HI` using `offset`. What is `sizeof(WordView)`? Why are `offset(WordView, raw)` and `offset(WordView, bytes.lo)` both 0?

---

[← Register Contracts](12-register-contracts-azmdoc.md) | [Book 1](index.md) | [Op Declarations →](14-op-declarations.md)
