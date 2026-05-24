---
layout: default
title: "Chapter 5 — The Layout System"
parent: "AZM Assembler Manual"
grand_parent: "AZM Books"
nav_order: 5
---
[← Data, Storage, and Includes](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)

# Chapter 5 — The Layout System

AZM's layout system describes memory structures at assemble time: how many bytes a record takes, where each field sits, how unions overlay the same region with multiple interpretations. This chapter covers the full system — scalar type names, `sizeof` and `offset`, record declarations with `.type`, union declarations with `.union`, and the compact cast syntax for accessing fields by name.

---

## Layout types: the core idea

AZM layout types are compile-time memory contracts. They describe how many bytes a data structure occupies and where its fields sit. They do not create runtime objects, attach type information to labels, or generate any machine code. Every instruction that touches a record still comes from you.

### The problem they solve

Assembly programs that handle structured data — sprite tables, hardware register blocks, packet formats, queue state — need byte counts and field offsets. Hand-coded numbers work, but they break silently when a field is added or reordered. AZM layout types keep those numbers correct automatically.

Without layout types, you might write:

```asm
; Sprite record (manual, fragile):
; offset 0: x (byte)
; offset 1: y (byte)
; offset 2: flags (byte)
; offset 3..4: ptr (word)
SPRITE_SIZE .equ 5
SPRITE_X    .equ 0
SPRITE_Y    .equ 1
SPRITE_FLAGS .equ 2
SPRITE_PTR  .equ 3
```

Adding a field before `flags` breaks every use of `SPRITE_FLAGS` and `SPRITE_PTR`.

With layout types:

```asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype
```

`sizeof(Sprite)` and `offset(Sprite, flags)` update automatically.

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

They are **not** data emission directives. Outside a layout declaration, `.byte`, `.word`, and `.addr` as field shorthands inside `.type` are the only valid context — they do not emit bytes on their own in code.

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

This is a size-calculation rule, not a data declaration. `Sprite[16]` does not create sixteen named Sprite variables. It computes the number of bytes needed to store sixteen Sprite records.

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

The equivalence is exact. The type form documents intent; the numeric form would require a comment to explain what the number means.

### What layout types do not do

Layout types are not a runtime type system. They:
- Do not attach type information to labels permanently
- Do not cause AZM to infer typed memory access from instruction operands
- Do not generate hidden indexing or load/store code
- Do not create a separate initialization syntax

The label `SPRITES` after `.ds Sprite[16]` is an ordinary address. Code that accesses fields of those sprites writes explicit Z80 arithmetic to compute the address. Layout constants give you the numbers; you write the instructions.

### Why layout constants belong in source

Hard-coded offsets produce correct code until the layout changes. Add a field before `flags` in the Sprite record and every bare `2` used as the flags offset now addresses the wrong byte. The assembler accepts the number without complaint.

Symbolic names fix this. When `flags` is an `offset` query, adding a field causes the assembler to recompute every offset from the declaration automatically. The call sites need no edits.

A second benefit: the assembler can verify you. `offset(Sprite, flagz)` errors on the misspelling. `sizeof(Sprite) * 16` in a `.ds` uses the same declaration as all the offset queries, so the storage allocation stays consistent with the access constants automatically.

---

## Records with `.type`

### Declaring a record

A `.type` block describes the fields of a record layout:

```asm
.type Sprite
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype
```

Field declarations inside `.type` use `.byte`, `.word`, `.addr`, or `.field`:

| Declaration | Meaning |
|-------------|---------|
| `name .byte` | 1-byte field |
| `name .word` | 2-byte field |
| `name .addr` | 2-byte address-sized field |
| `name .field TypeExpr` | field of any layout size |

`.byte`, `.word`, and `.addr` are shorthand for `.field byte`, `.field word`, and `.field addr`. They do not emit bytes; they describe the layout.

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

The total size of a record is the sum of its field sizes. No padding or alignment is inserted — AZM uses exact packed layout.

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

### Nested record access with `offset`

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

`PLAYER` is an ordinary address. No type information attaches to it. Access its fields through offset constants:

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

For runtime indexing — when `n` is in a register at runtime — you write the arithmetic yourself:

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

AZM does not generate this multiplication. You write it.

### Initialized records

AZM has no record constructor syntax. An initialized record is written as `.db` / `.dw` in field order:

