---
layout: default
title: "Chapter 3 — Addresses, Constants, and Expressions"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 3
---
[← Source Syntax and Symbols](02-source-syntax.md) | [Manual](index.md) | [Data, Storage, and Includes →](04-data-storage-includes.md)

# Chapter 3 — Addresses, Constants, and Expressions

Assembly programs need two kinds of names: names for places (where in memory does this code go?) and names for values (what does this number mean?). This chapter covers `.org` and `$` for controlling placement, `.equ` for binding names to constants, expressions for computing with those constants, and `enum` for grouping related integer constants into named sets.

---

## `.org` sets the assembly address

```asm
        .org $0100
```

After this directive, AZM places the next byte at address `$0100`. Labels defined after it get addresses starting there. Without `.org`, assembly begins at address 0.

You can use multiple `.org` directives in one source file to place different sections at different addresses:

```asm
        .org $0100

code_start:
        ld   a,42
        ld   (result),a
        halt

        .org $8000

result:
        .ds 1
```

The code assembles at `$0100`. The storage assembles at `$8000`. Both land in the same output binary at their respective offsets.

## What does `.org` affect?

`.org` changes where AZM places the next bytes, emitting nothing itself. Your loader or boot ROM determines where the CPU begins executing — `.org` only tells the assembler where to position subsequent output. AZM warns when a new `.org` overlaps already-assembled bytes.

## Assembly address vs file offset

In a flat binary, the byte at address `$0100` lands at file offset `$0100` only if the binary starts at address `$0000`. If your code lives at `$8000` and your binary starts there, address `$8000` maps to file offset 0. AZM handles this correctly: the binary output contains the bytes in address order from the first assembled byte. The listing shows assembly addresses, not file offsets.

## `$` — the current assembly address

`$` is a special symbol that evaluates to the current assembly address at the point it appears. It is valid inside any expression where AZM is already processing a line.

**Table length:**

```asm
TABLE:
        .db $01,$02,$03,$04,$08
TABLE_LEN   .equ $ - TABLE
```

After the `.db` line, `$` is the address one past the last byte of `TABLE`. `$ - TABLE` gives the number of bytes in the table. This is a compile-time constant, not a runtime calculation.

**Code size:**

```asm
        .org $0000
        ; ... code ...
CODE_END:
CODE_SIZE   .equ $ - 0
```

**Jump table stride verification:**

```asm
; Verify each dispatch entry is exactly 3 bytes
DISPATCH_A:
        jp   HANDLER_A
DISPATCH_B:
        jp   HANDLER_B
ENTRY_STRIDE .equ DISPATCH_B - DISPATCH_A   ; must be 3
```

## Gaps between origins

When you use two `.org` directives with a gap between them, the binary output may contain a hole depending on how the output is formed:

- **Flat binary:** bytes are emitted in address order. If your first section ends at `$01FF` and the next `.org` is `$8000`, the binary fills the gap with zero bytes unless you use `.binfrom` / `.binto` to trim it.
- **Intel HEX:** records are emitted only for the addresses that contain assembled bytes. Gaps in HEX are implicit.
- **Listing:** shows only the bytes actually assembled; gaps are visible as address jumps.

`.binfrom` and `.binto` mark the range of the flat binary that matters:

```asm
        .binfrom $0100
        ; ... code and data ...
        .binto $0200
```

The binary contains only the bytes between the two addresses. Any trailing `.ds` after `.binto` advances the address counter but does not extend the binary file.

## `.align`

```asm
        .align 16
```

Advances the assembly address to the next multiple of 16, inserting zero bytes to fill the gap. The argument must be a positive integer. Use `.align` when hardware or lookup-table requirements demand address alignment.

---

## Constants with `.equ`

`.equ` binds a name to a constant expression. It emits nothing. The name becomes a synonym for the value, usable in any expression context — instruction operands, data directives, storage counts, layout sizes, and other `.equ` expressions.

Two valid spellings:

```asm
MAX_COUNT   .equ 64
MAX_COUNT:  .equ 64
```

The colon form is accepted for ASM80 compatibility. Both produce the same constant. Canonical AZM style omits the colon, which avoids visual confusion between address labels and constant definitions.

### Hardware constants

Port addresses and memory-mapped I/O addresses belong as `.equ` constants, not bare numbers scattered through code:

```asm
; TEC-1 hardware
LCD_DATA    .equ $00        ; LCD data port
LCD_CTRL    .equ $01        ; LCD control port
KEY_PORT    .equ $00        ; keyboard input port

; MON3 ROM entry points
MON_PUTC    .equ $0008
MON_GETC    .equ $000B
MON_PRTHL   .equ $0020
```

When hardware changes or you port to a different board, one edit in the hardware-definition file propagates everywhere.

### Address constants

Named addresses for variables, buffers, and workspace:

```asm
WORK_BASE   .equ $8000
STACK_TOP   .equ $87FF
SCREEN_RAM  .equ $4000
```

These can be used as immediate values in instructions:

```asm
        ld   sp,STACK_TOP
        ld   hl,SCREEN_RAM
```

### Size and offset constants

