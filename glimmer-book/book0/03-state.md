---
layout: default
title: "State"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 3
---

[← First Light](02-first-light.md) | [Book](index.md)

# Chapter 3 - State

Beacon remembers one fact: its colour. A game remembers many. Where
the player is. What colour things are. How well you are doing. This
chapter grows Beacon to three facts - position, colour, and a score -
and in doing so covers everything a `state` declaration can say, and
the change tracking that makes state the engine of the whole program.

## Beacon, grown

The new Beacon steers along its row with keys 4 and 6, held for
movement the way Mover was. GO still steps the colour, and now every
step also scores a point, shown on the TEC-1G's six-digit
seven-segment display.

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

Two list forms appear here for the first time, and both read the way
you would guess. `updates Colour, Score` - NextColour changes two
facts, so it declares two. `on DotX, Colour` - DrawBeacon depicts two
facts, so a change to either one redraws. Commas separate names, in
headers as everywhere in Glimmer.

`HudWriteU16` is another routine from the profile library, a sibling
of `FbPlot`: it takes a value in HL and writes it to the six-digit
display as a decimal number. Chapter 9 gives the display its own
treatment; one call is all this chapter needs.

## What a state declaration can say

```text
state DotX   : byte = 3 changed
state Colour : byte = 1
state Score  : word
```

The full shape is `state Name : type = initial changed`, and the last
two parts are optional. The type is `byte` or `word`. The initial
value defaults to 0 - `Score` relies on that. And `changed` marks the
fact as already changed when the program starts; `DotX` carries it,
and the other two do without, which matters shortly.

A `word` cell is 16 bits, and your Z80 handles it with the Z80's own
16-bit moves - look at the score lines in `NextColour`:

```asm
    ld hl,(Score)
    inc hl
    ld (Score),hl
```

Load the pair, increment, store the pair. The declaration reserved two
bytes; the instructions are the ones you would write for any 16-bit
counter. In the generated file the storage difference is one directive:

```asm
; --- state storage ---
DotX:             .db 3
Colour:           .db 1
Score:            .dw 0
```

## One bit per fact

Chapter 2 showed the bookkeeping for two facts. Here it is for six -
three states and three pulses, in declaration order, states first:

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
fact that holds for one frame, and it is tracked the same way. And
DrawBeacon's mask answers a question you might have asked about `on
DotX, Colour`: the two-fact trigger compiled to the sum of two bits.
The dispatcher ANDs the changed byte against that mask, so *any* fact
in the list sets the block running. One block, several reasons, one
instruction to test them all.

The masks gate the blocks; the cells feed them. When DrawBeacon runs
because you moved, its body still reads `Colour` and plots the current
colour - the body always works from the facts as they are now. Flags
decide *who runs*; values decide *what happens*. Keeping those two
ideas separate will carry you through everything the book builds from
here.

A program can declare up to 32 flag-carrying facts: they fill
`Changed0` through `Changed3`, eight bits a bank, states first and
pulses after them. Beacon uses six bits of the first bank. The
dispatch masks carry the bank in their name - the `__B0` suffix you
can see above - and a block whose triggers span banks tests each one.

## The first frame, predicted

`Changed0` begins as the sum of every `changed` in the source:

```asm
Changed0:         .db %00000001   ; flags dispatch tests
```

One bit: `DotX`'s. Now predict frame one. DrawBeacon's mask includes
that bit, so the beacon appears - position and colour both drawn,
because the body reads both cells regardless of which bit woke it.
ShowScore's mask is `CHG_SCORE`, still clear - so ShowScore rests, and
the seven-segment display stays dark. It stays dark until the first
press of GO, when `updates Colour, Score` raises both bits and the
score lights up as `000001`.

A dark display until the first point is a design choice you might
keep. If you want the score visible from the start, you already know
the word that does it:

```text
state Score  : word changed
```

With that one edit, frame one runs both renders, and the display shows
`000000` before you have pressed anything. This is the whole craft of
`changed`: put it on every fact whose picture should exist before any
event has happened.

Build the program, try both versions, and watch the prediction hold.
Then set a breakpoint inside `ShowScore` and confirm the debugger
stops there on the frame you expect - and on no other.

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

Next: the moments themselves - where pulses come from, and every way a
key can fire one.

---

[← First Light](02-first-light.md) | [Book](index.md)
