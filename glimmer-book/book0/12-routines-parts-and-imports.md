---
layout: default
title: "Routines, Parts and Imports"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 12
---

[← Dependency Reports and Debugging](11-dependency-reports-and-debugging.md) | [Book](index.md) | [Cards →](13-cards.md)

# Chapter 12 - Routines, Parts and Imports

Canvas finished chapter 11 healthy: 147 lines, one file, and a cursor
whose offset arithmetic appears in six different blocks. Now give it
the feature a painting program owes its painter: an eraser. AD sits
unused beside GO on the keypad, and the rule is `StampPixel`'s mirror
image - find the cursor's row byte, build the column's mask, and
clear the bit instead of setting it. Write it out and the eraser
opens with a dozen instructions copied whole from `StampPixel`,
before the first line that differs. Twelve duplicated instructions
are twelve places for the next change to miss one.

The eraser breaks the counter, too. `Marks` counts stamps laid:
stamp ten pixels, erase all ten, and the display holds ten over a
blank board. The number worth showing is how many pixels the picture
holds right now, and that fact comes from `Paint` itself, by
counting set bits across eight bytes - loop work with a register
interface and no facts of its own: library code that belongs to
Canvas.

This chapter adds the three declarations that give a growing program
its structure. A `routine` holds shared code once, where every block
can call it. A `part` moves declarations into a second `.glim` file
that belongs to the same program. An `import` brings in a file of
hand-written assembly. Canvas leaves the chapter as three files, each
holding one kind of content.

## Canvas, in three files

The entry file after the split, complete:

```text
program Canvas

platform tec1g-mon3
display matrix8x8

import "paint-lib.asm"

type Point
    x : byte
    y : byte
end

state Cursor : Point changed
state Paint  : byte[8] changed

pulse Left
pulse Right
pulse Up
pulse Down
pulse Stamp
pulse Erase

bind key KEY_4 held period 8 -> Left
bind key KEY_6 held period 8 -> Right
bind key KEY_2 held period 8 -> Up
bind key KEY_8 held period 8 -> Down
bind key KEY_GO rising -> Stamp
bind key KEY_AD rising -> Erase

routine CursorSpot
begin
    ld a,(Cursor + offset(Point, x))
    call MxMask
    ld b,a          ; B = the column's pixel mask
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Paint
    add hl,de       ; HL -> the cursor's row byte
end

part "canvas-rules.glim"
```

Forty-two lines, and every block is gone. The facts, moments, and
bindings stay - joined by `Erase`, fired by AD - framed by the three
new declarations: `import` near the top, `routine` in the middle,
`part` at the end. The blocks now live in `canvas-rules.glim`; the
drawing and counting loops live in `paint-lib.asm`, hand-written
assembly. Building the entry file gathers all three:

```sh
glimmer build canvas.glim
```

```text
Wrote canvas.main.asm (register contracts checked by AZM)
Wrote canvas.main.d8.json (47 block segments attributed to .glim source)
```

One build, one program, one generated file. The split moved source
between files and changed nothing the Z80 will see. The rest of the
chapter takes the three declarations in turn.

## One copy of the arithmetic

A `routine` declares a callable helper. The header carries a name
alone - no `on` line schedules it, no phase dispatches it - and it
runs when a block calls it, the way `FbPlot` runs. The body follows
the block rules you know: real Z80, `_` labels local to the body, and
a fall-through ending, with Glimmer appending the final `ret`. A
conditional early return like `ret c` is legal anywhere inside.

Reread `CursorSpot` in the entry file above: the stamp arithmetic,
written once and tightened. `MxMask` from chapter 10 turns x into
the column's mask, y indexes `Paint`, and the routine hands back B
holding the mask and HL aimed at the cursor's row byte. Both
painting rules shrink to their verbs:

```text
effect StampPixel
    on Stamp
    updates Paint
begin
    call CursorSpot
    ld a,(hl)
    or b            ; fold the pixel into the row
    ld (hl),a
end

effect ErasePixel
    on Erase
    updates Paint
begin
    call CursorSpot
    ld a,b
    cpl             ; every column except the cursor's
    and (hl)
    ld (hl),a
end
```

Stamp ORs the mask in; erase complements it and ANDs, clearing
exactly one bit. The dozen shared instructions live in one place,
and the next change to the addressing reaches both rules by touching
neither.

