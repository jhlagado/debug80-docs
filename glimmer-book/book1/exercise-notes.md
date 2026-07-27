---
layout: default
title: "Exercise Notes"
parent: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 99
---

# Exercise Notes

These notes provide results for traces and calculations, along with checks for
the programming exercises. Open-ended work may have several sound
implementations, so its notes describe the required behaviour rather than a
complete replacement program.

## Chapter 1: The Shape of a Game

**1. The opening frames.** On frame 1, DotX's bit is set and `DrawDot` writes
a white pixel at `(3,3)` into the framebuffer after that frame's scan. The
next scan presents the pixel. On frame 2, the bit is clear and the dispatcher
skips `DrawDot`; the framebuffer still contains the same pixel.

**2. Declarations and generated code.**

| Source form | Generated counterpart |
|---|---|
| `state DotX : byte = 3 changed` | `DotX: .db 3`, a change bit, and that bit set in the initial `Changed0` value |
| `pulse Right` | A byte cleared at frame end and its own change bit |
| `bind key KEY_6 held period 8 -> Right` | Key polling, `Glim_HeldKey`, `Glim_HeldCount`, and code that fires Right |
| `on Right` | A block dependency mask and dispatcher test |
| `updates DotX` | Wrapper code that raises DotX's change bit |

**3. Vertical movement.** The state becomes `DotY`; KEY_2 fires an `Up`
pulse and KEY_8 a `Down` pulse. `MoveUp` guards zero before decrementing,
while `MoveDown` compares with 7 before incrementing. `DrawDot` loads DotY
into C and uses `ld b,3`. A correct version never stores a value outside
0..7 and keeps every plotted pixel in column 3.

**4. A missing initial change.** `Changed0` begins at zero, so `DrawDot`
receives no startup trigger and the cleared framebuffer remains dark. Restoring
`changed` to the DotX declaration restores the first render.

## Chapter 2: First Light

**1. Beacon's colour cycle.**

| GO press | A at `inc a` | Visible colour afterward |
|---:|---:|---|
| 1 | 1 | green (2) |
| 2 | 2 | yellow (3) |
| 3 | 3 | blue (4) |
| 4 | 4 | magenta (5) |
| 5 | 5 | cyan (6) |
| 6 | 6 | white (7) |
| 7 | 7 | red (1) |
| 8 | 1 | green (2) |

**2. One press through the generated file.** Polling stores 1 in `Step` and
sets `CHG_STEP`. `GlimRunLogicEffects` ANDs `Changed0` with
`GlimDep_NextColour__B0`, whose value is `CHG_STEP`, then calls
`Glim_NextColour`. The block stores the next value in `Colour`; its wrapper
raises `CHG_COLOUR` for the later render phase. `DrawBeacon`'s mask is
`CHG_COLOUR`. `GlimEndFrame` clears `Step` after the phases finish.

**3. A colour-reset control.** The addition needs a new pulse, a
`bind key KEY_AD rising -> Reset`, and an effect with `on Reset`,
`updates Colour`, and a store of 1 to `Colour`. GO should continue through
the seven-colour cycle. AD should make the next rendered pixel red from any
point in that cycle.

**4. A dark first frame.** With no initial change, the startup framebuffer is
dark. The first GO press still fires Step, runs `NextColour`, changes Colour
from 1 to 2, and schedules `DrawBeacon`, so the first visible pixel is green.
The breakpoint is governed by Step, not by Colour's initial change.

## Chapter 3: State

**1. Two startup policies.**

| Score declaration | Initial `Changed0` | Frame-one renders | Initial digits |
|---|---:|---|---|
| `state Score : word` | `%00000001` | `DrawBeacon` | blank |
| `state Score : word changed` | `%00000101` | `DrawBeacon`, `ShowScore` | `000000` |

**2. Facts, bits, and masks.**

| Fact | Bit | Mask |
|---|---:|---:|
| DotX | 0 | `%00000001` |
| Colour | 1 | `%00000010` |
| Score | 2 | `%00000100` |
| Left | 3 | `%00001000` |
| Right | 4 | `%00010000` |
| Step | 5 | `%00100000` |

`DrawBeacon` uses `%00000011`, the sum of DotX and Colour.
`ShowScore` uses `%00000100`.

**3. A different opening state.** The declarations are `DotX : byte = 1
changed`, `Colour : byte = 4`, and `Score : word = 10 changed`. Frame one
should show a blue pixel at `(1,3)` and `000010` on the seven-segment
display.

