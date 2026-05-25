---
layout: default
title: "Chapter 5 — The Layout System"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 5
---
[← Data, Storage and Includes](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)

# Chapter 5 — The Layout System

If you have stored structured data in Z80 programs — sprite tables, packet headers, hardware register maps — you have written offset arithmetic: `.equ` constants for each field position, manual multiplication to reach a specific element in a table. That approach works until the layout changes. Insert a field and every constant after the insertion is wrong, along with every access expression built on it.

AZM's layout system replaces those constants with a declaration. You describe the shape of a record once in a `.type` block; `sizeof` and `offset` give you byte counts and field positions anywhere you need them, derived automatically from the field list. Work through this chapter in order the first time — the sections build on each other.

---

## Layout types: the core idea

You are storing 16 sprites. Each sprite has an x position, a y position, a tile index and a flags byte — four bytes per sprite. The standard Z80 approach is a set of `.equ` constants for the field offsets, a `.ds` to reserve the table and arithmetic wherever you need to reach a specific field:

```asm
; A sprite occupies 4 bytes in this order:
; offset 0: x position (1 byte)
; offset 1: y position (1 byte)
; offset 2: tile index (1 byte)
; offset 3: flags     (1 byte)

SPRITE_X     .equ 0
SPRITE_Y     .equ 1
SPRITE_TILE  .equ 2
SPRITE_FLAGS .equ 3
SPRITE_SIZE  .equ 4

SPRITES:
    .ds 16 * SPRITE_SIZE  ; 16 sprites

; To access sprite 3's flags:
;   ld hl, SPRITES + 3 * SPRITE_SIZE + SPRITE_FLAGS
```

For one sprite this is fine. For a table of 16, you compute `SPRITES + N * SPRITE_SIZE + SPRITE_FLAGS` by hand everywhere you need that field. Insert a field between `SPRITE_TILE` and `SPRITE_FLAGS` — say, an animation counter — and `SPRITE_FLAGS` and `SPRITE_SIZE` are both wrong. Every constant after the insertion needs a new value, and every access expression in the source that uses those constants needs checking. With complex layouts — records inside other records, multiple tables — the maintenance problem grows.

AZM's layout system replaces the manual constants with a type declaration. Describe the record once:

```asm
.type Sprite
x       .byte
y       .byte
tile    .byte
flags   .byte
.endtype

SPRITES:
    .ds Sprite[16]   ; 16 sprites, sizeof(Sprite) bytes each

SPRITE_COUNT .equ 16
```

`sizeof(Sprite)` evaluates to 4 — the sum of the four `.byte` fields. `offset(Sprite, flags)` evaluates to 3. Insert a new field between `tile` and `flags`, and both values update automatically; every expression that reads from them adjusts without any changes to the access code. If you mistype a field name — `offset(Sprite, flagz)` — the assembler rejects it at assemble time. With manual constants, the same typo assembles silently with the wrong value.

With the declaration in place, accessing sprite 3's flags field explicitly looks like this:

```asm
ld hl, SPRITES
ld de, 3 * sizeof(Sprite) + offset(Sprite, flags)
add hl, de
ld a, (hl)   ; A = sprite 3's flags
```

`sizeof(Sprite)` and `offset(Sprite, flags)` are compile-time constants. The assembler evaluates them before writing the binary, and the Z80 receives only the computed numbers. The arithmetic is the same as what you would write by hand; the values come from the declaration rather than from manually maintained `.equ` lines.

For access patterns where the index is a compile-time constant, AZM provides a cast syntax that writes the same calculation inline:

```asm
ld hl, <Sprite[16]>SPRITES[3].flags
```

`<Sprite[16]>` names the type, `[3]` steps to element 3 and `.flags` names the field. The assembler computes `SPRITES + 3 * sizeof(Sprite) + offset(Sprite, flags)` and emits a plain number. Both lines assemble to the same bytes:

```asm
ld hl, SPRITES + 3 * sizeof(Sprite) + offset(Sprite, flags)
ld hl, <Sprite[16]>SPRITES[3].flags
```

