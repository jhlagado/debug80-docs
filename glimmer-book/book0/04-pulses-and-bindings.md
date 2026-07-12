---
layout: default
title: "Pulses and Bindings"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 4
---

[← State](03-state.md) | [Book](index.md) | [Compute, Effect, Render →](05-compute-effect-render.md)

# Chapter 4 - Pulses and Bindings

Chapter 3 was about the things a game remembers. This chapter is about
the things it must catch. The distinction matters enough to say twice:
a fact persists - the beacon's position outlives every frame that
draws it - but a moment passes. The instant GO goes down exists
exactly once, and if your program does not catch it, it never happened
at all. Glimmer gives moments their own declaration, the pulse, and
back in chapter 1 I handed you one pulse and one bind line and hurried
on, because I wanted you at the keypad. Now we can take the whole
input story properly: every key name, both shapes a key can fire in,
and what the generated polling does with the keypad, frame after
frame.

I have been looking forward to this chapter's program. *Rover* is a
white dot you steer around the whole 8x8 RGB LED matrix with 2, 4, 6,
and 8 - the keypad's compass points - and GO recalls it to the centre.
There is nothing to chase yet and no way to lose, and it still feels
like a game character the moment you hold a key: for the first time in
this book, something on that display is under your thumb.

```text
program Rover

platform tec1g-mon3
display matrix8x8

state DotX : byte = 3 changed
state DotY : byte = 3

pulse Up
pulse Down
pulse Left
pulse Right
pulse Home

bind key KEY_2  held period 8 -> Up
bind key KEY_8  held period 8 -> Down
bind key KEY_4  held period 8 -> Left
bind key KEY_6  held period 8 -> Right
bind key KEY_GO rising -> Home

effect MoveUp
    on Up
    updates DotY
begin
    ld a,(DotY)
    or a
    jr z,_stop      ; at the top: stay
    dec a
    ld (DotY),a
_stop:
end

effect MoveDown
    on Down
    updates DotY
begin
    ld a,(DotY)
    cp 7
    jr nc,_stop     ; at the bottom: stay
    inc a
    ld (DotY),a
_stop:
end

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

effect GoHome
    on Home
    updates DotX, DotY
begin
    ld a,3
    ld (DotX),a
    ld (DotY),a
end

render DrawDot
    on DotX, DotY
begin
    call FbClear
    ld a,(DotX)
    ld b,a          ; B = x
    ld a,(DotY)
    ld c,a          ; C = y
    ld a,COLOR_WHITE
    call FbPlot
end
```

Half of this file is chapter 1's Mover with a mirror held up to it,
and the second axis costs exactly what you would expect it to cost:
one more state cell, two more pulses, two more rules with the clamp
turned sideways. Look at `GoHome` for a second: it shows an effect at
its simplest - two constant stores, no branch, no ceremony. Not every rule needs to be clever. And `DrawDot` now
draws from both facts - `on DotX, DotY`, the comma you learned in
chapter 3 - so movement on either axis redraws the dot.

Build it, run it, and then do one thing for me: hold 6 while tapping
2. The dot runs right, steps up on each tap, and carries on running
right. Keep your thumb there a moment. That is what this chapter is
teaching you to design - not which code runs, but how the controls
*feel* in a player's hands.

## The keypad, by name

Before we choose how keys fire, let us name them. The TEC-1G's MON-3
monitor gives every key a name, and `bind` uses those names directly:

| Keys | Names |
|---|---|
| The hex digits 0-F | `KEY_0` through `KEY_F` |
| Plus and minus | `KEY_PLUS`, `KEY_MINUS` |
| GO | `KEY_GO` |
| AD (address) | `KEY_AD` |

Twenty keys, four of them off the hex pad. When you lay out a game's
controls, the digits are where the action lives: 2, 4, 6, 8 make a
compass, and 5 sits in the middle of it, in easy reach, ready to be
fire or rotate. GO and AD do good service as start and menu keys. The
names compile to MON-3's key codes in the generated file, so the
binding `bind key KEY_2 ...` in your source and the 2 key on the panel
mean the same physical thing - no magic numbers between your intention
and the hardware.

## Rising or held

Every binding chooses one of two shapes, and the choice is a game
design decision before it is a technical one:

- `rising` fires once, on the frame the key goes down. Press again to
  fire again. Choose it for *actions*: fire, rotate, pause, start.
- `held period N` fires on the press, then again every N frames while
  the key stays down. Choose it for *movement*, and tune N to taste: a
  small period is a fast walk, a large one a deliberate step.

