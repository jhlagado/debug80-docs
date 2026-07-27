---
layout: default
title: "Building Skyfall"
parent: "Glimmer Book 2 — Building Complete Z80 Games"
nav_order: 1
---

# Building Skyfall

Glimmer Book 1 introduced each component in a deliberately small
program: the drawing profile for the 8x8 RGB LED matrix, timers and
ramps, shapes and sounds, LCD text, arrays, parts and cards. Skyfall
combines them in one game.

The game is called *Skyfall*.
Blocks fall from the top row of the 8x8 matrix in random columns, and
you slide a three-pixel paddle along the bottom with held 4 and 6,
trying to be underneath when they arrive. Catch a block and the score
climbs on the seven-segment display, a chirp sounds, and the next
block falls a little faster. Miss, and a buzz takes one of your three
lives. A splash card responds to any key, a game-over card names the
ending on the LCD, and after a short pause any key starts the sky
falling again.

A game this size begins with its declarations. They record the facts,
moments, schedules, resources and screens. Once those are settled on
paper, the game structure is visible and each remaining block becomes a small Z80 exercise
with one named job. The rest of the design (the collision rules, the
balance numbers, how the game feels under the thumb) is in those
blocks and those numbers,
and each choice appears where it first matters. The finished source is
included as <a href="/glimmer-book/book2/code/skyfall.glim">skyfall.glim</a>
and <a href="/glimmer-book/book2/code/skyfall-rules.glim">skyfall-rules.glim</a>.

## The game on paper

A designer starts with the values stored between frames:

| Fact | Type | Job |
|------|------|-----|
| `PadX` | byte | the paddle's left column, 0..5 |
| `DropX` | byte | the falling block's column |
| `DropY` | byte | the falling block's row |
| `Score` | word | catches so far, shown on the seven-segment display |
| `Lives` | byte | misses left, shown on the LCD |
| `Armed` | byte | game-over gate: restart allowed |

The paddle is three pixels wide, and that is a choice about kindness:
on an eight-column board a single-pixel catcher would score only on
perfect placement, while three columns leave room for a near miss
and, a bonus we will collect later, make the catch test three
instructions. Three
wide also means `PadX`, the left column, runs 0..5 rather than 0..7,
and you will meet that 5 again in the steering rule. One `DropX` and
one `DropY`, because Skyfall drops one block at
a time, a deliberate simplification that keeps all falling-block state in a
single rule, a simplification you could later lift with an array.
`Score` is a word because I have watched people get good at this game.
`Lives` is three because that is the arcade's oldest tuning: one life
makes every slip fatal, five makes misses free, three keeps a miss
expensive and the evening going. And `Armed`, the odd one out (a
gate for the game-over screen), answers a problem you only meet in
playtesting; the game-over card uses it to delay restarts.

Next, the moments, and for each one, where it comes from and who
consumes it:

| Moment | Fired by | Consumed by |
|--------|----------|-------------|
| `LeftP`, `RightP` | held 4 and 6 | sliding the paddle |
| `FallTick` | the gravity timer | the drop falls one row |
| `AnyKeyP` | any key | leaving Splash; restarting from GameOver |
| `GateP` | a one-shot timer | opening the restart gate |

Two schedules drive them. `Gravity` is an oscillator with period 18,
the difficulty of the game, stored where a fact belongs. Eighteen
frames a row is a stroll (the opening drop takes 126 frames to cross
the board), and
every catch will write the period smaller.
`Wait` is a one-shot word timer, idle at zero until the game-over card
arms it as a delayed moment.

The resources are one green 3x1 `shape` for
the paddle, a high `sound` for catches, a low one for misses, and six
`text` strings for the LCD. And the screens: three cards, `Splash`,
`Playing`, `GameOver`, joined in a loop: any key leaves Splash, the
last life leaves Playing, and an armed press leaves GameOver for
Splash again.

One design step remains: the budget check. Facts, moments, and
`CurrentCard` each take one of the program's 32 change-flag cells.
Skyfall uses six facts, five moments, and one card cell: twelve flags,
leaving twenty available. Timer cells carry no change flags, and the
unnamed `FrameCount` uses none.

![Skyfall on paper, before a block is written.](../../assets/images/glimmer-book/book2/skyfall-design.svg)

## The entry file

Skyfall uses an entry file for declarations and one part for cards and
blocks, keeping the design
in one file, the craft in the other.

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

The cards handle startup: every screen is associated with a card, and
each card's `enter` block re-raises what its renders need.
Every program so far used `changed` to draw its first picture, and
Skyfall is the first with the modifier nowhere in the file.

And the row-one messages are all padded to sixteen characters. The LCD
keeps whatever was last written, and three cards take turns with the
same two rows, so each message is sized to cover the longest message
that ever shares its row. `MsgPad`, six spaces, does the same job for
the tail of row two.

## A helper and the splash card

The rules file opens with a routine, declared
before the first `card` line so it belongs to the whole game and every
card can call it.

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

`RandCol` generates a random column, and it is a routine
because two different blocks call it: the round's
first drop and every respawn after a landing both need a fresh column.
MON-3's API dispatcher sits behind `rst $10` with the call number in
C, the same doorway the `lcd_row` op walks through, and `ApiRandom` is
one of the equates every generated file carries: it hands back a
random byte in A and destroys B. Masking with `%00000111` folds the
byte to a column, 0..7.

