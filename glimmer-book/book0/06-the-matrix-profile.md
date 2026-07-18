---
layout: default
title: "The 8x8 Matrix Profile"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 6
---

[← Compute, Effect, Render](05-compute-effect-render.md) | [Book](index.md) | [Time →](07-time.md)

# Chapter 6 - The 8x8 Matrix Profile

I have been keeping something from you since chapter 1, and this is
the chapter where I finally get to show it to you. The TEC-1G has no
video chip. Nothing sits between the processor and the 8x8 RGB LED
matrix, refreshing pixels while your program thinks about
other things. The display is eight rows of eight RGB LEDs, and the
hardware can light exactly one row at a time. Three ports carry a
row's red, green, and blue column data; a fourth selects the row that
shows it. The thing sweeping those rows is the Z80 itself. It paints
row 0, holds it lit a moment, paints row 1, and so on around the
board, and if it sweeps all eight quickly enough, over and over, your
eye fuses them into a steady picture. If it ever stops sweeping, the
8x8 matrix goes dark. The CPU is not driving the display. The CPU
*is* the display.

Which means every program you have written in this book has been
doing two jobs at once. One is the game. The other is being the
display controller - and chapter 1 warned you about it, when I called
showing the current picture the program's own job, every frame,
forever. Every program you have built since has done that job without
a line of your code asking for it, and today I am going to open the
machinery and show you where: the scan that keeps the 8x8 matrix lit,
the loop shape it forces on the frame, the 32 bytes of memory your
renders have been writing all along, and the library routines that
write them.

The program for the occasion is *Compass*. Hold GO and
a dot runs clockwise around the rim of the 8x8, coloured by the
quadrant it is crossing: red along the top, green down the right
side, blue along the bottom, yellow climbing the left - north, east,
south, west. Let go and it parks where it is. Compass is here
because it forces a design choice best felt in the hands before it
is argued on the page. The obvious way to build this game is to store the dot's
x, its y, and its colour as facts and have the movement rule update
all three - and that design rots, because it keeps three cells that
must always agree and trusts every future rule to keep them agreeing.
Compass stores *one* byte, a position on the rim, and derives
everything the screen wants from it. A fact you compute stays true
to its source, because the rule that derives it re-runs whenever the
source changes - there is no second copy for a future rule to forget. That is chapter 5's compute
phase doing exactly the work it was made for, and you are about to
watch it carry a whole game.

## Compass

The whole program:

```text
program Compass

platform tec1g-mon3
display matrix8x8

state Position : byte = 0 changed

state DotX   : byte
state DotY   : byte
state Colour : byte

pulse Step

bind key KEY_GO held period 4 -> Step

effect Advance
    on Step
    updates Position
begin
    ld a,(Position)
    inc a
    cp 28
    jr c,_store     ; 27 wraps to 0
    xor a
_store:
    ld (Position),a
end

compute PlaceDot
    on Position
    updates DotX, DotY, Colour
begin
    ld a,(Position)
    cp 7
    jr c,_north
    cp 14
    jr c,_east
    cp 21
    jr c,_south
_west:              ; 21..27: left edge, climbing
    ld b,a
    ld a,28
    sub b           ; y = 28 - Position
    ld (DotY),a
    xor a
    ld (DotX),a
    ld a,COLOR_YELLOW
    jr _colour
_north:             ; 0..6: top edge, heading right
    ld (DotX),a     ; x = Position
    xor a
    ld (DotY),a
    ld a,COLOR_RED
    jr _colour
_east:              ; 7..13: right edge, heading down
    sub 7
    ld (DotY),a     ; y = Position - 7
    ld a,7
    ld (DotX),a
    ld a,COLOR_GREEN
    jr _colour
_south:             ; 14..20: bottom edge, heading left
    ld b,a
    ld a,21
    sub b           ; x = 21 - Position
    ld (DotX),a
    ld a,7
    ld (DotY),a
    ld a,COLOR_BLUE
_colour:
    ld (Colour),a
end

render DrawDot
    on DotX, DotY, Colour
begin
    call FbClear
    ld a,(DotX)
    ld b,a
    ld a,(DotY)
    ld c,a
    ld a,(Colour)
    call FbPlot
end
```

