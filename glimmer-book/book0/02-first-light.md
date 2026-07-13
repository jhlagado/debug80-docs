---
layout: default
title: "First Light"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 2
---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md) | [State →](03-state.md)

# Chapter 2 - First Light

Astronomers have a name for the first time a new telescope is pointed
at the sky: first light. This chapter is ours. You have read a Glimmer
program; now you are going to build one, watch it light up an emulated
TEC-1G, and - my favourite part - freeze it mid-thought with a
breakpoint set in your own source. By the end of the chapter the whole
round trip from your intention to a glowing pixel will be something
you have done with your own hands, and everything else in this book
becomes a matter of doing it again with more ambition.

The program I have chosen for the occasion is called *Beacon*: one
pixel in the middle of the 8x8 matrix, and every press of the GO key steps
it to the next colour. I picked it deliberately. It is small enough to
type in five minutes, and it still exercises the entire reactive chain
- one fact, one moment, one rule, one picture - with you at the
keypad supplying the moments.

## The tools

Two installs and we are in business.

Glimmer's compiler is a Node.js package. With Node 20 or newer on your
machine:

```sh
npm install -g @jhlagado/glimmer
```

That gives you the `glimmer` command, and it brings the AZM assembler
along as a dependency - one install covers the whole build chain, from
your `.glim` file down to bytes.

For running and debugging we use **Debug80**, a VS Code extension that
carries a full TEC-1G inside it: install VS Code, open the Extensions
marketplace, and search for Debug80. If you want the guided tour of
the extension itself - every panel, every button - that is [Debug80
Book 1](../../debug80-book/book1/), and it is worth an evening. Here I
will show you exactly the parts we need and no more, because I want to
get you to the pixel.

## Beacon

Create a folder for the project, and in it a file named `main.glim`.
Type it in - actually type it, because the reading-aloud habit from
chapter 1 works through the fingers too:

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

You know every construct here from chapter 1, so let me point out only
what is genuinely new. `KEY_GO` names the GO key - the big one on the
TEC-1G's pad. MON-3 gives every key a name, and bind lines use the
names directly, so your source says GO where you mean GO. The other
novelty is the idea at the heart of this little program: *the colour
itself is a fact*. The 8x8 matrix mixes red, green and blue per pixel, so
the values 1 through 7 are its seven visible colours, and
`NextColour`'s wrap keeps the cell inside that range. `DrawBeacon`
never knows or cares which colour is current - it reads the fact and
plots it. Let's say the chain aloud once before we build: "GO fires Step; on
Step, NextColour updates Colour; on Colour, DrawBeacon."

## Build it

Open a terminal in the project folder and hand your file to the
compiler:

```sh
glimmer build main.glim
```

```text
Wrote main.main.asm (register contracts checked by AZM)
Wrote main.main.d8.json (11 block segments attributed to .glim source)
```

Four files have appeared beside your source, and each one is worth a
sentence, because together they are the whole story of what a build
means here:

- `main.main.asm` - the generated assembly program: your blocks and
  the machinery around them, one readable file. We tour it below.
- `main.main.hex` and `main.main.bin` - the assembled bytes, as Intel
  HEX for sending to hardware and as a raw binary image.
- `main.main.d8.json` - the debug map: a record of which addresses
  came from which source lines. Eleven of its entries point back into
  `main.glim` - your block bodies - and that little fact is about to
  make your debugger feel like a magic trick.

One more thing happened during that build, and you should know it is
there working for you. the assembler ran its register-contract
checking over the whole program: every routine in the generated file
declares which registers it uses, and the assembler proves every call
against those declarations. The classic Z80 bug - a helper quietly
trampling a register your loop was counting on - fails the build here,
with a message, instead of failing the game an hour into play.

## Run it

Open the folder in VS Code and initialize it as a TEC-1G project from
the Debug80 panel - two clicks, and [Debug80 Book
1](../../debug80-book/book1/02-create-a-tec1g-project.md) walks
through them with pictures if you want company. Debug80 finds your
program by its name: a file called `main.glim`, or ending in
`.main.glim`, whose first declaration is `program`, is a target it
knows how to build.

Press F5.

Debug80 builds the target through Glimmer, loads the MON-3 ROM and
your program, and runs. The platform panel opens on the TEC-1G, and
there on the 8x8 matrix is a single red pixel. Let it glow for a second, because you earned it: `Colour` started at 1, which is red, and the
word `changed` in your declaration is why it drew itself before you
touched anything. That dot is your declaration, made light.

