---
layout: default
title: "A VDP Game"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 17
---

[← The TMS9918 Profile](16-the-tms9918-profile.md) | [Book](index.md) | [Two Displays, One Language →](18-two-displays-one-language.md)

# Chapter 17 - A VDP Game

Skyfall never asked whether two shapes had met. The paddle and the
drop shared eight columns, so a landing was one subtraction against
a column number: a board game collides by arithmetic on cells. On
the VDP, sprites stand at pixel positions on a 256x192 scene,
gliding over a tile grid they never disturb, and the questions
change with the scenery: when have two sprites met, and how does
something sitting in the grid get picked up by something floating
above it?

Both answers are comparisons on state, and this chapter builds a
complete game around them: *Lanternfly*. You are a white fly over a
night garden, steered with 2/4/6/8, one pixel per frame. A lantern
glows somewhere in the grid; reach its cell and you gather it, the
score climbs on the LCD, and a fresh lantern appears somewhere
else. A wasp hunts you the whole time, and every lantern you take
quickens its stride. When it reaches you, the game ends - splash,
playing, and game-over cards, the loop Skyfall taught, now over
VRAM shadows.

## Lanternfly on paper

Chapter 14's habit first: the design in Glimmer's terms, before any
block. The facts split into two coordinate systems, and the split
is the chapter in miniature. Sprites glide, so `FlyX`/`FlyY` and
`WaspX`/`WaspY` hold the two movers' top-left pixels. The lantern
sits in the grid and never moves between cells, so `LampCol` and
`LampRow` hold a grid column and row. `Score` counts lanterns for
the LCD, and `Armed` gates the restart.

The moments: four held pulses steer the fly, `ChaseTick` moves the
wasp, `AnyKeyP` starts and restarts, `GateP` opens the restart
gate. Two schedules drive the pair - `Pace`, a writable oscillator
that is the wasp's stride and the game's difficulty, and `Wait`,
the game-over one-shot - both jobs Skyfall's timers already did,
and the cards are Skyfall's three, joined in the same three-press
loop. The budget check: eight facts, seven moments, and
`CurrentCard` spend 16 of the 32 change-flag cells.

## The scene and the declarations

The file opens as Grove's did - `program Lanternfly`, the platform
line, `display tms9918` - and then declares the cast:

```text
sprite Fly color white
  "X......X"
  ".X....X."
  "..XXXX.."
  ".XXXXXX."
  ".XXXXXX."
  "..XXXX.."
  "...XX..."
  "........"
end

tile Lantern color lightyellow on black
  "...XX..."
  "..XXXX.."
  ".X.XX.X."
  ".XXXXXX."
  ".XXXXXX."
  "..XXXX.."
  "...XX..."
  "........"
end
```

A second sprite, `Wasp color darkyellow`, and a second tile, `Reed
color medgreen on black`, follow in the same shape; their rows are
yours to draw, and any eight strings of `X` and `.` serve. What the
build cares about is the order and the colour pairs: the sprites
take slots 0 and 1, Lantern's pair comes first so black is the
screen background, and Reed's pair opens the next bank - the
generated equates read `Lantern .equ 1`, `Reed .equ 8`. The rest of
the file's top types in the design:

```text
state FlyX    : byte = 124      ; the fly's top-left pixel
state FlyY    : byte = 92
state WaspX   : byte = 8        ; the wasp's top-left pixel
state WaspY   : byte = 8
state LampCol : byte = 24       ; the lantern's grid cell
state LampRow : byte = 6
state Score   : byte            ; lanterns gathered
state Armed   : byte            ; game-over gate open: restart allowed

pulse UpP
pulse DownP
pulse LeftP
pulse RightP
pulse ChaseTick
pulse AnyKeyP
pulse GateP

timer Pace : byte = 8 -> ChaseTick   ; the wasp's stride; lanterns shrink it
timer Wait : word = 0 -> GateP once  ; armed on game over

bind key KEY_2 held period 1 -> UpP
bind key KEY_8 held period 1 -> DownP
bind key KEY_4 held period 1 -> LeftP
bind key KEY_6 held period 1 -> RightP
bind key any   rising -> AnyKeyP

text MsgTitle "LANTERNFLY      "
text MsgRun   "GATHER THE LAMPS"
text MsgOver  "THE WASP GOT YOU"
text MsgAny   "PRESS ANY KEY   "
text MsgScore "LAMPS "
text MsgPad   "        "
```

