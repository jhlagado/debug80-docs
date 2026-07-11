# Glimmer Book: Working Outline

Internal planning document. Reader-facing pages live under
`glimmer-book/book0/`. This file records the book's teaching purpose, chapter
sequence, example strategy and drafting rules.

## Book Identity

- **Title:** Glimmer Book: Reactive Games for the Z80.
- **Publication path:** `glimmer-book/book0/`, matching the existing book
  shape used by the AZM and Debug80 books.
- **Role:** the first guided Glimmer course. The book takes a reader who can
  read small Z80 routines and teaches how to write complete Glimmer games.
- **Language version:** Glimmer 0.5.2, the current local package version. The
  book teaches current syntax: state, pulses, bindings, timers,
  ramps, curves, resources, layout types, routines, parts, imports, cards,
  matrix profile, TMS9918 profile and Debug80 source stepping.
- **Development path:** Debug80 first. Every chapter program builds with
  `glimmer build`, runs under Debug80 and lets the reader step through `.glim`
  block bodies plus generated AZM.
- **Examples:** book examples should be smaller than the repository examples.
  The repo examples are reference material and chapter end-points:
  `counter.glim`, `dot.glim`, `slide.glim`, `trail.glim`, `snake.glim`,
  `tetro.glim` and `sprite-chase.glim`.
- **Verification:** every complete listing in a chapter comes from a checked
  source file. Run `glimmer build` before pasting code into the book.

## Writing Standard

Use the course-writing skill for every chapter draft and review pass.

Rules that matter most for this book:

- State what Glimmer is and what it does.
- Positioning (John, 2026-07-11): Glimmer is a front layer on the assembler,
  the way early C++ began as a front layer on C. The language inside blocks
  is Z80 itself; the reader stays close to the machine the whole way, and
  the generated assembly file is always there to read. Set this stage once,
  at a high level, in chapter 1's introduction; keep the mechanism detail
  ("preprocessor", passes, artifacts) out of the early prose. The C++
  parallel is for the authors; the chapters say it plainly instead.
- Glimmer is the reader's first and only view of game programming. Start each
  concept at hello-world scale in Glimmer and build upward from the reactive
  side. Hand-written game loops never appear as a foil; the ease of the
  Glimmer way shows through the examples themselves as they grow harder.
- Show the generated AZM once the reader has built and run a program, as a
  payoff ("here is the normal assembly program your declarations became"),
  starting in chapter 2.
- Put the problem before the construct.
- Show code before detailed explanation.
- Keep one new idea per paragraph.
- Use "you" for the learner.
- Keep generated AZM visible when it teaches the mechanism.
- Avoid product rhetoric, clever compression, sales language and empty
  abstractions.
- Avoid vague moral vocabulary in Glimmer prose. It adds tone without
  explaining the mechanism.
- Treat every negative sentence as a draft smell. Keep a contrast only when it
  teaches a concrete operational distinction.

## Reader Model

The reader can read Z80 mnemonics, registers, flags, branches and memory
access. They can follow a short routine with labels and conditions.

The book teaches these ideas in place:

- how a game frame works
- what game state is
- what input events are
- how a reactive dependency graph runs
- how Debug80 builds and runs a TEC-1G program
- the AZM features Glimmer relies on: `@` routines, register contracts, layout
  types, `.import` modules and `op` definitions

The reader finishes the book able to start a Glimmer program, choose the right
state and pulse declarations, place logic in the right phase, structure a game
with cards and understand how the selected display profile shapes the runtime.

## Pedagogical Arc

The course has four movements.

### 1. Frame And Model

Chapters 1 through 5 teach the core mental model. A game frame reads input,
advances rules and updates output. Glimmer lets you declare the cells and
dependencies, then write the behaviour in small Z80 blocks. The reader learns
state, pulses, bindings, change flags and the compute/effect/render phases.

Exit test: the reader can look at `on` and `updates` lines and trace why a
block runs.