Think about it from the player's side, thumbs on the pad. In a
falling-blocks game, the rotate key under your thumb wants one press,
one quarter turn - give it autorepeat and the piece spins out of
control while the player watches in dismay. The move-left key beside
it wants the opposite: press and lean, and the piece keeps sliding
until you let go. Two adjacent keys under the same thumb, two shapes,
and between them they are the feel of the game. Rover makes the same
choices for the same reasons - held compass keys, rising GO - and both
are one-line decisions. Tuning the feel of your entire control scheme
is editing a digit.

One property of the keypad needs stating plainly, because
you should design with it rather than discover it: MON-3 reports a
single pressed key at a time. Held movement runs one direction at
once, and a fresh press takes over the autorepeat from the key before
it. Read that as a design constraint, not a defect - Rover's controls,
and every game later in this book, are built on single-key movement,
and the keypad's compass layout suits it well. You have already felt
how cleanly the takeover plays: that was your thumb on 6 and 2 a page
ago.

## Any key at all

A third binding form catches every key:

```text
pulse Wake

bind key any rising -> Wake
```

`any` fires its pulse on every new press, whichever key it is, and it
fires alongside the named bindings - press GO and both `Home` and
`Wake` fire in the same frame. It comes in the rising shape only, and
the reason is in what it exists to catch: *the player touched the
machine*. Title screens wait on it. When you build one in chapter 13,
"press any key" will be exactly this line and a card transition.

## What polling looks like

All five of Rover's pulses come out of one generated routine, and
inside it is the repeat clock you did not have to write - the timer I
mentioned in chapter 1, the one you would have hand-built in any
other system. Let us go and look at it. The top of the routine, from
`rover.main.asm`:

```asm
; --- input polling (MON-3 _scanKeys) ---
.routine
GlimPollBindings:
        ld      c,ApiScanKeys
        rst     $10
        jr      z,_keydown
        ld      a,$FF                ; no key: disarm autorepeat
        ld      (Glim_HeldKey),a
        ret
_keydown:
        ld      b,a                  ; B = key code
        jr      c,_newpress
        ld      a,(Glim_HeldKey)     ; held: autorepeat armed for this key?
        cp      b
        ret     nz
        ld      a,(Glim_HeldCount)
        dec     a
        ld      (Glim_HeldCount),a
        ret     nz
        ...
```

Once per frame, the routine asks MON-3 about the keypad. `_scanKeys`
answers in the flags - zero set means a key is down, carry set means
the press is new this frame - and from those two flags the routine
sorts out the three cases you have been designing with all chapter.
Silence disarms the autorepeat. A held key counts its repeat clock
down and fires its pulse when the count runs out, reloading the period
from your `bind` line - your `period 8` lives down here as the reload
value. A new press fires its pulse at once and arms the clock. And
here is the clock itself, in its entirety:

```asm
Glim_HeldKey:     .db $FF
Glim_HeldCount:   .db 0
```

Two bytes of storage run the whole autorepeat - which key is armed,
and how many frames remain until it repeats. That is the counter you
would have armed, decremented, tested and reloaded yourself, edge
cases and all, written out for you in the open where you can set a
breakpoint on it. When a pulse fires here, the poll writes the pulse's
byte and sets its change bit directly, and because polling runs before
any block, every phase of the frame sees the moment.

At the other end of the frame, `GlimEndFrame` clears every pulse byte
- the cleanup you read with your own eyes in chapter 2. Between those
two points, a moment is a fact like any other: one frame wide, one bit
in `Changed0`, triggering whatever declared `on` it.

## Summary

The input story, folded small:

- A pulse is a moment made declarable: it fires, triggers its
  dependents for one frame, and clears at frame end.
- `bind key <NAME> rising -> Pulse` fires once per press; `held period
  N` autorepeats every N frames while the key stays down. Actions take
  rising; movement takes held.
- MON-3 names the twenty keys: `KEY_0`..`KEY_F`, `KEY_PLUS`,
  `KEY_MINUS`, `KEY_GO`, `KEY_AD`.
- `bind key any rising` fires on every new press, alongside the named
  bindings - the "press any key" moment.
- The keypad reports one key at a time; a new press takes over the
  autorepeat. Design controls on single-key movement.
- Generated polling reads `_scanKeys` once per frame and runs the
  autorepeat from two bytes of state; pulses raised there are visible
  to every phase of that frame.

Moments have other sources - chapter 7 gives the machine clocks that
fire pulses of their own - but the keypad story is complete. Next I
owe you the full picture of what a frame does once the moments are
in: the three kinds of block, and the order a frame runs them in -
[Compute, Effect, Render](05-compute-effect-render.md).

---

[← State](03-state.md) | [Book](index.md) | [Compute, Effect, Render →](05-compute-effect-render.md)
