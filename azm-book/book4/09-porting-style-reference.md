---
layout: default
title: "Chapter 9 — Porting, Style, and Reference"
parent: "AZM Book 4 — Assembler Manual"
grand_parent: "AZM Books"
nav_order: 9
---
[← Diagnostics, Listings, and Output](08-diagnostics-listings-output.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)

# Chapter 9 — Porting, Style, and Reference

This chapter is about using AZM on real projects. The first section covers migrating existing Z80 source to AZM — a process that moves from "can it assemble at all?" to "does it produce identical bytes?" to "how do I adopt the features that make the source better?" The second covers the style conventions that make AZM source consistent and readable. The third is a worked reference program: a small but complete example that uses most of what the manual covered, in one place you can read all at once.

---

## Porting Z80 source to AZM

The migration strategy is: assemble first, then improve. Start by getting AZM to produce byte-identical output to your existing assembler. Only then add AZM features. Comparing binaries after each step catches unintended changes while they are still small.

The steps below are ordered by risk. Steps 1 and 2 establish that AZM can assemble the source correctly without changing the binary. Steps 3 through 9 each add one AZM feature, and each one ends with a binary comparison. If the comparison fails, you know exactly which step introduced the discrepancy.

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

From here the work changes character. Step 5 introduces declarations that derive offsets from the layout automatically; step 7 adds contracts that commit to how registers flow between routines; step 8 may surface call sites that have been relying on register values surviving by accident. Each step still ends with a binary comparison, but by step 8 you will have a list of register-care conflicts — and resolving them one by one is where you learn which routines were quietly depending on values that only survived by chance.

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

Steps 6 through 8 each add a feature that improves the source without changing the binary, except for step 8 which may surface bugs as register-care warnings.

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

Grep for all uses of the old names and update them.

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

After every step, compare output against the reference binary. If they diverge, you introduced a change. Fix the discrepancy before continuing. Migrating in small steps with binary verification at each step catches mistakes when they are small and easy to isolate.

The listing is a valuable companion to binary comparison. When two binaries differ, the listing shows where addresses diverge — often a single wrong offset or a label that resolved differently. Comparing the two listings side by side is usually faster than reading raw bytes from a hex dump.

---

## Style guide for AZM source

These are conventions, not language rules — the assembler does not enforce them. They collect the choices used throughout this manual so a project can stay consistent and keep listings readable.

| Area | Convention |
|------|------------|
| Directives | Use lowercase dotted forms: `.org`, `.equ`, `.db`, `.dw`, `.ds`, `.include` |
| Labels | Use descriptive names; keep branch labels globally unique, often by prefixing them with the routine name |
| Constants | Put hardware ports, ROM addresses, memory addresses, and repeated numeric meanings in `.equ` |
| Enums | Use qualified enum names such as `State.Idle` instead of bare member names |
| Public routines | Mark callable routine boundaries with `@` and put AZMDoc contracts immediately above them |
| Layouts | Keep `.type` and `.union` declarations in a shared file included before code that uses them |
| Ops | Name ops like instruction idioms: `clear_a`, `negate_a`, `load8` |
| RAM layout | Group storage blocks under a dedicated `.org` near the end of the program |

A typical include order is:

1. Hardware definitions (ports, ROM addresses, board-specific constants)
2. Layout declarations (`.type`, `.union`)
3. Enum declarations
4. Op declarations
5. Platform contracts (`.asmi` loaded with `--interface`, or prose contracts inline)
6. Library routines
7. Application code
8. RAM layout (storage blocks at their own `.org`)

Each category belongs in its own file. Application code should not define hardware constants; hardware files should not include application code. The organizing test is the listing: after all naming, layout, contract, and op choices, you should still be able to open the listing and understand what the CPU will execute without needing to hold anything in your head that is not on the page.

The underlying reason this consistency matters more in assembly than in most other languages is that the assembler enforces none of it. No type checker rejects a wrong field offset. No linter flags an inconsistent naming convention. No compiler error tells you when a routine receives the wrong value in a register. Convention is the only enforcement mechanism — and when it is applied consistently across a project, it is because the code has no other way to stay auditable as it grows.

