---
layout: default
title: "First Light"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 2
---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md)

# Chapter 2 - First Light

Chapter 1 you read. This chapter you run. By the end of it you will
have installed the tools, built a Glimmer program of your own, watched
it respond on the emulated TEC-1G, and stopped it mid-rule with a
breakpoint set in your own `.glim` source.

The program is *Beacon*: one pixel in the middle of the matrix, and
every press of the GO key steps it to the next colour. One fact, one
moment, one rule, one picture - the smallest program that exercises
the whole reactive chain with you at the keypad.

## The tools

Glimmer's compiler is a Node.js package. With Node 20 or newer
installed:

```sh
npm install -g @jhlagado/glimmer
```

That gives you the `glimmer` command, and it brings the AZM assembler
along as a dependency, so one install covers the whole build.

The running and debugging happen in **Debug80**, a VS Code extension:
install VS Code, then find Debug80 in the Extensions marketplace.
[Debug80 Book 1](../../debug80-book/book1/) walks through installation
and the emulator panel a screen at a time; this chapter uses only what
it needs.

## Beacon

Create a folder for the project, and in it a file named `main.glim`:

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

Every construct here appeared in chapter 1; two details are new.
`KEY_GO` names the GO key of the TEC-1G's keypad - the MON-3 monitor
gives every key a name, and the bindings use those names directly. And
the colour itself is a fact: the matrix mixes red, green, and blue, so
values 1 through 7 are its seven visible colours, and `NextColour`'s
wrap rule keeps the cell inside that range. `DrawBeacon` reads whatever
colour the fact holds. Read the chain aloud from the declarations: *GO
fires Step; on Step, NextColour updates Colour; on Colour, DrawBeacon.*

## Build it

In a terminal, in the project folder:

```sh
glimmer build main.glim
```

```text
Wrote main.main.asm (register contracts checked by AZM)
Wrote main.main.d8.json (11 block segments attributed to .glim source)
```

Four files appear beside your source:

- `main.main.asm` - the generated assembly program, the one file that
  holds everything: your blocks and the runtime around them.
- `main.main.hex` and `main.main.bin` - the assembled bytes, as Intel
  HEX for transfer to hardware and as a raw binary image.
- `main.main.d8.json` - the debug map: which addresses came from which
  source lines. Eleven of its entries point back into `main.glim` -
  your block bodies - and the rest point into the generated assembly.

The build also ran AZM's register-contract checking over the whole
program. Every routine in the generated file declares what registers
it uses, and the assembler proves the calls against those
declarations, so a register trampled across a call fails the build
instead of the game.

## Run it

Open the folder in VS Code and initialize it as a TEC-1G project from
the Debug80 panel ([Debug80 Book
1](../../debug80-book/book1/02-create-a-tec1g-project.html) shows this
step by step). Debug80 discovers `main.glim` as a target by its name -
a file called `main.glim`, or ending in `.main.glim`, whose first
declaration is `program`, is a program Debug80 knows how to build.

Press F5. Debug80 builds the target through Glimmer, loads the MON-3
ROM and your program, and runs. The platform panel shows the TEC-1G:
the 8x8 matrix with a single red pixel at its centre - `Colour`
started at 1, red, and `changed` drew it on the first frame.

Click GO on the panel's keypad. The pixel turns green. Again: yellow.
Keep going and the beacon walks its seven colours - red, green,
yellow, blue, magenta, cyan, white - and wraps back to red. Between
presses the program idles: the scan keeps the pixel lit while both of
your blocks wait for their facts to change.

## The file Glimmer wrote

Open `main.main.asm`. The whole program reads top to bottom in a fixed
order, and the section comments are its table of contents:

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

Three stops on the tour. First, the bookkeeping your declarations
became:

```asm
; --- change flags ---
CHG_COLOUR        .equ %00000001
CHG_STEP          .equ %00000010

; --- block trigger masks ---
GlimDep_NextColour__B0 .equ CHG_STEP
GlimDep_DrawBeacon__B0 .equ CHG_COLOUR
```

Each fact owns one bit; each block owns a mask built from its `on`
line. The whole reactive model runs on these bytes.

Second, a dispatcher - the code that asks the question *did anything
this block cares about change?*:

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
call. `on Step`, compiled to three instructions and a branch.

Third, the end of every frame:

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

The first two stores are a promise from chapter 1 kept in code: a
pulse holds for exactly one frame, and here is `Step` being cleared at
the frame's end. The `Next0` handoff carries changes that arrived too
late for this frame into the next one - chapter 5 makes that mechanism
precise.

Wander further whenever you like: your two blocks sit wrapped under
`Glim_NextColour` and `Glim_DrawBeacon`, bodies exactly as you typed
them, and the profile library at the bottom holds `ScanFrame`,
`FbClear`, and `FbPlot` as plain readable routines.

## Stopping the world

Back in `main.glim`, set a breakpoint on the `inc a` line inside
`NextColour` and press F5. The program runs; the beacon glows;
nothing stops - `NextColour` has not run, because `Step` has not
fired. Now click GO.

The debugger halts on your line, in your file. The registers panel
shows A holding the colour the block loaded on the line above. Step
once and watch the increment land; step again through the compare and
the store; continue, and the beacon shows its next colour.

The debug map made that happen: block-body lines belong to
`main.glim`, so breakpoints and stepping land there, and when you step
beyond your block the debugger continues in `main.main.asm` - the
generated assembly, as readable as the block you left. Your code and
the machinery around it are one program, and you can watch either
side of it run.

Chapter 1's Mover runs the same way. Save it in the project as
`mover.main.glim` and it appears as a second target in the Debug80
panel; select it, press F5, and steer the dot with keys 4 and 6.

## Summary

- One install (`npm install -g @jhlagado/glimmer`) provides the
  compiler and the assembler; Debug80 in VS Code provides the machine.
- `glimmer build` produces the generated assembly, the HEX and binary
  images, and the debug map, with register contracts checked on every
  build.
- Debug80 discovers a `main.glim` (or `*.main.glim`) file as a target;
  F5 builds and runs it on the emulated TEC-1G.
- The generated file reads top to bottom: equates, change flags and
  masks, state, the loop, polling, dispatch, your wrapped blocks,
  frame rollover, and the profile library.
- Breakpoints set in `.glim` block bodies stop in `.glim` source;
  generated glue steps in readable assembly.

Next: the facts themselves - more of them, wider than a byte, and the
change tracking that makes them run blocks: State.

---

[← The Shape of a Game](01-the-shape-of-a-game.md) | [Book](index.md)
