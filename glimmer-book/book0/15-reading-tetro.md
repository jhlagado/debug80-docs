---
layout: default
title: "Reading Tetro"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 15
---

[← A Small Matrix Game](14-a-small-matrix-game.md) | [Book](index.md) | [The TMS9918 Profile →](16-the-tms9918-profile.md)

# Chapter 15 - Reading Tetro

You built Skyfall in the last chapter, from an empty file to a
finished game. This chapter teaches a different skill: reading someone
else's code. Writing teaches you what the language can say; reading a
program bigger than any you have written teaches you what the language
looks like under real pressure. Tetro is the largest example for the
8x8 RGB LED matrix in the Glimmer repository: seven pieces that rotate, a board that
remembers colour, line clears that flash before they collapse, a piece
preview on the LCD, and a game over that guards its own restart key.
This chapter adds no new program. We walk through a finished one, and
the route through it is the lesson.

Tetro is three files, about 900 lines together. `tetro.glim` holds
the declarations. `tetro-rules.glim`, brought in with `part`, holds
the cards and blocks. `tetro-lib.asm`, brought in with `import`,
holds the board engine: collision, locking, line clearing, and the
board draw. Read them in that order, because it is the
order a larger Glimmer game answers questions in: the declarations say
what exists, the blocks say what happens, and the engine says how the
heavy work gets done.

Get the code where you can work with it. Copy the three files from
`examples/` in the Glimmer repository into a working directory, build
the entry file (`glimmer build tetro.glim` on Appendix D's command
line), and keep all three files open in your editor while you read.
Every generated excerpt in this chapter comes from the
`tetro.main.asm` that build writes - 1392
lines with the whole game inside. Comments citing "corpus" refer to
the earlier Tetro this example was adapted from, kept as
cross-references.

## Three files, one program

Open `tetro.glim` first. The top of the file:

```text
program Tetro

platform tec1g-mon3
display matrix8x8

part "tetro-rules.glim"
import "tetro-lib.asm"
```

You met both composition tools in chapter 12; here they are side by
side, each doing a real job. The `part` file is more Glimmer source
sharing the program's namespace: its cards and blocks compile as if
they were written right here, and diagnostics still point at the right
file when something goes wrong. The `import` file is plain Z80 assembly: its `@` labels become
program-wide names the blocks can call, and everything else in it
stays private to the module. That difference shapes the whole
architecture of this game.

## The facts on the board

In a program you have never seen, read the state declarations first:
they carry most of the design. Tetro's repay a slow read:

```text
state PlayerX        : byte
state PlayerY        : byte
state CurPieceIndex  : byte
state CurRotation    : byte
state NextPieceIndex : byte
state Score          : word
state LinesCleared   : byte
state ClearMask      : byte         ; rows mid-flash (white); gravity pauses
state Armed          : byte         ; game-over gate open: restart allowed
state BoardRows      : byte[8]      ; occupancy bitmap, MSB-left
state BoardRed       : byte[8]      ; colour planes
state BoardGreen     : byte[8]
state BoardBlue      : byte[8]
```

Start with the falling piece: four cells of state. Where it is
(`PlayerX`, `PlayerY`), which of the seven pieces it is
(`CurPieceIndex`), and which of four rotations it shows
(`CurRotation`). `NextPieceIndex` is the preview. `ClearMask` and
`Armed` are flow control; each solves a problem you would otherwise
meet the hard way.

The board is four `byte[8]` arrays, one bit per cell of the 8x8
matrix, eight rows, MSB-left. `BoardRows` records occupancy - the
single question collision cares about - and the three colour planes
remember what colour each settled cell keeps. This is the
framebuffer's own shape: chapter 6's `Framebuffer` stores each row as
red, green, and blue bitmask bytes, so a settled
board row lands on screen as one `or` of plane byte into framebuffer
byte, and a full row announces itself as a plane byte reading `$FF`.
Whoever laid out this state chose it so the two hardest jobs in the
game, collision and drawing, both fall out of it cheaply.