### 2. Matrix Instruments

Chapters 6 through 11 add the practical instruments for the TEC-1G matrix:
profile selection, framebuffer drawing, timers, ramps, curves, shapes, sounds,
HUD, text, arrays and layouts. Each construct arrives because the previous
program needs a new capability.

Exit test: the reader can build a small matrix program with autonomous motion,
visible feedback and structured state.

### 3. Program Structure And Game Modes

Chapters 12 through 14 teach scale: routines, parts, imports, dependency
reports and cards. This is where a program becomes a game with title, play,
pause and game-over modes.

Exit test: the reader can split a Glimmer game across files, call helper
routines, read `--deps` and use cards for screens and modes.

### 4. Two Complete Games, Two Displays

Chapters 15 through 18 spend the language on complete games. The matrix game
teaches board-shaped thinking. The TMS9918 chapters teach a written-to display:
sprites, tiles, VRAM shadows and the commit phase. The final chapter compares
the two display architectures through concrete game code.

Exit test: the reader can describe which parts of a game belong to the
reactive core and which parts belong to the selected profile.

## Chapter Contract

Each chapter should record:

- **Opens with:** the practical problem that creates the need.
- **Introduces:** the constructs taught in order.
- **Builds:** the running program for the chapter.
- **Generated AZM focus:** the generated section worth reading.
- **Exit knowledge:** what the reader can now do.

## Chapters

### 00 - Preface

- **Opens with:** you can write a Z80 game as a set of facts, events and rules.
- **Introduces:** what the course builds, what the reader needs, how Debug80,
  AZM and Glimmer fit together, and the Glimmer 0.5.2 target.
- **Builds:** no program.
- **Generated AZM focus:** none.
- **Exit knowledge:** the reader knows the route through the book and the two
  final displays: the TEC-1G matrix and the TMS9918 VDP.

### 01 - The Shape Of A Game

- **Opens with:** a game described as facts, moments, rules and pictures,
  then the smallest complete Glimmer program: one lit pixel on the matrix.
- **Introduces:** `program`, `platform`, `display`, `state`, `changed`,
  `render`, `on`, the frame; then `pulse`, `bind` (rising and held),
  `effect`, `updates`; the reactive chain: something changed, the dependent
  block runs, the output updates. Spreadsheet as the one touchstone.
- **Builds:** `mover.glim` in three read-along steps: a dot appears (state +
  render), the dot responds (pulse + bind + effect), the dot steers (held
  bindings, both directions). All three verified with `glimmer build`.
- **Generated AZM focus:** three excerpts from the generated file close the
  chapter (state storage + Changed0, the runtime loop, one wrapped block
  with its verbatim body), demonstrating that Glimmer's output is ordinary
  Z80 assembly. Excerpts are from Glimmer 0.5.2 output (AZM 0.3 syntax:
  `.routine`, Glim-prefixed runtime symbols). The full guided tour of the
  file stays in chapter 2.
- **Exit knowledge:** the reader can read a small `.glim` file aloud,
  predict which blocks run on which frames, and say what Glimmer owns (the
  loop) and what they own (the behaviour).

### 02 - First Light

- **Opens with:** put a single changing fact on the TEC-1G matrix.
- **Introduces:** installation, `glimmer build`, generated artifacts, Debug80
  native `.glim` targets, `.glim` source stepping and the generated `.main.asm`.
- **Builds:** *Beacon*: one matrix pixel, one colour cell, one GO pulse, one
  effect and one render.
- **Generated AZM focus:** source order: equates, change flags, state storage,
  loop, polling, dispatch, wrapped blocks and profile library.
- **Exit knowledge:** the reader can build, run and step through a Glimmer
  program.

### 03 - State

- **Opens with:** Beacon needs more facts: position, colour and score.
- **Introduces:** `state`, `byte`, `word`, initial values, `changed`, storage,
  `ChangedN` banks and `CHG_*` masks.
