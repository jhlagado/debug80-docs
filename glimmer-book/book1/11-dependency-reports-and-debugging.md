---
layout: default
title: "Dependency Reports and Debugging"
parent: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 11
---

# Dependency Reports and Debugging

Canvas is the largest program in the book so far: a `Point`
cursor, an eight-byte picture, five pulses, and six blocks connecting
them. The chapters ahead double that, so the tools come now, on a
familiar program before later examples double its size.
A misdrawn pixel in Canvas might trace to
the painting rule, the redraw, a movement effect, or a binding. The
useful debugging question is *which fact should have changed?* Canvas
now has seven candidate answers.

Every block you have built sits behind a
`.routine` boundary for register-contract checking. Every
build checks register contracts across the complete generated file,
every debug map lands breakpoints in your source, and the dependency
report prints the reactive graph on request. You will extend
Canvas with a counter, then break it twice on purpose (once for a
warning and once for a hard error) so each diagnostic can be examined
against a known bug.

## A count of marks

One byte now counts every pixel painted, and the seven-segment display
shows the tally. One declaration joins the state:

```text
state Marks   : byte = 0 changed
```

Spoken aloud, the declaration says: *Marks is a byte,
starting at zero, already changed*, so the display reads 00000 on
the first frame.

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

The first eleven body lines are unchanged: mask the
column, point HL at the row, OR the pixel in. The header names both
facts the block writes,
`updates Picture, Marks`, and when the block runs, both change flags
rise together.

One render is new, using the existing HUD routine:

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

The cursor, movement effects and `DrawCanvas` remain unchanged. The
file builds clean:

```sh
glimmer build canvas.glim
```

```text
Wrote canvas.main.asm (register contracts checked by AZM)
Wrote canvas.main.d8.json (56 block segments attributed to .glim source)
```

In a running Debug80 build, every press of GO sets a pixel and lifts
the count.

## The report at scale

The earlier four-fact dependency report repeated relationships visible
at a glance. Canvas has eight facts, enough for the grouped report to
make those relationships easier to trace:

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

Each fact has a stanza containing its kind and type, the blocks that
raise it and the blocks it triggers, with every dependent tagged by
phase.
Glimmer computes the report from your `bind`, `on` and `updates`
connections, gathered into one place and sorted by fact.

When something misbehaves in a reactive program, your first question
is the one this chapter opened with: which fact should have changed? The
report supplies both directions of that trace before you
touch a debugger. Suppose the count on the display sits still while pixels
keep landing. Downstream from `Marks` is one trigger, `ShowMarks (render)`, so
exactly one block draws the count.
Upstream: `Marks` is raised by `PaintPixel`, which runs on `Paint`,
which `key KEY_GO (rising)` fires. The investigation starts with the
fact that should have changed, follows its raisers upstream and its
triggers downstream, then places the first breakpoint where the chain
is thinnest.

## An undeclared write

The next version deliberately removes `Marks` from `PaintPixel`'s
updates list so the stuck count can be observed:

```text
effect PaintPixel
    on Paint
    updates Picture
begin
```

The body still stores to `Marks`, and the header now lists `Picture`
alone.
This is a common reactive error: a store added to a block without
updating the header to match. On the next build, the tool reports:

```text
canvas.glim:75: [GLIM] warning: PaintPixel writes Marks but does not declare "updates Marks": the change flag will not be raised and dependent blocks will not run.
Wrote canvas.main.asm (register contracts checked by AZM)
Wrote canvas.main.d8.json (56 block segments attributed to .glim source)
```

Glimmer scanned the body, found `ld (Marks),a`, checked the header,
and reported the gap, naming the block, the missing declaration and
the consequence, at line 75, the block's header line. A warning
allows the build to finish: both artifacts were written. In the running
program, the consequence is visible. Pixels paint, the board
redraws, and the count reads 00000 no matter how many marks pile
up. The
store still executes on every press, and `Marks` climbs in memory;
its change flag stays down, and `ShowMarks` runs only when that flag
is set.

The report tells the same story from the declarations' side. With
`--deps`, the broken program's `Marks` stanza reads:

```text
  Marks : state byte
    raised by: (nothing)
    triggers:  ShowMarks (render)
```

