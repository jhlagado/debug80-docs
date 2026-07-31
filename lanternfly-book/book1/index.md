---
layout: default
title: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 1 — Programming Fundamentals

A first course in Lanternfly: a compiled, low-level programming language
for computers where every byte and machine operation matters. Its source
reads like structured BASIC; its discipline is closer to Pascal; and the
cost of any line is a fact you can look up in the generated assembly rather
than a guess. The [introduction](00-introduction.md) says who the book is
for and how it teaches.

[Lanternfly Book 2](../book2/) is the companion language reference for
exact syntax, type, storage, control-flow and diagnostic rules.

## Chapters

- [Introduction](00-introduction.md)

1. [Your First Lanternfly Program](01-a-first-program.md)
2. [Scalar Values and Literals](02-scalar-values-and-literals.md)
3. [Expressions, Conversions and Comparisons](03-expressions-and-comparisons.md)
4. [Named Ordinals and Decisions](04-ordinals-and-decisions.md)
5. [Repeating Work](05-loops.md)
6. [Fixed Arrays and Index Domains](06-fixed-arrays.md)
7. [Characters and Fixed-Capacity Strings](07-characters-and-strings.md)
8. [Records and Memory Layout](08-records-and-exact-layout.md)
9. [Building with Subroutines](09-subroutines.md)
10. [Selecting Existing Storage](10-selecting-storage.md)
11. [Modules and Imports](11-modules-and-imports.md)
12. [Machine Services and Assembly](12-machine-services-and-assembly.md)

The [working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
records the normative 0.4 rules. The
[conformance contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/conformance.md)
lists the programs and diagnostics that an implementation must test.

Each chapter links to its complete companion listings. The listings use
`.txt` filenames for convenient browser display; each represents a
Lanternfly `.lafy` source module.
