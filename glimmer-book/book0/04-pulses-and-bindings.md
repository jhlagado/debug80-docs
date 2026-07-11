---
layout: default
title: "Pulses and Bindings"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 4
---

[← State](03-state.md) | [Book](index.md)

# Chapter 4 - Pulses and Bindings

A fact persists: the beacon's position outlives every frame that draws
it. A moment passes: the instant GO goes down exists once, and the
program must catch it or lose it. Glimmer gives moments their own
declaration, the pulse, and this chapter covers the whole input story -
every key name, both ways a key can fire, and what the generated
polling does with the keypad sixty-odd times a second.

The program is *Rover*: a white dot steered around the whole matrix
with 2, 4, 6, and 8 - the keypad's compass points - with GO recalling
it to the centre.

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

The second axis costs what you would expect: one more state cell, two
more pulses, two more rules with the clamp turned sideways. `GoHome`
shows an effect at its simplest - two constant stores - and `DrawDot`
draws from both facts, so movement on either axis redraws.

Build it, run it, and hold 6 while tapping 2: the dot runs right,
steps up on each tap, and carries on running right.

## The keypad, by name

The TEC-1G's MON-3 monitor names every key, and `bind` uses those
names directly:

| Keys | Names |
|---|---|
| The hex digits 0-F | `KEY_0` through `KEY_F` |
| Plus and minus | `KEY_PLUS`, `KEY_MINUS` |
| GO | `KEY_GO` |
| AD (address) | `KEY_AD` |

Twenty keys, four of them off the hex pad. Game controls usually live
on the digits - 2, 4, 6, 8 make a compass, 5 sits in the middle of it
for fire or rotate - with GO and AD as start and menu keys. The names
compile to MON-3's key codes in the generated file, so the binding
`bind key KEY_2 ...` and the panel's 2 key mean the same physical
thing.

## Rising or held

Every binding chooses one of two shapes, and the choice is a game
design decision:

- `rising` fires once, on the frame the key goes down. Press again to
  fire again. Choose it for *actions*: fire, rotate, pause, start.
- `held period N` fires on the press, then again every N frames while
  the key stays down. Choose it for *movement*, and tune N to taste: a
  small period is a fast walk, a large one a deliberate step.

Rover uses both shapes for exactly those reasons: held compass keys,
rising GO. A rotate-the-piece key in a falling-blocks game wants
`rising` - one press, one quarter turn - while the move-left key under
the same thumb wants `held`. The two shapes on two adjacent keys give
the game its feel, and both are one-line decisions.

One property of the keypad to design around: MON-3 reports a single
pressed key at a time, so held movement runs one direction at once,
and a fresh press takes over the autorepeat from the key before it.
Rover's controls - and the games later in this book - are built on
single-key movement, which suits the keypad's compass layout.

## Any key at all

A third binding form catches every key:

```text
pulse Wake

bind key any rising -> Wake
```

`any` fires its pulse on every new press, whichever key it is, and it
fires alongside the named bindings - a press of GO fires both `Home`
and `Wake` in the same frame. It comes in the rising shape only: the
moment it exists for is *the player touched the machine*. Title
screens wait on it - "press any key" is a `bind key any` and a card
transition, as chapter 13 shows.

## What polling looks like

The pulses in Rover come from one generated routine. Here is the top
of it, from `rover.main.asm`:

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

Once per frame, the routine asks MON-3 about the keypad: `_scanKeys`
answers in the flags - zero set means a key is down, carry set means
the press is new this frame. From those two flags the routine sorts
the three cases you have been designing with. Silence disarms the
autorepeat. A held key counts its repeat clock down and fires its
pulse when the count runs out, reloading the period from your `bind`
line. A new press fires its pulse at once and arms the clock:

```asm
Glim_HeldKey:     .db $FF
Glim_HeldCount:   .db 0
```

Two bytes of storage run the whole autorepeat - which key is armed,
and how many frames remain until it repeats. When a pulse fires here,
the poll writes the pulse's byte and sets its change bit directly:
polling runs before any block, so every phase of the frame sees the
moment.

At the other end of the frame, `GlimEndFrame` clears every pulse byte
- the cleanup you read in chapter 2. Between those two points, a
moment is a fact like any other: one frame wide, one bit in
`Changed0`, triggering whatever declared `on` it.

## Summary

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

Next: the three kinds of block, and the order a frame runs them in -
Compute, Effect, Render.

---

[← State](03-state.md) | [Book](index.md)
