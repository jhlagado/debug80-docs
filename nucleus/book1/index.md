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

The opening program introduces storage, routines and a command-line build. The
following chapters develop scalar values, decisions, loops, fixed arrays,
bounded strings, records, recoverable errors, safety traps and multipart
programs. The final part covers target profiles, NOBJ, HEX, D8 source maps and
Debug80.

## Chapters

- [Introduction](00-introduction.md)
- [Chapter 1: A First Program](01-a-first-program.md)
- [Chapter 2: Values and Constants](02-values-and-constants.md)
- [Chapter 3: Expressions](03-expressions.md)
- [Chapter 4: Decisions](04-decisions.md)
- [Chapter 5: Loops](05-loops.md)
- [Chapter 6: Fixed and Nested Arrays](06-fixed-and-nested-arrays.md)
- [Chapter 7: Bounded Strings](07-bounded-strings.md)
- [Chapter 8: Records and Aggregate Constants](08-records-and-aggregate-constants.md)
- [Chapter 9: Open Views and Text Construction](09-open-views-and-text-construction.md)
- [Chapter 10: Routines and Calls](10-routines-and-calls.md)
- [Chapter 11: Aggregate Parameters and Results](11-aggregate-parameters-and-results.md)
- [Chapter 12: Forwards and Recursion](12-forwards-and-recursion.md)
- [Chapter 13: Recoverable Errors and Traps](13-recoverable-errors-and-traps.md)
- [Chapter 14: Source Parts and the System Boundary](14-source-parts-and-the-system-boundary.md)
- [Chapter 15: Build, Run and Debug](15-build-run-and-debug.md)

## Two ways through the language

Use this course to learn the language through programs. Use the
[Nucleus 0.1 Language Specification](../language/) when you need the exact
grammar, validity rule or runtime behaviour.
