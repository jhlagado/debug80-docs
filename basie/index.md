---
layout: home
title: Basie
nav_order: 8
has_children: true
nav_exclude: true
---

<Mark class="book-plate" book="basie" size="52" />

# Basie

*Few notes. Make them count.*

Basie is a statically typed systems language for Z80 machines. Its compiler
runs under CP/M and turns source into native Z80 code in a single pass, and a
separate link step keeps only the routines and data a program can reach.

The language is memory-safe without a garbage collector. A record passed to a
routine is an alias that can't outlive the call. Records that come and go live
in fixed-size pools, each with exactly one owner, and are released
automatically when that owner goes away. Out-of-range indexes, narrowing
conversions and stale references trap before they can touch the wrong
storage. The guiding principle is that whatever can be decided before the
program runs should be, so the machine pays at run time only for what can't be
known any earlier.

## Books

### [Programming Basie](book1/)

A tutorial on writing memory-safe Z80 programs for CP/M, built around a
complete, self-checking program in every chapter. It starts with a single
calculation and finishes with a command-processing utility that parses input,
allocates records from a pool and reports its results.

## Specification and source

The language specification, toolchain documentation, standard library and
compiler source are in the [Basie repository](https://github.com/jhlagado/basie).
