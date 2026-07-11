---
layout: default
title: "Glimmer Books"
nav_order: 7
has_children: true
has_toc: false
nav_exclude: true
---
# Glimmer Books

Glimmer is a reactive framework for Z80 games: you declare a program's state,
inputs, and rules, write the behaviour in small blocks of real assembly, and
Glimmer generates the running program around them - the loop, the input
polling, the change tracking, and the display glue, all as readable AZM
source.

## Books

- [Glimmer Book - Reactive Games for the Z80](book0/) - the guided course.
  Starting from Z80 assembly alone, build up the whole Glimmer language,
  construct by construct, and finish with two complete games: one on the
  TEC-1G's 8x8 LED matrix, one on the TMS9918 video display processor.
