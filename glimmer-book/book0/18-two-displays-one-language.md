---
layout: default
title: "Two Displays, One Language"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 18
---

[← A VDP Game](17-a-vdp-game.md) | [Book](index.md)

# Chapter 18 - Two Displays, One Language

We began this book with one white pixel in the middle of the 8x8 RGB
LED matrix, and I promised you that those sixty-four pixels would be
running complete games before we finished, and that you would move on
from them to a proper video chip with sprites. Both promises are kept,
and you kept them - look at what stands behind you. Skyfall drops
blocks down the 8x8 board toward a paddle you slide along the bottom
row; Lanternfly steers a white sprite through a night garden with a
wasp on its tail. You built both with your own hands, and read as
designs they are near twins: three cards joined in the same
three-press loop, a writable timer whose period is the difficulty, a
one-shot guarding the restart, `ApiRandom` masked for every respawn,
and a game-over card the second game took from the first keystroke
for keystroke.

Read them as programs, though, and their paths separate at one early
line. `display matrix8x8` against `display tms9918` set the prices:
what a render writes to, what collision costs, how motion travels to
the screen, how large a world a game can afford. The declaration
never forced a design - you and I made every choice in those two
games - but both games followed its prices, the way water follows a
slope. So in this closing chapter we read your two games side by
side - the differences read against the prices each display sets,
the samenesses traced to the language that holds under both - and
then I will show you where the road goes from here.

## The two loops

Build either game and open its generated file at the runtime loop.
Do this with the real files in front of you rather than take my word
for it, because the whole argument of this chapter sits in two short
listings. From `skyfall.main.asm`:

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

Put a finger on `GlimPollBindings` in each listing and read downward.
From there the two loops run the same nine instructions: poll, latch
the card, tick the timers, run the phases, roll the frame over. That
identical tail is the language - the frame you have known since
chapter 2, unchanged under either display.

Everything above your finger is the profile, and the two heads
describe two different relationships with a screen. Skyfall's frame
*produces* its picture: `ScanFrame` drives all eight LED rows with a
fixed dwell and returns with the 8x8 matrix dark, so the whole game -
polling, rules, renders - runs inside the blank window between scans,
and the scan is the frame's largest cost. Lanternfly's frame *waits
for* its picture: the VDP paints 256x192 pixels from its own 16 KiB
of VRAM over and over without any help from you, `VdpWaitVBlank`
catches the rest between two paintings, and `GlimCommit` spends that
rest moving the previous frame's changes into VRAM. One display is
something the CPU does; the other is something the CPU writes to.
Everything we are about to trace leans on that one sentence.

## The board the program is

On the 8x8 matrix, the scene is 32 bytes of program RAM, and
Skyfall's whole visible world - drop, paddle - lives in them. A
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

Whatever moved - paddle, drop, or both - the block clears the canvas
and repaints everything on it, and the cost stays trivial because
everything on it is one plot and a three-pixel shape. `FbClear` did
your erasing wholesale: every picture starts from darkness, so
whatever vacated a pixel is gone before the plots begin, and you
never had to think about what to remove.

The same smallness shaped your rules. Positions on the 8x8 are
cells, so Skyfall's entire collision question - did the paddle catch
the drop? - came down to one subtraction and one unsigned compare:
`sub b`, `cp 3`, carry means caught. The repository's 8x8 matrix
games push the board shape further in the same direction. Snake
packs each body segment into a single byte, `y*8+x`, and walks a
64-byte ring buffer of them; Tetro keeps its settled board as
occupancy and colour plane bytes, merged into the framebuffer a row
at a time. When the world is 64 cells, boards, bodies, and
collisions all become byte arithmetic, and a game's hardest
questions take a handful of instructions to answer.

The board also set your budget. Every rule and render shares the
blank window between scans, and the scan paces the game - which is
why Skyfall's difficulty lives in a timer period, counted in frames,
rather than in how much work a frame does.

## The scene the program describes

On the VDP, the scene outlives the frame that drew it. Think back to
Lanternfly's splash card: you planted five reeds with five `tile_at`
lines, once, in an `enter` block; the commit carried them to VRAM;
and the VDP has repainted them in every picture since without
another instruction spent. That is the reversal in one image. An 8x8
matrix render repaints its whole layer whenever a fact changes; a
VDP program writes each cell once and writes again only where a
fact changed.

Your renders wrote that difference into shadow tables - ordinary RAM
mirroring the VRAM the VDP reads - and the commit moves only the
marked portions during the blank: all 128 sprite-attribute bytes if
any sprite moved, and 32 bytes for each grid row whose dirty bit
stands. On a frame where only the fly moved, the commit carries the
sprite table - and the lantern's grid row besides, because `Gather`
runs on every fly step and its `updates` re-mark the row it redraws;
chapter 17 names that cost and the refinement that removes it. On a
still frame, the traffic is none. Motion becomes cheap in exactly the
way whole-scene redraws were cheap on the 8x8: moving the fly is two
shadow bytes, wherever it stands on a 256x192 screen.

That scale rewrote your rules. Positions are pixels now, so
Lanternfly's collision is the distance between two facts - absolute
pixel difference per axis, each under a tolerance of 6 - and the
tolerance itself was a design decision Skyfall never asked of you:
how much overlap counts as touching. The lantern pickup crosses the
two coordinate systems on purpose: the fly lives in pixels, the
lantern in grid cells, so `Gather` centres the fly (+4), divides by
eight (three shifts), and compares cells. And erasing turned
explicit. When `Gather` takes a lantern, it blanks the old grid cell
itself, inside the effect, because four lines later the respawn
overwrites `LampCol` and `LampRow` and no render would ever again
know which cell to clear. A persistent scene remembers what you
drew, including what you meant to remove.