Chapter 11's contract checking covers the routine without a line
from you. AZM reads the body and infers the contract: B and HL come
out carrying the mask and the row address, A, DE and the flags are
clobbered, and C passes through untouched. Every `call CursorSpot`
is then proven against that inferred contract at strict strength,
the same proof each call to `FbPlot` gets against its declared one.

## The rules in their own file

```text
part "canvas-rules.glim"
```

A `part` names another `.glim` file whose declarations join the
program. The entry file - the one you hand to `glimmer build` -
declares `program`, `platform` and `display`, and each part
contributes cells, resources, bindings and blocks to that same
program. The compilation unit is the project; the files are storage.

Shared means shared all the way down. `Cursor` is declared in
`canvas.glim` and written by `MoveLeft` in `canvas-rules.glim`;
`CursorSpot` is declared in the entry file and called from the part;
the part's effects trigger on pulses the entry file bound. One rule
keeps the arrangement single-headed: a part may declare no
`program`, `platform`, `display` or parts of its own. Identity and
hardware belong to the entry file, and paths - the part's, and the
import's - resolve relative to it, whatever directory you build
from.

The part opens with a comment and goes straight into blocks - a part
needs no preamble of its own. `MoveLeft` arrives exactly as chapter
11 left it:

```text
; Canvas's rules and pictures - a part of canvas.glim.

effect MoveLeft
    on Left
    updates Cursor
begin
    ld a,(Cursor + offset(Point, x))
    or a
    jr z,_stop      ; at the left edge: stay
    dec a
    ld (Cursor + offset(Point, x)),a
_stop:
end
```

The other three movement effects follow, then the painting rules and
the renders: 90 lines, six effects and two renders, one file with
one kind of content.

Diagnostics name the file they come from. Misspell the label in
`MoveDown`'s guard - `jr nc,_sotp` - and rebuild:

```text
canvas-rules.glim:45:5: [AZMN_SYMBOL] error: Unresolved symbol "_sotp" in rel8 jr nc fixup.
```

The coordinates work exactly as chapter 11 taught, with the file
name choosing the file: line 45 of the part, where the typo sits.
Breakpoints ride the same map, so a breakpoint inside `StampPixel`
stops Debug80 in `canvas-rules.glim`.

## A module of your own

Two jobs remain that own no facts and answer no pulses. Drawing the
board is a copy loop, eight row masks into the framebuffer's green
plane - chapter 10 wrote it inside `DrawCanvas`. Counting lit pixels
is a bit-counting loop over the same eight bytes. Both are plain
assembly with a register interface at the top and a `ret` at the
bottom: library code in everything but the file it lives in.
`import` gives it that file.

```asm
; Canvas's support module - hand-written AZM, brought into the
; program with import. @ marks the exported API; the plain
; CountByte label stays private to this module.

; Copy the painting into the framebuffer: each Paint byte is a
; row mask, dropped into the row's green plane.
.routine clobbers A,B,DE,HL,carry,zero,sign,parity,halfCarry
@ShowPaint:
        ld      hl,Paint
        ld      de,Framebuffer + 1   ; green plane of row 0
        ld      b,8
_row:
        ld      a,(hl)
        ld      (de),a
        inc     hl
        inc     de
        inc     de
        inc     de
        inc     de                   ; next row: 4 bytes per row
        djnz    _row
        ret

; Count the painting's lit pixels. Returns the count in HL.
.routine out HL clobbers A,B,C,DE,carry,zero,sign,parity,halfCarry
@CountLit:
        ld      hl,Paint
        ld      c,0
        ld      d,8
_byte:
        ld      a,(hl)
        call    CountByte
        inc     hl
        dec     d
        jr      nz,_byte
        ld      l,c
        ld      h,0
        ret

; Fold A's set bits into C. Private: callable only from this file.
.routine in A,C out C clobbers A,B,carry,zero,sign,parity,halfCarry
CountByte:
        ld      b,8
_bit:
        rlca
        jr      nc,_skip
        inc     c
_skip:
        djnz    _bit
        ret
```

The module is written in the same AZM you have been reading in
generated files all book. Each callable opens with a `.routine`
contract line of the kind you read on `FbPlot` in chapter 11 - in a
module you declare the contract yourself, and AZM holds every caller
to it. The module reads the program's names directly: `Paint` and
`Framebuffer` are the same labels your blocks use.

The `@` on a label exports it. `ShowPaint` and `CountLit` are the
module's public API, callable from any block in any file, and
references omit the `@`. `CountByte` carries no `@`, so it stays
private: callable anywhere inside `paint-lib.asm` and nowhere
outside it. The `_row`, `_byte` and `_bit` labels are local to their
routines, exactly as in your blocks. Try the private label from a
block - `call CountByte` in `ShowCount` - and the build refuses with
the rule spelled out:

