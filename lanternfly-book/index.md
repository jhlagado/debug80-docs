---
layout: default
title: "Lanternfly Books"
nav_order: 8
has_children: true
has_toc: false
nav_exclude: true
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Books

Lanternfly is a small, statically typed programming language for computers
where memory and machine cost remain visible. Its block structure resembles
structured BASIC and Visual Basic, while its exact types give the compiler
enough information to produce assembly language ahead of time.

The first backend is designed to emit Z80 assembly. An assembler then turns
that generated source into machine code:

```text
Lanternfly source
    → Lanternfly compiler
    → Z80 assembly
    → assembler
    → machine code
```

Lanternfly can express calculators, data loggers, monitors, controllers,
utilities and games. Its role is the same broad role served by an assembler:
it is a language for writing the program itself.

## Books

- [Lanternfly Book 1 — Programming Fundamentals](book1/) teaches the language
  through variables, integer types, expressions, decisions, loops, arrays,
  records, storage identity, subroutines, modules and machine services.
- [Lanternfly Book 2 — Language Reference](book2/) defines the 0.4 syntax and
  semantics, including types, exact storage, expressions, control flow,
  routines, modules, native boundaries, grammar and diagnostics.
- [Nucleus 0.1 Language Specification](nucleus/) publishes the complete
  normative source-language specification as a chapter-by-chapter reading
  edition. Nucleus is a distinct language, housed here while its own
  documentation area develops.

The Lanternfly books follow the working
[Lanternfly 0.4 contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md).
That contract is currently a design draft for the first compiler.
