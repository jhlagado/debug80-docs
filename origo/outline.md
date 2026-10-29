---
title: "Outline"
parent: "Delete the Implementation"
nav_order: 90
---

# Outline

The book climbs a ladder of six ideas. Each part depends on the one before
it.

1. Software can be specified as a contract that admits many implementations
2. A contract is only as good as the checks that judge it
3. A loop of generation and judgement can replace an implementation, and what it adds over one careful attempt can be measured
4. Where the loop adds nothing, the same checks still govern engineering that is built once
5. The obligations a contract states in English can be moved, one construct at a time, into notation with a fixed meaning
6. A study has records, authority and boundaries, and the first three studies' results mark the method's successes and its failures

The first of two examples that run through the book is a round of
regeneration on fourteen floating-point routines (P1: CDR-3). The second is
the stage that made a clean warm boot about 48 times faster (P3: KS18), and
smaller examples open each part.

## Part I: The proposition

### 1. Deleting the implementation

The proposition, its test and the deletion radius as the measure of
progress. The chapter sets out what the radius shows and what it does not.
It ends on how the proposition can fail class by class (M1, MD-2). *The
chapter is in first draft.*

### 2. Contracts

The chapter opens with the contract of FMUL, the floating-point multiply
that chapter 1 sketches, from the round the book follows (P1: CDR-3). The
contract is quoted from the records at a named commit, and its
size and cycle limits are the ones set after the round. A table takes it
line by line: what it computes, registers in and out, what it changes and
keeps, memory read and written, size and cycle budgets and its trap.
Declared incompleteness and don't-care follow, with the reason comments are
not contracts (R1 to R11).

### 3. Oracles and gates

A requirement is separate from the evidence that it is met. The example is
the round's one contract gap (P1: CDR-3). The contract of the sign bytes
said "sign in bit 7", and the cases masked the other bits. A candidate that
left those bits set passed all its cases. The system gate caught it when
four conformance programs failed. The prober had missed it because it
compared memory through the cases' masks. The single gap became one
obligatory case and a tighter contract. An earlier case table that passed
two wrong candidates on negative zero is cited briefly (P1: CDR-1).

The chapter then introduces visible and held-out cases, an adversarial
second source and the mutation score. Gates are registered before the result they
judge, each with an input shown to fail (M3, M8, R18 to R24).

## Part II: The loop

### 4. A round

The twelve steps of a round on one small routine, from bundle to landing.
The steps cover the bundle, candidates in separate contexts and scoring
cheapest first. Then come the differential prober, triage into don't-care
or a tighter contract and the landing (P1: CDR-3).

### 5. Large routines

Small holes passed at high rates and large ones at none until their
interfaces were written as rules. Each round's notes named the next rule
(P1: CDR-5, CDR-6, R12, R13).

### 6. Loop gain

The first-attempt control and what the loop adds over it. The overlap of
two generators' failures, and the classes of hole where generation does not
pay (M1, M9).

## Part III: The stage

### 7. Built once

The stage track: need, brief, review, model, gate, build, measure, record,
review. The running example is the warm boot. Its measured cost fell from
3,866,040 T-states to 81,040 for a clean warm boot (P3: KS18).

### 8. The model before the gate

Three stages were re-cut on a host model's figures before any Z80 was
written. A figure taken from the model is still set before the measurement
it judges (P3: KD-53, KD-61, KD-64).

### 9. Structural change through contracts

The first study's largest gains came from design changes modelled first and
built through contracts. They were memory regions, overlays and the
handover of data from one program to the next. The chapter follows what
survives when one program's code is replaced by another's. It separates
measured stages from a design's modelled benefit (P1: CDR-12 to CDR-19).

### 10. Reviews find most defects

The defect ledger records what found each defect. Across the studies,
review and use found most of them and the oracles found few. Reviews are
planned and scored as a stage of the loop (M4, M5), (P2: the brief
reviews), (P3: the defect ledger).

## Part IV: The specification language

### 11. Notation with a fixed meaning

Rounds left obligations stated in English, such as a sign byte that must
hold bit 7 alone, a counter a routine leaves for its caller and a callback
protocol. Chapter 3 contains the account of how the sign byte's obligation
was found.
The language track records such obligations and tests whether notation can
carry them. A candidate passing under new notation shows the bundle was
usable, not that the notation meant one thing.

The first experimental fragment then states values, names and conditions.
It starts with a bounded value before any register or address: a string's
length against its capacity. The fragment's evaluator checked that
condition over all 65,536 byte pairs (P1: LR-01A). Outcomes and permitted
change follow, with the limits of what the fragment can state.

### 12. Reuse, composition and protocols

Proposed constructs, labelled as research, begin with a predicate defined
once and reused. The second is a guarantee passed from one routine to its
caller. The third is an obligation over time, such as a buffer that must
not be reused before its output is written. The chapter ends by asking
whether the constructs justify their cost. It reports a negative result if
abstraction gives little practical benefit.

## Part V: Running a study

### 13. Records

Decisions with their authority, the ledgers and cost against outcome (M6,
M11, M12).

### 14. Studies apart

Separation, lexicons, pins and proposals between studies that depend on
each other.

### 15. The protocol

The order of work and what must exist before each step. The cases in which
the person driving a study stops and asks (MD-8).

## Part VI: The studies' results

### 16. The first study

A language toolchain for CP/M, regenerated hole by hole and restructured
through contracts.

### 17. The second study

Assembly tools built on another study's operating system, pinned to one of
its commits and moved only by decision.

### 18. The third study

An operating system improved stage by stage with each stage built once, and
the places where the method was not followed (P3: the method review).

### 19. Open problems

Independence, specification correctness, generator diversity, static
checks of what a routine changes and what a byte is worth.

## Back matter

- **Appendix A.** The rules in short
- **Appendix B.** Record formats: a contract, a gate, a decision, a defect row
- **Glossary**

## Open decisions

- The title
- Whether the studies' records are published beside the book, since every citation points into them
