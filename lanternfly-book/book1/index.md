---
layout: default
title: "Lanternfly Book 1 — Language Fundamentals"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 1 — Language Fundamentals

Lanternfly is a high-level language with a compiler, built for small
machines. You write in a notation that reads like structured BASIC — words
for the structure, ordinary operators for the formulas, statements you can
read aloud — and the compiler translates it, ahead of time, into efficient
low-level code: Z80 assembly first, with other assemblers, C and selected
BASIC dialects as further targets. Nothing interprets your program while it
runs. What runs is the translation, and the translation is meant to stand
comparison with what a careful assembly programmer would have written.

It is a modern take on an old idea. The home computers of the eighties
booted into BASIC, and BASIC's great gift was that ordinary people could
read and write it — but it was interpreted, and the machine spent most of
its strength re-reading the program instead of running it. In the same era,
Pascal demonstrated the other half of the answer: a structured, typed
language, compiled once into real machine code. Lanternfly puts the two
halves together and aims them at the machines where the trade-off bites
hardest. In spirit it is closer to Pascal than to the BASIC it resembles:
statically typed, block structured, compiled — but it keeps the plain
spoken surface that made BASIC learnable in an afternoon.

Efficiency is the design. Lanternfly's types
describe exact bytes, arrays, records and addresses, so a declaration in
source corresponds to storage you can point to on the target, and a
statement corresponds to instructions you can count. On a processor with
kilobytes of memory and no time to waste, that correspondence is the whole
reason to use a compiler and still trust the result. The language is aimed
at game logic and other small-system programs — code that must fit, must
keep up with the frame, and must still be readable next year.

This book teaches the working 0.3 language one program at a time. Each
chapter adds a source construct, shows the problem it solves and follows the
generated work far enough to explain its cost.

> [!NOTE]
> Edition 0.3 is the implementation contract for the first compiler. The
> examples in this book follow that contract while the compiler is being
> built.

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
