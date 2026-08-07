---
layout: default
title: "Lanternfly White Papers"
nav_order: 3
has_children: true
has_toc: false
sidebar_link: "White papers overview"
---

# Lanternfly White Papers

> **These papers are superseded.** They proposed the task and reactive
> layer; the design was decided and folded into the specification, with
> substantial changes along the way. They are kept as a record of the
> argument. The specification is authoritative.

This collection preserves four architecture papers from the Lanternfly design
work. Each paper is complete on one page and records its design argument,
worked examples, and stated limits.

1. [Cooperative Tasks for Lanternfly](cooperative-tasks.md) — a
   proposal for cooperative tasks built from explicit record-and-step state
   machines. It examines static instances, hypothetical `task`, `yield`, and
   `wait on` syntax, scheduler timing, loop discipline, and worked lowerings.
2. [Task-first Lanternfly](task-first.md) — a proposal to treat declared task
   instances as the program's primary shape and generate their scheduler. Its
   worked programs cover timed coordination and chunked background work.
3. [Static Frames for Lanternfly](static-frames.md) — the case for fixed-address
   routine storage on the Z80, including call-graph overlays, save-around-call
   recursion, aggregate-local lifetimes, the interrupt firewall, and measured
   instruction costs.
4. [Reactive Lanternfly](reactive.md) — a proposed reactive layer of facts,
   moments, derivations, effects, renders, and tasks. It defines instant and
   delivery semantics, sketches the grammar and lowering, and traces two
   example programs.
