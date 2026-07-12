---
layout: default
title: "Time"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 7
---

[← The 8x8 Matrix Profile](06-the-matrix-profile.md) | [Book](index.md) | [Motion Curves →](08-motion-curves.md)

# Chapter 7 - Time

Notice something about every program you have written so
far: none of them can act without you. Mover's dot sits wherever your
last press left it. Meter's bar holds its level until you lean on plus
or minus. Take your hands off the keypad and frame after frame goes by
with every change flag clear and every block at rest - the machine is
running, but nothing is happening.

A game cannot afford that kind of patience. Take your hands off a real
game for ten seconds and something still moves: a drop falls, a ghost
patrols, a fuse burns down. This is where challenge comes from - a
game that acts while you hesitate is a game you can lose. Until now
your programs have had exactly one source of moments, the keypad,
which means the player has held all the initiative. This chapter gives
the machine some initiative of its own.

You already own the clock we need. The frame you toured in chapter 6
scans the 8x8 RGB LED matrix, polls the keypad, runs whatever changed,
and comes around again for as long as the power holds. Every turn of
that loop is a beat, and this chapter is about declaring moments
against those beats. Glimmer gives you three ways to do it - a
built-in frame counter, timers, and ramps - and each answers a
different question about time. I will give you the plain phrasing for
each as we meet it. Our program is *Drip*: a drop that falls on its
own schedule, blinks as it falls, and falls faster the longer the
program runs. Before we start, appreciate one line Drip does not
have: there is no `bind` in it. Nothing in this program
answers to the keypad, and it plays anyway.

## Every frame

Start with the smallest schedule there is: a block that runs on every
single frame.

```text
program Ticks

platform tec1g-mon3
display matrix8x8

render ShowFrames
    on FrameCount
begin
    ld a,(FrameCount)
    ld l,a
    ld h,0
    call HudWriteU16
end
```

`FrameCount` is built in - a byte cell every Glimmer program may name
without declaring it. Each frame, before the phases run, the runtime
increments it and marks it changed, so a block with `on FrameCount`
runs every frame, reading a value that climbs 0, 1, 2, and wraps past
255 back to 0.

Build and run this, and the seven-segment display counts the frames as
they happen. Watch the pace of those digits for a moment, because each
count is one full turn of the loop - one scan of the 8x8 matrix, one
poll, one pass through your blocks. That pace is the fastest schedule
a Glimmer program has.

One cost to know before you reach for it. Flag bits are a budget - a
program holds up to 32 flag-carrying cells - and `FrameCount` takes a
bit only in a program that names it. Ticks pays for one cell; Drip,
which never mentions `FrameCount`, pays nothing for it.

And for motion, the every-frame schedule runs too hot. A drop stepping
one row per frame falls off an eight-row board in eight frames.
Chapter 1 called one step every eight frames a playable pace; eight
steps in eight frames is a flash. Game tempo lives at *every N
frames*, with N yours to choose - and, since games change difficulty,
yours to change while the program runs. Hold that last thought; it is
where this chapter is headed.

## A drop on a schedule

Drip's first cut: a drop that falls one row at a time, and
starts over from the top after it leaves the bottom.

```text
program Drip

platform tec1g-mon3
display matrix8x8

state DropY : byte = 0 changed

pulse FallTick

timer Fall : byte = 24 -> FallTick

effect Descend
    on FallTick
    updates DropY
begin
    ld a,(DropY)
    inc a
    cp 8
    jr c,_store     ; still on the board
    xor a           ; past the bottom: back to the top
_store:
    ld (DropY),a
end

render DrawDrop
    on DropY
begin
    call FbClear
    ld a,(DropY)
    ld c,a          ; C = y
    ld b,3          ; B = x, the middle column
    ld a,COLOR_BLUE
    call FbPlot
end
```

One declaration is new:

```text
timer Fall : byte = 24 -> FallTick
```

Read it aloud, the way I taught you in chapter 1: *Fall is a byte
timer with period 24, firing FallTick.* A `timer` is an oscillator,
and its answer to the question of time is *every N frames, forever*.
Behind the name sits a hidden countdown that loses one on every frame;
the frame it reaches zero, the timer fires its pulse and the countdown
reloads from `Fall` to begin the next cycle. `FallTick` fires on frame
24, frame 48, frame 72 - every 24 frames, for as long as the program
runs.

