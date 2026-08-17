---
layout: default
title: "Introduction"
parent: "Atom Book 2 — Z80 Programming"
nav_order: 0
---

# Introduction

This is an introduction to Z80 programming from first principles. We begin with what a
computer physically is — memory, registers and a processor stepping
through numbered cells — and build outward through machine code, assembly
language, flags and jumps, loops, tables, the stack, subroutines and
ports. In the final chapters, we apply those tools to arithmetic, sorting,
strings, packed bits and recursion. The opening chapters define bytes,
addresses and registers before using them in programs.

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
code. Each chapter takes one layer of the machine — what a flag is, how a loop
counts down, what the stack stores — and works it through instruction fragments
you can follow byte by byte. The five complete companion programs in Chapters
12 through 16 are assembled, executed and checked as part of this book's test
suite. In Chapter 10, we combine the earlier mechanisms in one complete
program. Chapter 11 states the conventions used by the algorithm chapters.
Exercises appear along the way, with notes at the end of the book.

[Atom Book 1](../book1/01-getting-started.md) is the companion reference for
exact source syntax, directives and output formats. The [programming API](../appendices/06-programming-interface.md)
is in the appendices.

## Prerequisites

You need a computer that can run the Atom toolchain. A paper trace of register
values is useful when a program produces an unexpected result. Chapter 1
begins with the processor, memory and I/O.
