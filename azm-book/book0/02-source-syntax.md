---
layout: default
title: "Chapter 2 — Source Syntax and Symbols"
parent: "AZM Book 0 — Assembler Manual"
nav_order: 2
---
[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants and Expressions →](03-addresses-constants-expressions.md)

# Chapter 2 — Source Syntax and Symbols

Every line in an AZM source file either emits bytes, names a location or controls what comes next. Before any of the larger features — layouts, register contracts, op declarations — there are rules about how lines are formed, what numbers look like and what distinguishes a label from a directive. This chapter covers those rules.

---

## Line structure

Each ordinary source line contains one of:

- A label, optionally followed by an instruction or directive
- A standalone instruction or directive
- A comment alone
- A blank line

A label on the same line as an instruction:

```asm
BUFFER_SIZE   .equ 256
Start:        ld   a,0
```

A label on its own line, with the instruction on the next:

```asm
Start:
              ld   a,0
```

Both forms are valid. Labels on their own line are common for routines; labels on the same line are common for constants.

### Chained instruction lines

Short instruction runs can share one physical line when the instructions are separated by a spaced backslash:

```asm
main: ld a,b \ inc a \ ret
```

AZM assembles that line exactly as if you had written the instructions on separate lines:

```asm
main:
        ld      a,b
        inc     a
        ret
```

Use the chain form for very small runs where the source stays easier to scan on one line. The backslash must be readable as a separator: put whitespace on both sides. A backslash inside a quoted string is still part of the string, not an instruction separator.

Only instructions and op invocations belong in a chain. Directives and declarations still use their own lines. A label may appear before the first instruction in the chain, but not before a later segment:

```asm
Start:  xor a \ ld b,a \ ret     ; valid

        ld a,1 \ .db 2           ; error: directive in a chain
        ld a,1 \ Next: inc a     ; error: later label in a chain
```

## Whitespace and separators

One or more spaces or tabs separate tokens. Commas separate operand lists in `.db`, `.dw` and similar data directives:

```asm
.db $48,$65,$6C,$6C,$6F   ; five bytes
```

The canonical form is `NAME .equ expr`. The name always comes first.

## Comments

A semicolon starts a comment that runs to the end of the line:

```asm
; This whole line is a comment.
        ld a,0   ; inline comment
```

Register contracts use the `.routine` directive immediately before a routine label:

```asm
.routine in A,HL out carry clobbers BC
ReadKey:
        ret
```

The directive emits no bytes. Chapter 6 covers routine boundaries and contract analysis.

---

## Labels

Symbols are what let you write `djnz READ_LOOP` instead of `djnz $0105`. Every time you write a label in source, AZM records the current assembly address under that name. Every time you reference that name in an operand or expression, AZM substitutes the address. By the time the binary is written, all the names are gone — only bytes remain.

A label names the assembly address at the point where it appears:

```asm
Buffer:
        .db 0
```

AZM records that `BUFFER` equals the current assembly address. Any instruction or data that references `BUFFER` gets that address substituted in.

Code labels work the same way:

```asm
ReadLoop:
        ld      a,(hl)
        inc     hl
        djnz    ReadLoop
```

`READ_LOOP` is the address of the `ld` instruction. `djnz READ_LOOP` becomes a relative branch to that address.

### Non-local labels

A plain label declares a non-local symbol. Calls, jumps, expressions and data declarations in the same assembled source unit can refer to it directly. Two non-local labels in that source unit cannot share a name.

```asm
; error: two definitions of Count
Count:  .db 0
Count:  .db 0
```

### Label syntax

A **plain label** is an identifier followed by a colon, on a line by itself or before an instruction or directive:

```asm
MyLabel:
MyLabel: ld a,0
```

Both forms are valid. Non-local identifiers contain letters, digits and underscores and must start with a letter.

Do not use `$` as a namespace separator in source labels. `$` has two source-level meanings in AZM: the current assembly address when written by itself, and hexadecimal notation when followed by hex digits, such as `$4000`. Imported files provide privacy through `.import` and `@` exports, not through `$`-qualified labels.

### Exported labels

An exported label begins with `@` followed by a plain identifier:

```asm
@ShiftRow:
```

The symbol name is `ShiftRow`, so call sites write `call ShiftRow`. The `@` marks the declaration as visible outside an imported source unit. It has no register-contract meaning; `.routine` declares a routine boundary.

Export and routine declarations are independent:

```asm
.routine in HL out A
@ReadByte:
        ld      a,(hl)
        ret
```

### Owner-local labels

A label beginning with one underscore belongs to the nearest preceding non-local label. The same local spelling can be reused under another owner:

