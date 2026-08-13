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
remain authoritative. The new book explains how to use that language through
complete programs. A short tool reference at the back covers the compiler CLI,
project file, Node host API, NOBJ, HEX, D8, and Debug80. It links to the
specifications for exhaustive rules.

This is an editorial reuse, not a search-and-replace conversion. Lanternfly
contains modules, imports, signed and 32-bit integers, enumerations, ranges,
multidimensional arrays, selection, source aliases, text modules, external
routines, and inline assembly. Nucleus 0.1 has none of those forms. Leaving
even one of them in a renamed example would make the new manual unreliable.

## Reader and job

The intended reader has written a little code. No Z80 assembly knowledge is
required.
The book should get that reader from a first complete `.nu` program to a
multipart program that can be compiled, run, and debugged. Each chapter should
answer a programming problem before it introduces the language mechanism.

The book has three jobs:

1. teach the complete practical Nucleus 0.1 language;
2. show the fixed-storage and recoverable-failure model through programs; and
3. teach the supported route from source to NOBJ, HEX, D8, and Debug80.

It is not a substitute grammar, compiler design history, Z80 calling-convention
manual, or catalogue of proposed later features.

## Material already present

The docs repository contains:

- the complete archived Lanternfly Book 1, with introduction, sixteen chapters,
  glossary, and companion listings;
- the archived Lanternfly language reference;
- three resolved editorial planning notes, including a first-use matrix;
- archived task and reactive-language papers, which belong to a different
  language direction and are not source material for this manual;
- the generated Nucleus 0.1 language specification and runtime-contract reading
  editions; and
- the Nucleus landing page, but no programmer's manual.

The strongest reusable material is Book 1's progression from a concrete
program state to a rule and then to a consequence. Its first-program trace,
loop stopping-rule comparison, array-stride explanation, record-layout
diagrams, and failure-versus-trap motivation deserve new Nucleus examples.
The archived companion listings are evidence of teaching intent, not code to
copy: none should enter the new book until it compiles with the current Nucleus
compiler.

## Book 1 reuse map

