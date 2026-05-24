---
layout: default
title: "Chapter 9 — Porting, Style, and Reference"
parent: "AZM Assembler Manual"
grand_parent: "AZM Books"
nav_order: 9
---
[← Diagnostics, Listings, and Output](08-diagnostics-listings-output.md) | [Manual](index.md)

# Chapter 9 — Porting, Style, and Reference

This chapter covers three practical aspects of working with AZM: migrating existing Z80 source to AZM step by step with binary verification at each stage, the style conventions used throughout this manual, and a complete worked reference program that applies most of the language surface in one readable example.

---

## Porting Z80 source to AZM

The migration strategy is: assemble first, then improve. Start by getting AZM to produce byte-identical output to your existing assembler. Only then add AZM features. Comparing binaries after each step keeps you honest.

### Step 1 — Get it to assemble

Most ASM80-family source assembles in AZM without changes. Try it:

```sh
azm --type bin --output azm.bin existing.z80
```

If AZM rejects the source, the diagnostics will name the exact line and problem. Common issues:

- **Unknown directive**: `MACRO`, `REPT`, `ENDM` — AZM does not support text macros. Remove or rewrite them.
- **Unsupported expression form**: Some older assembler expressions use forms AZM does not recognize. Replace with equivalent arithmetic.
- **Case issues**: AZM is case-sensitive for labels. Source that redefines `Loop` and `LOOP` as the same label will fail.

For directives that differ only in spelling, load an alias file:

```sh
azm --aliases project.aliases.json existing.z80
```

### Step 2 — Verify byte-identical output

Compare AZM's binary against the reference binary from your old assembler:

```sh
cmp azm.bin reference.bin && echo "PASS"
```

Any difference is a discrepancy to investigate before adding AZM features. The listing helps locate the source of a difference: compare assembly addresses in both listings to find where they diverge.

### Step 3 — Normalize numeric literals

Replace raw hex/binary with standard forms. AZM accepts trailing-`H` and `B` suffixes, so this step is optional but improves readability:

```asm
; Before:
LD A,0FFH
LD B,11110000B

; After (canonical AZM style):
ld   a,$FF
ld   b,%11110000
```

### Step 4 — Replace hard-coded offsets with `.equ`

Find all bare numbers used as record offsets or table strides. Replace them with named constants:

```asm
; Before:
ld   a,(ix+2)     ; flags byte at offset 2

; After:
SPRITE_FLAGS .equ 2
ld   a,(ix+SPRITE_FLAGS)
```

At this point the binary is still identical. You have replaced numbers with names.

### Step 5 — Introduce `.type` declarations for recurring layouts

If the same set of field offsets appears in multiple places, consolidate them into a `.type` block:

```asm
; Before:
ACTOR_X     .equ 0
ACTOR_Y     .equ 1
ACTOR_FLAGS .equ 2
ACTOR_PTR   .equ 3
ACTOR_SIZE  .equ 4

; After:
.type Actor
x       .byte
y       .byte
flags   .byte
ptr     .addr
.endtype

ACTOR_X     .equ offset(Actor, x)
ACTOR_Y     .equ offset(Actor, y)
ACTOR_FLAGS .equ offset(Actor, flags)
ACTOR_PTR   .equ offset(Actor, ptr)
ACTOR_SIZE  .equ sizeof(Actor)
```

The `.equ` lines are now derived from the declaration. Add a field to `Actor` and all the offsets update automatically. Verify binary-identical output after this change.

### Step 6 — Add enums for states and commands

Find groups of related constants that are values of the same conceptual type:

```asm
; Before:
IDLE    .equ 0
MOVING  .equ 1
DEAD    .equ 2

; After:
enum State Idle, Moving, Dead
; References update to State.Idle, State.Moving, State.Dead
```

Grep for all uses of the old names and update them. Verify binary-identical output.

### Step 7 — Add AZMDoc contracts to stable subroutines

Add `@` entry labels and `;!` contract blocks to subroutines that have stable interfaces:

```asm
; Before:
; CHECK_COLLISION: in DE (x,y), out carry, clobbers A
CHECK_COLLISION:

; After:
;!      in        DE
;!      out       carry
;!      clobbers  A
@CHECK_COLLISION:
```

Or let AZM generate the initial contracts:

```sh
azm --contracts --rc audit existing.z80
```

Review the generated blocks and correct any where the inference is wrong (typically around routines with deliberate in/out transformations on the same register).

### Step 8 — Enable register-care checking

Once contracts are in place:

```sh
azm --rc warn existing.z80
```

