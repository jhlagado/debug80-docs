---
layout: default
title: "Motion Curves"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 8
---

[← Time](07-time.md) | [Book](index.md) | [Shapes, Sound and Displays on the Board →](09-shapes-sound-and-displays.md)

# Chapter 8 - Motion Curves

Chapter 7 gave your program a clock of its own: the ramp, a byte that
walks from 0 to its last step, once per frame, marked changed the
whole way. Point a compute block at it and a position starts moving.
Divide a 64-step ramp by eight and a dot crosses the 8x8 RGB LED
matrix:

```text
compute TrackComet
    on Travel
    updates CometX
begin
    ld a,(Travel)
    srl a
    srl a
    srl a               ; column = Travel / 8
    ld (CometX),a
end
```

Sixty-four frames, eight columns, eight frames on each: the crossing
is perfectly even. Watch it long enough to see what
it lacks. The dot goes exactly where it is told, on schedule, and that
is how it reads: a position being updated. The difference between
position and motion is the difference between a slide rule and a
thrown ball. The slider moves because a hand pushes it, at whatever
pace the hand keeps. The ball leaves your hand fast and slows as it
climbs; a landing bird glides in; a released spring shoots past its
rest point and settles back. Motion in the world accelerates and
eases, and your eye has spent a lifetime learning its shapes. On the
8x8 matrix the columns are fixed, so all of that character has to live
in the timing: how many frames the dot dwells on each column before
moving on. Equal steps show position. Shaped steps show motion. And on
sixty-four pixels, with no room for detail to carry the illusion, that
polish is most of what separates a demo from a game.

Shaping the steps by hand means arithmetic every frame - squares,
roots, eight-bit fractions - inside a frame that also has input and
drawing to run. Glimmer refuses to spend your frame on that, and the
trade it makes instead is one of my favourite things in the whole
system, so let me spell it out. A `curve` declaration names a motion
shape, and the compiler turns it into a table of bytes inside the
generated program. The expensive mathematics happens once, at build
time, on your desk, where cycles cost nothing. The Z80 pays one table
read per frame. You buy the flight of a thrown ball for the price of a
load.

## Comet

This chapter's program is Comet, and its whole job is to make that
flight something you can launch on demand. The dot rests at the left
edge of the middle row. GO launches it across the row: quick off the
pad, slowing all the way, gliding in to land near the right edge. GO
again - anytime, even mid-flight - launches it again.

```text
program Comet

platform tec1g-mon3
display matrix8x8

state CometX : byte = 0 changed

pulse Go
pulse Landed

ramp Travel : byte steps 64 -> Landed

curve Glide ease_out steps 64 from 0 to 6

bind key KEY_GO rising -> Go

effect Launch
    on Go
    updates Travel
begin
    xor a
    ld (Travel),a       ; rewind the ramp: the flight begins
end

compute TrackComet
    on Travel
    updates CometX
begin
    ld a,(Travel)
    ld e,a
    ld d,0
    ld hl,Curve_Glide
    add hl,de           ; HL points at this step's position
    ld a,(hl)
    ld (CometX),a
end

render DrawComet
    on CometX
begin
    call FbClear
    ld a,(CometX)
    ld b,a
    ld c,3
    ld a,COLOR_WHITE
    call FbPlot
end
```

One declaration is new, and it is the reason this chapter exists:

```text
curve Glide ease_out steps 64 from 0 to 6
```

Read it aloud, the way we always do: *Glide is an ease-out curve, 64
steps, running from 0 to 6.* At build time, Glimmer traces an ease-out
path - fast at first, slowing toward the end - and writes the 64
positions it passes through into the program as a table of bytes named
`Curve_Glide`. A curve is a resource: it declares data, so it owns no
cell, carries no change flag, and adds no work to the frame. It is
geometry your blocks consult, sitting in memory waiting to be read.

`TrackComet` is where the table gets put to work. Each frame of a
flight the ramp steps, `Travel` is marked changed, and the compute
runs. Its body indexes the table with the current step:

```text
    ld a,(Travel)
    ld e,a
    ld d,0
    ld hl,Curve_Glide
    add hl,de           ; HL points at this step's position
    ld a,(hl)
    ld (CometX),a
```

The step goes into DE, the table's base into HL, and the sum points at
the byte holding this step's column. Missing from that body is everything expensive: no squares, no roots, no fractions. The whole ease-out
calculation finished before the program ever ran; the frame pays for
one load.

Every ramp names an arrival pulse, so `Landed` fires as the flight
ends. Comet lands quietly for now; chapter 9 puts sound on moments
like this one.

Build it and press GO. The launch is brisk and the landing is soft,
and between the two the dot slows column by column - motion with a
shape, from a compute block seven instructions long.