```asm
INIT_SPRITE:
        .db 10          ; x
        .db 20          ; y
        .db %00000001   ; flags
        .dw 0           ; ptr
```

The `.type` declaration provides the field sizes and offsets for reference and verification; it does not change how initialized data is written.

### Single-line type aliases are not supported

`.type` is a block directive — it opens with `.type Name` and closes with `.endtype`. There is no single-line form:

```asm
.type Pair byte[2]    ; not valid AZM syntax
```

AZM does not support typedef-style renaming of existing types. If you need a two-byte named record, write a block:

```asm
.type Pair
lo  .byte
hi  .byte
.endtype
```

For storage contexts where you want a descriptive name for a two-byte quantity, write the type expression directly in `.ds`:

```asm
SCRATCH:
        .ds byte[2]    ; readable form of .ds 2
```

Array types in `.field` declarations work with built-in scalar names and any declared record:

```asm
.type Packet
header  .field byte[4]   ; 4-byte header field
data    .field byte[64]  ; 64-byte data field
.endtype
```

### `sizeof` on arrays, and `offset` with array index paths

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

The index inside an `offset` array path must be a numeric literal — a bare integer like `[2]`, not a symbol or expression. Layout-cast paths (`<Sprite[16]>TABLE[IDX].flags`) accept compile-time constant expressions in their brackets, but `offset()` paths do not. A register value or a symbol produces an error in both cases.

---

## Unions and alternate views

### What a union is

A union describes multiple overlapping views of the same bytes. All fields in a union start at offset zero. The union's total size is the size of its largest member. No bytes are shared in the sense of interleaving — every member covers the full span from zero to its own size.

```asm
.union RegPair
lo      .byte
both    .word
.endunion
```

This union has two members. `lo` is at offset 0 (1 byte) and `both` is at offset 0 (2 bytes). `sizeof(RegPair)` is 2 — the largest member.

All union members start at offset 0. `lo` gives a 1-byte view of the first byte; `both` gives a 2-byte word view of the same region. To read the high byte independently, use `+1` arithmetic — a union cannot name it, because every member starts at zero.

### Declaring a union

```asm
.union PacketHeader
raw     .field byte[4]   ; 4 bytes: raw access
.endunion
```

Or with multiple named views:

```asm
.union Coord16
lo      .byte
hi      .byte
full    .word
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

Because all members start at offset 0, a 1-byte member accessed through a union that is 2 bytes wide refers only to the low byte of the 2-byte storage.

### Hardware register overlays

A common use: a hardware peripheral register that can be accessed as a byte or a word depending on the operation:

```asm
.union TimerReg
lo      .byte     ; timer low byte
hi      .byte     ; timer high byte
count   .word     ; full 16-bit count
.endunion

TIMER:
        .ds TimerReg

; Load full 16-bit timer value:
        ld   hl,(TIMER + offset(TimerReg, count))

; Read only the low byte:
        ld   a,(TIMER + offset(TimerReg, lo))
```

### No runtime tag or safety check

AZM does not generate any tag byte or discriminant. Reading a union member that was written through a different member is legal assembly — the assembler does not object. Whether that read makes sense is up to you.

### When a union is clearer than comments

A union makes the alternate-view intent explicit and machine-checkable. The alternative is bare byte arithmetic with comments:

```asm
; Without union: fragile, depends on correct comments
TIMER_LO  .equ TIMER + 0
TIMER_HI  .equ TIMER + 1
TIMER_CNT .equ TIMER + 0    ; same address as LO, 16-bit access
```

With a union, `sizeof` and `offset` stay correct regardless of future edits to the layout.

### Word/byte view idiom

The most common use of unions in Z80 code is accessing a 2-byte region either as a full 16-bit word or as the low byte alone:

```asm
.union Counter16
count   .word    ; 16-bit view
lo      .byte    ; low byte only
.endunion
```

Both `count` and `lo` start at offset 0. `count` gives a 2-byte word access; `lo` gives a 1-byte access to the low byte at the same address. `sizeof(Counter16)` is 2 (the size of the largest member).

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

Because all union fields start at offset 0, both `offset(Counter16, count)` and `offset(Counter16, lo)` return 0. The distinction is in field size — word vs. byte — not in position.

To access the high byte independently, add 1 explicitly:

```asm
        ld   a,(TIMER + 1)      ; high byte of the counter
