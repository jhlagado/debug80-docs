---
title: "Introduction"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 0
---

# Introduction

This is an introduction to Z80 programming from first principles. The opening
chapters define bytes, addresses and registers before using them in programs.
Later chapters combine those mechanisms into routines and then apply them to
larger algorithms.

## The machine

The Z80 is an eight-bit processor from 1976 that still runs hobby computers,
arcade boards and educational machines today. Its registers and instructions
are small enough to study one by one. Following each instruction makes address
calculation, memory transfer and control flow visible; larger processors
implement the same operations with more layers.

## The intended reader

The book assumes no previous programming or electronics. If you have used a
high-level language, the early chapters connect familiar operations to their
machine instructions. Each section defines a mechanism before a later example
depends on it.

## The book's method

We work in Atom, an assembler that turns assembly source into Z80 machine
code. Each chapter introduces one mechanism, traces it through a small example
and then relies on it in later programs. Complete companion sources begin in
Chapter 12. Exercises appear along the way, with notes at the end of the book.

[Atom Book 1](../book1/01-getting-started.md) is the companion reference for
exact source syntax and directives. The [reference tables](index.md#reference-tables)
provide instruction forms, flags and numeric conversions alongside this book.

## Prerequisites

Start with the [Node guide](../using-atom-on-node.md) or the
[CP/M guide](../using-atom-on-cpm.md) to install and invoke Atom. This book
uses a generic memory map for most examples rather than the CP/M `$0100`
program layout. A paper trace of register values
is useful when a program produces an unexpected result. Chapter 1 begins with
the processor, memory and I/O.
