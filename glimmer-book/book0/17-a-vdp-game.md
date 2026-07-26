---
layout: default
title: "A VDP Game"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 17
---

[← The TMS9918 Profile](16-the-tms9918-profile.md) | [Book](index.md) | [Two Displays, One Language →](18-two-displays-one-language.md)

# Chapter 17 - A VDP Game

Skyfall
never tested whether two shapes had met. It never had to: the paddle
and the drop shared the same eight columns, because the 8x8 RGB LED
matrix is a board, and on a board a landing is one subtraction
against a column number. The VDP takes that certainty away. Sprites stand
at pixel positions on a 256x192 scene, gliding over a tile grid they
never disturb, and the questions change with the scenery: when have
two sprites actually met? And how does something sitting in the grid
get picked up by something floating above it?

This chapter builds a
complete game around those two questions: *Lanternfly*. You are a
white fly over a night garden, steered with 2/4/6/8, one pixel per
frame. A lantern glows somewhere in the grid; reach its cell and you
gather it, the score climbs on the LCD, and a fresh lantern appears
somewhere else. A wasp hunts you the whole time, and every lantern
you take quickens its stride. When it reaches you, the game ends.
Around all of it stand the splash, playing and game-over cards, now
running over VRAM shadows. The complete source ships with this book as
[lanternfly.glim](code/lanternfly.glim). Keep it open beside the
chapter: the text concentrates on the parts specific to this game,
while the four movement effects follow Grove and the GameOver card
follows Skyfall.

![Lanternfly in play: the fly among the reeds, the lantern lit, the wasp closing.](../../assets/images/glimmer-book/book0/lanternfly-play.svg)

## Lanternfly on paper

Start with the design in Glimmer's terms before writing any block.
For Lanternfly, the facts
split into two coordinate systems, and that split is the whole
chapter in miniature. Sprites glide, so `FlyX`/`FlyY` and
`WaspX`/`WaspY` hold the two movers' top-left pixels. The lantern
sits in the grid and never moves between cells, so `LampCol` and
`LampRow` hold a grid column and row. `Score` counts lanterns for the
LCD, and `Armed` gates the restart.

The moments: four held pulses steer the fly, `ChaseTick` moves the
wasp, `AnyKeyP` starts and restarts, and `GateP` opens the restart
gate. Two schedules drive `ChaseTick` and `GateP`: `Pace`, a writable
oscillator that is at once the wasp's stride and the game's difficulty, and
`Wait`, the game-over one-shot. These timers serve the same roles as
Skyfall's, and the three cards form the same loop. Run the budget check: eight facts,
seven moments, and `CurrentCard` spend 16 of the 32 change-flag
cells.

## The scene and the declarations