```

A union cannot give the high byte a named offset, because all members start at zero. Use explicit `+1` arithmetic for the high byte.

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

The exact syntax for embedded anonymous inline unions inside a `.type` is not yet stable. Use named union types as `.field` entries as shown above. Verify against current AZM source if your project needs deeply nested anonymous unions.

---

## Compact layout access syntax

The `sizeof` and `offset` forms from the Records and Unions sections above are always correct. This section introduces shorter notation for the same constants, and explains where it applies and where it does not.

### The long form

For any record field address, the explicit form is:

```asm
ld   hl,SPRITES + offset(Sprite, flags)
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
```

These are ordinary expressions. They fold to constants at assemble time.

### Layout-cast syntax

A layout cast writes the same constant more compactly:

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

The assembler computes the same constant as the long form and emits it as an ordinary fixup operand. No extra instructions are generated.

### Equivalence guarantee

These two lines must produce the same assembled bytes:

```asm
ld   hl,SPRITES + (3 * sizeof(Sprite)) + offset(Sprite, flags)
ld   hl,<Sprite[16]>SPRITES[3].flags
```

If they do not, that is an assembler bug. The cast is syntactic sugar over the same constant-expression machinery.

### Memory dereference stays explicit

The cast does not imply memory access. Parentheses are still required for load/store:

```asm
ld   a,(<Sprite[16]>SPRITES[3].flags)   ; load byte at that address
ld   hl,<Sprite[16]>SPRITES[3].flags    ; load the address itself into HL
```

The outer parentheses are Z80 memory-dereference syntax, not part of the cast. After folding, `ld a,(SPRITES + 15)` is what the assembler emits.

### Compile-time indices only

Indices inside a layout-cast path must be compile-time constant expressions. Register values are rejected:

```asm
.equ  IDX, 3
ld   hl,<Sprite[16]>SPRITES[IDX].flags      ; valid: IDX is a constant
ld   hl,<Sprite[16]>SPRITES[3].flags        ; valid: 3 is a constant
ld   hl,<Sprite[16]>SPRITES[HL].flags       ; error: HL is not a constant
```

The rejection of runtime registers is what prevents the feature from generating hidden multiply/add code. If the index lives in a register at runtime, you write the arithmetic yourself.

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

Use layout casts for constant-index access: initialization, debug checks, tables where the index is always a named constant.

Use explicit arithmetic when the index is in a register:

```asm
; Runtime index in A: compute SPRITES + A * sizeof(Sprite) + SPRITE_FLAGS
        ld   hl,SPRITES
        ld   b,0
        ld   c,a
        ; multiply C by sizeof(Sprite) — write this as shifts and adds
        add  hl,bc
        ld   de,SPRITE_FLAGS
        add  hl,de           ; HL = address of flags field for sprite A
```

### Common mistakes

**Trying to use a register in a cast path:**

```asm
ld   a,(<Sprite[16]>SPRITES[HL].flags)   ; error
```

This fails because `HL` is a runtime value, not a constant. Write the address calculation in instructions.

**Omitting the type from the cast:**

```asm
ld   hl,SPRITES[3].flags    ; error: not a valid expression without cast
```

The `<TypeExpr>` is required. Without it, the bracket and dot are not layout-path operators.

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
ld   hl,<Counter16>TIMER.count      ; folds to TIMER + offset(Counter16, count)

; Access the low byte:
ld   a,(<Counter16>TIMER.lo)        ; folds to (TIMER + offset(Counter16, lo))
```

Both `offset(Counter16, count)` and `offset(Counter16, lo)` are 0, so both casts fold to the same address as the bare label. The cast's value is readability and type documentation, not a different address.

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

This is equivalent to the layout cast `<Sprite[16]>SPRITE_TABLE[2].flags`. Both reach the same constant.

The index inside the `offset` path must be a numeric literal (a bare integer). Layout-cast paths accept compile-time constant expressions in brackets; `offset()` paths accept only numeric literals. Runtime registers are rejected in both cases — accepting them would require generating multiply-add code rather than folding a constant.

---

[← Data, Storage, and Includes](04-data-storage-includes.md) | [Manual](index.md) | [Register Care and Contracts →](06-register-care.md)
