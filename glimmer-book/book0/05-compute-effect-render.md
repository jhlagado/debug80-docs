---
layout: default
title: "Compute, Effect, Render"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 5
---

[← Pulses and Bindings](04-pulses-and-bindings.md) | [Book](index.md)

# Chapter 5 - Compute, Effect, Render

Rover's blocks do two different jobs: five of them change facts, one
of them draws. Games have a third job, quieter than either - facts
computed *from other facts*. A score implies a difficulty. A count
implies a bar length. A position implies which board cell the player
occupies. Glimmer gives each of the three jobs its own block keyword,
runs them in a fixed order every frame, and that order is what this
chapter teaches - along with the delivery rules that make the whole
model dependable.

This is the last chapter of the book's first movement. After it, you
hold the complete mental model, and everything else in the book is
instruments and games built on it.

## Meter

The chapter's program is a level meter. Plus and minus raise and lower
a count from 0 to 64; the count appears on the seven-segment display;
and a green bar across the matrix shows the level, one pixel per eight
counts.

```text
program Meter

platform tec1g-mon3
display matrix8x8

state Count  : byte = 0 changed
state BarLen : byte

pulse IncP
pulse DecP

bind key KEY_PLUS  held period 6 -> IncP
bind key KEY_MINUS held period 6 -> DecP

effect Increase
    on IncP
    updates Count
begin
    ld a,(Count)
    cp 64
    jr nc,_stop     ; full: stay
    inc a
    ld (Count),a
_stop:
end

effect Decrease
    on DecP
    updates Count
begin
    ld a,(Count)
    or a
    jr z,_stop      ; empty: stay
    dec a
    ld (Count),a
_stop:
end

compute DeriveBar
    on Count
    updates BarLen
begin
    ld a,(Count)
    srl a
    srl a
    srl a           ; bar pixels = Count / 8
    ld (BarLen),a
end

render DrawBar
    on BarLen
begin
    call FbClear
    ld a,(BarLen)
    or a
    jr z,_done      ; empty bar: leave the matrix clear
    ld b,a          ; B = pixels still to light
_col:
    push bc
    ld a,b
    dec a
    ld b,a          ; B = x for this pixel
    ld c,3          ; C = y, the middle row
    ld a,COLOR_GREEN
    call FbPlot
    pop bc
    djnz _col
_done:
end

render ShowCount
    on Count
begin
    ld a,(Count)
    ld l,a
    ld h,0
    call HudWriteU16
end
```

One keyword is new: `compute`. `DeriveBar` holds no game rule and
draws no picture - it maintains a fact that follows from another fact,
the bar length that `Count` implies. `BarLen` is ordinary state, and
`DrawBar` depends on it exactly as any render depends on any fact.

## Three jobs, three keywords, one order

Every block you have written declares its job in its first word, and
the frame runs the jobs in a fixed order:

1. **compute** blocks run first: state derived from other state, so
   every fact that follows from other facts is current before anything
   uses it.
2. **effect** blocks run second: the game's rules, changing facts in
   response to moments.
3. **render** blocks run last: facts turned into pictures, after all
   the frame's changes have settled.

Each keyword also enforces its nature. A `render` block takes no
`updates` line - depicting the world is its whole job, and the
compiler holds it to that. A `compute` block requires one - producing
a fact is its purpose. An `effect` sits in the middle and does what
rules do: consumes moments, changes facts.

The payoff of the order is the sentence you can now say about any
Glimmer program: **when a render runs, the world it draws is
finished** - every rule has fired, every derived fact is consistent
with its sources.

The frame you toured in chapter 2 has grown its full shape. From
`meter.main.asm`:

```asm
MainLoop:
        call    ScanFrame            ; show one full frame, then blank
        call    GlimPollBindings     ; game work runs in the blank window
        call    GlimRunDeriveEffects
        call    GlimMergeRaised
        call    GlimRunLogicEffects
        call    GlimMergeRaised
        call    GlimRunRenderEffects
        call    GlimEndFrame
        jp      MainLoop
```