No fact carries `changed` - the cards own startup, as in Skyfall -
and the row-one messages are padded to sixteen characters so each
covers whatever the previous card wrote. The initial values are the
round-start scene - fly at the centre, wasp in the far corner,
lantern at cell (24, 6) - and the entry block below leans on them.

## The splash card plants the garden

Chapter 16 planted Grove's scene with a changed cell and promised
cards would do it with an `enter` block. Here it is:

```text
enter SplashShow
begin
    lcd_row MsgTitle, LcdRow1
    lcd_row MsgAny,   LcdRow2
    tile_at Reed, 3, 2
    tile_at Reed, 11, 21
    tile_at Reed, 17, 2
    tile_at Reed, 24, 22
    tile_at Reed, 29, 21
    ld a,(LampCol)      ; take the last round's lantern off the grid
    ld d,a
    ld a,(LampRow)
    ld e,a
    xor a
    call NamePut
    xor a               ; hide slot 0: sprite scanning stops there
    ld d,0
    ld e,$D1
    call SpriteSet
end
```

Five `tile_at` lines stand five reeds in the dark, coordinates
written as immediates because the reeds never move. The two calls
after them clear the stage. The first knows the lantern only
through state: whatever cell the last round left it in, `LampCol`
and `LampRow` still say, so the block loads them into D and E and
writes the blank tile through `NamePut` - the runtime-coordinate
path chapter 16 pointed at. The second parks sprite slot 0 at y =
`$D1`, the terminator value from chapter 16's startup: the VDP
stops processing sprites at the first slot holding it, so one write
hides the fly and the wasp together. On the very first frame both
calls touch cells already blank and a sprite already hidden. The
card's one effect, `StartGame`, is chapter 13's opening move: `on
AnyKeyP`, `goto Playing`.

## Entering play

`card Playing` opens with its enter block:

```text
; Entry re-raises every cell this card's renders draw from; the body
; gives those cells their round-start values first.
enter StartRound
    updates FlyX, FlyY, WaspX, WaspY, LampCol, LampRow, Score, Pace
begin
    lcd_row MsgRun, LcdRow1
    ld a,124
    ld (FlyX),a
    ld a,92
    ld (FlyY),a
    ld a,8
    ld (WaspX),a
    ld (WaspY),a
    ld a,24
    ld (LampCol),a
    ld a,6
    ld (LampRow),a
    xor a
    ld (Score),a
    ld a,8
    ld (Pace),a         ; the wasp starts at a stroll
end
```

The entry re-raise from chapter 13 here carries a whole game. A
card-gated render never sees flags raised while its card slept, so
the `updates` line names every cell the Playing renders read, and
entry marks them all. The body writes the round-start values first,
and replay follows: every round begins exactly where the first did,
repainted from fresh values. `Pace` closes the list the way
`Gravity` closed Skyfall's - a timer cell carries no flag, so its
entry documents the write and compiles to nothing.

Four move effects steer the fly, and they are Grove's four moves
from chapter 16 with the moth's cells and pulses renamed for the
fly: up and left stop at zero, down at 184, right at 248, each on
its own held pulse at period 1.

## The chaser

