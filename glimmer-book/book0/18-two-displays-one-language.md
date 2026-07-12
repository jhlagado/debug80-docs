---
layout: default
title: "Two Displays, One Language"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 18
---

[← A VDP Game](17-a-vdp-game.md) | [Book](index.md)

# Chapter 18 - Two Displays, One Language

Two finished games stand behind you. Skyfall drops blocks down an
8x8 board of LEDs toward a sliding paddle; Lanternfly steers a white
sprite through a night garden with a wasp on its tail. Read them as
designs and they are near twins: three cards joined in the same
three-press loop, a writable timer whose period is the difficulty, a
one-shot guarding the restart, `ApiRandom` masked for every respawn,
and a game-over card the second game took from the first keystroke
for keystroke.

Read them as programs and they part company at a single line.
`display matrix8x8` against `display tms9918` decided what a render
writes to, what collision costs, how motion travels to the screen,
and how large a world each game could afford. This closing chapter
reads the two games side by side and traces every difference back to
that one line - and every sameness to the language around it.

## The two loops

Build either game and open its generated file at the runtime loop.
From `skyfall.main.asm`:

```asm
; --- runtime loop ---
Start:
        call    FbClear
        call    HudBlankDig
MainLoop:
        call    ScanFrame            ; show one full frame, then blank
        call    GlimPollBindings     ; game work runs in the blank window
        ld      a,(CurrentCard)    ; latch: card transitions land at
        ld      (GlimActiveCard),a  ; frame start, never mid-frame
        call    GlimTickTimers
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

And from `lanternfly.main.asm`:

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
        call    GlimTickTimers
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

From `GlimPollBindings` down, the two loops run the same nine
instructions: poll, latch the card, tick the timers, run the phases,
roll the frame over. That identical tail is the language - the frame you have known
since chapter 2, unchanged under either display.

Everything above it is the profile, and the two heads describe two
relationships with a screen. Skyfall's frame *produces* its picture:
`ScanFrame` drives all eight LED rows with a fixed dwell and returns
with the matrix dark, so the whole game - polling, rules, renders -
runs inside the blank window between scans, and the scan is the
frame's largest cost. Lanternfly's frame *waits for* its picture:
the VDP paints 256x192 pixels from its own 16 KiB of VRAM over and
over without help, `VdpWaitVBlank` catches the rest between two
paintings, and `GlimCommit` spends that rest moving the previous
frame's changes into VRAM. One display is something the CPU does;
the other is something the CPU writes to.

## The board the program is

On the matrix, the scene is 32 bytes of program RAM, and Skyfall's
whole visible world - drop, paddle - lives in them. A render writes
the framebuffer; the next scan shows it; and because the CPU
re-presents those bytes every frame, the picture persists exactly as
long as the bytes do.

With a scene that small, the cheapest render repaints all of it.
Skyfall draws its board with one block:

```text
render DrawBoard
    on PadX, DropX, DropY
begin
    call FbClear
    ld a,(DropX)
    ld b,a              ; B = x
    ld a,(DropY)
    ld c,a              ; C = y
    ld a,COLOR_YELLOW
    call FbPlot
    ld a,(PadX)
    ld b,a
    ld c,7              ; the bottom row
    ld hl,Shape_Paddle
    call ShapeDraw
