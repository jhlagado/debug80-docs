---
layout: default
title: "Shapes, Sound and Displays on the Board"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 9
---

[← Motion Curves](08-motion-curves.md) | [Book](index.md) | [Arrays and Layout Types →](10-arrays-and-layout-types.md)

# Chapter 9 - Shapes, Sound and Displays on the Board

Every picture you have drawn since chapter 1 has been built from
single calls to `FbPlot`: a dot, a drop, a bar of pixels in a loop.
That was the right way to learn the machinery, and it is the wrong way
to keep going. A game's character deserves a body - two pixels by two,
or a whole 8x8 figure - and if you plot a body point by point inside
every render block, the picture drowns in the code that draws it. A
picture belongs in data, laid out where you can see its shape.

And there is more of this board than we have been using. The TEC-1G
has been sitting here all book with three instruments we have never
touched: a speaker, the six-digit seven-segment display, and the 20x4
LCD, all mounted beside the 8x8 RGB LED matrix and all reachable from
a block. When your character hits a wall, the player should hear it -
a beep placed on an event is feedback, and players feel feedback
before they think about it. When the score changes, the player should
be able to read it without taking their eyes off the game for more
than a glance. This is the chapter where your game stops being a dot
on a dark board and becomes a production: it gains a face, a voice,
and a scoreboard.

I am going to teach you one pattern three times over, because it is
the same pattern each time and I want it in your hands, not your
notes. You declare a resource in the `.glim` file - a shape, a sound
cue, a text string - and Glimmer generates the data plus something
callable to go with it. Your blocks call what was generated, and the
declaration reads like the resource it describes. The scoreboard is
the odd one out: the six-digit seven-segment display is a service the
profile library carries, two routines and no declaration. It is the same deal
chapter 1 offered you and every chapter since has kept: nothing
hidden, everything compiled into a file you can open and read - and
at the end of this chapter, we will go and read it.

## Fanfare

Fanfare is a small celebration, and it lives up to the name. A cyan spark,
two pixels square, bounces around the 8x8 matrix on its own timer.
Every wall hit reverses its direction, beeps the speaker, and adds
one to a score on the six-digit seven-segment display. The 20x4 LCD announces the program from the
first frame.

```text
program Fanfare

platform tec1g-mon3
display matrix8x8

shape Spark color cyan
  "XX"
  "XX"
end

sound Bounce len 8 div 3

text MsgHello "FANFARE"

state SparkX : byte = 3 changed
state SparkY : byte = 2
state VelX   : byte = 1
state VelY   : byte = 1
state Score  : word = 0 changed
state Banner : byte = 0 changed

pulse Tick

timer Step : byte = 6 -> Tick

effect Move
    on Tick
    updates SparkX, VelX, SparkY, VelY, Score
begin
    ; step x, bounce off columns 0 and 6
    ld a,(VelX)
    ld b,a
    ld a,(SparkX)
    add a,b
    ld (SparkX),a
    or a
    jr z,_hitx      ; left wall
    cp 6
    jr nz,_xdone    ; open board: no bounce
_hitx:
    ld a,(VelX)
    neg
    ld (VelX),a
    ld hl,(Score)
    inc hl
    ld (Score),hl
    call Snd_Bounce
_xdone:
    ; step y, bounce off rows 0 and 6
    ld a,(VelY)
    ld b,a
    ld a,(SparkY)
    add a,b
    ld (SparkY),a
    or a
    jr z,_hity      ; top wall
    cp 6
    jr nz,_ydone
_hity:
    ld a,(VelY)
    neg
    ld (VelY),a
    ld hl,(Score)
    inc hl
    ld (Score),hl
    call Snd_Bounce
_ydone:
end

render DrawSpark
    on SparkX, SparkY
begin
    call FbClear
    ld a,(SparkX)
    ld b,a          ; B = x
    ld a,(SparkY)
    ld c,a          ; C = y
    ld hl,Shape_Spark
    call ShapeDraw
end

render ShowScore
    on Score
begin
    ld hl,(Score)
    call HudWriteU16
end

render Greet
    on Banner
begin
    lcd_row MsgHello, LcdRow1
end
```

