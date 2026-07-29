---
layout: default
title: "Exercise Notes"
parent: "Glimmer Book 2 — Building Complete Z80 Games"
nav_order: 99
---

# Exercise Notes

## Chapter 1: Building Skyfall

Columns 3 and 5 are catches; 2 and 6 are misses. The calculation subtracts
`PadX` from `DropX` and accepts results below 3. A drop at column 2
underflows to 255, which the unsigned comparison rejects along with result 3
for column 6.

## Chapter 2: Reading Tetro

`ApplyGravity` copies the piece into the board and stores the full-row mask in
`ClearMask`. It moves the falling overlay away, starts `ClearHold`, and the
render shows the marked rows in white. Gravity pauses while the mask is set.
When the one-shot fires, `FinishClear` removes the rows, updates the totals,
clears the mask and spawns the next piece. A blocked spawn enters GameOver.

## Chapter 3: The TMS9918 Profile

During frame N, `MoveRight` stores 125 in state and `PlaceMoth` copies it to
the sprite shadow, setting `SpriteDirty`. VRAM still contains 124. The
`GlimCommit` at the start of frame N+1 copies the shadow to VRAM, and the VDP
then shows x=125.

## Chapter 4: Building Rushlight

The fly's centre is (128,96), and dividing each coordinate by eight gives grid
cell (16,12). If the lantern occupies that cell, `Gather` blanks the old tile,
increments Score, reduces Pace when it is above its floor, chooses a new
lantern cell and renders the replacement.

## Chapter 5: Two Displays, One Language

The cellular automaton fits `matrix8x8`: its world is an 8x8 set of cells that
can be redrawn together. The garden fits `tms9918`: its tile grid preserves
the scenery while sprites move independently at pixel coordinates. Persistence
and coordinate system determine the choice.
