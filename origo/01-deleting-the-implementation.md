---
title: "1. Deleting the implementation"
parent: "Delete the Implementation"
nav_order: 2
---

# 1. Deleting the implementation

Most of a program's value is usually taken to be its code. The code took the
time to write, and it is what the tests run and what ships. In Origo the
unit of software is a contract that defines a space of acceptable
implementations. A generator searches that space, and deterministic tools
determine which of its candidates satisfy the contract. The intentions, the
guarantees, the constraints and the architectural decisions that define the
space are mine. The implementation is replaceable, and the contract and the
evidence that something satisfies it are the parts that last.

That is a strong claim, and it comes with a test that can be applied to any
program. Can I delete the implementation without losing the software? With a
good enough contract and good enough checks, deleting a routine's body loses
nothing. A new body can be generated and judged against the same contract.
With weaker ones, the deleted body takes with it something that was never
written down.

## Holes and contracts

The test is applied one routine at a time. A routine with a contract is
called a hole, because the contract describes the shape of the space a body
has to fill. The body currently in place is the incumbent. A body written
from the contract and its visible cases alone is a candidate.

A hole's contract says what the routine guarantees. For a Z80 routine it
states:

- one line saying what the routine computes
- the registers it reads, and the registers and flags it returns
- the registers it changes and the ones it keeps
- the memory it reads and writes
- its size and cycle budgets
- the trap that ends the program and the site it reports

A floating-point multiply's contract names the registers that carry the two
operands and the one that receives the product. It says that an overflow
traps, and it limits the routine's bytes and the T-states of its worst case.
Chapter 2 gives the full list and the reasons for each line.

The contract also declares what is left open. A don't-care line names
outputs that a candidate may leave different from the incumbent's. Declared
incompleteness is part of the contract, because a contract that pinned down
everything would describe the incumbent and nothing else.

## Candidates, gates and landings

A candidate is written from a bundle. The bundle holds the hole's contract
and a third of its test cases. It adds the contracts of the routines on
either side of each call and the memory layouts the hole touches. It also
lists the hazards that earlier attempts ran into. It holds no line of the
incumbent's body. The rest of the cases, a second set of adversarial cases
and the whole system's test suite are held back. Together with the system's
applications they form the oracle, the tests and measurements a candidate
never sees.

Each candidate is then judged by gates. A gate is a pass or fail judgement
on a measured figure. A candidate meets them in this order:

- the contract's own checks
- the visible cases, the held-out cases and the adversarial cases
- the registers and memory it changes, and its trap site
- its size, stack and cycles
- the full system suite with the candidate in place

The cheapest checks run first, and the first failure ends the scoring.

A candidate that passes every gate can replace the incumbent, and that
replacement is called a landing. A landing needs more than a pass. A
differential prober runs the candidate and the incumbent side by side on all
three sets of cases and on random inputs. Each input that gives different
results goes to triage. It falls under an existing don't-care line or one
that triage adds. Otherwise it becomes a new case and a tighter contract.
The candidate must also be smaller or faster than the incumbent, and the
decision to land it is recorded with the evidence that allowed it.

## The deletion radius

The test of the proposition gives the method its measure of progress. For a
set of holes attempted, the deletion radius is the share that has at least
one candidate passing every gate. A hole inside the radius can be deleted
and regenerated. A hole outside it cannot be, yet.

The first round measured on Origo's first study produced a radius of 14 of
14 (P1: CDR-3). The holes were fourteen floating-point routines in the
runtime of a CP/M language. Each received five candidates, written in fresh
contexts by two generators from the bundle alone. The generators worked
without an assembler or the runtime's source. Of the 70 candidates, 57
passed every gate at the first attempt. Ten of the 13 failures never
assembled. Seven used a relative jump beyond its range, and three used an
instruction form the Z80 does not have. The other three failures were about
meaning.

