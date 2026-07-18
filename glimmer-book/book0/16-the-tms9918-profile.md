---
layout: default
title: "The TMS9918 Profile"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 16
---

[← Reading Tetro](15-reading-tetro.md) | [Book](index.md) | [A VDP Game →](17-a-vdp-game.md)

# Chapter 16 - The TMS9918 Profile

For fifteen chapters, you have been the display. Every picture in this
book since chapter 6 has come from the 8x8 RGB LED matrix, and that
display shows only what the CPU is actively pushing: the profile loop
spends most of each frame driving the LED rows from the framebuffer,
and your blocks do their work in the blank that follows. You have
lived comfortably inside that arrangement, and this chapter turns it
inside out. On the 8x8 matrix, the Z80 *is* the display. Stop feeding the
rows and the picture dies.

This chapter's display paints itself. The TEC-Deck expansion card
adds a TMS9918 video display processor to the TEC-1G, and I want to
introduce it with some ceremony, because you have almost certainly
seen its work: this is the chip family that drew the MSX machines and
the ColecoVision, the sprite chip of a whole era of games. It sits
beside the Z80 as a second chip with 16 KiB of video RAM of its own,
painting a 256x192 picture from that memory over and over, whether
the Z80 is busy or idle. The picture holds steady while your code
takes its time, because showing it is the VDP's job now. The CPU
stops being the display and becomes its director: from here on, your
work is not showing the scene but describing it.

So what does a described scene look like? In the VDP's Graphics I
mode, it has two layers. The background is a grid, 32 columns by 24
rows, each cell showing one 8x8-pixel tile pattern; a table of one
byte per cell, the name table, says which pattern each cell wears. In
front of the grid stand sprites: 32 small patterns, each at a pixel
position of its own, and moving one costs the rewrite of two bytes.
The division of labour you will use in every VDP game is already
visible in that description: scenery belongs in tiles; anything that
glides belongs in sprites.

And where does the Z80 fit? It reaches the VDP's memory through two
ports: control at `$BF`, data at `$BE`. Two control-port writes set a
VRAM address, and the data port then streams bytes to consecutive
addresses - the VDP walks its own pointer forward for you. The
traffic also has a best moment. After painting the last line of a
picture the VDP rests before starting the next - the vertical blank -
and raises a flag in its status register to say so. The profile paces
the whole program on that flag, and it moves your VRAM traffic into
that resting window. One point belongs ahead of any code, because it
shapes everything after: your blocks keep writing plain RAM, exactly as
they always have. The ports belong to the generated library, and you
will not touch them once in this chapter.

Selecting all of this costs one changed line: `display tms9918`, with
the platform line as before. The keypad, the LCD, and `text`
declarations live on the board itself and work the same here; sound
cues, `shape`, and the seven-segment HUD service stay with the 8x8
matrix profile.

## Grove

The chapter program is *Grove*: a white moth over a night garden.
Ferns and blooms stand still in the tile grid; the moth is a sprite,
steered with 2/4/6/8, one pixel per frame while a key is held. I
chose it to make the smallest round trip the new hardware allows - a
few tiles, one sprite, and the commit that carries both to the
screen - because once you have walked that loop end to end, the full
game of chapter 17 is more of the same.