**4. An incomplete render dependency.** GO still runs `NextColour`, so
Colour changes in memory and Score increments. `ShowScore` runs because it
depends on Score. `DrawBeacon` has no Colour bit in its mask and DotX did not
change, so the old pixel colour remains in the framebuffer. Restoring
`on DotX, Colour` repairs the redraw.

## Chapter 4: Pulses and Bindings

**1. Rising and held timelines.** The rising binding fires on frames 0 and
20. The held binding fires on the initial press at frame 0, then on frames 8
and 16. Release disarms it on frame 18; the fresh press at frame 20 fires
immediately and starts a new repeat interval.

**2. Polling paths.**

| Input case | Flags from `_scanKeys` | Path and result |
|---|---|---|
| No key | Z clear | The key-down branch is skipped; `Glim_HeldKey` becomes `$FF`; no pulse fires |
| New press | Z set, C set | `_newpress` fires the matching pulse, records the key, and loads its repeat count when held mode applies |
| Same held key before expiry | Z set, C clear | The key matches `Glim_HeldKey`; the count decrements; no pulse fires until it reaches zero |

**3. Stepwise vertical movement.** Holding KEY_2 produces one upward move
because `rising` fires only on the new press. A release followed by another
press produces the second step. Holding KEY_6 continues to move right on its
eight-frame repeat because that binding remains `held period 8`.

**4. An autorepeating Home key.** Home fires on the initial GO press and
again eight held frames later. Both runs store 3 in DotX and DotY and raise
their flags, so the same centre pixel is redrawn. The action represents one
recall rather than continuous movement, which is why
`bind key KEY_GO rising -> Home` is the matching input policy.

## Chapter 5: Compute, Effect, Render

**1. A plus press across two frames.**

| Frame | Blocks and values | Renders |
|---|---|---|
| N | `Increase` runs after the compute phase and stores Count=1; BarLen remains 0; Count is deferred in `Next0` | Neither Count-dependent render runs |
| N+1 | `DeriveBar` sees Count and stores BarLen=0; its update reaches the later render phase | `ShowCount` writes 1 and `DrawBar` draws an empty bar |

**2. Raised now or deferred.** `DeriveBar` updates BarLen, whose only
consumer is the later render `DrawBar`, so its wrapper writes
`CHG_BARLEN` to `Raised0` for the same frame. `Increase` updates Count;
`DeriveBar`, an earlier compute consumer, has already run. The wrapper writes
`CHG_COUNT` to `Next0`, and both `DeriveBar` and `ShowCount` receive that
change at the start of the next frame.

**3. A coarser meter.**

| Count | BarLen with four shifts |
|---:|---:|
| 0 | 0 |
| 8 | 0 |
| 16 | 1 |
| 32 | 2 |
| 48 | 3 |
| 64 | 4 |

At 32 the matrix should show two green pixels; at 64 it should show four.

**4. A derivation wired to itself.** Count reaches 8 and `ShowCount` displays
it, but DeriveBar never receives Count's change. BarLen remains zero and the
bar remains empty. The report shows Count triggering ShowCount alone and
BarLen both raised by and triggering DeriveBar. Restoring `on Count` reconnects
the effect's output to the derivation.

## Chapter 6: The 8x8 Matrix Profile

**1. One yellow pixel in memory.** Row 2 begins at
`Framebuffer + 8`: red is +8, green +9, blue +10, and aux +11. x=5 maps to
`%00000100` (`$04`). Yellow sets that bit in the red and green bytes and
leaves the blue byte unchanged.

**2. Three scan-loop moments.**

| Row | HL offset at row start | C before `rlc c` | C afterward | Carry |
|---:|---:|---:|---:|---:|
| 0 | 0 | `%00000001` | `%00000010` | 0 |
| 1 | 4 | `%00000010` | `%00000100` | 0 |
| 7 | 28 | `%10000000` | `%00000001` | 1 |

Carry on row 7 ends the loop. The final `out (PortRow),a` writes zero, leaving
the matrix dark during game work.

**3. A faster orbit.** The edit is
`bind key KEY_GO held period 2 -> Step`. The lap is 28 positions × 2 frames,
or 56 frames. `Advance` still runs in the effect phase and `PlaceDot` in the
earlier compute phase, so the position change still reaches the dot on the
following frame.

**4. A trail instead of a dot.** Every call to `FbPlot` ORs another pixel
into the existing plane bytes. With no clear, old rim positions remain lit,
eventually outlining the complete route. Restoring `call FbClear` at the
start of `DrawDot` returns the display to one moving pixel.

## Chapter 7: Time

**1. Independent clocks.** With calls to `GlimTickTimers` numbered from 1,
BlinkTick fires on frames 5, 10, 15, and 20 before FallTick first fires on
frame 24. Their first common firing is frame 120, the least common multiple
of 5 and 24.