Deriving sizes from other constants keeps arithmetic in one place:

```asm
TILE_W      .equ 8
TILE_H      .equ 8
TILE_BYTES  .equ TILE_W * TILE_H

SCREEN_W    .equ 128
SCREEN_H    .equ 64
SCREEN_ROWS .equ SCREEN_H / TILE_H

TABLE_BASE  .equ $8100
TABLE_END   .equ TABLE_BASE + 32
TABLE_LEN   .equ TABLE_END - TABLE_BASE
```

Layout offsets defined as `.equ` stay correct when the layout changes:

```asm
; Manual record layout when not using .type
ACTOR_X     .equ 0    ; byte at offset 0
ACTOR_Y     .equ 1    ; byte at offset 1
ACTOR_FLAGS .equ 2    ; byte at offset 2
ACTOR_SIZE  .equ 3
```

Prefer `offset(Type, field)` and `sizeof(Type)` when using `.type` declarations — they update automatically when the layout changes.

### Forward references in `.equ`

A `.equ` expression may reference a label or another `.equ` that is defined later in the source:

```asm
TABLE_LEN   .equ TABLE_END - TABLE_START

TABLE_START:
        .db 1,2,3,4
TABLE_END:
```

AZM resolves forward references across passes. Circular references produce an error.

### Re-definition

AZM does not allow redefining a `.equ` name to a different value in the same translation unit:

```asm
COUNT   .equ 10
COUNT   .equ 20   ; error: duplicate symbol
```

If you need a name whose value changes based on a mode or configuration, structure the source so only one definition is included at a time (for example, via conditional includes — though AZM currently has no built-in conditional assembly). In practice, keep one canonical definition of each constant and express derived values from it.

### Naming conventions

AZM has no enforced naming convention for constants. Common conventions in the Z80 ecosystem:

- All-uppercase with underscores: `MAX_SPEED`, `LCD_DATA`
- Mixed case with underscores: `Max_Speed`

All-uppercase is the most common in Z80 source and the convention used throughout this manual. Enum members use qualified dotted names (`Mode.Read`) which look different from raw equates. Layout-derived constants from `sizeof` and `offset` are often named with the type name as a prefix: `SPRITE_SIZE`, `SPRITE_FLAGS`.

### Common mistakes

**Missing the `.equ`:**

```asm
MAX  64          ; error — this is not a directive
MAX .equ 64      ; correct
```

**Using a label instead of `.equ`:**

```asm
MAX:             ; MAX is the address of the next byte, not 64
        .db 64
```

`MAX` here is the address of the byte, not the value 64. To get the value, use `ld a,(MAX)`, not `ld a,MAX`. If you want the constant 64, write `.equ`.

**Arithmetic overflow in `.equ`:**

Expressions in `.equ` compute in assembler-integer arithmetic (typically 32-bit). Values that exceed 16 bits can still be used in `.equ` but will be range-checked when used in instruction operands. See Range checks below.

---

## Expressions

An expression in AZM is any combination of numeric literals, symbols, layout queries (`sizeof`, `offset`), and arithmetic operators that folds to an integer constant at assemble time. Expressions appear in instruction operands, `.equ` definitions, `.db` / `.dw` / `.ds` operands, and layout declarations.

### Literals

```asm
$FF             ; hex
0FFH            ; hex (trailing-H form)
255             ; decimal
11111111B       ; binary
```

All four evaluate to the same integer, 255. Expressions can mix formats:

```asm
MASK .equ $F0 | 00001111B    ; $F0 OR $0F = $FF
```

### Symbols and `.equ` names

Any previously defined label or `.equ` name is valid in an expression. Forward references are supported but must be resolvable by the end of assembly:

```asm
STRIDE    .equ sizeof(Sprite)         ; layout constant
TABLE_LEN .equ TABLE_END - TABLE      ; address arithmetic
```

### Arithmetic operators

AZM supports symbolic operators only:

| Operator | Meaning |
|----------|---------|
| `+` | addition |
| `-` | subtraction (or unary negate) |
| `*` | multiplication |
| `/` | integer division |
| `%` | modulo |
| `&` | bitwise AND |
| `\|` | bitwise OR |
| `^` | bitwise XOR |
| `~` | bitwise complement (unary) |
| `<<` | left shift |
| `>>` | right shift |

Word-form operators (`MOD`, `AND`, `OR`, `XOR`, `NOT`, `SHL`, `SHR`) are not recognised. `%` has two roles: as a number prefix it introduces a binary literal (`%10101010`), and as an infix operator it is modulo. A `%` after an expression is modulo; a `%` at the start of a value is a binary literal.

Operator precedence follows conventional arithmetic rules. Parentheses group sub-expressions:

```asm
FRAME_SIZE  .equ (COLS * ROWS) + 2
ENTRY_ADDR  .equ TABLE_BASE + (ENTRY_NUM * 3)
```

### `$` in expressions

```asm
MSG:    .db "Hello"
MSG_LEN .equ $ - MSG        ; byte count of "Hello"
```

In a `.equ` or data context, `$` resolves to the address *after* the last emitted byte on the preceding line.