The prober found 1,729 inputs on which a candidate behaved differently from
the incumbent. Eleven of them fell under don't-care lines that already
existed. Two internal routines set the carry flag on overflow, and triage
added a line to both contracts. It declares the registers DE and HL a
don't-care when the carry is set on return. Of the inputs, 1,445 fell under
it. The other 273 came from a single gap in a routine's contract and became
one new obligatory case and a tighter contract.

One candidate for those two routines differed from the incumbent only under
the new line. It was still held back, because the landing rule as run
excluded every candidate with a difference. A don't-care line now releases
what it names (R60). Twelve candidates landed, and the twelve routines
shrank from 1,217 bytes to 810. FMUL's worst case fell from 20,541 T-states
to 4,028, and FDIV's from 19,963 to 7,561. Every hole still passed its
oracle on the landed runtime, and so did the full system suite.

## Limits of the radius

A radius of 14 of 14 says that every hole could be regenerated. It says
nothing about whether regeneration was the reason the code improved. Two
other explanations fit the same figures. The contracts might have been
written so carefully that any single competent attempt would have passed. Or
the gains in size and speed might have come from writing the contracts.
Stating what a routine must do also shows what it can stop doing.

The method's own review of its first two studies reached the same
conclusion. Pass rates had been measured by hole and by generator. The
difference between one careful attempt and the landed best of several had
not been measured. Without a measure of what the loop adds, a successful
round is not evidence that regeneration beats careful engineering judged by
the same gates.

## Failure, class by class

The method now requires every round to measure that difference (M1). Beside
the candidates, each round scores a first-attempt control: each generator's
first attempt, untriaged, judged by the same gates. Where a careful
hand-written implementation or a reference exists, it is scored too. The
round reports its loop gain, the improvement of the landed candidate over
the control in pass rate, size, cycles and disagreements. The protocol
forbids closing a round without the control's row. Review enforces that rule
for now, and a check in the scoring tool that refuses such a round is
planned (M1).

Holes are grouped into classes, such as decoding tables, file access and hot
loops. A class is judged after three rounds. If its loop gain stays within
noise, the class is recorded as one where generation does not pay. Later
holes in it are built once and gated. A hole's objective is the figure its
round sets out to improve, such as size or cycles. Noise is the larger of 5
percent of that objective and the spread between the generators' first
attempts on it (MD-2). The proposition is tested class by class, and it can
fail in any of them.

## The second and third studies

The method's checks do not depend on generation. The second study applied
them to assembly tools, and Part VI reports how. The third study generated
no candidates and improved an operating system stage by stage. From the
stage that built the system's memory allocator to the warm-boot stage, every
stage was modelled on the host before any Z80 was written
(P3: the method review). The study's gates and recorded decisions governed
that work as they do a round. So did its defect ledger, the record of each
defect and the mechanism that found it.

Two of its stages recovered 231 bytes of ROM (P3: the method review). Those
bytes paid for a history of command lines and a faster warm boot. Each study
has a driver, the role that drafts its briefs, registers its gates, records
its decisions and judges each build. Three of the third study's gates had
their ROM limit, the most bytes of ROM a stage's build could add, raised
after a first full build had exceeded it. Those changes were recorded as
delegated, made by the driver under authority I had handed over (MD-5). They
should have come to me as new gates, since the method never delegates such a
change (P3: the method review). Part III describes the stage track that now
sets the order of such work. Part VI reports what the first three studies
found, including those three gates.

## The durable part

Whichever way a class of holes turns out, the contract and its evidence are
what remain. A contract good enough to judge a candidate can also judge the
next change to the same routine, by a generator or a person. The system gate
runs again at every landing, and a study's standing check runs every night.
Each defect that escapes the checks ends in a new case or oracle, a new rule
or a recorded reason why neither is worth it. The implementation can be
deleted when the contract is sufficient. The contract is worth having even
when it is not.

Chapter 2 describes each line of a contract and the reason for it.
