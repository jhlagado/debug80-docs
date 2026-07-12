---
layout: default
title: "A Small Matrix Game"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 14
---

[← Cards](13-cards.md) | [Book](index.md) | [Reading Tetro →](15-reading-tetro.md)

# Chapter 14 - A Small Matrix Game

Every chapter since the sixth has handed you an instrument. The matrix
profile draws, timers and ramps schedule, shapes and sounds and the
LCD announce, arrays hold boards, parts split files, and cards turn a
program into a game with screens. Each arrived alone, solving one
small program's problem. A game asks for all of them at once, and
this chapter spends them together.

The game is *Skyfall*. Blocks fall from the top row in random columns.
You slide a three-pixel paddle along the bottom with held 4 and 6.
Catch a block and the score climbs on the seven-segment display, a
chirp sounds, and the next block falls a little faster. Miss, and a
buzz takes one of your three lives. A splash card waits for any key, a
game-over card names the ending on the LCD, and after a short pause
any key starts the sky falling again.

Before a line of it is written, this chapter teaches the habit that
makes games this size comfortable: design first, in Glimmer's own
terms. A Glimmer game's declarations *are* its design - the facts, the
moments, the schedules, the resources, the screens. Settle those on
paper and the blocks that remain are small Z80 exercises, each with
one job you have already named.

## The game on paper

Start with the facts Skyfall must remember between frames:

| Fact | Type | Job |
|------|------|-----|
| `PadX` | byte | the paddle's left column, 0..5 |
| `DropX` | byte | the falling block's column |
| `DropY` | byte | the falling block's row |
| `Score` | word | catches so far, shown on the seven-segment display |
| `Lives` | byte | misses left, shown on the LCD |
| `Armed` | byte | game-over gate: restart allowed |

Then the moments, and where each comes from and goes to:

| Moment | Fired by | Consumed by |
|--------|----------|-------------|
| `LeftP`, `RightP` | held 4 and 6 | sliding the paddle |
| `FallTick` | the gravity timer | the drop falls one row |
| `AnyKeyP` | any key | leaving Splash; restarting from GameOver |
| `GateP` | a one-shot timer | opening the restart gate |

Two schedules drive them. `Gravity` is an oscillator with period 18,
and the period is the game's difficulty: catches will write it
smaller, the move chapter 7 taught. `Wait` is a one-shot word timer,
idle at zero until the game-over card arms it - chapter 7's delayed
moment, spent at last.

The resources: one green 3x1 `shape` for the paddle, a high `sound`
for catches, a low one for misses, and six `text` strings for the LCD.
And the screens: three cards, `Splash`, `Playing`, `GameOver`, joined
in a loop - any key leaves Splash, the last life leaves Playing, and
an armed press leaves GameOver for Splash again.

Add the budget check that ends every design pass. Facts, moments, and
`CurrentCard` each take one of the program's 32 change-flag cells:
six facts, five moments, one card cell - twelve, with room to spare.
Timer cells carry no flag, and `FrameCount` costs nothing in a program
that never names it. Skyfall fits, on paper, before any block exists.

## The entry file

The design above, typed in. Skyfall follows the shape chapter 12
taught: an entry file holding the declarations, and one part holding
the cards and blocks.

```text
; Skyfall - catch the falling blocks.
; Declarations here; the cards and blocks live in skyfall-rules.glim.

program Skyfall

platform tec1g-mon3
display matrix8x8

part "skyfall-rules.glim"

; --- facts ---

state PadX  : byte = 3          ; paddle's left column, 0..5
state DropX : byte              ; falling block's column
state DropY : byte              ; falling block's row
state Score : word              ; catches so far
state Lives : byte              ; misses left before game over
state Armed : byte              ; game-over gate open: restart allowed

; --- moments ---

pulse LeftP
pulse RightP
pulse FallTick
pulse AnyKeyP
pulse GateP

; --- schedules ---

timer Gravity : byte = 18 -> FallTick     ; writable: catches quicken it
timer Wait    : word = 0  -> GateP once   ; armed on game over

; --- input ---

bind key KEY_4 held period 4 -> LeftP
bind key KEY_6 held period 4 -> RightP
bind key any   rising -> AnyKeyP

; --- resources ---

shape Paddle color green
  "XXX"
end

sound Catch len 8  div 2
sound Miss  len 40 div 10

text MsgTitle "SKYFALL         "
text MsgRun   "CATCH THE BLOCKS"
text MsgOver  "GAME OVER       "
text MsgAny   "PRESS ANY KEY"
text MsgLives "LIVES "
text MsgPad   "      "
```

