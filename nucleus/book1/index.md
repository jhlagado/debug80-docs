---
layout: default
title: "Programming Nucleus"
nav_order: 0
has_children: true
has_toc: false
isolated: true
---

<Mark class="book-plate" book="nucleus" size="52" />

# Programming Nucleus

Nucleus is a small statically typed language whose compiler emits Z80 machine
code directly. This book develops the language through complete programs,
following their effects and testing the rules at their boundaries.

The opening program introduces storage, routines and a command-line build.
Later chapters develop scalar values, decisions, loops, fixed arrays, bounded
strings, records, recoverable errors, safety traps and multipart programs. The
final part covers target profiles, NOBJ, HEX, D8 source maps and Debug80.

## Chapters

1. [Introduction](00-introduction.md)
2. [A First Program](01-a-first-program.md)

## Two ways through the language

Use this course to learn the language through programs. Use the
[Nucleus 0.1 Language Specification](../language/) when you need the exact
grammar, validity rule or runtime behaviour.