Build this and let it run. Watch, and listen. The spark ricochets,
each wall hit chirps, and the digits climb - twice in quick
succession when it rounds a corner. That is the whole program the way
a player meets it: eyes, ears, and a number.

Only three declarations at the top are new - `shape`, `sound`, and
`text` - and each gets its own section below. The machinery around
them is chapter 7's: a timer fires `Tick` every 6 frames, and `Move`
runs on `Tick`. But notice one idea riding in the state before we
move on: velocity as a fact. `VelX` holds 1 when the spark
travels right and `$FF` when it travels left, and because adding
`$FF` to a byte steps it down by one, a single `add` moves the spark
whichever way it is going. After the step, a spark at column 0 or
column 6 has an edge against a wall (the shape is 2 wide, so 6 is as
far right as it fits), and the rule answers with three moves: negate
the velocity, bump the score word, start the sound cue. Then the same
story again for y.

## A shape is pixel art with a name

Here is the spark's body again, on its own:

```text
shape Spark color cyan
  "XX"
  "XX"
end
```

A `shape` declares a bitmap you can read at a glance: quoted rows,
`X` for a lit pixel, `.` for an empty one. Rows are rectangular,
anywhere from 1x1 up to 8x8, and the colour is one of the 8x8
matrix's seven: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`,
`white`. When you want a tall cross, three wide and four high, you
draw one:

```text
shape Cross color red
  ".X."
  "XXX"
  ".X."
  ".X."
end
```

The picture lives in your source at the same zoom you designed it at,
which is the whole point: six months from now you will open this file
and see a cross, not decode one.

From each shape Glimmer emits a data table named `Shape_<Name>`, and
because at least one shape exists in the program, the profile library
gains `ShapeDraw`, the routine that paints any of them. Its interface
is three registers:

```text
ld hl,Shape_Spark
ld b,3           ; x
ld c,2           ; y
call ShapeDraw
```

HL picks the shape, B and C place its top-left corner. `ShapeDraw`
ORs each lit pixel's colour bits into the framebuffer, so lit pixels
land on top of whatever is already there and empty pixels leave it
alone - two overlapping shapes combine rather than punch holes in
each other. `DrawSpark` starts with `FbClear` for the same reason as
every moving picture since chapter 1: a moving shape redraws from a
clean board.

Now for the part I need you to respect. Placement is entirely your
responsibility: `ShapeDraw` plots every lit pixel at x plus column, y
plus row, straight into the framebuffer, and a row that hangs off the
board writes into whatever memory follows it. Keep the whole shape
inside the 8x8 matrix - for the 2x2 spark that means x and y each
stay in 0..6, which is exactly the range `Move` enforces with its
bounce tests. The game rule and the safety rule turn out to be the
same rule, and that is worth arranging on purpose in every game you
write. Register hygiene matters here too: the generated contract line
declares that `ShapeDraw` clobbers A, BC, DE, and HL, so load its
arguments last, the way `DrawSpark` does.

## Sound that keeps out of the way

```text
sound Bounce len 8 div 3
```

A `sound` declares a cue: a short, non-blocking beep. The two numbers
can wait: first, how this board makes sound at all, because there is
no sound chip to hand the job to. The
speaker is a port bit, and the only musician available is the CPU. So
Glimmer folds sound into the work the CPU is already doing: the scan
loop that keeps the 8x8 matrix lit visits the speaker once per row, 8
ticks per frame, and taps it on schedule. `len` counts those ticks -
`len 8` sounds for about one frame - and `div` sets the pitch as a
divider, with smaller values higher.