```text
program Grove

platform tec1g-mon3
display tms9918

sprite Moth color white
  "X..XX..X"
  "XX.XX.XX"
  "XXXXXXXX"
  ".XXXXXX."
  "..XXXX.."
  "...XX..."
  "...XX..."
  "........"
end

tile Fern color lightgreen on black
  "...X...."
  "X..X..X."
  ".X.X.X.."
  "..XXX..."
  "X..X..X."
  ".X.X.X.."
  "..XXX..."
  "...X...."
end

tile Bloom color lightred on black
  "........"
  "..X.X..."
  ".XXXXX.."
  "..XXX..."
  ".XXXXX.."
  "..X.X..."
  "...X...."
  "...X...."
end

state MothX : byte = 124 changed
state MothY : byte = 92  changed
state Init  : byte = 0   changed

pulse Up
pulse Down
pulse Left
pulse Right

bind key KEY_2 held period 1 -> Up
bind key KEY_8 held period 1 -> Down
bind key KEY_4 held period 1 -> Left
bind key KEY_6 held period 1 -> Right

effect PlantScene
    on Init
begin
    tile_at Fern, 4, 18
    tile_at Fern, 9, 6
    tile_at Fern, 14, 20
    tile_at Fern, 20, 9
    tile_at Fern, 26, 16
    tile_at Bloom, 6, 10
    tile_at Bloom, 16, 4
    tile_at Bloom, 23, 19
end

effect MoveUp
    on Up
    updates MothY
begin
    ld a,(MothY)
    or a
    jr z,_stop      ; at the top edge: stay
    dec a
    ld (MothY),a
_stop:
end

effect MoveDown
    on Down
    updates MothY
begin
    ld a,(MothY)
    cp 184          ; bottom clamp: 192 - sprite height
    jr nc,_stop
    inc a
    ld (MothY),a
_stop:
end

effect MoveLeft
    on Left
    updates MothX
begin
    ld a,(MothX)
    or a
    jr z,_stop      ; at the left edge: stay
    dec a
    ld (MothX),a
_stop:
end

effect MoveRight
    on Right
    updates MothX
begin
    ld a,(MothX)
    cp 248          ; right clamp: 256 - sprite width
    jr nc,_stop
    inc a
    ld (MothX),a
_stop:
end

render PlaceMoth
    on MothX, MothY
begin
    sprite_at Moth, MothX, MothY
end
```

Read the middle of the file first, because you will find an old
friend there: this is Rover with pixel coordinates. Four pulses, four
held bindings at period 1, four clamped move effects. The clamps say
248 and 184 now because positions name the sprite's top-left pixel on
a 256x192 screen and the pattern is 8 pixels square. Everything
genuinely new sits at the two ends: three resource declarations at
the top, and two block bodies - `PlantScene` and `PlaceMoth` - whose
lines mention them. Let me take the new material in order.

## Sprites and tiles are declarations

Start with the moth. A `sprite` declaration is eight quoted rows of
eight characters: `X` for a lit pixel, `.` for a transparent one -
and the transparency matters, because where the moth's pattern has
dots, the garden shows through behind it. `color white` picks one of
the sixteen VDP colours - `transparent`, `black`, `medgreen`,
`lightgreen`, `darkblue`, `lightblue`, `darkred`, `cyan`, `medred`,
`lightred`, `darkyellow`, `lightyellow`, `darkgreen`, `magenta`,
`gray`, `white` - and the whole sprite wears it. Inside block bodies
the same sixteen names exist as `VC_*` equates, so your assembly
talks about colour in the same vocabulary as your declarations.

You will notice there is no number anywhere in the declaration.
Declaration order does the numbering: the first `sprite` in the file
is slot 0 and pattern 0, the second is slot 1, and so on, up to 31
sprites in a program. In the generated file the pattern rows become
bytes and the name becomes its slot:

```asm
GlimSpritePats:
        .db     %10011001
        .db     %11011011
        .db     %11111111
        .db     %01111110
        .db     %00111100
        .db     %00011000
        .db     %00011000
        .db     %00000000
Moth              .equ 0   ; sprite slot + pattern
```

Cover the labels and you can still read the moth in the binary: each
`X` became a 1, each dot a 0.

A `tile` carries two colours, foreground `on` background, and its
rows read the same way. Its numbering is the one place the hardware
leans on you, so take this part slowly. Graphics I colours patterns
in banks of eight: one colour byte covers patterns 0..7, the next
8..15, and onward through 32 banks. Tiles that share an (fg, bg) pair
fill a bank together, and a new pair opens a new bank. Index 0 stays
the blank tile that fills every empty cell; it lives in the first
pair's bank, so **the first pair's background is the screen
background**. Grove declares black behind both of its pairs, and the
garden sits in darkness. The banking also explains the indexes
Glimmer generated:

```asm
Fern              .equ 1   ; tile index
Bloom             .equ 8   ; tile index
```

