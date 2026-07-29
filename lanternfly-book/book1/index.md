---
layout: default
title: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 1 — Language Fundamentals

Lanternfly is a statically typed language for game logic and other small-system
programs. Its statements resemble structured BASIC and readable pseudocode.
Its types describe exact bytes, arrays, records and addresses so the same
source can be lowered to Z80 assembly, another assembler, C or a selected BASIC
dialect.

This book teaches the working 0.3 language one program at a time. Each chapter
adds a source construct, shows the problem it solves and follows the generated
work far enough to explain its cost.

> [!NOTE]
> Edition 0.3 is the implementation contract for the first compiler. The
> examples in this book follow that contract while the compiler is being built.

## Chapters

1. [A First Program](01-a-first-program.md)
2. [Names and Integer Types](02-names-and-integer-types.md)
3. [Expressions and Comparisons](03-expressions-and-comparisons.md)
4. [Decisions](04-decisions.md)
5. [Loops](05-loops.md)
6. [Fixed Arrays](06-fixed-arrays.md)
7. [Records and Exact Layout](07-records-and-exact-layout.md)
8. [References and Addresses](08-references-and-addresses.md)
9. [Subroutines](09-subroutines.md)
10. [Services, Targets and Assembly](10-services-targets-and-assembly.md)

The [working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
defines the complete source rules. The
[conformance contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/conformance.md)
lists the programs, diagnostics and runtime faults that an implementation must
test.

Each chapter links to a companion listing under
`/lanternfly-book/book1/code/`. The listings keep a `.txt` extension while the
project decides the final Lanternfly source extension.

Exercises will arrive with the compiler, when the toolchain can run each
program and provide an answer key.
