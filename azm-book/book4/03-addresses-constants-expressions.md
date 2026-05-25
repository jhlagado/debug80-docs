---
layout: default
title: "Chapter 3 — Addresses, Constants and Expressions"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 3
---
[← Source Syntax and Symbols](02-source-syntax.md) | [Manual](index.md) | [Raw Data, Storage and Strings →](04-data-storage-includes.md)

# Chapter 3 — Addresses, Constants and Expressions

Assembly programs need two kinds of names: names for places (where in memory does this code go?) and names for values (what does this number mean?). This chapter covers `.org` and `$` for controlling placement, `.equ` for binding names to constants, expressions for computing with those constants and enums for grouping related integer constants into named sets.

Every computation in this chapter resolves to a plain integer before the binary is written. The Z80 sees only the resulting bytes.

---

## `.org` sets the assembly address

```asm
        .org $0100
```

After this directive, AZM places the next byte at address `$0100`. Labels defined after it get addresses starting there. Assembly begins at address 0 until an `.org` sets a different address.

You can use multiple `.org` directives in one source file to place different sections at different addresses:

```asm
        .org $0100

code_start:
        ld   a,42
        ld   (result),a
        halt

        .org $8000

result:
        .db 0
```

The code assembles at `$0100`. The data byte assembles at `$8000`. Both land in the same output binary at their respective offsets.

`.org` sets the assembly address — the address assigned to the next byte — not the byte's position in the output file. `.org` changes where AZM places the next bytes, emitting nothing itself. AZM warns when a new `.org` overlaps already-assembled bytes.

## `$` — the current assembly address

`$` evaluates to the current assembly address at the point it appears. Use it whenever you want to know how many bytes sit between two points in your source.

**Table length:**

```asm
TABLE:
        .db $01,$02,$03,$04,$08
TABLE_LEN   .equ $ - TABLE
```

After the `.db` line, `$` is the address one past the last byte of `TABLE`. `$ - TABLE` gives the number of bytes in the table as an assembler-time constant.

**Code size:**

```asm
        .org $0100
CODE_START:
        ; ... code ...
CODE_END:
CODE_SIZE   .equ CODE_END - CODE_START
```

`CODE_SIZE` evaluates to the byte count between the two labels. Use label subtraction rather than `$ - 0` so the intent is clear and the result stays correct when the code moves.

## Gaps between origins

When you use two `.org` directives with a gap between them, the binary output may contain a hole depending on how the output is formed:

- **Flat binary:** bytes are emitted in address order. If your first section ends at `$01FF` and the next `.org` is `$8000`, the binary fills the gap with zero bytes unless you use `.binfrom` / `.binto` to trim it.
- **Intel HEX:** records are emitted only for the addresses that contain assembled bytes. Gaps in HEX are implicit.

`.binfrom` and `.binto` mark the address range to include in the flat binary:

```asm
        .binfrom $0100
        ; ... code and data ...
        .binto $0200
```

The binary contains the bytes between the two addresses.

## `.align`

```asm
        .align 16
```

Advances the assembly address to the next multiple of 16, inserting zero bytes to fill the gap. Use `.align` when hardware or lookup-table requirements demand address alignment.

---

## Constants with `.equ`

`.equ` binds a name to a constant expression. It emits nothing. The name becomes a synonym for the value, usable in any expression context — instruction operands, data directives, storage counts, layout sizes and other `.equ` expressions.

The canonical form:

```asm
MAX_COUNT   .equ 64
```

A name is global in the translation unit and can be defined once. Defining the same name twice is an error:

```asm
COUNT   .equ 10
COUNT   .equ 20   ; error: duplicate symbol
```

### Hardware constants

Port addresses and memory-mapped I/O addresses belong as `.equ` constants:

```asm
LCD_DATA    .equ $00
LCD_CTRL    .equ $01
KEY_PORT    .equ $00

MON_PUTC    .equ $0008
MON_GETC    .equ $000B
```

When hardware changes, one edit in the hardware-definition file propagates everywhere.

### Address constants

```asm
WORK_BASE   .equ $8000
STACK_TOP   .equ $87FF
SCREEN_RAM  .equ $4000
```

```asm
        ld   sp,STACK_TOP
        ld   hl,SCREEN_RAM
```

### Size constants

Deriving sizes from other constants keeps arithmetic in one place:

```asm
TILE_W      .equ 8
TILE_H      .equ 8
TILE_BYTES  .equ TILE_W * TILE_H

SCREEN_W    .equ 128
SCREEN_H    .equ 64
SCREEN_ROWS .equ SCREEN_H / TILE_H
```

Label subtraction records a layout assumption as an assembler-time constant:

```asm
DISPATCH_A:
        jp   HANDLER_A
DISPATCH_B:
        jp   HANDLER_B
ENTRY_STRIDE .equ DISPATCH_B - DISPATCH_A   ; 3: jp is a 3-byte instruction
```

Any code that dispatches through this table loads `ENTRY_STRIDE` by name rather than encoding the stride as a literal.

### Forward references in `.equ`

A `.equ` expression may reference a label or another `.equ` defined later in the source:

```asm
TABLE_LEN   .equ TABLE_END - TABLE_START

TABLE_START:
        .db 1,2,3,4
TABLE_END:
```

AZM resolves forward references across passes. Circular references produce an error.

---

## Expressions

An expression is any combination of numeric literals, symbols and arithmetic operators that the assembler evaluates to an integer before writing the binary. Expressions appear everywhere you can put a number: instruction operands, `.equ` definitions, `.db` / `.dw` / `.ds` operands.

