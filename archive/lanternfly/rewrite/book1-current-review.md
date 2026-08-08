# Book One editorial review — resolved

> **Status:** Resolved. The manuscript changes requested by this review have
> been applied. This file is retained as editorial history and does not list
> the current Book One defects.

## Scope

This report reviews the current sixteen-chapter Book One after the revision
that applied the earlier editorial brief. It reads the book as a course for an
experienced programmer learning Lanternfly's choices: exact types, fixed
storage, declaration order, checked access and explicit machine boundaries.

The governing technical authority is the Lanternfly 0.6 implementation
baseline and the Candlemoth direction. Candlemoth is the normative minimal
self-hosting target. Book One should describe the language and its tools, not
project history or retired assembler-pipeline details.

## Overall judgment

The revision is substantial and successful. The prose now usually begins with
a concrete program state, names the relevant rule, and gives its consequence.
It no longer reads as if a topic has been selected and then surrounded with
generic explanatory sentences. The book has a coherent complete route:
values and storage; control and data structure; routines, identity and
modules; text, expected failure and cleanup; then the machine boundary.

The principal remaining risk is compression, not empty prose. Several
chapters carry a sound sequence of ideas but introduce one more exception,
classification or lowering detail than the reader needs at that point.

## What the revision has completed

- The introduction is short, orienting and free of the old AZM pipeline and
  absent-compiler explanation.
- The intended reader is now a programmer, not a total beginner. Chapter One
  teaches Lanternfly's model rather than explaining variables in general.
- `ordinal`, row-major order, aggregate and depth-first import resolution are
  defined before their later use.
- The book-wide self-description rule is substantially followed. Forward
  references now usually state what a later chapter explains instead of making
  topics "wait" or "arrive."
- The split between expressions and comparisons gives each chapter a clearer
  job.
- The string representation includes a concrete consequence of breaking its
  invariant.
- The final movement has been strengthened by Chapters 14 and 15: expected
  failure, propagation and cleanup now lead naturally to Chapter 16's machine
  boundary.
- Chapter 16 ends on the language-reference handoff rather than a broad claim
  of reader mastery.

## Writing-agent directions

For each item below, preserve the normative Lanternfly 0.6 facts and the
existing complete-program examples. Apply the smallest change that repairs the
reader's route. Do not add implementation history, a compiler-availability
caveat, or obsolete assembler-pipeline material.

### Blocker: capability-gated code appears before its required import

**Exact evidence:** Chapter 2 opens its declaration block with
`var elapsedSeconds as u32 = 0`; the enabling import appears only later in
prose. Chapter 3 shows `var combined as i32 = 0` in a standalone excerpt,
then says that the enclosing module states the import.

Chapter 2 presents `var elapsedSeconds as u32 = 0` before showing the required
`standard/wide32.lafy` import. The prose immediately says that the declaration
is legal only in a module with that import, but the first displayed program
still appears invalid. Chapter 3 does the same with its `i32` conversion
excerpt, then explains that the enclosing module needs the import.

**Reader consequence:** a book that teaches declaration order and exact source
rules opens an early example with an unstated prerequisite.

**Smallest repair:** either put the import in the displayed module before the
first gated use, or use only kernel integer types in the early examples and
introduce the capability as a deliberate later extension.

**Keep / cut / move:** keep the fact that 32-bit types are capability-gated.
Keep an import beside any complete example that uses them. Cut the invalid
appearance created by a bare gated declaration. Do not move capability-gating
out of the book altogether; Chapter 12 gives it a proper conceptual home.

### Significant: Chapter 3 remains the densest early chapter

**Exact evidence:** the sequence from `## Arithmetic operators` through
`## Literal context` includes division and remainder, shifts, `sqrt`, result
widths, widening, narrowing, signedness conversion, mixed-width arithmetic,
round-trip allowance and literal typing.

The split that moved comparisons to Chapter 4 is a clear improvement. Chapter
3 nevertheless moves through division, remainder, shifts, square root, result
widths, widening, narrowing, signedness conversion, mixed-width calculation,
round-trip allowance and literal context in one run. Each paragraph is clear;
the reader has little room to consolidate one rule before the next arrives.

**Smallest repair:** retain the needed route--result widths and explicit
conversion--but subordinate shifts, square root and power to a compact aside
or Book Two reference. Do not add more examples until the central width model
has space to settle.

**Keep / cut / move:** keep the opening measurement example, byte-result
table, widening, narrowing and literal-context rule. Move or visibly demote
`sqrt`, shifts and the power cross-reference. Do not split comparisons back
into this chapter; their separate Chapter 4 treatment is working.

