---
layout: default
title: "Appendix A - Declaration Reference"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 19
---

[Book](index.md)

# Appendix A - Declaration Reference

Every Glimmer declaration in one place. Each entry gives the grammar
production from the Glim grammar reference, then one example from a
program built with `glimmer build`, then the constraints the compiler
enforces.

Rules that apply everywhere:

- Every statement starts with a keyword; `;` starts a comment, in
  `.glim` and AZM alike.
- Three symbols, one meaning each: `:` reads "is a", `=` reads
  "starting at", `->` reads "fires".
- All declared names share one namespace and must be unique. The
  `Glim`, `Snd_`, `Curve_`, `Shape_`, `CHG_`, and `__` prefixes and the
  runtime and profile names are reserved.
- Flag-carrying cells are allocated by category order - states, then
  pulses, then ramps, then `FrameCount` - into up to four change-flag
  banks; the current cap is 32 cells.
- Two built-in cells need no declaration: `FrameCount` increments every
  frame and is legal in `on`; `CurrentCard` arrives with the first card.

```text
identifier      ::= [A-Za-z_][A-Za-z0-9_]*
number          ::= decimal | "$" hex | "0x" hex | "%" binary
```

## Program shape

### program

```text
program-decl    ::= "program" identifier

program RefMatrix
```

- Required, exactly once per program; only the entry file declares it.

### platform

```text
platform-decl   ::= "platform" platform-name        ; "tec1g-mon3"

platform tec1g-mon3
```

- At most once, and only together with `display`.
- Omitting both selects the generic profile: placeholder API addresses,
  for tests and for reading the generated structure.

### display

```text
display-decl    ::= "display" display-name          ; "matrix8x8" | "tms9918"

display matrix8x8
```

- At most once, and only together with `platform`.
- `matrix8x8` generates the scan-driven matrix runtime; `tms9918` the
  vblank-paced VDP runtime with a commit phase.
- The display gates its resources: shapes and sounds belong to
  `matrix8x8`, sprites and tiles to `tms9918`.

## Facts and moments

### state

```text
state-decl      ::= "state" identifier ":" cell-type
                    ( "=" number )? ( "changed" )?
                  | "state" identifier ":" array-type ( "changed" )?
                  | "state" identifier ":" type-expr ( "changed" )?
cell-type       ::= "byte" | "word"
array-type      ::= "byte" "[" number "]"

state Count  : byte = 0 changed
state Score  : word = 0
state Board  : byte[8] changed
state Cursor : Point changed
```

- Scalars are `byte` or `word`; the initial value defaults to 0.
- `changed` marks the cell changed at startup, so dependents run on
  the first frame.
- Arrays and typed cells: one flag for the whole cell, zero-filled
  storage, no initializer; indexing is ordinary Z80 in block bodies.
- `byte[N]` takes N from 1 to 256; word arrays are unimplemented.

### type

```text
type-decl       ::= "type" identifier newline
                    type-field*
                    "end"
                  | "type" identifier "=" type-expr    ; alias (.typealias)
type-field      ::= identifier ":" field-type
field-type      ::= "byte" | "word" | "addr"
                  | number                             ; byte count
                  | type-expr
type-expr       ::= identifier ( "[" number "]" )?

type Point
    x : byte
    y : byte
end

type Pair = Point[2]
```

- Field types: `byte`, `word`, `addr`, a raw byte count, or another
  layout, including arrays of layouts; recursion is a parse error.
- The block form compiles to an AZM `.type` record, the alias form to
  `.typealias`; `sizeof`, `offset`, and layout casts work on the name
  inside block bodies.

### pulse

```text
pulse-decl      ::= "pulse" identifier

pulse Step
```

- A one-frame transient cell, raised by bindings, timers, ramps, or a
  block's `updates`; it clears at the end of every frame.
- A raise whose consumers are all in later phases lands the same
  frame; any other raise rolls over whole to the next frame.

### bind

```text
bind-decl       ::= "bind" "key" key-name trigger "->" identifier
trigger         ::= "rising"
                  | "held" "period" number          ; tec1g-mon3 only
key-name        ::= identifier | "any"              ; validated per platform;

bind key KEY_2 rising -> Step
bind key KEY_4 held period 8 -> Fire
bind key any rising -> AnyKey
```

- The target must be a declared pulse.
- `rising` fires on the frame the key is first pressed; `held` adds an
  autorepeat every `period` frames while the key stays down.
- `any` fires on every new press, rising only, tec1g only, alongside
  any named binding the same press matches.
- Key names are validated per platform; Appendix B lists the MON-3
  set.

### timer

```text
timer-decl      ::= "timer" identifier ":" cell-type "=" number
                    "->" identifier ( "once" )?

timer Blink : byte = 12 -> Tick
timer Gate : word = 384 -> Opened once
```

- The target must be a declared pulse.
- The cell is the writable period; a hidden countdown fires the pulse
  and reloads from the cell each time it runs out.