- **Builds:** *Beacon* expanded with position and score display.
- **Generated AZM focus:** state storage and the dispatch mask for one render.
- **Exit knowledge:** the reader can declare state and predict which renders
  run on the first frame and later frames.

### 04 - Pulses And Bindings

- **Opens with:** a keypress is a moment; position is a fact that persists.
- **Introduces:** `pulse`, rising bindings, held bindings, `bind key any`,
  pulse cleanup and MON-3 key names.
- **Builds:** *Rover*: a dot moved with 2/4/6/8, held autorepeat and GO as a
  separate action.
- **Generated AZM focus:** `GlimPollBindings`, held-key repeat state and pulse
  clearing in `GlimEndFrame`.
- **Exit knowledge:** the reader can choose rising, held and any-key bindings
  for game controls.

### 05 - Compute, Effect, Render

- **Opens with:** Rover mixes derived facts, game rules and drawing.
- **Introduces:** block kinds, phase order, `on`, `updates`, exactly-once
  delivery, same-frame raises, next-frame rollover and `glimmer --deps`.
- **Builds:** *Meter*: key input changes a count, compute derives a bar length,
  render draws the bar.
- **Generated AZM focus:** phase dispatchers, `RaisedN`, `NextN` and the
  wrapper code after a block body.
- **Exit knowledge:** the reader can place code in the right phase and trace a
  program from declarations.

### 06 - The Matrix Profile

- **Opens with:** the matrix stays visible because the CPU scans rows.
- **Introduces:** `platform tec1g-mon3`, `display matrix8x8`, scan-shaped loop,
  fixed row dwell, blank-window game work, framebuffer layout, `FbClear`,
  `FbPlot`, `MxMask` and colour constants.
- **Builds:** *Compass*: a dot orbiting the edge with quadrant colour.
- **Generated AZM focus:** `ScanFrame`, `Framebuffer` and the profile library.
- **Exit knowledge:** the reader can draw matrix state and understand the
  profile loop that supports it.

### 07 - Time

- **Opens with:** games move when the player waits.
- **Introduces:** `FrameCount`, oscillator timers, writable periods, one-shot
  timers and ramps.
- **Builds:** *Drip*: a falling drop, a blink, an arrival pulse and a speed
  change.
- **Generated AZM focus:** `GlimTickTimers`, hidden countdowns and ramp raises.
- **Exit knowledge:** the reader can make a Glimmer program act on its own
  schedule.

### 08 - Motion Curves

- **Opens with:** equal steps show position; shaped steps show motion.
- **Introduces:** `curve`, build-time byte tables, presets, `from`/`to` and the
  ramp-drives-curve pattern.
- **Builds:** *Comet*: an eased slide across the matrix with preset switching.
- **Generated AZM focus:** `Curve_<Name>` tables and ordinary Z80 indexing.
- **Exit knowledge:** the reader can convert a ramp value into smooth movement.

### 09 - Shapes, Sound And Displays On The Board

- **Opens with:** a game needs a visible character, event feedback and a score.
- **Introduces:** matrix `shape`, `ShapeDraw`, `sound`, `Snd_<Name>`,
  `HudWriteU16`, `text` and `lcd_row`.
- **Builds:** *Fanfare*: a small shape bounces, scores on wall hits, plays cues
  and writes an LCD message.
- **Generated AZM focus:** shape tables, sound wrappers, LCD text and emitted
  AZM `op` definitions.
- **Exit knowledge:** the reader can declare small resources and call the
  generated routines or ops from block bodies.

### 10 - Arrays And Layout Types

- **Opens with:** one dot is one cell; a board is many related bytes.
- **Introduces:** `state Name : byte[N]`, one change flag for an array, Z80
  indexing, `type`, nested layouts, typed state, `sizeof`, `offset` and layout
  casts.
- **Builds:** *Canvas*: cursor position in a `Point` layout and an 8-row paint
  buffer in byte-array state.