The cast is compact notation for an address calculation.

### Scalar layout types

Three built-in scalar names evaluate to byte counts in layout positions:

| Name | Byte count |
|------|------------|
| `byte` | 1 |
| `word` | 2 |
| `addr` | 2 |

`addr` is semantically identical to `word` in size (2 bytes) but carries the intent of a pointer-sized field.

These names are valid in size positions — inside `.type` / `.union` declarations and inside `.ds`:

```asm
.ds byte       ; 1 byte
.ds word       ; 2 bytes
.ds addr       ; 2 bytes
```

They compute sizes for storage and offset expressions.

### `sizeof`

`sizeof(Type)` returns the exact packed byte count for a type:

```asm
sizeof(byte)         ; 1
sizeof(word)         ; 2
sizeof(addr)         ; 2
sizeof(Sprite)       ; sum of Sprite's field sizes
sizeof(byte[32])     ; 32
sizeof(Sprite[16])   ; sizeof(Sprite) * 16
```

The result is an ordinary integer constant, valid anywhere an expression is valid:

```asm
SPRITE_SIZE .equ sizeof(Sprite)
TOTAL_RAM   .equ MAX_SPRITES * sizeof(Sprite) + sizeof(GameState)
```

### Array type expressions

A type followed by a bracket count forms an array size expression:

```asm
byte[32]     ; 32 bytes
word[8]      ; 16 bytes
Sprite[16]   ; sizeof(Sprite) * 16 bytes
```

The bracket form is a size expression. `Sprite[16]` computes the number of bytes needed to store sixteen Sprite records.

Array type expressions appear in:
- `.ds` operands
- `.field` declarations inside `.type` / `.union`
- `sizeof(...)` arguments
- `offset(...)` array index paths

### Type expressions as size operands in `.ds`

`.ds` accepts a type expression wherever it needs a byte count:

```asm
.ds byte[32]    ; same as .ds 32
.ds Sprite[16]  ; same as .ds sizeof(Sprite) * 16
```

The equivalence is exact. The type form documents intent while still reserving an ordinary byte count.

### Compile-time only

Layout types produce assemble-time numbers. The label `SPRITES` after `.ds Sprite[16]` is an ordinary address. Layout constants give you the numbers; you write the instructions.

When you use `.ds Sprite[16]`, you are saying: reserve this many bytes and use this type name so that `sizeof` and `offset` can work with it. Memory access still happens through the Z80 instructions you write.

---

## Records with `.type`

### Declaring a record

A `.type` block is where you describe a record layout. Think of it as a table of contents for a fixed-size region of memory: each field has a name, a size and an offset that the assembler computes by summing the fields before it. Once the block is declared, `sizeof` and `offset` give you those numbers anywhere you need them.

A `.type` block describes the fields of a record layout:

```asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype
```

Field declarations inside `.type` use `.byte`, `.word`, `.addr` or `.field`:

| Declaration | Meaning |
|-------------|---------|
| `name .byte` | 1-byte field |
| `name .word` | 2-byte field |
| `name .addr` | 2-byte address-sized field |
| `name .field TypeExpr` | field of any layout size |

`.byte`, `.word` and `.addr` are shorthand for `.field byte`, `.field word` and `.field addr`. They do not emit bytes; they describe the layout.

All four field forms reserve the same kind of space. The difference is size: `.byte` is one byte, `.word` and `.addr` are each two bytes and `.field` takes whatever size expression you give it. AZM uses the packed layout exactly as declared.

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
pos     .field Sprite       ; nested record (sizeof(Sprite) bytes)
state   .byte
timer   .word
.endtype
```

The total size of a record is the sum of its field sizes. AZM uses exact packed layout.

### `sizeof` and `offset`

After declaring a type, `sizeof` and `offset` give you the compile-time constants:

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

These are ordinary integer constants. Put them in `.equ` lines when the name will appear in multiple places; use `sizeof` and `offset` directly in operands when the constant is used once.

The `.equ` approach becomes especially valuable during refactoring. You have one canonical offset definition, derived from the layout declaration and the rest of the code uses that name. When you add a field to the record, `SPRITE_FLAGS` and `SPRITE_PTR` update automatically — every instruction that uses them picks up the new offset without any edits.

### Nested record access with `offset`

When a record embeds another record as a field, `offset` can reach through both layers with a dotted path. The assembler computes the arithmetic at assemble time: take the offset of the outer field, then add the offset of the inner field within its type.

For a record that contains another record as a field:

```asm
.type Actor
pos     .field Sprite
state   .byte
.endtype

