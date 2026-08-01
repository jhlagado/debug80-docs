---
layout: default
title: "Introduction"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 0
---

# Introduction

This book is a first course in Lanternfly, a programming language for small
computers. We begin with a calculation three lines long, and by the last
chapter we are writing programs that organise records, span several modules
and talk to real hardware through typed services. Between those two points
lies everything we must bring to a machine this small: choosing
representations deliberately, guarding the values we store and accounting
for the storage and instructions our choices produce.

## The language

Lanternfly is a statically typed, compiled language in the structured BASIC
tradition. Its source reads in short English words — `if`, `then`, `for`,
`while`, `end` — and familiar arithmetic symbols, so you can follow a
program's shape before you have learned any punctuation. Underneath, it
behaves like the compiled languages of the systems world: you declare exact
integer types, lay out arrays and records byte for byte, and the compiler
translates the complete program ahead of time into native code for a small
processor. The first target is the Z80, an eight-bit processor with 65,536
addressable bytes, still designed into hobby and educational computers
today. The reference compiler reads the source once and emits machine code
directly. This book works with the toolchain's second, inspectable form of
the same translation, which writes Z80 assembly for the AZM assembler to
finish:

```text
Lanternfly source (.lafy)
    → Lanternfly compiler
    → Z80 assembly
    → AZM assembler
    → machine code
```

Interpreted BASIC made small computers approachable but spent most of the
processor reading the program; assembly used the machine fully but
dissolved every idea into register bookkeeping. Lanternfly keeps the
readable surface and compiles it, and its toolchain keeps the generated
assembly open for inspection, so the instructions and helpers behind every
emitted operation are facts we can read rather than guesses.

## The intended reader

If you have written programs in any language — BASIC, Python, C,
JavaScript — you have background enough. Where a small-machine idea is
needed, such as binary representation, two's complement or memory layout,
we build it from the ground up, and no assembly experience is assumed
anywhere. If you come from a larger language, expect a familiar habit to
be corrected now and then: a fixed-memory machine rewards different
instincts than a desktop runtime, and watching your instincts shift is
part of the pleasure of the subject.

## A language before its compiler

Lanternfly is a young project. This book follows the
[0.5 specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md),
the contract for the first compiler — and that compiler does not exist
yet. Every example shows the intended source language, checked against
the specification.

For us this has an upside. Every program in the book is small enough to
run by hand, and running them by hand is exactly how we will read them:
we follow the stored values from a program's entry to its return, and the
final state of storage is the program's answer. When the compiler
arrives, these same programs are intended to become part of its test
suite, and the traces we work through together state the results those
tests must produce.

## The book's method

Each chapter is built around one complete program. We take the program a
few lines at a time, one idea per section; the full source waits at the
end of the chapter as a plain-text listing, and a short summary closes
each chapter with the rules it introduced.

The chapters build strictly on one another, with nothing used before it
is taught, and the route is worth seeing whole before we set out. Chapter 1
settles us inside a single assignment and the simplest subroutine call.
Chapters 2 and 3 are about values: types, literals and constants, then
calculations, conversions and comparisons. Chapter 4 names fixed sets of
alternatives and turns Boolean answers into decisions; Chapter 5 adds
loops. Chapters 6 through 8 build our data structures: fixed arrays,
counted strings, then records with exact layouts. Chapter 9 completes
subroutines with parameters, results and locals, and Chapter 10 shows how
a program records _which_ piece of data an operation applies to — with
indices and aliases rather than pointers. Chapter 11 grows programs past
one file with modules and imports, Chapter 12 reads and writes text
portably through the standard services, and Chapter 13 opens the machine
boundary itself: platform services, opaque addresses and inline assembly.