Fifty lines: the design again, in a form the build can check. Two
details reward a closer look.

No fact carries the `changed` modifier. Every program so far used
`changed` to draw its first picture, and Skyfall's screens all belong
to cards - each card's `enter` block will re-raise what its renders
need, the pattern chapter 13 taught. Startup takes care of itself.

The row-one messages are all padded to sixteen characters. The LCD
keeps whatever was last written, and three cards take turns with the
same two rows, so each message is sized to cover the longest message
that ever shares its row. `MsgPad`, six spaces, does the same job for
the tail of row two.

## A helper and the splash card

The rules file opens with a routine, declared before the first `card`
line so it reads as belonging to the whole game:

```text
; Skyfall's rules - a part of skyfall.glim.

; A = a random column, 0..7. Both spawns call it.
routine RandCol
begin
    ld c,ApiRandom
    rst $10             ; A = random byte, destroys B
    and %00000111
end

card Splash

enter SplashShow
begin
    call FbClear
    call HudBlankDig
    lcd_row MsgTitle, LcdRow1
    lcd_row MsgAny,   LcdRow2
end

effect StartGame
    on AnyKeyP
    goto Playing
end
```

`RandCol` is where the sky gets its randomness. MON-3's API dispatcher
sits behind `rst $10` with the call number in C, the same doorway the
`lcd_row` op walks through, and `ApiRandom` is one of the equates
every generated file carries: it returns a random byte in A and
destroys B. Masking with `%00000111` folds the byte to a column,
0..7. Two blocks will spawn drops - the round's first, and every
respawn after a landing - so the three lines live in a routine both
can `call`.

The card itself is chapter 13's opening move: `SplashShow` runs once
on entry, darkens both board displays, and writes the title and the
invitation, and `StartGame` routes any press straight to play.

## Starting a round

```text
card Playing

enter StartRound
    updates Score, Lives, PadX, DropX, DropY, Gravity
begin
    lcd_row MsgRun, LcdRow1
    ld hl,0
    ld (Score),hl
    ld a,3
    ld (Lives),a
    ld (PadX),a         ; 3: the paddle starts centred
    ld a,18
    ld (Gravity),a      ; the pace every round climbs from
    call RandCol        ; first drop: random column, top row
    ld (DropX),a
    xor a
    ld (DropY),a
end
```

One block resets the whole round: score to zero, three lives, paddle
centred, gravity back to its opening pace, and a first drop at the
top of a random column. The `updates` line is the startup story. Its
marks reach the card's renders the same frame, so the board, the
score, and the lives readout all appear the moment play begins, on
the first round and on every replay.

`Gravity` in that list echoes chapter 7: a timer cell carries no
change flag, so its entry compiles to nothing, and the line stands as
the block's declaration that it writes the pace - for the dependency
report, and for you.

## Steering the paddle

```text
effect SlideLeft
    on LeftP
    updates PadX
begin
    ld a,(PadX)
    or a
    jr z,_stop          ; at the left edge: stay
    dec a
    ld (PadX),a
_stop:
end

effect SlideRight
    on RightP
    updates PadX
begin
    ld a,(PadX)
    cp 5
    jr nc,_stop         ; column 5 puts the right edge at 7: stay
    inc a
    ld (PadX),a
_stop:
end
```

Mover's rules from chapter 1, with one number moved: the right stop
is 5, because the paddle's own width claims the last two columns -
its right edge reaches 7, so every column a block can fall in is
catchable. The held period of 4 makes the paddle quick. Crossing the
whole board costs twenty frames, a third of a second, which the late
game will demand.

## The drop

One rule carries the whole game. Every `FallTick`, the drop moves
down a row; the frame it would enter row 7, the paddle's row, the
landing resolves instead.

