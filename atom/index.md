---
layout: default
title: "Atom"
nav_order: 1
aside: false
---

<img src="/atom.svg" width="96" height="96" alt="Atom logo">

# Atom

Atom is a single-pass Z80 assembler. Its core runs as a Node command on a
desktop and as `ATOM.COM` on CP/M 2.2. The assembler language is shared; the
way you install, invoke and run it depends on the host.

## Choose your platform

- [Using Atom on Node](/atom-book/using-atom-on-node.html) covers installation,
  desktop builds, output files and projects. Node is the build host. A program
  assembled there runs on the target platform selected by the build.
- [Using Atom on CP/M](/atom-book/using-atom-on-cpm.html) covers the compact
  native command, current-drive files, CP/M output and diagnostics. It also
  shows a small program using the CP/M BDOS calling convention.

## Learn the assembler

- [Atom Book 1 — Assembler Reference](/atom-book/book1/) defines the source
  language, symbols, directives and output model.
- [Atom Book 2 — Z80 Programming](/atom-book/book2/) develops Z80 programs,
  from registers and opcodes through routines and algorithms.

Each book includes its reference tables. The Node guide also links to the
command options and the programming API for tool authors.

## Project resources

- [Atom on npm](https://www.npmjs.com/package/atom-z80) provides the desktop
  package and release history.
- [Atom source](https://github.com/jhlagado/atom) contains the assembler,
  desktop host and native platform providers.
