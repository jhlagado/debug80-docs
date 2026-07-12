---
layout: default
title: "Appendix C - The TMS9918 Profile"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 21
---

[← Appendix B](appendix-b-matrix-profile.md) | [Book](index.md) | [Appendix D →](appendix-d-build-and-debug.md)

# Appendix C - The TMS9918 Profile

Everything `platform tec1g-mon3` with `display tms9918` contributes
to a generated program: the commit-shaped loop, the VRAM map behind
the two ports, the shadow tables render blocks write, the sprite and
tile resources with their generated ops, and the library routines
with their register contracts. Every listing and value here is copied
from a program built with `glimmer build`; the register interfaces
are the `.routine` lines the assembler checks at strict strength.

## The loop

```asm
; --- runtime loop ---
Start:
        call    VdpInit
        call    LoadResourcesVram
MainLoop:
        call    VdpWaitVBlank        ; pace on the status-register flag
        call    GlimCommit           ; flush shadows in the blank window
        call    GlimPollBindings
        ld      a,(CurrentCard)    ; latch: card transitions land at
        ld      (GlimActiveCard),a  ; frame start, never mid-frame
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

- The VDP renders autonomously from its own VRAM; the loop paces on
  the vblank status flag. `VdpWaitVBlank` spins until the flag rises,
  and reading the status register clears it for the next frame.
- `GlimCommit` streams changed shadow tables to VRAM immediately
  after vblank, inside the blank window. Render blocks write ordinary
  memory this frame; the top of the next frame publishes it.
- `LoadResourcesVram` appears when the program declares a sprite or a
  tile; it uploads patterns and colours once, after `VdpInit`.

## Ports and the VRAM map

| Equate | Value | Meaning |
|--------|-------|---------|
| `VDP_DATA` | `$BE` | data port: reads and writes VRAM at the auto-incrementing address |
| `VDP_CONTROL` | `$BF` | control port: address setup, register writes, status reads |
| `VRAM_PATTERN` | `$0000` | tile pattern table, 8 bytes per tile |
| `VRAM_NAME` | `$0800` | name table, 32x24 tile indexes |
| `VRAM_SPRITE_ATTR` | `$1B00` | sprite attributes, 4 bytes per slot |
| `VRAM_COLOR` | `$2000` | colour table, one byte per pattern group |
| `VRAM_SPRITE_PAT` | `$3800` | sprite pattern table, 8 bytes per sprite |

`VdpSetAddrWrite` sends the low byte, then the high byte OR `$40`,
through the control port; every byte written to `VDP_DATA` after that
lands at the next VRAM address. The register init table wires this
Graphics I layout into the VDP:

```asm
; --- VDP register init (value, then index|$80, via the control port) ---
VdpRegInitTbl:
        .db     $00, $C0, $02, $80, $00, $36, $07, $01
        ; Graphics I; display on, 16K; name $0800; colour $2000;
        ; pattern $0000; sprite attrs $1B00; sprite patterns $3800;
        ; backdrop black
```

## Colours

| Name | Value | Name | Value |
|------|-------|------|-------|
| `VC_TRANSPARENT` | `0` | `VC_MEDRED` | `8` |
| `VC_BLACK` | `1` | `VC_LIGHTRED` | `9` |
| `VC_MEDGREEN` | `2` | `VC_DARKYELLOW` | `10` |
| `VC_LIGHTGREEN` | `3` | `VC_LIGHTYELLOW` | `11` |
| `VC_DARKBLUE` | `4` | `VC_DARKGREEN` | `12` |
| `VC_LIGHTBLUE` | `5` | `VC_MAGENTA` | `13` |
| `VC_DARKRED` | `6` | `VC_GRAY` | `14` |
| `VC_CYAN` | `7` | `VC_WHITE` | `15` |

A colour is one of fifteen fixed codes plus transparent. Sprites
carry one colour each; tiles carry a foreground and background pair
packed as `fg * 16 + bg` in the colour table.

## Shadows

```asm
NameShadow:       .ds 768, 0       ; 32x24 name table shadow
NameDirtyRows:    .db 0, 0, 0      ; 24 dirty-row bits
SpriteShadow:     .ds 128, 0       ; 32 x (y, x, pattern, colour)
SpriteDirty:      .db 0
```

- `NameShadow` mirrors the name table: `row * 32 + column` holds the
  tile index at that cell. `NamePut` writes it and sets the row's bit
  in `NameDirtyRows`, three bytes covering rows 0-23.
- `SpriteShadow` mirrors the sprite attribute table, four bytes per
  slot in VDP order: y, x, pattern, colour. Any write through
  `SpriteSet` or `SpriteInit` sets `SpriteDirty`.
- `GlimCommit` reads both markers at frame start. A set `SpriteDirty`
  streams all 128 shadow bytes to `VRAM_SPRITE_ATTR`; each set row
  bit sends one 32-byte row through `CommitNameRow`. A frame with
  clean shadows costs a few flag tests.

## Sprites

```text
sprite Dot color white
  "..XXXX.."
  ".XXXXXX."
  ...