Fern takes the seat beside the blank tile in bank 0; Bloom's colour
pair is new, so it opens bank 1 at index 8. Six more ferns and seven
more blooms would cost nothing; a sixteenth distinct colour pair
would open bank 15, sixteenth of the 32 the colour table holds.

## Where a render writes

On the 8x8 matrix, renders drew into a framebuffer and the scan
turned it into light. Here a render writes two **shadow tables**:
ordinary RAM, laid out to match the VRAM tables the VDP reads. From
the generated state storage:

```asm
NameShadow:       .ds 768, 0       ; 32x24 name table shadow
NameDirtyRows:    .db 0, 0, 0      ; 24 dirty-row bits
SpriteShadow:     .ds 128, 0       ; 32 x (y, x, pattern, colour)
SpriteDirty:      .db 0
```

`NameShadow` mirrors the name table, one byte per grid cell.
`SpriteShadow` mirrors the sprite attribute table: four bytes per
sprite - y, x, pattern, colour - for all 32 slots. Beside each shadow
sits its own bookkeeping, sized to its table: three bytes of
`NameDirtyRows` carry one bit per grid row, and the single
`SpriteDirty` byte covers the whole sprite table. The word *dirty*
is about to become the hinge of the whole profile.

Three profile routines write the shadows for you, and each declares
its register interface in the generated file, the way chapter 11
taught you to read:

```asm
; Put tile A at column D, row E of the name-table shadow and mark
; the row dirty.
.routine in A,D,E clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry
NamePut:
```

- `NamePut` - A = tile index, D = column, E = row. Stores the shadow
  cell and marks the row's dirty bit.
- `SpriteSet` - A = slot, D = x, E = y. Positions a sprite and sets
  `SpriteDirty`.
- `SpriteInit` - A = slot, D = pattern number, E = colour. Gives a
  slot its look; the generated startup calls it once per sprite.

For the two common calls, Glimmer generates a pair of assembler ops, so a
block body reads as a sentence:

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

An op expands inline where it is written, so `sprite_at Moth, MothX,
MothY` in `PlaceMoth` becomes those six instructions: read the two
cells into D and E, load the slot, call `SpriteSet`. `tile_at` takes
immediate coordinates, which suits placing a scene; when a column or
row arrives in a register at runtime, load A, D, and E yourself and
call `NamePut` directly.

## The commit-shaped loop

Now the piece that joins the two halves - the shadows your renders
write and the chip that paints. Build Grove and open `grove.main.asm`
at the loop:

