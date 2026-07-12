---
layout: default
title: "Dependency Reports and Debugging"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 11
---

[← Arrays and Layout Types](10-arrays-and-layout-types.md) | [Book](index.md) | [Routines, Parts and Imports →](12-routines-parts-and-imports.md)

# Chapter 11 - Dependency Reports and Debugging

Canvas left chapter 10 as the largest program in the book: a `Point`
cursor, an eight-byte picture, five pulses, and six blocks
connecting them. Growth changes debugging. A misdrawn pixel in Canvas
might trace to the painting rule, the redraw, a movement effect, or a
binding - and the question that finds bugs in a reactive program,
*which fact failed to change?*, now has eight candidate answers.

The toolchain has been preparing for this since the first chapter.
Every block you have built sits behind a `.routine` boundary - the
safety net chapter 1 promised the book would return to. Every build
proves register contracts across the whole generated file, every
debug map lands breakpoints in your source, and the dependency report
from chapter 5 prints the reactive graph on request. This chapter
assembles those pieces into a debugging practice. You will extend
Canvas with a counter, break the program twice on purpose - once for
a warning, once for a hard error - and finish with the debugger
stopped inside a running rule.

## A count of marks

The extension first. A painting program can report on the painter:
one byte counts every pixel painted, and the seven-segment display
shows the tally. One declaration joins the state:

```text
state Marks   : byte = 0 changed
```

*Marks is a byte, starting at zero, already changed* - so the display
reads 00000 on the first frame.

The painting rule gains a second job. It still sets the cursor's bit
in the cursor's row; now it counts as well:

```text
effect PaintPixel
    on Paint
    updates Picture, Marks
begin
    ld a,(Cursor + offset(Point, x))
    call MxMask     ; A = the column's pixel mask
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Picture
    add hl,de       ; HL -> the cursor's row byte
    ld a,(hl)
    or b
    ld (hl),a
    ld a,(Marks)
    inc a
    ld (Marks),a
end
```

The first eleven body lines are chapter 10's: mask the column, point
HL at the row, OR the pixel in. The three lines at the tail are the
counter. The header names both facts the block writes - `updates
Picture, Marks` - and when the block runs, both change flags rise
together.

One render is new, and chapter 9 supplied everything in it:

```text
render ShowMarks
    on Marks
begin
    ld a,(Marks)
    ld l,a
    ld h,0
    call HudWriteU16
end
```

The cursor, the movement effects, and `DrawCanvas` ride along
unchanged. The whole file now runs to 126 lines, and it builds clean:

```sh
glimmer build canvas.glim
```

```text
Wrote canvas.main.asm (register contracts checked by AZM)
Wrote canvas.main.d8.json (56 block segments attributed to .glim source)
```

Run it under Debug80 and paint something: every press of GO sets a
pixel and lifts the count.

## The report at scale

Chapter 5 printed the dependency report for a program with four
facts. Canvas has eight, and this is the scale where the report
starts paying for itself:

```sh
glimmer --deps canvas.glim
```

```text
program Canvas
  Cursor : state Point
    raised by: MoveUp, MoveDown, MoveLeft, MoveRight
    triggers:  DrawCanvas (render)
  Picture : state byte[8]
    raised by: PaintPixel
    triggers:  DrawCanvas (render)
  Marks : state byte
    raised by: PaintPixel
    triggers:  ShowMarks (render)
  Up : pulse
    raised by: key KEY_2 (held)
    triggers:  MoveUp (logic)
  Down : pulse
    raised by: key KEY_8 (held)
    triggers:  MoveDown (logic)
  Left : pulse
    raised by: key KEY_4 (held)
    triggers:  MoveLeft (logic)
  Right : pulse
    raised by: key KEY_6 (held)
    triggers:  MoveRight (logic)
  Paint : pulse
    raised by: key KEY_GO (rising)
    triggers:  PaintPixel (logic)
```

Each fact owns a stanza: its kind and type, the blocks that raise it,
and the blocks it triggers, every dependent tagged with its phase.
Glimmer computes the report from your `bind`, `on`, and `updates`
lines - the connections you have read off block headers since chapter
1, gathered into one place and sorted by fact.

Read it by symptom, in both directions. Suppose the count on the
display sits still while pixels keep landing. Downstream from
`Marks`: one trigger, `ShowMarks (render)`, so exactly one block
draws the count. Upstream: `Marks` is raised by `PaintPixel`, which
runs on `Paint`, which `key KEY_GO (rising)` fires. Four lines of
report put the whole suspect chain in front of you, keypad to
display. That walk is the practice: name the fact that should have
changed, walk up to its raisers, walk down to its triggers, and put
your first breakpoint where the chain is thinnest.

