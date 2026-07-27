---
layout: default
title: "State"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 3
---

# Chapter 3 - State

In the last chapter you built Beacon, pressed GO, and watched one
remembered fact, a colour, become light on the 8x8 RGB LED matrix.
A game needs more, because a game
*is* its facts: where the player is, what colour things are, how well
you are doing. Choosing those facts (what the program must remember,
and what it can afford to forget) comes before any rule you write.

So today Beacon grows. By the end of the chapter it will remember
three facts (a position, a colour, and a score), and in teaching it
those three you will meet everything a `state` declaration can say,
along with the change tracking that goes with it. Near the end, a
first-frame prediction made from the source can be checked against a
running build.

## Beacon, grown

The new Beacon steers along its row with
keys 4 and 6, held for movement the way Mover was. GO still steps the
colour, and every step now scores a point, shown on the TEC-1G's
six-position seven-segment display. Position, colour, score: the three
kinds of fact almost every game keeps.

```text
program Beacon

platform tec1g-mon3
display matrix8x8

state DotX   : byte = 3 changed
state Colour : byte = 1
state Score  : word

pulse Left
pulse Right
pulse Step

bind key KEY_4  held period 8 -> Left
bind key KEY_6  held period 8 -> Right
bind key KEY_GO rising -> Step

effect MoveLeft
    on Left
    updates DotX
begin
    ld a,(DotX)
    or a
    jr z,_stop      ; at the left edge: stay
    dec a
    ld (DotX),a
_stop:
end

effect MoveRight
    on Right
    updates DotX
begin
    ld a,(DotX)
    cp 7
    jr nc,_stop     ; at the right edge: stay
    inc a
    ld (DotX),a
_stop:
end

effect NextColour
    on Step
    updates Colour, Score
begin
    ld a,(Colour)
    inc a
    cp 8
    jr c,_store     ; 1 to 7 are the visible colours
    ld a,1
_store:
    ld (Colour),a
    ld hl,(Score)
    inc hl
    ld (Score),hl
end

render DrawBeacon
    on DotX, Colour
begin
    call FbClear
    ld a,(DotX)
    ld b,a          ; B = x
    ld c,3          ; C = y
    ld a,(Colour)
    call FbPlot
end

render ShowScore
    on Score
begin
    ld hl,(Score)
    call HudWriteU16
end
```

Spoken aloud, the headers remain straightforward. `updates Colour,
Score` says NextColour changes two facts, so it
declares both of them. `on DotX, Colour` means DrawBeacon depicts two
facts, so a change to either one redraws. Commas separate names, in headers as everywhere in
Glimmer.

`HudWriteU16` is another routine from the profile library, a sibling
of `FbPlot`: give it a value in HL and it writes five decimal digits
after the display's fixed leading zero. One call is all we need today;
the full display service comes later.

## State declaration syntax

Three declarations, and between them they exercise every part of the
syntax:

```text
state DotX   : byte = 3 changed
state Colour : byte = 1
state Score  : word
```

The full shape is `state Name : type = initial changed`, and the last
two parts are optional. The type is `byte` or `word`. The initial
value defaults to 0, and `Score` leans on that default. The
`changed` modifier marks the fact as already
changed when the program starts. `DotX` carries it; the other two go without.

The one new thing here is `word`. A `word` cell is 16 bits, and your
code moves it with the Z80's
own 16-bit instructions. The score lines in `NextColour` show the
difference:

```asm
    ld hl,(Score)
    inc hl
    ld (Score),hl
```

The declaration reserved two bytes instead of one, and in the
generated file that difference amounts to a single directive:

```asm
; --- state storage ---
DotX:             .db 3
Colour:           .db 1
Score:            .dw 0
```

## One bit per fact

The generated bookkeeping now covers six facts: three states and
three pulses, one bit each, in declaration order
with states first:

```asm
; --- change flags ---
CHG_DOTX_BIT      .equ 0
CHG_COLOUR_BIT    .equ 1
CHG_SCORE_BIT     .equ 2
CHG_LEFT_BIT      .equ 3
CHG_RIGHT_BIT     .equ 4
CHG_STEP_BIT      .equ 5
CHG_DOTX          .equ %00000001
CHG_COLOUR        .equ %00000010
CHG_SCORE         .equ %00000100
CHG_LEFT          .equ %00001000
CHG_RIGHT         .equ %00010000
CHG_STEP          .equ %00100000

; --- block trigger masks ---
GlimDep_MoveLeft__B0 .equ CHG_LEFT
GlimDep_MoveRight__B0 .equ CHG_RIGHT
GlimDep_NextColour__B0 .equ CHG_STEP
GlimDep_DrawBeacon__B0 .equ CHG_DOTX + CHG_COLOUR
GlimDep_ShowScore__B0 .equ CHG_SCORE
```

Every fact owns one bit of `Changed0`, pulses included: a pulse is a
fact that holds for one frame, remember, and it is tracked the same
way as its longer-lived siblings. DrawBeacon's mask shows what a
two-fact trigger becomes: the sum of two bits. The dispatcher ANDs the
changed byte against that mask, so *any* fact in the list sets the
block running.

When DrawBeacon runs
because you moved, its body still reads `Colour` and plots the current
colour: a body always works from the facts as they are now, whichever
bit woke it. **Flags decide who runs; values decide what happens.**

By hand, keeping the picture current costs you one of two chores:
redraw
everything every frame whether or not it moved, or keep a dirty flag
per fact and set it in every code path that writes that fact. The
flags here are the second chore, done for you. You declare `updates`
once in a block's header; the generated wrapper sets the bit, the
dispatcher tests it, and `GlimEndFrame` clears it, so it is a flag
you never touch.

One byte holds eight facts, and a program can declare up to 32
flag-carrying facts: they fill `Changed0` through `Changed3`, eight
bits a bank, states first and pulses after them. The dispatch masks
carry the bank in their name (the `__B0` suffix you can see above),
and a block whose triggers span banks tests each one.

![DotX, its bit in Changed0, and the first three frames of the program.](../../assets/images/glimmer-book/book0/change-flags.svg)

## The first frame, predicted

The challenge is to predict the first frame before building, then compare that
prediction with the running program.
`Changed0` begins
life as the sum of every `changed` in the source:

```asm
Changed0:         .db %00000001   ; flags dispatch tests
```

One bit: `DotX`'s. DrawBeacon's mask
includes that bit, so the beacon appears, and it appears with both
its position and its colour correct, because the body reads both cells
regardless of which bit woke it. ShowScore's mask is `CHG_SCORE`, and that bit is clear,
so ShowScore rests, and the six-position seven-segment display stays
dark.

A dark display looks like a bug the first time you meet it, so work it
out from the source before you reach for the debugger: no fact
ShowScore watches has changed, so ShowScore has never run, and a
render that has never run has never drawn. The display stays dark
until the first press of GO, when `updates Colour, Score` raises both
bits and the score lights up as `000001`.

A dark display until the first point is a design choice, and you might
decide to keep it. If you would rather have the score visible from the
start, you already know the word that does it:

```text
state Score  : word changed
```

With that one edit, frame one runs both renders, and the display shows
`000000` before you have pressed anything. That is the rule for
`changed`: it belongs on every fact whose picture should exist before
anything happens.

Building both versions confirms the prediction. A breakpoint inside
`ShowScore` does not stop on frame one with `Score` unchanged; with
`Score changed`, it stops there before the first key press. In either
version, each later score change reaches the breakpoint again.

Next we turn to the moments themselves, where pulses come from, and
every way a key can fire one:
[Pulses and Bindings](04-pulses-and-bindings.md).