```asm
; --- runtime loop ---
Start:
        call    VdpInit
        call    LoadResourcesVram
MainLoop:
        call    VdpWaitVBlank        ; pace on the status-register flag
        call    GlimCommit           ; flush shadows in the blank window
        call    GlimPollBindings
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

From `GlimPollBindings` down, this is the frame you have known since
chapter 2. The profile's whole character lives in the two calls above
it. On the 8x8 matrix, `ScanFrame` produced the picture; here,
`VdpWaitVBlank` waits for one. The routine polls the status register
until the vblank flag comes up - reading the register clears it,
arming the next frame - so the program takes exactly one trip around
`MainLoop` per picture the VDP paints, sixty-odd frames a second.
Glimmer still owns the loop; the VDP now owns the clock.

`GlimCommit` then spends the blank window moving the previous frame's
shadow writes into VRAM: the whole sprite table if `SpriteDirty` is
set, and each name-table row whose dirty bit is marked. Only after
the shadows are flushed does the frame poll keys and run your phases,
whose renders write the shadows anew. This is the delegation from the
opening of the chapter, made mechanical. Your renders describe the
scene into cheap RAM whenever their facts change, and the runtime
streams only what differs to the chip that does the painting - the
same reactive model you have used all book, with a new pair of hands
at the end of it.

Follow a held key 6 through one frame, because the timing deserves to
be exact in your head. The poll fires `Right`; `MoveRight` steps
`MothX`; render is a later phase, so the change arrives the same
frame, `PlaceMoth` runs, and `sprite_at` writes the new x into
`SpriteShadow` and sets `SpriteDirty`. The screen still shows the old
position. The next frame opens in the blank: `GlimCommit` streams the
sprite shadow to VRAM, and the moth stands one pixel to the right.
Every shadow write reaches the screen at the top of the following
frame, tiles and sprites alike.

## A scene planted once

`PlantScene` runs exactly once, and the trigger is a mechanism you
have owned since chapter 3: `Init` is a byte declared `changed`, so
its flag is up before the first frame; the effect fires on frame 1,
places eight tiles, and `Init` never changes again. One line you have always written is absent: `updates`, because this block changes no cell. Its work lands in the name shadow, which the profile tracks
with row bits instead of change flags.

Those eight `tile_at` lines touch eight different grid rows, so frame
1 ends with eight dirty bits standing, and frame 2's commit streams
eight rows into VRAM. From then on the garden is the VDP's to paint,
picture after picture, and the program never redraws it. Feel the
difference in your fingers: an 8x8 matrix render repaints
its layer whenever a fact changes; a VDP program writes each cell
once and writes again only what differs. `MothX` and `MothY` are
declared `changed` for the same startup reason: on frame 1,
`PlaceMoth` puts the moth into the sprite shadow alongside the
garden, and the first picture arrives whole.

When a program has cards, an `enter` block is the natural home for
scene placement, and chapter 17 plants its scene that way. Grove has
one screen, so a changed cell provides the run-once trigger with the
tools already on the table.

## Inside the generated file

Two generated routines carry this chapter's machinery, and both
reward a slow read. First the commit. Its sprite half is four
decisions long:

```asm
; --- commit: flush dirty shadows to VRAM ---
.routine clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry
GlimCommit:
        ld      a,(SpriteDirty)
        or      a
        jr      z,_names
        xor     a
        ld      (SpriteDirty),a
        ld      hl,VRAM_SPRITE_ATTR
        call    VdpSetAddrWrite
        ld      hl,SpriteShadow
        ld      bc,128
        call    VdpWriteBlock
```

One flag guards one stream: when any sprite moved, all 128 bytes go,
a table small enough to send whole. The name table is 768 bytes - too
much to send on a hunch - and that size is why the rows carry
individual bits. The rest of the routine is the dirty-row loop:

```asm
_names:
        ld      d,0                  ; D = dirty-row group 0..2
        ld      b,d                  ; B is dead here; defined only so AZM 0.3
                                     ; stale-register analysis accepts the push bc
                                     ; save/restore below (only C is live)
_group:
        ld      hl,NameDirtyRows
        ld      a,l
        add     a,d
        ld      l,a
        ld      a,h
        adc     a,0
        ld      h,a
        ld      a,(hl)
        or      a
        jr      z,_next
        ld      (hl),0               ; consume the group
        ld      c,a                  ; C = dirty bits, rows D*8 .. D*8+7
        ld      e,0                  ; E = bit within the group
_bits:
        srl     c
        jr      nc,_nbit
        push    de
        push    bc
        ld      a,d
        add     a,a
        add     a,a
        add     a,a
        add     a,e                  ; row = group*8 + bit
        call    CommitNameRow
        pop     bc
        pop     de
_nbit:
        inc     e
        ld      a,e
        cp      8
        jr      c,_bits
_next:
        inc     d
        ld      a,d
        cp      3
        jr      c,_group
        ret