The file opens the way Grove's did (`program Lanternfly`, the
platform line, `display tms9918`), and then it declares the cast.
Here are the two members you meet first:

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
color medgreen on black`, follow in the same shape. Their rows are
yours to draw; any eight strings of `X` and `.` will serve. The build
depends on the order and the colour pairs, not the artwork:
the sprites take slots 0 and 1, Lantern's pair comes first so that
black is the screen background, and Reed's pair opens the next bank.
The generated equates read `Lantern .equ 1`, `Reed .equ 8`. The rest
of the file's top is your paper design, typed in:

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

No fact carries `changed` (the cards own
startup, exactly as they did in Skyfall), and every row-one message is
padded to sixteen characters so that each card's writing covers
whatever the previous card left behind. And the initial values: fly at
the centre, wasp in the far
corner, lantern at cell (24, 6).

## The splash card plants the garden

Grove planted its scene with a changed cell; a card can do the same
job with an `enter` block:

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

Five `tile_at` lines stand five reeds in the dark, their coordinates
written as immediates because the reeds never move. The two calls
after them clear the stage. The first knows the lantern only through
state: wherever the last round left it, `LampCol` and `LampRow` still
say so, and the block loads them into D and E and writes the blank
tile through `NamePut`, the runtime-coordinate path. The second parks
sprite slot 0 at y = `$D1`, the terminator value used at startup: the
VDP stops processing sprites at the first slot
holding it, so one write hides the fly and the wasp together. On the
very first frame both calls touch cells already blank and a sprite
already hidden, and no harm comes of either. The card's one effect,
`StartGame`, is the opening move: `on AnyKeyP`,
`goto Playing`.

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

The entry re-raise is needed because a card-gated render never sees
flags raised while its card slept, so
when the card wakes, its renders have missed everything. The `updates` line is the sleeping
card catching
up on the news: it names every cell the Playing renders read, and
entry marks them all, so the first frame of play repaints the whole
scene. And now the idiom has real stakes, because the body writes the
round-start values *first*, and replay falls out of that ordering:
every round begins exactly where the first one did, repainted from
fresh values, with no separate reset path to write or get wrong.
`Pace` closes the list the way `Gravity` closed Skyfall's; a timer
cell carries no flag, so its entry documents the write and compiles
to nothing.

Four move effects steer the fly. They are Grove's four moves with the
moth's cells and pulses renamed for the fly, so
they are not printed here. Up and left stop at zero, down at 184,
right at 248, each on its own held pulse at period 1.

## The chaser

The wasp needs no cleverness:

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

Every `ChaseTick`, one compare per axis points the wasp at the fly.
Carry out of `cp b` means the wasp sits left of, or above, its
target, so it steps toward; no carry steps the other way; equal skips
the axis. The wasp needs no clamps of its own: it only ever
steps toward the fly, and the fly's own clamps fence the space, so
the hunter can never reach a wall its prey is not already pressed
against. The stride is `Pace`. At the opening period of 8 the wasp
drifts, and every gathered lantern will shrink the period, all the
way down to 1, a step every frame on both axes at once, which is
faster than you: the keypad moves the fly one axis at a time, and the
wasp corners diagonally.

## Gathering from the grid

The fly is in pixels and
the lantern is in cells, so before the two can meet, one coordinate
system has to be converted into the other:

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

Adding 4 picks the pixel at the fly's centre, and three shifts divide
by eight: pixel position to grid cell in four instructions. Either
the cell matches the lantern's column and row or the block leaves. On
a match, the old cell goes blank through `NamePut`
first, and it must go blank
*here*, inside the effect: four lines later the respawn overwrites
`LampCol` and `LampRow`, and after that no render will ever again
know which cell to erase. Then the score climbs, `Pace` shrinks
against its floor (the difficulty screw, turned by an ordinary timer
write, as in Skyfall), and the respawn masks one random byte down to
a column and folds another into rows 4..19, the band the reeds stay
out of.

![The fly's centre pixel, and the cell it falls in.](../../assets/images/glimmer-book/book0/two-coordinate-systems.svg)

`PlaceLantern`, on
`LampCol, LampRow`, is the six-line runtime `NamePut` call from
`SplashShow` with `ld a,Lantern` in place of the `xor a`, and it
earns its keep twice: when `Gather` respawns the lantern mid-round,
and on round entry, when `StartRound`'s re-raise gives the first
lantern its first draw. Two more renders, Grove's `PlaceMoth` twice
over, place the movers: `sprite_at Fly, FlyX, FlyY` in `PlaceFly`,
and the same shape for the wasp in `PlaceWasp`.

The `updates` line raises all four flags every time
`Gather` runs, the misses included, and with `on FlyX, FlyY`,
`Gather` runs on every step the fly takes. So a frame where the fly
merely moved also re-runs `PlaceLantern` and `ShowScore`: the
lantern's name-table row goes back through the commit, and the LCD is
rewritten with the score it already shows. Nothing breaks (a render
redraws from current facts, and redrawing the same picture is a
correct redraw), but bytes move that carried no news. The refinement,
when a game needs it, is to split the work: let the movement-triggered
block do the cheap test alone and raise a pulse only on a catch, then
hang the four-flag effect on that pulse. Lanternfly keeps the simple
shape because it can afford it.

## Colliding with the wasp

And here is the other question the chapter opened with: when have two
sprites met?

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
    cp 6                ; tolerance: boxes overlap deeply
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
conditional `neg` produce the absolute pixel difference on one axis,
and both differences under a tolerance means caught. Skyfall resolved
a landing with one subtraction; sprites spend one per axis, folded
absolute before the compare, the same arithmetic, grown a dimension.
The technique has a name you will meet in every sprite game:
axis-aligned bounding-box collision. Each sprite owns an 8x8 box, the
differences compare the boxes' top-left corners, and at a difference
of 8 the boxes sit edge
to edge, so `cp 8` fires on any box overlap, while at 6 the boxes must
share at least a three-pixel band on each axis. Boxes collide, not
pixels, and that matters for sparse patterns: two thin sprites can
overlap boxes without a single opaque pixel touching. Pixel-perfect
collision would go on to compare the patterns themselves; for a fly
and a wasp with full bodies, deep box overlap reads as contact, and
the tolerance is where you get to be a designer: 8 ends the game the
frame the boxes meet, 6 waits for closeness and gives the player the
near miss they will swear they earned. The ending writes
`CurrentCard` directly because the transition depends on the runtime
collision test.

## The score on the LCD

The seven-segment HUD stayed behind with the 8x8 matrix profile, so
on this hardware the LCD carries the number, extending the idiom
Skyfall's lives display built:

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

`lcd_row` streams its string and leaves the cursor sitting exactly
where the digits belong. The tens digit counts up in B, starting at
`'0'` and stepping once per subtracted ten, then goes out through
`ApiCharToLcd`. After that the block reads `Score` again and reduces it a second time
for the ones digit, deliberately, so no register has to survive the
first API call. The eight spaces of `MsgPad` cover the tail of the splash
card's invitation, so the row reads `LAMPS 07` and nothing else:
whole row owned, every time the score changes.

The counted digits stop at two: past 99 the tens character would
step beyond `'9'` into the character set's punctuation. Treat 99 as
this scoreboard's ceiling (at the pace the wasp closes in, a two-digit
game is a long one), and a
version built to run richer needs either a cap where the digits end
or a hundreds pass in the same counting style.

## Game over, gated

Lanternfly reuses Skyfall's delayed restart gate. `GameOverShow`
closes `Armed` and starts `Wait`; `OpenGate` later writes `MsgAny` and
opens the gate; `Restart` tests `Armed` before writing `Card.Splash`.
Card gating stops the move and chase blocks, so
no shadow changes, no commit carries anything, and VRAM keeps the
final scene exactly as it stood: the wasp frozen on top of the fly
among the reeds, the score on the LCD naming the run. A restart walks
the loop back through Splash, where `SplashShow` hides the actors and
strikes the lantern.

## Inside the generated file

Build the full source (`glimmer build lanternfly.glim` with the
companion file) and open `lanternfly.main.asm` at the render blocks:

```asm
; --- render block PlaceFly ---
.routine
Glim_PlaceFly:
    sprite_at Fly, FlyX, FlyY
        ret