Look twice at what the timer fires: `FallTick` is a pulse exactly
like the ones your keys fire - declared with the same word, consumed
the same way. `Descend` reads as every rule you
have written: on a moment, change a fact. Point a `bind` line at
`FallTick` instead and the same block would run per keypress. A rule
never knows where its moment comes from, and that ignorance is a
feature: you can retune a game's entire schedule without touching a
single rule.

Where in the frame does the ticking happen? Right after the keypad
poll, before any phase runs - the generated loop below shows the call.
So a pulse fired by a timer is seen by every block in the same frame,
and clears at the end of the frame like every pulse.

Now the part I most want you to hold onto. The cell named `Fall` is
the period, and it is ordinary writable state: a block that lists
`updates Fall` and stores a new value has changed the tempo from the
next reload on. One distinction to keep straight: a timer's cell
carries no change flag - the pulse is its announcement. So `Fall` may
stand in `updates` lines, and `on` lines take `FallTick`. Drip's last
section spends that writable period, and it is the best moment in the
chapter.

## A blink

One steady pixel reads as furniture. I want the drop to read as alive,
and a blink buys that for the price of one more timer and one more
fact:

```text
state Visible : byte = 1
```

```text
timer Fall  : byte = 24 -> FallTick
timer Blink : byte = 5  -> BlinkTick
```

```text
effect Twinkle
    on BlinkTick
    updates Visible
begin
    ld a,(Visible)
    xor 1
    ld (Visible),a
end
```

Every fifth frame, `Twinkle` flips `Visible` between 1 and 0.
`DrawDrop`'s trigger grows to `on DropY, Visible`, so the drop redraws
when it moves and when it blinks, and its body tests `Visible` before
plotting: the dark half of the blink is a cleared framebuffer. The
full listing follows in the next section.

Each timer owns its own hidden countdown; the two share nothing except
the frame. Periods 24 and 5 drift in and out of step with each other,
and neither cares - you declared two independent schedules, and
independent is what you got.

## One shot

An oscillator fires forever, and some moments should arrive exactly
once, after a delay: a grace period before a hazard arms, a pause
before a restart. The question those moments ask is *once, N frames
from now*, and the answer is one word added to the declaration:

```text
timer Grace : word = 384 -> GraceOver once
```

With `once`, the cell is the countdown itself. It loses one each
frame, fires its pulse the frame it reaches zero, and then sits at
zero, idle, until a block writes it. Each write arms exactly one
firing:

```text
    ld hl,384
    ld (Grace),hl
```

`word` is the point here: a byte cell tops out at a 255-frame delay,
and a word countdown runs to 65535. Drip has no use for a one-shot;
the delayed restart in chapter 13's card game is the shape of moment
they are for, and I mention them now so you know all three phrasings
before we finish the game.

## The climb

Drip has one problem left, and it is the most interesting one: it
plays its hundredth descent at the pace of its first. A game grows
harder, and on this board that means one concrete thing - the fall
period should shrink as time passes. 24, then 20, then 16, down to a
floor. Two needs hide in that sentence: a long, patient schedule to
space the changes out, and the change itself when the schedule comes
due. The schedule is the last of this chapter's declarations, the
`ramp`:

```text
ramp Heat : byte steps 250 -> HeatUp
```

Say it aloud: *Heat is a ramp over 250 steps, firing HeatUp.* Where a
timer answers *every N frames, forever*, a ramp answers *progress from
here to there, step by step*. Each frame, a ramp steps its cell one
closer to `steps - 1`, marking it changed at every step - this is a
fact in motion, and a block with `on Heat` could watch the whole
journey go by. On the step that reaches 249 it fires its pulse, and
there it idles. Writing the cell sets it moving again: write 0 and the
full climb runs from the start. Drip spends only the arrival; chapter
8 spends the journey.

One wrinkle before it all comes together. A freshly started program's ramp sits
at its terminal value, idle, so the first climb needs a push - and a
familiar word supplies the moment to push from:

```text
state Boot    : byte = 0 changed
```

```text
effect Ignite
    on Boot
    updates Heat
begin
    xor a
    ld (Heat),a     ; start the first climb
end
```

`Boot` begins changed, and no block ever updates it, so `Ignite` runs
exactly once, on the first frame. The word `changed` has drawn
first-frame pictures for you since chapter 1; here it fires a
first-frame rule instead, and the trick is worth keeping - every
program that needs a hand on startup can use it.

When the climb arrives, `Quicken` collects it, and this is the moment
I have been steering the whole chapter toward. Here is the complete
program:

