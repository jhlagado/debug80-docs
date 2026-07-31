---
layout: default
title: "Lanternfly Book 2 — Language Reference"
nav_order: 2
has_children: true
has_toc: false
---

<Mark class="book-plate" book="lanternfly" size="52" />

# Lanternfly Book 2 — Language Reference

Lanternfly is a small, statically typed language for machines where memory
layout, code size and predictable execution still matter. Its semantics are
deliberately close to the machine, while its structured BASIC syntax keeps
the source familiar and readable.

This manual defines the Lanternfly 0.4 implementation baseline. It is a
reference rather than a course: declarations, types, storage, expressions,
control flow, routines, modules, native boundaries, grammar and diagnostics
each have a chapter of their own. Read it from the beginning for a complete
view of the language, or enter through the chapter list when you need one
rule.

[Lanternfly Book 1](../book1/) teaches the language through programs. This
book states the rules that every compiler, backend and host integration must
preserve.

> [!NOTE]
> Lanternfly 0.4 is the source-language contract for the first compiler. No
> compiler exists yet. The
> [working specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
> remains normative if this manual and the specification differ.

The vocabulary is precise. **Must** marks a semantic requirement, **should**
marks a strong toolchain recommendation, **provisional** marks a rule awaiting
parser or corpus evidence, and **deferred** marks a facility outside the first
implementation.

## Chapters

1. [Language Model and Source Form](01-language-and-source.md)
2. [Names and Scopes](02-names-and-scopes.md)
3. [Types, Literals and Static Text](03-types-literals-and-text.md)
4. [Integer Expressions and Conversions](04-integer-expressions.md)
5. [Constants, Variables and Placement](05-constants-variables-placement.md)
6. [Records, Arrays, Paths and Aliases](06-records-arrays-paths.md)
7. [Assignment and Standard Operations](07-assignment-and-operations.md)
8. [Conditions and Loops](08-conditions-and-loops.md)
9. [Routines](09-routines.md)
10. [Modules, Programs and Hosted Bodies](10-modules-and-programs.md)
11. [Targets, External Routines and Assembly](11-targets-and-native-code.md)
12. [Grammar and Word Inventory](12-grammar-and-words.md)
13. [Diagnostics and Conformance](13-diagnostics-and-conformance.md)

## Normative sources

- The
  [Lanternfly 0.4 specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
  defines source meaning.
- The
  [conformance and diagnostics contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/conformance.md)
  defines the minimum diagnostic inventory, semantic fixtures and artifacts.
- The
  [lowering and runtime contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/lowering-and-runtime.md)
  defines the typed front-end, host, backend and runtime boundaries.
