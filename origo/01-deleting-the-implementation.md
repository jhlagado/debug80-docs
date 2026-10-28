---
title: "1. Deleting the implementation"
parent: "Delete the Implementation"
nav_order: 2
---

# 1. Deleting the implementation

Most of a program's value is usually taken to be its code. The code is what
took the time to write, what the tests run and what ships. In Origo the unit
of software is a contract that defines a space of acceptable
implementations. A generator searches that space, and deterministic tools
determine which of its candidates satisfy the contract. The intentions, the
guarantees, the constraints and the architectural decisions that define the
space are mine. The implementation is replaceable. The contract and the
evidence that something satisfies it are the parts that last.

That is a strong claim, and it comes with a test that can be applied to any
program. Can I delete the implementation without losing the software? If the
contract and its checks are good enough, deleting a routine's body loses
nothing, because a new body can be generated and checked against the same
contract. If they are not good enough, the deleted body took something with
it that was never written down.

## Holes and contracts

The test is applied one routine at a time. A routine with a contract is
called a hole, because the contract describes the shape of the space a body
has to fill. The body currently in place is the incumbent. A body written
from the contract alone is a candidate.

A hole's contract says what the routine guarantees. For a Z80 routine it
states:

- one line saying what the routine computes;
- the registers it reads, and the registers and flags it returns;
- the registers it changes and the ones it keeps;
- the memory it reads and writes;
- its size and cycle budgets;
- what it does with an input out of range.

A floating-point multiply's contract names the registers that carry the two
operands and the one that receives the product. It says what happens on
overflow. It limits the routine's bytes and the T-states of its worst case.
Chapter 2 gives the full list and the reasons for each line.

The contract also declares what is left open. A rounding mode that no caller
depends on, or the contents of a scratch register on return, can be declared
a don't-care. Two candidates that differ only there are both acceptable.
Declared incompleteness is part of the contract. A contract that pinned down
everything would describe the incumbent and nothing else.

## Candidates, gates and landings

A candidate is written from a bundle. The bundle holds the hole's contract
and a third of its test cases. It adds the contracts of the routines on
either side of each call, the memory layouts the hole touches and the
hazards that earlier attempts ran into. It holds no line of the incumbent's
body. The rest of the cases, a second set of adversarial cases and the whole
system's test suite are held back.

Each candidate is then judged by gates. A gate is a pass or fail judgement
on a measured figure. A candidate meets them in this order:

- the contract's own checks;
- the visible cases, the held-out cases and the adversarial cases;
- the registers and memory it changes;
- its size, stack and cycles;
- the full system suite with the candidate in place.

The cheapest checks run first, and the first failure ends the scoring.

A candidate that passes every gate can replace the incumbent. That
replacement is called a landing. A landing needs more than a pass. A
differential prober runs the candidate and the incumbent side by side on
generated inputs. Each input that gives different results must fall under a
declared don't-care, or it is a defect. The candidate must also be smaller
or faster than the incumbent, and the decision to land it is recorded with
the evidence that allowed it.

## The deletion radius

The test of the proposition gives the method its measure of progress. For a
set of holes attempted, the deletion radius is the share that has at least
one candidate passing every gate. A hole inside the radius can be deleted
and regenerated. A hole outside it cannot, yet.

The first round measured on Origo's first study produced a radius of 14 of
14 (P1: CDR-3). The holes were fourteen floating-point routines in the
runtime of a CP/M language. Each received five candidates, written in fresh
contexts by two generators from the bundle alone, with no assembler and no
access to the runtime's source. Of the 70 candidates, 57 passed every gate
at the first attempt. Ten of the 13 failures never assembled: seven used a
relative jump beyond its range, and three used an instruction form the Z80
does not have. Only three failed on meaning.

The prober found 1,729 inputs on which a candidate behaved differently from
the incumbent. Of those, 1,456 fell under the contracts' don't-care lines.
The other 273 exposed a gap in a contract, and each became a new required
case and a tighter contract. Twelve candidates landed. The twelve routines
shrank from 1,217 bytes to 810. FMUL's worst case fell from 20,541 T-states
to 4,028, and FDIV's from 19,963 to 7,561. Every hole still passed its
oracle on the landed runtime, and so did the full system suite.

## Limits of the radius

A radius of 14 of 14 says that every hole could be regenerated. It does not
say that regeneration was the reason the code improved. Two other
explanations fit the same figures. The contracts might have been written so
carefully that any single competent attempt would have passed. Or the gains
in size and speed might have come from writing the contracts. Stating what a
routine must do also shows what it can stop doing.

The method's own review of its first two studies reached the same
conclusion. Pass rates had been measured by hole and by generator, but the
difference between one careful attempt and the landed best of several had
not. The first study's largest gains came from structural changes that were
modelled first and then built through contracts. Its local regeneration gave
smaller ones (P1: CDR-12 to CDR-19 against CDR-3 to CDR-11). Without a
measure of what the loop adds, a successful round is not evidence that
regeneration beats careful engineering judged by the same gates.

## Failure, class by class

Origo now measures that difference on every round. Beside the candidates,
each round scores a first-attempt control: the first candidate from each
generator, untriaged, judged by the same gates. Where a careful hand-written
implementation or a reference exists, it is scored too. The round reports
its loop gain, which is what the landed candidate gains over the control in
pass rate, size, cycles and disagreements. A round cannot close without the
control's row.

Holes are grouped into classes, such as decoding tables, file access and hot
loops. A class is judged after three rounds. If its loop gain stays within
noise, the class is recorded as one where generation does not pay. Later
holes in it are built once and gated. Noise is the larger of 5 percent of
the hole's objective and the spread between the generators' first attempts
on it (MD-2). The proposition is tested class by class, and it can fail in
any of them.

The second and third studies used the rest of the method without generation.
Neither generated a candidate. The third completed eighteen stages of
ordinary engineering on an operating system, each judged by gates, and the
designs of its later stages were modelled on the host before any Z80 was
written (P3: KS11 to KS18). One of those stages made the warm boot about 48
times faster, and others recovered ROM space for new features. The gates,
the defect ledger and the recorded decisions governed that work as they
govern a round. Three of its gates had a limit raised after a build had
exceeded it, which the method allows only by my decision. Part III describes
the stage track, and Part VI reports what the three studies found, those
three gates among it.

## The durable part

Whichever way a class of holes turns out, the contract and its evidence are
what remain. A contract that was good enough to judge a candidate is good
enough to judge the next change to the same routine, whether a generator or
a person writes it. The gates that judged a landing run again on every later
change, and a defect found once becomes a case that is checked from then on.
The implementation can be deleted when the contract is sufficient, and the
contract is worth having even when it is not.

Chapter 2 describes each line of a contract and the reason for it.