ACTOR_POS_X  .equ offset(Actor, pos.x)     ; 0
ACTOR_POS_Y  .equ offset(Actor, pos.y)     ; 1
ACTOR_STATE  .equ offset(Actor, state)     ; sizeof(Sprite) = 5
```

Field paths in `offset` step through nested types: `pos.x` means the `x` field of the `pos` field.

### Allocating one record

Use `.ds Type` to reserve the exact byte count for one record:

```asm
PLAYER:
        .ds Sprite        ; sizeof(Sprite) bytes, uninitialized
```

Access its fields through offset constants:

```asm
        ld   ix,PLAYER
        ld   a,(ix + SPRITE_X)     ; read x field
        inc  a
        ld   (ix + SPRITE_X),a    ; write x field
```

### Allocating arrays of records

```asm
SPRITE_TABLE:
        .ds Sprite[16]    ; sizeof(Sprite) * 16 bytes
```

Accessing element `n` at compile time — when `n` is a constant:

```asm
N       .equ 3
        ld   hl,SPRITE_TABLE + N * sizeof(Sprite) + SPRITE_FLAGS
        ld   a,(hl)
```

Or using layout-cast syntax (see Compact layout access syntax later in this chapter):

```asm
        ld   hl,<Sprite[16]>SPRITE_TABLE[3].flags
```

Both assemble to the same constant address.

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
        add  hl,bc            ; HL = SPRITE_TABLE + A * 5 (sizeof Sprite)
```

The layout declaration supplies `sizeof(Sprite)`; the instruction sequence is still yours.

### Initialized records

An initialized record is written as `.db` / `.dw` in field order:

```asm
INIT_SPRITE:
        .db 10          ; x
        .db 20          ; y
        .db %00000001   ; flags
        .dw 0           ; ptr
```

The `.type` declaration provides the field sizes and offsets for reference and verification.

### Naming small records

`.type` is a block directive — it opens with `.type Name` and closes with `.endtype`. For a two-byte named record, write a block:

```asm
.type Pair
lo  .byte
hi  .byte
.endtype
```

For a two-byte storage slot, write the type expression directly in `.ds`:

```asm
SCRATCH:
        .ds byte[2]
```

Array types in `.field` declarations work with built-in scalar names and any declared record:

```asm
.type Packet
header  .field byte[4]   ; 4-byte header field
data    .field byte[64]  ; 64-byte data field
.endtype
```

### `sizeof` on arrays, and `offset` with array index paths

When you have an array of records and need the total byte count — to pass as a block size, or to allocate storage — `sizeof` works with array expressions directly.

`sizeof` accepts any type expression, including array forms:

```asm
sizeof(byte[32])       ; 32
sizeof(word[8])        ; 16
sizeof(Sprite[16])     ; sizeof(Sprite) * 16
```

These are ordinary constant expressions. Use them wherever an integer is valid.

`offset` accepts an array index step inside the path:

```asm
offset(Sprite[16], [2].flags)
```

This returns the byte offset of the `flags` field of element 2 of a 16-element Sprite array. Expanded:

```asm
2 * sizeof(Sprite) + offset(Sprite, flags)
```

A concrete use: derive a constant for accessing a specific array element from the base address:

```asm
ELEM2_FLAGS .equ offset(Sprite[16], [2].flags)

        ld   hl,SPRITES + ELEM2_FLAGS
        ld   a,(hl)                    ; read flags of sprite 2
```

