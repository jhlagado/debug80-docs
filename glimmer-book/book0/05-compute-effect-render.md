---
layout: default
title: "Compute, Effect, Render"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 5
---

[Book](index.md) | [The 8x8 Matrix Profile →](06-the-matrix-profile.md)

# Chapter 5 - Compute, Effect, Render

Let me tell you what this chapter is before we start, because it has
earned the introduction: it is the last chapter of the book's first
movement. When you reach the bottom of it you will hold the complete
mental model, and everything after it is instruments and games -
displays and sound to learn, programs to build, but no new rules
about how a Glimmer program thinks. The model finishes here.

Here is the gap it closes. Rover's blocks do two different jobs: five
of them change facts, one of them draws. Games have a third job,
quieter than either - facts computed *from other facts*. A score
implies a difficulty. A count implies a bar length. A position
implies which board cell the player occupies. These are not rules,
and they are not pictures; they are consequences, and they need
somewhere to live. Glimmer gives each of the three jobs its own block
keyword and runs them in a fixed order every frame, and that order -
together with the delivery rules that make it dependable - is what I
am going to teach you now.

## Meter

The program I picked for the occasion is a level meter. Plus and
minus raise and lower a count from 0 to 64; the count appears on the
seven-segment display; and a green bar across the 8x8 RGB LED matrix
shows the level, one pixel per eight counts. I will tell you up front
that I designed Meter deliberately, and before the chapter ends I
will show you exactly what I built it to demonstrate.

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

One keyword in that file is new to you: `compute`. Look at what
`DeriveBar` does. It holds no game rule and it draws no picture - its
whole job is to maintain a fact that follows from another fact, the
bar length that `Count` implies, so that the fact is always there and
always current for whoever needs it. And I want you to notice that
`BarLen` is ordinary state: `DrawBar` depends on it exactly as any
render depends on any fact, with no idea and no care that the fact is
derived rather than set by a rule.

## Three jobs, three keywords, one order

Every block you have written declares its job in its first word, and
now I can tell you what the frame does with that word: it runs the
jobs in a fixed order, the same order in every Glimmer program.

1. **compute** blocks run first: state derived from other state, so
   every fact that follows from other facts is current before anything
   uses it.
2. **effect** blocks run second: the game's rules, changing facts in
   response to moments.
3. **render** blocks run last: facts turned into pictures, after all
   the frame's changes have settled.

Each keyword also enforces its nature, and I want you to hear that as
a kindness. A `render` block takes no `updates` line - depicting the
world is its whole job, and the compiler holds it to that. A
`compute` block requires one - producing a fact is its purpose. An
`effect` sits in the middle and does what rules do: consumes moments,
changes facts.

And here is why the order exists. It is a guarantee, and I am handing
it to you now to keep for the rest of the book: **when a render runs,
the world it draws is finished.** Every rule has fired, every derived
fact is consistent with its sources, and nothing you draw can ever be
half of one frame and half of another. You will never write a line of
code to arrange this; the phase order arranges it for every program
you will ever compile.

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

Three dispatchers, one per phase, in job order - and between them,
the merge calls whose purpose is the next section's whole subject.

## How a change travels

Back in chapter 2 I showed you `GlimEndFrame` handing `Next0` into
`Changed0`, and I promised to make the mechanism precise once you had
a program that needed it. Meter is that program. A block's `updates`
line marks facts changed; the question is *when* the dependents see
the change, and the answer is one rule:

**A change is delivered exactly once - to later phases in the same
frame, otherwise in the next frame.**

The first half of the rule is the comfortable half. `DeriveBar`
updates `BarLen`, and BarLen's one dependent is `DrawBar`, a render -
a later phase. So the change is delivered the same frame: raise the
bar with plus, and the compute that resizes it and the render that
draws it happen in one frame.

The second half is the one genuinely subtle rule in the whole model,
so I am going to slow down and walk it twice. First, from inside the
frame. `Increase` updates `Count`, and Count has two dependents:
`ShowCount`, a render, which runs later this frame - and `DeriveBar`,
a compute, which ran *before* the logic phase this frame. One of the
dependents has already had its turn. Deliver to the render now and to
the compute next frame, and you have split one change in two - digits
showing the new count above a bar still sized for the old one. So the
whole change waits. Every dependent of `Count` sees it at the start
of the next frame: once, together.

You can read both halves of the rule straight out of the generated
wrappers, and here is the admission I promised you at the top: I
built Meter so that both variants would appear in one file. After
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

Now the second walk, from the keypad this time, one frame at a time.
You press plus. On that frame `IncP` fires, `Increase` runs, and
Count's change goes into `Next0` and waits. On the following frame
the change is in `Changed0` from the start: `DeriveBar` runs and
resizes `BarLen` - a same-frame delivery to a later phase - so
`DrawBar` redraws the bar, and `ShowCount` rewrites the digits.
Digits and bar move together, one frame after the pulse, every time.
That is the shape worth remembering: a chain that points backward -
logic feeding a compute - advances one step per frame instead of
tangling. A frame is one forward pass, and every block runs at most
once per frame.

Here is what the rule buys you, and I want you to feel how unusual it
is: **the order you declare blocks in never changes what a program
does.** Move `DeriveBar` to the bottom of the file and every delivery
lands on the same frames as before. You can organise your source for
the person reading it - rules together, renders together, whatever
tells the story best - and the program's behaviour will not shift by
a single frame. A hand-rolled game loop never grants you that
freedom: there, moving a call *is* changing the program. This is
chapter 1's spreadsheet keeping its word. You never told the sheet
what order to recompute its formulas in, and you never tell Glimmer
either.

## The program, as a report

The chain you have been tracing by eye all chapter, Glimmer will
print for you on request - and I am closing the chapter with it
because it is a gift you will use for the rest of the book:

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
and `bind` lines you already wrote. There is nothing to maintain and
nothing to drift out of date. When a program misbehaves, this report
and the question *which fact failed to change?* find most bugs before
the debugger opens. Chapter 11 builds a debugging practice on it.

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

That is the model, all of it, and from here on we spend it rather
than extend it. Next, the display gets a chapter of its own: what
[the 8x8 matrix profile](06-the-matrix-profile.md) builds, and every
way to put light on it.

---

[Book](index.md) | [The 8x8 Matrix Profile →](06-the-matrix-profile.md)