## A write without its declaration

Now break it, and make that stuck count real. In `PaintPixel`'s
header, cut `Marks` from the updates list:

```text
effect PaintPixel
    on Paint
    updates Picture
begin
```

The body still stores to `Marks`; the header has stopped saying so.
Rebuild:

```text
canvas.glim:75: [GLIM] warning: PaintPixel writes Marks but does not declare "updates Marks": the change flag will not be raised and dependent blocks will not run.
Wrote canvas.main.asm (register contracts checked by AZM)
Wrote canvas.main.d8.json (56 block segments attributed to .glim source)
```

Glimmer scanned the body, found `ld (Marks),a`, checked the header,
and reported the gap - naming the block, the missing declaration, and
the consequence, at line 75, the block's header line. A warning
leaves the build standing: both artifacts were written, so run the
program and watch the consequence play out. Pixels paint, the board
redraws, and the count reads 00000 however many marks pile up. The
store still executes on every press, and `Marks` climbs in memory;
its change flag stays down, so `ShowMarks` - triggered `on Marks` -
waits for an announcement that never arrives.

The report tells the same story from the declarations' side. Run
`--deps` on the broken program and the `Marks` stanza reads:

```text
  Marks : state byte
    raised by: (nothing)
    triggers:  ShowMarks (render)
```

A fact with a dependent and no raiser: this whole class of bug, drawn
in two lines. The generated file agrees - the wrapper after
`PaintPixel`'s body, which raised `CHG_PICTURE + CHG_MARKS` before
the edit, now raises `CHG_PICTURE` alone. Put `Marks` back in the
header and the build runs quiet.

The scan behind the warning reads stores that name their cell in the
instruction itself: `ld (Marks),a` names `Marks`, so the header can
be checked against it. `PaintPixel`'s other write travels through a
pointer - `ld (hl),a`, with HL aimed into `Picture` by arithmetic -
and a build-time scan cannot know where HL will point at run time.
Cut `updates Picture` from the header instead and the build stays
silent while the board freezes the same way. So the `updates` line
remains your declaration of intent: the one place that records where
a block's writes land, whatever route they take. The warning is a net
under the slips the scan can see; a complete `updates` line is the
habit every tool in this chapter leans on.

## The boundary around a block

The register checking promised in chapter 2 lives in the generated
file, and its unit of account is the block. Open `canvas.main.asm` at
the painting rule:

```asm
; --- logic block PaintPixel ---
.routine
Glim_PaintPixel:
    ld a,(Cursor + offset(Point, x))
    call MxMask     ; A = the column's pixel mask
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Picture
    add hl,de       ; HL -> the cursor's row byte
    ld a,(hl)
    or b
    ld (hl),a
    ld a,(Marks)
    inc a
    ld (Marks),a
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_PICTURE + CHG_MARKS
        ld      (Raised0),a
        ret

; --- render block DrawCanvas ---
.routine
Glim_DrawCanvas:
```

The `.routine` line is the boundary. It applies to the label below it
and opens a region that the next `.routine` closes, and it hands that
region to AZM as one unit: `Glim_PaintPixel` is a callable routine,
and because the directive carries no clauses, AZM infers the
routine's register behaviour - what it reads on entry, what it may
destroy - from the body itself. Your code sits inside verbatim; the
wrapper closes the region with the compiled `updates` line and the
`ret`; the next boundary opens `DrawCanvas`. Every block wrapper,
every dispatcher, and every library routine in the file stands behind
one.

A policy line near the top of the file turns inference into
enforcement:

```asm
; Register contracts are declared with .routine and checked at
; strict strength over this whole generated file.
        .contracts strict
```

Under `strict`, AZM proves every `call` in the file against the
contract of the routine it calls - the inferred contracts of your
blocks and the declared contracts of the library alike. `FbPlot`'s
declaration sits in the profile library:

```asm
; Set one pixel. B = x (0-7), C = y (0-7), A = colour bits
; (COLOR_RED/GREEN/BLUE, OR-combined). ORs into the framebuffer.
.routine in A,B,C clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry
FbPlot:
```

Read the contract line the way you read a block header. `in A,B,C`:
the routine consumes those three on entry - colour, x, y. `clobbers
A,B,DE,HL` and the flags: any of those may hold anything on return.
A register absent from a declared contract counts as preserved, and
AZM checks the routine's body against that promise too - so C's
absence from the clobbers list is a verified guarantee that y
survives the call.

## A trampled register

`DrawCanvas` ends by plotting the cursor over the picture: x into B,
y into C, white into A, `call FbPlot`. Suppose you widen the cursor
to two pixels - the cursor and the column to its right - and reach
for the shortest edit: after the plot, nudge B along and plot again.