Three timers put the game on its own schedule:

```text
timer Gravity   : byte = 32  -> GravityFire   ; writable: difficulty curve
timer ClearHold : byte = 0   -> ClearTick once  ; armed by a line clear
timer GOverGate : word = 0   -> GateOpenP once  ; armed on game over
```

`Gravity` is chapter 7's oscillator with a writable period: every 32
frames, one `GravityFire`, and a compute block further down halves
that period as the score climbs. The two `once` timers start at 0 by
design: a one-shot at 0 is asleep, and it fires only after some block
writes a count into it. `ClearHold`
times the line-clear flash, `GOverGate` times the restart gate, and
each gets armed by exactly the block that needs it. That pattern - a
sleeping timer a rule can arm - recurs often.

Seven lines put the whole control scheme on the page:

```text
bind key KEY_4  held period 10 -> MoveLeftP
bind key KEY_6  held period 10 -> MoveRightP
bind key KEY_2  held period 3  -> SoftDropP
bind key KEY_5  rising -> RotateP
bind key KEY_AD rising -> RotateP
bind key KEY_0  rising -> PauseP
bind key any    rising -> AnyKeyP
```

Horizontal movement repeats every 10 frames held, soft drop three
times as fast, and rotation is rising only - one press, one quarter
turn, from either of two keys feeding the same pulse. `bind key any`
serves the splash screen and the restart, and later in the chapter you
will see why the restart needs a guard in front of it.

## Seven pieces, declared

Chapter 9's shapes had one bitmap each. A tetromino has up to four, one per
quarter turn, and the rotational form of `shape` declares them as
`rot0`..`rot3` groups:

```text
shape PieceS color green
  rot0 "XX."
       ".XX"
  rot1 ".X"
       "XX"
       "X."
  rot2 "..."
       "XX."
       ".XX"
  rot3 = rot1
end
```

Two shorthands keep the declarations the size of the pieces
themselves. A rotation can alias an earlier one: the S piece's fourth
rotation is its second, so `rot3 = rot1`. And rotations beyond those
declared cycle: the I piece declares two and gets `rot2` and `rot3` as
repeats, while the O piece declares one and shows it in all four
positions. Rotating in play is `CurRotation + 1`, masked to two bits
- the cycling lives in the generated tables, so the rule that rotates
never has to care how many distinct forms a piece has.

Compare that to the usual approach. In most projects in this family of
games there is a data file: a few hundred lines of hand-maintained
bitmap tables with pointer tables over them, where one slip of the
editor becomes a piece that draws wrong or collides wrong. Tetro has
seven declarations you can read as pictures. The tables still exist -
we look at them next - but the language absorbed the part that was
drudgery.

One more thing: declaration order is piece identity. `PieceI` first through `PieceL` seventh gives
each shape a `ShapeId_<Name>` equate from 0 to 6, and that same order
runs through every table below and through the preview letters in
`text PieceNames "IOTSZJL"`.

## The tables the shapes became

Open `tetro.main.asm` at `; --- rotational shape resources ---`. Each
distinct rotation became four bitmap rows, MSB-left, padded to four
rows. The S piece:

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
ShapeRot_PieceS_2:
        .db     %00000000
        .db     %11000000
        .db     %01100000
        .db     %00000000
