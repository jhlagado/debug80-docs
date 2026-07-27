---
layout: default
title: "Two Displays, One Language"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 18
---

# Two Displays, One Language

We began this book with one white pixel in the middle of the 8x8 RGB
LED matrix. Those sixty-four pixels now run complete games, and you
have moved from them to a video chip with sprites. Skyfall drops
blocks down the 8x8 board toward a paddle you slide along the bottom
row; Lanternfly steers a white sprite through a night garden with a
wasp on its tail. You built Skyfall and worked through Lanternfly's
design. Side by side, they are near twins: three cards joined in
the same loop, a writable timer whose period is the difficulty, a
one-shot guarding the restart, `ApiRandom` masked for every respawn
and the same delayed game-over gate.

Their implementations separate at one early line. `display
matrix8x8` and `display tms9918` determine what a render writes, how
collision is calculated, how motion reaches the screen and the
available scene size.

## The two loops

The generated runtime loops make the comparison concrete. From
`skyfall.main.asm`:

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

From `GlimPollBindings` downward, the two loops run the same nine
instructions: poll, latch
the card, tick the timers, run the phases, roll the frame over. That
identical tail is the language's reactive frame, unchanged under
either display.

Everything above `GlimPollBindings` is profile-specific, and the two
loop prefixes describe different relationships with a screen.
Skyfall's frame
*produces* its picture: `ScanFrame` drives all eight LED rows with a
fixed dwell and returns with the 8x8 matrix dark, so the whole game
(polling, rules, renders) runs inside the blank window between scans,
and the scan is the frame's largest cost. Lanternfly's frame begins by
waiting for its picture: the VDP refreshes 256x192 pixels from 16 KiB of
VRAM, `VdpWaitVBlank` detects the interval between two refreshes and
`GlimCommit` moves the previous frame's changes into VRAM during that
interval.

![Two displays, two prices, one reactive frame.](../../assets/images/glimmer-book/book0/two-loops.svg)

## The board the program is

On the 8x8 matrix, the scene is 32 bytes of program RAM, and
Skyfall's complete visible scene (drop and paddle) is in them. A
render writes the framebuffer; the next scan shows it; and because
the CPU re-presents those bytes every frame, the picture persists
exactly as long as the bytes do.

With a scene that small, the cheapest render repaints all of it, and
that is exactly how you wrote Skyfall's board:

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

Whatever moved (paddle, drop, or both), the block clears the canvas
and repaints everything on it, and the cost stays trivial because
everything on it is one plot and a three-pixel shape. `FbClear`
erases the framebuffer before each redraw, so
whatever vacated a pixel is gone before the plots begin.

The same smallness shaped your rules. Positions on the 8x8 are
cells, so Skyfall's entire collision question (did the paddle catch
the drop?) came down to one subtraction and one unsigned compare:
`sub b`, `cp 3`, carry means caught. The repository's 8x8 matrix
games push the board shape further in the same direction. Snake
packs each body segment into a single byte, `y*8+x`, and walks a
64-byte ring buffer of them; Tetro keeps its settled board as
occupancy and colour plane bytes, merged into the framebuffer a row
at a time.

Timing came from the profile too: every rule and render shares the
blank window between scans, and the scan paces the game, which is
why Skyfall's difficulty lives in a timer period, counted in frames.

## The scene the program describes

On the VDP, the scene outlives the frame that drew it. In
Lanternfly's splash card, you planted five reeds with five `tile_at`
lines, once, in an `enter` block; the commit carried them to VRAM;
and the VDP has refreshed them in every picture since from VRAM. An 8x8
matrix render repaints its whole layer whenever a fact changes; a
VDP program writes each cell once and writes again only where a
fact changed.

Your renders wrote that difference into shadow tables (ordinary RAM
mirroring the VRAM the VDP reads), and the commit moves only the
marked portions during the blank: all 128 sprite-attribute bytes if
any sprite moved, and 32 bytes for each grid row whose dirty bit
stands. On a frame where only the fly moved, the commit carries the
sprite table, and the lantern's grid row besides, because `Gather`
runs on every fly step and its `updates` re-mark the row it redraws.
Splitting the test from the catch response removes that extra row.
On a still frame the commit reads its dirty markers and
returns. Moving the fly writes two shadow bytes, then
the next commit sends the 128-byte sprite table.