| Lanternfly chapter                 | Decision                      | Nucleus treatment                                                                                                                                                                                                                                                              |
| ---------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Introduction                       | Adapt                         | Keep the audience and complete-program method, without requiring Z80 knowledge. Replace the module and assembler-pipeline account with the direct Z80 compiler and supported artifacts.                                                                                        |
| 1. A First Program                 | Heavy edit                    | Keep the small calculation and state trace. Use exact Nucleus `main()` rules, declaration order, local-prefix rule, and current CLI commands.                                                                                                                                  |
| 2. Scalar Values and Literals      | Rewrite examples              | Teach `u8`, `u16`, `boolean`, decimal integers, byte character literals, escapes, constants, and case-sensitive names. Remove signed and 32-bit types, hexadecimal and binary integer spellings, capability imports, and type inference.                                       |
| 3. Expressions and Conversions     | Heavy edit                    | Teach the Nucleus operator set, result types, `u8` to `u16` widening, and checked `u8(...)` narrowing. Remove `mod`, powers, shifts, `abs`, `sqrt`, signed arithmetic, and truncating casts.                                                                                   |
| 4. Comparisons, Booleans and Masks | Partial reuse                 | Keep comparison and short-circuit teaching after checking each claim against Chapter 9. Remove bit-mask material because Nucleus has no bitwise operator family.                                                                                                               |
| 5. Ordinals and Decisions          | Replace                       | Teach flat `if`/`elseif`/`else` and ordered policy decisions. Remove enumerations, ranges, and `select`.                                                                                                                                                                       |
| 6. Loops                           | Adapt                         | Keep `while`, counted `for`, `to`, `until`, constant `step`, `exit`, `continue`, and nested-loop problems. Replace signed, enum, and `mod` examples; teach the scalar-local counter and loop-range trap exactly.                                                               |
| 7. Fixed Arrays                    | Heavy edit                    | Keep fixed capacity, zero-based indexing, traversal, bounds checks, and stride. Limit examples to one dimension and explicit counted loops. Remove custom domains, multidimensional arrays, `for each`, and layout-query operations.                                           |
| 8. Characters and Strings          | Heavy edit                    | Teach `string[N]` as a bounded counted byte sequence, exact-capacity type identity, `.length`, existing-byte indexing, copying, and embedded zero bytes. Remove terminator claims, append/resize operations, long-string capabilities, and whole-string comparison.            |
| 9. Records and Exact Layout        | Adapt                         | Keep paths, nesting, nominal identity, positional initialization, and exact aggregate copying. Move physical byte layout to a clearly marked runtime appendix; remove signed fields, named field initializers, source layout queries, and `clear`.                             |
| 10. Subroutines                    | Adapt                         | Keep parameters, results, scalar locals, aggregate parameters, early return, forwards, and recursion. Use the sole-signature forward form and abbreviated body. Explain aggregate aliases only through parameters and transient results.                                       |
| 11. Selecting Storage              | Merge                         | Preserve the distinction between storage identity and a changing index, but merge it into arrays, records, and routine parameters. Nucleus has no local `alias` declaration.                                                                                                   |
| 12. Modules and Imports            | Replace                       | Teach ordered source parts, the flat manifest, one program scope, declaration order across parts, forward completion, project-relative identities, and the versioned host project file. Nucleus does not have modules, imports, exports, dependency search, or multiple roots. |
| 13. Portable Text I/O              | Replace                       | Teach the fixed Nucleus byte and storage services and build a small bounded protocol. Remove service modules, character/text routines, line editing, launcher arguments, and source-visible target imports.                                                                    |
| 14. Expecting Failure              | Adapt concept, rewrite syntax | Keep the concrete distinction between expected failure and a safety trap. Use one-byte error constants, `fails`, `fail expression`, and statement-bound `on error`; remove error-set enums, `select`, and declaration-bound handlers.                                          |
| 15. Propagation and Cleanup        | Partial reuse                 | Teach `or fail`, result-free propagating return, and explicit caller cleanup. Remove failure defaults and `defer`, which Nucleus 0.1 does not provide.                                                                                                                         |
| 16. Machine Services and Assembly  | Replace                       | Teach the fixed System Services boundary, target profiles, artifact roles, and Debug80. Nucleus source has no `extern`, inline assembly, source address classes, placement syntax, or target imports.                                                                          |
| Glossary                           | Rebuild                       | Retain only terms whose meanings agree exactly. Add source part, target profile, service, trap, NOBJ, HEX, D8, and physical bank.                                                                                                                                              |

## Book 2 reuse decision

Lanternfly Book 2 should remain archived. Its chapter organization is useful
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
feature queue, module system, target-capability model, native effects, or
assembly boundary.

## Proposed contents

### Part I — A complete small program

1. **Your first Nucleus program** — one calculation, `main()`, static storage,
   a state trace, and `nucleus build`.
2. **Values that fit** — `u8`, `u16`, `boolean`, constants, byte literals,
   names, and checked conversion.
3. **Expressions and decisions** — arithmetic, comparisons, Boolean
   expressions, short-circuit evaluation, and `if`/`elseif`/`else`.
4. **Repeating work** — `while`, both counted-loop bounds, constant steps,
   `exit`, and `continue`.

### Part II — Fixed data

5. **Fixed arrays** — length, zero-based indexing, bounds, traversal, and
   arrays of aggregates.
6. **Bounded strings** — capacity, current length, byte content, exact type,
   indexing, and copying.
7. **Records and storage paths** — nominal records, fields, nesting,
   positional initialization, and aggregate assignment.

### Part III — Routines and failure

8. **Routines and calls** — parameters, results, scalar locals, evaluation
   order, and early return.
9. **Sharing aggregate storage** — aggregate parameters, mutation, transient
   aggregate results, identity, and lifetime.
10. **Forwards and recursion** — declaration order, sole-signature forwards,
    abbreviated bodies, mutual calls, and activation capacity.
