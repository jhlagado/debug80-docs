---
layout: default
title: "Introduction"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 0
---

# Introduction

Atom is a single-pass Z80 assembler. It reads one or more `.asm` files and
produces Z80 machine code.

This book defines the current source language and its two command-line
interfaces. The Node-hosted desktop command provides project files,
preprocessing and development artifacts. The native CP/M command keeps the
same assembler language but uses a smaller positional interface and CP/M file
services. The appendices collect the JavaScript API and exact lookup tables.

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

Before that pass, the desktop source-preparation stage resolves `%INCLUDE`,
`%DEFINE`, `%IF`, `%ELSE`, `%ENDIF` and the file named by `INCBIN`. Native CP/M
resolves leading `%INCLUDE` directives. After assembly, each host writes the
requested output. This distinction matters when choosing where a definition
belongs: `%DEFINE` controls desktop preprocessing, while `EQU` declares a value
that assembly expressions can use on either host.

The first chapter installs the desktop command, assembles a small program and
shows the corresponding native CP/M command.
