---
layout: default
title: "Appendix E - AZM Touchpoints"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 23
---

[← Appendix D](appendix-d-build-and-debug.md) | [Book](index.md)

# Appendix E - AZM Touchpoints

Every Glimmer build writes one AZM assembly file, and AZM assembles
and checks it. Reading that file, and writing modules of your own,
goes faster once you know the assembler features Glimmer leans on.
Each entry below says what the feature is, where Glimmer relies on
it, shows one excerpt from a real build, and points into
[← Appendix D](appendix-d-build-and-debug.md) | [Book](index.md)
chapter of its own. The excerpts come from generated files of this
book's programs: Canvas (chapter 10), Tetro (chapter 15), Sprite
Chase (chapter 17).

## Labels and local labels

A label names an address. A label beginning with one underscore is
local: it belongs to the nearest non-local label above it, its
owner, and AZM tracks it as `Owner._name`, so the same spelling can
recur under different owners.

Every block body is compiled under a generated label,
`Glim_<BlockName>:`, and that label owns the block's locals. Two of
Canvas's movement blocks, side by side in `canvas.main.asm`:

```asm
; --- logic block MoveUp ---
.routine
Glim_MoveUp:
    ld a,(Cursor + offset(Point, y))
    or a
    jr z,_stop      ; at the top edge: stay
    dec a
    ld (Cursor + offset(Point, y)),a
_stop:
        ...

; --- logic block MoveDown ---
.routine
Glim_MoveDown:
    ld a,(Cursor + offset(Point, y))
    cp 7
    jr nc,_stop     ; at the bottom edge: stay
```

The first `_stop` is `Glim_MoveUp._stop` and the second
`Glim_MoveDown._stop`: distinct symbols, one spelling, and Debug80's
symbol table shows the qualified names. Every block in the book
names its own `_stop` or `_done` on this rule.
Full treatment: [Source Syntax and
Symbols](../../azm-book/book0/02-source-syntax.md).

## `@` exports in imported modules

Inside an imported source unit, a plain label stays private to that
unit; writing `@` in front of the declaration exports it. The `@`
marks the declaration alone: the symbol's name is the bare
identifier, and every reference writes it without the prefix.

Hand-written modules brought in with `import` shape their whole API
this way. Tetro's collision engine, `tetro-lib.asm`, exports eight
routines and keeps its tables and scratch to itself:

```asm
.routine clobbers A,C,DE,HL,carry,zero,sign,parity,halfCarry
@SetCurPiece:
```

Block bodies in `tetro.glim` reach it by its bare name,
`call SetCurPiece`. The module's private labels (`ClearScoreTbl`,
`CurPiecePtr`) carry no `@` and stay the module's own.
Full treatment: [Source Syntax and
Symbols](../../azm-book/book0/02-source-syntax.md) and [Ops, Aliases
and Source Composition](../../azm-book/book0/07-ops-aliases.md).

## `.routine` register contracts

`.routine` on the line above a label declares that label a routine
and a boundary for register-contract analysis. The clauses on the
same line - `in`, `out`, `clobbers`, `preserves` - are the contract,
and a register the line leaves unmentioned counts as preserved.

A bare `.routine` asks AZM to infer the contract from the body, and
Glimmer emits exactly that above every generated block: your bodies
are analysed as written, with no annotations to maintain. The
profile library declares its contracts in full:

```asm
; Set one pixel. B = x (0-7), C = y (0-7), A = colour bits
; (COLOR_RED/GREEN/BLUE, OR-combined). ORs into the framebuffer.
.routine in A,B,C clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry
FbPlot:
```

The checker proves the contract from both sides. Declared clauses
are checked against the routine's own body, so a `preserves` promise
the body breaks fails the build; and every call site is checked
against the callee's contract, so a caller reusing a clobbered
register fails too. Add an `inc b` after Canvas's `call FbPlot` to
plot a second pixel one column over, and the build stops on the
call:

```text
canvas.glim:112:5: [AZMN_REGISTER_CONTRACTS] error: CALL FbPlot may modify B, but the pre-call value is used later.
```

`B` sits on `FbPlot`'s clobbers line, so the value `inc b` consumes
may be anything; the diagnostic carries the call, the register and
the reason, at the `.glim` line and column you typed. Chapter 11
walks this bug and its fix.
Full treatment: [Register
Contracts](../../azm-book/book0/06-register-contracts.md).

## `.contracts strict`

`.contracts` is a file-level policy line selecting the checking
strength - `strict`, `audit` or `off` - for the whole physical file,
one directive per file.

Glimmer writes the strictest setting near the top of every generated
file, from `tetro.main.asm`:

```asm
; Register contracts are declared with .routine and checked at
; strict strength over this whole generated file.
        .contracts strict
```

Under `strict`, every `call` and executable tail jump must land on a
declared routine, so the entire program - runtime, library, imported
modules and your bodies - passes through the checker on every build.
Full treatment: [Register
Contracts](../../azm-book/book0/06-register-contracts.md).

## Layout types

`.type` opens a record: named fields, each with a size, closed by
`.endtype`. From the record, `sizeof(Name)` and
`offset(Type, field)` are constants the assembler computes, so field
access is written by name and survives the layout growing.

A `type` declaration in a `.glim` file compiles to the record, and a
typed state cell reserves storage sized by it. Canvas's `Point`:

```asm
; --- layout types ---
; AZM owns the type system: sizeof, offset, and layout casts
; work on these names in block bodies.
Point .type
    x             .byte
    y             .byte
.endtype

; --- state storage ---
Cursor:           .ds Point, 0   ; typed state
```

Block bodies apply the functions directly, and each line passes
through to the generated file verbatim:

```asm
    ld a,(Cursor + offset(Point, y))
```

Full treatment: [The Layout
System](../../azm-book/book0/05-layout-system.md) and [Built-in
Functions](../../azm-book/book0/appendix-d-functions.md).

## `.import` source units

`.import` loads another source file as a module: its bytes are
emitted at the import point, its `@` declarations become visible to
the importer, and its plain declarations stay inside. This is the
boundary that gives `@` its meaning.

A Glimmer `import "file.asm"` line becomes exactly this directive,
placed after the runtime, from `tetro.main.asm`:

```asm
; --- imported AZM modules ---
; Import names resolve program-wide; bytes land here, outside
; every execution path. @ labels are the modules' public API.
        .import "tetro-lib.asm"
```

Chapter 12 teaches when a program earns a module; the directive
above is what that decision compiles to.
Full treatment: [Ops, Aliases and Source
Composition](../../azm-book/book0/07-ops-aliases.md).

## `op` definitions

An op is an assembler-owned macro: a named instruction sequence with
typed parameters, expanded inline wherever its name appears in code.
Contract findings inside an expansion attach to the line that
invoked the op, so diagnostics land where you can act.

The profiles generate ops for the moves render bodies repeat:
`sprite_at` and `tile_at` on the TMS9918 display, `lcd_row` wherever
a program declares `text` resources. From `sprite-chase.main.asm`:

```asm
op sprite_at(slot imm8, xcell imm16, ycell imm16)
        ld      a,(xcell)
        ld      d,a
        ld      a,(ycell)
        ld      e,a
        ld      a,slot
        call    SpriteSet
end
```

and a render body invoking it, one line where the shadow-table dance
would otherwise be six:

```asm
; --- render block PlacePlayer ---
.routine
Glim_PlacePlayer:
    sprite_at Player, PlayerX, PlayerY
        ret
```

At assembly, that line becomes the op's body with `Player` (the
slot equate), `PlayerX` and `PlayerY` (cell addresses) substituted.
`tile_at` and `lcd_row` expand the same way: Tetro's pause screen is
one line, `lcd_row MsgPause, LcdRow1`.
Full treatment: [Ops, Aliases and Source
Composition](../../azm-book/book0/07-ops-aliases.md).

## `.equ` and `.enum`

`.equ` binds a name to a constant expression; `.enum` groups related
constants under one name, numbering the members from 0, each
referenced as `Group.Member`. Between them they name nearly every
number in a generated file.

The file opens with `.equ` blocks for the platform: key codes,
ports, colours, LCD rows. From `tetro.main.asm`:

```asm
; --- MON-3 key codes ---
KEY_4             .equ $04
KEY_6             .equ $06
KEY_2             .equ $02
```

Each cell gets a change-flag mask the same way, the `CHG_` names
your `updates` lines compile into, from `canvas.main.asm`:

```asm
CHG_CURSOR        .equ %00000001
CHG_PICTURE       .equ %00000010
```

And a program's `card` declarations become one enum, from
`tetro.main.asm`:

```asm
; --- cards ---
; Exactly one card is active; CurrentCard holds it. Blocks in a
; card's section dispatch only while it is active.
Card              .enum Splash, Playing, Paused, GameOver
```

`Card.Splash` is 0, `Card.Playing` is 1, and the card gates from
chapter 13 compare against exactly these symbols: `cp Card.Playing`.
Full treatment: [Addresses, Constants and
Expressions](../../azm-book/book0/03-addresses-constants-expressions.md).

---

[← Appendix D](appendix-d-build-and-debug.md) | [Book](index.md)