```text
    ld a,COLOR_WHITE
    call FbPlot
    inc b           ; one column right: a two-pixel cursor
    ld a,COLOR_WHITE
    call FbPlot
```

Rebuild:

```text
canvas.glim:116:5: [AZMN_REGISTER_CONTRACTS] error: CALL FbPlot may modify B, but the pre-call value is used later.
```

An error this time, and the build stops: the generated assembly is on
disk for reading, and nothing downstream of it - no hex, no binary,
no debug map. AZM followed the code past the first call, found `inc
b` consuming B's pre-call value, checked B against `FbPlot`'s
clobbers list, and refused. On the board, this bug is a second pixel
landing wherever `FbPlot` happened to leave B, and an evening of
staring; at build time it is one line naming the file, the position,
the call, and the register.

The fix honours the contract. B gets rebuilt from state after the
call; C, promised safe, carries y straight through:

```text
    ld a,COLOR_WHITE
    call FbPlot
    ld a,(Cursor + offset(Point, x))
    inc a           ; one column right: a two-pixel cursor
    ld b,a
    ld a,COLOR_WHITE
    call FbPlot     ; C still holds y: it survived the first call
```

That version builds clean. Canvas keeps its one-pixel cursor for the
chapters ahead; what stays is the habit of reading a callee's
clobbers line before reusing a register across the call.

The diagnostic's address deserves a second look: `canvas.glim:116:5`.
The faulty call sits in a block body, and Glimmer carries every body
line's origin through to the assembler, so the error arrives with
your file, your line, and your column attached. Every body diagnostic
lands this way. Misspell the counter's name inside `ShowMarks` and
the assembler answers in the same coordinates:

```text
canvas.glim:122:5: [AZMN_SYMBOL] error: Unresolved symbol "Marsk" in 16-bit fixup.
```

You write Z80 inside blocks, so assembler diagnostics are part of
everyday Glimmer work - and they reach you on the line you typed.

## Stepping where the bug lives

The same coordinates work while the program runs. Set a breakpoint on
the `or b` line inside `PaintPixel` and press F5. The board runs, the
cursor steers - and the moment you press GO, the debugger halts on
your line in `canvas.glim`. The registers panel holds the story so
far: HL points into `Picture` at the cursor's row, B carries the
column mask `MxMask` built, and A holds the row's current bits. Step,
and the new pixel merges into A; step again, and the store lands in
the picture; three steps more walk the counter up by one.

One more step crosses the boundary. Past the body's last line, the
debugger continues in `canvas.main.asm`, inside the wrapper you read
two sections ago: `ld a,(Raised0)`, then `or CHG_PICTURE +
CHG_MARKS` - the `updates` declaration executing, watchable
instruction by instruction. The crossing works in the other direction
too: stop on `DrawCanvas`'s `call FbPlot`, step in, and you land in
the profile library, labelled and commented, the same readable
assembly chapter 2 toured. Bodies stop in `.glim`; everything around
them steps in the generated file.

## Summary

- `glimmer --deps` prints one stanza per fact: kind, raisers, and
  triggers with their phases. Debug by symptom: name the fact that
  should have changed, walk up to its raisers and down to its
  triggers.
- A body that stores straight into a flag-carrying cell absent from
  its `updates` line draws a build warning naming the block, the
  cell, and the consequence. The build still completes - and at run
  time the cell's dependents sit still, because its change flag stays
  down.
- The scan reads stores that name their cell, like `ld (Marks),a`.
  Writes through pointer registers pass it unseen, so the `updates`
  line stays your declaration of intent for every write in a block.
- Each block wrapper stands behind a bare `.routine` boundary, its
  register contract inferred from the body. `.contracts strict` has
  AZM prove every call against its callee's contract, and a register
  trampled across a call stops the build.
- Library contract lines read like block headers: `in` is what the
  routine consumes, `clobbers` is what it may destroy, and a register
  absent from a declared contract is a verified promise to survive
  the call.
- Body diagnostics and breakpoints arrive in `.glim` coordinates,
  with line and column; wrappers, dispatchers, and the profile
  library step in the generated assembly.

Canvas is healthy again at 126 lines, and one pattern now appears in
six of its seven blocks: the cursor's `offset` arithmetic, retyped
wherever a rule needs the cursor. The next chapter writes it once -
routines, parts, and imports, the structure a growing program needs.

---

[← Arrays and Layout Types](10-arrays-and-layout-types.md) | [Book](index.md) | [Routines, Parts and Imports →](12-routines-parts-and-imports.md)
