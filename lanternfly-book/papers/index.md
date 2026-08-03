---
layout: default
title: "Lanternfly White Papers"
nav_order: 3
has_children: true
has_toc: false
---

# Lanternfly White Papers

Standalone architecture papers for the Lanternfly language: proposals and
discussion documents, each complete on a single page.

1. [Cooperative Tasks for Lanternfly](cooperative-tasks.md) — an
   architecture proposal: cooperative multitasking from state-machine
   records legal in the language today, a static instance model, the
   deferred `task` type form with `yield` and `wait on`, and the
   scheduling, timing and loop doctrine — with worked examples
   throughout.
2. [Task-first Lanternfly](task-first.md) — an architecture direction
   built on the first paper: a program as a set of declared task
   instances, sequence as the local case, worked example programs, and
   the reactive (Glimmer-style) consequence of the inversion.
3. [Static Frames for Lanternfly](static-frames.md) — the storage-model
   justification: why locals and parameters live at fixed addresses on
   the Z80, the save-around-call lowering for recursion, the interrupt
   reentrancy boundary, and the industrial precedent.
4. [Reactive Lanternfly](reactive.md) — the synthesis: facts, moments,
   equations and effects over the task machine, with Glimmer's delivery
   semantics adopted and its wiring moved from trust to proof, a
   grammar examination, and two worked programs.
