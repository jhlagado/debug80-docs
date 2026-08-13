---
layout: default
title: "Programming Nucleus: Lanternfly reuse plan"
nav_exclude: true
search_exclude: true
---

# Programming Nucleus: Lanternfly reuse plan

Status: editorial and implementation plan, not published book prose.

## Recommendation

Create one new teaching book, **Programming Nucleus**, from the useful
teaching architecture of Lanternfly Book 1. Do not rename the archived book or
adapt Lanternfly Book 2 into a second reference.

The Nucleus 0.1 Language Specification and Z80 Runtime and Backend Contract
remain authoritative. The language specification is also the subject-matter
checklist: every normative topic must either receive direct teaching coverage
or an explicit reference from the course. The new book explains how to use
that language through complete programs. A short tool reference at the back
covers the compiler CLI, project file, Node host API, NOBJ, HEX, D8 and
Debug80. It links to the specifications for exhaustive rules.

This is an editorial reuse, not a search-and-replace conversion. Lanternfly
contains modules, imports, signed and 32-bit integers, enumerations, ranges,
multidimensional arrays, selection, source aliases, text modules, external
routines and inline assembly. Nucleus 0.1 has none of those forms. Leaving
even one of them in a renamed example would make the new manual unreliable.

## Reader and job

The intended reader has written a little code. No Z80 assembly knowledge is
required.
The book should get that reader from a first complete `.nu` program to a
multipart program that can be compiled, run and debugged. Each chapter should
answer a programming problem before it introduces the language mechanism.

The book has three jobs:

1. teach the complete practical Nucleus 0.1 language;
2. show the fixed-storage and recoverable-failure model through programs; and
3. teach the supported route from source to NOBJ, HEX, D8 and Debug80.

It is not a substitute grammar, compiler design history, Z80 calling-convention
manual or catalogue of proposed later features.

## Material already present

The docs repository contains:

- the complete archived Lanternfly Book 1, with introduction, sixteen chapters,
  glossary and companion listings;
- the archived Lanternfly language reference;
- three resolved editorial planning notes, including a first-use matrix;
- archived task and reactive-language papers, which belong to a different
  language direction and are not source material for this manual;
- the generated Nucleus 0.1 language specification and runtime-contract reading
  editions; and
- the Nucleus landing page, the **Programming Nucleus** introduction, its first
  chapter and the first executable companion program.

The strongest reusable material is Book 1's progression from a concrete
program state to a rule and then to a consequence. Its first-program trace,
loop stopping-rule comparison, array-stride explanation, record-layout
diagrams and failure-versus-trap motivation deserve new Nucleus examples.
The archived companion listings are evidence of teaching intent, not code to
copy: none should enter the new book until it compiles with the current Nucleus
compiler.

## Book 1 reuse map