```text
effect ChaseStep
    on ChaseTick
    updates WaspX, WaspY
begin
    ld a,(FlyX)
    ld b,a
    ld a,(WaspX)
    cp b
    jr z,_vert          ; level: no sideways step
    jr c,_right         ; left of the fly: step right
    dec a
    jr _wx
_right:
    inc a
_wx:
    ld (WaspX),a
_vert:
    ld a,(FlyY)
    ld b,a
    ld a,(WaspY)
    cp b
    jr z,_done
    jr c,_down
    dec a
    jr _wy
_down:
    inc a
_wy:
    ld (WaspY),a
_done:
end
```

Every `ChaseTick`, one compare per axis points the wasp at the fly:
carry from `cp b` means the wasp sits left of - or above - its
target, so it steps toward; no carry steps the other way; equal
skips the axis. The wasp carries no clamps: it only ever steps
toward the fly, whose own clamps fence the space. The stride is
`Pace`: at the opening period of 8 the wasp drifts, and every
gathered lantern will shrink the period, down to 1 - a step every
frame, the fly's own speed, both axes in one tick. Past the first
few lanterns, only cornering saves you.

## Gathering from the grid

The lantern test is the chapter's new move: the fly lives in
pixels, the lantern in cells, so the effect converts one into the
other and compares.

```text
effect Gather
    on FlyX, FlyY
    updates Score, LampCol, LampRow, Pace
begin
    ld a,(FlyX)         ; the grid cell under the fly's centre
    add a,4
    srl a
    srl a
    srl a
    ld b,a
    ld a,(LampCol)
    cp b
    jr nz,_done
    ld a,(FlyY)
    add a,4
    srl a
    srl a
    srl a
    ld b,a
    ld a,(LampRow)
    cp b
    jr nz,_done
    ld a,(LampCol)      ; gathered: take the lantern off the grid
    ld d,a
    ld a,(LampRow)
    ld e,a
    xor a
    call NamePut
    ld a,(Score)
    inc a
    ld (Score),a
    ld a,(Pace)         ; quicken the wasp, floor at one frame
    cp 2
    jr c,_respawn
    dec a
    ld (Pace),a
_respawn:
    ld c,ApiRandom
    rst $10
    and %00011111       ; column 0..31
    ld (LampCol),a
    ld c,ApiRandom
    rst $10
    and %00001111
    add a,4             ; row 4..19: clear of the reeds
    ld (LampRow),a
_done:
end
```

Adding 4 picks the fly's centre pixel, and three shifts divide by
eight: pixel position to grid cell in four instructions. The cell
matches the lantern's column and row or the block leaves. On a
match, the old cell goes blank through `NamePut`, and it must go
blank *here*, inside the effect: four lines later the respawn
overwrites `LampCol` and `LampRow`, and no render will ever again
know which cell to erase. Then the score climbs, `Pace` shrinks
with its floor - the difficulty screw, turned by an ordinary timer
write as in Skyfall - and the respawn masks one random byte to a
column and folds another into rows 4..19, the band the reeds stay
out of.

Drawing the new lantern belongs to a render. `PlaceLantern`, on
`LampCol, LampRow`, is the six-line runtime `NamePut` call from
`SplashShow` with `ld a,Lantern` in place of the `xor a`, and it
serves twice: when `Gather` respawns the lantern mid-round, and on
round entry, when `StartRound`'s re-raise gives the first lantern
its first draw. Two more renders, Grove's `PlaceMoth` twice over,
place the movers: `sprite_at Fly, FlyX, FlyY` in `PlaceFly`, the
same for the wasp in `PlaceWasp`.

## Colliding with the wasp

```text
effect Caught
    on FlyX, FlyY, WaspX, WaspY
    updates CurrentCard
begin
    ld a,(FlyX)
    ld b,a
    ld a,(WaspX)
    sub b
    jr nc,_ax
    neg
_ax:
    cp 6                ; tolerance: the bodies really overlap
    jr nc,_done
    ld a,(FlyY)
    ld b,a
    ld a,(WaspY)
    sub b
    jr nc,_ay
    neg
_ay:
    cp 6
    jr nc,_done
    ld a,Card.GameOver  ; conditional navigation, as in Skyfall
    ld (CurrentCard),a
_done:
end
```

