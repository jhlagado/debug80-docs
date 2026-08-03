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
   records legal in the language today, a static instance model, a
   deferred `task`/`yield`/`await` syntax defined as a lowering onto the
   pattern, and the scheduling, timing and loop doctrine — with worked
   examples throughout.
2. [Task-first Lanternfly](task-first.md) — an architecture direction
   built on the first paper: a program as a set of declared task
   instances, sequence as the local case, worked example programs, and
   the reactive (Glimmer-style) consequence of the inversion.
3. [Static Frames for Lanternfly](static-frames.md) — the storage-model
   justification: why locals and parameters live at fixed addresses on
   the Z80, the save-around-call lowering for recursion, the interrupt
   reentrancy boundary, and the industrial precedent.