11. **Recoverable errors** — `fails`, `fail`, `or fail`, `on error`, and the
    difference between an error code and a trap.

### Part IV — Programs and tools

12. **Programs in several source parts** — flat manifests, one scope, exact
    ordering, project-relative identities, and project files.
13. **The system boundary** — byte input/output, storage cursors, termination,
    and traps through the fixed service interface.
14. **Build, run, and debug** — target profiles, NOBJ, flat HEX, banked
    images, D8 maps, source breakpoints, and Debug80.

### Appendices

- compiler CLI and exit statuses;
- in-process Node host API and result union;
- target and project JSON schemas;
- diagnostic catalogue and capacity discovery;
- artifact glossary and physical-bank rules; and
- chapter-to-specification cross-reference.

The first four chapters should form a useful short route. Parts II and III
teach the complete source language. Part IV keeps filesystem, target, and
debugger concerns outside the language chapters while still giving readers a
working toolchain.

## Example and evidence policy

Every complete listing gets a checked-in `.nu` source file. The documentation
build should compile those files with the authoritative Z80 compiler and fail
if one is rejected. A smaller set of executable examples should also check
materialized output or service traces. This catches listings whose observed
result disagrees with the explanation even though the source compiles.

Each chapter needs an evidence note containing:

- the Nucleus specification sections that govern it;
- the compiler fixture or proof that exercises the shown forms;
- any published capacity the example approaches; and
- the expected diagnostic for each deliberate invalid excerpt.

Generated output may illustrate cost, but it must be measured from the current
compiler. Do not state instruction counts, byte counts, or column-aware
debugger behaviour unless a corresponding test fixes that claim.

## Figures and assets

Redraw rather than relabel the Lanternfly figures. Likely reusable concepts
are:

- the first-program before/after state trace;
- one-dimensional array stride and bounds;
- nested record storage paths;
- alias identity through an aggregate parameter;
- recoverable failure versus a non-returning trap; and
- source parts flowing through the compiler into NOBJ, HEX, and D8.

Drop diagrams for arbitrary array domains, row-major multidimensional layout,
modules, capability imports, source-visible near/far storage, and inline
assembly. New figures should use the existing Nucleus visual identity and be
generated from repository source where practical.

## Production sequence

### Milestone 1 — Book contract and fixtures

- create the public book directory, landing page, chapter skeletons, and
  specification cross-reference;
- add a compiler-driven example checker to the docs repository;
- translate the first-program fixture and establish the book's vocabulary;
- settle whether the first edition teaches the flat manifest before or after
  the JSON project file; and
- record current CLI and host-API output as tool-reference fixtures.

### Milestone 2 — The short route

Write and verify Chapters 1 through 4. Test the route with a reader who knows
basic programming but not Z80. Revise the order before later chapters depend
on it.

### Milestone 3 — Complete language route

Write Chapters 5 through 11. For each archived chapter, start from its problem
and teaching sequence, then write a fresh Nucleus program. Do not edit old
Lanternfly syntax in place.

### Milestone 4 — Toolchain route

Write Chapters 12 through 14 and the appendices against the stabilized CLI,
project schema, host API, target schema, and Debug80 integration. Include one
flat build and one banked build whose D8 maps preserve physical-bank identity.

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
- publish only after the examples, tool reference, and current package
  installation route agree.

## Decisions to keep explicit

The title **Programming Nucleus** distinguishes the teaching book from the
language specification. The archived Lanternfly books remain available as
history and are never redirected to the Nucleus pages.

The first edition should describe Debug80 source navigation as line-level even
though D8 preserves byte columns. It should describe NOBJ as target-layout
metadata and D8 as a sidecar. It should not imply that a banked target has one
ambiguous flat address space.

The manual can begin before package publication, but its installation chapter
cannot be released until `@jhlagado/nucleus` and its runtime dependency have a
reproducible installation route. Until then, examples may use a pinned source
checkout for development only.
