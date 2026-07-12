---
layout: default
title: "Appendix B - The Matrix Profile"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 20
---

[Book](index.md)

# Appendix B - The Matrix Profile

Everything `platform tec1g-mon3` with `display matrix8x8` contributes
to a generated program: the scan-shaped loop, the framebuffer, the
colour and key equates, the library routines with their register
contracts, and the sound, HUD, and LCD services. Every listing and
value here is copied from a program built with `glimmer build`; the
register interfaces are the `.routine` lines AZM checks at strict
strength.

## The loop

```asm
; --- runtime loop ---
Start:
        call    FbClear
        call    HudBlankDig
MainLoop:
        call    ScanFrame            ; show one full frame, then blank
        call    GlimPollBindings     ; game work runs in the blank window
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

- `ScanFrame` lights all eight rows with a fixed dwell, services sound
  and the HUD once per row, and returns with the matrix blank. Every
  phase after it runs in the blank window, so block work never changes
  visible brightness.
- `GlimPollBindings` reads the keypad through MON-3 `_scanKeys` and
  raises bound pulses; the phase dispatchers then test change flags
  and call your blocks.

## Platform equates

| Equate | Value | Meaning |
|--------|-------|---------|
| `ApiScanKeys` | `16` | MON-3 keypad call number for `rst $10` |
| `ApiRandom` | `49` | A = random byte, destroys B |
| `PortDigits` | `$01` | HUD digit select; the speaker shares this port |
| `PortSegs` | `$02` | HUD segment data |
| `PortRow` | `$05` | matrix row select, one bit per row |
| `PortRed` | `$06` | red plane column data |
| `PortGreen` | `$F8` | green plane column data |
| `PortBlue` | `$F9` | blue plane column data |
| `SpeakerBit` | `$80` | speaker bit within `PortDigits` |
| `ScanDwellPeriod` | `255` | `djnz` count per lit row |

## Framebuffer

```asm
Framebuffer:      .ds 32           ; 8 rows x R,G,B,aux
```

| Offset | Byte |
|--------|------|
| `y*4 + 0` | red plane, one bit per column |
| `y*4 + 1` | green plane |
| `y*4 + 2` | blue plane |
| `y*4 + 3` | aux, skipped by the scanner |

- Bit 7 is column 0, the leftmost; bit 0 is column 7. `MxMask`
  converts an x coordinate to this convention.
- The aux byte pads each row to four bytes, so a row's address is
  `Framebuffer + y * 4`: two `add a,a` instructions.
- The scanner reads the framebuffer every frame. Whatever renders
  leave there is the picture.

## Colours

| Name | Value | Planes |
|------|-------|--------|
| `COLOR_RED` | `$01` | red |
| `COLOR_GREEN` | `$02` | green |
| `COLOR_BLUE` | `$04` | blue |
| `COLOR_YELLOW` | `$03` | red + green |
| `COLOR_CYAN` | `$06` | green + blue |
| `COLOR_MAGENTA` | `$05` | red + blue |
| `COLOR_WHITE` | `$07` | all three |

A colour is a set of planes; the generated file defines the
composites as sums (`COLOR_YELLOW .equ COLOR_RED + COLOR_GREEN`).
`FbPlot` ORs the pixel into each plane whose bit is set, so
overlapping plots mix: red over green reads back yellow.

## MON-3 keys

| Key | Code |
|-----|------|
| `KEY_0` .. `KEY_F` | `$00` .. `$0F` |
| `KEY_PLUS` | `$10` |
| `KEY_MINUS` | `$11` |
| `KEY_GO` | `$12` |
| `KEY_AD` | `$13` |

- `rising` fires on the frame the key is first pressed; `held period
  N` fires on the first press, then every N frames while the key
  stays down; `any` fires on every new press, alongside any named
  binding the same press matches.
- The generated file emits a key-code equate for each key a binding
  uses. Held bindings add two scratch cells, `Glim_HeldKey` (`$FF`
  when disarmed) and `Glim_HeldCount`.
- `_scanKeys` returns Z when a key is down with its code in A, and
  carry when the press is new. The generated poller keeps the code in
  B across compares; its comment records that DE is unsafe across the
  call on a matrix keyboard.

## Library routines

Each entry's `.routine` contract is copied from the generated file.
`ShapeDraw` and its scratch cells appear when the program declares a
plain shape; `Snd_<Name>` wrappers appear per sound cue.

| Routine | Contract |
|---------|----------|
| `ScanFrame` | `clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `FbClear` | `clobbers A,B,HL,carry,zero,sign,parity,halfCarry` |
| `FbPlot` | `in A,B,C clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry` |
| `MxMask` | `in A out A clobbers B,carry,zero,sign,parity,halfCarry` |
| `ShapeDraw` | `in B,C,HL clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry` |
| `SndStart` | `in A,C clobbers A,carry,zero,sign,parity,halfCarry` |
| `Snd_<Name>` | bare `.routine`; AZM infers the contract from the body |
| `HudWriteU16` | `in HL out BC,HL clobbers A,DE,carry,zero,sign,parity,halfCarry` |
| `HudBlankDig` | `clobbers A,B,HL,carry,zero,sign,parity,halfCarry` |

- `ScanFrame` scans the whole matrix, then blanks it. The loop calls
  it at frame start; blocks leave it alone.
- `FbClear` zeroes all 32 framebuffer bytes.
- `FbPlot` sets one pixel: B = x (0-7), C = y (0-7), A = colour bits,
  OR-combined. It ORs into the framebuffer; C survives the call.
- `MxMask` converts x in A (0 = leftmost) to the matrix bit
  convention, `%10000000` for column 0.
