---
layout: default
title: "First Light"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 2
---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md) | [State →](03-state.md)

# Chapter 2 - First Light

You have read a Glimmer program. Now you build one, run it on an
emulated TEC-1G, and set a breakpoint in your own source to stop it
mid-run.

The program is called *Beacon*: one pixel in the middle of the 8x8 RGB
LED matrix, and every press of the GO key steps it to the next colour.
It is small enough to type in five minutes, and it still exercises the
whole reactive chain (one fact, one moment, one rule, one picture)
with you at the keypad supplying the moments.

## The tools

Everything this book needs is in one VS Code extension, **Debug80**:
the Glimmer compiler, the assembler, and a full emulated TEC-1G,
keypad and all. Install VS Code, open the Extensions marketplace, and
add Debug80. [Debug80 Book 1](../../debug80-book/book1/) provides a
guided tour of the extension itself. Glimmer also has a command line
for scripts and work outside VS Code; Appendix D covers it.

## Beacon

Open VS Code, add an empty folder, and initialize it as a TEC-1G
project from the Debug80 panel: two clicks, and [Debug80 Book
1](../../debug80-book/book1/02-open-a-folder.md) walks
through them with pictures if you want company. Then create a file in
the project named `main.glim`. The name is what Debug80 looks for: a
file called `main.glim`, or ending in `.main.glim`, whose first
declaration is `program`, is recognised as a Glimmer program and
built.

Type or paste the program into the file:

```text
program Beacon

platform tec1g-mon3
display matrix8x8

state Colour : byte = 1 changed

pulse Step

bind key KEY_GO rising -> Step

effect NextColour
    on Step
    updates Colour
begin
    ld a,(Colour)
    inc a
    cp 8
    jr c,_store     ; 1 to 7 are the visible colours
    ld a,1
_store:
    ld (Colour),a
end

render DrawBeacon
    on Colour
begin
    call FbClear
    ld a,(Colour)
    ld b,3          ; B = x
    ld c,3          ; C = y
    call FbPlot
end
```

The program uses only constructs already introduced, so the new
details are easy to isolate. `KEY_GO` names the GO key, the big one on the
TEC-1G's pad. MON-3 gives every key a name, and bind lines use the
names directly, so your source says GO where you mean GO. The other
new thing is that *the colour itself is a fact*. The 8x8 matrix mixes
red, green and blue per pixel, so the values 1 through 7 are its seven
visible colours, and `NextColour`'s wrap keeps the cell inside that
range. `DrawBeacon` never knows or cares which colour is current; it
reads the fact and plots it. Say the chain aloud once before we build:
"GO fires Step; on Step, NextColour updates Colour; on Colour,
DrawBeacon."

## Run it

Click the **Run** button in the Debug80 panel.

Debug80 hands your file to the Glimmer
compiler, assembles the result, checks it, loads the MON-3 ROM and
your program into the emulated TEC-1G, and runs. The platform panel
opens on the TEC-1G, and there on the 8x8 matrix is a single red
pixel. `Colour` started at 1, which is red, and the word `changed` in
your declaration is why it drew itself before you touched anything.

Now click GO on the panel's keypad. Green. Again: yellow. Keep going
(red, green, yellow, blue, magenta, cyan, white) and round again to
red. Between presses, the scan keeps the pixel lit and the keypad poll
keeps checking while both reactive blocks wait for their facts to
change.

The build also left things for us in the project's `build` folder.
`main.main.asm` is the generated assembly program: your blocks and
the machinery around them, one readable file, and the subject of the
next section. Beside it sit the assembled bytes as Intel HEX, which
is what will travel to a real TEC-1G one day, and the debug map,
which records the source line every address came from. And one more
thing happened during that build: the assembler
ran its register-contract checking over the whole program. Every
routine in the generated file declares which registers it uses, and
every call is proven against those declarations. The classic Z80 bug,
a helper quietly trampling a register your loop was counting on,
fails the build with a message instead of failing the game an hour
into play.

![Two stages: Glimmer writes the assembly, the assembler writes the bytes.](../../assets/images/glimmer-book/book0/build-pipeline.svg)