Know what this instrument is, and what it costs. The board carries
no sound chip, so every note is CPU time, and the scan service buys
you the property a game needs most: sound that never blocks. A cue
plays while the frames keep coming, and its vocabulary is short and
rhythmic by nature - clicks, chirps, buzzes, down to a long low
`len 200 div 9` at the mournful end of the range. Melody is a
different trade: MON-3 can play a tune, but it holds the CPU for the
duration, and the game stands still to sing. For feedback - a sound
at the moment something happens - the non-blocking cue is the right
tool, and this speaker does it well.

Each cue compiles to a routine named `Snd_<Name>`, and calling it is
the entire interface:

```text
    call Snd_Bounce
```

The call starts the cue and returns at once; the scan plays it out
over the following frames while your blocks keep running. One cue is
active at a time, and starting a new cue replaces the current one -
a fresh wall hit restarts the chirp from the top, which is exactly
the feedback a fresh hit deserves.

Where the call sits is the real lesson of `Move`; carry it into
every game after this one. Sound accompanies an event,
and the event lives inside a rule, behind a conditional - so
`call Snd_Bounce` sits inside the effect, on the branch where the
wall hit happened, and the quiet path steps past it. The player feels
that chirp before they think about it. Feedback is one line, in the
rule that knows.

## The score, on the seven-segment display

The six-digit seven-segment display is the board's number instrument,
and the same scan that serves the speaker serves it too: one digit
per row tick, refreshed forever. The profile library drives it with
two routines:

- `HudWriteU16` - HL = value, shown as five decimal digits, 0 to
  65535.
- `HudBlankDig` - clear all six digits.

`Score` is a word, so `ShowScore` loads all sixteen bits and hands
them over:

```text
render ShowScore
    on Score
begin
    ld hl,(Score)
    call HudWriteU16
end
```

The startup code Glimmer generates calls `FbClear` and `HudBlankDig`
before the first frame, so both displays begin dark; `Score` is
declared `changed`, so `ShowScore` runs on frame one and the score
opens at zero rather than blank. Your player never faces an empty
scoreboard.

One consequence of `Move`'s header teaches you how to think about
`updates`. The header lists
every fact the block may change, and each listed fact is marked
changed whenever the block runs - so `ShowScore` repaints its digits
every step, quiet ticks included. Should that worry you? Count the
cost: the repaint writes the same six glyph bytes and spends a few
dozen cycles in the blank window. When a score changes rarely and its
redraw is heavy, split the rule; when the redraw is `HudWriteU16`,
the broad `updates` reads better, and readable wins.

## Words on the LCD

```text
text MsgHello "FANFARE"
```

A `text` declares a zero-terminated string for the TEC-1G's 20x4
LCD. The LCD is board hardware, alongside the keypad rather than part
of any display profile, and that placement buys you something
useful: text resources work the same on the 8x8 matrix and,
later in the book, on the TMS9918. Writing a string to a row is one
line in a block:

```text
    lcd_row MsgHello, LcdRow1
```

That one line deserves a paragraph to itself, because it is your
first meeting with an AZM **op**. An op is a macro that the assembler
owns: a named instruction sequence, defined once in the generated
file and expanded inline wherever it is invoked. You write it the way
you write an instruction - name, then arguments - and the assembler
replaces it with its body, arguments substituted in. So `lcd_row`
reads like an instruction and costs what its body costs, with no call
and no routine behind it. Glimmer emits the `lcd_row` op whenever a
program declares text; your blocks invoke it. In chapter 12 you will
define ops of your own in hand-written assembly modules, and they will
feel familiar because you used this one first. Here it packages the
two MON-3 calls that position the LCD cursor and stream a string,
taking the message label and a row constant: `LcdRow1` through
`LcdRow4` come with it.

`Greet` shows you a pattern worth stealing: the run-once startup
hook. `Banner` starts `changed` and appears in no block's `updates`,
so it changes exactly once, before the first frame - `Greet` runs on
frame one, writes FANFARE to the top row, and rests for the rest of
the program's life. Whenever you want something done once at startup
- a title, a border, a greeting - declare a fact that starts changed
and never changes again, and hang a block on it. One line of state,
and the machinery does the remembering.

