---
layout: default
title: "Introduction"
parent: "AZM Book 2 — Z80 Fundamentals"
nav_order: 0
---

# Introduction

This book teaches Z80 programming from nothing. We begin with what a
computer physically is — memory, registers and a processor stepping
through numbered cells — and build outward through machine code, assembly
language, flags and jumps, loops, tables, the stack, subroutines and
ports, until we can write and read a complete program. Nothing is assumed:
no programming experience, no electronics, no mathematics beyond
arithmetic.

## The machine

The Z80 is an eight-bit processor from 1976 that still runs hobby
computers, arcade boards and educational machines today. It is small
enough to understand completely — every register, every instruction — and
that completeness is the reason to learn on it. A programmer who knows the
Z80 knows what a computer actually does when it computes, and that
knowledge transfers to every larger machine, where the same ideas hide
under more layers.

## The intended reader

You need curiosity and patience, and nothing else. If you have programmed
in a high-level language, some early chapters will confirm things you
half-knew; if you have never programmed at all, the pace is set for you.
Each idea arrives once, concretely, before the next one leans on it.

## The book's method

We work in AZM, an assembler that turns assembly source into Z80 machine
code, and every example in the book assembles. Each chapter takes one
layer of the machine — what a flag is, how a loop counts down, what the
stack remembers — and works it through small programs you can follow byte
by byte. Chapter 10 assembles the layers into a complete program, and
Chapter 11 closes with the conventions that keep larger programs
manageable. Exercises appear along the way, with notes at the end of the
book.

After these fundamentals, [AZM Book 1](../book1/index.md) explains the
assembler's own facilities — layouts, register contracts and ops — and
[AZM Book 3](../book3/index.md) applies everything to algorithms and data
structures.

## Prerequisites

A computer that can run the AZM toolchain, and a willingness to trace
programs on paper when a register refuses to hold what you expected. The
first chapter starts at the true beginning: what is inside the machine.
