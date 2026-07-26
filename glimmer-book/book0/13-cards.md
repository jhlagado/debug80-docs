---
layout: default
title: "Cards"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 13
---

[← Routines, Parts and Imports](12-routines-parts-and-imports.md) | [Book](index.md) | [A Small Matrix Game →](14-a-small-matrix-game.md)

# Chapter 13 - Cards

Picture an arcade machine. The screen that drew you over (the attract
screen, blinking its invitation) is
a little program of its own: it keeps no score, obeys no joystick, and
knows nothing about what happens after the coin drops. Put the coin in
and a different program takes over: rules, clock, score. Lose, and a
third one shows you the damage and waits to offer another round. Most
finished games are at least three programs wearing one cabinet, and at any
instant exactly one of the three is running. Until today, you have had
no way to say so.

In every program you have written so far, every block is in play on
every frame. To hold three screens in one file with the toolkit you
have, you would reach for what every programmer reaches for: a Mode
fact, and the same guard at the top of every single body. *Am I the
screen that owns this block?* This chapter's game has thirteen
blocks, so that is thirteen copies of one test. And the cost is worse
than the typing: the headers, the design you have learned to read
straight off the page, would say nothing about which screen owns
what.

Glimmer's word for a screen or mode is a **card**, borrowed from
HyperCard, which built whole applications out of stacks of them.
Exactly one card is active at a time. A `card` line starts a
block-dispatch section: the blocks after it run only while that card
is active. A card gates dispatch; it does not create a separate scope.
State, pulses, timers and resources stay program-wide wherever you write them, so put them at
the top of the file where the design lives, and let the card sections
hold blocks.

Cards are also a choice, and the choosing rule is short: reach for
them when groups of blocks belong to mutually exclusive modes
(screens, a pause, a round structure). A one-screen program is better
off cardless, and every program before this chapter was exactly
that.

## Gate

The chapter's game is Gate, and as a game it is a shell. At the
splash, two pixels blink in the middle of the 8x8 RGB LED matrix, and
any key starts a round. A round
is 512 frames on a clock drawn as a shrinking green bar, and every
press of GO scores a point on the seven-segment display. When the
clock drains, the score appears as a red bar, and after a ninety-frame
pause any key returns to the splash.

