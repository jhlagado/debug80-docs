---
layout: default
title: "State"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 3
---

[← First Light](02-first-light.md) | [Book](index.md) | [Pulses and Bindings →](04-pulses-and-bindings.md)

# Chapter 3 - State

In the last chapter you built Beacon, pressed GO, and watched one
remembered fact - a colour - become light on the 8x8 RGB LED matrix.
One fact was enough for first light. It is not enough for a game, and
I want to open this chapter with a claim I will keep coming back to
for the rest of the book: a game *is* its facts. Where the player is.
What colour things are. How well you are doing. Choosing those facts -
deciding what the program must remember, and what it can afford to
forget - is the first design act of every game you will ever write,
and it happens before a single rule exists.

So today Beacon grows. By the end of the chapter it will remember
three facts - a position, a colour, and a score - and in teaching it
those three you will meet everything a `state` declaration can say,
along with the change tracking that makes state the engine of the
whole program. And a small challenge waits near the end: predict a
program's first frame from its source alone, then build it and watch
yourself be right.

## Beacon, grown

Here is where we are headed. The new Beacon steers along its row with
keys 4 and 6, held for movement the way Mover was. GO still steps the
colour, and every step now scores a point, shown on the TEC-1G's
six-digit seven-segment display. Position, colour, score: the three
kinds of fact almost every game keeps, in miniature.

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

Read the headers aloud before we go any further, the way you did with
Mover - you still can, and that is the point. Two list forms appear
here for the first time, and both say what you would guess. `updates
Colour, Score` - NextColour changes two facts, so it declares both of
them. `on DotX, Colour` - DrawBeacon depicts two facts, so a change to
either one redraws. Commas separate names, in headers as everywhere in
Glimmer.

`HudWriteU16` is another routine from the profile library, a sibling
of `FbPlot`: give it a value in HL and it writes it to the six-digit
seven-segment display as a decimal number. The display gets its own
treatment in chapter 9; one call is all we need today.

## What a state declaration can say

Three declarations, and between them they exercise every part of the
syntax:

```text
state DotX   : byte = 3 changed
state Colour : byte = 1
state Score  : word
```

The full shape is `state Name : type = initial changed`, and the last
two parts are optional. The type is `byte` or `word`. The initial
value defaults to 0, and `Score` leans on that default. And `changed`
- the word you met in chapter 1 - marks the fact as already changed
when the program starts. `DotX` carries it; the other two go without;
and which facts carry it is going to matter shortly, so keep an eye on
it.

The one genuine newcomer is `word`, and it should hold no fear for
you. A `word` cell is 16 bits, and your Z80 handles it with the Z80's
own 16-bit moves - look at the score lines in `NextColour`:

```asm
    ld hl,(Score)
    inc hl
    ld (Score),hl
```

Load the pair, increment, store the pair - the instructions you would
write for any 16-bit counter, because that is exactly what this is.
The declaration reserved two bytes instead of one, and in the
generated file that difference amounts to a single directive:

```asm
; --- state storage ---
DotX:             .db 3
Colour:           .db 1
Score:            .dw 0
```

## One bit per fact

Chapter 2 showed you the bookkeeping for two facts. Here it is for six
- three states and three pulses, one bit each, in declaration order
with states first:

```asm
; --- change flags ---
CHG_DOTX          .equ %00000001
CHG_COLOUR        .equ %00000010
CHG_SCORE         .equ %00000100
CHG_LEFT          .equ %00001000
CHG_RIGHT         .equ %00010000
CHG_STEP          .equ %00100000

; --- block trigger masks ---
GlimDep_DrawBeacon__B0 .equ CHG_DOTX + CHG_COLOUR
GlimDep_ShowScore__B0 .equ CHG_SCORE
```

Every fact owns one bit of `Changed0`, pulses included - a pulse is a
fact that holds for one frame, remember, and it is tracked the same
way as its longer-lived siblings. And DrawBeacon's mask answers a
question you may have been holding since `on DotX, Colour`: the
two-fact trigger compiled to the sum of two bits. The dispatcher ANDs
the changed byte against that mask, so *any* fact in the list sets the
block running. One block, several reasons to run, one instruction to
test them all.

The next idea is the one I most want you to carry out of this
chapter. The masks gate the blocks;
the cells feed them. When DrawBeacon runs because you moved, its body
still reads `Colour` and plots the current colour - a body always
works from the facts as they are now, whichever bit woke it. Say it as
a rule, and say it aloud: **flags decide who runs; values decide what
happens.** Nearly every confusing frame you will ever debug in a
reactive program comes from blurring those two together, and nearly
every one untangles the moment you pull them apart again. Keep them
separate and everything this book builds from here will stay clear.

One byte holds eight facts, and a program can declare up to 32
flag-carrying facts: they fill `Changed0` through `Changed3`, eight
bits a bank, states first and pulses after them. Beacon uses six bits
of the first bank. The dispatch masks carry the bank in their name -
the `__B0` suffix you can see above - and a block whose triggers span
banks tests each one.

## The first frame, predicted

Time for the challenge I promised you, and for the discipline it
teaches: predict before you build; then build and watch.
Your prediction needs one last piece of information. `Changed0` begins
life as the sum of every `changed` in the source:

```asm
Changed0:         .db %00000001   ; flags dispatch tests
```

One bit: `DotX`'s. Now predict frame one with me. DrawBeacon's mask
includes that bit, so the beacon appears - and it appears with both
its position and its colour correct, because the body reads both cells
regardless of which bit woke it. Flags decide who runs; values decide
what happens. ShowScore's mask is `CHG_SCORE`, and that bit is clear,
so ShowScore rests - and the six-digit seven-segment display stays
dark.

A dark display looks like a bug the first time you meet it, so solve
the mystery from the source before you reach for the debugger: no fact
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
`000000` before you have pressed anything. This is the whole craft of
`changed`: put it on every fact whose picture should exist before any
event has happened.

Now go and collect your payoff. Build the program, try both versions,
and watch the prediction hold. Then set a breakpoint inside
`ShowScore` and confirm the debugger stops there on the frame you
predicted - and on no other. Reading a program's behaviour straight
off its declarations, and having the machine agree with you, is the
reactive model paying its rent.

## Summary

- `state Name : type = initial changed`: type is `byte` or `word`,
  the initial value defaults to 0, and `changed` sets the fact's flag
  before the first frame.
- `word` cells reserve two bytes (`.dw`); block bodies handle them
  with ordinary 16-bit loads and stores.
- `on` and `updates` take comma-separated lists. A multi-fact trigger
  compiles to a mask that is the sum of the facts' bits: any one of
  them runs the block.
- Flags decide who runs; values decide what happens. A block's body
  reads the current cells no matter which trigger woke it.
- Up to 32 facts carry flags, filling banks `Changed0` to `Changed3`,
  states first, pulses after.
- On frame one, only blocks whose masks overlap the declared `changed`
  bits run. Predict it from the source; verify it with a breakpoint.

Next we turn to the moments themselves - where pulses come from, and
every way a key can fire one:
[Pulses and Bindings](04-pulses-and-bindings.md).

---

[← First Light](02-first-light.md) | [Book](index.md) | [Pulses and Bindings →](04-pulses-and-bindings.md)