```

D walks the three group bytes, eight rows to a byte. A zero group
byte costs one read and moves on; a marked one is consumed on the
spot with `ld (hl),0`, and `srl c` shifts its bits out one at a time.
Each bit that falls into carry names a row - group times eight plus
bit - and `CommitNameRow` turns the row number into `row*32`, points
the VDP at `VRAM_NAME` plus that offset, and streams 32 shadow bytes
through the data port. On a Grove frame where only the moth moved,
the whole commit reads one flag, sends 128 bytes, reads three group
bytes, and is done. That is the budget your games will live inside,
and it is a generous one.

The second routine is the one-time upload that `Start` calls before
the loop begins:

```asm
; Upload sprite/tile patterns and the colour groups; assign each
; sprite slot's pattern and colour in the shadow. Called once from
; the loop init, after VdpInit.
.routine clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry
LoadResourcesVram:
        ld      hl,VRAM_SPRITE_PAT
        call    VdpSetAddrWrite
        ld      hl,GlimSpritePats
        ld      bc,8
        call    VdpWriteBlock
        ld      a,0                  ; Moth
        ld      d,0
        ld      e,VC_WHITE
        call    SpriteInit
        ld      hl,VRAM_PATTERN + 8   ; Fern
        call    VdpSetAddrWrite
        ld      hl,GlimTilePats + 0
        ld      bc,8
        call    VdpWriteBlock
        ld      hl,VRAM_PATTERN + 64   ; Bloom
        call    VdpSetAddrWrite
        ld      hl,GlimTilePats + 8
        ld      bc,8
        call    VdpWriteBlock
        ld      hl,VRAM_COLOR + 0
        call    VdpSetAddrWrite
        ld      a,VC_LIGHTGREEN * 16 + VC_BLACK
        out     (VDP_DATA),a
        ld      hl,VRAM_COLOR + 1
        call    VdpSetAddrWrite
        ld      a,VC_LIGHTRED * 16 + VC_BLACK
        out     (VDP_DATA),a
        ret
```

Every declaration from the top of `grove.glim` is here as address
arithmetic, and you can check each one with a finger on the page. The
moth's eight pattern bytes stream to the sprite-pattern area, and
`SpriteInit` records slot 0's pattern and colour in the shadow. Each
tile's eight bytes land at `VRAM_PATTERN` plus index times eight -
Fern at +8 for index 1, Bloom at +64 for index 8 - and each colour
bank gets its single byte, foreground times sixteen plus background.

Before any of this runs, `VdpInit` programs the VDP's eight registers
from a small table, clears the pattern and name tables, and hides all
32 sprites by writing `$D1` into every shadow y. That value does two
jobs: a sprite whose y is `$D1` is off-screen, and the VDP
stops processing sprites at the first slot holding it. Declaration
order keeps your live sprites contiguous from slot 0, so the
terminator always sits right after them.

## Summary

You have delegated the display. The new arrangement in one place,
ready for the game we build on it next:

- `display tms9918` selects the TEC-Deck VDP: a processor with 16 KiB
  of private VRAM, reached through the control port `$BF` and data
  port `$BE`, painting a 256x192 Graphics I picture on its own: a
  32x24 grid of 8x8 tiles with 32 sprites in front.
- The generated loop paces on the vertical blank: `VdpWaitVBlank`,
  then `GlimCommit` flushing dirty shadows to VRAM inside the blank
  window, then polling and the three phases.
- Render blocks write shadow tables in ordinary RAM. `NamePut` (A =
  tile, D = column, E = row) marks its row dirty; `SpriteSet` (A =
  slot, D = x, E = y) and `SpriteInit` (A = slot, D = pattern, E =
  colour) set `SpriteDirty`.
- `sprite` and `tile` declarations are eight rows of `X` and `.` in
  one of sixteen VDP colours. Declaration order is the sprite slot
  and pattern number; tiles bank by (fg, bg) pair in eights, and the
  first pair's background is the screen background.
- The generated `sprite_at` and `tile_at` ops expand inline onto the
  library calls; `LoadResourcesVram` uploads all patterns and colour
  banks once at startup.
- A shadow write reaches the screen at the top of the following
  frame. A scene written once persists in VRAM, and a changed cell
  like `Init` is the cardless way to place it in a single run.
- Sprite slots stay contiguous from 0: y = `$D1` hides a sprite and
  ends sprite processing at the first unused slot.

In the next chapter the profile carries a full game - sprite
collision, scoring on the tile grid, and cards on the VDP:
[A VDP Game](17-a-vdp-game.md).

---

[← Reading Tetro](15-reading-tetro.md) | [Book](index.md) | [A VDP Game →](17-a-vdp-game.md)
