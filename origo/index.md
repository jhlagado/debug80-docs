---
title: "Delete the Implementation"
nav_order: 12
has_children: true
nav_exclude: true
---

# Delete the Implementation

**Book in development.** The preface and chapter 1 are first drafts. The
other chapters are plans, written up as their examples and evidence are
checked.

Origo is a method for building software from contracts under measured
gates. I write down what a routine must do, precisely enough for a machine
to check. A generator writes candidates from that description alone.
Deterministic tools judge each one, and a candidate replaces the existing
code only when it passes every check and the decision is recorded. The
contract and its evidence are kept, and the implementation becomes
replaceable.

The method's test is the book's title. Can I delete the implementation
without losing the software? The book explains the method well enough for a
reader to run a study of their own. It also reports what three studies
found, including where the method did not pay and where it was not
followed.

The book is for a working programmer who uses code generators or is
considering them and wants evidence. You need to read code comfortably. The
examples are in Z80 assembly and each one is explained as it appears, so no
Z80 knowledge is assumed.

## Contents

- [Preface](00-preface.md)
- [1. Deleting the implementation](01-deleting-the-implementation.md)
- [Outline](outline.md): every chapter, its job and its example
- [Examples, notation and figures](examples.md): the recurring examples and
  the evidence each one needs before it is written up

## Three strands

**The method** is the order of work: contracts, gates, rounds of
regeneration and stages built once. **The studies** are the projects the
method has been applied to, and supply every figure in the book. **The
specification language** is the notation being developed to state, without
English, the obligations a contract still holds in prose. The book treats
the language as research and labels each example of it as working,
experimental or illustrative.