One fact drives the whole picture. The rim of the 8x8 matrix is 28
pixels, and `Position` numbers them 0 to 27, clockwise from the
top-left corner. Look at how
small that makes `Advance`: step forward, and past 27 wrap to 0. That
is the entire movement rule of the game. Held GO fires `Step` every 4
frames - the binding you learned in chapter 1, doing its arcade job -
so the dot orbits for as long as the key stays down.

`PlaceDot` is where the geometry lives, and nowhere else. `Position`
is the fact the game reasons about; the screen wants an x, a y, and a
colour; the compute derives all three in one place. A threshold
ladder splits the rim into its quadrants - positions 0 to 6 lie on
the top edge, 7 to 13 on the right, 14 to 20 on the bottom, 21 to 27
on the left - and each arm converts `Position` to coordinates. Read
the arms and you can see the dot going round: the top edge counts x
upward, the bottom edge counts it back down, and the sides do the
same with y. Every arm leaves its quadrant's colour in A and falls
into the shared store at `_colour`.

The header line `updates DotX, DotY, Colour` declares all three
products, and `DrawDot` depends on all three. Here is what storing
one fact and deriving the rest buys you: those three cells change
together because one block writes them together, so the render always
reads a settled trio. The geometry sits in the compute, the rule in
the effect, the picture in the render - each block one job, connected
only by the headers, the way I have been promising you programs would
keep reading as they grow.

Chapter 5's delivery rule runs straight through the middle of this
program, so let us trace it once. `Advance` sits in the logic phase,
and its consumer `PlaceDot` is a compute - an earlier phase, already
finished for this frame. So the change to `Position` defers: the
wrapper after `Advance`'s body stages it in `Next0`, and the dot you
see moves on the frame after the pulse. One frame behind, every step,
whatever order the source declares - the rule holds with no
exceptions to memorise. Do the arithmetic on a lap and you get the
game's tempo: 28 steps at 4 frames each is 112 frames a lap. Halve
the period and you halve the lap.

Build it, run it, and hold GO: the dot sets off along the top in red
and changes uniform at every corner. Release anywhere and it waits,
lit, in the colour of its quadrant.

## The scan-shaped loop

Every program in this book has opened with the same two lines, and I
have been asking you to take them on faith:

```text
platform tec1g-mon3
display matrix8x8
```

They select the program's **profile**: everything the generated file
contains beyond your own declarations. The port addresses, the MON-3
key codes, the polling routine, the shape of the runtime loop, and
the library at the bottom of the file all come from this one choice.
`platform` names the board and monitor, which is where `KEY_GO` and
the `_scanKeys` polling come from. `display` names the output device,
and it is the stronger choice of the two, because - now that you know
who is really lighting the pixels - the display decides the loop
itself. Chapter 16 puts `tms9918` on that line and gets a loop built
around a video chip; the reactive core - state, flags, dispatch,
rollover - stays the same.

What `matrix8x8` builds, from `compass.main.asm`:

```asm
; --- runtime loop ---
Start:
        call    FbClear
        call    HudBlankDig
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

At `Start` the profile clears its canvas and display once; then the
loop begins, and look who leads it. `ScanFrame` is the CPU doing its
display job: one complete pass over the 8x8 matrix, all eight rows,
each lit for a fixed dwell, returning with the board dark. Everything
else - polling, your three phases, the rollover - runs in that blank
window, while nothing is showing. Your renders write memory in the
dark, and the next scan presents their combined result, which is why
the player only ever sees finished pictures. The game runs in the
gaps between sweeps of the light.

The fixed dwell is the profile's answer to a problem you would
otherwise meet the hard way. If the
time each row stayed lit depended on how much game work a frame
happened to do, brightness would wobble with your logic - the display
flickering because the game thought harder this frame. Instead each
row shines for the same count on every frame, so brightness stays
even across the rows of any one sweep. The dark gap between sweeps is
where your game runs, and it is a budget: a longer gap means fewer
sweeps a second, and the LEDs spend a smaller share of their time
lit. The few dozen instructions this book's blocks spend per frame
move that share by amounts no eye will find; fill the blank window
with heavy work and the display itself will tell you, dimming before
anything else complains. And since the scan
is by far the frame's largest cost, it paces the frame - which is
what has let me treat the frame as the unit of game time since
chapter 1.

## The framebuffer

`ScanFrame` reads its picture from one place, and you have been
writing to it since your first render. In the state storage, directly
after your facts, the profile reserves it:

```asm
; --- state storage ---
Position:         .db 0
DotX:             .db 0
DotY:             .db 0
Colour:           .db 0
Step:             .db 0
Glim_HeldKey:     .db $FF
Glim_HeldCount:   .db 0
Changed0:         .db %00000001   ; flags dispatch tests
Raised0:          .db 0   ; raises for later phases this frame
Next0:            .db 0   ; raises deferred to next frame
Framebuffer:      .ds 32           ; 8 rows x R,G,B,aux
```

Thirty-two bytes hold the whole picture: eight rows of four bytes -
red, green, blue, and a fourth, aux, that the scanner steps over.
Each of the three plane bytes carries one bit per column. A pixel is
one column bit, present in up to three planes: set it in the red byte
alone and the pixel glows red; set it in red and green both and the
pixel glows yellow. The seven visible colours you cycled through in
chapter 2 are the seven ways to occupy one, two, or three planes, and
the profile's constants spell that out:

```asm
COLOR_RED         .equ $01
COLOR_GREEN       .equ $02
COLOR_BLUE        .equ $04
COLOR_YELLOW      .equ COLOR_RED + COLOR_GREEN
COLOR_CYAN        .equ COLOR_GREEN + COLOR_BLUE
COLOR_MAGENTA     .equ COLOR_RED + COLOR_BLUE
COLOR_WHITE       .equ $07
```

A colour is a set of plane bits, and the compound colours are sums.
That is the A register you have loaded before every `FbPlot` since
chapter 1 - it never held a colour code, it held a recipe.

`FbPlot` turns x, y, and colour into plane-byte writes. Its head,
from the profile library:

```asm
; Set one pixel. B = x (0-7), C = y (0-7), A = colour bits
; (COLOR_RED/GREEN/BLUE, OR-combined). ORs into the framebuffer.
.routine in A,B,C clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry
FbPlot:
        ld      d,a                  ; D = colour bits
        ld      a,c
        add     a,a
        add     a,a                  ; y * 4
        ld      e,a
        ld      a,b
        call    MxMask               ; A = pixel mask
        ld      b,a
```

And here is what the aux byte is for. At four bytes a row, the row's
address is `Framebuffer + y * 4`, and multiplying by four is two
`add a,a` instructions - a padding byte bought a fast address. The
rest of the routine shifts the colour bits out of D one at a time,
ORing the pixel mask into each plane byte whose bit is set. ORing
means `FbPlot` adds light: plot red and then green at the same
coordinates and that pixel shows yellow. A clean picture starts from
`FbClear`, which zeroes the 32 bytes - now you know what the call
that has opened every redrawing render in this book actually does.

Give the `.routine` line above the label a moment too, because you
will need it the first time a library call eats a register of yours.
It is the register interface, declared in the generated file and
checked on every build: `FbPlot` consumes A, B, and C, and clobbers
A, B, DE, and HL. C survives the call. Chapter 5's `DrawBar` kept its
loop counter in B, a clobbered register, which is why it pushed BC
around the call - and when a block of yours misuses a library
routine's registers, the build fails with the contract, and these
lines are where you read what the contract says.

`MxMask` is the small helper `FbPlot` leans on:

```asm
; Convert x (0-7, 0 = leftmost) to the matrix bit convention.
.routine in A out A clobbers B,carry,zero,sign,parity,halfCarry
MxMask:
        or      a
        ld      b,a
        ld      a,%10000000
        ret     z
_loop:
        srl     a
        djnz    _loop
        ret
```

x 0 is the leftmost column and bit 7 of the plane byte, a convention
with a purpose: a binary literal in your source reads left to right
like the 8x8 itself. `MxMask` is callable from your own blocks too,
for the day a render builds whole row masks instead of plotting pixel
by pixel.

Here is what this section buys you. Any fact you can turn into an x,
a y, and three colour bits, you can draw. The compute is yours; the
plot is one call.

## ScanFrame, top to bottom

I told you in chapter 1 that nothing is hidden, and this chapter has
been leaning on that promise harder than any before it - so let us
collect on it. The scanner, the routine that *is* your display, is
twenty-nine instructions, and you are going to read every one. The
four ports it drives are equates from the top of the generated file:
`PortRow` at `$05` selects the row, and `PortRed`, `PortGreen`, and
`PortBlue` at `$06`, `$F8`, and `$F9` take the plane bytes. The
routine, whole, from the profile library:

```asm
; Scan all 8 rows with equal dwell, then blank the matrix for game
; work. Excessive work lengthens the dark gap and can reduce brightness.
; seven-segment HUD are serviced once per row (8 ticks per frame).
.routine clobbers A,BC,DE,HL,carry,zero,sign,parity,halfCarry
ScanFrame:
        ld      hl,Framebuffer
        ld      c,%00000001          ; row select mask