The index inside an `offset` array path must be a numeric literal — a bare integer like `[2]`. Layout-cast paths (`<Sprite[16]>TABLE[IDX].flags`) accept compile-time constant expressions in their brackets. Runtime index values use explicit address arithmetic.

These `offset` array paths are most useful for writing initialization tables or verification constants: you want the offset of a specific element's field as a compile-time constant. For runtime element access, write the address arithmetic yourself.

---

## Wrapper records for array layouts

`Sprite[16]` is a valid TypeExpr wherever a size or type expression is accepted — `.ds`, `sizeof`, `offset` and layout casts all take it:

```asm
.type Sprite
x       .byte
y       .byte
tile    .byte
flags   .byte
.endtype

SPRITES:
        .ds Sprite[16]

SIZE            .equ sizeof(Sprite[16])
SPRITE3_FLAGS   .equ offset(Sprite[16], [3].flags)

        ld hl, <Sprite[16]>SPRITES[3].flags
```

`sizeof(Sprite[16])` gives the total byte count; `offset(Sprite[16], [3].flags)` gives the byte offset of `flags` in element 3.

In a large codebase, you might want a single name for `Sprite[16]` so that `sizeof(SpriteArray)` appears throughout the source instead of the literal `sizeof(Sprite[16])`. The workaround is a wrapper record:

```asm
.type SpriteArray
sprites .field Sprite[16]
.endtype
```

`sizeof(SpriteArray)` gives the same value as `sizeof(Sprite[16])`. Access goes through the wrapper field:

```asm
offset(SpriteArray, sprites[3].flags)
```

rather than:

```asm
offset(Sprite[16], [3].flags)
```

The wrapper adds one named field level — `sprites` — between the type name and the array index. That is the tradeoff: a reusable name at the cost of an extra path step in every access expression.

---

## Unions and alternate views

Z80 code often reads the same memory location through different-sized accesses. A timer counter might be read as a 16-bit word in some routines and as a low byte in others. A packet buffer might be interpreted as raw bytes at one level and as a structured header at another. Unions give both access patterns named fields and make the relationship between them explicit in the source.

A union describes multiple overlapping views of the same bytes. All fields in a union start at offset zero. The union's total size is the size of its largest member. No bytes are shared in the sense of interleaving — every member covers the full span from zero to its own size.

```asm
.union RegPair
lo      .byte
both    .word
.endunion
```

This union has two members. `lo` is a 1-byte view at offset 0; `both` is a 2-byte view at offset 0. `sizeof(RegPair)` is 2.

### Declaring a union

```asm
.union PacketHeader
raw     .field byte[4]   ; 4 bytes: raw access
.endunion
```

Or with multiple named views:

```asm
.union Coord16
byte_view   .byte
word_view   .word
.endunion
```

Members use the same field declarations as `.type`: `.byte`, `.word`, `.addr`, `.field`.

### Size rule

`sizeof(union)` = size of the largest member.

```asm
.union Status
flags   .byte           ; 1 byte
word_view .word         ; 2 bytes
.endunion

; sizeof(Status) = 2
```

Because all members start at offset 0, a 1-byte member in a 2-byte union refers only to the low byte of that storage. The size rule is what makes the storage reservation correct: `.ds Status` reserves two bytes, and both the byte view and the word view fit within those two bytes.

### Hardware register overlays

Hardware peripherals often expose the same register at both byte and word widths. A timer's low byte may be accessible for quick checks, while the full 16-bit count is read as a word for precision timing. A union gives both views named fields and makes the intent explicit. A common use: a hardware peripheral register that can be accessed as a byte or a word depending on the operation:

```asm
.union TimerReg
lo      .byte     ; low byte view
count   .word     ; full 16-bit count
.endunion

TIMER:
        .ds TimerReg

; Load full 16-bit timer value:
        ld   hl,(TIMER + offset(TimerReg, count))

; Read only the low byte:
        ld   a,(TIMER + offset(TimerReg, lo))

; The high byte is at TIMER + 1.
```

### When a union is clearer than comments