end
```

- Declaration order is the sprite's slot and its pattern number:
  the first `sprite` is slot 0, the second slot 1. Slots stay
  contiguous from 0 because the VDP stops processing sprites at the
  first slot whose Y is `$D1`; `VdpInit` writes `$D1` into all 32
  shadow slots, so undeclared slots stay hidden and terminate the
  scan.
- Each declaration compiles to 8 pattern bytes in `GlimSpritePats`
  and a name equate. `LoadResourcesVram` uploads the patterns to
  `VRAM_SPRITE_PAT` in one block, then calls `SpriteInit` per slot to
  set its pattern and colour in the shadow.

```asm
GlimSpritePats:
        .db     %00111100
        .db     %01111110
        ...
Dot               .equ 0   ; sprite slot + pattern
```

## Tiles

```text
tile Brick color lightred on black
  "XXXXXXXX"
  "X......X"
  ...
end
```

Graphics I colours patterns in groups of eight: one colour-table byte
covers pattern indexes `g*8` to `g*8+7`. Tile indexes follow from
that constraint.

- Tiles sharing a (fg, bg) pair share a group. Tile index 0 stays the
  blank tile, so the first pair fills group 0 from index 1 and holds
  seven tiles; later groups hold eight. A pair whose group is full
  spills into a new group.
- The first pair's background is the screen background: empty name
  table cells show tile 0, which lives in group 0 and takes its
  colours from the first pair. `VdpInit` fills the colour table with
  `$F1` (white on black) before `LoadResourcesVram` writes the
  declared pairs.
- The colour table holds 32 groups. A program that needs more raises
  a build diagnostic naming the count; reuse (fg, bg) pairs to bring
  it down.

```asm
GlimTilePats:
; tile Brick -> index 1
        .db     %11111111
        .db     %10000001
        ...
Brick             .equ 1   ; tile index
```

## The ops

A sprite or tile declaration also generates assembler ops; block bodies
invoke them as ordinary statements and they expand inline.

```asm
op sprite_at(slot imm8, xcell imm16, ycell imm16)
        ld      a,(xcell)
        ld      d,a
        ld      a,(ycell)
        ld      e,a
        ld      a,slot
        call    SpriteSet
end

op tile_at(tile imm8, col imm8, row imm8)
        ld      a,tile
        ld      d,col
        ld      e,row
        call    NamePut
end
```

`sprite_at Player, PlayerX, PlayerY` reads the two byte cells and
positions the slot; the cell names assemble as addresses. `tile_at`
takes immediates, so a computed position loads A, D, E itself and
calls `NamePut` directly, the way Sprite Chase draws its score pips.

## Library routines

Each entry's `.routine` contract is copied from the generated file.
`LoadResourcesVram` and the ops appear when the program declares a
sprite or a tile.

| Routine | Contract |
|---------|----------|
| `VdpInit` | `clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `VdpSetAddrWrite` | `in HL clobbers A,carry,zero,sign,parity,halfCarry` |
| `VdpWriteBlock` | `in HL,BC clobbers A,BC,HL,carry,zero,sign,parity,halfCarry` |
| `VdpFill` | `in HL,BC,E clobbers A,BC,carry,zero,sign,parity,halfCarry` |
| `VdpWaitVBlank` | `clobbers A,carry,zero,sign,parity,halfCarry` |
| `SpriteSet` | `in A,D,E clobbers A,HL,carry,zero,sign,parity,halfCarry` |
| `SpriteInit` | `in A,D,E clobbers A,HL,carry,zero,sign,parity,halfCarry` |
| `NamePut` | `in A,D,E clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `CommitNameRow` | `in A clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `GlimCommit` | `clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `LoadResourcesVram` | `clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |

- `VdpInit` writes the eight registers from `VdpRegInitTbl`, fills
  the colour table with `$F1`, clears the pattern table (2048 bytes)
  and the name table (768 bytes), and hides all 32 sprites in the
  shadow. The loop calls it once before `MainLoop`.
- `VdpSetAddrWrite` sets the VRAM write address in HL.
  `VdpWriteBlock` then streams BC bytes from HL through the data
  port. `VdpFill` sets the address itself and writes BC copies of E.
- `VdpWaitVBlank` spins on bit 7 of the status register. The loop
  owns this call; blocks leave the VDP's timing alone.
- `SpriteSet` positions slot A at D = x, E = y in the shadow.
  `SpriteInit` assigns slot A its pattern D and colour E; the
  generated `LoadResourcesVram` calls it once per declared slot.
- `NamePut` puts tile A at column D, row E of the name-table shadow
  and marks the row. `CommitNameRow` flushes one shadow row (A =
  0-23) to VRAM; `GlimCommit` calls it per marked row.
- Pattern and colour uploads beyond the declared resources are
  one-time init work: call the `Vdp*` routines from an `enter` block,
  with the tables in an imported assembly module.

The LCD slice, its `Api*ToLcd` equates, `text` string data, and the
`lcd_row` op are board hardware shared with the matrix profile;
Appendix B documents them, and a `tms9918` build emits the same
lines.

---

[← Appendix B](appendix-b-matrix-profile.md) | [Book](index.md) | [Appendix D →](appendix-d-build-and-debug.md)
