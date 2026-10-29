---
title: "Preface"
parent: "Delete the Implementation"
nav_order: 1
---

# Preface

Code generators now write code faster than anyone can read it. A programmer
who uses one has a choice to make about every routine it writes. One choice
is to read the code and take responsibility for it line by line. The other
is to trust it and hope. Neither scales, since reading every line gives up
most of the speed and trusting it gives up any claim to know what the
program does.

This book is about a third choice. I write down what a routine must do,
precisely enough that a machine can check it. A generator writes candidates
from that description alone. Deterministic tools judge each candidate
against it. A candidate replaces the existing code only when it passes every
check and the decision is recorded. The method calls that replacement a
landing. The description and the evidence are the parts I keep, and the code
itself becomes replaceable.

I call the method Origo, and I have applied it to four projects so far, each
of which I call a study:

- the first study rewrote the toolchain of a language for CP/M
- the second built assembly tools on top of the third study's operating system
- the third improved TEC-OS, an operating system held in ROM on the TEC-1G, a Z80 single-board computer
- the fourth is this book, written as a study

The studies use small machines on purpose. The routines measured so far run
from nine bytes to over 800. Each one's time can be counted exactly in
T-states, the clock cycles of the Z80. An emulator runs the whole system's
tests at every landing. Every claim can be checked against a figure, so the
method's mistakes show up as quickly as its successes.

## Readers

I wrote it for a working programmer who wants evidence about code
generators, as a user of them or someone weighing them up. You need to read
code comfortably, but no knowledge of the Z80 is assumed. The examples are
in Z80 assembly, and each one is explained as it appears. Some arithmetic on
cycle counts and byte counts runs through the book, and none of it goes
beyond a percentage.

## Results, good and bad

The method made a claim it could fail, and in places it did. The first study
regenerated small routines at high rates and large ones at none until their
interfaces were written down. Its largest gains came from structural changes
that were modelled first and then built through contracts. Its local
regeneration, routine by routine, gave smaller ones.

A study's work is divided into stages. Each is one planned piece of work
with its own record. The second study ran its first three stages without
generation (P2: T0 to T2). In the next it generated six candidates (P2: T3).
The round was meant to keep each generator's first attempt as a control, to
measure what the rest of the round adds. Those first files were not
archived, so the control is lost (P2: T3). After the candidates were scored
again, I decided that three of them land (P2: the fix round).

The third study generated no candidates at all and used the method's checks
to govern ordinary engineering. A review written after its warm-boot stage
lists the places where the method was not followed well
(P3: the method review). I include all of it, because a method that reports
only its successes gives you no reason to believe them.

## Two examples

The first is a round of regeneration on the first study's floating-point
routines. A generator writes each candidate from a bundle of the routine's
contract and some of its tests, with none of its code. Most of the round's
candidates passed every check, and the ones that landed made the routines
smaller. FMUL is the routine that multiplies two floating-point numbers, and
its worst case became about five times faster (P1: CDR-3). Chapter 2 opens
with FMUL's contract, and Part II follows the round from its bundles to its
landings.

The second is a stage from the third study. When a program ends, TEC-OS
returns to its command prompt through a warm boot. With the serial console a
warm boot took 3,866,040 T-states, almost a second at the board's 4 MHz
clock (P3: KB-6). In one stage the time was measured and a design was
modelled on the host before any Z80 was written.

The method now sets out a stage track for such work, nine steps from a
measured need to a review of the result (MD-8). Between them come a brief
and its review, a model, a gate and one build. The warm-boot stage ran
before the track was written, and it departed from it in four places. Its
gate was registered from the draft brief before the model existed. Its ROM
limit was raised after the first full build and the change was recorded as
delegated. Its design, its limit and its result took four decisions where
the track asks for one (P3: KD-69 to KD-72). No review of its brief or of
its result is recorded.

As built, a clean warm boot took 81,040 T-states with the serial console
(P3: KD-72). `SAVE` is the command that writes memory to a disk file. A warm
boot after it took 327,424 T-states with the serial console (P3: KD-72).
Part III describes that stage from its measured cost to its landing.

Part I covers the proposition, contracts and the checks that judge them.
Part II describes the loop of generation and judgement. Part III shows the
same checks governing work that is built once. Part IV describes a
specification language for contracts, part measured and part research. Part
V covers how a study is run: its records, its boundaries and its protocol.
Part VI reports what each of the first three studies found.

## Citations

Every figure in the book comes from the records, a study's or the method's
own. A study's records are cited with its number. In (P1: CDR-3), for
example, the record is the first study's first measured round of
regeneration. The method's own records are cited by their identifiers alone,
as (M1) for a rule or (MD-2) for a decision. The records are kept in the
Origo repository. Each stage of this book's study checks the chapters
against one named commit of it and records that commit. Where the book and
the records differ, the records are right.
