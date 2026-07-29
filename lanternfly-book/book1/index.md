---
layout: default
title: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 1 — Language Fundamentals

> [!IMPORTANT]
> This book records the pre-0.3 language draft and is paused while its examples
> are reconciled with the
> [current Lanternfly specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md).
> In particular, the current language uses lowercase keywords, `var`, bare
> `end`, strict `boolean` conditions and one `sub` form with an optional result.

A Lanternfly program should read like a precise description of its work. Words
such as `IF`, `THEN`, `FOR`, `TO` and `NEXT` show the program's structure.
Arithmetic and comparison operators keep formulas compact. Declarations give
every stored value a known size and interpretation.

This first part of the book establishes that source style through small
examples. It introduces each programming term before relying on it and stays
independent of a particular processor. The current chapters teach the settled
semantic model while also testing provisional choices such as keyword spelling
and case handling.

## Chapters

1. [A First Program](01-a-first-program.md)
2. [Names and Integer Types](02-names-and-integer-types.md)
3. [Expressions and Comparisons](03-expressions-and-comparisons.md)
4. [Decisions](04-decisions.md)
5. [Loops](05-loops.md)
6. [Fixed Arrays](06-fixed-arrays.md)
7. [Records and Exact Layout](07-records-and-exact-layout.md)
8. [References and Addresses](08-references-and-addresses.md)
9. [Procedures and Functions](09-procedures-and-functions.md)
10. [Services and Targets](10-services-and-targets.md)

The next part will combine these facilities in a complete program and develop
the source-unit, import and native-interface syntax that remains provisional.

Companion listings currently use `.txt` filenames while the language's source
extension remains a design decision. The contents show Lanternfly source.