A fact with a dependent and no raiser identifies this class of bug in
two lines. The generated file shows the same gap: the
wrapper after `PaintPixel`'s body, which raised `CHG_PICTURE +
CHG_MARKS` before the edit, now raises `CHG_PICTURE` alone. Restoring
`Marks` to the header gives a clean build.

The scan behind that warning reads only stores that name their cell in
the instruction itself: `ld (Marks),a` names `Marks`, so the header
can be checked against it. `PaintPixel`'s other write travels through
a pointer (`ld (hl),a`, with HL aimed into `Picture` by arithmetic)
and a build-time scan cannot determine where HL will point at run
time. Removing `updates Picture` from the header instead leaves the
build silent while the board freezes in the same way. The `updates`
line therefore remains your declaration of intent: the
one place that records where a block's writes land, whatever route
they take.

## The boundary around a block

Register checking happens in the generated file, and its unit of
account is the block. The painting rule in `canvas.main.asm` begins:

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
and opens a region that the next `.routine` closes. The assembler
checks that region as one unit: `Glim_PaintPixel` is a callable routine,
and because the directive stands bare, the assembler infers the
routine's register behaviour (what it reads on entry, what it may
destroy) from the body itself. Your code sits inside verbatim; the
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

Under `strict`, the assembler checks every `call` in the file against the
contract of the routine it calls, the inferred contracts of your
blocks and the declared contracts of the library alike. `FbPlot`'s
declaration sits in the profile library:

```asm
; Set one pixel. B = x (0-7), C = y (0-7), A = colour bits
; (COLOR_RED/GREEN/BLUE, OR-combined). ORs into the framebuffer.
.routine in A,B,C clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry
FbPlot:
```

As a block header, the contract line says `in A,B,C`:
the routine consumes those three on entry (colour, x, y). `clobbers
A,B,DE,HL` and the flags: any of those may hold anything on return.
A register the contract leaves out counts as preserved, and
the assembler checks the routine's body against that contract too.
`FbPlot` leaves C out of its clobbers list, which is a verified
guarantee that y survives the call, proven on every
build, and about to matter.

## A register clobber

This time the bug reuses a register after a call that may clobber it.
The assembler detects the stale-register use before the first byte
runs.

`DrawCanvas` ends by plotting the cursor over the picture: x into B,
y into C, white into A, `call FbPlot`. A tempting edit for a
two-pixel cursor increments B after the first plot and calls `FbPlot`
again.

```text
    ld a,COLOR_WHITE
    call FbPlot
    inc b           ; one column right: a two-pixel cursor
    ld a,COLOR_WHITE
    call FbPlot
```

The next build reports the contract violation:

```text
canvas.glim:116:5: [AZMN_REGISTER_CONTRACTS] error: CALL FbPlot may modify B, but the pre-call value is used later.
```

An error this time, and the build stops. The generated assembly is on
disk for reading, and the build halts short of the hex, the binary
and the debug map. The assembler followed the code past the first call, found `inc
b` consuming B's pre-call value, checked B against `FbPlot`'s
clobbers list, and refused. On the board, this bug is a second pixel
landing wherever `FbPlot` happened to leave B. At build time, the
diagnostic names the file, position, call and register.

The fix follows the contract. B is rebuilt from state after the call;
C is preserved by `FbPlot`, so it carries y through:

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
chapters ahead. The example shows why a callee's clobbers list matters
before a register is reused across the call.

![Canvas as a graph, with the chapter's two bugs marked where the tools found them.](../../assets/images/glimmer-book/book1/dependency-graph.svg)

The diagnostic's address, `canvas.glim:116:5`, points at the faulty
call in a block body, and
Glimmer carries every body line's origin through to the assembler, so
the error arrives with your file, your line, and your column
attached. A misspelling of the counter's name inside `ShowMarks`
produces an assembler diagnostic in the same coordinates:

```text
canvas.glim:122:5: [AZMN_SYMBOL] error: Unresolved symbol "Marsk" in 16-bit fixup.
```

You write Z80 inside blocks, so assembler diagnostics are part of
everyday Glimmer work, and they reach you on the line you typed.

## Stepping through the bug

The same coordinates keep working while the program runs: the report
identifies where the breakpoint belongs, and the debug map makes it
land. A breakpoint on the `or b` line inside `PaintPixel` halts on
that source line when GO fires `Paint`. The registers panel shows the
current state: HL points into `Picture` at the cursor's row, B carries
the column mask `MxMask` built, and A holds the row's current bits.
The next step merges the new pixel into A; the following step stores
it in the picture; three more steps advance the counter by one.

Past the body's last line, the
debugger continues in `canvas.main.asm`, inside the wrapper you read
two sections ago: `ld a,(Raised0)`, then `or CHG_PICTURE +
CHG_MARKS`, the `updates` declaration executing, watchable
instruction by instruction. The crossing works in the other direction
too: stepping into `DrawCanvas`'s `call FbPlot` lands in the labelled
and commented profile library.

The cursor's `offset` arithmetic appears in
six of its seven blocks, retyped wherever a rule needs the cursor. The
next chapter moves it into one routine:
[Routines, Parts and Imports](12-routines-parts-and-imports.md), the
structure used to organise a growing program.

## Exercises

**1. A stuck counter trace.** In the version that omits `updates Marks`, a
dependency trace should start at `KEY_GO` and finish at `ShowMarks`, marking
the connection missing from the report. The answer should reconcile the
changing byte in memory with the fixed value on the display.

**2. Registers across `FbPlot`.** A before-and-after register table should
classify A, B, C, DE, and HL as preserved or potentially clobbered by
`FbPlot`. It should then explain why the corrected two-pixel example may reuse
C but must reconstruct B.

**3. A bounded two-pixel cursor.** The safe version of a two-pixel cursor
plots a second pixel only when the cursor's x coordinate is below 7 and
rebuilds B after the first `FbPlot`. The revised tail of `DrawCanvas`, a clean
contract check, and observations at x=6 and x=7 provide the result.

**4. An indirect write with no declaration.** Removing `updates Picture`
while retaining `ld (hl),a` produces no direct-store warning. A debugging
record should include the `Picture` stanza from the dependency report, the
changed row byte in memory, the unchanged matrix, and the header repair.

[Exercise notes](exercise-notes.md#chapter-11-dependency-reports-and-debugging)