```text
effect Fall
    on FallTick
    updates DropY, DropX, Score, Lives, Gravity, CurrentCard
begin
    ld a,(DropY)
    inc a
    cp 7
    jr c,_store         ; rows 1..6: keep falling
    ; row 7 is the paddle's row: resolve the landing
    ld a,(PadX)
    ld b,a
    ld a,(DropX)
    sub b               ; how far right of the paddle's left edge?
    cp 3
    jr nc,_miss         ; 3 or more - or underflowed: beside the paddle
    ld hl,(Score)
    inc hl
    ld (Score),hl
    call Snd_Catch
    ld a,(Gravity)      ; every catch quickens the fall, floor at 6
    cp 7
    jr c,_next
    dec a
    ld (Gravity),a
    jr _next
_miss:
    call Snd_Miss
    ld a,(Lives)
    dec a
    ld (Lives),a
    jr nz,_next
    ld a,Card.GameOver  ; the last life: leave the board
    ld (CurrentCard),a
_next:
    call RandCol        ; a fresh drop at the top
    ld (DropX),a
    xor a               ; back to the top row
_store:
    ld (DropY),a
end
```

The catch test is three instructions. After `sub b`, A holds the
drop's offset from the paddle's left edge; the paddle covers offsets
0, 1, and 2. A drop left of the paddle underflows to 253 or higher,
so the one unsigned `cp 3` sorts every landing, both sides of the
paddle included: carry means caught.

A catch scores, chirps, and turns the difficulty screw: `dec a` and a
store into `Gravity`, the timer's next reload counting from the new
period, with `cp 7` holding a floor of 6. Pacing is the same ordinary
write it was in Drip - here it answers the score instead of a ramp.

A miss buzzes and spends a life, and the last life writes
`Card.GameOver` into `CurrentCard` - conditional navigation, chapter
13's rule for transitions that depend on a runtime test. Either way
the block falls into `_next`: a new drop spawns at the top of a
random column, and `_store` files the row. The switch to GameOver
lands at the next frame start, so this frame's renders still run and
the final board reaches the screen.

## Pictures and numbers

Three renders, one per instrument.

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

render ShowScore
    on Score
begin
    ld hl,(Score)
    call HudWriteU16
end

render ShowLives
    on Lives
begin
    lcd_row MsgLives, LcdRow2
    ld a,(Lives)        ; the cursor sits after the string: add the digit
    add a,'0'
    ld c,ApiCharToLcd
    rst $10
    ld hl,MsgPad        ; blank the rest of the old row-2 message
    ld c,ApiStringToLcd
    rst $10
end
```

`DrawBoard` repaints the whole scene whenever anything on it moved:
clear, plot the drop, draw the paddle shape. `FbPlot` clobbers B, DE,
and HL, so the paddle's arguments load after the drop is plotted -
the register hygiene chapter 9 attached to these calls.

`ShowLives` extends the `lcd_row` idiom by one step. The op positions
the LCD cursor and streams its string, and the cursor advances with
every character written - so when `MsgLives` ends, the cursor rests
exactly where the digit belongs. One `ApiCharToLcd` call drops it in,
and `MsgPad` streams six spaces over whatever the previous card left
behind: a render that owns a row writes the whole row.

## Game over, gated

```text
card GameOver

enter GameOverShow
    updates Armed, Wait
begin
    lcd_row MsgOver, LcdRow1
    xor a
    ld (Armed),a        ; close the gate
    ld hl,90            ; a second and a half before restart arms
    ld (Wait),hl
end

effect OpenGate
    on GateP
    updates Armed
begin
    lcd_row MsgAny, LcdRow2
    ld a,1
    ld (Armed),a
end

; Conditional navigation: restart only once the gate is open.
effect Restart
    on AnyKeyP
    updates CurrentCard
begin
    ld a,(Armed)
    or a
    jr z,_wait
    ld a,Card.Splash
    ld (CurrentCard),a
