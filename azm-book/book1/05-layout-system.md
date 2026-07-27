---
layout: default
title: "The Layout System"
parent: "AZM Book 1 — Assembler Manual"
nav_order: 5
---

# The Layout System

You have stored a sprite table as raw bytes. Each sprite occupies four bytes (an x position, a y position, a tile index and a flags byte), and you have `.equ` constants for each field offset. You insert a new field. Every constant after the insertion is now wrong, along with every access expression built on it.

AZM's layout system replaces those manual constants with one record
declaration. `sizeof` and `offset` then derive byte counts and field positions
from its field list.

---

## The core idea

Written by hand, a sprite record needs one `.equ` per field offset:

```asm
SPRITE_X     .equ 0
SPRITE_Y     .equ 1
SPRITE_TILE  .equ 2
SPRITE_FLAGS .equ 3
SPRITE_SIZE  .equ 4

Sprites:
    .ds 16 * SPRITE_SIZE
```

Adding a field between `SPRITE_TILE` and `SPRITE_FLAGS` makes both `SPRITE_FLAGS` and `SPRITE_SIZE` wrong.

A type declaration replaces the manual constants:

```asm
Sprite  .type
x       .field byte
y       .field byte
tile    .field byte
flags   .field byte
        .endtype

Sprites:
    .ds Sprite[16]
```

`sizeof(Sprite)` evaluates to 4. `offset(Sprite, flags)` evaluates to 3. A new
field between `tile` and `flags` updates both values automatically. A mistyped
field name such as `offset(Sprite, flagz)` is rejected at assembly time.

---

## Scalar types, sizeof and arrays

Three scalar names are the building blocks for field sizes:

| Name | Byte count |
|------|------------|
| `byte` | 1 |
| `word` | 2 |
| `addr` | 2 |

These names are valid in size positions: inside `.type` / `.union` declarations and as `.ds` operands. `word` and `addr` have the same size. `addr` documents that a field is intended to contain an address; AZM currently applies no separate address type checking.

`sizeof(Type)` returns the exact packed byte count for a type. The result is an ordinary integer constant, valid anywhere an expression is valid:

```asm
sizeof(byte)         ; 1
sizeof(word)         ; 2
sizeof(Sprite)       ; sum of Sprite's field sizes

SPRITE_SIZE .equ sizeof(Sprite)
TOTAL_RAM   .equ MAX_SPRITES * sizeof(Sprite)
```

A type followed by a bracket count forms an array type expression:

```asm
byte[32]     ; 32 bytes
word[8]      ; 16 bytes
Sprite[16]   ; sizeof(Sprite) * 16 bytes
```

Array type expressions appear in `.ds` operands, `.field` declarations and `sizeof` / `offset` arguments:

```asm
.ds byte[32]    ; same as .ds 32
.ds Sprite[16]  ; same as .ds sizeof(Sprite) * 16
```

The count inside the brackets of a `.ds` operand must be a numeric literal. For a named count, multiply explicitly:

```asm
MAX_SPRITES .equ 16
.ds MAX_SPRITES * sizeof(Sprite)
```

When the count is needed as a numeric constant (for a `.equ`, for example),
`sizeof` provides it: `SIZE .equ sizeof(byte[32])`. `.equ` needs a numeric
value, not a type expression.

---

## Records with `.type`

A record type is a `.type` layout with named fields.

### Field declarations

A `.type` declaration uses the name-left form, with the record name first, then `.type`. Inside the block, `.field` declares one named field. The token after `.field` is the field's layout type expression:

```asm
Sprite  .type
x       .field byte
y       .field byte
tile    .field byte
flags   .field byte
        .endtype
```

Each field has a name, a size and an offset the assembler computes by summing the preceding fields:

| Declaration | Meaning |
|-------------|---------|
| `name .field byte` | 1-byte field |
| `name .field word` | 2-byte field |
| `name .field TypeExpr` | field of any layout size |

AZM also provides concise forms for the three scalar field sizes:

| Declaration | Equivalent form |
|-------------|-----------------|
| `name .byte` | `name .field byte` |
| `name .word` | `name .field word` |
| `name .addr` | `name .field addr` |

The explicit `.field` form is required when the size is a type expression, such as an array or a nested record type:

```asm
Buffer  .type
data    .field byte[256]    ; 256 bytes
cursor  .field word         ; 2 bytes
        .endtype

Actor   .type
pos     .field Sprite       ; nested record
state   .field byte
timer   .field word
        .endtype
```

After the declaration, `sizeof` and `offset` give you the assembler-time constants:

```asm
SPRITE_SIZE  .equ sizeof(Sprite)           ; 4
SPRITE_X     .equ offset(Sprite, x)        ; 0
SPRITE_Y     .equ offset(Sprite, y)        ; 1
SPRITE_TILE  .equ offset(Sprite, tile)     ; 2
SPRITE_FLAGS .equ offset(Sprite, flags)    ; 3
```

An `.equ` line is useful when a name appears in multiple places. A one-off constant can remain a direct `sizeof` or `offset` expression in its operand.

### Allocating and accessing records

A `.ds` declaration allocates a single record, whose fields are accessed through offset constants:

```asm
Player:
        .ds Sprite        ; sizeof(Sprite) bytes, uninitialized

        ld   ix,Player
        ld   a,(ix + SPRITE_X)
        inc  a
        ld   (ix + SPRITE_X),a
```

Multiplying the record size allocates an array of records:

```asm
SpriteTable:
        .ds Sprite[16]
```

Accessing element `N` at assemble time, when `N` is a constant:

```asm
N       .equ 3
        ld   hl,SpriteTable + N * sizeof(Sprite) + SPRITE_FLAGS
        ld   a,(hl)
```

For runtime indexing, when the index is in a register, write the address arithmetic explicitly:

```asm
; A = sprite index (0..15)
        ld   hl,SpriteTable
        ld   b,0
        ld   c,a
        add  hl,bc
        add  hl,bc
        add  hl,bc
        add  hl,bc            ; HL = SpriteTable + A * 4
```

### Nested fields and array paths

When a record embeds another record, `offset` reaches through both layers with a dotted path:

```asm
Actor   .type
pos     .field Sprite
state   .field byte
        .endtype

ACTOR_POS_X  .equ offset(Actor, pos.x)     ; 0
ACTOR_POS_Y  .equ offset(Actor, pos.y)     ; 1
ACTOR_STATE  .equ offset(Actor, state)     ; sizeof(Sprite)
```

`offset` also accepts an array index step inside the path:

```asm
offset(Sprite[16], [2].flags)
```

This returns the byte offset of the `flags` field of element 2: `2 * sizeof(Sprite) + offset(Sprite, flags)`. The index must be a numeric literal.

```asm
ELEM2_FLAGS .equ offset(Sprite[16], [2].flags)

        ld   hl,Sprites + ELEM2_FLAGS
        ld   a,(hl)
```

![sizeof and offset derive every constant from the field list, through nested records and array elements](../../assets/images/azm-book/book1/record-layout.svg)

---

## Named aliases with `.typealias`

A `.typealias` declaration gives a name to any layout type expression. The declared name is a transparent assembler-time alias: the assembler substitutes the full type expression at every use.

```asm
SpriteArray .typealias Sprite[16]
```

`SpriteArray` now works anywhere a type expression works:

```asm
Sprites:
        .ds SpriteArray

SIZE    .equ sizeof(SpriteArray)
FLAGS   .equ offset(SpriteArray, [3].flags)

        ld   hl,<SpriteArray>Sprites[3].flags
```

`sizeof(SpriteArray)` returns the same value as `sizeof(Sprite[16])`, and the cast path `<SpriteArray>Sprites[3].flags` expands to `Sprites + offset(Sprite[16], [3].flags)`.

A `.typealias` names the array type directly, so with `SpriteArray .typealias Sprite[16]` the cast path to element 3's `flags` field is `[3].flags`. A wrapper record with a `.field` declaration adds an extra path level:

```asm
SpriteArray .type
sprites     .field Sprite[16]
            .endtype
```

With that declaration, the same field requires `.sprites[3].flags`; the `.sprites` step is part of the type structure.

---

## Cast syntax

A layout cast tells AZM to treat an address as a particular layout while it calculates field offsets. It works entirely at assembly time, and the emitted bytes are the same:

```asm
ld   hl,<Sprite>Player.flags
ld   hl,<Sprite[16]>Sprites[3].flags
```

The structure is `<TypeExpr>base[index].field`, where `<TypeExpr>` is the layout to apply, `base` is a label or address expression, each `[index]` is an array step and each `.field` is a field name step. These two lines produce the same assembled bytes:

```asm
ld   hl,Sprites + (3 * sizeof(Sprite)) + offset(Sprite, flags)
ld   hl,<Sprite[16]>Sprites[3].flags
```

Parentheses perform memory access; the cast path itself resolves to an address:

```asm
ld   a,(<Sprite[16]>Sprites[3].flags)   ; load byte at that address
ld   hl,<Sprite[16]>Sprites[3].flags    ; load the address itself into HL
```

Indices inside a cast path must be assembler-time constant expressions:

```asm
IDX .equ 3
ld   hl,<Sprite[16]>Sprites[IDX].flags      ; valid: IDX is a constant
ld   hl,<Sprite[16]>Sprites[HL].flags       ; error: HL is not a constant
```

Dot notation reaches nested record fields by the same rules:

```asm
ld   hl,<Actor>Player.pos.x
; Equivalent to:
ld   hl,Player + offset(Actor, pos.x)
```

![A cast path is another spelling of an address the arithmetic could reach anyway](../../assets/images/azm-book/book1/cast-paths.svg)

---

## Unions and alternate views

A union describes multiple overlapping views of the same bytes. All union members start at offset zero; the union's size is the size of its largest member. Packed data that can be read as either a byte or a 16-bit value is a natural fit:

```asm
PortValue .union
status  .field byte    ; byte-wide access
full    .field word    ; word-wide access
        .endunion

IoPort  .type
ptr     .field word
value   .field PortValue
        .endtype

Port:   .ds IoPort
```

![Every union member starts at offset 0, so the size is the largest member rather than the sum](../../assets/images/azm-book/book1/union-overlay.svg)

Cast syntax reaches union members by the same rules as record fields:

```asm
ld   a,(<IoPort>Port.value.status)    ; read the status byte
ld   hl,(<IoPort>Port.value.full)     ; read the full word
```