- **Generated AZM focus:** `.type` records, typed `.ds` storage and array
  storage.
- **Exit knowledge:** the reader can model boards, records and groups of game
  data.

### 11 - Dependency Reports And Debugging

- **Opens with:** a larger program needs a readable map of cause and effect.
- **Introduces:** `glimmer --deps`, warnings for missing `updates`, generated
  register contracts, AZM diagnostics mapped to `.glim` lines and stepping
  from `.glim` into generated AZM.
- **Builds:** *Canvas* with one deliberate update-warning exercise, then the
  corrected program.
- **Generated AZM focus:** `.routine` boundaries around `Glim_*` blocks,
  `.contracts` policy and mapped body lines.
- **Exit knowledge:** the reader can use the toolchain to check the reactive
  graph and debug a block.

### 12 - Routines, Parts And Imports

- **Opens with:** Canvas now has repeated address arithmetic and a long file.
- **Introduces:** `routine`, callable helper blocks, `part`, shared namespace,
  file-tagged diagnostics, `import`, public `@` labels and private module
  labels.
- **Builds:** *Canvas* split into files, with a drawing routine and an imported
  AZM helper.
- **Generated AZM focus:** routine emission, part attribution and `.import`
  placement.
- **Exit knowledge:** the reader can structure a growing Glimmer program.

### 13 - Cards

- **Opens with:** a game has a title screen, a playing screen and a game-over
  screen.
- **Introduces:** `card`, `CurrentCard`, generated `Card` enum, card-gated
  dispatch, `enter`, `goto`, conditional navigation and the entry re-raise
  pattern.
- **Builds:** *Gate*: Splash, Playing and GameOver cards with any-key start,
  countdown play and delayed restart.
- **Generated AZM focus:** `GlimActiveCard`, `GlimPrevCard`, card gates and
  enter dispatch.
- **Exit knowledge:** the reader can express game modes as sections.

### 14 - A Small Matrix Game

- **Opens with:** spend the matrix tools on a complete board-shaped game.
- **Introduces:** design from state, pulses, timers, resources and cards before
  writing blocks; scoring and pacing as ordinary state changes.
- **Builds:** *Skyfall* or a similar catch game: falling blocks, paddle,
  score, misses, sound, LCD messages and cards.
- **Generated AZM focus:** full dependency report and the sections that come
  from declarations.
- **Exit knowledge:** the reader has built one complete Glimmer game.

### 15 - Reading Tetro

- **Opens with:** Tetro is the matrix profile under real game pressure.
- **Introduces:** multi-rotation shapes, generated piece tables, board planes,
  line-clear flash, preview text, conditional navigation and imported engine
  routines.
- **Builds:** no new program; reads `examples/tetro.glim`,
  `examples/tetro-rules.glim` and `examples/tetro-lib.asm`.
- **Generated AZM focus:** `ShapeRot*` tables, `Snd_*`, `lcd_row` and card
  sections.
- **Exit knowledge:** the reader can study a larger Glimmer matrix game and
  separate declarations, block bodies and imported engine code.

### 16 - The TMS9918 Profile

- **Opens with:** the VDP keeps drawing from VRAM while the CPU describes the
  scene.
- **Introduces:** `display tms9918`, vblank pacing, commit phase, name-table
  shadow, sprite-attribute shadow, `NamePut`, `SpriteSet`, `SpriteInit`,
  `sprite`, `tile`, `sprite_at`, `tile_at` and VDP colours.
- **Builds:** *Grove*: one sprite moving over a small tiled scene.
- **Generated AZM focus:** `GlimCommit`, dirty rows, `LoadResourcesVram` and VDP
  helper routines.
- **Exit knowledge:** the reader can draw with sprites and tiles on the VDP
  profile.

### 17 - A VDP Game

- **Opens with:** the TMS9918 supports a larger scene than the matrix.
- **Introduces:** sprite-position collision, tile-grid scoring, vblank-friendly
  rendering and cards on the VDP profile.