| Lanternfly chapter                 | Decision                      | Nucleus treatment                                                                                                                                                                                                                                                                           |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Introduction                       | Adapt                         | Keep the audience and complete-program method, without requiring Z80 knowledge. Replace the module and assembler-pipeline account with the direct Z80 compiler and supported artifacts.                                                                                                     |
| 1. A First Program                 | Heavy edit                    | Keep the small calculation and state trace. Use exact Nucleus `main()` rules, declaration order, local-prefix rule and current CLI commands.                                                                                                                                                |
| 2. Scalar Values and Literals      | Rewrite examples              | Teach `u8`, `u16`, `boolean`, decimal, `$` hexadecimal and `%` binary integers, byte character literals, escapes, constants and case-sensitive names. Remove signed and 32-bit types, capability imports and type inference.                                                                |
| 3. Expressions and Conversions     | Heavy edit                    | Teach the Nucleus operator set, including integer `mod` and `xor`, result types, `u8` to `u16` widening and checked `u8(...)` narrowing. Remove powers, shifts, `abs`, `sqrt`, signed arithmetic and truncating casts.                                                                      |
| 4. Comparisons, Booleans and Masks | Partial reuse                 | Keep comparison and short-circuit teaching after checking each claim against Chapter 9. Replace general bit-mask material with Nucleus's integer-only `xor`; do not invent `and`, `or`, shift or complement operators for integers.                                                         |
| 5. Ordinals and Decisions          | Replace                       | Teach flat `if`/`elseif`/`else` and ordered policy decisions. Remove enumerations, ranges and `select`.                                                                                                                                                                                     |
| 6. Loops                           | Adapt                         | Keep `while`, counted `for`, `to`, `until`, constant `step`, `exit`, `continue` and nested-loop problems. Replace signed and enum examples; use `mod` only where its unsigned Nucleus semantics suit the problem. Teach the scalar-local counter and loop-range trap exactly.               |
| 7. Fixed Arrays                    | Heavy edit                    | Keep fixed capacity, zero-based indexing, traversal, bounds checks and stride. Limit examples to one dimension and explicit counted loops. Remove custom domains, multidimensional arrays, `for each` and layout-query operations.                                                          |
| 8. Characters and Strings          | Heavy edit                    | Teach `string[N]` as a bounded counted byte sequence, exact-capacity type identity, `.length`, existing-byte indexing, copying and embedded zero bytes. Remove terminator claims, append/resize operations, long-string capabilities and whole-string comparison.                           |
| 9. Records and Exact Layout        | Adapt                         | Keep paths, nesting, nominal identity, positional initialisation and exact aggregate copying. Move physical byte layout to a clearly marked runtime appendix; remove signed fields, named field initialisers, source layout queries and `clear`.                                            |
| 10. Subroutines                    | Adapt                         | Keep parameters, results, scalar locals, aggregate parameters, early return, forwards and recursion. Use the sole-signature forward form and abbreviated body. Explain aggregate aliases only through parameters and transient results.                                                     |
| 11. Selecting Storage              | Merge                         | Preserve the distinction between storage identity and a changing index, but merge it into arrays, records and routine parameters. Nucleus has no local `alias` declaration.                                                                                                                 |
| 12. Modules and Imports            | Replace                       | Teach ordered source parts, the flat manifest, one program scope, declaration order across parts, forward completion, project-relative identities and the versioned host project file. Nucleus does not have modules, imports, exports, dependency search or multiple roots.                |
| 13. Portable Text I/O              | Replace                       | Teach the fixed Nucleus byte and storage services and build a small bounded protocol. Remove service modules, character/text routines, line editing, launcher arguments and source-visible target imports.                                                                                  |
| 14. Expecting Failure              | Adapt concept, rewrite syntax | Keep the concrete distinction between expected failure and a safety trap. Use one-byte error constants, `fails`, `fail expression` and immediate same-line `handle NAME`; remove error-set enums, `select` and declaration-bound handlers.                                                  |
| 15. Propagation and Cleanup        | Partial reuse                 | Teach `else fail` on scalar-local initialisers, assignment right sides and complete routine-call statements, including calls whose successful result is discarded. Each form must contain exactly one direct failable call. Remove propagation from `return`, failure defaults and `defer`. |
| 16. Machine Services and Assembly  | Replace                       | Teach the fixed System Services boundary, target profiles, artifact roles and Debug80. Nucleus source has no `extern`, inline assembly, source address classes, placement syntax or target imports.                                                                                         |
| Glossary                           | Rebuild                       | Retain only terms whose meanings agree exactly. Add source part, target profile, service, trap, NOBJ, HEX, D8 and physical bank.                                                                                                                                                            |

## Book 2 reuse decision

Lanternfly Book 2 should remain archived. Its chapter organisation is useful
as a checklist, but adapting it would duplicate the current Nucleus
specification and create two places where language rules can drift.

Use it only in three ways:

- compare its topic inventory with the proposed manual so no ordinary user
  task is omitted;
- salvage an occasional table or explanatory sequence after rewriting and
  compiler verification; and
- use its diagnostics and conformance chapters as reminders to link every
  manual claim to the authoritative Nucleus chapter and an executable fixture.