Three dispatchers, one per phase, in job order - and between them, the
merge calls that make the delivery rules below work.

## How a change travels

A block's `updates` marks facts changed. *When* the dependents see the
change follows one rule:

**A change is delivered exactly once - to later phases in the same
frame, otherwise in the next frame.**

Unpack it against Meter. `DeriveBar` updates `BarLen`, and BarLen's
one dependent is `DrawBar`, a render - a later phase. So the change is
delivered the same frame: raise the bar with plus, and the compute
that resizes it and the render that draws it happen in one frame.

`Increase` updates `Count`, and Count's dependents are `ShowCount` - a
render, later - and `DeriveBar` - a compute, which ran *before* the
logic phase this frame. One of the dependents has already had its
turn. Delivering to the render now and the compute later would split
the change in two, so the whole change waits: every dependent of
`Count` sees it at the start of the next frame, once, together.

You can read the rule straight out of the generated wrappers. After
`DeriveBar`'s body:

```asm
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_BARLEN
        ld      (Raised0),a
        ret
```

After `Increase`'s body:

```asm
        ld      a,(Next0)            ; a consumer already ran: defer to next frame
        or      CHG_COUNT
        ld      (Next0),a
        ret
```

Two staging bytes stand beside `Changed0`. `Raised0` holds same-frame
deliveries, and the `GlimMergeRaised` calls between phases fold it
into `Changed0` so the next phase sees it. `Next0` holds deferred
deliveries, and `GlimEndFrame` rolls it into `Changed0` as the next
frame begins - the handoff you saw in chapter 2, now with its reason
attached.

What the rule buys you: **the order you declare blocks in never
changes what a program does.** Move `DeriveBar` to the bottom of the
file and every delivery happens on the same frames as before. A frame
is one forward pass; every block runs at most once per frame; and a
chain that points backward - logic feeding a compute - advances one
step per frame instead of tangling. In Meter that means a press of
plus updates the count's digits and the bar on the following frame,
one frame after the pulse, every time, whatever order the source
declares its blocks in.

## The program, as a report

The chain this chapter has been tracing by eye, Glimmer prints on
request:

```sh
glimmer --deps meter.glim
```

```text
program Meter
  Count : state byte
    raised by: Increase, Decrease
    triggers:  DeriveBar (derive), ShowCount (render)
  BarLen : state byte
    raised by: DeriveBar
    triggers:  DrawBar (render)
  IncP : pulse
    raised by: key KEY_PLUS (held)
    triggers:  Increase (logic)
  DecP : pulse
    raised by: key KEY_MINUS (held)
    triggers:  Decrease (logic)
```

Every fact, who raises it, what it triggers, and each dependent's
phase: the program's whole design, computed from the `on`, `updates`,
and `bind` lines. When a program misbehaves, this report and the
question *which fact failed to change?* find most bugs before the
debugger opens. Chapter 12 builds a debugging practice on it.

## Summary

- Three block kinds for three jobs: `compute` derives facts from
  facts, `effect` applies rules to moments, `render` draws. The frame
  runs them in that order, so renders always draw a settled world.
- `render` takes no `updates`; `compute` requires one. The keyword
  enforces the job.
- Delivery is exactly once: changes reach later phases the same frame,
  and otherwise wait - whole - for the next frame's start. `Raised0`
  and `Next0` are the two staging bytes that implement the rule.
- Declaration order never affects behaviour. Backward chains advance
  one step per frame.
- `glimmer --deps` prints the reactive graph: every fact's raisers and
  dependents, straight from the declarations.

The model is complete. Next, the display gets its own chapter: what
the matrix profile builds, and every way to put light on it.

---

[← Pulses and Bindings](04-pulses-and-bindings.md) | [Book](index.md)