- `once`: the cell is the countdown itself; it fires a single time at
  zero and stays idle until code writes it again.
- Timer cells carry no change flag - trigger on the pulse - so they
  are legal in `updates` and absent from `on`.

### ramp

```text
ramp-decl       ::= "ramp" identifier ":" "byte" "steps" number
                    "->" identifier

ramp Travel : byte steps 64 -> Arrived
```

- The target must be a declared pulse.
- The cell steps each frame toward `steps - 1`, marked changed at
  every step, fires the pulse on arrival, and idles at the terminal
  value; writing the cell (usually to 0) starts it moving again.
- The cell is legal in both `on` and `updates`.

## Blocks

```text
block-decl      ::= block-kind identifier
                    block-header*
                    ( "begin" newline azm-line* )?  ; body optional with goto
                    "end"
block-kind      ::= "compute" | "effect" | "render" | "enter"
block-header    ::= "on" name-list                  ; not on enter
                  | "updates" name-list             ; not on render
                  | "goto" identifier               ; card transition after
name-list       ::= identifier ( "," identifier )*
```

Constraints shared by every block kind:

- Every block needs at least one `on` trigger; `enter` alone omits it,
  because entry is its trigger.
- `on` names must be flag-carrying cells, `updates` names writable
  runtime cells; an array or typed cell is one flag.
- Bodies are verbatim AZM and fall through: the generated wrapper
  appends the flag bookkeeping and the `ret`. `end` terminates a body
  when it is the only word on the line.
- `_name` labels are local to the block; a plain label is a file-level
  symbol. A direct store into a flag-carrying cell missing from
  `updates` draws a compiler warning.

### compute

```text
compute DeriveScore
    on Count
    updates Score
begin
    ld a,(Count)
    ld l,a
    ld h,0
    ld (Score),hl
end
```

- Computes run first in the frame, before effects and renders.
- `updates` is required: computing state is the block's purpose.

### effect

```text
effect Advance
    on Step
    updates Count
begin
    ld hl,Count
    inc (hl)
end
```

- Effects run second: the phase for game rules.
- `updates` is optional: an effect may act entirely through calls,
  such as starting a sound cue.

### render

```text
render ShowScore
    on Score
begin
    ld hl,(Score)
    call HudWriteU16
end
```

- Renders run last in the frame and draw state to the display.
- `updates` and `goto` are rejected on a render: it depicts state.

### enter

```text
enter SetupPlaying
    updates Count
begin
    xor a
    ld (Count),a
end
```

- Legal only inside a card section; runs once on entry to that card,
  before the card's other blocks, with no `on` line.
- Entry is edge-triggered: marking `CurrentCard` changed without
  switching cards cannot re-run it.
- An enter block's `updates` re-raises the cells a card's renders
  need, because a card-gated block sees only flags raised while its
  card is active.

### goto

```text
effect StartGame
    on AnyKey
    goto Playing
end
```

- `goto` names a declared card and switches to it after the block
  runs; with `goto`, `begin` is optional, so a header-only routing
  block closes directly with `end`.
- The switch lands at the next frame start; the destination's `enter`
  blocks run first on the frame it activates.
- `goto` is the unconditional form; a transition that depends on a
  runtime test is a conditional store of a `Card.<Name>` value into
  `CurrentCard`, under `updates CurrentCard`.

### routine

```text
routine-decl    ::= "routine" identifier newline
                    "begin" newline
                    z80-body
                    "end"

routine ClampX
begin
    cp 8
    ret c
    ld a,7
end
```

- No triggers, no dispatch: blocks call it with an ordinary
  `call ClampX`.
- Emitted as a `.routine` boundary followed by `ClampX:`, with its
  register contract inferred by AZM.
- The body falls through and the generator appends the final `ret`;
  conditional early returns are fine.

## Resources

### curve

```text
curve-decl      ::= "curve" identifier preset "steps" number
                    ( "from" number "to" number )?
preset          ::= identifier

curve SlideX ease_out steps 64 from 0 to 7
```

- Computed at build time; emitted as a page-aligned byte table named
  `Curve_<Name>`.
- Presets: `linear`, `ease_in`, `ease_out`, `ease_in_out`, `sine`,
  `overshoot`, `anticipation`.
- `steps` runs from 2 to 256; `from` and `to` are byte values and
  default to `0` and `steps - 1`.

### shape

```text
shape-decl      ::= "shape" identifier "color" color-name
                    ( shape-row+ | rot-group+ )
                    "end"
rot-group       ::= "rot" digit shape-row* newline shape-row*
                  | "rot" digit "=" "rot" digit   ; alias of an earlier
shape-row       ::= string
color-name      ::= "red" | "green" | "blue" | "yellow" | "cyan"
                  | "magenta" | "white"

shape Dot color green
  "XX"
  "XX"
end

shape PieceS color green
  rot0 "XX."
       ".XX"
  rot1 ".X"
       "XX"
       "X."
  rot2 "..."
       "XX."
       ".XX"
  rot3 = rot1
end
```

