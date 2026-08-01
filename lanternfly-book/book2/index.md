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

This manual documents the Lanternfly 0.5 edition, plus one labelled
addition: the working specification in the debug80 repository has since
moved to the provisional 0.6 draft, whose failable-routine and `defer`
revision [chapter 14](14-error-handling.md) documents. The remaining
chapters are revised once 0.6 is blessed, and the working specification
is authoritative where they differ. Until then, this manual remains a reference rather than a
course: declarations, types, storage, expressions,
control flow, routines, modules, native boundaries, grammar and diagnostics
each have a chapter of their own. Read it from the beginning for a complete
view of the language, or enter through the chapter list when you need one
rule.

[Lanternfly Book 1](../book1/) teaches the language through programs. This
book states the rules that every compiler, backend and host integration must
preserve.

> [!NOTE]
> The working specification — currently the provisional 0.6 draft — is the
> source-language contract for the first compiler; this manual documents
> the 0.5 edition. No compiler exists yet. The
> [specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md)
> remains normative if this manual and the specification differ.

**Must** marks a semantic requirement, **should** marks a strong toolchain
recommendation, **provisional** marks a rule awaiting parser or corpus evidence
and **deferred** marks a facility outside the first implementation.

## Chapters

1. [Language Model and Source Form](01-language-and-source.md)
2. [Names and Scopes](02-names-and-scopes.md)
3. [Types, Literals and Strings](03-types-literals-and-text.md)
4. [Integer Expressions and Conversions](04-integer-expressions.md)
5. [Constants, Variables and Placement](05-constants-variables-placement.md)
6. [Records, Arrays and Storage Paths](06-records-arrays-paths.md)
7. [Assignment and Standard Operations](07-assignment-and-operations.md)
8. [Conditions and Loops](08-conditions-and-loops.md)
9. [Routines](09-routines.md)
10. [Modules, Programs and Hosted Bodies](10-modules-and-programs.md)
11. [Targets, External Routines and Assembly](11-targets-and-native-code.md)
12. [Grammar and Word Inventory](12-grammar-and-words.md)
13. [Diagnostics and Conformance](13-diagnostics-and-conformance.md)
14. [Failable Routines and Error Handling](14-error-handling.md) —
    provisional 0.6

## Normative sources

- The
  [working Lanternfly specification](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/specification.md),
  currently the provisional 0.6 draft, defines source meaning.
- The
  [conformance and diagnostics contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/conformance.md)
  defines the minimum diagnostic inventory, semantic fixtures and artifacts.
- The
  [lowering and runtime contract](https://github.com/jhlagado/debug80/blob/main/packages/lanternfly/docs/lowering-and-runtime.md)
  defines the typed front-end, host, backend and runtime boundaries.