Sprite collision is the distance between two facts. `sub b` and a
conditional `neg` produce the absolute pixel difference per axis,
and both differences under a tolerance means caught. The tolerance
is the design decision: two 8-pixel bodies touch edges at a
difference of 8, so `cp 8` would end the game the frame the boxes
meet, while 6 waits for real overlap and gives the player the near
miss they will swear they earned. Skyfall resolved a landing with
one subtraction; sprites spend one per axis, folded absolute before
the compare. The ending writes `CurrentCard` directly - a
transition that depends on a runtime test, chapter 13's rule.

## The score on the LCD

```text
render ShowScore
    on Score
begin
    lcd_row MsgScore, LcdRow2
    ld a,(Score)
    ld b,'0'            ; tens digit, counted up in ASCII
_tens:
    cp 10
    jr c,_tdone
    sub 10
    inc b
    jr _tens
_tdone:
    ld a,b
    ld c,ApiCharToLcd
    rst $10
    ld a,(Score)        ; ones digit: reduce the score again
_ones:
    cp 10
    jr c,_odone
    sub 10
    jr _ones
_odone:
    add a,'0'
    ld c,ApiCharToLcd
    rst $10
    ld hl,MsgPad        ; cover the tail of the old row-2 message
    ld c,ApiStringToLcd
    rst $10
end
```

The seven-segment HUD stayed with the matrix profile, so the LCD
carries the number, extending the idiom Skyfall's lives display
built: `lcd_row` streams its string and leaves the cursor where the
digits belong. The tens digit counts up in B, starting at `'0'` and
stepping once per subtracted ten, and goes out through
`ApiCharToLcd`; the block then reads `Score` again and reduces it a
second time for the ones digit, so no register has to survive the
first API call. Eight spaces of `MsgPad` cover the tail of the
splash card's invitation: `LAMPS 07`, whole row owned, every time
the score changes.

## Game over, gated

The GameOver card is Skyfall's, keystroke for keystroke:
`GameOverShow` writes `MsgOver` to row one, closes the gate with
`Armed`, and arms `Wait` at 90 frames; `OpenGate` fires on `GateP`,
writes `MsgAny` to row two, and opens the gate; `Restart` tests
`Armed` before writing `Card.Splash`. What the player sees while
the gate holds is new. Card gating stops the move and chase blocks,
so no shadow changes, no commit carries anything, and VRAM keeps
the final scene: the wasp frozen on top of the fly among the reeds,
the score on the LCD naming the run. A restart walks the loop
through Splash, where `SplashShow` hides the actors and strikes the
lantern.

## Inside the generated file

Build the game and open `lanternfly.main.asm` at the render blocks:

```asm
; --- render block PlaceFly ---
.routine
Glim_PlaceFly:
    sprite_at Fly, FlyX, FlyY
        ret
```

The line stands in the generated file exactly as you wrote it,
because `sprite_at` is an AZM op: the assembler substitutes its
body at each call site, so this line assembles as the six
instructions from chapter 16's op definition with this site's
arguments folded in - `FlyX` and `FlyY` read into D and E, `Fly`
becoming `ld a,0`, then `call SpriteSet`. `Glim_SplashShow` reads
the same way: five `tile_at` lines, one op, five expansions, each
with its own reed's coordinates as immediate loads.

The enter block's wrapper is the chapter's second lesson in
delivery:

```asm
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_LAMPCOL + CHG_LAMPROW + CHG_SCORE
        ld      (Raised0),a
        ld      a,(Next0)            ; a consumer already ran: defer to next frame
        or      CHG_FLYX + CHG_FLYY + CHG_WASPX + CHG_WASPY
        ld      (Next0),a
        ret
```