```asm
.routine in HL
ShiftRow:
        ld      b,8
_loop:
        rl      (hl)
        inc     hl
        djnz    _loop
        ret

.routine in HL,DE
CopyRow:
        ld      b,8
_loop:
        ld      a,(de)
        ld      (hl),a
        inc     de
        inc     hl
        djnz    _loop
        ret
```

`ShiftRow._loop` and `CopyRow._loop` have distinct identities in AZM output and Debug80 maps. Source code uses the short `_loop` spelling. A local label cannot be exported, so `@_loop:` is an error. Equates, enum members, type names and op names cannot begin with `_`. Names beginning with `__` are reserved for assembler-generated symbols.

### Forward references

Labels may be used before they are defined:

```asm
        ld      hl,DataTable
        ld      b,TABLE_LEN

DataTable:
        .db 1,2,3,4
TABLE_LEN .equ $ - DataTable
```

AZM uses a two-pass strategy: the first pass assigns addresses to all labels; the second pass substitutes those addresses into instruction encodings. Any reference still unresolved after both passes is an error — typically a typo in a label name.

### Multiple labels at one address

Two or more labels can name the same address:

```asm
EntryA:
EntryB:
        ld      a,(hl)
        ret
```

Both `EntryA` and `EntryB` call into the same instruction. When a `.routine` directive precedes consecutive non-local labels, AZM treats them as aliases for the same routine body.

---

## Naming conventions

User symbols are case-sensitive. `START`, `start` and `Start` are three distinct symbols.

The preferred AZM style:

- **Constants** (`SCREEN_WIDTH`, `MAX_SPRITES`, `LCD_DATA`): uppercase with underscores.
- **Routine and data labels** (`DrawSprite:`, `InitTimer:`, `SpriteTable:`): PascalCase.
- **Owner-local labels** (`_loop:`, `_skipInit:`, `_done:`): a leading underscore followed by short camelCase.
- **Exported labels** (`@ReadKey:`, `@DrawSprite:`): PascalCase after the `@`.

The assembler enforces no naming policy; different projects may use their own conventions. These give a concrete starting point and match the style used throughout this manual.

Keep non-local labels distinct within their source unit. Owner-local labels can reuse familiar names such as `_loop` and `_done` because the owner supplies their identity. Use `@` only for declarations that form an imported module's public interface.

---

## Declaration syntax

Declarations put the declared name on the left, without a colon:

```asm
COUNT       .equ 8
Colour      .enum Red, Green, Blue

Sprite      .type
x           .field byte
y           .field byte
            .endtype

SpriteArray .typealias Sprite[2]
```

A colon marks an address label only — it names the current assembly address, not a constant or type:

```asm
COUNT   .equ 8      ; assemble-time constant

Count:              ; address label
        .db 8
```

`COUNT .equ 8` and `COUNT:` are different things. The first binds a name to the value 8. The second records the address of the `.db 8` byte that follows. AZM reports an error for `COUNT: .equ 8`.

---

## Directives

AZM's canonical directive names start with a dot:

```asm
.org    .equ    .db    .dw    .ds    .end
```

The full directive list is in Appendix A.

Directives are lowercase and case-sensitive. `.db` is the canonical form; `.DB` and `.Db` are parse errors. Compatibility forms for other assembler source are covered in Chapter 7.

---

## Opcode and register case

AZM is case-insensitive for Z80 instruction mnemonics and register names. `LD`, `ld` and `Ld` all parse as the same instruction; `A`, `a`, `HL` and `hl` all name the same register. Pick one case for mnemonics and stay with it throughout the project.

The `--case-style` flag enforces consistency if you want the assembler to flag mixed casing.

---

## Numeric literals

AZM accepts all numeric literal forms common in Z80 assembly:

| Form | Example | Base |
|------|---------|------|
| `$` prefix | `$FF`, `$0100` | hex |
| `0x` prefix | `0xFF`, `0x2A` | hex |
| Trailing `H` | `0FFH`, `02AH` | hex |
| `%` prefix | `%10101010` | binary |
| `0b` prefix | `0b10101010` | binary |
| Trailing `B` | `11110000B` | binary |
| Plain decimal | `42`, `255` | decimal |
| Quoted character | `'A'`, `"Z"` | ASCII value |

**Trailing-`H` rule:** the token must start with a decimal digit. `0FFH` is hex 255. `FFH` starts with a letter, so the parser reads it as a symbol name. Write `$FF` or `0FFH`.

All numeric forms can appear freely in any expression and can be mixed within one expression:

```asm
WIDTH   .equ $20           ; hex prefix
HEIGHT  .equ 32            ; decimal
FLAGS   .equ %00001111     ; binary prefix
DOT     .equ 'A' + 1       ; ASCII + offset
SIZE    .equ WIDTH * HEIGHT ; 1024
```

See [Appendix B](appendix-b-operators.md) for the full numeric literal table.

---


---

[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants and Expressions →](03-addresses-constants-expressions.md)
