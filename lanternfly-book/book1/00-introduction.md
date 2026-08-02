---
layout: default
title: "Introduction"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 0
---

# Introduction

This book is a first course in Lanternfly, a programming language for small
computers. It begins with a calculation three lines long and ends with
programs that organise records, span several modules and drive hardware
through typed services.

## The language

Lanternfly is a statically typed, compiled language: short English
words — `if`, `then`, `for`, `while`, `end` — and familiar arithmetic
symbols on the surface; exact integer types,
byte-for-byte data layout and whole-program compilation to native code
underneath. The first target is the Z80, an eight-bit processor with a
64K address space, and the compiler is designed to run on machines of
this class.

## The intended reader

Some programming experience is assumed: variables, assignment, routines
and integers are familiar ground. Where a small-machine idea is needed,
such as binary representation, two's complement or memory layout, the
book builds it from the ground up, and no assembly experience is assumed
anywhere. A fixed-memory machine calls for different instincts than a
desktop runtime.

## The book's method

Each chapter is built around one complete program, taken a few lines at a
time; the full source appears at the end as a plain-text listing, and a
short summary and one exercise with its answer close the chapter. Every
program in the book is small enough to trace by hand, and tracing them
by hand is how we read them. In the early chapters, we trace stored values
from entry to return; later programs add text and machine I/O to the
trace. Each chapter relies only on explanations already given.