_row:
        xor     a
        out     (PortRow),a          ; blank before changing colour data
        ld      a,(hl)
        out     (PortRed),a
        inc     hl
        ld      a,(hl)
        out     (PortGreen),a
        inc     hl
        ld      a,(hl)
        out     (PortBlue),a
        inc     hl
        inc     hl                   ; skip aux byte
        ld      a,c
        out     (PortRow),a          ; enable row
        push    bc
        push    hl
        call    SndService
        call    HudScanDig
        pop     hl
        pop     bc
        ld      b,ScanDwellPeriod
_dwell:
        djnz    _dwell
        rlc     c
        jr      nc,_row      ; carry after 8th rotate
        xor     a
        out     (PortRow),a          ; matrix blank on return
        ret
```

C holds the row select as a one-hot mask, `%00000001` for row 0.
Each pass around `_row` blanks the board, writes the row's three
plane bytes to the colour ports, steps past the aux byte, and
switches the row on. `rlc c` slides the select bit up one row; after
the eighth rotate the bit falls into carry, the loop exits, and a
final blank leaves the 8x8 matrix dark for the game work to come.

That blank at the top of the pass has a reason, and it is the kind of
detail you learn to look for on hardware like this. The colour ports
feed whichever row is enabled, so the previous row must go dark
before its data changes hands; skip that blank and each row would
flash its neighbour's colours for an instant, every row, every frame
- a ghost of the picture smeared one row over. Then the dwell:
`djnz` spinning B down from `ScanDwellPeriod`, 255, the wait that
sets how long a row shines and, eight times over, how long a frame
lasts. That unglamorous countdown is the metronome of every game in
this book.

In the middle of every pass sit two calls, `SndService` and
`HudScanDig`, and they are there because the scan is the steadiest
thing the program does. Eight beats a frame, evenly spaced, at full
speed - so the profile hangs its other board services on it: an
active sound cue toggles the speaker here, and one seven-segment
digit is strobed here per beat, which is how the score display
chapter 3 wrote through `HudWriteU16` stays lit by the same trick as
the 8x8. Chapter 9 builds on both services.

Step through a pass under Debug80 whenever you like: a breakpoint on
`ScanFrame` in `compass.main.asm` catches the frame at its start. The
display you have been drawing to since chapter 1 is this one routine,
reading those 32 bytes, every frame without fail - and now you have
read it to the last instruction.

## Summary

- `platform` and `display` select the **profile**: port equates, key
  codes, polling, the loop's shape, and the library are its
  contribution to the generated file. The reactive core is the same
  under every profile.
- The 8x8 matrix is scanned by the CPU itself: `ScanFrame` lights all
  eight rows with a fixed dwell, then blanks. All game work runs in
  the blank window, so the player only ever sees finished pictures,
  and the scan's cost paces the frame.
- The framebuffer is 32 bytes: 8 rows of red, green, and blue plane
  bytes plus an aux byte, one bit per column. A colour is a set of
  planes; `COLOR_*` names the sets; the aux byte makes a row's
  address `y * 4`.
- `FbClear` zeroes the picture. `FbPlot` (B = x, C = y, A = colour
  bits) ORs one pixel into the planes its colour names - it adds
  light, so overlapping plots mix. `MxMask` converts x to the column
  bit, leftmost is bit 7.
- `.routine` lines in the generated file are the library's register
  contracts: what a routine consumes, what it clobbers, checked on
  every build. C survives `FbPlot`.
- Drawing is deriving: turn any fact into x, y, and colour in a
  compute, and one `FbPlot` puts it on the board. Compass draws a
  28-position orbit from a single byte.

Compass moves while GO is held and rests the moment it lifts; next
chapter the program gets a clock of its own and moves while the
player watches: [Time](07-time.md).

---

[← Compute, Effect, Render](05-compute-effect-render.md) | [Book](index.md) | [Time →](07-time.md)
