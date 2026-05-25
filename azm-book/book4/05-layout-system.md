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

## Terminology

- **Scalar type**: a fixed-size built-in value. `byte` is 1 byte; `word` is 2 bytes; `addr` is 2 bytes.
- **Record type**: a `.type` layout with named fields.
- **Array type**: repeated elements such as `byte[32]` or `Sprite[16]`.
- **Composite type**: a record or array built from smaller layout types.

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
.type Sprite
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

## Scalar layout types

Three built-in scalar names evaluate to byte counts in layout positions:

| Name | Byte count |
|------|------------|
| `byte` | 1 |
| `word` | 2 |
| `addr` | 2 |

`addr` is semantically identical to `word` in size (2 bytes) but carries the intent of a pointer-sized field. These names are valid in size positions — inside `.type` / `.union` declarations and as `.ds` operands:

```asm
.ds byte       ; 1 byte
.ds word       ; 2 bytes
```

## `sizeof`

`sizeof(Type)` returns the exact packed byte count for a type:

```asm
sizeof(byte)         ; 1
sizeof(word)         ; 2
sizeof(Sprite)       ; sum of Sprite's field sizes
sizeof(byte[32])     ; 32
sizeof(Sprite[16])   ; sizeof(Sprite) * 16
```

The result is an ordinary integer constant, valid anywhere an expression is valid:

```asm
SPRITE_SIZE .equ sizeof(Sprite)
TOTAL_RAM   .equ MAX_SPRITES * sizeof(Sprite)
```

## Array type expressions

A type followed by a bracket count forms an array size expression:

```asm
byte[32]     ; 32 bytes
word[8]      ; 16 bytes
Sprite[16]   ; sizeof(Sprite) * 16 bytes
```

Array type expressions appear in `.ds` operands, `.field` declarations and `sizeof`/`offset` arguments.

`.ds` accepts a type expression wherever it needs a byte count:

```asm
.ds byte[32]    ; same as .ds 32
.ds Sprite[16]  ; same as .ds sizeof(Sprite) * 16
```

The type form documents intent while reserving an ordinary byte count.

---

## Records with `.type`

### Declaring a record

A `.type` block describes the fields of a record layout. Each field has a name, a size and an offset that the assembler computes by summing the fields before it.

```asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype
```

Field declarations inside `.type`:

| Declaration | Meaning |
|-------------|---------|
| `name .byte` | 1-byte field |
| `name .word` | 2-byte field |
| `name .addr` | 2-byte address-sized field |
| `name .field TypeExpr` | field of any layout size |

`.byte`, `.word` and `.addr` are shorthand for `.field byte`, `.field word` and `.field addr`.

### Fields with `.field`

`.field` takes any layout type expression as its size:

```asm
.type Buffer
data    .field byte[256]    ; 256 bytes
cursor  .word               ; 2 bytes
.endtype
```

```asm
.type Actor
pos     .field Sprite       ; nested record
state   .byte
timer   .word
.endtype
```

### `sizeof` and `offset`

After declaring a type, `sizeof` and `offset` give you the assembler-time constants:

```asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype

SPRITE_SIZE  .equ sizeof(Sprite)           ; 5
SPRITE_X     .equ offset(Sprite, x)        ; 0
SPRITE_Y     .equ offset(Sprite, y)        ; 1
SPRITE_FLAGS .equ offset(Sprite, flags)    ; 2
SPRITE_PTR   .equ offset(Sprite, ptr)      ; 3
```

These are ordinary integer constants. Use them in `.equ` lines when the name will appear in multiple places; use `sizeof` and `offset` directly in operands when the constant is used once.

### Nested record access with `offset`

When a record embeds another record as a field, `offset` can reach through both layers with a dotted path:

```asm
.type Actor
pos     .field Sprite
state   .byte
.endtype

ACTOR_POS_X  .equ offset(Actor, pos.x)     ; 0
ACTOR_POS_Y  .equ offset(Actor, pos.y)     ; 1
ACTOR_STATE  .equ offset(Actor, state)     ; sizeof(Sprite)
```

### Allocating one record

```asm
PLAYER:
        .ds Sprite        ; sizeof(Sprite) bytes, uninitialized
```

Access its fields through offset constants:

```asm
        ld   ix,PLAYER
        ld   a,(ix + SPRITE_X)
        inc  a
        ld   (ix + SPRITE_X),a
```

### Allocating arrays of records

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

### `sizeof` on arrays

`sizeof` accepts any type expression including array forms:

