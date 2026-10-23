---
title: Origo
nav_order: 12
has_children: true
nav_exclude: true
---

# Origo: specifying replaceable software

**Book in development.** This first edition is a reading plan with proposed
examples and figures. Chapters will be written as the method and notation are
tested. The outline describes the questions the book will investigate.

Origo explores software development in which a specification defines acceptable
behaviour and resource limits. A generator supplies an implementation. Separate
checks examine whether it satisfies those requirements. The specification and
its evidence remain available when an implementation is replaced.

The practical experiment is a BASIC compiler for a small Z80 computer. The
broader question is whether people can specify useful software through a
precise, reusable language without supplying its implementation themselves.
That question is still open.

This book is for a reader interested in how software is made. No knowledge of
Z80 assembly, formal logic or the compiler's internals is assumed. Ordinary
examples introduce each idea before the compiler case studies add physical
constraints.

## Reading plan

- [Chapter outline](outline.md): the progression from intentions to reusable
  contracts and protocols.
- [Examples, notation and figures](examples.md): the recurring examples and
  the evidence each example needs before it becomes a tutorial.

## The three undertakings

**Origo Compiler (OC)** is the executable toolchain being developed.
**Origo Method (OM)** is the process of specifying components, generating
replacements and examining their results. **Origo Language (OL)** is the
specification notation under investigation. This book concentrates on the last
two and uses the compiler as a source of concrete evidence.

Examples will be labelled as working notation, experimental notation or
illustrative sketches. Tested behaviour and proposed capabilities will remain
distinct. The book will develop from complete small examples rather than from
a catalogue of directives.
