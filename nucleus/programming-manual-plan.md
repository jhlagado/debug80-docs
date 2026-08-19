---
layout: default
title: "Programming Nucleus: editorial plan"
nav_exclude: true
search_exclude: true
---

# Programming Nucleus: editorial plan

Status: active editorial plan. This file is not published book prose.

## Book contract

**Programming Nucleus** teaches a reader who has written a little code how to
write, compile, run and debug complete Nucleus programs. It assumes no Z80
assembly knowledge. Each chapter begins with a programming problem, introduces
only the language needed to solve it and ends with an executable program or a
checked boundary case.

The book has three jobs:

1. teach the practical Nucleus 0.1 language through complete programs;
2. explain its fixed-storage and recoverable-failure model; and
3. show the supported route from source parts to NOBJ, HEX, D8 and Debug80.

The [Nucleus language specification](language/) governs source meaning. The
[runtime and backend contract](runtime/) governs representation and direct Z80
execution. The book explains how to program with those rules; it does not copy
their exhaustive grammar, ABI or capacity catalogues.

## Teaching sequence

### Part I — Scalar programs

1. **A first program** — program variables, a result-free routine, one scalar
   local, assignment, declaration order and the command-line build.
2. **Values and constants** — `u8`, `u16`, `i8`, `i16`, `boolean`, decimal,
   hexadecimal and binary literals, byte characters, inferred scalar constants,
   checked conversion and compile-time `assert`.
3. **Expressions** — arithmetic, signed and unsigned results, comparisons,
   Boolean short-circuiting, integer `not` and `xor`, division, `mod` and exact
   evaluation order.
4. **Decisions** — `if`/`elseif`/`else`, nested conditionals and integer
   `select` with non-falling case bodies.
5. **Loops** — `while`, constant-true non-fallthrough, `for` with `to` and
   `until`, constant-expression steps, signed counters, `exit` and `continue`.

### Part II — Fixed data and shared views

6. **Fixed and nested arrays** — fixed lengths, zero-based checked indexing,
   row-major nested arrays, `.length`, traversal and element stride.
7. **Bounded strings** — fixed capacity, current length, byte content, embedded
   zero bytes, exact-type copying and the sealed runtime representation where it
   affects library design.
8. **Records and aggregate constants** — nominal records, fields, nesting,
   positional static initializers, aggregate constants, direct-root write
   restrictions and exact aggregate assignment.
9. **Open views and text construction** — `T[]`, `string[]`, retained length or
   capacity, open-view indexing, `.capacity`, checked writable string `.length`
   and contextual string-literal arguments. The central example is a bounded
   text-building library routine.

### Part III — Routines and failure

10. **Routines and calls** — scalar parameters and results, scalar locals,
    left-to-right argument evaluation, early return and routine-scope
    shadowing.
11. **Aggregate parameters and results** — alias identity, mutation of caller
    storage, concrete aggregate parameters, transient aggregate results and
    immediate consumption.
12. **Forwards and recursion** — declaration order, sole-signature forwards,
    abbreviated bodies, self-recursion, mutual recursion and activation
    capacity.
13. **Recoverable errors and traps** — failable signatures, `fail`, same-line
    `else fail`, immediate `handle`, required failure consumption, entry failure
    and the separate non-recoverable trap channel.

### Part IV — Programs, targets and tools

14. **Source parts and the system boundary** — ordered multipart compilation,
    explicit source lists, dependency discovery through preserved `//% import`
    comments, one program scope, byte and storage services, typed port access
    and the packet service gateway.
15. **Build, run and debug** — target profiles, NOBJ, flat HEX, D8 source maps,
    source breakpoints and Debug80. Banked NOBJ and per-bank D8 remain a
    separate artifact workflow until Debug80 can launch banked Nucleus targets.

### Appendices

- compiler CLI and exit statuses;
- Node host API and result union;
- project and target schemas;
- diagnostic and published-capacity catalogue;
- artifact glossary and physical-bank rules; and
- chapter-to-specification cross-reference.