A union makes the alternate-view intent explicit and machine-checkable. The alternative is bare byte arithmetic with comments:

```asm
; Without union: fragile, depends on correct comments
TIMER_LO  .equ TIMER + 0
TIMER_HI  .equ TIMER + 1
TIMER_CNT .equ TIMER + 0    ; same address as LO, 16-bit access
```

With a union, `sizeof` and `offset` stay correct regardless of future edits to the layout.

The `.equ` alternative — bare address constants that duplicate each other's values — works until someone adds a field or moves the region. A union declaration captures the relationship in one place; the constants derive from it automatically.

### Word/byte view idiom

The most common use of unions in Z80 code is accessing a 2-byte region either as a full 16-bit word or as the low byte alone:

```asm
.union Counter16
count   .word    ; 16-bit view
lo      .byte    ; low byte only
.endunion
```

```asm
TIMER:
        .ds Counter16

; Increment the 16-bit counter:
        ld   hl,(TIMER + offset(Counter16, count))
        inc  hl
        ld   (TIMER + offset(Counter16, count)),hl

; Read only the low byte:
        ld   a,(TIMER + offset(Counter16, lo))
```

Both fields have offset 0. The distinction is field size, not position. To access the high byte independently, add 1 explicitly:

```asm
        ld   a,(TIMER + 1)      ; high byte of the counter
```

### Packet format overlays

Unions model protocol headers where the same bytes have different interpretations depending on context:

```asm
.union Packet2
word_view   .word    ; 16-bit view
lo_byte     .byte    ; low byte (first byte at the address)
.endunion

PACKET:
        .ds Packet2

; Write both bytes by loading a 16-bit value:
        ld   hl,$0A21
        ld   (PACKET + offset(Packet2, word_view)),hl

; Read the first byte (command byte) alone:
        ld   a,(PACKET + offset(Packet2, lo_byte))
```

The union communicates intent: this memory region supports both views. Without the union, the two access patterns look unrelated in code.

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

Access the nested union field through the outer record's `offset`:

```asm
PORT_VALUE_WORD  .equ offset(IoPort, value) + offset(ByteOrWord, word_view)
PORT_VALUE_BYTE  .equ offset(IoPort, value) + offset(ByteOrWord, byte_view)
```

Both constants resolve to the same byte offset from the start of `IoPort` — because `ByteOrWord` starts at `offset(IoPort, value)` and all of its own members start at zero within it.

Use named union types as `.field` entries as shown above. This keeps nested views explicit and gives every overlaid region a reusable type name.

---

## Compact layout access syntax

Everything described so far — `sizeof`, `offset`, manual expressions — is always valid and always explicit. Once you have declared types, there is a more compact syntax for building field-address expressions. It writes the layout on the left of the address expression, and resolves to the same arithmetic that `sizeof` and `offset` would produce.

The `sizeof` and `offset` forms above are always correct. Layout casts are shorter notation for the same constants.

### The long form

For any record field address, the explicit form is:

```asm
ld   hl,SPRITES + offset(Sprite, flags)
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
```

These are ordinary expressions, evaluated by the assembler before the binary is written.

### Layout-cast syntax

A layout cast tells the assembler to interpret the base address through a layout while it computes an address. The long form is always correct; the cast is notation you can use when the field path is the interesting part and the arithmetic is noise.

```asm
ld   hl,<Sprite>SPRITES.flags
ld   hl,<Sprite[16]>SPRITES[3].flags
```

The structure is:

```
<TypeExpr>base[index].field
```

- `<TypeExpr>` — the type to apply: `Sprite`, `Sprite[16]`, `Actor`, etc.
- `base` — a label or address expression
- `[index]` — zero or more array index steps (compile-time constants only)
- `.field` — zero or more field name steps

The assembler computes the same constant as the long form and emits it as an ordinary operand.

### Equivalence

These two lines must produce the same assembled bytes:

```asm
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
ld   hl,<Sprite[16]>SPRITES[3].flags
```

The cast is syntax over the same constant-expression machinery.