### Arithmetic operators

AZM supports symbolic operators: `+` `-` `*` `/` `%` `&` `|` `^` `~` `<<` `>>`.

The `%` operator between two expressions performs integer modulo. A `%` at the start of a value is a binary literal prefix, covered in Chapter 2.

Operator precedence follows conventional arithmetic rules. Parentheses group sub-expressions:

```asm
FRAME_SIZE  .equ (COLS * ROWS) + 2
ENTRY_ADDR  .equ TABLE_BASE + (ENTRY_NUM * 3)
```

See [Appendix B](appendix-b-operators.md) for the full precedence table.

### `$` in expressions

```asm
MSG:    .db "Hello"
MSG_LEN .equ $ - MSG        ; byte count of "Hello"
```

In a `.equ` or data context, `$` resolves to the address after the last emitted byte on the preceding line.

### Expressions in instructions

```asm
        ld   a,PORT_BASE + 1
        ld   hl,BUFFER + OFFSET
        bit  FLAG_BIT,a
```

### Expressions in data directives

```asm
.db MAX_VAL - 1
.dw TABLE_BASE + STRIDE * 3
.ds SPRITE_COUNT * 4
```

`.db` accepts byte-range expressions (0–255 or −128–127 for signed). `.dw` accepts word-range expressions (0–65535). `.ds` accepts any non-negative count expression.

To split a 16-bit address into two bytes:

```asm
.db VECTOR_TABLE & $FF       ; low byte
.db (VECTOR_TABLE >> 8) & $FF ; high byte
```

### Assembler-time evaluation

Every expression in AZM is evaluated by the assembler before anything runs on the Z80. The assembler computes the value and writes the result — a plain number — into the binary.

Runtime-dependent values belong in Z80 instructions:

```asm
        add  hl,bc    ; result depends on HL and BC at runtime
```

### Range checks

AZM checks that expression values fit the encoding slot they fill:

| Context | Valid range |
|---------|-------------|
| 8-bit immediate (`ld a,n`) | 0–255 or −128–127 |
| 8-bit data (`.db`) | 0–255 |
| Signed 8-bit branch offset | −128–127 (from next PC) |
| `bit`/`set`/`res` bit index | 0–7 |
| 16-bit immediate (`ld hl,nn`) | 0–65535 |
| 16-bit data (`.dw`) | 0–65535 |
| Port number (`in a,(n)`) | 0–255 |

When a value falls outside the valid range for its encoding, AZM reports a range error naming the value and the allowed range.

### Expression errors

Common expression errors:

- **Unknown symbol**: a name with no `.equ`, label or layout definition
- **Circular reference**: an `.equ` that transitively references itself
- **Division by zero**: `expr / 0`
- **Range overflow**: a computed value outside the encoding range

Chapter 8 covers diagnostic messages.

---

## Enums as grouped constants

When you write a set of related constants with `.equ`, they often form a natural sequence:

```asm
RED   .equ 0
GREEN .equ 1
BLUE  .equ 2
```

This works, but the values are yours to maintain. Insert `YELLOW` between `RED` and `GREEN` and you have to renumber `GREEN`, `BLUE` and everything that follows.

An enum groups related constants under a single name and assigns their values automatically. You list the members; AZM assigns 0 to the first, 1 to the second and so on:

```asm
Mode .enum Read, Write, Append
```

The name comes first, then `.enum`, then a comma-separated member list. Each member gets a qualified name — the group name, a dot and the member name:

| Name | Value |
|------|-------|
| `Mode.Read` | 0 |
| `Mode.Write` | 1 |
| `Mode.Append` | 2 |

The qualifier is always required. `Read` alone is an error:

```asm
        ld   a,Read      ; error: unknown symbol Read
        ld   a,Mode.Read ; correct
```

When two enums share a word, the group name separates them:

```asm
Color .enum Red, Green, Blue
State .enum Idle, Active, Dead

; Color.Red = 0, State.Idle = 0 — different symbols
```

Enum members are valid in any assembler-time expression context:

```asm
        ld   a,Mode.Write       ; load 1 into A
        cp   Mode.Append        ; compare A with 2
        .db Mode.Read           ; emit byte 0
```

For a handful of states, a `cp` chain is readable:

```asm
        ld   a,(mode)
        cp   Mode.Write
        jr   z,handle_write
        cp   Mode.Append
        jr   z,handle_append
        ; falls through: Mode.Read or unrecognized
```

When there are many values and performance matters, a jump table is more efficient:

```asm
Cmd .enum Draw, Move, Erase

; C = Cmd.* value, guaranteed 0–2
        ld   hl,CMD_TABLE
        ld   b,0
        add  hl,bc
        add  hl,bc
        add  hl,bc           ; HL = CMD_TABLE + cmd * 3
        jp   (hl)

CMD_TABLE:
        jp   do_draw
        jp   do_move
        jp   do_erase
```

### When to use enums

Use enums for any small set of named states, command codes, token kinds or hardware-mode values where a dense sequence is natural. `State.Dead` reads more clearly than `cp 3`; add or reorder members and every use updates automatically. For values that need specific numbers — port addresses, bitmasks, hardware registers — use `.equ`. At runtime, an enum value is an ordinary byte; validate inputs before dispatching on them.

---

[← Source Syntax and Symbols](02-source-syntax.md) | [Manual](index.md) | [Raw Data, Storage and Strings →](04-data-storage-includes.md)