- `ShapeDraw` draws a plain shape: HL = `Shape_<Name>`, B = x, C = y.
  It plots with no clipping, so keep the whole shape inside the 8x8
  matrix.
- `SndStart` (re)starts a cue: A = duration in row ticks, C = divider
  half-period. `Snd_<Name>` loads both from the declaration and jumps
  into it.
- `HudWriteU16` encodes HL as decimal into the HUD digits.
  `HudBlankDig` zeroes all six.

Three service routines run inside the scanner and the HUD encoder:
`SndService` and `HudScanDig` are called once per row by `ScanFrame`,
and `HudDecDigit` is called five times by `HudWriteU16`. Their
contracts sit in the generated file beside the ones above.

## Sound service

| Cell | Purpose |
|------|---------|
| `SpeakerPort:` `.db 0` | shadow of the speaker bit written to `PortDigits` |
| `SoundTimer:` `.db 0` | remaining row ticks; 0 is silence |
| `SndDivReload:` `.db 0` | divider half-period |
| `SndDivCount:` `.db 0` | countdown to the next speaker toggle |

- The time unit is the row tick: `ScanFrame` calls `SndService` once
  per row, 8 ticks per frame, so `len 16` sounds for about two frames.
- One cue is active at a time. Starting a cue replaces the current
  one.
- `div` is the toggle half-period in row ticks; smaller values are
  higher pitch. The speaker bit (`SpeakerBit`, `$80`) rides on
  `PortDigits`, and `HudScanDig` preserves it in every digit strobe.

Each `sound` declaration compiles to a wrapper. `sound Click len 2
div 10` generates:

```asm
.routine
Snd_Click:
        ld      a,2
        ld      c,10
        jp      SndStart
```

`call Snd_Click` from any block starts the cue without blocking.

## HUD service

| Cell | Purpose |
|------|---------|
| `HudScanIndex:` `.db 0` | next digit to strobe, 0-5 |
| `HudSegBuffer:` `.ds 6` | segment bytes, one per digit |
| `HudMaskTbl` | digit select masks `$20, $10, $08, $04, $02, $01` |
| `HudGlyphTbl` | sixteen segment glyphs for digits 0-F |

- `HudScanDig` strobes one digit per row tick from `HudSegBuffer`, so
  all six digits refresh within each frame's scan.
- `HudWriteU16` takes the value in HL: slot 0 shows 0, slots 1-5 show
  the 10000..1 decimal digits.
- A block may also store glyph bytes straight into `HudSegBuffer`,
  indexing `HudGlyphTbl` for the 0-F patterns.

## LCD slice

The LCD is board hardware, available with either display. A `text`
declaration brings in the equates, the string data, and the `lcd_row`
op.

| Equate | Value | Meaning |
|--------|-------|---------|
| `ApiStringToLcd` | `13` | HL = string; destroys A,HL |
| `ApiCharToLcd` | `14` | A = character |
| `ApiCommandToLcd` | `15` | B = instruction byte |
| `LcdRow1` | `$80` | cursor command for row 1 |
| `LcdRow2` | `$C0` | cursor command for row 2 |
| `LcdRow3` | `$94` | cursor command for row 3 |
| `LcdRow4` | `$D4` | cursor command for row 4 |

`text MsgHello "HELLO"` compiles to a zero-terminated string:

```asm
MsgHello:
        .db     "HELLO", 0
```

and the generated op positions the cursor, then writes it:

```asm
op lcd_row(msg imm16, row imm8)
        ld      b,row
        ld      c,ApiCommandToLcd
        rst     $10
        ld      hl,msg
        ld      c,ApiStringToLcd
        rst     $10
end
```

`lcd_row MsgHello, LcdRow1` in a block body expands the op inline.

## Matrix resources

A plain shape compiles to a `Shape_<Name>` table: width, height,
colour, then left-aligned row masks.

```asm
Shape_Dot:
        .db     2, 2, COLOR_GREEN
        .db     %11000000
        .db     %11000000
```

`ShapeDraw` walks the table and plots each lit bit with `FbPlot`.
The first plain shape also brings nine scratch cells, `ShapePtr`
through `ShapeColIndex`, that `ShapeDraw` uses in place of registers.

A rotational shape compiles to the piece-engine tables. This `shape
PieceS color cyan` with `rot0`, `rot1`, `rot2 = rot0`, `rot3 = rot1`
generates:

```asm
ShapeRot_PieceS_0:
        .db     %11000000
        .db     %01100000
        .db     %00000000
        .db     %00000000
ShapeRot_PieceS_1:
        .db     %01000000
        .db     %11000000
        .db     %10000000
        .db     %00000000
ShapeRotPtrTable:
        .dw     ShapeRot_PieceS_0, ShapeRot_PieceS_1, ShapeRot_PieceS_0, ShapeRot_PieceS_1
ShapeRotRightTbl:
        .db     2,1,2,1
ShapeRotColorTbl:
        .db     COLOR_CYAN
ShapeId_PieceS    .equ 0
ShapeRotCount     .equ 1
```

- Each distinct rotation is a 4-row bitmap, padded with empty rows;
  aliases repeat pointers in `ShapeRotPtrTable` instead of repeating
  bitmaps.
- `ShapeRotPtrTable` and `ShapeRotRightTbl` hold four entries per
  shape: index an entry by `id*4 + rotation`, with `id` from the
  `ShapeId_<Name>` equate. `ShapeRotColorTbl` holds one colour byte
  per shape, indexed by `id` alone.
- `ShapeRotRightTbl` records each rotation's rightmost occupied
  column, the X bound a collision probe checks first.
- Your own code walks these tables; Chapter 15 reads the Tetro engine
  that does.

---

[Book](index.md)