### Memory dereference stays explicit

Parentheses perform memory access:

```asm
ld   a,(<Sprite[16]>SPRITES[3].flags)   ; load byte at that address
ld   hl,<Sprite[16]>SPRITES[3].flags    ; load the address itself into HL
```

The outer parentheses are Z80 memory-dereference syntax. The assembler evaluates the cast to a plain address — `ld a,(SPRITES + 15)` is what ends up in the binary.

### Compile-time indices only

Indices inside a layout-cast path must be compile-time constant expressions. Register values are rejected:

```asm
.equ  IDX, 3
ld   hl,<Sprite[16]>SPRITES[IDX].flags      ; valid: IDX is a constant
ld   hl,<Sprite[16]>SPRITES[3].flags        ; valid: 3 is a constant
ld   hl,<Sprite[16]>SPRITES[HL].flags       ; error: HL is not a constant
```

If the index lives in a register at runtime, write the arithmetic yourself.

### Dot notation for nested fields

Field paths can be several names deep:

```asm
.type Pos
x   .byte
y   .byte
.endtype

.type Actor
pos     .field Pos
state   .byte
.endtype

; Accessing Actor.pos.x:
ld   hl,<Actor>PLAYER.pos.x
; Equivalent to:
ld   hl,PLAYER + offset(Actor, pos.x)
```

### When to use layout casts vs explicit arithmetic

The boundary is clear: if the index is known at assemble time, either form works and the cast is shorter. If the index lives in a register at runtime, you write the arithmetic yourself.

Use layout casts for constant-index access: initialization, debug checks, tables where the index is always a named constant.

Use explicit arithmetic when the index is in a register:

```asm
; Runtime index in A: compute SPRITES + A * sizeof(Sprite) + SPRITE_FLAGS
        ld   hl,SPRITES
        ld   b,0
        ld   c,a
        add  hl,bc
        add  hl,bc
        add  hl,bc
        add  hl,bc
        add  hl,bc
        ld   de,SPRITE_FLAGS
        add  hl,de           ; HL = address of flags field for sprite A
```

Layout casts are compile-time address expressions. When you need a runtime index, write the arithmetic yourself.

### Union casts

The same cast syntax works with union types:

```asm
.union Counter16
count   .word
lo      .byte
.endunion

TIMER:
        .ds Counter16

; Access the word view:
ld   hl,<Counter16>TIMER.count      ; assembler computes: TIMER + offset(Counter16, count)

; Access the low byte:
ld   a,(<Counter16>TIMER.lo)        ; assembler computes: (TIMER + offset(Counter16, lo))
```

Both fields have offset 0, so both casts resolve to the same address as the bare label. The cast records which view the code is using.

When a union is nested inside a record, the path steps through both:

```asm
.union ByteOrWord
byte_view   .byte
word_view   .word
.endunion

.type IoPort
addr    .addr
value   .field ByteOrWord
.endtype

PORT:   .ds IoPort

; Access the word_view field inside the value union:
ld   hl,<IoPort>PORT.value.word_view
; Equivalent to:
ld   hl,PORT + offset(IoPort, value) + offset(ByteOrWord, word_view)
```

### `offset` with array index paths

`offset` accepts an array index step inside the path, giving the byte offset of a specific element's field from the array base:

```asm
offset(Sprite[16], [2].flags)
```

Expands to `2 * sizeof(Sprite) + offset(Sprite, flags)`. You can use this in `.equ` lines when the element index is a known constant:

```asm
SPRITE2_FLAGS .equ offset(Sprite[16], [2].flags)

        ld   hl,SPRITE_TABLE + SPRITE2_FLAGS
        ld   a,(hl)
```

Both forms reach the same constant as the layout cast `<Sprite[16]>SPRITE_TABLE[2].flags`.

The index inside the `offset` path must be a numeric literal. Layout-cast paths accept compile-time constant expressions in brackets; `offset()` paths accept only numeric literals. Runtime registers are rejected in both cases.

---

[← Data, Storage and Includes](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)