## What a curve declares

The full form, every dial at once:

```text
curve <Name> <preset> steps <N> from <A> to <B>
```

`steps` runs from 2 to 256 and sets the table's length: one byte per
step. `from` and `to` are byte values, the positions at the start and
end of the run; leave them out and they default to 0 and `steps - 1`,
so `curve Fade linear steps 16` counts 0 through 15. The preset names
the shape, and there are seven to choose from:

- `linear` - equal spacing, the straight line the other six bend.
- `ease_in` - sets off slowly, arrives at speed.
- `ease_out` - sets off at speed, arrives slowly.
- `ease_in_out` - gentle at both ends, quick through the middle.
- `sine` - half a cosine wave; ease_in_out with rounder shoulders.
- `overshoot` - runs past `to`, then settles back onto it.
- `anticipation` - pulls back behind `from` before setting off.

The last two step outside the `from`..`to` run on purpose - that is
their character - and they come with a rule you must respect. Table
values clamp to the byte range 0 to 255, so give these presets
headroom: an overshoot aimed at `to 6` borrows column 7 for its peak,
and an anticipation launched `from 1` needs room to dip to 0. Glide
lands on column 6 for the same reason - Comet is about to grow two
more curves over the same run, and one of them springs.

## The ramp is the clock, the curve is the path

I want to slow down here, because Comet's motion is built on an idiom
you will use in every game from now on. Look at the two declarations,
sized to each other:

```text
ramp Travel : byte steps 64 -> Landed

curve Glide ease_out steps 64 from 0 to 6
```

The ramp keeps time. Its cell answers one question - how far along is
the flight? - and it knows nothing about columns. The curve holds the
geometry. Its table answers the other question - where does the flight
pass at each step? - and it knows nothing about frames. `TrackComet`
joins them, clock in, path out, one byte read per step. That split is
the idiom: time and path never meet until a block introduces them, so
one clock can drive any shape of journey.

Matching `steps` counts are the whole coupling. Sixty-four ramp steps
index sixty-four table entries; the final step reads the final byte,
so the dot stands on its landing column on the very frame `Landed`
fires.

The pairing hands you two independent dials, and you will reach for
both the first time you tune a game's feel. Duration is the steps
count in frames: raise both numbers to 128 and the same glide takes
twice as long. Feel is the preset name: change `ease_out` to `sine`
and rebuild, and the same 64-frame flight arrives with a different
character. Either way, the block joining them stays untouched.

## The table in the generated file

You know my habit by now: when I tell you something is cheap, we go
and look at the price tag. Open `comet.main.asm` and find the resource
the declaration became:

```asm
; --- curve resources ---
        .align  256
Curve_Glide:
        .db     0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3
        .db     3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4
        .db     5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6
        .db     6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6
```

Sixty-four bytes, one per ramp step, and you can read the ease-out
straight off the rows: the dot spends three frames on column 0 and
nineteen on column 6, each dwell longer than the last, give or take a
rounding step. The declaration's whole runtime cost is sitting in
front of you - 64 bytes of data.

`.align 256`, the line above the label, moves the assembler to the
next 256-byte page boundary before laying the table down, so
`Curve_Glide` starts at an address whose low byte is zero: a
page-aligned table. That alignment buys you an idiom. A curve holds
at most 256 bytes, every entry lives in the
base's own page, and the base's low byte is zero - so *base plus step*
collapses into writing the step straight into L:

```asm
    ld a,(Travel)
    ld l,a              ; page-aligned table: the step is the low byte
    ld a,(hl)
```

With a table base already in HL, three instructions read the path, DE
untouched. The final version of Comet leans on this.

## Switching curves in flight

The point of naming a motion is choosing between motions, and a choice
of motions is something you feel at the keypad, not something you read
in a paragraph. So here is the full Comet - three curves over the same
run, a `Preset` fact naming the current one, and PLUS cycling through
them. Before you read a word of my walkthrough, type it in, build
it, and fly all three. GO to launch, PLUS to
switch, GO again. Flick between the presets until you can tell them
apart with your eyes alone. Thirty seconds of that will teach you what
motion character means better than anything I write below.

