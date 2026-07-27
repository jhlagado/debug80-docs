---
layout: default
title: "Pulses and Bindings"
parent: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 4
---

# Pulses and Bindings

State describes values that persist across frames. Input events have
a shorter lifetime: the instant GO goes down occurs on one frame.
Glimmer represents such moments with a pulse. Mover introduced one
pulse and one bind line; this chapter covers every key name, both
binding modes and the generated keypad polling that runs each frame.

*Rover* is a white dot you steer around the 8x8 RGB LED matrix
with 2, 4, 6, and 8 (the keypad's compass points), and GO recalls it
to the centre. It feels like a game character the moment you hold a
key.

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

Half of this file is Mover. The second axis adds one state cell, two
pulses and two rules with the clamp turned sideways. `GoHome` is an
effect containing two constant stores. `DrawDot` now draws from
both facts (`on DotX, DotY`), so movement on either axis redraws the
dot.

Running Rover while holding 6 and tapping 2 demonstrates the
difference. The dot runs right, steps up on each tap, and carries on
running right. That feel of a steady run with single steps mixed in is
what `rising` and `held` let you design.

## The keypad, by name

The TEC-1G's MON-3
monitor gives every key a name, and `bind` uses those names directly:

| Keys | Names |
|---|---|
| The hex digits 0-F | `KEY_0` through `KEY_F` |
| Plus and minus | `KEY_PLUS`, `KEY_MINUS` |
| GO | `KEY_GO` |
| AD (address) | `KEY_AD` |

Twenty keys, four of them off the hex pad. When you lay out a game's
controls, the digits provide a useful arrangement: 2, 4, 6 and 8 make
a compass, and 5
sits in the middle, in easy reach for fire or rotate. GO and AD serve
as start and menu keys. The names compile to MON-3's key codes in the
generated file, so the binding `bind key KEY_2 ...` in your source and
the 2 key on the panel mean the same physical thing.

## Rising or held

Every binding chooses one of two shapes, and the choice is a game
design decision before it is a technical one:

- `rising` fires once, on the frame the key goes down. Another press
  fires it again, which suits *actions*: fire, rotate, pause, start.
- `held period N` fires on the press, then again every N frames while
  the key stays down. It suits *movement*, with N setting the pace: a
  small period is a fast walk, a large one a deliberate step.

In a
falling-blocks game, one press of the rotate key should give one
quarter turn; autorepeat would spin the piece out of control. The
move-left key needs the opposite behaviour: holding the key keeps it sliding
until release. Rover uses held compass keys and rising GO for the same
reasons.

![One press read two ways: rising fires once, held fires every eight frames.](../../assets/images/glimmer-book/book1/key-bindings.svg)

One property of the keypad shapes every control scheme: MON-3 reports
a single pressed key at a time. Held movement runs one direction at
once, and a fresh press takes over the autorepeat from the key before
it. Rover's controls, and every game later in this book, are built on
single-key movement, and the keypad's compass layout suits it. You
saw the takeover while holding 6 and tapping 2 in Rover.

## The `any` binding

A third binding form responds to every key:

```text
pulse Wake

bind key any rising -> Wake
```

`any` fires its pulse on every new press, whichever key it is, and it
fires alongside the named bindings. A press of GO therefore fires
both `Home` and `Wake` in the same frame. It comes in the rising shape only, and
it records one event: *the player touched the machine*. A title screen
can use that pulse to start the game after any key press.

## Generated polling

One generated routine produces all five of Rover's pulses and
implements autorepeat with a counter, a reload value and release-edge
handling. The top of the
routine, from
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
        ld      b,a                  ; B = key code (DE unsafe: matrix kbd)
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

Once per frame, the routine calls MON-3's keypad scanner. `_scanKeys`
returns its result in the flags (zero set means a key is down, carry
set means the press is new this frame), and from those two flags the routine
distinguishes the three input cases used in this chapter. A frame with
no key down disarms autorepeat. A held key counts its repeat clock
down and fires its pulse when the count runs out, reloading the period
from your `bind` line; your `period 8` lives down here as the reload
value. A new press fires its pulse at once and arms the clock. The
clock uses two bytes:

```asm
Glim_HeldKey:     .db $FF
Glim_HeldCount:   .db 0
```

Those bytes record which key is armed and how many frames remain until
it repeats. When a pulse fires here, the poll writes
the pulse's byte and sets its change bit directly, and because polling
runs before any block, every phase of the frame sees the moment.

At the other end of the frame, `GlimEndFrame` clears every pulse
byte. Between those
two points, a moment is a fact like any other: one frame wide, one bit
in `Changed0`, triggering whatever declared `on` it.

Later chapters produce moments from machine clocks. The next chapter
follows a moment through the three block phases and explains their
execution order:
[Compute, Effect, Render](05-compute-effect-render.md).

## Exercise

**Rising and held input.** What difference would the player notice if Rover's KEY_2 binding changed from `held period 8` to `rising`? Why is `rising` still the appropriate binding for the Home action?

[Exercise notes](exercise-notes.md#chapter-4-pulses-and-bindings)
