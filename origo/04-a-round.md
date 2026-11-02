---
title: "4. A round"
parent: "Delete the Implementation"
nav_order: 5
---

# 4. A round

F2U was 21 bytes long. It converts a floating-point value to an unsigned 32-bit
integer, and the two smoke candidates of chapters 2 and 3 got it wrong. In the
round that chapter 1 follows it received five more candidates (P1: CDR-3). All
five passed, and one of them replaced the body. This chapter takes that hole
through the twelve steps of the loop.

The round ran on 18 October 2026. I adopted the method's amendments on 26
October (MD-1), so the round lacks parts of the loop as it now stands. The table
gives each step and the record F2U has for it. Where F2U has none, I say so here
and take the example from the second study's round where it has one, under that
study's name.

| Step | What it does | F2U's record |
| --- | --- | --- |
| 1 | Choose a hole with a documented interface | F2U, a helper |
| 2 | Write the contract and check it against the body | The contract, checked before the round |
| 3 | Register the gates | None. The rule came later |
| 4 | Split the cases and score them against mutants | The split, with no mutation score |
| 5 | Bundle the contract and the visible cases | The rule of the bundle. F2U's own was not kept |
| 6 | Generate candidates and keep a control | Five candidates, with no control |
| 7 | Score each candidate, cheapest first | Five of five passed |
| 8 | Probe the candidates and triage each difference | One difference, under a don't-care line |
| 9 | Record the scoreboard, the control and the hazards | The scoreboard. No control, and no new hazard |
| 10 | Land a candidate | Landed with eleven others |
| 11 | Turn each gap into a conformance program | Two programs, from the smoke run's gaps |
| 12 | Have someone else review the report | None |

## The hole and its contract

The loop starts with a hole whose callers all reach it through a documented
interface. F2U is a helper, called by compiled programs under the calling
convention of chapter 2. This is its contract, from the contracts file at Origo
`1252390`.