```text
program Drip

platform tec1g-mon3
display matrix8x8

state DropY   : byte = 0 changed
state Visible : byte = 1
state Boot    : byte = 0 changed

pulse FallTick
pulse BlinkTick
pulse HeatUp

timer Fall  : byte = 24 -> FallTick
timer Blink : byte = 5  -> BlinkTick

ramp Heat : byte steps 250 -> HeatUp

effect Ignite
    on Boot
    updates Heat
begin
    xor a
    ld (Heat),a     ; start the first climb
end

effect Descend
    on FallTick
    updates DropY
begin
    ld a,(DropY)
    inc a
    cp 8
    jr c,_store     ; still on the board
    xor a           ; past the bottom: back to the top
_store:
    ld (DropY),a
end

effect Twinkle
    on BlinkTick
    updates Visible
begin
    ld a,(Visible)
    xor 1
    ld (Visible),a
end

effect Quicken
    on HeatUp
    updates Fall, Heat
begin
    ld a,(Fall)
    cp 8
    jr c,_floor     ; fast enough: hold the pace
    sub 4
    ld (Fall),a     ; the next reload counts from here
_floor:
    xor a
    ld (Heat),a     ; rewind the climb
end

render DrawDrop
    on DropY, Visible
begin
    call FbClear
    ld a,(Visible)
    or a
    jr z,_done      ; the blink's dark half: leave the matrix clear
    ld a,(DropY)
    ld c,a          ; C = y
    ld b,3          ; B = x, the middle column
    ld a,COLOR_BLUE
    call FbPlot
_done:
end
```

Read `Quicken`'s body and watch difficulty turn out to be ordinary:
`sub 4` and a store into `Fall`, the same write any effect makes to
any state, and the timer's next reload counts from the new period. The
game is changing its own tempo from an ordinary `updates` line.
Difficulty is data - pause on that for a second, because it is the
thrill of this chapter. The `cp 8` holds a floor - periods run
24, 20, 16, 12, 8, then settle at 4 - and the final store rewinds
`Heat` to begin the next 250-frame climb.

Run it. The drop crawls down the middle column, blinking as it goes,
and wraps back to the top. Around its second descent the pace picks
up, then again at the top of every climb, until it settles into a
quick steady drip. Now stand back from what you typed: speed, blink,
and difficulty each cost you one declaration and one small rule, and
none of the three knows the others exist.

## The program, as a report

Drip is the first program whose moments come from three different
places, and its dependency report shows all three:

```sh
glimmer --deps drip.glim
```

```text
program Drip
  DropY : state byte
    raised by: Descend
    triggers:  DrawDrop (render)
  Visible : state byte
    raised by: Twinkle
    triggers:  DrawDrop (render)
  Boot : state byte
    raised by: (nothing)
    triggers:  Ignite (logic)
  FallTick : pulse
    raised by: timer Fall
    triggers:  Descend (logic)
  BlinkTick : pulse
    raised by: timer Blink
    triggers:  Twinkle (logic)
  HeatUp : pulse
    raised by: ramp Heat
    triggers:  Quicken (logic)
  Fall : timer
    raised by: Quicken
    triggers:  (nothing)
  Blink : timer
    raised by: (nothing)
    triggers:  (nothing)
  Heat : ramp
    raised by: Ignite, Quicken
    triggers:  (nothing)
```

The schedules take their place in the graph beside everything else:
`raised by: timer Fall` and `raised by: ramp Heat` read exactly like
the `key` lines in Meter's report, because a moment is a moment
wherever it comes from. Two entries reward a closer look. `Fall` shows
`raised by: Quicken` and `triggers: (nothing)` - its writes matter to
the hidden countdown, and no block watches the cell. And `Boot`,
raised by nothing, is the report's way of showing a moment that exists
purely because a declaration marked it changed.

## Inside GlimTickTimers

I have spent this chapter talking about a *hidden* countdown, and
after everything I promised you in chapter 1, that word ought to itch.
Nothing stays hidden once you open the generated file, so let us go
and find it. From `drip.main.asm`, the storage:

```asm
; --- state storage ---
DropY:            .db 0
Visible:          .db 1
Boot:             .db 0
FallTick:         .db 0
BlinkTick:        .db 0
HeatUp:           .db 0
Fall:             .db 24   ; period (writable)
Glim_Fall_cnt:    .db 24
Blink:            .db 5   ; period (writable)
Glim_Blink_cnt:   .db 5
Heat:             .db 249   ; ramp progress, idle at terminal
Changed0:         .db %00000101   ; flags dispatch tests
```