- **Builds:** *Lanternfly* or a compact chase-and-collect game, then reads
  `examples/sprite-chase.glim`.
- **Generated AZM focus:** sprite ops, tile ops and commit behaviour during
  motion.
- **Exit knowledge:** the reader has built a complete Glimmer game on the
  TMS9918 profile.

### 18 - Two Displays, One Language

- **Opens with:** compare the matrix game and the VDP game as programs.
- **Introduces:** matrix as scan-shaped board work, VDP as scene description
  and commit work, profile-owned loops, profile-owned resources and the
  stable reactive core shared by both.
- **Builds:** no new program.
- **Generated AZM focus:** side-by-side loop skeletons and render targets.
- **Exit knowledge:** the reader can choose a display architecture for a game
  idea and predict how it changes rendering, collision and timing.

## Appendices

- **Appendix A - Declaration Reference:** grammar lines, one example and key
  constraints for each declaration.
- **Appendix B - Matrix Profile:** loop shape, framebuffer layout, colours,
  MON-3 keys, sound service, HUD service, LCD slice and matrix resources.
- **Appendix C - TMS9918 Profile:** VRAM layout, commit phase, shadow tables,
  colours, sprite and tile resources, generated ops and profile routines.
- **Appendix D - Build And Debug:** CLI, artifacts, Debug80 native `.glim`
  targets, source mapping, generated AZM tour and common diagnostics.
- **Appendix E - AZM Touchpoints:** `.routine` boundaries, register contracts,
  owner-local labels, layout types, `.import` modules and `op` definitions used
  by Glimmer.

## Improvements Suggested By The Glimmer Repo Review

1. Teach `glimmer build` and Debug80 `.glim` stepping in Chapter 2. The repo's
   `debug80.json` now has native Glimmer targets, so this is part of the normal
   workflow.
2. Add a dedicated debugging chapter before program structure. The dependency
   report, update warnings, generated contracts and source mapping are central
   to learning Glimmer with confidence.
3. Split resource teaching into matrix board resources and VDP scene resources.
   Matrix shapes/sound/HUD/LCD solve different problems from VDP sprites/tiles.
4. Use Tetro as a reading chapter after the first complete matrix game. It is
   too dense as the first game the reader writes, but it is ideal as a guided
   tour of real Glimmer pressure.
5. Keep the hand-written corpus as teacher background. The book can mention the
   corpus when it explains why a feature exists, while chapter programs stay
   purpose-built and small.
6. Make "profile owns the loop" a recurring idea. The matrix profile scans rows
   before game work; the VDP profile waits for vblank and commits shadow
   changes. The same declarations feed both.
7. Add explicit "generated AZM focus" to every chapter. Glimmer's teaching
   strength is that the learner can open the generated file and see how a
   declaration became Z80 structure.

## Questions For John

1. Should the first complete matrix game be a new teaching game such as
   *Skyfall*, or should the course build a simplified Snake before reading
   Tetro?
2. Should the VDP game be a new teaching game, or should it build toward
   `sprite-chase.glim` directly?
3. Should the book teach installation through npm only, or also from a local
   checkout for readers following the repo?
4. Should the book include real hardware transfer as a short payoff chapter, or
   leave that entirely to Debug80 Book 1?

## Drafting Workflow

1. Read the course-writing skill before chapter prose.
2. Design and verify the chapter program first.
3. Build with `glimmer build` and keep the generated AZM available.
4. Draft from problem to program to one-concept sections.
5. Run the banned-pattern review pass.
6. Add the chapter link to `glimmer-book/book0/index.md`.

Frontmatter convention for chapters:

```yaml
---
layout: default
title: "Chapter Title"
parent: "Glimmer Book: Reactive Games for the Z80"
nav_order: 1
---
```

Chapter filenames use `NN-slug.md` and include previous/book/next links at the
top and bottom.
