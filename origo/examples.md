---
title: "Examples, notation and figures"
parent: "Delete the Implementation"
nav_order: 91
---

# Examples, notation and figures

Each recurring example has its own job. The floating-point round shows the
loop at work. The warm boot shows a stage built once. The bounded string
introduces precise conditions in the specification language.

## The floating-point round

Fourteen holes, five candidates each, 70 in all, written by two generators
from their bundles alone. 57 passed every gate at the first attempt and 12
landed. The twelve routines shrank from 1,217 bytes to 810, and FMUL's worst
case fell from 20,541 to 4,028 T-states (P1: CDR-3). Chapter 2 opens with
FMUL's contract, and chapter 4 uses another of the fourteen routines as its
worked round. The routine is chosen for its size, and its contract, bundle
and scoreboard are quoted from the round's records.

## The warm boot

With the serial console a warm boot took 3,866,040 T-states (P3: KB-6). The
BDOS is CP/M's disk operating system, and 99.6 percent of that time was its
function 13, the disk reset (P3: KB-6). The reset rebuilt drive A's
allocation map from the whole directory (P3: KS18). The stage kept each
drive's map across a warm boot when the drive was unchanged, and rebuilt it
only to the directory's high-water mark when it had been written. On the
same console a clean warm boot then took 81,040 T-states and read no disk
blocks (P3: KD-72). The stage ran before the stage track was written.
Chapter 7 uses it to show the track. It quotes the model's figures, the gate
with the five parts the method requires (M3) and the measurement. The
chapter also names each step where the stage departed from the track.

## The bounded string: experimental notation

This uses the first experimental fragment of the specification language
(P1: LR-01A):

```text
; @lr01a version 1
; @lr01a let old_length : u8 = byte(HL) in STR
; @lr01a let capacity : u8 = D
; @lr01a requires old_length <= capacity
```

HL holds the address of the old length byte and D holds the capacity. STR is
declared by the enclosing bundle, and the byte lies inside it. For an old
length of 5 and a capacity of 8 the condition holds. For 9 and 8 it is
false, and that call is outside the specified domain. The line requires no
check at run time. A runnable example needs the region binding, the entry
snapshot and a run of the evaluator beside the fragment.

The fragment's evaluator was checked on all 65,536 byte pairs for this
relation, each against truth computed separately (P1: LR-01A). The
fragment's generation trial could not show that the notation changed an
outcome (P1: LR-01A). The remaining prose and the visible cases still
revealed each condition. Chapter 11 states that limit wherever it uses the
example.

## Proposed notation

```text
define valid(s) = length(s) <= capacity(s)
```

```text
acquire -> hold output -> successful write -> release -> reuse
```

Both are illustrative spellings, and no tool parses them. The first replaces
a repeated condition with a shared meaning. The second is an event sketch
for a protocol experiment that is drafted but not run
(P1: the temporary-memory protocol). A contrasting trace reuses the buffer
before the write, and another writes and fails, which shows why an attempted
write is not evidence that the output is kept.

## Labels

Every example of notation carries one label:

- **Working:** parsed and evaluated by the current tools, with its expected results and at least one rejected input
- **Experimental:** defined and run in a recorded trial, with the trial's limits stated
- **Illustrative:** a spelling used to explain an idea, with no tool behind it

## Figures

| Figure | Reader's question | Content |
| --- | --- | --- |
| Generation and acceptance | Where is the implementation free? | The contract, several candidates, the checks and the feedback |
| The deletion radius | How much can be regenerated? | Holes attempted, holes with a passing candidate |
| Gates in order | What judges a candidate first? | Each gate, its cost and what ends the scoring |
| The stage track | What must exist before each step? | The nine steps and their entry conditions |
| Logical values and storage | Why do registers appear in a contract? | A condition above its register and memory bindings |
| Warm boot time | Where did the time go? | The cost before and after, by part |
| Handover | What survives replacing a program? | Three memory maps with the same kept data |

A figure introduces one relationship at a time. A memory drawing names its
build and uses that build's addresses. A proposed structure carries a design
label.

## Evidence before writing

- A notation example is run through its parser and evaluator before the prose around it is written
- A figure is checked against the same example
- A case study quotes its frozen report and says how much it measured
- Proof over all paths, checks on recorded runs and assumptions are kept apart