![Gate's three cards, and the condition on each transition.](../../assets/images/glimmer-book/book0/card-machine.svg)

The whole game is one file, `gate.glim`, and we are going to walk it
top to bottom. It opens above any `card` line with the program-wide
declarations (the facts, moments, and schedules every card shares):

```text
program Gate

platform tec1g-mon3
display matrix8x8

state Score    : byte
state PromptOn : byte
state Armed    : byte

pulse AnyKeyP
pulse HitP
pulse BlinkTick
pulse TimeUp
pulse GateOpenP

timer Blink       : byte = 16 -> BlinkTick
timer PlayClock   : word = 0  -> TimeUp once
timer RestartGate : word = 0  -> GateOpenP once

bind key any    rising -> AnyKeyP
bind key KEY_GO rising -> HitP
```

`PlayClock` and `RestartGate` are one-shot timers holding zero: idle
until a block writes them, and the blocks that write them arrive with
their cards. The overlap in the bindings is deliberate: a press of GO
fires both `HitP` and `AnyKeyP` because `any` runs alongside a matching
named binding.

## A card is a section

The first `card` line follows the globals, and the splash screen is
everything from that line to the next one:

```text
card Splash

enter ShowSplash
    updates PromptOn
begin
    call FbClear
    call HudBlankDig
    ld a,1
    ld (PromptOn),a
end

effect BlinkPrompt
    on BlinkTick
    updates PromptOn
begin
    ld a,(PromptOn)
    xor 1
    ld (PromptOn),a
end

render DrawPrompt
    on PromptOn
begin
    call FbClear
    ld a,(PromptOn)
    or a
    jr z,_done
    ld b,3
    ld c,3
    ld a,COLOR_WHITE
    call FbPlot
    ld b,4
    ld c,3
    ld a,COLOR_WHITE
    call FbPlot
_done:
end

effect StartGame
    on AnyKeyP
    goto Playing
end
```

`card Splash` is the entire declaration: one line, no `begin`, no
body. It does not open a block; it starts a *section*, and the section
runs until the next `card` line, or the end of the file for the last
card.

Every block in the section is **card-gated**: it dispatches only
while Splash is the active card. `BlinkTick` fires every 16 frames
forever (it is a global, nothing stops it), and `BlinkPrompt` answers
it only at the splash. During a round the same tick fires, finds no
active listener, and clears at frame end like any pulse. The block's
position in the file is its entire mode test.

The three `card` lines also hand you two names you can use in code.
`Card` is an assembler enum: `Card.Splash`, `Card.Playing`,
`Card.GameOver`. `CurrentCard` is a built-in byte cell, a fact
like any other, legal in `on` and `updates`. It starts at the first
declared card, which is how Splash becomes the start card, and it
starts marked changed, so frame one delivers it.

## Arriving on a card

`ShowSplash` is an `enter` block: it runs once, on the frame its card
becomes active. Its header carries no `on` line, because arriving *is*
the trigger. It dispatches ahead of
the card's other blocks in its phase, so the card is set up before any
of its rules run. It takes `updates`, and, as you will see in a
moment, it may take `goto`.

The body prepares a clean screen: clear the framebuffer, blank the
seven-segment digits (`HudBlankDig` is the display's counterpart to
`FbClear`), and set `PromptOn`. The `updates` line delivers `PromptOn`
to the render phase in the same frame, so the
prompt is lit on the very first frame of the card, with the blink
timer taking over from there.

Entry is edge-triggered: an enter block runs when the program
*changes* to its card, not while the program sits on it. Frame one
counts; the start card is entered like any other. Every later arrival
counts too, so each trip back from the game-over screen repaints a
fresh splash. Setup that runs once per arrival suits a title screen
and a new round alike, and it is the behaviour you would have
hand-built with a DidInit flag and a guard.

## Leaving a card

```text
effect StartGame
    on AnyKeyP
    goto Playing
end
```

`goto` in a block header is an unconditional transition: after the
block runs, the program switches to the named card. `StartGame` has
nothing else to do, and with `goto` in the header, `begin` is
optional. A header-only routing block closes directly with `end`, and
the `goto` compiles to an update of `CurrentCard`.

## The round

```text
card Playing

enter StartRound
    updates Score, PlayClock
begin
    xor a
    ld (Score),a
    ld hl,512           ; the round: 512 frames on the clock
    ld (PlayClock),hl
end

effect ScorePoint
    on HitP
    updates Score
begin
    ld a,(Score)
    inc a
    ld (Score),a
end

render ShowScore
    on Score
begin
    ld a,(Score)
    ld l,a
    ld h,0
    call HudWriteU16
end

render DrawClock
    on FrameCount
begin
    call FbClear
    ld hl,(PlayClock)
    add hl,hl
    add hl,hl           ; HL * 4: frames-left / 64 lands in H
    ld a,h              ; A = bar pixels, 8 down to 0
    or a
    jr z,_done
    ld b,a
_col:
    push bc
    ld a,b
    dec a
    ld b,a              ; B = x for this pixel
    ld c,3              ; C = y, the middle row
    ld a,COLOR_GREEN
    call FbPlot
    pop bc
    djnz _col
_done:
end

effect EndRound
    on TimeUp
    goto GameOver
end
```

`StartRound` zeroes the score and arms the clock, and it must arm on
entry. The alternative shows why: declare `PlayClock : word = 512`
instead, and the countdown starts spending itself the moment the
program boots, while the splash is still blinking. `TimeUp` fires
into a frame where no active block listens, the clock settles at zero,
and the round that eventually starts has no end.

`DrawClock` reads the timer cell directly. A one-shot's cell *is* the
countdown, so `PlayClock` is the frames
remaining, and the two `add hl,hl` put frames-remaining divided by 64
into H: a bar of eight pixels down to none, one pixel per 64 frames
left. Running `on FrameCount`, the block redraws every frame of the
round and never draws outside it, because the card gates it along
with everything else in the section.

And here the gating settles those overlapping bindings from the top
of the file. During a round, one press of GO raises `HitP` and
`AnyKeyP` together. `HitP` finds `ScorePoint`; `AnyKeyP`'s two
consumers, `StartGame` and `Restart`, sit on the other two cards,
gated off.

## The gated restart

```text
card GameOver

enter ShowFinal
    updates Score, Armed, RestartGate
begin
    xor a
    ld (Armed),a        ; close the restart gate
    ld hl,90            ; and schedule its opening
    ld (RestartGate),hl
end

render FinalBar
    on Score
begin
    call FbClear
    ld a,(Score)
    cp 9
    jr c,_len
    ld a,8              ; the bar tops out at the matrix edge
_len:
    or a
    jr z,_done
    ld b,a
_col:
    push bc
    ld a,b
    dec a
    ld b,a
    ld c,3
    ld a,COLOR_RED
    call FbPlot
    pop bc
    djnz _col
_done:
end

effect OpenGate
    on GateOpenP
    updates Armed
begin
    ld a,1
    ld (Armed),a
end

effect Restart
    on AnyKeyP
    updates CurrentCard
begin
    ld a,(Armed)
    or a
    jr z,_done          ; gate still closed: stay
    ld a,Card.Splash
    ld (CurrentCard),a
_done:
end
```

The last card exists because of something you would discover in your
first minute of playtesting: a player mashing GO at the end of a round
sails straight past the result screen without ever seeing it. So restart waits
behind a gate. `ShowFinal` closes it and arms `RestartGate`; ninety
frames later `GateOpenP` fires and `OpenGate` opens it, and only then
does a key press travel.

`Restart` is the travel, and it is our first transition that depends
on a runtime test. `goto` is unconditional once its block runs, so a
conditional transition writes `CurrentCard` itself: declare
`updates CurrentCard`, and store a `Card` value on the branch that
leaves. The enum members are ordinary assembler constants, so
`ld a,Card.Splash` is plain Z80 with a generated name in it.

`Restart` may look wrong when the gate is shut. The body stores
nothing, yet `updates CurrentCard` still marks the
cell changed. Entry is edge-triggered: an enter block runs
only when the program actually changed to its card. Marking
`CurrentCard` changed while staying on GameOver therefore re-runs
nothing.

## Facts that changed while you were away

`FinalBar` draws the score, and
it depends on `Score`, a fact whose last change happened during the
round, frames before this card existed on screen. `Score` changed
many times in that round, and each change was delivered exactly once
in its own frame, to the
blocks active at the time, and the flag dropped at that frame's end. **A card-gated block never sees flags
raised while its card was inactive.** Left to itself, `FinalBar` would
wait forever on a flag that already came and went, and the game-over
screen would show you a blank 8x8 matrix.

The fix is in the enter block's header, which you already read past
once:

```text
enter ShowFinal
    updates Score, Armed, RestartGate
```

`Score` is in the `updates` list, and the body never stores to it.
`updates` is a declaration, and Glimmer compiles the declaration: the
generated wrapper after `ShowFinal`'s body raises every listed flag,
stores or no stores. From `gate.main.asm`:

```asm
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_SCORE + CHG_ARMED
        ld      (Raised0),a
```

One of those two raises is a **re-raise**: `Score` holds the value it
held a moment ago, and its flag goes up again, so `FinalBar` runs on
the card's first frame and paints the result. When a card's renders
depend on facts that changed while the card was away, list those facts
in the enter block's `updates`.

## Transitions land at frame boundaries

`StartGame` runs in the middle of a frame, in the logic phase, with
Splash's other blocks still mid-frame around it. Splash remains active
for the rest of that frame; Playing starts on the next.

First, `CurrentCard` is the *next-card* register. What `goto Playing`
became, from `gate.main.asm`:

```asm
Glim_StartGame:
        ld      a,Card.Playing      ; goto Playing
        ld      (CurrentCard),a
        ld      a,(Next1)            ; a consumer already ran: defer to next frame
        or      CHG_CURRENTCARD
        ld      (Next1),a
        ret
```

`CurrentCard`'s consumers are the enter blocks, and they dispatch at
the head of the phase. By the time any goto runs, they have had their
turn this frame, so the change defers to `Next1` and arrives whole at
the next frame's start.

Second, dispatch gates never test `CurrentCard`. They test a copy
latched once per frame, at the top of the loop:

```asm
MainLoop:
        call    ScanFrame            ; show one full frame, then blank
        call    GlimPollBindings     ; game work runs in the blank window
        ld      a,(CurrentCard)    ; latch: card transitions land at
        ld      (GlimActiveCard),a  ; frame start, never mid-frame
```

So every card switch lands at a frame boundary. The frame that
decides to leave finishes as the old card: its blocks complete their
phases, its pulses clear at frame end. The destination activates at
the next frame's start, enter blocks first. The press that leaves the
splash raises `AnyKeyP` (and `HitP` too, when
the key is GO), but that frame's active card is still Splash, so
`ScorePoint` is gated off, and both pulses are gone before Playing
wakes. A goto cannot leak its frame's triggers into the destination
card, which means every round starts with a zero score, whichever key
started it.

![A goto asked for in the logic phase, granted at the frame boundary.](../../assets/images/glimmer-book/book0/card-transition.svg)

## The card machinery

Build the file and open the output:

```sh
glimmer build gate.glim
```

In the generated file, the cards are one enum and three bytes of
storage:

```asm
Card              .enum Splash, Playing, GameOver
```

```asm
CurrentCard:      .db Card.Splash   ; writable next card, starts changed
GlimActiveCard:   .db Card.Splash   ; frame-latched card all gates test
GlimPrevCard:     .db $FF          ; enter edge detector ($FF = before any card)
```

`GlimPrevCard` starts at $FF, a value matching no card, which is how
frame one registers as an entry to Splash. Gate's three states and
five pulses fill all eight bits of `Changed0`, so `CurrentCard`'s flag
opens the second bank, and starts set:

```asm
Changed0:         .db %00000000   ; flags dispatch tests
Changed1:         .db %00000001   ; flags dispatch tests
```

A card gate is the familiar change-flag dispatch test with one
comparison in front. Here is `ScorePoint`'s, from the
logic dispatcher:

```asm
        ld      a,(GlimActiveCard)
        cp      Card.Playing
        jr      nz,_skip_ScorePoint
        ld      a,(Changed0)
        and     GlimDep_ScorePoint__B0
        jr      z,_skip_ScorePoint
        call    Glim_ScorePoint
_skip_ScorePoint:
```

Wrong card, skip; right card, the flag test proceeds as ever. Three
instructions in front of the familiar dispatch are the entire price
of the section machinery: what each block pays to belong to a card.

![One card active, and every other card's blocks skipped.](../../assets/images/glimmer-book/book0/dispatch-gating.svg)

An enter dispatch adds the edge. `ShowFinal`'s, together with the two
instructions that follow the last enter dispatch in the phase:

```asm
        ld      a,(GlimActiveCard)
        cp      Card.GameOver
        jr      nz,_skip_ShowFinal
        ld      a,(GlimPrevCard)
        cp      Card.GameOver
        jr      z,_skip_ShowFinal
        ld      a,(Changed1)
        and     GlimDep_ShowFinal__B1
        jr      z,_skip_ShowFinal
        call    Glim_ShowFinal
_skip_ShowFinal:
        ld      a,(GlimActiveCard)
        ld      (GlimPrevCard),a
```

Read the three tests in order: the active card is GameOver; the
previous card was anything else, which is your edge; and
`CurrentCard`'s flag is up. Then, once every enter block has had its
chance, `GlimPrevCard` catches up with the present, and the edge
stays disarmed until the card genuinely changes again. That middle
test is what makes the re-raise idiom and `Restart`'s every-run
change mark safe: a raised flag alone, with both card bytes equal,
walks past every enter block in the file.

The next chapter puts a complete game inside the card machinery:
[A Small Matrix
Game](14-a-small-matrix-game.md).

---

[← Routines, Parts and Imports](12-routines-parts-and-imports.md) | [Book](index.md) | [A Small Matrix Game →](14-a-small-matrix-game.md)
