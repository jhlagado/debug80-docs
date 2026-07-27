---
layout: default
title: "Exercise Notes"
parent: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 99
---

# Exercise Notes

## Chapter 1: The Shape of a Game

The runtime scans the cleared framebuffer before it runs the reactive blocks,
so the first scan is blank. `DrawDot` then plots (3,3). Its change bit clears
at frame end, but the framebuffer keeps the pixel, so the second scan displays
the dot without another call to `DrawDot`.

## Chapter 2: First Light

The seven presses advance through green, yellow, blue, magenta, cyan and white,
then wrap to red with `Colour = 1`. The eighth press advances to green with
`Colour = 2`.

## Chapter 3: State

`DotX` begins with its change bit set, so `DrawBeacon` runs at startup.
`Score` begins with its bit clear, so `ShowScore` waits for the first score
change. Declaring `state Score : word changed` makes the initial zero render as
`000000`.

## Chapter 4: Pulses and Bindings

A `rising` binding moves once when the key first goes down; holding it produces
no further pulses until the key is released and pressed again. A
`held period 8` binding fires immediately and then repeats, which suits
continuous movement. Home represents one action per press, so `rising` avoids
repeating the reset while the key remains down.

## Chapter 5: Compute, Effect, Render

On frame N, `Increase` stores 1 in Count. Because Count also feeds the compute
phase, which has already run, Glimmer defers that change as one unit. On frame
N+1, `DeriveBar` stores 0 in BarLen, then the render phase writes the new digit
and redraws the bar. The visible count and its derived bar therefore remain
together.

## Chapter 6: The 8x8 Matrix Profile

Row 2 begins eight bytes after `Framebuffer` because each row occupies four
bytes. At x=5 the mask is `%00000100` (`$04`). Yellow uses red and green, so
the mask is ORed into row 2's red byte at offset 8 and green byte at offset 9.
The blue byte at offset 10 remains unchanged.

## Chapter 7: Time

`Blink` first fires on frame 5 and `Fall` on frame 24. Their first shared
expiry is the least common multiple of 5 and 24, frame 120.

## Chapter 8: Motion Curves

Entry 31 of `Curve_Glide` is 4, so `CometX` becomes 4. The values repeat for
longer runs toward the destination, which means the position changes less
often and the comet slows as it arrives.

## Chapter 9: Shapes, Sound and Displays on the Board

The four rows are `$40`, `$E0`, `$40` and `$40`:

```text
.X.  -> 01000000
XXX  -> 11100000
.X.  -> 01000000
.X.  -> 01000000
```

## Chapter 10: Arrays and Layout Types

`Picture` reserves eight bytes and uses one change bit. The flag belongs to
the array as a whole, so a write to any row raises the same Picture change and
`DrawCanvas` rebuilds all eight rows.

## Chapter 11: Dependency Reports and Debugging

The store changes the Marks byte, but the missing `updates Marks` declaration
leaves its change bit clear. `ShowMarks` therefore receives no trigger. The
repair is:

```text
effect PaintPixel
    on Paint
    updates Picture, Marks
```

## Chapter 12: Routines, Parts and Imports

A `part` contributes Glimmer declarations to the same program and namespace,
which suits reactive blocks that use its facts and pulses. An `import` brings
in a hand-written AZM module with an explicit register interface. The `@`
prefix exports an assembly label so code outside that module can call it.

## Chapter 13: Cards

The GO press occurs while Splash is still the active card. It raises both
`AnyKeyP` and `HitP`, but Playing's `ScorePoint` block is gated off.
`CurrentCard` changes for the following frame, after both pulses have cleared,
so the new round begins at zero.
