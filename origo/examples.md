---
title: Examples, notation and figures
parent: Origo
nav_order: 2
---

# Examples, notation and figures

Each recurring example has a different job. COPY introduces observable intent.
A bounded string introduces precise relations and composition. A temporary
buffer introduces event ordering. The compiler case studies add physical
constraints after these ideas are familiar.

## COPY: the author's decisions

The opening state table can begin without invented language syntax:

| Situation | Required result | Decision still needed |
| --- | --- | --- |
| Source exists, destination absent | Destination has the source's bytes; source is unchanged | File metadata to preserve |
| Destination already exists | Behaviour must be explicit | Refuse, confirm or replace |
| Source and destination identify the same file | Behaviour must be explicit; preserve existing contents | How to report the request |
| Destination disk fills | Source remains unchanged | Partial destination and old destination policy |

These are proposed teaching requirements rather than an adopted CPC contract.
The chapter must settle its example policies before claiming a complete
specification. It should also distinguish logical content from CP/M's
record-level representation if the example becomes a runnable CP/M utility.

## Bounded strings: defined experimental notation

This uses the frozen LR-01A fragment from the first language trial:

```text
; @lr01a version 1
; @lr01a let old_length : u8 = byte(HL) in STR
; @lr01a let capacity : u8 = D
; @lr01a requires old_length <= capacity
```

HL supplies the address of the old length byte. D supplies the capacity. STR
must be declared by the enclosing bundle and the byte must lie inside it.
For old length 5 and capacity 8 the predicate holds. For 9 and 8 it is false.
This excludes the latter call from the specified domain. It instructs no
runtime check. Publication of a runnable example requires the region binding,
entry snapshot and actual evaluator invocation alongside this fragment.

The existing LR-01A evaluator tests all 65,536 byte pairs for this relation.
Its generation trial did not isolate a benefit over English because other
bundle material still revealed the conditions. The tutorial must retain that
limit when explaining the example.

## Reuse: a proposed abstraction

```text
define valid(s) = length(s) <= capacity(s)
```

This is illustrative spelling, not a currently supported declaration. Its
purpose is to replace repeated conditions with a shared meaning. A chapter
must define the observation state, object identity and representation binding
before using it as an operation's guarantee or requirement.

## Temporary memory: a proposed protocol

```text
acquire -> hold output -> successful write -> release -> reuse
```

This is an event sketch, not executable notation. A contrasting trace places
reuse before the write. Another attempts a write that fails. Both test why an
attempted flush is insufficient evidence that output has been preserved.
The proposed protocol experiment has not yet established a language feature.

## Figure progression

| Figure | Reader's question | Required content |
| --- | --- | --- |
| Before and after COPY | What exactly must remain true? | Named files, bytes and outcome |
| Generation and acceptance | Where is the implementation freedom? | Contract, alternative candidates, independent checks and feedback |
| Logical values and storage | Why do registers appear in a specification? | A relation above its target-specific bindings |
| Connected operations | What does one component establish for another? | Producer outcome, object identity, consumer entry and open premises |
| Buffer lifetime | When can these bytes be reused? | Writes, failure, release and premature reuse |
| Compiler memory | What occupies the machine? | Fixed regions, changing data, stack and operating-system boundary |
| Handover | What survives replacing the executable? | Three successive maps with the same retained objects |

Figures should introduce one relationship at a time. Physical memory drawings
need a named build and matching addresses. Proposed structures need a design
label. Timeline arrows indicate ordering and do not imply proof that every
machine execution follows that order.

## Evidence before tutorial code

Working-language snippets need parser and evaluator runs with expected results
and at least one rejected input. Diagrams need checking against those same
examples. Proposed constructs need explicit semantics before executable
claims. Historical case studies need their frozen reports and measured scope.
All-path proof, recorded execution checks and assumptions must remain distinct.