---

## Complete worked reference program

This compact program shows the whole manual surface in one place: includes, constants, layout, enums, ops, contracts, entry labels, RAM storage, and listing verification. It manages a small sprite table, initializes it, sets up one sprite, and searches for a tile type.

The program is not here to demonstrate Z80 technique — it is deliberately small. Its purpose is to show all the manual's features working together in one readable source, so you can see how the pieces compose and verify that nothing in the preceding chapters was described in isolation from how it actually fits.

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

`main.asm` includes everything. The included files do not include each other.

---

### hardware.asm

```asm
; hardware.asm
HALT_ADDR   .equ $0000    ; or board-specific
```

A real hardware file would hold port addresses, ROM entry points, and board geometry.

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

The derived constants are the only field offsets used by the routines below.

---

### enums.asm

```asm
; enums.asm
enum Tile Empty, Wall, Player, Enemy, Pill
enum Flags Alive, Dead
```

The code below uses `Tile.Player` and `Flags.Alive` instead of raw bytes.

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

These ops are deliberately small; their expansions remain visible in the listing.

---

### sprites.asm

```asm
; sprites.asm

MAX_SPRITES .equ 8
```

The sprite count sits with the routines that use it.

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

`SPRITES_INIT` zeros each sprite and advances IX by `SPRITE_SIZE`. Its contract records the incoming registers and clobbers.

```asm
; Find first sprite with tile T. A = tile to find, IX = table base.
; Returns carry set and IX pointing to found sprite, or carry clear if none.
;!      in        A,IX
;!      out       carry,IX
;!      clobbers  BC,DE
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

`SPRITES_FIND_TILE` returns carry set and IX pointing at the matching sprite. On failure, it clears carry.

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

The include chain follows the style order above.

```asm
        .org $0100

@main:
        ; Initialise table
        ld   ix,SPRITE_TABLE
        ld   b,MAX_SPRITES
        call SPRITES_INIT
```

After `SPRITES_INIT`, IX has been advanced past the table, so `@main` reloads IX before writing sprite 2.

```asm
        ; Set up sprite 2 as a player tile
        ld   ix,<Sprite[8]>SPRITE_TABLE[2]
        ld   (ix+SPRITE_X),$10
        ld   (ix+SPRITE_Y),$08
        ld   (ix+SPRITE_TILE),Tile.Player
        ld   (ix+SPRITE_FLAGS),Flags.Alive
```

The layout cast computes the address of sprite 2 at assemble time. The field writes use the derived offsets.

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

On success, `found_at` receives the address of sprite 2.

```asm
; --- RAM ---

        .org $8000

SPRITE_TABLE:
        .ds Sprite[8]

found_at:
        .ds addr
```

The RAM layout follows the code under a separate `.org`.

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

The `--rc warn` run should produce no register-care warnings for this source.

---

### Reading the listing

The listing verifies several things at once:

**Layout constants:**

```
                  SPRITE_SIZE  .equ 4
                  SPRITE_FLAGS .equ 3
```

Confirm they match the `.type` declaration.

**Enum values:**

The `ld (ix+SPRITE_TILE),Tile.Player` instruction should show both the field offset and the enum value:

```
0120 DD 36 02 02         ld   (ix+SPRITE_TILE),Tile.Player
```

Here the first `$02` is the `ix+` offset and the second is `Tile.Player`.

**Layout cast:**

```
010A DD 21 08 80         ld   ix,<Sprite[8]>SPRITE_TABLE[2]
```

The address `$8008` is `SPRITE_TABLE + 2 * SPRITE_SIZE`.

**RAM addresses:**

```
8000              SPRITE_TABLE:
8020              found_at:
```

Eight sprites at four bytes each place `found_at` at `$8020`.

---

### What does this program demonstrate?

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

The point of the example is not to introduce new rules. It is a final check that the rules compose without hiding the emitted machine code.

---

[← Diagnostics, Listings, and Output](08-diagnostics-listings-output.md) | [Manual](index.md) | [Appendix A — Directive Reference →](appendix-a-directives.md)