## The file Glimmer wrote

Open `build/main.main.asm`. The file reads top to bottom in a fixed
order, and its section comments are a table of contents:

```text
; --- TEC-1G / MON-3 platform ---        equates: ports, API calls
; --- MON-3 key codes ---                KEY_GO's value
; --- change flags ---                   one bit per fact
; --- block trigger masks ---            one mask per block
; --- state storage ---                  the facts themselves
; --- runtime loop ---                   the frame, top to bottom
; --- input polling (MON-3 _scanKeys) ---
; --- logic phase dispatch ---
; --- render phase dispatch ---
; --- phase boundary: deliver same-frame raises ---
; --- logic block NextColour ---         your code, wrapped
; --- render block DrawBeacon ---
; --- frame rollover ---
; --- matrix8x8 profile library ---      ScanFrame, FbClear, FbPlot
```

Three sections show the source model as real code.

First stop, the bookkeeping your declarations became:

```asm
; --- change flags ---
CHG_COLOUR_BIT    .equ 0
CHG_STEP_BIT      .equ 1
CHG_COLOUR        .equ %00000001
CHG_STEP          .equ %00000010

; --- block trigger masks ---
GlimDep_NextColour__B0 .equ CHG_STEP
GlimDep_DrawBeacon__B0 .equ CHG_COLOUR
```

Each fact owns one bit; each block owns a mask built from its `on`
line. This is what the reactive model costs at runtime: a few bytes
and some AND instructions.

Second stop, a dispatcher, the code that asks *did anything this
block depends on change?*:

```asm
; --- logic phase dispatch ---
.routine
GlimRunLogicEffects:
        ld      a,(Changed0)
        and     GlimDep_NextColour__B0
        jr      z,_skip_NextColour
        call    Glim_NextColour
_skip_NextColour:
        ret
```

That is your `on Step`, compiled: three instructions and a
branch.

Third stop, the end of every frame:

```asm
; --- frame rollover ---
.routine
GlimEndFrame:
        xor     a
        ld      (Step),a
        ld      (Raised0),a
        ld      a,(Next0)            ; deferred raises become next frame
        ld      (Changed0),a
        xor     a
        ld      (Next0),a
        ret
```

Those first two stores implement the startup promise: a
pulse holds for exactly one frame, and here is `Step` being cleared at
the frame's end. The `Next0` handoff below it carries changes that
arrived too late for this frame into the next one; its purpose becomes
clear when a program has more than one phase.

Your two blocks sit wrapped under
`Glim_NextColour` and `Glim_DrawBeacon`, bodies exactly as you typed
them, and at the bottom of the file the profile library spells out
`ScanFrame`, `FbClear` and `FbPlot` as plain, readable routines.

## Stopping the world

Back in `main.glim` (your source, the one you typed), set a
breakpoint on the `inc a` line inside `NextColour`, and click Run.

The beacon glows. And nothing stops: `NextColour`
has not run, because `Step` has not fired, because you have not
pressed GO. A breakpoint in a reactive program is
a question (*when does this rule actually run?*) and right now the
answer is: not yet.

Click GO.

The debugger halts, on your line, in your file. Look at the registers
panel: there is A, holding the colour your block loaded on the line
above. Step once and watch the increment happen. Step again through
the compare and the store. Continue, and the beacon shows its next
colour, and the machine goes back to waiting for you.

You set a breakpoint in a declarative source file, on a line of
assembly inside a rule, and a full-speed emulated Z80 stopped there
and offered you its registers. The debug map made
that happen: block-body lines belong to `main.glim`, so breakpoints
and stepping land in your source, and when you step past the end of
your block, the debugger continues into `main.main.asm`, the
generated file you now know your way around.

Mover runs the same way. Save it in the project as
`mover.main.glim` and it appears as a second target in the Debug80
panel; select it, click Run, and steer the dot with keys 4 and 6.

In the next chapter, Beacon grows a position and a score, and you
learn everything a fact can be: [State](03-state.md).

---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md) | [State →](03-state.md)