There it is: the hidden countdown has a name after all.
`Glim_Fall_cnt` is one byte sitting beside the period it reloads from,
and `Blink` gets a countdown of its own. `Heat` begins at 249, its
terminal, idle until `Ignite` writes it. And `Changed0` starts at
`%00000101` - bits 0 and 2, the two cells you declared `changed`:
`DropY` for the first picture, `Boot` for the first climb.

The loop shows where the ticking lives:

```asm
MainLoop:
        call    ScanFrame            ; show one full frame, then blank
        call    GlimPollBindings     ; game work runs in the blank window
        call    GlimTickTimers
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

`GlimTickTimers` runs after the poll and before every phase, and that
placement is why a timer's pulse reaches its consumers in the frame it
fires. The routine itself opens with `Fall`:

```asm
; --- timers, ramps, frame counter ---
.routine
GlimTickTimers:
        ld      a,(Glim_Fall_cnt)
        dec     a
        ld      (Glim_Fall_cnt),a
        jr      nz,_next_Fall
        ld      a,(Fall)       ; reload from period cell
        ld      (Glim_Fall_cnt),a
        ld      a,1
        ld      (FallTick),a
        ld      a,(Changed0)
        or      CHG_FALLTICK
        ld      (Changed0),a
_next_Fall:
```

Decrement, store, and on the zero frame: reload from `Fall`, set the
pulse byte, and OR the pulse's flag straight into `Changed0`. Compare
that last move with the blocks you write, which raise through
`Raised0` or `Next0` because some consumers may already have run. The
tick runs before all of them, so it can deliver directly, and the
exactly-once rule from chapter 5 holds untouched.

Further down, the ramp:

```asm
        ld      a,(Heat)
        cp      249
        jr      nc,_next_Heat           ; idle at terminal
        inc     a
        ld      (Heat),a
        ld      a,(Changed0)
        or      CHG_HEAT
        ld      (Changed0),a
        ld      a,(Heat)
        cp      249
        jr      nz,_next_Heat
        ld      a,1                  ; arrived: fire completion
        ld      (HeatUp),a
        ld      a,(Changed0)
        or      CHG_HEATUP
        ld      (Changed0),a
_next_Heat:
        ret
```

The first compare is the idle test: at 249 the whole section falls
through. Below it, each moving frame steps the cell and marks
`CHG_HEAT` - the per-step change flag a `ramp` cell carries and a
`timer` cell lacks - and the step that lands on 249 also fires
`HeatUp`. When `Quicken` stores 0, the idle test fails on the next
tick and the climb resumes. Restart is a plain write to a plain byte.

One line of `Quicken`'s wrapper closes the circle. Its header says
`updates Fall, Heat`, and the generated raise after its body covers
`Heat` alone:

```asm
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_HEAT
        ld      (Raised0),a
        ret
```

With no flag behind `Fall`, `updates Fall` compiles to nothing here;
the store inside the body is the entire event, and the header line
documents it - for the dependency report, and for you.

One last economy to appreciate. `GlimTickTimers` is generated only
when a program declares a timer or a ramp or names `FrameCount` - look
back at Meter's loop in chapter 5 and you will find no such call. A
program that declares no schedules pays nothing for the ones it could
have had.

## Summary

- `FrameCount` is a built-in byte cell, incremented and marked changed
  every frame; `on FrameCount` runs a block every frame, and the cell
  takes a change-flag bit only in programs that name it.
- `timer Name : byte = N -> Pulse` declares an oscillator: a hidden
  countdown fires the pulse and reloads from the cell every N frames.
  The cell is the writable period - store a new value and the tempo
  changes from the next reload.
- `timer ... once` makes the cell the countdown itself: one firing
  when it reaches zero, idle at zero until a block writes it again.
- `ramp Name : byte steps N -> Pulse` steps its cell toward `N - 1`
  once per frame, marks it changed at every step, fires the pulse on
  arrival, and idles at the terminal; writing 0 starts the climb over.
- Timer cells carry no change flag - trigger on the pulse. Ramp cells
  do, so blocks can follow the journey with `on`.
- Ticking runs after the poll and before the phases: timer and ramp
  pulses are seen the same frame they fire and clear at frame end.
- A state declared `changed` that nothing updates is a first-frame
  moment: one rule, run once, at startup.

Drip's drop falls in equal steps, the plainest motion there is; next
chapter we shape those steps into curves, and meet the ramp-driven
pattern that plays them back: [Motion Curves](08-motion-curves.md).

---

[← The 8x8 Matrix Profile](06-the-matrix-profile.md) | [Book](index.md) | [Motion Curves →](08-motion-curves.md)
