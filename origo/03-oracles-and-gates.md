---
title: "3. Oracles and gates"
parent: "Delete the Implementation"
nav_order: 4
---

# 3. Oracles and gates

A requirement is one thing, and the evidence that it is met is another. The
contract states the requirement, as far as its words go. The cases, the system's
tests and the measurements are the evidence. Where the two part, a candidate can
satisfy the evidence and still break the requirement. The round that chapter 1
follows had one such gap, and this chapter starts with it.

## The sign bytes

FP_UNPK is one of the runtime's internal floating-point routines. It
unpacks the two operands of an operation into FP_VAR, the scratch region
that chapter 2 describes. From each operand it takes a mantissa, an exponent
and a sign (P1: FP_UNPK's contract, contracts file at Origo d2eb868). Each
sign goes into a byte of its own, SA for the left operand and SB for the
right. A third sign byte, SR, holds the sign of a result.

A stray bit in those bytes matters because of how a result is built. FADD, FMUL
and FDIV, the floating-point add, multiply and divide, each form SR from SA and
SB, the signs of the two operands. FP_PACK then combines the whole of SR with
the result's top byte, so every bit set in SR is set there too. Only bit 7 of
that byte is the sign. The other seven bits belong to the exponent. A stray bit
in SA or SB can therefore reach the result's exponent and change the number
(P1: CDR-3).

The contract said "sign in bit 7" and nothing about the other bits
(P1: CDR-3). A case can mask bits of the memory it checks, and the checks
then ignore every masked bit. FP_UNPK's cases masked the other bits of SA
and SB, so no case looked at them.

One candidate left bits 6 to 0 of each operand's top byte in SA and SB
(P1: CDR-3). It passed all 294 of its cases, because none of them could
fail it.

The last gate is the system gate. It puts the candidate into the runtime
and runs whole programs. A conformance program is a test program written in
the language, which checks that a part of the language gives the results it
should. The system gate runs the language's conformance programs and
applications with the method's own conformance programs beside them
(P1: CDR-3). With this candidate in place, four conformance programs failed.
The system gate caught what every earlier gate had passed (P1: CDR-3).

The prober should have caught it too. It runs a candidate and the incumbent side
by side, as chapter 1 describes. But it compared memory through the cases'
masks, so it could not see the sign-byte bits either. The candidate reached the
system gate with no recorded difference from the incumbent (P1: CDR-3). The
prober now compares memory unmasked.

Chapter 1 tells what the gap became, one obligatory case and a tighter contract.
The tighter contract reaches beyond one routine. FP_VAR's layout and the
contracts of FP_UNPK and FP_PACK now say the sign bytes hold bit 7 alone. So
does the contract of FP_INT, which reads SR, turning an integer's magnitude and
the sign in SR into a floating-point number. FP_UNPK's cases now check the whole
byte, and an obligatory case holds an input on which the candidate left stray
bits. The candidate now fails all 50 of its visible cases (P1: CDR-3).

The contract named the sign's bit but did not say the other bits must be clear,
and the cases did not test them. Every check but the last trusted the cases.

## Negative zero

Chapter 2 left one question open. It asked what else F2U's two smoke candidates
got wrong. Both trapped on negative zero, the zero whose sign bit is set.
Converted to an unsigned integer, negative zero becomes 0 in the language, and
the incumbent returns 0 (P1: CDR-1).

No F2U case held negative zero. So both candidates passed all 208 of F2U's
cases (P1: CDR-1). A system test is one of the programs the system gate
runs. Both also passed all 271 system tests (P1: CDR-1). Chapter 2 tells
how only the stack figure saw their other fault, the trap they called where
the incumbent jumped.

A hole is only as specified as the checks that judge it. Where no case and no
test covers an input, every check can pass a wrong body with full marks (R18).
The next report made negative zero an obligatory input of F2U. Both candidates
then failed 45 of 74 visible cases, on negative zero and on every case that
traps (P1: CDR-2). A conformance program of the method's own now converts
negative zero, so the system gate sees it too (R21).

## Visible, held-out and adversarial cases

A hole's cases are split once, the same way each time. One third of each
hole's cases are visible, given to the candidate in its bundle. The rest are
held out (P1: CDR-1).

In the first study both sets were drawn from the language's own case
tables. So the held-out cases were of the same kind as the visible ones.
Held-out cases test generalisation, whether a body that passes the cases it
saw also passes unseen ones. Cases of the same kind test it within that
kind, not against an adversary (P1: CDR-1). A body tuned to the visible
cases can exploit anything the held-out cases share with them.

So the method asks for a second source of cases, built from the contract's types
and their boundaries, before any pass rate is quoted (R19). The adversarial
cases are that second source. Chapter 2 describes those at the edges of each
type. The rest are random values. They are all held out, and their pass rates
are reported apart (P1: CDR-2).

A candidate sees only its visible cases. The held-out cases, the
adversarial cases and the system tests are part of the oracle, the tests
and measurements a candidate never sees.

## Two measures apart

A candidate is judged twice. At its hole, the checks run its contract, its
cases and its budgets. In the system, the system gate runs whole programs
with it in place. FP_UNPK's candidate passed the first measure and failed
the second.

The opposite happened in the same round. An I2F candidate failed 56 of 71
visible cases and still passed the whole system gate (P1: CDR-3). No
program in the system checked the conversion at run time that its fault
broke. A conformance program of the method's own now converts negative
integers at run time, and the candidate fails it (P1: CDR-3).

That is the rule for every such gap. A gap the checks find at one hole
becomes a system test that the system gate runs. The candidate that exposed
the gap must fail that test (R21).

The rule does not make a routine's own cases redundant. A system gate checks
only what its programs ask for. A later round had a large routine of 997 bytes
in the linker, the program that joins separately compiled pieces into one
runnable file (P1: CDR-5). Each of its five candidates wrote a wrong map, one of
the files the linker writes. The system gate passed all five, because no test in
the system asks for a map. The routine's own cases were stricter each time
(R22). So a routine keeps its own cases wherever the system's programs do not
reach.

The two measures are therefore counted apart. Correctness at the hole and
integration in the system each find what the other misses. Their agreement on
the same candidates is the signal that the round's gaps are closed (R24). That
agreement shows only if they are counted apart.

## The mutation score

Cases can be measured as well as candidates. A mutant is a copy of a body with
one small change. One instruction or operator is changed or one constant is
moved by one (M8). A branch is a jump, call or return taken only when a flag is
set or clear. One branch may instead be inverted, so that it is taken when the
flag is the other way (M8). A case kills a mutant when the mutant fails it. The
mutation score is the share of the mutants that the cases kill (M8).

Some mutants are equivalent, behaving exactly as the body does, so no case can
kill them. A hole is not bundled until its cases kill at least 95 percent of the
mutants not shown to be equivalent (MD-3). Each mutant that survives is sorted,
as triage sorts the prober's differences. It becomes a new case or is recorded
as equivalent (M8).

The first study's rounds came before the rule, and none of its round reports
mentions mutants. The second study's first scored round has the earliest scores.
Its first mutants exposed three gaps in the cases, and the gaps were closed
(P2: T3). The cases then killed 98.3 to 100 percent of the non-equivalent
mutants for five of its six candidates. The sixth's survivors were not triaged
(P2: T3).

The same record corrects itself. It had said the 95 percent floor applied
only from the next round. It withdraws that sentence (P2: T3). It also
states that the round's holes were bundled and landed without the score the
rule requires (P2: T3). The method was not followed there, and the record
says so.

## Registered gates

Chapter 1 calls a gate a pass or fail judgement on a measured figure. A
gate has five parts, recorded before the measurement it judges (M3):

- the figure
- where the figure comes from
- one input shown to pass and one shown to fail
- the reading of any reference it compares against
- what closes it

The input shown to fail proves that the gate can fail. A gate that nothing
fails judges nothing.

A gate's registration is the writing of its record into the study's
gate file, the one file that holds all of the study's gates. A hash is a
short fingerprint computed from a text, and any change to the text gives a
different hash. Each gate's record is given a hash at registration (M3).
The stage report that uses the gate quotes the hash (M3). So the report
shows that the gate judged its result in the form it was registered. In the
protocol a stage's gates are registered before its one build (MD-8).

The third study's system gate shows the parts at work. Its figure is the
operating system's whole test suite passing, with no test skipped (P3: gates).
One of its inputs shown to fail is a build in which one constant, in the routine
that writes to disk, is moved by one. With that build, a test of the system's
disk calls fails (P3: gates). The stage that showed it calls the build a mutant
(P3: KS0).

The study keeps its hashes in a lock file, a separate file that holds the
SHA-256 hash of each gate's section. It also keeps the hash of every
earlier registration, and each stage report quotes the hashes of the gates
it judged (P3: gates).

A gate can still change, but not quietly. A gate's figure changed after a result
it judges needs my decision, whatever delegation is in force (MD-8). Chapter 1
tells of three gates whose limits were raised after a build and recorded as
delegated. Those changes should have come to me. A gate whose reference or
reading changes after a result it judges is a new gate, and it also needs my
decision. The old gate's result is reported beside the new one (M3).

The third study's system gate has changed in this way. By my decision a
test was removed from the operating system's suite. The gate's figure moved
to the smaller suite, and it was registered again. Results judged under the
earlier list stand as they were reported (P3: gates).

In the protocol a round's gates are registered before anything is scored (MD-8).
Chapter 4 follows a round on one small routine, from its bundle to its landing,
with these checks at each step.
