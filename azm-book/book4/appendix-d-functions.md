---
layout: default
title: "Appendix D — Built-in Functions"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 104
---
[← Appendix C — CLI Flag Reference](appendix-c-cli.md) | [Manual](index.md)

# Appendix D — Built-in Functions

AZM has four built-in functions you can use in any expression: `sizeof`, `offset`, `LSB`, and `MSB`. The assembler evaluates all four entirely at assemble time — the Z80 sees only the resulting integer, never the function call. `sizeof` and `offset` work with the layout type system; `LSB` and `MSB` extract byte lanes from 16-bit values.

---

## `sizeof(TypeExpr)`

**Syntax:**
```
sizeof(TypeName)
sizeof(TypeName[n])
```

`sizeof` returns the exact packed byte count for a layout type. For a record, that is the sum of its field sizes with no padding inserted. For a scalar type, it returns the built-in size. For an array form, it multiplies the element size by the count.

```asm
sizeof(byte)         ; 1
sizeof(word)         ; 2
sizeof(addr)         ; 2

; Given: .type Sprite  (x:byte, y:byte, flags:byte, ptr:addr)
sizeof(Sprite)       ; 5
sizeof(Sprite[16])   ; 80
sizeof(byte[32])     ; 32
```

`sizeof(TypeName)` in an expression is equivalent to using the type name directly as a `.ds` size operand — both resolve to the same integer. The function form is useful when you need the constant outside a `.ds` context, or when the name alone would be ambiguous:

```asm
SPRITE_SIZE  .equ sizeof(Sprite)
TOTAL_BYTES  .equ MAX_COUNT * sizeof(Sprite) + sizeof(Header)
```

The full layout system, including how records and unions define their sizes, is covered in [Chapter 5](05-layout-system.md).

---

## `offset(TypeExpr, path)`

**Syntax:**
```
offset(TypeName, fieldName)
offset(TypeName, outerField.innerField)
offset(TypeName, arrayField[n])
offset(TypeName, arrayField[n].innerField)
```

`offset` returns the byte distance from the start of a type to the named field. For simple fields the path is just the field name. For a field that is itself a record, the path is dot-separated. For an array field, the path includes a bracket index.

```asm
.type Sprite
x       .byte      ; offset 0
y       .byte      ; offset 1
flags   .byte      ; offset 2
ptr     .addr      ; offset 3
.endtype

offset(Sprite, x)       ; 0
offset(Sprite, y)       ; 1
offset(Sprite, flags)   ; 2
offset(Sprite, ptr)     ; 3
```

Dot paths reach through nested record fields:

```asm
.type Actor
pos     .field Sprite    ; offsets 0–4
state   .byte            ; offset 5
.endtype

offset(Actor, pos.x)     ; 0
offset(Actor, pos.y)     ; 1
offset(Actor, state)     ; 5
```

**Array indices in `offset` paths must be numeric literals.** `offset(Table, rows[0].x)` is valid; `offset(Table, rows[IDX].x)` is not. Layout-cast path expressions (Chapter 5) accept compile-time expressions in index positions; `offset` path indices do not.

Chapter 5 covers the full layout system including field declarations, nested records, unions, and cast-path syntax.

---

## `LSB(expr)` and `MSB(expr)`

**Syntax:**
```
LSB(expression)
MSB(expression)
```

`LSB` and `MSB` are acronyms — Least Significant Byte and Most Significant Byte — and must be written in uppercase. The parser matches the exact tokens `LSB` and `MSB`; `lsb`, `Lsb`, and other capitalisations are not recognised.

`LSB(expr)` returns the low byte of the value:

```
LSB(value)  =  value & $FF
```

`MSB(expr)` returns the high byte:

```
MSB(value)  =  (value >> 8) & $FF
```

A common use is splitting a 16-bit address or constant into its two bytes, either for loading into a register pair or for embedding in a data table:

```asm
TARGET  .equ $C432

        ld   a, MSB(TARGET)    ; A = $C4
        ld   h, a
        ld   a, LSB(TARGET)    ; A = $32
        ld   l, a
        ; HL now holds $C432

; Stored as a little-endian address pair in a jump table:
jump_table:
        .db LSB(routine_a), MSB(routine_a)
        .db LSB(routine_b), MSB(routine_b)
        .db LSB(routine_c), MSB(routine_c)
```

AZM does not provide `LOW()` or `HIGH()`. If you are porting from an assembler that used those names, replace them with `LSB` and `MSB`.

---

## Case sensitivity

`sizeof` and `offset` are currently parsed case-insensitively: `SIZEOF`, `Sizeof`, and `sizeof` all work. `LSB` and `MSB` are uppercase-only; the parser matches those exact tokens.

The canonical style is lowercase `sizeof` and `offset`, uppercase `LSB` and `MSB`. The author intends to make `sizeof` and `offset` case-sensitive in a future release to match the `LSB`/`MSB` policy. For now, write them lowercase.

---

[← Appendix C — CLI Flag Reference](appendix-c-cli.md) | [Manual](index.md)