## The file, resource by resource

I keep promising you that every declaration has a readable other
half, and resources are the clearest case yet, because each one
leaves a mark you can find by name. Open `fanfare.main.asm` and let
us go collecting.

The text resource is its bytes, terminator included:

```asm
; --- text resources (zero-terminated LCD strings) ---
MsgHello:
        .db     "FANFARE", 0
```

The shape is a five-byte table: a header of width, height, and
colour, then one mask byte per row, lit pixels packed from bit 7:

```asm
; --- shape resources ---
; Table format: width, height, colour, then left-aligned row masks.
Shape_Spark:
        .db     2, 2, COLOR_CYAN
        .db     %11000000
        .db     %11000000
```

`ShapeDraw` walks exactly this: read the header, then for each row
shift the mask left and `FbPlot` every set bit at its offset from B
and C. The declaration you drew in `X`s and the table the routine
consumes are the same picture at two zoom levels - you can check it
by eye, two set bits, twice.

The sound cue is a three-instruction wrapper:

```asm
; --- sound cues ---
; Non-blocking matrix-profile cues. len is row ticks; div is the
; speaker divider. Starting a cue replaces the currently active cue.
.routine
Snd_Bounce:
        ld      a,8
        ld      c,3
        jp      SndStart
```

Your `len` and `div` became the two loads, and `SndStart` is the
library routine that arms the scan's speaker service - A carrying
the duration in ticks, C the divider. Declare a second cue and you
get a second wrapper over the same `SndStart`.

And the op, defined once near the end of the file:

```asm
; Position the LCD cursor at a row command, then write a string.
op lcd_row(msg imm16, row imm8)
        ld      b,row
        ld      c,ApiCommandToLcd
        rst     $10
        ld      hl,msg
        ld      c,ApiStringToLcd
        rst     $10
end
```

Two parameters, typed by size: `msg` is a 16-bit immediate, `row` an
8-bit one. The body is two MON-3 calls through `rst $10`, with the
parameters standing where their values will go. At every invocation
the assembler drops these six instructions in place, so `Greet`'s
block body lands in the file with the invocation still readable:

```asm
; --- render block Greet ---
.routine
Glim_Greet:
    lcd_row MsgHello, LcdRow1
        ret
```

Your one line, verbatim, and the assembler finishes the job from the
definition above. That is the op contract on one screen: you can
always see the invocation and what it costs, in the same file.

## Summary

Four instruments, one pattern:

- A `shape` is a named bitmap: quoted rows of `X` and `.`, 1x1 up to
  8x8, in one of seven colours. Glimmer emits a `Shape_<Name>` table
  and the `ShapeDraw` routine: HL = shape, B = x, C = y.
- `ShapeDraw` ORs lit pixels into the framebuffer, overlaps combine,
  and placement that keeps the whole shape on the board is the
  caller's job. It clobbers A, BC, DE, and HL.
- A `sound` cue compiles to `Snd_<Name>`; one call starts it and the
  scan plays it out. `len` counts row ticks (8 per frame), `div` sets
  pitch (smaller is higher), and a new cue replaces the active one.
  Call cues inside rules, on the branch where the event happened.
- The seven-segment HUD shows a value with `HudWriteU16` (HL = value,
  five decimal digits) and clears with `HudBlankDig`.
- A `text` is a zero-terminated LCD string; `lcd_row Msg, LcdRowN`
  writes it to a row. An op is an assembler-owned macro: Glimmer
  emits the definition, you invoke it like an instruction, and the
  assembler expands it inline.
- A state cell that starts `changed` and appears in no `updates` is a
  run-once startup hook.

Next, the board itself becomes data: arrays and layout types, for
games whose state is many related bytes -
[Arrays and Layout Types](10-arrays-and-layout-types.md).

---

[← Motion Curves](08-motion-curves.md) | [Book](index.md) | [Arrays and Layout Types →](10-arrays-and-layout-types.md)