- Requires `platform tec1g-mon3` with `display matrix8x8`; rows are
  rectangular quoted strings, 1 to 8 wide by 1 to 8 high, `X` lit and
  `.` empty.
- The plain form emits a `Shape_<Name>` table drawn with `ShapeDraw`
  (HL = table, B = x, C = y): an OR into the framebuffer, no clipping.
- Rotation groups: `rot0`..`rot3` declared in order, 1 to 4 rows each,
  padded to a 4-row frame; `rotN = rotM` aliases an earlier distinct
  rotation, and rotations beyond those declared cycle.
- The rotational form compiles to `ShapeRot_<Name>_<k>` bitmaps plus
  the shared `ShapeRotPtrTable`, `ShapeRotRightTbl`, and
  `ShapeRotColorTbl`, with a `ShapeId_<Name>` equate per shape; index
  an entry by `id*4 + rotation`.

### sprite

```text
sprite-decl     ::= "sprite" identifier "color" vdp-color
                    shape-row+     ; exactly 8 rows of 8
                    "end"

sprite Player color white
  "..XXXX.."
  ".XXXXXX."
  "XX.XX.XX"
  "XXXXXXXX"
  "XX....XX"
  ".XXXXXX."
  "..XXXX.."
  "........"
end
```

- tms9918 profile only; exactly 8 rows of 8.
- Declaration order is the sprite slot and pattern number; the name
  compiles to the slot equate, so the generated op takes it directly:
  `sprite_at Player, PlayerX, PlayerY`.
- Patterns, colours, and slot setup upload once through the generated
  `LoadResourcesVram`. At most 31 sprites; slot 31 stays hidden.

### tile

```text
tile-decl       ::= "tile" identifier "color" vdp-color "on" vdp-color
                    shape-row+     ; exactly 8 rows of 8
                    "end"
vdp-color       ::= "transparent" | "black" | "medgreen" | "lightgreen"
                  | "darkblue" | "lightblue" | "darkred" | "cyan"
                  | "medred" | "lightred" | "darkyellow" | "lightyellow"
                  | "darkgreen" | "magenta" | "gray" | "white"

tile Pip color white on black
  "........"
  "..XXXX.."
  ".XXXXXX."
  ".XXXXXX."
  ".XXXXXX."
  ".XXXXXX."
  "..XXXX.."
  "........"
end
```

- tms9918 profile only; exactly 8 rows of 8.
- The name compiles to the tile index equate: `tile_at Pip, 4, 5`
  places it at fixed coordinates, and `NamePut` (tile A at column D,
  row E) handles computed positions.
- Graphics I colours patterns in groups of eight, so tiles group by
  their (fg, bg) pair; the first pair's background is the screen
  background for empty cells.

### sound

```text
sound-decl      ::= "sound" identifier "len" number "div" number

sound Click len 2 div 10
```

- Requires `platform tec1g-mon3` with `display matrix8x8`; `len` and
  `div` are byte values from 1 to 255.
- `len` is measured in row ticks of the matrix scan (8 ticks is about
  one frame); `div` is the speaker divider, smaller values higher
  pitch.
- Each cue generates a callable routine: `call Snd_Click` starts it,
  non-blocking. One cue at a time; a new cue replaces the current one.

### text

```text
text-decl       ::= "text" identifier string

text MsgPaused "PAUSED"
```

- tec1g platform with either display: the LCD is board hardware.
- The string is zero-terminated; the generated `lcd_row` op positions
  the cursor and writes it: `lcd_row MsgPaused, LcdRow1` in a body.
- `LcdRow1`..`LcdRow4` and the MON-3 LCD call equates are emitted
  alongside.

## Structure

### card

```text
card-decl       ::= "card" identifier

card Playing
```

- Starts a section: blocks after it belong to that card until the next
  `card` line or end of file, with no closing keyword; declarations
  before the first card are global.
- The first declared card is the start card.
- Cards generate a `Card` enum and the built-in `CurrentCard` cell,
  legal in `on` and `updates`; a card's blocks run only while it is
  active.

### part

```text
part-decl       ::= "part" string

part "ref-part.glim"
```

- Entry file only. The semantics are merge: the named file's
  declarations join the same program and namespace, so the compilation
  unit is the project and files are storage.
- Paths resolve relative to the entry file; diagnostics name the file
  they come from.
- Parts may not declare `program`, `platform`, `display`, or parts.

### import

```text
import-decl     ::= "import" string

import "double.asm"
```

with the module's exported routine written in ordinary AZM:

```asm
.routine in HL out HL clobbers carry,zero,sign,parity,halfCarry
@Double:
    add hl,hl
    ret
```

- `@`-exported names become callable from any block (references omit
  the `@`); plain labels stay private to the module.
- Give each callable a `.routine` contract line; the generated program
  checks register contracts strictly, and a call into a routine with
  no declared or inferable contract fails to assemble.
- Glimmer places the `.import` in a dedicated section outside every
  execution path, because import bytes land at the directive.

---

[Book](index.md)