```text
canvas-rules.glim:88:5: [AZMN_SYMBOL] error: symbol "CountByte" is private to paint-lib.asm; export it with @CountByte or keep the reference inside that file
```

The two renders spend the API:

```text
render DrawCanvas
    on Cursor, Paint
begin
    call FbClear
    call ShowPaint
    ld a,(Cursor + offset(Point, x))
    ld b,a
    ld a,(Cursor + offset(Point, y))
    ld c,a
    ld a,COLOR_WHITE
    call FbPlot     ; the cursor on top
end

render ShowCount
    on Paint
begin
    call CountLit   ; HL = the count of lit pixels
    call HudWriteU16
end
```

`DrawCanvas` keeps the cursor and hands the board to `ShowPaint`.
`ShowCount` replaces chapter 11's `ShowMarks` - and retires the
`Marks` cell with it, because the count is computed from the
picture now, fresh on every redraw: `CountLit` returns it in HL,
which is where `HudWriteU16` wants its value. Stamp, and the count
climbs; erase, and it falls; the display and the board can never
disagree, because they draw from the same eight bytes.

## The generated file

Open `canvas.main.asm` and each of the three declarations has left
its signature. The routine first:

```asm
; --- routine CursorSpot ---
.routine
CursorSpot:
    ld a,(Cursor + offset(Point, x))
    call MxMask
    ld b,a          ; B = the column's pixel mask
    ld a,(Cursor + offset(Point, y))
    ld e,a
    ld d,0
    ld hl,Paint
    add hl,de       ; HL -> the cursor's row byte
        ret
```

A `.routine` boundary, your body verbatim, and the appended `ret`
closing the fall-through. The label is plain `CursorSpot`, exactly
as declared, because your code calls it by name; block labels wear
the `Glim_` prefix because only dispatchers call them. The bare
`.routine` line is where AZM's inference attaches: the contract it
works out from this body is what every call site is checked against.

Blocks from the part compile exactly like blocks from the entry
file:

```asm
; --- logic block StampPixel ---
.routine
Glim_StampPixel:
    call CursorSpot
    ld a,(hl)
    or b            ; fold the pixel into the row
    ld (hl),a
        ld      a,(Raised0)          ; deliver to later phases this frame
        or      CHG_PAINT
        ld      (Raised0),a
        ret
```

Same wrapper, same change-flag raise, same boundary. The file a
declaration came from survives in the debug map, where each body's
lines are attributed to their own `.glim` source; the assembly is
one program.

The import lands past the frame machinery, after `GlimEndFrame` and
before the profile library:

```asm
; --- imported AZM modules ---
; Import names resolve program-wide; bytes land here, outside
; every execution path. @ labels are the modules' public API.
        .import "paint-lib.asm"
```

`.import` places the module's bytes at the directive, so placement
carries meaning, and Glimmer chooses the spot where the profile
library already lives: a region no code falls through into, reached
only by the calls that name it. Your module sits beside `FbPlot` and
`MxMask` in the memory map - which is what it has become: library
code, written by you.

## Summary

- `routine Name begin ... end` declares a callable helper: no
  triggers, no dispatch, called with plain `call Name`. The body
  falls through and Glimmer appends the `ret`; conditional early
  returns are legal. AZM infers the register contract and proves
  every call site against it.
- `part "file.glim"` joins another file's declarations to the same
  program and namespace: cells declared in one file are written and
  watched from another. The entry file alone declares `program`,
  `platform` and `display`; paths resolve relative to it.
- Diagnostics and breakpoints name the file they belong to, so a
  typo in a part is reported - and stepped - in that part.
- `import "module.asm"` brings hand-written AZM into the program.
  `@` labels are the public API, callable from any block without the
  `@`; plain labels stay private to the module; each callable
  carries its own `.routine` contract line.
- In the generated file, a routine emits as a `.routine` boundary,
  your label, and an appended `ret`; part blocks emit exactly like
  entry-file blocks; `.import` lands the module's bytes outside
  every execution path.

Canvas has room to grow again - and the next chapter spends that
room on what every finished game needs: a title screen, a playing
screen and a game-over screen, declared as cards.

---

[← Dependency Reports and Debugging](11-dependency-reports-and-debugging.md) | [Book](index.md) | [Cards →](13-cards.md)