### Expressions in instructions

```asm
        ld   a,PORT_BASE + 1      ; immediate
        ld   hl,BUFFER + OFFSET   ; 16-bit address
        jr   TARGET - $ - 1       ; manual relative offset (rare)
        bit  FLAG_BIT,a           ; bit index must be 0–7
```

AZM substitutes the folded constant into the instruction encoding. Range checking follows.

### Expressions in data directives

```asm
.db MAX_VAL - 1
.dw TABLE_BASE + STRIDE * 3
.ds SPRITE_COUNT * sizeof(Sprite)
```

`.db` accepts byte-range expressions (0–255 or −128–127 for signed). `.dw` accepts word-range expressions (0–65535). `.ds` accepts any non-negative count expression.

To split a 16-bit address into two bytes, use bitwise operators:

```asm
.db VECTOR_TABLE & $FF       ; low byte
.db (VECTOR_TABLE >> 8) & $FF ; high byte
```

### Constant folding

AZM folds all expressions at assemble time. An expression whose value depends on a runtime register or flag cannot appear as an assembler expression — it would be a Z80 instruction sequence, not a constant.

```asm
; These are compile-time constants:
SIZE   .equ sizeof(Sprite) * 16
OFFSET .equ offset(Sprite, flags)

; This is an instruction, not an expression:
        add  hl,bc           ; runtime addition
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

When a value falls outside the valid range for its encoding, AZM reports a range error. The diagnostic names the value and the allowed range.

### Invalid expression diagnostics

Common expression errors:

- **Unknown symbol**: a name that has no `.equ`, label, or layout definition
- **Circular reference**: an `.equ` that transitively references itself
- **Non-constant in expression**: a register name where a constant is required
- **Division by zero**: `expr / 0`
- **Range overflow**: a computed value outside the encoding range for its position

Chapter 8 covers diagnostic messages.

---

## Enums as grouped constants

An enum declares a named group of integer constants. Each member gets a qualified name — the group name, a dot, and the member name. You refer to the constant as `Group.Member`, never as `Member` alone.

### Syntax

```asm
enum Mode Read, Write, Append
```

This creates three constants:

| Name | Value |
|------|-------|
| `Mode.Read` | 0 |
| `Mode.Write` | 1 |
| `Mode.Append` | 2 |

Members are numbered from 0 and increment by 1. The enum name and member names are case-sensitive.

### Using enum values

Enum members are valid in any compile-time expression context:

```asm
enum Mode Read, Write, Append

        ld   a,Mode.Write       ; load 1 into A
        cp   Mode.Append        ; compare A with 2

        .db Mode.Read           ; emit byte 0
CURR_MODE .equ Mode.Read
```

### When to use enums

Enums work well for any small set of named states, command codes, token kinds, or hardware-mode values where you want the name to appear in code instead of a bare number:

```asm
enum State Idle, Moving, Attacking, Dead
enum TileKind Empty, Wall, Pill, Power, Ghost
enum Key Left, Right, Up, Down, Fire
```

```asm
        ld   a,(player_state)
        cp   State.Dead
        jr   z,game_over
```

`State.Dead` reads more clearly at a glance than `cp 3`. If you reorder the enum or add a state between existing ones, every use of `State.Dead` updates automatically.

### Unqualified names are rejected

AZM does not allow bare member names without the group prefix:

```asm
enum Mode Read, Write, Append

        ld   a,Read      ; error: unknown symbol Read
        ld   a,Mode.Read ; correct
```

Unqualified member names would become ambiguous as source grows and make listings harder to read.

### Enums and collision avoidance

Two enums can have members with the same name because the qualifier is always required:

```asm
enum Color Red, Green, Blue
enum State Idle, Active, Dead

; Both Red and Idle have value 0, but are different symbols:
; Color.Red = 0, State.Idle = 0
```

### Comparing enum values in Z80 code

Z80 comparison instructions work on byte values. An enum member is a byte-sized integer, so all the usual patterns apply:

```asm
        ld   a,(mode)
        cp   Mode.Write
        jr   z,handle_write
        cp   Mode.Append
        jr   z,handle_append
        ; falls through: Mode.Read or unrecognized
```

A jump table dispatch on an enum:

```asm
enum Cmd Draw, Move, Erase

; BC = Cmd.* value, guaranteed 0–2
        ld   hl,CMD_TABLE
        ld   b,0
        add  hl,bc
        add  hl,bc
        add  hl,bc           ; HL = CMD_TABLE + cmd * 3
        jp   (hl)

CMD_TABLE:
        jp   do_draw         ; 3 bytes
        jp   do_move         ; 3 bytes
        jp   do_erase        ; 3 bytes
```

### No runtime type checking

Enums are purely compile-time. AZM does not generate any range check or tag byte in the output. A value loaded at runtime could be any byte — the assembler has no way to verify it. Enum-related safety is in how you structure data and how you validate inputs before dispatching on them.

---

[← Source Syntax and Symbols](02-source-syntax.md) | [Manual](index.md) | [Data, Storage, and Includes →](04-data-storage-includes.md)