**2. Three kinds of schedule.**

| Schedule | Named cell | Pulse and completion | Write behaviour |
|---|---|---|---|
| Oscillator timer | Writable period; hidden cell is the countdown | Fires every time the hidden countdown reaches zero, then reloads | A new period affects the next reload |
| One-shot timer | Countdown itself | Fires once on reaching zero, then remains idle at zero | Writing a positive count arms one new firing |
| Ramp | Progress from 0 to `steps - 1` | Marks progress changed each step, fires on arrival, then remains at the terminal value | Writing a lower value starts progress again |

**3. Faster fall and blink.** The declarations use periods 12 and 4.
BlinkTick fires on 4, 8, 12, 16, 20, and 24; FallTick fires on 12 and 24.
Both pulses therefore fire together twice in the first 24 frames. The drop
should descend twice and Visible should toggle six times.

**4. A ramp that never restarts.** Heat reaches 249 and fires HeatUp once.
`Quicken` runs once and changes Fall from 24 to 20. With no store of zero to
Heat, the ramp remains idle at 249, so no later HeatUp pulse or difficulty
change occurs.

## Chapter 8: Motion Curves

**1. Reading the Glide table.**

| Travel | CometX |
|---:|---:|
| 0 | 0 |
| 9 | 2 |
| 31 | 4 |
| 45 | 6 |
| 63 | 6 |

The repeated 6 values at the end show the longest dwell near the landing,
which is the slow end of an ease-out curve.

**2. Page-aligned indexing.** Loading the curve gives H=`$43`, L=`$00`, and
HL=`$4300`. Loading Travel puts `$2A` in A; `ld l,a` then gives L=`$2A`
and HL=`$432A`, the address read next. Page alignment fixes every base low
byte at zero, and a curve has at most 256 entries, so the byte index may
replace L without crossing the table's page.

**3. A different launch shape.** The ease-out build moves fastest near
column 0 and dwells longest near the destination. The ease-in build dwells
near column 0 and moves fastest near the destination. Both begin at 0, end
at 6, and consume 64 ramp steps.

**4. Lost overshoot headroom.** Values above 7 clamp to 7, so a curve whose
destination is already column 7 cannot display a peak beyond its endpoint.
The top of the curve becomes a run of 7s rather than a visible excursion and
return. The chapter uses `from 0 to 6`, leaving column 7 available for the
overshoot.

## Chapter 9: Shapes, Sound and Displays on the Board

**1. A shape as bytes.** The header is width 3, height 4, colour
`COLOR_RED` (1). The row masks are `%01000000`, `%11100000`,
`%01000000`, and `%01000000` (`$40`, `$E0`, `$40`, `$40`).

**2. A corner collision.** Both velocity bytes are negated, so both axes
reverse. Score increments twice. `Snd_Bounce` is called twice; the second
call replaces and restarts the same cue, leaving one active cue at its
beginning.

**3. A startup cue.** The sound declaration generates `Snd_Start`, and
`call Snd_Start` belongs in `Greet` beside `lcd_row`. Banner's initial change
runs the block once. The LCD should show FANFARE, the cue should sound over
the following scan ticks, and the timer-driven spark should continue moving.

**4. A cue started on every tick.** A call at the end of `Move` starts or
restarts the cue on every Step tick, including open-board movement. The sound
therefore follows the six-frame movement clock rather than wall contact. The
calls belong in `_hitx` and `_hity`, where the collision branches also
reverse velocity and increment Score.

## Chapter 10: Arrays and Layout Types

**1. Layout measurements.** `Point.x` is at offset 0, `Point.y` at 1, and
`sizeof(Point)` is 2. In Sprite, `pos` is at 0, `speed` at 2, `score` at 3,
`frames` at 5, and `tile` at 9; `sizeof(Sprite)` is 11. Canvas reserves ten
state bytes but uses two change flags: one for Cursor and one for Picture.

**2. Painting one bit.** x=2 gives `%00100000` (`$20`) from `MxMask`.
y=5 makes HL equal `Picture + 5`. ORing `$20` with the existing `$80`
stores `$A0` back into row 5.

**3. A blue canvas.** `Framebuffer + 2` is the blue plane of row 0. The
eight row masks should therefore appear blue, while the cursor remains white
because `FbPlot` still receives `COLOR_WHITE`.

**4. The wrong framebuffer stride.**

| Offset | Destination |
|---:|---|
| 1 | Row 0 green |
| 4 | Row 1 red |
| 7 | Row 1 aux |
| 10 | Row 2 blue |