```

Read the first bitmap against `"XX."`: bit 7 is column 0, so the two
pixels sit at the top left, ready to shift right by `PlayerX` at draw
time. And count the bitmaps: three, for a piece with three distinct
rotations. The fourth comes from the pointer table:

```asm
ShapeRotPtrTable:
        .dw     ShapeRot_PieceI_0, ShapeRot_PieceI_1, ShapeRot_PieceI_0, ShapeRot_PieceI_1
        .dw     ShapeRot_PieceO_0, ShapeRot_PieceO_0, ShapeRot_PieceO_0, ShapeRot_PieceO_0
        .dw     ShapeRot_PieceT_0, ShapeRot_PieceT_1, ShapeRot_PieceT_2, ShapeRot_PieceT_3
        .dw     ShapeRot_PieceS_0, ShapeRot_PieceS_1, ShapeRot_PieceS_2, ShapeRot_PieceS_1
        .dw     ShapeRot_PieceZ_0, ShapeRot_PieceZ_1, ShapeRot_PieceZ_2, ShapeRot_PieceZ_1
        .dw     ShapeRot_PieceJ_0, ShapeRot_PieceJ_1, ShapeRot_PieceJ_2, ShapeRot_PieceJ_3
        .dw     ShapeRot_PieceL_0, ShapeRot_PieceL_1, ShapeRot_PieceL_2, ShapeRot_PieceL_3
```

One row per piece, four entries per row, and both shorthands are
sitting in plain sight as repeated labels: the I row alternates its
two bitmaps, the O row repeats one four times, and the S row's last
entry is `ShapeRot_PieceS_1` - your `rot3 = rot1` alias, compiled.
Beside this table sit `ShapeRotRightTbl`, one byte per rotation
holding the rightmost occupied column - the X bound the collision
probe checks first - then `ShapeRotColorTbl`, one colour byte per
piece, and the `ShapeId_PieceI .equ 0` through `ShapeId_PieceL .equ 6`
identity equates.

The whole family indexes by `id*4 + rotation`. The engine routine
that consumes it, from `tetro-lib.asm`:

```asm
; Recompute the piece pointer, right bound, and colour bits from the
; program's CurPieceIndex and CurRotation cells. Call after either
; changes.
.routine clobbers A,C,DE,HL,carry,zero,sign,parity,halfCarry
@SetCurPiece:
        ld      a,(CurPieceIndex)
        add     a,a
        add     a,a                  ; index*4
        ld      c,a
        ld      a,(CurRotation)
        and     %00000011
        add     a,c                  ; table index
```

From that index the routine fetches the right bound, the bitmap
pointer (doubling the index, because the pointer table holds words),
and the colour byte, all into the module's own scratch. This is the
seam between the two files, close up: the shape declarations in
`tetro.glim` emit the tables, the imported module addresses them by
name, and the two sides stay compatible because both agree on
`id*4 + rotation`.

## The imported engine

Now cross the boundary: the place where declarations end and
hand-written assembly begins. `tetro-lib.asm` opens with data that
belongs to the module alone:

```asm
; The four board planes, for the collapse loop.
BoardPlaneTbl:
        .dw     BoardRows, BoardRed, BoardGreen, BoardBlue

; Module scratch.
CurPiecePtr:
        .dw     0
CurPieceRight:
        .db     0
CurColorBits:
        .db     0
ShiftCount:
        .db     0
```

These labels carry no `@`, so they stay private to the file - chapter
12's rule at work in a real program. Blocks reach the engine
only through the routines it publishes, and those routines cover the
board work: `SetCurPiece` you have met; `CheckCollAt` probes a
placement; `LockPiece` blits the piece into all four planes;
`FullRowsMask` reports full rows as a bitmask; `ClearFullRows`
collapses them and counts; `ScoreForClears` turns a count into a score
delta through a private `ClearScoreTbl`; `SpawnPiece` promotes the
preview, rolls a new one, and probes the spawn point; `InitGame`
resets a round; `DrawBoardFb` rebuilds the framebuffer from the planes
and overlays the falling piece.

The boundary sits exactly here for a reason, and drawing it is a
judgement you will make in your own games. Everything on the
declaration side of the line - the shape tables, the timers, the key
bindings, the change tracking, the card
gating - was plumbing and data, the kind of code that looks the same
in every game, and the language absorbed all of it. What remains in
this module is the part the language has no reason to absorb, because
it is specific to this one game - the board algebra that makes Tetro
*Tetro*. A library could package board operations, and some day one
may; the engineering call here is that code reused by every game
belongs to the language, and code owned by one game belongs to that
game, written where its author can shape it. Moving, rotating, and falling
all ask the same question - does the piece fit *there*? - and one
routine answers it for all three:

```asm
; Test a candidate placement at D=x, E=y against bounds and the board.
; Carry set means blocked. BC, DE, HL preserved.
.routine in DE out carry,zero clobbers A,sign,parity,halfCarry
@CheckCollAt:
```

Inside is a four-row loop: shift each piece row right by the candidate
X, check the floor, and `and` the shifted mask against the occupancy
plane. Irreducible game logic, wanted by three rules at three
different moments, with a register contract the assembler checks at every call
site. The reactive side decides *when*; the engine computes *what*.

Nowhere does that division show more sharply than in the board render,
back in `tetro-rules.glim`:

```text
render DrawBoard
    on BoardRows, PlayerX, PlayerY, CurRotation, CurPieceIndex, ClearMask
