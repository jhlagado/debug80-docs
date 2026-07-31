---
layout: default
title: "Lanternfly Book 1 — Programming Fundamentals"
nav_order: 1
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 1 — Programming Fundamentals

## Introduction

Lanternfly is a compiled, low-level programming language for computers where
every byte and machine operation matters. It occupies the same programming
territory as C and Pascal: you declare exact types, lay out data, call machine
services and compile the complete program into native code.

Its source resembles structured BASIC. Words such as `if`, `then`, `for`,
`while` and `end` show the shape of the program, while familiar arithmetic
operators describe calculations. Variables have declared types and
subroutines accept arguments and return results. You can follow the control
flow from the words before learning a large vocabulary of punctuation.

The compiler translates Lanternfly ahead of time. The first planned backend
produces Z80 assembly, which AZM assembles into machine code:

```text
Lanternfly source
    → Lanternfly compiler
    → Z80 assembly
    → AZM
    → machine code
```

The target computer runs those machine instructions directly. An interpreter
dispatches language operations while the program is running; Lanternfly
performs that translation during the build. This places Lanternfly programs in
the same native-code performance class as programs compiled from C or Pascal.
The exact result remains visible in the generated assembly listing.

Lanternfly is intended to cover the same programming role as an assembler.
Exact integer widths, fixed arrays, record layouts and address classes
describe the memory operations that the compiler must produce. Machine
services enter through typed declarations and an `asm` block remains
available when a routine depends on a particular instruction or device
sequence. The compiler handles instruction selection and register bookkeeping
for ordinary program logic.

The first edition uses a deliberately bounded storage model. Module variables,
arrays and records occupy addresses chosen during the build. Scalar parameters
and local variables belong to a subroutine invocation. Dynamic heap allocation
is deferred, so programs express changing data inside storage whose maximum
size is already known.

On a Z80, this discipline accounts for code, data and machine services that
share a 65,536-byte address space. The source records the relevant machine
choices: integer widths, table sizes and record layouts are part of the
program.

The long-term goal is to run the Lanternfly compiler on the small machines it
targets as well as on desktop systems. A desktop-hosted compiler can build
programs for several processors, while a native compiler can support a
self-contained development environment on an 8-bit computer. Both forms
compile the same source language.

The language grew from research into a more approachable way to write Glimmer
program bodies. The result is an independent programming language. A program
may calculate a result, maintain a set of records, process input, control a
device, print a report or run a game.

> [!NOTE]
> Lanternfly 0.4 is the working contract for the first compiler. The package
> currently contains the language design and conformance material; runnable
> compiler tooling is still to be implemented. The examples in this book show
> the intended source language.

## Chapters

- [Introduction](00-introduction.md)

1. [Your First Lanternfly Program](01-a-first-program.md)
2. [Values and Integer Types](02-names-and-integer-types.md)
3. [Calculations and Comparisons](03-expressions-and-comparisons.md)
4. [Choosing a Path](04-decisions.md)
5. [Repeating Work](05-loops.md)
6. [Tables with Fixed Arrays](06-fixed-arrays.md)
7. [Records and Memory Layout](07-records-and-exact-layout.md)
8. [Selecting Storage with Indices and Aliases](08-references-and-addresses.md)
9. [Building with Subroutines](09-subroutines.md)
10. [Modules, Machine Services and Assembly](10-services-targets-and-assembly.md)

The [working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
records the normative 0.4 rules. The
[conformance contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/conformance.md)
lists the programs and diagnostics that an implementation must test.

Each chapter links to a complete companion listing. The listings use `.txt`
because the final Lanternfly source extension has yet to be selected.
