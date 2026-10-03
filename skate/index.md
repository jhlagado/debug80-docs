---
title: Skate
nav_order: 9
nav_exclude: true
---

# Skate

Skate compiles a small version of Scheme into Z80 programs that run under CP/M.
You can write procedures, build lists and retain local variables in closures
while the runtime reclaims unreachable heap objects.

## Programming Skate

[Start with the introduction](book1/00-introduction.md) or visit the
[book overview](book1/) for the proposed course. The opening drafts cover the
machine and a first edit, compile and run session. Later chapters are planned.

The course develops calculations into list-processing programs and then an
interactive adventure. It assumes no Scheme or Z80 assembly knowledge.

## CP/M and Triptych

[CP/M essentials](../triptych/cpm/) explains the prompt, drives and files used
in the examples. Triptych provides a browser environment for running CP/M.

[Skate source and releases](https://github.com/jhlagado/Skate) contain the
compiler, examples and release-specific limits. The book's current language
baseline is 0.5.5. The older browser starter has a smaller feature set.
