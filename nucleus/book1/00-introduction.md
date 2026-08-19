---
layout: default
title: "Introduction"
parent: "Programming Nucleus"
nav_order: 0
---

# Introduction

Nucleus is a language for programs that must fit inside a small Z80 system. The
Z80 is an 8-bit processor used in early personal computers and in small
machines built today. Its limited memory makes the cost of every program data
structure matter.

Nucleus has five scalar types with fixed ranges: `u8`, `u16`, `i8`, `i16` and
`boolean`. Arrays have fixed lengths, strings have fixed capacities and records
have fixed fields. Parameter views let one routine work with arrays or strings
of several capacities while the underlying storage remains fixed. The compiler
checks these rules before it emits machine code, then inserts runtime checks
for values known only while the program runs.

The compiler itself is a Z80 program. It reads Nucleus source in order and
emits Z80 machine code directly. The command-line tool and Debug80 both run
that same compiler.

## The intended reader

This book assumes that you have seen variables, expressions, conditions and
loops in another language. Every Nucleus construct is introduced before a
program depends on it. Z80 instructions, registers and calling conventions are
outside the required starting knowledge because Nucleus source does not expose
them.

The examples use small integer problems, byte-oriented input and fixed data
structures. These suit monitors, utilities, controllers, data loggers and
games. Each complete listing is available beside its chapter as runnable
source.

## From source to a program

You write Nucleus source in `.nu` files. The build supplies their contents to
the compiler as one ordered stream, and the compiler produces Z80 machine code.
The shortest route looks like this:

```text
Nucleus source → Nucleus compiler → NOBJ
```

NOBJ is the compiler's output file. It contains the generated program and the
information needed to place that program in memory. The first chapter builds
one with the compiler's built-in settings. Later chapters add the description
of a particular machine needed to load, run and debug a program there.

Two kinds of unsuccessful operation recur throughout the book. A routine can
report an expected error code for its caller to propagate or handle. A safety
trap, such as an out-of-bounds index, ends source execution. Nucleus keeps that
distinction visible in the program.

## The book's method

Chapters begin with a programming problem, trace the relevant values, state the
governing rules and test the boundary cases. The first program calculates a
price and leaves the result in program storage. Later programs need decisions,
loops, fixed data, routine calls and recoverable failure.

The complete rule set lives in the
[Nucleus 0.1 Language Specification](../language/). Links at the end of each
chapter point to the sections that govern its examples.