Do not carry over its normative language, diagnostic IDs, grammar, deferred
feature queue, module system, target-capability model, native effects or
assembly boundary.

## Proposed contents

### Part I — A complete small program

1. **Your first Nucleus program** — one calculation, `main()`, static storage,
   a state trace and `nucleus build`.
2. **Values that fit** — `u8`, `u16`, `boolean`, decimal, hexadecimal and
   binary integers, constants, byte literals, names, checked conversion and
   compile-time `assert`.
3. **Expressions and decisions** — arithmetic including `mod`, integer `xor`,
   comparisons, Boolean expressions, short-circuit evaluation and
   `if`/`elseif`/`else`.
4. **Repeating work** — `while`, both counted-loop bounds, constant steps,
   `exit` and `continue`.

### Part II — Fixed data

5. **Fixed arrays** — length, zero-based indexing, bounds, traversal and
   arrays of aggregates.
6. **Bounded strings** — capacity, current length, byte content, exact type,
   indexing and copying.
7. **Records and storage paths** — nominal records, fields, nesting,
   positional initialisation, aggregate constants, read-only direct roots and
   aggregate assignment.

### Part III — Routines and failure

8. **Routines and calls** — parameters, results, scalar locals, evaluation
   order and early return.
9. **Sharing aggregate storage** — aggregate parameters, mutation, transient
   aggregate results, identity and lifetime.
10. **Forwards and recursion** — declaration order, sole-signature forwards,
    abbreviated bodies, mutual calls and activation capacity.
11. **Propagating expected failure** — failable signatures, `fail`,
    `else fail`, required consumption, scalar-local initialisers, assignment
    right sides, complete call statements, the one-direct-call rule and entry
    failure.
12. **Handling errors and recognising traps** — immediate same-line
    `handle NAME`, same-destination handling, standard error codes, safety
    checks, trap reasons, ordering and the boundary between recoverable
    failure and traps.

### Part IV — Programs and tools

13. **Programs in several source parts** — flat manifests, one scope, exact
    ordering, project-relative identities and project files.
14. **The system boundary** — byte input/output, storage cursors, termination,
    and traps through the fixed service interface.
15. **Build, run, and debug** — target profiles, NOBJ, flat HEX, D8 maps,
    source breakpoints and Debug80's flat launch path; then standalone banked
    NOBJ and per-bank D8 production as a distinct workflow.

### Appendices

- compiler CLI and exit statuses;
- in-process Node host API and result union;
- target and project JSON schemas;
- diagnostic catalogue and capacity discovery;
- artifact glossary and physical-bank rules; and
- chapter-to-specification cross-reference.

The first four chapters should form a useful short route. Parts II and III
teach the complete source language. Part IV keeps filesystem, target and
debugger concerns outside the language chapters while still giving readers a
working toolchain.

## Specification coverage rule

The specification supplies the book's subject inventory, including the parts
that distinguish Nucleus from a general introduction to programming:

| Specification topic                                           | Course treatment             |
| ------------------------------------------------------------- | ---------------------------- |
| Streaming source, names, scope and declaration order          | Chapters 1, 10 and 13        |
| Fixed scalar and aggregate types                              | Chapters 2 and 5 through 7   |
| Program storage, activation storage and aggregate aliases     | Chapters 1, 8 and 9          |
| Expressions, checked conversions and evaluation order         | Chapters 2, 3 and 8          |
| Decimal, hexadecimal and binary literals; integer `mod`/`xor` | Chapters 2 and 3             |
| Compile-time assertions                                       | Chapter 2                    |
| Aggregate constants and read-only direct roots                | Chapters 7 and 9             |
| Structured conditionals and bounded loops                     | Chapters 3 and 4             |
| Routines, forwards, recursion and activation capacity         | Chapters 8 through 10        |
| Required handling of recoverable failure                      | Chapters 11 and 12           |
| Non-recoverable safety traps and their ordering               | Chapters 2, 4, 5 and 12      |
| Fixed system services and portable source boundary            | Chapter 14                   |
| Grammar, static semantics, runtime semantics and capacities   | Chapter links and appendices |

