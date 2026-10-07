---
title: "Basie Book Draft Status"
nav_exclude: true
search_exclude: true
---

# Basie Book Draft Status

The working manuscript contains an introduction and fifteen chapters.
Its source material was one Nucleus teaching book, which remains separate.
The Nucleus language and runtime reference editions were not copied.

On 2026-10-07 the prose of every chapter was rewritten and expanded for
voice and teaching flow. Chapter structure, filenames and example sources
were kept. Two examples were added: `FACTOR.BSI` (Chapter 13, iteration and
recursion) and `STACK.BSI` (Chapter 10, records owning records). Linked-only
examples (decisions, loops, arrays, routines, expressions, records and
aggregate results) are now shown inline in their chapters.

## Verified examples

At Basie revision `3228ce98d0c220cb15daa51188ef8cd867414633`, twenty-nine
complete examples compile with the reference compiler and execute as generated
Z80 in a minimal CP/M harness. Assertions check their calculations and storage
effects. Exact console transcripts check the readings analyser and command
utility. Five additional boundary examples verify bounds and narrowing traps,
rejection of a read-only write, rejection of an owner copy and rejection of a
local alias returned beyond its lifetime. The exercise outcomes quoted in the
prose (trap reasons, compile-time diagnostics and changed output) were checked
individually against the same compiler.

The runtime is assembled with ATOM from that checkout into debug80-docs's
ignored _internal directory. The example gate and its JSON report live in this
repository. No book files or verification build artifacts are written into the
Basie checkout.

## Work before a release edition

- Run the examples through the native compiler and the complete CP/M build
  workflow as the remaining native ownership support lands.
- Extend the ownership material with checked examples of optional allocation,
  identifier expiry, leases and linked structures. The current chapter explains
  those specified rules but its complete program exercises allocation, transfer,
  automatic freeing and reuse.
- Develop an interactive or file-driven application beyond the reproducible
  command-processing example, and add exercises with checked solutions.
- Verify a supported source-level debugger workflow before adding debugger
  instructions.
- Research historical priority and measure equivalent BASIC implementations
  before including a world-first or comparative-size claim.
- Obtain a separate technical and teaching review before publishing a release
  edition. Current revision has a writer's sequential review and prose checks.

These are release refinements and implementation-dependent extensions. The
current manuscript is a working draft with executable reference evidence.
