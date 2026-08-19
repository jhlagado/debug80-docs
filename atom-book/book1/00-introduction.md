---
layout: default
title: "Introduction"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 0
---

# Introduction

Atom is a single-pass Z80 assembler for macOS. It reads Z80 assembly from one
or more source files and produces a binary, Intel HEX, listing, D8 map and NOBJ
object stream.

This book defines the current source language and the public Mac interfaces. It
covers source lines and symbols, expressions and forward references,
instructions, data and storage, project composition, diagnostics and output
artifacts. The appendices collect the JavaScript API and exact lookup tables.

## The intended reader

The manual assumes that you can read Z80 assembly and recognise its registers,
instructions, flags, stack and addressing forms. [Atom Book 2 — Z80
Programming](../book2/00-introduction.md) provides a from-zero introduction to
the processor.

Programmers coming from another assembler should begin with Chapters 1 and 2.
The two source conventions most likely to differ are visible immediately:
assembler directives are bare words such as `ORG` and `DB`, while a leading
period marks a private symbol such as `.LOOP`.

## Assembly and source preparation

Atom separates assembly from operations that require access to files. The
assembler handles symbols, expressions, instructions, directives and forward
references in a single pass through the prepared source.

Before that pass, the source-preparation stage resolves `%INCLUDE`, `%DEFINE`,
`%IF`, `%ELSE`, `%ENDIF` and the file named by `INCBIN`. After assembly, Atom
writes the requested artifacts. This distinction matters when choosing where a
definition belongs: `%DEFINE` controls preprocessing, while `EQU` declares a
value that assembly expressions can use.

The first chapter installs the command and assembles a small `.asm` program.