## Coverage matrix

This is the sole language-coverage inventory for the book. A language change
requires one update here and one decision about its teaching chapter.

| Specification subject | Course chapter |
| --- | ---: |
| Source bytes, comments, literals and names | 2 |
| Ordered compilation, declaration order and scope | 1, 12, 14 |
| Five scalar types and checked conversion | 2, 3 |
| Fixed arrays, nested arrays and array `.length` | 6 |
| Bounded strings and open string views | 7, 9 |
| Records, aggregate constants and static initialization | 8 |
| Open arrays and aggregate aliases | 9, 11 |
| Expressions and evaluation order | 3, 10 |
| Assignment and call statements | 1, 10, 11 |
| Conditional chains and `select` | 4 |
| `while`, counted loops and transfers | 5 |
| Routines, forwards, recursion and activations | 10–12 |
| Recoverable errors and safety traps | 13 |
| System services, ports and packet gateway | 14 |
| Grammar and complete conformance corpus | Chapter links and appendices |

## Example and evidence policy

Every complete listing has a checked-in `.nu` source file. The documentation
gate compiles every listing with the authoritative Z80 compiler. Examples whose
result matters also run through Debug80 Runtime and compare their observable
state or service transcript with the chapter's claim.

Each chapter records:

- the specification sections that govern its program;
- the executable fixture that checks each complete listing;
- the expected diagnostic and exact source position for deliberate invalid
  excerpts; and
- any published capacity approached by the example.

Generated instruction counts, byte counts and timing appear only when a test
records the current measurement. Tool transcripts are captured from the current
CLI rather than copied from an earlier release.

## Source-material policy

The archived Lanternfly course may supply a teaching problem, diagram concept
or explanatory sequence. Every Nucleus passage and example is written again
against the current specification. Archived syntax is never edited in place and
no archived listing enters the book before the Nucleus example gate accepts it.

Useful concepts for new figures include:

- the first-program state trace;
- nested-array dimensions, stride and bounds;
- record and aggregate-constant storage paths;
- concrete storage bound through an open parameter view;
- recoverable failure beside a terminating trap; and
- ordered source parts flowing through the compiler into NOBJ and D8.

## Production sequence

### Milestone 1 — Restore the foundation

- keep the language and runtime reading editions synchronized with their
  standalone authorities;
- verify the introduction and Chapter 1 against the current compiler;
- maintain this outline and coverage matrix as the only course plan; and
- keep the public book page explicit about work still in progress.

### Milestone 2 — Complete the scalar route

Write and test Chapters 2 through 5. Read them in order with someone who knows
basic programming but not Z80, then repair any definition-before-use or pacing
failure before the data chapters depend on them.

### Milestone 3 — Complete fixed data and routines

Write Chapters 6 through 13. Build the string-construction and open-array
examples as ordinary reusable Nucleus routines so the course demonstrates why
the view types exist.

### Milestone 4 — Complete the toolchain route

Write Chapters 14 and 15 and the appendices against the stabilized CLI, project
schema, Host API, target schema and Debug80 integration. Verify one flat build
from dependency discovery through source-level debugging. Verify banked NOBJ
and per-bank D8 separately without implying that Debug80 launches them.

### Milestone 5 — Release review

- compile and run every complete example;
- check every deliberate diagnostic including part, line and byte column;
- validate internal links and generated navigation;
- run the repository prose gates;
- perform separate teaching-prose and technical reviews; and
- test documented CLI commands on the supported Node releases.

## Publication rules

The generated language and runtime pages are never edited by hand. Their
standalone Markdown authorities are synchronized through the repository
generators. **Programming Nucleus** is maintained here and may summarize a rule
only when it links to the governing chapter and an executable example proves
the use being taught.

The book uses locally linked `@jhlagado/nucleus` and
`@jhlagado/debug80-runtime` packages during development. Registry publication
is independent of the writing schedule.