### Significant: optional capability details interrupt Chapters 2 and 8

**Exact evidence:** Chapter 2 interrupts the integer table with the paragraph
beginning "The two 32-bit rows carry one extra obligation." Chapter 8
interrupts the counted-string layout with the paragraph beginning "A capacity
above 254."

The wide-integer and long-string capability paragraphs are correct, but both
interrupt an ordinary introductory explanation with a facility the reader does
not yet need. Chapter 12 later provides the natural home for service and
capability modules.

**Smallest repair:** mention the import only where a displayed example needs
it, and keep the complete category explanation in Chapter 12 and Book Two.

**Keep / cut / move:** keep the ordinary `u8`, `i8`, `u16`, `i16` and
short-string model in its uninterrupted explanatory run. Move the detailed
capability rationale to Chapter 12; retain only a compact local requirement
where an actual source example needs it.

### Significant: Chapter 10 is conceptually overloaded

**Exact evidence:** one chapter moves from parameters and returns through
locals, aggregate parameters, early return, `forward sub`, mutual calls and
target-dependent recursion.

Parameters, returns, locals, aggregate parameters, early return, forward
declarations, mutual recursion and target-dependent recursion are all correct
and well written. Together they make this the book's most demanding middle
chapter.

**Smallest repair:** keep parameters, results, locals and aggregate parameters
as the main chapter. Treat forward declarations and recursive call graphs as a
late section with a more explicit "advanced case" boundary, or move them into
a small following chapter if the book can support one.

**Keep / cut / move:** keep the parameter, result, local and aggregate-alias
explanations together; they answer one routine-design question. Keep the
forward-declaration example if the book retains recursion here, but preface it
as an advanced declaration-order case. Move no normative rule unless the
author elects to create a separate chapter.

### Significant: Chapter 15 changes register in its Cost section

**Exact evidence:** the Cost section says that a candidate Z80 lowering raises
a failure in three instructions, assigns byte counts to `or fail`, and
describes tail-position folding, frames and code layout.

The chapter's teaching work is excellent: `or fail`, defaults and `defer` all
answer what happens when expected failure crosses routine layers. The Cost
section then turns to candidate Z80 lowering, exact instruction counts,
conditional returns, tail-position folding and frames.

**Reader consequence:** implementation accounting interrupts a chapter about
using a source-level error model.

**Smallest repair:** retain the source-level fact that programs without
failable routines pay no cost for error machinery. Move the exact byte and
instruction account, including candidate-lowering claims, to Book Two.

**Keep / cut / move:** keep one short source-level cost principle: a program
that never uses failable routines carries none of their machinery. Move exact
instruction and byte counts, candidate-lowering terminology, tail-position
folding and frame details to Book Two. Do not cut the preceding `defer`
example; it is the chapter's strongest reason for the feature.

### Significant: Chapter 5's performance aside is secondary

**Exact evidence:** the final sentence of `## Ordered conditions` adds that
frequency and cost can guide branch order because each reached comparison costs
instructions.

**Reader consequence:** the chapter has just established policy priority, and
the performance qualification risks making readers treat the two concerns as
equally important.

**Smallest repair:** make policy order the final point of the paragraph; keep
performance as a short optional sentence only if this book needs it.

**Keep / cut / move:** keep the example where an error takes priority over a
completed batch. Cut or move the general instruction-cost guidance to Book
Two if the paragraph becomes crowded.

### Significant: Chapter 12's capability section needs a narrower job

**Exact evidence:** `## The standard modules` distinguishes service modules,
capability modules, their export behaviour, module-local authorization,
contiguous import prefixes, namespace ownership and unused-import cost.

**Reader consequence:** the central lesson--how one program grows past one
file--briefly becomes a complete reference entry on optional facilities.

**Smallest repair:** give the section one job: distinguish a service import
that supplies names from a capability import that legalizes a feature. Defer
namespace and unused-import detail to Book Two.

**Keep / cut / move:** keep the two import kinds and one concrete example of
each. Move contiguous-prefix repetition, shadowing detail and byte-cost detail
to Book Two unless the module example immediately needs them.

## Chapter notes

The following notes are not general praise. They state what must be preserved
while revising the findings above and identify the narrow, lower-priority
changes available in each group of chapters.

### Introduction and Chapters 1--4

The introduction now does its intended work: it orients without leaking
internal development history. Its language paragraph is dense but accurate;
the reader model and hand-tracing method are clear.