```asm
sizeof(byte[32])       ; 32
sizeof(Sprite[16])     ; sizeof(Sprite) * 16
```

### `offset` with array index paths

`offset` accepts an array index step inside the path:

```asm
offset(Sprite[16], [2].flags)
```

This returns the byte offset of the `flags` field of element 2. Expanded: `2 * sizeof(Sprite) + offset(Sprite, flags)`.

A concrete use:

```asm
ELEM2_FLAGS .equ offset(Sprite[16], [2].flags)

        ld   hl,SPRITES + ELEM2_FLAGS
        ld   a,(hl)
```

The index inside an `offset` array path must be a numeric literal.

---

## Compact layout access syntax

Everything described so far — `sizeof`, `offset`, manual expressions — is always valid. Once you have declared types, there is a more compact syntax for building field-address expressions.

### Layout-cast syntax

A layout cast tells the assembler to interpret the base address through a layout while it computes an address:

```asm
ld   hl,<Sprite>PLAYER.flags
ld   hl,<Sprite[16]>SPRITES[3].flags
```

The structure is:

```
<TypeExpr>base[index].field
```

- `<TypeExpr>` — the type to apply: `Sprite`, `Sprite[16]`, `Actor`, etc.
- `base` — a label or address expression
- `[index]` — zero or more array index steps (assembler-time constants only)
- `.field` — zero or more field name steps

Start with a single record before using arrays. The cast for a single record:

```asm
PLAYER:
        .ds Sprite

        ld   a,(<Sprite>PLAYER.flags)
```

is equivalent to:

```asm
        ld   a,(PLAYER + offset(Sprite, flags))
```

The cast is compact notation for that address calculation, not a different operation.

### Equivalence

These two lines produce the same assembled bytes:

```asm
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
ld   hl,<Sprite[16]>SPRITES[3].flags
```

The cast is syntax over the same constant-expression machinery. The `sizeof` and `offset` forms are always correct and always clear; use whichever makes the field path more readable at the call site.

### Memory dereference stays explicit

Parentheses perform memory access:

```asm
ld   a,(<Sprite[16]>SPRITES[3].flags)   ; load byte at that address
ld   hl,<Sprite[16]>SPRITES[3].flags    ; load the address itself into HL
```

### Assembler-time indices only

Indices inside a layout-cast path must be assembler-time constant expressions. Register values are rejected:

```asm
.equ  IDX, 3
ld   hl,<Sprite[16]>SPRITES[IDX].flags      ; valid: IDX is a constant
ld   hl,<Sprite[16]>SPRITES[3].flags        ; valid: 3 is a constant
ld   hl,<Sprite[16]>SPRITES[HL].flags       ; error: HL is not a constant
```

If the index lives in a register at runtime, write the arithmetic yourself.

### Dot notation for nested fields

```asm
.type Pos
x   .byte
y   .byte
.endtype

.type Actor
pos     .field Pos
state   .byte
.endtype

ld   hl,<Actor>PLAYER.pos.x
; Equivalent to:
ld   hl,PLAYER + offset(Actor, pos.x)
```

---

## Unions and alternate views

A union describes multiple overlapping views of the same bytes. All fields in a union start at offset zero. The union's total size is the size of its largest member.

```asm
.union Counter16
count   .word    ; 16-bit view
lo      .byte    ; low byte only
.endunion
```

`sizeof(Counter16)` is 2. Both `count` and `lo` start at offset 0; they differ in field size, not position.

### Declaring a union

Members use the same field declarations as `.type`: `.byte`, `.word`, `.addr`, `.field`:

```asm
.union TimerReg
lo      .byte     ; low byte view
count   .word     ; full 16-bit count
.endunion

TIMER:
        .ds TimerReg

        ld   hl,(TIMER + offset(TimerReg, count))  ; read full count
        ld   a,(TIMER + offset(TimerReg, lo))      ; read low byte only
```

### Union inside a record

A named union can appear as a `.field` inside a `.type` block:

```asm
.union ByteOrWord
byte_view   .byte
word_view   .word
.endunion

.type IoPort
addr    .addr
value   .field ByteOrWord
.endtype
```

The cast syntax works with union types by the same rules as record types:

```asm
PORT:   .ds IoPort

ld   hl,<IoPort>PORT.value.word_view
; Equivalent to:
ld   hl,PORT + offset(IoPort, value) + offset(ByteOrWord, word_view)
```

---

[← Raw Data, Storage and Strings](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)
