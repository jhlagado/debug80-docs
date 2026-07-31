---
layout: default
title: "Introduction"
parent: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 0
---

# Introduction

This book is a first course in Lanternfly, a programming language for small
computers. It begins with a three-line calculation and ends with programs
that organise records, divide themselves into modules and talk to real
hardware through typed services. Along the way it teaches the habits that
matter on machines where every byte is accounted for: choosing
representations deliberately, guarding the values you store and knowing what
each line costs.

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
today.

That combination is the language's reason to exist. Interpreted BASIC made
small computers approachable but spent most of the processor reading the
program; assembly used the machine fully but dissolved every idea into
register bookkeeping. Lanternfly keeps the readable surface and compiles it
honestly, and its toolchain keeps the generated assembly open for
inspection, so the cost of any line is a fact you can look up rather than a
guess.

## The intended reader

The book is written for programmers meeting Lanternfly for the first time.
Experience in any language — BASIC, Python, C, JavaScript — is enough
background; where small-machine ideas such as binary representation, two's
complement or memory layout are needed, the book explains them from the
ground up. No assembly knowledge is required. Readers who know a larger
language will occasionally find a familiar habit corrected, because a
fixed-memory machine rewards different instincts than a desktop runtime.

## A language before its compiler

Lanternfly is a young project. This book follows the 0.4 working
specification, the contract for the first compiler — and that compiler does
not exist yet. Every example shows the intended source language, checked
against the specification, but nothing here can be compiled and run today.

The book turns that limitation into its method. Each program is small
enough to execute by hand, and the chapters trace them: you follow the
stored values from the program's entry to its return, and the final state
of storage is the program's answer. When the compiler arrives, these same
programs are intended to become part of its test suite, and the traces in
this book state the results those tests must produce.

## The book's method

Each chapter is built around one complete program. The prose shows the
program a few lines at a time and explains one idea per section; the full
source is always linked at the end of the chapter as a plain-text listing.
Chapters close with a short summary of the rules they introduced.

The chapters build strictly on one another. Chapter 1 orients you inside a
single assignment. Chapters 2 and 3 cover values: integer types, Booleans,
calculations and comparisons. Chapters 4 and 5 add control: decisions and
loops. Chapters 6 and 7 introduce structured data: fixed arrays and
records with exact layouts. Chapter 8 shows how a Lanternfly program keeps
track of *which* piece of data it means — with indices and aliases rather
than pointers. Chapter 9 completes subroutines with parameters, results
and locals, and Chapter 10 opens the machine boundary: modules, typed
services and inline assembly.

## Prerequisites

Nothing has to be installed. A pencil and paper are genuinely useful,
because tracing the programs by hand is how this book replaces a compiler —
and the skill transfers directly to debugging real programs later. Readers
who want the fine print behind any rule can consult the
[working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md),
which this book cites by section where it matters.

The first program is three declarations and one statement. It is enough to
show where a program's values live, where execution begins and what an
assignment actually does — which is where every larger program in this book
starts.