The commit pacing sets this profile's motion cost. Know it
cold: a held key reaches the screen two frames later -
defer, shadow write, commit - at full rate, sixty-odd pixels a
second. Skyfall's paddle reaches the next scan one frame after its
pulse. Both games feel immediate under your thumbs; the difference
matters the day you count frames in the debugger and find the
pipeline exactly where these chapters said it would be.

Here is the whole divergence in one table:

| | Skyfall, 8x8 matrix | Lanternfly, VDP |
|---|---|---|
| The scene | 32 bytes, redrawn on change | 768 cells + 32 sprites, persistent in VRAM |
| A render writes | the whole framebuffer | shadow cells, committed by dirty group |
| Who shows it | `ScanFrame`, every frame | the VDP, from VRAM, on its own |
| Positions | cells on an 8x8 board | pixels on 256x192; grid cells, 32x24 |
| Collision | one subtract, one compare | pixel distance per axis, under a tolerance |
| Erasing | `FbClear` opens each redraw | an explicit blank of the old cell |
| Game budget | the blank window between scans | the vblank window between paintings |

## One language

Now read what the `display` line left alone, because this is the
part I have been waiting the whole book to show you. Skyfall and
Lanternfly declare their games in interchangeable sentences: `state`
bytes and words for facts, pulses for moments, `bind key ... held`
for steering and `bind key any rising` for the restart key, a
writable oscillator as the difficulty screw - `Gravity` at 18
quickened to a floor of 6, `Pace` at 8 quickened to a floor of 1,
the same `dec` and store in both - and a one-shot word timer armed
at 90 frames to gate the restart. Three cards each, entered through
`enter` blocks that re-raise what their renders need, left by `goto`
or a conditional write to `CurrentCard`. You moved the whole
GameOver card between profiles without a single edit.

The phases carried over too, with their delivery rule intact. Both
games run compute, effect and render in that order; both stage changes
through `Raised0` and `Next0` so one change reaches its dependents
together, in a later phase or at the next frame's start; both print
their design with `glimmer --deps` in the same report shape, raisers
and triggers per fact. Skyfall spends 12 of the 32 change-flag cells,
Lanternfly 16, on the same budget.

The two loops drew the dividing line back at the top of the chapter,
and it is the line this book was written to show you. The
profile owns the loop: everything about *showing* - scan or commit,
framebuffer or shadow, `FbPlot` or `SpriteSet` - came from one
declaration and lives above the identical tail. The language owns
the model: everything you learned - facts, moments, rules,
pictures, phases, cards - moved across two opposite display
architectures without changing shape. One display where the CPU
makes the picture, one where the CPU describes it, and your
knowledge crossed between them intact. That is what you bought by
learning a model instead of a platform. Displays come and go; what a
game *is* stays yours.

So when the next idea arrives, choose its display by the world it
needs. A game whose world is a board of cells that change together -
pieces locking, lines clearing, a body growing - is a natural fit
for the 8x8 matrix, where the whole scene is 32 bytes and cell
arithmetic answers most questions. A game whose world is a place -
standing scenery, a few movers gliding over it, room to travel -
favours the VDP, where persistence and size are comparatively cheap
and a mover is two shadow bytes. Both displays keep their own limits
- sixty-four pixels on one side, sprite counts and colour rules on
the other - and either way, the declarations you write first,
chapter 14's habit, will read almost the same.

## Where the road goes

Which brings us to the last question a teacher answers: what now?

The Glimmer repository's `examples/` directory holds seven built,
running programs, and every one of them is readable with what you
know. `counter`, `dot`, `slide`, and `trail` are single-idea
warm-ups you could write yourself this afternoon. `snake.glim` is
the 8x8 under a different pressure than Skyfall's: a growing body in
a 64-byte ring buffer, with its body-scan and draw loops in an
imported assembly engine. You read `tetro.glim` in chapter 15 and
`sprite-chase.glim` in 17, and both reward a second visit now as
*yours to change* - a new piece, a smarter fleeing target. Bending a
working game teaches what building one began.

When the engine files you import grow past helpers into modules of
their own, the [AZM books](../../azm-book/) hold the assembler's
whole story: ops, routines, register contracts, and the module
system Glimmer's output leans on. [Debug80 Book
1](../../debug80-book/book1/) covers the workshop end to end, from
project setup to sending a build to a physical board.

And the board is the last stop I want to name, because it is my
favourite. Every program in this book produced a HEX file beside its
assembly, and that file runs on a real TEC-1G exactly as it ran in
the emulator - the same bytes, the same scan or the same commit,
with actual LEDs doing the glowing. If a board is within reach,
Skyfall on real hardware is one transfer away, and the paddle feels
different when the light is real.

A game is facts, moments, rules, and pictures. Eighteen chapters ago
you could read a `ld a,(hl)`; today you can build a game from an
empty file on either display the TEC-1G offers.
Every game you write from here starts the way Mover did: one fact,
one picture, and a connection between them. Go and write one.

---

[← A VDP Game](17-a-vdp-game.md) | [Book](index.md)
