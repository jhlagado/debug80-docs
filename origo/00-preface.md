---
title: "Preface"
parent: "Delete the Implementation"
nav_order: 1
---

# Preface

Code generators now write code faster than anyone can read it. A programmer
who uses one has a choice to make about every routine it writes. They can
read the code and take responsibility for it line by line, or they can trust
it and hope. Neither choice scales. Reading every line gives up most of the
speed, and trusting it gives up any claim to know what the program does.

This book is about a third choice. I write down what a routine must do,
precisely enough that a machine can check it. A generator writes candidates
from that description alone. Deterministic tools judge each candidate, and a
candidate replaces the existing code only when it passes every check and the
decision is recorded. The description and the evidence are the parts I keep.
The code itself becomes replaceable.

I call the method Origo. It has been applied to three projects so far, and I
call each one a study:

- the first study rewrote the toolchain of a language for CP/M;
- the second built assembly tools on top of the third study's operating
  system;
- the third improved TEC-OS, an operating system held in ROM on the TEC-1G,
  a Z80 single-board computer.

The studies are small machines on purpose. A Z80 routine has a few hundred
bytes and a cycle count that can be measured exactly. An emulator runs the
whole system's tests on every change. Every claim can be checked against a
figure, so the method's mistakes show up as quickly as its successes.

## Readers

I wrote it for a working programmer who uses code generators or is thinking
about them and wants evidence. You need to read code comfortably. The
examples are in Z80 assembly, and each one is explained as it appears, so
you don't need to know the Z80 beforehand. Some arithmetic on cycle counts
and byte counts runs through the book, and none of it goes beyond a
percentage.

## Results, good and bad

The method made a claim it could fail, and in places it did. The first study
regenerated small routines at high rates and large ones at none until their
interfaces were written down. Its largest gains came from design changes
built once, not from generation. The second and third studies generated no
candidates at all. They used the method's checks to govern ordinary
engineering, and the third ended with a list of places where the method was
not followed. I report all of it. A method that only reports its successes
gives you no reason to believe them.

## Two examples

The first is a round of regeneration from the first study. Fourteen
floating-point routines each received five candidates, and twelve candidates
landed in place of the existing code. FMUL's worst case fell from 20,541 to
4,028 T-states (P1: CDR-3). Part II describes that round from its contracts
to its landings.

The second is a stage from the third study. When a program ends, TEC-OS
returns to its command prompt through a warm boot. A warm boot took
3,866,040 T-states, almost a second at the board's 4 MHz clock. In one stage
the time was measured and a design was modelled on the host before any Z80
was written. The figures the change had to meet were registered, and the
change was built once. Afterwards a warm boot took 81,040 T-states (P3:
KS18). Part III describes that stage from its measured cost to its landing.

Parts I and II build the method's idea of a contract and the checks that
judge it. Part III shows the same checks governing work that is built once.
Part IV describes the language for writing contracts that the method is
developing. Part V covers what a study keeps: its records, its authority
and its boundaries. Part VI reports what each study found.

## Citations

Every figure in the book comes from a study's records. A citation in
parentheses names the study and the record, as in (P1: CDR-3), the first
study's third round of regeneration. The records are kept in the Origo
repository at the commits each chapter was checked against. Where the book
and the records differ, the records are right and the book is wrong.