begin
    call DrawBoardFb
end
```

Six facts in the header, one call in the body. Everything that can
change the picture is declared where you can read it; the 100-line
rebuild - planes into framebuffer, piece overlaid in its colour, flash
rows forced white - is in the engine, where its loops can sprawl
without cluttering a single rule.

## Gravity, lock, flash

Now the game's central rule, shown whole:

```text
effect ApplyGravity
    on GravityFire, SoftDropP
    updates PlayerY, BoardRows, BoardRed, BoardGreen, BoardBlue
    updates ClearMask, ClearHold, CurrentCard
    updates PlayerX, CurPieceIndex, CurRotation, NextPieceIndex
begin
    ld a,(ClearMask)     ; rows mid-flash: gravity holds
    or a
    jp nz,_done
    ld a,(PlayerX)
    ld d,a
    ld a,(PlayerY)
    inc a
    ld e,a
    call CheckCollAt
    jr c,_lock
    ld a,e               ; free: descend
    ld (PlayerY),a
    jp _done
_lock:
    call LockPiece
    call Snd_Lock
    call FullRowsMask    ; A = bitmask of full rows
    or a
    jr z,_spawn
    ld (ClearMask),a     ; flash first; FinishClear collapses on the tick
    ld a,200
    ld (PlayerY),a       ; park the locked piece off the draw overlay
    ld a,24              ; arm the hold timer (corpus LineClearHold)
    ld (ClearHold),a
    call Snd_Clear
    jp _done
_spawn:
    call SpawnPiece
    jr nc,_done          ; spawn blocked: the stack reached the top
    ; conditional navigation: goto is unconditional once a block runs,
    ; so a conditional transition writes CurrentCard directly (declared
    ; in updates). Enter blocks are edge-triggered, so the every-run
    ; change mark cannot re-run them.
    ld a,Card.GameOver
    ld (CurrentCard),a