The row masks alternate among colour and auxiliary bytes instead of reaching
the green byte of each row. Four increments are required because each
framebuffer row occupies four bytes.

## Chapter 11: Dependency Reports and Debugging

**1. A stuck counter trace.** KEY_GO raises Paint; Paint triggers
`PaintPixel`; the body increments Marks. The broken report then says
`Marks` is raised by `(nothing)`, so the chain stops before `ShowMarks`.
Memory changes because the store executes. The display stays fixed because
the missing declaration leaves `CHG_MARKS` clear.

**2. Registers across `FbPlot`.**

| Register | After `FbPlot` |
|---|---|
| A | May be clobbered |
| B | May be clobbered |
| C | Preserved |
| DE | May be clobbered |
| HL | May be clobbered |

The second plot may keep C as y. It must reload x from Cursor and construct a
new B because the first call may have changed B.

**3. A bounded two-pixel cursor.** After the first plot, the code should
reload Cursor.x, compare it with 7, and skip the second plot at the right
edge. Otherwise it increments x, copies the result to B, reloads white in A,
and calls `FbPlot` with the preserved C. At x=6 the cursor occupies columns 6
and 7; at x=7 it occupies column 7 only. The build should report no register
contract error.

**4. An indirect write with no declaration.** The report shows Picture with
`raised by: (nothing)` and `triggers: DrawCanvas (render)`. The pointer store
still changes the selected Picture byte, but no flag schedules `DrawCanvas`,
so the matrix retains its previous framebuffer. Restoring
`updates Picture` repairs the declared connection.

## Chapter 12: Routines, Parts and Imports

**1. Three source boundaries.**

| Element | File | Reason |
|---|---|---|
| Program, platform, display | Entry file | Defines identity and hardware |
| Shared state and bindings | Entry file | Keeps the program-wide model together |
| Reactive blocks | `.glim` part | Groups rules and renders by topic |
| Cursor-address arithmetic | Glimmer `routine` in the entry file | Shares block-level Z80 inside the program |
| Framebuffer copy and bit count | Imported `.asm` module | Provides hand-written assembly behind an exported API |

**2. `CursorSpot` at one coordinate.** x=3 gives B=`%00010000`
(`$10`). y=6 gives HL=`Paint + 6`. B and HL are the inferred outputs; C
passes through unchanged. A, DE, and the affected flags may be clobbered.

**3. Clearing the painting through the module.** A complete solution has a
`Clear` pulse bound to KEY_MINUS, an exported routine that zeroes exactly
eight bytes from Paint, and an effect in the part with `on Clear`,
`updates Paint`, and `call ClearPaint`. After the call, `ShowPaint` receives
eight zero row masks and `CountLit` returns zero, so both displays clear. The
module's contract should declare every register and flag used by its loop.

**4. A missing export marker.** A plain `CountLit` label is private to
`paint-lib.asm`, while the caller is in another source module. The assembler
therefore reports that the symbol is private and suggests exporting it. The
repair is `@CountLit`; calls continue to use the name without `@`.

## Chapter 13: Cards

**1. Starting a round frame by frame.**

| Frame | Pulses and card state | Result |
|---|---|---|
| Before GO | No pulses; CurrentCard and GlimActiveCard are Splash | Splash blocks are eligible |
| GO frame | HitP and AnyKeyP fire; GlimActiveCard remains Splash; `StartGame` stores Playing in CurrentCard | Playing blocks stay gated; ScorePoint does not run; pulses clear at frame end |
| Next frame | CurrentCard and the newly latched GlimActiveCard are Playing | `StartRound` enters, sets Score=0, arms PlayClock, and the Playing blocks become eligible |

**2. Re-raising the final score.** The last score change is consumed during
Playing and its flag clears at that frame's end. The transition reaches
GameOver on a later frame, so that old flag is unavailable to `FinalBar`.
`enter ShowFinal` lists `updates Score`, and its wrapper places
`CHG_SCORE` in `Raised0`. The merge before the render phase delivers the
fresh flag to `FinalBar` on the first GameOver frame.

**3. GO as the only start key.** With `StartGame` listening to HitP, GO
starts the round. A hex key or AD still fires AnyKeyP, but Splash has no
active block that consumes it, so the prompt remains. GO's press-frame HitP
does not score because Playing becomes active on the next frame, where
`StartRound` sets Score to zero.

**4. A blank result screen.** Score still contains the correct final value,
and the seven-segment display retains the digits written during Playing.
`FinalBar` receives no GameOver-frame Score change, so the framebuffer stays
as prepared by the card transition and the result bar is absent. Restoring
`Score` to `ShowFinal`'s `updates` list re-raises the fact for the render.