`StartRound` names eight cells and Glimmer stages them in two
groups, by chapter 5's exactly-once rule. `LampCol`, `LampRow`, and
`Score` have render consumers only, so they travel through
`Raised0` and reach `PlaceLantern` and `ShowScore` the same frame:
lantern and score appear the instant play begins. The four sprite
cells also feed `Gather` and `Caught`, logic blocks whose phase has
already run, so the whole change defers through `Next0` and the fly
and wasp take the stage one frame later - a sixtieth of a second
the eye cannot find, spent keeping every consumer's view whole.

The same staging sets what motion costs. Trace a held key 6 through
to the screen. Frame N: `MoveRight` steps `FlyX`, and the change
defers, because `Gather` and `Caught` sit in the same phase. Frame
N+1: the two effects test the new position, `PlaceFly` runs, and
`SpriteSet` files two shadow bytes - y, then x - and sets
`SpriteDirty`. Frame N+2 opens in the vertical blank, `GlimCommit`
sees the flag and streams all 128 sprite-attribute bytes to VRAM,
and the fly stands one pixel to the right. Two frames of latency
from pulse to picture, and none of rate - the pipeline refills
every frame, so the held key still crosses the screen at sixty-odd
pixels a second. A gather frame adds up to two dirty name rows, 32
bytes each; a still frame costs the commit one clear flag and three
clear group bytes, and the VDP paints the standing scene without
help.

## Reading Sprite Chase

The repository ships this chapter's cousin:
`examples/sprite-chase.glim`, the same profile with the chase
turned inside out - your sprite hunts a fleeing target, and
catching it scores. Its single `card Playing` opens with the entry
re-raise idiom at its purest: `StartPlaying` has an *empty* body
and four position cells in its `updates` line - the initial values
already hold the scene, so entry marks them and the renders paint
them, `StartRound` with its reset code removed. Its `MovePlayer`
folds the four move effects into one block by reading the pulse
cells directly, `ld a,(UpP)` and its three siblings, legal because
a pulse is a byte cell like any other for the frame it holds.

The rest of the file reads as variations on your own blocks.
`FleeTarget` is `ChaseStep` with the conclusion flipped - carry
steps *away* - plus the clamps the wasp never needed, because
fleeing runs into walls. `Collide` is `Caught` at tolerance 8 with
a respawn where your game changes card, and the respawn masks
`ApiRandom` exactly as `Gather` does. The score display swaps
surfaces: `DrawScore` calls `NamePut` with a runtime column and
drops a `Pip` tile on the top grid row, the tile grid itself as
scoreboard where Lanternfly borrowed the LCD. Build it and corner
the target; every technique in it is now yours.

## Summary

- Sprite collision is state arithmetic: absolute pixel difference
  per axis, each under a tolerance. 8 means bounding boxes touch;
  smaller tolerances demand overlap.
- Tile-grid pickups compare cells: centre the sprite (+4), divide
  by eight (three shifts), and match the pickup's cell state. Fixed
  scenery takes `tile_at` immediates; a moving pickup takes
  `NamePut` with runtime coordinates, and the effect that respawns
  it erases the old cell itself.
- The entry re-raise carries the profile's cards: `updates` names
  every cell the card's renders read, the body writes round-start
  values, and replay repaints from fresh state. Render-only cells
  arrive the same frame through `Raised0`; cells with logic
  consumers defer whole through `Next0`.
- Motion costs two frames from pulse to picture - defer, shadow
  write, commit - with no loss of rate.
- The LCD is this profile's number surface: `lcd_row` parks the
  cursor, repeated subtraction makes ASCII digits for
  `ApiCharToLcd`, and a padding string owns the rest of the row.

Two complete games now stand finished, one on each display. The
last chapter reads them side by side.

---

[← The TMS9918 Profile](16-the-tms9918-profile.md) | [Book](index.md) | [Two Displays, One Language →](18-two-displays-one-language.md)