Review each warning. Decide whether the conflict is a real bug, a deliberate design, or a missing contract. Promote callee outputs where needed (`--accept-out`), save registers where needed, or add caller hints for one-off suppressions.

### Step 9 — Replace repeated idioms with ops

If you have an instruction sequence that appears four or more times and always means the same thing, consider an op:

```asm
; Before (repeated in three places):
ld   c,a
xor  a
sub  c       ; A = 0 - A (negate)

; After:
op negate_a()
  ld   c,a
  xor  a
  sub  c
end
```

Using it:

```asm
        negate_a
```

Binary-compare after each op introduction to confirm the expansion is byte-identical.

### Binary comparison is the safety net

After every step, compare output against the reference binary. If they diverge, you introduced a change. The listing shows where addresses differ. Fix the discrepancy before continuing. Migrating in small steps with binary verification at each step catches mistakes when they are small and easy to isolate.

---

## Style guide for AZM source

These are conventions, not rules AZM enforces. A project that disagrees with any of them will still assemble correctly. The goal is source that reads clearly, ports cleanly, and makes the machine code visible.

### Directive style

Use lowercase dotted directives for new source:

```asm
.org $0100
.equ LIMIT, 64
.db "Hello",0
.ds byte[32]
.include "hardware.asm"
```

The undotted uppercase forms (`ORG`, `EQU`, `DB`, etc.) are accepted for legacy source. Do not mix them in new AZM source — it creates visual noise that makes the distinction between directives and labels harder to see.

### Label naming

Use descriptive names that say what the label represents, not where it is:

```asm
; Prefer:
RING_BUF:
CHECK_COLLISION:
SPRITE_TABLE:

; Avoid:
buf1:
sub3:
table_thing:
```

All-uppercase with underscores is conventional in Z80 source and used throughout this manual. Internal branch labels within a routine body follow the same identifier rules and must be globally unique — prefix them with a routine name to avoid collisions: `DrawLoop`, `DrawDone`, `FindScan`, `FindFound`.

Enum members use the qualified dotted form: `State.Idle`, not `IDLE` standing alone.

### Constants and equates

Every hardware port, ROM address, memory address, and magic number belongs in a `.equ`:

```asm
LCD_PORT   .equ $00
MON_PUTC   .equ $0008
SCREEN_W   .equ 128
MAX_TILES  .equ 256
```

Derived sizes come from other constants or from layout expressions:

```asm
TILE_BYTES  .equ TILE_W * TILE_H
SPRITE_SIZE .equ sizeof(Sprite)
```

Bare numbers in instruction operands (other than 0, 1, and obvious small counters) are a sign that a constant is missing.

### Entry labels

Mark every public subroutine with `@`:

```asm
;!      in        A,HL
;!      out       carry
;!      clobbers  BC
@CHECK_BOUNDS:
```

Use plain labels for data and for internal code that is not called directly from outside:

```asm
JUMP_TABLE:        ; data label — no @
        .dw HANDLER_A, HANDLER_B

CHECK_BOUNDS:      ; also valid for older style; @ preferred for new code
```

The `@` marking tells both you and the register-care analyzer that this is a deliberate call boundary.

### Include file order

A canonical AZM file include order:

1. Hardware definitions (ports, ROM addresses, board-specific constants)
2. Layout declarations (`.type`, `.union`)
3. Enum declarations
4. Op declarations
5. Platform contracts (`.asmi` loaded with `--interface`, or prose contracts inline)
6. Library routines
7. Application code
8. RAM layout (storage blocks at their own `.org`)

Each category belongs in its own file. Application code does not define hardware constants; hardware files do not include application code.

### Layout declarations

Define layouts in a dedicated file included before any code that uses them:

```asm
; layout.asm
.type Sprite
x       .byte
y       .byte
tile    .byte
flags   .byte
ptr     .addr
.endtype
```

Name constants derived from the layout with the type as a prefix:

```asm
SPRITE_X     .equ offset(Sprite, x)
SPRITE_FLAGS .equ offset(Sprite, flags)
SPRITE_SIZE  .equ sizeof(Sprite)
```

### Comments and contracts

Use ordinary `;` comments for human explanation. Use `;!` only for AZMDoc register contracts immediately before entry labels.

```asm
; Copies HL bytes from DE to HL.
; DE = source address, HL = destination, B = byte count.
; BC, DE, HL are modified by this operation.
;!      in        B,DE,HL
;!      out       DE,HL
;!      clobbers  AF
@MEMCOPY:
```

Do not put `;!` lines in the middle of routine bodies — they are contract markers for entry labels only.

