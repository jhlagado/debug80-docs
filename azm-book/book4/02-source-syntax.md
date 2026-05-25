---
layout: default
title: "Chapter 2 — Source Syntax and Symbols"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 2
---
[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants and Expressions →](03-addresses-constants-expressions.md)

# Chapter 2 — Source Syntax and Symbols

Every line in an AZM source file either emits bytes, names a location or controls what comes next. Before any of the larger features — layouts, register contracts, op declarations — there are rules about how lines are formed, what numbers look like and what distinguishes a label from a directive. This chapter covers those rules.

---

## Line structure

Each line contains at most one of:

- A label, optionally followed by an instruction or directive
- A standalone instruction or directive
- A comment alone
- A blank line

A label on the same line as an instruction:

```asm
BUFFER_SIZE   .equ 256
START:        ld   a,0
```

A label on its own line, with the instruction on the next:

```asm
START:
              ld   a,0
```

Both forms are valid. Labels on their own line are common for routines; labels on the same line are common for constants.

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

The `;!` prefix is the AZMDoc contract marker. It looks like a comment but is parsed by the register-care analyzer:

```asm
;!      in        A,HL
;!      out       carry
;!      clobbers  BC
```

Other Z80 assemblers treat `;!` lines as ordinary comments. AZM reads them as register-care contracts when analysis is enabled. Chapter 6 covers the full workflow.

---

## Labels

Symbols are what let you write `djnz READ_LOOP` instead of `djnz $0105`. Every time you write a label in source, AZM records the current assembly address under that name. Every time you reference that name in an operand or expression, AZM substitutes the address. By the time the binary is written, all the names are gone — only bytes remain.

A label names the assembly address at the point where it appears:

```asm
BUFFER:
        .db 0
```

AZM records that `BUFFER` equals the current assembly address. Any instruction or data that references `BUFFER` gets that address substituted in.

Code labels work the same way:

```asm
READ_LOOP:
        ld      a,(hl)
        inc     hl
        djnz    READ_LOOP
```

`READ_LOOP` is the address of the `ld` instruction. `djnz READ_LOOP` becomes a relative branch to that address.

### Global labels

Every plain label is a global symbol, unique across the entire translation unit — the source file plus all included files. If two labels share a name, AZM reports a duplicate-symbol error.

Branch labels inside routines must be unique too. Two routines that both need a loop label called `Loop` will clash at assembly time. The convention throughout this manual is to prefix branch labels with the routine name: `ShiftRowLoop`, `CopyRowLoop`, `ScanRowLoop`.

```asm
; error: two definitions of COUNT
COUNT:  .db 0
COUNT:  .db 0
```

### Label syntax

A **plain label** is an identifier followed by a colon, on a line by itself or before an instruction or directive:

```asm
MY_LABEL:
MY_LABEL: ld a,0
```

Both forms are valid. Identifiers can contain letters, digits and underscores and must start with a letter.

An **entry label** begins with `@` followed by a plain identifier:

```asm
@SHIFT_ROW:
```

The `@` is stripped from the symbol name. `SHIFT_ROW` is the callable name; call sites write `call SHIFT_ROW`. The `@` prefix marks a routine boundary for register-care analysis, covered in Chapter 6.

### The `@` entry prefix

`@NAME:` marks `NAME` as a routine entry point. Branch labels inside the body are still global symbols, so two routines that both need a loop label must use distinct names:

```asm
@SHIFT_ROW:
        ld      b,8
ShiftRowLoop:
        rl      (hl)
        inc     hl
        djnz    ShiftRowLoop
        ret

@COPY_ROW:
        ld      b,8
CopyRowLoop:
        ld      a,(de)
        ld      (hl),a
        inc     de
        inc     hl
        djnz    CopyRowLoop
        ret
```

### Forward references

Labels may be used before they are defined:

```asm
        ld      hl,DATA_TABLE
        ld      b,TABLE_LEN

DATA_TABLE:
        .db 1,2,3,4
TABLE_LEN .equ $ - DATA_TABLE
```

AZM uses a two-pass strategy: the first pass assigns addresses to all labels; the second pass substitutes those addresses into instruction encodings. Any reference still unresolved after both passes is an error — typically a typo in a label name.

### Multiple labels at one address

Two or more labels can name the same address:

```asm
@ENTRY_A:
@ENTRY_B:
        ld      a,(hl)
        ret
```

Both `ENTRY_A` and `ENTRY_B` call into the same instruction. Consecutive `@` labels before the first instruction are treated as entries for the same routine body.

---

## Naming conventions

User symbols are case-sensitive. `START`, `start` and `Start` are three distinct symbols.

The preferred AZM style:

- **Constants** (`SCREEN_WIDTH`, `MAX_SPRITES`, `LCD_DATA`): uppercase with underscores.
- **Entry labels** (`@DrawSprite:`, `@InitTimer:`): PascalCase after the `@`.
- **Branch labels** (`ShiftRowLoop`, `SkipInit`, `DrawDone`): PascalCase, prefixed with the enclosing routine name where the name could clash.

The assembler enforces no naming policy; different projects may use their own conventions. These give a concrete starting point and match the style used throughout this manual.

Labels need globally unique names. Prefixing branch labels with their routine name (`ShiftRowLoop` rather than `Loop`) prevents clashes when the same word appears in multiple routines.

---

## Declaration syntax

Declarations put the declared name on the left, without a colon:

```asm
COUNT       .equ 8
Colour      .enum Red, Green, Blue

Sprite      .type
x           .byte
y           .byte
            .endtype

SpriteArray .typealias Sprite[2]
```

A colon marks an address label only — it names the current assembly address, not a constant or type:

```asm
COUNT   .equ 8      ; assemble-time constant

COUNT:              ; address label
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

## String literals

Quoted strings are character data. A single-character quoted value such as `'A'` is a numeric literal equal to the character's ASCII code, as shown in the numeric literals table above. Multi-character strings and the string directives (`.cstr`, `.pstr`, `.istr`) are covered in Chapter 4 alongside the data directives.

---

## Strict parsing

AZM reports unknown directives and malformed operands immediately. When the parser cannot make sense of a line, it reports an error and stops that pass. Chapter 8 covers diagnostic messages and how to read them.

---

[← Getting Started](01-getting-started.md) | [Manual](index.md) | [Addresses, Constants and Expressions →](03-addresses-constants-expressions.md)