Chapter 1 is the clearest early improvement. One calculation establishes
static storage, declaration order, entry and assignment. The entry-point
definition has several qualifiers in one sentence, but they are useful facts
rather than filler.

**Preserve:** the single calculation, before-and-after trace, and explicit
distinction between static storage and execution. **Optional polish:** split
the entry-point qualifiers only if the sentence cannot be read cleanly aloud;
do not remove a real entry constraint merely to shorten it.

Chapter 2 is matter-of-fact and well paced once the early capability detour is
removed. Chapter 3 has purposeful prose but too much subject matter. Chapter
4 is the strongest early chapter: comparison, Boolean control, masks and
precedence follow a clear practical line.

**Preserve:** Chapter 4's order from comparisons to Boolean combinations to
mask tests. **Do not restore:** the earlier combined expressions-and-
comparisons chapter.

### Chapters 5--8

Chapter 5 defines ordinal exactly where the reader needs it and gives
decisions a credible state-machine problem. The performance aside on branch
frequency is true but secondary to policy order.

Chapter 6 distinguishes loop forms through their stopping rules. The revised
local-variable explanation is plain and appropriately limited.

**Preserve:** the stopping-rule table and the narrow local-variable model.
**Do not add:** the full parameter or recursion model here.

Chapter 7 has a productive density: array shape, access, traversal and layout
support one another, and the first-use definitions now land correctly.

**Preserve:** the row-major definition before traversal and the aggregate
definition before later aggregate use. **Do not split:** the chapter unless a
specific reader test shows that the current signposts fail.

Chapter 8 gives strings a convincing practical problem--capacity differs from
current length--then makes their representation and sealing concrete. The
long-string capability detail is the only significant interruption.

**Preserve:** the broken-invariant example. **Move:** only the extended
long-string capability explanation, not the ordinary layout or terminator
account.

### Chapters 9--12

Chapter 9 is strong because every record claim becomes an offset or a layout.
The brief alias preview is useful rather than distracting.

**Preserve:** diagrams, offsets and the brief alias bridge into Chapter 11.

Chapter 10 is excellent at the sentence level but full at the chapter level;
the forward-declaration and recursion material is the pressure point.

Chapter 11 provides a clear identity model without pointers. Its spatial
validity explanation is among the book's best passages.

**Preserve:** the saved-index example and its distinction between in-range
storage and the same logical entity.

Chapter 12 makes modules necessary, then explains privacy and import order
through a small program. Its depth-first paragraph now gives the process
before the label. The capability-module section is correct but reference-heavy.

### Chapters 13--16

Chapter 13 earns portable text I/O after the earlier programs have left results
in storage. Its split `readLine` explanation makes the ordinary and overflow
cases easier to follow. The capacity-generic exception is now short enough to
remain here.

**Preserve:** the separate ordinary-fit and overflow paragraphs, and the
source-level statement of the two exceptions. **Do not restore:** internal
carrier layout details.

Chapter 14 is a successful teaching chapter. The number-entry program earns
the distinction between a fault and an expected error, and the queued-input
example proves why cleanup precedes `fail`.

**Preserve:** raw-key cleanup before `fail`; it is the concrete demonstration
that prevents the error model from becoming abstract.

Chapter 15 gives propagation, defaults and cleanup one connected purpose. Its
only major interruption is the Cost section described above.

Chapter 16 is a deliberate reference-dense ending, but it earns that density
as the controlled boundary between source and platform. The near/far bridge
correctly prevents a pointer misunderstanding, and the ending is restrained.

**Preserve:** the three-tier distinction, the near/far bridge and the quiet
Book Two handoff. **Do not add:** historical compiler-pipeline material.

## Voice and self-description

No pervasive promotional language, generic consensus, chat residue or broad
AI-style filler remains. The revision has markedly reduced false narrative
agency in its chapter transitions. Remaining forward references are usually
functional; keep checking that they identify the chapter's action and explain
why deferral helps the current explanation.

The preferred continuing voice is direct and professional: a knowledgeable
teacher explaining a concrete language decision to someone who already
programs. Preserve the book's examples, traces and diagrams. Do not replace
them with a denser catalogue of rules.

## Priority order

1. Repair the capability-gated examples so every displayed source fragment
   satisfies its own stated prerequisites.
2. Decide whether Chapter 3's optional numerical material is reduced or
   visibly demoted.
3. Decide how Chapter 10 signals or separates forward declarations and
   recursion.
4. Move Chapter 15's detailed lowering and cost account to Book Two while
   retaining the source-level cost principle.
5. Trim capability-module exposition in Chapters 2, 8 and 12 after the
   preceding decisions are settled.