### Op naming

Op names should read like instructions, not like function calls. Keep them short and specific:

```asm
op clear_a()          ; not: op zero_accumulator()
op negate_a()         ; not: op negate_accumulator_register()
op load8(dst, val)    ; not: op load_8bit_immediate(destination, value)
```

Ops with a specific register in the name are acceptable when the op is genuinely register-specific.

### Hardware maps in RAM

Put all storage blocks in one section at the end of the source, under their own `.org`:

```asm
; --- RAM layout ---
        .org $8000

RING_BUF:    .ds RING_CAP
RING_STATE:  .ds RingState
FRAME_BUF:   .ds FRAME_W * FRAME_H
SPRITES:     .ds Sprite[MAX_SPRITES]

        .org $8FFE
STACK_TOP:
```

Grouping storage makes it easy to see the total RAM footprint and to verify that areas do not overlap.

### Keep the machine code visible

The organizing principle behind all of these conventions: the machine code should remain visible and reviewable. Named constants let you see what a number means. Layout types let you see what a byte offset represents. AZMDoc lets you see what a subroutine expects and returns. Op expansions show you what code will execute.

When in doubt about whether an abstraction is too much, check whether you can still read the listing and understand every byte.

---

## Complete worked reference program

This section assembles one medium-sized program using most of the language surface from previous chapters — layout types, enums, ops, AZMDoc contracts, entry labels, includes, and all four output artifacts. The program is synthetic but realistic: it manages a small sprite table, initializes it, sets up one sprite, and searches for a tile type.

The full source is spread across six files in a `worked/` directory. Read them in the order they appear in the include chain.

---

### Project layout

```
worked/
  main.asm      — entry, include chain, assembly origin, test sequence, RAM layout
  hardware.asm  — platform constants
  layout.asm    — Sprite record declaration
  enums.asm     — Tile and Flags enum groups
  ops.asm       — op declarations
  sprites.asm   — sprite management routines with entry labels and contracts
```

`main.asm` includes everything. Each included file handles one category: constants, layout, enums, ops, or subroutines. Nothing includes anything else. This keeps the dependency graph flat and avoids include cycles.

---

### hardware.asm

```asm
; hardware.asm
HALT_ADDR   .equ $0000    ; or board-specific
```

A single constant, standing in for the hardware constants file that any real project would have — port addresses, ROM entry points, board geometry. Keeping these in their own file means porting to a different board is a single-file edit.

---

### layout.asm

```asm
; layout.asm
.type Sprite
x       .byte
y       .byte
tile    .byte
flags   .byte
.endtype

SPRITE_X     .equ offset(Sprite, x)
SPRITE_Y     .equ offset(Sprite, y)
SPRITE_TILE  .equ offset(Sprite, tile)
SPRITE_FLAGS .equ offset(Sprite, flags)
SPRITE_SIZE  .equ sizeof(Sprite)
```

The `.type` block gives `Sprite` four fields totalling four bytes. The five `.equ` lines derive the offset and size constants from the declaration. When you add a field — say, a velocity byte between `tile` and `flags` — all five constants update automatically on the next assembly.

`SPRITE_SIZE` is `sizeof(Sprite)` = 4. Every address calculation that steps through the sprite table multiplies by this constant. Changing the layout changes the stride everywhere.

---

### enums.asm

```asm
; enums.asm
enum Tile Empty, Wall, Player, Enemy, Pill
enum Flags Alive, Dead
```

Two enum groups. `Tile.Player` is the integer 2; `Flags.Alive` is 0. Code that loads a tile type into A writes `ld a,Tile.Player`, not `ld a,2`. If the order of the enum changes — inserting a new tile kind before `Player` — the name continues to resolve correctly and nothing else in the source changes.

Unqualified references like `Player` produce an error. This is intentional: any project of real size will have enough constants that bare names become ambiguous.

---

### ops.asm

```asm
; ops.asm
op clear_a()
  xor  a
end

op set_hl_zero()
  ld   hl,0
end
```

Two utility ops. `clear_a` expands to `xor a` — it zeros A and sets the zero flag. `set_hl_zero` expands to `ld hl,0`. Neither of these is a subroutine: there is no `call` instruction, no return address, no stack effect. The expansion appears verbatim at every call site and is visible in the listing.

These are deliberately small. An op earns its existence when the idiom appears four or more times and is short enough that the call overhead of a subroutine would be significant. `clear_a` appears in initialization code, interrupt handlers, and loop resets — often enough to name.

---

### sprites.asm

```asm
; sprites.asm

MAX_SPRITES .equ 8
```