Now click GO on the panel's keypad. Green. Again: yellow. Keep going -
red, green, yellow, blue, magenta, cyan, white - and round again to
red. Seven presses, seven colours, one wrap rule doing its work.
And between your presses, notice what the program is doing: nothing.
The scan keeps the pixel lit while both of your blocks wait for their
facts to change. An idle Glimmer program is genuinely idle, and that
is the reactive model working exactly as designed.

## The file Glimmer wrote

While it runs, let us go and see what Glimmer actually built for you.
Open `main.main.asm`. The file reads top to bottom in a fixed order,
and its section comments are a table of contents:

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

Three stops on the tour, chosen because each one turns something you
have taken on faith into something you can point at.

First stop - the bookkeeping your declarations became:

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
line. When I told you in chapter 1 that the reactive model was cheap,
this is what I meant: the entire nervous system of your program is a
few bytes and some AND instructions.

Second stop - a dispatcher, the code that asks *did anything this
block cares about change?*:

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

Load the changed bits, mask them against the block's triggers, skip or
call. That is your `on Step`, compiled: three instructions and a
branch. I promised you could always find out what a declaration costs
- now you know how to look.

Third stop - the end of every frame:

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

Those first two stores are a promise from chapter 1, kept in code: a
pulse holds for exactly one frame, and here is `Step` being cleared at
the frame's end. The `Next0` handoff below it carries changes that
arrived too late for this frame into the next one - I will make that
mechanism precise in chapter 5, when you have a program that needs it.

Wander further whenever you like. Your two blocks sit wrapped under
`Glim_NextColour` and `Glim_DrawBeacon`, bodies exactly as you typed
them, and at the bottom of the file the profile library spells out
`ScanFrame`, `FbClear` and `FbPlot` as plain, readable routines. This
file is worth an idle half hour with a coffee; every question you ask
of it, it answers in Z80.

## Stopping the world

Now for the trick I promised. Back in `main.glim` - your source, the
one you typed - set a breakpoint on the `inc a` line inside
`NextColour`, and press F5.

The program runs. The beacon glows. And nothing stops, which is the
first lesson: `NextColour` has not run, because `Step` has not fired,
because you have not pressed GO. A breakpoint in a reactive program is
a question - *when does this rule actually run?* - and right now the
answer is: not yet.

Click GO.

The debugger halts, on your line, in your file. Look at the registers
panel: there is A, holding the colour your block loaded on the line
above. Step once and watch the increment happen. Step again through
the compare and the store. Continue, and the beacon shows its next
colour, and the machine goes back to waiting for you.

Take a moment with this, because what you are looking at is unusual on
any 8-bit toolchain: you set a breakpoint in a declarative source
file, on a line of assembly inside a rule, and a full-speed emulated
Z80 stopped there and offered you its registers. The debug map made
that happen - block-body lines belong to `main.glim`, so breakpoints
and stepping land in your source, and when you step past the end of
your block, the debugger continues into `main.main.asm`, the
generated file you now know your way around. Your code and the
machinery are one program, and you can watch either side of it think.

Chapter 1's Mover runs the same way, and it is worth two minutes to
prove it to yourself: save it in the project as `mover.main.glim` and
it appears as a second target in the Debug80 panel; select it, press
F5, and steer the dot with keys 4 and 6.

## Summary

- One install (`npm install -g @jhlagado/glimmer`) provides the
  compiler and the assembler; Debug80 in VS Code provides the machine.
- `glimmer build` produces the generated assembly, the HEX and binary
  images, and the debug map, with register contracts proven on every
  build.
- Debug80 discovers a `main.glim` (or `*.main.glim`) file as a target;
  F5 builds and runs it on the emulated TEC-1G.
- The generated file reads top to bottom - equates, flags and masks,
  state, loop, polling, dispatch, your wrapped blocks, rollover,
  library - and answers every cost question in Z80.
- Breakpoints set in `.glim` block bodies stop in `.glim` source;
  stepping past your block continues into readable generated assembly.

You have a machine that lights up when you talk to it. Time to give it
more to remember: in the next chapter Beacon grows a position and a
score, and you learn everything a fact can be: [State](03-state.md).

---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md) | [State →](03-state.md)