```

The line stands in the generated file exactly as you wrote it, and
that is not an omission: `sprite_at` is an op, so the assembler
substitutes its body at each call site. This one line assembles as
the six instructions from the op definition with this site's
arguments folded in: `FlyX` and `FlyY` read into D and E, `Fly`
becoming `ld a,0`, then `call SpriteSet`. `Glim_SplashShow` reads the
same way, five `tile_at` lines, one op, five expansions, each with
its own reed's coordinates as immediate loads.

The enter block's wrapper shows delivery again:

```asm
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_LAMPCOL + CHG_LAMPROW + CHG_SCORE
        ld      (Raised0),a
        ld      a,(Next0)            ; a consumer already ran: defer to next frame
        or      CHG_FLYX + CHG_FLYY + CHG_WASPX + CHG_WASPY
        ld      (Next0),a
        ret
```

`StartRound` names eight cells, and Glimmer stages them in two
groups, obeying the scheduler's exactly-once rule. `LampCol`, `LampRow`,
and `Score` have render consumers only, so they travel through
`Raised0` and reach `PlaceLantern` and `ShowScore` in the same frame:
the lantern and the score appear the instant play begins. The four
sprite cells also feed `Gather` and `Caught` (logic blocks whose
phase has already run), so that whole change defers through `Next0`,
and the fly and wasp take the stage one frame later.

The same staging sets what motion costs. Hold key 6. Frame N:
`MoveRight` steps `FlyX`, and the change
defers, because `Gather` and `Caught` sit in the same phase. Frame
N+1: the two effects test the new position, `PlaceFly` runs, and
`SpriteSet` files two shadow bytes (y, then x) and sets
`SpriteDirty`. Frame N+2 opens in the vertical blank, `GlimCommit`
sees the flag and streams all 128 sprite-attribute bytes to VRAM, and
the fly stands one pixel to the right. Two frames of latency from
pulse to picture, then, and no cost in rate: the pipeline refills every
frame, so a held key still moves the sprite by one pixel per refresh.
A gather frame adds up to two dirty name rows, 32 bytes each;
a still frame costs the commit one clear flag and three clear group
bytes, and the VDP paints the standing scene without any help from
you.

## Reading Sprite Chase

The repository ships this chapter's cousin:
`examples/sprite-chase.glim`, the same profile with the chase turned
inside out. Your sprite does the hunting, the target flees, and
catching it scores. Its
single `card Playing` opens with the entry re-raise idiom at its
purest: `StartPlaying` has an *empty* body and
four position cells in its `updates` line; the initial values
already hold the scene, so entry marks them and the renders paint
them, `StartRound` with its reset code removed. Its `MovePlayer`
folds the four move effects into one block by reading the pulse cells
directly, `ld a,(UpP)` and its three siblings, which is legal because
a pulse is a byte cell like any other for the frame it holds.

The rest of the file is variations on blocks you have already
written. `FleeTarget` is `ChaseStep` with the conclusion flipped
(carry steps *away*) plus the clamps the wasp never needed, because
fleeing runs into walls. `Collide` is `Caught` at tolerance 8 with a
respawn where your game changes card, and the respawn masks
`ApiRandom` exactly as `Gather` does. The score display swaps
surfaces: `DrawScore` calls `NamePut` with a runtime column and drops
a `Pip` tile on the top grid row, the tile grid itself as
scoreboard, where Lanternfly borrowed the LCD.

The two games have more to say to each other, and the last chapter
reads them side by side:
[Two Displays, One Language](18-two-displays-one-language.md).

---

[← The TMS9918 Profile](16-the-tms9918-profile.md) | [Book](index.md) | [Two Displays, One Language →](18-two-displays-one-language.md)