> Example (P1: F2U's contract, contracts file at Origo 1252390)
>
> ```
> ; @blob F2U
> ; @does DEHL = the f32 in DEHL truncated toward zero as a u32; every negative value except -0 traps narrowing, -0.5 included, and so does 2^32 or more
> ; @contract in=DE,HL out=DE,HL clobbers=A,B,F preserves=IX,IY,C,AF',BC',DE',HL'
> ; @contract size<=27 stack=published cycles<=1250@fixture=f32-cases traps=TRAP_NAR@caller-site
> ; @cases include=-0.0,+0.0,4294967295,$4F7FFFFF,4294967296,$7F7FFFFF,$7FC00000,$7F800000,$FF800000,0.5,-0.5,2147483648
> ; @hazard a value outside u32 traps through TRAP_NAR
> ; @dontcare a subnormal operand, which Vea never produces
> ```

An f32 is the runtime's name for a value in IEEE single, and a u32 is an
unsigned 32-bit integer. Vea is the language of the first study. TRAP_NAR is the
trap for a narrowing, a value that does not fit its new type. Negative values
trap, so -0.5 traps though it would truncate to zero. Negative zero converts to
0. A `$` marks a number written in hexadecimal.

The candidates in the round saw one figure that differs from this text. The
cycle limit was 1,529, which is 125 percent of the incumbent's worst case of
1,223. It reads 1,250 now because a later rule resets the limit at each landing
and F2U was brought up to it, 125 percent of the landed body's worst case in
place of 1,000 (P1: CDR-3, CDR-6). The size limit of 27 is 125 percent of the
21-byte incumbent, rounded up.

Step 2 checks a contract against the incumbent before any candidate exists. The
incumbent passed all three of its case sets, its contract lines held and it
passed the system gate (P1: CDR-2).

## Gates

Step 3 is the first the round lacks. The contract's limits and the checks in the
scoring tool were in place before any candidate was written. No record gave
those gates the five parts of chapter 3, because that rule did not exist yet
(M3). Three changes were also made to the tools during the round, and three
faults in the prober were found and fixed (P1: CDR-3). Chapter 3 gives one of
those faults, the masks. A round today registers its gates before anything is
scored (MD-8).

## Cases

Step 4 splits the cases. F2U has 74 visible cases and 147 held out. Its 743
adversarial cases are all held out as well (P1: CDR-3). Negative zero, 0.5,
-0.5 and 2^32 are among the inputs its `@cases` line makes obligatory.

The step also requires a mutation score of at least 95 percent before the hole
is bundled (MD-3). F2U never had one, and neither did any other hole of the
first study (P1: round readings). Chapter 3 gives the earliest scores, from the
second study (P2: T3).

## The bundle

Step 5 writes the bundle, which is all a generator sees. It holds the contract
and the runtime's conventions. It adds the contracts of the hole's callees and
callers and the memory layouts it may name. The shared constants, its visible
cases and the syntax card complete it. A leak test refuses any bundle that holds
a line of the incumbent's body (P1: CDR-3).

F2U's own bundle from this round was not archived, so I can't show it. The
candidates' notes show what it gave them, including the limits and the budget
of FP_MAG, the routine F2U calls. FP_MAG truncates a value's magnitude to an
integer and sets the carry flag when it reaches 2^32. In the smoke run the
authors had to guess that much, and FP_MAG's `@does` line now says it
(P1: CDR-1, CDR-2).

## Five candidates

Step 6 generates the candidates. F2U received five, two from generator A and
three from generator B. Each was written in a fresh context from the bundle
alone. Its author had no assembler, no runtime source and no sight of another
candidate (P1: CDR-3). Each came with notes giving its approach and its
assumptions.

The notes show how little the authors could check. Those of the smallest
candidate count its worst path by hand at 1,519 T-states, using FP_MAG's limit
of 1,454. They also record an assumption, that FP_MAG sets the carry flag for
NaN and for infinity, which its contract left unstated.

The step also keeps each generator's first attempt, untriaged, as the control
(M1). The round kept none, and no round of the first study did (P1: round
readings). The second study's round meant to keep its control and did not
archive the files (P2: T3). So the question that chapter 1 raises, what the loop
adds over one careful attempt, has no direct answer for F2U.

## Scoring

Step 7 splices each candidate in as a variant of the runtime and scores it. All
five passed every check, and all five passed the system gate.

| Candidate | Generator | Bytes | Worst case | Mean |
| --- | --- | ---: | ---: | ---: |
| Incumbent | | 21 | 1,223 | 291 |
| `a0e898fe3680` | A | 17 | 1,211 | 279 |
| `712ae38705f5` | A | 18 | 1,211 | 278 |
| `4e359ce42f7e` | B | 21 | 1,206 | 273 |
| `fe1add656ca9` | B | 21 | 1,206 | 273 |
| `91a15d74dc3e` | B | 25 | 1,206 | 273 |

The worst case and the mean are in T-states, with the incumbent's FP_MAG under
every candidate. The stack figure was 4 bytes for all of them (P1: CDR-3).

The candidates passed the same checks and were not the same code. A candidate
can return zero for negative zero itself, or fall through to FP_MAG and let that
routine return it. Both are within the contract, which says nothing about how
the body works.

The first failure now ends the scoring, as chapter 1 says. That rule came after
this round (P1: CDR-6). In this round every check ran on every candidate that
assembled. So a candidate of another hole could fail most of its cases and still
pass the system gate (P1: CDR-3). The scoring tool now runs the probe of step 8
before the system gate, since the system gate costs the most (P1: CDR-6). The
loop's text still lists them the other way round.

## The prober and triage

Step 8 runs the prober over each passing candidate and the incumbent. For F2U it
compared 1,964 inputs, the 964 cases and 1,000 random values (P1: CDR-3). The
landed candidate gave no difference of any kind.

Three of the others differed only in which permitted registers they changed, on
negative zero. The contract allows that and the oracle had checked it, so those
are not counted (P1: CDR-3).

The fifth, `91a15d74dc3e`, differed once in behaviour. The input was a random
value with $806B in DE and $1ACE in HL. Its top byte holds the sign and the
exponent's upper seven bits, and bit 7 of the next byte is the exponent's lowest
bit. Here the exponent is zero and the mantissa is not, so the value is a
negative subnormal. The incumbent trapped. The candidate tested only the
exponent and returned 0, as it does for negative zero.

F2U's `@dontcare` line sets aside subnormal operands, because the language never
produces them. Triage put the difference under that line, so the contract stayed
as it was and no case was added (P1: CDR-3).

That is one of three outcomes of triage, and F2U shows only the first. Its
callee shows the second. Two candidates for FP_MAG each differed on 681 inputs,
in what DE and HL held when the carry flag was set on return. Triage added a
don't-care line for that (P1: CDR-3). The landed F2U reads neither register when
the carry is set, because it jumps to the trap.

The third outcome came from FP_UNPK, whose 273 differences became an obligatory
case and a tighter contract, as chapter 3 describes.

## The scoreboard

Step 9 records the results. The scoreboard is the table above, with the other
thirteen holes beside it. Each failure's cause goes into the hole's hazards, but
F2U had no failure, so its one hazard stayed as it was.

Step 9 also records the loop gain, which needs the control. Without it the first
study's records use a stand-in, the median candidate that passed, and they
compare size alone (P1: round readings). F2U's median is 21 bytes, the
incumbent's size, and the landed body is 4 bytes under it. Across the first
study the same reading gives a median of 3.7 percent, under the 5 percent floor
of noise (MD-2). I return to that figure in chapter 6.

## The landing

Step 10 lands a candidate. The rule as run required a pass at every gate, a
smaller body or a faster worst case and no difference in behaviour from the
incumbent. At most one candidate landed for each hole, the smallest and then the
fastest (P1: CDR-3). The don't-care release of chapter 1 came after the round,
so `91a15d74dc3e` was excluded, and at 25 bytes it was also the largest.
`a0e898fe3680`, the smallest, landed.

The incumbent and the landed body are short enough to read side by side. `LD`
copies a value, and `AND` and `OR` combine bits into A. `JR` and `JP` jump, the
first with a shorter reach, and `CALL` and `RET` go to a routine and back. A
condition such as `Z` or `NC` makes the instruction act only when the zero flag
or the carry flag is in that state. This is the incumbent.

> Example (P1: F2U's incumbent, runtime at Origo 570ec3d)
>
> ```
> F2U:    LD      A,D                ; Fetch the sign byte.
>         AND     $80                ; Is the value negative?
>         JR      Z,.POS             ; A positive value converts.
>         LD      A,D                ; Negative: only -0 converts; drop the sign,
>         AND     $7F                ; keeping the exponent bits.
>         OR      E                  ; Gather the second byte,
>         OR      H                  ; the third,
>         OR      L                  ; and the lowest: zero only for -0.
>         JP      NZ,TRAP_NAR        ; Any other negative value traps.
> .POS:   CALL    FP_MAG             ; DEHL is the magnitude; carry if 2^32 or more.
>         JP      C,TRAP_NAR         ; A magnitude of 2^32 or more traps.
>         RET                        ; DEHL is the u32.
> ```

This is the candidate that replaced it, with its comments shortened.

> Example (P1: F2U candidate a0e898fe3680, at Origo 1252390)
>
> ```
> F2U:
>         LD      A,D                ; Copy the sign and high exponent byte.
>         ADD     A,A                ; Move the sign into carry and drop it from A.
>         JR      NC,.POS            ; A positive value goes straight to conversion.
>         OR      E                  ; Merge in the second byte,
>         OR      H                  ; the third,
>         OR      L                  ; and the lowest: A is zero only for -0.
>         JP      NZ,TRAP_NAR        ; Any negative value other than -0 traps.
> .POS:   CALL    FP_MAG             ; Truncate the magnitude, carry at 2^32 or more.
>         RET     NC                 ; Return the u32 when it fits.
>         JP      TRAP_NAR           ; A magnitude of 2^32 or more traps.
> ```

The saving is in the sign test. `ADD A,A` doubles A, which moves the sign into
the carry flag and drops it from A with one instruction. The incumbent reloads A
and masks it twice to do the same. Those lines cost 8 bytes against 4, and that
is the whole gain in size.

Landing L4 put this body in place with eleven others, and F2U went from 21 bytes
to 17 (P1: CDR-3). In place its worst case fell from 1,223 T-states to 1,000 and
its mean from 291 to 237, and its stack stayed at 4 bytes. Only 12 of those 223
T-states are the new body's doing, as the table shows. FP_MAG landed in the same
batch and its worst case fell by 211, from 1,163 to 952. That is the rest of the
gain, and it needed no change to F2U. Every hole was then rescored in place and
the full system gate run again, and all of it passed (P1: CDR-3).

F2U has not changed since.

## The gap and the review

Step 11 turns a gap found at one hole into a conformance program, so that the
system gate carries it from then on (R21). This round found no gap at F2U. The
smoke run had found two, described in chapters 2 and 3, and a conformance
program of the method's own came from each (P1: CDR-2). One prints the results
of converting -0.0 and 0.0, and expects `0 0`. The other checks the site that a
narrowing trap reports. The system gate ran both on all five candidates, and
none of the five had trapped on negative zero. This round's I2F gap produced a
program of its own, described in chapter 3.

Step 12 has the round's report reviewed against the exact source it measured by
someone who did not build it, before the next round opens (M5). No such review
of this round is on record, and the next round opened the following day. The
second study's round shows what the step does. Two reviews followed its report.
Their corrections withdrew a sentence deferring the 95 percent floor. They also
withdrew a set of overlap figures, which measured the order of the cases and not
whether the generators fail independently (P2: T3). The three landings had been
made under delegation, and landing is a decision that the method keeps for me
(R61). They stayed as provisional bodies until I decided them (P2: the fix
round).

F2U is the kind of hole where the loop has little left to find. Its contract
carried the lessons of the smoke run, and all five candidates passed. Chapter 5
describes the large routines, where the candidates did not pass.
