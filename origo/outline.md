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
the stage that made a clean warm boot about 48 times faster with the serial
console (P3: KD-72). Each part opens with smaller examples of its own.

## Part I: The proposition

### 1. Deleting the implementation

The proposition, its test and the deletion radius as the measure of
progress. The chapter sets out what the radius shows and what it does not.
It then shows how the proposition can fail class by class (M1, MD-2). It
ends on how the same checks governed the third study's work. *The chapter is
in first draft.*

### 2. Contracts

The chapter opens with the contract of FMUL, the floating-point multiply
that chapter 1 sketches, from the round the book follows (P1: CDR-3). The
contract is quoted from the records at a named commit. Its cycle limit of
4,655 T-states was set after the round, when a later round returned FMUL to
an earlier body (P1: CDR-6). Its size limit of 349 bytes dates from before
the round (P1: CDR-1). A table takes it line by line: what it computes,
registers in and out, what it changes and keeps, memory read and written,
size and cycle budgets and its trap. Declared incompleteness and don't-care
follow, with the reason comments are not contracts (R1 to R11).

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
second source and the mutation score. A gate is registered when it is
written and hashed in the study's gate file (MD-8). Gates are registered
before the result they judge, each with an input shown to fail
(M3, M8, R18 to R24).

## Part II: The loop

### 4. A round

The twelve steps of a round on one small routine, from bundle to landing.
The steps cover the bundle, candidates in separate contexts and scoring
cheapest first. Then come the differential prober, triage into don't-care or
a tighter contract and the landing (P1: CDR-3).

### 5. Large routines

Small holes passed at high rates and large ones at none until their
interfaces were written as contracts. Each round's notes named the next
interface rule (P1: CDR-5, CDR-6). The chapter states the two rules that
came of that work (R12, R13).

### 6. Loop gain

The first-attempt control and what the loop adds over it. The overlap of two
generators' failures, and the classes of hole where generation does not pay
(M1, M9).

## Part III: The stage

### 7. The stage track

The nine steps of a stage built once: need, brief, review, model, gate,
build, measure, record and review (MD-8). The running example is the warm
boot. With the serial console a warm boot took 3,866,040 T-states before the
stage (P3: KB-6). After the stage a clean warm boot took 81,040 (P3: KD-72).
The stage ran before the track was written, and the chapter names where it
departed from it. Its gate was registered before the model, and a limit
raised after the build was recorded as delegated. It took four decisions
where the track asks for one (P3: KD-69 to KD-72). No review of its brief or
its result is recorded.

### 8. The model before the gate

One stage was re-cut on a host model's figures before any Z80 was written
(P3: KD-64). Another was re-cut after a first full build had exceeded its
ROM limit (P3: KD-53). One more was re-cut for the same reason (P3: KD-61).
A figure taken from the model is still set before the measurement it judges.

### 9. Structural change through contracts

The first study's largest gains came from design changes modelled first and
built through contracts. In its disk programme two designs landed
(P1: CDR-14, CDR-18). One made the build 5.5 to 7.9 percent faster and the
other 14.0 to 17.9 percent. Its later architecture stages gave the compile a
room in free memory (P1: CDR-26). They also built a handover of data from
one program to the next (P1: CDR-28). The chapter follows what survives when
one program's code is replaced by another's. It separates measured stages
from a design's modelled benefit.

### 10. Reviews and the defect ledger

The defect ledger records each defect and what found it. In the second
study's ledger, review found 102 of 131 and use found 16
(P2: the defect ledger). Of the third study's first 44 defects, review found
24 and use 12 (P3: the method review). The oracles found few in either, and
the first study keeps no defect ledger. Reviews are planned and scored as a
stage of the loop (M4, M5).

## Part IV: The specification language

### 11. Notation with a fixed meaning

Rounds left obligations stated in English, such as a sign byte that must
hold bit 7 alone, a counter a routine leaves for its caller and a callback
protocol. Chapter 3 contains the account of how the sign byte's obligation
was found. The language track records such obligations and tests whether
notation can carry them. A candidate passing under new notation shows the
bundle was usable, not that the notation meant one thing.

The first experimental fragment then states values, names and conditions. It
starts with a bounded value before any register or address: a string's
length against its capacity. The fragment's evaluator was checked on all
65,536 byte pairs for that condition, each against truth computed separately
(P1: LR-01A). Outcomes and permitted change follow, with the limits of what
the fragment can state.

### 12. Reuse, composition and protocols

Proposed constructs, labelled as research, begin with a predicate defined
once and reused. The second is a guarantee passed from one routine to its
caller. The third is an obligation over time, such as a buffer that must not
be reused before its output is written. The chapter ends by asking whether
the constructs justify their cost. It reports a negative result if
abstraction gives little practical benefit.

## Part V: Running a study

### 13. Records

Decisions with their authority, the ledgers and cost against outcome
(M6, M11, M12).

### 14. Studies apart

Separation, lexicons, pins and proposals between studies that depend on each
other.

### 15. The protocol

The order of work and what must exist before each step. The cases in which
the study's driver stops and asks (MD-8).

## Part VI: The studies' results

### 16. The first study

A language toolchain for CP/M, regenerated hole by hole and restructured
through contracts.

### 17. The second study

Assembly tools built on another study's operating system, pinned to one of
its commits and moved only by decision.

### 18. The third study

An operating system improved stage by stage. In most stages the one build
was the landing, and two stages were re-cut after a first full build
(P3: the method review). The chapter also reports the places where the
method was not followed.

### 19. Open problems

Independence, specification correctness, generator diversity, static checks
of what a routine changes and what a byte is worth.

## Back matter

- **Appendix A.** The rules in short
- **Appendix B.** Record formats: a contract, a gate, a decision, a defect row
- **Glossary**

## Open decisions

- The title
- Whether the studies' records are published beside the book, since every citation points into them