_wait:
end
```

The gate answers a playtesting problem: the player who dies mashing
the keys would sail straight through an ungated game-over screen
without reading it. `GameOverShow` closes the gate and arms the
one-shot - ninety frames, a second and a half at the scan's sixty-odd
frames a second. When `GateP` arrives, `OpenGate` writes the
invitation on row two and opens the gate; until then, `Restart`
swallows every press at `jr z,_wait`.

The press that finally restarts fires `AnyKeyP` once. Card switches
land at the next frame start and pulses clear at frame end, so Splash
wakes to a quiet keypad and waits for a press of its own - three
distinct presses walk the loop from game over to falling blocks, and
each card hears exactly one.

## The design, printed

The chapter began with the design as tables. The toolchain ends it by
printing the same design back, computed from the program itself:

```sh
glimmer --deps skyfall.glim
```

```text
program Skyfall
  PadX : state byte
    raised by: StartRound, SlideLeft, SlideRight
    triggers:  DrawBoard (render)
  DropX : state byte
    raised by: StartRound, Fall
    triggers:  DrawBoard (render)
  DropY : state byte
    raised by: StartRound, Fall
    triggers:  DrawBoard (render)
  Score : state word
    raised by: StartRound, Fall
    triggers:  ShowScore (render)
  Lives : state byte
    raised by: StartRound, Fall
    triggers:  ShowLives (render)
  Armed : state byte
    raised by: GameOverShow, OpenGate
    triggers:  (nothing)
  LeftP : pulse
    raised by: key KEY_4 (held)
    triggers:  SlideLeft (logic)
  RightP : pulse
    raised by: key KEY_6 (held)
    triggers:  SlideRight (logic)
  FallTick : pulse
    raised by: timer Gravity
    triggers:  Fall (logic)
  AnyKeyP : pulse
    raised by: key any (rising)
    triggers:  StartGame (logic), Restart (logic)
  GateP : pulse
    raised by: timer Wait
    triggers:  OpenGate (logic)
  Gravity : timer
    raised by: StartRound, Fall
    triggers:  (nothing)
  Wait : timer once
    raised by: GameOverShow
    triggers:  (nothing)
  CurrentCard : card state (built-in; cards: Splash, Playing, GameOver)
    raised by: StartGame, Fall, Restart
    triggers:  SplashShow (logic), StartRound (logic), GameOverShow (logic)
```

Read it against the tables from the start of the chapter and the
match is line for line - every fact, every moment, every raiser. A
few entries teach on their own. `AnyKeyP` triggers two blocks in two
different cards, and card gating keeps them from ever both running.
`Gravity` shows `triggers: (nothing)` even though the whole game
dances to it: the hidden countdown is its only consumer, and
`FallTick`, one line up, carries the announcement. And `CurrentCard`
- raised by three blocks, triggering three enters - is the game's
mode graph in four lines.

And `skyfall.main.asm` tells the startup story in two bytes:

```asm
Changed0:         .db %00000000   ; flags dispatch tests
Changed1:         .db %00001000   ; flags dispatch tests
```

Twelve flag cells fill bank 0 and spill into bank 1, and at boot
every bit is clear except one: bit 3 of `Changed1`, which is
`CurrentCard`'s. The whole game unfolds from that single set bit -
`SplashShow` runs on the first frame, the title appears, and
everything after follows from presses and ticks.

Build it, run it under Debug80, and play. The first drop falls at a
stroll; ten catches in, the sky has an opinion; a few more and
survival hangs on the paddle's top speed. When a run ends, the LCD
says so, holds you for a breath, and asks for a key.

## Summary

- Design a game in Glimmer's own terms before writing blocks: facts,
  moments, schedules, resources, and cards, with a flag-cell budget
  check - Skyfall spends 12 of the 32.
- The entry file holds the declarations and the part holds the cards
  and blocks: the design and the craft, one file each.
- `ApiRandom` is MON-3's random byte, called with `rst $10` and the
  call number in C; it returns A and destroys B. Mask it for a column.
- Scoring and pacing are ordinary state changes: a catch increments a
  word and writes a smaller period into the gravity timer, floor
  included.
- One unsigned compare resolves a landing: subtract the paddle's
  column and `cp` the width, and underflow sends both misses to the
  same branch.
- Cards need no `changed` modifiers: each card's `enter` block
  re-raises what its renders need, and boot itself is one set bit -
  `CurrentCard`'s - in the change flags.
- A one-shot timer and a gate fact turn "press any key" into "read
  the screen, then press any key".

Skyfall is a complete Glimmer game, and yours to bend: wider paddle,
faster floor, two drops. Next, the same instruments under real
pressure - reading Tetro, the largest matrix game in the repository.

---

[← Cards](13-cards.md) | [Book](index.md) | [Reading Tetro →](15-reading-tetro.md)
