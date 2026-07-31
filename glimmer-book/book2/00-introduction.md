---
layout: default
title: "Introduction"
parent: "Glimmer Book 2 — Building Complete Z80 Games"
nav_order: 0
---

# Introduction

This book puts the Glimmer model to work on complete games. In
[Book 1](../book1/) the constructs arrived one at a time; here they earn
their keep together, under the pressures a real game brings — size,
timing, and the particular demands of real display hardware.

## The games

Three games carry the book. Skyfall we build from first declaration to
playable matrix game, watching each decision as it is made. Tetro we
read rather than build: a larger, finished codebase that shows how the
same ideas hold up at scale. Rushlight carries the model to different
hardware entirely — the TMS9918 video display processor — and the final
chapter weighs what changed and what held when one language drove two
displays.

## The intended reader

Book 1's material is assumed working knowledge here: facts, moments,
rules, phases, timers, resources, parts and cards, along with the
ability to read Z80 assembly. If a chapter's declarations feel foreign,
the corresponding Book 1 chapter is the remedy, and the
[reference appendices](../appendices/) keep the exact rules at hand.

## The book's method

Building and reading are different skills, and the book exercises both.
Skyfall's chapter proceeds decision by decision, the way you will work
on your own games. Tetro's chapter teaches code reading: finding your
way in declarations you did not write, guided by the structure Glimmer
imposes. The TMS9918 chapters show a port in practice — which parts of
a game are the display's and which are the game's own. Exercises
continue throughout, with notes at the end.

The first chapter opens with Skyfall's empty sky.
