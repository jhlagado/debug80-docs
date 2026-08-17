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
ports. The later chapters apply those tools to arithmetic, sorting, strings,
packed bits and recursion. Nothing is assumed:
no programming experience, no electronics, no mathematics beyond
arithmetic.

## The machine

The Z80 is an eight-bit processor from 1976 that still runs hobby
computers, arcade boards and educational machines today. It is small
small enough to study register by register and instruction by instruction, and
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

We work in Atom, an assembler that turns assembly source into Z80 machine
code. Each chapter takes one layer of the machine — what a flag is, how a loop
counts down, what the stack stores — and works it through instruction fragments
you can follow byte by byte. The five complete companion programs in Chapters
12 through 16 are assembled, executed and checked as part of this book's test
suite. Chapter 10 assembles the earlier layers into a complete program. Chapter 11
sets the conventions used by the algorithm chapters that follow. Exercises
appear along the way, with notes at the end of the book.

[Atom Book 1](../book1/index.md) is the companion reference for exact source
syntax, directives, output formats and the programming API.

## Prerequisites

A computer that can run the Atom toolchain and a willingness to trace
programs on paper when a register holds an unexpected value. The
first chapter starts at the true beginning: what is inside the machine.
