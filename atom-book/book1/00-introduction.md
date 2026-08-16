---
layout: default
title: "Introduction"
parent: "Atom Book 1 — Assembler Reference"
nav_order: 0
---

# Introduction

Atom is a single-pass Z80 assembler whose assembler core is written in Z80
assembly. The current Mac command runs that core through Debug80. A host layer
reads files, resolves dependencies and conditional source, supplies binary
inputs, and renders finished artifacts.

This book defines the current source language and the public Mac interfaces. It
covers source lines and symbols, expressions and forward references,
instructions, data and storage, project composition, diagnostics, output
artifacts, and the JavaScript API. The appendices collect exact syntax and
capacity tables for lookup.

## The intended reader

The manual assumes that you can read Z80 assembly and recognise its registers,
instructions, flags, stack, and addressing forms. The AZM book [Z80
Fundamentals](../../azm-book/book2/) provides a from-zero introduction to the
processor. Atom uses a smaller assembler language, but the machine remains the
same.

Programmers coming from another assembler should begin with Chapters 1 and 2.
The two source conventions most likely to differ are visible immediately:
assembler directives are bare words such as `ORG` and `DB`, while a leading
period marks a private symbol such as `.LOOP`.

## Native and host responsibilities

The native core tokenises prepared source, manages symbols, evaluates
expressions, validates and encodes instructions, processes assembler
directives, and emits IMAGE and PATCH operations. It reads each prepared source
part once. Forward references remain in a resident pending list until the
corresponding symbol is defined.

The host resolves `%INCLUDE`, `%DEFINE`, `%IF`, `%ELSE`, `%ENDIF`, and
filesystem-backed `INCBIN`. It also writes NOBJ, binary, Intel HEX, listing, D8,
and manifest files. Dependency resolution followed by native assembly is a
two-stage build, not a second assembler pass.

The first chapter installs the command and assembles a small `.atm` program.