That scale rewrote your rules. Positions are pixels now, so
Lanternfly's collision is the distance between two facts (absolute
pixel difference per axis, each under a tolerance of 6), and the
tolerance itself is a design decision the pixel scale brings with it:
how much overlap counts as touching. The lantern pickup crosses the
two coordinate systems on purpose: the fly lives in pixels, the
lantern in grid cells, so `Gather` centres the fly (+4), divides by
eight (three shifts), and compares cells. When `Gather` takes a lantern, it blanks the old grid cell
itself, inside the effect, because four lines later the respawn
overwrites `LampCol` and `LampRow`, and the old cell's address is gone
with them.

The commit pacing sets this profile's motion cost: a held key reaches
the screen two frames later (defer, shadow write, commit) at full
rate, sixty-odd pixels a second. Skyfall's paddle reaches the next
scan one frame after its pulse.

The main differences fit in one table:

| | Skyfall, 8x8 matrix | Lanternfly, VDP |
|---|---|---|
| The scene | 32 bytes, redrawn on change | 768 cells + 32 sprites, persistent in VRAM |
| A render writes | the complete framebuffer | shadow cells, committed by dirty group |
| Display mechanism | `ScanFrame`, every frame | the VDP, from VRAM |
| Positions | cells on an 8x8 board | pixels on 256x192; grid cells, 32x24 |
| Collision | one subtract, one compare | pixel distance per axis, under a tolerance |
| Erasing | `FbClear` opens each redraw | an explicit blank of the old cell |
| Game budget | the blank window between scans | the vblank window between paintings |

## One language

The `display` line leaves the game model alone. Skyfall and Lanternfly
declare their games in interchangeable sentences: `state`
bytes and words for facts, pulses for moments, `bind key ... held`
for steering and `bind key any rising` for the restart key, a
writable oscillator as the difficulty screw (`Gravity` at 18
quickened to a floor of 6, `Pace` at 8 quickened to a floor of 1,
the same `dec` and store in both), and a one-shot word timer armed
at 90 frames to gate the restart. Three cards each, entered through
`enter` blocks that re-raise what their renders need, left by `goto`
or a conditional write to `CurrentCard`. The GameOver card moved
between profiles verbatim.

Both
games run compute, effect and render in that order; both stage changes
through `Raised0` and `Next0` so one change reaches its dependents
together, in a later phase or at the next frame's start; both print
their design with `glimmer --deps` in the same report shape, raisers
and triggers per fact. Skyfall uses 12 of the 32 change-flag cells,
Lanternfly 16, on the same budget.

The profile supplies the display-specific loop: scan or commit,
framebuffer or shadow and `FbPlot` or `SpriteSet`. The language model
remains the same across both display architectures: facts, moments,
rules, pictures, phases and cards.

The next game's requirements determine its display. A game
whose world is a board of cells that change together
(pieces locking, lines clearing, a body growing) is a natural fit
for the 8x8 matrix, where the whole scene is 32 bytes and cell
arithmetic answers most questions. A game whose world is a place
(standing scenery, a few movers gliding over it, room to travel)
favours the VDP, where persistence and size require less Z80 work and
a mover is two shadow bytes. Both displays have limits
(sixty-four pixels on one side, sprite counts and colour rules on
the other), and either way, the declarations you write first will
read almost the same.

## Further projects

The Glimmer repository's `examples/` directory contains more programs
readable with the model developed here. `counter`, `dot`, `slide` and
`trail` are single-idea warm-ups. `snake.glim` is
another 8x8 design: a growing body in
a 64-byte ring buffer, with its body-scan and draw loops in an
imported assembly engine. You have also read `tetro.glim` and
`sprite-chase.glim`; each can be extended with a new piece or a
smarter fleeing target.

When imported engine files grow from helpers into modules, the
[AZM books](../../azm-book/) cover ops, routines, register contracts
and the module system used by Glimmer's output. [Debug80 Book
1](../../debug80-book/book1/) covers the workflow from
project setup to sending a build to a physical board.

Every program in this book produced a HEX file containing the same
assembled bytes that Debug80 runs. That file can be transferred to a
real TEC-1G. If a board is within reach, Skyfall is one transfer away.

The book began with the ability to read `ld a,(hl)`. You can now read,
modify and extend complete Glimmer games on either display the TEC-1G
offers. A new game can begin as Mover did: one fact, one picture and a
connection between them.
