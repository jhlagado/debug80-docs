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

Together these give you compile-time arithmetic: any computation that can be done with fixed numbers, the assembler handles for you, leaving only runtime-dependent work for actual Z80 instructions.

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

Separating code and storage this way is the standard pattern for Z80 programs. Your executable instructions live at a known ROM or load address; your RAM variables live elsewhere. The listing confirms both: the code section shows addresses starting at `$0100`, and the storage section shows addresses starting at `$8000`. When they overlap by accident, AZM warns you.

## What does `.org` affect?

`.org` changes where AZM places the next bytes, emitting nothing itself. Your loader or boot ROM determines where the CPU begins executing — `.org` only tells the assembler where to position subsequent output. AZM warns when a new `.org` overlaps already-assembled bytes.

A common mistake is expecting `.org` to set the CPU's starting address. It does not. `.org` tells the assembler where to count from. If your binary loads at the wrong address at runtime, `.org` did not cause it — the loader or hardware configuration did.

## Assembly address vs file offset

In a flat binary, the byte at address `$0100` lands at file offset `$0100` only if the binary starts at address `$0000`. If your code lives at `$8000` and your binary starts there, address `$8000` maps to file offset 0. AZM handles this correctly: the binary output contains the bytes in address order from the first assembled byte. The listing shows assembly addresses, not file offsets.

## `$` — the current assembly address

`$` is a special symbol that evaluates to the current assembly address at the point it appears. It is valid inside any expression where AZM is already processing a line.

You will use it every time you want to know how many bytes sit between two points in your source. Since `$` evaluates to the current address at the point it appears, subtracting a label gives you the byte count of everything between that label and the current position — a compile-time constant, not a runtime calculation.

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

When two `.org` directives leave a hole between them, the output format determines how that hole appears — or whether it appears at all.

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

Jump tables are the most common reason. If you have a dispatch table where each entry must sit at a specific address boundary, `.align` guarantees that without manual counting and padding. The zero bytes inserted to reach the boundary appear in the binary, and the listing shows them.

---

## Constants with `.equ`

`.org` and `$` tell the assembler where things go. The next problem is giving names to the values you will use throughout your code — port numbers, buffer sizes, tile counts, and all the other constants that would otherwise be bare numbers scattered across the source.

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

Hardware constants belong in `.equ` rather than appearing directly in code because port addresses and ROM entry points are facts about your hardware, not facts about your program. When hardware changes, you want to change one file, not hunt through instruction operands. Mixing the two in the same lines means they change together when they should change independently.

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

The manual approach above is what you would write before adopting layout types. It works, but adding a field to the record means updating every offset constant by hand. When offsets are derived from other offsets, a mistake in one number silently corrupts all the ones that follow it.

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

`.equ` names are unique within the translation unit. Defining the same name twice is an error:

```asm
COUNT   .equ 10
COUNT   .equ 20   ; error: duplicate symbol
```

If you need a name whose value changes based on a mode or configuration, structure the source so only one definition is included at a time (for example, via conditional includes — though AZM currently has no built-in conditional assembly). In practice, keep one canonical definition of each constant and express derived values from it. If you need a name whose value varies with a compile-time configuration, structure your includes so only one definition is active at a time — giving both variants distinct names and picking the right one at the point of use is the simplest approach.

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

Where constants give names to fixed values, expressions let you compute with them. Any combination of literals, symbols, and operators that resolves to an integer at assemble time is an expression. Expressions appear everywhere you can put a number: instruction operands, data directives, layout declarations, and `.equ` definitions.

An expression in AZM is any combination of numeric literals, symbols, layout queries (`sizeof`, `offset`), and arithmetic operators that the assembler evaluates to an integer before writing the binary. Expressions appear in instruction operands, `.equ` definitions, `.db` / `.dw` / `.ds` operands, and layout declarations.

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

The bitwise operators — `&`, `|`, `^`, `~`, `<<`, `>>` — are particularly useful for packing flag values or extracting bytes from addresses. You will also reach for them when computing port bitmasks or splitting a 16-bit address into two bytes for `.db`.

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

AZM evaluates the expression and substitutes the result into the instruction encoding. Range checking follows.

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

### Assembly-time evaluation

Every expression in AZM is evaluated by the assembler before anything runs on the Z80. The assembler computes the value and writes the result — a plain number — into the binary. The Z80 never sees the expression, only the bytes it produced.

```asm
SIZE   .equ sizeof(Sprite) * 16   ; assembler computes this; the Z80 sees a number
OFFSET .equ offset(Sprite, flags) ; same — a number by the time the binary is written
```

The rule is clean: anything that depends on register values or memory contents at runtime stays in your Z80 instructions. Everything that can be computed from source-visible constants before the program runs belongs in an expression, and the assembler does that computation for you. A mistake in an expression surfaces as a range error or a wrong number in the listing — much easier to find than a runtime calculation going wrong.

Anything that depends on a register value or a runtime condition cannot be an assembler expression. That is ordinary Z80 code:

```asm
        add  hl,bc    ; Z80 runs this — the result depends on what HL and BC hold at runtime
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

The last naming tool in this chapter is the enum. Where `.equ` names an individual value, an enum names a whole group of related values — state codes, command identifiers, tile types, mode flags — and gives each member a qualified name that carries the group context wherever it is used.

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

The other benefit is searchability. To find every place the program handles the dead state, searching for `State.Dead` finds them all. Searching for `cp 3` finds that comparison, but might match other uses of the number 3 that have nothing to do with state.

### Unqualified names are rejected

Member names require the group qualifier:

```asm
enum Mode Read, Write, Append

        ld   a,Read      ; error: unknown symbol Read
        ld   a,Mode.Read ; correct
```

Unqualified member names would become ambiguous as source grows and make listings harder to read.

### Enums and collision avoidance

When your project grows to a dozen enums, name collisions become a real concern. Two enums can have members with the same name because the qualifier is always required:

```asm
enum Color Red, Green, Blue
enum State Idle, Active, Dead

; Both Red and Idle have value 0, but are different symbols:
; Color.Red = 0, State.Idle = 0
```

### Comparing enum values in Z80 code

Since enum members are byte-sized integers, comparing them in Z80 code is exactly what you would expect: load the value, then use `cp` against the member constant.

Z80 comparison instructions work on byte values. An enum member is a byte-sized integer, so all the usual patterns apply:

```asm
        ld   a,(mode)
        cp   Mode.Write
        jr   z,handle_write
        cp   Mode.Append
        jr   z,handle_append
        ; falls through: Mode.Read or unrecognized
```

For a handful of cases, the `cp` chain is readable and direct. When there are many values and performance matters, a jump table is more efficient — and enum members give you the indices for free:

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

Enums are purely compile-time. The output contains no range checks or tag bytes. A value loaded at runtime could be any byte — validate inputs before dispatching on them.

This means the assembler cannot catch a wrong value being passed as an enum argument. If `A` holds 7 and you dispatch on it as a `Mode` value, you get whatever the jump table entry at position 7 points to. That validation is your responsibility, written as ordinary Z80 instructions before the dispatch.

---

[← Source Syntax and Symbols](02-source-syntax.md) | [Manual](index.md) | [Data, Storage, and Includes →](04-data-storage-includes.md)
