---
layout: default
title: "Introduction"
parent: "Glimmer Book 1 — Reactive Programming for Z80 Games"
nav_order: 0
---

# Introduction

This book teaches Glimmer, a reactive language for Z80 games. You describe
a game as its state, its inputs and the rules that react to them, writing
the behaviour itself in small blocks of assembly; the compiler generates
the frame loop, input polling, change tracking and display support around
your declarations. We build the model one construct at a time, and by the
final chapters the pieces combine into Canvas, a complete interactive
program with structured state, multiple source files and cards.

## The language

A Z80 game written by hand spends most of its code on plumbing: the loop
that runs every frame, the polling that notices a keypress, the
bookkeeping that knows which parts of the display changed. Glimmer moves
that plumbing into the compiler. Your source declares facts and the rules
that respond when they change, and each rule's body is a short piece of
assembly doing exactly one job. The generated program is readable AZM
source — the plumbing is code you can open, not a runtime you must trust.

This book teaches Glimmer 0.6, and every complete program in it is built
with `glimmer build`, so each chapter's result runs.

## The intended reader

We assume you can read simple Z80 assembly — loads, jumps, comparisons —
because rule bodies are written in it. [AZM Book 2](../../azm-book/book2/)
teaches those fundamentals from nothing if you need them first. No
experience with reactive programming is assumed; the model is taught here
from its first construct, and readers who know reactive frameworks from
larger platforms will find the ideas familiar and the costs far more
visible.

## The book's method

Each chapter adds one construct and builds something with it. We begin
with the shape of a game and a first light on the display, then take
state, pulses and bindings, and the compute–effect–render cycle in turn.
The middle chapters add the 8x8 matrix profile, time, motion curves,
shapes and sound; the later ones bring arrays and layout types, the
dependency reports that make a reactive program debuggable, routines and
imports for larger sources, and finally cards. Exercises appear
throughout, with notes at the end.

When the model is complete, [Glimmer Book 2](../book2/) applies it to
three full games — Skyfall, Tetro and Rushlight — across two display
systems. The [reference appendices](../appendices/) hold the declaration
tables, display profiles and build commands for lookup.

The first chapter draws the shape all these games share.
