---
title: "2. Contracts"
parent: "Delete the Implementation"
nav_order: 3
---

# 2. Contracts

FMUL is the floating-point multiply of the runtime in the round that
chapter 1 follows (P1: CDR-3). Its contract is its entry in the runtime's
contracts file, and it is nine lines long. I quote it below from the records
at Origo `7c48de8`, exactly as the file has it.

> Example (P1: FMUL's contract, contracts file at Origo 7c48de8)
>
> ```
> ; @blob FMUL
> ; @does DEHL = DEHL * DE'HL' in IEEE single, rounded to nearest, ties to even, at subnormal precision for tiny results, and then any result below the smallest normal flushes to zero; an overflow traps
> ; @contract in=DE,HL,DE',HL' out=DE,HL clobbers=A,BC,BC',IY,F preserves=IX,AF',DE',HL'
> ; @contract writes=FP_VAR
> ; @contract size<=349 stack=published cycles<=4655@fixture=f32-cases traps=TRAP_FOV@caller-site
> ; @cases include=-0.0:1.0,0.0:-1.0
> ; @hazard overflow traps through TRAP_FOV
> ; @dontcare the values left in FP_VAR
> ; @dontcare operands with exponent 255 (infinity and NaN patterns) or subnormal operands, neither of which Vea produces
> ```

Each line starts with the assembler's comment character. The contracts are
kept in a sidecar, a file kept apart from the runtime's source. A tool
merges each routine's lines in after its `@blob` line whenever they are
used. To the runtime's builder the lines are comments, so a source with its
contracts builds the same runtime (P1: CDR-1).

Reading the lines takes a little of the Z80. Its registers hold 8 bits each and
are named by letters. Pairs of them, such as DE and HL, hold 16 bits. Written
together, DEHL is one 32-bit value held in two pairs. The Z80 also has a second
set of these registers, called the shadow registers and written with a prime. So
DE'HL' is a second 32-bit value. IX and IY are two 16-bit index registers, used
to address memory. F holds the flags, single bits that record facts about the
last result. One of them is the carry flag, which an addition sets when it
carries out of the top bit.

The stack is memory the Z80 uses for return addresses and saved registers. A
call pushes a return address, the address of the instruction after the call. A
return pops it, and a jump pushes nothing.

Two things in the lines belong to the runtime, not the Z80. A trap is a routine
of the runtime that reports an error and ends the program. The runtime's
floating-point routines work on numbers in IEEE single, the standard 32-bit
format for floating-point numbers. IEEE single has two zeros, and a single bit,
the sign, tells them apart.

## The contract line by line

The table takes the contract one kind of line at a time. For each it gives
what the line states for FMUL and what a candidate is checked against.

| Line | What it states for FMUL | What a candidate is checked against |
| --- | --- | --- |
| What it computes, `@does` | The product of DEHL and DE'HL' in IEEE single, with its rounding and its overflow | The expected products in its cases |
| Registers in and out, `in=` and `out=` | Operands in DE, HL, DE' and HL', the product in DE and HL | The product read from DE and HL after each case |
| What it changes and keeps, `clobbers=` and `preserves=` | It may change A, BC, BC', IY and the flags. It keeps IX, AF', DE' and HL' | Every other register must hold its value on return |
| Memory read and written, `writes=` | It may write FP_VAR, working memory it shares with other routines | No write outside FP_VAR and its own stack |
| Size, `size<=` | At most 349 bytes | The size of the assembled body |
| Stack, `stack=` | Stack use no larger than the figures its bundle gives | The stack measured over its cases |
| Cycles, `cycles<=` | At most 4,655 T-states for any recorded case that returns | Its slowest case that returns, counting the routines it calls |
| The trap, `traps=` | TRAP_FOV, the trap for an overflow, reporting the call into FMUL as its site | The site reported each time a case traps |
| Obligatory cases, `@cases include=` | Two products of a zero with a sign | Nothing in the candidate. The hole's own cases must hold them |
| Hazards and don't-care, `@hazard` and `@dontcare` | Overflow traps through TRAP_FOV. Some values and some operands are left open | Nothing. The bundle carries the hazard, and the don't-care lines release the differences they name |

Each kind of line has a reason, and most have a record. The sections below
take them in the table's order. The study records its regeneration work in
numbered reports. The first two built and tested the tooling that the round
used.

## The routine's result

The `@does` line says what FMUL computes, a product in IEEE single. A value in that format has a sign bit, an 8-bit exponent and a 23-bit fraction called
the mantissa. The smallest normal is the smallest value that keeps the format's
full precision. Below it lie the subnormal values, which lose precision as they
shrink. An exponent of 255 is kept for infinity and for NaN, short for "not a
number".

FMUL rounds to nearest, with ties to even. That picks the closer of the two
values the format can hold, and the even one when they are equally close.
For a tiny result FMUL rounds at subnormal precision first. It then flushes any result below the smallest normal to zero, and an overflow
traps.

The line itself came from a gap the first report found. F2U converts a
floating-point value to an unsigned integer. Its bundle gave the registers and
limits of a callee, a routine F2U calls, but not what the callee computed
(P1: CDR-1). The second report added a `@does` line to every contracted routine
(P1: CDR-2).

FMUL's rounding came from a disagreement. Some of the adversarial cases are
chosen at the edges of each type, such as zeros, powers of two and the smallest
normal. Six of them, for FMUL, had a product that lay below the smallest normal
by half the gap between two neighbouring subnormal values (P1: CDR-2). The
incumbent flushed each to zero. The language's tests work out expected results
with code of their own, and that code rounded each up to the smallest normal.
The incumbent compared a result with the smallest normal before rounding to
subnormal precision, and that code compared it after.

Both of the language's compilers, the reference and the native, also gave the
smallest normal when they worked out such a product at compile time.
That code and the two compilers agreed against the incumbent, so the contract followed them and the incumbent's result became the defect
(P1: CDR-2, O11). The rule is
that the incumbent's answers are evidence, not the authority (R10). The fix was
a 26-byte change to FP_PACK, the internal routine through which FMUL rounds and
packs its result. It differs from the old body on exactly the six edge cases, in
FP_PACK and in FMUL (P1: CDR-2).

## Registers in and out

FMUL takes its operands in DEHL and DE'HL'. It returns the product in DE and HL.
SP is the stack pointer, the register that marks the top of the stack. The
runtime's calling convention is its rule for what a call may change. It lets
every helper, a routine of the runtime that compiled programs call, destroy
every register except IX and SP (P1: CDR-1). A caller that relies on any other
register needs a contract to say so.

## Registers changed and kept

FMUL may change A, BC, BC', IY and the flags. It keeps IX, AF', DE' and HL'.
Every register outside the ones it may change or return must hold its value on
return, and that is checked on every case.

The first contracts took these lists from each routine's header comments. Those
are its In, Out, Clobbers and Memory lines (P1: CDR-1). Run on the runtime
before any candidate had landed in it, the checks disagreed with them in three
places. One routine, FCMP, which compares two floating-point values, also
changes the shadow D register. Two others, I2F and U2F, convert an integer to floating point and write FP_VAR,
and their comments leave it out. None of the
three is FMUL. The contracts now state what the code does as the checks measure
it. The rule behind this is the subject of the chapter's last section.

## Memory written

The line `writes=FP_VAR` names the only memory FMUL may write besides its own
stack. FP_VAR is a scratch region, 24 bytes of working memory shared by the
floating-point routines. It holds two mantissas, two exponents, three signs, the
result's exponent and a work area.

Among the floating-point routines, FMUL was the first choice for the tooling's
smoke run, a trial of the tools on a few routines. Its bundle could not be
completed (P1: CDR-1). FP_VAR's layout was written in the opening comment of the
runtime's floating-point source. That comment belongs to no routine, so no
bundle carried it.

The second report declared each region's layout once for each set of holes.
Every bundle that reads or writes the region now shows it. FMUL's bundle
then carried FP_VAR's layout (P1: CDR-2). A region that several routines
depend on is a contract even when no routine owns it (R6).

## The size limit

The line `size<=349` limits FMUL's body to 349 bytes. The pinned body is the
incumbent as it stood before any candidate replaced it. The first contracts set
every size limit at 125 percent of the pinned body's size
(P1: the contracts file's header at Origo 7c48de8). FMUL's was 279 bytes, which
gave its limit of 349. The limit dates from those first contracts, before the
round. The landing tool puts a candidate into the runtime. It resets cycle limits
only, so the size limit has stood since then (P1: CDR-6). Landings are numbered in order, and FMUL's body has been 118
bytes since landing L9, about a third of its limit (P1: L9).

## The stack figure

A routine's stack figures are the bytes of stack it was measured to use, and its
bundle gives them. The line `stack=published` says that FMUL's stack use must
not grow beyond them.

The line's history comes from another routine, F2U. In the smoke run, two
candidates for F2U called a trap where the incumbent jumped to it (P1: CDR-1).
The call pushed a return address that the jump did not. The trap then reported a
site inside F2U instead of the program's call. The ending stack grew from 36
bytes to 38.

The checks then tested only that a case that traps ended the program. Only the
stack figure caught the change. Those two candidates were smoke tests written to
exercise the tooling, not results (P1: CDR-1). A budget for size, stack or time
can show a change of behaviour that no case shows. So every contract keeps its
budgets (R8).

## The cycle limit

The line `cycles<=4655@fixture=f32-cases` limits FMUL's slowest case. A
fixture is a named table of recorded cases. This one is shared by the
runtime's floating-point holes. The line bounds the worst single case of
that fixture that returns, with the T-states of any routine FMUL calls
included.

The first contracts set each cycle limit at 125 percent of the pinned body's
worst case (P1: the contracts file's header at Origo 7c48de8). Later the limits
began to follow landings. The landing tool resets a hole's cycle limit each time a body lands there
(P1: CDR-6). The new limit is 125 percent of the new
incumbent's worst case over all three sets of its cases.

FMUL's limit of 4,655 T-states comes from such a reset after the round. Landing
L7 gave FMUL a new body. That body made an application that uses floating point
throughout 3.66 percent slower (P1: CDR-6). Landing L9 returned FMUL to the body
it had from landing L6. Its worst case went from 8,809 T-states to 3,724, and
its limit from 11,012 to 4,655 (P1: L9).

A candidate is judged by the contract in force at that moment (R9), so one
written under an old limit is judged against the new one. The sidecar's lines
replace any in a candidate's own files whenever the candidate is checked or
scored.

A cycle limit on recorded cases can also imply a bound on the size of an input.
FMUL's operands are always 32 bits, so its limit implies none. A routine that
searches a table shows the difference. A binary search halves the table at each
step, and a linear scan reads the entries in turn. That routine's ten candidates
replaced its binary search with a linear scan (P1: CDR-8). Each was faster on
average, and each had a worst case over the budget. Nothing in the contract said
how long the table can be. With the table's length in the contract, all five
candidates of the next round kept a binary search and passed (P1: CDR-9). A
contract states the bound on input size that its budget implies (R7).

## The trap and its site

The line `traps=TRAP_FOV@caller-site` names the trap that may end the program
and the site it must report. The caller site is the return address of the call into FMUL. It points back into the
program that called the routine. The checks record the site reported each time a
case traps and compare it with the line.

The notation came from the same smoke run. Its report proposed the notation in place of a free-text hazard, because the
checks can test it against the site a trap gives (P1: CDR-1). The second report adopted it (P1: CDR-2). What else those two
candidates got wrong belongs to chapter 3.

## Obligatory cases

A hole's case table is its set of recorded inputs with their expected results.
The line `@cases include=` lists inputs the table must contain. The contract
checker, which runs before any case, fails a hole whose cases lack one. FMUL's
are two products of a signed zero, -0.0 by 1.0 and 0.0 by -1.0. No record gives
the reason for FMUL's two. The rule behind the line is that a contract names its
obligatory inputs (R3). An edge input then stays in the table by rule and not by luck.

## The hazard and the don't-care lines

FMUL's one hazard is that an overflow traps through TRAP_FOV to end the program.
No record gives its reason. A regenerated routine does not inherit the record of
what went wrong with the old one. So each hole keeps a list of hazards, filled
from failed candidates (R11). The syntax card is a page given with every bundle,
stating which Z80 instruction forms exist. Once it stated the forms, seven
hazards about instruction forms left the contracts of five floating-point
routines, FMUL among them (P1: CDR-6). Every remaining hazard concerns a hole's
own interface. Lessons about the instruction set concern no one hole, so they
belong in the syntax card (R42).

The first `@dontcare` line covers the values left in FP_VAR, and no record
gives its reason. The second sets aside two
kinds of operand. One has exponent 255, the pattern of infinity and NaN. The
other is subnormal, and the language never produces either. FADD, the
floating-point add, has the same line in its contract. A candidate for FADD
differed from the incumbent on ten inputs with a NaN operand, and every
difference fell under FADD's line (P1: CDR-3).

The adversarial cases found the helpers
treating subnormal operands inconsistently. The decision that the language's
floating-point values are never subnormal put those operands outside every
floating-point helper's contract (P1: CDR-2, O10). A contract names the inputs
it does not cover, and none of its cases lies there (R2).

## Declared incompleteness and don't-care

What a contract leaves open is part of it. A contract with an unstated
omission is a bug. One that says what it leaves open is complete in its
guarantees and deliberately open in method (R4). No candidate is checked
against what a don't-care line leaves open. Triage and the landing rule use
the line to release the differences it names.

FMUL's two lines show both kinds of opening. The line on FP_VAR leaves an
output open. The line on operands states the routine's domain, the inputs
it covers. Each open output is stated as a `@dontcare` line, not as prose
such as "undefined" (R5).

Two internal routines, FP_PACK and FP_MAG, called DEHL undefined in prose when
the carry flag is set on return. The prober found differences there that prose
could not settle by rule (P1: CDR-3). Triage settled them by adding a don't-care
line to both contracts.

## Comments are not contracts

A contract's lines are comments to the builder, but they are not the routine's
own comments. Those describe the routine in its header. The first contracts were taken from the headers, and the checks found three of
them wrong, as the section on registers changed and kept describes. A header
that says what a routine keeps is a claim to be checked, and it is often stale.

Contracts are derived from the code and from what the checks measure, and the
comments are corrected to match (R1). In every bundle a callee's contract
outranks its header. The standing check, a nightly run of the checks on every
incumbent, compares each routine's header with the registers that change during its
cases. It reports a header that leaves one out.

A contract is only as good as the checks that judge it. Chapter 3 describes
those checks, the oracles and the gates.