## Starting a round

Every game with replay needs one block that puts the world back the
way it was, and a card system gives you exactly one right place for
it: the `enter` block of the playing card, which runs on the first
round and on every replay alike.

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

The `updates` marks reach the card's renders the same frame, so the
board, the score, and the lives readout all appear the moment play
begins, on the first round and on every replay.

`Gravity` in that list documents the write. The store in the body
changes the pace, and the header records that relationship for the
dependency report and future maintenance.

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

These are Mover's rules with one number changed: the
right stop is 5, the ceiling we chose at the design table when we made
the paddle three wide. Its right edge reaches column 7, so every
column a block can fall in is catchable. The held period of 4 is the
other tuned number here: crossing the board takes twenty frames, about
a third of a second, which matches the reaction time available late in
the game.

## The drop

Every `FallTick`, the drop moves down a row; on the frame it would
enter row 7, the paddle's row, the landing resolves instead.

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

After `sub b`, A holds the drop's offset from the paddle's left
edge, and the paddle covers offsets 0, 1, and 2. A drop left of the
paddle underflows to 253 or higher, so the one unsigned `cp 3` sorts
every landing, both sides of the paddle included: carry means caught.

A catch scores, chirps and increases the difficulty: `dec a` and a
store into `Gravity`, the timer's next reload counting from the new
period, with `cp 7` holding a floor of 6 so the game gets hard and
stays playable. Pacing is the same ordinary write it was in Drip;
here score events trigger the write instead of a ramp.

A miss buzzes and removes a life, and the last life writes
`Card.GameOver` into `CurrentCard`, the conditional form of a
transition. Either way
the block falls into `_next`: a fresh drop spawns at the top of a
random column, and `_store` stores the row. One timing detail: the
switch to GameOver lands at the next frame start, so
this frame's renders still run and the final board reaches the screen.

## Pictures and numbers

Three renders, one per instrument: the 8x8 matrix, the seven-segment
display, the LCD.

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
and HL, so the paddle's arguments
load after the drop is plotted, as required by the calls' register
contracts.

`ShowLives` extends the `lcd_row`
idiom by one step. The op positions the
LCD cursor and streams its string, and the cursor advances with every
character written, so when `MsgLives` ends, the cursor is exactly
where the digit belongs. One `ApiCharToLcd` call drops it in, and
`MsgPad` streams six spaces over whatever the previous card left
behind. A render responsible for an LCD row writes the complete row.

## Game over, gated

The player who loses the last life is, at that instant, mashing 4 and
6 as fast as they can, and `bind key any` fires on all of it: an ungated
game-over screen would flash past unread. The fix is a gate that opens
on a delay.

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

`GameOverShow` closes the gate and arms the one-shot: ninety frames,
long enough to read a sixteen-character verdict, short enough to keep
the game moving. When `GateP` arrives, `OpenGate` writes the
invitation on row two and opens the gate; until then, `Restart`
returns at `jr z,_wait` without changing cards.

The press that finally restarts fires `AnyKeyP` once. Card
switches land at the next frame start and pulses clear at frame end.
Splash therefore becomes active with no pulse set. Two distinct
presses move from game over to falling
blocks, one to each card.

In a Debug80 build, the pacing changes over several rounds. The first
drop falls at a stroll;
ten catches in, the pace is markedly faster; a few more and survival
hangs on the paddle's top speed.
Every part of that feel is a number you wrote: the 18, the 4, the 6,
the 90.

![Skyfall in play: the drop in column 5, the paddle covering columns 4 to 6.](../../assets/images/glimmer-book/book2/skyfall-play.svg)

## The design, printed

Now the toolchain prints the same design back, computed from the
program itself.

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

The report matches the tables
from the start of the chapter line for line: every fact, every
moment, every raiser. It is generated from the declarations, so a
difference from the design tables tells you exactly which connection
needs review.

`AnyKeyP` triggers two blocks in two
different cards, and card gating runs exactly one of them.
`Gravity` shows `triggers: (nothing)` even though the whole game
dances to it: the hidden countdown is its only consumer, and
`FallTick`, one line up, carries the announcement. And `CurrentCard`
(raised by three blocks, triggering three enters) is the game's mode
graph in four lines.

`skyfall.main.asm` records the startup state in two bytes:

```asm
Changed0:         .db %00000000   ; flags dispatch tests
Changed1:         .db %00001000   ; flags dispatch tests
```

Twelve flag cells fill bank 0 and spill into bank 1, and at boot every
bit is clear except one: bit 3 of `Changed1`, which is
`CurrentCard`'s. That single set bit triggers the startup sequence:
`SplashShow` runs on the first frame, the title appears, and
everything after follows from presses and ticks.

Skyfall can be extended with a wider paddle, a faster floor or two
drops at once. The next chapter shifts from building to reading:
Tetro, the largest repository game for the 8x8 matrix, using the same
components: [Reading Tetro](02-reading-tetro.md).

## Exercise

**Landing on the paddle.** With `PadX = 3`, the paddle covers columns 3, 4 and 5. Which of the drop columns 2, 3, 5 and 6 count as catches, and how does the unsigned subtraction reject a drop to the left of the paddle?

[Exercise notes](exercise-notes.md#chapter-1-building-skyfall)