end
```

Whatever moved - paddle, drop, or both - the block clears the canvas
and repaints everything on it, and the cost stays trivial because
everything on it is a plot and a three-pixel shape. `FbClear`
handles erasing wholesale: every picture starts from darkness, so
whatever vacated a pixel is gone before the plots begin.

The same smallness shapes the rules. Positions on the matrix are
cells, so Skyfall's entire collision question - did the paddle catch
the drop? - is one subtraction and one unsigned compare: `sub b`,
`cp 3`, carry means caught. The repository's matrix games push the
board shape further in the same direction. Snake packs each body
segment into a single byte, `y*8+x`, and walks a 64-byte ring buffer
of them; Tetro keeps its settled board as occupancy and colour plane
bytes, merged into the framebuffer a row at a time. When the world
is 64 cells, boards, bodies, and collisions all become byte
arithmetic, and a game's hardest questions take a handful of
instructions to answer.

The board also sets the budget. Every rule and render shares the
blank window between scans, and the scan paces the game at its
sixty-odd frames a second - which is why Skyfall's difficulty lives
in a timer period, counted in frames, rather than in how much work a
frame does.

## The scene the program describes

On the VDP, the scene outlives the frame that drew it. Lanternfly's
splash card plants five reeds with five `tile_at` lines, once, in an
`enter` block; the commit carries them to VRAM; and the VDP repaints
them in every picture for the rest of the run without another
instruction spent. A matrix render repaints its whole layer whenever
a fact changes. A VDP program writes each cell once and writes again
only what differs.

Renders write that difference into shadow tables - ordinary RAM
mirroring the VRAM the VDP reads - and the commit moves only the
marked portions during the blank: all 128 sprite-attribute bytes if
any sprite moved, and 32 bytes for each grid row whose dirty bit
stands. On a frame where only the fly moved, the traffic is one
table; on a still frame, none. Motion becomes cheap in exactly the
way whole-scene redraws were cheap on the matrix: moving the fly is
two shadow bytes, wherever it stands on a 256x192 screen.

That scale rewrites the rules. Positions are pixels now, so
Lanternfly's collision is the distance between two facts - absolute
pixel difference per axis, each under a tolerance of 6 - and the
tolerance itself became a design decision Skyfall never faced,
choosing overlap over touch. The lantern pickup crosses the two
coordinate systems on purpose: the fly lives in pixels, the lantern
in grid cells, so `Gather` centres the fly (+4), divides by eight
(three shifts), and compares cells. And erasing turned explicit.
When `Gather` takes a lantern, it blanks the old grid cell itself,
inside the effect, because four lines later the respawn overwrites
`LampCol` and `LampRow` and no render would ever again know which
cell to clear. A persistent scene remembers what you drew, including
what you meant to remove.

The commit pacing sets this profile's motion cost: a held key
reaches the screen two frames later - defer, shadow write, commit -
at full rate, sixty-odd pixels a second. Skyfall's paddle reaches
the next scan one frame after its pulse. Both games feel immediate;
the difference matters the day you count frames in the debugger and
find the pipeline exactly where these chapters said it would be.

One table holds the divergence:

| | Skyfall, matrix | Lanternfly, VDP |
|---|---|---|
| The scene | 32 bytes, redrawn on change | 768 cells + 32 sprites, persistent in VRAM |
| A render writes | the whole framebuffer | the shadow bytes that changed |
| Who shows it | `ScanFrame`, every frame | the VDP, from VRAM, on its own |
| Positions | cells on an 8x8 board | pixels on 256x192; grid cells, 32x24 |
| Collision | one subtract, one compare | pixel distance per axis, under a tolerance |
| Erasing | `FbClear` opens each redraw | an explicit blank of the old cell |
| Game budget | the blank window between scans | the vblank window between paintings |

## One language

Now read what the `display` line left alone. Skyfall and Lanternfly
declare their games in interchangeable sentences: `state` bytes and
words for facts, pulses for moments, `bind key ... held` for
steering and `bind key any rising` for the restart key, a writable
oscillator as the difficulty screw - `Gravity` at 18 quickened to a
floor of 6, `Pace` at 8 quickened to a floor of 1, the same `dec`
and store in both - and a one-shot word timer armed at 90 frames to
gate the restart. Three cards each, entered through `enter` blocks
that re-raise what their renders need, left by `goto` or a
conditional write to `CurrentCard`. The whole GameOver card moved
between profiles without an edit.

The phases carried over too, with their delivery rule intact. Both
games trust that a render draws a settled world; both stage changes
through `Raised0` and `Next0` by the same exactly-once rule; both
print their design with `glimmer --deps` in the same report shape,
raisers and triggers per fact. Skyfall spends 12 of the 32
change-flag cells, Lanternfly 16, on the same budget.

The dividing line runs exactly where the loops drew it. The profile
owns the loop, so everything about *showing* - scan or commit,
framebuffer or shadow, `FbPlot` or `SpriteSet` - came from one
declaration and lives above the identical tail. You own the
behaviour, and the model that carries it - facts, moments, rules,
pictures, phases, cards - ran unchanged under both. Two displays,
one language: the display decides how pictures happen, and the
language decides what a game *is*.

So choosing a display for your next idea is a question about the
world it needs. A game whose world is a board of cells that change
together - pieces locking, lines clearing, a body growing - belongs
on the matrix, where the whole scene is 32 bytes and cell arithmetic
answers everything. A game whose world is a place - standing
scenery, a few movers gliding over it, room to travel - belongs on
the VDP, where persistence and size cost nothing and motion is two
bytes. Either way, the declarations you write first, chapter 14's
habit, will read almost the same.

## Where the road goes

The Glimmer repository's `examples/` directory holds seven built,
running programs, and every one of them is now readable with what
you know. `counter`, `dot`, `slide`, and `trail` are single-idea
warm-ups. `snake.glim` is the matrix under a different pressure than
Skyfall's: a growing body in a 64-byte ring buffer, with its
body-scan and draw loops in an imported AZM engine. You read
`tetro.glim` in chapter 15 and `sprite-chase.glim` in 17; both reward a
second visit as *yours to change* - a new piece, a smarter fleeing
target. Bending a working game teaches what building one began.

When the engine files you import grow past helpers into modules of
their own, the [AZM books](../../azm-book/) hold the assembler's
whole story: ops, routines, register contracts, and the module
system Glimmer's output leans on. [Debug80 Book
1](../../debug80-book/book1/) covers the workshop end to end,
from project setup to sending a build to a physical board.

And the board is the last stop worth naming. Every program in this
book produced a HEX file beside its assembly, and that file runs on
a real TEC-1G exactly as it ran in the emulator - the same bytes,
the same scan or the same commit, with actual LEDs doing the
glowing. If a board is within reach, Skyfall on real hardware is one
transfer away.

## Summary

- The two profiles differ in the loop's head and agree in its tail:
  `ScanFrame` produces the matrix picture and the game runs in the
  blank that follows; `VdpWaitVBlank` and `GlimCommit` pace the VDP
  game and flush shadows while the VDP rests. Poll, latch, tick,
  phases, and rollover are identical.
- The matrix makes whole scenes cheap: 32 bytes, `FbClear` and
  repaint, positions as cells, collision as byte arithmetic - the
  shape of Skyfall, Snake, and Tetro.
- The VDP makes persistence and motion cheap: scenery written once,
  movers as two shadow bytes, positions as pixels, collision as
  distance under a tolerance, erasing done explicitly - the shape of
  Lanternfly and Sprite Chase.
- State, pulses, bindings, timers, phases, delivery, and cards are
  identical under both displays; Lanternfly reuses Skyfall's GameOver
  card verbatim. The profile owns the loop; you own the behaviour.
- Choose the display by the world the game needs: a board of cells
  that change together, or a place with movers over standing
  scenery.

A game is facts, moments, rules, and pictures, and you can now build
one from an empty file on either display the TEC-1G offers. Every
game you write from here starts the way Mover did: one fact, one
picture, and a connection between them.

---

[← A VDP Game](17-a-vdp-game.md) | [Book](index.md)
