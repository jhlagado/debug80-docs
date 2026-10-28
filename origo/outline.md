---
title: "Outline"
parent: "Delete the Implementation"
nav_order: 90
---

# Outline

The book climbs a ladder of six ideas. Each part depends on the one before
it.

1. Software can be specified as a contract that admits many
   implementations.
2. A contract is only as good as the checks that judge it.
3. A loop of generation and judgement can replace an implementation, and
   what it adds over one careful attempt can be measured.
4. Where the loop adds nothing, the same checks still govern engineering
   that is built once.
5. The obligations a contract states in English can be moved, one construct
   at a time, into notation with a fixed meaning.
6. A study has records, authority and boundaries, and three studies show
   where all of this works and where it does not.

Two examples run through the book: a round of regeneration on fourteen
floating-point routines (P1: CDR-3), and the stage that made a warm boot 48
times faster (P3: KS18). Smaller examples open each part.

## Part I: The proposition

### 1. Deleting the implementation

The proposition, its test and the deletion radius as the measure of
progress. What the radius shows and what it does not, and how the
proposition can fail class by class (M1, MD-2). *First draft.*

### 2. Contracts

The chapter opens away from the Z80, with a file copy. Copying a file to a
new name is easy to describe until the destination exists, the source and
destination are the same file or the disk fills. A table of those
situations separates what the author must decide from what any
implementation may choose. The chapter then gives a Z80 routine's contract
line by line: what it computes, registers in and out, what it changes and
keeps, memory read and written, size and cycle budgets and traps.
Declared incompleteness and don't-care follow, with the reason comments are
not contracts (R1 to R11).

### 3. Oracles and gates

A requirement is separate from the evidence that it is met. A copy that
passes ordinary examples fails on an empty file or a full disk. The chapter
introduces visible and held-out cases, a second case source and the
mutation score, and shows that a test can expose a mistake in the
specification as well as the code. Gates are registered before the result
they judge, each with an input shown to fail (M3, M8, R18 to R24).

## Part II: The loop

### 4. A round

The twelve steps of a round on one small routine, from bundle to landing:
the bundle, candidates in separate contexts, scoring cheapest first, the
differential prober, triage into don't-care or a tighter contract, and the
landing (P1: CDR-3).

### 5. Large routines

Small holes passed at high rates and large ones at none until their
interfaces were written as rules, each round's notes naming the next rule
(P1: CDR-5, CDR-6, R12, R13).

### 6. Loop gain

The first-attempt control, what the loop adds over it, the overlap of two
generators' failures, and the classes of hole where generation does not pay
(M1, M9).

## Part III: The stage

### 7. Built once

The stage track: need, brief, review, model, gate, build, measure, record,
review. The running example is the warm boot, from its measured cost of
3,866,040 T-states to 81,040 (P3: KS18).

### 8. The model before the gate

Three stages were re-cut on a host model's figures before any Z80 was
written. The chapter shows why a figure set from the model is still set
before the measurement it judges (P3: KD-53, KD-61, KD-64).

### 9. Structural change through contracts

The first study's largest gains came from design changes modelled first
and built through contracts: memory regions, overlays and the handover of
data from one program to the next. The chapter follows what survives when
one program's code is replaced by another's, and separates measured stages
from a design's modelled benefit (P1: CDR-12 to CDR-19).

### 10. Reviews find most defects

The defect ledger records what found each defect. Across the studies,
review and use found most of them and the oracles found few. The chapter
shows how reviews are planned and scored as a stage of the loop (M4, M5;
P2: the brief reviews; P3: the defect ledger).

## Part IV: The specification language

### 11. Obligations still in English

Rounds keep producing obligations stated in prose: a sign byte that must
hold bit 7 alone, a counter a routine leaves for its caller, a callback
protocol. The language track records them and tests whether notation can
carry them. A candidate passing under new notation shows the bundle was
usable, not that the notation meant one thing.

### 12. Notation with a fixed meaning

Values, names and conditions, starting with a bounded value before any
register or address: a string's length against its capacity, stated in the
first experimental fragment and checked by its evaluator over all 65,536
byte pairs (P1: LR-01A). Outcomes and permitted change follow, with the
limits of what the fragment can state.

### 13. Reuse, composition and protocols

Proposed constructs, labelled as research: a predicate defined once and
reused, a guarantee passed from one routine to its caller, and obligations
over time such as a buffer that must not be reused before its output is
written. The chapter ends by asking whether the constructs justify their
cost, and reports a negative result if abstraction gives little practical
benefit.

## Part V: Running a study

### 14. Records

Decisions with their authority, the ledgers, and cost against outcome (M6,
M11, M12).

### 15. Studies apart

Separation, lexicons, pins and proposals between studies that depend on
each other.

### 16. The protocol

The order of work, what must exist before each step, and when the person
driving a study stops and asks (MD-8).

## Part VI: What the studies show

### 17. The first study

A language toolchain for CP/M, regenerated hole by hole and restructured
through contracts.

### 18. The second study

Assembly tools built on another study's operating system, pinned to one of
its commits and moved only by decision.

### 19. The third study

An operating system improved stage by stage, with no regeneration, and the
places where the method was not followed (P3: the method review).

### 20. Open problems

Independence, specification correctness, generator diversity, static
checks of what a routine changes, and what a byte is worth.

## Back matter

- **Appendix A.** The rules in short.
- **Appendix B.** Record formats: a contract, a gate, a decision, a defect
  row.
- **Glossary.**

## Open decisions

- The title.
- Whether the studies' records are published beside the book, since every
  citation points into them.