The sprite count belongs here, alongside the routines that use it. It is a constant, not a label — it emits nothing, it names the number.

```asm
; Zero-initialise the sprite table. B = sprite count, IX = table base.
;!      in        B,IX
;!      clobbers  A,BC,DE
@SPRITES_INIT:
        ld   de,SPRITE_SIZE
        ld   a,0
SpriteInitLoop:
        ld   (ix+SPRITE_X),a
        ld   (ix+SPRITE_Y),a
        ld   (ix+SPRITE_TILE),a
        ld   (ix+SPRITE_FLAGS),a
        add  ix,de
        djnz SpriteInitLoop
        ret
```

`SPRITES_INIT` walks the sprite table through IX, zeroing four fields per sprite, then advancing IX by `SPRITE_SIZE` bytes. It uses `DJNZ` with B as the counter.

The AZMDoc contract above the entry label says: this routine reads B and IX on entry, and clobbers A, BC, and DE. `add ix,de` writes DE into IX — so DE is consumed. B counts down to zero through DJNZ, so BC is clobbered. A is used as the fill byte. That matches what the code does.

The `@` prefix on the label marks `SPRITES_INIT` as an explicit routine boundary for register-care analysis. Callers write `call SPRITES_INIT`, not `call @SPRITES_INIT`.

`SpriteInitLoop` is an internal branch target inside the `SPRITES_INIT` body. Because `@SPRITES_INIT:` is present, register-care analysis sees the full body as one span: the entry through DJNZ and the return. `SpriteInitLoop` is not treated as a new routine boundary.

```asm
; Find first sprite with tile T. A = tile to find, IX = table base.
; Returns carry set and IX pointing to found sprite, or carry clear if none.
;!      in        A,IX
;!      out       carry,IX
;!      clobbers  A,BC
@SPRITES_FIND_TILE:
        ld   b,MAX_SPRITES
SpriteFindLoop:
        ld   c,(ix+SPRITE_TILE)
        cp   c
        jr   z,SpriteFindFound
        ld   de,SPRITE_SIZE
        add  ix,de
        djnz SpriteFindLoop
        or   a            ; carry clear = not found
        ret
SpriteFindFound:
        scf               ; carry set = found
        ret
```

`SPRITES_FIND_TILE` takes the tile value in A and a table base in IX. It walks the table, comparing each sprite's tile field against A. On a match, it sets carry and returns with IX pointing to the found sprite. On exhaustion, it clears carry via `or a`.

The contract lists `carry` and `IX` as outputs — both carry meaningful return values. A is listed as a clobber: the loop loads `c,(ix+SPRITE_TILE)` and uses `cp c`, which writes flags from A. B counts down and is gone on return.

Two things worth noting in the search loop. `ld de,SPRITE_SIZE` is inside the loop because DE is needed to advance IX — it could be hoisted before `.search` for efficiency if B were tracked differently. As written, it is clear and correct. Second, `add ix,de` corrupts DE after adding it to IX, which is why DE appears implicitly clobbered (BC as written in the contract covers B; the DE destruction comes from `add ix,de` — both BC and DE end up modified, which is why the clobbers list covers them).

---

### main.asm

```asm
; main.asm

        .include "hardware.asm"
        .include "layout.asm"
        .include "enums.asm"
        .include "ops.asm"
        .include "sprites.asm"
```

The include chain runs top-to-bottom. Hardware constants arrive first, then the layout declaration, then enum groups, then op definitions, then the subroutines that use all of the above. The test code in `@main` follows. This order ensures every name is defined before any code references it.

```asm
        .org $0100

@main:
        ; Initialise table
        ld   ix,SPRITE_TABLE
        ld   b,MAX_SPRITES
        call SPRITES_INIT
```

`@main` is the program entry. IX receives the table base address; B receives the count. Then `SPRITES_INIT` zeroes the table. After the call, IX has been advanced past the end of the table — SPRITES_INIT consumed it. To work with specific sprites after initialization, load IX from the table base again.

```asm
        ; Set up sprite 2 as a player tile
        ld   ix,<Sprite[MAX_SPRITES]>SPRITE_TABLE[2]
        ld   (ix+SPRITE_X),$10
        ld   (ix+SPRITE_Y),$08
        ld   (ix+SPRITE_TILE),Tile.Player
        ld   (ix+SPRITE_FLAGS),Flags.Alive
```

The layout cast `<Sprite[MAX_SPRITES]>SPRITE_TABLE[2]` computes `SPRITE_TABLE + 2 * sizeof(Sprite)` at assemble time. Since `sizeof(Sprite)` is 4, that is `SPRITE_TABLE + 8`. AZM folds this to a constant and emits `ld ix,SPRITE_TABLE+8` — the listing shows the resolved address.

