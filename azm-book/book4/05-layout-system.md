---
layout: default
title: "Chapter 5 — The Layout System"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 5
---
[← Raw Data, Storage and Strings](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)

# Chapter 5 — The Layout System

You have stored a sprite table as raw bytes. Each sprite occupies four bytes — an x position, a y position, a tile index and a flags byte — and you have `.equ` constants for each field offset. You insert a new field. Every constant after the insertion is now wrong, along with every access expression built on it. With sixteen sprites and a dozen routines touching the table, updating them all by hand is where bugs enter.

AZM's layout system replaces those manual constants with a declaration. Describe the record once; `sizeof` and `offset` give you byte counts and field positions anywhere you need them, derived automatically from the field list.

---

## The core idea

The standard approach for a sprite record is a set of `.equ` constants for the field offsets:

```asm
SPRITE_X     .equ 0
SPRITE_Y     .equ 1
SPRITE_TILE  .equ 2
SPRITE_FLAGS .equ 3
SPRITE_SIZE  .equ 4

SPRITES:
    .ds 16 * SPRITE_SIZE
```

Insert a field between `SPRITE_TILE` and `SPRITE_FLAGS` and both `SPRITE_FLAGS` and `SPRITE_SIZE` are wrong. Every constant after the insertion needs a new value, and every access expression that uses those constants needs checking.

A type declaration replaces the manual constants:

```asm
Sprite  .type
x       .byte
y       .byte
tile    .byte
flags   .byte
        .endtype

SPRITES:
    .ds Sprite[16]
```

`sizeof(Sprite)` evaluates to 4. `offset(Sprite, flags)` evaluates to 3. Insert a new field between `tile` and `flags`, and both values update automatically. If you mistype a field name — `offset(Sprite, flagz)` — the assembler rejects it at assemble time. With manual constants, the same typo assembles silently with the wrong value.

---

## Scalar types, sizeof and arrays

Two scalar types are the building blocks for field sizes:

| Name | Byte count |
|------|------------|
| `byte` | 1 |
| `word` | 2 |

These names are valid in size positions — inside `.type` / `.union` declarations and as `.ds` operands. The parser also accepts `addr` as an alias for `word` but `word` is the preferred form for 16-bit fields.

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

Array type expressions appear in `.ds` operands, `.field` declarations and `sizeof` / `offset` arguments. `.ds` accepts a type expression wherever it needs a byte count:

```asm
.ds byte[32]    ; same as .ds 32
.ds Sprite[16]  ; same as .ds sizeof(Sprite) * 16
```

`byte[32]` is a type expression. `.ds byte[32]` consumes it directly as a byte count. When you need that count as a numeric constant — for a `.equ`, for example — use `sizeof`: `SIZE .equ sizeof(byte[32])`. `.equ` needs a numeric value, not a type expression.

---

## Records with `.type`

A record type is a `.type` layout with named fields. Declare a record once and AZM computes every field's byte offset from the declaration.

### Field declarations

A `.type` declaration uses the name-left form — the record name first, then `.type`:

```asm
Sprite  .type
x       .byte
y       .byte
flags   .byte
ptr     .word
        .endtype
```

Each field has a name, a size and an offset the assembler computes by summing the preceding fields:

| Declaration | Meaning |
|-------------|---------|
| `name .byte` | 1-byte field |
| `name .word` | 2-byte field |
| `name .field TypeExpr` | field of any layout size |

`.byte` and `.word` are shorthand for `.field byte` and `.field word`. Use `.field` when the size is a type expression — an array or a nested record type:

```asm
Buffer  .type
data    .field byte[256]    ; 256 bytes
cursor  .word               ; 2 bytes
        .endtype

Actor   .type
pos     .field Sprite       ; nested record
state   .byte
timer   .word
        .endtype
```

After the declaration, `sizeof` and `offset` give you the assembler-time constants:

```asm
SPRITE_SIZE  .equ sizeof(Sprite)           ; 5
SPRITE_X     .equ offset(Sprite, x)        ; 0
SPRITE_Y     .equ offset(Sprite, y)        ; 1
SPRITE_FLAGS .equ offset(Sprite, flags)    ; 2
SPRITE_PTR   .equ offset(Sprite, ptr)      ; 3
```

These are ordinary integer constants. Use them in `.equ` lines when the name will appear in multiple places; use `sizeof` and `offset` directly in operands when the constant is used once.

### Allocating and accessing records

Allocate a single record with `.ds` and access its fields through offset constants:

```asm
PLAYER:
        .ds Sprite        ; sizeof(Sprite) bytes, uninitialized

        ld   ix,PLAYER
        ld   a,(ix + SPRITE_X)
        inc  a
        ld   (ix + SPRITE_X),a
```

Allocate an array of records the same way:

```asm
SPRITE_TABLE:
        .ds Sprite[16]
```