The cross-reference is a release gate. Adding a language topic to the
specification requires a course decision, even when the decision is to leave
the full rule in the reference and link to it from an existing lesson.

## Example and evidence policy

Every complete listing gets a checked-in `.nu` source file. The documentation
build should compile those files with the authoritative Z80 compiler and fail
if one is rejected. A smaller set of executable examples should also check
materialised output or service traces. This catches listings whose observed
result disagrees with the explanation even though the source compiles.

Each chapter needs an evidence note containing:

- the Nucleus specification sections that govern it;
- the compiler fixture or proof that exercises the shown forms;
- any published capacity the example approaches; and
- the expected diagnostic for each deliberate invalid excerpt.

Generated output may illustrate cost, but it must be measured from the current
compiler. Do not state instruction counts, byte counts or column-aware
debugger behaviour unless a corresponding test fixes that claim.

## Figures and assets

Redraw rather than relabel the Lanternfly figures. Likely reusable concepts
are:

- the first-program before/after state trace;
- one-dimensional array stride and bounds;
- nested record storage paths;
- alias identity through an aggregate parameter;
- recoverable failure versus a non-returning trap; and
- source parts flowing through the compiler into NOBJ, HEX and D8.

Drop diagrams for arbitrary array domains, row-major multidimensional layout,
modules, capability imports, source-visible near/far storage and inline
assembly. New figures should use the existing Nucleus visual identity and be
generated from repository source where practical.

## Production sequence

### Milestone 1 — Book contract and fixtures

Status: in progress.

Completed:

- created the public book directory, landing page, introduction and first
  chapter;
- added a compiler-driven example checker that validates D8 through Debug80,
  executes the program and runs the documented CLI command; and
- translated the first-program fixture and established the book's initial
  vocabulary.

Remaining:

- add chapter skeletons and the complete specification cross-reference;
- settle whether the first edition teaches the flat manifest before or after
  the JSON project file; and
- record the remaining CLI and Host API output as tool-reference fixtures.

### Milestone 2 — The short route

Write and verify Chapters 1 through 4. Test the route with a reader who knows
basic programming but not Z80. Revise the order before later chapters depend
on it.

### Milestone 3 — Complete language route

Write Chapters 5 through 12. For each archived chapter, start from its problem
and teaching sequence, then write a fresh Nucleus program. Do not edit old
Lanternfly syntax in place.

### Milestone 4 — Toolchain route

Write Chapters 13 through 15 and the appendices against the stabilised CLI,
project schema, host API, target schema and Debug80 integration. Include one
flat build launched and debugged through Debug80. Prove banked NOBJ and per-bank
D8 separately through the standalone compiler, preserving physical-bank
identity without implying that Debug80 launches banked targets.

### Milestone 5 — Editorial and technical release gates

- compile every complete listing;
- run deliberate-invalid examples and compare diagnostic code, part, line,
  and byte column;
- validate all internal links and generated navigation;
- run the repository prose checks;
- perform a teaching-prose review and a separate technical review against the
  specification;
- test every CLI transcript on Node 20 and the supported current Node release;
  and
- publish only after the examples, tool reference and current package
  installation route agree.

## Decisions to keep explicit

The title **Programming Nucleus** distinguishes the teaching book from the
language specification. The archived Lanternfly books remain available as
history and are never redirected to the Nucleus pages.

The first edition should describe Debug80 source navigation as line-level even
though D8 preserves byte columns. It should describe NOBJ as the canonical
compiler result carrying generated target bytes, patches and layout metadata,
with D8 as a separate source-map sidecar. It should not imply that a banked
target has one ambiguous flat address space or that Debug80 currently launches
banked Nucleus targets.

Book development uses the locally linked `@jhlagado/nucleus` and
`@jhlagado/debug80-runtime` packages. Registry publication is independent of
the writing schedule. The example gate executes the linked authoritative Z80
compiler before any chapter is committed.