The four field writes use IX-relative addressing with the offset constants. `Tile.Player` is the enum value 2. `Flags.Alive` is 0. Both are immediate byte constants in the emitted instruction. The listing shows the numeric values alongside the symbolic names.

```asm
        ; Find the player sprite
        ld   ix,SPRITE_TABLE
        ld   a,Tile.Player
        call SPRITES_FIND_TILE
        jr   nc,not_found
        ld   (found_at),ix

not_found:
        halt
```

IX is reset to the table base. A is loaded with `Tile.Player` (2). The search returns carry set and IX pointing to sprite 2 if found. The carry check branches to `not_found` on failure. On success, IX — the address of the matching sprite — is stored in `found_at`.

After the halt, inspecting `found_at` in memory should show the address of sprite 2 in the table. That is the observable result of the program.

```asm
; --- RAM ---

        .org $8000

SPRITE_TABLE:
        .ds Sprite[MAX_SPRITES]

found_at:
        .ds addr
```

The RAM layout follows the code under a separate `.org`. `SPRITE_TABLE` reserves `sizeof(Sprite) * 8` = 32 bytes. `found_at` reserves 2 bytes (an address).

Placing storage at the end under its own `.org` keeps it visually separate from code and makes the total RAM footprint easy to read. The `.ds` expressions document what the storage holds — `Sprite[MAX_SPRITES]` says "eight sprites," `addr` says "one address" — without requiring any arithmetic.

---

### Building the program

```sh
# Standard build (produces .hex, .bin, .lst, .d8.json):
azm --type bin --output worked.bin main.asm

# With register-care checking:
azm --rc warn --output worked.bin main.asm

# Full artifacts for Debug80:
azm --source-root . --output worked.hex main.asm
```

The `--rc warn` run will produce warnings if any call site puts a live register at risk across a call. With the contracts written as shown, the expected result is zero warnings: `SPRITES_INIT` and `SPRITES_FIND_TILE` both document their clobbers, and `@main` has no conflicting use after the calls.

---

### Reading the listing

The listing verifies several things at once:

**Layout constants:**

```
                  SPRITE_SIZE  .equ 4
                  SPRITE_FLAGS .equ 3
```

Both appear as zero-byte entries (no emitted code) with their computed values. Confirm they match the `.type` declaration.

**Enum values:**

The `ld (ix+SPRITE_TILE),Tile.Player` instruction appears in the listing as:

```
0120 DD 36 02 02         ld   (ix+SPRITE_TILE),Tile.Player
```

Byte `$02` at offset 3 is the `ix+` offset (SPRITE_TILE = 2, not 3 — verify against SPRITE_TILE in the listing). Byte `$02` at offset 4 is the immediate value `Tile.Player` = 2. Both resolve correctly.

**Layout cast:**

```
010A DD 21 08 80         ld   ix,<Sprite[MAX_SPRITES]>SPRITE_TABLE[2]
```

The address `$8008` = `$8000 + 8` = `SPRITE_TABLE + 2 * SPRITE_SIZE`. The cast folded to the correct constant.

**RAM addresses:**

```
8000              SPRITE_TABLE:
8020              found_at:
```

`SPRITE_TABLE` at `$8000`, `found_at` at `$8000 + 32` = `$8020`. Eight sprites × four bytes each = 32 bytes. Confirmed.

---

### What this program demonstrates

| Feature | Location |
|---------|----------|
| `.type` record layout | `layout.asm` |
| `sizeof`, `offset` field constants | `layout.asm` |
| `enum` with qualified names | `enums.asm`, `main.asm` |
| `op` declarations and inline expansion | `ops.asm` |
| `@` entry labels and `;!` AZMDoc contracts | `sprites.asm` |
| `.include` chain | `main.asm` |
| Layout-cast constant address | `main.asm` |
| Register-care checking (`--rc warn`) | CLI |
| RAM layout under its own `.org` | `main.asm` |
| Listing verification of all of the above | `.lst` |

Every chapter in this manual appears in one of those rows. The program uses none of these features as decoration — each one solves a specific problem: the layout type removes fragile offset arithmetic; the enums remove magic numbers; the contracts prevent call-site register bugs; the layout cast replaces a multiplication you would otherwise write by hand. The listing confirms all of it in one readable document.

---

[← Diagnostics, Listings, and Output](08-diagnostics-listings-output.md) | [Manual](index.md)