_done:
end
```

Two pulses share this block. The timer's `GravityFire` and the
player's `SoftDropP` both mean "try to descend", so they run the same
rule. The probe asks `CheckCollAt` about the
square below; free means fall, blocked means the piece has landed.
Landing runs the engine in sequence - lock the piece into the planes,
sound the cue, scan for full rows.

Full rows begin the flash, and this block does little to start it. It
writes the row bitmask into `ClearMask` and stops there. `ClearMask` sits in `DrawBoard`'s `on` list, so the next
render repaints, and `DrawBoardFb` forces every masked row white on
all three planes. And the first line of this very block reads
`ClearMask` too: while any row is mid-flash, gravity returns at once,
so the board holds still and lit. Parking `PlayerY` at 200 keeps the
locked piece's overlay off the picture, because row 200 sits outside
every drawn row, so only the
planes show.

The flash lasts exactly as long as the `once` timer says. `ld a,24`
into `ClearHold` arms it: at zero a one-shot sleeps, a written count
ticks down once per frame, and arrival fires `ClearTick` - chapter 7's
mechanism, driven from inside a rule. The block that catches the tick,
`FinishClear`, completes what the lock started: it zeroes `ClearMask`,
calls `ClearFullRows` to collapse the flashed rows, adds the count to
`LinesCleared`, converts it to points with `ScoreForClears`, adds
those to `Score`, and calls `SpawnPiece` - with the same blocked-spawn
branch into `Card.GameOver` as gravity's. One landed piece becomes two
block runs 24 frames apart, with the flash held between them, and each
half declares everything it touches.

The score feeds back into pace through the writable timer period.
`DifficultyCurve`, a compute on `Score` with `updates Gravity`, writes
16 into the `Gravity` period cell once the score passes 2000: past
that, pieces fall twice as fast. Difficulty is a derived fact.

## Two ways out of a card

Tetro leaves its cards both ways chapter 13 taught, and you can see
which way fits where. When the exit is
unconditional, the header says so: `SplashExit` is four lines, `on
AnyKeyP` and `goto Playing` with no body at all, so any key on the
splash screen starts the game. The `Pause` and `Unpause` effects do
the same on `PauseP`, flipping between Playing and Paused.

When the exit has a condition, the block writes `CurrentCard` itself,
and the blocked spawn is the one place in this game where that pattern
is necessary. You saw it twice above: `SpawnPiece` returns carry set
when the spawn placement is blocked, and both `ApplyGravity` and
`FinishClear` respond with `ld a,Card.GameOver` into `CurrentCard`
behind a branch. The comment inside `ApplyGravity` states the
reasoning: `goto` fires whenever its block runs, so a transition with
a condition belongs in the body, on `CurrentCard` directly, with
`CurrentCard` declared in `updates`. The
`updates` mark lands every run, including runs where the branch skips
the write - and enter blocks are edge-triggered, keyed to the card
actually changing, so the extra marks re-run nothing.

The GameOver card guards its own exit with a fact and a timer, and the
reason is a human one: a player who tops out is usually still pressing
keys, and `bind key any` would turn the last of those presses into an
instant restart. So the card's `enter` block, `GameOverShow`, closes
the gate: it writes `Armed` to 0 and loads 384 into `GOverGate`, the
word-sized `once` timer from the declarations. When `GateOpenP` fires,
the `OpenGate` effect writes `PRESS ANY KEY` to the LCD's second row
and sets `Armed` to 1. The restart key checks the fact:

```text
; Conditional navigation: restart only once the gate is open.
effect Restart
    on AnyKeyP
    updates CurrentCard
begin
    ld a,(Armed)
    or a
    jr z,_done
    ld a,Card.Splash
    ld (CurrentCard),a
_done:
end
```

Conditional navigation again, with the condition living in a state
cell an earlier block prepared. Presses during the closed gate run
this block and fall straight through, and the player never notices the
protection working.

## Words on the LCD

Every card announces itself. The messages are chapter 9 text
resources:

```text
text MsgSplash "TETRO (PRESS A KEY)"
text MsgRun    "TETRO RUNNING"
text MsgPause  "TETRO PAUSED"
text MsgOver   "TETRO GAME OVER"
text MsgPress  "PRESS ANY KEY"
text MsgNext   "NEXT: "
text PieceNames "IOTSZJL"          ; LCD preview letters, ShapeId order
```

and each card's `enter` block opens with `lcd_row` on row 1:
`SplashShow` writes `MsgSplash`, `StartRound` writes `MsgRun`,
`PausedShow` writes `MsgPause`, `GameOverShow` writes `MsgOver`. The
LCD names the mode the 8x8 matrix is in, and because the writes live
in `enter` blocks, each one happens exactly once per visit.

Row 2 belongs to the preview:

```text
render ShowPreview
    on NextPieceIndex
begin
    lcd_row MsgNext, LcdRow2
    ld hl,PieceNames
    ld a,(NextPieceIndex)
    ld e,a
    ld d,0
    add hl,de
    ld a,(hl)
    ld c,ApiCharToLcd
    rst $10