Accessing element `n` at assemble time — when `n` is a constant:

```asm
N       .equ 3
        ld   hl,SPRITE_TABLE + N * sizeof(Sprite) + SPRITE_FLAGS
        ld   a,(hl)
```

For runtime indexing — when `n` is in a register — write the address arithmetic explicitly:

```asm
; A = sprite index (0..15)
        ld   hl,SPRITE_TABLE
        ld   b,0
        ld   c,a
        add  hl,bc
        add  hl,bc
        add  hl,bc
        add  hl,bc
        add  hl,bc            ; HL = SPRITE_TABLE + A * 5
```

### Nested fields and array paths

When a record embeds another record, `offset` reaches through both layers with a dotted path:

```asm
Actor   .type
pos     .field Sprite
state   .byte
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

        ld   hl,SPRITES + ELEM2_FLAGS
        ld   a,(hl)
```

---

## Named aliases with `.typealias`

A `.typealias` declaration gives a name to any layout type expression. The declared name is a transparent assembler-time alias: the assembler substitutes the full type expression at every use.

The primary use is naming an array of records:

```asm
SpriteArray .typealias Sprite[16]
```

`SpriteArray` now works anywhere a type expression works:

```asm
SPRITES:
        .ds SpriteArray

SIZE    .equ sizeof(SpriteArray)
FLAGS   .equ offset(SpriteArray, [3].flags)

        ld   hl,<SpriteArray>SPRITES[3].flags
```

The alias is transparent: `sizeof(SpriteArray)` returns the same value as `sizeof(Sprite[16])`, and the cast path `<SpriteArray>SPRITES[3].flags` expands to `SPRITES + offset(Sprite[16], [3].flags)`.

A `.typealias` does not add a wrapper field. With `SpriteArray .typealias Sprite[16]`, the correct cast path to element 3's `flags` field is `[3].flags`. A wrapper record with a `.field` declaration adds an extra path level:

```asm
SpriteArray .type
sprites     .field Sprite[16]
            .endtype
```

With that declaration, the same field requires `.sprites[3].flags` — the `.sprites` step is part of the type structure. `.typealias` introduces no such level.

Type aliases are assembler-time layout facts. They do not create constructors, runtime type checks or hidden operations.

---

## Cast syntax

Everything above — `sizeof`, `offset`, manual expressions — is always valid. Once you have declared types, there is a more compact syntax for building field-address expressions.

A layout cast tells AZM to treat an address as a particular layout while it calculates field offsets. It does not change runtime memory; it is compact notation for the same constant-expression arithmetic:

```asm
ld   hl,<Sprite>PLAYER.flags
ld   hl,<Sprite[16]>SPRITES[3].flags
```

The structure is `<TypeExpr>base[index].field`, where `<TypeExpr>` is the layout to apply, `base` is a label or address expression, each `[index]` is an array step and each `.field` is a field name step. These two lines produce the same assembled bytes:

```asm
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
ld   hl,<Sprite[16]>SPRITES[3].flags
```

Parentheses perform memory access; the cast path itself resolves to an address:

```asm
ld   a,(<Sprite[16]>SPRITES[3].flags)   ; load byte at that address
ld   hl,<Sprite[16]>SPRITES[3].flags    ; load the address itself into HL
```

Indices inside a cast path must be assembler-time constant expressions. Register values are rejected, because the address calculation happens at assemble time:

```asm
.equ  IDX, 3
ld   hl,<Sprite[16]>SPRITES[IDX].flags      ; valid: IDX is a constant
ld   hl,<Sprite[16]>SPRITES[HL].flags       ; error: HL is not a constant
```

When the index is in a register at runtime, write the address arithmetic as instructions. Dot notation reaches nested record fields by the same rules:

```asm
ld   hl,<Actor>PLAYER.pos.x
; Equivalent to:
ld   hl,PLAYER + offset(Actor, pos.x)
```

The `sizeof` and `offset` forms are always correct and always clear; use whichever makes the field path more readable at the call site.

---

## Unions and alternate views

A union describes multiple overlapping views of the same bytes. This is an advanced feature for hardware registers and other cases where the same address range has more than one valid interpretation.

All union members start at offset zero; the union's size is the size of its largest member. Some hardware ports expose the same bytes as both a status byte and a 16-bit value:

```asm
PortValue .union
status  .byte    ; byte-wide access
full    .word    ; word-wide access
        .endunion

IoPort  .type
ptr     .word
value   .field PortValue
        .endtype

PORT:   .ds IoPort
```

The cast syntax works with union types by the same rules as record types:

```asm
ld   a,(<IoPort>PORT.value.status)    ; read the status byte
ld   hl,<IoPort>PORT.value.full       ; read the full word
; Equivalent to:
ld   hl,PORT + offset(IoPort, value) + offset(PortValue, full)
```

---

[← Raw Data, Storage and Strings](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)