```text
program Comet

platform tec1g-mon3
display matrix8x8

state CometX : byte = 0 changed
state Preset : byte = 0 changed

pulse Go
pulse Landed
pulse Switch

ramp Travel : byte steps 64 -> Landed

curve Straight linear    steps 64 from 0 to 6
curve Glide    ease_out  steps 64 from 0 to 6
curve Spring   overshoot steps 64 from 0 to 6

bind key KEY_GO   rising -> Go
bind key KEY_PLUS rising -> Switch

effect Launch
    on Go
    updates Travel
begin
    xor a
    ld (Travel),a       ; rewind the ramp: the flight begins
end

effect NextPreset
    on Switch
    updates Preset
begin
    ld a,(Preset)
    inc a
    cp 3
    jr c,_store         ; past the last preset: back to the first
    xor a
_store:
    ld (Preset),a
end

compute TrackComet
    on Travel, Preset
    updates CometX
begin
    ld hl,Curve_Straight
    ld a,(Preset)
    or a
    jr z,_index
    ld hl,Curve_Glide
    dec a
    jr z,_index
    ld hl,Curve_Spring
_index:
    ld a,(Travel)
    ld l,a              ; page-aligned table: the step is the low byte
    ld a,(hl)
    ld (CometX),a
end

render DrawComet
    on CometX
begin
    call FbClear
    ld a,(CometX)
    ld b,a
    ld c,3
    ld a,COLOR_WHITE
    call FbPlot
end

render ShowPreset
    on Preset
begin
    ld a,(Preset)
    inc a               ; show 1..3, matching the list above
    ld l,a
    ld h,0
    call HudWriteU16
end
```

Welcome back. Now let me show you where what you felt comes from. The
three curve lines differ in one word each: `Straight` is the
reference, `Glide` the soft arrival, `Spring` the overshoot. `Preset`
is an ordinary fact holding 0, 1 or 2, and `changed` puts its number
on the seven-segment display from the first frame; `NextPreset` cycles
it, with `cp 3` carrying the curve count. `ShowPreset` adds one so the
display reads 1 to 3, matching the order the curves are declared in.

`TrackComet` now opens with a selection:

```text
    ld hl,Curve_Straight
    ld a,(Preset)
    or a
    jr z,_index
    ld hl,Curve_Glide
    dec a
    jr z,_index
    ld hl,Curve_Spring
_index:
```

A chain of loads leaves HL holding the base of whichever table
`Preset` names, and from `_index` the page-alignment idiom finishes
the job. Every curve table is page-aligned, so one `ld l,a` serves all
three; picking a motion at runtime costs the frame a few loads and
branches before the same single table read.

`Spring` is worth reading in the generated file, because by now you
have felt it and the numbers explain the feel:

```asm
        .align  256
Curve_Spring:
        .db     0, 0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5
        .db     5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 7
        .db     7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6
        .db     6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6
```

Halfway through the flight the dot climbs onto column 7 - the spare
column the headroom rule kept free - holds it for thirteen frames,
then settles back onto 6 for the landing. All three tables end on 6,
so pressing PLUS while the comet rests redraws it where it stands.

Two behaviours you may have noticed at the keypad deserve their
explanations. On the very first frame, `Preset` is already changed, so
`TrackComet` runs before any launch, reads the idle ramp's final step,
and the dot appears on its landing column, waiting for GO. And
`TrackComet` triggers `on Travel, Preset`, so a switch lands
immediately: press PLUS during a flight and the dot jumps to the new
path's position at the same step, then finishes the journey on the new
curve. Launch under preset 1 and you are watching this chapter's
opening motion again, equal dwell on every column. Preset 2 glides in;
preset 3 springs past and settles. The difference between the three is
one word in a declaration and zero instructions in the blocks.

## Summary

What this chapter puts in your hands:

- `curve <Name> <preset> steps <N> from <A> to <B>` declares a
  build-time byte table. Presets: `linear`, `ease_in`, `ease_out`,
  `ease_in_out`, `sine`, `overshoot`, `anticipation`; `steps` runs 2
  to 256; `from` and `to` default to 0 and `steps - 1`.
- A curve is a resource: no cell, no change flag, no frame work. The
  name compiles to a page-aligned table `Curve_<Name>`, emitted as
  `.align 256` and `.db` rows you can read the motion from.
- The ramp is the clock, the curve is the path: a compute block joins
  them with one table read per step. Matching `steps` counts line the
  table up with the ramp, and the final step lands on `to` as the
  arrival pulse fires.
- Duration is the steps count in frames; feel is the preset name. Each
  changes in a declaration, and the joining block stays untouched.
- `overshoot` runs past `to` and `anticipation` dips behind `from`;
  table values clamp to 0..255, so leave headroom at the borrowed end.
- Page alignment collapses indexing to `ld l,a`: with a table base in
  HL, the step is the low byte.
- A state cell choosing between table bases switches motion at
  runtime, by name.

Next the comet earns a body, a voice, and a scoreboard: shapes,
sound, and the board's displays.

---

[← Time](07-time.md) | [Book](index.md) | [Shapes, Sound and Displays on the Board →](09-shapes-sound-and-displays.md)