end
```

`SpawnPiece` rolls a new `NextPieceIndex` every spawn, the change
triggers this render, and the render writes `NEXT: ` plus one letter -
`PieceNames` indexed by the piece id, the same 0..6 order as the
`ShapeId_` equates. The four `sound` declarations round out the
feedback: `Snd_Rotate` on a successful turn, `Snd_Lock` on landing,
`Snd_Clear` at the flash, `Snd_Over` at the end, each a generated
wrapper the blocks call by name.

## Card seams in the generated file

One structural point is left in `tetro.main.asm`. The four cards
became `Card .enum Splash, Playing, Paused, GameOver`, and every block
from `tetro-rules.glim` became a flat
`Glim_*` routine, dispatched with its card's gate in front. Here is
the logic dispatcher exactly where the Playing card's blocks end and
the Paused card's begin:

```asm
        ld      a,(GlimActiveCard)
        cp      Card.Playing
        jr      nz,_skip_Pause
        ld      a,(Changed2)
        and     GlimDep_Pause__B2
        jr      z,_skip_Pause
        call    Glim_Pause
_skip_Pause:
        ld      a,(GlimActiveCard)
        cp      Card.Paused
        jr      nz,_skip_Unpause
        ld      a,(Changed2)
        and     GlimDep_Unpause__B2
        jr      z,_skip_Unpause
        call    Glim_Unpause
_skip_Unpause:
```

The `cp Card.Playing` flips to `cp Card.Paused` and that is the whole
seam: a card in the source is a gate on each of its blocks in the
dispatcher. Enter blocks dispatch first, then every
other block in source order, each behind its own card test - thirteen
entries in one readable column of test-and-call.

Further down, one `.import "tetro-lib.asm"` line places the engine
whole, its bytes outside every execution path, its `@` labels
resolving program-wide.

So the generated file tells the same three-part story you have been
reading all chapter: tables and state from the declarations, gated
`Glim_*` routines from the rules file, and the engine module placed
whole, called by name from the blocks above it. When you write a
bigger game of your own, this is the shape to reach for.

## Summary

What to carry out of the workshop:

- Tetro splits a real game three ways: declarations in
  `tetro.glim`, cards and blocks in a `part` file, and a board
  engine in an imported assembly module. Read them in that order.
- The rotational `shape` form declares `rot0`..`rot3` bitmap
  groups, with `rotN = rotM` aliases and cycling for pieces with
  fewer distinct rotations; declaration order assigns `ShapeId_`
  0..6, and the generated `ShapeRot_` bitmaps, `ShapeRotPtrTable`,
  `ShapeRotRightTbl`, and `ShapeRotColorTbl` index by
  `id*4 + rotation`.
- The board is four `byte[8]` planes - occupancy for collision,
  three colours for the picture - in the framebuffer's own
  MSB-left row shape.
- The line-clear flash is a state cell and a `once` timer:
  `ClearMask` freezes gravity and paints rows white, `ClearHold`
  fires `ClearTick` 24 frames later, and `FinishClear` collapses
  and scores.
- Conditional card exits write `CurrentCard` in the body behind a
  branch, with `CurrentCard` in `updates`; `goto` serves the
  unconditional ones. The game-over gate arms a timer and a fact
  so restarting takes a deliberate press.
- Collision, locking, and clearing stay in the imported engine
  because several rules share them: routines with register
  contracts, private scratch, and an `@` API, called from blocks
  that stay a few lines each.

Next, a different machine to draw with: the TMS9918 video display
processor, where the program describes a scene and the chip keeps it
on screen:
[The TMS9918 Profile](16-the-tms9918-profile.md).

---

[← A Small Matrix Game](14-a-small-matrix-game.md) | [Book](index.md) | [The TMS9918 Profile →](16-the-tms9918-profile.md)
